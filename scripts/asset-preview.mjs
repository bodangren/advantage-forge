#!/usr/bin/env node
// Asset preview page: every rendered asset in out/, grouped by environment, newest first.
//
//   node scripts/asset-preview.mjs            write out/preview/index.html and data.js once
//   node scripts/asset-preview.mjs --watch    keep data.js current (polls every 3 s)
//
// Open out/preview/index.html from the file system. The page reloads data.js every few seconds
// and shows new renders as the build queue produces them.
//
// Environment comes from the mockup folder that holds <name>-mock.jpg (bench/overnight/refs/*,
// docs/*-mockups), then from the catalog id in the asset source. Build status and review scores
// come from bench/sonnet/state.tsv and docs/character-reviews.json when present.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');
const PAGE_DIR = path.join(OUT_DIR, 'preview');

const ENV_DIRS = [
  ['bench/overnight/refs/p1-forest', 'Forest'],
  ['bench/overnight/refs/p1-village', 'Village'],
  ['bench/overnight/refs/p1-dungeon', 'Dungeon'],
  ['bench/overnight/refs/p1-blacksmith', 'Blacksmith'],
  ['bench/overnight/refs/p1-gear', 'Gear'],
  ['bench/overnight/refs/items', 'Items'],
  ['docs/hero-mockups', 'Heroes'],
  ['docs/enemy-mockups', 'Enemies'],
  ['docs/monster-mockups', 'Monsters'],
  ['docs/npc-mockups', 'NPCs'],
  ['docs/wildlife-mockups', 'Wildlife'],
  ['docs/item-mockups', 'Items'],
  ['docs/prop-mockups', 'Props'],
];
const CATALOG_ENV = {
  'characters/heroes': 'Heroes',
  'characters/enemies': 'Enemies',
  'characters/monsters': 'Monsters',
  'characters/npcs': 'NPCs',
  'characters/wildlife': 'Wildlife',
  equipment: 'Gear',
  items: 'Items',
  nature: 'Forest',
  architecture: 'Village',
  props: 'Props',
  fx: 'FX',
  vehicles: 'Vehicles',
};

const stat = (p) => {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
};
const mtime = (p) => Math.round(stat(p)?.mtimeMs ?? 0);
const rel = (abs) => path.relative(PAGE_DIR, abs).split(path.sep).join('/');
const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
};

function mockupIndex() {
  const byName = new Map();
  for (const [dir, env] of ENV_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!stat(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      const m = /^(.+?)(?:-mock|_\d+)\.(?:jpg|png)$/.exec(f);
      if (m && !byName.has(m[1])) byName.set(m[1], { env, mock: path.join(abs, f) });
    }
  }
  return byName;
}

function catalogId(name) {
  const src = path.join(ROOT, 'assets', `${name}.ts`);
  let text = '';
  try {
    text = fs.readFileSync(src, 'utf8').slice(0, 4000);
  } catch {
    return null;
  }
  const m = /`((?:characters|equipment|items|nature|architecture|props|fx|vehicles)\/[a-z0-9/-]+)`/.exec(text)
    || /\(((?:characters|equipment|items|nature|architecture|props|fx|vehicles)\/[a-z0-9/-]+)\)/.exec(text);
  return m ? m[1] : null;
}

function envFromCatalog(id) {
  if (!id) return null;
  for (const [prefix, env] of Object.entries(CATALOG_ENV)) if (id.startsWith(prefix)) return env;
  return null;
}

function sonnetState() {
  const p = path.join(ROOT, 'bench', 'sonnet', 'state.tsv');
  const rows = new Map();
  let text = '';
  try {
    text = fs.readFileSync(p, 'utf8');
  } catch {
    return rows;
  }
  const lines = text.trim().split('\n');
  const head = lines.shift().split('\t');
  for (const line of lines) {
    const cols = line.split('\t');
    const row = Object.fromEntries(head.map((h, i) => [h, cols[i] ?? '']));
    rows.set(row.asset, row);
  }
  return rows;
}

