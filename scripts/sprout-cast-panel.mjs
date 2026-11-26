#!/usr/bin/env node
/**
 * Build the Chibi Sprouts cast panels and the cast sheet (spec AC7, decision m).
 *
 * The script writes one panel per character at `out/chibi-sprouts/cast/<name>-panel.png` and one
 * cast sheet at `out/chibi-sprouts/cast/cast-sheet.png`. It reads local files only. It copies the
 * `maskSpan`, `panel`, and `textSvg` conventions of `scripts/mom-kim-sheet.mjs` and imports nothing
 * from it, because that module runs its `main` on import.
 *
 * Every panel holds three cells at one 700 px body scale: the lit front render, the lit side
 * render, and the drawing. The projected crown sits at row 80 and the sole sits at row 780, so
 * every cell shares one baseline. A 56 px headroom band above the body band keeps a bun visible.
 *
 * The horizontal rule of spec "The horizontal crop" applies to every cell: the window is
 * `round(cellWidth / scale)` source pixels wide, centred on the source mask over the crown-to-sole
 * band, and clamped inside the source image. A head that does not fit its cell is refused.
 *
 * The script refuses a linked, outside, or directory destination before any write, so a rejected
 * destination leaves the tree byte-identical.
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The drawing rows of spec decision (n). Each pair is the crown row and the sole row. */
export const DRAWING_ROWS = {
  'sprout-dad-kim': [80, 1525],
  'sprout-grandma-kim': [143, 1520],
  'sprout-grandpa-kim': [83, 1520],
  'sprout-tom-kim': [87, 1521],
  'sprout-lily-kim': [83, 1522],
};

/**
 * The chin row of each drawing, from the page `docs/chibi-sprouts/redesign-2026-11-23.md`. The head
 * band of a drawing runs from its crown row to this row, so the head width never reads the body.
 */
export const DRAWING_CHINS = {
  'sprout-dad-kim': 435,
  'sprout-grandma-kim': 572,
  'sprout-grandpa-kim': 495,
  'sprout-tom-kim': 583,
  'sprout-lily-kim': 574,
};

/** The five cast members of the sheet. */
export const NAMES = Object.keys(DRAWING_ROWS);

/** The eleven measured rows of the cast tables, in table order. */
export const ROW_NAMES = [
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

const PAD = 24;
const HEADROOM = 56;
const BODY = 700;
const CELL_H = HEADROOM + BODY; // the cell rows: the headroom band above the body band
const CAPTION_H = 96;
const CELL_W = 440;
const PANEL_W = 1416;
const PANEL_H = 900;
const SHEET_CELL_W = 280;
const SHEET_W = 1544;
const SHEET_H = 900;
/** The sheet scale of spec "The panel layout": 466.667 px per metre for every figure. */
const SHEET_SCALE = 466.667;
const BAND_TOP = PAD + HEADROOM; // row 80: the projected crown of every panel cell
const BASELINE = 780; // the sole of every panel and sheet cell
const CAST_REL = 'out/chibi-sprouts/cast';
const CELL_BG = { r: 254, g: 254, b: 254, alpha: 1 };

// --------------------------------------------------------------------------- helpers

/** White canvas. */
function canvas(width, height) {
  return sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  });
}

/** A cell background, the 254 grey of the Mom sheet. */
function cellBuffer(width, height) {
  return sharp({ create: { width, height, channels: 4, background: CELL_BG } })
    .png()
    .toBuffer();
}

