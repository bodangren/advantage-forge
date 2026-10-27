import { createHash } from 'node:crypto';
import type { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { copyFile, lstat, mkdir, mkdtemp, readdir, readFile, readlink, rm, stat, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GESTURES } from '../src/song/timeline.js';
import {
  PICTURE_RUBRIC_VERSION, RENDERER_ID, assembleManifest, assertPageNotes,
  batchSha256, buildBookStillTimeline, buildManifest, buildReviewPrompt, buildStorytimeJobs,
  candidateFilename, candidateRelativePath, createContactSheet, decodeBookStage,
  evaluateCandidate, inspectCandidatePng, miniMaxPrecheckArgs, parseModelReview,
  precheckMiniMax, renderCandidates, resolveOutputRoot, runPaidCall, runStorytimeCli,
  stageRelativePath, verifyManifest,
  type BookStageSource, type CandidateManifest, type LedgerEntry, type ModelProvider,
  type PaidCallDetails, type PictureSize, type StorytimeJob,
} from '../src/storytime/book-pictures.js';
// Keep this import: the compiler reaches the command wrapper through this test.
import { runStorytimeBookPictures } from '../scripts/storytime-book-pictures.js';
import * as wrapperSeams from '../scripts/storytime-book-pictures.js';
import * as pictureSeams from '../src/storytime/book-pictures.js';

// These adapters isolate unspecified driver methods and packet fields from the assertions.
// Green may adapt these mappings to its driver. The event order and failure checks stay fixed.
type CaptureOperations = {
  seek(at: number): Promise<void>;
  screenshot(): Promise<Buffer>;
  cameraState(): Promise<unknown>;
  liveCameraState(): Promise<unknown>;
  lineArt(): Promise<Buffer>;
};
async function capturePairForTest(operations: CaptureOperations, input: unknown) {
  const seam = (pictureSeams as unknown as {
    captureStillPair(driver: CaptureOperations, input: unknown): Promise<{ color: Buffer; lineArt: Buffer; camera: unknown }>;
  }).captureStillPair;
  expect(seam, 'The captureStillPair seam exists.').toBeTypeOf('function');
  return seam(operations, input);
}
const SMOKE_FIXTURE = { width: 256, height: 256, center: [128, 128], radius: 80 };
async function smokePicture(kind: 'ring' | 'net' | 'gap') {
  const { width, height, center, radius } = SMOKE_FIXTURE;
  const pixels = Buffer.alloc(width * height, 255);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = x - center[0]!, dy = y - center[1]!;
    const distance = Math.hypot(dx, dy);
    const degrees = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    const gap = kind === 'gap' && degrees < 30;
    if ((Math.abs(distance - radius) <= 2 && !gap)
      || (kind === 'net' && distance < radius * 0.8 && (x % 8 === 0 || y % 8 === 0))) pixels[y * width + x] = 0;
  }
  return greyPng(pixels, width, height);
}
async function smokeCheckForTest(png: Buffer) {
  const seam = (pictureSeams as unknown as {
    checkLineArtSmoke(png: Buffer, fixture: typeof SMOKE_FIXTURE): unknown;
  }).checkLineArtSmoke;
  expect(seam, 'The checkLineArtSmoke seam exists.').toBeTypeOf('function');
  // A check can throw or return a verdict. This adapter does not fix that return shape.
  try {
    const result = await seam(png, SMOKE_FIXTURE);
    if (typeof result === 'boolean') return result;
    if (result && typeof result === 'object') {
      if ('valid' in result) return result.valid === true;
      if ('errors' in result && Array.isArray(result.errors)) return result.errors.length === 0;
    }
    if (result === undefined) return true;
    throw new Error('Adapt the smoke verdict adapter to the implemented return shape.');
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Adapt the smoke')) throw error;
    return false;
  }
}
function smokeCaptureForTest() {
  return { ...capturePacket(), fixtureLineArt: undefined as Buffer | undefined, fixture: SMOKE_FIXTURE };
}

const forbidden = vi.hoisted(() => {
  const guard = (name: string) => vi.fn(() => { throw new Error(`Forbidden real operation: ${name}`); });
  return {
    spawn: guard('spawn'), spawnSync: guard('spawnSync'), exec: guard('exec'),
    execSync: guard('execSync'), execFile: guard('execFile'), execFileSync: guard('execFileSync'),
    fork: guard('fork'), launch: guard('chromium.launch'), createServer: guard('createServer'),
  };
});
const viteConfigCalls = vi.hoisted(() => [] as unknown[]);
vi.mock('node:child_process', () => ({
  spawn: forbidden.spawn, spawnSync: forbidden.spawnSync, exec: forbidden.exec,
  execSync: forbidden.execSync, execFile: forbidden.execFile,
  execFileSync: forbidden.execFileSync, fork: forbidden.fork,
}));
vi.mock('playwright', () => ({ chromium: { launch: forbidden.launch } }));
vi.mock('vite', () => ({ createServer: (config: unknown) => {
  viteConfigCalls.push(config);
  return forbidden.createServer();
} }));

// Fixture decoding and filesystem checks have no five-second performance contract.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const WORKBOOKS = path.resolve(import.meta.dirname, '../../Workbooks');
const SIZES = { story: [3000, 2250], cover: [3600, 2700], small: [1500, 1500] } as const;
const CLOCK = () => new Date('2026-10-25T12:00:00.000Z');
let root: string;
let jobs: StorytimeJob[];
let storyPng: Buffer;
let linePng: Buffer;

const CAMERA = { position: [0, 1, 5], target: [0, 0.5, 0], fov: 45 };
const COLOR_PATTERN = /^l2-w0[1-7]-(readalong|decodable|cover|small)-[a-z0-9]+(-[a-z0-9]+)*-v[1-9][0-9]*\.png$/;
const LINE_PATTERN = /^l2-w0[1-7]-(readalong|decodable)-[a-z0-9]+(-[a-z0-9]+)*-v[1-9][0-9]*-lineart\.png$/;

function linePath(currentJob = job(), version = 1) {
  return `${currentJob.directory}/lineart/${candidateFilename(currentJob, version).replace(/\.png$/, '-lineart.png')}`;
}
// This adapter isolates the mock shape. Green may change the adapter, not the observable assertions.
function capturePacket(color = storyPng, lineArt: Buffer | undefined = linePng) {
  return { color, lineArt, camera: structuredClone(CAMERA) };
}
type TwinRenderOptions = Omit<Parameters<typeof renderCandidates>[0], 'capture'> & {
  capture: (...args: unknown[]) => Promise<unknown>;
  width?: number;
  height?: number;
};
function renderTwins(options: TwinRenderOptions) {
  return (renderCandidates as unknown as (options: TwinRenderOptions) => ReturnType<typeof renderCandidates>)(options);
}
type OutputOptions = Parameters<typeof verifyManifest>[1] & { output?: 'color' | 'lineart' };
type CliCapture = NonNullable<NonNullable<Parameters<typeof runStorytimeCli>[1]>['capture']>;
function verifyOutput(manifest: Awaited<ReturnType<typeof buildManifest>>, options: OutputOptions) {
  return (verifyManifest as (manifest: Awaited<ReturnType<typeof buildManifest>>, options: OutputOptions) => string[])(manifest, options);
}
type LineArtView = {
  file: string; fileSha256: string; colorFile: string; renderEvidenceFile: string;
  status: 'ready' | 'pending' | 'failed'; structural: { valid: boolean; errors: string[] };
};
function lineView(manifest: Awaited<ReturnType<typeof buildManifest>>, version = 1): LineArtView {
  const candidate = manifest.jobs[0]!.candidates.find((item) => item.version === version);
  expect(candidate, 'The job version exists.').toBeDefined();
  const twin = (candidate as CandidateManifest & { lineArt?: LineArtView }).lineArt;
  expect(twin, 'The manifest lists the line-art twin.').toBeDefined();
  return twin!;
}

function digest(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}
function job(): StorytimeJob { return jobs[0]!; }
async function sandbox() {
  const repoRoot = await mkdtemp(path.join(root, 'repo-'));
  const outputRoot = path.join(repoRoot, 'out/storytime/l2/unit1');
  await mkdir(outputRoot, { recursive: true });
  return { repoRoot, outputRoot };
}
async function put(file: string, bytes: Buffer | string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}
async function json(file: string, value: unknown) { await put(file, JSON.stringify(value)); }
async function copyPackages(repoRoot: string, includeW08 = false) {
  const workbooksRoot = path.join(repoRoot, 'Workbooks');
  const directory = path.join(workbooksRoot, 'content/storytime/l2');
  await mkdir(directory, { recursive: true });
  for (let week = 1; week <= (includeW08 ? 8 : 7); week++) {
    const name = `w${String(week).padStart(2, '0')}.json`;
    await copyFile(path.join(WORKBOOKS, 'content/storytime/l2', name), path.join(directory, name));
  }
  return workbooksRoot;
}
function stageSource(currentJob = job(), version = 1): BookStageSource {
  return {
    jobId: currentJob.id, version, at: 0.5,
    spec: {
      title: currentJob.bookTitle, duration: 2,
      lines: [{ text: currentJob.text, start: 0, end: 1, actors: ['Pat'], gesture: 'wave' }],
    },
    stage: {
      scene: 'classroom', dog: 'quiet', marks: { Pat: { x: 0, z: 0, yaw: 0 } },
      camera: [{ at: 0, az: 0, el: 12, dist: 4.8, tx: 0, tz: 0 }],
    },
  };
}
function stageFile(repoRoot: string, currentJob = job(), version = 1) {
  return decodeBookStage({
    bytes: Buffer.from(JSON.stringify(stageSource(currentJob, version))),
    job: currentJob, version, repoRoot,
  });
}
function modelReview(currentJob: StorytimeJob, version: number, provider: ModelProvider, png = storyPng) {
  return {
    kind: 'model-pre-check' as const, jobId: currentJob.id, version,
    file: candidateRelativePath(currentJob, version), provider, model: `test-${provider}`,
    price: { basis: 'Test fixture', marginalCashUsd: 0 as const, note: 'No paid call.' },
    rubricVersion: PICTURE_RUBRIC_VERSION, sourceText: currentJob.text,
    sourcePrompt: currentJob.sourcePrompt, time: 'still' as const, verdict: 'pass' as const,
    reason: 'The fixture passes.', observedCounts: { subject: 1 }, issues: [],
    rawOutput: '{"verdict":"PASS"}', checkedAt: CLOCK().toISOString(), fileSha256: digest(png),
  };
}
function personReview(currentJob: StorytimeJob, version: number, png = storyPng) {
  return {
    kind: 'person-count' as const, jobId: currentJob.id, version,
    file: candidateRelativePath(currentJob, version), sourceText: currentJob.text,
    sourcePrompt: currentJob.sourcePrompt, time: 'still' as const, verdict: 'pass' as const,
    observedCounts: { subject: 1 }, checkedBy: 'Test reviewer', checkedAt: CLOCK().toISOString(),
    evidenceClass: 'person-checked' as const, fileSha256: digest(png),
    rubricVersion: PICTURE_RUBRIC_VERSION,
  };
}
function candidateInput(currentJob = job(), version = 1) {
  const stage = stageFile(root, currentJob, version);
  const file = candidateRelativePath(currentJob, version);
  return {
    job: currentJob, version, file, png: storyPng,
    stage: { file: stage.file, sha256: stage.sha256, at: stage.at },
    render: {
      renderer: RENDERER_ID, jobId: currentJob.id, version, file,
      stageFile: stage.file, stageSha256: stage.sha256, at: stage.at, warnings: [],
    },
    reviews: {
      minimax: modelReview(currentJob, version, 'minimax'),
      kimi: modelReview(currentJob, version, 'kimi'), person: personReview(currentJob, version),
    },
  };
}
async function picture(size: PictureSize, background = '#ffffff', focalTop = false): Promise<Buffer> {
  const [width, height] = SIZES[size];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${background}"/><circle cx="${width / 2}" cy="${height * (focalTop ? 0.15 : 0.65)}" r="${height * 0.12}" fill="#456a86"/></svg>`;
  return sharp(Buffer.from(svg)).flatten({ background: '#ffffff' }).toColourspace('srgb').png().toBuffer();
}
async function tree(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await tree(file)); else files.push(file);
  }
  return files.sort();
}
async function planned(repoRoot: string, outputRoot: string, workbooksRoot = WORKBOOKS, extra: string[] = []) {
  const log = vi.fn();
  const code = await runStorytimeCli(['plan', '--out', outputRoot, '--workbooks', workbooksRoot, ...extra], { repoRoot, log });
  expect(code).toBe(0);
  return JSON.parse(await readFile(path.join(outputRoot, 'jobs.json'), 'utf8')) as StorytimeJob[];
}
async function seedCalibration(outputRoot: string, repoRoot: string, workbooksRoot = path.join(repoRoot, 'Workbooks')) {
  // Synthetic logs isolate render tests. These files are not live provider evidence.
  for (const id of ['bad-one-sun', 'good-nan'] as const) {
    const target = pictureSeams.calibrationTarget(id, workbooksRoot, repoRoot);
    const sourceText = id === 'good-nan' ? 'Hello, I am Nan.' : 'How many suns? One sun!';
    const sourcePrompt = id === 'good-nan'
      ? 'Nan, a five-year-old girl with large dark-brown eyes, short black hair in two small bunches, an orange T-shirt with a white star, red shorts, and white sneakers.'
      : 'The picture must show exactly one sun. The picture must agree with the source text.';
    // Both roots belong to this test. The helper never writes a live calibration source.
    if (!path.resolve(repoRoot).startsWith(`${path.resolve(root)}${path.sep}`)
      || !path.resolve(workbooksRoot).startsWith(`${path.resolve(root)}${path.sep}`)) {
      throw new Error('Calibration fixture sources require temporary roots.');
    }
    await put(target.file, storyPng);
    for (const provider of ['minimax', 'kimi'] as const) {
      await json(path.join(outputRoot, `calibration/${id}-${provider}.json`), {
        ...modelReview({ ...job(), id }, 1, provider),
        file: target.file, sourceText, sourcePrompt, rubricVersion: PICTURE_RUBRIC_VERSION,
        fileSha256: digest(storyPng),
        verdict: id === 'bad-one-sun' ? 'fail' : 'pass',
        rawOutput: `Synthetic ${id} fixture`,
      });
    }
  }
  return { repoRoot, workbooksRoot };
}

