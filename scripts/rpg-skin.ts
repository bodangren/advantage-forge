/**
 * Builds the Primary Advantage RPG skin files from Forge sources (monorepo track
 * primary_rpg_skin_20261006; Forge track apk_pack_release_20261006). The app serves them at
 * `/rpg/...` (`apps/primary-advantage/public/rpg/`); this script writes the same tree to
 * `demo/public/rpg/` with a manifest, `skin.json`, and `scripts/monorepo-sync.ts --skin <app dir>`
 * mirrors the listed files into the app.
 *
 *   node --import tsx scripts/rpg-skin.ts --check     list the stale files, build nothing
 *   node --import tsx scripts/rpg-skin.ts             build the stale files
 *   node --import tsx scripts/rpg-skin.ts --all       build every file
 *
 * Kinds of file (the table `SKIN`):
 * - `view`: a transparent view render (`forge render --bg none`, 512 px), resized, as WebP.
 * - `strip`: the first row (direction S) of a `forge sprites` clip sheet at the `forge all`
 *   defaults (128 px, 8 directions, 8 frames, elevation 30), as PNG.
 * - `copy`: a Forge file as it is (fonts).
 * Backdrops (scene shots) join the table when their cameras are recorded.
 *
 * A file is stale when it is missing, when its table row changed, or when the source revision of
 * its asset (scripts/apk-pack-models.ts `sourceRevision`) differs from the manifest. A changed skin
 * gets the next patch version and a skin with added or removed files the next minor version.
 * Run it in the clean release worktree (`scripts/apk-release.ts --skin`): it writes out/<asset>/.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { nextVersion, sourceRevision } from './apk-pack-models.js';

type Entry =
  | { kind: 'view'; asset: string; view: 'front' | 'three-quarter'; size: number }
  | { kind: 'strip'; asset: string; clip: string }
  | { kind: 'copy'; from: string };

const icon = (asset: string): Entry => ({ kind: 'view', asset, view: 'front', size: 192 });
const views = (asset: string, dir: string): Record<string, Entry> => ({
  [`${dir}/${asset}-front.webp`]: { kind: 'view', asset, view: 'front', size: dir === 'kit/npc' ? 256 : 512 },
  ...(dir === 'kit/boss' ? { [`${dir}/${asset}-3q.webp`]: { kind: 'view', asset, view: 'three-quarter', size: 512 } as Entry } : {}),
});
const strips = (asset: string, dir: string, clips: string[]): Record<string, Entry> =>
  Object.fromEntries(clips.map((clip) => [`${dir}/${asset}-${clip}-strip.png`, { kind: 'strip', asset, clip } as Entry]));

/** Every skin file by its path under `/rpg/`. The sources match the Phase 0 files of the app. */
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
  ...strips('blacksmith', 'kit/npc', ['idle', 'talk']),
  ...Object.assign({}, ...['dragon-fire', 'goblin-king', 'iron-golem', 'lich'].map((b) => ({ ...views(b, 'kit/boss'), ...strips(b, 'kit/boss', ['idle', 'hit', 'death']) }))),
  'fonts/fredoka-latin.woff2': { kind: 'copy', from: 'src/apk3d/hud/fonts/fredoka-latin.woff2' },
  'fonts/mitr-500-thai.woff2': { kind: 'copy', from: 'src/showcase/battle/fonts/mitr-500-thai.woff2' },
};

