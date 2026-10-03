/** Model pack assembly and budget checks (src/apk3d/contracts/model-pack.ts). */
import { describe, expect, it } from 'vitest';
import { MODEL_BUDGET, modelPackSchema } from '../../src/apk3d/contracts/index.js';
import { assembleModelPack, fileBudgetErrors, gameBudgetErrors, gameLoadFiles, modelFileEntry, modelPackJson, modelPackRoot, packBudgetErrors, type MeasuredModel } from '../../src/apk3d/contracts/model-pack.js';

const model = (name: string, extra: Partial<MeasuredModel> = {}): MeasuredModel => ({
  name,
  byteSize: 100_000,
  triangles: 4_000,
  textureSize: 512,
  skinned: false,
  clips: [],
  presets: [],
  forgeCommit: 'abc1234',
  ...extra,
});

describe('assembleModelPack', () => {
  it('builds a pack that passes the schema, with the byte sum and a versioned root', () => {
    const pack = assembleModelPack('props', [model('b'), model('a', { byteSize: 50_000 })]);
    expect(modelPackSchema.safeParse(pack).success).toBe(true);
    expect(pack.byteSize).toBe(150_000);
    expect(pack.root).toBe(modelPackRoot('props'));
    expect(Object.keys(pack.files)).toEqual(['a', 'b']);
  });

  it('gives the same bytes for the same models in any order', () => {
    const a = modelPackJson(assembleModelPack('props', [model('a'), model('b')]));
    const b = modelPackJson(assembleModelPack('props', [model('b'), model('a')]));
    expect(a).toBe(b);
    expect(a).not.toMatch(/sha|hash|date|time/i);
  });

  it('rejects a model listed twice and a bad pack id', () => {
    expect(() => assembleModelPack('props', [model('a'), model('a')])).toThrow(/twice/);
    expect(() => assembleModelPack('Bad Id', [model('a')])).toThrow();
  });

  it('rejects an invalid commit in a file entry', () => {
    expect(() => modelFileEntry(model('a', { forgeCommit: 'not-a-sha' }))).toThrow();
  });
});

describe('budgets', () => {
  it('passes a set piece and a character inside the limits', () => {
    expect(fileBudgetErrors(modelFileEntry(model('a')))).toEqual([]);
    expect(fileBudgetErrors(modelFileEntry(model('hero', { skinned: true, byteSize: 500_000, triangles: 14_000 })))).toEqual([]);
  });

  it('names each exceeded limit', () => {
    const piece = fileBudgetErrors(modelFileEntry(model('big', { byteSize: MODEL_BUDGET.setPiece.bytes + 1 })));
    expect(piece).toHaveLength(1);
    expect(piece[0]).toMatch(/big: .*set piece limit/);
    const hero = fileBudgetErrors(modelFileEntry(model('h', { skinned: true, byteSize: 700_000, triangles: 20_000, textureSize: 1024 })));
    expect(hero).toHaveLength(3);
  });

  it('uses the lite limits for the lite edition', () => {
    const file = modelFileEntry(model('h', { skinned: true, triangles: 10_000, textureSize: 512 }));
    expect(fileBudgetErrors(file, 'standard')).toEqual([]);
    expect(fileBudgetErrors(file, 'lite')).toHaveLength(2);
  });

  it('prefixes the pack id on pack errors', () => {
    const pack = assembleModelPack('p', [model('big', { byteSize: 300_000 })]);
    expect(packBudgetErrors(pack)[0]).toMatch(/^p\/big:/);
  });
});

describe('game loads', () => {
  const packs = {
    heroes: assembleModelPack('heroes', [model('knight', { skinned: true, byteSize: 400_000 }), model('wizard', { skinned: true, byteSize: 500_000 })]),
    props: assembleModelPack('props', [model('a'), model('b'), model('c')]),
  };

  it('counts whole packs, named models, and the largest hero once', () => {
    const { files, missing } = gameLoadFiles({ packs: ['props'], models: ['a'], hero: true }, packs);
    expect(missing).toEqual([]);
    expect(files.reduce((s, f) => s + f.byteSize, 0)).toBe(300_000 + 500_000);
  });

  it('reports a missing pack, model, or hero pack', () => {
    expect(gameBudgetErrors('g', { models: ['zzz'] }, packs)[0]).toMatch(/unknown model zzz/);
    expect(gameBudgetErrors('g', { packs: ['nope'] }, packs)[0]).toMatch(/unknown pack nope/);
    expect(gameBudgetErrors('g', { hero: true }, {})[0]).toMatch(/unknown pack heroes/);
  });

  it('fails a game whose models pass the total limit', () => {
    const big = { props: assembleModelPack('props', Array.from({ length: 7 }, (_, i) => model(`m${i}`, { byteSize: 900_000 }))) };
    expect(gameBudgetErrors('g', { packs: ['props'] }, big)[0]).toMatch(/g: models total 6300000/);
    expect(gameBudgetErrors('g', {}, big)).toEqual([]);
  });
});
