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

  it('FR-6: every reuse row names a source that exists', () => {
    for (const { row } of specs) {
      if (!row.reuse) continue;
      expect(existsSync(resolve(REPO, row.reuse.source)), `${row.id}: ${row.reuse.source}`).toBe(true);
    }
  });
});
