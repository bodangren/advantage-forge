#!/usr/bin/env node
// Equipment-part refactor check (docs/equipment-parts.md). Before a character's equipment moves
// into assets/parts/, save its outputs; after the refactor, rebuild and compare.
//
//   ./forge render <name> && ./forge sprites <name>      # textured outputs of the old source
//   node scripts/part-check.mjs save <name>               # copy them to out/_part-baseline/<name>/
//   (refactor the character to import the part modules)
//   ./forge render <name> && ./forge sprites <name>
//   node scripts/part-check.mjs compare <name>            # meshes per body, then images
//
// Meshes: every body of the baseline GLB must still exist. A body is "identical" when no vertex
// moved more than 0.001 mm. Images: render.png, views/*.png, and sprites/*.png (not the preset
// and clip sheets). A pixel "changed" when a channel differs by more than 16 of 255.
// Verdict: PASS when no body is missing and every image has 0.5% changed pixels or less.
import { NodeIO } from '@gltf-transform/core';
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOVE_MM = 0.001;
const CHANNEL = 16;
const MAX_CHANGED = 0.5; // percent

const [cmd, name] = process.argv.slice(2);
if (!['save', 'compare'].includes(cmd ?? '') || !name) {
  console.error('usage: node scripts/part-check.mjs save|compare <name>');
  process.exit(2);
}
const OUT = join(ROOT, 'out', name);
const BASE = join(ROOT, 'out', '_part-baseline', name);

/** The files the check reads, relative to out/<name>/. */
function files(dir) {
  const list = [`${name}.glb`, 'render.png'];
  for (const sub of ['views', 'sprites']) {
    const d = join(dir, sub);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).sort()) if (f.endsWith('.png')) list.push(join(sub, f));
  }
  return list.filter((f) => existsSync(join(dir, f)));
}

if (cmd === 'save') {
  if (!existsSync(join(OUT, `${name}.glb`))) {
    console.error(`out/${name}/${name}.glb is missing: run ./forge render ${name} and ./forge sprites ${name} first.`);
    process.exit(1);
  }
  rmSync(BASE, { recursive: true, force: true });
  for (const f of files(OUT)) {
    mkdirSync(dirname(join(BASE, f)), { recursive: true });
    copyFileSync(join(OUT, f), join(BASE, f));
  }
  console.log(`saved ${files(BASE).length} files to ${relative(ROOT, BASE)}`);
  process.exit(0);
}

if (!existsSync(BASE)) {
  console.error(`no baseline: run node scripts/part-check.mjs save ${name} before the refactor.`);
  process.exit(1);
}

const io = new NodeIO();
async function meshes(file) {
  const doc = await io.read(file);
  const out = new Map();
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    out.set(node.getName(), mesh.listPrimitives().map((p) => p.getAttribute('POSITION')?.getArray() ?? new Float32Array()));
  }
  return out;
}

let pass = true;
const a = await meshes(join(BASE, `${name}.glb`));
const b = await meshes(join(OUT, `${name}.glb`));
let identical = 0;
const notes = [];
for (const [body, prims] of a) {
  const next = b.get(body);
  if (!next) {
    notes.push(`  ${body}: MISSING in the new build`);
    pass = false;
    continue;
  }
  const x = prims.flatMap((p) => Array.from(p));
  const y = next.flatMap((p) => Array.from(p));
  if (x.length !== y.length) {
    notes.push(`  ${body}: vertex count ${x.length / 3} -> ${y.length / 3}`);
    continue;
  }
  let move = 0;
  for (let i = 0; i < x.length; i++) move = Math.max(move, Math.abs(x[i] - y[i]));
  if (move * 1000 <= MOVE_MM) identical++;
  else notes.push(`  ${body}: max vertex move ${(move * 1000).toFixed(3)} mm`);
}
for (const body of b.keys()) if (!a.has(body)) notes.push(`  ${body}: new body`);
console.log(`meshes: ${identical} of ${a.size} bodies identical`);
for (const n of notes) console.log(n);

async function pixels(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
console.log(`images (changed = a channel differs by more than ${CHANNEL}; limit ${MAX_CHANGED}%):`);
for (const f of files(BASE).filter((f) => f.endsWith('.png'))) {
  if (!existsSync(join(OUT, f))) {
    console.log(`  ${f}: MISSING in the new build`);
    pass = false;
    continue;
  }
  const [x, y] = await Promise.all([pixels(join(BASE, f)), pixels(join(OUT, f))]);
  if (x.width !== y.width || x.height !== y.height) {
    console.log(`  ${f}: size ${x.width}x${x.height} -> ${y.width}x${y.height}`);
    pass = false;
    continue;
  }
  let changed = 0;
  let sum = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    let d = 0;
    for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(x.data[i + c] - y.data[i + c]));
    sum += d;
    if (d > CHANNEL) changed++;
  }
  const n = x.data.length / 4;
  const pct = (changed / n) * 100;
  if (pct > MAX_CHANGED) pass = false;
  console.log(`  ${f.padEnd(28)} changed ${pct.toFixed(3)}%  mean ${(sum / n).toFixed(3)}${pct > MAX_CHANGED ? '  OVER' : ''}`);
}
console.log(`result ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
