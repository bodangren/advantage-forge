import { defineAsset, motion, noise, profile, rgb, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Highwayman — Chibi Quest enemy (catalog `enemies/humanoid/highwayman`), about 1.0 m to the crown
 * of his tricorn, faces +Z. Target: docs/enemy-mockups/highwayman_001.jpg (one front view).
 * Built on the bandit's head, mask and skeleton (the rogue's rig with knee bones), so the human
 * enemies read as one set.
 *
 * Role: a road robber enemy, seen in 3D and as a 128 px sprite; the hat, the red mask, the long
 *   grey coat and the pistol read.
 * One idea: a huge black tricorn over big dark eyes and a dark red mask, in a long grey coat.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, chin 0.48, shoulders 0.385, belt
 *   0.235); the tricorn spans 0.7 m and its flaps rise to 0.98; the coat hem is at 0.185.
 * Shape language: round (head, boots, purse) with the hat's folded points and the pistol as the
 *   sharp accents.
 * Palette (60/30/10): coat #3d3f42 and hat #26221f (dark 60), waistcoat #7a7770 and skin (light
 *   30), the red mask #8a2a26 as the accent, brass #b89040 and gold #d9b24a as sparks.
 * Value plan: the light eyes and forehead between the dark hat and the red mask are the focal
 *   point; the waistcoat and the gold purse are the second lights.
 * Bodies: skin, mask, hair, hat, coat, waistcoat, brass, trousers, boots, leather, buckle, pistol,
 *   pistol-grip, purse.
 * Rig: the bandit's skeleton; `purse` hangs from `hand.L`; `pistolbone` (child of `hand.R`) holds
 *   the pistol. Clips: idle, walk, run, attack (raise, point, fire, recoil), hit, death, taunt
 *   (shake the purse, point the pistol at the player).
 */

const C = {
  skin: '#f0cfa8',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#3a2416',
  irisLow: '#6a4226',
  pupil: '#0e0a08',
  lid: '#16100c',
  brow: '#2a2420',
  hair: '#4a3222',
  hairDark: '#382418',
  hat: '#26221f',
  stitch: '#3a3430',
  mask: '#8a2a26',
  maskDark: '#6a1e1c',
  coat: '#3d3f42',
  collar: '#33353a',
  waistcoat: '#7a7770',
  brass: '#b89040',
  buckle: '#c9a24a',
  belt: '#3a2a1e',
  breeches: '#2a2622',
  boot: '#4a3020',
  bootTop: '#5c3e2a',
  sole: '#2e1e14',
  glove: '#4a2e1e',
  pistol: '#2a2a2e',
  stock: '#5a3a24',
  purse: '#d9b24a',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const smooth01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// Joints: the right hand holds the pistol forward, the left hand lets the purse hang.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const ELBOW_R: V3 = [-0.192, 0.34, 0.015];
const WRIST_R: V3 = [-0.205, 0.3, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.085];
const FIST_TURN = 38; // the right fist turns about the wrist so the pistol points forward
const GRIP_R: V3 = (() => {
  const c = Math.cos((FIST_TURN * Math.PI) / 180);
  const sn = Math.sin((FIST_TURN * Math.PI) / 180);
  const [dx, dz] = [-0.007, 0.004];
  return [WRIST_R[0] + dx * c + dz * sn, WRIST_R[1] - 0.04, WRIST_R[2] - dx * sn + dz * c];
})();
const FIST_L: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.038, WRIST_L[2] + 0.004];
const PURSE_TOP: V3 = [FIST_L[0] + 0.004, FIST_L[1] - 0.02, FIST_L[2]];
const PURSE_AT: V3 = [FIST_L[0] + 0.012, FIST_L[1] - 0.088, FIST_L[2]];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(...o(0.007, -0.038, 0.004)),
    sdf.capsule(o(-0.009, -0.058, 0.03), o(-0.005, -0.038, 0.042), 0.017),
    sdf.cone(o(0.02, -0.023, 0.025), o(0.001, -0.033, 0.048), 0.016, 0.013),
  );
};

