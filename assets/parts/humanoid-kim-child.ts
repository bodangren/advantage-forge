import { motion, profile, sdf } from '../../src/index.js';
import type { AssetContext } from '../../src/index.js';

/**
 * The child base on Teacher Kim's measured ratios. The targets come from the Tom drawing rows of
 * docs/chibi-sprouts/redesign-2026-11-23.md. It imports only src/index.js (spec decision h) and
 * never the adult base module. A child asset calls `buildChild(k)` and adds its own clothes, hair
 * and face layer. All coordinates are rest-pose world meters, +Y up, +Z front, +X left.
 *
 * The derived targets (spec "The child base"): height 1.050, chin 0.687, head height 0.363, head
 * width 0.367, face width 0.238, eye line 0.815, eye width 0.053, eye height 0.051, eye spacing
 * 0.115, shoulder 0.623 at x 0.085, hip 0.351, knee 0.214, wrist 0.368, fingertip 0.292 at x 0.139,
 * ankle 0.035.
 */
export const CHILD = {
  crown: 1.05,
  chin: 0.687,
  eyeY: 0.815,
  eyeX: 0.0575,
  eyeRX: 0.0275,
  eyeRY: 0.026,
  neck0: 0.6,
  neck1: 0.655,
  shoulderY: 0.623,
  hipY: 0.351,
  kneeY: 0.214,
  ankleY: 0.035,
  elbowY: 0.49,
  wristY: 0.368,
  tipY: 0.292,
  shoulderX: 0.085,
  elbowX: 0.105,
  wristX: 0.13,
  hipX: 0.042,
  kneeX: 0.046,
  ankleX: 0.048,
  headRX: 0.1327,
  headRY: 0.1815,
  headRZ: 0.11,
  headY: 0.8685,
  chinRX: 0.085,
  chinRY: 0.04,
  chinRZ: 0.085,
  chinZ: 0.01,
  noseY: 0.755,
  noseZ: 0.082,
  mouthY: 0.766,
  mouthZ: 0.085,
} as const;

/**
 * The rest joints of the child skeleton, in world meters. The seventeen names are the adult bone
 * names of the measured-base contract, so a child and an adult share one rig vocabulary.
 */
const JOINTS: Record<string, readonly [number, number, number]> = {
  hips: [0, CHILD.hipY, 0],
  spine: [0, 0.44, 0],
  chest: [0, 0.53, 0],
  neck: [0, 0.63, 0],
  head: [0, CHILD.chin + 0.09, 0],
  'upperarm.L': [CHILD.shoulderX, CHILD.shoulderY, 0],
  'forearm.L': [CHILD.elbowX, CHILD.elbowY, 0.006],
  'hand.L': [CHILD.wristX, CHILD.wristY, 0.015],
  'upperarm.R': [-CHILD.shoulderX, CHILD.shoulderY, 0],
  'forearm.R': [-CHILD.elbowX, CHILD.elbowY, 0.006],
  'hand.R': [-CHILD.wristX, CHILD.wristY, 0.015],
  'leg.L': [CHILD.hipX, CHILD.hipY, 0],
  'shin.L': [CHILD.kneeX, CHILD.kneeY, 0],
  'foot.L': [CHILD.ankleX, CHILD.ankleY, 0.02],
  'leg.R': [-CHILD.hipX, CHILD.hipY, 0],
  'shin.R': [-CHILD.kneeX, CHILD.kneeY, 0],
  'foot.R': [-CHILD.ankleX, CHILD.ankleY, 0.02],
};

export type ChildHand = {
  readonly palmCentre: readonly [number, number, number];
  readonly thumbTip: readonly [number, number, number];
  readonly fingerTip: readonly [number, number, number];
};

/**
 * Hand landmarks in rest-pose world meters. `palmCentre` sits on the face of the palm that looks
 * toward the leg, `thumbTip` is the front edge of the thumb, and `fingerTip` is the lowest
 * fingertip. The y and z of the palm centre match the hand mesh centroid, so the declared palm
 * normal is -X on the left and +X on the right.
 */
export const CHILD_HANDS: { L: ChildHand; R: ChildHand } = {
  L: {
    palmCentre: [0.132, 0.341429, 0.032526],
    thumbTip: [0.148, 0.352, 0.0705],
    fingerTip: [0.136998, 0.292001, 0.017898],
  },
  R: {
    palmCentre: [-0.132, 0.341691, 0.032795],
    thumbTip: [-0.148, 0.352, 0.0705],
    fingerTip: [-0.136595, 0.292017, 0.017898],
  },
};

/**
 * The measured-base contract of spec decision (d). The three names are the landmarks of the child
 * base, and `BASE_JOINTS` is the rest-pose joint map of the seventeen bones. The child base adds
 * the fourth name; the adult base adds no fourth name.
 */
