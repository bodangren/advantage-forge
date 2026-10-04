#!/usr/bin/env node
// Checks that an edit of an asset source left its mesh and vertex colors the same (for type-only
// corrections). Builds the committed source (git HEAD, or --rev) and the working source under
// temporary names with --fast, then compares the bounds, the raw and reduced triangle counts of
// every body, and the GLB binary chunk (positions, normals, vertex colors).
//
//   node scripts/mesh-same.mjs <name> [--rev <git rev>] [--part assets/parts/<part>.ts]...
//
// Prints SAME or DIFF with the differences; exit 0 on SAME, 1 on DIFF, 2 on a build error.
// out/<name>/ is never touched; the temporary sources and outputs are removed. Without --part only
// assets/<name>.ts is compared: both builds import the working copies of any parts. Each --part
// makes the committed build import the committed copy of that part, so an edit of a kind factory
// is compared too (the part must be imported directly by assets/<name>.ts).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const name = process.argv[2];
const revAt = process.argv.indexOf('--rev');
const rev = revAt > 0 ? process.argv[revAt + 1] : 'HEAD';
if (!name || name.startsWith('-')) {
  console.error('usage: node scripts/mesh-same.mjs <name> [--rev <git rev>]');
  process.exit(2);
}
const parts = process.argv.flatMap((a, i) => (a === '--part' ? [process.argv[i + 1]] : []));
const committed = execFileSync('git', ['show', `${rev}:assets/${name}.ts`], { cwd: root, encoding: 'utf8' });
const working = readFileSync(join(root, 'assets', `${name}.ts`), 'utf8');

/** The BIN chunk of a GLB: geometry and vertex colors, without the JSON names. */
function binChunk(glb) {
  let at = 12;
  while (at < glb.length) {
    const length = glb.readUInt32LE(at);
    const type = glb.readUInt32LE(at + 4);
    if (type === 0x004e4942) return glb.subarray(at + 8, at + 8 + length);
    at += 8 + length;
  }
  return Buffer.alloc(0);
}

function build(code, tag) {
  const tmp = `tmp-mesh-${tag}-${name}`;
  const file = join(root, 'assets', `${tmp}.ts`);
  const renamed = code.replace(`name: '${name}'`, `name: '${tmp}'`);
  if (renamed === code) {
    console.error(`mesh-same: no "name: '${name}'" in the ${tag === 'a' ? rev : 'working'} source`);
    process.exit(2);
  }
  // The committed build imports the committed parts under temporary names.
  const partFiles = [];
  let source = renamed;
  if (tag === 'a')
    for (const part of parts) {
      const base = basename(part, '.ts');
      const partTmp = `tmp-mesh-a-${base}`;
      const swapped = source.replaceAll(`./parts/${base}.js`, `./parts/${partTmp}.js`);
      if (swapped === source) {
        console.error(`mesh-same: assets/${name}.ts does not import ./parts/${base}.js`);
        process.exit(2);
      }
      source = swapped;
      const partFile = join(root, 'assets', 'parts', `${partTmp}.ts`);
      writeFileSync(partFile, execFileSync('git', ['show', `${rev}:${part}`], { cwd: root, encoding: 'utf8' }));
      partFiles.push(partFile);
    }
  writeFileSync(file, source);
  try {
    const run = spawnSync(join(root, 'forge'), ['build', tmp, '--fast'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, FORGE_WORKERS: process.env.FORGE_WORKERS ?? '1' },
    });
    if (run.status !== 0) {
      console.error(`mesh-same: the ${tag === 'a' ? rev : 'working'} build failed\n${run.stdout}${run.stderr}`);
      process.exit(2);
    }
    const stats = JSON.parse(readFileSync(join(root, 'out', tmp, 'stats.json'), 'utf8'));
    const bin = createHash('sha256').update(binChunk(readFileSync(join(root, 'out', tmp, `${tmp}.glb`)))).digest('hex');
    return { stats, bin };
  } finally {
    rmSync(file, { force: true });
    for (const f of partFiles) rmSync(f, { force: true });
    rmSync(join(root, 'out', tmp), { recursive: true, force: true });
  }
}

const a = build(committed, 'a');
const b = build(working, 'b');
const diffs = [];
for (const k of ['min', 'max'])
  a.stats.bounds[k].forEach((v, i) => {
    if (v !== b.stats.bounds[k][i]) diffs.push(`bounds.${k}[${i}]: ${v} -> ${b.stats.bounds[k][i]}`);
  });
const bodies = (s) => new Map(s.bodies.map((x) => [x.name, x]));
const ba = bodies(a.stats);
const bb = bodies(b.stats);
for (const [n, x] of ba) {
  const y = bb.get(n);
  if (!y) diffs.push(`body ${n}: missing`);
  else if (x.rawTriangles !== y.rawTriangles || x.triangles !== y.triangles)
    diffs.push(`body ${n}: raw ${x.rawTriangles} -> ${y.rawTriangles}, triangles ${x.triangles} -> ${y.triangles}`);
}
for (const n of bb.keys()) if (!ba.has(n)) diffs.push(`body ${n}: added`);
if (diffs.length === 0 && a.bin !== b.bin) diffs.push('GLB data differs (vertex positions or colors) with equal triangle counts');
console.log(
  diffs.length ? `DIFF ${name}\n  ${diffs.join('\n  ')}` : `SAME ${name}: ${b.stats.triangles} triangles, ${b.stats.bodies.length} bodies, identical GLB data`,
);
process.exit(diffs.length ? 1 : 0);
