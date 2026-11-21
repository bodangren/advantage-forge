#!/usr/bin/env node
// Render one named sound set through the pinned earshot binary.
//
//   node scripts/sound-set.mjs <set>
//
// The set file is sounds/sets/<set>.json. The output folder is sounds/<set>/.
// SOUNDS_ROOT overrides the repository root. EARSHOT_BIN overrides the binary path.
import { spawnSync } from 'node:child_process';
import { accessSync, constants as fsConstants, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(process.env.SOUNDS_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
const SAFE_NAME = /^[a-z0-9-]+$/;

function fail(line, code) {
  process.stderr.write(`${line}\n`);
  process.exit(code);
}

const set = process.argv[2];
if (set === undefined) fail('sound-set: usage: node scripts/sound-set.mjs <set>', 2);
if (!SAFE_NAME.test(set)) fail(`sound-set: bad set name: ${set}`, 2);

const setFile = resolve(ROOT, 'sounds', 'sets', `${set}.json`);
if (!existsSync(setFile)) fail(`sound-set: set file not found: ${setFile}`, 1);

let parsed;
try {
  parsed = JSON.parse(readFileSync(setFile, 'utf8'));
} catch {
  fail(`sound-set: set file is not valid JSON: ${setFile}`, 1);
}

const sounds = parsed?.sounds;
if (!Array.isArray(sounds) || sounds.length === 0) {
  fail('sound-set: bad set file: sounds must be a non-empty array', 1);
}

const seen = new Set();
for (let index = 0; index < sounds.length; index += 1) {
  const entry = sounds[index];
  if (typeof entry?.name !== 'string' || entry.name === '') {
    fail(`sound-set: bad set file: entry ${index} needs a name`, 1);
  }
  if (typeof entry.design !== 'string' || entry.design === '') {
    fail(`sound-set: bad set file: entry ${index} needs a design`, 1);
  }
  if (!SAFE_NAME.test(entry.name)) {
    fail(`sound-set: bad set file: bad name ${entry.name}`, 1);
  }
  if (seen.has(entry.name)) {
    fail(`sound-set: bad set file: duplicate name ${entry.name}`, 1);
  }
  seen.add(entry.name);
}

const earshot = resolve(process.env.EARSHOT_BIN ?? join(ROOT, '.venv-earshot', 'bin', 'earshot'));
try {
  accessSync(earshot, fsConstants.X_OK);
} catch {
  fail(`sound-set: earshot not found at ${earshot}; run scripts/sound-setup.sh`, 1);
}

const outDir = resolve(ROOT, 'sounds', set);
mkdirSync(outDir, { recursive: true });

for (const { name, design } of sounds) {
  const out = join(outDir, `${name}.ogg`);
  // Remove any earlier file so a stale target cannot satisfy the post-render check.
  rmSync(out, { force: true });
  const child = spawnSync(earshot, ['make', '--sound', design, '-o', out], { encoding: 'utf8' });
  if (child.status !== 0) {
    fail(`sound-set: earshot failed for ${name} (${design}) with exit ${child.status}`, 1);
  }
  if (!existsSync(out)) {
    fail(`sound-set: earshot wrote no file for ${name} (${design}): ${out}`, 1);
  }
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stdout.write(child.stderr);
  process.stdout.write(`sound-set: ${name}.ogg <- ${design}\n`);
}
process.stdout.write(`sound-set: ${sounds.length} sounds -> sounds/${set}\n`);
