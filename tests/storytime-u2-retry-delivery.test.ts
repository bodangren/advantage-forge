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
import { PICTURE_SIZES, verifyManifest } from '../src/storytime/book-pictures.js';
import type { MuseApprovalEntry, MuseApprovalList } from '../src/storytime/muse-delivery.js';
import {
  deliverMuseUnit2,
  type LineWidthException,
  type Unit2Row,
} from '../src/storytime/muse-delivery-u2.js';

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

// ---------------------------------------------------------------------------
// The repair options of D19 (2026-11-11). The writer takes the version of a candidate from the
// picture list, and it waives the line width error of a listed row. The tests cover:
//   - `versionFromList`: the version of the candidate, the selected version, and the version that
//     the manifest verifier reads;
//   - the same fixture without the option: the old Muse version;
//   - the review version of the review mapping;
//   - `lineWidthExceptions`: a waived width error, a wrong measured width, one more line error,
//     and a row without an exception;
//   - both options absent: the manifest bytes stay the same.
//
// The unit 2 writer writes flat list names, so `verifyManifest` keeps a layout failure for every
// candidate of every unit 2 delivery. That limit is old and the maker does not fix it. The tests
// below check the version that the verifier reads, and the line art errors of the job.
//
// The tests use temp folders and small generated PNG fixtures. No test makes a provider call.
// ---------------------------------------------------------------------------

/** The frame of the line print fixtures sits this far inside the image, so the edge check passes. */
const FRAME_INSET = 100;

/**
 * A black frame line print of the given thickness, in pixels. The frame sits inside the image, so
 * the edge frame check passes. The measured line width is the thickness of the frame. One grey
 * pixel marks a print with one more line error.
 */
