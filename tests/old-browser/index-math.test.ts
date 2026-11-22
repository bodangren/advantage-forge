/** Red pin for track old_browser_builtins_20261122 (T2): the index helper contract.
 *
 * Cases 1 and 2 import `../../src/apk3d/sim/index-math.js` inside the case, so each fails inside
 * the case while the module is absent. Case 3 reads the nine call-site files as text and imports
 * no view module; it fails naming the nine lines while the old calls are still in place.
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

const ARRAY_AT = /(?<!this)\.at\(\s*[^(),]*?(,\s*)?\)/;
const FIND_LAST_INDEX = /\.findLastIndex\(/;

const SITES: Array<{ file: string; line: number; helper: string; oldCall: string }> = [
  { file: 'src/games/dragon-flight/view2d/game.ts', line: 565, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/games/dragon-rider/view2d/game.ts', line: 591, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/games/spellweavers-run/view/game.ts', line: 216, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/games/spellweavers-run/view2d/game.ts', line: 311, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/games/spellweavers-run/view2d/game.ts', line: 429, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/storytime/book-pictures.ts', line: 2269, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/storytime/book-pictures.ts', line: 3935, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/storytime/book-pictures.ts', line: 4558, helper: 'atIndex', oldCall: '.at(' },
  { file: 'src/host/reader.ts', line: 197, helper: 'lastIndexWhere', oldCall: '.findLastIndex(' },
];

it('the nine call sites hold a helper call and no array .at( or .findLastIndex(', () => {
  expect(SITES).toHaveLength(9);
  const failures: string[] = [];
  for (const site of SITES) {
    const text = readFileSync(join(ROOT, site.file), 'utf8');
    const hasHelper = text.includes(`${site.helper}(`);
    const hasOld = site.oldCall === '.at(' ? ARRAY_AT.test(text) : FIND_LAST_INDEX.test(text);
    if (!hasHelper) failures.push(`${site.file}:${site.line}: missing ${site.helper}( call`);
    if (hasOld) failures.push(`${site.file}:${site.line}: still calls ${site.oldCall}`);
  }
  expect(failures).toEqual([]);
});
