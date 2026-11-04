#!/usr/bin/env node
// Storytime L2 unit 1 judge kit builder (T3a, 2026-11-04).
//
// Builds the calibration set for the one Sonnet judge that replaces the FR-9 MiniMax + Kimi
// pre-checks (Daniel, 11-03, PM relay; Daniel's word 2026-11-04 14:54 ICT). The kit:
//   - print-size copies of every judge file in out/storytime-review/judge/cal/<group>/;
//   - docs/storytime/l2-unit1/judge/calibration-set.json (id, group, kind, source path, source
//     SHA-256, judgeFile, judge width x height, page text, use, expected, reason);
//   - one batch file per group, docs/storytime/l2-unit1/judge/batch-<group>.json, with only
//     judgeFile, id, kind, use, and page text (the expected values stay out of the batch);
//   - small cast sheet copies in out/storytime-review/judge/cast/ and cast.json.
//
// Printed size (recorded rule): the Workbooks print data folder
// /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/ holds no printed box sizes
// (pictures.json rows carry the file pixel sizes only). The step fallback applies: a 900 px long
// side for story pages and the cover, a 360 px long side for check rows, practice lines, and
// other cards.
//
// Page text comes from the read-only Workbooks list
// /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json (version 5;
// SHA-256 69d89c4baa4b60f02276e03e807e193b3caeb83cf770e0be6f9a1cad99116999).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const UNIT_ROOT = join(ROOT, 'out/storytime/l2/unit1');
const JUDGE_ROOT = join(ROOT, 'out/storytime-review/judge');
const DOCS_DIR = join(ROOT, 'docs/storytime/l2-unit1/judge');
const LIST = join(process.env.HOME, 'Desktop/Workbooks/content/storytime/l2/print/pictures.json');
const LIST_SHA256 = '69d89c4baa4b60f02276e03e807e193b3caeb83cf770e0be6f9a1cad99116999';
const LIST_VERSION = '5';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const LONG_SIDE_STORY = 900;
const LONG_SIDE_CARD = 360;

// The A-48 redraw list of 2026-11-04 (handoff picture-list.md, SHA-256
// dad8b49efbaf8ebdf0308e50dba971759293913ce8c8ab52694b25f886c419d9). These ids leave the
// must-pass set; the judge reports them instead of passing or failing them.
const REPORT_IDS = [
  'l2-w01-story-page-a-nest',
  'l2-w01-story-page-a-nut',
  'l2-w01-story-page-a-nest-and-a-nut',
  'l2-w01-practice-line-nose',
  'l2-w01-check-row-nose',
  'l2-w04-check-row-milk',
  'l2-w02-check-row-alligator',
  'l2-w07-check-row-olive',
  'l2-w06-check-row-ten',
  'l2-w07-story-page-the-top-on-a-pot',
  'l2-w03-story-page-a-pan-on-a-pan',
  'l2-w03-story-page-a-pan-in-a-pan',
  'l2-w01-story-page-a-neck',
  'l2-w01-story-page-hello-i-am-pip',
  'l2-w02-story-page-how-many-balls-five',
  'l2-w04-story-page-this-is-pam',
  'l2-w05-story-page-i-have-four-legs',
  'l2-w06-story-page-tap-tap-tap',
  'l2-w06-story-page-tap-tap-tap-b',
  'l2-w06-story-page-he-can-see-pip',
];
const REPORT_REASON = 'A-48 redraw list item; leaves the must-pass set (expected report)';

// Named-defect files. Two are the gate controls (expected fail). The third is a report item.
// The PM decision of 2026-11-04: the judge must fail the two control files and only report on
// the m3 color file of nan-can-get-a-pan.
//   control 1: a-nose v1 line art (no nose);
//   control 2: nan-can-get-a-pan m3 line try 1 (no pan handle, finding B43-PAN-2);
//   report:    nan-can-get-a-pan m3 color (the pan reads as a magnifying glass; judge may pass or fail it).
const FAILS = [
  {
    id: 'l2-w01-story-page-a-nose',
    kind: 'line',
    group: 'w01',
    source: 'out/storytime/l2/unit1/w01/delivery-muse-v1/l2-w01-story-page-a-nose-line-v1.png',
    expected: 'fail',
    reason: "Daniel's named defect: a-nose v1 line art has no nose (gate control 1)",
  },
  {
    id: 'l2-w03-story-page-nan-can-get-a-pan',
    kind: 'line',
    group: 'w03',
    source: 'out/storytime/l2/unit1/w03/muse/l2-w03-story-page-nan-can-get-a-pan-m3-line.png',
    expected: 'fail',
    reason: "Daniel's named defect, finding B43-PAN-2: m3 line try 1 has no pan handle (gate control 2)",
  },
  {
    id: 'l2-w03-story-page-nan-can-get-a-pan',
    kind: 'color',
    group: 'w03',
    source: 'out/storytime/l2/unit1/w03/muse/l2-w03-story-page-nan-can-get-a-pan-m3-color.png',
    expected: 'report',
    reason: 'PM decision 2026-11-04: m3 color file of the pan story page is a report item, not a control',
  },
];

