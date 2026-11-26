import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

/**
 * Phase 1 Red: pin the cast panel and sheet contracts on synthetic inputs.
 *
 * The panel script loads inside each case. The fixture tree stays under
 * /tmp/opencode and uses --root. No production output is read or written.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'sprout-cast-panel.mjs');
const SCRATCH = '/tmp/opencode';
const DATE = '2026-11-26';
const NAMES = [
  'sprout-dad-kim',
  'sprout-grandma-kim',
  'sprout-grandpa-kim',
  'sprout-tom-kim',
  'sprout-lily-kim',
];
const DRAWING_ROWS = {
  'sprout-dad-kim': [80, 1525],
  'sprout-grandma-kim': [143, 1520],
  'sprout-grandpa-kim': [83, 1520],
  'sprout-tom-kim': [87, 1521],
  'sprout-lily-kim': [83, 1522],
};
const ROW_NAMES = [
  'heightInHeads',
  'armToTorso',
  'legShare',
  'headToShoulders',
  'wrist',
  'fingertips',
  'eyeLine',
  'eyeHeight',
  'spacingHead',
  'eyeWidthFace',
  'spacingFace',
];
const RED = [220, 40, 40, 255];
const GREEN = [40, 180, 70, 255];
const BLUE = [50, 90, 220, 255];
const PURPLE = [140, 60, 190, 255];

type RunResult = { status: number | null; output: string };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number; count: number };

let root: string;
let castDir: string;
const outsideArtifacts: string[] = [];

function runPanel(args: string[]): RunResult {
  const result = spawnSync(process.execPath, [SCRIPT, ...args, '--root', root], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
  const error = result.error ? `\n${result.error.message}` : '';
  return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}${error}` };
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function hashTree(tree: string): string {
  const hash = createHash('sha256');
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const file = join(dir, name);
      const rel = relative(tree, file);
      const stat = lstatSync(file);
      if (stat.isSymbolicLink()) hash.update(`link:${rel}:${readlinkSync(file)}\n`);
      else if (stat.isDirectory()) {
        hash.update(`dir:${rel}\n`);
        walk(file);
      } else if (stat.isFile()) hash.update(`file:${rel}:${sha256(file)}\n`);
    }
  };
  walk(tree);
  return hash.digest('hex');
}

function expectOneLine(output: string): void {
  expect(output.trim().split(/\r?\n/)).toHaveLength(1);
}

function put(data: Buffer, width: number, height: number, x: number, y: number, colour: number[]): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  data[i] = colour[0]!;
  data[i + 1] = colour[1]!;
  data[i + 2] = colour[2]!;
  data[i + 3] = colour[3]!;
}

function fillRect(
  data: Buffer,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colour: number[],
): void {
  for (let y = Math.max(0, Math.ceil(y0)); y <= Math.min(height - 1, Math.floor(y1)); y += 1)
    for (let x = Math.max(0, Math.ceil(x0)); x <= Math.min(width - 1, Math.floor(x1)); x += 1)
      put(data, width, height, x, y, colour);
}

async function writeRender(file: string, colour: number[], bun: boolean): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillRect(data, width, height, 80, 40, 176, 240, colour);
  if (bun) fillRect(data, width, height, 120, 24, 136, 39, PURPLE);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

async function writeDrawing(
  file: string,
  width: number,
  crown: number,
  sole: number,
  headHalf: number,
  bodyHalf: number,
): Promise<void> {
  const height = 1600;
  const data = Buffer.alloc(width * height * 4);
  const band = sole - crown;
  const chin = crown + Math.round(band * 0.28);
  const shoulder = crown + Math.round(band * 0.35);
  const cx = width / 2;
  fillRect(data, width, height, cx - headHalf, crown, cx + headHalf, chin, BLUE);
  fillRect(data, width, height, cx - bodyHalf, shoulder, cx + bodyHalf, sole, BLUE);
  fillRect(data, width, height, cx - bodyHalf * 0.55, chin, cx - bodyHalf * 0.2, sole, BLUE);
  fillRect(data, width, height, cx + bodyHalf * 0.2, chin, cx + bodyHalf * 0.55, sole, BLUE);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

function recordFor(name: string): any {
  const child = name === 'sprout-tom-kim' || name === 'sprout-lily-kim';
  const rows: Record<string, unknown> = {};
  for (const row of ROW_NAMES) rows[row] = { value: 0.5, lo: 0, hi: 1, pass: true };
  rows.lit = {
    front: { crown: 40, sole: 240, height: 200 },
    side: { crown: 40, sole: 240, height: 200 },
  };
  return {
    asset: name,
    imageSize: 1024,
    ppm: child ? 200 / 1.05 : 200 / 1.5,
    rows,
    detail: {
      crownRow: name === 'sprout-grandma-kim' ? 24 : 40,
      projectedCrownRow: 40,
      projectedSoleRow: 240,
      soleRow: 240,
      chinRow: 120,
      headHeight: 80,
    },
    palms: { L: { ok: true }, R: { ok: true } },
  };
}

async function buildFixture(): Promise<string> {
  mkdirSync(SCRATCH, { recursive: true });
  const fixture = mkdtempSync(join(SCRATCH, 'sprout-cast-panel-'));
  mkdirSync(join(fixture, 'docs', 'sprout-mockups'), { recursive: true });
  for (const name of NAMES) {
    const views = join(fixture, 'out', name, 'views');
    mkdirSync(views, { recursive: true });
    await writeRender(join(views, 'front-level.png'), RED, name === 'sprout-grandma-kim');
    await writeRender(join(views, 'side-level.png'), GREEN, false);
    const [crown, sole] = DRAWING_ROWS[name as keyof typeof DRAWING_ROWS];
    const wide = name === 'sprout-grandma-kim';
    await writeDrawing(
      join(fixture, 'docs', 'sprout-mockups', `${name.replace('sprout-', '').replace('-kim', '')}.jpg`),
      wide ? 1600 : 800,
      crown!,
      sole!,
      wide ? 300 : 100,
      wide ? 700 : 350,
    );
    const recordDir = join(fixture, 'out', 'chibi-sprouts', 'cast');
    mkdirSync(recordDir, { recursive: true });
    writeFileSync(join(recordDir, `${name}-measure.json`), `${JSON.stringify(recordFor(name), null, 2)}\n`);
  }
  return fixture;
}

async function rawPanel(file: string): Promise<any> {
  return await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function colourBounds(
  raw: any,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  predicate: (r: number, g: number, b: number) => boolean,
): Bounds {
  let minX = raw.width;
  let maxX = -1;
  let minY = raw.height;
  let maxY = -1;
  let count = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = (y * raw.width + x) * raw.channels;
      if (!predicate(raw.data[i], raw.data[i + 1], raw.data[i + 2])) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      count += 1;
    }
  }
  return { minX, maxX, minY, maxY, count };
}

const isRed = (r: number, g: number, b: number) => r > 180 && g < 90 && b < 90;
const isGreen = (r: number, g: number, b: number) => g > 140 && r < 100 && b < 120;
const isBlue = (r: number, g: number, b: number) => b > 170 && r < 110 && g < 150;
const isPurple = (r: number, g: number, b: number) => b > 150 && r > 90 && g < 110;

async function captionBuffer(file: string): Promise<Buffer> {
  return await sharp(file).extract({ left: 0, top: 804, width: 1416, height: 96 }).raw().toBuffer();
}

function captionInk(buffer: Buffer): number {
  let ink = 0;
  for (let i = 0; i < buffer.length; i += 4)
    if (buffer[i]! < 240 || buffer[i + 1]! < 240 || buffer[i + 2]! < 240) ink += 1;
  return ink;
}

beforeEach(async () => {
  root = await buildFixture();
  castDir = join(root, 'out', 'chibi-sprouts', 'cast');
});

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  for (const file of outsideArtifacts.splice(0)) rmSync(file, { recursive: true, force: true });
});

describe('sprout cast panel and sheet (Red pin)', () => {
  it('writes one 1416 x 900 panel at the exact cast path', async () => {
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    const file = join(castDir, 'sprout-dad-kim-panel.png');
    expect(existsSync(file)).toBe(true);
    const metadata = await sharp(file).metadata();
    expect(metadata.width).toBe(1416);
    expect(metadata.height).toBe(900);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(false);
  });

  it('three cells share the 700 px band, row 780 baseline and row 80 crown', async () => {
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    const raw = await rawPanel(join(castDir, 'sprout-dad-kim-panel.png'));
    const cells = [
      { x: 24, predicate: isRed },
      { x: 488, predicate: isGreen },
      { x: 952, predicate: isBlue },
    ];
    for (const cell of cells) {
      const bounds = colourBounds(raw, cell.x, cell.x + 439, 24, 803, cell.predicate);
      expect(bounds.count).toBeGreaterThan(0);
      expect(bounds.minY).toBe(80);
      expect(bounds.maxY).toBe(780);
      expect(bounds.maxY - bounds.minY).toBe(700);
    }
  });

  it('caption changes with the date, row result and crop state', async () => {
    const file = join(castDir, 'sprout-grandma-kim-panel.png');
    const first = runPanel(['--asset', 'sprout-grandma-kim', '--date', DATE]);
    expect(first.status, first.output).toBe(0);
    const dateCaption = await captionBuffer(file);
    expect(captionInk(dateCaption)).toBeGreaterThan(100);

    const second = runPanel(['--asset', 'sprout-grandma-kim', '--date', '2026-11-27']);
    expect(second.status, second.output).toBe(0);
    expect((await captionBuffer(file)).equals(dateCaption)).toBe(false);

    const recordPath = join(castDir, 'sprout-grandma-kim-measure.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.rows.heightInHeads.pass = false;
    record.palms.R.ok = false;
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    const rows = runPanel(['--asset', 'sprout-grandma-kim', '--date', DATE]);
    expect(rows.status, rows.output).toBe(0);
    expect((await captionBuffer(file)).equals(dateCaption)).toBe(false);

    record.rows.heightInHeads.pass = true;
    record.palms.R.ok = true;
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    const [crown, sole] = DRAWING_ROWS['sprout-grandma-kim'];
    await writeDrawing(join(root, 'docs', 'sprout-mockups', 'grandma.jpg'), 1600, crown!, sole!, 300, 260);
    const crop = runPanel(['--asset', 'sprout-grandma-kim', '--date', DATE]);
    expect(crop.status, crop.output).toBe(0);
    expect((await captionBuffer(file)).equals(dateCaption)).toBe(false);
  });

  it('bun pixels stay above the body band inside the 56 px headroom', async () => {
    const result = runPanel(['--asset', 'sprout-grandma-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    const raw = await rawPanel(join(castDir, 'sprout-grandma-kim-panel.png'));
    const bun = colourBounds(raw, 24, 463, 0, 79, isPurple);
    expect(bun.count).toBeGreaterThan(0);
    expect(bun.minY).toBeGreaterThanOrEqual(24);
    expect(bun.maxY).toBeLessThan(80);
  });

  it('sheet is 1544 x 900 with five figures at one scale and one baseline', async () => {
    const result = runPanel(['--sheet', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    const file = join(castDir, 'cast-sheet.png');
    const metadata = await sharp(file).metadata();
    expect(metadata.width).toBe(1544);
    expect(metadata.height).toBe(900);
    expect(readdirSync(castDir).filter((name) => name.endsWith('-panel.png'))).toEqual([]);
    const raw = await rawPanel(file);
    for (let i = 0; i < NAMES.length; i += 1) {
      const x = 24 + i * 304;
      const bounds = colourBounds(raw, x, x + 279, 24, 803, isRed);
      expect(bounds.count).toBeGreaterThan(0);
      expect(bounds.maxY).toBe(780);
      expect(bounds.maxY - bounds.minY).toBe(i < 3 ? 700 : 490);
    }
  });

  it('DRAWING_ROWS exports the five fixed drawing pairs', async () => {
    const mod = await import(pathToFileURL(SCRIPT).href);
    expect(mod.DRAWING_ROWS).toEqual(DRAWING_ROWS);
  });

  it('1600 px drawing crops to 440 px while its head band fits', async () => {
    const result = runPanel(['--asset', 'sprout-grandma-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    const raw = await rawPanel(join(castDir, 'sprout-grandma-kim-panel.png'));
    const body = colourBounds(raw, 952, 1391, 80, 780, isBlue);
    expect(body.maxX - body.minX + 1).toBe(440);
    const head = colourBounds(raw, 952, 1391, 80, 280, isBlue);
    expect(head.count).toBeGreaterThan(0);
    expect(head.maxX - head.minX + 1).toBeLessThanOrEqual(424);
  });

  it('a head wider than its cell fails with the named line', async () => {
    const [crown, sole] = DRAWING_ROWS['sprout-grandma-kim'];
    await writeDrawing(join(root, 'docs', 'sprout-mockups', 'grandma.jpg'), 1600, crown!, sole!, 450, 700);
    const result = runPanel(['--asset', 'sprout-grandma-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('figure wider than its cell: sprout-grandma-kim');
    expectOneLine(result.output);
  });

  it('missing render fails with render view not built', () => {
    rmSync(join(root, 'out', 'sprout-dad-kim', 'views', 'side-level.png'));
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('render side-level: not built');
  });

  it('linked and directory destinations are refused without changing the tree', () => {
    const realCast = join(root, 'out', 'chibi-sprouts', 'cast-real');
    renameSync(castDir, realCast);
    symlinkSync('cast-real', castDir, 'dir');
    let before = hashTree(root);
    let result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('destination is a link: out/chibi-sprouts/cast');
    expectOneLine(result.output);
    expect(hashTree(root)).toBe(before);
    rmSync(castDir);
    renameSync(realCast, castDir);

    const outsideFile = join(SCRATCH, `sprout-panel-target-${process.pid}.png`);
    outsideArtifacts.push(outsideFile);
    writeFileSync(outsideFile, 'keep\n');
    symlinkSync(outsideFile, join(castDir, 'sprout-dad-kim-panel.png'));
    before = hashTree(root);
    const targetBefore = sha256(outsideFile);
    result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('destination is a link: out/chibi-sprouts/cast/sprout-dad-kim-panel.png');
    expectOneLine(result.output);
    expect(hashTree(root)).toBe(before);
    expect(sha256(outsideFile)).toBe(targetBefore);
    rmSync(join(castDir, 'sprout-dad-kim-panel.png'));
    rmSync(outsideFile);

    mkdirSync(join(castDir, 'sprout-dad-kim-panel.png'));
    before = hashTree(root);
    result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain(
      'destination is a directory: out/chibi-sprouts/cast/sprout-dad-kim-panel.png',
    );
    expectOneLine(result.output);
    expect(hashTree(root)).toBe(before);
  });

  it('an outside cast target is never followed', () => {
    const outsideDir = join(SCRATCH, `sprout-panel-outside-${process.pid}`);
    outsideArtifacts.push(outsideDir);
    mkdirSync(outsideDir, { recursive: true });
    writeFileSync(join(outsideDir, 'keep.txt'), 'keep\n');
    const realCast = join(root, 'out', 'chibi-sprouts', 'cast-real');
    renameSync(castDir, realCast);
    symlinkSync(outsideDir, castDir, 'dir');
    const before = hashTree(root);
    const outsideBefore = hashTree(outsideDir);
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('destination is a link: out/chibi-sprouts/cast');
    expectOneLine(result.output);
    expect(hashTree(root)).toBe(before);
    expect(hashTree(outsideDir)).toBe(outsideBefore);
    rmSync(castDir);
    rmSync(outsideDir, { recursive: true, force: true });
    renameSync(realCast, castDir);
  });

  it('--asset writes one panel and no sheet', () => {
    const result = runPanel(['--asset', 'sprout-tom-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    expect(
      readdirSync(castDir)
        .filter((name) => name.endsWith('-panel.png'))
        .sort(),
    ).toEqual(['sprout-tom-kim-panel.png']);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(false);
  });

  it('--sheet writes the sheet and no panel', () => {
    const result = runPanel(['--sheet', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(true);
    expect(readdirSync(castDir).filter((name) => name.endsWith('-panel.png'))).toEqual([]);
  });

  it('--all writes five panels and the sheet', () => {
    const result = runPanel(['--all', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    expect(
      readdirSync(castDir)
        .filter((name) => name.endsWith('-panel.png'))
        .sort(),
    ).toEqual(NAMES.map((name) => `${name}-panel.png`).sort());
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(true);
  });

  it('two mode options fail with the choose-one line', () => {
    for (const args of [
      ['--asset', 'sprout-dad-kim', '--sheet'],
      ['--asset', 'sprout-dad-kim', '--all'],
      ['--all', '--sheet'],
    ]) {
      const result = runPanel([...args, '--date', DATE]);
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain('choose one of --asset, --all, or --sheet');
      expectOneLine(result.output);
    }
  });
});
