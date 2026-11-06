// Tests for the family-word judge flag (Task 2 of the track plan).
//
// The flag --family-words reads the spec folder docs/storytime/l2-unit1/family-words/ and starts
// the tries at CARD_RUN.startTime, as --cards does. The tests use a temp root only. They make no
// provider call. They read no file of a real run.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import * as judgeBatch from '../scripts/storytime-judge-batch.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'l2-w05-card-eyes';
/** The card output folder of the guard, built from two pieces so the file holds no copy. */
const CARD_DIR = 'out/storytime/l2/unit1/' + 'cards/muse';
/** The card start time of the guard, built from two pieces so the file holds no copy. */
const CARD_START = '2026-11-06' + 'T00:00:00Z';
const START = guards.CARD_RUN.startTime;
const HOUR = 3600 * 1000;
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';

const FAMILY_SPEC = {
  id: ID,
  text: 'eyes',
  pageText: 'eyes',
  use: 'card',
  goal: 'One picture of Nan that shows the word eyes.',
  mustShow: ['Nan', 'both eyes'],
  deliverAs: `${ID}-v1.png`,
  references: [],
  colorPrompt: 'a color prompt',
  print: 'crop',
  aspect: '1:1',
  printSize: [1500, 1500],
  outDir: CARD_DIR,
};

/** The same id in the cards folder, with another page text. */
const CARD_SPEC = { ...FAMILY_SPEC, pageText: 'card eyes', mustShow: ['a card eyes row'] };

const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** A time of the card run, as an ISO string. */
const at = (offsetMs: number) => new Date(Date.parse(START) + offsetMs).toISOString();

