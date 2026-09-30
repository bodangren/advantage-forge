import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Gladiator — Chibi Quest P1 hero (catalog `heroes/martial/gladiator`), about 1.05 m to the top
 * of the crest spike, faces +Z. Target: docs/hero-mockups/gladiator_001.jpg (the mockup's beard is
 * left out: the heroes share one young, round, beardless face). Built on the barbarian and the
 * knight (the rogue's body, face, and skeleton), so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the bronze crested helmet, the bare
 *   chest with its harness, the red skirt, the round shield, and the short sword must read.
 * One idea: a stocky young arena fighter in a bronze helmet with an open face and a tall thin
 *   crest spike, bare-chested with a leather harness, bronze shoulder discs, a red skirt, and a
 *   small round shield on the left arm.
 * Shape language: round and sturdy, with flat bronze plates as the secondary language.
 * Proportions: crest spike top 1.05, helmet top 0.90, eyes 0.63, chin 0.48, shoulders 0.44,
 *   belt 0.25, skirt hem 0.13; the gladius points out low on the right, the shield sits at x 0.24.
 * Palette (60/30/10): skin #f2c7a4 and leather #6b4226 (mid); bronze #b08a3a (light); red cloth
 *   #a83a32 and brown hair #4a2e1c as accents; blade #c3c8cf.
 * Bodies: skin (head), body (torso, arms, legs, feet), hair, helmet, crest, cloth (scarf, skirt),
 *   leather, bronze, blade, hilt, grip, shield, shield-bronze.
 * Rig: the knight's skeleton; the `plume` bone sways the crest spike; `cloak` is unused. The sword
 *   is rigid on the right hand, the shield on the left forearm. Clips: the knight's (idle, walk,
 *   run, attack, attack2 shield bash, hit, death, victory).
 */

