/**
 * The repair1 hand-off builder (Phase 3, Task 12 Part 2).
 *
 * It builds /home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1/:
 * - hard links of the 26 delivered PNG files of out/storytime/l2/unit2/delivery-muse-v1-repair1/;
 * - a copy of its manifest.json;
 * - a copy of measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv;
 * - not-delivered/ with hard links of the hat-pip m3 color print and the line try 3 print, and a
 *   README.md with the tries, the print gate, the best try by default 7, and the fail reason;
 * - a root README.md with the PM order, the 9 version repairs, the 4 card jobs, the hat-pip
 *   result, the spend, and the unchanged folders;
 * - MANIFEST.txt in the form of the retry1 hand-off MANIFEST.txt.
 *
 * The PNG files are hard links, so the builder costs no disk space. It makes no provider call,
 * no Muse call, and no network call. It writes only inside the hand-off folder.
 *
 *   node measure/runs/asset_storytime_l2_retries_cover_20261110/make-handoff-repair1.mjs
 */
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_retries_cover_20261110');
const DELIVERY = join(ROOT, 'out/storytime/l2/unit2/delivery-muse-v1-repair1');
const MUSE_W10 = join(ROOT, 'out/storytime/l2/unit2/w10/muse');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1';
const NOT_DELIVERED = join(HANDOFF, 'not-delivered');

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sha256OfFile = (path) => sha256(readFileSync(path));

if (existsSync(HANDOFF)) {
  console.error(`refusing to run: ${HANDOFF} already exists`);
  process.exit(1);
}
mkdirSync(HANDOFF, { recursive: true });
mkdirSync(NOT_DELIVERED, { recursive: true });

// 1. Hard links of the 26 delivered PNG files.
const pngs = readdirSync(DELIVERY).filter((name) => name.endsWith('.png')).sort();
if (pngs.length !== 26) {
  console.error(`expected 26 PNG files in ${DELIVERY}, found ${pngs.length}`);
  process.exit(1);
}
for (const name of pngs) {
  linkSync(join(DELIVERY, name), join(HANDOFF, name));
}

// 2. Copies of manifest.json and the spend log.
copyFileSync(join(DELIVERY, 'manifest.json'), join(HANDOFF, 'manifest.json'));
copyFileSync(join(RUN, 'spend-log.tsv'), join(HANDOFF, 'spend-log.tsv'));

// 3. not-delivered/: the hat-pip m3 color print and the line try 3 print.
const HAT_COLOR_SRC = join(MUSE_W10, 'l2-w10-story-page-put-on-your-hat-pip-m3-color-print.png');
const HAT_COLOR_NAME = 'l2-w10-story-page-put-on-your-hat-pip-m3-color-print.png';
const HAT_LINE3_SRC = join(MUSE_W10, 'l2-w10-story-page-put-on-your-hat-pip-m3-line-print-2.png');
const HAT_LINE3_NAME = 'l2-w10-story-page-put-on-your-hat-pip-m3-line-print-2.png';
const LINE3_SHA = '1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1';
if (sha256OfFile(HAT_LINE3_SRC) !== LINE3_SHA) {
  console.error(`line try 3 print SHA mismatch: ${HAT_LINE3_SRC}`);
  process.exit(1);
}
linkSync(HAT_COLOR_SRC, join(NOT_DELIVERED, HAT_COLOR_NAME));
linkSync(HAT_LINE3_SRC, join(NOT_DELIVERED, HAT_LINE3_NAME));

// 4. not-delivered/README.md, in the form of the retry1 hat-pip section.
const notDeliveredReadme = `# Row not delivered in the repair

This 1 row has no delivery entry in the repair1 delivery. Each file is a hard link of the print of
the row. The judge result is model evidence, not acceptance. No person has accepted any picture of
this folder.

## l2-w10-story-page-put-on-your-hat-pip

Tries: Color try 5 (m3): judge pass. Line try 1: judge fail, class wrong-or-missing-prop. Line try
2: judge fail, class wrong-character, and Teacher Kim has big curly hair. Line try 3: judge fail in
both judges, class wrong-character: Teacher Kim wears round glasses, and Pip has no red collar and
no gold tag; the hair is now smooth.

Print gate of line try 3: pass. The line print is 12 px and its despeckled print is 12 px, both at
the minimum of 12 px.

Best try by default 7 (the best try of a fail row): the color m3 of color try 5, and the line try 2
print at 13 px. That print is in the \`not-delivered/\` folder of the retry1 hand-off, as
\`l2-w10-story-page-put-on-your-hat-pip-m3-line-print.png\`.

Why it failed: No line try of the row passed the judge, and the row has used its 3 line tries. The
line try 3 passed the print gate at 12 px, but the frozen judge and the second judge both fail it
with the class wrong-character: Teacher Kim wears round glasses, and Pip has no red collar and no
gold tag at the neck. The row has no more tries.

- Color: not-delivered/${HAT_COLOR_NAME}
- Line (try 3): not-delivered/${HAT_LINE3_NAME}
`;
writeFileSync(join(NOT_DELIVERED, 'README.md'), notDeliveredReadme);

