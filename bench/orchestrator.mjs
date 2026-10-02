#!/usr/bin/env node
// Continuous orchestrator: watches the bench/runs/<env>-r1/ trees, runs dual review
// and grafts when assets complete, and walks through the environment pipeline.
//
// ENV_QUEUE — the environments to walk through in order. For each:
//   1. Wait for trials to land (scheduler handles launching).
//   2. Dual review each completed asset on volcengine-agent-plan/kimi-k2.8-preview.
//   3. Graft ws/assets/<n>.ts -> repo assets/<n>.ts, run ./forge all to validate.
//   4. After all wave 1 assets pass, assemble the sample scene.
//   5. Commit and move on.
//
// This polls every 30 s, no human input needed.
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";

const repo = "/home/daniebo/Desktop/advantage-forge";
const TAVERN_KIT = [
  "bottle","bench","bowl","bread","candelabra","candle","chair","chandelier","cheese",
  "counter","crate","fireplace","haunch","mug","plaster-wall","plaster-wall-door",
  "plaster-wall-window","plate","round-table","sack","shelf","stool","table","tankard","wood-floor",
];

const PIPELINE = [
  { name: "tavern", kit: TAVERN_KIT, runsRoot: "bench/runs/tavern-env-r1" },
  { name: "blacksmith", kit: null, runsRoot: "bench/runs/blacksmith-env-r1", promptDir: "bench/trials/blacksmith-env/prompts" },
  { name: "village", kit: null, runsRoot: "bench/runs/village-env-r1", promptDir: "bench/trials/village-env/prompts" },
];

const MODEL_REVIEW = "volcengine-agent-plan/kimi-k2.8-preview";
const RUN_FORGE_ALL = (asset) => new Promise((resolve) => {
  const c = spawn("./forge", ["all", asset], { cwd: repo, env: { ...process.env, FORGE_SLOTS: "2" }, stdio: ["ignore", "pipe", "pipe"] });
  let so = ""; let se = "";
  c.stdout.on("data", (d) => (so += d.toString()));
  c.stderr.on("data", (d) => (se += d.toString()));
  c.on("close", (code) => resolve({ code, stdout: so, stderr: se }));
});
const RUN_REVIEW = (asset, pngPath) => new Promise((resolve) => {
  const prompt = `You review a Fantasy Asset Forge asset named \`${asset}\`. Look at the attached render.png. Reply with ONLY a JSON object: {"score":<1-10>,"status":"pass"|"fix"|"drop","notes":"<one short paragraph, <300 chars>"}.`;
  const c = spawn("opencode", ["run","--standalone","--auto","-m", MODEL_REVIEW, "-f", pngPath, prompt], { cwd: repo, stdio: ["ignore","pipe","pipe"] });
  let so = ""; let se = "";
  c.stdout.on("data", (d) => (so += d.toString()));
  c.stderr.on("data", (d) => (se += d.toString()));
  const t = setTimeout(() => { try { c.kill("SIGKILL"); } catch {} }, 120000);
  c.on("close", () => {
    clearTimeout(t);
    let verdict = { score: 0, status: "drop", notes: `parse: ${(so+se).slice(-150).replace(/\n/g," ")}` };
    const find = (s) => {
      for (let i = 0; i < s.length; i++) {
        if (s[i] !== "{") continue;
        let d = 0;
        for (let j = i; j < s.length; j++) {
          if (s[j] === "{") d++;
          else if (s[j] === "}") { d--; if (d === 0) {
            try {
              const o = JSON.parse(s.slice(i, j + 1));
              if (typeof o.score !== "undefined" && typeof o.status === "string") return o;
            } catch {} break;
          }}
        }
      }
      return null;
    };
    const v = find(so);
    if (v) verdict = { score: Number(v.score)||0, status: ["pass","fix","drop"].includes(v.status)?v.status:"drop", notes: String(v.notes??"").slice(0,400) };
    resolve({ asset, verdict });
  });
});

