// Tests for the Storytime Level 2 unit 2 judge batch option (D2, 2026-11-08).
//
// The option --unit2 of scripts/storytime-judge-batch.mjs reads the unit 2 specs and cost files,
// writes the judge copies to out/storytime-review/judge/prod-u2/, and builds the mustShow
// phrases from rows.json and the picture list. The tests cover:
//   - the new flag and the refusal with --cards or --family-words;
//   - the unit 2 spec folders: w<nn>/muse for a row id and w<nn>/muse-elements for an element id;
//   - the try start time of U2_RUN and the time order of the tries;
//   - the mustShow phrases: cast names plus object counts, or the word for class C;
//   - the printed size: 900 px for class A and B, 360 px for class C;
//   - the units 1 paths, which do not change.
//
// Every build uses a temp root and small generated PNG files. No build makes a provider call.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import * as judgeBatch from '../scripts/storytime-judge-batch.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const U2_SPEC_ROOT = 'docs/storytime/l2-unit2';
const STORY_ID = 'l2-w09-story-page-a-show';
const CARD_ID = 'l2-w09-card-banana';
const ELEMENT_ID = 'set-test-room';
const STORY_DIR = `out/storytime/l2/unit2/w09/muse`;
const ELEMENT_DIR = `out/storytime/l2/unit2/w09/muse/elements`;
const JUDGE_REL = 'out/storytime-review/judge/prod-u2';
const START = guards.U2_RUN.startTime;
const HOUR = 3600 * 1000;
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';

const at = (offsetMs: number) => new Date(Date.parse(START) + offsetMs).toISOString();

const costRow = (id: string, time: string, version = 'm1', kind = 'color', output?: string) =>
  `${time}\t${id}\t${version}\t${kind}\tin\t${output ?? `${id}-${version}-${kind}.png`}\t1920x1280\t0.01\tok`;

const STORY_SPEC = {
  id: STORY_ID,
  text: 'A big page.',
  use: 'story-page',
  sizeClass: 'A',
  outDir: STORY_DIR,
  colorPrompt: 'a color prompt',
  linePrompt: 'a line prompt',
};
const CARD_SPEC = {
  id: CARD_ID,
  text: 'banana',
  use: 'card',
  sizeClass: 'C',
  outDir: STORY_DIR,
  colorPrompt: 'a color prompt',
  linePrompt: 'a line prompt',
};
const ELEMENT_SPEC = {
  id: ELEMENT_ID,
  text: '',
  use: 'element',
  outDir: ELEMENT_DIR,
  colorPrompt: 'an element prompt',
};
const ROWS = {
  track: 'test',
  rows: [
    { id: STORY_ID, week: 9, use: 'story-page', sizeClass: 'A', cast: ['sam'], text: 'A big page.', reuse: null },
    { id: CARD_ID, week: 9, use: 'card', sizeClass: 'C', cast: [], text: 'banana', reuse: null },
  ],
};
const LIST = [
  { id: STORY_ID, text: 'A big page.', use: 'story-page', sizeClass: 'A', objectCounts: { bowl: 1 } },
  { id: CARD_ID, text: 'banana', use: 'card', sizeClass: 'C', objectCounts: { banana: 1 } },
];

const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-u2-judge-batch-'));

/** Writes a JSON file below the root, with parent folders. */
const writeJson = (root: string, rel: string, value: unknown) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
};

/** Writes one small source picture of a Muse color call. */
const writeSource = async (root: string, rel: string, color: string, width = 240, height = 180) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  const png = await sharp({ create: { width, height, channels: 3, background: color } }).png().toBuffer();
  writeFileSync(file, png);
};

/** Writes a costs.tsv of one folder. */
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};

/** The relative paths of every file below a folder. */
const listFiles = (dir: string, base = dir): string[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full)];
    })
    .sort();
};

const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** A temp root with the unit 2 specs, rows file, picture list, cost file, and sources. */
async function makeRoot(rows: string[], sources: Array<{ rel: string; color: string }>) {
  const root = temp();
  writeJson(root, `${U2_SPEC_ROOT}/w09/muse/${STORY_ID}.json`, STORY_SPEC);
  writeJson(root, `${U2_SPEC_ROOT}/w09/muse/${CARD_ID}.json`, CARD_SPEC);
  writeJson(root, `${U2_SPEC_ROOT}/w09/muse-elements/${ELEMENT_ID}.json`, ELEMENT_SPEC);
  writeJson(root, `${U2_SPEC_ROOT}/rows.json`, ROWS);
  writeJson(root, 'list/pictures-u2.json', LIST);
  writeCosts(root, `${STORY_DIR}/costs.tsv`, rows);
  for (const source of sources) await writeSource(root, source.rel, source.color);
  return root;
}