export const BASE_CROWN_Y = CHILD.crown;
export const BASE_CHIN_Y = CHILD.chin;
export const BASE_HANDS = CHILD_HANDS;
export const BASE_JOINTS: Record<string, readonly [number, number, number]> = { ...JOINTS };

const mirrorX = (s: import('../../src/index.js').sdf.Shape) => s.mirror('x', 0);

/** The rest skeleton: every bone name the measured-base contract lists. */
function childSkeleton(k: AssetContext) {
  const bone = (parent: string | undefined, at: readonly [number, number, number]) =>
    parent ? { parent, at } : { at };
  k.skeleton({
    hips: bone(undefined, JOINTS.hips!),
    spine: bone('hips', JOINTS.spine!),
    chest: bone('spine', JOINTS.chest!),
    neck: bone('chest', JOINTS.neck!),
    head: bone('neck', JOINTS.head!),
    'upperarm.L': bone('chest', JOINTS['upperarm.L']!),
    'forearm.L': bone('upperarm.L', JOINTS['forearm.L']!),
    'hand.L': bone('forearm.L', JOINTS['hand.L']!),
    'upperarm.R': bone('chest', JOINTS['upperarm.R']!),
    'forearm.R': bone('upperarm.R', JOINTS['forearm.R']!),
    'hand.R': bone('forearm.R', JOINTS['hand.R']!),
    'leg.L': bone('hips', JOINTS['leg.L']!),
    'shin.L': bone('leg.L', JOINTS['shin.L']!),
    'foot.L': bone('shin.L', JOINTS['foot.L']!),
    'leg.R': bone('hips', JOINTS['leg.R']!),
    'shin.R': bone('leg.R', JOINTS['shin.R']!),
    'foot.R': bone('shin.R', JOINTS['foot.R']!),
  });
}

/**
 * The head, the face paint, and the neck. The cranium is wide and the jaw is narrow, so the
 * measured head width and the measured face width differ as the drawing shows. The paint makes two
 * dark eye components in the flat front view.
 */
function childHead(k: AssetContext) {
  const skull = sdf.ellipsoid([CHILD.headRX, CHILD.headRY, CHILD.headRZ]).at(0, CHILD.headY, 0);
  const chin = sdf
    .ellipsoid([CHILD.chinRX, CHILD.chinRY, CHILD.chinRZ])
    .at(0, CHILD.chin + CHILD.chinRY, CHILD.chinZ);
  const jaw = sdf.smoothUnion(0.02, skull, chin);
  const nose = sdf.ellipsoid([0.009, 0.012, 0.017]).at(0, CHILD.noseY, CHILD.noseZ);
  const face = jaw.smoothUnion(0.009, nose).bone('head');
  const neck = sdf
    .capsule([0, CHILD.neck0 - 0.01, -0.006], [0, CHILD.neck1 + 0.045, -0.006], 0.055)
    .bone('neck');

  // The eye pair: a white, an iris, a pupil, and a glint. The iris holds the measured
  // 0.053 x 0.051 m opening, and the two irises stay apart in the flat front view.
  const eyeWhite = (sx: number) => sdf.ellipsoid([0.042, 0.034, 0.09]).at(sx * CHILD.eyeX, CHILD.eyeY, 0.1);
  const iris = (sx: number) =>
    sdf.ellipsoid([CHILD.eyeRX, CHILD.eyeRY, 0.09]).at(sx * CHILD.eyeX, CHILD.eyeY, 0.102);
  const pupil = (sx: number) => sdf.ellipsoid([0.011, 0.011, 0.09]).at(sx * CHILD.eyeX, CHILD.eyeY, 0.106);
  const glint = (sx: number) => sdf.sphere(0.005).at(sx * (CHILD.eyeX + 0.009), CHILD.eyeY + 0.008, 0.092);
  const brow = (sx: number) =>
    sdf
      .box([0.04, 0.009, 0.1], 0.003)
      .rotate(0, 0, sx * 6)
      .at(sx * CHILD.eyeX, CHILD.eyeY + 0.05, 0.095);
  // The open smile of the child base: a dark crescent with a band of teeth under the upper lip.
  const smile = sdf.extrude(profile.arc(0.06, 0.016, 228, 312), 0.3).at(0, CHILD.mouthY, CHILD.mouthZ);
  const teeth = sdf.extrude(profile.arc(0.052, 0.005, 240, 300), 0.3).at(0, CHILD.mouthY, CHILD.mouthZ);

  const painted = face
    .paintWhere(sdf.union(eyeWhite(-1), eyeWhite(1)), '#f8f2e9')
    .paintWhere(sdf.union(iris(-1), iris(1)), '#4a2e18')
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#14100e')
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff')
    .paintWhere(sdf.union(brow(-1), brow(1)), '#5a3623')
    .paintWhere(smile, '#6d2622')
    .paintWhere(teeth, '#f7f1e6');

  k.body('head-skin', sdf.smoothUnion(0.012, painted, neck), {
    color: '#f2c7a4',
    detail: 0.0022,
    paintWeight: 2,
    textureDensity: 2,
  });
}

