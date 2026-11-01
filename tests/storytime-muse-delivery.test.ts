import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BATCH_HASH_ALGORITHM,
  PICTURE_SIZES,
  batchSha256,
  type CandidateManifest,
  type ManifestJob,
  type PictureListRow,
  type StorytimeManifest,
} from '../src/storytime/book-pictures.js';
import { writeMuseDelivery } from '../src/storytime/muse-delivery.js';

// Red tests for the Muse week 1 delivery manifest (plan task "Add failing tests for the Muse week
// 1 delivery manifest (Red)"). The PM delivery contract is spec.md decision 2 of the amendment
// 2026-11-01: one manifest.json in the 11a06b9c shape at the delivery batch root, job.id = the
// picture-list row id, the color print copied to `<row id>-v1.png`, the line print copied to
// `<row id>-line-v1.png`, and only clean rows in the manifest.
//
// The API that Green must add in src/storytime/muse-delivery.ts:
//
//   export async function writeMuseDelivery(options: {
//     rows: PictureListRow[];
//     approvals: MuseApprovalList | string;
//     museRoot: string;
//     deliveryRoot: string;
//   }): Promise<StorytimeManifest>;
//
//   MuseApprovalList = { version: 1; entries: MuseApprovalEntry[] }
//   MuseApprovalEntry = {
//     rowId: string;
//     version: number;
//     colorPrint: string;   // file name in museRoot
//     linePrint: string;    // file name in museRoot, also `-line-print-<k>.png`
//     reviews?: { kimi?: {...}; person?: {...} };
//     notes?: string[];
//   }
//
// The writer reads the two Muse print files, copies them into the delivery folder under the list
// row names, and writes manifest.json. It uses the existing BATCH_HASH_ALGORITHM and batchSha256.

const ROWS: PictureListRow[] = [
  {
    id: 'l2-w01-story-page-a-nut',
    week: 1,
    use: 'story-page',
    sizeClass: 'A',
    fileName: 'l2-w01-story-page-a-nut-v1.png',
    lineArtFileName: 'l2-w01-story-page-a-nut-line-v1.png',
    width: 4000,
    height: 3000,
    text: 'A nut.',
    prompt: 'One nut on the classroom table.',
  },
  {
    id: 'l2-w01-cover-b-hen',
    week: 1,
    use: 'cover',
    sizeClass: 'B',
    fileName: 'l2-w01-cover-b-hen-v1.png',
    lineArtFileName: 'l2-w01-cover-b-hen-line-v1.png',
    width: 4000,
    height: 3000,
    text: '',
    prompt: 'One hen on the reader cover.',
  },
  {
    id: 'l2-w01-check-row-cat',
    week: 1,
    use: 'check-row',
    sizeClass: 'C',
    fileName: 'l2-w01-check-row-cat-v1.png',
    lineArtFileName: 'l2-w01-check-row-cat-line-v1.png',
    width: 1500,
    height: 1500,
    text: 'cat',
    prompt: 'One cat.',
  },
  {
    // A row of the list that has no approval entry. It is not clean and it gets no job.
    id: 'l2-w01-story-page-a-mop',
    week: 1,
    use: 'story-page',
    sizeClass: 'A',
    fileName: 'l2-w01-story-page-a-mop-v1.png',
    lineArtFileName: 'l2-w01-story-page-a-mop-line-v1.png',
    width: 4000,
    height: 3000,
    text: 'A mop.',
    prompt: 'One mop in the corner.',
  },
];

const NUT = 'l2-w01-story-page-a-nut';
const HEN = 'l2-w01-cover-b-hen';
const CAT = 'l2-w01-check-row-cat';
const MOP = 'l2-w01-story-page-a-mop';
const CLEAN_ROWS = [NUT, HEN, CAT];

const BACKGROUNDS = ['#88ccff', '#ffd27f', '#9fe0a0'];

function sizeKeyOf(row: PictureListRow): 'story' | 'cover' | 'small' {
  if (row.sizeClass === 'C') return 'small';
  if (row.sizeClass === 'B') return 'cover';
  return 'story';
}

