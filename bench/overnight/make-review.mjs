// Builds out/overnight/index.html: every result of the overnight run (render beside its mockup,
// model, minutes, score, notes, commit), the model scoreboard, and the scene shots.
//   node bench/overnight/make-review.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const repo = new URL('../..', import.meta.url).pathname;
const outDir = join(repo, 'out/overnight');
mkdirSync(outDir, { recursive: true });
const rel = (p) => relative(outDir, join(repo, p));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const rows = readFileSync(join(repo, 'bench/overnight/log.tsv'), 'utf8').trim().split('\n');
const head = rows.shift().split('\t');
const log = rows.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [head[i], v])));
const isAdded = (e) => e.verdict === 'graft' || e.verdict === 'claude';
// A later added version of the same asset replaces an earlier one; the earlier card shows its trial render.
const latestAdded = {};
log.forEach((e, i) => {
  if (isAdded(e)) latestAdded[e.asset] = i;
});
log.forEach((e, i) => {
  if (isAdded(e) && latestAdded[e.asset] !== i) e.verdict = 'replaced';
});

function referenceOf(file) {
  if (!existsSync(file)) return null;
  const m = readFileSync(file, 'utf8').match(/reference:\s*'([^']+)'/);
  return m ? m[1] : null;
}
function trialDir(asset, model) {
  const slug = model.split('/').slice(1).join('/').replace(/\./g, '-').replace(/[^A-Za-z0-9_-]/g, '-');
  const roots = ['ov-blacksmith', 'ov-items', 'ov-p1', 'ov-blacksmith-r2', 'ov-items-r2', 'ov-blacksmith-r3', 'ov-p1-r2', 'ov-items-r3', 'ov-p1c', 'ov-p1-r3', 'ov-p1d', 'ov-p1c-r2', 'ov-p1e', 'ov-p1e-r2', 'ov-p1d-r2', 'ov-p1f', 'ov-p1f-r2', 'ov-p1d-r3'];
  for (const root of [...roots.map((r) => `bench/runs/ov-ext/${r}`), ...roots.map((r) => `bench/runs/${r}`)]) {
    const d = join(root, asset, slug);
    if (existsSync(join(repo, d))) return d;
  }
  return null;
}
function images(e) {
  const grafted = isAdded(e);
  const t = trialDir(e.asset, e.model);
  let render = null;
  if (grafted && existsSync(join(repo, 'out', e.asset, 'render.png'))) render = `out/${e.asset}/render.png`;
  else if (t && existsSync(join(repo, t, 'ws/out', e.asset, 'render.png'))) render = `${t}/ws/out/${e.asset}/render.png`;
  let ref = referenceOf(join(repo, 'assets', `${e.asset}.ts`));
  let refBase = '';
  if (!ref && t) {
    ref = referenceOf(join(repo, t, 'ws/assets', `${e.asset}.ts`));
    refBase = `${t}/ws/`;
  }
  const refPath = ref ? (existsSync(join(repo, ref)) ? ref : existsSync(join(repo, refBase + ref)) ? refBase + ref : null) : null;
  return { render, ref: refPath };
}

const verdictLabel = { graft: 'Added', claude: 'Added (Claude)', replaced: 'Replaced by a later version', reroll: 'Rejected, new try', drop: 'Rejected', quota: 'No quota', fail: 'Failed' };
const cards = log
  .map((e) => {
    const { render, ref } = images(e);
    const score = Number(e.score);
    const cls = e.verdict === 'graft' || e.verdict === 'claude' ? 'ok' : e.verdict === 'quota' || e.verdict === 'fail' ? 'bad' : 'warn';
    return `<article class="card ${cls}">
  <header><h3>${esc(e.asset)}</h3><span class="tag ${cls}">${esc(verdictLabel[e.verdict] ?? e.verdict)}</span></header>
  <div class="imgs">${render ? `<a href="${rel(render)}"><img loading="lazy" src="${rel(render)}" alt="${esc(e.asset)} render"></a>` : '<div class="none">no render</div>'}${ref ? `<a class="ref" href="${rel(ref)}"><img loading="lazy" src="${rel(ref)}" alt="mockup"></a>` : ''}</div>
  <dl><dt>Model</dt><dd>${esc(e.model)}</dd><dt>Type</dt><dd>${esc(e.category)}</dd><dt>Minutes</dt><dd>${esc(e.minutes)}</dd><dt>Score</dt><dd>${Number.isFinite(score) ? `${score}/10` : '–'}</dd><dt>Commit</dt><dd><code>${esc(e.commit)}</code></dd></dl>
  <p>${esc(e.notes)}</p>
</article>`;
  })
  .join('\n');

