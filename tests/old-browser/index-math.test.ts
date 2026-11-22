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

const ARRAY_AT =
  /(?<!\bthis)\.at\s*\(\s*(?:[^(),\[\]{}]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|\[(?:[^\[\]]|\[[^\[\]]*\])*\]|\{(?:[^{}]|\{[^{}]*\})*\})*(,\s*)?\)/;
const FIND_LAST_INDEX = /\.findLastIndex\s*\(/;

/**
 * Strips line comments, block comments, strings, template text, and regex literals so a helper
 * call that only remains in a comment or a string does not satisfy the site check. This mirrors
 * the one-pass strip in tests/apk3d/no-unpolyfilled-builtins.test.ts (duplicated because test
 * files never import each other): template `${...}` content stays code, dropped characters become
 * spaces, and newlines stay, so a stripped line number matches the source line.
 */
function stripCode(code: string): string {
  const out: string[] = new Array(code.length);
  let i = 0;
  const n = code.length;
  const parenControl: boolean[] = [];
  let afterControlParen = false;
  const blank = (index: number): void => {
    out[index] = code[index] === '\n' ? '\n' : ' ';
  };
  function processCode(endOnBrace: boolean): void {
    let depth = 0;
    while (i < n) {
      const c = code[i]!;
      const d = code[i + 1]!;
      if (c === '/' && d === '/') {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
        while (i < n && code[i] !== '\n') {
          out[i] = ' ';
          i++;
        }
        continue;
      }
      if (c === '/' && d === '*') {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
        while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
          blank(i);
          i++;
        }
        if (i < n) {
          out[i] = ' ';
          out[i + 1] = ' ';
          i += 2;
        }
        continue;
      }
      if (c === "'" || c === '"') {
        const quote = c;
        out[i] = ' ';
        i++;
        while (i < n && code[i] !== quote) {
          if (code[i] === '\\') {
            out[i] = ' ';
            i++;
            if (i < n) {
              blank(i);
              i++;
            }
            continue;
          }
          blank(i);
          i++;
        }
        if (i < n) {
          out[i] = ' ';
          i++;
        }
        continue;
      }
      if (c === '`') {
        out[i] = ' ';
        i++;
        processTemplate();
        continue;
      }
      if (c === '/' && d !== '/' && d !== '*' && d !== '=') {
        let j = i - 1;
        while (j >= 0 && (code[j] === ' ' || code[j] === '\t' || code[j] === '\n' || code[j] === '\r')) j--;
        const prev = j >= 0 ? code[j]! : ';';
        const isWord = /[\w$]/.test(prev);
        const keyword =
          isWord &&
          /(?:^|[^\w$])(?:return|typeof|instanceof|delete|void|throw|case|do|else|in|of|new)$/.test(
            code.slice(Math.max(0, j - 10), j + 1),
          );
        const isRegexPos = isWord
          ? keyword
          : prev === ')'
            ? afterControlParen
            : prev !== ']' && prev !== '"' && prev !== "'" && prev !== '`';
        if (isRegexPos) {
          let k = i + 1;
          let inClass = false;
          let closed = false;
          while (k < n) {
            const e = code[k]!;
            if (e === '\\') {
              k += 2;
              continue;
            }
            if (e === '\n') break;
            if (e === '[') inClass = true;
            else if (e === ']') inClass = false;
            else if (e === '/' && !inClass) {
              closed = true;
              break;
            }
            k++;
          }
          if (closed) {
            for (let q = i; q <= k; q++) blank(q);
            i = k + 1;
            while (i < n && /[a-z]/.test(code[i]!)) {
              out[i] = ' ';
              i++;
            }
            continue;
          }
        }
        out[i] = c;
        i++;
        continue;
      }
      if (c === '(') {
        let m = i - 1;
        while (m >= 0 && (code[m] === ' ' || code[m] === '\t' || code[m] === '\n' || code[m] === '\r')) m--;
        let w = m;
        while (w >= 0 && /[\w$]/.test(code[w]!)) w--;
        const word = code.slice(w + 1, m + 1);
        parenControl.push(
          word === 'if' ||
            word === 'while' ||
            word === 'for' ||
            word === 'with' ||
            word === 'switch' ||
            word === 'catch',
        );
        out[i] = c;
        i++;
        continue;
      }
      if (c === ')') {
        afterControlParen = parenControl.pop() ?? false;
        out[i] = c;
        i++;
        continue;
      }
      if (c === '{') {
        depth++;
        out[i] = c;
        i++;
        continue;
      }
      if (c === '}') {
        if (endOnBrace && depth === 0) return;
        depth--;
        out[i] = c;
        i++;
        continue;
      }
      out[i] = c;
      i++;
    }
  }
  function processTemplate(): void {
    while (i < n) {
      const c = code[i]!;
      if (c === '\\') {
        out[i] = ' ';
        i++;
        if (i < n) {
          blank(i);
          i++;
        }
        continue;
      }
      if (c === '`') {
        out[i] = ' ';
        i++;
        return;
      }
      if (c === '$' && code[i + 1] === '{') {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
        processCode(true);
        if (i < n && code[i] === '}') {
          out[i] = ' ';
          i++;
        }
        continue;
      }
      blank(i);
      i++;
    }
  }
  processCode(false);
  return out.join('');
}

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
    line: 2270,
    expect: 'atIndex(job.candidates, -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/storytime/book-pictures.ts',
    line: 3936,
    expect: 'atIndex(existingVersions, -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/storytime/book-pictures.ts',
    line: 4559,
    expect: 'atIndex(candidates, -1)',
    oldCall: '.at(',
  },
  {
    file: 'src/host/reader.ts',
    line: 198,
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
    const lines = stripCode(getText(file)).split('\n');
    for (const site of sites) {
      if (!(lines[site.line - 1] ?? '').includes(site.expect)) {
        failures.push(`${site.file}:${site.line}: missing expected ${site.expect}`);
      }
    }
    const stripped = lines.join('\n');
    if (ARRAY_AT.test(stripped)) failures.push(`${file}: still calls .at(`);
    if (FIND_LAST_INDEX.test(stripped)) failures.push(`${file}: still calls .findLastIndex(`);
  }
  return failures;
}

