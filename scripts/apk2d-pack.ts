/**
 * Packs the 2D art into one APK sprite pack, `primary-chibi-2d`: the forge sprite sheets and stills
 * (scripts/apk2d-sprites.ts) and the baked backgrounds (scripts/apk2d-bake.ts), as the APK
 * `AssetPackManifest` with `PhysicalAssetFile` entries (docs/apk3d-cartridge.md section 15.4).
 * Every game's 2D edition binds the files it needs from this one pack. The pack matches the 3D
 * packs one to one (track apk_pack_release_20261006; tests/apk3d/sprite-parity.test.ts).
 *
 *   node --import tsx scripts/apk2d-pack.ts            write the pack
 *   node --import tsx scripts/apk2d-pack.ts --check    report the change, write nothing
 *
 * Merge rule: a model with a render in out/apk2d/sprites/<model>/ gets its files from that render;
 * a model without one keeps its files from the current pack; a model that no 3D pack holds any
 * more leaves the pack. Backgrounds follow the same rule (out/apk2d/backgrounds/<game>/). So a
 * release renders only the models that changed.
 *
 * File ids: `prop.<model>` (a still), `<model>.<clip>` (a clip sheet), `<model>@<preset>.<clip>` (a
 * hero color preset), `background.<game>`. A changed pack gets the next patch version and a pack
 * with added or removed files the next minor version (src/apk3d/contracts/pack-versions.ts); an
 * unchanged pack is not written.
 *
 * Writes demo/public/assets/apk/primary-chibi-2d/v1/{pack.json, sprites/, props/, backgrounds/} and,
 * per rendered background, src/games/<game>/view2d/projection.gen.ts (the 2D camera of that
 * background: code, so it ports with the game). Sheets are quantized to 256-color PNGs with alpha
 * (old phones have little texture memory); the only hash is the APK file contract's `sha256`.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PACK_VERSIONS, SPRITE_PACK_ID, assetPackSchema, forgeOrigin, forgeSheetAnimations, forgeSheetGrid, packVersion, spritePackRoot, spriteSheetId, spriteStillId, type PhysicalAssetFile } from '../src/apk3d/contracts/index.js';
import { allPackModels, nextVersion, writePackVersions } from './apk-pack-models.js';

const ROOT = process.cwd();
const RAW = join(ROOT, 'out', 'apk2d');
export const PACK_ID = SPRITE_PACK_ID;
/** The site folder of the pack root (`/assets/apk/<id>/v1`). */
const DEST = join(ROOT, 'demo', 'public', 'assets', 'apk', PACK_ID, 'v1');
const LICENSE = 'AGPL-3.0-or-later';
/** Clips that loop; every other clip plays once. */
const LOOPS = new Set(['idle', 'walk', 'run', 'fly']);
const CHECK = process.argv.includes('--check');

interface Metrics {
  size: number;
  pivot: [number, number];
  directions?: 1 | 4 | 8;
  frames?: number;
}

/** One file of the new pack: its manifest entry and its bytes. */
interface Built {
  entry: PhysicalAssetFile;
  data: Buffer;
}

async function png(src: string): Promise<Buffer> {
  return sharp(src).png({ palette: true, colors: 256, quality: 92, effort: 8, dither: 0.6 }).toBuffer();
}

function fileEntry(id: string, path: string, data: Buffer, width: number, height: number, source: string, extra: Partial<PhysicalAssetFile>): PhysicalAssetFile {
  return {
    id,
    path,
    kind: 'spritesheet',
    view: 'isometric',
    width,
    height,
    format: 'png',
    alpha: true,
    byteSize: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
    provenance: { source, license: LICENSE },
    ...extra,
  } as PhysicalAssetFile;
}

const files = new Map<string, Built>();

