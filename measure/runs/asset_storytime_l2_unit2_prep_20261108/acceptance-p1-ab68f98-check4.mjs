// Read-only: hand-off cross checks. Run from the repo root.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = 'docs/storytime/l2-unit2';
const H = '/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep';
const all = [];
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) all.push(JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8')));
}
const forge = new Set();
const u1el = new Set();
for (const s of all) for (const r of s.references || []) {
  if (/^out\/storytime\/l2\/unit1\//.test(r)) u1el.add(r);
  else if (!/^out\/storytime\/l2\/unit2\//.test(r)) forge.add(r);
}
console.log('forge refs', forge.size, [...forge].join(' '));
const rend = new Set(fs.readdirSync(H + '/renders'));
let miss = 0, shaBad = 0;
for (const r of forge) {
  const n = r.replace(/^out\//, '').split('/')[0] + '-' + path.basename(r);
  if (!rend.has(n)) { miss++; console.log('NOT IN renders', n); } else if (sha(r) !== sha(H + '/renders/' + n)) { shaBad++; console.log('SHA DIFF render', n); }
}
console.log('forge refs missing in renders', miss, 'sha mismatch', shaBad, 'renders in folder', rend.size);
console.log('unit1 element refs', u1el.size);
let el = 0, elBad = 0;
for (const line of fs.readFileSync(H + '/elements-reused.tsv', 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const [h, p] = line.split('\t'); el++;
  if (!fs.existsSync(p) || sha(p) !== h) { elBad++; console.log('ELEMENT BAD', p); }
}
console.log('elements-reused rows', el, 'bad', elBad);
const tsvPaths = new Set(fs.readFileSync(H + '/elements-reused.tsv', 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')[1]));
console.log('unit1 refs not in tsv', [...u1el].filter((r) => !tsvPaths.has(r)));
// reuse rows
const reuse = all.filter((s) => s.reuse);
console.log('reuse rows', reuse.length, 'sample', JSON.stringify(reuse[0].reuse));
let rm = 0;
for (const s of reuse) {
  const rp = typeof s.reuse === 'string' ? s.reuse : s.reuse.source || s.reuse.file || s.reuse.path;
  if (!rp || !fs.existsSync(rp)) { rm++; console.log('REUSE SRC MISSING', s.id, rp); }
}
console.log('reuse sources missing', rm);
// forbidden / claim words across track files
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(p); } };
walk(base); walk(H); walk('measure/tracks/asset_storytime_l2_unit2_prep_20261108'); walk('measure/runs/asset_storytime_l2_unit2_prep_20261108');
files.push('scripts/storytime-u2-specs.mjs', 'tests/storytime-u2-specs.test.ts');
const claim = /\b(daniel|pm|workbooks)\b[^.\n]{0,60}\b(accepted|approved|approve|accept)\b|\b(accepted|approved)\b[^.\n]{0,60}\b(daniel|workbooks)\b|\bgo\b.{0,10}(given|received|granted)/i;
for (const f of files) {
  if (/\.(png|jpg)$/.test(f) || f.includes('acceptance-p1-ab68f98')) continue;
  const t = fs.readFileSync(f, 'utf8');
  t.split('\n').forEach((l, i) => { if (/approv|accept/i.test(l) && /unit 2|picture|daniel|workbooks|pm\b/i.test(l)) console.log('CLAIMLINE', f + ':' + (i + 1), l.slice(0, 220)); });
}
