import * as THREE from 'three';
import { addPart, defineAsset, mapTint, motion, profile, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BonePose, Pose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

import { avatarHair } from './avatar-hair.js';
import type { AvatarHairStyle } from './avatar-hair.js';

/**
 * The humanoid kind (the avatar base is its first user): the Chibi Quest hero skeleton, head, face
 * paint, arms, fists, and torso (the chest-armor contract), plain underclothes, and the clips idle,
 * walk, run, attack, hit, rest, cheer, and cast. NPCs dress it in `extra` (robes, aprons, hats,
 * and tools, or equipment parts with `addPart`) and paint the face in `paintSkin` (beards, age).
 */
const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#a8702f',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#5a3422',
  mouth: '#a4503f',
  hair: '#5a301d',
  shirt: '#5f84ad',
  shirtTrim: '#46658a',
  belt: '#6b4a32',
  pants: '#4a3f36',
  shoe: '#7a4a2c',
  sole: '#4a2c1c',
};

const pair = (s: sdf.Shape) => s.mirror('x');


type V3 = readonly [number, number, number];
type V2 = readonly [number, number];

/**
 * Every proportion number of the humanoid kind (meters, character frame, left side x > 0), so that a
 * kind can build the same figure at another age. `HERO` holds the numbers of the Chibi Quest hero
 * and the avatar base; the kind builds from the table, and a literal in the build code follows
 * from a table value. `AGE5` is the Chibi Sprouts body: the same head and face, a shorter torso,
 * shorter arms and legs.
 */
export interface HumanoidProportions {
  /** The head center and the skull ellipsoid radii (the hair, the face, and the cap line follow). */
  readonly headY: number;
  readonly head: V3;
  /** The eye: x (each side) and y. */
  readonly eye: V2;
  /** Face features: positions on the head (the face paint stencils are written around `eye`). */
  readonly face: {
    readonly cheekAt: V3;
    readonly cheekR: number;
    readonly chinSize: V3;
    readonly chinAt: V3;
    readonly noseY: number;
    readonly earAt: V3;
    readonly browY: number;
    readonly smileY: number;
    readonly blushY: number;
  };
  readonly neck: { readonly y0: number; readonly y1: number; readonly r: number };
  /** Bone joints of the spine, the neck, the head, and the cloak. */
  readonly bones: { readonly hips: V3; readonly spine: V3; readonly chest: V3; readonly neck: V3; readonly head: V3; readonly cloak: V3 };
  readonly shoulder: V3;
  readonly elbow: V3;
  readonly wrist: V3;
  readonly grip: V3;
  readonly hip: V3;
  readonly knee: V3;
  readonly ankle: V3;
  /** Meters of the parent's weight that a knee takes above its joint. */
  readonly split: number;
  /** Limb radii: the upper arm, the forearm, the thigh, and the shin (start and end). */
  readonly limb: { readonly upper: V2; readonly fore: V2; readonly thigh: number; readonly shin: number };
  readonly fist: {
    readonly palmSize: V3;
    readonly palmAt: V3;
    readonly rollA: V3;
    readonly rollB: V3;
    readonly rollR: number;
    readonly thumbA: V3;
    readonly thumbB: V3;
    readonly thumbR: V2;
  };
  /** The torso: the revolve profile (radius, height) and the three skin-weight bands (y0, y1). */
  readonly torso: { readonly profile: readonly V2[]; readonly hips: V2; readonly spine: V2; readonly chest: V2 };
  readonly foot: { readonly size: V3; readonly y: number; readonly z: number };
  readonly shirt: { readonly sleeveStart: V3; readonly sleeveEnd: V3; readonly sleeveR: V2; readonly collarY: number; readonly hemY: number; readonly belt: V2 };
  readonly pants: { readonly thighR: number; readonly shinR: V2; readonly cuff: V3; readonly hipsSize: V3; readonly hipsY: number };
  readonly shoe: { readonly cylinder: readonly [number, number, number]; readonly cylinderY: number; readonly toeSize: V3; readonly toeAt: V3; readonly soleTop: number; readonly scale: number };
  readonly clips: {
    /** The hips-to-ground leg length of the hit clip. */
    readonly leg: number;
    /** The factor of every step, lift, bob, and hop in meters. */
    readonly stride: number;
    /** The factor of the knee lift and the bob in meters (default: `stride`). */
    readonly lift?: number;
    /** Degrees of extra forearm swing in walk and run (default 0). */
    readonly foreSwing?: number;
    readonly heelZ: number;
    readonly toeZ: number;
    /** Maps an arm target (right-arm side x < 0, chest frame) to this body's reach. */
    readonly reach: (p: V3) => V3;
  };
}

/** The Chibi Quest hero (the rogue's numbers): the default. */
export const HERO: HumanoidProportions = {
  headY: 0.675,
  head: [0.205, 0.2, 0.19],
  eye: [0.105, 0.628],
  face: {
    cheekAt: [0.095, 0.575, 0.072],
    cheekR: 0.1,
    chinSize: [0.11, 0.055, 0.085],
    chinAt: [0, 0.53, 0.058],
    noseY: 0.566,
    earAt: [0.2, 0.61, -0.01],
    browY: 0.722,
    smileY: 0.53,
    blushY: 0.56,
  },
  neck: { y0: 0.42, y1: 0.52, r: 0.05 },
  bones: { hips: [0, 0.2, 0], spine: [0, 0.26, 0], chest: [0, 0.33, 0], neck: [0, 0.43, -0.01], head: [0, 0.48, -0.01], cloak: [0, 0.41, -0.13] },
  shoulder: [0.13, 0.385, 0],
  elbow: [0.18, 0.332, 0.012],
  wrist: [0.205, 0.238, 0.03],
  grip: [0.232, 0.172, 0.022],
  hip: [0.068, 0.195, 0],
  knee: [0.083, 0.1325, 0],
  ankle: [0.098, 0.07, 0],
  split: 0.015,
  limb: { upper: [0.04, 0.036], fore: [0.036, 0.032], thigh: 0.04, shin: 0.034 },
  fist: {
    palmSize: [0.038, 0.043, 0.044],
    palmAt: [0.212, 0.2, 0.034],
    rollA: [0.196, 0.18, 0.06],
    rollB: [0.2, 0.2, 0.072],
    rollR: 0.017,
    thumbA: [0.225, 0.215, 0.055],
    thumbB: [0.206, 0.205, 0.078],
    thumbR: [0.016, 0.013],
  },
  torso: {
    profile: [
      [0, 0.47],
      [0.07, 0.465],
      [0.105, 0.44],
      [0.125, 0.4],
      [0.13, 0.34],
      [0.124, 0.29],
      [0.13, 0.25],
      [0.138, 0.2],
      [0.14, 0.165],
      [0.132, 0.152],
      [0, 0.152],
    ],
    hips: [0.1, 0.235],
    spine: [0.215, 0.33],
    chest: [0.31, 0.5],
  },
  foot: { size: [0.034, 0.03, 0.06], y: 0.04, z: 0.035 },
  shirt: { sleeveStart: [0.11, 0.405, 0], sleeveEnd: [0.172, 0.348, 0.01], sleeveR: [0.047, 0.043], collarY: 0.452, hemY: 0.168, belt: [0.238, 0.264] },
  pants: { thighR: 0.05, shinR: [0.047, 0.043], cuff: [0.098, 0.085, 0.002], hipsSize: [0.118, 0.052, 0.088], hipsY: 0.2 },
  shoe: { cylinder: [0.05, 0.07, 0.018], cylinderY: 0.06, toeSize: [0.056, 0.05, 0.098], toeAt: [0, 0.048, 0.045], soleTop: 0.016, scale: 1 },
  clips: { leg: 0.19, stride: 1, heelZ: -0.045, toeZ: 0.11, reach: (p) => p },
};

/**
 * The age-5 factors: leg length, torso scale (an upright copy of the hero torso), arm length, limb
 * thickness, the shoe size (a share of the leg factor), the forearm turn in degrees (inward about Z,
 * forward about X), the lift and bob factor of the clips, and the extra forearm swing in degrees.
 */
