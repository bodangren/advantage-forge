/**
 * Comparison page for an OpenCode trial (bench/trial-one.sh): every model's pose sheet
 * (textured turnaround), sprites, stats, and how it worked, side by side.
 *
 *   tsx bench/trial-report.ts <trial-dir> <asset-id> "<title>"   -> <trial-dir>/index.html
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [trial = '', asset = '', title = asset] = process.argv.slice(2);
if (!trial || !asset) throw new Error('usage: trial-report.ts <trial-dir> <asset-id> [title]');

interface Row {
  slug: string;
  model: string;
  seconds: number;
  exit: number;
  /** From the transcript, not the exit code: OpenCode exits 1 after an error it recovered from. */
  outcome: 'finished' | 'timeout' | 'error';
  finalOk: boolean;
  /** Times the harness resumed the session after a dropped connection ended `opencode run`. */
  resumes: number;
  steps: number;
  cost: number;
  tokensIn: number;
  tokensOut: number;
  usedSkill: boolean;
  imageReads: number;
  /** Reads of the trial's reference images (reference/...). */
  refReads: number;
  /** The comment at the top of the asset file: the model's description of the concept. */
  notes: string;
  renders: number;
  inspects: number;
  errors: string[];
  finalText: string;
  triangles: number | null;
  size: number[] | null;
  bodies: { name: string; triangles: number }[];
  warnings: string[];
  images: { sheet: string | null; sprites: string | null; anims: string[] };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const rows: Row[] = [];
mkdirSync(join(trial, 'img'), { recursive: true });

