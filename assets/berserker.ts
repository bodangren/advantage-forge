import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Berserker — Chibi Quest P1 hero (catalog `heroes/martial/berserker`), about 1.03 m to the top
 * of the bear-skull cap, faces +Z. Target: docs/hero-mockups/berserker_001.jpg (one front view; the
 * mockup's beard, adult face, and pointed ears are left out: the heroes share one young, round
 * beardless face with small round ears). Built on the barbarian (the knight's body, face, skeleton).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the red mane, the bone cap with its two
 *   round ears, the fur vest, the blue war paint, and the two big axes must read.
 * One idea: a wild young berserker: a huge red mane bursting out under a bone bear-skull cap, bare
 *   chest with a shaggy fur vest, blue war paint, and a big crescent axe in each hand held low and out.
 * Shape language: round and shaggy body, spiky mane and tuft, big flat crescent blades.
 * Proportions: cap top 0.99 (tuft 1.04), eyes 0.63, chin 0.48, shoulders 0.44 (fur), belt 0.25,
 *   loincloth hem 0.12, fur boot tops 0.15; the axe heads out at x +-0.4, y 0.2.
 * Palette (60/30/10): skin #f2c7a4 and fur #a89070 (mid); red hair #c84a28 and blue paint #3a9ad0
 *   as accents; bone #e8dcc0 (light); belt leather #4e2d1c (dark); brass #c9a24a; steel #8a9098.
 * Bodies: skin (head), bone (cap), hair, body (torso, arms, legs), fur, leather, cloth, brass,
 *   spikes, and per hand: axe (blade), axe-iron (socket, rivets, butt), haft.
 * Rig: the knight's skeleton; the `plume` bone sways the back of the mane and the top tuft, `cloak`
 *   the hem of the vest. Each axe is rigid on its hand. Clips: idle, walk, run, attack (a double
 *   cross-chop), attack2 (a spinning double sweep), hit, death, victory (both axes up).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#3d7a35',
  irisLow: '#62a04e',
  pupil: '#110d0b',
  lid: '#16100c',
  mouth: '#8a3a30',
  teeth: '#f4eee2',
  hair: '#c84a28',
  hairDark: '#8a2e18',
  brow: '#6e2410',
  paint: '#3a9ad0',
  bone: '#e8dcc0',
  boneDark: '#b8a888',
  pit: '#2a2018',
  fur: '#a89070',
  furDark: '#7a6650',
  furLight: '#c4ac88',
  leather: '#4e2d1c',
  leatherDark: '#33201a',
  sole: '#24160f',
  cloth: '#3f6a9a',
  brass: '#c9a24a',
  spike: '#a8acb1',
  steel: '#5a5f68',
  steelLight: '#e2e6ec',
  iron: '#4a4d54',
  haft: '#4a2e1c',
  wrap: '#7a5234',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the knight's). Both hands hold an axe low and out; the arms are mirror images.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.195, 0.35, -0.005];
const WRIST_R: V3 = [-0.235, 0.325, 0.1];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0): heel and toe (the knight's sabaton shape).
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const ELBOW_L = mx(ELBOW_R);
const WRIST_L = mx(WRIST_R);
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Rotations for points, matching the shape methods (degrees, world axes).
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
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** Rotates the vector v about the unit axis u by deg degrees. */
const rotAround = (v: V3, u: V3, deg: number): V3 => {
  const c = Math.cos(deg * rad);
  const s = Math.sin(deg * rad);
  const d = dot(u, v) * (1 - c);
  const cr: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return [v[0] * c + cr[0] * s + u[0] * d, v[1] * c + cr[1] * s + u[1] * d, v[2] * c + cr[2] * s + u[2] * d];
};
/** A pole point on the bend side of a rest arm, so a solved arm starts on its rest pose. */
const poleOf = (root: V3, mid: V3, end: V3) => {
  const t = norm(sub(end, root));
  const e = sub(mid, root);
  const d = dot(e, t);
  const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
  return add(root, side, 0.6);
};
/** Turns a shape's local +Y into the direction `u` (rotateZ, then rotateX). */
const alignY = (s: sdf.Shape, u: V3) => s.rotateZ(Math.asin(-u[0]) / rad).rotateX(Math.atan2(u[2], u[1]) / rad);

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.04, 0.045, 0.046]).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.009 * s, -0.061, 0.031], [-0.005 * s, -0.04, 0.044], 0.018),
    sdf.cone([0.021 * s, -0.024, 0.026], [0.001 * s, -0.035, 0.05], 0.017, 0.0135),
  );
// Each hand swings forward along its forearm, then turns about the forward axis (mirror images).
const HAND_R = { pitch: -70, roll: -30 };
const HAND_L = { pitch: -70, roll: 30 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);

