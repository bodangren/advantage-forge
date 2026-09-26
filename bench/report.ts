/**
 * Build the Forge Bench report from bench/runs/*: a leaderboard (Markdown) and a gallery (HTML)
 * that puts every model's renders and sprites side by side per brief.
 *
 *   tsx bench/report.ts            -> bench/site/leaderboard.md, bench/site/index.html
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BENCH, readJsonIf } from './lib.js';

interface Score {
  brief: string;
  category: string;
  valid: boolean;
  blocked_by_gate: boolean;
  gate_reason: string | null;
  tech: number;
  visual: number | null;
  total: number | null;
  contract_violations: number;
  judge_scores: Record<string, number | null> | null;
}
interface Meta {
  run_id: string;
  model: string;
  arm: 'a' | 'b';
  vision: boolean;
  agent: { status: string; seconds: number };
}
interface Usage {
  turns: number;
  tokens: { input: number; output: number; cacheRead: number };
  renders: number;
  inspects: number;
  image_reads: number;
}
interface Row {
  id: string;
  meta: Meta;
  score: Score;
  usage: Usage | null;
  summary: string | null;
}

const runsDir = join(BENCH, 'runs');
const site = join(BENCH, 'site');
rmSync(site, { recursive: true, force: true });
mkdirSync(join(site, 'img'), { recursive: true });

const rows: Row[] = [];
for (const id of existsSync(runsDir) ? readdirSync(runsDir).sort() : []) {
  const dir = join(runsDir, id);
  const score = readJsonIf<Score>(join(dir, 'score.json'));
  const meta = readJsonIf<Meta>(join(dir, 'meta.json'));
  if (!score || !meta) continue;
  const judge = readJsonIf<{ samples?: { summary: string }[] }>(join(dir, 'judge.json'));
  rows.push({
    id,
    meta,
    score,
    usage: readJsonIf<Usage>(join(dir, 'usage.json')),
    summary: judge?.samples?.[0]?.summary ?? null,
  });
  for (const img of ['render.png', 'sprites/preview.png']) {
    const src = join(dir, 'artifacts', 'out', img);
    if (existsSync(src)) {
      mkdirSync(join(site, 'img', id), { recursive: true });
      cpSync(src, join(site, 'img', id, img.replace('/', '-')));
    }
  }
}

const models = [...new Set(rows.filter((r) => r.meta.model !== 'reference').map((r) => r.meta.model))];
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};
const fmt = (v: number | null | undefined, d = 1) => (v === null || v === undefined ? '—' : v.toFixed(d));
const armTotals = (m: string, arm: 'a' | 'b') =>
  rows
    .filter((r) => r.meta.model === m && r.meta.arm === arm && r.score.valid && r.score.total !== null)
    .map((r) => r.score.total!);

const board = models
  .map((m) => {
    const a = median(armTotals(m, 'a'));
    const b = median(armTotals(m, 'b'));
    const mine = rows.filter((r) => r.meta.model === m);
    return {
      model: m,
      vision: mine.some((r) => r.meta.vision),
      runs: mine.length,
      a,
      b,
      best: Math.max(a ?? -1, b ?? -1),
      gates: mine.filter((r) => r.score.blocked_by_gate).length,
      visual: median(mine.filter((r) => r.score.visual !== null).map((r) => r.score.visual!)),
      tech: median(mine.map((r) => r.score.tech)),
      minutes: median(mine.map((r) => r.meta.agent.seconds / 60)),
    };
  })
  .sort((x, y) => y.best - x.best);

const md: string[] = [
  '# Forge Bench leaderboard',
  '',
  `${rows.length} runs, ${models.length} models. Totals are medians over runs (0 to 100). Arm a = No Skills, arm b = Skills.`,
  '',
  '| Model | Vision | Runs | No Skills | Skills | Skills delta | Gate failures | Visual | Tech | Minutes |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...board.map(
    (r) =>
      `| ${r.model} | ${r.vision ? 'yes' : 'no'} | ${r.runs} | ${fmt(r.a)} | ${fmt(r.b)} | ${r.a !== null && r.b !== null ? fmt(r.b - r.a) : '—'} | ${r.gates} | ${fmt(r.visual)} | ${fmt(r.tech)} | ${fmt(r.minutes, 0)} |`,
  ),
  '',
  '## Calibration',
  '',
  ...rows
    .filter((r) => r.meta.model === 'reference')
    .map(
      (r) =>
        `- ${r.id}: total ${fmt(r.score.total)} (visual ${fmt(r.score.visual)}, tech ${fmt(r.score.tech)})`,
    ),
];
writeFileSync(join(site, 'leaderboard.md'), md.join('\n') + '\n');

// ------------------------------------------------------------------ gallery
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const briefs = [...new Set(rows.map((r) => r.score.brief))].sort();
const card = (r: Row) => {
  const img = (f: string) => (existsSync(join(site, 'img', r.id, f)) ? `img/${r.id}/${f}` : null);
  const render = img('render.png');
  const sprites = img('sprites-preview.png');
  const status = r.score.blocked_by_gate
    ? `<span class="bad">gate: ${esc(r.score.gate_reason ?? 'failed')}</span>`
    : '';
  return `<article class="card">
  <header><b>${esc(r.meta.model)}</b> <span class="arm arm-${r.meta.arm}">${r.meta.arm === 'b' ? 'Skills' : r.meta.model === 'reference' ? 'reference' : 'No Skills'}</span>${r.meta.vision ? ' <span class="tag">vision</span>' : ''}</header>
  <div class="nums"><span class="total">${fmt(r.score.total)}</span> <span>visual ${fmt(r.score.visual)}</span> <span>tech ${fmt(r.score.tech)}</span> ${status}</div>
  ${render ? `<a href="${render}"><img src="${render}" alt="${esc(r.id)} turnaround" loading="lazy"></a>` : '<div class="empty">no render</div>'}
  ${sprites ? `<a href="${sprites}"><img class="sprites" src="${sprites}" alt="${esc(r.id)} sprites" loading="lazy"></a>` : ''}
  ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
  <footer>${esc(r.id)}${r.usage ? ` · ${r.usage.turns} turns · ${r.usage.renders} renders · ${Math.round((r.usage.tokens.input + r.usage.tokens.cacheRead) / 1000)}k in` : ''}</footer>
</article>`;
};
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forge Bench</title>
<style>
:root { --bg: #15161a; --panel: #1f2025; --line: #30323a; --ink: #ecedf0; --muted: #9a9ca5; --good: #7fc97f; --bad: #e0715c; --a: #6e8fc4; --b: #d9a458; color-scheme: dark; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.45 system-ui, sans-serif; }
main { max-width: 1400px; margin: 0 auto; padding: 16px; }
h1 { font-size: 22px; } h2 { font-size: 17px; margin-top: 32px; border-bottom: 1px solid var(--line); padding-bottom: 6px; }
table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
th, td { padding: 6px 8px; border-bottom: 1px solid var(--line); text-align: right; } th:first-child, td:first-child { text-align: left; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px; min-width: 0; }
.card img { width: 100%; border-radius: 4px; display: block; margin-top: 8px; image-rendering: auto; }
.card img.sprites { image-rendering: pixelated; }
.card p { color: var(--muted); font-size: 13px; }
.card footer { color: var(--muted); font-size: 12px; margin-top: 6px; overflow-wrap: anywhere; }
.nums { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; color: var(--muted); }
.total { font-size: 22px; color: var(--ink); font-weight: 600; }
.arm { font-size: 12px; padding: 1px 6px; border-radius: 4px; border: 1px solid var(--line); }
.arm-a { color: var(--a); } .arm-b { color: var(--b); }
.tag { font-size: 12px; color: var(--good); }
.bad { color: var(--bad); }
.empty { padding: 40px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 4px; margin-top: 8px; }
.scroll { overflow-x: auto; }
</style>
</head>
<body><main>
<h1>Forge Bench</h1>
<p>Which models make good 3D assets with Fantasy Asset Forge. Each run gives one model one brief; the result is built with textures, graded for technical checks (30%), and judged visually (70%). Arm a = No Skills, arm b = the forge-assets skill.</p>
<h2>Leaderboard</h2>
<div class="scroll"><table>
<tr><th>Model</th><th>Vision</th><th>Runs</th><th>No Skills</th><th>Skills</th><th>Δ</th><th>Gate fails</th><th>Visual</th><th>Tech</th><th>Min</th></tr>
${board.map((r) => `<tr><td>${esc(r.model)}</td><td>${r.vision ? 'yes' : 'no'}</td><td>${r.runs}</td><td>${fmt(r.a)}</td><td>${fmt(r.b)}</td><td>${r.a !== null && r.b !== null ? fmt(r.b - r.a) : '—'}</td><td>${r.gates}</td><td>${fmt(r.visual)}</td><td>${fmt(r.tech)}</td><td>${fmt(r.minutes, 0)}</td></tr>`).join('\n')}
</table></div>
${briefs
  .map((b) => {
    const list = rows
      .filter((r) => r.score.brief === b)
      .sort((x, y) => (y.score.total ?? -1) - (x.score.total ?? -1));
    return `<h2>${esc(b)} <small>(${esc(list[0]?.score.category ?? '')})</small></h2><div class="grid">${list.map(card).join('\n')}</div>`;
  })
  .join('\n')}
</main></body></html>`;
writeFileSync(join(site, 'index.html'), html);
console.log(`report: ${rows.length} runs -> ${join(site, 'index.html')}`);
