import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

// Vite leaves these ES2022+ built-ins unpolyfilled, so they throw on the older supported
// browsers (iOS 15.0-15.3, Chrome WebView 80-97). The scan fails naming file and line.
// Track old_browser_builtins_20261122 widened this root from the audio folder to src/ in T5 and
// removed the wide-mode flag. The file never moves: its URL resolves two steps up to the root.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCAN_ROOT = join(ROOT, 'src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.ts') && !name.endsWith('.gen.ts')) out.push(full);
  }
  return out;
}

/**
 * One left-to-right pass over the source. States: code, line comment, block comment,
 * single-quoted string, double-quoted string, template text, and template `${...}` expression.
 * A string or a comment ends at its own terminator and never at a `//` inside a string, so the
 * URL row of the control table keeps its call. Template text is dropped and each `${...}`
 * content is scanned as code, with nested braces counted, so the template row keeps its call.
 * Dropped characters become spaces and each newline stays, so a hit line matches the source.
 * A `/` after a value is division: after an identifier, a number, a closing bracket, a string
 * end, or a close paren that is not a control header (tracked with a paren stack, so
 * `getOrigin() / structuredClone(v) / 2` and `a[0] / structuredClone(v)` stay visible while
 * `if (ok) /re/` stays a regex). A `/` after a keyword such as `return` also opens a regex,
 * because the word boundary keeps `origin` and `coin` divisions. Anything else opens a regex;
 * when no closing slash sits on the same line the slash falls back to division.
 */
