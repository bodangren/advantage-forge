import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BATCH_HASH_ALGORITHM,
  PICTURE_SIZES,
  batchSha256,
  runStorytimeCli,
  type CandidateManifest,
  type ManifestJob,
  type PictureListRow,
  type StorytimeManifest,
} from '../src/storytime/book-pictures.js';
import { writeMuseDelivery } from '../src/storytime/muse-delivery.js';
import { runStorytimeBookPicturesEntry } from '../scripts/storytime-book-pictures.js';

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

// Red remediation round 2 (2026-11-01). The reviews RB8-01 to RB8-07, review A F1, and review C
// F2 and F3 add hardening rules to the same writer. The new exports below do not exist yet, so
// the tests that need them fail with a missing-export error. The other new tests fail because the
// writer accepts the input today. The tests read and write real files only. The writer keeps
// using temporary folders, so the path containment rule lives in the exported resolver that the
// CLI calls.

type DeliveryOptions = Parameters<typeof writeMuseDelivery>[0];
type DeliveryApprovals = DeliveryOptions['approvals'];

/** The writer options plus the hardening keys that Green must add. */
function deliverWith(overrides: Record<string, unknown>): Promise<StorytimeManifest> {
  return writeMuseDelivery({
    rows: ROWS,
    approvals: approvalList(),
    museRoot,
    deliveryRoot,
    ...overrides,
  } as unknown as DeliveryOptions);
}

function listOf(entries: unknown[]): DeliveryApprovals {
  return { version: 1, entries } as unknown as DeliveryApprovals;
}

/** The RB8-02 resolver. It is absent at HEAD, so the caller gets a clear Red error. */
async function resolvePaths(options: {
  repoRoot: string;
  muse: string;
  delivery: string;
}): Promise<{ museRoot: string; deliveryRoot: string }> {
  const module = (await import('../src/storytime/muse-delivery.js')) as unknown as {
    resolveMuseDeliveryPaths?: (input: {
      repoRoot: string;
      muse: string;
      delivery: string;
    }) => { museRoot: string; deliveryRoot: string };
  };
  const resolver = module.resolveMuseDeliveryPaths;
  if (typeof resolver !== 'function') {
    throw new Error('src/storytime/muse-delivery.ts does not export resolveMuseDeliveryPaths (RB8-02).');
  }
  return resolver(options);
}

/** The RB8-01 pin check. It is absent at HEAD, so the caller gets a clear Red error. */
async function checkPin(listBytes: Buffer | string, approvals: unknown): Promise<void> {
  const module = (await import('../src/storytime/muse-delivery.js')) as unknown as {
    checkPictureListPin?: (bytes: Buffer | string, list: unknown) => void;
  };
  const checker = module.checkPictureListPin;
  if (typeof checker !== 'function') {
    throw new Error('src/storytime/muse-delivery.ts does not export checkPictureListPin (RB8-01).');
  }
  checker(listBytes, approvals);
}

/** A valid picture-list row for a name that the shared ROWS do not hold. */
function extraRow(id: string, overrides: Partial<PictureListRow> = {}): PictureListRow {
  return {
    id,
    week: 1,
    use: 'story-page',
    sizeClass: 'A',
    fileName: `${id}-v1.png`,
    lineArtFileName: `${id}-line-v1.png`,
    width: 4000,
    height: 3000,
    text: '',
    prompt: 'One object.',
    ...overrides,
  };
}

/** Writes one color and one line Muse print for a row and returns the approval file names. */
async function addMusePrints(
  row: PictureListRow,
  version: number,
  tag: string,
  background: string = BACKGROUNDS[0]!,
): Promise<{ colorPrint: string; linePrint: string }> {
  const size = PICTURE_SIZES[sizeKeyOf(row)];
  const colorPrint = `${row.id}-${tag}-m${version}-color-print.png`;
  const linePrint = `${row.id}-${tag}-m${version}-line-print.png`;
  await writeFile(path.join(museRoot, colorPrint), await colorPng(size.width, size.height, background));
  await writeFile(path.join(museRoot, linePrint), await linePng(size.width, size.height, 40));
  return { colorPrint, linePrint };
}

/** A palette PNG: 8-bit, sRGB, three channels, but a palette. Workbooks refuses it. */
async function palettePng(width: number, height: number): Promise<Buffer> {
  const key = `palette:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp({ create: { width, height, channels: 3, background: BACKGROUNDS[0]! } })
    .png({ palette: true })
    .toBuffer();
  pngCache.set(key, png);
  return png;
}

/** A one-channel grey PNG. The color print rule requires exactly three channels. */
async function oneChannelPng(width: number, height: number): Promise<Buffer> {
  const key = `one-channel:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp(Buffer.alloc(width * height, 200), { raw: { width, height, channels: 1 } })
    .toColourspace('b-w')
    .png()
    .toBuffer();
  pngCache.set(key, png);
  return png;
}

