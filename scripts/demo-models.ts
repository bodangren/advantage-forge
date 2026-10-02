/**
 * Web-weight models for the Monster Encounters demo: the full-quality Forge GLBs in out/ become
 * small runtime GLBs in demo/public/models/ (the "runtime model" output a real game needs).
 *
 *   node --import tsx scripts/demo-models.ts            all demo models
 *   node --import tsx scripts/demo-models.ts knight     one model
 *
 * Per model: drop the color-variant extras (the demo swaps preset textures itself), weld and
 * simplify the meshes toward a triangle budget within a shape-error limit, shrink the textures to
 * 512 px WebP, and compress the geometry with Meshopt. The heroes' preset atlases are exported
 * beside them at the same size (demo/public/models/<hero>/<preset>.webp).
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NodeIO, type Document, type Node } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join as joinMeshes, joinPrimitives, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { sunkenVaultPlaces } from '../scenes/sunken-vault.js';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const DEST = join(ROOT, 'demo', 'public', 'models');

/** Characters in the demo, with a triangle budget each (the whole model, all bodies). */
const CHARACTERS: Record<string, number> = {
  knight: 14000,
  wizard: 14000,
  cleric: 14000,
  adventurer: 14000,
  ranger: 14000,
  paladin: 14000,
  skeleton: 12000,
  'giant-bat': 10000,
  mimic: 10000,
  'dragon-fire': 16000,
  // Potion Rush customers (docs/game-potion-rush-3d.md): smaller on screen than the heroes.
  farmer: 8000,
  villager: 8000,
  innkeeper: 8000,
  guard: 8000,
  druid: 8000,
  'orc-warrior': 8000,
  'goblin-warrior': 8000,
  // Devourer Slime: the slime and the patrolling guards (guard is above).
  slime: 8000,
  bandit: 8000,
  // Hero vs. Zombie.
  zombie: 8000,
};
/** Heroes whose color presets the demo can unlock. */
const HEROES = ['knight', 'wizard', 'cleric', 'adventurer', 'ranger', 'paladin'];
/**
 * Map pieces repeat many times (the vault has about a hundred floor tiles), so they get small
 * budgets and a looser error limit: their surface detail lives in the normal map anyway.
 */
/** The Potion Rush shop: the room and the ingredients that ride the conveyor. */
const SHOP_PROPS = ['counter', 'shelf', 'bottle', 'cauldron', 'fireplace', 'candle-cluster', 'workbench', 'crate', 'barrel', 'sack', 'wood-floor', 'plaster-wall', 'plaster-wall-window', 'plaster-wall-door', 'round-table', 'stool', 'lantern', 'chandelier'];
const INGREDIENTS = ['mushroom', 'apple', 'pumpkin', 'crystal-cluster', 'bread'];
/** Dragon Flight: the land under the flight path (seen from the air, so trees get more triangles). */
const FLIGHT_PROPS = ['grass-ground', 'forest-ground', 'oak-tree', 'pine-tree', 'ancient-oak', 'bush', 'fern', 'wildflowers', 'boulder', 'rock-cluster', 'river-straight', 'cottage', 'barn', 'well', 'fence', 'farm-field', 'hay-bale'];
const TREES = ['oak-tree', 'pine-tree', 'ancient-oak'];
/** Devourer Slime: the clearing's extra pieces. */
const CLEARING_PROPS = ['tree-stump', 'mushroom-cluster'];
/** Hero vs. Zombie: the night churchyard. */
const CHURCHYARD_PROPS = ['dead-tree', 'campfire-out', 'tall-grass', 'dirt-ground'];

function propBudget(name: string): number {
  if (INGREDIENTS.includes(name)) return 600;
  if (TREES.includes(name)) return 2500;
  if (/^(grass-ground|forest-ground|dirt-ground)$/.test(name)) return 300;
  if (/^(floor|floor-cracked|walkway|wood-floor)$/.test(name)) return 300;
  if (/^(wall|wall-corner|arch|door|gate|cell-bars|stairs)$/.test(name)) return 900;
  return 1500;
}
const PROP_ERROR = 0.02;
const CHARACTER_ERROR = 0.008;
const TEXTURE_SIZE = 512;

function triangles(doc: Document): number {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      n += idx ? idx.getCount() / 3 : (prim.getAttribute('POSITION')?.getCount() ?? 0) / 3;
    }
  return Math.round(n);
}

