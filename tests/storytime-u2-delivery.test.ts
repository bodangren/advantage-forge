// Tests for the Storytime Level 2 unit 2 delivery writer (D3, 2026-11-08).
//
// deliverMuseUnit2 copies the approved Muse prints of the unit 2 run to one delivery folder
// under the picture list names and writes one manifest.json in the StorytimeManifest shape of
// unit 1. The 48 reuse rows copy the color file of their unit 1 source and its line twin. The
// tests cover:
//   - a normal approval entry: the color and line copy, the manifest job, and the batches;
//   - a reuse copy: the color file and the line twin under the new row names;
//   - a missing reuse source, a wrong size, an alpha channel, a gray line file, and a wrong list
//     pin: each stops the write and names the row id or the pin;
//   - a row with no entry and no reuse: the onSkip callback reports it.
//
// The tests use temp folders and small generated PNG fixtures. No test makes a provider call.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PICTURE_SIZES } from '../src/storytime/book-pictures.js';
import type { MuseApprovalList } from '../src/storytime/muse-delivery.js';
import {
  UNIT2_LIST_SHA256,
  deliverMuseUnit2,
  lineTwinOf,
  readUnit2List,
  reuseSourcesOf,
  type Unit2Row,
} from '../src/storytime/muse-delivery-u2.js';

vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const STORY = 'l2-w09-story-page-a-show';
const CARD = 'l2-w09-card-banana';
const REUSE = 'l2-w09-check-row-dog';
const SKIP = 'l2-w09-story-page-a-mop';
const REUSE_SOURCE = 'out/storytime/l2-unit1/w06/delivery-muse-v1/l2-w06-check-row-dog-v1.png';
const REUSE_LINE = 'out/storytime/l2-unit1/w06/delivery-muse-v1/l2-w06-check-row-dog-line-v1.png';

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');
const printName = (rowId: string, version: number, kind: 'color' | 'line') =>
  `${rowId}-m${version}-${kind}-print.png`;

/** A picture list row of the unit 2 list. */
const listRow = (id: string, use: string, sizeClass: 'A' | 'B' | 'C', week = 9) => {
  const size = sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
  return {
    id,
    week,
    use,
    sizeClass,
    fileName: `${id}-v1.png`,
    lineArtFileName: `${id}-line-v1.png`,
    width: size.width,
    height: size.height,
    text: use === 'check-row' || use === 'card' ? id.split('-').pop() : 'A page.',
    prompt: `One picture of ${id}.`,
  };
};

const ROWS = [
  listRow(STORY, 'story-page', 'A'),
  listRow(CARD, 'card', 'C'),
  listRow(REUSE, 'check-row', 'C'),
  listRow(SKIP, 'story-page', 'A'),
];

const FAN_W10 = listRow('l2-w10-check-row-fan', 'check-row', 'C', 10);
const FAN_W14 = listRow('l2-w14-check-row-fan', 'check-row', 'C', 14);
const FAN_SPEC_REL = 'docs/storytime/l2-unit2/w10/muse/l2-w10-check-row-fan.json';

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

