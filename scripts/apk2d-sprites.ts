/**
 * Renders the 2D sprite library with the forge: every model of the 3D packs
 * (scripts/apk-pack-models.ts), at the one 2D camera (orthographic, elevation 45, 64 pixels per
 * meter), so sprites line up with the baked backgrounds (scripts/apk2d-bake.ts). The 2D pack
 * matches the 3D packs one to one (track apk_pack_release_20261006):
 *
 * - a skinned model: a sheet for every clip of its GLB (`--clip all`),
 *   out/apk2d/sprites/<model>/<clip>/{sheet.png, metrics.json} (rows = directions, columns = frames);
 * - a hero: also every color preset, out/apk2d/sprites/<model>/presets/<preset>/<clip>/...;
 * - a model without clips: one still, out/apk2d/sprites/<model>/{S.png, metrics.json}.
 *
 * scripts/apk2d-pack.ts turns them into the APK sprite pack. Each forge call is one textured build,
 * which also leaves out/<model>/<model>.glb for scripts/demo-models.ts.
 *
 *   FORGE_WORKERS=1 node --import tsx scripts/apk2d-sprites.ts [model ...]
 *
 * Heroes, mounts, and the fire dragon get 8 directions (the player reads their facing); every
 * other character 4, to keep the texture memory small on old phones.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MODEL_PACKS, modelPackSchema, packVersion } from '../src/apk3d/contracts/index.js';
import { HERO_MODELS, allPackModels, packModels } from './apk-pack-models.js';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out', 'apk2d', 'sprites');
export const ELEVATION = 45;
export const PPM = 64;
const FRAMES = 6;

/** Models that get 8 directions. */
const EIGHT = new Set([...HERO_MODELS, ...(MODEL_PACKS.mounts ?? []), 'dragon-fire']);

/** Whether the 3D pack records the model as skinned with clips (undefined: not in a 3D pack yet). */
function animatedIn3D(model: string): boolean | undefined {
  for (const [id, names] of Object.entries(packModels())) {
    if (!names.includes(model)) continue;
    const path = join(ROOT, 'demo', 'public', 'packs', id, packVersion(id), 'pack.json');
    if (!existsSync(path)) return undefined;
    const file = modelPackSchema.parse(JSON.parse(readFileSync(path, 'utf8'))).files[model];
    return file ? file.skinned && file.clips.length > 0 : undefined;
  }
  return undefined;
}

/** Keeps only what a pack needs: each clip's sheet and metrics (and a still's single frame). */
function prune(dir: string, still: boolean): void {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) prune(p, false);
    else if (!(f === 'sheet.png' || f === 'metrics.json' || (still && f === 'S.png'))) rmSync(p);
  }
}

const clipDirs = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((f) => f !== 'presets' && statSync(join(dir, f)).isDirectory()) : []);

function forge(model: string, into: string, extra: string[]): void {
  const args = ['sprites', model, '--elevation', String(ELEVATION), '--ppm', String(PPM), '--into', into, ...extra];
  execFileSync(join(ROOT, 'forge'), args, { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, FORGE_WORKERS: process.env.FORGE_WORKERS ?? '1' } });
}

const models = allPackModels();
const only = process.argv.slice(2);
const unknown = only.filter((n) => !models.includes(n));
if (unknown.length) throw new Error(`not a pack model: ${unknown.join(', ')} (src/apk3d/contracts/model-pack.ts)`);

for (const model of models.filter((m) => !only.length || only.includes(m))) {
  const into = join(OUT, model);
  rmSync(into, { recursive: true, force: true });
  const t = performance.now();
  const animated = animatedIn3D(model);
  if (animated !== false) {
    const dirs = EIGHT.has(model) ? 8 : 4;
    forge(model, into, ['--dirs', String(dirs), '--clip', 'all', '--frames', String(FRAMES), ...(HERO_MODELS.includes(model) ? ['--preset', 'all'] : [])]);
  }
  // A model without clips (or a new model that turned out to have none): one still.
  const still = !clipDirs(into).length;
  if (still) {
    rmSync(into, { recursive: true, force: true });
    forge(model, into, ['--dirs', '1']);
  }
  if (existsSync(into)) prune(into, still);
  const presets = existsSync(join(into, 'presets')) ? readdirSync(join(into, 'presets')) : [];
  const what = still ? 'still' : `${clipDirs(into).join(',')}${presets.length ? `  presets ${presets.join(',')}` : ''}`;
  console.log(`sprites ${model.padEnd(20)} ${what}  (${Math.round((performance.now() - t) / 1000)} s)`);
}