// ---------------------------------------------------------------- the current pack
const current = existsSync(join(DEST, 'pack.json')) ? assetPackSchema.parse(JSON.parse(readFileSync(join(DEST, 'pack.json'), 'utf8'))) : undefined;
const kept = (match: (id: string) => boolean): void => {
  for (const entry of Object.values(current?.files ?? {})) if (match(entry.id)) files.set(entry.id, { entry: entry as PhysicalAssetFile, data: readFileSync(join(DEST, entry.path)) });
};
const ofModel = (model: string) => (id: string): boolean => id === spriteStillId(model) || id.startsWith(`${model}.`) || id.startsWith(`${model}@`);

// ---------------------------------------------------------------- models
/** The clip sheets of one look (the default look, or a color preset) from a render folder. */
async function sheets(model: string, dir: string, preset?: string): Promise<void> {
  const source = `advantage-forge/assets/${model}.ts`;
  for (const clip of readdirSync(dir).filter((f) => f !== 'presets' && statSync(join(dir, f)).isDirectory()).sort()) {
    const m = JSON.parse(readFileSync(join(dir, clip, 'metrics.json'), 'utf8')) as Metrics;
    const directions = m.directions ?? 8;
    const frames = m.frames ?? 6;
    const path = preset ? `sprites/${model}/presets/${preset}/${clip}.png` : `sprites/${model}/${clip}.png`;
    const data = await png(join(dir, clip, 'sheet.png'));
    const id = spriteSheetId(model, clip, preset);
    files.set(id, {
      data,
      entry: fileEntry(id, path, data, m.size * frames, m.size * directions, source, {
        grid: forgeSheetGrid(m.size, directions, frames),
        animations: forgeSheetAnimations(clip, directions, frames, LOOPS.has(clip) ? 10 : 12, LOOPS.has(clip)),
        origin: forgeOrigin(m.pivot, m.size),
      }),
    });
  }
}

const rendered: string[] = [];
for (const model of allPackModels()) {
  const dir = join(RAW, 'sprites', model);
  if (!existsSync(dir)) {
    kept(ofModel(model));
    continue;
  }
  rendered.push(model);
  if (existsSync(join(dir, 'S.png'))) {
    const m = JSON.parse(readFileSync(join(dir, 'metrics.json'), 'utf8')) as Metrics;
    const data = await png(join(dir, 'S.png'));
    const meta = await sharp(data).metadata();
    const id = spriteStillId(model);
    files.set(id, { data, entry: fileEntry(id, `props/${model}.png`, data, meta.width!, meta.height!, `advantage-forge/assets/${model}.ts`, { grid: forgeSheetGrid(m.size, 1, 1), origin: forgeOrigin(m.pivot, m.size) }) });
    continue;
  }
  await sheets(model, dir);
  const presets = join(dir, 'presets');
  for (const preset of existsSync(presets) ? readdirSync(presets).sort() : []) await sheets(model, join(presets, preset), preset);
}

