#!/usr/bin/env node
// Rank models from review verdicts + run metadata. Run after every review pass.
//   node rerank.mjs            # prints table, writes ranking.json
// Score: pass=1, fix=0.5, drop=0, averaged per model; ties broken by build speed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const runs = join(here, "..", "..", "runs");
const reviews = JSON.parse(readFileSync(join(here, "reviews.json"), "utf8"));
const manifest = readFileSync(join(here, "manifest.tsv"), "utf8")
  .split("\n").filter(Boolean).slice(1).map((l) => l.split("\t"));

const pts = { pass: 1, fix: 0.5, drop: 0 };
const models = {};
for (const [, file, model] of manifest) {
  (models[model] ??= { model, n: 0, score: 0, minutes: [], warns: 0, tris: [] });
  const m = models[model];
  m.n += 1;
  m.score += pts[reviews[file]?.status ?? "pending"] ?? 0;
  const slugDir = join(runs, "chibi-env", file, model.split("/").pop().replaceAll(".", "-"));
  const metaPath = join(slugDir, "meta.json");
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    m.minutes.push(Math.round(meta.seconds / 60));
    m.tris.push(meta.final_tris ?? 0);
  }
  const inspect = join(slugDir, "final-inspect.log");
  if (existsSync(inspect)) {
    const txt = readFileSync(inspect, "utf8");
    const i = txt.indexOf("## Warnings");
    m.warns += (i >= 0 ? txt.slice(i).split("\n")
      .filter((l) => l.startsWith("- ") && l !== "- none").length : 0);
  }
}
const rows = Object.values(models).map((m) => ({
  model: m.model,
  n: m.n,
  score: +(m.score / m.n).toFixed(3),
  avgMin: Math.round(m.minutes.reduce((a, b) => a + b, 0) / Math.max(m.minutes.length, 1)),
  warns: m.warns,
})).sort((a, b) => b.score - a.score || a.avgMin - b.avgMin);

writeFileSync(join(here, "ranking.json"), JSON.stringify(rows, null, 2));
console.log("rank model                                    score  assets  avgMin  warns");
rows.forEach((r, i) => console.log(
  `${String(i + 1).padStart(4)} ${r.model.padEnd(42)} ${String(r.score).padEnd(6)} ${String(r.n).padStart(4)}   ${String(r.avgMin).padStart(4)}   ${r.warns}`));