/** A color print with an alpha channel. The writer must refuse it. */
async function alphaColorPng(width: number, height: number): Promise<Buffer> {
  const key = `alpha:${width}x${height}`;
  const hit = pngCache.get(key);
  if (hit) return hit;
  const png = await sharp({
    create: { width, height, channels: 4, background: { r: 20, g: 60, b: 120, alpha: 0.5 } },
  })
    .png()
    .toBuffer();
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

/** A line file that holds the gray value 128. The writer must refuse it. */
async function grayLinePng(width: number, height: number): Promise<Buffer> {
  const key = `gray:${width}x${height}`;
  const hit = pngCache.get(key);
  if (hit) return hit;
  const pixels = Buffer.alloc(width * height, 255);
  for (let y = 200; y < 260; y += 1) pixels.fill(128, y * width + 200, y * width + width - 200);
  pixels.fill(0, 300 * width + 200, 300 * width + width - 200);
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

/** Writes the list file and returns its measured SHA-256 pin. */
async function writeList(rows: unknown[]): Promise<string> {
  const text = `${JSON.stringify(rows, null, 2)}\n`;
  await mkdir(path.dirname(listFile), { recursive: true });
  await writeFile(listFile, text);
  return sha256(text);
}

const approvals = (entries: MuseApprovalList['entries']) => ({ version: 1 as const, entries });

/** One approval entry with its Muse print files in the Muse root. */
async function writeMuseEntry(rowId: string, version = 1) {
  return writeMuseEntryFor(ROWS.find((candidate) => candidate.id === rowId)!, version);
}

/** The same, for a row object that the base list does not hold. */
async function writeMuseEntryFor(row: ReturnType<typeof listRow>, version = 1) {
  const rowId = row.id;
  const size = row.sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
  const color = printName(rowId, version, 'color');
  const line = printName(rowId, version, 'line');
  await writeFile(path.join(museRoot, color), await colorPng(size.width, size.height));
  await writeFile(path.join(museRoot, line), await linePng(size.width, size.height));
  return { rowId, version, colorPrint: color, linePrint: line };
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'u2-delivery-'));
  listFile = path.join(root, 'list/pictures-u2.json');
  museRoot = path.join(root, 'muse');
  deliveryRoot = path.join(root, 'out/storytime/l2/unit2/w09/delivery-muse-v1');
  rowsFile = path.join(root, 'docs/storytime/l2-unit2/rows.json');
  await mkdir(museRoot, { recursive: true });
  pin = await writeList(ROWS);
  await mkdir(path.dirname(rowsFile), { recursive: true });
  await writeFile(rowsFile, JSON.stringify(ROWS_DOC, null, 2));
  // The reuse source of the unit 1 delivery folder.
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
  pin?: string;
  onSkip?: (id: string, reason: string) => void;
}) =>
  deliverMuseUnit2({
    listFile,
    pictureListPin: options.pin ?? pin,
    approvals: options.approvals,
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

describe('the unit 2 delivery writer (U2D)', () => {
  it('U2D1 copies a color and line entry under the list names and writes manifest.json', async () => {
    const story = await writeMuseEntry(STORY);
    const card = await writeMuseEntry(CARD);
    const manifest = await run({ approvals: approvals([story, card]), onSkip: () => {} });

    const files = await deliveryFiles();
    expect(files).toContain('manifest.json');
    expect(files).toContain(`${STORY}-v1.png`);
    expect(files).toContain(`${STORY}-line-v1.png`);
    expect(files).toContain(`${CARD}-v1.png`);
    expect(files).toContain(`${CARD}-line-v1.png`);

    const color = await readFile(path.join(museRoot, story.colorPrint));
    expect(await readFile(path.join(deliveryRoot, `${STORY}-v1.png`))).toEqual(color);

    const ids = manifest.jobs.map((job) => job.id).sort();
    expect(ids).toEqual([CARD, REUSE, STORY].sort());
    const storyJob = manifest.jobs.find((job) => job.id === STORY)!;
    expect(storyJob.selectedFile).toBe(`${STORY}-v1.png`);
    expect(storyJob.status).toBe('ready');
    const storyCandidate = storyJob.candidates[0]!;
    expect(storyCandidate.lineArt?.file).toBe(`${STORY}-line-v1.png`);
    expect(storyCandidate.structural.width).toBe(4000);
    expect(storyCandidate.structural.height).toBe(3000);
    expect(manifest.batches.map((batch) => batch.id).sort()).toEqual(['w09/color', 'w09/lineart']);
  });

  it('U2D2 copies the reuse color file and its line twin under the new row names', async () => {
    const story = await writeMuseEntry(STORY);
    await run({ approvals: approvals([story]) });

    const reuseColor = await readFile(path.join(root, REUSE_SOURCE));
    const reuseLine = await readFile(path.join(root, REUSE_LINE));
    expect(await readFile(path.join(deliveryRoot, `${REUSE}-v1.png`))).toEqual(reuseColor);
    expect(await readFile(path.join(deliveryRoot, `${REUSE}-line-v1.png`))).toEqual(reuseLine);
    expect(lineTwinOf(REUSE_SOURCE)).toBe(REUSE_LINE);
  });

  it('U2D3 refuses a missing reuse source and names the row id', async () => {
    const story = await writeMuseEntry(STORY);
    await rm(path.join(root, REUSE_SOURCE));
    await expect(run({ approvals: approvals([story]) })).rejects.toThrow(
      new RegExp(`${REUSE}: cannot read the reuse color file`),
    );
    expect(existsSync(deliveryRoot)).toBe(false);
  });

  it('U2D4 refuses a color print of the wrong size and names the row id', async () => {
    const story = await writeMuseEntry(STORY);
    await writeFile(path.join(museRoot, story.colorPrint), await colorPng(1500, 1500));
    await expect(run({ approvals: approvals([story]) })).rejects.toThrow(
      new RegExp(`${STORY}: color print: The color print must be 4000 x 3000 pixels`),
    );
    expect(existsSync(deliveryRoot)).toBe(false);
  });

  it('U2D5 refuses a color print with an alpha channel', async () => {
    const card = await writeMuseEntry(CARD);
    await writeFile(path.join(museRoot, card.colorPrint), await alphaColorPng(1500, 1500));
    await expect(run({ approvals: approvals([card]) })).rejects.toThrow(
      new RegExp(`${CARD}: color print: The color print must have no alpha channel`),
    );
    expect(existsSync(deliveryRoot)).toBe(false);
  });

  it('U2D6 refuses a line file that holds gray pixels', async () => {
    const card = await writeMuseEntry(CARD);
    await writeFile(path.join(museRoot, card.linePrint), await grayLinePng(1500, 1500));
    await expect(run({ approvals: approvals([card]) })).rejects.toThrow(
      new RegExp(`${CARD}: line print: Line-art twin must use only 0 and 255`),
    );
    expect(existsSync(deliveryRoot)).toBe(false);
  });

  it('U2D7 refuses a list whose SHA-256 differs from the pin', async () => {
    const story = await writeMuseEntry(STORY);
    await expect(run({ approvals: approvals([story]), pin: 'a'.repeat(64) })).rejects.toThrow(
      /differs from the pin/,
    );
    expect(UNIT2_LIST_SHA256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('U2D8 reports a row with no entry and no reuse, and gives it no job', async () => {
    const story = await writeMuseEntry(STORY);
    const skipped: string[] = [];
    const manifest = await run({
      approvals: approvals([story]),
      onSkip: (rowId: string) => skipped.push(rowId),
    });
    expect(skipped).toContain(SKIP);
    expect(manifest.jobs.some((job) => job.id === SKIP)).toBe(false);
    expect(await deliveryFiles()).not.toContain(`${SKIP}-v1.png`);
  });

  it('U2D10 copies an earlier-row reuse from the earlier row approval prints', async () => {
    const fanPin = await writeList([...ROWS, FAN_W10, FAN_W14]);
    await mkdir(path.dirname(path.join(root, FAN_SPEC_REL)), { recursive: true });
    await writeFile(path.join(root, FAN_SPEC_REL), JSON.stringify({ id: FAN_W10.id }, null, 2));
    const story = await writeMuseEntry(STORY);
    const fan = await writeMuseEntryFor(FAN_W10);
    const fanRows = [
      ...ROWS_DOC.rows,
      { id: FAN_W14.id, cast: [], reuse: { word: 'fan', source: FAN_SPEC_REL, kind: 'unit2-earlier-row' } },
    ];
    const manifest = await deliverMuseUnit2({
      listFile,
      pictureListPin: fanPin,
      approvals: approvals([story, fan]),
      rows: { rows: fanRows },
      repoRoot: root,
      museRoot,
      deliveryRoot,
      onSkip: () => {},
    });
    expect(await readFile(path.join(deliveryRoot, `${FAN_W14.id}-v1.png`))).toEqual(
      await readFile(path.join(museRoot, fan.colorPrint)),
    );
    expect(await readFile(path.join(deliveryRoot, `${FAN_W14.id}-line-v1.png`))).toEqual(
      await readFile(path.join(museRoot, fan.linePrint)),
    );
    expect(manifest.jobs.some((job) => job.id === FAN_W14.id)).toBe(true);
  });

  it('U2D11 stops the write when the earlier-row reuse has no approval entry', async () => {
    const fanPin = await writeList([...ROWS, FAN_W10, FAN_W14]);
    await mkdir(path.dirname(path.join(root, FAN_SPEC_REL)), { recursive: true });
    await writeFile(path.join(root, FAN_SPEC_REL), JSON.stringify({ id: FAN_W10.id }, null, 2));
    const story = await writeMuseEntry(STORY);
    const fanRows = [
      ...ROWS_DOC.rows,
      { id: FAN_W14.id, cast: [], reuse: { word: 'fan', source: FAN_SPEC_REL, kind: 'unit2-earlier-row' } },
    ];
    await expect(
      deliverMuseUnit2({
        listFile,
        pictureListPin: fanPin,
        approvals: approvals([story]),
        rows: { rows: fanRows },
        repoRoot: root,
        museRoot,
        deliveryRoot,
        onSkip: () => {},
      }),
    ).rejects.toThrow(new RegExp(`${FAN_W14.id}.*${FAN_W10.id}|${FAN_W10.id}.*${FAN_W14.id}`));
    expect(existsSync(deliveryRoot)).toBe(false);
  });

  it('U2D9 reads the list with its pin and finds the reuse sources', async () => {
    const list = await readUnit2List(listFile, pin);
    expect(list.rows).toHaveLength(ROWS.length);
    expect(list.sha256).toBe(pin);
    expect(await readUnit2List(listFile).catch((error: Error) => error.message)).toContain('differs from the pin');
    expect(reuseSourcesOf(ROWS_DOC.rows).get(REUSE)?.source).toBe(REUSE_SOURCE);
    await expect(readUnit2List(path.join(root, 'missing.json'), pin)).rejects.toThrow(/cannot read the unit 2 picture list/);
  });
});
