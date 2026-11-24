import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
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
const ASSET_NAME = `_flat-symlink-adversarial-${process.pid}`;
const FIXTURE = join(ROOT, 'assets', `${ASSET_NAME}.ts`);
const OUT_ROOT = join(ROOT, 'out');
const OUT_ASSET = join(OUT_ROOT, ASSET_NAME);
const OTHER_NAME = `${ASSET_NAME}-other`;
const OTHER_OUT = join(OUT_ROOT, OTHER_NAME);

let fixtureOwned = false;
const tempDirs: string[] = [];

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

function runForge(): SpawnSyncReturns<string> {
  return spawnSync(
    'bash',
    [HEAVY_RUN, '-c', `./forge render ${ASSET_NAME} --fast --flat --bg none --views front-level --size 64`],
    {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 600_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
    },
  );
}

function tempDir(label: string): string {
  const dir = mkdtempSync(join(RUNS_DIR, `${label}-${process.pid}-`));
  tempDirs.push(dir);
  return dir;
}

function removeOutputSafely(): void {
  const st = lstatSync(OUT_ASSET, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isSymbolicLink()) {
    rmSync(OUT_ASSET);
    return;
  }
  if (!st.isDirectory()) return;
  const real = realpathSync(OUT_ASSET);
  if (dirname(real) !== realpathSync(OUT_ROOT) || basename(real) !== ASSET_NAME) return;
  rmSync(real, { recursive: true, force: true });
}

function removeOtherOutputSafely(): void {
  const st = lstatSync(OTHER_OUT, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isSymbolicLink()) {
    rmSync(OTHER_OUT);
    return;
  }
  if (!st.isDirectory()) return;
  const real = realpathSync(OTHER_OUT);
  if (dirname(real) !== realpathSync(OUT_ROOT) || basename(real) !== OTHER_NAME) return;
  rmSync(real, { recursive: true, force: true });
}

function nonEmptyLines(output: string): string[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function snapshotContents(dir: string): string[] {
  const found: string[] = [];
  const walk = (base: string, rel = ''): void => {
    for (const entry of readdirSync(join(base, rel), { withFileTypes: true })) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(base, path);
      else found.push(`${path}:${readFileSync(join(base, path)).toString('base64')}`);
    }
  };
  walk(dir);
  return found.sort();
}

afterAll(() => {
  if (existsSync(OUT_ASSET)) {
    try {
      chmodSync(OUT_ASSET, 0o755);
    } catch {
      // Cleanup still checks the real output root before removal.
    }
  }
  removeOutputSafely();
  removeOtherOutputSafely();
  if (fixtureOwned) rmSync(FIXTURE, { force: true });
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe('flat output removal containment', () => {
  it('refuses linked flat and output folders without changing their targets', { timeout: 600_000 }, () => {
    expect(existsSync(FIXTURE)).toBe(false);
    expect(existsSync(OUT_ASSET)).toBe(false);
    createFixture();

    const flatTarget = tempDir('flat-link-target');
    const flatMarker = join(flatTarget, 'marker.txt');
    writeFileSync(flatMarker, 'keep-flat-target\n', { flag: 'wx' });
    mkdirSync(OUT_ASSET);
    symlinkSync(flatTarget, join(OUT_ASSET, 'flat'), 'dir');

    const flatRun = runForge();
    expect(flatRun.status).not.toBe(0);
    const flatLines = nonEmptyLines(`${flatRun.stdout || ''}\n${flatRun.stderr || ''}`);
    expect(flatLines).toHaveLength(1);
    expect(flatLines[0]).toContain('output folder is a link');
    expect(readFileSync(flatMarker, 'utf8')).toBe('keep-flat-target\n');
    expect(existsSync(join(flatTarget, 'front-level.png'))).toBe(false);

    removeOutputSafely();
    mkdirSync(OTHER_OUT);
    const outputFlat = join(OTHER_OUT, 'flat');
    const outputMarker = join(outputFlat, 'marker.txt');
    mkdirSync(outputFlat);
    writeFileSync(outputMarker, 'keep-output-target\n', { flag: 'wx' });
    const existingPng = join(outputFlat, 'existing.png');
    writeFileSync(existingPng, Buffer.from('existing-flat-render'), { flag: 'wx' });
    const otherBefore = snapshotContents(OTHER_OUT);
    symlinkSync(OTHER_OUT, OUT_ASSET, 'dir');

    const outputRun = runForge();
    expect(outputRun.status).not.toBe(0);
    const outputLines = nonEmptyLines(`${outputRun.stdout || ''}\n${outputRun.stderr || ''}`);
    expect(outputLines).toHaveLength(1);
    expect(outputLines[0]).toContain('output folder is a link');
    expect(readFileSync(outputMarker, 'utf8')).toBe('keep-output-target\n');
    expect(snapshotContents(OTHER_OUT)).toEqual(otherBefore);
  });

  it('does not remove a flat directory through a read-only asset parent', { timeout: 600_000 }, () => {
    removeOutputSafely();
    if (!fixtureOwned) createFixture();
    mkdirSync(join(OUT_ASSET, 'flat'), { recursive: true });
    const marker = join(OUT_ASSET, 'flat', 'marker.txt');
    writeFileSync(marker, 'keep-read-only-parent\n', { flag: 'wx' });
    chmodSync(OUT_ASSET, 0o555);

    const result = runForge();
    expect(result.status).not.toBe(0);
    expect(readFileSync(marker, 'utf8')).toBe('keep-read-only-parent\n');
  });
});