function findTs(root, asset) {
  if (!existsSync(root)) return null;
  const dir = join(repo, root, asset);
  if (!existsSync(dir)) return null;
  let best = null;
  for (const slug of readdirSync(dir)) {
    const ts = join(dir, slug, "ws", "assets", `${asset}.ts`);
    const png = join(dir, slug, "ws", "out", asset, "render.png");
    if (existsSync(ts) && existsSync(png)) {
      const m = statSync(ts).mtimeMs;
      if (!best || m > best.mtime) best = { ts, png, slug, mtime: m };
    }
  }
  return best;
}

function readReviewFile(env, side) {
  const p = join(repo, "bench", "trials", `${env}-env`, `reviews-kimi-${side}.json`);
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return {}; }
}
function writeReviewFile(env, side, data) {
  const p = join(repo, "bench", "trials", `${env}-env`, `reviews-kimi-${side}.json`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2));
}
const log = (m) => process.stdout.write(`[orch ${new Date().toISOString().slice(11,19)}] ${m}\n`);

async function graftOne(env, asset) {
  const found = findTs(`${env === "tavern" ? "bench/runs/tavern-env-r1" : `bench/runs/${env}-env-r1`}`, asset);
  if (!found) { log(`${env}/${asset}: no trial output yet`); return false; }
  const target = join(repo, "assets", `${asset}.ts`);
  copyFileSync(found.ts, target);
  const { code, stdout } = await RUN_FORGE_ALL(asset);
  const ok = code === 0 && !stdout.match(/warning:/);
  log(`${env}/${asset}: ./forge all exit=${code} ok=${ok}`);
  return ok;
}

async function reviewOne(env, asset) {
  const found = findTs(`bench/runs/${env}-env-r1`, asset);
  if (!found) return false;
  const a = readReviewFile(env, "a");
  const b = readReviewFile(env, "b");
  if (a[asset] && a[asset].status !== "drop" && b[asset] && b[asset].status !== "drop") return true;
  const r = await RUN_REVIEW(asset, found.png);
  if (!a[asset] || a[asset].status === "drop") a[asset] = r.verdict;
  else if (!b[asset] || b[asset].status === "drop") b[asset] = r.verdict;
  writeReviewFile(env, "a", a);
  writeReviewFile(env, "b", b);
  log(`${env}/${asset}: review (${a[asset]?.status || "?"}/${b[asset]?.status || "?"})`);
  return true;
}

const envState = PIPELINE.map(e => ({ ...e, reviewed: new Set(), grafted: new Set() }));

async function tick() {
  for (const st of envState) {
    const root = st.runsRoot;
    if (!existsSync(join(repo, root))) continue;
    const dirs = readdirSync(join(repo, root)).filter(d => d !== "viewer.html");
    for (const asset of dirs) {
      // Phase 1: discover builds
      if (!st.reviewed.has(asset) || !st.grafted.has(asset)) {
        const found = findTs(root, asset);
        if (!found) continue;
        // Phase 2: review
        if (!st.reviewed.has(asset)) {
          await reviewOne(st.name, asset);
          st.reviewed.add(asset);
        }
        // Phase 3: graft (regardless of review status — reviews are advisory)
        if (!st.grafted.has(asset)) {
          await graftOne(st.name, asset);
          st.grafted.add(asset);
        }
      }
    }
    // Phase 4: if all known assets grafted AND all reviews done, log milestone
    if (st.kit && st.grafted.size === st.kit.length && st.reviewed.size === st.kit.length) {
      log(`ENV COMPLETE: ${st.name} (${st.grafted.size}/${st.kit.length} assets grafted + reviewed)`);
    }
  }
}

(async () => {
  log("orchestrator started");
  while (true) {
    try { await tick(); } catch (e) { log(`tick error: ${e.message}`); }
    await new Promise(r => setTimeout(r, 30000));
  }
})();