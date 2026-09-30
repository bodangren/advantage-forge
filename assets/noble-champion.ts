import { defineAsset, mixRgb, motion, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Noble Champion — Chibi Quest hero (catalog `heroes/support/noble-champion`), about 1.0 m to the
 * top of the hair, faces +Z. Target: docs/hero-mockups/noble-champion_001.jpg (one front view; side
 * and back are designed here; the mockup's beard is skipped: every hero on this set is beardless).
 * Built on the paladin (the knight's body, face, and chibi skeleton with knee bones).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the white and gold plate, the blue
 *   scarf, tabard, and cape, the dark swept hair, and the level sword must read.
 * One idea: a young noble in ornate white plate rimmed with gold, a blue scarf and cape, dark
 *   hair swept to his right, and a longsword held level in both hands in front of the waist.
 * Proportions: hair top 1.0, eyes 0.63, chin 0.48, shoulders 0.44 (pauldrons), belt 0.25,
 *   tabard tip 0.105, knees 0.11; the sword at y 0.285, point 0.51 out to his left.
 * Palette (60/30/10): plate white #f0ece4 (shade #c8c4bc, mid value steel #7d8590 for the
 *   gauntlets), blue #3f7ad0 (scarf, tabard, cape; folds #2a5aa0), gold #e0b040 (rims, rivets,
 *   crest, boots). Skin #f2c7a4, hair #3a2418, gem #40c0e0, belt #6b4226.
 * Value plan: the white cuirass and the pale face are the focal masses; the dark hair and the blue
 *   cape frame them; gold is the rim and the small accents; the gem is the one cool glow.
 * Bodies: skin, hair, scarf, cuirass, pauldrons, tassets, armguards, mail, gauntlets, belt,
 *   tabard-skirt, cape, leggings, boots, gold, gem, blade, sword-gold, grip.
 * Rig: the paladin's skeleton; the `plume` bone sways the top curl of the hair, `cloak` the cape.
 *   The sword is rigid on the right hand; the left hand is on the grip too, so every clip solves
 *   both arms to the sword's pose. Clips: idle, walk, run, attack (a two-hand horizontal sweep),
 *   attack2 (an overhead cut), hit, death (he falls on his back), victory (the sword raised).
 */

const C = {
  skin: '#f2c7a4',
  earInner: '#eaa98e',
  blush: '#f09a86',
  freckle: '#d9967a',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#0d1114',
  lid: '#16100c',
  brow: '#2a1a10',
  mouth: '#a4503f',
  hair: '#3a2418',
  hairDark: '#241608',
  plate: '#e0e2e6',
  plateShade: '#b4b8c0',
  steel: '#7d8590',
  mail: '#5d6672',
  gold: '#e0b040',
  goldShade: '#b08a3a',
  blue: '#3f7ad0',
  blueDark: '#2a5aa0',
  gem: '#40c0e0',
  gemBase: '#104050',
  leather: '#6b4226',
  leggings: '#56606e',
  blade: '#c3c8cf',
  grip: '#3a2a20',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const DEG = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scl(a, 1 / len(a));
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * DEG);
  const s = Math.sin(d * DEG);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * DEG);
  const s = Math.sin(d * DEG);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const rot = (q: THREE.Quaternion, v: V3): V3 => {
  const w = new THREE.Vector3(v[0], v[1], v[2]).applyQuaternion(q);
  return [w.x, w.y, w.z];
};

/** The elbow of a two-bone arm from the shoulder to a wrist target, bent toward `pole`. */
const elbowOf = (s: V3, w: V3, a: number, b: number, pole: V3): V3 => {
  const t = sub(w, s);
  const d = Math.min(len(t), a + b - 1e-4);
  const td = norm(t);
  const pp = sub(pole, s);
  const side = norm(sub(pp, scl(td, dot(pp, td))));
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  return add(s, add(scl(td, a * cosA), scl(side, a * sinA)));
};

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const FIST_SCALE = 1;
/** A gold gauntlet fist hanging from the wrist at the origin: a rounded block (the grip axis is local Z), fingers along the front, a thumb on top. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.01,
    sdf.box([0.072, 0.076, 0.05], 0.024).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.006 * s, -0.066, -0.016], [-0.006 * s, -0.066, 0.016], 0.016),
    sdf.capsule([0.042 * s, -0.022, -0.014], [0.042 * s, -0.022, 0.014], 0.012),
  );
// Both fists grip the sword along the X axis: the hand's grip axis (local Z) turns to +X, the
// finger roll to the front.
const HAND_R = { pitch: -90, roll: -90 };
const HAND_L = { pitch: -90, roll: 90 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const fistOffset = (h: { pitch: number; roll: number }, s: 1 | -1): V3 => rotZ(rotX(scl([0.007 * s, -0.04, 0.004], FIST_SCALE), h.pitch), h.roll);

/** Turn a shape built along +Y so its axis runs a to b (call `.at(...)` afterwards). */
const alongAxis = (s: sdf.Shape, a: V3, b: V3) => {
  const d = norm(sub(b, a));
  return s.rotateX(Math.acos(Math.max(-1, Math.min(1, d[1]))) / DEG).rotateY(Math.atan2(d[0], d[2]) / DEG);
};

