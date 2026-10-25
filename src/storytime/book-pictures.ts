import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path, { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser } from 'playwright';
import type { Plugin } from 'vite';
import sharp, { type OverlayOptions } from 'sharp';
import { z } from 'zod';
import { buildTimeline, type Spec, type Stage, type Timeline } from '../song/timeline.js';

export const PICTURE_RUBRIC_VERSION = 'storytime-picture-v2';
export const RENDERER_ID = 'forge-song-timeline-book-still-v1';
export const LINEART_FORMAT_VERSION = 'storytime-lineart-provisional-v1';
export const LINEART_TECHNIQUE = 'song-page-scene-render-pass-1bit-v1';
export const BATCH_HASH_ALGORITHM =
  'SHA-256 of UTF-8 JSON.stringify([{file,sha256}]) with entries sorted by file and no whitespace';
export const PICTURE_SIZES = {
  story: { width: 3000, height: 2250 },
  cover: { width: 3600, height: 2700 },
  small: { width: 1500, height: 1500 },
} as const;
export const MINIMAX_VISION_MODEL = 'mmx-vision-default';

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
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== '{') continue;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
      const character = text[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\' && quoted) {
        escaped = true;
        continue;
      }
      if (character === '"') {
        quoted = !quoted;
        continue;
      }
      if (quoted) continue;
      if (character === '{') depth += 1;
      if (character === '}') depth -= 1;
      if (depth !== 0) continue;
      try {
        values.push(JSON.parse(text.slice(start, index + 1)));
      } catch {
        // A later brace can start the provider JSON object.
      }
      break;
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

export function buildBookStillTimeline(source: BookStageSource): Timeline {
  const timeline = buildTimeline(source.spec, source.stage);
  for (const actor of timeline.actors) actor.sings = [];
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
    sourceText: 'Owner-approved Nan character picture.',
    sourcePrompt:
      'The owner-approved Forge 3D Nan cutout shows Nan with the approved character look on a plain background.',
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

/** A production render stops until all four calibration logs hold their expected verdicts. */
export async function assertCalibrationReady(outputRoot: string): Promise<void> {
  for (const [id, expected] of Object.entries(CALIBRATION_EXPECTED_VERDICTS) as [
    CalibrationId,
    ReviewVerdict,
  ][]) {
    for (const provider of MODEL_PROVIDERS) {
      const raw = await readJsonIfExists(
        resolveOutputPath(outputRoot, `calibration/${id}-${provider}.json`),
      );
      const item = record(raw);
      const verdict = typeof item?.verdict === 'string' ? item.verdict.toLowerCase() : undefined;
      const rawOutput = typeof item?.rawOutput === 'string' ? item.rawOutput : '';
      if (verdict !== expected || !rawOutput.length) {
        throw new Error(
          `Calibration must pass before production renders: ${id} (${provider}) needs verdict ${expected} with raw output. Run the calibration pre-checks first.`,
        );
      }
    }
  }
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
      error: errorText(error),
    });
    throw error;
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
  if (/\bFAIL\b/i.test(rawOutput) && !/\bPASS\b/i.test(rawOutput)) {
    return { ...unclear, reason: 'The model reported FAIL without the required structure.' };
  }
  for (const value of jsonObjects(rawOutput).reverse()) {
    const item = record(value);
    if (!item || typeof item.verdict !== 'string') continue;
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
  return unclear;
}

async function rawPixels(png: Buffer): Promise<{ data: Buffer; width: number; height: number; channels: number }> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function hasWhiteCorners(png: Buffer, width: number, height: number): Promise<boolean> {
  const { data, channels } = await rawPixels(png);
  if (channels !== 3) return false;
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  return points.every(([x, y]) => {
    const index = (y! * width + x!) * channels;
    return data[index]! >= 250 && data[index + 1]! >= 250 && data[index + 2]! >= 250;
  });
}

/** A calm top region differs from its own dominant colour on at most two percent of its pixels. */
async function hasCalmTopRegion(png: Buffer, width: number, height: number): Promise<boolean> {
  const { data, channels } = await rawPixels(png);
  if (channels !== 3) return false;
  const regionHeight = Math.round(height * 0.3);
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let y = 0; y < regionHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels;
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
  if (!modal) return false;
  const mean = [modal.r / modal.count, modal.g / modal.count, modal.b / modal.count];
  let focal = 0;
  let total = 0;
  for (let y = 0; y < regionHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels;
      const spread = Math.max(
        Math.abs(data[index]! - mean[0]!),
        Math.abs(data[index + 1]! - mean[1]!),
        Math.abs(data[index + 2]! - mean[2]!),
      );
      if (spread > 32) focal += 1;
      total += 1;
    }
  }
  return focal / total <= 0.02;
}

