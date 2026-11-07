/**
 * The card handoff builder for delivery v2 (Phase 2, Task 6).
 *
 * It copies the 30 delivered rows and the ham color fallback to the handoff folder, replaces
 * manifest.json with the v2 one, writes MANIFEST.txt in the form of the card handoff manifest,
 * and builds the 31-cell contact sheet. It makes no provider call and no Muse call. It writes
 * only inside the handoff folder and this run folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_card_line_retry_20261107/make-handoff-v2.mts
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_card_line_retry_20261107');
const MUSE = join(ROOT, 'out/storytime/l2/unit1/cards/muse');
const V2 = join(ROOT, 'out/storytime/l2/unit1/cards/delivery-muse-v2');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2-card-pictures';
const SHEET_NAME = 'storytime-l2-card-pictures-contact-sheet.png';
const LOG = join(RUN, 'handoff-v2.log');
const HAM_BEST = 'out/storytime/l2/unit1/cards/muse/l2-w04-card-ham-m1-line-print-5.png';

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');
const out: string[] = [];
const say = (line: string): void => {
  out.push(line);
  console.log(line);
};

const approvals = JSON.parse(readFileSync(join(RUN, 'approved-v2.json'), 'utf8')) as {
  entries: Array<{ rowId: string; colorPrint: string; linePrint: string }>;
};
const old = readFileSync(join(RUN, 'handoff-before', 'MANIFEST.txt'), 'utf8').split('\n');
const oldLine = (prefix: string): string => old.find((line) => line.startsWith(prefix)) ?? '';

// Copy the family pair and the ham color fallback; keep the 58 old files as they are.
const familyId = 'l2-w04-card-family';
const copied: Array<{ name: string; sha256: string }> = [];
for (const entry of approvals.entries) {
  const pair = entry.rowId === familyId;
  if (!pair) continue;
  for (const [source, name] of [
    [entry.colorPrint, `${entry.rowId}-v1.png`],
    [entry.linePrint, `${entry.rowId}-line-v1.png`],
  ] as const) {
    copyFileSync(join(MUSE, source), join(HANDOFF, name));
    copied.push({ name, sha256: sha256(readFileSync(join(HANDOFF, name))) });
  }
}
copyFileSync(join(MUSE, 'l2-w04-card-ham-m1-color-print.png'), join(HANDOFF, 'l2-w04-card-ham-v1.png'));
copied.push({ name: 'l2-w04-card-ham-v1.png', sha256: sha256(readFileSync(join(HANDOFF, 'l2-w04-card-ham-v1.png'))) });
copyFileSync(join(V2, 'manifest.json'), join(HANDOFF, 'manifest.json'));
const manifestSha256 = sha256(readFileSync(join(HANDOFF, 'manifest.json')));
say(`Copied the family pair and the ham color fallback; manifest.json SHA-256 ${manifestSha256}.`);

// The 61 file lines: 30 approved rows (color, line) in approval order, then the ham color file.
const fileLines: Array<{ name: string; sha256: string }> = [];
for (const entry of approvals.entries) {
  for (const name of [`${entry.rowId}-v1.png`, `${entry.rowId}-line-v1.png`]) {
    fileLines.push({ name, sha256: sha256(readFileSync(join(HANDOFF, name))) });
  }
}
fileLines.push({ name: 'l2-w04-card-ham-v1.png', sha256: sha256(readFileSync(join(HANDOFF, 'l2-w04-card-ham-v1.png'))) });
say(`Handoff PNG files: ${fileLines.length}.`);

// Every file is 1500 x 1500, 8-bit, no alpha.
for (const file of fileLines) {
  const meta = await sharp(join(HANDOFF, file.name)).metadata();
  if (meta.width !== 1500 || meta.height !== 1500 || (meta.channels !== 1 && meta.channels !== 3) || meta.hasAlpha || meta.depth !== 'uchar') {
    throw new Error(`${file.name}: ${meta.width} x ${meta.height}, channels ${meta.channels}, alpha ${meta.hasAlpha}, depth ${meta.depth}`);
  }
}
say('Every file is 1500 x 1500 px, 8-bit, no alpha channel.');

// Labels from the card specs.
const label = (rowId: string): string => {
  const spec = JSON.parse(readFileSync(join(ROOT, 'docs/storytime/l2-unit1/cards', `${rowId}.json`), 'utf8')) as { text: string };
  return spec.text;
};

// The contact sheet: 31 cells. A delivered row holds its color and line tiles; the ham cell holds
// its color tile and the words "line art failed".
const TILE = 240;
const GAP = 10;
const CELL_W = TILE * 2 + GAP;
const CELL_H = TILE;
const LABEL_H = 46;
const PAD = 24;
const COLS = 3;
const cellsCount = approvals.entries.length + 1;
const rowsCount = Math.ceil(cellsCount / COLS);
const WIDTH = PAD * 2 + COLS * CELL_W + (COLS - 1) * PAD;
const HEIGHT = PAD * 2 + rowsCount * (CELL_H + LABEL_H) + (rowsCount - 1) * PAD;

const composites: Array<{ input: Buffer; left: number; top: number }> = [];
const tile = async (file: string): Promise<Buffer> =>
  sharp(file).resize(TILE, TILE, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
for (const [index, entry] of approvals.entries.entries()) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = PAD + col * (CELL_W + PAD);
  const top = PAD + row * (CELL_H + LABEL_H + PAD);
  composites.push({ input: await tile(join(HANDOFF, `${entry.rowId}-v1.png`)), left, top });
  composites.push({ input: await tile(join(HANDOFF, `${entry.rowId}-line-v1.png`)), left: left + TILE + GAP, top });
  const svg = `<svg width="${CELL_W}" height="${LABEL_H}"><text x="${CELL_W / 2}" y="30" font-family="DejaVu Sans, sans-serif" font-size="24" fill="#222222" text-anchor="middle">${label(entry.rowId)}</text></svg>`;
  composites.push({ input: Buffer.from(svg), left, top: top + CELL_H });
}
const hamIndex = approvals.entries.length;
const hamCol = hamIndex % COLS;
const hamRow = Math.floor(hamIndex / COLS);
const hamLeft = PAD + hamCol * (CELL_W + PAD);
const hamTop = PAD + hamRow * (CELL_H + LABEL_H + PAD);
composites.push({ input: await tile(join(HANDOFF, 'l2-w04-card-ham-v1.png')), left: hamLeft, top: hamTop });
const failedSvg = `<svg width="${TILE}" height="${TILE}"><rect x="1" y="1" width="${TILE - 2}" height="${TILE - 2}" fill="#ffffff" stroke="#999999"/><text x="${TILE / 2}" y="${TILE / 2}" font-family="DejaVu Sans, sans-serif" font-size="22" fill="#884444" text-anchor="middle">line art failed</text></svg>`;
composites.push({ input: Buffer.from(failedSvg), left: hamLeft + TILE + GAP, top: hamTop });
const hamLabel = `<svg width="${CELL_W}" height="${LABEL_H}"><text x="${CELL_W / 2}" y="30" font-family="DejaVu Sans, sans-serif" font-size="24" fill="#222222" text-anchor="middle">${label('l2-w04-card-ham')}</text></svg>`;
composites.push({ input: Buffer.from(hamLabel), left: hamLeft, top: hamTop + CELL_H });

const sheet = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' } })
  .composite(composites)
  .png()
  .toBuffer();
writeFileSync(join(HANDOFF, SHEET_NAME), sheet);
say(`Contact sheet: ${join(HANDOFF, SHEET_NAME)} at ${WIDTH} x ${HEIGHT}, ${cellsCount} cells, ${COLS} per row.`);

// The notes of the old manifest that still hold.
const passStart = old.findIndex((line) => line.startsWith('Judge results that passed'));
const passEnd = old.findIndex((line) => line.startsWith('The result files live'));
const passBlock = old.slice(passStart, passEnd).filter((line, i, all) => !(i === all.length - 1 && line === ''));
const cornerStart = old.findIndex((line) => line.startsWith('corner note:'));
const spendIndex = old.findIndex((line) => line.startsWith('spend:'));
const cornerBlock = old.slice(cornerStart, spendIndex);
const tailStart = old.findIndex((line) => line.startsWith('The result files live'));
const tail = old.slice(tailStart, old.findIndex((line) => line.startsWith('failed rows:')));

const ids = approvals.entries.map((entry) => entry.rowId).join(', ');
const now = new Date();
const ict = new Date(now.getTime() + 7 * 60 * 60 * 1000);
const dateLine = `${ict.toISOString().slice(0, 10)} ${ict.toISOString().slice(11, 16)} ICT`;

const cornerText = cornerBlock
  .join('\n')
  .replace('corner note: 22 color files', 'corner note: 23 color files')
  .replace('l2-w04-card-brother-v1.png 249.', 'l2-w04-card-brother-v1.png 249; l2-w04-card-family-v1.png 247.')
  .split('\n');

const manifestLines = [
  'Storytime Advantage Level 2 Unit 1 card pictures: 30 of the 31 card rows of the',
  'Workbooks picture list v7. Each delivered row has one color file and one line-art file.',
  'The ham row is here as a color file only; the reason is named below.',
  '',
  'source-repo: /home/daniebo/Desktop/advantage-forge',
  'source-paths: out/storytime/l2/unit1/cards/delivery-muse-v2/',
  'source-commit: 35b3785e (the maker commit before the delivery; PNG files stay out of git)',
  'picture-ids: ' + ids,
  oldLine('picture-list-row:'),
  `judge-result-files: measure/runs/asset_storytime_l2_cards_20261106/ (calibration-record.json, judge-cards-cards-r1-color.json, judge-cards-cards-r1-color-goodbye-second.json, judge-cards-cards-r1-line.json, judge-cards-cards-r1-line-car-second.json, judge-cards-cards-r1-line-ham-second.json, judge-cards-cards-r2-line-t1.json, judge-cards-cards-r2-line-t2.json, judge-cards-cards-r2-line-t2-ham-second.json, judge-cards-cards-r3-line-t3.json, judge-cards-cards-r3-line-t3-ham-second.json, judge-cards-cards-r4-line-t2.json); measure/runs/asset_storytime_l2_card_line_retry_20261107/ (judge-cards-retry-family-t4.json, judge-cards-retry-ham-t4.json, judge-cards-retry-ham-t4-second.json, judge-cards-retry-ham-t5.json, judge-cards-retry-ham-t5-second.json)`,
  'contact-sheet: ' + SHEET_NAME,
  'date: ' + dateLine,
  'sender: advantage-forge (Forge Green, Phase 2 maker)',
  '',
  'Files (SHA-256 and name; every file is 1500 x 1500 px, 8-bit PNG, no alpha channel):',
  ...fileLines.map((file) => `${file.sha256}  ${file.name}`),
  '',
  'The 58 files of the 29 old rows hold the same bytes as in delivery-muse-v1. The family row',
  'adds its color print and its line print of try 4 (12 px of stroke width). The ham row adds its',
  'color print only. Each line print is the plain Muse print of the judged line try, not a',
  'despeckled file, and every line print measures at least 12 px of stroke width.',
  '',
  ...passBlock,
  'l2-w04-card-family  color judge-cards-cards-r1-color.json (m1)  line judge-cards-retry-family-t4.json (line try 4)',
  '',
  ...tail,
  '',
  'failed rows: l2-w04-card-ham (color m1 judge pass; line tries 1 to 3 and the retries 4 and 5',
  'each failed by two judges; the slice reads as a plate, a pizza, a pie, a lid, or a bun; not',
  'delivered; this folder holds its color print only)',
  `color only; the line art failed after 5 tries (best try 5, ${HAM_BEST}); Workbooks makes the greyscale fallback`,
  '',
  ...cornerText,
  '',
  'spend: 0.98 USD, 99 cost rows (98 paid calls and 1 zero-cost network failure), cap 1.60 USD',
  '',
  'This delivery is model evidence, not acceptance. Daniel sees the pictures in his 11-16 check.',
  '',
  'Check the files with this command (run it in this folder):',
  "grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -",
  '',
];
writeFileSync(join(HANDOFF, 'MANIFEST.txt'), manifestLines.join('\n'));
say(`MANIFEST.txt: ${join(HANDOFF, 'MANIFEST.txt')}`);
say(`File lines: ${fileLines.length}; manifest.json SHA-256: ${manifestSha256}.`);
say(`Ham fallback: l2-w04-card-ham-v1.png from ${MUSE}/l2-w04-card-ham-m1-color-print.png.`);

writeFileSync(LOG, out.join('\n') + '\n');
console.log(`Log: ${LOG}`);
