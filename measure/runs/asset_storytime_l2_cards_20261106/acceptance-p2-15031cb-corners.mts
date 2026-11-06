// Read-only P2-7 follow-up: corner pixels of the delivered color files, two decoders.
import fs from 'node:fs';
import sharp from 'sharp';
import * as m from '/home/daniebo/Desktop/advantage-forge/src/storytime/book-pictures.ts';

const D = '/home/daniebo/Desktop/advantage-forge/out/storytime/l2/unit1/cards/delivery-muse-v1/';
const ids = fs.readdirSync(D).filter((f) => /-v1\.png$/.test(f) && !/-line-v1\.png$/.test(f)).sort();
const orig = console.log;
console.log = () => {};
const out: string[] = [];
let smallOk = 0;
for (const f of ids) {
  const buf = fs.readFileSync(D + f);
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const px = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return `${data[i]},${data[i + 1]},${data[i + 2]}`;
  };
  const w = info.width;
  const h = info.height;
  const cand = await m.inspectCandidatePng(buf, 'small');
  if (cand.valid) smallOk += 1;
  const rowFake = { id: f, week: 1, use: 'small', sizeClass: 'C', fileName: f, lineArtFileName: f, width: 1500, height: 1500 } as never;
  const rowCheck = m.inspectPictureRow(buf, rowFake);
  out.push(`${f} ch=${info.channels} corners=[${px(0, 0)}|${px(w - 1, 0)}|${px(0, h - 1)}|${px(w - 1, h - 1)}] inspectCandidatePng(small)=${cand.valid} inspectPictureRow(C)=${rowCheck.valid}`);
}
console.log = orig;
for (const l of out) console.log(l);
console.log('color files', ids.length, 'inspectCandidatePng small valid', smallOk);
