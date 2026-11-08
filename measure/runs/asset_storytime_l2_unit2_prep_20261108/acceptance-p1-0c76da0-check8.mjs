// Read-only re-check at 0c76da0. Run from the repo root: node <this>
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
const checks = list.filter((s) => s.use === 'check-row');
console.log('bus sentence in any linePrompt:', list.filter((s) => /bus body/.test(s.linePrompt) && !/bus/.test(s.text)).map((s) => s.id));
console.log('person linePrompt "one object":', checks.filter((s) => ['dad', 'girl', 'foot'].includes(s.text) && /of one object/.test(s.linePrompt)).map((s) => s.id));
const nf = checks.filter((s) => !s.reuse).map((s) => s.text.padEnd(9) + ' lineNoFace=' + /no eyes and no face/.test(s.linePrompt) + ' lineEyes=' + /pupil/.test(s.linePrompt) + ' form=' + (/one person/.test(s.linePrompt) ? 'person' : /one object/.test(s.linePrompt) ? 'object' : 'other') + ' colorNoFace=' + /no eyes and no face/.test(s.colorPrompt));
console.log(nf.join('\n'));
const show = (id, n = 1400) => { const s = all[id]; console.log('=====', id, '| reuse', JSON.stringify(s.reuse), '| refs', JSON.stringify(s.references)); console.log('GOAL:', s.goal); console.log('COLOR:', s.colorPrompt.slice(0, n)); console.log('LINE:', s.linePrompt); };
for (const id of ['l2-w10-check-row-dad', 'l2-w15-check-row-girl', 'l2-w14-check-row-foot', 'l2-w09-check-row-doll', 'l2-w09-check-row-duck', 'l2-w12-check-row-horse', 'l2-w10-check-row-van']) show(id, 900);
console.log('\n######## CARDS');
for (const id of ['l2-w09-card-nod', 'l2-w09-card-banana']) show(id, 1500);
const patSets = list.filter((s) => s.use === 'card' && /Pat's hair|cargo-shorts/.test(s.linePrompt)).map((s) => s.id);
console.log('cards with Pat/cargo line text:', patSets);
console.log('\n######## HEN / POT');
const hen = list.filter((s) => /hen/i.test(s.goal) && s.id.startsWith('l2-w12'));
for (const s of hen) console.log(s.id, 'refs:', s.references.map((r) => r.replace(/^out\/storytime\/l2\//, '')).join(', '), '| brownHen=' + /brown hen/.test(s.colorPrompt), '| chickenRef=' + s.references.some((r) => /out\/chicken/.test(r)), '| three-times=' + /three times/.test(s.colorPrompt));
console.log(JSON.stringify(JSON.parse(fs.readFileSync(base + '/w12/muse-elements/prop-hen-sheet.json', 'utf8')), null, 1).slice(0, 3000));
const pots = list.filter((s) => s.references.some((r) => /out\/pot\//.test(r)));
console.log('pot rows', pots.length, pots.map((s) => s.id.replace('l2-', '')).join(','));
const pp = pots[0];
console.log('POT row:', pp.id, 'Picture-for-pot:', /Picture \d+ is [^.]*pot[^.]*\./.exec(pp.colorPrompt)?.[0]);
console.log('pot "three times":', pots.filter((s) => /pot[^.]*three times/.test(s.colorPrompt)).length, 'without plant sentence:', pots.filter((s) => !/without the plant/.test(s.colorPrompt)).length);
console.log('any "three times" with a one-view Forge ref:', list.filter((s) => s.references.some((r) => /^out\/[a-z-]+\/views\//.test(r)) && /(?:Picture \d+ is a 3D render of ONE[^.]*three times \()/.test(s.colorPrompt)).map((s) => s.id).slice(0, 10));
console.log('outdoor "in the room" rows:', list.filter((s) => /farmyard|garden|street|bridge/i.test(s.set || '') && /camera height in the room/.test(s.colorPrompt)).map((s) => s.id).slice(0, 10));
// forbidden, refs, order
const forb = /skin colou?r|skin tone|complexion|ethnic|\brace\b|racial/i;
console.log('forbidden', list.filter((s) => forb.test(JSON.stringify(s))).map((s) => s.id));
const elemOut = new Set();
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) { const d = path.join(base, w, 'muse-elements'); if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) { const s = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); elemOut.add(path.join(s.outDir, s.id + '-m1-color.png')); } }
const miss = [];
for (const s of list) for (const r of s.references) if (!fs.existsSync(r) && !elemOut.has(r)) miss.push(s.id + ' ' + r);
console.log('refs neither on disk nor element output:', miss.length, miss.slice(0, 5));
console.log('element outputs', elemOut.size);
const aspectBad = list.filter((s) => (s.sizeClass === 'C' ? s.aspect !== '1:1' || s.printSize?.join('x') !== '1500x1500' : s.aspect !== '4:3')).length;
console.log('aspect/printSize bad', aspectBad, 'outDir bad', list.filter((s) => !s.outDir.startsWith('out/storytime/l2/unit2/')).length, 'no-letters missing', list.filter((s) => !/no letters/i.test(s.colorPrompt)).length);
// Pat render
const H = '/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep';
const tsv = fs.readFileSync(H + '/elements-reused.tsv', 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
console.log('elements-reused rows', tsv.length);
let bad = 0;
for (const [h, p] of tsv) if (!fs.existsSync(p) || crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== h) bad++;
console.log('tsv sha mismatch', bad, '| pat row:', tsv.filter(([, p]) => /sprout-pat/.test(p)).map((r) => r.join(' ')).join(''));
const unit1 = new Set();
for (const s of list) for (const r of s.references) if (/^out\/storytime(?!\/l2\/unit2)/.test(r)) unit1.add(r);
console.log('unit1/cast refs', unit1.size, 'not in tsv', [...unit1].filter((r) => !tsv.some(([, p]) => p === r)));
const forge = new Set();
for (const s of list) for (const r of s.references) if (/^out\/[a-z-]+\/views\//.test(r)) forge.add(r);
console.log('forge view refs', forge.size, 'renders in hand-off', fs.readdirSync(H + '/renders').length);
// reuse sources
console.log('reuse src missing', list.filter((s) => s.reuse && !fs.existsSync(s.reuse.source)).length);
// README
console.log(fs.readFileSync(H + '/README.md', 'utf8').split('\n').slice(0, 30).join('\n'));
