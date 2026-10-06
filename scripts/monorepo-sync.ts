/**
 * Syncs a Forge release into a monorepo branch (track apk_pack_release_20261006): the 3D kit, the
 * games, the 3D model packs, the 2D sprite pack, and the 2D parity test.
 *
 *   node --import tsx scripts/monorepo-sync.ts --check     report what differs, write nothing
 *   node --import tsx scripts/monorepo-sync.ts             copy, then run the checks
 *   node --import tsx scripts/monorepo-sync.ts --commit    ... and commit in the monorepo branch
 *   node --import tsx scripts/monorepo-sync.ts --commit --push    ... and push that branch
 *
 * Options: --monorepo <dir> (default ../reading-advantage-monorepo-3d or $MONOREPO_WORKTREE),
 * --track <id> (the monorepo track in the commit subject, default apk3d_games_port_20261003),
 * --skip-tests (copy and check drift only).
 *
 * The RPG skin (scripts/rpg-skin.ts) goes to the Primary Advantage app of the branch that builds the
 * skin pages, which is not the port branch:
 *
 *   node --import tsx scripts/monorepo-sync.ts --skin <monorepo checkout> [--check]
 *
 * It mirrors the files that Forge demo/public/rpg/skin.json lists into
 * apps/primary-advantage/public/rpg/, removes the files that the app's previous skin.json listed and
 * the new one does not, and leaves every other file there (the app's own chrome) alone. It also
 * mirrors each version folder of the avatar pack (Forge demo/public/avatar-pack/<version>/) into
 * apps/primary-advantage/public/packs/avatar/<version>/, and removes only stale files under the
 * entries the Forge pack has (the app's own portraits there stay). It does not commit: the owner of that
 * branch reviews and commits the change.
 *
 * Who runs it (owner rule, 2026-10-06): the Forge session runs only `--check` (read-only). The monorepo
 * session runs every write mode, including `--skin <checkout>`, in its own checkout and makes every
 * commit and push there.
 *
 * Rules:
 * - Forge must be clean in the synced paths, so the commit names the Forge commit it carries.
 * - The monorepo checkout must be on a branch other than master or main, and clean in the two
 *   packages. The command never pushes to master or main: the owner merges the branch.
 * - The copies use the monorepo's own scripts: `port-kit.mjs` (the kit) and `port-game.mjs all` (the
 *   games and their shared code). The packs are mirrored: a removed version folder goes too.
 * - The monorepo pack tests read each pack's own version (a one-time, idempotent edit).
 * - Checks: both drift checks, then the tests and the type checks of both packages.
 * - Forge keeps byte copies of a few monorepo-owned modules (OWNER_COPIES). Where the checkout has
 *   the owner file and it differs, the port sync stops and the skin sync warns: copy the owner file
 *   into Forge first.
 *
 * Release order: `scripts/apk-release.ts --commit` in Forge first (packs from committed sources),
 * then this command.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const has = (flag: string): boolean => argv.includes(flag);
const value = (flag: string): string | undefined => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

const FORGE = process.cwd();
const MONO = resolve(value('--monorepo') ?? process.env.MONOREPO_WORKTREE ?? join(FORGE, '..', 'reading-advantage-monorepo-3d'));
const TRACK = value('--track') ?? 'apk3d_games_port_20261003';
const KIT = join(MONO, 'packages', 'advantage-play-kit-3d');
const GAMES = join(MONO, 'packages', 'game-cartridges-3d');

/** Forge paths that a sync carries (they must be committed). */
const FORGE_PATHS = ['src/apk3d', 'src/games', 'demo/public/packs', 'demo/public/assets/apk', 'tests/apk3d/sprite-parity.test.ts'];
/** Pack mirrors: Forge folder to monorepo folder. */
const PACKS_MIRROR: [string, string] = [join(FORGE, 'demo/public/packs'), join(GAMES, 'assets/packs')];
const SPRITES_MIRROR: [string, string] = [join(FORGE, 'demo/public/assets/apk/primary-chibi-2d'), join(GAMES, 'assets/apk/primary-chibi-2d')];
/** The HUD fonts: port-kit.mjs copies only .ts and .css files, and the app serves these at /assets/apk3d/fonts/. */
const FONTS_MIRROR: [string, string] = [join(FORGE, 'src/apk3d/hud/fonts'), join(KIT, 'assets/fonts')];
const MIRRORS: [string, string][] = [PACKS_MIRROR, SPRITES_MIRROR, FONTS_MIRROR];
/** The 2D parity test, rewritten for the package layout (assets/ holds packs/ and apk/). */
const PARITY: [string, string] = [join(FORGE, 'tests/apk3d/sprite-parity.test.ts'), join(GAMES, 'tests/packs/sprite-parity.test.ts')];