// ------------------------------------------------------------------ the axe's frame (right hand)
// Local frame: the right fist's grip at the origin, the haft along Y with the head toward -Y
// (AXE_L below the grip), the crescent blade in the XY plane (flats facing +-Z, horns curving back
// toward the grip). At rest the haft points down and out to the right, the flats to the front.
// The left axe is the mirror image of the right one.
const AXE_L = 0.12;
const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
const HAFT_WANT = norm([-0.3, -0.9, 0.3]);
const AXE_Z = Math.asin(HAFT_WANT[0]) / rad; // local +Y goes to -HAFT_WANT
const AXE_X = Math.atan2(-HAFT_WANT[2], -HAFT_WANT[1]) / rad;
const axeTurn = (p: V3, roll: number): V3 => rotX(rotZ(rotY(p, roll), AXE_Z), AXE_X);
const FLAT_WANT = norm([0.25, 0, 1]);
const AXE_ROLL = (() => {
  let best = 0;
  let bestDot = -2;
  for (let r = 0; r < 360; r += 1) {
    const d = dot(axeTurn([0, 0, 1], r), FLAT_WANT);
    if (d > bestDot) {
      bestDot = d;
      best = r;
    }
  }
  return best;
})();
const HAFT_DIR = axeTurn([0, -1, 0], AXE_ROLL); // grip to head, at rest
const FLAT = axeTurn([0, 0, 1], AXE_ROLL); // the flats' normal at rest
const axePose = (s: sdf.Shape) => s.rotateY(AXE_ROLL).rotateZ(AXE_Z).rotateX(AXE_X).at(...GRIP);
/** The left axe: the reflection of the right one, with the right one cut away. */
const leftOf = (s: sdf.Shape) => s.mirror('x', 0).intersect(sdf.halfSpace([-1, 0, 0], 0));

// The crescent blade around the head's center: the socket at the middle of the inner curve, a wide
// convex edge below, two horns curving back toward the grip.
const crescent = profile.polygon(
  ([
    [-0.114, 0.04],
    [-0.119, 0.0],
    [-0.108, -0.06],
    [-0.072, -0.118],
    [0.0, -0.15],
    [0.072, -0.118],
    [0.108, -0.06],
    [0.119, 0.0],
    [0.114, 0.04],
    [0.094, 0.032],
    [0.07, 0.0],
    [0.04, -0.03],
    [0.0, -0.04],
    [-0.04, -0.03],
    [-0.07, 0.0],
    [-0.094, 0.032],
  ] as [number, number][]).map(([x, y]) => [x * 0.86, y * 1.22] as [number, number]),
  { smooth: true, samples: 4 },
);