async function frameLinePng(width: number, height: number, thickness: number, grey = false): Promise<Buffer> {
  const key = `frame:${width}x${height}:${thickness}:${grey}`;
  const hit = pngCache.get(key);
  if (hit) return hit;
  const pixels = Buffer.alloc(width * height, 255);
  const left = FRAME_INSET;
  const right = width - FRAME_INSET;
  for (let y = FRAME_INSET; y < height - FRAME_INSET; y += 1) {
    if (y < FRAME_INSET + thickness || y >= height - FRAME_INSET - thickness) {
      pixels.fill(0, y * width + left, y * width + right);
    } else {
      pixels.fill(0, y * width + left, y * width + left + thickness);
      pixels.fill(0, y * width + right - thickness, y * width + right);
    }
  }
  if (grey) pixels[Math.floor(height / 2) * width + Math.floor(width / 2)] = 128;
  const png = await sharp(pixels, { raw: { width, height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
  pngCache.set(key, png);
  return png;
}

/** One approval entry whose line print has a frame of the given thickness, in pixels. */
async function writeMuseEntryWithLine(rowId: string, version: number, thickness: number, grey = false) {
  const row = ROWS.find((candidate) => candidate.id === rowId)!;
  const size = row.sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
  const colorPrint = `${rowId}-m${version}-color-print.png`;
  const linePrint = `${rowId}-m${version}-line-print.png`;
  await writeFile(path.join(museRoot, colorPrint), await colorPng(size.width, size.height));
  await writeFile(path.join(museRoot, linePrint), await frameLinePng(size.width, size.height, thickness, grey));
  return { rowId, version, colorPrint, linePrint };
}

/** The delivery folder of the repair tests. Each test uses its own folder. */
let repairRoot: string;

/** The writer of the repair tests. It takes the two options of D19. */
const runRepair = (options: {
  approvals: MuseApprovalList;
  approvalsOnly?: boolean;
  versionFromList?: boolean;
  lineWidthExceptions?: Record<string, LineWidthException>;
  deliveryRoot?: string;
}) =>
  deliverMuseUnit2({
    listFile,
    pictureListPin: pin,
    approvals: options.approvals,
    ...(options.approvalsOnly === undefined ? {} : { approvalsOnly: options.approvalsOnly }),
    ...(options.versionFromList === undefined ? {} : { versionFromList: options.versionFromList }),
    ...(options.lineWidthExceptions === undefined ? {} : { lineWidthExceptions: options.lineWidthExceptions }),
    rows: { rows: ROWS_DOC.rows },
    repoRoot: root,
    museRoot,
    deliveryRoot: options.deliveryRoot ?? repairRoot,
  });

describe('the repair options of D19 (R5 to R12)', () => {
  beforeEach(() => {
    repairRoot = path.join(root, 'out/storytime/l2/unit2/w09/delivery-muse-v1-repair1');
  });

  it('R5 gives the candidate and the selected version the version of the picture list', async () => {
    const card = await writeMuseEntry(CARD, 2);
    const manifest = await runRepair({ approvals: approvals([card]), approvalsOnly: true, versionFromList: true });
    const job = manifest.jobs.find((item) => item.id === CARD)!;
    const candidate = job.candidates[0]!;
    expect(candidate.version).toBe(1);
    expect(job.selectedVersion).toBe(1);
    expect(candidate.file).toBe(`${CARD}-v1.png`);
    // The verifier reads the candidate at the version of the candidate. The layout failure of the
    // flat unit 2 names stays, and it names the version of the candidate. So no failure of this
    // job names version 2.
    const failures = verifyManifest(manifest, { release: false, jobId: CARD });
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.filter((failure) => failure.includes(' v2'))).toEqual([]);
  });

  it('R6 keeps the Muse version without the option', async () => {
    const card = await writeMuseEntry(CARD, 2);
    const manifest = await runRepair({ approvals: approvals([card]), approvalsOnly: true });
    const job = manifest.jobs.find((item) => item.id === CARD)!;
    expect(job.candidates[0]!.version).toBe(2);
    expect(job.selectedVersion).toBe(2);
    const failures = verifyManifest(manifest, { release: false, jobId: CARD });
    expect(failures.some((failure) => failure.includes('candidate filename does not match its job'))).toBe(true);
    expect(failures.some((failure) => failure.includes(' v2'))).toBe(true);
  });

  it('R7 gives the review of the approval entry the version of the picture list', async () => {
    const card = await writeMuseEntry(CARD, 2);
    const entry: MuseApprovalEntry = {
      rowId: CARD,
      version: 2,
      colorPrint: card.colorPrint,
      linePrint: card.linePrint,
      reviews: {
        kimi: {
          provider: 'kimi',
          model: 'kimi-k2',
          verdict: 'pass',
          reason: 'The picture matches the text.',
          checkedAt: '2026-11-11T00:00:00Z',
        },
      },
    };
    const manifest = await runRepair({ approvals: approvals([entry]), approvalsOnly: true, versionFromList: true });
    const job = manifest.jobs.find((item) => item.id === CARD)!;
    const candidate = job.candidates[0]!;
    expect(candidate.version).toBe(1);
    expect(candidate.reviews.kimi?.version).toBe(1);
    // The release check compares the version of a review with the version of the candidate.
    const failures = verifyManifest(manifest, { release: true, jobId: CARD });
    expect(failures.filter((failure) => failure.includes('does not match the selected candidate'))).toEqual([]);
  });

  it('R8 waives the line width error of a listed row', async () => {
    const card = await writeMuseEntryWithLine(CARD, 1, 8);
    const reason = 'The owner accepts the 8 px line of this card row.';
    const manifest = await runRepair({
      approvals: approvals([card]),
      approvalsOnly: true,
      lineWidthExceptions: { [CARD]: { measuredPx: 8, requiredPx: 12, reason } },
    });
    const job = manifest.jobs.find((item) => item.id === CARD)!;
    const candidate = job.candidates[0]!;
    expect(candidate.lineWidthException).toEqual({
      measuredPx: 8,
      requiredPx: 12,
      reason,
      waivedError: 'Line-art twin lines must be at least 12 px thick; measured 8 px.',
    });
    expect(candidate.lineArt?.structural.errors).toEqual([]);
    expect(candidate.lineArt?.structural.valid).toBe(true);
    const failures = verifyManifest(manifest, { release: false, jobId: CARD });
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.filter((failure) => failure.includes('line-art structural check failed'))).toEqual([]);
  });

  it('R9 stops the delivery when the measured width of the exception differs', async () => {
    const card = await writeMuseEntryWithLine(CARD, 1, 8);
    await expect(
      runRepair({
        approvals: approvals([card]),
        approvalsOnly: true,
        lineWidthExceptions: { [CARD]: { measuredPx: 9, requiredPx: 12, reason: 'The owner accepts the 8 px line.' } },
      }),
    ).rejects.toThrow(/the line width exception measured 9 px, but the line print measured 8 px/);
    expect(existsSync(repairRoot)).toBe(false);
  });

  it('R10 refuses a listed row with one more line error', async () => {
    const card = await writeMuseEntryWithLine(CARD, 1, 8, true);
    await expect(
      runRepair({
        approvals: approvals([card]),
        approvalsOnly: true,
        lineWidthExceptions: { [CARD]: { measuredPx: 8, requiredPx: 12, reason: 'The owner accepts the 8 px line.' } },
      }),
    ).rejects.toThrow(/grey pixels found/);
    expect(existsSync(repairRoot)).toBe(false);
  });

  it('R11 refuses a narrow line of a row without an exception', async () => {
    const card = await writeMuseEntryWithLine(CARD, 1, 8);
    await expect(runRepair({ approvals: approvals([card]), approvalsOnly: true })).rejects.toThrow(
      /Line-art twin lines must be at least 12 px thick; measured 8 px/,
    );
    expect(existsSync(repairRoot)).toBe(false);
  });

  it('R12 keeps the manifest bytes without the options', async () => {
    const card = await writeMuseEntry(CARD, 2);
    const first = await runRepair({ approvals: approvals([card]), approvalsOnly: true });
    const bytes = await readFile(path.join(repairRoot, 'manifest.json'));
    // The same fixture with the options at their default values gives the same bytes.
    const second = await runRepair({
      approvals: approvals([card]),
      approvalsOnly: true,
      versionFromList: false,
      lineWidthExceptions: {},
    });
    expect(await readFile(path.join(repairRoot, 'manifest.json'))).toEqual(bytes);
    expect(second).toEqual(first);
    // The default output keeps the Muse version and holds no exception record.
    const candidate = first.jobs[0]!.candidates[0]!;
    expect(candidate.version).toBe(2);
    expect(Object.keys(candidate)).not.toContain('lineWidthException');
  });
});
