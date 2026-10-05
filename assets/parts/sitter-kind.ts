import { defineAsset, motion, profile, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Sitter kinds — small chibi animals that sit upright (catalog wildlife rabbit and bat). One body
 * plan: a big round head on a small seated pear body, two big feet forward on the ground, two small
 * front paws together at the chest, and ears (long and upright, or big and pointed). Options: a
 * second body color, a face mask and a belly patch, whiskers and lashes, a puff tail, and bat wings
 * spread at the sides. One clip set: idle (breathing, an ear twitch, a look round), hop (a small
 * hop forward, or with wings a short flight with flaps), attack (a lunge), hit, and death (the body
 * tips onto its side). Units are the kind's (about 0.75 m to the ear tips); an asset scales it with
 * `scaleAsset`.
 */

const SITTER_COLORS = {
  eyeWhite: '#fbf8f0',
  pupil: '#141012',
  nose: '#e89aa8',
  mouth: '#4a2a26',
  earInner: '#f0b0b8',
  toeLine: '#b8a894',
  lash: '#2a2024',
  whisker: '#6a6066',
  wing: '#6a4430',
  claw: '#e8d8c0',
};

type V3 = readonly [number, number, number];
type P4 = [number, number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

/** A sitter kind: the slots, the head, the ears, the face, and extras. */
export interface SitterKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `fur` (the head), `markings` (mask, belly, feet, tail), and `eyes`; a kind may add `coat` for the body. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof SITTER_COLORS>;
  /** The slot of the body color (default `fur`). */
  readonly bodySlot?: string;
  /** The head radius (default 0.2). */
  readonly head?: number;
  /** The ears: long and upright with pink insides (default) or big and pointed, turned out. */
  readonly ears?: 'long' | 'pointed';
  /** The ear size (default 1). */
  readonly earScale?: number;
  /** A face mask in the markings color: round the eyes and the muzzle (`true`), or the whole lower face
   * and the eyes with a fur V down the forehead to the nose (`'v'`), or the lower face only (`'muzzle'`).
   * Default false. */
  readonly mask?: boolean | 'v' | 'muzzle';
  /** The slot of the outer ear color (default: the head fur). */
  readonly earSlot?: string;
  /** A white ring round each iris (default false). */
  readonly sclera?: boolean;
  /** A belly patch in the markings color (default true). */
  readonly belly?: boolean;
  /** The feet: big long feet forward (default) or small round feet. */
  readonly feet?: 'long' | 'small';
  /** The slot of the feet color (default `markings`). */
  readonly feetSlot?: string;
  /** The eye size (default 1). */
  readonly eyeScale?: number;
  /** Lashes over the outer corners of the eyes (default false). */
  readonly lashes?: boolean;
  /** Thin dark brows over the eyes (default false). */
  readonly brows?: boolean;
  /** Whisker lines on the cheeks (default false). */
  readonly whiskers?: boolean;
  /** The nose: a small pink triangle (default) or a dark round nose. */
  readonly nose?: 'pink' | 'dark';
  /** A round puff tail (default true). */
  readonly tail?: boolean;
  /** Bat wings spread out at the sides (default false). */
  readonly wings?: boolean;
  /** The size of the haunches and the hind feet (default 1). */
  readonly haunchScale?: number;
  /** The mouth: a small 'w' under the nose (default) or one wide smile. */
  readonly mouth?: 'w' | 'smile';
  /** The nose size (default 1). */
  readonly noseScale?: number;
  /** The front legs: small paws together at the chest (default) or straight down to paws on the ground. */
  readonly arms?: 'chest' | 'down';
  /** The head radii as a share of `head` across and up (default [1.05, 0.95]). */
  readonly headShape?: readonly [number, number];
  /** The cheek size (default 1); bigger cheeks also sit a little wider. */
  readonly cheeks?: number;
  /** A small round muzzle bump at the nose, its radius as a share of `head` (default 0: none). */
  readonly muzzle?: number;
  /** The size of the upper chest under the head (default 1). */
  readonly chest?: number;
  /** The thickness of the front legs (default 1). */
  readonly armScale?: number;
  /** The width of the long ears as a share of the default (default 1). */
  readonly earWidth?: number;
  /** How far the long ears lean out to the sides in degrees (default 10). */
  readonly earSplay?: number;
  /** Two toe lines on each front paw (default false). */
  readonly toeLines?: boolean;
  /** Paint on the fur (extra marks). */
  paint?(fur: sdf.Shape, s: SitterShape): sdf.Shape;
  /** Extra bodies. */
  extra?(k: AssetContext, s: SitterShape): void;
}

/** The sitter's shapes and colors that a kind builds on. */
export interface SitterShape {
  readonly head: sdf.Shape;
  readonly joints: { readonly HEAD_C: V3; readonly HR: number; readonly BODY_C: V3 };
  faceHit(x: number, y: number): V3;
  readonly tint: { readonly fur: string; readonly markings: string; readonly eye: string; readonly body: string };
  tone(slot: string, color: string, follow?: number): string;
}

const BODY_C: V3 = [0, 0.17, -0.01];
const HIPS: V3 = [0, 0.14, -0.02];
const SPINE: V3 = [0, 0.24, 0.0];
const SHOULDER: V3 = [0.085, 0.27, 0.06];
const HIP: V3 = [0.08, 0.1, 0.02];

export function sitterAsset(kind: SitterKind): AssetDefinition {
  const C = { ...SITTER_COLORS, ...kind.colors };
  const HR = kind.head ?? 0.2;
  const HEAD_C: V3 = [0, 0.3 + HR * 0.82, 0.03];
  const NECK: V3 = [0, 0.31, 0.01];
  const longEars = (kind.ears ?? 'long') === 'long';
  const ES = kind.earScale ?? 1;
  const winged = !!kind.wings;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { fur: k.tint('fur'), markings: k.tint('markings'), eye: k.tint('eyes'), body: k.tint(kind.bodySlot ?? 'fur') };
      const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
      // The ear roots on top of the head, a little apart.
      const EAR_AT: V3 = longEars ? [HR * 0.36, HEAD_C[1] + HR * 0.84, HEAD_C[2] - 0.01] : [HR * 0.55, HEAD_C[1] + HR * 0.68, HEAD_C[2] - 0.01];
      const earTip: V3 = longEars ? [EAR_AT[0] + 0.05 * ES, EAR_AT[1] + 0.3 * ES, EAR_AT[2] - 0.02] : [EAR_AT[0] + 0.12 * ES, EAR_AT[1] + 0.17 * ES, EAR_AT[2]];
      const WING_AT: V3 = [0.12, 0.27, -0.02];
      k.skeleton({
        hips: { at: HIPS },
        spine: { parent: 'hips', at: SPINE },
        head: { parent: 'spine', at: NECK, tail: [0, HEAD_C[1] + HR, HEAD_C[2]] },
        'ear.L': { parent: 'head', at: EAR_AT, tail: earTip },
        'ear.R': { parent: 'head', at: mx(EAR_AT), tail: mx(earTip) },
        'arm.L': { parent: 'spine', at: SHOULDER, tail: [0.04, 0.2, 0.15] },
        'arm.R': { parent: 'spine', at: mx(SHOULDER), tail: [-0.04, 0.2, 0.15] },
        'leg.L': { parent: 'hips', at: HIP, tail: [0.09, 0.02, 0.17] },
        'leg.R': { parent: 'hips', at: mx(HIP), tail: [-0.09, 0.02, 0.17] },
        tail: { parent: 'hips', at: [0, 0.09, -0.14], tail: [0, 0.08, -0.22] },
        ...(winged
          ? {
              'wing.L': { parent: 'spine', at: WING_AT, tail: [0.3, 0.2, -0.1] },
              'wing.R': { parent: 'spine', at: mx(WING_AT), tail: [-0.3, 0.2, -0.1] },
            }
          : {}),
      });

      // ------------------------------------------------------------------ body, legs, paws
      const CH = kind.chest ?? 1;
      const pear = sdf.smoothUnion(0.06, sdf.ellipsoid([0.15, 0.13, 0.14]).at(BODY_C[0], BODY_C[1] - 0.03, BODY_C[2]), sdf.ellipsoid([0.1 * CH, 0.09 * CH, 0.09 * CH]).at(0, 0.29, 0.0));
      const HS = kind.haunchScale ?? 1;
      const haunch = pair(sdf.ellipsoid([0.075 * HS, 0.08 * HS, 0.1 * HS]).at(0.1, 0.1 * HS, -0.01).bone('leg.L'));
      const bodyShape = sdf.smoothUnion(0.04, pear.bone('spine'), haunch);
      const longFeet = (kind.feet ?? 'long') === 'long';
      const foot = longFeet ? sdf.ellipsoid([0.05, 0.035, 0.1 * HS]).at(0.095, 0.035, 0.1 * HS) : sdf.ellipsoid([0.04, 0.03, 0.05]).at(0.08, 0.03, 0.08);
      const toes = longFeet ? sdf.union(...[-0.022, 0, 0.022].map((dx) => sdf.sphere(0.02).at(0.095 + dx, 0.025, 0.1 * HS + 0.085))) : sdf.union(...[-0.018, 0.018].map((dx) => sdf.sphere(0.017).at(0.08 + dx, 0.02, 0.12)));
      const hindFeet = pair(sdf.smoothUnion(0.015, foot, toes).bone('leg.L'));
      const armsDown = kind.arms === 'down';
      const AS = kind.armScale ?? 1;
      const paw = armsDown
        ? sdf.chain([[...SHOULDER, 0.036 * AS] as P4, [0.06, 0.16, 0.13, 0.03 * AS], [0.045, 0.06, 0.15, 0.026 * AS]], 0.02)
        : sdf.chain([[...SHOULDER, 0.035 * AS] as P4, [0.07, 0.22, 0.12, 0.03 * AS], [0.035, 0.2, 0.15, 0.034 * AS]], 0.01);
      const paws = pair(paw.bone('arm.L'));
      // Front paws on the ground, in the feet color.
      const frontPaws0 = sdf.smoothUnion(0.012, sdf.ellipsoid([0.038, 0.03, 0.042]).at(0.047, 0.03, 0.16), ...[-0.014, 0.014].map((dx) => sdf.sphere(0.016).at(0.047 + dx, 0.018, 0.192)));
      const frontPaws = pair(
        (kind.toeLines
          ? frontPaws0.paintWhere(sdf.union(...[-0.008, 0.008].map((dx) => sdf.box([0.003, 0.03, 0.05]).at(0.047 + dx, 0.03, 0.2))), C.toeLine, 0.002)
          : frontPaws0
        ).bone('arm.L'),
      );

      // ------------------------------------------------------------------ head, ears
      const CK = kind.cheeks ?? 1;
      const skull0 = sdf.smoothUnion(
        0.04,
        sdf.ellipsoid([HR * (kind.headShape?.[0] ?? 1.05), HR * (kind.headShape?.[1] ?? 0.95), HR * 0.95]).at(...HEAD_C),
        pair(sdf.sphere(HR * 0.42 * CK).at(HR * (0.45 + 0.12 * (CK - 1)), HEAD_C[1] - HR * 0.45, HEAD_C[2] + HR * 0.45)), // cheeks
      );
      const skull = kind.muzzle ? skull0.smoothUnion(0.03, sdf.sphere(HR * kind.muzzle).at(0, HEAD_C[1] - HR * 0.3, HEAD_C[2] + HR * (1 - kind.muzzle * 0.6))) : skull0;
      const faceHit = (x: number, y: number): V3 => sdf.raycast(skull, [x, y, 2], [0, 0, -1])! as V3;
      // A leaf-shaped pointed ear with a rounded tip, flat, with a rim round a hollow inside.
      const EW = kind.earWidth ?? 1;
      const pointedEar = profile.polygon([[-0.06, -0.01], [-0.075, 0.06], [-0.05, 0.13], [-0.004, 0.19], [0.042, 0.13], [0.07, 0.06], [0.06, -0.01]], { smooth: true });
      const ear = longEars
        ? sdf
            .smoothUnion(0.02, sdf.ellipsoid([0.055 * EW, 0.16, 0.03]).at(0, 0.14, 0), sdf.cone([0, -0.02, 0], [0, 0.05, 0], 0.035, 0.04))
            .smoothSubtract(0.006, sdf.ellipsoid([0.038 * EW, 0.13, 0.03]).at(0, 0.15, 0.025))
            .paint(kind.earSlot ? k.tint(kind.earSlot) : T.fur)
            .paintWhere(sdf.ellipsoid([0.042 * EW, 0.135, 0.04]).at(0, 0.15, 0.018), C.earInner, 0.006)
            .scale(ES)
            .rotateZ(-(kind.earSplay ?? 10))
            .rotateY(10)
        : sdf
            .extrude(pointedEar, 0.026, 0.011)
            .smoothSubtract(0.006, sdf.extrude(profile.offsetProfile(pointedEar, -0.016), 0.03).at(0, 0.008, 0.02))
            .paint(kind.earSlot ? k.tint(kind.earSlot) : T.fur)
            .paintWhere(sdf.extrude(profile.offsetProfile(pointedEar, -0.013), 0.04).at(0, 0.008, 0.02), C.earInner, 0.004)
            .scale(ES)
            .rotateZ(-26)
            .rotateY(14);
      const ears = pair(ear.at(...EAR_AT).bone('ear.L'));

      // ------------------------------------------------------------------ fur and paint
      const es = (kind.eyeScale ?? 1) * (HR / 0.2);
      const EX = HR * 0.42;
      const EY = HEAD_C[1] + HR * 0.08;
      const eL = faceHit(EX, EY);
      const front = sdf.halfSpace([0, 0, -1], -HEAD_C[2]);
      let head: sdf.Shape = skull;
      if (kind.mask === 'muzzle') {
        const lower = sdf.ellipsoid([HR * 0.8, HR * 0.5, HR * 0.8]).at(0, EY - HR * 0.6, HEAD_C[2] + HR * 0.6);
        head = head.paintWhere(lower, T.markings, 0.012);
      } else if (kind.mask === 'v') {
        // The whole lower face and round patches over the eyes, with a fur V down the forehead to the nose.
        const lower = sdf.ellipsoid([HR * 0.98, HR * 0.62, HR * 0.8]).at(0, EY - HR * 0.62, HEAD_C[2] + HR * 0.55);
        const patches = pair(sdf.cylinder(HR * 0.36, 1).rotateX(90).at(EX, EY + HR * 0.02, 0));
        const v = sdf.extrude(profile.polygon([[-HR * 0.2, HR * 0.9], [HR * 0.2, HR * 0.9], [0, -HR * 0.12]], { smooth: false }), 1).at(0, HEAD_C[1], 0);
        const mask = sdf.smoothUnion(0.02, lower, patches).smoothSubtract(0.015, v).intersect(front);
        head = head.paintWhere(mask, T.markings, 0.012);
      } else if (kind.mask) {
        // A face mask: round patches over the eyes joined to the muzzle area, pushed through the face along Z.
        const mask = sdf
          .smoothUnion(0.03, pair(sdf.cylinder(HR * 0.33, 1).rotateX(90).at(EX, EY, 0)), sdf.cylinder(HR * 0.38, 1).rotateX(90).at(0, HEAD_C[1] - HR * 0.38, 0))
          .intersect(front);
        head = head.paintWhere(mask, T.markings, 0.01);
      }
      // The nose and the smile.
      const nTip = faceHit(0, HEAD_C[1] - HR * 0.22);
      const darkNose = kind.nose === 'dark';
      const NS = kind.noseScale ?? 1;
      const noseShape = darkNose
        ? sdf.ellipsoid([HR * 0.15 * NS, HR * 0.1 * NS, HR * 0.1 * NS]).at(nTip[0], nTip[1], nTip[2] - HR * 0.04 * NS)
        : sdf.smoothUnion(0.01, sdf.ellipsoid([HR * 0.1, HR * 0.06, HR * 0.06]).at(nTip[0], nTip[1] + HR * 0.01, nTip[2] - HR * 0.02), sdf.ellipsoid([HR * 0.045, HR * 0.05, HR * 0.05]).at(nTip[0], nTip[1] - HR * 0.04, nTip[2] - HR * 0.025));
      const smile =
        kind.mouth === 'smile'
          ? sdf.extrude(profile.arc(HR * 0.3, HR * 0.05, 236, 304), 0.3).at(0, nTip[1] + HR * 0.12, nTip[2] - 0.1)
          : sdf.extrude(profile.arc(HR * 0.14, HR * 0.035, 210, 330), 0.3).at(-HR * 0.12, nTip[1] - HR * 0.09, nTip[2] - 0.1).mirror('x');
      head = head.paintWhere(smile.intersect(front), C.mouth, 0.002);
      if (kind.whiskers) {
        const w = sdf.union(...[-12, 0, 12].map((a, i) => sdf.box([HR * 0.5, HR * 0.018, 0.3]).rotateZ(a).at(HR * 0.55, nTip[1] - HR * 0.02 - i * HR * 0.07, nTip[2] - 0.1))).mirror('x');
        head = head.paintWhere(w.intersect(front), C.whisker, 0.002);
      }
      // The eyes: big glossy irises with a dark pupil and white glints, painted on the face.
      const disc = (r: number, dx = 0, dy = 0) => pair(sdf.cylinder(r, 1).rotateX(90).at(eL[0] + dx, eL[1] + dy, 0)).intersect(front);
      head = head.paintWhere(disc(0.05 * es), C.pupil, 0.002);
      if (kind.sclera) head = head.paintWhere(disc(0.046 * es), C.eyeWhite, 0.002);
      head = head
        .paintWhere(disc(kind.sclera ? 0.038 * es : 0.042 * es), T.eye, 0.002)
        .paintWhere(disc(0.026 * es, 0, -0.002 * es), C.pupil, 0.002)
        .paintWhere(disc(0.013 * es, 0.013 * es, 0.016 * es), '#ffffff', 0.002)
        .paintWhere(disc(0.006 * es, -0.014 * es, -0.014 * es), '#ffffff', 0.002);
      if (kind.brows) {
        const brow = sdf.extrude(profile.arc(0.07 * es, 0.01 * es, 70, 108), 0.3).at(eL[0] + 0.004 * es, eL[1] + 0.022 * es, eL[2] - 0.1);
        head = head.paintWhere(pair(brow).intersect(front), C.lash, 0.002);
      }
      if (kind.lashes) {
        const lash = sdf.union(...[0, 1].map((i) => sdf.box([0.02 * es, 0.007 * es, 0.3]).rotateZ(30 + i * 25).at(eL[0] + 0.05 * es, eL[1] + 0.035 * es + i * 0.008 * es, eL[2] - 0.1)));
        head = head.paintWhere(pair(lash).intersect(front), C.lash, 0.002);
      }
      let body = bodyShape;
      if (kind.belly !== false) body = body.paintWhere(sdf.ellipsoid([0.1, 0.13, 0.12]).at(0, 0.2, 0.08), T.markings, 0.025);
      const s: SitterShape = { head: skull, joints: { HEAD_C, HR, BODY_C }, faceHit, tint: T, tone };
      const furHead = sdf.union(head.bone('head'), ears);
      // The front paw tips in the feet color.
      const pawTips = armsDown ? null : pair(sdf.sphere(0.03).at(0.035, 0.2, 0.16));
      const furBody = sdf.smoothUnion(0.03, body, paws);
      const tipped = pawTips ? furBody.paintWhere(pawTips, k.tint(kind.feetSlot ?? 'markings'), 0.008) : furBody;
      const painted = kind.paint ? kind.paint(tipped, s) : tipped;
      k.body('head-fur', furHead, { color: T.fur, roughness: 0.8, textureDensity: 2 });
      k.body('body-fur', painted, { color: T.body, roughness: 0.8, textureDensity: 1.3 });
      const feet = armsDown ? sdf.union(hindFeet, frontPaws) : hindFeet;
      k.body('feet', feet, { color: k.tint(kind.feetSlot ?? 'markings'), roughness: 0.8 });
      k.body('nose', noseShape.bone('head'), { color: darkNose ? '#1e1618' : C.nose, roughness: darkNose ? 0.3 : 0.5, detail: 0.003 });
      if (kind.tail !== false) k.body('tail-puff', sdf.sphere(0.06).at(0, 0.1, -0.15).bone('tail'), { color: T.markings, roughness: 0.9, bump: () => 0 });

      // ------------------------------------------------------------------ wings
      if (winged) {
        // A membrane between three finger bones with a scalloped edge.
        const fingers: [number, number][] = [
          [0.24, -0.02],
          [0.2, -0.13],
          [0.1, -0.17],
        ];
        const bones = sdf.union(sdf.capsule([0, 0, 0], [0.14, 0.04, 0], 0.014), ...fingers.map(([x, y]) => sdf.capsule([0.14, 0.04, 0], [x, y, 0], 0.009)));
        const membrane = sdf
          .extrude(profile.polygon([[0, 0.01], [0.14, 0.05], [0.24, -0.02], [0.2, -0.08], [0.2, -0.13], [0.14, -0.13], [0.1, -0.17], [0.02, -0.08]], { smooth: false }), 0.012, 0.004)
          .paintFn((x, y, _z, base) => (Math.abs(y + 0.04 - x * 0.2) < 0.004 ? [base[0] * 0.8, base[1] * 0.8, base[2] * 0.8] : base));
        // Spread out to the sides and a little back.
        const pose = (sh: sdf.Shape) => sh.scale(1.15).rotateZ(4).rotateY(12).at(...WING_AT);
        k.body('wing-skin', pair(pose(membrane).bone('wing.L')), { color: tone('fur', C.wing, 0.8), roughness: 0.7, detail: 0.003 });
        k.body('wing-bones', pair(pose(sdf.union(bones, sdf.cone([0.14, 0.04, 0], [0.16, 0.08, 0], 0.012, 0.003))).bone('wing.L')), { color: T.fur, roughness: 0.7, detail: 0.003 });
      }
      kind.extra?.(k, s);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      type R3 = [number, number, number];
      const earPose = (a: number, b: number) => ({ 'ear.L': { rotate: [a, 0, b] as R3 }, 'ear.R': { rotate: [a, 0, -b] as R3 } });
      const wingPose = (a: number) => (winged ? { 'wing.L': { rotate: [0, -a, a * 0.6] as R3 }, 'wing.R': { rotate: [0, a, -a * 0.6] as R3 } } : {});
      k.animation('idle', {
        duration: 2.4,
        pose: (_t, p) => ({
          spine: { move: [0, 0.004 * bump(p, 2), 0], rotate: [2 * wave(p, 2), 0, 0] },
          head: { rotate: [3 * wave(p, 2, 0.1), 12 * keys(p, [[0, 0], [0.2, 1], [0.45, 1], [0.6, -1], [0.85, -1], [1, 0]]), 4 * wave(p, 1, 0.3)] },
          ...earPose(6 * Math.max(0, wave(p, 3)), 4 * wave(p, 1, 0.2)),
          ...wingPose(4 * bump(p, 2)),
        }),
      });
      // Hop: crouch, spring up and forward, land, settle. With wings: a short flight with flaps.
      k.animation(winged ? 'fly' : 'hop', {
        duration: winged ? 0.6 : 0.7,
        pose: (_t, p) => {
          if (winged) {
            const flap = wave(p, 2);
            return {
              hips: { move: [0, 0.12 + 0.02 * wave(p, 2, 0.25), 0], rotate: [10, 0, 0] },
              head: { rotate: [-8, 0, 0] },
              ...wingPose(-30 + 50 * flap),
              ...earPose(-10, 0),
            };
          }
          const y = keys(p, [[0, 0], [0.2, -0.02], [0.45, 0.1], [0.7, 0], [0.8, -0.015], [1, 0]] as const);
          const tilt = keys(p, [[0, 0], [0.2, 8], [0.4, -12], [0.7, 6], [1, 0]] as const);
          // A squash in the crouch and the landing, a stretch in the air; the ears lag behind the body.
          const sq = keys(p, [[0, 0], [0.2, 1], [0.32, -0.6], [0.5, -0.3], [0.7, 0], [0.8, 0.8], [1, 0]] as const);
          return {
            hips: { move: [0, y, 0], rotate: [tilt, 0, 0] },
            spine: { scale: [1 + 0.11 * sq, 1 - 0.15 * sq, 1 + 0.11 * sq] },
            'leg.L': { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 30], [0.7, 0], [1, 0]] as const), 0, 0] },
            'leg.R': { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 30], [0.7, 0], [1, 0]] as const), 0, 0] },
            ...earPose(keys(p, [[0, 0], [0.22, -14], [0.45, 36], [0.62, 16], [0.8, -22], [0.92, 6], [1, 0]] as const), 0),
          };
        },
      });
      k.animation('attack', {
        duration: 0.7,
        loop: false,
        pose: (_t, p) => {
          const l = keys(p, [[0, 0], [0.3, -0.4], [0.45, 1], [0.6, 1], [1, 0]] as const);
          return {
            hips: { move: [0, 0.02 * Math.max(0, l), 0.05 * l] },
            spine: { rotate: [12 * Math.max(0, l), 0, 0] },
            'arm.L': { rotate: [-50 * Math.max(0, l), 0, 0] },
            'arm.R': { rotate: [-50 * Math.max(0, l), 0, 0] },
            ...earPose(-14 * Math.max(0, l), 0),
            ...wingPose(30 * Math.max(0, l)),
          };
        },
      });
      k.animation('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.15, 1], [1, 0]] as const);
          return {
            spine: { rotate: [-12 * h, 0, 8 * h] },
            head: { rotate: [-10 * h, 0, -6 * h] },
            ...earPose(-20 * h, 10 * h),
            ...wingPose(20 * h),
          };
        },
      });
      k.animation('death', {
        duration: 1.3,
        loop: false,
        pose: (_t, p) => {
          const d = keys(p, [[0, 0], [0.5, 0.85], [0.7, 1], [1, 1]] as const);
          return {
            hips: { move: [0.04 * d, 0.03 * d, 0], rotate: [0, 0, -78 * d] },
            head: { rotate: [8 * d, 0, -10 * d] },
            ...earPose(10 * d, 20 * d),
            ...wingPose(-10 * d),
          };
        },
      });
    },
  });
}
