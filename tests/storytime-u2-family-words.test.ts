// Tests for the Storytime Level 2 unit 2 app family words (D6, 2026-11-09).
//
// The 18 app family-word pictures are the family-word card set of unit 2. The specs live in
// docs/storytime/l2-unit2/family-words/. The tests cover:
//   - the 18 ids and their weeks, and the folder holds no other spec;
//   - the card form: the outDir, the print pad, the 1500 x 1500 size, and the delivered name;
//   - the text rule: no skin, race, or ethnicity word in any text field;
//   - the references: at most 10 per spec, and every reference file exists;
//   - the jump word: Sam, and both feet off the ground;
//   - the object rule: the app object is the object of the unit 2 spec that draws the word;
//   - the judge option --unit2-family-words: the refusal, the folders, the tries, the mustShow
//     phrases, the 360 px copy, and the 0-cost failure rule.
//
// Every test reads local files or writes to a temp folder. No test makes a provider call.
import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolve } from 'node:path';
import sharp from 'sharp';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import * as judgeBatch from '../scripts/storytime-judge-batch.mjs';

const REPO = process.cwd();
const SPEC_DIR = 'docs/storytime/l2-unit2/family-words';
const OUT_DIR = 'out/storytime/l2/unit2/family-words/muse';

/** The 18 app words and their weeks, in the order of the paid media list. */
const WORDS: Array<[number, string]> = [
  [9, 'egg'],
  [9, 'milk'],
  [9, 'cake'],
  [10, 'hat'],
  [11, 'bed'],
  [11, 'table'],
  [11, 'sofa'],
  [11, 'box'],
  [11, 'chair'],
  [12, 'book'],
  [12, 'bag'],
  [12, 'pencil'],
  [12, 'pen'],
  [13, 'jump'],
  [15, 'bus'],
  [15, 'bike'],
  [15, 'truck'],
  [15, 'plane'],
];

const IDS = WORDS.map(([week, word]) => `l2-w${String(week).padStart(2, '0')}-family-${word}`);
const read = (id: string) => JSON.parse(readFileSync(resolve(REPO, SPEC_DIR, `${id}.json`), 'utf8'));
const specs = IDS.map((id) => ({ id, spec: read(id) }));

/** The judge option of the app family words. */
const FW_DIR = 'out/storytime/l2/unit2/family-words/muse';
const FW_JUDGE_REL = 'out/storytime-review/judge/prod-u2';
const FW_BATCH_DIR = 'docs/storytime/l2-unit2/judge/prod';
const FW_START = guards.U2_FW_RUN.startTime;
const HOUR = 3600 * 1000;
const COST_HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';

/** A UTC time at an offset from the start time of the app run. */
const fwAt = (offsetMs: number) => new Date(Date.parse(FW_START) + offsetMs).toISOString();

/** One cost row of a Muse color call. A cost of 0.00 marks a failed call. */
const fwCostRow = (id: string, time: string, version = 'm1', cost = '0.01', output?: string) =>
  `${time}\t${id}\t${version}\tcolor\tin\t${output ?? `${id}-${version}-color.png`}\t1500x1500\t${cost}\tok`;

/** Writes a JSON file below the root, with parent folders. */
const writeJson = (root: string, rel: string, value: unknown) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
};

/** Writes one small source picture of a Muse color call. */
const writeSource = async (root: string, rel: string, color: string) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  const png = await sharp({ create: { width: 240, height: 240, channels: 3, background: color } }).png().toBuffer();
  writeFileSync(file, png);
};

