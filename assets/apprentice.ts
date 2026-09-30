import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Apprentice — Chibi Quest support hero (catalog `heroes/support/apprentice`), about 0.98 m to
 * the top of the hair, faces +Z. Target: docs/hero-mockups/apprentice_001.jpg (one 3/4 view).
 * The mockup shows a bearded man; this apprentice is young and beardless (the round hero face).
 * Built on the mage's body, skeleton, glasses, and clip set (no hat, no book, no cape).
 *
 * One idea: an eager kid in an oversized pale blue robe with a big folded collar, messy brown
 *   hair in thick swept locks, and round glasses; his big eyes look up at the small spark on
 *   the training wand he holds up beside his head.
 * Proportions: hair top 0.98, eyes 0.63, chin 0.48, shoulders 0.385, belt 0.255, robe hem 0.09.
 * Palette (60/30/10): pale blue cloth #8ab8c8 (robe, sleeves, folds #6a98a8, collar #a0c8d8);
 *   brown leather and hair (#6b4226, #4a2e1c); gold buckle and the yellow spark are the accents.
 * Value plan: dark glasses and hair frame the light face; the spark is the brightest point;
 *   the dark belt and gold buckle break up the light robe.
 * Rig: the mage's skeleton (`skirt` for the robe below the belt, knee `shin` bones, `orb` at the
 *   wand tip); `hatroot`, `hattip`, and `cloak` stay in the rig but carry no geometry.
 *   The wand is rigid on the right hand; the left hand is a loose fist.
 *   Clips: idle, walk, run, attack (a wand flick), attack2 (a two-hand cast that fizzles),
 *   hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2a1810',
  iris: '#6a3c1e',
  irisLow: '#a8683a',
  pupil: '#141a18',
  lid: '#2a1810',
  mouth: '#8a3a32',
  tongue: '#d06a66',
  hair: '#4a2e1c',
  hairDark: '#2e1c10',
  cloth: '#7fb0c0',
  folds: '#5f90a2',
  collar: '#a0c8d8',
  leather: '#6b4226',
  leatherDark: '#4a2c18',
  flap: '#8a5a35',
  gold: '#e0b040',
  boot: '#5a3a24',
  sole: '#3a2418',
  pants: '#6a4a32',
  wood: '#3a2316',
  woodDark: '#241409',
  mantle: '#6b4226',
  toe: '#8a6040',
  scuff: '#a78058',
  glass: '#1a1a1a',
  scroll: '#ece0c4',
  sparkBase: '#5a4a10',
  sparkCore: '#f0e060',
  sparkOuter: '#f0a030',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the mage's rig). The right arm is raised: the fist holds the wand up beside the
// head; the left arm hangs loose with a fist.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.225, 0.42, 0.0];
const WRIST_R: V3 = [-0.26, 0.49, 0.06];
const ELBOW_L: V3 = [0.185, 0.325, 0.01];
const WRIST_L: V3 = [0.22, 0.27, 0.05];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A torus ring of radius R and tube r, centered at `c`, with its hole along `axis`. */
const ring = (c: V3, axis: V3, R: number, r: number) => {
  const a = norm(axis);
  const tilt = Math.acos(a[1]) / rad;
  const psi = Math.atan2(a[2], -a[0]) / rad;
  return sdf.torus(R, r).rotateZ(tilt).rotateY(psi).at(...c);
};

/** A fist hanging from the wrist at the origin; its grip hole runs along Z. */
const fistLocal = (s: 1 | -1) =>
  sdf
    .smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.007 * s, -0.038, 0.004),
    sdf.capsule([-0.009 * s, -0.058, 0.03], [-0.005 * s, -0.038, 0.042], 0.017),
    sdf.cone([0.02 * s, -0.023, 0.025], [0.001 * s, -0.033, 0.048], 0.016, 0.013),
    )
    .scale(1.12);
// The wand hand swings forward and tips out, so the wand leans outward, away from the head.
const HAND_R = { pitch: -78, roll: 17 };
const handR = (s: sdf.Shape) => s.rotateX(HAND_R.pitch).rotateZ(HAND_R.roll).at(...WRIST_R);
const handRPoint = (p: V3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const WAND_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.008, -0.043, 0.004]);
const along = (t: number): V3 => add(GRIP, scale(WAND_AXIS, t));
const WAND_TIP = along(0.2);
/** The spark at the wand tip (and the `orb` bone that flares it): its height and base center. */
const FLAME_H = 0.085;
const ORB: V3 = add(WAND_TIP, [0, 0.02, 0]);

/** The left fist hangs loose from the wrist, angled forward. */
const HAND_L_PITCH = -25;
const handL = (s: sdf.Shape) => s.rotateX(HAND_L_PITCH).at(...WRIST_L);

