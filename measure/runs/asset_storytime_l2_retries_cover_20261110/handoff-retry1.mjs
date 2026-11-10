/**
 * The retry hand-off builder (Phase 2, Task 5).
 *
 * It links the delivered PNG files into the hand-off folder, copies the manifest.json and the
 * spend log, builds the contact sheet with sharp, links the best try of each fail row into
 * not-delivered/, writes the README.md of the fail rows, and writes MANIFEST.txt.
 *
 * The PNG files are hard links, so the hand-off and the Muse folder share every inode and the
 * builder costs no disk space. It makes no provider call, no Muse call, and no network call. It
 * writes only inside the hand-off folder.
 *
 *   node measure/runs/asset_storytime_l2_retries_cover_20261110/handoff-retry1.mjs
 */
import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_retries_cover_20261110');
const MUSE_ROOT = join(ROOT, 'out/storytime/l2/unit2');
const DELIVERY = join(MUSE_ROOT, 'delivery-muse-v1-retry1');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1';
const NOT_DELIVERED = join(HANDOFF, 'not-delivered');
const SHEET_NAME = 'contact-sheet.png';
const SPEND_LOG = join(RUN, 'spend-log.tsv');

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** The 4 delivered rows, in the order of the contact sheet. */
const delivered = [
  { id: 'l2-w13-card-throw', color: 'l2-w13-card-throw-v1.png', line: 'l2-w13-card-throw-line-v1.png' },
  { id: 'l2-w14-card-windy', color: 'l2-w14-card-windy-v1.png', line: 'l2-w14-card-windy-line-v1.png' },
  { id: 'l2-w09-story-page-tom-can-see-the-mop', color: 'l2-w09-story-page-tom-can-see-the-mop-v1.png', line: 'l2-w09-story-page-tom-can-see-the-mop-line-v1.png' },
  { id: 'l2-w09-card-rice', color: 'l2-w09-card-rice-v1.png', line: 'l2-w09-card-rice-line-v1.png' },
];

