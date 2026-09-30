import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Sorcerer — Chibi Quest hero (catalog `heroes/magic/sorcerer`), about 1.0 m to the hair tips, faces +Z.
 * Target: docs/hero-mockups/sorcerer_001.jpg. The mockup shows a bearded man; this sorcerer is
 * young and beardless (the round hero face). Built on the mage's body, skeleton, and clip set.
 * Role: the Sorcerer Ziggurat player hero; the violet fire orb is the focal prop at 128 px.
 *
 * One idea: a wild black spiky mop over heavy brows, a crimson robe with gold trim, and both palms
 *   open and up, a violet fire orb over the right, a violet flame over the left.
 * Shape language: triangular spikes and a flared collar and cuffs, on a round chibi body.
 * Palette (60/30/10): crimson #a8282a (robe, folds #6e1a1c); black #1c1418 (collar, cuff lining,
 *   belt, panel); gold #e0b040 trim; the violet #c060ff orb and flames are the accent.
 * Value plan: the black hair and black collar frame the light face; the orb is the brightest point.
 * Materials: skin, hair, robe, sleeves, collar (black cloth), belt, gold, skull, dark under-robe,
 *   boots, orb, two flames.
 * Rig: the mage's skeleton (`orb` on the right hand, `flame.L` on the left hand added; the hat and
 *   cape bones stay unused). Clips: idle, walk, run, attack (an orb cast), attack2 (a two-hand
 *   blast), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1a1420',
  iris: '#6a4a9e',
  irisLow: '#a888d8',
  pupil: '#100c12',
  lid: '#1c130f',
  mouth: '#a4503f',
  hair: '#1a1614',
  crimson: '#a8282a',
  fold: '#6e1a1c',
  black: '#1c1418',
  gold: '#e0b040',
  skull: '#f0ece0',
  under: '#241c22',
  boot: '#16141a',
  sole: '#2c2830',
  orbBase: '#3a1050',
  orbLit: '#c060ff',
  flameLit: '#d080ff',
  violetDeep: '#6a24b0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the mage's left side, mirrored for the right). Both hands are open, palms up.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.198, 0.355, 0.012];
const WRIST_L: V3 = [0.258, 0.35, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const ELBOW_R = mx(ELBOW_L);
const WRIST_R = mx(WRIST_L);
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const rad = Math.PI / 180;
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

/** An open hand, palm up, pointing along +X (s = 1, left) or -X (s = -1, right) from the wrist at the origin. */
const openHand = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.012,
    sdf.ellipsoid([0.046, 0.02, 0.04]).at(0.04 * s, 0, 0.004),
    ...[-0.024, -0.008, 0.008, 0.024].map((z, i) =>
      sdf.capsule([0.07 * s, 0.002, z], [(0.098 - Math.abs(i - 1.5) * 0.006) * s, 0.016, z * 1.1], 0.0105),
    ),
    sdf.capsule([0.03 * s, 0.006, 0.036], [0.058 * s, 0.022, 0.052], 0.012),
  );
const HAND_YAW = 40; // the hands turn forward: left -40, right +40
const handL = (sh: sdf.Shape) => sh.rotateY(-HAND_YAW).at(...WRIST_L);
const handR = (sh: sdf.Shape) => sh.rotateY(HAND_YAW).at(...WRIST_R);
const PALM_L: V3 = rotY([0.045, 0.02, 0.004], -HAND_YAW);
const PALM_R: V3 = rotY([-0.045, 0.02, 0.004], HAND_YAW);
/** Hand pointing directions in the rest pose (the clips aim these). */
const POINT_L: V3 = rotY([1, 0, 0], -HAND_YAW);
const POINT_R: V3 = rotY([-1, 0, 0], HAND_YAW);