const FIVE = { leg: 1.05, torso: 0.84, arm: 0.8, thick: 0.92, shoe: 0.72, turn: [-8, -10], lift: 1, foreSwing: 8 } as const;

function scaled(
  h: HumanoidProportions,
  f: { leg: number; torso: number; arm: number; thick: number; shoe: number; turn: readonly [number, number]; lift: number; foreSwing: number; wide?: number; head?: number; armOut?: number; hand?: number; armR?: number; legKnee?: number; legAnkle?: number },
): HumanoidProportions {
  const [bottom, top] = [h.torso.profile.at(-1)![1], h.torso.profile[0]![1]];
  /** Leg-zone height, and torso-zone height (continuous at the torso bottom). */
  const L = (y: number) => y * f.leg;
  const Tt = (y: number) => L(bottom) + (y - bottom) * f.torso;
  const dy = Tt(top) - top; // the head moves down with the neck
  const D = (y: number) => y + dy;
  /** The torso width factor (across X and Z); the height factor stays `torso`. Defaults to `torso` (an upright copy). */
  const W = f.wide ?? f.torso;
  /** Head scale (1 = the hero head). Only the adult body uses a smaller head. */
  const HF = f.head ?? 1;
  /** Rest outward angle of the arms in degrees (0 = the hero hang). Only the adult uses it. */
  const OA = ((f.armOut ?? 0) * Math.PI) / 180;
  /** Fist and hand size factor (default: the arm factor, as before). */
  const handF = f.hand ?? f.arm;
  /** Arm cross-section factor (default: arm * thick, as before). */
  const armR = f.armR ?? f.arm * f.thick;
  /** Knee and ankle height factors (default: the leg factor, as before). */
  const legK = f.legKnee ?? f.leg;
  const legA = f.legAnkle ?? f.leg;
  const t3 = (p: V3): V3 => [p[0] * W, Tt(p[1]), p[2] * W];
  const S: V3 = [h.shoulder[0] * W, Tt(h.shoulder[1]), h.shoulder[2]];
  /** An arm point: scaled about the shoulder, then turned out from the body by `armOut`. */
  const Araw = (p: V3): V3 => [S[0] + (p[0] - h.shoulder[0]) * f.arm, S[1] + (p[1] - h.shoulder[1]) * f.arm, S[2] + (p[2] - h.shoulder[2]) * f.arm];
  const A = (p: V3): V3 => {
    const q = Araw(p);
    if (OA === 0) return q;
    const dx = q[0] - S[0];
    const dy = q[1] - S[1];
    return [S[0] + dx * Math.cos(OA) - dy * Math.sin(OA), S[1] + dx * Math.sin(OA) + dy * Math.cos(OA), q[2]];
  };
  /** The forearm turn: the hand-side points rotate about the scaled elbow (a deeper rest bend). */
  const E = A(h.elbow);
  const [tz, tx] = [f.turn[0] * (Math.PI / 180), f.turn[1] * (Math.PI / 180)];
  const F = (p: V3): V3 => {
    const q = A(p);
    const [x, y, z] = [q[0] - E[0], q[1] - E[1], q[2] - E[2]];
    const [x1, y1] = [x * Math.cos(tz) - y * Math.sin(tz), x * Math.sin(tz) + y * Math.cos(tz)];
    return [E[0] + x1, E[1] + y1 * Math.cos(tx) - z * Math.sin(tx), E[2] + y1 * Math.sin(tx) + z * Math.cos(tx)];
  };
  const a3 = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
  /** Head center height: the D-shifted hero center, or dropped to the neck top when the head shrinks. */
  const HC = HF === 1 ? D(h.headY) : D(h.neck.y1) + (h.headY - h.neck.y1) * HF;
  const lgH = (p: V3): V3 => [p[0] * W, p[1] * f.leg, p[2] * f.leg];
  const lgK = (p: V3): V3 => [p[0] * W, p[1] * legK, p[2] * legK];
  const lgA = (p: V3): V3 => [p[0] * W, p[1] * legA, p[2] * legA];
  const r = f.thick;
  const ar = armR;
  const fi = h.fist;
  return {
    headY: HC,
    head: HF === 1 ? h.head : [h.head[0] * HF, h.head[1] * HF, h.head[2] * HF],
    eye: HF === 1 ? [h.eye[0], D(h.eye[1])] : [h.eye[0] * HF, HC + (h.eye[1] - h.headY) * HF],
    face: {
      cheekAt: HF === 1 ? [h.face.cheekAt[0], D(h.face.cheekAt[1]), h.face.cheekAt[2]] : [h.face.cheekAt[0] * HF, HC + (h.face.cheekAt[1] - h.headY) * HF, h.face.cheekAt[2] * HF],
      cheekR: HF === 1 ? h.face.cheekR : h.face.cheekR * HF,
      chinSize: HF === 1 ? h.face.chinSize : [h.face.chinSize[0] * HF, h.face.chinSize[1] * HF, h.face.chinSize[2] * HF],
      chinAt: HF === 1 ? [h.face.chinAt[0], D(h.face.chinAt[1]), h.face.chinAt[2]] : [h.face.chinAt[0] * HF, HC + (h.face.chinAt[1] - h.headY) * HF, h.face.chinAt[2] * HF],
      noseY: HF === 1 ? D(h.face.noseY) : HC + (h.face.noseY - h.headY) * HF,
      earAt: HF === 1 ? [h.face.earAt[0], D(h.face.earAt[1]), h.face.earAt[2]] : [h.face.earAt[0] * HF, HC + (h.face.earAt[1] - h.headY) * HF, h.face.earAt[2] * HF],
      browY: HF === 1 ? D(h.face.browY) : HC + (h.face.browY - h.headY) * HF,
      smileY: HF === 1 ? D(h.face.smileY) : HC + (h.face.smileY - h.headY) * HF,
      blushY: HF === 1 ? D(h.face.blushY) : HC + (h.face.blushY - h.headY) * HF,
    },
    neck: { y0: Tt(h.neck.y0), y1: D(h.neck.y1), r: HF === 1 ? h.neck.r : h.neck.r * HF },
    bones: {
      hips: t3(h.bones.hips),
      spine: t3(h.bones.spine),
      chest: t3(h.bones.chest),
      neck: t3(h.bones.neck),
      head: HF === 1 ? [h.bones.head[0], D(h.bones.head[1]), h.bones.head[2]] : [h.bones.head[0], HC - (h.headY - h.bones.head[1]) * HF, h.bones.head[2]],
      cloak: t3(h.bones.cloak),
    },
    shoulder: S,
    elbow: E,
    wrist: F(h.wrist),
    grip: F(h.grip),
    hip: lgH(h.hip),
    knee: lgK(h.knee),
    ankle: lgA(h.ankle),
    split: h.split * legK,
    limb: {
      upper: [h.limb.upper[0] * ar, h.limb.upper[1] * ar],
      fore: [h.limb.fore[0] * ar, h.limb.fore[1] * ar],
      thigh: h.limb.thigh * r,
      shin: h.limb.shin * r,
    },
    fist: {
      palmSize: a3(fi.palmSize, handF),
      palmAt: F(fi.palmAt),
      rollA: F(fi.rollA),
      rollB: F(fi.rollB),
      rollR: fi.rollR * handF,
      thumbA: F(fi.thumbA),
      thumbB: F(fi.thumbB),
      thumbR: [fi.thumbR[0] * handF, fi.thumbR[1] * handF],
    },
    torso: {
      profile: h.torso.profile.map(([x, y]): V2 => [x * W, Tt(y)]),
      hips: [Tt(h.torso.hips[0]), Tt(h.torso.hips[1])],
      spine: [Tt(h.torso.spine[0]), Tt(h.torso.spine[1])],
      chest: [Tt(h.torso.chest[0]), Tt(h.torso.chest[1])],
    },
    foot: { size: a3(h.foot.size, legA * f.shoe * 1.15), y: h.foot.y * legA, z: h.foot.z * legA * f.shoe * 1.15 },
    shirt: {
      sleeveStart: t3(h.shirt.sleeveStart),
      sleeveEnd: A(h.shirt.sleeveEnd),
      sleeveR: [h.shirt.sleeveR[0] * ar, h.shirt.sleeveR[1] * ar],
      collarY: Tt(h.shirt.collarY),
      hemY: Tt(h.shirt.hemY),
      belt: [Tt(h.shirt.belt[0]), Tt(h.shirt.belt[0]) + (h.shirt.belt[1] - h.shirt.belt[0])],
    },
    pants: {
      thighR: h.pants.thighR * r,
      shinR: [h.pants.shinR[0] * r, h.pants.shinR[1] * r],
      cuff: lgA(h.pants.cuff),
      hipsSize: [h.pants.hipsSize[0] * W, h.pants.hipsSize[1] * f.torso, h.pants.hipsSize[2] * W],
      hipsY: Tt(h.pants.hipsY),
    },
    shoe: { ...h.shoe, scale: legA * f.shoe },
    clips: {
      leg: h.clips.leg * f.leg,
      stride: f.leg,
      lift: f.lift,
      foreSwing: f.foreSwing,
      heelZ: h.clips.heelZ * f.leg,
      toeZ: h.clips.toeZ * f.leg,
      reach: (p) => {
        const q = A([-p[0], p[1], p[2]]);
        return [-q[0], q[1], q[2]];
      },
    },
  };
}