/** Text lines in DejaVu Sans at fill #1c1c1c, the convention of scripts/mom-kim-sheet.mjs. */
function textSvg(width, height, lines) {
  const body = lines
    .map(
      (l) =>
        `<text x="${l.x}" y="${l.y}" font-family="DejaVu Sans, sans-serif" font-size="${l.size}" fill="#1c1c1c">${l.text}</text>`,
    )
    .join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`,
  );
}

/** Read an image as raw RGBA. */
async function rawPng(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/**
 * The mask of a source image: the alpha-128 rule of the measurement, and for a drawing the white
 * paper is not part of the figure.
 */
function maskOf(img, ink) {
  const { width, height, channels, data } = img;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + 3] < 128) continue;
      if (ink && data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245) continue;
      mask[y * width + x] = 1;
    }
  if (!ink) return mask;
  // The paper of a scanned drawing holds isolated noise pixels. A component below one tenth of a
  // percent of the largest one is noise, so it leaves the mask.
  const labels = new Int32Array(width * height);
  const areas = [];
  const stack = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const id = y * width + x;
      if (!mask[id] || labels[id]) continue;
      const label = areas.length + 1;
      stack.length = 0;
      stack.push(id);
      labels[id] = label;
      let area = 0;
      while (stack.length) {
        const cur = stack.pop();
        area++;
        const cy = (cur / width) | 0,
          cx = cur - cy * width;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx,
              ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const nid = ny * width + nx;
            if (mask[nid] && !labels[nid]) {
              labels[nid] = label;
              stack.push(nid);
            }
          }
      }
      areas.push(area);
    }
  const largest = areas.reduce((max, area) => Math.max(max, area), 0);
  const limit = largest * 0.001;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    if (areas[labels[i] - 1] < limit) mask[i] = 0;
  }
  return mask;
}

/** The topmost mask row of the whole image. */
function maskTop(mask, width, height) {
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (mask[y * width + x]) return y;
  return height;
}

/** The widest horizontal run of a mask over one row. */
function widestRun(mask, width, row) {
  let run = 0,
    max = 0;
  for (let x = 0; x < width; x++) {
    if (mask[row * width + x]) {
      run++;
      if (run > max) max = run;
    } else run = 0;
  }
  return max;
}

/** The horizontal extent of a mask over a row band. */
function bandExtent(mask, width, height, top, bottom) {
  let minX = width,
    maxX = -1,
    count = 0;
  for (let y = Math.max(0, top); y <= Math.min(height - 1, bottom); y++)
    for (let x = 0; x < width; x++)
      if (mask[y * width + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        count++;
      }
  return { minX, maxX, count };
}

/**
 * The head of a figure over a row band: the width the head holds in most of the rows of the band
 * and the centre of that run. The median keeps a one-row bleed from the neck or from the paper of
 * a scanned drawing from widening the head, and it keeps a stray pixel from moving the head axis.
 */
function headExtent(mask, width, height, top, bottom) {
  const widths = [];
  const centres = [];
  for (let y = Math.max(0, top); y <= Math.min(height - 1, bottom); y++) {
    let best = 0,
      left = 0,
      right = -1;
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const on = x < width && mask[y * width + x] === 1;
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        if (x - start > best) {
          best = x - start;
          left = start;
          right = x - 1;
        }
        start = -1;
      }
    }
    if (best === 0) continue;
    widths.push(best);
    centres.push((left + right) / 2);
  }
  if (!widths.length) return { left: 0, right: -1, width: 0 };
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const headWidth = median(widths);
  const centre = median(centres);
  return { left: centre - headWidth / 2, right: centre + headWidth / 2, width: headWidth };
}

/**
 * The destination checks of spec "The destinations". The check uses `lstat`, never `stat`, so it
 * never follows a link, and it runs before the first `mkdir` or write.
 */
function destinationError(root, dest, treeRel) {
  const tree = path.resolve(root, treeRel);
  const abs = path.resolve(dest);
  if (abs !== tree && !abs.startsWith(tree + path.sep)) return `destination outside ${treeRel}: ${dest}`;
  let current = abs;
  for (;;) {
    let st = null;
    try {
      st = lstatSync(current, { throwIfNoEntry: false });
    } catch {
      // A parent that is a regular file makes the path unreadable. The walk names that parent.
      return `destination parent is a file: ${path.relative(root, path.dirname(current))}`;
    }
    if (st) {
      if (st.isSymbolicLink()) return `destination is a link: ${path.relative(root, current)}`;
      if (current === abs && st.isDirectory())
        return `destination is a directory: ${path.relative(root, current)}`;
      // A hard link has more than one name, so writing it would change another file.
      if (current === abs && st.nlink > 1) return `destination is a link: ${path.relative(root, current)}`;
      if (current !== abs && !st.isDirectory())
        return `destination parent is a file: ${path.relative(root, current)}`;
    }
    const parent = path.dirname(current);
    if (current === root || parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * The check of the cast folder itself. A folder is a directory, so only the link rule applies: the
 * folder and every existing parent must be a real directory.
 */
function folderError(root, folder) {
  let current = path.resolve(folder);
  for (;;) {
    let st = null;
    try {
      st = lstatSync(current, { throwIfNoEntry: false });
    } catch {
      return `destination parent is a file: ${path.relative(root, path.dirname(current))}`;
    }
    if (st?.isSymbolicLink()) return `destination is a link: ${path.relative(root, current)}`;
    if (st && !st.isDirectory()) return `destination parent is a file: ${path.relative(root, current)}`;
    const parent = path.dirname(current);
    if (current === root || parent === current) break;
    current = parent;
  }
  return null;
}

/** The local date of the run, the default caption date. */
function localDate() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// --------------------------------------------------------------------------- cells

/**
 * One panel or sheet cell.
 *
 * The cell output region is the panel rows `PAD` to `BASELINE`, so the 56 px headroom band above
 * the body band holds a bun. The source crown row lands on the panel row `top` and the source sole
 * row lands on the baseline.
 *
 * The horizontal window is `round(cellWidth / scale)` source pixels wide and it is centred on the
 * head axis, so the face of the character sits in the middle of its cell. The figure is never
 * squeezed: the horizontal and the vertical scale are the same. A window that reaches past the
 * source image leaves the free pixels empty.
 */
function buildCell(src, mask, opts) {
  const { crown, sole, cellWidth, top, chin } = opts;
  const { width, height, channels, data } = src;
  const band = sole - crown;
  const outH = BASELINE - PAD + 1;
  const crownIndex = top - PAD; // the output row of the source crown
  const scale = (BASELINE - top) / band; // output pixels per source pixel
  const windowPx = Math.max(1, Math.round(cellWidth / scale));
  const winW = Math.min(windowPx, width);
  const extent = bandExtent(mask, width, height, crown, sole);
  const head = headExtent(mask, width, height, crown, chin - 1);
  const axis = head.width > 0 ? (head.left + head.right) / 2 : (extent.minX + extent.maxX) / 2;
  const left = axis - winW / 2;
  const outW = Math.max(1, Math.round(winW * scale));
  const out = Buffer.alloc(outW * outH * 4);
  for (let oy = 0; oy < outH; oy++) {
    const sy = Math.max(
      0,
      Math.min(height - 1, crown + Math.floor(((oy - crownIndex) * band) / (BASELINE - top))),
    );
    for (let ox = 0; ox < outW; ox++) {
      const sx = Math.round(left + ox / scale);
      if (sx < 0 || sx >= width) continue;
      const si = (sy * width + sx) * channels;
      const di = (oy * outW + ox) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  // The head band must fit the cell. The head never crops, because the face is the judged subject.
  const headWidth = head.width * scale;
  // The figure top must stay inside the headroom band.
  const cellTop = crown + Math.round((-crownIndex * band) / (BASELINE - top));
  const figureTop = maskTop(mask, width, height);
  return {
    input: out,
    width: outW,
    height: outH,
    left: Math.max(0, Math.floor((cellWidth - outW) / 2)),
    top: PAD,
    cropped: winW < extent.maxX - extent.minX + 1,
    headWidth,
    figureTop,
    cellTop,
  };
}

// --------------------------------------------------------------------------- main

function fail(line) {
  console.error(line);
  process.exit(1);
}

/** Read the measure record of one asset. */
function readRecord(root, name) {
  const file = path.join(root, 'out', 'chibi-sprouts', 'cast', `${name}-measure.json`);
  if (!existsSync(file)) fail(`record ${name}: not built`);
  const record = JSON.parse(readFileSync(file, 'utf8'));
  // The record holds the eleven table rows in table order plus the lit pair.
  const rows = record.rows ?? {};
  const names = Object.keys(rows).filter((key) => key !== 'lit');
  if (names.length !== ROW_NAMES.length || ROW_NAMES.some((row, i) => names[i] !== row))
    fail(`record ${name}: rows incomplete`);
  return record;
}

/** The lit render of one view of one asset. */
function renderPath(root, name, view) {
  const file = path.join(root, 'out', name, 'views', `${view}.png`);
  if (!existsSync(file)) fail(`render ${view}: not built`);
  return file;
}

/** The drawing of one asset, named after the character. */
function drawingPath(root, name) {
  const stem = name.replace('sprout-', '').replace('-kim', '');
  const file = path.join(root, 'docs', 'sprout-mockups', `${stem}.jpg`);
  if (!existsSync(file)) fail(`drawing ${name}: not built`);
  return file;
}

/** The three cells of one panel: the lit front render, the lit side render, and the drawing. */
async function panelCells(root, name, record) {
  const detail = record.detail ?? {};
  const crown = detail.projectedCrownRow;
  const sole = detail.soleRow;
  if (!Number.isFinite(crown) || !Number.isFinite(sole) || sole - crown <= 0)
    fail(`record ${name}: no projected crown`);
  const chin = Number.isFinite(detail.chinRow) ? detail.chinRow : crown;
  const cells = [];
  for (const view of ['front-level', 'side-level']) {
    const src = await rawPng(renderPath(root, name, view));
    const mask = maskOf(src, false);
    cells.push(buildCell(src, mask, { crown, sole, chin, cellWidth: CELL_W, top: BAND_TOP }));
  }
  const [dcrown, dsole] = DRAWING_ROWS[name];
  const drawingSrc = await rawPng(drawingPath(root, name));
  const drawingMask = maskOf(drawingSrc, true);
  cells.push(
    buildCell(drawingSrc, drawingMask, {
      crown: dcrown,
      sole: dsole,
      chin: DRAWING_CHINS[name],
      cellWidth: CELL_W,
      top: BAND_TOP,
    }),
  );
  for (const cell of cells) {
    if (cell.headWidth > CELL_W - 16) fail(`figure wider than its cell: ${name}`);
    if (cell.figureTop < cell.cellTop) fail(`figure top above the cell: ${name}`);
  }
  return cells;
}

/** The caption of one panel: the asset name, the date, the row result, and the crop state. */
function panelCaption(panel, date) {
  const rows = panel.record.rows ?? {};
  const passed = ROW_NAMES.filter((name) => rows[name]?.pass).length;
  const palmsOk = (panel.record.palms?.L?.ok ?? false) && (panel.record.palms?.R?.ok ?? false);
  const cropped = panel.cells.map((cell) => (cell.cropped ? 'yes' : 'no'));
  return textSvg(PANEL_W, CAPTION_H, [
    { x: 24, y: 30, size: 22, text: `${panel.name}  |  ${date}` },
    {
      x: 24,
      y: 58,
      size: 20,
      text: `${passed}/${ROW_NAMES.length} rows pass; palms ${palmsOk ? 'ok' : 'fail'}`,
    },
    {
      x: 24,
      y: 84,
      size: 20,
      text: `cropped: front ${cropped[0]}, side ${cropped[1]}, drawing ${cropped[2]}`,
    },
  ]);
}

async function writePanel(root, panel, date) {
  const castDir = path.join(root, 'out', 'chibi-sprouts', 'cast');
  const file = path.join(castDir, `${panel.name}-panel.png`);
  const layers = [];
  for (let i = 0; i < panel.cells.length; i++) {
    const cell = panel.cells[i];
    const x = PAD + i * (CELL_W + PAD);
    // The cell background of the Mom sheet: 254, so the 24 px pure-white bands stay the only
    // separators.
    layers.push({ input: await cellBuffer(CELL_W, CELL_H), left: x, top: PAD });
    layers.push({
      input: await sharp(cell.input, {
        raw: { width: cell.width, height: cell.height, channels: 4 },
      })
        .png()
        .toBuffer(),
      left: x + cell.left,
      top: PAD,
    });
  }
  layers.push({ input: panelCaption(panel, date), left: 0, top: PANEL_H - CAPTION_H });
  mkdirSync(castDir, { recursive: true });
  await writePng(root, file, canvas(PANEL_W, PANEL_H).composite(layers));
  const cropped = panel.cells.map((cell) => (cell.cropped ? 'yes' : 'no'));
  console.log(`panel: ${path.relative(root, file)} ${PANEL_W}x${PANEL_H}`);
  console.log(`panel cell: ${panel.name} cropped: ${cropped.join(', ')}`);
}

/**
 * The cells of the cast sheet. It holds the five lit front renders at one 466.667 px per metre
 * scale, so the three adults are 700 px and the two children are 490 px. It reads the five records
 * and the five lit front renders, and it writes no panel. The head-fit rule and the figure-top
 * rule of spec "The horizontal crop" hold for every sheet cell, and every cell records its crop
 * state.
 */
async function sheetCells(root) {
  const cells = [];
  const states = [];
  for (const name of NAMES) {
    const record = readRecord(root, name);
    const detail = record.detail ?? {};
    const crown = detail.projectedCrownRow;
    const sole = detail.soleRow;
    if (!Number.isFinite(crown) || !Number.isFinite(sole) || sole - crown <= 0)
      fail(`record ${name}: no projected crown`);
    const src = await rawPng(renderPath(root, name, 'front-level'));
    const mask = maskOf(src, false);
    const contentH = Math.round((sole - crown) * (SHEET_SCALE / record.ppm));
    const cell = buildCell(src, mask, {
      crown,
      sole,
      chin: Number.isFinite(detail.chinRow) ? detail.chinRow : crown,
      cellWidth: SHEET_CELL_W,
      top: BASELINE - contentH,
    });
    // The head-fit rule of spec "The horizontal crop" holds for every sheet cell. The sheet reads
    // the same lit front renders as the panel, so it uses the same head limit as the panel. A head
    // that the panel refuses never reaches the sheet.
    if (cell.headWidth > CELL_W - 16) fail(`figure wider than its cell: ${name}`);
    if (cell.figureTop < cell.cellTop) fail(`figure top above the cell: ${name}`);
    states.push(`${name} cropped: ${cell.cropped ? 'yes' : 'no'}`);
    cells.push({ name, cell });
  }
  return { cells, states };
}

async function writeSheet(root, sheet, date) {
  const castDir = path.join(root, 'out', 'chibi-sprouts', 'cast');
  const file = path.join(castDir, 'cast-sheet.png');
  const layers = [];
  for (let i = 0; i < sheet.cells.length; i++) {
    const { cell } = sheet.cells[i];
    const x = PAD + i * (SHEET_CELL_W + PAD);
    layers.push({ input: await cellBuffer(SHEET_CELL_W, CELL_H), left: x, top: PAD });
    layers.push({
      input: await sharp(cell.input, {
        raw: { width: cell.width, height: cell.height, channels: 4 },
      })
        .png()
        .toBuffer(),
      left: x + cell.left,
      top: PAD,
    });
  }
  const caption = textSvg(SHEET_W, CAPTION_H, [
    { x: 24, y: 30, size: 22, text: `Chibi Sprouts cast  |  ${date}` },
    { x: 24, y: 58, size: 20, text: [...NAMES, 'sprout-mom-kim'].join(', ') },
    { x: 24, y: 84, size: 20, text: `cropped: ${sheet.states.join(', ')}` },
  ]);
  layers.push({ input: caption, left: 0, top: SHEET_H - CAPTION_H });
  mkdirSync(castDir, { recursive: true });
  await writePng(root, file, canvas(SHEET_W, SHEET_H).composite(layers));
  for (const state of sheet.states) console.log(`sheet cell: ${state}`);
  console.log(`sheet: ${path.relative(root, file)} ${SHEET_W}x${SHEET_H}`);
}

/**
 * Write a PNG by a temporary file and a rename, so a failed run never leaves a half-written panel
 * or sheet behind a name that a judge record already holds.
 */
async function writePng(root, file, image) {
  const temp = `${file}.tmp-${process.pid}`;
  try {
    await image.png().toFile(temp);
    renameSync(temp, file);
  } catch (e) {
    rmSync(temp, { force: true });
    throw e;
  }
}

/**
 * Parse the command line. Only the five known options are accepted, each with its own value.
 * An unknown argument, a repeated option, or a missing value is refused with one named line
 * before any read or write.
 */
function parseArgs(argv) {
  const options = { asset: null, date: null, root: ROOT };
  const modes = [];
  const seen = new Set();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') {
      modes.push('all');
      continue;
    }
    if (arg === '--sheet') {
      modes.push('sheet');
      continue;
    }
    if (arg !== '--asset' && arg !== '--date' && arg !== '--root') throw new Error(`unknown option ${arg}`);
    const key = arg.slice(2);
    if (seen.has(key)) throw new Error(`repeated option ${arg}`);
    seen.add(key);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`option ${arg} needs a value`);
    if (key === 'asset') {
      options.asset = value;
      modes.push('asset');
    } else if (key === 'date') options.date = value;
    else options.root = path.resolve(value);
    i++;
  }
  return { ...options, modes };
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  const { asset, date, root, modes } = options;
  if (modes.length > 1) fail('choose one of --asset, --all, or --sheet');
  const mode = modes[0] ?? 'all';
  if (mode === 'asset' && !NAMES.includes(asset)) fail(`unknown asset ${asset}`);

  const castDir = path.join(root, 'out', 'chibi-sprouts', 'cast');
  const sheetPath = path.join(castDir, 'cast-sheet.png');
  const panelPath = (name) => path.join(castDir, `${name}-panel.png`);

  // The destinations are checked before any read or write, so a refused destination leaves the
  // tree byte-identical.
  const targets = [];
  if (mode === 'sheet') targets.push(sheetPath);
  else if (mode === 'asset') targets.push(panelPath(asset));
  else for (const name of NAMES) targets.push(panelPath(name), sheetPath);
  for (const target of [castDir, ...targets]) {
    const error = target === castDir ? folderError(root, target) : destinationError(root, target, CAST_REL);
    if (error) fail(error);
  }

  const runDate = date || localDate();
  const cast = mode === 'sheet' ? [] : mode === 'asset' ? [asset] : NAMES;
  // Every input of every target is read before the first write, so a missing record never leaves
  // a half-written set of panels behind.
  const inputs = [];
  for (const name of cast) {
    const record = readRecord(root, name);
    const cells = await panelCells(root, name, record);
    inputs.push({ name, record, cells });
  }
  const sheet = mode === 'asset' ? null : await sheetCells(root);
  for (const panel of inputs) await writePanel(root, panel, runDate);
  if (sheet) await writeSheet(root, sheet, runDate);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e?.message ?? String(e));
    process.exit(1);
  });
}