/** Writes a costs.tsv of one folder. */
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${COST_HEADER}\n${rows.join('\n')}\n`);
};

/** The spec of one app family word, as the judge reads it. */
const fwSpec = (id: string, word: string) => ({
  id,
  text: word,
  pageText: word,
  use: 'card',
  goal: `One ${word}, large in the middle of a white card, so a child can name it.`,
  mustShow: [word],
  deliverAs: `${id}-v1.png`,
  references: [],
  colorPrompt: `a color prompt for ${word}`,
  print: 'pad',
  aspect: '1:1',
  printSize: [1500, 1500],
  outDir: FW_DIR,
});

/** A temp root with the app specs, the cost file, and the source pictures. */
async function makeFwRoot(rows: string[], sources: Array<{ rel: string; color: string }>) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'storytime-u2-fw-judge-'));
  writeJson(root, `${SPEC_DIR}/l2-w09-family-egg.json`, fwSpec('l2-w09-family-egg', 'egg'));
  writeJson(root, `${SPEC_DIR}/l2-w13-family-jump.json`, fwSpec('l2-w13-family-jump', 'jump'));
  writeCosts(root, `${FW_DIR}/costs.tsv`, rows);
  for (const source of sources) await writeSource(root, source.rel, source.color);
  return root;
}

/** The longest side of a picture file. */
const maxSide = async (file: string) => {
  const meta = await sharp(file).metadata();
  return Math.max(meta.width ?? 0, meta.height ?? 0);
};

/** A skin, race, or ethnicity word. The rule is a word, so "trace" is not a hit. */
const FORBIDDEN = /\b(skin|race|ethnic\w*)\b/i;

/**
 * The object rule of the app words. Each row holds the app id, the unit 2 spec that draws the
 * word, the object of the app spec, and the phrase of the unit 2 spec. The app object and the
 * unit 2 object are the same object, in kind and color.
 */
const OBJECT_RULE: Array<[string, string | null, string, string]> = [
  ['l2-w09-family-egg', 'docs/storytime/l2-unit2/w11/muse/l2-w11-check-row-egg.json',
    'white boiled egg, peeled', 'white boiled egg, peeled'],
  ['l2-w09-family-milk', 'docs/storytime/l2-unit2/w09/muse/l2-w09-story-page-i-like-milk-yum.json',
    'glass of white milk', 'glass of white milk'],
  ['l2-w09-family-cake', 'docs/storytime/l2-unit2/w09/muse/l2-w09-story-page-i-like-cake-yum.json',
    'small pink cake with white icing', 'small pink cake with white icing'],
  ['l2-w10-family-hat', 'docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip.json',
    'small purple hat', 'small purple hat'],
  ['l2-w11-family-bed', 'docs/storytime/l2-unit2/w11/muse/l2-w11-story-page-where-is-mia-in-the-bed.json',
    'small bed with a pillow and a yellow blanket', 'yellow blanket'],
  ['l2-w11-family-table', 'docs/storytime/l2-unit2/w11/muse/l2-w11-story-page-where-is-sam-under-the-table.json',
    'long low wooden table with a plain top and four short legs',
    'long low wooden table with a plain top and four short legs'],
  ['l2-w11-family-sofa', 'docs/storytime/l2-unit2/w11/muse/l2-w11-story-page-where-is-pat-on-the-sofa.json',
    'blue sofa with one cushion and a folded blanket on its arm',
    'blue sofa with one cushion and a folded blanket on its arm'],
  ['l2-w11-family-box', 'docs/storytime/l2-unit2/w11/muse/l2-w11-story-page-where-is-may-in-the-box.json',
    'big empty cardboard box', 'big empty cardboard box'],
  ['l2-w11-family-chair', 'docs/storytime/l2-unit2/w11/muse/l2-w11-story-page-where-is-lily-on-the-chair.json',
    'small wooden chair with four legs and a low back', 'small wooden chair with four legs and a low back'],
  ['l2-w12-family-book', 'docs/storytime/l2-unit2/w12/muse/l2-w12-story-page-open-your-book-ben.json',
    'open picture book with a plain cover and blank pages',
    'open picture book with a plain cover and blank pages'],
  ['l2-w12-family-bag', 'docs/storytime/l2-unit2/w12/muse/l2-w12-story-page-open-your-book-nan.json',
    'school bag with a flap, a handle, and two straps', 'school bag with a flap, a handle, and two straps'],
  ['l2-w12-family-pencil', null, 'ONE pencil', ''],
  ['l2-w12-family-pen', 'docs/storytime/l2-unit2/w12/muse/l2-w12-check-row-pen.json', 'ONE pen', 'ONE pen'],
  ['l2-w13-family-jump', 'docs/storytime/l2-unit2/w13/muse/l2-w13-d4-prompt-jump.json',
    'both feet off the ground', 'both feet off the ground'],
  ['l2-w15-family-bus', 'docs/storytime/l2-unit2/w15/muse/l2-w15-story-page-look-a-bus.json',
    'yellow school bus with black wheels and a row of windows',
    'yellow school bus with black wheels and a row of windows'],
  ['l2-w15-family-bike', 'docs/storytime/l2-unit2/w15/muse/l2-w15-story-page-look-a-bike.json',
    'ONE blue bike', 'blue bike'],
  ['l2-w15-family-truck', 'docs/storytime/l2-unit2/w15/muse/l2-w15-story-page-look-a-truck.json',
    'ONE big green truck', 'big green truck'],
  ['l2-w15-family-plane', 'docs/storytime/l2-unit2/w15/muse/l2-w15-story-page-look-a-plane.json',
    'small white airplane', 'small white airplane'],
];

/** Every text field of a spec, as one string. */
const allText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(allText).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(allText).join(' ');
  return '';
};

describe('the unit 2 app family-word specs (U2FW)', () => {
  it('U2FW1 holds the 18 specs with the right ids and weeks', () => {
    expect(specs).toHaveLength(18);
    for (const [index, [week, word]] of WORDS.entries()) {
      const id = `l2-w${String(week).padStart(2, '0')}-family-${word}`;
      expect(IDS[index]).toBe(id);
      expect(specs[index]!.spec.id).toBe(id);
      expect(specs[index]!.spec.text).toBe(word);
      expect(specs[index]!.spec.pageText).toBe(word);
    }
    const files = readdirSync(resolve(REPO, SPEC_DIR)).filter((name) => name.endsWith('.json')).sort();
    expect(files).toEqual(IDS.map((id) => `${id}.json`).sort());
  });

  it('U2FW2 gives every spec the card form and the print pad', () => {
    for (const { id, spec } of specs) {
      expect(spec.use).toBe('card');
      expect(spec.outDir).toBe(OUT_DIR);
      expect(spec.print).toBe('pad');
      expect(spec.aspect).toBe('1:1');
      expect(spec.printSize).toEqual([1500, 1500]);
      expect(spec.deliverAs).toBe(`${id}-v1.png`);
      expect(Array.isArray(spec.mustShow)).toBe(true);
      expect(spec.mustShow.length).toBeGreaterThan(0);
      expect(typeof spec.goal).toBe('string');
      expect(spec.goal.length).toBeGreaterThan(0);
      expect(typeof spec.colorPrompt).toBe('string');
      expect(spec.colorPrompt.length).toBeGreaterThan(0);
    }
  });

  it('U2FW3 holds no skin, race, or ethnicity word in any text field', () => {
    for (const { id, spec } of specs) {
      const text = allText(spec);
      const hit = FORBIDDEN.exec(text);
      expect(hit, `${id} holds the word ${hit?.[0]}`).toBe(null);
    }
  });

  it('U2FW4 holds at most 10 references, and every reference file exists', () => {
    for (const { id, spec } of specs) {
      const references = spec.references as string[];
      expect(Array.isArray(references)).toBe(true);
      expect(references.length).toBeLessThanOrEqual(10);
      for (const reference of references) {
        expect(typeof reference).toBe('string');
        expect(existsSync(resolve(REPO, reference)), `${id} names the missing file ${reference}`).toBe(true);
      }
    }
  });

  it('U2FW5 names Sam and both feet off the ground for the jump word', () => {
    const jump = read('l2-w13-family-jump');
    expect(jump.mustShow).toEqual(['a child jumping with both feet off the ground']);
    expect(jump.colorPrompt).toContain('Sam');
    expect(jump.colorPrompt).toContain('both feet off the ground');
    expect(jump.references).toEqual(['out/storytime/l2/unit1/w05/muse/elements/sam-ref-render.png']);
    expect(existsSync(resolve(REPO, jump.references[0]!))).toBe(true);
  });

  it('U2FW6 shows the object of the unit 2 spec that draws the word', () => {
    expect(OBJECT_RULE.map(([id]) => id)).toEqual(IDS);
    for (const [id, sourceFile, appPhrase, sourcePhrase] of OBJECT_RULE) {
      const spec = read(id);
      expect(spec.colorPrompt, `${id} names another object`).toContain(appPhrase);
      if (!sourceFile) continue;
      const source = JSON.parse(readFileSync(resolve(REPO, sourceFile), 'utf8'));
      expect(source.colorPrompt, `${sourceFile} names another object`).toContain(sourcePhrase);
      const sourceReferences = (source.references as string[]) ?? [];
      for (const reference of spec.references as string[]) {
        expect(sourceReferences, `${id} names a file the unit 2 spec does not name`).toContain(reference);
      }
    }
  });
});

describe('the app family-word judge option (U2FWJ)', () => {
  it('U2FWJ1 parses --unit2-family-words and refuses --cards, --family-words, and --unit2', () => {
    const base = ['--ids', 'l2-w09-family-egg', '--kind', 'color', '--try', '1'];
    const plain = Object.fromEntries(
      Object.entries(judgeBatch.parseArgs(base)).filter(([, value]) => value !== undefined),
    );
    expect(plain).toEqual({ ids: ['l2-w09-family-egg'], kind: 'color', tryNo: 1, out: 'batch-color-t1' });
    expect(judgeBatch.parseArgs([...base, '--unit2-family-words']).unit2FamilyWords).toBe(true);
    for (const extra of [['--cards'], ['--family-words'], ['--unit2']]) {
      for (const argv of [[...base, '--unit2-family-words', ...extra], [...base, ...extra, '--unit2-family-words']]) {
        let message = '';
        try {
          judgeBatch.parseArgs(argv);
        } catch (error) {
          message = (error as Error).message;
        }
        expect(message).toContain('--unit2-family-words');
        expect(message).not.toContain('unknown option');
      }
    }
    expect(() => judgeBatch.parseArgs([...base, '--bogus'])).toThrow(/unknown option/);
    expect(judgeBatch.parseArgs([...base, '--cards']).cards).toBe(true);
    expect(judgeBatch.parseArgs([...base, '--family-words']).familyWords).toBe(true);
    expect(judgeBatch.parseArgs([...base, '--unit2']).unit2).toBe(true);
  });

  it('U2FWJ2 sends the batch files and the judge copies to the unit 2 folders', () => {
    expect(judgeBatch.batchDirOf({ unit2FamilyWords: true })).toBe(path.join(REPO, FW_BATCH_DIR));
    expect(judgeBatch.batchDirOf({ unit2: true })).toBe(path.join(REPO, FW_BATCH_DIR));
    expect(judgeBatch.batchDirOf({})).toBe(path.join(REPO, 'docs/storytime/l2-unit1/judge/prod'));
    expect(judgeBatch.UNIT2_JUDGE_DIR).toBe(FW_JUDGE_REL);
  });

  it('U2FWJ3 builds one entry with the word, the family-word use, and a 360 px copy', async () => {
    const id = 'l2-w09-family-egg';
    const root = await makeFwRoot(
      [fwCostRow(id, fwAt(HOUR))],
      [{ rel: `${FW_DIR}/${id}-m1-color.png`, color: '#cc4422' }],
    );
    try {
      const entries = await judgeBatch.buildBatch({
        ids: [id],
        kind: 'color',
        tryNo: 1,
        unit2FamilyWords: true,
        root,
      });
      expect(entries).toHaveLength(1);
      expect(Object.keys(entries[0]!).sort()).toEqual(['id', 'judgeFile', 'kind', 'mustShow', 'pageText', 'use']);
      expect(entries[0]!).toEqual({
        judgeFile: `${FW_JUDGE_REL}/${id}-color-t1.png`,
        id,
        kind: 'color',
        pageText: 'egg',
        use: 'family-word',
        mustShow: ['egg'],
      });
      const copy = path.join(root, FW_JUDGE_REL, `${id}-color-t1.png`);
      expect(existsSync(copy)).toBe(true);
      expect(await maxSide(copy)).toBe(360);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2FWJ4 gives the jump word the jump phrase', async () => {
    const id = 'l2-w13-family-jump';
    const root = await makeFwRoot(
      [fwCostRow(id, fwAt(HOUR))],
      [{ rel: `${FW_DIR}/${id}-m1-color.png`, color: '#22aa44' }],
    );
    try {
      const entries = await judgeBatch.buildBatch({
        ids: [id],
        kind: 'color',
        tryNo: 1,
        unit2FamilyWords: true,
        root,
      });
      expect(entries[0]!.mustShow).toEqual(['a child jumping with both feet off the ground']);
      expect(entries[0]!.use).toBe('family-word');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2FWJ5 starts the tries at U2_FW_RUN.startTime and keeps the 0-cost failure rule', async () => {
    const id = 'l2-w09-family-egg';
    const root = await makeFwRoot(
      [
        fwCostRow(id, fwAt(-HOUR), 'm1'),
        fwCostRow(id, fwAt(0), 'm2', '0.00', 'none'),
        fwCostRow(id, fwAt(HOUR), 'm3'),
      ],
      [
        { rel: `${FW_DIR}/${id}-m2-color.png`, color: '#cc4422' },
        { rel: `${FW_DIR}/${id}-m3-color.png`, color: '#2244cc' },
      ],
    );
    try {
      // The row before the start time is not a try, so try 1 is the failed call of the run.
      await expect(
        judgeBatch.buildBatch({ ids: [id], kind: 'color', tryNo: 1, unit2FamilyWords: true, root }),
      ).rejects.toThrow(/the call failed/);
      const entries = await judgeBatch.buildBatch({
        ids: [id],
        kind: 'color',
        tryNo: 2,
        unit2FamilyWords: true,
        root,
      });
      expect(entries[0]!.judgeFile).toBe(`${FW_JUDGE_REL}/${id}-color-t2.png`);
      expect(existsSync(path.join(root, FW_JUDGE_REL, `${id}-color-t2.png`))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
