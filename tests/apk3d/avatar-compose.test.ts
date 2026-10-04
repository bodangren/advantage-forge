import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  avatarModelOf,
  composeAvatar,
  hairFormOf,
  loadoutErrors,
  nodeName,
  positiveHalf,
  tintScales,
  type AvatarModel,
  type AvatarPiece,
  type EquipRecord,
  type VariantTable,
} from '../../src/apk3d/avatar/compose.js';

const table: VariantTable = {
  slots: {
    skin: { channel: 'R', default: 'fair', options: { fair: [0.8, 0.5, 0.4], deep: [0.1, 0.05, 0.02] } },
    hair: { channel: 'G', default: 'brown', options: { brown: [0.1, 0.03, 0.01], blond: [0.5, 0.3, 0.06] } },
  },
  presets: { night: { skin: 'deep' } },
  mask: 'tintMask',
};

const mesh = (name: string, triangles: { x: number }[] = [{ x: 0.1 }]) => {
  const pos: number[] = [];
  for (const t of triangles) pos.push(t.x, 0, 0, t.x, 0.01, 0, t.x, 0, 0.01);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([...Array(pos.length / 3).keys()]);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: new THREE.Texture() }));
  m.name = nodeName(name);
  return m;
};

/** A base with a head bone and a left hand bone, a skin body, and the base hair. */
function base(): AvatarModel {
  const scene = new THREE.Group();
  const hips = new THREE.Bone();
  hips.name = 'hips';
  const head = new THREE.Bone();
  head.name = nodeName('head');
  head.position.set(0, 0.48, -0.01);
  const hand = new THREE.Bone();
  hand.name = nodeName('hand.L');
  hips.add(head, hand);
  scene.add(hips, mesh('skin'), mesh('hair'));
  return { scene, animations: [new THREE.AnimationClip('idle', 1, [])], variants: table, equip: null, tintMask: new THREE.Texture() };
}

const equip = (e: Partial<EquipRecord> & Pick<EquipRecord, 'slot'>): EquipRecord => ({
  socket: e.slot,
  fitScale: 1,
  hides: [],
  hair: 'full',
  displayOnly: [],
  twoHanded: false,
  attach: [{ bone: 'head', position: [0, 0.01, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1], half: null }],
  ...e,
});

const piece = (id: string, e: Partial<EquipRecord> & Pick<EquipRecord, 'slot'>, bodies: THREE.Mesh[] = [mesh(id)], extra: Partial<AvatarPiece> = {}): AvatarPiece => {
  const scene = new THREE.Group();
  scene.add(...bodies);
  return { id, model: { scene, animations: [], variants: null, equip: equip(e), tintMask: null }, ...extra };
};

const hairStyle = (): AvatarPiece => {
  const form = (x: number): AvatarModel => {
    const scene = new THREE.Group();
    scene.add(mesh('hair', [{ x }]));
    return { scene, animations: [], variants: null, equip: equip({ slot: 'hair', hides: ['hair'], hair: 'hidden' }), tintMask: null };
  };
  return piece('avatar-hair-long', { slot: 'hair', hides: ['hair'], hair: 'hidden' }, [mesh('hair', [{ x: 0.2 }, { x: 0.3 }])], { capped: form(0.05), tucked: form(0.07) });
};

/** The base's own hair body (a worn hair style has a body of the same name under its bone). */
const baseHair = (model: THREE.Object3D) => model.children.find((c) => c.name === 'hair') as THREE.Mesh;

const meshesUnder = (root: THREE.Object3D, holder: string) => {
  const h = root.getObjectByName(holder);
  const out: THREE.Mesh[] = [];
  h?.traverse((o) => o instanceof THREE.Mesh && out.push(o));
  return out;
};

