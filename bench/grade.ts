/**
 * Grade a run on the host: check the file contract, graft the allowed files onto a clean tree,
 * build the final textured asset with renders, sprites, animations, and inspection, and compute
 * the technical checks.
 *
 *   tsx bench/grade.ts <run-dir>
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, allowed, copyRepo, hashTree, readJson, readJsonIf, writeJson } from './lib.js';
import type { Brief } from './prompt.js';

const runDir = process.argv[2];
if (!runDir) throw new Error('usage: grade.ts <run-dir>');
const brief = readJson<Brief>(join(runDir, 'brief.json'));
const cand = join(runDir, 'candidate');
const art = join(runDir, 'artifacts');
rmSync(art, { recursive: true, force: true });
mkdirSync(art, { recursive: true });

// ---------------------------------------------------------------- file contract
const pristine = readJson<Record<string, string>>(join(runDir, 'pristine.json'));
const now = hashTree(cand, new Set(['node_modules', 'out']));
const violations: string[] = [];
const submitted: string[] = [];
for (const [rel, h] of Object.entries(now)) {
  if (allowed(brief.id, rel)) {
    if (h === 'symlink') violations.push(`symlink not allowed: ${rel}`);
    else if (pristine[rel] !== h) submitted.push(rel);
  } else if (pristine[rel] === undefined) violations.push(`added: ${rel}`);
  else if (pristine[rel] !== h) violations.push(`changed: ${rel}`);
}
for (const rel of Object.keys(pristine))
  if (now[rel] === undefined && !allowed(brief.id, rel)) violations.push(`deleted: ${rel}`);

// ---------------------------------------------------------------- graft onto a clean tree
const tree = join(runDir, 'grade');
rmSync(tree, { recursive: true, force: true });
copyRepo(tree);
rmSync(join(tree, 'assets', `${brief.id}.ts`), { force: true });
for (const rel of submitted) cpSync(join(cand, rel), join(tree, rel));
symlinkSync(join(REPO, 'node_modules'), join(tree, 'node_modules'));

const hasAsset = submitted.includes(`assets/${brief.id}.ts`);
const run = (args: string[], timeoutMs: number) => {
  const t0 = Date.now();
  const r = spawnSync('node', ['--import', 'tsx', 'src/cli/forge.ts', ...args], {
    cwd: tree,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, FORGE_WORKERS: process.env.FORGE_WORKERS ?? '2' },
  });
  return {
    code: r.status ?? -1,
    out: `${r.stdout ?? ''}${r.stderr ?? ''}`,
    ms: Date.now() - t0,
    timedOut: r.error !== undefined,
  };
};
let build = { code: -1, out: 'no asset file was submitted', ms: 0, timedOut: false };
let inspect = { code: -1, out: '', ms: 0, timedOut: false };
if (hasAsset) {
  build = run(['all', brief.id, '--no-ref'], 15 * 60_000);
  if (build.code === 0) inspect = run(['inspect', brief.id, '--fast'], 5 * 60_000);
}
writeFileSync(join(art, 'build.log'), build.out);
writeFileSync(join(art, 'inspect.log'), inspect.out);
const out = join(tree, 'out', brief.id);
if (existsSync(out)) cpSync(out, join(art, 'out'), { recursive: true });

// ---------------------------------------------------------------- technical checks
interface Stats {
  triangles: number;
  bounds: { min: number[]; max: number[]; size: number[] };
  bones: number;
  animations: { name: string; duration: number }[];
}
interface Inspect {
  views: { view: string; bodies: Record<string, number> }[];
  bodies: string[];
}
const stats = readJsonIf<Stats>(join(art, 'out', 'stats.json'));
const insp = readJsonIf<Inspect>(join(art, 'out', 'inspect.json'));
const glb = existsSync(join(art, 'out', `${brief.id}.glb`));
const gate = build.code === 0 && glb && stats !== null;

type Check = { id: string; points: number; pass: boolean | number; detail: string };
const checks: Check[] = [];
const add = (id: string, points: number, pass: boolean | number, detail: string) =>
  checks.push({ id, points, pass, detail });
if (gate && stats) {
  const warnings = (build.out.match(/warning:/g) ?? []).length;
  add('no-warnings', 10, warnings === 0, `${warnings} warning lines`);
  const h = stats.bounds.size[1]!;
  add(
    'height',
    15,
    h >= brief.height[0] && h <= brief.height[1],
    `height ${h} m, expected ${brief.height.join('-')}`,
  );
  add('grounded', 10, Math.abs(stats.bounds.min[1]!) <= 0.02, `lowest point y = ${stats.bounds.min[1]}`);
  const t = stats.triangles;
  add(
    'triangles',
    10,
    t >= brief.triangles[0] && t <= brief.triangles[1],
    `${t} triangles, budget ${brief.triangles.join('-')}`,
  );
  const hidden = insp ? insp.bodies.filter((b) => insp.views.every((v) => (v.bodies[b] ?? 0) === 0)) : [];
  // Parts hidden at rest can be revealed by an animation (a chest's gold, a door's interior).
  const animated = stats.animations.length > 0;
  add(
    'no-hidden-parts',
    10,
    insp !== null && (hidden.length === 0 || animated),
    hidden.length
      ? `hidden at rest: ${hidden.join(', ')}${animated ? ' (allowed: animated asset)' : ''}`
      : 'all parts visible',
  );
  const floating = (inspect.out.match(/floats:/g) ?? []).length;
  add('no-floating-parts', 10, insp !== null && floating === 0, `${floating} floating parts`);
  if (brief.rig) {
    add('rig', 10, stats.bones > 0, `${stats.bones} bones`);
    const names = stats.animations.map((a) => a.name);
    const have = brief.clips.filter((c) => names.includes(c)).length;
    add(
      'clips',
      15,
      have / Math.max(1, brief.clips.length),
      `clips ${names.join(', ') || 'none'}; required ${brief.clips.join(', ')}`,
    );
  } else {
    add('rig', 10, true, 'not required');
    add('clips', 15, true, 'not required');
  }
  const sprites = readJsonIf<{ metrics: Record<string, unknown> }>(
    join(art, 'out', 'sprites', 'metrics.json'),
  );
  const empty = sprites ? Object.values(sprites.metrics).filter((m) => m === null).length : 8;
  add('sprites', 10, sprites !== null && empty === 0, `${empty} empty sprite frames`);
}
const points = checks.reduce(
  (s, c) => s + c.points * (typeof c.pass === 'number' ? c.pass : c.pass ? 1 : 0),
  0,
);
const max = checks.reduce((s, c) => s + c.points, 0);

writeJson(join(runDir, 'tech.json'), {
  schema: 1,
  gate,
  gate_reason: gate
    ? null
    : !hasAsset
      ? 'no asset submitted'
      : build.timedOut
        ? 'build timed out'
        : 'build failed',
  build_ms: build.ms,
  submitted,
  violations,
  checks,
  tech_score: max ? Math.round((1000 * points) / max) / 10 : 0,
  images: gate ? images(join(art, 'out'), brief) : [],
});
console.log(
  `graded ${runDir}: gate ${gate}, tech ${max ? Math.round((100 * points) / max) : 0}, violations ${violations.length}`,
);

function images(dir: string, b: Brief): string[] {
  const list = ['render.png', 'sprites/preview.png'];
  const anim = join(dir, 'anim');
  if (b.rig && existsSync(anim))
    for (const f of readdirSync(anim).sort()) if (f.endsWith('.png')) list.push(`anim/${f}`);
  return list.filter((f) => existsSync(join(dir, f)));
}
