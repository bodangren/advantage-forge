import { motion, profile, sdf } from '../../src/index.js';
import type { AssetContext } from '../../src/index.js';

/**
 * The new adult base on Teacher Kim's measured ratios (docs/chibi-sprouts/redesign-2026-11-23.md).
 * It imports only src/index.js (spec decision h). A character asset calls `buildKim(k)` and adds its
 * own identity bodies. All coordinates are rest-pose world meters, +Y up, +Z front, +X left.
 *
 * The eleven measured rows come from derived targets: height 1.500, chin 1.088, hip 0.585,
 * knee 0.324, shoulder 0.9937 at x 0.143, fingertip 0.452 at x 0.188, head width 0.341,
 * face width 0.278, eye line 1.245, eye width 0.064, eye height 0.045, eye spacing 0.130.
 */
export const KIM = {
  crown: 1.5,
  chin: 1.088,
  eyeY: 1.245,
  neck0: 1.0,
  neck1: 1.075,
  shoulderY: 0.9937,
  hipY: 0.585,
  kneeY: 0.324,
  ankleY: 0.045,
  elbowY: 0.803,
  wristY: 0.601,
  tipY: 0.452,
  shoulderX: 0.143,
  elbowX: 0.156,
  wristX: 0.176,
  hipX: 0.075,
  kneeX: 0.082,
  ankleX: 0.085,
  headRX: 0.158,
  headRY: 0.206,
  headRZ: 0.135,
  headY: 1.294,
  eyeX: 0.065,
} as const;

/** The chin bottom on the centre plane, above the hip (spec measurement inputs). */
export const KIM_CHIN_Y = KIM.chin;

export type KimHand = {
  readonly palmCentre: readonly [number, number, number];
  readonly thumbTip: readonly [number, number, number];
  readonly fingerTip: readonly [number, number, number];
};

/**
 * Hand landmarks in rest-pose world meters. `palmCentre` sits on the face of the palm that looks
 * toward the leg; `thumbTip` is the front edge of the thumb; `fingerTip` is the lowest fingertip.
 * The y and z of the palm centre match the hand mesh centroid, so the declared palm normal is −X
 * on the left and +X on the right (spec "The palm check API").
 */
export const KIM_HANDS: { L: KimHand; R: KimHand } = {
  L: {
    palmCentre: [0.17, 0.53876, 0.04018],
    thumbTip: [0.18923, 0.54475, 0.08693],
    fingerTip: [0.178, 0.452, 0.04],
  },
  R: {
    palmCentre: [-0.17, 0.53877, 0.0391],
    thumbTip: [-0.19026, 0.54474, 0.08699],
    fingerTip: [-0.178, 0.452, 0.04],
  },
};

const mirrorX = (s: import('../../src/index.js').sdf.Shape) => s.mirror('x', 0);

/** The rest skeleton: every bone name the plan lists, with joints on the derived targets. */
function kimSkeleton(k: AssetContext) {
  const bone = (parent: string | undefined, at: readonly [number, number, number]) =>
    parent ? { parent, at } : { at };
  k.skeleton({
    hips: bone(undefined, [0, KIM.hipY, 0]),
    spine: bone('hips', [0, 0.75, 0]),
    chest: bone('spine', [0, 0.9, 0]),
    neck: bone('chest', [0, KIM.neck1, 0]),
    head: bone('neck', [0, KIM.chin + 0.09, 0]),
    'upperarm.L': bone('chest', [KIM.shoulderX, KIM.shoulderY, 0]),
    'forearm.L': bone('upperarm.L', [KIM.elbowX, KIM.elbowY, 0.006]),
    'hand.L': bone('forearm.L', [KIM.wristX, KIM.wristY, 0.015]),
    'upperarm.R': bone('chest', [-KIM.shoulderX, KIM.shoulderY, 0]),
    'forearm.R': bone('upperarm.R', [-KIM.elbowX, KIM.elbowY, 0.006]),
    'hand.R': bone('forearm.R', [-KIM.wristX, KIM.wristY, 0.015]),
    'leg.L': bone('hips', [KIM.hipX, KIM.hipY, 0]),
    'shin.L': bone('leg.L', [KIM.kneeX, KIM.kneeY, 0]),
    'foot.L': bone('shin.L', [KIM.ankleX, KIM.ankleY, 0.02]),
    'leg.R': bone('hips', [-KIM.hipX, KIM.hipY, 0]),
    'shin.R': bone('leg.R', [-KIM.kneeX, KIM.kneeY, 0]),
    'foot.R': bone('shin.R', [-KIM.ankleX, KIM.ankleY, 0.02]),
  });
}

