/**
 * The handoff of a Forge release to the monorepo session, and the record of what the monorepo
 * received (track apk_monorepo_sync_workflow_20261020). It reads the git trees of both repositories
 * and writes nothing in the monorepo.
 *
 *   node --import tsx scripts/monorepo-handoff.ts --target <branch>   the handoff text, also in out/monorepo-sync/
 *   node --import tsx scripts/monorepo-handoff.ts --status            the Forge commits that the monorepo lacks
 *   node --import tsx scripts/monorepo-handoff.ts --record [<sha>]    add the sync commit (or every new one) to the ledger
 *
 * Options: --target <branch> (the branch that takes the port branch after the sync; the owner decides
 * it, so the handoff needs it), --forge-commit <sha> (hand off that Forge commit, not HEAD; the sync
 * then uses `monorepo-sync.ts --forge-commit`), --monorepo <dir>, --branch <port branch> (default
 * apk3d-games-port), --no-check (skip `monorepo-sync.ts --check`).
 *
 * The last sync is the newest commit of the port branch whose subject says "sync from Forge <sha>".
 * The handoff lists the Forge commits since then in the synced paths and their class (a feature
 * commit needs the owner during a freeze), what changes in the monorepo (kit and game files, each
 * pack's version and the models with changed bytes), the games to check and why, the commands for
 * the monorepo session, and the checks after the app rebuild. The ledger is measure/monorepo-syncs.md.
 *
 * The RPG skin and the avatar pack do not go with the port sync: `monorepo-sync.ts --skin <checkout>`
 * writes them into the app. The handoff compares them with the app of the target branch (track
 * apk_skin_identical_rebuild_20261021), adds the skin sync step when they differ, and warns when the
 * kit asks for an avatar pack version that the app does not have (every avatar load would answer 404).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { GAME_LOADS, MODEL_PACKS, modelPackRoot, type GameModelLoad } from '../src/apk3d/contracts/model-pack.js';
import { SPRITE_PACK_ID, spritePackRoot } from '../src/apk3d/contracts/index.js';
import { HEAVY_LOCK } from './heavy-lock.js';
import { FORGE_PATHS, PACK_DIRS, PORT_BRANCH, SYNC_SUBJECT, defaultMonorepo } from './monorepo-paths.js';

// ---------------------------------------------------------------- rules (pure, tested)

/** The app folders that `monorepo-sync.ts --skin` writes, below the monorepo root. */
export const APP_PUBLIC = 'apps/primary-advantage/public';

export type CommitClass = 'fix' | 'feature' | 'release' | 'other';

/** The class of a commit from its conventional subject: a pack release follows its source commits. */
export function commitClass(subject: string): CommitClass {
  const type = /^(\w+)(?:\([^)]*\))?!?:/.exec(subject)?.[1];
  if (type === 'fix') return 'fix';
  if (type === 'feat') return 'feature';
  if (type === 'chore' && /^chore\(apk\): release packs\b/.test(subject)) return 'release';
  return 'other';
}

/** The newest sync commit in `log` lines ("<sha>\t<subject>", newest first), and the Forge commit it carries. */
export function lastSync(log: string): { mono: string; forge: string } | undefined {
  for (const line of log.split('\n')) {
    const [sha, subject = ''] = line.split('\t');
    const forge = SYNC_SUBJECT.exec(subject)?.[1];
    if (sha && forge) return { mono: sha, forge };
  }
  return undefined;
}

/** Measure track ids named in the texts (commit messages, track paths), sorted. */
export function trackIds(texts: readonly string[]): string[] {
  return [...new Set(texts.flatMap((t) => t.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)*_20\d{6}\b/g) ?? []))].sort();
}

/** `git ls-tree -r` output as path (below `prefix`) to blob id. */
export function parseTree(lsTree: string, prefix: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of lsTree.split('\n')) {
    const m = /^\d+ blob ([0-9a-f]+)\t(.+)$/.exec(line);
    if (m && m[2]!.startsWith(`${prefix}/`)) out.set(m[2]!.slice(prefix.length + 1), m[1]!);
  }
  return out;
}

