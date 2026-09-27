#!/usr/bin/env node
// Spawn kimi-k2.8 dual reviews on the tavern-env trials. Concurrency limited so the host
// does not run out of memory. Per-asset, two reviewers (round-robin between coding-plan and
// volcengine-agent-plan so both plans get even wall-clock for the reviews too):
//   - reviewer A: structure / proportions / shape read at 128 px
//   - reviewer B: dressing / texture / palette / construction-contract conformance
// Output JSON files:
//   reviews-kimi-a.json  { asset: { score, status, notes } }
//   reviews-kimi-b.json  { asset: { score, status, notes } }
// Aggregated by the orchestrator into reviews.json with agreement / flag / verdict fields.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const CONCURRENCY = 4;
const TIMEOUT_S = 240;

const ROOTS = [
  join(here, "..", "..", "runs", "tavern-env-r1"),
  join(here, "..", "..", "runs", "tavern-env-r2"),
];
const outA = join(here, "reviews-kimi-a.json");
const outB = join(here, "reviews-kimi-b.json");
const MODEL_A = "volcengine-agent-plan/kimi-k2.8-preview"; // structure reviewer
const MODEL_B = "coding-plan/kimi-k2.8-preview";           // dressing reviewer

// Build the work list. Each entry: { asset, model, kind, tsPath, pngPath, promptPath }.
const tasks = [];
for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const asset of readdirSync(root).sort()) {
    if (asset === "viewer.html") continue;
    const dir = join(root, asset);
    for (const slug of readdirSync(dir)) {
      const wsAssets = join(dir, slug, "ws", "assets");
      const wsOut = join(dir, slug, "ws", "out", asset);
      const tsPath = join(wsAssets, `${asset}.ts`);
      const pngPath = join(wsOut, "render.png");
      if (!existsSync(tsPath) || !existsSync(pngPath)) continue;
      const promptPath = join(here, "prompts", `${asset}.prompt.md`);
      tasks.push({ asset, tsPath, pngPath, promptPath });
    }
  }
}

const promptFor = (asset, kind) => `You are an independent asset reviewer for the Fantasy Asset Forge tavern environment kit. Review the attached image and source against the contract.

The asset is \`${asset}\`. The render.png is attached. The TypeScript source is at the path in the working directory. The mockup anchor is at docs/tavern-mockups/tavern-quest_001.jpg and the global style anchor is docs/tavern-mockups/forest-quest_001.jpg style across the chibi set. The shared design rules are at docs/tavern-mockups/construction.md — read §1 (wall system), §3 (timber palette), and §5 (food/tableware/lighting grammars) as applicable.

Focus: ${kind === "a" ? "structure / silhouette / proportions / 128 px readability. Does the shape match the spec and the mockup? Are the proportions right? Any buried parts, floating parts, or silhouette holes? Final triangle budget within spec?" : "dressing / texture / palette / construction-contract conformance. Does the palette match the contract hex codes? Are wood tones consistent with the shared grammar? Are emissive colors correct? Does the brick/strap/handle/etc. follow the same pattern as the rest of the kit?"}

Return ONLY a JSON object with these exact keys:
  { "score": <integer 1-10>, "status": "pass" | "fix" | "drop", "notes": "<one-paragraph critique, <400 chars, mentions specific dimensions, hex codes, or asset names when calling out issues>" }

Do not write any other text. Just the JSON object.`;

// Run one review: spawn opencode run with the given model and attached image, capture stdout,
// extract the final assistant text message, parse JSON, return verdict.
function runReview({ asset, model, kind, tsPath, pngPath }) {
  const prompt = promptFor(asset, kind);
  return new Promise((resolve) => {
    const args = [
      "run",
      "--standalone",
      "--auto",
      "--format", "json",
      "-m", model,
      "-f", pngPath,
      prompt,
    ];
    const child = spawn("opencode", args, {
      cwd: dirname(tsPath),
      env: { ...process.env, FORGE_VITE_CACHE: "/tmp/opencode-vite-cache" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    const t = setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, TIMEOUT_S * 1000);
    child.on("close", () => {
      clearTimeout(t);
      // Find the last text message in the JSONL-ish output.
      let lastText = null;
      for (const line of stdout.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("{")) continue;
        try {
          const e = JSON.parse(t);
          if (e.type === "text" && e.text) lastText = e.text;
        } catch {}
      }
      let verdict = { score: 0, status: "drop", notes: `parse error: ${stderr.slice(0, 200)}` };
      if (lastText) {
        const m = lastText.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            const j = JSON.parse(m[0]);
            verdict = {
              score: Number(j.score) || 0,
              status: ["pass", "fix", "drop"].includes(j.status) ? j.status : "drop",
              notes: String(j.notes ?? "").slice(0, 400),
            };
          } catch {}
        }
      }
      resolve({ asset, kind, model, verdict });
    });
  });
}

// Worker-pool style execution.
const queue = [...tasks];
// Each task generates TWO reviews (one per reviewer kind).
const work = [];
for (const t of tasks) {
  work.push({ ...t, kind: "a", model: MODEL_A });
  work.push({ ...t, kind: "b", model: MODEL_B });
}
const resultsA = {};
const resultsB = {};
let done = 0;
const total = work.length;
const t0 = Date.now();

const log = (msg) => process.stdout.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${msg}\n`);

async function runOne(w) {
  const r = await runReview(w);
  if (w.kind === "a") resultsA[r.asset] = r.verdict;
  else resultsB[r.asset] = r.verdict;
  done += 1;
  log(`${done}/${total} ${r.asset} (${w.kind}) -> score=${r.verdict.score} status=${r.verdict.status}`);
  return r;
}

async function main() {
  log(`starting dual review: ${total} calls across ${tasks.length} assets, concurrency ${CONCURRENCY}`);
  const inflight = new Set();
  while (work.length || inflight.size) {
    while (inflight.size < CONCURRENCY && work.length) {
      const w = work.shift();
      const p = runOne(w).then(() => inflight.delete(p));
      inflight.add(p);
    }
    if (inflight.size) {
      await Promise.race(inflight);
    }
  }
  writeFileSync(outA, JSON.stringify(resultsA, null, 2));
  writeFileSync(outB, JSON.stringify(resultsB, null, 2));
  log(`done. wrote ${outA} (${Object.keys(resultsA).length} entries)`);
  log(`done. wrote ${outB} (${Object.keys(resultsB).length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});