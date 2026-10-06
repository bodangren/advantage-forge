/**
 * The one model list of the APK packs, and the helpers that the pack scripts share
 * (track apk_pack_release_20261006).
 *
 * - `packModels()`: every pack and its models. `MODEL_PACKS` names the models; the vault pack takes
 *   the pieces of the vault scene that no other pack claims. The 3D runtime models
 *   (`demo-models.ts`), the 3D packs (`apk3d-models.ts`), the 2D sprites (`apk2d-sprites.ts`), and
 *   the 2D pack (`apk2d-pack.ts`) all read this list, so the 2D pack matches the 3D packs.
 * - `sourceRevision(name)`: the last commit of an asset source and of every local file it imports
 *   under `assets/` (kind factories, part modules). A pack records it as `provenance.forgeCommit`;
 *   `apk-release.ts` rebuilds a model when the two differ.
 * - `nextVersion` and `writePackVersions`: the version table `src/apk3d/contracts/pack-versions.ts`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { sunkenVaultPlaces } from '../scenes/sunken-vault.js';
import { MODEL_PACKS, VAULT_PACK } from '../src/apk3d/contracts/model-pack.js';

/** Every pack and its models, in claim order: a model listed twice stays in the first pack. */
export function packModels(): Record<string, string[]> {
  const claimed = new Set(Object.values(MODEL_PACKS).flat());
  const vault = [...new Set(sunkenVaultPlaces().map((p) => p.asset))].filter((a) => !claimed.has(a)).sort();
  const named = Object.fromEntries(Object.entries(MODEL_PACKS).map(([id, names]) => [id, [...new Set(names)]]));
  return { ...named, [VAULT_PACK]: vault };
}

/** Every model of every pack, sorted. */
export function allPackModels(): string[] {
  return [...new Set(Object.values(packModels()).flat())].sort();
}

/** The heroes: their color presets go into both the 3D and the 2D pack. */
export const HERO_MODELS: readonly string[] = MODEL_PACKS.heroes ?? [];

/** The source files of one asset: its file and every local file it imports under `assets/`. */
export function sourceFiles(name: string, root: string = process.cwd()): string[] {
  const seen = new Set<string>();
  const visit = (rel: string): void => {
    if (seen.has(rel) || !existsSync(join(root, rel))) return;
    seen.add(rel);
    const text = readFileSync(join(root, rel), 'utf8');
    for (const m of text.matchAll(/from\s+'(\.{1,2}\/[^']+)\.js'/g)) {
      const next = normalize(join(dirname(rel), `${m[1]}.ts`));
      if (next.startsWith('assets/')) visit(next);
    }
  };
  visit(`assets/${name}.ts`);
  return [...seen].sort();
}

/** The last commit (short hash) of the source files of one asset, or HEAD when git has none. */
export function sourceRevision(name: string, root: string = process.cwd()): string {
  const files = sourceFiles(name, root);
  const git = (args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  return (files.length ? git(['log', '-1', '--format=%h', '--', ...files]) : '') || git(['rev-parse', '--short', 'HEAD']);
}

/** Two short hashes name the same commit when one starts with the other. */
export function sameRevision(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && (a.startsWith(b) || b.startsWith(a));
}

/** The next version: a patch for changed content, a minor for an added or removed model. */
export function nextVersion(version: string, change: 'patch' | 'minor'): string {
  const [major, minor, patch] = version.split('.').map(Number) as [number, number, number];
  return change === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}

const VERSIONS_FILE = join('src', 'apk3d', 'contracts', 'pack-versions.ts');

/** Rewrites the version table (sorted keys) and keeps its header comment. */
export function writePackVersions(versions: Readonly<Record<string, string>>, root: string = process.cwd()): void {
  const path = join(root, VERSIONS_FILE);
  const text = readFileSync(path, 'utf8');
  const head = text.slice(0, text.indexOf('export const PACK_VERSIONS'));
  const key = (k: string): string => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
  const rows = Object.keys(versions)
    .sort()
    .map((k) => `  ${key(k)}: '${versions[k]}',`)
    .join('\n');
  const next = `${head}export const PACK_VERSIONS: Readonly<Record<string, string>> = {\n${rows}\n};\n`;
  if (next !== text) writeFileSync(path, next);
}
