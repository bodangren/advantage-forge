// Builds three read-only probes from scripts/old-browser-check.mjs. Not committed.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RUN = fileURLToPath(new URL('.', import.meta.url));
const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const source = readFileSync(join(ROOT, 'scripts', 'old-browser-check.mjs'), 'utf8');
const rootFix = "const ROOT = fileURLToPath(new URL('../../..', import.meta.url));";
const base = source.replace("const ROOT = fileURLToPath(new URL('..', import.meta.url));", rootFix);
if (base === source) throw new Error('ROOT line not found');

function probe(name, changes) {
  let text = base;
  for (const [from, to] of changes) {
    if (!text.includes(from)) throw new Error(`${name}: pattern not found: ${from.slice(0, 60)}`);
    text = text.replace(from, to);
  }
  const out = join(RUN, name);
  writeFileSync(out, text);
  console.log(`wrote ${out}`);
}

const noInput = `const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'probe-p3r1-no-input-out');`;
probe('probe-p3r1-no-input.mjs', [
  ["const OUT_DIR = join(ROOT, 'out', 'old-browser');", noInput],
  [
    '    delete Object.hasOwn;\n  });',
    `    delete Object.hasOwn;
    for (const type of ['keydown', 'keyup']) {
      window.addEventListener(
        type,
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true,
      );
    }
  });`,
  ],
]);

const failDir = join(RUN, 'probe-p3r1-write-fail-out');
rmSync(failDir, { recursive: true, force: true });
mkdirSync(join(failDir, 'check.json-dir'), { recursive: true });
probe('probe-p3r1-write-fail.mjs', [
  [
    "const OUT_DIR = join(ROOT, 'out', 'old-browser');",
    `const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'probe-p3r1-write-fail-out');`,
  ],
  ["const CHECK_JSON = join(OUT_DIR, 'check.json');", "const CHECK_JSON = join(OUT_DIR, 'check.json-dir');"],
]);