const C = {
  skin: '#dcaa82',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a4a2a',
  pupil: '#110d0b',
  lid: '#16100c',
  mouth: '#a4503f',
  hair: '#4a2e1c',
  hairDark: '#2e1a10',
  brow: '#2e1a10',
  bronze: '#b08a3a',
  bronzeDark: '#7a5a20',
  red: '#a83a32',
  redDark: '#7a2420',
  leather: '#6b4226',
  leatherDark: '#4e2d1c',
  shorts: '#3a2a22',
  sole: '#3a2418',
  steel: '#c3c8cf',
  steelLight: '#e2e6ea',
  grip: '#3a2a20',
  shieldFace: '#8a5a35',
  shieldDark: '#6e4426',
  crest: '#5a3320',
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


export default defineAsset({
  name: 'gladiator',
  description: 'Chibi gladiator hero with a bronze crested helmet, leather harness, bronze shoulder discs, red skirt, short sword, and round shield.',
  detail: 0.005,
  reference: 'docs/hero-mockups/gladiator_001.jpg',
  // Color slots (the first option is the default look). Skin options match the rogue's.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c9a050' },
    skin: { fair: C.skin, tan: '#c08560', brown: '#8a5a3e' },
    cloth: { red: C.red, blue: '#2f58b8', green: '#2e7a3c' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', cloth: 'red' },
    blue: { eyes: 'blue', hair: 'black', skin: 'tan', cloth: 'blue' },
    green: { eyes: 'green', hair: 'blond', skin: 'brown', cloth: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      cloth: k.tint('cloth'),
      clothDark: k.tint('cloth', { color: C.redDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0, 0.97, -0.014]; // the root of the crest spike
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0, 1.05, -0.014] },
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
    // Round ears stick out of the mane.
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
    // Thick, straight brows, a little lower at the inner ends: fierce, not angry.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.03, 70, 106), 0.3).at(0.1, 0.712 - 0.16, 0.1).rotateZ(-4));
    const smile = sdf.extrude(profile.arc(0.1, 0.012, 252, 288), 0.3).at(0, 0.528 + 0.1, 0.1);
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
      .paintWhere(brows, T.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });


    // ------------------------------------------------------------------ hair: fringe, side locks, nape locks
    // `hp` puts a strand point on the skull (in that direction from the head center), lifted off it
    // by part of its radius, so the locks lie on the head.
    const hp = (x: number, y: number, z: number, r: number, lift = 0.25): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const faceMask = sdf.ellipsoid([0.26, 0.17, 0.24]).at(0, 0.622, 0.16);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.01, HEAD[1] + 0.012, HEAD[2] + 0.01])
      .at(0, HEAD_Y + 0.004, -0.008)
      .smoothSubtract(0.012, faceMask)
      .smoothSubtract(0.01, ears.round(0.016))
      .intersect(sdf.union(sdf.box([0.6, 0.17, 0.6]).at(0, 0.685, 0), sdf.box([0.6, 0.3, 0.3]).at(0, 0.67, -0.21)));
    // Six curved fringe locks curl out from under the brim (0.04 m long, tapering from r 0.012),
    // plus a side lock in front of each cheek plate. The brows stay clear between the locks.
    const jit = (i: number) => noise.random(i, 3, 7) - 0.5;
    const fringe = sdf.union(
      ...[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((i, n) => {
        const x = i * 0.034;
        const out = Math.sign(i) * (0.014 + 0.004 * Math.abs(i));
        const p0 = hp(x, 0.757, 0.16, 0.012);
        const p1: [number, number, number, number] = [p0[0] + out * 0.45, p0[1] - 0.016, p0[2] + 0.014, 0.0095];
        const p2: [number, number, number, number] = [p0[0] + out * 1.0 + jit(n) * 0.006, p0[1] - 0.033, p0[2] + 0.02 + jit(n + 5) * 0.006, 0.005];
        return sdf.chain([p0, p1, p2], 0.008);
      }),
    );
    const sideFront = pair(sdf.chain([hp(0.155, 0.72, 0.12, 0.018), hp(0.168, 0.68, 0.13, 0.015), hp(0.172, 0.64, 0.135, 0.008)], 0.01));
    // Two short locks behind each ear.
    const sideBack = pair(sdf.chain([hp(0.17, 0.7, -0.1, 0.02), hp(0.183, 0.65, -0.1, 0.016), hp(0.182, 0.6, -0.1, 0.008)], 0.01));
    // Chunky locks at the nape, under the back guard.
    const nape = sdf.union(
      ...[-2, -1, 0, 1, 2].map((i) => {
        const x = i * 0.06;
        return sdf.chain([hp(x, 0.62, -0.17, 0.034), hp(x * 1.05 + jit(i + 20) * 0.02, 0.56, -0.17, 0.03), hp(x * 1.05 + jit(i + 30) * 0.02, 0.51, -0.14, 0.018)], 0.012);
      }),
    );
    const hair = sdf
      .smoothUnion(0.012, cap, fringe, sideFront, sideBack, nape)
      .bone('head')
      .paintFn((x, y, z, base) => {
        const w = Math.sin(Math.atan2(x, z) * 18 + y * 34 + noise.noise3(x * 20, y * 20, z * 20) * 2);
        return w > 0.3 ? mixRgb(base, rgb(T.hairDark), Math.min(0.55, (w - 0.3) * 1.3)) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ the bronze crested helmet
    // A dome cut open at the face; a brim that flares 0.02 m all round and dips 0.03 m at the front
    // and the back; a raised V ridge (0.012 wide) from the brow up the front; a rounded-wedge cheek
    // plate on each side; a neck guard; a 0.012 crown ridge that rises into a tapered crest, with a
    // dark brush on top.
    const outer = sdf.ellipsoid([0.226, 0.216, 0.208]).at(0, 0.685, -0.014);
    const inner = sdf.ellipsoid([0.206, 0.196, 0.188]).at(0, 0.678, -0.012);
    const keepZone = sdf.union(sdf.box([1, 1, 1]).at(0, 0.665 + 0.5, 0), sdf.box([1, 1, 0.5]).at(0, 0.6 + 0.5, -0.075 - 0.25));
    const faceWindow = sdf
      .extrude(
        profile.polygon([
          [-0.25, 0.6],
          [-0.25, 0.7],
          [-0.19, 0.735],
          [-0.12, 0.756],
          [0, 0.728],
          [0.12, 0.756],
          [0.19, 0.735],
          [0.25, 0.7],
          [0.25, 0.6],
        ]),
        0.5,
      )
      .at(0, 0, 0.25);
    // The brim: a shell 0.012 to 0.02 outside the dome, level all round at the brow, with a dip of
    // 0.03 at the front (a narrow tab over the nose bridge) and at the back.
    const flangeShell = outer.round(0.02).subtract(outer.round(0.011));
    const level = sdf.box([0.7, 0.017, 0.7]).at(0, 0.7435, 0);
    const dipFront = sdf.box([0.056, 0.05, 0.3]).at(0, 0.7135 + 0.008, 0.25).round(0.006);
    const dipBack = sdf.box([0.26, 0.05, 0.3]).at(0, 0.7135 + 0.008, -0.25).round(0.006);
    const brim = flangeShell.intersect(sdf.smoothUnion(0.008, level, dipFront, dipBack));
    // The V ridge: two strokes 0.012 wide from the brow center up and out, hugging the dome.
    const stroke = (sgn: number) => {
      const A: [number, number] = [0, 0.722];
      const B: [number, number] = [0.052 * sgn, 0.87];
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const l = Math.hypot(dx, dy);
      const nx = (dy / l) * 0.006;
      const ny = (-dx / l) * 0.006;
      return sdf.extrude(profile.polygon([[A[0] + nx, A[1] + ny], [B[0] + nx, B[1] + ny], [B[0] - nx, B[1] - ny], [A[0] - nx, A[1] - ny]]), 0.3);
    };
    const vRidge = sdf.union(stroke(1), stroke(-1)).at(0, 0, 0.2).intersect(outer.round(0.011));
    const dome = sdf.smoothUnion(0.008, outer.intersect(keepZone), vRidge).subtract(inner).subtract(faceWindow);
    // Cheek plate: a rounded wedge, wide at the helmet edge and narrowing toward the jaw.
    const wedge = sdf
      .extrude(
        profile.polygon(
          [
            [0.058, 0.715],
            [0.0, 0.722],
            [-0.05, 0.7],
            [-0.05, 0.64],
            [-0.028, 0.585],
            [-0.006, 0.55],
            [0.02, 0.575],
            [0.046, 0.63],
          ],
          { smooth: true, samples: 3 },
        ),
        0.02,
        0.007,
      )
      .rotateY(70)
      .at(0.199, 0, 0.078);
    const cheekPlate = hard(wedge);
    const domeY = (z: number) => 0.685 + 0.216 * Math.sqrt(Math.max(0, 1 - ((z + 0.014) / 0.208) ** 2));
    const finTop: [number, number][] = [];
    for (let z = 0.15; z >= -0.171; z -= 0.04) finTop.push([-z, domeY(z) + 0.014 + 0.066 * Math.cos((z * Math.PI) / 0.42) ** 2]);
    const fin = sdf
      .extrude(profile.polygon([[-0.19, 0.735], ...finTop, [0.2, 0.72], [0.1, 0.78], [-0.1, 0.78]]), 0.014, 0.004)
      .rotateY(90);
    const helmet = sdf
      .union(dome, brim, cheekPlate.bone('head'), fin)
      .bone('head')
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.bronzeDark), Math.min(0.55, Math.max(0, (0.72 - y) / 0.12) * 0.55 + 0.25 * Math.max(0, noise.fbm(x * 30, y * 30, z * 30, 2)))));
    k.body('helmet', helmet, { color: C.bronze, roughness: 0.4, metalness: 0.7, detail: 0.0048, bone: 'head' });
    // The dark brown brush on top of the fin: a displaced box along the crown.
    const brush = sdf
      .smoothUnion(
        0.012,
        ...[-0.05, -0.025, 0, 0.025, 0.05].map((z, i) => sdf.ellipsoid([0.011, 0.034 + 0.008 * (i % 2) - 0.006 * Math.abs(z) * 20, 0.02]).at(0, 1.0 - 0.006 * Math.abs(i - 2), -0.014 + z)),
      )
      .displace(0.003, (x, y, z) => noise.fbm(x * 90, y * 60, z * 90, 2));
    k.body('crest', brush, { color: C.crest, roughness: 0.75, detail: 0.004, bone: 'plume' });

    // ------------------------------------------------------------------ bare torso, arms, legs, feet (skin)
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
      .scale([1.1, 1, 0.8]);
    const pecs = pair(sdf.ellipsoid([0.058, 0.042, 0.03]).at(0.055, 0.385, 0.078));
    const chestShape = sdf.smoothUnion(0.03, torso, pecs);
    const torsoSkin = sdf.union(
      chestShape.intersect(sdf.halfSpace([0, -1, 0], -0.31)).bone('chest'),
      chestShape.intersect(sdf.halfSpace([0, 1, 0], 0.31)).bone('spine'),
    );
    const arm = (sh: V3, el: V3, wr: V3, side: 'L' | 'R', fist: sdf.Shape) =>
      sdf.smoothUnion(
        0.02,
        sdf.sphere(0.0616).at(sh[0] * 1.08, sh[1] + 0.012, sh[2]).bone(`upperarm.${side}`),
        sdf.cone(sh, lerp(sh, el, 1.05), 0.0572, 0.0506).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.045, 0.039).bone(`forearm.${side}`),
        fist.bone(`hand.${side}`),
      );
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1).scale(1.08));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1).scale(1.08));
    // Legs: bare thighs, shins, and bare feet with toes.
    const thighs = pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L'));
    const shins = pair(sdf.cone([0.093, 0.128, 0.004], [0.098, 0.06, 0.0], 0.042, 0.033).bone('shin.L'));
    const footSkin = sdf
      .smoothUnion(
        0.016,
        sdf.ellipsoid([0.043, 0.03, 0.078]).at(0, 0.036, 0.03),
        sdf.ellipsoid([0.036, 0.034, 0.05]).at(0, 0.055, -0.005),
        sdf.sphere(0.016).at(-0.022, 0.024, 0.104),
        sdf.sphere(0.013).at(-0.006, 0.022, 0.11),
        sdf.sphere(0.012).at(0.009, 0.021, 0.108),
        sdf.sphere(0.011).at(0.022, 0.02, 0.1),
      )
      .intersect(sdf.halfSpace([0, -1, 0], -0.008));
    const legsAndFeet = sdf.union(
      sdf.smoothUnion(0.02, thighs, shins),
      pair(footSkin.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L')),
    );
    const body = sdf.union(
      sdf.smoothUnion(0.02, torsoSkin, arm(SHOULDER, ELBOW_L, WRIST_L, 'L', fistL), arm(mx(SHOULDER), ELBOW_R, WRIST_R, 'R', fistR)),
      legsAndFeet,
    );
    k.body('body', body, { color: T.skin, roughness: 0.55 });

    // ------------------------------------------------------------------ red cloth: neck scarf and skirt
    // A wrapped neck band (0.025 tall) with a knot on the -X side and a hanging tail 0.06 long.
    const scarf = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.108, 0.025, 0.01).subtract(sdf.cylinder(0.06, 0.2)).at(0, 0.448, -0.004).scale([1, 1, 0.88]),
        sdf.ellipsoid([0.026, 0.022, 0.022]).at(-0.052, 0.446, 0.09),
        sdf.chain([[-0.056, 0.44, 0.1, 0.018], [-0.062, 0.412, 0.112, 0.015], [-0.064, 0.386, 0.116, 0.009]], 0.008),
      )
      .bone('chest');
    // The skirt: a flared shell of 16 wedges from the belt down to a ragged hem; each wedge follows
    // the bone nearest to it, so the legs swing under it.
    const STRIPS = 16;
    const stripAngle = (i: number) => i * (360 / STRIPS);
    const stripBone = (a: number) => (Math.sin(a * rad) > 0.4 ? 'leg.L' : Math.sin(a * rad) < -0.4 ? 'leg.R' : 'hips');
    const hemOf = (i: number) => (i === 0 ? 0.108 : i === 1 || i === STRIPS - 1 ? 0.138 : i % 2 ? 0.145 : 0.132);
    const skirtRing = sdf
      .revolve(
        profile.polygon([
          [0.124, 0.262],
          [0.142, 0.262],
          [0.178, 0.09],
          [0.162, 0.09],
        ]),
      )
      .scale([1, 1, 0.8]);
    const wedges = (make: (i: number) => sdf.Shape) =>
      sdf.union(
        ...Array.from({ length: STRIPS }, (_, i) => {
          const a = stripAngle(i);
          const hem = hemOf(i);
          const w = i === 0 ? 0.1 : 0.078;
          return make(i)
            .intersect(sdf.box([w, 0.34 - hem, 0.4], 0.008).at(0, (0.34 + hem) / 2, 0.2).rotateY(a))
            .bone(stripBone(a));
        }),
      );
    const skirt = wedges(() => skirtRing).paintFn((x, y, z, base) => {
      const w = Math.sin(Math.atan2(x, z) * STRIPS * 0.5 + noise.noise3(x * 12, y * 12, z * 12) * 0.6);
      return w > 0.35 ? mixRgb(base, rgb(T.clothDark), Math.min(0.85, (w - 0.35) * 1.6)) : base;
    });
    const cloth = sdf
      .union(scarf.paintFn((x, y, z, base) => (noise.noise3(x * 25, y * 25, z * 25) > 0.25 ? mixRgb(base, rgb(T.clothDark), 0.55) : base)), skirt)