function strip(code: string): string {
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
        // A slash after a value is division: after an identifier, a number, a closing bracket,
        // a string end, or a close paren that is not a control header. A slash after a
        // control-header close paren (as in `if (ok) /re/`) stays a regex. Any other slash opens
        // a regex; when no closing slash sits on the same line it falls back to division.
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

/**
 * The deliberately wrong scanner the controls compare against: it strips comments before
 * strings, so a `//` inside a string URL cuts the rest of its line, and it strips template
 * literals whole, so an interpolation hides its call. Only the control test calls it; it never
 * scans `src/`.
 */
function stripCommentsFirst(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

// The 19 labels. A call name may be followed by a comment before its parentheses, so every
// pattern allows whitespace between the name and `(`. Array/String.prototype.at takes exactly
// one argument, which may nest balanced parentheses, brackets, and braces to several levels
// (such as `[0, 1][0]` or `one(two(three()))`); a top-level comma still ends the match, so a
// multi-argument custom call such as arena.at(x, y, z) never matches, and a trailing comma is
// still one argument. this.at( is the Board/Board2d tile lookup, not Array.prototype.at: the
// boundary keeps `notthis.at(` a hit while `this.at(` stays out. z.union( is a zod schema
// combinator, not Set.prototype.union: the boundary keeps `itemsz.union(` a hit while `z.union(`
// stays out.
const PATTERNS: Array<[string, RegExp]> = [
  ['Object.hasOwn', /Object\.hasOwn\s*\(/g],
  ['structuredClone', /structuredClone\s*\(/g],
  [
    '.at(',
    /(?<!\bthis)\.at\s*\(\s*(?:[^(),\[\]{}]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|\[(?:[^\[\]]|\[[^\[\]]*\])*\]|\{(?:[^{}]|\{[^{}]*\})*\})*(,\s*)?\)/g,
  ],
  ['.findLast(', /\.findLast\s*\(/g],
  ['.findLastIndex(', /\.findLastIndex\s*\(/g],
  ['.toSorted(', /\.toSorted\s*\(/g],
  ['.toReversed(', /\.toReversed\s*\(/g],
  ['.toSpliced(', /\.toSpliced\s*\(/g],
  ['Object.groupBy', /Object\.groupBy\s*\(/g],
  ['Map.groupBy', /Map\.groupBy\s*\(/g],
  ['Promise.withResolvers', /Promise\.withResolvers\s*\(/g],
  ['Array.fromAsync', /Array\.fromAsync\s*\(/g],
  ['Set .union(', /(?<!\bz)\.union\s*\(/g],
  ['Set .intersection(', /\.intersection\s*\(/g],
  ['Set .difference(', /\.difference\s*\(/g],
  ['Set .symmetricDifference(', /\.symmetricDifference\s*\(/g],
  ['Set .isSubsetOf(', /\.isSubsetOf\s*\(/g],
  ['Set .isSupersetOf(', /\.isSupersetOf\s*\(/g],
  ['Set .isDisjointFrom(', /\.isDisjointFrom\s*\(/g],
];

type Hit = { path: string; line: number; label: string };

function toPosix(path: string): string {
  return path.split(sep).join('/');
}

/** Every pattern hit over the whole stripped text: `<path>:<line>: <label>`. */
function scanText(stripped: string, path: string): Hit[] {
  const hits: Hit[] = [];
  for (const [label, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(stripped)) !== null) {
      const line = 1 + stripped.slice(0, match.index).split('\n').length - 1;
      hits.push({ path, line, label });
    }
  }
  return hits;
}

function render(hit: Hit): string {
  return `${hit.path}:${hit.line}: ${hit.label}`;
}

// Named false positives: the three Box3.union calls of src/render/page.ts are three.js geometry,
// not Set.prototype.union. this.at(, multi-argument .at(, and z.union( stay out by pattern.
// Each exclusion binds the file, the line, the label, and the full trimmed source line text of
// the real call, and it filters exactly one hit instance. Any other hit stays reported: a
// different built-in, a second same-label call, a renamed receiver such as `otherbox` or
// `holder.box`, a non-ASCII receiver, or the same call on a different line. An exclusion whose
// entry no longer hits exactly once fails the test, so the list cannot rot.
type Exclusion = { file: string; line: number; label: string; text: string; reason: string };

// The exact trimmed source lines of the three real calls, read from src/render/page.ts.
// The line numbers follow that file. The renderer options of the chibi_sprouts_redesign_20261123
// track moved the three calls from lines 263, 440, and 447 to lines 331, 531, and 538 on
// 2026-11-23. The bound source text did not change.
const PAGE_331 = 'if (!b.isEmpty()) box.union(b);';
const PAGE_531 = 'restBox.union(posedBox(effect));';
const PAGE_538 = 'box.union(posedBox(effect));';

const EXCLUSIONS: Exclusion[] = [
  {
    file: 'src/render/page.ts',
    line: 331,
    label: 'Set .union(',
    text: PAGE_331,
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
  {
    file: 'src/render/page.ts',
    line: 531,
    label: 'Set .union(',
    text: PAGE_531,
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
  {
    file: 'src/render/page.ts',
    line: 538,
    label: 'Set .union(',
    text: PAGE_538,
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
];

/** Applies applicable exclusions to raw hits. A raw hit is excluded only when its file, line,
 * and label match one allowed entry and the trimmed stripped line text equals the entry text,
 * so every other hit on the line stays reported. Each exclusion filters exactly one hit
 * instance; an entry that no longer hits fails as a stale exclusion naming the entry. */
function applyExclusions(
  raw: Hit[],
  exclusions: Exclusion[],
  strippedLine: (path: string, line: number) => string | null,
): string[] {
  const problems: string[] = [];
  const excluded = new Set<number>();
  for (const exclusion of exclusions) {
    const lineText = strippedLine(exclusion.file, exclusion.line);
    const trimmed = lineText === null ? null : lineText.trim();
    const index = raw.findIndex(
      (hit, k) =>
        !excluded.has(k) &&
        hit.path === exclusion.file &&
        hit.line === exclusion.line &&
        hit.label === exclusion.label &&
        trimmed !== null &&
        trimmed === exclusion.text,
    );
    if (index === -1) {
      problems.push(`stale exclusion ${exclusion.file}:${exclusion.line}: ${exclusion.reason}`);
    } else {
      excluded.add(index);
    }
  }
  raw.forEach((hit, k) => {
    if (!excluded.has(k)) problems.push(render(hit));
  });
  return problems;
}

it('uses no unpolyfilled ES2022+ built-ins under SCAN_ROOT', () => {
  const scope = toPosix(relative(ROOT, SCAN_ROOT));
  const strippedByFile = new Map<string, string[]>();
  const raw: Hit[] = [];
  for (const file of walk(SCAN_ROOT)) {
    const path = toPosix(relative(ROOT, file));
    const stripped = strip(readFileSync(file, 'utf8'));
    strippedByFile.set(path, stripped.split('\n'));
    raw.push(...scanText(stripped, path));
  }
  const applicable = EXCLUSIONS.filter(
    (exclusion) => exclusion.file === scope || exclusion.file.startsWith(`${scope}/`),
  );
  const problems = applyExclusions(
    raw,
    applicable,
    (path, line) => strippedByFile.get(path)?.[line - 1] ?? null,
  );
  expect(problems, 'unpolyfilled built-ins (file:line:builtin)').toEqual([]);
});

it('an exclusion does not match a renamed receiver (acceptance A7)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const bound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('if (!b.isEmpty()) otherbox.union(b);', bound)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: Set .union(',
  ]);
});

it('a holder receiver stays reported (acceptance A7)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const bound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('holder.box.union(b);', bound)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: Set .union(',
  ]);
});

it('a non-ASCII receiver stays reported (acceptance A7)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const bound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('λbox.union(b);', bound)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: Set .union(',
  ]);
});

it('an exclusion does not match a longer receiver name (acceptance A7)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const bound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('if (!b.isEmpty()) mybox.union(b);', bound)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: Set .union(',
  ]);
});

it('a different receiver keeps the stale-exclusion rot check (acceptance A7)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const bound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('if (!b.isEmpty()) box2.union(b);', bound)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: Set .union(',
  ]);
  const real331 = readFileSync(join(ROOT, 'src', 'render', 'page.ts'), 'utf8').split('\n')[330]!;
  expect(real331).toContain('box.union(b)');
  expect(problemsFor(real331, bound)).toEqual([]);
});

it('exclusions bind to their exact call text, not just the line (review r1 C-F3)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const fixture = 'if (!b.isEmpty()) box.union(b); structuredClone(s);';
  const bound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b); structuredClone(s);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor(fixture, bound)).toEqual(['<fixture>:1: structuredClone']);
  const rotted: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.merge(b); structuredClone(s);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor(fixture, rotted)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: structuredClone',
    '<fixture>:1: Set .union(',
  ]);
});

it('an exclusion filters one call instance; a second same-label call stays (review r2 C-F3)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const itemsFixture = 'if (!b.isEmpty()) box.union(b); items.union(other);';
  const itemsBound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b); items.union(other);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor(itemsFixture, itemsBound)).toEqual(['<fixture>:1: Set .union(']);
  const setFixture = 'if (!b.isEmpty()) box.union(b); set.union(other);';
  const setBound: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b); set.union(other);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor(setFixture, setBound)).toEqual(['<fixture>:1: Set .union(']);
});