for (const slug of readdirSync(trial).sort()) {
  const dir = join(trial, slug);
  const metaPath = join(dir, 'meta.json');
  if (!existsSync(metaPath)) continue;
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
    model: string;
    seconds: number;
    exit_code: number;
    final_build_ok: boolean;
    resumes?: number;
  };
  const r: Row = {
    slug,
    model: meta.model.replace(/^[^/]+\//, ''),
    seconds: meta.seconds,
    exit: meta.exit_code,
    outcome: 'finished',
    finalOk: meta.final_build_ok,
    resumes: meta.resumes ?? 0,
    steps: 0,
    cost: 0,
    tokensIn: 0,
    tokensOut: 0,
    usedSkill: false,
    imageReads: 0,
    refReads: 0,
    notes: '',
    renders: 0,
    inspects: 0,
    errors: [],
    finalText: '',
    triangles: null,
    size: null,
    bodies: [],
    warnings: [],
    images: { sheet: null, sprites: null, anims: [] },
  };
  const transcript = join(dir, 'transcript.jsonl');
  let lastType = '';
  if (existsSync(transcript))
    for (const line of readFileSync(transcript, 'utf8').split('\n')) {
      let ev: { type?: string; part?: Record<string, unknown>; error?: unknown };
      try {
        ev = JSON.parse(line);
      } catch {
        continue;
      }
      const part = ev.part ?? {};
      if (ev.type && ev.type !== 'harness') lastType = ev.type;
      if (ev.type === 'step_finish') {
        r.steps++;
        r.cost += Number(part.cost ?? 0);
        const t = (part.tokens ?? {}) as { input?: number; output?: number; reasoning?: number; cache?: { read?: number } };
        r.tokensIn += (t.input ?? 0) + (t.cache?.read ?? 0);
        r.tokensOut += (t.output ?? 0) + (t.reasoning ?? 0);
      } else if (ev.type === 'tool_use') {
        const tool = String(part.tool ?? '');
        const input = JSON.stringify((part.state as { input?: unknown } | undefined)?.input ?? {});
        if (tool === 'skill' || /forge-assets\/SKILL\.md/.test(input)) r.usedSkill = true;
        if (tool === 'read' && /\.png"/.test(input)) r.imageReads++;
        if (tool === 'read' && /reference\/[^"]*\.(png|jpe?g)"/.test(input)) r.refReads++;
        if (/forge (render|all)/.test(input)) r.renders++;
        if (/forge inspect/.test(input)) r.inspects++;
      } else if (ev.type === 'text') {
        const text = String(part.text ?? '').trim();
        if (text) r.finalText = text;
      } else if (ev.type === 'error') {
        r.errors.push(JSON.stringify(ev.error ?? part).slice(0, 240));
      }
    }
  // A run finished when the transcript ends with the model's final message, whatever the exit code.
  r.outcome = r.exit === 124 ? 'timeout' : r.exit === 0 || lastType === 'text' ? 'finished' : 'error';
  const src = join(dir, 'ws', 'assets', `${asset}.ts`);
  if (existsSync(src)) {
    // The first comment before defineAsset (models often put the imports first).
    const code = readFileSync(src, 'utf8').split('defineAsset(')[0]!;
    const block = /\/\*([\s\S]*?)\*\//.exec(code)?.[1];
    const lines = block
      ? block.split('\n').map((l) => l.replace(/^\s*\*? ?/, ''))
      : (/(?:^[ \t]*\/\/.*\n){2,}/m.exec(code)?.[0] ?? '').split('\n').map((l) => l.replace(/^\s*\/\/ ?/, ''));
    r.notes = lines.join('\n').trim().slice(0, 2400);
  }
  const out = join(dir, 'ws', 'out', asset);
  const stats = existsSync(join(out, 'stats.json'))
    ? (JSON.parse(readFileSync(join(out, 'stats.json'), 'utf8')) as {
        triangles: number;
        bounds: { size: number[] };
        bodies: { name: string; triangles: number }[];
      })
    : null;
  if (stats) {
    r.triangles = stats.triangles;
    r.size = stats.bounds.size;
    r.bodies = stats.bodies.map((b) => ({ name: b.name, triangles: b.triangles }));
  }
  const inspect = join(out, 'inspect.md');
  if (existsSync(inspect)) {
    const md = readFileSync(inspect, 'utf8');
    const w = md.split('## Warnings')[1] ?? '';
    r.warnings = w
      .split('\n')
      .map((l) => l.replace(/^- /, '').trim())
      .filter((l) => l && l !== 'none');
  }
  for (const [key, file] of [
    ['sheet', 'render.png'],
    ['sprites', 'sprites/preview.png'],
  ] as const) {
    const src = join(out, file);
    if (existsSync(src)) {
      const name = `${slug}-${file.replace('/', '-')}`;
      cpSync(src, join(trial, 'img', name));
      r.images[key] = `img/${name}`;
    }
  }
  const animDir = join(out, 'anim');
  if (existsSync(animDir))
    for (const f of readdirSync(animDir).filter((f) => f.endsWith('.gif')).sort()) {
      const name = `${slug}-anim-${f}`;
      cpSync(join(animDir, f), join(trial, 'img', name));
      r.images.anims.push(`img/${name}`);
    }
  rows.push(r);
}

/** Width / height of a PNG, from its header. */
const aspect = (file: string): number => {
  const b = readFileSync(join(trial, file));
  return b.readUInt32BE(16) / b.readUInt32BE(20);
};

const minutes = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const status = (r: Row) =>
  r.outcome === 'finished' ? 'finished' : r.outcome === 'timeout' ? 'stopped at the 60 min limit' : 'stopped by an error';
const statusClass = (r: Row) => (r.outcome === 'finished' ? 'ok' : r.outcome === 'timeout' ? 'warn' : 'bad');
const resumeNote = (r: Row) =>
  r.resumes
    ? ` A dropped provider connection ended the run ${r.resumes === 1 ? 'once' : `${r.resumes} times`}; each time, the harness resumed the same session with the time that was left.`
    : '';
const statusNote = (r: Row) => (statusText(r) + resumeNote(r)).trim();
const statusText = (r: Row) =>
  r.outcome === 'timeout'
    ? `The time limit stopped this model during its work. The images show <code>assets/${esc(asset)}.ts</code> as the model left it; the model did not check its last edits.`
    : r.outcome === 'error'
      ? `An error stopped this model. The images show <code>assets/${esc(asset)}.ts</code> as the model left it.`
      : r.errors.length
        ? `The model finished and sent its last message. OpenCode reported ${r.errors.length} provider connection errors during the run${r.exit ? `, and it returned exit code ${r.exit}` : ''}.`
        : '';
const kfmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1000)}k`);
const concept = existsSync(join(trial, 'img', 'concept.png')) ? 'img/concept.png' : null;
// The concept sits left of each sheet at the same height: its column share is the aspect ratio.
const pairStyle = (sheet: string) =>
  concept ? `grid-template-columns: minmax(0, ${(aspect(concept) / aspect(sheet)).toFixed(3)}fr) minmax(0, 1fr)` : '';
const prompt = existsSync(join(trial, 'prompt.md')) ? readFileSync(join(trial, 'prompt.md'), 'utf8') : '';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — model comparison</title>
<style>
:root { --bg: #14151a; --panel: #1d1f25; --line: #2e3038; --ink: #eceef2; --muted: #9a9ea8; --good: #82c98a; --warn: #e3b25c; --bad: #e0715c; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.5 system-ui, sans-serif; }
main { max-width: 1600px; margin: 0 auto; padding: 16px; }
h1 { font-size: 22px; margin: 8px 0 4px; }
.lede { color: var(--muted); margin: 0 0 16px; max-width: 110ch; }
details { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; }
details pre { white-space: pre-wrap; color: var(--muted); font-size: 13px; }
.scroll { overflow-x: auto; margin-bottom: 20px; }
table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
th, td { padding: 7px 10px; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; }
th:first-child, td:first-child { text-align: left; }
th { color: var(--muted); font-weight: 500; }
td a { color: var(--ink); }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin-bottom: 18px; }
.card h2 { font-size: 18px; margin: 0 0 4px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.meta { color: var(--muted); font-size: 13px; display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
.sheet { width: 100%; display: block; border-radius: 6px; background: #aeb3ba; }
.lower { display: grid; grid-template-columns: minmax(0, 520px) minmax(0, 1fr); gap: 14px; margin-top: 12px; }
.sprites { width: 100%; image-rendering: pixelated; border-radius: 6px; display: block; }
.facts h3 { font-size: 13px; color: var(--muted); font-weight: 600; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
.facts ul { margin: 0 0 10px; padding-left: 18px; }
.facts p { margin: 0 0 10px; white-space: pre-wrap; }
.say { color: var(--muted); font-size: 13px; max-height: 220px; overflow: auto; border-left: 2px solid var(--line); padding-left: 10px; }
.ok { color: var(--good); } .warn { color: var(--warn); } .bad { color: var(--bad); }
.tag { font-size: 12px; padding: 1px 7px; border-radius: 10px; border: 1px solid var(--line); color: var(--muted); }
.tag.ok { color: var(--good); } .tag.warn { color: var(--warn); } .tag.bad { color: var(--bad); }
.note { margin: 0 0 10px; font-size: 13px; }
.pair { display: grid; gap: 8px; align-items: start; }
.anims { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.anims figure { margin: 0; } .anims img { width: 300px; max-width: 100%; border-radius: 6px; display: block; }
.anims figcaption { color: var(--muted); font-size: 12px; }
.pair img { width: 100%; display: block; border-radius: 6px; }
.concept-top { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; }
.concept-top img { width: 280px; max-width: 100%; border-radius: 8px; }
@media (max-width: 900px) { .lower, .pair { grid-template-columns: 1fr; } .pair img:first-child { width: 50%; } }
</style>
</head>
<body><main>
<h1>${esc(title)}: ${rows.length} models, one prompt</h1>
<p class="lede">Each model got the same prompt in its own copy of the Forge repo (with AGENTS.md and the forge-assets skill) through <code>opencode run</code>, with a 60 minute limit. After each run stopped, the harness built that model's <code>assets/${esc(asset)}.ts</code> again with textures, in the same way for every model. Every pose sheet below is that build, in the standard views (plus a view from the concept's camera angle when the trial asks for one). Sprites are the 8-direction 128 px pass. "Run" comes from the transcript: a run finished when the transcript ends with the model's final message. When a dropped connection ends a run early, the harness resumes the same session with the time that is left.</p>
${concept ? `<div class="concept-top"><img src="${concept}" alt="concept"><p class="lede">The target: the well from the concept map (cropped and enlarged). Each card below shows it again at the left of the model's pose sheet.</p></div>` : ''}
<details><summary>The prompt every model received</summary><pre>${esc(prompt)}</pre></details>
<div class="scroll"><table>
<tr><th>Model</th><th>Time</th><th>Run</th><th>Connection errors</th><th>Steps</th><th>Cost</th><th>Tokens in / out</th><th>Skill</th><th>Renders</th><th>Looked at images</th><th>Looked at concept</th><th>Triangles</th><th>Height</th><th>Warnings</th></tr>
${rows
  .map(
    (r) =>
      `<tr><td><a href="#${r.slug}">${esc(r.model)}</a></td><td>${minutes(r.seconds)}</td><td class="${statusClass(r)}">${esc(status(r))}</td><td class="${r.errors.length ? 'warn' : ''}">${r.errors.length}</td><td>${r.steps}</td><td>$${r.cost.toFixed(3)}</td><td>${kfmt(r.tokensIn)} / ${kfmt(r.tokensOut)}</td><td>${r.usedSkill ? 'yes' : 'no'}</td><td>${r.renders} (+${r.inspects} inspect)</td><td>${r.imageReads}</td><td class="${concept && !r.refReads ? 'bad' : ''}">${r.refReads}</td><td>${r.triangles?.toLocaleString() ?? '—'}</td><td>${r.size ? `${r.size[1]} m` : '—'}</td><td class="${r.warnings.length ? 'warn' : 'ok'}">${r.warnings.length}</td></tr>`,
  )
  .join('\n')}
