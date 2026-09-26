#!/usr/bin/env node
// Stages one character's review entry: the committed docs/character-reviews.json with only
// <name>'s entry taken from the working copy, so parallel agents' other entries stay unstaged.
//   node scripts/commit-review-entry.mjs <name> [<name> ...]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const FILE = 'docs/character-reviews.json';
const names = process.argv.slice(2);
const head = JSON.parse(execFileSync('git', ['show', `HEAD:${FILE}`]).toString());
const work = JSON.parse(fs.readFileSync(FILE, 'utf8'));
for (const n of names) {
  if (!work[n]) throw new Error(`no review entry for ${n}`);
  head[n] = work[n];
}
const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: JSON.stringify(head, null, 2) + '\n' }).toString().trim();
execFileSync('git', ['update-index', '--cacheinfo', `100644,${blob},${FILE}`]);
console.log(`staged review entries: ${names.join(', ')}`);
