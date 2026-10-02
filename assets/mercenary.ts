import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Mercenary — Chibi Quest enemy (catalog `enemies/humanoid/mercenary`), 1.0 m to the top of the
 * hair spikes, faces +Z. Target: docs/enemy-mockups/mercenary_001.jpg. Built on the knight's body,
 * face, and skeleton (knee bones kept), so the humanoids read as a set.
 *
 * Role: an enemy the player fights, seen in 3D and as a 128 px sprite, so the hair, beard, plate,
 *   red sash, and sword must read small.
 * One idea: a scowling sell-sword, a black spiky mop and a full black beard around a small angry
 *   face, in dented steel over a blue gambeson, a broad sword held low.
 * Size: hair tips 1.0, brows 0.68, chin 0.48, pauldrons 0.44, plate hem 0.30, belt 0.255, boots 0.
 * Shape language: square and sturdy (plate, pauldrons, fists), sharp accents (hair spikes, sword).
 * Palette (60/30/10): steel #8a8c92 and black hair #24201c (dark/mid); gambeson blue #2e4a6a; the
 *   red sash #a83a30 is the accent. Skin #f0c8a0, leather #4a3222, skirt #5a3a26, boots #3a2418.
 * Value plan: the pale face sits between the black hair and beard (focal point); the steel plate is
 *   the light mass; the red sash and the sword are the small accents.
 * Bodies: skin, arms, hair, beard, cuirass, iron, gambeson, wrap, pauldrons, bracers, belt, skirt,
 *   leggings, boots, sword, hilt, grip.
 * Rig: the knight's chibi skeleton without plume and cloak; sword rigid on the right hand, the left
 *   hand a bare fist. Clips: idle, walk, run, attack (a two-hand sweep), hit, death, taunt.
 */

const C = {
  skin: '#f0c8a0',
  blush: '#e8a088',
  eyeWhite: '#f6f1ea',
  irisRim: '#150d08',
  iris: '#3a2416',
  pupil: '#0e0a08',
  lid: '#16100c',
  mouth: '#b0584a',
  scar: '#8a5a45',
  hair: '#24201c',
  hairLit: '#3a3430',
  plate: '#9a9ca2',
  plateLit: '#c8cace',
  plateDent: '#5a5c62',
  iron: '#6e7076',
  gambeson: '#2e4a6a',
  gambesonLit: '#3e5e80',
  gambesonDark: '#223a54',
  sash: '#a83a30',
  cuff: '#a83a30',
  sashDark: '#7a2a22',
  leather: '#4a3222',
  skirt: '#5a3a26',
  boot: '#3a2418',
  leggings: '#2c3140',
  steel: '#a0a4aa',
  edge: '#d0d4d8',
  pommel: '#8a8c92',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the knight's). The right forearm carries the sword low and out; the left forearm hangs
// forward with a bare fist.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
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
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const fistLocal = (s: 1 | -1) =>
  sdf
    .smoothUnion(
    0.018,
    sdf.ellipsoid([0.043, 0.048, 0.049]).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.009 * s, -0.061, 0.031], [-0.005 * s, -0.04, 0.044], 0.019),
    sdf.cone([0.021 * s, -0.024, 0.026], [0.001 * s, -0.035, 0.05], 0.018, 0.0145),
  )
    .scale(1.15);
// Each hand swings forward along its forearm, then turns about the forward axis.
const HAND_R = { pitch: -70, roll: -30 };
const HAND_L = { pitch: -62, roll: 26 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);

// The sword: the blade swings across the front, low, the pommel out to the right.
const SWORD_Z = 80;
const SWORD_Y = -35;
const BLADE_DIR = rotY(rotZ([0, -1, 0], SWORD_Z), SWORD_Y);
const SWORD_ROLL = 50; // the flat faces up and to the front
const FLAT = rotY(rotZ(rotY([0, 0, 1], SWORD_ROLL), SWORD_Z), SWORD_Y);

