// Format check for cut-out PNGs: node scripts/cutout-check.mjs <dir>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { inflateSync } from 'node:zlib';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/cutout-check.mjs <dir>');
  process.exit(2);
}

function decode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let o = 8;
  let w = 0, h = 0, depth = 0, ctype = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    const data = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    if (type === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  if (depth !== 8 || ctype !== 6) return { w, h, depth, ctype, px: null };
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? px[y * stride + i - 4] : 0;
      const b = y > 0 ? px[(y - 1) * stride + i] : 0;
      const c = i >= 4 && y > 0 ? px[(y - 1) * stride + i - 4] : 0;
      let v = src[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + i] = v & 255;
    }
  }
  return { w, h, depth, ctype, px };
}

function* walk(d) {
  for (const f of readdirSync(d).sort()) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (f.endsWith('.png')) yield p;
  }
}

const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const canvas = Array.isArray(manifest.canvas) ? manifest.canvas : [manifest.canvas?.width, manifest.canvas?.height];
const foot = manifest.footPoint;
let ok = true;

for (const file of walk(dir)) {
  const name = relative(dir, file);
  const problems = [];
  const img = decode(readFileSync(file));
  let note = '';
  if (!img.px) problems.push(`not 8-bit RGBA (depth ${img.depth}, color type ${img.ctype})`);
  else {
    const { w, h, px } = img;
    if (w !== canvas[0] || h !== canvas[1]) problems.push(`size ${w}x${h}, manifest ${canvas[0]}x${canvas[1]}`);
    const A = (x, y) => px[(y * w + x) * 4 + 3];
    for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) if (A(x, y) !== 0) problems.push(`corner (${x},${y}) alpha ${A(x, y)}`);
    let soft = 0, low = -1, high = h, left = w, right = -1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const a = A(x, y);
        if (a > 0 && a < 255) soft++;
        if (a === 0 && (px[(y * w + x) * 4] | px[(y * w + x) * 4 + 1] | px[(y * w + x) * 4 + 2]) !== 0) problems.push(`alpha 0 with colour at (${x},${y})`);
        if (a > 0) { if (y > low) low = y; if (y < high) high = y; if (x < left) left = x; if (x > right) right = x; }
      }
    if (problems.length > 3) problems.length = 3;
    if (soft === 0) problems.push('no soft alpha values (1..254)');
    // Halo: each partial pixel next to a fully opaque pixel must keep the colour of that pixel
    // (a drop of more than 25 % in luminance means a dark halo).
    const lum = (i) => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    let dark = 0, worst = 0, edge = 0;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const a = A(x, y);
        if (a === 0 || a === 255) continue;
        // Inner colour: the mean luminance of the opaque pixels among its 4 neighbours.
        let sum = 0, cnt = 0, near = false;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h || A(xx, yy) !== 255) continue;
            sum += lum((yy * w + xx) * 4);
            cnt++;
            if (Math.abs(dx) + Math.abs(dy) === 1) near = true;
          }
        if (!near) continue;
        edge++;
        const inner = sum / cnt;
        if (inner < 24) continue;
        const drop = (inner - lum((y * w + x) * 4)) / inner;
        if (drop > worst) worst = drop;
        if (drop > 0.25) dark++;
      }
    // A halo darkens the whole outline; a few pixels beside a real dark detail are not a halo.
    // A halo covers most edge pixels; dark detail at the outline (ear undersides, a mouth) covers a few percent.
    if (dark > 0.1 * edge) problems.push(`dark halo on ${dark} of ${edge} edge pixels (worst drop ${(worst * 100).toFixed(0)} %)`);
    // A seam: the read of the render buffer dropped one supersampled sample row, so an output row
    // that crosses the model loses alpha in every pixel (a third of it at --ss 3) while the rows
    // above and below keep theirs. Columns where both neighbours are fully opaque are the test:
    // a soft pixel there means the model is thin, and a thin row leaves no such column.
    let seamRow = -1, seamCols = 0, seamMean = 0;
    for (let y = Math.max(1, high); y <= Math.min(h - 2, low); y++) {
      let sum = 0, cols = 0;
      for (let x = left; x <= right; x++) if (A(x, y - 1) === 255 && A(x, y + 1) === 255) { sum += A(x, y); cols++; }
      if (cols >= 8 && sum / cols < 0.9 * 255) { seamRow = y; seamCols = cols; seamMean = sum / cols; break; }
    }
    if (seamRow >= 0)
      problems.push(
        `seam at row ${seamRow} (alpha ${Math.round(seamMean)} of 255 in ${seamCols} columns where rows ${seamRow - 1} and ${seamRow + 1} are opaque)`,
      );
    const exempt = /hop|jump|stretch/.test(file.split('/').pop());
    if (!exempt && foot && Math.abs(low - foot.row) > 4) problems.push(`lowest opaque row ${low}, foot row ${foot.row}`);
    note = `${w}x${h} soft ${soft} edge ${edge} worstDrop ${(worst * 100).toFixed(0)}% rows ${high}..${low} cols ${left}..${right}`;
  }
  if (problems.length) ok = false;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${name}  ${note}${problems.length ? '  ' + problems.join('; ') : ''}`);
}
console.log(ok ? 'result ok' : 'result fail');
process.exit(ok ? 0 : 1);