async function inspectPng(
  png: Buffer,
  expected: { width: number; height: number },
  checks: { smallCorners?: boolean; calmTop?: boolean },
): Promise<PictureStructuralCheck> {
  const fileSha256 = sha256(png);
  try {
    const image = sharp(png);
    const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);
    const errors: string[] = [];
    if (metadata.format !== 'png') errors.push('Candidate must be a PNG file.');
    if (metadata.width !== expected.width || metadata.height !== expected.height) {
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
      metadata.width === expected.width &&
      metadata.height === expected.height &&
      metadata.channels === 3 &&
      !(await hasWhiteCorners(png, expected.width, expected.height))
    ) {
      errors.push('Small picture background corners must be white.');
    }
    if (
      checks.calmTop &&
      metadata.width === expected.width &&
      metadata.height === expected.height &&
      metadata.channels === 3 &&
      !(await hasCalmTopRegion(png, expected.width, expected.height))
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
  return inspectPng(png, expected, {
    ...(size === 'small' ? { smallCorners: true } : {}),
    ...(size === 'cover' ? { calmTop: true } : {}),
  });
}

/**
 * The interim line-art format checks (contract "Line-art twins (provisional format)"):
 * one opaque 8-bit grey channel, exactly 0 and 255 pixel values, a white background,
 * an edge frame at least 90 percent white, and 0.5 to 25 percent ink coverage.
 */
export async function inspectLineArtPng(
  png: Buffer,
  expected: { width: number; height: number },
): Promise<PictureStructuralCheck> {
  const fileSha256 = sha256(png);
  try {
    const metadata = await sharp(png).metadata();
    const errors: string[] = [];
    if (metadata.format !== 'png') errors.push('Line-art twin must be a PNG file.');
    if (metadata.width !== expected.width || metadata.height !== expected.height) {
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
    if (!errors.length && metadata.width && metadata.height) {
      // sharp expands a grey PNG to three raw channels, so force the b-w output space:
      // one channel, with 0 and 255 (and any grey probe value) preserved.
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
      const samples = Array.isArray(style.sampleFiles) ? style.sampleFiles : [];
      const bound = samples.some(
        (sample) =>
          isRecord(sample) && sample.file === file && (!structural.sha256 || sample.sha256 === structural.sha256),
      );
      if (!bound) styleErrors.push('line-art style look does not list the twin file with its SHA-256');
    }
  }
  const hardFailures = [...errors, ...personErrors, ...styleErrors];
  let status: LineArtManifest['status'];
  if (structural.errors.length || hardFailures.length) status = 'failed';
  else if (missingEvidence || personMissing || styleMissing || colorStatus !== 'ready') status = 'pending';
  else status = 'ready';
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
            evidenceFile,
          })
        : undefined;
      candidates.push(lineArt ? { ...candidate, lineArt } : candidate);
    }
  }
  return assembleManifest(jobs, candidates);
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

