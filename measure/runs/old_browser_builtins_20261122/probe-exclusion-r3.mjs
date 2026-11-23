import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const checker = readFileSync('tests/apk3d/no-unpolyfilled-builtins.test.ts', 'utf8');
const begin = checker.indexOf('function strip(code: string): string {');
const end = checker.indexOf("it('uses no unpolyfilled ES2022+ built-ins under SCAN_ROOT'");
assert(begin >= 0 && end > begin);
const modulePath = 'measure/runs/old_browser_builtins_20261122/probe-exclusion-r3.ts';
writeFileSync(modulePath, `${checker.slice(begin, end)}\nexport { strip, scanText, EXCLUSIONS, applyExclusions };\n`);
const { strip, scanText, EXCLUSIONS, applyExclusions } = await import(pathToFileURL(`${root}/${modulePath}`));
function scanFixture(fixture, call = 'box.union(b)') {
  const stripped = strip(fixture);
  const raw = scanText(stripped, '<fixture>');
  const exclusion = [{ file: '<fixture>', line: 1, label: 'Set .union(', call, reason: 'probe' }];
  return applyExclusions(raw, exclusion, (path, line) => path === '<fixture>' ? stripped.split('\n')[line - 1] ?? null : null);
}
const probes = [
  ['otherbox', 'otherbox.union(b)', true],
  ['mybox', 'mybox.union(b)', true],
  ['box2', 'box2.union(b)', true],
  ['Box', 'Box.union(b)', true],
  ['box_', 'box_.union(b)', true],
  ['whitespace before dot', 'box .union(b)', true],
  ['newline before dot', 'box\n.union(b)', true],
  ['optional chaining', 'box?.union(b)', true],
  ['comment only', '// box.union(b)', false],
  ['string only', 'const s = "box.union(b)";', false],
  ['duplicate calls', 'box.union(b); box.union(b)', true],
  ['chained call', 'box.union(b).union(c)', true],
  ['computed access', "box['union'](b)", false],
];
for (const [name, fixture, shouldReport] of probes) {
  const errors = scanFixture(fixture);
  const reported = errors.some((line) => line.includes('Set .union('));
  assert.equal(reported, shouldReport, `${name}: ${JSON.stringify(errors)}`);
  console.log(`PROBE PASS ${name}: ${reported ? 'hit preserved' : 'no literal built-in hit'}; ${JSON.stringify(errors)}`);
}
const src = readFileSync('src/render/page.ts', 'utf8');
const lines = src.split('\n');
const rows = EXCLUSIONS.map(({ file, line, label }) => {
  assert.equal(file, 'src/render/page.ts');
  const raw = scanText(strip(lines[line - 1]), file).filter((hit) => hit.label === label);
  return { line, raw: raw.length };
});
assert.deepEqual(rows.map((row) => row.raw), [1, 1, 1]);
const strippedLines = new Map();
const raw = [];
for (const [index, line] of lines.entries()) raw.push(...scanText(strip(line), 'src/render/page.ts'));
const sourcePath = 'src/render/page.ts';
const fullRaw = [];
for (const file of (await import('node:fs')).readdirSync('src', { recursive: true }).filter((f) => f.endsWith('.ts') && !f.endsWith('.gen.ts'))) {
  const text = readFileSync(`src/${file}`, 'utf8');
  const stripped = strip(text);
  const posix = `src/${file}`;
  strippedLines.set(posix, stripped.split('\n'));
  fullRaw.push(...scanText(stripped, posix));
}
const problems = applyExclusions(fullRaw, EXCLUSIONS, (path, line) => strippedLines.get(path)?.[line - 1] ?? null);
assert.deepEqual(problems, []);
console.log(`SOURCE PASS: three Box3 exclusions match one hit each; full src scan has ${fullRaw.length} raw hits, ${problems.length} residual problems.`);