/** How far inside the head the singing-face bodies rest (metres); the song page moves them out by `SING_OUT` (src/song/timeline.ts). */
export const SING_DEPTH = 0.03;

/** The Chibi Sprouts age-5 body: the same head and face on a shorter torso, shorter arms, and shorter legs. */
export const AGE5: HumanoidProportions = scaled(HERO, FIVE);

/**
 * The adult factors: leg zone (the crotch) at about half the height, a slimmer torso (width
 * about 1.1 of the child's, not 1.35), longer thinner arms turned slightly out at rest, hands
 * scaled to the head, and a 0.8 head on the same Sprouts face. The head and the face sit lower
 * on the neck; the knee and the ankle follow the leg segments, not the whole leg zone, so the
 * thigh reads (the hero pelvis is tall). Mom is about 1.5 m: 4.7 heads. Dad, the tallest of the
 * family, gets his own slightly larger set later.
 */
const ADULT_F = { leg: 4.74, torso: 1.46, arm: 2.2, thick: 1.1, shoe: 0.9375, turn: [-4, -6], lift: 2, foreSwing: 0, wide: 0.924, head: 0.8, armOut: 12, hand: 1.2, armR: 1.25, legKnee: 3.25, legAnkle: 1.6 } as const;

/** The Chibi Sprouts adult body: the same head and face on a longer torso, longer arms, and longer legs. */
export const ADULT: HumanoidProportions = scaled(HERO, ADULT_F);

/** A humanoid kind: the slots and the looks. */
export interface HumanoidKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `skin`, `hair`, `eyes`, and `cloth` (the undershirt); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** The hair style (default 'swept'), or false for no hair (a bald head or a kind's own hair). */
  readonly hair?: AvatarHairStyle | false;
  /** False: no undershirt (a robe or a dress covers the torso). */
  readonly undershirt?: boolean;
  /** The trousers color, or false for none (default a warm grey-brown). */
  readonly pants?: string | false;
  /** The shoe color, or false for none (default brown). */
  readonly shoes?: string | false;
  /**
   * A two-hand hold (a tray, a basket): the left elbow and wrist of the rest pose (the right arm
   * mirrors them). The fist turns with the forearm. The arms keep this pose in every clip and move
   * only with the chest, so an item rigid on `hand.R` stays between the fists.
   */
  readonly hold?: ArmPose;
  /**
   * One arm or both in a held rest pose (a raised tankard, a bell, a lantern): the elbow and wrist,
   * written for the left side (x > 0); the `R` pose is mirrored to the right arm. A posed arm keeps
   * its pose in every clip and moves only with the chest, and its hand stays level; the other arm
   * keeps the clip motion. Build sleeves and cuffs for both arms with `h.perArm`.
   */
  readonly pose?: { readonly L?: ArmPose; readonly R?: ArmPose };
  /** False: no winged lashes at the outer eye corners (for older or boyish faces). Default true. */
  readonly lashes?: boolean;
  /** The body proportions (default `HERO`, the Chibi Quest hero; `AGE5` is the Chibi Sprouts child). */
  readonly proportions?: HumanoidProportions;
  /**
   * A singing face for the Storytime song page: an open-mouth body rigid on a `mouth` bone and
   * eyelids rigid on an `eyelids` bone, both children of `head`. At rest they sit 3 cm inside the
   * head (hidden); the song page moves the bones forward per word (`mouth`) and per blink
   * (`eyelids`). No clip poses them, so every other render shows the painted face only.
   */
  readonly sing?: boolean;
  /**
   * The Chibi Sprouts face fixes (Storytime cast fix). Off by default: the hero, the NPCs, and the
   * avatar pack keep their old geometry. On: the singing eyelids follow the head surface, so no skin
   * flap shows at the outer eye corners.
   */
  readonly sproutFace?: boolean;
  /**
   * The Chibi Sprouts hands (Storytime cast fix). Off by default: the hero, the NPCs, and the avatar
   * pack keep the closed fist. On: a relaxed open hand (palm, thumb, four fingers) replaces the fist.
   * The index finger (`index.L/R`) and the other three fingers (`fingers.L/R`) are bones, so a clip can
   * open the hand (`HAND_OPEN`), fold the three fingers and point with the index (touch nose), or leave
   * the relaxed rest curl. The grip anchors `knife.L` and `knife.R` stay where they were.
   */
  readonly sproutHands?: boolean;
  /** Paint on the skin body after the face paint (a beard shadow, freckles, age lines). */
  paintSkin?(skin: sdf.Shape, h: HumanoidShape): sdf.Shape;
  /** Extra bodies: clothes, hats, tools. */
  extra?(k: AssetContext, h: HumanoidShape): void;
}

/** An arm's rest pose: the elbow and the wrist (left-side coordinates, x > 0). */
export interface ArmPose {
  readonly elbow: V3;
  readonly wrist: V3;
}

/** An arm's joints in left-side coordinates (x > 0): the elbow, the wrist, and the grip center in the fist. */
export interface ArmJoints {
  readonly ELBOW: V3;
  readonly WRIST: V3;
  readonly GRIP: V3;
}

/** The humanoid's shapes and joints that a kind builds on. */
export interface HumanoidShape {
  /** The hero torso (the chest-armor contract at 1x), untagged. */
  readonly torso: sdf.Shape;
  /** Adds the hips, spine, and chest bone tags in bands to a torso-like shape. */
  weighted(s: sdf.Shape): sdf.Shape;
  /** A slab between two heights (for bands and cuts). */
  band(y0: number, y1: number): sdf.Shape;
  /** The head (skull, cheeks, chin) on the head bone. */
  readonly head: sdf.Shape;
  /** The z of the face surface at (x, y). */
  faceZ(x: number, y: number): number;
  /** Moves a stencil to the face surface at (x, y) (the absolute x decides the depth). */
  onFace(s: sdf.Shape, x: number, y: number): sdf.Shape;
  readonly joints: {
    readonly SHOULDER: V3;
    readonly ELBOW: V3;
    readonly WRIST: V3;
    readonly HIP: V3;
    readonly KNEE: V3;
    readonly ANKLE: V3;
    readonly GRIP: V3;
    readonly HEAD_Y: number;
    readonly EYE: readonly [number, number];
  };
  /** The joints of each arm in left-side coordinates (x > 0); they differ when a `pose` moves one arm. */
  readonly arms: { readonly L: ArmJoints; readonly R: ArmJoints };
  /**
   * A shape for both arms (sleeves, cuffs, bracers): `build` makes the left one from the left arm's
   * joints (x > 0, `.L` tags); the right one comes from the right arm's joints, mirrored (`.R` tags).
   * Without a one-arm `pose` this is `build(arms.L).mirror('x')`.
   */
  perArm(build: (j: ArmJoints) => sdf.Shape): sdf.Shape;
  readonly tint: Readonly<Record<string, string>>;
  /** With `sproutHands`: the extended index fingertip minus the grip center, in left-hand coordinates (x > 0). */
  readonly indexReach?: V3;
}