;
    k.body('cloth', cloth, { color: T.cloth, roughness: 0.85, detail: 0.006 });

    // ------------------------------------------------------------------ leather: harness, belt, skirt strap, bracers, sandals
    const shell = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    // A strap across the chest from the left shoulder to the right hip.
    const strap = shell(chestShape, 0.008, 0.002).smoothIntersect(0.004, sdf.box([0.8, 0.036, 0.8], 0.006).rotateZ(38).at(0, 0.35, 0));
    const beltY = 0.25;
    const belt = torso.round(0.022).smoothIntersect(0.006, sdf.box([0.5, 0.07, 0.5], 0.008).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const skirtBand = wedges(() => skirtRing.round(0.005).intersect(sdf.box([0.5, 0.024, 0.5]).at(0, 0.19, 0)));
    const shorts = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.09]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.088, 0.15, 0.002], 0.05).bone('leg.L')),
    );
    const bracer = (e: V3, w: V3) =>
      sdf.union(
        sdf.cone(lerp(e, w, 0.34), lerp(e, w, 0.98), 0.05, 0.046),
        ...[0.4, 0.7].map((t) => sdf.cone(lerp(e, w, t), lerp(e, w, t + 0.22), 0.055, 0.052).round(0.003)),
      );
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R'));
    // Sandals: a flat sole, a strap across the instep, and an ankle cuff.
    const sole = sdf.ellipsoid([0.05, 0.03, 0.105]).at(0, 0, 0.038).intersect(sdf.box([0.2, 0.0132, 0.4]).at(0, 0.0066, 0));
    const instep = sdf.torus(0.046, 0.0085).rotateX(90).scale([1, 0.72, 1]).at(0, 0.03, 0.03).intersect(sdf.halfSpace([0, -1, 0], -0.008));
    const cuff = sdf.cylinder(0.045, 0.03, 0.008).subtract(sdf.cylinder(0.031, 0.2)).at(0, 0.05, 0.003);
    const sandal = sdf.union(sole.paint(C.sole), instep, cuff).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    const leather = sdf.union(strap.bone('chest'), belt.bone('spine'), skirtBand, shorts.paint(C.shorts), bracers, pair(sandal)).paintWhere(sdf.halfSpace([0, 1, 0], 0.007), C.sole);
    k.body('leather', leather, { color: C.leather, roughness: 0.7, detail: 0.006 });

    // A short brown leather cape on the -X side: a curved shell that hangs from the shoulder disc
    // over the back of the arm.
    const capeShell = chestShape.round(0.021).subtract(chestShape.round(0.009)).intersect(sdf.ellipsoid([0.085, 0.115, 0.2]).at(-0.12, 0.385, -0.1));
    k.body('cape', capeShell.bone('chest'), { color: C.leather, roughness: 0.8, detail: 0.005, bone: 'chest' });

    // ------------------------------------------------------------------ bronze: shoulder discs, belt buckle, studs, greaves
    const buckle = sdf
      .union(
        sdf.cylinder(0.038, 0.012, 0.004).rotateX(90),
        sdf.torus(0.032, 0.006).rotateX(90).at(0, 0, 0.006),
        sdf.sphere(0.014).at(0, 0, 0.006),
      )
      .at(0, beltY, beltZ + 0.003)
      .bone('spine');
    const ringZ = sdf.raycast(strap, [0, 0.35, 1], [0, 0, -1])![2];
    const ring = sdf.torus(0.017, 0.006).rotateX(90).at(0, 0.35, ringZ).bone('chest');
    // Two flat shoulder discs (r 0.062, 0.016 thick) tilted outward, with four rivets each.
    const discLocal = sdf.union(
      sdf.cylinder(0.07, 0.016, 0.005),
      ...[45, 135, 225, 315].map((a) => sdf.sphere(0.0065).at(0.05 * Math.cos(a * rad), 0.008, 0.05 * Math.sin(a * rad))),
    );
    const shoulderDiscs = pair(discLocal.rotateZ(-32).at(0.168, 0.452, 0).bone('upperarm.L'));
    const studs = sdf.union(
      ...Array.from({ length: STRIPS }, (_, i) => {
        const a = stripAngle(i) * rad;
        const r = 0.16;
        return sdf.sphere(0.0075).at(Math.sin(a) * r, 0.19, Math.cos(a) * r * 0.8).bone(stripBone(stripAngle(i)));
      }),
    );
    // Greaves: a front half-shell on each shin, plus three cuff studs on each ankle.
    const shinShape = sdf.cone([0.093, 0.128, 0.004], [0.098, 0.06, 0.0], 0.042, 0.033);
    const greave = pair(
      shell(shinShape, 0.009, 0.0025)
        .intersect(sdf.box([0.2, 0.062, 0.1]).at(0.096, 0.098, 0.05))
        .bone('shin.L'),
    );
    const cuffStuds = pair(
      sdf
        .union(...[-40, 0, 40].map((a) => sdf.sphere(0.006).at(0.046 * Math.sin(a * rad), 0.05, 0.003 + 0.046 * Math.cos(a * rad))))
        .rotateY(12)
        .at(ANKLE[0], 0, 0)
        .bone('foot.L'),
    );
    k.body('bronze', sdf.union(buckle, ring, shoulderDiscs, studs, greave, cuffStuds), { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ the gladius in the right hand
    // Local frame: the grip center at the origin, the blade toward -Y, the flat facing +Z.
    const BLADE_W = 0.05;
    const BLADE_T = 0.013;
    const LENS_R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(LENS_R, 1).at(0, 0, LENS_R - BLADE_T / 2),
      sdf.cylinder(LENS_R, 1).at(0, 0, -(LENS_R - BLADE_T / 2)),
    );
    const bladeLocal = sdf
      .extrude(
        profile.polygon(
          [
            [-0.021, -0.06],
            [-0.025, -0.11],
            [-0.02, -0.19],
            [-0.011, -0.29],
            [0, -0.33],
            [0.011, -0.29],
            [0.02, -0.19],
            [0.025, -0.11],
            [0.021, -0.06],
          ],
          { smooth: true, samples: 4 },
        ),
        0.2,
      )
      .subtract(sdf.union(sdf.box([0.011, 0.17, 0.006], 0.003).at(0, -0.18, 0.0068), sdf.box([0.011, 0.17, 0.006], 0.003).at(0, -0.18, -0.0068)))
      .intersect(lens)
      .scale([1.45, 1, 1])
      .paintWhere(sdf.box([0.017, 0.17, 0.2]).at(0, -0.18, 0), '#4a5058', 0.003);
    const guardLocal = sdf.box([0.09, 0.016, 0.026], 0.007).bend(4).at(0, -0.063, 0);
    const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.02).at(0, 0.048, 0), sdf.cone([0, 0.03, 0], [0, 0.042, 0], 0.013, 0.016));
    const gripLocal = sdf.cylinder(0.0135, 0.1, 0.004).at(0, -0.012, 0);
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    const SWORD_Z = -36; // the idle hold: the tip points down and out
    const swordPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(SWORD_Z).at(...GRIP);
    k.body('blade', swordPose(bladeLocal), { color: C.steel, roughness: 0.4, metalness: 0.85, detail: 0.003, bone: 'hand.R' });
    k.body('hilt', swordPose(sdf.union(guardLocal, pommelLocal)), { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.004, bone: 'hand.R' });
    k.body('grip', swordPose(gripLocal), {
      color: C.grip,
      roughness: 0.75,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
    });

    // ------------------------------------------------------------------ round shield on the left forearm
    // Local frame (the knight's shield frame): the face toward +Z, centered on the origin. A brown
    // wooden face, a raised bronze rim, a domed bronze boss with six studs around it.
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-4).rotateX(4).rotateY(38).at(0.236, 0.28, 0.092);
    const SHIELD_R = 0.13;
    const face = sdf
      .cylinder(SHIELD_R - 0.006, 0.02, 0.004)
      .rotateX(90)
      .at(0, -0.006, 0)
      .paintFn((x, y, z, base) => {
        const g = Math.sin(noise.noise3(x * 4, y * 4, z * 4) * 3 + y * 120);
        return g > 0.4 ? mixRgb(base, rgb(C.shieldDark), 0.5) : base;
      });
    const rim = sdf.cylinder(SHIELD_R, 0.032, 0.006).subtract(sdf.cylinder(SHIELD_R - 0.019, 0.2)).rotateX(90).at(0, -0.006, 0);
    const boss = sdf.smoothUnion(0.008, sdf.sphere(0.036).scale([1, 1, 0.55]).at(0, -0.006, 0.01), sdf.cylinder(0.042, 0.012, 0.004).rotateX(90).at(0, -0.006, 0.006));
    const bossStuds = sdf.union(
      ...[0, 60, 120, 180, 240, 300].map((a) => sdf.sphere(0.0075).at(0.075 * Math.cos(a * rad), -0.006 + 0.075 * Math.sin(a * rad), 0.012)),
    );
    const handle = sdf.capsule([-0.035, -0.006, -0.026], [0.035, -0.006, -0.026], 0.011);
    k.body('shield-bronze', shieldPose(sdf.union(rim, boss, bossStuds, handle)), { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.005, bone: 'forearm.L' });
    k.body('shield', shieldPose(face), { color: C.shieldFace, roughness: 0.75, detail: 0.004, bone: 'forearm.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        plume: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The shield arm stays in front of the body; the sword arm swings a little.
    // shield: the [upper arm, forearm] X offsets that keep the shield's top edge clear of the cheek.
    // The legs come from motion.gait: planted stance sabatons, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the right
    // arm is most forward. The hips' sway goes to gait, so the planted feet do not slide.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flow: number,
      shield: readonly [number, number] = [0, 0],
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
          plume: { rotate: [flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s + shield[0], 0, 3] as const },
          'forearm.L': { rotate: [shield[1], 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s) - (armSwing > 40 ? 22 : 5), 0, 0] as const },
        };
      },
    });
    // A knight in armor walks heavier: short steps, a low swing, long stances.
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6, [4, 0]));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // A diagonal slash, solved by targets (as the animated armor's attack). The wrist follows keys
    // in the chest's rest frame (reach); the blade follows its own keys; edgeUp turns the flat so
    // the edge leads. The arm is short and the helm is big, so the wind-up rises on the right side,
    // out beside the helm; the blade comes over the right shoulder, forward under the helm's rim,
    // and sweeps down across the front to the low left. The hips and chest turn, the left foot
    // steps, the hips drop, and the shield rises in front of the left side.
    const { keys, reach, orient, edgeUp } = motion;
    const BLADE_DIR = rotZ(rotX([0, -1, 0], -12), SWORD_Z); // the blade (local -Y) at rest, as swordPose
    const FLAT = rotZ(rotX([0, 0, 1], -12), SWORD_Z); // the flat's normal (local +Z) at rest
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    // The rest elbow's bend direction, so the solved arm starts and ends on the rest pose.
    const POLE_REST = (() => {
      const s = mx(SHOULDER);
      const t = norm([WRIST_R[0] - s[0], WRIST_R[1] - s[1], WRIST_R[2] - s[2]]);
      const e: V3 = [ELBOW_R[0] - s[0], ELBOW_R[1] - s[1], ELBOW_R[2] - s[2]];
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(s, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    })();
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.14, norm([-0.92, 0.12, 0.3])], // out to the right, level
      [0.28, norm([-0.75, 0.55, -0.37])], // up and back over the right shoulder, out beside the helm
      [0.38, norm([-0.72, 0.58, -0.38])], // the hold at the top
      [0.44, norm([-0.6, 0.6, 0.5])], // over the shoulder: forward on the right, up and out
      [0.48, norm([-0.25, 0.15, 0.95])], // level, pointing forward, under the helm's rim
      [0.53, norm([0.55, -0.25, 0.8])], // across the front to the left
      [0.6, norm([0.8, -0.32, 0.5])], // low left
      [0.7, norm([0.78, -0.34, 0.5])], // the follow-through holds
      [0.86, norm([-0.3, -0.35, 0.89])], // back through the front, the tip clear of the floor
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.265, 0.38, 0.06]],
            [0.28, [-0.285, 0.462, -0.035]],
            [0.38, [-0.278, 0.476, -0.04]],
            [0.44, [-0.29, 0.45, 0.055]],
            [0.48, [-0.24, 0.39, 0.16]],
            [0.53, [-0.15, 0.36, 0.175]],
            [0.6, [-0.15, 0.3, 0.163]],
            [0.7, [-0.15, 0.302, 0.162]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The elbow points out and back in the wind-up, then out, down, and forward through the
        // cut, so the forearm stays in front of the breastplate.
        const pole = keys(p, [
          [0, POLE_REST],
          [0.14, [-0.6, 0.2, -0.2]],
          [0.4, [-0.6, 0.25, -0.15]],
          [0.48, [-0.5, 0.05, 0.4]],
          [0.75, [-0.5, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up: edgeUp(bladeAt, p, FLAT) });
        const wind = ease(0, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.42, 0.56, p) * (1 - ease(0.72, 1, p));
        const step = 24 * cut;
        const guard = ease(0, 0.2, p) * (1 - ease(0.75, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.025 * cut - 0.01 * wind], rotate: [0, -10 * wind + 16 * cut, 0] },
          spine: { rotate: [-4 * wind + 7 * cut, 0, 0] },
          chest: { rotate: [-3 * wind + 4 * cut, -16 * wind + 20 * cut, 0] },
          // The head turns with the chest: the shield's top edge sits close under the left cheek.
          head: { rotate: [-2 * wind - 2 * cut, 3 * wind - 3 * cut, 0] },
          plume: { rotate: [6 * wind - 14 * cut, 0, -4 * wind + 6 * cut] },
          cloak: { rotate: [-3 * wind + 10 * cut, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The shield stays up in front of the left side and comes a little forward, clear of the cheek.
          'upperarm.L': { rotate: [-30 * guard, 0, 0] },
          'forearm.L': { rotate: [35 * guard, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the shield jolts down and out and comes back up; the plume and the cape lag.
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
          plume: { rotate: [16 * lag, 0, 5 * lag] },
          cloak: { rotate: [9 * lag, 0, 0] },
          'upperarm.R': { rotate: [8 * h, 0, -10 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [10 * jolt, 0, 10 * jolt] },
          'forearm.L': { rotate: [22 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The big helm
    // and the cape hold the body up, so the hips stay high, the neck bends a little forward, and the
    // cape flattens under him (scale). The sword arm falls out to the right with the blade flat on
    // the ground; the shield arm falls to the left side and the shield lies face up over it.
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
    const SHIELD_N = rotY(rotX(rotZ([0, 0, 1], -4), 4), 38); // the shield face's normal at rest
    const FOREARM_L = norm(sub(WRIST_L, ELBOW_L));
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045, // how far the hips come down
      back: 0.15, // how far the hips land behind the start
      neck: 9, // the neck and the head bend forward, so the helm clears the ground
      head: 12,
      cape: 8, // the cape swings toward the legs and flattens under him
      capeFlat: 0.4,
      leg: 34, // the legs lie back down to the ground
      wristR: [-0.27, 0.35, -0.1] as V3,
      bladeR: norm([-0.52, -0.85, -0.14]),
      wristL: [0.19, 0.235, 0.05] as V3,
      poleL: [0.5, 0.3, -0.3] as V3,
      shieldN: norm([0.25, -0.1, 0.96]),
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
        // The cape bunches up and swings toward the legs as it meets the ground, then spreads.
        const crumple = keys(p, [[0.3, 0], [0.48, 1], [0.7, 1], [0.9, 0]] as const);
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        // The sword arm flies out in the blow and falls to the ground on the right; the blade
        // turns flat and points out toward the feet.
        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, BLADE_DIR], [0.1, norm([-0.75, -0.45, 0.48])], [0.4, norm([-0.75, -0.55, 0.36])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, FLAT], [0.4, FLAT], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

        // The shield arm flies out, then falls to his left side; the forearm turns the shield face up.
        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
        const armL = reach(ARM_L, wristL, poleL);
        const elbowL = motion.follow([SHOULDER], [armL.upper], ELBOW_L);
        const faceUp = norm(keys(p, [[0, SHIELD_N], [0.36, norm([0.9, 0, 0.44])], [0.76, D.shieldN]] as const));
        const forearmL = orient([armL.upper], { dir: FOREARM_L, up: SHIELD_N }, { dir: norm(sub(wristL, elbowL)), up: faceUp });

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
        // The soles stay flat on the ground while the legs trail the fall, then the toes turn up.
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
          'forearm.L': { rotate: forearmL },
          // The right foot steps back in the stagger; the legs trail the fall and lie back down.
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ shield arm by the shield's frame
    // The shield is rigid on the forearm, so the shield's pose sets the forearm: give the upper arm's
    // direction (chest rest frame) and the shield's turn (yaw about Y, tilt of the top forward, roll,
    // as in shieldPose). The elbow, the wrist, and the shield center follow; reach and orient solve
    // the arm. The rest values (upper arm at rest, 38, 4, -4) give the rest pose.
    const SHIELD_C: V3 = [0.236, 0.28, 0.092];
    const shieldLocal = (p: V3): V3 => rotZ(rotX(rotY(p, -38), -4), 4);
    const shieldTurn = (p: V3, yaw: number, tilt: number, roll: number): V3 => rotY(rotX(rotZ(p, roll), tilt), yaw);
    const ELBOW_IN_SHIELD = shieldLocal(sub(ELBOW_L, SHIELD_C));
    const WRIST_IN_SHIELD = shieldLocal(sub(WRIST_L, SHIELD_C));
    const UPPER_L = norm(sub(ELBOW_L, SHOULDER));
    const UPPER_LEN = Math.hypot(...sub(ELBOW_L, SHOULDER));
    const shieldArm = (u: V3, yaw: number, tilt: number, roll = -4) => {
      const d = norm(u);
      const elbow = add(SHOULDER, [d[0] * UPPER_LEN, d[1] * UPPER_LEN, d[2] * UPPER_LEN]);
      const center = sub(elbow, shieldTurn(ELBOW_IN_SHIELD, yaw, tilt, roll));
      const wrist = add(center, shieldTurn(WRIST_IN_SHIELD, yaw, tilt, roll));
      const arm = reach(ARM_L, wrist, elbow);
      const lower = orient([arm.upper], { dir: FOREARM_L, up: SHIELD_N }, { dir: norm(sub(wrist, elbow)), up: shieldTurn([0, 0, 1], yaw, tilt, roll) });
      return { upper: arm.upper, lower };
    };
    const blend = (a: V3, parts: readonly (readonly [V3, number])[]): V3 =>
      parts.reduce<V3>((acc, [v, w]) => add(acc, [(v[0] - a[0]) * w, (v[1] - a[1]) * w, (v[2] - a[2]) * w]), a);

    // attack2: a shield bash. Brace: the hips turn and the chest turns the left shoulder forward,
    // the weight goes back, the elbow draws back and the shield face turns to the front. Drive: the
    // left foot steps forward, the hips drop and move forward, and the shield punches straight
    // forward at chest height, the top tipped forward so the rim stays clear of the helm. The sword
    // stays ready at the right side. The plume and the cape lag and whip at the stop.
    const BASH = {
      braceU: [0.6, -0.7, -0.38] as V3, // the elbow draws back and out
      braceYaw: 36, // with the body's turn of -26, the face points nearly forward
      braceTilt: 8,
      driveU: [0.3, -0.1, 1] as V3, // the upper arm points forward, a little out (the forearm clears the cuirass)
      driveYaw: 14, // with the body's turn of -14, the face points straight forward
      driveTilt: 9,
      step: 26, // the lunge: the left foot lands 2 * LEG * sin(step) ahead
    };
    k.animation('attack2', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const brace = ease(0, 0.28, p) * (1 - ease(0.3, 0.44, p));
        const drive = ease(0.3, 0.46, p) * (1 - ease(0.62, 1, p));
        const ready = ease(0, 0.2, p) * (1 - ease(0.62, 1, p));
        const lead = ease(0.34, 0.48, p) * (1 - ease(0.64, 0.96, p)); // the left foot lags the hips a little, so it lifts
        const lag = keys(p, [[0, 0], [0.26, 0.35], [0.4, -0.2], [0.48, -1], [0.58, 0.85], [0.7, -0.35], [0.84, 0.15], [1, 0]] as const, 'spline');

        const u = blend(UPPER_L, [[BASH.braceU, brace], [BASH.driveU, drive]]);
        const yaw = 38 + (BASH.braceYaw - 38) * brace + (BASH.driveYaw - 38) * drive;
        const tilt = 4 + (BASH.braceTilt - 4) * brace + (BASH.driveTilt - 4) * drive;
        const armL = shieldArm(u, yaw, tilt);

        // The right foot stays planted; the left foot lands ahead.
        const reachZ = LEG * Math.sin(BASH.step * rad);
        const hipsZ = -0.015 * brace + reachZ * drive;
        const footL = 2 * reachZ * lead;
        const aR = Math.asin(hipsZ / LEG) / rad;
        const aL = -Math.asin((footL - hipsZ) / LEG) / rad;
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, aL), legDrop(LEG, aR)), hipsZ], rotate: [0, -8 * brace - 4 * drive, 0] },
          spine: { rotate: [3 * brace + 8 * drive, 0, 0] },
          chest: { rotate: [2 * brace + 4 * drive, -18 * brace - 10 * drive, 0] },
          // The head keeps looking forward and lifts the chin a little behind the shield.
          neck: { rotate: [-3 * drive, 7 * brace + 4 * drive, 0] },
          head: { rotate: [2 * brace - 7 * drive, 14 * brace + 8 * drive, 0] },
          plume: { rotate: [14 * lag, 0, 3 * lag] },
          cloak: { rotate: [-10 * lag, 0, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: [-6 * ready, 0, -6 * ready] },
          'forearm.R': { rotate: [-10 * ready, 0, 0] },
          'leg.L': { rotate: [aL, 0, 0] },
          'leg.R': { rotate: [aR, 0, 0] },
          'foot.L': { rotate: [-aL, 0, 0] },
          'foot.R': { rotate: [-aR, 0, 0] },
        };
      },
    });

    // victory: the sword goes out to the right and up, high beside the helm (the blade leans out,
    // clear of the helm and the plume, the flat to the front); the shield comes up at his left side;
    // the chest opens and tilts a little to the left. Then a proud nod, and he holds the pose with
    // the chin up. The plume and the cape sway.
    const WIN = {
      wrist: [-0.298, 0.458, 0.04] as V3,
      blade: norm([-0.22, 0.97, 0.1]),
      shieldU: [0.85, 0.25, 0.35] as V3, // the upper arm out and a little up: the shield rises about 7 cm
      shieldYaw: 48,
      shieldTilt: 0,
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const shield = ease(0.06, 0.34, p);
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
        const blade = norm(
          keys(p, [[0, BLADE_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.26, 0.95, 0.14])], [0.32, norm([-0.18, 0.98, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.12, [0, 1, 0.2]], [0.26, [0.1, 0.2, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

        const armL = shieldArm(blend(UPPER_L, [[WIN.shieldU, shield]]), 38 + (WIN.shieldYaw - 38) * shield, 4 + (WIN.shieldTilt - 4) * shield);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          // The head leans with the chest, away from the sword; the right ear disc stays clear of the hilt.
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          plume: { rotate: [12 * lag, 0, 6 * sway] },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          // The right shoulder lifts a little (a shrug), so the sword goes higher.
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
