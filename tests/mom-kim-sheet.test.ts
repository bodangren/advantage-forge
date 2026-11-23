import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Phase 3 Red: pin the review-sheet contract of scripts/mom-kim-sheet.mjs.
 *
 * Every case runs the script INSIDE the case through tsx with no arguments
 * (the script always writes the same two track paths). At Red the script
 * does not exist, so the spawn fails inside every case. At T8 the script
 * exists, runs exit 0, and every case below passes.
 *
 * Sheet geometry the T8 script implements (fixed here, so Green decides
 * nothing). PAD = 24, CAPTION_H = 96, background pure white (255,255,255),
 * caption and cell text dark on white:
 * - Review sheet rows: 0-23 pad, 24-723 figure row one, 724-747 pad, 748-1447
 *   figure row two, 1448-1471 pad, 1472-1567 caption (96 rows). Height 1568.
 * - Each figure row holds exactly three segments split by full-band 24 px
 *   background bands, in column order [Kim panel][Mom render][Mom drawing]
 *   for row one and [Kim side][Mom side render][`no side drawing` text] for
 *   row two. Every figure panel is scaled to a 700 px crown-to-sole height
 *   and fills its 700-row band, so every sole sits on the row baseline.
 * - Mom panel: two render cells side by side, rows 0-23 pad, 24-723
 *   figures, 724-747 pad, one full-band 24 px separator band. Height 748.
 * - "Figure" pixels below are non-background pixels (any channel below 250);
 *   "dark" pixels have every channel below 100. Pad and separator bands are
 *   exactly (255,255,255): compositing onto white at integer offsets keeps
 *   them pure.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const SCRIPT = join(ROOT, 'scripts', 'mom-kim-sheet.mjs');
const REVIEW = join(ROOT, 'out', 'chibi-sprouts', 'redesign', 'mom-kim-review.png');
const PANEL = join(ROOT, 'out', 'chibi-sprouts', 'redesign', 'mom-panel.png');
const FRONT_LIT = join(ROOT, 'out', 'sprout-mom-kim', 'views', 'front-level.png');
const SIDE_LIT = join(ROOT, 'out', 'sprout-mom-kim', 'views', 'side-level.png');
const MEASURE = join(ROOT, 'out', 'chibi-sprouts', 'redesign', 'measure.json');

const PAD = 24;
const CAPTION_H = 96;
const BODY_H = 700;
const REVIEW_H = PAD + BODY_H + PAD + BODY_H + PAD + CAPTION_H;
const PANEL_H = PAD + BODY_H + PAD;

let sheetRan = false;

function ensureSheet(): void {
  if (sheetRan) return;
  const result = spawnSync(TSX, [SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
  expect(result.status, `${result.stdout || ''}\n${result.stderr || ''}`).toBe(0);
  sheetRan = true;
}

type Raw = { data: Buffer; width: number; height: number };

async function raw(path: string): Promise<Raw> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width!, height: info.height! };
}

function isBg(r: Raw, col: number, row: number): boolean {
  const i = (row * r.width + col) * 4;
  return r.data[i] === 255 && r.data[i + 1] === 255 && r.data[i + 2] === 255;
}

function isFigure(r: Raw, col: number, row: number): boolean {
  const i = (row * r.width + col) * 4;
  return r.data[i]! < 250 || r.data[i + 1]! < 250 || r.data[i + 2]! < 250;
}

function isDark(r: Raw, col: number, row: number): boolean {
  const i = (row * r.width + col) * 4;
  return r.data[i]! < 100 && r.data[i + 1]! < 100 && r.data[i + 2]! < 100;
}

function allBgRows(r: Raw, top: number, bottom: number): boolean {
  for (let row = top; row < bottom; row += 1) {
    for (let col = 0; col < r.width; col += 1) {
      if (!isBg(r, col, row)) return false;
    }
  }
  return true;
}

function countWhere(
  r: Raw,
  top: number,
  bottom: number,
  test: (r: Raw, c: number, v: number) => boolean,
): number {
  let n = 0;
  for (let row = top; row < bottom; row += 1) {
    for (let col = 0; col < r.width; col += 1) {
      if (test(r, col, row)) n += 1;
    }
  }
  return n;
}

function figureExtent(
  r: Raw,
  c0: number,
  c1: number,
  top: number,
  bottom: number,
): { min: number; max: number } {
  let min = bottom;
  let max = top;
  for (let row = top; row < bottom; row += 1) {
    for (let col = c0; col < c1; col += 1) {
      if (isFigure(r, col, row)) {
        if (row < min) min = row;
        if (row > max) max = row;
      }
    }
  }
  return { min, max };
}

