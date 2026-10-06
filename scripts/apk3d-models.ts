/**
 * Packs the runtime models into APK 3D model packs (docs/apk3d-cartridge.md section 7): each
 * pack of scripts/apk-pack-models.ts becomes demo/public/packs/<pack>/<version>/ with the GLBs,
 * the hero preset textures, and a `pack.json` that passes `modelPackSchema`.
 *
 *   node --import tsx scripts/demo-models.ts      first: the web-weight GLBs in demo/public/models/
 *   node --import tsx scripts/apk3d-models.ts     then: the packs (fails when a budget is over)
 *   node --import tsx scripts/apk3d-models.ts --report   print the table and the failures, write nothing
 *
 * Versions (track apk_pack_release_20261006): a pack whose files or manifest change gets the next
 * patch version, a pack that adds or removes a model the next minor version, and the version
 * table src/apk3d/contracts/pack-versions.ts follows. An unchanged pack keeps its version and its
 * folder. A pack folder holds one version only: the old version folder goes.
 *
 * The output is deterministic: no timestamp, no hash. A file is identified by pack id, version,
 * and path; `provenance.forgeCommit` is the last commit of its source files (the asset and the
 * local files it imports, scripts/apk-pack-models.ts).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import {
  GAME_LOADS,
  PACK_VERSIONS,
  assembleModelPack,
  gameBudgetErrors,
  gameLoadFiles,
  modelPackJson,
  packBudgetErrors,
  packVersion,
  type MeasuredModel,
} from '../src/apk3d/contracts/model-pack.js';
import { modelPackSchema, type ModelPack } from '../src/apk3d/contracts/index.js';
import { nextVersion, packModels, sameRevision, sourceRevision, writePackVersions } from './apk-pack-models.js';

const ROOT = process.cwd();
const MODELS = join(ROOT, 'demo', 'public', 'models');
const PACKS = join(ROOT, 'demo', 'public', 'packs');
const REPORT = process.argv.includes('--report');

/** The files of one pack folder: each model and each hero preset texture. */
function packFiles(pack: ModelPack): string[] {
  return Object.values(pack.files).flatMap((f) => [f.path, ...f.presets.map((p) => `${f.id}/${p}.webp`)]);
}

/** The source file of a pack file: demo/public/models/<path>. */
const sourceOf = (path: string): string => join(MODELS, path);

/**
 * Keeps the current pack's `forgeCommit` text where it names the same commit. Git lengthens its
 * short hashes as the repository grows (7 to 8 characters on 2026-10-06), which otherwise changes
 * every entry and bumps every pack without a content change.
 */
function keepRevisions(next: ModelPack): ModelPack {
  const path = join(PACKS, next.id, packVersion(next.id), 'pack.json');
  if (!existsSync(path)) return next;
  const old = modelPackSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  const kept = structuredClone(next);
  for (const [id, file] of Object.entries(kept.files)) {
    const was = old.files[id]?.provenance.forgeCommit;
    if (was && sameRevision(was, file.provenance.forgeCommit)) file.provenance.forgeCommit = was;
  }
  return kept;
}

/** How a new pack differs from the pack on disk at its current version. */
function change(next: ModelPack): 'none' | 'patch' | 'minor' | 'new' {
  const path = join(PACKS, next.id, packVersion(next.id), 'pack.json');
  if (!existsSync(path)) return 'new';
  const old = modelPackSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  const a = Object.keys(old.files).sort();
  const b = Object.keys(next.files).sort();
  if (a.length !== b.length || a.some((id, i) => id !== b[i])) return 'minor';
  if (modelPackJson(old) !== modelPackJson(next)) return 'patch';
  const dir = join(PACKS, next.id, packVersion(next.id));
  for (const f of packFiles(next)) if (!existsSync(join(dir, f)) || !readFileSync(join(dir, f)).equals(readFileSync(sourceOf(f)))) return 'patch';
  return 'none';
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
    forgeCommit: sourceRevision(name, ROOT),
  };
}

async function main(): Promise<void> {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

  const declared = packModels();
  const packs: Record<string, ModelPack> = {};
  for (const [id, names] of Object.entries(declared)) packs[id] = keepRevisions(assembleModelPack(id, await Promise.all(names.map((n) => measure(io, n)))));

  // Versions: bump each changed pack, keep each unchanged one.
  const versions: Record<string, string> = { ...PACK_VERSIONS };
  const bumps: string[] = [];
  for (const [id, pack] of Object.entries(packs)) {
    const c = change(pack);
    if (c === 'patch' || c === 'minor') {
      versions[id] = nextVersion(packVersion(id), c);
      packs[id] = modelPackSchema.parse({ ...pack, version: versions[id], root: `packs/${id}/${versions[id]}` });
      bumps.push(`${id} ${packVersion(id)} -> ${versions[id]} (${c})`);
    } else versions[id] ??= packVersion(id);
  }
  for (const id of Object.keys(versions)) if (!(id in packs) && id !== 'primary-chibi-2d') delete versions[id];

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
  for (const b of bumps) console.log(`version ${b}`);
  if (REPORT) return;

  // Packs that no declaration names any more leave the folder.
  for (const id of existsSync(PACKS) ? readdirSync(PACKS) : []) if (!(id in packs)) rmSync(join(PACKS, id), { recursive: true, force: true });
  for (const pack of Object.values(packs)) {
    const dest = join(PACKS, pack.id, pack.version);
    for (const v of existsSync(join(PACKS, pack.id)) ? readdirSync(join(PACKS, pack.id)) : []) if (v !== pack.version) rmSync(join(PACKS, pack.id, v), { recursive: true, force: true });
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    for (const f of packFiles(pack)) {
      mkdirSync(join(dest, f, '..'), { recursive: true });
      writeFileSync(join(dest, f), readFileSync(sourceOf(f)));
    }
    writeFileSync(join(dest, 'pack.json'), modelPackJson(pack));
  }
  writePackVersions(versions);
  console.log(`wrote  ${Object.keys(packs).length} packs${bumps.length ? `; ${bumps.length} new version(s)` : '; no version changed'}`);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
