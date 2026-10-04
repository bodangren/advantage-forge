import { defineAsset, motion, noise, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Bird kinds — a chibi bird on two legs (catalog `monsters/beast/giant-eagle`, `roc`, and
 * `cockatrice`; later the wildlife birds). One body plan: an egg body, a round head with painted
 * eyes, a hooked or a short beak with a lower half on a jaw bone, feathered thighs over yellow
 * scaly shins, four-toed feet with dark talons, a fan tail, and the griffin's wings (an arm, two rows
 * of coverts, and flight feathers) on wing bones. One rig and one clip set: idle, walk (a waddle),
 * fly (a hover with full wing beats, `motion.orient` as on the griffin), attack (a rear-up and a
 * peck with the wings spread), hit, and death (onto the belly). A kind sets the palette and the
 * slots, the body and head sizes, the beak, the eyes, the wing rest pose, the tail, and adds paint,
 * bodies, bones, and poses (a crest, a comb, a serpent tail).
 */

const BIRD_COLORS = {
  belly: '#8a5a3a',
  flight: '#e8d8b0',
  scale: '#f0c030',
  scaleDark: '#d8a020',
  talon: '#2a2020',
  eyeRim: '#2a1a12',
  pupil: '#141012',
  mouth: '#4a2420',
};

type V3 = readonly [number, number, number];
type Pose = Record<string, BonePose>;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const DEG = Math.PI / 180;

// The legs (left): a short feathered thigh, a scaly shin, and a foot flat on the ground.
const HIP: V3 = [0.085, 0.24, -0.01];
const KNEE: V3 = [0.09, 0.14, 0.02];
const ANKLE: V3 = [0.09, 0.055, 0.0];
const HIPS_AT: V3 = [0, 0.26, -0.02];
// The wing in its own frame (as the griffin's): the root at the origin, the arm out and up to the
// wrist, the feathers hanging in the XY plane.
const WRIST: readonly [number, number] = [0.29, 0.27];
const ELBOW: readonly [number, number] = [0.14, 0.11];
const ARM_DEG = Math.atan2(WRIST[1], WRIST[0]) / DEG;

