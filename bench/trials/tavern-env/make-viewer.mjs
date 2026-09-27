#!/usr/bin/env node
// Generate bench/runs/tavern-env-r1/viewer.html — a live review dashboard for the forest batch.
//   node make-viewer.mjs          # generate once
//   node make-viewer.mjs --watch  # regenerate every 20 s (run detached)
//
// Reads per-asset runs (meta.json, final-inspect.log, stats.json, render.png, sprites),
// review verdicts from reviews.json ({"<asset>": {"status": "pass|fix|drop", "notes": "..."}}),
// and graft state from the repo's assets/ directory. Grafted cards show the repo's
// out/<asset>/render.png so post-fix rebuilds appear.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const runsRoot = join(here, "..", "..", "runs");
const runs = join(runsRoot, "tavern-env-r1");
const repo = join(here, "..", "..", "..");
const out = join(runs, "viewer.html");

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
const reviews = readJson(join(here, "reviews.json")) ?? {};

const ROUND_DIRS = [["tavern-env-r1", 1]];
// Trials still running: run directories without a meta.json yet. Queued: rows left in queue.tsv.
const active = new Set();
for (const [runDir] of ROUND_DIRS) {
  const base = join(runsRoot, runDir);
  if (!existsSync(base)) continue;
  for (const asset of readdirSync(base)) {
    const dir = join(base, asset);
    if (!statSync(dir).isDirectory()) continue;
    // A trial writes meta.json at launch and rewrites it with exit_code when finished.
    const finished = readdirSync(dir).some((s) => readJson(join(dir, s, "meta.json"))?.exit_code !== undefined);
    if (!finished) active.add(asset);
  }
}
const queued = new Set();
const queuePath = join(here, "queue.tsv");
if (existsSync(queuePath)) {
  for (const line of readFileSync(queuePath, "utf8").split("\n")) {
    const asset = line.split("\t")[0]?.trim();
    if (asset) queued.add(asset);
  }
}
// Card state: work = building or queued (yellow), pass = passed (green),
// fail = failed and nothing improving it (red).
const stateOf = (c) => {
  if (active.has(c.asset)) return ["work", "BUILDING"];
  if (queued.has(c.asset)) return ["work", "QUEUED"];
  const st = c.review.status;
  if (st === "pass") return ["pass", "PASSED"];
  if (st === "fix") return ["fail", "FAILED"];
  if (st === "drop") return ["fail", "DROPPED"];
  return ["work", "REVIEW PENDING"];
};

function warningsOf(inspectPath) {
  if (!existsSync(inspectPath)) return [];
  const txt = readFileSync(inspectPath, "utf8");
  const i = txt.indexOf("## Warnings");
  if (i < 0) return [];
  return txt.slice(i)
    .split("\n").filter((l) => l.startsWith("- ") && l !== "- none")
    .map((l) => l.slice(2));
}

function trianglesOf(inspectPath) {
  if (!existsSync(inspectPath)) return null;
  const m = readFileSync(inspectPath, "utf8").match(/([\d,]+) triangles/);
  return m ? Number(m[1].replaceAll(",", "")) : null;
}

const cards = [];
for (const [runDir, round] of ROUND_DIRS) {
  const base = join(runsRoot, runDir);
  if (!existsSync(base)) continue;
  for (const asset of readdirSync(base).sort()) {
    const dir = join(base, asset);
    if (!statSync(dir).isDirectory()) continue;
    for (const slug of readdirSync(dir).sort()) {
      const r = join(dir, slug);
      const meta = readJson(join(r, "meta.json"));
      if (!meta) continue;
      const outDir = join(r, "ws", "out", asset);
      const inspect = join(r, "final-inspect.log");
      const render = join(outDir, "render.png");
      if (!existsSync(render)) continue;
      const mockup = existsSync(join(here, "mockups", "forest-quest_001.jpg"))
        ? relative(runs, join(here, "mockups", "forest-quest_001.jpg")) : null;
      const grafted = existsSync(join(repo, "assets", `${asset}.ts`));
      const repoRender = join(repo, "out", asset, "render.png");
      cards.push({
        asset, slug, round,
        model: meta.model ?? slug,
        seconds: meta.seconds ?? 0,
        exit: meta.exit_code,
        buildOk: !!meta.final_build_ok,
        hasFile: !!meta.asset_file,
        triangles: trianglesOf(inspect),
        warnings: warningsOf(inspect),
        grafted,
        review: reviews[asset] ?? {},
        render: grafted && existsSync(repoRender) ? relative(runs, repoRender) : relative(runs, render),
        sprites: existsSync(join(outDir, "sprites", "preview.png"))
          ? relative(runs, join(outDir, "sprites", "preview.png")) : null,
        mockup,
      });
    }
  }
}

for (const c of cards) {
  const [state, label] = stateOf(c);
  c.state = state;
  c.stateLabel = label;
}

const rank = { work: 0, fail: 1, pass: 2 };
cards.sort((a, b) =>
  (rank[a.state] - rank[b.state]) ||
  a.asset.localeCompare(b.asset) || a.round - b.round);

const countSt = (s) => cards.filter((c) => c.state === s).length;
const badge = (label, cls) => `<span class="b ${cls}">${label}</span>`;
const fmt = (s) => (s == null ? "" : `${Math.round(s / 60)} min`);

