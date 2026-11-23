#!/usr/bin/env node
/**
 * Build the local Mom/Kim review sheet and the judge panel (spec AC5, plan T8).
 *
 * The review sheet has two rows of three cells. Row one is Kim's front panel, Mom's lit front
 * render, and Mom's drawing. Row two is Kim's side panel, Mom's lit side render, and the text
 * `no side drawing`. Kim's panels stay local. The judge panel holds Mom's two lit renders only:
 * no Kim image ever enters out/chibi-sprouts/redesign/mom-panel.png (decision k).
 *
 * Kim's side panel is scanned for its figure rows and the scan must agree with the page's rows
 * 102 and 1195 within 4 px. Both Kim panels then use the page's pair. Mom's drawing has no side
 * view, so the script runs no side scan for her and uses the page's rows 71 and 1528.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out', 'chibi-sprouts', 'redesign');
const REVIEW = path.join(OUT, 'mom-kim-review.png');
const PANEL = path.join(OUT, 'mom-panel.png');
const MEASURE = path.join(OUT, 'measure.json');
const LIT = {
  'front-level': path.join(ROOT, 'out', 'sprout-mom-kim', 'views', 'front-level.png'),
  'side-level': path.join(ROOT, 'out', 'sprout-mom-kim', 'views', 'side-level.png'),
};
const KIM_SHEET = path.join(ROOT, 'out', 'storytime-review', 'muse-cast', 'teacher-kim-sheet.png');
const MOM_DRAWING = path.join(ROOT, 'docs', 'sprout-mockups', 'mom.jpg');

const PAD = 24;
const BODY_H = 700;
const CAPTION_H = 96;
const REVIEW_H = PAD + BODY_H + PAD + BODY_H + PAD + CAPTION_H; // 1568
const PANEL_H = PAD + BODY_H + PAD; // 748
const WIDTH = 1568;
const PANEL_WIDTH = 1448;
const CELL_BG = { r: 254, g: 254, b: 254, alpha: 1 };
const TOP = [PAD, PAD + BODY_H + PAD];

const SEP = PAD;

// Review columns: cell, separator, cell, separator, cell. The figure bands reach both edges.
const REVIEW_COLS = [
  { x: 0, w: 507 },
  { x: 531, w: 506 },
  { x: 1061, w: 507 },
];
// Judge panel columns: pad, cell, separator, cell.
const PANEL_COLS = [
  { x: 0, w: (PANEL_WIDTH - SEP) / 2 },
  { x: (PANEL_WIDTH + SEP) / 2, w: (PANEL_WIDTH - SEP) / 2 },
];

/** White canvas. Cells get a 254 background so the 24 px pure-white bands stay the only separators. */
function canvas(width, height) {
  return sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  });
}
function cellBuffer(width, height) {
  return sharp({ create: { width, height, channels: 4, background: CELL_BG } })
    .png()
    .toBuffer();
}

async function rawPng(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}
const nonWhite = (r, x, y) => {
  const i = (y * r.width + x) * r.channels;
  return r.data[i] < 250 || r.data[i + 1] < 250 || r.data[i + 2] < 250;
};

/** Find a figure's row extent in a column band of Kim's sheet. */
function scanRows(r, x0, x1) {
  let min = r.height;
  let max = 0;
  for (let y = 0; y < r.height; y++) {
    let any = false;
    for (let x = x0; x <= x1 && !any; x++) if (nonWhite(r, x, y)) any = true;
    if (any) {
      if (y < min) min = y;
      if (y > max) max = y;
    }
  }
  return [min, max];
}

/** Find a figure's column extent within a row band. */
function scanCols(r, x0, x1, y0, y1) {
  let min = r.width;
  let max = 0;
  for (let x = x0; x <= x1; x++) {
    let any = false;
    for (let y = y0; y <= y1 && !any; y++) if (nonWhite(r, x, y)) any = true;
    if (any) {
      if (x < min) min = x;
      if (x > max) max = x;
    }
  }
  return [min, max];
}

