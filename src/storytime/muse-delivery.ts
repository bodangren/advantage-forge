import { createHash } from 'node:crypto';
import type { Stats } from 'node:fs';
import { lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import {
  PICTURE_RUBRIC_VERSION,
  assembleManifest,
  inspectLineArtPng,
  planPictureRow,
  priceForProvider,
  rowCaptureJob,
  type CandidateManifest,
  type CandidateReviews,
  type ModelReview,
  type PersonReview,
  type PictureListRow,
  type PictureStructuralCheck,
  type StorytimeJob,
  type StorytimeManifest,
} from './book-pictures.js';

// The Muse week 1 delivery writer (spec.md amendment 2026-11-01, decision 2). It copies the
// approved Muse print files to the delivery folder under the picture list names, and it writes
// one manifest.json in the StorytimeManifest shape. It reads local files only. It uses no
// network and no key.

const MANIFEST_FILE = 'manifest.json';

/** A file name inside the Muse folder: no folder part, so an entry cannot reach another path. */
const MuseFileName = z
  .string()
  .min(1)
  .refine((name) => path.basename(name) === name && name !== '.' && name !== '..', {
    message: 'must be a plain file name',
  });

const KimiReviewSchema = z.object({
  provider: z.literal('kimi'),
  model: z.string().min(1),
  verdict: z.enum(['pass', 'fail']),
  reason: z.string(),
  checkedAt: z.string().min(1),
  rawFile: z.string().min(1).optional(),
  callId: z.string().min(1).optional(),
  modelSource: z.enum(['declared', 'reported']).optional(),
  observedCounts: z.record(z.string(), z.number()).optional(),
  issues: z.array(z.string()).optional(),
  rawOutput: z.string().optional(),
});

const PersonReviewSchema = z.object({
  checkedBy: z.string().min(1),
  verdict: z.enum(['pass', 'fail']),
  checkedAt: z.string().min(1),
  evidenceClass: z.enum(['owner-passed', 'person-checked']),
  observedCounts: z.record(z.string(), z.number()),
});

const MuseApprovalEntrySchema = z.object({
  rowId: z.string().min(1),
  /** The Muse version of the approved print (the `m<n>` of the Muse file names). */
  version: z.number().int().positive(),
  /**
   * The version of the delivered file names. The writer replaces the `-v<n>` suffix of the list
   * names with it. Without the field the delivered names are the list names.
   */
  fileVersion: z.number().int().min(1).optional(),
  colorPrint: MuseFileName,
  linePrint: MuseFileName,
  reviews: z
    .object({ kimi: KimiReviewSchema.optional(), person: PersonReviewSchema.optional() })
    .strict()
    .optional(),
  notes: z.array(z.string()).optional(),
});

const MuseApprovalListSchema = z.object({
  version: z.literal(1),
  /** The SHA-256 of the picture list file. When present, the writer refuses a different list. */
  pictureListSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  entries: z.array(MuseApprovalEntrySchema),
});

export type MuseApprovalEntry = z.infer<typeof MuseApprovalEntrySchema>;
export type MuseApprovalList = z.infer<typeof MuseApprovalListSchema>;

export interface MuseDeliveryOptions {
  /** The picture list rows. A row without an approval entry is not clean and gets no job. */
  rows: PictureListRow[];
  /** The approval list, or the path of its JSON file. */
  approvals: MuseApprovalList | string;
  /** The folder that holds the Muse print files named in the approval entries. */
  museRoot: string;
  /** The delivery batch root: the folder that gets the copied files and manifest.json. */
  deliveryRoot: string;
  /** The measured SHA-256 of the picture list file. The writer checks it against the pin. */
  pictureListSha256?: string;
  /** Called once for each row without an approval entry. The row gets no job. */
  onSkip?: (rowId: string, reason: string) => void;
}

interface DeliveryItem {
  row: PictureListRow;
  entry: MuseApprovalEntry;
  version: number;
  colorFile: string;
  lineFile: string;
  colorBytes: Buffer;
  lineBytes: Buffer;
  colorSha256: string;
  lineSha256: string;
  candidate: CandidateManifest;
}

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Resolves the Muse folder and the delivery folder against the repository root. Each path must
 * be the `out` folder of the repository or sit under it.
 */
export function resolveMuseDeliveryPaths(options: {
  repoRoot: string;
  muse: string;
  delivery: string;
}): { museRoot: string; deliveryRoot: string } {
  const repoRoot = path.resolve(options.repoRoot);
  const outRoot = path.join(repoRoot, 'out');
  const museRoot = path.resolve(repoRoot, options.muse);
  const deliveryRoot = path.resolve(repoRoot, options.delivery);
  if (!isInside(outRoot, museRoot)) {
    throw new Error(`--muse must sit inside the repository out folder (${outRoot}); got ${museRoot}.`);
  }
  if (!isInside(outRoot, deliveryRoot)) {
    throw new Error(`--delivery must sit inside the repository out folder (${outRoot}); got ${deliveryRoot}.`);
  }
  return { museRoot, deliveryRoot };
}

/** Refuses a picture list whose bytes differ from the SHA-256 pin of the approval list. */
export function checkPictureListPin(listBytes: Buffer | string, approvals: { pictureListSha256?: string }): void {
  const pin = approvals.pictureListSha256;
  if (pin === undefined) return;
  const measured = sha256(listBytes);
  if (measured !== pin) {
    throw new Error(
      `The picture list SHA-256 ${measured} differs from the pin ${pin} of the approval list; the list changed.`,
    );
  }
}

async function lstatOrNull(file: string): Promise<Stats | null> {
  try {
    return await lstat(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function parseApprovals(approvals: MuseApprovalList | string): Promise<MuseApprovalList> {
  const source: unknown =
    typeof approvals === 'string' ? JSON.parse(await readFile(approvals, 'utf8')) : approvals;
  const parsed = MuseApprovalListSchema.safeParse(source);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  const where = issue ? issue.path.join('.') : 'list';
  throw new Error(`The approval list is invalid at ${where}: ${issue?.message ?? 'invalid list'}.`);
}

/** The version of the delivered file, taken from the list name `<row id>-v<n>.png`. */
function deliveredVersion(row: PictureListRow): number {
  const match = /-v(\d+)\.png$/.exec(row.fileName);
  return match ? Number(match[1]) : 1;
}

/**
 * The delivered file names and version of one row. An entry with `fileVersion` replaces the
 * `-v<n>` suffix of both list names. An entry without it keeps the list names.
 */
function deliveredNames(
  row: PictureListRow,
  entry: MuseApprovalEntry,
  plan: { colorFile: string; lineArtFile: string },
): { colorFile: string; lineFile: string; version: number } {
  if (entry.fileVersion === undefined) {
    return { colorFile: plan.colorFile, lineFile: plan.lineArtFile, version: deliveredVersion(row) };
  }
  const suffix = /-v\d+\.png$/;
  for (const name of [plan.colorFile, plan.lineArtFile]) {
    if (!suffix.test(name)) {
      throw new Error(`${row.id}: fileVersion needs a list file name with a -v<n>.png suffix; got ${name}`);
    }
  }
  const replace = (name: string): string => name.replace(suffix, `-v${entry.fileVersion}.png`);
  return { colorFile: replace(plan.colorFile), lineFile: replace(plan.lineArtFile), version: entry.fileVersion };
}

async function inspectColorPrint(
  png: Buffer,
  expected: { width: number; height: number },
): Promise<PictureStructuralCheck> {
  const digest = sha256(png);
  try {
    const metadata = await sharp(png).metadata();
    const errors: string[] = [];
    if (metadata.format !== 'png') errors.push('The color print must be a PNG file.');
    if (metadata.width !== expected.width || metadata.height !== expected.height) {
      errors.push(
        `The color print must be ${expected.width} x ${expected.height} pixels; ` +
          `measured ${metadata.width} x ${metadata.height} pixels.`,
      );
    }
    if (metadata.hasAlpha) errors.push('The color print must have no alpha channel.');
    if (metadata.isPalette) errors.push('The color print must not be a palette PNG.');
    if (metadata.depth !== 'uchar' || metadata.bitsPerSample !== 8) {
      errors.push(`The color print must be 8-bit; measured depth ${metadata.depth} and ${metadata.bitsPerSample} bits.`);
    }
    if (metadata.space !== 'srgb') {
      errors.push(`The color print must be in the srgb color space; measured ${metadata.space}.`);
    }
    if (metadata.channels !== 3) {
      errors.push(`The color print must have exactly 3 channels; measured ${metadata.channels}.`);
    }
    return {
      valid: errors.length === 0,
      ...(metadata.width === undefined ? {} : { width: metadata.width }),
      ...(metadata.height === undefined ? {} : { height: metadata.height }),
      sha256: digest,
      errors,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, sha256: digest, errors: [`Invalid PNG: ${reason}`] };
  }
}

async function readMuseFile(museRoot: string, name: string, rowId: string): Promise<Buffer> {
  const file = path.join(museRoot, name);
  try {
    const link = await lstat(file);
    if (link.isSymbolicLink()) throw new Error('the file is a symlink; the writer refuses it');
    const real = await realpath(file);
    if (!isInside(await realpath(museRoot), real)) throw new Error('the file is outside the Muse folder');
    if (!(await stat(real)).isFile()) throw new Error('the path is not a regular file');
    return await readFile(real);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${rowId}: cannot read the Muse print file ${name}: ${reason}`);
  }
}

/** Maps the review fields of one approval entry. The mapper adds no review that the entry lacks. */
function mapReviews(item: {
  row: PictureListRow;
  entry: MuseApprovalEntry;
  version: number;
  colorFile: string;
  colorSha256: string;
}): CandidateReviews {
  const { row, entry, version, colorFile, colorSha256 } = item;
  const reviews: CandidateReviews = {};
  const kimi = entry.reviews?.kimi;
  if (kimi) {
    if (kimi.verdict !== 'pass') {
      throw new Error(`${row.id}: the Kimi review verdict is ${kimi.verdict}; the row is not clean.`);
    }
    const review: ModelReview = {
      kind: 'model-pre-check',
      jobId: row.id,
      version,
      file: colorFile,
      provider: 'kimi',
      model: kimi.model,
      ...(kimi.modelSource ? { modelSource: kimi.modelSource } : {}),
      ...(kimi.callId ? { callId: kimi.callId } : {}),
      ...(kimi.rawFile ? { rawFile: kimi.rawFile } : {}),
      price: priceForProvider('kimi'),
      rubricVersion: PICTURE_RUBRIC_VERSION,
      sourceText: row.text ?? '',
      sourcePrompt: row.prompt ?? '',
      time: 'still',
      verdict: kimi.verdict,
      reason: kimi.reason,
      observedCounts: kimi.observedCounts ?? {},
      issues: kimi.issues ?? [],
      rawOutput: kimi.rawOutput ?? '',
      checkedAt: kimi.checkedAt,
      fileSha256: colorSha256,
    };
    reviews.kimi = review;
  }
  const person = entry.reviews?.person;
  if (person) {
    if (person.verdict !== 'pass') {
      throw new Error(`${row.id}: the person review verdict is ${person.verdict}; the row is not clean.`);
    }
    const review: PersonReview = {
      kind: 'person-count',
      jobId: row.id,
      version,
      file: colorFile,
      sourceText: row.text ?? '',
      ...(row.prompt === undefined ? {} : { sourcePrompt: row.prompt }),
      time: 'still',
      verdict: person.verdict,
      observedCounts: person.observedCounts,
      checkedBy: person.checkedBy,
      checkedAt: person.checkedAt,
      evidenceClass: person.evidenceClass,
      fileSha256: colorSha256,
    };
    reviews.person = review;
  }
  return reviews;
}

function manifestJob(row: PictureListRow): StorytimeJob {
  // The files sit at the delivery root. The job directory only groups the batch hash by week.
  return { ...rowCaptureJob(row), directory: `w${String(row.week).padStart(2, '0')}` };
}

/**
 * Writes the week 1 delivery. Every check runs before the first write, so a refusal leaves the
 * delivery folder unchanged. The writer copies the Muse print files byte for byte and writes
 * manifest.json last.
 */
export async function writeMuseDelivery(options: MuseDeliveryOptions): Promise<StorytimeManifest> {
  const list = await parseApprovals(options.approvals);
  const museRoot = path.resolve(options.museRoot);
  const deliveryRoot = path.resolve(options.deliveryRoot);

  // A row id twice would pair every candidate with both jobs in assembleManifest.
  const rowIds = new Set<string>();
  for (const row of options.rows) {
    if (rowIds.has(row.id)) throw new Error(`The picture list holds the row ${row.id} twice.`);
    rowIds.add(row.id);
  }

  const deliveryInfo = await lstatOrNull(deliveryRoot);
  if (deliveryInfo?.isSymbolicLink()) {
    throw new Error(`The delivery folder ${deliveryRoot} is a symlink; the writer refuses it.`);
  }

  const seen = new Set<string>();
  for (const entry of list.entries) {
    if (seen.has(entry.rowId)) throw new Error(`The approval list holds the row ${entry.rowId} twice.`);
    seen.add(entry.rowId);
    if (!options.rows.some((row) => row.id === entry.rowId)) {
      throw new Error(`The approval list names ${entry.rowId}, which is not a row of the picture list.`);
    }
  }

  if (list.pictureListSha256 !== undefined) {
    if (options.pictureListSha256 === undefined) {
      throw new Error('The approval list pins the picture list SHA-256, but the run measured no picture list hash.');
    }
    if (options.pictureListSha256 !== list.pictureListSha256) {
      throw new Error(
        `The picture list SHA-256 ${options.pictureListSha256} differs from the pin ${list.pictureListSha256} of the approval list.`,
      );
    }
  }

  // Name checks run first, so a degenerate or repeated name stops the run before any read or write.
  const delivered = new Map<string, string>();
  for (const row of options.rows) {
    const entry = list.entries.find((candidate) => candidate.rowId === row.id);
    if (!entry) continue;
    const names = deliveredNames(row, entry, planPictureRow(row));
    const lineName = names.lineFile;
    if (path.basename(lineName) !== lineName || lineName === '.' || lineName === '..' || lineName === MANIFEST_FILE) {
      throw new Error(`${row.id}: the line-art file name is a reserved or degenerate name, not a plain file name: ${lineName}`);
    }
    if (lineName === names.colorFile) {
      throw new Error(`${row.id}: the line-art file name is the same as the color file name: ${lineName}`);
    }
    for (const name of [names.colorFile, lineName]) {
      const owner = delivered.get(name);
      if (owner !== undefined) {
        throw new Error(`${row.id}: the delivered file name ${name} is a duplicate; ${owner} already delivers it.`);
      }
      delivered.set(name, row.id);
    }
  }

  const items: DeliveryItem[] = [];
  const problems: string[] = [];
  for (const row of options.rows) {
    const entry = list.entries.find((candidate) => candidate.rowId === row.id);
    if (!entry) {
      options.onSkip?.(row.id, `The approval list has no entry for ${row.id}; the row is not clean and gets no job.`);
      continue;
    }
    const plan = planPictureRow(row);
    const colorBytes = await readMuseFile(museRoot, entry.colorPrint, row.id);
    const lineBytes = await readMuseFile(museRoot, entry.linePrint, row.id);
    const size = { width: plan.width, height: plan.height };
    const color = await inspectColorPrint(colorBytes, size);
    const line = await inspectLineArtPng(lineBytes, size);
    for (const error of color.errors) problems.push(`${row.id}: color print ${entry.colorPrint}: ${error}`);
    for (const error of line.errors) problems.push(`${row.id}: line print ${entry.linePrint}: ${error}`);
    if (!color.valid || !line.valid) continue;
    const { colorFile, lineFile, version } = deliveredNames(row, entry, plan);
    const colorSha256 = sha256(colorBytes);
    const lineSha256 = sha256(lineBytes);
    let reviews: CandidateReviews;
    try {
      reviews = mapReviews({ row, entry, version, colorFile, colorSha256 });
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const candidate: CandidateManifest = {
      jobId: row.id,
      version,
      file: colorFile,
      fileSha256: colorSha256,
      status: 'ready',
      structural: color,
      reviews,
      lineArt: {
        file: lineFile,
        fileSha256: lineSha256,
        colorFile,
        // The Muse flow makes no 3D render evidence, so the field stays empty.
        renderEvidenceFile: '',
        status: 'ready',
        structural: line,
        errors: [],
      },
      failures: [],
    };
    items.push({ row, entry, version, colorFile, lineFile, colorBytes, lineBytes, colorSha256, lineSha256, candidate });
  }
  if (problems.length) throw new Error(`The Muse delivery stopped; nothing was written:\n${problems.join('\n')}`);

  const manifest = assembleManifest(
    items.map((item) => manifestJob(item.row)),
    items.map((item) => item.candidate),
  );
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestFile = path.join(deliveryRoot, MANIFEST_FILE);

  // A different manifest, or a different file under a list name, stops the run before any write.
  // A symlink at a target stops the run too: the writer never follows a link.
  const manifestInfo = await lstatOrNull(manifestFile);
  let manifestExists = false;
  if (manifestInfo) {
    if (!manifestInfo.isFile()) throw new Error(`The delivery path ${MANIFEST_FILE} is a symlink or not a regular file; the writer refuses it.`);
    if ((await readFile(manifestFile, 'utf8')) !== manifestText) {
      throw new Error(`The delivery folder already holds a different ${MANIFEST_FILE}; the writer will not overwrite it.`);
    }
    manifestExists = true;
  }
  const copies: Array<{ file: string; bytes: Buffer; sha256: string; rowId: string }> = [];
  for (const item of items) {
    copies.push(
      { file: item.colorFile, bytes: item.colorBytes, sha256: item.colorSha256, rowId: item.row.id },
      { file: item.lineFile, bytes: item.lineBytes, sha256: item.lineSha256, rowId: item.row.id },
    );
  }
  const pending: typeof copies = [];
  for (const copy of copies) {
    const target = path.join(deliveryRoot, copy.file);
    const info = await lstatOrNull(target);
    if (info) {
      if (!info.isFile()) {
        throw new Error(`${copy.rowId}: the delivery path ${copy.file} is a symlink or not a regular file; the writer refuses it.`);
      }
      if (sha256(await readFile(target)) !== copy.sha256) {
        throw new Error(`${copy.rowId}: the delivery file ${copy.file} exists with different bytes; the writer will not overwrite it.`);
      }
      continue;
    }
    pending.push(copy);
  }

  // The `wx` flag creates a file only when none exists, so a link that appears later is not followed.
  await mkdir(deliveryRoot, { recursive: true });
  for (const copy of pending) await writeFile(path.join(deliveryRoot, copy.file), copy.bytes, { flag: 'wx' });
  if (!manifestExists) await writeFile(manifestFile, manifestText, { flag: 'wx' });
  return manifest;
}
