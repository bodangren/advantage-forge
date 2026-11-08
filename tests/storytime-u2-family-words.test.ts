// Tests for the Storytime Level 2 unit 2 app family words (D6, 2026-11-09).
//
// The 18 app family-word pictures are the family-word card set of unit 2. The specs live in
// docs/storytime/l2-unit2/family-words/. The tests cover:
//   - the 18 ids and their weeks, and the folder holds no other spec;
//   - the card form: the outDir, the print pad, the 1500 x 1500 size, and the delivered name;
//   - the text rule: no skin, race, or ethnicity word in any text field;
//   - the references: at most 10 per spec, and every reference file exists;
//   - the jump word: Sam, and both feet off the ground;
//   - the object rule: the app object is the object of the unit 2 spec that draws the word.
//
// Every test reads local files. No test makes a provider call.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