function collect() {
  const mocks = mockupIndex();
  const state = sonnetState();
  const reviews = readJson(path.join(ROOT, 'docs', 'character-reviews.json'), {});
  const assets = [];
  for (const name of fs.readdirSync(OUT_DIR)) {
    const dir = path.join(OUT_DIR, name);
    const render = path.join(dir, 'render.png');
    if (!stat(render)) continue;
    const id = catalogId(name);
    const mock = mocks.get(name);
    const env = mock?.env ?? envFromCatalog(id) ?? 'Other';
    const sprite = path.join(dir, 'sprites', 'preview.png');
    const glb = path.join(dir, `${name}.glb`);
    const stats = readJson(path.join(dir, 'stats.json'), null);
    const st = state.get(name);
    const review = reviews[name]?.overall ?? (st?.score && st.score !== '-' ? Number(st.score) : null);
    const has = (p) => (stat(p) ? { src: rel(p), v: mtime(p) } : null);
    assets.push({
      name,
      env,
      catalog: id,
      render: has(render),
      sprite: has(sprite),
      mock: mock ? has(mock.mock) : null,
      updated: Math.max(mtime(render), mtime(glb)),
      triangles: stats?.triangles ?? stats?.totalTriangles ?? null,
      status: st?.status ?? null,
      tier: st?.tier ?? null,
      score: review,
      source: stat(path.join(ROOT, 'assets', `${name}.ts`)) ? true : false,
    });
  }
  assets.sort((a, b) => b.updated - a.updated);
  return { generated: Date.now(), assets };
}

