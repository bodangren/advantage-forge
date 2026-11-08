// Read-only: print chosen specs. Run from the repo root: node <this> id1 id2 ...
import fs from 'node:fs';
import path from 'node:path';
const base = 'docs/storytime/l2-unit2';
const all = {};
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) {
    const s = JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8'));
    all[s.id] = s;
  }
}
const mode = process.argv[2];
if (mode === 'stats') {
  const checks = Object.values(all).filter((s) => s.use === 'check-row');
  const newRows = checks.filter((s) => !s.reuse);
  console.log('check-rows', checks.length, 'new', newRows.length, 'reuse', checks.length - newRows.length);
  console.log('new check-row words:', newRows.map((s) => s.text).join(','));
  const nf = Object.values(all).filter((s) => !s.reuse).length;
  console.log('new rows total', nf, 'reuse total', Object.values(all).filter((s) => s.reuse).length);
} else {
  for (const id of process.argv.slice(2)) {
    const s = all[id];
    if (!s) { console.log('NOSPEC', id); continue; }
    console.log('=====', id, '| use', s.use, '| class', s.sizeClass, '| aspect', s.aspect, '| reuse', JSON.stringify(s.reuse));
    console.log('TEXT:', s.text);
    console.log('GOAL:', s.goal);
    console.log('REFS:', JSON.stringify(s.references));
    console.log('SET:', JSON.stringify(s.set), 'PROPS:', JSON.stringify(s.props));
    console.log('COLOR:', s.colorPrompt);
  }
}
