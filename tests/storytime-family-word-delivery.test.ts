// Tests for the family-word color-only delivery writer (Task 3 of the track plan).
//
// The writer deliverMuseColorSet copies the color print of every family-word row into the
// delivery folder under `<row id>-v1.png` and writes one manifest.json with the color batches
// only. The tests use temp folders only. They make no provider call.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StorytimeManifest } from '../src/storytime/book-pictures.js';
import * as muse from '../src/storytime/muse-delivery.js';

/** The 19 row ids of the track. The family row reuses the card print of the card track. */
const TRACK_IDS = [
  'l2-w01-card-friend',
  'l2-w04-card-family',
  'l2-w05-card-eyes',
  'l2-w05-card-ears',
  'l2-w05-card-nose',
  'l2-w05-card-hands',
  'l2-w05-card-arms',
  'l2-w05-card-legs',
  'l2-w05-card-feet',
  'l2-w06-card-cat',
  'l2-w06-card-dog',
  'l2-w06-card-bird',
  'l2-w06-card-fish',
  'l2-w06-card-frog',
  'l2-w06-card-duck',
  'l2-w06-card-horse',
  'l2-w07-card-ball',
  'l2-w07-card-kite',
  'l2-w07-card-drum',
];

const FRIEND = 'l2-w01-card-friend';
const FAMILY = 'l2-w04-card-family';
const CAT = 'l2-w06-card-cat';

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** The Muse print file name of one row. */
const printName = (rowId: string, version = 1) => `${rowId}-m${version}-color-print.png`;

/** A flat color for one row, so every print holds different bytes. */
const colorOf = (name: string): string => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 16777216;
  const parts = [(hash >> 16) & 255, (hash >> 8) & 255, hash & 255];
  return `#${parts.map((part) => part.toString(16).padStart(2, '0')).join('')}`;
};

/** A color print of the size class C size. */
const goodPng = (name: string, width = 1500, height = 1500): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background: colorOf(name) } }).png().toBuffer();

/** One approval entry of a family-word row. */
const entry = (rowId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  rowId,
  version: 1,
  colorPrint: printName(rowId),
  text: rowId.replace('l2-w', '').replace('-card-', ' '),
  sourcePrompt: `One picture that shows the word of ${rowId}.`,
  ...overrides,
});

/** The approval list of the writer. The cast lets a test send a list that the writer refuses. */
const approvalList = (entries: Array<Record<string, unknown>>): muse.MuseColorSetApprovalList =>
  ({ version: 1, entries }) as unknown as muse.MuseColorSetApprovalList;

/** One Kimi review. */
const kimiReview = (verdict: 'pass' | 'fail') => ({
  provider: 'kimi',
  model: 'kimi-k2',
  verdict,
  reason: 'a model note',
  checkedAt: '2026-11-07T00:00:00Z',
});

let root: string;
let museRoot: string;
let deliveryRoot: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'storytime-family-word-delivery-'));
  museRoot = path.join(root, 'muse');
  deliveryRoot = path.join(root, 'delivery');
  await mkdir(museRoot, { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** The file names below a folder, relative to the folder. */
async function filesBelow(directory: string): Promise<string[]> {
  if (!existsSync(directory)) return [];
  const names: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) names.push(...(await filesBelow(full)));
    else names.push(path.relative(directory, full));
  }
  return names.sort();
}

/** Writes one color print into the Muse folder. */
async function writePrint(name: string, bytes: Buffer): Promise<string> {
  const file = path.join(museRoot, name);
  await writeFile(file, bytes);
  return file;
}

/** Writes the good print of one row. */
async function writeGoodPrint(rowId: string, version = 1): Promise<string> {
  return writePrint(printName(rowId, version), await goodPng(rowId));
}

const jobOf = (manifest: StorytimeManifest, rowId: string) =>
  manifest.jobs.find((job) => job.id === rowId) ?? (() => { throw new Error(`no job ${rowId}`); })();

