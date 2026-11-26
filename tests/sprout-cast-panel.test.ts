import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  linkSync,
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
const DRAWING_CHINS = {
  'sprout-dad-kim': 435,
  'sprout-grandma-kim': 572,
  'sprout-grandpa-kim': 495,
  'sprout-tom-kim': 583,
  'sprout-lily-kim': 574,
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

function runPanel(args: string[], extraEnv: NodeJS.ProcessEnv = {}): RunResult {
  const result = spawnSync(process.execPath, [SCRIPT, ...args, '--root', root], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, ...extraEnv, HEAVY_MIN_AVAIL_MB: '1500' },
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

function fillEllipse(
  data: Buffer,
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  colour: number[],
): void {
  for (let y = Math.max(0, Math.ceil(cy - ry)); y <= Math.min(height - 1, Math.floor(cy + ry)); y += 1)
    for (let x = Math.max(0, Math.ceil(cx - rx)); x <= Math.min(width - 1, Math.floor(cx + rx)); x += 1)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(data, width, height, x, y, colour);
}

async function writeRender(
  file: string,
  colour: number[],
  bun: boolean,
  // 75 source px = 262.5 sheet px, below the 264 px sheet head-fit limit.
  left = 90,
  right = 164,
): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillRect(data, width, height, left, 40, right, 240, colour);
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

async function writeWideHeadRender(file: string): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillRect(data, width, height, 10, 40, 246, 120, RED);
  fillRect(data, width, height, 100, 120, 156, 240, RED);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

async function writeSheetLimitHeadRender(file: string): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillRect(data, width, height, 78, 40, 177, 120, RED);
  fillRect(data, width, height, 118, 120, 138, 240, RED);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

/** The median row is 409 px, but the widest row is 472 px at the panel scale. */
async function writeMedianTrapRender(file: string): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillEllipse(data, width, height, 128, 80, 67.5, 40, RED);
  fillRect(data, width, height, 118, 120, 138, 240, RED);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

async function writeCropStateRender(file: string, wide: boolean): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillRect(data, width, height, 108, 40, 148, 120, RED);
  fillRect(data, width, height, wide ? 58 : 108, 120, wide ? 198 : 148, 240, RED);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

/** The whole mask is narrower than the window, but the off-axis arm tip is cut. */
async function writeOffAxisArmRender(file: string): Promise<void> {
  const width = 256;
  const height = 256;
  const data = Buffer.alloc(width * height * 4);
  fillRect(data, width, height, 190, 40, 230, 120, RED);
  fillRect(data, width, height, 120, 120, 230, 240, RED);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

/** Opaque JPEG paper with isolated dark noise and an off-centre chibi head. */
async function writeNoisyDrawing(file: string): Promise<void> {
  const width = 1600;
  const height = 1600;
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 250;
    data[i + 1] = 250;
    data[i + 2] = 250;
    data[i + 3] = 255;
  }
  const cx = width / 2;
  fillRect(
    data,
    width,
    height,
    800,
    DRAWING_ROWS['sprout-lily-kim'][0]!,
    1599,
    DRAWING_CHINS['sprout-lily-kim'],
    RED,
  );
  fillRect(
    data,
    width,
    height,
    cx - 100,
    DRAWING_CHINS['sprout-lily-kim'],
    cx + 100,
    650,
    [242, 199, 164, 255],
  );
  fillRect(data, width, height, 400, 650, 899, DRAWING_ROWS['sprout-lily-kim'][1]!, BLUE);
  fillRect(data, width, height, 50, 100, 54, 104, [80, 80, 80, 255]);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .jpeg({ quality: 90 })
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

type RawPanel = { data: Buffer; width: number; height: number; channels: number };

async function rawPanel(file: string): Promise<RawPanel> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return {
    data: Buffer.from(data),
    width: info.width!,
    height: info.height!,
    channels: info.channels!,
  };
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

function lastInkColumn(raw: RawPanel, y0: number, y1: number): number {
  let last = -1;
  for (let y = y0; y <= y1; y += 1)
    for (let x = 0; x < raw.width; x += 1) {
      const i = (y * raw.width + x) * raw.channels;
      if (raw.data[i]! < 254 || raw.data[i + 1]! < 254 || raw.data[i + 2]! < 254) last = x;
    }
  return last;
}

const isRed = (r: number, g: number, b: number) => r > 180 && g < 90 && b < 90;
const isGreen = (r: number, g: number, b: number) => g > 140 && r < 100 && b < 120;
const isBlue = (r: number, g: number, b: number) => b > 170 && r < 110 && g < 150;
const isPurple = (r: number, g: number, b: number) => b > 150 && r > 90 && g < 110;

async function captionBuffer(file: string, width = 1416): Promise<Buffer> {
  return await sharp(file).extract({ left: 0, top: 804, width, height: 96 }).raw().toBuffer();
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

  it('F3 sheet refuses a head wider than its 280 px cell', async () => {
    await writeWideHeadRender(join(root, 'out', 'sprout-tom-kim', 'views', 'front-level.png'));
    const result = runPanel(['--sheet', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('figure wider than its cell: sprout-tom-kim');
    expectOneLine(result.output);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(false);
  });

  it('F3 sheet caption includes the fifth cell crop state inside the sheet width', async () => {
    const file = join(castDir, 'cast-sheet.png');
    const lily = join(root, 'out', 'sprout-lily-kim', 'views', 'front-level.png');
    await writeCropStateRender(lily, true);
    const first = runPanel(['--sheet', '--date', DATE]);
    expect(first.status, first.output).toBe(0);
    const caption = await captionBuffer(file, 1544);
    const raw = await rawPanel(file);
    expect(lastInkColumn(raw, 804, 899)).toBeLessThanOrEqual(1519);

    await writeCropStateRender(lily, false);
    const second = runPanel(['--sheet', '--date', DATE]);
    expect(second.status, second.output).toBe(0);
    expect((await captionBuffer(file, 1544)).equals(caption)).toBe(false);
  });

  it('F3 sheet uses the 264 px head-fit limit', async () => {
    await writeSheetLimitHeadRender(join(root, 'out', 'sprout-dad-kim', 'views', 'front-level.png'));
    const result = runPanel(['--sheet', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('figure wider than its cell: sprout-dad-kim');
    expectOneLine(result.output);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(false);
  });

  it('F3 sheet prints and captions cropped state for every cell', async () => {
    const file = join(castDir, 'cast-sheet.png');
    const dad = join(root, 'out', 'sprout-dad-kim', 'views', 'front-level.png');
    await writeCropStateRender(dad, true);
    const first = runPanel(['--sheet', '--date', DATE]);
    expect(first.status, first.output).toBe(0);
    for (const name of NAMES) expect(first.output).toMatch(new RegExp(`${name}.*cropped: (yes|no)`));
    const caption = await captionBuffer(file, 1544);

    await writeCropStateRender(dad, false);
    const second = runPanel(['--sheet', '--date', DATE]);
    expect(second.status, second.output).toBe(0);
    for (const name of NAMES) expect(second.output).toMatch(new RegExp(`${name}.*cropped: (yes|no)`));
    expect((await captionBuffer(file, 1544)).equals(caption)).toBe(false);
  });

  it('DRAWING_ROWS exports the five fixed drawing pairs', async () => {
    const mod = await import(pathToFileURL(SCRIPT).href);
    expect(mod.DRAWING_ROWS).toEqual(DRAWING_ROWS);
  });

  it('F1 all five committed drawings produce panels', () => {
    const failures: string[] = [];
    for (const name of NAMES) {
      const stem = name.replace('sprout-', '').replace('-kim', '');
      copyFileSync(
        join(ROOT, 'docs', 'sprout-mockups', `${stem}.jpg`),
        join(root, 'docs', 'sprout-mockups', `${stem}.jpg`),
      );
      const result = runPanel(['--asset', name, '--date', DATE]);
      if (result.status !== 0) failures.push(`${name}: exit ${result.status}: ${result.output.trim()}`);
    }
    expect(failures).toEqual([]);
  });

  it('F1 noisy JPEG uses the fixed chin, drops stray ink, and centres on the head', async () => {
    await writeNoisyDrawing(join(root, 'docs', 'sprout-mockups', 'lily.jpg'));
    const result = runPanel(['--asset', 'sprout-lily-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    const raw = await rawPanel(join(castDir, 'sprout-lily-kim-panel.png'));
    const head = colourBounds(raw, 952, 1391, 80, 280, isRed);
    const expected = Math.round((800 * 700) / (1522 - 83));
    expect(head.count).toBeGreaterThan(0);
    expect(head.maxX - head.minX + 1).toBeGreaterThanOrEqual(expected - 4);
    expect(head.maxX - head.minX + 1).toBeLessThanOrEqual(expected + 4);
    expect(head.minX).toBeGreaterThanOrEqual(960);
    expect(head.maxX).toBeLessThanOrEqual(1383);
  });

  it('F7 head-fit uses the widest run rather than the median row', async () => {
    await writeMedianTrapRender(join(root, 'out', 'sprout-dad-kim', 'views', 'front-level.png'));
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('figure wider than its cell: sprout-dad-kim');
    expectOneLine(result.output);
  });

  it('F7 crop state reads yes when an off-axis arm tip is cut', async () => {
    await writeOffAxisArmRender(join(root, 'out', 'sprout-dad-kim', 'views', 'front-level.png'));
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toMatch(/panel cell: sprout-dad-kim cropped: yes,/);
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

  it('F6 unknown panel options fail before any write', () => {
    const before = hashTree(root);
    const result = runPanel(['--sheat', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('unknown option --sheat');
    expectOneLine(result.output);
    expect(hashTree(root)).toBe(before);
    expect(readdirSync(castDir).filter((name) => name.endsWith('-panel.png'))).toEqual([]);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(false);
  });

  it('F8 --all validates every input before writing any panel', () => {
    const sentinel = Buffer.from('existing Dad panel\n');
    const dadPanel = join(castDir, 'sprout-dad-kim-panel.png');
    writeFileSync(dadPanel, sentinel);
    rmSync(join(castDir, 'sprout-grandpa-kim-measure.json'));
    const before = hashTree(root);
    const result = runPanel(['--all', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('record sprout-grandpa-kim: not built');
    expect(readFileSync(dadPanel).equals(sentinel)).toBe(true);
    expect(existsSync(join(castDir, 'sprout-grandma-kim-panel.png'))).toBe(false);
    expect(existsSync(join(castDir, 'cast-sheet.png'))).toBe(false);
    expect(hashTree(root)).toBe(before);
  });

  it('F9 a record with no rows is refused and writes no panel', () => {
    const recordPath = join(castDir, 'sprout-dad-kim-measure.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.rows = {};
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('record sprout-dad-kim: rows incomplete');
    expectOneLine(result.output);
    expect(existsSync(join(castDir, 'sprout-dad-kim-panel.png'))).toBe(false);
  });

  it('F10 a regular-file parent gives a named line without a stack trace', () => {
    const parent = join(root, 'out', 'chibi-sprouts');
    const realParent = join(root, 'out', 'chibi-sprouts-real');
    renameSync(parent, realParent);
    writeFileSync(parent, 'keep\n');
    const before = hashTree(root);
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('destination parent is a file: out/chibi-sprouts');
    expectOneLine(result.output);
    expect(result.output).not.toMatch(/\n\s+at /);
    expect(hashTree(root)).toBe(before);
  });

  it('F11 a hard-linked panel destination is refused without changing its target', () => {
    const outside = join(SCRATCH, `sprout-panel-hardlink-${process.pid}.png`);
    outsideArtifacts.push(outside);
    writeFileSync(outside, 'keep\n');
    const dest = join(castDir, 'sprout-dad-kim-panel.png');
    linkSync(outside, dest);
    const before = hashTree(root);
    const targetBefore = sha256(outside);
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('destination is a link: out/chibi-sprouts/cast/sprout-dad-kim-panel.png');
    expectOneLine(result.output);
    expect(hashTree(root)).toBe(before);
    expect(sha256(outside)).toBe(targetBefore);
  });

  it('F18 a planted temp-path symlink never overwrites the outside target', async () => {
    const outside = join(SCRATCH, `sprout-panel-temp-target-${process.pid}.png`);
    outsideArtifacts.push(outside);
    writeFileSync(outside, 'keep\n');
    const dest = join(castDir, 'sprout-dad-kim-panel.png');
    const targetBefore = sha256(outside);
    const child = spawn(
      process.execPath,
      [SCRIPT, '--asset', 'sprout-dad-kim', '--date', DATE, '--root', root],
      {
        cwd: ROOT,
        env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    expect(child.pid).toBeTypeOf('number');
    symlinkSync(outside, `${dest}.tmp-${child.pid}`);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    const status = await new Promise<number | null>((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });
    const output = `${stdout}${stderr}`;
    const targetAfter = sha256(outside);
    const panelIsLink = existsSync(dest) && lstatSync(dest).isSymbolicLink();
    const safeSuccess = status === 0 && targetAfter === targetBefore && !panelIsLink;
    const namedRejection =
      status === 1 && /destination is a link|temp.*(exists|link)|refuse.*temp/i.test(output);
    expect(targetAfter, output).toBe(targetBefore);
    expect(safeSuccess || namedRejection, output).toBe(true);
  });

  it('F19 a record without chinRow is refused by name', async () => {
    await writeWideHeadRender(join(root, 'out', 'sprout-dad-kim', 'views', 'front-level.png'));
    const recordPath = join(castDir, 'sprout-dad-kim-measure.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    delete record.detail.chinRow;
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    const result = runPanel(['--asset', 'sprout-dad-kim', '--date', DATE]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain('record sprout-dad-kim: no chin row');
    expectOneLine(result.output);
    expect(existsSync(join(castDir, 'sprout-dad-kim-panel.png'))).toBe(false);
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
