// Checker probe (r3): the earlier-row reuse of l2-w14-check-row-fan, with the REAL list, the REAL
// rows.json, and the REAL unit 1 reuse files. Fixtures (the w10 fan prints) are generated in a
// probe folder below measure/runs. No network call, no key. Run: ./node_modules/.bin/tsx <this file>
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { deliverMuseUnit2, UNIT2_LIST_FILE } from '../../../src/storytime/muse-delivery-u2.ts';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const BASE = resolve(ROOT, 'measure/runs/asset_storytime_l2_unit2_tooling_20261108/probe-earlier-row');
const MUSE = resolve(BASE, 'muse');
const OUT_OK = resolve(BASE, 'delivery-ok');
const OUT_MISSING = resolve(BASE, 'delivery-missing');
await rm(BASE, { recursive: true, force: true });
await mkdir(MUSE, { recursive: true });

const list = JSON.parse(readFileSync(UNIT2_LIST_FILE, 'utf8'));
const rows: any[] = Array.isArray(list) ? list : list.rows;
const fan10 = rows.find((r) => r.id === 'l2-w10-check-row-fan');
const fan14 = rows.find((r) => r.id === 'l2-w14-check-row-fan');
console.log('list rows', rows.length, 'fan10', fan10?.width, fan10?.height, 'fan14', fan14?.width, fan14?.height);

const { width, height } = fan10;
const color = await sharp({ create: { width, height, channels: 3, background: '#aaddff' } }).png().toBuffer();
const px = Buffer.alloc(width * height, 255);
for (let y = 80; y < 140; y++) px.fill(0, y * width + 80, y * width + width - 80);
const line = await sharp(px, { raw: { width, height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
await writeFile(resolve(MUSE, 'l2-w10-check-row-fan-m1-color-print.png'), color);
await writeFile(resolve(MUSE, 'l2-w10-check-row-fan-m1-line-print.png'), line);
const entry = { rowId: 'l2-w10-check-row-fan', version: 1, colorPrint: 'l2-w10-check-row-fan-m1-color-print.png', linePrint: 'l2-w10-check-row-fan-m1-line-print.png' };

let fail = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`);
};

// Case A: the w10 fan entry exists. All 48 reuse rows must deliver.
const skipped: string[] = [];
try {
  const manifest = await deliverMuseUnit2({
    approvals: { version: 1, entries: [entry] } as any,
    repoRoot: ROOT,
    museRoot: MUSE,
    deliveryRoot: OUT_OK,
    onSkip: (id) => skipped.push(id),
  });
  const files = await readdir(OUT_OK);
  check('A: delivery wrote', true, `files ${files.length} jobs ${manifest.jobs.length} skipped ${skipped.length}`);
  check('A: 49 jobs (48 reuse + the w10 fan entry)', manifest.jobs.length === 49, String(manifest.jobs.length));
  check('A: skipped = 229 - 49', skipped.length === rows.length - 49, String(skipped.length));
  check('A: w14 fan color = w10 fan color print', (await readFile(resolve(OUT_OK, fan14.fileName))).equals(color));
  check('A: w14 fan line = w10 fan line print', (await readFile(resolve(OUT_OK, fan14.lineArtFileName))).equals(line));
  check('A: w10 fan delivered too', existsSync(resolve(OUT_OK, fan10.fileName)));
  const dog = rows.find((r) => r.id === 'l2-w09-check-row-dog');
  const src = readFileSync(resolve(ROOT, 'out/storytime/l2/unit1/w06/delivery-muse-v1/l2-w06-check-row-dog-v1.png'));
  check('A: unit 1 reuse dog = source bytes', (await readFile(resolve(OUT_OK, dog.fileName))).equals(src));
  check('A: manifest.json present', files.includes('manifest.json'));
} catch (e) {
  check('A: delivery ok', false, (e as Error).message.slice(0, 400));
}

// Case A2: the same, but the two reuse rows whose unit 1 line twin is 10 px thick (ten) get no reuse.
{
  const doc = JSON.parse(readFileSync(resolve(ROOT, 'docs/storytime/l2-unit2/rows.json'), 'utf8'));
  const all: any[] = Array.isArray(doc) ? doc : doc.rows;
  const drop = new Set(['l2-w10-check-row-ten', 'l2-w11-check-row-ten']);
  const rows2 = all.map((r) => (drop.has(r.id) ? { ...r, reuse: null } : r));
  const OUT2 = resolve(BASE, 'delivery-ok2');
  const sk: string[] = [];
  try {
    const manifest = await deliverMuseUnit2({
      approvals: { version: 1, entries: [entry] } as any,
      rows: { rows: rows2 },
      repoRoot: ROOT,
      museRoot: MUSE,
      deliveryRoot: OUT2,
      onSkip: (id) => sk.push(id),
    });
    check('A2: 47 jobs (46 reuse + w10 fan entry)', manifest.jobs.length === 47, String(manifest.jobs.length));
    check('A2: w14 fan color = w10 fan color print', (await readFile(resolve(OUT2, fan14.fileName))).equals(color));
    check('A2: w14 fan line = w10 fan line print', (await readFile(resolve(OUT2, fan14.lineArtFileName))).equals(line));
    check('A2: manifest.json present', existsSync(resolve(OUT2, 'manifest.json')));
  } catch (e) {
    check('A2: delivery ok', false, (e as Error).message.slice(0, 400));
  }
}

// Case B: no w10 fan entry. The write must stop and name both ids; nothing is written.
try {
  await deliverMuseUnit2({
    approvals: { version: 1, entries: [] } as any,
    repoRoot: ROOT,
    museRoot: MUSE,
    deliveryRoot: OUT_MISSING,
    onSkip: () => {},
  });
  check('B: write stopped', false, 'no error thrown');
} catch (e) {
  const m = (e as Error).message;
  console.log('B message:', m.replace(/\n/g, ' | ').slice(0, 500));
  check('B: stops with both ids', m.includes('l2-w14-check-row-fan') && m.includes('l2-w10-check-row-fan'));
  check('B: nothing written', !existsSync(OUT_MISSING));
}
console.log('FAILS', fail);
