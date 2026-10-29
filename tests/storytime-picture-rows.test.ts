import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import {
  type BookStageFile,
  type PictureListRow,
  renderPictureRows,
  rowColorRelativePath,
  rowLineArtRelativePath,
  rowStageRelativePath,
  rowVersionedName,
  verifyPictureRows,
} from '../src/storytime/book-pictures.js';
import { buildTimeline } from '../src/song/timeline.js';

// Green-owned tests for the list-row render path (Phase 3). The capture is a fake: no browser.

const ROW: PictureListRow = {
  id: 'l2-w01-check-row-cat',
  week: 1,
  use: 'check-row',
  sizeClass: 'C',
  fileName: 'l2-w01-check-row-cat-v1.png',
  lineArtFileName: 'l2-w01-check-row-cat-line-v1.png',
  width: 1500,
  height: 1500,
};

const SOURCE = {
  jobId: ROW.id,
  version: 1,
  at: 0.5,
  spec: { duration: 1, lines: [{ text: 'cat', start: 0, end: 1, actors: ['Nan'] }] },
  stage: { scene: 'classroom', backdrop: 'white' as const, marks: { Nan: { x: 0, z: 0 } } },
};

function stageFor(version: number): BookStageFile {
  const bytes = Buffer.from(JSON.stringify({ ...SOURCE, version }));
  return {
    file: rowStageRelativePath(ROW, version),
    absoluteFile: path.join('/tmp', rowStageRelativePath(ROW, version)),
    sha256: 'f'.repeat(64),
    at: SOURCE.at,
    source: { ...SOURCE, version } as BookStageFile['source'],
    bytes,
  };
}

async function colorPng(corner = '#ffffff') {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1500">` +
    `<rect width="1500" height="1500" fill="${corner}"/><circle cx="750" cy="750" r="400" fill="#e07020"/></svg>`;
  return sharp(Buffer.from(svg)).flatten({ background: '#ffffff' }).toColourspace('srgb').png().toBuffer();
}

async function linePng(stroke: number) {
  const size = 1500;
  const pixels = Buffer.alloc(size * size, 255);
  for (let box = 0; box < 4; box += 1) {
    const x0 = 300 + box * 220;
    for (let y = 400; y < 1100; y += 1) {
      for (let x = x0; x < x0 + 160; x += 1) {
        const edge = x < x0 + stroke || x >= x0 + 160 - stroke || y < 400 + stroke || y >= 1100 - stroke;
        if (edge) pixels[y * size + x] = 0;
      }
    }
  }
  return sharp(pixels, { raw: { width: size, height: size, channels: 1 } }).toColourspace('b-w').png().toBuffer();
}

let outputRoot: string;
afterEach(async () => {
  if (outputRoot) await rm(outputRoot, { recursive: true, force: true });
});

async function run(options: { stroke?: number; corner?: string; version?: number } = {}) {
  const color = await colorPng(options.corner);
  const lineArt = await linePng(options.stroke ?? 14);
  return renderPictureRows({
    rows: [ROW],
    listSha256: 'c'.repeat(64),
    outputRoot,
    repoRoot: outputRoot,
    rowId: ROW.id,
    ...(options.version === undefined ? {} : { version: options.version }),
    dryRun: false,
    assertReady: async () => {},
    readStage: async ({ version }) => stageFor(version),
    capture: async () => ({ color, lineArt, camera: { fov: 32 }, lineArtTechnique: 'test-pass', peakRssMb: 321 }),
  });
}

describe('Picture list rows (specification v1 names)', () => {
  it('names a twin version beside its color file in the week rows directory', () => {
    expect(rowVersionedName('l2-w01-check-row-cat-line-v1.png', 3)).toBe('l2-w01-check-row-cat-line-v3.png');
    expect(rowColorRelativePath(ROW, 1)).toBe('w01/rows/l2-w01-check-row-cat-v1.png');
    expect(rowLineArtRelativePath(ROW, 2)).toBe('w01/rows/l2-w01-check-row-cat-line-v2.png');
    expect(rowStageRelativePath(ROW, 1)).toBe('docs/storytime/l2-unit1/w01/rows/l2-w01-check-row-cat-v1.json');
  });

  it('writes one twin pair and its evidence, then refuses the same version', async () => {
    outputRoot = await mkdtemp(path.join(os.tmpdir(), 'rows-'));
    const [result] = await run();
    expect(result).toMatchObject({ status: 'rendered', width: 1500, height: 1500, peakRssMb: 321 });
    const evidence = JSON.parse(await readFile(path.join(outputRoot, 'renders/rows/l2-w01-check-row-cat-v1.json'), 'utf8'));
    expect(evidence).toMatchObject({
      rowId: ROW.id,
      colorFile: 'w01/rows/l2-w01-check-row-cat-v1.png',
      lineArtFile: 'w01/rows/l2-w01-check-row-cat-line-v1.png',
      lineArtTechnique: 'test-pass',
      sizeClass: 'C',
    });
    await expect(run()).rejects.toThrow(/already exists/);
    const verified = await verifyPictureRows({ rows: [ROW], outputRoot, rowId: ROW.id });
    expect(verified).toEqual([{ rowId: ROW.id, version: 1, errors: [] }]);
  });

  it('writes nothing when the line art is thinner than 12 px or the class C corners are not white', async () => {
    outputRoot = await mkdtemp(path.join(os.tmpdir(), 'rows-'));
    await expect(run({ stroke: 4 })).rejects.toThrow(/at least 12 px/);
    await expect(run({ corner: '#203040' })).rejects.toThrow(/corners must be white/);
    expect(existsSync(path.join(outputRoot, 'w01/rows/l2-w01-check-row-cat-v1.png'))).toBe(false);
    expect(existsSync(path.join(outputRoot, 'renders/rows/l2-w01-check-row-cat-v1.json'))).toBe(false);
  });

  it('verify reports a changed twin file', async () => {
    outputRoot = await mkdtemp(path.join(os.tmpdir(), 'rows-'));
    await run();
    await writeFile(path.join(outputRoot, 'w01/rows/l2-w01-check-row-cat-line-v1.png'), await linePng(16));
    const [result] = await verifyPictureRows({ rows: [ROW], outputRoot, rowId: ROW.id });
    expect(result!.errors).toContain('The line-art SHA-256 does not match the evidence.');
  });

  it('a white backdrop stage gives a white backdrop timeline', () => {
    const timeline = buildTimeline(SOURCE.spec, SOURCE.stage);
    expect(timeline.backdrop).toBe('white');
    expect(buildTimeline(SOURCE.spec, { scene: 'classroom' }).backdrop).toBeUndefined();
  });
});
