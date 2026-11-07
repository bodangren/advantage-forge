/**
 * The family-word handoff builder (Phase 2, Task 6).
 *
 * It copies the 19 delivered PNG files and the manifest.json to the handoff folder, writes
 * MANIFEST.txt in the form of the card handoff manifest, and builds the contact sheet. It makes
 * no provider call and no Muse call. It writes only inside the handoff folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_family_words_20261107/make-handoff.mts
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_family_words_20261107');
const DELIVERY = join(ROOT, 'out/storytime/l2/unit1/family-words/delivery-muse-v1');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures';
const SHEET_NAME = 'storytime-l2-family-word-pictures-contact-sheet.png';

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

const list = JSON.parse(readFileSync(join(RUN, 'approvals.json'), 'utf8')) as {
  entries: Array<{ rowId: string; version: number; colorPrint: string; text: string }>;
};

mkdirSync(HANDOFF, { recursive: true });

// Copy the delivered files and the manifest. The copies are byte for byte.
const copied: Array<{ name: string; sha256: string }> = [];
for (const entry of list.entries) {
  const name = `${entry.rowId}-v1.png`;
  copyFileSync(join(DELIVERY, name), join(HANDOFF, name));
  copied.push({ name, sha256: sha256(readFileSync(join(HANDOFF, name))) });
}
copyFileSync(join(DELIVERY, 'manifest.json'), join(HANDOFF, 'manifest.json'));
const manifestSha256 = sha256(readFileSync(join(HANDOFF, 'manifest.json')));
console.log(`Copied ${copied.length} PNG files and manifest.json to ${HANDOFF}.`);

// The corner record of the delivered files.
const cornerLines = readFileSync(join(RUN, 'corner-record.txt'), 'utf8').split('\n');
const belowStart = cornerLines.findIndex((line) => line.startsWith('color files below 250:'));
const cornerCount = Number(cornerLines[belowStart]?.split(':')[1]?.trim() ?? '0');
const cornerList = cornerLines.slice(belowStart + 1).filter((line) => line.trim().length > 0);

// The contact sheet: one cell per delivered row, the word under the card, 5 cells per row.
const CELL = 260;
const PAD = 20;
const LABEL = 46;
const COLS = 5;
const rows = Math.ceil(copied.length / COLS);
const WIDTH = PAD * 2 + COLS * CELL + (COLS - 1) * PAD;
const HEIGHT = PAD * 2 + rows * (CELL + LABEL) + (rows - 1) * PAD;

const composites: Array<{ input: Buffer; left: number; top: number }> = [];
for (const [index, item] of copied.entries()) {
  const entry = list.entries[index]!;
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = PAD + col * (CELL + PAD);
  const top = PAD + row * (CELL + LABEL + PAD);
  const tile = await sharp(join(HANDOFF, item.name)).resize(CELL, CELL, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  composites.push({ input: tile, left, top });
  const label = `<svg width="${CELL}" height="${LABEL}"><text x="${CELL / 2}" y="30" font-family="DejaVu Sans, sans-serif" font-size="26" fill="#222222" text-anchor="middle">${entry.text}</text></svg>`;
  composites.push({ input: Buffer.from(label), left, top: top + CELL });
}
const sheet = await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' },
})
  .composite(composites)
  .png()
  .toBuffer();
writeFileSync(join(HANDOFF, SHEET_NAME), sheet);
console.log(`Contact sheet: ${join(HANDOFF, SHEET_NAME)} at ${WIDTH} x ${HEIGHT}, ${copied.length} cells, ${COLS} per row.`);

// The MANIFEST.txt in the form of the card handoff manifest. The file lines hold the SHA-256
// and the name only, so the check command of the card track reads every line.
const ids = list.entries.map((entry) => entry.rowId).join(', ');
const now = new Date();
const ict = new Date(now.getTime() + 7 * 60 * 60 * 1000);
const dateLine = `${ict.toISOString().slice(0, 10)} ${ict.toISOString().slice(11, 16)} ICT`;

const manifestLines = [
  'Storytime Advantage Level 2 Unit 1 family-word pictures: 19 of the 19 family-word rows of the',
  'PM request of 2026-11-07. Each row has one color file. The pictures are color only.',
  '',
  'source-repo: /home/daniebo/Desktop/advantage-forge',
  'source-paths: out/storytime/l2/unit1/family-words/delivery-muse-v1/',
  'source-commit: ee11adf4 (the maker commit before the handoff; PNG files stay out of git)',
  'picture-ids: ' + ids,
  'judge-result-files: measure/runs/asset_storytime_l2_family_words_20261107/ (calibration-record.json, judge-fw-r1-color.json, judge-fw-r1-color-arms-second.json, judge-fw-r2-color-arms.json); the family row reuses the color print of the card track, whose judge pass is in measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color.json',
  'contact-sheet: ' + SHEET_NAME,
  'date: ' + dateLine,
  'sender: advantage-forge (Forge Green, Phase 2 maker)',
  '',
  'Files (SHA-256 and name; every file is 1500 x 1500 px, 8-bit PNG, no alpha channel):',
  ...copied.map((item) => `${item.sha256}  ${item.name}`),
  '',
  'The result files live in measure/runs/asset_storytime_l2_family_words_20261107/ of the source repo.',
  'The judge was claude-code/claude-sonnet-5-5#high with the fixed prompt',
  'docs/storytime/l2-unit1/judge/judge-prompt.md version 6.',
  'The bar is the text of Daniel of 2026-11-01 14:15 ICT.',
  'No person review yet. Workbooks checks the pictures.',
  '',
  'failed rows: none',
  '',
  'corner note: ' + cornerCount + ' color files have a corner below 250 (class C white-corner rule):',
  ...cornerList.map((line) => line),
  'Nine of these files hold the low value at the bottom-left corner only. The corners are a faint',
  'near-white from the soft shadow of the render. The ears file holds a faint gray gradient at all',
  'four corners, and its lowest value is 215.',
  'This is a report item, not a delivery gate. Workbooks decides at its check.',
  '',
  'spend: 0.19 USD, 19 Muse calls, cap 1.60 USD',
  '',
  'This delivery is model evidence, not acceptance. Daniel sees the pictures in his 11-16 check.',
  '',
  'Check the files with this command (run it in this folder):',
  "grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -",
  '',
];
writeFileSync(join(HANDOFF, 'MANIFEST.txt'), manifestLines.join('\n'));
console.log(`MANIFEST.txt: ${join(HANDOFF, 'MANIFEST.txt')}`);
console.log(`manifest.json sha256: ${manifestSha256}`);
console.log(`color files below 250: ${cornerCount}`);
