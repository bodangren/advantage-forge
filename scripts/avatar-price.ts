/**
 * Fills the computed columns of docs/avatar-catalog.tsv: triangles (out/<id>/stats.json), rating
 * (latest review_score in bench/sonnet/log.tsv, 0 or blank = unrated), and price
 * (src/apk3d/avatar/price.ts). The hand-set columns are kept: id, slot, tier, two_handed, status,
 * override. A number in `override` replaces the computed price.
 *
 *   node --import tsx scripts/avatar-price.ts          # rewrite the table
 *   node --import tsx scripts/avatar-price.ts --check  # exit 1 if the table is out of date
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { avatarPrice, type AvatarSlot } from '../src/apk3d/avatar/price.js';

const CATALOG = 'docs/avatar-catalog.tsv';
const HEADER = ['id', 'slot', 'tier', 'two_handed', 'status', 'override', 'triangles', 'rating', 'price'];

function readRatings(): Map<string, number> {
  const ratings = new Map<string, number>();
  const lines = readFileSync('bench/sonnet/log.tsv', 'utf8').trim().split('\n').slice(1);
  for (const line of lines) {
    const cols = line.split('\t');
    const score = Number(cols[9]);
    if (!Number.isFinite(score) || score <= 0) continue;
    for (const id of (cols[1] ?? '').split('+')) ratings.set(id, score); // later rows win
  }
  return ratings;
}

function readTriangles(id: string): number | null {
  const path = `out/${id}/stats.json`;
  if (!existsSync(path)) return null;
  const triangles = (JSON.parse(readFileSync(path, 'utf8')) as { triangles?: number }).triangles;
  return typeof triangles === 'number' ? triangles : null;
}

const ratings = readRatings();
const rows = readFileSync(CATALOG, 'utf8').trim().split('\n').slice(1).map((line) => line.split('\t'));
const out = [HEADER.join('\t')];
for (const [id, slot, tier, twoHanded, status, override] of rows) {
  const triangles = readTriangles(id);
  const rating = ratings.get(id) ?? null;
  const computed = avatarPrice({ slot: slot as AvatarSlot, tier: Number(tier), triangles, rating });
  const price = override ? Number(override) : computed;
  out.push([id, slot, tier, twoHanded, status, override ?? '', triangles ?? '', rating ?? '', price].join('\t'));
}
const text = `${out.join('\n')}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(CATALOG, 'utf8') !== text) {
    console.error(`${CATALOG} is out of date: run scripts/avatar-price.ts`);
    process.exit(1);
  }
} else {
  writeFileSync(CATALOG, text);
  console.log(`wrote ${rows.length} rows to ${CATALOG}`);
}