function binaryPixels(width = 3000, height = 2250, share = 0.05): Buffer {
  const pixels = Buffer.alloc(width * height, 255);
  const count = Math.round(pixels.length * share);
  let written = 0;
  // Keep ink away from the edge frame. The pixel count determines the measured share.
  for (let y = Math.ceil(height * 0.1); y < height * 0.9 && written < count; y++) {
    for (let x = Math.ceil(width * 0.1); x < width * 0.9 && written < count; x++) {
      pixels[y * width + x] = 0; written++;
    }
  }
  if (written !== count) throw new Error('The fixture ink does not fit.');
  return pixels;
}
async function greyPng(pixels: Buffer, width = 3000, height = 2250) {
  return sharp(pixels, { raw: { width, height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
}
async function twinFixture(options: { line?: Buffer; version?: number; color?: Buffer } = {}) {
  const space = await sandbox();
  const currentJob = job();
  const version = options.version ?? 1;
  const color = options.color ?? storyPng;
  const line = options.line ?? linePng;
  const stage = stageFile(space.repoRoot, currentJob, version);
  const file = candidateRelativePath(currentJob, version);
  const lineArtFile = linePath(currentJob, version);
  const evidenceFile = `renders/${currentJob.id}-v${version}.json`;
  const evidence = {
    renderer: RENDERER_ID, jobId: currentJob.id, version, stageFile: stage.file,
    stageSha256: stage.sha256, at: stage.at, camera: structuredClone(CAMERA),
    file, colorFile: file, colorSha256: digest(color), lineArtFile,
    lineArtSha256: digest(line), lineArtFormatVersion: 'test-provisional-v1',
    lineArtTechnique: 'test-scene-pass', width: 3000, height: 2250, warnings: [],
  };
  const personFile = `reviews/${currentJob.id}-v${version}-lineart-person.json`;
  const linePerson = { ...personReview(currentJob, version, line), file: lineArtFile };
  const styleFile = 'reviews/lineart-style-look.json';
  const style = {
    verdict: 'pass', checkedBy: 'Daniel', relayedBy: 'Test PM relay', checkedAt: CLOCK().toISOString(),
    evidenceClass: 'owner-passed',
    lineArtTechnique: evidence.lineArtTechnique, lineArtFormatVersion: evidence.lineArtFormatVersion,
    sampleFiles: [{ file, sha256: digest(color) }, { file: lineArtFile, sha256: digest(line) }],
  };
  await put(path.join(space.repoRoot, stage.file), stage.bytes);
  await put(path.join(space.outputRoot, file), color);
  await put(path.join(space.outputRoot, lineArtFile), line);
  await json(path.join(space.outputRoot, evidenceFile), evidence);
  for (const provider of ['minimax', 'kimi'] as const) {
    await json(path.join(space.outputRoot, `reviews/${currentJob.id}-v${version}-${provider}.json`), modelReview(currentJob, version, provider, color));
  }
  await json(path.join(space.outputRoot, `reviews/${currentJob.id}-v${version}-person.json`), personReview(currentJob, version, color));
  await json(path.join(space.outputRoot, personFile), linePerson);
  await json(path.join(space.outputRoot, styleFile), style);
  return { ...space, currentJob, version, stage, file, lineArtFile, evidenceFile, evidence, personFile, linePerson, styleFile, style,
    manifest: () => buildManifest([currentJob], space.outputRoot, space.repoRoot) };
}
async function inspectLineFixture(line: Buffer) {
  const fixture = await twinFixture({ line });
  return lineView(await fixture.manifest());
}

beforeAll(async () => {
  root = await mkdtemp('/tmp/opencode/storytime-red-');
  jobs = buildStorytimeJobs({ workbooksRoot: WORKBOOKS });
  storyPng = await picture('story');
  linePng = await greyPng(binaryPixels());
});
afterEach(() => {
  for (const operation of Object.values(forbidden)) expect(operation).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
afterAll(async () => { if (root) await rm(root, { recursive: true, force: true }); });

// These adapters give missing exports an assertion failure instead of a module load failure.
type Awaitable<T> = T | Promise<T>;
type CaptureInput = Parameters<typeof pictureSeams.captureBookStill>[0];
type FileMiddleware = (req: { url: string }, res: {
  statusCode: number; setHeader: (name: string, value: string) => void;
  end: (bytes?: string | Uint8Array) => void;
}, next: () => void) => Awaitable<void>;
type BookFilePlugin = {
  name: string;
  configureServer(server: { middlewares: { use: (middleware: FileMiddleware) => void } }): Awaitable<unknown>;
  stats(): { served: number; refused: number };
};
type BookConfig = {
  server: { host?: string; fs?: { strict?: boolean; deny?: string[] } };
  plugins: BookFilePlugin[];
};
type SecuritySeams = {
  bookFileAllowlist(input: { repoRoot: string; stageDirectory: string; timeline: CaptureInput['timeline'] }): Awaitable<unknown>;
  resolveBookFile(allowlist: unknown, requestPath: string): Awaitable<string | undefined>;
  serveBookFiles(allowlist: unknown): BookFilePlugin;
  bookServerConfig(input: CaptureInput): Awaitable<BookConfig>;
  writeOutputFile(outputRoot: string, relativeFile: string, bytes: Buffer | string): Awaitable<void>;
  secretFindings(text: string, env?: NodeJS.ProcessEnv): string[];
  redactSecrets(text: string, env?: NodeJS.ProcessEnv): string;
  readRawAnswer(file: string): Awaitable<string>;
};
function securitySeam<K extends keyof SecuritySeams>(name: K): SecuritySeams[K] {
  const seam = (pictureSeams as unknown as SecuritySeams)[name];
  expect(seam, `The ${name} seam exists.`).toBeTypeOf('function');
  return seam;
}
async function middlewareDriver(plugin: BookFilePlugin) {
  const handlers: FileMiddleware[] = [];
  await plugin.configureServer({ middlewares: { use: (handler) => { handlers.push(handler); } } });
  expect(handlers).toHaveLength(1);
  return async (url: string) => {
    const next = vi.fn();
    const chunks: Buffer[] = [];
    const res = { statusCode: 200, setHeader: vi.fn(), end: vi.fn((bytes?: string | Uint8Array) => {
      if (bytes !== undefined) chunks.push(Buffer.from(bytes));
    }) };
    await handlers[0]!({ url }, res, next);
    return { res, next, body: Buffer.concat(chunks) };
  };
}
async function fileSnapshot(directory: string) {
  return Promise.all((await tree(directory)).map(async (file) => {
    const state = (await lstat(file)).isSymbolicLink() ? `symlink:${await readlink(file)}` : digest(await readFile(file));
    return [path.relative(directory, file), state] as const;
  }));
}
async function securityLedger(outputRoot: string): Promise<Record<string, unknown>[]> {
  const file = path.join(outputRoot, 'cost-ledger.jsonl');
  return existsSync(file) ? (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
}
function syntheticCredentials() {
  const marker = ['SYN', 'THETIC'].join('');
  const jwt = ['{"alg":"none"}', JSON.stringify({ sub: marker }), marker]
    .map((value) => Buffer.from(value).toString('base64url')).join('.');
  const values = [
    `sk-${marker}${'0'.repeat(20)}`,
    `Authorization: Bearer ${marker}BEARER${'0'.repeat(13)}`,
    `-----BEGIN PRIVATE KEY-----\n${marker}\n-----END PRIVATE KEY-----`,
    `AKIA0000${marker}000`, `api_key=${marker}-api-key-000000`, jwt,
    `plainvalue-${marker}-0001`,
  ];
  vi.stubEnv('STORYTIME_SYNTHETIC_API_KEY', values.at(-1)!);
  return values;
}
async function assertNoSyntheticValues(directories: string[], values: string[]) {
  for (const directory of directories) for (const file of await tree(directory)) {
    // The outside directory gets its own scan. A directory symlink is not a file.
    if ((await stat(file)).isDirectory()) continue;
    const bytes = await readFile(file);
    for (const [index, value] of values.entries()) {
      expect.soft(bytes.includes(Buffer.from(value)), `${path.relative(directory, file)}: synthetic fixture ${index}`).toBe(false);
    }
  }
}
async function securityKimiFixture() {
  const space = await sandbox();
  const outside = await mkdtemp(path.join(root, 'outside-'));
  await planned(space.repoRoot, space.outputRoot);
  await put(path.join(space.outputRoot, candidateRelativePath(job(), 1)), storyPng);
  const args = ['precheck-kimi', '--out', space.outputRoot, '--paid'];
  const deps = { repoRoot: space.repoRoot, log: vi.fn() };
  await runStorytimeCli([...args, '--job', job().id, '--version', '1', '--begin'], deps);
  const callId = String((await securityLedger(space.outputRoot))[0]!.callId);
  const raw = path.join(outside, 'answer.txt');
  return { ...space, outside, args, deps, callId, raw };
}
async function styleManifestFixture() {
  const sample = await twinFixture();
  const selected = jobs.slice(0, 3);
  for (const [index, current] of selected.entries()) {
    if (index === 0) continue;
    const stage = stageFile(sample.repoRoot, current);
    const file = candidateRelativePath(current, 1), lineArtFile = linePath(current, 1);
    await put(path.join(sample.repoRoot, stage.file), stage.bytes);
    await put(path.join(sample.outputRoot, file), storyPng);
    await put(path.join(sample.outputRoot, lineArtFile), linePng);
    await json(path.join(sample.outputRoot, `renders/${current.id}-v1.json`), {
      ...sample.evidence, jobId: current.id, stageFile: stage.file, stageSha256: stage.sha256,
      file, colorFile: file, lineArtFile,
      lineArtTechnique: index === 2 ? 'synthetic-other-technique' : sample.evidence.lineArtTechnique,
    });
    for (const provider of ['minimax', 'kimi'] as const) {
      await json(path.join(sample.outputRoot, `reviews/${current.id}-v1-${provider}.json`), modelReview(current, 1, provider));
    }
    await json(path.join(sample.outputRoot, `reviews/${current.id}-v1-person.json`), personReview(current, 1));
    await json(path.join(sample.outputRoot, `reviews/${current.id}-v1-lineart-person.json`), {
      ...personReview(current, 1, linePng), file: lineArtFile,
    });
  }
  const states = async () => (await buildManifest(selected, sample.outputRoot, sample.repoRoot)).jobs
    .map((item) => (item.candidates[0] as CandidateManifest & { lineArt: LineArtView }).lineArt.status);
  return { ...sample, states };
}

describe('Review B security remediation', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('T77: the render wrapper preserves argv and the hold code without a shell string', async () => {
    vi.stubEnv('STORYTIME_BOOK_PICTURES_INNER', undefined);
    const argv = ['render', '--job', '$(printf RB_SUBSTITUTION_EXECUTED)'];
    for (const status of [0, 75]) {
      const calls: Parameters<typeof spawnSync>[] = [];
      const spawn = ((...args: Parameters<typeof spawnSync>) => {
        calls.push(args);
        return { status, signal: null, pid: 0, output: [], stdout: null, stderr: null };
      }) as unknown as typeof spawnSync;
      // HEAD has no spawn dependency. Keep its guarded fallback from creating a second failure in T12.
      let code: number | undefined;
      let error: unknown;
      try { code = await runStorytimeBookPictures(argv, { spawn } as Parameters<typeof runStorytimeBookPictures>[1]); }
      catch (caught) { error = caught; }
      finally { forbidden.spawnSync.mockClear(); }
      expect(error, 'The wrapper uses the injected spawn.').toBeUndefined();
      expect(code).toBe(status);
      expect(calls).toHaveLength(1);
      const [command, args, options] = calls[0]!;
      expect(command).toBe('bash');
      expect(args![0]).toBe('/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh');
      expect(args).not.toContain('-c');
      expect(args!.slice(-3)).toEqual(argv);
      expect(options?.env?.STORYTIME_BOOK_PICTURES_INNER).toBe('1');
      expect(options?.shell ?? false).toBe(false);
    }
  });

  it('T78: the file server allows named files and refuses physical escapes without next', async () => {
    const allow = securitySeam('bookFileAllowlist');
    const resolve = securitySeam('resolveBookFile');
    const serve = securitySeam('serveBookFiles');
    const space = await sandbox();
    const outside = await mkdtemp(path.join(root, 'outside-'));
    const outsideBytes = Buffer.from('SYNTHETIC outside file sentinel');
    await put(path.join(outside, 'ghost.glb'), outsideBytes);
    await put(path.join(outside, 'evil.glb'), outsideBytes);
    await mkdir(path.join(space.repoRoot, 'out/ghost'));
    await symlink(path.join(outside, 'ghost.glb'), path.join(space.repoRoot, 'out/ghost/ghost.glb'));
    await symlink(outside, path.join(space.repoRoot, 'out/evil'));
    const hero = path.join(space.repoRoot, 'out/hero/hero.glb');
    const stageDirectory = path.join(space.repoRoot, 'docs/stage');
    const sign = path.join(stageDirectory, 'sign.png');
    await put(hero, 'SYNTHETIC hero GLB');
    await put(sign, 'SYNTHETIC sign bytes');
    await put(path.join(stageDirectory, 'other.png'), 'SYNTHETIC unnamed picture');
    await put(path.join(space.repoRoot, 'out/hero/hero.json'), 'SYNTHETIC wrong extension');
    const protectedPaths = ['l2/unit1/cost-ledger.jsonl', 'l2/unit1/raw/answer.txt',
      'l2/unit1/calibration/log.json', 'l2/unit1/candidates/prompt.txt', 'storytime.glb'];
    for (const relative of protectedPaths) await put(path.join(space.repoRoot, 'out/storytime', relative), 'SYNTHETIC private evidence');
    const source = stageSource();
    source.stage.sets = { classroom: { pictures: [{ file: 'sign.png', x: 0, y: 1, z: 0, w: 1 }] } };
    const timeline = buildBookStillTimeline(source);
    expect(timeline.shots.flatMap((shot) => shot.pictures.map((picture) => picture.file))).toContain('sign.png');
    const allowlist = await allow({ repoRoot: space.repoRoot, stageDirectory, timeline });
    const plugin = serve(allowlist);
    expect(plugin.name).toBe('storytime-book-files');
    const request = await middlewareDriver(plugin);
    for (const [url, file] of [['/out/hero/hero.glb', hero], ['/stage/sign.png', sign]]) {
      expect(await resolve(allowlist, url!)).toBe(file);
      const response = await request(url!);
      expect(response.res.statusCode).toBe(200);
      expect(response.body).toEqual(await readFile(file!));
      expect(response.next).not.toHaveBeenCalled();
      expect(response.res.end).toHaveBeenCalledOnce();
    }
    const ledger = path.join(space.outputRoot, 'cost-ledger.jsonl');
    const refused = ['/out/ghost/ghost.glb', '/out/evil/evil.glb',
      ...protectedPaths.map((relative) => `/out/storytime/${relative}`),
      '/out/hero/../storytime/l2/unit1/cost-ledger.jsonl',
      '/out/hero/%2e%2e/storytime/l2/unit1/cost-ledger.jsonl',
      `/@fs/${ledger}`, '/stage/other.png', '/out/hero/hero.json',
      '/%6fut/storytime/l2/unit1/cost-ledger.jsonl', '/out/%ZZ/hero.glb'];
    for (const url of refused) {
      expect.soft(await resolve(allowlist, url), url).toBeUndefined();
      const response = await request(url);
      expect.soft(response.res.statusCode, url).toBe(404);
      expect.soft(response.next, url).not.toHaveBeenCalled();
      expect.soft(response.res.end, url).toHaveBeenCalledOnce();
      expect.soft(response.body.includes(outsideBytes), url).toBe(false);
      expect.soft(response.body.toString(), url).not.toContain('SYNTHETIC private evidence');
    }
    await rm(sign);
    await symlink(path.join(outside, 'ghost.glb'), sign);
    expect.soft(await resolve(allowlist, '/stage/sign.png')).toBeUndefined();
    const escapedSign = await request('/stage/sign.png');
    expect.soft(escapedSign.res.statusCode).toBe(404);
    expect.soft(escapedSign.next).not.toHaveBeenCalled();
    expect.soft(escapedSign.body.includes(outsideBytes)).toBe(false);
    const unrelated = await request('/src/song/main.ts');
    expect(unrelated.next).toHaveBeenCalledOnce();
    expect(unrelated.res.end).not.toHaveBeenCalled();
    expect(plugin.stats()).toEqual({ served: 2, refused: refused.length + 1 });
  });

  it('T79: the production opener uses the loopback server and the protected file plugin', async () => {
    securitySeam('bookServerConfig');
    const space = await sandbox();
    const input: CaptureInput = { repoRoot: space.repoRoot, job: job(), stage: stageFile(space.repoRoot),
      timeline: buildBookStillTimeline(stageSource()), size: { width: 3000, height: 2250 } };
    await put(path.join(space.outputRoot, 'cost-ledger.jsonl'), 'SYNTHETIC private ledger');
    viteConfigCalls.length = 0;
    try { await expect(pictureSeams.captureBookStill(input)).rejects.toThrow('Forbidden real operation: createServer'); }
    finally {
      // The vite mock throws before any server starts. All other guards remain active.
      expect(forbidden.createServer).toHaveBeenCalledOnce();
      forbidden.createServer.mockClear();
    }
    expect(viteConfigCalls).toHaveLength(1);
    const config = viteConfigCalls[0] as BookConfig;
    expect(config.server.host).toBe('127.0.0.1');
    expect(config.server.fs?.strict).toBe(true);
    expect(config.server.fs?.deny).toContain('out/storytime/**');
    const plugins = config.plugins.filter((plugin) => plugin.name === 'storytime-book-files');
    expect(plugins).toHaveLength(1);
    const request = await middlewareDriver(plugins[0]!);
    const response = await request('/out/storytime/l2/unit1/cost-ledger.jsonl');
    expect(response.res.statusCode).toBe(404);
    expect(response.next).not.toHaveBeenCalled();
    expect(response.body.toString()).not.toContain('SYNTHETIC private ledger');
  });

  it('T80: exclusive output writes and the smoke writer refuse existing paths and symlink escapes', async () => {
    const write = securitySeam('writeOutputFile');
    const values = syntheticCredentials();
    const space = await sandbox();
    const outside = await mkdtemp(path.join(root, 'outside-'));
    const target = path.join(outside, 'unchanged.txt');
    await put(target, 'SYNTHETIC outside sentinel');
    await write(space.outputRoot, 'new.txt', Buffer.from('SYNTHETIC new bytes'));
    expect(await readFile(path.join(space.outputRoot, 'new.txt'), 'utf8')).toBe('SYNTHETIC new bytes');
    await expect(Promise.resolve().then(() => write(space.outputRoot, 'new.txt', 'replacement'))).rejects.toThrow();
    expect(await readFile(path.join(space.outputRoot, 'new.txt'), 'utf8')).toBe('SYNTHETIC new bytes');
    await symlink(target, path.join(space.outputRoot, 'linked.txt'));
    const saved = await fileSnapshot(outside);
    await expect(Promise.resolve().then(() => write(space.outputRoot, 'linked.txt', 'replacement'))).rejects.toThrow();
    expect(await fileSnapshot(outside)).toEqual(saved);
    const stamp = `lineart-${CLOCK().toISOString().replace(/[:.]/g, '-')}`;
    const packet = { ...smokeCaptureForTest(), fixtureLineArt: await smokePicture('ring') };
    for (const mode of ['directory-link', 'file-link', 'clean'] as const) {
      const fixture = await sandbox();
      await planned(fixture.repoRoot, fixture.outputRoot);
      if (mode === 'directory-link') await symlink(outside, path.join(fixture.outputRoot, 'smoke'));
      if (mode === 'file-link') {
        await mkdir(path.join(fixture.outputRoot, 'smoke', stamp), { recursive: true });
        await symlink(target, path.join(fixture.outputRoot, 'smoke', stamp, 'color.png'));
      }
      const before = await fileSnapshot(fixture.outputRoot);
      const action = runStorytimeCli(['lineart-smoke', '--out', fixture.outputRoot, '--job', job().id], {
        repoRoot: fixture.repoRoot, log: vi.fn(), now: CLOCK,
        readStage: async () => stageFile(fixture.repoRoot), capture: (async () => packet) as unknown as CliCapture,
      });
      if (mode === 'clean') {
        expect(await action).toBe(0);
        const added = (await tree(fixture.outputRoot)).filter((file) => !before.some(([relative]) => path.join(fixture.outputRoot, relative) === file));
        expect(added.map((file) => path.relative(fixture.outputRoot, file))).toEqual(
          ['color.png', 'fixture-lineart.png', 'lineart.png', 'smoke.json'].map((name) => `smoke/${stamp}/${name}`));
      } else {
        await expect(action, mode).rejects.toThrow();
        expect(await fileSnapshot(fixture.outputRoot), mode).toEqual(before);
      }
      expect(await fileSnapshot(outside), mode).toEqual(saved);
      await assertNoSyntheticValues([fixture.outputRoot, outside], values);
    }
  });

  it('T81: credential findings name patterns and provider failures persist only bounded redacted text', async () => {
    const findings = securitySeam('secretFindings');
    const redact = securitySeam('redactSecrets');
    const values = syntheticCredentials();
    for (const [index, value] of values.entries()) {
      const found = findings(value);
      expect.soft(found.length, `Synthetic fixture ${index}`).toBeGreaterThan(0);
      for (const pattern of found) {
        expect.soft(pattern).toEqual(expect.any(String));
        expect.soft(pattern.length).toBeGreaterThan(0);
        expect.soft(pattern).not.toContain(value);
      }
      expect.soft(redact(value), `Synthetic fixture ${index}`).not.toContain(value);
      expect.soft(redact(value)).toContain('[redacted:');
    }
    const errorText = `mmx exited with 1: ${values.join('\n')} ${'SYNTHETIC detail '.repeat(80)}`;
    const space = await sandbox();
    const outside = await mkdtemp(path.join(root, 'outside-'));
    const entries: LedgerEntry[] = [];
    const details: PaidCallDetails = { operation: 'vision-describe', provider: 'minimax', model: 'synthetic-model',
      purpose: 'Synthetic failure test', jobId: job().id, version: 1,
      price: { basis: 'Test fixture', marginalCashUsd: 0, note: 'No paid call.' } };
    await expect(runPaidCall({ paid: true, dryRun: false, details, now: CLOCK,
      newCallId: () => 'synthetic-error-call', call: async () => { throw new Error(errorText); },
      appendLedger: async (entry) => {
        entries.push(entry);
        await put(path.join(space.outputRoot, 'cost-ledger.jsonl'), entries.map((item) => JSON.stringify(item)).join('\n'));
      },
    })).rejects.toThrow();
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({ event: 'after-call', status: 'failure' });
    const error = (entries[1] as unknown as { error: string }).error;
    expect(error).toContain('[redacted:');
    expect(error.length).toBeLessThanOrEqual(500);
    for (const value of values) expect.soft(error).not.toContain(value);
    const mini = await sandbox();
    await put(path.join(mini.outputRoot, candidateRelativePath(job(), 1)), storyPng);
    await expect(precheckMiniMax({ ...mini, jobs: [job()], jobId: job().id, version: 1,
      paid: true, dryRun: false, runner: async () => { throw new Error(errorText); } })).rejects.toThrow();
    const failures = (await securityLedger(mini.outputRoot)).filter((entry) => entry.event === 'after-call');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ status: 'failure', error: expect.stringContaining('[redacted:') });
    expect(String(failures[0]!.error).length).toBeLessThanOrEqual(500);
    await assertNoSyntheticValues([space.outputRoot, mini.outputRoot, outside], values);
  });

  it('T82: raw answers reject credentials and unsafe files and preserve safe bytes', async () => {
    const findings = securitySeam('secretFindings');
    const readRaw = securitySeam('readRawAnswer');
    const values = syntheticCredentials();
    for (const [index, value] of values.entries()) {
      const mini = await sandbox();
      const outside = await mkdtemp(path.join(root, 'outside-'));
      await put(path.join(mini.outputRoot, candidateRelativePath(job(), 1)), storyPng);
      const action = precheckMiniMax({ ...mini, jobs: [job()], jobId: job().id, version: 1,
        paid: true, dryRun: false, runner: async () => ({ stdout: value, stderr: '' }) });
      await expect(action, `MiniMax synthetic fixture ${index}`).rejects.toThrow();
      const after = (await securityLedger(mini.outputRoot)).filter((entry) => entry.event === 'after-call');
      expect.soft(after).toHaveLength(1);
      expect.soft(after[0]).toMatchObject({ status: 'failure' });
      const reason = String(after[0]?.error ?? '');
      expect.soft(findings(value).some((pattern) => reason.includes(pattern))).toBe(true);
      expect.soft((await tree(mini.outputRoot)).map((file) => path.relative(mini.outputRoot, file)))
        .toEqual([candidateRelativePath(job(), 1), 'cost-ledger.jsonl'].sort());
      await assertNoSyntheticValues([mini.outputRoot, outside], values);

      const kimi = await securityKimiFixture();
      // Input is outside the output tree. Remove it before scanning the outside directory.
      await put(kimi.raw, value);
      const before = await fileSnapshot(kimi.outputRoot);
      await expect(runStorytimeCli([...kimi.args, '--record', kimi.callId, '--raw', kimi.raw], kimi.deps),
        `Kimi synthetic fixture ${index}`).rejects.toThrow();
      expect(await fileSnapshot(kimi.outputRoot)).toEqual(before);
      await rm(kimi.raw);
      await assertNoSyntheticValues([kimi.outputRoot, kimi.outside], values);
    }
    for (const mode of ['symlink', 'directory', 'oversize', 'nul', 'invalid-utf8'] as const) {
      const kimi = await securityKimiFixture();
      if (mode === 'symlink') {
        const safe = path.join(kimi.outside, 'safe.txt');
        await put(safe, '{"verdict":"PASS","reason":"Synthetic safe text.","observedCounts":{},"issues":[]}');
        await symlink(safe, kimi.raw);
      } else if (mode === 'directory') await mkdir(kimi.raw);
      else await put(kimi.raw, mode === 'oversize' ? Buffer.alloc(65537, 65)
        : mode === 'nul' ? Buffer.from('SYNTHETIC\0answer') : Buffer.from([0xc3, 0x28]));
      const before = await fileSnapshot(kimi.outputRoot);
      await expect(Promise.resolve().then(() => readRaw(kimi.raw)), mode).rejects.toThrow();
      await expect(runStorytimeCli([...kimi.args, '--record', kimi.callId, '--raw', kimi.raw], kimi.deps), mode).rejects.toThrow();
      expect(await fileSnapshot(kimi.outputRoot), mode).toEqual(before);
      await assertNoSyntheticValues([kimi.outputRoot, kimi.outside], values);
    }
    const boundary = await securityKimiFixture();
    const pass = JSON.stringify({ verdict: 'PASS', reason: 'Synthetic safe answer.', observedCounts: { subject: 1 }, issues: [] });
    const boundaryBytes = Buffer.from(pass.padEnd(65536, ' '));
    await put(boundary.raw, boundaryBytes);
    expect(Buffer.byteLength(await readRaw(boundary.raw))).toBe(65536);
    expect(await runStorytimeCli([...boundary.args, '--record', boundary.callId, '--raw', boundary.raw], boundary.deps)).toBe(0);
    const boundaryReview = JSON.parse(await readFile(path.join(boundary.outputRoot, `reviews/${job().id}-v1-kimi.json`), 'utf8'));
    expect(Buffer.from(boundaryReview.rawOutput)).toEqual(boundaryBytes);
    expect(await readFile(path.join(boundary.outputRoot, boundaryReview.rawFile))).toEqual(boundaryBytes);
    await assertNoSyntheticValues([boundary.outputRoot, boundary.outside], values);

    const mini = await sandbox();
    await put(path.join(mini.outputRoot, candidateRelativePath(job(), 1)), storyPng);
    // These bytes duplicate the unchanged T54 fixture from call acd4f807.
    const rawFailOutput = "{\n  \"content\": \"```json\\n{\\n  \\\"verdict\\\": \\\"FAIL\\\",\\n  \\\"reason\\\": \\\"The source text asks 'How many suns? One sun!', but there is no sun visible in the image.\\\",\\n  \\\"observedCounts\\\": {\\n    \\\"suns\\\": 0\\n  },\\n  \\\"issues\\\": [\\n    \\\"Missing required object: sun (0 observed, expected 1)\\\"\\n  ]\\n}\\n```\",\n  \"base_resp\": {\n    \"status_code\": 0,\n    \"status_msg\": \"success\"\n  }\n}\n";
    const miniResult = await precheckMiniMax({ ...mini, jobs: [job()], jobId: job().id, version: 1,
      paid: true, dryRun: false, runner: async () => ({ stdout: rawFailOutput, stderr: '' }) });
    expect(miniResult.status).toBe('fail');
    if (miniResult.status === 'dry-run') throw new Error('The synthetic runner must run.');
    expect(Buffer.from(miniResult.review.rawOutput)).toEqual(Buffer.from(rawFailOutput));
    expect(await readFile(path.join(mini.outputRoot, miniResult.review.rawFile!))).toEqual(Buffer.from(rawFailOutput));
    const kimi = await securityKimiFixture();
    const crlf = `  ${pass}\r\n  \r\n`;
    await put(kimi.raw, crlf);
    expect(await readRaw(kimi.raw)).toBe(crlf);
    expect(await runStorytimeCli([...kimi.args, '--record', kimi.callId, '--raw', kimi.raw], kimi.deps)).toBe(0);
    const review = JSON.parse(await readFile(path.join(kimi.outputRoot, `reviews/${job().id}-v1-kimi.json`), 'utf8'));
    expect(review.rawOutput).toBe(crlf);
    expect(await readFile(path.join(kimi.outputRoot, review.rawFile))).toEqual(Buffer.from(crlf));
    await assertNoSyntheticValues([mini.outputRoot, kimi.outputRoot, kimi.outside], values);
  });

  it('T83: Kimi refuses credential reasons and long reasons before any write', async () => {
    const values = syntheticCredentials();
    for (const [index, reason] of [...values, 'S'.repeat(501)].entries()) {
      const kimi = await securityKimiFixture();
      const before = await fileSnapshot(kimi.outputRoot);
      await expect(runStorytimeCli([...kimi.args, '--record', kimi.callId, '--failed', '--reason', reason], kimi.deps),
        `Refused reason ${index}`).rejects.toThrow();
      expect(await fileSnapshot(kimi.outputRoot)).toEqual(before);
      await assertNoSyntheticValues([kimi.outputRoot, kimi.outside], values);
    }
    const plain = await securityKimiFixture();
    expect(await runStorytimeCli([...plain.args, '--record', plain.callId, '--failed', '--reason', 'reviewer session hung'], plain.deps)).toBe(0);
    const entries = await securityLedger(plain.outputRoot);
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({ event: 'after-call', status: 'failure', reason: 'reviewer session hung' });
    await assertNoSyntheticValues([plain.outputRoot, plain.outside], values);
  });

  it('T84: release rechecks calibration while plain verification does not', async () => {
    const fixture = await twinFixture();
    const calibrationRoots = await seedCalibration(fixture.outputRoot, fixture.repoRoot);
    await json(path.join(fixture.outputRoot, 'jobs.json'), jobs);
    const args = ['verify', '--out', fixture.outputRoot, '--job', job().id];
    const deps = { ...calibrationRoots, log: vi.fn() };
    expect(await runStorytimeCli([...args, '--release'], deps)).toBe(0);
    const file = path.join(fixture.outputRoot, 'calibration/good-nan-minimax.json');
    const bytes = await readFile(file);
    const log = JSON.parse(bytes.toString('utf8'));
    const sourceFile = pictureSeams.calibrationTarget('good-nan', calibrationRoots.workbooksRoot, fixture.repoRoot).file;
    const sourceBytes = await readFile(sourceFile);
    for (const mode of ['missing', 'stale-rubric', 'changed-source']) {
      if (mode === 'missing') await rm(file);
      if (mode === 'stale-rubric') await json(file, { ...log, rubricVersion: 'storytime-picture-v1' });
      if (mode === 'changed-source') {
        const changed = Buffer.from(sourceBytes); changed[0] = changed[0]! ^ 1;
        await put(sourceFile, changed);
      }
      await expect(runStorytimeCli([...args, '--release'], deps), mode).rejects.toThrow(/calibrat/i);
      expect(await runStorytimeCli(args, deps), mode).toBe(0);
      await put(file, bytes); await put(sourceFile, sourceBytes);
    }
  });

  it('T85: an empty or absent style sample list fails every twin', async () => {
    const fixture = await styleManifestFixture();
    expect(await fixture.states()).toEqual(['ready', 'ready', 'pending']);
    const { sampleFiles: _sampleFiles, ...withoutSamples } = fixture.style;
    for (const style of [{ ...fixture.style, sampleFiles: [] }, withoutSamples]) {
      await json(path.join(fixture.outputRoot, fixture.styleFile), style);
      expect.soft(await fixture.states()).toEqual(['failed', 'failed', 'failed']);
    }
  });
});

// Task 8 helpers. The JSON escape form is built at run time. No decoded credential enters a file.
type EntryDependencies = {
  pipeline?: (argv: string[]) => Promise<number>;
  errorLog?: (message: string) => void;
};
type EntryFunction = (argv: string[], dependencies: EntryDependencies) => Promise<number>;
function entrySeam(): EntryFunction | undefined {
  return (wrapperSeams as unknown as { runStorytimeBookPicturesEntry?: EntryFunction })
    .runStorytimeBookPicturesEntry;
}
/** The JSON `\u` escape form of a value. The decoded text holds the value. */
function unicodeEscaped(value: string): string {
  return [...value]
    .map((character) => `\\u${(character.codePointAt(0) ?? 0).toString(16).padStart(4, '0')}`)
    .join('');
}
async function refusedBy(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action();
    return false;
  } catch {
    return true;
  }
}

describe('Second security remediation', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('T88: the propagated provider error and the final CLI error carry no credential', async () => {
    const values = syntheticCredentials();
    const providerError =
      `mmx exited with 1: provider unavailable. ${values.join(' | ')} ${'detail line '.repeat(60)}`;
    const space = await sandbox();
    const entries: LedgerEntry[] = [];
    const details: PaidCallDetails = {
      operation: 'vision-describe', provider: 'minimax', model: 'synthetic-model',
      purpose: 'Synthetic propagated error test', jobId: job().id, version: 1,
      price: { basis: 'Test fixture', marginalCashUsd: 0, note: 'No paid call.' },
    };
    let thrown: unknown;
    try {
      await runPaidCall({
        paid: true, dryRun: false, details, now: CLOCK,
        newCallId: () => 'synthetic-propagated-call',
        call: async () => { throw new Error(providerError); },
        appendLedger: async (entry) => { entries.push(entry); },
      });
    } catch (error) { thrown = error; }
    expect.soft(thrown, 'The paid call rejects.').toBeInstanceOf(Error);
    const propagated = thrown instanceof Error ? thrown.message : String(thrown);
    for (const value of values) {
      expect.soft(propagated, 'The propagated error holds no credential.').not.toContain(value);
    }
    expect.soft(propagated.length, 'The propagated error has 500 characters at most.')
      .toBeLessThanOrEqual(500);
    expect.soft(propagated, 'The propagated error keeps safe text.').toContain('provider unavailable');
    expect.soft(entries).toHaveLength(2);
    expect.soft(entries[1]).toMatchObject({ event: 'after-call', status: 'failure' });
    const ledgerError = String((entries[1] as unknown as { error?: string }).error ?? '');
    for (const value of values) {
      expect.soft(ledgerError, 'The ledger error holds no credential.').not.toContain(value);
    }
    expect.soft(ledgerError.length, 'The ledger error has 500 characters at most.')
      .toBeLessThanOrEqual(500);
    await assertNoSyntheticValues([space.outputRoot], values);
    const entry = entrySeam();
    expect.soft(entry, 'The runStorytimeBookPicturesEntry seam exists.').toBeTypeOf('function');
    if (typeof entry === 'function') {
      const logged: string[] = [];
      const code = await entry(['render', '--job', job().id], {
        pipeline: async () => { throw new Error(providerError); },
        errorLog: (message: string) => { logged.push(message); },
      });
      expect.soft(code, 'The entry returns the exit code 1.').toBe(1);
      expect.soft(logged.length, 'The entry logs one message.').toBe(1);
      const finalMessage = logged[0] ?? '';
      for (const value of values) {
        expect.soft(finalMessage, 'The final CLI message holds no credential.').not.toContain(value);
      }
      expect.soft(finalMessage.length, 'The final CLI message has 500 characters at most.')
        .toBeLessThanOrEqual(500);
      expect.soft(finalMessage, 'The final CLI message keeps safe text.')
        .toContain('provider unavailable');
    }
  });

  it('T89: the MiniMax decoded review fields pass the credential check before any write', async () => {
    const values = syntheticCredentials();
    const apiKey = values[0]!;
    const escaped = unicodeEscaped(apiKey);
    const payloads: Array<{ label: string; text: string }> = [
      { label: 'reason',
        text: `{"verdict":"PASS","reason":"The key ${escaped} is present.","observedCounts":{"subject":1},"issues":[]}` },
      { label: 'issue',
        text: `{"verdict":"PASS","reason":"The picture is clear.","observedCounts":{"subject":1},"issues":["The key ${escaped} is present."]}` },
      { label: 'count key',
        text: `{"verdict":"PASS","reason":"The picture is clear.","observedCounts":{"${escaped}":1},"issues":[]}` },
    ];
    for (const item of payloads) {
      expect.soft(item.text.includes(apiKey), `${item.label}: the raw bytes hold no credential.`).toBe(false);
      const mini = await sandbox();
      await put(path.join(mini.outputRoot, candidateRelativePath(job(), 1)), storyPng);
      const refused = await refusedBy(() => precheckMiniMax({
        ...mini, jobs: [job()], jobId: job().id, version: 1, paid: true, dryRun: false,
        runner: async () => ({ stdout: item.text, stderr: '' }),
      }));
      expect.soft(refused, `${item.label}: the review is refused.`).toBe(true);
      const entries = await securityLedger(mini.outputRoot);
      const successes = entries.filter((entry) => entry.event === 'after-call' && entry.status === 'success');
      expect.soft(successes.length, `${item.label}: no success entry.`).toBe(0);
      const failures = entries.filter((entry) => entry.event === 'after-call' && entry.status === 'failure');
      expect.soft(failures.length, `${item.label}: one failure entry.`).toBe(1);
      const failureError = String((failures[0] as unknown as { error?: string } | undefined)?.error ?? '');
      expect.soft(failureError, `${item.label}: the failure names the pattern.`).toMatch(/api-key/);
      expect.soft(failureError, `${item.label}: the failure holds no credential.`).not.toContain(apiKey);
      const files = (await tree(mini.outputRoot)).map((file) => path.relative(mini.outputRoot, file));
      expect.soft(files.some((file) => file.startsWith('raw/')), `${item.label}: no raw copy.`).toBe(false);
      expect.soft(files.some((file) => file.endsWith('-minimax.json')), `${item.label}: no review write.`)
        .toBe(false);
      await assertNoSyntheticValues([mini.outputRoot], values);
    }
    const safeReason = `The picture shows Nan ${unicodeEscaped('หนา')}.`;
    const safe = `{"verdict":"PASS","reason":"${safeReason}","observedCounts":{"subject":1},"issues":[]}`;
    const mini = await sandbox();
    await put(path.join(mini.outputRoot, candidateRelativePath(job(), 1)), storyPng);
    const result = await precheckMiniMax({
      ...mini, jobs: [job()], jobId: job().id, version: 1, paid: true, dryRun: false,
      runner: async () => ({ stdout: safe, stderr: '' }),
    });
    expect(result.status).toBe('pass');
    if (result.status === 'dry-run') throw new Error('The synthetic runner must run.');
    expect(Buffer.from(result.review.rawOutput)).toEqual(Buffer.from(safe));
    expect(result.review.reason).toBe('The picture shows Nan หนา.');
    expect(await readFile(path.join(mini.outputRoot, result.review.rawFile!))).toEqual(Buffer.from(safe));
    await assertNoSyntheticValues([mini.outputRoot], values);
  });

  it('T90: the Kimi decoded review fields pass the credential check before any write', async () => {
    const values = syntheticCredentials();
    const apiKey = values[0]!;
    const escaped = unicodeEscaped(apiKey);
    const payloads: Array<{ label: string; text: string }> = [
      { label: 'reason',
        text: `{"verdict":"PASS","reason":"The key ${escaped} is present.","observedCounts":{"subject":1},"issues":[]}` },
      { label: 'issue',
        text: `{"verdict":"PASS","reason":"The picture is clear.","observedCounts":{"subject":1},"issues":["The key ${escaped} is present."]}` },
      { label: 'count key',
        text: `{"verdict":"PASS","reason":"The picture is clear.","observedCounts":{"${escaped}":1},"issues":[]}` },
    ];
    for (const item of payloads) {
      const kimi = await securityKimiFixture();
      await put(kimi.raw, item.text);
      const before = await fileSnapshot(kimi.outputRoot);
      const refused = await refusedBy(() => runStorytimeCli(
        [...kimi.args, '--record', kimi.callId, '--raw', kimi.raw], kimi.deps,
      ));
      expect.soft(refused, `${item.label}: the record is refused.`).toBe(true);
      expect.soft(await fileSnapshot(kimi.outputRoot), `${item.label}: the ledger stays byte-identical.`)
        .toEqual(before);
      for (const call of kimi.deps.log.mock.calls) {
        expect.soft(String(call[0]), `${item.label}: the log holds no credential.`).not.toContain(apiKey);
      }
      await assertNoSyntheticValues([kimi.outputRoot], values);
    }
    const safeReason = `The picture shows Nan ${unicodeEscaped('หนา')}.`;
    const safe = `{"verdict":"PASS","reason":"${safeReason}","observedCounts":{"subject":1},"issues":[]}`;
    const kimi = await securityKimiFixture();
    await put(kimi.raw, safe);
    expect(await runStorytimeCli([...kimi.args, '--record', kimi.callId, '--raw', kimi.raw], kimi.deps)).toBe(0);
    const review = JSON.parse(
      await readFile(path.join(kimi.outputRoot, `reviews/${job().id}-v1-kimi.json`), 'utf8'),
    );
    expect(review.rawOutput).toBe(safe);
    expect(review.reason).toBe('The picture shows Nan หนา.');
    expect(await readFile(path.join(kimi.outputRoot, review.rawFile))).toEqual(Buffer.from(safe));
    await assertNoSyntheticValues([kimi.outputRoot], values);
  });

  it('T91: the server configuration keeps the Vite credential defaults and the absolute Storytime rule', async () => {
    const space = await sandbox();
    const input: CaptureInput = {
      repoRoot: space.repoRoot, job: job(), stage: stageFile(space.repoRoot),
      timeline: buildBookStillTimeline(stageSource()), size: { width: 3000, height: 2250 },
    };
    const config = await securitySeam('bookServerConfig')(input);
    const deny = config.server.fs?.deny ?? [];
    for (const rule of ['.env', '.env.*', '*.{crt,pem}', '**/.git/**']) {
      expect.soft(deny, `The deny rule ${rule} stays.`).toContain(rule);
    }
    const absoluteRules = [
      `${path.resolve(space.repoRoot, 'out/storytime')}/**`,
      `${realpathSync(path.join(space.repoRoot, 'out/storytime'))}/**`,
    ];
    expect.soft(absoluteRules.some((rule) => deny.includes(rule)), 'The absolute Storytime rule stays.')
      .toBe(true);
    expect.soft(deny, 'The relative Storytime rule may stay.').toContain('out/storytime/**');
    expect.soft(config.server.host, 'The loopback host stays.').toBe('127.0.0.1');
    expect.soft(config.server.fs?.strict, 'The strict file mode stays.').toBe(true);
    const plugins = config.plugins.filter((plugin) => plugin.name === 'storytime-book-files');
    expect.soft(plugins, 'The protected file plugin stays.').toHaveLength(1);
  });

  it('T93: the server returns and reads the checked real path and refuses a protected stage target', async () => {
    const allow = securitySeam('bookFileAllowlist');
    const resolve = securitySeam('resolveBookFile');
    const serve = securitySeam('serveBookFiles');
    const space = await sandbox();
    const modelTarget = path.join(space.repoRoot, 'out/models/target.glb');
    await put(modelTarget, 'SYNTHETIC model target bytes');
    await mkdir(path.join(space.repoRoot, 'out/hero'), { recursive: true });
    await symlink(modelTarget, path.join(space.repoRoot, 'out/hero/hero.glb'));
    const stageDirectory = path.join(space.repoRoot, 'docs/stage');
    const stageTarget = path.join(stageDirectory, 'target.png');
    await put(stageTarget, 'SYNTHETIC stage target bytes');
    await symlink(stageTarget, path.join(stageDirectory, 'sign.png'));
    const source = stageSource();
    source.stage.sets = { classroom: { pictures: [{ file: 'sign.png', x: 0, y: 1, z: 0, w: 1 }] } };
    const timeline = buildBookStillTimeline(source);
    const allowlist = await allow({ repoRoot: space.repoRoot, stageDirectory, timeline });
    expect.soft(await resolve(allowlist, '/out/hero/hero.glb'), 'The model path is the real path.')
      .toBe(realpathSync(modelTarget));
    expect.soft(await resolve(allowlist, '/stage/sign.png'), 'The stage path is the real path.')
      .toBe(realpathSync(stageTarget));
    const request = await middlewareDriver(serve(allowlist));
    const modelResponse = await request('/out/hero/hero.glb');
    expect.soft(modelResponse.res.statusCode, 'The model file is served.').toBe(200);
    expect.soft(modelResponse.body.toString(), 'The model bytes are the target bytes.')
      .toBe('SYNTHETIC model target bytes');
    const stageResponse = await request('/stage/sign.png');
    expect.soft(stageResponse.res.statusCode, 'The stage file is served.').toBe(200);
    expect.soft(stageResponse.body.toString(), 'The stage bytes are the target bytes.')
      .toBe('SYNTHETIC stage target bytes');
    const protectedStage = path.join(space.repoRoot, 'out/storytime/l2/unit1/stage');
    await put(path.join(protectedStage, 'sign.png'), 'SYNTHETIC private evidence');
    const protectedAllowlist = await allow({
      repoRoot: space.repoRoot, stageDirectory: protectedStage, timeline,
    });
    expect.soft(await resolve(protectedAllowlist, '/stage/sign.png'),
      'The protected stage target is refused.').toBeUndefined();
    const protectedRequest = await middlewareDriver(serve(protectedAllowlist));
    const protectedResponse = await protectedRequest('/stage/sign.png');
    expect.soft(protectedResponse.res.statusCode, 'The protected stage target gets 404.').toBe(404);
    expect.soft(protectedResponse.next, 'The protected stage target calls no next.').not.toHaveBeenCalled();
    expect.soft(protectedResponse.body.toString(), 'The protected stage target sends no evidence.')
      .not.toContain('SYNTHETIC private evidence');
  });

  it('T94: the Kimi failure reason limit counts characters', async () => {
    const kimi = await securityKimiFixture();
    const reason = 'ก'.repeat(500);
    expect(Buffer.byteLength(reason, 'utf8')).toBeGreaterThan(500);
    let code: number | undefined;
    let error: unknown;
    try {
      code = await runStorytimeCli(
        [...kimi.args, '--record', kimi.callId, '--failed', '--reason', reason], kimi.deps,
      );
    } catch (caught) { error = caught; }
    expect.soft(error, 'The 500-character reason is accepted.').toBeUndefined();
    expect.soft(code, 'The 500-character reason returns 0.').toBe(0);
    const entries = await securityLedger(kimi.outputRoot);
    expect.soft(entries.length, 'The ledger holds the begin and the failure entry.').toBe(2);
    expect.soft(entries[1]).toMatchObject({ event: 'after-call', status: 'failure', reason });
    const long = await securityKimiFixture();
    const before = await fileSnapshot(long.outputRoot);
    const refused = await refusedBy(() => runStorytimeCli(
      [...long.args, '--record', long.callId, '--failed', '--reason', 'ก'.repeat(501)], long.deps,
    ));
    expect.soft(refused, 'The 501-character reason is refused.').toBe(true);
    expect.soft(await fileSnapshot(long.outputRoot), 'The refused reason writes nothing.').toEqual(before);
  });
});

describe('Storytime picture contract', () => {
  it('T1: extracts exactly 112 jobs, 16 per week, and 8 per book kind', () => {
    expect({ 'Total jobs': jobs.length }).toEqual({ 'Total jobs': 112 });
    for (let week = 1; week <= 7; week++) {
      const weekly = jobs.filter((item) => item.week === week);
      expect({ 'Week jobs': weekly.length }).toEqual({ 'Week jobs': 16 });
      for (const kind of ['readalong', 'decodable']) {
        expect({ 'Book jobs': weekly.filter((item) => item.bookKind === kind).length }).toEqual({ 'Book jobs': 8 });
      }
    }
  });

  it('T2: ignores the w08 package in a temporary Workbooks copy', async () => {
    const { repoRoot } = await sandbox();
    const workbooksRoot = await copyPackages(repoRoot, true);
    const extracted = buildStorytimeJobs({ workbooksRoot });
    expect(extracted).toHaveLength(112);
    expect(extracted.some((item) => item.id.startsWith('w08'))).toBe(false);
  });

  it('T3: plan preserves real package bytes and records independently computed hashes', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const packages = [...new Set(jobs.map((item) => item.sourcePackage))];
    const before = new Map(packages.map((file) => [file, readFileSync(file)]));
    const extracted = await planned(repoRoot, outputRoot);
    for (const file of packages) expect(readFileSync(file)).toEqual(before.get(file));
    for (const item of extracted) expect(item.sourceSha256).toBe(digest(before.get(item.sourcePackage)!));
  }, 30000);

  it('T4: a changed package byte stops render before capture', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const workbooksRoot = await copyPackages(repoRoot);
    const extracted = await planned(repoRoot, outputRoot, workbooksRoot);
    const source = extracted[0]!.sourcePackage;
    await put(source, Buffer.concat([await readFile(source), Buffer.from('\n')]));
    const capture = vi.fn(async () => storyPng);
    const readStage = vi.fn(async () => stageFile(repoRoot, extracted[0]!));
    await expect(runStorytimeCli(['render', '--out', outputRoot, '--job', extracted[0]!.id], {
      repoRoot, capture, readStage, log: vi.fn(),
    })).rejects.toThrow(/source.*hash/i);
    expect(capture).not.toHaveBeenCalled();
    expect(readStage).not.toHaveBeenCalled();
  });

  it('T5: a week filter preserves all 112 jobs and their source hashes', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const workbooksRoot = await copyPackages(repoRoot);
    const original = await planned(repoRoot, outputRoot, workbooksRoot);
    const filtered = await planned(repoRoot, outputRoot, workbooksRoot, ['--week', '1']);
    expect(filtered).toHaveLength(112);
    expect(filtered.map((item) => [item.id, item.sourceSha256])).toEqual(original.map((item) => [item.id, item.sourceSha256]));
    for (const item of filtered) expect(item.sourceSha256).toBe(digest(await readFile(item.sourcePackage)));
  });

  it('T6: filenames describe subjects rather than gestures', () => {
    const pattern = /^l2-w0[1-7]-(readalong|decodable|cover|small)-[a-z0-9]+(-[a-z0-9]+)*-v[1-9][0-9]*\.png$/;
    for (const item of jobs) {
      expect(Object.keys(GESTURES)).not.toContain(item.slug);
      expect(['wave', 'nod']).not.toContain(item.slug);
      for (const use of ['readalong', 'decodable', 'cover', 'small'] as const) {
        expect(candidateFilename({ ...item, use }, 12)).toMatch(pattern);
      }
    }
    expect(() => candidateFilename(job(), 0)).toThrow(/version/i);
  });

  it('T7: a retry preserves v1 bytes and writes v2 or refuses', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const v1 = path.join(outputRoot, candidateRelativePath(job(), 1));
    await put(v1, storyPng);
    const calibrationRoots = await seedCalibration(outputRoot, repoRoot);
    const before = digest(await readFile(v1));
    const capture = vi.fn(async () => capturePacket());
    const result = await renderTwins({ jobs: [job()], ...calibrationRoots, outputRoot, version: 2, dryRun: false,
      capture, readStage: async ({ job: current, version }) => stageFile(repoRoot, current, version) })
      .then((value) => ({ value, error: undefined }), (error: unknown) => ({ value: undefined, error }));
    if (result.value) {
      expect(result.value[0]!.version).toBe(2);
      expect(result.value[0]!.status).toBe('rendered');
      expect(existsSync(path.join(outputRoot, candidateRelativePath(job(), 2)))).toBe(true);
    } else {
      expect(String(result.error)).toMatch(/version|calibration/i);
    }
    expect(digest(await readFile(v1))).toBe(before);
  });

  it('T8: stages use exact byte hashes and reject wrong identities and media keys', () => {
    const source = stageSource();
    const decode = (value: unknown) => decodeBookStage({ bytes: Buffer.from(JSON.stringify(value)), job: job(), version: 1, repoRoot: root });
    const stage = decode(source);
    expect(stage.file).toBe(`docs/storytime/l2-unit1/w01/${job().id}-v1.json`);
    expect(stageRelativePath(job(), 2)).toBe(`docs/storytime/l2-unit1/w01/${job().id}-v2.json`);
    expect(stage.sha256).toBe(digest(Buffer.from(JSON.stringify(source))));
    const spaced = Buffer.from(JSON.stringify(source, null, 2));
    const changed = decodeBookStage({ bytes: spaced, job: job(), version: 1, repoRoot: root });
    expect(changed.sha256).toBe(digest(spaced));
    expect(changed.sha256).not.toBe(stage.sha256);
    expect(() => decode({ ...source, jobId: 'wrong-job' })).toThrow();
    expect(() => decode({ ...source, version: 2 })).toThrow();
    for (const key of ['song', 'audio', 'video']) {
      expect(() => decode({ ...source, [key]: 'forbidden' })).toThrow();
      expect(() => decode({ ...source, stage: { ...source.stage, [key]: 'forbidden' } })).toThrow();
    }
  });

  it('T9: changed stage bytes invalidate render evidence', async () => {
    const input = candidateInput();
    expect((await evaluateCandidate(input)).status).toBe('ready');
    const changed = { ...input.stage, sha256: digest(`${JSON.stringify(stageSource())}\n`) };
    const result = await evaluateCandidate({ ...input, stage: changed });
    expect(result.status).toBe('failed');
    expect(result.failures.join(' ')).toMatch(/stage.*hash/i);
  });

  it('T10: rejects traversal, absolute escape, and symlink escape', async () => {
    const { repoRoot } = await sandbox();
    const outside = await mkdtemp(path.join(root, 'outside-'));
    await symlink(outside, path.join(repoRoot, 'out/link'));
    expect(resolveOutputRoot(repoRoot, 'out/safe')).toBe(path.join(repoRoot, 'out/safe'));
    for (const requested of ['out/../escape', 'out/a/../safe', outside, 'out/link/pictures']) {
      expect(() => resolveOutputRoot(repoRoot, requested), requested).toThrow();
    }
  });

  it('T11: preflight precedes the lock; a hold stops work; a dry run avoids both', async () => {
    const events: string[] = [];
    const deps = { preflight: vi.fn(() => { events.push('preflight'); return 0; }),
      holdLock: vi.fn(() => { events.push('lock'); }),
      pipeline: vi.fn(async () => { events.push('pipeline'); return 0; }) };
    expect(await runStorytimeBookPictures(['render'], deps)).toBe(0);
    expect(events).toEqual(['preflight', 'lock', 'pipeline']);
    events.length = 0;
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    deps.preflight.mockImplementation(() => { events.push('preflight'); return 1; });
    deps.holdLock.mockClear(); deps.pipeline.mockClear();
    expect(await runStorytimeBookPictures(['render'], deps)).not.toBe(0);
    expect(events).toEqual(['preflight']);
    expect(deps.holdLock).not.toHaveBeenCalled(); expect(deps.pipeline).not.toHaveBeenCalled();
    expect(output).toHaveBeenCalledTimes(1);
    expect(output.mock.calls[0]![0]).toMatch(/hold/);
    deps.preflight.mockClear();
    expect(await runStorytimeBookPictures(['render', '--dry-run'], deps)).toBe(0);
    expect(deps.preflight).not.toHaveBeenCalled(); expect(deps.holdLock).not.toHaveBeenCalled();
    expect(deps.pipeline).toHaveBeenCalledOnce();
  });

  it('T12: injected capture keeps real processes, browsers, and servers unused', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const capture = vi.fn(async () => storyPng);
    const readStage = vi.fn(async () => stageFile(repoRoot));
    const results = await renderCandidates({ jobs: [job()], repoRoot, outputRoot, dryRun: true, capture, readStage });
    expect(results[0]!.status).toBe('dry-run');
    expect(readStage).toHaveBeenCalledOnce();
    expect(capture).not.toHaveBeenCalled();
    for (const operation of Object.values(forbidden)) expect(operation).not.toHaveBeenCalled();
    expect(await tree(outputRoot)).toEqual([]);
  });

  it('T13: paid calls require consent and ledger order on success and failure', async () => {
    const details: PaidCallDetails = { operation: 'vision-describe', provider: 'minimax', model: 'test-model',
      purpose: 'Test only', jobId: job().id, version: 1,
      price: { basis: 'Test plan', marginalCashUsd: 0, note: 'No paid call.' } };
    const { repoRoot, outputRoot } = await sandbox();
    const runner = vi.fn(async (_command: string, _args: string[]) => ({ stdout: '', stderr: '' }));
    const appendLedger = vi.fn();
    const call = vi.fn(async () => runner('mmx', []));
    await expect(runPaidCall({ paid: false, dryRun: false, details, call, appendLedger })).rejects.toThrow(/--paid/);
    await runPaidCall({ paid: true, dryRun: true, details, call, appendLedger });
    await precheckMiniMax({ jobs: [job()], repoRoot, outputRoot, jobId: job().id, version: 1,
      paid: true, dryRun: true, runner });
    expect(runner).not.toHaveBeenCalled(); expect(appendLedger).not.toHaveBeenCalled();
    expect(existsSync(path.join(outputRoot, 'cost-ledger.jsonl'))).toBe(false);
    for (const throws of [false, true]) {
      const events: string[] = [];
      const entries: LedgerEntry[] = [];
      const fakeRunner = vi.fn(async () => {
        events.push('runner-start'); events.push('runner-end');
        if (throws) throw new Error('Test provider failure');
        return { stdout: 'test', stderr: '' };
      });
      const action = runPaidCall({ paid: true, dryRun: false, details, now: CLOCK, newCallId: () => 'test-call',
        appendLedger: async (entry) => { entries.push(entry); events.push(entry.event); },
        call: async () => fakeRunner() });
      if (throws) await expect(action).rejects.toThrow('Test provider failure'); else await action;
      expect(events).toEqual(['before-call', 'runner-start', 'runner-end', 'after-call']);
      expect(entries).toHaveLength(2);
      expect(entries.map((entry) => entry.callId)).toEqual(['test-call', 'test-call']);
      expect(entries[1]).toMatchObject({ event: 'after-call', status: throws ? 'failure' : 'success' });
    }
  });

  it('T14: only a labeled verdict and labeled integer counts can pass', () => {
    const valid = { verdict: 'PASS', reason: 'One sun.', observedCounts: { sun: 1 }, issues: [] };
    expect(parseModelReview(JSON.stringify(valid))).toMatchObject({ verdict: 'pass', observedCounts: { sun: 1 } });
    for (const text of ['unclear', 'not a pass', 'PASS?', 'PASS', '{"reason":"PASS"}',
      JSON.stringify({ ...valid, verdict: 'PASS?' }), JSON.stringify({ ...valid, observedCounts: { sun: 1.5 } }),
      JSON.stringify({ ...valid, observedCounts: { sun: '1' } }), JSON.stringify({ ...valid, verdict: 'FAIL' })]) {
      expect(parseModelReview(text).verdict, text).toBe('fail');
    }
  });

  it('T15: PNG checks reject alpha, deep channels, wrong sizes, grey, flat color, and dark small corners', async () => {
    for (const size of ['story', 'cover', 'small'] as const) {
      const png = size === 'story' ? storyPng : await picture(size);
      expect((await inspectCandidatePng(png, size)).valid, size).toBe(true);
    }
    const alpha = await sharp(storyPng).ensureAlpha(0.5).png().toBuffer();
    const deep = await sharp(storyPng).toColourspace('rgb16').png().toBuffer();
    const grey = await sharp(storyPng).toColourspace('b-w').png().toBuffer();
    const wrong = await sharp(storyPng).resize(300, 225).png().toBuffer();
    const flat = await sharp({ create: { width: 3000, height: 2250, channels: 3, background: '#ffffff' } }).png().toBuffer();
    expect((await sharp(deep).metadata()).bitsPerSample).toBe(16);
    expect((await sharp(grey).metadata()).space).toBe('b-w');
    for (const [label, png] of [['alpha', alpha], ['16-bit', deep], ['grey', grey], ['size', wrong], ['flat', flat]] as const) {
      expect((await inspectCandidatePng(png, 'story')).valid, label).toBe(false);
    }
    expect((await inspectCandidatePng(await picture('small', '#000000'), 'small')).valid).toBe(false);
  });

  it('T16: cover validation distinguishes a calm title region from a focal prop in the top 30 percent', async () => {
    const calm = await picture('cover');
    const focal = await picture('cover', '#ffffff', true);
    expect(digest(calm)).not.toBe(digest(focal));
    expect((await inspectCandidatePng(calm, 'cover')).valid).toBe(true);
    expect((await inspectCandidatePng(focal, 'cover')).valid).toBe(false);
  });

  it('T17: release requires valid model logs and a named person log bound to the file and rubric', async () => {
    const input = candidateInput();
    const ready = await evaluateCandidate(input);
    expect(ready.status).toBe('ready');
    expect(verifyOutput(assembleManifest([job()], [ready]), { release: true, output: 'color' })).toEqual([]);
    const { person: _person, ...models } = input.reviews;
    const noPerson = await evaluateCandidate({ ...input, reviews: models });
    expect(noPerson.status).toBe('pending');
    const { kimi: _kimi, ...withoutKimi } = input.reviews;
    expect((await evaluateCandidate({ ...input, reviews: withoutKimi })).status).toBe('pending');
    for (const provider of ['minimax', 'kimi'] as const) {
      const failed = await evaluateCandidate({ ...input, reviews: { ...input.reviews,
        [provider]: { ...input.reviews[provider], verdict: 'fail' } } });
      expect(failed.status).toBe('failed');
    }
    for (const change of [{ checkedBy: '' }, { evidenceClass: 'model-pre-check' },
      { fileSha256: digest('wrong bytes') }, { rubricVersion: 'wrong-rubric' }]) {
      const invalid = { ...input.reviews.person, ...change };
      const candidate = await evaluateCandidate({ ...input, reviews: { ...input.reviews, person: invalid } });
      expect(candidate.status, JSON.stringify(change)).toBe('failed');
      expect(verifyManifest(assembleManifest([job()], [candidate]), { release: true }).length).toBeGreaterThan(0);
      // A manifest edit cannot bypass verification by retaining the old ready status.
      const forged = { ...ready, reviews: { ...ready.reviews, person: invalid } } as CandidateManifest;
      expect(verifyManifest(assembleManifest([job()], [forged]), { release: true }).length, JSON.stringify(change)).toBeGreaterThan(0);
    }
    expect(verifyManifest(assembleManifest([job()], [noPerson]), { release: true }).length).toBeGreaterThan(0);
  });

  it('T18: an empty release selection and a manifest with zero jobs fail', async () => {
    const manifest = assembleManifest([job()], []);
    expect(verifyManifest(manifest, { release: true, jobId: 'absent' }).length).toBeGreaterThan(0);
    const { repoRoot, outputRoot } = await sandbox();
    await expect(buildManifest([], outputRoot, repoRoot)).rejects.toThrow(/job|empty|zero/i);
    expect(() => assembleManifest([], [])).toThrow(/job|empty|zero/i);
  });

  it('T19: selection keeps ready v1 over pending v2 and then selects ready v3', async () => {
    const ready1 = await evaluateCandidate(candidateInput(job(), 1));
    const input2 = candidateInput(job(), 2);
    const { person: _person, ...models } = input2.reviews;
    const pending2 = await evaluateCandidate({ ...input2, reviews: models });
    const ready3 = await evaluateCandidate(candidateInput(job(), 3));
    expect(ready1.status).toBe('ready'); expect(pending2.status).toBe('pending'); expect(ready3.status).toBe('ready');
    expect(assembleManifest([job()], [pending2, ready1]).jobs[0]!.selectedVersion).toBe(1);
    const selected = assembleManifest([job()], [ready3, pending2, ready1]).jobs[0]!;
    expect(selected.selectedVersion).toBe(3);
    expect(selected.selectedFile).toBe(candidateRelativePath(job(), 3));
  });

  it('T20: the batch hash matches an independent canonical computation', async () => {
    const files = [{ file: 'b.png', sha256: digest('bytes-b') }, { file: 'a.png', sha256: digest('bytes-a') }];
    const independent = (entries: typeof files) => createHash('sha256').update(JSON.stringify(
      [...entries].sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0)
        .map((entry) => ({ file: entry.file, sha256: entry.sha256 })),
    )).digest('hex');
    expect(batchSha256(files)).toBe(independent(files));
    expect(batchSha256([...files].reverse())).toBe(independent(files));
    const changed = [{ ...files[0]!, sha256: digest('bytes-c') }, files[1]!];
    expect(batchSha256(changed)).toBe(independent(changed));
    expect(batchSha256(changed)).not.toBe(independent(files));
    const candidate = await evaluateCandidate(candidateInput());
    const manifest = assembleManifest([job()], [candidate]);
    expect(manifest.batches[0]!.sha256).toBe(independent([{ file: candidate.file, sha256: digest(storyPng) }]));
    expect(manifest.batchHashAlgorithm).toMatch(/SHA-256.*UTF-8.*JSON\.stringify.*file.*sha256.*sorted by file.*no whitespace/);
  });

  it('T21: contact sheets preserve all candidate bytes and write only below the output root', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const candidates = await Promise.all([evaluateCandidate(candidateInput(job(), 1)), evaluateCandidate(candidateInput(job(), 2))]);
    for (const candidate of candidates) await put(path.join(outputRoot, candidate.file), storyPng);
    await put(path.join(repoRoot, 'sentinel.txt'), 'unchanged');
    const beforeFiles = await tree(repoRoot);
    const hashes = new Map(await Promise.all(beforeFiles.map(async (file) => [file, digest(await readFile(file))] as const)));
    const result = await createContactSheet(assembleManifest([job()], candidates), outputRoot, {});
    expect(result.count).toBe(1);
    for (const [file, hash] of hashes) expect(digest(await readFile(file))).toBe(hash);
    const added = (await tree(repoRoot)).filter((file) => !hashes.has(file));
    expect(added).toEqual([result.file]);
    expect(path.relative(outputRoot, result.file)).toMatch(/^sheets\//);
  });

  it('T22: a production render stops until all four calibration verdicts pass', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    await planned(repoRoot, outputRoot);
    const capture = vi.fn(async () => capturePacket());
    const readStage = vi.fn(async ({ job: current, version }: { job: StorytimeJob; version: number }) => stageFile(repoRoot, current, version));
    const render = () => runStorytimeCli(['render', '--out', outputRoot, '--workbooks', path.join(repoRoot, 'Workbooks'), '--job', job().id], { repoRoot, capture: capture as unknown as CliCapture, readStage, log: vi.fn() });
    await expect(render()).rejects.toThrow(/calibrat/i);
    expect(capture).not.toHaveBeenCalled();
    await seedCalibration(outputRoot, repoRoot);
    const badLog = path.join(outputRoot, 'calibration/bad-one-sun-kimi.json');
    const log = JSON.parse(await readFile(badLog, 'utf8'));
    await json(badLog, { ...log, verdict: 'pass' });
    await expect(render()).rejects.toThrow(/calibrat/i);
    expect(capture).not.toHaveBeenCalled();
    await json(badLog, log);
    expect(await render()).toBe(0);
    expect(capture).toHaveBeenCalledOnce();
  });

  it('T23: the CLI rejects song, video, and unknown commands; still timelines have no singing or page notes', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    for (const command of ['song', 'video', 'song-record', 'unknown']) {
      await expect(runStorytimeCli([command, '--out', outputRoot], { repoRoot, log: vi.fn() })).rejects.toThrow();
    }
    const timeline = buildBookStillTimeline(stageSource());
    expect(timeline.actors.length).toBeGreaterThan(0);
    for (const actor of timeline.actors) expect(actor.sings).toEqual([]);
    expect(() => assertPageNotes([])).not.toThrow();
    expect(() => assertPageNotes(['Missing actor'])).toThrow(/Missing actor/);
  });

  it('T24: MiniMax receives native image arguments, source text, and the rubric without a shell', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const image = path.join(outputRoot, candidateRelativePath(job(), 1));
    await put(image, storyPng);
    const raw = JSON.stringify({ verdict: 'PASS', reason: 'Fixture only.', observedCounts: { subject: 1 }, issues: [] });
    const runner = vi.fn(async (command: string, args: string[]) => {
      expect(command).toBe('mmx'); expect(Array.isArray(args)).toBe(true);
      expect(args.slice(0, 4)).toEqual(['vision', 'describe', '--image', image]);
      expect(args[args.indexOf('--prompt') + 1]).toContain(job().text);
      expect(args[args.indexOf('--prompt') + 1]).toContain(job().sourcePrompt);
      expect(args[args.indexOf('--prompt') + 1]).toContain(PICTURE_RUBRIC_VERSION);
      return { stdout: raw, stderr: '' };
    });
    expect(miniMaxPrecheckArgs(image, buildReviewPrompt(job()))).toEqual(['vision', 'describe', '--image', image, '--prompt', buildReviewPrompt(job())]);
    const result = await precheckMiniMax({ jobs: [job()], repoRoot, outputRoot, jobId: job().id, version: 1, paid: true, dryRun: false, runner });
    expect(result.status).toBe('pass');
    expect(runner).toHaveBeenCalledOnce();
    expect(runner.mock.calls[0]).toHaveLength(2);
  });

  it('T25: Kimi begin precedes record; raw output and file hashes stay unchanged', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    await planned(repoRoot, outputRoot);
    const image = path.join(outputRoot, candidateRelativePath(job(), 1));
    await put(image, storyPng);
    const rawFile = path.join(outputRoot, 'candidates/raw-kimi.txt');
    const raw = '  {"verdict":"PASS","reason":"Fixture only.","observedCounts":{"subject":1},"issues":[]}\n';
    await put(rawFile, raw);
    const log = vi.fn();
    const deps = { repoRoot, log };
    await expect(runStorytimeCli(['precheck-kimi', '--out', outputRoot, '--record', 'missing', '--raw', rawFile, '--paid'], deps)).rejects.toThrow(/begin|matching|callId/i);
    expect(existsSync(path.join(outputRoot, 'reviews', `${job().id}-v1-kimi.json`))).toBe(false);
    expect(await runStorytimeCli(['precheck-kimi', '--out', outputRoot, '--job', job().id, '--version', '1', '--begin', '--paid'], deps)).toBe(0);
    const ledgerFile = path.join(outputRoot, 'cost-ledger.jsonl');
    const before = (await readFile(ledgerFile, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ event: 'before-call', provider: 'kimi', jobId: job().id, version: 1 });
    expect(before[0].callId).toEqual(expect.any(String));
    const prompts = (await tree(path.join(outputRoot, 'candidates'))).filter((file) => file !== rawFile);
    expect(prompts.length).toBeGreaterThan(0);
    const promptText = (await Promise.all(prompts.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(promptText).toContain(job().text); expect(promptText).toContain(PICTURE_RUBRIC_VERSION);
    expect(await runStorytimeCli(['precheck-kimi', '--out', outputRoot, '--record', before[0].callId, '--raw', rawFile, '--paid'], deps)).toBe(0);
    const entries = (await readFile(ledgerFile, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({ event: 'after-call', callId: before[0].callId, provider: 'kimi', status: 'success' });
    const review = JSON.parse(await readFile(path.join(outputRoot, `reviews/${job().id}-v1-kimi.json`), 'utf8'));
    expect(review.rawOutput).toBe(raw); expect(review.fileSha256).toBe(digest(await readFile(image)));
    expect(review.rubricVersion).toBe(PICTURE_RUBRIC_VERSION);
    expect(await readFile(rawFile, 'utf8')).toBe(raw);
  });

  it('T26: one capture binds both written twins to one stage, time, and camera', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const calibrationRoots = await seedCalibration(outputRoot, repoRoot);
    const capture = vi.fn(async () => capturePacket());
    const stage = stageFile(repoRoot);
    await renderTwins({ jobs: [job()], ...calibrationRoots, outputRoot, version: 1, dryRun: false,
      capture, readStage: async () => stage });
    expect(capture).toHaveBeenCalledOnce();
    const colorFile = candidateRelativePath(job(), 1);
    const lineArtFile = linePath();
    const color = await readFile(path.join(outputRoot, colorFile));
    const line = await readFile(path.join(outputRoot, lineArtFile));
    const records = await readdir(path.join(outputRoot, 'renders'));
    expect(records).toEqual([`${job().id}-v1.json`]);
    const evidence = JSON.parse(await readFile(path.join(outputRoot, 'renders', records[0]!), 'utf8'));
    expect(evidence).toMatchObject({ stageFile: stage.file, stageSha256: digest(stage.bytes), at: stage.at,
      camera: CAMERA, colorFile, colorSha256: digest(color), lineArtFile, lineArtSha256: digest(line),
      width: 3000, height: 2250, warnings: [] });
    expect(evidence.lineArtFormatVersion).toEqual(expect.any(String));
    expect(evidence.lineArtFormatVersion.length).toBeGreaterThan(0);
    expect(evidence.lineArtTechnique).toEqual(expect.any(String));
    expect(evidence.lineArtTechnique.length).toBeGreaterThan(0);
    const rejected = await sandbox();
    const rejectedCalibrationRoots = await seedCalibration(rejected.outputRoot, rejected.repoRoot);
    const brokenCapture = vi.fn(async () => { throw new Error('Test line-art pass failed'); });
    await expect(renderTwins({ jobs: [job()], ...rejected, ...rejectedCalibrationRoots, dryRun: false, capture: brokenCapture,
      readStage: async () => stageFile(rejected.repoRoot) })).rejects.toThrow('Test line-art pass failed');
    expect(brokenCapture).toHaveBeenCalledOnce();
    expect((await tree(rejected.outputRoot)).some((file) => file.endsWith('.png'))).toBe(false);
  });

  it('T27: competing twin bindings and a changed line-art hash fail release', async () => {
    const valid = await twinFixture();
    expect(lineView(await valid.manifest()).status).toBe('ready');
    // These extra fields inject competing per-twin values. They are not required output fields.
    for (const change of [{ lineArtStageSha256: digest('wrong stage') }, { lineArtAt: 0.75 },
      { lineArtCamera: { ...CAMERA, fov: 60 } }, { lineArtSha256: digest('wrong image') }]) {
      const fixture = await twinFixture();
      await json(path.join(fixture.outputRoot, fixture.evidenceFile), { ...fixture.evidence, ...change });
      const manifest = await fixture.manifest();
      expect(lineView(manifest).status, JSON.stringify(change)).toBe('failed');
      expect(verifyOutput(manifest, { release: true }).length).toBeGreaterThan(0);
    }
    const tampered = await twinFixture();
    await put(path.join(tampered.outputRoot, tampered.lineArtFile), await greyPng(binaryPixels(3000, 2250, 0.06)));
    const manifest = await tampered.manifest();
    expect(lineView(manifest).status).toBe('failed');
    expect(verifyOutput(manifest, { release: true }).length).toBeGreaterThan(0);
  }, 30000);

  it('T28: line-art size equals the color size, including the last pixel row', async () => {
    expect((await inspectLineFixture(linePng)).structural.valid).toBe(true);
    const short = await greyPng(binaryPixels(3000, 2249), 3000, 2249);
    expect((await sharp(short).metadata()).height).toBe(2249);
    expect((await inspectLineFixture(short)).structural.valid).toBe(false);
  });

  it('T29: one pixel of 1, 128, or 254 fails the binary check', async () => {
    expect((await inspectLineFixture(linePng)).structural.valid).toBe(true);
    for (const value of [1, 128, 254]) {
      const pixels = binaryPixels();
      pixels[1125 * 3000 + 1500] = value;
      const png = await greyPng(pixels);
      const decoded = await sharp(png).toColourspace('b-w').raw().toBuffer();
      expect(decoded[1125 * 3000 + 1500]).toBe(value);
      expect((await inspectLineFixture(png)).structural.valid, `Grey pixel: ${value}`).toBe(false);
    }
  }, 30000);

  it('T30: line art requires one opaque 8-bit grey channel', async () => {
    const meta = await sharp(linePng).metadata();
    expect(meta).toMatchObject({ channels: 1, depth: 'uchar', hasAlpha: false, space: 'b-w' });
    expect((await inspectLineFixture(linePng)).structural.valid).toBe(true);
    const rgba = await sharp(linePng).toColourspace('srgb').ensureAlpha().png().toBuffer();
    const deep = await sharp(linePng).toColourspace('grey16').png().toBuffer();
    const rgb = await sharp(linePng).toColourspace('srgb').png().toBuffer();
    expect((await sharp(rgba).metadata()).channels).toBe(4);
    expect((await sharp(deep).metadata()).bitsPerSample).toBe(16);
    expect((await sharp(rgb).metadata()).channels).toBe(3);
    for (const png of [rgba, deep, rgb]) expect((await inspectLineFixture(png)).structural.valid).toBe(false);
  }, 30000);

  it('T31: line art rejects an inverted background and a black edge frame', async () => {
    expect((await inspectLineFixture(linePng)).structural.valid).toBe(true);
    const inverted = binaryPixels();
    for (let i = 0; i < inverted.length; i++) inverted[i] = 255 - inverted[i]!;
    expect((await inspectLineFixture(await greyPng(inverted))).structural.valid).toBe(false);
    const framed = binaryPixels();
    for (let y = 0; y < 2250; y++) {
      for (let x = 0; x < 3000; x++) {
        if (x < 60 || x >= 2940 || y < 45 || y >= 2205) framed[y * 3000 + x] = 0;
      }
    }
    expect((await inspectLineFixture(await greyPng(framed))).structural.valid).toBe(false);
  }, 30000);

  it('T32: ink coverage has labeled measurements and inclusive provisional limits', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const share of [0.005, 0.0051, 0.2499, 0.25]) {
      output.mockClear();
      expect((await inspectLineFixture(await greyPng(binaryPixels(3000, 2250, share))))
        .structural.valid, `Black share: ${share}`).toBe(true);
      const lines = output.mock.calls.flat().map(String);
      const measured = lines.map((line) => line.match(/(?:[Ii]nk (?:coverage|share)|[Bb]lack-pixel share):\s*([0-9]+(?:\.[0-9]+)?)\s*%/)).find(Boolean);
      expect(measured, 'The check prints a labeled ink percentage.').toBeDefined();
      expect(Number(measured![1])).toBeCloseTo(share * 100, 2);
    }
    for (const share of [0, 0.0049, 0.2501, 0.3]) {
      expect((await inspectLineFixture(await greyPng(binaryPixels(3000, 2250, share))))
        .structural.valid, `Black share: ${share}`).toBe(false);
    }
  }, 30000);

  it('T33: generated twin paths preserve the color use, subject, and version without pattern overlap', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    const log = vi.fn();
    await planned(repoRoot, outputRoot);
    for (const current of [jobs[0]!, jobs.find((item) => item.bookKind === 'decodable')!]) {
      const capture = vi.fn(async () => capturePacket());
      const readStage = async ({ version }: { version: number }) => stageFile(repoRoot, current, version);
      await runStorytimeCli(['render', '--dry-run', '--job', current.id, '--version', '12', '--out', outputRoot],
        { repoRoot, log, capture: capture as unknown as CliCapture, readStage });
      const expectedLine = linePath(current, 12);
      const colorName = candidateFilename(current, 12);
      expect(log.mock.calls.flat().join('\n')).toContain(expectedLine);
      expect(path.basename(expectedLine)).toMatch(LINE_PATTERN);
      expect(path.basename(expectedLine)).not.toMatch(COLOR_PATTERN);
      expect(colorName).toMatch(COLOR_PATTERN); expect(colorName).not.toMatch(LINE_PATTERN);
      expect(path.basename(expectedLine)).not.toBe(path.basename(linePath(current, 13)));
      expect(capture).not.toHaveBeenCalled();
    }
  });

  it('T34: changed twins write v2 together and preserve both v1 hashes', async () => {
    const fixture = await twinFixture();
    const calibrationRoots = await seedCalibration(fixture.outputRoot, fixture.repoRoot);
    const oldColor = digest(await readFile(path.join(fixture.outputRoot, fixture.file)));
    const oldLine = digest(await readFile(path.join(fixture.outputRoot, fixture.lineArtFile)));
    const newLine = await greyPng(binaryPixels(3000, 2250, 0.06));
    const capture = vi.fn(async () => capturePacket(storyPng, newLine));
    await renderTwins({ jobs: [job()], ...calibrationRoots, outputRoot: fixture.outputRoot,
      version: 2, dryRun: false, capture,
      readStage: async ({ version }) => stageFile(fixture.repoRoot, job(), version) });
    expect(capture).toHaveBeenCalledOnce();
    expect(existsSync(path.join(fixture.outputRoot, candidateRelativePath(job(), 2)))).toBe(true);
    expect(digest(await readFile(path.join(fixture.outputRoot, linePath(job(), 2))))).toBe(digest(newLine));
    expect(digest(await readFile(path.join(fixture.outputRoot, fixture.file)))).toBe(oldColor);
    expect(digest(await readFile(path.join(fixture.outputRoot, fixture.lineArtFile)))).toBe(oldLine);
    const retry = await renderTwins({ jobs: [job()], ...calibrationRoots, outputRoot: fixture.outputRoot,
      version: 1, dryRun: false, capture, readStage: async () => fixture.stage })
      .then(() => 'kept', () => 'refused');
    expect(['kept', 'refused']).toContain(retry);
    expect(digest(await readFile(path.join(fixture.outputRoot, fixture.lineArtFile)))).toBe(oldLine);
  });

  it('T35: line-art batches have independent hashes and complete version records', async () => {
    const fixture = await twinFixture();
    const first = await fixture.manifest();
    const line = lineView(first);
    expect(line).toMatchObject({ file: fixture.lineArtFile, fileSha256: digest(linePng),
      colorFile: fixture.file, renderEvidenceFile: fixture.evidenceFile, status: 'ready' });
    const independent = (file: string, bytes: Buffer) => createHash('sha256')
      .update(JSON.stringify([{ file, sha256: createHash('sha256').update(bytes).digest('hex') }])).digest('hex');
    const colorBatch = `${job().directory}/color`;
    const lineBatch = `${job().directory}/lineart`;
    expect(first.batches.find((item) => item.id === colorBatch)?.sha256).toBe(independent(fixture.file, storyPng));
    expect(first.batches.find((item) => item.id === lineBatch)?.sha256).toBe(independent(fixture.lineArtFile, linePng));
    // A trailing byte changes the file hash, not the decoded image or the ink checks.
    const changed = Buffer.concat([linePng, Buffer.from([0])]);
    await put(path.join(fixture.outputRoot, fixture.lineArtFile), changed);
    await json(path.join(fixture.outputRoot, fixture.evidenceFile), { ...fixture.evidence, lineArtSha256: digest(changed) });
    await json(path.join(fixture.outputRoot, fixture.personFile), { ...fixture.linePerson, fileSha256: digest(changed) });
    await json(path.join(fixture.outputRoot, fixture.styleFile), { ...fixture.style,
      sampleFiles: [{ file: fixture.file, sha256: digest(storyPng) }, { file: fixture.lineArtFile, sha256: digest(changed) }] });
    const second = await fixture.manifest();
    expect(lineView(second).status).toBe('ready');
    expect(second.batches.find((item) => item.id === colorBatch)?.sha256).toBe(independent(fixture.file, storyPng));
    expect(second.batches.find((item) => item.id === lineBatch)?.sha256).toBe(independent(fixture.lineArtFile, changed));
    expect(second.batches.find((item) => item.id === lineBatch)?.sha256).not.toBe(first.batches.find((item) => item.id === lineBatch)?.sha256);
  });

  it('T36: line-art readiness needs color, binding, person, and owner style evidence', async () => {
    const valid = await twinFixture();
    expect(lineView(await valid.manifest()).status).toBe('ready');
    for (const missing of ['binding', 'color-person', 'line-person', 'style']) {
      const fixture = await twinFixture();
      const file = missing === 'binding' ? fixture.evidenceFile
        : missing === 'color-person' ? `reviews/${job().id}-v1-person.json`
          : missing === 'line-person' ? fixture.personFile : fixture.styleFile;
      await rm(path.join(fixture.outputRoot, file));
      const before = lineView(await fixture.manifest()).status;
      expect(before, missing).toBe('pending');
      const model = { ...modelReview(job(), 1, 'kimi', linePng), file: fixture.lineArtFile };
      await json(path.join(fixture.outputRoot, `reviews/${job().id}-v1-lineart-kimi.json`), model);
      expect(lineView(await fixture.manifest()).status, missing).toBe(before);
    }
    for (const invalid of ['person-hash', 'style-class', 'style-fail', 'person-fail', 'format']) {
      const fixture = await twinFixture();
      if (invalid === 'person-hash') await json(path.join(fixture.outputRoot, fixture.personFile), { ...fixture.linePerson, fileSha256: digest('wrong') });
      if (invalid === 'style-class') await json(path.join(fixture.outputRoot, fixture.styleFile), { ...fixture.style, evidenceClass: 'model-pre-check' });
      if (invalid === 'style-fail') await json(path.join(fixture.outputRoot, fixture.styleFile), { ...fixture.style, verdict: 'fail' });
      if (invalid === 'person-fail') await json(path.join(fixture.outputRoot, fixture.personFile), { ...fixture.linePerson, verdict: 'fail' });
      if (invalid === 'format') await put(path.join(fixture.outputRoot, fixture.lineArtFile), await greyPng(Buffer.alloc(3000 * 2250, 255)));
      expect(lineView(await fixture.manifest()).status, invalid).toBe('failed');
    }
  }, 30000);

  it('T37: release checks both twins unless an output filter limits the selection', async () => {
    const fixture = await twinFixture();
    const calibrationRoots = await seedCalibration(fixture.outputRoot, fixture.repoRoot);
    await json(path.join(fixture.outputRoot, 'jobs.json'), jobs);
    const args = ['verify', '--release', '--out', fixture.outputRoot, '--job', job().id];
    const deps = { ...calibrationRoots, log: vi.fn() };
    expect(await runStorytimeCli(args, deps)).toBe(0);
    await rm(path.join(fixture.outputRoot, fixture.personFile));
    await expect(runStorytimeCli(args, deps)).rejects.toThrow(/line.?art|twin/i);
    expect(await runStorytimeCli([...args, '--output', 'color'], deps)).toBe(0);
    await expect(runStorytimeCli([...args, '--output', 'lineart'], deps)).rejects.toThrow(/line.?art|twin/i);
    for (const output of ['color', 'lineart']) {
      await expect(runStorytimeCli(['verify', '--release', '--out', fixture.outputRoot, '--job', 'absent', '--output', output], deps)).rejects.toThrow(/no.*(job|select)|empty/i);
    }
    // Cover and small outputs have no implicit line-art requirement.
    for (const use of ['cover', 'small'] as const) {
      const current = { ...job(), use, size: use };
      const input = candidateInput(current);
      const png = await picture(use);
      input.png = png;
      input.reviews.minimax = modelReview(current, 1, 'minimax', png);
      input.reviews.kimi = modelReview(current, 1, 'kimi', png);
      input.reviews.person = personReview(current, 1, png);
      const candidate = await evaluateCandidate(input);
      expect(verifyOutput(assembleManifest([current], [candidate]), { release: true })).toEqual([]);
    }
  }, 30000);

  it('T38: render dry runs print both paths without capture or output writes', async () => {
    const { repoRoot, outputRoot } = await sandbox();
    await planned(repoRoot, outputRoot);
    const before = await tree(outputRoot);
    const hashes = new Map(await Promise.all(before.map(async (file) => [file, digest(await readFile(file))] as const)));
    const log = vi.fn();
    const capture = vi.fn(async () => capturePacket());
    const code = await runStorytimeCli(['render', '--dry-run', '--out', outputRoot, '--job', job().id], {
      repoRoot, log, capture: capture as unknown as CliCapture,
      readStage: async () => stageFile(repoRoot),
    });
    expect(code).toBe(0); expect(capture).not.toHaveBeenCalled();
    expect(await tree(outputRoot)).toEqual(before);
    for (const [file, hash] of hashes) expect(digest(await readFile(file))).toBe(hash);
    const printed = log.mock.calls.flat().join('\n');
    expect(printed).toContain(candidateRelativePath(job(), 1));
    expect(printed).toContain(linePath());
    expect(printed).not.toContain(linePath(job(), 2));
  });

  it('T39: contact sheets show both twins side by side without changing either file', async () => {
    const pixels = binaryPixels();
    const rgb = Buffer.alloc(pixels.length * 3);
    for (let i = 0; i < pixels.length; i++) {
      const value = pixels[i]!;
      rgb[i * 3] = value === 0 ? 69 : 255;
      rgb[i * 3 + 1] = value === 0 ? 106 : 255;
      rgb[i * 3 + 2] = value === 0 ? 134 : 255;
    }
    const color = await sharp(rgb, { raw: { width: 3000, height: 2250, channels: 3 } }).png().toBuffer();
    const fixture = await twinFixture({ color });
    const before = new Map(await Promise.all([fixture.file, fixture.lineArtFile].map(async (file) => [file, digest(await readFile(path.join(fixture.outputRoot, file)))] as const)));
    const sheet = await createContactSheet(await fixture.manifest(), fixture.outputRoot, {});
    const { data, info } = await sharp(sheet.file).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
    let pairVisible = false;
    for (let y = 0; y < info.height - 6 && !pairVisible; y++) {
      let colorX = -1;
      for (let x = 0; x < info.width - 12; x++) {
        const offset = (y * info.width + x) * 3;
        if (data[offset] === 69 && data[offset + 1] === 106 && data[offset + 2] === 134) colorX = x;
        if (colorX < 0 || x <= colorX + 12) continue;
        let blackBlock = true;
        for (let dy = 0; dy < 6 && blackBlock; dy++) {
          for (let dx = 0; dx < 12; dx++) {
            const i = ((y + dy) * info.width + x + dx) * 3;
            if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) { blackBlock = false; break; }
          }
        }
        if (blackBlock) { pairVisible = true; break; }
      }
    }
    expect(pairVisible, 'The color block and line-art block share a row, with line art on the right.').toBe(true);
    for (const [file, hash] of before) expect(digest(await readFile(path.join(fixture.outputRoot, file)))).toBe(hash);
    await rm(path.join(fixture.outputRoot, fixture.lineArtFile));
    const incomplete = await fixture.manifest();
    expect(lineView(incomplete).status).not.toBe('ready');
  }, 30000);

  it('T40: a missing or failed line-art pass writes neither twin nor evidence', async () => {
    const valid = await sandbox();
    const calibrationRoots = await seedCalibration(valid.outputRoot, valid.repoRoot);
    await renderTwins({ jobs: [job()], ...valid, ...calibrationRoots, dryRun: false, capture: async () => capturePacket(),
      readStage: async () => stageFile(valid.repoRoot) });
    expect(existsSync(path.join(valid.outputRoot, candidateRelativePath(job(), 1)))).toBe(true);
    expect(existsSync(path.join(valid.outputRoot, linePath()))).toBe(true);
    for (const mode of ['missing', 'throw']) {
      const space = await sandbox();
      const calibrationRoots = await seedCalibration(space.outputRoot, space.repoRoot);
      const capture = vi.fn(async () => {
        if (mode === 'throw') throw new Error('Test line-art pass failed');
        return { color: storyPng, camera: CAMERA };
      });
      await expect(renderTwins({ jobs: [job()], ...space, ...calibrationRoots, dryRun: false, capture,
        readStage: async () => stageFile(space.repoRoot) })).rejects.toThrow(/line.?art|twin|image/i);
      expect(capture).toHaveBeenCalledOnce();
      expect(existsSync(path.join(space.outputRoot, candidateRelativePath(job(), 1)))).toBe(false);
      expect(existsSync(path.join(space.outputRoot, linePath()))).toBe(false);
      expect(existsSync(path.join(space.outputRoot, `renders/${job().id}-v1.json`))).toBe(false);
    }
  });

  it('T41: a size parameter writes a new twin version from unchanged stage bytes and camera', async () => {
    const space = await sandbox();
    const calibrationRoots = await seedCalibration(space.outputRoot, space.repoRoot);
    const stage = stageFile(space.repoRoot);
    await put(path.join(space.repoRoot, stage.file), stage.bytes);
    const originalHash = digest(stage.bytes);
    const previousFiles = new Map<string, string>();
    const sizes = [{ width: 3000, height: 2250 }, { width: 4961, height: 3508 }];
    for (const [index, size] of sizes.entries()) {
      const color = await sharp(storyPng).resize(size.width, size.height).png().toBuffer();
      const line = await greyPng(binaryPixels(size.width, size.height), size.width, size.height);
      const capture = vi.fn(async () => capturePacket(color, line));
      await renderTwins({ jobs: [job()], ...space, ...calibrationRoots, version: index + 1, ...size, dryRun: false, capture,
        readStage: async () => stage });
      expect(capture).toHaveBeenCalledOnce();
      const evidence = JSON.parse(await readFile(path.join(space.outputRoot, `renders/${job().id}-v${index + 1}.json`), 'utf8'));
      expect(evidence).toMatchObject({ stageSha256: originalHash, stageFile: stage.file, camera: CAMERA, ...size });
      const colorMeta = await sharp(path.join(space.outputRoot, candidateRelativePath(job(), index + 1))).metadata();
      const lineMeta = await sharp(path.join(space.outputRoot, linePath(job(), index + 1))).metadata();
      expect(colorMeta).toMatchObject(size); expect(lineMeta).toMatchObject(size);
      expect(digest(await readFile(path.join(space.repoRoot, stage.file)))).toBe(originalHash);
      for (const [file, hash] of previousFiles) expect(digest(await readFile(file))).toBe(hash);
      for (const relative of [candidateRelativePath(job(), index + 1), linePath(job(), index + 1)]) {
        const file = path.join(space.outputRoot, relative);
        previousFiles.set(file, digest(await readFile(file)));
      }
    }
    expect((await sharp(path.join(space.outputRoot, candidateRelativePath(job(), 1))).metadata()).width).toBe(3000);
    expect((await sharp(path.join(space.outputRoot, linePath(job(), 1))).metadata()).width).toBe(3000);
    expect((await tree(path.join(space.repoRoot, 'docs'))).length).toBe(1);
  }, 30000);

  it('T49: capture order binds the first camera read and rejects drift, changed pixels, and a missing hook', async () => {
    // Falsification: the order differs, the evidence uses a later state, or a bad capture succeeds.
    for (const mode of ['valid', 'drift', 'pixels', 'missing'] as const) {
      const space = await sandbox();
      const before = await tree(space.outputRoot);
      const events: string[] = [];
      let reads = 0, screenshots = 0;
      const camera = { ...structuredClone(CAMERA), aspect: 4 / 3, near: 0.2, far: 120 };
      const at = 0.625;
      const operations: CaptureOperations = {
        seek: async (time) => { events.push(`seek:${time}`); },
        screenshot: async () => {
          events.push('color'); screenshots++;
          if (mode === 'pixels' && screenshots === 2) {
            const { data, info } = await sharp(storyPng).raw().toBuffer({ resolveWithObject: true });
            data[0] = data[0] === 0 ? 255 : 0;
            return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
          }
          return Buffer.from(storyPng);
        },
        cameraState: async () => {
          events.push('camera');
          return mode === 'missing' ? undefined : structuredClone(camera);
        },
        liveCameraState: async () => {
          events.push('live-camera'); reads++;
          return { ...structuredClone(camera), fov: mode === 'drift' && reads === 2 ? 60 : camera.fov,
            projectionMatrix: Array.from({ length: 16 }, (_, index) => index % 5 === 0 ? 1 : 0) };
        },
        lineArt: async () => { events.push('lineart'); return Buffer.from(linePng); },
      };
      const input = { ...space, job: job(), stage: { ...stageFile(space.repoRoot), at },
        timeline: buildBookStillTimeline(stageSource()), size: { width: 3000, height: 2250 } };
      const run = capturePairForTest(operations, input);
      if (mode === 'valid') {
        const pair = await run;
        expect(events).toEqual([`seek:${at}`, 'color', 'camera', 'live-camera', 'lineart', 'live-camera', `seek:${at}`, 'color']);
        expect(pair.camera).toEqual(camera);
        expect(pair.color).toEqual(storyPng); expect(pair.lineArt).toEqual(linePng);
      } else {
        await expect(run).rejects.toThrow(mode === 'missing' ? /hook|camera/i : mode === 'drift' ? /camera|drift/i : /color|pixel|identical/i);
        if (mode === 'missing') expect(events).not.toContain('lineart');
      }
      expect(await tree(space.outputRoot)).toEqual(before);
    }
  });

  it('T50: smoke checks accept a full ring and reject interior mesh lines and a 30-degree gap', async () => {
    // Falsification: a mesh net or gapped ring passes, a full ring fails, or a labeled value is missing.
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const kind of ['ring', 'net', 'gap'] as const) {
      output.mockClear();
      const accepted = await smokeCheckForTest(await smokePicture(kind));
      const lines = output.mock.calls.flat().map(String).join('\n');
      const ink = lines.match(/fixture interior ink:\s*([0-9]+(?:\.[0-9]+)?)%/);
      const rays = lines.match(/fixture ring rays:\s*([0-9]+)\/360/);
      expect(ink, `${kind}: labeled interior percentage`).not.toBeNull();
      expect(rays, `${kind}: labeled ray count`).not.toBeNull();
      const inkPercent = Number(ink![1]), rayCount = Number(rays![1]);
      if (kind === 'net') expect(inkPercent).toBeGreaterThan(1);
      else expect(inkPercent).toBeLessThanOrEqual(1);
      if (kind === 'gap') expect(rayCount).toBeLessThan(342);
      else expect(rayCount).toBeGreaterThanOrEqual(342);
      expect(accepted, kind).toBe(kind === 'ring');
    }
  });

  it('T51: smoke capture stays isolated, leaves v1 available, and has a capture-free dry run', async () => {
    // Falsification: smoke affects candidates, evidence, manifests, versions, or a dry run captures.
    const space = await sandbox();
    await planned(space.repoRoot, space.outputRoot);
    const stage = stageFile(space.repoRoot);
    await put(path.join(space.repoRoot, stage.file), stage.bytes);
    const packet = smokeCaptureForTest();
    packet.fixtureLineArt = await smokePicture('ring');
    const capture = vi.fn(async () => packet);
    const deps = { repoRoot: space.repoRoot, log: vi.fn(), now: CLOCK, capture: capture as unknown as CliCapture,
      readStage: async () => stage };
    const args = ['lineart-smoke', '--out', space.outputRoot, '--job', job().id];
    const before = await tree(space.outputRoot);
    const hashes = new Map(await Promise.all(before.map(async (file) => [file, digest(await readFile(file))] as const)));
    expect(await runStorytimeCli([...args, '--dry-run'], deps)).toBe(0);
    expect(capture).not.toHaveBeenCalled();
    expect(await tree(space.outputRoot)).toEqual(before);
    expect(await runStorytimeCli(args, deps)).toBe(0);
    expect(capture).toHaveBeenCalledOnce();
    const created = (await tree(space.outputRoot)).filter((file) => !before.includes(file));
    expect(created).toHaveLength(4);
    expect(created.map((file) => path.basename(file)).sort()).toEqual(['color.png', 'fixture-lineart.png', 'lineart.png', 'smoke.json']);
    for (const file of created) expect(path.relative(space.outputRoot, file)).toMatch(/^smoke\/lineart-[^/]+\/[^/]+$/);
    expect(new Set(created.map((file) => path.dirname(file))).size).toBe(1);
    for (const [file, hash] of hashes) expect(digest(await readFile(file))).toBe(hash);
    const manifest = await buildManifest([job()], space.outputRoot, space.repoRoot);
    expect(manifest.jobs[0]!.candidates).toEqual([]);
    expect(JSON.stringify(manifest)).not.toContain('smoke/');
    expect(existsSync(path.join(space.outputRoot, 'manifest.json'))).toBe(false);
    expect(existsSync(path.join(space.outputRoot, 'cost-ledger.jsonl'))).toBe(false);
    const calibrationRoots = await seedCalibration(space.outputRoot, space.repoRoot);
    expect(await runStorytimeCli(['render', '--out', space.outputRoot, '--workbooks', calibrationRoots.workbooksRoot, '--job', job().id], deps)).toBe(0);
    expect(capture).toHaveBeenCalledTimes(2);
    expect(existsSync(path.join(space.outputRoot, candidateRelativePath(job(), 1)))).toBe(true);
    expect(existsSync(path.join(space.outputRoot, linePath(job(), 1)))).toBe(true);
    expect(existsSync(path.join(space.outputRoot, candidateRelativePath(job(), 2)))).toBe(false);
    expect(existsSync(path.join(space.outputRoot, linePath(job(), 2)))).toBe(false);
  });
});

