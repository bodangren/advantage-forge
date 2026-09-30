import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Witch - Chibi Quest enemy (catalog `enemies/humanoid/witch`), about 1.07 m to the hat tip, faces +Z.
 * Target: docs/enemy-mockups/witch_001.jpg (one front view). Built on the mage's chibi body,
 * skeleton, and clip set (rig, knee split, `skirt`, `hatroot`, `hattip`), re-dressed as a witch.
 *
 * One idea: a huge black hat with a crooked bent tip over a cackling face (a long warty nose, a
 *   wide toothy grin) framed by wild grey-green locks; a gnarled broom in one hand and a bubbling
 *   green potion in the other.
 * Shape language: triangular and crooked (hat, tip, nose, torn hem, curled shoes) over the round chibi.
 * Palette (60/30/10): near-black cloth #1c1a1e (hat, dress, shoes); grey-green hair #6a7a5a and
 *   dark green shawl #3a5a3a; skin #f0c8a0; the accents are purple #7a3aa0 (band, patches), the
 *   gold buckle, and the glowing green potion.
 * Value plan: dark hat, dress, and shoes frame the light face; the potion glow is the brightest point.
 * Materials: skin, hat, hat band, buckle, hair, dress, hem strips, legs, shawl, shoes, broom stick,
 *   broom bristles, potion glass, potion liquid, cork.
 * Rig: the mage's skeleton (`cloak` and `orb` stay unused or are dropped). Broom rigid on `hand.R`,
 *   bristles up; potion on the open palm of `hand.L`.
 * Clips: idle, walk, run, attack (a broom swing with a potion toss), hit, death, taunt (a cackle hop).
 */

