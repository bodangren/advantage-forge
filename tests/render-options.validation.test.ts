import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, afterAll } from 'vitest';
import { createHash } from 'node:crypto';

// The checkout under test comes from this module, never from a hard-coded path.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEAVY_RUN =
  process.env.HEAVY_RUN_PATH ?? resolve(ROOT, '..', '..', 'advantage-pr', 'scripts', 'jobs', 'heavy-run.sh');
const PID = process.pid;
const RUNS_DIR = join(ROOT, 'measure', 'runs', 'chibi_sprouts_redesign_20261123');

const VPIN = `_flat-render-validation-${PID}`;
const VFIXTURE = join(ROOT, 'assets', `${VPIN}.ts`);
const VOUT = join(ROOT, 'out', VPIN);

const PROBE_DIR = join(RUNS_DIR, `probe-${PID}`);
const MARKER = join(PROBE_DIR, 'marker.txt');
const ESCAPE_TS = join(PROBE_DIR, 'probe-escape-asset.ts');
const ESCAPE_OUT = join(PROBE_DIR, 'probe-escape-asset');
const ESCAPE_NAME = `../measure/runs/chibi_sprouts_redesign_20261123/probe-${PID}/probe-escape-asset`;

function pinSource(): string {
  return `import { defineAsset, sdf } from '../src/index.js';

export default defineAsset({
  name: '${VPIN}',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.4, 1.0, 0.2]).at(0, 0.5, 0), { color: '#3f8fd0' });
  },
});
`;
}

function escapeSource(): string {
  return `import { defineAsset, sdf } from '../../../../src/index.js';

export default defineAsset({
  name: 'probe-escape-asset',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.4, 1.0, 0.2]).at(0, 0.5, 0), { color: '#3f8fd0' });
  },
});
`;
}

let created = false;

function runForge(args: string): SpawnSyncReturns<string> {
  return spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${args}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
}

function removeOutDir(outDir: string, prefix: string): void {
  const st = lstatSync(outDir, { throwIfNoEntry: false });
  if (!st || !st.isDirectory()) return;
  const real = realpathSync(outDir);
  const outRoot = realpathSync(join(ROOT, 'out'));
  if (dirname(real) !== outRoot) return;
  if (!basename(real).startsWith(prefix)) return;
  rmSync(real, { recursive: true, force: true });
}

function snapshotFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (base: string, rel: string): void => {
    for (const entry of readdirSync(join(base, rel), { withFileTypes: true })) {
      const relPath = rel === '' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(base, relPath);
      else found.push(relPath);
    }
  };
  walk(dir, '');
  return found.sort();
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

afterAll(() => {
  if (created) {
    rmSync(VFIXTURE, { force: true });
    created = false;
  }
  removeOutDir(VOUT, '_flat-render-validation-');
});

describe('render validation (unknown view, asset-name validation)', () => {
  it('rejects an unknown render view before the build with one error line', { timeout: 600_000 }, () => {
    expect(existsSync(VFIXTURE)).toBe(false);
    expect(existsSync(VOUT)).toBe(false);
    try {
      writeFileSync(VFIXTURE, pinSource(), { flag: 'wx' });
    } catch (error) {
      const e = error as NodeJS.ErrnoException;
      if (e.code === 'EEXIST') throw new Error(`fixture path exists: ${VFIXTURE}`);
      throw error;
    }
    created = true;
    const result = runForge(`render ${VPIN} --fast --views nosuch --size 64 --bg none`);
    const problems: string[] = [];
    if (result.status === 0) problems.push('exit 0 for unknown view nosuch');
    const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
    const lines = combined
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length !== 1) problems.push(`expected 1 error line, got ${lines.length}`);
    else {
      if (!lines[0]!.includes('Unknown view')) problems.push(`error line names no view: ${lines[0]}`);
      if (!lines[0]!.includes('Known')) problems.push(`error line lists no known views: ${lines[0]}`);
    }
    if (/^\s*at\s/m.test(combined)) problems.push('stack trace frames present');
    if (existsSync(VOUT)) problems.push(`build outputs appeared: ${snapshotFiles(VOUT).join(', ')}`);
    expect(problems).toEqual([]);
    rmSync(VFIXTURE, { force: true });
    created = false;
    removeOutDir(VOUT, '_flat-render-validation-');
    expect(existsSync(VFIXTURE)).toBe(false);
    expect(existsSync(VOUT)).toBe(false);
  });

  it('rejects an asset name with a path separator before any path is computed', { timeout: 600_000 }, () => {
    expect(existsSync(PROBE_DIR)).toBe(false);
    try {
      mkdirSync(PROBE_DIR);
      writeFileSync(MARKER, 'probe-marker\n', { flag: 'wx' });
      writeFileSync(ESCAPE_TS, escapeSource(), { flag: 'wx' });
      const markerBefore = readFileSync(MARKER, 'utf8');
      const filesBefore = snapshotFiles(PROBE_DIR);
      expect(filesBefore).toEqual(['marker.txt', 'probe-escape-asset.ts']);

      const problems: string[] = [];
      const checkRun = (label: string, args: string): void => {
        const hadEscapeOut = existsSync(ESCAPE_OUT);
        const result = runForge(args);
        if (result.status === 0) problems.push(`${label}: exit 0, the name was accepted`);
        const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
        const lines = combined
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        if (lines.length !== 1) problems.push(`${label}: expected 1 error line, got ${lines.length}`);
        if (/^\s*at\s/m.test(combined)) problems.push(`${label}: stack trace frames present`);
        if (!hadEscapeOut && existsSync(ESCAPE_OUT))
          problems.push(`${label}: output path created outside out/`);
        const markerNow = existsSync(MARKER) ? readFileSync(MARKER, 'utf8') : '<deleted>';
        if (markerNow !== markerBefore) problems.push(`${label}: marker changed or deleted`);
        const now = snapshotFiles(PROBE_DIR);
        const extras = now.filter((f) => !filesBefore.includes(f));
        if (extras.length > 0) problems.push(`${label}: wrote outside out/: ${extras.join(', ')}`);
      };
      checkRun('traversal', `render ${ESCAPE_NAME} --fast --bg none --flat --views front-level --size 64`);
      checkRun('separator', `render a/b --fast --bg none --size 64`);
      expect(problems).toEqual([]);
    } finally {
      rmSync(PROBE_DIR, { recursive: true, force: true });
    }
    expect(existsSync(PROBE_DIR)).toBe(false);
  });
});
