/**
 * The avatar pack (docs/avatar-system.md, section 7): out/packs/avatar/<version>/ with
 *
 *   pack.json             the model pack manifest (modelPackSchema) of every GLB below
 *   catalog.json          every `ready` row of docs/avatar-catalog.tsv with its price, the resolved
 *                         equip block (`forgeEquip`, with `hair`), its dye slots, and its files
 *   base/avatar-base.glb  the base: skin, clips, the tint mask, and the slot table
 *   pieces/<id>.glb       a piece; a hair style also has pieces/<id>.capped.glb and <id>.tucked.glb
 *
 * Every GLB comes from the reduced output pass of its source (`./forge build <id> --reduced`, and
 * `--capped --reduced` and `--tucked --reduced` for the hair styles), never from an edited copy.
 * The pack drops the preset atlases (the composer recolors through the tint mask), joins the bodies
 * of a piece into one mesh (`joinPiece`), stores the textures as WebP (the tint mask stays PNG: see
 * `pack`), and compresses the geometry with Meshopt, which the kit loader decodes.
 *
 *   node --import tsx scripts/avatar-pack.ts --build     build the missing reduced inputs first
 *   node --import tsx scripts/avatar-pack.ts --rebuild   build every reduced input first
 *   node --import tsx scripts/avatar-pack.ts             assemble (fails on a missing input or a budget)
 *   node --import tsx scripts/avatar-pack.ts --report    print the table and the failures; write nothing
 *
 * Builds run through ./forge, two at a time: the launcher's build slots hold the machine limit.
 * The output is deterministic: no timestamp, no hash.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NodeIO, type Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, join as joinMeshes, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { AVATAR_PACK_VERSION, avatarPackPath } from '../src/apk3d/avatar/pack.js';
import { MODEL_LICENSE, modelAssetFileSchema, modelPackSchema, type ModelAssetFile } from '../src/apk3d/contracts/model-asset.js';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const DEST = join(OUT, avatarPackPath());
const BASE = 'avatar-base';
const TOOL = 'scripts/avatar-pack.ts';
/** Section 7 budgets: the base under 2 MB, a piece under 400 KB. */
const BUDGET = { base: 2 * 1024 * 1024, piece: 400 * 1024 } as const;
const REPORT = process.argv.includes('--report');
const BUILD = process.argv.includes('--build') || process.argv.includes('--rebuild');
const REBUILD = process.argv.includes('--rebuild');

interface Row {
  id: string;
  slot: string;
  tier: number;
  twoHanded: boolean;
  price: number;
  rating: number | null;
}

/** The `ready` rows of the catalog. */
function readyRows(): Row[] {
  const [header, ...lines] = readFileSync(join(ROOT, 'docs', 'avatar-catalog.tsv'), 'utf8').trim().split('\n');
  const cols = header!.split('\t');
  const at = (c: string[], name: string) => c[cols.indexOf(name)] ?? '';
  return lines
    .map((l) => l.split('\t'))
    .filter((c) => at(c, 'status') === 'ready')
    .map((c) => ({
      id: at(c, 'id'),
      slot: at(c, 'slot'),
      tier: Number(at(c, 'tier')),
      twoHanded: at(c, 'two_handed') === '1',
      price: Number(at(c, 'price')),
      rating: at(c, 'rating') ? Number(at(c, 'rating')) : null,
    }));
}

/** One GLB of the pack: its reduced input, the flags that build it, and its pack path. */
interface Job {
  id: string;
  file: string;
  input: string;
  flags: readonly string[];
}

/** The forms of a hair style under head pieces (`forgeEquip.hair`), each its own GLB. */
const HAIR_FORMS = ['capped', 'tucked'] as const;

function jobsOf(rows: readonly Row[]): Job[] {
  const job = (id: string, file: string, form: (typeof HAIR_FORMS)[number] | null): Job => ({
    id,
    file,
    input: join(OUT, `${id}${form ? `+${form}` : ''}+reduced`, `${id}.glb`),
    flags: form ? [`--${form}`, '--reduced'] : ['--reduced'],
  });
  return [
    job(BASE, `base/${BASE}.glb`, null),
    ...rows.flatMap((r) => [job(r.id, `pieces/${r.id}.glb`, null), ...(r.slot === 'hair' ? HAIR_FORMS.map((f) => job(r.id, `pieces/${r.id}.${f}.glb`, f)) : [])]),
  ];
}