export type ModelStatus = 'new' | 'removed' | 'changed' | 'same';
export interface ModelChange {
  model: string;
  status: ModelStatus;
}
export interface PackChange {
  id: string;
  from?: string;
  to?: string;
  models: ModelChange[];
}

/** Compares grouped files (key to path to blob): new, removed, changed, or the same bytes. */
function compareGroups(mono: Map<string, Map<string, string>>, forge: Map<string, Map<string, string>>): ModelChange[] {
  return [...new Set([...mono.keys(), ...forge.keys()])].sort().map((model) => {
    const a = mono.get(model);
    const b = forge.get(model);
    if (!a) return { model, status: 'new' as const };
    if (!b) return { model, status: 'removed' as const };
    const same = a.size === b.size && [...a].every(([path, blob]) => b.get(path) === blob);
    return { model, status: same ? ('same' as const) : ('changed' as const) };
  });
}

const group = (entries: Iterable<[string, string, string]>): Map<string, Map<string, string>> => {
  const out = new Map<string, Map<string, string>>();
  for (const [key, path, blob] of entries) out.set(key, (out.get(key) ?? new Map<string, string>()).set(path, blob));
  return out;
};

/** The 3D packs (tree paths "<pack>/<version>/<file>") by pack: versions, and each model's status. */
export function packChanges3d(mono: Map<string, string>, forge: Map<string, string>): PackChange[] {
  const split = (tree: Map<string, string>) => {
    const packs = new Map<string, { version: string; files: [string, string, string][] }>();
    for (const [path, blob] of tree) {
      const [id, version, ...rest] = path.split('/');
      const file = rest.join('/');
      if (!id || !version || !file || file === 'pack.json') {
        if (id && version) packs.set(id, packs.get(id) ?? { version, files: [] });
        continue;
      }
      const model = file.endsWith('.glb') ? file.slice(0, -'.glb'.length) : file.split('/')[0]!;
      const pack = packs.get(id) ?? { version, files: [] };
      pack.files.push([model, file, blob]);
      packs.set(id, pack);
    }
    return packs;
  };
  const a = split(mono);
  const b = split(forge);
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap((id) => {
    const from = a.get(id)?.version;
    const to = b.get(id)?.version;
    const models = compareGroups(group(a.get(id)?.files ?? []), group(b.get(id)?.files ?? []));
    return from === to && models.every((m) => m.status === 'same') ? [] : [{ id, ...(from ? { from } : {}), ...(to ? { to } : {}), models }];
  });
}

/** The 2D pack files (tree paths "v1/...") by model, without the unchanged ones: sprites, props, backgrounds. */
export function spriteChanges(mono: Map<string, string>, forge: Map<string, string>): ModelChange[] {
  const keyed = (tree: Map<string, string>): [string, string, string][] =>
    [...tree].flatMap(([path, blob]) => {
      const [, kind, name] = path.split('/');
      if (!kind || !name) return [];
      const key = kind === 'sprites' ? name : kind === 'props' ? name.replace(/\.png$/, '') : kind === 'backgrounds' ? `background:${name.replace(/\.png$/, '')}` : '';
      return key ? [[key, path, blob] as [string, string, string]] : [];
    });
  return compareGroups(group(keyed(mono)), group(keyed(forge))).filter((m) => m.status !== 'same');
}

/** The models that a game loads (GAME_LOADS: its models, its whole packs, and the heroes). */
export function gameModels(load: GameModelLoad, packs: Readonly<Record<string, readonly string[]>>): Set<string> {
  return new Set([...(load.models ?? []), ...(load.packs ?? []).flatMap((p) => packs[p] ?? []), ...(load.hero ? (packs.heroes ?? []) : [])]);
}

