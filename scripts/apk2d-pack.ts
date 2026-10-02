/**
 * Packs the 2D art into one APK sprite pack, `primary-chibi-2d`: the forge sprite sheets and prop
 * frames (scripts/apk2d-sprites.ts) and the baked backgrounds (scripts/apk2d-bake.ts), as the APK
 * `AssetPackManifest` with `PhysicalAssetFile` entries (docs/apk3d-cartridge.md section 15.4).
 * Every game's 2D edition binds the files it needs from this one pack.
 *
 *   node --import tsx scripts/apk2d-pack.ts
 *
 * Writes demo/public/assets/apk/primary-chibi-2d/{pack.json, sprites/, props/, backgrounds/} and,
 * per baked background, src/games/<game>/view2d/projection.gen.ts (the 2D camera of that
 * background: code, so it ports with the game). Sheets are quantized to 256-color PNGs with alpha
 * (old phones have little texture memory); the only hash is the APK file contract's `sha256`.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { assetPackSchema, forgeOrigin, forgeSheetAnimations, forgeSheetGrid, spritePackRoot, type AssetPackManifest, type PhysicalAssetFile } from '../src/apk3d/contracts/index.js';

const ROOT = process.cwd();
const RAW = join(ROOT, 'out', 'apk2d');
export const PACK_ID = 'primary-chibi-2d';
/** The site folder of the pack root (`/assets/apk/<id>/v1`). */
const DEST = join(ROOT, 'demo', 'public', 'assets', 'apk', PACK_ID, 'v1');
const LICENSE = 'AGPL-3.0-or-later';
/** Clips that loop; every other clip plays once. */
const LOOPS = new Set(['idle', 'walk', 'run', 'fly']);

interface Metrics {
  size: number;
  pivot: [number, number];
  directions?: 1 | 4 | 8;
  frames?: number;
}

async function writePng(src: string, dest: string, palette: boolean): Promise<Buffer> {
  const img = sharp(src);
  const out = palette ? await img.png({ palette: true, colors: 256, quality: 92, effort: 8, dither: 0.6 }).toBuffer() : await img.png({ compressionLevel: 9, effort: 8 }).toBuffer();
  mkdirSync(join(dest, '..'), { recursive: true });
  writeFileSync(dest, out);
  return out;
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

const files: Record<string, PhysicalAssetFile> = {};
rmSync(DEST, { recursive: true, force: true });

// ---------------------------------------------------------------- characters and props
const spritesDir = join(RAW, 'sprites');
for (const model of existsSync(spritesDir) ? readdirSync(spritesDir).sort() : []) {
  const dir = join(spritesDir, model);
  const source = `advantage-forge/assets/${model}.ts`;
  // A prop: one still frame (dirs 1, no clip).
  if (existsSync(join(dir, 'S.png'))) {
    const m = JSON.parse(readFileSync(join(dir, 'metrics.json'), 'utf8')) as Metrics;
    const path = `props/${model}.png`;
    const data = await writePng(join(dir, 'S.png'), join(DEST, path), true);
    const meta = await sharp(data).metadata();
    files[`prop.${model}`] = fileEntry(`prop.${model}`, path, data, meta.width!, meta.height!, source, { grid: forgeSheetGrid(m.size, 1, 1), origin: forgeOrigin(m.pivot, m.size) });
    continue;
  }
  for (const clip of readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory()).sort()) {
    const m = JSON.parse(readFileSync(join(dir, clip, 'metrics.json'), 'utf8')) as Metrics;
    const directions = m.directions ?? 8;
    const frames = m.frames ?? 6;
    const path = `sprites/${model}/${clip}.png`;
    const data = await writePng(join(dir, clip, 'sheet.png'), join(DEST, path), true);
    const id = `${model}.${clip}`;
    files[id] = fileEntry(id, path, data, m.size * frames, m.size * directions, source, {
      grid: forgeSheetGrid(m.size, directions, frames),
      animations: forgeSheetAnimations(clip, directions, frames, LOOPS.has(clip) ? 10 : 12, LOOPS.has(clip)),
      origin: forgeOrigin(m.pivot, m.size),
    });
  }
}

// ---------------------------------------------------------------- backgrounds
const bgDir = join(RAW, 'backgrounds');
const families: Record<string, Record<string, Record<string, number>>> = {};
for (const game of existsSync(bgDir) ? readdirSync(bgDir).sort() : []) {
  const projection = JSON.parse(readFileSync(join(bgDir, game, 'background.json'), 'utf8')) as Record<string, number>;
  const path = `backgrounds/${game}.png`;
  const data = await writePng(join(bgDir, game, 'background.png'), join(DEST, path), true);
  const id = `background.${game}`;
  files[id] = fileEntry(id, path, data, projection.width!, projection.height!, `advantage-forge/src/games/${game}/view (the 3D set, baked)`, { kind: 'image', view: 'world', alpha: false });
  // A game with several backgrounds (`labyrinth-1`, `labyrinth-2`, ...) keeps its cameras in one map.
  const family = /^(.+)-\d+$/.exec(game)?.[1];
  if (family && existsSync(join(ROOT, 'src', 'games', family)) && !existsSync(join(ROOT, 'src', 'games', game))) {
    (families[family] ??= {})[game] = projection;
    continue;
  }
  const gen = join(ROOT, 'src', 'games', game, 'view2d');
  mkdirSync(gen, { recursive: true });
  writeFileSync(
    join(gen, 'projection.gen.ts'),
    `/** Generated by scripts/apk2d-pack.ts: the 2D camera of the baked background (${path}). */\nimport type { Projection2D } from '../../../apk3d/view2d/projection.js';\n\nexport const BACKGROUND_FILE = '${id}';\nexport const PROJECTION: Projection2D = ${JSON.stringify(projection)};\n`,
  );
}
for (const [game, byId] of Object.entries(families)) {
  const gen = join(ROOT, 'src', 'games', game, 'view2d');
  mkdirSync(gen, { recursive: true });
  const rows = Object.entries(byId).map(([id, p]) => `  '${id}': ${JSON.stringify(p)},`).join('\n');
  writeFileSync(
    join(gen, 'projections.gen.ts'),
    `/** Generated by scripts/apk2d-pack.ts: the 2D camera of each baked background of ${game} (backgrounds/<id>.png). */\nimport type { Projection2D } from '../../../apk3d/view2d/projection.js';\n\nexport const PROJECTIONS: Readonly<Record<string, Projection2D>> = {\n${rows}\n};\n`,
  );
}

const pack: AssetPackManifest = assetPackSchema.parse({ id: PACK_ID, version: '1.0.0', root: spritePackRoot(PACK_ID), files });
writeFileSync(join(DEST, 'pack.json'), `${JSON.stringify(pack, null, 1)}\n`);
const bytes = Object.values(files).reduce((sum, f) => sum + f.byteSize, 0);
console.log(`pack   ${PACK_ID}: ${Object.keys(files).length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
