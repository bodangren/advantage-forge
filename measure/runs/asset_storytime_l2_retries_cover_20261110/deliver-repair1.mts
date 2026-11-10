/**
 * The repair delivery runner (Phase 3, Task 12).
 *
 * It reads the approval list of the repair rows, links the approved Muse prints into a staging
 * folder, calls the writer `deliverMuseUnit2` with the options `approvalsOnly`, `versionFromList`,
 * and `lineWidthExceptions`, and writes `out/storytime/l2/unit2/delivery-muse-v1-repair1/`. The
 * staging folder holds hard links, so it costs no disk space and the Muse folder stays untouched.
 * The staging folder sits under /tmp/opencode/l2rc3/ and the runner removes it at the end.
 *
 * It makes no provider call, no Muse call, and no network call. It writes only inside the
 * delivery folder, the staging folder, and this run folder.
 *
 *   ./node_modules/.bin/tsx measure/runs/asset_storytime_l2_retries_cover_20261110/deliver-repair1.mts
 */
import { createHash } from 'node:crypto';
import { existsSync, linkSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  UNIT2_LIST_FILE,
  UNIT2_LIST_SHA256,
  UNIT2_ROWS_FILE,
  deliverMuseUnit2,
} from '../../../src/storytime/muse-delivery-u2.js';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const RUN = join(ROOT, 'measure/runs/asset_storytime_l2_retries_cover_20261110');
const MUSE_ROOT = join(ROOT, 'out/storytime/l2/unit2');
const STAGE = '/tmp/opencode/l2rc3/delivery-stage-repair1';
const DELIVERY_ROOT = join(MUSE_ROOT, 'delivery-muse-v1-repair1');
const APPROVALS = join(RUN, 'approvals-repair1.json');

const CARD_REASON =
  'PM 2026-11-10: "package the 4 card fail rows as delivery jobs from their best try: ' +
  'hippo, ruler, clap, cold = color m1 + the widest judge-passing line print, each with the ' +
  'line width recorded as an exception in manifest.json (Workbooks prints only the color file ' +
  'of a card row, card-kit.ts:584)."';

const LINE_WIDTH_EXCEPTIONS = {
  'l2-w12-card-hippo': { measuredPx: 9, requiredPx: 12, reason: CARD_REASON },
  'l2-w12-card-ruler': { measuredPx: 8, requiredPx: 12, reason: CARD_REASON },
  'l2-w13-card-clap': { measuredPx: 11, requiredPx: 12, reason: CARD_REASON },
  'l2-w14-card-cold': { measuredPx: 10, requiredPx: 12, reason: CARD_REASON },
};

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

interface ListRow {
  id: string;
  week: number;
  sizeClass: 'A' | 'B' | 'C';
}
interface Entry {
  rowId: string;
  version: number;
  colorPrint: string;
  linePrint: string;
}

const list = JSON.parse(readFileSync(UNIT2_LIST_FILE, 'utf8')) as ListRow[] | { rows: ListRow[] };
const listRows = Array.isArray(list) ? list : list.rows;
const rowById = new Map(listRows.map((row) => [row.id, row]));
const approvals = JSON.parse(readFileSync(APPROVALS, 'utf8')) as {
  version: number;
  pictureListSha256?: string;
  entries: Entry[];
};

if (approvals.pictureListSha256 !== UNIT2_LIST_SHA256) {
  throw new Error(`the approval list pin ${String(approvals.pictureListSha256)} differs from ${UNIT2_LIST_SHA256}`);
}
if (existsSync(DELIVERY_ROOT)) throw new Error(`the delivery folder ${DELIVERY_ROOT} exists; the writer needs a new one`);
if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });

let linked = 0;
for (const entry of approvals.entries) {
  const row = rowById.get(entry.rowId);
  if (!row) throw new Error(`the approval list names ${entry.rowId}, which is not in the picture list`);
  const weekDir = join(MUSE_ROOT, `w${String(row.week).padStart(2, '0')}`, 'muse');
  for (const name of [entry.colorPrint, entry.linePrint]) {
    const source = join(weekDir, name);
    if (!existsSync(source)) throw new Error(`the print ${source} is missing`);
    linkSync(source, join(STAGE, name));
    linked += 1;
  }
}

const rowsFile = join(ROOT, UNIT2_ROWS_FILE);
if (!existsSync(rowsFile)) throw new Error(`the rows file ${rowsFile} is missing`);