// 5. Root README.md.
const readme = `# Storytime Level 2 unit 2 book pictures, repair1 (model evidence, not acceptance)

## What the folder is

The PM order of D17 (2 messages of 2026-11-10, quoted word for word):

> PM order (Workbooks → PM → Forge, after your Phase 2 acceptance, same light track, 1 role): (1) MANIFEST/version repair, 0 USD, NO render: Workbooks PICTURE_CHECK_U2 selects version 2 or 3 for 9 main rows, but the delivered files are named -v1: l2-w10-check-row-ten, l2-w11-story-page-here, l2-w11-story-page-ten-men-in-the-den, l2-w11-story-page-the-den-is-on-dad, l2-w12-story-page-open-your-book-nan, l2-w13-cover-look-at-me, l2-w13-check-row-dot, l2-w13-d4-prompt-jump, l2-w15-cover-look-a-bus. A probe with those 9 version fields set to 1 gives 224 of 229. Fix the manifest version fields (or the names, whichever matches the delivered pixels) in a NEW hand-off folder with a MANIFEST; the v1 folders stay unchanged. (2) hat-pip: 1 line-only retry from its passing color m3, inside the open retry stop (0.05 USD left of 0.15 USD); 1 call; no other paid call. Report the folder path, the MANIFEST sha256, the spend line, and the hat-pip result. Facts changed list at the end.

> PM addition to the repair order (same new hand-off folder, 0 USD, no render): also package the 4 card fail rows as delivery jobs from their best try: hippo, ruler, clap, cold = color m1 + the widest judge-passing line print, each with the line width recorded as an exception in manifest.json (Workbooks prints only the color file of a card row, card-kit.ts:584). So the folder holds: the 9 version-field repairs, the 4 card delivery jobs, and the hat-pip line retry (1 call, in the 0.05 USD left). One MANIFEST for the folder.

The manifest.json of this folder is the manifest of
\`out/storytime/l2/unit2/delivery-muse-v1-repair1/\`. It holds 13 delivery jobs: the 9 version
repairs and the 4 card jobs. The hat-pip row has no delivery job; see \`not-delivered/README.md\`.

## The 9 version repairs

The old \`version\` and \`selectedVersion\` values are from the v1 manifest
(\`out/storytime/l2/unit2/delivery-muse-v1/manifest.json\`). The Muse version is the version of the
row in the approval list \`approvals-u2.json\`. The new value of \`version\` and
\`selectedVersion\` is 1 for every row. The pixel check compares each delivered file of the repair1
delivery with the same file of the v1 delivery folder.

| row | color file | line file | v1 version | v1 selectedVersion | new value | Muse version in approvals-u2.json | pixel check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| l2-w10-check-row-ten | l2-w10-check-row-ten-v1.png | l2-w10-check-row-ten-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=c77c2db06122ca30968c55277673c002eaf36ff8d521d651271616982326e734 / cc5e7916d1c703989289c474c0ccb2af3a9a2b7b2d329a795e87c54e3ca633ce |
| l2-w11-story-page-here | l2-w11-story-page-here-v1.png | l2-w11-story-page-here-line-v1.png | 3 | 3 | 1 | 3 | same=True sha256=2e71fa31c5c7f4e3faf1961dd58260948c0d593d8eb6eab36ef9a79886a70a3b / 46fd03b520ecde750f6170020ca4f02e6affaaea9d499833d6f8cad1a9eba9ef |
| l2-w11-story-page-ten-men-in-the-den | l2-w11-story-page-ten-men-in-the-den-v1.png | l2-w11-story-page-ten-men-in-the-den-line-v1.png | 3 | 3 | 1 | 3 | same=True sha256=36a078f6177e4e87b8a578b28834a8e2c7ca822e2ae1ee56f945f95cc7e4bbe2 / 4f8792f3a39fd1e8e0a4de3400cd3e33df7158594332f6d47031757d017223de |
| l2-w11-story-page-the-den-is-on-dad | l2-w11-story-page-the-den-is-on-dad-v1.png | l2-w11-story-page-the-den-is-on-dad-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=ed6d90a2538d021e627fae051ab7db10d050b993fb6b84131f95d467712c62ca / 3b4ce24e9c982bf59844575c1a4f4765736993c8e695706829b8ac04886b2b02 |
| l2-w12-story-page-open-your-book-nan | l2-w12-story-page-open-your-book-nan-v1.png | l2-w12-story-page-open-your-book-nan-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=9439e0376e46ac252d86db5ecbfbff360af1dda45295b08e58c54cd068201056 / 4e0c1a5334d16e5d30e7a0470fc04f20a2675029fa388608c437d3b17ec484e3 |
| l2-w13-cover-look-at-me | l2-w13-cover-look-at-me-v1.png | l2-w13-cover-look-at-me-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=e54d466612ddb69e9e8318c76cb01cd7378cff2891119a48b3d1b21f236da131 / 0f10a2f89cff53e7356d740a7f173c2ec4e438183bbb6d55862b826c6d3aff7c |
| l2-w13-check-row-dot | l2-w13-check-row-dot-v1.png | l2-w13-check-row-dot-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=1882abb894357293296099fe9334b54140bd6b6d44c7e9a83532a1425b591db8 / c0229516ae37ec92b93cebb7702afad44d4c60b8c4d582f1b810bbb3f6a61659 |
| l2-w13-d4-prompt-jump | l2-w13-d4-prompt-jump-v1.png | l2-w13-d4-prompt-jump-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=7d2f1777d65c36f813587ef2ac697d6dec6115f8fac35a35167ce110417d69e5 / f2450fccf9d8776c7e13ba377de5990691fc9ad0a43d437e2f6ce984cdd82bc1 |
| l2-w15-cover-look-a-bus | l2-w15-cover-look-a-bus-v1.png | l2-w15-cover-look-a-bus-line-v1.png | 2 | 2 | 1 | 2 | same=True sha256=b225cc34a8d6d9144ee27fd2ca7da56472478f94d8c1bf5a71e50a636181e445 / c74ae36d26df35053328ae6f716468cc40cca37af4c26b982650b54edf31e055 |

Cause of D18, in one sentence: the line \`version = entry?.version ?? listVersion(row.fileName)\` in
\`src/storytime/muse-delivery-u2.ts\` (line 379) put the Muse version of the approval list into the
manifest candidate instead of the v1 list version, so the manifest named a version whose pixels
were not the delivered \`-v1\` files.

## The 4 card jobs

Each card row is a delivery job from its best try: the color m1 color print and the widest
judge-passing line print. The line width is under the 12 px print gate, so the manifest records a
\`lineWidthException\` for each row. The PM words about card-kit.ts:584: "Workbooks prints only the
color file of a card row, card-kit.ts:584".

| row | color source | line source | measured width | required width | lineWidthException record |
| --- | --- | --- | --- | --- | --- |
| l2-w12-card-hippo | l2-w12-card-hippo-m1-color-print.png | l2-w12-card-hippo-m1-line-print-4.png | 9 px | 12 px | measuredPx 9, requiredPx 12, waivedError "Line-art twin lines must be at least 12 px thick; measured 9 px.", reason = the PM words of 2026-11-10 |
| l2-w12-card-ruler | l2-w12-card-ruler-m1-color-print.png | l2-w12-card-ruler-m1-line-print-4.png | 8 px | 12 px | measuredPx 8, requiredPx 12, waivedError "Line-art twin lines must be at least 12 px thick; measured 8 px.", reason = the PM words of 2026-11-10 |
| l2-w13-card-clap | l2-w13-card-clap-m1-color-print.png | l2-w13-card-clap-m1-line-print-3.png | 11 px | 12 px | measuredPx 11, requiredPx 12, waivedError "Line-art twin lines must be at least 12 px thick; measured 11 px.", reason = the PM words of 2026-11-10 |
| l2-w14-card-cold | l2-w14-card-cold-m1-color-print.png | l2-w14-card-cold-m1-line-print-4.png | 10 px | 12 px | measuredPx 10, requiredPx 12, waivedError "Line-art twin lines must be at least 12 px thick; measured 10 px.", reason = the PM words of 2026-11-10 |

## The hat-pip result

The 1 call of this order, word for word from spend-log.tsv:

\`2026-11-10T18:42:50.587Z\tmuse\tl2-w10-story-page-put-on-your-hat-pip line\t3\t0.01\tl2-w10-story-page-put-on-your-hat-pip-m3-line-2.png\`

The 2 judge results, both on the line try 3 print:

- Frozen judge (judge-u2rc-p3-line-t3.json): fail, class wrong-character. Teacher Kim wears round
  glasses, and the cast note has no glasses. Pip has no red collar and no tag at the neck, and the
  cast note has a red collar with a gold tag.
- Second judge (judge-u2rc-p3-line-t3-second.json): fail, class wrong-character. Teacher Kim wears
  round glasses (not in cast); Pip has no collar and no gold tag.

The print gate of line try 3 passes at 12 px. hat-pip has no delivery job; see
\`not-delivered/README.md\`.

## Spend

- This order: 1 call, 0.01 USD (the hat-pip line try 3).
- Item (a), the unit 2 retries: 14 calls, 0.11 USD of the 0.15 USD cap.
- Item (b), the teacher cover: 6 calls, 0.06 USD of the 0.10 USD stop.
- Track total: 0.17 USD.

## Unchanged folders

The 4 folders that must not change have the same file counts and state SHA-256 before and after
Phase 3 (folder-state-p3e-before.txt and folder-state-p3e-after.txt):

| folder | files | state sha256 |
| --- | --- | --- |
| out/storytime/l2/unit2/delivery-muse-v1/ | 441 | a64ddf5f19a76542ee8806e16e872d23ef4a44308082fabee461f3ca9aec038c |
| out/storytime/l2/unit2/delivery-muse-v1-retry1/ | 9 | ca4cc92ff5767edf23c299602b6dc25951c5a6a45f3157c62b2252c4993544b7 |
| handoff/storytime-l2u2-book-pictures/ | 469 | 1146c9a48c77c39ac7ce67974a3f73a6d086d575bb21699f704c35f3c309c592 |
| handoff/storytime-l2u2-book-pictures-retry1/ | 23 | 9ade5c1e3b968ca87d71ab0d6c40503157bc5b1bb4e9be5450178e71f4f03c8a |

The judge results are model evidence, not acceptance. Daniel's look gate and the Workbooks checks
decide.
`;
writeFileSync(join(HANDOFF, 'README.md'), readme);