const C = {
  skin: '#f0c8a0',
  blush: '#e8a090',
  wart: '#b88a70',
  eyeWhite: '#f6f1ea',
  iris: '#2a1c16',
  pupil: '#0c0a0a',
  lid: '#1c130f',
  brow: '#2a2420',
  mouth: '#7a2a22',
  teeth: '#f0ece0',
  hat: '#1c1a1e',
  hatLit: '#2e2a30',
  hatInside: '#0e0c10',
  band: '#7a3aa0',
  gold: '#c9a24a',
  patch: '#8a4ab0',
  hair: '#6a7a5a',
  hairLit: '#8a9a78',
  hairDark: '#4a5a3e',
  dress: '#1c1a1e',
  dressLit: '#2e2a30',
  strip: '#5a4a3a',
  legs: '#5a4a3a',
  shawl: '#3a5a3a',
  shawlLit: '#4a6e4a',
  shoe: '#16141a',
  sole: '#0c0a0e',
  stick: '#5a3a24',
  stickDark: '#3a2414',
  bristle: '#8a6a44',
  bristleDark: '#6a4a2c',
  cord: '#4a2e1c',
  potion: '#106020',
  potionGlow: '#40c060',
  potionCore: '#7ae898',
  cork: '#8a6a44',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the mage's). The right fist holds the broom upright at his side; the left hand is open,
// palm up, with the potion bottle standing on it.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.198, 0.36, -0.004];
const WRIST_R: V3 = [-0.24, 0.35, 0.085];
const ELBOW_L: V3 = [0.198, 0.355, 0.012];
const WRIST_L: V3 = [0.258, 0.35, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
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

/** A fist hanging from the wrist at the origin; its grip hole runs along Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.007 * s, -0.038, 0.004),
    sdf.capsule([-0.009 * s, -0.058, 0.03], [-0.005 * s, -0.038, 0.042], 0.017),
    sdf.cone([0.02 * s, -0.023, 0.025], [0.001 * s, -0.033, 0.048], 0.016, 0.013),
  );
// The broom hand swings forward and tips out a little, so the broom leans away from the hat.
const HAND_R = { pitch: -78, roll: 12 };
const handR = (s: sdf.Shape) => s.rotateX(HAND_R.pitch).rotateZ(HAND_R.roll).at(...WRIST_R);
const handRPoint = (p: V3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const WAND_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.007, -0.04, 0.004]);
/** A shape built along +Y with the grip at the origin, put along the broom axis at the grip. */
const broomPose = (s: sdf.Shape) => s.rotateX(90 + HAND_R.pitch).rotateZ(HAND_R.roll).at(...GRIP);

/** An open hand, palm up, pointing along +X from the wrist at the origin. */
const openHand = sdf.smoothUnion(
  0.012,
  sdf.ellipsoid([0.046, 0.02, 0.04]).at(0.04, 0, 0.004),
  ...[-0.024, -0.008, 0.008, 0.024].map((z, i) =>
    sdf.capsule([0.07, 0.002, z], [0.098 - Math.abs(i - 1.5) * 0.006, 0.016, z * 1.1], 0.0105),
  ),
  sdf.capsule([0.03, 0.006, 0.036], [0.058, 0.022, 0.052], 0.012),
);
const HAND_L_YAW = -40;
const handL = (s: sdf.Shape) => s.rotateY(HAND_L_YAW).at(...WRIST_L);
/** The potion bottle stands on the open palm, out on the fingers. */
const BOTTLE_AT: V3 = add(WRIST_L, rotY([0.078, 0.065, 0.006], HAND_L_YAW));

/** The hat's pivot: the center of the crown's base (and the `hatroot` bone). */
const HAT_AT: V3 = [0, 0.745, -0.012];
const hatPoint = (p: V3) => add(rotZ(rotX(p, -18), -10), HAT_AT);

export default defineAsset({
  name: 'witch',
  description: 'Chibi cackling witch enemy with a bent black hat, wild grey-green hair, a warty nose, a broom, and a green potion.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/witch_001.jpg',
  variants: {
    dress: { black: C.dress, purple: '#3a2a4a', green: '#2a3a2a' },
    hair: { moss: C.hair, white: '#d8d4c8', orange: '#c86a2a' },
    band: { purple: C.band, red: '#a83a30', green: '#3a8a3a' },
  },
  presets: {
    hag: { dress: 'black', hair: 'moss', band: 'purple' },
    crone: { dress: 'purple', hair: 'white', band: 'red' },
    swamp: { dress: 'green', hair: 'orange', band: 'green' },
  },

  build(k) {
    const T = {
      dress: k.tint('dress'),
      dressLit: k.tint('dress', { color: C.dressLit, follow: 1 }),
      hair: k.tint('hair'),
      hairLit: k.tint('hair', { color: C.hairLit, follow: 1 }),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      band: k.tint('band'),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.25, 0], tail: [0, 0.1, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hatroot: { parent: 'head', at: HAT_AT },
      hattip: { parent: 'hatroot', at: hatPoint([-0.005, 0.25, -0.01]), tail: hatPoint([-0.225, 0.302, -0.01]) },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
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
    // A long crooked nose: it leaves the face, points out, and bends down and to one side at the tip.
    const NOSE_Z = faceZ(0, 0.58);
    const nose = sdf
      .smoothUnion(
        0.012,
        sdf.chain(
          [
            [0, 0.588, NOSE_Z - 0.012, 0.022],
            [0.002, 0.582, NOSE_Z + 0.025, 0.024],
            [0.007, 0.571, NOSE_Z + 0.05, 0.022],
          ],
          0.012,
        ),
        sdf.sphere(0.027).at(0.009, 0.56, NOSE_Z + 0.062),
        sdf.sphere(0.0085).at(0.024, 0.576, NOSE_Z + 0.05),
      )
      .bone('head');
    const wartStencil = sdf.sphere(0.0105).at(0.025, 0.577, NOSE_Z + 0.051);
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.055, 0.036])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateZ(-14)
        .rotateY(-14)
        .at(0.205, 0.625, -0.01)
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
      handL(openHand).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.048, 0.052, 0.07]), EYE[0], EYE[1]));
    const iris = pair(at(sdf.ellipsoid([0.044, 0.048, 0.07]), EYE[0], EYE[1] - 0.003));
    const pupil = pair(at(sdf.ellipsoid([0.036, 0.04, 0.07]), EYE[0], EYE[1] - 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.049, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.0145), x + 0.018, EYE[1] + 0.02),
        at(sdf.sphere(0.0065), x - 0.016, EYE[1] - 0.024),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.03, 58, 122), 0.3).rotateZ(3).at(0.1, 0.716 - 0.1, 0.1));
    // A wide grin: a dark mouth arc with a full white teeth strip on top of it.
    const grin = sdf.extrude(profile.arc(0.1, 0.038, 236, 304), 0.3).at(0, 0.516 + 0.1, 0.1);
    const teeth = sdf.extrude(profile.arc(0.1015, 0.025, 239, 301), 0.3).at(0, 0.5225 + 0.1, 0.1);
    // One dark gap tooth, left of center.
    const gap = at(sdf.sphere(0.0056), -0.013, 0.5225);
    const blush = pair(at(sdf.sphere(0.04), 0.14, 0.556));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, C.iris)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(grin, C.mouth)
      .paintWhere(teeth, C.teeth)
      .paintWhere(gap, C.brow)
      .paintWhere(wartStencil, C.wart);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ the hat
    // Local frame: the crown's base center at the origin. A wide wavy brim, a tall cone crown whose
    // top bends over to his right (-X) and droops, a purple band with a gold buckle, one patch.
    const BRIM_MID = [
      [0, 0.021],
      [0.2, 0.016],
      [0.26, 0.004],
      [0.32, -0.0215],
      [0.36, -0.047],
      [0.6, -0.1],
    ] as const;
    const brimMid = (r: number) => {
      let i = 0;
      while (i < BRIM_MID.length - 2 && r > BRIM_MID[i + 1]![0]) i++;
      const [r0, y0] = BRIM_MID[i]!;
      const [r1, y1] = BRIM_MID[i + 1]!;
      return y0 + (y1 - y0) * Math.min(1, Math.max(0, (r - r0) / (r1 - r0)));
    };
    const brimWave = (x: number, z: number) => Math.sin(Math.atan2(z, x) * 3 - 0.6) * Math.min(1, Math.max(0, (Math.hypot(x, z) - 0.2) / 0.15));
    const hatPose = (s: sdf.Shape) => s.rotateX(-18).rotateZ(-10).at(...HAT_AT);
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.0, 0.012],
            [0.2, 0.006],
            [0.27, -0.008],
            [0.32, -0.03],
            [0.35, -0.058],
            [0.364, -0.052],
            [0.357, -0.036],
            [0.32, -0.013],
            [0.26, 0.014],
            [0.2, 0.026],
            [0.0, 0.03],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .displace(0.02, (x, y, z) => brimWave(x, z) * Math.tanh((y - brimMid(Math.hypot(x, z))) / 0.004), 2);
    const crownCone = sdf.revolve(
      profile.polygon(
        [
          [0, -0.02],
          [0.215, -0.02],
          [0.2, 0.04],
          [0.172, 0.1],
          [0.14, 0.16],
          [0.108, 0.212],
          [0.085, 0.245],
          [0, 0.25],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const point = sdf.chain(
      [
        [0.0, 0.215, 0, 0.095],
        [-0.005, 0.255, 0, 0.072],
        [-0.018, 0.295, 0, 0.053],
        [-0.055, 0.33, 0, 0.038],
        [-0.108, 0.35, 0, 0.026],
        [-0.16, 0.345, 0, 0.017],
        [-0.2, 0.325, 0, 0.011],
        [-0.225, 0.302, 0, 0.007],
      ],
      0.02,
    );
    const hatInner = sdf.ellipsoid([0.212, 0.2, 0.2]).at(0, -0.06, 0.01);
    const crown = sdf.smoothUnion(0.03, crownCone, point);
    const patchAt = sdf.surfacePoint(crown, [0.06, 0.2, 0.3], 0);
    const hatLit = rgb(C.hatLit);
    const hatDark = rgb(C.hatInside);
    const hatLocal = sdf
      .smoothUnion(0.03, brim.bone('hatroot'), crownCone.bone('hatroot'), point.bone('hattip'))
      .subtract(hatInner)
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, z);
        if (r < 0.4 && y < brimMid(r) - 0.016 * brimWave(x, z)) return hatDark;
        return noise.fbm(x * 14, y * 9, z * 14, 2) > 0.28 ? hatLit : base;
      })
      .paintWhere(sdf.ellipsoid([0.03, 0.034, 0.03]).at(...patchAt), C.patch);
    k.body('hat', hatPose(hatLocal), { color: C.hat, roughness: 0.9, detail: 0.007 });
    // The band: a thin raised ring of the crown; the buckle is a gold frame on the front.
    const BAND_Y = 0.062;
    const band = crownCone.round(0.008).smoothIntersect(0.006, sdf.box([1, 0.052, 1]).at(0, BAND_Y, 0));
    k.body('band', hatPose(band), { color: T.band, roughness: 0.7, bone: 'hatroot' });
    const crownZ = sdf.raycast(crownCone, [0, BAND_Y, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.06, 0.056, 0.014], 0.004).subtract(sdf.box([0.036, 0.03, 0.05])),
        sdf.box([0.007, 0.032, 0.012], 0.002),
      )
      .rotateX(-14)
      .at(0, BAND_Y, crownZ + 0.012);
    k.body('buckle', hatPose(buckle), { color: C.gold, roughness: 0.32, metalness: 0.9, detail: 0.003, bone: 'hatroot' });

    // ------------------------------------------------------------------ wild hair
    // A cap, a ragged fringe over the brows, and thick S-waved locks that fall behind the ears, over
    // the shoulders, and down the back. Hair may fill the crown's cavity, never poke through the hat.
    const underBrim = sdf.revolve(
      profile.polygon([
        [0, -0.6],
        [0.6, -0.6],
        [0.6, -0.1],
        [0.36, -0.1],
        [0.32, -0.07],
        [0.27, -0.038],
        [0.2, -0.014],
        [0, -0.006],
      ]),
    );
    const underHat = hatPose(hatInner.round(-0.004).union(underBrim));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.012, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.006, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.15, 0.22]).rotateZ(-10).at(-0.015, 0.625, 0.15));
        const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const sideLocks = pair(
      sdf.union(
        // behind the ear, over the shoulder
        lock([
          [0.15, 0.72, -0.04, 0.05],
          [0.2, 0.62, -0.065, 0.04],
          [0.222, 0.52, -0.05, 0.034],
          [0.205, 0.45, -0.045, 0.024],
          [0.225, 0.395, -0.035, 0.012],
        ]),
        // in front of the ear, curling out
        lock([
          [0.16, 0.73, 0.09, 0.045],
          [0.215, 0.63, 0.06, 0.036],
          [0.24, 0.54, 0.055, 0.028],
          [0.222, 0.475, 0.065, 0.02],
          [0.245, 0.43, 0.07, 0.01],
        ]),
        // down the back, S-waved
        lock([
          [0.1, 0.73, -0.14, 0.055],
          [0.15, 0.62, -0.16, 0.046],
          [0.11, 0.52, -0.17, 0.04],
          [0.145, 0.44, -0.16, 0.03],
          [0.1, 0.375, -0.14, 0.015],
        ]),
        lock([
          [0.05, 0.71, -0.17, 0.05],
          [0.085, 0.6, -0.2, 0.045],
          [0.045, 0.5, -0.2, 0.038],
          [0.085, 0.42, -0.175, 0.024],
          [0.055, 0.365, -0.15, 0.012],
        ]),
      ),
    );
    const backLocks = lock([
      [0, 0.72, -0.16, 0.07],
      [0.03, 0.62, -0.19, 0.06],
      [-0.03, 0.52, -0.19, 0.05],
      [0.02, 0.44, -0.17, 0.035],
      [-0.01, 0.375, -0.15, 0.018],
    ]);
    // A ragged fringe that droops across the forehead and ends just above the brows.
    const bangs = sdf.union(
      lock([
        [0.13, 0.81, 0.14, 0.038],
        [0.08, 0.775, 0.19, 0.032],
        [0.03, 0.75, 0.2, 0.014],
      ]),
      lock([
        [0.05, 0.815, 0.16, 0.038],
        [0.0, 0.775, 0.198, 0.032],
        [-0.055, 0.752, 0.196, 0.014],
      ]),
      lock([
        [-0.04, 0.81, 0.15, 0.036],
        [-0.095, 0.77, 0.184, 0.03],
        [-0.145, 0.735, 0.17, 0.014],
      ]),
      lock([
        [-0.11, 0.79, 0.11, 0.034],
        [-0.16, 0.75, 0.14, 0.028],
        [-0.185, 0.7, 0.13, 0.013],
      ]),
      lock([
        [0.15, 0.79, 0.12, 0.034],
        [0.176, 0.745, 0.145, 0.026],
        [0.172, 0.7, 0.14, 0.012],
      ]),
    );
    // Two thick curly locks at the brow, under the brim, curling outward.
    const curls = pair(
      sdf.union(
        lock([
          [0.05, 0.75, 0.2, 0.02],
          [0.095, 0.742, 0.204, 0.02],
          [0.135, 0.728, 0.194, 0.017],
          [0.158, 0.708, 0.184, 0.012],
          [0.16, 0.692, 0.18, 0.008],
        ]),
        lock([
          [0.12, 0.735, 0.176, 0.02],
          [0.165, 0.715, 0.165, 0.018],
          [0.19, 0.692, 0.15, 0.013],
        ]),
      ),
    );
    const hairLit = rgb(T.hairLit);
    const hairDark = rgb(T.hairDark);
    const hair = sdf
      .smoothUnion(0.025, cap, sideLocks, backLocks, bangs, curls)
      .intersect(underHat)
      .subtract(hatPose(brim).round(0.006))
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 18, y * 9, z * 18, 2);
        return n > 0.25 ? hairLit : n < -0.3 || y < 0.42 ? hairDark : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.7, detail: 0.0045, bone: 'head' });

    // ------------------------------------------------------------------ ragged dress
    const HEM = 0.155;
    const robeShape = sdf
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
            [0.155, 0.215],
            [0.172, 0.19],
            [0.178, 0.165],
            [0.17, HEM],
            [0, HEM],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // The torn hem: twelve diamond notches of different depth around the edge.
    const notches = sdf.union(
      ...Array.from({ length: 12 }, (_, i) => {
        const az = -165 + i * 30;
        const d = 0.024 + 0.022 * noise.random(i, 1, 2);
        const R = 0.182;
        return sdf
          .box([d * 1.414, d * 1.414, 0.14])
          .rotateZ(45)
          .rotateY(az)
          .at(R * Math.sin(az * rad), HEM, 0.8 * R * Math.cos(az * rad));
      }),
    );
    const dressLit = rgb(T.dressLit);
    const PATCHES: [number, number][] = [
      [-0.07, 0.335],
      [0.065, 0.3],
      [-0.01, 0.235],
    ];
    const patches = sdf.union(
      ...PATCHES.map(([x, y]) => {
        const p = sdf.surfacePoint(robeShape, [x, y, 0.3], 0);
        return sdf.sphere(0.02).at(...p);
      }),
    );
    const robe = robeShape
      .subtract(notches)
      .paintFn((x, y, z, base) => (noise.fbm(x * 12, y * 9, z * 12, 2) > 0.22 ? dressLit : base))
      .paintWhere(patches, C.patch);
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    k.body('dress', sdf.union(above(robe, 0.25).bone('spine'), below(robe, 0.25).bone('skirt')), { color: T.dress, roughness: 0.9, detail: 0.007 });

    // Hanging strips of rag from the hem, across the front and sides.
    const strips = sdf.union(
      ...[-90, -60, -30, 0, 30, 60, 90].map((az, i) => {
        const sx = Math.sin(az * rad);
        const cz = Math.cos(az * rad);
        const at = (R: number, y: number, r: number, w: number): [number, number, number, number] => [
          (R + w * 0.008) * sx + w * 0.006 * cz,
          y,
          0.8 * (R + w * 0.008) * cz - w * 0.006 * sx,
          r,
        ];
        const len = 0.058 + 0.02 * noise.random(i, 4, 1);
        return sdf.chain([at(0.168, HEM + 0.012, 0.01, 0), at(0.175, HEM - len * 0.35, 0.009, 1), at(0.178, HEM - len * 0.7, 0.008, -1), at(0.18, HEM - len, 0.0055, 1)], 0.01);
      }),
    );
    k.body('strips', strips.bone('skirt'), { color: C.strip, roughness: 0.95, detail: 0.004 });

    // Brown legs show under the short dress, over the shoe tops.
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('legs', legs, { color: C.legs, roughness: 0.9 });

    // ------------------------------------------------------------------ shawl
    // A padded green mantle over the shoulders with a pointed collar on the chest; a hole for the neck.
    const mantle = sdf.ellipsoid([0.2, 0.06, 0.135]).at(0, 0.395, -0.005);
    const collar = sdf.extrude(profile.polygon([[-0.105, 0.435], [0.105, 0.435], [0, 0.275]]), 0.035, 0.008).at(0, 0, 0.098);
    const shawlLit = rgb(C.shawlLit);
    const shawl = sdf
      .smoothUnion(0.02, mantle, collar)
      .subtract(sdf.cylinder(0.05, 0.4).at(0, 0.5, -0.01))
      .paintFn((x, y, z, base) => (noise.fbm(x * 9, y * 9, z * 9, 2) > 0.25 ? shawlLit : base));
    k.body('shawl', shawl, { color: C.shawl, roughness: 0.92, bone: 'chest' });

    // ------------------------------------------------------------------ loose sleeves
    // A ragged cuff: four V notches cut into the sleeve's wrist edge.
    const cuffNotches = (e: V3, w: V3) => {
      const a = norm(sub(w, e));
      const u = norm([a[1] * 0 - a[2] * 1 + 0, a[2] * 0 - a[0] * 0, a[0] * 1 - a[1] * 0]); // a x Y-ish
      const uu = norm([-a[2], 0, a[0]]);
      const vv = norm([a[1] * uu[2] - a[2] * uu[1], a[2] * uu[0] - a[0] * uu[2], a[0] * uu[1] - a[1] * uu[0]]);
      void u;
      const E = lerp(e, w, 0.95);
      return sdf.union(
        ...[20, 110, 200, 290].map((deg, i) => {
          const c = Math.cos(deg * rad);
          const sn = Math.sin(deg * rad);
          const rim: V3 = [E[0] + (uu[0] * c + vv[0] * sn) * 0.068, E[1] + (uu[1] * c + vv[1] * sn) * 0.068, E[2] + (uu[2] * c + vv[2] * sn) * 0.068];
          const d = 0.03 + 0.012 * noise.random(i, 7, 8);
          return sdf.cone(add(rim, [a[0] * 0.01, a[1] * 0.01, a[2] * 0.01]), sub(rim, [a[0] * d, a[1] * d, a[2] * d]), 0.026, 0.002);
        }),
      );
    };
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.05, 0.05).bone(tagU),
        sdf.cone(e, lerp(e, w, 0.95), 0.05, 0.07).subtract(cuffNotches(e, w)).bone(tagF),
      );
    const sleeves = sdf.union(
      sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'),
      sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'),
    );
    k.body('sleeves', sleeves.paintFn((x, y, z, base) => (noise.fbm(x * 12, y * 12, z * 12, 2) > 0.22 ? dressLit : base)), { color: T.dress, roughness: 0.9, detail: 0.007 });

    // ------------------------------------------------------------------ pointed shoes with curled toes
    const shoeFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toe = sdf.chain(
      [
        [0, 0.05, 0.1, 0.04],
        [0, 0.054, 0.155, 0.032],
        [0, 0.07, 0.198, 0.021],
        [0, 0.096, 0.225, 0.012],
      ],
      0.02,
    );
    const shoe = sdf
      .union(sdf.smoothUnion(0.02, shoeFoot, toe), sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ the broom
    // Built along +Y with the grip at the origin: a crooked stick, a cord, and a bristle bundle on top.
    const stick = sdf.chain(
      [
        [0, -0.33, 0, 0.011],
        [0.008, -0.2, 0.004, 0.0135],
        [-0.006, -0.06, -0.004, 0.0145],
        [0.004, 0.06, 0.006, 0.0135],
        [0.0, 0.17, 0.0, 0.0125],
      ],
      0.01,
    );
    const BR_Y = 0.17;
    const bristles = sdf.smoothUnion(
      0.012,
      sdf.cone([0, BR_Y - 0.01, 0], [0, BR_Y + 0.11, 0], 0.02, 0.04),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 360 + (i % 2) * 15;
        const spread = 0.038 + 0.016 * noise.random(i, 2, 3);
        const len = 0.16 + 0.03 * noise.random(i, 5, 6);
        const p = rotY([spread, 0, 0], a);
        return sdf.cone([p[0] * 0.3, BR_Y, p[2] * 0.3], [p[0], BR_Y + len, p[2]], 0.014, 0.0065);
      }),
    );
    const cord = sdf.torus(0.02, 0.0075).at(0, BR_Y - 0.003, 0);
    const woodDark = rgb(C.stickDark);
    k.body(
      'broom',
      broomPose(stick).paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 14, z * 90, 2) > 0.25 ? woodDark : base)),
      { color: C.stick, roughness: 0.8, detail: 0.004, bone: 'hand.R', bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 12, z * 90, 2) },
    );
    const bristleDark = rgb(C.bristleDark);
    k.body(
      'bristles',
      broomPose(bristles).paintFn((x, y, z, base) => (noise.fbm(x * 70, y * 40, z * 70, 2) > 0.1 ? bristleDark : base)),
      { color: C.bristle, roughness: 0.9, detail: 0.0035, bone: 'hand.R', bump: (x, y, z) => 0.002 * noise.fbm(x * 60, y * 200, z * 60, 2) },
    );
    k.body('cord', broomPose(cord), { color: C.cord, roughness: 0.85, detail: 0.003, bone: 'hand.R' });

    // ------------------------------------------------------------------ the potion bottle
    // A round glass flask with a neck and a cork on the palm; a bright liquid core and a few bubbles.
    const bottleShape = (r: number) =>
      sdf.smoothUnion(
        0.012,
        sdf.sphere(r),
        sdf.cylinder(0.0145 * (r / 0.05), 0.05).at(0, r + 0.005, 0),
        sdf.torus(0.0165 * (r / 0.05), 0.005).at(0, r + 0.03, 0),
      );
    const bubbleStencil = [
      [0.03, 0.028, 0.02, 0.011],
      [-0.028, 0.02, 0.028, 0.009],
      [0.01, 0.036, -0.03, 0.008],
    ] as const;
    const bubbles = sdf.union(...bubbleStencil.map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)));
    const glass = sdf.smoothUnion(0.008, bottleShape(0.05), bubbles);
    k.body('potion', glass.at(...BOTTLE_AT), {
      color: C.potion,
      roughness: 0.15,
      emissive: C.potionGlow,
      emissiveIntensity: 1.2,
      opacity: 0.85,
      detail: 0.0035,
      bone: 'hand.L',
    });
    k.body('liquid', sdf.sphere(0.037).at(0, -0.003, 0).at(...BOTTLE_AT), {
      color: C.potionCore,
      roughness: 0.3,
      emissive: C.potionCore,
      emissiveIntensity: 1.2,
      detail: 0.0035,
      bone: 'hand.L',
    });
    k.body('cork', sdf.cylinder(0.0155, 0.02, 0.004).at(BOTTLE_AT[0], BOTTLE_AT[1] + 0.05 + 0.06, BOTTLE_AT[2]), {
      color: C.cork,
      roughness: 0.85,
      detail: 0.003,
      bone: 'hand.L',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        hattip: { rotate: [4 * wave(p, 1, 0.4), 0, -6 * wave(p, 1, 0.35)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        // The potion hand lifts a little, as if weighing the bottle.
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // Both hands are busy, so the arms swing little; the hat tip and the ragged skirt carry the motion.
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

    // Posing by targets. The wrists follow keys in the chest's rest frame (reach); the broom hand
    // turns so the broom points along its own keys (orient); `up` rolls it about its length.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const WAND = { dir: norm(WAND_AXIS), up: [0, 0, 1] as V3 };
    const PALM = { dir: rotY([1, 0, 0], HAND_L_YAW), up: [0, 1, 0] as V3 };
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

    // attack: a broom swing with a potion toss. The broom goes back and up beside him (out past the
    // brim), holds, then swings forward and down, bristles first; the potion hand thrusts forward.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.28, [-0.26, 0.4, -0.02]],
            [0.4, [-0.265, 0.405, -0.03]],
            [0.5, [-0.21, 0.385, 0.14]],
            [0.56, [-0.235, 0.305, 0.175]],
            [0.7, [-0.24, 0.305, 0.17]],
            [0.85, [-0.22, 0.35, 0.11]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, WAND_AXIS],
            [0.28, norm([-0.55, 0.8, -0.35])],
            [0.4, norm([-0.56, 0.78, -0.4])],
            [0.5, norm([-0.2, 0.3, 0.93])],
            [0.56, norm([-0.2, -0.1, 0.97])],
            [0.7, norm([-0.2, -0.12, 0.96])],
            [0.85, norm([-0.2, 0.6, 0.7])],
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
        const toss = ease(0.42, 0.6, p) * (1 - ease(0.66, 0.92, p));
        return {
          ...wandPose(wrist, dir, up),
          ...palmPose(
            keys(p, [[0, WRIST_L], [0.3, [0.25, 0.335, 0.04]], [0.5, [0.25, 0.36, 0.1]], [0.6, [0.27, 0.36, 0.21]], [0.85, [0.25, 0.37, 0.1]], [1, WRIST_L]] as const),
            lerp(PALM.dir, norm([0.8, 0.2, 0.55]), toss),
            PALM.up,
          ),
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

    // hit: the head and chest snap back, a small step back, the broom tips out, the potion sloshes.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        return {
          ...wandPose(lerp(WRIST_R, [-0.26, 0.36, 0.05], h), lerp(WAND_AXIS, norm([-0.45, 0.88, -0.08]), h)),
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

    // death: a stagger, then she falls flat on her back; the broom drops across the floor at her
    // right side, and the hat lifts off, tumbles out to her left, and settles on its brim. The hips
    // drop below the floor on purpose: the build lifts the body until it rests on the floor.
    const NECK_CHAIN: V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0], [0, 0.43, -0.01], [0, 0.48, -0.01]];
    const HAT_FLOOR: V3 = [0.58, -0.033, -0.62];
    const HAT_REST = quat([0, 0, -10]).multiply(quat([-18, 0, 0]));
    const HAT_DOWN = quat([0, 0, -6]).multiply(quat([0, 70, 0]));
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const tip = ease(0.4, 0.8, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        const lean = bend.reduce((a, b) => a + b, 0);
        const onHead = (pt: V3) =>
          follow(NECK_CHAIN.map((j) => add(j, hipsMove)), bend.map((a) => [a, 0, 0] as V3), add(pt, hipsMove));
        const off = ease(0.28, 0.46, p);
        const fly = ease(0.36, 0.8, p);
        const turn = ease(0.36, 0.66, p);
        const worn = onHead(HAT_AT);
        const lifted = onHead([HAT_AT[0] + 0.03 * off, HAT_AT[1] + 0.1 * off, HAT_AT[2]]);
        const hatAt = add(lerp(lifted, HAT_FLOOR, fly), [0, 0.14 * Math.sin(Math.PI * fly), 0]);
        const hatTurn = quat([lean, 0, 0]).multiply(HAT_REST).slerp(HAT_DOWN, turn);
        return {
          ...wandPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.34, 0.1]], [0.66, [-0.26, 0.34, -0.09]]] as const),
            keys(p, [[0, WAND_AXIS], [0.3, norm([-0.3, 0.75, 0.6])], [0.45, norm([-0.45, 0.85, 0.4])], [0.66, norm([-0.3, 1, 0.05])]] as const),
            keys(p, [[0, [0, 0, 1]], [0.3, [0, 0.5, 0.8]], [0.66, [0, 0, 1]]] as const),
            [-0.3, 0.2, -0.4],
          ),
          ...palmPose(lerp(WRIST_L, [0.26, 0.34, -0.09], ease(0.2, 0.66, p)), PALM.dir, lerp(PALM.up, [0, 0.3, 1], ease(0.2, 0.62, p)), [0.3, 0.2, -0.4]),
          hatroot: {
            rotate: euler(quat([-lean, 0, 0]).multiply(hatTurn).multiply(HAT_REST.clone().invert())),
            move: follow([[0, 0, 0]], [[-lean, 0, 0]], sub(hatAt, worn)),
          },
          hattip: { rotate: [-10 * tip + 12 * land, 0, -10 * tip] },
          hips: { move: hipsMove, rotate: [bend[0]!, 0, 0] },
          skirt: { rotate: [8 * stagger + leg - 20 * fall, 0, 0] },
          spine: { rotate: [bend[1]!, 0, 0] },
          chest: { rotate: [bend[2]!, 0, 0] },
          neck: { rotate: [bend[3]!, 0, 0] },
          head: { rotate: [bend[4]!, 0, 0] },
          'leg.L': { rotate: [6 * stagger + leg, 0, 4 * fall] },
          'leg.R': { rotate: [-6 * stagger + leg + 2 * fall, 0, -5 * fall] },
          'foot.L': { rotate: [-14 * fall, 0, 0] },
          'foot.R': { rotate: [-18 * fall, 0, 0] },
        };
      },
    });

    // taunt: a cackle hop. An anticipation crouch, a hop of about 8 cm, a landing the knees absorb;
    // she holds the broom up beside her (clear of the hat tip), throws her head back, and shakes
    // the broom and the potion while she laughs.
    const V_JUMP = 0.08;
    const V_DROP = 0.04;
    const [V_OFF, V_LAND] = [0.28, 0.48];
    const LEGS = { hip: HIP, knee: KNEE, ankle: ANKLE };
    k.animation('taunt', {
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
        const cackle = ease(0.5, 0.58, p) * (1 - ease(0.88, 0.98, p));
        const shake = wave(p, 6) * cackle;
        const wandWrist = add(lerp(WRIST_R, [-0.27, 0.43, 0.09], up), [0, 0.02 * pump + 0.035 * bend, 0]);
        const wandDir = norm([-0.35 * up - 0.2 * (1 - up) + 0.25 * shake, 0.93, 0.1 + 0.2 * (1 - up) + 0.1 * shake]);
        const bookWrist = keys(p, [[0, WRIST_L], [0.16, [0.25, 0.36, 0.1]], [0.4, [0.24, 0.375, 0.12]]] as const);
        return {
          ...wandPose(wandWrist, wandDir),
          ...palmPose(add(bookWrist, [0, 0.02 * pump + 0.012 * shake, 0]), PALM.dir, PALM.up),
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump + 3 * shake, 5 * up, 0] },
          head: { rotate: [-4 * bend - 12 * up - 5 * cackle, 6 * up + 6 * shake, 4 * up] },
          hattip: { rotate: [8 * bend - 14 * air + 6 * pump, 0, -8 * pump + 10 * shake] },
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
