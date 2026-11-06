// Read-only P2-7 round 2: gate problems (without the corner rule) and the corner list.
// Run from the repository root: node --import tsx <this file>
import fs from 'node:fs';
import sharp from 'sharp';
import * as m from '/home/daniebo/Desktop/advantage-forge/src/storytime/book-pictures.ts';

const L = m.loadPictureList({
  printRoot: '/home/daniebo/Desktop/Workbooks/content/storytime/l2/print',
  workbooksRoot: '/home/daniebo/Desktop/Workbooks',
});
const D = '/home/daniebo/Desktop/advantage-forge/out/storytime/l2/unit1/cards/delivery-muse-v1/';
const orig = console.log;
console.log = () => {};
let files = 0;
let gate = 0;
const below: Array<[string, number]> = [];
for (const r of L.rows.filter((x) => /-card-/.test(x.id))) {
  if (!fs.existsSync(D + r.fileName)) continue;
  const cb = fs.readFileSync(D + r.fileName);
  const { data, info } = await sharp(cb).raw().toBuffer({ resolveWithObject: true });
  const cm = await sharp(cb).metadata();
  files += 1;
  if (cm.width !== 1500 || cm.height !== 1500 || cm.hasAlpha || cm.depth !== 'uchar' || info.channels !== 3) {
    gate += 1;
    orig('GATE COLOR', r.id);
  }
  const w = info.width;
  const h = info.height;
  let low = 255;
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]] as const) {
    const i = (y * w + x) * 3;
    low = Math.min(low, data[i]!, data[i + 1]!, data[i + 2]!);
  }
  if (low < 250) below.push([r.fileName, low]);
  const lb = fs.readFileSync(D + r.lineArtFileName);
  const l = await m.inspectLineArtPng(lb, { width: r.width, height: r.height });
  files += 1;
  if (!l.valid) {
    gate += 1;
    orig('GATE LINE', r.id, JSON.stringify(l.errors));
  }
}
console.log = orig;
console.log('files checked:', files, 'gate problems:', gate);
below.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
console.log('color files below 250:', below.length);
for (const [f, v] of below) console.log(f, v);
