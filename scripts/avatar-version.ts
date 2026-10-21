/**
 * The version of a rebuilt avatar pack (track avatar_reward_pieces_20261006, debt TD-24). The app
 * serves the pack at `/packs/avatar/<version>/`, and a browser may keep the files of a version, so a
 * changed pack must get a new version. scripts/rpg-skin.ts builds the pack at the current version
 * (out/packs/avatar/<version>/), compares it with the published pack
 * (demo/public/avatar-pack/<version>/), and publishes it:
 *
 * - every file the same: the same version;
 * - only `forgeCommit` values in the JSON files differ (a rebuild from a newer commit that made the
 *   same pack; track apk_skin_identical_rebuild_20261021): the same version, and the published
 *   folder stays as it is;
 * - the same items (catalog ids) with changed files: the next patch version;
 * - items added or removed: the next minor version.
 *
 * A new version is stamped into the manifests of the published copy (`pack.json` version and root,
 * `catalog.json`, `portraits.json`) and into src/apk3d/avatar/pack-version.ts.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { nextVersion } from './apk-pack-models.js';

/** The files of a folder, relative to it, sorted. */
export function filesOf(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p));
    }
  };
  if (existsSync(dir)) walk(dir);
  return out.sort();
}

const itemIds = (dir: string): string[] => {
  const file = join(dir, 'catalog.json');
  if (!existsSync(file)) return [];
  return (JSON.parse(readFileSync(file, 'utf8')) as { items: { id: string }[] }).items.map((i) => i.id).sort();
};

/** JSON text without its `forgeCommit` values (the source revision that built the file). */
const withoutProvenance = (text: string): string =>
  JSON.stringify(JSON.parse(text, (key, value: unknown) => (key === 'forgeCommit' ? undefined : value)));

/** Two files of a pack are the same, or differ only in `forgeCommit` values (JSON files). */
function sameFile(a: string, b: string): 'same' | 'provenance' | 'changed' {
  const x = readFileSync(a);
  const y = readFileSync(b);
  if (x.equals(y)) return 'same';
  if (!a.endsWith('.json')) return 'changed';
  try {
    return withoutProvenance(x.toString('utf8')) === withoutProvenance(y.toString('utf8')) ? 'provenance' : 'changed';
  } catch {
    return 'changed';
  }
}

/**
 * How a pack built in `built` compares with the published pack in `published` (built at the same
 * version): `new` (nothing published), `same` (every file the same), `provenance` (only
 * `forgeCommit` values differ), `patch` (the same items, changed files), or `minor` (items added or
 * removed).
 */
export function compareAvatarPack(published: string, built: string): 'new' | 'same' | 'provenance' | 'patch' | 'minor' {
  if (!existsSync(join(published, 'catalog.json'))) return 'new';
  const a = filesOf(published);
  const b = filesOf(built);
  if (a.length === b.length && a.every((f, i) => f === b[i])) {
    const files = a.map((f) => sameFile(join(published, f), join(built, f)));
    if (files.every((r) => r === 'same')) return 'same';
    if (files.every((r) => r !== 'changed')) return 'provenance';
  }
  const before = itemIds(published);
  const after = itemIds(built);
  return before.length === after.length && before.every((id, i) => id === after[i]) ? 'patch' : 'minor';
}

/**
 * The version for a pack built at `version` in `built`, against the published pack in `published`
 * (built at the same version). No published pack, or the same pack: the same version.
 */
export function avatarPackVersion(published: string, built: string, version: string): string {
  const change = compareAvatarPack(published, built);
  return change === 'patch' || change === 'minor' ? nextVersion(version, change) : version;
}

/** Writes `version` into the manifests of a pack folder (the JSON layout of avatar-pack.ts and avatar-portraits.ts). */
export function stampAvatarPack(dir: string, version: string): void {
  for (const name of ['pack.json', 'catalog.json', 'portraits.json']) {
    const file = join(dir, name);
    if (!existsSync(file)) continue;
    const json = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    json.version = version;
    if (name === 'pack.json') json.root = `packs/avatar/${version}`;
    writeFileSync(file, `${JSON.stringify(json, null, 1)}\n`);
  }
}

/** Rewrites src/apk3d/avatar/pack-version.ts with `version` (its header comment stays). */
export function writeAvatarPackVersion(version: string, root: string = process.cwd()): void {
  const file = join(root, 'src', 'apk3d', 'avatar', 'pack-version.ts');
  const text = readFileSync(file, 'utf8');
  writeFileSync(file, text.replace(/export const AVATAR_PACK_VERSION = '[^']*';/, `export const AVATAR_PACK_VERSION = '${version}';`));
}
