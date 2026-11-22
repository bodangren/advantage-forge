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
 * otherwise open a string that swallows the `.at(` call further down the file.
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
        const keyword = /return|typeof|instanceof|delete|void|throw|case|do|else|in|of|new/.test(
          code.slice(Math.max(0, j - 9), j + 1),
        );
        if (!/[\w$)\]]/.test(prev) || keyword) {
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

// The 19 labels. Array/String.prototype.at takes exactly one argument, so a multi-argument
// custom call such as arena.at(x, y, z) never matches; a trailing comma is still one argument.
// this.at( is the Board/Board2d tile lookup, not Array.prototype.at. z.union( is a zod schema
// combinator, not Set.prototype.union.
const PATTERNS: Array<[string, RegExp]> = [
  ['Object.hasOwn', /Object\.hasOwn\(/g],
  ['structuredClone', /structuredClone\(/g],
  ['.at(', /(?<!this)\.at\(\s*[^(),]*?(,\s*)?\)/g],
  ['.findLast(', /\.findLast\(/g],
  ['.findLastIndex(', /\.findLastIndex\(/g],
  ['.toSorted(', /\.toSorted\(/g],
  ['.toReversed(', /\.toReversed\(/g],
  ['.toSpliced(', /\.toSpliced\(/g],
  ['Object.groupBy', /Object\.groupBy\(/g],
  ['Map.groupBy', /Map\.groupBy\(/g],
  ['Promise.withResolvers', /Promise\.withResolvers\(/g],
  ['Array.fromAsync', /Array\.fromAsync\(/g],
  ['Set .union(', /(?<!z)\.union\(/g],
  ['Set .intersection(', /\.intersection\(/g],
  ['Set .difference(', /\.difference\(/g],
  ['Set .symmetricDifference(', /\.symmetricDifference\(/g],
  ['Set .isSubsetOf(', /\.isSubsetOf\(/g],
  ['Set .isSupersetOf(', /\.isSupersetOf\(/g],
  ['Set .isDisjointFrom(', /\.isDisjointFrom\(/g],
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
// An exclusion that matches nothing fails the test, so the list cannot rot.
const EXCLUSIONS: Array<{ file: string; line: number; reason: string }> = [
  {
    file: 'src/render/page.ts',
    line: 263,
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
  {
    file: 'src/render/page.ts',
    line: 440,
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
  {
    file: 'src/render/page.ts',
    line: 447,
    reason: 'Box3.union (three.js geometry), not Set.prototype.union',
  },
];

it('uses no unpolyfilled ES2022+ built-ins under SCAN_ROOT', () => {
  const scope = toPosix(relative(ROOT, SCAN_ROOT));
  const raw: Hit[] = [];
  for (const file of walk(SCAN_ROOT)) {
    raw.push(...scanText(strip(readFileSync(file, 'utf8')), toPosix(relative(ROOT, file))));
  }
  const problems: string[] = [];
  const excluded = new Set<string>();
  for (const exclusion of EXCLUSIONS) {
    const applies = exclusion.file === scope || exclusion.file.startsWith(`${scope}/`);
    if (!applies) continue;
    const matched = raw.some((hit) => hit.path === exclusion.file && hit.line === exclusion.line);
    if (!matched) {
      problems.push(`stale exclusion ${exclusion.file}:${exclusion.line}: ${exclusion.reason}`);
    } else {
      excluded.add(`${exclusion.file}:${exclusion.line}`);
    }
  }
  for (const hit of raw) {
    if (!excluded.has(`${hit.path}:${hit.line}`)) problems.push(render(hit));
  }
  expect(problems, 'unpolyfilled built-ins (file:line:builtin)').toEqual([]);
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
