/**
 * Releases the APK packs from committed sources (track apk_pack_release_20261006).
 *
 *   node --import tsx scripts/apk-release.ts --check     list the stale models, build nothing
 *   node --import tsx scripts/apk-release.ts             rebuild the stale models, regenerate the packs
 *   node --import tsx scripts/apk-release.ts --commit    ... and commit the outputs (explicit paths)
 *
 * Options: --models a,b (also rebuild these), --all (rebuild every pack model), --bake (re-bake the
 * 2D backgrounds), --skin (also build the stale RPG skin files, scripts/rpg-skin.ts), --worktree <dir>
 * (default ../advantage-forge-release or $FORGE_RELEASE_WORKTREE).
 *
 * The build runs in a clean, detached worktree at HEAD, so the uncommitted work of other sessions
 * never enters a pack, and `provenance.forgeCommit` names a real commit. The worktree keeps its
 * out/ folder between releases. A model is stale when:
 *
 * - its 3D pack entry or its runtime GLB is missing, or its source revision (the asset file and the
 *   local files it imports) differs from the entry's `forgeCommit`: rebuild the 3D model and the 2D files;
 * - a 2D file of it is missing (tests/apk3d/sprite-parity.test.ts): render the 2D files.
 *
 * Steps in the worktree: apk2d-sprites.ts (one textured build per stale model; it also leaves
 * out/<model>/<model>.glb), demo-models.ts (the 3D-stale models only), apk3d-models.ts and
 * apk2d-pack.ts (each bumps the version of a changed pack), then the pack and game manifest tests.
 * The outputs (`OUTPUTS`, and the generated 2D cameras after --bake) are then copied back to this
 * checkout; --commit commits them by explicit paths.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { SPRITE_PACK_ID, assetPackSchema, modelPackSchema, spritePackRoot, spriteSheetId, spriteStillId, type ModelPack } from '../src/apk3d/contracts/index.js';
import { HERO_MODELS, packModels, sameRevision, sourceRevision } from './apk-pack-models.js';

/** The release outputs, relative to the repository root. */
export const OUTPUTS = ['demo/public/models', 'demo/public/packs', 'demo/public/assets/apk/primary-chibi-2d', 'demo/public/rpg', 'demo/public/avatar-pack', 'src/apk3d/contracts/pack-versions.ts', 'src/apk3d/avatar/pack-version.ts'];
/** Generated 2D cameras of the baked backgrounds (written by apk2d-pack.ts with --bake). */
const GENERATED = /^src\/games\/[a-z0-9-]+\/view2d\/projections?\.gen\.ts$/;

