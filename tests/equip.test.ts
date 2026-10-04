import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import avatarBase from '../assets/avatar-base.js';
import { AVATAR_HAIR_STYLES, avatarHair } from '../assets/parts/avatar-hair.js';
import { buildAsset, collectBodies, defineAsset } from '../src/asset.js';
import { BASE_JOINTS, HAND_FIT, SOCKETS, capsHair, hairOf, jointOf, resolveEquip, validateEquip, wearAsset, wornMatrices, type EquipDeclaration } from '../src/equip.js';
import { checkEquip } from '../src/equip-check.js';
import { toGlb } from '../src/gltf.js';
import { sdf } from '../src/index.js';

/** A cap that rests on y = 0 with its head center 0.2 m up, one tint slot, and a display stand. */
const cap = defineAsset({
  name: 'test-cap',
  detail: 0.01,
  texture: false,
  variants: { trim: { red: '#c03030', blue: '#3050c0' } },
  equip: { slot: 'head', origin: [0, 0.2, 0], hides: ['hair'], displayOnly: ['stand'] },
  build(k) {
    k.body('cap', sdf.ellipsoid([0.23, 0.22, 0.21]).at(0, 0.2, 0).subtract(sdf.ellipsoid([0.215, 0.21, 0.2]).at(0, 0.2, 0)).intersect(sdf.box([1, 0.3, 1]).at(0, 0.35, 0)), {
      color: k.tint('trim'),
    });
    k.body('stand', sdf.cylinder(0.05, 0.1).at(0, 0.05, 0));
  },
});

/** Apply a resolved attach (bone-local TRS) to an asset point, then move it to the bone's rest joint. */
const attached = (a: ReturnType<typeof resolveEquip>['attach'][number], p: readonly [number, number, number]) =>
  new THREE.Vector3(...p)
    .applyMatrix4(
      new THREE.Matrix4().compose(new THREE.Vector3(...a.position), new THREE.Quaternion(...a.quaternion), new THREE.Vector3(...a.scale)),
    )
    .add(new THREE.Vector3(...jointOf(a.bone)));

