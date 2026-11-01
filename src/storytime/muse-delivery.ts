import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
}

interface DeliveryItem {
  row: PictureListRow;
  entry: MuseApprovalEntry;
  version: number;
  colorBytes: Buffer;
  lineBytes: Buffer;
  colorSha256: string;
  lineSha256: string;
  candidate: CandidateManifest;
}

function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
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
  try {
    return await readFile(path.join(museRoot, name));
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
  colorSha256: string;
}): CandidateReviews {
  const { row, entry, version, colorSha256 } = item;
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
      file: row.fileName,
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
      file: row.fileName,
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

  const seen = new Set<string>();
  for (const entry of list.entries) {
    if (seen.has(entry.rowId)) throw new Error(`The approval list holds the row ${entry.rowId} twice.`);
    seen.add(entry.rowId);
    if (!options.rows.some((row) => row.id === entry.rowId)) {
      throw new Error(`The approval list names ${entry.rowId}, which is not a row of the picture list.`);
    }
  }

  const items: DeliveryItem[] = [];
  const problems: string[] = [];
  for (const row of options.rows) {
    const entry = list.entries.find((candidate) => candidate.rowId === row.id);
    if (!entry) continue;
    const plan = planPictureRow(row);
    if (path.basename(plan.lineArtFile) !== plan.lineArtFile) {
      throw new Error(`${row.id}: the line-art file name must be a plain file name: ${plan.lineArtFile}`);
    }
    const colorBytes = await readMuseFile(museRoot, entry.colorPrint, row.id);
    const lineBytes = await readMuseFile(museRoot, entry.linePrint, row.id);
    const size = { width: plan.width, height: plan.height };
    const color = await inspectColorPrint(colorBytes, size);
    const line = await inspectLineArtPng(lineBytes, size);
    for (const error of color.errors) problems.push(`${row.id}: color print ${entry.colorPrint}: ${error}`);
    for (const error of line.errors) problems.push(`${row.id}: line print ${entry.linePrint}: ${error}`);
    if (!color.valid || !line.valid) continue;
    const version = deliveredVersion(row);
    const colorSha256 = sha256(colorBytes);
    const lineSha256 = sha256(lineBytes);
    let reviews: CandidateReviews;
    try {
      reviews = mapReviews({ row, entry, version, colorSha256 });
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const candidate: CandidateManifest = {
      jobId: row.id,
      version,
      file: plan.colorFile,
      fileSha256: colorSha256,
      status: 'ready',
      structural: color,
      reviews,
      lineArt: {
        file: plan.lineArtFile,
        fileSha256: lineSha256,
        colorFile: plan.colorFile,
        // The Muse flow makes no 3D render evidence, so the field stays empty.
        renderEvidenceFile: '',
        status: 'ready',
        structural: line,
        errors: [],
      },
      failures: [],
    };
    items.push({ row, entry, version, colorBytes, lineBytes, colorSha256, lineSha256, candidate });
  }
  if (problems.length) throw new Error(`The Muse delivery stopped; nothing was written:\n${problems.join('\n')}`);

  const manifest = assembleManifest(
    items.map((item) => manifestJob(item.row)),
    items.map((item) => item.candidate),
  );
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestFile = path.join(deliveryRoot, MANIFEST_FILE);

  // A different manifest, or a different file under a list name, stops the run before any write.
  if (existsSync(manifestFile) && (await readFile(manifestFile, 'utf8')) !== manifestText) {
    throw new Error(`The delivery folder already holds a different ${MANIFEST_FILE}; the writer will not overwrite it.`);
  }
  const copies: Array<{ file: string; bytes: Buffer; sha256: string; rowId: string }> = [];
  for (const item of items) {
    copies.push(
      { file: item.row.fileName, bytes: item.colorBytes, sha256: item.colorSha256, rowId: item.row.id },
      { file: item.row.lineArtFileName, bytes: item.lineBytes, sha256: item.lineSha256, rowId: item.row.id },
    );
  }
  const pending: typeof copies = [];
  for (const copy of copies) {
    const target = path.join(deliveryRoot, copy.file);
    if (existsSync(target)) {
      if (sha256(await readFile(target)) !== copy.sha256) {
        throw new Error(`${copy.rowId}: the delivery file ${copy.file} exists with different bytes; the writer will not overwrite it.`);
      }
      continue;
    }
    pending.push(copy);
  }

  await mkdir(deliveryRoot, { recursive: true });
  for (const copy of pending) await writeFile(path.join(deliveryRoot, copy.file), copy.bytes);
  await writeFile(manifestFile, manifestText);
  return manifest;
}
