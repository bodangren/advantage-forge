#!/usr/bin/env node
// Type-check one or more asset sources (and the files they import) with the project compiler
// settings. Usage: node scripts/typecheck-asset.mjs <name|path> [...]
// Exit 0 when the named sources have no errors; 1 otherwise. Errors in other files (imports from
// src/, parts) are listed but do not fail the check: the full `tsc --noEmit` owns those.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const names = process.argv.slice(2);
if (names.length === 0) {
  console.error('usage: node scripts/typecheck-asset.mjs <name|path> [...]');
  process.exit(2);
}
const files = names.map((n) => {
  const p = n.endsWith('.ts') ? resolve(n) : join(root, 'assets', `${n}.ts`);
  if (!existsSync(p)) {
    console.error(`typecheck: no such source: ${relative(root, p)}`);
    process.exit(2);
  }
  return p;
});

// The config lives inside the repository, so the compiler finds the type packages in node_modules.
const cache = join(root, 'node_modules', '.cache');
mkdirSync(cache, { recursive: true });
const dir = mkdtempSync(join(cache, 'forge-tsc-'));
const config = join(dir, 'tsconfig.json');
writeFileSync(config, JSON.stringify({ extends: join(root, 'tsconfig.json'), files, include: [] }));
const tsc = join(root, 'node_modules', '.bin', 'tsc');
const run = spawnSync(tsc, ['--noEmit', '--pretty', 'false', '-p', config], { cwd: root, encoding: 'utf8' });
rmSync(dir, { recursive: true, force: true });

const lines = `${run.stdout}${run.stderr}`.split('\n').filter((l) => l.includes('error TS'));
const wanted = new Set(files.map((f) => relative(root, f)));
const own = lines.filter((l) => wanted.has(l.split('(')[0]));
const other = lines.filter((l) => !wanted.has(l.split('(')[0]));
for (const l of own) console.log(l);
if (other.length) console.log(`typecheck: ${other.length} errors in imported files (not counted)`);
console.log(`typecheck ${own.length === 0 ? 'ok' : 'failed'}: ${own.length} errors in ${[...wanted].join(', ')}`);
process.exit(own.length === 0 ? 0 : 1);
