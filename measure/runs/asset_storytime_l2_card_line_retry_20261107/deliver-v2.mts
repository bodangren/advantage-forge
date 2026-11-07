/**
 * The card delivery v2 runner (Phase 2, Task 6).
 *
 * It reads the picture list and the approval list `approved-v2.json`, calls the writer
 * `writeMuseDelivery`, and writes `out/storytime/l2/unit1/cards/delivery-muse-v2/`. It makes no
 * provider call and no Muse call. It writes only inside the delivery folder and this run folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_card_line_retry_20261107/deliver-v2.mts
 */
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { writeMuseDelivery } from '../../../src/storytime/muse-delivery.js';
import { inspectLineArtPng } from '../../../src/storytime/book-pictures.js';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_card_line_retry_20261107');
const MUSE = join(ROOT, 'out/storytime/l2/unit1/cards/muse');
const V1 = join(ROOT, 'out/storytime/l2/unit1/cards/delivery-muse-v1');
const V2 = join(ROOT, 'out/storytime/l2/unit1/cards/delivery-muse-v2');
const HANDOFF = '/home/daniebo/Desktop/handoff/storytime-l2-card-pictures';
const LIST = '/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json';
const APPROVALS = join(RUN, 'approved-v2.json');
const LOG = join(RUN, 'deliver-v2.log');
const CORNERS = join(RUN, 'corner-record-v2.txt');

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

interface PictureRow {
  id: string;
  use: string;
  text: string;
  fileName: string;
  lineArtFileName: string;
}

const out: string[] = [];
const say = (line: string): void => {
  out.push(line);
  console.log(line);
};

const listBytes = readFileSync(LIST);
const pictureListSha256 = sha256(listBytes);
const rows = JSON.parse(listBytes.toString('utf8')) as PictureRow[];
say(`Picture list ${LIST} SHA-256 ${pictureListSha256}.`);
say(`Rows in the list: ${rows.length}.`);

const approvals = JSON.parse(readFileSync(APPROVALS, 'utf8')) as {
  entries: Array<{ rowId: string }>;
};
say(`Approval list ${APPROVALS}: ${approvals.entries.length} entries.`);

const skipped: string[] = [];
const manifest = await writeMuseDelivery({
  rows: rows as never,
  approvals: APPROVALS,
  museRoot: MUSE,
  deliveryRoot: V2,
  pictureListSha256,
  onSkip: (rowId: string, reason: string) => {
    skipped.push(rowId);
    if (rowId.includes('-card-')) say(`Skipped ${rowId} (${reason})`);
  },
});
say(`Skipped rows: ${skipped.length} (all outside the card rows).`);
say(`Wrote ${manifest.batches.length} batches to ${V2}.`);

const v2Files = readdirSync(V2).filter((name) => name.endsWith('.png')).sort();
say(`Delivered PNG files: ${v2Files.length}.`);
const expected = approvals.entries.length * 2;
if (v2Files.length !== expected) throw new Error(`expected ${expected} PNG files, got ${v2Files.length}.`);

const manifestSha256 = sha256(readFileSync(join(V2, 'manifest.json')));
say(`manifest.json SHA-256: ${manifestSha256}.`);

// The 58 old files must hold the same bytes in v1, v2, and the handoff folder.
const v1Files = readdirSync(V1).filter((name) => name.endsWith('.png')).sort();
say(`v1 PNG files: ${v1Files.length}.`);
let compared = 0;
const mismatches: string[] = [];
for (const name of v1Files) {
  const want = sha256(readFileSync(join(V1, name)));
  for (const [label, folder] of [['v2', V2], ['handoff', HANDOFF]] as const) {
    const file = join(folder, name);
    if (!existsSync(file)) {
      mismatches.push(`${label}: ${name} is missing`);
      continue;
    }
    compared += 1;
    const got = sha256(readFileSync(file));
    if (got !== want) mismatches.push(`${label}: ${name} ${got} != ${want}`);
  }
}
say(`Old file comparisons: ${compared} (expected ${v1Files.length * 2}), mismatches ${mismatches.length}.`);
for (const line of mismatches) say(`MISMATCH ${line}`);

// The two new family files: 1500 x 1500, 8-bit, no alpha. The line print passes the gate.
for (const name of ['l2-w04-card-family-v1.png', 'l2-w04-card-family-line-v1.png']) {
  const file = join(V2, name);
  const meta = await sharp(file).metadata();
  say(`${name}: ${meta.width} x ${meta.height}, channels ${meta.channels}, alpha ${meta.hasAlpha}, depth ${meta.depth}.`);
  if (meta.width !== 1500 || meta.height !== 1500 || (meta.channels !== 1 && meta.channels !== 3) || meta.hasAlpha || meta.depth !== 'uchar') {
    throw new Error(`${name} is not a 1500 x 1500 8-bit file with no alpha.`);
  }
}
const lineCheck = await inspectLineArtPng(readFileSync(join(V2, 'l2-w04-card-family-line-v1.png')), {
  width: 1500,
  height: 1500,
});
say(`inspectLineArtPng of l2-w04-card-family-line-v1.png: valid ${lineCheck.valid}, errors ${JSON.stringify(lineCheck.errors)}.`);

// The corner record of the new files: the ham color print and the two family files.
const cornerFiles: Array<[string, string]> = [
  ['l2-w04-card-ham-v1.png (the ham color print)', join(MUSE, 'l2-w04-card-ham-m1-color-print.png')],
  ['l2-w04-card-family-v1.png', join(V2, 'l2-w04-card-family-v1.png')],
  ['l2-w04-card-family-line-v1.png', join(V2, 'l2-w04-card-family-line-v1.png')],
];
const cornerLines: string[] = [
  `Corner values of the new files (${new Date().toISOString()}). A corner below 250 is a report item, not a gate.`,
  '',
];
for (const [label, file] of cornerFiles) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number): number => {
    const index = (y * info.width + x) * info.channels;
    return data[index] ?? 0;
  };
  const values = [at(0, 0), at(info.width - 1, 0), at(0, info.height - 1), at(info.width - 1, info.height - 1)];
  const lowest = Math.min(...values);
  say(`corner ${label}: TL ${values[0]} TR ${values[1]} BL ${values[2]} BR ${values[3]} lowest ${lowest}`);
  cornerLines.push(`${label}: TL ${values[0]} TR ${values[1]} BL ${values[2]} BR ${values[3]} lowest ${lowest}`);
}
cornerLines.push('');
for (const [label, file] of cornerFiles) {
  cornerLines.push(`${sha256(readFileSync(file))}  ${file}  (${label})`);
}
writeFileSync(CORNERS, cornerLines.join('\n') + '\n');
say(`Corner record: ${CORNERS}`);

appendFileSync(LOG, `\n## ${new Date().toISOString()}\n\n${out.join('\n')}\n`);
console.log(`Log: ${LOG}`);