describe('the family-word color delivery (FD)', () => {
  it('FD1 holds the writer seam and the two old writers', () => {
    expect(typeof muse.deliverMuseColorSet, 'The deliverMuseColorSet seam exists.').toBe('function');
    expect(typeof muse.deliverMuseCover, 'The deliverMuseCover seam exists.').toBe('function');
    expect(typeof muse.writeMuseDelivery, 'The writeMuseDelivery seam exists.').toBe('function');
  });

  it('FD2 copies every print byte for byte and writes one manifest', async () => {
    const ids = [FRIEND, FAMILY, CAT];
    for (const id of ids) await writeGoodPrint(id);
    const manifest = await muse.deliverMuseColorSet({
      approvals: approvalList(ids.map((id) => entry(id))),
      museRoot,
      deliveryRoot,
    });
    expect(await filesBelow(deliveryRoot)).toEqual(
      [...ids.map((id) => `${id}-v1.png`), 'manifest.json'].sort(),
    );
    for (const id of ids) {
      const copy = await readFile(path.join(deliveryRoot, `${id}-v1.png`));
      const original = await readFile(path.join(museRoot, printName(id)));
      expect(sha256(copy), `${id} copy bytes`).toBe(sha256(original));
      expect(existsSync(path.join(museRoot, printName(id))), `${id} Muse original`).toBe(true);
    }
    const onDisk = await readFile(path.join(deliveryRoot, 'manifest.json'), 'utf8');
    expect(onDisk).toBe(`${JSON.stringify(manifest, null, 2)}\n`);
    expect(JSON.parse(onDisk)).toEqual(manifest);
  });

  it('FD3 holds the job values of the manifest job values table', async () => {
    const ids = [FRIEND, CAT, FAMILY];
    for (const id of ids) await writeGoodPrint(id);
    const manifest = await muse.deliverMuseColorSet({
      approvals: approvalList(ids.map((id) => entry(id))),
      museRoot,
      deliveryRoot,
    });
    const wanted = [
      { id: FRIEND, week: 1, directory: 'w01' },
      { id: CAT, week: 6, directory: 'w06' },
      { id: FAMILY, week: 4, directory: 'w04' },
    ];
    const texts: string[] = [];
    for (const row of wanted) {
      const job = jobOf(manifest, row.id);
      expect({
        id: job.id,
        week: job.week,
        directory: job.directory,
        bookKind: job.bookKind,
        bookTitle: job.bookTitle,
        page: job.page,
        text: job.text,
        sourcePrompt: job.sourcePrompt,
        characters: job.characters,
        sourcePackage: job.sourcePackage,
        sourceSha256: job.sourceSha256,
        slug: job.slug,
        use: job.use,
        size: job.size,
      }).toEqual({
        id: row.id,
        week: row.week,
        directory: row.directory,
        bookKind: 'readalong',
        bookTitle: '',
        page: 0,
        text: job.text,
        sourcePrompt: job.sourcePrompt,
        characters: [],
        sourcePackage: '',
        sourceSha256: '',
        slug: row.id,
        use: 'small',
        size: 'small',
      });
      expect(job.text).not.toBe('');
      expect(job.sourcePrompt).not.toBe('');
      texts.push(job.text);
      const candidate = job.candidates[0]!;
      expect(candidate.file).toBe(`${row.id}-v1.png`);
      expect(job.selectedFile).toBe(`${row.id}-v1.png`);
      expect(job.status).toBe('ready');
      expect(candidate.status).toBe('ready');
      const printSha = sha256(await readFile(path.join(museRoot, printName(row.id))));
      expect(candidate.fileSha256).toBe(printSha);
      expect(job.selectedSha256).toBe(printSha);
      expect(candidate.structural.valid).toBe(true);
      expect(candidate.structural.width).toBe(1500);
      expect(candidate.structural.height).toBe(1500);
    }
    expect(new Set(texts).size, 'FD3 distinct texts').toBe(3);
  });

  it('FD4 writes the color batches only', async () => {
    const ids = [FRIEND, FAMILY, CAT];
    for (const id of ids) await writeGoodPrint(id);
    const manifest = await muse.deliverMuseColorSet({
      approvals: approvalList(ids.map((id) => entry(id))),
      museRoot,
      deliveryRoot,
    });
    expect(manifest.batches.every((batch) => batch.outputKind === 'color')).toBe(true);
    expect(
      manifest.jobs.every((job) => job.candidates.every((candidate) => !('lineArt' in candidate))),
    ).toBe(true);
    expect(manifest.batches.map((batch) => batch.id).sort()).toEqual(['w01/color', 'w04/color', 'w06/color']);
    for (const batch of manifest.batches) {
      const week = batch.id.slice(1, 3);
      expect(batch.files.map((file) => file.file).sort()).toEqual(
        manifest.jobs
          .filter((job) => job.directory === `w${week}`)
          .map((job) => `${job.id}-v1.png`)
          .sort(),
      );
    }
  });

  it('FD5 writes 19 jobs and five color batches', async () => {
    for (const id of TRACK_IDS) await writeGoodPrint(id);
    const manifest = await muse.deliverMuseColorSet({
      approvals: approvalList(TRACK_IDS.map((id) => entry(id))),
      museRoot,
      deliveryRoot,
    });
    expect(manifest.jobs.length).toBe(19);
    expect(manifest.batches.length).toBe(5);
    const counts = manifest.batches
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((batch) => [batch.id, batch.files.length]);
    expect(counts).toEqual([
      ['w01/color', 1],
      ['w04/color', 1],
      ['w05/color', 7],
      ['w06/color', 7],
      ['w07/color', 3],
    ]);
  });

  it('FD6 refuses a print that is not a size class C color print', async () => {
    const rowId = CAT;
    const sixteen = await sharp({ create: { width: 1500, height: 1500, channels: 3, background: '#ffffff' } })
      .toColourspace('rgb16')
      .png()
      .toBuffer();
    const sixteenMeta = await sharp(sixteen).metadata();
    expect(sixteenMeta.depth, 'FD6 the 16-bit fixture').not.toBe('uchar');
    const cases: Array<{ name: string; bytes: Buffer }> = [
      { name: 'too narrow', bytes: await goodPng(rowId, 1400, 1500) },
      { name: 'too short', bytes: await goodPng(rowId, 1500, 1400) },
      { name: 'too large', bytes: await goodPng(rowId, 4000, 3000) },
      { name: 'with alpha', bytes: await sharp({ create: { width: 1500, height: 1500, channels: 4, background: '#ffffff' } }).png().toBuffer() },
      { name: 'grayscale', bytes: await sharp({ create: { width: 1500, height: 1500, channels: 3, background: '#ffffff' } }).toColourspace('b-w').png().toBuffer() },
      { name: '16-bit', bytes: sixteen },
      { name: 'jpeg bytes', bytes: await sharp({ create: { width: 1500, height: 1500, channels: 3, background: '#ffffff' } }).jpeg().toBuffer() },
      { name: 'garbage', bytes: Buffer.from('not a picture at all') },
    ];
    for (const bad of cases) {
      await writePrint(printName(rowId), bad.bytes);
      await expect(
        muse.deliverMuseColorSet({
          approvals: approvalList([entry(rowId)]),
          museRoot,
          deliveryRoot,
        }),
        `FD6 ${bad.name}`).rejects.toThrow(new RegExp(rowId));
      expect(await filesBelow(deliveryRoot), `FD6 ${bad.name} wrote no file`).toEqual([]);
    }
    await writeGoodPrint(rowId);
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(rowId)]),
        museRoot,
        deliveryRoot,
      }),
    ).resolves.toBeTruthy();
  });

  it('FD7 refuses two entries with the same row id', async () => {
    await writeGoodPrint(FRIEND);
    await writeGoodPrint(CAT);
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(FRIEND), entry(FRIEND)]),
        museRoot,
        deliveryRoot,
      }),
    ).rejects.toThrow(/twice/);
    expect(await filesBelow(deliveryRoot)).toEqual([]);
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(FRIEND), entry(CAT)]),
        museRoot,
        deliveryRoot,
      }),
    ).resolves.toBeTruthy();
  });

  it('FD8 refuses a row id outside the family-word form', async () => {
    const bad = [
      'l2-w10-card-cat',
      'l2-w00-card-cat',
      'l2-w05-cat',
      'l2-w05-card-',
      'l2-cover-v1',
      '../l2-w05-card-cat',
      'l2-w05-card-cat/x',
    ];
    for (const rowId of bad) {
      await writePrint('print.png', await goodPng(rowId));
      await expect(
        muse.deliverMuseColorSet({
          approvals: approvalList([entry(rowId, { colorPrint: 'print.png' })]),
          museRoot,
          deliveryRoot,
        }),
        `FD8 ${rowId}`).rejects.toThrow(/row id/);
      expect(await filesBelow(deliveryRoot), `FD8 ${rowId} wrote no file`).toEqual([]);
    }
    for (const rowId of TRACK_IDS) await writeGoodPrint(rowId);
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList(TRACK_IDS.map((id) => entry(id))),
        museRoot,
        deliveryRoot,
      }),
    ).resolves.toBeTruthy();
  });

  it('FD9 refuses a print name with a folder part', async () => {
    await writeGoodPrint(CAT);
    const names = ['sub/x.png', '../x.png', '/abs/x.png', '.', '..', ''];
    for (const name of names) {
      await expect(
        muse.deliverMuseColorSet({
          approvals: approvalList([entry(CAT, { colorPrint: name })]),
          museRoot,
          deliveryRoot,
        }),
        `FD9 ${name}`).rejects.toThrow(/invalid|plain file name/i);
      expect(await filesBelow(deliveryRoot), `FD9 ${name} wrote no file`).toEqual([]);
    }
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(CAT)]),
        museRoot,
        deliveryRoot,
      }),
    ).resolves.toBeTruthy();
  });

  it('FD10 refuses a delivered file that exists', async () => {
    await writeGoodPrint(CAT);
    await mkdir(deliveryRoot, { recursive: true });
    const delivered = path.join(deliveryRoot, `${CAT}-v1.png`);
    const original = await readFile(path.join(museRoot, printName(CAT)));
    for (const bytes of [Buffer.from('other bytes'), original]) {
      await writeFile(delivered, bytes);
      await expect(
        muse.deliverMuseColorSet({
          approvals: approvalList([entry(CAT)]),
          museRoot,
          deliveryRoot,
        }),
      ).rejects.toThrow(/exists/);
      expect(sha256(await readFile(delivered)), 'FD10 the pre-existing bytes').toBe(sha256(bytes));
      expect(await filesBelow(deliveryRoot)).toEqual([`${CAT}-v1.png`]);
    }
  });

  it('FD11 refuses a symlinked delivery folder and a symlinked print', async () => {
    await writeGoodPrint(CAT);
    const target = path.join(root, 'target');
    await mkdir(target, { recursive: true });
    await symlink(target, deliveryRoot);
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(CAT)]),
        museRoot,
        deliveryRoot,
      }),
    ).rejects.toThrow(/symlink/);
    expect(await filesBelow(target)).toEqual([]);
    await rm(deliveryRoot, { force: true });
    await writeGoodPrint(CAT);
    const printFile = path.join(museRoot, printName(CAT));
    const linked = path.join(museRoot, 'linked-print.png');
    await symlink(printFile, linked);
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(CAT, { colorPrint: 'linked-print.png' })]),
        museRoot,
        deliveryRoot,
      }),
    ).rejects.toThrow(/symlink/);
    expect(await filesBelow(deliveryRoot)).toEqual([]);
  });

  it('FD12 writes nothing when a later print is bad', async () => {
    for (const id of [FRIEND, FAMILY]) await writeGoodPrint(id);
    await writePrint(printName(CAT), await goodPng(CAT, 800, 800));
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(FRIEND), entry(FAMILY), entry(CAT)]),
        museRoot,
        deliveryRoot,
      }),
    ).rejects.toThrow(/nothing was written/);
    expect(existsSync(deliveryRoot), 'FD12 the delivery folder stays absent').toBe(false);
    await mkdir(deliveryRoot, { recursive: true });
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([entry(FRIEND), entry(FAMILY), entry(CAT)]),
        museRoot,
        deliveryRoot,
      }),
    ).rejects.toThrow(/nothing was written/);
    expect(await filesBelow(deliveryRoot), 'FD12 the delivery folder stays empty').toEqual([]);
  });

  it('FD13 refuses a malformed approval list', async () => {
    await writeGoodPrint(CAT);
    const malformed: Array<{ name: string; approvals: unknown }> = [
      { name: 'no entries', approvals: { version: 1, entries: [] } },
      { name: 'version 2', approvals: { version: 2, entries: [entry(CAT)] } },
      { name: 'a line print key', approvals: { version: 1, entries: [entry(CAT, { linePrint: printName(CAT) })] } },
      { name: 'no text', approvals: { version: 1, entries: [entry(CAT, { text: undefined })] } },
      { name: 'no source prompt', approvals: { version: 1, entries: [entry(CAT, { sourcePrompt: undefined })] } },
      { name: 'no color print', approvals: { version: 1, entries: [entry(CAT, { colorPrint: undefined })] } },
      { name: 'a failed review', approvals: { version: 1, entries: [entry(CAT, { reviews: { kimi: kimiReview('fail') } })] } },
    ];
    for (const bad of malformed) {
      await expect(
        muse.deliverMuseColorSet({
          approvals: bad.approvals as muse.MuseColorSetApprovalList,
          museRoot,
          deliveryRoot,
        }),
        `FD13 ${bad.name}`).rejects.toThrow(/invalid|not clean|verdict/i);
      expect(await filesBelow(deliveryRoot), `FD13 ${bad.name} wrote no file`).toEqual([]);
    }
    await expect(
      muse.deliverMuseColorSet({
        approvals: approvalList([
          entry(CAT, { notes: ['a note'], reviews: { kimi: kimiReview('pass') } }),
        ]),
        museRoot,
        deliveryRoot,
      }),
    ).resolves.toBeTruthy();
  });

  it('FD14 wires the review of an entry', async () => {
    for (const id of [FRIEND, CAT]) await writeGoodPrint(id);
    const manifest = await muse.deliverMuseColorSet({
      approvals: approvalList([
        entry(FRIEND, { reviews: { kimi: kimiReview('pass') } }),
        entry(CAT),
      ]),
      museRoot,
      deliveryRoot,
    });
    const withReview = jobOf(manifest, FRIEND).candidates[0]!;
    expect(withReview.reviews.kimi?.sourceText).toBe(jobOf(manifest, FRIEND).text);
    expect(withReview.reviews.kimi?.sourcePrompt).toBe(jobOf(manifest, FRIEND).sourcePrompt);
    const withoutReview = jobOf(manifest, CAT).candidates[0]!;
    expect(withoutReview.reviews).toEqual({});
  });

  it('FD15 writes the same manifest bytes in two fresh folders', async () => {
    const ids = [FRIEND, CAT];
    for (const id of ids) await writeGoodPrint(id);
    const approvals = approvalList(ids.map((id) => entry(id)));
    const first = path.join(root, 'delivery-one');
    const second = path.join(root, 'delivery-two');
    await muse.deliverMuseColorSet({ approvals, museRoot, deliveryRoot: first });
    await muse.deliverMuseColorSet({ approvals, museRoot, deliveryRoot: second });
    const one = await readFile(path.join(first, 'manifest.json'));
    const two = await readFile(path.join(second, 'manifest.json'));
    expect(sha256(one)).toBe(sha256(two));
  });
});
