// Probe P3: the judge copy of the hat-pip line try 3 matches the new Muse line file (item 4 tail).
// Usage: ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p3-judgecopy.mts
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const JUDGE = 'out/storytime-review/judge/prod-u2/l2-w10-story-page-put-on-your-hat-pip-line-t3.png';
const NEW = 'out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-line-2.png';
const OLD = 'out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-line.png';

const judge = await sharp(await readFile(JUDGE)).greyscale().raw().toBuffer({ resolveWithObject: true });
const diff = async (file: string) => {
  const resized = await sharp(await readFile(file))
    .resize(judge.info.width, judge.info.height, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();
  let sum = 0;
  for (let i = 0; i < resized.length; i++) sum += Math.abs(resized[i] - judge.data[i]);
  return sum / resized.length;
};
const dNew = await diff(NEW);
const dOld = await diff(OLD);
console.log(`judge copy ${judge.info.width} x ${judge.info.height}`);
console.log(`mean abs diff vs new line try 3 file: ${dNew.toFixed(3)}`);
console.log(`mean abs diff vs old line try 2 file: ${dOld.toFixed(3)}`);
console.log(dNew < dOld / 2 ? 'PASS new file is the nearer match by a clear margin' : 'FAIL margin too small');
process.exit(dNew < dOld / 2 ? 0 : 1);