</table></div>
${rows
  .map(
    (r) => `<section class="card" id="${r.slug}">
<h2>${esc(r.model)} <span class="tag ${statusClass(r)}">${esc(status(r))}</span> <span class="tag">${minutes(r.seconds)}</span></h2>
${statusNote(r) ? `<p class="note ${statusClass(r)}">${statusNote(r)}</p>` : ''}
<div class="meta"><span>${r.triangles?.toLocaleString() ?? '—'} triangles</span><span>${r.size ? `${r.size.join(' × ')} m` : ''}</span><span>${r.bodies.length} bodies</span><span>${r.renders} renders, ${r.inspects} inspects, ${r.imageReads} image reads</span><span>skill ${r.usedSkill ? 'used' : 'not used'}</span></div>
${
  r.images.sheet
    ? concept
      ? `<div class="pair" style="${pairStyle(r.images.sheet)}"><img src="${concept}" alt="concept"><a href="${r.images.sheet}"><img class="sheet" src="${r.images.sheet}" alt="${esc(r.model)} pose sheet"></a></div>`
      : `<a href="${r.images.sheet}"><img class="sheet" src="${r.images.sheet}" alt="${esc(r.model)} pose sheet"></a>`
    : `<p class="bad">No render: the final build ${r.finalOk ? 'produced no image' : 'failed'}.</p>`
}
${r.images.anims.length ? `<div class="anims">${r.images.anims.map((a) => `<figure><img src="${a}" alt="animation"><figcaption>${esc(a.replace(/^.*-anim-/, ''))}</figcaption></figure>`).join('')}</div>` : ''}
<div class="lower">
<div>${r.images.sprites ? `<a href="${r.images.sprites}"><img class="sprites" src="${r.images.sprites}" alt="${esc(r.model)} sprites"></a>` : ''}</div>
<div class="facts">
${r.notes ? `<h3>The model's notes at the top of the asset file</h3><div class="say">${esc(r.notes)}</div><br>` : ''}
<h3>Bodies</h3><ul>${r.bodies.map((b) => `<li>${esc(b.name)} — ${b.triangles.toLocaleString()} tris</li>`).join('')}</ul>
<h3>Inspection warnings</h3>${r.warnings.length ? `<ul>${r.warnings.map((w) => `<li class="warn">${esc(w)}</li>`).join('')}</ul>` : '<p class="ok">none</p>'}
${r.errors.length ? `<h3>Errors during the run</h3><ul>${r.errors.map((e) => `<li class="warn">${esc(e)}</li>`).join('')}</ul>` : ''}
<h3>The model's last message</h3><div class="say">${esc(r.finalText || '(none)')}</div>
</div></div>
</section>`,
  )
  .join('\n')}
</main></body></html>`;
writeFileSync(join(trial, 'index.html'), html);
console.log(`wrote ${join(trial, 'index.html')} (${rows.length} models)`);
