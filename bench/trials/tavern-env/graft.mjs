#!/usr/bin/env node
// Copy every built tavern asset from ws/ into repo assets/, run ./forge all to validate
// (FORGE_SLOTS=2 honors the machine's 2-slot build cap), and write a graft-results.json.
import { readdirSync, statSync, existsSync, copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const repo = "/home/daniebo/Desktop/advantage-forge";
const ROOTS = [`${repo}/bench/runs/tavern-env-r1`, `${repo}/bench/runs/tavern-env-r2`, `${repo}/bench/runs/tavern-env-r3`];

const discovered = new Map();
for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const asset of readdirSync(root).sort()) {
    if (asset === "viewer.html") continue;
    const dir = join(root, asset);
    if (!statSync(dir).isDirectory()) continue;
    for (const slug of readdirSync(dir)) {
      const src = join(dir, slug, "ws", "assets", `${asset}.ts`);
      if (!existsSync(src)) continue;
      const out = join(dir, slug, "ws", "out", asset, "render.png");
      if (!existsSync(out)) continue;
      const prev = discovered.get(asset);
      if (!prev || statSync(src).mtimeMs > prev.mtime) {
        discovered.set(asset, { src, run: root.split("/").pop(), mtime: statSync(src).mtimeMs });
      }
    }
  }
}

const list = [...discovered.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log(`[graft] ${list.length} assets discovered`);

const run = (cmd, args, env = {}) => new Promise((resolve) => {
  const c = spawn(cmd, args, { cwd: repo, env: { ...process.env, FORGE_SLOTS: "2", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  let so = ""; let se = "";
  c.stdout.on("data", (d) => (so += d.toString()));
  c.stderr.on("data", (d) => (se += d.toString()));
  c.on("close", (code) => resolve({ code, stdout: so, stderr: se }));
});

const results = [];
const CONCURRENCY = 2; // honor the 2 build slots mentioned in AGENTS.md
const queue = [...list];
const inflight = new Set();
let done = 0;

async function runOne([asset, info]) {
  const target = join(repo, "assets", `${asset}.ts`);
  copyFileSync(info.src, target);
  const { code, stdout } = await run("./forge", ["all", asset]);
  const ok = code === 0 && !stdout.match(/warning:/);
  const triMatch = stdout.match(/(\d[\d,]*)\s+triangles/);
  const tri = triMatch ? triMatch[1].replaceAll(",", "") : "?";
  done++;
  results.push({ asset, ok, code, tri, run: info.run });
  console.log(`[graft] ${done}/${list.length} ${asset} exit=${code} tri=${tri} ok=${ok}`);
  return [asset, ok];
}

async function main() {
  while (queue.length || inflight.size) {
    while (inflight.size < CONCURRENCY && queue.length) {
      const item = queue.shift();
      const p = runOne(item).then(() => inflight.delete(p));
      inflight.add(p);
    }
    if (inflight.size) await Promise.race(inflight);
  }
  writeFileSync(join(repo, "bench", "trials", "tavern-env", "graft-results.json"), JSON.stringify(results, null, 2));
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n[graft] done. ${passed}/${results.length} passed.`);
}
main().catch((e) => { console.error(e); process.exit(1); });