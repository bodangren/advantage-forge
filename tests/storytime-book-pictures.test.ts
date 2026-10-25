import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
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
import * as pictureSeams from '../src/storytime/book-pictures.js';

// These adapters isolate unspecified driver methods and packet fields from the assertions.
// Green may adapt these mappings to its driver. The event order and failure checks stay fixed.
type CaptureOperations = {
  seek(at: number): Promise<void>;
  screenshot(): Promise<Buffer>;
  cameraState(): Promise<unknown>;
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
vi.mock('node:child_process', () => ({
  spawn: forbidden.spawn, spawnSync: forbidden.spawnSync, exec: forbidden.exec,
  execSync: forbidden.execSync, execFile: forbidden.execFile,
  execFileSync: forbidden.execFileSync, fork: forbidden.fork,
}));
vi.mock('playwright', () => ({ chromium: { launch: forbidden.launch } }));
vi.mock('vite', () => ({ createServer: forbidden.createServer }));

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
async function seedCalibration(outputRoot: string) {
  // Synthetic logs isolate render tests. These files are not live provider evidence.
  for (const id of ['bad-one-sun', 'good-nan']) {
    for (const provider of ['minimax', 'kimi'] as const) {
      await json(path.join(outputRoot, `calibration/${id}-${provider}.json`), {
        ...modelReview({ ...job(), id }, 1, provider),
        verdict: id === 'bad-one-sun' ? 'fail' : 'pass',
        rawOutput: `Synthetic ${id} fixture`,
      });
    }
  }
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
    await seedCalibration(outputRoot);
    const before = digest(await readFile(v1));
    const capture = vi.fn(async () => capturePacket());
    const result = await renderTwins({ jobs: [job()], repoRoot, outputRoot, version: 2, dryRun: false,
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
    const render = () => runStorytimeCli(['render', '--out', outputRoot, '--job', job().id], { repoRoot, capture: capture as unknown as CliCapture, readStage, log: vi.fn() });
    await expect(render()).rejects.toThrow(/calibrat/i);
    expect(capture).not.toHaveBeenCalled();
    await seedCalibration(outputRoot);
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
    await seedCalibration(outputRoot);
    const capture = vi.fn(async () => capturePacket());
    const stage = stageFile(repoRoot);
    await renderTwins({ jobs: [job()], repoRoot, outputRoot, version: 1, dryRun: false,
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
    await seedCalibration(rejected.outputRoot);
    const brokenCapture = vi.fn(async () => { throw new Error('Test line-art pass failed'); });
    await expect(renderTwins({ jobs: [job()], ...rejected, dryRun: false, capture: brokenCapture,
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
    await seedCalibration(fixture.outputRoot);
    const oldColor = digest(await readFile(path.join(fixture.outputRoot, fixture.file)));
    const oldLine = digest(await readFile(path.join(fixture.outputRoot, fixture.lineArtFile)));
    const newLine = await greyPng(binaryPixels(3000, 2250, 0.06));
    const capture = vi.fn(async () => capturePacket(storyPng, newLine));
    await renderTwins({ jobs: [job()], repoRoot: fixture.repoRoot, outputRoot: fixture.outputRoot,
      version: 2, dryRun: false, capture,
      readStage: async ({ version }) => stageFile(fixture.repoRoot, job(), version) });
    expect(capture).toHaveBeenCalledOnce();
    expect(existsSync(path.join(fixture.outputRoot, candidateRelativePath(job(), 2)))).toBe(true);
    expect(digest(await readFile(path.join(fixture.outputRoot, linePath(job(), 2))))).toBe(digest(newLine));
    expect(digest(await readFile(path.join(fixture.outputRoot, fixture.file)))).toBe(oldColor);
    expect(digest(await readFile(path.join(fixture.outputRoot, fixture.lineArtFile)))).toBe(oldLine);
    const retry = await renderTwins({ jobs: [job()], repoRoot: fixture.repoRoot, outputRoot: fixture.outputRoot,
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
    await json(path.join(fixture.outputRoot, 'jobs.json'), jobs);
    const args = ['verify', '--release', '--out', fixture.outputRoot, '--job', job().id];
    const deps = { repoRoot: fixture.repoRoot, log: vi.fn() };
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
    await seedCalibration(valid.outputRoot);
    await renderTwins({ jobs: [job()], ...valid, dryRun: false, capture: async () => capturePacket(),
      readStage: async () => stageFile(valid.repoRoot) });
    expect(existsSync(path.join(valid.outputRoot, candidateRelativePath(job(), 1)))).toBe(true);
    expect(existsSync(path.join(valid.outputRoot, linePath()))).toBe(true);
    for (const mode of ['missing', 'throw']) {
      const space = await sandbox();
      await seedCalibration(space.outputRoot);
      const capture = vi.fn(async () => {
        if (mode === 'throw') throw new Error('Test line-art pass failed');
        return { color: storyPng, camera: CAMERA };
      });
      await expect(renderTwins({ jobs: [job()], ...space, dryRun: false, capture,
        readStage: async () => stageFile(space.repoRoot) })).rejects.toThrow(/line.?art|twin|image/i);
      expect(capture).toHaveBeenCalledOnce();
      expect(existsSync(path.join(space.outputRoot, candidateRelativePath(job(), 1)))).toBe(false);
      expect(existsSync(path.join(space.outputRoot, linePath()))).toBe(false);
      expect(existsSync(path.join(space.outputRoot, `renders/${job().id}-v1.json`))).toBe(false);
    }
  });

  it('T41: a size parameter writes a new twin version from unchanged stage bytes and camera', async () => {
    const space = await sandbox();
    await seedCalibration(space.outputRoot);
    const stage = stageFile(space.repoRoot);
    await put(path.join(space.repoRoot, stage.file), stage.bytes);
    const originalHash = digest(stage.bytes);
    const previousFiles = new Map<string, string>();
    const sizes = [{ width: 3000, height: 2250 }, { width: 4961, height: 3508 }];
    for (const [index, size] of sizes.entries()) {
      const color = await sharp(storyPng).resize(size.width, size.height).png().toBuffer();
      const line = await greyPng(binaryPixels(size.width, size.height), size.width, size.height);
      const capture = vi.fn(async () => capturePacket(color, line));
      await renderTwins({ jobs: [job()], ...space, version: index + 1, ...size, dryRun: false, capture,
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
          events.push('camera'); reads++;
          if (mode === 'missing') return undefined;
          return { ...structuredClone(camera), fov: mode === 'drift' && reads === 2 ? 60 : camera.fov };
        },
        lineArt: async () => { events.push('lineart'); return Buffer.from(linePng); },
      };
      const input = { ...space, job: job(), stage: { ...stageFile(space.repoRoot), at },
        timeline: buildBookStillTimeline(stageSource()), size: { width: 3000, height: 2250 } };
      const run = capturePairForTest(operations, input);
      if (mode === 'valid') {
        const pair = await run;
        expect(events).toEqual([`seek:${at}`, 'color', 'camera', 'lineart', 'camera', `seek:${at}`, 'color']);
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
    await seedCalibration(space.outputRoot);
    expect(await runStorytimeCli(['render', '--out', space.outputRoot, '--job', job().id], deps)).toBe(0);
    expect(capture).toHaveBeenCalledTimes(2);
    expect(existsSync(path.join(space.outputRoot, candidateRelativePath(job(), 1)))).toBe(true);
    expect(existsSync(path.join(space.outputRoot, linePath(job(), 1)))).toBe(true);
    expect(existsSync(path.join(space.outputRoot, candidateRelativePath(job(), 2)))).toBe(false);
    expect(existsSync(path.join(space.outputRoot, linePath(job(), 2)))).toBe(false);
  });
});
