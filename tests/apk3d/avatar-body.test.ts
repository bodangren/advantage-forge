import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { nodeName } from '../../src/apk3d/avatar/compose.js';
import { AVATAR_CLIP_ALIASES, CLASS_ROLES, fromServedVersion, pieceDyes, roleHero, shownHero } from '../../src/apk3d/avatar/launch.js';
import { AVATAR_PACK_VERSION } from '../../src/apk3d/avatar/pack.js';
import type { VariantTable } from '../../src/apk3d/avatar/tint.js';
import { avatarClassIdSchema, type APKDiagnosticInput, type LaunchAvatar } from '../../src/apk3d/contracts/index.js';
import { Actor } from '../../src/apk3d/stage/actor.js';
import { isAvatarBody, loadAvatarBody, playerBody, type AvatarBody } from '../../src/apk3d/stage/avatar.js';
import type { GLTF, ModelLoader } from '../../src/apk3d/stage/loader.js';
import { Timeline } from '../../src/apk3d/stage/timeline.js';

const hood: VariantTable = {
  slots: { cloth: { channel: 'R', default: 'teal', options: { teal: [0.03, 0.12, 0.11], crimson: [0.19, 0.02, 0.03] } } },
  presets: {},
  mask: null,
};

describe('the launch avatar rules', () => {
  it('dyes a piece as the monorepo shop does', () => {
    expect(pieceDyes(hood, 'crimson')).toEqual({ cloth: 'crimson' });
    expect(pieceDyes(hood, null)).toEqual({ cloth: 'teal' });
    // A dye that a slot does not have keeps that slot's first option.
    expect(pieceDyes(hood, 'gold')).toEqual({ cloth: 'teal' });
    expect(pieceDyes(null, 'crimson')).toEqual({});
  });

  it('reads the current pack when the launch version is not served, and fails when that fails too', async () => {
    const served = (v: string) => (v === AVATAR_PACK_VERSION ? Promise.resolve(`files of ${v}`) : Promise.reject(new Error(`${v}: HTTP 404`)));
    await expect(fromServedVersion(AVATAR_PACK_VERSION, served)).resolves.toEqual({ value: `files of ${AVATAR_PACK_VERSION}`, version: AVATAR_PACK_VERSION });
    await expect(fromServedVersion('0.9.0', served)).resolves.toEqual({ value: `files of ${AVATAR_PACK_VERSION}`, version: AVATAR_PACK_VERSION });
    await expect(fromServedVersion(AVATAR_PACK_VERSION, () => Promise.reject(new Error('offline')))).rejects.toThrow('offline');
  });

  it('picks the hero of the avatar role for the clips and effects of a 2D view', () => {
    const heroes = ['knight', 'wizard', 'cleric'];
    const avatar = { catalogVersion: AVATAR_PACK_VERSION, classId: 'shaman', tints: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'moss' }, pieces: [] } as LaunchAvatar;
    expect(shownHero(heroes, { hero: 'knight', avatar }, 'knight')).toBe('wizard');
    expect(shownHero(heroes, { hero: 'cleric' }, 'knight')).toBe('cleric');
    expect(shownHero(heroes, { hero: 'rogue' }, 'wizard')).toBe('wizard');
    expect(shownHero(['knight'], { hero: 'knight', avatar }, 'knight')).toBe('knight');
  });

  it('gives every class a role and a hero place', () => {
    expect(Object.keys(CLASS_ROLES).sort()).toEqual([...avatarClassIdSchema.options].sort());
    expect(roleHero('knight')).toBe('knight');
    expect(roleHero('witch')).toBe('wizard');
    expect(roleHero('bard')).toBe('cleric');
    expect(roleHero('treasure-hunter')).toBe('knight');
  });
});

const mesh = (name: string) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0.1, 0, 0, 0.1, 0.01, 0, 0.1, 0, 0.01], 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial());
  m.name = nodeName(name);
  return m;
};

/** A loaded GLB as GLTFLoader returns it, with Forge extras and no tint mask image. */
const gltf = (scene: THREE.Object3D, extras: Record<string, unknown>, clips: string[] = []): GLTF =>
  ({ scene, animations: clips.map((c) => new THREE.AnimationClip(c, 1, [])), parser: { json: { extras }, textureLoader: null, loadImageSource: () => Promise.reject(new Error('no image')) } }) as unknown as GLTF;

function baseScene(): THREE.Object3D {
  const scene = new THREE.Group();
  const hips = new THREE.Bone();
  hips.name = 'hips';
  const head = new THREE.Bone();
  head.name = nodeName('head');
  hips.add(head);
  scene.add(hips, mesh('skin'), mesh('hair'));
  return scene;
}

