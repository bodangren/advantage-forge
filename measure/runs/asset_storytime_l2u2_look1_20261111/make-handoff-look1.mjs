/**
 * The look1 hand-off builder (Phase 1, Task 4 Part 2).
 *
 * It builds /home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/:
 * - hard links of the 4 delivered PNG files of out/storytime/l2/unit2/delivery-muse-v1-look1/;
 * - a copy of its manifest.json;
 * - a copy of measure/runs/asset_storytime_l2u2_look1_20261111/spend-log.tsv;
 * - contact-sheet.png with sharp, 2 rows, the color print beside the line print;
 * - README.md with the PM order, the owner words of D2, the T-shirt files, the tries, the spend,
 *   and the unchanged folders;
 * - MANIFEST.txt last, in the form of the repair1 hand-off MANIFEST.txt.
 *
 * The PNG files are hard links, so the hand-off and the delivery share every inode and the builder
 * costs no disk space. It makes no provider call, no Muse call, and no network call. It reads no
 * API key. It writes only inside the hand-off folder.
 *
 *   node measure/runs/asset_storytime_l2u2_look1_20261111/make-handoff-look1.mjs
 */
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2u2_look1_20261111');
const SPEC = join(ROOT, 'measure/tracks/asset_storytime_l2u2_look1_20261111/spec.md');
const DELIVERY = join(ROOT, 'out/storytime/l2/unit2/delivery-muse-v1-look1');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1';
const SHEET_NAME = 'contact-sheet.png';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sha256OfFile = (path) => sha256(readFileSync(path));

if (existsSync(HANDOFF)) {
  console.error(`refusing to run: ${HANDOFF} already exists`);
  process.exit(1);
}
mkdirSync(HANDOFF, { recursive: true });

// The 2 rows of the look1 delivery, in the order of the contact sheet.
const rows = [
  {
    id: 'l2-w10-story-page-put-on-your-hat-pip',
    color: 'l2-w10-story-page-put-on-your-hat-pip-v1.png',
    line: 'l2-w10-story-page-put-on-your-hat-pip-line-v1.png',
  },
  {
    id: 'l2-w10-story-page-put-on-your-t-shirt',
    color: 'l2-w10-story-page-put-on-your-t-shirt-v1.png',
    line: 'l2-w10-story-page-put-on-your-t-shirt-line-v1.png',
  },
];

// 1. Hard links of the 4 delivered PNG files.
for (const row of rows) {
  for (const name of [row.color, row.line]) {
    const source = join(DELIVERY, name);
    if (!existsSync(source)) throw new Error(`the delivered file ${source} is missing`);
    const target = join(HANDOFF, name);
    linkSync(source, target);
    if (statSync(source).ino !== statSync(target).ino) {
      throw new Error(`the hand-off file ${name} is not a hard link of the delivery file.`);
    }
  }
}
console.log(`Linked ${rows.length * 2} delivered PNG files.`);

// 2. Copies of manifest.json and the spend log.
copyFileSync(join(DELIVERY, 'manifest.json'), join(HANDOFF, 'manifest.json'));
copyFileSync(join(RUN, 'spend-log.tsv'), join(HANDOFF, 'spend-log.tsv'));
console.log('Copied manifest.json and spend-log.tsv.');

