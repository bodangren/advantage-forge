import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIST = path.join(ROOT, 'tests/fixtures/storytime/pictures-v7.json');
const SPECS = path.join(ROOT, 'docs/storytime/l2-unit1/family-words');
const CARDS = path.join(ROOT, 'docs/storytime/l2-unit1/cards');
const CAST = path.join(ROOT, 'docs/storytime/l2-unit1/judge/cast.json');
const LIST_SHA = 'ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf';
const CARD_OUT = 'out/storytime/l2/unit1/' + 'cards/muse';

const PAT_REF = 'out/storytime-review/batch-22/sprout-pat-render.png';
const NAN_LOOK = 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png';
const NAN_FACE = 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-face-crop.png';
const TOYS_SHEET = 'out/storytime/l2/unit1/w07/muse/elements/prop-toys-sheet-m1-color.png';

type Kind = 'friend' | 'body-part' | 'animal' | 'object';

interface Row {
  id: string;
  text: string;
  kind: Kind;
  child: 'nan' | 'pat' | '';
  refs: string[];
}

/** The 18 rows of the specification tables. Every value is hand typed from the tables. */
const ROWS: Row[] = [
  { id: 'l2-w01-card-friend', text: 'friend', kind: 'friend', child: '', refs: [PAT_REF, NAN_LOOK, NAN_FACE] },
  { id: 'l2-w05-card-eyes', text: 'eyes', kind: 'body-part', child: 'nan', refs: [NAN_LOOK, NAN_FACE] },
  { id: 'l2-w05-card-ears', text: 'ears', kind: 'body-part', child: 'pat', refs: [PAT_REF] },
  { id: 'l2-w05-card-nose', text: 'nose', kind: 'body-part', child: 'nan', refs: [NAN_LOOK, NAN_FACE] },
  { id: 'l2-w05-card-hands', text: 'hands', kind: 'body-part', child: 'pat', refs: [PAT_REF] },
  { id: 'l2-w05-card-arms', text: 'arms', kind: 'body-part', child: 'nan', refs: [NAN_LOOK, NAN_FACE] },
  { id: 'l2-w05-card-legs', text: 'legs', kind: 'body-part', child: 'pat', refs: [PAT_REF] },
  { id: 'l2-w05-card-feet', text: 'feet', kind: 'body-part', child: 'nan', refs: [NAN_LOOK, NAN_FACE] },
  { id: 'l2-w06-card-cat', text: 'cat', kind: 'animal', child: '', refs: ['out/cat/views/three-quarter.png'] },
  { id: 'l2-w06-card-dog', text: 'dog', kind: 'animal', child: '', refs: ['out/dog/views/three-quarter.png'] },
  { id: 'l2-w06-card-bird', text: 'bird', kind: 'animal', child: '', refs: ['out/storytime/l2/unit1/w06/muse/elements/prop-blue-bird-sheet-m1-color.png'] },
  { id: 'l2-w06-card-fish', text: 'fish', kind: 'animal', child: '', refs: ['out/fish/views/side.png'] },
  { id: 'l2-w06-card-frog', text: 'frog', kind: 'animal', child: '', refs: ['out/frog/views/three-quarter.png'] },
  { id: 'l2-w06-card-duck', text: 'duck', kind: 'animal', child: '', refs: ['out/storytime/l2/unit1/w02/muse/elements/prop-ducks-sheet-m1-color.png'] },
  { id: 'l2-w06-card-horse', text: 'horse', kind: 'animal', child: '', refs: ['out/storytime/l2/unit1/w06/muse/elements/prop-white-horse-sheet-m1-color.png'] },
  { id: 'l2-w07-card-ball', text: 'ball', kind: 'object', child: '', refs: [TOYS_SHEET] },
  { id: 'l2-w07-card-kite', text: 'kite', kind: 'object', child: '', refs: [TOYS_SHEET] },
  { id: 'l2-w07-card-drum', text: 'drum', kind: 'object', child: '', refs: [TOYS_SHEET] },
];

/** The key set of one spec file. */
const SPEC_KEYS = [
  'aspect', 'colorPrompt', 'deliverAs', 'goal', 'id', 'mustShow', 'outDir',
  'pageText', 'print', 'printSize', 'references', 'text', 'use',
];

/** The words that no text field of a spec may hold as a whole word. */
const FORBIDDEN = ['skin', 'race', 'racial', 'ethnic', 'ethnicity', 'complexion'];

