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
// Each exclusion binds the file, the line, the label, and the exact excluded call text, and it
// filters exactly one hit instance: a different built-in — or a second same-label call such as
// `items.union(other)` beside `box.union(b)` — on the same line is still reported. The call text
// matches with a word boundary on the receiver, so a renamed receiver such as `otherbox` never
// counts as the excluded call. An exclusion that matches nothing fails the test, so the list
// cannot rot.
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

/** The exclusion call must occur as an exact call instance: the receiver keeps a word
 * boundary, so `box.union(b)` does not match `otherbox.union(b)`, `mybox.union(b)`, or
 * `box2.union(b)`, and the closing paren keeps one too, so a longer argument list is not
 * covered. A renamed receiver stays reported; a different built-in on an excluded line was
 * already reported by the single-instance filter. */
function exclusionMatchesLine(strippedLine: string, call: string): boolean {
  const escaped = call.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(strippedLine);
}

/** Applies applicable exclusions to raw hits; each exclusion filters exactly one hit instance,
 * so a second same-label call on the same line stays reported. */
function applyExclusions(
  raw: Hit[],
  exclusions: Exclusion[],
  strippedLine: (path: string, line: number) => string | null,
): string[] {
  const problems: string[] = [];
  const excluded = new Set<number>();
  for (const exclusion of exclusions) {
    const lineText = strippedLine(exclusion.file, exclusion.line);
    const index = raw.findIndex(
      (hit, k) =>
        !excluded.has(k) &&
        hit.path === exclusion.file &&
        hit.line === exclusion.line &&
        hit.label === exclusion.label,
    );
    if (index === -1 || lineText === null || !exclusionMatchesLine(lineText, exclusion.call)) {
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


export { strip, scanText, EXCLUSIONS, applyExclusions };
