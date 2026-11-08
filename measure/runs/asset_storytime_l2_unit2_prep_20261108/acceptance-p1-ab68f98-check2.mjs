// Read-only analysis for the phase acceptance. Run from the repo root.
import fs from 'node:fs';
import path from 'node:path';
const base = 'docs/storytime/l2-unit2';
const all = [];
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) {
    all.push(JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8')));
  }
}
const u1 = (f) => JSON.parse(fs.readFileSync('docs/storytime/l2-unit1/' + f, 'utf8'));
const bus = u1('w07/muse/l2-w07-check-row-bus.json');
const cat = u1('w07/muse/l2-w07-check-row-cat.json');
console.log('U1 cat line == bus line:', cat.linePrompt === bus.linePrompt);
console.log('U1 cat line:', cat.linePrompt);
const checks = all.filter((s) => s.use === 'check-row');
const groups = {};
for (const s of checks) {
  const k = /Picture 1 is a 3D-rendered children's book picture of one (\w+)/.exec(s.linePrompt)?.[1] + ' | busline=' + /bus body/.test(s.linePrompt) + ' | noface=' + /no eyes and no face/.test(s.linePrompt);
  (groups[k] = groups[k] || []).push(s.id.replace('l2-', ''));
}
for (const [k, v] of Object.entries(groups)) console.log(k, v.length, v.slice(0, 40).join(','));
const personForm = checks.filter((s) => /Exactly one person/.test(s.colorPrompt));
console.log('check-rows with person colorPrompt:', personForm.map((s) => s.id).join(','));
console.log('of those with object linePrompt:', personForm.filter((s) => /of one object/.test(s.linePrompt)).map((s) => s.id).join(','));
// story page / cover / card line prompts
for (const use of ['story-page', 'cover', 'card', 'd4-prompt']) {
  const g = {};
  for (const s of all.filter((x) => x.use === use)) {
    const k = /of one (\w+)|of (\w+ \w+)/.exec(s.linePrompt)?.[0] + ' | pat=' + /Pat's hair/.test(s.linePrompt);
    (g[k] = g[k] || []).push(s.id);
  }
  for (const [k, v] of Object.entries(g)) console.log(use, k, v.length);
}
