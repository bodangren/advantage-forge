// Build the hand-off folder for the unit 2 picture prep. No network. No paid call.
// Usage: node measure/runs/asset_storytime_l2_unit2_prep_20261108/make-handoff.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const REPO = process.cwd();
const DEST = '/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep';
const DOCS = join(REPO, 'docs/storytime/l2-unit2');
const rows = JSON.parse(readFileSync(join(DOCS, 'rows.json'), 'utf8')).rows;
const elements = JSON.parse(readFileSync(join(DOCS, 'elements.json'), 'utf8'));
const E = elements.elements;

const specs = rows.map((r) => ({
  row: r,
  spec: JSON.parse(readFileSync(join(DOCS, `w${String(r.week).padStart(2, '0')}/muse/${r.id}.json`), 'utf8')),
}));

rmSync(DEST, { recursive: true, force: true });
mkdirSync(join(DEST, 'specs', 'elements'), { recursive: true });
mkdirSync(join(DEST, 'renders'), { recursive: true });

// Specs.
for (const { spec } of specs) writeFileSync(join(DEST, 'specs', `${spec.id}.json`), JSON.stringify(spec, null, 2) + '\n');
const newSheets = Object.values(E).filter((e) => e.source === 'new');
for (const el of newSheets) {
  copyFileSync(join(REPO, el.spec), join(DEST, 'specs', 'elements', `${el.id}.json`));
}

// Renders: every Forge view that a spec names.
const forgeRefs = new Map();
const unit1Refs = new Map();
for (const { spec } of specs) {
  for (const ref of spec.references) {
    if (ref.startsWith('out/storytime/l2/unit1/')) unit1Refs.set(ref, true);
    else if (ref.startsWith('out/') && !ref.startsWith('out/storytime/l2/unit2/') && ref.includes('/views/')) forgeRefs.set(ref, true);
  }
}
let made = 0;
for (const ref of [...forgeRefs.keys()].sort()) {
  copyFileSync(join(REPO, ref), join(DEST, 'renders', basename(dirname(dirname(ref))) + '-' + basename(ref)));
  made += 1;
}
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
writeFileSync(join(DEST, 'elements-reused.tsv'),
  ['# Unit 1 element files that the specs name. Not copied. sha256 + path.',
    ...[...unit1Refs.keys()].sort().map((p) => `${sha(join(REPO, p))}\t${p}`)].join('\n') + '\n');

// Contact sheet of renders/.
const files = [...forgeRefs.keys()].sort().map((r) => join(DEST, 'renders', basename(dirname(dirname(r))) + '-' + basename(r)));
const CELL = 260;
const COLS = 4;
const ROWS = Math.ceil(files.length / COLS);
const tiles = [];
for (let i = 0; i < files.length; i++) {
  const label = basename(files[i]).replace('.png', '');
  const img = await sharp(files[i]).resize(CELL - 10, CELL - 34, { fit: 'contain', background: '#ffffff' }).toBuffer();
  const svg = Buffer.from(`<svg width="${CELL}" height="${CELL}"><rect width="100%" height="100%" fill="#ffffff"/><text x="6" y="${CELL - 8}" font-family="sans-serif" font-size="12" fill="#222">${label.slice(0, 34)}</text></svg>`);
  tiles.push(await sharp(svg).composite([{ input: img, top: 4, left: 5 }]).png().toBuffer());
}
await sharp({ create: { width: COLS * CELL, height: ROWS * CELL, channels: 3, background: '#ffffff' } })
  .composite(tiles.map((input, i) => ({ input, top: Math.floor(i / COLS) * CELL, left: (i % COLS) * CELL })))
  .png().toFile(join(DEST, 'contact-sheet.png'));

// Copies of the prompt lists.
copyFileSync(join(DOCS, 'prompt-list.tsv'), join(DEST, 'prompt-list.tsv'));
copyFileSync(join(DOCS, 'prompt-list.md'), join(DEST, 'prompt-list.md'));

// Counts.
const reuseRows = rows.filter((r) => r.reuse);
const newRows = rows.length - reuseRows.length;
const ids = [...new Set([...forgeRefs.keys()])].map((p) => p.split('/')[1]);
const readme = `# Storytime Level 2 unit 2 picture prep: hand-off

Status: draft for the paid run. This folder is not acceptance, and it is not a "Go".

## Counts

- Rows: ${rows.length}
- New rows: ${newRows}
- Reuse rows (D3, same word and same use): ${reuseRows.length}
- New element sheets (draft specs): ${newSheets.length}
- Forge renders reused: ${forgeRefs.size} view files (${ids.length} assets: ${ids.join(', ')})
- Forge renders made now: 0. Every named asset already had a views file.
- Unit 1 element files reused (not copied): ${unit1Refs.size}, in \`elements-reused.tsv\`

## Cost estimate for the paid run

- ${newRows} new rows x 0.080 USD = ${(newRows * 0.08).toFixed(2)} USD
- ${newSheets.length} new element sheets x 0.01 USD = ${(newSheets.length * 0.01).toFixed(2)} USD
- ${reuseRows.length} reuse rows x 0 USD = 0.00 USD
- Total: ${(newRows * 0.08 + newSheets.length * 0.01).toFixed(2)} USD. A retry adds to the estimate.

## Files

- \`prompt-list.tsv\` and \`prompt-list.md\`: one line for each row, with the element sources, the reuse source, and the color prompt.
- \`specs/\`: the ${rows.length} row specs, in the unit 1 spec shape.
- \`specs/elements/\`: the ${newSheets.length} new element specs (D5 c).
- \`renders/\`: a copy of every Forge view that a spec names.
- \`elements-reused.tsv\`: the unit 1 element files that the specs name, with SHA-256.
- \`contact-sheet.png\`: one grid of \`renders/\`, with the file name under each cell.
- \`MANIFEST.txt\`: \`sha256sum\` of every other file. Check: \`sha256sum -c MANIFEST.txt\`.

## Open questions with defaults

1. "Printed-book style B" is read as the unit 1 look without change (Workbooks D8).
   Default: keep the unit 1 look.
2. A class C check-row whose word already has a unit 1 check-row picture is marked \`reuse\`.
   Default: copy the reuse source under the new row name (0 USD).
3. The ${newSheets.length} new element sheets are part of the paid run. Default: generate them first.
4. The next unpaid steps of D8 start after the "Go": a unit 2 guard entry with the cap of the Go,
   a unit 2 judge batch flag, and a unit 2 delivery writer.

## Rules held by the drafts

- Every person is described by hair and clothes only (D1). No prompt names skin color, tone,
  complexion, race, or ethnicity.
- Every color prompt says that the picture has no letters, words, or numbers.
- Class A and B rows are 4:3. Class C rows are 1:1 with printSize 1500 x 1500.
- Spend: 0 USD. The \`costs.tsv\` files are equal before and after.
`;
writeFileSync(join(DEST, 'README.md'), readme);

// MANIFEST.txt: every other file, relative to the folder.
const all = execFileSync('bash', ['-lc', `cd ${DEST} && find . -type f ! -name MANIFEST.txt | sed 's|^\\./||' | sort`], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
writeFileSync(join(DEST, 'MANIFEST.txt'),
  all.map((f) => `${sha(join(DEST, f))}  ${f}`).join('\n') + '\n');
console.log(JSON.stringify({ dest: DEST, files: all.length + 1, specs: specs.length, newSheets: newSheets.length, forgeRenders: forgeRefs.size, unit1Elements: unit1Refs.size, newRows, reuseRows: reuseRows.length, estimate: (newRows * 0.08 + newSheets.length * 0.01).toFixed(2) }, null, 1));
