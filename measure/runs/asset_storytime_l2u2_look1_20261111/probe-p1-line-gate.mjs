// Acceptance probe: re-measure the T-shirt m2 line print and its despeckled print with the
// writer check code inspectLineArtPng at the class size (A: 4000 x 3000). No provider call.
// Form of measure/runs/asset_storytime_l2u2_look1_20261111/line-gate-look1.mjs.
import { readFile } from 'node:fs/promises';
import { inspectLineArtPng } from '../../../src/storytime/book-pictures.js';

const DIR = 'out/storytime/l2/unit2/w10/muse';
const BASE = 'l2-w10-story-page-put-on-your-t-shirt-m2';
const CLASS_SIZE = { width: 4000, height: 3000 };

const targets = [
  [`${DIR}/${BASE}-line-print.png`, 'line print'],
  [`${DIR}/${BASE}-line-print-despeckled.png`, 'despeckled print'],
];

for (const [file, label] of targets) {
  const bytes = await readFile(file);
  const lines = [];
  const log = console.log;
  console.log = (...parts) => lines.push(parts.join(' '));
  const result = await inspectLineArtPng(bytes, CLASS_SIZE);
  console.log = log;
  const width = (/Line-art line width: (\d+) px/.exec(lines.join('\n')) ?? [])[1] ?? 'unknown';
  const coverage = (/Line-art ink coverage: ([\d.]+)%/.exec(lines.join('\n')) ?? [])[1] ?? 'unknown';
  console.log(`${label}: ${file}`);
  console.log(`  width ${width} px, ink coverage ${coverage} percent, ${result.valid ? 'pass' : 'fail'}`);
  console.log(`  sha256 ${result.sha256}`);
  for (const error of result.errors) console.log(`  error: ${error}`);
}