/** Build the reduced inputs through ./forge, two at a time. */
async function buildInputs(jobs: readonly Job[]): Promise<void> {
  const todo = jobs.filter((j) => REBUILD || !existsSync(j.input));
  console.log(`build  ${todo.length} reduced input(s)`);
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < todo.length) {
      const j = todo[next++]!;
      const code = await new Promise<number>((resolve) => {
        const child = spawn(join(ROOT, 'forge'), ['build', j.id, ...j.flags], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
        let text = '';
        child.stdout.on('data', (d: Buffer) => (text += d.toString()));
        child.stderr.on('data', (d: Buffer) => (text += d.toString()));
        child.on('close', (c) => {
          const warnings = text.split('\n').filter((l) => /warning|error/i.test(l));
          console.log(`${c === 0 ? 'built ' : 'FAILED'} ${j.id} ${j.flags.join(' ')}${warnings.length ? `\n       ${warnings.join('\n       ')}` : ''}`);
          resolve(c ?? 1);
        });
      });
      if (code !== 0) failed++;
    }
  };
  await Promise.all([worker(), worker()]);
  if (failed > 0) throw new Error(`${failed} reduced build(s) failed`);
}

/** Drop the preset atlases and their materials: the composer recolors through the tint mask. */
function dropPresetAtlases(doc: Document): void {
  const root = doc.getRoot();
  for (const ext of root.listExtensionsUsed()) if (ext.extensionName === 'KHR_materials_variants') ext.dispose();
  const used = new Set(root.listMeshes().flatMap((m) => m.listPrimitives().map((p) => p.getMaterial())));
  for (const mat of root.listMaterials()) if (!used.has(mat)) mat.dispose();
  for (const tex of root.listTextures()) if (tex.getName().startsWith('baseColor:')) tex.dispose();
}

/**
 * A piece without a skin: drop its display-only bodies (the composer never shows them) and join the
 * bodies that share a material, so the piece draws in one call (the first pack drew 35 calls for
 * each avatar). The base keeps its bodies: the composer hides the hair, undershirt, and shoes by name.
 */
async function joinPiece(doc: Document): Promise<void> {
  const root = doc.getRoot();
  if (root.listSkins().length > 0) return;
  const equip = root.getExtras().forgeEquip as { displayOnly?: string[] } | undefined;
  const display = new Set(equip?.displayOnly ?? []);
  for (const node of root.listNodes()) if (display.has(node.getName())) node.dispose();
  // The join also prunes the meshes and accessors left without a node. A full prune would also
  // remove the tint mask, which no material uses.
  await doc.transform(joinMeshes({ keepNamed: false }));
}

interface Packed {
  job: Job;
  bytes: Uint8Array;
  triangles: number;
  textureSize: number;
  skinned: boolean;
  /** The tint mask that the slot table names, when it is missing from the GLB. */
  lostMask: string | null;
  clips: string[];
  extras: Record<string, unknown>;
}

/** The tint mask name of the slot table when the GLB holds no image of that name. */
function lostMask(doc: Document): string | null {
  const mask = (doc.getRoot().getExtras().forgeVariants as { mask?: string | null } | undefined)?.mask;
  return mask && !doc.getRoot().listTextures().some((t) => t.getName() === mask) ? mask : null;
}

async function pack(io: NodeIO, job: Job): Promise<Packed> {
  const doc = await io.read(job.input);
  dropPresetAtlases(doc);
  await doc.transform(dedup());
  if (job.id !== BASE) await joinPiece(doc);
  await doc.transform(
    textureCompress({ encoder: sharp, targetFormat: 'webp', pattern: /^(baseColor|normal|occlusionRoughnessMetallic)$/, quality: 82 }),
    // The tint mask stays the forge PNG: lossless WebP sets the color of every texel with zero alpha
    // to black (libwebp without `exact`), and the mask keeps three slots there (R, G, B).
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  const root = doc.getRoot();
  let triangles = 0;
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives()) triangles += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION')?.getCount() ?? 0) / 3;
  let textureSize = 0;
  for (const tex of root.listTextures()) {
    const size = tex.getSize();
    if (size) textureSize = Math.max(textureSize, size[0], size[1]);
  }
  return {
    job,
    bytes: await io.writeBinary(doc),
    triangles: Math.round(triangles),
    textureSize,
    skinned: root.listSkins().length > 0,
    lostMask: lostMask(doc),
    clips: root.listAnimations().map((a) => a.getName()).sort(),
    extras: (root.getExtras() ?? {}) as Record<string, unknown>,
  };
}

