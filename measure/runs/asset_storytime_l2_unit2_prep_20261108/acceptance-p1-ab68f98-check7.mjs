// Read-only: new check-row and d4 object-form face rule scan. Run from the repo root.
import fs from 'node:fs';
import path from 'node:path';
const base = 'docs/storytime/l2-unit2';
const all = [];
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) all.push(JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8')));
}
for (const s of all.filter((x) => (x.use === 'check-row' || x.use === 'd4-prompt') && !x.reuse)) {
  console.log(s.id.replace('l2-', ''), '| colorNoFace=' + /no eyes and no face/.test(s.colorPrompt), '| lineNoFace=' + /no eyes and no face/.test(s.linePrompt), '| lineBus=' + /bus body/.test(s.linePrompt), '| refs=' + s.references.length);
}
const u1 = JSON.parse(fs.readFileSync('docs/storytime/l2-unit1/w07/muse/l2-w07-check-row-cat.json', 'utf8'));
console.log('U1 cat colorNoFace', /no eyes and no face/.test(u1.colorPrompt));
console.log('U1 cat color excerpt:', u1.colorPrompt.slice(0, 700));
const foot = all.find((s) => s.id === 'l2-w14-check-row-foot');
console.log('FOOT color:', foot.colorPrompt.slice(0, 900));
console.log('FOOT line:', foot.linePrompt.slice(0, 300));