/** The fire orb: a sphere r 0.055 floating 0.085 above the open right palm. Its flame sits on top. */
const ORB_R = 0.055;
const ORB: V3 = [WRIST_R[0] + PALM_R[0], WRIST_R[1] + 0.087, WRIST_R[2] + PALM_R[2]];
const ORB_FLAME_H = 0.08;
const ORB_FLAME_BASE: V3 = [ORB[0], ORB[1] + 0.046, ORB[2]];
/** The flame on the open left palm (0.1 tall) and its `flame.L` bone at the flame's round base. */
const FLAME_H = 0.12;
const FLAME_L_BASE: V3 = [WRIST_L[0] + PALM_L[0], WRIST_L[1] + 0.012, WRIST_L[2] + PALM_L[2]];
const FLAME_L: V3 = [FLAME_L_BASE[0], FLAME_L_BASE[1] + FLAME_H * 0.3, FLAME_L_BASE[2]];
/** Unused hat pivots from the mage's rig (the bones stay so the skeleton matches the base). */
const HAT_AT: V3 = [0, 0.735, -0.012];

/** A flame: a round base that rises into two or three curling tongues. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.3, h * 0.66, 0, h * 0.07],
        [h * 0.26, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.3, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.3, h * 0.76, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );
/** Violet fire: a lighter core low in the flame, deep violet toward the tips (emissive adds the light). */
const firePaint = (base: V3, h: number, coreHex: string = C.orbLit) => {
  const core = rgb(coreHex);
  const outer = rgb(C.violetDeep);
  return (x: number, y: number, z: number) => {
    const t = Math.min(1, Math.max(0, (y - base[1]) / h));
    const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
    const kk = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
    return [core[0] + (outer[0] - core[0]) * kk, core[1] + (outer[1] - core[1]) * kk, core[2] + (outer[2] - core[2]) * kk] as const;
  };
};

/** A zigzag stroke going down the y axis (a rune), as a closed polygon in the XY plane. */
const zigzag = (cx: number, y0: number, y1: number, steps: number, amp: number, w: number) => {
  const pts: [number, number][] = Array.from({ length: steps + 1 }, (_, i) => [cx + (i % 2 === 0 ? -amp : amp), y0 + ((y1 - y0) * i) / steps]);
  return profile.polygon([...pts.map(([x, y]): [number, number] => [x - w / 2, y]), ...pts.reverse().map(([x, y]): [number, number] => [x + w / 2, y])]);
};

