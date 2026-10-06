/**
 * Builds the Primary Advantage RPG skin files from Forge sources (monorepo track
 * primary_rpg_skin_20261006; Forge track apk_pack_release_20261006). The app serves them at
 * `/rpg/...` (`apps/primary-advantage/public/rpg/`); this script writes the same tree to
 * `demo/public/rpg/` with a manifest, `skin.json`, and `scripts/monorepo-sync.ts --skin <app dir>`
 * mirrors the listed files into the app. It also copies the avatar pack that the hero portraits
 * come from to `demo/public/avatar-pack/<version>/` (the app serves it at `/packs/avatar/<version>/`).
 *
 *   node --import tsx scripts/rpg-skin.ts --check     list the stale files, build nothing
 *   node --import tsx scripts/rpg-skin.ts             build the stale files
 *   node --import tsx scripts/rpg-skin.ts --all       build every file
 *
 * `--jobs <n>` (or $RPG_SKIN_JOBS, default 2) sets the number of forge jobs at one time; use 1 when
 * another heavy process holds the memory. A run that stops resumes: out/rpg-skin/built.json records
 * each finished render, strip, scene model, and avatar input with its source revision, and the next
 * run skips the ones whose output exists and whose revision is the same.
 *
 * Kinds of file (the table `SKIN`):
 * - `view`: a transparent view render (`forge render --bg none`, 512 px), resized, as WebP.
 * - `strip`: a `forge sprites --dirs 1` clip sheet (direction S, 8 frames, elevation 30; the same
 *   pixels as the first row of the 8-direction sheet), as PNG; optionally of a color preset, and
 *   optionally at one fixed cell for all the clips of the asset (`--size <cell> --cell`), framed
 *   for the S view. A strip's frame size is its height.
 * - `hero`: a starter set (src/apk3d/avatar/starters.ts) composed from the avatar pack on the avatar
 *   review page (`avatar.html?hero=<id>&turn=-25`: turned so the weapon and the shield both read),
 *   on a transparent background, as WebP. With `silhouette: <px>` the shot becomes a dark grey
 *   figure with a soft question mark at that size (hero `none`: the bare base, for "no hero yet").
 * - `backdrop`: a shot of a scene map on the scene page (`hamlet.html?scene=<place>&clean&...`),
 *   as WebP without alpha. Every asset of the map is built (textured) first.
 * - `copy`: a Forge file as it is (fonts).
 *
 * A file is stale when it is missing, when its table row changed, or when its source revision
 * differs from the manifest: the last commit of its asset's files (scripts/apk-pack-models.ts
 * `sourceFiles`), of the avatar sources for a hero, or of the map, its assets, and the scene page
 * for a backdrop. A changed skin gets the next patch version and a skin with added or removed files
 * the next minor version. Run it in the clean release worktree (`scripts/apk-release.ts --skin`):
 * it writes out/<asset>/, out/packs/avatar/, and out/rpg-skin/.
 */
import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { avatarPackPath } from '../src/apk3d/avatar/pack.js';
import { STARTER_SETS } from '../src/apk3d/avatar/starters.js';
import { nextVersion, sourceFiles, sourceRevision } from './apk-pack-models.js';

type View = 'front' | 'three-quarter';
type Entry =
  | { kind: 'view'; asset: string; view: View; size: number; preset?: string }
  | { kind: 'strip'; asset: string; clip: string; preset?: string; cell?: number }
  | { kind: 'hero'; hero: string; size: number; turn: number; silhouette?: number }
  | { kind: 'backdrop'; place: string; query: string; width: number; height: number }
  | { kind: 'copy'; from: string };

const ROOT = process.cwd();

const icon = (asset: string): Entry => ({ kind: 'view', asset, view: 'front', size: 192 });
/**
 * One color look per character: every view and every strip of a character uses it, so a student
 * never sees one boss or NPC in two colorings. `null` is the default look, the one the games show.
 * A role NPC takes the preset of its role (a shopkeeper is the grocer).
 */