function museNames(rowId: string, version: number, lineTry = 1): { colorPrint: string; linePrint: string } {
  const base = `${rowId}-m${version}`;
  return {
    colorPrint: `${base}-color-print.png`,
    linePrint: `${base}-line-print${lineTry === 1 ? '' : `-${lineTry}`}.png`,
  };
}

const APPROVALS = [
  { rowId: NUT, version: 1, lineTry: 1 },
  { rowId: HEN, version: 2, lineTry: 1 },
  { rowId: CAT, version: 1, lineTry: 2 },
];

function rowFor(id: string): PictureListRow {
  const row = ROWS.find((item) => item.id === id);
  if (!row) throw new Error(`The test has no row ${id}.`);
  return row;
}

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/** The fixtures are large and pure, so one buffer of each shape serves every test. */
const pngCache = new Map<string, Buffer>();

/** A pure black and white line print: a thick black frame on white. No gray value. */
async function linePng(width: number, height: number, inset: number): Promise<Buffer> {
  const key = `line:${width}x${height}:${inset}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const pixels = Buffer.alloc(width * height, 255);
  const t = 80 + inset;
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
  const cached = pngCache.get(key);
  if (cached) return cached;
  const pixels = Buffer.alloc(width * height, 255);
  for (let y = 200; y < 260; y += 1) pixels.fill(128, y * width + 200, y * width + width - 200);
  pixels.fill(0, 300 * width + 200, 300 * width + width - 200);
  const png = await sharp(pixels, { raw: { width, height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
  pngCache.set(key, png);
  return png;
}

async function colorPng(width: number, height: number, background: string): Promise<Buffer> {
  const key = `color:${width}x${height}:${background}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp({ create: { width, height, channels: 3, background } }).png().toBuffer();
  pngCache.set(key, png);
  return png;
}

let root: string;
let museRoot: string;
let deliveryRoot: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'muse-delivery-'));
  museRoot = path.join(root, 'muse');
  deliveryRoot = path.join(root, 'delivery');
  await mkdir(museRoot, { recursive: true });
  for (const [index, entry] of APPROVALS.entries()) {
    const row = rowFor(entry.rowId);
    const size = PICTURE_SIZES[sizeKeyOf(row)];
    const names = museNames(entry.rowId, entry.version, entry.lineTry);
    await writeFile(path.join(museRoot, names.colorPrint), await colorPng(size.width, size.height, BACKGROUNDS[index]!));
    await writeFile(path.join(museRoot, names.linePrint), await linePng(size.width, size.height, 40 * index));
  }
});

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

function approvalList() {
  return {
    version: 1 as const,
    entries: [
      {
        rowId: NUT,
        version: 1,
        ...museNames(NUT, 1),
        reviews: {
          kimi: {
            provider: 'kimi' as const,
            model: 'kimi-k2-vision',
            verdict: 'pass' as const,
            reason: 'One nut, no letters, clean outline.',
            checkedAt: '2026-11-01T04:00:00.000Z',
            rawFile: `reviews/${NUT}-kimi.json`,
          },
        },
        notes: ['Mimo pre-check: hands and count are clean.'],
      },
      {
        rowId: HEN,
        version: 2,
        ...museNames(HEN, 2),
        reviews: {
          kimi: {
            provider: 'kimi' as const,
            model: 'kimi-k2-vision',
            verdict: 'pass' as const,
            reason: 'One hen, calm top.',
            checkedAt: '2026-11-01T04:10:00.000Z',
            rawFile: `reviews/${HEN}-kimi.json`,
          },
          person: {
            checkedBy: 'Daniel',
            verdict: 'pass' as const,
            checkedAt: '2026-11-01T05:00:00.000Z',
            evidenceClass: 'person-checked' as const,
            observedCounts: { hen: 1 },
          },
        },
      },
      {
        rowId: CAT,
        version: 1,
        ...museNames(CAT, 1, 2),
        reviews: {},
      },
    ],
  };
}

type ApprovalList = ReturnType<typeof approvalList>;

function deliver(
  target: string = deliveryRoot,
  approvals: ApprovalList | string = approvalList(),
): Promise<StorytimeManifest> {
  return writeMuseDelivery({ rows: ROWS, approvals, museRoot, deliveryRoot: target });
}