// Cast sheets for the judge: name, source reference, and a short note on identity.
const CAST = [
  { name: 'nan', source: 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png', note: 'Nan: girl, black-brown hair, two round buns with red ring bands, orange T-shirt' },
  { name: 'pip', source: 'out/storytime/l2/unit1/w04/muse/elements/pip-ref-render.png', note: 'Pip: puppy, golden-brown fur, cream chest and muzzle, floppy ears, red collar with gold tag' },
  { name: 'tom', source: 'out/storytime/l2/unit1/w04/muse/elements/cast-tom-sheet-m3-color.png', note: 'Tom: boy' },
  { name: 'ben', source: 'out/storytime/l2/unit1/w01/muse/elements/ben-ref-clean-2.png', note: 'Ben: boy' },
  { name: 'may', source: 'out/storytime/l2/unit1/w07/muse/elements/may-ref-render.png', note: 'May: girl' },
  { name: 'sam', source: 'out/storytime/l2/unit1/w05/muse/elements/sam-ref-render.png', note: 'Sam: boy' },
  { name: 'pat', source: 'out/sprout-pat/render.png', note: 'Pat: boy with teddy' },
  { name: 'pam-doll', source: 'out/storytime/l2/unit1/w04/muse/elements/prop-doll-pam-sheet-m1-color.png', note: 'Pam: the doll' },
];
const BOYS = ['tom', 'sam']; // the 2 boys of audit E35 ("He can see Pip!"): Sam and Tom

const readList = () => {
  const buf = readFileSync(LIST);
  const got = sha256(buf);
  if (got !== LIST_SHA256) {
    console.error(`list sha256 mismatch: got ${got}, want ${LIST_SHA256}`);
    process.exit(2);
  }
  const rows = JSON.parse(buf.toString('utf8'));
  const byId = new Map();
  for (const r of rows) {
    if (byId.has(r.id)) {
      console.error(`duplicate list id: ${r.id}`);
      process.exit(2);
    }
    byId.set(r.id, { text: r.text, use: r.use });
  }
  return { byId, rows };
};

// The long side for a use: 900 for story pages and the cover, 360 for cards.
const longSideOf = (use) => (use === 'story-page' || use === 'cover' ? LONG_SIDE_STORY : LONG_SIDE_CARD);

// One judge entry: a source picture and its print-size copy.
const makeEntry = async (id, kind, group, source, use, text, expected, reason) => {
  const abs = join(ROOT, source);
  const src = readFileSync(abs);
  const stem = basename(source).replace(/\.png$/, '');
  const outDir = join(JUDGE_ROOT, 'cal', group);
  mkdirSync(outDir, { recursive: true });
  const judgeFile = `out/storytime-review/judge/cal/${group}/${stem}.png`;
  const target = longSideOf(use);
  const resized = await sharp(src).resize({ width: target, height: target, fit: 'inside', withoutEnlargement: false }).png({ compressionLevel: 9 }).toBuffer();
  const m = await sharp(resized).metadata();
  writeFileSync(join(ROOT, judgeFile), resized);
  return {
    id,
    group,
    kind,
    source,
    sourceSha256: sha256(src),
    judgeFile,
    judgeSize: `${m.width}x${m.height}`,
    pageText: text ?? '',
    use,
    expected,
    reason,
  };
};

// Enumerate the delivered files of one manifest. The cover job has no line twin.
const manifestEntries = (manifestPath, group, byId) => {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const out = [];
  for (const job of m.jobs) {
    const info = byId.get(job.id);
    const use = info?.use ?? job.use ?? 'story-page';
    for (const c of job.candidates ?? []) {
      if (c.status !== 'ready' || !c.file) continue;
      out.push({ id: job.id, kind: 'color', file: c.file, use, text: info?.text ?? '', group });
      const la = c.lineArt;
      if (la?.file && la.status === 'ready') out.push({ id: job.id, kind: 'line', file: la.file, use, text: info?.text ?? '', group });
    }
  }
  return out;
};

const main = async () => {
  const { byId, rows } = readList();
  const listInfo = { version: LIST_VERSION, sha256: LIST_SHA256, path: LIST, rows: rows.length };

  const want = [];
  const pushManifest = (p, group) => {
    const abs = join(ROOT, p);
    if (!existsSync(abs)) {
      console.error(`missing manifest: ${abs}`);
      process.exit(1);
    }
    want.push(...manifestEntries(abs, group, byId));
  };
  pushManifest('out/storytime/l2/unit1/w01/delivery-muse-v2/manifest.json', 'w01');
  for (let w = 2; w <= 7; w++) pushManifest(`out/storytime/l2/unit1/w0${w}/delivery-muse-v1/manifest.json`, `w0${w}`);
  pushManifest('out/storytime/l2/unit1/cover/delivery-muse-v1/manifest.json', 'cover');

  // Pass entries: every delivered color and line file, minus the A-48 report ids.
  const pass = want
    .filter((e) => !REPORT_IDS.includes(e.id))
    .map((e) => ({ ...e, source: `out/storytime/l2/unit1/${e.group}/delivery-muse-v1/${e.file}` }));
  // Week 1 delivery-muse-v2: the v2 folder name replaces delivery-muse-v1.
  for (const e of pass) {
    if (e.group === 'w01') e.source = `out/storytime/l2/unit1/w01/delivery-muse-v2/${e.file}`;
  }
  // Report entries: the A-48 ids (color and line) from the same deliveries.
  const report = want
    .filter((e) => REPORT_IDS.includes(e.id))
    .map((e) => ({ ...e, source: `out/storytime/l2/unit1/${e.group}/delivery-muse-v1/${e.file}` }));
  for (const e of report) {
    if (e.group === 'w01') e.source = `out/storytime/l2/unit1/w01/delivery-muse-v2/${e.file}`;
  }

  const cover = pass.find((e) => e.group === 'cover');
  if (cover) cover.source = 'out/storytime/l2/unit1/cover/delivery-muse-v1/l2-cover-v1.png';

  const entries = [];
  for (const e of pass) entries.push(await makeEntry(e.id, e.kind, e.group, e.source, e.use, e.text, 'pass', 'Daniel-approved delivery (person reviews 2026-11-02/03); must stay pass'));
  for (const e of report) entries.push(await makeEntry(e.id, e.kind, e.group, e.source, e.use, e.text, 'report', REPORT_REASON));
  for (const f of FAILS) {
    const info = byId.get(f.id);
    entries.push(await makeEntry(f.id, f.kind, f.group, f.source, info?.use ?? 'story-page', info?.text ?? '', f.expected, f.reason));
  }

  // Each judge file must be unique.
  const seenFiles = new Set();
  for (const e of entries) {
    if (seenFiles.has(e.judgeFile)) {
      console.error(`duplicate judgeFile: ${e.judgeFile}`);
      process.exit(1);
    }
    seenFiles.add(e.judgeFile);
  }

  // Group sizes and batch files. No group may pass 70 judge files.
  const byGroup = new Map();
  for (const e of entries) {
    if (!byGroup.has(e.group)) byGroup.set(e.group, []);
    byGroup.get(e.group).push(e);
  }
  mkdirSync(DOCS_DIR, { recursive: true });
  for (const [g, list] of byGroup) {
    if (list.length > 70) {
      console.error(`group ${g} has ${list.length} files, over 70; split needed`);
      process.exit(1);
    }
    const batch = list.map(({ judgeFile, id, kind, use, pageText }) => ({ judgeFile, id, kind, use, pageText }));
    writeFileSync(join(DOCS_DIR, `batch-${g}.json`), JSON.stringify(batch, null, 2) + '\n');
  }

  const ordered = entries.sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));
  writeFileSync(
    join(DOCS_DIR, 'calibration-set.json'),
    JSON.stringify({ list: listInfo, pictureListSha256: LIST_SHA256, entries: ordered }, null, 2) + '\n',
  );

  // Cast sheets: small copies for the judge.
  const castOut = join(JUDGE_ROOT, 'cast');
  mkdirSync(castOut, { recursive: true });
  const castList = [];
  for (const c of CAST) {
    const buf = readFileSync(join(ROOT, c.source));
    const resized = await sharp(buf).resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
    const file = `out/storytime-review/judge/cast/${c.name}.png`;
    writeFileSync(join(ROOT, file), resized);
    castList.push({ name: c.name, source: c.source, sourceSha256: sha256(buf), file, note: c.note });
  }
  for (const b of BOYS) {
    const hit = castList.find((c) => c.name === b);
    if (hit) hit.role = 'one of the 2 boys of "He can see Pip!" (audit E35)';
  }
  writeFileSync(join(DOCS_DIR, 'cast.json'), JSON.stringify({ cast: castList }, null, 2) + '\n');

  for (const [g, list] of byGroup) console.log(`group ${g}: ${list.length} judge files`);
  console.log(`entries total: ${entries.length}`);
  console.log(`list rows: ${listInfo.rows} sha256: ${listInfo.sha256} version: ${listInfo.version}`);
  console.log(`judge set: pass`);
};

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});

