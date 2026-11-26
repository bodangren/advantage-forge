import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Wizard (Argon trial) — Chibi Quest hero (catalog `heroes/magic/wizard`), about 1.05 m to the
 * hat arch, stands on y = 0, faces +Z. Target: docs/hero-mockups/wizard_001.png.
 *
 * Role: player hero character, seen in 3D and as a 128 px sprite, where the big floppy witch hat,
 *   beaming face, and twin flames (staff orb + palm flame) must read immediately.
 * One idea: an oversized, floppy red witch hat with a gold flame badge over a delighted chibi
 *   face, wielding a gnarled forked fire-orb staff in her right hand and a live flame in her
 *   open left palm.
 * Shape language: round and soft (drooping brim, chubby cheeks, bell robe, chunky boots) paired
 *   with curling flame and hat-tip tapers.
 * Palette (60/30/10): crimson cloth #b8322b (hat, robe, cape, sleeves); dark charcoal tunic
 *   #3a3034 and warm brown leather #74462a / #6a3d22 wood; gold #e2b04a trims and bright
 *   yellow-orange fire (#ffc629 / #e8401a) as focal accents. Skin #f2c7a4, hair #6b3a22.
 * Materials: skin, hair, hat, hat-band, robe, tunic, cape, sleeves, leather, gold, boots,
 *   staff, fire, palm-fire.
 * Rig: chibi humanoid skeleton plus `skirt`, `cloak`, `hatroot`, `hattip`, `orb`, and `palmfire`.
 *   Clips: idle, walk, run, attack, hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  freckle: '#cf8a66',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#5a3422',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#6b3a22',
  red: '#b8322b',
  redDark: '#7e1f1c',
  hatInside: '#5a1a17',
  tunic: '#3a3034',
  ember: '#e0762a',
  leather: '#74462a',
  leatherDark: '#4e2d1b',
  gold: '#e2b04a',
  gem: '#c0222a',
  boot: '#6e3f22',
  sole: '#42281a',
  wood: '#6a3d22',
  woodDark: '#4a2a17',
  fire: '#e8401a',
  fireCore: '#ffc629',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. The right hand grips the gnarled staff; the left hand is open, palm up, carrying a flame.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.198, 0.36, -0.004];