async function walk(directory: string): Promise<string[]> {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

/** Resolves a manifest file entry against the delivery folder. A folder prefix is free. */
async function deliveredFile(target: string, file: string): Promise<string> {
  const direct = path.isAbsolute(file) ? file : path.join(target, file);
  if (existsSync(direct)) return direct;
  const base = path.basename(file);
  const found = (await walk(target)).find((item) => item === file || item.endsWith(`/${file}`) || path.basename(item) === base);
  if (!found) throw new Error(`The delivery folder ${target} holds no file that ends with ${file}.`);
  return found;
}

function jobFor(manifest: StorytimeManifest, id: string): ManifestJob {
  const job = manifest.jobs.find((item) => item.id === id);
  if (!job) throw new Error(`The manifest holds no job for ${id}.`);
  return job;
}

function candidateOf(job: ManifestJob): CandidateManifest {
  const candidate = job.candidates[0];
  if (!candidate) throw new Error(`The job ${job.id} holds no candidate.`);
  return candidate;
}

async function rejection(run: () => Promise<unknown>): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error('The writer resolved, but this test expects a rejection.');
}

describe('Muse week 1 delivery manifest', () => {
  it('T152 writes one manifest.json in the StorytimeManifest shape at the delivery folder', async () => {
    const manifest = await deliver();
    const file = path.join(deliveryRoot, 'manifest.json');
    expect(existsSync(file)).toBe(true);
    const written = JSON.parse(await readFile(file, 'utf8')) as StorytimeManifest;
    expect(written.version).toBe(1);
    expect(written.batchHashAlgorithm).toBe(BATCH_HASH_ALGORITHM);
    expect(Array.isArray(written.jobs)).toBe(true);
    expect(Array.isArray(written.batches)).toBe(true);
    expect(written).toEqual(manifest);
    const manifests = (await walk(deliveryRoot)).filter((item) => path.basename(item) === 'manifest.json');
    expect(manifests.length).toBe(1);
  });

  it('T153 gives one job for each approved row and none for an unapproved row', async () => {
    const manifest = await deliver();
    expect(manifest.jobs.map((job) => job.id).sort()).toEqual([...CLEAN_ROWS].sort());
    expect(manifest.jobs.some((job) => job.id === MOP)).toBe(false);
    for (const id of CLEAN_ROWS) {
      const job = jobFor(manifest, id);
      expect(job.candidates.length).toBe(1);
      expect(job.status).toBe('ready');
    }
  });

  it('T154 names the delivered color and line files as the picture list names them', async () => {
    const manifest = await deliver();
    for (const id of CLEAN_ROWS) {
      const row = rowFor(id);
      const candidate = candidateOf(jobFor(manifest, id));
      expect(candidate.file.endsWith(row.fileName)).toBe(true);
      const lineArt = candidate.lineArt;
      expect(lineArt).toBeDefined();
      if (!lineArt) continue;
      expect(lineArt.file.endsWith(row.lineArtFileName)).toBe(true);
      expect(lineArt.colorFile.endsWith(row.fileName)).toBe(true);
      const colorFile = await deliveredFile(deliveryRoot, candidate.file);
      const lineFile = await deliveredFile(deliveryRoot, lineArt.file);
      expect(path.basename(colorFile)).toBe(row.fileName);
      expect(path.basename(lineFile)).toBe(row.lineArtFileName);
    }
  });

  it('T155 copies the approved Muse print files with the same SHA-256', async () => {
    const manifest = await deliver();
    for (const entry of APPROVALS) {
      const row = rowFor(entry.rowId);
      const names = museNames(entry.rowId, entry.version, entry.lineTry);
      const sourceColor = await readFile(path.join(museRoot, names.colorPrint));
      const sourceLine = await readFile(path.join(museRoot, names.linePrint));
      const candidate = candidateOf(jobFor(manifest, entry.rowId));
      const colorSha = sha256(await readFile(await deliveredFile(deliveryRoot, candidate.file)));
      const lineArt = candidate.lineArt;
      expect(lineArt).toBeDefined();
      if (!lineArt) continue;
      const lineSha = sha256(await readFile(await deliveredFile(deliveryRoot, lineArt.file)));
      expect(colorSha).toBe(sha256(sourceColor));
      expect(lineSha).toBe(sha256(sourceLine));
      expect(candidate.fileSha256).toBe(colorSha);
      expect(lineArt.fileSha256).toBe(lineSha);
      expect(jobFor(manifest, entry.rowId).selectedSha256).toBe(colorSha);
      expect(path.basename(candidate.file)).toBe(row.fileName);
      expect(path.basename(lineArt.file)).toBe(row.lineArtFileName);
    }
  });

  it('T156 takes the pixel sizes from the row size class and refuses a wrong-size file', async () => {
    const manifest = await deliver();
    const expected: Record<string, 'story' | 'cover' | 'small'> = { [NUT]: 'story', [HEN]: 'cover', [CAT]: 'small' };
    for (const id of CLEAN_ROWS) {
      const key = expected[id];
      if (!key) throw new Error(`The test has no size key for ${id}.`);
      const job = jobFor(manifest, id);
      const candidate = candidateOf(job);
      expect(job.size).toBe(key);
      expect(candidate.structural.width).toBe(PICTURE_SIZES[key].width);
      expect(candidate.structural.height).toBe(PICTURE_SIZES[key].height);
      expect(candidate.lineArt?.structural.width).toBe(PICTURE_SIZES[key].width);
      expect(candidate.lineArt?.structural.height).toBe(PICTURE_SIZES[key].height);
    }
    expect(PICTURE_SIZES.story).toEqual({ width: 4000, height: 3000 });
    expect(PICTURE_SIZES.cover).toEqual({ width: 4000, height: 3000 });
    expect(PICTURE_SIZES.small).toEqual({ width: 1500, height: 1500 });

    const badRoot = path.join(root, 'delivery-bad-size');
    const names = museNames(NUT, 1);
    await writeFile(path.join(museRoot, names.colorPrint), await colorPng(4000, 2000, BACKGROUNDS[0]!));
    const colorError = await rejection(() => deliver(badRoot));
    expect(colorError.message).toContain(NUT);
    expect(colorError.message).toMatch(/size|pixel|width|height|dimension/i);
    expect(existsSync(path.join(badRoot, 'manifest.json'))).toBe(false);

    await writeFile(path.join(museRoot, names.colorPrint), await colorPng(4000, 3000, BACKGROUNDS[0]!));
    await writeFile(path.join(museRoot, names.linePrint), await linePng(2000, 1500, 0));
    const lineError = await rejection(() => deliver(badRoot));
    expect(lineError.message).toContain(NUT);
    expect(lineError.message).toMatch(/size|pixel|width|height|dimension/i);
    expect(existsSync(path.join(badRoot, 'manifest.json'))).toBe(false);
  });

  it('T157 accepts a pure black and white line art and refuses a gray value', async () => {
    const manifest = await deliver();
    for (const entry of APPROVALS) {
      const candidate = candidateOf(jobFor(manifest, entry.rowId));
      expect(candidate.lineArt?.structural.valid).toBe(true);
    }
    const badRoot = path.join(root, 'delivery-gray-line');
    const names = museNames(CAT, 1, 2);
    await writeFile(path.join(museRoot, names.linePrint), await grayLinePng(1500, 1500));
    const error = await rejection(() => deliver(badRoot));
    expect(error.message).toContain(CAT);
    expect(error.message).toMatch(/line|gray|grey|pure|0 and 255|black and white|1-bit/i);
    expect(existsSync(path.join(badRoot, 'manifest.json'))).toBe(false);
  });

  it('T158 leaves the Muse originals unchanged', async () => {
    const before = new Map<string, string>();
    for (const entry of APPROVALS) {
      const names = museNames(entry.rowId, entry.version, entry.lineTry);
      for (const name of [names.colorPrint, names.linePrint]) {
        const file = path.join(museRoot, name);
        before.set(file, sha256(await readFile(file)));
      }
    }
    await deliver();
    for (const [file, digest] of before) {
      expect(existsSync(file)).toBe(true);
      expect(sha256(await readFile(file))).toBe(digest);
    }
  });

  it('T159 maps a Kimi review to reviews.kimi and invents no review', async () => {
    const manifest = await deliver();
    const nut = candidateOf(jobFor(manifest, NUT));
    const kimi = nut.reviews.kimi;
    expect(kimi).toBeDefined();
    if (!kimi) return;
    expect(kimi.kind).toBe('model-pre-check');
    expect(kimi.provider).toBe('kimi');
    expect(kimi.verdict).toBe('pass');
    expect(kimi.jobId).toBe(NUT);
    expect(kimi.fileSha256).toBe(sha256(await readFile(await deliveredFile(deliveryRoot, nut.file))));
    expect(nut.reviews.minimax).toBeUndefined();
    expect(nut.reviews.person).toBeUndefined();

    const hen = candidateOf(jobFor(manifest, HEN));
    expect(hen.reviews.kimi?.provider).toBe('kimi');
    expect(hen.reviews.person?.checkedBy).toBe('Daniel');
    expect(hen.reviews.person?.verdict).toBe('pass');
    expect(hen.reviews.minimax).toBeUndefined();

    const cat = candidateOf(jobFor(manifest, CAT));
    expect(cat.reviews).toEqual({});
  });

  it('T160 hashes the delivered files with the existing batch hash algorithm', async () => {
    const manifest = await deliver();
    expect(manifest.batchHashAlgorithm).toBe(BATCH_HASH_ALGORITHM);
    const colorBatch = manifest.batches.find((batch) => batch.outputKind === 'color');
    const lineBatch = manifest.batches.find((batch) => batch.outputKind === 'lineart');
    expect(colorBatch).toBeDefined();
    expect(lineBatch).toBeDefined();
    if (!colorBatch || !lineBatch) return;
    expect(colorBatch.files.length).toBe(CLEAN_ROWS.length);
    expect(lineBatch.files.length).toBe(CLEAN_ROWS.length);
    expect(colorBatch.sha256).toBe(batchSha256(colorBatch.files));
    expect(lineBatch.sha256).toBe(batchSha256(lineBatch.files));
    expect(colorBatch.sha256).not.toBe(lineBatch.sha256);
    for (const entry of [...colorBatch.files, ...lineBatch.files]) {
      const file = await deliveredFile(deliveryRoot, entry.file);
      expect(entry.sha256).toBe(sha256(await readFile(file)));
    }
    const colorNames = colorBatch.files.map((entry) => path.basename(entry.file)).sort();
    expect(colorNames).toEqual(CLEAN_ROWS.map((id) => rowFor(id).fileName).sort());
  });

  it('T161 refuses a different manifest and repeats the same bytes on a second run', async () => {
    await mkdir(deliveryRoot, { recursive: true });
    const other = JSON.stringify({ version: 1, batchHashAlgorithm: 'other', jobs: [], batches: [] }, null, 2);
    await writeFile(path.join(deliveryRoot, 'manifest.json'), other);
    const error = await rejection(() => deliver());
    expect(error.message).toMatch(/manifest|overwrite|differ|exist/i);
    expect(await readFile(path.join(deliveryRoot, 'manifest.json'), 'utf8')).toBe(other);
    await rm(path.join(deliveryRoot, 'manifest.json'));

    const first = await deliver();
    const firstBytes = await readFile(path.join(deliveryRoot, 'manifest.json'), 'utf8');
    const second = await deliver();
    expect(second).toEqual(first);
    expect(await readFile(path.join(deliveryRoot, 'manifest.json'), 'utf8')).toBe(firstBytes);

    const approvalsFile = path.join(root, 'approved.json');
    await writeFile(approvalsFile, JSON.stringify(approvalList(), null, 2));
    const fromPath = await deliver(path.join(root, 'delivery-path'), approvalsFile);
    expect(fromPath.jobs.map((job) => job.id).sort()).toEqual([...CLEAN_ROWS].sort());
    expect(existsSync(path.join(root, 'delivery-path', 'manifest.json'))).toBe(true);
  });
});