/** The clothes words of each child, from the cast note of the judge kit. */
const NAN_CLOTHES = ['orange T-shirt', 'red shorts'];
const PAT_CLOTHES = ['green T-shirt', 'brown cargo shorts'];

/** The part word of each body-part row. */
const PART_WORD: Record<string, string> = {
  'l2-w05-card-eyes': 'eyes',
  'l2-w05-card-ears': 'ears',
  'l2-w05-card-nose': 'nose',
  'l2-w05-card-hands': 'hands',
  'l2-w05-card-arms': 'arm',
  'l2-w05-card-legs': 'legs',
  'l2-w05-card-feet': 'feet',
};

/** The extra keyword set of each body-part row. */
const PART_KEYWORDS: Record<string, string[]> = {
  'l2-w05-card-eyes': ['both eyes'],
  'l2-w05-card-ears': ['both ears'],
  'l2-w05-card-nose': [],
  'l2-w05-card-hands': ['palm', 'five clear short fingers'],
  'l2-w05-card-arms': ['elbow'],
  'l2-w05-card-legs': ['both legs'],
  'l2-w05-card-feet': ['both shoes'],
};

/** The extra keyword set of each animal and object row. */
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  'l2-w06-card-dog': ['not the puppy Pip'],
  'l2-w06-card-bird': ['blue'],
  'l2-w06-card-frog': ['green'],
  'l2-w06-card-duck': ['white'],
  'l2-w06-card-horse': ['white', 'no fence', 'no meadow'],
  'l2-w07-card-ball': ['red-and-yellow'],
  'l2-w07-card-kite': ['red-and-yellow', 'bows'],
  'l2-w07-card-drum': ['two wooden sticks'],
};

/** The rows whose reference is a view of a Forge asset with a gray background. */
const GRAY_ROWS = ['l2-w06-card-cat', 'l2-w06-card-dog', 'l2-w06-card-fish', 'l2-w06-card-frog'];

const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** The spec file names of a folder. A missing folder gives an empty list. */
const specNames = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.json')).sort() : [];

/** The spec of one row. A missing file gives an empty object. */
const loadSpec = (id: string): Record<string, any> => {
  const file = path.join(SPECS, `${id}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, any>) : {};
};

const has = (text: string, phrase: string) => text.toLowerCase().includes(phrase.toLowerCase());

/** Every forbidden word of one value and its child values. */
const forbiddenHits = (value: unknown, where = 'spec'): string[] => {
  if (typeof value === 'string') {
    return FORBIDDEN
      .filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(value))
      .map((word) => `${where}: ${word}`);
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => forbiddenHits(item, `${where}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      forbiddenHits(item, `${where}.${key}`),
    );
  }
  return [];
};

/** The checker of one spec file. Every error carries its own label. */
const checkSpec = (item: Record<string, any>, row: Row): string[] => {
  const errors: string[] = [];
  if (item.aspect !== '1:1') errors.push('aspect');
  if (item.outDir !== CARD_OUT) errors.push('outDir');
  if (item.deliverAs !== `${item.id}-v1.png`) errors.push('deliverAs');
  const actualRefs = Array.isArray(item.references) ? [...(item.references as string[])].sort() : [];
  const wantRefs = [...row.refs].sort();
  if (actualRefs.length < wantRefs.length) errors.push('references-missing');
  else if (actualRefs.length > wantRefs.length) errors.push('references-extra');
  else if (JSON.stringify(actualRefs) !== JSON.stringify(wantRefs)) errors.push('references-missing');
  if (typeof item.goal !== 'string' || !item.goal.trim()) errors.push('goal');
  if ('linePrompt' in item) errors.push('linePrompt');
  if (forbiddenHits(item).length > 0) errors.push('forbidden-word');
  const prompt = typeof item.colorPrompt === 'string' ? item.colorPrompt : '';
  const basePhrases = ['no text', 'no letters', 'pure white', 'rated G', 'margin'];
  const countPhrase = row.kind === 'friend' ? 'exactly two' : row.kind === 'body-part' ? 'exactly one' : '';
  const promptOk =
    basePhrases.every((phrase) => has(prompt, phrase)) &&
    !has(prompt, 'plain light background') &&
    (countPhrase === '' || has(prompt, countPhrase));
  if (!promptOk) errors.push('prompt-phrase');
  const clothes =
    row.kind === 'friend'
      ? [...NAN_CLOTHES, ...PAT_CLOTHES]
      : row.kind === 'body-part'
        ? row.child === 'nan'
          ? NAN_CLOTHES
          : PAT_CLOTHES
        : [];
  if (!clothes.every((phrase) => has(prompt, phrase))) errors.push('child-clothes');
  return errors;
};