/** The games to check, each with its reasons: its own files, or a changed model or background. */
export function affectedGames(
  changedGames: readonly string[],
  changedModels: readonly string[],
  loads: Readonly<Record<string, GameModelLoad>>,
  packs: Readonly<Record<string, readonly string[]>>,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (game: string, reason: string): void => void out.set(game, [...(out.get(game) ?? []), reason]);
  for (const g of changedGames) add(g, 'game files');
  for (const m of changedModels) {
    if (m.startsWith('background:')) add(m.slice('background:'.length), '2D background');
    else for (const [game, load] of Object.entries(loads)) if (gameModels(load, packs).has(m)) add(game, `model ${m}`);
  }
  return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
}

export interface Handoff {
  forge: string;
  date: string;
  branch: string;
  target: string;
  last: { mono: string; forge: string };
  forgeCommitOption: boolean;
  commits: { sha: string; subject: string; cls: CommitClass }[];
  kitFiles: string[];
  gameFiles: Map<string, number>;
  /** Changed Forge games that the monorepo package does not have (`port-game.mjs all` skips them). */
  forgeOnly: string[];
  testFiles: number;
  packs: PackChange[];
  sprites: { from?: string | undefined; to?: string | undefined; models: ModelChange[] };
  games: Map<string, string[]>;
  smoke: string[];
  packUrls: string[];
  /** The RPG skin and the avatar pack against the app of the target branch (no target branch: undefined). */
  skin?: SkinChange | undefined;
  tracks: string[];
  check?: string;
}

/** The RPG skin and the avatar pack: the app of the target branch against Forge. */
export interface SkinChange {
  /** The skin version (`skin.json`) in the app and in Forge. */
  app?: string | undefined;
  forge?: string | undefined;
  /** The skin files (with `skin.json`) that the skin sync writes, and the ones it removes. */
  write: number;
  remove: number;
  /** The avatar pack versions in the app and in Forge, and the avatar files that the skin sync writes. */
  avatarApp: string[];
  avatarForge: string[];
  avatarWrite: number;
  /** The avatar pack version that the Forge kit asks for (`AVATAR_PACK_VERSION`). */
  kitAvatar?: string | undefined;
}

/** One side of the skin compare: the `skin.json` text and the trees (path to blob) of the skin and the avatar pack folders. */
export interface SkinSide {
  skin?: string | undefined;
  rpg: Map<string, string>;
  avatar: Map<string, string>;
}

