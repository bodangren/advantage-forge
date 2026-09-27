#!/usr/bin/env node
// Reassign failed assets (status fix|drop in reviews.json) to models using ranking.json.
//   node assign-r2.mjs [round]   # round defaults to 2 -> manifest-r2.tsv, prompts-r2/
// Rules: exclude the model that failed the asset; family specialist bonus; load balancing.
// Fallback rule (user): once an asset has failed with 2+ different models ("several
// attempts"), stop rotating the leaderboard and try opencode-go/space-bunny-free instead.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const round = process.argv[2] ?? "2";
const here = dirname(fileURLToPath(import.meta.url));
const runsRoot = join(here, "..", "..", "runs");
const reviews = JSON.parse(readFileSync(join(here, "reviews.json"), "utf8"));
const manifest = readFileSync(join(here, "manifest.tsv"), "utf8")
  .split("\n").filter(Boolean).slice(1).map((l) => l.split("\t"));
// The user wants deepseek trials on the deepseek/deepseek-flash key (v4.1-flash), never
// the opencode-go alias. Translate any ranking entry before assignment.
const ALIAS = { "opencode-go/deepseek-v4.1-flash": "deepseek/deepseek-flash" };
// Last-resort model after several failed attempts with regular models.
const FALLBACK_MODEL = "opencode-go/space-bunny-free";
const ranking = JSON.parse(readFileSync(join(here, "ranking.json"), "utf8"))
  .map((r) => r.model).map((m) => ALIAS[m] ?? m);

const family = (id) =>
  id.startsWith("nature/") ? "nature"
  : id.startsWith("architecture/landscape-parts") ? "tiles"
  : id.startsWith("architecture/") ? "structure"
  : "props";
const specialist = { nature: "opencode-go/mimo-v2.6-flash", tiles: "volcengine-agent-plan/glm-5.3-flash",
  structure: "deepseek/deepseek-flash", props: "opencode-go/muse-spark-1.3-contributor" };

// Distinct models that already attempted each asset, from every round's run meta.json.
function attemptsOf(file) {
  const tried = new Set();
  for (const runDir of readdirSync(runsRoot).filter((d) => d.startsWith("chibi-env"))) {
    const dir = join(runsRoot, runDir, file);
    if (!existsSync(dir)) continue;
    for (const slug of readdirSync(dir)) {
      const metaPath = join(dir, slug, "meta.json");
      if (!existsSync(metaPath)) continue;
      const m = JSON.parse(readFileSync(metaPath, "utf8")).model;
      if (m) tried.add(ALIAS[m] ?? m);
    }
  }
  return tried;
}

const feedback = {
  "dirt-road-corner": `Review feedback (previous attempt scored drop):
- The road patch did NOT reach the tile edges, so the corner cannot connect to straight road tiles.
- The road must enter at the middle of one edge and leave at the middle of an adjacent edge, full-bleed to the tile boundary on both ends.
- Use a smooth quarter-circle bend between the two edge midpoints; no fold or crease across the bend.
- Keep the packed-brown road on a green grass base, soft worn edges, and the tile edges perfectly straight and clean.`,
  "dirt-road-straight": `Review feedback (previous attempt scored fix):
- The road color came out pale tan. Use the warm packed brown of a dirt path, clearly darker than before, so it matches a bare dirt ground tile placed next to it.
- The road slab sat visibly raised on top of the grass base. Blend the road flush with the grass surface (same top height, no step or seam between road and grass).
- Keep the stone flecks and straight clean tile edges.`,
  "tilled-field": `Review feedback (previous attempt scored fix):
- The furrow lines came out too dark, too wide, and wet-shiny. Make them thin, subtle, matte lines about 0.25 m apart on rich brown soil.
- The stripes bled down the side faces. Keep all paint on the top surface; sides stay plain soil color.
- Add a few tiny lighter soil flecks.`,
  fence: `Review feedback (previous attempt scored fix):
- The wood surface displacement was far too strong; it read as bark and made the silhouette fuzzy. Reduce it to a subtle grain, or drop it.
- The post tops were painted cream and look like paint errors. Use the same warm brown wood for the whole fence, with softly rounded post tops.
- Keep the tiling: two end posts, two rails, three pickets, flat ground line.`,
  boulder: `Review feedback (previous attempt scored fix):
- The stone came out near-white. Use a cool mid-gray granite, clearly darker.
- The previous build spent 55k triangles on one rock. Keep total triangles under 15,000: use detail 0.008 or coarser and a maxTriangles limit.
- Keep the rounded lumpy mass, flat base, and the moss patch.`,
};
const triCap = { fence: 12000, boulder: 15000, "dirt-road-straight": 20000,
  "dirt-road-corner": 20000, "tilled-field": 8000 };

const load = {};
const tasks = [];
for (const [id, file] of manifest) {
  const st = reviews[file]?.status;
  if (st !== "fix" && st !== "drop") continue;
  const failedWith = ALIAS[manifest.find((m) => m[1] === file)[2]] ?? manifest.find((m) => m[1] === file)[2];
  const fam = family(id);
  const tried = attemptsOf(file);
  let model;
  if (tried.size >= 2) {
    // Several failed attempts with regular models: hand the asset to the fallback model.
    model = FALLBACK_MODEL;
  } else {
    const scored = ranking
      .filter((m) => m !== failedWith)
      .map((m, i) => ({ m, v: 1 - 0.01 * ranking.indexOf(m) + (specialist[fam] === m ? 0.05 : 0) - 0.03 * (load[m] ?? 0) }))
      .sort((a, b) => b.v - a.v);
    model = scored[0].m;
  }
  load[model] = (load[model] ?? 0) + 1;

  const base = readFileSync(join(here, "prompts", `${file}.prompt.md`), "utf8");
  const cap = triCap[file] ? `\n- Keep the whole asset under ${triCap[file].toLocaleString()} triangles in the final build.\n` : "";
  const patched = base.replace(
    /(Description: .*?\n)/s,
    `$1\n${feedback[file]}\n${cap}`);
  mkdirSync(join(here, `prompts-r${round}`), { recursive: true });
  writeFileSync(join(here, `prompts-r${round}`, `${file}.prompt.md`), patched);
  tasks.push([id, file, model]);
}
writeFileSync(join(here, `manifest-r${round}.tsv`),
  "asset-id\tfile\tmodel\tdescription\n" + tasks.map((t) => t.join("\t")).join("\n") + "\n");
console.log(`round ${round} assignments:`);
tasks.forEach(([id, file, model]) => console.log(`  ${file.padEnd(18)} ${st2(file)} -> ${model}${model === FALLBACK_MODEL ? "  [fallback]" : ""}`));
function st2(f) { return reviews[f].status.toUpperCase().padEnd(5); }