/** Replaces the nth (0-based) occurrence of a snippet with an old-style call. */
function replaceNth(text: string, snippet: string, n: number, oldCall: string): string {
  let from = 0;
  for (let k = 0; k <= n; k++) {
    const at = text.indexOf(snippet, from);
    if (at === -1) throw new Error(`occurrence ${n} of ${snippet} not found`);
    if (k === n) return text.slice(0, at) + oldCall + text.slice(at + snippet.length);
    from = at + snippet.length;
  }
  throw new Error('unreachable');
}

/** The 0-based occurrence of each entry among same-file, same-snippet entries. */
function occurrenceOf(index: number): number {
  let n = 0;
  for (let k = 0; k < index; k++) {
    if (SITES[k]!.file === SITES[index]!.file && SITES[k]!.expect === SITES[index]!.expect) n++;
  }
  return n;
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
    const oldCall =
      site.oldCall === '.at(' ? '[...BROKEN.values()].at(-1)' : 'BROKEN.findLastIndex((s) => true)';
    copies.set(site.file, replaceNth(copies.get(site.file)!, site.expect, occurrenceOf(index), oldCall));
    const failures = checkSites((file) => copies.get(file)!);
    const named = failures.filter((failure) =>
      new RegExp(`^${site.file.replace(/[./]/g, (c) => `\\${c}`)}:\\d+:`).test(failure),
    );
    if (named.length !== 1 || named[0] !== `${site.file}:${site.line}: missing expected ${site.expect}`) {
      broken.push(`site ${index} (${site.file}:${site.line}) is not independently required`);
    }
  });
  expect(broken).toEqual([]);
});

it('a commented-out helper call does not satisfy the site check (review r2 A-F3)', () => {
  const file = 'src/storytime/book-pictures.ts';
  const site = SITES.find((entry) => entry.file === file && entry.line === 4559)!;
  const texts = new Map<string, string>();
  for (const entry of SITES) {
    if (!texts.has(entry.file)) texts.set(entry.file, readFileSync(join(ROOT, entry.file), 'utf8'));
  }
  texts.set(
    file,
    texts.get(file)!.replace(site.expect, '[...BROKEN.values()].at(-1)') + `\n// ${site.expect}\n`,
  );
  const failures = checkSites((entry) => texts.get(entry)!);
  expect(failures.some((failure) => failure.startsWith(`${file}:4559`))).toBe(true);
});