const equip = (slot: string, hair = 'full', bone = 'head') => ({
  forgeEquip: { slot, socket: slot, fitScale: 1, hides: [], hair, displayOnly: [], twoHanded: false, attach: [{ bone, position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1], half: null }] },
});

const catalog = {
  version: AVATAR_PACK_VERSION,
  base: { file: 'base/avatar-base.glb', clips: ['idle', 'cheer', 'rest'], variants: null },
  items: [
    { id: 'avatar-hair-swept', slot: 'hair', equip: { hides: [], hair: 'full' }, dyes: null, files: { model: 'pieces/avatar-hair-swept.glb', capped: 'pieces/avatar-hair-swept.capped.glb' } },
    { id: 'rogue-hood', slot: 'head', equip: { hides: [], hair: 'capped' }, dyes: hood, files: { model: 'pieces/rogue-hood.glb' } },
    { id: 'knight-helm', slot: 'head', equip: { hides: [], hair: 'capped' }, dyes: null, files: { model: 'pieces/knight-helm.glb' } },
    { id: 'tail-charm', slot: 'back', equip: { hides: [], hair: 'full' }, dyes: null, files: { model: 'pieces/tail-charm.glb' } },
    { id: 'lost-cape', slot: 'back', equip: { hides: [], hair: 'full' }, dyes: null, files: { model: 'pieces/lost-cape.glb' } },
  ],
};

/**
 * A loader over an in-memory pack at `packs/avatar/<AVATAR_PACK_VERSION>/`; it records the paths it
 * loads. `missing` lists pack files that answer HTTP 404. The tail charm rides a bone the base does
 * not have; the lost cape has no file.
 */
function fakeLoader(missing: readonly string[] = []) {
  const root = `packs/avatar/${AVATAR_PACK_VERSION}/`;
  const files: Record<string, () => GLTF> = {
    [`${root}base/avatar-base.glb`]: () => gltf(baseScene(), {}, ['idle', 'cheer', 'rest']),
    [`${root}pieces/avatar-hair-swept.glb`]: () => gltf(mesh('hair-swept'), equip('hair')),
    [`${root}pieces/avatar-hair-swept.capped.glb`]: () => gltf(mesh('hair-capped'), equip('hair')),
    [`${root}pieces/rogue-hood.glb`]: () => gltf(mesh('hood'), equip('head', 'capped')),
    [`${root}pieces/knight-helm.glb`]: () => gltf(mesh('helm'), equip('head', 'capped')),
    [`${root}pieces/tail-charm.glb`]: () => gltf(mesh('charm'), equip('back', 'full', 'tail')),
    'models/knight.glb': () => gltf(new THREE.Group(), {}, ['idle']),
  };
  const loaded: string[] = [];
  const cache = new Map<string, GLTF>();
  const loader = {
    avatarRoot: 'packs/avatar',
    json: (path: string) => (path === `${root}catalog.json` ? Promise.resolve(catalog) : Promise.reject(new Error(`${path}: HTTP 404`))),
    load: (path: string) => {
      loaded.push(path);
      const make = missing.some((m) => path.endsWith(m)) ? undefined : files[path];
      if (!make) return Promise.reject(new Error(`${path}: HTTP 404`));
      if (!cache.has(path)) cache.set(path, make());
      return Promise.resolve(cache.get(path)!);
    },
    modelPath: (name: string) => `models/${name}.glb`,
  };
  return { loader: loader as unknown as ModelLoader, loaded };
}

const launch = (over: Partial<LaunchAvatar> = {}): LaunchAvatar => ({
  catalogVersion: AVATAR_PACK_VERSION,
  classId: 'rogue',
  tints: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'moss' },
  pieces: [{ itemId: 'rogue-hood', dye: 'crimson' }],
  ...over,
});