/**
 * One skinned mesh per skeleton: Forge exports each body as its own skinned mesh (23 on the
 * knight), which costs a draw call each. A skinned mesh ignores its node transform (glTF), so
 * bodies bound to the same joint list can share one mesh; join() then merges their primitives.
 */
function mergeSkinned(doc: Document): void {
  const groups = new Map<string, Node[]>();
  for (const node of doc.getRoot().listNodes()) {
    const skin = node.getSkin();
    if (!node.getMesh() || !skin) continue;
    const key = skin.listJoints().map((j) => j.getName()).join('|');
    const list = groups.get(key) ?? [];
    list.push(node);
    groups.set(key, list);
  }
  for (const nodes of groups.values()) {
    const [first, ...rest] = nodes;
    const mesh = first!.getMesh()!;
    for (const node of rest) {
      const other = node.getMesh()!;
      for (const prim of other.listPrimitives()) mesh.addPrimitive(prim);
      node.setMesh(null);
      node.setSkin(null);
      other.dispose();
    }
    // join() skips skinned nodes, so merge this mesh's primitives by material here.
    const byMaterial = new Map<unknown, ReturnType<typeof mesh.listPrimitives>>();
    for (const prim of mesh.listPrimitives()) {
      const list = byMaterial.get(prim.getMaterial()) ?? [];
      list.push(prim);
      byMaterial.set(prim.getMaterial(), list);
    }
    for (const prims of byMaterial.values()) {
      if (prims.length < 2) continue;
      const joined = joinPrimitives(prims);
      for (const prim of prims) {
        mesh.removePrimitive(prim);
        prim.dispose();
      }
      mesh.addPrimitive(joined);
    }
  }
}

async function build(name: string, budget: number, error: number): Promise<void> {
  const src = join(OUT, name, `${name}.glb`);
  if (!existsSync(src)) {
    console.log(`skip   ${name}: no ${src}`);
    return;
  }
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.read(src);
  // The color-variant materials and the tint mask are for engines that recolor in a shader; the
  // demo swaps one preset atlas instead, so they only cost bytes here.
  for (const ext of doc.getRoot().listExtensionsUsed())
    if (ext.extensionName === 'KHR_materials_variants') ext.dispose();
  const before = triangles(doc);
  const ratio = Math.min(1, budget / Math.max(1, before));
  await doc.transform(dedup());
  mergeSkinned(doc);
  await doc.transform(
    flatten(),
    joinMeshes({ keepNamed: false }),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: false }),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEXTURE_SIZE, TEXTURE_SIZE], quality: 82 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  const dest = join(DEST, `${name}.glb`);
  mkdirSync(DEST, { recursive: true });
  writeFileSync(dest, await io.writeBinary(doc));
  const kb = Math.round(statSync(dest).size / 1024);
  const full = Math.round(statSync(src).size / 1024);
  console.log(`model  ${name.padEnd(16)} ${String(before).padStart(6)} -> ${String(triangles(doc)).padStart(6)} tris  ${String(full).padStart(6)} -> ${String(kb).padStart(5)} KB`);
  if (HEROES.includes(name)) {
    const tex = join(OUT, name, 'textures');
    const presets = readdirSync(tex).filter((f) => /^baseColor\.[\w-]+\.png$/.test(f));
    mkdirSync(join(DEST, name), { recursive: true });
    for (const f of presets) {
      const preset = f.slice('baseColor.'.length, -'.png'.length);
      await sharp(join(tex, f)).resize(TEXTURE_SIZE, TEXTURE_SIZE).webp({ quality: 82 }).toFile(join(DEST, name, `${preset}.webp`));
    }
    console.log(`preset ${name}: ${presets.map((f) => f.slice(10, -4)).join(', ')}`);
  }
}

async function main(): Promise<void> {
  const only = process.argv[2];
  const props = [...new Set([...sunkenVaultPlaces().map((p) => p.asset), ...SHOP_PROPS, ...INGREDIENTS, ...FLIGHT_PROPS, ...CLEARING_PROPS, ...CHURCHYARD_PROPS])].filter((a) => !(a in CHARACTERS) && a !== 'adventurer');
  const jobs: [string, number, number][] = [
    ...Object.entries(CHARACTERS).map(([n, b]) => [n, b, CHARACTER_ERROR] as [string, number, number]),
    ...props.map((p) => [p, propBudget(p), PROP_ERROR] as [string, number, number]),
  ];
  for (const [name, budget, error] of jobs) if (!only || only === name) await build(name, budget, error);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