// Joints. Both hands hold the sword level in front of the waist: the grip center G, the fists 3 cm
// to each side of it. The arms are a little longer than the paladin's so both hands reach it.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ARM_UP = 0.082;
const ARM_LO = 0.118;
const G: V3 = [0, 0.285, 0.152];
const FIST_R = add(G, [-0.035, 0, 0]);
const FIST_L = add(G, [0.035, 0, 0]);
const WRIST_R = sub(FIST_R, fistOffset(HAND_R, -1));
const WRIST_L = sub(FIST_L, fistOffset(HAND_L, 1));
const ELBOW_R = elbowOf(mx(SHOULDER), WRIST_R, ARM_UP, ARM_LO, [-0.5, 0.2, -0.1]);
const ELBOW_L = elbowOf(SHOULDER, WRIST_L, ARM_UP, ARM_LO, [0.5, 0.2, -0.1]);
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left sabaton (y = 0), measured on the SDF: heel and toe.
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];

export default defineAsset({
  name: 'noble-champion',
  description: 'Chibi noble champion hero with swept dark hair, white and gold plate, a blue scarf, tabard, and cape, and a longsword held level in both hands.',
  detail: 0.006,
  reference: 'docs/hero-mockups/noble-champion_001.jpg',
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { blue: C.blue, crimson: '#9a2c34', emerald: '#2a6a3a' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'blue' },
    crimson: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'crimson' },
    emerald: { eyes: 'green', hair: 'blond', skin: 'fair', clothing: 'emerald' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
      freckle: k.tint('skin', { color: C.freckle, follow: 1 }),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.blueDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0.02, 0.87, 0.05]; // the root of the top curl of the hair
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [-0.04, 0.96, 0] },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');

    // Small round human ears: a thin oval with a hollow, turned a little to the front.
    const earPose = (s: sdf.Shape) => s.rotateZ(-6).rotateY(-12).at(0.207, 0.636, -0.012);
    const earLocal = sdf.ellipsoid([0.026, 0.047, 0.035]).smoothSubtract(0.006, sdf.ellipsoid([0.024, 0.031, 0.023]).at(0.016, 0.002, 0.004));
    const earHollow = earPose(sdf.ellipsoid([0.028, 0.034, 0.025]).at(0.016, 0.002, 0.004));
    const ears = pair(earPose(earLocal).bone('head'));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.014, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.017),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Heavy, straight brows, the inner ends low: a proud, steady look.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.03, 75, 105), 0.3).at(0, -0.16, 0.1).rotateZ(9).at(0.104, 0.716, 0));
    // A calm, proud mouth: a short, nearly straight line with a slight curve.
    const mouth = sdf.extrude(profile.arc(0.2, 0.013, 255, 285), 0.3).at(0, 0.532 + 0.2, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.118, 0.575],
            [0.14, 0.582],
            [0.156, 0.568],
            [0.132, 0.558],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.0055), x, y)),
      ),
    );
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .paintWhere(pair(earHollow), T.earInner, 0.006)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(freckles, T.freckle, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: thick locks swept to his right (-X)
    // `hp` puts a strand point on the skull (a point in that direction from the head center) and
    // lifts the strand's center off it by part of its radius, so the locks lie on the head.
    const hp = (x: number, y: number, z: number, r: number, lift = 0.5): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const faceMask = sdf.ellipsoid([0.25, 0.165, 0.24]).at(0, 0.612, 0.15);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.016, HEAD[1] + 0.02, HEAD[2] + 0.016])
      .at(0, HEAD_Y + 0.008, -0.012)
      .smoothSubtract(0.015, faceMask)
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.55));
    const R = (x: number, y: number, z: number, r: number): [number, number, number, number] => [x, y, z, r];
    // Two bold locks curl over the brows: the big one sweeps from the crown across the forehead to
    // the right brow, a smaller one curls the other way.
    const sweep = sdf.chain(
      [hp(0.06, 0.885, 0.07, 0.04, 0.75), hp(-0.03, 0.88, 0.14, 0.042, 0.75), hp(-0.09, 0.83, 0.16, 0.036, 0.75), hp(-0.135, 0.775, 0.13, 0.026, 0.75), hp(-0.165, 0.73, 0.1, 0.01, 0.75)],
      0.012,
    );
    const curlL = sdf.chain(
      [hp(0.07, 0.875, 0.09, 0.036, 0.75), hp(0.13, 0.83, 0.125, 0.03, 0.75), hp(0.17, 0.78, 0.105, 0.02, 0.75), hp(0.185, 0.74, 0.09, 0.008, 0.75)],
      0.012,
    );
    // Tall waves sweep up and back from the brow line and lean to his right over the crown.
    const wave1 = sdf.chain([hp(0.105, 0.84, 0.125, 0.04, 0.75), R(0.085, 0.92, 0.06, 0.046), R(0.04, 0.95, -0.01, 0.042), R(-0.02, 0.945, -0.07, 0.026)], 0.02);
    const wave2 = sdf.chain([hp(0.0, 0.87, 0.125, 0.042, 0.75), R(0.0, 0.935, 0.07, 0.048), R(-0.06, 0.955, 0.0, 0.042), R(-0.12, 0.94, -0.06, 0.026)], 0.02).bone('plume');
    const wave3 = sdf.chain([hp(-0.085, 0.855, 0.125, 0.04, 0.75), R(-0.1, 0.915, 0.06, 0.044), R(-0.15, 0.93, -0.01, 0.036), R(-0.215, 0.905, -0.05, 0.02)], 0.02).bone('plume');
    const wave4 = sdf.chain([hp(0.155, 0.8, 0.05, 0.038, 0.75), R(0.17, 0.885, 0.0, 0.042), R(0.125, 0.94, -0.06, 0.038), R(0.07, 0.95, -0.12, 0.022)], 0.02);
    const wave5 = sdf.chain([hp(0.09, 0.8, -0.12, 0.04, 0.75), R(0.06, 0.895, -0.165, 0.044), R(-0.02, 0.94, -0.155, 0.036), R(-0.1, 0.935, -0.12, 0.02)], 0.02);
    const wave6 = sdf.chain([hp(-0.06, 0.8, -0.14, 0.04, 0.75), R(-0.12, 0.89, -0.14, 0.044), R(-0.19, 0.905, -0.1, 0.034), R(-0.24, 0.88, -0.05, 0.016)], 0.02);
    // Locks at the temples; tips flick out above the ears and at the nape.
    const temples = pair(sdf.chain([hp(0.17, 0.79, 0.05, 0.03, 0.75), hp(0.2, 0.71, 0.06, 0.022, 0.75), hp(0.207, 0.65, 0.065, 0.009, 0.75)], 0.012));
    const earFlick = pair(sdf.chain([hp(0.17, 0.79, -0.02, 0.03, 0.75), hp(0.21, 0.73, -0.03, 0.026, 0.75), R(0.262, 0.7, -0.03, 0.01)], 0.012));
    const napeFlick = pair(sdf.chain([hp(0.08, 0.64, -0.17, 0.03, 0.75), hp(0.09, 0.57, -0.185, 0.024, 0.75), R(0.13, 0.525, -0.215, 0.009)], 0.012));
    const backMid = sdf.chain([hp(0.0, 0.8, -0.18, 0.034, 0.75), hp(-0.02, 0.68, -0.2, 0.03, 0.75), R(-0.06, 0.58, -0.22, 0.01)], 0.012);
    const locks = sdf.smoothUnion(0.014, cap, sweep, curlL, wave1, wave4, wave5, wave6, temples, earFlick, napeFlick, backMid);
    const hair = sdf
      .smoothUnion(0.014, locks.bone('head'), wave2, wave3)
      .paintFn((x, y, z, base) => {
        const w = Math.sin(x * 55 + y * 38 + Math.sin(z * 30) * 2);
        return w > 0.15 ? mixRgb(base, rgb(T.hairDark), Math.min(0.9, (w - 0.15) * 1.6)) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ scarf
    const scarf = sdf
      .smoothUnion(
        0.012,
        sdf.torus(0.079, 0.034).scale([1, 1, 0.92]).at(0, 0.472, -0.004),
        sdf.ellipsoid([0.034, 0.028, 0.022]).at(0.02, 0.45, 0.092),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.455), T.clothDark, 0.02);
    k.body('scarf', scarf.bone('neck'), { color: T.cloth, roughness: 0.85 });

    // ------------------------------------------------------------------ torso: cuirass
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
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const ridge = sdf.capsule([0, 0.43, 0.105], [0, 0.29, 0.112], 0.014).scale([0.8, 1, 1]);
    const cuirass = torso
      .round(0.014)
      .smoothUnion(0.02, ridge)
      .intersect(sdf.halfSpace([0, -1, 0], -0.248))
      .intersect(sdf.halfSpace([0, 1, 0], 0.47))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.285), C.plateShade, 0.03);
    const plate = { color: C.plate, roughness: 0.45, metalness: 0.5 } as const;
    k.body('cuirass', cuirass, { ...plate, bone: 'chest' });
    // A raised shell around the cuirass for strokes and emblems that follow the chest.
    const layer = (out: number, inn: number) => cuirass.round(out).subtract(cuirass.round(inn));
    const stroke = (p: sdf.Shape, h = 0.008) => layer(h, -0.002).smoothIntersect(0.004, p);
    // Gold: the curved line across the lower chest, a rim down the center ridge, and rivets.
    const V_LINE = profile.polygon([
      [-0.125, 0.356],
      [0, 0.31],
      [0.125, 0.356],
      [0.125, 0.338],
      [0, 0.292],
      [-0.125, 0.338],
    ]);
    const chestLine = stroke(sdf.extrude(V_LINE, 0.4).at(0, 0, 0.2), 0.009);
    const chestLine2 = stroke(sdf.extrude(profile.arc(0.15, 0.007, 240, 300), 0.4).at(0, 0.385 + 0.15, 0.2), 0.006);
    const rivetAt = (x: number, y: number) => sdf.surfacePoint(cuirass, [x, y, 0.3], 0.001);
    const chestRivets = pair(
      sdf.union(...([[0.07, 0.43], [0.098, 0.385], [0.108, 0.34]] as const).map(([x, y]) => sdf.sphere(0.0075).at(...rivetAt(x, y)))),
    );
    // The lion crest: a crowned gold shield 0.06 tall on the chest, a gem under it.
    const CREST_Y = 0.385;
    const CREST = profile.polygon([
      [-0.028, 0.03],
      [-0.014, 0.019],
      [0, 0.032],
      [0.014, 0.019],
      [0.028, 0.03],
      [0.027, -0.004],
      [0.016, -0.022],
      [0, -0.03],
      [-0.016, -0.022],
      [-0.027, -0.004],
    ]);
    const CREST_IN = profile.offsetProfile(CREST, -0.007);
    const crestZ = sdf.raycast(cuirass, [0, CREST_Y, 1], [0, 0, -1])![2];
    const crest = sdf
      .union(
        sdf.extrude(CREST, 0.03, 0.004).at(0, CREST_Y, crestZ),
        sdf.extrude(profile.circle(0.012), 0.04, 0.004).at(0, CREST_Y + 0.004, crestZ),
      )
      .subtract(sdf.extrude(CREST_IN, 0.02).at(0, CREST_Y, crestZ + 0.014));
    const crestLion = sdf.extrude(
      profile.polygon([
        [-0.012, -0.012],
        [-0.014, 0.004],
        [-0.006, 0.014],
        [0.006, 0.014],
        [0.014, 0.004],
        [0.012, -0.012],
        [0, -0.018],
      ]),
      0.03,
      0.003,
    ).at(0, CREST_Y + 0.002, crestZ + 0.004);
    // The blue gem at the throat, in a gold setting.
    const THROAT_Y = 0.432;
    const throatZ = sdf.raycast(cuirass, [0, THROAT_Y, 1], [0, 0, -1])![2];
    const gemAt: V3 = [0, THROAT_Y, throatZ + 0.006];
    const gemSetting = sdf.torus(0.017, 0.0065).rotateX(90).at(0, THROAT_Y, throatZ + 0.004);
    k.body('gem', sdf.sphere(0.0135).at(...gemAt).bone('chest'), {
      color: C.gemBase,
      roughness: 0.15,
      emissive: C.gem,
      emissiveIntensity: 0.6,
      flat: true,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ mail: a short skirt and sleeves
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const skirt = torso.round(0.006).smoothIntersect(0.006, sdf.box([0.5, 0.086, 0.5], 0.01).at(0, 0.219, 0));
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    k.body('mail', sdf.union(skirt.bone('hips'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.mail,
      roughness: 0.55,
      metalness: 0.7,
      bump: rings,
    });

    // ------------------------------------------------------------------ pauldrons (two lames each)
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.432, 0);
    const pauldronLocal = sdf.union(lame(1), lame(1.14).at(0, -0.034, 0).paintWhere(sdf.halfSpace([0, 1, 0], -0.05), C.plateShade, 0.02));
    k.body('pauldrons', pair(pauldronPose(pauldronLocal).bone('upperarm.L')), { ...plate });
    // Gold rims: a raised band around the lower edge of each lame, and four rivets on the upper lame.
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.006)
        .smoothIntersect(0.004, sdf.box([0.4, 0.014, 0.4]).at(0, -0.008 * s, 0))
        .at(0, y, 0);
    const rivetLocal = sdf.union(
      ...[-58, -20, 20, 58].map((a) => {
        const r = sdf.surfacePoint(lame(1), [0.3 * Math.cos(a * DEG), 0.07, 0.3 * Math.sin(a * DEG)], 0.002);
        return sdf.sphere(0.0085).at(...r);
      }),
    );
    // A bold gold band that runs up the front edge and swoops up at the outer corner.
    const swoopAt = (phi: number, e: number, r: number, lift: number): [number, number, number, number] => {
      const q = sdf.surfacePoint(lame(1), [0.3 * Math.cos(phi * DEG), 0.3 * e, 0.3 * Math.sin(phi * DEG)], lift);
      return [q[0], q[1], q[2], r];
    };
    const swoop = sdf.chain(
      [swoopAt(88, 0.04, 0.0075, 0.002), swoopAt(60, 0.12, 0.0075, 0.002), swoopAt(28, 0.3, 0.0075, 0.002), swoopAt(0, 0.6, 0.007, 0.002), swoopAt(-28, 0.85, 0.006, 0.002)],
      0.01,
    );
    const pauldronGold = pair(pauldronPose(sdf.union(edge(1, 0), edge(1.14, -0.034), rivetLocal, swoop)).bone('upperarm.L'));

    // ------------------------------------------------------------------ vambraces (white) and fists (steel)
    const VAMB_R = (t: number) => 0.041 + 0.006 * ((t - 0.15) / 0.87);
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.041, 0.047).round(0.003);
    const ring = (e: V3, w: V3, t: number, tag: string) =>
      alongAxis(sdf.torus(VAMB_R(t) + 0.003, 0.0068), e, w).at(...lerp(e, w, t)).bone(tag);
    const armGold = sdf.union(
      ring(ELBOW_L, WRIST_L, 0.2, 'forearm.L'),
      ring(ELBOW_L, WRIST_L, 0.94, 'forearm.L'),
      ring(mx(ELBOW_L), mx(WRIST_L), 0.2, 'forearm.R'),
      ring(mx(ELBOW_L), mx(WRIST_L), 0.94, 'forearm.R'),
    );
    const armSide = (e: V3, w: V3, tag: string) => vambrace(e, w).bone(tag);
    k.body('armguards', sdf.union(armSide(ELBOW_L, WRIST_L, 'forearm.L'), armSide(ELBOW_R, WRIST_R, 'forearm.R')), { ...plate });
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    k.body('gauntlets', sdf.union(fistL.bone('hand.L'), fistR.bone('hand.R')), { color: C.gold, roughness: 0.35, metalness: 0.8 });

    // ------------------------------------------------------------------ belt, tassets, tabard panel
    const beltY = 0.252;
    const belt = cuirass.round(0.013).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.extrude(profile.rect([0.092, 0.054], 0.014), 0.014, 0.004),
        sdf.extrude(profile.circle(0.017), 0.022, 0.006),
      )
      .at(0, beltY, beltZ + 0.002);

    // Four tasset plates hang round the hips (two each side), each with one gold rim along its
    // lower edge. The blue panel covers the front between them.
    const hipShell = torso.round(0.02).subtract(torso.round(0.004));
    const slab = (phi: number, w: number, y0: number, y1: number) =>
      sdf.box([w, y1 - y0, 0.3], Math.min(0.008, (y1 - y0) / 2 - 0.0005)).at(0, (y0 + y1) / 2, 0.2).rotateY(phi);
    const PLATES = [
      [46, 0.145],
      [90, 0.145],
    ] as const;
    const tassetL = sdf.union(...PLATES.map(([phi, y0]) => hipShell.smoothIntersect(0.004, slab(phi, 0.084, y0, 0.262)).bone('leg.L')));
    k.body('tassets', hard(tassetL), { ...plate });
    const tassetRimL = sdf.union(
      ...PLATES.map(([phi, y0]) =>
        torso.round(0.024).subtract(torso.round(0.002)).smoothIntersect(0.004, slab(phi, 0.084, y0, y0 + 0.014)).bone('leg.L'),
      ),
    );

    // The blue tabard panel under the belt: a pointed banner with a gold border and two studs.
    const PANEL = profile.polygon([
      [-0.052, 0.262],
      [0.052, 0.262],
      [0.056, 0.17],
      [0.03, 0.135],
      [0, 0.104],
      [-0.03, 0.135],
      [-0.056, 0.17],
    ]);
    const STUD = profile.polygon([
      [0, 0.234],
      [0.013, 0.213],
      [0, 0.192],
      [-0.013, 0.213],
    ]);
    const panelPose = (s: sdf.Shape) => s.rotateX(-8).at(0, 0, 0.144);
    const panel = panelPose(sdf.extrude(PANEL, 0.014, 0.005))
      .paintWhere(panelPose(sdf.extrude(STUD, 0.1)), C.gold)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.13), T.clothDark, 0.03);
    k.body('tabard-skirt', panel.bone('hips'), { color: T.cloth, roughness: 0.8 });
    const panelEdge = panelPose(sdf.extrude(PANEL, 0.018, 0.005).subtract(sdf.extrude(profile.offsetProfile(PANEL, -0.011), 0.1))).bone('hips');

    // ------------------------------------------------------------------ cape
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
    const capeInner = capeCone(0.168, 0.27, 0.46, 0.045).at(0, 0, -0.025);
    const cape = capeCone(0.19, 0.295, 0.44, 0.075)
      .at(0, 0, -0.025)
      .subtract(capeInner)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(capeInner.round(0.005), T.clothDark, 0.004)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.1), C.gold, 0.004);
    k.body('cape', cape.bone('cloak'), { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ legs: leggings, greaves, knee cops, boots
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.leggings, roughness: 0.85 });
    const greave = sdf
      .union(
        sdf.cone([0.0965, 0.099, 0.006], [0.0975, 0.083, 0.005], 0.05, 0.0515).round(0.003),
        sdf.cone([0.0985, 0.077, 0.004], [0.099, 0.06, 0.004], 0.0525, 0.053).round(0.003),
      )
      .bone('leg.L');
    k.body('armguards-legs', pair(greave), { ...plate });
    const greaveRings = pair(
      sdf
        .union(sdf.torus(0.0525, 0.0068).at(0.0965, 0.1, 0.006), sdf.torus(0.052, 0.0065).at(0.098, 0.08, 0.005), sdf.torus(0.0535, 0.0068).at(0.099, 0.059, 0.004))
        .bone('leg.L'),
    );
    const kneeCop = pair(
      sdf
        .smoothUnion(0.012, sdf.ellipsoid([0.064, 0.04, 0.058]).at(0.095, 0.114, 0.022), sdf.ellipsoid([0.016, 0.034, 0.034]).at(0.095, 0.114, 0.07))
        .bone('leg.L'),
    );
    const sabatonFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeLines = sdf.union(
      sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06),
      sdf.box([0.2, 0.006, 0.2]).rotateX(-40).at(0, 0.058, 0.1),
    );
    const sabaton = sabatonFoot
      .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), C.goldShade, 0.004)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(sabaton), { color: C.gold, roughness: 0.35, metalness: 0.8 });

    // ------------------------------------------------------------------ the gold body
    k.body(
      'gold',
      sdf.union(
        buckle.bone('spine'),
        pauldronGold,
        chestLine.bone('chest'),
        chestLine2.bone('chest'),
        chestRivets.bone('chest'),
        crest.bone('chest'),
        crestLion.bone('chest'),
        gemSetting.bone('chest'),
        hard(tassetRimL),
        panelEdge,
        armGold,
        greaveRings,
        kneeCop,
      ),
      { color: C.gold, roughness: 0.35, metalness: 0.8 },
    );

    // ------------------------------------------------------------------ the longsword (rigid on the right hand)
    // Local frame: the grip center at the origin, the blade along +X, the flat facing +Z, the guard
    // across Y (0.14 wide). Blade 0.42 long and 0.05 wide, a gold guard and pommel.
    const swordPose = (s: sdf.Shape) => s.at(...G);
    const BL0 = 0.094;
    const BL1 = 0.454; // a broad blade 0.36 long, 0.045 wide, 0.01 thick
    const bladeRaw = sdf
      .extrude(
        profile.polygon([
          [BL0, -0.0225],
          [BL1 - 0.06, -0.0225],
          [BL1, 0],
          [BL1 - 0.06, 0.0225],
          [BL0, 0.0225],
        ]),
        0.01,
        0.003,
      )
    ;
    const bladeShape = swordPose(bladeRaw).paintFn((wx, wy, _wz, base) => {
      const x = wx - G[0];
      const y = wy - G[1];
      if (Math.abs(y) > 0.0178 && x < BL1 - 0.03) return rgb('#f4f7fa'); // the bright edge
      if (Math.abs(y) < 0.0055 && x > BL0 + 0.01 && x < BL1 - 0.05) return rgb('#8f97a2'); // the fuller
      return base;
    });
    k.body('blade', bladeShape, { color: C.blade, roughness: 0.28, metalness: 0.85, detail: 0.004, bone: 'hand.R' });
    // An ornate gold cross guard 0.09 wide with curled ends, a gold pommel.
    const guard = sdf.union(
      sdf.box([0.02, 0.09, 0.028], 0.008).at(0.085, 0, 0),
      ...[1, -1].map((sy) => sdf.union(sdf.sphere(0.012).at(0.085, 0.048 * sy, 0), sdf.torus(0.012, 0.0045).rotateX(90).at(0.1, 0.05 * sy, 0))),
      sdf.cylinder(0.019, 0.016, 0.005).rotateZ(90).at(0.072, 0, 0),
      sdf.sphere(0.024).at(-0.1, 0, 0),
      sdf.cylinder(0.016, 0.012, 0.004).rotateZ(90).at(-0.082, 0, 0),
    );
    k.body('sword-gold', swordPose(guard), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'hand.R' });
    k.body('sword-gem', swordPose(sdf.sphere(0.0095).at(0.088, 0, 0.014)), {
      color: C.gemBase,
      roughness: 0.15,
      emissive: C.gem,
      emissiveIntensity: 0.6,
      flat: true,
      detail: 0.003,
      bone: 'hand.R',
    });
    k.body('grip', swordPose(sdf.capsule([-0.085, 0, 0], [0.076, 0, 0], 0.0145)), { color: C.grip, roughness: 0.8, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const curl = (x: number, y: number, z: number) => [0.35 * x, 0.35 * y, 0.35 * z] as const;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const Z3: V3 = [0, 0, 0];
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const WR_OFF = sub(WRIST_R, G); // the wrists in the sword's frame
    const WL_OFF = sub(WRIST_L, G);
    const REST = { dir: [1, 0, 0] as V3, up: [0, 1, 0] as V3 };

    /** The sword's frame: the blade turned `aim` degrees forward from +X, its tip `pitch` degrees up. */
    const qOf = (aim: number, pitch: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -aim * DEG, pitch * DEG, 'YXZ'));
    const wantOf = (q: THREE.Quaternion) => ({ dir: rot(q, [1, 0, 0]), up: rot(q, [0, 1, 0]) });
    const swordDir = (aim: number, pitch: number) => rot(qOf(aim, pitch), [1, 0, 0]);

    /** Both arms on the sword: the grip center at `g`, the frame `q` (chest frame), shoulders pushed by `sh`. */
    const hold = (g: V3, q: THREE.Quaternion, sh: V3 = Z3, name = '') => {
      const want = wantOf(q);
      const wristR = add(g, rot(q, WR_OFF));
      const wristL = add(g, rot(q, WL_OFF));
      if (process.env.NC_DEBUG) {
        const dR = len(sub(sub(wristR, sh), mx(SHOULDER)));
        const dL = len(sub(sub(wristL, sh), SHOULDER));
        if (dR > ARM_UP + ARM_LO - 0.005 || dL > ARM_UP + ARM_LO - 0.005) console.warn('reach', name, dR.toFixed(3), dL.toFixed(3));
      }
      const r = reach(ARM_R, sub(wristR, sh), ELBOW_R);
      const l = reach(ARM_L, sub(wristL, sh), ELBOW_L);
      return {
        'upperarm.R': { move: sh, rotate: r.upper },
        'forearm.R': { rotate: r.lower },
        'hand.R': { rotate: orient([r.upper, r.lower], REST, want) },
        'upperarm.L': { move: sh, rotate: l.upper },
        'forearm.L': { rotate: l.lower },
        'hand.L': { rotate: orient([l.upper, l.lower], REST, want) },
      };
    };
    const Q0 = qOf(0, 0);

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        plume: { rotate: curl(3 * wave(p, 1, 0.75), 0, 4 * wave(p, 1, 0.3)) },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        ...hold(add(G, [0, 0.003 * wave(p, 1, 0.1), 0]), qOf(0, 1.5 * wave(p, 1, 0.1)), Z3, 'idle'),
      }),
    });

    // Walk and run: motion.gait for the legs. The sword stays level in front of the waist and
    // bobs with the steps; the arms are solved to it.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, lean: number, flow: number, bobSword: number) => ({
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
          plume: { rotate: curl(flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)) },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          ...hold(add(G, [0, bobSword * wave(p, 2, 0.25), 0]), qOf(-3 * s, bobSword * 120 * wave(p, 2, 0.5)), Z3, 'stride'),
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 3, 6, 0.004));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 12, 22, 0.008));

    // attack: a two-hand horizontal sweep. The wind-up turns the body to his right and points the
    // sword forward; the sweep brings the blade across the front to his left; then it returns.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const aim = keys(p, [[0, 0], [0.3, 40], [0.42, 42], [0.6, -25], [0.74, -26], [1, 0]] as const, 'spline');
        const gx = keys(p, [[0, 0], [0.3, -0.03], [0.42, -0.032], [0.6, 0.04], [0.74, 0.042], [1, 0]] as const, 'spline');
        const gz = keys(p, [[0, 0], [0.3, -0.007], [0.42, -0.007], [0.6, -0.007], [0.74, -0.007], [1, 0]] as const, 'spline');
        const wind = ease(0, 0.3, p) * (1 - ease(0.42, 0.52, p));
        const strike = ease(0.42, 0.6, p) * (1 - ease(0.74, 1, p));
        const step = 18 * strike;
        return {
          hips: { move: [0, -legDrop(LEG, step), 0.02 * strike - 0.01 * wind], rotate: [0, -8 * wind + 10 * strike, 0] },
          spine: { rotate: [-3 * wind + 4 * strike, 0, 0] },
          chest: { rotate: [-2 * wind + 2 * strike, -14 * wind + 16 * strike, 0] },
          head: { rotate: [-2 * wind, 6 * wind - 8 * strike, 0] },
          plume: { rotate: curl(8 * wind - 14 * strike, 0, -4 * wind + 6 * strike) },
          cloak: { rotate: [-4 * wind + 12 * strike, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
          ...hold([G[0] + gx, G[1], G[2] + gz], qOf(aim, 0), [0, 0, 0.025 * ease(0.05, 0.3, p) * (1 - ease(0.8, 1, p))], 'attack'),
        };
      },
    });

    // attack2: an overhead cut. The sword rises in front of the face (the tip forward and up),
    // pauses, then chops down and forward to a low point; the body drops into the cut.
    k.animation('attack2', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const pitch = keys(p, [[0, 0], [0.34, 38], [0.46, 40], [0.6, -8], [0.78, -8], [1, 0]] as const, 'spline');
        const aim = keys(p, [[0, 0], [0.34, 45], [0.46, 47], [0.6, 45], [0.78, 44], [1, 0]] as const, 'spline');
        const g = keys(
          p,
          [
            [0, G],
            [0.34, [0, 0.34, 0.19]],
            [0.46, [0, 0.345, 0.19]],
            [0.6, [0, 0.285, 0.175]],
            [0.78, [0, 0.285, 0.175]],
            [1, G],
          ] as const,
          'spline',
        );
        const rise = ease(0, 0.34, p) * (1 - ease(0.46, 0.58, p));
        const cut = ease(0.46, 0.6, p) * (1 - ease(0.78, 1, p));
        const step = 12 * cut;
        return {
          hips: { move: [0, -legDrop(LEG, step), 0.015 * cut - 0.01 * rise], rotate: [0, 0, 0] },
          spine: { rotate: [-5 * rise + 3 * cut, 0, 0] },
          chest: { rotate: [-3 * rise + 2 * cut, 0, 0] },
          neck: { rotate: [-2 * rise + 3 * cut, 0, 0] },
          head: { rotate: [-5 * rise - 3 * cut, 0, 0] },
          plume: { rotate: curl(10 * rise - 18 * cut, 0, 0) },
          cloak: { rotate: [-6 * rise + 12 * cut, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
          ...hold(g, qOf(aim, pitch), [0, 0.004 * rise, 0.045 * ease(0.1, 0.34, p) * (1 - ease(0.8, 1, p))], 'attack2'),
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the sword jolts up; the hair and the cape lag.
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
        const plant = Math.asin(back / LEG) / DEG;
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          plume: { rotate: curl(16 * lag, 0, 5 * lag) },
          cloak: { rotate: [9 * lag, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
          ...hold(add(G, [0.004 * jolt, 0.012 * jolt, -0.012 * h]), qOf(-4 * jolt, 6 * jolt), Z3, 'hit'),
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The hips stay
    // high (the big head and the cape hold the body up), the neck bends a little forward, and the
    // cape flattens under him. The sword arm falls out to the right with the sword flat on the
    // ground; the left arm falls to the left side.
    const D = {
      tilt: 86,
      drop: 0.045,
      back: 0.15,
      neck: 9,
      head: 12,
      cape: 8,
      capeFlat: 0.4,
      leg: 34,
      wristR: [-0.265, 0.35, -0.11] as V3,
      bladeR: norm([-0.86, -0.5, 0]),
      wristL: [0.25, 0.3, -0.06] as V3,
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f;
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const flat = keys(p, [[0.28, 0], [0.56, 1]] as const);
        const crumple = keys(p, [[0.3, 0], [0.48, 1], [0.7, 1], [0.9, 0]] as const);
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        // The sword arm: the sword jolts in the blow, then the arm flings out and lies on the ground.
        const out = ease(0.22, 0.62, p);
        const gHit = add(G, scl([0.01, 0.03, -0.03], keys(p, [[0, 0], [0.1, 1], [0.3, 0]] as const)));
        const qHit = qOf(-8 * keys(p, [[0, 0], [0.1, 1], [0.3, 0]] as const), 10 * keys(p, [[0, 0], [0.1, 1], [0.3, 0]] as const));
        const wristHeld = add(gHit, rot(qHit, WR_OFF));
        const wristR = lerp(wristHeld, D.wristR, out);
        const armR = reach(ARM_R, wristR, lerp(ELBOW_R, [-0.6, 0.35, -0.3], out));
        const wantHeld = wantOf(qHit);
        // The blade swings out to his right by way of the front (up, once he lies down), so it
        // never cuts through the body or the ground.
        const dirR = norm(keys(p, [[0.3, wantHeld.dir], [0.46, [-0.25, 0.15, 1]], [0.74, D.bladeR]] as const));
        const upR = norm(keys(p, [[0.3, wantHeld.up], [0.46, [0, 1, 0]], [0.74, [-0.5, 0.86, 0]]] as const));
        const handR = orient([armR.upper, armR.lower], REST, { dir: dirR, up: upR });
        // The left arm lets go of the grip and falls to his left side.
        const wristLHeld = add(gHit, rot(qHit, WL_OFF));
        const wristL = lerp(wristLHeld, D.wristL, ease(0.22, 0.76, p));
        const armL = reach(ARM_L, wristL, lerp(ELBOW_L, [0.6, 0.3, -0.3], ease(0.22, 0.76, p)));

        const plant = Math.asin((0.03 * stag * stand) / LEG) / DEG;
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
          plume: { rotate: curl(18 * lag - 22 * toes, 0, 6 * lag) },
          cloak: {
            rotate: [8 * hitB - D.cape * flat - 12 * crumple, 0, 0],
            scale: [1 + 0.1 * flat, 1 - 0.15 * crumple, 1 - (1 - D.capeFlat) * flat],
          },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: Z3 },
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // victory: the sword rises in both hands in front of the chest, the tip up and forward, the
    // chest opens, and a proud nod; he holds the pose with the chin up.
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.34, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');
        const g = lerp(G, [0, 0.34, 0.19], r);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, 0] },
          chest: { rotate: [-2 * r, 0, 0] },
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [3 * nod - 3 * pride - 2 * r, 0, 0] },
          plume: { rotate: curl(12 * lag, 0, 6 * sway) },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
          ...hold(g, qOf(45 * r, 38 * r), [0, 0.004 * r, 0.045 * r], 'victory'),
        };
      },
    });
    void Q0;
    void swordDir;
  },
});