/** The 5 fail rows, each with its best try and the reason it failed. */
const failRows = [
  {
    id: 'l2-w12-card-hippo',
    color: 'w12/muse/l2-w12-card-hippo-m1-color-print.png',
    line: 'w12/muse/l2-w12-card-hippo-m1-line-print-4.png',
    tries: 'Color try 1 (m1): judge pass. Line try 1: judge fail, class broken-face. Line try 2: judge pass, 9 px. Line try 3: judge pass, 9 px. Line try 4: judge pass, 9 px.',
    best: 'The color m1 of color try 1, and the line print of line try 4. The line try 4 print is 9 px wide, the widest of the judge-passing prints of the row. Line try 3 has the same width, and the later try wins the tie.',
    reason: 'Every line print of the row is under the 12 px print gate. The line try 4 passes the judge and fails the gate at 9 px. The row has no more tries.',
  },
  {
    id: 'l2-w12-card-ruler',
    color: 'w12/muse/l2-w12-card-ruler-m1-color-print.png',
    line: 'w12/muse/l2-w12-card-ruler-m1-line-print-4.png',
    tries: 'Color try 1 (m1): judge pass. Line try 1: judge pass, 5 px. Line try 2: judge pass, 7 px. Line try 3: judge pass, 8 px. Line try 4: judge pass, 8 px.',
    best: 'The color m1 of color try 1, and the line print of line try 4. The line try 4 print is 8 px wide, the widest of the judge-passing prints of the row. Line try 3 has the same width, and the later try wins the tie.',
    reason: 'Every line print of the row is under the 12 px print gate. The line try 4 passes the judge and fails the gate at 8 px. The row has no more tries.',
  },
  {
    id: 'l2-w13-card-clap',
    color: 'w13/muse/l2-w13-card-clap-m1-color-print.png',
    line: 'w13/muse/l2-w13-card-clap-m1-line-print-3.png',
    tries: 'Color try 1 (m1): judge pass. Line try 1: judge pass, 8 px. Line try 2: judge pass, 10 px. Line try 3: judge pass, 11 px. Line try 4: judge pass, 10 px.',
    best: 'The color m1 of color try 1, and the line print of line try 3. The line try 3 print is 11 px wide, the widest of the judge-passing prints of the row.',
    reason: 'Every line print of the row is under the 12 px print gate. The widest of them is 11 px at line try 3. The row has no more tries.',
  },
  {
    id: 'l2-w14-card-cold',
    color: 'w14/muse/l2-w14-card-cold-m1-color-print.png',
    line: 'w14/muse/l2-w14-card-cold-m1-line-print-4.png',
    tries: 'Color try 1 (m1): judge pass. Line try 1: judge pass, 8 px. Line try 2: judge pass, 9 px. Line try 3: judge pass, 9 px. Line try 4: judge pass, 10 px.',
    best: 'The color m1 of color try 1, and the line print of line try 4. The line try 4 print is 10 px wide, the widest of the judge-passing prints of the row.',
    reason: 'Every line print of the row is under the 12 px print gate. The line try 4 passes the judge and fails the gate at 10 px. The row has no more tries.',
  },
  {
    id: 'l2-w10-story-page-put-on-your-hat-pip',
    color: 'w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-color-print.png',
    line: 'w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-line-print.png',
    tries: 'Color try 2 (m1): judge fail. Color try 3 (m2): judge fail, then second judge pass. Color try 4: the call failed at the transport level, 0 USD, no picture. Color try 5 (m3): judge pass. Line try 1 (m2): judge fail, class wrong-or-missing-prop. Line try 2 (m3): judge fail, class wrong-character.',
    best: 'The color m3 of color try 5, the latest color that passed the judge, and the line print of line try 2. No line print of the row passed the judge, so the widest line print is the best one. The line try 2 print is 13 px wide and the line try 1 print is 12 px wide.',
    reason: 'The line try 2 fails the judge with the class wrong-character. Teacher Kim has big curly hair, and the cast gives smooth hair in a low ponytail. The second judge fails the same file with the same class. The row has no more tries.',
  },
];

if (existsSync(HANDOFF) && readdirSync(HANDOFF).length > 0) {
  console.error(`refused: the hand-off folder ${HANDOFF} holds files; the builder will not overwrite them.`);
  process.exit(1);
}
mkdirSync(NOT_DELIVERED, { recursive: true });

// The 8 delivered PNG files are hard links, so the hand-off and the delivery share every inode.
const linked = [];
for (const row of delivered) {
  for (const name of [row.color, row.line]) {
    const source = join(DELIVERY, name);
    if (!existsSync(source)) throw new Error(`the delivered file ${source} is missing`);
    const target = join(HANDOFF, name);
    linkSync(source, target);
    if (statSync(source).ino !== statSync(target).ino) {
      throw new Error(`the hand-off file ${name} is not a hard link of the delivery file.`);
    }
    linked.push(name);
  }
}
copyFileSync(join(DELIVERY, 'manifest.json'), join(HANDOFF, 'manifest.json'));
copyFileSync(SPEND_LOG, join(HANDOFF, 'spend-log.tsv'));
console.log(`Linked ${linked.length} delivered PNG files, and copied manifest.json and spend-log.tsv to ${HANDOFF}.`);

