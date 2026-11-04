// Tests for the Storytime production judge batch builder (T4 step 1, 2026-11-05).
//
// The script scripts/storytime-judge-batch.mjs builds one judge batch for the A-48 pictures.
// It makes no provider call. The tests cover the pure rules and the file work:
//   - the printed long side of a use: 900 px for a story page, 360 px for every other card;
//   - the name of the source file of a color try and of a line try;
//   - the batch entry shape: judgeFile, id, kind, pageText, use, and mustShow;
//   - the judge copy at the printed size;
//   - a missing source file is an error and writes no copy.

import { mkdtempSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildBatch,
  judgeFileName,
  longSideOf,
  parseArgs,
  sourceFileName,
} from '../scripts/storytime-judge-batch.mjs';

let root: string;
let specDir: string;

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'judge-batch-'));
  specDir = path.join(root, 'specs');
  mkdirSync(specDir, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const STORY_SPEC = {
  id: 'l2-w01-story-page-a-nest',
  text: 'A nest.',
  pageText: 'A nest.',
  use: 'story-page',
  goal: 'A goal.',
  mustShow: ['Nan', "a bird's nest with twigs"],
  deliverAs: 'l2-w01-story-page-a-nest-v2.png',
  references: [],
  colorPrompt: 'a color prompt',
  linePrompt: 'a line prompt',
  print: 'crop',
  aspect: '4:3',
  outDir: 'out/storytime/l2/unit1/w01/muse',
};

const CARD_SPEC = {
  ...STORY_SPEC,
  id: 'l2-w02-check-row-axe',
  pageText: 'axe',
  use: 'check-row',
  mustShow: ['one axe', 'a handle and a blade'],
  aspect: '1:1',
  printSize: [1500, 1500],
  outDir: 'out/storytime/l2/unit1/w02/muse',
};

const writeSpec = (spec: Record<string, unknown>) => {
  writeFileSync(path.join(specDir, `${spec.id as string}.json`), JSON.stringify(spec, null, 2));
};

/** A source picture in the week folder of the spec, at the size of a Muse color call. */
async function writeSource(spec: Record<string, unknown>, name: string, width = 1920, height = 1280) {
  const dir = path.join(root, spec.outDir as string);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  const png = await sharp({ create: { width, height, channels: 3, background: '#88ccff' } }).png().toBuffer();
  writeFileSync(file, png);
  return file;
}

describe('the judge batch rules', () => {
  it('prints a story page at 900 px and every other card at 360 px', () => {
    expect(longSideOf('story-page')).toBe(900);
    expect(longSideOf('check-row')).toBe(360);
    expect(longSideOf('practice-line')).toBe(360);
    expect(longSideOf('d4-prompt')).toBe(360);
  });

  it('names the source file of a color try and of a line try', () => {
    expect(sourceFileName('l2-w01-story-page-a-nest', 'color', 2)).toBe('l2-w01-story-page-a-nest-m2-color.png');
    expect(sourceFileName('l2-w01-story-page-a-nest', 'line', 1, 1)).toBe('l2-w01-story-page-a-nest-m1-line.png');
    expect(sourceFileName('l2-w01-story-page-a-nest', 'line', 3, 1)).toBe('l2-w01-story-page-a-nest-m1-line-3.png');
    expect(judgeFileName('l2-w01-story-page-a-nest', 'color', 1)).toBe('l2-w01-story-page-a-nest-color-t1.png');
  });

  it('reads the ids, the kind, and the try number from the command line', () => {
    const options = parseArgs(['--ids', 'a,b', '--kind', 'color', '--try', '2']);
    expect(options.ids).toEqual(['a', 'b']);
    expect(options.kind).toBe('color');
    expect(options.tryNo).toBe(2);
    expect(options.out).toBe('batch-color-t2');
    expect(() => parseArgs(['--ids', 'a', '--kind', 'color'])).toThrow(/--try/);
    expect(() => parseArgs(['--kind', 'color', '--try', '1'])).toThrow(/--ids/);
  });
});

describe('buildBatch', () => {
  it('writes one batch entry per id and a judge copy at the printed size', async () => {
    writeSpec(STORY_SPEC);
    writeSpec(CARD_SPEC);
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m1-color.png');
    await writeSource(CARD_SPEC, 'l2-w02-check-row-axe-m1-color.png', 1024, 1024);

    const entries = await buildBatch({
      ids: ['l2-w01-story-page-a-nest', 'l2-w02-check-row-axe'],
      kind: 'color',
      tryNo: 1,
      specDir,
      judgeDir: path.join(root, 'judge'),
      root,
    });

    expect(entries.length).toBe(2);
    expect(Object.keys(entries[0]!).sort()).toEqual(['id', 'judgeFile', 'kind', 'mustShow', 'pageText', 'use']);
    expect(entries[0]!.id).toBe('l2-w01-story-page-a-nest');
    expect(entries[0]!.kind).toBe('color');
    expect(entries[0]!.pageText).toBe('A nest.');
    expect(entries[0]!.use).toBe('story-page');
    expect(entries[0]!.mustShow).toEqual(["Nan", "a bird's nest with twigs"]);
    expect(entries[1]!.use).toBe('check-row');
    expect(entries[1]!.mustShow).toEqual(['one axe', 'a handle and a blade']);

    const storyCopy = path.join(root, entries[0]!.judgeFile);
    const cardCopy = path.join(root, entries[1]!.judgeFile);
    expect(existsSync(storyCopy)).toBe(true);
    expect(existsSync(cardCopy)).toBe(true);
    const storySize = await sharp(storyCopy).metadata();
    const cardSize = await sharp(cardCopy).metadata();
    expect(Math.max(storySize.width ?? 0, storySize.height ?? 0)).toBe(900);
    expect(Math.max(cardSize.width ?? 0, cardSize.height ?? 0)).toBe(360);
  });

  it('writes the batch file as the JSON of the entries', async () => {
    writeSpec(STORY_SPEC);
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m1-color.png');
    const entries = await buildBatch({
      ids: ['l2-w01-story-page-a-nest'],
      kind: 'color',
      tryNo: 1,
      specDir,
      judgeDir: path.join(root, 'judge'),
      root,
    });
    const text = JSON.stringify(entries, null, 2) + '\n';
    expect(JSON.parse(text)).toEqual(entries);
  });

  it('refuses a missing source file and writes no judge copy', async () => {
    writeSpec(STORY_SPEC);
    await expect(
      buildBatch({
        ids: ['l2-w01-story-page-a-nest'],
        kind: 'color',
        tryNo: 3,
        specDir,
        judgeDir: path.join(root, 'judge'),
        root,
      }),
    ).rejects.toThrow(/no source file/);
    expect(existsSync(path.join(root, 'out/storytime-review/judge/prod/l2-w01-story-page-a-nest-color-t3.png'))).toBe(false);
  });

  it('refuses an id with no A-48 spec', async () => {
    await expect(
      buildBatch({
        ids: ['l2-w99-check-row-nothing'],
        kind: 'color',
        tryNo: 1,
        specDir,
        judgeDir: path.join(root, 'judge'),
        root,
      }),
    ).rejects.toThrow(/no A-48 spec/);
  });
});
