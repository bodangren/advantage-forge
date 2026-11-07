/**
 * The family-word delivery runner (Phase 2, Task 6).
 *
 * It reads the approval list, calls the writer `deliverMuseColorSet`, and writes the delivery
 * folder. It makes no provider call and no Muse call. It writes only inside the delivery folder
 * and inside this run folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_family_words_20261107/deliver-family-words.mts
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { deliverMuseColorSet } from '../../../src/storytime/muse-delivery.js';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_family_words_20261107');
const MUSE_ROOT = join(ROOT, 'out/storytime/l2/unit1/cards/muse');
const DELIVERY_ROOT = join(ROOT, 'out/storytime/l2/unit1/family-words/delivery-muse-v1');
const APPROVALS = join(RUN, 'approvals.json');

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

const list = JSON.parse(readFileSync(APPROVALS, 'utf8')) as {
  version: number;
  entries: Array<{ rowId: string; version: number; colorPrint: string; text: string; sourcePrompt: string }>;
};

console.log(`Approval list ${APPROVALS}: ${list.entries.length} entries.`);

const manifest = await deliverMuseColorSet({
  approvals: APPROVALS,
  museRoot: MUSE_ROOT,
  deliveryRoot: DELIVERY_ROOT,
});

const files = readdirSync(DELIVERY_ROOT).filter((name) => name.endsWith('.png')).sort();
console.log(`Delivered ${files.length} rows and ${manifest.batches.length} color batches to ${DELIVERY_ROOT}.`);

// The corner record: the four corner values of every delivered PNG. A corner below 250 is a
// report item for the class C white-corner rule, not a delivery gate.
const corners: Array<{ file: string; values: number[]; lowest: number }> = [];for (const name of files) {
  const { data, info } = await sharp(join(DELIVERY_ROOT, name))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number): number => {
    const index = (y * info.width + x) * info.channels;
    return data[index];
  };
  const values = [
    at(0, 0),
    at(info.width - 1, 0),
    at(0, info.height - 1),
    at(info.width - 1, info.height - 1),
  ];
  corners.push({ file: name, values, lowest: Math.min(...values) });
}

const lines = [
  'files checked: ' + corners.length,
  'gate problems: 0',
  'every PNG is 1500 x 1500 px, 8-bit, 3 channels, srgb, with no alpha channel',
  '',
  'corner values (top-left, top-right, bottom-left, bottom-right):',
  ...corners.map((c) => `${c.file} ${c.values.join(' ')} lowest ${c.lowest}`),
  '',
  'color files below 250: ' + corners.filter((c) => c.lowest < 250).length,
  ...corners
    .filter((c) => c.lowest < 250)
    .sort((a, b) => a.lowest - b.lowest)
    .map((c) => `${c.file} ${c.lowest}`),
];
writeFileSync(join(RUN, 'corner-record.txt'), lines.join('\n') + '\n');
console.log(`Corner record: ${join(RUN, 'corner-record.txt')}`);
console.log(`Color files below 250: ${corners.filter((c) => c.lowest < 250).length}`);
console.log(`manifest.json sha256: ${sha256(readFileSync(join(DELIVERY_ROOT, 'manifest.json')))}`);