describe('avatar composer', () => {
  it('loads the tint mask from its named image (a GLB has no texture entry for it)', async () => {
    const loaded: number[] = [];
    const model = await avatarModelOf({
      scene: new THREE.Group(),
      animations: [],
      parser: {
        json: { extras: { forgeVariants: table }, images: [{ name: 'baseColor' }, { name: 'tintMask' }] },
        textureLoader: null,
        loadImageSource: async (index) => {
          loaded.push(index);
          return new THREE.Texture();
        },
      },
    });
    expect(loaded).toEqual([1]);
    expect(model.tintMask!.flipY).toBe(false);
    expect(model.tintMask!.colorSpace).toBe(THREE.NoColorSpace);
    expect(model.variants).toBe(table);
  });

  it('turns a tint choice into channel multipliers (option / default)', () => {
    const s = tintScales(table, { hair: 'blond' });
    expect(s[0]).toEqual([1, 1, 1]);
    expect(s[1]![0]).toBeCloseTo(5, 6);
    expect(tintScales(table, 'night')[0]![0]).toBeCloseTo(0.125, 6);
    expect(() => tintScales(table, 'day')).toThrow(/no tint preset/);
    expect(() => tintScales(table, { eyes: 'blue' })).toThrow(/no color slot/);
    expect(() => tintScales(table, { hair: 'green' })).toThrow(/no option/);
  });

  it('finds loadout errors and the hair form', () => {
    const helm = piece('knight-helm', { slot: 'head', hair: 'capped' });
    const hood = piece('rogue-hood', { slot: 'head', hair: 'hidden' });
    expect(loadoutErrors([helm, hood])).toEqual(["rogue-hood: slot 'head' already holds knight-helm"]);
    const pike = piece('pike', { slot: 'mainhand', twoHanded: true });
    expect(loadoutErrors([pike, piece('buckler', { slot: 'offhand' })])[0]).toMatch(/two-handed/);
    expect(hairFormOf([])).toBe('full');
    expect(hairFormOf([helm])).toBe('capped');
    expect(hairFormOf([hood])).toBe('hidden');
    expect(hairFormOf([piece('circlet', { slot: 'head', hair: 'full' })])).toBe('full');
    expect(hairFormOf([piece('knight-helm', { slot: 'head', hair: 'tucked' })])).toBe('tucked');
  });

  it('keeps the +X half of a pair', () => {
    const g = mesh('boot', [{ x: 0.1 }, { x: -0.1 }, { x: 0.2 }]).geometry;
    expect(positiveHalf(g).getIndex()!.count).toBe(6);
  });

  it('dresses the base: pieces on their bones, display bodies dropped, hidden base bodies', () => {
    const shirt = piece('tunic', { slot: 'chest', hides: ['undershirt'], attach: [{ bone: 'hand.L', position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [0.5, 0.5, 0.5], half: null }] }, [mesh('tunic'), mesh('stand')]);
    const tunic = { ...shirt, model: { ...shirt.model, equip: { ...shirt.model.equip!, displayOnly: ['stand'] } } };
    const avatar = composeAvatar(base(), { pieces: [tunic], tints: 'night' });
    const held = meshesUnder(avatar.model, 'tunic@hand.L');
    expect(held.map((m) => m.name)).toEqual(['tunic']);
    expect(avatar.model.getObjectByName('tunic@hand.L')!.parent!.name).toBe(nodeName('hand.L'));
    expect(avatar.model.getObjectByName('tunic@hand.L')!.scale.x).toBe(0.5);
    expect(avatar.actions.has('idle')).toBe(true);
    // The base keeps its own hair (no style), and the tint shader is set on the base materials.
    expect(baseHair(avatar.model).visible).toBe(true);
    expect(avatar.materials.some((m) => m.userData.tint)).toBe(true);
  });

  it('wears the hair style full, capped, tucked, or not at all, as the head piece says', () => {
    const style = hairStyle();
    const full = composeAvatar(base(), { pieces: [style] });
    expect(full.hair).toBe('full');
    expect(baseHair(full.model).visible).toBe(false);
    expect(meshesUnder(full.model, 'avatar-hair-long@head')[0]!.geometry.getIndex()!.count).toBe(6);

    const capped = composeAvatar(base(), { pieces: [style, piece('knight-helm', { slot: 'head', hair: 'capped' })] });
    expect(capped.hair).toBe('capped');
    expect(meshesUnder(capped.model, 'avatar-hair-long@head')[0]!.geometry.getIndex()!.count).toBe(3);

    const tucked = composeAvatar(base(), { pieces: [style, piece('knight-helm', { slot: 'head', hair: 'tucked' })] });
    expect(tucked.hair).toBe('tucked');
    expect(meshesUnder(tucked.model, 'avatar-hair-long@head')[0]!.geometry.getAttribute('position').getX(0)).toBeCloseTo(0.07, 6);

    const hood = composeAvatar(base(), { pieces: [style, piece('iron-helmet', { slot: 'head', hides: ['hair'], hair: 'hidden' })] });
    expect(hood.model.getObjectByName('avatar-hair-long@head')).toBeUndefined();

    // No style chosen: the default style stands in for the base hair under a capping piece.
    const fallback = composeAvatar(base(), { pieces: [piece('knight-helm', { slot: 'head', hair: 'capped' })], defaultHair: style });
    expect(baseHair(fallback.model).visible).toBe(false);
    expect(meshesUnder(fallback.model, 'avatar-hair-long@head')).toHaveLength(1);
  });

  it('gives the hair style the base hair color, also from a preset', () => {
    const plain = hairStyle();
    const style = { ...plain, model: { ...plain.model, variants: table, tintMask: new THREE.Texture() } };
    const scaleOf = (avatar: ReturnType<typeof composeAvatar>) =>
      (meshesUnder(avatar.model, 'avatar-hair-long@head')[0]!.material as THREE.Material).userData.tint.tintScale.value[1].x as number;
    expect(scaleOf(composeAvatar(base(), { pieces: [style], tints: { hair: 'blond' } }))).toBeCloseTo(5, 6);
    expect(scaleOf(composeAvatar(base(), { pieces: [style], tints: 'night' }))).toBe(1);
  });
});
