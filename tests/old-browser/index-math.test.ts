/** Remediation for review r1 A-F3: the site check requires the exact helper call at each of
 * the nine distinct sites. Cases 1 and 2 import `../../src/apk3d/sim/index-math.js` inside the
 * case. Case 3 reads the nine call-site files as text and imports no view module.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

it('atIndex returns the same value as Array.prototype.at for every argument shape', async () => {
  const { atIndex } = (await import('../../src/apk3d/sim/index-math.js')) as unknown as {
    atIndex: <T>(list: readonly T[], index: number) => T | undefined;
  };
  const list = ['a', 'b', 'c'];
  const indices = [0, 1, 2, -1, -2, -3, -4, 3, -0, 0.5, 1.5, -1.5, NaN, Infinity, -Infinity];
  for (const index of indices) {
    expect(atIndex(list, index), `index ${String(index)}`).toBe(list.at(index));
    expect(atIndex([], index), `empty index ${String(index)}`).toBe([].at(index));
  }
});

it('lastIndexWhere returns the same index as Array.prototype.findLastIndex', async () => {
  const { lastIndexWhere } = (await import('../../src/apk3d/sim/index-math.js')) as unknown as {
    lastIndexWhere: <T>(list: readonly T[], predicate: (value: T, index: number) => boolean) => number;
  };
  const rows: Array<{ name: string; list: number[]; predicate: (value: number) => boolean }> = [
    { name: 'no match', list: [1, 2, 3], predicate: (value) => value > 5 },
    { name: 'one match', list: [1, 2, 3], predicate: (value) => value === 2 },
    { name: 'several matches', list: [1, 2, 2, 3, 2], predicate: (value) => value === 2 },
    { name: 'match at index 0', list: [7, 1, 2], predicate: (value) => value === 7 },
    { name: 'empty list', list: [], predicate: () => true },
  ];
  for (const row of rows) {
    expect(lastIndexWhere(row.list, row.predicate), row.name).toBe(row.list.findLastIndex(row.predicate));
  }
  expect(lastIndexWhere([1, 2, 3], (value) => value > 5)).toBe(-1);
});

const ARRAY_AT = /(?<!\bthis)\.at\(\s*(?:[^(),]|\((?:[^()]|\([^()]*\))*\))*(,\s*)?\)/;
const FIND_LAST_INDEX = /\.findLastIndex\(/;

type Site = { file: string; line: number; expect: string; oldCall: string };

const SITES: Site[] = [
  {
    file: 'src/games/dragon-flight/view2d/game.ts',
    line: 565,
    expect: 'atIndex([...gates.values()], -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/games/dragon-rider/view2d/game.ts',
    line: 591,
    expect: 'atIndex([...gates.values()], -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/games/spellweavers-run/view/game.ts',
    line: 216,
    expect: 'atIndex([...rows.values()], -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/games/spellweavers-run/view2d/game.ts',
    line: 311,
    expect: 'atIndex([...rows.values()], -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/games/spellweavers-run/view2d/game.ts',
    line: 429,
    expect: 'atIndex([...rows.values()], -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/storytime/book-pictures.ts',
    line: 2269,
    expect: 'atIndex(job.candidates, -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/storytime/book-pictures.ts',
    line: 3935,
    expect: 'atIndex(existingVersions, -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/storytime/book-pictures.ts',
    line: 4558,
    expect: 'atIndex(candidates, -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/host/reader.ts',
    line: 197,
    expect: 'lastIndexWhere(audio.sentences, (s) => s.paragraph >= from && s.paragraph <= to)',
    oldCall: '.findLastIndex(',
  },
];

/** Checks every site against the given file texts; a missing or replaced helper fails. */
function checkSites(getText: (file: string) => string): string[] {
  const failures: string[] = [];
  const byFile = new Map<string, Site[]>();
  for (const site of SITES) {
    const group = byFile.get(site.file) ?? [];
    group.push(site);
    byFile.set(site.file, group);
  }
  for (const [file, sites] of byFile) {
    const text = getText(file);
    const need = new Map<string, number>();
    for (const site of sites) need.set(site.expect, (need.get(site.expect) ?? 0) + 1);
    for (const site of sites) {
      const found = text.split(site.expect).length - 1;
      if (found < (need.get(site.expect) ?? 0)) {
        failures.push(`${site.file}:${site.line}: missing expected ${site.expect}`);
      }
    }
    if (ARRAY_AT.test(text)) failures.push(`${file}: still calls .at(`);
    if (FIND_LAST_INDEX.test(text)) failures.push(`${file}: still calls .findLastIndex(`);
  }
  return failures;
}

it('the nine call sites hold their expected helper call and no array .at( or .findLastIndex(', () => {
  expect(SITES).toHaveLength(9);
  const failures = checkSites((file) => readFileSync(join(ROOT, file), 'utf8'));
  expect(failures).toEqual([]);
});

it('the site check fails when one site loses its helper (review r1 A-F3 breakage proof)', () => {
  const texts = new Map<string, string>();
  for (const site of SITES) {
    if (!texts.has(site.file)) texts.set(site.file, readFileSync(join(ROOT, site.file), 'utf8'));
  }
  const broken: string[] = [];
  SITES.forEach((site, index) => {
    const copies = new Map(texts);
    const oldCall = site.oldCall === '.at(' ? 'BROKEN.at(-1)' : 'BROKEN.findLastIndex((s) => true)';
    copies.set(site.file, copies.get(site.file)!.replace(site.expect, oldCall));
    const failures = checkSites((file) => copies.get(file)!);
    if (!failures.some((failure) => failure.startsWith(`${site.file}:${site.line}`))) {
      broken.push(`site ${index} (${site.file}:${site.line}) stays green without its helper`);
    }
  });
  expect(broken).toEqual([]);
});