// 3. The contact sheet: 2 rows, the color print beside the line print, the row id under the pair.
const CELL = 300;
const PAD = 16;
const GAP = 12;
const LABEL = 30;
const PAIR = CELL * 2 + GAP;
const WIDTH = PAD * 2 + PAIR;
const HEIGHT = PAD * 2 + rows.length * (CELL + LABEL + PAD);
const composites = [];
for (const [index, row] of rows.entries()) {
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
console.log(`Contact sheet: ${join(HANDOFF, SHEET_NAME)} at ${WIDTH} x ${HEIGHT}, ${rows.length} pairs.`);

// 4. The words of the PM order, of the owner record, and of the spend log come from their source
// files, so each text is exact.
const specText = readFileSync(SPEC, 'utf8');
const pmOrderLine = specText.split('\n').find((line) => line.startsWith('> PM ORDER'));
if (!pmOrderLine) throw new Error('the PM order of D1 is missing from the spec');
const pmOrder = pmOrderLine.replace(/^> /, '');

const owner = JSON.parse(readFileSync(join(RUN, 'owner-look1.json'), 'utf8'));
const ownerWords = owner.ownerWords;
const ownerSource = owner.source;

const spendText = readFileSync(join(RUN, 'spend-log.tsv'), 'utf8');
const spendLines = spendText.split('\n').filter((line) => line.includes('\tmuse\t'));
if (spendLines.length !== 2) throw new Error(`the spend log holds ${spendLines.length} Muse lines, not 2`);

const stateText = readFileSync(join(RUN, 'folder-state-look1-after.txt'), 'utf8');
const stateRows = stateText
  .split(/^folder: /m)
  .slice(1)
  .map((block) => ({
    folder: block.slice(0, block.indexOf('\n')).trim(),
    files: /files: (\d+)/.exec(block)[1],
    sha: /state sha256: ([0-9a-f]{64})/.exec(block)[1],
  }));
if (stateRows.length !== 6) throw new Error(`the folder state holds ${stateRows.length} folders, not 6`);

const HAT_COLOR_SHA = '6db86851b359760ea88e9feb67cf2bc784720ac4466abc5419af6f1dfff6bdff';
const HAT_LINE_SHA = '1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1';
const TSHIRT_COLOR_OLD = '9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4';
const TSHIRT_LINE_OLD = '71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e';
const TSHIRT_COLOR_NEW = '8e1baee103a536b26071781754118ff757072a75a5a13837ada6439c2dc406b2';
const TSHIRT_LINE_NEW = '675a7ef4d25dcc22f7533c1caf0296c9fdd5abf1773972b5531a4c8403f514d7';

const readme = [
  '# Storytime Level 2 unit 2 book pictures, look1',
  '',
  '## What the folder is',
  '',
  'This folder holds the 2 delivery jobs of the look1 order of the PM. The PM order of D1, quoted',
  'word for word:',
  '',
  `> ${pmOrder}`,
  '',
  'The manifest.json of this folder is the manifest of',
  'out/storytime/l2/unit2/delivery-muse-v1-look1/. It holds 2 delivery jobs:',
  'l2-w10-story-page-put-on-your-hat-pip and l2-w10-story-page-put-on-your-t-shirt.',
  '',
  'The contact sheet contact-sheet.png has 2 rows. The first row is the hat-pip row and the second',
  'row is the T-shirt row. Each row has the color print beside the line print, and the row id under',
  'the pair.',
  '',
  'The 4 PNG files of this folder are hard links of the delivered files. The delivery folder and this',
  'folder share every inode.',
  '',
  '## The hat-pip row',
  '',
  `The owner words, ${ownerSource}:`,
  '',
  `> ${ownerWords}`,
  '',
  'The owner accepts this picture. The owner waives the wrong-character fail of the 2 judges of the',
  'archived track for this row only.',
  '',
  'The approval version is 3. The color print is the color m3 and the line print is the line try 3.',
  '',
  '| file | kind | SHA-256 |',
  '| --- | --- | --- |',
  `| l2-w10-story-page-put-on-your-hat-pip-v1.png | color m3 | ${HAT_COLOR_SHA} |`,
  `| l2-w10-story-page-put-on-your-hat-pip-line-v1.png | line try 3 | ${HAT_LINE_SHA} |`,
  '',
  '## The T-shirt row',
  '',
  'The new picture replaces the v1 T-shirt files of storytime-l2u2-book-pictures/. The 2 new files',
  'keep the same -v1 names. The old folder does not change on disk.',
  '',
  '| file | old SHA-256 | new SHA-256 |',
  '| --- | --- | --- |',
  `| l2-w10-story-page-put-on-your-t-shirt-v1.png | ${TSHIRT_COLOR_OLD} | ${TSHIRT_COLOR_NEW} |`,
  `| l2-w10-story-page-put-on-your-t-shirt-line-v1.png | ${TSHIRT_LINE_OLD} | ${TSHIRT_LINE_NEW} |`,
  '',
  '### The tries',
  '',
  'Color try 2 (m2):',
  '',
  '- The first judge, judge-u2l1-color-t2.json, fails the file with the class wrong-character. The',
  '  defect sits on the clothes of Ben: a yellow T-shirt instead of the light blue of the cast note,',
  '  and a white vest-like garment under it. Its action check reads a yes, b yes, c no, d yes,',
  '  e yes, f yes, and g n/a. Item c says that the hands hold the hem out at chest height, so the',
  '  shirt is not pulled down over the belly. The other items are yes.',
  '- The second judge, judge-u2l1-color-t2-second.json, passes the file with the class none. That',
  '  judge read the action-check prompt before it finished its v6 part, so the order fault voided',
  '  its v6 verdict. Its action check reads a yes, b yes, c yes, d yes, e yes, f yes, and g n/a.',
  '- A clean second v6 judge, judge-u2l1-color-t2-second-r2.json, passes the file with the class',
  '  none. It reads no action check.',
  '',
  'By the second-judge rule of D6, the v6 verdict comes from the clean file and the action check',
  'comes from the second judge. So the color try 2 (m2) passes.',
  '',
  'Line try 3, from the passing color m2:',
  '',
  '- The print gate passes. The line print is 22 px and its despeckled print is 22 px. The minimum',
  '  is 12 px.',
  '- The judge, judge-u2l1-line-t3.json, passes the file with the class none. Its action check reads',
  '  a yes, b yes, c yes, d yes, e yes, f yes, and g yes. The note says the vest is a simple band,',
  '  and item g covers the pose, the hands, and the T-shirt.',
  '',
  '### The spend lines',
  '',
  'The 2 spend lines, word for word from spend-log.tsv:',
  '',
  '```',
  ...spendLines,
  '```',
  '',
  '## Spend',
  '',
  'This order: 2 calls, 0.02 USD of the 0.10 USD stop.',
  '',
  '## The unchanged folders',
  '',
  'The 6 folders of D8 have the same file counts and the same state SHA-256 before and after this',
  'order. The records are folder-state-look1-before.txt and folder-state-look1-after.txt.',
  '',
  '| folder | files | state sha256 |',
  '| --- | --- | --- |',
  ...stateRows.map((row) => `| ${row.folder} | ${row.files} | ${row.sha} |`),
  '',
  'The judge results of the t-shirt are model evidence, not acceptance. Daniel\'s look gate and the',
  'Workbooks checks decide.',
  '',
].join('\n');
writeFileSync(join(HANDOFF, 'README.md'), readme);
console.log('README.md written.');

// 5. MANIFEST.txt last, in the form of the repair1 hand-off MANIFEST.txt.
const files = readdirSync(HANDOFF)
  .filter((name) => name !== 'MANIFEST.txt')
  .sort();
const hashed = files.map((name) => {
  const bytes = readFileSync(join(HANDOFF, name));
  return { name, sha256: sha256(bytes), size: bytes.length };
});
const manifestText = [
  ...hashed.map((item) => `${item.sha256}  ${item.name}`),
  '',
  ...hashed.map((item) => `# ${item.size} ${item.name}`),
  '',
  '# Storytime Level 2 unit 2 book pictures, look1',
  '# 2 delivery jobs in manifest.json: the hat-pip row and the T-shirt row.',
  '# The hat-pip row holds the owner words of D2. The T-shirt row is model evidence, not acceptance.',
  '',
  '# Check the files with this command (run it in this folder):',
  '# sha256sum --quiet -c MANIFEST.txt',
  "# grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -",
  '',
].join('\n');
writeFileSync(join(HANDOFF, 'MANIFEST.txt'), manifestText);

console.log(`built ${HANDOFF}`);
console.log(`files other than MANIFEST.txt: ${files.length}`);
for (const item of hashed) console.log(`  ${item.sha256}  ${item.size}  ${item.name}`);
console.log(`MANIFEST.txt sha256: ${sha256OfFile(join(HANDOFF, 'MANIFEST.txt'))}`);
