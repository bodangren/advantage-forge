// Probe P3: re-measure line widths with inspectLineArtPng (no provider call, no key).
// Usage: ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p3-widths.mts
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { inspectLineArtPng } from '../../../src/storytime/book-pictures.js';

const D = 'out/storytime/l2/unit2/delivery-muse-v1-repair1';
const targets: Array<[string, string, number, number]> = [
  [`${D}/l2-w12-card-hippo-line-v1.png`, 'hippo', 9, 0],
  [`${D}/l2-w12-card-ruler-line-v1.png`, 'ruler', 8, 0],
  [`${D}/l2-w13-card-clap-line-v1.png`, 'clap', 11, 0],
  [`${D}/l2-w14-card-cold-line-v1.png`, 'cold', 10, 0],
  ['out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-line-print-2.png', 'hat-pip try 3 print', 12, 4000],
];
let bad = 0;
for (const [file, name, expect, dim] of targets) {
  const bytes = await readFile(file);
  const meta = await sharp(bytes).metadata();
  const size = { width: dim || meta.width!, height: dim ? 3000 : meta.height! };
  const line = await inspectLineArtPng(bytes, size);
  const measured = Number((/measured (\d+) px/.exec(line.errors.join(' | ')) ?? [])[1] ?? NaN);
  // A pass at 12 px has no width error; a narrower print reports "measured N px" in its errors.
  const ok = measured === expect || (expect === 12 && line.errors.length === 0 && line.valid);
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: measured ${measured} px, expect ${expect}, errors ${line.errors.length}`);
}
console.log(bad ? `probe-p3-widths: ${bad} FAIL` : 'probe-p3-widths: all pass');
process.exit(bad ? 1 : 0);