// The tricorn's brim: a thin sheet whose height follows three folds. Points droop at +-60 degrees
// (over the ears) and at the back; the flaps between them fold up (the front one lower, so the
// crown shows a dip between two humps in front). `a` is 1 on a flap and 0 on a point.
const HAT_BASE = 0.758;
const bumpAt = (th: number, c: number, w: number) => {
  let d = Math.abs(th - c) % (2 * Math.PI);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return Math.exp(-((d / w) * (d / w)));
};
const flap = (th: number) => Math.max(bumpAt(th, 0.5, 0.75), bumpAt(th, -0.5, 0.75), 0.6 * bumpAt(th, Math.PI, 0.7));
const brimAt = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const th = Math.atan2(x, z);
  const a = flap(th);
  const front = 1;
  const s = smooth01((r - 0.14) / 0.18);
  return { r, th, a, y: HAT_BASE + s * (-0.05 + 0.24 * a * front), edge: 0.31 + 0.045 * (1 - a) };
};
const brimSheet = new Sdf(
  (x, y, z) => {
    const b = brimAt(x, z);
    return Math.max((Math.abs(y - b.y) - 0.01) / 2.6, b.r - b.edge);
  },
  { min: [-0.4, 0.62, -0.4], max: [0.4, 1.05, 0.4] },
);