export default defineAsset({
  name: 'sorcerer',
  description: 'Chibi young sorcerer hero with wild black spiky hair, a crimson gold-trimmed robe, a skull belt, a violet fire orb and a violet flame on open palms.',
  detail: 0.006,
  reference: 'docs/hero-mockups/sorcerer_001.jpg',
  // Color slots for individual sorcerers (the first option is the default look). The black cloth,
  // gold, skull, boots, orb and flames are not in a slot.
  variants: {
    eyes: { violet: C.iris, brown: '#6e4020', blue: '#2f6aa8' },
    hair: { black: C.hair, white: '#d8d4c8', auburn: '#7a3a22' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { crimson: C.crimson, midnight: '#2a2a5a', emerald: '#2a6a3a' },
  },
  presets: {
    default: { eyes: 'violet', hair: 'black', skin: 'fair', clothing: 'crimson' },
    midnight: { eyes: 'blue', hair: 'white', skin: 'tan', clothing: 'midnight' },
    emerald: { eyes: 'brown', hair: 'auburn', skin: 'brown', clothing: 'emerald' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      fold: k.tint('clothing', { color: C.fold, follow: 1 }),
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
      hattip: { parent: 'hatroot', at: [-0.012, 0.97, -0.03], tail: [-0.2, 0.92, -0.05] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'flame.L': { parent: 'hand.L', at: FLAME_L },
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
    // Round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.05, 0.036])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.612, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      handR(openHand(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      handL(openHand(1)).bone('hand.L'),
    );

    // The young hero face: big eyes, a small confident smile (the brows are hair, below).
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.043, 0.05, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.038, 0.045, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.031, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.013, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 240, 300), 0.3).at(0, 0.53 + 0.07, 0.1);
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
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair
    // A cap on the skull, 14 swept-back spikes (two over the brow), sideburns, and heavy brows
    // tilted in about 10 degrees. The ears and the forehead stay clear.
    const HC: V3 = [0, HEAD_Y + 0.02, -0.01];
    // 12 flat flame-shaped locks: [azimuth from the front, elevation, scale, outward, up, back].
    // The last two fall forward over the brow to his right (-X); the rest sweep up and back.
    const LOCKS: [number, number, number, number, number, number][] = [
      [0, 76, 0.95, 0.2, 0.9, 0.7],
      [-40, 62, 1.1, 0.4, 0.7, 0.9],
      [40, 62, 1.05, 0.4, 0.7, 0.9],
      [-75, 52, 1.05, 0.6, 0.55, 0.9],
      [75, 52, 1.0, 0.6, 0.55, 0.9],
      [-110, 46, 1.05, 0.55, 0.5, 1.0],
      [110, 46, 1.0, 0.55, 0.5, 1.0],
      [180, 42, 1.05, 0.25, 0.45, 1.2],
      [-146, 43, 1.0, 0.4, 0.45, 1.1],
      [146, 43, 0.95, 0.4, 0.45, 1.1],
      [4, 66, 1.05, 1.0, 0.0, 0.0],
      [-22, 58, 0.95, 1.0, 0.0, 0.0],
    ];
    const lock = ([az, el, sc, wd, wu, wb]: (typeof LOCKS)[number], i: number) => {
      const d: V3 = [Math.sin(az * rad) * Math.cos(el * rad), Math.sin(el * rad), Math.cos(az * rad) * Math.cos(el * rad)];
      const surf: V3 = [HC[0] + d[0] * 0.2, HC[1] + d[1] * 0.19, HC[2] + d[2] * 0.195];
      // The brow locks fall forward and down, to his right; the others sweep up and back.
      const v = i >= 10 ? norm([-0.55, -0.5, 0.7]) : norm([d[0] * wd, d[1] * wd + wu, d[2] * wd - wb]);
      const alpha = -Math.asin(v[1]) / rad;
      const psi = Math.atan2(v[0], v[2]) / rad;
      // Local +Z is the lock's length: a fat rounded base and a narrower rounded tip, flat in thickness.
      const shape = sdf
        .smoothUnion(0.02, sdf.ellipsoid([0.032, 0.02, 0.05]).at(0, 0, 0.0), sdf.ellipsoid([0.018, 0.012, 0.06]).at(0, 0, 0.055))
        .scale(sc * 1.35);
      const base = i >= 10 ? add(surf, [0, 0.005, 0.0]) : sub(surf, scale(v, 0.02));
      return shape.rotateX(alpha).rotateY(psi).at(...base);
    };
    const skullCap = sdf
      .ellipsoid([HEAD[0] + 0.009, HEAD[1] + 0.008, HEAD[2] + 0.009])
      .at(0, HEAD_Y + 0.006, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.135, 0.22]).at(-0.005, 0.625, 0.15));
    // Keep the hair above a plane that dips low at the nape and clears the ears.
    const capTilt = norm([0, -1, 0.5]);
    const cap = skullCap.intersect(sdf.halfSpace(capTilt, dot(capTilt, [0, 0.665, 0])));
    const sideburns = pair(
      sdf.chain(
        [
          [0.184, 0.745, 0.062, 0.036],
          [0.195, 0.69, 0.055, 0.027],
          [0.2, 0.635, 0.048, 0.012],
        ],
        0.02,
      ),
    );
    const browAt = (x: number, y: number, r: number): [number, number, number, number] => [x, y, faceZ(x, y) + 0.005, r];
    const brows = pair(sdf.chain([browAt(0.052, 0.708, 0.011), browAt(0.1, 0.72, 0.0125), browAt(0.147, 0.734, 0.008)], 0.01));
    const hair = sdf.smoothUnion(0.02, cap, ...LOCKS.map(lock), sideburns).union(brows);
    // Plain #1a1614, with a groove bump (fine ridges running back over the head) in the normal map only.
    k.body('hair', hair, {
      color: T.hair,
      roughness: 0.6,
      detail: 0.004,
      bone: 'head',
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin((x * 0.8 + y * 1.6 - z * 1.2) * 170)),
    });

    // ------------------------------------------------------------------ robe and under-robe
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
            [0.146, 0.2],
            [0.157, 0.15],
            [0.167, 0.118],
            [0.161, 0.106],
            [0, 0.106],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const ang = (x: number, z: number) => Math.atan2(x, z);
    const folds = (x: number, y: number, z: number) => Math.sin(ang(x, z) * 9) * Math.min(1, Math.max(0, (0.28 - y) / 0.14));
    const foldCol = rgb(T.fold);
    const blackCol = rgb(C.black);
    // The center panel between the gold strips is black; the panels and back are crimson with darker folds.
    const robe = robeShape
      .displace(0.005, folds)
      .paintFn((x, y, z, base) => (y < 0.28 && Math.sin(ang(x, z) * 9) * Math.min(1, (0.28 - y) / 0.14) > 0.6 ? foldCol : base))
      .paintWhere(sdf.box([0.09, 0.5, 0.4]).at(0, 0.27, 0.2), C.black, 0.004);
    void blackCol;
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    const splitRobe = (sh: sdf.Shape) => sdf.union(above(sh, 0.25).bone('spine'), below(sh, 0.25).bone('skirt'));
    k.body('robe', splitRobe(robe), { color: T.cloth, roughness: 0.8 });
    // The dark under-robe shows below the hem, over the boot tops; the hips and legs sit inside it.
    const under = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.118, 0.3],
            [0.13, 0.21],
            [0.148, 0.15],
            [0.164, 0.09],
            [0.166, 0.078],
            [0.156, 0.07],
            [0, 0.07],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8]);
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('tunic', sdf.union(above(under, 0.25).bone('spine'), below(under, 0.25).bone('skirt'), legs), { color: C.under, roughness: 0.85 });

    // ------------------------------------------------------------------ collar and yoke (black)
    // A black yoke over the shoulders and a high stand-up collar ring, open at the front, taller behind.
    const yoke = sdf
      .smoothUnion(
        0.03,
        sdf.torus(0.098, 0.026).scale([1.2, 1, 1.05]).rotateX(12).at(0, 0.44, -0.008),
        sdf.ellipsoid([0.07, 0.04, 0.03]).at(0, 0.405, 0.09),
      )
      .subtract(sdf.cylinder(0.06, 0.2).at(0, 0.5, -0.01));
    const ringProfile = profile.polygon([
      [0.072, 0.43],
      [0.09, 0.43],
      [0.106, 0.5],
      [0.09, 0.5],
    ]);
    const collarTilt = norm([0, 1, 0.35]);
    // A V opening at the front, 0.08 wide at the top; a gold stroke follows its edge.
    const vCut = sdf.extrude(profile.polygon([[-0.04, 0.53], [0.04, 0.53], [0, 0.435]]), 0.3).at(0, 0, 0.1);
    const collar = sdf
      .revolve(ringProfile)
      .scale([1.05, 1, 1])
      .at(0, 0, -0.01)
      .subtract(vCut)
      .intersect(sdf.halfSpace(collarTilt, dot(collarTilt, [0, 0.497, -0.02])))
      .round(0.002);
    const collarGold = rgb(C.gold);
    const collarBody = collar.paintWhere(vCut.round(0.006), C.gold, 0.002).paintFn((x, y, z, base) => (dot(collarTilt, [x, y, z + 0.02]) > dot(collarTilt, [0, 0.497, 0]) - 0.012 ? collarGold : base));
    k.body('collar', sdf.union(collarBody.bone('neck'), yoke.bone('chest')), { color: C.black, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ sleeves (crimson, wide black-lined cuffs)
    const CUFF0 = 0.5;
    const CUFF1 = 1.0;
    const outerR = (t: number) => 0.05 + (0.086 - 0.05) * ((t - CUFF0) / (CUFF1 - CUFF0));
    const sleeveSide = (s: V3, e: V3, w: V3, tagU: string, tagF: string) => {
      const a = lerp(e, w, CUFF0);
      const b = lerp(e, w, CUFF1);
      const axis = norm(sub(w, e));
      const len = Math.hypot(...sub(w, e));
      const inner = sdf.cone(lerp(e, w, 0.8), lerp(e, w, 1.3), outerR(0.8) - 0.016, outerR(1.3) - 0.016);
      const lining = rgb(C.black);
      const body = sdf
        .smoothUnion(
          0.02,
          sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.048, 0.046).bone(tagU),
          sdf.cone(e, a, 0.046, 0.05).bone(tagF),
          sdf.cone(a, b, 0.05, 0.086).bone(tagF),
        )
        .subtract(inner)
        .paintFn((x, y, z, base) => {
          const rel = sub([x, y, z], e);
          const t = dot(rel, axis) / len;
          const perp = sub(rel, scale(axis, t * len));
          return t > 0.75 && Math.hypot(...perp) < outerR(Math.min(t, 1.2)) - 0.009 ? lining : base;
        });
      return body;
    };
    k.body('sleeves', sdf.union(sleeveSide(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeveSide(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: T.cloth,
      roughness: 0.8,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ belt (black) and skull buckle
    const beltY = 0.255;
    const belt = robeShape.round(0.011).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.black, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const sk = (p: V3) => add(p, [0, beltY - 0.002, beltZ + 0.006]);
    const pits = [sdf.sphere(0.0085).at(...sk([0.0115, 0.002, 0.024])), sdf.sphere(0.0085).at(...sk([-0.0115, 0.002, 0.024])), sdf.sphere(0.005).scale([0.8, 1.2, 1]).at(...sk([0, -0.012, 0.028]))];
    const skull = sdf
      .smoothUnion(0.006, sdf.sphere(0.03).scale([1, 0.96, 0.85]).at(...sk([0, 0.004, 0.006])), sdf.box([0.03, 0.02, 0.022], 0.006).at(...sk([0, -0.024, 0.002])))
      .subtract(...pits)
      .paintWhere(sdf.union(...pits.map((p) => p.round(0.002))), C.black, 0.002);
    k.body('skull', skull.bone('spine'), { color: C.skull, roughness: 0.5, detail: 0.003 });

    // ------------------------------------------------------------------ gold trim (raised on the robe)
    // Two strips down the front, a zigzag rune stroke on each panel, the hem band, the cuff rims, the
    // yoke buttons. Each is a thin shell of the robe cut by a stencil.
    const shell = robeShape.round(0.007).subtract(robeShape.round(-0.002));
    const strips = hard(sdf.box([0.014, 0.4, 0.5], 0.003).at(0.052, 0.27, 0.25));
    const runes = hard(
      sdf.union(
        sdf.extrude(zigzag(0.092, 0.132, 0.238, 6, 0.015, 0.01), 0.3).at(0, 0, 0.2),
        sdf.extrude(zigzag(0.092, 0.292, 0.372, 4, 0.015, 0.01), 0.3).at(0, 0, 0.2),
      ),
    );
    const hem = shell.intersect(sdf.halfSpace([0, 1, 0], 0.131));
    const goldRobe = sdf.union(shell.intersect(strips), shell.intersect(runes), hem);
    const rim = (e: V3, w: V3, tag: string) => {
      const c = lerp(e, w, CUFF1);
      const ax = norm(sub(w, e));
      const alpha = Math.acos(ax[1]) / rad;
      const psi = Math.atan2(ax[0], ax[2]) / rad;
      return sdf.torus(outerR(CUFF1) - 0.003, 0.0075).rotateX(alpha).rotateY(psi).at(...c).bone(tag);
    };
    const yokeZ = (x: number) => sdf.raycast(yoke, [x, 0.388, 1], [0, 0, -1])?.[2] ?? 0.115;
    const buttons = hard(sdf.sphere(0.014).at(0.062, 0.388, yokeZ(0.062) + 0.003));
    const chevron = sdf
      .extrude(profile.polygon([[-0.024, -0.012], [0, 0.008], [0.024, -0.012], [0.024, -0.004], [0, 0.016], [-0.024, -0.004]]), 0.012, 0.002)
      .at(0, 0.385, yokeZ(0) + 0.002);
    k.body(
      'gold',
      sdf.union(
        above(goldRobe, 0.25).bone('spine'),
        below(goldRobe, 0.25).bone('skirt'),
        rim(ELBOW_L, WRIST_L, 'forearm.L'),
        rim(ELBOW_R, WRIST_R, 'forearm.R'),
        sdf.union(buttons, chevron).bone('chest'),
      ),
      { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.0035 },
    );

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0).paint(C.sole))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the violet fire
    const fireOpts = { color: C.orbBase, roughness: 0.2, opacity: 0.95, emissive: C.orbLit, emissiveIntensity: 1.7 };
    k.body('fireball', sdf.sphere(ORB_R).at(...ORB), {
      ...fireOpts,
      detail: 0.004,
      bone: 'orb',
    });
    const flameOpts = { color: C.orbBase, roughness: 0.4, opacity: 0.8, emissive: C.flameLit, emissiveIntensity: 1.4, detail: 0.0035 };
    k.body('orb-flame', flame(ORB_FLAME_H).at(...ORB_FLAME_BASE).paintFn(firePaint(ORB_FLAME_BASE, ORB_FLAME_H)), { ...flameOpts, bone: 'orb' });
    k.body('palm-flame', flame(FLAME_H).at(...FLAME_L_BASE).paintFn(firePaint(FLAME_L_BASE, FLAME_H, '#e0a0ff')), { ...flameOpts, bone: 'flame.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.05 * wave(p, 7), 1 + 0.08 * wave(p, 5, 0.2), 1 + 0.05 * wave(p, 7, 0.4)] as const },
      'flame.L': { scale: [1 + 0.07 * wave(p, 6, 0.3), 1 + 0.12 * wave(p, 5, 0.6), 1 + 0.07 * wave(p, 6, 0.1)] as const },
    });

    // Posing by targets. The wrists follow keys in the chest's rest frame (reach); each open hand turns
    // so its pointing direction follows its own keys (orient). The right side is given; the left mirrors it.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const FRAME_R = { dir: POINT_R, up: [0, 1, 0] as V3 };
    const FRAME_L = { dir: POINT_L, up: [0, 1, 0] as V3 };
    const armPoseR = (wrist: V3, dir: V3, up: V3 = [0, 1, 0]) => {
      const arm = reach(ARM_R, wrist, [-0.5, 0.1, -0.3]);
      const hand = orient([arm.upper, arm.lower], FRAME_R, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const armPoseL = (wrist: V3, dir: V3, up: V3 = [0, 1, 0]) => {
      const arm = reach(ARM_L, wrist, [0.5, 0.1, -0.3]);
      const hand = orient([arm.upper, arm.lower], FRAME_L, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };
    /** Both arms from right-side targets (the left mirrors them unless it is given). */
    const arms = (wr: V3, dr: V3, ur: V3 = [0, 1, 0], left?: { w: V3; d: V3; u?: V3 }) => ({
      ...armPoseR(wr, dr, ur),
      ...armPoseL(left?.w ?? mx(wr), left?.d ?? mx(dr), left?.u ?? mx(ur)),
    });
    const REST_D = POINT_R;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        ...arms(add(WRIST_R, [0, 0.008 * wave(p, 1, 0.1), 0.004 * wave(p, 1, 0.3)]), REST_D, [0, 1, 0], {
          w: add(WRIST_L, [0, 0.008 * wave(p, 1, 0.6), 0.004 * wave(p, 1, 0.8)]),
          d: POINT_L,
        }),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
      }),
    });

    // Both hands are busy, so the arms swing little; the hips, chest, and robe skirt carry the motion.
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
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.2 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    // attack: an orb cast. The right hand draws in with the orb, holds, then pushes forward; the orb
    // flares, flies 0.3 m forward along the palm, and comes back. The left flame flares a little.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.3, [-0.23, 0.285, 0.09]],
            [0.42, [-0.23, 0.285, 0.09]],
            [0.5, [-0.23, 0.28, 0.13]],
            [0.56, [-0.17, 0.29, 0.165]],
            [0.7, [-0.17, 0.29, 0.165]],
            [0.88, [-0.24, 0.3, 0.09]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, POINT_R],
            [0.3, norm([-0.7, 0.15, 0.6])],
            [0.42, norm([-0.7, 0.15, 0.6])],
            [0.5, norm([-0.2, 0.05, 1])],
            [0.56, norm([-0.05, 0.02, 1])],
            [0.7, norm([-0.05, 0.02, 1])],
            [0.88, norm([-0.5, 0.1, 0.8])],
            [1, POINT_R],
          ] as const,
          'spline',
        );
        const gather = ease(0.02, 0.3, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.44, 0.54, p) * (1 - ease(0.7, 1, p));
        const away = 0.3 * ease(0.5, 0.62, p) * (1 - ease(0.68, 0.92, p));
        const orb = keys(p, [[0, 1], [0.3, 0.85], [0.42, 0.9], [0.55, 1.0], [0.62, 1.3], [0.76, 1.1], [0.92, 1]] as const);
        const lf = 1 + 0.5 * cast + 0.2 * gather;
        return {
          ...armPoseR(wrist, dir),
          ...armPoseL(keys(p, [[0, WRIST_L], [0.3, [0.25, 0.345, 0.05]], [0.6, [0.255, 0.35, 0.09]], [1, WRIST_L]] as const), POINT_L),
          orb: { scale: [orb, orb, orb], move: scale(POINT_R, away) },
          'flame.L': { scale: [lf, lf, lf] },
          hips: {
            move: [0, -legDrop(LEG, 14 * cast) - 0.005 * cast, 0.025 * cast - 0.01 * gather],
            rotate: [0, -12 * gather + 10 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 9 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -14 * gather + 12 * cast, 0] },
          head: { rotate: [4 * gather - 6 * cast, 12 * gather - 12 * cast, 0] },
          'leg.L': { rotate: [2 * gather - 16 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 10 * cast, 0, 0] },
          'foot.L': { rotate: [10 * cast, 0, 0] },
          'foot.R': { rotate: [-5 * cast, 0, 0] },
        };
      },
    });

    // attack2: a two-hand blast. Both hands draw in and up while both fires swell, then both arms
    // push forward, the flames flare and the orb surges ahead, and everything settles.
    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.48, p));
        const push = ease(0.4, 0.5, p) * (1 - ease(0.72, 1, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.3, [-0.23, 0.285, 0.09]],
            [0.4, [-0.23, 0.285, 0.09]],
            [0.5, [-0.2, 0.285, 0.13]],
            [0.56, [-0.13, 0.305, 0.165]],
            [0.7, [-0.13, 0.305, 0.165]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, POINT_R],
            [0.3, norm([-0.7, 0.15, 0.6])],
            [0.4, norm([-0.7, 0.15, 0.6])],
            [0.5, norm([-0.3, 0.0, 1])],
            [0.56, norm([-0.04, 0.0, 1])],
            [0.7, norm([-0.04, 0.0, 1])],
            [1, POINT_R],
          ] as const,
          'spline',
        );
        const size = keys(p, [[0, 1], [0.3, 0.85], [0.4, 0.85], [0.55, 1.1], [0.68, 1.25], [0.9, 1.1], [1, 1]] as const);
        const fsize = keys(p, [[0, 1], [0.3, 1.1], [0.4, 1.1], [0.55, 1.7], [0.68, 1.8], [0.9, 1.3], [1, 1]] as const);
        const surge = 0.12 * ease(0.5, 0.62, p) * (1 - ease(0.7, 0.95, p));
        return {
          ...arms(wrist, dir),
          orb: { scale: [size, size, size], move: scale(POINT_R, surge) },
          'flame.L': { scale: [fsize, fsize, fsize], move: scale(POINT_L, surge) },
          hips: {
            move: [0, -legDrop(LEG, 14 * push) - 0.004 * push, 0.025 * push - 0.01 * wind],
            rotate: [0, -3 * wind, 0],
          },
          skirt: { rotate: [-2 * wind + 5 * push, 0, 0] },
          spine: { rotate: [-4 * wind + 8 * push, 0, 0] },
          chest: { rotate: [-2 * wind + 4 * push, 0, 0] },
          head: { rotate: [2 * wind - 6 * push, 0, 0] },
          'leg.L': { rotate: [2 * wind - 16 * push, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 10 * push, 0, 0] },
          'foot.L': { rotate: [10 * push, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back, a small step back, the hands flinch in, the fires gutter.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.35 * h;
        return {
          ...arms(lerp(WRIST_R, [-0.2, 0.33, 0.06], h), POINT_R),
          orb: { scale: [f, f, f] },
          'flame.L': { scale: [f, f, f] },
          hips: { move: [0, -0.005 * h, -0.025 * h], rotate: [0, -6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, 3 * h] },
          head: { rotate: [-14 * h, 8 * h, -5 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger, then he falls flat on his back; the fires go out and the arms drop to his sides.
    // The hips drop below the floor on purpose: the build lifts the body until it rests on the floor.
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
        const side = ease(0.2, 0.66, p);
        return {
          ...arms(lerp(WRIST_R, [-0.26, 0.33, -0.09], side), lerp(POINT_R, norm([-0.7, 0.3, 0.4]), side), lerp([0, 1, 0], [0, 0.3, 1], side)),
          orb: { scale: [out, out, out] },
          'flame.L': { scale: [out, out, out] },
          hips: { move: [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall], rotate: [-76 * fall - 4 * stagger, 0, 0] },
          skirt: { rotate: [8 * stagger + leg - 20 * fall, 0, 0] },
          spine: { rotate: [-6 * stagger, 0, 0] },
          chest: { rotate: [-4 * stagger, 0, 0] },
          neck: { rotate: [-5 * fall, 0, 0] },
          head: { rotate: [-16 * stagger - 14 * fall, 0, 0] },
          'leg.L': { rotate: [6 * stagger + leg, 0, 4 * fall] },
          'leg.R': { rotate: [-6 * stagger + leg + 2 * fall, 0, -5 * fall] },
          'foot.L': { rotate: [-14 * fall, 0, 0] },
          'foot.R': { rotate: [-18 * fall, 0, 0] },
        };
      },
    });

    // victory (the mage's hop): an anticipation crouch, a push-off, a hop of about 8 cm, and a landing
    // that the knees absorb. In the push-off both arms rise up and out, palms up, and both fires flare.
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
        const f = 1 + 0.25 * up + 0.1 * pump;
        return {
          ...arms(add(lerp(WRIST_R, [-0.3, 0.36, 0.05], up), [0, 0.02 * pump, 0]), lerp(POINT_R, norm([-0.95, 0.15, 0.2]), up)),
          orb: { scale: [f, f, f] },
          'flame.L': { scale: [f, f, f] },
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump, 5 * up, 0] },
          head: { rotate: [-4 * bend - 8 * up, 6 * up, 4 * up] },
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
