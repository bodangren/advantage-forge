#!/usr/bin/env node
// Character review page: every character model next to its mockup, with ratings and comments.
//
//   node scripts/character-review.mjs            write out/review/index.html and data.js once
//   node scripts/character-review.mjs --watch    keep data.js current (polls every 2 s)
//
// Characters are the assets in assets/ with a skeleton that has legs. Ratings and comments come
// from docs/character-reviews.json. The page reloads data.js every few seconds and swaps in new
// renders, new characters, and new reviews without a manual refresh.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out', 'review');
const REVIEWS = path.join(ROOT, 'docs', 'character-reviews.json');
const VIEWS = ['front', 'three-quarter', 'side', 'back'];
const GROUPS = { heroes: 'Heroes', enemies: 'Enemies', monsters: 'Monsters', npcs: 'NPCs', wildlife: 'Wildlife' };

const stat = (p) => {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
};
const mtime = (p) => Math.round(stat(p)?.mtimeMs ?? 0);
/** A path relative to out/review/, for the page, with the file's mtime to bust the image cache. */
const link = (abs) => ({ src: path.relative(OUT, abs).split(path.sep).join('/'), v: mtime(abs) });
const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
};

function parseAsset(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/k\.skeleton\(/.test(src) || !/['"](?:f|b)?leg\.L['"]/.test(src)) return null;
  const pick = (re) => src.match(re)?.[1];
  const name = pick(/defineAsset\(\{\s*name:\s*'([^']+)'/) ?? path.basename(file, '.ts');
  const catalog = pick(/catalog `([^`]+)`/) ?? null;
  const headline = pick(/\/\*\*\s*\n\s*\*\s*(.+)/) ?? name;
  return {
    name,
    title: headline.split(/\s*[—:]\s+|\s+-\s+|\s*\(/)[0].trim(),
    description: pick(/description:\s*'((?:[^'\\]|\\.)*)'/)?.replace(/\\'/g, "'") ?? '',
    catalog,
    group: GROUPS[catalog?.split('/')[0]] ?? 'Other',
    reference: pick(/reference:\s*'([^']+)'/) ?? null,
    file: path.relative(ROOT, file),
  };
}

function collect() {
  const reviews = readJson(REVIEWS, {});
  const assetsDir = path.join(ROOT, 'assets');
  const characters = [];
  for (const f of fs.readdirSync(assetsDir).sort()) {
    if (!f.endsWith('.ts')) continue;
    const asset = parseAsset(path.join(assetsDir, f));
    if (!asset) continue;
    const dir = path.join(ROOT, 'out', asset.name);
    const stats = readJson(path.join(dir, 'stats.json'), null);
    const glb = stat(path.join(dir, `${asset.name}.glb`));
    const mockup = asset.reference && stat(path.join(ROOT, asset.reference)) ? link(path.join(ROOT, asset.reference)) : null;
    const views = VIEWS.filter((v) => stat(path.join(dir, 'views', `${v}.png`))).map((v) => ({ view: v, ...link(path.join(dir, 'views', `${v}.png`)) }));
    const sprite = stat(path.join(dir, 'sprites', 'preview.png')) ? link(path.join(dir, 'sprites', 'preview.png')) : null;
    const clips = (stats?.animations ?? []).map((a) => ({
      name: a.name,
      duration: a.duration,
      gif: stat(path.join(dir, 'anim', `${a.name}.gif`)) ? link(path.join(dir, 'anim', `${a.name}.gif`)) : null,
    }));
    const builtAt = mtime(path.join(dir, 'stats.json'));
    const review = reviews[asset.name] ?? null;
    characters.push({
      ...asset,
      group: review?.group ?? asset.group,
      assetChangedAt: mtime(path.join(ROOT, asset.file)),
      mockup,
      views,
      sprite,
      clips,
      stats: stats && {
        triangles: stats.triangles,
        textured: Boolean(stats.texture),
        textureSize: stats.texture?.size ?? null,
        bones: stats.bones ?? 0,
        buildMs: stats.milliseconds,
        glbBytes: glb?.size ?? 0,
        size: stats.bounds?.size ?? null,
        builtAt,
      },
      review,
      reviewStale: Boolean(review?.reviewedAt && builtAt > Date.parse(review.reviewedAt) + 60_000),
    });
  }
  return characters;
}

function write(watching) {
  const characters = collect();
  const data = { generatedAt: Date.now(), watching, page: PAGE_VERSION, characters };
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(OUT, 'data.js.tmp');
  fs.writeFileSync(tmp, `window.REVIEW_DATA = ${JSON.stringify(data)};\n`);
  fs.renameSync(tmp, path.join(OUT, 'data.js'));
  return characters.length;
}

/** Everything the page shows, as one string of mtimes: a change means data.js must be rewritten. */
function signature() {
  const parts = [mtime(REVIEWS)];
  const assetsDir = path.join(ROOT, 'assets');
  for (const f of fs.readdirSync(assetsDir).sort()) {
    if (!f.endsWith('.ts')) continue;
    const name = f.slice(0, -3);
    const dir = path.join(ROOT, 'out', name);
    parts.push(f, mtime(path.join(assetsDir, f)), mtime(path.join(dir, 'stats.json')), mtime(path.join(dir, 'sprites', 'preview.png')));
    for (const v of VIEWS) parts.push(mtime(path.join(dir, 'views', `${v}.png`)));
  }
  for (const d of ['docs/hero-mockups', 'docs/enemy-mockups', 'reference-designs']) {
    const abs = path.join(ROOT, d);
    if (stat(abs)) for (const f of fs.readdirSync(abs, { recursive: true })) parts.push(f, mtime(path.join(abs, String(f))));
  }
  return parts.join('|');
}

// The page carries its own version; an open page reloads itself when data.js names a newer one.
const TEMPLATE = PAGE();
const PAGE_VERSION = createHash('sha1').update(TEMPLATE).digest('hex').slice(0, 10);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), TEMPLATE.replace('__PAGE_VERSION__', PAGE_VERSION));
const watch = process.argv.includes('--watch');
console.log(`review page: ${path.relative(ROOT, path.join(OUT, 'index.html'))} (${write(watch)} characters)`);
if (watch) {
  let last = signature();
  let beat = Date.now();
  setInterval(() => {
    const now = signature();
    // Rewrite on any change, and every 10 s anyway so the page can tell the watcher is alive.
    if (now !== last || Date.now() - beat > 10_000) {
      if (now !== last) console.log(`${new Date().toLocaleTimeString()} updated (${write(true)} characters)`);
      else write(true);
      last = now;
      beat = Date.now();
    }
  }, 2000);
}

function PAGE() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Character Review</title>
<style>
:root {
  --bg: #f4f2ee; --panel: #ffffff; --panel-2: #f7f5f1; --ink: #1f1d1a; --muted: #6b665e; --line: #e2ddd4;
  --accent: #2f6f68; --good: #2e7d4f; --mid: #b7791f; --bad: #b83a2e; --bar: #d9d3c8; --chip: #ece8e1;
  --shadow: 0 1px 2px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16171a; --panel: #1f2125; --panel-2: #26292e; --ink: #ecebe8; --muted: #9a978f; --line: #33363c;
    --accent: #6fc2b8; --good: #5cc28a; --mid: #e0a64a; --bad: #ef6f62; --bar: #3a3e45; --chip: #2c2f35;
    --shadow: none;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
header { position: sticky; top: 0; z-index: 5; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.bar { max-width: 1500px; margin: 0 auto; padding: 12px 20px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; }
h1 { font-size: 18px; margin: 0; letter-spacing: .01em; }
.status { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--good); box-shadow: 0 0 0 3px color-mix(in srgb, var(--good) 25%, transparent); }
.dot.off { background: var(--bad); box-shadow: 0 0 0 3px color-mix(in srgb, var(--bad) 25%, transparent); }
.summary { display: flex; gap: 16px; font-size: 13px; color: var(--muted); }
.summary b { color: var(--ink); font-variant-numeric: tabular-nums; }
.controls { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.chipbtn { border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 999px; padding: 4px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.chipbtn[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
select { border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 8px; padding: 4px 8px; font: inherit; font-size: 13px; }
main { max-width: 1500px; margin: 0 auto; padding: 20px; display: grid; gap: 20px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; }
.card.flash { animation: flash 1.6s ease-out; }
@keyframes flash { from { box-shadow: 0 0 0 3px var(--accent); } to { box-shadow: var(--shadow); } }
.head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.head h2 { margin: 0; font-size: 18px; }
.head code { font-size: 12px; color: var(--muted); }
.chip { font-size: 12px; padding: 2px 9px; border-radius: 999px; background: var(--chip); color: var(--muted); white-space: nowrap; }
.chip.warn { background: color-mix(in srgb, var(--mid) 18%, transparent); color: var(--mid); }
.chip.fast { background: color-mix(in srgb, var(--bad) 14%, transparent); color: var(--bad); }
.score { margin-left: auto; display: flex; align-items: baseline; gap: 4px; font-variant-numeric: tabular-nums; }
.score b { font-size: 26px; line-height: 1; }
.score span { color: var(--muted); font-size: 13px; }
.compare { display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--line); }
.cell { background: var(--panel-2); position: relative; aspect-ratio: 1; display: grid; place-items: center; cursor: zoom-in; overflow: hidden; }
.cell.mock { aspect-ratio: auto; min-height: 220px; }
.cell.mock img { position: absolute; inset: 0; }
.cell.mock.wide { grid-column: 1 / -1; height: 340px; }
.compare.has-wide { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.cell img { width: 100%; height: 100%; object-fit: contain; display: block; }
.cell .lbl { position: absolute; left: 8px; top: 8px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; background: color-mix(in srgb, var(--panel) 85%, transparent); color: var(--muted); padding: 2px 7px; border-radius: 6px; }
.cell.mock .lbl { background: var(--accent); color: var(--bg); }
.none { color: var(--muted); font-size: 13px; text-align: center; padding: 20px; cursor: default; }
.body { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 0; }
.notes { padding: 16px 18px; border-right: 1px solid var(--line); }
.notes p { margin: 0 0 12px; }
.notes h3, .side h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 14px 0 6px; }
.notes h3:first-of-type { margin-top: 4px; }
.notes ul { margin: 0; padding-left: 18px; }
.notes li { margin: 3px 0; }
.notes .good li::marker { color: var(--good); }
.notes .bad li::marker { color: var(--bad); }
.notes .next li::marker { color: var(--accent); }
.pending { color: var(--muted); font-style: italic; }
.side { padding: 16px 18px; }
.rubric { display: grid; grid-template-columns: auto 1fr auto; gap: 5px 10px; align-items: center; font-size: 13px; }
.rubric .track { height: 7px; border-radius: 4px; background: var(--bar); overflow: hidden; }
.rubric .fill { height: 100%; border-radius: 4px; }
.rubric .n { font-variant-numeric: tabular-nums; color: var(--muted); }
.rubric .key { font-weight: 600; }
.facts { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; font-size: 13px; margin: 0; }
.facts dt { color: var(--muted); }
.facts dd { margin: 0; font-variant-numeric: tabular-nums; }
.sprite { margin-top: 6px; border-radius: 8px; background: repeating-conic-gradient(var(--panel-2) 0 25%, var(--panel) 0 50%) 0 0 / 16px 16px; cursor: zoom-in; }
.sprite img { width: 100%; image-rendering: pixelated; display: block; }
.clips { display: flex; flex-wrap: wrap; gap: 6px; }
.clips button { border: 1px solid var(--line); background: var(--panel-2); color: var(--ink); border-radius: 8px; padding: 3px 10px; font: inherit; font-size: 12px; cursor: pointer; }
.empty { text-align: center; color: var(--muted); padding: 60px; }
dialog { border: none; padding: 0; background: transparent; max-width: 96vw; max-height: 96vh; }
dialog::backdrop { background: rgba(10,10,12,.82); }
dialog img { max-width: 94vw; max-height: 88vh; display: block; border-radius: 10px; background: var(--panel-2); }
dialog .cap { color: #eee; text-align: center; font-size: 14px; margin-top: 8px; }
dialog.pixel img { image-rendering: pixelated; min-width: min(94vw, 1100px); }
@media (max-width: 1000px) {
  .compare { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cell.mock { grid-column: 1 / -1; height: 340px; }
  .body { grid-template-columns: 1fr; }
  .notes { border-right: none; border-bottom: 1px solid var(--line); }
}
@media (max-width: 520px) { .bar, main { padding-left: 16px; padding-right: 16px; } .controls { margin-left: 0; } }
</style>
</head>
<body>
<header><div class="bar">
  <h1>Character models vs. mockups</h1>
  <div class="status"><span class="dot" id="dot"></span><span id="status">loading…</span></div>
  <div class="summary" id="summary"></div>
  <div class="controls">
    <div id="groups"></div>
    <select id="sort" aria-label="Sort">
      <option value="group">Sort: group</option>
      <option value="rating">Sort: rating</option>
      <option value="built">Sort: last built</option>
      <option value="name">Sort: name</option>
    </select>
  </div>
</div></header>
<main id="list"><div class="empty">Waiting for data.js…</div></main>
<dialog id="zoom"><img alt=""><div class="cap"></div></dialog>
<script>
const RUBRIC = [
  ['mockup', 'Match to mockup'], ['silhouette', 'Silhouette'], ['proportion', 'Proportion, appeal'],
  ['shape', 'Shape language'], ['color', 'Value and color'], ['materials', 'Materials'], ['detail', 'Detail hierarchy'],
  ['technical', 'Technical'], ['gameReady', 'Game readiness'], ['sprite', 'Readable at 128 px'], ['motion', 'Motion'],
];
const PAGE_VERSION = '__PAGE_VERSION__';
const GROUP_ORDER = ['Heroes', 'Enemies', 'Monsters', 'NPCs', 'Wildlife', 'Other'];
const state = { group: 'All', sort: 'group' };
try { Object.assign(state, JSON.parse(localStorage.getItem('review-ui') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('review-ui', JSON.stringify(state)); } catch {} };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const url = (l) => l.src + '?v=' + l.v;
const tone = (x, max) => { const r = x / max; return r >= 0.8 ? 'var(--good)' : r >= 0.6 ? 'var(--mid)' : 'var(--bad)'; };
const ago = (ms) => { const s = Math.round((Date.now() - ms) / 1000); return s < 60 ? s + ' s ago' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; };
let data = null;
const cards = new Map();
// A turnaround sheet is much wider than tall: give it the full row above the views.
const wide = (img) => {
  const on = img.naturalWidth > img.naturalHeight * 1.6;
  img.closest('.cell').classList.toggle('wide', on);
  img.closest('.compare').classList.toggle('has-wide', on);
};

function card(c) {
  const r = c.review;
  const s = c.stats;
  const cells = [];
  cells.push(c.mockup
    ? '<div class="cell mock" data-zoom="' + esc(url(c.mockup)) + '" data-cap="' + esc(c.title) + ' — mockup"><span class="lbl">Mockup</span><img loading="lazy" onload="wide(this)" src="' + esc(url(c.mockup)) + '" alt="' + esc(c.title) + ' mockup"></div>'
    : '<div class="cell mock none">No mockup exists for this character.</div>');
  for (const v of ['front', 'three-quarter', 'side', 'back']) {
    const view = c.views.find((x) => x.view === v);
    cells.push(view
      ? '<div class="cell" data-zoom="' + esc(url(view)) + '" data-cap="' + esc(c.title) + ' — ' + v + '"><span class="lbl">' + v + '</span><img loading="lazy" src="' + esc(url(view)) + '" alt="' + esc(c.title) + ' ' + v + '"></div>'
      : '<div class="cell none">Not rendered yet</div>');
  }
  const list = (items, cls) => items && items.length ? '<ul class="' + cls + '">' + items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
  const notes = r
    ? '<p>' + esc(r.summary) + '</p>' +
      (r.strengths?.length ? '<h3>Works well</h3>' + list(r.strengths, 'good') : '') +
      (r.issues?.length ? '<h3>Problems</h3>' + list(r.issues, 'bad') : '') +
      (r.next?.length ? '<h3>Next steps</h3>' + list(r.next, 'next') : '')
    : '<p class="pending">Not reviewed yet.</p>';
  const rubric = r?.scores
    ? '<div class="rubric">' + RUBRIC.filter(([k]) => r.scores[k] != null).map(([k, label]) =>
        '<span class="' + (k === 'mockup' ? 'key' : '') + '">' + label + '</span><div class="track"><div class="fill" style="width:' + (r.scores[k] / 5) * 100 + '%;background:' + tone(r.scores[k], 5) + '"></div></div><span class="n">' + r.scores[k] + '/5</span>').join('') + '</div>'
    : '';
  const facts = s
    ? '<dl class="facts"><dt>Triangles</dt><dd>' + s.triangles.toLocaleString() + '</dd>' +
      '<dt>Build</dt><dd>' + (s.textured ? 'textured, ' + s.textureSize + ' px atlas' : 'fast (vertex colors only)') + '</dd>' +
      (s.size ? '<dt>Size</dt><dd>' + s.size.map((x) => x.toFixed(2)).join(' × ') + ' m</dd>' : '') +
      '<dt>Bones</dt><dd>' + s.bones + '</dd><dt>GLB</dt><dd>' + (s.glbBytes / 1048576).toFixed(1) + ' MB</dd>' +
      '<dt>Last built</dt><dd>' + new Date(s.builtAt).toLocaleString() + '</dd>' +
      (r?.reviewedAt ? '<dt>Reviewed</dt><dd>' + new Date(r.reviewedAt).toLocaleString() + '</dd>' : '') + '</dl>'
    : '<p class="pending">No build output yet.</p>';
  const clips = c.clips.length
    ? '<h3>Clips</h3><div class="clips">' + c.clips.map((k) => k.gif
        ? '<button data-zoom="' + esc(url(k.gif)) + '" data-cap="' + esc(c.title) + ' — ' + esc(k.name) + ' (' + k.duration + ' s)">' + esc(k.name) + '</button>'
        : '<button disabled>' + esc(k.name) + '</button>').join('') + '</div>'
    : '';
  const sprite = c.sprite
    ? '<h3>Sprites (128 px)</h3><div class="sprite" data-zoom="' + esc(url(c.sprite)) + '" data-cap="' + esc(c.title) + ' — sprites" data-pixel="1"><img loading="lazy" src="' + esc(url(c.sprite)) + '" alt="' + esc(c.title) + ' sprites"></div>'
    : '';
  const chips = [
    '<span class="chip">' + esc(c.group) + '</span>',
    s && !s.textured ? '<span class="chip fast">fast build</span>' : '',
    c.reviewStale ? '<span class="chip warn">rebuilt after the review</span>' : '',
  ].join('');
  const score = r?.overall != null
    ? '<div class="score"><b style="color:' + tone(r.overall, 10) + '">' + r.overall.toFixed(1) + '</b><span>/ 10</span></div>'
    : '<div class="score"><span>no rating</span></div>';
  return '<div class="head"><h2>' + esc(c.title) + '</h2><code>' + esc(c.catalog || c.file) + '</code>' + chips + score + '</div>' +
    '<div class="compare">' + cells.join('') + '</div>' +
    '<div class="body"><div class="notes">' + notes + '</div><div class="side">' + rubric + '<h3>Build</h3>' + facts + clips + sprite + '</div></div>';
}

function sorted(list) {
  const g = (c) => GROUP_ORDER.indexOf(c.group) >>> 0;
  const by = {
    group: (a, b) => g(a) - g(b),
    rating: (a, b) => (b.review?.overall ?? -1) - (a.review?.overall ?? -1),
    built: (a, b) => (b.stats?.builtAt ?? 0) - (a.stats?.builtAt ?? 0),
    name: (a, b) => a.title.localeCompare(b.title),
  }[state.sort];
  return list.filter((c) => state.group === 'All' || c.group === state.group).slice().sort((a, b) => by(a, b) || 0);
}

function render(first) {
  const list = document.getElementById('list');
  const shown = sorted(data.characters);
  if (!shown.length) { list.innerHTML = '<div class="empty">No characters in this group.</div>'; cards.clear(); return; }
  list.querySelector('.empty')?.remove();
  const keep = new Set(shown.map((c) => c.name));
  for (const [name, entry] of cards) if (!keep.has(name)) { entry.el.remove(); cards.delete(name); }
  let prev = null;
  for (const c of shown) {
    const json = JSON.stringify(c);
    let entry = cards.get(c.name);
    if (!entry) {
      const el = document.createElement('section');
      el.className = 'card';
      el.id = 'c-' + c.name;
      entry = { el, json: '' };
      cards.set(c.name, entry);
    }
    if (entry.json !== json) {
      entry.el.innerHTML = card(c);
      if (entry.json && !first) { entry.el.classList.remove('flash'); void entry.el.offsetWidth; entry.el.classList.add('flash'); }
      entry.json = json;
    }
    const want = prev ? prev.nextSibling : list.firstChild;
    if (want !== entry.el) list.insertBefore(entry.el, want);
    prev = entry.el;
  }
}

function header() {
  const groups = ['All', ...GROUP_ORDER.filter((g) => data.characters.some((c) => c.group === g))];
  if (!groups.includes(state.group)) state.group = 'All';
  document.getElementById('groups').innerHTML = groups.map((g) =>
    '<button class="chipbtn" data-group="' + g + '" aria-pressed="' + (g === state.group) + '">' + g + '</button>').join(' ');
  document.getElementById('sort').value = state.sort;
  const rated = data.characters.filter((c) => c.review?.overall != null);
  const avg = rated.length ? rated.reduce((a, c) => a + c.review.overall, 0) / rated.length : 0;
  const stale = data.characters.filter((c) => c.reviewStale).length;
  document.getElementById('summary').innerHTML =
    '<span><b>' + data.characters.length + '</b> characters</span>' +
    '<span><b>' + data.characters.filter((c) => c.mockup).length + '</b> with a mockup</span>' +
    '<span><b>' + rated.length + '</b> rated' + (rated.length ? ', average <b>' + avg.toFixed(1) + '</b>' : '') + '</span>' +
    (stale ? '<span><b>' + stale + '</b> rebuilt after review</span>' : '');
}

function status() {
  if (!data) return;
  const age = Date.now() - data.generatedAt;
  const live = data.watching && age < 30000;
  document.getElementById('dot').className = 'dot' + (live ? '' : ' off');
  document.getElementById('status').textContent = live
    ? 'Live · data ' + ago(data.generatedAt)
    : 'Not live · data from ' + ago(data.generatedAt) + ' · run: node scripts/character-review.mjs --watch';
}

let lastKey = '';
function apply(d) {
  if (d.page && d.page !== PAGE_VERSION) { location.reload(); return; }
  const key = JSON.stringify(d.characters);
  const first = !data;
  data = d;
  if (key !== lastKey) { lastKey = key; header(); render(first); }
  status();
}

function load() {
  const s = document.createElement('script');
  s.src = 'data.js?t=' + Date.now();
  s.onload = () => { s.remove(); if (window.REVIEW_DATA) apply(window.REVIEW_DATA); };
  s.onerror = () => { s.remove(); status(); };
  document.head.appendChild(s);
}

document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-group]');
  if (g) { state.group = g.dataset.group; save(); header(); render(true); return; }
  const z = e.target.closest('[data-zoom]');
  if (z) {
    const d = document.getElementById('zoom');
    d.classList.toggle('pixel', Boolean(z.dataset.pixel));
    d.querySelector('img').src = z.dataset.zoom;
    d.querySelector('.cap').textContent = z.dataset.cap || '';
    d.showModal();
  }
});
document.getElementById('zoom').addEventListener('click', (e) => e.currentTarget.close());
document.getElementById('sort').addEventListener('change', (e) => { state.sort = e.target.value; save(); render(true); });
load();
setInterval(load, 3000);
setInterval(status, 1000);
</script>
</body>
</html>
`;
}
