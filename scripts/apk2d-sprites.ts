/**
 * Renders the 2D sprite library with the forge: every character and dynamic prop the 2D views
 * use, at the one 2D camera (orthographic, elevation 45, 64 pixels per meter), so sprites line up
 * with the baked backgrounds (scripts/apk2d-bake.ts). Writes
 * out/apk2d/sprites/<model>/<clip>/{sheet.png, metrics.json} (rows = directions,
 * columns = frames) and out/apk2d/sprites/<prop>/{S.png, metrics.json} for props;
 * scripts/apk2d-pack.ts turns them into APK sprite packs.
 *
 *   FORGE_WORKERS=1 node --import tsx scripts/apk2d-sprites.ts [model ...]
 *
 * Heroes get 8 directions (the player reads the hero's facing); everyone else 4, to keep the
 * texture memory small on old phones.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out', 'apk2d', 'sprites');
export const ELEVATION = 45;
export const PPM = 64;
const FRAMES = 6;

interface Job {
  model: string;
  clips?: string[];
  dirs: 1 | 4 | 8;
}

const HERO = ['idle', 'walk', 'run', 'attack', 'attack2', 'hit', 'victory'];
const NPC = ['idle', 'walk', 'talk', 'wave', 'salute', 'victory', 'taunt', 'roar'];
const MONSTER = ['idle', 'walk', 'fly', 'attack', 'hit', 'death', 'rise', 'spit', 'reveal', 'screech', 'roar'];

export const LIBRARY: Job[] = [
  ...['knight', 'wizard', 'cleric'].map((model) => ({ model, clips: HERO, dirs: 8 as const })),
  ...['villager', 'farmer', 'innkeeper', 'guard', 'druid', 'orc-warrior', 'goblin-warrior'].map((model) => ({ model, clips: NPC, dirs: 4 as const })),
  ...['skeleton', 'zombie', 'slime', 'bandit', 'giant-bat', 'mimic'].map((model) => ({ model, clips: MONSTER, dirs: 4 as const })),
  { model: 'dragon-fire', clips: MONSTER, dirs: 8 },
  // The mount of the griffin games: only the clips they play.
  { model: 'griffin', clips: ['fly', 'hit', 'roar', 'attack'], dirs: 8 },
  ...['bottle', 'mushroom', 'apple', 'pumpkin', 'crystal-cluster', 'bread', 'cauldron'].map((model) => ({ model, dirs: 1 as const })),
  // Dragon Flight's land and gates (the 2D view places them in chunks, as the 3D view does).
  ...['arch', 'oak-tree', 'pine-tree', 'bush', 'fern', 'wildflowers', 'boulder', 'rock-cluster', 'cottage', 'well', 'fence', 'hay-bale'].map((model) => ({ model, dirs: 1 as const })),
];

/** Keeps only what a pack needs: each clip's sheet and metrics (and a prop's single frame). */
function prune(dir: string, still: boolean): void {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) prune(p, false);
    else if (!(f === 'sheet.png' || f === 'metrics.json' || (still && f === 'S.png'))) rmSync(p);
  }
}

const only = process.argv.slice(2);
for (const job of LIBRARY.filter((j) => !only.length || only.includes(j.model))) {
  const into = join(OUT, job.model);
  rmSync(into, { recursive: true, force: true });
  const args = ['sprites', job.model, '--dirs', String(job.dirs), '--elevation', String(ELEVATION), '--ppm', String(PPM), '--into', into];
  if (job.clips) args.push('--clip', job.clips.join(','), '--frames', String(FRAMES));
  const t = performance.now();
  execFileSync(join(ROOT, 'forge'), args, { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, FORGE_WORKERS: process.env.FORGE_WORKERS ?? '1' } });
  if (existsSync(into)) prune(into, !job.clips);
  const clips = existsSync(into) ? readdirSync(into).filter((f) => statSync(join(into, f)).isDirectory()) : [];
  console.log(`sprites ${job.model.padEnd(16)} ${job.clips ? clips.join(',') : 'still'}  (${Math.round((performance.now() - t) / 1000)} s)`);
}