// The contact sheet: one row per delivered picture, the color print beside the line print, the
// row id under the pair.
const CELL = 300;
const PAD = 16;
const GAP = 12;
const LABEL = 30;
const PAIR = CELL * 2 + GAP;
const WIDTH = PAD * 2 + PAIR;
const HEIGHT = PAD * 2 + delivered.length * (CELL + LABEL + PAD);
const composites = [];
for (const [index, row] of delivered.entries()) {
  const top = PAD + index * (CELL + LABEL + PAD);
  for (const [offset, name] of [row.color, row.line].entries()) {
    const tile = await sharp(join(HANDOFF, name))
      .resize(CELL, CELL, { fit: 'contain', background: '#ffffff' })
      .png()
      .toBuffer();
    composites.push({ input: tile, left: PAD + offset * (CELL + GAP), top });
  }
  const label = `<svg width="${PAIR}" height="${LABEL}"><text x="${PAIR / 2}" y="21" font-family="DejaVu Sans, sans-serif" font-size="15" fill="#222222" text-anchor="middle">${row.id}</text></svg>`;
  composites.push({ input: Buffer.from(label), left: PAD, top: top + CELL });
}
const sheet = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' } })
  .composite(composites)
  .png()
  .toBuffer();
writeFileSync(join(HANDOFF, SHEET_NAME), sheet);
console.log(`Contact sheet: ${join(HANDOFF, SHEET_NAME)} at ${WIDTH} x ${HEIGHT}, ${delivered.length} pairs.`);

// not-delivered holds the best try of each fail row, as hard links of the Muse prints.
const notDelivered = [];
for (const row of failRows) {
  for (const relative of [row.color, row.line]) {
    const source = join(MUSE_ROOT, relative);
    if (!existsSync(source)) throw new Error(`the print ${source} is missing`);
    const target = join(NOT_DELIVERED, relative.split('/').pop());
    linkSync(source, target);
    if (statSync(source).ino !== statSync(target).ino) {
      throw new Error(`the not-delivered file ${target} is not a hard link of the Muse print.`);
    }
    notDelivered.push(relative.split('/').pop());
  }
}

const readme = [
  '# Rows not delivered in the retry',
  '',
  'These 5 rows have no delivery entry in the retry delivery. Each file is a hard link of the best',
  'print of the row. The judge result is model evidence, not acceptance. No person has accepted',
  'any picture of this folder.',
  '',
  ...failRows.flatMap((row) => [
    `## ${row.id}`,
    '',
    `Tries: ${row.tries}`,
    '',
    `Best try: ${row.best}`,
    '',
    `Why it failed: ${row.reason}`,
    '',
    `- Color: not-delivered/${row.color.split('/').pop()}`,
    `- Line: not-delivered/${row.line.split('/').pop()}`,
    '',
  ]),
].join('\n');
writeFileSync(join(NOT_DELIVERED, 'README.md'), readme);
console.log(`not-delivered: ${notDelivered.length} hard links and a README.md with ${failRows.length} sections.`);

// MANIFEST.txt holds one hash line and one byte-size line for every file but itself.
const files = [];
const walk = (folder, prefix) => {
  for (const name of readdirSync(folder).sort()) {
    const full = join(folder, name);
    if (statSync(full).isDirectory()) walk(full, `${prefix}${name}/`);
    else files.push(`${prefix}${name}`);
  }
};
walk(HANDOFF, '');
files.sort();
const hashed = files.map((name) => {
  const bytes = readFileSync(join(HANDOFF, name));
  return { name, sha256: sha256(bytes), size: bytes.length };
});
const manifestLines = [
  ...hashed.map((item) => `${item.sha256}  ${item.name}`),
  ...hashed.map((item) => `# ${item.size} ${item.name}`),
  '',
  '# Retry delivery, Storytime Level 2 unit 2 (model evidence, not acceptance)',
  '# Rows delivered: 4 of 9 open rows. The other 5 rows are in not-delivered/ and README.md names each row and why.',
  '# The judge files and the print gate records of this track hold the results.',
  '',
  '# Check the files with this command (run it in this folder):',
  "# grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -",
  '',
];
writeFileSync(join(HANDOFF, 'MANIFEST.txt'), manifestLines.join('\n'));
console.log(`MANIFEST.txt: ${join(HANDOFF, 'MANIFEST.txt')} with ${hashed.length} hash lines and ${hashed.length} size lines.`);