/** Torso, arms, legs and feet. The skin is mostly covered by the child's clothes. */
function childLimbs(k: AssetContext) {
  const torsoProfile = [
    [0, 0.648],
    [0.04, 0.642],
    [0.062, 0.63],
    [0.075, 0.612],
    [0.083, 0.585],
    [0.086, 0.55],
    [0.084, 0.51],
    [0.081, 0.47],
    [0.082, 0.43],
    [0.085, 0.39],
    [0.078, 0.365],
    [0.055, 0.353],
    [0, 0.351],
  ] as [number, number][];
  const torso = sdf
    .revolve(profile.polygon(torsoProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  k.body('torso-skin', torso, { color: '#f2c7a4', detail: 0.005 });

  const upper = (sx: number) =>
    sdf
      .cone([sx * CHILD.shoulderX, 0.6, 0], [sx * CHILD.elbowX, CHILD.elbowY, 0.006], 0.034, 0.027)
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  const fore = (sx: number) =>
    sdf
      .cone(
        [sx * CHILD.elbowX, CHILD.elbowY, 0.006],
        [sx * CHILD.wristX, CHILD.wristY - 0.004, 0.015],
        0.027,
        0.021,
      )
      .bone(sx > 0 ? 'forearm.L' : 'forearm.R');
  const arms = sdf.union(upper(-1), upper(1), fore(-1), fore(1));
  k.body('arms-skin', arms, { color: '#f2c7a4', detail: 0.004 });

  const thigh = (sx: number) =>
    sdf
      .cone([sx * CHILD.hipX, CHILD.hipY + 0.02, 0], [sx * CHILD.kneeX, CHILD.kneeY, 0], 0.042, 0.033)
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  const shin = (sx: number) =>
    sdf
      .cone([sx * CHILD.kneeX, CHILD.kneeY, 0], [sx * CHILD.ankleX, CHILD.ankleY + 0.01, 0.008], 0.033, 0.024)
      .bone(sx > 0 ? 'shin.L' : 'shin.R');
  k.body('legs-skin', sdf.union(thigh(-1), thigh(1), shin(-1), shin(1)), {
    color: '#f2c7a4',
    detail: 0.005,
  });

  const shoe = (sx: number) =>
    sdf
      .ellipsoid([0.036, 0.03, 0.062])
      .at(sx * CHILD.ankleX, 0.03, 0.03)
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('feet-skin', sdf.union(shoe(-1), shoe(1)), { color: '#7a4a2c', detail: 0.004 });
}

/**
 * One body named `hands`, both sides. A hanging hand is a thin slab: the broad face looks toward
 * the leg, the thumb points forward, and the fingers reach the derived fingertip height 0.292 m.
 */
function childHands(k: AssetContext) {
  const left = () => {
    const palm = sdf
      .box([0.014, 0.065, 0.046], 0.005)
      .displace(0.0005, (x, y, z) => Math.sin(x * 900 + y * 700 + z * 800))
      .at(0.139, 0.3425, 0.032)
      .bone('hand.L');
    const fingers = sdf.box([0.014, 0.018, 0.038], 0.005).at(0.139, 0.301, 0.032).bone('hand.L');
    const thumb = sdf.cone([0.144, 0.352, 0.048], [0.148, 0.352, 0.066], 0.008, 0.005).bone('hand.L');
    return sdf.smoothUnion(0.004, palm, fingers, thumb);
  };
  k.body('hands', left().mirror('x', 0), {
    color: '#f2c7a4',
    detail: 0.0012,
    maxError: 0.0001,
    maxTriangles: 20000,
    paintWeight: 2,
  });
}

/** Build the whole base. Add the child's identity bodies after this call. */
export function buildChild(k: AssetContext) {
  childSkeleton(k);
  childHead(k);
  childLimbs(k);
  childHands(k);
  k.animation('idle', {
    duration: 2.4,
    loop: true,
    pose: (t, phase) => {
      const sway = motion.wave(t + phase, 1, 0) * 1.4;
      return { chest: { rotate: [0, 0, sway] }, head: { rotate: [sway * 0.4, -sway * 0.3, 0] } };
    },
  });
}