function serveBookFiles(repoRoot: string, stageDirectory: string): Plugin {
  const roots: Array<[string, string]> = [
    ['/out/', path.join(repoRoot, 'out')],
    ['/stage/', stageDirectory],
  ];
  return {
    name: 'storytime-book-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const hit = roots.find(([prefix]) => url.pathname.startsWith(prefix));
        if (!hit) return next();
        const [prefix, directory] = hit;
        const file = path.resolve(directory, decodeURIComponent(url.pathname.slice(prefix.length)));
        if (!inside(directory, file, false) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end('missing');
          return;
        }
        res.setHeader('content-type', FILE_TYPES[path.extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },
  };
}

declare global {
  interface Window {
    /** The song page has no scene hook yet; the engine-hook task must add it (contract "Line-art twins"). */
    __bookStill?: {
      scene: unknown;
      camera: unknown;
      renderer: unknown;
      /** The camera state after the seek: position, target, and field of view. */
      cameraState?: unknown;
    };
  }
}

const BOOK_STILL_HOOK_ERROR =
  'The song page does not expose its scene, camera, or renderer (no window.__bookStill hook). ' +
  'The line-art render pass is a pass of the same three.js scene, so it needs the engine hook task ' +
  'before a live book render; see the track contract "Line-art twins" and the test strategy section 8.';

export async function captureBookStill(input: BookCaptureInput): Promise<BookCapturePacket> {
  const { chromium } = await import('playwright');
  const { createServer } = await import('vite');
  const size = input.size ?? PICTURE_SIZES[input.job.size];
  const server = await createServer({
    root: input.repoRoot,
    configFile: false,
    logLevel: 'error',
    plugins: [serveBookFiles(input.repoRoot, path.dirname(input.stage.absoluteFile))],
    server: {
      port: 5900 + Math.floor(Math.random() * 300),
      strictPort: false,
      hmr: false,
      watch: null,
    },
  });
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
    const notes = await page.evaluate((timeline) => window.__song!.load(timeline), input.timeline);
    assertPageNotes(notes);
    await page.evaluate((at) => window.__song!.seek(at), input.stage.at);
    if (pageErrors.length) throw new Error(`Book page errors: ${pageErrors.join('; ')}`);
    const color = await page.screenshot({ type: 'png' });
    const hookReady = await page.evaluate(() => Boolean(window.__bookStill?.scene && window.__bookStill?.camera && window.__bookStill?.renderer));
    if (!hookReady) throw new Error(BOOK_STILL_HOOK_ERROR);
    // The line-art pass runs in the page against the same scene and camera as the color still.
    const lineArtDataUrl = await page.evaluate(async (passSize) => {
      const hook = window.__bookStill!;
      const THREE = await import('three');
      const scene = hook.scene as import('three').Scene;
      const camera = hook.camera as import('three').PerspectiveCamera;
      const renderer = hook.renderer as import('three').WebGLRenderer;
      const target = new THREE.WebGLRenderTarget(passSize.width, passSize.height);
      const previousTarget = renderer.getRenderTarget();
      const previousBackground = scene.background;
      const previousOverride = scene.overrideMaterial;
      const previousSize = new THREE.Vector2();
      renderer.getSize(previousSize);
      try {
        scene.background = new THREE.Color('#ffffff');
        scene.overrideMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: '#000000' });
        camera.aspect = passSize.width / passSize.height;
        camera.updateProjectionMatrix();
        renderer.setSize(passSize.width, passSize.height, false);
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        const pixels = new Uint8Array(passSize.width * passSize.height * 4);
        renderer.readRenderTargetPixels(target, 0, 0, passSize.width, passSize.height, pixels);
        // Threshold to 1 bit, flip the WebGL row order, and pack one grey channel.
        const canvas = document.createElement('canvas');
        canvas.width = passSize.width;
        canvas.height = passSize.height;
        const context = canvas.getContext('2d')!;
        const image = context.createImageData(passSize.width, passSize.height);
        for (let y = 0; y < passSize.height; y += 1) {
          const sourceRow = passSize.height - 1 - y;
          for (let x = 0; x < passSize.width; x += 1) {
            const value = pixels[(sourceRow * passSize.width + x) * 4]! < 128 ? 0 : 255;
            const offset = (y * passSize.width + x) * 4;
            image.data[offset] = value;
            image.data[offset + 1] = value;
            image.data[offset + 2] = value;
            image.data[offset + 3] = 255;
          }
        }
        context.putImageData(image, 0, 0);
        return canvas.toDataURL('image/png');
      } finally {
        renderer.setRenderTarget(previousTarget);
        renderer.setSize(previousSize.x, previousSize.y, false);
        scene.background = previousBackground;
        scene.overrideMaterial = previousOverride;
      }
    }, size);
    const lineArt = await sharp(
      Buffer.from(lineArtDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'),
    )
      .toColourspace('b-w')
      .png()
      .toBuffer();
    const cameraState = await page.evaluate(() => window.__bookStill?.cameraState ?? null);
    return { color: Buffer.from(color), lineArt, camera: cameraState };
  } finally {
    if (browser) await browser.close();
    await server.close();
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
  if (!options.dryRun) await assertCalibrationReady(options.outputRoot);
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
      results.push({ ...result, status: 'skipped' });
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
    const structural = await inspectPng(png, { width, height }, {
      ...(job.size === 'small' ? { smallCorners: true } : {}),
      ...(job.size === 'cover' ? { calmTop: true } : {}),
    });
    if (!structural.valid) throw new Error(`${job.id}: ${structural.errors.join(' ')}`);
    let linePng: Buffer | undefined;
    if (twin && packet.lineArt) {
      const lineStructural = await inspectLineArtPng(packet.lineArt, { width, height });
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
            lineArtTechnique: LINEART_TECHNIQUE,
          }
        : {}),
      width,
      height,
    };
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    await writeFile(absoluteFile, png, { flag: 'wx' });
    if (linePng && lineArtFile) {
      const absoluteLineFile = resolveOutputPath(options.outputRoot, lineArtFile);
      await mkdir(path.dirname(absoluteLineFile), { recursive: true });
      await writeFile(absoluteLineFile, linePng, { flag: 'wx' });
    }
    await writeJson(options.outputRoot, evidencePath, evidence, true);
    results.push({ ...result, status: 'rendered' });
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
  const result = await runPaidCall({
    paid: options.paid,
    dryRun: options.dryRun,
    details,
    appendLedger: (entry) => appendLedgerEntry(options.outputRoot, entry),
    call: async () => runner('mmx', args),
  });
  if (result === undefined) return { status: 'dry-run', args };
  const rawOutput = result.stdout || result.stderr;
  const parsed = parseModelReview(rawOutput);
  const review: ModelReview = {
    kind: 'model-pre-check',
    jobId: target.jobId,
    version: target.version,
    file: target.file,
    provider: 'minimax',
    model: MINIMAX_VISION_MODEL,
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
  const rawFile = resolveOutputPath(options.outputRoot, `${reviewBase}.txt`);
  await mkdir(path.dirname(rawFile), { recursive: true });
  await writeFile(rawFile, rawOutput, 'utf8');
  await writeJson(options.outputRoot, `${reviewBase}.json`, review);
  return { status: review.verdict, review, args };
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
  paid: boolean;
  dryRun: boolean;
  now?: () => Date;
  newCallId?: () => string;
  log?: (message: string) => void;
}): Promise<
  { status: 'dry-run'; prompt: string } | { status: 'begun'; callId: string } | { status: ReviewVerdict; review: ModelReview }