function separators(r: Raw, top: number, bottom: number): Array<[number, number]> {
  const bands: Array<[number, number]> = [];
  let start = -1;
  for (let col = 0; col < r.width; col += 1) {
    let bg = true;
    for (let row = top; row < bottom; row += 1) {
      if (!isBg(r, col, row)) {
        bg = false;
        break;
      }
    }
    if (bg && start === -1) start = col;
    if (!bg && start !== -1) {
      bands.push([start, col]);
      start = -1;
    }
  }
  if (start !== -1) bands.push([start, r.width]);
  return bands.filter(([a, b]) => b - a >= PAD);
}

function darkBox(
  r: Raw,
  c0: number,
  c1: number,
  top: number,
  bottom: number,
): { count: number; height: number } {
  let count = 0;
  let min = bottom;
  let max = top;
  for (let row = top; row < bottom; row += 1) {
    for (let col = c0; col < c1; col += 1) {
      if (isDark(r, col, row)) {
        count += 1;
        if (row < min) min = row;
        if (row > max) max = row;
      }
    }
  }
  return { count, height: count === 0 ? 0 : max - min + 1 };
}

async function maskSpan(path: string): Promise<{ w: number; h: number }> {
  const r = await raw(path);
  let minC = r.width;
  let maxC = 0;
  let minR = r.height;
  let maxR = 0;
  for (let row = 0; row < r.height; row += 1) {
    for (let col = 0; col < r.width; col += 1) {
      const i = (row * r.width + col) * 4;
      if (r.data[i + 3]! >= 128) {
        if (col < minC) minC = col;
        if (col > maxC) maxC = col;
        if (row < minR) minR = row;
        if (row > maxR) maxR = row;
      }
    }
  }
  return { w: maxC - minC + 1, h: maxR - minR + 1 };
}