/** Forge byte copies of monorepo-owned modules: Forge path, owner path in a monorepo checkout. */
const OWNER_COPIES: [string, string][] = [
  ['src/apk3d/factory/renderer-setting.ts', 'packages/advantage-play-kit/src/responsive/renderer.ts'],
];
/** The owner copies that differ from the owner file in `checkout` (a missing owner file is not drift). */
function ownerDrift(checkout: string): string[] {
  return OWNER_COPIES.filter(([copy, owner]) => existsSync(join(checkout, owner)) && !readFileSync(join(FORGE, copy)).equals(readFileSync(join(checkout, owner)))).map(
    ([copy, owner]) => `${copy} differs from the owner file ${owner}: copy the owner file into Forge first`,
  );
}

const git = (cwd: string, args: string[]): string => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function run(cwd: string, cmd: string, args: string[]): boolean {
  console.log(`\n$ (${cwd.replace(MONO, '<monorepo>').replace(FORGE, '<forge>')}) ${cmd} ${args.join(' ')}`);
  return spawnSync(cmd, args, { cwd, stdio: 'inherit' }).status === 0;
}

function parityText(): string {
  return readFileSync(PARITY[0], 'utf8')
    .replace("from '../../src/apk3d/contracts/index.js'", "from '@reading-advantage/advantage-play-kit-3d/contracts'")
    .replace("from '../../src/apk3d/contracts/model-pack.js'", "from '@reading-advantage/advantage-play-kit-3d/contracts'")
    .replace("join(process.cwd(), 'demo', 'public', 'packs')", "join(process.cwd(), 'assets', 'packs')")
    .replace("join(process.cwd(), 'demo', 'public', spritePackRoot(", "join(process.cwd(), spritePackRoot(")
    .replace(/^\/\*\*/, '/**\n * Copied from Forge tests/apk3d/sprite-parity.test.ts by scripts/monorepo-sync.ts; edit it in Forge.\n *');
}

/**
 * The monorepo pack tests read the packs at each pack's own version (the same change as Forge
 * c7bc407): `MODEL_PACK_VERSION` in a path becomes `packVersion(id)`, and a fixed
 * `packs/<id>/1.0.0/...` path becomes `modelPackRoot(id)`. Idempotent; a test that this does not fit
 * fails the checks, and nothing is committed.
 */