export default defineAsset({
  name: 'mercenary',
  description: 'Chibi mercenary with spiky black hair, a full beard, dented plate over a blue gambeson, red sash, and a broad sword.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/mercenary_001.jpg',
  variants: {
    gambeson: { blue: C.gambeson, green: '#3a5a3a', black: '#24242a' },
    sash: { red: C.sash, yellow: '#c8a030', white: '#d8d4c8' },
    hair: { black: C.hair, brown: '#5a3a26', grey: '#8a8a84' },
  },
  presets: {
    veteran: { gambeson: 'blue', sash: 'red', hair: 'black' },
    woodsman: { gambeson: 'green', sash: 'yellow', hair: 'brown' },
    ashen: { gambeson: 'black', sash: 'white', hair: 'grey' },
  },

  build(k) {
    const T = {
      hair: k.tint('hair'),
      hairLit: k.tint('hair', { color: C.hairLit, follow: 1 }),
      gamb: k.tint('gambeson'),
      gambLit: k.tint('gambeson', { color: C.gambesonLit, follow: 1 }),
      gambDark: k.tint('gambeson', { color: C.gambesonDark, follow: 1 }),
      sash: k.tint('sash'),
      sashDark: k.tint('sash', { color: C.sashDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
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
    const nose = sdf.ellipsoid([0.034, 0.032, 0.038]).at(0, 0.585, faceZ(0, 0.585) + 0.003).bone('head');
    const ears = pair(sdf.ellipsoid([0.028, 0.05, 0.035]).at(0.22, 0.655, -0.005)).bone('head');
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.05, 0.054, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.047, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.031, 0.07]), EYE[0], EYE[1] - 0.003));
    const lid = pair(sdf.extrude(profile.arc(0.049, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.011), x + 0.014, EYE[1] + 0.016),
        at(sdf.sphere(0.005), x - 0.013, EYE[1] - 0.02),
      ]),
    );
    // A scar above the right brow (the viewer's left): two short crossed strokes, 0.03 m long.
    const scarX = -0.09;
    const scarY = 0.738;
    const scarMark = sdf.union(
      sdf.extrude(profile.rect([0.007, 0.03], 0.003), 0.4).rotateZ(-38).at(scarX, scarY, 0.15),
      sdf.extrude(profile.rect([0.006, 0.03], 0.003), 0.4).rotateZ(40).at(scarX, scarY, 0.15),
    );
    // The mouth window, cut through the beard: a small downturned mouth.
    const MOUTH_Y = 0.522;
    const mouthWin = sdf.ellipsoid([0.032, 0.012, 0.2]).at(0, MOUTH_Y, 0.1);
    const frown = sdf.extrude(profile.arc(0.035, 0.007, 65, 115), 0.4).at(0, MOUTH_Y - 0.03, 0.15);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.02, ears)
      .paintWhere(pair(at(sdf.sphere(0.03), 0.14, 0.585)), C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(scarMark, C.scar, 0.002)
      .paintWhere(mouthWin, C.mouth, 0.004)
      .paintWhere(frown, '#7a4a40', 0.002)
      .paintWhere(sdf.sphere(0.02).at(0, 0.578, faceZ(0, 0.578) + 0.038), '#e8a88c', 0.01);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a cap and swept spikes
    const capFull = sdf.ellipsoid([HEAD[0] * 1.04, HEAD[1] * 1.04, HEAD[2] * 1.04]).at(0, HEAD_Y + 0.006, -0.008);
    // The hairline: cut at the brow, high at the temples so the ears show, low at the back.
    const cap = capFull
      .smoothSubtract(0.012, sdf.ellipsoid([0.32, 0.16, 0.3]).at(0, 0.6, 0.16))
      .union(capFull.intersect(sdf.halfSpace([0, 0, 1], -0.07)));
    // A spike from the cap at (x, z): tapered 0.02 to 0.004, swept back by `back` degrees, fanned out
    // sideways by `fan` degrees, `len` long.
    // The outward direction of the skull at a point (an ellipsoid normal), for spikes that leave the cap.
    const capNormal = (b: V3): V3 =>
      norm([(b[0] / HEAD[0] ** 2) * 0.04, ((b[1] - HEAD_Y) / HEAD[1] ** 2) * 0.04, (b[2] / HEAD[2] ** 2) * 0.04]);
    // A spike from the cap at (x, z): tapered r to 0.004, `len` long, leaving the skull along its normal
    // and swept back by `back` (a share of the length, 0.6 to 1 = 30 to 45 degrees at the crown).
    const spikeFrom = (b: V3, back: number, up: number, len: number, r: number) => {
      const n = capNormal(b);
      const d = norm([n[0] * 0.9 + Math.sign(b[0]) * Math.min(0.3, Math.abs(b[0]) * 3), n[1] * 0.9 + up, n[2] * 0.9 - back]);
      return sdf.cone(b, add(b, [d[0] * len, d[1] * len, d[2] * len]), r, 0.004);
    };
    // Spikes are placed by direction from the head center: yaw (0 = front, degrees) and elevation.
    const HC0: V3 = [0, HEAD_Y, -0.008];
    const spikeAt = (yaw: number, elev: number, len: number, back: number, up: number, r = 0.022) => {
      const out: V3 = [Math.sin(yaw * rad) * Math.cos(elev * rad), Math.sin(elev * rad), Math.cos(yaw * rad) * Math.cos(elev * rad)];
      return spikeFrom(sdf.surfacePoint(cap, add(HC0, [out[0] * 0.5, out[1] * 0.5, out[2] * 0.5]), -0.008), back, up, len, r);
    };
    // Ten swept spikes on the crown and the back of the head, tilted 30 to 45 degrees back, and four
    // longer-out ones at the temples.
    const spikes = sdf.union(
      spikeAt(0, 80, 0.09, 0.7, 0.25),
      spikeAt(110, 80, 0.09, 0.75, 0.25),
      spikeAt(-110, 80, 0.09, 0.75, 0.25),
      spikeAt(38, 64, 0.088, 0.7, 0.3),
      spikeAt(-38, 64, 0.088, 0.7, 0.3),
      spikeAt(95, 62, 0.085, 0.7, 0.3),
      spikeAt(-95, 62, 0.085, 0.7, 0.3),
      spikeAt(180, 62, 0.085, 0.7, 0.3),
      spikeAt(140, 40, 0.078, 0.5, 0.4),
      spikeAt(-140, 40, 0.078, 0.5, 0.4),
    );
    const temples = sdf.union(spikeAt(78, 36, 0.075, 0.55, 0.3), spikeAt(-78, 36, 0.075, 0.55, 0.3));
    // Two short spikes fall forward over the forehead, one each side of the scar.
    const fwdSpike = (x: number, len: number) => {
      const b = sdf.surfacePoint(cap, [x, 0.79, 0.3], -0.01);
      const d = norm([x * 1.2, -0.3, 0.9]);
      return sdf.cone(b, add(b, [d[0] * len, d[1] * len, d[2] * len]), 0.02, 0.005);
    };
    const fringe = sdf.union(fwdSpike(-0.05, 0.055), fwdSpike(0.035, 0.05));
    // A short undercut: a few small back-swept spikes low at the sides and the nape.
    const HC: V3 = [0, 0.7, -0.01];
    const ringSpike = (yaw: number, elev: number, len: number, r: number) => {
      const out: V3 = [Math.sin(yaw * rad) * Math.cos(elev * rad), Math.sin(elev * rad), Math.cos(yaw * rad) * Math.cos(elev * rad)];
      const b = sdf.surfacePoint(cap, add(HC, [out[0] * 0.5, out[1] * 0.5, out[2] * 0.5]), -0.014);
      const d = norm([out[0], out[1] + 0.25, out[2] - 0.55]);
      return sdf.cone(b, add(b, [d[0] * len, d[1] * len, d[2] * len]), r, 0.005);
    };
    const ring = sdf.union(
      ...([
        [110, 40], [-110, 40], [150, 35], [-150, 35], [180, 30],
      ] as [number, number][]).map(([yaw, elev]) => ringSpike(yaw, elev, 0.04, 0.03)),
    );
    // Thick brows, tilted hard: the inner end low. Each is a wedge pressed on the forehead.
    const browWedge = profile.polygon(
      [
        [-0.05, -0.02],
        [-0.03, 0.002],
        [0.0, 0.016],
        [0.03, 0.026],
        [0.058, 0.036],
        [0.062, 0.018],
        [0.035, 0.0],
        [0.0, -0.012],
        [-0.03, -0.028],
      ],
      { smooth: true, samples: 3 },
    );
    const brows = pair(sdf.extrude(browWedge, 0.5).rotateZ(-6).at(0.098, 0.672, 0)).intersect(head.round(0.018));
    const hairShape = sdf.smoothUnion(0.012, cap, spikes, temples, fringe, ring).smoothUnion(0.01, brows);
    const hair = hairShape;
    k.body('hair', hair, {
      color: T.hair,
      roughness: 0.6,
      detail: 0.004,
      bone: 'head',
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(x, z + 0.05) * 34 + y * 22)),
    });

    // ------------------------------------------------------------------ beard: a full short bib
    // A bib from the lower lip down (0.16 x 0.09 x 0.07), and cheek strips up to the sideburns.
    const bib = sdf.box([0.15, 0.06, 0.06], 0.02).at(0, 0.48, 0.122);
    const strip = (pts: readonly (readonly [number, number])[], r0: number, r1: number) =>
      sdf.chain(
        pts.map(([x, y], i) => [x, y, faceZ(Math.min(0.196, x), y) - 0.002, r0 + ((r1 - r0) * i) / (pts.length - 1)] as [number, number, number, number]),
        0.01,
      );
    const strips = pair(strip([[0.19, 0.64], [0.182, 0.6], [0.162, 0.552], [0.125, 0.512], [0.09, 0.488]], 0.017, 0.032));
    const tufts = sdf.union(
      ...[-0.05, 0, 0.05].map((x) => sdf.cone([x, 0.48, 0.125], [x * 1.1, 0.445, 0.14], 0.03, 0.012)),
    );
    // The jaw and chin below the lip are bearded: a rind on the head, cut at the lower lip.
    const jaw = head.round(0.03).smoothIntersect(0.012, sdf.halfSpace([0, 1, 0], 0.512));
    const beard = sdf.smoothUnion(0.016, bib, strips, tufts, jaw).smoothSubtract(0.006, mouthWin);
    k.body('beard', beard, {
      color: T.hair,
      roughness: 0.6,
      detail: 0.004,
      bone: 'head',
      bump: (x, y, z) => 0.002 * Math.abs(Math.sin(x * 240 + Math.sin(y * 34) * 1.3)),
    });

    // ------------------------------------------------------------------ torso: breastplate
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.118, 0.29],
            [0.108, 0.25],
            [0.105, 0.2],
            [0.105, 0.165],
            [0.1, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.29, 1, 0.92]);
    const PLATE_Y = 0.3;
    const plateBase = torso.round(0.014);
    const ridgeZ = (y: number) => sdf.raycast(plateBase, [0, y, 1], [0, 0, -1])![2];
    const RY0 = 0.29;
    const RY1 = 0.45;
    const rz0 = ridgeZ(RY0);
    const rz1 = ridgeZ(RY1);
    const ridge = sdf
      .box([0.024, Math.hypot(RY1 - RY0, rz1 - rz0) + 0.02, 0.03], 0.011)
      .rotateX((Math.atan2(rz1 - rz0, RY1 - RY0) * 180) / Math.PI)
      .at(0, (RY0 + RY1) / 2, (rz0 + rz1) / 2 + 0.002);
    const plate0 = plateBase
      .smoothUnion(0.02, ridge)
      .smoothIntersect(0.014, sdf.halfSpace([0, -1, 0], -PLATE_Y))
      .smoothIntersect(0.01, sdf.halfSpace([0, 1, 0], 0.452));
    const chestZ = (x: number, y: number) => sdf.raycast(plate0, [x, y, 1], [0, 0, -1])![2];
    const DENT1: V3 = [0.085, 0.335, chestZ(0.085, 0.335) + 0.013];
    const DENT2: V3 = [-0.08, 0.322, chestZ(-0.08, 0.322) + 0.012];
    const plate = plate0
      .smoothSubtract(0.008, sdf.sphere(0.021).at(...DENT1), sdf.sphere(0.018).at(...DENT2))
      .paintWhere(sdf.ellipsoid([0.1, 0.06, 0.25]).at(-0.06, 0.415, 0), C.plateLit, 0.05)
      .paintWhere(sdf.sphere(0.03).at(...DENT1), C.plateDent, 0.012)
      .paintWhere(sdf.sphere(0.026).at(...DENT2), C.plateDent, 0.012);
    k.body('cuirass', plate, { color: C.plate, roughness: 0.4, metalness: 0.8, bone: 'chest' });

    // The lion emblem: a raised disc with a rough mane ring, on the right chest (the viewer's left).
    const EMB: V3 = [-0.075, 0.375, chestZ(-0.075, 0.375) + 0.008];
    const mane = sdf.union(
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return sdf.sphere(0.0075).at(EMB[0] + Math.cos(a) * 0.03, EMB[1] + Math.sin(a) * 0.03, EMB[2]);
      }),
    );
    const emblem = sdf
      .smoothUnion(0.004, sdf.extrude(profile.circle(0.03), 0.02, 0.005).at(...EMB), mane)
      .bone('chest');

    // ------------------------------------------------------------------ gambeson, wrap, belt
    // Quilted diamonds in the normal map, and darker paint in the grooves.
    const quilt = (x: number, y: number, z: number) =>
      0.0016 * Math.abs(Math.sin((y + x * 0.8 + z * 0.4) * 150)) * Math.abs(Math.sin((y - x * 0.8 - z * 0.4) * 150));
    const collarRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.505],
            [0.095, 0.5],
            [0.135, 0.478],
            [0.148, 0.45],
            [0.125, 0.432],
            [0.085, 0.452],
            [0.05, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1.2, 1, 0.98])
      .bone('chest');
    const SLEEVE_END = 0.62;
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, SLEEVE_END), 0.06, 0.056).round(0.004).bone(tag);
    const hem = torso.round(0.006).smoothIntersect(0.008, sdf.box([0.5, 0.062, 0.5], 0.01).at(0, 0.208, 0)).bone('hips');
    const gambeson = sdf
      .union(collarRing, sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'), hem)
      .paintFn((x, y, z, base) => {
        const a = Math.abs(Math.sin((y + x * 0.8 + z * 0.4) * 150));
        const b = Math.abs(Math.sin((y - x * 0.8 - z * 0.4) * 150));
        return Math.min(a, b) < 0.13 ? rgb(T.gambDark) : y > 0.36 && a * b > 0.75 ? rgb(T.gambLit) : base;
      });
    // A red cuff band (a torus 0.015 tall) at the end of each sleeve, turned to the upper arm's axis.
    const cuffAngle = (Math.atan2(ELBOW_L[0] - SHOULDER[0], SHOULDER[1] - ELBOW_L[1]) * 180) / Math.PI;
    const cuffL = sdf
      .torus(0.058, 0.0075)
      .rotateZ(cuffAngle)
      .at(...lerp(SHOULDER, ELBOW_L, SLEEVE_END))
      .bone('upperarm.L');
    k.body('cuffs', hard(cuffL), { color: C.cuff, roughness: 0.8 });
    k.body('gambeson', gambeson, { color: T.gamb, roughness: 0.9, bump: quilt });

    // The red wrap under the plate hem.
    const wrap = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.054, 0.5], 0.01).at(0, 0.295, 0));
    k.body(
      'wrap',
      wrap
        .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 11 + y * 60) > 0.8 ? rgb(T.sashDark) : base))
        .bone('spine'),
      { color: T.sash, roughness: 0.85, bump: (x, y, z) => 0.002 * Math.abs(Math.sin(Math.atan2(z, x) * 11 + y * 60)) },
    );

    const beltY = 0.26;
    const belt = torso.round(0.016).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.008).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), {
      color: C.leather,
      roughness: 0.65,
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 30, y * 30, z * 30) * 3)),
    });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.082, 0.064, 0.018], 0.006)
      .subtract(sdf.box([0.054, 0.038, 0.1], 0.004))
      .at(0, beltY, beltZ + 0.003)
      .bone('spine');
    // A leather tongue inside the buckle frame, same material as the belt.
    k.body('tongue', sdf.box([0.05, 0.028, 0.012], 0.004).at(0, beltY, beltZ + 0.004).bone('spine'), {
      color: C.leather,
      roughness: 0.6,
    });

    // The red tail hangs from the belt on the left hip.
    const tail = sdf
      .extrude(
        profile.polygon([
          [0.018, 0.262],
          [0.098, 0.262],
          [0.094, 0.14],
          [0.058, 0.108],
          [0.02, 0.14],
        ]),
        0.014,
        0.005,
      )
      .rotateX(-8)
      .at(0, 0, 0.178)
      .bone('leg.L');
    k.body(
      'tail',
      tail.paintFn((x, y, z, base) => (Math.sin(x * 130 + y * 20) > 0.8 ? rgb(T.sashDark) : base)),
      { color: T.sash, roughness: 0.85 },
    );

    // The leather skirt: a short bell of leather around the hips, split at the front and the back,
    // one half on each leg. A curled tail leaves the back of the left half.
    const skirtCore = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.222],
            [0.112, 0.222],
            [0.116, 0.2],
            [0.118, 0.15],
            [0.124, 0.095],
            [0, 0.09],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1.29, 1, 0.92]);
    const skirtShell = skirtCore.round(0.02).subtract(skirtCore.round(0.004));
    const skirtHalf = skirtShell.intersect(sdf.box([0.5, 0.3, 0.6]).at(0.256, 0.15, 0)).bone('leg.L');
    const skirtBump = (x: number, y: number, z: number) => 0.0015 * Math.abs(Math.sin(noise.noise3(x * 25, y * 25, z * 25) * 3));
    k.body('skirt', sdf.union(skirtHalf, skirtHalf.mirror('x', 0)), { color: C.skirt, roughness: 0.75, bump: skirtBump });
    const skirtTail = sdf
      .chain(
        [
          [0.15, 0.14, -0.06, 0.03],
          [0.19, 0.12, -0.1, 0.026],
          [0.225, 0.125, -0.135, 0.02],
          [0.238, 0.175, -0.155, 0.011],
        ],
        0.01,
      )
      .bone('leg.L');
    k.body('skirt-tail', skirtTail, { color: C.skirt, roughness: 0.75, bump: skirtBump });

    // ------------------------------------------------------------------ pauldrons (two lames each)
    // A rounded cap (r 0.055) on each shoulder point, a smaller lame under it, one rivet on top.
    const PC: V3 = [0.192, 0.44, 0];
    const capDome = sdf.ellipsoid([0.058, 0.05, 0.058]).intersect(sdf.halfSpace([0, -1, 0], 0.012)).round(0.003);
    const lameLow = sdf.ellipsoid([0.062, 0.03, 0.062]).at(0, -0.026, 0).round(0.003);
    const pauldronL = sdf
      .union(capDome, lameLow)
      .rotateZ(-22)
      .at(...PC)
      .bone('upperarm.L');
    k.body(
      'pauldrons',
      pair(pauldronL.paintWhere(sdf.ellipsoid([0.05, 0.04, 0.2]).at(0.185, 0.5, 0.05), C.plateLit, 0.04)),
      { color: C.plate, roughness: 0.4, metalness: 0.8 },
    );
    const topAt = sdf.surfacePoint(pauldronL, [PC[0], 0.7, 0.0], 0);
    const rivets = pair(sdf.sphere(0.008).at(topAt[0], topAt[1] + 0.001, topAt[2]).bone('upperarm.L'));
    k.body('iron', sdf.union(emblem, buckle, rivets), { color: C.iron, roughness: 0.5, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ arms: bare skin, bracers, fists
    const upperArm = (s: V3, e: V3) => sdf.cone(s, e, 0.046, 0.044);
    const foreArm = (e: V3, w: V3) => sdf.cone(e, w, 0.05, 0.042);
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    const arms = sdf.union(
      sdf.smoothUnion(
        0.014,
        upperArm(SHOULDER, ELBOW_L).bone('upperarm.L'),
        foreArm(ELBOW_L, WRIST_L).bone('forearm.L'),
        fistL.bone('hand.L'),
      ),
      sdf.smoothUnion(
        0.014,
        upperArm(mx(SHOULDER), ELBOW_R).bone('upperarm.R'),
        foreArm(ELBOW_R, WRIST_R).bone('forearm.R'),
        fistR.bone('hand.R'),
      ),
    );
    k.body('arms', arms, { color: C.skin, roughness: 0.55 });
    // A small leather band at each wrist, turned to the forearm's axis.
    const band = (e: V3, w: V3, tag: string) => {
      const d = norm(sub(w, e));
      const a = (Math.atan2(d[2], d[1]) * 180) / Math.PI;
      return sdf.torus(0.045, 0.012).rotateX(a).rotateZ(Math.atan2(d[0], Math.hypot(d[1], d[2])) * (180 / Math.PI) * -1).at(...lerp(e, w, 0.93)).bone(tag);
    };
    k.body('bracers', sdf.union(band(ELBOW_L, WRIST_L, 'forearm.L'), band(ELBOW_R, WRIST_R, 'forearm.R')), {
      color: C.leather,
      roughness: 0.65,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ legs: trousers and boots
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.135, 0.05, 0.1]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.048).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.leggings, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.056, 0.06, 0.02).at(0, 0.05, 0),
        sdf.ellipsoid([0.062, 0.052, 0.108]).at(0, 0.047, 0.05),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const cuff = sdf.cylinder(0.058, 0.03, 0.01).at(0.001, 0.1, 0.004).bone('shin.L');
    const boot = sdf
      .smoothUnion(0.012, bootFoot.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'), cuff)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), '#241610');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.75 });

    // ------------------------------------------------------------------ sword in the right hand
    // Local frame: the grip center at the origin, the blade toward -Y, the flat facing +Z.
    const BLADE_W = 0.058;
    const BLADE_T = 0.022;
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, 1).at(0, 0, R - BLADE_T / 2),
      sdf.cylinder(R, 1).at(0, 0, -(R - BLADE_T / 2)),
    );
    const bladeLocal = sdf
      .extrude(
        profile.polygon([
          [-BLADE_W / 2, -0.078],
          [BLADE_W / 2, -0.078],
          [BLADE_W / 2, -0.42],
          [0.011, -0.5],
          [-0.011, -0.5],
          [-BLADE_W / 2, -0.42],
        ]),
        0.2,
      )
      .intersect(lens)
      .smoothSubtract(
        0.002,
        sdf.box([0.009, 0.32, 0.006], 0.002).at(0, -0.26, BLADE_T / 2),
        sdf.box([0.009, 0.32, 0.006], 0.002).at(0, -0.26, -BLADE_T / 2),
      )
      .paintWhere(sdf.box([0.008, 0.6, 0.2]).at(BLADE_W / 2 - 0.002, -0.2, 0), C.edge, 0.003)
      .paintWhere(sdf.box([0.008, 0.6, 0.2]).at(-BLADE_W / 2 + 0.002, -0.2, 0), C.edge, 0.003);
    const guardLocal = sdf.box([0.13, 0.024, 0.032], 0.01).bend(4).at(0, -0.074, 0);
    const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.024).at(0, 0.056, 0), sdf.cone([0, 0.03, 0], [0, 0.045, 0], 0.014, 0.018));
    const gripLocal = sdf.cylinder(0.0145, 0.11, 0.004).at(0, -0.014, 0);
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.008, -0.046, 0.005]);
    const swordPose = (s: sdf.Shape) => s.rotateY(SWORD_ROLL).rotateZ(SWORD_Z).rotateY(SWORD_Y).at(...GRIP);
    k.body('sword', swordPose(bladeLocal), { color: C.steel, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'hand.R' });
    k.body('hilt', swordPose(sdf.union(guardLocal, pommelLocal)), {
      color: C.pommel,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.004,
      bone: 'hand.R',
    });
    k.body('grip', swordPose(gripLocal), {
      color: C.leather,
      roughness: 0.75,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    // idle: a heavy breath; the left fist hangs at the side and flexes a little.
    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
        'upperarm.L': { rotate: [-2 * wave(p, 1, 0.15), 0, 2 * bump(p)] },
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
      }),
    });

    // Walk and run: gait legs; the sword arm swings a little, the left fist swings freely.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
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
          'upperarm.L': { rotate: [armSwing * 0.7 * s, 0, 3] as const },
          'forearm.L': { rotate: [-armSwing * 0.2 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 26, 3));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12));

    // ---- shared arm solvers
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const poleOf = (root: V3, mid: V3, end: V3) => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(root, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    };
    const POLE_REST = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);

    // attack: a two-hand sweep. The sword goes back over the right shoulder, comes down across the
    // front to the low left, and returns. The bare left fist comes forward and in, as if to meet the
    // grip. The hips and chest turn, the left foot steps, the hips drop.
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.14, norm([-0.92, 0.12, 0.3])], // out to the right, level
      [0.28, norm([-0.75, 0.55, -0.37])], // up and back over the right shoulder, out beside the head
      [0.38, norm([-0.72, 0.58, -0.38])], // the hold at the top
      [0.44, norm([-0.6, 0.6, 0.5])], // over the shoulder: forward on the right, up and out
      [0.48, norm([-0.25, 0.15, 0.95])], // level, pointing forward
      [0.53, norm([0.55, -0.25, 0.8])], // across the front to the left
      [0.6, norm([0.8, -0.26, 0.5])], // low left
      [0.7, norm([0.78, -0.24, 0.5])], // the follow-through holds
      [0.86, norm([-0.3, -0.22, 0.89])], // back through the front, the tip clear of the floor
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.265, 0.38, 0.06]],
            [0.28, [-0.275, 0.472, -0.035]],
            [0.38, [-0.278, 0.476, -0.04]],
            [0.44, [-0.27, 0.475, 0.065]],
            [0.48, [-0.21, 0.405, 0.16]],
            [0.53, [-0.15, 0.36, 0.175]],
            [0.6, [-0.15, 0.3, 0.163]],
            [0.7, [-0.15, 0.302, 0.162]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
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
        const fist = ease(0.3, 0.5, p) * (1 - ease(0.75, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.025 * cut - 0.01 * wind], rotate: [0, -10 * wind + 16 * cut, 0] },
          spine: { rotate: [-4 * wind + 7 * cut, 0, 0] },
          chest: { rotate: [-3 * wind + 4 * cut, -16 * wind + 20 * cut, 0] },
          head: { rotate: [-2 * wind - 2 * cut, 3 * wind - 3 * cut, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The left fist swings in and forward, then back.
          'upperarm.L': { rotate: [-40 * fist + 12 * wind, 0, -14 * fist] },
          'forearm.L': { rotate: [-25 * fist, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the arms jolt.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          'upperarm.R': { rotate: [8 * h, 0, -10 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [10 * jolt, 0, 10 * jolt] },
          'forearm.L': { rotate: [12 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The sword arm
    // falls out to the right with the blade flat on the ground; the left arm falls to the left side.
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045, // how far the hips come down
      back: 0.15, // how far the hips land behind the start
      neck: 9,
      head: 12,
      leg: 34, // the legs lie back down to the ground
      wristR: [-0.27, 0.35, -0.1] as V3,
      bladeR: norm([-0.52, -0.85, -0.02]),
      wristL: [0.24, 0.24, -0.02] as V3,
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

        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, BLADE_DIR], [0.1, norm([-0.75, -0.45, 0.48])], [0.4, norm([-0.75, -0.55, 0.36])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, FLAT], [0.4, FLAT], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

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

    // taunt: the sword goes up beside the head, the bare fist comes up on the left, the chest
    // swells and the head rocks back in a roar. Then he shakes the sword twice and lowers it.
    const WIN = {
      wrist: [-0.298, 0.458, 0.04] as V3,
      blade: norm([-0.22, 0.97, 0.1]),
      fist: [0.285, 0.43, 0.075] as V3,
    };
    k.animation('taunt', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0, 0.24, p) * (1 - ease(0.82, 1, p));
        const roar = keys(p, [[0.2, 0], [0.32, 1], [0.7, 1], [0.84, 0]] as const);
        const shake = wave(p * 3, 1, 0) * roar;
        const wristR = keys(
          p,
          [
            [0, WRIST_R],
            [0.1, [-0.27, 0.37, 0.1]],
            [0.22, [-0.296, 0.462, 0.042]],
            [0.28, WIN.wrist],
            [0.8, WIN.wrist],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.1, [-0.6, 0.1, -0.1]], [0.26, [-0.6, 0.15, -0.25]], [0.8, [-0.6, 0.15, -0.25]], [1, POLE_REST]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(
            p,
            [
              [0, BLADE_DIR],
              [0.1, norm([-0.85, 0.2, 0.48])],
              [0.22, norm([-0.26, 0.95, 0.14])],
              [0.28, WIN.blade],
              [0.8, WIN.blade],
              [1, BLADE_DIR],
            ] as const,
            'spline',
          ),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.1, [0, 1, 0.2]], [0.22, [-1, 0.1, 0.25]], [0.8, [-1, 0.1, 0.25]], [0.92, [-0.4, 0.5, 0.7]], [1, FLAT]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });
        const fistT = keys(p, [[0, WRIST_L], [0.22, WIN.fist], [0.8, WIN.fist], [1, WRIST_L]] as const);
        const fistPump = [0, 0.03 * roar * wave(p * 3, 1, 0.25), 0] as V3;
        const armL = reach(ARM_L, add(fistT, fistPump), keys(p, [[0, POLE_REST_L], [0.22, [0.6, 0.3, -0.1]], [0.8, [0.6, 0.3, -0.1]], [1, POLE_REST_L]] as const));
        return {
          hips: { move: [0, -legDrop(LEG, 4 * up) - 0.006 * roar, 0], rotate: [0, 0, 0] },
          spine: { rotate: [-5 * roar, 0, 0] },
          chest: { rotate: [-5 * roar, 2 * shake, 0] },
          neck: { rotate: [-4 * roar, 0, 0] },
          head: { rotate: [-12 * roar, 5 * shake, 0] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [0, 0, 4 * up] },
          'leg.R': { rotate: [0, 0, -4 * up] },
          'foot.L': { rotate: [0, 0, -4 * up] },
          'foot.R': { rotate: [0, 0, 4 * up] },
        };
      },
    });
  },
});
