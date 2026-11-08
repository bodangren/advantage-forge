// Read-only re-check at 91de1d1. Run from the repo root: node <this>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base = 'docs/storytime/l2-unit2';
const all = {};
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) { const s = JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8')); all[s.id] = s; }
}
const list = Object.values(all);
console.log('specs', list.length, 'new', list.filter((s) => !s.reuse).length, 'reuse', list.filter((s) => s.reuse).length);
// F1
const noFace = list.filter((s) => /no eyes and no face/.test(s.colorPrompt) || /no eyes and no face/.test(s.linePrompt)).filter((s) => ['doll', 'duck', 'elephant', 'horse', 'goat', 'dad', 'girl', 'foot'].includes(s.text));
console.log('F1: face words with "no eyes and no face":', noFace.map((s) => s.id));
for (const w of ['doll', 'duck', 'elephant', 'horse', 'goat']) {
  const s = list.find((x) => x.use === 'check-row' && x.text === w && !x.reuse);
  console.log('=====', s.id, 'reuse', JSON.stringify(s.reuse), 'refs', s.references.length);
  console.log('COLOR:', s.colorPrompt);
  console.log('LINE:', s.linePrompt);
}
const busLine = list.filter((s) => /bus body/.test(s.linePrompt) && s.text !== 'bus');
console.log('bus sentence outside bus rows:', busLine.length);
// objects without face still object rule
const van = list.find((s) => s.id === 'l2-w10-check-row-van');
console.log('van: noFace color/line', /no eyes and no face/.test(van.colorPrompt), /no eyes and no face/.test(van.linePrompt));
// F6: element ids vs outputs
const outs = new Set();
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  const d = path.join(base, w, 'muse-elements');
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) {
    const s = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
    const o = s.outDir + '/' + s.id + '-m1-color.png';
    outs.add(o);
    console.log('element', f, 'id', s.id, 'id==file', s.id + '.json' === f, '->', o.split('/').pop());
  }
}
console.log('element outputs', outs.size);
const miss = [];
for (const s of list) for (const r of s.references) if (!fs.existsSync(r) && !outs.has(r)) miss.push(s.id + ' ' + r);
console.log('refs neither on disk nor element output (by spec id):', miss.length, miss.slice(0, 5));
const hen = list.filter((s) => s.references.some((r) => /prop-hen/.test(r)));
console.log('hen rows', hen.length, [...new Set(hen.flatMap((s) => s.references.filter((r) => /prop-hen/.test(r))))]);
const els = JSON.parse(fs.readFileSync(base + '/elements.json', 'utf8'));
console.log('elements.json prop-hen path:', JSON.stringify(els.elements['prop-hen-sheet'] || els.elements['prop-hen']));
// misc regressions
const forb = /skin colou?r|skin tone|complexion|ethnic|\brace\b|racial/i;
console.log('forbidden', list.filter((s) => forb.test(JSON.stringify(s))).length, 'no-letters missing', list.filter((s) => !/no letters/i.test(s.colorPrompt)).length, 'aspect/outDir bad', list.filter((s) => (s.sizeClass === 'C' ? s.aspect !== '1:1' || s.printSize?.join('x') !== '1500x1500' : s.aspect !== '4:3') || !s.outDir.startsWith('out/storytime/l2/unit2/')).length);
console.log('Pat/cargo text in cards', list.filter((s) => /Pat's hair|cargo-shorts/.test(s.linePrompt)).length);
const H = '/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep';
const tsv = fs.readFileSync(H + '/elements-reused.tsv', 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
let bad = 0;
for (const [h, p] of tsv) if (!fs.existsSync(p) || crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== h) bad++;
console.log('elements-reused rows', tsv.length, 'sha bad', bad);
console.log('reuse src missing', list.filter((s) => s.reuse && !fs.existsSync(s.reuse.source)).length);
console.log(fs.readFileSync(H + '/README.md', 'utf8').split('\n').slice(4, 24).join('\n'));
console.log('handoff specs', fs.readdirSync(H + '/specs').length, 'elements', fs.readdirSync(H + '/specs/elements').length, 'renders', fs.readdirSync(H + '/renders').length, 'prompt-list lines', fs.readFileSync(H + '/prompt-list.tsv', 'utf8').trim().split('\n').length);