export default defineAsset({
  name: 'highwayman',
  description: 'Chibi highwayman enemy: a big black tricorn, big dark eyes over a dark red mask, a long grey coat with brass buttons, a flintlock pistol and a gold purse.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/highwayman_001.jpg',
  // Color slots for individual highwaymen (the first option is the default look).
  variants: {
    mask: { red: C.mask, black: '#24201e', blue: '#2a4a7a' },
    coat: { grey: C.coat, black: '#202224', brown: '#4a3626' },
    hat: { black: C.hat, brown: '#4a3626', grey: '#5a5a60' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
  },
  presets: {
    nightrider: { mask: 'black', coat: 'black', hat: 'black', skin: 'fair' },
    gentleman: { mask: 'blue', coat: 'brown', hat: 'brown', skin: 'tan' },
    ghost: { mask: 'red', coat: 'grey', hat: 'grey', skin: 'brown' },
  },

  build(k) {
    const T = {
      skin: k.tint('skin'),
      mask: k.tint('mask'),
      maskDark: k.tint('mask', { color: C.maskDark, follow: 1 }),
      coat: k.tint('coat'),
      collar: k.tint('coat', { color: C.collar, follow: 1 }),
      coatDark: k.tint('coat', { color: '#2c2e30', follow: 1 }),
      hat: k.tint('hat'),
      stitch: k.tint('hat', { color: C.stitch, follow: 1 }),
    };
    const KNOT: V3 = [0, 0.6, -0.2];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.02, 0.52, -0.25] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      purse: { parent: 'hand.L', at: PURSE_TOP },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      pistolbone: { parent: 'hand.R', at: GRIP_R },
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
    const nose = sdf.ellipsoid([0.022, 0.018, 0.017]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1)
        .at(-WRIST_R[0], -WRIST_R[1], -WRIST_R[2])
        .rotateY(FIST_TURN)
        .at(...WRIST_R)
        .bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    // Big round dark eyes, wide open.
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.044, 0.05, 0.07]), EYE[0] + 0.004, EYE[1] - 0.002));
    const iris = pair(at(sdf.ellipsoid([0.039, 0.045, 0.07]), EYE[0] + 0.004, EYE[1] - 0.003));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.026));
    const pupil = pair(at(sdf.ellipsoid([0.03, 0.035, 0.07]), EYE[0] + 0.004, EYE[1] - 0.002));
    // A light upper lid on a gentle slant: a calm, watchful look.
    const lid = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.06, EYE[1] + 0.041],
            [EYE[0] + 0.06, EYE[1] + 0.05],
            [EYE[0] + 0.06, EYE[1] + 0.1],
            [EYE[0] - 0.06, EYE[1] + 0.1],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const lidLine = pair(sdf.extrude(profile.arc(0.054, 0.009, 25, 155), 0.3).at(EYE[0], EYE[1] - 0.008, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.017, EYE[1] + 0.014), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.024)]),
    );
    // Thick brows with a soft arch.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.165, 0.7],
              [0.125, 0.726],
              [0.08, 0.73],
              [0.045, 0.716],
              [0.047, 0.698],
              [0.08, 0.708],
              [0.125, 0.704],
              [0.162, 0.686],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // Dark gloves on both fists.
    const glove = (w: V3, s: 1 | -1) => sdf.sphere(0.115).at(w[0] + 0.007 * s, w[1] - 0.02, w[2] + 0.015);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lid.intersect(eyeWhite.round(0.004)), T.skin)
      .paintWhere(lidLine.intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.004))), C.lid)
      .paintWhere(brows, C.brow)
      .paintWhere(sdf.union(glove(WRIST_L, 1), glove(WRIST_R, -1)), C.glove, 0.004);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.005 });

    // ------------------------------------------------------------------ mask: a cloth over the nose and mouth
    const faceShape = sdf.smoothUnion(0.05, head, sdf.ellipsoid([0.03, 0.024, 0.024]).at(0, 0.57, faceZ(0, 0.57) - 0.006));
    const maskShell = faceShape.round(0.013).subtract(faceShape.round(-0.002));
    const maskFront = maskShell.intersect(
      sdf
        .extrude(
          profile.polygon([
            [-0.26, 0.606],
            [-0.08, 0.596],
            [0, 0.605],
            [0.08, 0.596],
            [0.26, 0.606],
            [0.26, 0.5],
            [0.07, 0.492],
            [0, 0.45],
            [-0.07, 0.492],
            [-0.26, 0.5],
          ]),
          0.4,
        )
        .at(0, 0, 0.2),
    );
    const maskBand = maskShell.smoothIntersect(0.005, sdf.box([0.6, 0.05, 0.4], 0.01).at(0, 0.595, -0.2));
    // The cloth hangs below the chin in a soft point, down to the collar.
    const chinZ = faceZ(0, 0.5);
    const maskPoint = sdf
      .extrude(
        profile.polygon([
          [-0.085, 0.52],
          [0.085, 0.52],
          [0, 0.41],
        ]),
        0.014,
        0.006,
      )
      .rotateX(-16)
      .at(0, 0, chinZ - 0.012);
    const knotShape = sdf.ellipsoid([0.034, 0.028, 0.024]).at(...KNOT);
    const tail = (dx: number, dy: number) =>
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.018],
          [KNOT[0] + dx * 0.5, KNOT[1] + dy * 0.5, KNOT[2] - 0.03, 0.022],
          [KNOT[0] + dx, KNOT[1] + dy, KNOT[2] - 0.04, 0.01],
        ],
        0.008,
      );
    const mask = sdf
      .smoothUnion(0.01, sdf.smoothUnion(0.012, maskFront, maskPoint, maskBand).bone('head'), knotShape.bone('head'), sdf.union(tail(-0.04, -0.07), tail(0.03, -0.075)).bone('knot'))
      .paintFn((x, y, z, base) => (z > 0 && Math.abs(Math.sin(x * 50 + y * 30)) < 0.07 && y < 0.58 ? rgb(T.maskDark) : base));
    k.body('mask', mask, { color: T.mask, roughness: 0.9, bump: (x, y, z) => 0.0006 * Math.sin(x * 500) * Math.sin((y + z) * 500) });

    // ------------------------------------------------------------------ hair: short, at the temples, under the hat
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.016, HEAD[1] + 0.016, HEAD[2] + 0.016])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.14, 0.22]).at(0, 0.62, 0.15))
      .intersect(sdf.halfSpace([0, -1, 0], -0.66));
    const sideburns = pair(sdf.cone([0.185, 0.74, 0.03], [0.195, 0.62, 0.05], 0.036, 0.014));
    const temples = pair(sdf.ellipsoid([0.04, 0.05, 0.05]).at(0.165, 0.72, 0.08));
    const hair = sdf.smoothUnion(0.02, cap, sideburns, temples).paintWhere(sdf.ellipsoid([0.2, 0.08, 0.2]).at(0, 0.73, -0.02), C.hairDark, 0.05);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ the tricorn
    const crown = sdf.cylinder(0.215, 0.15, 0.072).scale([1.02, 1, 0.94]).at(0, 0.83, -0.005);
    const hat = sdf
      .smoothUnion(0.025, crown, brimSheet.round(0.005))
      .paintFn((x, y, z, base) => {
        const b = brimAt(x, z);
        return b.edge - b.r < 0.02 && y > 0.6 && b.r > 0.22 ? rgb(T.stitch) : base;
      });
    k.body('hat', hat, {
      color: T.hat,
      roughness: 0.5,
      detail: 0.005,
      bone: 'head',
      bump: (x, y, z) => {
        const b = brimAt(x, z);
        const rr = b.edge - b.r;
        // A stitch groove 4 mm wide, 10 mm in from the edge, with small stitch ticks in it.
        const groove = rr > 0.008 && rr < 0.012 && b.r > 0.22 ? (Math.sin(b.th * 140) > 0.4 ? 0.0006 : -0.0018) : 0;
        return groove + 0.0005 * noise.noise3(x * 90, y * 90, z * 90);
      },
    });

    // ------------------------------------------------------------------ waistcoat, coat
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // The grey knitted waistcoat shows in the open front of the coat, down to the belt.
    k.body('waistcoat', torso.intersect(sdf.halfSpace([0, -1, 0], -0.225)).bone('spine'), {
      color: C.waistcoat,
      roughness: 0.95,
      bump: (x, y) => 0.0009 * Math.sin(x * 520) * Math.sin(y * 520),
    });
    // The long coat: a shell over the torso and a flared skirt in two halves, one on each leg.
    const openFront = sdf
      .extrude(
        profile.polygon([
          [-0.045, 0.47],
          [0.045, 0.47],
          [0.055, 0.4],
          [0.07, 0.3],
          [0.085, 0.2],
          [0.115, 0.1],
          [-0.115, 0.1],
          [-0.085, 0.2],
          [-0.07, 0.3],
          [-0.055, 0.4],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const torsoShell = torso
      .round(0.02)
      .subtract(torso.round(0.006))
      .intersect(sdf.halfSpace([0, 1, 0], 0.455))
      .intersect(sdf.halfSpace([0, -1, 0], -0.285));
    const skirtOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.31],
          [0.146, 0.31],
          [0.152, 0.25],
          [0.165, 0.21],
          [0.2, 0.185],
          [0.228, 0.17],
          [0, 0.17],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const skirtInner = sdf.revolve(
      profile.polygon(
        [
          [0, 0.32],
          [0.132, 0.32],
          [0.138, 0.25],
          [0.151, 0.21],
          [0.186, 0.175],
          [0.214, 0.16],
          [0, 0.15],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const skirtHalf = skirtOuter
      .subtract(skirtInner)
      .scale([1, 1, 0.8])
      .intersect(sdf.halfSpace([-1, 0, 0], 0))
      .subtract(sdf.box([0.02, 0.16, 0.3], 0.004).at(0, 0.19, -0.15))
      .bone('leg.L');
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.55), 0.048, 0.046).bone(tag),
        sdf.cone(lerp(s, e, 0.45), e, 0.046, 0.044).bone(tag),
      );
    const forearmSleeve = (e: V3, w: V3, tag: string) => sdf.cone(e, lerp(e, w, 0.7), 0.045, 0.044).bone(tag);
    // Folded cuffs: thick dark bands at the wrists.
    const cuff = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.6), add(w, [0, 0.004, 0]), 0.059, 0.057).round(0.007).paint(T.collar).bone(tag);
    // A wide raised collar, open at the front, higher behind the neck.
    const collar = sdf
      .revolve(
        profile.polygon([
          [0.092, 0.41],
          [0.118, 0.47],
          [0.176, 0.59],
          [0.15, 0.59],
          [0.094, 0.47],
          [0.074, 0.41],
        ]),
      )
      .round(0.006)
      .scale([1, 1, 0.9])
      .at(0, 0, -0.015)
      .subtract(
        sdf
          .extrude(
            profile.polygon([
              [-0.035, 0.57],
              [0.035, 0.57],
              [0.085, 0.4],
              [-0.085, 0.4],
            ]),
            0.4,
          )
          .at(0, 0, 0.25),
      )
      .intersect(sdf.halfSpace([0, 1, 0.55], 0.58))
      .paint(T.collar)
      .bone('chest');
    // Lapels: two rounded flaps that fold outward from the front opening at chest height.
    const lapel = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.045],
          [0.03, 0.05],
          [0.036, -0.04],
          [-0.024, -0.05],
        ]),
        0.014,
        0.005,
      )
      .rotate(0, 32, -10)
      .at(0.07, 0.385, 0.108)
      .paint(T.collar);
    const lapels = pair(lapel).bone('chest');
    const coatShape = sdf
      .smoothUnion(
        0.012,
        torsoShell.bone('spine'),
        pair(skirtHalf),
        sleeve(SHOULDER, ELBOW_L, 'upperarm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
        forearmSleeve(ELBOW_L, WRIST_L, 'forearm.L'),
        forearmSleeve(ELBOW_R, WRIST_R, 'forearm.R'),
      )
      .subtract(openFront)
      .paintFn((x, y, z, base) => (noise.fbm(x * 80, y * 80, z * 80, 2) > 0.3 ? rgb(T.coatDark) : base))
      .union(lapels, cuff(ELBOW_L, WRIST_L, 'forearm.L'), cuff(ELBOW_R, WRIST_R, 'forearm.R'), collar);
    k.body('coat', coatShape, {
      color: T.coat,
      roughness: 0.95,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    // Six brass buttons, three on each front edge of the coat.
    const button = (x: number, y: number) => {
      const z = sdf.raycast(coatShape, [x, y, 1], [0, 0, -1])![2];
      return sdf.sphere(0.011).at(x, y, z + 0.001);
    };
    k.body(
      'brass',
      sdf.union(...[0.345, 0.29, 0.235].flatMap((y) => [button(0.098, y), button(-0.098, y)])).bone('spine'),
      { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.004 },
    );

    // ------------------------------------------------------------------ breeches, boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.14, 0.07, 0.112]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.cone([HIP[0], 0.2, 0], [0.096, 0.1, 0.004], 0.05, 0.045).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.breeches, roughness: 0.55 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.054, 0.17, 0.02).rotateX(6).at(0, 0.065, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootStraps = bootFoot
      .round(0.003)
      .smoothIntersect(0.003, sdf.union(sdf.box([0.2, 0.012, 0.2]).at(0, 0.075, 0), sdf.box([0.2, 0.012, 0.2]).rotateX(-25).at(0, 0.06, 0.07)));
    const boot = bootFoot
      .union(bootStraps.paint(C.sole))
      .union(sdf.torus(0.055, 0.015).rotateX(6).at(0, 0.132, 0.005).paint(C.bootTop))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ belt and buckle
    const beltY = 0.235;
    const belt = torso.round(0.014).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    k.body('leather', belt.bone('spine'), { color: C.belt, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.torus(0.02, 0.006).rotateX(90).at(0, 0, 0.004), sdf.box([0.008, 0.034, 0.008], 0.003).at(0, 0, 0.004))
      .at(0, beltY, beltZ + 0.003);
    k.body('buckle', buckle.bone('spine'), { color: C.buckle, roughness: 0.3, metalness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the flintlock pistol in the right hand
    // Built at rest with the grip along Z (through the fist), the muzzle out to his right, then
    // turned out and up a little.
    const PISTOL_TURN: V3 = [0, FIST_TURN, 10];
    const pistolPose = (s: sdf.Shape) => s.rotate(...PISTOL_TURN).at(...GRIP_R);
    // Local frame: the grip along Z (through the fist), the lock at the front end (+Z side up), the
    // barrel out along -X. A flintlock: lock plate, bent hammer, trigger guard, curved stock, brass butt.
    const pistolMetal = sdf.union(
      sdf.box([0.056, 0.044, 0.06], 0.012).at(-0.026, 0.0, 0.055), // lock body
      sdf.box([0.034, 0.008, 0.024], 0.003).at(-0.03, 0.024, 0.06).paint(C.brass), // lock plate
      sdf.cylinder(0.011, 0.14, 0.004).rotateZ(90).at(-0.11, 0.0, 0.055), // barrel
      sdf.cylinder(0.0145, 0.012, 0.004).rotateZ(90).at(-0.176, 0.0, 0.055), // muzzle ring
      sdf.cone([-0.012, 0, 0.082], [0.004, 0, 0.098], 0.009, 0.005), // hammer neck
      sdf.cone([0.004, 0, 0.098], [-0.014, 0, 0.11], 0.006, 0.005), // hammer bent forward
      sdf.torus(0.019, 0.0045).at(-0.034, 0, 0.012), // trigger guard
      sdf.sphere(0.0125).at(0, -0.04, -0.086).paint(C.buckle), // butt cap
    );
    const pistolStock = sdf.union(
      sdf.capsule([0, 0, -0.03], [0, 0, 0.04], 0.019), // grip
      sdf.capsule([0, 0, -0.03], [0, -0.032, -0.078], 0.019), // the butt curves down 45 degrees
      sdf.box([0.05, 0.03, 0.058], 0.01).at(-0.03, -0.006, 0.05), // stock around the lock
      sdf.capsule([-0.02, -0.006, 0.05], [-0.1, -0.005, 0.05], 0.011), // fore-stock under the barrel
    );
    k.body('pistol', pistolPose(pistolMetal), { color: C.pistol, roughness: 0.4, metalness: 0.75, detail: 0.004, bone: 'pistolbone' });
    k.body('pistol-grip', pistolPose(pistolStock), { color: C.stock, roughness: 0.65, detail: 0.004, bone: 'pistolbone' });

    // ------------------------------------------------------------------ the gold coin purse in the left hand
    const purseShape = sdf
      .smoothUnion(
        0.02,
        sdf.sphere(0.046).at(...PURSE_AT),
        sdf.cone(PURSE_TOP, add(PURSE_AT, [0, 0.03, 0]), 0.012, 0.03),
        sdf.torus(0.014, 0.006).rotateX(90).at(...add(PURSE_AT, [0, 0.055, 0])),
      )
      .paintWhere(sdf.sphere(0.03).at(...add(PURSE_AT, [0, 0.036, 0])), '#a4802e', 0.01);
    k.body('purse-bag', purseShape, { color: C.purse, roughness: 0.4, metalness: 0.45, detail: 0.004, bone: 'purse' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const { keys, reach, orient, quat, euler } = motion;
    const LEG = 0.19;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const POLE_REST_L: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    const POLE_REST_R: V3 = add(mx(SHOULDER), add(ELBOW_R, mx(SHOULDER), -1), 4);
    // The pistol's rest frame: the muzzle direction and the sights (up), from the turns in pistolPose.
    const pistolTurn = (v: V3): V3 => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(PISTOL_TURN[0]))
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(PISTOL_TURN[1]))
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(PISTOL_TURN[2]));
      return [w.x, w.y, w.z];
    };
    const MUZZLE = pistolTurn([-1, 0, 0]);
    const SIGHTS = pistolTurn([0, 1, 0]);
    /** The right arm and hand for a wrist target, a muzzle direction, and how far the sights turn up. */
    const pistolArm = (wrist: V3, pole: V3, dir: V3, upBlend: number) => {
      const arm = reach(ARM_R, wrist, pole);
      const d = norm(dir);
      const hand = orient([arm.upper, arm.lower], { dir: MUZZLE, up: SIGHTS }, { dir: d, up: lerp(SIGHTS, [0, 1, 0], upBlend) });
      return { upper: arm.upper, lower: arm.lower, hand };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 8 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        purse: { rotate: [5 * wave(p, 1, 0.3), 0, 4 * wave(p, 1, 0.2)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-2 * bump(p), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. The gait phase runs a quarter cycle behind the clip.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          purse: { rotate: [lean + 10 * wave(p, 2, 0.25), 0, 6 * wave(p, 1, 0.3)] as const },
          'upperarm.L': { rotate: [armSwing * 0.6 * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 0.03, 46, 12));

    // Attack: the pistol arm rises and points at the player at chest height (a short hold), the
    // pistol fires and kicks up with the body rocking back, then it settles and lowers.
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [
          [0, WRIST_R],
          [0.2, [-0.13, 0.37, 0.13]],
          [0.34, [-0.08, 0.365, 0.2]],
          [0.44, [-0.08, 0.365, 0.2]],
          [0.475, [-0.085, 0.39, 0.15]], // the kick: back and up
          [0.6, [-0.08, 0.372, 0.19]],
          [0.72, [-0.08, 0.365, 0.2]],
          [1, WRIST_R],
        ] as const);
        const dir = keys(p, [
          [0, MUZZLE],
          [0.2, norm([-0.3, 0.2, 1])],
          [0.34, norm([0, 0.03, 1])],
          [0.44, norm([0, 0.03, 1])],
          [0.475, norm([0, 0.55, 1])],
          [0.6, norm([0, 0.06, 1])],
          [0.72, norm([0, 0.03, 1])],
          [1, MUZZLE],
        ] as const);
        const ready = keys(p, [[0, 0], [0.22, 1], [0.72, 1], [1, 0]] as const);
        const pole = keys(p, [[0, POLE_REST_R], [0.34, [-0.45, 0.12, -0.05]], [0.72, [-0.45, 0.12, -0.05]], [1, POLE_REST_R]] as const);
        const a = pistolArm(wrist, pole, dir, ready);
        const wind = keys(p, [[0, 0], [0.3, 1], [0.44, 1], [0.5, 0]] as const);
        const kick = keys(p, [[0.44, 0], [0.475, 1], [0.62, 0.15], [0.8, 0]] as const);
        return {
          hips: { move: [0, 0, -0.012 * kick], rotate: [0, -6 * wind, 0] },
          spine: { rotate: [-3 * kick, 0, 0] },
          chest: { rotate: [-2 * wind - 6 * kick, 8 * wind, 0] },
          head: { rotate: [-2 * kick, -6 * wind, 0] },
          knot: { rotate: [-10 * kick, 0, 0] },
          purse: { rotate: [-10 * kick, 0, 8 * wind] },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [-8 * wind + 6 * kick, 0, 6 * wind] },
          'forearm.L': { rotate: [-10 * wind, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly.
    const DEG = Math.PI / 180;
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.06; // the back of the boot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.45], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          knot: { rotate: [-16 * flop, 0, 8 * flop] },
          purse: { rotate: [-18 * flop, 0, -14 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-14 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the highwayman slumps forward and wobbles, then tips back over
    // his heels as one piece and lands on his back. The arms are solved by targets in the chest's
    // rest frame and lie out on the ground; the pistol stays in the hand and the purse swings.
    const LIE = 86; // the hips' final tilt back, degrees
    const LIE_Y = 0.13; // the hips' height when he lies on his back
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const legs = 16 * clamp01((tilt - 70) / 16); // the legs come down once the hips hold
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.025], land), lerp(ELBOW_L, [0.35, 0.36, -0.06], land));
        return {
          hips: { move: [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back], rotate: [-tilt, 0, 0] },
          spine: { rotate: [-8 * hitB + 6 * sag, 0, 4 * wob] },
          chest: { rotate: [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob] },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          knot: { rotate: [-12 * hitB + 10 * fly, 0, 10 * wob - 90 * land] },
          purse: { rotate: [-10 * hitB + 30 * fly, 0, -8 * wob - 30 * land] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: jingle the purse, point the pistol
    // Played when the highwayman first sees the player. He lifts the purse and jingles it twice, head
    // cocked ("your gold is mine"), then lowers it and points the pistol at the player with a
    // short thrust, and returns to rest.
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const show = keys(p, [[0, 0], [0.12, 1], [0.5, 1], [0.6, 0]] as const);
        const jing = wave(p, 5, 0) * keys(p, [[0.1, 0], [0.18, 1], [0.44, 1], [0.52, 0]] as const);
        const cock = keys(p, [[0, 0], [0.1, 1], [0.5, 1], [0.6, 0]] as const);
        const aim = keys(p, [[0.52, 0], [0.66, 1], [0.92, 1], [1, 0]] as const);
        const thrust = keys(p, [[0.76, 0], [0.8, 1], [0.86, 0]] as const);
        const wristL = add(lerp(WRIST_L, [0.2, 0.38, 0.14], show), [0, 0.014 * jing, 0]);
        const armL = reach(ARM_L, wristL, lerp(POLE_REST_L, [0.5, 0.1, 0], show));
        const wristR = add(lerp(WRIST_R, [-0.075, 0.365, 0.2], aim), [0, 0, 0.03 * thrust]);
        const dirR = keys(p, [[0.52, MUZZLE], [0.66, norm([0, 0.03, 1])], [0.92, norm([0, 0.03, 1])], [1, MUZZLE]] as const);
        const a = pistolArm(wristR, lerp(POLE_REST_R, [-0.45, 0.12, -0.05], aim), dirR, aim);
        return {
          spine: { rotate: [-3 * cock + 2 * aim, 0, 0] },
          chest: { rotate: [-3 * cock - 2 * thrust, -6 * show + 8 * aim, 0] },
          neck: { rotate: [-3 * cock, 0, 3 * cock] },
          head: { rotate: [-5 * cock + 4 * aim, 6 * aim, 9 * cock] },
          knot: { rotate: [6 * cock, 0, -4 * jing] },
          purse: { rotate: [14 * jing, 0, 10 * jing] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
        };
      },
    });
  },
});