const byModel = {};
for (const e of log) {
  const m = (byModel[e.model] ??= { n: 0, added: 0, scores: [], mins: [], types: new Set() });
  m.n++;
  if (isAdded(e) || e.verdict === 'replaced') m.added++;
  if (Number.isFinite(Number(e.score)) && e.score !== '') m.scores.push(Number(e.score));
  if (Number.isFinite(Number(e.minutes)) && e.minutes !== '') m.mins.push(Number(e.minutes));
  m.types.add(e.category);
}
const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '–');
const board = Object.entries(byModel)
  .sort((a, b) => b[1].n - a[1].n)
  .map(([k, m]) => `<tr><td>${esc(k)}</td><td>${m.n}</td><td>${m.added}</td><td>${avg(m.scores)}</td><td>${avg(m.mins)}</td><td>${esc([...m.types].join(', '))}</td></tr>`)
  .join('');

const sceneDirs = [
  ['Village (?scene=village)', 'docs/village-mockups', 'village-quest_001.jpg'],
  ['Blacksmith shop (?scene=blacksmith)', 'docs/blacksmith-mockups', 'blacksmith-quest_001.jpg'],
  ['Tavern (?scene=tavern)', 'docs/tavern-mockups', 'tavern-quest_001.jpg'],
];
const scenes = sceneDirs
  .map(([title, dir, mock]) => {
    const shots = existsSync(join(repo, dir)) ? readdirSync(join(repo, dir)).filter((f) => /^render-.*\.png$/.test(f)).sort() : [];
    if (!shots.length) return '';
    const imgs = [mock, ...shots].filter((f) => existsSync(join(repo, dir, f)));
    return `<section class="scene"><h3>${esc(title)}</h3><div class="shots">${imgs
      .map((f) => `<figure><a href="${rel(`${dir}/${f}`)}"><img loading="lazy" src="${rel(`${dir}/${f}`)}" alt="${esc(f)}"></a><figcaption>${f === mock ? 'mockup' : esc(f.replace(/^render-|\.png$/g, ''))}</figcaption></figure>`)
      .join('')}</div></section>`;
  })
  .join('\n');

const added = log.filter(isAdded).length;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Overnight Build Review</title>
<style>
:root { --bg:#f6f4ef; --fg:#1f1d1a; --muted:#6b665d; --card:#fff; --line:#e3ded3; --ok:#2f7d4f; --warn:#a86a12; --bad:#b0392f; }
@media (prefers-color-scheme: dark) { :root { --bg:#16171a; --fg:#ece8e0; --muted:#9a958c; --card:#202227; --line:#30333a; --ok:#5cc18a; --warn:#e0a54a; --bad:#e8766b; } }
* { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.45 system-ui, sans-serif; }
main { max-width:1500px; margin:0 auto; padding:24px 16px 64px; }
h1 { margin:0 0 4px; font-size:26px; } h2 { margin:36px 0 12px; font-size:20px; border-bottom:1px solid var(--line); padding-bottom:6px; }
.sub { color:var(--muted); margin:0 0 16px; }
table { border-collapse:collapse; width:100%; background:var(--card); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
th, td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--line); font-size:14px; } th { color:var(--muted); font-weight:600; }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(420px, 1fr)); gap:14px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px; }
.card header { display:flex; justify-content:space-between; align-items:center; gap:8px; } .card h3 { margin:0; font-size:17px; }
.tag { font-size:12px; font-weight:600; padding:2px 8px; border-radius:999px; border:1px solid currentColor; }
.tag.ok { color:var(--ok); } .tag.warn { color:var(--warn); } .tag.bad { color:var(--bad); }
.imgs { display:flex; gap:8px; margin:10px 0; } .imgs a { flex:3; } .imgs a.ref { flex:1; }
.imgs img { width:100%; border-radius:6px; display:block; background:#aaa; }
.none { flex:3; display:grid; place-items:center; min-height:120px; color:var(--muted); border:1px dashed var(--line); border-radius:6px; }
dl { display:grid; grid-template-columns:auto 1fr; gap:2px 10px; margin:0; font-size:13px; } dt { color:var(--muted); } dd { margin:0; }
.card p { margin:8px 0 0; font-size:14px; }
.shots { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:10px; }
figure { margin:0; } figure img { width:100%; border-radius:6px; display:block; } figcaption { color:var(--muted); font-size:13px; }
a { color:inherit; }
@media (max-width:480px) { .grid { grid-template-columns:1fr; } .imgs { flex-direction:column; } }
</style></head><body><main>
<h1>Overnight Build Review</h1>
<p class="sub">Generated ${new Date().toLocaleString('en-GB')}. ${added} assets added, ${log.length} results in total. Characters also appear on the <a href="../review/index.html">character review page</a>. Plan and rules: <code>bench/overnight/PLAN.md</code>; raw log: <code>bench/overnight/log.tsv</code>.</p>
<h2>Models</h2>
<table><thead><tr><th>Model</th><th>Results</th><th>Added</th><th>Avg score</th><th>Avg minutes</th><th>Asset types</th></tr></thead><tbody>${board}</tbody></table>
<h2>Sample maps</h2>
${scenes}
<h2>Assets</h2>
<div class="grid">
${cards}
</div>
</main></body></html>`;
writeFileSync(join(outDir, 'index.html'), html);
console.log(`wrote out/overnight/index.html (${log.length} results)`);