const skinManifest = (text: string | undefined): { version: string; files: Record<string, unknown> } | undefined => {
  try {
    return text ? (JSON.parse(text) as { version: string; files: Record<string, unknown> }) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * What `monorepo-sync.ts --skin` would change in the app, from the git trees of both sides. A file
 * with another blob counts unless `sameContent` says that the content is the same: the app keeps
 * some JSON files in another format (its own tool writes `portraits.json` without spaces).
 */
export function skinChange(
  app: SkinSide,
  forge: SkinSide & { kit?: string | undefined },
  sameContent: (path: string, appBlob: string, forgeBlob: string) => boolean = () => false,
): SkinChange {
  const a = skinManifest(app.skin);
  const f = skinManifest(forge.skin);
  const listed = f ? ['skin.json', ...Object.keys(f.files)] : [];
  const versions = (tree: Map<string, string>): string[] => [...new Set([...tree.keys()].map((p) => p.split('/')[0]!))].sort();
  const differs = (path: string, appBlob: string | undefined, forgeBlob: string): boolean => appBlob !== forgeBlob && (!appBlob || !sameContent(path, appBlob, forgeBlob));
  return {
    app: a?.version,
    forge: f?.version,
    write: listed.filter((p) => forge.rpg.has(p) && differs(p, app.rpg.get(p), forge.rpg.get(p)!)).length,
    remove: a && f ? Object.keys(a.files).filter((p) => !(p in f.files)).length : 0,
    avatarApp: versions(app.avatar),
    avatarForge: versions(forge.avatar),
    avatarWrite: [...forge.avatar].filter(([p, blob]) => differs(p, app.avatar.get(p), blob)).length,
    kitAvatar: forge.kit,
  };
}

/** The skin sync has work: a skin or avatar file to write or remove. */
export const skinSyncNeeded = (s: SkinChange | undefined): boolean => !!s && (s.write > 0 || s.remove > 0 || s.avatarWrite > 0);

const list = (xs: readonly string[]): string => (xs.length ? xs.join(', ') : 'none');

function skinLines(h: Handoff): string[] {
  const s = h.skin;
  if (!s) return [`- RPG skin and avatar pack: not compared (no branch \`${h.target}\` in the monorepo).`];
  const lines = skinSyncNeeded(s)
    ? [
        `- RPG skin: app ${s.app ?? '(none)'} -> Forge ${s.forge ?? '(none)'}. Files to write: ${s.write}. Files to remove: ${s.remove}.`,
        `- Avatar pack: app ${list(s.avatarApp)} -> Forge ${list(s.avatarForge)}. Files to write: ${s.avatarWrite}.`,
        '- The port sync does not carry the skin and the avatar pack. The skin sync step below does.',
      ]
    : [`- RPG skin and avatar pack: no change (app skin ${s.app ?? '(none)'}, avatar pack ${list(s.avatarApp)} on \`${h.target}\`).`];
  if (s.kitAvatar && !s.avatarApp.includes(s.kitAvatar))
    lines.push(`- **The kit asks for avatar pack ${s.kitAvatar}, and the app on \`${h.target}\` does not have it.** Run the skin sync in the same delivery, before the app rebuild. Without it, every avatar load answers 404.`);
  return lines;
}

/** The handoff message: a request to the monorepo session. */
export function handoffText(h: Handoff): string {
  const by = (cls: CommitClass): number => h.commits.filter((c) => c.cls === cls).length;
  const features = h.commits.filter((c) => c.cls === 'feature');
  const syncArgs = `--commit${h.forgeCommitOption ? ` --forge-commit ${h.forge}` : ''}`;
  const lines = [
    `# Forge sync request: ${h.forge} (${h.date})`,
    '',
    `From the Forge session to the monorepo session. Port branch: \`${h.branch}\`. Last sync: \`${h.last.mono}\` ("sync from Forge ${h.last.forge}").`,
    '',
    `## Forge commits since ${h.last.forge} in the synced paths (${h.commits.length})`,
    '',
    '| Commit | Class | Subject |',
    '| --- | --- | --- |',
    ...h.commits.map((c) => `| \`${c.sha}\` | ${c.cls} | ${c.subject.replace(/\|/g, '\\|')} |`),
    '',
    `Classes: ${by('fix')} fix, ${by('feature')} feature, ${by('release')} release, ${by('other')} other.`,
    ...(features.length
      ? [`**This range has ${features.length} feature commit(s)** (${features.map((c) => c.sha).join(', ')}). During a freeze, ask the owner, or sync a fix-only commit with \`--forge-commit\`.`]
      : ['The range has no feature commit.']),
    '',
    '## What changes in the monorepo',
    '',
    `- Kit files: ${list(h.kitFiles)}.`,
    `- Game files: ${h.gameFiles.size ? [...h.gameFiles].map(([g, n]) => `${g} (${n})`).join(', ') : 'none'}. Game test files: ${h.testFiles}.`,
    ...(h.forgeOnly.length ? [`- Not synced (Forge games that the monorepo package does not have): ${h.forgeOnly.join(', ')}.`] : []),
    ...h.packs.map((p) => {
      const of = (s: ModelStatus): string[] => p.models.filter((m) => m.status === s).map((m) => m.model);
      return `- 3D pack \`${p.id}\`: ${p.from ?? '(new)'} -> ${p.to ?? '(removed)'}. Changed bytes: ${list(of('changed'))}. New: ${list(of('new'))}. Removed: ${list(of('removed'))}. Same bytes: ${list(of('same'))}.`;
    }),
    ...(h.packs.length ? [] : ['- 3D packs: no change.']),
    h.sprites.models.length || h.sprites.from !== h.sprites.to
      ? `- 2D pack \`primary-chibi-2d\`: ${h.sprites.from ?? '(new)'} -> ${h.sprites.to ?? '(removed)'}. ${(['changed', 'new', 'removed'] as const).map((s) => `${s[0]!.toUpperCase()}${s.slice(1)}: ${list(h.sprites.models.filter((m) => m.status === s).map((m) => m.model))}`).join('. ')}.`
      : '- 2D pack: no change.',
    ...skinLines(h),
    '',
    '## Games to check',
    '',
    ...(h.games.size ? [...h.games].map(([g, why]) => `- ${g}: ${why.join(', ')}`) : ['- No game has its own change.']),
    ...(h.smoke.length ? [`- Smoke check (one game in 3D and one in 2D), because shared code changed: ${h.smoke.join(', ')}.`] : []),
    '',
    '## Steps for the monorepo session',
    '',
    ...[
      'Decide if the change can go in now (the classes above).',
      `From the Forge root: \`flock ${HEAVY_LOCK} node --import tsx scripts/monorepo-sync.ts ${syncArgs}\``,
      `Merge \`${h.branch}\` into \`${h.target}\`.`,
      ...(skinSyncNeeded(h.skin)
        ? [
            `The skin sync, from the Forge root into a checkout of \`${h.target}\` (it reads the Forge files at HEAD): \`node --import tsx scripts/monorepo-sync.ts --skin <checkout> --check\`, then the same command without \`--check\`. Commit the app files (\`${APP_PUBLIC}/rpg/\` and \`${APP_PUBLIC}/packs/avatar/\`).`,
          ]
        : []),
      'Answer the Forge session with the monorepo commit and the check results.',
      'Rebuild the app with its prebuild step (`pnpm build`, or `pnpm sync:3d-assets` before `next build`).',
    ].map((step, i) => `${i + 1}. ${step}`),
    '',
    '## Checks after the app rebuild',
    '',
    '1. These URLs (below the app asset base) answer 200:',
    ...h.packUrls.map((u) => `   - \`${u}\``),
    ...(h.packUrls.length ? [] : ['   - (no pack changed)']),
    '2. The games to check, in 3D and in 2D: no page error, no 404 for a pack, and the changed models show.',
    '',
    `Owning tracks: ${list(h.tracks)}.`,
    ...(h.check ? ['', '## Read-only check (`monorepo-sync.ts --check`)', '', '```', h.check, '```'] : []),
  ];
  return `${lines.join('\n')}\n`;
}

export interface LedgerRow {
  date: string;
  mono: string;
  forge: string;
  carried: string;
  packs: string;
  alsoOn: string;
  tracks: string;
}

export const LEDGER_HEAD = `# Monorepo syncs

Each row is one monorepo commit that carries a Forge commit (track
\`apk_monorepo_sync_workflow_20261020\`). \`node --import tsx scripts/monorepo-handoff.ts --record
<monorepo sha>\` adds a row; without a sha, it adds every sync commit of the port branch that the
ledger does not have. "Forge commits" counts the Forge commits in the synced paths since the sync
before. The monorepo keeps its own record.

| Date | Monorepo commit | Forge commit | Forge commits | Packs | Also on | Tracks |
| --- | --- | --- | --- | --- | --- | --- |
`;

/** The pack versions that a sync commit body names ("Packs: mounts 1.0.2, folk 1.0.1."), or '' for none. */
export function packsOf(body: string): string {
  const packs = /^Packs: (.*?)\.(?:\s|$)/m.exec(body)?.[1] ?? '';
  return packs === 'no new version' ? '' : packs;
}

export const ledgerLine = (r: LedgerRow): string =>
  `| ${r.date} | \`${r.mono}\` | \`${r.forge}\` | ${r.carried} | ${r.packs || '-'} | ${r.alsoOn || '-'} | ${r.tracks || '-'} |`;

// ---------------------------------------------------------------- git and files

const argv = process.argv.slice(2);
const has = (flag: string): boolean => argv.includes(flag);
const value = (flag: string): string | undefined => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1]!.startsWith('--') ? argv[i + 1] : undefined;
};
const git = (cwd: string, args: string[]): string => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const gitOk = (cwd: string, args: string[]): boolean => spawnSync('git', args, { cwd }).status === 0;

