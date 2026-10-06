/**
 * The 2D sprite pack matches the 3D model packs one to one (track apk_pack_release_20261006):
 * every model of a 3D pack has 2D files, a skinned model has a sheet for every clip of its GLB,
 * and a hero has a sheet for every clip of every 3D color preset.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assetPackSchema, modelPackSchema, spritePackRoot, type ModelPack } from '../../src/apk3d/contracts/index.js';
import { SPRITE_PACK_ID, packVersion, spriteSheetId, spriteStillId } from '../../src/apk3d/contracts/model-pack.js';

const PUBLIC = join(process.cwd(), 'demo', 'public');
const PACKS = join(PUBLIC, 'packs');
const ids = existsSync(PACKS) ? readdirSync(PACKS).sort() : [];
const packs: ModelPack[] = ids.map((id) => modelPackSchema.parse(JSON.parse(readFileSync(join(PACKS, id, packVersion(id), 'pack.json'), 'utf8'))));
const sprites = assetPackSchema.parse(JSON.parse(readFileSync(join(PUBLIC, spritePackRoot(SPRITE_PACK_ID).slice(1), 'pack.json'), 'utf8')));
const models = packs.flatMap((p) => Object.values(p.files).map((f) => ({ pack: p.id, file: f })));

/** The 2D files that one 3D model needs. */
function expected(file: ModelPack['files'][string]): string[] {
  if (!file.skinned || !file.clips.length) return [spriteStillId(file.id)];
  return [undefined, ...file.presets].flatMap((preset) => file.clips.map((clip) => spriteSheetId(file.id, clip, preset)));
}

describe('2D sprite pack parity with the 3D packs', () => {
  it('has the version of the version table', () => {
    expect(sprites.version).toBe(packVersion(SPRITE_PACK_ID));
  });

  it.each(models.map((m) => [`${m.pack}/${m.file.id}`, m.file] as const))('%s: has every 2D file', (_, file) => {
    const missing = expected(file).filter((id) => !sprites.files[id]);
    expect(missing).toEqual([]);
  });

  it('has no model file without a 3D model', () => {
    const wanted = new Set(models.flatMap((m) => expected(m.file)));
    const extra = Object.keys(sprites.files).filter((id) => !id.startsWith('background.') && !wanted.has(id));
    expect(extra).toEqual([]);
  });

  it('stores every file at its recorded size', () => {
    const root = join(PUBLIC, spritePackRoot(SPRITE_PACK_ID).slice(1));
    const wrong = Object.values(sprites.files).filter((f) => !existsSync(join(root, f.path)) || statSync(join(root, f.path)).size !== f.byteSize);
    expect(wrong.map((f) => f.id)).toEqual([]);
  });
});
