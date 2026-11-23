import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, afterAll } from 'vitest';
import sharp from 'sharp';

// The checkout under test comes from this module, never from a hard-coded path.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEAVY_RUN =
  process.env.HEAVY_RUN_PATH ?? resolve(ROOT, '..', '..', 'advantage-pr', 'scripts', 'jobs', 'heavy-run.sh');
const PID = process.pid;
const RUNS_DIR = join(ROOT, 'measure', 'runs', 'chibi_sprouts_redesign_20261123');

const PINS = {
  inheritedRender: `_flat-render-r2a-${PID}`,
  inheritedOther: `_flat-render-r2b-${PID}`,
  trailingComma: `_flat-render-r2c-${PID}`,
  unknownMember: `_flat-render-r2d-${PID}`,
  linkedOutput: `_flat-render-r2e-${PID}`,
} as const;
const OTHER_OUT = `_flat-render-r2other-${PID}`;
const LINK_TARGET = join(RUNS_DIR, `link-target-${PID}`);

function pinSource(name: string): string {
  return `import { defineAsset, sdf } from '../src/index.js';

export default defineAsset({
  name: '${name}',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.4, 1.0, 0.2]).at(0, 0.5, 0), { color: '#3f8fd0' });
  },
});
`;
}

const created = new Set<string>();

function runForge(args: string): SpawnSyncReturns<string> {
  return spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${args}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
}

