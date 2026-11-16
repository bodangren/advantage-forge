#!/usr/bin/env node
// Mechanical acceptance check for one trial asset (spec D6).
// Usage: node measure/runs/asset_hy4_maker_trial_20261116/mech-check.mjs <asset-name>
// Writes one JSON line to stdout. Exit 0 when every check passes, 1 otherwise.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const name = process.argv[2];

if (!name) {
  console.log(JSON.stringify({ ok: false, failures: ['usage: mech-check.mjs <asset-name>'] }));
  process.exit(1);
}

const failures = [];
const files = {};
const dir = join(root, 'out', name);

// 1. forge all: exit 0 and no "warning:" line.
const build = spawnSync('./forge', ['all', name], { cwd: root, encoding: 'utf8', timeout: 600_000 });
const output = `${build.stdout ?? ''}${build.stderr ?? ''}`;
const warnings = output
  .split('\n')
  .map((l) => l.trimEnd())
  .filter((l) => /(^|\s)warning:/i.test(l));
if (build.status !== 0) failures.push(`forge all exited ${build.status}`);
if (warnings.length > 0) failures.push(`forge all printed ${warnings.length} warning line(s)`);

// 2. The exported files exist.
const glb = join(dir, `${name}.glb`);
const stats = join(dir, 'stats.json');
const render = join(dir, 'render.png');
const sprites = join(dir, 'sprites', 'preview.png');
for (const [key, path] of [['glb', glb], ['stats', stats], ['render', render], ['sprites', sprites]]) {
  files[key] = existsSync(path);
  if (!files[key]) failures.push(`missing ${path.slice(root.length + 1)}`);
}
files.glbBytes = files.glb ? statSync(glb).size : 0;
if (files.glb && files.glbBytes === 0) failures.push('the GLB holds 0 bytes');

// 3. Triangles and the ground contact come from stats.json.
let triangles = 0;
let bottomY = null;
if (files.stats) {
  const data = JSON.parse(readFileSync(stats, 'utf8'));
  triangles = data.triangles ?? 0;
  bottomY = data.bounds?.min?.[1] ?? null;
}
if (triangles <= 0) failures.push('stats.json names 0 triangles');
if (bottomY === null) failures.push('stats.json names no bounds.min[1]');
else if (Math.abs(bottomY) > 0.005) failures.push(`model bottom is ${bottomY.toFixed(4)} m, not within 5 mm of y = 0`);

// 4. The source type-checks with the project compiler settings.
const tsc = spawnSync(process.execPath, ['scripts/typecheck-asset.mjs', name], {
  cwd: root,
  encoding: 'utf8',
  timeout: 600_000,
});
const tscOutput = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`;
if (tsc.status !== 0) failures.push('typecheck-asset.mjs exited ' + tsc.status);
if (!/typecheck ok:/.test(tscOutput)) failures.push('typecheck-asset.mjs printed no "typecheck ok:" line');

const result = {
  asset: name,
  ok: failures.length === 0,
  forgeAll: { exitCode: build.status, warnings },
  triangles,
  bottomY,
  files,
  typecheckExit: tsc.status,
  failures,
};
console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