/** Head, face paint, and neck. The paint makes two dark eye components in the flat front view. */
function kimHead(k: AssetContext) {
  const skull = sdf.ellipsoid([KIM.headRX, KIM.headRY, KIM.headRZ]).at(0, KIM.headY, 0);
  const chin = sdf.ellipsoid([0.062, 0.04, 0.07]).at(0, KIM.chin + 0.038, 0.05);
  const jaw = sdf.smoothUnion(0.03, skull, chin);
  const nose = sdf.ellipsoid([0.014, 0.018, 0.03]).at(0, 1.16, 0.135);
  const face = jaw.smoothUnion(0.015, nose).bone('head');
  const neck = sdf.capsule([0, KIM.neck0 - 0.02, -0.008], [0, KIM.neck1 + 0.04, -0.008], 0.052).bone('neck');

  const eye = (sx: number) => sdf.ellipsoid([0.044, 0.028, 0.09]).at(sx * KIM.eyeX, KIM.eyeY, 0.128);
  const irisDark = (sx: number) =>
    sdf.ellipsoid([0.033, 0.022, 0.09]).at(sx * KIM.eyeX, KIM.eyeY - 0.002, 0.13);
  const pupil = (sx: number) => sdf.ellipsoid([0.014, 0.014, 0.09]).at(sx * KIM.eyeX, KIM.eyeY, 0.132);
  const glint = (sx: number) => sdf.sphere(0.006).at(sx * KIM.eyeX + 0.011, KIM.eyeY + 0.007, 0.15);
  const brow = (sx: number) =>
    sdf
      .box([0.052, 0.009, 0.12], 0.004)
      .rotate(0, 0, sx * 9)
      .at(sx * KIM.eyeX, KIM.eyeY + 0.055, 0.12);
  const mouth = sdf.ellipsoid([0.036, 0.009, 0.09]).at(0, KIM.chin + 0.055, 0.13);
  const blush = (sx: number) => sdf.ellipsoid([0.024, 0.014, 0.06]).at(sx * 0.09, 1.16, 0.112);

  let painted = face
    .paintWhere(sdf.union(eye(-1), eye(1)), '#f7f1e8', 0.002)
    .paintWhere(sdf.union(irisDark(-1), irisDark(1)), '#3a2412', 0.001)
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#15100e', 0.001)
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff', 0.001)
    .paintWhere(sdf.union(brow(-1), brow(1)), '#4a2b1c', 0.002)
    .paintWhere(mouth, '#a4503f', 0.002)
    .paintWhere(sdf.union(blush(-1), blush(1)), '#e29580', 0.004);

  k.body('head-skin', sdf.smoothUnion(0.02, painted, neck), {
    color: '#f2c7a4',
    detail: 0.0035,
    textureDensity: 2,
  });
}

/** Torso, arms, legs and feet. The skin is mostly covered by the character's clothes. */
function kimLimbs(k: AssetContext) {
  const torsoProfile = [
    [0, 1.0],
    [0.07, 0.995],
    [0.11, 0.975],
    [0.13, 0.94],
    [0.14, 0.88],
    [0.136, 0.79],
    [0.13, 0.71],
    [0.138, 0.63],
    [0.132, 0.585],
    [0, 0.585],
  ] as [number, number][];
  const torso = sdf.revolve(profile.polygon(torsoProfile, { smooth: true })).bone('chest');
  k.body('torso-skin', torso, { color: '#f2c7a4', detail: 0.006 });

  const upper = (sx: number) =>
    sdf
      .cone([sx * KIM.shoulderX, KIM.shoulderY + 0.01, 0], [sx * KIM.elbowX, KIM.elbowY, 0.006], 0.048, 0.038)
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  const fore = (sx: number) =>
    sdf
      .cone([sx * KIM.elbowX, KIM.elbowY, 0.006], [sx * KIM.wristX, KIM.wristY - 0.004, 0.015], 0.038, 0.03)
      .bone(sx > 0 ? 'forearm.L' : 'forearm.R');
  const arms = sdf.union(upper(-1), upper(1), fore(-1), fore(1));
  k.body('arms-skin', arms, { color: '#f2c7a4', detail: 0.005 });

  const thigh = (sx: number) =>
    sdf
      .cone([sx * KIM.hipX, KIM.hipY + 0.02, 0], [sx * KIM.kneeX, KIM.kneeY, 0], 0.056, 0.044)
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  const shin = (sx: number) =>
    sdf
      .cone([sx * KIM.kneeX, KIM.kneeY, 0], [sx * KIM.ankleX, KIM.ankleY, 0.01], 0.044, 0.032)
      .bone(sx > 0 ? 'shin.L' : 'shin.R');
  k.body('legs-skin', sdf.union(thigh(-1), thigh(1), shin(-1), shin(1)), { color: '#f2c7a4', detail: 0.006 });

  const shoe = (sx: number) =>
    sdf
      .ellipsoid([0.045, 0.038, 0.08])
      .at(sx * KIM.ankleX, 0.035, 0.038)
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('feet-skin', sdf.union(shoe(-1), shoe(1)), { color: '#7a4a2c', detail: 0.005 });
}

/**
 * One body named `hands`, both sides. A hanging hand is a thin slab: the broad face looks toward
 * the leg (palmCentre on the inner face, normal −X on the left), the thumb points forward (+Z), and
 * the fingers reach the derived fingertip height 0.452 m. This is the correct rest pose for every
 * humanoid in the new base.
 */
function kimHands(k: AssetContext) {
  const left = () => {
    const palm = sdf
      .box([0.016, 0.135, 0.06], 0.006)
      .displace(0.0007, (x, y, z) => Math.sin(x * 900 + y * 700 + z * 800))
      .at(0.178, 0.5375, 0.04)
      .bone('hand.L');
    const fingers = sdf.box([0.012, 0.03, 0.05], 0.005).at(0.178, 0.467, 0.04).bone('hand.L');
    const thumb = sdf.cone([0.179, 0.545, 0.062], [0.19, 0.545, 0.082], 0.009, 0.005).bone('hand.L');
    return sdf.smoothUnion(0.008, palm, fingers, thumb);
  };
  k.body('hands', left().mirror('x', 0), {
    color: '#f2c7a4',
    detail: 0.0015,
    maxError: 0.0001,
    maxTriangles: 20000,
    paintWeight: 2,
  });
}

/** Build the whole base. Add the character's identity bodies after this call. */
export function buildKim(k: AssetContext) {
  kimSkeleton(k);
  kimHead(k);
  kimLimbs(k);
  kimHands(k);
  k.animation('idle', {
    duration: 2.4,
    loop: true,
    pose: (t, phase) => {
      const sway = motion.wave(t + phase, 1, 0) * 1.4;
      return { chest: { rotate: [0, 0, sway] }, head: { rotate: [sway * 0.4, -sway * 0.3, 0] } };
    },
  });
}