const LOOKS: Readonly<Record<string, string | null>> = {
  'dragon-fire': null,
  'goblin-king': null,
  'iron-golem': null,
  lich: null,
  blacksmith: null,
  'quest-giver': 'scribe',
  shopkeeper: 'grocer',
  innkeeper: 'hostess',
  villager: 'weaver',
};
const lookOf = (asset: string): { preset?: string } => (LOOKS[asset] ? { preset: LOOKS[asset]! } : {});
const views = (asset: string, dir: string): Record<string, Entry> => ({
  [`${dir}/${asset}-front.webp`]: { kind: 'view', asset, view: 'front', size: dir === 'kit/npc' ? 256 : 512, ...lookOf(asset) },
  ...(dir === 'kit/boss' ? { [`${dir}/${asset}-3q.webp`]: { kind: 'view', asset, view: 'three-quarter', size: 512, ...lookOf(asset) } as Entry } : {}),
});
const strips = (asset: string, dir: string, clips: string[], cell?: number): Record<string, Entry> =>
  Object.fromEntries(clips.map((clip) => [`${dir}/${asset}-${clip}-strip.png`, { kind: 'strip', asset, clip, ...lookOf(asset), ...(cell ? { cell } : {}) } as Entry]));

/** The NPCs of the pages (idle and talk strips) and the bosses (views and strips at one cell). */
const NPCS = ['blacksmith', 'quest-giver', 'shopkeeper', 'innkeeper', 'villager'];
const BOSSES = ['dragon-fire', 'goblin-king', 'iron-golem', 'lich'];
/** The pages' places: a scene map each (scenes/maps/<place>.ts), shot for desktop and phone. */
const PLACES = ['guild-hall', 'shrine', 'treasure-vault', 'armory', 'boss-arena', 'arena', 'library', 'clearing', 'wizard-tower', 'archive', 'inn', 'observatory', 'gatehouse'];
const backdrop = (place: string, phone: boolean): Entry => ({
  kind: 'backdrop',
  place,
  query: `scene=${place}&clean&az=20&el=24&dist=${phone ? 11 : 13}&tx=0&tz=-1`,
  width: phone ? 1080 : 1920,
  height: phone ? 1920 : 1080,
});
/** The ready rows of the avatar catalog: the shop items. */
const CATALOG = readFileSync(join(ROOT, 'docs', 'avatar-catalog.tsv'), 'utf8')
  .split('\n')
  .slice(1)
  .map((line) => line.split('\t'))
  .filter((cols) => cols[4] === 'ready')
  .map((cols) => cols[0]!);

