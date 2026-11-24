import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

/**
 * Phase 4 Green remediation round 1, Red test side. Each case imports the
 * script inside the case (dynamic import through a variable file URL) or runs
 * it through tsx, so every failure lands inside the case. Do not edit the
 * Phase 3 Red files; the missing-asset case there stays unchanged.
 *
 * Contract the T6r Green script implements (fixed here, so Green decides
 * nothing):
 * - Load order: parse args, check the asset file and the GLB exist, import
 *   the asset, check and import the base module, and only then read the
 *   renders. The F1 case observes the asset import through a marker the
 *   imported module writes under /tmp, then requires the named missing
 *   render error.
 * - checkRows requires exactly eleven uniquely named rows. Table-shape
 *   failures are exact strings: `checkRows: expected 11 rows, found 0`,
 *   `checkRows: missing row <name>`, `checkRows: duplicate row <name>`,
 *   `checkRows: unknown row <name>`. Value failures are exact strings:
 *   `FAIL <name>: not a number` (non-number or NaN), `FAIL <name>: not
 *   finite` (infinite), `FAIL <name>: negative` (below zero where the table
 *   forbids it). The valid eleven rows still return [].
 * - --asset names pass the checkAssetName rules before anything else. A bad
 *   name exits 1 with ONE line naming it `Invalid asset name '<name>'`
 *   (empty names report the required-name error instead). Nothing is
 *   imported, built, read, or written for a bad name.
 * - A corrupt or truncated GLB exits 1 with ONE line naming the GLB, no
 *   stack frames, no hang, and no measure.json write.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'proportion-check.mjs');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const MEASURE_JSON = join(ROOT, 'out', 'chibi-sprouts', 'redesign', 'measure.json');
const PID = process.pid;

function scriptUrl(): string {
  return pathToFileURL(SCRIPT).href;
}

function runScript(args: string[]): { status: number | null; output: string } {
  const result = spawnSync(TSX, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
  return { status: result.status, output: `${result.stdout || ''}\n${result.stderr || ''}` };
}

function nonEmptyLines(output: string): string[] {
  return output
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

type Row = { name: string; value: number; lo: number; hi: number };

function passRows(): Row[] {
  return [
    { name: 'heightInHeads', value: 3.64, lo: 3.54, hi: 3.74 },
    { name: 'armToTorso', value: 1.33, lo: 1.25, hi: 1.41 },
    { name: 'legShare', value: 0.39, lo: 0.36, hi: 0.42 },
    { name: 'headToShoulders', value: 1.19, lo: 1.11, hi: 1.27 },
    { name: 'wrist', value: -0.06, lo: -0.16, hi: 0.04 },
    { name: 'fingertips', value: 0.51, lo: 0.41, hi: 0.61 },
    { name: 'eyeLine', value: 0.62, lo: 0.59, hi: 0.65 },
    { name: 'eyeHeight', value: 0.11, lo: 0.09, hi: 0.13 },
    { name: 'spacingHead', value: 0.38, lo: 0.35, hi: 0.41 },
    { name: 'eyeWidthFace', value: 0.23, lo: 0.22, hi: 0.24 },
    { name: 'spacingFace', value: 0.47, lo: 0.44, hi: 0.5 },
  ];
}

function removeOwned(path: string): void {
  const st = lstatSync(path, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isSymbolicLink()) throw new Error(`refusing to remove a symlink: ${path}`);
  rmSync(path, { recursive: true, force: true });
}

async function tinyPng(path: string): Promise<void> {
  await sharp({
    create: { width: 4, height: 4, channels: 4, background: { r: 63, g: 143, b: 208, alpha: 255 } },
  })
    .png()
    .toFile(path);
}

async function checkRows(): Promise<any> {
  const mod = await import(scriptUrl());
  return mod.checkRows;
}

describe('sprout-mom-kim validation round 1 (Red pin)', () => {
  it('load order: the asset import runs before the missing-render error', { timeout: 300_000 }, () => {
    const name = `_load-order-${PID}`;
    const assetPath = join(ROOT, 'assets', `${name}.ts`);
    const outDir = join(ROOT, 'out', name);
    const glbPath = join(outDir, `${name}.glb`);
    const marker = join('/tmp', `load-order-${PID}.marker`);
    expect(existsSync(assetPath)).toBe(false);
    expect(existsSync(marker)).toBe(false);
    const source = `import { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)}, 'imported\\n');\nexport default { variants: { skin: { a: '#ffffff' }, eyes: { b: '#000000' }, hair: { c: '#000000' }, cloth: { d: '#000000' } } };\n`;
    try {
      writeFileSync(assetPath, source, { flag: 'wx' });
      mkdirSync(outDir);
      writeFileSync(glbPath, Buffer.alloc(0));
      const result = runScript(['--asset', name]);
      expect(result.status).toBe(1);
      expect(result.output).toContain(`missing: out/${name}/flat/front-level.png`);
      expect(existsSync(marker), 'the asset import ran before the render check').toBe(true);
      expect(readFileSync(marker, 'utf8')).toBe('imported\n');
    } finally {
      removeOwned(assetPath);
      removeOwned(outDir);
      removeOwned(marker);
    }
    expect(existsSync(assetPath)).toBe(false);
    expect(existsSync(outDir)).toBe(false);
    expect(existsSync(marker)).toBe(false);
  });

  it('checkRows requires eleven rows: empty table fails named', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    expect(fn([])).toEqual(['checkRows: expected 11 rows, found 0']);
  });

  it('checkRows names a missing row', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().filter((r) => r.name !== 'legShare');
    expect(fn(rows)).toEqual(['checkRows: missing row legShare']);
  });

  it('checkRows names a duplicate row', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = [...passRows(), { ...passRows().find((r) => r.name === 'eyeLine')! }];
    expect(fn(rows)).toEqual(['checkRows: duplicate row eyeLine']);
  });

  it('checkRows names an unknown row', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = [...passRows(), { name: 'extra-row', value: 1, lo: 0, hi: 2 }];
    expect(fn(rows)).toEqual(['checkRows: unknown row extra-row']);
  });

  it('checkRows names a numeric string', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().map((r) => (r.name === 'heightInHeads' ? { ...r, value: '3.6' } : r));
    expect(fn(rows)).toEqual(['FAIL heightInHeads: not a number']);
  });

  it('checkRows names NaN', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().map((r) => (r.name === 'wrist' ? { ...r, value: NaN } : r));
    expect(fn(rows)).toEqual(['FAIL wrist: not a number']);
  });

  it('checkRows names Infinity', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().map((r) => (r.name === 'armToTorso' ? { ...r, value: Infinity } : r));
    expect(fn(rows)).toEqual(['FAIL armToTorso: not finite']);
  });

  it('checkRows names null', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().map((r) => (r.name === 'spacingHead' ? { ...r, value: null } : r));
    expect(fn(rows)).toEqual(['FAIL spacingHead: not a number']);
  });

  it('checkRows names undefined', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().map((r) => (r.name === 'eyeLine' ? { ...r, value: undefined } : r));
    expect(fn(rows)).toEqual(['FAIL eyeLine: not a number']);
  });

  it('checkRows names a negative where the table forbids it', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    const rows = passRows().map((r) => (r.name === 'legShare' ? { ...r, value: -0.1 } : r));
    expect(fn(rows)).toEqual(['FAIL legShare: negative']);
  });

  it('checkRows still passes the valid eleven rows', { timeout: 300_000 }, async () => {
    const fn = await checkRows();
    expect(fn(passRows())).toEqual([]);
  });

  for (const name of ['../x', 'a/b', 'a\\b', '/tmp/x']) {
    it(`asset name validation rejects ${name} with one line before any import`, { timeout: 300_000 }, () => {
      const result = runScript(['--asset', name]);
      expect(result.status).toBe(1);
      const lines = nonEmptyLines(result.output);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Invalid asset name');
    });
  }

  it('asset name validation rejects an empty name with one line', { timeout: 300_000 }, () => {
    const result = runScript(['--asset', '']);
    expect(result.status).toBe(1);
    const lines = nonEmptyLines(result.output);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.includes('Invalid asset name') || lines[0]!.includes('required')).toBe(true);
  });

  it('asset name validation never imports a module outside the repo', { timeout: 300_000 }, async () => {
    const dir = join('/tmp', `p4name-${PID}`);
    const marker = join(dir, 'imported');
    expect(existsSync(dir)).toBe(false);
    const escapeName = `../../../../../../tmp/p4name-${PID}/escape`;
    try {
      mkdirSync(dir);
      writeFileSync(
        join(dir, 'escape.ts'),
        `import { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)}, 'imported\\n');\nexport default { variants: { skin: { a: '#ffffff' }, eyes: { b: '#000000' }, hair: { c: '#000000' }, cloth: { d: '#000000' } } };\n`,
        { flag: 'wx' },
      );
      writeFileSync(join(dir, 'escape.glb'), Buffer.from([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0]), {
        flag: 'wx',
      });
      for (const view of [
        'flat/front-level.png',
        'flat/side-level.png',
        'views/front-level.png',
        'views/side-level.png',
      ]) {
        const full = join(dir, view);
        mkdirSync(join(dir, view.split('/')[0]!), { recursive: true });
        await tinyPng(full);
      }
      const result = runScript(['--asset', escapeName]);
      expect(result.status).toBe(1);
      expect(nonEmptyLines(result.output)).toHaveLength(1);
      expect(result.output).toContain('Invalid asset name');
      expect(existsSync(marker), 'the outside module never ran').toBe(false);
    } finally {
      removeOwned(dir);
    }
    expect(existsSync(dir)).toBe(false);
  });

  it(
    'a corrupt GLB fails with one named line, no hang, and no measure.json write',
    { timeout: 300_000 },
    async () => {
      const dir = join('/tmp', `p4glb-${PID}`);
      expect(existsSync(dir)).toBe(false);
      const hadMeasure = existsSync(MEASURE_JSON);
      const beforeStat = hadMeasure ? statSync(MEASURE_JSON) : null;
      const beforeHash = hadMeasure ? readFileSync(MEASURE_JSON) : null;
      try {
        mkdirSync(dir);
        writeFileSync(
          join(dir, 'escape.ts'),
          `export default { variants: { skin: { a: '#ffffff' }, eyes: { b: '#000000' }, hair: { c: '#000000' }, cloth: { d: '#000000' } } };\n`,
          { flag: 'wx' },
        );
        writeFileSync(
          join(dir, 'escape.glb'),
          Buffer.from([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0]),
          {
            flag: 'wx',
          },
        );
        for (const view of [
          'flat/front-level.png',
          'flat/side-level.png',
          'views/front-level.png',
          'views/side-level.png',
        ]) {
          mkdirSync(join(dir, view.split('/')[0]!), { recursive: true });
          await tinyPng(join(dir, view));
        }
        const escapeName = `../../../../../../tmp/p4glb-${PID}/escape`;
        const result = runScript(['--asset', escapeName]);
        expect(result.status).toBe(1);
        const lines = nonEmptyLines(result.output);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/glb/i);
        expect(result.output).not.toMatch(/^\s*at\s/m);
        if (hadMeasure) {
          const afterStat = statSync(MEASURE_JSON);
          expect(afterStat.mtimeMs).toBe(beforeStat!.mtimeMs);
          expect(readFileSync(MEASURE_JSON).equals(beforeHash!)).toBe(true);
        } else {
          expect(existsSync(MEASURE_JSON)).toBe(false);
        }
      } finally {
        removeOwned(dir);
      }
      expect(existsSync(dir)).toBe(false);
    },
  );
});