const FORGE = process.cwd();
const LEDGER = join(FORGE, 'measure', 'monorepo-syncs.md');

/** The Forge commits in the synced paths after `from` up to `to` (a patch already in `from` does not count). */
function forgeCommits(from: string, to: string): { sha: string; subject: string; cls: CommitClass }[] {
  const out = git(FORGE, ['log', '--format=%h%x09%s', '--cherry-pick', '--right-only', '--no-merges', `${from}...${to}`, '--', ...FORGE_PATHS]);
  return out ? out.split('\n').map((l) => {
    const [sha = '', subject = ''] = l.split('\t');
    return { sha, subject, cls: commitClass(subject) };
  }) : [];
}

/** The track ids that the commits name, in their messages or in the track plans that they change. */
function tracksOf(shas: readonly string[]): string[] {
  return trackIds(shas.flatMap((sha) => [git(FORGE, ['log', '-1', '--format=%B', sha]), git(FORGE, ['show', '--name-only', '--format=', sha, '--', 'measure/tracks'])]));
}

function syncLog(mono: string, branch: string): string {
  return git(mono, ['log', '-n', '2000', '--format=%h%x09%s', branch]);
}

// ---------------------------------------------------------------- modes

function handoff(mono: string, branch: string): void {
  const target = value('--target');
  if (!target) throw new Error('give --target <branch>: the branch that takes the port branch after the sync (the owner decides it)');
  const rev = value('--forge-commit') ?? 'HEAD';
  const forge = git(FORGE, ['rev-parse', '--short', rev]);
  const last = lastSync(syncLog(mono, branch));
  if (!last) throw new Error(`no "sync from Forge <sha>" commit on ${branch} in ${mono}`);
  const commits = forgeCommits(last.forge, forge);
  const changed = (paths: string[]): string[] => git(FORGE, ['diff', '--name-only', last.forge, forge, '--', ...paths]).split('\n').filter(Boolean);
  const kitFiles = changed(['src/apk3d']).filter((f) => f !== 'src/apk3d/contracts/pack-versions.ts').map((f) => f.slice('src/apk3d/'.length));
  // The games of the monorepo package: `port-game.mjs all` copies these and the shared code only.
  const monoGames = new Set(git(mono, ['ls-tree', '--name-only', '-d', `${branch}:packages/game-cartridges-3d/src`]).split('\n').filter((g) => g && g !== 'shared'));
  const gameSrc = changed(['src/games']).map((f) => f.split('/')[2]!);
  const gameFiles = new Map<string, number>();
  for (const g of gameSrc.filter((g) => g === 'shared' || monoGames.has(g))) gameFiles.set(g, (gameFiles.get(g) ?? 0) + 1);
  const forgeOnly = [...new Set(gameSrc.filter((g) => g !== 'shared' && !monoGames.has(g)))].sort();
  const testFiles = changed(['tests/games', 'tests/apk3d/sprite-parity.test.ts']).length;

  const tree = (cwd: string, ref: string, dir: string): Map<string, string> => parseTree(git(cwd, ['ls-tree', '-r', ref, '--', dir]), dir);
  const packs = packChanges3d(tree(mono, branch, PACK_DIRS.mono3d), tree(FORGE, forge, PACK_DIRS.forge3d));
  const spriteVersion = (cwd: string, ref: string, dir: string): string | undefined => {
    try {
      return (JSON.parse(git(cwd, ['show', `${ref}:${dir}/v1/pack.json`])) as { version: string }).version;
    } catch {
      return undefined;
    }
  };
  const sprites = {
    from: spriteVersion(mono, branch, PACK_DIRS.mono2d),
    to: spriteVersion(FORGE, forge, PACK_DIRS.forge2d),
    models: spriteChanges(tree(mono, branch, PACK_DIRS.mono2d), tree(FORGE, forge, PACK_DIRS.forge2d)),
  };

  const packModels: Record<string, string[]> = Object.fromEntries(Object.entries(MODEL_PACKS).map(([id, names]) => [id, [...names]]));
  const models = [...new Set([...packs.flatMap((p) => p.models.filter((m) => m.status !== 'same').map((m) => m.model)), ...sprites.models.map((m) => m.model)])];
  const shared = gameSrc.includes('shared');
  const games = new Map([...affectedGames([...gameFiles.keys()].filter((g) => g !== 'shared'), models, GAME_LOADS, packModels)].filter(([g]) => monoGames.has(g)));
  const smoke = [...(kitFiles.length ? ['kit code'] : []), ...(shared ? ['shared game code'] : [])];
  // The skin and the avatar pack against the app of the target branch, which the skin sync writes.
  const show = (cwd: string, ref: string, path: string): string | undefined => {
    const r = spawnSync('git', ['show', `${ref}:${path}`], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
    return r.status === 0 ? r.stdout : undefined;
  };
  const skin = gitOk(mono, ['rev-parse', '--verify', '--quiet', `${target}^{commit}`])
    ? skinChange(
        { skin: show(mono, target, `${APP_PUBLIC}/rpg/skin.json`), rpg: tree(mono, target, `${APP_PUBLIC}/rpg`), avatar: tree(mono, target, `${APP_PUBLIC}/packs/avatar`) },
        {
          skin: show(FORGE, forge, 'demo/public/rpg/skin.json'),
          rpg: tree(FORGE, forge, 'demo/public/rpg'),
          avatar: tree(FORGE, forge, 'demo/public/avatar-pack'),
          kit: /AVATAR_PACK_VERSION = '([^']+)'/.exec(show(FORGE, forge, 'src/apk3d/avatar/pack-version.ts') ?? '')?.[1],
        },
        // A JSON file in another format is the same content (the app writes portraits.json without spaces).
        (path, appBlob, forgeBlob) => {
          if (!path.endsWith('.json')) return false;
          try {
            const parse = (cwd: string, blob: string): string => JSON.stringify(JSON.parse(git(cwd, ['cat-file', '-p', blob])));
            return parse(mono, appBlob) === parse(FORGE, forgeBlob);
          } catch {
            return false;
          }
        },
      )
    : undefined;

  const packUrls = [
    ...packs.filter((p) => p.to).map((p) => `${modelPackRoot(p.id, p.to)}/pack.json`),
    ...(sprites.from !== sprites.to && sprites.to ? [`${spritePackRoot(SPRITE_PACK_ID).slice(1)}/pack.json (version ${sprites.to})`] : []),
    ...(skin && skin.avatarWrite && skin.kitAvatar ? [`packs/avatar/${skin.kitAvatar}/pack.json`] : []),
    ...(skin && skin.write ? [`rpg/skin.json (version ${skin.forge ?? '?'})`] : []),
  ];

  let check: string | undefined;
  if (!has('--no-check')) {
    const r = spawnSync('node', ['--import', 'tsx', 'scripts/monorepo-sync.ts', '--check', '--monorepo', mono, ...(value('--forge-commit') ? ['--forge-commit', forge] : [])], { cwd: FORGE, encoding: 'utf8' });
    const keep = (l: string): boolean => /^(forge |note:|  |differs |missing |only here |monorepo only |port-kit:|port-game:|in sync|out of sync)/.test(l);
    check = `${r.stdout}${r.stderr}`.split('\n').filter(keep).slice(0, 60).join('\n');
  }

  const text = handoffText({
    forge,
    date: new Date().toISOString().slice(0, 10),
    branch,
    target,
    last,
    forgeCommitOption: !!value('--forge-commit'),
    commits,
    kitFiles,
    gameFiles,
    forgeOnly,
    testFiles,
    packs,
    sprites,
    games,
    smoke,
    packUrls,
    skin,
    tracks: tracksOf(commits.map((c) => c.sha)),
    ...(check ? { check } : {}),
  });
  const dir = join(FORGE, 'out', 'monorepo-sync');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `handoff-${forge}.md`), text);
  process.stdout.write(text);
  console.log(`\nwritten out/monorepo-sync/handoff-${forge}.md`);
}