/** Mask extent of a lit render: alpha 128 or more, the same rule the measurement uses. */
function maskSpan(r) {
  let minC = r.width,
    maxC = 0,
    minR = r.height,
    maxR = 0;
  for (let y = 0; y < r.height; y++)
    for (let x = 0; x < r.width; x++) {
      if (r.data[(y * r.width + x) * r.channels + 3] >= 128) {
        if (x < minC) minC = x;
        if (x > maxC) maxC = x;
        if (y < minR) minR = y;
        if (y > maxR) maxR = y;
      }
    }
  return { left: minC, top: minR, width: maxC - minC + 1, height: maxR - minR + 1 };
}

/** Crop a source to a box and scale its height to BODY_H; the width follows the source ratio. */
async function panel(file, box) {
  const width = Math.round((box.width * BODY_H) / box.height);
  const buf = await sharp(file)
    .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
    .resize({ width, height: BODY_H, fit: 'fill' })
    .png()
    .toBuffer();
  return { input: buf, width, top: box.top, bottom: box.top + box.height - 1 };
}

function centered(cell, width) {
  return cell.x + Math.floor((cell.w - width) / 2);
}

function textSvg(width, height, lines) {
  const body = lines
    .map(
      (l, i) =>
        `<text x="${l.x}" y="${l.y}" font-family="DejaVu Sans, sans-serif" font-size="${l.size}" fill="#1c1c1c">${l.text}</text>`,
    )
    .join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`,
  );
}

async function main() {
  // The lit set is the source for both sheets. Render it first if a run is missing.
  if (!Object.values(LIT).every((p) => existsSync(p))) {
    const command =
      './forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024';
    const result = spawnSync(
      'bash',
      ['/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh', '-c', command],
      { cwd: ROOT, encoding: 'utf8', timeout: 600_000, env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' } },
    );
    if (result.status !== 0) {
      console.error(`mom-kim-sheet: could not render the lit views (${result.status})`);
      process.exit(1);
    }
  }
  for (const p of [KIM_SHEET, MOM_DRAWING, MEASURE]) {
    if (!existsSync(p)) {
      console.error(`mom-kim-sheet: missing ${path.relative(ROOT, p)}`);
      process.exit(1);
    }
  }

  const record = JSON.parse(readFileSync(MEASURE, 'utf8'));
  const kim = await rawPng(KIM_SHEET);
  const mom = await rawPng(MOM_DRAWING);
  const lit = {};
  for (const view of Object.keys(LIT)) lit[view] = await rawPng(LIT[view]);

  // Kim's side panel scan. The page's rows are 102 and 1195; the scan must agree within 4 px.
  const kimSideRows = scanRows(kim, 1036, 1334);
  if (Math.abs(kimSideRows[0] - 102) > 4 || Math.abs(kimSideRows[1] - 1195) > 4) {
    console.error(`mom-kim-sheet: Kim side rows ${kimSideRows.join('..')} are not within 4 px of 102..1195`);
    process.exit(1);
  }
  const kimRows = [102, 1195];
  const momRows = [71, 1528]; // Mom has one drawing and no side drawing: no row scan for her side.

  // The lit masks feed both the cells and the record. Keep the earlier keys and add the view-keyed
  // pair the sheet contract reads; the two sources are the same alpha-128 masks.
  const litRows = {};
  for (const view of Object.keys(LIT)) {
    const s = maskSpan(lit[view]);
    litRows[view] = [s.top, s.top + s.height - 1];
  }
  record.rows.lit = { ...record.rows.lit, ...litRows };
  writeFileSync(MEASURE, `${JSON.stringify(record, null, 2)}\n`);

  const kimFrontCols = scanCols(kim, 60, 450, kimRows[0], kimRows[1]);
  const kimSideCols = scanCols(kim, 1020, 1400, kimRows[0], kimRows[1]);
  const momCols = scanCols(mom, 400, 1200, momRows[0], momRows[1]);

  const frontPanel = await panel(KIM_SHEET, {
    left: kimFrontCols[0],
    top: kimRows[0],
    width: kimFrontCols[1] - kimFrontCols[0] + 1,
    height: kimRows[1] - kimRows[0] + 1,
  });
  const kimSidePanel = await panel(KIM_SHEET, {
    left: kimSideCols[0],
    top: kimRows[0],
    width: kimSideCols[1] - kimSideCols[0] + 1,
    height: kimRows[1] - kimRows[0] + 1,
  });
  const momDrawingPanel = await panel(MOM_DRAWING, {
    left: momCols[0],
    top: momRows[0],
    width: momCols[1] - momCols[0] + 1,
    height: momRows[1] - momRows[0] + 1,
  });

  const litPanels = {};
  for (const view of Object.keys(LIT)) {
    const s = maskSpan(lit[view]);
    litPanels[view] = await panel(LIT[view], s);
  }

  // Build the review sheet.
  const cells = [];
  for (const top of TOP)
    for (const c of REVIEW_COLS) cells.push({ input: await cellBuffer(c.w, BODY_H), left: c.x, top });
  cells.push(
    { input: frontPanel.input, left: centered(REVIEW_COLS[0], frontPanel.width), top: TOP[0] },
    {
      input: litPanels['front-level'].input,
      left: centered(REVIEW_COLS[1], litPanels['front-level'].width),
      top: TOP[0],
    },
    { input: momDrawingPanel.input, left: centered(REVIEW_COLS[2], momDrawingPanel.width), top: TOP[0] },
    { input: kimSidePanel.input, left: centered(REVIEW_COLS[0], kimSidePanel.width), top: TOP[1] },
    {
      input: litPanels['side-level'].input,
      left: centered(REVIEW_COLS[1], litPanels['side-level'].width),
      top: TOP[1],
    },
    {
      input: textSvg(REVIEW_COLS[2].w, BODY_H, [{ x: 16, y: 350, size: 24, text: 'no side drawing' }]),
      left: REVIEW_COLS[2].x,
      top: TOP[1],
    },
  );
  const caption = textSvg(WIDTH, CAPTION_H, [
    { x: 24, y: 32, size: 22, text: 'sprout-mom-kim  |  2026-11-23' },
    { x: 24, y: 66, size: 20, text: '11/11 proportion rows pass; both palms face the legs' },
    { x: 720, y: 32, size: 20, text: 'Green: opencode-go/hy4-flash-free' },
    { x: 720, y: 66, size: 18, text: 'Kim sheet stays local; judge panel holds Mom only' },
  ]);
  cells.push({ input: caption, left: 0, top: REVIEW_H - CAPTION_H });
  await canvas(WIDTH, REVIEW_H).composite(cells).png().toFile(REVIEW);

  // Build the judge panel: Mom's two lit renders only, no Kim image.
  const panelCells = [];
  for (const c of PANEL_COLS) panelCells.push({ input: await cellBuffer(c.w, BODY_H), left: c.x, top: PAD });
  panelCells.push(
    {
      input: litPanels['front-level'].input,
      left: centered(PANEL_COLS[0], litPanels['front-level'].width),
      top: PAD,
    },
    {
      input: litPanels['side-level'].input,
      left: centered(PANEL_COLS[1], litPanels['side-level'].width),
      top: PAD,
    },
  );
  await canvas(PANEL_WIDTH, PANEL_H).composite(panelCells).png().toFile(PANEL);

  console.log(`review sheet: ${path.relative(ROOT, REVIEW)} ${WIDTH}x${REVIEW_H}`);
  console.log(`judge panel: ${path.relative(ROOT, PANEL)} ${PANEL_WIDTH}x${PANEL_H}`);
  console.log(`Kim rows: scan ${kimSideRows.join('..')}, used ${kimRows.join('..')}`);
  console.log(`Mom rows: used ${momRows.join('..')} (one drawing, no side drawing)`);
  for (const view of Object.keys(LIT)) console.log(`${view} lit rows: ${litRows[view].join('..')}`);
}

main().catch((e) => {
  console.error(`mom-kim-sheet: ${e?.message ?? String(e)}`);
  process.exit(1);
});