function nonEmptyLines(output: string): string[] {
  return output
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
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

function snapshotContents(dir: string): string[] {
  return snapshotFiles(dir).map((f) => `${f}:${readFileSync(join(dir, f), 'utf8')}`);
}

// Only paths this run owns are ever removed: a symlink is unlinked, never followed;
// a directory must sit under out/ with a run prefix or under this track's runs
// folder with a probe prefix.
function removeOwnedPath(p: string): void {
  const st = lstatSync(p, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isSymbolicLink()) {
    rmSync(p);
    return;
  }
  if (!st.isDirectory()) {
    rmSync(p, { force: true });
    return;
  }
  const real = realpathSync(p);
  const outRoot = realpathSync(join(ROOT, 'out'));
  const runsRoot = realpathSync(RUNS_DIR);
  const underOut = dirname(real) === outRoot && basename(real).startsWith('_flat-render-r2');
  const underRuns = dirname(real) === runsRoot && /^(link-target|cutout|probe)-/.test(basename(real));
  if (!underOut && !underRuns) throw new Error(`refusing to remove unowned path: ${p}`);
  rmSync(real, { recursive: true, force: true });
}

function createFixture(name: string): string {
  const path = join(ROOT, 'assets', `${name}.ts`);
  if (existsSync(path)) throw new Error(`fixture path exists: ${path}`);
  writeFileSync(path, pinSource(name), { flag: 'wx' });
  created.add(name);
  return path;
}

function outDir(name: string): string {
  return join(ROOT, 'out', name);
}

function removeFixture(name: string): void {
  removeOwnedPath(join(ROOT, 'assets', `${name}.ts`));
  removeOwnedPath(outDir(name));
  created.delete(name);
}

afterAll(() => {
  for (const name of [...created]) {
    try {
      removeFixture(name);
    } catch {
      /* best effort */
    }
  }
  for (const dir of [LINK_TARGET, join(ROOT, 'out', OTHER_OUT)]) {
    try {
      removeOwnedPath(dir);
    } catch {
      /* best effort */
    }
  }
});

describe('render validation round 2 (views, cutout list, linked output)', () => {
  it('rejects inherited view names on render before the build', { timeout: 600_000 }, () => {
    const pin = PINS.inheritedRender;
    const fixture = createFixture(pin);
    expect(existsSync(outDir(pin))).toBe(false);
    const problems: string[] = [];
    try {
      for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
        const result = runForge(`render ${pin} --fast --views ${name} --size 64 --bg none`);
        const label = `render --views ${name}`;
        if (result.status === 0) problems.push(`${label}: exit 0, the name was accepted`);
        const lines = nonEmptyLines(`${result.stdout || ''}\n${result.stderr || ''}`);
        if (lines.length !== 1) problems.push(`${label}: expected 1 error line, got ${lines.length}`);
        else {
          if (!lines[0]!.includes(`Unknown view '${name}'`))
            problems.push(`${label}: error line names no view: ${lines[0]}`);
          if (!lines[0]!.includes('Known')) problems.push(`${label}: error line lists no known views`);
        }
        if (/^\s*at\s/m.test(`${result.stdout || ''}\n${result.stderr || ''}`))
          problems.push(`${label}: stack trace frames present`);
        if (existsSync(outDir(pin))) problems.push(`${label}: build outputs appeared`);
      }
      expect(problems).toEqual([]);
    } finally {
      removeFixture(pin);
    }
    expect(existsSync(fixture)).toBe(false);
    expect(existsSync(outDir(pin))).toBe(false);
  });

  it('rejects inherited view names on animate and cutout before the build', { timeout: 600_000 }, () => {
    const pin = PINS.inheritedOther;
    const fixture = createFixture(pin);
    expect(existsSync(outDir(pin))).toBe(false);
    const problems: string[] = [];
    const probeOut = join(RUNS_DIR, `cutout-${PID}-inherited`);
    try {
      mkdirSync(probeOut);
      const animated = runForge(`animate ${pin} --views constructor --clip idle --frames 2`);
      if (animated.status === 0) problems.push('animate: exit 0, the name was accepted');
      const animatedLines = nonEmptyLines(`${animated.stdout || ''}\n${animated.stderr || ''}`);
      if (animatedLines.length !== 1)
        problems.push(`animate: expected 1 error line, got ${animatedLines.length}`);
      if (/^\s*at\s/m.test(`${animated.stdout || ''}\n${animated.stderr || ''}`))
        problems.push('animate: stack trace frames present');
      if (existsSync(outDir(pin))) problems.push('animate: build outputs appeared');
      const cut = runForge(`cutout ${pin} --fast --out ${probeOut} --views constructor`);
      if (cut.status === 0) problems.push('cutout: exit 0, the name was accepted');
      const cutLines = nonEmptyLines(`${cut.stdout || ''}\n${cut.stderr || ''}`);
      if (cutLines.length !== 1) problems.push(`cutout: expected 1 error line, got ${cutLines.length}`);
      if (/^\s*at\s/m.test(`${cut.stdout || ''}\n${cut.stderr || ''}`))
        problems.push('cutout: stack trace frames present');
      if (existsSync(outDir(pin))) problems.push('cutout: build outputs appeared');
      if (snapshotFiles(probeOut).length > 0)
        problems.push(`cutout: wrote to the out folder: ${snapshotFiles(probeOut).join(', ')}`);
      expect(problems).toEqual([]);
    } finally {
      removeOwnedPath(probeOut);
      removeFixture(pin);
    }
    expect(existsSync(fixture)).toBe(false);
    expect(existsSync(outDir(pin))).toBe(false);
    expect(existsSync(probeOut)).toBe(false);
  });

  it(
    'cutout drops empty view members like the base (front, and ,front and front,,side)',
    { timeout: 600_000 },
    () => {
      const pin = PINS.trailingComma;
      const fixture = createFixture(pin);
      const problems: string[] = [];
      try {
        const cases: Array<{ views: string; pngs: string[] }> = [
          { views: 'front,', pngs: ['front.png'] },
          { views: ',front', pngs: ['front.png'] },
          { views: 'front,,side', pngs: ['front.png', 'side.png'] },
        ];
        cases.forEach(({ views, pngs }, index) => {
          const probeOut = join(RUNS_DIR, `cutout-${PID}-comma-${index}`);
          mkdirSync(probeOut);
          try {
            const result = runForge(`cutout ${pin} --fast --out ${probeOut} --views ${views} --size 64`);
            const label = `cutout --views ${views}`;
            if (result.status !== 0)
              problems.push(
                `${label}: exit ${result.status}: ${nonEmptyLines(`${result.stdout || ''}\n${result.stderr || ''}`).join(' | ')}`,
              );
            for (const png of pngs) {
              if (!existsSync(join(probeOut, pin, png))) problems.push(`${label}: missing ${png}`);
            }
          } finally {
            removeOwnedPath(probeOut);
          }
        });
        expect(problems).toEqual([]);
      } finally {
        removeFixture(pin);
      }
      expect(existsSync(fixture)).toBe(false);
    },
  );

  it('cutout still rejects an unknown member before the build', { timeout: 600_000 }, () => {
    const pin = PINS.unknownMember;
    const fixture = createFixture(pin);
    const probeOut = join(RUNS_DIR, `cutout-${PID}-nosuch`);
    const problems: string[] = [];
    try {
      mkdirSync(probeOut);
      const result = runForge(`cutout ${pin} --fast --out ${probeOut} --views front,nosuch`);
      if (result.status === 0) problems.push('exit 0, the unknown member was accepted');
      const lines = nonEmptyLines(`${result.stdout || ''}\n${result.stderr || ''}`);
      if (lines.length !== 1) problems.push(`expected 1 error line, got ${lines.length}`);
      if (/^\s*at\s/m.test(`${result.stdout || ''}\n${result.stderr || ''}`))
        problems.push('stack trace frames present');
      if (snapshotFiles(probeOut).length > 0)
        problems.push(`cutout wrote before the build: ${snapshotFiles(probeOut).join(', ')}`);
      if (existsSync(outDir(pin))) problems.push('build outputs appeared');
      expect(problems).toEqual([]);
    } finally {
      removeOwnedPath(probeOut);
      removeFixture(pin);
    }
    expect(existsSync(fixture)).toBe(false);
    expect(existsSync(outDir(pin))).toBe(false);
    expect(existsSync(probeOut)).toBe(false);
  });

  it("'output folder is a link' refuses render --flat before any write", { timeout: 600_000 }, async () => {
    const pin = PINS.linkedOutput;
    const fixture = createFixture(pin);
    const problems: string[] = [];
    try {
      // A symlink at out/<name>/flat, aimed at a temp folder this test owns.
      mkdirSync(LINK_TARGET);
      const targetMarker = join(LINK_TARGET, 'marker.txt');
      writeFileSync(targetMarker, 'link-target-marker\n', { flag: 'wx' });
      mkdirSync(outDir(pin), { recursive: true });
      symlinkSync(LINK_TARGET, join(outDir(pin), 'flat'));
      const flatRun = runForge(`render ${pin} --fast --views front-level --ortho --flat --bg none --size 64`);
      if (flatRun.status === 0) problems.push('flat symlink: exit 0, the linked folder was accepted');
      const flatLines = nonEmptyLines(`${flatRun.stdout || ''}\n${flatRun.stderr || ''}`);
      if (flatLines.length !== 1)
        problems.push(`flat symlink: expected 1 error line, got ${flatLines.length}`);
      if (/^\s*at\s/m.test(`${flatRun.stdout || ''}\n${flatRun.stderr || ''}`))
        problems.push('flat symlink: stack trace frames present');
      if (snapshotFiles(LINK_TARGET).filter((f) => f.endsWith('.png')).length > 0)
        problems.push('flat symlink: PNG appeared in the link target');
      if (readFileSync(targetMarker, 'utf8') !== 'link-target-marker\n')
        problems.push('flat symlink: marker changed or deleted');

      // out/<name> itself a symlink, aimed at another asset out folder this test owns.
      const otherOut = join(ROOT, 'out', OTHER_OUT);
      mkdirSync(join(otherOut, 'flat'), { recursive: true });
      const otherMarker = join(otherOut, 'flat', 'marker.txt');
      writeFileSync(otherMarker, 'other-marker\n', { flag: 'wx' });
      const otherPng = join(otherOut, 'flat', 'existing.png');
      const pngBytes = await sharp({
        create: { width: 4, height: 4, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 255 } },
      })
        .png()
        .toBuffer();
      writeFileSync(otherPng, pngBytes, { flag: 'wx' });
      const otherBefore = snapshotFiles(otherOut).map(
        (f) => `${f}:${readFileSync(join(otherOut, f), 'utf8')}`,
      );
      removeOwnedPath(outDir(pin));
      symlinkSync(otherOut, outDir(pin));
      const outRun = runForge(`render ${pin} --fast --views front-level --ortho --flat --bg none --size 64`);
      if (outRun.status === 0) problems.push('out symlink: exit 0, the linked folder was accepted');
      const outLines = nonEmptyLines(`${outRun.stdout || ''}\n${outRun.stderr || ''}`);
      if (outLines.length !== 1) problems.push(`out symlink: expected 1 error line, got ${outLines.length}`);
      if (/^\s*at\s/m.test(`${outRun.stdout || ''}\n${outRun.stderr || ''}`))
        problems.push('out symlink: stack trace frames present');
      const otherAfter = snapshotFiles(otherOut).map(
        (f) => `${f}:${readFileSync(join(otherOut, f), 'utf8')}`,
      );
      if (JSON.stringify(otherAfter) !== JSON.stringify(otherBefore))
        problems.push("out symlink: the other asset's flat folder changed");
      expect(problems).toEqual([]);
    } finally {
      removeOwnedPath(outDir(pin));
      removeOwnedPath(join(ROOT, 'out', OTHER_OUT));
      removeOwnedPath(LINK_TARGET);
      removeFixture(pin);
    }
    expect(problems).toEqual([]);
    expect(existsSync(fixture)).toBe(false);
    expect(existsSync(outDir(pin))).toBe(false);
    expect(existsSync(LINK_TARGET)).toBe(false);
    expect(existsSync(join(ROOT, 'out', OTHER_OUT))).toBe(false);
  });
});
