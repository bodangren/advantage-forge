// Tests for the approvalsOnly option of the unit 2 delivery writer (D4, FR-7, 2026-11-10).
//
// The retry delivery of the track delivers only the rows of the approval list. The tests cover:
//   - the option `approvalsOnly`: only the approval rows are delivered, the reuse row stays out,
//     the row without an entry gets no job, and the skip callback stays quiet;
//   - the writer without the option: the output equals the old output;
//   - an approval entry for a row that is not in the picture list: the writer throws;
//   - an approval list with a wrong picture list pin: the writer throws.
//
// The tests use temp folders and small generated PNG fixtures. No test makes a provider call.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PICTURE_SIZES } from '../src/storytime/book-pictures.js';
import type { MuseApprovalList } from '../src/storytime/muse-delivery.js';
import { deliverMuseUnit2, type Unit2Row } from '../src/storytime/muse-delivery-u2.js';

const STORY = 'l2-w09-story-page-a-show';
const CARD = 'l2-w09-card-banana';
const REUSE = 'l2-w09-check-row-dog';
const SKIP = 'l2-w09-story-page-a-mop';
const REUSE_SOURCE = 'out/storytime/l2/unit1/w06/delivery-muse-v1/l2-w06-check-row-dog-v1.png';
const REUSE_LINE = 'out/storytime/l2/unit1/w06/delivery-muse-v1/l2-w06-check-row-dog-line-v1.png';

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** A picture list row of the unit 2 list. */
const listRow = (id: string, use: string, sizeClass: 'A' | 'B' | 'C') => {
  const size = sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
  return {
    id,
    week: 9,
    use,
    sizeClass,
    fileName: `${id}-v1.png`,
    lineArtFileName: `${id}-line-v1.png`,
    width: size.width,
    height: size.height,
    text: 'A page.',
    prompt: `One picture of ${id}.`,
  };
};

const ROWS = [listRow(STORY, 'story-page', 'A'), listRow(CARD, 'card', 'C'), listRow(REUSE, 'check-row', 'C'), listRow(SKIP, 'story-page', 'A')];

const ROWS_DOC = {
  track: 'test',
  rows: [
    { id: STORY, cast: ['sam'], reuse: null },
    { id: CARD, cast: [], reuse: null },
    { id: REUSE, cast: [], reuse: { word: 'dog', source: REUSE_SOURCE, kind: 'unit1-delivery' } },
    { id: SKIP, cast: [], reuse: null },
  ] satisfies Unit2Row[],
};

const pngCache = new Map<string, Buffer>();

/** A flat color print at one size: PNG, 8-bit, three channels, no alpha. */
async function colorPng(width: number, height: number, background = '#88ccff'): Promise<Buffer> {
  const key = `color:${width}x${height}:${background}`;
  const hit = pngCache.get(key);
  if (hit) return hit;
  const png = await sharp({ create: { width, height, channels: 3, background } }).png().toBuffer();
  pngCache.set(key, png);
  return png;
}

/** A pure black and white line print: a thick black frame on white. */
async function linePng(width: number, height: number): Promise<Buffer> {
  const key = `line:${width}x${height}`;
  const hit = pngCache.get(key);
  if (hit) return hit;
  const pixels = Buffer.alloc(width * height, 255);
  const t = 80;
  const frame = 60;
  const right = width - t;
  for (let y = 0; y < frame; y += 1) {
    pixels.fill(0, (t + y) * width + t, (t + y) * width + right);
    pixels.fill(0, (height - t - 1 - y) * width + t, (height - t - 1 - y) * width + right);
  }
  for (let y = t; y < height - t; y += 1) {
    pixels.fill(0, y * width + t, y * width + t + frame);
    pixels.fill(0, y * width + right - frame, y * width + right);
  }
  const png = await sharp(pixels, { raw: { width, height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
  pngCache.set(key, png);
  return png;
}

let root: string;
let listFile: string;
let pin: string;
let museRoot: string;
let deliveryRoot: string;
let rowsFile: string;

const approvals = (entries: MuseApprovalList['entries']) => ({ version: 1 as const, entries });

/** One approval entry with its Muse print files in the Muse root. */
async function writeMuseEntry(rowId: string, version = 1) {
  const row = ROWS.find((candidate) => candidate.id === rowId)!;
  const size = row.sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
  const colorPrint = `${rowId}-m${version}-color-print.png`;
  const linePrint = `${rowId}-m${version}-line-print.png`;
  await writeFile(path.join(museRoot, colorPrint), await colorPng(size.width, size.height));
  await writeFile(path.join(museRoot, linePrint), await linePng(size.width, size.height));
  return { rowId, version, colorPrint, linePrint };
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'u2-retry-delivery-'));
  listFile = path.join(root, 'list/pictures-u2.json');
  museRoot = path.join(root, 'muse');
  deliveryRoot = path.join(root, 'out/storytime/l2/unit2/w09/delivery-muse-v1-retry1');
  rowsFile = path.join(root, 'docs/storytime/l2-unit2/rows.json');
  await mkdir(museRoot, { recursive: true });
  const text = `${JSON.stringify(ROWS, null, 2)}\n`;
  await mkdir(path.dirname(listFile), { recursive: true });
  await writeFile(listFile, text);
  pin = sha256(text);
  await mkdir(path.dirname(rowsFile), { recursive: true });
  await writeFile(rowsFile, JSON.stringify(ROWS_DOC, null, 2));
  const reuseSize = PICTURE_SIZES.small;
  await mkdir(path.dirname(path.join(root, REUSE_SOURCE)), { recursive: true });
  await writeFile(path.join(root, REUSE_SOURCE), await colorPng(reuseSize.width, reuseSize.height, '#ffd27f'));
  await writeFile(path.join(root, REUSE_LINE), await linePng(reuseSize.width, reuseSize.height));
});

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

