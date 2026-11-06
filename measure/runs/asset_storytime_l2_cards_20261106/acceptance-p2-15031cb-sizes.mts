// Read-only P2-7 check. Run from the repository root:
// node --import tsx measure/runs/asset_storytime_l2_cards_20261106/acceptance-p2-15031cb-sizes.mts
import fs from 'node:fs';
import sharp from 'sharp';
import * as m from '/home/daniebo/Desktop/advantage-forge/src/storytime/book-pictures.ts';

const L = m.loadPictureList({
  printRoot: '/home/daniebo/Desktop/Workbooks/content/storytime/l2/print',
  workbooksRoot: '/home/daniebo/Desktop/Workbooks',
});
const D = '/home/daniebo/Desktop/advantage-forge/out/storytime/l2/unit1/cards/delivery-muse-v1/';
const orig = console.log;
const logs: string[] = [];
console.log = (...a: unknown[]) => {
  logs.push(a.join(' '));
};
let files = 0;
let problems = 0;
let rows = 0;
const widths: number[] = [];
const missing: string[] = [];
const cardRows = L.rows.filter((r) => /-card-/.test(r.id));
for (const r of cardRows) {
  if (!fs.existsSync(D + r.fileName)) {
    missing.push(r.id);
    continue;
  }
  rows += 1;
  const cb = fs.readFileSync(D + r.fileName);
  const cm = await sharp(cb).metadata();
  const c = m.inspectPictureRow(cb, r);
  files += 1;
  if (!c.valid || cm.width !== 1500 || cm.height !== 1500 || cm.hasAlpha || cm.depth !== 'uchar') {
    problems += 1;
    orig('COLOR PROBLEM', r.id, JSON.stringify(c.errors), cm.width, cm.height, cm.hasAlpha, cm.depth);
  }
  const lb = fs.readFileSync(D + r.lineArtFileName);
  const lm = await sharp(lb).metadata();
  logs.length = 0;
  const l = await m.inspectLineArtPng(lb, { width: r.width, height: r.height });
  files += 1;
  const w = (logs.find((x) => x.startsWith('Line-art line width')) || '').match(/width: (\d+)/);
  widths.push(w ? Number(w[1]) : -1);
  if (!l.valid || lm.width !== 1500 || lm.height !== 1500 || lm.channels !== 1 || lm.hasAlpha || lm.depth !== 'uchar' || !w || Number(w[1]) < 12) {
    problems += 1;
    orig('LINE PROBLEM', r.id, JSON.stringify(l.errors), lm.channels, lm.hasAlpha, w && w[1]);
  }
}
console.log = orig;
console.log('list rows', L.rows.length, 'card rows', cardRows.length, 'sha', L.sha256);
console.log('rows delivered', rows, 'files checked:', files, 'problems:', problems);
console.log('line widths min', Math.min(...widths), 'max', Math.max(...widths), 'list', widths.join(','));
console.log('not delivered', missing.join(','));