// 6. MANIFEST.txt, in the form of the retry1 hand-off MANIFEST.txt.
const files = [];
for (const name of readdirSync(HANDOFF)) {
  const path = join(HANDOFF, name);
  if (statSync(path).isFile() && name !== 'MANIFEST.txt') files.push(name);
}
for (const name of readdirSync(NOT_DELIVERED)) {
  files.push(`not-delivered/${name}`);
}
files.sort();
const shaLines = files.map((f) => `${sha256OfFile(join(HANDOFF, f))}  ${f}`);
const byteLines = files.map((f) => `# ${statSync(join(HANDOFF, f)).size} ${f}`);
const manifestText = [
  ...shaLines,
  '',
  ...byteLines,
  '',
  '# Storytime Level 2 unit 2 book pictures, repair1 (model evidence, not acceptance)',
  '# 13 delivery jobs in manifest.json: the 9 version repairs and the 4 card jobs with a line-width exception.',
  '# The fail row hat-pip is in not-delivered/ and README.md names it and why.',
  '',
  '# Check the files with this command (run it in this folder):',
  "# grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -",
  '',
].join('\n');
writeFileSync(join(HANDOFF, 'MANIFEST.txt'), manifestText);

console.log(`built ${HANDOFF}`);
console.log(`root files: ${files.filter((f) => !f.startsWith('not-delivered/')).length}`);
console.log(`not-delivered files: ${files.filter((f) => f.startsWith('not-delivered/')).length}`);
console.log(`total files (without MANIFEST.txt): ${files.length}`);
