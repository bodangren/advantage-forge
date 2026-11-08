// P3 acceptance probe: does each judge copy equal a 360 px downscale of the approved print?
// Uses sharp, the same library the judge batch uses. Sequential, one picture at a time (low memory).
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const D = 'out/storytime/l2/unit2/family-words/muse';
const DELIV = 'out/storytime/l2/unit2/family-words/delivery-muse-v1';
const JUDGE = 'out/storytime-review/judge/prod-u2';
const approvals = JSON.parse(readFileSync('measure/runs/asset_storytime_l2_unit2_pictures_20261108/approvals-u2-fw.json', 'utf8')).entries;

const px = async (buf) => sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const down = (p) => sharp(p).resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: false }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

const diff = (a, b) => {
  if (a.data.length !== b.data.length || a.info.width !== b.info.width || a.info.height !== b.info.height) {
    return { shape: 'different', a: `${a.info.width}x${a.info.height}`, b: `${b.info.width}x${b.info.height}` };
  }
  let max = 0, count = 0, sum = 0;
  for (let i = 0; i < a.data.length; i++) {
    const d = Math.abs(a.data[i] - b.data[i]);
    if (d) { count++; sum += d; }
    if (d > max) max = d;
  }
  return { shape: 'same', max, count, sum, pixels: a.info.width * a.info.height };
};

const rows = [];
for (const entry of approvals) {
  const judgePath = `${JUDGE}/${entry.rowId}-color-t1.png`;
  const judge = await down(judgePath);
  const fromColor = await down(`${D}/${entry.rowId}-m1-color.png`);
  const fromPrint = await down(`${D}/${entry.colorPrint}`);
  const fromDeliv = await down(`${DELIV}/${entry.rowId}-v1.png`);
  rows.push({
    id: entry.rowId,
    'judge==down(color)': diff(fromColor, judge),
    'judge==down(print)': diff(fromPrint, judge),
    'down(print)==down(deliv)': diff(fromDeliv, fromPrint),
    'down(print)==down(color)': diff(fromColor, fromPrint),
  });
}

let worst = 0;
for (const r of rows) {
  const d1 = r['judge==down(print)'];
  const d2 = r['judge==down(color)'];
  console.log(
    `${r.id}\tprint-max=${d1.max ?? 'shape'}\tprint-diffpx=${d1.count ?? '-'}\tcolor-max=${d2.max ?? 'shape'}\tcolor-diffpx=${d2.count ?? '-'}\tdeliv-vs-print=${r['down(print)==down(deliv)'].shape === 'same' && r['down(print)==down(deliv)'].max === 0 ? 'equal' : 'DIFF'}`,
  );
  if (typeof d1.max === 'number') worst = Math.max(worst, d1.max);
}
const zeroPrint = rows.filter((r) => r['judge==down(print)'].max === 0).length;
const zeroColor = rows.filter((r) => r['judge==down(color)'].max === 0).length;
console.log(`rows ${rows.length}; judge==down(print) pixel distance 0: ${zeroPrint}; judge==down(color) pixel distance 0: ${zeroColor}; worst print max diff ${worst}`);
