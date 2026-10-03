/**
 * Packs the runtime models into APK 3D model packs (docs/apk3d-cartridge.md section 7): each
 * pack of src/apk3d/contracts/model-pack.ts becomes demo/public/packs/<pack>/<version>/ with the GLBs,
 * the hero preset textures, and a `pack.json` that passes `modelPackSchema`.
 *
 *   node --import tsx scripts/demo-models.ts      first: the web-weight GLBs in demo/public/models/
 *   node --import tsx scripts/apk3d-models.ts     then: the packs (fails when a budget is over)
 *   node --import tsx scripts/apk3d-models.ts --report   print the table and the failures, write nothing
 *
 * The output is deterministic: no timestamp, no hash. A file is identified by pack id, version,
 * and path; `provenance.forgeCommit` is the last commit of its source.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { sunkenVaultPlaces } from '../scenes/sunken-vault.js';
import {
  GAME_LOADS,
  MODEL_PACKS,
  MODEL_PACK_VERSION,
  VAULT_PACK,
  assembleModelPack,
  gameBudgetErrors,
  gameLoadFiles,
  modelPackJson,
  modelPackRoot,
  packBudgetErrors,
  type MeasuredModel,
} from '../src/apk3d/contracts/model-pack.js';
import type { ModelPack } from '../src/apk3d/contracts/index.js';

const ROOT = process.cwd();
const MODELS = join(ROOT, 'demo', 'public', 'models');
const PACKS = join(ROOT, 'demo', 'public', 'packs');
const REPORT = process.argv.includes('--report');

function forgeCommit(name: string): string {
  const log = execFileSync('git', ['log', '-1', '--format=%h', '--', `assets/${name}.ts`], { cwd: ROOT, encoding: 'utf8' }).trim();
  return log || execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

async function measure(io: NodeIO, name: string): Promise<MeasuredModel> {
  const file = join(MODELS, `${name}.glb`);
  if (!existsSync(file)) throw new Error(`no runtime model ${file}: run scripts/demo-models.ts first`);
  const doc = await io.read(file);
  const root = doc.getRoot();
  let triangles = 0;
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      triangles += idx ? idx.getCount() / 3 : (prim.getAttribute('POSITION')?.getCount() ?? 0) / 3;
    }
  let textureSize = 0;
  for (const tex of root.listTextures()) {
    const image = tex.getImage();
    if (!image) continue;
    const meta = await sharp(Buffer.from(image)).metadata();
    textureSize = Math.max(textureSize, meta.width ?? 0, meta.height ?? 0);
  }
  const presetDir = join(MODELS, name);
  const presets = existsSync(presetDir) ? readdirSync(presetDir).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -'.webp'.length)).sort() : [];
  return {
    name,
    byteSize: readFileSync(file).length,
    triangles: Math.round(triangles),
    textureSize,
    skinned: root.listSkins().length > 0,
    clips: root.listAnimations().map((a) => a.getName()).sort(),
    presets,
    forgeCommit: forgeCommit(name),
  };
}

async function main(): Promise<void> {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

  // The vault pack takes its pieces from the scene; the other packs name theirs.
  const claimed = new Set(Object.values(MODEL_PACKS).flat());
  const vault = [...new Set(sunkenVaultPlaces().map((p) => p.asset))].filter((a) => !claimed.has(a)).sort();
  const declared: Record<string, readonly string[]> = { ...MODEL_PACKS, [VAULT_PACK]: vault };

  const packs: Record<string, ModelPack> = {};
  for (const [id, names] of Object.entries(declared)) packs[id] = assembleModelPack(id, await Promise.all(names.map((n) => measure(io, n))));

  const errors = [
    ...Object.values(packs).flatMap((p) => packBudgetErrors(p)),
    ...Object.entries(GAME_LOADS).flatMap(([game, load]) => gameBudgetErrors(game, load, packs)),
  ];

  for (const pack of Object.values(packs)) console.log(`pack   ${pack.id.padEnd(18)} ${String(Object.keys(pack.files).length).padStart(3)} files  ${(pack.byteSize / 1024).toFixed(0).padStart(6)} KB`);
  for (const [game, load] of Object.entries(GAME_LOADS)) {
    const { files } = gameLoadFiles(load, packs);
    console.log(`game   ${game.padEnd(18)} ${files.length.toString().padStart(3)} models  ${(files.reduce((sum, f) => sum + f.byteSize, 0) / 1024 / 1024).toFixed(2)} MB`);
  }
  for (const e of errors) console.error(`budget ${e}`);
  if (errors.length) {
    console.error(`${errors.length} budget failure(s)${REPORT ? '' : '; no pack written'}`);
    if (!REPORT) process.exit(1);
  }
  if (REPORT) return;

  rmSync(PACKS, { recursive: true, force: true });
  for (const pack of Object.values(packs)) {
    const dest = join(PACKS, pack.id, MODEL_PACK_VERSION);
    mkdirSync(dest, { recursive: true });
    for (const file of Object.values(pack.files)) {
      copyFileSync(join(MODELS, file.path), join(dest, file.path));
      for (const preset of file.presets) {
        mkdirSync(join(dest, file.id), { recursive: true });
        copyFileSync(join(MODELS, file.id, `${preset}.webp`), join(dest, file.id, `${preset}.webp`));
      }
    }
    writeFileSync(join(dest, 'pack.json'), modelPackJson(pack));
    console.log(`wrote  ${modelPackRoot(pack.id)}/pack.json`);
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
