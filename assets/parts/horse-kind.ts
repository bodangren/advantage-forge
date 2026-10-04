import { defineAsset, motion, noise, profile, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BodyOptions, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Horse kinds — the horse of `assets/horse.ts` (catalog `wildlife/land/horse`) and the fey horses
 * (the unicorn, the nightmare, the kelpie). One body, head, rig, and clip set; each kind sets the
 * palette and the slots, may drop the halter, the blaze, and the socks, may change the material of
 * the mane and the tail (fire, seaweed), and may add paint and bodies (a horn, fins). A kind may
 * also drop the head and the neck and add its own upper body on extra bones (the centaur). The
 * design notes of the body, the rig, and the clips are in `assets/horse.ts`.
 */

const HORSE_COLORS = {
  coat: '#a95f36',
  coatDark: '#84442a', // ear insides and brows
  muzzle: '#f0d6be',
  white: '#f6efe4', // blaze and socks
  mane: '#4a2e24',
  hoof: '#3c2820',
  leather: '#553020',
  buckle: '#7a4c30',
  nostril: '#4a2a22',
  sclera: '#fbf8f2',
  eye: '#2a1a12',
  pupil: '#0a0706',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (v: V3): V3 => [-v[0], v[1], v[2]];
const RAD = Math.PI / 180;

// Joint positions (rest pose). Straight sturdy legs: each knee sits right under its shoulder or hip.
export const HIPS_AT: V3 = [0, 0.5, -0.24];
export const SPINE_AT: V3 = [0, 0.52, 0.02];
const NECK_AT: V3 = [0, 0.64, 0.1];
const HEAD_AT: V3 = [0, 0.84, 0.22];
const MANE_AT: V3 = [0, 0.95, 0.1];
const TAIL_AT: V3 = [0, 0.62, -0.43];
const SHOULDER: V3 = [0.12, 0.46, 0.15];
const FKNEE: V3 = [0.12, 0.27, 0.15];
const HIP: V3 = [0.12, 0.46, -0.3];
const BKNEE: V3 = [0.12, 0.27, -0.3];
const HOOF_DZ = 0.008; // the hoof sits a little in front of the leg line

// Body masses (also used by the ground probes of the clips).
const CHEST_C: V3 = [0, 0.5, 0.06];
const CHEST_R: V3 = [0.2, 0.18, 0.22];
const RUMP_C: V3 = [0, 0.51, -0.26];
const RUMP_R: V3 = [0.2, 0.18, 0.21];
const HEAD_C: V3 = [0, 0.9, 0.28];
const SKULL_R: V3 = [0.19, 0.18, 0.165];
const FACE_C: V3 = [0, 0.76, 0.36];
const FACE_R: V3 = [0.135, 0.165, 0.135];
const CHEEK_C: V3 = [0.1, 0.82, 0.3];
const MUZ_C: V3 = [0, 0.63, 0.44];
const MUZ_R: V3 = [0.15, 0.11, 0.125];
const THIGH_C: V3 = [0.125, 0.47, -0.3];
const THIGH_R: V3 = [0.09, 0.16, 0.13];
const SHOULDER_C: V3 = [0.125, 0.47, 0.14];
const SHOULDER_R: V3 = [0.075, 0.14, 0.1];
// The halter planes: the noseband is square to the face line (the face leans 25 degrees), the
// cheek strap runs from the noseband up behind the eye to the poll.
const NB_P: V3 = [0, 0.695, 0.42];
const NB_A = 25;
const CK_P: V3 = [0, 0.85, 0.285];
const CK_A = 28.7;

/** A horse kind: the slots, fixed colors, the tack and markings, and extra paint and bodies. */
export interface HorseKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `coat`, `mane`, and `eyes` (and one more if a kind needs it); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades (coatDark, muzzle, white, hoof, ...). */
  readonly colors?: Partial<typeof HORSE_COLORS> & { brow?: string };
  /** The halter (default true), the white blaze (default true), and the white socks (default true). */
  readonly halter?: boolean;
  readonly blaze?: boolean;
  readonly socks?: boolean;
  /** How much the muzzle follows the coat slot (the horse: 0.3). */
  readonly muzzleFollow?: number;
  /** Ear length (default 1; a donkey 1.7, a mule 1.4). */
  readonly ears?: number;
  /** Ear width (default 1; a donkey's wide ears 1.4). */
  readonly earWidth?: number;
  /** False: no forelock on the flowing mane (a kind adds its own topknot). */
  readonly forelock?: boolean;
  /** Eye size (default 1). */
  readonly eyeScale?: number;
  /** The left ear root (default [0.11, 1.03, 0.25]; a cow's side ears sit lower and wider). */
  readonly earAt?: V3;
  /** Muzzle size (default 1; a cow's wide muzzle 1.15). */
  readonly muzzleScale?: number;
  /** Ear tilt to the side in degrees (default 18; a donkey 30). */
  readonly earSpread?: number;
  /** The mane: 'flowing' locks to the side (default), 'brush' a short upright crest (a donkey, a mule), or none. */
  readonly mane?: 'flowing' | 'brush' | false;
  /** The tail: 'flowing' (default) or 'tuft', a thin coat-colored tail with a tassel at the end. */
  readonly tail?: 'flowing' | 'tuft';
  /** Material options for the mane and the tail (fire glows, seaweed shines). */
  readonly hair?: BodyOptions;
  /** Material options for the hooves. */
  readonly hooves?: BodyOptions;
  /** Material options for the eyes (a glow). */
  readonly eyes?: BodyOptions;
  /** Extra paint on the coat (dapples, scales). */
  paint?(coat: sdf.Shape, horse: HorseShape): sdf.Shape;
  /** Extra paint on the mane and the tail (a rainbow, flame tips). */
  paintHair?(hair: sdf.Shape, horse: HorseShape): sdf.Shape;
  /** Extra bodies (a horn, fins, flames on the hooves). */
  extra?(k: AssetContext, horse: HorseShape): void;
  /** False: no horse head and neck (no ears, eyes, muzzle, halter, forelock, or crest); the kind adds its own upper body (default true). */
  readonly head?: boolean;
  /** Extra bones (a rider's torso and arms), added to the skeleton. */
  readonly bones?: Record<string, { readonly parent: string; readonly at: V3; readonly tail?: V3 }>;
  /**
   * Ground probes for extra bones: points carried by `bone`, with the bones and joints from `hips`
   * down to it. The clips that rest the body on the ground (rear, neigh, death) keep them above it.
   */
  readonly probes?: readonly { readonly bone: string; readonly chain: readonly (readonly [bone: string, joint: V3])[]; readonly points: readonly V3[] }[];
  /** Poses of the extra bones in a clip (`walk`, `run`, `idle`, `rear`, `neigh`, `hit`, `death`). */
  pose?(clip: string, p: number): Record<string, BonePose>;
}

/** The horse's shapes, joints, and slot colors that a kind builds on. */
export interface HorseShape {
  /** The head with the muzzle, for surface points. */
  readonly head: sdf.Shape;
  /** The body without the neck and the legs (chest, rump, shoulders, thighs), with its bone tags: tack fits over it. */
  readonly trunk: sdf.Shape;
  /** The point where a ray from the front (+Z) meets the head (without the muzzle) at (x, y). */
  faceHit(x: number, y: number): readonly [number, number, number];
  readonly joints: { readonly FKNEE: V3; readonly BKNEE: V3; readonly HOOF_DZ: number; readonly HEAD_C: V3 };
  readonly tint: { readonly coat: string; readonly coatDark: string; readonly mane: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function horseAsset(kind: HorseKind): AssetDefinition {
  const C = { ...HORSE_COLORS, ...kind.colors };
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const T = {
        coat: k.tint('coat'),
        coatDark: k.tint('coat', { color: C.coatDark, follow: 1 }),
        brow: k.tint('coat', { color: C.brow ?? '#4e2a1a', follow: 1 }),
        muzzle: k.tint('coat', { color: C.muzzle, follow: kind.muzzleFollow ?? 0.3 }),
        mane: k.tint('mane'),
        eye: k.tint('eyes'),
      };
      k.skeleton({
        hips: { at: HIPS_AT },
        spine: { parent: 'hips', at: SPINE_AT },
        neck: { parent: 'spine', at: NECK_AT },
        head: { parent: 'neck', at: HEAD_AT, tail: [0, 0.64, 0.46] },
        mane: { parent: 'neck', at: MANE_AT, tail: [0.1, 0.7, 0.0] },
        tail: { parent: 'hips', at: TAIL_AT, tail: [0, 0.24, -0.62] },
        'fleg.L': { parent: 'spine', at: SHOULDER },
        'fshin.L': { parent: 'fleg.L', at: FKNEE },
        'fleg.R': { parent: 'spine', at: mx(SHOULDER) },
        'fshin.R': { parent: 'fleg.R', at: mx(FKNEE) },
        'bleg.L': { parent: 'hips', at: HIP },
        'bshin.L': { parent: 'bleg.L', at: BKNEE },
        'bleg.R': { parent: 'hips', at: mx(HIP) },
        'bshin.R': { parent: 'bleg.R', at: mx(BKNEE) },
        ...kind.bones,
      });

      // ------------------------------------------------------------------ body and legs
      const chest = sdf.ellipsoid(CHEST_R).at(...CHEST_C);
      const rump = sdf.ellipsoid(RUMP_R).at(...RUMP_C);
      const shoulders = pair(sdf.ellipsoid(SHOULDER_R).at(...SHOULDER_C).bone('fleg.L'));
      const thighs = pair(sdf.ellipsoid(THIGH_R).at(...THIGH_C).bone('bleg.L'));
      const barrel = sdf.smoothUnion(0.07, chest.bone('spine'), rump.bone('hips'), shoulders, thighs);
      const neck = sdf.capsule([0, 0.6, 0.08], [0, 0.84, 0.2], 0.12);
      const leg = (top: V3, knee: V3, upper: string, lower: string) =>
        sdf.smoothUnion(
          0.03,
          sdf.cone(top, knee, 0.085, 0.07).bone(upper),
          sdf.cone(knee, [knee[0], 0.11, knee[2]], 0.07, 0.064).bone(lower),
        );
      const legs = sdf.union(pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L')), pair(leg(HIP, BKNEE, 'bleg.L', 'bshin.L')));

      // ------------------------------------------------------------------ head
      const skull = sdf.ellipsoid(SKULL_R).at(...HEAD_C);
      const face = sdf.ellipsoid(FACE_R).rotateX(-NB_A).at(...FACE_C);
      const cheeks = pair(sdf.sphere(0.09).at(...CHEEK_C));
      const headCoat = sdf.smoothUnion(0.06, skull, face, cheeks);
      const MS = kind.muzzleScale ?? 1;
      const MR: V3 = MS === 1 ? MUZ_R : [MUZ_R[0] * MS, MUZ_R[1] * MS, MUZ_R[2] * MS];
      const muzzleShape = sdf.ellipsoid(MR).at(...MUZ_C);
      const headAll = sdf.smoothUnion(0.03, headCoat, muzzleShape);
      const faceHit = (x: number, y: number) => sdf.raycast(headCoat, [x, y, 2], [0, 0, -1])!;
      // Tall leaf-shaped ears, tipped outward, with a darker cupped inside.
      const SPREAD = kind.earSpread ?? 18;
      const EA = kind.earAt ?? ([0.11, 1.03, 0.25] as const);
      const earPose = (s: sdf.Shape) => s.rotateX(-10).rotateZ(-SPREAD).at(EA[0], EA[1], EA[2]);
      const E = kind.ears ?? 1;
      const W = kind.earWidth ?? 1;
      const earLocal = sdf
        .chain([[0, 0, 0, 0.045], [0, 0.08 * E, 0, 0.05 * W], [0, 0.18 * E, 0, 0.008]], 0.03)
        .scale([1, 1, 0.55])
        .smoothSubtract(0.008, sdf.ellipsoid([0.03 * W, 0.075 * E, 0.03]).at(0, 0.09 * E, 0.03));
      const earCup = sdf.ellipsoid([0.036 * W, 0.085 * E, 0.04]).at(0, 0.09 * E, 0.025);
      const ears = pair(earPose(earLocal.paintWhere(earCup, T.coatDark, 0.006)));

      // Eyes: big glossy domes on the face.
      const ES = kind.eyeScale ?? 1;
      const EYE_R = 0.048 * ES;
      const eh = faceHit(0.1, 0.87);
      const EC: V3 = [eh[0], eh[1], eh[2] - 0.02];
      const front = sdf.halfSpace([0, 0, -1], -EC[2]);
      const cyl = (r: number, dx: number, dy: number) => sdf.cylinder(r, 1).rotateX(90).at(EC[0] + dx, EC[1] + dy, 0).intersect(front);
      const shineOff = [0.014 * ES, 0.017 * ES] as const;
      const eyes = pair(
        sdf
          .sphere(EYE_R)
          .at(...EC)
          .paintWhere(cyl(0.037 * ES, -0.005 * ES, -0.002 * ES), T.eye, 0.002)
          .paintWhere(cyl(0.021 * ES, -0.006 * ES, -0.003 * ES), C.pupil, 0.002)
          .paintWhere(sdf.sphere(0.011 * ES).at(EC[0] + shineOff[0], EC[1] + shineOff[1], EC[2] + Math.sqrt(EYE_R ** 2 - shineOff[0] ** 2 - shineOff[1] ** 2)), '#ffffff', 0.002),
      );
      const withHead = kind.head !== false;
      if (withHead) k.body('eyes', eyes, { color: C.sclera, roughness: 0.12, detail: 0.004, textureDensity: 2, bone: 'head', ...kind.eyes });

      // The blaze from the forelock down to the noseband, and short brows above the eyes.
      const blaze = sdf
        .extrude(
          profile.polygon(
            [[-0.018, 1.06], [0.018, 1.06], [0.028, 0.93], [0.034, 0.8], [0.03, 0.7], [-0.03, 0.7], [-0.034, 0.8], [-0.028, 0.93]],
            { smooth: true },
          ),
          0.3,
        )
        .at(0, 0, 0.5);
      const brows = pair(sdf.extrude(profile.arc(0.064, 0.012, 58, 112), 0.3).at(EC[0], EC[1], EC[2]));

      // ------------------------------------------------------------------ coat
      const trunk = withHead ? sdf.smoothUnion(0.05, barrel, sdf.smoothUnion(0.06, neck.bone('neck'), headCoat.bone('head'))) : barrel;
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const horse: HorseShape = {
        head: headAll,
        trunk: barrel,
        faceHit,
        joints: { FKNEE, BKNEE, HOOF_DZ, HEAD_C },
        tint: { coat: T.coat, coatDark: T.coatDark, mane: T.mane, eye: T.eye },
        tone,
      };
      const coatShape = withHead ? trunk.smoothUnion(0.035, legs).smoothUnion(0.015, ears.bone('head')) : trunk.smoothUnion(0.035, legs);
      const coatPainted = withHead ? (kind.blaze === false ? coatShape : coatShape.paintWhere(blaze, C.white, 0.006)).paintWhere(brows, T.brow, 0.003) : coatShape;
      const coat = kind.paint?.(coatPainted, horse) ?? coatPainted;
      k.body('coat', coat, {
        color: T.coat,
        roughness: 0.7,
        detail: 0.006,
        textureDensity: 1.4,
        bump: (x: number, y: number, z: number) => 0.0005 * noise.fbm(x * 80, y * 30, z * 80, 2),
      });

      // ------------------------------------------------------------------ muzzle: nostrils and smile
      const muzHit = (x: number, y: number) => sdf.raycast(muzzleShape, [x, y, 2], [0, 0, -1])!;
      const nh = muzHit(0.05, 0.66);
      const nostrils = pair(sdf.ellipsoid([0.018, 0.024, 0.03]).rotateZ(-20).at(nh[0], nh[1], nh[2]));
      const smile = sdf.extrude(profile.arc(0.075, 0.008, 228, 312), 0.3).at(0.0, 0.665, MUZ_C[2] + 0.05);
      const muzzle = muzzleShape
        .smoothSubtract(0.008, nostrils)
        .paintWhere(nostrils.round(0.007), C.nostril, 0.004)
        .paintWhere(smile, C.nostril, 0.002);
      if (withHead) k.body('muzzle', muzzle, { color: T.muzzle, roughness: 0.6, detail: 0.005, textureDensity: 2, bone: 'head' });

      // ------------------------------------------------------------------ halter
      const nN = [Math.cos(NB_A * RAD), -Math.sin(NB_A * RAD)] as const; // (y, z) normal of the noseband
      const nC = [Math.sin(CK_A * RAD), Math.cos(CK_A * RAD)] as const;
      const dN = nN[0] * NB_P[1] + nN[1] * NB_P[2];
      const dC = nC[0] * CK_P[1] + nC[1] * CK_P[2];
      const det = nN[0] * nC[1] - nN[1] * nC[0];
      const JY = (dN * nC[1] - nN[1] * dC) / det;
      const JZ = (nN[0] * dC - dN * nC[0]) / det;
      const strapShell = headAll.round(0.007);
      const noseband = strapShell.intersect(sdf.box([0.5, 0.032, 0.5]).rotateX(-NB_A).at(...NB_P));
      const cheekStrap = strapShell
        .intersect(sdf.box([0.6, 0.6, 0.024]).rotateX(-CK_A).at(...CK_P))
        .intersect(sdf.halfSpace([0, -nN[0], -nN[1]], -dN));
      const bh = sdf.raycast(headAll, [1, JY, JZ], [-1, 0, 0])!;
      const buckle = pair(
        sdf
          .box([0.014, 0.044, 0.044], 0.006)
          .subtract(sdf.box([0.05, 0.022, 0.022], 0.004))
          .rotateY(28)
          .at(bh[0] + 0.006, bh[1], bh[2]),
      );
      if (withHead && kind.halter !== false) {
        k.body('halter', sdf.union(noseband, cheekStrap), { color: C.leather, roughness: 0.55, detail: 0.004, bone: 'head' });
        k.body('buckle', buckle, { color: C.buckle, roughness: 0.45, detail: 0.004, bone: 'head' });
      }

      // ------------------------------------------------------------------ mane, forelock, tail
      const hair = (s: sdf.Shape) => s.displace(0.004, (x, y, z) => noise.fbm(x * 45, y * 12, z * 45, 2));
      const forelock = sdf.smoothUnion(
        0.02,
        sdf.chain([[0, 1.065, 0.22, 0.042], [-0.01, 1.125, 0.3, 0.045], [-0.03, 1.1, 0.39, 0.04], [-0.045, 1.02, 0.445, 0.032], [-0.04, 0.965, 0.44, 0.018]], 0.02),
        sdf.chain([[0, 1.065, 0.2, 0.04], [0.03, 1.145, 0.24, 0.036], [0.06, 1.16, 0.3, 0.026], [0.072, 1.125, 0.34, 0.012]], 0.02),
        sdf.chain([[0, 1.055, 0.14, 0.042], [-0.02, 1.135, 0.14, 0.038], [-0.05, 1.155, 0.2, 0.02]], 0.02),
      );
      const CREST: V3[] = [[0, 1.0, 0.16], [0, 0.93, 0.085], [0, 0.84, 0.035], [0, 0.75, -0.005], [0, 0.67, -0.04]];
      const ridge = sdf.chain(CREST.map((c, i) => [c[0], c[1], c[2], 0.042 - i * 0.003] as const), 0.02);
      const LOCK_TIPS: V3[] = [];
      const brush = kind.mane === 'brush';
      const locks = CREST.slice(0, 5).map((c, i) => {
        const len = 1 - i * 0.14;
        const tip: V3 = [c[0] + 0.13, c[1] - 0.2 * len, c[2] + 0.005];
        LOCK_TIPS.push(tip);
        return sdf.chain(
          [
            [c[0] + 0.02, c[1], c[2], 0.045],
            [c[0] + 0.08, c[1] - 0.04 * len, c[2] - 0.03, 0.042],
            [c[0] + 0.12, c[1] - 0.12 * len, c[2] - 0.025, 0.03],
            [tip[0], tip[1], tip[2], 0.01],
          ],
          0.02,
        );
      });
      // The brush: short upright tufts from the poll down the crest, leaning back (a donkey's mane).
      const BRUSH_TIPS: V3[] = [];
      const tufts = Array.from({ length: 9 }, (_, i) => {
        const t = i / 8;
        const c: V3 = [0, 1.11 - 0.43 * t, 0.2 - 0.23 * t];
        const len = 0.09 - 0.035 * t;
        const tip: V3 = [0, c[1] + len * (0.78 - 0.3 * t), c[2] - len * (0.62 + 0.3 * t)];
        BRUSH_TIPS.push(tip);
        return sdf.cone(c, tip, 0.03 - 0.008 * t, 0.009).bone(t < 0.2 ? 'head' : 'mane');
      });
      // A spiky forelock tuft on the poll: five cones fanned to the sides and the front.
      const pollTuft = [-2, -1, 0, 1, 2].map((i) =>
        sdf.cone([0.012 * i, 1.08, 0.215], [0.035 * i, 1.19 - 0.012 * Math.abs(i), 0.25 - 0.006 * Math.abs(i)], 0.024, 0.008).bone('head'),
      );
      const brushMane = sdf.smoothUnion(
        0.015,
        sdf.chain([[0, 1.1, 0.2, 0.03], [0, 1.0, 0.15, 0.034], [0, 0.85, 0.06, 0.032], [0, 0.68, -0.03, 0.026]], 0.02).bone('mane'),
        ...tufts,
        ...pollTuft,
      );
      if (brush) LOCK_TIPS.splice(0, LOCK_TIPS.length, ...BRUSH_TIPS);
      const mane = brush
        ? brushMane
        : sdf.smoothUnion(
            0.02,
            ...(kind.forelock === false ? [] : [forelock.bone('head')]),
            ridge.bone('mane'),
            ...locks.map((l, i) => l.bone(i === 0 ? 'head' : 'mane')),
          );
      const hairPaint = (h: sdf.Shape) => kind.paintHair?.(h, horse) ?? h;
      if (withHead && kind.mane !== false) k.body('maneHair', hairPaint(hair(mane)), { color: T.mane, roughness: 0.7, detail: 0.005, textureDensity: 1.2, ...kind.hair });

      const tuft = kind.tail === 'tuft';
      const TAIL_PTS: [number, number, number, number][] = tuft
        ? [
            [0, 0.63, -0.42, 0.03],
            [0, 0.6, -0.5, 0.026],
            [0, 0.5, -0.56, 0.022],
            [0, 0.38, -0.58, 0.02],
            [0, 0.3, -0.58, 0.04],
            [0, 0.2, -0.57, 0.02],
          ]
        : [
            [0, 0.63, -0.42, 0.045],
            [0, 0.645, -0.52, 0.07],
            [0, 0.56, -0.61, 0.085],
            [0, 0.41, -0.65, 0.08],
            [0, 0.28, -0.63, 0.055],
            [0, 0.2, -0.58, 0.014],
          ];
      const strand = (dx: number, dz: number, r: number) =>
        sdf.chain(
          TAIL_PTS.map(([x, y, z, rr], i) => [x + dx * (i / 5), y, z + dz * (i / 5), i === 0 || i === 5 ? rr : rr * r] as const),
          0.03,
        );
      // The tuft: a thin coat-colored tail and a tassel of hair at the end.
      const stalk = sdf.chain(TAIL_PTS.slice(0, 4).map(([x, y, z, r]) => [x, y, z, r] as const), 0.02);
      const tassel = sdf.smoothUnion(
        0.015,
        sdf.ellipsoid([0.04, 0.09, 0.04]).at(0, 0.29, -0.58),
        sdf.cone([0, 0.3, -0.58], [0.018, 0.19, -0.575], 0.03, 0.01),
        sdf.cone([0, 0.3, -0.58], [-0.016, 0.195, -0.59], 0.03, 0.01),
      );
      const tail = tuft
        ? sdf.smoothUnion(0.02, stalk, tassel).paintWhere(sdf.box([0.2, 0.4, 0.4]).at(0, 0.565, -0.5), T.coat, 0.02)
        : sdf.smoothUnion(0.02, strand(0, 0, 1), strand(0.02, -0.03, 0.75), strand(-0.02, 0.025, 0.75)).scale([0.6, 1, 1]);
      k.body('tailHair', hairPaint(hair(tail)), { color: T.mane, roughness: 0.7, detail: 0.005, bone: 'tail', ...kind.hair });

      // ------------------------------------------------------------------ socks and hooves
      const sock = (kn: V3, bone: string) =>
        sdf
          .cylinder(0.084, 0.075, 0.03)
          .at(kn[0], 0.14, kn[2] + HOOF_DZ * 0.5)
          .displace(0.004, (x, y, z) => noise.fbm(x * 50, y * 50, z * 50, 2))
          .bone(bone);
      const hoof = (kn: V3, bone: string) =>
        sdf
          .cone([kn[0], 0.012, kn[2] + HOOF_DZ], [kn[0], 0.1, kn[2] + HOOF_DZ * 0.5], 0.074, 0.062)
          .round(0.012)
          .intersect(sdf.halfSpace([0, -1, 0], 0))
          .bone(bone);
      if (kind.socks !== false) k.body('socks', sdf.union(pair(sock(FKNEE, 'fshin.L')), pair(sock(BKNEE, 'bshin.L'))), { color: C.white, roughness: 0.85, detail: 0.005 });
      k.body('hooves', sdf.union(pair(hoof(FKNEE, 'fshin.L')), pair(hoof(BKNEE, 'bshin.L'))), { color: C.hoof, roughness: 0.4, detail: 0.005, ...kind.hooves });
      kind.extra?.(k, horse);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      type Rot = readonly [number, number, number];
      type Pose = Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>;
      type Track = readonly (readonly [number, number])[];

      // Ground contact. The hooves are rigid on the shins. `hoofSole` is the flat bottom ring and
      // the rounded bottom edge of a hoof.
      const ring = (c: V3, r: number, n = 12): V3[] =>
        Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos((i / n) * 2 * Math.PI), c[1], c[2] + r * Math.sin((i / n) * 2 * Math.PI)] as V3);
      const hoofSole = (kn: V3): V3[] => [...ring([kn[0], 0, kn[2] + HOOF_DZ], 0.078), ...ring([kn[0], 0.012, kn[2] + HOOF_DZ], 0.086)];
      const LEGS = [
        { bones: ['hips', 'spine', 'fleg.L', 'fshin.L'], joints: [HIPS_AT, SPINE_AT, SHOULDER, FKNEE], sole: hoofSole(FKNEE) },
        { bones: ['hips', 'spine', 'fleg.R', 'fshin.R'], joints: [HIPS_AT, SPINE_AT, mx(SHOULDER), mx(FKNEE)], sole: hoofSole(mx(FKNEE)) },
        { bones: ['hips', 'bleg.L', 'bshin.L'], joints: [HIPS_AT, HIP, BKNEE], sole: hoofSole(BKNEE) },
        { bones: ['hips', 'bleg.R', 'bshin.R'], joints: [HIPS_AT, mx(HIP), mx(BKNEE)], sole: hoofSole(mx(BKNEE)) },
      ];
      const chains = (pose: Pose, legs: readonly (typeof LEGS)[number][] = LEGS) =>
        legs.map((l) => ({ joints: l.joints, rotations: l.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const)), sole: l.sole }));
      // The hips lift for the pose, and then each planted hoof ([index in LEGS, weight]) that floats
      // tips its toe down until it touches the ground (the push-off at the end of a step).
      const planted = (pose: Pose, settle: readonly (readonly [leg: number, weight: number])[] = []) => {
        const y = motion.plant(chains(pose));
        for (const [i, weight] of settle) {
          const l = LEGS[i]!;
          const shin = l.bones[l.bones.length - 1]!;
          const r = pose[shin]?.rotate ?? ([0, 0, 0] as const);
          const floats = (w: number) => {
            pose[shin] = { rotate: [r[0] + w, r[1], r[2]] };
            return y - motion.plant(chains(pose, [l])) > 0.001;
          };
          let lo = 0;
          if (floats(0)) {
            let hi = 30;
            for (let n = 0; n < 12; n++) {
              const mid = (lo + hi) / 2;
              if (floats(mid)) lo = mid;
              else hi = mid;
            }
          }
          pose[shin] = { rotate: [r[0] + lo * weight, r[1], r[2]] };
        }
        return y;
      };

      // Whole-body ground probes: points on every mass, carried by its bone. `groundY` is the hips
      // lift that rests the lowest of them on the ground (the clips where the horse rears, kneels,
      // or lies down).
      const DIRS: V3[] = [];
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) for (const c of [-1, 0, 1]) if (a || b || c) DIRS.push([a / Math.hypot(a, b, c), b / Math.hypot(a, b, c), c / Math.hypot(a, b, c)]);
      const ell = (c: V3, r: V3, grow = 0.01): V3[] => DIRS.map((d) => [c[0] + (r[0] + grow) * d[0], c[1] + (r[1] + grow) * d[1], c[2] + (r[2] + grow) * d[2]] as V3);
      const CH: Record<string, { bones: string[]; joints: V3[] }> = {
        hips: { bones: ['hips'], joints: [HIPS_AT] },
        spine: { bones: ['hips', 'spine'], joints: [HIPS_AT, SPINE_AT] },
        neck: { bones: ['hips', 'spine', 'neck'], joints: [HIPS_AT, SPINE_AT, NECK_AT] },
        head: { bones: ['hips', 'spine', 'neck', 'head'], joints: [HIPS_AT, SPINE_AT, NECK_AT, HEAD_AT] },
        mane: { bones: ['hips', 'spine', 'neck', 'mane'], joints: [HIPS_AT, SPINE_AT, NECK_AT, MANE_AT] },
        tail: { bones: ['hips', 'tail'], joints: [HIPS_AT, TAIL_AT] },
      };
      const EAR_TIP: V3 = [EA[0] + 0.18 * E * Math.sin(SPREAD * RAD), EA[1] + 0.18 * E * Math.cos(SPREAD * RAD), EA[2] - 0.03];
      const PROBES: [string, V3[]][] = [
        ['hips', ell(RUMP_C, RUMP_R)],
        ['spine', ell(CHEST_C, CHEST_R)],
        ...(withHead
          ? ([
              ['neck', ell([0, 0.72, 0.14], [0.12, 0.14, 0.12])],
              ['head', [...ell(HEAD_C, SKULL_R), ...ell(FACE_C, FACE_R), ...ell(MUZ_C, MR), ...ell(CHEEK_C, [0.09, 0.09, 0.09]), ...ell(mx(CHEEK_C), [0.09, 0.09, 0.09]), EAR_TIP, mx(EAR_TIP), [0, 1.175, 0.2], [0.07, 1.165, 0.3]]],
              ['mane', LOCK_TIPS.flatMap((t) => [t, [t[0] + 0.02, t[1], t[2]] as V3])],
            ] as [string, V3[]][])
          : []),
        ['tail', TAIL_PTS.flatMap(([x, y, z, r]) => [[x + 0.6 * r, y, z], [x - 0.6 * r, y, z], [x, y - r, z], [x, y, z - r]] as V3[])],
      ];
      for (const pr of kind.probes ?? []) {
        CH[pr.bone] = { bones: pr.chain.map(([b]) => b), joints: pr.chain.map(([, j]) => j) };
        PROBES.push([pr.bone, [...pr.points]]);
      }
      for (const s of ['L', 'R'] as const) {
        const m = (v: V3) => (s === 'L' ? v : mx(v));
        CH[`fleg.${s}`] = { bones: ['hips', 'spine', `fleg.${s}`], joints: [HIPS_AT, SPINE_AT, m(SHOULDER)] };
        CH[`fshin.${s}`] = { bones: ['hips', 'spine', `fleg.${s}`, `fshin.${s}`], joints: [HIPS_AT, SPINE_AT, m(SHOULDER), m(FKNEE)] };
        CH[`bleg.${s}`] = { bones: ['hips', `bleg.${s}`], joints: [HIPS_AT, m(HIP)] };
        CH[`bshin.${s}`] = { bones: ['hips', `bleg.${s}`, `bshin.${s}`], joints: [HIPS_AT, m(HIP), m(BKNEE)] };
        const lower = (kn: V3): V3[] => [...ring(kn, 0.08, 8), ...ring([kn[0], 0.14, kn[2]], 0.094, 8), ...hoofSole(kn)];
        PROBES.push([`fleg.${s}`, ell(m(SHOULDER_C), SHOULDER_R)], [`fshin.${s}`, lower(m(FKNEE))]);
        PROBES.push([`bleg.${s}`, ell(m(THIGH_C), THIGH_R)], [`bshin.${s}`, lower(m(BKNEE))]);
      }
      const groundY = (pose: Pose) =>
        motion.plant(PROBES.map(([b, pts]) => ({ joints: CH[b]!.joints, rotations: CH[b]!.bones.map((n) => pose[n]?.rotate ?? ([0, 0, 0] as const)), sole: pts })));

      // Walk and gallop. `phase` is each leg's offset in the cycle (LEGS order); a leg swings forward
      // while `lift` > 0: the upper leg lifts the knee (`fold`), and the shin folds back (`flex`)
      // early in the swing and reaches forward to land flat. A planted hoof stays flat while its leg
      // pushes back. The hips follow the planted hooves (plus a `hop` for the gallop's float).
      type Swing = readonly [fold: number, flex: number];
      type GaitOpts = {
        duration: number;
        swing: number;
        front: Swing;
        hind: Swing;
        phase: readonly [number, number, number, number];
        pitch: number;
        pitchCycles: number;
        hop: number;
        nod: number;
        headDip: number;
        tailUp: number;
        maneSwing: number;
      };
      const gait = (o: GaitOpts) => ({
        duration: o.duration,
        pose: (_t: number, p: number) => {
          const pitch = o.pitch * wave(p, o.pitchCycles);
          const legs = [0, 1, 2, 3].map((i) => {
            const isFront = i < 2;
            const ph = o.phase[i]!;
            const a = wave(p, 1, ph);
            const lift = Math.max(0, wave(p, 1, ph + 0.25));
            const [fold, flex] = isFront ? o.front : o.hind;
            const upper = -o.swing * a - fold * lift;
            const shin = 0.5 * flex * lift * (1 - a);
            const lower = shin - upper - (isFront ? pitch : 0);
            return { upper: { rotate: [upper, 0, 0] as Rot }, lower: { rotate: [lower, 0, 0] as Rot }, lift };
          });
          const pose: Pose = {
            hips: { rotate: [0, 0, 2 * wave(p, 1)] },
            spine: { rotate: [pitch, 0, -2 * wave(p, 1)] },
            neck: { rotate: [o.headDip + o.nod * wave(p, o.pitchCycles, 0.15), 0, 0] },
            head: { rotate: [-2 * wave(p, 2, 0.25), 3 * wave(p), 0] },
            mane: { rotate: [0.5 * o.maneSwing * wave(p, o.pitchCycles, 0.3), 0, o.maneSwing * wave(p, 1, 0.2)] },
            tail: { rotate: [o.tailUp + 6 * wave(p, o.pitchCycles, 0.1), 0, 10 * wave(p, 1, 0.2)] },
          };
          legs.forEach((l, i) => {
            pose[LEGS[i]!.bones.at(-2)!] = l.upper;
            pose[LEGS[i]!.bones.at(-1)!] = l.lower;
          });
          const settle = legs.map((l, i) => [i, Math.max(0, 1 - l.lift / 0.4)] as const).filter(([, w]) => w > 0);
          pose.hips = { ...pose.hips, move: [0, planted(pose, settle) + o.hop * bump(p, 1, 0.1) ** 2, 0] };
          return pose;
        },
      });
      // Extra bones of a kind take their poses from its `pose` hook in every clip.
      const animate = (name: string, def: AnimationDef) =>
        k.animation(name, kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def);
      // Four-beat walk: left hind, left fore, right hind, right fore.
      animate(
        'walk',
        gait({ duration: 1.1, swing: 16, front: [22, 70], hind: [18, 60], phase: [0.5, 0, 0.75, 0.25], pitch: 1.5, pitchCycles: 2, hop: 0, nod: 3, headDip: 0, tailUp: 0, maneSwing: 5 }),
      );
      // Gallop: the hind legs, then the fore legs, one after the other, with a rocking body.
      animate(
        'run',
        gait({ duration: 0.55, swing: 30, front: [40, 110], hind: [30, 90], phase: [0.35, 0.25, 0.75, 0.65], pitch: 5, pitchCycles: 1, hop: 0.03, nod: 7, headDip: 8, tailUp: 25, maneSwing: 10 }),
      );
      animate('idle', {
        duration: 3.2,
        pose: (_t, p) => ({
          neck: { rotate: [3 * bump(p), 4 * wave(p, 1, 0.2), 0] },
          head: { rotate: [-3 * wave(p, 2, 0.1), 0, 3 * wave(p)] },
          mane: { rotate: [0, 0, 3 * wave(p, 2, 0.3)] },
          tail: { rotate: [3 * wave(p, 1, 0.3), 0, 14 * wave(p, 2)] },
        }),
      });

      // Rear: a gather on the hind legs, the body rises to 40 degrees on the planted hind hooves, the
      // forelegs fold and strike forward twice each, then the horse lands on the front hooves with a
      // small dip. Leg angles are world angles (the local turns cancel the body pitch). The hips move
      // keeps the hind hooves in place, and groundY keeps the lowest point on the ground.
      const RISE = 40;
      const REAR: Record<string, Track> = {
        up: [[0, 0], [0.1, -0.06], [0.3, 1], [0.6, 1], [0.76, 0], [0.82, -0.06], [0.9, 0], [1, 0]],
        gather: [[0, 0], [0.1, 1], [0.6, 1], [0.76, 0.3], [0.86, 0], [1, 0]],
        fold: [[0, 0], [0.12, 0], [0.28, 1], [0.62, 1], [0.74, 0.2], [0.8, 0], [1, 0]],
        kickL: [[0.3, 0], [0.36, 1], [0.42, 0.1], [0.48, 1], [0.54, 0.1], [0.6, 0]],
        kickR: [[0.33, 0], [0.39, 1], [0.45, 0.1], [0.51, 1], [0.57, 0.1], [0.62, 0]],
        neck: [[0, 0], [0.1, 5], [0.3, -2], [0.6, -2], [0.76, 6], [0.86, 0], [1, 0]], // + = nose down
        head: [[0, 0], [0.1, 5], [0.3, 0], [0.6, 0], [0.76, 4], [0.86, 0], [1, 0]],
        hum: [[0.3, 0], [0.34, 1], [0.56, 1], [0.6, 0]],
        tail: [[0, 0], [0.3, 30], [0.6, 30], [0.8, 5], [1, 0]], // world lift, + = up behind
      };
      animate('rear', {
        duration: 2.2,
        loop: false,
        pose: (t, p) => {
          const v = (name: string) => keys(p, REAR[name]!);
          const up = v('up');
          const h = -RISE * up;
          const s = -6 * Math.max(0, up);
          const hum = v('hum');
          const pose: Pose = {
            hips: { rotate: [h, 0, 0] },
            spine: { rotate: [s, 0, 0] },
            neck: { rotate: [v('neck'), 0, 0] },
            head: { rotate: [v('head') + 1.5 * hum * Math.sin(t * 2 * Math.PI * 8), 0, 4 * hum * Math.sin(t * 2 * Math.PI * 2)] },
            mane: { rotate: [14 * Math.max(0, up), 0, 8 * wave(p, 3)] },
            tail: { rotate: [v('tail') - h, 0, 8 * wave(p, 3)] },
          };
          const hu = -12 * v('gather');
          for (const side of ['L', 'R'] as const) {
            const kick = v(`kick${side}`);
            const fold = v('fold');
            const fu = -85 * fold + 22 * kick;
            const fs = -6 * fold - 60 * kick;
            pose[`fleg.${side}`] = { rotate: [fu - h - s, 0, 0] };
            pose[`fshin.${side}`] = { rotate: [fs - fu, 0, 0] };
            pose[`bleg.${side}`] = { rotate: [hu - h, 0, 0] };
            pose[`bshin.${side}`] = { rotate: [-hu, 0, 0] };
          }
          const hoofC: V3 = [BKNEE[0], 0, BKNEE[2] + HOOF_DZ];
          const at = motion.follow([HIPS_AT, HIP, BKNEE], [pose.hips!.rotate!, pose['bleg.L']!.rotate!, pose['bshin.L']!.rotate!], hoofC);
          pose.hips = { ...pose.hips, move: [0, groundY(pose), hoofC[2] - at[2]] };
          return pose;
        },
      });

      // Neigh: the head dips, then tosses up with a whinny tremble, the mane swings, a head shake,
      // and the right fore paws the ground twice (lift, strike forward, scrape back).
      const NEIGH: Record<string, Track> = {
        neck: [[0, 0], [0.12, 8], [0.26, -24], [0.48, -22], [0.6, -4], [0.7, 0], [1, 0]], // + = nose down
        head: [[0, 0], [0.12, 6], [0.26, -20], [0.48, -18], [0.6, -3], [0.7, 0], [1, 0]],
        body: [[0, 0], [0.26, 2], [0.5, 2], [0.66, 0], [1, 0]],
        hum: [[0.26, 0], [0.3, 1], [0.46, 1], [0.5, 0]],
        shake: [[0.5, 0], [0.54, 1], [0.64, 0]],
        maneEnv: [[0.18, 0], [0.28, 1], [0.6, 0.7], [1, 0]],
        pawU: [[0.55, 0], [0.62, -38], [0.69, -14], [0.74, 10], [0.8, -38], [0.87, -14], [0.92, 10], [1, 0]],
        pawS: [[0.55, 0], [0.62, 50], [0.69, -4], [0.74, 8], [0.8, 50], [0.87, -4], [0.92, 8], [1, 0]],
      };
      animate('neigh', {
        duration: 2.4,
        loop: false,
        pose: (t, p) => {
          const v = (name: string) => keys(p, NEIGH[name]!);
          const b = v('body');
          const hum = v('hum');
          const shake = v('shake') * Math.sin(((p - 0.5) / 0.14) * 4 * Math.PI);
          const swing = v('maneEnv') * Math.sin((p - 0.18) * 2 * Math.PI * 4);
          const [pu, ps] = [v('pawU'), v('pawS')];
          const pose: Pose = {
            spine: { rotate: [-b, 0, 0] },
            neck: { rotate: [v('neck'), 0, 0] },
            head: { rotate: [v('head') + 1.5 * hum * Math.sin(t * 2 * Math.PI * 9), 12 * shake, 6 * shake] },
            mane: { rotate: [6 * v('maneEnv'), 0, 14 * swing] },
            tail: { rotate: [4 * wave(p, 2), 0, 14 * wave(p, 2, 0.3)] },
            'fleg.L': { rotate: [b, 0, 0] },
            'fleg.R': { rotate: [pu + b, 0, 0] },
            'fshin.R': { rotate: [ps - pu, 0, 0] },
          };
          pose.hips = { move: [0, groundY(pose), 0] };
          return pose;
        },
      });

      // Hit, struck from the front: the head jerks up and back, the body flinches back and a little
      // to its right, the tail tucks, then a quick return. Each upper leg leans by the angle that
      // cancels the body's shift and each shin turns back by the same angle, so the hooves stay flat
      // and planted; the hips sink by the height the leaning upper legs lose.
      const DEG = 180 / Math.PI;
      const UPPER = SHOULDER[1] - FKNEE[1]; // shoulder or hip joint to knee (the same front and back)
      animate('hit', {
        duration: 0.45,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.15, 1], [0.34, 0.85], [1, 0]] as const);
          const tuck = keys(p, [[0, 0], [0.14, 1], [0.55, 0.75], [1, 0]] as const);
          const back = 0.03 * h;
          const side = 0.01 * h;
          const a = Math.asin(back / UPPER) * DEG;
          const c = Math.asin(side / UPPER) * DEG;
          const sink = UPPER - Math.sqrt(UPPER * UPPER - back * back - side * side);
          const upper = { rotate: [-a, 0, c] as const };
          const lower = { rotate: [a, 0, -c] as const };
          return {
            hips: { move: [-side, 0.004 * h - sink, -back] },
            neck: { rotate: [-14 * h, -4 * h, 0] },
            head: { rotate: [-22 * h, -5 * h, 8 * h] },
            mane: { rotate: [8 * h, 0, -10 * h] },
            tail: { rotate: [-30 * tuck, 0, 8 * tuck] },
            'fleg.L': upper,
            'fleg.R': upper,
            'bleg.L': upper,
            'bleg.R': upper,
            'fshin.L': lower,
            'fshin.R': lower,
            'bshin.L': lower,
            'bshin.R': lower,
          };
        },
      });

      // Death: a recoil and a stagger, then the front knees buckle (the cannons fold back under the
      // forearms) and the hind legs fold, the chest drops, and the horse rolls onto its right side
      // with the legs out and the head down. groundY rests the lowest point on the ground each frame.
      animate('death', {
        duration: 1.8,
        loop: false,
        pose: (_t, p) => {
          const recoil = keys(p, [[0, 0], [0.06, 1], [0.16, 0.3], [0.26, 0]] as const);
          const sway = keys(p, [[0.05, 0], [0.14, 1], [0.24, -0.5], [0.34, 0]] as const);
          const fold = keys(p, [[0.22, 0], [0.38, 1]] as const);
          const drop = keys(p, [[0.26, 0], [0.42, 1], [0.55, 0.9], [0.74, 0]] as const);
          const crouch = keys(p, [[0.3, 0], [0.46, 1]] as const);
          const roll = keys(p, [[0.46, 0], [0.76, 1]] as const);
          const outL = keys(p, [[0.5, 0], [0.72, 1]] as const);
          const outR = keys(p, [[0.58, 0], [0.84, 1]] as const);
          const bounce = keys(p, [[0.74, 0], [0.8, 1], [0.88, 0]] as const);
          const twitch = Math.max(0, Math.sin((p - 0.88) * Math.PI * 12)) * Math.max(0, Math.min(1, (p - 0.88) / 0.03, (1 - p) / 0.06));
          const legZ = -5 * sway;
          const frontLeg = (f: number, out: number, z: number, tw: number) => ({
            upper: [-6 * f - 22 * out - tw, 0, legZ + z] as const,
            lower: [115 * f - 8 * out, 0, 0] as const,
          });
          const backLeg = (c: number, out: number, z: number, tw: number) => ({
            upper: [-40 * c + 22 * out + tw, 0, legZ + z] as const,
            lower: [80 * c + 6 * out, 0, 0] as const,
          });
          const fL = frontLeg(fold * (1 - outL), outL, 12 * outL, 6 * twitch);
          const fR = frontLeg(fold * (1 - outR), outR, -6 * outR, 0);
          const bL = backLeg(crouch * (1 - outL), outL, 12 * outL, 5 * twitch);
          const bR = backLeg(crouch * (1 - outR), outR, -6 * outR, 0);
          const pose: Pose = {
            hips: { rotate: [18 * drop, 0, 5 * sway + 90 * roll] },
            spine: { rotate: [0, -6 * sway, 0] },
            neck: { rotate: [-16 * recoil + 10 * drop + 6 * roll, 0, 6 * roll] },
            head: { rotate: [-20 * recoil + 8 * drop, 0, 4 * roll] },
            mane: { rotate: [0, 0, 10 * sway] },
            tail: { rotate: [-20 * recoil + 10 * roll, 0, 15 * sway] },
            'fleg.L': { rotate: fL.upper },
            'fshin.L': { rotate: fL.lower },
            'fleg.R': { rotate: fR.upper },
            'fshin.R': { rotate: fR.lower },
            'bleg.L': { rotate: bL.upper },
            'bshin.L': { rotate: bL.lower },
            'bleg.R': { rotate: bR.upper },
            'bshin.R': { rotate: bR.lower },
          };
          pose.hips = { ...pose.hips, move: [-0.02 * sway - 0.1 * roll, groundY(pose) + 0.012 * bounce, -0.03 * recoil] };
          return pose;
        },
      });
    },
  });
}