function writeData() {
  fs.mkdirSync(PAGE_DIR, { recursive: true });
  const data = collect();
  fs.writeFileSync(path.join(PAGE_DIR, 'data.js'), `window.__ASSETS__ = ${JSON.stringify(data)};\n`);
  return data;
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Asset preview</title>
<style>
  :root { --bg:#1b1d22; --card:#24272e; --ink:#e8e6e1; --dim:#9a9891; --line:#3a3e47; --ok:#5cb85c; --warn:#e0bb60; --bad:#d9534f; --run:#5a9fd4; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.4 system-ui, sans-serif; }
  header { position:sticky; top:0; z-index:2; background:var(--bg); border-bottom:1px solid var(--line); padding:10px 16px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  header h1 { font-size:16px; margin:0 12px 0 0; }
  button { background:var(--card); color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:4px 10px; cursor:pointer; }
  button.on { background:#3b4a63; border-color:#5a9fd4; }
  .spacer { flex:1; }
  .meta { color:var(--dim); font-size:12px; }
  main { display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:12px; padding:12px 16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .card img.render { width:100%; display:block; background:#2c2f36; cursor:zoom-in; }
  .row { display:flex; gap:8px; align-items:center; padding:8px 10px; }
  .row b { font-size:15px; }
  .tag { font-size:11px; padding:1px 7px; border-radius:10px; border:1px solid var(--line); color:var(--dim); white-space:nowrap; }
  .tag.status-accepted { color:var(--ok); border-color:var(--ok); }
  .tag.status-running, .tag.status-running-fresh, .tag.status-feedback { color:var(--run); border-color:var(--run); }
  .tag.status-queued { color:var(--warn); border-color:var(--warn); }
  .tag.status-skipped { color:var(--bad); border-color:var(--bad); }
  .thumbs { display:flex; gap:6px; padding:0 10px 10px; }
  .thumbs img { height:72px; border-radius:4px; background:#2c2f36; cursor:zoom-in; }
  .new { box-shadow:0 0 0 2px var(--run); }
  #zoom { position:fixed; inset:0; background:rgba(0,0,0,.85); display:none; align-items:center; justify-content:center; z-index:9; cursor:zoom-out; }
  #zoom img { max-width:96vw; max-height:96vh; }
</style>
</head>
<body>
<header>
  <h1>Asset preview</h1>
  <div id="envs"></div>
  <span class="spacer"></span>
  <button id="sortNew" class="on">Newest</button>
  <button id="sortName">Name</button>
  <span class="meta" id="info"></span>
</header>
<main id="grid"></main>
<div id="zoom"><img alt=""></div>
<script>
  let env = 'All', sort = 'new', seen = new Set(), first = true;
  const ago = (t) => { const s = Math.max(0, (Date.now() - t) / 1000); if (s < 60) return Math.round(s) + ' s ago'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return (s / 3600).toFixed(1) + ' h ago'; return Math.round(s / 86400) + ' d ago'; };
  const q = (id) => document.getElementById(id);
  function render() {
    const data = window.__ASSETS__ || { assets: [] };
    const envs = ['All', ...[...new Set(data.assets.map((a) => a.env))].sort()];
    q('envs').innerHTML = envs.map((e) => '<button data-env="' + e + '" class="' + (e === env ? 'on' : '') + '">' + e + ' <span class="meta">' + (e === 'All' ? data.assets.length : data.assets.filter((a) => a.env === e).length) + '</span></button>').join(' ');
    let list = data.assets.filter((a) => env === 'All' || a.env === env);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    q('grid').innerHTML = list.map((a) => {
      const isNew = !first && !seen.has(a.name + ':' + a.updated);
      const score = a.score != null ? '<span class="tag">' + a.score + '/10</span>' : '';
      const status = a.status ? '<span class="tag status-' + a.status + '">' + a.status + (a.tier ? ' · ' + a.tier : '') + '</span>' : '';
      const tris = a.triangles ? '<span class="tag">' + a.triangles.toLocaleString() + ' tris</span>' : '';
      const thumbs = [a.sprite && '<img src="' + a.sprite.src + '?v=' + a.sprite.v + '" title="sprites" data-full="' + a.sprite.src + '">', a.mock && '<img src="' + a.mock.src + '?v=' + a.mock.v + '" title="mockup" data-full="' + a.mock.src + '">'].filter(Boolean).join('');
      return '<div class="card' + (isNew ? ' new' : '') + '"><img class="render" src="' + a.render.src + '?v=' + a.render.v + '" data-full="' + a.render.src + '" loading="lazy">' +
        '<div class="row"><b>' + a.name + '</b><span class="tag">' + a.env + '</span>' + status + score + tris + '<span class="spacer"></span><span class="meta" title="' + new Date(a.updated).toLocaleString() + '">' + ago(a.updated) + '</span></div>' +
        (thumbs ? '<div class="thumbs">' + thumbs + '</div>' : '') + '</div>';
    }).join('');
    for (const a of data.assets) seen.add(a.name + ':' + a.updated);
    first = false;
    q('info').textContent = list.length + ' shown · data ' + ago(data.generated);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-env]'); if (b) { env = b.dataset.env; render(); return; }
    const img = e.target.closest('img[data-full]'); if (img) { q('zoom').style.display = 'flex'; q('zoom').querySelector('img').src = img.dataset.full + '?v=' + Date.now(); return; }
    if (e.target.closest('#zoom')) q('zoom').style.display = 'none';
  });
  q('sortNew').onclick = () => { sort = 'new'; q('sortNew').classList.add('on'); q('sortName').classList.remove('on'); render(); };
  q('sortName').onclick = () => { sort = 'name'; q('sortName').classList.add('on'); q('sortNew').classList.remove('on'); render(); };
  function reload() {
    const s = document.createElement('script'); s.src = 'data.js?v=' + Date.now();
    s.onload = () => { render(); s.remove(); }; document.head.appendChild(s);
  }
  reload(); setInterval(reload, 5000);
</script>
</body>
</html>
`;

fs.mkdirSync(PAGE_DIR, { recursive: true });
fs.writeFileSync(path.join(PAGE_DIR, 'index.html'), PAGE);
const data = writeData();
console.log(`asset preview: ${data.assets.length} assets -> ${path.relative(ROOT, path.join(PAGE_DIR, 'index.html'))}`);
if (process.argv.includes('--watch')) {
  setInterval(writeData, 3000);
  console.log('watching (ctrl-c to stop)');
}