const listFileOf = (root: string) => path.join(root, 'list/pictures-u2.json');
const build = (root: string, extra: Partial<judgeBatch.BuildBatchOptions> = {}) =>
  judgeBatch.buildBatch({
    ids: [STORY_ID, CARD_ID],
    kind: 'color',
    tryNo: 1,
    unit2: true,
    root,
    listFile: listFileOf(root),
    ...extra,
  });

const maxSide = async (file: string) => {
  const meta = await sharp(file).metadata();
  return Math.max(meta.width ?? 0, meta.height ?? 0);
};

describe('the unit 2 judge option (U2J)', () => {
  it('U2J1 parses --unit2 and refuses --cards and --family-words', () => {
    const base = ['--ids', STORY_ID, '--kind', 'color', '--try', '1'];
    const plain = Object.fromEntries(
      Object.entries(judgeBatch.parseArgs(base)).filter(([, value]) => value !== undefined),
    );
    expect(plain).toEqual({ ids: [STORY_ID], kind: 'color', tryNo: 1, out: 'batch-color-t1' });
    expect(judgeBatch.parseArgs([...base, '--unit2']).unit2).toBe(true);
    for (const extra of [['--cards'], ['--family-words']]) {
      for (const argv of [[...base, '--unit2', ...extra], [...base, ...extra, '--unit2']]) {
        let message = '';
        try {
          judgeBatch.parseArgs(argv);
        } catch (error) {
          message = (error as Error).message;
        }
        expect(message).toContain('--unit2');
        expect(message).toContain('--cards');
        expect(message).toContain('--family-words');
        expect(message).not.toContain('unknown option');
      }
    }
    expect(() => judgeBatch.parseArgs([...base, '--bogus'])).toThrow(/unknown option/);
  });

  it('U2J2 sends the batch files and the judge copies to the unit 2 folders', () => {
    expect(judgeBatch.batchDirOf({ unit2: true })).toBe(path.join(ROOT, 'docs/storytime/l2-unit2/judge/prod'));
    expect(judgeBatch.batchDirOf({})).toBe(path.join(ROOT, 'docs/storytime/l2-unit1/judge/prod'));
    expect(judgeBatch.batchDirOf(undefined)).toBe(path.join(ROOT, 'docs/storytime/l2-unit1/judge/prod'));
    expect(judgeBatch.UNIT2_JUDGE_DIR).toBe('out/storytime-review/judge/prod-u2');
    expect(judgeBatch.unit2LongSide('A')).toBe(900);
    expect(judgeBatch.unit2LongSide('B')).toBe(900);
    expect(judgeBatch.unit2LongSide('C')).toBe(360);
  });

  it('U2J3 builds one story entry with the cast and the object count', async () => {
    const root = await makeRoot(
      [costRow(STORY_ID, at(HOUR)), costRow(CARD_ID, at(HOUR))],
      [
        { rel: `${STORY_DIR}/${STORY_ID}-m1-color.png`, color: '#2244cc' },
        { rel: `${STORY_DIR}/${CARD_ID}-m1-color.png`, color: '#cc4422' },
      ],
    );
    try {
      const entries = await build(root);
      expect(entries).toHaveLength(2);
      expect(Object.keys(entries[0]!).sort()).toEqual(['id', 'judgeFile', 'kind', 'mustShow', 'pageText', 'use']);
      expect(entries[0]!).toEqual({
        judgeFile: `out/storytime-review/judge/prod-u2/${STORY_ID}-color-t1.png`,
        id: STORY_ID,
        kind: 'color',
        pageText: 'A big page.',
        use: 'story-page',
        mustShow: ['sam', '1 bowl'],
      });
      const copy = path.join(root, JUDGE_REL, `${STORY_ID}-color-t1.png`);
      expect(existsSync(copy)).toBe(true);
      expect(await maxSide(copy)).toBe(900);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J4 gives a class C row its word and a 360 px copy', async () => {
    const root = await makeRoot(
      [costRow(CARD_ID, at(HOUR))],
      [{ rel: `${STORY_DIR}/${CARD_ID}-m1-color.png`, color: '#cc4422' }],
    );
    try {
      const entries = await build(root, { ids: [CARD_ID] });
      expect(entries[0]!.mustShow).toEqual(['banana']);
      expect(entries[0]!.use).toBe('card');
      expect(entries[0]!.pageText).toBe('banana');
      expect(await maxSide(path.join(root, JUDGE_REL, `${CARD_ID}-color-t1.png`))).toBe(360);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J5 finds an element spec in the muse-elements folder', async () => {
    const root = await makeRoot(
      [],
      [{ rel: `${ELEMENT_DIR}/${ELEMENT_ID}-m1-color.png`, color: '#22aa44' }],
    );
    try {
      writeCosts(root, `${ELEMENT_DIR}/costs.tsv`, [costRow(ELEMENT_ID, at(HOUR))]);
      const entries = await build(root, { ids: [ELEMENT_ID] });
      expect(entries[0]!.mustShow).toEqual([ELEMENT_ID]);
      expect(entries[0]!.use).toBe('element');
      expect(entries[0]!.judgeFile).toBe(`out/storytime-review/judge/prod-u2/${ELEMENT_ID}-color-t1.png`);
      expect(await maxSide(path.join(root, JUDGE_REL, `${ELEMENT_ID}-color-t1.png`))).toBe(900);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J6 starts the tries at U2_RUN.startTime in time order', async () => {
    const root = await makeRoot(
      [
        costRow(STORY_ID, at(-HOUR), 'm1'),
        costRow(STORY_ID, at(0), 'm2'),
        costRow(STORY_ID, at(HOUR), 'm3'),
      ],
      [
        { rel: `${STORY_DIR}/${STORY_ID}-m1-color.png`, color: '#aa1111' },
        { rel: `${STORY_DIR}/${STORY_ID}-m2-color.png`, color: '#11aa11' },
        { rel: `${STORY_DIR}/${STORY_ID}-m3-color.png`, color: '#1111aa' },
      ],
    );
    try {
      const first = await build(root, { ids: [STORY_ID] });
      const { data } = await sharp(path.join(root, JUDGE_REL, `${STORY_ID}-color-t1.png`))
        .raw()
        .toBuffer({ resolveWithObject: true });
      const [red, green] = [data[0] ?? 0, data[1] ?? 0];
      expect(red < 90 && green > 150, 'try 1 is the m2 color, not the old m1 file').toBe(true);
      expect(first[0]!.judgeFile).toBe(`out/storytime-review/judge/prod-u2/${STORY_ID}-color-t1.png`);
      const second = await build(root, { ids: [STORY_ID], tryNo: 2 });
      expect(second[0]!.judgeFile).toBe(`out/storytime-review/judge/prod-u2/${STORY_ID}-color-t2.png`);
      await expect(build(root, { ids: [STORY_ID], tryNo: 3 })).rejects.toThrow(/no color try 3/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J7 keeps the failed zero-cost row as a try, like unit 1', async () => {
    const root = await makeRoot(
      [
        `${at(0)}\t${STORY_ID}\tm1\tcolor\tin\tnone\tnone\t0\tHTTP 429`,
        costRow(STORY_ID, at(HOUR), 'm2'),
      ],
      [{ rel: `${STORY_DIR}/${STORY_ID}-m2-color.png`, color: '#11aa11' }],
    );
    try {
      await expect(build(root, { ids: [STORY_ID] })).rejects.toThrow(/the call failed/);
      const second = await build(root, { ids: [STORY_ID], tryNo: 2 });
      expect(second[0]!.judgeFile).toBe(`out/storytime-review/judge/prod-u2/${STORY_ID}-color-t2.png`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J8 writes only judge copies and no cost file', async () => {
    const root = await makeRoot(
      [costRow(STORY_ID, at(HOUR))],
      [{ rel: `${STORY_DIR}/${STORY_ID}-m1-color.png`, color: '#2244cc' }],
    );
    try {
      const costFile = path.join(root, STORY_DIR, 'costs.tsv');
      const costBefore = sha(readFileSync(costFile));
      const before = listFiles(root);
      const entries = await build(root, { ids: [STORY_ID] });
      expect(sha(readFileSync(costFile))).toBe(costBefore);
      const added = listFiles(root).filter((file) => !before.includes(file));
      expect(added).toEqual([path.join(JUDGE_REL, `${STORY_ID}-color-t1.png`)]);
      expect(entries).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J9 refuses --unit2 with --cards or --family-words in a build', async () => {
    const root = await makeRoot([], []);
    try {
      for (const flags of [{ cards: true }, { familyWords: true }]) {
        await expect(build(root, flags)).rejects.toThrow(/--unit2 cannot run with --cards or --family-words/);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2J10 refuses the mixed CLI flags and writes no batch file', () => {
    const out = 'u2-nowrite-test';
    const prodDir = path.join(ROOT, 'docs/storytime/l2-unit2/judge/prod');
    const batchFile = path.join(prodDir, `${out}.json`);
    const before = existsSync(batchFile);
    const run = spawnSync(
      process.execPath,
      [
        'scripts/storytime-judge-batch.mjs',
        '--ids',
        STORY_ID,
        '--kind',
        'color',
        '--try',
        '1',
        '--unit2',
        '--cards',
        '--out',
        out,
      ],
      { cwd: ROOT, encoding: 'utf8' },
    );
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('--unit2');
    expect(run.stderr).toContain('--cards');
    expect(existsSync(batchFile)).toBe(before);
  });
});
