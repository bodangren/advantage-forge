import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Phase 1 Red: pin the cast measurement options and fixture seams.
 *
 * The script loads inside each case. A missing export or option therefore fails
 * inside its case, never at file collection. The CLI cases use the Mom inputs
 * prepared by T0. The hair-colour CLI case runs a copied script in a temporary
 * tree, so the test writes no asset or production output.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'proportion-check.mjs');
const BASE = join(ROOT, 'assets', 'parts', 'humanoid-kim.ts');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const SCRATCH = '/tmp/opencode';
const MOM = 'sprout-mom-kim';

const KIM_TABLE = [
  { name: 'heightInHeads', lo: 3.54, hi: 3.74 },
  { name: 'armToTorso', lo: 1.25, hi: 1.41 },
  { name: 'legShare', lo: 0.36, hi: 0.42 },
  { name: 'headToShoulders', lo: 1.11, hi: 1.27 },
  { name: 'wrist', lo: -0.16, hi: 0.04 },
  { name: 'fingertips', lo: 0.41, hi: 0.61 },
  { name: 'eyeLine', lo: 0.59, hi: 0.65 },
  { name: 'eyeHeight', lo: 0.09, hi: 0.13 },
  { name: 'spacingHead', lo: 0.35, hi: 0.41 },
  { name: 'eyeWidthFace', lo: 0.22, hi: 0.24 },
  { name: 'spacingFace', lo: 0.44, hi: 0.5 },
];

const CHILD_TABLE = [
  { name: 'heightInHeads', lo: 2.79, hi: 3.03 },
  { name: 'armToTorso', lo: 1.08, hi: 1.51 },
  { name: 'legShare', lo: 0.3, hi: 0.39 },
  { name: 'headToShoulders', lo: 1.83, hi: 2.35 },
  { name: 'wrist', lo: -0.3, hi: 0.16 },
  { name: 'fingertips', lo: 0.25, hi: 0.71 },
  { name: 'eyeLine', lo: 0.61, hi: 0.68 },
  { name: 'eyeHeight', lo: 0.12, hi: 0.16 },
  { name: 'spacingHead', lo: 0.28, hi: 0.36 },
  { name: 'eyeWidthFace', lo: 0.22, hi: 0.24 },
  { name: 'spacingFace', lo: 0.45, hi: 0.51 },
];

type Row = { name: string; value: number; lo: number; hi: number };
type TableRow = Omit<Row, 'value'>;
type RunResult = { status: number | null; output: string };

function scriptUrl(): string {
  return pathToFileURL(SCRIPT).href;
}

async function loadScript(): Promise<any> {
  return await import(scriptUrl());
}

