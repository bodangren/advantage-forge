// Checker probe, Phase 1: the ten rows through deliverMuseUnit2 with the real rows.json and the
// real, pinned picture list cut to the two ten rows. Fixture prints only; output in /tmp/opencode.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PICTURE_SIZES } from '../../../src/storytime/book-pictures.js';
import { UNIT2_LIST_FILE, UNIT2_LIST_SHA256, deliverMuseUnit2, reuseSourcesOf } from '../../../src/storytime/muse-delivery-u2.js';

const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');
const REPO = process.cwd();
mkdirSync('/tmp/opencode', { recursive: true });
const root = mkdtempSync('/tmp/opencode/ten-probe-');
const W10 = 'l2-w10-check-row-ten';
const W11 = 'l2-w11-check-row-ten';

const listText = readFileSync(UNIT2_LIST_FILE, 'utf8');
console.log('list pin ok:', sha(listText) === UNIT2_LIST_SHA256);
const parsed = JSON.parse(listText);
const all = Array.isArray(parsed) ? parsed : parsed.rows;
console.log('list rows:', all.length);
const subset = all.filter((r: { id: string }) => r.id === W10 || r.id === W11);
console.log('subset ids:', subset.map((r: { id: string }) => r.id).join(','));
const subsetText = `${JSON.stringify(subset, null, 2)}\n`;
const listFile = path.join(root, 'list.json');
writeFileSync(listFile, subsetText);
const pin = sha(subsetText);

const rowsDoc = JSON.parse(readFileSync(path.join(REPO, 'docs/storytime/l2-unit2/rows.json'), 'utf8'));
const map = reuseSourcesOf(rowsDoc.rows);
const kinds: Record<string, number> = {};
for (const v of map.values()) kinds[v.kind ?? 'none'] = (kinds[v.kind ?? 'none'] ?? 0) + 1;
console.log('reuse rows:', map.size, JSON.stringify(kinds), 'new rows:', rowsDoc.rows.length - map.size, 'total:', rowsDoc.rows.length);
console.log('w10 ten reuse:', JSON.stringify(rowsDoc.rows.find((r: { id: string }) => r.id === W10).reuse));
console.log('w11 ten reuse:', JSON.stringify(rowsDoc.rows.find((r: { id: string }) => r.id === W11).reuse));

const size = PICTURE_SIZES.small;
const color = await sharp({ create: { width: size.width, height: size.height, channels: 3, background: '#88ccff' } }).png().toBuffer();
const px = Buffer.alloc(size.width * size.height, 255);
const t = 80;
const frame = 60;
const right = size.width - t;
for (let y = 0; y < frame; y++) {
  px.fill(0, (t + y) * size.width + t, (t + y) * size.width + right);
  px.fill(0, (size.height - t - 1 - y) * size.width + t, (size.height - t - 1 - y) * size.width + right);
}
for (let y = t; y < size.height - t; y++) {
  px.fill(0, y * size.width + t, y * size.width + t + frame);
  px.fill(0, y * size.width + right - frame, y * size.width + right);
}
const line = await sharp(px, { raw: { width: size.width, height: size.height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
const muse = path.join(root, 'muse');
mkdirSync(muse, { recursive: true });
writeFileSync(path.join(muse, `${W10}-m1-color-print.png`), color);
writeFileSync(path.join(muse, `${W10}-m1-line-print.png`), line);
const entry = { rowId: W10, version: 1, colorPrint: `${W10}-m1-color-print.png`, linePrint: `${W10}-m1-line-print.png` };

const results: string[] = [];
// A: current rows, with an approval for the w10 ten row only.
{
  const deliveryRoot = path.join(root, 'delivery-a');
  const skipped: string[] = [];
  try {
    const m = await deliverMuseUnit2({ listFile, pictureListPin: pin, approvals: { version: 1, entries: [entry] }, rows: path.join(REPO, 'docs/storytime/l2-unit2/rows.json'), repoRoot: REPO, museRoot: muse, deliveryRoot, onSkip: (id) => skipped.push(id) });
    const ids = m.jobs.map((j) => j.id).sort();
    const same =
      sha(readFileSync(path.join(deliveryRoot, `${W11}-v1.png`))) === sha(color) &&
      sha(readFileSync(path.join(deliveryRoot, `${W11}-line-v1.png`))) === sha(line) &&
      sha(readFileSync(path.join(deliveryRoot, `${W10}-v1.png`))) === sha(color);
    results.push(`A current rows + w10 approval: PASS=${ids.join('|') === [W10, W11].sort().join('|') && same && skipped.length === 0} jobs=${ids.join(',')} skipped=${skipped.length} w11-equals-w10-prints=${same}`);
  } catch (e) {
    results.push(`A current rows + w10 approval: FAIL threw ${(e as Error).message}`);
  }
}
// B: current rows, no approval for w10: the write must stop and name both rows.
{
  const deliveryRoot = path.join(root, 'delivery-b');
  try {
    await deliverMuseUnit2({ listFile, pictureListPin: pin, approvals: { version: 1, entries: [] }, rows: path.join(REPO, 'docs/storytime/l2-unit2/rows.json'), repoRoot: REPO, museRoot: muse, deliveryRoot, onSkip: () => {} });
    // w10 has reuse null and no entry -> skip (not a stop); w11 earlier-row has no entry -> stop expected.
    results.push('B no approval: FAIL did not stop');
  } catch (e) {
    const msg = (e as Error).message;
    results.push(`B no approval stops: PASS=${msg.includes(W10) && msg.includes(W11) && !existsSync(deliveryRoot)} nothing-written=${!existsSync(deliveryRoot)} msg=${msg.split('\n').slice(1, 3).join(' / ').slice(0, 220)}`);
  }
}
// C: base rows.json (5ebb3db1) for contrast: the unit 1 reuse source with 10 px lines.
{
  const baseRows = execFileSync('git', ['show', '5ebb3db1:docs/storytime/l2-unit2/rows.json'], { cwd: REPO, encoding: 'utf8' });
  const baseFile = path.join(root, 'rows-base.json');
  writeFileSync(baseFile, baseRows);
  const deliveryRoot = path.join(root, 'delivery-c');
  try {
    await deliverMuseUnit2({ listFile, pictureListPin: pin, approvals: { version: 1, entries: [] }, rows: baseFile, repoRoot: REPO, museRoot: muse, deliveryRoot, onSkip: () => {} });
    results.push('C base rows (info): delivery passed');
  } catch (e) {
    results.push(`C base rows (info): stopped :: ${(e as Error).message.split('\n').slice(0, 3).join(' / ').slice(0, 260)}`);
  }
}
for (const r of results) console.log(r);
