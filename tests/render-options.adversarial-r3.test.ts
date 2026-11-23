import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEAVY_RUN =
  process.env.HEAVY_RUN_PATH ?? resolve(ROOT, '..', '..', 'advantage-pr', 'scripts', 'jobs', 'heavy-run.sh');
const RUNS_DIR = join(ROOT, 'measure', 'runs', 'chibi_sprouts_redesign_20261123');
const ASSET_NAME = `_flat-symlink-race-${process.pid}`;
const FIXTURE = join(ROOT, 'assets', `${ASSET_NAME}.ts`);
const OUT_ROOT = join(ROOT, 'out');
const OUT_ASSET = join(OUT_ROOT, ASSET_NAME);
const MOVED_OUT = join(OUT_ROOT, `${ASSET_NAME}-checked`);

let fixtureOwned = false;
let targetDir = '';

function createFixture(): void {
  writeFileSync(
    FIXTURE,
    `import { defineAsset, sdf } from '../src/index.js';

export default defineAsset({
  name: '${ASSET_NAME}',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.4, 1, 0.2]).at(0, 0.5, 0), { color: '#3f8fd0' });
  },
});
`,
    { flag: 'wx' },
  );
  fixtureOwned = true;
}

function removeOutputSafely(path: string): void {
  const st = lstatSync(path, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isSymbolicLink()) {
    rmSync(path);
    return;
  }
  if (!st.isDirectory()) return;
  const real = realpathSync(path);
  if (dirname(real) !== realpathSync(OUT_ROOT)) return;
  rmSync(real, { recursive: true, force: true });
}

function cleanup(): void {
  removeOutputSafely(OUT_ASSET);
  removeOutputSafely(MOVED_OUT);
  if (fixtureOwned) rmSync(FIXTURE, { force: true });
  if (targetDir) rmSync(targetDir, { recursive: true, force: true });
}

afterAll(cleanup);

function renderWithOutputSwap(): Promise<{ status: number | null; output: string; swapped: boolean }> {
  const command = `cd '${ROOT}' && ./forge render ${ASSET_NAME} --fast --flat --bg none --views front-level --size 64`;
  const child: ChildProcessWithoutNullStreams = spawn('bash', [HEAVY_RUN, '-c', command], {
    cwd: ROOT,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500', FORGE_DEBUG: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let swapped = false;
  let swapError: Error | undefined;
  const onData = (chunk: Buffer): void => {
    output += chunk.toString();
    if (!swapped && output.includes('vite server created')) {
      try {
        renameSync(OUT_ASSET, MOVED_OUT);
        symlinkSync(targetDir, OUT_ASSET, 'dir');
        swapped = true;
      } catch (error) {
        swapError = error as Error;
        child.kill('SIGTERM');
      }
    }
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  return new Promise((resolvePromise, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Forge did not exit after output-folder swap; pid ${child.pid}`));
    }, 600_000);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timeout);
      if (swapError) {
        reject(swapError);
        return;
      }
      resolvePromise({ status: code, output, swapped });
    });
  });
}

describe('flat output link race', () => {
  it('refuses a linked output swapped in after the preflight check', { timeout: 600_000 }, async () => {
    expect(existsSync(FIXTURE)).toBe(false);
    expect(existsSync(OUT_ASSET)).toBe(false);
    expect(existsSync(MOVED_OUT)).toBe(false);
    createFixture();
    targetDir = mkdtempSync(join(RUNS_DIR, `flat-symlink-race-target-${process.pid}-`));
    mkdirSync(join(targetDir, 'flat'));
    writeFileSync(join(targetDir, 'flat', 'marker.txt'), 'keep-race-target\n', { flag: 'wx' });
    mkdirSync(join(OUT_ASSET, 'flat'), { recursive: true });
    writeFileSync(join(OUT_ASSET, 'flat', 'marker.txt'), 'keep-original-output\n', { flag: 'wx' });
    const result = await renderWithOutputSwap();
    const ordinaryLines = result.output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !/^\[\d+ ms\]/.test(line));
    expect(result.status).not.toBe(0);
    expect(ordinaryLines).toHaveLength(1);
    expect(ordinaryLines[0]).toContain('output folder is a link');
    expect(readFileSync(join(targetDir, 'flat', 'marker.txt'), 'utf8')).toBe('keep-race-target\n');
    expect(existsSync(join(targetDir, 'flat', 'front-level.png'))).toBe(false);
    const originalOutput = result.swapped ? MOVED_OUT : OUT_ASSET;
    expect(readFileSync(join(originalOutput, 'flat', 'marker.txt'), 'utf8')).toBe('keep-original-output\n');
  });
});