// ---------------------------------------------------------------- backgrounds
const bgDir = join(RAW, 'backgrounds');
const baked = existsSync(bgDir) ? readdirSync(bgDir).sort() : [];
kept((id) => id.startsWith('background.') && !baked.includes(id.slice('background.'.length)));
const families: Record<string, Record<string, Record<string, number>>> = {};
for (const game of baked) {
  const projection = JSON.parse(readFileSync(join(bgDir, game, 'background.json'), 'utf8')) as Record<string, number>;
  const path = `backgrounds/${game}.png`;
  const data = await png(join(bgDir, game, 'background.png'));
  const id = `background.${game}`;
  files.set(id, { data, entry: fileEntry(id, path, data, projection.width!, projection.height!, `advantage-forge/src/games/${game}/view (the 3D set, baked)`, { kind: 'image', view: 'world', alpha: false }) });
  // A game with several backgrounds (`labyrinth-1`, `labyrinth-2`, ...) keeps its cameras in one map.
  const family = /^(.+)-\d+$/.exec(game)?.[1];
  if (family && existsSync(join(ROOT, 'src', 'games', family)) && !existsSync(join(ROOT, 'src', 'games', game))) {
    (families[family] ??= {})[game] = projection;
    continue;
  }
  if (CHECK) continue;
  const gen = join(ROOT, 'src', 'games', game, 'view2d');
  mkdirSync(gen, { recursive: true });
  writeFileSync(
    join(gen, 'projection.gen.ts'),
    `/** Generated by scripts/apk2d-pack.ts: the 2D camera of the baked background (${path}). */\nimport type { Projection2D } from '../../../apk3d/view2d/projection.js';\n\nexport const BACKGROUND_FILE = '${id}';\nexport const PROJECTION: Projection2D = ${JSON.stringify(projection)};\n`,
  );
}
for (const [game, byId] of Object.entries(CHECK ? {} : families)) {
  const gen = join(ROOT, 'src', 'games', game, 'view2d');
  mkdirSync(gen, { recursive: true });
  const rows = Object.entries(byId).map(([id, p]) => `  '${id}': ${JSON.stringify(p)},`).join('\n');
  writeFileSync(
    join(gen, 'projections.gen.ts'),
    `/** Generated by scripts/apk2d-pack.ts: the 2D camera of each baked background of ${game} (backgrounds/<id>.png). */\nimport type { Projection2D } from '../../../apk3d/view2d/projection.js';\n\nexport const PROJECTIONS: Readonly<Record<string, Projection2D>> = {\n${rows}\n};\n`,
  );
}

// ---------------------------------------------------------------- version and output
const ids = [...files.keys()].sort();
const entries = Object.fromEntries(ids.map((id) => [id, files.get(id)!.entry]));
const before = current ? Object.keys(current.files).sort() : [];
const sameIds = before.length === ids.length && before.every((id, i) => id === ids[i]);
// Compare parsed entries: the schema fixes the key order of both sides.
const parsed = assetPackSchema.parse({ id: PACK_ID, version: current?.version ?? packVersion(PACK_ID), root: spritePackRoot(PACK_ID), files: entries }).files;
const sameFiles = sameIds && ids.every((id) => JSON.stringify(current!.files[id]) === JSON.stringify(parsed[id]));
const version = !current ? packVersion(PACK_ID) : sameFiles ? current.version : nextVersion(current.version, sameIds ? 'patch' : 'minor');

const bytes = Object.values(entries).reduce((sum, f) => sum + f.byteSize, 0);
console.log(`render ${rendered.length ? rendered.join(' ') : '(none)'}`);
if (current && sameFiles && version === packVersion(PACK_ID)) {
  console.log(`pack   ${PACK_ID}: unchanged at ${version} (${ids.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB)`);
} else if (CHECK) {
  const added = ids.filter((id) => !current?.files[id]).length;
  const removed = before.filter((id) => !files.has(id)).length;
  const changed = ids.filter((id) => current?.files[id] && JSON.stringify(current.files[id]) !== JSON.stringify(parsed[id]));
  console.log(`pack   ${PACK_ID}: would go ${current?.version ?? '(new)'} -> ${version}: +${added} -${removed} files, ${changed.length} changed${changed.length ? ` (${changed.slice(0, 12).join(' ')}${changed.length > 12 ? ' ...' : ''})` : ''}`);
} else {
  const pack = assetPackSchema.parse({ id: PACK_ID, version, root: spritePackRoot(PACK_ID), files: entries });
  rmSync(DEST, { recursive: true, force: true });
  for (const { entry, data } of files.values()) {
    mkdirSync(join(DEST, entry.path, '..'), { recursive: true });
    writeFileSync(join(DEST, entry.path), data);
  }
  writeFileSync(join(DEST, 'pack.json'), `${JSON.stringify(pack, null, 1)}\n`);
  writePackVersions({ ...PACK_VERSIONS, [PACK_ID]: version });
  const added = ids.filter((id) => !current?.files[id]).length;
  const removed = before.filter((id) => !files.has(id)).length;
  console.log(`pack   ${PACK_ID}: ${current?.version ?? '(new)'} -> ${version}, ${ids.length} files (+${added} -${removed}), ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}