it('the allowed text on a different line number stays reported (acceptance A7)', () => {
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line >= 1 ? (stripped.split('\n')[line - 1] ?? null) : null,
    );
  };
  const moved: Exclusion[] = [
    {
      file: '<fixture>',
      line: 2,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('const x = 1;\nif (!b.isEmpty()) box.union(b);', moved)).toEqual([]);
  const staleLine: Exclusion[] = [
    {
      file: '<fixture>',
      line: 1,
      label: 'Set .union(',
      text: 'if (!b.isEmpty()) box.union(b);',
      reason: 'test bind',
    },
  ];
  expect(problemsFor('const x = 1;\nif (!b.isEmpty()) box.union(b);', staleLine)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:2: Set .union(',
  ]);
});

it('the three real exclusion lines still produce zero reported hits (acceptance A7)', () => {
  const page = readFileSync(join(ROOT, 'src', 'render', 'page.ts'), 'utf8').split('\n');
  const lines = [page[330]!, page[530]!, page[537]!];
  expect(lines.map((line) => line.trim())).toEqual([PAGE_331, PAGE_531, PAGE_538]);
  const problemsFor = (fixture: string, exclusions: Exclusion[]): string[] => {
    const stripped = strip(fixture);
    const raw = scanText(stripped, '<fixture>');
    return applyExclusions(raw, exclusions, (path, line) =>
      path === '<fixture>' && line === 1 ? stripped : null,
    );
  };
  const entries: Exclusion[] = [
    { file: '<fixture>', line: 1, label: 'Set .union(', text: PAGE_331, reason: 'page.ts:331' },
    { file: '<fixture>', line: 1, label: 'Set .union(', text: PAGE_531, reason: 'page.ts:531' },
    { file: '<fixture>', line: 1, label: 'Set .union(', text: PAGE_538, reason: 'page.ts:538' },
  ];
  expect(problemsFor(PAGE_331, [entries[0]!])).toEqual([]);
  expect(problemsFor(PAGE_531, [entries[1]!])).toEqual([]);
  expect(problemsFor(PAGE_538, [entries[2]!])).toEqual([]);
});

/** Total pattern hits over the whole stripped text. */
function fixedHits(fixture: string): number {
  return scanText(strip(fixture), '<fixture>').length;
}

/** Total pattern hits of the witness: comments stripped before strings, matched line by line. */
function witnessHits(fixture: string): number {
  let total = 0;
  for (const line of stripCommentsFirst(fixture).split('\n')) {
    for (const [, pattern] of PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      const fresh = new RegExp(pattern.source, pattern.flags);
      while ((match = fresh.exec(line)) !== null) total++;
    }
  }
  return total;
}