/** A bird kind: the slots, the sizes, the beak and the eyes, the wings and the tail, and extras. */
export interface BirdKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body`, `head`, `wings`, and `eyes`; the first option of each is the default look. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades of the slots (belly, flight, scale, talon, ...). */
  readonly colors?: Partial<typeof BIRD_COLORS>;
  /** The body radii (default [0.2, 0.24, 0.2]); the body bottom stays at 0.16 m. */
  readonly body?: V3;
  /** The head radius (default 0.13). */
  readonly head?: number;
  /** A hooked raptor beak (default) or a short straight beak. */
  readonly beak?: 'hook' | 'short';
  /** Brow ridges over the eyes in the beak color (default), in the head color, or none. */
  readonly brows?: 'beak' | 'head' | false;
  /** The size of the painted eyes as a share of the default. */
  readonly eyeScale?: number;
  /** The wings at rest, turned about their root in the frontal plane (degrees; 0 = raised, -100 = down by the body). */
  readonly wingRest?: number;
  /** The size of the wings (default 1). */
  readonly wingScale?: number;
  /** The wings' turn about Y at rest (degrees; 14 = the griffin's, about -40 = folded with the face out and forward). */
  readonly wingTurn?: number;
  /** A fan of tail feathers (default), or none (the kind builds its own tail on the `tail` bone). */
  readonly tail?: 'fan' | false;
  /** The slot of the tail fan color (default `wings`). */
  readonly tailSlot?: string;
  /** Extra bones (a serpent tail, a crest). */
  readonly bones?: Record<string, { parent: string; at: V3; tail?: V3 }>;
  /** Paint on the head plumage (a mask, cheek patches). */
  paint?(plumage: sdf.Shape, bird: BirdShape): sdf.Shape;
  /** Extra bodies (a crest, a comb and wattle, a serpent tail). */
  extra?(k: AssetContext, bird: BirdShape): void;
  /** Poses of the extra bones in a clip (`idle`, `walk`, `fly`, `attack`, `hit`, `death`). */
  pose?(clip: string, p: number): Pose;
}

/** The bird's shapes, joints, and slot colors that a kind builds on. */
export interface BirdShape {
  /** The body without the legs (chest, belly, and neck). */
  readonly trunk: sdf.Shape;
  /** The skull (head plumage before the beak). */
  readonly skull: sdf.Shape;
  /** The front point of the skull at (x, y). */
  faceHit(x: number, y: number): V3;
  /** The top point of the skull at (x, z). */
  topHit(x: number, z: number): V3;
  readonly joints: { readonly BODY_C: V3; readonly HEAD_C: V3; readonly HR: number; readonly B: V3; readonly TAIL_AT: V3; readonly WING_ROOT: V3 };
  readonly tint: { readonly body: string; readonly head: string; readonly wings: string; readonly eye: string; readonly belly: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function birdAsset(kind: BirdKind): AssetDefinition {
  const C = { ...BIRD_COLORS, ...kind.colors };
  const B: V3 = kind.body ?? [0.2, 0.24, 0.2];
  const HR = kind.head ?? 0.13;
  const BODY_C: V3 = [0, 0.16 + B[1], 0];
  const HEAD_C: V3 = [0, BODY_C[1] + B[1] * 0.78 + HR * 0.62, 0.03];
  const TAIL_AT: V3 = [0, BODY_C[1] - B[1] * 0.3, -B[2] * 0.82];
  const WING_ROOT: V3 = [B[0] * 0.72, BODY_C[1] + B[1] * 0.4, -0.03];
  const REST = kind.wingRest ?? 0;
  const WS = 1.12 * (kind.wingScale ?? 1);
  const TURN = kind.wingTurn ?? 14;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = {
        body: k.tint('body'),
        belly: tone('body', C.belly),
        head: k.tint('head'),
        wings: k.tint('wings'),
        flight: tone('wings', C.flight),
        eye: k.tint('eyes'),
      };
      const NECK_AT: V3 = [0, BODY_C[1] + B[1] * 0.55, 0.02];
      const HEAD_AT: V3 = [0, HEAD_C[1] - HR * 0.55, 0.03];
      const BEAK_Y = HEAD_C[1] - HR * 0.12;
      k.skeleton({
        hips: { at: HIPS_AT },
        spine: { parent: 'hips', at: [0, BODY_C[1], 0] },
        neck: { parent: 'spine', at: NECK_AT },
        head: { parent: 'neck', at: HEAD_AT, tail: [0, HEAD_C[1] + HR, HEAD_C[2]] },
        jaw: { parent: 'head', at: [0, BEAK_Y - HR * 0.15, HEAD_C[2] + HR * 0.75], tail: [0, BEAK_Y - HR * 0.3, HEAD_C[2] + HR * 1.4] },
        tail: { parent: 'hips', at: TAIL_AT, tail: [0, TAIL_AT[1] - 0.04, TAIL_AT[2] - 0.2] },
        'wing.L': { parent: 'spine', at: WING_ROOT, tail: [WING_ROOT[0] + 0.3, WING_ROOT[1] + 0.25, WING_ROOT[2]] },
        'wing.R': { parent: 'spine', at: mx(WING_ROOT), tail: [-WING_ROOT[0] - 0.3, WING_ROOT[1] + 0.25, WING_ROOT[2]] },
        'leg.L': { parent: 'hips', at: HIP },
        'shin.L': { parent: 'leg.L', at: KNEE },
        'foot.L': { parent: 'shin.L', at: ANKLE },
        'leg.R': { parent: 'hips', at: mx(HIP) },
        'shin.R': { parent: 'leg.R', at: mx(KNEE) },
        'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
        ...kind.bones,
      });

      // ------------------------------------------------------------------ body and thighs
      const chest = sdf.ellipsoid([B[0], B[1] * 0.75, B[2]]).at(BODY_C[0], BODY_C[1] + B[1] * 0.25, BODY_C[2] + 0.01);
      const belly = sdf.ellipsoid([B[0] * 0.96, B[1] * 0.7, B[2] * 0.96]).at(BODY_C[0], BODY_C[1] - B[1] * 0.3, BODY_C[2] - 0.01);
      const neck = sdf.capsule(NECK_AT, [0, HEAD_C[1] - HR * 0.3, HEAD_C[2]], HR * 0.66);
      const trunk = sdf.smoothUnion(0.08, chest.bone('spine'), belly.bone('hips')).smoothUnion(0.05, neck.bone('neck'));
      const thigh = sdf.cone(HIP, KNEE, 0.068, 0.05).bone('leg.L');
      const bodyShape = trunk
        .smoothUnion(0.03, pair(thigh))
        .paintWhere(sdf.ellipsoid([B[0] * 0.62, B[1] * 0.72, B[2] * 0.5]).at(0, BODY_C[1] - B[1] * 0.12, BODY_C[2] + B[2] * 0.62), T.belly, 0.05);
      k.body('body', bodyShape, {
        color: T.body,
        roughness: 0.8,
        textureDensity: 1.4,
        bump: (x, y, z) => 0.0007 * noise.fbm(x * 60, y * 40, z * 60, 2),
      });

      // ------------------------------------------------------------------ legs and feet
      // Four toes: three forward and one back, each ending in a dark talon.
      const TOES: readonly (readonly [dx: number, dz: number])[] = [[-0.05, 0.075], [0, 0.09], [0.05, 0.075], [0, -0.055]];
      const toeTip = ([dx, dz]: readonly [number, number]): V3 => [ANKLE[0] + dx, 0.02, ANKLE[2] + 0.01 + dz];
      const shin = sdf.cone(KNEE, ANKLE, 0.03, 0.026).bone('shin.L');
      const foot = sdf
        .smoothUnion(
          0.015,
          sdf.ellipsoid([0.04, 0.026, 0.042]).at(ANKLE[0], 0.03, ANKLE[2] + 0.01),
          ...TOES.map((t) => sdf.cone([ANKLE[0] + t[0] * 0.3, 0.025, ANKLE[2] + 0.01 + t[1] * 0.3], toeTip(t), 0.02, 0.016)),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0))
        .bone('foot.L');
      k.body('legs', pair(sdf.smoothUnion(0.015, shin, foot)), {
        color: C.scale,
        roughness: 0.5,
        bump: (_x, y) => 0.001 * Math.max(0, Math.cos(y * 2 * Math.PI * 40)),
      });
      const talons = sdf
        .union(
          ...TOES.map((t) => {
            const tip = toeTip(t);
            const out = t[1] > 0 ? 1 : -1;
            return sdf.cone([tip[0], 0.022, tip[2]], [tip[0], 0.004, tip[2] + out * 0.03], 0.016, 0.004);
          }),
        )
        .bone('foot.L');
      k.body('talons', pair(talons), { color: C.talon, roughness: 0.35, detail: 0.003 });

      // ------------------------------------------------------------------ head: plumage and painted eyes
      const skull = sdf.smoothUnion(
        0.04,
        sdf.ellipsoid([HR, HR * 0.95, HR * 0.92]).at(...HEAD_C),
        pair(sdf.sphere(HR * 0.45).at(HR * 0.5, HEAD_C[1] - HR * 0.42, HEAD_C[2] + HR * 0.42)), // cheeks
      );
      const faceHit = (x: number, y: number): V3 => sdf.raycast(skull, [x, y, 2], [0, 0, -1])! as V3;
      const topHit = (x: number, z: number): V3 => sdf.raycast(skull, [x, 2, z], [0, -1, 0])! as V3;
      const es = (kind.eyeScale ?? 1) * (HR / 0.13);
      const EYE_X = HR * 0.5;
      const EYE_Y = HEAD_C[1] + HR * 0.1;
      const eL = faceHit(EYE_X, EYE_Y);
      const disc = (r: number, dx = 0, dy = 0) => pair(sdf.cylinder(r, 1).rotateX(90).at(eL[0] + dx, eL[1] + dy, 0));
      const front = sdf.halfSpace([0, 0, -1], -HEAD_C[2]);
      // The head color reaches down over the top of the neck.
      const headNeck = neck.intersect(sdf.halfSpace([0, -1, 0], -(HEAD_C[1] - HR * 1.15)));
      const plumageBase = sdf
        .union(skull.bone('head'), headNeck.round(0.004).bone('neck'))
        .paintWhere(disc(0.038 * es).intersect(front), C.eyeRim, 0.002)
        .paintWhere(disc(0.031 * es).intersect(front), T.eye, 0.002)
        .paintWhere(disc(0.017 * es, -0.003 * es, -0.002 * es).intersect(front), C.pupil, 0.002)
        .paintWhere(pair(sdf.sphere(0.008 * es).at(eL[0] + 0.011 * es, eL[1] + 0.013 * es, eL[2])), '#ffffff', 0.002);
      const bird: BirdShape = {
        trunk,
        skull,
        faceHit,
        topHit,
        joints: { BODY_C, HEAD_C, HR, B, TAIL_AT, WING_ROOT },
        tint: { body: T.body, head: T.head, wings: T.wings, eye: T.eye, belly: T.belly },
        tone,
      };
      k.body('plumage', kind.paint ? kind.paint(plumageBase, bird) : plumageBase, {
        color: T.head,
        roughness: 0.85,
        textureDensity: 2,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 50, y * 50, z * 50, 2),
      });

      // ------------------------------------------------------------------ beak, brows, mouth
      const bb = faceHit(0, BEAK_Y);
      const bz = bb[2];
      const hook = kind.beak !== 'short';
      const upperBeak = hook
        ? sdf.smoothUnion(
            0.015,
            sdf.ellipsoid([HR * 0.48, HR * 0.36, HR * 0.4]).at(0, BEAK_Y, bz - HR * 0.12),
            sdf.chain(
              [
                [0, BEAK_Y + HR * 0.08, bz + HR * 0.05, HR * 0.33],
                [0, BEAK_Y + HR * 0.02, bz + HR * 0.5, HR * 0.24],
                [0, BEAK_Y - HR * 0.28, bz + HR * 0.76, HR * 0.13],
                [0, BEAK_Y - HR * 0.55, bz + HR * 0.7, HR * 0.04],
              ],
              0.01,
            ),
          )
        : sdf.cone([0, 0, -HR * 0.1], [0, -HR * 0.12, HR * 0.55], HR * 0.3, HR * 0.03).scale([1.15, 0.8, 1]).at(0, BEAK_Y, bz);
      const browAt = (x: number, y: number): V3 => {
        const h = faceHit(x, y);
        return [h[0], h[1], h[2] - 0.006];
      };
      const brows = pair(
        sdf.chain(
          [
            [...browAt(EYE_X * 0.4, EYE_Y + 0.0 * es), 0.016 * es],
            [...browAt(EYE_X * 0.85, EYE_Y + 0.04 * es), 0.018 * es],
            [...browAt(EYE_X * 1.35, EYE_Y + 0.045 * es), 0.014 * es],
          ],
          0.01,
        ),
      );
      const browKind = kind.brows ?? 'beak';
      k.body('beak', (browKind === 'beak' ? sdf.union(upperBeak, brows) : upperBeak).bone('head'), { color: C.scale, roughness: 0.4, textureDensity: 1.5 });
      if (browKind === 'head') k.body('brows', brows.bone('head'), { color: T.head, roughness: 0.85 });
      const lowerBeak = hook
        ? sdf.ellipsoid([HR * 0.3, HR * 0.13, HR * 0.36]).at(0, BEAK_Y - HR * 0.3, bz + HR * 0.3)
        : sdf.cone([0, -HR * 0.2, -HR * 0.05], [0, -HR * 0.26, HR * 0.4], HR * 0.16, HR * 0.02).scale([1.15, 1, 1]).at(0, BEAK_Y, bz);
      k.body('jawBeak', lowerBeak, { color: C.scaleDark, roughness: 0.4, bone: 'jaw' });
      k.body('mouth', sdf.ellipsoid([HR * 0.3, HR * 0.14, HR * 0.3]).at(0, BEAK_Y - HR * 0.2, bz + HR * 0.12).bone('head'), { color: C.mouth, roughness: 0.6 });

      // ------------------------------------------------------------------ tail fan
      if (kind.tail !== false) {
        const fan = sdf.smoothUnion(
          0.01,
          ...[-44, -22, 0, 22, 44].map((a) =>
            sdf
              .ellipsoid([0.04, 0.012, 0.1])
              .at(0, 0, -0.09)
              .rotateX(-18)
              .rotateY(a)
              .at(...TAIL_AT),
          ),
        );
        k.body('tail-fan', fan.bone('tail'), { color: kind.tailSlot ? k.tint(kind.tailSlot) : T.wings, roughness: 0.85 });
      }

      // ------------------------------------------------------------------ wings (the griffin's)
      const armAt = (u: number): [number, number] =>
        u < 0.5 ? [ELBOW[0] * u * 2, ELBOW[1] * u * 2] : [ELBOW[0] + (WRIST[0] - ELBOW[0]) * (u - 0.5) * 2, ELBOW[1] + (WRIST[1] - ELBOW[1]) * (u - 0.5) * 2];
      const feather = (x: number, y: number, dirDeg: number, len: number, w: number, z: number, thick = 0.01) => {
        const a = dirDeg * DEG;
        return sdf
          .ellipsoid([w, len / 2, thick])
          .rotateZ(dirDeg - 90)
          .at(x + (Math.cos(a) * len) / 2, y + (Math.sin(a) * len) / 2, z);
      };
      const arm = sdf.chain(
        [
          [0, 0, 0, 0.05],
          [ELBOW[0], ELBOW[1], 0, 0.038],
          [WRIST[0], WRIST[1], 0, 0.03],
          [WRIST[0] + 0.04, WRIST[1] + 0.05, 0, 0.018],
        ],
        0.02,
      );
      const coverts = sdf.smoothUnion(
        0.012,
        ...[0.15, 0.35, 0.55, 0.75, 0.95].map((u, i) => {
          const [x, y] = armAt(u);
          return feather(x, y - 0.01, -78 + i * 7, 0.16 + i * 0.012, 0.05, 0, 0.02);
        }),
        ...[0.25, 0.5, 0.75, 1].map((u, i) => {
          const [x, y] = armAt(u);
          return feather(x, y, -60 + i * 8, 0.09, 0.045, 0, 0.021);
        }),
      );
      const flight = sdf.smoothUnion(
        0.008,
        ...[0.2, 0.45, 0.7, 0.92].map((u, i) => {
          const [x, y] = armAt(u);
          return feather(x, y - 0.02, -82 + i * 8, 0.2 + i * 0.03, 0.055, -0.004);
        }),
        ...[48, 22, -4, -30, -56].map((d, i) => feather(WRIST[0] - 0.01, WRIST[1] - 0.01, d, 0.27 - Math.abs(i - 1.5) * 0.025, 0.058, -0.006)),
      );
      const wingPose = (s: sdf.Shape) => s.rotateZ(REST).scale(WS).rotateY(TURN).at(...WING_ROOT);
      k.body('wingArms', pair(wingPose(arm).bone('wing.L')), { color: T.body, roughness: 0.8 });
      k.body('coverts', pair(wingPose(coverts).bone('wing.L')), { color: T.wings, roughness: 0.85 });
      k.body('flight', pair(wingPose(flight).bone('wing.L')), { color: T.flight, roughness: 0.85 });
      kind.extra?.(k, bird);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      type Rot = readonly [number, number, number];
      type P = Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>;
      const anim = (name: string, def: AnimationDef) =>
        k.animation(name, kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def);

      // Ground contact: the feet are on `foot` bones; motion.plant sets the hips height so the
      // lowest sole point (the pad and the toe tips) rests on the ground.
      const sole = (s: 1 | -1): V3[] => {
        const pts: V3[] = [];
        for (const t of TOES) {
          const tip = toeTip(t);
          pts.push([tip[0] * s, 0, tip[2]], [tip[0] * s, 0.004, tip[2] + (t[1] > 0 ? 0.03 : -0.03)]);
        }
        for (let a = 0; a < 360; a += 45) pts.push([(ANKLE[0] + 0.04 * Math.cos(a * DEG)) * s, 0.004, ANKLE[2] + 0.01 + 0.042 * Math.sin(a * DEG)]);
        return pts;
      };
      const LEGS = (['L', 'R'] as const).map((side) => {
        const s = side === 'L' ? 1 : -1;
        const m = (p: V3): V3 => [p[0] * s, p[1], p[2]];
        return { bones: ['hips', `leg.${side}`, `shin.${side}`, `foot.${side}`], joints: [HIPS_AT, m(HIP), m(KNEE), m(ANKLE)], sole: sole(s) };
      });
      const plant = (pose: P) =>
        motion.plant(LEGS.map((l) => ({ joints: l.joints, rotations: l.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const)), sole: l.sole })));
      /**
       * A leg pose in world terms: the thigh swings (+ back) from straight down whatever the hips
       * pitch, the knee bends (+ back), and the foot stays level (plus `toe`).
       */
      const leg = (pose: P, side: 'L' | 'R', thigh: number, knee: number, toe = 0) => {
        pose[`leg.${side}`] = { rotate: [thigh - (pose.hips?.rotate?.[0] ?? 0), 0, 0] };
        pose[`shin.${side}`] = { rotate: [knee, 0, 0] };
        pose[`foot.${side}`] = { rotate: [-thigh - knee + toe, 0, 0] };
      };

      // The wings: a turn about Z (frontal plane) from the rest pose, or the griffin's flight turn.
      const spread = (armDeg: number): Rot => [0, 0, armDeg - ARM_DEG - REST];
      const wingsAt = (pose: P, l: Rot) => {
        pose['wing.L'] = { rotate: l };
        pose['wing.R'] = { rotate: [l[0], -l[1], -l[2]] };
      };
      const armRest = (ARM_DEG + REST) * DEG;
      const REST_DIR: V3 = [Math.cos(armRest) * Math.cos(TURN * DEG), Math.sin(armRest), -Math.cos(armRest) * Math.sin(TURN * DEG)];
      const REST_UP: V3 = [Math.sin(TURN * DEG), 0, Math.cos(TURN * DEG)];
      const flightWing = (parents: readonly Rot[], phi: number, sweep: number): Rot => {
        const r = phi * DEG;
        return motion.orient(parents as [number, number, number][], { dir: REST_DIR, up: REST_UP }, { dir: [Math.cos(r), Math.sin(r), -sweep], up: [Math.sin(r), -Math.cos(r), 0] });
      };
      const restArm = ARM_DEG + REST; // the arm's angle above the horizontal at rest

      // Idle: breathing, a look to each side with a head tilt, a tail flick, and a wing shuffle.
      anim('idle', {
        duration: 2.4,
        pose: (_t, p) => {
          const pose: P = {
            spine: { move: [0, 0.004 * bump(p, 2), 0] },
            neck: { rotate: [2 * bump(p, 2), 10 * wave(p, 1, 0.1), 0] },
            head: { rotate: [-3 * wave(p, 2, 0.2), 14 * keys(p, [[0, 0], [0.15, 1], [0.4, 1], [0.55, -1], [0.8, -1], [1, 0]]), 6 * wave(p, 1, 0.3)] },
            tail: { rotate: [6 * wave(p, 2), 10 * wave(p, 1, 0.3), 0] },
          };
          wingsAt(pose, spread(restArm + 4 * bump(p, 2)));
          return pose;
        },
      });

      // Walk: a waddle; the body rolls over the planted foot, the head bobs, and the tail sways.
      anim('walk', {
        duration: 0.7,
        pose: (_t, p) => {
          const a = wave(p);
          const pose: P = {
            hips: { rotate: [0, 4 * a, 6 * a] },
            spine: { rotate: [3 * wave(p, 2), 0, -3 * a] },
            neck: { rotate: [6 * wave(p, 2, 0.1), 0, 0] },
            head: { rotate: [-6 * wave(p, 2, 0.1), -4 * a, 0] },
            tail: { rotate: [4 * wave(p, 2), 14 * a, 0] },
          };
          for (const [side, s] of [['L', 1], ['R', -1]] as const) {
            const lift = Math.max(0, s * wave(p, 1, 0.25));
            leg(pose, side, -24 * s * a - 22 * lift, 34 * lift);
          }
          wingsAt(pose, spread(restArm + 6 * Math.abs(a)));
          pose.hips = { ...pose.hips, move: [0, plant(pose), 0] };
          return pose;
        },
      });

      // Fly: lifted and tilted forward, full wing beats, the legs tucked back, the tail low.
      const FLY_Y = 0.35;
      const air = (p: number, cycles: number, o: { pitch?: number; amp?: number; head?: number; jaw?: number; reach?: number; lift?: number; z?: number } = {}): P => {
        const amp = o.amp ?? 1;
        const beat = amp * wave(p, cycles);
        const rise = amp * wave(p, cycles, 0.25);
        const pitch = 14 + (o.pitch ?? 0);
        const hips: Rot = [pitch, 0, 0];
        const wl = flightWing([hips, [0, 0, 0]], 8 + 40 * beat, 0.12);
        const reach = o.reach ?? 0;
        const pose: P = {
          hips: { move: [0, FLY_Y + 0.03 * rise + (o.lift ?? 0), o.z ?? 0], rotate: hips },
          neck: { rotate: [-6, 0, 0] },
          head: { rotate: [(o.head ?? 0) - pitch + 6 - 2 * rise, 0, 0] },
          jaw: { rotate: [26 * (o.jaw ?? 0), 0, 0] },
          tail: { rotate: [-10 + 6 * wave(p, cycles, 0.4), 6 * wave(p, cycles, 0.3), 0] },
        };
        for (const side of ['L', 'R'] as const) {
          pose[`leg.${side}`] = { rotate: [40 - 70 * reach, 0, 0] };
          pose[`shin.${side}`] = { rotate: [50 - 40 * reach, 0, 0] };
          pose[`foot.${side}`] = { rotate: [40 - 60 * reach, 0, 0] };
        }
        wingsAt(pose, wl);
        return pose;
      };
      anim('fly', { duration: 0.6, pose: (_t, p) => air(p, 1) });

      // Attack, on the ground: it rears back with the wings spread high and the beak open, lunges
      // forward and down to peck (the beak snaps shut), and recovers.
      anim('attack', {
        duration: 0.9,
        loop: false,
        pose: (_t, p) => {
          const back = keys(p, [[0, 0], [0.3, 1], [0.38, 1], [0.5, -1.2], [0.62, -1.1], [1, 0]]);
          const open = keys(p, [[0, 0], [0.25, 1], [0.42, 1], [0.48, 0], [1, 0]]);
          const wings = keys(p, [[0, 0], [0.28, 1], [0.4, 1], [0.52, 0.3], [1, 0]]);
          const pose: P = {
            hips: { rotate: [-12 * back, 0, 0] },
            spine: { rotate: [-6 * back, 0, 0] },
            neck: { rotate: [-14 * back, 0, 0] },
            head: { rotate: [-8 * back, 0, 0] },
            jaw: { rotate: [30 * open, 0, 0] },
            tail: { rotate: [10 * back, 0, 0] },
          };
          for (const side of ['L', 'R'] as const) leg(pose, side, 0, 0);
          wingsAt(pose, spread(restArm + (70 - restArm) * wings));
          pose.hips = { ...pose.hips, move: [0, plant(pose), -0.03 * back] };
          return pose;
        },
      });

      // Hit: a jolt back, the head thrown back, the wings flared; then back to rest.
      anim('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const s = keys(p, [[0, 0], [0.16, 1], [0.36, 0.8], [1, 0]]);
          const pose: P = {
            hips: { rotate: [-10 * s, 0, 0] },
            neck: { rotate: [-12 * s, 0, 0] },
            head: { rotate: [-16 * s, 8 * s * wave(p, 3), 0] },
            jaw: { rotate: [20 * s, 0, 0] },
            tail: { rotate: [-12 * s, 0, 0] },
          };
          for (const side of ['L', 'R'] as const) leg(pose, side, 0, 0);
          wingsAt(pose, spread(restArm + (50 - restArm) * 0.7 * s));
          pose.hips = { ...pose.hips, move: [0, plant(pose), -0.04 * s] };
          return pose;
        },
      });

      // Death: a cry with the wings flared, then the legs fold and the body drops onto its belly,
      // the wings fall open and droop, and the head sinks to the ground.
      const BELLY_DROP = 0.13;
      anim('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const cry = keys(p, [[0, 0], [0.12, 1], [0.26, 1], [0.36, 0]]);
          const give = keys(p, [[0.24, 0], [0.55, 1]]);
          const drop = keys(p, [[0.28, 0], [0.55, 1], [0.6, 0.94], [0.66, 1]]);
          const slump = keys(p, [[0.45, 0], [0.75, 1]]);
          const wings = keys(p, [[0.3, 0], [0.65, 1]]);
          const pose: P = {
            hips: { rotate: [8 * drop, 0, 0] },
            spine: { rotate: [-6 * cry, 0, 0] },
            neck: { rotate: [-16 * cry + 40 * slump, 0, 0] },
            head: { rotate: [-20 * cry + 20 * slump, 0, 28 * slump] },
            jaw: { rotate: [26 * cry, 0, 0] },
            tail: { rotate: [-10 * give, 0, 0] },
          };
          for (const side of ['L', 'R'] as const) leg(pose, side, -50 * give, 100 * give, 0);
          const flare = restArm + (60 - restArm) * cry;
          wingsAt(pose, spread(flare + (10 - flare) * wings));
          pose.hips = { ...pose.hips, move: [0, Math.max(-BELLY_DROP * drop, plant(pose)), 0] };
          return pose;
        },
      });
    },
  });
}
