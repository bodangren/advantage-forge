#!/usr/bin/env node
// Sets one character's entry in docs/character-reviews.json, safely while other agents do the
// same: a lock directory serializes the read-modify-write.
//
//   node scripts/set-review.mjs <name> <entry.json>
//
// <entry.json> holds the entry: { overall, group?, scores, summary, strengths, issues, next }.
// `reviewedAt` is set to now.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REVIEWS = path.join(ROOT, 'docs', 'character-reviews.json');
const LOCK = path.join(ROOT, 'docs', '.character-reviews.lock');

const [name, file] = process.argv.slice(2);
if (!name || !file) {
  console.error('usage: node scripts/set-review.mjs <name> <entry.json>');
  process.exit(2);
}
const entry = JSON.parse(fs.readFileSync(file, 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; ; i++) {
  try {
    fs.mkdirSync(LOCK);
    break;
  } catch {
    // A lock older than 30 s was left by a crashed writer.
    try {
      if (Date.now() - fs.statSync(LOCK).mtimeMs > 30000) fs.rmdirSync(LOCK);
    } catch {}
    if (i > 300) throw new Error('could not take the review lock');
    await sleep(100);
  }
}
try {
  const reviews = JSON.parse(fs.readFileSync(REVIEWS, 'utf8'));
  const before = reviews[name]?.overall;
  reviews[name] = { ...entry, reviewedAt: new Date().toISOString().replace(/\.\d+Z$/, '+00:00') };
  const tmp = `${REVIEWS}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(reviews, null, 2) + '\n');
  fs.renameSync(tmp, REVIEWS);
  console.log(`${name}: ${before ?? 'new'} -> ${entry.overall}`);
} finally {
  fs.rmdirSync(LOCK);
}
