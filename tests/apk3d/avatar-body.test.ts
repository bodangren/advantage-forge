import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { nodeName } from '../../src/apk3d/avatar/compose.js';
import { AVATAR_CLIP_ALIASES, CLASS_ROLES, fromServedVersion, pieceDyes, roleHero } from '../../src/apk3d/avatar/launch.js';
import { AVATAR_PACK_VERSION } from '../../src/apk3d/avatar/pack.js';
import type { VariantTable } from '../../src/apk3d/avatar/tint.js';
import { avatarClassIdSchema, type APKDiagnosticInput, type LaunchAvatar } from '../../src/apk3d/contracts/index.js';
import { Actor } from '../../src/apk3d/stage/actor.js';
import { isAvatarBody, loadAvatarBody, playerBody } from '../../src/apk3d/stage/avatar.js';
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

const equip = (slot: string, hair = 'full') => ({
  forgeEquip: { slot, socket: slot, fitScale: 1, hides: [], hair, displayOnly: [], twoHanded: false, attach: [{ bone: 'head', position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1], half: null }] },
});

const catalog = {
  version: AVATAR_PACK_VERSION,
  base: { file: 'base/avatar-base.glb', clips: ['idle', 'cheer', 'rest'], variants: null },
  items: [
    { id: 'avatar-hair-swept', slot: 'hair', equip: { hides: [], hair: 'full' }, dyes: null, files: { model: 'pieces/avatar-hair-swept.glb', capped: 'pieces/avatar-hair-swept.capped.glb' } },
    { id: 'rogue-hood', slot: 'head', equip: { hides: [], hair: 'capped' }, dyes: hood, files: { model: 'pieces/rogue-hood.glb' } },
  ],
};

/** A loader over an in-memory pack at `packs/avatar/<AVATAR_PACK_VERSION>/`; it records the paths it loads. */
function fakeLoader() {
  const root = `packs/avatar/${AVATAR_PACK_VERSION}/`;
  const files: Record<string, () => GLTF> = {
    [`${root}base/avatar-base.glb`]: () => gltf(baseScene(), {}, ['idle', 'cheer', 'rest']),
    [`${root}pieces/avatar-hair-swept.glb`]: () => gltf(mesh('hair-swept'), equip('hair')),
    [`${root}pieces/avatar-hair-swept.capped.glb`]: () => gltf(mesh('hair-capped'), equip('hair')),
    [`${root}pieces/rogue-hood.glb`]: () => gltf(mesh('hood'), equip('head', 'capped')),
    'models/knight.glb': () => gltf(new THREE.Group(), {}, ['idle']),
  };
  const loaded: string[] = [];
  const cache = new Map<string, GLTF>();
  const loader = {
    avatarRoot: 'packs/avatar',
    json: (path: string) => (path === `${root}catalog.json` ? Promise.resolve(catalog) : Promise.reject(new Error(`${path}: HTTP 404`))),
    load: (path: string) => {
      loaded.push(path);
      const make = files[path];
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

  it('falls back to the fixed hero with a warning, and never throws', async () => {
    const { loader } = fakeLoader();
    const events: APKDiagnosticInput[] = [];
    const fallback = await playerBody(loader, launch({ pieces: [{ itemId: 'no-such-piece', dye: null }] }), 'knight', (e) => events.push(e));
    expect(isAvatarBody(fallback)).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ level: 'warning', code: 'apk3d/avatar-fallback', details: { classId: 'rogue' } });
    expect(String(events[0]!.details!.reason)).toMatch(/no-such-piece/);

    const none = await playerBody(loader, undefined, 'knight', (e) => events.push(e));
    expect(isAvatarBody(none)).toBe(false);
    expect(events).toHaveLength(1);
    expect(isAvatarBody(await playerBody(loader, launch(), 'knight', (e) => events.push(e)))).toBe(true);
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