const WRIST_R: V3 = [-0.24, 0.35, 0.085];
const ELBOW_L: V3 = [0.198, 0.355, 0.012];
const WRIST_L: V3 = [0.258, 0.35, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
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

/** Closed fist around a grip axis along Z in wrist-local space. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.007 * s, -0.038, 0.004),
    sdf.capsule([-0.009 * s, -0.058, 0.03], [-0.005 * s, -0.038, 0.042], 0.017),
    sdf.cone([0.02 * s, -0.023, 0.025], [0.001 * s, -0.033, 0.048], 0.016, 0.013),
  );

const HAND_R = { pitch: -78, roll: 19 };
const handR = (s: sdf.Shape) => s.rotateX(HAND_R.pitch).rotateZ(HAND_R.roll).at(...WRIST_R);
const handRPoint = (p: V3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const STAFF_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const STAFF_OUT = rotZ(rotX([1, 0, 0], HAND_R.pitch), HAND_R.roll);
const STAFF_FWD = rotZ(rotX([0, -1, 0], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.007, -0.04, 0.004]);
const L_UP = (0.785 - GRIP[1]) / STAFF_AXIS[1];
const along = (t: number, out = 0, fwd = 0): V3 =>
  add(add(GRIP, scale(STAFF_AXIS, t)), add(scale(STAFF_OUT, out), scale(STAFF_FWD, fwd)));
const STAFF_TOP = along(L_UP);
const ORB: V3 = add(STAFF_TOP, [-0.012, 0.085, 0.004]);
const HAT_AT: V3 = [0, 0.735, -0.012];

/** Open left hand, palm up, extending along +X from the wrist origin. */
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
const PALM_FLAME: V3 = add(WRIST_L, rotY([0.05, 0.05, 0.004], HAND_L_YAW));

/** Multi-tongue stylized flame of height `h` rising from the origin. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.31).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.34, 0, h * 0.28],
        [h * 0.05, h * 0.68, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.38, 0, h * 0.13],
        [h * 0.29, h * 0.65, 0, h * 0.07],
        [h * 0.25, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.35, 0, h * 0.12],
        [-h * 0.29, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.28, h * 0.77, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );

const firePaint = (base: V3, h: number) => {
  const fireCore = rgb(C.fireCore);
  const fireOuter = rgb(C.fire);
  return (x: number, y: number, z: number) => {
    const t = Math.min(1, Math.max(0, (y - base[1]) / h));
    const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
    const k = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
    return [
      fireCore[0] + (fireOuter[0] - fireCore[0]) * k,
      fireCore[1] + (fireOuter[1] - fireCore[1]) * k,
      fireCore[2] + (fireOuter[2] - fireCore[2]) * k,
    ] as const;
  };
};

export default defineAsset({
  name: 'wizard-argon-trial',
  description: 'Chibi wizard hero with a floppy red witch hat, a gnarled fire-orb staff, and a flame in her palm.',
  detail: 0.005,
  reference: 'docs/hero-mockups/wizard_001.png',
  variants: {
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    hair: { brown: C.hair, black: '#231a17', silver: '#b9b4ae' },
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { red: C.red, blue: '#2e4a9e', purple: '#6b3294' },
  },
  presets: {
    frost: { skin: 'fair', hair: 'silver', eyes: 'blue', cloth: 'blue' },
    mystic: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'purple' },
    sage: { skin: 'brown', hair: 'silver', eyes: 'brown', cloth: 'purple' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      freckle: k.tint('skin', { color: C.freckle, follow: 1 }),
      cloth: k.tint('cloth'),
      clothDark: k.tint('cloth', { color: C.redDark, follow: 1 }),
      hatInside: k.tint('cloth', { color: C.hatInside, follow: 1 }),
    };

    // ------------------------------------------------------------------ skeleton
    const HAT_TIP_AT: V3 = [0.03, 0.95, -0.03];
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.25, 0], tail: [0, 0.1, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hatroot: { parent: 'head', at: HAT_AT },
      hattip: { parent: 'hatroot', at: HAT_TIP_AT, tail: [0.28, 0.92, -0.08] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      palmfire: { parent: 'hand.L', at: PALM_FLAME },
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
    const nose = sdf.ellipsoid([0.018, 0.014, 0.014]).at(0, 0.568, faceZ(0, 0.568) - 0.004).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
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
      handL(openHand).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = pair(at(sdf.ellipsoid([0.026, 0.015, 0.07]), EYE[0], EYE[1] - 0.024));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(
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
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.09, 0.018, 55, 125), 0.3).at(0.1, 0.728 - 0.09, 0.1));
    const mouthShape = sdf.extrude(
      profile.polygon(
        [
          [-0.044, 0.0],
          [0.044, 0.0],
          [0.034, -0.02],
          [0.016, -0.032],
          [0, -0.035],
          [-0.016, -0.032],
          [-0.034, -0.02],
        ],
        { smooth: true, samples: 5 },
      ),
      0.3,
    );
    const MOUTH: V3 = [0, 0.548, 0.1];
    const mouth = mouthShape.at(...MOUTH);
    const inner = mouth.round(-0.005);
    const teeth = inner.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH[1] - 0.012)));
    const tongue = inner.intersect(sdf.sphere(0.024).at(0, MOUTH[1] - 0.038, 0.2).elongate(0.01, 0, 0.3));
    const blush = pair(at(sdf.sphere(0.034), 0.138, 0.562));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.12, 0.58],
            [0.142, 0.586],
            [0.158, 0.572],
            [0.134, 0.566],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.0055), x, y)),
      ),
    );
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(freckles, T.freckle, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.006)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue, C.tongue, 0.004)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the witch hat (built in-file)
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
      return y0 + ((y1 - y0) * Math.min(1, Math.max(0, (r - r0) / (r1 - r0))));
    };
    const brimWave = (x: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 4 - 1.3) * Math.min(1, Math.max(0, (Math.hypot(x, z) - 0.2) / 0.15));
    const hatPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(-10).at(...HAT_AT);
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
      .displace(0.016, (x, y, z) => brimWave(x, z) * Math.tanh((y - brimMid(Math.hypot(x, z))) / 0.004), 2);

    const hatInner = sdf.ellipsoid([0.212, 0.2, 0.2]).at(0, -0.06, 0.01);

    // Crown base and upper bent tip in hat-local coordinates (rotated by hatPose into world).
    const crownBase = sdf
      .chain(
        [
          [0, 0.01, 0, 0.2],
          [0.002, 0.095, -0.004, 0.168],
          [0.012, 0.19, -0.01, 0.124],
        ],
        0.025,
      )
      .scale([1, 1, 0.96])
      .bone('hatroot');

    const crownTip = sdf
      .chain(
        [
          [0.012, 0.19, -0.01, 0.122],
          [0.042, 0.268, -0.018, 0.088],
          [0.115, 0.262, -0.025, 0.058],
          [0.185, 0.205, -0.028, 0.038],
          [0.23, 0.172, -0.024, 0.024],
          [0.268, 0.198, -0.018, 0.015],
        ],
        0.03,
      )
      .bone('hattip');

    // Gold ember sparks scattered across the hat crown and upper brim edge.
    const sparkCoords: V3[] = [
      [-0.08, 0.14, 0.145],
      [-0.12, 0.2, 0.08],
      [-0.02, 0.24, 0.105],
      [0.06, 0.22, 0.09],
      [0.14, 0.24, 0.02],
      [-0.18, 0.015, 0.21],
      [-0.08, 0.012, 0.275],
      [0.04, 0.004, 0.295],
      [0.15, -0.004, 0.255],
      [0.24, -0.012, 0.18],
      [-0.05, 0.18, -0.14],
      [0.05, 0.13, -0.155],
      [-0.14, 0.1, -0.12],
      [0.14, 0.014, -0.24],
    ];
    const hatSparks = sdf.union(...sparkCoords.map((p) => sdf.sphere(0.0085).at(...p)));
    const darkUnderside = rgb(T.hatInside);

    const hatShape = hatPose(
      sdf
        .smoothUnion(0.018, brim.bone('hatroot'), crownBase, crownTip)
        .smoothSubtract(0.01, hatInner.at(0, -0.015, 0))
        .paintWhere(hatSparks, C.gold)
        .paintFn((x, y, z, base) => {
          const r = Math.hypot(x, z);
          const mid = brimMid(r) - 0.016 * brimWave(x, z);
          return r > 0.175 && r < 0.348 && y < mid - 0.001 ? darkUnderside : base;
        }),
    );
    k.body('hat', hatShape, { color: T.cloth, roughness: 0.78 });

    // Leather hat-band hugging the base of the crown.
    const bandSlice = sdf
      .box([0.5, 0.054, 0.5], 0.006)
      .rotateX(3)
      .at(0, 0.048, 0);
    const hatBandLocal = crownBase
      .round(0.009)
      .smoothIntersect(0.005, bandSlice)
      .paintFn((_x, y, _z, base) => (Math.abs(y - 0.048) > 0.018 ? rgb(C.leatherDark) : base));
    k.body('hat-band', hatPose(hatBandLocal), { color: C.leather, roughness: 0.62, bone: 'hatroot' });

    // Gold flame brooch with a glowing red teardrop gem on the front-left of the hat band.
    const broochProfile = profile.polygon(
      [
        [0, -0.04],
        [0.032, -0.024],
        [0.038, 0.005],
        [0.022, 0.035],
        [0.029, 0.058],
        [0.007, 0.046],
        [-0.005, 0.08],
        [-0.025, 0.044],
        [-0.016, 0.024],
        [-0.036, 0.006],
        [-0.032, -0.024],
      ],
      { smooth: true, samples: 5 },
    );
    const broochFrame = sdf.extrude(broochProfile, 0.018, 0.005);
    const broochGem = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(0.019).at(0, -0.009, 0.009),
        sdf.cone([0, -0.009, 0.009], [-0.002, 0.025, 0.009], 0.018, 0.005),
      )
      .scale([1, 1, 0.65])
      .paint(C.gem);
    const hatBrooch = hatPose(
      sdf
        .union(broochFrame, broochGem)
        .rotateX(-18)
        .rotateY(22)
        .rotateZ(-8)
        .at(0.074, 0.068, 0.18)
        .bone('hatroot'),
    );

    // ------------------------------------------------------------------ hair
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
    const waves = (x: number, y: number, z: number) => Math.sin(y * 70 + Math.atan2(z, x) * 3);
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const sideLocks = pair(
      sdf.union(
        lock([
          [0.17, 0.72, 0.06, 0.05],
          [0.2, 0.62, 0.05, 0.048],
          [0.2, 0.53, 0.04, 0.042],
          [0.215, 0.47, 0.02, 0.03],
          [0.24, 0.44, 0.0, 0.016],
        ]),
        lock([
          [0.12, 0.74, -0.14, 0.07],
          [0.17, 0.62, -0.12, 0.06],
          [0.18, 0.52, -0.1, 0.05],
          [0.2, 0.45, -0.08, 0.03],
        ]),
      ),
    );
    const backLocks = sdf.union(
      lock([
        [0, 0.72, -0.16, 0.09],
        [0, 0.6, -0.17, 0.08],
        [0.01, 0.5, -0.14, 0.06],
        [0.0, 0.45, -0.12, 0.03],
      ]),
    );
    const bangs = sdf.union(
      lock([
        [0.11, 0.81, 0.15, 0.036],
        [0.06, 0.77, 0.19, 0.03],
        [0.01, 0.75, 0.2, 0.012],
      ]),
      lock([
        [0.03, 0.815, 0.16, 0.036],
        [-0.03, 0.772, 0.195, 0.03],
        [-0.085, 0.748, 0.194, 0.012],
      ]),
      lock([
        [-0.06, 0.81, 0.15, 0.034],
        [-0.115, 0.765, 0.178, 0.028],
        [-0.158, 0.722, 0.16, 0.012],
      ]),
      lock([
        [0.15, 0.79, 0.12, 0.03],
        [0.168, 0.745, 0.142, 0.022],
        [0.165, 0.705, 0.14, 0.01],
      ]),
    );
    const hair = sdf
      .smoothUnion(0.025, cap, sideLocks, backLocks, bangs)
      .displace(0.004, waves)
      .intersect(underHat)
      .subtract(hatPose(brim).round(0.006));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ robe, mantle, tunic, cape
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
            [0.158, 0.19],
            [0.19, 0.13],
            [0.222, 0.096],
            [0.21, 0.084],
            [0, 0.084],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);

    // Shoulder mantle collar draped over the upper chest and shoulders with a clean gold border.
    const mantleFlap = pair(
      sdf
        .ellipsoid([0.088, 0.025, 0.084])
        .rotateZ(-16)
        .at(0.094, 0.422, 0.004)
        .subtract(sdf.cylinder(0.064, 0.2).at(0, 0.46, -0.01)),
    );
    const mantleBorder = hard(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.022, 0.434],
              [0.085, 0.408],
              [0.142, 0.398],
              [0.14, 0.386],
              [0.082, 0.396],
              [0.018, 0.422],
            ],
            { smooth: true, samples: 4 },
          ),
          0.25,
        )
        .at(0, 0, 0.12),
    );

    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.012, 0.26],
          [0.012, 0.26],
          [0.105, 0.06],
          [-0.105, 0.06],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);

    const gold = rgb(C.gold);
    const lapel = hard(
      sdf
        .extrude(
          profile.polygon([
            [0.088, 0.462],
            [0.104, 0.456],
            [0.022, 0.27],
            [0.008, 0.272],
          ]),
          0.4,
        )
        .at(0, 0, 0.2),
    );
    const motif = profile.polygon(
      [
        [0, -0.024],
        [0.018, -0.008],
        [0.016, 0.012],
        [0.004, 0.03],
        [0.003, 0.01],
        [-0.01, 0.02],
        [-0.016, 0.0],
      ],
      { smooth: true, samples: 4 },
    );
    const motifs = hard(sdf.extrude(motif, 0.4).rotateY(20).at(0.135, 0.16, 0.2));
    const robe = sdf
      .smoothUnion(0.008, robeShape, mantleFlap)
      .smoothSubtract(0.006, opening)
      .paintWhere(mantleBorder, C.gold)
      .paintWhere(lapel, C.gold)
      .paintWhere(opening.round(0.026), C.gold)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.118), C.gold)
      .paintWhere(motifs, C.gold, 0.002)
      .paintFn((x, y, z, base) => (Math.abs(y - 0.13) < 0.003 && Math.sin(Math.atan2(z, x) * 60) > 0.2 ? gold : base));

    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    k.body('robe', sdf.union(above(robe, 0.25).bone('spine'), below(robe, 0.25).bone('skirt')), { color: T.cloth, roughness: 0.8 });

    const tunic = robeShape
      .round(-0.012)
      .paintFn((x, y, z, base) => {
        const f = noise.fbm(x * 30, y * 12, z * 30, 2);
        return y < 0.21 - (0.08 * (f + 1)) / 2 && Math.abs(Math.sin(x * 55 + y * 22)) > 0.76 ? rgb(C.ember) : base;
      });
    const tunicParts = sdf.union(above(tunic, 0.25).bone('spine'), below(tunic, 0.25).bone('skirt'));

    // Hood lying on the shoulders at the back, with the cape falling from it.
    const hood = sdf
      .smoothUnion(
        0.03,
        sdf.torus(0.1, 0.035).scale([1.15, 1, 1]).rotateX(-20).at(0, 0.46, -0.05),
        sdf.ellipsoid([0.11, 0.07, 0.05]).rotateX(-25).at(0, 0.44, -0.14),
      )
      .subtract(sdf.cylinder(0.06, 0.2).at(0, 0.48, -0.01));
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.4 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds);
    const capeR = (y: number) => 0.18 + ((0.4 - 0.18) * (0.44 - y)) / (0.44 - 0.07);
    const lining = rgb(T.clothDark);
    const cape = capeCone(0.18, 0.4, 0.44, 0.07)
      .subtract(capeCone(0.158, 0.378, 0.46, 0.05))
      .at(0, 0, -0.03)
      .intersect(sdf.halfSpace([0, 0, 1], 0.03))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.1), C.gold)
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, (z + 0.03) / 0.85);
        return r < capeR(y) - 0.012 * folds(x, y, z + 0.03) - 0.011 && y > 0.1 ? lining : base;
      });
    k.body('cape', sdf.union(cape.bone('cloak'), hood.bone('chest')), { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ sleeves with leather cuffs
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.048, 0.046).bone(tagU),
        sdf.cone(e, lerp(e, w, 0.78), 0.046, 0.054).bone(tagF),
      );
    const cuff = (e: V3, w: V3, tag: string) =>
      sdf
        .cone(lerp(e, w, 0.68), lerp(e, w, 0.92), 0.056, 0.059)
        .round(0.003)
        .bone(tag);
    k.body(
      'sleeves',
      sdf.union(
        sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'),
      ),
      { color: T.cloth, roughness: 0.8 },
    );

    // ------------------------------------------------------------------ belt, pouches, cuffs (leather)
    const beltY = 0.255;
    const belt = robeShape.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.042, 0.5], 0.006).at(0, beltY, 0));
    const pouch = (x: number) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.3], 0);
      return sdf
        .union(
          sdf.box([0.052, 0.058, 0.032], 0.01),
          sdf.box([0.058, 0.025, 0.038], 0.008).at(0, 0.02, 0.002).paint(C.leatherDark),
          sdf.box([0.012, 0.016, 0.01], 0.003).at(0, 0.006, 0.018).paint(C.gold),
        )
        .rotateY((Math.atan2(p[0], p[2]) * 180) / Math.PI)
        .at(p[0], p[1] - 0.022, p[2] + 0.006);
    };
    k.body(
      'leather',
      sdf.union(
        belt.bone('spine'),
        pouch(0.095).bone('spine'),
        pouch(-0.095).bone('spine'),
        cuff(ELBOW_L, WRIST_L, 'forearm.L'),
        cuff(ELBOW_R, WRIST_R, 'forearm.R'),
      ),
      { color: C.leather, roughness: 0.6 },
    );

    // ------------------------------------------------------------------ gold: buckle, collar clasp, hat brooch, boot buckles
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf.cylinder(0.03, 0.012, 0.004).rotateX(90).at(0, beltY, beltZ + 0.003);
    const buckleGem = sdf.sphere(0.018).scale([1, 1, 0.6]).at(0, beltY, beltZ + 0.011);
    const chestZ = sdf.raycast(robeShape, [0, 0.42, 1], [0, 0, -1])![2];
    const clasp = sdf
      .extrude(
        profile.polygon([
          [0, -0.032],
          [0.024, -0.002],
          [0.014, 0.02],
          [0, 0.01],
          [-0.014, 0.02],
          [-0.024, -0.002],
        ]),
        0.016,
        0.004,
      )
      .at(0, 0.42, chestZ + 0.004);
    const claspGem = sdf.sphere(0.011).scale([0.85, 1.15, 0.6]).at(0, 0.418, chestZ + 0.013).paint(C.gem);
    const bootBuckles = pair(
      sdf
        .box([0.032, 0.022, 0.01], 0.003)
        .subtract(sdf.box([0.016, 0.01, 0.03]))
        .rotateY(12)
        .at(0.098 + 0.012, 0.075, 0.052)
        .bone('foot.L'),
    );
    k.body(
      'gold',
      sdf.union(
        buckle.bone('spine'),
        buckleGem.paint(C.gem).bone('spine'),
        clasp.paint(C.gold).bone('chest'),
        claspGem.bone('chest'),
        hatBrooch,
        bootBuckles,
      ),
      { color: C.gold, roughness: 0.32, metalness: 0.9 },
    );

    // ------------------------------------------------------------------ legs and boots
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('tunic', sdf.union(tunicParts, legs), { color: C.tunic, roughness: 0.85 });

    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0).paint(C.leatherDark))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ gnarled staff and fire orb (built in-file)
    const pt = (t: number, out = 0, fwd = 0, r = 0.018): [number, number, number, number] => {
      const p = along(t, out, fwd);
      return [p[0], p[1], p[2], r];
    };
    const staffShaft = sdf.chain(
      [
        pt(-0.315, 0, 0, 0.01),
        pt(-0.285, -0.003, 0.002, 0.02),
        pt(-0.24, 0.002, -0.002, 0.015),
        pt(-0.12, -0.004, 0.003, 0.0165),
        pt(0.0, 0, 0, 0.0175),
        pt(0.16, 0.005, -0.003, 0.0185),
        pt(0.32, -0.006, 0.004, 0.021),
        pt(0.42, 0.004, 0.0, 0.025),
        pt(L_UP, 0, 0, 0.028),
      ],
      0.015,
    );
    // Outer prong (-X side) sweeps wide and up to cradle the left side of the fire orb.
    const forkOuter = sdf.chain(
      [
        [STAFF_TOP[0], STAFF_TOP[1], STAFF_TOP[2], 0.026],
        [STAFF_TOP[0] - 0.044, STAFF_TOP[1] + 0.018, STAFF_TOP[2] + 0.004, 0.022],
        [STAFF_TOP[0] - 0.084, STAFF_TOP[1] + 0.052, STAFF_TOP[2] + 0.006, 0.018],
        [STAFF_TOP[0] - 0.098, STAFF_TOP[1] + 0.096, STAFF_TOP[2] + 0.006, 0.014],
        [STAFF_TOP[0] - 0.086, STAFF_TOP[1] + 0.132, STAFF_TOP[2] + 0.004, 0.008],
      ],
      0.014,
    );
    // Inner prong (+X side relative to STAFF_TOP) curves S-shaped up the right of the orb,
    // staying outside the hat brim radius in XZ.
    const forkInner = sdf.chain(
      [
        [STAFF_TOP[0], STAFF_TOP[1], STAFF_TOP[2], 0.025],
        [STAFF_TOP[0] + 0.026, STAFF_TOP[1] + 0.028, STAFF_TOP[2] + 0.005, 0.02],
        [STAFF_TOP[0] + 0.04, STAFF_TOP[1] + 0.066, STAFF_TOP[2] + 0.006, 0.016],
        [STAFF_TOP[0] + 0.048, STAFF_TOP[1] + 0.106, STAFF_TOP[2] + 0.006, 0.012],
        [STAFF_TOP[0] + 0.04, STAFF_TOP[1] + 0.14, STAFF_TOP[2] + 0.004, 0.008],
      ],
      0.014,
    );
    // Small gnarled side spur and central cradle spur at the fork base.
    const forkSpur = sdf.union(
      sdf.chain(
        [
          [STAFF_TOP[0] - 0.028, STAFF_TOP[1] + 0.014, STAFF_TOP[2] + 0.008, 0.015],
          [STAFF_TOP[0] - 0.052, STAFF_TOP[1] - 0.006, STAFF_TOP[2] + 0.016, 0.01],
        ],
        0.01,
      ),
      sdf.chain(
        [
          [STAFF_TOP[0] - 0.006, STAFF_TOP[1] + 0.008, STAFF_TOP[2] + 0.01, 0.015],
          [STAFF_TOP[0] - 0.012, STAFF_TOP[1] + 0.036, STAFF_TOP[2] + 0.014, 0.01],
        ],
        0.01,
      ),
    );
    const woodDarkRgb = rgb(C.woodDark);
    const staffShape = sdf
      .smoothUnion(0.014, staffShaft, forkOuter, forkInner, forkSpur)
      .paintFn((x, y, z, base) => {
        const g = Math.sin((x + z) * 90 + y * 18);
        return g > 0.45 || y < 0.08 ? woodDarkRgb : base;
      });
    k.body('staff', staffShape, {
      color: C.wood,
      roughness: 0.78,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 32, y * 14, z * 32, 3),
      bone: 'hand.R',
    });

    // Staff fire orb centered above the fork, rigged to `orb`.
    const ORB_BASE: V3 = [ORB[0] - 0.004, ORB[1] - 0.055, ORB[2]];
    const staffFlame = flame(0.19).at(...ORB_BASE);
    k.body('fire', staffFlame.paintFn(firePaint(ORB_BASE, 0.19)), {
      color: C.fire,
      roughness: 0.38,
      emissive: '#ff5a14',
      emissiveIntensity: 0.45,
      detail: 0.004,
      bone: 'orb',
    });

    const palmFlame = flame(0.1).at(...PALM_FLAME);
    k.body('palm-fire', palmFlame.paintFn(firePaint(PALM_FLAME, 0.1)), {
      color: C.fire,
      roughness: 0.4,
      emissive: '#ff5a14',
      emissiveIntensity: 0.45,
      detail: 0.0035,
      bone: 'palmfire',
    });

    // ------------------------------------------------------------------ animation (7 clips)
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const LEG = 0.19;

    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.05 * wave(p, 7), 1 + 0.08 * wave(p, 5, 0.2), 1 + 0.05 * wave(p, 7, 0.4)] as const },
      palmfire: { scale: [1 + 0.07 * wave(p, 9, 0.1), 1 + 0.1 * wave(p, 7, 0.3), 1 + 0.07 * wave(p, 9)] as const },
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        hattip: { rotate: [4 * wave(p, 1, 0.4), 0, 6 * wave(p, 1, 0.35)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    const stride = (
      duration: number,
      step: number,
      lift: number,
      duty: number,
      hop: number,
      armSwing: number,
      lean: number,
      flow: number,
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(
          p - 0.25,
          { hip: HIP, knee: KNEE, ankle: ANKLE },
          {
            stride: step,
            lift,
            duty,
            bob: hop,
            heel: [0.094, 0, -0.015],
            toe: [0.111, 0, 0.093],
            hips: { at: [0, 0.2, 0], rotate: hipsTurn },
          },
        );
        return {
          ...flicker(p),
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [flow * 0.25 + 3 * wave(p, 2, 0.1), -9 * wave(p, 1, 0.12), 4 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          hattip: { rotate: [flow * 0.4 + 6 * wave(p, 2, 0.2), 0, 8 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const STAFF = { dir: norm(STAFF_AXIS), up: [0, 0, 1] as V3 };
    const PALM = { dir: rotY([1, 0, 0], HAND_L_YAW), up: [0, 1, 0] as V3 };
    const staffPose = (wrist: V3, dir: V3, up: V3 = [0, 0, 1], pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], STAFF, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const palmPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.1, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], PALM, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    k.animation('attack', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.3, [-0.275, 0.38, -0.02]],
            [0.42, [-0.285, 0.39, -0.03]],
            [0.465, [-0.315, 0.39, 0.05]],
            [0.52, [-0.21, 0.37, 0.155]],
            [0.6, [-0.19, 0.365, 0.16]],
            [0.76, [-0.205, 0.36, 0.13]],
            [0.86, [-0.262, 0.368, 0.095]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, STAFF_AXIS],
            [0.3, norm([-0.42, 0.89, -0.12])],
            [0.42, norm([-0.44, 0.88, -0.14])],
            [0.465, norm([-0.42, 0.8, 0.42])],
            [0.52, norm([-0.18, 0.5, 0.85])],
            [0.6, norm([-0.1, 0.42, 0.9])],
            [0.76, norm([-0.2, 0.6, 0.78])],
            [0.86, norm([-0.28, 0.82, 0.5])],
            [1, STAFF_AXIS],
          ] as const,
          'spline',
        );
        const up = keys(
          p,
          [
            [0, [0, 0, 1]],
            [0.4, [0.3, 0.3, 0.9]],
            [0.52, [0, 0.9, -0.45]],
            [0.76, [0, 0.8, -0.6]],
            [1, [0, 0, 1]],
          ] as const,
        );
        const gather = ease(0.02, 0.3, p) * (1 - ease(0.44, 0.52, p));
        const cast = ease(0.44, 0.54, p) * (1 - ease(0.72, 1, p));
        const orb = keys(
          p,
          [
            [0, 1],
            [0.3, 0.8],
            [0.45, 0.9],
            [0.52, 2.0],
            [0.58, 2.25],
            [0.68, 1.5],
            [0.85, 1],
          ] as const,
        );
        return {
          ...staffPose(wrist, dir, up),
          ...palmPose(
            keys(
              p,
              [
                [0, WRIST_L],
                [0.3, [0.245, 0.29, -0.03]],
                [0.5, [0.265, 0.285, -0.01]],
                [0.6, [0.27, 0.34, 0.05]],
                [1, WRIST_L],
              ] as const,
            ),
            PALM.dir,
            PALM.up,
          ),
          orb: { scale: [orb, orb, orb] },
          palmfire: { scale: [1 + 0.3 * gather, 1 + 0.3 * gather, 1 + 0.3 * gather], move: [0, 0.012 * gather, 0] },
          hips: {
            move: [0, -legDrop(LEG, 16 * cast) - 0.006 * cast, 0.03 * cast - 0.012 * gather],
            rotate: [0, -12 * gather + 10 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 10 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -14 * gather + 12 * cast, 0] },
          head: { rotate: [4 * gather - 8 * cast, 12 * gather - 12 * cast, 0] },
          hattip: { rotate: [-6 * gather + 12 * cast, 0, 6 * gather] },
          cloak: { rotate: [4 * gather + 16 * cast, 0, 0] },
          'leg.L': { rotate: [2 * gather - 18 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 12 * cast, 0, 0] },
          'foot.L': { rotate: [12 * cast, 0, 0] },
          'foot.R': { rotate: [-6 * cast, 0, 0] },
        };
      },
    });

    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.35 * h;
        return {
          ...staffPose(lerp(WRIST_R, [-0.26, 0.36, 0.05], h), lerp(STAFF_AXIS, norm([-0.45, 0.88, -0.08]), h)),
          orb: { scale: [f, f, f] },
          palmfire: { scale: [f, f, f] },
          hips: { move: [0, -0.005 * h, -0.025 * h], rotate: [0, -6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, 3 * h] },
          head: { rotate: [-14 * h, 8 * h, -5 * h] },
          hattip: { rotate: [14 * h, 0, 8 * h] },
          cloak: { rotate: [-8 * h, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    const NECK_CHAIN: V3[] = [
      [0, 0.2, 0],
      [0, 0.26, 0],
      [0, 0.33, 0],
      [0, 0.43, -0.01],
      [0, 0.48, -0.01],
    ];
    const HAT_FLOOR: V3 = [0.5, -0.033, -0.6];
    const HAT_REST = quat([0, 0, -10]).multiply(quat([-12, 0, 0]));
    const HAT_DOWN = quat([0, 0, -6]).multiply(quat([0, 70, 0]));
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        const tip = ease(0.4, 0.8, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const flat = ease(0.4, 0.68, p);
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        const lean = bend.reduce((a, b) => a + b, 0);
        const onHead = (pt: V3) =>
          follow(
            NECK_CHAIN.map((j) => add(j, hipsMove)),
            bend.map((a) => [a, 0, 0] as V3),
            add(pt, hipsMove),
          );
        const off = ease(0.28, 0.46, p);
        const fly = ease(0.36, 0.8, p);
        const turn = ease(0.36, 0.66, p);
        const worn = onHead(HAT_AT);
        const lifted = onHead([HAT_AT[0] + 0.03 * off, HAT_AT[1] + 0.1 * off, HAT_AT[2]]);
        const hatAt = add(lerp(lifted, HAT_FLOOR, fly), [0, 0.14 * Math.sin(Math.PI * fly), 0]);
        const hatTurn = quat([lean, 0, 0]).multiply(HAT_REST).slerp(HAT_DOWN, turn);
        return {
          ...staffPose(
            keys(
              p,
              [
                [0, WRIST_R],
                [0.3, [-0.27, 0.34, 0.1]],
                [0.66, [-0.26, 0.34, -0.09]],
              ] as const,
            ),
            keys(
              p,
              [
                [0, STAFF_AXIS],
                [0.3, norm([-0.3, 0.75, 0.6])],
                [0.5, norm([-0.05, -0.2, 0.96])],
                [0.66, norm([0.05, -1, 0.3])],
              ] as const,
            ),
            keys(
              p,
              [
                [0, [0, 0, 1]],
                [0.3, [-1, 0, 0]],
                [0.66, [-1, 0, 0]],
              ] as const,
            ),
            [-0.3, 0.2, -0.4],
          ),
          ...palmPose(
            lerp(WRIST_L, [0.26, 0.34, -0.09], ease(0.2, 0.66, p)),
            PALM.dir,
            lerp(PALM.up, [0, 0.3, 1], ease(0.2, 0.62, p)),
            [0.3, 0.2, -0.4],
          ),
          orb: { scale: [out, out, out] },
          palmfire: { scale: [out, out, out] },
          hatroot: {
            rotate: euler(quat([-lean, 0, 0]).multiply(hatTurn).multiply(HAT_REST.clone().invert())),
            move: follow([[0, 0, 0]], [[-lean, 0, 0]], sub(hatAt, worn)),
          },
          hattip: { rotate: [-10 * tip + 12 * land, 0, 10 * tip] },
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
        const upL = ease(0.14, 0.38, p);
        const f = 1 + 0.6 * up + 0.2 * pump;
        const staffWrist = add(lerp(WRIST_R, [-0.29, 0.48 + 0.02 * pump, 0.08], up), [0, 0.045 * bend * (1 - up), 0]);
        const palmWrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.16, [0.275, 0.33, 0.1]],
            [0.4, [0.285, 0.43, 0.07]],
          ] as const,
        );
        return {
          ...staffPose(staffWrist, lerp(STAFF_AXIS, norm([-0.5, 0.85, 0.06]), up)),
          ...palmPose(add(palmWrist, [0, 0.04 * pump, 0]), rotZ(PALM.dir, -35 * upL), rotZ(PALM.up, -35 * upL)),
          orb: { scale: [f, f, f] },
          palmfire: { scale: [f, f, f] },
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump, 5 * up, 0] },
          head: { rotate: [-4 * bend - 8 * up, 6 * up, 4 * up] },
          hattip: { rotate: [8 * bend - 14 * air + 6 * pump, 0, 8 * pump] },
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
