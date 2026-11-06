import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as bookPictures from '../src/storytime/book-pictures.js';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIST = path.join(ROOT, 'tests/fixtures/storytime/pictures-v7.json');
const SPECS = path.join(ROOT, 'docs/storytime/l2-unit1/cards');
const LIST_SHA = 'ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf';
const CARD_OUT = 'out/storytime/l2/unit1/cards/muse';
const EXPECTED = [
  'l2-w01-card-hello', 'l2-w01-card-goodbye', 'l2-w01-card-boy', 'l2-w01-card-girl', 'l2-w01-card-teacher',
  'l2-w02-card-fan', 'l2-w02-card-astronaut', 'l2-w03-card-sheep', 'l2-w03-card-cap', 'l2-w03-card-pineapple',
  'l2-w04-card-jam', 'l2-w04-card-ham', 'l2-w04-card-mom', 'l2-w04-card-dad', 'l2-w04-card-brother',
  'l2-w04-card-sister', 'l2-w04-card-grandma', 'l2-w04-card-grandpa', 'l2-w04-card-family',
  'l2-w05-card-dress', 'l2-w05-card-sad', 'l2-w05-card-sandwich', 'l2-w06-card-boat', 'l2-w06-card-tomato',
  'l2-w07-card-pot', 'l2-w07-card-mop', 'l2-w07-card-otter', 'l2-w07-card-doll', 'l2-w07-card-car',
  'l2-w07-card-train', 'l2-w07-card-teddy',
];
const REF = 'out/storytime/l2/unit1/w04/muse/elements/';
const refs: Record<string, string[]> = {
  'l2-w01-card-hello': ['out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png', 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-face-crop.png'],
  'l2-w01-card-goodbye': ['out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png', 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-face-crop.png'],
  'l2-w01-card-girl': ['out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png', 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-face-crop.png'],
  'l2-w01-card-boy': ['out/storytime-review/batch-22/sprout-pat-render.png'],
  'l2-w05-card-sad': ['out/storytime/l2/unit1/w01/muse/elements/ben-ref-clean-2.png'],
  'l2-w01-card-teacher': ['out/storytime/l2/unit1/w01/muse/elements/cast-group-b-2.png'],
  'l2-w04-card-mom': [`${REF}cast-mom-sheet-m1-color.png`],
  'l2-w04-card-dad': [`${REF}cast-dad-sheet-m1-color.png`],
  'l2-w04-card-grandma': [`${REF}cast-grandma-sheet-m2-color.png`],
  'l2-w04-card-grandpa': [`${REF}cast-grandpa-sheet-m2-color.png`],
  'l2-w04-card-brother': [`${REF}cast-tom-sheet-m3-color.png`],
  'l2-w04-card-sister': [`${REF}cast-lily-sheet-m1-color.png`],
  'l2-w04-card-family': [`${REF}cast-mom-sheet-m1-color.png`, `${REF}cast-dad-sheet-m1-color.png`, `${REF}cast-grandma-sheet-m2-color.png`, `${REF}cast-grandpa-sheet-m2-color.png`, `${REF}cast-tom-sheet-m3-color.png`, `${REF}cast-lily-sheet-m1-color.png`],
  'l2-w07-card-doll': [`${REF}prop-doll-pam-sheet-m1-color.png`],
  'l2-w07-card-train': ['out/storytime/l2/unit1/w07/muse/elements/prop-toys-sheet-m1-color.png'],
  'l2-w07-card-teddy': ['out/storytime-review/batch-22/sprout-pat-render.png'],
};
const idsWithRefs = new Set(Object.keys(refs));
const withoutRefs = EXPECTED.filter((id) => !idsWithRefs.has(id));
const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');
const rows = () => JSON.parse(readFileSync(LIST, 'utf8')) as Array<Record<string, any>>;
const spec = (id: string) => existsSync(path.join(SPECS, `${id}.json`))
  ? JSON.parse(readFileSync(path.join(SPECS, `${id}.json`), 'utf8')) as Record<string, any>
  : {};
const checkSpec = (item: Record<string, any>, row: Record<string, any>) => {
  const errors: string[] = [];
  if (item.id !== row.id || item.text !== row.text || item.pageText !== row.text) errors.push('row identity/text');
  if (item.use !== 'card' || item.deliverAs !== row.fileName) errors.push('use/deliverAs');
  if (JSON.stringify(item.printSize) !== JSON.stringify([1500, 1500]) || item.printSize[0] !== row.width || item.printSize[1] !== row.height) errors.push('print size');
  if (item.aspect !== '1:1' || item.outDir !== (guards.CARD_RUN?.outDir ?? CARD_OUT) || !['crop', 'pad'].includes(item.print)) errors.push('print contract');
  if (![item.goal, item.colorPrompt, item.linePrompt].every((value) => typeof value === 'string' && value.trim())) errors.push('required prompt');
  if (!Array.isArray(item.mustShow) || !item.mustShow.length || item.mustShow.some((value: unknown) => typeof value !== 'string' || !value.trim())) errors.push('mustShow');
  if (JSON.stringify([...(item.references ?? [])].sort()) !== JSON.stringify([...(refs[row.id] ?? [])].sort())) errors.push('references');
  return errors;
};

describe('storytime card specs (CS)', () => {
  it('CS1 verifies the v7 fixture SHA before using its rows', () => {
    const bytes = readFileSync(LIST);
    expect(sha(bytes)).toBe(LIST_SHA);
  });

  it('CS2 pins the list rows and labeled card categories', () => {
    const list = rows();
    const cards = list.filter((row) => row.use === 'card');
    expect(list, 'CS2 total picture-list rows').toHaveLength(227);
    expect(cards, 'CS2 card rows').toHaveLength(31);
    expect(cards.map((row) => row.id).sort()).toEqual([...EXPECTED].sort());
    const personCards = ['l2-w01-card-hello', 'l2-w01-card-goodbye', 'l2-w01-card-boy', 'l2-w01-card-girl', 'l2-w01-card-teacher', 'l2-w05-card-sad', 'l2-w04-card-mom', 'l2-w04-card-dad', 'l2-w04-card-brother', 'l2-w04-card-sister', 'l2-w04-card-grandma', 'l2-w04-card-grandpa', 'l2-w04-card-family'];
    expect(personCards.filter((id) => idsWithRefs.has(id)), 'CS2 person cards').toHaveLength(13);
    expect(['l2-w07-card-doll', 'l2-w07-card-train', 'l2-w07-card-teddy'].filter((id) => idsWithRefs.has(id)), 'CS2 referenced prop cards').toHaveLength(3);
    expect(withoutRefs, 'CS2 cards without references').toHaveLength(15);
  });

  it('CS3 has exactly the expected spec file names', () => {
    const names = existsSync(SPECS) ? readdirSync(SPECS).filter((name) => name.endsWith('.json')).sort() : [];
    expect(names).toEqual(EXPECTED.map((id) => `${id}.json`).sort());
  });

  it('CS4 matches every spec field to its list row and card contract', () => {
    const byId = new Map(rows().map((row) => [row.id, row]));
    for (const id of EXPECTED) {
      const item = spec(id);
      const row = byId.get(id)!;
      expect(checkSpec(item, row), id).toEqual([]);
    }
  });

  it('CS5 uses the card-specific white background and no-text prompts', () => {
    for (const id of EXPECTED) {
      const item = spec(id);
      expect((item.colorPrompt ?? '').toLowerCase()).toContain('white');
      expect((item.colorPrompt ?? '').toLowerCase()).toMatch(/no (letters|text|words)/);
      expect((item.colorPrompt ?? '').toLowerCase()).not.toContain('plain light background');
      expect((item.linePrompt ?? '').toLowerCase()).toContain('pure white');
    }
  });

  it('CS6 pins each card reference set to an existing in-repository file', () => {
    for (const id of EXPECTED) {
      const item = spec(id);
      const actual = Array.isArray(item.references) ? [...item.references].sort() : [];
      expect(actual, `${id} references`).toEqual([...(refs[id] ?? [])].sort());
      for (const ref of actual) {
        expect(path.isAbsolute(ref), ref).toBe(false);
        expect(ref.split(/[\\/]/)).not.toContain('..');
        const resolved = path.resolve(ROOT, ref);
        expect(resolved.startsWith(`${ROOT}${path.sep}`), ref).toBe(true);
        expect(existsSync(resolved), `missing reference ${ref}`).toBe(true);
      }
    }
    expect(refs['l2-w04-card-family']).toHaveLength(6);
  });

  it('CS7 records the cast and object differences from the list prompts', () => {
    for (const id of ['l2-w01-card-hello', 'l2-w01-card-goodbye', 'l2-w01-card-girl']) {
      expect((spec(id).colorPrompt ?? '').toLowerCase()).toContain('bun');
      expect((spec(id).colorPrompt ?? '').toLowerCase()).not.toContain('bunch');
    }
    expect((spec('l2-w07-card-teddy').colorPrompt ?? '').toLowerCase()).toContain('brown');
    expect((spec('l2-w07-card-car').colorPrompt ?? '').toLowerCase()).toContain('red');
  });

  it('CS8 loads the repository list fixture and plans all 31 card rows', () => {
    const temp = mkdtempSync(path.join(os.tmpdir(), 'storytime-card-list-'));
    try {
      const printRoot = path.join(temp, 'print');
      mkdirSync(printRoot);
      cpSync(LIST, path.join(printRoot, 'pictures.json'));
      const list = bookPictures.loadPictureList({ printRoot, workbooksRoot: temp, expectedSha256: LIST_SHA });
      const cards = list.rows.filter((row: any) => row.use === 'card');
      expect(list.rows, 'CS8 loaded list rows').toHaveLength(227);
      expect(cards, 'CS8 planned card rows').toHaveLength(31);
      for (const row of cards) {
        const plan = bookPictures.planPictureRow(row as any);
        expect(plan).toEqual({ colorFile: row.fileName, lineArtFile: row.lineArtFileName, width: 1500, height: 1500 });
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });

  it('CS9 flags all six seeded spec mutations', () => {
    const row = rows().find((item) => item.id === 'l2-w04-card-mom')!;
    const original = { id: row.id, text: row.text, pageText: row.text, use: 'card', deliverAs: row.fileName, printSize: [1500, 1500], aspect: '1:1', outDir: CARD_OUT, print: 'crop', goal: 'one mother', colorPrompt: 'one woman on pure white background, no text', linePrompt: 'black outlines on pure white', mustShow: ['one mother'], references: refs[row.id] };
    const mutations = [
      { ...original, aspect: '4:3' },
      { ...original, outDir: 'out/elsewhere' },
      { ...original, deliverAs: 'wrong.png' },
      { ...original, references: [] },
      { ...original, references: [...(original.references ?? []), 'extra.png'] },
      { ...original, goal: ' ' },
    ];
    for (const mutated of mutations) expect(checkSpec(mutated, row).length).toBeGreaterThan(0);
    expect(checkSpec(original, row)).toEqual([]);
  });

  it('CS10 has no external path literals and catches a seeded path', () => {
    const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const homeNeedle = '/' + 'home' + '/';
    const tempNeedle = '/' + 'tmp' + '/';
    const workbookNeedle = 'Work' + 'books/';
    for (const needle of [homeNeedle, tempNeedle, workbookNeedle]) expect(source).not.toContain(needle);
    const seeded = `path: ${homeNeedle}fixture`;
    expect([homeNeedle, tempNeedle, workbookNeedle].some((needle) => seeded.includes(needle))).toBe(true);
  });
});
