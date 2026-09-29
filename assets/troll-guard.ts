import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Troll guard — Chibi Quest enemy (catalog `enemies/humanoid/troll-guard`), about 1.15 m to the top
 * of its helmet spike line, faces +Z. Target: docs/enemy-mockups/troll-guard_001.jpg (one front view).
 * Built on the orc warrior rig (assets/orc-warrior.ts): same legs, knees, gait, and clip set.
 *
 * Role: a slow, tough gate guard seen in 3D and as a 128 px sprite; the huge nose, the two pale
 *   tusks, the dreadlock mane, the too-high rusty helmet, and the club must read.
 * One idea: a hunched brute that is all head: a giant bulbous nose, an underbite jaw with two big
 *   upward tusks, small pale eyes under a heavy brow, and a rope-hair mane down its chest.
 * Proportions (from the mockup): helmet top 1.15, eyes 0.89, nose 0.83, mouth 0.745, chin 0.64,
 *   shoulders 0.52, belt 0.37, kilt hem 0.15, left fist 0.2, right fist at the shoulder 0.7.
 * Shape language: round and heavy (head, nose, belly, fists) with a few hard accents (tusks,
 *   helmet spikes, iron band, club studs, ragged kilt).
 * Palette (60/30/10): grey-green skin #7a8a62; dark rope hair #3a3228; brown kilt #5a3a24; rusty
 *   iron #4a4a4e with rust #6a4a2a; ivory tusks #d8ccae; pale blue eyes #8fb8d8 as the accent.
 * Bodies: face (face, ears, nose, neck), skin (torso, arms, legs, feet), mane, helmet (dome, ridge),
 *   spikes, tusks, kilt, rope belt, club (wood), club-iron (band, studs).
 * Rig: the orc's chibi humanoid without the topknot. The right arm rests bent, the fist at the
 *   shoulder, the club rigid on `hand.R` over the right shoulder. Clips: idle, walk, run, attack (a
 *   two-hand overhead slam), attack2 (a side sweep), roar, hit, death.
 */

const C = {
  skin: '#63734f',
  skinDark: '#485636',
  eye: '#8fb8d8',
  sclera: '#dfe4d0',
  pupil: '#141a20',
  mouth: '#2a2a1c',
  hair: '#3a3228',
  tusk: '#e8d4bc',
  iron: '#4a4a4e',
  rust: '#6a4a2a',
  kilt: '#5a3a24',
  kiltPatch: '#7a5a3a',
  rope: '#8a6c48',
  wood: '#6a4a2c',
  band: '#3a3a3e',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** The elbow direction (from the shoulder-wrist line) that reproduces the rest pose. */
const poleOf = (root: V3, mid: V3, end: V3): V3 => {
  const d = norm(sub(end, root));
  const m = sub(mid, root);
  return sub(m, mul(d, dot(m, d)));
};
const DEG = Math.PI / 180;
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

// Joints: wide shoulders, long arms, the orc's legs. The right arm rests bent, the fist at the shoulder.
const SHOULDER: V3 = [0.21, 0.52, 0.03];
const ELBOW: V3 = [0.33, 0.38, 0.05];
const WRIST: V3 = [0.37, 0.2, 0.09];
const SHOULDER_R = mx(SHOULDER);
const ELBOW_R: V3 = [-0.48, 0.44, 0.0];
const WRIST_R: V3 = [-0.53, 0.66, 0.08];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left bare foot (y = 0), as measured on the orc's foot SDF.
const SOLE_HEEL: V3 = [0.155, 0, -0.022];
const SOLE_TOE: V3 = [0.169, 0, 0.09];
const HEAD_C: V3 = [0, 0.85, 0.05];

// The club: the grip at the origin, the head end along +Y (0.6 m), the butt 0.1 m behind the grip.
const FOREARM_R = norm(sub(WRIST_R, ELBOW_R));
const GRIP: V3 = add(WRIST_R, mul(FOREARM_R, 0.075));
const CLUB_DIR = norm([0.2, 0.72, -0.66]);
const CLUB_A = Math.asin(CLUB_DIR[2]) / DEG;
const CLUB_B = Math.asin(-CLUB_DIR[0] / Math.cos(CLUB_A * DEG)) / DEG;
const clubPose = (s: sdf.Shape) => s.rotateX(CLUB_A).rotateZ(CLUB_B).at(...GRIP);
const CLUB = { dir: rotZv(rotXv([0, 1, 0], CLUB_A), CLUB_B), up: rotZv(rotXv([0, 0, 1], CLUB_A), CLUB_B) };

/** A big fist hanging from the wrist `w` (the left hand). */
const fistAt = (w: V3) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.024,
    sdf.ellipsoid([0.076, 0.08, 0.08]).at(...o(0.006, -0.065, 0.008)),
    sdf.capsule(o(-0.02, -0.105, 0.058), o(-0.012, -0.066, 0.078), 0.032), // curled fingers
    sdf.cone(o(0.04, -0.04, 0.05), o(0.006, -0.058, 0.09), 0.03, 0.024), // thumb
  );
};