const argv = process.argv.slice(2);
const has = (flag: string): boolean => argv.includes(flag);
const value = (flag: string): string | undefined => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};
const ROOT = process.cwd();
const git = (cwd: string, args: string[]): string => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function run(cwd: string, cmd: string, args: string[], env: NodeJS.ProcessEnv = {}): void {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${r.status ?? r.signal})`);
}

// ---------------------------------------------------------------- inner run (in the worktree)
interface Report {
  head: string;
  stale3d: string[];
  stale2d: string[];
  versionsBefore: Record<string, string>;
  versionsAfter: Record<string, string>;
}

/** The current version table (read as text, so a rewrite during this run is seen). */
function versionsOf(root: string): Record<string, string> {
  const text = readFileSync(join(root, 'src/apk3d/contracts/pack-versions.ts'), 'utf8');
  return Object.fromEntries([...text.matchAll(/^\s+'?([\w-]+)'?: '(\d+\.\d+\.\d+)',$/gm)].map((m) => [m[1]!, m[2]!]));
}

function stale(root: string): { stale3d: string[]; stale2d: string[] } {
  const versions = versionsOf(root);
  const spritePath = join(root, 'demo/public', spritePackRoot(SPRITE_PACK_ID).slice(1), 'pack.json');
  const sprites = existsSync(spritePath) ? assetPackSchema.parse(JSON.parse(readFileSync(spritePath, 'utf8'))) : undefined;
  const stale3d: string[] = [];
  const stale2d: string[] = [];
  for (const [id, names] of Object.entries(packModels())) {
    const path = join(root, 'demo/public/packs', id, versions[id] ?? '1.0.0', 'pack.json');
    const pack: ModelPack | undefined = existsSync(path) ? modelPackSchema.parse(JSON.parse(readFileSync(path, 'utf8'))) : undefined;
    for (const name of names) {
      const file = pack?.files[name];
      if (!file || !existsSync(join(root, 'demo/public/models', `${name}.glb`)) || !sameRevision(file.provenance.forgeCommit, sourceRevision(name, root))) {
        stale3d.push(name);
        continue;
      }
      const want = file.skinned && file.clips.length ? [undefined, ...file.presets].flatMap((p) => file.clips.map((c) => spriteSheetId(name, c, p))) : [spriteStillId(name)];
      if (HERO_MODELS.includes(name) && !file.presets.length) stale3d.push(name);
      else if (!sprites || want.some((w) => !sprites.files[w])) stale2d.push(name);
    }
  }
  return { stale3d: stale3d.sort(), stale2d: stale2d.sort() };
}

function inner(): void {
  const before = versionsOf(ROOT);
  const found = stale(ROOT);
  const all = Object.values(packModels()).flat();
  const asked = has('--all') ? all : (value('--models')?.split(',').filter(Boolean) ?? []);
  const stale3d = [...new Set([...found.stale3d, ...asked])].sort();
  const stale2d = found.stale2d.filter((m) => !stale3d.includes(m));
  console.log(`release at ${git(ROOT, ['rev-parse', '--short', 'HEAD'])}`);
  console.log(`3D and 2D: ${stale3d.length ? stale3d.join(' ') : '(none)'}`);
  console.log(`2D only:   ${stale2d.length ? stale2d.join(' ') : '(none)'}`);
  if (has('--skin') || has('--check')) run(ROOT, 'node', ['--import', 'tsx', 'scripts/rpg-skin.ts', '--check']);
  if (has('--check')) return;

  const render = [...stale3d, ...stale2d];
  // Only fresh renders go into the 2D pack: a model without one keeps its files from the pack.
  rmSync(join(ROOT, 'out/apk2d/sprites'), { recursive: true, force: true });
  if (render.length) run(ROOT, 'node', ['--import', 'tsx', 'scripts/apk2d-sprites.ts', ...render], { FORGE_WORKERS: process.env.FORGE_WORKERS ?? '2' });
  if (stale3d.length) run(ROOT, 'node', ['--import', 'tsx', 'scripts/demo-models.ts', ...stale3d]);
  run(ROOT, 'node', ['--import', 'tsx', 'scripts/apk3d-models.ts']);
  if (has('--bake')) run(ROOT, 'node', ['--import', 'tsx', 'scripts/apk2d-bake.ts']);
  else rmSync(join(ROOT, 'out/apk2d/backgrounds'), { recursive: true, force: true });
  run(ROOT, 'node', ['--import', 'tsx', 'scripts/apk2d-pack.ts']);
  if (has('--skin')) run(ROOT, 'node', ['--import', 'tsx', 'scripts/rpg-skin.ts']);
  const tests = ['budget', 'sprite-parity', 'pack-bindings', 'pack-loader', 'model-pack'].map((t) => `tests/apk3d/${t}.test.ts`);
  run(ROOT, join(ROOT, 'node_modules/.bin/vitest'), ['run', ...tests, 'manifest.test']);
  const report: Report = { head: git(ROOT, ['rev-parse', 'HEAD']), stale3d, stale2d, versionsBefore: before, versionsAfter: versionsOf(ROOT) };
  writeFileSync(join(ROOT, 'out/apk-release.json'), `${JSON.stringify(report, null, 2)}\n`);
}

// ---------------------------------------------------------------- outer run (this checkout)
function changedOutputs(root: string): string[] {
  const lines = git(root, ['status', '--porcelain', '--untracked-files=all', '--', ...OUTPUTS, 'src/games']).split('\n').filter(Boolean);
  return lines.map((l) => l.slice(3)).filter((p) => OUTPUTS.some((o) => p === o || p.startsWith(`${o}/`)) || GENERATED.test(p));
}

function outer(): void {
  const dirty = changedOutputs(ROOT);
  if (dirty.length && !has('--check')) throw new Error(`uncommitted release outputs in this checkout; commit or restore them first:\n  ${dirty.join('\n  ')}`);
  const head = git(ROOT, ['rev-parse', 'HEAD']);
  const wt = resolve(value('--worktree') ?? process.env.FORGE_RELEASE_WORKTREE ?? join(ROOT, '..', 'advantage-forge-release'));
  const tooling = git(ROOT, ['status', '--porcelain', '--', 'scripts', 'src/apk3d/contracts', 'scenes']).split('\n').filter(Boolean);
  if (tooling.length) console.log(`note: the release builds HEAD ${head.slice(0, 7)}; these uncommitted files are not in it:\n  ${tooling.map((l) => l.slice(3)).join('\n  ')}`);

  if (!existsSync(wt)) run(ROOT, 'git', ['worktree', 'add', '--detach', wt, head]);
  else {
    const common = (dir: string): string => resolve(dir, git(dir, ['rev-parse', '--git-common-dir']));
    if (common(wt) !== common(ROOT) || resolve(wt) === resolve(ROOT)) throw new Error(`${wt} is not a release worktree of this repository`);
    // The worktree is ours: drop the outputs of an earlier release (copied back already), keep out/.
    run(wt, 'git', ['reset', '--hard', '-q']);
    run(wt, 'git', ['clean', '-fdq', '--', 'demo/public', 'src']);
    run(wt, 'git', ['checkout', '-q', '--detach', head]);
  }
  if (!existsSync(join(wt, 'node_modules'))) symlinkSync(join(ROOT, 'node_modules'), join(wt, 'node_modules'), 'dir');

  run(wt, 'node', ['--import', 'tsx', 'scripts/apk-release.ts', '--inner', ...argv]);
  if (has('--check')) return;

  // Copy the outputs back: whole folders (a removed version folder goes too) and the generated files.
  for (const o of OUTPUTS) {
    const from = join(wt, o);
    const to = join(ROOT, o);
    if (!existsSync(from)) continue;
    if (o.endsWith('.ts')) cpSync(from, to);
    else {
      rmSync(to, { recursive: true, force: true });
      cpSync(from, to, { recursive: true });
    }
  }
  for (const p of changedOutputs(wt).filter((p) => GENERATED.test(p))) cpSync(join(wt, p), join(ROOT, p));

  const report = JSON.parse(readFileSync(join(wt, 'out/apk-release.json'), 'utf8')) as Report;
  const bumps = Object.entries(report.versionsAfter).filter(([id, v]) => report.versionsBefore[id] !== v);
  const changed = changedOutputs(ROOT);
  console.log(`\nrelease of ${head.slice(0, 7)}: rebuilt ${report.stale3d.length} 3D models, rendered ${report.stale2d.length} more 2D models`);
  for (const [id, v] of bumps) console.log(`  ${id} ${report.versionsBefore[id] ?? '(new)'} -> ${v}`);
  console.log(`  ${changed.length} changed output files in ${relative(process.cwd(), ROOT) || '.'}`);
  if (!changed.length || !has('--commit')) return;

  // git add fails on a path that neither exists nor is tracked (an output this release did not make).
  const paths = [...OUTPUTS, ...changed.filter((p) => GENERATED.test(p))].filter((p) => existsSync(join(ROOT, p)) || git(ROOT, ['ls-files', '--', p]) !== '');
  run(ROOT, 'git', ['add', '-A', '--', ...paths]);
  const subject = `chore(apk): release packs from ${head.slice(0, 7)}${bumps.length ? ` (${bumps.map(([id, v]) => `${id} ${v}`).join(', ')})` : ''}`;
  const body = [`3D and 2D rebuilt: ${report.stale3d.join(' ') || 'none'}`, `2D rendered: ${report.stale2d.join(' ') || 'none'}`, 'Built by scripts/apk-release.ts in a clean worktree (track apk_pack_release_20261006).'].join('\n');
  run(ROOT, 'git', ['commit', '-q', '-m', subject, '-m', body, '--', ...paths]);
  console.log(`committed ${git(ROOT, ['rev-parse', '--short', 'HEAD'])}`);
}

if (has('--inner')) inner();
else if (readdirSync(ROOT).includes('forge')) outer();
else throw new Error('run scripts/apk-release.ts from the Forge repository root');