/** Every skin file by its path under `/rpg/`. */
export const SKIN: Readonly<Record<string, Entry>> = {
  'kit/icons/banner.webp': icon('banner'),
  'kit/icons/campfire.webp': icon('campfire'),
  'kit/icons/chest.webp': icon('treasure-chest'),
  'kit/icons/coin.webp': icon('gold-coin'),
  'kit/icons/gem.webp': icon('gem-sapphire'),
  'kit/icons/locked-chest.webp': icon('locked-chest'),
  'kit/icons/notice-board.webp': icon('notice-board'),
  'kit/icons/purse.webp': icon('coin-purse'),
  'kit/icons/scroll.webp': icon('scroll'),
  'kit/icons/slot-back.webp': icon('cloak'),
  'kit/icons/slot-chest.webp': icon('chainmail'),
  'kit/icons/slot-feet.webp': icon('boots'),
  'kit/icons/slot-hair.webp': icon('avatar-hair-long'),
  'kit/icons/slot-hands.webp': icon('gloves'),
  'kit/icons/slot-head.webp': icon('leather-cap'),
  'kit/icons/slot-mainhand.webp': icon('long-sword'),
  'kit/icons/slot-offhand.webp': icon('round-shield'),
  'kit/icons/slot-shoulders.webp': icon('shoulder-armor'),
  'kit/icons/slot-waist.webp': icon('belt'),
  'kit/relics/rally-horn.webp': icon('horn'),
  'kit/relics/sharp-blade.webp': icon('warrior-sword'),
  'kit/relics/shield.webp': icon('kite-shield'),
  ...views('blacksmith', 'kit/npc'),
  ...views('quest-giver', 'kit/npc'),
  ...Object.assign({}, ...NPCS.map((npc) => strips(npc, 'kit/npc', ['idle', 'talk']))),
  ...Object.assign({}, ...BOSSES.map((b) => ({ ...views(b, 'kit/boss'), ...strips(b, 'kit/boss', ['idle', 'hit', 'attack', 'death'], 160) }))),
  ...Object.fromEntries(STARTER_SETS.map((s) => [`kit/heroes/${s.id}.webp`, { kind: 'hero', hero: s.id, size: 512, turn: -25 } as Entry])),
  // The live dashboard's tile for a student with no hero yet (72 CSS px; 256 covers 3x screens).
  'kit/heroes/no-hero.webp': { kind: 'hero', hero: 'none', size: 512, turn: -25, silhouette: 256 },
  ...Object.fromEntries(CATALOG.map((id) => [`items/${id}.webp`, { kind: 'view', asset: id, view: 'front', size: 256 } as Entry])),
  ...Object.fromEntries(PLACES.flatMap((p) => [[`backdrops/${p}-d.webp`, backdrop(p, false)], [`backdrops/${p}-p.webp`, backdrop(p, true)]])),
  'fonts/fredoka-latin.woff2': { kind: 'copy', from: 'src/apk3d/hud/fonts/fredoka-latin.woff2' },
  'fonts/mitr-500-thai.woff2': { kind: 'copy', from: 'src/showcase/battle/fonts/mitr-500-thai.woff2' },
};

// One look per character: stop before any build if two files of one asset use different looks.
for (const [asset, looks] of Object.entries(
  Object.values(SKIN).reduce<Record<string, Set<string>>>((acc, e) => {
    if (e.kind === 'view' || e.kind === 'strip') (acc[e.asset] ??= new Set()).add(e.preset ?? '(default)');
    return acc;
  }, {}),
))
  if (looks.size > 1) throw new Error(`${asset} has more than one look in the skin: ${[...looks].join(', ')}`);

interface ManifestFile {
  kind: Entry['kind'];
  /** The Forge source: `advantage-forge/assets/<asset>.ts`, the map, the starter set, or the copied file. */
  source: string;
  /** The table row that built the file (a changed row rebuilds it). */
  spec: Entry;
  forgeCommit: string;
  byteSize: number;
}
interface Manifest {
  id: 'primary-rpg-skin';
  version: string;
  files: Record<string, ManifestFile>;
}

