// Builds two read-only probes from scripts/old-browser-check.mjs. Not committed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RUN = fileURLToPath(new URL('.', import.meta.url));
const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const source = readFileSync(join(ROOT, 'scripts', 'old-browser-check.mjs'), 'utf8');
const base = source.replace(
  "const ROOT = fileURLToPath(new URL('..', import.meta.url));",
  "const ROOT = fileURLToPath(new URL('../../..', import.meta.url));",
);
if (base === source) throw new Error('ROOT line not found');

function probe(name, dir, changes) {
  let text = base.replace(
    "const OUT_DIR = join(ROOT, 'out', 'old-browser');",
    `const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', '${dir}');`,
  );
  for (const [from, to] of changes) {
    if (!text.includes(from)) throw new Error(`${name}: pattern not found: ${from.slice(0, 70)}`);
    text = text.replace(from, to);
  }
  mkdirSync(join(RUN, dir), { recursive: true });
  writeFileSync(join(RUN, name), text);
  console.log(`wrote ${name}`);
}

// Harness-only score mutation with every real input neutralized.
probe('probe-p3r2-harness-score.mjs', 'probe-p3r2-harness-score-out', [
  [
    '    await input.play();',
    `    await page.evaluate(() => {
      const state = window.__apk3d?.game?.()?.state?.();
      if (state) state.score += 1;
    });`,
  ],
]);

// A foreign Vite-marker server binds after the preflight and before this run's child.
probe('probe-p3r2-startup-race.mjs', 'probe-p3r2-startup-race-out', [
  [
    `  if (await portAnswering()) throw new Error(\`port \${PORT} already in use\`);
  mkdirSync(OUT_DIR, { recursive: true });`,
    `  if (await portAnswering()) throw new Error(\`port \${PORT} already in use\`);
  const { createServer } = await import('node:http');
  const foreign = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<html><script src="/@vite/client"></script></html>');
  });
  await new Promise((resolve) => foreign.listen(PORT, '127.0.0.1', resolve));
  globalThis.__foreign = foreign;
  mkdirSync(OUT_DIR, { recursive: true });`,
  ],
  [
    '  await stopServer();\n  try {',
    `  await stopServer();
  if (globalThis.__foreign) await new Promise((resolve) => globalThis.__foreign.close(resolve));
  try {`,
  ],
]);
