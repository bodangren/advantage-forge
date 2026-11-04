// Tests for the Storytime production judge batch builder (T4 step 1, 2026-11-05).
//
// The script scripts/storytime-judge-batch.mjs builds one judge batch for the A-48 pictures.
// It makes no provider call. The tests cover the pure rules and the file work:
//   - the printed long side of a use: 900 px for a story page, 360 px for every other card;
//   - the source file of a try comes from the restart rows of the costs.tsv of the week folder;
//   - the batch entry shape: judgeFile, id, kind, pageText, use, and mustShow;
//   - the judge copy at the printed size;
//   - a try that does not exist is an error and writes no copy.

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
  parseCostRows,
  restartTries,
  trySourceName,
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
async function writeSource(
  spec: Record<string, unknown>,
  name: string,
  width = 1920,
  height = 1280,
  background = '#88ccff',
) {
  const dir = path.join(root, spec.outDir as string);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  const png = await sharp({ create: { width, height, channels: 3, background } }).png().toBuffer();
  writeFileSync(file, png);
  return file;
}

/** One row of a costs.tsv. */
const costRow = (time: string, row: string, version: string, kind: string, output: string) =>
  `${time}\t${row}\t${version}\t${kind}\tin\t${output}\t1920x1280\t0.01\tok`;

/** A costs.tsv of a week folder. */
const writeCosts = (spec: Record<string, unknown>, lines: string[]) => {
  const dir = path.join(root, spec.outDir as string);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, 'costs.tsv'),
    `time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote\n${lines.join('\n')}\n`,
  );
};

describe('the judge batch rules', () => {
  it('prints a story page at 900 px and every other card at 360 px', () => {
    expect(longSideOf('story-page')).toBe(900);
    expect(longSideOf('check-row')).toBe(360);
    expect(longSideOf('practice-line')).toBe(360);
    expect(longSideOf('d4-prompt')).toBe(360);
  });

  it('takes the source file of a try from the restart rows of the costs.tsv', () => {
    const rows = parseCostRows(
      `time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote\n` +
        [
          costRow('2026-11-03T07:54:01', 'l2-w01-story-page-a-nest', 'm1', 'color', 'l2-w01-story-page-a-nest-m1-color.png'),
          costRow('2026-11-05T07:54:01', 'l2-w01-story-page-a-nest', 'm4', 'color', 'l2-w01-story-page-a-nest-m4-color.png'),
          costRow('2026-11-05T07:55:00', 'l2-w01-story-page-a-nest', 'm4', 'line', 'l2-w01-story-page-a-nest-m4-line.png'),
        ].join('\n'),
    );
    const colorTries = restartTries(rows, 'l2-w01-story-page-a-nest', 'color');
    expect(colorTries.length).toBe(1);
    expect(trySourceName(colorTries, 1, 'color', 'l2-w01-story-page-a-nest')).toBe(
      'l2-w01-story-page-a-nest-m4-color.png',
    );
    const lineTries = restartTries(rows, 'l2-w01-story-page-a-nest', 'line');
    expect(trySourceName(lineTries, 1, 'line', 'l2-w01-story-page-a-nest')).toBe(
      'l2-w01-story-page-a-nest-m4-line.png',
    );
    expect(() => trySourceName(colorTries, 2, 'color', 'l2-w01-story-page-a-nest')).toThrow(/no color try 2/);
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
    writeCosts(STORY_SPEC, [
      costRow('2026-11-05T07:54:01', 'l2-w01-story-page-a-nest', 'm1', 'color', 'l2-w01-story-page-a-nest-m1-color.png'),
    ]);
    writeCosts(CARD_SPEC, [
      costRow('2026-11-05T07:54:02', 'l2-w02-check-row-axe', 'm1', 'color', 'l2-w02-check-row-axe-m1-color.png'),
    ]);

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

  it('takes try 1 from the first restart row, not from the old approved files', async () => {
    writeSpec(STORY_SPEC);
    // The old approved art sits in m1 to m3. The restart call made m4.
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m1-color.png');
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m2-color.png');
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m3-color.png');
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m4-color.png', 1920, 1280, '#22bb44');
    writeCosts(STORY_SPEC, [
      costRow('2026-11-03T07:54:01', 'l2-w01-story-page-a-nest', 'm1', 'color', 'l2-w01-story-page-a-nest-m1-color.png'),
      costRow('2026-11-04T02:00:00', 'l2-w01-story-page-a-nest', 'm2', 'color', 'l2-w01-story-page-a-nest-m2-color.png'),
      costRow('2026-11-04T06:00:00', 'l2-w01-story-page-a-nest', 'm3', 'color', 'l2-w01-story-page-a-nest-m3-color.png'),
      costRow('2026-11-05T07:54:01', 'l2-w01-story-page-a-nest', 'm4', 'color', 'l2-w01-story-page-a-nest-m4-color.png'),
    ]);

    const entries = await buildBatch({
      ids: ['l2-w01-story-page-a-nest'],
      kind: 'color',
      tryNo: 1,
      specDir,
      judgeDir: path.join(root, 'judge'),
      root,
    });

    // The m4 file is a different color from the old files, so the copy must be that color.
    const copy = path.join(root, entries[0]!.judgeFile);
    const { data } = await sharp(copy).raw().toBuffer({ resolveWithObject: true });
    const red = data[0] ?? 0;
    const green = data[1] ?? 0;
    expect(green > 150 && red < 90).toBe(true);
    expect(entries[0]!.judgeFile).toBe('out/storytime-review/judge/prod/l2-w01-story-page-a-nest-color-t1.png');
  });

  it('writes the batch file as the JSON of the entries', async () => {
    writeSpec(STORY_SPEC);
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m1-color.png');
    writeCosts(STORY_SPEC, [
      costRow('2026-11-05T07:54:01', 'l2-w01-story-page-a-nest', 'm1', 'color', 'l2-w01-story-page-a-nest-m1-color.png'),
    ]);
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

  it('refuses a try that does not exist and writes no judge copy', async () => {
    writeSpec(STORY_SPEC);
    await writeSource(STORY_SPEC, 'l2-w01-story-page-a-nest-m1-color.png');
    writeCosts(STORY_SPEC, [
      costRow('2026-11-05T07:54:01', 'l2-w01-story-page-a-nest', 'm1', 'color', 'l2-w01-story-page-a-nest-m1-color.png'),
    ]);
    await expect(
      buildBatch({
        ids: ['l2-w01-story-page-a-nest'],
        kind: 'color',
        tryNo: 3,
        specDir,
        judgeDir: path.join(root, 'judge'),
        root,
      }),
    ).rejects.toThrow(/no color try 3/);
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
