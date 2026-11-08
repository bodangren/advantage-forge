// FR-2 to FR-4 of asset_storytime_l2_unit2_prep_20261108.
// Run: ./node_modules/.bin/vitest run tests/storytime-u2-specs.test.ts --maxWorkers=1
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = process.cwd();
const read = (p: string) => JSON.parse(readFileSync(resolve(REPO, p), 'utf8'));

const pictures = read('/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json');
const elements = read('docs/storytime/l2-unit2/elements.json');
const rows = read('docs/storytime/l2-unit2/rows.json').rows;
const specPath = (week: number, id: string) =>
  `docs/storytime/l2-unit2/w${String(week).padStart(2, '0')}/muse/${id}.json`;
const specs = rows.map((r: any) => ({ row: r, spec: read(specPath(r.week, r.id)) }));

const FORBIDDEN = [
  'skin color', 'skin colour', 'skin tone', 'complexion', 'ethnic', 'ethnicity', 'race', 'racial',
];

describe('unit 2 Muse specs', () => {
  it('FR-2: has 229 specs, in list order, with the class rules', () => {
    expect(specs).toHaveLength(229);
    expect(specs.map((s: any) => s.spec.id)).toEqual(pictures.map((p: any) => p.id));
    for (const { row, spec } of specs) {
      if (row.sizeClass === 'C') {
        expect(spec.aspect).toBe('1:1');
        expect(spec.printSize).toEqual([1500, 1500]);
      } else {
        expect(['4:3']).toContain(spec.aspect);
      }
      expect(spec.print).toBe('crop');
      expect(spec.outDir.startsWith('out/storytime/l2/unit2/')).toBe(true);
    }
  });

  it('FR-3: every reference exists, or is the output of a drafted element spec', () => {
    const elementOutputs = new Set(
      Object.values(elements.elements as Record<string, any>)
        .filter((e: any) => e.source === 'new')
        .map((e: any) => e.path),
    );
    for (const { spec } of specs) {
      expect(Array.isArray(spec.references)).toBe(true);
      for (const ref of spec.references) {
        const ok = existsSync(resolve(REPO, ref)) || elementOutputs.has(ref);
        expect(ok, `${spec.id} -> ${ref}`).toBe(true);
      }
    }
  });

  it('FR-4: no forbidden word, and every colorPrompt says no text', () => {
    for (const { spec } of specs) {
      const all = `${spec.colorPrompt}\n${spec.linePrompt}`.toLowerCase();
      for (const word of FORBIDDEN) expect(all.includes(word), `${spec.id}: ${word}`).toBe(false);
      expect(/no text, no letters, no numbers/i.test(spec.colorPrompt), spec.id).toBe(true);
    }
  });


  it('R1: a possessive place name is not a cast mention', () => {
    const expected: Record<string, string[]> = {
      'l2-w09-cover-dad-and-the-mop': ['dad', 'pip'],
      'l2-w09-story-page-dad-has-a-mop': ['dad'],
      'l2-w12-cover-the-hen-and-the-hat': ['dad'],
      'l2-w12-story-page-dad-has-a-hat': ['dad'],
      'l2-w14-cover-on-goes-the-fan': ['mom', 'dad', 'pip'],
      'l2-w14-story-page-dad-is-hot': ['dad'],
      'l2-w15-cover-the-tag': ['pip'],
      'l2-w15-story-page-pip-has-a-tag': ['pip'],
    };
    for (const [id, cast] of Object.entries(expected)) {
      const row = specs.find((x: any) => x.row.id === id)!.row;
      expect(row.cast, id).toEqual(cast);
    }
  });

  it('R2: a row with the Tom living room set leaves out the table and the pot', () => {
    const tom = specs.filter((x: any) => x.row.set === 'set-tom-living-room');
    expect(tom.length).toBeGreaterThan(0);
    for (const { spec } of tom) {
      expect(spec.colorPrompt, spec.id).toContain(
        'The set picture also shows a low wooden table with a big silver pot in the right foreground: leave out the table and the pot; that part of the floor is clear.',
      );
      expect(spec.colorPrompt, spec.id).not.toContain('ONE big silver pot with a lid in the right foreground');
    }
  });

  it('R3: no "empty empty", and an outdoor set says "keep the same place"', () => {
    for (const { spec } of specs) {
      expect(spec.colorPrompt, spec.id).not.toContain('empty empty');
      if (/playground|farmyard|garden|street/.test(String(spec.set))) {
        expect(spec.colorPrompt, spec.id).toContain('keep the same place');
      }
    }
  });

  it('R4: a spec with no reference has no "picture 1"', () => {
    for (const { spec } of specs) {
      if (spec.references.length) continue;
      expect(/picture 1/i.test(spec.colorPrompt), spec.id).toBe(false);
    }
  });

  it('R5: no check-row of dad, girl, or foot says "no eyes and no face"', () => {
    for (const { row, spec } of specs) {
      if (row.use !== 'check-row') continue;
      if (!['dad', 'girl', 'foot'].includes(String(row.text))) continue;
      expect(spec.colorPrompt, spec.id).not.toContain('The object has no eyes and no face');
    }
  });

  it('R6: the keep line of a card names a cast person, not the card word', () => {
    for (const { row, spec } of specs) {
      if (row.use !== 'card' && row.use !== 'd4-prompt') continue;
      const m = spec.colorPrompt.match(/Keep ([A-Z][a-z]+) exactly as in the picture/);
      if (!m) continue;
      const person = m[1].toLowerCase();
      expect(row.text.toLowerCase(), spec.id).not.toBe(person);
    }
  });


  it('R9: an adult person-form row keeps the adult proportions, not the chibi sentence', () => {
    const adults = ['dad', 'mom', 'grandma', 'grandpa', 'teacher-kim', 'nans-dad'];
    for (const { row, spec } of specs) {
      if (row.form !== 'person-card') continue;
      if (!row.cast.some((k: string) => adults.includes(k))) continue;
      expect(spec.colorPrompt, spec.id).not.toContain('chibi proportions of a five-year-old');
      expect(spec.colorPrompt, spec.id).toMatch(/keeps the adult proportions of (his|her) picture/);
    }
  });

  it('FR-6: every reuse row names a source that exists', () => {
    for (const { row } of specs) {
      if (!row.reuse) continue;
      expect(existsSync(resolve(REPO, row.reuse.source)), `${row.id}: ${row.reuse.source}`).toBe(true);
    }
  });
});
