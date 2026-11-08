// Read-only: compact cast view per spec. node <this> id... | forge-refs
import fs from 'node:fs';
import path from 'node:path';
const base = 'docs/storytime/l2-unit2';
const all = {};
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) { const s = JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8')); all[s.id] = s; }
}
if (process.argv[2] === 'forge-refs') {
  const by = {};
  for (const s of Object.values(all)) for (const r of s.references || []) if (!/^out\/storytime\//.test(r)) (by[r] = by[r] || []).push(s.id.replace('l2-', ''));
  for (const [r, ids] of Object.entries(by)) {
    const s = all['l2-' + ids[0]];
    const idx = s.references.indexOf(r) + 1;
    const m = new RegExp('Picture ' + idx + ' is ([^.]{0,260})').exec(s.colorPrompt);
    console.log(r, '| rows', ids.length, ids.slice(0, 4).join(','), '\n   ->', m ? m[0] : 'NO DESCRIPTION FOUND');
  }
} else {
  for (const id of process.argv.slice(2)) {
    const s = all[id];
    const keep = /(Keep (?:each character|[A-Z][a-z]+) exactly as in the pictures?: .*?)(?:The picture:|The page text|$)/.exec(s.colorPrompt);
    const shows = [...s.colorPrompt.matchAll(/Picture \d+ (?:shows|is) [^.:]{0,90}/g)].map((x) => x[0]);
    console.log('==', id, '\nTEXT:', s.text, '\nGOAL:', s.goal, '\nREFS:', s.references.map((r) => path.basename(r)).join(', '), '\nSHOWS:', shows.join(' || '), '\nKEEP:', keep ? keep[1].slice(0, 500) : 'none');
  }
}