describe('mom-kim sheet layout (Red pin)', () => {
  it('writes the review sheet and the judge panel', { timeout: 300_000 }, () => {
    ensureSheet();
    for (const p of [REVIEW, PANEL]) {
      expect(existsSync(p), `missing ${p}`).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(0);
    }
  });

  it('sheet size holds two 700 px rows and a caption strip', { timeout: 300_000 }, async () => {
    ensureSheet();
    const review = await sharp(REVIEW).metadata();
    expect(review.height).toBe(REVIEW_H);
    expect(review.width).toBeGreaterThan(0);
    const panel = await sharp(PANEL).metadata();
    expect(panel.height).toBe(PANEL_H);
    expect(panel.width).toBeGreaterThan(0);
  });

  it('two rows split into three segments each', { timeout: 300_000 }, async () => {
    ensureSheet();
    const r = await raw(REVIEW);
    expect(allBgRows(r, 0, PAD)).toBe(true);
    expect(allBgRows(r, PAD + BODY_H, PAD + BODY_H + PAD)).toBe(true);
    expect(allBgRows(r, PAD + BODY_H + PAD + BODY_H, PAD + BODY_H + PAD + BODY_H + PAD)).toBe(true);
    const row1 = separators(r, PAD, PAD + BODY_H);
    const row2 = separators(r, PAD + BODY_H + PAD, PAD + BODY_H + PAD + BODY_H);
    expect(row1).toHaveLength(2);
    expect(row2).toHaveLength(2);
  });

  it('the no side drawing cell holds text, not a figure', { timeout: 300_000 }, async () => {
    ensureSheet();
    const r = await raw(REVIEW);
    const top = PAD + BODY_H + PAD;
    const seps = separators(r, top, top + BODY_H);
    expect(seps).toHaveLength(2);
    const c0 = seps[1]![1];
    const box = darkBox(r, c0, r.width, top, top + BODY_H);
    expect(box.count).toBeGreaterThan(20);
    expect(box.height).toBeLessThan(200);
    const fig = figureExtent(r, c0, r.width, top, top + BODY_H);
    expect(fig.max - fig.min + 1).toBeLessThan(200);
  });

  it('one baseline and the 700 px body scale', { timeout: 300_000 }, async () => {
    ensureSheet();
    const r = await raw(REVIEW);
    for (const [top, label] of [
      [PAD, 'row one'],
      [PAD + BODY_H + PAD, 'row two'],
    ] as const) {
      const seps = separators(r, top, top + BODY_H);
      expect(seps).toHaveLength(2);
      const c0 = 0;
      const c1 = seps[0]![0];
      const c2 = seps[0]![1];
      const c3 = seps[1]![0];
      const c4 = seps[1]![1];
      const render = figureExtent(r, c2, c3, top, top + BODY_H);
      expect(render.max - render.min + 1, `${label} render height`).toBeGreaterThanOrEqual(BODY_H - 2);
      expect(render.max - render.min + 1, `${label} render height`).toBeLessThanOrEqual(BODY_H);
      expect(Math.abs(render.min - top), `${label} render top`).toBeLessThanOrEqual(2);
      expect(Math.abs(render.max - (top + BODY_H - 1)), `${label} render sole`).toBeLessThanOrEqual(2);
      for (const [a, b, cell] of [
        [c0, c1, 'left'],
        [c3, c4, 'right'],
      ] as const) {
        const fig = figureExtent(r, a, b, top, top + BODY_H);
        expect(fig.max - fig.min + 1, `${label} ${cell} height`).toBeGreaterThanOrEqual(BODY_H - 2);
        expect(Math.abs(fig.max - (top + BODY_H - 1)), `${label} ${cell} sole`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('lit row sources feed the render cells', { timeout: 300_000 }, async () => {
    ensureSheet();
    for (const p of [FRONT_LIT, SIDE_LIT]) {
      expect(existsSync(p), `missing lit view ${p}`).toBe(true);
    }
    const record = JSON.parse(readFileSync(MEASURE, 'utf8'));
    for (const view of ['front-level', 'side-level']) {
      expect(record.rows.lit[view], `lit rows ${view}`).toBeDefined();
      expect(record.rows.lit[view].length).toBe(2);
    }
    const r = await raw(REVIEW);
    const views: Array<{ lit: string; key: string; top: number }> = [
      { lit: FRONT_LIT, key: 'front-level', top: PAD },
      { lit: SIDE_LIT, key: 'side-level', top: PAD + BODY_H + PAD },
    ];
    for (const v of views) {
      const seps = separators(r, v.top, v.top + BODY_H);
      expect(seps).toHaveLength(2);
      const cols: Array<[number, number]> = [];
      let prev = 0;
      for (const s of seps) {
        cols.push([prev, s[0]]);
        prev = s[1];
      }
      cols.push([prev, r.width]);
      const [c0, c1] = cols[1]!;
      const span = await maskSpan(v.lit);
      const litTop = record.rows.lit[v.key][0] as number;
      const litBottom = record.rows.lit[v.key][1] as number;
      expect(Math.abs(span.h - (litBottom - litTop)) <= 1, 'lit span matches rows.lit').toBe(true);
      const expected = Math.round((BODY_H * span.w) / span.h);
      const fig = figureExtent(r, c0, c1, v.top, v.top + BODY_H);
      expect(Math.abs(fig.max - fig.min + 1 - BODY_H) <= 2, 'cell holds the 700 px figure').toBe(true);
      let minC = c1;
      let maxC = c0;
      for (let row = v.top; row < v.top + BODY_H; row += 1) {
        for (let col = c0; col < c1; col += 1) {
          if (isFigure(r, col, row)) {
            if (col < minC) minC = col;
            if (col > maxC) maxC = col;
          }
        }
      }
      expect(Math.abs(maxC - minC + 1 - expected)).toBeLessThanOrEqual(2);
    }
  });

  it('caption strip holds content', { timeout: 300_000 }, async () => {
    ensureSheet();
    const r = await raw(REVIEW);
    const top = REVIEW_H - CAPTION_H;
    expect(countWhere(r, top, REVIEW_H, isFigure)).toBeGreaterThan(100);
  });

  it('two-cell mom-panel holds both renders', { timeout: 300_000 }, async () => {
    ensureSheet();
    const r = await raw(PANEL);
    expect(allBgRows(r, 0, PAD)).toBe(true);
    expect(allBgRows(r, PAD + BODY_H, PAD + BODY_H + PAD)).toBe(true);
    const seps = separators(r, PAD, PAD + BODY_H);
    expect(seps).toHaveLength(1);
    const cols: Array<[number, number]> = [
      [0, seps[0]![0]],
      [seps[0]![1], r.width],
    ];
    for (const [c0, c1] of cols) {
      const fig = figureExtent(r, c0, c1, PAD, PAD + BODY_H);
      expect(fig.max - fig.min + 1).toBeGreaterThanOrEqual(BODY_H - 2);
      expect(fig.max - fig.min + 1).toBeLessThanOrEqual(BODY_H);
    }
  });
});
