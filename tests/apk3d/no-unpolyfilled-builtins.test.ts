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
 * A `/` opens a regex literal unless the previous significant character closes a value (a word
 * character, `)`, or `]`), because the `/"` literal of `src/storytime/book-pictures.ts` would
 * otherwise open a string that swallows the `.at(` call further down the file. The keyword test
 * uses a word boundary, so `origin / x / 2` stays a division while `return /re/` stays a regex.
 * A `/` after `)` or `]` is tried as a regex first (as in `if (ok) /"/.test(s)`); when no
 * closing `/` sits on the same line it falls back to division.
 */
function strip(code: string): string {
  const out: string[] = new Array(code.length);
  let i = 0;
  const n = code.length;
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
        const keyword =
          /(?:^|[^\w$])(?:return|typeof|instanceof|delete|void|throw|case|do|else|in|of|new)$/.test(
            code.slice(Math.max(0, j - 10), j + 1),
          );
        if (!/[\w$)\]]/.test(prev) || keyword || prev === ')' || prev === ']') {
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
          if (prev === ')' || prev === ']') {
            out[i] = c;
            i++;
            continue;
          }
        }
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
// one argument, which itself may hold a nested call such as `getLastIndex()`; a multi-argument
// custom call such as arena.at(x, y, z) never matches, and a trailing comma is still one
// argument. this.at( is the Board/Board2d tile lookup, not Array.prototype.at: the boundary
// keeps `notthis.at(` a hit while `this.at(` stays out. z.union( is a zod schema combinator,
// not Set.prototype.union: the boundary keeps `itemsz.union(` a hit while `z.union(` stays out.
const PATTERNS: Array<[string, RegExp]> = [
  ['Object.hasOwn', /Object\.hasOwn\s*\(/g],
  ['structuredClone', /structuredClone\s*\(/g],
  ['.at(', /(?<!\bthis)\.at\s*\(\s*(?:[^(),]|\((?:[^()]|\([^()]*\))*\))*(,\s*)?\)/g],
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
// Each exclusion binds the file, the line, the label, and the exact excluded call text: a
// different built-in on the same line is still reported. An exclusion that matches nothing fails
// the test, so the list cannot rot.
type Exclusion = { file: string; line: number; label: string; call: string; reason: string };

const EXCLUSIONS: Exclusion[] = [
  {
    file: 'src/render/page.ts',
    line: 263,
    label: 'Set .union(',
    call: 'box.union(b)',
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
  {
    file: 'src/render/page.ts',
    line: 440,
    label: 'Set .union(',
    call: 'restBox.union(posedBox(effect))',
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
  {
    file: 'src/render/page.ts',
    line: 447,
    label: 'Set .union(',
    call: 'box.union(posedBox(effect))',
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
];

/** Applies applicable exclusions to raw hits; other hits on an excluded line stay reported. */
function applyExclusions(
  raw: Hit[],
  exclusions: Exclusion[],
  strippedLine: (path: string, line: number) => string | null,
): string[] {
  const problems: string[] = [];
  const excluded = new Set<string>();
  for (const exclusion of exclusions) {
    const lineText = strippedLine(exclusion.file, exclusion.line);
    const matched = raw.some(
      (hit) => hit.path === exclusion.file && hit.line === exclusion.line && hit.label === exclusion.label,
    );
    if (!matched || lineText === null || !lineText.includes(exclusion.call)) {
      problems.push(`stale exclusion ${exclusion.file}:${exclusion.line}: ${exclusion.reason}`);
    } else {
      excluded.add(`${exclusion.file}:${exclusion.line}:${exclusion.label}`);
    }
  }
  for (const hit of raw) {
    if (!excluded.has(`${hit.path}:${hit.line}:${hit.label}`)) problems.push(render(hit));
  }
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

it('exclusions bind to their exact call text, not just the line (review r1 C-F3)', () => {
  const fixture = 'if (!b.isEmpty()) box.union(b); structuredClone(s);';
  const stripped = strip(fixture);
  const raw = scanText(stripped, '<fixture>');
  const lineOf = (path: string, line: number): string | null =>
    path === '<fixture>' && line === 1 ? stripped : null;
  const bound: Exclusion[] = [
    { file: '<fixture>', line: 1, label: 'Set .union(', call: 'box.union(b)', reason: 'test bind' },
  ];
  expect(applyExclusions(raw, bound, lineOf)).toEqual(['<fixture>:1: structuredClone']);
  const rotted: Exclusion[] = [
    { file: '<fixture>', line: 1, label: 'Set .union(', call: 'box.merge(b)', reason: 'test bind' },
  ];
  expect(applyExclusions(raw, rotted, lineOf)).toEqual([
    'stale exclusion <fixture>:1: test bind',
    '<fixture>:1: structuredClone',
    '<fixture>:1: Set .union(',
  ]);
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