/** Degrees that a finger bone turns about X to open the relaxed hand (+) or to fold a finger onto the palm (-). */
export const HAND_OPEN = 12;
export const HAND_FOLD = -75;

/**
 * The Chibi Sprouts hand in left-hand coordinates (x > 0, thumb outward, palm forward and up 20 degrees, the
 * fingers hanging). Built in a local frame (x across, y down the fingers, z out of the palm) and placed at the
 * fist center. At rest the fingers curl 12 and then 40 degrees toward the palm; `HAND_OPEN` straightens the
 * first joint. `hand` is the palm, cuff, and thumb; `fingers` the middle, ring, and little finger; `index` the
 * index finger (the one beside the thumb).
 */
function sproutHand(P: HumanoidProportions) {
  const sc = P.fist.palmSize[1] / HERO.fist.palmSize[1];
  const s = (n: number) => n * sc;
  const o = P.fist.palmAt;
  const tilt = new THREE.Matrix4().makeRotationX((-20 * Math.PI) / 180);
  const world = (p: V3): V3 => {
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(tilt);
    return [o[0] + v.x, o[1] + v.y, o[2] + v.z];
  };
  const place = (sh: sdf.Shape) => sh.rotateX(-20).at(o[0], o[1], o[2]);
  const A1 = (12 * Math.PI) / 180;
  const A2 = (40 * Math.PI) / 180;
  const KNUCKLE = -s(0.026);
  const finger = (u: number, len: number, r: number) => {
    const p0: V3 = [s(u), KNUCKLE, 0];
    const l1 = s(len) * 0.55;
    const l2 = s(len) * 0.45;
    const p1: V3 = [p0[0], p0[1] - l1 * Math.cos(A1), l1 * Math.sin(A1)];
    const p2: V3 = [p0[0], p1[1] - l2 * Math.cos(A2), p1[2] + l2 * Math.sin(A2)];
    return { shape: sdf.smoothUnion(s(0.004), sdf.capsule(p0, p1, s(r)), sdf.capsule(p1, p2, s(r * 0.9))), p0, p2 };
  };
  const idx = finger(0.0322, 0.062, 0.0086);
  const mid = finger(0.0107, 0.057, 0.0088);
  const ring = finger(-0.0107, 0.05, 0.0086);
  const pinky = finger(-0.0322, 0.04, 0.0078);
  const palm = sdf.smoothUnion(
    s(0.012),
    sdf.ellipsoid([s(0.037), s(0.03), s(0.0145)]),
    sdf.cone([0, s(0.045), 0], [0, -s(0.005), 0], s(0.034), s(0.03)), // the cuff over the end of the forearm
    sdf.smoothUnion(
      s(0.006),
      sdf.capsule([s(0.03), s(0.012), s(0.005)], [s(0.056), -s(0.022), s(0.012)], s(0.0095)),
      sdf.capsule([s(0.056), -s(0.022), s(0.012)], [s(0.059), -s(0.04), s(0.016)], s(0.0085)),
    ), // the thumb
  );
  const fingers = sdf.smoothUnion(s(0.003), mid.shape, ring.shape, pinky.shape);
  const pivots = { fingers: world([0, KNUCKLE, 0]), index: world(idx.p0) };
  // The extended index tip: the first joint turned HAND_OPEN degrees about X around its knuckle.
  const th = (HAND_OPEN * Math.PI) / 180;
  const dy = idx.p2[1] - idx.p0[1];
  const dz = idx.p2[2] - idx.p0[2];
  const tipOpen = world([idx.p0[0], idx.p0[1] + dy * Math.cos(th) - dz * Math.sin(th), idx.p0[2] + dy * Math.sin(th) + dz * Math.cos(th)]);
  return {
    hand: place(palm).bone('hand.L'),
    fingers: place(fingers).bone('fingers.L'),
    index: place(idx.shape).bone('index.L'),
    pivots,
    tipOpen,
  };
}