const cardHtml = (c) => {
  const stateCls = c.state === "work" ? "fix" : c.state === "fail" ? "drop" : "pass";
  const roundBadge = c.round >= 2 ? badge(`R${c.round}`, "ok") : "";
  const badges = [
    badge(c.stateLabel, stateCls),
    roundBadge,
    c.grafted ? badge("GRAFTED", "grafted") : "",
    c.buildOk ? badge("build ok", "ok") : badge("BUILD FAIL", "drop"),
    c.hasFile ? "" : badge("NO FILE", "drop"),
  ].join(" ");
  const warn = c.warnings.length
    ? `<ul class="warn">${c.warnings.map((w) => `<li>${w}</li>`).join("")}</ul>` : "";
  const mock = c.mockup ? `<figure><img src="${c.mockup}" loading="lazy"><figcaption>mockup</figcaption></figure>` : "";
  const spr = c.sprites ? `<figure><img src="${c.sprites}" loading="lazy"><figcaption>sprites 128 px</figcaption></figure>` : "";
  const notes = c.review.notes ? `<p class="notes">${c.review.notes}</p>` : "";
  const score = c.review.score;
  return `<article class="card st-${c.state}">
  <div class="head">
    <h2>${c.asset} <small>${c.model}</small></h2>
    <div class="score">${score ?? "—"}<small>/10</small></div>
  </div>
  <p class="meta">${badges}<span>${fmt(c.seconds)}</span><span>${c.triangles?.toLocaleString() ?? "?"} tris</span>${c.exit !== 0 ? `<span class="warnb">exit ${c.exit}</span>` : ""}</p>
  ${warn}${notes}
  <img class="render" src="${c.render}" loading="lazy">
  <div class="row">${mock}${spr}</div>
</article>`;
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Chibi Quest — environment batch</title>
<style>
  :root { color-scheme: dark; }
  body { background:#171a21; color:#dfe3ea; font:14px/1.45 system-ui,sans-serif; margin:24px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { color:#8b93a3; margin:0 0 16px; }
  .counts span { margin-right:14px; padding:2px 10px; border-radius:99px; background:#232833; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(430px,1fr)); gap:18px; }
  .card { background:#1e232d; border:1px solid #2c3342; border-radius:12px; padding:14px; }
  .card.st-pass { border-color:#3d7a4e; } .card.st-work { border-color:#b98a2e; } .card.st-fail { border-color:#8a3d3d; }
  .head { display:flex; align-items:center; gap:10px; margin:-14px -14px 10px; padding:9px 14px; border-radius:12px 12px 0 0; border-bottom:1px solid #2c3342; }
  .card.st-pass .head { background:#1d3b26; } .card.st-work .head { background:#3b2f12; } .card.st-fail .head { background:#3d1d1c; }
  .score { margin-left:auto; font-size:26px; font-weight:800; line-height:1; white-space:nowrap; }
  .score small { font-size:12px; font-weight:600; color:#8b93a3; }
  .card.st-pass .score { color:#7ed99a; } .card.st-work .score { color:#e8c069; } .card.st-fail .score { color:#e88; }
  .card h2 { font-size:16px; margin:0; } .card h2 small { color:#8b93a3; font-weight:400; font-size:12px; display:block; }
  .meta { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 8px; color:#8b93a3; align-items:center; }
  .b { padding:1px 8px; border-radius:99px; font-size:11px; font-weight:600; }
  .b.pass { background:#20402a; color:#7ed99a; } .b.fix { background:#443614; color:#e8c069; }
  .b.drop { background:#44201f; color:#e88; } .b.pending { background:#2b3140; color:#a7b0c0; }
  .b.ok { background:#223047; color:#8ab4f8; } .b.grafted { background:#1f3a44; color:#6fd3e8; }
  .warnb { color:#e88; font-weight:600; }
  .warn { color:#e8c069; font-size:12px; margin:4px 0 8px; padding-left:18px; }
  .notes { color:#c9d2e0; background:#232a36; border-left:3px solid #4a5872; padding:6px 10px; border-radius:4px; }
  img.render { width:100%; border-radius:8px; background:#252a35; display:block; }
  .row { display:flex; gap:10px; margin-top:10px; }
  .row figure { margin:0; flex:1; min-width:0; }
  .row img { width:100%; height:96px; object-fit:contain; border-radius:6px; background:#252a35; }
  figcaption { color:#8b93a3; font-size:11px; text-align:center; margin-top:2px; }
</style></head><body>
<h1>Chibi Quest — forest environment batch (6 assets, 4 models)</h1>
<p class="sub">Generated ${new Date().toLocaleTimeString()} · <span style="color:#7ed99a">green = passed</span> · <span style="color:#e8c069">yellow = building or queued</span> · <span style="color:#e88">red = failed, not being improved</span> · auto-refreshes every 45 s</p>
<p class="counts">
  <span>working ${countSt("work")}</span><span>failed ${countSt("fail")}</span>
  <span>passed ${countSt("pass")}</span><span>grafted ${cards.filter((c) => c.grafted).length}/${cards.length}</span>
</p>
<div class="grid">
${cards.map(cardHtml).join("\n")}
</div>
<script>
  history.scrollRestoration = "auto";
  setInterval(() => location.reload(), 45000);
</script>
</body></html>`;

writeFileSync(out, html);
console.log(`wrote ${out} (${cards.length} cards)`);
if (process.argv.includes("--watch")) {
  const { spawnSync } = await import("node:child_process");
  setInterval(() => spawnSync(process.execPath, [fileURLToPath(import.meta.url)]), 20000);
}
