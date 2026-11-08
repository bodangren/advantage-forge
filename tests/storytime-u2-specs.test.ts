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
        .filter((e: any) => e.source === 'new' || e.source === 'new-prop')
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

  it('REF10: every row and element spec holds at most 10 references', () => {
    for (const { spec } of specs) {
      expect(spec.references.length, spec.id).toBeLessThanOrEqual(10);
    }
    for (const el of Object.values(elements.elements as Record<string, any>)) {
      if (!el.spec) continue;
      const elSpec = read(el.spec);
      expect(elSpec.references.length, elSpec.id).toBeLessThanOrEqual(10);
    }
  });

  it('REF10-group: a row that uses the group sheet has no separate pat, may, sam, or mia render', () => {
    const groupPath = 'out/storytime/l2/unit1/w01/muse/elements/cast-group-a-2.png';
    const fourSources = ['pat', 'may', 'sam', 'mia'].map((k) => elements.castPeople[k].source);
    const grouped = specs.filter(({ spec }: any) => spec.references.includes(groupPath));
    expect(grouped.map(({ spec }: any) => spec.id).sort()).toEqual([
      'l2-w09-cover-yum',
      'l2-w10-story-page-put-on-your-hat-pip',
      'l2-w11-cover-where-is-pip',
      'l2-w12-cover-open-your-book',
      'l2-w13-story-page-pip-can-catch',
      'l2-w15-cover-look-a-bus',
      'l2-w15-story-page-look-pip-on-a-bike',
    ].sort());
    for (const { spec } of grouped) {
      for (const source of fourSources) expect(spec.references, `${spec.id}: ${source}`).not.toContain(source);
      expect(spec.colorPrompt, spec.id).toContain(
        'shows four approved 3D children side by side, left to right: Pat, May, Sam, and Mia',
      );
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


  it('F1: the line prompt follows the kind of the word', () => {
    const faceWords = ['dog', 'cat', 'fish', 'duck', 'elephant', 'horse', 'goat', 'doll', 'prop-hen'];
    for (const { row, spec } of specs) {
      if (row.use !== 'check-row') continue;
      expect(spec.linePrompt, spec.id).not.toContain('The bus body, the wheels, and each window');
      const isPerson = ['dad', 'girl', 'foot'].includes(String(row.text));
      const isFace = (row.props || []).some((id: string) => faceWords.includes(id));
      if (isPerson || isFace) {
        expect(spec.linePrompt, spec.id).not.toContain('no eyes and no face');
        expect(spec.linePrompt, spec.id).toContain('solid black pupil');
      }
    }
  });

  it('F2: the hen uses its own sheet, and a one-view render is not called "three times"', () => {
    for (const { row, spec } of specs) {
      if (!(row.props || []).includes('prop-hen')) continue;
      expect(spec.references, spec.id).toContain('out/storytime/l2/unit2/w12/muse/elements/prop-hen-sheet-m1-color.png');
      expect(spec.references.some((r: string) => r.startsWith('out/chicken/')), spec.id).toBe(false);
    }
    for (const { row, spec } of specs) {
      for (const ref of spec.references) {
        if (!ref.includes('/views/')) continue;
        const sentence = spec.colorPrompt.split('Picture ').find((x: string) => x.includes('3D render')) || '';
        expect(/three times|three views/.test(sentence), `${spec.id}: ${ref}`).toBe(false);
      }
    }
  });

  it('F4: a card line prompt names no other cast member, and an outdoor page says "in the place"', () => {
    for (const { row, spec } of specs) {
      if (row.use !== 'card') continue;
      expect(/Pat's hair|cargo-shorts|sandal/.test(spec.linePrompt), spec.id).toBe(false);
    }
    for (const { row, spec } of specs) {
      if (!/playground|farmyard|garden|street/.test(String(row.set))) continue;
      expect(/in the room/.test(spec.colorPrompt), spec.id).toBe(false);
    }
  });


  it('F1-r6: no face word says "no eyes and no face" in either prompt', () => {
    const face = ['dog', 'cat', 'fish', 'duck', 'elephant', 'horse', 'goat', 'doll', 'hen', 'dad', 'girl', 'foot'];
    for (const { row, spec } of specs) {
      if (row.use !== 'check-row' || !face.includes(String(row.text))) continue;
      expect(spec.colorPrompt, spec.id).not.toContain('no eyes and no face');
      expect(spec.linePrompt, spec.id).not.toContain('no eyes and no face');
      expect(spec.linePrompt, spec.id).toContain('solid black pupil');
    }
  });

  it('F8: a duck, a doll, and a fish line prompt names no ears, and the elephant names the trunk', () => {
    const noEars = ['duck', 'doll', 'fish'];
    const seen = new Set<string>();
    for (const { row, spec } of specs) {
      if (row.use !== 'check-row') continue;
      const word = String(row.text).toLowerCase();
      if (!noEars.includes(word)) continue;
      seen.add(word);
      expect(spec.linePrompt, spec.id).not.toMatch(/\bear[s]?\b/i);
    }
    expect([...seen].sort()).toEqual(['doll', 'duck', 'fish']);

    const elephants = specs.filter(({ row }: any) => row.use === 'check-row' && String(row.text).toLowerCase() === 'elephant');
    expect(elephants.length).toBeGreaterThan(0);
    for (const { spec } of elephants) {
      expect(spec.linePrompt, spec.id).toContain('trunk');
      expect(spec.linePrompt, spec.id).toContain('big round ears');
    }

    // The hen has no class C row in unit 2, so the check reads its sentence from the spec maker.
    const source = readFileSync(resolve(REPO, 'scripts/storytime-u2-specs.mjs'), 'utf8');
    const hen = /hen: '([^']+)'/.exec(source)?.[1] ?? '';
    expect(hen).not.toMatch(/\bear[s]?\b/i);
    expect(hen).toContain('comb');
  });

  it('F6: every unit 2 reference is the output of an element spec, named from its id', () => {
    const outputs = new Map<string, string>();
    for (const el of Object.values(elements.elements as Record<string, any>)) {
      if (el.source !== 'new' && el.source !== 'new-prop') continue;
      const spec = read(el.spec);
      const out = `${spec.outDir}/${spec.id}-m1-color.png`;
      expect(out, el.id).toBe(el.path);
      outputs.set(out, el.id);
    }
    expect(outputs.size).toBe(10);
    for (const { spec } of specs) {
      for (const ref of spec.references) {
        if (ref.startsWith('out/storytime/l2/unit2/')) expect(outputs.has(ref), `${spec.id}: ${ref}`).toBe(true);
      }
    }
  });

  it('FR-6: every reuse row names a source that exists', () => {
    for (const { row } of specs) {
      if (!row.reuse) continue;
      expect(existsSync(resolve(REPO, row.reuse.source)), `${row.id}: ${row.reuse.source}`).toBe(true);
    }
  });

  it('D2: the ten row is new in week 10 and week 11 reuses it', () => {
    const reuse = specs.filter((x: any) => x.spec.reuse);
    const kinds = reuse.map((x: any) => x.spec.reuse.kind);
    expect(reuse).toHaveLength(47);
    expect(kinds.filter((k: string) => k === 'unit1-delivery')).toHaveLength(45);
    expect(kinds.filter((k: string) => k === 'unit2-earlier-row')).toHaveLength(2);
    expect(specs.length - reuse.length).toBe(182);

    const w10 = specs.find((x: any) => x.row.id === 'l2-w10-check-row-ten')!;
    expect(w10.spec.reuse).toBeNull();
    const w11 = specs.find((x: any) => x.row.id === 'l2-w11-check-row-ten')!;
    expect(w11.spec.reuse).toEqual({
      word: 'ten',
      source: 'docs/storytime/l2-unit2/w10/muse/l2-w10-check-row-ten.json',
      kind: 'unit2-earlier-row',
    });

    // The named rule cites the PM decision and the excluded line file.
    const source = readFileSync(resolve(REPO, 'scripts/storytime-u2-specs.mjs'), 'utf8');
    expect(source).toContain('l2-w06-check-row-ten-line-v2.png');
    expect(source).toContain('PM, 2026-11-08');

    // The row model holds the same values, so the delivery writer reads the corrected rows.
    const rowsDoc = read('docs/storytime/l2-unit2/rows.json');
    expect(rowsDoc.rows.filter((r: any) => r.reuse)).toHaveLength(47);
    expect(rowsDoc.rows.filter((r: any) => !r.reuse)).toHaveLength(182);
  });
});