function forgeCommit(id: string): string {
  const log = execFileSync('git', ['log', '-1', '--format=%h', '--', `assets/${id}.ts`], { cwd: ROOT, encoding: 'utf8' }).trim();
  return log || execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

function fileEntry(p: Packed): ModelAssetFile {
  const stem = p.job.file.replace(/^(base|pieces)\//, '').replace(/\.glb$/, '');
  return modelAssetFileSchema.parse({
    id: stem,
    path: p.job.file,
    kind: 'model',
    format: 'glb',
    byteSize: p.bytes.byteLength,
    triangles: p.triangles,
    textureSize: p.textureSize,
    skinned: p.skinned,
    clips: p.clips,
    presets: [],
    provenance: { source: `advantage-forge/assets/${p.job.id}.ts`, license: MODEL_LICENSE, forgeCommit: forgeCommit(p.job.id), tool: TOOL },
  });
}

async function main(): Promise<void> {
  const rows = readyRows();
  const jobs = jobsOf(rows);
  if (BUILD) await buildInputs(jobs);
  const missing = jobs.filter((j) => !existsSync(j.input));
  if (missing.length > 0) {
    for (const j of missing) console.error(`missing ${j.input} (./forge build ${j.id} ${j.flags.join(' ')}, or --build)`);
    throw new Error(`${missing.length} reduced input(s) missing`);
  }

  await MeshoptEncoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const packed: Packed[] = [];
  for (const job of jobs) packed.push(await pack(io, job));

  const errors: string[] = [];
  for (const p of packed) {
    const limit = p.job.id === BASE ? BUDGET.base : BUDGET.piece;
    if (p.bytes.byteLength > limit) errors.push(`${p.job.file}: ${Math.round(p.bytes.byteLength / 1024)} KB exceeds ${limit / 1024} KB`);
    if (p.job.id !== BASE && !p.extras.forgeEquip) errors.push(`${p.job.file}: no forgeEquip extras (rebuild the reduced input)`);
    if (p.lostMask) errors.push(`${p.job.file}: the slot table names the tint mask '${p.lostMask}', but the GLB has no such image`);
  }

  const files: Record<string, ModelAssetFile> = {};
  for (const p of [...packed].sort((a, b) => (a.job.file < b.job.file ? -1 : 1))) {
    const entry = fileEntry(p);
    files[entry.id] = entry;
  }
  const byteSize = Object.values(files).reduce((s, f) => s + f.byteSize, 0);
  const manifest = modelPackSchema.parse({ id: 'avatar', version: AVATAR_PACK_VERSION, root: avatarPackPath(), files, byteSize });

  const of = (file: string) => packed.find((p) => p.job.file === file)!;
  const base = of(`base/${BASE}.glb`);
  const catalog = {
    version: AVATAR_PACK_VERSION,
    base: { file: base.job.file, variants: base.extras.forgeVariants ?? null, clips: base.clips },
    items: rows.map((r) => {
      const model = of(`pieces/${r.id}.glb`);
      const forms = r.slot === 'hair' ? Object.fromEntries(HAIR_FORMS.map((f) => [f, `pieces/${r.id}.${f}.glb`])) : {};
      return {
        id: r.id,
        slot: r.slot,
        tier: r.tier,
        twoHanded: r.twoHanded,
        price: r.price,
        rating: r.rating,
        equip: model.extras.forgeEquip ?? null,
        dyes: model.extras.forgeVariants ?? null,
        files: { model: model.job.file, ...forms },
      };
    }),
  };

  const kb = (n: number) => `${Math.round(n / 1024)} KB`.padStart(7);
  for (const p of packed) console.log(`pack   ${p.job.file.padEnd(46)} ${String(p.triangles).padStart(6)} tris ${kb(p.bytes.byteLength)}`);
  console.log(`total  ${packed.length} GLBs, ${(byteSize / 1024 / 1024).toFixed(2)} MB; ${rows.length} catalog items`);
  for (const e of errors) console.error(`budget ${e}`);
  if (errors.length > 0) {
    console.error(`${errors.length} failure(s)${REPORT ? '' : '; no pack written'}`);
    if (!REPORT) process.exit(1);
  }
  if (REPORT) return;

  rmSync(DEST, { recursive: true, force: true });
  for (const p of packed) {
    mkdirSync(join(DEST, p.job.file, '..'), { recursive: true });
    writeFileSync(join(DEST, p.job.file), p.bytes);
  }
  writeFileSync(join(DEST, 'pack.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  writeFileSync(join(DEST, 'catalog.json'), `${JSON.stringify(catalog, null, 1)}\n`);
  console.log(`wrote  ${DEST}`);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