describe('Decoded answer security remediation', () => {
  type Provider = 'minimax' | 'kimi';
  const providers: Provider[] = ['minimax', 'kimi'];
  const suffix = 'the raw answer is refused; no review or raw copy is written.';
  const safeReview = { verdict: 'PASS', reason: 'The subject is visible.', observedCounts: { subject: 1 }, issues: [] };
  const safeModel = 'SYNTHETIC-safe-reported-model';

  afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

  function escapedJson(value: unknown, credential: string): string {
    return JSON.stringify(value).replaceAll(credential, unicodeEscaped(credential));
  }
  /**
   * The safe controls of T101 and T102: a safe top-level review, a safe plain envelope, a safe
   * fenced envelope, a safe FAIL with an invalid count, and a safe PASS with an invalid count.
   */
  function safeControls(): string[] {
    const safe = JSON.stringify({ ...safeReview, reason: 'Nan หนา is visible.', model: safeModel,
      unknown: { nested: { empty: {}, list: [null, false, 4, [], {}, 'safe text'] } } })
      .replaceAll('หนา', unicodeEscaped('หนา'));
    return [safe, envelope(safe), envelope(`\x60\x60\x60json\r\n${safe}\r\n\x60\x60\x60`),
      JSON.stringify({ ...safeReview, verdict: 'FAIL', observedCounts: { subject: 1.5 }, model: safeModel }),
      JSON.stringify({ ...safeReview, observedCounts: { subject: 'one' }, model: safeModel })];
  }
  function envelope(content: string, status = 0): string {
    return JSON.stringify({ content, base_resp: { status_code: status, status_msg: 'Synthetic status' } });
  }
  function answerFindings(raw: string): string[] {
    const seam = (pictureSeams as unknown as {
      decodedAnswerFindings?: (rawOutput: string) => string[];
    }).decodedAnswerFindings;
    expect(seam, 'The shared decodedAnswerFindings seam exists.').toBeTypeOf('function');
    return seam!(raw);
  }
  async function providerRun(provider: Provider, raw: string) {
    // Fake only Date. File operations and test timeouts retain real timers.
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(CLOCK());
    const space = await sandbox();
    await planned(space.repoRoot, space.outputRoot);
    await put(path.join(space.outputRoot, candidateRelativePath(job(), 1)), storyPng);
    const log = vi.fn();
    const deps = { repoRoot: space.repoRoot, log, now: CLOCK,
      runner: vi.fn(async () => ({ stdout: raw, stderr: '' })) };
    const args = [`precheck-${provider}`, '--out', space.outputRoot, '--paid'];
    let callId = '';
    let input: string | undefined;
    if (provider === 'kimi') {
      await runStorytimeCli([...args, '--job', job().id, '--version', '1', '--begin'], deps);
      callId = String((await securityLedger(space.outputRoot))[0]!.callId);
      // The external input is inside this test's temporary repository, outside the output root.
      input = path.join(space.repoRoot, 'input/answer.txt');
      await put(input, raw);
    }
    const ledgerFile = path.join(space.outputRoot, 'cost-ledger.jsonl');
    const beforeLedger = existsSync(ledgerFile) ? await readFile(ledgerFile) : undefined;
    const before = await fileSnapshot(space.outputRoot);
    log.mockClear();
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let error: unknown;
    let code: number | undefined;
    try {
      code = await runStorytimeCli(provider === 'kimi'
        ? [...args, '--record', callId, '--raw', input!]
        : [...args, '--job', job().id, '--version', '1'], deps);
    } catch (caught) { error = caught; }
    const logs = [...log.mock.calls, ...consoleLog.mock.calls, ...consoleError.mock.calls].flat().map(String);
    consoleLog.mockRestore(); consoleError.mockRestore();
    return { ...space, provider, raw, input, beforeLedger, before, error, code, logs, deps,
      entries: await securityLedger(space.outputRoot) };
  }
  async function assertRefused(provider: Provider, raw: string, values: string[], label: string) {
    const key = values[0]!;
    expect.soft(raw, `${label}: the raw scan cannot see the credential.`).not.toContain(key);
    expect.soft(securitySeam('secretFindings')(raw), `${label}: the raw scan has no findings.`).toEqual([]);
    const run = await providerRun(provider, raw);
    const context = `${label}/${provider}`;
    expect.soft(run.error, `${context}: the answer is refused.`).toBeInstanceOf(Error);
    const message = run.error instanceof Error ? run.error.message : '';
    expect.soft(message, `${context}: the error names only the pattern.`).toMatch(/api-key-prefix/);
    expect.soft(message.length, `${context}: the error is bounded.`).toBeLessThanOrEqual(500);
    for (const text of [message, ...run.logs]) for (const value of values) {
      expect.soft(text, `${context}: errors and logs contain no matched text.`).not.toContain(value);
    }
    expect.soft(run.logs, `${context}: no result log is written.`).toEqual([]);
    const beforeCalls = run.entries.filter((entry) => entry.event === 'before-call');
    const afterCalls = run.entries.filter((entry) => entry.event === 'after-call');
    expect.soft(beforeCalls, `${context}: exactly one before-call.`).toHaveLength(1);
    expect.soft(run.entries.filter((entry) => entry.status === 'success'), `${context}: no success entry.`).toEqual([]);
    if (provider === 'minimax') {
      expect.soft(run.deps.runner, `${context}: the fake runner runs once.`).toHaveBeenCalledOnce();
      expect.soft(run.entries, `${context}: exactly two ledger entries.`).toHaveLength(2);
      expect.soft(afterCalls, `${context}: exactly one failure after-call.`).toHaveLength(1);
      expect.soft(afterCalls[0], `${context}: the failure matches the call.`).toMatchObject({
        status: 'failure', callId: beforeCalls[0]?.callId,
      });
      const failure = String(afterCalls[0]?.error ?? '');
      expect.soft(failure, `${context}: the failure names the pattern.`).toMatch(/api-key-prefix/);
      expect.soft(failure.length, `${context}: the failure is bounded.`).toBeLessThanOrEqual(500);
      // The ledger holds the failure entry. Every other file keeps its bytes.
      const beforeFiles = run.before.filter(([file]) => file !== 'cost-ledger.jsonl');
      const afterFiles = (await fileSnapshot(run.outputRoot)).filter(([file]) => file !== 'cost-ledger.jsonl');
      expect.soft(afterFiles, `${context}: only the ledger can change.`).toEqual(beforeFiles);
    } else {
      expect.soft(run.deps.runner, `${context}: Kimi starts no provider.`).not.toHaveBeenCalled();
      expect.soft(afterCalls, `${context}: no after-call is appended.`).toEqual([]);
      expect.soft(await readFile(path.join(run.outputRoot, 'cost-ledger.jsonl')),
        `${context}: the begin ledger stays byte-identical.`).toEqual(run.beforeLedger);
      expect.soft(await fileSnapshot(run.outputRoot), `${context}: every output stays byte-identical.`).toEqual(run.before);
      expect.soft(await readFile(run.input!), `${context}: the source raw file stays byte-identical.`).toEqual(Buffer.from(raw));
    }
    const files = await tree(run.outputRoot);
    expect.soft(files.length, `${context}: the file scan has input.`).toBeGreaterThan(0);
    expect.soft(files.filter((file) => /^(raw|reviews)\//.test(path.relative(run.outputRoot, file))),
      `${context}: no review or raw copy exists.`).toEqual([]);
    // Scan every output file. Only the deliberate external input lies outside this scan.
    await assertNoSyntheticValues([run.outputRoot], values);
    return run;
  }
  async function refuseBoth(raw: string, values: string[], label: string) {
    for (const provider of providers) await assertRefused(provider, raw, values, label);
  }

  it('T96: both providers refuse an escaped top-level model before evidence writes', async () => {
    const values = syntheticCredentials();
    await refuseBoth(escapedJson({ ...safeReview, model: values[0] }, values[0]!), values, 'top-level model');
  }, 120000);

  it('T97: both providers inspect plain and fenced content models', async () => {
    const values = syntheticCredentials();
    const inner = escapedJson({ ...safeReview, model: values[0] }, values[0]!);
    for (const content of [inner, `\x60\x60\x60json\n${inner}\n\x60\x60\x60`]) {
      await refuseBoth(envelope(content), values, content === inner ? 'plain content' : 'fenced content');
    }
  }, 120000);

  it('T98: malformed FAIL and PASS count keys are inspected before schema fallback', async () => {
    const values = syntheticCredentials();
    for (const verdict of ['FAIL', 'PASS']) {
      const raw = escapedJson({ ...safeReview, verdict, observedCounts: { [values[0]!]: 1.5 } }, values[0]!);
      await refuseBoth(raw, values, `${verdict}: malformed count key`);
    }
  }, 120000);

  it('T99: unknown fields retain credential keys and strings at every depth', async () => {
    const values = syntheticCredentials();
    for (const depth of [2, 12]) for (const kind of ['key', 'value']) {
      let unknown: unknown = kind === 'key' ? { [values[0]!]: null } : values[0];
      for (let level = 0; level < depth; level++) unknown = { nested: unknown };
      await refuseBoth(escapedJson({ ...safeReview, unknown }, values[0]!), values, `${kind} at depth ${depth}`);
    }
  }, 120000);

  it('T100: unknown arrays retain string elements and object keys', async () => {
    const values = syntheticCredentials();
    for (const element of [values[0], { [values[0]!]: false }]) {
      const raw = escapedJson({ ...safeReview, unknown: { nested: [null, 3, true, [], {}, element] } }, values[0]!);
      await refuseBoth(raw, values, typeof element === 'string' ? 'array string' : 'array object key');
    }
  }, 120000);

  it('T101: safe controls preserve raw bytes, models, and malformed parser results', async () => {
    const values = syntheticCredentials();
    for (const control of safeControls()) for (const provider of providers) {
      const raw = `${control}\r\n  `;
      const run = await providerRun(provider, raw);
      const expected = parseModelReview(raw);
      expect.soft(run.error, `${provider}: the safe answer is accepted.`).toBeUndefined();
      expect.soft(run.code, `${provider}: the parser verdict determines the exit.`).toBe(expected.verdict === 'pass' ? 0 : 2);
      const review = JSON.parse(await readFile(path.join(run.outputRoot, `reviews/${job().id}-v1-${provider}.json`), 'utf8'));
      expect.soft(review, `${provider}: decoded fields retain parser behavior.`).toMatchObject(expected);
      expect.soft(review.model, `${provider}: the correct model survives.`)
        .toBe(provider === 'minimax' ? safeModel : pictureSeams.KIMI_REVIEW_MODEL);
      expect.soft(review.modelSource).toBe(provider === 'minimax' ? 'reported' : 'declared');
      expect.soft(Buffer.from(review.rawOutput), `${provider}: review raw bytes stay identical.`).toEqual(Buffer.from(raw));
      expect.soft(await readFile(path.join(run.outputRoot, review.rawFile)), `${provider}: raw copy stays identical.`).toEqual(Buffer.from(raw));
      if (run.input) expect.soft(await readFile(run.input)).toEqual(Buffer.from(raw));
      expect.soft(run.entries.map((entry) => entry.event)).toEqual(['before-call', 'after-call']);
      expect.soft(run.entries[1]?.status).toBe('success');
      await assertNoSyntheticValues([run.outputRoot], values);
    }
    // The shared walker must exist and must hold no finding for a safe answer.
    for (const control of safeControls()) {
      expect(answerFindings(control), 'A safe control holds no finding in the shared walker.').toEqual([]);
    }
  }, 120000);

  it('T102: the shared walker inspects every object before selection and status fallback', async () => {
    const values = syntheticCredentials();
    const key = values[0]!;
    const hidden = escapedJson({ unknown: { nested: [{ [key]: [null, true, 0, key] }] } }, key);
    const valid = JSON.stringify(safeReview);
    const cases = [
      { label: 'unselected earlier object', raw: `${hidden}\n${valid}` },
      { label: 'unselected later object', raw: `${valid}\n${hidden}` },
      { label: 'nonzero status envelope', raw: envelope(hidden, 1000) },
      { label: 'embedded unknown JSON string', raw: JSON.stringify({ ...safeReview, unknown: { text: hidden } }) },
    ];
    // Exercise provider wiring even when the new export does not exist at Red.
    for (const item of cases) await refuseBoth(item.raw, values, item.label);
    for (const item of cases) {
      const findings = answerFindings(item.raw);
      expect(findings, item.label).toContain('api-key-prefix');
      for (const finding of findings) {
        const patterns = values.flatMap((value) => securitySeam('secretFindings')(value));
        expect(patterns, 'Findings name only known patterns.').toContain(finding);
        for (const value of values) expect(finding).not.toContain(value);
      }
    }
    const valueKinds = { nil: null, bool: true, integer: 4, decimal: 0.5, string: 'safe', object: {}, array: [] };
    for (const value of [null, true, 4, 0.5, 'safe', {}, [], valueKinds, [null, true, 4, {}, []]]) {
      expect(answerFindings(JSON.stringify({ value })), 'Safe value kinds have no findings.').toEqual([]);
    }
    // The safe controls of T101 hold no finding in the shared walker either.
    for (const control of safeControls()) {
      expect(answerFindings(control), 'A safe control holds no finding.').toEqual([]);
    }
    for (const value of values) {
      const raw = JSON.stringify({ deep: { value } }).replace(JSON.stringify(value), `"${unicodeEscaped(value)}"`);
      const findings = answerFindings(raw);
      expect(findings.length, 'Every credential value yields a pattern.').toBeGreaterThan(0);
      for (const finding of findings) for (const credential of values) expect(finding).not.toContain(credential);
    }
  }, 120000);

  it('T103: decoded refusal messages share the exact suffix through the final CLI boundary', async () => {
    const values = syntheticCredentials();
    // This field already triggers the old check, so suffix failures remain independent of new traversal.
    const raw = escapedJson({ ...safeReview, reason: values[0] }, values[0]!);
    const entry = entrySeam();
    expect(entry, 'The final CLI boundary exists.').toBeTypeOf('function');
    const messages: string[] = [];
    for (const provider of providers) {
      const run = await assertRefused(provider, raw, values, 'decoded message');
      const message = run.error instanceof Error ? run.error.message : '';
      messages.push(message);
      expect.soft(message.endsWith(suffix), `${provider}: the thrown message has the exact suffix.`).toBe(true);
      expect.soft(message, `${provider}: the message claims no broader write exclusion.`).not.toMatch(/nothing is written/);
      const logged: string[] = [];
      expect.soft(await entry!([], { pipeline: async () => { throw run.error; }, errorLog: (text) => { logged.push(text); } })).toBe(1);
      expect.soft(logged).toHaveLength(1);
      expect.soft(logged[0]?.endsWith(suffix), `${provider}: the final CLI keeps the suffix.`).toBe(true);
      expect.soft(logged[0]?.length ?? Infinity).toBeLessThanOrEqual(500);
      for (const text of [message, ...logged]) {
        expect.soft(text).toMatch(/api-key-prefix/);
        for (const value of values) expect.soft(text).not.toContain(value);
      }
    }
    // Both providers end with the same suffix. The prefix before it stays free.
    expect.soft(messages[0]?.slice(-suffix.length)).toBe(messages[1]?.slice(-suffix.length));
  }, 120000);

  describe('Decoded layer remediation', () => {
    // The credential is built at runtime. No fixture file holds a decoded credential.
    function reviewBSecret(): string { return `sk-${'SYNTHETIC'.repeat(4)}`; }
    function reviewBSafe() {
      return { verdict: 'PASS', reason: 'The subject is visible.', observedCounts: { subject: 1 }, issues: [] };
    }
    /** The JSON text of a value. The credential keeps its Unicode escapes inside the text. */
    function reviewBText(value: unknown, credential: string): string {
      return JSON.stringify(value).replaceAll(credential, unicodeEscaped(credential));
    }
    /** A nested JSON text of a known depth. The leaf is a JSON value text. */
    function deepJson(depth: number, leaf: string): string {
      return `${'{"a":'.repeat(depth)}${leaf}${'}'.repeat(depth)}`;
    }
    /** A nested JSON text of a known depth and a known byte size. */
    function paddedDeepJson(depth: number, totalBytes: number): string {
      const open = '{"a":'.repeat(depth);
      const close = '}'.repeat(depth);
      return `${open}"${'x'.repeat(totalBytes - open.length - close.length - 2)}"${close}`;
    }
    /** The source text of one exported function. The region ends at the next export. */
    function functionRegion(source: string, name: string): string {
      const start = source.indexOf(`export async function ${name}`);
      expect(start, `The ${name} function exists.`).toBeGreaterThan(-1);
      const next = source.indexOf('\nexport ', start + 1);
      return next === -1 ? source.slice(start) : source.slice(start, next);
    }
    /** The comment lines that stand directly above a line of a source region. */
    function commentAbove(region: string, needle: string): string {
      const lines = region.split('\n');
      const index = lines.findIndex((line) => line.includes(needle));
      expect(index, `The ${needle} call exists.`).toBeGreaterThan(-1);
      const comment: string[] = [];
      for (let at = index - 1; at >= 0 && lines[at]!.trim().startsWith('//'); at -= 1) {
        comment.unshift(lines[at]!);
      }
      return comment.join(' ');
    }

    // The hostile scans run in a worker thread. The current walker blocks the event loop,
    // and a long scan would then run past the test limit without any report.
    const HOSTILE_WORKER = `
import { parentPort, workerData } from 'node:worker_threads';
import { readFileSync } from 'node:fs';

const report = { ok: false, ms: 0, findings: [], status: null, error: null,
  plain: [], decoded: [], plainSecond: [], decodedSecond: [], findingSets: [] };
const started = Date.now();
try {
  const book = await import(workerData.modulePath);
  if (workerData.mode === 'seam') {
    report.findings = book.decodedAnswerFindings(readFileSync(workerData.rawFile, 'utf8'));
    report.ok = true;
  } else if (workerData.mode === 'rules') {
    // T125: both credential paths read the environment at call time. The second value is
    // stubbed after the first call, so a module-load snapshot loses it.
    process.env[workerData.envName] = workerData.firstValue;
    report.plain = book.secretFindings(workerData.plainText);
    report.decoded = book.decodedAnswerFindings(workerData.decodedText);
    process.env[workerData.envName] = workerData.secondValue;
    report.plainSecond = book.secretFindings(workerData.plainSecondText);
    report.decodedSecond = book.decodedAnswerFindings(workerData.decodedSecondText);
    report.ok = true;
  } else if (workerData.mode === 'corpus') {
    // Task 12: one finding set per text of a seeded corpus.
    report.findingSets = (workerData.texts ?? []).map((text) => book.decodedAnswerFindings(text));
    report.ok = true;
  } else {
    const raw = readFileSync(workerData.rawFile, 'utf8');
    const shared = {
      outputRoot: workerData.outputRoot, repoRoot: workerData.repoRoot, jobs: workerData.jobs,
      workbooksRoot: workerData.workbooksRoot, jobId: workerData.jobId, version: workerData.version,
      paid: true, dryRun: false,
    };
    if (workerData.mode === 'minimax') {
      const runner = async () => ({ stdout: raw, stderr: '' });
      const result = await book.precheckMiniMax({ ...shared, runner });
      report.status = result.status;
    } else {
      const log = () => {};
      const result = await book.precheckKimi({ ...shared, begin: false, record: workerData.callId, raw: workerData.rawFile, log });
      report.status = result.status;
    }
    report.ok = true;
  }
} catch (error) {
  report.ok = false;
  report.error = { name: error && error.name ? error.name : '', message: error && error.message ? error.message : '' };
}
report.ms = Date.now() - started;
parentPort.postMessage(report);
`;
    const HOSTILE_MODULE = path.resolve(import.meta.dirname, '../src/storytime/book-pictures.ts');
    const HOSTILE_LIMIT_MS = 20000;
    const PROVIDER_LIMIT_MS = 30000;
    type HostileReport = {
      ok: boolean; ms: number; findings: string[]; status: string | null;
      error: { name: string; message: string } | null;
      plain: string[]; decoded: string[]; plainSecond: string[]; decodedSecond: string[];
      findingSets: string[][];
    };
    /** Runs one hostile scan in a worker. The test owns the wall-clock limit. */
    async function runHostile(workerData: Record<string, unknown>, limitMs: number) {
      vi.useRealTimers();
      const directory = await mkdtemp(path.join(root, 'hostile-'));
      const scriptFile = path.join(directory, 'hostile.mjs');
      await put(scriptFile, HOSTILE_WORKER);
      const started = performance.now();
      const worker = new Worker(scriptFile, {
        execArgv: ['--import', 'tsx'],
        // The worker stack matches the test process stack. A larger worker stack lets the
        // current recursive walker pass depth 4000 and run for minutes.
        resourceLimits: { stackSizeMb: 1 },
        workerData: { ...workerData, modulePath: HOSTILE_MODULE },
      });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; void worker.terminate(); }, limitMs);
      let report: HostileReport | undefined;
      try {
        report = await new Promise<HostileReport | undefined>((resolve) => {
          worker.on('message', (message) => { resolve(message as HostileReport); });
          worker.on('error', () => { resolve(undefined); });
          worker.on('exit', () => { resolve(undefined); });
        });
      } finally {
        clearTimeout(timer);
        await worker.terminate();
      }
      return { report, elapsed: Math.round(performance.now() - started), timedOut };
    }
    /** A provider workspace with the candidate, the raw answer, and the Kimi begin entry. */
    async function providerWorkspace(provider: Provider, raw: string) {
      const space = await sandbox();
      await planned(space.repoRoot, space.outputRoot);
      await put(path.join(space.outputRoot, candidateRelativePath(job(), 1)), storyPng);
      const rawFile = path.join(space.repoRoot, 'input/answer.txt');
      await put(rawFile, raw);
      let callId = '';
      if (provider === 'kimi') {
        const deps = { repoRoot: space.repoRoot, log: vi.fn(), now: CLOCK };
        await runStorytimeCli(['precheck-kimi', '--out', space.outputRoot, '--paid',
          '--job', job().id, '--version', '1', '--begin'], deps);
        callId = String((await securityLedger(space.outputRoot))[0]!.callId);
      }
      const before = await fileSnapshot(space.outputRoot);
      return { space, rawFile, callId, before };
    }

    it('T104: both providers refuse Review B case 1 with an extra string layer', async () => {
      const credential = reviewBSecret();
      const values = [credential];
      const hidden = reviewBText({ value: credential }, credential);
      const raw = JSON.stringify({ ...reviewBSafe(), unknown: JSON.stringify(hidden) });
      await refuseBoth(raw, values, 'Review B case 1');
    }, 120000);

    it('T105: both providers refuse three string layers', async () => {
      const credential = reviewBSecret();
      const values = [credential];
      const hidden = reviewBText({ value: credential }, credential);
      const raw = JSON.stringify({ ...reviewBSafe(), unknown: JSON.stringify(JSON.stringify(hidden)) });
      await refuseBoth(raw, values, 'Review B case 1 with a second string layer');
    }, 120000);

    it('T106: both providers refuse Review B case 3 with a root array', async () => {
      const credential = reviewBSecret();
      const values = [credential];
      const raw = JSON.stringify([reviewBSafe(), credential]).replaceAll(credential, unicodeEscaped(credential));
      await refuseBoth(raw, values, 'Review B case 3');
    }, 120000);

    it('T107: both providers refuse Review B case 2 with a scalar array element', async () => {
      const credential = reviewBSecret();
      const values = [credential];
      const raw = JSON.stringify({
        ...reviewBSafe(), unknown: JSON.stringify([credential, {}]).replaceAll(credential, unicodeEscaped(credential)),
      });
      await refuseBoth(raw, values, 'Review B case 2');
    }, 120000);

    it('T108: both providers refuse a nonzero-status envelope with a string-layer array', async () => {
      const credential = reviewBSecret();
      const values = [credential];
      const arrayText = JSON.stringify([credential, {}]).replaceAll(credential, unicodeEscaped(credential));
      const raw = envelope(JSON.stringify(arrayText), 1000);
      await refuseBoth(raw, values, 'nonzero status with a string-layer array');
    }, 120000);

    it('T109: both providers refuse an escaped credential at object depth 4000 without a RangeError', async () => {
      const credential = reviewBSecret();
      const values = [credential];
      const raw = deepJson(4000, `"${unicodeEscaped(credential)}"`);
      for (const provider of providers) {
        const space = await providerWorkspace(provider, raw);
        const context = `deep credential/${provider}`;
        const run = await runHostile({
          mode: provider, outputRoot: space.space.outputRoot, repoRoot: space.space.repoRoot,
          jobs, workbooksRoot: WORKBOOKS, jobId: job().id, version: 1,
          rawFile: space.rawFile, callId: space.callId,
        }, PROVIDER_LIMIT_MS);
        // The message and the flags carry every check. An error object never reaches an assertion.
        const message = run.report?.error?.message ?? '';
        expect.soft(run.timedOut, `${context}: the call must finish within ${PROVIDER_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.error?.name ?? '', `${context}: the refusal is not a RangeError.`)
          .not.toBe('RangeError');
        expect.soft(message, `${context}: the error names only the pattern.`).toMatch(/api-key-prefix/);
        expect.soft(message.endsWith(suffix), `${context}: the message has the task 9 suffix.`).toBe(true);
        expect.soft(message, `${context}: the message names no stack overflow.`)
          .not.toMatch(/Maximum call stack size exceeded/);
        const entries = await securityLedger(space.space.outputRoot);
        expect.soft(entries.filter((entry) => entry.status === 'success'), `${context}: no success entry.`)
          .toEqual([]);
        const files = await tree(space.space.outputRoot);
        expect.soft(files.filter((file) => /^(raw|reviews)\//.test(path.relative(space.space.outputRoot, file))),
          `${context}: no review or raw copy exists.`).toEqual([]);
        if (provider === 'kimi') {
          expect.soft(await fileSnapshot(space.space.outputRoot), `${context}: every output stays byte-identical.`)
            .toEqual(space.before);
          expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays byte-identical.`)
            .toEqual(Buffer.from(raw));
        }
        await assertNoSyntheticValues([space.space.outputRoot], values);
      }
    }, 120000);

    it('T110: a safe object at depth 4000 keeps the parser result and the raw bytes', async () => {
      const raw = JSON.stringify({ ...reviewBSafe(), unknown: deepJson(4000, '"safe text"') });
      const expected = parseModelReview(raw);
      for (const provider of providers) {
        const space = await providerWorkspace(provider, raw);
        const context = `safe deep answer/${provider}`;
        const run = await runHostile({
          mode: provider, outputRoot: space.space.outputRoot, repoRoot: space.space.repoRoot,
          jobs, workbooksRoot: WORKBOOKS, jobId: job().id, version: 1,
          rawFile: space.rawFile, callId: space.callId,
        }, PROVIDER_LIMIT_MS);
        expect.soft(run.timedOut, `${context}: the call must finish within ${PROVIDER_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.error ?? null, `${context}: the safe deep answer is accepted.`).toBeNull();
        expect.soft(run.report?.error?.name ?? '', `${context}: the call raises no RangeError.`)
          .not.toBe('RangeError');
        const reviewFile = path.join(space.space.outputRoot, `reviews/${job().id}-v1-${provider}.json`);
        expect.soft(existsSync(reviewFile), `${context}: the review file exists.`).toBe(true);
        if (!existsSync(reviewFile)) continue;
        const review = JSON.parse(await readFile(reviewFile, 'utf8'));
        expect.soft(review, `${context}: the parser result is unchanged.`).toMatchObject(expected);
        expect.soft(review.model, `${context}: the declared model survives.`)
          .toBe(provider === 'minimax' ? pictureSeams.MINIMAX_VISION_MODEL : pictureSeams.KIMI_REVIEW_MODEL);
        expect.soft(review.modelSource, `${context}: the model source is declared.`).toBe('declared');
        expect.soft(Buffer.from(review.rawOutput), `${context}: the review raw bytes stay identical.`)
          .toEqual(Buffer.from(raw));
        expect.soft(await readFile(path.join(space.space.outputRoot, review.rawFile)),
          `${context}: the raw copy stays identical.`).toEqual(Buffer.from(raw));
        expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays byte-identical.`)
          .toEqual(Buffer.from(raw));
      }
    }, 120000);

    it('T111: the seam scans a 65,536-byte answer at depth 400 within 2000 ms', async () => {
      const raw = paddedDeepJson(400, 65536);
      expect.soft(Buffer.byteLength(raw, 'utf8'), 'The answer has 65,536 bytes.').toBe(65536);
      const directory = await mkdtemp(path.join(root, 'hostile-'));
      const rawFile = path.join(directory, 'answer.json');
      await put(rawFile, raw);
      const run = await runHostile({ mode: 'seam', rawFile }, HOSTILE_LIMIT_MS);
      const measured = run.report?.ms ?? run.elapsed;
      console.log(`decoded scan ms: ${measured}`);
      expect.soft(run.timedOut, `decoded scan ms: ${run.elapsed} exceeds the test limit ${HOSTILE_LIMIT_MS} ms.`)
        .toBe(false);
      expect.soft(run.report?.findings ?? [], 'A safe deep answer holds no finding.').toEqual([]);
      expect.soft(measured, `decoded scan ms: ${measured}`).toBeLessThanOrEqual(2000);
    }, 120000);

    it('T112: both providers accept safe string layers, a safe root array, and safe encoded arrays', async () => {
      const values = syntheticCredentials();
      const safeModel = 'SYNTHETIC-safe-reported-model';
      const controls = [
        {
          label: 'safe string layer',
          raw: JSON.stringify({ ...reviewBSafe(), model: safeModel, unknown: JSON.stringify(JSON.stringify({ note: 'safe text' })) }),
          model: safeModel, source: 'reported',
        },
        {
          label: 'safe root array',
          raw: JSON.stringify([{ ...reviewBSafe(), model: safeModel }]),
          model: pictureSeams.MINIMAX_VISION_MODEL, source: 'declared',
        },
        {
          label: 'safe encoded array',
          raw: JSON.stringify({ ...reviewBSafe(), model: safeModel, unknown: JSON.stringify([{ note: 'safe text' }, 'safe text']) }),
          model: safeModel, source: 'reported',
        },
        {
          label: 'escaped Unicode',
          raw: JSON.stringify({ ...reviewBSafe(), model: safeModel, note: unicodeEscaped('หนา') }),
          model: safeModel, source: 'reported',
        },
      ];
      for (const control of controls) for (const provider of providers) {
        const run = await providerRun(provider, control.raw);
        const context = `${control.label}/${provider}`;
        expect.soft(run.error, `${context}: the safe answer is accepted.`).toBeUndefined();
        expect.soft(run.code, `${context}: the parser verdict determines the exit.`)
          .toBe(parseModelReview(control.raw).verdict === 'pass' ? 0 : 2);
        const reviewFile = path.join(run.outputRoot, `reviews/${job().id}-v1-${provider}.json`);
        expect.soft(existsSync(reviewFile), `${context}: the review file exists.`).toBe(true);
        if (!existsSync(reviewFile)) continue;
        const review = JSON.parse(await readFile(reviewFile, 'utf8'));
        expect.soft(review, `${context}: decoded fields retain parser behavior.`)
          .toMatchObject(parseModelReview(control.raw));
        expect.soft(review.model, `${context}: the model stays unchanged.`)
          .toBe(provider === 'minimax' ? control.model : pictureSeams.KIMI_REVIEW_MODEL);
        expect.soft(review.modelSource, `${context}: the model source stays unchanged.`)
          .toBe(provider === 'minimax' ? control.source : 'declared');
        expect.soft(Buffer.from(review.rawOutput), `${context}: the review raw bytes stay identical.`)
          .toEqual(Buffer.from(control.raw));
        expect.soft(await readFile(path.join(run.outputRoot, review.rawFile)), `${context}: the raw copy stays identical.`)
          .toEqual(Buffer.from(control.raw));
        if (run.input) expect.soft(await readFile(run.input), `${context}: the source raw file stays identical.`)
          .toEqual(Buffer.from(control.raw));
        await assertNoSyntheticValues([run.outputRoot], values);
      }
    }, 120000);

    it('T113: the decodedReviewFindings export is gone', () => {
      expect(Object.keys(pictureSeams), 'decodedReviewFindings is not exported.').not.toContain('decodedReviewFindings');
      expect('decodedReviewFindings' in pictureSeams, 'decodedReviewFindings is not a module member.').toBe(false);
    });

    it('T114: the decoded check runs before parseModelReview and the Kimi comment matches', () => {
      const source = readFileSync(path.resolve(import.meta.dirname, '../src/storytime/book-pictures.ts'), 'utf8');
      for (const name of ['precheckMiniMax', 'precheckKimi']) {
        const region = functionRegion(source, name);
        const check = region.indexOf('decodedAnswerFindings(');
        const parse = region.indexOf('parseModelReview(');
        expect(check, `${name}: the decoded check exists.`).toBeGreaterThan(-1);
        expect(parse, `${name}: the schema parse exists.`).toBeGreaterThan(-1);
        expect(check, `${name}: the decoded check runs before the schema parse.`).toBeLessThan(parse);
      }
      const comment = commentAbove(functionRegion(source, 'precheckKimi'), 'decodedAnswerFindings(');
      expect(comment.length, 'The Kimi decoded check has a comment.').toBeGreaterThan(0);
      expect(comment, 'The Kimi comment states that the check reads the raw answer.')
        .toMatch(/raw\s+(answer|output|bytes|text|response|provider)/i);
    });

    it('T115: the seam scans a wide answer with 1200 injected secrets within 2000 ms', async () => {
      const names: string[] = [];
      const values: string[] = [];
      try {
        for (let index = 0; index < 1200; index += 1) {
          const name = `TASK10_SECRET_${index}_KEY`;
          const value = `sek${index.toString(16).padStart(8, '0')}SYNTHETICVALUE`;
          process.env[name] = value;
          names.push(name);
          values.push(value);
        }
        const entries = names.map((name, index) => `"${name}":"${values[index]}"`);
        const entriesText = entries.join(',');
        const pad = 65536 - `{${entriesText},"pad":""}`.length;
        const raw = `{${entriesText},"pad":"${'x'.repeat(pad)}"}`;
        expect.soft(Buffer.byteLength(raw, 'utf8'), 'The answer has 65,536 bytes.').toBe(65536);
        const directory = await mkdtemp(path.join(root, 'hostile-'));
        const rawFile = path.join(directory, 'answer.json');
        await put(rawFile, raw);
        const run = await runHostile({ mode: 'seam', rawFile }, HOSTILE_LIMIT_MS);
        const measured = run.report?.ms ?? run.elapsed;
        console.log(`rule scan ms: ${measured}`);
        expect.soft(run.timedOut, `rule scan ms: ${run.elapsed} exceeds the test limit ${HOSTILE_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(new Set(run.report?.findings ?? []).size, 'Every injected secret yields one rule name.')
          .toBe(1200);
        expect.soft(measured, `rule scan ms: ${measured}`).toBeLessThanOrEqual(2000);
      } finally {
        for (const name of names) delete process.env[name];
      }
      expect(Object.keys(process.env).filter((name) => name.startsWith('TASK10_SECRET_')),
        'The injected env names are gone.').toEqual([]);
    }, 120000);

    describe('JSON string token remediation', () => {
      // Task 11. Every hostile row scans the raw answer text of a provider answer.
      // The credential is built at run time. No fixture file holds a decoded credential.
      const TOKEN_SUFFIX = suffix;
      const TOKEN_PROVIDER_LIMIT_MS = 30000;
      const TOKEN_MALFORMED_LIMIT_MS = 60000;

      /** The Review B credential of task 11. */
      function tokenSecret(): string { return `sk-${'SYNTHETIC'.repeat(4)}`; }
      /** The JSON escape form of a value. The decoded text holds the value. */
      function tokenEscaped(value: string): string { return unicodeEscaped(value); }
      /**
       * The Review B constructions of task 11. Each raw text holds the escaped credential
       * only. The plain credential never appears in the raw text. T119 and T122 hold two forms
       * each. The first form puts the credential in the last duplicate key. A duplicate key
       * name survives `JSON.parse`, so that form is already refused at this HEAD. The second
       * form hides the credential: T119 puts it in a key of an earlier duplicate value, and
       * T122 puts it in the malformed tail behind the fence.
       */
      function tokenRaws(): Record<string, string> {
        const secret = tokenSecret();
        const escaped = tokenEscaped(secret);
        const safe = reviewBSafe();
        return {
          fencedRootArray:
            '```json\n' + JSON.stringify([safe, secret]).replaceAll(secret, escaped) + '\n```',
          safeThenRootArray:
            JSON.stringify(safe) + '\n' + JSON.stringify([secret]).replaceAll(secret, escaped),
          earlierDuplicateValue:
            '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},' +
            '"issues":[],"unknown":"' + escaped + '","unknown":"safe"}',
          duplicateKey:
            '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},' +
            '"issues":[],' + '"' + escaped + '":1,"' + escaped + '":2}',
          earlierDuplicateKey:
            '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},' +
            '"issues":[],"nested":{"' + escaped + '":1},"nested":{"subject":2}}',
          malformedUnknownField:
            JSON.stringify(safe).slice(0, -1) + ',"unknown":"' + escaped + '",}',
          fenceDuplicateKeyTail:
            '```json\n' + '{"verdict":"PASS","reason":"The subject is visible.",' +
            '"observedCounts":{"subject":1},"issues":[],' + '"' + escaped + '":1,"' + escaped + '":2}' +
            '\n```' + '\n' + '{"note":"' + escaped + '",',
          fenceTailCredential:
            '```json\n' + '{"verdict":"PASS","reason":"The subject is visible.",' +
            '"observedCounts":{"subject":1},"issues":[],"unknown":1,"unknown":2}' +
            '\n```' + '\n' + '{"note":"' + escaped + '",',
        };
      }
      /** Runs one provider call in the worker harness. The test owns the wall-clock limit. */
      async function tokenRun(provider: Provider, raw: string) {
        const space = await providerWorkspace(provider, raw);
        const run = await runHostile({
          mode: provider, outputRoot: space.space.outputRoot, repoRoot: space.space.repoRoot,
          jobs, workbooksRoot: WORKBOOKS, jobId: job().id, version: 1,
          rawFile: space.rawFile, callId: space.callId,
        }, TOKEN_PROVIDER_LIMIT_MS);
        return { space, run };
      }
      /** The refusal invariants of task 11. Each artifact is checked by name. */
      async function expectTokenRefusal(provider: Provider, raw: string, label: string) {
        const secret = tokenSecret();
        const { space, run } = await tokenRun(provider, raw);
        const context = `${label}/${provider}`;
        const message = run.report?.error?.message ?? '';
        expect.soft(run.timedOut, `${context}: the call finishes inside ${TOKEN_PROVIDER_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.error?.name ?? '', `${context}: the refusal is not a RangeError.`)
          .not.toBe('RangeError');
        expect.soft(message, `${context}: the refusal names only the pattern.`).toMatch(/api-key-prefix/);
        expect.soft(message, `${context}: the refusal holds no matched text.`).not.toContain(secret);
        expect.soft(message.endsWith(TOKEN_SUFFIX), `${context}: the refusal has the task 10 suffix.`)
          .toBe(true);
        const entries = await securityLedger(space.space.outputRoot);
        expect.soft(entries.filter((entry) => entry.status === 'success'), `${context}: no success entry.`)
          .toEqual([]);
        const files = await tree(space.space.outputRoot);
        expect.soft(files.filter((file) => /^(raw|reviews)\//.test(path.relative(space.space.outputRoot, file))),
          `${context}: no review or raw copy exists.`).toEqual([]);
        if (provider === 'kimi') {
          expect.soft(await fileSnapshot(space.space.outputRoot), `${context}: every output stays byte-identical.`)
            .toEqual(space.before);
          expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays byte-identical.`)
            .toEqual(Buffer.from(raw));
        }
        await assertNoSyntheticValues([space.space.outputRoot], [secret]);
      }

      it('T116: both providers refuse Review B case 1, the fenced root array', async () => {
        const raw = tokenRaws().fencedRootArray!;
        for (const provider of providers) await expectTokenRefusal(provider, raw, 'fenced root array');
      }, 120000);

      it('T117: both providers refuse Review B case 2, a safe review then a root array', async () => {
        const raw = tokenRaws().safeThenRootArray!;
        for (const provider of providers) await expectTokenRefusal(provider, raw, 'safe review then root array');
      }, 120000);

      it('T118: both providers refuse Review B case 3, the earlier duplicate value', async () => {
        const raw = tokenRaws().earlierDuplicateValue!;
        for (const provider of providers) await expectTokenRefusal(provider, raw, 'earlier duplicate value');
      }, 120000);

      it('T119: both providers refuse Review B case 4, the duplicate key', async () => {
        const raws = tokenRaws();
        const cases: Array<[string, string]> = [
          ['duplicate key', raws.duplicateKey!],
          ['duplicate key in an earlier duplicate value', raws.earlierDuplicateKey!],
        ];
        for (const [label, raw] of cases) for (const provider of providers) {
          await expectTokenRefusal(provider, raw, label);
        }
      }, 120000);

      it('T120: both providers refuse Review B case 5, the malformed unknown field', async () => {
        const raw = tokenRaws().malformedUnknownField!;
        for (const provider of providers) await expectTokenRefusal(provider, raw, 'malformed unknown field');
      }, 120000);

      it('T121: the seam scans 65,536 unmatched opening braces within 2000 ms', async () => {
        const raw = '{'.repeat(65536);
        const directory = await mkdtemp(path.join(root, 'hostile-'));
        const rawFile = path.join(directory, 'answer.json');
        await put(rawFile, raw);
        const run = await runHostile({ mode: 'seam', rawFile }, TOKEN_MALFORMED_LIMIT_MS);
        const measured = run.report?.ms ?? run.elapsed;
        const printed = `malformed scan ms: ${measured}`;
        console.log(printed);
        const parsed = Number(/^malformed scan ms:\s*([0-9]+)$/.exec(printed)?.[1] ?? '');
        expect.soft(run.timedOut,
          `malformed scan ms: ${run.elapsed} exceeds the test limit ${TOKEN_MALFORMED_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.findings ?? [], 'The malformed text holds no finding.').toEqual([]);
        expect.soft(parsed, 'The labeled duration is an integer.').toBe(measured);
        expect.soft(parsed, printed).toBeLessThanOrEqual(2000);
      }, 120000);

      it('T122: both providers refuse the fence, the duplicate key, and the malformed tail', async () => {
        const raws = tokenRaws();
        const cases: Array<[string, string]> = [
          ['fence, duplicate key, and malformed tail', raws.fenceDuplicateKeyTail!],
          ['fence and malformed tail with the credential', raws.fenceTailCredential!],
        ];
        for (const [label, raw] of cases) for (const provider of providers) {
          await expectTokenRefusal(provider, raw, label);
        }
      }, 120000);

      it('T123: both providers accept the safe answers and keep the bytes, the models, and the writes', async () => {
        const secret = tokenSecret();
        const safeModel = 'SYNTHETIC-safe-reported-model';
        const controls = [
          {
            label: 'safe fenced array',
            raw: '```json\n' + JSON.stringify([reviewBSafe()]) + '\n```',
            model: pictureSeams.MINIMAX_VISION_MODEL, source: 'declared',
          },
          {
            label: 'safe duplicate keys',
            raw: '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},' +
              '"issues":[],"model":"' + safeModel + '","unknown":"safe text","unknown":"second safe text"}',
            model: safeModel, source: 'reported',
          },
          {
            label: 'safe malformed answer',
            raw: JSON.stringify(reviewBSafe()).slice(0, -1) + ',"note":"safe text"',
            model: pictureSeams.MINIMAX_VISION_MODEL, source: 'declared',
          },
          {
            label: 'escaped Unicode',
            raw: JSON.stringify({ ...reviewBSafe(), note: 'หนา' }).replaceAll('หนา', tokenEscaped('หนา')),
            model: pictureSeams.MINIMAX_VISION_MODEL, source: 'declared',
          },
        ];
        for (const control of controls) for (const provider of providers) {
          const { space, run } = await tokenRun(provider, control.raw);
          const context = `${control.label}/${provider}`;
          const expected = parseModelReview(control.raw);
          expect.soft(run.timedOut, `${context}: the call finishes inside ${TOKEN_PROVIDER_LIMIT_MS} ms.`)
            .toBe(false);
          expect.soft(run.report?.error ?? null, `${context}: the safe answer is accepted.`).toBeNull();
          expect.soft(run.report?.status ?? null, `${context}: the parser verdict is the status.`)
            .toBe(expected.verdict);
          const reviewFile = path.join(space.space.outputRoot, `reviews/${job().id}-v1-${provider}.json`);
          expect.soft(existsSync(reviewFile), `${context}: the review file exists.`).toBe(true);
          if (!existsSync(reviewFile)) continue;
          const review = JSON.parse(await readFile(reviewFile, 'utf8'));
          expect.soft(review, `${context}: the parser result is unchanged.`).toMatchObject(expected);
          expect.soft(review.model, `${context}: the model stays unchanged.`)
            .toBe(provider === 'minimax' ? control.model : pictureSeams.KIMI_REVIEW_MODEL);
          expect.soft(review.modelSource, `${context}: the model source stays unchanged.`)
            .toBe(provider === 'minimax' ? control.source : 'declared');
          expect.soft(Buffer.from(review.rawOutput), `${context}: the review raw bytes stay identical.`)
            .toEqual(Buffer.from(control.raw));
          expect.soft(await readFile(path.join(space.space.outputRoot, review.rawFile)),
            `${context}: the raw copy stays identical.`).toEqual(Buffer.from(control.raw));
          if (provider === 'kimi') {
            expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays identical.`)
              .toEqual(Buffer.from(control.raw));
          }
          await assertNoSyntheticValues([space.space.outputRoot], [secret]);
        }
      }, 120000);

      it('T124: the long pattern name is cut and the task 10 suffix stays in every message', async () => {
        const name = `TASK11_LONG_${'A'.repeat(400)}_KEY`;
        const value = 'sek-long-SYNTHETIC-0001';
        const pattern = `env:${name}`;
        const raw = JSON.stringify({ ...reviewBSafe(), unknown: value })
          .replaceAll(value, tokenEscaped(value));
        process.env[name] = value;
        try {
          const { space, run } = await tokenRun('minimax', raw);
          const context = 'long pattern name/minimax';
          expect.soft(run.timedOut, `${context}: the call finishes inside ${TOKEN_PROVIDER_LIMIT_MS} ms.`)
            .toBe(false);
          const message = run.report?.error?.message ?? '';
          expect.soft(message, `${context}: the refusal names the pattern.`).toMatch(/env:TASK11_LONG_/);
          expect.soft(message, `${context}: the refusal holds no matched value.`).not.toContain(value);
          expect.soft(message.length, `${context}: the refusal has 500 characters at most.`)
            .toBeLessThanOrEqual(500);
          expect.soft(message.endsWith(TOKEN_SUFFIX), `${context}: the refusal keeps the task 10 suffix.`)
            .toBe(true);
          expect.soft(message, `${context}: the refusal holds the first 32 characters of the pattern name.`)
            .toContain(pattern.slice(0, 32));
          const entries = await securityLedger(space.space.outputRoot);
          const failures = entries.filter((entry) => entry.status === 'failure');
          expect.soft(failures, `${context}: one failure entry.`).toHaveLength(1);
          const ledgerError = String(failures[0]?.error ?? '');
          expect.soft(ledgerError, `${context}: the ledger error holds no matched value.`).not.toContain(value);
          expect.soft(ledgerError.length, `${context}: the ledger error has 500 characters at most.`)
            .toBeLessThanOrEqual(500);
          expect.soft(ledgerError.endsWith(TOKEN_SUFFIX), `${context}: the ledger error keeps the task 10 suffix.`)
            .toBe(true);
          expect.soft(ledgerError, `${context}: the ledger error holds the first 32 characters of the pattern name.`)
            .toContain(pattern.slice(0, 32));
          const entry = entrySeam();
          expect.soft(entry, 'The runStorytimeBookPicturesEntry seam exists.').toBeTypeOf('function');
          if (typeof entry === 'function') {
            const logged: string[] = [];
            const code = await entry(['render', '--job', job().id], {
              pipeline: async () => { throw new Error(message); },
              errorLog: (text: string) => { logged.push(text); },
            });
            expect.soft(code, `${context}: the entry returns the exit code 1.`).toBe(1);
            expect.soft(logged.length, `${context}: the entry logs one message.`).toBe(1);
            const finalMessage = logged[0] ?? '';
            expect.soft(finalMessage, `${context}: the CLI error holds no matched value.`).not.toContain(value);
            expect.soft(finalMessage.length, `${context}: the CLI error has 500 characters at most.`)
              .toBeLessThanOrEqual(500);
            expect.soft(finalMessage.endsWith(TOKEN_SUFFIX), `${context}: the CLI error keeps the task 10 suffix.`)
              .toBe(true);
            expect.soft(finalMessage, `${context}: the CLI error holds the first 32 characters of the pattern name.`)
              .toContain(pattern.slice(0, 32));
          }
          const kimi = await tokenRun('kimi', raw);
          const kimiMessage = kimi.run.report?.error?.message ?? '';
          expect.soft(kimiMessage, 'long pattern name/kimi: the refusal names the pattern.')
            .toMatch(/env:TASK11_LONG_/);
          expect.soft(kimiMessage.length, 'long pattern name/kimi: the refusal has 500 characters at most.')
            .toBeLessThanOrEqual(500);
          expect.soft(kimiMessage.endsWith(TOKEN_SUFFIX), 'long pattern name/kimi: the refusal keeps the task 10 suffix.')
            .toBe(true);
          expect.soft(kimiMessage, 'long pattern name/kimi: the refusal holds the first 32 characters of the pattern name.')
            .toContain(pattern.slice(0, 32));
        } finally {
          delete process.env[name];
        }
        expect(Object.keys(process.env).filter((entry) => entry.startsWith('TASK11_LONG_')),
          'The injected env name is gone.').toEqual([]);
      }, 120000);

      it('T125: one rule builder serves the raw path and the decoded path', async () => {
        const name = 'TASK11_SHARED_KEY';
        const first = 'sek-shared-SYNTHETIC-0001';
        const second = 'sek-shared-SYNTHETIC-0002';
        process.env[name] = first;
        try {
          const run = await runHostile({
            mode: 'rules', envName: name, firstValue: first, secondValue: second,
            plainText: `The answer holds ${first}.`,
            decodedText: JSON.stringify({ unknown: first }).replaceAll(first, tokenEscaped(first)),
            plainSecondText: `The answer holds ${second}.`,
            decodedSecondText: JSON.stringify({ unknown: second }).replaceAll(second, tokenEscaped(second)),
          }, TOKEN_PROVIDER_LIMIT_MS);
          expect.soft(run.timedOut, 'The rule scan finishes inside the test limit.').toBe(false);
          expect.soft(run.report?.error ?? null, 'The rule scan raises no error.').toBeNull();
          expect.soft(run.report?.plain ?? [], 'The raw path finds the first value.').toContain(`env:${name}`);
          expect.soft(run.report?.decoded ?? [], 'The decoded path finds the escaped first value.')
            .toContain(`env:${name}`);
          expect.soft(run.report?.plainSecond ?? [], 'The raw path finds the second value.').toContain(`env:${name}`);
          expect.soft(run.report?.decodedSecond ?? [], 'The decoded path finds the escaped second value.')
            .toContain(`env:${name}`);
        } finally {
          delete process.env[name];
        }
        expect(Object.keys(process.env).filter((entry) => entry.startsWith('TASK11_SHARED_')),
          'The injected env name is gone.').toEqual([]);
      }, 120000);

      it('T126: the decoded-check comments name the raw answer, the order, and the current finding', () => {
        const source = readFileSync(path.resolve(import.meta.dirname, '../src/storytime/book-pictures.ts'), 'utf8');
        const minimax = commentAbove(functionRegion(source, 'precheckMiniMax'), 'decodedAnswerFindings(');
        expect.soft(minimax, 'The MiniMax decoded check has a comment.').not.toContain('RB3-01');
        expect.soft(minimax, 'The MiniMax comment states that the check reads the raw answer.')
          .toMatch(/raw\s+(answer|output|bytes|text|response|provider)/i);
        expect.soft(minimax, 'The MiniMax comment states that the check runs before any write.')
          .toMatch(/before\s+(any|every|a|the)\s+(record\s+)?write/i);
        const kimi = commentAbove(functionRegion(source, 'precheckKimi'), 'decodedAnswerFindings(');
        expect.soft(kimi, 'The Kimi decoded check has a comment.').not.toContain('RB3-01');
        expect.soft(kimi, 'The Kimi comment states that the check reads the raw answer.')
          .toMatch(/raw\s+(answer|output|bytes|text|response|provider)/i);
        expect.soft(kimi, 'The Kimi comment states that the check runs before any write.')
          .toMatch(/before\s+(any|every|a|the)\s+(record\s+)?write/i);
      });

      it('T127: the MiniMax path writes no evidence for every refused construction', async () => {
        const secret = tokenSecret();
        for (const [label, raw] of Object.entries(tokenRaws())) {
          const { space, run } = await tokenRun('minimax', raw);
          const context = `MiniMax write boundary/${label}`;
          expect.soft(run.timedOut, `${context}: the call finishes inside ${TOKEN_PROVIDER_LIMIT_MS} ms.`)
            .toBe(false);
          const entries = await securityLedger(space.space.outputRoot);
          const beforeCalls = entries.filter((entry) => entry.event === 'before-call');
          const afterCalls = entries.filter((entry) => entry.event === 'after-call');
          expect.soft(beforeCalls, `${context}: exactly one before-call.`).toHaveLength(1);
          expect.soft(afterCalls, `${context}: exactly one after-call.`).toHaveLength(1);
          expect.soft(afterCalls[0], `${context}: the after-call is a failure.`).toMatchObject({ status: 'failure' });
          const failure = String(afterCalls[0]?.error ?? '');
          expect.soft(failure, `${context}: the failure holds no matched value.`).not.toContain(secret);
          expect.soft(failure.length, `${context}: the failure has 500 characters at most.`)
            .toBeLessThanOrEqual(500);
          expect.soft(entries.filter((entry) => entry.status === 'success'), `${context}: no success entry.`)
            .toEqual([]);
          const files = await tree(space.space.outputRoot);
          expect.soft(files.filter((file) => /^(raw|reviews)\//.test(path.relative(space.space.outputRoot, file))),
            `${context}: no review or raw copy exists.`).toEqual([]);
          await assertNoSyntheticValues([space.space.outputRoot], [secret]);
        }
      }, 120000);

      it('T128: the Kimi path writes no evidence for every refused construction', async () => {
        const secret = tokenSecret();
        for (const [label, raw] of Object.entries(tokenRaws())) {
          const { space, run } = await tokenRun('kimi', raw);
          const context = `Kimi write boundary/${label}`;
          expect.soft(run.timedOut, `${context}: the call finishes inside ${TOKEN_PROVIDER_LIMIT_MS} ms.`)
            .toBe(false);
          expect.soft(await fileSnapshot(space.space.outputRoot), `${context}: every output stays byte-identical.`)
            .toEqual(space.before);
          expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays byte-identical.`)
            .toEqual(Buffer.from(raw));
          const files = await tree(space.space.outputRoot);
          expect.soft(files.filter((file) => /^(raw|reviews)\//.test(path.relative(space.space.outputRoot, file))),
            `${context}: no review or raw copy exists.`).toEqual([]);
          await assertNoSyntheticValues([space.space.outputRoot], [secret]);
        }
      }, 120000);
    });

    describe('Malformed string remediation', () => {
      // Task 12. The credential is built at run time. No fixture file holds a decoded credential.
      // Every hostile row runs in the worker harness. The test owns the wall-clock limit.
      const MALFORMED_SUFFIX = suffix;
      const MALFORMED_PROVIDER_LIMIT_MS = 30000;
      const MALFORMED_GENERATOR_LIMIT_MS = 60000;
      const MALFORMED_CHAIN_LIMIT_MS = 60000;
      const MALFORMED_WIDE_LIMIT_MS = 120000;
      const GENERATOR_SEED = 20261025;
      const GENERATOR_CASES = 240;
      const SAMPLE_INDEXES = [0, 2, 5, 9, 14, 20, 27, 35, 44, 54, 65, 77];
      const SCAN_BYTES = 65536;
      const CHAIN_LEVELS = 113;
      const CHAIN_FOLD = 116;

      /** The Review B credential of task 12. */
      function malformedSecret(): string { return `sk-${'SYNTHETIC'.repeat(4)}`; }
      /** The JSON escape form of a value. The decoded text holds the value. */
      function malformedEscaped(value: string): string { return unicodeEscaped(value); }
      /** The safe review text of the fixtures. */
      function malformedSafe(): string { return JSON.stringify(reviewBSafe()); }

      /**
       * The five Review B constructions of task 12. Each text holds the escaped credential
       * only. The plain credential never appears in the raw text.
       */
      function malformedRaws(): Array<{ label: string; raw: string }> {
        const secret = malformedSecret();
        const escaped = malformedEscaped(secret);
        const safe = malformedSafe();
        return [
          { label: 'unterminated token', raw: safe + '\n{"note":"' + escaped },
          { label: 'trailing backslash', raw: safe + '\n"' + escaped + '\\' },
          { label: 'raw control character', raw: safe + '\n{"note":"' + escaped + '\nmore"}' },
          { label: 'invalid escape', raw: safe + '\n{"note":"' + escaped + '\\q"}' },
          { label: 'stray prose quote', raw: safe + '\nThe pole is 5" tall. '
            + JSON.stringify({ note: secret }).replaceAll(secret, escaped) },
        ];
      }

      /** The safe twin of a text. The twin keeps every byte but the credential bytes. */
      function malformedTwin(raw: string): string {
        return raw.replaceAll(malformedEscaped(malformedSecret()), '');
      }

      /** The fixed piece list of the generated corpus. The order and the seed stay fixed. */
      const GENERATOR_SHAPES = ['object', 'unterminated', 'backslash', 'control', 'invalid-escape',
        'array', 'duplicate-key', 'key'] as const;
      const GENERATOR_HEADS = ['safe', 'fenced', 'duplicate'] as const;
      const GENERATOR_PROSE = ['The subject is visible.', 'The pole is 5" tall.',
        'The frame is 6" wide and 3" tall.', 'A "quoted" note follows.', 'The answer ends here.'] as const;
      type GeneratedParams = { shape: string; head: string; prose: string; layers: number };

      /** A small linear congruential step. The generator adds no dependency. */
      function lcg(seed: number): () => number {
        let state = seed >>> 0;
        return () => {
          state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
          return state / 4294967296;
        };
      }
      /** The pieces of one generated case. The draws stay in a fixed order. */
      function drawParams(draw: () => number): GeneratedParams {
        return {
          shape: GENERATOR_SHAPES[Math.floor(draw() * GENERATOR_SHAPES.length)]!,
          head: GENERATOR_HEADS[Math.floor(draw() * GENERATOR_HEADS.length)]!,
          prose: GENERATOR_PROSE[Math.floor(draw() * GENERATOR_PROSE.length)]!,
          layers: Math.floor(draw() * 4),
        };
      }
      /**
       * One generated text. The credential sits in a JSON string segment. The text may hold
       * stray quotes, an unterminated tail, a trailing backslash, a raw control character, an
       * invalid escape, a fence, a duplicate key, an array, and 0 to 3 extra string layers.
       */
      function buildGenerated(params: GeneratedParams, credential: string): string {
        let inner = '{"note":"' + credential + '"}';
        if (params.shape === 'unterminated') inner = '{"note":"' + credential;
        else if (params.shape === 'backslash') inner = '{"note":"' + credential + '\\';
        else if (params.shape === 'control') inner = '{"note":"' + credential + '\nmore"}';
        else if (params.shape === 'invalid-escape') inner = '{"note":"' + credential + '\\q"}';
        else if (params.shape === 'array') inner = '["' + credential + '"]';
        else if (params.shape === 'duplicate-key') inner = '{"note":"' + credential + '","note":"safe"}';
        else if (params.shape === 'key') inner = '{"' + credential + '":1}';
        for (let level = 0; level < params.layers; level += 1) inner = JSON.stringify(inner);
        let head = malformedSafe();
        if (params.head === 'fenced') head = '```json\n' + head + '\n```';
        else if (params.head === 'duplicate') head = head.slice(0, -1) + ',"note":"safe","note":"safe text"}';
        return head + '\n' + params.prose + '\n' + inner;
      }
      /** The seeded corpus. Every case has one safe twin. The twin keeps every other byte. */
      function generatedCorpus(): Array<{ shape: string; text: string; twin: string }> {
        const draw = lcg(GENERATOR_SEED);
        const cases: Array<{ shape: string; text: string; twin: string }> = [];
        for (let index = 0; index < GENERATOR_CASES; index += 1) {
          const params = drawParams(draw);
          cases.push({
            shape: params.shape,
            text: buildGenerated(params, malformedEscaped(malformedSecret())),
            twin: buildGenerated(params, ''),
          });
        }
        return cases;
      }

      /** A wide answer of the byte budget. It holds many distinct short strings. */
      function wideAnswer(totalBytes: number): { text: string; tokens: number } {
        const values: string[] = [];
        let size = 2;
        let index = 0;
        for (;;) {
          const value = `w${index.toString(36)}`;
          const cost = value.length + 3;
          if (size + cost > totalBytes - 64) break;
          values.push(value);
          size += cost;
          index += 1;
        }
        const prefix = `[${values.map((value) => `"${value}"`).join(',')},`;
        const pad = totalBytes - Buffer.byteLength(prefix, 'utf8') - 3;
        return { text: `${prefix}"${'x'.repeat(pad)}"]`, tokens: values.length };
      }

      /**
       * The Review B cost note: the shortest m-fold quote encoding is `\u005c` plus (m-2) times
       * `u005c` plus `u0022`, which is 5m+1 characters. A 65,536-byte answer holds about 113
       * layers of that encoding.
       */
      function foldQuote(depth: number): string {
        return depth <= 1 ? '"' : '\\u005c' + 'u005c'.repeat(depth - 2) + 'u0022';
      }
      /** One more level of the chain. The level below sits inside one escaped quote pair. */
      function wrapChainLevel(text: string): string {
        return '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
      }
      /** A chain of nested quote segments. The scan visits every level of the chain. */
      function chainText(levels: number, filler: string): string {
        let text = '"' + foldQuote(CHAIN_FOLD) + filler + '"';
        for (let level = 1; level < levels; level += 1) text = wrapChainLevel(text);
        return text;
      }
      /** The chain answer of the byte budget. The level count follows the byte budget. */
      function chainAnswer(totalBytes: number): { text: string; levels: number } {
        let levels = 1;
        let text = chainText(levels, '');
        while (levels < CHAIN_LEVELS) {
          const next = chainText(levels + 1, '');
          if (Buffer.byteLength(next, 'utf8') > totalBytes - 4096) break;
          text = next;
          levels += 1;
        }
        const filler = totalBytes - Buffer.byteLength(text, 'utf8');
        return { text: chainText(levels, 'x'.repeat(filler)), levels };
      }

      /** Runs one provider call in the worker harness. The test owns the wall-clock limit. */
      async function malformedRun(provider: Provider, raw: string) {
        const space = await providerWorkspace(provider, raw);
        const run = await runHostile({
          mode: provider, outputRoot: space.space.outputRoot, repoRoot: space.space.repoRoot,
          jobs, workbooksRoot: WORKBOOKS, jobId: job().id, version: 1,
          rawFile: space.rawFile, callId: space.callId,
        }, MALFORMED_PROVIDER_LIMIT_MS);
        return { space, run };
      }
      /** The refusal invariants of task 12. Each artifact is checked by name. */
      async function expectMalformedRefusal(provider: Provider, raw: string, label: string) {
        const secret = malformedSecret();
        const { space, run } = await malformedRun(provider, raw);
        const context = `${label}/${provider}`;
        const message = run.report?.error?.message ?? '';
        expect.soft(run.timedOut, `${context}: the call finishes inside ${MALFORMED_PROVIDER_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.error?.name ?? '', `${context}: the refusal is not a RangeError.`)
          .not.toBe('RangeError');
        expect.soft(message, `${context}: the refusal names only the pattern.`).toMatch(/api-key-prefix/);
        expect.soft(message, `${context}: the refusal holds no matched text.`).not.toContain(secret);
        expect.soft(message.endsWith(MALFORMED_SUFFIX), `${context}: the refusal has the task 10 suffix.`)
          .toBe(true);
        const entries = await securityLedger(space.space.outputRoot);
        expect.soft(entries.filter((entry) => entry.status === 'success'), `${context}: no success entry.`)
          .toEqual([]);
        const files = await tree(space.space.outputRoot);
        expect.soft(files.filter((file) => /^(raw|reviews)\//.test(path.relative(space.space.outputRoot, file))),
          `${context}: no review or raw copy exists.`).toEqual([]);
        if (provider === 'kimi') {
          expect.soft(await fileSnapshot(space.space.outputRoot), `${context}: every output stays byte-identical.`)
            .toEqual(space.before);
          expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays byte-identical.`)
            .toEqual(Buffer.from(raw));
        }
        await assertNoSyntheticValues([space.space.outputRoot], [secret]);
        return /api-key-prefix/.test(message);
      }

      it('T129: both providers refuse the unterminated token', async () => {
        const raw = malformedRaws()[0]!.raw;
        console.log('unterminated token refused');
        for (const provider of providers) await expectMalformedRefusal(provider, raw, 'unterminated token');
      }, 120000);

      it('T130: both providers refuse the trailing backslash', async () => {
        const raw = malformedRaws()[1]!.raw;
        console.log('trailing backslash refused');
        for (const provider of providers) await expectMalformedRefusal(provider, raw, 'trailing backslash');
      }, 120000);

      it('T131: both providers refuse the raw control character and the MiniMax envelope', async () => {
        const raw = malformedRaws()[2]!.raw;
        console.log('raw control character refused');
        for (const provider of providers) {
          await expectMalformedRefusal(provider, raw, 'raw control character');
        }
        const envelopeRaw = JSON.stringify({ content: raw, base_resp: { status_code: 0 } });
        await expectMalformedRefusal('minimax', envelopeRaw, 'raw control character in the MiniMax envelope');
      }, 180000);

      it('T132: both providers refuse the invalid escape', async () => {
        const raw = malformedRaws()[3]!.raw;
        console.log('invalid escape refused');
        for (const provider of providers) await expectMalformedRefusal(provider, raw, 'invalid escape');
      }, 120000);

      it('T133: both providers refuse the stray prose quote', async () => {
        const raw = malformedRaws()[4]!.raw;
        console.log('stray prose quote refused');
        for (const provider of providers) await expectMalformedRefusal(provider, raw, 'stray prose quote');
      }, 120000);

      it('T134: the seeded generator finds every credential case and no twin', async () => {
        const corpus = generatedCorpus();
        const texts = [...corpus.map((item) => item.text), ...corpus.map((item) => item.twin)];
        const run = await runHostile({ mode: 'corpus', texts }, MALFORMED_GENERATOR_LIMIT_MS);
        expect.soft(run.timedOut, `The corpus scan finishes inside ${MALFORMED_GENERATOR_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.ok ?? false, 'The worker ran the seam for every text.').toBe(true);
        const sets = run.report?.findingSets ?? [];
        expect.soft(sets.length, 'The worker returns one finding set per text.').toBe(texts.length);
        let findings = 0;
        const missed: string[] = [];
        corpus.forEach((item, index) => {
          if ((sets[index] ?? []).length > 0) findings += 1;
          else missed.push(`${index}:${item.shape}`);
        });
        let twinFindings = 0;
        corpus.forEach((item, index) => {
          if ((sets[corpus.length + index] ?? []).length > 0) twinFindings += 1;
        });
        const casesPrinted = `generated cases: ${corpus.length}`;
        const findingsPrinted = `generated findings: ${findings}`;
        const twinPrinted = `generated twin findings: ${twinFindings}`;
        console.log(casesPrinted);
        console.log(findingsPrinted);
        console.log(twinPrinted);
        for (const item of missed.slice(0, 24)) console.log(`missed case: ${item}`);
        const parsedCases = Number(/^generated cases:\s*([0-9]+)$/.exec(casesPrinted)?.[1] ?? '');
        const parsedFindings = Number(/^generated findings:\s*([0-9]+)$/.exec(findingsPrinted)?.[1] ?? '');
        expect.soft(parsedCases, 'The labeled case count is an integer.').toBe(corpus.length);
        expect.soft(parsedFindings, 'The labeled finding count is an integer.').toBe(findings);
        expect.soft(parsedCases, casesPrinted).toBe(GENERATOR_CASES);
        expect.soft(parsedFindings, findingsPrinted).toBe(GENERATOR_CASES);
        expect.soft(twinFindings, twinPrinted).toBe(0);
      }, 180000);

      it('T135: both providers refuse the sampled generated cases', async () => {
        const corpus = generatedCorpus();
        const cases = SAMPLE_INDEXES.map((index) => corpus[index]!);
        let refusals = 0;
        for (const [position, item] of cases.entries()) {
          for (const provider of providers) {
            const refused = await expectMalformedRefusal(provider, item.text,
              `sample case ${SAMPLE_INDEXES[position]} shape ${item.shape}`);
            if (refused) refusals += 1;
            else console.log(`sample case: ${SAMPLE_INDEXES[position]} shape: ${item.shape} provider: ${provider}`);
          }
        }
        const casesPrinted = `sample cases: ${cases.length}`;
        const refusalsPrinted = `sample refusals: ${refusals}`;
        console.log(casesPrinted);
        console.log(refusalsPrinted);
        const parsedCases = Number(/^sample cases:\s*([0-9]+)$/.exec(casesPrinted)?.[1] ?? '');
        const parsedRefusals = Number(/^sample refusals:\s*([0-9]+)$/.exec(refusalsPrinted)?.[1] ?? '');
        expect.soft(parsedCases, 'The labeled case count is an integer.').toBe(cases.length);
        expect.soft(parsedRefusals, 'The labeled refusal count is an integer.').toBe(refusals);
        expect.soft(parsedCases, casesPrinted).toBe(SAMPLE_INDEXES.length);
        expect.soft(parsedRefusals, refusalsPrinted).toBe(SAMPLE_INDEXES.length * providers.length);
      }, 300000);

      it('T136: the seam scans the wide answer with the T115 rules within the labeled bound', async () => {
        const names: string[] = [];
        try {
          for (let index = 0; index < 1200; index += 1) {
            const name = `TASK10_SECRET_${index}_KEY`;
            process.env[name] = `sek${index.toString(16).padStart(8, '0')}SYNTHETICVALUE`;
            names.push(name);
          }
          const wide = wideAnswer(SCAN_BYTES);
          expect.soft(Buffer.byteLength(wide.text, 'utf8'), 'The answer has 65,536 bytes.').toBe(SCAN_BYTES);
          const directory = await mkdtemp(path.join(root, 'hostile-'));
          const rawFile = path.join(directory, 'answer.json');
          await put(rawFile, wide.text);
          const run = await runHostile({ mode: 'seam', rawFile }, MALFORMED_WIDE_LIMIT_MS);
          const measured = run.report?.ms ?? run.elapsed;
          const printed = `wide scan ms: ${measured}`;
          console.log(printed);
          console.log(`wide tokens: ${wide.tokens}`);
          const parsed = Number(/^wide scan ms:\s*([0-9]+)$/.exec(printed)?.[1] ?? '');
          expect.soft(run.timedOut,
            `wide scan ms: ${run.elapsed} exceeds the test limit ${MALFORMED_WIDE_LIMIT_MS} ms.`).toBe(false);
          expect.soft(run.report?.ok ?? false, 'The worker ran the seam.').toBe(true);
          expect.soft(run.report?.findings ?? [], 'The safe wide answer holds no finding.').toEqual([]);
          expect.soft(parsed, 'The labeled duration is an integer.').toBe(measured);
          expect.soft(parsed, printed).toBeLessThanOrEqual(60000);
        } finally {
          for (const name of names) delete process.env[name];
        }
        expect(Object.keys(process.env).filter((name) => name.startsWith('TASK10_SECRET_')),
          'The injected env names are gone.').toEqual([]);
      }, 180000);

      it('T137: the seam scans the chain answer within the labeled bound', async () => {
        const chain = chainAnswer(SCAN_BYTES);
        expect.soft(Buffer.byteLength(chain.text, 'utf8'), 'The answer has 65,536 bytes.').toBe(SCAN_BYTES);
        console.log(`chain levels: ${chain.levels}`);
        const directory = await mkdtemp(path.join(root, 'hostile-'));
        const rawFile = path.join(directory, 'answer.json');
        await put(rawFile, chain.text);
        const run = await runHostile({ mode: 'seam', rawFile }, MALFORMED_CHAIN_LIMIT_MS);
        const measured = run.report?.ms ?? run.elapsed;
        const printed = `chain scan ms: ${measured}`;
        console.log(printed);
        const parsed = Number(/^chain scan ms:\s*([0-9]+)$/.exec(printed)?.[1] ?? '');
        expect.soft(run.timedOut,
          `chain scan ms: ${run.elapsed} exceeds the test limit ${MALFORMED_CHAIN_LIMIT_MS} ms.`).toBe(false);
        expect.soft(run.report?.ok ?? false, 'The worker ran the seam.').toBe(true);
        expect.soft(run.report?.findings ?? [], 'The safe chain answer holds no finding.').toEqual([]);
        expect.soft(parsed, 'The labeled duration is an integer.').toBe(measured);
        expect.soft(parsed, printed).toBeLessThanOrEqual(20000);
      }, 120000);

      it('T138: the safe twins yield no finding and both providers accept them', async () => {
        const corpus = generatedCorpus();
        const twins: Array<{ label: string; twin: string }> = [
          ...malformedRaws().map((item) => ({ label: item.label, twin: malformedTwin(item.raw) })),
          ...corpus.map((item, index) => ({ label: `generated ${index}:${item.shape}`, twin: item.twin })),
        ];
        const run = await runHostile({ mode: 'corpus', texts: twins.map((item) => item.twin) },
          MALFORMED_GENERATOR_LIMIT_MS);
        expect.soft(run.timedOut, `The twin scan finishes inside ${MALFORMED_GENERATOR_LIMIT_MS} ms.`)
          .toBe(false);
        expect.soft(run.report?.ok ?? false, 'The worker ran the seam for every twin.').toBe(true);
        const sets = run.report?.findingSets ?? [];
        expect.soft(sets.length, 'The worker returns one finding set per twin.').toBe(twins.length);
        let twinFindings = 0;
        twins.forEach((item, index) => {
          if ((sets[index] ?? []).length > 0) {
            twinFindings += 1;
            console.log(`twin finding: ${index}:${item.label}`);
          }
        });
        const casesPrinted = `twin cases: ${twins.length}`;
        const findingsPrinted = `twin findings: ${twinFindings}`;
        console.log(casesPrinted);
        console.log(findingsPrinted);
        const parsedCases = Number(/^twin cases:\s*([0-9]+)$/.exec(casesPrinted)?.[1] ?? '');
        const parsedFindings = Number(/^twin findings:\s*([0-9]+)$/.exec(findingsPrinted)?.[1] ?? '');
        expect.soft(parsedCases, 'The labeled case count is an integer.').toBe(twins.length);
        expect.soft(parsedFindings, 'The labeled finding count is an integer.').toBe(twinFindings);
        expect.soft(parsedCases, casesPrinted).toBe(malformedRaws().length + GENERATOR_CASES);
        expect.soft(parsedFindings, findingsPrinted).toBe(0);
        for (const index of [0, 1, 2, 3, 4]) {
          const twin = twins[index]!.twin;
          for (const provider of providers) {
            const { space, run: providerResult } = await malformedRun(provider, twin);
            const context = `twin ${index} ${twins[index]!.label}/${provider}`;
            expect.soft(providerResult.timedOut,
              `${context}: the call finishes inside ${MALFORMED_PROVIDER_LIMIT_MS} ms.`).toBe(false);
            expect.soft(providerResult.report?.error ?? null, `${context}: the twin is accepted.`)
              .toBeNull();
            const expected = parseModelReview(twin);
            expect.soft(providerResult.report?.status ?? null, `${context}: the parser verdict is the status.`)
              .toBe(expected.verdict);
            const reviewFile = path.join(space.space.outputRoot, `reviews/${job().id}-v1-${provider}.json`);
            expect.soft(existsSync(reviewFile), `${context}: the review file exists.`).toBe(true);
            if (!existsSync(reviewFile)) continue;
            const written = JSON.parse(await readFile(reviewFile, 'utf8'));
            expect.soft(written, `${context}: the parser result is unchanged.`).toMatchObject(expected);
            expect.soft(written.model, `${context}: the model stays unchanged.`)
              .toBe(provider === 'minimax' ? pictureSeams.MINIMAX_VISION_MODEL : pictureSeams.KIMI_REVIEW_MODEL);
            expect.soft(Buffer.from(written.rawOutput), `${context}: the review raw bytes stay identical.`)
              .toEqual(Buffer.from(twin));
            expect.soft(await readFile(path.join(space.space.outputRoot, written.rawFile)),
              `${context}: the raw copy stays identical.`).toEqual(Buffer.from(twin));
            if (provider === 'kimi') {
              expect.soft(await readFile(space.rawFile), `${context}: the source raw file stays byte-identical.`)
                .toEqual(Buffer.from(twin));
            }
            await assertNoSyntheticValues([space.space.outputRoot], [malformedSecret()]);
          }
        }
      }, 300000);
    });
  });
});

