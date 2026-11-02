import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { appendFile, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path, { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, Page } from 'playwright';
import type { InlineConfig, Plugin } from 'vite';
import sharp, { type OverlayOptions } from 'sharp';
import { z } from 'zod';
import { inflateSync } from 'node:zlib';
import { buildTimeline, type Spec, type Stage, type Timeline } from '../song/timeline.js';
import { LINE_ART_PASS_TECHNIQUE } from './line-art-pass.js';

export const PICTURE_RUBRIC_VERSION = 'storytime-picture-v2';
export const RENDERER_ID = 'forge-song-timeline-book-still-v1';
export const LINEART_FORMAT_VERSION = 'storytime-lineart-provisional-v1';
/**
 * The technique label of a capture packet that names no technique (the injected line-art
 * passes of the tests and the version 2 records). The live page pass names its own technique,
 * `LINE_ART_PASS_TECHNIQUE` (version 3), in the capture packet.
 */
export const LINEART_TECHNIQUE = 'song-page-form-edges-viewdepth-1bit-v2';
export const BATCH_HASH_ALGORITHM =
  'SHA-256 of UTF-8 JSON.stringify([{file,sha256}]) with entries sorted by file and no whitespace';
export const PICTURE_SIZES = {
  story: { width: 4000, height: 3000 },
  cover: { width: 4000, height: 3000 },
  small: { width: 1500, height: 1500 },
} as const;
/**
 * Specification v0 pixel sizes (replaced 2026-10-28 by specification v1, Workbooks commit
 * a9178413). New renders use specification v1 sizes. The structural checks still accept these
 * legacy sizes, so candidates that earlier phases rendered at v0 keep their evidence.
 */
export const LEGACY_PICTURE_SIZES = {
  story: { width: 3000, height: 2250 },
  cover: { width: 3600, height: 2700 },
  small: { width: 1500, height: 1500 },
} as const;
export const MINIMAX_VISION_MODEL = 'mmx-vision-default';
/** Specification v1: a closed black outline is at least 12 px thick. */
export const MIN_LINE_ART_LINE_WIDTH_PX = 12;

const FORGE_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_OUTPUT = 'out/storytime/l2/unit1';
const DEFAULT_WORKBOOKS = path.resolve(FORGE_ROOT, '../Workbooks');
const MODEL_PROVIDERS = ['minimax', 'kimi'] as const;
const FILE_TYPES: Record<string, string> = {
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

export type BookKind = 'readalong' | 'decodable';
export type PictureUse = BookKind | 'cover' | 'small';
export type PictureSize = keyof typeof PICTURE_SIZES;
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];
export type ReviewVerdict = 'pass' | 'fail';
export type CalibrationId = 'bad-one-sun' | 'good-nan';

export interface StorytimeJob {
  id: string;
  week: number;
  bookKind: BookKind;
  bookTitle: string;
  page: number;
  text: string;
  sourcePrompt: string;
  characters: string[];
  sourcePackage: string;
  sourceSha256: string;
  slug: string;
  directory: string;
  use: PictureUse;
  size: PictureSize;
}

export interface BookStageSource {
  jobId: string;
  version: number;
  at: number;
  spec: Spec;
  stage: Stage;
}

export interface StageReference {
  file: string;
  sha256: string;
  at: number;
}

export interface BookStageFile extends StageReference {
  absoluteFile: string;
  source: BookStageSource;
  bytes: Buffer;
}

export interface RenderEvidence {
  renderer: string;
  jobId: string;
  version: number;
  stageFile: string;
  stageSha256: string;
  file: string;
  at: number;
  warnings: string[];
  camera?: unknown;
  colorFile?: string;
  colorSha256?: string;
  lineArtFile?: string;
  lineArtSha256?: string;
  lineArtFormatVersion?: string;
  lineArtTechnique?: string;
  width?: number;
  height?: number;
}

export interface PriceRecord {
  basis: string;
  marginalCashUsd: 0;
  note: string;
}

export interface ModelReview {
  kind: 'model-pre-check';
  jobId: string;
  version: number;
  file: string;
  provider: ModelProvider;
  model: string;
  /** `declared` when the pipeline names the model, `reported` when the provider output names it. */
  modelSource?: 'declared' | 'reported' | undefined;
  /** The paid call that made this log, and its raw output file under `raw/`. */
  callId?: string | undefined;
  rawFile?: string | undefined;
  price: PriceRecord;
  rubricVersion: string;
  sourceText: string;
  sourcePrompt: string;
  time: 'still';
  verdict: ReviewVerdict;
  reason: string;
  observedCounts: Record<string, number>;
  issues: string[];
  rawOutput: string;
  checkedAt: string;
  fileSha256: string;
}

export interface PersonReview {
  kind?: 'person-count';
  jobId: string;
  version: number;
  file: string;
  sourceText: string;
  sourcePrompt?: string;
  time?: 'still';
  verdict: ReviewVerdict;
  observedCounts: Record<string, number>;
  checkedBy: string;
  checkedAt: string;
  evidenceClass: 'owner-passed' | 'person-checked';
  fileSha256?: string;
  rubricVersion?: string;
}

export interface PictureStructuralCheck {
  valid: boolean;
  width?: number;
  height?: number;
  sha256?: string;
  errors: string[];
}

export interface CandidateReviewsInput {
  minimax?: unknown;
  kimi?: unknown;
  person?: unknown;
}

export interface CandidateReviews {
  minimax?: ModelReview;
  kimi?: ModelReview;
  person?: PersonReview;
}

export interface LineArtManifest {
  file: string;
  fileSha256?: string;
  colorFile: string;
  renderEvidenceFile: string;
  status: 'ready' | 'pending' | 'failed';
  structural: PictureStructuralCheck;
  formatVersion?: string;
  technique?: string;
  errors: string[];
}

export interface CandidateManifest {
  jobId: string;
  version: number;
  file: string;
  fileSha256?: string;
  status: 'ready' | 'pending' | 'failed';
  structural: PictureStructuralCheck;
  render?: RenderEvidence;
  reviews: CandidateReviews;
  lineArt?: LineArtManifest;
  failures: string[];
}

export interface ManifestJob extends StorytimeJob {
  candidates: CandidateManifest[];
  selectedVersion: number | null;
  selectedFile: string | null;
  selectedSha256: string | null;
  status: 'ready' | 'pending' | 'failed';
}

export interface BatchFile {
  file: string;
  sha256: string;
}

export interface BatchManifest {
  id: string;
  week: number;
  bookKind: BookKind;
  outputKind: 'color' | 'lineart';
  files: BatchFile[];
  sha256: string;
}

export interface StorytimeManifest {
  version: 1;
  batchHashAlgorithm: string;
  jobs: ManifestJob[];
  batches: BatchManifest[];
}

export interface PaidCallDetails {
  operation: 'vision-describe' | 'kimi-native-image';
  provider: ModelProvider;
  model: string;
  /** A before-call entry is always `declared` (RA-N6). */
  modelSource?: 'declared' | 'reported';
  purpose: string;
  jobId: string;
  version: number;
  price: PriceRecord;
  /** The reviewed file. The Kimi record path reads it back from the before-call entry. */
  file?: string;
}

export interface BeforeCallLedgerEntry extends PaidCallDetails {
  event: 'before-call';
  callId: string;
  recordedAt: string;
}

export interface AfterCallLedgerEntry extends PaidCallDetails {
  event: 'after-call';
  callId: string;
  recordedAt: string;
  status: 'success' | 'failure';
  error?: string;
  /** The failure reason of a `--failed` record; a failed call has no raw answer. */
  reason?: string;
}

export type LedgerEntry = BeforeCallLedgerEntry | AfterCallLedgerEntry;

export interface ProviderResult {
  stdout: string;
  stderr: string;
}

export type ProviderRunner = (command: string, args: string[]) => Promise<ProviderResult>;

export interface CalibrationTarget {
  id: CalibrationId;
  jobId: string;
  version: number;
  file: string;
  sourceText: string;
  sourcePrompt: string;
}

export interface BookCaptureInput {
  job: StorytimeJob;
  stage: BookStageFile;
  timeline: Timeline;
  repoRoot: string;
  size?: { width: number; height: number };
}

/** One render run: both twins and the camera from the same page load and the same seek. */
export interface BookCapturePacket {
  color: Buffer;
  lineArt?: Buffer;
  camera: unknown;
  warnings?: string[];
  /** Peak resident memory of the capture process in MB (specification v1 label). */
  peakRssMb?: number;
  /** The technique of the line-art pass that made `lineArt`; absent means `LINEART_TECHNIQUE`. */
  lineArtTechnique?: string;
}

/**
 * The capture returns a twin packet. The plain Buffer return is the pre-line-art draft shape;
 * `renderCandidates` treats it as a color-only capture and refuses it for reader pages.
 */
export type BookCaptureOutput = BookCapturePacket | Buffer;
export type BookCapture = (input: BookCaptureInput) => Promise<BookCaptureOutput>;
export type BookStageReader = (input: {
  job: StorytimeJob;
  version: number;
  repoRoot: string;
}) => Promise<BookStageFile>;

const CountsSchema = z.record(z.string(), z.number().int().nonnegative());
const PriceSchema = z.object({
  basis: z.string().min(1),
  marginalCashUsd: z.literal(0),
  note: z.string().min(1),
});
const ReviewIdentitySchema = z.object({
  jobId: z.string().min(1),
  version: z.number().int().positive(),
  file: z.string().min(1),
  sourceText: z.string(),
  sourcePrompt: z.string().min(1),
  time: z.literal('still'),
  fileSha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const ModelReviewSchema = ReviewIdentitySchema.extend({
  kind: z.literal('model-pre-check'),
  provider: z.enum(MODEL_PROVIDERS),
  model: z.string().min(1),
  modelSource: z.enum(['declared', 'reported']).optional(),
  callId: z.string().min(1).optional(),
  rawFile: z.string().min(1).optional(),
  price: PriceSchema,
  rubricVersion: z.string().min(1),
  verdict: z.enum(['pass', 'fail']),
  reason: z.string().min(1),
  observedCounts: CountsSchema,
  issues: z.array(z.string()),
  rawOutput: z.string(),
  checkedAt: z.string().min(1),
});
const PersonReviewSchema = z.object({
  kind: z.literal('person-count').optional(),
  jobId: z.string().min(1),
  version: z.number().int().positive(),
  file: z.string().min(1),
  sourceText: z.string(),
  sourcePrompt: z.string().min(1).optional(),
  time: z.literal('still').optional(),
  verdict: z.enum(['pass', 'fail']),
  observedCounts: CountsSchema.refine((counts) => Object.keys(counts).length > 0),
  checkedBy: z.string().min(1),
  checkedAt: z.string().min(1),
  evidenceClass: z.enum(['owner-passed', 'person-checked']),
  fileSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  rubricVersion: z.string().min(1).optional(),
});
const RenderEvidenceSchema = z.object({
  renderer: z.string().min(1),
  jobId: z.string().min(1),
  version: z.number().int().positive(),
  stageFile: z.string().min(1),
  stageSha256: z.string().regex(/^[a-f0-9]{64}$/),
  file: z.string().min(1),
  at: z.number().nonnegative(),
  warnings: z.array(z.string()),
  camera: z.unknown().optional(),
  colorFile: z.string().min(1).optional(),
  colorSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  lineArtFile: z.string().min(1).optional(),
  lineArtSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  lineArtFormatVersion: z.string().min(1).optional(),
  lineArtTechnique: z.string().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
const JobSchema = z.object({
  id: z.string().regex(/^w0[1-7]-(readalong|decodable)-p0[1-8]$/),
  week: z.number().int().min(1).max(7),
  bookKind: z.enum(['readalong', 'decodable']),
  bookTitle: z.string().min(1),
  page: z.number().int().min(1).max(8),
  text: z.string(),
  sourcePrompt: z.string().min(1),
  characters: z.array(z.string().min(1)),
  sourcePackage: z.string().min(1),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  directory: z.string().regex(/^w0[1-7]\/(readalong|decodable)$/),
  use: z.enum(['readalong', 'decodable', 'cover', 'small']),
  size: z.enum(['story', 'cover', 'small']),
});
const PackageSchema = z.object({
  meta: z.object({ week: z.number().int().min(1).max(7) }),
  books: z
    .array(
      z.object({
        kind: z.enum(['readalong', 'decodable']),
        title: z.string().min(1),
        pages: z
          .array(
            z.object({
              text: z.string(),
              image: z.object({ prompt: z.string().min(1), characters: z.array(z.string().min(1)) }),
            }),
          )
          .length(8),
      }),
    )
    .length(2),
});
const SpecLineSchema = z.object({
  text: z.string(),
  gesture: z.string().optional(),
  start: z.number().finite(),
  end: z.number().finite(),
  actors: z.array(z.string()).optional(),
  scene: z.string().optional(),
  segments: z
    .array(
      z.object({
        start: z.number().finite(),
        end: z.number().finite(),
        words: z
          .array(
            z.object({ text: z.string().optional(), start: z.number().finite(), end: z.number().finite() }),
          )
          .optional(),
      }),
    )
    .optional(),
});
const SpecCheckSchema = z.object({
  title: z.string().optional(),
  duration: z.number().positive(),
  lines: z.array(SpecLineSchema),
});
const BookStageSourceSchema = z
  .object({
    jobId: z.string().min(1),
    version: z.number().int().positive(),
    at: z.number().nonnegative(),
    spec: z.custom<Spec>((value) => SpecCheckSchema.safeParse(value).success),
    stage: z.custom<Stage>((value) => typeof value === 'object' && value !== null && !Array.isArray(value)),
  })
  .strict();

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function padWeek(value: number): string {
  return String(value).padStart(2, '0');
}

function padPage(value: number): string {
  return String(value).padStart(2, '0');
}

function assertVersion(version: number): void {
  if (!Number.isSafeInteger(version) || version < 1) throw new Error('Version must be a positive integer.');
}

function inside(parent: string, target: string, allowSame: boolean): boolean {
  const relative = path.relative(parent, target);
  if (relative === '') return allowSame;
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function futureRealPath(file: string): string {
  let ancestor = file;
  while (!existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  return path.resolve(realpathSync(ancestor), path.relative(ancestor, file));
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function missingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function jsonObjects(text: string): unknown[] {
  const values: unknown[] = [];
  let start = -1;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (character === '}' && depth > 0 && --depth === 0 && start >= 0) {
      try { values.push(JSON.parse(text.slice(start, index + 1))); } catch { /* Keep scanning later objects. */ }
      start = -1;
    }
  }
  return values;
}

function slugForPage(text: string, characters: string[], bookTitle: string): string {
  const ignored = new Set([
    'a',
    'am',
    'and',
    'are',
    'can',
    'could',
    'do',
    'does',
    'get',
    'has',
    'have',
    'he',
    'hello',
    'her',
    'his',
    'how',
    'i',
    'in',
    'is',
    'it',
    'many',
    'my',
    'no',
    'nod',
    'nods',
    'of',
    'off',
    'oh',
    'on',
    'run',
    'runs',
    'sat',
    'saw',
    'see',
    'she',
    'sit',
    'sits',
    'tap',
    'taps',
    'that',
    'the',
    'this',
    'was',
    'wave',
    'waves',
    'with',
    'yes',
    'your',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !ignored.has(word));
  const unique = [...new Set(words)];
  const fallback = characters.length
    ? characters.map((name) => name.trim().toLowerCase().replace(/\s+/g, '-'))
    : [bookTitle];
  const slug = (unique.length ? unique : fallback)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 4)
    .join('-')
    .slice(0, 48)
    .replace(/-+$/g, '');
  if (!slug) throw new Error(`Cannot derive a subject slug for ${bookTitle}: ${text}`);
  return slug;
}

function assertCompleteJobs(jobs: StorytimeJob[]): void {
  if (jobs.length !== 112) throw new Error(`Expected 112 jobs, received ${jobs.length}.`);
  const ids = new Set(jobs.map((job) => job.id));
  if (ids.size !== jobs.length) throw new Error('Job IDs must be unique.');
  for (let week = 1; week <= 7; week += 1) {
    const weekly = jobs.filter((job) => job.week === week);
    if (weekly.length !== 16)
      throw new Error(`Expected 16 jobs for week ${week}, received ${weekly.length}.`);
    for (const kind of ['readalong', 'decodable'] as const) {
      const pages = weekly.filter((job) => job.bookKind === kind).map((job) => job.page);
      if (pages.length !== 8 || pages.some((page, index) => page !== index + 1)) {
        throw new Error(`Expected pages 1 to 8 for w${padWeek(week)} ${kind}.`);
      }
    }
  }
}

export function buildStorytimeJobs(options: { workbooksRoot: string }): StorytimeJob[] {
  const workbooksRoot = path.resolve(options.workbooksRoot);
  const jobs: StorytimeJob[] = [];
  for (let week = 1; week <= 7; week += 1) {
    const sourcePackage = path.resolve(workbooksRoot, `content/storytime/l2/w${padWeek(week)}.json`);
    const bytes = readFileSync(sourcePackage);
    const sourcePackageData = PackageSchema.parse(JSON.parse(bytes.toString('utf8')));
    if (sourcePackageData.meta.week !== week) throw new Error(`Week mismatch in ${sourcePackage}.`);
    const sourceSha256 = sha256(bytes);
    for (const bookKind of ['readalong', 'decodable'] as const) {
      const books = sourcePackageData.books.filter((book) => book.kind === bookKind);
      if (books.length !== 1) throw new Error(`Expected one ${bookKind} book in ${sourcePackage}.`);
      const book = books[0]!;
      book.pages.forEach((page, index) => {
        const pageNumber = index + 1;
        jobs.push({
          id: `w${padWeek(week)}-${bookKind}-p${padPage(pageNumber)}`,
          week,
          bookKind,
          bookTitle: book.title,
          page: pageNumber,
          text: page.text,
          sourcePrompt: page.image.prompt,
          characters: [...page.image.characters],
          sourcePackage,
          sourceSha256,
          slug: slugForPage(page.text, page.image.characters, book.title),
          directory: `w${padWeek(week)}/${bookKind}`,
          use: bookKind,
          size: 'story',
        });
      });
    }
  }
  assertCompleteJobs(jobs);
  return jobs;
}

export function assertSourceHashes(
  jobs: StorytimeJob[],
  readSource: (file: string) => Buffer = (file) => readFileSync(file),
): void {
  const packages = new Map<string, string>();
  for (const job of jobs) {
    const expected = packages.get(job.sourcePackage);
    if (expected && expected !== job.sourceSha256) {
      throw new Error(`Source hash entries are inconsistent for the same package: ${job.sourcePackage}`);
    }
    packages.set(job.sourcePackage, job.sourceSha256);
  }
  for (const [file, expected] of packages) {
    if (sha256(readSource(file)) !== expected) {
      throw new Error(`Source hash mismatch for ${file}. Run plan again before rendering.`);
    }
  }
}

function requestsParentDirectory(requested: string | undefined): boolean {
  if (!requested) return false;
  return requested.split(/[\\/]+/).includes('..');
}

export function resolveOutputRoot(repoRoot: string, requested?: string): string {
  const forgeRoot = path.resolve(repoRoot);
  const outDirectory = path.join(forgeRoot, 'out');
  const outputRoot = path.resolve(forgeRoot, requested ?? DEFAULT_OUTPUT);
  if (
    requestsParentDirectory(requested) ||
    !inside(outDirectory, outputRoot, false) ||
    !inside(futureRealPath(outDirectory), futureRealPath(outputRoot), false)
  ) {
    throw new Error('Output root must stay inside the Forge out directory.');
  }
  return outputRoot;
}

export function resolveOutputPath(outputRoot: string, relativeFile: string): string {
  if (path.isAbsolute(relativeFile)) throw new Error('Output file must be relative to the output root.');
  const root = path.resolve(outputRoot);
  const target = path.resolve(root, relativeFile);
  if (
    requestsParentDirectory(relativeFile) ||
    !inside(root, target, false) ||
    !inside(futureRealPath(root), futureRealPath(target), false)
  ) {
    throw new Error('Output file must stay inside the output root.');
  }
  return target;
}

export function candidateFilename(job: StorytimeJob, version: number): string {
  assertVersion(version);
  return `l2-w${padWeek(job.week)}-${job.use}-${job.slug}-v${version}.png`;
}

export function candidateRelativePath(job: StorytimeJob, version: number): string {
  return posix.join(job.directory, candidateFilename(job, version));
}

/** The provisional line-art name: outside the Workbooks color pattern through the `-lineart` suffix. */
export function lineArtRelativePath(job: StorytimeJob, version: number): string {
  return posix.join(
    job.directory,
    'lineart',
    candidateFilename(job, version).replace(/\.png$/, '-lineart.png'),
  );
}

export function isReaderJob(job: Pick<StorytimeJob, 'use'>): boolean {
  return job.use === 'readalong' || job.use === 'decodable';
}

export function stageRelativePath(job: StorytimeJob, version: number): string {
  assertVersion(version);
  return posix.join('docs/storytime/l2-unit1', `w${padWeek(job.week)}`, `${job.id}-v${version}.json`);
}

function candidateAbsolutePath(outputRoot: string, job: StorytimeJob, version: number): string {
  return resolveOutputPath(outputRoot, candidateRelativePath(job, version));
}

const FORBIDDEN_STAGE_KEYS = new Set(['song', 'audio', 'video']);

/** A book stage file drives one still picture. Song, audio, and video instructions never belong in it. */
function assertNoMediaKeys(value: unknown, location: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoMediaKeys(item, `${location}[${index}]`));
    return;
  }
  const item = record(value);
  if (!item) return;
  for (const [key, child] of Object.entries(item)) {
    if (FORBIDDEN_STAGE_KEYS.has(key)) {
      throw new Error(`Stage file must not contain ${key} instructions: ${location}.${key}.`);
    }
    assertNoMediaKeys(child, `${location}.${key}`);
  }
}

export function decodeBookStage(options: {
  bytes: Buffer;
  job: StorytimeJob;
  version: number;
  repoRoot: string;
}): BookStageFile {
  assertVersion(options.version);
  const source = BookStageSourceSchema.parse(JSON.parse(options.bytes.toString('utf8')));
  assertNoMediaKeys(source, 'stage');
  if (source.jobId !== options.job.id) throw new Error('Stage job ID does not match the picture job.');
  if (source.version !== options.version)
    throw new Error('Stage version does not match the picture version.');
  if (source.at > source.spec.duration)
    throw new Error('The declared still time exceeds the Timeline duration.');
  const file = stageRelativePath(options.job, options.version);
  return {
    file,
    absoluteFile: path.resolve(options.repoRoot, file),
    sha256: sha256(options.bytes),
    at: source.at,
    source,
    bytes: options.bytes,
  };
}

export async function readBookStage(
  repoRoot: string,
  job: StorytimeJob,
  version: number,
): Promise<BookStageFile> {
  const file = stageRelativePath(job, version);
  const bytes = await readFile(path.resolve(repoRoot, file));
  return decodeBookStage({ bytes, job, version, repoRoot });
}

/** A book still keeps mouth times only from lines that carry explicit word times. */
function explicitWordSings(lines: Spec['lines']): Map<string, { start: number; end: number }[]> {
  const kept = new Map<string, { start: number; end: number }[]>();
  for (const line of lines) {
    const words = (line.segments ?? [])
      .flatMap((segment) => segment.words ?? [])
      .filter((word) => word.end > word.start);
    if (!words.length) continue;
    for (const id of line.actors ?? []) {
      const sings = kept.get(id) ?? [];
      sings.push(...words.map((word) => ({ start: word.start, end: word.end })));
      kept.set(id, sings);
    }
  }
  for (const sings of kept.values()) sings.sort((a, b) => a.start - b.start);
  return kept;
}

export function buildBookStillTimeline(source: BookStageSource): Timeline {
  const timeline = buildTimeline(source.spec, source.stage);
  const kept = explicitWordSings(source.spec.lines);
  for (const actor of timeline.actors) actor.sings = kept.get(actor.id) ?? [];
  if (timeline.warnings.length)
    throw new Error(`Timeline warnings rejected: ${timeline.warnings.join('; ')}`);
  return timeline;
}

export function assertPageNotes(notes: string[]): void {
  if (notes.length) throw new Error(`Page notes rejected: ${notes.join('; ')}`);
}

export function buildReviewPrompt(source: {
  text: string;
  sourcePrompt: string;
  size?: PictureSize;
}): string {
  const lines = [
    `Rubric ${PICTURE_RUBRIC_VERSION}. Review this still picture against the source text and scene prompt.`,
    `Source text: ${source.text}`,
    `Source scene prompt: ${source.sourcePrompt}`,
    'Check object identity and count, prompt and text agreement, character count, faces, hands, unwanted text, age safety, and readability.',
    'Check that the picture has no letters, numbers, signatures, watermarks, or bleed.',
    'Count every object named by the source text. Report the observed counts.',
    'Use PASS only when every check passes. Use FAIL for a failure or an unclear result.',
    'Return JSON only with verdict, reason, observedCounts, and issues.',
    'Use PASS or FAIL for verdict. Use an object of non-negative integers for observedCounts. Use an array for issues.',
  ];
  if (source.size === 'cover') {
    lines.push('The top 30 percent must stay calm and contain no focal actor or prop.');
  }
  if (source.size === 'small') lines.push('The background must be white.');
  return lines.join('\n');
}

export function miniMaxPrecheckArgs(imageFile: string, reviewPrompt: string): string[] {
  return ['vision', 'describe', '--image', imageFile, '--prompt', reviewPrompt];
}

export function calibrationTarget(
  id: CalibrationId,
  workbooksRoot: string,
  repoRoot = FORGE_ROOT,
): CalibrationTarget {
  if (id === 'bad-one-sun') {
    return {
      id,
      jobId: id,
      version: 1,
      file: path.resolve(workbooksRoot, 'content/storytime/l2/media/w02/song-lines/point-up.jpg'),
      sourceText: 'How many suns? One sun!',
      sourcePrompt: 'The picture must show exactly one sun. The picture must agree with the source text.',
    };
  }
  return {
    id,
    jobId: id,
    version: 1,
    file: path.resolve(repoRoot, 'out/chibi-sprouts/r1/week1/cast/sprout-nan/front.png'),
    // The neutral Workbooks character text (w01.json p05), with no approval words (RA-N2).
    sourceText: 'Hello, I am Nan.',
    sourcePrompt:
      'Nan, a five-year-old girl with large dark-brown eyes, short black hair in two small bunches, an orange T-shirt with a white star, red shorts, and white sneakers.',
  };
}

export function priceForProvider(provider: ModelProvider): PriceRecord {
  return {
    basis: provider === 'minimax' ? 'Existing MiniMax shared quota.' : 'Existing OpenCode plan.',
    marginalCashUsd: 0,
    note: 'The provider CLI does not report a per-call cash price.',
  };
}

const CALIBRATION_EXPECTED_VERDICTS: Record<CalibrationId, ReviewVerdict> = {
  'bad-one-sun': 'fail',
  'good-nan': 'pass',
};

/**
 * A production render stops until all four calibration logs hold their expected verdicts against
 * the current rubric version, the current source file hash, and the current source text and prompt
 * (RA-N3). A rubric or text change invalidates the earlier calibration logs.
 */
export async function assertCalibrationReady(
  outputRoot: string,
  workbooksRoot: string = DEFAULT_WORKBOOKS,
  repoRoot: string = FORGE_ROOT,
): Promise<void> {
  for (const [id, expected] of Object.entries(CALIBRATION_EXPECTED_VERDICTS) as [
    CalibrationId,
    ReviewVerdict,
  ][]) {
    const target = calibrationTarget(id, workbooksRoot, repoRoot);
    let sourceSha256: string;
    try {
      sourceSha256 = sha256(await readFile(target.file));
    } catch {
      throw new Error(
        `Calibration must pass before production renders: ${id} has no readable calibration source file ` +
          `${target.file}. Run the calibration pre-checks first.`,
      );
    }
    for (const provider of MODEL_PROVIDERS) {
      const raw = await readJsonIfExists(
        resolveOutputPath(outputRoot, `calibration/${id}-${provider}.json`),
      );
      const item = record(raw);
      const verdict = typeof item?.verdict === 'string' ? item.verdict.toLowerCase() : undefined;
      const rawOutput = typeof item?.rawOutput === 'string' ? item.rawOutput : '';
      const refuse = (detail: string): never => {
        throw new Error(
          `Calibration must pass before production renders: ${id} (${provider}) needs verdict ${expected} ` +
            `with raw output, rubric ${PICTURE_RUBRIC_VERSION}, the current source file hash, and the current ` +
            `source text and prompt. ${detail}`,
        );
      };
      if (verdict !== expected || !rawOutput.length) {
        refuse('The verdict or raw output is missing or wrong. Run the calibration pre-checks first.');
      }
      if (item?.rubricVersion !== PICTURE_RUBRIC_VERSION) {
        refuse(`The log rubricVersion is ${JSON.stringify(item?.rubricVersion ?? null)}.`);
      }
      if (item?.fileSha256 !== sourceSha256) {
        refuse('The log fileSha256 does not match the calibration source file.');
      }
      if (item?.sourceText !== target.sourceText || item?.sourcePrompt !== target.sourcePrompt) {
        refuse('The log sourceText or sourcePrompt does not match the current calibration target.');
      }
    }
  }
}

/** The redaction limit of RB-04 and RB2-01: provider error text is cut to 500 characters. */
export const REDACTED_ERROR_MAX_CHARS = 500;
/** The `--raw` size limit of RB-04. */
const RAW_ANSWER_MAX_BYTES = 65_536;
/** The failure reason limit of RB-04 and RA3-02: 500 characters, whatever their UTF-8 size. */
const FAILURE_REASON_MAX_CHARS = 500;

/** The credential patterns of RB-04. A finding names the pattern; it never holds matched text. */
const CREDENTIAL_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: 'private-key-block',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  },
  { name: 'api-key-prefix', regex: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { name: 'bearer-token', regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi },
  { name: 'aws-access-key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'api-key-assignment', regex: /\bapi[_-]?key\s*=\s*[A-Za-z0-9._~+/=-]{8,}/gi },
  { name: 'jwt-token', regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
];

const ENV_SECRET_SUFFIX = /(KEY|TOKEN|SECRET|PASSWORD)$/;

/** The environment rules of RB-04: the exact value of every KEY, TOKEN, SECRET, or PASSWORD variable. */
function envCredentialPatterns(env: NodeJS.ProcessEnv): Array<{ name: string; regex: RegExp }> {
  const rules: Array<{ name: string; regex: RegExp }> = [];
  for (const [name, value] of Object.entries(env)) {
    if (!name || !ENV_SECRET_SUFFIX.test(name)) continue;
    if (typeof value !== 'string' || value.length < 8) continue;
    rules.push({ name: `env:${name}`, regex: new RegExp(escapeRegExp(value), 'g') });
  }
  return rules;
}

/** The credential pattern names that match the text (RB-04). A name never holds matched text. */
export function secretFindings(text: string, env: NodeJS.ProcessEnv = process.env): string[] {
  const findings: string[] = [];
  for (const rule of credentialRules(env)) {
    rule.regex.lastIndex = 0;
    if (rule.regex.test(text)) findings.push(rule.name);
  }
  return findings;
}

function credentialRules(env: NodeJS.ProcessEnv): Array<{ name: string; regex: RegExp }> {
  return [...CREDENTIAL_PATTERNS, ...envCredentialPatterns(env)].map((rule) => ({
    ...rule,
    name: rule.name.length > 32 ? `${rule.name.slice(0, 32)}…` : rule.name,
  }));
}

/** The text with every credential match replaced by `[redacted:<pattern>]` (RB-04). */
export function redactSecrets(text: string, env: NodeJS.ProcessEnv = process.env): string {
  let redacted = text;
  for (const rule of [...CREDENTIAL_PATTERNS, ...envCredentialPatterns(env)]) {
    rule.regex.lastIndex = 0;
    redacted = redacted.replace(rule.regex, `[redacted:${rule.name}]`);
  }
  return redacted;
}

/**
 * Reads a Kimi raw answer with the `--raw` limits of RB-04: an existing regular file (no
 * symbolic link), at most 65,536 bytes, valid UTF-8, and no NUL byte. A safe answer returns
 * byte for byte, with no trim and no line-end change.
 */
export async function readRawAnswer(file: string): Promise<string> {
  const info = await lstat(file).catch(() => undefined);
  if (!info || info.isSymbolicLink() || !info.isFile()) {
    throw new Error(
      `The raw answer must be an existing regular file, not a symbolic link or directory: ${file}`,
    );
  }
  const bytes = await readFile(file);
  if (bytes.byteLength > RAW_ANSWER_MAX_BYTES) {
    throw new Error(
      `The raw answer is ${bytes.byteLength} bytes; the limit is ${RAW_ANSWER_MAX_BYTES} bytes.`,
    );
  }
  if (bytes.includes(0)) throw new Error('The raw answer contains a NUL byte; it is refused.');
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
}

/**
 * One exclusive output write (RB-03): the path resolves through `resolveOutputPath`, and the
 * file is created with flag `wx`, so an existing file or file symbolic link is never followed
 * or overwritten.
 */
export async function writeOutputFile(
  outputRoot: string,
  relativeFile: string,
  bytes: Buffer | string,
): Promise<void> {
  const file = resolveOutputPath(outputRoot, relativeFile);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes, { encoding: 'utf8', flag: 'wx' });
}

export async function runPaidCall<T>(options: {
  paid: boolean;
  dryRun: boolean;
  details: PaidCallDetails;
  call: (callId: string) => Promise<T>;
  appendLedger: (entry: LedgerEntry) => void | Promise<void>;
  now?: () => Date;
  newCallId?: () => string;
}): Promise<T | undefined> {
  if (!options.paid && !options.dryRun) {
    throw new Error('Provider execution requires --paid. Use --dry-run to inspect the call.');
  }
  if (options.dryRun) return undefined;
  const callId = options.newCallId?.() ?? randomUUID();
  const now = options.now ?? (() => new Date());
  await options.appendLedger({
    ...options.details,
    event: 'before-call',
    callId,
    recordedAt: now().toISOString(),
  });
  try {
    const result = await options.call(callId);
    await options.appendLedger({
      ...options.details,
      event: 'after-call',
      callId,
      recordedAt: now().toISOString(),
      status: 'success',
    });
    return result;
  } catch (error) {
    await options.appendLedger({
      ...options.details,
      event: 'after-call',
      callId,
      recordedAt: now().toISOString(),
      status: 'failure',
      // RB-04: provider error text is redacted and cut to 500 characters before persistence.
      error: redactSecrets(errorText(error)).slice(0, REDACTED_ERROR_MAX_CHARS),
    });
    // RB2-01: the propagated error follows the ledger redaction and length limit, so a
    // provider credential never reaches a caller message or the final CLI error log.
    const sanitized = redactSecrets(errorText(error)).slice(0, REDACTED_ERROR_MAX_CHARS);
    throw new Error(sanitized.length > 0 ? sanitized : 'The provider call failed; the error text is redacted.');
  }
}

export function runProviderProcess(command: string, args: string[]): Promise<ProviderResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill('SIGTERM'), 300_000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with ${code}: ${(stderr || stdout).trim()}`));
    });
  });
}

export function parseModelReview(rawOutput: string): {
  verdict: ReviewVerdict;
  reason: string;
  observedCounts: Record<string, number>;
  issues: string[];
} {
  const unclear = {
    verdict: 'fail' as const,
    reason: 'Unclear model output is not a pass.',
    observedCounts: {},
    issues: ['The model output did not match the review contract.'],
  };
  for (const value of jsonObjects(rawOutput).reverse()) {
    const item = record(value);
    if (!item) continue;
    if (typeof item.verdict === 'string') {
      const verdict = item.verdict.toUpperCase();
      if (verdict === 'FAIL') {
        const counts = CountsSchema.safeParse(item.observedCounts);
        return {
          verdict: 'fail',
          reason: typeof item.reason === 'string' && item.reason ? item.reason : 'The model reported FAIL.',
          observedCounts: counts.success ? counts.data : {},
          issues: Array.isArray(item.issues)
            ? item.issues.filter((issue): issue is string => typeof issue === 'string')
            : [],
        };
      }
      if (verdict !== 'PASS' || /\bFAIL\b/i.test(rawOutput)) return unclear;
      const counts = CountsSchema.safeParse(item.observedCounts);
      if (
        typeof item.reason !== 'string' ||
        !item.reason ||
        !counts.success ||
        !Array.isArray(item.issues) ||
        item.issues.some((issue) => typeof issue !== 'string')
      ) {
        return unclear;
      }
      return {
        verdict: 'pass',
        reason: item.reason,
        observedCounts: counts.data,
        issues: item.issues as string[],
      };
    }
    const base = record(item.base_resp);
    if (typeof item.content === 'string' && base) {
      const statusCode = base.status_code;
      if (typeof statusCode === 'number' && statusCode !== 0) {
        return { ...unclear, reason: `The provider reported status ${statusCode}.` };
      }
      return parseModelReview(item.content);
    }
  }
  return unclear;
}

/**
 * RB4-01 and task 12: the credential findings across the raw answer text and every decoded
 * quote segment of the provider answer, before schema parsing, selection, status fallback,
 * or any write. One shared walker covers both providers, and one rule builder serves the raw
 * scan and the decoded scan; both read the environment at call time (RC6-2). The raw text is
 * a candidate, so a credential in prose without a quote is found there. Each text splits at
 * every unescaped double quote into the head, every segment between two consecutive
 * unescaped quotes, and the tail; the tail may end in a lone backslash. Every decoded
 * segment is a candidate. A decoded segment that holds a quote is split and decoded again as
 * the next layer; a decoded segment without a quote is a candidate only and is not decoded
 * again. The tolerant decoder resolves each valid JSON escape, including `\uXXXX` and
 * surrogate pairs, and keeps each invalid escape, each lone backslash, and each raw control
 * character as literal text. It never drops a segment and never throws. The scan needs no
 * valid JSON, so a malformed, truncated, duplicated, or fenced text yields the same
 * candidates as a valid text. Each layer is linear in its length, and no path decodes a
 * whole layer text without segment boundaries. RC5-1: an explicit worklist replaces
 * call-stack recursion, so a hostile depth returns findings or a safe empty result and never
 * raises `RangeError`. `JSON.parse` stays for the review schema only. Every finding names a
 * pattern; no finding holds matched text.
 */
export function decodedAnswerFindings(rawOutput: string): string[] {
  const findings: string[] = [];
  const rules = credentialRules(process.env);
  const seen = new Set<string>();
  const scan = (text: string): void => {
    if (seen.has(text)) return;
    seen.add(text);
    for (const rule of rules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(text)) findings.push(rule.name);
    }
  };
  const layers = [rawOutput];
  while (layers.length > 0) {
    const text = layers.pop()!;
    scan(text);
    // Split at every unescaped double quote. The backslash flag toggles per character, so
    // `\\"` keeps the quote unescaped and a lone trailing backslash stays inside the tail.
    let start = 0;
    let escaped = false;
    for (let index = 0; index <= text.length; index += 1) {
      const character = text[index];
      if (index < text.length) {
        if (escaped) { escaped = false; continue; }
        if (character === '\\') { escaped = true; continue; }
        if (character !== '"') continue;
      }
      const segment = text.slice(start, index);
      start = index + 1;
      const decoded = tolerantDecode(segment);
      if (decoded === segment) continue;
      if (decoded.includes('"')) layers.push(decoded);
      else scan(decoded);
    }
  }
  return findings;
}

const UNICODE_HEX = /^[0-9a-fA-F]{4}$/;

/**
 * The tolerant JSON string decoder of task 12. It resolves each valid JSON escape, including
 * `\uXXXX` and surrogate pairs. It keeps each invalid escape sequence, each lone backslash,
 * and each raw control character as literal text. It never drops a segment and never throws.
 */
function tolerantDecode(segment: string): string {
  if (!segment.includes('\\')) return segment;
  const parts: string[] = [];
  let index = 0;
  while (index < segment.length) {
    const character = segment[index]!;
    if (character !== '\\') {
      parts.push(character);
      index += 1;
      continue;
    }
    const next = segment[index + 1];
    if (next === 'u') {
      const hex = segment.slice(index + 2, index + 6);
      if (UNICODE_HEX.test(hex)) {
        let code = Number.parseInt(hex, 16);
        index += 6;
        // A high surrogate joins a following `\uXXXX` low surrogate into one code point.
        if (code >= 0xd800 && code <= 0xdbff && segment[index] === '\\' && segment[index + 1] === 'u') {
          const lowHex = segment.slice(index + 2, index + 6);
          const low = UNICODE_HEX.test(lowHex) ? Number.parseInt(lowHex, 16) : -1;
          if (low >= 0xdc00 && low <= 0xdfff) {
            code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
            index += 6;
          }
        }
        parts.push(String.fromCodePoint(code));
      } else {
        // An invalid `\u` escape stays as literal text.
        parts.push('\\');
        index += 1;
      }
      continue;
    }
    if (next === undefined) {
      // A lone trailing backslash stays as literal text.
      parts.push('\\');
      break;
    }
    switch (next) {
      case '"': parts.push('"'); index += 2; continue;
      case '\\': parts.push('\\'); index += 2; continue;
      case '/': parts.push('/'); index += 2; continue;
      case 'b': parts.push('\b'); index += 2; continue;
      case 'f': parts.push('\f'); index += 2; continue;
      case 'n': parts.push('\n'); index += 2; continue;
      case 'r': parts.push('\r'); index += 2; continue;
      case 't': parts.push('\t'); index += 2; continue;
      default:
        // An invalid escape stays as literal text, so `\q` keeps both characters.
        parts.push('\\');
        index += 1;
        continue;
    }
  }
  return parts.join('');
}

async function rawPixels(png: Buffer): Promise<{ data: Buffer; width: number; height: number; channels: number }> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function whiteCornersOnRaw(data: Buffer, width: number, height: number): boolean {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  return points.every(([x, y]) => {
    const index = (y! * width + x!) * 3;
    return data[index]! >= 250 && data[index + 1]! >= 250 && data[index + 2]! >= 250;
  });
}

async function hasWhiteCorners(png: Buffer, width: number, height: number): Promise<boolean> {
  const { data, channels } = await rawPixels(png);
  if (channels !== 3) return false;
  return whiteCornersOnRaw(data, width, height);
}

/**
 * The share of top-region pixels that differ from the region's own dominant colour. The region is
 * the top 30 percent of the rows; a pixel differs when a channel is more than 32 from the modal mean.
 */
function calmTopStatsOnRaw(
  data: Buffer,
  width: number,
  height: number,
): { share: number; rows: number } | undefined {
  const regionHeight = Math.round(height * 0.3);
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let y = 0; y < regionHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      const r = data[index]!;
      const g = data[index + 1]!;
      const b = data[index + 2]!;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }
  let modal: { count: number; r: number; g: number; b: number } | undefined;
  for (const bucket of buckets.values()) if (!modal || bucket.count > modal.count) modal = bucket;
  if (!modal) return undefined;
  const mean = [modal.r / modal.count, modal.g / modal.count, modal.b / modal.count];
  let focal = 0;
  let total = 0;
  for (let y = 0; y < regionHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      const spread = Math.max(
        Math.abs(data[index]! - mean[0]!),
        Math.abs(data[index + 1]! - mean[1]!),
        Math.abs(data[index + 2]! - mean[2]!),
      );
      if (spread > 32) focal += 1;
      total += 1;
    }
  }
  return { share: focal / total, rows: regionHeight };
}

/** A calm top region differs from its own dominant colour on at most two percent of its pixels. */
function calmTopOnRaw(data: Buffer, width: number, height: number): boolean {
  const stats = calmTopStatsOnRaw(data, width, height);
  return stats !== undefined && stats.share <= 0.02;
}

/** Gate C1: the calm-top report of a cover print file (the top 30 percent of its rows). */
export async function coverCalmTopReport(
  printPath: string,
): Promise<{ share: number; rows: number; ok: boolean }> {
  const { data, width, height, channels } = await rawPixels(await readFile(printPath));
  if (channels !== 3) throw new Error(`The cover print must have 3 channels, found ${channels}: ${printPath}`);
  const stats = calmTopStatsOnRaw(data, width, height);
  if (!stats) throw new Error(`The cover print has no top region: ${printPath}`);
  return { share: stats.share, rows: stats.rows, ok: stats.share <= 0.02 };
}

async function hasCalmTopRegion(png: Buffer, width: number, height: number): Promise<boolean> {
  const { data, channels } = await rawPixels(png);
  if (channels !== 3) return false;
  return calmTopOnRaw(data, width, height);
}

async function inspectPng(
  png: Buffer,
  expected: { width: number; height: number },
  checks: { smallCorners?: boolean; calmTop?: boolean; accept?: Array<{ width: number; height: number }> },
): Promise<PictureStructuralCheck> {
  const fileSha256 = sha256(png);
  try {
    const image = sharp(png);
    const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);
    const errors: string[] = [];
    if (metadata.format !== 'png') errors.push('Candidate must be a PNG file.');
    const accepted = [expected, ...(checks.accept ?? [])];
    const dimensionsAccepted = accepted.some(
      (size) => metadata.width === size.width && metadata.height === size.height,
    );
    if (!dimensionsAccepted) {
      errors.push(`Candidate must be ${expected.width} x ${expected.height} pixels.`);
    }
    if (metadata.channels !== 3 || metadata.hasAlpha || !stats.isOpaque) {
      errors.push('Candidate must be opaque RGB with no alpha channel.');
    }
    if (metadata.isPalette) errors.push('Candidate must use RGB pixels, not a colour palette.');
    if (metadata.space !== 'srgb') errors.push('Candidate must use the sRGB colour space.');
    if (
      metadata.depth !== 'uchar' ||
      (metadata.bitsPerSample !== undefined && metadata.bitsPerSample !== 8)
    ) {
      errors.push('Candidate must use 8-bit uchar channels.');
    }
    if (stats.entropy <= 0) errors.push('Candidate must be non-empty.');
    if (
      checks.smallCorners &&
      dimensionsAccepted &&
      metadata.width &&
      metadata.height &&
      metadata.channels === 3 &&
      !(await hasWhiteCorners(png, metadata.width, metadata.height))
    ) {
      errors.push('Small picture background corners must be white.');
    }
    if (
      checks.calmTop &&
      dimensionsAccepted &&
      metadata.width &&
      metadata.height &&
      metadata.channels === 3 &&
      !(await hasCalmTopRegion(png, metadata.width, metadata.height))
    ) {
      errors.push('Cover top 30 percent must stay calm for the title.');
    }
    return {
      valid: errors.length === 0,
      width: metadata.width,
      height: metadata.height,
      sha256: fileSha256,
      errors,
    };
  } catch (error) {
    return { valid: false, sha256: fileSha256, errors: [`Invalid PNG: ${errorText(error)}`] };
  }
}