const DEST = join(ROOT, 'demo', 'public', 'rpg');
const MANIFEST = join(DEST, 'skin.json');
const AVATAR_DEST = join(ROOT, 'demo', 'public', 'avatar-pack', avatarPackPath().split('/').pop()!);
const TMP = join(ROOT, 'out', 'rpg-skin');
/** The source revision of every GLB this script built in out/ (out/<asset>/ and the avatar inputs). */
const BUILT = join(TMP, 'built.json');
const argv = process.argv.slice(2);
const git = (args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const lastCommit = (files: string[]): string => (files.length ? git(['log', '-1', '--format=%h', '--', ...files]) : '') || git(['rev-parse', '--short', 'HEAD']);

/** The assets a scene map places. */
const mapAssets = (place: string): string[] => [...new Set([...readFileSync(join(ROOT, 'scenes', 'maps', `${place}.ts`), 'utf8').matchAll(/asset: '([a-z0-9-]+)'/g)].map((m) => m[1]!))].sort();
/** The pieces of a starter set and the default hair the composer falls back to. */
const heroPieces = (hero: string): string[] => ['avatar-base', 'avatar-hair-swept', ...(STARTER_SETS.find((s) => s.id === hero)?.pieces ?? [])];
const AVATAR_CODE = ['src/apk3d/avatar', 'src/avatar-review', 'avatar.html', 'scripts/avatar-pack.ts'];
const SCENE_CODE = ['src/scene', 'hamlet.html', 'scenes/chibi-quest.ts'];

const memo = new Map<string, string>();
function revision(entry: Entry): string {
  const key = JSON.stringify(entry.kind === 'backdrop' ? { b: entry.place } : entry.kind === 'hero' ? { h: entry.hero } : entry.kind === 'copy' ? { c: entry.from } : { a: entry.asset });
  let rev = memo.get(key);
  if (rev === undefined) {
    if (entry.kind === 'copy') rev = lastCommit([entry.from]);
    else if (entry.kind === 'hero') rev = lastCommit([...heroPieces(entry.hero).flatMap((p) => sourceFiles(p, ROOT)), ...AVATAR_CODE]);
    else if (entry.kind === 'backdrop') rev = lastCommit([`scenes/maps/${entry.place}.ts`, ...mapAssets(entry.place).flatMap((a) => sourceFiles(a, ROOT)), ...SCENE_CODE]);
    else rev = sourceRevision(entry.asset, ROOT);
    memo.set(key, rev);
  }
  return rev;
}
function sourceOf(entry: Entry): string {
  if (entry.kind === 'copy') return `advantage-forge/${entry.from}`;
  if (entry.kind === 'hero') return `advantage-forge/src/apk3d/avatar/starters.ts#${entry.hero}`;
  if (entry.kind === 'backdrop') return `advantage-forge/scenes/maps/${entry.place}.ts`;
  return `advantage-forge/assets/${entry.asset}.ts`;
}

const current: Manifest | undefined = existsSync(MANIFEST) ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest) : undefined;
const stale = Object.keys(SKIN).filter((path) => {
  if (argv.includes('--all')) return true;
  const old = current?.files[path];
  const entry = SKIN[path]!;
  return !old || !existsSync(join(DEST, path)) || JSON.stringify(old.spec) !== JSON.stringify(entry) || old.forgeCommit !== revision(entry);
});
const removed = Object.keys(current?.files ?? {}).filter((p) => !SKIN[p]);
const staleHeroes = stale.some((p) => SKIN[p]!.kind === 'hero');
const avatarMissing = !existsSync(join(AVATAR_DEST, 'pack.json'));
console.log(`skin: ${stale.length} stale of ${Object.keys(SKIN).length}${removed.length ? `, ${removed.length} removed` : ''}${staleHeroes || avatarMissing ? ', avatar pack to build' : ''}`);
for (const p of stale) console.log(`  ${p}`);
if (argv.includes('--check')) process.exit(0);

const built: Record<string, string> = existsSync(BUILT) ? (JSON.parse(readFileSync(BUILT, 'utf8')) as Record<string, string>) : {};
const saveBuilt = (): void => {
  mkdirSync(TMP, { recursive: true });
  writeFileSync(BUILT, `${JSON.stringify(built, null, 1)}\n`);
};
const forgeEnv = { ...process.env, FORGE_WORKERS: process.env.FORGE_WORKERS ?? '2' };
function forge(args: string[]): void {
  execFileSync(join(ROOT, 'forge'), args, { stdio: ['ignore', 'ignore', 'inherit'], env: forgeEnv });
}
const jobsArg = argv.indexOf('--jobs');
const JOBS = Math.max(1, Number((jobsArg >= 0 ? argv[jobsArg + 1] : undefined) ?? process.env.RPG_SKIN_JOBS ?? 2) || 1);
/** Runs forge jobs JOBS at a time (the launcher's build slots also hold the machine limit). */
async function forgePool(jobs: string[][], label: (args: string[]) => string, done: (args: string[]) => void): Promise<void> {
  let next = 0;
  let failed = 0;
  const worker = async (): Promise<void> => {
    while (next < jobs.length) {
      const args = jobs[next++]!;
      const t = performance.now();
      const code = await new Promise<number>((done) => spawn(join(ROOT, 'forge'), args, { stdio: ['ignore', 'ignore', 'inherit'], env: forgeEnv }).on('close', (c) => done(c ?? 1)));
      if (code !== 0) failed++;
      else done(args);
      console.log(`${code === 0 ? 'built ' : 'FAILED'} ${label(args).padEnd(28)} (${Math.round((performance.now() - t) / 1000)} s)`);
    }
  };
  await Promise.all(Array.from({ length: JOBS }, worker));
  if (failed) throw new Error(`${failed} forge job(s) failed`);
}
const timed = (key: string, run: () => void): void => {
  const t = performance.now();
  run();
  console.log(`built  ${key.padEnd(28)} (${Math.round((performance.now() - t) / 1000)} s)`);
};