/** The right fist wrapped around the club shaft (the club's local frame, then posed). */
const gripFist = () =>
  clubPose(
    sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.072, 0.06, 0.072]).at(0, 0, 0),
      ...[-0.042, -0.014, 0.014, 0.042].map((y) => sdf.capsule([-0.055, y, 0.05], [0.055, y, 0.05], 0.024)),
      sdf.cone([0.05, -0.05, 0.03], [0.02, 0.05, 0.062], 0.03, 0.022), // thumb
    ),
  );

export default defineAsset({
  name: 'troll-guard',
  description: 'Chibi troll guard enemy: a hunched grey-green brute with a huge nose, an underbite with two big tusks, a rope-hair mane, a rusty helmet worn too high, a ragged kilt, and a studded club.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/troll-guard_001.jpg',
  variants: {
    skin: { moss: C.skin, slate: '#6a7a88', mud: '#7a5a44' },
    hair: { dark: C.hair, grey: '#8a8a80', red: '#7a3a22' },
    kilt: { brown: C.kilt, grey: '#4a4a4a', green: '#4a5a34' },
  },
  presets: {
    cave: { skin: 'slate', hair: 'grey', kilt: 'grey' },
    hill: { skin: 'mud', hair: 'red', kilt: 'green' },
    moor: { skin: 'moss', hair: 'grey', kilt: 'brown' },
  },

  build(k) {
    const T = {
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      hair: k.tint('hair'),
      kilt: k.tint('kilt'),
    };
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const smooth01 = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, 0.02] },
      head: { parent: 'neck', at: [0, 0.64, 0.04] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: SHOULDER_R },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head
    const head = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.235, 0.2, 0.215]).at(...HEAD_C),
        sdf.ellipsoid([0.2, 0.09, 0.17]).at(0, 0.7, 0.1),
        sdf.box([0.36, 0.08, 0.13], 0.032).at(0, 0.69, 0.228), // the underbite: sticks 0.04 m past the upper lip
        pair(sdf.sphere(0.09).at(0.14, 0.78, 0.12)), // cheeks
        sdf.ellipsoid([0.22, 0.06, 0.105]).at(0, 0.932, 0.205), // a heavy brow ridge
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const noseBase = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.123, 0.098, 0.106]).at(0, 0.805, faceZ(0, 0.805) - 0.012), pair(sdf.sphere(0.046).at(0.068, 0.775, faceZ(0.068, 0.775) + 0.0)))
      .bone('head');
    // Two nostril dents on the underside of the nose.
    const nostrilPts = [0.042, -0.042].map((x) => sdf.surfacePoint(noseBase, [x, 0.74, faceZ(0, 0.8)], 0));
    const nose = noseBase.smoothSubtract(0.006, ...nostrilPts.map((q) => sdf.ellipsoid([0.017, 0.012, 0.02]).at(q[0], q[1] + 0.004, q[2] - 0.004)));
    const ears = pair(
      sdf
        .cone([0.2, 0.88, 0.02], [0.36, 0.99, -0.06], 0.058, 0.008)
        .smoothSubtract(0.006, sdf.cone([0.21, 0.885, 0.05], [0.36, 0.99, -0.02], 0.033, 0.004))
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.52, 0.02], [0, 0.72, 0.06], 0.12).bone('neck');

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.088, 0.886, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.037, 0.03, 0.07]), EYE[0], EYE[1]));
    const iris = pair(at(sdf.ellipsoid([0.024, 0.024, 0.07]), EYE[0] - 0.004, EYE[1] - 0.002));
    const pupil = pair(at(sdf.ellipsoid([0.01, 0.012, 0.07]), EYE[0] - 0.006, EYE[1] - 0.003));
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.006), x - 0.008, EYE[1] + 0.006)));
    const MOUTH_Y = 0.745;
    const mouth = sdf.extrude(profile.arc(0.3, 0.024, 62, 118), 0.4).at(0, MOUTH_Y - 0.3, 0.2);
    const nostrils = sdf.union(...nostrilPts.map((q) => sdf.sphere(0.014).at(q[0], q[1] + 0.006, q[2] - 0.004)));

    // ------------------------------------------------------------------ torso, arms, legs
    // The trunk is built around its own pivot and hunched forward 12 degrees.
    const hunch = (s: sdf.Shape) => s.rotateX(12).at(0, 0.3, 0);
    const trunk = hunch(
      sdf.smoothUnion(
        0.06,
        sdf.ellipsoid([0.2, 0.17, 0.165]).at(0, 0.17, 0.0).bone('chest'),
        sdf.ellipsoid([0.18, 0.16, 0.175]).at(0, 0.05, 0.03).bone('spine'), // a heavy belly
        pair(sdf.sphere(0.1).at(0.14, 0.26, -0.02).bone('chest')), // shoulders and traps
        pair(sdf.ellipsoid([0.085, 0.065, 0.06]).at(0.075, 0.18, 0.1).bone('chest')), // pecs
      ),
    );
    const armL = sdf.smoothUnion(
      0.03,
      sdf.cone(SHOULDER, ELBOW, 0.078, 0.066).bone('upperarm.L'),
      sdf.ellipsoid([0.06, 0.08, 0.058]).at(...lerp(SHOULDER, ELBOW, 0.5)).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.066, 0.06).bone('forearm.L'),
      fistAt(WRIST).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.03,
      sdf.cone(SHOULDER_R, ELBOW_R, 0.078, 0.066).bone('upperarm.R'),
      sdf.ellipsoid([0.06, 0.08, 0.058]).at(...lerp(SHOULDER_R, ELBOW_R, 0.5)).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.066, 0.06).bone('forearm.R'),
      gripFist().bone('hand.R'),
    );
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));
    // Big bare flat feet with three fat toes (the sole is the orc's, so the gait constants hold).
    const footLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035),
        ...[-0.05, 0, 0.05].map((x) => sdf.sphere(0.033).at(x, 0.036, 0.128 - Math.abs(x) * 0.25)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));

    // Warts: small bumps on the surface of the head and body.
    const bodyBase = sdf.union(trunk, armL, armR, legs);
    const warts = (base: sdf.Shape, pts: readonly V3[], r: number) =>
      sdf.union(...pts.map((p, i) => sdf.sphere(r * (0.8 + 0.4 * noise.random(i, 3, 5))).at(...sdf.surfacePoint(base, p, -0.002))));
    const headWarts = warts(sdf.smoothUnion(0.02, head, nose), [[0.03, 0.87, 0.45], [-0.05, 0.85, 0.45], [0.08, 0.79, 0.45], [-0.09, 0.8, 0.45], [0.13, 0.955, 0.34], [-0.15, 0.95, 0.32], [0.02, 0.955, 0.36], [-0.18, 0.72, 0.25]], 0.017);
    const bodyWarts = warts(bodyBase, [[-0.1, 0.5, 0.4], [0.16, 0.42, 0.4], [0.24, 0.62, 0.05], [-0.22, 0.63, 0.0], [0.2, 0.6, -0.12], [-0.17, 0.62, -0.12], [0.3, 0.3, 0.15], [-0.36, 0.5, 0.2]], 0.015);
    const skinBump = (x: number, y: number, z: number) => 0.0022 * noise.fbm(x * 70, y * 70, z * 70, 2);

    const face = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.02, nose, ears)
      .smoothUnion(0.008, headWarts)
      .paintWhere(eyeBall, C.sclera, 0.002)
      .paintWhere(iris, C.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(mouth, T.mouth, 0.003)
      .paintWhere(nostrils, T.mouth, 0.004);
    k.body('face', face, { color: T.skin, roughness: 0.6, textureDensity: 2, detail: 0.004, bump: skinBump });

    const skin = sdf
      .smoothUnion(0.05, trunk)
      .union(armL, armR)
      .smoothUnion(0.03, legs)
      .smoothUnion(0.01, bodyWarts)
      .union(feet)
      .paintFn((x, y, z, base) => (y < 0.32 && z > 0.12 && Math.abs(x) < 0.16 ? [base[0] * 0.92, base[1] * 0.92, base[2] * 0.92] : base));
    k.body('skin', skin, { color: T.skin, roughness: 0.6, detail: 0.007, bump: skinBump });

    // ------------------------------------------------------------------ tusks
    // Two big pale tusks rise from the jaw corners over the cheeks, curving in at the tips.
    const tuskPath = [
      [0.12, 0.68, 0.012, 0.035],
      [0.163, 0.72, 0.03, 0.031],
      [0.192, 0.775, 0.036, 0.023],
      [0.185, 0.835, 0.028, 0.015],
    ].map(([x, y, lift, r]) => [x!, y!, faceZ(x!, y!) + lift!, r!] as [number, number, number, number]);
    const tuskRoot = rgb('#d0b8a0');
    const tuskTip = rgb(C.tusk);
    k.body(
      'tusks',
      pair(sdf.chain(tuskPath, 0.012)).bone('head').paintFn((x, y) => {
        const t = smooth01(0.7, 0.83, y);
        return [tuskRoot[0] + (tuskTip[0] - tuskRoot[0]) * t, tuskRoot[1] + (tuskTip[1] - tuskRoot[1]) * t, tuskRoot[2] + (tuskTip[2] - tuskRoot[2]) * t];
      }),
      { color: C.tusk, roughness: 0.45, detail: 0.004 },
    );

    // ------------------------------------------------------------------ mane: rope-like dreadlock strands
    // 22 strands: 10 hang in front to the belly, 4 beside the head, 4 over the shoulders, 4 down the back.
    const strandsBeard = Array.from({ length: 10 }, (_, i) => {
      const u = (i - 4.5) / 4.5;
      const x = 0.165 * u;
      const wob = (i % 2 ? 1 : -1) * 0.014;
      const endY = 0.29 + 0.05 * (1 - Math.abs(u)) + 0.03 * noise.random(i, 1, 1);
      const zAt = (y: number) => (y > 0.66 ? 0.16 : y > 0.55 ? 0.225 : 0.245) - 1.5 * x * x;
      return sdf
        .chain(
          [
            [x, 0.7, 0.16, 0.024],
            [x * 1.02 + wob, 0.58, zAt(0.58) + 0.005, 0.024],
            [x * 0.95 - wob, 0.46, zAt(0.46) + 0.008, 0.02],
            [x * 0.9 + wob * 0.6, endY, zAt(0.4) + 0.006, 0.012],
          ],
          0.02,
        )
        .bone('chest');
    });
    const strandsSide = [0].flatMap((j) =>
      [0, 1].map((i) => {
        const dz = -0.03 + 0.06 * i;
        return sdf
          .chain(
            [
              [0.225 + 0.012 * j, 0.93, dz - 0.03, 0.024],
              [0.275 + 0.014 * j, 0.8, dz - 0.03 + 0.02 * j, 0.022],
              [0.275 + 0.012 * j, 0.66, dz + 0.02, 0.018],
              [0.26 + 0.012 * j, 0.6 - 0.04 * i, dz + 0.05, 0.012],
            ],
            0.02,
          )
          .bone('head');
      }),
    ).map((s) => pair(s));
    const strandsShoulder = [0, 1].map((i) =>
      pair(
        sdf
          .chain(
            [
              [0.17 + 0.03 * i, 0.84, -0.12 + 0.08 * i, 0.025],
              [0.2 + 0.03 * i, 0.74, -0.16 + 0.1 * i, 0.023],
              [0.225 + 0.03 * i, 0.66, -0.13 + 0.1 * i, 0.02],
              [0.245 + 0.03 * i, 0.55 - 0.03 * i, -0.08 + 0.1 * i, 0.013],
            ],
            0.02,
          )
          .bone('head'),
      ),
    );
    const strandsBack = [-0.13, -0.045, 0.045, 0.13].map((x, i) =>
      sdf
        .chain(
          [
            [x, 0.93, -0.19, 0.026],
            [x * 1.1, 0.78, -0.235, 0.024],
            [x * 1.2, 0.6, -0.2, 0.02],
            [x * 1.2, 0.4 - 0.02 * (i % 2), -0.19, 0.013],
          ],
          0.02,
        )
        .bone('head'),
    );
    const hairCap = sdf
      .ellipsoid([0.245, 0.2, 0.19])
      .at(0, 0.85, -0.03)
      .intersect(sdf.box([0.6, 0.6, 0.3]).at(0, 0.85, -0.14))
      .bone('head');
    const mane = sdf.smoothUnion(0.012, hairCap, ...strandsBeard, ...strandsSide, ...strandsShoulder, ...strandsBack);
    k.body('mane', mane, {
      color: T.hair,
      roughness: 0.75,
      detail: 0.006,
      bump: (x, y, z) => 0.0032 * Math.sin(y * 150 + (x + z) * 250) + 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ helmet: too small, worn too high
    const domeShell = sdf
      .ellipsoid([0.255, 0.2, 0.25])
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .subtract(sdf.ellipsoid([0.24, 0.187, 0.235]));
    const domeSolid = sdf.ellipsoid([0.255, 0.2, 0.25]).intersect(sdf.halfSpace([0, -1, 0], 0));
    const ridge = domeSolid.round(0.018).intersect(sdf.box([0.045, 0.5, 0.56], 0.01)).subtract(sdf.ellipsoid([0.24, 0.187, 0.235]));
    const rim = sdf.torus(0.245, 0.016).scale([1, 1, 0.98]).at(0, 0.004, 0);
    const brow = sdf.ellipsoid([0.2, 0.03, 0.06]).at(0, 0.006, 0.225).intersect(sdf.halfSpace([0, -1, 0], 0.02));
    const helmPose = (s: sdf.Shape) => s.rotateX(-6).at(0, 0.95, 0.03);
    // A row of rivets along the brim.
    const rivets = sdf.union(
      ...Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return sdf.sphere(0.0095).at(0.246 * Math.sin(a), 0.012, 0.24 * Math.cos(a));
      }),
    );
    const helmLocal = sdf.smoothUnion(0.01, domeShell, ridge, rim, brow).union(rivets);
    const rustAmount = (x: number, y: number, z: number) => noise.fbm(x * 22, y * 22, z * 22, 2);
    const helmet = helmPose(helmLocal).paintFn((x, y, z, base) => (rustAmount(x, y, z) > 0.32 ? rgb(C.rust) : base));
    k.body('helmet', helmet, {
      color: C.iron,
      roughness: 0.6,
      metalness: 0.5,
      bone: 'head',
      detail: 0.004,
      // A cross-hatch of raised diagonal ribs, like riveted plate seams, plus fine pitting.
      bump: (x, y, z) => {
        const a = Math.sin((x + z) * 95 + y * 40);
        const b = Math.sin((x - z) * 95 - y * 40);
        return 0.0022 * (smooth01(0.55, 0.9, a) + smooth01(0.55, 0.9, b)) + 0.001 * noise.fbm(x * 60, y * 60, z * 60, 2);
      },
    });
    // Four small spikes on the dome, along its normal.
    const spikeAt = (phi: number, elev: number) => {
      const px = 0.255 * Math.sin(phi * DEG) * Math.cos(elev * DEG);
      const py = 0.2 * Math.sin(elev * DEG);
      const pz = 0.25 * Math.cos(phi * DEG) * Math.cos(elev * DEG);
      const n = norm([px / 0.255 ** 2, py / 0.2 ** 2, pz / 0.25 ** 2]);
      return sdf.cone([px - n[0] * 0.012, py - n[1] * 0.012, pz - n[2] * 0.012], [px + n[0] * 0.075, py + n[1] * 0.075, pz + n[2] * 0.075], 0.022, 0.003);
    };
    const spikes = helmPose(sdf.union(...[50, 125].flatMap((phi) => [phi, -phi].map((p) => spikeAt(p, 22)))));
    k.body('spikes', spikes, { color: C.iron, roughness: 0.5, metalness: 0.6, bone: 'head', detail: 0.004 });

    // ------------------------------------------------------------------ ragged leather kilt and rope belt
    const skirtCone = (grow: number, top: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, top],
            [0.205 + grow, top],
            [0.205 + grow, 0.36],
            [0.228 + grow, 0.27],
            [0.258 + grow, 0.15],
            [0, 0.15],
          ]),
        )
        .scale([1, 1, 0.9])
        .at(0, 0, 0.03);
    const clothFolds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(x, z) * 9 + noise.fbm(x * 12, y * 4, z * 12, 2) * 2) * Math.min(1, Math.max(0, (0.34 - y) / 0.12));
    const tearCut = (i: number, w: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, 0.08],
            [w, 0.08],
            [0, top],
          ]),
          0.4,
        )
        .at(0, 0, 0.3)
        .rotateY(i);
    const tears = sdf.union(
      ...Array.from({ length: 13 }, (_, i) => tearCut(i * 27.7 + (noise.random(i, 7, 1) - 0.5) * 12, 0.022 + noise.random(i, 7, 2) * 0.02, 0.2 + noise.random(i, 7, 3) * 0.08)),
      ...Array.from({ length: 8 }, (_, i) => tearCut(i * 45 + 14, 0.007, 0.19 + noise.random(i, 8, 3) * 0.05)),
    );
    const skirt = skirtCone(0, 0.39).subtract(skirtCone(-0.014, 0.5)).displace(0.008, clothFolds, 1.5).subtract(tears);
    const kiltLight = k.tint('kilt', { color: C.kiltPatch, follow: 1 });
    const dark = shadeOf(C.kilt, '#3a2416');
    const kilt = sdf
      .union(
        skirt.intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('hips'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('leg.L'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([1, 0, 0], 0)).bone('leg.R'),
      )
      .paintFn((x, y, z, base) => {
        const hem = Math.min(1, Math.max(0, (0.24 - y) / 0.09));
        const d = hem * 0.6;
        return [base[0] + dark[0] * d, base[1] + dark[1] * d, base[2] + dark[2] * d];
      });
    // Three hanging leather strips with torn ends below the hem, in front.
    const stripShape = sdf
      .extrude(
        profile.polygon([[-0.026, 0.07], [0.026, 0.07], [0.026, -0.06], [0.009, -0.042], [0.0, -0.078], [-0.011, -0.04], [-0.026, -0.066]]),
        0.014,
        0.003,
      )
      .at(0, 0, -0.007);
    const stripAt = (x: number, tilt: number) => stripShape.rotateX(tilt).rotateY(-x * 120).at(x, 0.135, Math.sqrt(0.258 * 0.258 - x * x) * 0.9 + 0.03 - 0.002);
    const strips = sdf.union(stripAt(-0.125, -4), stripAt(-0.01, 3), stripAt(0.11, -3)).bone('hips');
    // Lighter patches of newer leather, stenciled on as rectangles.
    const patchAt = (angle: number, y: number, w: number, h: number, r: number) => sdf.box([w, h, 0.14]).at(0, y, r).rotateY(angle);
    const patches = sdf.union(
      patchAt(-42, 0.28, 0.09, 0.07, 0.25),
      patchAt(-8, 0.25, 0.06, 0.09, 0.27),
      patchAt(32, 0.27, 0.1, 0.06, 0.25),
      patchAt(62, 0.2, 0.07, 0.07, 0.26),
      patchAt(-70, 0.19, 0.06, 0.08, 0.26),
      patchAt(180, 0.27, 0.1, 0.07, 0.21),
      patchAt(150, 0.21, 0.07, 0.06, 0.23),
    );
    const kiltAll = sdf.union(kilt, strips).paintWhere(patches.intersect(sdf.halfSpace([0, 1, 0], 0.32)), kiltLight, 0.004);
    k.body('kilt', kiltAll, { color: T.kilt, roughness: 0.9, detail: 0.007, bump: (x, y, z) => 0.0015 * noise.fbm(x * 50, y * 50, z * 50, 2) });
    // The rope belt: a fat twisted rope with a knot hanging at the front.
    const rope = sdf.union(
      sdf.torus(0.208, 0.026).scale([1, 1, 0.92]).at(0, 0.385, 0.03),
      sdf.chain([[0.06, 0.375, 0.262, 0.025], [0.075, 0.33, 0.27, 0.02], [0.07, 0.29, 0.268, 0.014]], 0.01),
      sdf.chain([[0.02, 0.375, 0.262, 0.024], [0.0, 0.325, 0.272, 0.019], [0.0, 0.285, 0.27, 0.013]], 0.01),
    );
    k.body('rope', rope, {
      color: C.rope,
      roughness: 0.9,
      bone: 'spine',
      detail: 0.005,
      bump: (x, y, z) => 0.0028 * Math.sin(Math.atan2(x, z) * 46 + y * 120),
    });

    // ------------------------------------------------------------------ club: a shaft with a big cylindrical head
    // 0.85 m long in the club frame: the butt at y = -0.15, the head from y = 0.48 to 0.70.
    const HEAD_LO = 0.48;
    const HEAD_HI = 0.7;
    const headR = (y: number) => 0.082 + 0.014 * ((y - HEAD_LO) / (HEAD_HI - HEAD_LO));
    const clubShaft = sdf.cone([0, -0.15, 0], [0, 0.52, 0], 0.03, 0.036).round(0.004);
    const clubHead = sdf.cone([0, HEAD_LO, 0], [0, HEAD_HI, 0], 0.082, 0.096).round(0.01);
    const clubWood = sdf.smoothUnion(0.02, clubShaft, clubHead);
    const studPts = [0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const y = 0.65;
      const r = headR(y) + 0.003;
      return sdf.sphere(0.015).at(r * Math.cos(a), y, r * Math.sin(a));
    });
    const bandMain = sdf.torus(headR(0.575) + 0.006, 0.019).at(0, 0.575, 0); // the wide iron band
    const bandCap = sdf.torus(headR(0.69) + 0.002, 0.011).at(0, 0.69, 0);
    const buttCap = sdf.cylinder(0.04, 0.032, 0.01).at(0, -0.145, 0);
    k.body('club', clubPose(clubWood), {
      color: C.wood,
      roughness: 0.8,
      bone: 'hand.R',
      detail: 0.005,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 30, y * 30, z * 30, 2) + 0.0012 * Math.sin(Math.atan2(z, x) * 16 + y * 8),
    });
    k.body('club-iron', clubPose(sdf.union(bandMain, bandCap, buttCap, ...studPts)), {
      color: C.band,
      roughness: 0.5,
      metalness: 0.7,
      bone: 'hand.R',
      detail: 0.005,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: SHOULDER_R, mid: ELBOW_R, end: WRIST_R };
    const POLE_L = poleOf(SHOULDER, ELBOW, WRIST);
    const POLE_R = poleOf(SHOULDER_R, ELBOW_R, WRIST_R);
    const HAND_DOWN = { dir: [0, -1, 0] as V3, up: [0, 0, 1] as V3 }; // the left fist hangs down from its wrist
    const deg = (r: number) => r / DEG;
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 4 * bump(p)] },
        'upperarm.R': { rotate: [1 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // A heavy, rolling walk (the orc's gait): the club stays on the shoulder.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.26, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 2 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.15 * s, 0, -2] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.05, 0.1, 0.025, 0.62, 0.008, 18, 4, 4));
    k.animation('run', stride(0.62, 0.15, 0.045, 0.42, 0.03, 32, 10, 3));

    // ------------------------------------------------------------------ attack: a two-hand overhead slam
    // The club swings back over the right shoulder while the troll leans back, holds, then both hands
    // drive it over the top and down in front; the head of the club stops just above the floor.
    const clubAt = (p: number) =>
      norm(
        keys(
          p,
          [
            [0, CLUB.dir],
            [0.14, [0.15, 0.8, -0.58]],
            [0.32, [0.05, 0.5, -0.86]], // laid back behind the head
            [0.42, [0.05, 0.45, -0.89]],
            [0.49, [-0.02, 0.97, -0.2]], // over the top
            [0.54, [-0.12, 0.5, 0.86]],
            [0.58, [0, -0.4, 0.92]], // impact in front
            [0.68, [0, -0.42, 0.91]],
            [0.78, [0, -0.42, 0.91]],
            [0.86, [-0.6, 0.5, 0.1]],
            [0.93, [-0.2, 0.68, -0.5]],
            [1, CLUB.dir],
          ] as const,
          'spline',
        ),
      );
    const wristRAt = (p: number) =>
      keys(
        p,
        [
          [0, WRIST_R],
          [0.14, [-0.42, 0.72, -0.02]],
          [0.32, [-0.37, 0.8, -0.05]],
          [0.42, [-0.37, 0.8, -0.05]],
          [0.49, [-0.34, 0.85, 0.06]],
          [0.54, [-0.26, 0.72, 0.42]],
          [0.58, [-0.1, 0.64, 0.5]],
          [0.68, [-0.1, 0.64, 0.51]],
          [0.78, [-0.1, 0.64, 0.51]],
          [0.86, [-0.52, 0.6, 0.14]],
          [0.93, [-0.5, 0.64, 0.1]],
          [1, WRIST_R],
        ] as const,
        'spline',
      );
    k.animation('attack', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const wrist = wristRAt(p);
        const dir = clubAt(p);
        const arm = reach(ARM_R, wrist, keys(p, [[0, POLE_R], [0.4, [-0.7, -0.5, -0.3]], [0.58, [-0.5, -0.8, 0.0]], [1, POLE_R]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], CLUB, { dir, up: keys(p, [[0, CLUB.up], [0.14, [-1, 0, 0]], [0.8, [-1, 0, 0]], [1, CLUB.up]] as const, 'smooth') });
        // The left hand takes the handle behind the right fist for the slam.
        const grab = keys(p, [[0, 0], [0.4, 0], [0.5, 1], [0.8, 1], [0.92, 0]] as const);
        const onHandle = add(wrist, mul(dir, -0.15));
        const leftRest = keys(p, [[0, WRIST], [0.3, [0.12, 0.42, 0.24]], [0.45, [0.14, 0.42, 0.24]], [1, WRIST]] as const, 'smooth');
        const leftWrist = add(mul(leftRest, 1 - grab), mul(add(onHandle, [0, 0.02, 0]), grab));
        const off = reach(ARM_L, leftWrist, keys(p, [[0, POLE_L], [0.4, [0.7, -0.5, -0.4]], [1, POLE_L]] as const, 'smooth'));
        const handL = orient([off.upper, off.lower], HAND_DOWN, {
          dir: norm(add(mul(HAND_DOWN.dir, 1 - grab), mul(dir, -grab))),
          up: HAND_DOWN.up,
        });
        const sh = shake(p, 0.58, 0.16, 5);
        const lean = keys(p, [[0, 0], [0.32, -10], [0.44, -12], [0.58, 6], [0.78, 5], [1, 0]] as const);
        const spineX = lean * 0.5;
        const chestX = lean * 0.5 + 3 * sh;
        const hipsY = keys(p, [[0, 0], [0.36, -6], [0.44, -6], [0.58, 4], [0.78, 3], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.36, -14], [0.44, -14], [0.58, 6], [0.78, 5], [1, 0]] as const);
        const hipsZ = keys(p, [[0, 0], [0.4, -0.02], [0.44, -0.02], [0.56, 0.03], [0.78, 0.03], [1, 0]] as const);
        const stepL = keys(p, [[0, 0], [0.4, -6], [0.44, -6], [0.55, -20], [0.78, -18], [1, 0]] as const);
        const legR = deg(Math.atan2(hipsZ, 0.19));
        const legL = stepL + legR;
        const drop = keys(p, [[0, 0], [0.4, 0.004], [0.58, 0.02], [0.78, 0.016], [1, 0]] as const);
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, legL), legDrop(LEG, legR)) - drop - 0.004 * sh, hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, chestY, 0] },
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, -(chestY + hipsY) * 0.7, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: off.upper },
          'forearm.L': { rotate: off.lower },
          'hand.L': { rotate: handL },
          'leg.L': { rotate: [legL, -hipsY, 0] },
          'leg.R': { rotate: [legR, -hipsY, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a wide side sweep at waist height
    // The troll coils to the right with the club behind the hip, then unwinds: the club sweeps out to
    // the right side and across the front, low, and the troll steps in with the left foot.
    const swipeDir = (p: number) =>
      norm(
        keys(
          p,
          [
            [0, CLUB.dir],
            [0.16, [-0.5, 0.3, -0.8]],
            [0.44, [-0.55, 0.15, -0.82]], // behind the right hip
            [0.53, [-0.97, -0.1, -0.1]], // out to the right side
            [0.6, [-0.3, -0.16, 0.94]], // across the front
            [0.68, [0.55, -0.16, 0.82]], // through to the left
            [0.76, [0.6, -0.15, 0.78]],
            [0.86, [-0.6, 0.3, 0.3]],
            [0.93, [-0.3, 0.65, -0.3]],
            [1, CLUB.dir],
          ] as const,
          'spline',
        ),
      );
    const swipeWrist = (p: number) =>
      keys(
        p,
        [
          [0, WRIST_R],
          [0.16, [-0.42, 0.6, -0.08]],
          [0.44, [-0.42, 0.56, -0.1]],
          [0.53, [-0.46, 0.5, 0.02]],
          [0.6, [-0.3, 0.5, 0.26]],
          [0.68, [-0.14, 0.5, 0.32]],
          [0.76, [-0.12, 0.5, 0.32]],
          [0.86, [-0.5, 0.56, 0.18]],
          [0.93, [-0.5, 0.64, 0.1]],
          [1, WRIST_R],
        ] as const,
        'spline',
      );
    k.animation('attack2', {
      duration: 1.15,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.66, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.16, -10], [0.44, -14], [0.62, 12], [0.76, 14], [1, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.16, -10], [0.44, -14], [0.62, 12], [0.76, 14], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.16, -14], [0.44, -22], [0.62, 20], [0.76, 24], [1, 0]] as const);
        const turn = hipsY + spineY + chestY;
        const lean = keys(p, [[0, 0], [0.44, -2], [0.62, 10], [0.76, 8], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.36, 0], [0.56, 0.14], [0.76, 0.14], [0.96, 0]] as const);
        const hipsZ = stepZ * 0.5;
        const hipYr = hipsY * DEG;
        // The left foot steps out; the right foot stays planted (each leg swings to keep its ankle put).
        const legL = deg(Math.asin(Math.max(-0.9, Math.min(0.9, (hipsZ - stepZ - HIP[0] * Math.sin(hipYr)) / 0.175))));
        const legR = deg(Math.asin(Math.max(-0.9, Math.min(0.9, (hipsZ + HIP[0] * Math.sin(hipYr)) / 0.175))));
        const liftL = 0.03 * Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.4) / 0.2))) + 0.03 * Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.78) / 0.18)));
        const dropL = 0.175 * (1 - Math.cos(legL * DEG));
        const dropR = 0.175 * (1 - Math.cos(legR * DEG));
        const dir = swipeDir(p);
        const wrist = swipeWrist(p);
        const arm = reach(ARM_R, wrist, keys(p, [[0, POLE_R], [0.44, [-0.6, -0.5, -0.5]], [0.6, [-0.5, -0.8, 0]], [1, POLE_R]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], CLUB, { dir, up: keys(p, [[0, CLUB.up], [0.16, [0, 1, 0]], [0.8, [0, 1, 0]], [1, CLUB.up]] as const, 'smooth') });
        const off = reach(ARM_L, keys(p, [[0, WRIST], [0.3, [0.2, 0.44, 0.22]], [0.55, [0.28, 0.4, -0.05]], [0.68, [0.4, 0.45, 0.1]], [1, WRIST]] as const), POLE_L);
        return {
          hips: { move: [0, -Math.min(dropL + liftL * 0, dropR), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, spineY, 0] },
          chest: { rotate: [3 * sh, chestY, 0] },
          head: { rotate: [-2 * sh, -turn * 0.7, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: off.upper },
          'forearm.L': { rotate: off.lower },
          'leg.L': { rotate: [legL, -hipsY, 0], move: [0, liftL, 0] },
          'leg.R': { rotate: [legR, -hipsY, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: the club up, the left fist beating the chest
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        const wristR = keys(p, [[0, WRIST_R], [0.16, [-0.5, 0.62, 0.08]], [0.3, [-0.5, 0.82, 0.02]], [0.8, [-0.5, 0.82, 0.02]], [1, WRIST_R]] as const, 'smooth');
        const arm = reach(ARM_R, wristR, POLE_R);
        const dirR = norm(keys(p, [[0, CLUB.dir], [0.3, [0.15, 0.8, -0.58]], [0.8, [0.15, 0.8, -0.58]], [1, CLUB.dir]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], CLUB, { dir: dirR, up: CLUB.up });
        const fist = reach(ARM_L, keys(p, [[0, WRIST], [0.16, [0.3, 0.3, 0.12]], [0.3, [0.42, 0.72, 0.1]], [0.8, [0.42, 0.72, 0.1]], [1, WRIST]] as const, 'smooth'), POLE_L);
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.04 * lift, 1, 1 + 0.03 * lift] },
          neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: fist.upper },
          'forearm.L': { rotate: fist.lower },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, 0.19));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-10 * r, -3 * r, 0] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [2 * r, 0, 8 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.006], [0.66, -0.05], [0.72, -0.038], [0.8, -0.05], [1, -0.05]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 4], [0.4, -6], [0.58, 10], [0.7, 20], [1, 20]] as const), 0, keys(p, [[0, 0], [0.2, 0], [0.4, 10], [0.58, 60], [0.7, 70], [1, 70]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'hand.R': { rotate: [keys(p, [[0, 0], [0.5, 0], [0.62, 100], [1, 100]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
