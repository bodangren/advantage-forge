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
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

/** The five cast members of the sheet. */
export const NAMES = Object.keys(DRAWING_ROWS);

const PAD = 24;
const HEADROOM = 56;
const BODY = 700;
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
 * The head band of a source image: the rows from the crown to the chin. The chin is the row where
 * the silhouette jumps from the head to the body, so the head width never reads the body width.
 */
function headBand(mask, width, height, crown, sole) {
  let headWidth = 0;
  let chin = crown;
  for (let y = Math.max(0, crown); y <= Math.min(height - 1, sole); y++) {
    const run = widestRun(mask, width, y);
    if (run === 0) break;
    if (headWidth > 0 && run > 1.5 * headWidth) break;
    if (run > headWidth) headWidth = run;
    chin = y;
  }
  return { chin, width: headWidth };
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
    const st = lstatSync(current, { throwIfNoEntry: false });
    if (st) {
      if (st.isSymbolicLink()) return `destination is a link: ${path.relative(root, current)}`;
      if (current === abs && st.isDirectory())
        return `destination is a directory: ${path.relative(root, current)}`;
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
    const st = lstatSync(current, { throwIfNoEntry: false });
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
 * row lands on the baseline. The horizontal window is `round(cellWidth / scale)` source pixels
 * wide, centred on the source mask over the crown-to-sole band and clamped inside the source
 * image. The figure is never squeezed: the horizontal and the vertical scale are the same.
 */
function buildCell(src, mask, opts) {
  const { crown, sole, cellWidth, top, chin, ink } = opts;
  const { width, height, channels, data } = src;
  const band = sole - crown;
  const outH = BASELINE - PAD + 1;
  const crownIndex = top - PAD; // the output row of the source crown
  const scale = (BASELINE - top) / band; // output pixels per source pixel
  const windowPx = Math.max(1, Math.round(cellWidth / scale));
  const extent = bandExtent(mask, width, height, crown, sole);
  const centre = (extent.minX + extent.maxX) / 2;
  const winW = Math.min(windowPx, width);
  const left = Math.max(0, Math.min(Math.round(centre - winW / 2), width - winW));
  const outW = Math.max(1, Math.round(winW * scale));
  const out = Buffer.alloc(outW * outH * 4);
  for (let oy = 0; oy < outH; oy++) {
    const sy = Math.max(
      0,
      Math.min(height - 1, crown + Math.floor(((oy - crownIndex) * band) / (BASELINE - top))),
    );
    for (let ox = 0; ox < outW; ox++) {
      const sx = Math.max(0, Math.min(width - 1, left + Math.round(ox / scale)));
      const si = (sy * width + sx) * channels;
      const di = (oy * outW + ox) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  // The head band must fit the cell. The head never crops, because the face is the judged subject.
  const head = bandExtent(mask, width, height, crown, chin);
  const headWidth = head.maxX < head.minX ? 0 : (head.maxX - head.minX + 1) * scale;
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
    ink,
  };
}

// --------------------------------------------------------------------------- main

function parseArgs(argv) {
  let asset = null;
  let date = null;
  let root = ROOT;
  const modes = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--asset') {
      asset = argv[++i] ?? '';
      modes.push('asset');
    } else if (arg === '--all') modes.push('all');
    else if (arg === '--sheet') modes.push('sheet');
    else if (arg === '--date') date = argv[++i] ?? '';
    else if (arg === '--root') root = path.resolve(argv[++i] ?? ROOT);
  }
  return { asset, date, root, modes };
}

function fail(line) {
  console.error(line);
  process.exit(1);
}

/** Read the measure record of one asset. */
function readRecord(root, name) {
  const file = path.join(root, 'out', 'chibi-sprouts', 'cast', `${name}-measure.json`);
  if (!existsSync(file)) fail(`record ${name}: not built`);
  return JSON.parse(readFileSync(file, 'utf8'));
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
    cells.push(buildCell(src, mask, { crown, sole, chin, cellWidth: CELL_W, top: BAND_TOP, ink: false }));
  }
  const [dcrown, dsole] = DRAWING_ROWS[name];
  const drawingSrc = await rawPng(drawingPath(root, name));
  const drawingMask = maskOf(drawingSrc, true);
  const head = headBand(drawingMask, drawingSrc.width, drawingSrc.height, dcrown, dsole);
  cells.push(
    buildCell(drawingSrc, drawingMask, {
      crown: dcrown,
      sole: dsole,
      chin: head.chin,
      cellWidth: CELL_W,
      top: BAND_TOP,
      ink: true,
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
  const names = Object.keys(rows).filter((name) => name !== 'lit');
  const passed = names.filter((name) => rows[name].pass).length;
  const palmsOk = (panel.record.palms?.L?.ok ?? false) && (panel.record.palms?.R?.ok ?? false);
  const cropped = panel.cells.map((cell) => (cell.cropped ? 'yes' : 'no'));
  return textSvg(PANEL_W, CAPTION_H, [
    { x: 24, y: 30, size: 22, text: `${panel.name}  |  ${date}` },
    {
      x: 24,
      y: 58,
      size: 20,
      text: `${passed}/${names.length} rows pass; palms ${palmsOk ? 'ok' : 'fail'}`,
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
    layers.push({
      input: await sharp(cell.input, {
        raw: { width: cell.width, height: cell.height, channels: 4 },
      })
        .png()
        .toBuffer(),
      left: PAD + i * (CELL_W + PAD) + cell.left,
      top: cell.top,
    });
  }
  layers.push({ input: panelCaption(panel, date), left: 0, top: PANEL_H - CAPTION_H });
  mkdirSync(castDir, { recursive: true });
  await canvas(PANEL_W, PANEL_H).composite(layers).png().toFile(file);
  console.log(`panel: ${path.relative(root, file)} ${PANEL_W}x${PANEL_H}`);
}

/**
 * The cast sheet. It holds the five lit front renders at one 466.667 px per metre scale, so the
 * three adults are 700 px and the two children are 490 px. It reads the five records and the five
 * lit front renders, and it writes no panel.
 */
async function writeSheet(root, date) {
  const castDir = path.join(root, 'out', 'chibi-sprouts', 'cast');
  const file = path.join(castDir, 'cast-sheet.png');
  const layers = [];
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i];
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
      ink: false,
    });
    layers.push({
      input: await sharp(cell.input, {
        raw: { width: cell.width, height: cell.height, channels: 4 },
      })
        .png()
        .toBuffer(),
      left: PAD + i * (SHEET_CELL_W + PAD) + cell.left,
      top: cell.top,
    });
  }
  const caption = textSvg(SHEET_W, CAPTION_H, [
    { x: 24, y: 30, size: 22, text: `Chibi Sprouts cast  |  ${date}` },
    { x: 24, y: 58, size: 20, text: [...NAMES, 'sprout-mom-kim'].join(', ') },
    {
      x: 24,
      y: 84,
      size: 20,
      text: `${SHEET_SCALE} px per metre; one baseline at row ${BASELINE}`,
    },
  ]);
  layers.push({ input: caption, left: 0, top: SHEET_H - CAPTION_H });
  mkdirSync(castDir, { recursive: true });
  await canvas(SHEET_W, SHEET_H).composite(layers).png().toFile(file);
  console.log(`sheet: ${path.relative(root, file)} ${SHEET_W}x${SHEET_H}`);
}

async function main() {
  const { asset, date, root, modes } = parseArgs(process.argv.slice(2));
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
  for (const name of cast) {
    const record = readRecord(root, name);
    const cells = await panelCells(root, name, record);
    await writePanel(root, { name, record, cells }, runDate);
  }
  if (mode !== 'asset') await writeSheet(root, runDate);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e?.message ?? String(e));
    process.exit(1);
  });
}