const PACK_TESTS = [...['budget', 'pack-bindings', 'pack-loader'].map((t) => join(GAMES, 'tests', 'packs', `${t}.test.ts`)), join(KIT, 'src', '__tests__', 'model-pack.test.ts')];
function migratedTest(text: string): string {
  let out = text
    .replace(/(import \{[^}]*)\bMODEL_PACK_VERSION\b/, '$1packVersion')
    .replace(/id, MODEL_PACK_VERSION,/g, 'id, packVersion(id),')
    .replace(/\$\{MODEL_PACK_VERSION\}/g, '${packVersion(id)}');
  const fixed = /'packs\/([a-z0-9-]+)\/1\.0\.0\/([A-Za-z0-9/._-]+)'/g;
  if (fixed.test(out)) {
    out = out.replace(fixed, "`${modelPackRoot('$1')}/$2`");
    if (!/\bmodelPackRoot\b[^`]*from '@reading-advantage\/advantage-play-kit-3d\/contracts'/.test(out.split('\n').filter((l) => l.startsWith('import')).join('\n')))
      out = out.replace(/import \{ ([^}]*)\} from '@reading-advantage\/advantage-play-kit-3d\/contracts';/, (m, names: string) => (names.includes('modelPackRoot') ? m : `import { ${names.trim()}, modelPackRoot } from '@reading-advantage/advantage-play-kit-3d/contracts';`));
  }
  return out;
}

/** Every file below a folder, relative to it. */
function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string, rel: string): void => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p, `${rel}${n}/`);
      else out.push(`${rel}${n}`);
    }
  };
  walk(dir, '');
  return out.sort();
}

/** The files that differ between a Forge folder and its monorepo mirror. */
function mirrorDiff(from: string, to: string): string[] {
  const a = files(from);
  const b = files(to);
  const all = [...new Set([...a, ...b])].sort();
  return all.filter((f) => !a.includes(f) || !b.includes(f) || !readFileSync(join(from, f)).equals(readFileSync(join(to, f))));
}

/** The pack versions of a packs folder and a sprite pack folder. */
function versions(packs: string, sprites: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of existsSync(packs) ? readdirSync(packs) : []) out[id] = readdirSync(join(packs, id)).join(',');
  const sprite = join(sprites, 'v1', 'pack.json');
  if (existsSync(sprite)) out['primary-chibi-2d'] = (JSON.parse(readFileSync(sprite, 'utf8')) as { version: string }).version;
  return out;
}

// ---------------------------------------------------------------- the RPG skin
if (value('--skin')) {
  const app = join(resolve(value('--skin')!), 'apps', 'primary-advantage', 'public', 'rpg');
  const from = join(FORGE, 'demo', 'public', 'rpg');
  const drift = ownerDrift(resolve(value('--skin')!));
  for (const d of drift) console.log(`warning: ${d}`);
  if (!existsSync(join(from, 'skin.json'))) throw new Error('no Forge demo/public/rpg/skin.json: run scripts/rpg-skin.ts (or apk-release.ts --skin) first');
  type Skin = { version: string; files: Record<string, unknown> };
  const next = JSON.parse(readFileSync(join(from, 'skin.json'), 'utf8')) as Skin;
  const prev = existsSync(join(app, 'skin.json')) ? (JSON.parse(readFileSync(join(app, 'skin.json'), 'utf8')) as Skin) : undefined;
  const same = (a: string, b: string): boolean => existsSync(b) && readFileSync(a).equals(readFileSync(b));
  const differ = Object.keys(next.files).filter((f) => !same(join(from, f), join(app, f)));
  const gone = Object.keys(prev?.files ?? {}).filter((f) => !(f in next.files) && existsSync(join(app, f)));
  console.log(`skin ${prev?.version ?? '(none)'} -> ${next.version} in ${app}: ${differ.length} file(s) to write, ${gone.length} to remove`);
  for (const f of [...differ, ...gone.map((g) => `${g} (remove)`)]) console.log(`  ${f}`);
  // The avatar pack: every version folder that Forge has, file for file.
  const avatarFrom = join(FORGE, 'demo', 'public', 'avatar-pack');
  const avatarApp = join(resolve(value('--skin')!), 'apps', 'primary-advantage', 'public', 'packs', 'avatar');
  const walk = (dir: string, rel = ''): string[] =>
    existsSync(join(dir, rel)) ? readdirSync(join(dir, rel)).flatMap((n) => (statSync(join(dir, rel, n)).isDirectory() ? walk(dir, join(rel, n)) : [join(rel, n)])) : [];
  const versions = existsSync(avatarFrom) ? readdirSync(avatarFrom) : [];
  const avatarWrite = versions.flatMap((v) => walk(join(avatarFrom, v)).map((f) => join(v, f))).filter((f) => !same(join(avatarFrom, f), join(avatarApp, f)));
  // Forge owns only the top-level entries its pack has (base/, pieces/, catalog.json, pack.json); the
  // app keeps its own files beside them, such as the portraits that port-avatar-pack.py writes.
  const avatarGone = versions
    .flatMap((v) => walk(join(avatarApp, v)).filter((f) => existsSync(join(avatarFrom, v, f.split('/')[0]!))).map((f) => join(v, f)))
    .filter((f) => !existsSync(join(avatarFrom, f)));
  console.log(`avatar pack ${versions.join(', ') || '(none in Forge)'} in ${avatarApp}: ${avatarWrite.length} file(s) to write, ${avatarGone.length} to remove`);
  if (has('--check')) process.exit(differ.length || gone.length || avatarWrite.length || avatarGone.length || drift.length ? 1 : 0);
  for (const f of differ) {
    rmSync(join(app, f), { force: true });
    cpSync(join(from, f), join(app, f));
  }
  for (const f of gone) rmSync(join(app, f), { force: true });
  cpSync(join(from, 'skin.json'), join(app, 'skin.json'));
  for (const f of avatarWrite) {
    rmSync(join(avatarApp, f), { force: true });
    cpSync(join(avatarFrom, f), join(avatarApp, f));
  }
  for (const f of avatarGone) rmSync(join(avatarApp, f), { force: true });
  console.log('written; review and commit them in that checkout');
  process.exit(0);
}

// ---------------------------------------------------------------- preflight
if (!existsSync(join(FORGE, 'forge'))) throw new Error('run scripts/monorepo-sync.ts from the Forge repository root');
if (!existsSync(KIT) || !existsSync(GAMES)) throw new Error(`${MONO} has no advantage-play-kit-3d or game-cartridges-3d package`);
const branch = git(MONO, ['branch', '--show-current']);
if (!branch || ['master', 'main'].includes(branch)) throw new Error(`the monorepo checkout is on "${branch || 'a detached HEAD'}"; sync into a branch, never master or main`);
const forgeDirty = git(FORGE, ['status', '--porcelain', '--', ...FORGE_PATHS]).split('\n').filter(Boolean);
const monoDirty = git(MONO, ['status', '--porcelain', '--', 'packages/advantage-play-kit-3d', 'packages/game-cartridges-3d']).split('\n').filter(Boolean);
const forgeHead = git(FORGE, ['rev-parse', '--short', 'HEAD']);

const before = versions(PACKS_MIRROR[1], SPRITES_MIRROR[1]);
const after = versions(PACKS_MIRROR[0], SPRITES_MIRROR[0]);
const packChanges = MIRRORS.map(([from, to]) => [to.replace(`${GAMES}/`, '').replace(`${MONO}/`, ''), mirrorDiff(from, to)] as const);
const parityChanged = !existsSync(PARITY[1]) || readFileSync(PARITY[1], 'utf8') !== parityText();
const testsToMigrate = PACK_TESTS.filter((t) => existsSync(t) && migratedTest(readFileSync(t, 'utf8')) !== readFileSync(t, 'utf8'));
const drift = ownerDrift(MONO);

console.log(`forge ${forgeHead} -> monorepo ${branch} (${git(MONO, ['rev-parse', '--short', 'HEAD'])})`);
for (const [id, v] of Object.entries(after)) if (before[id] !== v) console.log(`  pack ${id}: ${before[id] ?? '(none)'} -> ${v}`);
for (const [to, diff] of packChanges) console.log(`  ${to}: ${diff.length} file(s) differ`);
if (parityChanged) console.log('  tests/packs/sprite-parity.test.ts differs');
for (const t of testsToMigrate) console.log(`  ${t.replace(`${GAMES}/`, '')} reads a fixed pack version`);
for (const d of drift) console.log(`  ${d}`);

if (has('--check')) {
  const kit = run(KIT, 'node', ['scripts/port-kit.mjs', FORGE, '--check']);
  const games = run(GAMES, 'node', ['scripts/port-game.mjs', FORGE, 'all', '--check']);
  const inSync = kit && games && packChanges.every(([, d]) => !d.length) && !parityChanged && !testsToMigrate.length && !drift.length;
  console.log(`\n${inSync ? 'in sync' : 'out of sync'}${forgeDirty.length ? `; forge has ${forgeDirty.length} uncommitted file(s) in the synced paths` : ''}`);
  process.exit(inSync ? 0 : 1);
}
if (forgeDirty.length) throw new Error(`commit these Forge files first (the sync names a Forge commit):\n  ${forgeDirty.join('\n  ')}`);
if (drift.length) throw new Error(`a Forge copy of a monorepo-owned module is stale:\n  ${drift.join('\n  ')}`);
if (monoDirty.length) throw new Error(`the monorepo packages have uncommitted changes; commit or move them first:\n  ${monoDirty.join('\n  ')}`);

// ---------------------------------------------------------------- copy
if (!run(KIT, 'node', ['scripts/port-kit.mjs', FORGE])) throw new Error('port-kit.mjs failed');
if (!run(GAMES, 'node', ['scripts/port-game.mjs', FORGE, 'all'])) throw new Error('port-game.mjs failed');
for (const [from, to] of MIRRORS) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}
writeFileSync(PARITY[1], parityText());
for (const t of testsToMigrate) writeFileSync(t, migratedTest(readFileSync(t, 'utf8')));

// ---------------------------------------------------------------- checks
const checks: [string, boolean][] = [
  ['port-kit --check', run(KIT, 'node', ['scripts/port-kit.mjs', FORGE, '--check'])],
  ['port-game --check', run(GAMES, 'node', ['scripts/port-game.mjs', FORGE, 'all', '--check'])],
];
if (!has('--skip-tests')) {
  const bin = (name: string): string => join(MONO, 'node_modules', '.bin', name);
  checks.push(['kit tests', run(KIT, bin('vitest'), ['run'])], ['kit types', run(KIT, bin('tsc'), ['--noEmit'])]);
  // The games import the kit through its package exports, which point at dist/: build it first.
  checks.push(['kit build', run(KIT, bin('tsc'), ['-p', 'tsconfig.build.json'])]);
  checks.push(['games tests', run(GAMES, bin('vitest'), ['run'])], ['games types', run(GAMES, bin('tsc'), ['--noEmit'])]);
}
console.log('\nchecks');
for (const [name, ok] of checks) console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}`);
const changed = git(MONO, ['status', '--porcelain', '--', 'packages/advantage-play-kit-3d', 'packages/game-cartridges-3d']).split('\n').filter(Boolean);
console.log(`${changed.length} changed file(s) in the monorepo packages`);
if (checks.some(([, ok]) => !ok)) {
  console.log('a check failed: nothing is committed; the copies stay in the working tree for review');
  process.exit(1);
}
if (!changed.length || !has('--commit')) process.exit(0);

// ---------------------------------------------------------------- commit and push
const bumps = Object.entries(after).filter(([id, v]) => before[id] !== v).map(([id, v]) => `${id} ${v}`);
const subject = `chore(game-cartridges-3d): sync from Forge ${forgeHead} (track_id: ${TRACK})`;
/** Wraps text at 100 characters: the monorepo commitlint rejects longer body lines. */
const wrap = (text: string): string => text.split(' ').reduce<string[]>((lines, word) => {
  const last = lines[lines.length - 1];
  if (last !== undefined && `${last} ${word}`.length <= 100) lines[lines.length - 1] = `${last} ${word}`;
  else lines.push(word);
  return lines;
}, []).join('\n');
const body = [
  `Packs: ${bumps.join(', ') || 'no new version'}.`,
  'Copied by Forge scripts/monorepo-sync.ts: port-kit.mjs, port-game.mjs all, the pack mirrors, and the 2D parity test. Drift checks, tests, and type checks of both packages pass.',
].map(wrap).join('\n');
if (!run(MONO, 'git', ['add', '-A', '--', 'packages/advantage-play-kit-3d', 'packages/game-cartridges-3d'])) throw new Error('git add failed');
if (!run(MONO, 'git', ['commit', '-q', '-m', subject, '-m', body, '--', 'packages/advantage-play-kit-3d', 'packages/game-cartridges-3d'])) throw new Error('git commit failed');
console.log(`committed ${git(MONO, ['rev-parse', '--short', 'HEAD'])} on ${branch}`);
if (has('--push') && !run(MONO, 'git', ['push', 'origin', `HEAD:refs/heads/${branch}`])) throw new Error(`git push of ${branch} failed`);
