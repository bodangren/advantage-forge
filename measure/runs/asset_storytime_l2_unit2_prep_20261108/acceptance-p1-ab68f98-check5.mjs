// Read-only: defect-class scans over the 229 specs. Run from the repo root.
import fs from 'node:fs';
import path from 'node:path';
const base = 'docs/storytime/l2-unit2';
const all = [];
for (const w of fs.readdirSync(base).filter((x) => /^w\d\d$/.test(x))) {
  for (const f of fs.readdirSync(path.join(base, w, 'muse'))) all.push(JSON.parse(fs.readFileSync(path.join(base, w, 'muse', f), 'utf8')));
}
const out = (k, v) => console.log(k, v.length, v.slice(0, 12).join(' | '));
// 3: "Picture 1" with no references
out('picture-1 words but no refs', all.filter((s) => (s.references || []).length === 0 && /Picture 1\b/.test(s.colorPrompt)).map((s) => s.id));
// picture numbers above reference count
out('picture N > refs', all.filter((s) => { const m = [...s.colorPrompt.matchAll(/Picture (\d+)/g)].map((x) => +x[1]); return m.length && Math.max(...m) > (s.references || []).length; }).map((s) => s.id));
// 2: tom living room without leave-out sentence
out('tom living room w/o leave-out', all.filter((s) => (s.references || []).some((r) => /set-tom-living-room-empty/.test(r)) && !/leave out the table and the pot/.test(s.colorPrompt)).map((s) => s.id));
out('silver pot in a spec that lacks the table ref but names pot', all.filter((s) => /silver pot/.test(s.colorPrompt) && !/leave out the table and the pot/.test(s.colorPrompt)).map((s) => s.id));
// 4: cards keep line names
const names = ['Sam', 'Ben', 'May', 'Mia', 'Pat', 'Pip', 'Lily', 'Nan', 'Tom', 'Dad', 'Mom', 'Grandma', 'Grandpa', 'Kim', 'Ken', 'Rose', 'Anna'];
out('card keep line (id: keep-name)', all.filter((s) => s.use === 'card' && /Keep ([A-Z][a-z]+)/.test(s.colorPrompt)).map((s) => s.id.replace('l2-', '') + ':' + /Keep ([A-Z][a-z]+)/.exec(s.colorPrompt)[1] + ' text=' + s.text));
// no cast but reference-only cards lacking a person?
const cardNoRef = all.filter((s) => s.use === 'card' && (s.references || []).length === 0);
out('cards with no refs', cardNoRef.map((s) => s.id + ' text=' + s.text + ' person=' + /one person/.test(s.linePrompt)));
// 1: cast names present in colorPrompt "Picture n shows X" vs names in goal
const mism = [];
for (const s of all.filter((x) => x.use === 'story-page' || x.use === 'cover')) {
  const shows = [...s.colorPrompt.matchAll(/Picture \d+ shows (?:the (?:boy|girl|man|woman|children) )?([A-Z][a-z]+|[A-Za-z ,and]+?)[:,]/g)].map((x) => x[1]);
  const keep = [...s.colorPrompt.matchAll(/(?:^|\. |exactly as in the pictures: )([A-Z][a-z]+): (?:a|an) (?:boy|girl|man|woman|five|six|seven|eight|nine|ten|child|young|old|elderly|[a-z-]+ )/g)].map((x) => x[1]);
  const goalNames = names.filter((n) => new RegExp('(^|[^A-Za-z])' + n + "(?!'s| of|[a-z])").test(s.goal));
  const keepSet = new Set(keep);
  const missing = goalNames.filter((n) => !keepSet.has(n));
  const extra = [...keepSet].filter((n) => !goalNames.includes(n));
  if (missing.length || extra.length) mism.push(s.id.replace('l2-', '') + ' missing=' + missing.join('/') + ' extra=' + extra.join('/'));
}
out('story/cover cast mismatch goal vs keep-lines', mism);
// stray adult/child proportion lines are fixed unit-1 text; count rows where text mentions Mom proportion but no Mom in goal
// forbidden words (spec FR-4) across prompt-list tsv/md too
const H = '/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep';
const forb = /skin colou?r|skin tone|complexion|ethnic|\brace\b|racial/i;
for (const f of [base + '/prompt-list.tsv', base + '/prompt-list.md', H + '/prompt-list.tsv', H + '/prompt-list.md', H + '/README.md']) {
  const t = fs.readFileSync(f, 'utf8');
  console.log('forbidden in', f, forb.test(t));
}
const skin = all.filter((s) => /\bskin\b/i.test(s.colorPrompt + s.linePrompt)).length;
console.log('specs with the word skin (rule text, D1 allows pale skin flap):', skin);
const skinCtx = new Set();
for (const s of all) for (const m of (s.colorPrompt + ' ' + s.linePrompt).matchAll(/.{0,30}\bskin\b.{0,25}/gi)) skinCtx.add(m[0]);
console.log([...skinCtx].slice(0, 8));
// Pat card ref
const cast = JSON.parse(fs.readFileSync('docs/storytime/l2-unit1/judge/cast.json', 'utf8'));
console.log('cast.json keys', Object.keys(cast).slice(0, 12).join(','), JSON.stringify(cast).match(/sprout-pat-render[^"]*/)?.[0]);