const run = (options: {
  approvals: MuseApprovalList;
  approvalsOnly?: boolean;
  pictureListSha256?: string;
  onSkip?: (id: string, reason: string) => void;
}) =>
  deliverMuseUnit2({
    listFile,
    pictureListPin: pin,
    approvals: options.approvals,
    ...(options.approvalsOnly ? { approvalsOnly: true } : {}),
    rows: { rows: ROWS_DOC.rows },
    repoRoot: root,
    museRoot,
    deliveryRoot,
    ...(options.onSkip ? { onSkip: options.onSkip } : {}),
  });

const deliveryFiles = async () => {
  if (!existsSync(deliveryRoot)) return [];
  return (await readdir(deliveryRoot)).sort();
};

describe('the approvalsOnly option of the retry delivery (R1 to R4)', () => {
  it('R1 delivers only the approval rows, and keeps the reuse row and the skip callback out', async () => {
    const story = await writeMuseEntry(STORY);
    const skipped: string[] = [];
    const manifest = await run({ approvals: approvals([story]), approvalsOnly: true, onSkip: (id) => skipped.push(id) });

    const files = await deliveryFiles();
    expect(files).toContain('manifest.json');
    expect(files).toContain(`${STORY}-v1.png`);
    expect(files).toContain(`${STORY}-line-v1.png`);
    // The reuse row stays out of the delivery.
    expect(files).not.toContain(`${REUSE}-v1.png`);
    expect(files).not.toContain(`${REUSE}-line-v1.png`);
    // The row without an entry gets no job and no skip call.
    expect(manifest.jobs.map((job) => job.id)).toEqual([STORY]);
    expect(skipped).toEqual([]);
  });

  it('R2 keeps the old output without the option', async () => {
    const story = await writeMuseEntry(STORY);
    const skipped: string[] = [];
    const manifest = await run({ approvals: approvals([story]), onSkip: (id) => skipped.push(id) });

    const files = await deliveryFiles();
    expect(files).toContain(`${REUSE}-v1.png`);
    expect(files).toContain(`${REUSE}-line-v1.png`);
    expect(manifest.jobs.map((job) => job.id).sort()).toEqual([REUSE, STORY].sort());
    expect(skipped).toContain(SKIP);
    expect(await readFile(path.join(deliveryRoot, `${REUSE}-v1.png`))).toEqual(
      await readFile(path.join(root, REUSE_SOURCE)),
    );
  });

  it('R3 throws when an approval entry names a row that is not in the picture list', async () => {
    const story = await writeMuseEntry(STORY);
    const stranger = { rowId: 'l2-w09-story-page-not-in-the-list', version: 1, colorPrint: 'a.png', linePrint: 'b.png' };
    await expect(run({ approvals: approvals([story, stranger]), approvalsOnly: true })).rejects.toThrow(
      /not a row of the picture list/,
    );
    expect(existsSync(deliveryRoot)).toBe(false);
  });

  it('R4 throws when the approval list holds a wrong picture list pin', async () => {
    const story = await writeMuseEntry(STORY);
    await expect(
      run({
        approvals: { version: 1, entries: [story], pictureListSha256: 'a'.repeat(64) } as MuseApprovalList,
        approvalsOnly: true,
      }),
    ).rejects.toThrow(/differs from the pin/);
    expect(existsSync(deliveryRoot)).toBe(false);
  });
});