/** A teardrop flame: a round base (0.03 m wide) drawn up to a point. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(h * 0.12, sdf.sphere(h * 0.27).at(0, h * 0.27, 0), sdf.cone([0, h * 0.25, 0], [h * 0.05, h, 0], h * 0.24, h * 0.02));
/** Spark color: yellow at the base, orange toward the tip. */
const glowPaint = (base: V3, h: number) => {
  const core = rgb(C.sparkCore);
  const outer = rgb(C.sparkOuter);
  return (_x: number, y: number, _z: number) => {
    const t = Math.min(1, Math.max(0, ((y - base[1]) / h - 0.3) / 0.7));
    return [core[0] + (outer[0] - core[0]) * t, core[1] + (outer[1] - core[1]) * t, core[2] + (outer[2] - core[2]) * t] as const;
  };
};

export default defineAsset({
  name: 'apprentice',
  description: 'Chibi young apprentice hero with messy brown hair, round glasses, a pale blue robe with a big collar, a satchel of scrolls, and a sparking training wand.',
  detail: 0.005,
  reference: 'docs/hero-mockups/apprentice_001.jpg',
  // Color slots for individual apprentices (the first option is the default look). The leather,
  // the gold, the scrolls, and the wand spark are not in a slot.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { sky: C.cloth, sage: '#8ab890', lilac: '#a898c8' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'sky' },
    sage: { eyes: 'green', hair: 'black', skin: 'tan', clothing: 'sage' },
    lilac: { eyes: 'blue', hair: 'blond', skin: 'fair', clothing: 'lilac' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      skin: k.tint('skin'),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      folds: k.tint('clothing', { color: C.folds, follow: 1 }),
      collar: k.tint('clothing', { color: C.collar, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.25, 0], tail: [0, 0.1, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hatroot: { parent: 'head', at: [0, 0.86, -0.01] },
      hattip: { parent: 'hatroot', at: [0, 0.9, 0], tail: [-0.04, 0.97, 0] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      orb: { parent: 'hand.R', at: ORB },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.022, 0.018, 0.018]).at(0, 0.566, faceZ(0, 0.566) - 0.005).bone('head');
    // Small round human ears: a soft disc with a shallow bowl.
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.04, 0.034])
        .subtract(sdf.sphere(0.016).at(0.015, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      handR(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      handL(fistLocal(1)).bone('hand.L'),
    );

    // The young round face: big eyes that look up and to his right (at the wand), raised brows,
    // a small open mouth.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const LOOK = [-0.013, 0.012] as const;
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const both = (s: sdf.Shape, dy: number) =>
      sdf.union(at(s, EYE[0] + LOOK[0], EYE[1] + dy + LOOK[1]), at(s, -EYE[0] + LOOK[0], EYE[1] + dy + LOOK[1]));
    const irisRim = both(sdf.ellipsoid([0.042, 0.049, 0.07]), -0.004);
    const iris = both(sdf.ellipsoid([0.036, 0.043, 0.07]), -0.006);
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] + LOOK[1] - 0.02));
    const pupil = both(sdf.ellipsoid([0.026, 0.029, 0.07]), 0.002);
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + LOOK[0] + 0.016, EYE[1] + LOOK[1] + 0.019),
        at(sdf.sphere(0.006), x + LOOK[0] - 0.014, EYE[1] + LOOK[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 58, 122), 0.3).at(0.1, 0.735 - 0.1, 0.1));
    const MOUTH_Y = 0.533;
    const mouthZ = faceZ(0, MOUTH_Y);
    const mouth = sdf.ellipsoid([0.021, 0.015, 0.06]).at(0, MOUTH_Y, mouthZ);
    const tongue = sdf.ellipsoid([0.013, 0.007, 0.06]).at(0, MOUTH_Y - 0.008, mouthZ);
    const blush = pair(at(sdf.sphere(0.034), 0.138, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.hairDark)
      .paintWhere(mouth, T.mouth)
      .paintWhere(tongue, C.tongue);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ round glasses
    const GLASS_Y = EYE[1] + 0.004;
    const LENS_R = 0.064;
    const lensC: V3 = [EYE[0], GLASS_Y, faceZ(EYE[0], GLASS_Y) + 0.016];
    const onLens = (p: V3) => add(rotY(p, 20), lensC);
    const rim = sdf.torus(LENS_R, 0.0088).rotateX(90).rotateY(20).at(...lensC);
    const lensIn = onLens([-LENS_R, 0.004, 0]);
    const lensOut = onLens([LENS_R, 0.004, 0]);
    const bridgeZ = Math.max(lensIn[2], faceZ(0, GLASS_Y + 0.012) + 0.012);
    const bridge = sdf.chain(
      [
        [lensIn[0], lensIn[1], lensIn[2], 0.0062],
        [0, GLASS_Y + 0.014, bridgeZ, 0.0058],
        [-lensIn[0], lensIn[1], lensIn[2], 0.0062],
      ],
      0.004,
    );
    const temple = sdf.chain(
      [
        [lensOut[0], lensOut[1], lensOut[2], 0.006],
        [0.2, GLASS_Y + 0.01, 0.07, 0.0055],
        [0.216, GLASS_Y + 0.012, -0.01, 0.005],
      ],
      0.004,
    );
    k.body('glasses', sdf.union(hard(sdf.union(rim, temple)), bridge), {
      color: C.glass,
      roughness: 0.3,
      metalness: 0.4,
      detail: 0.003,
      bone: 'head',
    });

    // ------------------------------------------------------------------ hair
    // Messy brown hair as thick swept locks over a close cap. The cap is cut away at the face;
    // the locks fall as a fringe over the glasses on his right, and flick out at the sides.
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.006, HEAD[1] + 0.006, HEAD[2] + 0.008])
      .at(0, HEAD_Y + 0.002, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.15, 0.22]).rotateZ(-8).at(-0.015, 0.625, 0.15));
    type P4 = [number, number, number, number];
    const lock = (pts: P4[]) => sdf.chain(pts, 0.02);
    const LOCKS: P4[][] = [
      // two locks fall from the part above his left brow as a fringe over the right lens
      [[0.07, 0.835, 0.145, 0.03], [0.0, 0.845, 0.175, 0.03], [-0.07, 0.8, 0.188, 0.027], [-0.105, 0.725, 0.192, 0.02], [-0.118, 0.665, 0.185, 0.011]],
      [[0.08, 0.84, 0.13, 0.03], [0.02, 0.855, 0.17, 0.029], [-0.05, 0.825, 0.192, 0.025], [-0.095, 0.77, 0.2, 0.018], [-0.14, 0.7, 0.19, 0.01]],
      // left side: sweeps back and down, the tip flicks out above the ear
      [[0.09, 0.84, 0.12, 0.03], [0.17, 0.8, 0.08, 0.03], [0.212, 0.735, 0.03, 0.028], [0.225, 0.675, -0.03, 0.02], [0.25, 0.648, -0.085, 0.01]],
      // top: from the part, back over the crown, curling down the back of the skull
      [[0.08, 0.86, 0.08, 0.03], [0.06, 0.905, 0.0, 0.03], [0.04, 0.915, -0.1, 0.028], [0.05, 0.88, -0.17, 0.02], [0.07, 0.83, -0.21, 0.01]],
      [[0.06, 0.865, 0.06, 0.03], [-0.01, 0.9, 0.0, 0.03], [-0.06, 0.905, -0.09, 0.028], [-0.08, 0.875, -0.16, 0.02], [-0.1, 0.825, -0.2, 0.01]],
      [[0.04, 0.855, 0.08, 0.03], [-0.06, 0.88, 0.05, 0.03], [-0.14, 0.875, -0.03, 0.027], [-0.19, 0.83, -0.08, 0.02], [-0.215, 0.765, -0.1, 0.011]],
      // crown tuft and a left tuft that flick up
      [[0.0, 0.87, 0.0, 0.03], [0.0, 0.92, -0.03, 0.03], [-0.05, 0.94, -0.07, 0.022], [-0.1, 0.93, -0.12, 0.01]],
      [[0.12, 0.85, 0.0, 0.03], [0.16, 0.875, -0.06, 0.03], [0.175, 0.855, -0.13, 0.022], [0.195, 0.81, -0.165, 0.01]],
      // right side: the tip flicks out above the ear
      [[-0.12, 0.84, 0.03, 0.03], [-0.18, 0.79, 0.0, 0.03], [-0.208, 0.72, -0.04, 0.027], [-0.212, 0.675, -0.08, 0.019], [-0.222, 0.645, -0.11, 0.01]],
      // back: long locks over the nape that flick out at the tips
      [[0.09, 0.82, -0.1, 0.03], [0.13, 0.72, -0.16, 0.03], [0.12, 0.62, -0.19, 0.028], [0.11, 0.54, -0.18, 0.02], [0.14, 0.49, -0.16, 0.01]],
      [[-0.09, 0.82, -0.1, 0.03], [-0.13, 0.72, -0.16, 0.03], [-0.13, 0.62, -0.19, 0.028], [-0.14, 0.54, -0.18, 0.02], [-0.17, 0.49, -0.16, 0.01]],
      [[0.0, 0.84, -0.12, 0.03], [0.0, 0.72, -0.19, 0.03], [0.0, 0.6, -0.21, 0.028], [0.0, 0.52, -0.19, 0.018], [-0.02, 0.47, -0.16, 0.008]],
    ];
    // One smooth groove pattern runs along the locks (down the skull), mixed to the dark hair.
    const hairDark = rgb(T.hairDark);
    const groove = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 16 + y * 4);
    const hair = sdf
      .smoothUnion(0.015, cap, ...LOCKS.map(lock))
      .paintFn((x, y, z, base) => mixRgb(base, hairDark, 0.6 * Math.min(1, Math.max(0, (groove(x, y, z) - 0.3) / 0.7))));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head', bump: (x, y, z) => 0.0025 * groove(x, y, z) });

    // ------------------------------------------------------------------ robe (oversized), trousers
    const robeBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.126, 0.29],
            [0.134, 0.25],
            [0.158, 0.2],
            [0.186, 0.15],
            [0.205, 0.13],
            [0.2, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const robeShape = robeBase.round(0.015);
    // Four soft vertical wrinkles in the skirt, in paint and in the normal map.
    const foldColor = rgb(T.folds);
    const WRINKLES = [1.0, 1.42, 1.85, 2.3];
    const wrinkle = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x) + 0.05 * Math.sin(y * 14);
      const fade = Math.min(1, Math.max(0, (0.3 - y) / 0.08));
      return fade * Math.max(...WRINKLES.map((w) => Math.exp(-(((a - w) / 0.07) ** 2))));
    };
    const robe = robeShape.paintFn((x, y, z, base) => mixRgb(base, foldColor, 0.9 * Math.min(1, Math.max(0, (wrinkle(x, y, z) - 0.35) / 0.4))));
    // Below the belt the robe skirt hangs from its own bone, so the hem can swing in a walk.
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    k.body('robe', sdf.union(above(robe, 0.25).bone('spine'), below(robe, 0.25).bone('skirt')), { color: T.cloth, roughness: 0.85, bump: (x, y, z) => -0.004 * wrinkle(x, y, z) });
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('tunic', legs, { color: C.pants, roughness: 0.85 });

    // The open draped hood collar: a folded flap 0.03 m thick on the shoulders and upper chest,
    // opened in a V at the front, with a rolled lip and a darker fold in the crease.
    const vCut = (w: number, top: number, bot: number, wb: number) =>
      sdf.extrude(profile.polygon([[-w, top], [w, top], [wb, bot], [-wb, bot]]), 0.3).at(0, 0, 0.15);
    const collarOuter = sdf.ellipsoid([0.17, 0.09, 0.135]).at(0, 0.425, -0.008);
    const collarShell = collarOuter.subtract(collarOuter.round(-0.03)).intersect(sdf.halfSpace([0, -1, 0], -0.37));
    const lip = sdf.torus(0.076, 0.02).at(0, 0.5, -0.01);
    const collar = sdf
      .smoothUnion(0.012, collarShell, lip)
      .subtract(sdf.cylinder(0.062, 0.3).at(0, 0.45, -0.01))
      .subtract(vCut(0.08, 0.55, 0.37, 0.012))
      .paintWhere(sdf.torus(0.105, 0.014).at(0, 0.485, -0.01), T.folds, 0.008);
    k.body('collar', collar.bone('chest'), { color: T.collar, roughness: 0.85, detail: 0.005 });

    // The brown mantle: a short leather cape 0.02 m thick over the shoulders, down to the elbow
    // line, open at the front.
    // It hangs behind the shoulders (a back cape) and stops at the sides of the chest: the front
    // is cut away so it never reads as a band around the arms.
    const mOuter = sdf.ellipsoid([0.205, 0.15, 0.165]).at(0, 0.33, -0.03);
    const mantle = mOuter
      .subtract(mOuter.round(-0.02))
      .intersect(sdf.halfSpace([0, -1, 0], -0.22))
      .intersect(sdf.halfSpace([0, 0, 1], 0.015))
      .subtract(sdf.cylinder(0.11, 0.3).at(0, 0.45, -0.01))
      .subtract(sdf.box([0.5, 0.06, 0.5]).at(0, 0.485, 0)); // clear of the collar
    k.body('mantle', mantle.bone('chest'), { color: C.mantle, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ sleeves with rolled cuffs
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.054, 0.052).bone(tagU),
        sdf.cone(e, lerp(e, w, 0.8), 0.052, 0.056).bone(tagF),
      );
    const cuff = (e: V3, w: V3, tag: string) =>
      ring(lerp(e, w, 0.76), [w[0] - e[0], w[1] - e[1], w[2] - e[2]], 0.052, 0.017).paint(T.collar).bone(tag);
    // One body, so the rolled cuffs are cloth, not held items.
    k.body(
      'sleeves',
      sdf.union(
        sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'),
        cuff(ELBOW_L, WRIST_L, 'forearm.L'),
        cuff(ELBOW_R, WRIST_R, 'forearm.R'),
      ),
      { color: T.cloth, roughness: 0.85 },
    );

    // ------------------------------------------------------------------ belt, buckle, satchel
    const beltY = 0.255;
    const belt = robeShape.round(0.008).smoothIntersect(0.006, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];

    // The satchel hangs at his right hip; a strap crosses the chest from his left shoulder.
    const satP = sdf.surfacePoint(robeShape, [-0.3, 0.2, 0.2], 0);
    const satYaw = (Math.atan2(satP[0], satP[2]) * 180) / Math.PI;
    const satPose = (s: sdf.Shape) => s.rotateX(-12).rotateY(satYaw).at(satP[0], satP[1] + 0.012, satP[2]);
    const satchel = satPose(sdf.box([0.125, 0.1, 0.05], 0.014).at(0, 0, 0.014));
    const flapShape = satPose(sdf.box([0.132, 0.05, 0.056], 0.012).at(0, 0.034, 0.015));
    const strapPts = (): [number, number, number, number][] => {
      const line = (t: number): [number, number] => [0.095 - 0.215 * t, 0.43 - 0.205 * t];
      const front = [1, 0.75, 0.5, 0.25, 0].map((t) => {
        const [x, y] = line(t);
        return [x, y, sdf.raycast(robeShape, [x, y, 1], [0, 0, -1])![2] + 0.004, 0.011] as [number, number, number, number];
      });
      const back = [0, 0.25, 0.5, 0.75, 1].map((t) => {
        const [x, y] = line(t);
        return [x, y, sdf.raycast(robeShape, [x, y, -1], [0, 0, 1])![2] - 0.004, 0.011] as [number, number, number, number];
      });
      return [...front, [0.108, 0.445, 0.0, 0.011], ...back];
    };
    const strap = sdf.chain(strapPts(), 0.004);
    const scrollShape = (x: number, tiltZ: number, tiltX: number) =>
      satPose(sdf.cylinder(0.015, 0.11, 0.005).rotateZ(tiltZ).rotateX(tiltX).at(x * 1.25, 0.06, -0.004));
    const scrolls = sdf.union(scrollShape(-0.03, 7, -4), scrollShape(0.0, 0, 6), scrollShape(0.03, -8, -2));
    k.body(
      'leather',
      sdf.union(
        belt.bone('spine'),
        strap.bone('spine'),
        satchel.bone('spine'),
        flapShape.paint(C.flap).bone('spine'),
      ),
      { color: C.leather, roughness: 0.65 },
    );
    k.body('scrolls', scrolls.bone('spine'), { color: C.scroll, roughness: 0.8, detail: 0.004 });

    // The big square gold buckle, with a small flap plate above it.
    const buckleFrame = sdf.box([0.066, 0.06, 0.012], 0.004).subtract(sdf.box([0.038, 0.034, 0.05]));
    const buckle = sdf
      .union(
        buckleFrame.at(0, beltY, beltZ + 0.004),
        sdf.box([0.03, 0.01, 0.012], 0.003).at(0, beltY, beltZ + 0.004),
        sdf.box([0.05, 0.016, 0.01], 0.003).at(0, beltY + 0.046, beltZ - 0.001),
      );
    const satButton = satPose(sdf.sphere(0.008).scale([1, 1, 0.6]).at(0, 0.03, 0.046));
    k.body('gold', sdf.union(buckle.bone('spine'), satButton.bone('spine')), { color: C.gold, roughness: 0.32, metalness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ shoes
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.062, 0.033, 0.072]).at(0, 0.033, 0.033),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeCap = sdf.ellipsoid([0.072, 0.05, 0.042]).at(0, 0.03, 0.098);
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0).paint(C.sole))
      .paintWhere(toeCap, C.toe, 0.012)
      .paintWhere(sdf.union(sdf.sphere(0.009).at(0.02, 0.045, 0.118), sdf.sphere(0.007).at(-0.025, 0.04, 0.115), sdf.sphere(0.006).at(0.0, 0.05, 0.128)), C.scuff, 0.004)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.7 });

    // ------------------------------------------------------------------ the wand and its spark
    // A plain tapered training stick through the fist, 0.2 m long.
    const wandPts = [-0.04, 0.0, 0.07, 0.14, 0.2].map((t, i) => {
      const p = along(t);
      return [p[0], p[1], p[2], 0.0125 - i * 0.0003] as [number, number, number, number];
    });
    const woodDark = rgb(C.woodDark);
    const wand = sdf
      .smoothUnion(0.006, sdf.chain(wandPts, 0.01), sdf.sphere(0.0145).at(...along(-0.042)))
      .paintFn((x, y, z, base) => (noise.fbm(x * 200, y * 30, z * 200, 2) > 0.25 ? woodDark : base));
    k.body('wand', wand, { color: C.wood, roughness: 0.6, bone: 'hand.R' });
    const flameBase: V3 = add(WAND_TIP, [0, -0.002, 0]);
    k.body('glow', flame(FLAME_H).at(...flameBase).paintFn(glowPaint(flameBase, FLAME_H)), {
      color: C.sparkBase,
      roughness: 0.4,
      emissive: C.sparkCore,
      emissiveIntensity: 1.4,
      detail: 0.003,
      bone: 'orb',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.06 * wave(p, 7), 1 + 0.1 * wave(p, 5, 0.2), 1 + 0.06 * wave(p, 7, 0.4)] as const },
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        hattip: { rotate: [4 * wave(p, 1, 0.4), 0, -6 * wave(p, 1, 0.35)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        // The left fist lifts a little, as if weighing something.
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // The right hand holds the wand, so the arms swing little; the robe skirt carries the motion.
    // The legs come from motion.gait.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          heel: [0.094, 0, -0.015],
          toe: [0.111, 0, 0.093],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...flicker(p),
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [flow * 0.25 + 3 * wave(p, 2, 0.1), -9 * wave(p, 1, 0.12), 4 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          hattip: { rotate: [flow * 0.4 + 6 * wave(p, 2, 0.2), 0, -8 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    // Posing by targets. The wrists follow keys in the chest's rest frame (reach); the wand hand
    // turns so the wand points along its own keys (orient); `up` rolls it about its length.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const WAND = { dir: norm(WAND_AXIS), up: [0, 0, 1] as V3 };
    const PALM = { dir: norm(rotX([0, -1, 0], HAND_L_PITCH)), up: norm(rotX([0, 0, 1], HAND_L_PITCH)) };
    const wandPose = (wrist: V3, dir: V3, up: V3 = [0, 0, 1], pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], WAND, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const palmPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.1, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], PALM, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack: a wand flick. He draws the wand back beside him (out and low, clear of the brim),
    // holds, then flicks it forward to point at the target; the tip flame flares and settles.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.28, [-0.285, 0.38, 0.0]],
            [0.4, [-0.29, 0.385, -0.01]],
            [0.46, [-0.24, 0.395, 0.1]],
            [0.52, [-0.19, 0.385, 0.19]],
            [0.64, [-0.19, 0.38, 0.19]],
            [0.82, [-0.22, 0.365, 0.13]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, WAND_AXIS],
            [0.28, norm([-0.45, 0.8, -0.38])],
            [0.4, norm([-0.46, 0.78, -0.42])],
            [0.46, norm([-0.18, 0.55, 0.82])],
            [0.52, norm([-0.04, 0.12, 1])],
            [0.64, norm([-0.04, 0.1, 1])],
            [0.82, norm([-0.2, 0.6, 0.78])],
            [1, WAND_AXIS],
          ] as const,
          'spline',
        );
        const up = keys(
          p,
          [
            [0, [0, 0, 1]],
            [0.28, [0, 0.45, 0.85]],
            [0.4, [0, 0.45, 0.85]],
            [0.46, [0, -0.5, 0.85]],
            [0.52, [0, -1, 0.12]],
            [0.64, [0, -1, 0.1]],
            [0.82, [0, -0.6, 0.8]],
            [1, [0, 0, 1]],
          ] as const,
        );
        const gather = ease(0.02, 0.28, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.42, 0.52, p) * (1 - ease(0.7, 1, p));
        const orb = keys(p, [[0, 1], [0.28, 0.7], [0.42, 0.8], [0.5, 2.1], [0.56, 2.4], [0.68, 1.5], [0.86, 1]] as const);
        return {
          ...wandPose(wrist, dir, up),
          ...palmPose(keys(p, [[0, WRIST_L], [0.3, [0.24, 0.3, 0.02]], [0.6, [0.235, 0.29, 0.09]], [1, WRIST_L]] as const), PALM.dir, PALM.up),
          orb: { scale: [orb, orb, orb] },
          hips: {
            move: [0, -legDrop(LEG, 14 * cast) - 0.005 * cast, 0.025 * cast - 0.01 * gather],
            rotate: [0, -12 * gather + 10 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 9 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -14 * gather + 12 * cast, 0] },
          head: { rotate: [4 * gather - 6 * cast, 12 * gather - 12 * cast, 0] },
          hattip: { rotate: [-6 * gather + 12 * cast, 0, -6 * gather] },
          cloak: { rotate: [4 * gather + 14 * cast, 0, 0] },
          'leg.L': { rotate: [2 * gather - 16 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 10 * cast, 0, 0] },
          'foot.L': { rotate: [10 * cast, 0, 0] },
          'foot.R': { rotate: [-5 * cast, 0, 0] },
        };
      },
    });

    // attack2: a two-hand cast that fizzles. The left fist comes up in front of him,
    // as the wand draws back; then the wand points forward and the tip flame flies off along it,
    // swells, and bursts away. A new small flame lights at the tip as the arms come back.
    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.48, p));
        const push = ease(0.4, 0.5, p) * (1 - ease(0.72, 1, p));
        const raise = ease(0.02, 0.3, p) * (1 - ease(0.72, 0.98, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.3, [-0.29, 0.37, 0.02]],
            [0.4, [-0.29, 0.375, 0.015]],
            [0.48, [-0.21, 0.39, 0.14]],
            [0.54, [-0.17, 0.39, 0.19]],
            [0.7, [-0.17, 0.385, 0.19]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, WAND_AXIS],
            [0.3, norm([-0.45, 0.85, -0.2])],
            [0.4, norm([-0.45, 0.85, -0.22])],
            [0.48, norm([-0.08, 0.5, 0.86])],
            [0.54, norm([0.06, 0.15, 0.98])],
            [0.7, norm([0.06, 0.15, 0.98])],
            [1, WAND_AXIS],
          ] as const,
          'spline',
        );
        const up = keys(p, [[0, [0, 0, 1]], [0.3, [0, 0.3, 0.95]], [0.4, [0, 0.3, 0.95]], [0.48, [0, -0.5, 0.85]], [0.54, [0, -1, 0.15]], [0.7, [0, -1, 0.15]], [1, [0, 0, 1]]] as const);
        // The flame: grows while charging, flies out along the wand, bursts, relights.
        const fly = ease(0.5, 0.66, p);
        const size = keys(p, [[0, 1], [0.3, 1.3], [0.4, 1.2], [0.5, 1.8], [0.62, 2.3], [0.67, 0.05], [0.84, 0.05], [0.98, 1]] as const);
        const away = 0.6 * fly * (p < 0.67 ? 1 : 1 - ease(0.67, 0.8, p));
        return {
          ...wandPose(wrist, dir, up),
          ...palmPose(lerp(WRIST_L, [0.15, 0.4, 0.17], raise), lerp(PALM.dir, norm([0.2, -0.1, 0.98]), raise), lerp(PALM.up, [0, 1, 0], raise)),
          orb: { scale: [size, size, size], move: scale(WAND_AXIS, away) },
          hips: {
            move: [0, -legDrop(LEG, 14 * push) - 0.004 * push, 0.025 * push - 0.01 * wind],
            rotate: [0, -8 * wind + 6 * push, 0],
          },
          skirt: { rotate: [-2 * wind + 5 * push, 4 * wind - 4 * push, 0] },
          spine: { rotate: [-4 * wind + 8 * push, 0, 0] },
          chest: { rotate: [-2 * wind + 4 * push, -8 * wind + 6 * push, 0] },
          head: { rotate: [2 * wind - 6 * push, 8 * wind - 6 * push, 0] },
          hattip: { rotate: [-4 * wind + 10 * push, 0, 6 * wind] },
          cloak: { rotate: [3 * wind + 14 * push, 0, 0] },
          'leg.L': { rotate: [2 * wind - 16 * push, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 10 * push, 0, 0] },
          'foot.L': { rotate: [10 * push, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back, a small step back, the wand tips out, the flame gutters.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.35 * h;
        return {
          ...wandPose(lerp(WRIST_R, [-0.26, 0.36, 0.05], h), lerp(WAND_AXIS, norm([-0.45, 0.88, -0.08]), h)),
          orb: { scale: [f, f, f] },
          hips: { move: [0, -0.005 * h, -0.025 * h], rotate: [0, -6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, 3 * h] },
          head: { rotate: [-14 * h, 8 * h, -5 * h] },
          hattip: { rotate: [14 * h, 0, -8 * h] },
          cloak: { rotate: [-8 * h, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 10 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger, then he falls flat on his back; the flame goes out, the
    // wand drops beside his right side. The hips drop below the floor on purpose: the build
    // lifts the body until it rests on the floor.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const flat = ease(0.4, 0.68, p);
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        return {
          ...wandPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.4, 0.1]], [0.66, [-0.26, 0.34, -0.09]]] as const),
            keys(p, [[0, WAND_AXIS], [0.3, norm([-0.3, 0.75, 0.6])], [0.5, norm([-0.2, -0.2, 0.96])], [0.66, norm([-0.15, -1, 0.3])]] as const),
            keys(p, [[0, [0, 0, 1]], [0.3, [-1, 0, 0]], [0.66, [-1, 0, 0]]] as const),
            [-0.3, 0.2, -0.4],
          ),
          ...palmPose(lerp(WRIST_L, [0.22, 0.3, -0.09], ease(0.2, 0.66, p)), PALM.dir, lerp(PALM.up, [0, 0.3, 1], ease(0.2, 0.62, p)), [0.3, 0.2, -0.4]),
          orb: { scale: [out, out, out] },
          hips: { move: hipsMove, rotate: [bend[0]!, 0, 0] },
          skirt: { rotate: [8 * stagger + leg - 20 * fall, 0, 0] },
          spine: { rotate: [bend[1]!, 0, 0] },
          chest: { rotate: [bend[2]!, 0, 0] },
          neck: { rotate: [bend[3]!, 0, 0] },
          head: { rotate: [bend[4]!, 0, 0] },
          cloak: { rotate: [-10 * stagger - 8 * fall, 0, 0], scale: [1 + 0.15 * flat, 1, 1 - 0.86 * flat] },
          'leg.L': { rotate: [6 * stagger + leg, 0, 4 * fall] },
          'leg.R': { rotate: [-6 * stagger + leg + 2 * fall, 0, -5 * fall] },
          'foot.L': { rotate: [-14 * fall, 0, 0] },
          'foot.R': { rotate: [-18 * fall, 0, 0] },
        };
      },
    });

    // victory (a hop): an anticipation crouch, a push-off, a hop of about 8 cm, and a
    // landing that the knees absorb. In the push-off he raises the wand up and out to his right
    // (well clear of the head) and the spark flares; the left fist pumps up.
    const V_JUMP = 0.08;
    const V_DROP = 0.04;
    const [V_OFF, V_LAND] = [0.28, 0.48];
    const LEGS = { hip: HIP, knee: KNEE, ankle: ANKLE };
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const pump = bump(Math.min(1, Math.max(0, (p - 0.52) / 0.4)), 2);
        let h: number;
        if (p < 0.2) h = -V_DROP * ease(0, 0.17, p);
        else if (p < V_OFF) h = -V_DROP * (1 - ((p - 0.2) / (V_OFF - 0.2)) ** 2);
        else if (p < V_LAND) h = (4 * V_JUMP * (p - V_OFF) * (V_LAND - p)) / (V_LAND - V_OFF) ** 2;
        else if (p < 0.56) h = -0.03 * Math.sin(((Math.PI / 2) * (p - V_LAND)) / (0.56 - V_LAND));
        else h = -0.03 * keys(p, [[0.56, 1], [0.66, 0.1], [0.72, 0.22], [0.84, 0]] as const);
        h -= 0.006 * pump;
        const bend = Math.max(0, -h) / V_DROP;
        const air = Math.max(0, h) / V_JUMP;
        const flight = p > V_OFF && p < V_LAND ? Math.sin((Math.PI * (p - V_OFF)) / (V_LAND - V_OFF)) : 0;
        const lift = Math.max(0, h) + 0.02 * flight;
        const pitch = Math.min(24, lift / 0.0022);
        const hips = { at: [0, 0.2, 0] as V3, move: [0, h, -0.2 * Math.max(0, -h)] as V3 };
        const legL = motion.legTo('L', LEGS, [ANKLE[0], ANKLE[1] + lift, 0], { hips, pitch });
        const legR = motion.legTo('R', LEGS, [-ANKLE[0], ANKLE[1] + lift, 0], { hips, pitch });
        const up = ease(0.18, 0.4, p);
        const f = 1 + 0.6 * up + 0.2 * pump;
        const wandWrist = add(lerp(WRIST_R, [-0.3, 0.45, 0.12], up), [0, 0.02 * pump, 0]);
        const bookWrist = keys(p, [[0, WRIST_L], [0.16, [0.23, 0.3, 0.06]], [0.4, [0.24, 0.42, 0.08]]] as const);
        return {
          ...wandPose(wandWrist, lerp(WAND_AXIS, norm([-0.7, 0.7, 0.1]), up)),
          ...palmPose(add(bookWrist, [0, 0.02 * pump, 0]), PALM.dir, PALM.up),
          orb: { scale: [f, f, f] },
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump, 5 * up, 0] },
          head: { rotate: [-4 * bend - 8 * up, 6 * up, 4 * up] },
          hattip: { rotate: [8 * bend - 14 * air + 6 * pump, 0, -8 * pump] },
          cloak: { rotate: [14 * air - 4 * bend, 0, 0] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
        };
      },
    });
  },
});
