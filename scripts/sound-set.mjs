#!/usr/bin/env node
// Render one named sound set through the pinned earshot binary.
//
//   node scripts/sound-set.mjs <set>
//
// The set file is sounds/sets/<set>.json. The output folder is sounds/<set>/.
// SOUNDS_ROOT overrides the repository root. EARSHOT_BIN overrides the binary path.
import { spawnSync } from 'node:child_process';
import {
  accessSync,
  constants as fsConstants,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
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

// Both binaries are checked before any target preparation. Only a regular executable file
// qualifies, so a directory or a non-executable file fails closed with the exact diagnostic.
function isExecutableFile(path) {
  try {
    if (!statSync(path).isFile()) return false;
    accessSync(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

const earshot = resolve(process.env.EARSHOT_BIN ?? join(ROOT, '.venv-earshot', 'bin', 'earshot'));
if (!isExecutableFile(earshot)) {
  fail(`sound-set: earshot not found at ${earshot}; run scripts/sound-setup.sh`, 1);
}

// FFMPEG_BIN is an absolute path or a basename searched on PATH. An empty value is unset.
// Only absolute PATH entries are searched, so the working directory is never a candidate.
// The check runs once, before the first entry and before any target preparation.
const ffmpegInput = process.env.FFMPEG_BIN || 'ffmpeg';
function findFfmpeg(bin) {
  if (bin.includes('/')) return isExecutableFile(bin) ? bin : null;
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!isAbsolute(dir)) continue;
    const candidate = join(dir, bin);
    if (isExecutableFile(candidate)) return candidate;
  }
  return null;
}
const ffmpeg = findFfmpeg(ffmpegInput);
if (ffmpeg === null) fail(`sound-set: ffmpeg not found at ${ffmpegInput}; install ffmpeg`, 1);

const outDir = resolve(ROOT, 'sounds', set);
try {
  mkdirSync(outDir, { recursive: true });
} catch {
  // Share the prepare-output contract. Name the first entry so the line and exit stay exact.
  const first = sounds[0];
  const firstOut = join(outDir, `${first.name}.ogg`);
  fail(`sound-set: cannot prepare output for ${first.name} (${first.design}): ${firstOut}`, 1);
}

for (const { name, design } of sounds) {
  const out = join(outDir, `${name}.ogg`);
  const mp3 = join(outDir, `${name}.mp3`);
  // Check both targets before removing either. A blocked target leaves the other file in place
  // and stops the run before earshot starts. A stale file must not satisfy either post-render check.
  const targets = [out, mp3];
  let blockedPath;
  for (const target of targets) {
    try {
      if (lstatSync(target, { throwIfNoEntry: false })?.isDirectory()) blockedPath = target;
    } catch {
      blockedPath = target;
    }
    if (blockedPath) break;
  }
  if (blockedPath) fail(`sound-set: cannot prepare output for ${name} (${design}): ${blockedPath}`, 1);
  for (const target of targets) {
    try {
      // This call never uses recursive mode, so a directory and its contents stay intact.
      rmSync(target, { force: true });
    } catch {
      fail(`sound-set: cannot prepare output for ${name} (${design}): ${target}`, 1);
    }
  }

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

  const mp3Child = spawnSync(
    ffmpeg,
    [
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      out,
      '-map_metadata',
      '-1',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '96k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-write_xing',
      '0',
      '-id3v2_version',
      '0',
      '-write_id3v1',
      '0',
      '-fflags',
      '+bitexact',
      '-flags:a',
      '+bitexact',
      mp3,
    ],
    { encoding: 'utf8' },
  );
  if (mp3Child.status !== 0) {
    fail(`sound-set: ffmpeg failed for ${name} (${design}) with exit ${mp3Child.status}`, 1);
  }
  if (!existsSync(mp3)) {
    fail(`sound-set: ffmpeg wrote no file for ${name} (${design}): ${mp3}`, 1);
  }
  process.stdout.write(`sound-set: ${name}.mp3 <- ${design}\n`);
}
process.stdout.write(`sound-set: ${sounds.length} sounds -> sounds/${set}\n`);
