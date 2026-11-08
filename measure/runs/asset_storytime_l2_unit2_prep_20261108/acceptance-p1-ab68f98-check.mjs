// Read-only checker script for the phase acceptance. Run: node <this file> (from the repo root).
import fs from 'node:fs';
import path from 'node:path';
const rows = JSON.parse(fs.readFileSync('/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json', 'utf8'));
const list = Array.isArray(rows) ? rows : rows.pictures || rows.rows || Object.values(rows)[0];
console.log('rows', list.length);
const base = 'docs/storytime/l2-unit2';
const elemOut = new Set();
for (const w of fs.readdirSync(base)) {
  const d = path.join(base, w, 'muse-elements');
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) {
    const s = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
    console.log('elem', w, f, s.outDir);
  }
}
const specs = [];
const bad = [];
for (const r of list) {
  const wk = String(r.week).padStart(2, '0');
  const p = path.join(base, 'w' + wk, 'muse', r.id + '.json');
  if (!fs.existsSync(p)) { bad.push('missing ' + r.id); continue; }
  specs.push([r, JSON.parse(fs.readFileSync(p, 'utf8')), p]);
}
console.log('found', specs.length, 'bad', bad.slice(0, 5));
const nfiles = fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x)).reduce((a, w) => a + fs.readdirSync(path.join(base, w, 'muse')).length, 0);
console.log('files in muse dirs', nfiles);
const forb = /skin colou?r|skin tone|complexion|ethnic|\brace\b|racial/i;
const fb = []; const od = []; let ord = 0;
list.forEach((r, i) => {
  const x = specs[i]; if (!x) return; const s = x[1];
  if (s.id !== r.id) ord++;
  if (!String(s.outDir).startsWith('out/storytime/l2/unit2/')) od.push(r.id);
  if (forb.test(JSON.stringify(s))) fb.push(r.id);
});
console.log('order mismatch', ord, 'outDir bad', od.length, 'forbidden', fb.slice(0, 10));
const missing = [];
const allElemOut = new Set();
for (const w of fs.readdirSync(base)) {
  const d = path.join(base, w, 'muse-elements');
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) {
    const s = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
    allElemOut.add(s.outDir);
  }
}
console.log('element outDirs', [...allElemOut]);
for (const [r, s] of specs) {
  for (const ref of s.references || []) {
    const rp = typeof ref === 'string' ? ref : ref.path || ref.file;
    if (!rp) continue;
    if (!fs.existsSync(rp)) missing.push(r.id + ' ' + rp);
  }
}
console.log('missing refs', missing.length, [...new Set(missing.map((x) => x.split(' ')[1]))].slice(0, 20));
console.log('keys', JSON.stringify(Object.keys(specs[0][1])));
console.log('ref0', JSON.stringify(specs[0][1].references));
const noLetters = specs.filter(([, s]) => !/no (letters|text)|letters, words, or numbers/i.test(s.colorPrompt || '')).map(([r]) => r.id);
console.log('colorPrompt lacking no-letters rule', noLetters.length, noLetters.slice(0, 5));
const aspectBad = specs.filter(([r, s]) => (r.sizeClass === 'C' ? s.aspect !== '1:1' : s.aspect !== '4:3')).map(([r]) => r.id);
console.log('aspect bad', aspectBad.length);
const uses = {};
for (const [r] of specs) uses[r.use] = (uses[r.use] || 0) + 1;
console.log('uses', JSON.stringify(uses));