// Views: one render per asset with all its views. A render also builds out/<asset>/<asset>.glb.
const viewWork = new Map<string, Set<View>>(); // key: asset|preset
const stripWork = new Map<string, Extract<Entry, { kind: 'strip' }>[]>();
const stripKey = (e: Extract<Entry, { kind: 'strip' }>): string => [e.asset, e.preset ?? '', e.cell ?? ''].join('|');
const stripDir = (e: Extract<Entry, { kind: 'strip' }>): string => join(TMP, stripKey(e).replaceAll('|', '_'), ...(e.preset ? ['presets', e.preset] : []), e.clip);
for (const p of stale) {
  const e = SKIN[p]!;
  if (e.kind === 'view') viewWork.set(`${e.asset}|${e.preset ?? ''}`, new Set([...(viewWork.get(`${e.asset}|${e.preset ?? ''}`) ?? []), e.view]));
  if (e.kind === 'strip') stripWork.set(stripKey(e), [...(stripWork.get(stripKey(e)) ?? []), e]);
}
const viewPng = (asset: string, preset: string, view: string): string => join(ROOT, 'out', asset, 'views', ...(preset ? ['presets', preset] : []), `${view}.png`);
const viewDone = (key: string, list: Set<View>): boolean => {
  const [asset, preset] = key.split('|') as [string, string];
  return built[`view:${key}`] === sourceRevision(asset, ROOT) && [...list].every((v) => existsSync(viewPng(asset, preset, v)));
};
// One job per asset, so two jobs never write the same out/<asset>/.
await forgePool(
  [...viewWork]
    .filter(([key, list]) => !viewDone(key, list))
    .map(([key, list]) => {
      const [asset, preset] = key.split('|') as [string, string];
      return ['render', asset, '--bg', 'none', '--views', [...list].join(','), '--size', '512', '--no-ref', ...(preset ? ['--preset', preset] : [])];
    }),
  (args) => `view:${args[1]}`,
  (args) => {
    const preset = args.includes('--preset') ? args[args.indexOf('--preset') + 1]! : '';
    // The render also builds out/<asset>/<asset>.glb, which a backdrop can use.
    built[`view:${args[1]}|${preset}`] = built[args[1]!] = sourceRevision(args[1]!, ROOT);
    saveBuilt();
  },
);
// Strips: one sprite run per asset, preset, and cell with all its clips.
for (const [key, entries] of stripWork) {
  const e = entries[0]!;
  const rev = sourceRevision(e.asset, ROOT);
  if (built[`strip:${key}`] === rev && entries.every((x) => existsSync(join(stripDir(x), 'sheet.png')) && existsSync(join(stripDir(x), 'metrics.json')))) continue;
  const into = join(TMP, key.replaceAll('|', '_'));
  rmSync(into, { recursive: true, force: true });
  const clips = [...new Set(entries.map((x) => x.clip))].join(',');
  timed(`strip:${key}`, () => forge(['sprites', e.asset, '--clip', clips, '--dirs', '1', '--into', into, ...(e.preset ? ['--preset', e.preset] : []), ...(e.cell ? ['--size', String(e.cell), '--cell'] : [])]));
  built[`strip:${key}`] = rev;
  saveBuilt();
}