interface ManifestFile {
  kind: Entry['kind'];
  /** The Forge source: `advantage-forge/assets/<asset>.ts` or the copied file. */
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

const ROOT = process.cwd();
const DEST = join(ROOT, 'demo', 'public', 'rpg');
const MANIFEST = join(DEST, 'skin.json');
const argv = process.argv.slice(2);
const git = (args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

function revision(entry: Entry): string {
  if (entry.kind === 'copy') return git(['log', '-1', '--format=%h', '--', entry.from]) || git(['rev-parse', '--short', 'HEAD']);
  return sourceRevision(entry.asset, ROOT);
}
const sourceOf = (entry: Entry): string => (entry.kind === 'copy' ? `advantage-forge/${entry.from}` : `advantage-forge/assets/${entry.asset}.ts`);

const current: Manifest | undefined = existsSync(MANIFEST) ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest) : undefined;
const stale = Object.keys(SKIN).filter((path) => {
  if (argv.includes('--all')) return true;
  const old = current?.files[path];
  const entry = SKIN[path]!;
  return !old || !existsSync(join(DEST, path)) || JSON.stringify(old.spec) !== JSON.stringify(entry) || old.forgeCommit !== revision(entry);
});
const removed = Object.keys(current?.files ?? {}).filter((p) => !SKIN[p]);
console.log(`skin: ${stale.length} stale of ${Object.keys(SKIN).length}${removed.length ? `, ${removed.length} removed` : ''}`);
for (const p of stale) console.log(`  ${p}`);
if (argv.includes('--check')) process.exit(0);

function forge(args: string[]): void {
  execFileSync(join(ROOT, 'forge'), args, { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, FORGE_WORKERS: process.env.FORGE_WORKERS ?? '2' } });
}

// One forge run per asset and kind: the views of an asset in one render, its clips in one sprite run.
const work = new Map<string, Entry[]>();
for (const p of stale) {
  const e = SKIN[p]!;
  if (e.kind === 'copy') continue;
  const key = `${e.kind}:${e.asset}`;
  work.set(key, [...(work.get(key) ?? []), e]);
}
const TMP = join(ROOT, 'out', 'rpg-skin');
for (const [key, entries] of work) {
  const [kind, asset] = key.split(':') as [string, string];
  const t = performance.now();
  if (kind === 'view') {
    const list = [...new Set(entries.map((e) => (e.kind === 'view' ? e.view : '')))].join(',');
    forge(['render', asset, '--bg', 'none', '--views', list, '--size', '512', '--no-ref']);
  } else {
    const clips = [...new Set(entries.map((e) => (e.kind === 'strip' ? e.clip : '')))].join(',');
    rmSync(join(TMP, asset), { recursive: true, force: true });
    forge(['sprites', asset, '--clip', clips, '--into', join(TMP, asset)]);
  }
  console.log(`built  ${key.padEnd(28)} (${Math.round((performance.now() - t) / 1000)} s)`);
}

const files: Record<string, ManifestFile> = {};
for (const [path, entry] of Object.entries(SKIN)) {
  const dest = join(DEST, path);
  if (stale.includes(path)) {
    mkdirSync(dirname(dest), { recursive: true });
    if (entry.kind === 'copy') copyFileSync(join(ROOT, entry.from), dest);
    else if (entry.kind === 'view') {
      const src = join(ROOT, 'out', entry.asset, 'views', `${entry.view}.png`);
      writeFileSync(dest, await sharp(src).resize(entry.size, entry.size).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer());
    } else {
      const sheet = join(TMP, entry.asset, entry.clip, 'sheet.png');
      const meta = JSON.parse(readFileSync(join(TMP, entry.asset, entry.clip, 'metrics.json'), 'utf8')) as { size: number };
      const { width } = await sharp(sheet).metadata();
      writeFileSync(dest, await sharp(sheet).extract({ left: 0, top: 0, width: width!, height: meta.size }).png({ compressionLevel: 9 }).toBuffer());
    }
  }
  files[path] = { kind: entry.kind, source: sourceOf(entry), spec: entry, forgeCommit: revision(entry), byteSize: readFileSync(dest).length };
}
for (const p of removed) rmSync(join(DEST, p), { force: true });

const ids = Object.keys(files).sort();
const before = Object.keys(current?.files ?? {}).sort();
const sameIds = before.length === ids.length && before.every((id, i) => id === ids[i]);
const same = sameIds && ids.every((id) => JSON.stringify(current!.files[id]) === JSON.stringify(files[id]));
const version = !current ? '1.0.0' : same ? current.version : nextVersion(current.version, sameIds ? 'patch' : 'minor');
const manifest: Manifest = { id: 'primary-rpg-skin', version, files: Object.fromEntries(ids.map((id) => [id, files[id]!])) };
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`skin   ${current?.version ?? '(new)'} -> ${version}, ${ids.length} files, ${(Object.values(files).reduce((s, f) => s + f.byteSize, 0) / 1024 / 1024).toFixed(2)} MB`);
