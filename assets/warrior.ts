import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Warrior — Chibi Quest P0 hero (catalog `heroes/martial/warrior`), about 1.0 m to the top of the
 * hair, faces +Z. Target: docs/hero-mockups/warrior_001.jpg (one front view; the mockup's beard and
 * adult face are left out: the heroes share one young, round, beardless face). Built on the
 * barbarian (the knight's body, face, and skeleton with knee bones), so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the cream fur mantle, the steel
 *   breastplate, the red tunic, the gold headband, and the greatsword must read.
 * One idea: a sturdy young warrior in a steel breastplate and a shaggy fur mantle, a huge
 *   greatsword held up and back over the right shoulder.
 * Shape language: square and sturdy (plate, boots, sword), soft round fur and face as the second.
 * Proportions: hair top 1.0, brow 0.71, eyes 0.63, chin 0.48, shoulders 0.44 (fur), belt 0.25,
 *   skirt hem 0.15, boot cuffs 0.10; the sword tip out at x -0.5, y 0.95.
 * Palette (60/30/10): steel #bcc2cb and red #c93a32 (mid), cream fur #e0d4b0 (light), dark brown
 *   hair, boots, and cape (dark); gold headband #e0b040 as the accent.
 * Bodies: skin (head), body (arms, thighs), hair, headband, fur, tunic, cape, leather, steel,
 *   blade, sword-iron, grip.
 * Rig: the barbarian's skeleton; `plume` sways the top locks, `cloak` the cape. The sword is rigid
 *   on the right hand. Clips: idle, walk, run, attack (a two-handed horizontal sweep), attack2 (an
 *   overhead chop), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a5030',
  pupil: '#110d0b',
  lid: '#16100c',
  mouth: '#a4503f',
  hair: '#4a2e1c',
  hairDark: '#2e1c10',
  gold: '#e0b040',
  fur: '#e0d4b0',
  furDark: '#b8a880',
  furLight: '#efe6c8',
  steel: '#bcc2cb',
  steelDark: '#8a9098',
  steelLight: '#e2e6eb',
  buckle: '#a8acb1',
  tunic: '#c93a32',
  tunicDark: '#8a2420',
  belt: '#4e2d1c',
  cape: '#5a3a24',
  boot: '#4a2e1c',
  sole: '#24160f',
  blade: '#a8acb1',
  bladeDark: '#9aa0a8',
  guard: '#6a6e74',
  grip: '#3a2a20',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the knight's). The right hand holds the axe low and out; the left fist hangs forward.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0): heel and toe (the knight's sabaton shape).
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
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
// Each hand swings forward along its forearm, then turns about the forward axis.
const HAND_R = { pitch: -70, roll: -30 };
const HAND_L = { pitch: -62, roll: 26 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);


// ------------------------------------------------------------------ the greatsword's frame
// Local frame: the right fist's grip at the origin, the sword along Y with the tip toward -Y
// (the pommel toward +Y), the blade's width along X, the flats facing +-Z. At rest the tip points
// up, out and a little back over the right shoulder, the flats to the front.
const HAFT_WANT = norm([-0.45, 0.8, -0.4]);
const AXE_Z = Math.asin(HAFT_WANT[0]) / rad; // local +Y goes to -HAFT_WANT
const AXE_X = Math.atan2(-HAFT_WANT[2], -HAFT_WANT[1]) / rad;
const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
const axeTurn = (p: V3, roll: number): V3 => rotX(rotZ(rotY(p, roll), AXE_Z), AXE_X);
const FLAT_WANT = norm([0.5, 0, 0.87]);
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
const HAFT_DIR = axeTurn([0, -1, 0], AXE_ROLL); // grip to tip, at rest
const FLAT = axeTurn([0, 0, 1], AXE_ROLL); // the flats' normal at rest
const axePose = (s: sdf.Shape) => s.rotateY(AXE_ROLL).rotateZ(AXE_Z).rotateX(AXE_X).at(...GRIP);
// Where the left fist closes on the grip, below the right one (toward the pommel).
const GRIP_L = add(GRIP, HAFT_DIR, -0.075);

// The blade in local XY (tip toward -Y): straight edges, a long taper, a point.
const BLADE_TOP = -0.07;
const BLADE_TIP = -0.78;
const bladeProfile = profile.polygon([
  [-0.05, BLADE_TOP],
  [0.05, BLADE_TOP],
  [0.054, -0.3],
  [0.05, -0.66],
  [0, BLADE_TIP],
  [-0.05, -0.66],
  [-0.054, -0.3],
]);