// The avatar pack (hero portraits): rebuild the reduced inputs whose sources changed, then assemble.
if (staleHeroes || avatarMissing) {
  const ids = ['avatar-base', ...CATALOG];
  for (const id of ids) {
    const rev = sourceRevision(id, ROOT);
    if (built[`avatar:${id}`] !== rev) for (const form of ['', '+capped', '+tucked']) rmSync(join(ROOT, 'out', `${id}${form}+reduced`), { recursive: true, force: true });
    // Every reduced input left now is from the current sources; avatar-pack.ts builds only the missing ones.
    built[`avatar:${id}`] = rev;
  }
  saveBuilt();
  const t = performance.now();
  execFileSync('node', ['--import', 'tsx', 'scripts/avatar-pack.ts', '--build'], { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'], env: forgeEnv });
  console.log(`built  avatar pack                  (${Math.round((performance.now() - t) / 1000)} s)`);
}

// Backdrops: build every asset of the stale maps whose GLB is missing or older than its source.
const staleBackdrops = stale.map((p) => [p, SKIN[p]!] as const).filter(([, e]) => e.kind === 'backdrop');
if (staleBackdrops.length) {
  const assets = [...new Set(staleBackdrops.flatMap(([, e]) => mapAssets((e as Extract<Entry, { kind: 'backdrop' }>).place)))].sort();
  const todo = assets.filter((a) => !existsSync(join(ROOT, 'out', a, `${a}.glb`)) || built[a] !== sourceRevision(a, ROOT));
  console.log(`backdrops: ${assets.length} map assets, ${todo.length} to build`);
  await forgePool(
    todo.map((a) => ['build', a]),
    (args) => `glb:${args[1]}`,
    (args) => {
      built[args[1]!] = sourceRevision(args[1]!, ROOT);
      saveBuilt();
    },
  );
}

// Page shots (heroes and backdrops) on a dev server of this checkout.
const staleHeroPaths = stale.filter((p) => SKIN[p]!.kind === 'hero');
const shots = new Map<string, Buffer>();
if (staleHeroPaths.length || staleBackdrops.length) {
  const port = Number(process.env.RPG_SKIN_PORT ?? 5299);
  // In-process and without a file watcher: the server only serves this checkout, and watching every
  // file of demo/public can exhaust the system's inotify watchers (ENOSPC) on a busy machine.
  const { createServer } = await import('vite');
  // `server.watch: null` must be set on the merged config: a config merge skips null values.
  const noWatch = { name: 'rpg-skin-no-watch', config: (c: { server?: { watch?: unknown } }) => void ((c.server ??= {}).watch = null) };
  const server = await createServer({ root: ROOT, configFile: join(ROOT, 'vite.config.ts'), logLevel: 'error', server: { port, strictPort: true, hmr: false }, plugins: [noWatch] });
  await server.listen();
  try {
    const base = `http://127.0.0.1:${port}`;
    for (let i = 0; ; i++) {
      if (await fetch(`${base}/hamlet.html`).then((r) => r.ok, () => false)) break;
      if (i > 120) throw new Error('the dev server did not start');
      await new Promise((r) => setTimeout(r, 500));
    }
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
    try {
      for (const path of staleHeroPaths) {
        const e = SKIN[path] as Extract<Entry, { kind: 'hero' }>;
        const page = await browser.newPage({ viewport: { width: e.size, height: e.size } });
        page.setDefaultTimeout(240000);
        await page.goto(`${base}/avatar.html?hero=${e.hero}&turn=${e.turn}`);
        await page.waitForFunction('window.__avatarReady === true');
        const errors = await page.evaluate(() => window.__avatarErrors ?? []);
        if (errors.length) throw new Error(`hero ${e.hero}: ${errors.join('; ')}`);
        await page.waitForTimeout(500);
        shots.set(path, await page.screenshot({ omitBackground: true }));
        await page.close();
        console.log(`shot   hero:${e.hero}`);
      }
      for (const [path, entry] of staleBackdrops) {
        const e = entry as Extract<Entry, { kind: 'backdrop' }>;
        const page = await browser.newPage({ viewport: { width: e.width, height: e.height } });
        page.setDefaultTimeout(240000);
        await page.goto(`${base}/hamlet.html?${e.query}`);
        await page.waitForFunction('window.__hamletReady === true');
        const missing = await page.evaluate(() => (window as { __hamletMissing?: unknown }).__hamletMissing);
        if (Array.isArray(missing) && missing.length) throw new Error(`backdrop ${path}: missing ${missing.join(', ')}`);
        await page.waitForTimeout(1500);
        shots.set(path, await page.screenshot());
        await page.close();
        console.log(`shot   ${path}`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
}

/**
 * A shot as a dark grey figure (a soft top-to-bottom gradient in the shot's own shape) with a soft
 * question mark on the head, resized to `out` px, as WebP.
 */
async function silhouette(shot: Buffer, size: number, out: number): Promise<Buffer> {
  const fill = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#5b616b"/><stop offset="1" stop-color="#30343a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const mark = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><text x="50%" y="${Math.round(size * 0.4)}" text-anchor="middle" ` +
      `font-family="sans-serif" font-weight="700" font-size="${Math.round(size * 0.24)}" fill="#c9ced6" fill-opacity="0.55">?</text></svg>`,
  );
  const figure = await sharp(fill).composite([{ input: shot, blend: 'dest-in' }]).png().toBuffer();
  return sharp(figure).composite([{ input: mark, blend: 'atop' }]).resize(out, out).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
}

const files: Record<string, ManifestFile> = {};
for (const [path, entry] of Object.entries(SKIN)) {
  const dest = join(DEST, path);
  if (stale.includes(path)) {
    mkdirSync(dirname(dest), { recursive: true });
    if (entry.kind === 'copy') copyFileSync(join(ROOT, entry.from), dest);
    else if (entry.kind === 'view') {
      const src = join(ROOT, 'out', entry.asset, 'views', ...(entry.preset ? ['presets', entry.preset] : []), `${entry.view}.png`);
      writeFileSync(dest, await sharp(src).resize(entry.size, entry.size).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer());
    } else if (entry.kind === 'strip') {
      const dir = stripDir(entry);
      const meta = JSON.parse(readFileSync(join(dir, 'metrics.json'), 'utf8')) as { size: number };
      const { width } = await sharp(join(dir, 'sheet.png')).metadata();
      writeFileSync(dest, await sharp(join(dir, 'sheet.png')).extract({ left: 0, top: 0, width: width!, height: meta.size }).png({ compressionLevel: 9 }).toBuffer());
    } else if (entry.kind === 'hero' && entry.silhouette) {
      writeFileSync(dest, await silhouette(shots.get(path)!, entry.size, entry.silhouette));
    } else if (entry.kind === 'hero') {
      writeFileSync(dest, await sharp(shots.get(path)!).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer());
    } else {
      writeFileSync(dest, await sharp(shots.get(path)!).removeAlpha().webp({ quality: 78, effort: 6 }).toBuffer());
    }
  }
  files[path] = { kind: entry.kind, source: sourceOf(entry), spec: entry, forgeCommit: revision(entry), byteSize: readFileSync(dest).length };
}
for (const p of removed) rmSync(join(DEST, p), { force: true });
if (staleHeroes || avatarMissing) {
  rmSync(AVATAR_DEST, { recursive: true, force: true });
  cpSync(join(ROOT, 'out', avatarPackPath()), AVATAR_DEST, { recursive: true });
  console.log(`avatar pack -> ${AVATAR_DEST.slice(ROOT.length + 1)}`);
}

const ids = Object.keys(files).sort();
const before = Object.keys(current?.files ?? {}).sort();
const sameIds = before.length === ids.length && before.every((id, i) => id === ids[i]);
const same = sameIds && ids.every((id) => JSON.stringify(current!.files[id]) === JSON.stringify(files[id]));
const version = !current ? '1.0.0' : same ? current.version : nextVersion(current.version, sameIds ? 'patch' : 'minor');
const manifest: Manifest = { id: 'primary-rpg-skin', version, files: Object.fromEntries(ids.map((id) => [id, files[id]!])) };
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`skin   ${current?.version ?? '(new)'} -> ${version}, ${ids.length} files, ${(Object.values(files).reduce((s, f) => s + f.byteSize, 0) / 1024 / 1024).toFixed(2)} MB`);