function status(mono: string, branch: string): void {
  const last = lastSync(syncLog(mono, branch));
  if (!last) throw new Error(`no "sync from Forge <sha>" commit on ${branch} in ${mono}`);
  const pending = forgeCommits(last.forge, 'HEAD');
  const dirty = git(FORGE, ['status', '--porcelain', '--', ...FORGE_PATHS]).split('\n').filter(Boolean);
  console.log(`last sync: monorepo ${last.mono} on ${branch} carries Forge ${last.forge}`);
  console.log(`Forge commits that the monorepo does not have: ${pending.length}`);
  for (const c of pending) console.log(`  ${c.sha}  ${c.cls.padEnd(7)}  ${c.subject}`);
  if (dirty.length) console.log(`uncommitted Forge files in the synced paths: ${dirty.length}`);
}

function record(mono: string, branch: string): void {
  const sha = argv[argv.indexOf('--record') + 1];
  const one = sha && !sha.startsWith('--') ? git(mono, ['rev-parse', '--short', sha]) : undefined;
  const syncs = git(mono, ['log', '--format=%h%x09%cs%x09%s', branch])
    .split('\n')
    .flatMap((l) => {
      const [h = '', date = '', subject = ''] = l.split('\t');
      const forge = SYNC_SUBJECT.exec(subject)?.[1];
      return forge ? [{ mono: h, date, forge }] : [];
    })
    .reverse();
  if (one && !syncs.some((s) => s.mono === one)) throw new Error(`${one} is not a "sync from Forge" commit on ${branch}`);
  const ledger = existsSync(LEDGER) ? readFileSync(LEDGER, 'utf8') : LEDGER_HEAD;
  const added: string[] = [];
  const tracks = new Set<string>();
  for (const [i, s] of syncs.entries()) {
    if ((one && s.mono !== one) || ledger.includes(`\`${s.mono}\``)) continue;
    const prev = syncs[i - 1]?.forge;
    const known = gitOk(FORGE, ['cat-file', '-e', `${s.forge}^{commit}`]) && (!prev || gitOk(FORGE, ['cat-file', '-e', `${prev}^{commit}`]));
    const carried = known && prev ? forgeCommits(prev, s.forge) : [];
    const ids = tracksOf(carried.map((c) => c.sha));
    for (const id of ids) tracks.add(id);
    const body = git(mono, ['log', '-1', '--format=%B', s.mono]);
    const alsoOn = git(mono, ['branch', '--contains', s.mono, '--format=%(refname:short)'])
      .split('\n')
      .filter((b) => b && b !== branch)
      .slice(0, 3)
      .join(', ');
    added.push(
      ledgerLine({
        date: s.date,
        mono: s.mono,
        forge: s.forge,
        carried: known && prev ? String(carried.length) : '-',
        packs: packsOf(body),
        alsoOn,
        tracks: ids.map((t) => `\`${t}\``).join(', '),
      }),
    );
  }
  if (!added.length) {
    console.log(one ? `${one} is in the ledger already` : 'the ledger has every sync commit already');
    return;
  }
  writeFileSync(LEDGER, `${ledger.replace(/\n*$/, '\n')}${added.join('\n')}\n`);
  console.log(`added ${added.length} row(s) to measure/monorepo-syncs.md`);
  if (one && tracks.size) console.log(`record ${one} in these track plans: ${[...tracks].join(', ')}`);
}

function main(): void {
  if (!existsSync(join(FORGE, 'forge'))) throw new Error('run scripts/monorepo-handoff.ts from the Forge repository root');
  const mono = value('--monorepo') ?? defaultMonorepo(FORGE);
  const branch = value('--branch') ?? PORT_BRANCH;
  if (!existsSync(mono)) throw new Error(`no monorepo checkout at ${mono}`);
  if (has('--status')) status(mono, branch);
  else if (has('--record')) record(mono, branch);
  else handoff(mono, branch);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