describe('the avatar body', () => {
  it('loads the pack files once and composes a new avatar for each actor', async () => {
    const { loader, loaded } = fakeLoader();
    const body = await loadAvatarBody(loader, launch());
    expect(body.version).toBe(AVATAR_PACK_VERSION);
    expect(body.aliases).toEqual(AVATAR_CLIP_ALIASES);
    expect(new Set(loaded).size).toBe(4);
    const a = body.compose();
    const b = body.compose();
    expect(a.root).not.toBe(b.root);
    // The hood caps the hair: the capped style is worn, the base hair is hidden.
    expect(a.hair).toBe('capped');
    expect(a.root.getObjectByName(nodeName('hood'))).toBeTruthy();
    expect(a.root.getObjectByName(nodeName('hair-capped'))).toBeTruthy();
  });

  it('uses the current pack when the launch version is not served', async () => {
    const { loader } = fakeLoader();
    const body = await loadAvatarBody(loader, launch({ catalogVersion: '9.9.9' }));
    expect(body.version).toBe(AVATAR_PACK_VERSION);
  });

  it('leaves off a piece that does not load or fit, and keeps the rest of the student', async () => {
    const { loader } = fakeLoader();
    const events: APKDiagnosticInput[] = [];
    const avatar = launch({
      pieces: [
        { itemId: 'rogue-hood', dye: 'crimson' },
        { itemId: 'no-such-piece', dye: null },
        { itemId: 'knight-helm', dye: null },
        { itemId: 'tail-charm', dye: null },
        { itemId: 'lost-cape', dye: null },
      ],
    });
    const body = (await playerBody(loader, avatar, 'knight', (e) => events.push(e))) as AvatarBody;
    expect(isAvatarBody(body)).toBe(true);
    expect(body.neutral).toBe(false);
    expect(body.dropped.map((d) => d.itemId).sort()).toEqual(['knight-helm', 'lost-cape', 'no-such-piece', 'tail-charm']);
    expect(body.dropped.find((d) => d.itemId === 'knight-helm')!.reason).toMatch(/slot 'head' already holds rogue-hood/);
    expect(body.dropped.find((d) => d.itemId === 'tail-charm')!.reason).toMatch(/no bone 'tail'/);
    const a = body.compose();
    expect(a.root.getObjectByName(nodeName('hood'))).toBeTruthy();
    expect(a.root.getObjectByName(nodeName('helm'))).toBeFalsy();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ level: 'warning', code: 'apk3d/avatar-partial', details: { classId: 'rogue' } });
    expect(String(events[0]!.details!.dropped)).toMatch(/no-such-piece/);
  });

  it('keeps the base hair when the default hair style does not load', async () => {
    const { loader } = fakeLoader(['pieces/avatar-hair-swept.glb']);
    const body = await loadAvatarBody(loader, launch({ pieces: [] }));
    expect(body.dropped).toEqual([]);
    const a = body.compose();
    expect(a.root.getObjectByName(nodeName('hair'))!.visible).toBe(true);
  });

  it('shows a neutral figure, never a hero, when the avatar pack does not load', async () => {
    for (const missing of [['base/avatar-base.glb'], ['catalog.json']]) {
      const { loader } = fakeLoader(missing);
      if (missing[0] === 'catalog.json') (loader as unknown as { json: () => Promise<never> }).json = () => Promise.reject(new Error('HTTP 404'));
      const events: APKDiagnosticInput[] = [];
      const body = (await playerBody(loader, launch(), 'knight', (e) => events.push(e))) as AvatarBody;
      expect(isAvatarBody(body)).toBe(true);
      expect(body.neutral).toBe(true);
      expect(body.avatar.classId).toBe('rogue');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ level: 'warning', code: 'apk3d/avatar-fallback', details: { classId: 'rogue' } });
      // The figure plays every hero clip name the games use.
      const actor = new Actor('rogue', body, new Timeline());
      for (const clip of ['idle', 'walk', 'run', 'attack', 'attack2', 'hit', 'victory', 'death']) expect(actor.has(clip)).toBe(true);
      expect(actor.materials).toHaveLength(1);
      expect(body.height).toBeGreaterThan(0.9);
    }
  });

  it('shows the fixed hero only when the session has no avatar', async () => {
    const { loader, loaded } = fakeLoader();
    const events: APKDiagnosticInput[] = [];
    const none = await playerBody(loader, undefined, 'knight', (e) => events.push(e));
    expect(isAvatarBody(none)).toBe(false);
    expect(loaded).toEqual(['models/knight.glb']);
    expect(events).toEqual([]);
    expect(isAvatarBody(await playerBody(loader, launch(), 'knight', (e) => events.push(e)))).toBe(true);
    expect(events).toEqual([]);
  });

  it('makes an actor that plays the hero clip names and keeps the composer materials', async () => {
    const { loader } = fakeLoader();
    const body = await loadAvatarBody(loader, launch());
    const actor = new Actor('rogue', body, new Timeline());
    expect(actor.actions.get('victory')).toBe(actor.actions.get('cheer'));
    expect(actor.actions.get('death')).toBe(actor.actions.get('rest'));
    expect(actor.has('attack')).toBe(false);
    // The base skin, the hood, and the capped hair; the hidden base hair keeps its copy too.
    expect(actor.materials.length).toBeGreaterThanOrEqual(3);
    const second = new Actor('rogue', body, new Timeline());
    expect(second.materials.some((m) => actor.materials.includes(m))).toBe(false);
    // A hero GLB still works, and an own clip wins over an alias.
    const hero = new Actor('knight', gltf(new THREE.Group(), {}, ['idle', 'victory', 'cheer']), new Timeline(), { aliases: AVATAR_CLIP_ALIASES });
    expect(hero.actions.get('victory')).not.toBe(hero.actions.get('cheer'));
  });
});