describe('Model review parser regressions', () => {
  // Exact bytes from the first MiniMax call acd4f807. The tests read no live output file.
  const realMmxFail = "{\n  \"content\": \"```json\\n{\\n  \\\"verdict\\\": \\\"FAIL\\\",\\n  \\\"reason\\\": \\\"The source text asks 'How many suns? One sun!', but there is no sun visible in the image.\\\",\\n  \\\"observedCounts\\\": {\\n    \\\"suns\\\": 0\\n  },\\n  \\\"issues\\\": [\\n    \\\"Missing required object: sun (0 observed, expected 1)\\\"\\n  ]\\n}\\n```\",\n  \"base_resp\": {\n    \"status_code\": 0,\n    \"status_msg\": \"success\"\n  }\n}\n";
  // This PASS is synthetic. It tests the same envelope shape, not a live model result.
  const passReview = { verdict: 'PASS', reason: 'One sun is visible.', observedCounts: { suns: 1 }, issues: [] };
  const fencedPass = '```json\n' + JSON.stringify(passReview, null, 2) + '\n```';
  const passEnvelope = { ...JSON.parse(realMmxFail), content: fencedPass };

  it('T54: the real mmx FAIL envelope preserves the model reason, counts, and issue', () => {
    // Falsification: the parser replaces any structured FAIL field with a fallback value.
    expect(parseModelReview(realMmxFail)).toEqual({
      verdict: 'fail',
      reason: "The source text asks 'How many suns? One sun!', but there is no sun visible in the image.",
      observedCounts: { suns: 0 },
      issues: ['Missing required object: sun (0 observed, expected 1)'],
    });
  });

  it('T55: a structured PASS inside the mmx envelope preserves its counts', () => {
    // Falsification: the parser rejects the successful envelope or loses a structured field.
    expect(parseModelReview(JSON.stringify(passEnvelope))).toEqual({ ...passReview, verdict: 'pass' });
  });

  it('T56: a plain fenced JSON PASS preserves the review fields', () => {
    // Falsification: the parser rejects a chat review solely because it has a JSON fence.
    expect(parseModelReview(fencedPass)).toEqual({ ...passReview, verdict: 'pass' });
  });

  it('T57: a non-zero provider status rejects an enclosed PASS', () => {
    // Falsification: the parser accepts the content while ignoring the provider error status.
    const failedEnvelope = { ...passEnvelope, base_resp: { status_code: 1000, status_msg: 'Synthetic provider error' } };
    expect(parseModelReview(JSON.stringify(failedEnvelope)).verdict).toBe('fail');
  });

  it('T58: unstructured FAIL text remains a failure', () => {
    // Falsification: the parser accepts a failure that has no structured review.
    expect(parseModelReview('FAIL: no sun is visible.').verdict).toBe('fail');
  });

  it('T59: unstructured PASS text cannot pass', () => {
    // Falsification: the parser accepts a PASS word without a structured review.
    expect(parseModelReview('PASS: one sun is visible.').verdict).toBe('fail');
  });

  it('T60: a PASS object needs valid counts and issues', () => {
    // Falsification: missing fields, invalid counts, or invalid issues pass validation.
    const { observedCounts: _counts, ...withoutCounts } = passReview;
    const { issues: _issues, ...withoutIssues } = passReview;
    const invalidReviews = [
      withoutCounts, withoutIssues,
      ...[null, { suns: '1' }, { suns: 0.5 }, { suns: -1 }].map((observedCounts) => ({ ...passReview, observedCounts })),
      ...[null, 'none', [1]].map((issues) => ({ ...passReview, issues })),
    ];
    for (const review of invalidReviews) {
      const raw = JSON.stringify(review);
      expect(parseModelReview(raw).verdict, raw).toBe('fail');
    }
  });
});