export default defineAsset({
  name: 'berserker',
  description: 'Chibi berserker hero with a huge red mane under a bone bear-skull cap, fur vest, blue war paint, and two crescent axes.',
  detail: 0.006,
  reference: 'docs/hero-mockups/berserker_001.jpg',
  // Color slots (the first option is the default look). The paint slot is the war paint.
  variants: {
    hair: { red: C.hair, black: '#231a17', blond: '#c9a050' },
    eyes: { green: C.iris, brown: '#4a2c1a', blue: '#2f6aa8' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    paint: { blue: C.paint, ochre: '#a8522e', green: '#4a7a3a' },
  },
  presets: {
    default: { hair: 'red', eyes: 'green', skin: 'fair', paint: 'blue' },
    ochre: { hair: 'black', eyes: 'brown', skin: 'tan', paint: 'ochre' },
    green: { hair: 'blond', eyes: 'blue', skin: 'brown', paint: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      paint: k.tint('paint'),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0, 0.85, -0.08]; // the root of the back mane and the top tuft
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0, 0.6, -0.2] },
      cloak: { parent: 'chest', at: [0, 0.34, -0.13] },
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

    // ------------------------------------------------------------------ head and face (the knight's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.055).bone('neck');
    // Small round human ears stick out of the mane.
    const ears = pair(sdf.ellipsoid([0.03, 0.046, 0.035]).rotateZ(-12).at(0.218, 0.615, -0.012)).bone('head');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.028, 0.032, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Thick angry brows, the inner ends 16 degrees lower (each arc turns about its own middle).
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.034, 68, 108), 0.3).at(0, -0.16, 0).rotateZ(16).at(0.1, 0.707, 0.1));
    // A wide fierce grin with a strip of teeth along the top.
    const grin = sdf.extrude(profile.arc(0.07, 0.02, 236, 304), 0.3).at(0, 0.603, 0.1);
    const teeth = sdf.extrude(profile.arc(0.0635, 0.008, 240, 300), 0.3).at(0, 0.606, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.545));
    // Two blue war-paint strokes on each cheek, beside and below the eye.
    const stroke = (x: number, y: number, len: number, tilt: number) =>
      sdf.extrude(profile.rect([0.017, len], 0.007), 0.3).rotateZ(tilt).at(x, y, 0.1);
    const cheekPaint = pair(sdf.union(stroke(0.148, 0.545, 0.055, -14), stroke(0.128, 0.492, 0.045, -14)));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.012, ears)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(cheekPaint, T.paint, 0.002)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(grin, C.mouth)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ the bone bear-skull cap
    const CAP_C: V3 = [0, 0.85, 0.005];
    const dome0 = sdf.ellipsoid([0.222, 0.122, 0.212]).at(...CAP_C).intersect(sdf.halfSpace([0, -1, 0], -0.785));
    const domeZ = (x: number, y: number) => sdf.raycast(dome0, [x, y, 1], [0, 0, -1])![2];
    // Two dark eye pits, a nose notch, and four teeth along the front edge.
    const pitAt = (x: number, y: number, rx: number, ry: number, out: number) => sdf.ellipsoid([rx, ry, 0.03]).at(x, y, domeZ(Math.abs(x), y) + out);
    const pits = pair(pitAt(0.074, 0.85, 0.04, 0.032, 0.008));
    const pitStencil = pair(pitAt(0.074, 0.85, 0.052, 0.043, 0.008));
    const pitInner = pair(pitAt(0.074, 0.85, 0.036, 0.028, 0.008));
    const notch = pitAt(0, 0.82, 0.024, 0.028, 0.008);
    const notchStencil = pitAt(0, 0.82, 0.034, 0.038, 0.008);
    const notchInner = pitAt(0, 0.82, 0.022, 0.026, 0.008);
    const tooth = (x: number, y0: number, y1: number) => sdf.capsule([x, y0, 0.19], [x, y1, 0.194], 0.0165);
    const bumps = sdf.union(...[-0.125, -0.085, 0.085, 0.125].map((x) => sdf.sphere(0.013).at(x, 0.79, Math.sqrt(Math.max(0, 1 - (x / 0.2) ** 2)) * 0.185)));
    const teethBone = sdf.union(bumps, tooth(-0.05, 0.805, 0.762), tooth(-0.0165, 0.805, 0.745), tooth(0.0165, 0.805, 0.745), tooth(0.05, 0.805, 0.762));
    // The two round ears: a thick disc turned outward, hollowed on the front.
    const capEarLocal = sdf.ellipsoid([0.066, 0.066, 0.034]).smoothSubtract(0.006, sdf.ellipsoid([0.044, 0.044, 0.028]).at(0, 0, 0.036));
    const capEarPose = (s: sdf.Shape) => s.rotateY(24).rotateZ(-14).at(0.14, 0.945, 0.02);
    const capEars = pair(capEarPose(capEarLocal));
    const capEarDish = pair(capEarPose(sdf.ellipsoid([0.05, 0.05, 0.034]).at(0, 0, 0.038)));
    const capShape = sdf
      .smoothUnion(0.01, dome0.smoothSubtract(0.008, pits, notch), teethBone, capEars)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 40, y * 40, z * 40, 2);
        return n > 0.12 ? mixRgb(base, rgb(C.boneDark), Math.min(0.6, (n - 0.12) * 1.6)) : base;
      })
      .paintWhere(sdf.union(pitStencil, notchStencil, capEarDish), '#6a5a48', 0.004)
      .paintWhere(sdf.union(pitInner, notchInner), C.pit, 0.004);
    k.body('bone', capShape, {
      color: C.bone,
      roughness: 0.8,
      detail: 0.008,
      bone: 'head',
      maxTriangles: 7000,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ hair: a huge red mane, a fringe, a top tuft
    // `hp` puts a strand point on the skull (in that direction from the head center), lifted off it
    // by part of its radius, so the locks lie on the head.
    const hp = (x: number, y: number, z: number, r: number, lift = 0.25): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const faceMask = sdf.ellipsoid([0.26, 0.17, 0.24]).at(0, 0.622, 0.16);
    const hairCap = sdf
      .ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.022, HEAD[2] + 0.02])
      .at(0, HEAD_Y + 0.012, -0.016)
      .smoothSubtract(0.015, faceMask)
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.5));
    // A thick lock starts under the cap and flares out and down to the shoulders. `a` is the angle
    // around the head in degrees (0 = front, 90 = the character's left).
    const lock = (a: number, r: number, endY: number, flare: number) => {
      const s = Math.sin(a * rad);
      const c = Math.cos(a * rad);
      return sdf.chain(
        [
          [s * 0.17, 0.8, c * 0.16, r * 0.9],
          [s * 0.222, 0.68, c * 0.205, r],
          [s * 0.255 * flare, 0.58, c * 0.225 * flare, r * 1.1],
          [s * 0.27 * flare, endY, c * 0.215 * flare, r * 0.35],
        ],
        0.02,
      );
    };
    // A few thick locks still hang over the shoulders.
    const sideLocks = pair(lock(69, 0.036, 0.55, 1.08).bone('head'));
    const backLocks = sdf.union(pair(lock(136, 0.04, 0.52, 1.12)), lock(180, 0.042, 0.48, 1.15)).bone('plume');
    const backMass = sdf.ellipsoid([0.19, 0.14, 0.08]).at(0, 0.64, -0.13).bone('plume');
    // The burst: 15 locks leave the cap rim all around (not the face), flare out and up with a
    // jittered direction and length, and end in a point.
    const burst = (a0: number, i: number) => {
      const rnd = (n: number) => noise.random(i, n, 7);
      const az = (a0 + (rnd(1) - 0.5) * 18) * rad;
      const el = (20 + rnd(2) * 30) * rad;
      const len = 0.11 + rnd(3) * 0.06;
      const r = 0.03 + rnd(4) * 0.01;
      const d: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
      const st: V3 = [Math.sin(az) * 0.175, 0.77 + (rnd(5) - 0.5) * 0.04, Math.cos(az) * 0.165];
      const pt = (t: number, drop: number, rr: number): [number, number, number, number] => [st[0] + d[0] * len * t, st[1] + d[1] * len * t - drop, st[2] + d[2] * len * t, rr];
      const lockShape = sdf.chain([pt(0, 0, r * 0.9), pt(0.4, 0, r), pt(0.75, 0.008, r * 0.72), pt(1, 0.014, r * 0.1)], 0.012);
      return lockShape.bone(a0 > 100 && a0 < 260 ? 'plume' : 'head');
    };
    const burstLocks = sdf.smoothUnion(0.012, ...Array.from({ length: 15 }, (_, i) => burst(40 + i * 20, i)));
    // The fringe: tufts over the brow, under the cap's teeth.
    const tuftLock = (x: number) =>
      sdf.chain([hp(x * 0.9, 0.83, 0.1, 0.03, 0.3), hp(x, 0.78, 0.17, 0.03, 0.35), hp(x * 1.05, 0.745, 0.195, 0.013, 0.4)], 0.015);
    const fringe = sdf.smoothUnion(0.012, ...[-0.13, -0.09, 0.09, 0.13].map(tuftLock)).bone('head');
    // The top tuft: locks that spike up through the cap and splay out.
    const TUFT: V3 = [0, 0.93, 0];
    const strand = (dx: number, dz: number, h: number, r: number) =>
      sdf.chain(
        [
          [TUFT[0], TUFT[1], TUFT[2], r],
          [TUFT[0] + dx * 0.15, TUFT[1] + h * 0.6, TUFT[2] + dz * 0.15, r * 0.95],
          [TUFT[0] + dx * 0.55, TUFT[1] + h, TUFT[2] + dz * 0.55, r * 0.75],
          [TUFT[0] + dx, TUFT[1] + h * 0.85, TUFT[2] + dz, r * 0.2],
        ],
        0.012,
      );
    const tuft = sdf
      .smoothUnion(
        0.016,
        strand(0.09, 0.01, 0.065, 0.02),
        strand(-0.09, 0.02, 0.065, 0.02),
        strand(0.05, 0.06, 0.08, 0.019),
        strand(-0.05, 0.07, 0.08, 0.019),
        strand(0.04, -0.06, 0.11, 0.019),
        strand(-0.04, -0.06, 0.11, 0.019),
        strand(0.01, 0.02, 0.09, 0.022),
      )
      .bone('plume');
    const hair = sdf
      .smoothUnion(0.02, hairCap.bone('head'), sideLocks, fringe, backLocks, backMass, tuft, burstLocks)
      .paintFn((x, y, z, base) => {
        const w = Math.sin(Math.atan2(x, z) * 16 + y * 6 + noise.noise3(x * 20, y * 20, z * 20) * 2);
        return w > 0.3 ? mixRgb(base, rgb(T.hairDark), Math.min(0.75, (w - 0.3) * 1.6)) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.65, detail: 0.007, maxTriangles: 14000 });

    // ------------------------------------------------------------------ bare torso and arms (skin)
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.108, 0.44],
            [0.13, 0.4],
            [0.134, 0.34],
            [0.128, 0.29],
            [0.132, 0.25],
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const pecs = pair(sdf.ellipsoid([0.058, 0.042, 0.03]).at(0.055, 0.385, 0.078));
    const chestShape = sdf.smoothUnion(0.03, torso, pecs);
    const torsoSkin = sdf.union(
      chestShape.intersect(sdf.halfSpace([0, -1, 0], -0.31)).bone('chest'),
      chestShape.intersect(sdf.halfSpace([0, 1, 0], 0.31)).bone('spine'),
    );
    // Stocky arms: a round deltoid, a thick upper arm, a forearm, a big fist.
    const arm = (sh: V3, el: V3, wr: V3, side: 'L' | 'R', fist: sdf.Shape) =>
      sdf.smoothUnion(
        0.02,
        sdf.sphere(0.056).at(sh[0] * 1.08, sh[1] + 0.012, sh[2]).bone(`upperarm.${side}`),
        sdf.cone(sh, lerp(sh, el, 1.05), 0.052, 0.046).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.045, 0.039).bone(`forearm.${side}`),
        fist.bone(`hand.${side}`),
      );
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1).scale(1.08));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1).scale(1.08));
    // Legs: bare thighs and knees under the loincloth.
    const thighs = pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L'));
    // War paint: two slanted swirl bands on each upper arm; a hook and a stripe on the chest.
    const bands = (sh: V3, el: V3) => {
      const up = norm(sub(el, sh));
      const ring = (t: number, tilt: number, w: number) => {
        const u = norm(add(up, [0, 0, 1], tilt));
        return alignY(sdf.cylinder(0.062, w), u).at(...lerp(sh, el, t));
      };
      return sdf.union(ring(0.3, 0.45, 0.02), ring(0.6, -0.45, 0.02), ring(0.88, 0.4, 0.016));
    };
    const chestPaint = sdf.union(
      sdf.extrude(profile.arc(0.045, 0.015, 215, 325), 0.3).at(-0.06, 0.345, 0.1),
      sdf.extrude(profile.arc(0.045, 0.015, 215, 325), 0.3).at(0.07, 0.36, 0.1),
      sdf.extrude(profile.rect([0.016, 0.05], 0.006), 0.3).at(0.006, 0.325, 0.1),
    );
    const warPaint = sdf.union(bands(SHOULDER, ELBOW_L), bands(mx(SHOULDER), ELBOW_R), chestPaint);
    const body = sdf
      .union(
        sdf.smoothUnion(0.02, torsoSkin, arm(SHOULDER, ELBOW_L, WRIST_L, 'L', fistL), arm(mx(SHOULDER), ELBOW_R, WRIST_R, 'R', fistR)),
        thighs,
      )
      .paintWhere(warPaint, T.paint, 0.003);
    k.body('body', body, { color: T.skin, roughness: 0.55 });

    // ------------------------------------------------------------------ fur: vest, shoulder mantles, hem trim, boots
    const shag = (x: number, y: number, z: number) => noise.fbm(x * 24, y * 16, z * 24, 2);
    const shagV = (x: number, y: number, z: number) => noise.fbm(x * 44, y * 9, z * 44, 2);
    const furPaint = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => {
      const n = noise.fbm(x * 30, y * 50, z * 30, 2);
      return n > 0 ? mixRgb(base, rgb(C.furLight), Math.min(0.6, n * 1.2)) : mixRgb(base, rgb(C.furDark), Math.min(0.7, -n * 1.4));
    };
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.058, 0.512],
            [0.1, 0.516],
            [0.136, 0.49],
            [0.15, 0.455],
            [0.138, 0.428],
            [0.1, 0.44],
            [0.058, 0.475],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.88]);
    const mantles = pair(sdf.ellipsoid([0.128, 0.078, 0.135]).rotateZ(-22).at(0.165, 0.45, -0.005).bone('upperarm.L'));
    // The vest wraps the back and the sides; the chest stays open. Its lower hem swings with `cloak`.
    const vestShell = torso.round(0.02).subtract(torso.round(0.004)).intersect(sdf.box([0.5, 0.2, 0.52]).at(0, 0.365, -0.24));
    const vestUpper = vestShell.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest');
    const vestLower = vestShell.intersect(sdf.halfSpace([0, 1, 0], 0.33)).bone('cloak');
    const vest = sdf.smoothUnion(0.025, collar.bone('chest'), mantles, vestUpper, vestLower).displace(0.011, shag);
    // Loincloth panels (front and back of each leg, with a gap in the middle) and their fur hem.
    const kiltRing = sdf
      .revolve(
        profile.polygon([
          [0.13, 0.262],
          [0.142, 0.262],
          [0.172, 0.12],
          [0.16, 0.12],
        ]),
      )
      .scale([1, 1, 0.8]);
    const panelSide = (sx: 1 | -1) =>
      sdf.union(
        ...[1, -1].map((zs) => kiltRing.smoothIntersect(0.004, sdf.box([0.078, 0.3, 0.4], 0.01).at(sx * 0.071, 0.19, zs * 0.2))),
      );
    const panelBone = (sx: 1 | -1) => (sx > 0 ? 'leg.L' : 'leg.R');
    const cloth = sdf.union(...([1, -1] as const).map((sx) => panelSide(sx).bone(panelBone(sx))));
    const hemBand = sdf.box([1, 0.05, 1]).at(0, 0.135, 0);
    const hem = sdf
      .union(...([1, -1] as const).map((sx) => panelSide(sx).round(0.008).intersect(hemBand).bone(panelBone(sx))))
      .displace(0.008, shag);
    // Shaggy fur boots: a wide displaced tube from the foot up over the knee.
    const furBoots = pair(
      sdf
        .union(
          sdf.cylinder(0.066, 0.115, 0.03).at(0.098, 0.108, 0.008),
          sdf.torus(0.058, 0.026).at(0.098, 0.15, 0.008),
          sdf.torus(0.05, 0.02).at(0.098, 0.066, 0.01),
        )
        .bone('shin.L'),
    ).displace(0.011, shagV);
    const fur = sdf.union(vest, hem, furBoots).paintFn(furPaint);
    k.body('fur', fur, { color: C.fur, roughness: 1.0, detail: 0.007, maxTriangles: 10000, bump: (x, y, z) => 0.0015 * noise.fbm(x * 160, y * 90, z * 160, 2) });
    k.body('cloth', cloth, { color: C.cloth, roughness: 0.85, detail: 0.006 });

    // ------------------------------------------------------------------ leather: strap, belt, shorts, bracers, boots
    const shell = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    // A strap across the chest from the left shoulder to the right hip.
    const strap = shell(chestShape, 0.008, 0.002).smoothIntersect(0.004, sdf.box([0.8, 0.04, 0.8], 0.006).rotateZ(38).at(0, 0.35, 0));
    const beltY = 0.25;
    const belt = torso.round(0.022).smoothIntersect(0.006, sdf.box([0.5, 0.064, 0.5], 0.008).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const shorts = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.09]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.088, 0.15, 0.002], 0.05).bone('leg.L')),
    );
    const bracer = (e: V3, w: V3) =>
      sdf.union(
        sdf.cone(lerp(e, w, 0.38), lerp(e, w, 0.98), 0.049, 0.045),
        ...[0.42, 0.7].map((t) => sdf.cone(lerp(e, w, t), lerp(e, w, t + 0.22), 0.054, 0.051).round(0.003)),
      );
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R'));
    // Three small spikes on the top and outer side of each bracer.
    const spikes = (e: V3, w: V3, side: 'L' | 'R') => {
      const u = norm(sub(w, e));
      const d = dot([0, 1, 0], u);
      const perp = norm([-d * u[0], 1 - d * u[1], -d * u[2]]);
      const out: V3 = norm(add(perp, [side === 'L' ? 1 : -1, 0, 0], 2.5));
      return sdf
        .union(
          ...[0.5, 0.68, 0.86].map((t) => {
            const c = lerp(e, w, t);
            const base = add(c, out, 0.046);
            return sdf.cone(base, add(base, out, 0.032), 0.0115, 0.002);
          }),
        )
        .bone(`forearm.${side}`);
    };
    const spikeBody = sdf.union(spikes(ELBOW_L, WRIST_L, 'L'), spikes(ELBOW_R, WRIST_R, 'R'));
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.054, 0.07, 0.02).at(0, 0.045, 0),
        sdf.ellipsoid([0.06, 0.05, 0.104]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const leather = sdf.union(strap.bone('chest'), belt.bone('spine'), shorts.paint(C.leatherDark), bracers, pair(boot.paint(C.leather)));
    k.body('leather', leather, { color: C.leather, roughness: 0.7 });
    k.body('spikes', spikeBody, { color: C.spike, roughness: 0.4, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ brass: the bear-claw buckle, strap ring
    const claw = (cx: number) => sdf.cone([cx, 0.018, 0.008], [cx * 1.7, -0.024, 0.014], 0.0085, 0.002);
    const buckle = sdf
      .union(
        sdf.cylinder(0.037, 0.012, 0.004).rotateX(90),
        sdf.torus(0.03, 0.005).rotateX(90).at(0, 0, 0.006),
        claw(-0.016),
        claw(0),
        claw(0.016),
      )
      .at(0, beltY, beltZ + 0.003)
      .bone('spine');
    const ringZ = sdf.raycast(strap, [0, 0.35, 1], [0, 0, -1])![2];
    const ring = sdf.torus(0.017, 0.006).rotateX(90).at(0, 0.35, ringZ).bone('chest');
    k.body('brass', sdf.union(buckle, ring), { color: C.brass, roughness: 0.35, metalness: 0.8 });

    // ------------------------------------------------------------------ the two crescent axes
    const blade = sdf
      .extrude(crescent, 0.036, 0.008)
      .paintFn((x, y, _z, base) => {
        const e = (x / 0.102) ** 2 + ((y + 0.024) / 0.158) ** 2;
        return y < -0.024 && e > 0.6 ? mixRgb(base, rgb(C.steelLight), Math.min(1, (e - 0.6) * 12)) : base;
      })
      .at(0, -AXE_L, 0);
    const socket = sdf.box([0.056, 0.08, 0.062], 0.012).at(0, -AXE_L + 0.005, 0);
    const rivets = sdf.union(sdf.sphere(0.012).at(0, -AXE_L - 0.09, 0.018), sdf.sphere(0.012).at(0, -AXE_L - 0.09, -0.018));
    const butt = sdf.smoothUnion(0.006, sdf.sphere(0.019).at(0, 0.058, 0), sdf.cylinder(0.018, 0.018, 0.004).at(0, 0.045, 0));
    const haftShape = sdf
      .cylinder(0.0145, 0.3, 0.004)
      .at(0, -0.06, 0)
      .union(sdf.cylinder(0.0168, 0.09, 0.004).at(0, 0.005, 0))
      .paintWhere(sdf.cylinder(0.03, 0.09).at(0, 0.005, 0), C.wrap);
    const haftBump = (x: number, y: number, z: number) => 0.001 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 240));
    for (const side of ['R', 'L'] as const) {
      const place = (s: sdf.Shape) => (side === 'R' ? axePose(s) : leftOf(axePose(s)));
      const bone = `hand.${side}`;
      k.body(`axe-${side}`, place(blade), { color: C.steel, roughness: 0.5, metalness: 0.7, detail: 0.004, bone });
      k.body(`axe-iron-${side}`, place(sdf.union(socket, butt).union(rivets.paint(C.brass))), {
        color: C.iron,
        roughness: 0.45,
        metalness: 0.8,
        detail: 0.005,
        bone,
      });
      k.body(`haft-${side}`, place(haftShape), { color: C.haft, roughness: 0.7, detail: 0.004, bone, bump: haftBump });
    }

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const POLE_REST = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
    const ID = (v: V3): V3 => v;
    const SIDE = {
      R: { m: ID, rest: ARM_R },
      L: { m: mx, rest: ARM_L },
    } as const;
    void POLE_REST_L;
    /**
     * Solves one arm and its axe. Every input is written for the right arm; the left arm gets the
     * mirror image. `wrist`, `pole`, and `dir` (grip to head) are in the chest's rest frame, `up`
     * is the flats' normal, `shrug` lifts the shoulder.
     */
    const solve = (side: 'R' | 'L', wrist: V3, pole: V3, dir: V3, up: V3, shrug: V3 = [0, 0, 0]) => {
      const { m, rest } = SIDE[side];
      const a = reach(rest, m(add(wrist, shrug, -1)), m(add(pole, shrug, -1)));
      const hand = orient([a.upper, a.lower], { dir: m(HAFT_DIR), up: m(FLAT) }, { dir: m(norm(dir)), up: m(up) });
      return { upper: a.upper, lower: a.lower, hand };
    };
    const armPose = (side: 'R' | 'L', s: { upper: V3; lower: V3; hand: V3 }, shrug?: V3) => ({
      [`upperarm.${side}`]: shrug ? { move: shrug, rotate: s.upper } : { rotate: s.upper },
      [`forearm.${side}`]: { rotate: s.lower },
      [`hand.${side}`]: { rotate: s.hand },
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        plume: { rotate: [4 * wave(p, 1, 0.4), 0, 5 * wave(p, 1, 0.3)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.2), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p, 1, 0.15), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // Legs from motion.gait (as the knight). The axe arms swing little; `carry` lifts both
    // forearms, so the axe heads stay off the ground (higher in the run).
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flow: number,
      carry: number,
    ) => ({
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
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          plume: { rotate: [flow * 0.5 + 6 * wave(p, 2, 0.2), 0, 5 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 6] as const },
          'forearm.L': { rotate: [-carry, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.2 * s, 0, -6] as const },
          'forearm.R': { rotate: [-carry, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.85, 0.1, 0.025, 0.62, 0.006, 30, 3, 5, 14));
    k.animation('run', stride(0.54, 0.14, 0.045, 0.42, 0.025, 50, 12, 20, 38));

    // attack: a double cross-chop. Both axes rise out beside the head (flats facing it), hold, then
    // come over and down in front of the face in 0.1 s and cross low in front (the left one a
    // touch later and forward); the left foot steps in. Solved by targets (as the death knight's).
    const chopKeys = [
      [0, HAFT_DIR],
      [0.14, norm([-0.8, 0.05, 0.6])],
      [0.26, norm([-0.75, 0.3, 0.6])],
      [0.34, norm([-0.85, 0.2, 0.5])], // the top: up and forward, out from the mane
      [0.44, norm([-0.85, 0.2, 0.5])], // the hold
      [0.49, norm([-0.45, 0.4, 0.8])], // over and forward
      [0.52, norm([-0.2, 0.3, 0.95])],
      [0.555, norm([-0.2, 0.1, 1])], // the impact: forward and a little out
      [0.6, norm([-0.15, -0.05, 1])], // the follow-through, low in front
      [0.76, norm([-0.15, -0.05, 1])],
      [0.88, norm([-0.6, -0.4, 0.7])],
      [1, HAFT_DIR],
    ] as const;
    const chopAt = (p: number) => keys(p, chopKeys, 'spline');
    const chopWrist = [
      [0, WRIST_R],
      [0.14, [-0.27, 0.36, 0.14]],
      [0.26, [-0.28, 0.39, 0.2]],
      [0.34, [-0.29, 0.37, 0.24]],
      [0.44, [-0.29, 0.37, 0.24]],
      [0.49, [-0.22, 0.42, 0.22]],
      [0.52, [-0.16, 0.38, 0.2]],
      [0.555, [-0.12, 0.34, 0.19]],
      [0.6, [-0.11, 0.34, 0.19]],
      [0.76, [-0.11, 0.34, 0.19]],
      [0.88, [-0.17, 0.3, 0.12]],
      [1, WRIST_R],
    ] as const;
    k.animation('attack', {
      duration: 1.05,
      loop: false,
      pose: (_t, p0) => {
        const wind = ease(0, 0.32, p0) * (1 - ease(0.44, 0.53, p0));
        const cut = ease(0.47, 0.58, p0) * (1 - ease(0.78, 1, p0));
        const shrug: V3 = [0, 0.03 * wind, 0];
        const sideArm = (side: 'R' | 'L') => {
          const late = side === 'L' ? 0.018 : 0;
          const p = Math.max(0, p0 - late);
          const wrist0 = keys(p, chopWrist, 'spline');
          const wrist: V3 = side === 'L' ? wrist0 : wrist0;
          // The elbows point out to the sides in the wind-up, then out and down through the chop.
          const pole = keys(p, [[0, POLE_REST], [0.3, [-0.4, 0.4, 0.0]], [0.46, [-0.4, 0.4, 0.04]], [0.56, [-0.3, 0.25, 0.08]], [0.78, [-0.3, 0.25, 0.08]], [1, POLE_REST]] as const);
          const dirAt = (q: number) => chopAt(Math.max(0, q - late));
          const side1 = norm(keys(p, [[0, FLAT], [0.2, [1, 0, 0.2]], [0.8, [1, 0, 0.2]], [1, FLAT]] as const));
          return armPose(side, solve(side, wrist, pole, dirAt(p0), edgeUp(dirAt, p0, side1), shrug), shrug);
        };
        const bob = keys(p0, [[0, 0], [0.56, 0], [0.62, 1], [0.72, -0.45], [0.82, 0.15], [0.92, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 20 * cut) - 0.004 * wind, 0.03 * cut - 0.012 * wind], rotate: [0, 0, 0] },
          spine: { rotate: [-7 * wind + 10 * cut, 0, 0] },
          chest: { rotate: [-6 * wind + 6 * cut, 0, 0] },
          head: { rotate: [3 * wind - 10 * cut + 5 * bob, 0, 2 * bob] },
          plume: { rotate: [8 * wind - 14 * cut + 10 * bob, 0, -6 * wind] },
          cloak: { rotate: [-4 * wind + 10 * cut, 0, 0] },
          ...sideArm('R'),
          ...sideArm('L'),
          // The front (left) foot steps in; the back leg pushes.
          'leg.L': { rotate: [3 * wind - 20 * cut, 0, 0] },
          'foot.L': { rotate: [-3 * wind + 20 * cut, 0, 0] },
          'leg.R': { rotate: [-3 * wind + 14 * cut, 0, 0] },
          'foot.R': { rotate: [3 * wind - 14 * cut, 0, 0] },
        };
      },
    });

    // attack2: a spinning double sweep. Both arms swing out level, the flats up, and the whole body
    // spins once on the spot so the two blades sweep a full circle; the mane flares out. Then the
    // arms come back down.
    k.animation('attack2', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const out = ease(0.04, 0.2, p) * (1 - ease(0.8, 0.96, p));
        const spin = ease(0.2, 0.78, p);
        const flare = ease(0.2, 0.32, p) * (1 - ease(0.72, 0.92, p));
        const wind = ease(0, 0.2, p) * (1 - ease(0.2, 0.3, p));
        const wrist = lerp(WRIST_R, [-0.27, 0.36, 0.04], out);
        const pole = lerp(POLE_REST, [-0.5, 0.25, -0.3], out);
        const dirOut = (y: number) => norm(lerp(HAFT_DIR, norm([-1, y, 0.05]), out));
        const upOut = norm(lerp(FLAT, [0, 1, 0], out));
        const lag = keys(p, [[0, 0], [0.3, 0.6], [0.5, -1], [0.64, 0.5], [0.8, -0.2], [1, 0]] as const, 'spline');
        return {
          hips: { rotate: [0, 18 * wind - 360 * spin, 0] },
          spine: { rotate: [-3 * wind, 0, 0] },
          head: { rotate: [0, 0, 0] },
          plume: { rotate: [6 * lag, 0, 22 * flare] },
          cloak: { rotate: [4 * flare, 0, 10 * flare] },
          ...armPose('R', solve('R', wrist, pole, dirOut(0.12), upOut)),
          ...armPose('L', solve('L', wrist, pole, dirOut(-0.06), upOut)),
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the arms jolt out; the mane and the vest lag.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.26, 1], [0.48, -0.45], [0.72, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          plume: { rotate: [18 * lag, 0, 6 * lag] },
          cloak: { rotate: [9 * lag, 0, 0] },
          'upperarm.R': { rotate: [8 * h, 0, -10 * h - 6 * jolt] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [8 * h + 4 * jolt, 0, 10 * h + 6 * jolt] },
          'forearm.L': { rotate: [-12 * h + 10 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back (as the
    // knight). Both arms fall out to the sides with the axes flat on the ground; the vest hem
    // flattens under him (scale).
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045,
      back: 0.15,
      neck: 9,
      head: 12,
      cape: 8,
      capeFlat: 0.4,
      leg: 34,
      wrist: [-0.3, 0.33, -0.04] as V3,
      axe: norm([-0.52, -0.85, -0.14]),
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f; // the fall starts slowly and ends fast
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const flat = keys(p, [[0.28, 0], [0.56, 1]] as const);
        const crumple = keys(p, [[0.3, 0], [0.48, 1], [0.7, 1], [0.9, 0]] as const);
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        const wrist = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wrist]] as const);
        const pole = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.8, 0.3, -0.2]]] as const);
        const haft = norm(keys(p, [[0, HAFT_DIR], [0.1, norm([-0.75, -0.45, 0.48])], [0.4, norm([-0.75, -0.55, 0.36])], [0.74, D.axe]] as const));
        const flatUp = norm(keys(p, [[0, FLAT], [0.4, FLAT], [0.74, [0, 0, 1]]] as const));

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
        const legL = -plant + D.leg * g * g;
        const sole = D.tilt * g - D.leg * g * g;
        const toes = keys(p, [[0.56, 0], [0.76, 1]] as const);
        return {
          hips: {
            move: [0, -legDrop(LEG, plant) * stand - D.drop * g + 0.014 * Math.sin(Math.PI * f) + 0.012 * land, -0.03 * stag - D.back * g],
            rotate: [-4 * hitB - 4 * stag * stand - D.tilt * g, 0, 0],
          },
          spine: { rotate: [-6 * hitB + 5 * stag * stand, 0, 0] },
          chest: { rotate: [-8 * hitB + 4 * stag * stand, 5 * hitB, 3 * stag * stand] },
          neck: { rotate: [-5 * hitB + D.neck * g, 0, 0] },
          head: { rotate: [-12 * hitB + D.head * g, 22 * g, 0] },
          plume: { rotate: [18 * lag - 22 * toes, 0, 6 * lag] },
          cloak: {
            rotate: [8 * hitB - D.cape * flat - 12 * crumple, 0, 0],
            scale: [1 + 0.1 * flat, 1 - 0.15 * crumple, 1 - (1 - D.capeFlat) * flat],
          },
          ...armPose('R', solve('R', wrist, pole, haft, flatUp)),
          ...armPose('L', solve('L', wrist, pole, haft, flatUp)),
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // victory: both axes go up high beside the head, the flats facing the head (the blades point
    // front and back, clear of the mane). Then a proud nod, and he holds the pose with the chin up.
    // The mane and the vest sway.
    const WIN = {
      wrist: [-0.29, 0.42, 0.22] as V3,
      haft: norm([-0.72, 0.5, 0.45]),
      flat: norm([-0.2, 0.2, 1]),
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');

        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.27, 0.37, 0.1]],
            [0.26, [-0.29, 0.41, 0.22]],
            [0.32, [-0.29, 0.415, 0.22]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const pole = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const haft = norm(
          keys(p, [[0, HAFT_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.7, 0.5, 0.5])], [0.32, norm([-0.72, 0.5, 0.46])], [0.42, WIN.haft]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.12, [-0.3, 0.2, 1]], [0.26, WIN.flat]] as const));
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, 0] },
          chest: { rotate: [-2 * r, 0, 0] },
          neck: { rotate: [1.5 * nod, 0, 0] },
          head: { rotate: [-6 * look + 4 * nod - 3 * pride, -8 * look, 0] },
          plume: { rotate: [12 * lag, 0, 6 * sway] },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          ...armPose('R', solve('R', wrist, pole, haft, flatUp), [0, 0.015 * r, 0]),
          ...armPose('L', solve('L', wrist, pole, haft, flatUp), [0, 0.015 * r, 0]),
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        };
      },
    });
  },
});
