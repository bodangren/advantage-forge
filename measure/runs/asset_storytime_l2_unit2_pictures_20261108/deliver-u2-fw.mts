/**
 * The app family-word delivery runner (Phase 3, Task 10).
 *
 * It reads the approval list, calls the writer `deliverMuseUnit2FamilyWords`, and checks every
 * delivered file. It makes no provider call and no Muse call. It writes only inside the delivery
 * folder and inside this run folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_unit2_pictures_20261108/deliver-u2-fw.mts
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { U2_FW_RUN } from '../../../scripts/storytime-muse-guards.mjs';
import { deliverMuseUnit2FamilyWords, UNIT2_FAMILY_WORD_IDS } from '../../../src/storytime/muse-delivery-u2.js';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_unit2_pictures_20261108');
const APPROVALS = join(RUN, 'approvals-u2-fw.json');
// The Muse folder and the delivery folder come from the app run of the guard.
const MUSE_ROOT = join(ROOT, U2_FW_RUN.outDir);
const DELIVERY_ROOT = join(ROOT, dirname(U2_FW_RUN.outDir), 'delivery-muse-v1');
const RECORD = join(RUN, 'delivery-record-fw.txt');

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

if (existsSync(DELIVERY_ROOT)) {
  console.error(`refused: the delivery folder ${DELIVERY_ROOT} exists; the writer refuses it.`);
  process.exit(1);
}

const list = JSON.parse(readFileSync(APPROVALS, 'utf8')) as {
  version: number;
  entries: Array<{ rowId: string; version: string | number; colorPrint: string }>;
};
const ids = list.entries.map((entry) => entry.rowId);
const missing = UNIT2_FAMILY_WORD_IDS.filter((id) => !ids.includes(id));
if (missing.length) {
  console.error(`refused: the approval list misses ${missing.join(', ')}.`);
  process.exit(1);
}
console.log(`Approval list ${APPROVALS}: ${list.entries.length} entries.`);

const manifest = await deliverMuseUnit2FamilyWords({
  approvals: APPROVALS,
  museRoot: MUSE_ROOT,
  deliveryRoot: DELIVERY_ROOT,
});

const files = readdirSync(DELIVERY_ROOT).filter((name) => name.endsWith('.png')).sort();
const lines: string[] = [];
let problems = 0;
for (const name of files) {
  const meta = await sharp(join(DELIVERY_ROOT, name)).metadata();
  const errors: string[] = [];
  if (meta.format !== 'png') errors.push(`the file is ${meta.format}`);
  if (meta.width !== 1500 || meta.height !== 1500) errors.push(`the size is ${meta.width} x ${meta.height}`);
  if (meta.hasAlpha) errors.push('the file has an alpha channel');
  if (meta.depth !== 'uchar' || meta.bitsPerSample !== 8) errors.push(`the depth is ${meta.depth} and ${meta.bitsPerSample} bits`);
  if (errors.length) problems += 1;
  lines.push(
    `${name}: ${meta.width} x ${meta.height}, ${meta.format}, ${meta.depth}, ${meta.bitsPerSample} bits, ` +
      `alpha ${meta.hasAlpha}, channels ${meta.channels}, sha256 ${sha256(readFileSync(join(DELIVERY_ROOT, name)))}` +
      (errors.length ? ` PROBLEM: ${errors.join('; ')}` : ''),
  );
}
const record = [
  `files checked: ${files.length}`,
  `problems: ${problems}`,
  'every PNG is 1500 x 1500 px, 8-bit, no alpha channel',
  `manifest.json sha256: ${sha256(readFileSync(join(DELIVERY_ROOT, 'manifest.json')))}`,
  `manifest jobs: ${manifest.jobs.length}, color batches: ${manifest.batches.length}`,
  '',
  ...lines,
  '',
];
writeFileSync(RECORD, record.join('\n'));
console.log(`Delivered ${files.length} PNG files and manifest.json to ${DELIVERY_ROOT}.`);
console.log(`Manifest jobs: ${manifest.jobs.length}, color batches: ${manifest.batches.length}.`);
console.log(`File checks: ${files.length} checked, ${problems} problems.`);
console.log(`Record: ${RECORD}`);
if (problems) process.exit(1);