describe('Review A remediation', () => {
  const technique = 'song-page-form-edges-viewdepth-1bit-v2';
  const nanText = 'Hello, I am Nan.';
  const nanPrompt = 'Nan, a five-year-old girl with large dark-brown eyes, short black hair in two small bunches, an orange T-shirt with a white star, red shorts, and white sneakers.';
  const rawPass = JSON.stringify({ verdict: 'PASS', reason: 'Synthetic review.', observedCounts: { subject: 1 }, issues: [] });
  const calibrationTarget = pictureSeams.calibrationTarget;
  const gate = pictureSeams.assertCalibrationReady as unknown as
    (outputRoot: string, workbooksRoot: string, repoRoot: string) => Promise<void>;
  type CaptureInput = Parameters<typeof pictureSeams.captureBookStill>[0];
  type FakePage = Awaited<ReturnType<typeof fakePage>>;

  async function fakePage(notes: string[] = [], publishedFovOffset = 0) {
    const THREE = await import('three');
    const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.2, 120);
    camera.position.set(0, 1, 5);
    const published = { ...structuredClone(CAMERA), aspect: camera.aspect, near: camera.near, far: camera.far,
      fov: camera.fov + publishedFovOffset };
    const events: string[] = [];
    let loaded: unknown;
    const browserWindow: {
      __song?: unknown;
      __bookStill?: { camera: typeof camera; cameraState: typeof published; scene: object; renderer: object };
    } = {};
    const load = vi.fn((timeline: unknown) => {
      events.push('load'); loaded = timeline; delete browserWindow.__bookStill; return notes;
    });
    const seek = vi.fn((at: number) => {
      events.push(`seek:${at}`);
      if (!loaded) throw new Error('seek before load');
      browserWindow.__bookStill = { camera, cameraState: structuredClone(published), scene: {}, renderer: {} };
    });
    browserWindow.__song = { load, seek, ready: true, portrait: false };
    const page = {
      evaluate: async <T, A>(fn: (arg: A) => T | Promise<T>, arg?: A): Promise<T> => {
        // Execute the real page callback. A canned evaluate result would hide the wiring defect.
        const saved = Object.getOwnPropertyDescriptor(globalThis, 'window');
        Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: browserWindow });
        try { return await fn(arg as A); }
        finally {
          if (saved) Object.defineProperty(globalThis, 'window', saved);
          else Reflect.deleteProperty(globalThis, 'window');
        }
      },
      screenshot: vi.fn(async () => { events.push('color'); return Buffer.from(storyPng); }),
    };
    const close = vi.fn(async () => {});
    const open = vi.fn(async () => ({ page, pageErrors: [], close }));
    const lineArt = vi.fn(async () => { events.push('lineart'); return Buffer.from(linePng); });
    return { page, open, close, lineArt, camera, published, events, load, seek, loaded: () => loaded };
  }
  function captureInput(repoRoot: string): CaptureInput {
    return { repoRoot, job: job(), stage: stageFile(repoRoot), timeline: buildBookStillTimeline(stageSource()),
      size: { width: 3000, height: 2250 } };
  }
  function loadTimeline(page: FakePage['page'], timeline: CaptureInput['timeline']) {
    const load = (pictureSeams as unknown as {
      loadBookTimeline(page: FakePage['page'], timeline: CaptureInput['timeline']): Promise<void>;
    }).loadBookTimeline;
    expect(load, 'The shared loadBookTimeline seam exists.').toBeTypeOf('function');
    return load(page, timeline);
  }
  function productionCapture(input: CaptureInput, fake: FakePage) {
    // Require the shared seam before the production call can reach a mocked browser opener.
    expect((pictureSeams as unknown as Record<string, unknown>).loadBookTimeline).toBeTypeOf('function');
    const capture = pictureSeams.captureBookStill as unknown as
      (input: CaptureInput, deps: { open: FakePage['open']; lineArt: FakePage['lineArt'] }) => Promise<ReturnType<typeof capturePacket>>;
    return capture(input, { open: fake.open, lineArt: fake.lineArt });
  }
  async function calibrationFixture() {
    const space = await sandbox();
    const workbooksRoot = await copyPackages(space.repoRoot);
    const fixtureJobs = buildStorytimeJobs({ workbooksRoot });
    for (const id of ['bad-one-sun', 'good-nan'] as const) {
      const target = calibrationTarget(id, workbooksRoot, space.repoRoot);
      const bytes = Buffer.from(`Synthetic calibration source: ${id}`);
      await put(target.file, bytes);
      for (const provider of ['minimax', 'kimi'] as const) {
        await json(path.join(space.outputRoot, `calibration/${id}-${provider}.json`), {
          ...modelReview({ ...fixtureJobs[0]!, id }, 1, provider), file: target.file,
          sourceText: id === 'good-nan' ? nanText : target.sourceText,
          sourcePrompt: id === 'good-nan' ? nanPrompt : target.sourcePrompt,
          verdict: id === 'bad-one-sun' ? 'fail' : 'pass', fileSha256: digest(bytes), rawOutput: rawPass,
        });
      }
    }
    return { ...space, workbooksRoot, fixtureJobs };
  }
  async function ledger(outputRoot: string): Promise<Record<string, unknown>[]> {
    const file = path.join(outputRoot, 'cost-ledger.jsonl');
    return existsSync(file) ? (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
  }
  async function snapshot(directory: string) {
    return Promise.all((await tree(directory)).map(async (file) => [path.relative(directory, file), digest(await readFile(file))]));
  }
  async function kimiFixture(calibration = false) {
    const space = await calibrationFixture();
    await json(path.join(space.outputRoot, 'jobs.json'), space.fixtureJobs);
    await put(path.join(space.outputRoot, candidateRelativePath(space.fixtureJobs[0]!, 1)), storyPng);
    const raw = path.join(space.outputRoot, 'candidates/synthetic-kimi.txt');
    await put(raw, rawPass);
    const targetArgs = calibration ? ['--calibration', 'good-nan'] : ['--job', space.fixtureJobs[0]!.id, '--version', '1'];
    const args = ['precheck-kimi', '--out', space.outputRoot, '--workbooks', space.workbooksRoot, '--paid'];
    const deps = { repoRoot: space.repoRoot, log: vi.fn() };
    await runStorytimeCli([...args, ...targetArgs, '--begin'], deps);
    const callId = String((await ledger(space.outputRoot))[0]!.callId);
    return { ...space, args, targetArgs, deps, raw, callId };
  }

  it('T61: the production capture loads the timeline before its first seek', async () => {
    // Falsification: seek precedes load, either image is absent, or the capture-path label is absent.
    const space = await sandbox();
    const fake = await fakePage();
    const input = captureInput(space.repoRoot);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const before = await snapshot(space.outputRoot);
    const pair = await productionCapture(input, fake);
    expect(fake.loaded()).toEqual(input.timeline);
    expect(fake.load).toHaveBeenCalledOnce();
    expect(fake.events[0]).toBe('load');
    expect(fake.events.indexOf(`seek:${input.stage.at}`)).toBeGreaterThan(fake.events.indexOf('load'));
    expect(pair.color).toEqual(storyPng); expect(pair.lineArt).toEqual(linePng);
    expect(fake.open).toHaveBeenCalledOnce(); expect(fake.close).toHaveBeenCalledOnce();
    expect(log.mock.calls.flat().join('\n')).toContain('capture path: captureBookStill');
    expect(await snapshot(space.outputRoot)).toEqual(before);
  });

  it('T62: the shared loader accepts no notes and rejects a note before any seek', async () => {
    // Falsification: a note passes, load runs twice, or the production capture seeks after a note.
    const space = await sandbox();
    const input = captureInput(space.repoRoot);
    const empty = await fakePage();
    await loadTimeline(empty.page, input.timeline);
    expect(empty.load).toHaveBeenCalledExactlyOnceWith(input.timeline);
    expect(empty.seek).not.toHaveBeenCalled();
    const note = 'Missing actor: synthetic-Nan';
    const noted = await fakePage([note]);
    await expect(loadTimeline(noted.page, input.timeline)).rejects.toThrow(note);
    expect(noted.load).toHaveBeenCalledOnce(); expect(noted.seek).not.toHaveBeenCalled();
    const capture = await fakePage([note]);
    await expect(productionCapture(input, capture)).rejects.toThrow(note);
    expect(capture.seek).not.toHaveBeenCalled(); expect(capture.page.screenshot).not.toHaveBeenCalled();
    expect(capture.lineArt).not.toHaveBeenCalled(); expect(capture.close).toHaveBeenCalledOnce();
    expect(await tree(space.outputRoot)).toEqual([]);
  });

  it('T63: live camera reads detect fov and projection drift and retain the published evidence', async () => {
    // Falsification: a published-copy comparison hides drift, or a live state replaces the evidence camera.
    const space = await sandbox();
    const input = captureInput(space.repoRoot);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const unchanged = await fakePage();
    expect((await productionCapture(input, unchanged)).camera).toEqual(unchanged.published);
    for (const field of ['fov', 'projectionMatrix'] as const) {
      const fake = await fakePage();
      fake.lineArt.mockImplementation(async () => {
        if (field === 'fov') fake.camera.fov += 1;
        else fake.camera.projectionMatrix.elements[8]! += 0.125;
        return Buffer.from(linePng);
      });
      await expect(productionCapture(input, fake)).rejects.toThrow(new RegExp(`drift.*${field}|${field}.*drift`, 'i'));
      expect(fake.page.screenshot).toHaveBeenCalledOnce();
      expect(fake.close).toHaveBeenCalledOnce();
    }
    const mismatch = await fakePage([], 1);
    await expect(productionCapture(input, mismatch)).rejects.toThrow(/drift.*fov|fov.*drift/i);
    expect(mismatch.lineArt).not.toHaveBeenCalled();
    expect(await tree(space.outputRoot)).toEqual([]);
  });

  it('T64: one style look covers other twins of the same technique and validates the sample bytes', async () => {
    // Falsification: a non-sample twin fails, a different technique passes, or a bad sample hash leaves a usable look.
    const sample = await twinFixture();
    const selected = jobs.slice(0, 3);
    for (const [index, current] of selected.entries()) {
      if (index === 0) continue;
      const stage = stageFile(sample.repoRoot, current);
      const file = candidateRelativePath(current, 1), lineArtFile = linePath(current, 1);
      await put(path.join(sample.repoRoot, stage.file), stage.bytes);
      await put(path.join(sample.outputRoot, file), storyPng);
      await put(path.join(sample.outputRoot, lineArtFile), linePng);
      await json(path.join(sample.outputRoot, `renders/${current.id}-v1.json`), {
        ...sample.evidence, jobId: current.id, stageFile: stage.file, stageSha256: stage.sha256,
        file, colorFile: file, lineArtFile,
        lineArtTechnique: index === 2 ? 'synthetic-other-technique' : sample.evidence.lineArtTechnique,
      });
      for (const provider of ['minimax', 'kimi'] as const) {
        await json(path.join(sample.outputRoot, `reviews/${current.id}-v1-${provider}.json`), modelReview(current, 1, provider));
      }
      await json(path.join(sample.outputRoot, `reviews/${current.id}-v1-person.json`), personReview(current, 1));
      await json(path.join(sample.outputRoot, `reviews/${current.id}-v1-lineart-person.json`), {
        ...personReview(current, 1, linePng), file: lineArtFile,
      });
    }
    const states = async () => (await buildManifest(selected, sample.outputRoot, sample.repoRoot)).jobs
      .map((item) => (item.candidates[0] as CandidateManifest & { lineArt: LineArtView }).lineArt.status);
    expect.soft(await states()).toEqual(['ready', 'ready', 'pending']);
    const thirdEvidenceFile = path.join(sample.outputRoot, `renders/${selected[2]!.id}-v1.json`);
    const thirdEvidence = JSON.parse(await readFile(thirdEvidenceFile, 'utf8'));
    await json(thirdEvidenceFile, { ...thirdEvidence, lineArtTechnique: sample.evidence.lineArtTechnique,
      lineArtFormatVersion: 'synthetic-other-format' });
    expect.soft(await states()).toEqual(['ready', 'ready', 'pending']);
    await json(thirdEvidenceFile, thirdEvidence);
    await json(path.join(sample.outputRoot, sample.styleFile), { ...sample.style,
      sampleFiles: sample.style.sampleFiles.map((item) => ({ ...item, sha256: digest('different sample bytes') })) });
    expect(await states()).toEqual(['failed', 'failed', 'failed']);
  });

  it('T65: calibration rejects a stale rubric, a changed hash, and the old good-nan text', async () => {
    // Falsification: a changed log opens the gate, or the four current synthetic logs fail the gate.
    const space = await calibrationFixture();
    await expect(gate(space.outputRoot, space.workbooksRoot, space.repoRoot)).resolves.toBeUndefined();
    for (const id of ['bad-one-sun', 'good-nan']) for (const provider of ['minimax', 'kimi']) {
      const file = path.join(space.outputRoot, `calibration/${id}-${provider}.json`);
      const correct = JSON.parse(await readFile(file, 'utf8'));
      for (const change of [{ rubricVersion: 'storytime-picture-v1' }, { fileSha256: digest('other bytes') },
        { sourceText: 'Owner-approved Nan character picture.' }, { sourcePrompt: 'Old source prompt.' }]) {
        await json(file, { ...correct, ...change });
        const result = await gate(space.outputRoot, space.workbooksRoot, space.repoRoot).then(() => 'accepted', () => 'refused');
        expect.soft(result, `${id}/${provider}: ${JSON.stringify(change)}`).toBe('refused');
        await json(file, correct);
      }
    }
  });

  it('T66: good-nan uses the neutral Workbooks character text', () => {
    // Falsification: an approval word remains, or the fixed description differs from the page prompt.
    const target = calibrationTarget('good-nan', WORKBOOKS, root);
    expect.soft(target.sourceText).toBe(nanText);
    expect.soft(target.sourcePrompt).toBe(nanPrompt);
    expect.soft(`${target.sourceText}\n${target.sourcePrompt}`).not.toMatch(/approv|owner/i);
    const page5 = jobs.find((item) => item.id === 'w01-readalong-p05')!;
    const realPackage = readFileSync(page5.sourcePackage, 'utf8');
    expect(realPackage).toContain(nanPrompt.slice(0, -1));
    expect(page5.sourcePrompt).toContain(nanPrompt.slice(0, -1));
  });

  it('T67: Kimi failure records close one call and refuse invalid or duplicate records without writes', async () => {
    // Falsification: a failure writes a review, or a refused record changes any output byte.
    const good = await kimiFixture();
    const before = await snapshot(good.outputRoot);
    const failureArgs = ['--record', good.callId, '--failed', '--reason', 'reviewer session hung'];
    const result = await runStorytimeCli([...good.args, ...failureArgs], good.deps).then(() => 'recorded', (error: Error) => error.message);
    expect.soft(result).toBe('recorded');
    const entries = await ledger(good.outputRoot);
    expect.soft(entries).toHaveLength(2);
    expect.soft(entries[1]).toMatchObject({ event: 'after-call', callId: good.callId, status: 'failure', reason: 'reviewer session hung' });
    expect.soft((await snapshot(good.outputRoot)).filter(([file]) => file !== 'cost-ledger.jsonl'))
      .toEqual(before.filter(([file]) => file !== 'cost-ledger.jsonl'));

    for (const mode of ['no-begin', 'duplicate-failure', 'duplicate-success', 'failed-with-raw', 'empty-reason',
      'calibration-mismatch', 'job-mismatch', 'version-mismatch'] as const) {
      const f = await kimiFixture(mode === 'calibration-mismatch');
      // Seed an after-call independently. Both record modes must reject it.
      if (mode.startsWith('duplicate')) {
        const prior = (await ledger(f.outputRoot))[0]!;
        await put(path.join(f.outputRoot, 'cost-ledger.jsonl'), `${JSON.stringify(prior)}\n${JSON.stringify({
          ...prior, event: 'after-call', status: mode === 'duplicate-failure' ? 'failure' : 'success', reason: 'Synthetic prior record.',
        })}\n`);
      }
      const recordId = mode === 'no-begin' ? 'unknown-call' : f.callId;
      let extra = ['--record', recordId, '--failed', '--reason', 'reviewer session hung'];
      if (mode === 'failed-with-raw') extra.push('--raw', f.raw);
      if (mode === 'empty-reason') extra = ['--record', recordId, '--failed', '--reason', ''];
      if (mode === 'calibration-mismatch') extra.push('--calibration', 'bad-one-sun');
      if (mode === 'job-mismatch') extra.push('--job', f.fixtureJobs[1]!.id);
      if (mode === 'version-mismatch') extra.push('--version', '2');
      const saved = await snapshot(f.outputRoot);
      const refused = await runStorytimeCli([...f.args, ...extra], f.deps).then(() => false, () => true);
      expect.soft(refused, mode).toBe(true);
      expect.soft(await snapshot(f.outputRoot), mode).toEqual(saved);
      if (mode.startsWith('duplicate') || mode.endsWith('mismatch') || mode === 'no-begin') {
        const target = mode === 'calibration-mismatch' ? ['--calibration', 'bad-one-sun']
          : mode === 'job-mismatch' ? ['--job', f.fixtureJobs[1]!.id]
            : mode === 'version-mismatch' ? ['--version', '2'] : [];
        const rawRefused = await runStorytimeCli([...f.args, '--record', recordId, '--raw', f.raw, ...target], f.deps).then(() => false, () => true);
        expect.soft(rawRefused, `${mode}: raw mode`).toBe(true);
        expect.soft(await snapshot(f.outputRoot), `${mode}: raw mode`).toEqual(saved);
      }
    }
  });

  it('T68: provider logs label declared models and preserve a reported MiniMax model', async () => {
    // Falsification: a model lacks its source label, or a reported model remains declared.
    for (const reported of [false, true]) {
      const space = await sandbox();
      await put(path.join(space.outputRoot, candidateRelativePath(job(), 1)), storyPng);
      const output = reported ? JSON.stringify({ ...JSON.parse(rawPass), model: 'synthetic-reported-vision' }) : rawPass;
      const result = await precheckMiniMax({ ...space, jobs: [job()], jobId: job().id, version: 1,
        paid: true, dryRun: false, runner: async () => ({ stdout: output, stderr: '' }) });
      expect(result.status).toBe('pass');
      const first = (await ledger(space.outputRoot))[0]!;
      expect.soft(first).toMatchObject({ event: 'before-call', model: pictureSeams.MINIMAX_VISION_MODEL, modelSource: 'declared' });
      const review = JSON.parse(await readFile(path.join(space.outputRoot, `reviews/${job().id}-v1-minimax.json`), 'utf8'));
      expect.soft(review).toMatchObject({ modelSource: reported ? 'reported' : 'declared',
        model: reported ? 'synthetic-reported-vision' : first.model });
    }
    const kimi = await kimiFixture();
    await runStorytimeCli([...kimi.args, '--record', kimi.callId, '--raw', kimi.raw], kimi.deps);
    const review = JSON.parse(await readFile(path.join(kimi.outputRoot, `reviews/${kimi.fixtureJobs[0]!.id}-v1-kimi.json`), 'utf8'));
    expect.soft(review).toMatchObject({ modelSource: 'declared', model: pictureSeams.KIMI_REVIEW_MODEL });
    expect.soft((await ledger(kimi.outputRoot))[0]).toMatchObject({ modelSource: 'declared' });
  });

  it('T69: repeated MiniMax calls keep separate callId raw files and bind each review', async () => {
    // Falsification: a later call changes the first raw file, or a review lacks its call identity.
    const space = await sandbox();
    await planned(space.repoRoot, space.outputRoot);
    await put(path.join(space.outputRoot, candidateRelativePath(job(), 1)), storyPng);
    const outputs = [rawPass, `${rawPass}\n`];
    const saved = new Map<string, Buffer>();
    for (const output of outputs) {
      const code = await runStorytimeCli(['precheck-minimax', '--out', space.outputRoot, '--job', job().id,
        '--version', '1', '--paid'], { repoRoot: space.repoRoot, log: vi.fn(),
        runner: async () => ({ stdout: output, stderr: '' }) });
      expect(code).toBe(0);
      const entries = await ledger(space.outputRoot);
      const callId = String(entries.filter((item) => item.event === 'before-call').at(-1)!.callId);
      const review = JSON.parse(await readFile(path.join(space.outputRoot, `reviews/${job().id}-v1-minimax.json`), 'utf8'));
      expect.soft(review.callId).toBe(callId);
      expect.soft(review.rawFile).toEqual(expect.stringMatching(/^raw\//));
      if (typeof review.rawFile === 'string') {
        expect.soft(path.basename(review.rawFile)).toContain(callId);
        const file = path.resolve(space.outputRoot, review.rawFile);
        expect(await readFile(file, 'utf8')).toBe(output); saved.set(file, Buffer.from(output));
      }
      for (const [file, bytes] of saved) expect(await readFile(file)).toEqual(bytes);
    }
    const rawFiles = (await tree(space.outputRoot)).filter((file) => path.relative(space.outputRoot, file).startsWith('raw/'));
    expect(rawFiles).toHaveLength(2);
    expect(saved.size).toBe(2);
  });

  it('T71: render evidence and smoke evidence name the view-distance technique', async () => {
    // Falsification: the exported ID or either evidence record names another technique.
    expect.soft(pictureSeams.LINEART_TECHNIQUE).toBe(technique);
    const space = await calibrationFixture();
    const current = space.fixtureJobs[0]!;
    await json(path.join(space.outputRoot, 'jobs.json'), space.fixtureJobs);
    const stage = stageFile(space.repoRoot, current);
    await put(path.join(space.repoRoot, stage.file), stage.bytes);
    await renderTwins({ jobs: [current], ...space, dryRun: false, capture: async () => capturePacket(), readStage: async () => stage });
    const evidence = JSON.parse(await readFile(path.join(space.outputRoot, `renders/${current.id}-v1.json`), 'utf8'));
    expect.soft(evidence.lineArtTechnique).toBe(technique);
    const packet = { ...smokeCaptureForTest(), fixtureLineArt: await smokePicture('ring') };
    await runStorytimeCli(['lineart-smoke', '--out', space.outputRoot, '--job', current.id], {
      repoRoot: space.repoRoot, log: vi.fn(), now: CLOCK, readStage: async () => stage,
      capture: (async () => packet) as unknown as CliCapture,
    });
    const file = (await tree(space.outputRoot)).find((item) => path.basename(item) === 'smoke.json')!;
    expect(JSON.parse(await readFile(file, 'utf8')).lineArtTechnique).toBe(technique);
  });

  it('T72: a completed newest version prints the next version and an explicit v2 needs no v1', async () => {
    // Falsification: a skip writes bytes or lacks the hint, or an explicit v2 writes or requires v1.
    const space = await calibrationFixture();
    const current = space.fixtureJobs[0]!;
    await json(path.join(space.outputRoot, 'jobs.json'), space.fixtureJobs);
    await put(path.join(space.repoRoot, stageRelativePath(current, 1)), JSON.stringify(stageSource(current, 1)));
    const capture = vi.fn(async () => capturePacket());
    const log = vi.fn();
    const args = ['render', '--out', space.outputRoot, '--workbooks', space.workbooksRoot, '--job', current.id];
    const deps = { repoRoot: space.repoRoot, capture: capture as unknown as CliCapture, log };
    await runStorytimeCli(args, deps);
    const before = await snapshot(space.outputRoot);
    capture.mockClear(); log.mockClear();
    expect(await runStorytimeCli(args, deps)).toBe(0);
    expect(capture).not.toHaveBeenCalled();
    expect(await snapshot(space.outputRoot)).toEqual(before);
    expect.soft(log.mock.calls.flat().join('\n')).toContain('skipped');
    expect.soft(log.mock.calls.flat().join('\n')).toContain('next free version: v2');

    const explicit = await calibrationFixture();
    const secondJob = explicit.fixtureJobs[0]!;
    await json(path.join(explicit.outputRoot, 'jobs.json'), explicit.fixtureJobs);
    await put(path.join(explicit.repoRoot, stageRelativePath(secondJob, 2)), JSON.stringify(stageSource(secondJob, 2)));
    expect(await runStorytimeCli(['render', '--out', explicit.outputRoot, '--workbooks', explicit.workbooksRoot,
      '--job', secondJob.id, '--version', '2'], { ...deps, repoRoot: explicit.repoRoot })).toBe(0);
    expect(existsSync(path.join(explicit.outputRoot, candidateRelativePath(secondJob, 2)))).toBe(true);
    expect(existsSync(path.join(explicit.outputRoot, linePath(secondJob, 2)))).toBe(true);
    expect(existsSync(path.join(explicit.outputRoot, candidateRelativePath(secondJob, 1)))).toBe(false);
    expect(existsSync(path.join(explicit.outputRoot, linePath(secondJob, 1)))).toBe(false);
  });

  it('T73: the smoke depth-step check needs border ink on at least 90 percent of the declared rows', async () => {
    // Falsification: absent border ink passes, a complete border fails, or its labeled row count is absent.
    // This adapter fixes only the metadata shape. It does not select the live fixture plane placement.
    const fixture = { ...SMOKE_FIXTURE, depthStep: { column: 230, rowStart: 80, rowEnd: 179 } };
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const rows of [100, 90, 89, 0]) {
      const { data } = await sharp(await smokePicture('ring')).greyscale().raw().toBuffer({ resolveWithObject: true });
      for (let row = 0; row < rows; row++) data[(fixture.depthStep.rowStart + row) * fixture.width + fixture.depthStep.column + 2] = 0;
      log.mockClear();
      const result = await pictureSeams.checkLineArtSmoke(await greyPng(data, fixture.width, fixture.height), fixture);
      expect.soft(result.valid, `Border rows: ${rows}/100`).toBe(rows >= 90);
      const label = log.mock.calls.flat().join('\n').match(/fixture depth step rows:\s*([0-9]+)\/([0-9]+)/);
      expect.soft(label, `Border rows: ${rows}/100`).not.toBeNull();
      if (label) expect.soft([Number(label[1]), Number(label[2])]).toEqual([rows, 100]);
    }
  });
});
