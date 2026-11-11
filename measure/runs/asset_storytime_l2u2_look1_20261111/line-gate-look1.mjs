// Line pool and print gate, look1 Task 3, line try 3 (paid 0.01 USD).
// The gate calls the writer check code (inspectLineArtPng of src/storytime/book-pictures.ts, the
// code that src/storytime/muse-delivery.ts uses for a delivered line print) on the new line print
// file and on its despeckled print, at the class size of the row. The row
// l2-w10-story-page-put-on-your-t-shirt has size class A, so the class size is story: 4000 x 3000.
// The script makes no provider call and it needs no key.
//
// Usage:
//   HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh \
//     -c './node_modules/.bin/tsx measure/runs/asset_storytime_l2u2_look1_20261111/line-gate-look1.mjs'
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { inspectLineArtPng } from '../../../src/storytime/book-pictures.js';

const DIR = 'out/storytime/l2/unit2/w10/muse';
const BASE = 'l2-w10-story-page-put-on-your-t-shirt-m2';
const CLASS_SIZE = { width: 4000, height: 3000 }; // size class A of the row, the story size

const targets = [
  [`${DIR}/${BASE}-line-print.png`, 'line print'],
  [`${DIR}/${BASE}-line-print-despeckled.png`, 'despeckled print'],
];

/** Runs one check and collects the width, the ink coverage, the result, and the SHA-256. */
async function check(file, label) {
  const bytes = await readFile(file);
  const lines = [];
  const log = console.log;
  console.log = (...parts) => lines.push(parts.join(' '));
  const result = await inspectLineArtPng(bytes, CLASS_SIZE);
  console.log = log;
  const width = (/Line-art line width: (\d+) px/.exec(lines.join('\n')) ?? [])[1] ?? 'unknown';
  const coverage = (/Line-art ink coverage: ([\d.]+)%/.exec(lines.join('\n')) ?? [])[1] ?? 'unknown';
  const meta = await sharp(bytes).metadata();
  return {
    label,
    file,
    size: `${meta.width}x${meta.height}`,
    width,
    coverage,
    pass: result.valid,
    sha256: result.sha256,
    errors: result.errors,
  };
}

const rows = [];
for (const [file, label] of targets) rows.push(await check(file, label));

for (const row of rows) {
  console.log(`${row.label}: ${row.file}`);
  console.log(`  size ${row.size}, width ${row.width} px, ink coverage ${row.coverage} percent`);
  console.log(`  ${row.pass ? 'pass' : 'fail'}`);
  console.log(`  sha256 ${row.sha256}`);
  for (const error of row.errors) console.log(`  error: ${error}`);
}

const bothPass = rows.every((row) => row.pass);
console.log(`gate result: ${bothPass ? 'both pass' : 'a print fails'}`);
process.exit(bothPass ? 0 : 1);
