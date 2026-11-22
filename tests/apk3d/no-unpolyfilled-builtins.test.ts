import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

// Vite leaves these ES2022+ built-ins unpolyfilled, so they throw on the older supported
// browsers (iOS 15.0-15.3, Chrome WebView 80-92). The scan fails naming file and line.
// Scope (PM 2026-11-22): the AudioBus files only. The hits outside audio went to TD-45
// and track old_browser_builtins_20261122, which widens this root back to src/.
const SCAN_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'apk3d', 'audio');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.ts') && !name.endsWith('.gen.ts')) out.push(full);
  }
  return out;
}

function strip(code: string): string {
  // Strip block comments, line comments, template literals, and quoted strings.
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

const PATTERNS: Array<[string, RegExp]> = [
  ['Object.hasOwn', /Object\.hasOwn\(/g],
  ['structuredClone', /structuredClone\(/g],
  ['.findLast(', /\.findLast\(/g],
  ['.findLastIndex(', /\.findLastIndex\(/g],
  ['.toSorted(', /\.toSorted\(/g],
  ['.toReversed(', /\.toReversed\(/g],
  ['.toSpliced(', /\.toSpliced\(/g],
  ['Object.groupBy', /Object\.groupBy\(/g],
  ['Map.groupBy', /Map\.groupBy\(/g],
  ['Promise.withResolvers', /Promise\.withResolvers\(/g],
  ['Array.fromAsync', /Array\.fromAsync\(/g],
  // Array/String.prototype.at takes exactly one argument, so a multi-argument custom call
  // such as arena.at(x, y, z) never matches. this.at( is the Board/Board2d tile lookup, not
  // Array.prototype.at. A custom single-argument .at on another receiver would still match:
  // no such call exists under the scan root today (checked 2026-11-22).
  ['.at( single-arg, not this.at', /(?<!this)\.at\(([^(),]*)\)/g],
  // z.union( is a zod schema combinator, not Set.prototype.union.
  ['Set .union(', /(?<!z)\.union\(/g],
  ['Set .intersection(', /\.intersection\(/g],
  ['Set .difference(', /\.difference\(/g],
  ['Set .symmetricDifference(', /\.symmetricDifference\(/g],
  ['Set .isSubsetOf(', /\.isSubsetOf\(/g],
  ['Set .isSupersetOf(', /\.isSupersetOf\(/g],
  ['Set .isDisjointFrom(', /\.isDisjointFrom\(/g],
];

it('uses no unpolyfilled ES2022+ built-ins in the AudioBus files', () => {
  const hits: string[] = [];
  for (const file of walk(SCAN_ROOT)) {
    const lines = strip(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, index) => {
      for (const [label, pattern] of PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line))
          hits.push(`${file.replace(`${SCAN_ROOT}/`, 'src/apk3d/audio/')}:${index + 1}: ${label}`);
      }
    });
  }
  expect(hits, 'unpolyfilled built-ins (file:line:builtin)').toEqual([]);
});