> {
  if (!options.paid && !options.dryRun) {
    throw new Error('Provider execution requires --paid. Use --dry-run to inspect the call.');
  }
  if (options.begin === Boolean(options.record)) {
    throw new Error('precheck-kimi needs exactly one of --begin or --record <callId>.');
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
  if (!options.raw) throw new Error('--record needs --raw <file> with the reviewer raw output.');
  const ledger = await readLedgerEntries(options.outputRoot);
  const begin = ledger.find((entry) => entry.event === 'before-call' && entry.callId === record);
  if (!begin) {
    throw new Error(
      `No matching before-call ledger entry for callId ${record}. Run precheck-kimi --begin first.`,
    );
  }
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
  const rawOutput = await readFile(options.raw, 'utf8');
  const parsed = parseModelReview(rawOutput);
  const reviewBase = options.calibration
    ? `calibration/${options.calibration}-kimi`
    : `reviews/${begin.jobId}-v${begin.version}-kimi`;
  const review: ModelReview = {
    kind: 'model-pre-check',
    jobId: begin.jobId,
    version: begin.version,
    file: begin.file,
    provider: 'kimi',
    model: KIMI_REVIEW_MODEL,
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
  await appendLedgerEntry(options.outputRoot, {
    ...details,
    purpose: begin.purpose,
    ...(begin.file ? { file: begin.file } : {}),
    jobId: begin.jobId,
    version: begin.version,
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
}

function parseWeek(value: string): number {
  const week = Number(value.toLowerCase().replace(/^w/, ''));
  if (!Number.isInteger(week) || week < 1 || week > 7) throw new Error(`Invalid week: ${value}`);
  return week;
}

function parseCli(argv: string[]): { command: string; options: CliOptions } {
  const [command, ...args] = argv;
  if (
    !command ||
    !['plan', 'render', 'precheck-minimax', 'precheck-kimi', 'manifest', 'sheet', 'verify'].includes(command)
  ) {
    throw new Error('Use plan, render, precheck-minimax, precheck-kimi, manifest, sheet, or verify.');
  }
  const options: CliOptions = { paid: false, dryRun: false, release: false, begin: false };
  const valueFlags = new Set([
    '--week', '--job', '--version', '--out', '--workbooks', '--calibration', '--output', '--record', '--raw',
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === '--paid') options.paid = true;
    else if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--release') options.release = true;
    else if (argument === '--begin') options.begin = true;
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
    runner?: ProviderRunner;
    capture?: BookCapture;
    readStage?: BookStageReader;
    log?: (message: string) => void;
  } = {},
): Promise<number> {
  const { command, options } = parseCli(argv);
  const repoRoot = path.resolve(dependencies.repoRoot ?? FORGE_ROOT);
  const outputRoot = resolveOutputRoot(repoRoot, options.out);
  const workbooksRoot = path.resolve(repoRoot, options.workbooks ?? DEFAULT_WORKBOOKS);
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
  if (command === 'render') {
    const jobs = await loadJobs(outputRoot);
    const results = await renderCandidates({
      jobs,
      outputRoot,
      repoRoot,
      ...selection,
      ...(options.version === undefined ? {} : { version: options.version }),
      dryRun: options.dryRun,
      ...(dependencies.capture ? { capture: dependencies.capture } : {}),
      ...(dependencies.readStage ? { readStage: dependencies.readStage } : {}),
    });
    for (const result of results) {
      log(
        `${result.jobId} v${result.version}: ${result.status}; stage ${result.stageSha256}; file ${result.file}` +
          `${result.lineArtFile ? `; lineart ${result.lineArtFile}` : ''}`,
      );
    }
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
      paid: options.paid,
      dryRun: options.dryRun,
      log,
    });
    if (result.status === 'dry-run') {
      log(result.prompt);
      return 0;
    }
    if (result.status === 'begun') return 0;
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