const LABELS_FIXTURE =
  'Object.hasOwn( structuredClone( items.at(-1) items.findLast( items.findLastIndex( ' +
  'items.toSorted( items.toReversed( items.toSpliced( Object.groupBy( Map.groupBy( ' +
  'Promise.withResolvers( Array.fromAsync( items.union( items.intersection( items.difference( ' +
  'items.symmetricDifference( items.isSubsetOf( items.isSupersetOf( items.isDisjointFrom(';

/** Every label once as code, with the tricky call shapes the fixed scanner must keep. */
const LABELS_CODE_FIXTURE = [
  'const own = Object.hasOwn(obj, "k");',
  'const q = origin / structuredClone(value) / 2;',
  'const last = rows.at(getLastIndex());',
  'const f = items.findLast(isX);',
  'const fi = items.findLastIndex(isX);',
  'const s = items.toSorted(cmp);',
  'const r = items.toReversed();',
  'const p = items.toSpliced(0, 1);',
  'const g = Object.groupBy(items, fn);',
  'const m = Map.groupBy(items, fn);',
  'const d = Promise.withResolvers();',
  'const a = Array.fromAsync(iter);',
  'const u = itemsz.union(other);',
  'const n = items.intersection(other);',
  'const e = items.difference(other);',
  'const y = items.symmetricDifference(other);',
  'const b = items.isSubsetOf(other);',
  'const c = items.isSupersetOf(other);',
  'const j = items.isDisjointFrom(other);',
].join('\n');

it('controls prove the strip and the whole-text patterns', () => {
  const rows: Array<{ name: string; fixture: string; fixed: number; witness: number }> = [
    {
      name: 'URL before a call on one line',
      fixture: 'const u = "https://e.test/x"; structuredClone(s);',
      fixed: 1,
      witness: 0,
    },
    {
      name: 'call in a template interpolation',
      fixture: 'const t = `copy ${structuredClone(s).phase}`;',
      fixed: 1,
      witness: 0,
    },
    {
      name: 'receiver on the next line',
      fixture: 'const l = [...m.values()]\n  .at(-1);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'argument on the next lines',
      fixture: 'const l = [...m.values()].at(\n  -1,\n);',
      fixed: 1,
      witness: 0,
    },
    {
      name: 'structuredClone( over two lines',
      fixture: 'const s = structuredClone(\n  state\n);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'every label inside comments or strings',
      fixture: `// ${LABELS_FIXTURE}\nconst s = "${LABELS_FIXTURE}";`,
      fixed: 0,
      witness: 0,
    },
    {
      name: 'division around a call',
      fixture: 'const q = origin / structuredClone(value) / 2;',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'regex literal before a call',
      fixture: 'if (ok) /"/.test(s); structuredClone(state);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'nested call as the index argument',
      fixture: 'const last = rows.at(getLastIndex());',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'comment between the call name and its parentheses',
      fixture: 'const s = structuredClone /* note */ (state);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'receiver boundary on .at(',
      fixture: 'const a = notthis.at(-1);\nconst t = this.at(0, 1);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'receiver boundary on .union(',
      fixture: 'const u = itemsz.union(other);\nconst s = z.union([a]);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'all 19 labels as code',
      fixture: LABELS_CODE_FIXTURE,
      fixed: 19,
      witness: 19,
    },
    {
      name: 'division after a call',
      fixture: 'const q = getOrigin() / structuredClone(v) / 2;',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'division after an index',
      fixture: 'const r = a[0] / structuredClone(v) / 2;',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'control header regex before a division',
      fixture: 'if (ok) /re/.test(s); getOrigin() / structuredClone(v) / 2;',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'array literal in the index argument',
      fixture: 'const l = rows.at([0, 1][0]);',
      fixed: 1,
      witness: 1,
    },
    {
      name: 'deeply nested call in the index argument',
      fixture: 'const v = rows.at(one(two(three())));',
      fixed: 1,
      witness: 1,
    },
  ];
  const failures: string[] = [];
  for (const row of rows) {
    const fixed = fixedHits(row.fixture);
    const witness = witnessHits(row.fixture);
    if (fixed !== row.fixed || witness !== row.witness) {
      failures.push(
        `${row.name}: fixed ${fixed} (want ${row.fixed}), witness ${witness} (want ${row.witness})`,
      );
    }
  }
  expect(failures).toEqual([]);
});