describe('equipment declaration', () => {
  it('uses the joint positions of the avatar base skeleton', async () => {
    const { skeleton } = await collectBodies(avatarBase);
    for (const [bone, at] of Object.entries(BASE_JOINTS)) expect(skeleton![bone]!.at, bone).toEqual(at);
    expect(skeleton!['knife.R']!.at).toEqual(jointOf('knife.R'));
    for (const socket of Object.values(SOCKETS)) expect(skeleton![socket.bone], socket.bone).toBeDefined();
  });

  it('rejects declarations outside the fit contract', () => {
    const bodies = ['helm'];
    const bad: [EquipDeclaration, RegExp][] = [
      [{ slot: 'head', fitScale: 2 }, /fitScale 2 is not in the fit contract/],
      [{ slot: 'chest', hides: ['hair'] }, /cannot hide 'hair'/],
      [{ slot: 'offhand', twoHanded: true }, /only a mainhand piece is two-handed/],
      [{ slot: 'mainhand', hold: 'shield' }, /a shield is held in the offhand/],
      [{ slot: 'head', hold: 'grip' }, /only for mainhand and offhand/],
      [{ slot: 'head', displayOnly: ['stand'] }, /not a body/],
      [{ slot: 'head', displayOnly: ['helm'] }, /every body is displayOnly/],
      [{ slot: 'hat' as 'head' }, /unknown slot 'hat'/],
    ];
    for (const [eq, error] of bad) expect(() => validateEquip(eq, bodies)).toThrow(error);
    expect(() => validateEquip({ slot: 'mainhand', fitScale: HAND_FIT, twoHanded: true }, bodies)).not.toThrow();
    expect(() => validateEquip({ slot: 'chest', fitScale: 2, hides: ['undershirt'] }, bodies)).not.toThrow();
  });

  it('puts the origin on the socket, scaled and turned', () => {
    // A 2x chest piece: the hem center (the origin) goes to the hero hem; 0.6 m up is 0.3 m worn.
    const chest = resolveEquip({ slot: 'chest', fitScale: 2 });
    expect(chest.attach).toHaveLength(1);
    expect(chest.attach[0]!.bone).toBe('chest');
    expect(attached(chest.attach[0]!, [0, 0, 0]).toArray().map((v) => +v.toFixed(6))).toEqual([0, 0.152, 0]);
    expect(attached(chest.attach[0]!, [0, 0.6, 0]).y).toBeCloseTo(0.452, 6);
    // A weapon: the grip goes into the right fist, and the business end (+Y) points forward and 20 degrees up.
    const sword = resolveEquip({ slot: 'mainhand', origin: [0, 0.1, 0] });
    const grip = attached(sword.attach[0]!, [0, 0.1, 0]);
    expect(grip.toArray().map((v) => +v.toFixed(6))).toEqual(SOCKETS['grip.R'].at);
    const tip = attached(sword.attach[0]!, [0, 1.1, 0]).sub(grip);
    expect(tip.z).toBeCloseTo(Math.cos((20 * Math.PI) / 180), 5); // the extras keep 6 decimals
    expect(tip.y).toBeCloseTo(Math.sin((20 * Math.PI) / 180), 5);
    // The flat (+Z) faces outward: -X for the right hand.
    const flat = attached(sword.attach[0]!, [0, 0.1, 1]).sub(grip);
    expect(flat.x).toBeCloseTo(-1, 5);
  });

  it('undoes the turn of the socket frame in the asset (a standalone rest pose)', () => {
    // A cap shown tipped back 20 degrees, its head center 0.05 m up: worn, the turn is undone.
    const tipped = resolveEquip({ slot: 'head', origin: [0, 0.05, 0], rotate: [-20, 0, 0] });
    const center = attached(tipped.attach[0]!, [0, 0.05, 0]);
    expect(center.toArray().map((v) => +v.toFixed(6) + 0)).toEqual(SOCKETS.head.at);
    // The socket's up (+Y), turned as the rest pose turns it, is up again when worn.
    const r = (20 * Math.PI) / 180;
    const up = attached(tipped.attach[0]!, [0, 0.05 + Math.cos(r), -Math.sin(r)]).sub(center);
    expect(up.y).toBeCloseTo(1, 5);
    expect(up.z).toBeCloseTo(0, 5);
  });

  it('places a body-frame item with the character axes at the socket point', () => {
    // A crossbow held level: its +Z (the front) stays forward and its +Y up.
    const bow = resolveEquip({ slot: 'mainhand', frame: 'body', origin: [0, 0.05, -0.07] });
    const grip = attached(bow.attach[0]!, [0, 0.05, -0.07]);
    expect(grip.distanceTo(new THREE.Vector3(...SOCKETS['grip.R'].at))).toBeLessThan(1e-6);
    const front = attached(bow.attach[0]!, [0, 0.05, 0.93]).sub(grip);
    expect(front.z).toBeCloseTo(1, 5);
  });

  it('mirrors a pair onto the right bone and keeps the left half', () => {
    const boots = resolveEquip({ slot: 'feet', fitScale: 2, origin: [0.07, 0.12, 0] });
    expect(boots.attach.map((a) => [a.bone, a.half])).toEqual([
      ['shin.L', '+x'],
      ['shin.R', '+x'],
    ]);
    expect(boots.attach[1]!.scale[0]).toBeCloseTo(-0.5, 6);
    const left = attached(boots.attach[0]!, [0.1, 0.05, 0.03]);
    const right = attached(boots.attach[1]!, [0.1, 0.05, 0.03]);
    expect(right.x).toBeCloseTo(-left.x, 6);
    expect(right.y).toBeCloseTo(left.y, 6);
    expect(right.z).toBeCloseTo(left.z, 6);
    // The worn matrices agree with the resolved attach.
    const w = wornMatrices({ slot: 'feet', fitScale: 2, origin: [0.07, 0.12, 0] });
    expect(new THREE.Vector3(0.1, 0.05, 0.03).applyMatrix4(w[1]!.matrix).distanceTo(right)).toBeLessThan(1e-6);
  });

  it('writes the resolved block to the GLB root extras and the stats', async () => {
    const { root, stats } = await buildAsset(cap);
    expect(stats.equip?.slot).toBe('head');
    const doc = await new NodeIO().readBinary(await toGlb(root));
    const extras = doc.getRoot().getExtras() as { forgeEquip?: { slot: string; hides: string[]; displayOnly: string[]; attach: { bone: string }[] }; forgeVariants?: unknown };
    expect(extras.forgeEquip?.slot).toBe('head');
    expect(extras.forgeEquip?.hides).toEqual(['hair']);
    expect(extras.forgeEquip?.displayOnly).toEqual(['stand']);
    expect(extras.forgeEquip?.attach.map((a) => a.bone)).toEqual(['head']);
    expect(extras.forgeVariants).toBeDefined();
  });

  it('fails the build of an invalid block', async () => {
    await expect(buildAsset({ ...cap, equip: { slot: 'head', fitScale: 0.5 } })).rejects.toThrow(/fit contract/);
  });

  it('dresses a base: the piece on its bone, hidden and display-only bodies left out', async () => {
    const base = defineAsset({
      name: 'test-base',
      detail: 0.02,
      texture: false,
      build(k) {
        k.skeleton({ hips: { at: [0, 0.2, 0] }, head: { parent: 'hips', at: [0, 0.48, -0.01] } });
        k.body('skin', sdf.sphere(0.2).at(0, 0.675, 0).bone('head'));
        k.body('hair', sdf.sphere(0.21).at(0, 0.7, 0), { bone: 'head' });
      },
    });
    const { pending } = await collectBodies(wearAsset(base, [{ name: 'test-cap', def: cap }]));
    expect(pending.map((b) => [b.name, b.options.bone])).toEqual([
      ['skin', undefined],
      ['test-cap:cap', 'head'],
    ]);
    // The cap's rim (asset y 0.2 + 0.15 = 0.35 up from the center) sits on the head: worn center y 0.675.
    const worn = pending[1]!.shape;
    expect(worn.dist(0, 0.675 + 0.22, 0)).toBeLessThan(0.002);
    expect(worn.dist(0, 0.2 + 0.22, 0)).toBeGreaterThan(0.1);
  });

  it('counts a show-through point for the outer base layer only', async () => {
    // A base head with hair over the top, and a cap that is too small: it sinks into the skull.
    const base = defineAsset({
      name: 'test-head',
      detail: 0.012,
      texture: false,
      build(k) {
        k.skeleton({ hips: { at: [0, 0.2, 0] }, head: { parent: 'hips', at: [0, 0.48, -0.01] } });
        k.body('skin', sdf.sphere(0.2).at(0, 0.675, 0).bone('head'));
        k.body('hair', sdf.sphere(0.22).at(0, 0.675, 0).intersect(sdf.box([1, 0.3, 1]).at(0, 0.85, 0)), { bone: 'head' });
      },
    });
    const small = (hides: 'hair'[]) =>
      defineAsset({
        name: 'test-small-cap',
        detail: 0.012,
        texture: false,
        equip: { slot: 'head', hides },
        build(k) {
          k.body('cap', sdf.sphere(0.192).subtract(sdf.sphere(0.18)).intersect(sdf.box([1, 0.2, 1]).at(0, 0.15, 0)));
        },
      });
    // Under the hair, the hair is the outer layer: a note, not a failure.
    const kept = await checkEquip({ name: 'test-small-cap', def: small([]) }, base);
    const contact = (r: typeof kept, name: string) => r.contacts.find((c) => c.base === name)!;
    expect(contact(kept, 'skin').shows).toBe(0);
    expect(contact(kept, 'hair').shows).toBeGreaterThan(0);
    expect(kept.ok).toBe(true);
    // With the hair hidden, the skull shows through the cap.
    const bald = await checkEquip({ name: 'test-small-cap', def: small(['hair']) }, base);
    expect(contact(bald, 'skin').fails).toBe(true);
    expect(bald.ok).toBe(false);
  });
  it('tells the hair what a piece does: hide, cap, or keep it full', () => {
    const piece = (equip: EquipDeclaration) => ({ name: 'p', def: defineAsset({ name: 'p', equip, build() {} }) });
    expect(hairOf({ slot: 'head', hides: ['hair'] })).toBe('hidden');
    expect(hairOf({ slot: 'head' })).toBe('capped');
    expect(hairOf({ slot: 'head', fullHair: true })).toBe('full');
    expect(hairOf({ slot: 'hair', hides: ['hair'] })).toBe('hidden');
    expect(hairOf({ slot: 'chest' })).toBe('full');
    expect(resolveEquip({ slot: 'head' }).hair).toBe('capped');
    // A hair style does not cap; a hat over it does, unless the hat keeps the full hair.
    const style = piece({ slot: 'hair', hides: ['hair'] });
    expect(capsHair([style])).toBe(false);
    expect(capsHair([style, piece({ slot: 'head' })])).toBe(true);
    expect(capsHair([style, piece({ slot: 'head', fullHair: true })])).toBe(false);
    expect(capsHair([piece({ slot: 'chest' })])).toBe(false);
    expect(() => validateEquip({ slot: 'chest', fullHair: true }, ['a'])).toThrow(/only a head piece/);
    expect(() => validateEquip({ slot: 'head', fullHair: true, hides: ['hair'] }, ['a'])).toThrow(/cannot keep the full hair/);
  });

  it('builds the capped hair of the base and of a hair style under a head piece that keeps it', async () => {
    const hair = (k: { worn?: { readonly capHair: boolean } }) => (k.worn?.capHair ? 0.205 : 0.23);
    const base = defineAsset({
      name: 'test-base',
      detail: 0.02,
      texture: false,
      build(k) {
        k.skeleton({ hips: { at: [0, 0.2, 0] }, head: { parent: 'hips', at: [0, 0.48, -0.01] } });
        k.body('skin', sdf.sphere(0.2).at(0, 0.675, 0).bone('head'));
        k.body('hair', sdf.sphere(hair(k)).at(0, 0.675, 0), { bone: 'head' });
      },
    });
    const style = defineAsset({
      name: 'test-style',
      detail: 0.02,
      texture: false,
      equip: { slot: 'hair', hides: ['hair'] },
      build(k) {
        k.body('hair', sdf.sphere(hair(k)));
      },
    });
    const hat = (equip: EquipDeclaration) => ({ name: 'test-hat', def: defineAsset({ name: 'test-hat', detail: 0.02, texture: false, equip, build: (k) => k.body('hat', sdf.box([0.1, 0.1, 0.1])) }) });
    const radius = async (pieces: Parameters<typeof wearAsset>[1], name: string) => {
      const { pending } = await collectBodies(wearAsset(base, pieces));
      const body = pending.find((b) => b.name === name)!;
      return 0.3 - body.shape.dist(0, 0.675 + 0.3, 0);
    };
    expect(await radius([hat({ slot: 'head' })], 'hair')).toBeCloseTo(0.205, 3);
    expect(await radius([hat({ slot: 'head', fullHair: true })], 'hair')).toBeCloseTo(0.23, 3);
    expect(await radius([{ name: 'test-style', def: style }], 'test-style:hair')).toBeCloseTo(0.23, 3);
    expect(await radius([{ name: 'test-style', def: style }, hat({ slot: 'head' })], 'test-style:hair')).toBeCloseTo(0.205, 3);
  });

  it('keeps every capped hair style within a thin cap above the cap line', () => {
    // Head-local frame: the skull ellipsoid (0.205, 0.2, 0.19) at (0, 0.008, -0.01); the cap line
    // y = 0.66 + 0.3 z in the character frame (head center y 0.675). Points 9 mm outside the skull
    // and 3 cm above the line are outside every capped style; the full styles reach past them.
    const tint = ((slot: string) => (slot ? '#5a301d' : '#000000')) as Parameters<typeof avatarHair>[1];
    const probes: [number, number, number][] = [];
    for (let i = 0; i <= 12; i++)
      for (let j = 0; j < 24; j++) {
        const theta = (i / 12) * Math.PI;
        const phi = (j / 24) * Math.PI * 2;
        const x = (0.205 + 0.009) * Math.sin(theta) * Math.cos(phi);
        const y = 0.008 + (0.2 + 0.009) * Math.cos(theta);
        const z = -0.01 + (0.19 + 0.009) * Math.sin(theta) * Math.sin(phi);
        if (y + 0.675 > 0.66 + 0.3 * z + 0.03) probes.push([x, y, z]);
      }
    expect(probes.length).toBeGreaterThan(100);
    for (const style of AVATAR_HAIR_STYLES) {
      const shapeOf = (capped: boolean) => avatarHair(style, tint, { capped }).bodies[0]!.shape;
      const capped = shapeOf(true);
      const inside = probes.filter(([x, y, z]) => capped.dist(x, y, z) < 0);
      expect(inside, style).toEqual([]);
      const full = shapeOf(false);
      expect(probes.filter(([x, y, z]) => full.dist(x, y, z) < 0).length, style).toBeGreaterThan(0);
    }
  });
});