export function humanoidAsset(kind: HumanoidKind): AssetDefinition {
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const P = kind.proportions ?? HERO;
      const HEAD_Y = P.headY;
      const HEAD = P.head;
      const EYE = P.eye;
      // The slot colors: shades of a slot follow it when a game recolors the slot (as in the rogue).
      const T = {
        iris: k.tint('eyes'),
        irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
        brow: k.tint('hair', { color: C.brow, follow: 1 }),
        skin: k.tint('skin'),
        blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
        mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
        shirt: k.tint('cloth'),
        trim: k.tint('cloth', { color: C.shirtTrim, follow: 1 }),
      };

      // ------------------------------------------------------------------ skeleton (the rogue's)
      const SHOULDER = P.shoulder;
      const ELBOW0: V3 = P.elbow;
      const WRIST0: V3 = P.wrist;
      // The grip center in each fist: the anchor of the mainhand (knife.R) and offhand (knife.L) slots.
      const GRIP0: V3 = P.grip;
      const deg = 180 / Math.PI;
      // A held pose turns the hand by the rotation that takes the hanging forearm to the posed one.
      const armOf = (pose: ArmPose | undefined) => {
        const ELBOW = pose?.elbow ?? ELBOW0;
        const WRIST = pose?.wrist ?? WRIST0;
        const turn = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3().subVectors(new THREE.Vector3(...WRIST0), new THREE.Vector3(...ELBOW0)).normalize(),
          new THREE.Vector3().subVectors(new THREE.Vector3(...WRIST), new THREE.Vector3(...ELBOW)).normalize(),
        );
        const e = new THREE.Euler().setFromQuaternion(turn, 'ZYX');
        const toHand = (s: sdf.Shape) =>
          pose
            ? s
                .at(-WRIST0[0], -WRIST0[1], -WRIST0[2])
                .rotateX(e.x * deg)
                .rotateY(e.y * deg)
                .rotateZ(e.z * deg)
                .at(...WRIST)
            : s;
        const point = (p: V3): V3 => {
          const v = new THREE.Vector3(p[0] - WRIST0[0], p[1] - WRIST0[1], p[2] - WRIST0[2]).applyQuaternion(turn);
          return [WRIST[0] + v.x, WRIST[1] + v.y, WRIST[2] + v.z];
        };
        return { ELBOW, WRIST, GRIP: pose ? point(GRIP0) : GRIP0, toHand };
      };
      const jointsL = armOf(kind.hold ?? kind.pose?.L);
      const jointsR = armOf(kind.hold ?? kind.pose?.R);
      const { ELBOW, WRIST, GRIP } = jointsL;
      if (kind.sproutHands && (kind.hold || kind.pose)) throw new Error(`${kind.name}: sproutHands needs the two-arm rest pose`);
      const sproutHandParts = kind.sproutHands ? sproutHand(P) : undefined;
      // A one-arm pose builds each arm from its own joints; otherwise the right arm mirrors the left.
      const oneSided = !kind.hold && kind.pose !== undefined;
      const perArm = (build: (j: ArmJoints) => sdf.Shape) =>
        oneSided ? sdf.union(build(jointsL), build(jointsR).mirror('x').intersect(sdf.halfSpace([1, 0, 0], 0))) : pair(build(jointsL));
      const HIP = P.hip;
      const ANKLE = P.ankle;
      const KNEE = P.knee; // the knee: splits the leg (shin.L takes the weight below it)
      const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
      k.skeleton({
        hips: { at: P.bones.hips },
        spine: { parent: 'hips', at: P.bones.spine },
        chest: { parent: 'spine', at: P.bones.chest },
        neck: { parent: 'chest', at: P.bones.neck },
        head: { parent: 'neck', at: P.bones.head },
        cloak: { parent: 'chest', at: P.bones.cloak },
        'upperarm.L': { parent: 'chest', at: SHOULDER },
        'forearm.L': { parent: 'upperarm.L', at: ELBOW },
        'hand.L': { parent: 'forearm.L', at: WRIST },
        'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
        'forearm.R': { parent: 'upperarm.R', at: mx(jointsR.ELBOW) },
        'hand.R': { parent: 'forearm.R', at: mx(jointsR.WRIST) },
        'knife.L': { parent: 'hand.L', at: GRIP },
        'knife.R': { parent: 'hand.R', at: mx(jointsR.GRIP) },
        ...(kind.sproutHands
          ? {
              'fingers.L': { parent: 'hand.L', at: sproutHandParts!.pivots.fingers },
              'index.L': { parent: 'hand.L', at: sproutHandParts!.pivots.index },
              'fingers.R': { parent: 'hand.R', at: mx(sproutHandParts!.pivots.fingers) },
              'index.R': { parent: 'hand.R', at: mx(sproutHandParts!.pivots.index) },
            }
          : {}),
        'leg.L': { parent: 'hips', at: HIP },
        'shin.L': { parent: 'leg.L', at: KNEE, split: P.split },
        'foot.L': { parent: 'shin.L', at: ANKLE },
        'leg.R': { parent: 'hips', at: mx(HIP) },
        'shin.R': { parent: 'leg.R', at: mx(KNEE), split: P.split },
        'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
        // The singing face (`sing`): the bones sit at the head centre depth; their bodies are placed in world space.
        ...(kind.sing ? { mouth: { parent: 'head', at: [0, P.face.smileY, 0] as V3 }, eyelids: { parent: 'head', at: [0, P.eye[1], 0] as V3 } } : {}),
      });

      // ------------------------------------------------------------------ head and face (the rogue's)
      const head = sdf
        .smoothUnion(
          0.06,
          sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
          pair(sdf.sphere(P.face.cheekR).at(...P.face.cheekAt)), // round cheeks
          sdf.ellipsoid(P.face.chinSize).at(...P.face.chinAt), // soft chin
        )
        .bone('head');
      const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
      const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, P.face.noseY, faceZ(0, P.face.noseY) - 0.004).bone('head');
      const ears = pair(
        sdf
          .ellipsoid([0.026, 0.044, 0.032])
          .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
          .rotateY(-12)
          .at(...P.face.earAt)
          .bone('head'),
      );
      const neck = sdf.capsule([0, P.neck.y0, -0.01], [0, P.neck.y1, -0.01], P.neck.r).bone('neck');

      // Arms: the upper arm under the short sleeve, the bare forearm, and a closed fist that holds a grip.
      const armShape = (j: typeof jointsL) => {
        const arm = sdf.smoothUnion(
          0.02,
          sdf.cone(SHOULDER, j.ELBOW, ...P.limb.upper).bone('upperarm.L'),
          sdf.cone(j.ELBOW, j.WRIST, ...P.limb.fore).bone('forearm.L'),
        );
        const fist = j
          .toHand(
            sdf.smoothUnion(
              0.018,
              sdf.ellipsoid(P.fist.palmSize).at(...P.fist.palmAt), // palm and closed fingers
              sdf.capsule(P.fist.rollA, P.fist.rollB, P.fist.rollR), // finger roll at the front
              sdf.cone(P.fist.thumbA, P.fist.thumbB, ...P.fist.thumbR), // thumb over the fingers
            ),
          )
          .bone('hand.L');
        return kind.sproutHands ? arm : sdf.smoothUnion(0.02, arm, fist);
      };
      const arms = oneSided ? perArm((j) => armShape(j === jointsL ? jointsL : jointsR)) : pair(armShape(jointsL));

      // The hero torso (the chest-armor contract at 1x). Three tagged bands set the skin weights; the
      // union with the whole torso keeps the surface exactly as it is.
      const torso = sdf
        .revolve(
          profile.polygon(
            P.torso.profile.map(([x, y]): [number, number] => [x, y]),
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.78]);
      const band = (y0: number, y1: number) => sdf.box([0.6, y1 - y0, 0.6]).at(0, (y0 + y1) / 2, 0);
      const weighted = (s: sdf.Shape) =>
        sdf.union(s, s.intersect(band(...P.torso.hips)).bone('hips'), s.intersect(band(...P.torso.spine)).bone('spine'), s.intersect(band(...P.torso.chest)).bone('chest'));
      const bodySkin = weighted(torso.round(-0.008));

      // Legs: thigh and shin inside the trousers, a foot inside each shoe.
      const leg = sdf.smoothUnion(
        0.015,
        sdf.capsule(HIP, KNEE, P.limb.thigh).bone('leg.L'),
        sdf.capsule(KNEE, ANKLE, P.limb.shin).bone('shin.L'),
        sdf.ellipsoid(P.foot.size).at(ANKLE[0], P.foot.y, P.foot.z).bone('foot.L'),
      );
      const legs = pair(leg);

      // Face paint: stencils cross the face along Z, so they always meet the curved surface.
      const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
      const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
      const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
      const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
      const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
      const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
      // The lid and the lash end where the face turns into the temple: a stencil along Z would
      // otherwise paint a streak back along the side of the head (it read as a glasses arm).
      const front = (s: sdf.Shape, x: number, y: number) => s.intersect(sdf.halfSpace([0, 0, -1], 0.008 - faceZ(x, y)));
      const lid = pair(front(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1), EYE[0] + 0.048, EYE[1] + 0.012));
      const lash = pair(
        front(
          sdf
            .extrude(
              profile.polygon([
                [0, 0],
                [0.022, 0.016],
                [0.026, 0.01],
                [0.004, -0.008],
              ]),
              0.3,
            )
            .at(EYE[0] + 0.043, EYE[1] + 0.012, 0.1),
          EYE[0] + 0.069,
          EYE[1] + 0.025,
        ),
      );
      // Both highlights sit up and to the +X side: one light for the whole face.
      const shine = sdf.union(
        ...[EYE[0], -EYE[0]].flatMap((x) => [
          at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
          at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
        ]),
      );
      const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 58, 122), 0.3).at(0.1, P.face.browY - 0.1, 0.1));
      const smile = sdf.extrude(profile.arc(0.07, 0.01, 241, 299), 0.3).at(0, P.face.smileY + 0.07, 0.1);
      const blush = pair(at(sdf.sphere(0.032), 0.135, P.face.blushY));

      const lidded = sdf
        .smoothUnion(0.03, head, neck)
        .smoothUnion(0.012, nose, ears)
        .union(arms, bodySkin, legs)
        .paintWhere(blush, T.blush, 0.03)
        .paintWhere(eyeWhite, C.eyeWhite)
        .paintWhere(irisRim, C.irisRim)
        .paintWhere(iris, T.iris)
        .paintWhere(irisLow, T.irisLow, 0.012)
        .paintWhere(pupil, C.pupil)
        .paintWhere(lid, C.lid);
      // The winged lashes (the hero face); `lashes: false` leaves them off (older or boyish faces).
      const skinBase = (kind.lashes === false ? lidded : lidded.paintWhere(lash, C.lid))
        .paintWhere(shine, '#ffffff')
        .paintWhere(brows, T.brow)
        .paintWhere(smile, T.mouth);
      const shape: HumanoidShape = {
        torso,
        weighted,
        band,
        head,
        faceZ,
        onFace: at,
        joints: { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, GRIP, HEAD_Y, EYE },
        arms: { L: jointsL, R: jointsR },
        perArm,
        tint: T,
        ...(sproutHandParts
          ? { indexReach: [sproutHandParts.tipOpen[0] - GRIP[0], sproutHandParts.tipOpen[1] - GRIP[1], sproutHandParts.tipOpen[2] - GRIP[2]] as V3 }
          : {}),
      };
      const skin = kind.paintSkin ? kind.paintSkin(skinBase, shape) : skinBase;
      k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });
      // The Sprout hands: a separate body at a finer mesh cell (the fingers are 1 cm thick), on the skin color.
      if (sproutHandParts) {
        const left = sdf.union(sproutHandParts.hand, sproutHandParts.fingers, sproutHandParts.index);
        k.body('hands', pair(left), { color: T.skin, roughness: 0.55, detail: 0.0028 });
      }

      // ------------------------------------------------------------------ the singing face (`sing`)
      // The open mouth (a dark flat ellipsoid with a tongue) hangs below the painted smile, which
      // becomes the upper lip; the eyelids are skin-colored discs over the eyes. Both start 3 cm
      // inside the head (`SING_DEPTH`) and the song page moves their bones out along +Z.
      if (kind.sing) {
        const mY = P.face.smileY - 0.016;
        const mouthOpen = sdf
          .ellipsoid([0.04, 0.027, 0.012])
          .at(0, mY, faceZ(0, mY) - SING_DEPTH)
          .union(sdf.sphere(0.012).at(0, mY - 0.014, faceZ(0, mY) - SING_DEPTH + 0.004).paint('#c9605a'));
        k.body('mouth-open', mouthOpen, { color: '#4e2522', roughness: 0.7, detail: 0.003, bone: 'mouth' });
        // The flat disc sits 3 cm inside the face at the eye centre, but the head turns away at the outer
        // eye corner, so the disc came through the skin there (a skin flap under the lash). `sproutFace`
        // cuts the lid from the head surface itself, moved back by `SING_DEPTH` and grown 4 mm: it stays
        // inside the head at rest and meets the face when the song page moves the bone forward.
        // The lid back must stay inside the skull (defect D1: the full-depth lids cleared the
        // skull at the back-side corners and read as skin discs from the back). Keep only a thin
        // disc behind the lid front: the front (and every front view) is unchanged, and nothing
        // reaches the back of the skull at any size.
        const lidFrontZ = faceZ(EYE[0], EYE[1]) - SING_DEPTH;
        const eyelids = pair(
          kind.sproutFace
            ? head
                .at(0, 0, -SING_DEPTH)
                .intersect(sdf.extrude(profile.circle(1), 0.6).scale([0.058, 0.06, 1]).at(EYE[0], EYE[1], 0))
                .intersect(sdf.halfSpace([0, 0, -1], 0.02 - lidFrontZ))
                .round(0.004)
            : sdf.ellipsoid([0.058, 0.06, 0.012]).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - SING_DEPTH),
        );
        k.body('eyelid-skin', eyelids, { color: T.skin, roughness: 0.55, bone: 'eyelids' });
      }

      // ------------------------------------------------------------------ hair (the default style)
      if (kind.hair !== false)
        addPart(k, avatarHair(kind.hair ?? 'swept', mapTint(k), { capped: k.worn?.capHair ?? false, tucked: k.worn?.tuckHair ?? false, head: { size: HEAD } }), { pose: (s) => s.at(0, HEAD_Y, 0) });

      // ------------------------------------------------------------------ undershirt
      // The hero torso with short sleeves to the elbow, a darker collar and hem, and a painted belt.
      // The sleeve ends short of the elbow (a posed arm moves the end with its elbow).
      const sleeveEnd = (j: ArmJoints): V3 =>
        j.ELBOW === ELBOW0 ? P.shirt.sleeveEnd : [j.ELBOW[0] - 0.008, j.ELBOW[1] + 0.016, j.ELBOW[2] - 0.002];
      const sleeves = perArm((j) => sdf.cone(P.shirt.sleeveStart, sleeveEnd(j), ...P.shirt.sleeveR).bone('upperarm.L'));
      const collar = sdf.halfSpace([0, -1, 0], -P.shirt.collarY);
      const hem = sdf.halfSpace([0, 1, 0], P.shirt.hemY);
      const belt = band(...P.shirt.belt);
      const shirt = sdf
        .smoothUnion(0.012, weighted(torso), sleeves)
        .paintWhere(collar, T.trim, 0.003)
        .paintWhere(hem, T.trim, 0.003)
        .paintWhere(belt, C.belt, 0.002);
      if (kind.undershirt !== false) k.body('undershirt', shirt, { color: T.shirt, roughness: 0.85 });

      // ------------------------------------------------------------------ trousers
      const trouserLeg = sdf.smoothUnion(
        0.012,
        sdf.capsule(HIP, KNEE, P.pants.thighR).bone('leg.L'),
        sdf.cone(KNEE, P.pants.cuff, ...P.pants.shinR).bone('shin.L'),
      );
      const pants = sdf.smoothUnion(0.03, sdf.ellipsoid(P.pants.hipsSize).at(0, P.pants.hipsY, 0).bone('hips'), pair(trouserLeg));
      if (kind.pants !== false) k.body('pants', pants, { color: kind.pants ?? C.pants, roughness: 0.85 });

      // ------------------------------------------------------------------ shoes
      // A plain shoe at the ankle's ground point, turned out a little, with a darker sole.
      const shoeFoot = sdf
        .smoothUnion(
          0.03,
          sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0),
          sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0));
      const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], P.shoe.soleTop)).intersect(sdf.halfSpace([0, -1, 0], 0));
      const turned = sdf.union(shoeFoot, sole.paint(C.sole)).rotateY(12);
      const shoe = (P.shoe.scale === 1 ? turned : turned.scale(P.shoe.scale)).at(ANKLE[0], 0, 0).bone('foot.L');
      if (kind.shoes !== false) k.body('shoes', pair(shoe), { color: kind.shoes ?? C.shoe, roughness: 0.6 });
      kind.extra?.(k, shape);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys, reach, orient } = motion;
      // A hold keeps the arms in the rest pose (on the held item) in every clip, and the hands take
      // back the lean and roll of the spine and the chest, so the held item stays level. In the
      // cheer, the cast, and the attack, both upper arms lift the item forward a little (degrees by
      // phase): a raise with the hop, a push with the cast, an offer with the attack.
      const ARM_BONE = /^(upperarm|forearm|hand)\.([LR])$/;
      const posed = { L: (kind.hold ?? kind.pose?.L) !== undefined, R: (kind.hold ?? kind.pose?.R) !== undefined };
      const HOLD_LIFT: Record<string, (p: number) => number> = {
        cheer: (p) => 15 * Math.min(1, Math.max(0, Math.sin(Math.min(1, Math.max(0, (p - 0.25) / 0.55)) * Math.PI))),
        cast: (p) => 14 * keys(p, [[0, 0], [0.3, 0], [0.52, 1], [0.74, 1], [1, 0]] as const, 'spline'),
        attack: (p) => 16 * keys(p, [[0, 0], [0.3, 0.15], [0.5, 1], [0.62, 1], [1, 0]] as const, 'spline'),
      };
      const holdPose = (pose: Pose, lift: number): Pose => {
        const tilt = (axis: 0 | 2) => -((pose.spine?.rotate?.[axis] ?? 0) + (pose.chest?.rotate?.[axis] ?? 0));
        const arm = { rotate: [-lift, 0, 0] as const };
        const level = { rotate: [tilt(0) + lift, 0, tilt(2)] as const };
        const out: Record<string, BonePose> = Object.fromEntries(
          Object.entries(pose).filter(([b]) => {
            const m = ARM_BONE.exec(b);
            return !m || !posed[m[2] as 'L' | 'R'];
          }),
        );
        for (const side of ['L', 'R'] as const) if (posed[side]) out[`upperarm.${side}`] = arm;
        for (const side of ['L', 'R'] as const) if (posed[side]) out[`hand.${side}`] = level;
        return out;
      };
      const animation = (name: string, def: AnimationDef) =>
        k.animation(
          name,
          posed.L || posed.R ? { ...def, pose: (t, p) => holdPose(def.pose(t, p), kind.hold ? (HOLD_LIFT[name]?.(p) ?? 0) : 0) } : def,
        );
      const LEG = P.clips.leg;
      const K = P.clips.stride;
      const KL = P.clips.lift ?? K;
      const FORE = P.clips.foreSwing ?? 0;
      const tg = P.clips.reach;
      const rad = Math.PI / 180;
      type V3 = readonly [number, number, number];

      animation('idle', {
        duration: 2.4,
        pose: (_t, p) => ({
          hips: { move: [0, -0.003 * bump(p), 0] },
          chest: { rotate: [2.5 * wave(p), 0, 0] },
          neck: { rotate: [-1.5 * wave(p), 0, 0] },
          head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
          cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
          'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
          'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
          'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
          'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
          'hand.L': { rotate: steady(armL, [2 * wave(p, 1, 0.1), 0, 3 * bump(p)], [-5 * bump(p), 0, 0]) },
          'hand.R': { rotate: steady(armR, [2 * wave(p, 1, 0.1), 0, -3 * bump(p)], [-5 * bump(p), 0, 0]) },
        }),
      });

      // The rogue's stride: the legs come from motion.gait (planted stance feet, a knee lift in the
      // swing, heel strike, and toe-off); the arms swing against the legs.
      const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number, flow: number) => ({
        duration,
        pose: (_t: number, p: number) => {
          const s = wave(p);
          const hipsTurn = [0, 7 * s, 0] as const;
          const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
            stride: step,
            lift,
            duty,
            bob: hop,
            roll: 10,
            heel: [ANKLE[0], 0, P.clips.heelZ],
            toe: [ANKLE[0], 0, P.clips.toeZ],
            hips: { at: P.bones.hips, rotate: hipsTurn },
          });
          return {
            ...legs.pose,
            hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
            spine: { rotate: [lean, 0, 0] as const },
            chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
            head: { rotate: [-lean, 5 * s, 0] as const },
            cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
            'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
            'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
            'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s) - FORE * wave(p, 1, 0.25), 0, 0] as const },
            'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s) + FORE * wave(p, 1, 0.25), 0, 0] as const },
            // The wrists take back most of the arm swing, so a held weapon or shield stays steady.
            'hand.L': { rotate: [-0.8 * (armSwing * s - armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s)), 0, 0] as const },
            'hand.R': { rotate: [-0.8 * (-armSwing * s - armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s)), 0, 0] as const },
          };
        },
      });
      animation('walk', stride(0.9, 0.1 * K, 0.025 * KL, 0.6, 28, 3, 0.006 * KL, 6));
      animation('run', stride(0.56, 0.15 * K, 0.045 * KL, 0.4, 50, 12, 0.03 * KL, 22));

      // One arm from a wrist target and an elbow pole, both in the chest's rest frame. Keys are
      // written for the right arm (x < 0); `m` mirrors them for the left arm.
      // The held item (src/equip.ts, the grip socket): at rest its business end points forward and
      // 20 degrees up and its flat faces outward. `aim` turns the hand so that the item points along
      // `dir` with the flat toward `up` (chest frame, right-arm keys); a shield on the hand turns with it.
      const ITEM_DIR: V3 = [0, Math.sin(20 * rad), Math.cos(20 * rad)];
      const armRig = (side: 1 | -1) => {
        const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
        const tag = side === 1 ? 'L' : 'R';
        const j = side === 1 ? jointsL : jointsR;
        const chain = { root: m(mx(SHOULDER)), mid: m(mx(j.ELBOW)), end: m(mx(j.WRIST)) };
        const item = { dir: ITEM_DIR, up: m([-1, 0, 0]) };
        const pose = (wrist: V3, pole: V3, aim?: { dir: V3; up: V3 }) => {
          const a = reach(chain, wrist, pole);
          return {
            [`upperarm.${tag}`]: { rotate: a.upper },
            [`forearm.${tag}`]: { rotate: a.lower },
            [`hand.${tag}`]: { rotate: aim ? orient([a.upper, a.lower], item, { dir: m(aim.dir), up: m(aim.up) }) : ([0, 0, 0] as V3) },
          };
        };
        return { m, chain, pose, item, rest: m(tg([-0.58, 0.6, -0.015])) };
      };
      const norm = (v: V3): V3 => {
        const l = Math.hypot(...v);
        return [v[0] / l, v[1] / l, v[2] / l];
      };
      /** The rest aim of a right-hand item: forward and 20 degrees up, the flat outward. */
      const AIM_REST = { dir: ITEM_DIR, up: [-1, 0, 0] as V3 };
      /** The wrist turn that keeps a held item (a shield) as it is at rest while the arm moves. */
      const steady = (arm: typeof armR, upper: V3, lower: V3) => orient([upper, lower], arm.item, { dir: arm.m(AIM_REST.dir), up: arm.m(AIM_REST.up) });
      const armR = armRig(-1);
      const armL = armRig(1);
      // A crouch with the feet planted: the thigh swings forward by `a`, the shin back by 2a, and the
      // foot stays flat; the hips drop by the legs' lost height.
      const THIGH = Math.hypot(HIP[0] - KNEE[0], HIP[1] - KNEE[1]);
      const SHIN = Math.hypot(KNEE[0] - ANKLE[0], KNEE[1] - ANKLE[1]);
      const crouch = (a: number) => ({
        drop: (THIGH + SHIN) * (1 - Math.cos(a * rad)),
        bones: {
          'leg.L': { rotate: [-a, 0, 0] as V3 },
          'leg.R': { rotate: [-a, 0, 0] as V3 },
          'shin.L': { rotate: [2 * a, 0, 0] as V3 },
          'shin.R': { rotate: [2 * a, 0, 0] as V3 },
          'foot.L': { rotate: [-a, 0, 0] as V3 },
          'foot.R': { rotate: [-a, 0, 0] as V3 },
        },
      });

      // ------------------------------------------------------------------ attack: a one-handed slash
      // The mainhand (right) fist winds out and back at the side, the torso coils to the right, then
      // unwinds and sweeps the fist across the front at chest height to the left, and returns. A held
      // weapon on `knife.R` follows the fist; the path stays in front of the body and below the chin.
      animation('attack', {
        duration: 0.7,
        loop: false,
        pose: (_t, p) => {
          const wrist = keys(p, [
            [0, armR.chain.end],
            [0.25, tg([-0.26, 0.34, -0.05])], // wound out and back at the side
            [0.33, tg([-0.27, 0.345, -0.05])],
            [0.43, tg([-0.16, 0.35, 0.13])], // in front, chest high
            [0.52, tg([0.0, 0.32, 0.15])], // across the front
            [0.6, tg([0.05, 0.3, 0.12])], // follow-through
            [0.8, tg([-0.15, 0.27, 0.07])],
            [1, armR.chain.end],
          ] as [number, V3][], 'spline');
          const pole = keys(p, [
            [0, armR.rest],
            [0.25, tg([-0.6, 0.25, -0.3])], // elbow out and back
            [0.33, tg([-0.6, 0.25, -0.3])],
            [0.45, tg([-0.55, 0.45, -0.05])], // elbow out to the side for the sweep
            [0.6, tg([-0.4, 0.3, 0.1])],
            [1, armR.rest],
          ] as [number, V3][]);
          // The blade: up and back over the right shoulder in the wind-up, then a flat sweep out in
          // front and across to the left (the flat faces up, so the edge leads), and back to rest.
          const dir = norm(
            keys(p, [
              [0, AIM_REST.dir],
              [0.25, [-0.55, 0.75, -0.35]],
              [0.33, [-0.55, 0.75, -0.35]],
              [0.43, [-0.55, 0.2, 0.8]],
              [0.52, [0.45, 0.05, 0.9]],
              [0.6, [0.85, -0.1, 0.5]],
              [0.8, [0.2, 0.2, 0.95]],
              [1, AIM_REST.dir],
            ] as [number, V3][], 'spline'),
          );
          const up = norm(keys(p, [[0, AIM_REST.up], [0.3, [-0.9, 0.1, 0.4]], [0.43, [0, 1, 0.3]], [0.6, [0, 1, 0.3]], [1, AIM_REST.up]] as [number, V3][]));
          const turn = keys(p, [[0, 0], [0.25, -14], [0.33, -14], [0.52, 16], [0.62, 16], [1, 0]] as const);
          const chestY = keys(p, [[0, 0], [0.25, -18], [0.33, -18], [0.5, 20], [0.62, 20], [1, 0]] as const);
          const lean = keys(p, [[0, 0], [0.25, 3], [0.45, 9], [0.62, 7], [1, 0]] as const);
          const balance = keys(p, [[0, 0], [0.3, 1], [0.62, 1], [1, 0]] as const);
          return {
            hips: { rotate: [0, turn, 0] },
            spine: { rotate: [lean, 0, 0] },
            chest: { rotate: [lean / 3, chestY, 0] },
            head: { rotate: [-0.6 * lean, -0.6 * (turn + chestY), 0] },
            cloak: { rotate: [6 * balance, 0, 0] },
            ...armR.pose(wrist, pole, { dir, up }),
            'upperarm.L': { rotate: [-12 * balance, 0, 14 * balance] },
            'forearm.L': { rotate: [-20 * balance, 0, 0] },
            'hand.L': { rotate: steady(armL, [-12 * balance, 0, 14 * balance], [-20 * balance, 0, 0]) },
            'leg.L': { rotate: [0, -turn, 0] },
            'leg.R': { rotate: [0, -turn, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ hit: a blow from the front (the rogue's)
      const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
      animation('hit', {
        duration: 0.4,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
          const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
          const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
          const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
          const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
          const back = 0.03 * K * step;
          const lean = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
          return {
            hips: { move: [0, -motion.legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
            spine: { rotate: [-7 * h, 0, 0] },
            chest: { rotate: [-9 * h, 6 * h, -3 * h] },
            neck: { rotate: [-4 * whip, 0, 0] },
            head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
            cloak: { rotate: [12 * lag, 0, 4 * lag] },
            'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
            'forearm.L': { rotate: [-16 * h, 0, 0] },
            'upperarm.R': { rotate: [-8 * h, 0, -14 * h] },
            'forearm.R': { rotate: [-12 * h, 0, 0] },
            'hand.L': { rotate: steady(armL, [-12 * h, 0, 16 * h], [-16 * h, 0, 0]) },
            'hand.R': { rotate: steady(armR, [-8 * h, 0, -14 * h], [-12 * h, 0, 0]) },
            'leg.L': { rotate: [-lean, 0, 0] },
            'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
            'foot.L': { rotate: [lean, 0, 0] },
            'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ rest: catch the breath at camp
      // A loose crouch with the knees bent, the back rounded, the head down, and the arms hanging
      // forward; slow deep breaths lift the chest and the shoulders. Loops.
      const restLegs = crouch(26);
      animation('rest', {
        duration: 3.2,
        pose: (_t, p) => {
          const breath = bump(p);
          return {
            ...restLegs.bones,
            hips: { move: [0, -restLegs.drop, -0.01] },
            spine: { rotate: [12 - 2 * breath, 0, 0] },
            chest: { rotate: [6 - 3 * breath, 0, 0] },
            neck: { rotate: [6, 0, 0] },
            head: { rotate: [8 - 4 * breath, 6, 3] },
            cloak: { rotate: [-4, 0, 0] },
            'upperarm.L': { rotate: [-14 - 3 * breath, 0, 4] },
            'upperarm.R': { rotate: [-14 - 3 * breath, 0, -4] },
            'forearm.L': { rotate: [-18, 0, 0] },
            'forearm.R': { rotate: [-18, 0, 0] },
            'hand.L': { rotate: steady(armL, [-14 - 3 * breath, 0, 4], [-18, 0, 0]) },
            'hand.R': { rotate: steady(armR, [-14 - 3 * breath, 0, -4], [-18, 0, 0]) },
          };
        },
      });

      // ------------------------------------------------------------------ cheer: fists up and a hop
      // A dip, a hop with both fists pumped up beside the cheeks, a landing that gives in the knees.
      // Loops. The wrists stay well outside the cheeks (x 0.31), so held items stay clear of the head.
      const UP: V3 = tg([-0.31, 0.5, 0.05]);
      animation('cheer', {
        duration: 0.8,
        pose: (_t, p) => {
          const bend = keys(p, [[0, 0.6], [0.18, 1], [0.32, 0], [0.7, 0], [0.84, 0.8], [1, 0.6]] as const, 'spline');
          const air = clamp01(Math.sin(clamp01((p - 0.3) / 0.45) * Math.PI));
          const legs = crouch(22 * bend);
          const up = keys(p, [[0, 0.75], [0.2, 0.6], [0.4, 1], [0.7, 1], [1, 0.75]] as const, 'spline');
          // A held item rises with the fist: up and a little out, the flat outward, so a crossguard
          // or a shield rim spans front to back beside the head and never toward the cheek.
          const aim = { dir: norm(keys(up, [[0, AIM_REST.dir], [1, [-0.45, 0.88, 0.12]]] as [number, V3][])), up: AIM_REST.up };
          const pumpR = armR.pose(keys(up, [[0, armR.chain.end], [1, UP]] as [number, V3][]), keys(up, [[0, armR.rest], [1, tg([-0.7, 0.1, 0.2])]] as [number, V3][]), aim);
          const pumpL = armL.pose(keys(up, [[0, armL.chain.end], [1, armL.m(UP)]] as [number, V3][]), keys(up, [[0, armL.rest], [1, armL.m(tg([-0.7, 0.1, 0.2]))]] as [number, V3][]), aim);
          return {
            ...legs.bones,
            hips: { move: [0, 0.05 * K * air - legs.drop, 0] },
            spine: { rotate: [4 * bend - 4 * air, 0, 0] },
            chest: { rotate: [-3 * air, 0, 0] },
            head: { rotate: [-8 * air, 0, 0] },
            cloak: { rotate: [10 * air, 0, 0] },
            ...pumpR,
            ...pumpL,
          };
        },
      });

      // ------------------------------------------------------------------ cast: draw in, then push forward
      // Both fists come in to the chest (the gather), then thrust forward together at chest height with
      // a lean (the release), hold a beat, and return. A wand or a focus on either hand points ahead.
      const GATHER: V3 = tg([-0.11, 0.31, 0.09]);
      const PUSH: V3 = tg([-0.08, 0.37, 0.155]);
      animation('cast', {
        duration: 0.9,
        loop: false,
        pose: (_t, p) => {
          const wrist = (a: typeof armR) =>
            keys(p, [[0, a.chain.end], [0.3, a.m(GATHER)], [0.42, a.m(GATHER)], [0.52, a.m(PUSH)], [0.74, a.m(PUSH)], [1, a.chain.end]] as [number, V3][], 'spline');
          const pole = (a: typeof armR) => keys(p, [[0, a.rest], [0.3, a.m(tg([-0.6, -0.2, -0.3]))], [0.52, a.m(tg([-0.7, -0.3, 0.1]))], [1, a.rest]] as [number, V3][]);
          const lean = keys(p, [[0, 0], [0.3, -5], [0.42, -6], [0.52, 9], [0.74, 8], [1, 0]] as const);
          // Held items point ahead and a little up through the gather and the push.
          const ahead = keys(p, [[0, 0], [0.3, 1], [0.74, 1], [1, 0]] as const);
          const aim = { dir: norm(keys(ahead, [[0, AIM_REST.dir], [1, [0, 0.12, 1]]] as [number, V3][])), up: AIM_REST.up };
          return {
            spine: { rotate: [lean, 0, 0] },
            chest: { rotate: [lean / 2, 0, 0] },
            head: { rotate: [-0.7 * lean, 0, 0] },
            cloak: { rotate: [-lean, 0, 0] },
            ...armR.pose(wrist(armR), pole(armR), aim),
            ...armL.pose(wrist(armL), pole(armL), aim),
          };
        },
      });
    },
  });
}
