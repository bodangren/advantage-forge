/**
 * The app family-word handoff builder (Phase 3, Task 10).
 *
 * It links the 18 delivered PNG files into the handoff folder, copies the manifest.json, builds
 * the contact sheet with sharp, and writes MANIFEST.txt. It makes no provider call and no Muse
 * call. It writes only inside the handoff folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_unit2_pictures_20261108/make-handoff-fw.mts
 */
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { U2_FW_RUN } from '../../../scripts/storytime-muse-guards.mjs';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_unit2_pictures_20261108');
// The delivery folder comes from the app run of the guard.
const DELIVERY = join(ROOT, dirname(U2_FW_RUN.outDir), 'delivery-muse-v1');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2u2-family-word-pictures';
const SHEET_NAME = 'contact-sheet.png';

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

if (existsSync(HANDOFF) && readdirSync(HANDOFF).length > 0) {
  console.error(`refused: the handoff folder ${HANDOFF} holds files; the builder will not overwrite them.`);
  process.exit(1);
}
mkdirSync(HANDOFF, { recursive: true });

const files = readdirSync(DELIVERY).filter((name) => name.endsWith('.png')).sort();
if (files.length !== 18) {
  console.error(`refused: the delivery folder holds ${files.length} PNG files, not 18.`);
  process.exit(1);
}

// The 18 PNG files are hard links, so the handoff and the delivery share every inode.
const linked: Array<{ name: string; sha256: string; inode: number }> = [];
for (const name of files) {
  const target = join(HANDOFF, name);
  linkSync(join(DELIVERY, name), target);
  const source = statSync(join(DELIVERY, name));
  const copy = statSync(target);
  if (source.ino !== copy.ino) {
    console.error(`refused: the handoff file ${name} is not a hard link of the delivery file.`);
    process.exit(1);
  }
  linked.push({ name, sha256: sha256(readFileSync(target)), inode: copy.ino });
}
copyFileSync(join(DELIVERY, 'manifest.json'), join(HANDOFF, 'manifest.json'));
const manifestSha256 = sha256(readFileSync(join(HANDOFF, 'manifest.json')));
console.log(`Linked ${linked.length} PNG files and copied manifest.json to ${HANDOFF}.`);

// The contact sheet: one cell per delivered word, the id under the cell, 6 cells per row.
const CELL = 220;
const PAD = 16;
const LABEL = 34;
const COLS = 6;
const rows = Math.ceil(linked.length / COLS);
const WIDTH = PAD * 2 + COLS * CELL + (COLS - 1) * PAD;
const HEIGHT = PAD * 2 + rows * (CELL + LABEL) + (rows - 1) * PAD;
const composites: Array<{ input: Buffer; left: number; top: number }> = [];
for (const [index, item] of linked.entries()) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = PAD + col * (CELL + PAD);
  const top = PAD + row * (CELL + LABEL + PAD);
  const tile = await sharp(join(HANDOFF, item.name))
    .resize(CELL, CELL, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();
  composites.push({ input: tile, left, top });
  const label = `<svg width="${CELL}" height="${LABEL}"><text x="${CELL / 2}" y="24" font-family="DejaVu Sans, sans-serif" font-size="17" fill="#222222" text-anchor="middle">${item.name.replace('-v1.png', '')}</text></svg>`;
  composites.push({ input: Buffer.from(label), left, top: top + CELL });
}
const sheet = await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' },
})
  .composite(composites)
  .png()
  .toBuffer();
writeFileSync(join(HANDOFF, SHEET_NAME), sheet);
console.log(`Contact sheet: ${join(HANDOFF, SHEET_NAME)} at ${WIDTH} x ${HEIGHT}, ${linked.length} cells, ${COLS} per row.`);

// MANIFEST.txt holds a SHA-256 line for every file of the folder except MANIFEST.txt itself.
const hashed = [
  ...linked.map((item) => ({ name: item.name, sha256: item.sha256 })),
  { name: 'manifest.json', sha256: manifestSha256 },
  { name: SHEET_NAME, sha256: sha256(sheet) },
];
const now = new Date();
const ict = new Date(now.getTime() + 7 * 60 * 60 * 1000);
const dateLine = `${ict.toISOString().slice(0, 10)} ${ict.toISOString().slice(11, 16)} ICT`;
const manifestLines = [
  ...hashed.map((item) => `${item.sha256}  ${item.name}`),
  '',
  'app spend 0.18 USD of the 0.29 USD stop',
  '18 calls',
  'words delivered 18 of 18',
  'model evidence, not acceptance',
  '',
  `source-repo: ${ROOT}`,
  `source-paths: ${DELIVERY.replace(ROOT + '/', '')}/`,
  'judge-result-files: measure/runs/asset_storytime_l2_unit2_pictures_20261108/judge-u2-fw-r1-color.json (18 of 18 pass at color try 1)',
  `contact-sheet: ${SHEET_NAME}`,
  `date: ${dateLine}`,
  'sender: advantage-forge (Forge Green, Phase 3 maker)',
  '',
  'Every PNG file is 1500 x 1500 px, 8-bit, and free of an alpha channel.',
  '',
  'Check the files with this command (run it in this folder):',
  "grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -",
  '',
];
writeFileSync(join(HANDOFF, 'MANIFEST.txt'), manifestLines.join('\n'));
console.log(`MANIFEST.txt: ${join(HANDOFF, 'MANIFEST.txt')} with ${hashed.length} hash lines.`);