/** A 16-bit PNG. The color print rule requires 8-bit uchar pixels. */
async function deep16Png(width: number, height: number): Promise<Buffer> {
  const key = `deep16:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp({ create: { width, height, channels: 3, background: BACKGROUNDS[0]! } })
    .toColourspace('rgb16')
    .png()
    .toBuffer();
  pngCache.set(key, png);
  return png;
}

/** A four-channel PNG with an alpha channel. */
async function alphaPng(width: number, height: number): Promise<Buffer> {
  const key = `alpha:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp({
    create: { width, height, channels: 4, background: { r: 136, g: 204, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer();
  pngCache.set(key, png);
  return png;
}

describe('Muse delivery hardening (Red remediation round 2)', () => {
  it('T162 refuses an approval list whose pictureListSha256 does not match the list bytes', async () => {
    const entries = approvalList().entries;
    const listText = JSON.stringify(ROWS);
    const listBytes = Buffer.from(listText, 'utf8');
    const listSha = sha256(listBytes);

    // The pin matches the list bytes.
    await checkPin(listBytes, { version: 1, entries, pictureListSha256: listSha });
    // The pin differs from the list bytes.
    const pinError = await rejection(() =>
      checkPin(listBytes, { version: 1, entries, pictureListSha256: sha256('a different list') }),
    );
    expect(pinError.message).toMatch(/picture list|sha|pin/i);
    // The list carries no pin, so the check is a no-op.
    await checkPin(listBytes, { version: 1, entries });

    // The deliver path refuses a pinned list with different bytes and writes nothing.
    const mismatch = await rejection(() =>
      deliverWith({
        approvals: { version: 1, entries, pictureListSha256: sha256('a different list') },
        pictureListSha256: listSha,
      }),
    );
    expect(mismatch.message).toMatch(/picture list|sha|pin/i);
    expect(existsSync(path.join(deliveryRoot, 'manifest.json'))).toBe(false);

    // The deliver path accepts a matching pin.
    const manifest = await deliverWith({
      approvals: { version: 1, entries, pictureListSha256: listSha },
      pictureListSha256: listSha,
    });
    expect(manifest.jobs.map((job) => job.id).sort()).toEqual([...CLEAN_ROWS].sort());
  });

  it('T163 confines the Muse and delivery paths to the repository out folder', async () => {
    const repo = path.join(root, 'repo');
    const outRoot = path.join(repo, 'out');
    await mkdir(outRoot, { recursive: true });

    const inside = await resolvePaths({
      repoRoot: repo,
      muse: 'out/muse',
      delivery: path.join(outRoot, 'delivery'),
    });
    expect(inside.museRoot).toBe(path.join(outRoot, 'muse'));
    expect(inside.deliveryRoot).toBe(path.join(outRoot, 'delivery'));
    const okDelivery = await resolvePaths({ repoRoot: repo, muse: 'out/muse', delivery: 'out/delivery' });
    expect(okDelivery.deliveryRoot).toBe(path.join(outRoot, 'delivery'));

    const bad = [
      { repoRoot: repo, muse: 'out/muse', delivery: path.join(root, 'outside') },
      { repoRoot: repo, muse: 'out/muse', delivery: '../escape-delivery' },
      { repoRoot: repo, muse: path.join(root, 'outside-muse'), delivery: 'out/delivery' },
      { repoRoot: repo, muse: '../../escape-muse', delivery: 'out/delivery' },
    ];
    for (const options of bad) {
      const error = await rejection(() => resolvePaths(options));
      expect(error.message).toMatch(/out|outside|contain/i);
    }
  });

  it('T164 refuses a deliver CLI run whose paths leave the repository out folder', async () => {
    const repo = path.join(root, 'cli-repo');
    const outRoot = path.join(repo, 'out');
    const museFolder = path.join(outRoot, 'muse');
    const museEscape = path.join(root, 'cli-outside-muse');
    await mkdir(museFolder, { recursive: true });
    await mkdir(museEscape, { recursive: true });
    const row = rowFor(NUT);
    const colorPrint = 'nut-m1-color-print.png';
    const linePrint = 'nut-m1-line-print.png';
    for (const folder of [museFolder, museEscape]) {
      await writeFile(path.join(folder, colorPrint), await colorPng(4000, 3000, BACKGROUNDS[0]!));
      await writeFile(path.join(folder, linePrint), await linePng(4000, 3000, 40));
    }
    const listFile = path.join(repo, 'pictures.json');
    await writeFile(listFile, JSON.stringify([row], null, 2));
    const approvalsFile = path.join(repo, 'approved.json');
    await writeFile(
      approvalsFile,
      JSON.stringify({ version: 1, entries: [{ rowId: NUT, version: 1, colorPrint, linePrint }] }, null, 2),
    );
    const run = (delivery: string, muse: string) =>
      runStorytimeCli(
        ['deliver', '--list', listFile, '--approvals', approvalsFile, '--muse', muse, '--delivery', delivery],
        { repoRoot: repo, workbooksRoot: repo, log: () => {} },
      );

    const absolute = path.join(root, 'cli-outside');
    const absoluteError = await rejection(() => run(absolute, 'out/muse'));
    expect(absoluteError.message).toMatch(/out|outside|contain/i);
    expect(existsSync(absolute)).toBe(false);

    const relativeError = await rejection(() => run('../cli-escape', 'out/muse'));
    expect(relativeError.message).toMatch(/out|outside|contain/i);
    expect(existsSync(path.join(root, 'cli-escape'))).toBe(false);

    const museError = await rejection(() => run('out/delivery-muse-escape', museEscape));
    expect(museError.message).toMatch(/out|outside|contain/i);
    expect(existsSync(path.join(outRoot, 'delivery-muse-escape'))).toBe(false);

    const status = await run('out/delivery', 'out/muse');
    expect(status).toBe(0);
    expect(existsSync(path.join(outRoot, 'delivery', 'manifest.json'))).toBe(true);
  });

  it('T165 refuses a dangling symlink at a delivery target and writes no byte outside', async () => {
    const row = rowFor(NUT);
    await mkdir(deliveryRoot, { recursive: true });
    const outside = path.join(root, 'outside-target.png');
    await symlink(outside, path.join(deliveryRoot, row.fileName));

    const error = await rejection(() => deliver());
    expect(error.message).toMatch(/symlink|link|regular|exist|refus/i);
    expect(existsSync(outside)).toBe(false);
    expect(existsSync(path.join(deliveryRoot, 'manifest.json'))).toBe(false);
  });

  it('T166 refuses two rows that deliver the same file name in one run', async () => {
    const first = rowFor(NUT);
    const colorCopy = extraRow('l2-w01-story-page-a-nut-copy', { fileName: first.fileName });
    const colorPrints = await addMusePrints(colorCopy, 1, 'dupcolor', BACKGROUNDS[1]!);
    const colorError = await rejection(() =>
      writeMuseDelivery({
        rows: [...ROWS, colorCopy],
        approvals: listOf([...approvalList().entries, { rowId: colorCopy.id, version: 1, ...colorPrints }]),
        museRoot,
        deliveryRoot,
      }),
    );
    expect(colorError.message).toMatch(/duplicate|same|twice|collid/i);
    expect(await walk(deliveryRoot)).toEqual([]);

    const lineCopy = extraRow('l2-w01-story-page-a-nut-line-copy', {
      lineArtFileName: first.lineArtFileName,
    });
    const linePrints = await addMusePrints(lineCopy, 1, 'dupline', BACKGROUNDS[2]!);
    const lineTarget = path.join(root, 'delivery-line-dup');
    const lineError = await rejection(() =>
      writeMuseDelivery({
        rows: [...ROWS, lineCopy],
        approvals: listOf([...approvalList().entries, { rowId: lineCopy.id, version: 1, ...linePrints }]),
        museRoot,
        deliveryRoot: lineTarget,
      }),
    );
    expect(lineError.message).toMatch(/duplicate|same|twice|collid/i);
    expect(await walk(lineTarget)).toEqual([]);
  });

  it('T167 refuses a degenerate line-art name before any write', async () => {
    const cases: Array<{ id: string; lineArtFileName: string }> = [
      { id: 'l2-w01-story-page-a-dot', lineArtFileName: '.' },
      { id: 'l2-w01-story-page-a-dotdot', lineArtFileName: '..' },
      { id: 'l2-w01-story-page-a-manifest', lineArtFileName: 'manifest.json' },
      // The line-art name equals the color name of the same row.
      { id: 'l2-w01-story-page-a-twin', lineArtFileName: 'l2-w01-story-page-a-twin-v1.png' },
    ];
    for (const [index, item] of cases.entries()) {
      const row = extraRow(item.id, { lineArtFileName: item.lineArtFileName });
      const prints = await addMusePrints(row, 1, `degenerate${index}`);
      const target = path.join(root, `delivery-degenerate-${index}`);
      const error = await rejection(() =>
        writeMuseDelivery({
          rows: [row],
          approvals: listOf([{ rowId: row.id, version: 1, ...prints }]),
          museRoot,
          deliveryRoot: target,
        }),
      );
      expect(error.message).toMatch(/name|manifest|plain|line|reserved|refus/i);
      expect(await walk(target)).toEqual([]);
      expect(existsSync(path.join(target, 'manifest.json'))).toBe(false);
    }

    // A list file name cannot pass the list pattern, so the writer refuses it before any read.
    const listNameRow = extraRow('l2-w01-story-page-a-list-name', { fileName: 'manifest.json' });
    const listPrints = await addMusePrints(listNameRow, 1, 'listname');
    const listTarget = path.join(root, 'delivery-degenerate-list');
    const listError = await rejection(() =>
      writeMuseDelivery({
        rows: [listNameRow],
        approvals: listOf([{ rowId: listNameRow.id, version: 1, ...listPrints }]),
        museRoot,
        deliveryRoot: listTarget,
      }),
    );
    expect(listError.message).toMatch(/file name|pattern|invalid|manifest/i);
    expect(await walk(listTarget)).toEqual([]);
  });

  it('T168 refuses a Muse print that is a symlink, leaves museRoot, or is not a regular file', async () => {
    const size = PICTURE_SIZES.story;
    const outsideFolder = path.join(root, 'muse-outside');
    await mkdir(outsideFolder, { recursive: true });
    const outsideColor = path.join(outsideFolder, 'color-print.png');
    await writeFile(outsideColor, await colorPng(size.width, size.height, BACKGROUNDS[1]!));
    const realNames = museNames(NUT, 1);

    const outsideLink = 'l2-w01-story-page-a-nut-m1-outside-color-print.png';
    await symlink(outsideColor, path.join(museRoot, outsideLink));
    const insideLink = 'l2-w01-story-page-a-nut-m1-inside-color-print.png';
    await symlink(path.join(museRoot, realNames.colorPrint), path.join(museRoot, insideLink));
    const folderName = 'l2-w01-story-page-a-nut-m1-folder-color-print.png';
    await mkdir(path.join(museRoot, folderName));

    const cases = [outsideLink, insideLink, folderName];
    for (const [index, colorPrint] of cases.entries()) {
      const target = path.join(root, `delivery-muse-print-${index}`);
      const error = await rejection(() =>
        writeMuseDelivery({
          rows: [rowFor(NUT)],
          approvals: listOf([{ rowId: NUT, version: 1, colorPrint, linePrint: realNames.linePrint }]),
          museRoot,
          deliveryRoot: target,
        }),
      );
      expect(error.message).toMatch(/regular file|symlink|link|outside|refus/i);
      expect(await walk(target)).toEqual([]);
    }
  });

  it('T169 refuses a malformed approval list', async () => {
    const entries = approvalList().entries;
    const cases: Array<{ approvals: unknown; match: RegExp }> = [
      { approvals: { version: 2, entries }, match: /version|approval list|invalid/i },
      {
        approvals: {
          version: 1,
          entries: [
            ...entries,
            {
              rowId: 'l2-w01-story-page-a-ghost',
              version: 1,
              colorPrint: 'ghost-color-print.png',
              linePrint: 'ghost-line-print.png',
            },
          ],
        },
        match: /not a row|unknown|picture list/i,
      },
      {
        approvals: { version: 1, entries: [{ ...entries[0]!, colorPrint: '../x.png' }] },
        match: /plain file name|invalid/i,
      },
    ];
    for (const [index, item] of cases.entries()) {
      const target = path.join(root, `delivery-malformed-${index}`);
      const error = await rejection(() =>
        writeMuseDelivery({
          rows: ROWS,
          approvals: item.approvals as DeliveryApprovals,
          museRoot,
          deliveryRoot: target,
        }),
      );
      expect(error.message).toMatch(item.match);
      expect(await walk(target)).toEqual([]);
    }
  });

  it('T170 writes no manifest.json when a copy fails at write time', async () => {
    // The long name passes the plain-name rule but the file system refuses it, so the copy fails
    // at write time. A writer that writes manifest.json first leaves it behind.
    const longName = `${'x'.repeat(300)}.png`;
    const row = extraRow('l2-w01-story-page-a-long-name', { lineArtFileName: longName });
    const prints = await addMusePrints(row, 1, 'longname');
    const error = await rejection(() =>
      writeMuseDelivery({
        rows: [row],
        approvals: listOf([{ rowId: row.id, version: 1, ...prints }]),
        museRoot,
        deliveryRoot,
      }),
    );
    expect(error.message).toMatch(/name|long|ENAMETOOLONG/i);
    expect(existsSync(path.join(deliveryRoot, 'manifest.json'))).toBe(false);
  });

  it('T171 refuses a color print that is a palette, one-channel, 16-bit, or four-channel PNG', async () => {
    const size = PICTURE_SIZES.story;
    const names = museNames(NUT, 1);
    const cases: Array<{ label: string; png: Buffer; match: RegExp }> = [
      { label: 'palette', png: await palettePng(size.width, size.height), match: /palette|channel|format|srgb|8-bit/i },
      { label: 'one channel', png: await oneChannelPng(size.width, size.height), match: /channel|format|srgb|8-bit/i },
      { label: '16-bit', png: await deep16Png(size.width, size.height), match: /16-bit|depth|bits|8-bit|format/i },
      { label: 'alpha', png: await alphaPng(size.width, size.height), match: /alpha|channel/i },
    ];
    for (const [index, item] of cases.entries()) {
      await writeFile(path.join(museRoot, names.colorPrint), item.png);
      const target = path.join(root, `delivery-format-${index}`);
      const error = await rejection(() =>
        writeMuseDelivery({
          rows: [rowFor(NUT)],
          approvals: listOf([{ rowId: NUT, version: 1, ...names }]),
          museRoot,
          deliveryRoot: target,
        }),
      );
      expect(error.message).toContain(NUT);
      expect(error.message).toMatch(item.match);
      expect(await walk(target)).toEqual([]);
    }
  });

  it('T172 reports a row that has no approval entry', async () => {
    const skipped: Array<{ rowId: string; reason: string }> = [];
    const manifest = await deliverWith({
      onSkip: (rowId: string, reason: string) => skipped.push({ rowId, reason }),
    });
    expect(manifest.jobs.map((job) => job.id).sort()).toEqual([...CLEAN_ROWS].sort());
    expect(skipped.map((item) => item.rowId)).toEqual([MOP]);
    expect(skipped[0]?.reason).toMatch(/approval|entry|clean/i);
  });
});

// ---------------------------------------------------------------------------
// Phase 4: delivery of a week other than week 1 (strategy section 7, 4.4)
//
// The contract that Green must implement for these rows: `deliver` takes `--week <n>` and
// filters the picture list to that week before the writer runs. The writer already takes the
// job directory from `row.week`, so the batches are `w0N/color` and `w0N/lineart`.
// ---------------------------------------------------------------------------
function weekSuffix(index: number): string {
  return String.fromCharCode(97 + Math.floor(index / 26)) + String.fromCharCode(97 + (index % 26));
}

function weekRows(week: number): PictureListRow[] {
  const rows: PictureListRow[] = [];
  for (let index = 0; index < 27; index += 1) {
    const suffix = weekSuffix(index);
    const sizeClass: PictureListRow['sizeClass'] = index < 16 ? 'A' : index < 18 ? 'B' : 'C';
    const use = sizeClass === 'A' ? 'story-page' : sizeClass === 'B' ? 'cover' : 'check-row';
    const size = sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
    const id = `l2-w0${week}-${use}-${suffix}`;
    rows.push({
      id,
      week,
      use,
      sizeClass,
      fileName: `${id}-v1.png`,
      lineArtFileName: `${id}-line-v1.png`,
      width: size.width,
      height: size.height,
      text: `Text ${suffix}.`,
      prompt: `Prompt ${suffix}.`,
    });
  }
  return rows;
}

async function putWeekPrints(folder: string, rows: PictureListRow[]): Promise<void> {
  await mkdir(folder, { recursive: true });
  for (const [index, row] of rows.entries()) {
    const size = row.sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
    const names = museNames(row.id, 1);
    await writeFile(path.join(folder, names.colorPrint), await colorPng(size.width, size.height, BACKGROUNDS[index % 3]!));
    await writeFile(path.join(folder, names.linePrint), await linePng(size.width, size.height, 40));
  }
}

function weekApprovals(rows: PictureListRow[]) {
  return {
    version: 1 as const,
    entries: rows.map((row) => ({ rowId: row.id, version: 1, ...museNames(row.id, 1) })),
  };
}

describe('Muse delivery of another week', () => {
  it('T181 delivers 27 week 2 rows in two week 2 batches with the list names', async () => {
    const rows = weekRows(2);
    const week2Root = path.join(root, 'w02');
    const week2Muse = path.join(week2Root, 'muse');
    const week2Delivery = path.join(week2Root, 'delivery');
    await putWeekPrints(week2Muse, rows);

    const manifest = await writeMuseDelivery({
      rows,
      approvals: weekApprovals(rows),
      museRoot: week2Muse,
      deliveryRoot: week2Delivery,
    });

    expect.soft({ 'Week 2 manifest jobs': manifest.jobs.length })
      .toEqual({ 'Week 2 manifest jobs': 27 });
    expect.soft({ 'Week 2 batch ids': manifest.batches.map((batch) => batch.id).sort() })
      .toEqual({ 'Week 2 batch ids': ['w02/color', 'w02/lineart'] });
    expect.soft({ 'Week 2 job directories': [...new Set(manifest.jobs.map((job) => job.directory))] })
      .toEqual({ 'Week 2 job directories': ['w02'] });

    const wrongNames: string[] = [];
    const wrongSizes: string[] = [];
    for (const row of rows) {
      const job = manifest.jobs.find((item) => item.id === row.id);
      if (!job) {
        wrongNames.push(`${row.id}: no job`);
        continue;
      }
      const candidate = job.candidates[0]!;
      if (candidate.file !== row.fileName) wrongNames.push(`${row.id}: ${candidate.file}`);
      const size = row.sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
      if (candidate.structural.width !== size.width || candidate.structural.height !== size.height) {
        wrongSizes.push(`${row.id}: ${candidate.structural.width} x ${candidate.structural.height}`);
      }
    }
    expect.soft({ 'Week 2 rows with a file name that is not the list name': wrongNames })
      .toEqual({ 'Week 2 rows with a file name that is not the list name': [] });
    expect.soft({ 'Week 2 rows with a wrong class size': wrongSizes })
      .toEqual({ 'Week 2 rows with a wrong class size': [] });
    expect.soft({ 'Week 2 delivered files': (await walk(week2Delivery)).length })
      .toEqual({ 'Week 2 delivered files': 55 });

    const before = new Map<string, string>();
    for (const file of await walk(week2Delivery)) before.set(file, sha256(await readFile(file)));
    const second = await writeMuseDelivery({
      rows,
      approvals: weekApprovals(rows),
      museRoot: week2Muse,
      deliveryRoot: week2Delivery,
    });
    const after = new Map<string, string>();
    for (const file of await walk(week2Delivery)) after.set(file, sha256(await readFile(file)));
    expect.soft({ 'A second week 2 run gives the same files': [...after.keys()].sort() })
      .toEqual({ 'A second week 2 run gives the same files': [...before.keys()].sort() });
    expect.soft({ 'A second week 2 run gives the same bytes': [...after].sort() })
      .toEqual({ 'A second week 2 run gives the same bytes': [...before].sort() });
    expect.soft({ 'A second week 2 run gives the same jobs': second.jobs.map((job) => job.id).sort() })
      .toEqual({ 'A second week 2 run gives the same jobs': manifest.jobs.map((job) => job.id).sort() });
  }, 240000);

  it('T182 deliver --week 2 refuses a week 3 entry and skips only week 2 rows', async () => {
    const rows = [...weekRows(2), ...weekRows(3).slice(0, 1)];
    const week3Row = rows[rows.length - 1]!;
    const repo = path.join(root, 'cli-week');
    const museFolder = path.join(repo, 'out/muse');
    await putWeekPrints(museFolder, rows);
    const listFile = path.join(repo, 'pictures.json');
    await writeFile(listFile, JSON.stringify(rows, null, 2));

    const refusedDelivery = path.join(repo, 'out/refused');
    const withWeek3 = path.join(repo, 'approved-with-week3.json');
    await writeFile(
      withWeek3,
      JSON.stringify({
        version: 1,
        entries: rows.map((row) => ({ rowId: row.id, version: 1, ...museNames(row.id, 1) })),
      }, null, 2),
    );
    let refusal: Error | undefined;
    try {
      await runStorytimeCli(
        ['deliver', '--week', '2', '--list', listFile, '--approvals', withWeek3,
          '--muse', 'out/muse', '--delivery', 'out/refused'],
        { repoRoot: repo, workbooksRoot: repo, log: () => {} },
      );
    } catch (error) {
      refusal = error instanceof Error ? error : new Error(String(error));
    }
    expect.soft(refusal?.message ?? 'delivered', 'A week 3 entry in a week 2 run is refused')
      .toMatch(/week 3|l2-w03-/);
    expect.soft({ 'A refused week 2 run writes no file': await walk(refusedDelivery) })
      .toEqual({ 'A refused week 2 run writes no file': [] });

    // One week 2 row has no approval entry, so the run logs exactly one `Skipped` line.
    const unapproved = weekRows(2)[26]!;
    const week2Only = path.join(repo, 'approved-week2.json');
    await writeFile(
      week2Only,
      JSON.stringify({
        version: 1,
        entries: weekApprovals(weekRows(2)).entries.filter((entry) => entry.rowId !== unapproved.id),
      }, null, 2),
    );
    const lines: string[] = [];
    const code = await runStorytimeCli(
      ['deliver', '--week', '2', '--list', listFile, '--approvals', week2Only,
        '--muse', 'out/muse', '--delivery', 'out/delivery'],
      { repoRoot: repo, workbooksRoot: repo, log: (line) => lines.push(line) },
    );
    expect.soft({ 'The week 2 delivery exits with code 0': code })
      .toEqual({ 'The week 2 delivery exits with code 0': 0 });
    const skipped = lines.filter((line) => line.startsWith('Skipped ')).map((line) => line.split(' ')[1]);
    expect.soft({ 'Week 2 skipped rows': skipped }).toEqual({ 'Week 2 skipped rows': [unapproved.id] });
    expect.soft({ 'Week 3 rows in the skipped lines': skipped.filter((id) => id === week3Row.id) })
      .toEqual({ 'Week 3 rows in the skipped lines': [] });
    const manifest = JSON.parse(
      await readFile(path.join(repo, 'out/delivery/manifest.json'), 'utf8'),
    ) as StorytimeManifest;
    expect.soft({ 'Week 2 CLI delivery jobs': manifest.jobs.length })
      .toEqual({ 'Week 2 CLI delivery jobs': 26 });
    expect.soft({ 'Week 2 CLI batch ids': manifest.batches.map((batch) => batch.id).sort() })
      .toEqual({ 'Week 2 CLI batch ids': ['w02/color', 'w02/lineart'] });
  }, 240000);
});

// ---------------------------------------------------------------------------
// Week 1 version 2 delivery (PM order 02:1x ICT 2026-11-02)
//
// The Workbooks two-model check refused four week 1 rows. Forge redoes them as new versions and
// sends new file names. The approval entry may carry an optional integer `fileVersion` (>= 1).
// With `fileVersion: 2`, the delivered names are `<row id>-v2.png` and `<row id>-line-v2.png`
// (the list names with `-v1` replaced by `-v2`), and the candidate version is 2. A run with no
// field keeps the v1 names and bytes. A row has one candidate, so the v2 candidate replaces the
// v1 candidate in its job. A different manifest.json in the delivery folder still stops the run.
// ---------------------------------------------------------------------------

/** The list name with its `-v<n>` suffix replaced by the delivered version. */
function versionedName(name: string, version: number): string {
  return name.replace(/-v\d+\.png$/, `-v${version}.png`);
}

/** The SHA-256 of a delivered file, or `missing` when the run wrote no such file. */
async function shaOrMissing(file: string): Promise<string> {
  return existsSync(file) ? sha256(await readFile(file)) : 'missing';
}

interface ApprovalItem {
  rowId: string;
  museVersion?: number;
  lineTry?: number;
  fileVersion?: number;
}

function fileVersionApproval(items: ApprovalItem[]): DeliveryApprovals {
  // `fileVersion` is the field that Green must add to the approval schema. The cast keeps the
  // test file type-correct at HEAD, where the field does not exist yet.
  return {
    version: 1,
    entries: items.map((item) => ({
      rowId: item.rowId,
      version: item.museVersion ?? 1,
      ...(item.fileVersion === undefined ? {} : { fileVersion: item.fileVersion }),
      ...museNames(item.rowId, item.museVersion ?? 1, item.lineTry ?? 1),
    })),
  } as unknown as DeliveryApprovals;
}

describe('Muse delivery file versions', () => {
  it('T184 delivers the v2 names and candidate version when the entry sets fileVersion 2', async () => {
    const row = rowFor(NUT);
    const names = museNames(NUT, 1);
    const sourceColor = sha256(await readFile(path.join(museRoot, names.colorPrint)));
    const sourceLine = sha256(await readFile(path.join(museRoot, names.linePrint)));
    const v2Color = versionedName(row.fileName, 2);
    const v2Line = versionedName(row.lineArtFileName, 2);

    const target = path.join(root, 'delivery-version-2');
    const manifest = await writeMuseDelivery({
      rows: [row],
      approvals: fileVersionApproval([{ rowId: NUT, fileVersion: 2 }]),
      museRoot,
      deliveryRoot: target,
    });
    const candidate = candidateOf(jobFor(manifest, NUT));
    expect.soft({ 'The fileVersion 2 candidate version': candidate.version })
      .toEqual({ 'The fileVersion 2 candidate version': 2 });
    expect.soft({ 'The fileVersion 2 color file name': path.basename(candidate.file) })
      .toEqual({ 'The fileVersion 2 color file name': v2Color });
    expect.soft({ 'The fileVersion 2 line file name': path.basename(candidate.lineArt?.file ?? '') })
      .toEqual({ 'The fileVersion 2 line file name': v2Line });
    expect.soft({ 'The fileVersion 2 color file exists': existsSync(path.join(target, v2Color)) })
      .toEqual({ 'The fileVersion 2 color file exists': true });
    expect.soft({ 'The fileVersion 2 line file exists': existsSync(path.join(target, v2Line)) })
      .toEqual({ 'The fileVersion 2 line file exists': true });
    expect.soft({ 'The fileVersion 2 color bytes are the approved print bytes': await shaOrMissing(path.join(target, v2Color)) })
      .toEqual({ 'The fileVersion 2 color bytes are the approved print bytes': sourceColor });
    expect.soft({ 'The fileVersion 2 line bytes are the approved print bytes': await shaOrMissing(path.join(target, v2Line)) })
      .toEqual({ 'The fileVersion 2 line bytes are the approved print bytes': sourceLine });

    // A run with no field keeps the list names and bytes.
    const v1Target = path.join(root, 'delivery-version-none');
    const v1Manifest = await writeMuseDelivery({
      rows: [row],
      approvals: fileVersionApproval([{ rowId: NUT }]),
      museRoot,
      deliveryRoot: v1Target,
    });
    const v1Candidate = candidateOf(jobFor(v1Manifest, NUT));
    expect.soft({ 'A run with no fileVersion keeps the v1 candidate version': v1Candidate.version })
      .toEqual({ 'A run with no fileVersion keeps the v1 candidate version': 1 });
    expect.soft({ 'A run with no fileVersion keeps the list color name': path.basename(v1Candidate.file) })
      .toEqual({ 'A run with no fileVersion keeps the list color name': row.fileName });
    expect.soft({ 'A run with no fileVersion keeps the list line name': path.basename(v1Candidate.lineArt?.file ?? '') })
      .toEqual({ 'A run with no fileVersion keeps the list line name': row.lineArtFileName });
    expect.soft({ 'A run with no fileVersion keeps the color bytes': await shaOrMissing(path.join(v1Target, row.fileName)) })
      .toEqual({ 'A run with no fileVersion keeps the color bytes': sourceColor });
    expect.soft({ 'A run with no fileVersion keeps the line bytes': await shaOrMissing(path.join(v1Target, row.lineArtFileName)) })
      .toEqual({ 'A run with no fileVersion keeps the line bytes': sourceLine });

    // An explicit fileVersion 1 is the same as no field.
    const oneTarget = path.join(root, 'delivery-version-1');
    const oneManifest = await writeMuseDelivery({
      rows: [row],
      approvals: fileVersionApproval([{ rowId: NUT, fileVersion: 1 }]),
      museRoot,
      deliveryRoot: oneTarget,
    });
    const oneCandidate = candidateOf(jobFor(oneManifest, NUT));
    expect.soft({ 'The fileVersion 1 candidate version': oneCandidate.version })
      .toEqual({ 'The fileVersion 1 candidate version': 1 });
    expect.soft({ 'The fileVersion 1 color file name': path.basename(oneCandidate.file) })
      .toEqual({ 'The fileVersion 1 color file name': row.fileName });
  });

  it('T185 gives one candidate per job and writes no v1 file for a v2 row', async () => {
    const row = rowFor(NUT);
    const v2Color = versionedName(row.fileName, 2);
    const v2Line = versionedName(row.lineArtFileName, 2);
    const target = path.join(root, 'delivery-version-one-candidate');
    const manifest = await writeMuseDelivery({
      rows: [row],
      approvals: fileVersionApproval([{ rowId: NUT, fileVersion: 2 }]),
      museRoot,
      deliveryRoot: target,
    });
    const job = jobFor(manifest, NUT);
    expect.soft({ 'The v2 job holds one candidate': job.candidates.length })
      .toEqual({ 'The v2 job holds one candidate': 1 });
    expect.soft({ 'The v2 job candidate versions': job.candidates.map((candidate) => candidate.version) })
      .toEqual({ 'The v2 job candidate versions': [2] });
    expect.soft({ 'The v2 job selects version 2': job.selectedVersion })
      .toEqual({ 'The v2 job selects version 2': 2 });
    const files = (await walk(target)).map((file) => path.basename(file)).sort();
    expect.soft({ 'The v2 folder file names': files })
      .toEqual({ 'The v2 folder file names': [v2Color, v2Line, 'manifest.json'].sort() });
    expect.soft({ 'The v2 folder holds no v1 file for the row': files.filter((name) => name === row.fileName || name === row.lineArtFileName) })
      .toEqual({ 'The v2 folder holds no v1 file for the row': [] });
    const colorBatch = manifest.batches.find((batch) => batch.outputKind === 'color');
    expect.soft({ 'The color batch names the v2 file': colorBatch?.files.map((file) => path.basename(file.file)) })
      .toEqual({ 'The color batch names the v2 file': [v2Color] });
    const lineBatch = manifest.batches.find((batch) => batch.outputKind === 'lineart');
    expect.soft({ 'The line batch names the v2 file': lineBatch?.files.map((file) => path.basename(file.file)) })
      .toEqual({ 'The line batch names the v2 file': [v2Line] });
  });

  it('T186 accepts the v1 color bytes under the v2 name for a line-only row', async () => {
    const row = rowFor(NUT);
    const names = museNames(NUT, 1);
    const v1Target = path.join(root, 'delivery-line-only-v1');
    await writeMuseDelivery({
      rows: [row],
      approvals: fileVersionApproval([{ rowId: NUT }]),
      museRoot,
      deliveryRoot: v1Target,
    });
    const v1ColorSha = sha256(await readFile(path.join(v1Target, row.fileName)));
    const v1LineSha = sha256(await readFile(path.join(v1Target, row.lineArtFileName)));

    // The line art changes; the color print keeps the v1 bytes.
    const v2LineSource = `${NUT}-m1-line-print-2.png`;
    await writeFile(path.join(museRoot, v2LineSource), await linePng(4000, 3000, 120));
    const v2Target = path.join(root, 'delivery-line-only-v2');
    const v2Manifest = await writeMuseDelivery({
      rows: [row],
      approvals: {
        version: 1,
        entries: [{
          rowId: NUT,
          version: 1,
          fileVersion: 2,
          colorPrint: names.colorPrint,
          linePrint: v2LineSource,
        }],
      } as unknown as DeliveryApprovals,
      museRoot,
      deliveryRoot: v2Target,
    });
    const v2Candidate = candidateOf(jobFor(v2Manifest, NUT));
    const v2Color = versionedName(row.fileName, 2);
    const v2Line = versionedName(row.lineArtFileName, 2);
    expect.soft({ 'The v2 color file holds the v1 color bytes': await shaOrMissing(path.join(v2Target, v2Color)) })
      .toEqual({ 'The v2 color file holds the v1 color bytes': v1ColorSha });
    expect.soft({ 'The v2 candidate color hash equals the v1 hash': v2Candidate.fileSha256 })
      .toEqual({ 'The v2 candidate color hash equals the v1 hash': v1ColorSha });
    const v2LineSha = await shaOrMissing(path.join(v2Target, v2Line));
    expect.soft({ 'The v2 line bytes differ from the v1 line bytes': v2LineSha === v1LineSha })
      .toEqual({ 'The v2 line bytes differ from the v1 line bytes': false });
  });

  it('T187 repeats the same manifest bytes for a mixed v1 and v2 run', async () => {
    const nut = rowFor(NUT);
    const hen = rowFor(HEN);
    const cat = rowFor(CAT);
    const rows = [nut, hen, cat];
    const approvals = fileVersionApproval([
      { rowId: NUT },
      { rowId: HEN, museVersion: 2, fileVersion: 2 },
      { rowId: CAT, lineTry: 2 },
    ]);
    const target = path.join(root, 'delivery-mixed-versions');
    const first = await writeMuseDelivery({ rows, approvals, museRoot, deliveryRoot: target });
    const firstBytes = await readFile(path.join(target, 'manifest.json'), 'utf8');
    const firstFiles = (await walk(target))
      .map(async (file) => `${path.relative(target, file)}:${sha256(await readFile(file))}`);
    const firstMap = (await Promise.all(firstFiles)).sort();

    const second = await writeMuseDelivery({ rows, approvals, museRoot, deliveryRoot: target });
    const secondBytes = await readFile(path.join(target, 'manifest.json'), 'utf8');
    const secondMap = (await Promise.all((await walk(target))
      .map(async (file) => `${path.relative(target, file)}:${sha256(await readFile(file))}`))).sort();

    expect.soft({ 'The mixed run manifest bytes repeat': secondBytes })
      .toEqual({ 'The mixed run manifest bytes repeat': firstBytes });
    expect.soft({ 'The mixed run file bytes repeat': secondMap })
      .toEqual({ 'The mixed run file bytes repeat': firstMap });
    expect.soft({ 'The mixed run delivers the v1 row under the v1 name': existsSync(path.join(target, nut.fileName)) })
      .toEqual({ 'The mixed run delivers the v1 row under the v1 name': true });
    expect.soft({ 'The mixed run delivers the v2 row under the v2 name': existsSync(path.join(target, versionedName(hen.fileName, 2))) })
      .toEqual({ 'The mixed run delivers the v2 row under the v2 name': true });
    expect.soft({ 'The mixed run holds no v1 file for the v2 row': existsSync(path.join(target, hen.fileName)) })
      .toEqual({ 'The mixed run holds no v1 file for the v2 row': false });
    expect.soft({ 'The mixed manifest holds the v2 candidate version': candidateOf(jobFor(first, HEN)).version })
      .toEqual({ 'The mixed manifest holds the v2 candidate version': 2 });
    expect.soft({ 'The mixed manifest holds the v1 candidate version': candidateOf(jobFor(second, NUT)).version })
      .toEqual({ 'The mixed manifest holds the v1 candidate version': 1 });
  });

  it('T188 refuses fileVersion 0, a negative, a non-integer, and a string with exit 1', async () => {
    const row = rowFor(NUT);
    const badValues: Array<{ label: string; value: unknown }> = [
      { label: '0', value: 0 },
      { label: 'a negative (-1)', value: -1 },
      { label: 'a non-integer (2.5)', value: 2.5 },
      { label: 'a string ("2")', value: '2' },
    ];
    for (const [index, item] of badValues.entries()) {
      const repo = path.join(root, `cli-file-version-${index}`);
      await putWeekPrints(path.join(repo, 'out/muse'), [row]);
      const listFile = path.join(repo, 'pictures.json');
      await writeFile(listFile, JSON.stringify([row], null, 2));
      const approvalsFile = path.join(repo, 'approved.json');
      await writeFile(approvalsFile, JSON.stringify({
        version: 1,
        entries: [{ rowId: NUT, version: 1, fileVersion: item.value, ...museNames(NUT, 1) }],
      }, null, 2));
      const logs: string[] = [];
      const code = await runStorytimeBookPicturesEntry(
        ['deliver', '--list', listFile, '--approvals', approvalsFile, '--muse', 'out/muse', '--delivery', 'out/delivery'],
        {
          pipeline: (argv) => runStorytimeCli(argv, { repoRoot: repo, workbooksRoot: repo, log: () => {} }),
          errorLog: (message: string) => logs.push(message),
        },
      );
      const deliveryDir = path.join(repo, 'out/delivery');
      const codeKey = `The ${item.label} fileVersion exit code`;
      const filesKey = `The ${item.label} fileVersion writes no file`;
      const fieldKey = `The ${item.label} fileVersion refusal names the field`;
      expect.soft({ [codeKey]: code }).toEqual({ [codeKey]: 1 });
      expect.soft({ [filesKey]: await walk(deliveryDir) }).toEqual({ [filesKey]: [] });
      expect.soft({ [fieldKey]: /fileVersion/i.test(logs.join('\n')) })
        .toEqual({ [fieldKey]: true });
    }
  });

  it('T189 refuses a v2 run into a folder that holds a different manifest.json', async () => {
    const row = rowFor(NUT);
    const target = path.join(root, 'delivery-different-manifest-version');
    await writeMuseDelivery({
      rows: [row],
      approvals: fileVersionApproval([{ rowId: NUT }]),
      museRoot,
      deliveryRoot: target,
    });
    const manifestBytes = await readFile(path.join(target, 'manifest.json'), 'utf8');
    let refusal: Error | undefined;
    try {
      await writeMuseDelivery({
        rows: [row],
        approvals: fileVersionApproval([{ rowId: NUT, fileVersion: 2 }]),
        museRoot,
        deliveryRoot: target,
      });
    } catch (error) {
      refusal = error instanceof Error ? error : new Error(String(error));
    }
    expect.soft(refusal?.message ?? 'delivered', 'A v2 run into a folder with a different manifest.json is refused')
      .toMatch(/manifest|overwrite|differ|exist/i);
    expect.soft({ 'The refused v2 run keeps the manifest bytes': await readFile(path.join(target, 'manifest.json'), 'utf8') })
      .toEqual({ 'The refused v2 run keeps the manifest bytes': manifestBytes });
    expect.soft({ 'The refused v2 run writes no v2 color file': existsSync(path.join(target, versionedName(row.fileName, 2))) })
      .toEqual({ 'The refused v2 run writes no v2 color file': false });
    expect.soft({ 'The refused v2 run writes no v2 line file': existsSync(path.join(target, versionedName(row.lineArtFileName, 2))) })
      .toEqual({ 'The refused v2 run writes no v2 line file': false });
  });
});

// ---------------------------------------------------------------------------
// Level 2 cover delivery (Phase 4 Task 3, gate C4 of strategy section 4.6)
//
// The cover is one color picture. It is not a row of the picture list, so `writeMuseDelivery`
// cannot deliver it: that writer needs a `linePrint` and a list row. PM confirmation of
// 2026-11-02 06:18 ICT: the file name is `l2-cover-v1.png`, class B (4000 x 3000), color only.
//
// The API that Green must add in src/storytime/muse-delivery.ts:
//
//   export async function deliverMuseCover(options: {
//     approvals: MuseCoverApprovalList | string;   // the list, or the path of its JSON file
//     museRoot: string;                            // the folder of the Muse cover prints
//     deliveryRoot: string;                        // the delivery batch root
//   }): Promise<StorytimeManifest>;
//
//   MuseCoverApprovalList = { version: 1; entries: [MuseCoverApprovalEntry] }   // exactly one entry
//   MuseCoverApprovalEntry = the week entry without `linePrint` (a `linePrint` key is refused):
//     { rowId: 'l2-cover-v1'; version: number; fileVersion?: number; colorPrint: string;
//       reviews?: { kimi?: {...}; person?: {...} }; notes?: string[] }
//
// The manifest has the StorytimeManifest shape with one job: id `l2-cover-v1`, size `cover`, use
// `cover`, directory `cover`, week 1. The candidate has no `lineArt`. The file is
// `l2-cover-v<fileVersion>.png` (`l2-cover-v1.png` without the field). The manifest has one batch
// (`cover/color`) and no line-art batch. The print checks are the color print checks of the week
// writer, with the size PICTURE_SIZES.cover. Every check runs before the first write.
//
// The CLI command next to `deliver`:
//
//   deliver-cover --approvals <file> --muse <folder> --delivery <folder>
//
// It resolves the two folders with `resolveMuseDeliveryPaths`, so both stay inside the repository
// out folder. The approval file of the real cover is docs/storytime/l2-unit1/cover/muse/approved.json.
// ---------------------------------------------------------------------------

const COVER_ID = 'l2-cover-v1';
const COVER_FILE = 'l2-cover-v1.png';
const COVER_PRINT = 'l2-cover-v1-m13-color-print.png';
const COVER_BACKGROUND = '#f3e6c8';

type CoverDeliver = (options: {
  approvals: unknown;
  museRoot: string;
  deliveryRoot: string;
}) => Promise<StorytimeManifest>;

/** The cover writer. It is absent at HEAD, so the caller fails on a clear seam check. */
async function coverSeam(): Promise<CoverDeliver> {
  const module = (await import('../src/storytime/muse-delivery.js')) as unknown as {
    deliverMuseCover?: CoverDeliver;
  };
  expect(typeof module.deliverMuseCover, 'The deliverMuseCover seam exists.').toBe('function');
  return module.deliverMuseCover!;
}

/** The approval list of the cover: one entry, no line print, a model review only in the notes. */
function coverApprovals(overrides: Record<string, unknown> = {}) {
  return {
    version: 1 as const,
    entries: [
      {
        rowId: COVER_ID,
        version: 13,
        fileVersion: 1,
        colorPrint: COVER_PRINT,
        notes: [
          'Independent review C2 (model evidence, not a person review): reviewer claude-opus-5-5, verdict clean, controls correct.',
          'Orchestrator spot check C3 at full size: clean.',
        ],
        ...overrides,
      },
    ],
  };
}

/** A JPEG of the class B size. Only the PNG rule can refuse it. */
async function jpegPrint(width: number, height: number): Promise<Buffer> {
  const key = `jpeg:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const jpeg = await sharp({ create: { width, height, channels: 3, background: COVER_BACKGROUND } }).jpeg().toBuffer();
  pngCache.set(key, jpeg);
  return jpeg;
}

describe('Muse delivery of the Level 2 cover (color only)', () => {
  let coverMuse: string;
  let coverDelivery: string;

  beforeEach(async () => {
    coverMuse = path.join(root, 'cover-muse');
    coverDelivery = path.join(root, 'cover-delivery');
    await mkdir(coverMuse, { recursive: true });
    const size = PICTURE_SIZES.cover;
    await writeFile(path.join(coverMuse, COVER_PRINT), await colorPng(size.width, size.height, COVER_BACKGROUND));
  });

  it('T190 writes one manifest.json with one color-only cover job', async () => {
    const deliverCover = await coverSeam();
    const manifest = await deliverCover({ approvals: coverApprovals(), museRoot: coverMuse, deliveryRoot: coverDelivery });
    const written = JSON.parse(await readFile(path.join(coverDelivery, 'manifest.json'), 'utf8')) as StorytimeManifest;
    expect(written).toEqual(manifest);
    expect(written.version).toBe(1);
    expect(written.batchHashAlgorithm).toBe(BATCH_HASH_ALGORITHM);
    expect({ 'Cover manifest jobs': manifest.jobs.length }).toEqual({ 'Cover manifest jobs': 1 });
    const job = jobFor(manifest, COVER_ID);
    expect({ id: job.id, size: job.size, use: job.use, directory: job.directory, week: job.week, status: job.status })
      .toEqual({ id: COVER_ID, size: 'cover', use: 'cover', directory: 'cover', week: 1, status: 'ready' });
    expect({ 'Cover candidates': job.candidates.length }).toEqual({ 'Cover candidates': 1 });
    const candidate = candidateOf(job);
    expect(candidate.lineArt).toBeUndefined();
    expect(candidate.file.endsWith(COVER_FILE)).toBe(true);
    expect(path.basename(candidate.file)).toBe(COVER_FILE);
    expect(candidate.version).toBe(1);
    expect(candidate.status).toBe('ready');
    expect(candidate.structural.valid).toBe(true);
    expect(candidate.structural.width).toBe(PICTURE_SIZES.cover.width);
    expect(candidate.structural.height).toBe(PICTURE_SIZES.cover.height);
    const colorSha = sha256(await readFile(path.join(coverMuse, COVER_PRINT)));
    expect(candidate.fileSha256).toBe(colorSha);
    expect(job.selectedSha256).toBe(colorSha);
    expect(job.selectedVersion).toBe(1);
    const files = (await walk(coverDelivery)).map((file) => path.relative(coverDelivery, file)).sort();
    expect({ 'Cover delivery files': files }).toEqual({ 'Cover delivery files': [COVER_FILE, 'manifest.json'] });
  });

  it('T191 copies the approved cover print byte for byte and keeps the Muse original', async () => {
    const deliverCover = await coverSeam();
    const source = path.join(coverMuse, COVER_PRINT);
    const before = sha256(await readFile(source));
    const manifest = await deliverCover({ approvals: coverApprovals(), museRoot: coverMuse, deliveryRoot: coverDelivery });
    const delivered = path.join(coverDelivery, COVER_FILE);
    expect({ 'Delivered cover SHA-256': await shaOrMissing(delivered) }).toEqual({ 'Delivered cover SHA-256': before });
    expect({ 'Muse original SHA-256 after delivery': await shaOrMissing(source) })
      .toEqual({ 'Muse original SHA-256 after delivery': before });
    expect(candidateOf(jobFor(manifest, COVER_ID)).fileSha256).toBe(before);
  });

  it('T192 refuses a wrong-size cover, an alpha channel, and a file that is not a PNG', async () => {
    const deliverCover = await coverSeam();
    const size = PICTURE_SIZES.cover;
    expect(size).toEqual({ width: 4000, height: 3000 });
    const cases: Array<{ label: string; bytes: Buffer; match: RegExp }> = [
      { label: 'wrong size', bytes: await colorPng(4000, 2000, COVER_BACKGROUND), match: /size|pixel|width|height|dimension/i },
      { label: 'small class size', bytes: await colorPng(1500, 1500, COVER_BACKGROUND), match: /size|pixel|width|height|dimension/i },
      { label: 'alpha', bytes: await alphaPng(size.width, size.height), match: /alpha|channel/i },
      { label: 'not a PNG', bytes: await jpegPrint(size.width, size.height), match: /png/i },
    ];
    for (const [index, item] of cases.entries()) {
      await writeFile(path.join(coverMuse, COVER_PRINT), item.bytes);
      const target = path.join(root, `cover-refused-${index}`);
      const error = await rejection(() => deliverCover({ approvals: coverApprovals(), museRoot: coverMuse, deliveryRoot: target }));
      expect.soft(error.message, `The ${item.label} refusal names the cover row`).toContain(COVER_ID);
      expect.soft(error.message, `The ${item.label} refusal names the rule`).toMatch(item.match);
      expect.soft({ [`The ${item.label} refusal writes no file`]: await walk(target) })
        .toEqual({ [`The ${item.label} refusal writes no file`]: [] });
    }
  });

  it('T193 hashes the cover in one color batch and writes no line-art batch', async () => {
    const deliverCover = await coverSeam();
    const manifest = await deliverCover({ approvals: coverApprovals(), museRoot: coverMuse, deliveryRoot: coverDelivery });
    expect({ 'Cover batch ids': manifest.batches.map((batch) => batch.id) }).toEqual({ 'Cover batch ids': ['cover/color'] });
    expect(manifest.batches.some((batch) => batch.outputKind === 'lineart')).toBe(false);
    const batch = manifest.batches[0]!;
    expect(batch.outputKind).toBe('color');
    expect({ 'Cover batch files': batch.files.length }).toEqual({ 'Cover batch files': 1 });
    expect(path.basename(batch.files[0]!.file)).toBe(COVER_FILE);
    expect(batch.files[0]!.sha256).toBe(sha256(await readFile(path.join(coverDelivery, COVER_FILE))));
    expect(batch.sha256).toBe(batchSha256(batch.files));
  });

  it('T194 refuses a different manifest.json and repeats the same bytes on a second run', async () => {
    const deliverCover = await coverSeam();
    await mkdir(coverDelivery, { recursive: true });
    const other = JSON.stringify({ version: 1, batchHashAlgorithm: 'other', jobs: [], batches: [] }, null, 2);
    await writeFile(path.join(coverDelivery, 'manifest.json'), other);
    const error = await rejection(() =>
      deliverCover({ approvals: coverApprovals(), museRoot: coverMuse, deliveryRoot: coverDelivery }),
    );
    expect(error.message).toMatch(/manifest|overwrite|differ|exist/i);
    expect(await readFile(path.join(coverDelivery, 'manifest.json'), 'utf8')).toBe(other);
    expect(existsSync(path.join(coverDelivery, COVER_FILE))).toBe(false);
    await rm(path.join(coverDelivery, 'manifest.json'));

    // The approval list comes from a file path, as in the CLI.
    const approvalsFile = path.join(root, 'cover-approved.json');
    await writeFile(approvalsFile, JSON.stringify(coverApprovals(), null, 2));
    const first = await deliverCover({ approvals: approvalsFile, museRoot: coverMuse, deliveryRoot: coverDelivery });
    const firstBytes = await readFile(path.join(coverDelivery, 'manifest.json'), 'utf8');
    const second = await deliverCover({ approvals: approvalsFile, museRoot: coverMuse, deliveryRoot: coverDelivery });
    expect(second).toEqual(first);
    expect({ 'A second cover run repeats the manifest bytes': await readFile(path.join(coverDelivery, 'manifest.json'), 'utf8') })
      .toEqual({ 'A second cover run repeats the manifest bytes': firstBytes });
  });

  it('T195 deliver-cover runs inside the repository out folder and refuses paths outside it', async () => {
    const repo = path.join(root, 'cover-cli-repo');
    const outRoot = path.join(repo, 'out');
    const museFolder = path.join(outRoot, 'cover-muse');
    const museEscape = path.join(root, 'cover-cli-outside-muse');
    const size = PICTURE_SIZES.cover;
    for (const folder of [museFolder, museEscape]) {
      await mkdir(folder, { recursive: true });
      await writeFile(path.join(folder, COVER_PRINT), await colorPng(size.width, size.height, COVER_BACKGROUND));
    }
    const approvalsFile = path.join(repo, 'approved.json');
    await writeFile(approvalsFile, JSON.stringify(coverApprovals(), null, 2));
    const run = (delivery: string, muse: string) =>
      runStorytimeCli(
        ['deliver-cover', '--approvals', approvalsFile, '--muse', muse, '--delivery', delivery],
        { repoRoot: repo, workbooksRoot: repo, log: () => {} },
      );

    const status = await run('out/cover-delivery', 'out/cover-muse');
    expect(status).toBe(0);
    const manifest = JSON.parse(await readFile(path.join(outRoot, 'cover-delivery', 'manifest.json'), 'utf8')) as StorytimeManifest;
    expect(manifest.jobs.map((job) => job.id)).toEqual([COVER_ID]);
    expect(existsSync(path.join(outRoot, 'cover-delivery', COVER_FILE))).toBe(true);

    const absolute = path.join(root, 'cover-cli-outside');
    const absoluteError = await rejection(() => run(absolute, 'out/cover-muse'));
    expect(absoluteError.message).toMatch(/out|outside|contain/i);
    expect(existsSync(absolute)).toBe(false);

    const relativeError = await rejection(() => run('../cover-cli-escape', 'out/cover-muse'));
    expect(relativeError.message).toMatch(/out|outside|contain/i);
    expect(existsSync(path.join(root, 'cover-cli-escape'))).toBe(false);

    const museError = await rejection(() => run('out/cover-delivery-muse-escape', museEscape));
    expect(museError.message).toMatch(/out|outside|contain/i);
    expect(existsSync(path.join(outRoot, 'cover-delivery-muse-escape'))).toBe(false);
  });

  it('T196 refuses a cover print that is a symlink, leaves the Muse folder, or is not a regular file', async () => {
    const deliverCover = await coverSeam();
    const size = PICTURE_SIZES.cover;
    const outsideFolder = path.join(root, 'cover-muse-outside');
    await mkdir(outsideFolder, { recursive: true });
    const outsideColor = path.join(outsideFolder, 'color-print.png');
    await writeFile(outsideColor, await colorPng(size.width, size.height, COVER_BACKGROUND));

    const outsideLink = 'l2-cover-v1-m13-outside-color-print.png';
    await symlink(outsideColor, path.join(coverMuse, outsideLink));
    const insideLink = 'l2-cover-v1-m13-inside-color-print.png';
    await symlink(path.join(coverMuse, COVER_PRINT), path.join(coverMuse, insideLink));
    const folderName = 'l2-cover-v1-m13-folder-color-print.png';
    await mkdir(path.join(coverMuse, folderName));

    for (const [index, colorPrint] of [outsideLink, insideLink, folderName].entries()) {
      const target = path.join(root, `cover-muse-print-${index}`);
      const error = await rejection(() =>
        deliverCover({ approvals: coverApprovals({ colorPrint }), museRoot: coverMuse, deliveryRoot: target }),
      );
      expect.soft(error.message, `Print case ${index} names the rule`).toMatch(/regular file|symlink|link|outside|refus/i);
      expect.soft({ [`Print case ${index} writes no file`]: await walk(target) })
        .toEqual({ [`Print case ${index} writes no file`]: [] });
    }
  });

  it('T197 turns no model review in the notes into a person review', async () => {
    const deliverCover = await coverSeam();
    const manifest = await deliverCover({ approvals: coverApprovals(), museRoot: coverMuse, deliveryRoot: coverDelivery });
    const candidate = candidateOf(jobFor(manifest, COVER_ID));
    expect(candidate.reviews.person).toBeUndefined();
    expect({ 'Cover candidate reviews': candidate.reviews }).toEqual({ 'Cover candidate reviews': {} });
    const text = await readFile(path.join(coverDelivery, 'manifest.json'), 'utf8');
    expect({ 'The cover manifest holds a person review': text.includes('"person"') })
      .toEqual({ 'The cover manifest holds a person review': false });
    expect({ 'The cover manifest holds a person-checked class': text.includes('person-checked') })
      .toEqual({ 'The cover manifest holds a person-checked class': false });
  });

  it('T198 refuses a malformed cover approval list before any write', async () => {
    const deliverCover = await coverSeam();
    const entry = coverApprovals().entries[0]!;
    const cases: Array<{ label: string; approvals: unknown; match: RegExp }> = [
      { label: 'no entry', approvals: { version: 1, entries: [] }, match: /entr|one|approval|invalid/i },
      {
        label: 'two entries',
        approvals: { version: 1, entries: [entry, { ...entry, version: 12, colorPrint: 'l2-cover-v1-m12-color-print.png' }] },
        match: /entr|one|twice|two|approval|invalid/i,
      },
      {
        label: 'another row id',
        approvals: { version: 1, entries: [{ ...entry, rowId: 'l2-w02-story-page-a-nut' }] },
        match: /l2-cover-v1|rowId|invalid/i,
      },
      {
        label: 'a linePrint field',
        approvals: { version: 1, entries: [{ ...entry, linePrint: 'l2-cover-v1-m13-line-print.png' }] },
        match: /linePrint|line|unrecognized|invalid/i,
      },
    ];
    // A line print file exists, so a writer that reads `linePrint` cannot fail on a missing file.
    await writeFile(
      path.join(coverMuse, 'l2-cover-v1-m13-line-print.png'),
      await linePng(PICTURE_SIZES.cover.width, PICTURE_SIZES.cover.height, 40),
    );
    for (const [index, item] of cases.entries()) {
      const target = path.join(root, `cover-malformed-${index}`);
      const error = await rejection(() => deliverCover({ approvals: item.approvals, museRoot: coverMuse, deliveryRoot: target }));
      expect.soft(error.message, `The ${item.label} refusal names the rule`).toMatch(item.match);
      expect.soft({ [`The ${item.label} refusal writes no file`]: await walk(target) })
        .toEqual({ [`The ${item.label} refusal writes no file`]: [] });
    }
  });
});
