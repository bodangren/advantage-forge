import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { buildAsset, type AssetContext, type AssetDefinition, type BuildResult } from './asset.js';
import { toGlb } from './gltf.js';

function findRoot(start: string): string {
  let dir = start;
  while (!existsSync(join(dir, 'assets')) || !existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
  return dir;
}

export const ROOT = findRoot(import.meta.dirname);
export const ASSET_DIR = join(ROOT, 'assets');
export const OUT_DIR = join(ROOT, 'out');

export function listAssets(): string[] {
  if (!existsSync(ASSET_DIR)) return [];
  return readdirSync(ASSET_DIR)
    .filter((f) => f.endsWith('.ts') && !f.startsWith('_'))
    .map((f) => basename(f, '.ts'))
    .sort();
}

/**
 * An asset name is one file name: not empty, not an absolute path, no path separator, and no
 * dot-dot segment. A name that walks out of assets/ would read and write outside the repository,
 * so it is refused before any path is built from it.
 */
export function checkAssetName(name: string): void {
  if (name.trim() === '') throw new Error('An asset name is required.');
  if (isAbsolute(name))
    throw new Error(`Invalid asset name '${name}': an asset name is not an absolute path.`);
  if (name.includes('/') || name.includes('\\'))
    throw new Error(`Invalid asset name '${name}': an asset name has no path separator.`);
  // A name with no separator is one segment, so the dot-dot segment is the name itself.
  if (name === '.' || name === '..')
    throw new Error(`Invalid asset name '${name}': an asset name has no dot-dot segment.`);
}

export function assetPath(name: string): string {
  checkAssetName(name);
  const file = join(ASSET_DIR, `${name}.ts`);
  if (!existsSync(file)) {
    const known = listAssets();
    throw new Error(`No asset '${name}' in assets/. Known assets: ${known.join(', ') || '(none)'}.`);
  }
  return file;
}

export function checkDefinition(mod: unknown, name: string): AssetDefinition {
  const def = (mod as { default?: AssetDefinition }).default;
  if (!def || typeof def.build !== 'function')
    throw new Error(`assets/${name}.ts must \`export default defineAsset({ ... })\`.`);
  return def;
}

export async function buildToGlb(
  def: AssetDefinition,
  source?: string,
  textureSize?: number,
  wear?: readonly { readonly name: string; readonly source: string }[],
  worn?: NonNullable<AssetContext['worn']>,
  errorScale?: number,
): Promise<{ result: BuildResult; glb: Uint8Array }> {
  const result = await buildAsset(def, {
    ...(source ? { source } : {}),
    ...(textureSize !== undefined ? { textureSize } : {}),
    ...(wear && wear.length > 0 ? { wear } : {}),
    ...(worn ? { worn } : {}),
    ...(errorScale ? { errorScale } : {}),
  });
  const glb = await toGlb(result.root);
  return { result, glb };
}

export type BuildStats = BuildResult['stats'];