export default defineAsset({
  name: 'warrior',
  description: 'Chibi warrior hero with swept-up brown hair, a gold headband, a cream fur mantle, a steel breastplate over a red tunic, and a greatsword on the shoulder.',
  detail: 0.006,
  reference: 'docs/hero-mockups/warrior_001.jpg',
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c9a050' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { red: C.tunic, blue: '#2f58b8', green: '#2e7a3c' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'red' },
    blue: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'blue' },
    green: { eyes: 'green', hair: 'blond', skin: 'brown', clothing: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      skin: k.tint('skin'),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.tunicDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0, 0.9, -0.03]; // the root of the swept-up top locks
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0, 1.0, -0.04] },
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
    // Round human ears.
    const ears = pair(sdf.ellipsoid([0.026, 0.042, 0.032]).rotateZ(-14).at(0.212, 0.615, -0.012)).bone('head');

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
    // Thick, straight, serious brows, lower at the inner ends.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.032, 70, 106), 0.3).at(0.1, 0.708 - 0.16, 0.1).rotateZ(-8));
    const mouth = sdf.extrude(profile.arc(0.09, 0.011, 256, 284), 0.3).at(0, 0.528 + 0.09, 0.1); // a nearly flat, serious mouth
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.012, ears)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.hairDark)
      .paintWhere(mouth, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a cap and ten thick locks swept up
    const hp = (x: number, y: number, z: number, r: number, lift = 0.25): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const BAND_Y = 0.762;
    const faceMask = sdf.ellipsoid([0.26, 0.17, 0.24]).at(0, 0.622, 0.16);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.022, HEAD[2] + 0.02])
      .at(0, HEAD_Y + 0.012, -0.016)
      .smoothSubtract(0.015, faceMask)
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.5));
    // Five locks sweep back over the crown.
    const sweep = (x: number, r: number) =>
      sdf.chain([hp(x * 0.85, 0.8, 0.17, r * 0.8, 0.3), hp(x, 0.875, 0.08, r, 0.3), hp(x * 1.1, 0.88, -0.06, r, 0.25), hp(x * 1.15, 0.78, -0.17, r * 0.8, 0.2)], 0.012);
    const swept = sdf.smoothUnion(0.012, sweep(-0.13, 0.03), sweep(-0.065, 0.033), sweep(0, 0.035), sweep(0.065, 0.033), sweep(0.13, 0.03));
    // Nine thick locks lie back over the crown: each sits on the skull and points back and to the side.
    const lockAt = (a: number, phi: number) => {
      const ar = a * rad;
      const pr = phi * rad;
      const dir: V3 = [Math.sin(pr) * Math.sin(ar), Math.cos(pr), Math.sin(pr) * Math.cos(ar)];
      const surf = sdf.surfacePoint(head, [dir[0] * 0.6, HEAD_Y + dir[1] * 0.6, dir[2] * 0.6], 0.012);
      const n = norm(sub(surf as unknown as V3, [0, HEAD_Y, 0]));
      const d: V3 = [0.8 * Math.sin(ar), 0, -1];
      const dn = dot(d, n);
      const u = norm([d[0] - dn * n[0], d[1] - dn * n[1], d[2] - dn * n[2]]);
      const c = add(add(surf as unknown as V3, n, 0.026), u, 0.025);
      return alignY(sdf.ellipsoid([0.037, 0.072, 0.03]), u).at(...c);
    };
    const locks = sdf.smoothUnion(
      0.03,
      ...[
        [0, 46],
        [34, 50],
        [-34, 50],
        [68, 52],
        [-68, 52],
        [104, 54],
        [-104, 54],
        [140, 55],
        [-140, 55],
      ].map(([a, phi]) => lockAt(a, phi)),
    );
    // Two short tufts fall over the headband at the front.
    const tufts = pair(sdf.ellipsoid([0.032, 0.05, 0.024]).rotateZ(-14).at(0.045, 0.775, 0.196)).bone('head');
    const hairline = sdf.union(...[-3, -2, -1, 0, 1, 2, 3].map((i) => sdf.sphere(0.03).at(...(hp(i * 0.05, 0.8 - Math.abs(i) * 0.014, 0.17, 0.03, 0.35).slice(0, 3) as [number, number, number]))));
    const temples = pair(sdf.chain([hp(0.17, 0.79, 0.06, 0.03), hp(0.2, 0.71, 0.075, 0.024), hp(0.205, 0.65, 0.085, 0.01)], 0.015));
    const nape = sdf.union(
      pair(sdf.chain([hp(0.12, 0.78, -0.15, 0.032), hp(0.16, 0.64, -0.16, 0.028), hp(0.14, 0.53, -0.14, 0.02), hp(0.12, 0.47, -0.12, 0.01)], 0.02)),
      sdf.chain([hp(0, 0.74, -0.2, 0.032), hp(0, 0.6, -0.2, 0.028), hp(0, 0.5, -0.16, 0.02), hp(0, 0.45, -0.12, 0.01)], 0.02),
    );
    const mane = sdf.smoothUnion(0.02, cap, swept, hairline, temples, nape, locks.bone('head')).subtract(sdf.box([0.7, 0.05, 0.7]).at(0, BAND_Y, 0));
    const hair = sdf
      .smoothUnion(0.02, mane.bone('head'), tufts)
      .paintFn((x, y, z, base) => {
        const w = Math.sin(Math.atan2(x, z) * 14 + y * 30 + noise.noise3(x * 20, y * 20, z * 20) * 2);
        return w > 0.45 ? mixRgb(base, rgb(T.hairDark), Math.min(0.55, (w - 0.45) * 1.4)) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.65, detail: 0.006 });
    // The gold headband: a band of the skull, thicker than the hair around it.
    const bandShape = sdf
      .ellipsoid([HEAD[0] + 0.022, HEAD[1], HEAD[2] + 0.022])
      .at(0, HEAD_Y, 0)
      .smoothIntersect(0.006, sdf.box([0.7, 0.042, 0.7], 0.004).at(0, BAND_Y, 0))
      .bone('head');
    k.body('headband', bandShape, { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ bare arms and thighs (skin)
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
    const chestSkin = torso.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest');
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
    const thighs = pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L'));
    const body = sdf.union(
      sdf.smoothUnion(0.02, chestSkin, arm(SHOULDER, ELBOW_L, WRIST_L, 'L', fistL), arm(mx(SHOULDER), ELBOW_R, WRIST_R, 'R', fistR)),
      thighs,
    );
    k.body('body', body, { color: T.skin, roughness: 0.55, detail: 0.005 });

    // ------------------------------------------------------------------ the tunic: red torso and a short skirt
    const shag = (x: number, y: number, z: number) => noise.fbm(x * 24, y * 16, z * 24, 2);
    const tunicTorso = torso.round(0.008);
    const skirtRing = sdf
      .revolve(
        profile.polygon([
          [0.124, 0.272],
          [0.15, 0.272],
          [0.184, 0.15],
          [0.162, 0.15],
        ]),
      )
      .scale([1, 1, 0.82])
      .displace(0.007, (x, y, z) => Math.sin(Math.atan2(x, z) * 9) * Math.min(1, Math.max(0, (0.24 - y) * 10)));
    const skirt = sdf.union(
      skirtRing.intersect(sdf.halfSpace([-1, 0, 0], -0.05)).bone('leg.L'),
      skirtRing.intersect(sdf.halfSpace([1, 0, 0], -0.05)).bone('leg.R'),
      skirtRing.intersect(sdf.box([0.13, 0.5, 0.5]).at(0, 0.2, 0)).bone('hips'),
    );
    const tunic = sdf
      .union(
        tunicTorso.intersect(sdf.halfSpace([0, -1, 0], -0.31)).bone('chest'),
        tunicTorso.intersect(sdf.halfSpace([0, 1, 0], 0.31)).bone('spine'),
        skirt,
      )
      .paintFn((x, y, z, base) => {
        const fold = Math.sin(Math.atan2(x, z) * 10 + y * 4 + noise.noise3(x * 12, y * 12, z * 12));
        let c = fold > 0.35 ? mixRgb(base, rgb(T.clothDark), Math.min(0.8, (fold - 0.35) * 1.6)) : base;
        if (y < 0.17) c = mixRgb(c, rgb(T.clothDark), Math.min(0.9, (0.17 - y) * 40));
        return c;
      });
    k.body('tunic', tunic, { color: T.cloth, roughness: 0.85, detail: 0.008, bump: (x, y, z) => 0.0012 * noise.fbm(x * 140, y * 140, z * 140, 2) });

    // ------------------------------------------------------------------ fur: the mantle over both shoulders, boot cuffs
    const furPaint = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => {
      const n = noise.fbm(x * 30, y * 50, z * 30, 2);
      const under = Math.min(0.55, Math.max(0, (0.44 - y) * 9));
      const c = n > 0 ? mixRgb(base, rgb(C.furLight), Math.min(0.6, n * 1.2)) : mixRgb(base, rgb(C.furDark), Math.min(0.6, -n * 1.2));
      return mixRgb(c, rgb(C.furDark), under);
    };
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.058, 0.512],
            [0.1, 0.518],
            [0.136, 0.495],
            [0.15, 0.455],
            [0.138, 0.428],
            [0.1, 0.44],
            [0.058, 0.475],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const mantleL = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.105, 0.068, 0.108]).rotateZ(-24).at(0.152, 0.448, -0.004),
      sdf.ellipsoid([0.07, 0.05, 0.07]).rotateZ(-30).at(0.2, 0.41, 0.03),
    );
    const cuffs = pair(sdf.torus(0.05, 0.022).at(0.095, 0.104, 0.004).bone('shin.L'));
    const fur = sdf
      .union(
        sdf.smoothUnion(0.03, collar.bone('chest'), pair(mantleL.bone('upperarm.L'))),
        cuffs,
      )
      .displace(0.009, shag)
      .paintFn(furPaint);
    k.body('fur', fur, { color: C.fur, roughness: 1.0, detail: 0.006, bump: (x, y, z) => 0.0015 * noise.fbm(x * 160, y * 90, z * 160, 2) });

    // ------------------------------------------------------------------ the short cape (cloth, from the shoulders to y 0.22 at the back)
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
        .scale([1, 1, 0.85]);
    const cape = capeCone(0.17, 0.27, 0.45, 0.2)
      .subtract(capeCone(0.142, 0.242, 0.47, 0.18))
      .displace(0.008, (x, y, z) => {
        const ang = Math.atan2(x, -(z + 0.025));
        const fold = [-0.6, 0, 0.6].reduce((sum, a) => sum + Math.exp(-(((ang - a) / 0.14) ** 2)), 0);
        return -fold * Math.min(1, Math.max(0, (0.44 - y) * 5));
      })
      .at(0, 0, -0.025)
      .intersect(sdf.halfSpace([0, 0, 1], -0.03))
      .bone('cloak');
    k.body('cape', cape, { color: C.cape, roughness: 0.85, detail: 0.006, bump: (x, y, z) => 0.0012 * noise.fbm(x * 120, y * 60, z * 120, 2) });

    // ------------------------------------------------------------------ leather: belt and boots
    const beltY = 0.25;
    const belt = torso.round(0.022).smoothIntersect(0.006, sdf.box([0.5, 0.056, 0.5], 0.008).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.054, 0.07, 0.02).at(0, 0.045, 0),
        sdf.ellipsoid([0.06, 0.05, 0.104]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootPose = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    const boot = bootPose(bootFoot.paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole));
    const leather = sdf.union(belt.bone('spine'), pair(boot));
    k.body('leather', leather, { color: C.belt, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ steel: breastplate, emblem, bracers, buckle, toe caps
    const plateProfile = profile.polygon([
      [-0.15, 0.462],
      [-0.062, 0.474],
      [0, 0.398],
      [0.062, 0.474],
      [0.15, 0.462],
      [0.15, 0.336],
      [0, 0.232],
      [-0.15, 0.336],
    ]);
    const plateOuter = torso.round(0.02);
    const plateBase = plateOuter
      .intersect(sdf.extrude(plateProfile, 0.5, 0.005))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02))
      .subtract(torso.round(0.006));
    const plateZ = sdf.raycast(plateOuter, [0, 0.335, 1], [0, 0, -1])![2];
    const diamond = profile.polygon([
      [0, 0.03],
      [0.021, 0],
      [0, -0.03],
      [-0.021, 0],
    ]);
    const emblem = sdf.extrude(diamond, 0.02, 0.004).at(0, 0.335, plateZ - 0.002);
    const emblemPaint = sdf.extrude(profile.polygon([[0, 0.026], [0.017, 0], [0, -0.026], [-0.017, 0]]), 0.3).at(0, 0.335, plateZ);
    const rimPaint = sdf.extrude(plateProfile, 0.5).subtract(sdf.extrude(profile.offsetProfile(plateProfile, -0.013), 0.5));
    const plate = sdf
      .smoothUnion(0.004, plateBase, emblem)
      .paintFn((x, y, z, base) => {
        const shade = Math.min(0.7, Math.max(0, (Math.abs(x) - 0.09) * 9) + Math.max(0, (0.3 - y) * 5));
        return mixRgb(base, rgb(C.steelDark), shade);
      })
      .paintWhere(rimPaint, C.steelLight, 0.003)
      .paintWhere(emblemPaint, C.steelLight, 0.004)
      .bone('chest');
    // Two engraved groove strokes around each bracer (in bump, and darker in the paint).
    const groove = (x: number, y: number, z: number) => {
      let g = 0;
      for (const [e, w] of [[ELBOW_L, WRIST_L], [ELBOW_R, WRIST_R]] as const) {
        const a = sub(w, e);
        const len2 = dot(a, a);
        const q = sub([x, y, z], e);
        const t = dot(q, a) / len2;
        const perp = Math.hypot(q[0] - a[0] * t, q[1] - a[1] * t, q[2] - a[2] * t);
        if (perp < 0.075 && t > 0 && t < 1.05) g += Math.exp(-(((t - 0.55) / 0.045) ** 2)) + Math.exp(-(((t - 0.85) / 0.045) ** 2));
      }
      return Math.min(1, g);
    };
    const bracer = (e: V3, w: V3) =>
      sdf.union(
        sdf.cone(lerp(e, w, 0.38), lerp(e, w, 0.98), 0.049, 0.045),
        ...[0.42, 0.7].map((t) => sdf.cone(lerp(e, w, t), lerp(e, w, t + 0.2), 0.054, 0.051).round(0.003)),
      );
    const bracers = sdf
      .union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R'))
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.steelDark), Math.min(0.85, Math.max(0, 0.3 * noise.fbm(x * 60, y * 60, z * 60, 2)) + 0.9 * groove(x, y, z))));
    const buckle = sdf
      .union(
        sdf.box([0.062, 0.05, 0.014], 0.007).subtract(sdf.box([0.036, 0.028, 0.06], 0.004)),
        sdf.box([0.008, 0.03, 0.012], 0.003).at(0, 0, 0.001),
        sdf.box([0.03, 0.008, 0.012], 0.003).at(0, 0, 0.001),
      )
      .at(0, beltY, beltZ + 0.004)
      .paint(C.buckle)
      .bone('spine');
    const toeY = sdf.raycast(bootFoot, [0, 0.3, 0.1], [0, -1, 0])![1];
    const toeCap = bootPose(
      sdf
        .smoothUnion(
          0.006,
          sdf.box([0.066, 0.022, 0.06], 0.008).rotateX(20).at(0, toeY + 0.002, 0.1),
          sdf.box([0.06, 0.034, 0.02], 0.008).at(0, 0.05, 0.14),
        )
        .paint(C.buckle),
    );
    k.body('steel', sdf.union(plate, bracers, buckle, pair(toeCap)), {
      color: C.steel,
      roughness: 0.42,
      metalness: 0.8,
      detail: 0.0055,
      bump: (x, y, z) => -0.002 * groove(x, y, z),
    });

    // ------------------------------------------------------------------ the greatsword, rigid in the right hand
    const bevelN = (sx: number, sz: number) => sdf.halfSpace(norm([0.14 * sx, 0, sz]), 0.008 / Math.hypot(0.14, 1));
    const bladeShape = sdf
      .extrude(bladeProfile, 0.03, 0.002)
      .intersect(sdf.intersect(bevelN(1, 1), bevelN(-1, 1), bevelN(1, -1), bevelN(-1, -1)))
      .paintWhere(sdf.box([0.02, 0.56, 0.2]).at(0, -0.36, 0), C.guard, 0.004);
    k.body('blade', axePose(bladeShape), { color: C.blade, roughness: 0.5, metalness: 0.85, detail: 0.004, bone: 'hand.R' });
    const guard = sdf.smoothUnion(
      0.008,
      sdf.capsule([-0.092, -0.08, 0], [0, -0.06, 0], 0.015),
      sdf.capsule([0.092, -0.08, 0], [0, -0.06, 0], 0.015),
      sdf.sphere(0.02).at(0, -0.062, 0),
    );
    const pommel = sdf.smoothUnion(0.006, sdf.sphere(0.028).at(0, 0.112, 0), sdf.cylinder(0.018, 0.02, 0.004).at(0, 0.092, 0));
    k.body('sword-iron', axePose(sdf.union(guard, pommel)), { color: C.guard, roughness: 0.45, metalness: 0.8, detail: 0.004, bone: 'hand.R' });
    const gripShape = sdf
      .cylinder(0.0175, 0.16, 0.004)
      .at(0, 0.015, 0)
      .paintFn((x, y, z, base) => (Math.sin((x + y + z) * 320) > 0.5 ? mixRgb(base, rgb('#6a4a32'), 0.7) : base));
    k.body('grip', axePose(gripShape), { color: C.grip, roughness: 0.75, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp, follow } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const POLE_REST = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);

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
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // Legs from motion.gait (as the knight). The sword arm swings little; `carry` lifts the right
    // forearm, so the sword tip stays off the ground (higher in the run).
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
          'upperarm.L': { rotate: [armSwing * 0.5 * s, 0, 4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.2 * s, 0, -6] as const },
          'forearm.R': { rotate: [-carry, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.85, 0.1, 0.025, 0.62, 0.006, 30, 3, 5, 4));
    k.animation('run', stride(0.54, 0.14, 0.045, 0.42, 0.025, 50, 12, 20, 10));

    // attack: a big two-handed overhead chop, solved by targets (as the death knight's). The right
    // wrist follows keys in the chest's rest frame (reach); the haft follows its own keys (orient),
    // and edgeUp turns the flats so a blade leads. The head is big and the arms are short, so the
    // sword rises on the right side, out beside the head, the flats facing it; it holds, then comes
    // over and down in front of the face in 0.1 s as the left fist closes on the haft below the
    // right one and the left foot steps in. The chop ends low in front, holds, and recovers.
    const chopKeys = [
      [0, HAFT_DIR],
      [0.14, norm([-0.75, 0.25, 0.6])],
      [0.26, norm([-0.45, 0.8, 0.4])],
      [0.34, norm([-0.35, 0.92, 0.18])], // the top: up on the right, out beside the head
      [0.44, norm([-0.33, 0.93, 0.16])], // the hold
      [0.49, norm([-0.28, 0.75, 0.6])], // over and forward, out on the right
      [0.52, norm([-0.08, 0.3, 0.95])],
      [0.555, norm([0.0, 0.1, 1])], // the impact: forward (the chest pitches it down)
      [0.6, norm([0.02, -0.05, 1])], // the follow-through, low in front
      [0.76, norm([0.02, -0.05, 1])],
      [0.88, norm([-0.5, 0.35, 0.6])],
      [1, HAFT_DIR],
    ] as const;
    const chopAt = (p: number) => keys(p, chopKeys, 'spline');
    k.animation('attack2', {
      duration: 1.05,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.32, p) * (1 - ease(0.44, 0.53, p));
        const cut = ease(0.47, 0.58, p) * (1 - ease(0.78, 1, p));
        const grab = ease(0.45, 0.54, p) * (1 - ease(0.8, 0.95, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.24, 0.4, 0.1]],
            [0.26, [-0.25, 0.45, 0.14]],
            [0.34, [-0.26, 0.47, 0.16]],
            [0.44, [-0.26, 0.47, 0.16]],
            [0.49, [-0.24, 0.44, 0.15]],
            [0.52, [-0.14, 0.38, 0.18]],
            [0.555, [-0.04, 0.35, 0.15]],
            [0.6, [-0.02, 0.35, 0.14]],
            [0.76, [-0.02, 0.35, 0.14]],
            [0.88, [-0.15, 0.3, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        // The elbow points out to the right in the wind-up, then out and down through the chop.
        const pole = keys(p, [[0, POLE_REST], [0.3, [-0.4, 0.4, 0.0]], [0.46, [-0.4, 0.4, 0.04]], [0.56, [-0.3, 0.25, 0.08]], [0.78, [-0.3, 0.25, 0.08]], [1, POLE_REST]] as const);
        // The shoulder shrugs up in the wind-up; reach solves from the raised shoulder.
        const shrug: V3 = [0, 0.03 * wind, 0];
        const arm = reach(ARM_R, add(wrist, shrug, -1), add(pole, shrug, -1));
        // Fallback flat: the flats face the head side (the blades point front and back).
        const side = norm(keys(p, [[0, FLAT], [0.2, [1, 0, 0.2]], [0.8, [1, 0, 0.2]], [1, FLAT]] as const));
        const hand = orient([arm.upper, arm.lower], { dir: HAFT_DIR, up: FLAT }, { dir: norm(chopAt(p)), up: edgeUp(chopAt, p, side) });
        // The left fist closes on the haft below the right one for the chop.
        const gripNow = add(follow([mx(SHOULDER), ELBOW_R, WRIST_R], [arm.upper, arm.lower, hand], GRIP_L), shrug);
        const ikL = reach(ARM_L, add(gripNow, [-0.006, 0.036, -0.018]), add(ELBOW_L, [0.12, -0.08, -0.04]));
        const freeU: V3 = [-24 * wind, 0, 16 * wind];
        const freeL: V3 = [-20 * wind, 0, 0];
        const bob = keys(p, [[0, 0], [0.56, 0], [0.62, 1], [0.72, -0.45], [0.82, 0.15], [0.92, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 20 * cut) - 0.004 * wind, 0.03 * cut - 0.012 * wind], rotate: [0, -8 * wind + 12 * cut, 0] },
          // The upper body leans back and to the left, away from the raised sword, then drives down.
          spine: { rotate: [-7 * wind + 10 * cut, 0, -5 * wind] },
          chest: { rotate: [-6 * wind + 6 * cut, -8 * wind + 8 * cut, -6 * wind] },
          head: { rotate: [3 * wind - 10 * cut + 5 * bob, 4 * wind - 4 * cut, -8 * wind + 2 * bob] },
          plume: { rotate: [8 * wind - 14 * cut + 10 * bob, 0, -6 * wind] },
          cloak: { rotate: [-4 * wind + 10 * cut, 0, 0] },
          'upperarm.R': { move: shrug, rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: lerp(freeU, ikL.upper, grab) },
          'forearm.L': { rotate: lerp(freeL, ikL.lower, grab) },
          // The front (left) foot steps in; the back leg pushes.
          'leg.L': { rotate: [3 * wind - 20 * cut, 0, 0] },
          'foot.L': { rotate: [-3 * wind + 20 * cut, 0, 0] },
          'leg.R': { rotate: [-3 * wind + 14 * cut, 0, 0] },
          'foot.R': { rotate: [3 * wind - 14 * cut, 0, 0] },
        };
      },
    });

    // attack2: a wide horizontal sweep at waist height. The body winds up to the right with the
    // sword back and level, then unwinds and the sword sweeps across the front to the left, the blade
    // leading; the left fist joins the haft through the sweep; a hold, and back to rest.
    const sweepKeys = [
      [0, HAFT_DIR],
      [0.22, norm([-0.75, 0.12, -0.64])], // the wind-up: back on the right, level
      [0.32, norm([-0.78, 0.15, -0.6])],
      [0.42, norm([-0.75, 0.05, 0.66])],
      [0.48, norm([-0.05, 0.02, 1])], // straight forward
      [0.55, norm([0.7, 0, 0.72])], // across to the left
      [0.7, norm([0.74, -0.05, 0.67])],
      [0.86, norm([-0.4, -0.05, 0.85])],
      [1, HAFT_DIR],
    ] as const;
    const sweepAt = (p: number) => keys(p, sweepKeys, 'spline');
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.3, p) * (1 - ease(0.36, 0.48, p));
        const swing = ease(0.38, 0.56, p) * (1 - ease(0.72, 1, p));
        const grab = ease(0.36, 0.46, p) * (1 - ease(0.72, 0.9, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.22, [-0.25, 0.36, -0.03]],
            [0.32, [-0.25, 0.37, -0.04]],
            [0.42, [-0.22, 0.35, 0.12]],
            [0.48, [-0.12, 0.34, 0.18]],
            [0.55, [-0.03, 0.32, 0.16]],
            [0.7, [-0.02, 0.32, 0.15]],
            [0.86, [-0.15, 0.3, 0.13]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const pole = keys(p, [[0, POLE_REST], [0.25, [-0.5, 0.3, -0.3]], [0.45, [-0.5, 0.1, 0.1]], [0.7, [-0.4, 0.05, 0.3]], [1, POLE_REST]] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: HAFT_DIR, up: FLAT }, { dir: norm(sweepAt(p)), up: edgeUp(sweepAt, p, [0, 1, 0]) });
        const gripNow = follow([mx(SHOULDER), ELBOW_R, WRIST_R], [arm.upper, arm.lower, hand], GRIP_L);
        const ikL = reach(ARM_L, add(gripNow, [-0.006, 0.036, -0.018]), add(ELBOW_L, [0.12, -0.08, -0.04]));
        const lag = keys(p, [[0, 0], [0.3, 0.6], [0.5, -1], [0.64, 0.5], [0.8, -0.2], [1, 0]] as const, 'spline');
        const step = 16 * swing;
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.006 * wind, 0.02 * swing - 0.01 * wind], rotate: [0, -14 * wind + 16 * swing, 0] },
          spine: { rotate: [-2 * wind + 5 * swing, -6 * wind + 8 * swing, 0] },
          chest: { rotate: [0, -12 * wind + 14 * swing, 0] },
          head: { rotate: [0, 14 * wind - 12 * swing, 0] },
          plume: { rotate: [6 * lag, 0, 10 * lag] },
          cloak: { rotate: [6 * swing, 0, 8 * lag] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: lerp([-10 * wind, 0, 10 * wind], ikL.upper, grab) },
          'forearm.L': { rotate: lerp([-25 * wind, 0, 0], ikL.lower, grab) },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the left arm jolts out; the knot and the cape lag.
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
          'upperarm.R': { rotate: [8 * h, 0, 10 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [10 * jolt, 0, 14 * jolt] },
          'forearm.L': { rotate: [22 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back (as the
    // knight). The sword arm falls out to the right with the sword flat on the ground; the left arm
    // falls to the left side; the fur cape flattens under him (scale).
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045,
      back: 0.15,
      neck: 9,
      head: 12,
      cape: 8,
      capeFlat: 0.4,
      leg: 34,
      wristR: [-0.27, 0.35, -0.1] as V3,
      axeR: norm([-0.85, -0.3, 0.25]),
      wristL: [0.22, 0.28, -0.04] as V3,
      poleL: [0.5, 0.3, -0.3] as V3,
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

        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const haft = norm(keys(p, [[0, HAFT_DIR], [0.1, norm([-0.8, -0.1, 0.5])], [0.4, norm([-0.9, -0.1, 0.35])], [0.74, D.axeR]] as const));
        const flatUp = norm(keys(p, [[0, FLAT], [0.4, FLAT], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: HAFT_DIR, up: FLAT }, { dir: haft, up: flatUp });

        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
        const armL = reach(ARM_L, wristL, poleL);

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
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // victory: the sword goes up high beside the head on the right, the flats facing the head (the
    // blades point front and back, clear of the mane); the left fist punches up at his side. Then a
    // proud nod, and he holds the pose with the chin up. The knot and the cape sway.
    const WIN = {
      wrist: [-0.298, 0.458, 0.04] as V3,
      haft: norm([-0.22, 0.97, 0.1]),
      flat: norm([-1, 0.2, 0]),
      wristL: [0.24, 0.48, 0.04] as V3,
      poleL: [0.6, 0.2, -0.25] as V3,
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const fist = ease(0.06, 0.34, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');

        const wristR = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.27, 0.37, 0.1]],
            [0.26, [-0.296, 0.462, 0.042]],
            [0.32, [-0.298, 0.466, 0.04]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const haft = norm(
          keys(p, [[0, HAFT_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.26, 0.95, 0.14])], [0.32, norm([-0.18, 0.98, 0.1])], [0.42, WIN.haft]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.12, [-0.3, 0.2, 1]], [0.26, WIN.flat]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: HAFT_DIR, up: FLAT }, { dir: haft, up: flatUp });

        const armL = reach(ARM_L, lerp(WRIST_L, WIN.wristL, fist), lerp(POLE_REST_L, WIN.poleL, fist));
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -8 * look, 0] },
          plume: { rotate: [12 * lag, 0, 6 * sway] },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          'upperarm.R': { rotate: armR.upper, move: [0, 0.015 * r, 0] },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        };
      },
    });
  },
});
