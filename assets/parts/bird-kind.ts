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

/**
 * Feather relief for a bump map: rows of round feather tips that overlap downward (each row is
 * thickest at its lower edge, and the edge curves down in the middle of each feather). `cell` is the
 * feather width in meters.
 */
function scallops(amp: number, cell: number, center: V3) {
  return (x: number, y: number, z: number): number => {
    const t = -y / cell;
    const row = Math.floor(t + 0.3);
    const s = (Math.atan2(x - center[0], z - center[2]) * 0.2) / cell + (row & 1) * 0.5 + 0.25 * noise.random(row, 0, 7);
    const col = Math.floor(s);
    const u = s - col - 0.5;
    // Each feather's tip sits a little higher or lower, so the rows are not regular.
    const w = t + 1.4 * u * u + 0.25 * noise.random(row, col, 3);
    const f = w - Math.floor(w);
    return amp * f * f;
  };
}

// The legs (left): a short feathered thigh, a scaly shin, and a foot flat on the ground. With a
// shorter `legLength` the knee comes down towards the ankle and the body comes down with it.
const ANKLE: V3 = [0.09, 0.055, 0.0];
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
  /** The body radii (default [0.2, 0.24, 0.2]); the body bottom stays at 0.16 m (lower with shorter legs). */
  readonly body?: V3;
  /** Moves the head forward (and a little down) over the chest, in meters (default 0). */
  readonly headForward?: number;
  /** Raise the head this far (meters) on a longer neck (default 0). */
  readonly headLift?: number;
  /** The head radius (default 0.13). */
  readonly head?: number;
  /** A hooked raptor beak (default) or a short straight beak. */
  readonly beak?: 'hook' | 'short';
  /** The size of the beak and the mouth about the beak root (default 1). */
  readonly beakScale?: number;
  /** A dark tip on the upper beak in this color, with the beak color left as a cere at the root (default none). */
  readonly beakTip?: string;
  /** Opens the lower beak at rest (degrees; default 0), for a happy open smile. */
  readonly beakOpen?: number;
  /** Turns the beak down about its root (degrees; default 0). */
  readonly beakDroop?: number;
  /** The beak colors (upper with the brows, lower; default the leg colors `scale` and `scaleDark`). */
  readonly beakColors?: readonly [string, string];
  /** Brow ridges over the eyes in the beak color (default), in the head color, or none. */
  readonly brows?: 'beak' | 'head' | false;
  /** Paint the eyes after the kind's `paint` (default false), so a face patch does not cover them. */
  readonly eyesOverPaint?: boolean;
  /** Heavy lids in the head color over the top of each eye, for a stern look: the lid edge height
   * above the eye center as a share of the eye radius (default none). The edge falls toward the beak. */
  readonly lids?: number;
  /** The height of the brows over the eyes as a share of the default (default 1; lower for big eyes). */
  readonly browLift?: number;
  /** The thickness of the brows as a share of the default (default 1). */
  readonly browSize?: number;
  /** The size of the painted eyes as a share of the default. */
  readonly eyeScale?: number;
  /** The distance between the eyes as a share of the default (default 1). */
  readonly eyeSpread?: number;
  /** Moves the eyes up by this share of the head radius (default 0). */
  readonly eyeLift?: number;
  /** The wings at rest, turned about their root in the frontal plane (degrees; 0 = raised, -100 = down by the body). */
  readonly wingRest?: number;
  /** The size of the wings (default 1). */
  readonly wingScale?: number;
  /** The wings' turn about Y at rest (degrees; 14 = the griffin's, about -40 = folded with the face out and forward, about 80 = folded back along the body). */
  readonly wingTurn?: number;
  /** Moves the wings out from the body at rest (meters; default 0), so a wing folded along the side lies on the body. */
  readonly wingOut?: number;
  /** The visible leg length as a share of the default (default 1; 0.5 = short legs, the body lower). */
  readonly legLength?: number;
  /** The wing build: an arm with layered feathers (default), or a solid round paddle of feathers (a small chibi bird). */
  readonly wingStyle?: 'feathers' | 'paddle';
  /** The end of a paddle wing: three round feather tips (default), or one smooth round tip. */
  readonly wingTips?: 'feathers' | 'smooth';
  /** The paddle wing's width as a share (default 1); a slimmer wing is also longer (a falcon's long narrow wings). */
  readonly wingSlim?: number;
  /** The neck thickness as a share of the default (default 1; about 1.4 merges the head into the body). */
  readonly neckScale?: number;
  /** The size of the round cheeks low on the head as a share of the default (default 1; 0 = a plain round head). */
  readonly cheeks?: number;
  /** A smooth blend between the head and the top of the neck (meters; default none), so no crease shows at the cheeks. */
  readonly headBlend?: number;
  /** One smooth body: the head plumage blends into the body with this fillet (meters), so no step shows at the neck (a chicken's pear shape). */
  readonly oneBody?: number;
  /** A smooth clay surface: no noise bump on the body and the head (feather relief still applies where `featherOn` asks for it). */
  readonly clay?: boolean;
  /** Dark talons on the toes (default true; false = round toes, a small songbird or a chick). */
  readonly talons?: boolean;
  /** The dark mouth between the beak halves (default true; false = a closed beak). */
  readonly mouth?: boolean;
  /** The painted eyes: a dark rim round a colored iris (default), a small dark bead, or a white eye with a colored iris. */
  readonly eyeStyle?: 'ring' | 'bead' | 'white';
  /** The iris and the pupil of a white eye as a share of the default (default 1; smaller shows more white). */
  readonly irisScale?: number;
  /** The size of the white glint in the eye as a share of the default (default 1). */
  readonly glint?: number;
  /** Feather relief in the normal map on the body, the head, and the wings: the height of each scallop row (meters; default 0). */
  readonly featherBump?: number;
  /** Where the feather relief goes (default: the body, the head, and the wings). */
  readonly featherOn?: { readonly body?: boolean; readonly head?: boolean; readonly wings?: boolean };
  /** The feather size as a share of the default (default 1; larger for big sculpted feather clumps). */
  readonly featherCell?: number;
  /** The beak width as a share of its size (default 1; more for a short wide beak). */
  readonly beakWidth?: number;
  /** A livelier walk: a head bob and a small wing flutter, as a share (default 0). */
  readonly walkBob?: number;
  /** The neck bone stays still in the idle, walk, attack, and hit clips and the head takes its turn, so a bib, collar, or neck band on the chest never sinks into the body (default false). */
  readonly stillNeck?: boolean;
  /** The size of the belly patch as a share of the default (default 1). */
  readonly bellySize?: number;
  /** The chest width as a share of the body width (default 1; less for a pear shape with narrow shoulders). */
  readonly pear?: number;
  /** Dark bars across the paddle wings: the color and the places along the wing (0 = root, 0.4 = tip). */
  readonly wingBars?: { readonly color: string; readonly at: readonly number[] };
  /** A dark tip on the tail fan in this color (default none). */
  readonly tailTip?: string;
  /** A fan of tail feathers (default), or none (the kind builds its own tail on the `tail` bone). */
  readonly tail?: 'fan' | false;
  /** The slot of the tail fan color (default `wings`). */
  readonly tailSlot?: string;
  /** Extra bones (a serpent tail, a crest). */
  readonly bones?: Record<string, { parent: string; at: V3; tail?: V3 }>;
  /** Paint on the head plumage (a mask, cheek patches). */
  paint?(plumage: sdf.Shape, bird: BirdShape): sdf.Shape;
  /** Paint on the body plumage (a bib, a cape edge), with the trunk and the joints. */
  paintBody?(body: sdf.Shape, bird: { readonly trunk: sdf.Shape; readonly joints: { readonly BODY_C: V3; readonly HEAD_C: V3; readonly HR: number; readonly B: V3 }; tone(slot: string, color: string, follow?: number): string; readonly tint: { readonly head: string; readonly body: string } }): sdf.Shape;
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
  /** The front point of the left painted eye, and its size factor (the iris radius is 0.031 * scale). */
  readonly eye: { readonly at: V3; readonly scale: number };
  readonly tint: { readonly body: string; readonly head: string; readonly wings: string; readonly eye: string; readonly belly: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function birdAsset(kind: BirdKind): AssetDefinition {
  const C = { ...BIRD_COLORS, ...kind.colors };
  const B: V3 = kind.body ?? [0.2, 0.24, 0.2];
  const HR = kind.head ?? 0.13;
  const DROP = 0.085 * (1 - (kind.legLength ?? 1));
  const HIP: V3 = [0.085, 0.24 - DROP, -0.01];
  const KNEE: V3 = [0.09, 0.14 - DROP, 0.02];
  const HIPS_AT: V3 = [0, 0.26 - DROP, -0.02];
  const BODY_C: V3 = [0, 0.16 - DROP + B[1], 0];
  const HEAD_C: V3 = [0, BODY_C[1] + B[1] * 0.78 + HR * 0.62 - (kind.headForward ?? 0) * 0.4 + (kind.headLift ?? 0), 0.03 + (kind.headForward ?? 0)];
  const TAIL_AT: V3 = [0, BODY_C[1] - B[1] * 0.3, -B[2] * 0.82];
  const WING_ROOT: V3 = [B[0] * 0.72, BODY_C[1] + B[1] * 0.4, -0.03];
  const REST = kind.wingRest ?? 0;
  const WS = 1.12 * (kind.wingScale ?? 1);
  const TURN = kind.wingTurn ?? 14;
  const FB = kind.featherBump ?? 0;
  const FC = kind.featherCell ?? 1;
  const FON = { body: kind.featherOn?.body ?? true, head: kind.featherOn?.head ?? true, wings: kind.featherOn?.wings ?? true };
  const BELLY = kind.bellySize ?? 1;
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
      const HEAD_AT: V3 = [0, HEAD_C[1] - HR * 0.55, HEAD_C[2]];
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
      const chest = sdf.ellipsoid([B[0] * (kind.pear ?? 1), B[1] * 0.75, B[2]]).at(BODY_C[0], BODY_C[1] + B[1] * 0.25, BODY_C[2] + 0.01);
      const belly = sdf.ellipsoid([B[0] * 0.96, B[1] * 0.7, B[2] * 0.96]).at(BODY_C[0], BODY_C[1] - B[1] * 0.3, BODY_C[2] - 0.01);
      const neck = sdf.capsule(NECK_AT, [0, HEAD_C[1] - HR * 0.3, HEAD_C[2]], HR * 0.66 * (kind.neckScale ?? 1));
      const trunk = sdf.smoothUnion(0.08, chest.bone('spine'), belly.bone('hips')).smoothUnion(0.05, neck.bone('neck'));
      const thigh = sdf.cone(HIP, KNEE, 0.068, 0.05).bone('leg.L');
      const bodyShape = trunk
        .smoothUnion(0.03, pair(thigh))
        .paintWhere(sdf.ellipsoid([B[0] * 0.62 * BELLY, B[1] * 0.72 * BELLY, B[2] * 0.5]).at(0, BODY_C[1] - B[1] * 0.12, BODY_C[2] + B[2] * 0.62), T.belly, 0.05);
      const bodyFinal = kind.paintBody ? kind.paintBody(bodyShape, { trunk, joints: { BODY_C, HEAD_C, HR, B }, tone, tint: { head: T.head, body: T.body } }) : bodyShape;
      const bodyLook = {
        color: T.body,
        roughness: 0.8,
        textureDensity: 1.4,
        ...(FB && FON.body ? { bump: scallops(FB, 0.06 * FC, BODY_C) } : kind.clay ? {} : { bump: (x: number, y: number, z: number) => 0.0007 * noise.fbm(x * 60, y * 40, z * 60, 2) }),
      };
      if (!kind.oneBody) k.body('body', bodyFinal, bodyLook);

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
      if (kind.talons !== false) k.body('talons', pair(talons), { color: C.talon, roughness: 0.35, detail: 0.003 });

      // ------------------------------------------------------------------ head: plumage and painted eyes
      const skull =
        kind.cheeks === 0
          ? sdf.ellipsoid([HR, HR * 0.95, HR * 0.92]).at(...HEAD_C)
          : sdf.smoothUnion(
              0.04,
              sdf.ellipsoid([HR, HR * 0.95, HR * 0.92]).at(...HEAD_C),
              pair(sdf.sphere(HR * 0.45 * (kind.cheeks ?? 1)).at(HR * 0.5, HEAD_C[1] - HR * 0.42, HEAD_C[2] + HR * 0.42)), // cheeks
            );
      const faceHit = (x: number, y: number): V3 => sdf.raycast(skull, [x, y, 2], [0, 0, -1])! as V3;
      const topHit = (x: number, z: number): V3 => sdf.raycast(skull, [x, 2, z], [0, -1, 0])! as V3;
      const es = (kind.eyeScale ?? 1) * (HR / 0.13);
      const EYE_X = HR * 0.5 * (kind.eyeSpread ?? 1);
      const EYE_Y = HEAD_C[1] + HR * (0.1 + (kind.eyeLift ?? 0));
      const eL = faceHit(EYE_X, EYE_Y);
      const disc = (r: number, dx = 0, dy = 0) => pair(sdf.cylinder(r, 1).rotateX(90).at(eL[0] + dx, eL[1] + dy, 0));
      const front = sdf.halfSpace([0, 0, -1], -HEAD_C[2]);
      // The head color reaches down over the top of the neck.
      const headNeck = neck.intersect(sdf.halfSpace([0, -1, 0], -(HEAD_C[1] - HR * 1.15)));
      const eyeStyle = kind.eyeStyle ?? 'ring';
      const plumageShape = kind.headBlend ? sdf.smoothUnion(kind.headBlend, skull.bone('head'), headNeck.round(0.004).bone('neck')) : sdf.union(skull.bone('head'), headNeck.round(0.004).bone('neck'));
      // In one body the head keeps its own color as paint.
      const plumagePlain = kind.oneBody ? plumageShape.paint(T.head) : plumageShape;
      // The painted eyes (and the lids). With `eyesOverPaint` they go on after the kind's paint.
      const paintEyes = (s0: sdf.Shape): sdf.Shape => {
        let sh = s0;
        if (eyeStyle === 'bead') {
          // A small dark bead with one glint.
          sh = sh
            .paintWhere(disc(0.024 * es).intersect(front), C.pupil, 0.002)
            .paintWhere(pair(sdf.sphere(0.007 * es * (kind.glint ?? 1)).at(eL[0] + 0.008 * es, eL[1] + 0.009 * es, eL[2])), '#ffffff', 0.002);
        } else {
          const white = eyeStyle === 'white';
          const IS = kind.irisScale ?? 1;
          sh = sh.paintWhere(disc(0.038 * es).intersect(front), C.eyeRim, 0.002);
          if (white) sh = sh.paintWhere(disc(0.034 * es).intersect(front), '#fbf8f0', 0.002);
          sh = sh
            .paintWhere(disc((white ? 0.024 * IS : 0.031) * es).intersect(front), T.eye, 0.002)
            .paintWhere(disc((white ? 0.015 * IS : 0.017) * es, -0.003 * es, -0.002 * es).intersect(front), C.pupil, 0.002)
            .paintWhere(pair(sdf.sphere(0.008 * es * (kind.glint ?? 1)).at(eL[0] + 0.011 * es, eL[1] + 0.013 * es, eL[2])), '#ffffff', 0.002);
        }
        if (kind.lids !== undefined) {
          // The lid edge: a line through the eye, lower at the inner end.
          const r = 0.04 * es;
          const th = 16 * DEG;
          const h = kind.lids * r;
          const offset = -(Math.cos(th) * (eL[1] + h) - Math.sin(th) * eL[0]);
          const lid = sdf.cylinder(r, 1).rotateX(90).at(eL[0], eL[1], 0).intersect(sdf.halfSpace([Math.sin(th), -Math.cos(th), 0], offset));
          sh = sh.paintWhere(pair(lid).intersect(front), T.head, 0.003);
        }
        return sh;
      };
      const plumageBase = kind.eyesOverPaint ? plumagePlain : paintEyes(plumagePlain);
      const bird: BirdShape = {
        trunk,
        skull,
        faceHit,
        topHit,
        joints: { BODY_C, HEAD_C, HR, B, TAIL_AT, WING_ROOT },
        eye: { at: eL, scale: es },
        tint: { body: T.body, head: T.head, wings: T.wings, eye: T.eye, belly: T.belly },
        tone,
      };
      const painted = kind.paint ? kind.paint(plumageBase, bird) : plumageBase;
      const plumageFinal = kind.eyesOverPaint ? paintEyes(painted) : painted;
      if (kind.oneBody) {
        k.body('body', sdf.smoothUnion(kind.oneBody, bodyFinal, plumageFinal), { ...bodyLook, textureDensity: 2 });
      } else {
        k.body('plumage', plumageFinal, {
          color: T.head,
          roughness: 0.85,
          textureDensity: 2,
          ...(FB && FON.head ? { bump: scallops(FB * 0.8, 0.045 * FC, HEAD_C) } : kind.clay ? {} : { bump: (x: number, y: number, z: number) => 0.0006 * noise.fbm(x * 50, y * 50, z * 50, 2) }),
        });
      }

      // ------------------------------------------------------------------ beak, brows, mouth
      const bb = faceHit(0, BEAK_Y);
      const bz = bb[2];
      const hook = kind.beak !== 'short';
      const bsc = kind.beakScale ?? 1;
      const droop = kind.beakDroop ?? 0;
      const bw = kind.beakWidth ?? 1;
      const beakSize = (s: sdf.Shape) => (bsc === 1 && !droop && bw === 1 ? s : s.at(0, -BEAK_Y, -bz).scale(bw === 1 ? bsc : [bsc * bw, bsc, bsc]).rotateX(droop).at(0, BEAK_Y, bz));
      const upperBeakShape = hook
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
      const BL = kind.browLift ?? 1;
      const BS = kind.browSize ?? 1;
      const browAt = (x: number, y: number): V3 => {
        const h = faceHit(x, y);
        return [h[0], h[1], h[2] - 0.006];
      };
      const browShape = () => pair(
        sdf.chain(
          [
            [...browAt(EYE_X * 0.4, EYE_Y + 0.0 * es * BL), 0.016 * es * BS],
            [...browAt(EYE_X * 0.85, EYE_Y + 0.04 * es * BL), 0.018 * es * BS],
            [...browAt(EYE_X * 1.35, EYE_Y + 0.045 * es * BL), 0.014 * es * BS],
          ],
          0.01,
        ),
      );
      const browKind = kind.brows ?? 'beak';
      const [beakUpper, beakLower] = kind.beakColors ?? [C.scale, C.scaleDark];
      // A dark tip on the upper beak, in front of a light cere at its root.
      const upperBeak = kind.beakTip ? beakSize(upperBeakShape.paintWhere(sdf.box([1, 1, 1]).at(0, BEAK_Y, bz + HR * 0.22 + 0.5), kind.beakTip, 0.006)) : beakSize(upperBeakShape);
      k.body('beak', (browKind === 'beak' ? sdf.union(upperBeak, browShape()) : upperBeak).bone('head'), { color: beakUpper, roughness: 0.4, textureDensity: 1.5 });
      if (browKind === 'head') k.body('brows', browShape().bone('head'), { color: T.head, roughness: 0.85 });
      const lowerBeakShape = hook
        ? sdf.ellipsoid([HR * 0.3, HR * 0.13, HR * 0.36]).at(0, BEAK_Y - HR * 0.3, bz + HR * 0.3)
        : sdf.cone([0, -HR * 0.2, -HR * 0.05], [0, -HR * 0.26, HR * 0.4], HR * 0.16, HR * 0.02).scale([1.15, 1, 1]).at(0, BEAK_Y + (kind.mouth === false ? HR * 0.06 : 0), bz);
      // An open beak at rest (a happy open smile): the lower half turned down about the jaw joint.
      const JAW_AT: V3 = [0, BEAK_Y - HR * 0.15, HEAD_C[2] + HR * 0.75];
      const lowerBeak = kind.beakOpen ? beakSize(lowerBeakShape).at(0, -JAW_AT[1], -JAW_AT[2]).rotateX(kind.beakOpen).at(0, JAW_AT[1], JAW_AT[2]) : beakSize(lowerBeakShape);
      k.body('jawBeak', lowerBeak, { color: beakLower, roughness: 0.4, bone: 'jaw' });
      if (kind.mouth !== false) k.body('mouth', beakSize(sdf.ellipsoid([HR * 0.3, HR * 0.14, HR * 0.3]).at(0, BEAK_Y - HR * 0.2, bz + HR * 0.12)).bone('head'), { color: C.mouth, roughness: 0.6 });

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
        const tipped = kind.tailTip ? fan.paintWhere(sdf.box([1, 1, 1]).at(...TAIL_AT).subtract(sdf.sphere(0.135).at(...TAIL_AT)), kind.tailTip, 0.01) : fan;
        k.body('tail-fan', tipped.bone('tail'), { color: kind.tailSlot ? k.tint(kind.tailSlot) : T.wings, roughness: 0.85 });
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
      const wingPose = (s: sdf.Shape) => s.rotateZ(REST).scale(WS).rotateY(TURN).at(WING_ROOT[0] + (kind.wingOut ?? 0), WING_ROOT[1], WING_ROOT[2]);
      if (kind.wingStyle === 'paddle') {
        // A solid paddle along the arm, with three round feather tips at its end in the flight color.
        const along = (s: sdf.Shape, u: number, v: number) => s.rotateZ(ARM_DEG).at(u * Math.cos(ARM_DEG * DEG) - v * Math.sin(ARM_DEG * DEG), u * Math.sin(ARM_DEG * DEG) + v * Math.cos(ARM_DEG * DEG), 0);
        const SLIM = kind.wingSlim ?? 1;
        const LONG = 1 + (1 - SLIM) * 0.8;
        let paddle = along(sdf.ellipsoid([0.2 * LONG, 0.115 * SLIM, 0.03]), 0.17 * LONG, -0.04);
        if (kind.wingBars) for (const u of kind.wingBars.at) paddle = paddle.paintWhere(along(sdf.box([0.022, 0.4, 0.2]), u, 0), kind.wingBars.color, 0.004);
        const tips =
          kind.wingTips === 'smooth'
            ? along(sdf.ellipsoid([0.085, 0.072 * SLIM, 0.024]), 0.3 * LONG, -0.035)
            : sdf.smoothUnion(0.01, ...[-0.06, -0.01, 0.04].map((v, i) => along(sdf.ellipsoid([0.075, 0.038, 0.02]).rotateZ(-12 + i * 12), 0.33 * LONG - Math.abs(v) * 0.5, (v - 0.03) * SLIM)));
        k.body('coverts', pair(wingPose(paddle).bone('wing.L')), { color: T.wings, roughness: 0.85, ...(FB && FON.wings ? { bump: scallops(FB, 0.05 * FC, [0, 0, 0]) } : {}) });
        k.body('flight', pair(wingPose(tips).bone('wing.L')), { color: T.flight, roughness: 0.85 });
      } else {
        k.body('wingArms', pair(wingPose(arm).bone('wing.L')), { color: T.body, roughness: 0.8 });
        k.body('coverts', pair(wingPose(coverts).bone('wing.L')), { color: T.wings, roughness: 0.85 });
        k.body('flight', pair(wingPose(flight).bone('wing.L')), { color: T.flight, roughness: 0.85 });
      }
      kind.extra?.(k, bird);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      type Rot = readonly [number, number, number];
      type P = Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>;
      const STILL_NECK = new Set(['idle', 'walk', 'attack', 'hit']);
      const stillNeck = (pose: Record<string, BonePose>): Record<string, BonePose> => {
        const n = pose.neck?.rotate;
        if (!n) return pose;
        const h = pose.head?.rotate ?? [0, 0, 0];
        return { ...pose, neck: { ...pose.neck, rotate: [0, 0, 0] }, head: { ...pose.head, rotate: [h[0] + n[0], h[1] + n[1], h[2] + n[2]] } };
      };
      const anim = (name: string, def: AnimationDef) => {
        const merged: AnimationDef = kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def;
        k.animation(name, kind.stillNeck && STILL_NECK.has(name) ? { ...merged, pose: (t, p) => stillNeck(merged.pose(t, p)) } : merged);
      };

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
        // A paddle wing turns its broad face forward in flight, so it reads broad from the front; a
        // feathered wing lies flat in the air, as a real wing.
        const up: V3 = kind.wingStyle === 'paddle' ? [0.4 * Math.sin(r), -0.4 * Math.cos(r), 1] : [Math.sin(r), -Math.cos(r), 0];
        return motion.orient(parents as [number, number, number][], { dir: REST_DIR, up: REST_UP }, { dir: [Math.cos(r), Math.sin(r), -sweep], up });
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
          const bob = kind.walkBob ?? 0;
          const pose: P = {
            hips: { rotate: [0, 4 * a, 6 * a] },
            spine: { rotate: [3 * wave(p, 2), 0, -3 * a] },
            neck: { rotate: [(6 + 10 * bob) * wave(p, 2, 0.1), 0, 0] },
            head: { rotate: [-(6 + 8 * bob) * wave(p, 2, 0.1), -4 * a, 0] },
            tail: { rotate: [4 * wave(p, 2), 14 * a, 0] },
          };
          for (const [side, s] of [['L', 1], ['R', -1]] as const) {
            const lift = Math.max(0, s * wave(p, 1, 0.25));
            leg(pose, side, -24 * s * a - 22 * lift, 34 * lift);
          }
          wingsAt(pose, spread(restArm + 6 * Math.abs(a) + 14 * (kind.walkBob ?? 0) * bump(p, 2, 0.2)));
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
