// Probe P2-D: cover PNG check with sharp. No network, no paid call.
// 2480 x 3508 px, 3 channels, no alpha, SHA-256 equal to the m6 print file.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/l2-u1-cover-quest-teacher-front-forge-v1.png';
const M6 = '/home/daniebo/Desktop/advantage-forge/out/storytime/covers/teacher-front/muse/l2-u1-cover-quest-teacher-front-m6-color-print.png';

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const img = await sharp(HANDOFF);
const meta = await img.metadata();
const h = sha(HANDOFF);
const m6 = sha(M6);

console.log(JSON.stringify({
  handoff: { width: meta.width, height: meta.height, channels: meta.channels, hasAlpha: meta.hasAlpha, sha256: h },
  m6Print: { sha256: m6 },
  sameAsM6: h === m6,
  expectedSize: meta.width === 2480 && meta.height === 3508,
  rgbNoAlpha: meta.channels === 3 && meta.hasAlpha === false,
}, null, 2));

const ok = meta.width === 2480 && meta.height === 3508 && meta.channels === 3
  && meta.hasAlpha === false && h === m6;
console.log(ok ? 'PASS: cover PNG meets D5 and matches the m6 print.' : 'FAIL: cover PNG check failed.');
process.exit(ok ? 0 : 1);