describe('storytime family-word specs (FS)', () => {
  beforeAll(() => {
    expect(sha(readFileSync(LIST)), 'FS1 fixture SHA before the other checks').toBe(LIST_SHA);
  });

  it('FS1 verifies the v7 fixture SHA before using its rows', () => {
    expect(sha(readFileSync(LIST))).toBe(LIST_SHA);
  });

  it('FS2 pins the list rows and the id form of the 18 rows', () => {
    const list = JSON.parse(readFileSync(LIST, 'utf8')) as Array<{ id: string }>;
    expect(list, 'FS2 picture-list rows').toHaveLength(227);
    const ids = list.map((row) => row.id);
    expect(ids, 'FS2 family row in the list').toContain('l2-w04-card-family');
    const own = ROWS.map((row) => row.id);
    expect(own, 'FS2 family-word ids').toHaveLength(18);
    expect(new Set(own).size, 'FS2 distinct family-word ids').toBe(own.length);
    for (const id of own) {
      expect(ids, `FS2 ${id} is not a list row`).not.toContain(id);
      expect(id, 'FS2 id form').toMatch(/^l2-w0[1-7]-card-[a-z]+$/);
    }
  });

  it('FS3 holds the exact spec file names and the 31 card files', () => {
    const names = specNames(SPECS);
    expect(names, 'FS3 family-word spec files').toEqual(ROWS.map((row) => `${row.id}.json`).sort());
    expect(names, 'FS3 no family spec file').not.toContain('l2-w04-card-family.json');
    const cardNames = specNames(CARDS);
    expect(cardNames, 'FS3 card spec files').toHaveLength(31);
    for (const name of cardNames) expect(name, 'FS3 card file name').toMatch(/^l2-w0[1-7]-card-[a-z]+\.json$/);
    const cardIds = cardNames.map((name) => name.replace(/\.json$/, ''));
    for (const row of ROWS) expect(cardIds, `FS3 ${row.id} is not a card file`).not.toContain(row.id);
    expect(specNames(path.join(ROOT, 'docs/storytime/l2-unit1/no-such-folder')), 'FS3 missing folder').toEqual([]);
  });

  it('FS4 holds the field contract of every spec file', () => {
    for (const row of ROWS) {
      const item = loadSpec(row.id);
      expect(Object.keys(item).sort(), `${row.id} key set`).toEqual(SPEC_KEYS);
      expect(item.id, `${row.id} id`).toBe(row.id);
      expect(item.text, `${row.id} text`).toBe(row.text);
      expect(item.pageText, `${row.id} pageText`).toBe(row.text);
      expect(item.use, `${row.id} use`).toBe('card');
      expect(item.deliverAs, `${row.id} deliverAs`).toBe(`${row.id}-v1.png`);
      expect(item.aspect, `${row.id} aspect`).toBe('1:1');
      expect(item.printSize, `${row.id} printSize`).toEqual([1500, 1500]);
      expect(item.print, `${row.id} print`).toBe('crop');
      expect(item.outDir, `${row.id} outDir`).toBe(CARD_OUT);
      expect(item.outDir, `${row.id} outDir of CARD_RUN`).toBe(guards.CARD_RUN.outDir);
      expect(typeof item.goal, `${row.id} goal type`).toBe('string');
      expect(String(item.goal).trim().length, `${row.id} goal text`).toBeGreaterThan(0);
      expect(typeof item.colorPrompt, `${row.id} colorPrompt type`).toBe('string');
      expect(String(item.colorPrompt).trim().length, `${row.id} colorPrompt text`).toBeGreaterThan(0);
      expect(Array.isArray(item.mustShow), `${row.id} mustShow type`).toBe(true);
      const mustShow = item.mustShow as string[];
      expect(mustShow.length, `${row.id} mustShow length`).toBeGreaterThan(0);
      for (const phrase of mustShow) {
        expect(typeof phrase, `${row.id} mustShow item type`).toBe('string');
        expect(phrase.trim().length, `${row.id} mustShow item text`).toBeGreaterThan(0);
      }
      expect('linePrompt' in item, `${row.id} no linePrompt`).toBe(false);
    }
  });

  it('FS5 pins each reference set to an existing file in the repository', () => {
    const missing: string[] = [];
    for (const row of ROWS) {
      const item = loadSpec(row.id);
      const actual = Array.isArray(item.references) ? [...(item.references as string[])].sort() : [];
      expect(actual, `${row.id} references`).toEqual([...row.refs].sort());
      for (const ref of actual) {
        expect(path.isAbsolute(ref), `${ref} relative`).toBe(false);
        expect(ref.split(/[\\/]/), `${ref} no parent part`).not.toContain('..');
        const resolved = path.resolve(ROOT, ref);
        expect(resolved.startsWith(`${ROOT}${path.sep}`), `${ref} inside the repository`).toBe(true);
        if (!existsSync(resolved)) missing.push(ref);
      }
    }
    expect(missing, 'FS5 missing reference files').toEqual([]);
  });

  it('FS6 classifies every outDir as a card folder', () => {
    const unitRoot = path.join(os.tmpdir(), 'storytime-family-word-unit');
    for (const row of ROWS) {
      const item = loadSpec(row.id);
      expect(guards.classifyOutDir(item, unitRoot).kind, `${row.id} outDir class`).toBe('card');
    }
  });

  it('FS7 holds no forbidden word in any text field', () => {
    for (const text of ['pale skin flap', 'Skin tone', 'ethnic', 'skin-tone']) {
      expect(forbiddenHits({ text }), `FS7 seeded control ${text}`).not.toEqual([]);
    }
    for (const text of ['trace', 'embrace', 'bracelet', 'grace', 'racing']) {
      expect(forbiddenHits({ text }), `FS7 clear control ${text}`).toEqual([]);
    }
    for (const row of ROWS) {
      expect(forbiddenHits(loadSpec(row.id)), `FS7 ${row.id}`).toEqual([]);
    }
  });

  it('FS8 holds the prompt phrases of every spec file', () => {
    for (const row of ROWS) {
      const prompt = String(loadSpec(row.id).colorPrompt ?? '');
      for (const phrase of ['no text', 'no letters', 'pure white', 'rated G', 'margin']) {
        expect(has(prompt, phrase), `${row.id} ${phrase}`).toBe(true);
      }
      expect(has(prompt, 'plain light background'), `${row.id} plain light background`).toBe(false);
      if (row.kind === 'body-part') expect(has(prompt, 'exactly one'), `${row.id} exactly one`).toBe(true);
      if (row.kind === 'friend') expect(has(prompt, 'exactly two'), `${row.id} exactly two`).toBe(true);
      if (row.kind === 'friend' || row.kind === 'body-part') {
        expect(has(prompt, "Do not change anyone's hair or clothes"), `${row.id} hair and clothes`).toBe(true);
        expect(has(prompt, 'a tiny dark tick mark at the outer corner of an eye'), `${row.id} tick mark`).toBe(true);
        expect(has(prompt, "Do not change anyone's skin tone"), `${row.id} no skin tone`).toBe(false);
      }
    }
  });

  it('FS9 holds the cast clothes of each child', () => {
    const cast = JSON.parse(readFileSync(CAST, 'utf8')) as { cast: Array<{ name: string; note: string }> };
    const note = (name: string) => cast.cast.find((entry) => entry.name === name)?.note ?? '';
    for (const phrase of NAN_CLOTHES) expect(note('nan'), `FS9 cast note of nan holds ${phrase}`).toContain(phrase);
    for (const phrase of PAT_CLOTHES) expect(note('pat'), `FS9 cast note of pat holds ${phrase}`).toContain(phrase);
    for (const row of ROWS) {
      if (row.kind !== 'body-part' && row.kind !== 'friend') continue;
      const prompt = String(loadSpec(row.id).colorPrompt ?? '');
      const wanted =
        row.kind === 'friend'
          ? [...NAN_CLOTHES, ...PAT_CLOTHES, 'eyelash', 'no teddy bear', 'no bag']
          : row.child === 'nan'
            ? [...NAN_CLOTHES, 'eyelash']
            : [...PAT_CLOTHES, 'no teddy bear', 'no bag'];
      for (const phrase of wanted) expect(has(prompt, phrase), `${row.id} ${phrase}`).toBe(true);
    }
  });

  it('FS10 holds the pointing rule and the named part of every body-part row', () => {
    for (const row of ROWS.filter((item) => item.kind === 'body-part')) {
      const item = loadSpec(row.id);
      const prompt = String(item.colorPrompt ?? '');
      expect(has(prompt, 'index finger'), `${row.id} index finger`).toBe(true);
      expect(has(prompt, 'curled'), `${row.id} curled`).toBe(true);
      const part = PART_WORD[row.id] ?? '';
      expect(has(prompt, part), `${row.id} part word`).toBe(true);
      for (const phrase of PART_KEYWORDS[row.id] ?? []) {
        expect(has(prompt, phrase), `${row.id} ${phrase}`).toBe(true);
      }
      const mustShow = (item.mustShow as string[]).join(' ').toLowerCase();
      expect(mustShow, `${row.id} mustShow child`).toContain(row.child === 'nan' ? 'nan' : 'pat');
      expect(mustShow, `${row.id} mustShow part`).toContain(row.text);
    }
  });

  it('FS11 holds the subject word of every animal and object row', () => {
    for (const row of ROWS.filter((item) => item.kind === 'animal' || item.kind === 'object')) {
      const prompt = String(loadSpec(row.id).colorPrompt ?? '');
      expect(has(prompt, row.text), `${row.id} subject word`).toBe(true);
      for (const phrase of SUBJECT_KEYWORDS[row.id] ?? []) {
        expect(has(prompt, phrase), `${row.id} ${phrase}`).toBe(true);
      }
      if (GRAY_ROWS.includes(row.id)) {
        expect(has(prompt, 'ignore the gray background'), `${row.id} ignore the gray background`).toBe(true);
      }
    }
  });

  it('FS12 flags every seeded mutation and no good spec', () => {
    const row = ROWS.find((item) => item.id === 'l2-w05-card-eyes')!;
    const good: Record<string, any> = {
      id: row.id,
      text: row.text,
      pageText: row.text,
      use: 'card',
      goal: 'One picture of Nan that shows the word eyes.',
      mustShow: ['Nan', 'both eyes'],
      deliverAs: `${row.id}-v1.png`,
      references: [...row.refs],
      colorPrompt:
        'A square card picture on a plain pure white background: exactly one child, large in the middle of the square, with a wide empty white margin on every side. No text, no letters, no numbers, no logos. The picture is for young children and is rated G. The child wears an orange T-shirt and red shorts.',
      print: 'crop',
      aspect: '1:1',
      printSize: [1500, 1500],
      outDir: CARD_OUT,
    };
    expect(checkSpec(good, row), 'FS12 good spec').toEqual([]);
    const mutations: Array<{ label: string; spec: Record<string, any> }> = [
      { label: 'aspect', spec: { ...good, aspect: '4:3' } },
      { label: 'outDir', spec: { ...good, outDir: 'out/storytime/l2/unit1/w01/muse' } },
      { label: 'deliverAs', spec: { ...good, deliverAs: 'wrong.png' } },
      { label: 'references-missing', spec: { ...good, references: [...row.refs].slice(0, 1) } },
      { label: 'references-extra', spec: { ...good, references: [...row.refs, 'out/extra.png'] } },
      { label: 'goal', spec: { ...good, goal: ' ' } },
      { label: 'linePrompt', spec: { ...good, linePrompt: 'black outlines on pure white' } },
      { label: 'forbidden-word', spec: { ...good, colorPrompt: `${good.colorPrompt} Keep the skin tone.` } },
      { label: 'prompt-phrase', spec: { ...good, colorPrompt: good.colorPrompt.replace('No text', 'Nothing written') } },
      {
        label: 'child-clothes',
        spec: { ...good, colorPrompt: good.colorPrompt.replace('an orange T-shirt', 'a green T-shirt') },
      },
    ];
    for (const mutation of mutations) {
      expect(checkSpec(mutation.spec, row), `FS12 mutation ${mutation.label}`).toEqual([mutation.label]);
    }
  });

  it('FS13 holds no foreign path in this test file', () => {
    const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const homeNeedle = '/' + 'home' + '/';
    const tempNeedle = '/' + 'tmp' + '/';
    const workbookNeedle = 'Work' + 'books/';
    for (const needle of [homeNeedle, tempNeedle, workbookNeedle]) {
      expect(source, `FS13 needle ${needle}`).not.toContain(needle);
    }
    const seeded = `path: ${homeNeedle}fixture`;
    expect([homeNeedle, tempNeedle, workbookNeedle].some((needle) => seeded.includes(needle))).toBe(true);
  });
});
