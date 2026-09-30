import { defineAsset, motion, profile, sdf, noise, THREE } from '../src/index.js';

/**
 * Scout — Chibi Quest hero (catalog `heroes/martial/scout`), about 0.98 m to the top of the hair, faces +Z.
 * Target: docs/hero-mockups/scout_001.jpg. Built on the rogue base (rig, knee bones, cloak bone, face).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite; the blond spikes, the grey scarf and the
 *   brass spyglass must read small.
 * One idea: a wide-eyed boy with a crown of swept-up blond spikes, a fat grey scarf, and a spyglass
 *   raised in front of him, a curved dagger held low in the other hand.
 * Proportions: hair tip 0.98, eyes 0.63, chin 0.48, shoulders 0.38, belt 0.25, shorts hem 0.14, boot tops 0.115.
 * Shape language: round and soft (head, scarf, fists, boots) with pointed leaf-like hair spikes.
 * Palette (60/30/10): greys (scarf #a8a8a0, cloak #8a8a80, jerkin #8a9080); blond hair #d8b048;
 *   brown leather #6b4226; brass #b8925a is the accent. Shorts #b8a888, boots #5a3a24.
 * Value plan: the bright hair and the light face on a grey body; leather and brass are the small contrast.
 * Bodies: skin, limbs, hair, scarf, mantle (the short cloak), cape, jerkin, sleeves, leather, steel,
 *   spyglass, shorts, hems, boots, dagger and its grip.
 * Rig: the rogue skeleton. The right forearm is raised in the rest pose (the spyglass is rigid on
 *   `hand.R`); the dagger is rigid on `knife.L`. Clips idle, walk, run, attack (a dagger slash),
 *   attack2 (a spyglass point and a dash), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c2a18',
  iris: '#3d7a35',
  irisLow: '#7ea84a',
  pupil: '#141a18',
  lid: '#2a1c12',
  brow: '#b58c38',
  mouth: '#b0604c',
  hair: '#d8b048',
  hairGroove: '#a88030',
  scarf: '#9a9a92',
  scarfFold: '#7a7a72',
  cloak: '#5f625c',
  cloakFold: '#484b46',
  jerkin: '#8a9080',
  seam: '#6a7060',
  leather: '#6b4226',
  leatherDark: '#4a2c1c',
  steel: '#a8acb1',
  brass: '#b8925a',
  lens: '#202830',
  blade: '#c3c8cf',
  grip: '#3a2a20',
  shorts: '#b8a888',
  boot: '#5a3a24',
  sole: '#3c2418',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const rad = Math.PI / 180;
type V3 = readonly [number, number, number];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

export default defineAsset({
  name: 'scout',
  description: 'Chibi scout hero with swept-up blond spikes, a grey scarf and short cloak, a brass spyglass, and a curved dagger.',
  detail: 0.006,
  reference: 'docs/hero-mockups/scout_001.jpg',
  variants: {
    eyes: { green: C.iris, brown: '#6e4020', blue: '#2f6aa8' },
    hair: { blond: C.hair, brown: '#6b3a20', black: '#231a17' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { grey: C.jerkin, teal: '#3f6a6a', olive: '#6a6a3a' },
  },
  presets: {
    default: { eyes: 'green', hair: 'blond', skin: 'fair', clothing: 'grey' },
    teal: { eyes: 'blue', hair: 'brown', skin: 'tan', clothing: 'teal' },
    olive: { eyes: 'brown', hair: 'black', skin: 'brown', clothing: 'olive' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairGroove: k.tint('hair', { color: C.hairGroove, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      jerkin: k.tint('clothing'),
      seam: k.tint('clothing', { color: C.seam, follow: 1 }),
      scarf: k.tint('clothing', { color: C.scarf, follow: 1 }),
      scarfFold: k.tint('clothing', { color: C.scarfFold, follow: 1 }),
      cloak: k.tint('clothing', { color: C.cloak, follow: 1 }),
      cloakFold: k.tint('clothing', { color: C.cloakFold, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.14, 0.295, 0.095] as const; // the left forearm points forward: the dagger is held in front of the belly
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const;
    const mx = (p: V3) => [-p[0], p[1], p[2]] as const;
    // The right arm is raised in the rest pose: the forearm points forward, the fist holds the spyglass.
    const SH_R = mx(SHOULDER);
    const EL_R = [-0.222, 0.33, 0.0] as const; // the right forearm is raised up and forward: the spyglass is near eye level
    const WR_R = [-0.228, 0.42, 0.06] as const;
    const FIST_R = [-0.228, 0.452, 0.085] as const; // the right fist center
    const FIST_L = [0.122, 0.29, 0.123] as const; // the left fist center (the dagger grip)
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: SH_R },
      'forearm.R': { parent: 'upperarm.R', at: EL_R },
      'hand.R': { parent: 'forearm.R', at: WR_R },
      'knife.L': { parent: 'hand.L', at: FIST_L },
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
    const ears = pair(
      sdf
        .ellipsoid([0.028, 0.046, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.058, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.045, 0.051, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.039, 0.045, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.028, 0.031, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.053, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x - 0.016, EYE[1] + 0.02),
        at(sdf.sphere(0.006), x + 0.016, EYE[1] - 0.022),
      ]),
    );
    // Calm, slightly flat brows, a little lower on the inner ends.
    const brows = pair(sdf.extrude(profile.arc(0.13, 0.02, 64, 116), 0.3).at(0.105, 0.706 - 0.13, 0.1).rotateZ(0));
    const mouth = sdf.extrude(profile.arc(0.2, 0.011, 263, 277), 0.3).at(0, 0.535 + 0.2, 0.1);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // Arms, and legs from the shorts to the boots.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      sdf
        .smoothUnion(
          0.018,
          sdf.ellipsoid([0.038, 0.043, 0.044]).at(...FIST_L),
          sdf.cone([FIST_L[0] + 0.013, FIST_L[1] + 0.016, FIST_L[2] + 0.02], [FIST_L[0] - 0.006, FIST_L[1] + 0.006, FIST_L[2] + 0.044], 0.016, 0.013), // thumb over the fingers
        )
        .bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(SH_R, EL_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(EL_R, WR_R, 0.036, 0.032).bone('forearm.R'),
      sdf
        .smoothUnion(
          0.018,
          sdf.ellipsoid([0.041, 0.041, 0.043]).at(...FIST_R),
          sdf.capsule([FIST_R[0] + 0.02, FIST_R[1] - 0.02, FIST_R[2] + 0.02], [FIST_R[0] + 0.005, FIST_R[1] - 0.03, FIST_R[2] + 0.035], 0.015),
        )
        .bone('hand.R'),
    );
    const legs = pair(
      sdf.smoothUnion(
        0.02,
        sdf.capsule([HIP[0], 0.19, 0], KNEE, 0.04).bone('leg.L'),
        sdf.capsule(KNEE, [0.098, 0.09, 0], 0.036).bone('shin.L'),
      ),
    );
    k.body('limbs', sdf.union(armL, armR, legs), { color: T.skin, roughness: 0.55, textureDensity: 1 });

    // ------------------------------------------------------------------ hair: a full tousled mane (cap plus 17 locks and bangs)
    const HC: V3 = [0, HEAD_Y + 0.008, -0.01];
    const HR: V3 = [HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012];
    const capE = sdf.ellipsoid(HR).at(...HC);
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(14).at(0.02, 0.645, 0.14);
    const earCut = pair(sdf.ellipsoid([0.07, 0.065, 0.075]).at(0.215, 0.61, -0.01));
    // Cut low at the nape (y 0.556) and higher at the front (y 0.585 + 0.15 z slope).
    const cap = capE
      .smoothSubtract(0.015, faceMask)
      .subtract(earCut)
      .intersect(sdf.halfSpace([0, -0.989, 0.148], -0.5787));
    type Lock = { p: V3; d: V3; len: number; r: number; n: V3; bend: V3 };
    const locks: Lock[] = [];
    // A lock starts on the cap at azimuth az (0 = front, + toward +X) and elevation el, and sweeps along the world vector s.
    // seed varies the direction by about 10 to 25 degrees and bends the lock a little.
    const lock = (az: number, el: number, s: V3, len: number, r: number, seed: number) => {
      const u: V3 = [Math.cos(el * rad) * Math.sin(az * rad), Math.sin(el * rad), Math.cos(el * rad) * Math.cos(az * rad)];
      const p: V3 = [HC[0] + u[0] * HR[0], HC[1] + u[1] * HR[1], HC[2] + u[2] * HR[2]];
      const n = norm([u[0] / HR[0], u[1] / HR[1], u[2] / HR[2]]);
      const j = (i: number) => (noise.random(seed, i, 7) - 0.5) * 0.9;
      const d = norm([n[0] * 0.3 + s[0] + j(1), n[1] * 0.3 + s[1] + j(2), n[2] * 0.3 + s[2] + j(3)]);
      const bend: V3 = [j(4) * 0.5, j(5) * 0.4, j(6) * 0.5];
      locks.push({ p, d, len, r, n, bend });
    };
    // Five on top: sweep up and to +X, in two rows.
    lock(-40, 70, [1.1, 0.4, 0.3], 0.14, 0.033, 1);
    lock(25, 74, [1.2, 0.4, 0.25], 0.145, 0.034, 2);
    lock(-5, 58, [1.4, 0.3, 0.1], 0.13, 0.032, 3);
    lock(150, 66, [1.2, 0.35, -0.35], 0.135, 0.033, 4);
    lock(80, 76, [1.3, 0.3, -0.05], 0.13, 0.031, 5);
    // Four on each side: down over the temples and past the ear tops.
    for (const sg of [1, -1]) {
      lock(sg * 48, 42, [sg * 0.3, -0.9, 0.6], 0.12, 0.03, 10 + sg);
      lock(sg * 78, 46, [sg * 0.25, -1.0, 0.25], 0.12, 0.029, 12 + sg);
      lock(sg * 110, 40, [sg * 0.25, -1.0, -0.4], 0.13, 0.03, 14 + sg);
      lock(sg * 135, 56, [sg * 0.4, -0.7, -0.7], 0.12, 0.029, 16 + sg);
    }
    // Three at the nape: back and down.
    lock(-158, 24, [-0.5, -0.9, -0.5], 0.12, 0.03, 20);
    lock(180, 20, [0.1, -1.0, -0.4], 0.125, 0.031, 21);
    lock(158, 26, [0.6, -0.9, -0.5], 0.12, 0.03, 22);
    // Low bangs over the brow, swept forward and to +X.
    lock(-30, 34, [0.8, -0.35, 0.8], 0.095, 0.028, 30);
    lock(12, 38, [1.0, -0.3, 0.7], 0.1, 0.029, 31);
    lock(50, 32, [1.0, -0.4, 0.5], 0.09, 0.027, 32);
    const lockShape = (l: Lock) => {
      const at = (t: number, off = 0): V3 => [
        l.p[0] + l.d[0] * l.len * t + l.bend[0] * off * l.len - l.n[0] * 0.02 * (1 - t),
        l.p[1] + l.d[1] * l.len * t + l.bend[1] * off * l.len - l.n[1] * 0.02 * (1 - t),
        l.p[2] + l.d[2] * l.len * t + l.bend[2] * off * l.len - l.n[2] * 0.02 * (1 - t),
      ];
      return sdf.chain(
        [
          [...at(-0.05), l.r * 0.95],
          [...at(0.45, 0.12), l.r],
          [...at(0.8, 0.28), l.r * 0.55],
          [...at(1.05, 0.4), 0.006],
        ],
        0.02,
      );
    };
    // The underside of each lock is one tint darker so the locks separate at 128 px.
    const underside = (l: Lock) => {
      let dn = norm([0, -1, 0]);
      let dot = dn[0] * l.d[0] + dn[1] * l.d[1] + dn[2] * l.d[2];
      let perp = [dn[0] - l.d[0] * dot, dn[1] - l.d[1] * dot, dn[2] - l.d[2] * dot] as const;
      if (Math.hypot(...perp) < 0.4) perp = [-l.n[0], -l.n[1], -l.n[2]];
      const pn = norm(perp);
      const off = l.r * 0.75;
      const a: V3 = [l.p[0] + pn[0] * off + l.d[0] * l.len * 0.1, l.p[1] + pn[1] * off + l.d[1] * l.len * 0.1, l.p[2] + pn[2] * off + l.d[2] * l.len * 0.1];
      const b: V3 = [l.p[0] + pn[0] * off * 0.6 + l.d[0] * l.len * 0.85, l.p[1] + pn[1] * off * 0.6 + l.d[1] * l.len * 0.85, l.p[2] + pn[2] * off * 0.6 + l.d[2] * l.len * 0.85];
      return sdf.capsule(a, b, 0.015);
    };
    const hairShape = sdf.smoothUnion(0.012, cap, ...locks.map(lockShape));
    const hair = hairShape
      .paintWhere(sdf.union(...locks.map(underside)), T.hairGroove, 0.006)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.74), T.hairGroove, 0.05);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head', textureDensity: 2 });


    // ------------------------------------------------------------------ jerkin (padded, three quilt seams) and sleeves
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
            [0.132, 0.25],
            [0.13, 0.255],
            [0.138, 0.238],
            [0.13, 0.224],
            [0, 0.224],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const SEAMS = [0.285, 0.335, 0.39];
    const seamBands = sdf.union(...SEAMS.map((y) => sdf.box([0.6, 0.007, 0.6]).at(0, y, 0)));
    const jerkin = torso.paintWhere(seamBands, T.seam, 0.002);
    k.body('jerkin', jerkin.bone('spine'), {
      color: T.jerkin,
      roughness: 0.85,
      bump: (_x: number, y: number, _z: number) => {
        let g = 0;
        for (const s of SEAMS) g -= 0.0022 * Math.exp(-(((y - s) / 0.005) ** 2));
        return g;
      },
    });
    const sleeves = sdf.union(
      sdf.cone([0.11, 0.405, 0], [0.18, 0.34, 0.012], 0.047, 0.042).bone('upperarm.L'),
      sdf.cone([-0.11, 0.405, 0], [-0.215, 0.335, 0.0], 0.047, 0.042).bone('upperarm.R'),
    );
    k.body('sleeves', sleeves, { color: T.jerkin, roughness: 0.9 });

    // ------------------------------------------------------------------ scarf: a fat cowl pulled up under the chin
    const scarfMain = sdf.torus(0.1, 0.046).scale([1, 1, 0.98]).rotateX(-9).at(0, 0.472, 0.0);
    const scarfLow = sdf.torus(0.115, 0.032).scale([1, 1, 0.9]).rotateX(-14).at(0, 0.432, 0.012);
    const drape = sdf.ellipsoid([0.075, 0.055, 0.03]).rotateX(-25).at(0, 0.418, 0.118);
    const knot = sdf.ellipsoid([0.04, 0.036, 0.03]).at(-0.05, 0.445, 0.125);
    const scarfShape = sdf.smoothUnion(0.022, scarfMain, scarfLow, drape, knot);
    const foldBands = sdf.union(
      ...[0.021, -0.021].map((dy) => sdf.torus(0.1415, 0.006).at(0, dy, 0).rotateX(-9).at(0, 0.472, 0)),
    );
    k.body('scarf', scarfShape.paintWhere(foldBands, T.scarfFold, 0.003), {
      color: T.scarf,
      roughness: 0.95,
      bone: 'neck',
      bump: (x: number, y: number, z: number) => 0.0016 * noise.fbm(x * 70, y * 70, z * 70, 2) + 0.0018 * Math.sin(Math.atan2(z, x) * 10 + y * 30),
    });

    // ------------------------------------------------------------------ mantle: the short cloak over the shoulders
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.482],
            [0.13, 0.458],
            [0.19, 0.412],
            [0.228, 0.35],
            [0.245, 0.292],
            [0.226, 0.288],
            [0.21, 0.343],
            [0.175, 0.4],
            [0.12, 0.44],
            [0.064, 0.462],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    const frontGap = sdf
      .extrude(
        profile.polygon([
          [-0.11, 0.41],
          [0.11, 0.41],
          [0.235, 0.25],
          [-0.235, 0.25],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    // The right forearm and the spyglass come out through the cloak.
    const armHole = sdf.capsule(
      [EL_R[0] * 0.6 + WR_R[0] * 0.4, EL_R[1] * 0.6 + WR_R[1] * 0.4, EL_R[2] * 0.6 + WR_R[2] * 0.4],
      [FIST_R[0], FIST_R[1], FIST_R[2] + 0.06],
      0.062,
    );
    const armHoleL = sdf.capsule(
      [ELBOW[0] * 0.6 + WRIST[0] * 0.4, ELBOW[1] * 0.6 + WRIST[1] * 0.4, ELBOW[2] * 0.6 + WRIST[2] * 0.4],
      [FIST_L[0], FIST_L[1], FIST_L[2] + 0.06],
      0.062,
    );
    const mantle = mantleSolid.smoothSubtract(0.01, frontGap).smoothSubtract(0.008, armHole).smoothSubtract(0.008, armHoleL);
    const capZone = sdf.ellipsoid([0.1, 0.13, 0.085]).at(0.26, 0.33, 0);
    const bandZone = sdf.ellipsoid([0.135, 0.165, 0.13]).at(0.26, 0.33, 0);
    const mantleSkin = sdf.union(
      mantle,
      pair(mantle.intersect(bandZone).bone('upperarm.L')),
      mantle.subtract(hard(capZone)).bone('chest'),
    );
    k.body('mantle', mantleSkin.paintWhere(sdf.halfSpace([0, 1, 0], 0.318), T.cloakFold, 0.01), {
      color: T.cloak,
      roughness: 0.92,
      bump: (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // ------------------------------------------------------------------ cape (behind, to the elbows)
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.38 - y) / 0.13));
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
    const capeShell = capeCone(0.185, 0.248, 0.42, 0.21)
      .subtract(capeCone(0.163, 0.226, 0.44, 0.195))
      .at(0, 0, -0.03)
      .intersect(sdf.halfSpace([0, 0, 1], -0.03));
    const cape = capeShell.paintWhere(sdf.halfSpace([0, 1, 0], 0.27), T.cloakFold, 0.01);
    k.body('cape', cape.bone('cloak'), {
      color: T.cloak,
      roughness: 0.92,
      bump: (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // ------------------------------------------------------------------ leather: strap, belt, pouch, bracers
    const beltY = 0.252;
    const belt = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    const strap = torso
      .round(0.008)
      .smoothIntersect(0.005, sdf.box([0.6, 0.034, 0.6], 0.005).rotateZ(-24).at(0.02, 0.345, 0));
    const bracerL = sdf.cone([0.185, 0.335, 0.01], [0.14, 0.295, 0.095], 0.047, 0.05).round(0.004).bone('forearm.L');
    const bracerR = sdf.cone([-0.217, 0.335, 0.0], [-0.228, 0.425, 0.065], 0.048, 0.055).round(0.004).bone('forearm.R');
    const POUCH = [0.148, 0.192, 0.072] as const;
    const pouch = sdf.union(
      sdf.box([0.062, 0.062, 0.046], 0.014),
      sdf.box([0.066, 0.026, 0.05], 0.01).at(0, 0.032, 0.0),

    ).at(...POUCH);
    const pouchStrap = sdf.box([0.075, 0.02, 0.016], 0.005).at(POUCH[0] - 0.045, beltY - 0.004, POUCH[2] - 0.03).rotateY(-25);
    k.body(
      'leather',
      sdf.union(belt.bone('spine'), strap.bone('spine'), pouch.bone('spine'), pouchStrap.bone('spine'), bracerL, bracerR),
      { color: C.leather, roughness: 0.6, detail: 0.005 },
    );

    // ------------------------------------------------------------------ steel: buckles and the pouch stud
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.052, 0.04, 0.012], 0.004).subtract(sdf.box([0.03, 0.022, 0.04], 0.002)),
        sdf.box([0.008, 0.03, 0.008], 0.002),
      )
      .at(0, beltY, beltZ + 0.005);
    const strapBuckleAt = sdf.surfacePoint(strap, [-0.062, 0.381, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.03, 0.036, 0.008], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-24)
      .at(...strapBuckleAt);
    const stud = sdf.sphere(0.008).at(POUCH[0], POUCH[1] + 0.024, POUCH[2] + 0.028);
    k.body('steel', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), stud.bone('spine')), {
      color: C.steel,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ shorts, hems, boots
    const shorts = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.cylinder(0.058, 0.092, 0.014).rotateZ(6).at(0.0822, 0.181, 0).bone('leg.L')),
    );
    k.body('shorts', shorts, { color: C.shorts, roughness: 0.9 });
    const hems = pair(sdf.cylinder(0.061, 0.022, 0.009).rotateZ(6).at(0.0855, 0.146, 0).bone('leg.L'));
    k.body('hems', hems, { color: C.leather, roughness: 0.65 });

    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.09, 0.02).at(0, 0.07, 0),
        sdf.ellipsoid([0.058, 0.055, 0.1]).at(0, 0.052, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.union(sdf.cylinder(0.057, 0.032, 0.013).at(0, 0.1, 0), sdf.torus(0.053, 0.014).at(0, 0.112, 0));
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff.paint(C.leatherDark))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ spyglass in the right fist
    // Built along +Y, then turned to point forward and up (out a little to the right).
    const SPY = norm([-0.34, 0.7, 0.62]);
    const spyTx = Math.atan2(Math.hypot(SPY[0], SPY[2]), SPY[1]) / rad;
    const spyTy = Math.atan2(SPY[0], SPY[2]) / rad;
    const spyAt = (s: sdf.Shape) => s.rotateX(spyTx).rotateY(spyTy).at(...FIST_R);
    const tube = (t0: number, t1: number, r: number) => sdf.cylinder(r, t1 - t0, 0.004).at(0, (t0 + t1) / 2, 0);
    const spyglass = spyAt(
      sdf.union(
        tube(-0.07, 0.0, 0.023).paint(C.brass),
        tube(0.0, 0.08, 0.028).paint(C.leather),
        tube(0.08, 0.16, 0.034).paint(C.brass),
        tube(0.152, 0.168, 0.039).paint(C.brass), // the bell rim
        sdf.cylinder(0.03, 0.004).at(0, 0.168, 0).paint(C.lens), // the lens
      ),
    );
    k.body('spyglass', spyglass, { color: C.brass, roughness: 0.4, metalness: 0.7, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ dagger in the left fist (forward grip, held low)
    // Local frame: origin at the fist center, the blade along +Z, the flat facing up, the curve toward +X.
    const bladeOutline = sdf.extrude(
      profile.polygon(
        [
          [-0.0165, 0],
          [0.0165, 0],
          [0.0185, 0.04],
          [0.0235, 0.08],
          [0.03, 0.12],
          [0.036, 0.16],
          [0.0118, 0.12],
          [-0.005, 0.08],
          [-0.0135, 0.04],
        ],
        { smooth: false },
      ),
      0.014,
      0.004,
    ).rotateX(90);
    const GUARD_Z = 0.05;
    const daggerLocal = sdf.union(
      bladeOutline.at(0, 0, GUARD_Z).paint(C.blade),
      sdf.box([0.078, 0.015, 0.018], 0.004).at(0, 0, GUARD_Z).paint(C.steel), // the crossguard, across the blade
      sdf.sphere(0.0135).at(0, 0, -0.054).paint(C.steel), // pommel
    );
    const gripLocal = sdf.capsule([0, 0, -0.048], [0, 0, GUARD_Z], 0.0115);
    const HOLD = { tilt: -10, turn: -20 };
    const inHand = (s: sdf.Shape) => s.scale(1.0).rotateX(HOLD.tilt).rotateY(HOLD.turn).at(...FIST_L);
    k.body('dagger', inHand(daggerLocal), { color: C.blade, roughness: 0.3, metalness: 0.85, detail: 0.004, bone: 'knife.L' });
    k.body('daggerGrip', inHand(gripLocal), { color: C.grip, roughness: 0.6, detail: 0.005, bone: 'knife.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const turn = (v: V3, axis: 0 | 1 | 2, deg: number): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      const [x, y, z] = v;
      if (axis === 0) return [x, y * c - z * s, y * s + z * c];
      if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
      return [x * c - y * s, x * s + y * c, z];
    };
    const holdDir = (v: V3) => turn(turn(v, 0, HOLD.tilt), 1, HOLD.turn);
    // Rest directions of the two hand-held items, in the chest's rest frame.
    const restL = { dir: holdDir([0, 0, 1]), up: holdDir([0, 1, 0]) };
    const restR = { dir: SPY, up: [0, 1, 0] as V3 };
    const chainL = { root: SHOULDER as V3, mid: ELBOW as V3, end: WRIST as V3 };
    const chainR = { root: SH_R as V3, mid: EL_R as V3, end: WR_R as V3 };
    const poleL: V3 = ELBOW;
    const poleR: V3 = EL_R;
    // One arm from a wrist target, an elbow pole, and the item's direction and flat.
    const solveArm = (tag: 'L' | 'R', chain: typeof chainL, rest: typeof restL, wrist: V3, pole: V3, dir: V3, up: V3) => {
      const arm = reach(chain, wrist, pole);
      const hand = orient([arm.upper, arm.lower], rest, { dir: norm(dir), up: norm(up) });
      return {
        rots: [arm.upper, arm.lower, hand] as V3[],
        bones: {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
          [`hand.${tag}`]: { rotate: hand },
        },
      };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [0, 0, 0] },
        'hand.R': { rotate: [3 * wave(p, 1, 0.2), 0, 0] }, // the spyglass tip bobs
      }),
    });

    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [ANKLE[0], 0, -0.045],
          toe: [ANKLE[0], 0, 0.11],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          // The left forearm is held forward with the dagger, so the arm swings only a little.
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 3] as const },
          // The right forearm stays raised; the whole arm sways a little and the spyglass bobs.
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, 0] as const },
          'hand.R': { rotate: [armSwing * 0.1 * wave(p, 2, 0.1), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006, 6));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03, 22));

    // ------------------------------------------------------------------ attack: a dagger slash from the left, across the front
    // She winds up to her left with the dagger raised over the fist, then the torso unwinds and the
    // dagger cuts down and across at chest height. The left foot steps in. The paths stay in front
    // of the jerkin, far below the head.
    const wristKeysL: [number, V3][] = [
      [0, WRIST],
      [0.2, [0.27, 0.31, 0.04]],
      [0.3, [0.275, 0.32, 0.04]],
      [0.38, [0.15, 0.31, 0.13]],
      [0.46, [0.05, 0.27, 0.16]],
      [0.6, [0.05, 0.26, 0.15]],
      [0.8, [0.205, 0.255, 0.03]],
      [1, WRIST],
    ];
    const bladeKeysL: [number, V3][] = [
      [0, restL.dir],
      [0.2, [0.35, 0.8, 0.45]],
      [0.3, [0.38, 0.8, 0.4]],
      [0.38, [0.15, 0.35, 0.9]],
      [0.46, [-0.6, -0.1, 0.8]],
      [0.6, [-0.7, -0.1, 0.65]],
      [0.8, [0.1, 0.4, 0.9]],
      [1, restL.dir],
    ];
    const upKeysL: [number, V3][] = [
      [0, restL.up],
      [0.2, [0, -0.5, 0.86]],
      [0.3, [0, -0.5, 0.86]],
      [0.38, [0, 1, 0.1]],
      [0.6, [0, 1, 0.1]],
      [0.8, restL.up],
      [1, restL.up],
    ];
    const poleKeysL: [number, V3][] = [
      [0, poleL],
      [0.2, [0.8, 0.35, 0.0]],
      [0.3, [0.8, 0.35, 0.0]],
      [0.4, [0.5, 0.3, 0.0]],
      [0.6, [0.4, 0.3, 0.0]],
      [0.8, poleL],
      [1, poleL],
    ];
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        // +Y turns the front toward her left: wind up left, unwind right.
        const hipsY = keys(p, [[0, 0], [0.2, 12], [0.3, 12], [0.46, -14], [0.62, -12], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.2, 22], [0.3, 22], [0.46, -22], [0.62, -18], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.2, 6], [0.3, 6], [0.46, 10], [0.62, 8], [1, 0]] as const);
        const legX = keys(p, [[0, 0], [0.2, -5], [0.3, -6], [0.42, -17], [0.66, -17], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.2, 8], [0.42, 6], [0.66, 6], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.3, -0.006], [0.42, 0.028], [0.66, 0.028], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad) * Math.cos(legZ * rad));
        const l = solveArm('L', chainL, restL, keys(p, wristKeysL, 'spline'), keys(p, poleKeysL), keys(p, bladeKeysL, 'spline'), keys(p, upKeysL));
        return {
          hips: { move: [0, -drop, stepZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY, 0] },
          head: { rotate: [-0.6 * lean, -0.55 * (hipsY + chestY), 0] },
          cloak: { rotate: [keys(p, [[0, 0], [0.3, 6], [0.46, 14], [0.62, 8], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legX, 0, legZ] },
          'leg.R': { rotate: [-legX, 0, -legZ] },
          'foot.L': { rotate: [-legX, 0, -legZ] },
          'foot.R': { rotate: [legX, 0, legZ] },
          'upperarm.R': { rotate: [10 * keys(p, [[0.3, 0], [0.46, 1], [0.8, 0.4], [1, 0]] as const), 0, 0] },
          ...l.bones,
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad;
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
          'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-24 * h, 0, 0 * h] },
          'hand.R': { rotate: [70 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: spyglass point and a dash step
    // She crouches, the right fist rises so the spyglass points forward at eye level, and she dashes
    // forward on a wide step with the dagger held out low behind; then she steps back to her stance.
    const wristKeysR: [number, V3][] = [
      [0, WR_R],
      [0.18, WR_R],
      [0.32, [-0.22, 0.46, 0.13]],
      [0.62, [-0.22, 0.46, 0.13]],
      [0.85, WR_R],
      [1, WR_R],
    ];
    const dirKeysR: [number, V3][] = [
      [0, SPY],
      [0.18, SPY],
      [0.32, [-0.06, 0.25, 0.96]],
      [0.62, [-0.06, 0.25, 0.96]],
      [0.85, SPY],
      [1, SPY],
    ];
    const poleKeysR: [number, V3][] = [
      [0, poleR],
      [0.18, poleR],
      [0.32, [-0.4, 0.28, 0.0]],
      [0.62, [-0.4, 0.28, 0.0]],
      [0.85, poleR],
      [1, poleR],
    ];
    // The dagger swings back and out low while she dashes.
    const wristKeysL2: [number, V3][] = [[0, WRIST], [0.3, [0.25, 0.25, 0.0]], [0.62, [0.25, 0.25, 0.0]], [0.85, WRIST], [1, WRIST]];
    const bladeKeysL2: [number, V3][] = [[0, restL.dir], [0.3, [0.3, 0.05, 0.95]], [0.62, [0.3, 0.05, 0.95]], [0.85, restL.dir], [1, restL.dir]];
    k.animation('attack2', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const legX = keys(p, [[0, 0], [0.16, -4], [0.34, -24], [0.62, -24], [0.85, 0], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.16, 10], [0.34, 5], [0.62, 5], [0.85, 0], [1, 0]] as const);
        const dashZ = keys(p, [[0.16, 0], [0.42, 0.15], [0.62, 0.15], [0.86, 0]] as const);
        const lean = keys(p, [[0, 0], [0.16, 9], [0.34, 14], [0.62, 12], [0.85, 0], [1, 0]] as const);
        const hop = 0.025 * keys(p, [[0.3, 0], [0.42, 1], [0.54, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad) * Math.cos(legZ * rad));
        const r = solveArm('R', chainR, restR, keys(p, wristKeysR), keys(p, poleKeysR), keys(p, dirKeysR), [0, 1, 0]);
        const l = solveArm('L', chainL, restL, keys(p, wristKeysL2), poleL, keys(p, bladeKeysL2), restL.up);
        return {
          hips: { move: [0, hop - drop, dashZ], rotate: [0, 0, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, 0, 0] },
          head: { rotate: [-0.9 * lean, 0, 0] },
          cloak: { rotate: [0.6 * lean + 18 * keys(p, [[0.2, 0], [0.42, 1], [0.7, 0.5], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legX, 0, legZ] },
          'leg.R': { rotate: [-legX, 0, -legZ] },
          'foot.L': { rotate: [-legX, 0, -legZ] },
          'foot.R': { rotate: [legX, 0, legZ] },
          ...r.bones,
          ...l.bones,
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    const { follow, quat, euler } = motion;
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const lerp = (a: V3, b: V3, t: number): V3 => add(a, add(b, a, -1), t);
    const LIE = 78;
    const LIE_Y = 0.178;
    const HEEL = 0.05;
    const FIST_Y = 0.03;
    const BEND_NECK = 10;
    const BEND_HEAD = 12;
    const TURN = 22;
    const HIPS0: V3 = [0, 0.2, 0];
    const TRUNK: readonly V3[] = [HIPS0, [0, 0.26, 0], [0, 0.33, 0]];
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turn(add(v, HIPS0, -1), 0, -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turn(add(w, add(HIPS0, END), -1), 0, LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number; loose: number };
    // side 1 is the left arm (the dagger drops); side -1 is the right arm (the spyglass stays in the fist).
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const isL = side === 1;
      const chain = isL
        ? { root: f(SHOULDER), mid: f(ELBOW), end: FIST_L as V3 }
        : { root: SH_R as V3, mid: EL_R as V3, end: FIST_R as V3 };
      const joints: readonly V3[] = [...TRUNK, chain.root, chain.mid, isL ? f(WRIST) : (WR_R as V3)];
      const shoulderW = toWorld(chain.root);
      const reachLen = isL ? 0.23 : 0.19;
      const span = Math.sqrt(Math.max(0, reachLen ** 2 - (shoulderW[1] - FIST_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistW: V3 = [shoulderW[0] + out[0] * span, FIST_Y, shoulderW[2] + out[2] * span];
      const fistEnd = toBody(fistW);
      const knifeAt: V3 = [fistW[0] + 0.095 * side, 0.036, fistW[2] + 0.05];
      const dropKeys: [number, V3][] = [
        [0.44, add(knifeAt, [0, 0.12, 0])],
        [0.6, knifeAt],
        [0.65, add(knifeAt, [0, 0.015, 0])],
        [0.7, knifeAt],
      ];
      const dropTurn = quat(orient([], restL, { dir: norm([0.6, 0, 0.8]), up: [0, 1, 0] }));
      return (p: number, trunk: readonly V3[], move: V3, w: Weights) => {
        const stand = add(add(add(chain.end, f([0.05, 0.05, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.03]), w.fly);
        const restPole: V3 = isL ? poleL : poleR;
        const landPole: V3 = isL ? [0.6, 0.45, 0.1] : [-0.6, 0.45, 0.1];
        const arm = reach(chain, lerp(stand, fistEnd, w.land), lerp(restPole, landPole, w.land));
        if (!isL) return { [`upperarm.${tag}`]: { rotate: arm.upper }, [`forearm.${tag}`]: { rotate: arm.lower } };
        const rots: V3[] = [...trunk, arm.upper, arm.lower, [0, 0, 0]];
        const handQ = rots.slice(0, 5).reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
        const inv = handQ.clone().invert();
        const held = add(follow(joints, rots, chain.end), move);
        const d = new THREE.Vector3(...add(lerp(held, keys(p, dropKeys), w.loose), held, -1)).applyQuaternion(inv);
        return {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
          [`knife.${tag}`]: { move: [d.x, d.y, d.z] as V3, rotate: euler(inv.clone().multiply(handQ.clone().slerp(dropTurn, w.loose))) },
        };
      };
    };
    const DEATH_HAND = -130;
    const deathL = deathArm(1);
    const deathR = deathArm(-1);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const flat = keys(p, [[0.4, 0], [0.62, 1]] as const);
        const crumple = keys(p, [[0.42, 0], [0.56, 1], [0.72, 1], [0.9, 0]] as const);
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land, loose };
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-14 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          cloak: {
            rotate: [10 * hitB - 8 * flat - 12 * crumple, 0, 5 * wob],
            scale: [1 + 0.12 * flat, 1 - 0.15 * crumple, 1 - 0.6 * flat],
          },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(p, [hipsR, spineR, chestR], hipsMove, w),
          ...deathR(p, [hipsR, spineR, chestR], hipsMove, w),
          'hand.R': { rotate: [DEATH_HAND * land, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ victory: both items raised, a little hop
    // The spyglass goes up and out on the right, the dagger up on the left, both outside the head.
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const c = keys(p, [[0.1, 0], [0.4, 1]] as const);
        const sly = keys(p, [[0.4, 0], [0.65, 1]] as const);
        const hop = 0.03 * keys(p, [[0.42, 0], [0.55, 1], [0.68, 0]] as const);
        const r = solveArm('R', chainR, restR, lerp(WR_R, [-0.29, 0.5, 0.06], c), lerp(poleR, [-0.55, 0.3, -0.05], c), lerp(SPY, [-0.45, 0.8, 0.3], c), [0, 1, 0]);
        const l = solveArm('L', chainL, restL, lerp(WRIST, [0.27, 0.46, 0.02], c), lerp(poleL, [0.5, 0.3, -0.05], c), lerp(restL.dir, [0.55, 1, 0.05], c), lerp(restL.up, [0, 0.1, 1], c));
        return {
          hips: { move: [0, hop, 0], rotate: [0, -6 * c, 0] },
          spine: { rotate: [-3 * c, 0, 0] },
          chest: { rotate: [-3 * c, 5 * c, 0] },
          neck: { rotate: [3 * sly, 0, 0] },
          head: { rotate: [-6 * sly, -8 * sly, 8 * sly] },
          cloak: { rotate: [3 * c + 8 * keys(p, [[0.42, 0], [0.6, 1], [0.8, 0]] as const), 0, 0] },
          ...r.bones,
          ...l.bones,
        };
      },
    });
  },
});