export async function inspectCandidatePng(png: Buffer, size: PictureSize): Promise<PictureStructuralCheck> {
  const expected = PICTURE_SIZES[size];
  const legacy = LEGACY_PICTURE_SIZES[size];
  return inspectPng(png, expected, {
    ...(size === 'small' ? { smallCorners: true } : {}),
    ...(size === 'cover' ? { calmTop: true } : {}),
    ...(legacy && (legacy.width !== expected.width || legacy.height !== expected.height)
      ? { accept: [legacy] }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// Picture list v3 and specification v1 rows (Phase 3)
// ---------------------------------------------------------------------------

/** The Workbooks file-name pattern of one picture row color file. */
export const PICTURE_ROW_FILE_NAME_PATTERN = /^l2-w\d{2}-[a-z-]+-v\d+\.png$/;
const PICTURE_LIST_FILE_NAME = 'pictures.json';
const PICTURE_SIZE_CLASS_KEY: Record<string, PictureSize | undefined> = {
  A: 'story',
  B: 'cover',
  C: 'small',
};

/** One row of the Workbooks picture list. The rows keep every field of the list. */
export interface PictureListRow {
  id: string;
  week: number;
  use: string;
  sizeClass: 'A' | 'B' | 'C';
  fileName: string;
  lineArtFileName: string;
  width: number;
  height: number;
  /** The page text and the scene prompt of the row (the list keeps every field). */
  text?: string;
  prompt?: string;
}

export interface PictureList {
  /** The absolute path of the list file that the rows came from. */
  file: string;
  /** The SHA-256 of the list file bytes. */
  sha256: string;
  rows: PictureListRow[];
}

export interface PictureListOptions {
  printRoot: string;
  workbooksRoot: string;
  /** Refuse the list when its SHA-256 differs from this recorded value. */
  expectedSha256?: string;
}

const PictureListRowSchema = z
  .object({
    id: z.string().min(1),
    week: z.number().int().positive(),
    use: z.string().min(1),
    sizeClass: z.enum(['A', 'B', 'C']),
    fileName: z.string().regex(PICTURE_ROW_FILE_NAME_PATTERN),
    lineArtFileName: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .passthrough();

function parsePictureListRow(value: unknown): PictureListRow {
  const parsed = PictureListRowSchema.safeParse(value);
  if (parsed.success) return parsed.data as PictureListRow;
  const id = typeof (value as { id?: unknown })?.id === 'string' ? (value as { id: string }).id : 'unknown';
  const issue = parsed.error.issues[0];
  const where = issue ? issue.path.join('.') : 'row';
  throw new Error(`The picture list row ${id} is invalid at ${where}: ${issue?.message ?? 'invalid row'}.`);
}

/**
 * Reads the Workbooks picture list read-only. The function never writes under the Workbooks
 * tree. It records the SHA-256 of the list file and refuses a broken file name or a changed
 * list file.
 */
export function loadPictureList(options: PictureListOptions): PictureList {
  const file = path.join(path.resolve(options.printRoot), PICTURE_LIST_FILE_NAME);
  const bytes = readFileSync(file);
  const sha256Value = sha256(bytes);
  if (options.expectedSha256 !== undefined && options.expectedSha256 !== sha256Value) {
    throw new Error(
      `The picture list changed: expected SHA-256 ${options.expectedSha256}, measured ${sha256Value}.`,
    );
  }
  const parsed: unknown = JSON.parse(bytes.toString('utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`The picture list ${file} must be a JSON array of rows.`);
  }
  return { file, sha256: sha256Value, rows: parsed.map(parsePictureListRow) };
}

/** The output plan of one picture list row: the two file names and the class pixel size. */
export interface PictureRowPlan {
  colorFile: string;
  lineArtFile: string;
  width: number;
  height: number;
}

/**
 * Plans one row of the picture list. The file names come from the list; the pipeline derives no
 * slug. Every row gets a line-art twin, including cover, check-row, and practice-line rows.
 */
export function planPictureRow(row: PictureListRow): PictureRowPlan {
  if (!PICTURE_ROW_FILE_NAME_PATTERN.test(row.fileName)) {
    throw new Error(
      `The picture row ${row.id} has a file name that breaks the pattern ` +
        `${PICTURE_ROW_FILE_NAME_PATTERN.source}: ${row.fileName}`,
    );
  }
  if (typeof row.lineArtFileName !== 'string' || row.lineArtFileName.length === 0) {
    throw new Error(`The picture row ${row.id} has no line-art file name; every row needs a twin.`);
  }
  const sizeKey = PICTURE_SIZE_CLASS_KEY[row.sizeClass];
  const size = sizeKey ? PICTURE_SIZES[sizeKey] : undefined;
  if (!size) {
    throw new Error(`The picture row ${row.id} has an unknown size class: ${String(row.sizeClass)}.`);
  }
  return { colorFile: row.fileName, lineArtFile: row.lineArtFileName, width: size.width, height: size.height };
}

export interface PictureRowCheck {
  valid: boolean;
  errors: string[];
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

interface DecodedPngRgb {
  width: number;
  height: number;
  /** One opaque RGB triple per pixel. */
  data: Buffer;
}

/**
 * Decodes a PNG to opaque RGB without sharp, so the row check stays synchronous. Supports the
 * 8-bit non-interlaced color types 0, 2, 3, 4, and 6; alpha flattens over white.
 */
function decodePngRgbSync(png: Buffer): DecodedPngRgb {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (png.length < 33 || !png.subarray(0, 8).equals(signature)) {
    throw new Error('The file is not a PNG file.');
  }
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const palette: Buffer[] = [];
  const idat: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const data = png.subarray(dataStart, dataStart + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8]!;
      colorType = data[9]!;
      interlace = data[12]!;
    } else if (type === 'PLTE') {
      for (let index = 0; index + 2 < length + 1; index += 3) {
        palette.push(data.subarray(index, index + 3));
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset = dataStart + length + 4;
  }
  if (bitDepth !== 8 || interlace !== 0) {
    throw new Error('The PNG encoding is not 8-bit non-interlaced.');
  }
  const channels =
    colorType === 0 || colorType === 3 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 6 ? 4 : 0;
  if (!channels || !width || !height) {
    throw new Error(`The PNG color type ${colorType} is not supported.`);
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (raw.length < (stride + 1) * height) {
    throw new Error('The PNG pixel data is truncated.');
  }
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]!;
    const rowStart = y * stride;
    const source = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[source + x]!;
      const left = x >= channels ? pixels[rowStart + x - channels]! : 0;
      const up = y > 0 ? pixels[rowStart - stride + x]! : 0;
      const upLeft = y > 0 && x >= channels ? pixels[rowStart - stride + x - channels]! : 0;
      let decoded: number;
      switch (filter) {
        case 0: decoded = value; break;
        case 1: decoded = value + left; break;
        case 2: decoded = value + up; break;
        case 3: decoded = value + ((left + up) >> 1); break;
        case 4: decoded = value + paethPredictor(left, up, upLeft); break;
        default: throw new Error(`Unknown PNG row filter: ${filter}.`);
      }
      pixels[rowStart + x] = decoded & 0xff;
    }
  }
  const rgb = Buffer.alloc(width * height * 3);
  for (let index = 0; index < width * height; index += 1) {
    let red: number;
    let green: number;
    let blue: number;
    if (colorType === 0) {
      red = green = blue = pixels[index]!;
    } else if (colorType === 4) {
      const grey = pixels[index * 2]!;
      const alpha = pixels[index * 2 + 1]! / 255;
      red = green = blue = Math.round(grey * alpha + 255 * (1 - alpha));
    } else if (colorType === 3) {
      const color = palette[pixels[index]!];
      if (!color) throw new Error('The PNG palette index is out of range.');
      red = color[0]!;
      green = color[1]!;
      blue = color[2]!;
    } else {
      red = pixels[index * 3]!;
      green = pixels[index * 3 + 1]!;
      blue = pixels[index * 3 + 2]!;
      if (colorType === 6) {
        const alpha = pixels[index * 3 + 3]! / 255;
        const keep = alpha;
        const background = 255 * (1 - alpha);
        red = Math.round(red * keep + background);
        green = Math.round(green * keep + background);
        blue = Math.round(blue * keep + background);
      }
    }
    rgb[index * 3] = red;
    rgb[index * 3 + 1] = green;
    rgb[index * 3 + 2] = blue;
  }
  return { width, height, data: rgb };
}

/**
 * The size class checks of one picture list row (synchronous seam). A class B row runs the calm
 * top 30 percent check. A class C row runs the white-corner check. Every row checks the class
 * pixel size of specification v1.
 */
export function inspectPictureRow(png: Buffer, row: PictureListRow): PictureRowCheck {
  const sizeKey = PICTURE_SIZE_CLASS_KEY[row.sizeClass];
  const expected = sizeKey ? PICTURE_SIZES[sizeKey] : undefined;
  if (!expected) {
    return { valid: false, errors: [`Unknown size class: ${String(row.sizeClass)}.`] };
  }
  let image: DecodedPngRgb;
  try {
    image = decodePngRgbSync(png);
  } catch (error) {
    return { valid: false, errors: [`Invalid PNG: ${errorText(error)}`] };
  }
  const errors: string[] = [];
  if (image.width !== expected.width || image.height !== expected.height) {
    errors.push(`The row picture must be ${expected.width} x ${expected.height} pixels.`);
  }
  if (row.sizeClass === 'C' && !whiteCornersOnRaw(image.data, image.width, image.height)) {
    errors.push('Class C picture background corners must be white.');
  }
  if (row.sizeClass === 'B' && !calmTopOnRaw(image.data, image.width, image.height)) {
    errors.push('Class B cover top 30 percent must stay calm for the title.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * The interim line-art format checks (contract "Line-art twins (provisional format)"):
 * one opaque 8-bit grey channel, exactly 0 and 255 pixel values, a white background,
 * an edge frame at least 90 percent white, and 0.5 to 25 percent ink coverage.
 */
export async function inspectLineArtPng(
  png: Buffer,
  expected: { width: number; height: number },
  options: { accept?: Array<{ width: number; height: number }>; minLineWidth?: number } = {},
): Promise<PictureStructuralCheck> {
  const minLineWidth = options.minLineWidth ?? MIN_LINE_ART_LINE_WIDTH_PX;
  const fileSha256 = sha256(png);
  try {
    const metadata = await sharp(png).metadata();
    const errors: string[] = [];
    if (metadata.format !== 'png') errors.push('Line-art twin must be a PNG file.');
    const dimensionsAccepted =
      (metadata.width === expected.width && metadata.height === expected.height) ||
      (options.accept ?? []).some((size) => metadata.width === size.width && metadata.height === size.height);
    if (!dimensionsAccepted) {
      errors.push(`Line-art twin must match its color twin at ${expected.width} x ${expected.height} pixels.`);
    }
    if (metadata.channels !== 1 || metadata.hasAlpha) {
      errors.push('Line-art twin must use one opaque 8-bit grey channel with no alpha.');
    }
    if (
      metadata.depth !== 'uchar' ||
      (metadata.bitsPerSample !== undefined && metadata.bitsPerSample !== 8)
    ) {
      errors.push('Line-art twin must use 8-bit uchar pixels.');
    }
    // The pixel analysis runs for every decodable PNG, so the measured width prints even when a
    // channel or size error already fails the file. sharp expands a grey PNG to three raw
    // channels, so force the b-w output space: one channel, with 0 and 255 preserved.
    if (metadata.width && metadata.height) {
      const { data, info } = await sharp(png).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
      if (info.channels !== 1) {
        errors.push('Line-art twin must decode to one grey channel.');
      } else {
        const width = metadata.width;
        const height = metadata.height;
        const total = width * height;
        let black = 0;
        let white = 0;
        let grey = 0;
        for (let index = 0; index < total; index += 1) {
          const value = data[index]!;
          if (value === 0) black += 1;
          else if (value === 255) white += 1;
          else grey += 1;
        }
        if (grey > 0) errors.push(`Line-art twin must use only 0 and 255 pixels; ${grey} grey pixels found.`);
        if (!(white > black)) errors.push('Line-art twin must be black lines on a white background.');
        const frameX = width * 0.02;
        const frameY = height * 0.02;
        let edgeTotal = 0;
        let edgeWhite = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (x >= frameX && x < width - frameX && y >= frameY && y < height - frameY) continue;
            edgeTotal += 1;
            if (data[y * width + x] === 255) edgeWhite += 1;
          }
        }
        if (edgeWhite / edgeTotal < 0.9) {
          errors.push('Line-art twin edge frame must be at least 90 percent white.');
        }
        // Specification v1: the closed black outlines are at least 12 px thick. The measured
        // stroke width is the median black-run length over both scan directions, so the
        // typical outline decides and one solid block cannot raise the measured width.
        const runLengths: number[] = [];
        for (let y = 0; y < height; y += 1) {
          let run = 0;
          for (let x = 0; x < width; x += 1) {
            if (data[y * width + x] === 0) run += 1;
            else {
              if (run > 0) runLengths.push(run);
              run = 0;
            }
          }
          if (run > 0) runLengths.push(run);
        }
        for (let x = 0; x < width; x += 1) {
          let run = 0;
          for (let y = 0; y < height; y += 1) {
            if (data[y * width + x] === 0) run += 1;
            else {
              if (run > 0) runLengths.push(run);
              run = 0;
            }
          }
          if (run > 0) runLengths.push(run);
        }
        runLengths.sort((a, b) => a - b);
        const measuredLineWidth = runLengths.length
          ? runLengths[Math.floor((runLengths.length - 1) / 2)]!
          : 0;
        console.log(
          `Line-art line width: ${measuredLineWidth} px (minimum ${MIN_LINE_ART_LINE_WIDTH_PX} px).`,
        );
        if (measuredLineWidth < minLineWidth) {
          errors.push(
            `Line-art twin lines must be at least ${MIN_LINE_ART_LINE_WIDTH_PX} px thick; measured ${measuredLineWidth} px.`,
          );
        }
        const share = (black / total) * 100;
        console.log(`Line-art ink coverage: ${share.toFixed(2)}% (${black} of ${total} pixels black).`);
        if (black / total < 0.005 || black / total > 0.25) {
          errors.push(
            `Line-art ink coverage must be 0.5 to 25 percent; measured ${share.toFixed(2)}%.`,
          );
        }
      }
    }
    return {
      valid: errors.length === 0,
      width: metadata.width,
      height: metadata.height,
      sha256: fileSha256,
      errors,
    };
  } catch (error) {
    return { valid: false, sha256: fileSha256, errors: [`Invalid line-art PNG: ${errorText(error)}`] };
  }
}

export function calmTopRegion(size: PictureSize): { left: 0; top: 0; width: number; height: number } {
  if (size !== 'cover') throw new Error('The calm title region applies only to covers.');
  return {
    left: 0,
    top: 0,
    width: PICTURE_SIZES.cover.width,
    height: Math.round(PICTURE_SIZES.cover.height * 0.3),
  };
}

export function contactThumbnail(size: PictureSize): {
  width: number;
  height: number;
  fit: 'contain';
  background: '#ffffff';
} {
  if (!PICTURE_SIZES[size]) throw new Error(`Unknown picture size: ${size}`);
  return { width: 320, height: 240, fit: 'contain', background: '#ffffff' };
}

function commonReviewErrors(
  review: ModelReview | PersonReview,
  job: StorytimeJob,
  version: number,
  file: string,
  structural: PictureStructuralCheck,
  hashRequired: boolean,
): string[] {
  const errors: string[] = [];
  if (review.jobId !== job.id) errors.push('job ID does not match');
  if (review.version !== version) errors.push('version does not match');
  if (review.file !== file) errors.push('file does not match');
  if (review.sourceText !== job.text) errors.push('source text does not match');
  if (review.sourcePrompt !== undefined && review.sourcePrompt !== job.sourcePrompt) {
    errors.push('source prompt does not match');
  }
  if ((hashRequired || review.fileSha256 !== undefined) && review.fileSha256 !== structural.sha256) {
    errors.push('file SHA-256 does not match');
  }
  return errors;
}

function modelReviewErrors(
  review: ModelReview,
  provider: ModelProvider,
  job: StorytimeJob,
  version: number,
  file: string,
  structural: PictureStructuralCheck,
): string[] {
  const errors = commonReviewErrors(review, job, version, file, structural, true);
  if (review.provider !== provider) errors.push('provider does not match');
  if (review.rubricVersion !== PICTURE_RUBRIC_VERSION) errors.push('rubric version does not match');
  if (review.verdict === 'fail') errors.push(review.reason || 'model verdict is FAIL');
  if (review.verdict === 'pass' && review.issues.length) errors.push('PASS review lists issues');
  if (review.verdict === 'pass' && Object.keys(review.observedCounts).length === 0) {
    errors.push('PASS review has no observed counts');
  }
  return errors;
}

function renderEvidenceErrors(
  review: RenderEvidence,
  job: StorytimeJob,
  version: number,
  file: string,
  stage: StageReference | undefined,
): string[] {
  const errors: string[] = [];
  if (review.renderer !== RENDERER_ID) errors.push('renderer does not match');
  if (review.jobId !== job.id) errors.push('job ID does not match');
  if (review.version !== version) errors.push('version does not match');
  if (review.file !== file) errors.push('file does not match');
  if (review.warnings.length) errors.push('render warnings are not empty');
  if (!stage) {
    errors.push('stage source is missing');
    return errors;
  }
  if (review.stageFile !== stage.file) errors.push('stage file does not match');
  if (review.stageSha256 !== stage.sha256) errors.push('stage hash does not match');
  if (review.at !== stage.at) errors.push('still time does not match');
  return errors;
}

export async function evaluateCandidate(options: {
  job: StorytimeJob;
  version: number;
  file: string;
  png?: Buffer;
  stage?: StageReference;
  stageError?: string;
  render?: unknown;
  reviews: CandidateReviewsInput;
}): Promise<CandidateManifest> {
  assertVersion(options.version);
  const structural = options.png
    ? await inspectCandidatePng(options.png, options.job.size)
    : { valid: false, errors: ['Missing PNG file.'] };
  const failures = structural.errors.map((error) => `Structure: ${error}`);
  let failed = !structural.valid;
  if (options.stageError) {
    failures.push(`Stage source: ${options.stageError}`);
    failed = true;
  }
  let render: RenderEvidence | undefined;
  if (options.render === undefined) {
    failures.push('Missing local render evidence.');
  } else {
    const parsed = RenderEvidenceSchema.safeParse(options.render);
    if (!parsed.success) {
      failures.push(`Invalid render evidence: ${parsed.error.issues[0]?.message ?? 'invalid log'}`);
      failed = true;
    } else {
      render = parsed.data as RenderEvidence;
      const errors = renderEvidenceErrors(render, options.job, options.version, options.file, options.stage);
      if (errors.length) failed = true;
      failures.push(...errors.map((error) => `Render evidence: ${error}`));
    }
  }
  const reviews: CandidateReviews = {};
  for (const provider of MODEL_PROVIDERS) {
    const raw = options.reviews[provider];
    if (raw === undefined) {
      failures.push(`Missing ${provider === 'minimax' ? 'MiniMax' : 'Kimi'} model pre-check.`);
      continue;
    }
    const parsed = ModelReviewSchema.safeParse(raw);
    if (!parsed.success) {
      failures.push(
        `Invalid ${provider} model pre-check: ${parsed.error.issues[0]?.message ?? 'invalid log'}`,
      );
      failed = true;
      continue;
    }
    const review = parsed.data;
    reviews[provider] = review;
    const errors = modelReviewErrors(
      review,
      provider,
      options.job,
      options.version,
      options.file,
      structural,
    );
    if (errors.length) failed = true;
    failures.push(...errors.map((error) => `${provider} model pre-check: ${error}`));
  }
  if (options.reviews.person === undefined) {
    failures.push('Missing passing person count.');
  } else {
    const parsed = PersonReviewSchema.safeParse(options.reviews.person);
    if (!parsed.success) {
      failures.push(`Invalid person count: ${parsed.error.issues[0]?.message ?? 'invalid log'}`);
      failed = true;
    } else {
      const { fileSha256, kind, sourcePrompt, time, rubricVersion, ...personData } = parsed.data;
      const review: PersonReview = {
        ...personData,
        ...(kind === undefined ? {} : { kind }),
        ...(sourcePrompt === undefined ? {} : { sourcePrompt }),
        ...(time === undefined ? {} : { time }),
        ...(fileSha256 === undefined ? {} : { fileSha256 }),
        ...(rubricVersion === undefined ? {} : { rubricVersion }),
      };
      reviews.person = review;
      const errors = commonReviewErrors(
        review,
        options.job,
        options.version,
        options.file,
        structural,
        false,
      );
      if (review.verdict === 'fail') errors.push('person verdict is FAIL');
      if (review.rubricVersion !== undefined && review.rubricVersion !== PICTURE_RUBRIC_VERSION) {
        errors.push('rubric version does not match');
      }
      if (errors.length) failed = true;
      failures.push(...errors.map((error) => `Person count: ${error}`));
    }
  }
  return {
    jobId: options.job.id,
    version: options.version,
    file: options.file,
    ...(structural.sha256 ? { fileSha256: structural.sha256 } : {}),
    status: failed ? 'failed' : failures.length ? 'pending' : 'ready',
    structural,
    ...(render ? { render } : {}),
    reviews,
    failures,
  };
}

export function selectNewestReady(candidates: CandidateManifest[]): CandidateManifest | undefined {
  return [...candidates]
    .sort((a, b) => b.version - a.version)
    .find((candidate) => candidate.status === 'ready');
}

function canonicalBatchFiles(files: BatchFile[]): BatchFile[] {
  return [...files]
    .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
    .map((entry) => ({ file: entry.file, sha256: entry.sha256 }));
}

export function batchSha256(files: BatchFile[]): string {
  return sha256(JSON.stringify(canonicalBatchFiles(files)));
}

function selectedBatchFiles(jobs: ManifestJob[]): BatchFile[] {
  return jobs.flatMap((job) =>
    job.selectedFile && job.selectedSha256 ? [{ file: job.selectedFile, sha256: job.selectedSha256 }] : [],
  );
}

function selectedLineArtBatchFile(job: ManifestJob): BatchFile | undefined {
  const twin = [...job.candidates]
    .sort((a, b) => b.version - a.version)
    .find((candidate) => candidate.lineArt?.status === 'ready')?.lineArt;
  if (!twin || !twin.fileSha256) return undefined;
  return { file: twin.file, sha256: twin.fileSha256 };
}

export function assembleManifest(jobs: StorytimeJob[], candidates: CandidateManifest[]): StorytimeManifest {
  if (!jobs.length) throw new Error('A manifest needs at least one job; zero jobs is an empty manifest.');
  const manifestJobs: ManifestJob[] = jobs.map((job) => {
    const versions = candidates
      .filter((candidate) => candidate.jobId === job.id)
      .sort((a, b) => a.version - b.version);
    const selected = selectNewestReady(versions);
    const status = selected
      ? 'ready'
      : versions.some((candidate) => candidate.status === 'pending') || versions.length === 0
        ? 'pending'
        : 'failed';
    return {
      ...job,
      candidates: versions,
      selectedVersion: selected?.version ?? null,
      selectedFile: selected?.file ?? null,
      selectedSha256: selected?.fileSha256 ?? null,
      status,
    };
  });
  const directories = [...new Set(jobs.map((job) => job.directory))];
  const batches = directories.flatMap((directory) => {
    const directoryJobs = manifestJobs.filter((item) => item.directory === directory);
    const job = directoryJobs[0]!;
    const colorFiles = canonicalBatchFiles(selectedBatchFiles(directoryJobs));
    const lineFiles = canonicalBatchFiles(
      directoryJobs.flatMap((item) => {
        const file = selectedLineArtBatchFile(item);
        return file ? [file] : [];
      }),
    );
    return [
      {
        id: `${directory}/color`,
        week: job.week,
        bookKind: job.bookKind,
        outputKind: 'color' as const,
        files: colorFiles,
        sha256: batchSha256(colorFiles),
      },
      {
        id: `${directory}/lineart`,
        week: job.week,
        bookKind: job.bookKind,
        outputKind: 'lineart' as const,
        files: lineFiles,
        sha256: batchSha256(lineFiles),
      },
    ];
  });
  return { version: 1, batchHashAlgorithm: BATCH_HASH_ALGORITHM, jobs: manifestJobs, batches };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Release re-validates the selected reviews. A forged ready status cannot bypass the evidence. */
function selectedReviewErrors(job: StorytimeJob, candidate: CandidateManifest): string[] {
  const errors: string[] = [];
  const structuralSha = candidate.structural.sha256;
  for (const provider of MODEL_PROVIDERS) {
    const review = candidate.reviews[provider];
    if (!review) continue;
    if (!isRecord(review)) {
      errors.push(`${provider} model pre-check is not a record.`);
      continue;
    }
    if (review.jobId !== job.id || review.version !== candidate.version || review.file !== candidate.file) {
      errors.push(`${provider} model pre-check does not match the selected candidate.`);
    }
    if (review.verdict !== 'pass') errors.push(`${provider} model pre-check verdict is not pass.`);
    if (review.rubricVersion !== PICTURE_RUBRIC_VERSION) {
      errors.push(`${provider} model pre-check rubric version does not match.`);
    }
    if (structuralSha && review.fileSha256 !== structuralSha) {
      errors.push(`${provider} model pre-check file SHA-256 does not match.`);
    }
  }
  const person = candidate.reviews.person;
  if (person) {
    if (!isRecord(person)) {
      errors.push('Person count is not a record.');
    } else {
      if (person.jobId !== job.id || person.version !== candidate.version || person.file !== candidate.file) {
        errors.push('Person count does not match the selected candidate.');
      }
      if (person.verdict !== 'pass') errors.push('Person count verdict is not pass.');
      if (typeof person.checkedBy !== 'string' || !person.checkedBy) {
        errors.push('Person count has no named checkedBy.');
      }
      if (person.evidenceClass !== 'owner-passed' && person.evidenceClass !== 'person-checked') {
        errors.push('Person count evidence class is not a person class.');
      }
      if (person.rubricVersion !== undefined && person.rubricVersion !== PICTURE_RUBRIC_VERSION) {
        errors.push('Person count rubric version does not match.');
      }
      if (structuralSha && person.fileSha256 !== undefined && person.fileSha256 !== structuralSha) {
        errors.push('Person count file SHA-256 does not match.');
      }
    }
  }
  return errors;
}

function selectedLineArtFiles(jobs: ManifestJob[], directory: string): BatchFile[] {
  return canonicalBatchFiles(
    jobs
      .filter((item) => item.directory === directory)
      .flatMap((item) => {
        const file = selectedLineArtBatchFile(item);
        return file ? [file] : [];
      }),
  );
}

export function verifyManifest(
  manifest: StorytimeManifest,
  options: { release: boolean; week?: number; jobId?: string; output?: 'color' | 'lineart' },
): string[] {
  const jobs = manifest.jobs.filter(
    (job) =>
      (options.week === undefined || job.week === options.week) &&
      (!options.jobId || job.id === options.jobId),
  );
  const failures: string[] = [];
  if (!jobs.length) return ['No jobs matched the verification selection.'];
  const checkColor = options.output !== 'lineart';
  const checkLineArt = options.output !== 'color';
  for (const job of jobs) {
    for (const candidate of job.candidates) {
      if (candidate.file !== candidateRelativePath(job, candidate.version)) {
        failures.push(`${job.id} v${candidate.version}: candidate filename does not match its job.`);
      }
      if (candidate.fileSha256 !== candidate.structural.sha256) {
        failures.push(
          `${job.id} v${candidate.version}: candidate file hash does not match its structure record.`,
        );
      }
      failures.push(
        ...candidate.structural.errors.map(
          (error) => `${job.id} v${candidate.version}: structural check failed: ${error}`,
        ),
      );
      if (candidate.lineArt) {
        if (candidate.lineArt.file !== lineArtRelativePath(job, candidate.version)) {
          failures.push(`${job.id} v${candidate.version}: line-art filename does not match its job.`);
        }
        failures.push(
          ...candidate.lineArt.structural.errors.map(
            (error) => `${job.id} v${candidate.version}: line-art structural check failed: ${error}`,
          ),
        );
        if (candidate.lineArt.status === 'ready' && candidate.lineArt.errors.length) {
          failures.push(`${job.id} v${candidate.version}: line-art twin claims ready with errors.`);
        }
      }
    }
    if (!options.release) continue;
    const selected = job.candidates.find((candidate) => candidate.version === job.selectedVersion);
    if (!selected || selected.status !== 'ready') {
      const latest = job.candidates.at(-1);
      const reasons = latest?.failures.length ? latest.failures.join('; ') : 'No candidate PNG.';
      failures.push(`${job.id}: no ready release candidate; ${reasons}`);
      continue;
    }
    if (checkColor) {
      if (!selected.render) failures.push(`${job.id}: selected candidate lacks local render evidence.`);
      for (const provider of MODEL_PROVIDERS) {
        if (selected.reviews[provider]?.verdict !== 'pass') {
          failures.push(`${job.id}: selected candidate lacks a ${provider} model pass.`);
        }
      }
      if (
        selected.reviews.person?.verdict !== 'pass' ||
        Object.keys(selected.reviews.person.observedCounts).length === 0
      ) {
        failures.push(`${job.id}: selected candidate lacks a passing person count.`);
      }
      failures.push(...selectedReviewErrors(job, selected).map((error) => `${job.id}: ${error}`));
    }
    if (checkLineArt && isReaderJob(job)) {
      const lineArt = selected.lineArt;
      if (!lineArt || lineArt.status !== 'ready') {
        failures.push(
          `${job.id}: selected candidate lacks a ready line-art twin (status: ${lineArt?.status ?? 'missing'}).`,
        );
      }
    }
  }
  const directories = [...new Set(jobs.map((job) => job.directory))];
  for (const directory of directories) {
    const expectations: Array<['color' | 'lineart', BatchFile[]]> = [
      ['color', canonicalBatchFiles(selectedBatchFiles(manifest.jobs.filter((item) => item.directory === directory)))],
      ['lineart', selectedLineArtFiles(manifest.jobs, directory)],
    ];
    for (const [outputKind, expectedFiles] of expectations) {
      const id = `${directory}/${outputKind}`;
      const batch = manifest.batches.find((item) => item.id === id);
      if (!batch) {
        failures.push(`${id}: missing batch hash record.`);
        continue;
      }
      if (JSON.stringify(batch.files) !== JSON.stringify(expectedFiles)) {
        failures.push(`${id}: batch files do not match selected candidates.`);
      }
      if (batch.sha256 !== batchSha256(batch.files)) failures.push(`${id}: batch hash does not match.`);
    }
  }
  return failures;
}

async function readJsonIfExists(file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (missingFile(error)) return undefined;
    if (error instanceof SyntaxError) return { malformedJson: error.message };
    throw error;
  }
}

async function readBufferIfExists(file: string): Promise<Buffer | undefined> {
  try {
    return await readFile(file);
  } catch (error) {
    if (missingFile(error)) return undefined;
    throw error;
  }
}

async function directoryEntries(directory: string): Promise<string[]> {
  try {
    return await readdir(directory);
  } catch (error) {
    if (missingFile(error)) return [];
    throw error;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderEvidenceRelativePath(job: StorytimeJob, version: number): string {
  return `renders/${job.id}-v${version}.json`;
}

export async function discoverCandidateVersions(outputRoot: string, job: StorytimeJob): Promise<number[]> {
  const versions = new Set<number>();
  const candidatePattern = new RegExp(
    `^l2-w${padWeek(job.week)}-${escapeRegExp(job.use)}-${escapeRegExp(job.slug)}-v(\\d+)\\.png$`,
  );
  const lineArtPattern = new RegExp(
    `^l2-w${padWeek(job.week)}-${escapeRegExp(job.use)}-${escapeRegExp(job.slug)}-v(\\d+)-lineart\\.png$`,
  );
  for (const entry of await directoryEntries(resolveOutputPath(outputRoot, job.directory))) {
    const match = candidatePattern.exec(entry);
    if (match) versions.add(Number(match[1]));
  }
  for (const entry of await directoryEntries(resolveOutputPath(outputRoot, `${job.directory}/lineart`))) {
    const match = lineArtPattern.exec(entry);
    if (match) versions.add(Number(match[1]));
  }
  for (const [directory, pattern] of [
    ['reviews', new RegExp(`^${escapeRegExp(job.id)}-v(\\d+)-(minimax|kimi|person)\\.json$`)],
    ['reviews', new RegExp(`^${escapeRegExp(job.id)}-v(\\d+)-lineart-person\\.json$`)],
    ['renders', new RegExp(`^${escapeRegExp(job.id)}-v(\\d+)\\.json$`)],
  ] as const) {
    for (const entry of await directoryEntries(resolveOutputPath(outputRoot, directory))) {
      const match = pattern.exec(entry);
      if (match) versions.add(Number(match[1]));
    }
  }
  return [...versions].sort((a, b) => a - b);
}

interface LineArtTwinInput {
  job: StorytimeJob;
  version: number;
  colorFile: string;
  colorStatus: 'ready' | 'pending' | 'failed';
  colorStructural: PictureStructuralCheck;
  renderRaw: unknown;
  lineBytes: Buffer | undefined;
  linePersonRaw: unknown;
  styleRaw: unknown;
  /** false when a style look sample file is missing or its SHA-256 differs from the file bytes. */
  styleSampleFilesValid?: boolean;
  evidenceFile: string;
}

const LINE_ART_BINDING_FIELDS = [
  'camera',
  'colorFile',
  'colorSha256',
  'lineArtFile',
  'lineArtSha256',
  'lineArtFormatVersion',
  'lineArtTechnique',
  'width',
  'height',
] as const;

/**
 * One line-art twin record per job version. A ready twin needs the format checks, one binding
 * (one stage hash, one still time, one camera) that matches its color twin, a ready color twin,
 * a passing person look, and Daniel's passing style look with evidenceClass owner-passed.
 */
async function evaluateLineArtTwin(input: LineArtTwinInput): Promise<LineArtManifest> {
  const { job, version, colorFile, colorStatus, colorStructural, renderRaw, lineBytes } = input;
  const file = lineArtRelativePath(job, version);
  const raw = record(renderRaw);
  const hasBindingFields = raw !== undefined && LINE_ART_BINDING_FIELDS.every((key) => raw[key] !== undefined);
  if (!lineBytes) {
    return {
      file,
      colorFile,
      renderEvidenceFile: input.evidenceFile,
      status: 'pending',
      structural: { valid: false, errors: ['Missing line-art PNG file.'] },
      errors: [],
    };
  }
  const dimensions = {
    width: colorStructural.width ?? (typeof raw?.width === 'number' ? raw.width : 0),
    height: colorStructural.height ?? (typeof raw?.height === 'number' ? raw.height : 0),
  };
  const structural = await inspectLineArtPng(lineBytes, dimensions);
  const errors: string[] = [];
  let missingEvidence = false;
  if (!hasBindingFields || !raw) {
    // Missing twin binding fields are missing evidence, not a failed check.
    missingEvidence = true;
  } else {
    if (raw.lineArtFile !== file) errors.push('line-art file does not match the twin path');
    if (structural.sha256 && raw.lineArtSha256 !== structural.sha256) {
      errors.push('line-art SHA-256 does not match the twin file');
    }
    if (raw.colorFile !== colorFile) errors.push('color file does not match the twin path');
    if (colorStructural.sha256 && raw.colorSha256 !== colorStructural.sha256) {
      errors.push('color SHA-256 does not match the twin file');
    }
    if (raw.lineArtStageSha256 !== undefined && raw.lineArtStageSha256 !== raw.stageSha256) {
      errors.push('competing line-art stage hash');
    }
    if (raw.lineArtAt !== undefined && raw.lineArtAt !== raw.at) {
      errors.push('competing line-art still time');
    }
    if (
      raw.lineArtCamera !== undefined &&
      JSON.stringify(raw.lineArtCamera) !== JSON.stringify(raw.camera)
    ) {
      errors.push('competing line-art camera');
    }
  }
  const personErrors: string[] = [];
  let personMissing = false;
  if (input.linePersonRaw === undefined) {
    personMissing = true;
  } else {
    const person = record(input.linePersonRaw);
    if (!person) personErrors.push('line-art person look is not a record');
    else {
      if (person.verdict !== 'pass') personErrors.push('line-art person verdict is not pass');
      if (person.file !== file) personErrors.push('line-art person file does not match the twin');
      if (structural.sha256 && person.fileSha256 !== structural.sha256) {
        personErrors.push('line-art person file SHA-256 does not match');
      }
      if (typeof person.checkedBy !== 'string' || !person.checkedBy) {
        personErrors.push('line-art person look has no named checkedBy');
      }
      if (person.evidenceClass !== 'owner-passed' && person.evidenceClass !== 'person-checked') {
        personErrors.push('line-art person evidence class is not a person class');
      }
      if (person.rubricVersion !== undefined && person.rubricVersion !== PICTURE_RUBRIC_VERSION) {
        personErrors.push('line-art person rubric version does not match');
      }
    }
  }
  const styleErrors: string[] = [];
  let styleMissing = false;
  let stylePending = false;
  if (input.styleRaw === undefined) {
    styleMissing = true;
  } else {
    const style = record(input.styleRaw);
    if (!style) styleErrors.push('line-art style look is not a record');
    else {
      if (style.verdict !== 'pass') styleErrors.push('line-art style look verdict is not pass');
      if (style.evidenceClass !== 'owner-passed') {
        styleErrors.push('line-art style look evidence class is not owner-passed');
      }
      if (typeof style.checkedBy !== 'string' || !style.checkedBy) {
        styleErrors.push('line-art style look has no named checkedBy');
      }
      if (input.styleSampleFilesValid === false) {
        styleErrors.push('line-art style look sample files do not match their SHA-256 values');
      }
      // The look binds to one technique and one format version, not to one file (RA-B2): the
      // sample files are only the evidence of the look. A twin of another technique or format
      // version stays pending until a new style look passes.
      const technique = typeof raw?.lineArtTechnique === 'string' ? raw.lineArtTechnique : undefined;
      const formatVersion = typeof raw?.lineArtFormatVersion === 'string' ? raw.lineArtFormatVersion : undefined;
      const lookTechnique = typeof style.lineArtTechnique === 'string' ? style.lineArtTechnique : undefined;
      const lookFormatVersion = typeof style.lineArtFormatVersion === 'string' ? style.lineArtFormatVersion : undefined;
      if (
        technique === undefined ||
        formatVersion === undefined ||
        lookTechnique === undefined ||
        lookFormatVersion === undefined ||
        technique !== lookTechnique ||
        formatVersion !== lookFormatVersion
      ) {
        stylePending = true;
      }
    }
  }
  const hardFailures = [...errors, ...personErrors, ...styleErrors];
  let status: LineArtManifest['status'];
  if (structural.errors.length || hardFailures.length) status = 'failed';
  else if (missingEvidence || personMissing || styleMissing || stylePending || colorStatus !== 'ready') {
    status = 'pending';
  } else status = 'ready';
  return {
    file,
    ...(structural.sha256 ? { fileSha256: structural.sha256 } : {}),
    colorFile,
    renderEvidenceFile: input.evidenceFile,
    status,
    structural,
    ...(typeof raw?.lineArtFormatVersion === 'string' ? { formatVersion: raw.lineArtFormatVersion } : {}),
    ...(typeof raw?.lineArtTechnique === 'string' ? { technique: raw.lineArtTechnique } : {}),
    errors: hardFailures,
  };
}

export async function buildManifest(
  jobs: StorytimeJob[],
  outputRoot: string,
  repoRoot = FORGE_ROOT,
): Promise<StorytimeManifest> {
  if (!jobs.length) throw new Error('A manifest needs at least one job; zero jobs is an empty manifest.');
  const candidates: CandidateManifest[] = [];
  for (const job of jobs) {
    for (const version of await discoverCandidateVersions(outputRoot, job)) {
      const file = candidateRelativePath(job, version);
      const png = await readBufferIfExists(resolveOutputPath(outputRoot, file));
      const minimax = await readJsonIfExists(
        resolveOutputPath(outputRoot, `reviews/${job.id}-v${version}-minimax.json`),
      );
      const kimi = await readJsonIfExists(
        resolveOutputPath(outputRoot, `reviews/${job.id}-v${version}-kimi.json`),
      );
      const person = await readJsonIfExists(
        resolveOutputPath(outputRoot, `reviews/${job.id}-v${version}-person.json`),
      );
      const linePerson = await readJsonIfExists(
        resolveOutputPath(outputRoot, `reviews/${job.id}-v${version}-lineart-person.json`),
      );
      const style = await readJsonIfExists(
        resolveOutputPath(outputRoot, 'reviews/lineart-style-look.json'),
      );
      const styleSampleFilesValid = await styleLookSampleFilesValid(outputRoot, style);
      const render = await readJsonIfExists(
        resolveOutputPath(outputRoot, renderEvidenceRelativePath(job, version)),
      );
      let stage: StageReference | undefined;
      let stageError: string | undefined;
      try {
        const stageFile = await readBookStage(repoRoot, job, version);
        stage = { file: stageFile.file, sha256: stageFile.sha256, at: stageFile.at };
      } catch (error) {
        if (!missingFile(error)) stageError = errorText(error);
      }
      const candidate = await evaluateCandidate({
        job,
        version,
        file,
        ...(png ? { png } : {}),
        ...(stage ? { stage } : {}),
        ...(stageError ? { stageError } : {}),
        ...(render === undefined ? {} : { render }),
        reviews: {
          ...(minimax === undefined ? {} : { minimax }),
          ...(kimi === undefined ? {} : { kimi }),
          ...(person === undefined ? {} : { person }),
        },
      });
      const evidenceFile = renderEvidenceRelativePath(job, version);
      const lineBytes = await readBufferIfExists(resolveOutputPath(outputRoot, lineArtRelativePath(job, version)));
      const hasTwin = lineBytes !== undefined || record(render)?.lineArtFile !== undefined;
      const lineArt = hasTwin
        ? await evaluateLineArtTwin({
            job,
            version,
            colorFile: file,
            colorStatus: candidate.status,
            colorStructural: candidate.structural,
            renderRaw: render,
            lineBytes,
            linePersonRaw: linePerson,
            styleRaw: style,
            styleSampleFilesValid,
            evidenceFile,
          })
        : undefined;
      candidates.push(lineArt ? { ...candidate, lineArt } : candidate);
    }
  }
  return assembleManifest(jobs, candidates);
}

/**
 * The sample files of a style look are only the evidence of the look (RA-B2). Each entry must name
 * an existing file whose SHA-256 equals the recorded value; one wrong sample invalidates the whole
 * look for every twin.
 */
async function styleLookSampleFilesValid(outputRoot: string, style: unknown): Promise<boolean> {
  const look = record(style);
  if (!look) return true;
  // RA2-N1: a style look with an empty or absent sampleFiles list is invalid.
  const samples = look.sampleFiles;
  if (!Array.isArray(samples) || samples.length === 0) return false;
  for (const sample of samples) {
    const item = record(sample);
    if (!item || typeof item.file !== 'string' || typeof item.sha256 !== 'string') return false;
    const bytes = await readBufferIfExists(resolveOutputPath(outputRoot, item.file));
    if (!bytes || sha256(bytes) !== item.sha256) return false;
  }
  return true;
}

async function appendLedgerEntry(outputRoot: string, entry: LedgerEntry): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  await appendFile(resolveOutputPath(outputRoot, 'cost-ledger.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
}

async function writeJson(
  outputRoot: string,
  relativeFile: string,
  value: unknown,
  newOnly = false,
): Promise<void> {
  const file = resolveOutputPath(outputRoot, relativeFile);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    ...(newOnly ? { flag: 'wx' } : {}),
  });
}

function selectedJobs<T extends StorytimeJob>(
  jobs: T[],
  selection: { week?: number | undefined; jobId?: string | undefined },
): T[] {
  const selected = jobs.filter(
    (job) =>
      (selection.week === undefined || job.week === selection.week) &&
      (selection.jobId === undefined || job.id === selection.jobId),
  );
  if (!selected.length) throw new Error('No jobs matched the selection.');
  return selected;
}

async function loadJobs(outputRoot: string): Promise<StorytimeJob[]> {
  const jobs = z
    .array(JobSchema)
    .parse(JSON.parse(await readFile(resolveOutputPath(outputRoot, 'jobs.json'), 'utf8')));
  assertCompleteJobs(jobs);
  return jobs;
}

/** The model file rule of RB-02: `out/<name>/<name>.glb` with a lowercase slug name. */
const BOOK_MODEL_FILE_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/\1\.glb$/;

/**
 * The served files of the capture server (RB-02): the allowlisted `out/<name>/<name>.glb` models
 * and the stage pictures that the loaded timeline names. The storytime output tree, which holds
 * the ledger, raw answers, calibration logs, and candidates, is never served.
 */
export interface BookFileAllowlist {
  /** The real path of `<repoRoot>/out`. */
  outRoot: string;
  /** The real path of `<repoRoot>/out/storytime`; every file at or below it is refused. */
  storytimeRoot: string;
  /** The resolved stage directory that holds the timeline pictures. */
  stageDirectory: string;
  /** The real path of the stage directory when it exists. */
  stageRoot: string;
  /** The picture files that the timeline names, relative to the stage directory. */
  stageFiles: Set<string>;
}

export function bookFileAllowlist(input: {
  repoRoot: string;
  stageDirectory: string;
  timeline: BookCaptureInput['timeline'];
}): BookFileAllowlist {
  const outRoot = realpathSync(path.join(path.resolve(input.repoRoot), 'out'));
  const storytimeRoot = realpathSync(path.join(outRoot, 'storytime'));
  const stageDirectory = path.resolve(input.stageDirectory);
  let stageRoot = stageDirectory;
  try {
    stageRoot = realpathSync(stageDirectory);
  } catch {
    // A missing stage directory serves nothing.
  }
  const stageFiles = new Set<string>();
  for (const shot of input.timeline.shots) {
    for (const picture of shot.pictures) {
      if (picture.file && !picture.file.split('/').includes('..')) stageFiles.add(picture.file);
    }
  }
  return { outRoot, storytimeRoot, stageDirectory, stageRoot, stageFiles };
}

/** The allowlisted `out/<name>/<name>.glb` file for one path below the out root, or undefined. */
function checkedModelFile(allowlist: BookFileAllowlist, relative: string): string | undefined {
  if (!BOOK_MODEL_FILE_PATTERN.test(relative)) return undefined;
  const candidate = path.join(allowlist.outRoot, relative);
  let real: string;
  try {
    if (!statSync(candidate).isFile()) return undefined;
    real = realpathSync(candidate);
  } catch {
    return undefined;
  }
  // The physical file must stay inside out/ and outside the storytime output tree (RB-02).
  if (!inside(allowlist.outRoot, real, true) || inside(allowlist.storytimeRoot, real, true)) {
    return undefined;
  }
  // RB2-04: return the checked real path, so the server reads the validated target and a
  // concurrent symlink replacement cannot change it after validation.
  return real;
}

/**
 * The checked real path of one server request path, or undefined for a refusal (RB-02). The
 * request path is decoded and normalized before the prefix match; a decode error is a refusal.
 */
export function resolveBookFile(
  allowlist: BookFileAllowlist,
  requestPath: string,
): string | undefined {
  let pathname = requestPath;
  const cut = pathname.search(/[?#]/);
  if (cut >= 0) pathname = pathname.slice(0, cut);
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  if (decoded.includes('\0') || decoded.split('/').includes('..')) return undefined;
  if (decoded.startsWith('/out/')) {
    return checkedModelFile(allowlist, decoded.slice('/out/'.length));
  }
  if (decoded.startsWith('/@fs/')) {
    const rest = decoded.slice('/@fs/'.length);
    if (!path.isAbsolute(rest)) return undefined;
    const relative = path.relative(allowlist.outRoot, path.resolve(rest));
    if (relative.startsWith('..') || path.isAbsolute(relative)) return undefined;
    return checkedModelFile(allowlist, relative);
  }
  if (decoded.startsWith('/stage/')) {
    const relative = decoded.slice('/stage/'.length);
    // Only a picture that the loaded timeline names is served (RB-02).
    if (!allowlist.stageFiles.has(relative)) return undefined;
    const candidate = path.join(allowlist.stageDirectory, relative);
    let real: string;
    try {
      if (!statSync(candidate).isFile()) return undefined;
      real = realpathSync(candidate);
    } catch {
      return undefined;
    }
    // A stage picture must stay physically inside the stage directory (no symlink escape).
    if (!inside(allowlist.stageRoot, real, true)) return undefined;
    // RB2-04 and RA3-01: a stage root inside the protected evidence tree is refused, and the
    // server returns the checked real path, so it reads the validated target.
    if (inside(allowlist.storytimeRoot, real, true)) return undefined;
    return real;
  }
  return undefined;
}

function serverRequestPath(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl, 'http://localhost').pathname;
  } catch {
    return undefined;
  }
}

function bookServerPrefix(value: string): boolean {
  return /^\/(out|stage)\//.test(value) || value.startsWith('/@fs/');
}

/** The served and refused request counts of the capture server, with a refusal hook. */
export interface BookFileServerReport {
  stats(): { served: number; refused: number };
  /** Registers a handler that receives each refused request path. */
  onRefused(handler: (requestPath: string) => void): void;
}

/**
 * The vite plugin of the capture server (RB-02): one middleware serves allowlisted files and
 * refuses every other `/out/`, `/stage/`, and `/@fs/` request with 404 and no `next()` call.
 * `stats()` reports the served and refused request counts.
 */
export function serveBookFiles(
  allowlist: BookFileAllowlist,
): Plugin & BookFileServerReport {
  let served = 0;
  let refused = 0;
  const refusedHandlers: Array<(requestPath: string) => void> = [];
  return {
    name: 'storytime-book-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url ?? '/';
        const pathname = serverRequestPath(raw) ?? raw;
        let decoded: string | undefined;
        try {
          decoded = decodeURIComponent(pathname);
        } catch {
          decoded = undefined;
        }
        if (!bookServerPrefix(pathname) && (decoded === undefined || !bookServerPrefix(decoded))) {
          next();
          return;
        }
        const file = resolveBookFile(allowlist, pathname);
        if (!file) {
          for (const handler of refusedHandlers) handler(pathname);
          refused += 1;
          res.statusCode = 404;
          res.end('missing');
          return;
        }
        try {
          const bytes = readFileSync(file);
          served += 1;
          res.setHeader('content-type', FILE_TYPES[path.extname(file)] ?? 'application/octet-stream');
          res.end(bytes);
        } catch {
          for (const handler of refusedHandlers) handler(pathname);
          refused += 1;
          res.statusCode = 404;
          res.end('missing');
        }
      });
    },
    stats() {
      return { served, refused };
    },
    onRefused(handler) {
      refusedHandlers.push(handler);
    },
  };
}

/** The protected file plugin inside one capture server configuration, if present. */
function bookFilePluginOf(config: InlineConfig): (Plugin & BookFileServerReport) | undefined {
  for (const plugin of config.plugins ?? []) {
    if (
      plugin &&
      typeof plugin === 'object' &&
      'name' in plugin &&
      (plugin as { name?: unknown }).name === 'storytime-book-files'
    ) {
      return plugin as Plugin & BookFileServerReport;
    }
  }
  return undefined;
}

/**
 * The vite server configuration of the production capture (RB-02): loopback host, strict file
 * serving, a deny entry for the storytime output tree, and the protected file plugin.
 */
export function bookServerConfig(input: BookCaptureInput): InlineConfig {
  const allowlist = bookFileAllowlist({
    repoRoot: input.repoRoot,
    stageDirectory: path.dirname(input.stage.absoluteFile),
    timeline: input.timeline,
  });
  return {
    root: input.repoRoot,
    configFile: false,
    logLevel: 'error',
    plugins: [serveBookFiles(allowlist)],
    server: {
      host: '127.0.0.1',
      port: 5900 + Math.floor(Math.random() * 300),
      strictPort: false,
      hmr: false,
      watch: null,
      fs: {
        strict: true,
        // RB2-03: the four Vite credential defaults stay, and the Storytime deny rule uses the
        // absolute real path, because installed Vite matches slash patterns against absolute
        // filesystem paths. The relative entry stays for readability and older matching.
        deny: [
          '.env',
          '.env.*',
          '*.{crt,pem}',
          '**/.git/**',
          'out/storytime/**',
          `${allowlist.storytimeRoot}/**`,
        ],
      },
    },
  };
}

declare global {
  interface Window {
    /**
     * Published by src/song/still-hook.ts at the end of every song seek, and cleared on load.
     * The storytime capture reads it for the line-art twin pass.
     */
    __bookStill?: {
      scene: unknown;
      camera: unknown;
      renderer: unknown;
      /** The page's three module namespace, for the in-page line-art pass. */
      three?: unknown;
      /** The camera state of the color still: position, target, fov, aspect, near, far. */
      cameraState?: unknown;
    };
  }
}

const BOOK_STILL_HOOK_ERROR =
  'The song page does not expose its scene, camera, or renderer (no window.__bookStill hook). ' +
  'The line-art render pass is a pass of the same three.js scene, so it needs the engine hook task ' +
  'before a live book render; see the track contract "Line-art twins" and the test strategy section 8.';

/** The page driver of `captureStillPair`: one seek, one color still, one live camera check, one pass. */
export interface BookStillDriver {
  seek(at: number): Promise<void>;
  screenshot(): Promise<Buffer>;
  /** The published camera state copy of the color still; the evidence camera (read 1). */
  cameraState(): Promise<unknown>;
  /** The live hook camera: position, fov, aspect, near, far, and the 16 projection elements. */
  liveCameraState(): Promise<unknown>;
  lineArt(): Promise<Buffer>;
}

export interface BookStillPairInput {
  /** The still time; both seeks use the same value. */
  stage?: { at?: number };
  /** Optional labeled progress lines; the unit tests run without a logger. */
  log?: (message: string) => void;
}

export interface BookStillPair {
  color: Buffer;
  lineArt: Buffer;
  /** The camera state read before the line-art pass, bound to the color still. */
  camera: unknown;
}

/** The camera fields that read 1 (the published copy) must share with read 2 (the live camera). */
const PUBLISHED_CAMERA_FIELDS = ['position', 'fov', 'aspect', 'near', 'far'] as const;

/** The first published/live field that differs, or undefined when read 1 matches read 2. */
function publishedCameraDrift(published: unknown, live: unknown): string | undefined {
  const copy = record(published);
  const liveRecord = record(live);
  if (!copy || !liveRecord) return 'state';
  for (const field of PUBLISHED_CAMERA_FIELDS) {
    // The published copy may carry fewer fields than the live read; the shared fields must match.
    if (copy[field] === undefined) continue;
    if (JSON.stringify(copy[field]) !== JSON.stringify(liveRecord[field])) return field;
  }
  return undefined;
}

/** The first field that differs between the two live camera reads, or undefined when they match. */
function liveCameraDrift(before: unknown, after: unknown): string | undefined {
  const beforeRecord = record(before);
  const afterRecord = record(after);
  if (!beforeRecord || !afterRecord) return 'state';
  for (const field of Object.keys(beforeRecord)) {
    if (JSON.stringify(beforeRecord[field]) !== JSON.stringify(afterRecord[field])) return field;
  }
  for (const field of Object.keys(afterRecord)) {
    if (!(field in beforeRecord) && afterRecord[field] !== undefined) return field;
  }
  return undefined;
}

/**
 * The capture order of one render run: seek, color screenshot, published camera state read, live
 * camera read, line-art pass, second live camera read, seek of the same time again, second color
 * screenshot. The evidence camera is the published copy (read 1). Read 2 and read 3 compute the
 * state from the live hook camera (RA-N1): read 2 must match read 1 in position, fov, aspect,
 * near, and far; read 3 must match read 2 in every field. A camera drift, a pixel
 * difference between the two color screenshots, or a missing hook throws and the caller writes
 * nothing. A second read of the published copy is never a drift check.
 */
export async function captureStillPair(
  driver: BookStillDriver,
  input: BookStillPairInput = {},
): Promise<BookStillPair> {
  const at = input.stage?.at ?? 0;
  const log = input.log ?? (() => {});
  await driver.seek(at);
  const color = await driver.screenshot();
  const camera = await driver.cameraState();
  if (camera === undefined || camera === null) {
    throw new Error(BOOK_STILL_HOOK_ERROR);
  }
  const cameraBeforePass = await driver.liveCameraState();
  if (cameraBeforePass === undefined || cameraBeforePass === null) {
    throw new Error(BOOK_STILL_HOOK_ERROR);
  }
  const beforeDrift = publishedCameraDrift(camera, cameraBeforePass);
  if (beforeDrift) {
    throw new Error(
      `Camera state drift in ${beforeDrift} between the published copy and the live camera; nothing is written.`,
    );
  }
  log('camera drift source: live');
  const lineArt = await driver.lineArt();
  const cameraAfterPass = await driver.liveCameraState();
  const afterDrift = liveCameraDrift(cameraBeforePass, cameraAfterPass);
  if (afterDrift) {
    throw new Error(
      `Camera state drift in ${afterDrift} between the live camera reads around the line-art pass; nothing is written.`,
    );
  }
  log('camera state drift: 0');
  await driver.seek(at);
  const colorRepeat = await driver.screenshot();
  if (!color.equals(colorRepeat)) {
    throw new Error('The color still is not pixel-identical on the repeat seek; the page is not deterministic.');
  }
  log('color repeat identical: yes');
  return { color, lineArt, camera };
}

interface OpenedBookPage {
  page: Page;
  pageErrors: string[];
  /** The protected file plugin of the capture server; undefined only with an injected opener. */
  bookFiles: BookFileServerReport | undefined;
  close: () => Promise<void>;
}

/** Prints the RB-02 file-server observability of one capture: each refused path, then the counts. */
function reportBookFileTraffic(
  opened: OpenedBookPage,
  log: (message: string) => void,
): void {
  opened.bookFiles?.onRefused((requestPath) => log(`book file refused: ${requestPath}`));
}

function logBookFileCounts(opened: OpenedBookPage, log: (message: string) => void): void {
  const stats = opened.bookFiles?.stats();
  if (!stats) return;
  log(`book files served: ${stats.served}`);
  log(`book file requests refused: ${stats.refused}`);
}

async function openBookPage(input: BookCaptureInput): Promise<OpenedBookPage> {
  const { chromium } = await import('playwright');
  const { createServer } = await import('vite');
  const size = input.size ?? PICTURE_SIZES[input.job.size];
  const config = bookServerConfig(input);
  const bookFiles = bookFilePluginOf(config);
  const server = await createServer(config);
  let browser: Browser | undefined;
  try {
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error('Could not start the book page server.');
    browser = await chromium.launch({
      args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
    });
    const page = await browser.newPage({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
    });
    page.setDefaultTimeout(300_000);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${url}song.html`, { timeout: 180_000 });
    await page.waitForFunction(() => window.__song?.ready === true, undefined, {
      timeout: 600_000,
      polling: 500,
    });
    return {
      page,
      pageErrors,
      bookFiles,
      close: async () => {
        if (browser) await browser.close();
        await server.close();
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    await server.close();
    throw error;
  }
}

function pageDriver(
  page: Page,
  size: { width: number; height: number },
  pageErrors: string[],
  lineArt?: () => Promise<Buffer>,
): BookStillDriver {
  return {
    seek: (at) => page.evaluate((time) => window.__song!.seek(time), at),
    screenshot: async () => {
      if (pageErrors.length) throw new Error(`Book page errors: ${pageErrors.join('; ')}`);
      return page.screenshot({ type: 'png' });
    },
    cameraState: () => page.evaluate(() => window.__bookStill?.cameraState ?? null),
    liveCameraState: () =>
      page.evaluate(() => {
        const camera = window.__bookStill?.camera as
          | {
              position: { x: number; y: number; z: number };
              fov: number;
              aspect: number;
              near: number;
              far: number;
              projectionMatrix: { elements: ArrayLike<number> };
            }
          | undefined;
        if (!camera) return null;
        return {
          position: [camera.position.x, camera.position.y, camera.position.z],
          fov: camera.fov,
          aspect: camera.aspect,
          near: camera.near,
          far: camera.far,
          projectionMatrix: Array.from(camera.projectionMatrix.elements),
        };
      }),
    lineArt: lineArt ?? (() => runPageLineArtPass(page, size, pageErrors)),
  };
}

/**
 * The shared load step of the production capture and the smoke capture (RA-B1): one `__song.load`
 * call, then the page notes check, before the first seek.
 */
export async function loadBookTimeline(page: Page, timeline: Timeline): Promise<void> {
  const notes = await page.evaluate((value) => window.__song!.load(value), timeline);
  assertPageNotes((notes ?? []) as string[]);
}

/** Runs the form-edge pass in the page against the hooked scene, camera, and renderer. */
async function runPageLineArtPass(
  page: Page,
  size: { width: number; height: number },
  pageErrors: string[],
): Promise<Buffer> {
  const dataUrl = await page.evaluate(async (passSize) => {
    const hook = window.__bookStill;
    if (!hook?.three || !hook.scene || !hook.camera || !hook.renderer) {
      throw new Error('The book still hook has no scene, camera, renderer, or three namespace.');
    }
    const passModuleUrl = '/src/storytime/line-art-pass.ts';
    const { renderLineArtPass } = (await import(passModuleUrl)) as typeof import('../storytime/line-art-pass.js');
    const result = renderLineArtPass(
      hook.three as typeof import('three'),
      {
        scene: hook.scene as import('three').Scene,
        camera: hook.camera as import('three').PerspectiveCamera,
        renderer: hook.renderer as import('three').WebGLRenderer,
      },
      passSize,
    );    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(result.width, result.height);
    for (let index = 0; index < result.data.length; index += 1) {
      const value = result.data[index]!;
      const offset = index * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }, size);
  if (pageErrors.length) throw new Error(`Book page errors: ${pageErrors.join('; ')}`);
  // The canvas PNG carries an alpha channel. Flatten it over white first, so the twin is one
  // opaque 8-bit grey channel with no alpha, as the contract and the line-art checks require.
  return sharp(Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'))
    .flatten({ background: '#ffffff' })
    .toColourspace('b-w')
    .png()
    .toBuffer();
}

/** The fixture scene of the bounded smoke run: a smooth sphere over a box behind it. */
const LINEART_SMOKE_FIXTURE_SIZE = { width: 256, height: 256 };

export interface LineArtSmokeFixture {
  width: number;
  height: number;
  /** The projected sphere center in pixels. */
  center: number[];
  /** The projected sphere silhouette radius in pixels. */
  radius: number;
  /**
   * The border column and visible row range of the smoke depth-step planes: two front-facing
   * planes with the same normal, at 4.0 m and 4.3 m from the camera; the nearer plane covers the
   * left half of the further plane. The border is a pure relative view-distance edge.
   */
  depthStep?: { column: number; rowStart: number; rowEnd: number };
}

/** One smoke capture: the stage still pair plus one fixture pass in the same page. */
export interface BookSmokePacket extends BookCapturePacket {
  fixtureLineArt?: Buffer;
  fixture?: LineArtSmokeFixture;
}

/** Runs the fixture pass in the page: sphere at the image center, one box edge behind it. */
async function runFixturePass(page: Page): Promise<{ png: Buffer; fixture: LineArtSmokeFixture }> {
  const payload = await page.evaluate(async (passSize) => {
    const hook = window.__bookStill;
    if (!hook?.three || !hook.renderer) {
      throw new Error('The book still hook has no renderer or three namespace for the fixture pass.');
    }
    const THREE = hook.three as typeof import('three');
    const passModuleUrl = '/src/storytime/line-art-pass.ts';
    const { renderLineArtPass } = (await import(passModuleUrl)) as typeof import('../storytime/line-art-pass.js');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, passSize.width / passSize.height, 0.1, 50);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 100, 50),
      new THREE.MeshBasicMaterial({ color: '#cccccc' }),
    );
    scene.add(sphere);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.6, 1.2),
      new THREE.MeshBasicMaterial({ color: '#999999' }),
    );
    box.position.set(0.55, 0.7, -2.4);
    scene.add(box);
    // Depth-step planes to the right of the sphere: the nearer plane at 4.0 m covers the left half
    // of the further plane at 4.3 m. Their border column is a pure relative view-distance edge.
    const nearPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 3.0),
      new THREE.MeshBasicMaterial({ color: '#aaaaaa' }),
    );
    nearPlane.position.set(1.25, -0.95, 0);
    scene.add(nearPlane);
    const farPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 3.0),
      new THREE.MeshBasicMaterial({ color: '#888888' }),
    );
    farPlane.position.set(1.45, -0.95, -0.3);
    scene.add(farPlane);
    const result = renderLineArtPass(
      THREE,
      { scene, camera, renderer: hook.renderer as import('three').WebGLRenderer },
      passSize,
    );
    const centerVector = new THREE.Vector3(0, 0, 0).project(camera);
    const center: [number, number] = [
      (centerVector.x * 0.5 + 0.5) * passSize.width,
      (-centerVector.y * 0.5 + 0.5) * passSize.height,
    ];
    const distance = camera.position.length();
    const angularRadius = Math.asin(1 / distance);
    const radius =
      (Math.tan(angularRadius) / Math.tan((camera.fov * Math.PI) / 360)) * (passSize.height / 2);
    // The declared depth-step border: the projected right edge of the nearer plane, and the row
    // range where the border is visible with a margin against the plane edges.
    const borderTop = new THREE.Vector3(1.35, 0.55, 0).project(camera);
    const column = Math.round((borderTop.x * 0.5 + 0.5) * passSize.width);
    const topRow = Math.round((-borderTop.y * 0.5 + 0.5) * passSize.height);
    const depthStep = { column, rowStart: topRow + 8, rowEnd: passSize.height - 10 };
    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(result.width, result.height);
    for (let index = 0; index < result.data.length; index += 1) {
      const value = result.data[index]!;
      const offset = index * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    return {
      fixture: {
        width: passSize.width,
        height: passSize.height,
        center,
        radius,
        depthStep,
      },
      dataUrl: canvas.toDataURL('image/png'),
    };
  }, LINEART_SMOKE_FIXTURE_SIZE);
  const png = await sharp(
    Buffer.from(payload.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'),
  )
    .toColourspace('b-w')
    .png()
    .toBuffer();
  return { png, fixture: payload.fixture };
}

async function inkSharePercent(png: Buffer): Promise<number> {
  const { data } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  for (const value of data) if (value < 128) ink += 1;
  return (ink / data.length) * 100;
}

/**
 * The smoke check of a fixture line-art picture. It prints both labeled values and accepts a
 * complete ring silhouette around the declared sphere: no mesh net inside the disc, and at least
 * 342 of 360 degree directions with ink on the ring.
 */
export async function checkLineArtSmoke(
  png: Buffer,
  fixture: LineArtSmokeFixture,
): Promise<{ valid: boolean; errors: string[] }> {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const dark = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) return false;
    return data[y * info.width + x]! < 128;
  };
  const centerX = fixture.center[0]!;
  const centerY = fixture.center[1]!;
  const reach = fixture.radius * 0.8;
  let interior = 0;
  let interiorCount = 0;
  for (let y = Math.floor(centerY - reach); y <= Math.ceil(centerY + reach); y += 1) {
    for (let x = Math.floor(centerX - reach); x <= Math.ceil(centerX + reach); x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy > reach * reach) continue;
      interiorCount += 1;
      if (dark(x, y)) interior += 1;
    }
  }
  const interiorInk = interiorCount ? (interior / interiorCount) * 100 : 100;
  console.log(`fixture interior ink: ${interiorInk.toFixed(2)}%`);
  const tolerance = Math.max(2, fixture.radius * 0.02);
  let rays = 0;
  for (let degree = 0; degree < 360; degree += 1) {
    const angle = (degree * Math.PI) / 180;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    let hit = false;
    for (let r = fixture.radius - tolerance; r <= fixture.radius + tolerance && !hit; r += 0.5) {
      if (dark(Math.round(centerX + directionX * r), Math.round(centerY + directionY * r))) hit = true;
    }
    if (hit) rays += 1;
  }
  console.log(`fixture ring rays: ${rays}/360`);
  const errors: string[] = [];
  if (interiorInk > 1.0) {
    errors.push(`fixture interior ink ${interiorInk.toFixed(2)}% is above 1.00%.`);
  }
  if (rays < 342) {
    errors.push(`fixture ring rays ${rays}/360 are below 342.`);
  }
  if (fixture.depthStep) {
    const { column, rowStart, rowEnd } = fixture.depthStep;
    const total = rowEnd - rowStart + 1;
    let inkRows = 0;
    for (let y = rowStart; y <= rowEnd; y += 1) {
      let hit = false;
      for (let x = column - 2; x <= column + 4 && !hit; x += 1) if (dark(x, y)) hit = true;
      if (hit) inkRows += 1;
    }
    console.log(`fixture depth step rows: ${inkRows}/${total}`);
    const share = total > 0 ? inkRows / total : 0;
    if (share < 0.9) {
      errors.push(`fixture depth step rows ${inkRows}/${total} are below 90 percent.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Injectable seams of `captureBookStill`: the page opener and the in-page line-art pass. */
export interface BookStillCaptureDeps {
  open?: (input: BookCaptureInput) => Promise<OpenedBookPage>;
  lineArt?: () => Promise<Buffer>;
}

/** The peak resident memory of this capture process, rounded to whole MB. */
function capturePeakRssMb(): number {
  return Math.round(process.resourceUsage().maxRSS / 1024);
}

/**
 * The shared production capture body (RA-B1): load the timeline, check the page notes, then one
 * seek gives both twins. Both `captureBookStill` and the smoke capture run this path, so the
 * `capture path: captureBookStill` label names the real wiring.
 */
async function captureBookStillOnPage(
  input: BookCaptureInput,
  opened: OpenedBookPage,
  deps: BookStillCaptureDeps,
  log: (message: string) => void,
): Promise<BookCapturePacket> {
  log('capture path: captureBookStill');
  await loadBookTimeline(opened.page, input.timeline);
  const size = input.size ?? PICTURE_SIZES[input.job.size];
  const pair = await captureStillPair(pageDriver(opened.page, size, opened.pageErrors, deps.lineArt), {
    stage: input.stage,
    log,
  });
  return {
    color: pair.color,
    lineArt: pair.lineArt,
    camera: pair.camera,
    peakRssMb: capturePeakRssMb(),
    ...(deps.lineArt ? {} : { lineArtTechnique: LINE_ART_PASS_TECHNIQUE }),
  };
}

export async function captureBookStill(
  input: BookCaptureInput,
  deps: BookStillCaptureDeps = {},
): Promise<BookCapturePacket> {
  const opened = await (deps.open ?? openBookPage)(input);
  try {
    reportBookFileTraffic(opened, console.log);
    return await captureBookStillOnPage(input, opened, deps, console.log);
  } finally {
    logBookFileCounts(opened, console.log);
    await opened.close();
  }
}

/**
 * The live middleware probe of smoke run 6 (T92): synthetic protected files and one allowlisted
 * stage control go through the real Vite middleware stack over HTTP. No real credential file is
 * used; every synthetic byte is generated here. A failed probe throws, so the smoke run fails
 * before it writes anything.
 */
async function runMiddlewareProbe(log: (message: string) => void): Promise<void> {
  const { createServer } = await import('vite');
  const { tmpdir } = await import('node:os');
  const { get } = await import('node:http');
  const probeRoot = await mkdtemp(path.join(tmpdir(), 'storytime-probe-'));
  let server: Awaited<ReturnType<typeof createServer>> | undefined;
  try {
    const secretBytes = Buffer.from('SYNTHETIC probe secret bytes\n');
    const controlBytes = Buffer.from('SYNTHETIC stage control bytes\n');
    await mkdir(path.join(probeRoot, '.git'), { recursive: true });
    await writeFile(path.join(probeRoot, '.env'), secretBytes);
    await writeFile(path.join(probeRoot, 'key.pem'), secretBytes);
    await writeFile(path.join(probeRoot, '.git', 'config'), secretBytes);
    const evidence = path.join(probeRoot, 'out/storytime/l2/unit1/evidence.txt');
    await mkdir(path.dirname(evidence), { recursive: true });
    await writeFile(evidence, secretBytes);
    const control = path.join(probeRoot, 'docs/stage/sign.png');
    await mkdir(path.dirname(control), { recursive: true });
    await writeFile(control, controlBytes);
    const probeTimeline = {
      shots: [{ pictures: [{ file: 'sign.png', x: 0, y: 0, z: 0, w: 1 }] }],
    } as unknown as BookCaptureInput['timeline'];
    const probeInput: BookCaptureInput = {
      job: { id: 'middleware-probe', size: 'small' } as unknown as StorytimeJob,
      stage: {
        absoluteFile: path.join(probeRoot, 'docs/stage/probe-v1.json'),
      } as unknown as BookStageFile,
      timeline: probeTimeline,
      repoRoot: probeRoot,
      size: { width: 64, height: 64 },
    };
    server = await createServer(bookServerConfig(probeInput));
    await server.listen();
    const base = server.resolvedUrls?.local[0];
    if (!base) throw new Error('The middleware probe server did not report a local URL.');
    const requestProbe = (requestPath: string) =>
      new Promise<{ status: number; body: Buffer }>((resolve, reject) => {
        get(new URL(requestPath, base), (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk as Buffer));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
        }).on('error', reject);
      });
    let exposed = 0;
    const protectedProbes: Array<[string, string]> = [
      ['.env', '/.env'],
      ['pem', '/key.pem'],
      ['git config', '/.git/config'],
      ['storytime', '/out/storytime/l2/unit1/evidence.txt'],
    ];
    for (const [label, requestPath] of protectedProbes) {
      const response = await requestProbe(requestPath);
      const refused =
        (response.status === 403 || response.status === 404) && !response.body.includes(secretBytes);
      if (!refused) exposed += 1;
      log(`middleware probe ${label}: ${refused ? 'refused' : `status ${response.status}`}`);
    }
    const controlResponse = await requestProbe('/stage/sign.png');
    const served = controlResponse.status === 200 && controlResponse.body.equals(controlBytes);
    if (!served) exposed += 1;
    log(`middleware probe stage control: ${served ? 'served' : 'failed'}`);
    log(`middleware probe synthetic bytes exposed: ${exposed}`);
    if (exposed > 0) {
      throw new Error('The middleware probe exposed synthetic protected bytes; the smoke run fails.');
    }
  } finally {
    if (server) await server.close();
    await rm(probeRoot, { recursive: true, force: true });
  }
}

/** The bounded smoke capture of one still (T52, T74): production path, labels, fixture pass. */
export async function captureBookStillSmoke(input: BookCaptureInput): Promise<BookSmokePacket> {
  const log = console.log;
  // T92: the real Vite middleware probe runs first, before any Chrome launch or write.
  await runMiddlewareProbe(log);
  const opened = await openBookPage(input);
  try {
    reportBookFileTraffic(opened, log);
    const hookBefore = await opened.page.evaluate(() => window.__bookStill === undefined);
    log(`hook before seek: ${hookBefore ? 'absent' : 'present'}`);
    if (!hookBefore) throw new Error('The book still hook is already present before the first seek.');
    const songKeys = await opened.page.evaluate(() => Object.keys(window.__song ?? {}).sort().join(','));
    log(`window.__song keys: ${songKeys}`);
    if (songKeys !== 'load,portrait,ready,seek') {
      throw new Error(`window.__song has unexpected keys: ${songKeys}`);
    }
    const pair = await captureBookStillOnPage(input, opened, {}, log);
    if (!pair.lineArt) throw new Error('The smoke capture returned no line-art twin.');
    const fixturePass = await runFixturePass(opened.page);
    const inkShare = await inkSharePercent(pair.lineArt);
    log(`stage ink share: ${inkShare.toFixed(2)}%`);
    if (inkShare < 0.5 || inkShare > 25) {
      throw new Error(`Stage ink share ${inkShare.toFixed(2)}% is outside 0.5 to 25.`);
    }
    return {
      color: pair.color,
      lineArt: pair.lineArt,
      camera: pair.camera,
      ...(pair.peakRssMb === undefined ? {} : { peakRssMb: pair.peakRssMb }),
      ...(pair.lineArtTechnique === undefined ? {} : { lineArtTechnique: pair.lineArtTechnique }),
      fixtureLineArt: fixturePass.png,
      fixture: fixturePass.fixture,
    };
  } finally {
    logBookFileCounts(opened, log);
    await opened.close();
  }
}

export interface RenderCandidateResult {
  jobId: string;
  version: number;
  status: 'rendered' | 'skipped' | 'dry-run';
  file: string;
  lineArtFile?: string;
  stageFile: string;
  stageSha256: string;
  at: number;
  width: number;
  height: number;
  /** Peak resident memory of the capture process in MB, from the capture packet. */
  peakRssMb?: number;
  /** On `skipped`: the next free version of the job (Review C note). */
  nextVersion?: number;
}

// ---------------------------------------------------------------------------
// Picture list rows: render and verify under the specification v1 names (Phase 3)
// ---------------------------------------------------------------------------

/** The SHA-256 of picture list version 4 (Workbooks commit `87ecc6aa`). */
export const PICTURE_LIST_SHA256 = '6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58';

/** The rows of weeks 2 to 7, the production scope of Phase 4. The week 1 and week 8 rows stay out. */
export function weeksTwoToSevenRows<Row extends { week: number }>(rows: readonly Row[]): Row[] {
  return rows.filter((row) => row.week >= 2 && row.week <= 7);
}

/** The list print root under a Workbooks checkout. */
export function pictureListPrintRoot(workbooksRoot: string): string {
  return path.join(path.resolve(workbooksRoot), 'content/storytime/l2/print');
}

/** A list file name at another twin version: `-v1.png` becomes `-v<version>.png`. */
export function rowVersionedName(fileName: string, version: number): string {
  assertVersion(version);
  if (!/-v\d+\.png$/.test(fileName)) throw new Error(`The list file name has no version: ${fileName}`);
  return fileName.replace(/-v\d+\.png$/, `-v${version}.png`);
}

/** The output directory of the list rows of one week; the line art sits beside the color file. */
export function rowDirectory(row: Pick<PictureListRow, 'week'>): string {
  return posix.join(`w${padWeek(row.week)}`, 'rows');
}

export function rowColorRelativePath(row: PictureListRow, version: number): string {
  return posix.join(rowDirectory(row), rowVersionedName(planPictureRow(row).colorFile, version));
}

export function rowLineArtRelativePath(row: PictureListRow, version: number): string {
  return posix.join(rowDirectory(row), rowVersionedName(planPictureRow(row).lineArtFile, version));
}

export function rowStageRelativePath(row: Pick<PictureListRow, 'id' | 'week'>, version: number): string {
  assertVersion(version);
  return posix.join('docs/storytime/l2-unit1', `w${padWeek(row.week)}`, 'rows', `${row.id}-v${version}.json`);
}

export function rowEvidenceRelativePath(row: Pick<PictureListRow, 'id'>, version: number): string {
  assertVersion(version);
  return posix.join('renders', 'rows', `${row.id}-v${version}.json`);
}

/** The capture input of a list row: the capture reads only the size, the ID, and the stage. */
export function rowCaptureJob(row: PictureListRow): StorytimeJob {
  const size: PictureSize = row.sizeClass === 'B' ? 'cover' : row.sizeClass === 'C' ? 'small' : 'story';
  return {
    id: row.id,
    week: row.week,
    bookKind: 'readalong',
    bookTitle: '',
    page: 0,
    text: row.text ?? '',
    sourcePrompt: row.prompt ?? '',
    characters: [],
    sourcePackage: '',
    sourceSha256: '',
    slug: row.id,
    directory: rowDirectory(row),
    use: size === 'story' ? 'readalong' : size,
    size,
  };
}

/** Reads one row stage file. The stage must name the row ID and the version. */
export async function readRowStage(repoRoot: string, row: PictureListRow, version: number): Promise<BookStageFile> {
  const file = rowStageRelativePath(row, version);
  const bytes = await readFile(path.resolve(repoRoot, file));
  const source = BookStageSourceSchema.parse(JSON.parse(bytes.toString('utf8')));
  assertNoMediaKeys(source, 'stage');
  if (source.jobId !== row.id) throw new Error(`Stage job ID ${source.jobId} does not match the row ${row.id}.`);
  if (source.version !== version) throw new Error('Stage version does not match the row version.');
  if (source.at > source.spec.duration) throw new Error('The declared still time exceeds the Timeline duration.');
  return { file, absoluteFile: path.resolve(repoRoot, file), sha256: sha256(bytes), at: source.at, source, bytes };
}

export interface RowRenderEvidence {
  renderer: string;
  rowId: string;
  version: number;
  sizeClass: PictureListRow['sizeClass'];
  listSha256: string;
  stageFile: string;
  stageSha256: string;
  at: number;
  camera?: unknown;
  colorFile: string;
  colorSha256: string;
  lineArtFile: string;
  lineArtSha256: string;
  lineArtFormatVersion: string;
  lineArtTechnique: string;
  width: number;
  height: number;
  peakRssMb?: number;
  warnings: string[];
}

export interface RowRenderResult {
  rowId: string;
  version: number;
  status: 'rendered' | 'dry-run';
  file: string;
  lineArtFile: string;
  stageFile: string;
  stageSha256: string;
  width: number;
  height: number;
  peakRssMb?: number;
}

/** The size-class checks of a written row pair: color structure, the row checks, and the line art. */
async function checkRowPair(
  row: PictureListRow,
  color: Buffer,
  lineArt: Buffer,
): Promise<{ errors: string[]; color: PictureStructuralCheck; lineArt: PictureStructuralCheck }> {
  const plan = planPictureRow(row);
  const size = { width: plan.width, height: plan.height };
  const colorCheck = await inspectPng(color, size, {
    ...(row.sizeClass === 'C' ? { smallCorners: true } : {}),
    ...(row.sizeClass === 'B' ? { calmTop: true } : {}),
  });
  const rowCheck = inspectPictureRow(color, row);
  const lineCheck = await inspectLineArtPng(lineArt, size);
  const errors = [
    ...colorCheck.errors.map((error) => `color: ${error}`),
    ...rowCheck.errors.filter((error) => !colorCheck.errors.some((other) => other === error)).map((error) => `row: ${error}`),
    ...lineCheck.errors.map((error) => `line art: ${error}`),
  ];
  return { errors: [...new Set(errors)], color: colorCheck, lineArt: lineCheck };
}

/**
 * Renders list rows under the specification v1 names: one twin pair per render run, the color
 * file and the line-art file side by side in `wNN/rows/`. Every check runs before any write, and
 * an existing file or evidence record of the same version stops the run.
 */
export async function renderPictureRows(options: {
  rows: PictureListRow[];
  listSha256: string;
  outputRoot: string;
  repoRoot?: string;
  rowId?: string;
  version?: number;
  dryRun: boolean;
  capture?: BookCapture;
  readStage?: (input: { row: PictureListRow; version: number; repoRoot: string }) => Promise<BookStageFile>;
  /** The calibration gate; the default is `assertCalibrationReady`. */
  assertReady?: () => Promise<void>;
  workbooksRoot?: string;
}): Promise<RowRenderResult[]> {
  const version = options.version ?? 1;
  assertVersion(version);
  const repoRoot = path.resolve(options.repoRoot ?? FORGE_ROOT);
  const rows = options.rowId === undefined ? options.rows : options.rows.filter((row) => row.id === options.rowId);
  if (!rows.length) throw new Error(`No list row matches ${options.rowId ?? 'the selection'}.`);
  const capture = options.capture ?? captureBookStill;
  const readStage = options.readStage ?? ((input) => readRowStage(input.repoRoot, input.row, input.version));
  if (!options.dryRun) {
    await (options.assertReady ??
      (() => assertCalibrationReady(options.outputRoot, options.workbooksRoot ?? DEFAULT_WORKBOOKS, repoRoot)))();
  }
  const results: RowRenderResult[] = [];
  for (const row of rows) {
    const plan = planPictureRow(row);
    const stage = await readStage({ row, version, repoRoot });
    const timeline = buildBookStillTimeline(stage.source);
    const file = rowColorRelativePath(row, version);
    const lineArtFile = rowLineArtRelativePath(row, version);
    const evidencePath = rowEvidenceRelativePath(row, version);
    for (const relative of [file, lineArtFile, evidencePath]) {
      if (existsSync(resolveOutputPath(options.outputRoot, relative))) {
        throw new Error(`${row.id}: ${relative} already exists for v${version}; use a new version.`);
      }
    }
    const result: RowRenderResult = {
      rowId: row.id,
      version,
      status: 'rendered',
      file,
      lineArtFile,
      stageFile: stage.file,
      stageSha256: stage.sha256,
      width: plan.width,
      height: plan.height,
    };
    if (options.dryRun) {
      results.push({ ...result, status: 'dry-run' });
      continue;
    }
    const packet = toCapturePacket(
      await capture({
        job: rowCaptureJob(row),
        stage,
        timeline,
        repoRoot,
        size: { width: plan.width, height: plan.height },
      }),
    );
    if (!packet.color || !packet.lineArt) {
      throw new Error(`${row.id}: one render run must give both the color file and the line-art file.`);
    }
    const color = await sharp(packet.color).flatten({ background: '#ffffff' }).toColourspace('srgb').png().toBuffer();
    const check = await checkRowPair(row, color, packet.lineArt);
    if (check.errors.length) throw new Error(`${row.id}: ${check.errors.join(' ')}`);
    const evidence: RowRenderEvidence = {
      renderer: RENDERER_ID,
      rowId: row.id,
      version,
      sizeClass: row.sizeClass,
      listSha256: options.listSha256,
      stageFile: stage.file,
      stageSha256: stage.sha256,
      at: stage.at,
      ...(packet.camera !== undefined ? { camera: packet.camera } : {}),
      colorFile: file,
      colorSha256: sha256(color),
      lineArtFile,
      lineArtSha256: sha256(packet.lineArt),
      lineArtFormatVersion: LINEART_FORMAT_VERSION,
      lineArtTechnique: packet.lineArtTechnique ?? LINEART_TECHNIQUE,
      width: plan.width,
      height: plan.height,
      ...(packet.peakRssMb === undefined ? {} : { peakRssMb: packet.peakRssMb }),
      warnings: [...(packet.warnings ?? [])],
    };
    const absoluteFile = resolveOutputPath(options.outputRoot, file);
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    await writeFile(absoluteFile, color, { flag: 'wx' });
    await writeFile(resolveOutputPath(options.outputRoot, lineArtFile), packet.lineArt, { flag: 'wx' });
    await writeJson(options.outputRoot, evidencePath, evidence, true);
    results.push({ ...result, ...(packet.peakRssMb === undefined ? {} : { peakRssMb: packet.peakRssMb }) });
  }
  return results;
}

export interface RowVerifyResult {
  rowId: string;
  version: number;
  errors: string[];
}

/**
 * Verifies every rendered version of the selected rows: the evidence names the files, the file
 * bytes match the recorded SHA-256 values, and the pair passes the size-class checks again.
 */
export async function verifyPictureRows(options: {
  rows: PictureListRow[];
  outputRoot: string;
  rowId?: string;
}): Promise<RowVerifyResult[]> {
  const rows = options.rowId === undefined ? options.rows : options.rows.filter((row) => row.id === options.rowId);
  if (!rows.length) throw new Error(`No list row matches ${options.rowId ?? 'the selection'}.`);
  const results: RowVerifyResult[] = [];
  for (const row of rows) {
    const directory = resolveOutputPath(options.outputRoot, posix.join('renders', 'rows'));
    const names = existsSync(directory) ? await readdir(directory) : [];
    const versions = names
      .map((name) => new RegExp(`^${escapeRegExp(row.id)}-v(\\d+)\\.json$`).exec(name))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => Number(match[1]))
      .sort((a, b) => a - b);
    if (!versions.length && options.rowId !== undefined) {
      results.push({ rowId: row.id, version: 0, errors: ['The row has no render evidence.'] });
    }
    for (const version of versions) {
      const errors: string[] = [];
      const evidence = (await readJsonIfExists(
        resolveOutputPath(options.outputRoot, rowEvidenceRelativePath(row, version)),
      )) as Partial<RowRenderEvidence> | undefined;
      if (
        !evidence ||
        evidence.colorFile !== rowColorRelativePath(row, version) ||
        evidence.lineArtFile !== rowLineArtRelativePath(row, version)
      ) {
        results.push({ rowId: row.id, version, errors: ['The evidence does not name the specification v1 files.'] });
        continue;
      }
      const colorPath = resolveOutputPath(options.outputRoot, evidence.colorFile);
      const linePath = resolveOutputPath(options.outputRoot, evidence.lineArtFile);
      if (!existsSync(colorPath) || !existsSync(linePath)) {
        results.push({ rowId: row.id, version, errors: ['A twin file is missing.'] });
        continue;
      }
      const color = await readFile(colorPath);
      const lineArt = await readFile(linePath);
      if (sha256(color) !== evidence.colorSha256) errors.push('The color SHA-256 does not match the evidence.');
      if (sha256(lineArt) !== evidence.lineArtSha256) errors.push('The line-art SHA-256 does not match the evidence.');
      errors.push(...(await checkRowPair(row, color, lineArt)).errors);
      results.push({ rowId: row.id, version, errors });
    }
  }
  return results;
}

function toCapturePacket(value: BookCaptureOutput): BookCapturePacket {
  // A plain Buffer is the pre-line-art draft capture shape: a color image with no twin.
  return Buffer.isBuffer(value) ? { color: value, camera: undefined } : value;
}

export async function renderCandidates(options: {
  jobs: StorytimeJob[];
  outputRoot: string;
  repoRoot?: string;
  week?: number;
  jobId?: string;
  version?: number;
  width?: number;
  height?: number;
  dryRun: boolean;
  capture?: BookCapture;
  readStage?: BookStageReader;
  /** Root of the Workbooks content packages, for the calibration source files. */
  workbooksRoot?: string;
}): Promise<RenderCandidateResult[]> {
  if (options.version !== undefined) assertVersion(options.version);
  if (options.width !== undefined || options.height !== undefined) {
    if (!options.width || !options.height) {
      throw new Error('A render size parameter needs both width and height.');
    }
  }
  assertSourceHashes(options.jobs);
  const repoRoot = path.resolve(options.repoRoot ?? FORGE_ROOT);
  const jobs = selectedJobs(options.jobs, { week: options.week, jobId: options.jobId });
  const capture = options.capture ?? captureBookStill;
  const readStage =
    options.readStage ??
    ((input: { job: StorytimeJob; version: number; repoRoot: string }) =>
      readBookStage(input.repoRoot, input.job, input.version));
  if (!options.dryRun) {
    await assertCalibrationReady(
      options.outputRoot,
      options.workbooksRoot ?? DEFAULT_WORKBOOKS,
      repoRoot,
    );
  }
  const results: RenderCandidateResult[] = [];
  for (const job of jobs) {
    const existingVersions = await discoverCandidateVersions(options.outputRoot, job);
    const version = options.version ?? existingVersions.at(-1) ?? 1;
    const stage = await readStage({ job, version, repoRoot });
    const timeline = buildBookStillTimeline(stage.source);
    const file = candidateRelativePath(job, version);
    const absoluteFile = candidateAbsolutePath(options.outputRoot, job, version);
    const width = options.width ?? PICTURE_SIZES[job.size].width;
    const height = options.height ?? PICTURE_SIZES[job.size].height;
    const twin = isReaderJob(job);
    const lineArtFile = twin ? lineArtRelativePath(job, version) : undefined;
    const result: RenderCandidateResult = {
      jobId: job.id,
      version,
      status: 'rendered',
      file,
      ...(lineArtFile ? { lineArtFile } : {}),
      stageFile: stage.file,
      stageSha256: stage.sha256,
      at: stage.at,
      width,
      height,
    };
    const evidencePath = renderEvidenceRelativePath(job, version);
    const oldEvidence = await readJsonIfExists(resolveOutputPath(options.outputRoot, evidencePath));
    if (existsSync(absoluteFile)) {
      if (oldEvidence !== undefined) {
        const parsed = RenderEvidenceSchema.safeParse(oldEvidence);
        if (!parsed.success || parsed.data.stageSha256 !== stage.sha256) {
          throw new Error(`${job.id}: stage hash changed for v${version}; use a new version.`);
        }
      }
      results.push({
        ...result,
        status: 'skipped',
        nextVersion: Math.max(...existingVersions, version) + 1,
      });
      continue;
    }
    if (existingVersions.includes(version) || oldEvidence !== undefined) {
      throw new Error(`${job.id}: evidence already exists for v${version}; use a new version.`);
    }
    if (existingVersions.some((existing) => existing > version)) {
      throw new Error(`${job.id}: v${version} is older than an existing candidate; use a new version.`);
    }
    if (options.dryRun) {
      results.push({ ...result, status: 'dry-run' });
      continue;
    }
    const packet = toCapturePacket(
      await capture({ job, stage, timeline, repoRoot, size: { width, height } }),
    );
    if (!packet.color) {
      throw new Error(`${job.id}: the capture returned no color image.`);
    }
    if (twin && !packet.lineArt) {
      throw new Error(
        `${job.id}: the capture returned no line-art twin image; a reader page needs both twins from one render run.`,
      );
    }
    // All validation happens before any write: a failure in either pass writes neither twin.
    const png = await sharp(packet.color)
      .flatten({ background: '#ffffff' })
      .toColourspace('srgb')
      .png()
      .toBuffer();
    const legacy = LEGACY_PICTURE_SIZES[job.size];
    const structural = await inspectPng(png, { width, height }, {
      ...(job.size === 'small' ? { smallCorners: true } : {}),
      ...(job.size === 'cover' ? { calmTop: true } : {}),
      ...(legacy && (legacy.width !== width || legacy.height !== height) ? { accept: [legacy] } : {}),
    });
    if (!structural.valid) throw new Error(`${job.id}: ${structural.errors.join(' ')}`);
    // The evidence records the actual capture size; a v0-size capture keeps its v0 evidence.
    const actualWidth = structural.width ?? width;
    const actualHeight = structural.height ?? height;
    let linePng: Buffer | undefined;
    if (twin && packet.lineArt) {
      // The live page pass (technique version 3) must meet the 12 px width rule here. A packet
      // with an injected pass names no technique and skips the width rule at render time only;
      // the release gate (manifest and verify) enforces the width rule on the written bytes.
      const liveScaledPass = packet.lineArtTechnique === LINE_ART_PASS_TECHNIQUE;
      const lineStructural = await inspectLineArtPng(
        packet.lineArt,
        { width: actualWidth, height: actualHeight },
        {
          ...(legacy && (legacy.width !== actualWidth || legacy.height !== actualHeight)
            ? { accept: [legacy] }
            : {}),
          ...(liveScaledPass ? {} : { minLineWidth: 0 }),
        },
      );
      if (!lineStructural.valid) {
        throw new Error(`${job.id}: line-art twin failed: ${lineStructural.errors.join(' ')}`);
      }
      linePng = packet.lineArt;
    }
    const evidence: RenderEvidence = {
      renderer: RENDERER_ID,
      jobId: job.id,
      version,
      stageFile: stage.file,
      stageSha256: stage.sha256,
      file,
      at: stage.at,
      warnings: [...(packet.warnings ?? [])],
      ...(packet.camera !== undefined ? { camera: packet.camera } : {}),
      colorFile: file,
      colorSha256: sha256(png),
      ...(linePng && lineArtFile
        ? {
            lineArtFile,
            lineArtSha256: sha256(linePng),
            lineArtFormatVersion: LINEART_FORMAT_VERSION,
            lineArtTechnique: packet.lineArtTechnique ?? LINEART_TECHNIQUE,
          }
        : {}),
      width: actualWidth,
      height: actualHeight,
    };
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    await writeFile(absoluteFile, png, { flag: 'wx' });
    if (linePng && lineArtFile) {
      const absoluteLineFile = resolveOutputPath(options.outputRoot, lineArtFile);
      await mkdir(path.dirname(absoluteLineFile), { recursive: true });
      await writeFile(absoluteLineFile, linePng, { flag: 'wx' });
    }
    await writeJson(options.outputRoot, evidencePath, evidence, true);
    results.push({
      ...result,
      status: 'rendered',
      width: actualWidth,
      height: actualHeight,
      ...(packet.peakRssMb === undefined ? {} : { peakRssMb: packet.peakRssMb }),
    });
  }
  return results;
}

export async function precheckMiniMax(options: {
  outputRoot: string;
  repoRoot?: string;
  jobs?: StorytimeJob[];
  workbooksRoot?: string;
  calibration?: CalibrationId;
  jobId?: string;
  version?: number;
  paid: boolean;
  dryRun: boolean;
  runner?: ProviderRunner;
}): Promise<
  { status: 'dry-run'; args: string[] } | { status: ReviewVerdict; review: ModelReview; args: string[] }
> {
  if (options.calibration && options.jobId) throw new Error('Use --calibration or --job, not both.');
  let target: {
    jobId: string;
    version: number;
    file: string;
    sourceText: string;
    sourcePrompt: string;
    size?: PictureSize;
  };
  let reviewBase: string;
  let imageFile: string;
  if (options.calibration) {
    const workbooksRoot = path.resolve(options.workbooksRoot ?? DEFAULT_WORKBOOKS);
    const calibration = calibrationTarget(options.calibration, workbooksRoot, options.repoRoot ?? FORGE_ROOT);
    target = calibration;
    reviewBase = `calibration/${options.calibration}-minimax`;
    imageFile = calibration.file;
  } else {
    if (!options.jobId || options.version === undefined)
      throw new Error('Candidate pre-check requires --job and --version.');
    assertVersion(options.version);
    const job = options.jobs?.find((item) => item.id === options.jobId);
    if (!job) throw new Error(`Unknown job: ${options.jobId}`);
    target = {
      jobId: job.id,
      version: options.version,
      file: candidateRelativePath(job, options.version),
      sourceText: job.text,
      sourcePrompt: job.sourcePrompt,
      size: job.size,
    };
    reviewBase = `reviews/${job.id}-v${options.version}-minimax`;
    imageFile = resolveOutputPath(options.outputRoot, target.file);
  }
  const prompt = buildReviewPrompt({
    text: target.sourceText,
    sourcePrompt: target.sourcePrompt,
    ...(target.size ? { size: target.size } : {}),
  });
  const args = miniMaxPrecheckArgs(imageFile, prompt);
  const details: PaidCallDetails = {
    operation: 'vision-describe',
    provider: 'minimax',
    model: MINIMAX_VISION_MODEL,
    modelSource: 'declared',
    purpose: `MiniMax pre-check ${target.jobId} v${target.version}`,
    jobId: target.jobId,
    version: target.version,
    price: priceForProvider('minimax'),
  };
  const imageBytes = options.dryRun ? undefined : await readFile(imageFile);
  if (imageBytes && target.size) {
    const structural = await inspectCandidatePng(imageBytes, target.size);
    if (!structural.valid) throw new Error(`${target.jobId}: ${structural.errors.join(' ')}`);
  }
  const runner = options.runner ?? runProviderProcess;
  let paidCallId: string | undefined;
  const result = await runPaidCall({
    paid: options.paid,
    dryRun: options.dryRun,
    details,
    appendLedger: (entry) => appendLedgerEntry(options.outputRoot, entry),
    call: async (callId) => {
      paidCallId = callId;
      const result = await runner('mmx', args);
      // RB-04: the raw answer is refused inside the paid call, before any write.
      const findings = secretFindings(result.stdout || result.stderr);
      if (findings.length > 0) {
        throw new Error(
          `The provider output matched credential pattern ${findings[0]}; ` +
            'the raw answer is refused and nothing is written.',
        );
      }
      // The decoded credential check reads every JSON string token in the raw answer before any write.
      const decodedFindings = decodedAnswerFindings(result.stdout || result.stderr);
      if (decodedFindings.length > 0) {
        throw new Error(
          `The decoded answer matched credential pattern ${decodedFindings[0]}; ` +
            'the raw answer is refused; no review or raw copy is written.',
        );
      }
      return result;
    },
  });
  if (result === undefined) return { status: 'dry-run', args };
  const rawOutput = result.stdout || result.stderr;
  const parsed = parseModelReview(rawOutput);
  // Keep the model the provider reported when it reports one (RA-N6); otherwise the declared value.
  const reported = reportedModel(rawOutput);
  const review: ModelReview = {
    kind: 'model-pre-check',
    jobId: target.jobId,
    version: target.version,
    file: target.file,
    provider: 'minimax',
    model: reported ?? MINIMAX_VISION_MODEL,
    modelSource: reported ? 'reported' : 'declared',
    ...(paidCallId ? { callId: paidCallId } : {}),
    price: details.price,
    rubricVersion: PICTURE_RUBRIC_VERSION,
    sourceText: target.sourceText,
    sourcePrompt: target.sourcePrompt,
    time: 'still',
    verdict: parsed.verdict,
    reason: parsed.reason,
    observedCounts: parsed.observedCounts,
    issues: parsed.issues,
    rawOutput,
    checkedAt: new Date().toISOString(),
    fileSha256: sha256(imageBytes!),
  };
  // Each call writes its raw output under raw/ with the callId in the name; no overwrite (RA-N9).
  const rawRelative = paidCallId
    ? `raw/${target.jobId}-v${target.version}-minimax-${paidCallId}.txt`
    : `${reviewBase}.txt`;
  const rawFile = resolveOutputPath(options.outputRoot, rawRelative);
  await mkdir(path.dirname(rawFile), { recursive: true });
  await writeFile(rawFile, rawOutput, { encoding: 'utf8', flag: 'wx' });
  await writeJson(options.outputRoot, `${reviewBase}.json`, { ...review, rawFile: rawRelative });
  return { status: review.verdict, review: { ...review, rawFile: rawRelative }, args };
}

/** The model name that the provider raw output reports, if any (RA-N6). */
function reportedModel(rawOutput: string): string | undefined {
  try {
    const parsed = record(JSON.parse(rawOutput) as unknown);
    if (typeof parsed?.model === 'string' && parsed.model) return parsed.model;
    const content = typeof parsed?.content === 'string' ? parsed.content : '';
    if (!content) return undefined;
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const inner = record(JSON.parse((fenced ? fenced[1]! : content).trim()) as unknown);
    return typeof inner?.model === 'string' && inner.model ? inner.model : undefined;
  } catch {
    return undefined;
  }
}

async function readLedgerEntries(outputRoot: string): Promise<LedgerEntry[]> {
  const bytes = await readBufferIfExists(resolveOutputPath(outputRoot, 'cost-ledger.jsonl'));
  if (!bytes) return [];
  return bytes
    .toString('utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as LedgerEntry);
}

interface KimiTarget {
  jobId: string;
  version: number;
  file: string;
  imageFile: string;
  sourceText: string;
  sourcePrompt: string;
  size?: PictureSize;
  reviewBase: string;
}

function kimiTarget(options: {
  outputRoot: string;
  repoRoot: string;
  workbooksRoot: string;
  jobs?: StorytimeJob[];
  calibration?: CalibrationId;
  jobId?: string;
  version?: number;
}): KimiTarget {
  if (options.calibration) {
    const calibration = calibrationTarget(
      options.calibration,
      path.resolve(options.workbooksRoot),
      options.repoRoot,
    );
    return {
      jobId: calibration.jobId,
      version: calibration.version,
      file: calibration.file,
      imageFile: calibration.file,
      sourceText: calibration.sourceText,
      sourcePrompt: calibration.sourcePrompt,
      reviewBase: `calibration/${options.calibration}-kimi`,
    };
  }
  if (!options.jobId || options.version === undefined) {
    throw new Error('Candidate pre-check requires --job and --version.');
  }
  assertVersion(options.version);
  const job = options.jobs?.find((item) => item.id === options.jobId);
  if (!job) throw new Error(`Unknown job: ${options.jobId}`);
  return {
    jobId: job.id,
    version: options.version,
    file: candidateRelativePath(job, options.version),
    imageFile: resolveOutputPath(options.outputRoot, candidateRelativePath(job, options.version)),
    sourceText: job.text,
    sourcePrompt: job.sourcePrompt,
    size: job.size,
    reviewBase: `reviews/${job.id}-v${options.version}-kimi`,
  };
}

/**
 * `--begin` writes the before-call ledger entry and the review prompt, then prints the callId.
 * `--record <callId> --raw <file>` writes the after-call entry and the Kimi log from the
 * independent reviewer's raw native-image output, with the raw text unchanged.
 * `--record <callId> --failed --reason <text>` writes the after-call entry with status failure and
 * the reason; it writes no log and no raw file. A refused record writes nothing (RA-N4).
 */
export async function precheckKimi(options: {
  outputRoot: string;
  repoRoot?: string;
  jobs?: StorytimeJob[];
  workbooksRoot?: string;
  calibration?: CalibrationId;
  jobId?: string;
  version?: number;
  begin: boolean;
  record?: string;
  raw?: string;
  failed?: boolean;
  reason?: string;
  paid: boolean;
  dryRun: boolean;
  now?: () => Date;
  newCallId?: () => string;
  log?: (message: string) => void;
}): Promise<
  | { status: 'dry-run'; prompt: string }
  | { status: 'begun'; callId: string }
  | { status: 'failed'; callId: string; reason: string }
  | { status: ReviewVerdict; review: ModelReview }
> {
  if (!options.paid && !options.dryRun) {
    throw new Error('Provider execution requires --paid. Use --dry-run to inspect the call.');
  }
  if (options.begin === Boolean(options.record)) {
    throw new Error('precheck-kimi needs exactly one of --begin or --record <callId>.');
  }
  if (options.failed && !options.record) {
    throw new Error('precheck-kimi --failed needs --record <callId>.');
  }
  if (options.failed && options.raw) {
    throw new Error('--failed refuses --raw: a failed call has no raw answer.');
  }
  if (options.failed && (options.reason === undefined || options.reason.trim().length === 0)) {
    throw new Error('precheck-kimi --failed needs a non-empty --reason.');
  }
  const repoRoot = path.resolve(options.repoRoot ?? FORGE_ROOT);
  const workbooksRoot = path.resolve(options.workbooksRoot ?? DEFAULT_WORKBOOKS);
  const targetInput = {
    outputRoot: options.outputRoot,
    repoRoot,
    workbooksRoot,
    ...(options.jobs ? { jobs: options.jobs } : {}),
    ...(options.calibration ? { calibration: options.calibration } : {}),
    ...(options.jobId ? { jobId: options.jobId } : {}),
    ...(options.version !== undefined ? { version: options.version } : {}),
  };
  const details: PaidCallDetails = {
    operation: 'kimi-native-image',
    provider: 'kimi',
    model: KIMI_REVIEW_MODEL,
    modelSource: 'declared',
    purpose: 'Kimi pre-check',
    jobId: options.jobId ?? options.calibration ?? 'unknown',
    version: options.version ?? 1,
    price: priceForProvider('kimi'),
  };
  if (options.dryRun) {
    const target = kimiTarget(targetInput);
    const prompt = buildReviewPrompt({
      text: target.sourceText,
      sourcePrompt: target.sourcePrompt,
      ...(target.size ? { size: target.size } : {}),
    });
    return { status: 'dry-run', prompt };
  }
  if (options.begin) {
    const target = kimiTarget(targetInput);
    const prompt = buildReviewPrompt({
      text: target.sourceText,
      sourcePrompt: target.sourcePrompt,
      ...(target.size ? { size: target.size } : {}),
    });
    const imageBytes = await readFile(target.imageFile);
    if (target.size) {
      const structural = await inspectCandidatePng(imageBytes, target.size);
      if (!structural.valid) throw new Error(`${target.jobId}: ${structural.errors.join(' ')}`);
    }
    const promptFile = resolveOutputPath(options.outputRoot, `candidates/${target.reviewBase}-prompt.txt`);
    await mkdir(path.dirname(promptFile), { recursive: true });
    await writeFile(promptFile, prompt, 'utf8');
    const callId = options.newCallId?.() ?? randomUUID();
    await appendLedgerEntry(options.outputRoot, {
      ...details,
      purpose: `Kimi pre-check ${target.jobId} v${target.version}`,
      file: target.file,
      event: 'before-call',
      callId,
      recordedAt: (options.now ?? (() => new Date()))().toISOString(),
    });
    options.log?.(`callId ${callId}`);
    options.log?.(`prompt ${promptFile}`);
    return { status: 'begun', callId };
  }
  const record = options.record!;
  const ledger = await readLedgerEntries(options.outputRoot);
  const begin = ledger.find((entry) => entry.event === 'before-call' && entry.callId === record);
  if (!begin) {
    throw new Error(
      `No matching before-call ledger entry for callId ${record}. Run precheck-kimi --begin first.`,
    );
  }
  // All refusals happen before any write: a refused record leaves the output tree unchanged.
  if (ledger.some((entry) => entry.event === 'after-call' && entry.callId === record)) {
    throw new Error(
      `Call ${record} already has an after-call ledger entry; a call records at most one after-call.`,
    );
  }
  if (options.calibration !== undefined && options.calibration !== begin.jobId) {
    throw new Error(
      `--calibration ${options.calibration} does not match the begin entry for callId ${record} (${begin.jobId}).`,
    );
  }
  if (options.jobId !== undefined && options.jobId !== begin.jobId) {
    throw new Error(
      `--job ${options.jobId} does not match the begin entry for callId ${record} (${begin.jobId}).`,
    );
  }
  if (options.version !== undefined && options.version !== begin.version) {
    throw new Error(
      `--version ${options.version} does not match the begin entry for callId ${record} (v${begin.version}).`,
    );
  }
  const recordDetails = {
    ...details,
    purpose: begin.purpose,
    ...(begin.file ? { file: begin.file } : {}),
    jobId: begin.jobId,
    version: begin.version,
  };
  if (options.failed) {
    const reason = options.reason!;
    // RB-04: a credential reason or a long reason is refused before any write.
    const reasonFindings = secretFindings(reason);
    if (reasonFindings.length > 0) {
      throw new Error(
        `The failure reason matched credential pattern ${reasonFindings[0]}; nothing is written.`,
      );
    }
    // RA3-02: the limit counts characters, so a 500-character multibyte reason is accepted.
    if (reason.length > FAILURE_REASON_MAX_CHARS) {
      throw new Error(
        `The failure reason is longer than ${FAILURE_REASON_MAX_CHARS} characters; nothing is written.`,
      );
    }
    await appendLedgerEntry(options.outputRoot, {
      ...recordDetails,
      event: 'after-call',
      callId: record,
      recordedAt: (options.now ?? (() => new Date()))().toISOString(),
      status: 'failure',
      reason,
    });
    options.log?.(`${begin.jobId}: FAILURE — ${reason}`);
    return { status: 'failed', callId: record, reason };
  }
  if (!options.raw) throw new Error('--record needs --raw <file> with the reviewer raw output.');
  let sourceText = '';
  let sourcePrompt = '';
  if (options.calibration) {
    const calibration = calibrationTarget(options.calibration, workbooksRoot, repoRoot);
    sourceText = calibration.sourceText;
    sourcePrompt = calibration.sourcePrompt;
  } else {
    const job = options.jobs?.find((item) => item.id === begin.jobId);
    if (job) {
      sourceText = job.text;
      sourcePrompt = job.sourcePrompt;
    }
  }
  if (!begin.file) {
    throw new Error(`The before-call ledger entry for callId ${record} has no reviewed file.`);
  }
  const imageFile = path.isAbsolute(begin.file) ? begin.file : resolveOutputPath(options.outputRoot, begin.file);
  const imageBytes = await readFile(imageFile);
  // RB-04: the raw answer goes through the `--raw` limits and the credential check before any write.
  const rawOutput = await readRawAnswer(options.raw);
  const rawFindings = secretFindings(rawOutput);
  if (rawFindings.length > 0) {
    throw new Error(
      `The raw answer matched credential pattern ${rawFindings[0]}; nothing is written.`,
    );
  }
  // The decoded credential check reads every JSON string token in the raw answer before any write.
  // It runs before the schema parse or status fallback can discard data, so a refused record leaves
  // the ledger, the review tree, and the raw copy byte-identical.
  const decodedFindings = decodedAnswerFindings(rawOutput);
  if (decodedFindings.length > 0) {
    throw new Error(
      `The decoded answer matched credential pattern ${decodedFindings[0]}; ` +
        'the raw answer is refused; no review or raw copy is written.',
    );
  }
  const parsed = parseModelReview(rawOutput);
  const reviewBase = options.calibration
    ? `calibration/${options.calibration}-kimi`
    : `reviews/${begin.jobId}-v${begin.version}-kimi`;
  // The raw answer is kept under raw/ with the callId in the file name; the source file stays.
  const rawRelative = `raw/${begin.jobId}-v${begin.version}-kimi-${record}.txt`;
  const review: ModelReview = {
    kind: 'model-pre-check',
    jobId: begin.jobId,
    version: begin.version,
    file: begin.file,
    provider: 'kimi',
    model: KIMI_REVIEW_MODEL,
    modelSource: 'declared',
    callId: record,
    rawFile: rawRelative,
    price: priceForProvider('kimi'),
    rubricVersion: PICTURE_RUBRIC_VERSION,
    sourceText,
    sourcePrompt: sourcePrompt || 'Kimi calibration target.',
    time: 'still',
    verdict: parsed.verdict,
    reason: parsed.reason,
    observedCounts: parsed.observedCounts,
    issues: parsed.issues,
    rawOutput,
    checkedAt: new Date().toISOString(),
    fileSha256: sha256(imageBytes),
  };
  const reviewFile = resolveOutputPath(options.outputRoot, `${reviewBase}.json`);
  await mkdir(path.dirname(reviewFile), { recursive: true });
  await writeFile(reviewFile, `${JSON.stringify(review, null, 2)}\n`, 'utf8');
  const rawCopy = resolveOutputPath(options.outputRoot, rawRelative);
  await mkdir(path.dirname(rawCopy), { recursive: true });
  await writeFile(rawCopy, rawOutput, { encoding: 'utf8', flag: 'wx' });
  await appendLedgerEntry(options.outputRoot, {
    ...recordDetails,
    event: 'after-call',
    callId: record,
    recordedAt: new Date().toISOString(),
    status: 'success',
  });
  options.log?.(`${review.jobId}: ${review.verdict.toUpperCase()} — ${review.reason}`);
  return { status: review.verdict, review };
}

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shortLabel(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

export async function createContactSheet(
  manifest: StorytimeManifest,
  outputRoot: string,
  selection: { week?: number; jobId?: string; version?: number },
): Promise<{ file: string; count: number; missing: string[] }> {
  const jobs = selectedJobs(manifest.jobs, selection);
  const entries: Array<{ job: ManifestJob; candidate: CandidateManifest; lineArt?: string }> = [];
  const missing: string[] = [];
  for (const job of jobs) {
    const candidates = job.candidates.filter(
      (candidate) =>
        candidate.structural.valid &&
        (selection.version === undefined || candidate.version === selection.version),
    );
    const candidate = candidates.at(-1);
    if (candidate) {
      let lineArt: string | undefined;
      if (candidate.lineArt && isReaderJob(job)) {
        const lineFile = resolveOutputPath(outputRoot, candidate.lineArt.file);
        if (existsSync(lineFile)) lineArt = candidate.lineArt.file;
      }
      entries.push({ job, candidate, ...(lineArt ? { lineArt } : {}) });
    } else missing.push(job.id);
  }
  if (!entries.length) throw new Error('No valid candidate PNG files matched the contact-sheet selection.');
  const columns = 4;
  const labelHeight = 72;
  const gap = 16;
  const margin = 16;
  const thumbnail = contactThumbnail(entries[0]!.job.size);
  const paired = entries.some((entry) => entry.lineArt);
  const cellWidth = paired ? thumbnail.width * 2 + gap : thumbnail.width;
  const rows = Math.ceil(entries.length / columns);
  const width = margin * 2 + columns * cellWidth + (columns - 1) * gap;
  const height = margin * 2 + rows * (thumbnail.height + labelHeight) + (rows - 1) * gap;
  const composites: OverlayOptions[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const box = contactThumbnail(entry.job.size);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = margin + column * (cellWidth + gap);
    const top = margin + row * (thumbnail.height + labelHeight + gap);
    const colorInput = await sharp(resolveOutputPath(outputRoot, entry.candidate.file))
      .resize(box.width, box.height, { fit: box.fit, background: box.background })
      .png()
      .toBuffer();
    composites.push({ input: colorInput, left, top });
    if (entry.lineArt) {
      // The twin pair sits side by side: the color picture left, the line-art twin right.
      const lineInput = await sharp(resolveOutputPath(outputRoot, entry.lineArt))
        .resize(box.width, box.height, { fit: box.fit, background: box.background })
        .flatten({ background: '#ffffff' })
        .toColourspace('srgb')
        .png()
        .toBuffer();
      composites.push({ input: lineInput, left: left + box.width + gap, top });
    }
    const title = `${entry.job.id}  v${entry.candidate.version}  ${entry.candidate.status}`;
    const book = shortLabel(`${entry.job.bookTitle} — page ${entry.job.page}`, 42);
    const text = shortLabel(entry.job.text, 42);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#ffffff"/><text x="0" y="16" font-family="sans-serif" font-size="12" font-weight="700" fill="#222222">${xml(title)}</text><text x="0" y="38" font-family="sans-serif" font-size="13" fill="#222222">${xml(book)}</text><text x="0" y="59" font-family="sans-serif" font-size="13" fill="#222222">${xml(text)}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left, top: top + box.height });
  }
  const prefix = selection.jobId ?? (selection.week === undefined ? 'all' : `w${padWeek(selection.week)}`);
  const version = selection.version === undefined ? '' : `-v${selection.version}`;
  const file = resolveOutputPath(outputRoot, `sheets/${prefix}${version}-contact-sheet.png`);
  await mkdir(path.dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
    .composite(composites)
    .png()
    .toFile(file);
  return { file, count: entries.length, missing };
}

export const KIMI_REVIEW_MODEL = 'kimi-k3.1-pro';

interface CliOptions {
  week?: number;
  jobId?: string;
  version?: number;
  out?: string;
  workbooks?: string;
  paid: boolean;
  dryRun: boolean;
  release: boolean;
  calibration?: CalibrationId;
  output?: 'color' | 'lineart';
  begin: boolean;
  record?: string;
  raw?: string;
  failed: boolean;
  reason?: string;
  /** A picture list row ID: `render` and `verify` work on that list row. */
  row?: string;
  /** `deliver`: the picture list file, the approval list, the Muse folder, and the delivery folder. */
  list?: string;
  approvals?: string;
  muse?: string;
  delivery?: string;
  /** `cover-calm-top`: the cover print file. */
  print?: string;
}

function parseWeek(value: string): number {
  const week = Number(value.toLowerCase().replace(/^w/, ''));
  if (!Number.isInteger(week) || week < 1 || week > 8) throw new Error(`Invalid week: ${value}`);
  return week;
}

function parseCli(argv: string[]): { command: string; options: CliOptions } {
  const [command, ...args] = argv;
  if (
    !command ||
    !['plan', 'render', 'lineart-smoke', 'precheck-minimax', 'precheck-kimi', 'manifest', 'sheet', 'verify', 'deliver', 'cover-calm-top'].includes(command)
  ) {
    throw new Error(
      'Use plan, render, lineart-smoke, precheck-minimax, precheck-kimi, manifest, sheet, verify, deliver, or cover-calm-top.',
    );
  }
  const options: CliOptions = { paid: false, dryRun: false, release: false, begin: false, failed: false };
  const valueFlags = new Set([
    '--week', '--job', '--version', '--out', '--workbooks', '--calibration', '--output', '--record', '--raw',
    '--reason', '--row', '--list', '--approvals', '--muse', '--delivery', '--print',
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === '--paid') options.paid = true;
    else if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--release') options.release = true;
    else if (argument === '--begin') options.begin = true;
    else if (argument === '--failed') options.failed = true;
    else if (valueFlags.has(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value.`);
      index += 1;
      if (argument === '--week') options.week = parseWeek(value);
      else if (argument === '--job') options.jobId = value;
      else if (argument === '--version') {
        options.version = Number(value);
        assertVersion(options.version);
      } else if (argument === '--out') options.out = value;
      else if (argument === '--workbooks') options.workbooks = value;
      else if (argument === '--record') options.record = value;
      else if (argument === '--raw') options.raw = value;
      else if (argument === '--reason') options.reason = value;
      else if (argument === '--row') options.row = value;
      else if (argument === '--list') options.list = value;
      else if (argument === '--approvals') options.approvals = value;
      else if (argument === '--muse') options.muse = value;
      else if (argument === '--delivery') options.delivery = value;
      else if (argument === '--print') options.print = value;
      else if (argument === '--output') {
        if (value !== 'color' && value !== 'lineart') throw new Error(`Invalid output kind: ${value}`);
        options.output = value;
      } else {
        if (value !== 'bad-one-sun' && value !== 'good-nan') throw new Error(`Invalid calibration: ${value}`);
        options.calibration = value;
      }
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return { command, options };
}

export async function runHeavyCommand(options: {
  preflight: () => number | Promise<number>;
  holdLock: () => void;
  run: () => Promise<number>;
  onHold?: (status: number) => void;
}): Promise<number> {
  const status = await options.preflight();
  if (status !== 0) {
    options.onHold?.(status);
    return status;
  }
  options.holdLock();
  return options.run();
}

export async function runStorytimeCli(
  argv: string[],
  dependencies: {
    repoRoot?: string;
    /** Root of the Workbooks content packages; the release gate revalidates calibration against it. */
    workbooksRoot?: string;
    runner?: ProviderRunner;
    capture?: BookCapture;
    readStage?: BookStageReader;
    log?: (message: string) => void;
    now?: () => Date;
  } = {},
): Promise<number> {
  const { command, options } = parseCli(argv);
  const repoRoot = path.resolve(dependencies.repoRoot ?? FORGE_ROOT);
  const outputRoot = resolveOutputRoot(repoRoot, options.out);
  const workbooksRoot = options.workbooks
    ? path.resolve(repoRoot, options.workbooks)
    : dependencies.workbooksRoot
      ? path.resolve(dependencies.workbooksRoot)
      : DEFAULT_WORKBOOKS;
  const log = dependencies.log ?? console.log;
  const selection = {
    ...(options.week === undefined ? {} : { week: options.week }),
    ...(options.jobId === undefined ? {} : { jobId: options.jobId }),
  };
  if (command === 'plan') {
    const jobs = buildStorytimeJobs({ workbooksRoot });
    await mkdir(outputRoot, { recursive: true });
    await writeJson(outputRoot, 'jobs.json', jobs);
    log(`Wrote 112 jobs to ${resolveOutputPath(outputRoot, 'jobs.json')}`);
    log(`Selected ${selectedJobs(jobs, selection).length} jobs.`);
    return 0;
  }
  if (command === 'cover-calm-top') {
    if (!options.print) throw new Error('cover-calm-top needs --print <cover print file>.');
    const report = await coverCalmTopReport(path.resolve(repoRoot, options.print));
    log(`top 30 percent differing share: ${report.share}`);
    log(`top 30 percent rows: ${report.rows}`);
    return report.ok ? 0 : 1;
  }
  if (command === 'deliver') {
    // Read only and offline: the command reads local files and copies the approved Muse prints.
    if (!options.list || !options.approvals || !options.muse || !options.delivery) {
      throw new Error('deliver needs --list <pictures.json>, --approvals <file>, --muse <folder>, and --delivery <folder>.');
    }
    const listPath = path.resolve(repoRoot, options.list);
    const list = loadPictureList({
      printRoot: path.basename(listPath) === PICTURE_LIST_FILE_NAME ? path.dirname(listPath) : listPath,
      workbooksRoot,
    });
    log(`Picture list ${list.file} SHA-256 ${list.sha256}.`);
    const { resolveMuseDeliveryPaths, writeMuseDelivery } = await import('./muse-delivery.js');
    const { museRoot, deliveryRoot } = resolveMuseDeliveryPaths({
      repoRoot,
      muse: options.muse,
      delivery: options.delivery,
    });
    // With --week the run covers one week: an approval entry of another week names a row that is
    // not in the filtered rows, so the writer refuses it before it writes a file.
    const weekRows = options.week === undefined ? list.rows : list.rows.filter((row) => row.week === options.week);
    const manifest = await writeMuseDelivery({
      rows: weekRows,
      approvals: path.resolve(repoRoot, options.approvals),
      museRoot,
      deliveryRoot,
      pictureListSha256: list.sha256,
      onSkip: (rowId, reason) => log(`Skipped ${rowId} (${reason})`),
    });
    log(`Delivered ${manifest.jobs.length} rows and ${manifest.batches.length} batch hashes to ${deliveryRoot}.`);
    return 0;
  }
  if ((command === 'render' || command === 'verify') && options.row !== undefined) {
    // The list is read only; a changed list file stops the run (specification v1, list v4).
    const list = loadPictureList({
      printRoot: pictureListPrintRoot(workbooksRoot),
      workbooksRoot,
      expectedSha256: PICTURE_LIST_SHA256,
    });
    const rows = options.week === undefined ? list.rows : list.rows.filter((row) => row.week === options.week);
    const rowId = options.row === 'all' ? undefined : options.row;
    if (command === 'render') {
      const results = await renderPictureRows({
        rows,
        listSha256: list.sha256,
        outputRoot,
        repoRoot,
        workbooksRoot,
        ...(rowId === undefined ? {} : { rowId }),
        ...(options.version === undefined ? {} : { version: options.version }),
        dryRun: options.dryRun,
        ...(dependencies.capture ? { capture: dependencies.capture } : {}),
      });
      for (const result of results) {
        log(
          `${result.rowId} v${result.version}: ${result.status}; stage ${result.stageSha256}; file ${result.file}; ` +
            `lineart ${result.lineArtFile}; size ${result.width} x ${result.height}` +
            `${result.peakRssMb === undefined ? '' : `; render peak rss mb: ${result.peakRssMb}`}`,
        );
      }
      return 0;
    }
    const results = await verifyPictureRows({ rows, outputRoot, ...(rowId === undefined ? {} : { rowId }) });
    const failures = results.filter((result) => result.errors.length);
    for (const result of results) {
      log(`${result.rowId} v${result.version}: ${result.errors.length ? `failed: ${result.errors.join(' ')}` : 'passed'}`);
    }
    if (failures.length) throw new Error(`Row verification failed for ${failures.length} row versions.`);
    log(`Row verification passed for ${results.length} row versions.`);
    return 0;
  }
  if (command === 'render') {
    const jobs = await loadJobs(outputRoot);
    const results = await renderCandidates({
      jobs,
      outputRoot,
      repoRoot,
      workbooksRoot,
      ...selection,
      ...(options.version === undefined ? {} : { version: options.version }),
      dryRun: options.dryRun,
      ...(dependencies.capture ? { capture: dependencies.capture } : {}),
      ...(dependencies.readStage ? { readStage: dependencies.readStage } : {}),
    });
    for (const result of results) {
      log(
        `${result.jobId} v${result.version}: ${result.status}; stage ${result.stageSha256}; file ${result.file}` +
          `${result.lineArtFile ? `; lineart ${result.lineArtFile}` : ''}` +
          `${result.peakRssMb === undefined ? '' : `; render peak rss mb: ${result.peakRssMb}`}` +
          `${result.nextVersion === undefined ? '' : `; next free version: v${result.nextVersion}`}`,
      );
    }
    return 0;
  }
  if (command === 'lineart-smoke') {
    const jobs = await loadJobs(outputRoot);
    const selected = selectedJobs(jobs, selection);
    if (selected.length !== 1) {
      throw new Error('lineart-smoke needs exactly one job; pass --job <id>.');
    }
    const smokeJob = selected[0]!;
    const readStage =
      dependencies.readStage ??
      ((input: { job: StorytimeJob; version: number; repoRoot: string }) =>
        readBookStage(input.repoRoot, input.job, input.version));
    const stage = await readStage({ job: smokeJob, version: 1, repoRoot });
    const timeline = buildBookStillTimeline(stage.source);
    const size = PICTURE_SIZES[smokeJob.size];
    const now = dependencies.now ?? (() => new Date());
    const stamp = `lineart-${now().toISOString().replace(/[:.]/g, '-')}`;
    // RB-03: smoke/ and the stamp directory resolve through resolveOutputPath.
    const smokeDirectory = resolveOutputPath(outputRoot, 'smoke');
    const stampDirectory = resolveOutputPath(outputRoot, `smoke/${stamp}`);
    if (options.dryRun) {
      log(`lineart-smoke: would write color.png, lineart.png, fixture-lineart.png, and smoke.json under ${stampDirectory}; no capture.`);
      return 0;
    }
    const capture = dependencies.capture ?? captureBookStillSmoke;
    const packet = await capture({ job: smokeJob, stage, timeline, repoRoot, size });
    if (Buffer.isBuffer(packet)) {
      throw new Error('The smoke capture returned a color-only draft; a smoke run needs the twin packet.');
    }
    const smokePacket = packet as BookSmokePacket;
    const smokeLineArt = smokePacket.lineArt;
    const fixtureLineArt = smokePacket.fixtureLineArt;
    const fixture = smokePacket.fixture;
    if (!smokeLineArt) throw new Error('The smoke capture returned no line-art twin.');
    if (!fixtureLineArt || !fixture) {
      throw new Error('The smoke capture returned no fixture pass.');
    }
    // All checks run before any write: a failed check leaves the output tree unchanged.
    const smokeTechnique = smokePacket.lineArtTechnique ?? LINEART_TECHNIQUE;
    log(`lineart technique: ${smokeTechnique}`);
    const fixtureCheck = await checkLineArtSmoke(fixtureLineArt, fixture);
    if (!fixtureCheck.valid) {
      throw new Error(`Line-art smoke fixture failed: ${fixtureCheck.errors.join(' ')}`);
    }
    const stageInkShare = await inkSharePercent(smokeLineArt);
    log(`stage ink share: ${stageInkShare.toFixed(2)}%`);
    // RB-03: every path check runs before the first write; each directory is created exclusively.
    const outputReal = realpathSync(outputRoot);
    if (existsSync(smokeDirectory)) {
      const smokeStat = lstatSync(smokeDirectory);
      if (smokeStat.isSymbolicLink() || !smokeStat.isDirectory()) {
        throw new Error(
          `The smoke directory must be a real directory inside the output root: ${smokeDirectory}`,
        );
      }
      if (!inside(outputReal, realpathSync(smokeDirectory), true)) {
        throw new Error(`The smoke directory escapes the output root: ${smokeDirectory}`);
      }
    } else {
      await mkdir(smokeDirectory);
    }
    await mkdir(stampDirectory);
    const smokeFiles: Array<[string, Buffer | string]> = [
      ['color.png', smokePacket.color],
      ['lineart.png', smokeLineArt],
      ['fixture-lineart.png', fixtureLineArt],
      [
        'smoke.json',
        JSON.stringify(
          {
            jobId: smokeJob.id,
            at: stage.at,
            width: size.width,
            height: size.height,
            stageFile: stage.file,
            stageSha256: stage.sha256,
            camera: smokePacket.camera,
            fixture,
            renderer: RENDERER_ID,
            lineArtTechnique: smokeTechnique,
          },
          null,
          2,
        ),
      ],
    ];
    for (const [name, bytes] of smokeFiles) {
      await writeOutputFile(outputRoot, `smoke/${stamp}/${name}`, bytes);
    }
    log(`lineart-smoke: wrote ${smokeFiles.length} files under ${stampDirectory}; wrote no book version.`);
    return 0;
  }
  if (command === 'precheck-minimax') {
    const jobs = options.calibration ? undefined : await loadJobs(outputRoot);
    const result = await precheckMiniMax({
      outputRoot,
      repoRoot,
      ...(jobs ? { jobs } : {}),
      workbooksRoot,
      ...(options.calibration === undefined ? {} : { calibration: options.calibration }),
      ...(options.jobId === undefined ? {} : { jobId: options.jobId }),
      ...(options.version === undefined ? {} : { version: options.version }),
      paid: options.paid,
      dryRun: options.dryRun,
      ...(dependencies.runner ? { runner: dependencies.runner } : {}),
    });
    if (result.status === 'dry-run') {
      log(['mmx', ...result.args].map((argument) => JSON.stringify(argument)).join(' '));
      return 0;
    }
    log(`${result.review.jobId}: ${result.review.verdict.toUpperCase()} — ${result.review.reason}`);
    return result.status === 'pass' ? 0 : 2;
  }
  if (command === 'precheck-kimi') {
    const jobs = options.calibration ? undefined : await loadJobs(outputRoot);
    const result = await precheckKimi({
      outputRoot,
      repoRoot,
      ...(jobs ? { jobs } : {}),
      workbooksRoot,
      ...(options.calibration === undefined ? {} : { calibration: options.calibration }),
      ...(options.jobId === undefined ? {} : { jobId: options.jobId }),
      ...(options.version === undefined ? {} : { version: options.version }),
      begin: options.begin,
      ...(options.record === undefined ? {} : { record: options.record }),
      ...(options.raw === undefined ? {} : { raw: options.raw }),
      ...(options.failed ? { failed: true } : {}),
      ...(options.reason === undefined ? {} : { reason: options.reason }),
      paid: options.paid,
      dryRun: options.dryRun,
      log,
    });
    if (result.status === 'dry-run') {
      log(result.prompt);
      return 0;
    }
    if (result.status === 'begun') return 0;
    if (result.status === 'failed') return 0;
    return result.status === 'pass' ? 0 : 2;
  }
  if (command === 'manifest') {    const jobs = await loadJobs(outputRoot);
    const manifest = await buildManifest(jobs, outputRoot, repoRoot);
    await writeJson(outputRoot, 'manifest.json', manifest);
    log(`Wrote ${manifest.jobs.length} jobs and ${manifest.batches.length} batch hashes.`);
    return 0;
  }
  if (command === 'sheet') {
    const jobs = await loadJobs(outputRoot);
    const manifest = await buildManifest(jobs, outputRoot, repoRoot);
    const result = await createContactSheet(manifest, outputRoot, {
      ...selection,
      ...(options.version === undefined ? {} : { version: options.version }),
    });
    log(`Wrote ${result.count} labelled pictures to ${result.file}`);
    if (result.missing.length) log(`No valid candidate: ${result.missing.join(', ')}`);
    return 0;
  }
  const jobs = await loadJobs(outputRoot);
  assertSourceHashes(jobs);
  // RB-05: a release check revalidates the current calibration evidence before the manifest check.
  if (options.release) await assertCalibrationReady(outputRoot, workbooksRoot, repoRoot);
  const manifest = await buildManifest(jobs, outputRoot, repoRoot);
  const failures = verifyManifest(manifest, {
    release: options.release,
    ...(options.output === undefined ? {} : { output: options.output }),
    ...selection,
  });
  if (failures.length) throw new Error(`Verification failed:\n${failures.join('\n')}`);
  const count = selectedJobs(jobs, selection).length;
  log(`Verification passed for ${count} jobs${options.release ? ' with release evidence' : ''}.`);
  return 0;
}