function runScript(args: string[], script = SCRIPT, cwd = ROOT): RunResult {
  const result = spawnSync(TSX, [script, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
  const error = result.error ? `\n${result.error.message}` : '';
  return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}${error}` };
}

function runMom(args: string[]): RunResult {
  return runScript(['--asset', MOM, ...args]);
}

/** A disposable repository tree with the real script and T0 Mom inputs. */
function makeMomFixture(prefix: string): { root: string; script: string } {
  mkdirSync(SCRATCH, { recursive: true });
  const root = mkdtempSync(join(SCRATCH, prefix));
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'assets', 'parts'), { recursive: true });
  mkdirSync(join(root, 'out', MOM, 'flat'), { recursive: true });
  mkdirSync(join(root, 'out', MOM, 'views'), { recursive: true });
  const script = join(root, 'scripts', 'proportion-check.mjs');
  copyFileSync(SCRIPT, script);
  symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'dir');
  writeFileSync(
    join(root, 'assets', 'parts', 'humanoid-kim.ts'),
    `export * from ${JSON.stringify(pathToFileURL(BASE).href)};\n`,
  );
  writeFileSync(
    join(root, 'assets', `${MOM}.ts`),
    `export { default } from ${JSON.stringify(pathToFileURL(join(ROOT, 'assets', `${MOM}.ts`)).href)};\n`,
  );
  for (const file of [
    `${MOM}.glb`,
    'stats.json',
    'flat/front-level.png',
    'flat/side-level.png',
    'views/front-level.png',
    'views/side-level.png',
  ])
    copyFileSync(join(ROOT, 'out', MOM, file), join(root, 'out', MOM, file));
  return { root, script };
}

function rowsFor(table: TableRow[]): Row[] {
  return table.map((row) => ({ ...row, value: (row.lo + row.hi) / 2 }));
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function hashTree(root: string): string {
  const hash = createHash('sha256');
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const file = join(dir, name);
      const rel = relative(root, file);
      const stat = lstatSync(file);
      if (stat.isSymbolicLink()) {
        hash.update(`link:${rel}:${readlinkSync(file)}\n`);
      } else if (stat.isDirectory()) {
        hash.update(`dir:${rel}\n`);
        walk(file);
      } else if (stat.isFile()) {
        hash.update(`file:${rel}:${sha256(file)}\n`);
      }
    }
  };
  walk(root);
  return hash.digest('hex');
}

function expectOneLine(output: string): void {
  expect(output.trim().split(/\r?\n/)).toHaveLength(1);
}

type Image = { data: Uint8Array; width: number; height: number; channels: 4 };

function image(width: number, height: number): Image {
  return { data: new Uint8Array(width * height * 4), width, height, channels: 4 };
}

function setPx(img: Image, x: number, y: number, color: number[]): void {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i] = color[0]!;
  img.data[i + 1] = color[1]!;
  img.data[i + 2] = color[2]!;
  img.data[i + 3] = color[3] ?? 255;
}

function rect(img: Image, x0: number, y0: number, x1: number, y1: number, color: number[]): void {
  for (let y = Math.ceil(Math.min(y0, y1)); y <= Math.floor(Math.max(y0, y1)); y += 1)
    for (let x = Math.ceil(Math.min(x0, x1)); x <= Math.floor(Math.max(x0, x1)); x += 1)
      setPx(img, x, y, color);
}

function ellipse(img: Image, cx: number, cy: number, rx: number, ry: number, color: number[]): void {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y += 1)
    for (let x = Math.ceil(cx - rx); x <= Math.floor(cx + rx); x += 1)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) setPx(img, x, y, color);
}

function hexToRgb(hex: string): number[] {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/** The passing synthetic figure, with explicit projection and landmark numbers. */
function baseFigure(): any {
  const size = 1024;
  const skin = hexToRgb('#f2c7a4');
  const dark = hexToRgb('#241812');
  const skinC = [...skin, 255];
  const darkC = [...dark, 255];
  const crownY = 1.5;
  const soleY = 0;
  const headH = 0.412;
  const chinY = crownY - headH;
  const eyeY = crownY - 0.62 * headH;
  const headHalf = 0.1705;
  const faceHalf = 0.139;
  const gap = 0.13;
  const eyeHalf = 0.032;
  const cy = (crownY + soleY) / 2;
  const ppm = size / (Math.max(crownY - soleY, 0.4) * 1.1);
  const row = (y: number) => (cy - y) * ppm + size / 2;
  const col = (x: number) => x * ppm + size / 2;
  const front = image(size, size);
  const side = image(size, size);

  rect(front, col(-faceHalf), row(0.585), col(faceHalf), row(1.1), skinC);
  rect(front, col(-0.085), row(0.585), col(-0.025), row(soleY), skinC);
  rect(front, col(0.025), row(0.585), col(0.085), row(soleY), skinC);
  ellipse(front, col(0), row(crownY - headH / 2), headHalf * ppm, (headH / 2) * ppm, darkC);
  rect(front, col(-faceHalf), row(chinY), col(faceHalf), row(crownY - 0.1), skinC);
  for (const sx of [-1, 1]) {
    const ex = (sx * gap) / 2;
    rect(front, col(ex - eyeHalf), row(eyeY + 0.0225), col(ex + eyeHalf), row(eyeY - 0.0225), darkC);
  }
  for (const sx of [-1, 1]) rect(front, col(sx * 0.155), row(0.603), col(sx * 0.167), row(0.449), skinC);

  rect(side, size / 2 - 0.1 * ppm, row(soleY), size / 2 + 0.1 * ppm, row(1.1), skinC);
  ellipse(side, size / 2, row(crownY - headH / 2), 0.15 * ppm, (headH / 2) * ppm, darkC);
  rect(side, size / 2 - 0.12 * ppm, row(eyeY + 0.03), size / 2 - 0.02 * ppm, row(eyeY - 0.03), skinC);

  const tipU = col(0.16);
  const tipV = row(0.452);
  const legWindowR = [col(0.025) - 0.03 * ppm, col(0.085) + 0.03 * ppm];
  const legWindowL = [size - legWindowR[1]!, size - legWindowR[0]!];
  return {
    front,
    side,
    skinRgb: skin,
    eyeRgb: hexToRgb('#6e4020'),
    ppm,
    chinRow: row(chinY),
    projectedTop: row(crownY),
    projectedSole: row(soleY),
    tipV,
    handDepth: 0.05,
    legWindowL,
    legWindowR,
    landmarks: {
      shoulder: [col(0.135), row(0.9937)],
      hip: [col(0.075), row(0.585)],
      kneeV: row(0.324),
      wristV: row(0.6007),
      ankleU: col(0.085),
      tipU,
      tipV,
    },
    projection: { row, col, eyeY, eyeHalf },
  };
}

function bunAboveCrown(): any {
  const figure = baseFigure();
  const crown = Math.round(figure.projectedTop);
  rect(figure.front, 500, crown - 24, 524, crown - 17, [...hexToRgb('#241812'), 255]);
  return figure;
}

function wrongCrown(): any {
  const figure = baseFigure();
  figure.projectedTop = Math.round(figure.projectedTop) - 20;
  return figure;
}

function glassesFrame(colour = '#3b2a1e', eyeColourHex = '#6e4020'): any {
  const figure = baseFigure();
  const { row, col, eyeY, eyeHalf } = figure.projection;
  const eyeColour = hexToRgb(eyeColourHex);
  for (const sx of [-1, 1]) {
    const ex = (sx * 0.13) / 2;
    rect(figure.front, col(ex - eyeHalf), row(eyeY + 0.0225), col(ex + eyeHalf), row(eyeY - 0.0225), [
      ...eyeColour,
      255,
    ]);
  }
  const left = col(-0.13 / 2 + eyeHalf);
  const right = col(0.13 / 2 - eyeHalf);
  rect(figure.front, left, row(eyeY) - 1, right, row(eyeY) + 1, [...hexToRgb(colour), 255]);
  figure.castMeta = { faceMarks: { glasses: colour } };
  return figure;
}

function lilyHair(kind: 'clean' | 'chin' | 'side-chin' | 'bangs'): any {
  const figure = baseFigure();
  const hair = [...hexToRgb('#7a5230'), 255];
  figure.assetName = 'sprout-lily-kim';
  figure.hairRgb = hexToRgb('#7a5230');
  const chin = Math.round(figure.chinRow);
  if (kind === 'chin') rect(figure.front, 390, chin - 2, 634, chin - 2, hair);
  if (kind === 'side-chin') {
    const frontmost = Math.round(figure.side.width / 2 - 0.1 * figure.ppm);
    rect(figure.side, frontmost, chin - 2, frontmost, chin, hair);
  }
  if (kind === 'bangs') {
    const { row, eyeY } = figure.projection;
    const eyeTop = Math.round(row(eyeY + 0.0225));
    rect(figure.front, 504, eyeTop - 4, 520, eyeTop - 2, hair);
  }
  return figure;
}

function lilySideChin(alpha: number, colour = '#7a5230'): any {
  const figure = baseFigure();
  const rgb = hexToRgb(colour);
  figure.assetName = 'sprout-lily-kim';
  figure.hairRgb = hexToRgb('#7a5230');
  const frontmost = Math.round(figure.side.width / 2 - 0.1 * figure.ppm);
  const chin = Math.round(figure.chinRow);
  for (let y = chin - 2; y <= chin; y += 1) setPx(figure.side, frontmost, y, [...rgb, alpha]);
  return figure;
}

function expectFigurePasses(mod: any, figure: any): any {
  const result = mod.measureFigure(figure);
  expect(result.failures).toEqual([]);
  expect(result.guards).toEqual([]);
  expect(result.handEdge.pass).toBe(true);
  expect(result.sideSign.pass).toBe(true);
  expect(mod.checkRows(result.rows)).toEqual([]);
  return result;
}

describe('cast proportion options and fixtures (Red pin)', () => {
  it('missing base is checked as a file before any import', () => {
    const stem = 'humanoid-kim-missing-fixture';
    const result = runMom(['--base', stem]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain(`base ${stem}: not built`);
    expect(result.output).toContain(`missing: assets/parts/${stem}.ts`);
    expect(result.output).not.toMatch(/Cannot find module|ERR_MODULE_NOT_FOUND|Cannot find package/);
    expect(result.output).not.toMatch(/palm |eye components:/);
  });

  it('invalid base stems fail with unknown base before measurement', () => {
    for (const stem of ['', '/tmp/base', 'parts/base', 'parts\\base', '../base', '..']) {
      const result = runMom(['--base', stem]);
      expect(result.status, `${JSON.stringify(stem)}: ${result.output}`).toBe(1);
      expect(result.output).toContain(`unknown base ${stem}`);
      expectOneLine(result.output);
    }
  });

  it('F6 equals-form and unknown options fail before any write', () => {
    const { root, script } = makeMomFixture('sprout-option-reject-');
    try {
      const before = hashTree(root);
      const recordArg = '--record=out/chibi-sprouts/cast/equals.json';
      const result = runScript(['--asset', MOM, recordArg], script, root);
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain(`unknown option ${recordArg}`);
      expectOneLine(result.output);
      expect(hashTree(root)).toBe(before);
      expect(existsSync(join(root, 'out', 'chibi-sprouts', 'cast', 'equals.json'))).toBe(false);
      expect(existsSync(join(root, 'out', 'chibi-sprouts', 'redesign', 'measure.json'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('child table is selected and unknown table names are refused', () => {
    const child = runMom(['--table', 'child']);
    expect(child.status, child.output).toBe(1);
    expect(child.output).toMatch(/heightInHeads .*2\.79\.\.3\.03/);
    for (const name of ['', 'unknown']) {
      const result = runMom(['--table', name]);
      expect(result.status, `${JSON.stringify(name)}: ${result.output}`).toBe(1);
      expect(result.output).toContain(`unknown table ${name}: known kim, child`);
      expectOneLine(result.output);
    }
  });

  it('named record path holds the table rows, lit pairs, base and final hashes', () => {
    const rel = 'out/chibi-sprouts/cast/red-measure-record.json';
    const recordPath = join(ROOT, rel);
    rmSync(recordPath, { force: true });
    try {
      const result = runMom(['--record', rel]);
      expect(result.status, result.output).toBe(0);
      expect(existsSync(recordPath), result.output).toBe(true);
      const record = JSON.parse(readFileSync(recordPath, 'utf8'));
      expect(Object.keys(record.rows)).toEqual([...KIM_TABLE.map((row) => row.name), 'lit']);
      for (const row of KIM_TABLE) {
        expect(record.rows[row.name].lo).toBe(row.lo);
        expect(record.rows[row.name].hi).toBe(row.hi);
        expect(record.rows[row.name].pass).toBe(true);
      }
      expect(record.rows.lit.front).toEqual({
        crown: expect.any(Number),
        sole: expect.any(Number),
        height: expect.any(Number),
      });
      expect(record.rows.lit.side).toEqual({
        crown: expect.any(Number),
        sole: expect.any(Number),
        height: expect.any(Number),
      });
      expect(record.base).toBe('humanoid-kim');
      expect(record.baseSha256).toBe(sha256(BASE));
      expect(record.glbSha256).toBe(sha256(join(ROOT, 'out', MOM, `${MOM}.glb`)));
      expect(record.flatFrontSha256).toBe(sha256(join(ROOT, 'out', MOM, 'flat', 'front-level.png')));
      expect(record.flatSideSha256).toBe(sha256(join(ROOT, 'out', MOM, 'flat', 'side-level.png')));
      expect(record.litFrontSha256).toBe(sha256(join(ROOT, 'out', MOM, 'views', 'front-level.png')));
      expect(record.litSideSha256).toBe(sha256(join(ROOT, 'out', MOM, 'views', 'side-level.png')));
    } finally {
      rmSync(recordPath, { force: true });
    }
  });

  it('TABLES exports the two ordered spec tables', async () => {
    const mod = await loadScript();
    expect(mod.TABLES).toEqual({ kim: KIM_TABLE, child: CHILD_TABLE });
  });

  it('selected table decides 3.00 for child and 3.60 for kim', async () => {
    const mod = await loadScript();
    const child = rowsFor(CHILD_TABLE);
    child[0]!.value = 3;
    expect(mod.checkRows(child, 'child')).toEqual([]);
    expect(mod.checkRows(child)).toEqual(['FAIL heightInHeads: 3 not in 3.54..3.74']);
    const kim = rowsFor(KIM_TABLE);
    kim[0]!.value = 3.6;
    expect(mod.checkRows(kim)).toEqual([]);
    expect(mod.checkRows(kim, 'child')).toEqual(['FAIL heightInHeads: 3.6 not in 2.79..3.03']);
  });

  it('row limits cannot override the selected table', async () => {
    const mod = await loadScript();
    const rows = rowsFor(KIM_TABLE);
    rows[0] = { name: 'heightInHeads', value: 3.6, lo: 0, hi: 99 };
    expect(mod.checkRows(rows, 'kim')).toEqual([
      'FAIL heightInHeads: row limits 0..99 disagree with table kim',
    ]);
  });

  it('projected crown drives the head rows and the mask guard is one-sided', async () => {
    const mod = await loadScript();
    const base = expectFigurePasses(mod, baseFigure());
    const bun = expectFigurePasses(mod, bunAboveCrown());
    const projectedCrownRow = Math.round(bunAboveCrown().projectedTop);
    expect(bun.detail.crownRow).toBe(projectedCrownRow - 24);
    expect(bun.detail.projectedCrownRow).toBe(projectedCrownRow);
    expect(bun.detail.headHeight).toBeCloseTo(bunFigure().chinRow - projectedCrownRow, 8);
    expect(bun.rows).toEqual(base.rows);
    expect(bun.guards.some((line: string) => line.startsWith('GUARD top on mask'))).toBe(false);

    const wrong = mod.measureFigure(wrongCrown());
    expect(wrong.guards.some((line: string) => line.startsWith('GUARD top on mask:'))).toBe(true);
  });

  it('measurePixels keeps five figures and measureFigure is the direct fixture seam', async () => {
    const mod = await loadScript();
    const figures = mod.measurePixels();
    expect(figures).toHaveLength(5);
    expect(figures.map((figure: any) => figure.name)).toEqual([
      'pass',
      'crown-high',
      'sole-low',
      'wide-head',
      'merged-eyes',
    ]);
    expect(figures.map((figure: any) => figure.params)).toEqual([
      {},
      { crownScale: 1.15 },
      { soleLower: 0.1 },
      { headWiden: 0.12 },
      { eyeGap: 0.06, eyeWidth: 0.064 },
    ]);
    expect(figures.map((figure: any) => figure.ok)).toEqual([true, false, false, false, false]);
    expect(figures[0].failures).toEqual([]);
    expect(figures[1].failures).toHaveLength(1);
    expect(figures[1].failures[0]).toMatch(/^FAIL heightInHeads: .* not in .*$/);
    expect(figures[2].failures).toHaveLength(1);
    expect(figures[2].failures[0]).toMatch(/^FAIL legShare: .* not in .*$/);
    expect(figures[3].failures).toHaveLength(1);
    expect(figures[3].failures[0]).toMatch(/^FAIL headToShoulders: .* not in .*$/);
    expect(figures[4].failures).toEqual(['eye components: found 1, expected 2']);
    for (const figure of figures) {
      expect(figure.handEdge.pass).toBe(true);
      expect(figure.sideSign.pass).toBe(true);
    }
    expect(typeof mod.measureFigure).toBe('function');
  });

  it('bun-above-crown passes and wrong-crown fails the named mask guard', async () => {
    const mod = await loadScript();
    const bun = expectFigurePasses(mod, bunAboveCrown());
    expect(bun.detail.headHeight).toBeCloseTo(bunFigure().chinRow - Math.round(bunFigure().projectedTop), 8);
    const wrong = mod.measureFigure(wrongCrown());
    expect(wrong.guards).toContainEqual(expect.stringMatching(/^GUARD top on mask: \d+ vs \d+$/));
  });

  it('glasses-frame excludes the declared mark and rejects a close mark colour', async () => {
    const mod = await loadScript();
    expectFigurePasses(mod, glassesFrame());
    const undeclared = glassesFrame();
    delete undeclared.castMeta;
    expect(mod.measureFigure(undeclared).failures).toEqual(['eye components: found 1, expected 2']);
    const close = mod.measureFigure(glassesFrame('#6e4020'));
    expect(close.failures).toContain('faceMarks glasses: too close to the eye paint');
  });

  it('F4 base iris paint survives the spec example glasses mark', async () => {
    const mod = await loadScript();
    expectFigurePasses(mod, glassesFrame('#3b2a1e', '#4a2e18'));
  });

  it('Lily fixtures produce all three named hair guards', async () => {
    const mod = await loadScript();
    const clean = mod.measureFigure(lilyHair('clean'));
    expect(clean.guards.filter((line: string) => line.startsWith('GUARD lily'))).toEqual([]);
    const chinRow = Math.round(lilyHair('chin').chinRow) - 2;
    const chin = mod.measureFigure(lilyHair('chin'));
    expect(chin.guards).toContain(`GUARD lily chin: hair crosses the chin at row ${chinRow}`);
    const side = mod.measureFigure(lilyHair('side-chin'));
    expect(side.guards).toContain('GUARD lily side chin: hair at the front');
    const bangs = mod.measureFigure(lilyHair('bangs'));
    expect(bangs.guards).toContain('GUARD lily bangs: hair in the eye window');
  });

  it('F2 Lily side chin rejects antialiased hair at alpha 200 and 128', async () => {
    const mod = await loadScript();
    for (const alpha of [200, 128]) {
      const result = mod.measureFigure(lilySideChin(alpha));
      expect(result.guards, `alpha ${alpha}`).toContain('GUARD lily side chin: hair at the front');
    }
  });

  it('F2 Lily side chin requires skin at the frontmost mask pixel', async () => {
    const mod = await loadScript();
    const result = mod.measureFigure(lilySideChin(255, '#2850c8'));
    expect(result.guards).toContain('GUARD lily side chin: hair at the front');
  });

  it('missing variants.hair exits with hair colour not declared', () => {
    mkdirSync(SCRATCH, { recursive: true });
    const root = mkdtempSync(join(SCRATCH, 'sprout-lily-no-hair-'));
    try {
      mkdirSync(join(root, 'scripts'), { recursive: true });
      mkdirSync(join(root, 'assets', 'parts'), { recursive: true });
      mkdirSync(join(root, 'out', 'sprout-lily-kim', 'flat'), { recursive: true });
      mkdirSync(join(root, 'out', 'sprout-lily-kim', 'views'), { recursive: true });
      copyFileSync(SCRIPT, join(root, 'scripts', 'proportion-check.mjs'));
      symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'dir');
      writeFileSync(
        join(root, 'assets', 'parts', 'humanoid-kim.ts'),
        `export * from ${JSON.stringify(pathToFileURL(BASE).href)};\n`,
      );
      writeFileSync(
        join(root, 'assets', 'sprout-lily-kim.ts'),
        [
          `import mom from ${JSON.stringify(pathToFileURL(join(ROOT, 'assets', 'sprout-mom-kim.ts')).href)};`,
          'const variants = { ...mom.variants };',
          'delete variants.hair;',
          "export default { ...mom, name: 'sprout-lily-kim', variants };",
          '',
        ].join('\n'),
      );
      for (const file of [
        'sprout-lily-kim.glb',
        'stats.json',
        'flat/front-level.png',
        'flat/side-level.png',
        'views/front-level.png',
        'views/side-level.png',
      ]) {
        const source = file === 'sprout-lily-kim.glb' ? `${MOM}.glb` : file;
        copyFileSync(join(ROOT, 'out', MOM, source), join(root, 'out', 'sprout-lily-kim', file));
      }
      const result = runScript(
        ['--asset', 'sprout-lily-kim'],
        join(root, 'scripts', 'proportion-check.mjs'),
        root,
      );
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain('hair colour: not declared');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('record links, directories and outside paths are refused without tree changes', () => {
    const cast = join(ROOT, 'out', 'chibi-sprouts', 'cast');
    mkdirSync(cast, { recursive: true });
    const fixture = mkdtempSync(join(cast, 'red-destination-'));
    const outside = join(SCRATCH, `red-outside-record-${process.pid}.json`);
    rmSync(outside, { force: true });
    try {
      const cases: Array<{ kind: 'link' | 'directory' | 'outside'; path: string }> = [
        { kind: 'link', path: join(fixture, 'linked.json') },
        { kind: 'directory', path: join(fixture, 'directory.json') },
        { kind: 'outside', path: outside },
      ];
      for (const item of cases) {
        if (item.kind === 'link') {
          writeFileSync(join(fixture, 'target.json'), 'keep\n');
          symlinkSync('target.json', item.path);
        } else if (item.kind === 'directory') {
          mkdirSync(item.path);
        }
        const rel = relative(ROOT, item.path);
        const recordArg = item.kind === 'outside' ? item.path : rel;
        const before = hashTree(join(ROOT, 'out'));
        const result = runMom(['--record', recordArg]);
        const after = hashTree(join(ROOT, 'out'));
        expect(result.status, result.output).toBe(1);
        expectOneLine(result.output);
        if (item.kind === 'link') expect(result.output).toContain(`destination is a link: ${rel}`);
        if (item.kind === 'directory') expect(result.output).toContain(`destination is a directory: ${rel}`);
        if (item.kind === 'outside')
          expect(result.output).toContain(`destination outside out/: ${item.path}`);
        expect(after, `${item.kind} destination changed the output tree`).toBe(before);
        if (item.kind === 'link') rmSync(item.path);
        if (item.kind === 'directory') rmSync(item.path, { recursive: true });
      }
      expect(existsSync(outside)).toBe(false);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
      rmSync(outside, { force: true });
    }
  });

  it('F10 record destination reports a regular-file parent without throwing', async () => {
    const mod = await loadScript();
    const root = mkdtempSync(join(SCRATCH, 'sprout-parent-file-'));
    try {
      mkdirSync(join(root, 'out'), { recursive: true });
      writeFileSync(join(root, 'out', 'parent'), 'keep\n');
      const dest = join(root, 'out', 'parent', 'record.json');
      expect(mod.destinationError(root, dest, 'out/')).toBe('destination parent is a file: out/parent');
      expect(readFileSync(join(root, 'out', 'parent'), 'utf8')).toBe('keep\n');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('F11 record destination refuses a hard link', async () => {
    const mod = await loadScript();
    const root = mkdtempSync(join(SCRATCH, 'sprout-hardlink-'));
    try {
      mkdirSync(join(root, 'out'), { recursive: true });
      const outside = join(root, 'outside.json');
      const dest = join(root, 'out', 'record.json');
      writeFileSync(outside, 'keep\n');
      linkSync(outside, dest);
      expect(mod.destinationError(root, dest, 'out/')).toBe('destination is a link: out/record.json');
      expect(readFileSync(outside, 'utf8')).toBe('keep\n');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('adult base exports the three measured landmark aliases', async () => {
    const mod = await import(pathToFileURL(BASE).href);
    expect(mod.BASE_CROWN_Y).toBe(mod.KIM.crown);
    expect(mod.BASE_CHIN_Y).toBe(mod.KIM_CHIN_Y);
    expect(mod.BASE_HANDS).toBe(mod.KIM_HANDS);
  });
});

function bunFigure(): any {
  return bunAboveCrown();
}
