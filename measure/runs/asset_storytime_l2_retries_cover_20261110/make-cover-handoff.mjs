// Task 7 of Phase 2. Builds the cover hand-off folder of D10 and D16.
// It spends 0 USD. It makes no Muse call. It reads no key.
import { readFileSync, writeFileSync, mkdirSync, linkSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const REPO = '/home/daniebo/Desktop/advantage-forge';
const RUNS = `${REPO}/measure/runs/asset_storytime_l2_retries_cover_20261110`;
const OUT = `${REPO}/out/storytime/covers/teacher-front/muse`;
const JUDGE = `${REPO}/out/storytime-review/judge/cover`;
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge';
const BRIEF = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-brief';

const PNG_NAME = 'l2-u1-cover-quest-teacher-front-forge-v1.png';
const ZONES_NAME = 'l2-u1-cover-quest-teacher-front-forge-v1-zones-review-only.png';

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const bytes = (file) => statSync(file).size;

// 1. The source files.
const srcPrint = `${OUT}/l2-u1-cover-quest-teacher-front-m6-color-print.png`;
const srcZones = `${JUDGE}/l2-u1-cover-quest-teacher-front-m6-zones.png`;
const sidecar = JSON.parse(readFileSync(`${OUT}/l2-u1-cover-quest-teacher-front-m6.json`, 'utf8'));

// 2. The metadata check of the print file. The check must pass before any link.
const meta = await sharp(srcPrint).metadata();
const problems = [];
if (meta.format !== 'png') problems.push(`format ${meta.format}`);
if (meta.width !== 2480) problems.push(`width ${meta.width}`);
if (meta.height !== 3508) problems.push(`height ${meta.height}`);
if (meta.channels !== 3) problems.push(`channels ${meta.channels}`);
if (meta.hasAlpha) problems.push('alpha present');
if (problems.length) {
  console.log('FAIL the metadata check:', problems.join(', '));
  process.exit(1);
}
console.log('metadata ok:', meta.format, meta.width, 'x', meta.height, 'channels', meta.channels, 'alpha', meta.hasAlpha);

// 3. The native size of the color file and the crop of the print.
const colorMeta = await sharp(`${OUT}/l2-u1-cover-quest-teacher-front-m6-color.png`).metadata();
const scale = 2480 / colorMeta.width;
const scaledHeight = Math.round(colorMeta.height * scale);
const cutPx = scaledHeight - meta.height;
const cutPct = (cutPx / scaledHeight) * 100;
console.log('native:', colorMeta.width, 'x', colorMeta.height, 'scale', scale.toFixed(4), 'scaled height', scaledHeight,
  'cut', cutPx, 'px =', (cutPct / 2).toFixed(2), 'percent per side');

// 4. The folder and the hard links.
mkdirSync(HANDOFF, { recursive: true });
for (const [src, name] of [[srcPrint, PNG_NAME], [srcZones, ZONES_NAME]]) {
  const dest = `${HANDOFF}/${name}`;
  if (existsSync(dest)) throw new Error(`the file exists: ${dest}`);
  linkSync(src, dest);
  console.log('linked:', name, bytes(dest), 'bytes');
}

// 5. The brief check.
const briefCheck = execFileSync('bash', ['-c', `awk '{print $1"  "$3}' MANIFEST.txt | sha256sum -c`],
  { cwd: BRIEF, encoding: 'utf8' });
const briefOk = (briefCheck.match(/: OK$/gm) || []).length;
const briefTotal = briefCheck.trim().split('\n').length;
console.log('brief check:', briefOk, 'of', briefTotal, 'OK');

// 6. The spend lines of item (b).
const spendLines = readFileSync(`${RUNS}/spend-log.tsv`, 'utf8').trim().split('\n');
const coverLines = spendLines.filter((l) => l.includes('\tl2-u1-cover-quest-teacher-front color\t'));
const coverSpend = coverLines.reduce((sum, l) => sum + Number(l.split('\t')[4]), 0);
console.log('item (b):', coverLines.length, 'calls, spend', coverSpend.toFixed(2), 'USD of the 0.10 USD stop');

// 7. The judge files.
const judge1 = JSON.parse(readFileSync(`${RUNS}/judge-cover-r2.json`, 'utf8'));
const judge2 = JSON.parse(readFileSync(`${RUNS}/judge-cover-second-r2.json`, 'utf8'));
const m6of = (j) => j.results.find((r) => r.try === 6);
const failsOf = (r) => r.checks.filter((c) => c.verdict !== 'pass').map((c) => `${c.id}: ${c.note}`);
const passesOf = (r) => r.checks.filter((c) => c.verdict === 'pass').map((c) => c.id);
const r1 = m6of(judge1);
const r2 = m6of(judge2);

// 8. The README.
const spendTable = coverLines.map((l) => {
  const c = l.split('\t');
  return `| ${c[0]} | ${c[1]} | ${c[2]} | ${c[3]} | ${Number(c[4]).toFixed(2)} | \`${c[5]}\` |`;
}).join('\n');

const readme = `# Teacher front cover art, Storytime Level 2 unit 1

## What this folder holds

- \`${PNG_NAME}\`: the teacher front cover art at print size.
- \`${ZONES_NAME}\`: the same picture with the zone lines of the judge brief. It is for review only.
- \`README.md\`: this file.
- \`MANIFEST.txt\`: the SHA-256 and the byte size of every other file of this folder.

## The source try

The picture is cover try m6 of the spec \`docs/storytime/covers/teacher-front/l2-u1-cover-quest-teacher-front.json\`.
The model call wrote the file \`l2-u1-cover-quest-teacher-front-m6-color-print.png\` in \`out/storytime/covers/teacher-front/muse/\`.
The SHA-256 of that print file is \`${sidecar.sha256.colorPrint}\`.
The SHA-256 of the color file is \`${sidecar.sha256.color}\`.
The two PNG files of this folder are hard links of those two files.

## The brief

The brief folder is \`${BRIEF}/\`.
The check \`awk '{print $1"  "$3}' MANIFEST.txt | sha256sum -c\` in that folder gives ${briefOk} of ${briefTotal} OK.
The SHA-256 of the brief MANIFEST.txt is \`${sha256(`${BRIEF}/MANIFEST.txt`)}\`.
The SHA-256 of the brief README.md is \`${sha256(`${BRIEF}/README.md`)}\`.
The brief MANIFEST lists ${briefTotal} files. The expected count of 11 files does not hold for this brief.

## The PM decision D16

The PM decision of 2026-11-10, about 22:20 ICT, word for word:

> COVER LAYOUT (PM decision): option 1. The 20/12 layout is the rule for the teacher front; D6's 78 % line is withdrawn for this cover. Deliver m6 to ~/Desktop/handoff/storytime-cover-teacher-front-forge/ with a MANIFEST, marked "model evidence, not acceptance" (Daniel's look gate covers the final cover).

The 20/12 layout is the rule for the teacher front cover.
The top 20 percent holds the logo tile and calm sky.
The bottom 12 percent holds the plaque.
The 78 percent line of D6 is withdrawn for this cover.
The judge brief keeps its own zone lines, so the free band and the bottom band checks of the first judge still use the green line at 78 percent.

## The judge result of m6

The first judge file is \`judge-cover-r2.json\`, of ${judge1.time}, with the prompt v6.
The second judge file is \`judge-cover-second-r2.json\`, of ${judge2.time}, with the prompt v6.
Both judges rank m6 best of the round.

Both judges fail m6 on the free band and the bottom band only.
The first judge names the lower right corner of the open book below the green line.
The second judge names the open book on the laps, about 60 px below the green line of 2048 px.
The first judge records the lowest hand above the blue line at 88 percent, and nothing above the red line at 20 percent.
The second judge records \`pmLayout\` as pass: above the red line there are tree, leaves, and sky, and below the blue line there are grass, flowers, and the feet of Kim and Sam.
Every other check passes in both judges: ${passesOf(r1).join(', ')}.

The judge result is model evidence, not acceptance. Daniel's look gate covers the final cover.

## The size and the crop

The native picture is ${colorMeta.width} x ${colorMeta.height} px, which is the 2:3 ratio.
The spec asked for the 3:4 ratio.
The print file is ${meta.width} x ${meta.height} px, RGB, with no alpha.
The print file is an upscale of the native picture, about ${scale.toFixed(2)} times in width and about ${(meta.height / colorMeta.height).toFixed(2)} times in height.
The cut is about ${(cutPct / 2).toFixed(2)} percent at the top and about ${(cutPct / 2).toFixed(2)} percent at the bottom.

## The spend of item (b)

| time (UTC) | tool | prompt id | attempt | cost USD | result file |
| --- | --- | --- | --- | --- | --- |
${spendTable}

The item (b) spend is ${coverSpend.toFixed(2)} USD of the 0.10 USD stop, over ${coverLines.length} calls.
Round 2 used the prompt fixes E1 and E2 of commit 55f7613b.
Round 1 used the prompt of the cover spec without those fixes.
`;

writeFileSync(`${HANDOFF}/README.md`, readme);
console.log('wrote README.md', bytes(`${HANDOFF}/README.md`), 'bytes');

// 9. The MANIFEST. Every other file of the folder, the SHA-256 line and the byte line.
const files = [PNG_NAME, ZONES_NAME, 'README.md'];
const shaLines = files.map((f) => `${sha256(`${HANDOFF}/${f}`)}  ${f}`);
const sizeLines = files.map((f) => `# ${bytes(`${HANDOFF}/${f}`)} ${f}`);
const manifest = [
  ...shaLines,
  ...sizeLines,
  '',
  '# Teacher front cover art, Storytime Level 2 unit 1 (model evidence, not acceptance)',
  '# The judge files of the track hold the judge result of every cover try.',
  '# The picture is cover try m6. The PM decision D16 sets the 20/12 layout for this cover.',
  '',
  '# Check the files with this command (run it in this folder):',
  "# sha256sum --quiet -c MANIFEST.txt",
].join('\n') + '\n';
writeFileSync(`${HANDOFF}/MANIFEST.txt`, manifest);
console.log('wrote MANIFEST.txt', bytes(`${HANDOFF}/MANIFEST.txt`), 'bytes, sha256', sha256(`${HANDOFF}/MANIFEST.txt`));

// 10. The check.
const check = execFileSync('bash', ['-c', 'sha256sum --quiet -c MANIFEST.txt; echo "exit=$?"'],
  { cwd: HANDOFF, encoding: 'utf8' });
console.log('MANIFEST check:', JSON.stringify(check));
console.log('cover png sha256:', sha256(`${HANDOFF}/${PNG_NAME}`));
console.log('zones png sha256:', sha256(`${HANDOFF}/${ZONES_NAME}`));
console.log('README sha256:', sha256(`${HANDOFF}/README.md`));
console.log('MANIFEST sha256:', sha256(`${HANDOFF}/MANIFEST.txt`));