const skipped: string[] = [];
const manifest = await deliverMuseUnit2({
  listFile: UNIT2_LIST_FILE,
  pictureListPin: UNIT2_LIST_SHA256,
  approvals: APPROVALS,
  rows: rowsFile,
  repoRoot: ROOT,
  museRoot: STAGE,
  deliveryRoot: DELIVERY_ROOT,
  approvalsOnly: true,
  versionFromList: true,
  lineWidthExceptions: LINE_WIDTH_EXCEPTIONS,
  onSkip: (rowId) => skipped.push(rowId),
});

const files = readdirSync(DELIVERY_ROOT).filter((name) => name.endsWith('.png')).sort();
const problems: string[] = [];
let colorCount = 0;
let lineCount = 0;
for (const name of files) {
  const rowId = name.replace(/-line-v\d+\.png$/, '').replace(/-v\d+\.png$/, '');
  const row = rowById.get(rowId);
  if (!row) {
    problems.push(`${name}: no picture list row`);
    continue;
  }
  const isLine = name.includes('-line-v');
  const want = row.sizeClass === 'C' ? { width: 1500, height: 1500 } : { width: 4000, height: 3000 };
  const metadata = await sharp(join(DELIVERY_ROOT, name)).metadata();
  if (metadata.format !== 'png') problems.push(`${name}: format ${String(metadata.format)}`);
  if (metadata.width !== want.width || metadata.height !== want.height) {
    problems.push(`${name}: size ${String(metadata.width)} x ${String(metadata.height)}, want ${want.width} x ${want.height}`);
  }
  if (metadata.bitsPerSample !== 8) problems.push(`${name}: ${String(metadata.bitsPerSample)} bits`);
  if (metadata.hasAlpha) problems.push(`${name}: alpha channel`);
  if (isLine) {
    if (metadata.channels !== 1 || metadata.space !== 'b-w') {
      problems.push(`${name}: line print is not grayscale (channels ${String(metadata.channels)}, space ${String(metadata.space)})`);
    }
    lineCount += 1;
  } else {
    if (metadata.channels !== 3 || metadata.space !== 'srgb') {
      problems.push(`${name}: color print is not srgb with 3 channels (channels ${String(metadata.channels)}, space ${String(metadata.space)})`);
    }
    colorCount += 1;
  }
}

const manifestBytes = readFileSync(join(DELIVERY_ROOT, 'manifest.json'));
const manifestIds = manifest.jobs.map((job) => job.id).sort();
const expectedIds = approvals.entries.map((entry) => entry.rowId).sort();
const lines = [
  `time: ${new Date().toISOString()}`,
  `picture list SHA-256: ${UNIT2_LIST_SHA256} (pin checked)`,
  `approval entries: ${approvals.entries.length}`,
  `staged hard links: ${linked}`,
  `delivered rows: ${manifest.jobs.length}`,
  `delivered row ids: ${manifestIds.join(', ')}`,
  `delivered color files: ${colorCount}`,
  `delivered line files: ${lineCount}`,
  `delivered PNG files: ${files.length}`,
  `manifest.json sha256: ${sha256(manifestBytes)}`,
  `skipped rows: ${skipped.length}${skipped.length ? ` (${skipped.join(', ')})` : ''}`,
  `file checks: ${files.length} files; problems: ${problems.length}`,
  ...problems,
  'the option approvalsOnly kept every row without an approval entry out of the delivery and left the skip callback quiet',
  'the option versionFromList gave every candidate the version of the picture list, so the version field of the 9 repaired rows is 1',
  'the option lineWidthExceptions waived the line width error of the 4 card rows and recorded the exception with its removed error text',
  'every color file is PNG 8-bit, no alpha, srgb, 3 channels, at the class size (A and B 4000 x 3000, C 1500 x 1500)',
  'every line file is PNG 8-bit, no alpha, grayscale, at the class size',
];
if (manifestIds.join(',') !== expectedIds.join(',')) {
  throw new Error(`the delivered rows ${manifestIds.join(', ')} differ from the approval rows ${expectedIds.join(', ')}`);
}
if (problems.length) throw new Error(`the delivered files have problems:\n${problems.join('\n')}`);
if (skipped.length) throw new Error(`the skip callback ran for ${skipped.join(', ')}`);
console.log(lines.join('\n'));
rmSync(STAGE, { recursive: true, force: true });