/** A time of the card run in the +07:00 form. */
const offsetForm = (offsetMs: number) => {
  const date = new Date(Date.parse(START) + offsetMs + 7 * HOUR);
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+07:00`
  );
};

/** One color row of the costs file of the card run. */
const costRow = (time: string, version: string) =>
  `${time}\t${ID}\t${version}\tcolor\tin\t${ID}-${version}-color.png\t1500x1500\t0.01\tok`;

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

/** A temp root with both spec folders, the costs file, and the source pictures. */
const makeRoot = async (rows: string[], sources: Array<{ name: string; color: string }>) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'storytime-family-word-judge-'));
  const familyDir = path.join(root, 'docs/storytime/l2-unit1/family-words');
  const cardDir = path.join(root, 'docs/storytime/l2-unit1/cards');
  mkdirSync(familyDir, { recursive: true });
  mkdirSync(cardDir, { recursive: true });
  writeFileSync(path.join(familyDir, `${ID}.json`), JSON.stringify(FAMILY_SPEC, null, 2));
  writeFileSync(path.join(cardDir, `${ID}.json`), JSON.stringify(CARD_SPEC, null, 2));
  const museDir = path.join(root, CARD_DIR);
  mkdirSync(museDir, { recursive: true });
  for (const source of sources) {
    const png = await sharp({ create: { width: 1500, height: 1500, channels: 3, background: source.color } })
      .png()
      .toBuffer();
    writeFileSync(path.join(museDir, source.name), png);
  }
  writeFileSync(path.join(museDir, 'costs.tsv'), `${HEADER}\n${rows.join('\n')}\n`);
  return root;
};

/** The options of one build. The parsed object goes whole into the build. */
const buildOptions = (argv: string[], root: string): judgeBatch.BuildBatchOptions => {
  const parsed = judgeBatch.parseArgs(argv);
  return { ...parsed, root } as unknown as judgeBatch.BuildBatchOptions;
};

/** The parsed options without the keys that hold no value. */
const withoutUndefined = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));

const BASE = ['--ids', ID, '--kind', 'color', '--try', '1'];

describe('the family-word judge flag (FJ)', () => {
  it('FJ1 parses the new flag and keeps the old options', () => {
    const plain = withoutUndefined(judgeBatch.parseArgs(BASE));
    expect(plain).toEqual({ ids: [ID], kind: 'color', tryNo: 1, out: 'batch-color-t1' });
    expect(() => judgeBatch.parseArgs([...BASE, '--bogus'])).toThrow(/unknown option/);
    expect(() => judgeBatch.parseArgs([...BASE, '--family-words'])).not.toThrow();
    const family = withoutUndefined(judgeBatch.parseArgs([...BASE, '--family-words']));
    const cards = withoutUndefined(judgeBatch.parseArgs([...BASE, '--cards']));
    expect(family).not.toEqual(cards);
  });

  it('FJ2 reads the spec of the family-word folder and copies the judge picture', async () => {
    const root = await makeRoot(
      [costRow(at(HOUR), 'm1')],
      [{ name: `${ID}-m1-color.png`, color: '#2244cc' }],
    );
    try {
      const entries = await judgeBatch.buildBatch(
        buildOptions([...BASE, '--family-words'], root),
      );
      expect(entries).toHaveLength(1);
      expect(Object.keys(entries[0]!).sort()).toEqual(['id', 'judgeFile', 'kind', 'mustShow', 'pageText', 'use']);
      expect(entries[0]!.id).toBe(ID);
      expect(entries[0]!.kind).toBe('color');
      expect(entries[0]!.pageText).toBe('eyes');
      expect(entries[0]!.use).toBe('card');
      expect(entries[0]!.mustShow).toEqual(['Nan', 'both eyes']);
      const copy = path.join(root, entries[0]!.judgeFile);
      expect(existsSync(copy)).toBe(true);
      expect(path.dirname(entries[0]!.judgeFile)).toBe('out/storytime-review/judge/prod');
      const meta = await sharp(copy).metadata();
      expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(judgeBatch.longSideOf('card'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FJ3 starts the tries at the card start time', async () => {
    const root = await makeRoot(
      [costRow(at(-HOUR), 'm1'), costRow(at(HOUR), 'm2')],
      [
        { name: `${ID}-m1-color.png`, color: '#aa1111' },
        { name: `${ID}-m2-color.png`, color: '#11aa11' },
      ],
    );
    try {
      const entries = await judgeBatch.buildBatch(
        buildOptions([...BASE, '--family-words'], root),
      );
      expect(entries).toHaveLength(1);
      const copy = path.join(root, entries[0]!.judgeFile);
      const { data } = await sharp(copy).raw().toBuffer({ resolveWithObject: true });
      const green = data[1] ?? 0;
      const red = data[0] ?? 0;
      expect(green > 150 && red < 90).toBe(true);
      await expect(
        judgeBatch.buildBatch(buildOptions([...BASE, '--try', '2', '--family-words'], root)),
      ).rejects.toThrow(/holds? 1 (?:color )?try/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FJ3 counts a row at the start time and a row in the offset form', async () => {
    for (const time of [at(0), offsetForm(0), offsetForm(HOUR)]) {
      const root = await makeRoot(
        [costRow(time, 'm1')],
        [{ name: `${ID}-m1-color.png`, color: '#2244cc' }],
      );
      try {
        const entries = await judgeBatch.buildBatch(
          buildOptions([...BASE, '--family-words'], root),
        );
        expect(entries, `FJ3 row at ${time}`).toHaveLength(1);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it('FJ4 writes no cost file and only the judge copies', async () => {
    const root = await makeRoot(
      [costRow(at(HOUR), 'm1')],
      [{ name: `${ID}-m1-color.png`, color: '#2244cc' }],
    );
    try {
      const costFile = path.join(root, CARD_DIR, 'costs.tsv');
      const costBefore = sha(readFileSync(costFile));
      const filesBefore = listFiles(root);
      const entries = await judgeBatch.buildBatch(
        buildOptions([...BASE, '--family-words'], root),
      );
      expect(sha(readFileSync(costFile))).toBe(costBefore);
      const filesAfter = listFiles(root);
      const added = filesAfter.filter((file) => !filesBefore.includes(file));
      expect(added).toEqual(entries.map((entry) => entry.judgeFile));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FJ5 refuses the two flags together and writes no file', async () => {
    for (const argv of [[...BASE, '--cards', '--family-words'], [...BASE, '--family-words', '--cards']]) {
      let message = '';
      try {
        judgeBatch.parseArgs(argv);
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message, 'FJ5 error text').toContain('--cards');
      expect(message, 'FJ5 error text').toContain('--family-words');
      expect(message, 'FJ5 error text').not.toContain('unknown option');
    }

    const home = mkdtempSync(path.join(os.tmpdir(), 'storytime-family-word-home-'));
    const prodDir = path.join(ROOT, 'docs/storytime/l2-unit1/judge/prod');
    const before = listFiles(prodDir);
    try {
      const run = spawnSync(
        'node',
        ['scripts/storytime-judge-batch.mjs', ...BASE, '--cards', '--family-words', '--out', 'fw-nowrite-test'],
        { cwd: ROOT, env: { PATH: process.env.PATH ?? '', HOME: home }, encoding: 'utf8' },
      );
      expect(run.status).toBe(1);
      expect(run.stderr).toContain('--cards');
      expect(run.stderr).toContain('--family-words');
      expect(run.stderr).not.toContain('unknown option');
      expect(listFiles(prodDir)).toEqual(before);
      expect(existsSync(path.join(prodDir, 'fw-nowrite-test.json'))).toBe(false);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('FJ6 keeps the cards folder and the A-48 folder unchanged', async () => {
    const root = await makeRoot(
      [costRow(at(HOUR), 'm1')],
      [{ name: `${ID}-m1-color.png`, color: '#2244cc' }],
    );
    try {
      const cardsEntries = await judgeBatch.buildBatch(
        buildOptions([...BASE, '--cards'], root),
      );
      expect(cardsEntries).toHaveLength(1);
      expect(cardsEntries[0]!.pageText).toBe('card eyes');
      await expect(
        judgeBatch.buildBatch(
          buildOptions([...BASE, '--try', '2', '--cards'], root),
        ),
      ).rejects.toThrow(/holds? 1 (?:color )?try/);
      await expect(
        judgeBatch.buildBatch(buildOptions(BASE, root)),
      ).rejects.toThrow(/no A-48 spec/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FJ7 keeps the specDir option', async () => {
    const root = await makeRoot(
      [costRow(at(HOUR), 'm1')],
      [{ name: `${ID}-m1-color.png`, color: '#2244cc' }],
    );
    try {
      const ownDir = path.join(root, 'own-specs');
      mkdirSync(ownDir, { recursive: true });
      writeFileSync(
        path.join(ownDir, `${ID}.json`),
        JSON.stringify({ ...FAMILY_SPEC, pageText: 'own spec' }, null, 2),
      );
      const entries = await judgeBatch.buildBatch({
        ...buildOptions([...BASE, '--family-words'], root),
        specDir: ownDir,
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]!.pageText).toBe('own spec');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FJ8 keeps the card constants in the guard', () => {
    const source = readFileSync(path.join(ROOT, 'scripts/storytime-judge-batch.mjs'), 'utf8');
    expect(source).toMatch(/import\s*\{[^}]*CARD_RUN[^}]*\}\s*from\s*['"]\.\/storytime-muse-guards\.mjs['"]/s);
    expect(source).not.toContain(CARD_START);
    expect(source).not.toContain(CARD_DIR);
    expect(source).not.toMatch(/(?:cap|report)[A-Za-z_]*\s*=\s*(?:1\.6|0\.8)/i);
    const seeded = `const start = '${CARD_START}'; const dir = '${CARD_DIR}';`;
    expect(seeded.includes(CARD_START)).toBe(true);
    expect(seeded.includes(CARD_DIR)).toBe(true);
  });
});
