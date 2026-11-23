import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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

afterAll(() => {
  if (existsSync(OUT_ASSET)) {
    try {
      chmodSync(OUT_ASSET, 0o755);
    } catch {
      // Cleanup still checks the real output root before removal.
    }
  }
  removeOutputSafely();
  if (fixtureOwned) rmSync(FIXTURE, { force: true });
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe('flat output removal containment', () => {
  it('preserves targets for a flat symlink and an output-directory symlink', { timeout: 600_000 }, () => {
    expect(existsSync(FIXTURE)).toBe(false);
    expect(existsSync(OUT_ASSET)).toBe(false);
    createFixture();

    const flatTarget = tempDir('flat-link-target');
    const flatMarker = join(flatTarget, 'marker.txt');
    writeFileSync(flatMarker, 'keep-flat-target\n', { flag: 'wx' });
    mkdirSync(OUT_ASSET);
    symlinkSync(flatTarget, join(OUT_ASSET, 'flat'), 'dir');

    const flatRun = runForge();
    expect(flatRun.status, flatRun.stderr || flatRun.stdout).toBe(0);
    expect(readFileSync(flatMarker, 'utf8')).toBe('keep-flat-target\n');

    removeOutputSafely();
    const outputTarget = tempDir('output-link-target');
    const outputFlat = join(outputTarget, 'flat');
    const outputMarker = join(outputFlat, 'marker.txt');
    mkdirSync(outputFlat);
    writeFileSync(outputMarker, 'keep-output-target\n', { flag: 'wx' });
    symlinkSync(outputTarget, OUT_ASSET, 'dir');

    const outputRun = runForge();
    expect(outputRun.status, outputRun.stderr || outputRun.stdout).toBe(0);
    expect(readFileSync(outputMarker, 'utf8')).toBe('keep-output-target\n');
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
