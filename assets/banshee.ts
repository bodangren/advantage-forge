import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Banshee — Chibi Quest dungeon denizen (catalog `enemies/undead/banshee`), a wailing floating
 * ghost woman about 1.1 m tall from the hem wisps to the hair tips, faces +Z.
 * Target: docs/enemy-mockups/banshee_001.jpg (two arms, not the mockup's four).
 *
 * Role: a shrieking dungeon enemy seen in 3D and as a 128 px sprite; the streaming white hair, the
 *   glowing cyan eyes in dark sockets, and the open screaming mouth must read.
 * One idea: a gaunt grey-green face frozen in a scream inside a fan of long white hair, on a
 *   ragged gown that trails into curling mist wisps.
 * Proportions: head 0.67 to 0.91 (0.2 x 0.24 x 0.2), collar 0.62, gown hem 0.15, wisps down to
 *   y = 0, hair tips to 1.1, hands beside the head at 0.79.
 * Shape language: triangular and spiky (claws, hair tips, ragged hem, curling wisps) over a
 *   gaunt, soft gown.
 * Palette (60/30/10): grey-green #8fa39a skin and gown, shade #6b7f76; white hair #efeae0;
 *   cyan #4ff0ff eyes in #103030 sockets, dark red #5a1a22 throat, as the accent.
 * Bodies: banshee (head, neck, collar, gown, arms, claws), hair, sockets, throat, eyes, streaks,
 *   wisps (translucent).
 * Rig: root, body, head, jaw, arm.L/R, forearm.L/R, four wisp bones. The lower gown rides the
 *   root so the hem lags the sway. Clips: idle, walk, attack (scream lunge), hit, death, taunt.
 */

const C = {
  skin: '#8fa39a',
  shade: '#6b7f76',
  hair: '#efeae0',
  glow: '#4ff0ff',
  socket: '#103030',
  throat: '#5a1a22',
  wisp: '#b8cfc6',
  wispTip: '#7fe8ff',
};

type V3 = readonly [number, number, number];
type P4 = [number, number, number, number];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Joints.
const ROOT_AT: V3 = [0, 0.25, 0];
const BODY_AT: V3 = [0, 0.5, 0];
const HEAD_AT: V3 = [0, 0.69, 0];
const JAW_AT: V3 = [0, 0.78, -0.01];
const SHOULDER: V3 = [0.095, 0.6, 0];
const ELBOW: V3 = [0.24, 0.56, 0.03];
const HAND: V3 = [0.34, 0.8, 0.1];

// Mist wisps: [x, y, z, radius] from inside the hem out, down to the floor, and curling up.
const WISPS: P4[][] = [
  [[0.16, 0.2, 0.05, 0.06], [0.28, 0.11, 0.14, 0.055], [0.37, 0.032, 0.26, 0.048], [0.42, 0.07, 0.39, 0.04], [0.36, 0.18, 0.47, 0.032], [0.27, 0.28, 0.5, 0.026], [0.19, 0.34, 0.46, 0.02]],
  [[-0.15, 0.2, 0.0, 0.06], [-0.28, 0.12, -0.05, 0.055], [-0.4, 0.06, -0.13, 0.048], [-0.5, 0.1, -0.23, 0.04], [-0.5, 0.2, -0.32, 0.032], [-0.44, 0.3, -0.36, 0.026], [-0.37, 0.35, -0.34, 0.02]],
  [[0.03, 0.19, 0.17, 0.06], [0.06, 0.1, 0.3, 0.055], [0.0, 0.03, 0.42, 0.048], [-0.12, 0.05, 0.5, 0.04], [-0.22, 0.16, 0.5, 0.032], [-0.26, 0.27, 0.44, 0.026], [-0.22, 0.33, 0.38, 0.02]],
  [[-0.04, 0.2, -0.16, 0.06], [-0.01, 0.12, -0.3, 0.055], [0.1, 0.06, -0.4, 0.048], [0.24, 0.1, -0.45, 0.04], [0.32, 0.19, -0.4, 0.032], [0.32, 0.29, -0.32, 0.026], [0.27, 0.35, -0.28, 0.02]],
];

/** Catmull-Rom resample: two extra points per segment, so the ribbons bend smoothly. */
const smoothPts = (w: P4[]): P4[] => {
  const out: P4[] = [];
  for (let i = 0; i < w.length - 1; i++) {
    const p0 = w[Math.max(0, i - 1)]!, p1 = w[i]!, p2 = w[i + 1]!, p3 = w[Math.min(w.length - 1, i + 2)]!;
    for (const t of [0, 1 / 3, 2 / 3]) {
      const q = [0, 1, 2, 3].map((c) => {
        const a = p0[c]!, b = p1[c]!, cc = p2[c]!, d = p3[c]!;
        return 0.5 * (2 * b + (cc - a) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (3 * b - a - 3 * cc + d) * t * t * t);
      });
      out.push(q as P4);
    }
  }
  out.push(w[w.length - 1]!);
  return out;
};

export default defineAsset({
  name: 'banshee',
  description: 'Chibi banshee dungeon enemy: a gaunt grey-green screaming ghost woman with glowing cyan eyes, an open mouth, long streaming white hair, raised clawed hands, and a ragged gown trailing into mist wisps.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/banshee_001.jpg',
  variants: {
    glow: { cyan: C.glow, green: '#6fff8a', violet: '#c07fff' },
    gown: { grey: C.skin, blue: '#9fb4c8', bone: '#d8d0c0' },
    hair: { white: C.hair, black: '#202028', red: '#8a3a2e' },
  },
  presets: {
    fen: { glow: 'green', gown: 'blue', hair: 'black' },
    crypt: { glow: 'violet', gown: 'bone', hair: 'red' },
    frost: { glow: 'cyan', gown: 'blue', hair: 'white' },
  },

  build(k) {
    const T = {
      skin: k.tint('gown'),
      shade: k.tint('gown', { color: C.shade, follow: 1 }),
      wisp: k.tint('gown', { color: C.wisp, follow: 1 }),
      hair: k.tint('hair'),
      hairShade: k.tint('hair', { color: '#d8d2c4', follow: 1 }),
      glow: k.tint('glow'),
      wispTip: k.tint('glow', { color: C.wispTip, follow: 1 }),
      inner: k.tint('glow', { color: '#3ad0e0', follow: 1 }),
    };
    const wispBones = WISPS.map((_, i) => `wisp${i + 1}`);
    const skel: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
      root: { at: ROOT_AT },
      body: { parent: 'root', at: BODY_AT },
      head: { parent: 'body', at: HEAD_AT, tail: [0, 1.15, 0] },
      jaw: { parent: 'head', at: JAW_AT, tail: [0, 0.61, 0.06] },
      'arm.L': { parent: 'body', at: SHOULDER, tail: ELBOW },
      'arm.R': { parent: 'body', at: mx(SHOULDER), tail: mx(ELBOW) },
      'forearm.L': { parent: 'arm.L', at: ELBOW, tail: HAND },
      'forearm.R': { parent: 'arm.R', at: mx(ELBOW), tail: mx(HAND) },
    };
    WISPS.forEach((w, i) => {
      const a = w[0]!;
      const t = w[w.length - 1]!;
      skel[wispBones[i]!] = { parent: 'root', at: [a[0], a[1], a[2]], tail: [t[0], t[1], t[2]] };
    });
    k.skeleton(skel);

    // ------------------------------------------------------------------ head
    // A big chibi skull with sunken cheeks and a pointed chin.
    const D2R = Math.PI / 180;
    const HC: V3 = [0, 0.8, 0];
    const HR: V3 = [0.115, 0.146, 0.115];
    const skull = sdf.ellipsoid(HR).at(...HC);
    const chin = sdf.ellipsoid([0.045, 0.1, 0.05]).rotateX(-12).at(0, 0.7, 0.055).bone('jaw');
    const nose = sdf.ellipsoid([0.015, 0.032, 0.022]).rotateX(-15).at(0, 0.775, 0.11);
    const cheeks = sdf.ellipsoid([0.035, 0.05, 0.06]).at(0.09, 0.735, 0.075).mirror('x', 0);
    const headRaw = sdf
      .smoothUnion(0.04, skull.bone('head'), chin, nose.bone('head'))
      .smoothSubtract(0.03, cheeks)
      .smoothSubtract(0.02, sdf.sphere(0.04).at(0.078, 0.745, 0.075).mirror('x', 0));
    const surf = (x: number, y: number): V3 => sdf.raycast(headRaw, [x, y, 1], [0, 0, -1])!;

    // Sockets: deep slanted hollows (outer end up, inner end low: a glare); dark glass follows the
    // head 2 cm inside, and a narrow glowing oval sits in each.
    const SLANT = 15;
    const socketHollow = sdf.ellipsoid([0.05, 0.03, 0.055]).rotateZ(SLANT);
    const EYE_X = 0.052;
    const EYE_Y = 0.832;
    const hollows = socketHollow.at(EYE_X, EYE_Y, surf(EYE_X, EYE_Y)[2] + 0.006).mirror('x', 0);
    const head = headRaw.smoothSubtract(0.006, hollows);
    // Mouth: a big open scream, 0.06 wide and 0.09 tall; the throat body fills it 2 cm inside.
    const MOUTH_Y = 0.702;
    const mouthZ = surf(0, MOUTH_Y)[2];
    const mouthHole = sdf.ellipsoid([0.04, 0.045, 0.06]).at(0, MOUTH_Y, mouthZ + 0.012);
    const headCarved = head.smoothSubtract(0.006, mouthHole);
    const inner = headRaw.round(-0.02);
    const sockets = inner.intersect(hollows.round(0.004)).bone('head');
    const throat = inner.intersect(mouthHole.round(0.004)).bone('head');
    const throatDark = sdf
      .ellipsoid([0.03, 0.038, 0.02])
      .at(0, MOUTH_Y - 0.004, mouthZ - 0.028)
      .intersect(mouthHole)
      .bone('head');
    const eyeP = surf(EYE_X, EYE_Y);
    const eyes = sdf
      .ellipsoid([0.0437, 0.0219, 0.012])
      .rotateZ(SLANT)
      .at(eyeP[0], eyeP[1], eyeP[2] - 0.013)
      .mirror('x', 0)
      .bone('head');
    // A row of small pointed teeth along the upper edge of the mouth.
    const teeth = sdf
      .union(
        ...[-3, -2, -1, 0, 1, 2, 3].map((i) => {
          const x = i * 0.0095;
          const top = MOUTH_Y + 0.045 * Math.sqrt(1 - (x / 0.04) ** 2) - 0.002;
          return sdf.cone([x, top, mouthZ - 0.01], [x, top - 0.024 + Math.abs(i) * 0.003, mouthZ - 0.006], 0.0055, 0.0008);
        }),
      )
      .smoothUnion(
        0.004,
        sdf.box([0.05, 0.008, 0.012], 0.003).at(0, MOUTH_Y + 0.045 - 0.005, mouthZ - 0.006),
      )
      .bone('head');
    const neck = sdf.capsule([0, 0.7, 0], [0, 0.58, 0], 0.05).bone('head');
    // Head scale: face, eyes, mouth, teeth, and hair are built at the old size, then scaled about
    // the chin (y 0.62) so the head reads bigger on the body.
    const HS = 1.25;
    const HPIV = 0.62;
    const headScale = (sh: sdf.Shape) => sh.at(0, -HPIV, 0).scale(HS).at(0, HPIV, 0);

    // ------------------------------------------------------------------ gown
    // Profile (radius, height): r 0.09 at the neck (0.66), 0.13 chest (0.55), 0.17 waist (0.42),
    // then a flare to r 0.32 at the hem (0.12).
    const bellHalf: [number, number][] = [
      [0.06, 0.68],
      [0.09, 0.66],
      [0.11, 0.6],
      [0.13, 0.55],
      [0.15, 0.48],
      [0.17, 0.42],
      [0.2, 0.34],
      [0.25, 0.24],
      [0.3, 0.16],
      [0.32, 0.12],
    ];
    const bell = [[0, 0.69], ...bellHalf, [0, 0.11], ...bellHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    // Deep vertical folds; calmer near the neck.
    const drape = (x: number, y: number, z: number) =>
      2.4 * noise.fbm(x * 5, y * 2, z * 5, 2) * (0.3 + 0.7 * smooth01(0.6, 0.35, y)) +
      // Four deep vertical folds from the collar to the hem.
      0.9 * Math.cos(4 * Math.atan2(x, z) + 0.6 + 0.6 * noise.fbm(x * 4, y * 3, z * 4, 2)) * (0.35 + 0.65 * smooth01(0.66, 0.5, y));
    // Ragged hem: eight wedges of different depths cut up from the bottom edge.
    const wedge = (az: number, w: number, h: number) =>
      sdf
        .extrude(profile.polygon([[-w, 0], [w, 0], [0, h]]), 0.22)
        .at(0, 0.09, 0.3)
        .rotateY(az);
    const gownBase = sdf
      .revolve(profile.polygon(bell, { smooth: true }))
      .displace(0.03, drape, 3.8)
      .smoothSubtract(
        0.006,
        wedge(10, 0.05, 0.14),
        wedge(55, 0.04, 0.07),
        wedge(100, 0.055, 0.16),
        wedge(142, 0.045, 0.09),
        wedge(187, 0.05, 0.13),
        wedge(228, 0.04, 0.06),
        wedge(272, 0.055, 0.15),
        wedge(318, 0.045, 0.1),
      );
    const SPLIT = 0.34;
    const gownUpper = gownBase.intersect(sdf.box([0.8, 0.5, 0.8]).at(0, SPLIT + 0.25, 0)).bone('body');
    const gownLower = gownBase.intersect(sdf.box([0.8, 0.4, 0.8]).at(0, SPLIT - 0.2, 0)).bone('root');
    const gown = sdf.union(gownUpper, gownLower);
    const gownSurf = (x: number, y: number): V3 => sdf.raycast(gownBase, [x, y, 1], [0, 0, -1])!;

    // Wrapped collar: three stacked rings with a wrinkled surface.
    const ring = (y: number, R: number, r: number, dz: number) =>
      sdf.torus(R, r).at(0, y, dz).displace(0.01, (x, yy, z) => noise.fbm(x * 14, yy * 14, z * 14, 2), 2);
    const collar = sdf
      .smoothUnion(0.006, ring(0.555, 0.126, 0.036, 0.004), ring(0.6, 0.108, 0.034, 0.008), ring(0.645, 0.09, 0.032, 0.012))
      .bone('body');

    // ------------------------------------------------------------------ arms
    const d = norm(sub(HAND, ELBOW));
    const s = norm(cross(d, [0, 0, 1]));
    const fingerLen = [0.05, 0.068, 0.078, 0.07, 0.058]; // thumb (inner) to little finger; x1.3 below
    const fingers: sdf.Shape[] = [];
    for (let j = -2; j <= 2; j++) {
      const a = j * 0.34;
      const dir = norm(addv([d[0] * Math.cos(a), d[1] * Math.cos(a), d[2] * Math.cos(a)], s, Math.sin(a)));
      const L = fingerLen[j + 2]! * 1.3;
      const p0 = addv(addv(HAND, s, j * 0.012), d, 0.012);
      const fwd: V3 = [0, 0, 1];
      const p1 = addv(addv(p0, dir, L * 0.4), fwd, 0.004);
      const p2 = addv(addv(p1, dir, L * 0.35), fwd, 0.014);
      const p3 = addv(addv(p2, dir, L * 0.3), fwd, 0.028);
      fingers.push(
        sdf.chain([[...p0, 0.0095], [...p1, 0.008], [...p2, 0.0058], [...p3, 0.0033]] as P4[], 0.006).bone('forearm.L'),
      );
    }
    const arm = sdf
      .smoothUnion(
        0.014,
        sdf.cone(SHOULDER, ELBOW, 0.027, 0.02).bone('arm.L'),
        sdf.sphere(0.034).at(...SHOULDER).bone('arm.L'),
        sdf.sphere(0.022).at(...ELBOW).bone('arm.L'),
        sdf.cone(ELBOW, HAND, 0.02, 0.012).bone('forearm.L'),
        sdf.ellipsoid([0.024, 0.028, 0.013]).rotateZ(-18).at(...addv(HAND, d, 0.004)).bone('forearm.L'),
        ...fingers,
      );

    // ------------------------------------------------------------------ hair
    // Two layers: a thin cap 1.06x the skull that covers the back of the head, and 26 thin wavy
    // locks (four points, r 0.018 to 0.006) that start inside the cap and sweep up and back in a fan.
    const cap = sdf
      .ellipsoid([HR[0] * 1.06, HR[1] * 1.06, HR[2] * 1.06])
      .at(0, HC[1] + 0.004, -0.014)
      .intersect(sdf.box([0.4, 0.34, 0.4]).at(0, 0.885, 0))
      .smoothSubtract(0.02, sdf.ellipsoid([0.16, 0.19, 0.135]).at(0, HC[1] - 0.03, 0.118));
    const NL = 30;
    const lockShape = (i: number) => {
      const jit = noise.random(i, 3, 7);
      const jit2 = noise.random(i, 9, 2);
      // Root on the back and top of the skull (golden-angle spread), inside the cap.
      const cosPol = 0.93 - 1.0 * ((i + 0.5) / NL);
      const pol = Math.acos(cosPol);
      const az = (((i * 0.618) % 1) * 2 - 1) * 100 * D2R; // 0 = straight back
      const nrm: V3 = [Math.sin(pol) * Math.sin(az), cosPol, -Math.sin(pol) * Math.cos(az)];
      const root: V3 = [HC[0] + HR[0] * 0.9 * nrm[0], HC[1] + HR[1] * 0.9 * nrm[1], HC[2] + HR[2] * 0.9 * nrm[2]];
      const back = (35 + 20 * jit2) * D2R; // tilt back 35 to 55 degrees
      const droop = 0.9 * Math.max(0, 0.35 - cosPol); // low side locks drape past the shoulders
      const g: V3 = [0, Math.cos(back) - droop, -Math.sin(back)];
      const dir = norm([g[0] + nrm[0] * 1.3, g[1] + nrm[1] * 0.3, g[2] + nrm[2] * 0.35]);
      const len = 0.25 + 0.2 * (0.75 * jit + 0.25 * Math.max(0, cosPol)); // ragged outline, 0.25 to 0.45
      const side = norm(cross(dir, [0.5, 0.3, 0.8]));
      const sg = Math.sin(az * 2.5 + 0.3) > 0 ? 1 : -1; // neighbors wave together, so strands run in parallel
      const pts: P4[] = [0, 1, 2, 3].map((j) => {
        const t = j / 3;
        const wave = j === 1 ? 0.028 * sg : j === 2 ? -0.028 * sg : 0;
        const q = addv(addv(root, dir, len * Math.min(t, 2 / 3)), side, wave);
        // The last point hooks 60 degrees sideways off the lock's heading.
        if (j === 3) {
          const hk = addv(addv(root, dir, len * (2 / 3)), side, -0.028 * sg);
          const step = len / 5;
          const hx = addv(addv(hk, dir, step * Math.cos(Math.PI / 3)), side, step * Math.sin(Math.PI / 3) * sg);
          return [hx[0], hx[1], hx[2], 0.004] as P4;
        }
        return [q[0], q[1], q[2], j === 2 ? 0.008 : 0.018 - 0.01 * t] as P4;
      });
      // Catmull-Rom through the four points: one smooth S with no kinks (seven points).
      const sm: P4[] = [];
      for (let j = 0; j < 3; j++) {
        const p0 = pts[Math.max(0, j - 1)]!, p1 = pts[j]!, p2 = pts[j + 1]!, p3 = pts[Math.min(3, j + 2)]!;
        for (const t of [0, 0.25, 0.5, 0.75]) {
          sm.push([0, 1, 2, 3].map((c) => 0.5 * (2 * p1[c]! + (p2[c]! - p0[c]!) * t + (2 * p0[c]! - 5 * p1[c]! + 4 * p2[c]! - p3[c]!) * t * t + (3 * p1[c]! - p0[c]! - 3 * p2[c]! + p3[c]!) * t * t * t)) as P4);
        }
      }
      sm.push(pts[3]!);
      return sdf.chain(sm, 0.012);
    };
    const locks = sdf.smoothUnion(0.015, ...Array.from({ length: NL }, (_, i) => lockShape(i)));
    const hairAll = sdf.smoothUnion(0.02, cap.displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 20, z * 30, 2), 2.4), locks);
    const hair = headScale(
      hairAll
        .paintFn((x, y, z) => {
          // Shade sits in the crevices: where the noise dips, and low near the scalp.
          const n = noise.fbm(x * 26, y * 10, z * 26, 2);
          const t = Math.max(0, Math.min(1, -n * 3.2 + 0.15 + 0.3 * smooth01(0.98, 0.84, y)));
          return mixRgb(rgb(T.hair), rgb(T.hairShade), t);
        })
        .bone('head'),
    );


    // ------------------------------------------------------------------ wisps, streaks
    // Flat twisting ribbons: each path is cut into four short segments; a segment is built in its
    // own frame (path along +Z), flattened to 0.3 in Y, twisted 25 degrees more than the last one
    // about its own axis, then moved back. An inner cyan ribbon follows inside the gown-colored one.
    const FLAT = 0.15;
    const cuts = [0, 5, 9, 14, 18];
    const ribbon = (path: P4[], bone: string, wide: number, thick: number) => {
      const segs: sdf.Shape[] = [];
      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const pts = path.slice(cuts[sIdx], cuts[sIdx + 1]! + 1);
        const a = pts[0]!;
        const e = pts[pts.length - 1]!;
        const d = norm([e[0] - a[0], e[1] - a[1], e[2] - a[2]]);
        const yaw = Math.atan2(d[0], d[2]);
        const pitch = Math.asin(d[1]);
        const local = pts.map(([x, y, z, r]) => {
          let vx = x - a[0], vy = y - a[1], vz = z - a[2];
          // Inverse of Ry(yaw) after Rx(-pitch): Ry(-yaw), then Rx(pitch).
          [vx, vz] = [vx * Math.cos(yaw) - vz * Math.sin(yaw), vx * Math.sin(yaw) + vz * Math.cos(yaw)];
          [vy, vz] = [vy * Math.cos(pitch) - vz * Math.sin(pitch), vy * Math.sin(pitch) + vz * Math.cos(pitch)];
          return [vx / wide, vy / (FLAT * thick), vz, r] as P4;
        });
        segs.push(
          sdf
            .chain(local, 0.004)
            .scale([wide, FLAT * thick, 1])
            .rotateZ(25 * sIdx)
            .rotateX(-pitch / D2R)
            .rotateY(yaw / D2R)
            .at(a[0], a[1], a[2]),
        );
      }
      return sdf.smoothUnion(0.012, ...segs).bone(bone);
    };
    // Gentle S in the sweep: a sideways offset (horizontal, so the floor contact stays) that swings both ways.
    const sway = (w: P4[]): P4[] =>
      w.map((q, n) => {
        const a = w[Math.max(0, n - 1)]!, b = w[Math.min(w.length - 1, n + 1)]!;
        const nn = norm(cross(norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), [0, 1, 0]));
        const o = 0.03 * Math.sin((n / (w.length - 1)) * Math.PI * 2) * Math.min(1, n / 3);
        return [q[0] + nn[0] * o, q[1], q[2] + nn[2] * o, q[3]] as P4;
      });
    const paths = WISPS.map((w) => sway(smoothPts(w)));
        const wispOuter = sdf.smoothUnion(0.02, ...paths.map((w, i) => ribbon(w, wispBones[i]!, 1.2, 1)));
    const wispInner = sdf.smoothUnion(0.02, ...paths.map((w, i) => ribbon(w, wispBones[i]!, 0.36, 0.7)));
    const wispTips = WISPS.map((w) => {
      const t = w[w.length - 1]!;
      const m = w[w.length - 4]!;
      return sdf.capsule([m[0], m[1], m[2]], [t[0], t[1], t[2]], 0.06);
    });
    const wispPainted = wispTips.reduce<sdf.Shape>((acc, t) => acc.paintWhere(t, T.wispTip, 0.1), wispOuter);


    const streakSpots: [number, number][] = [[0.05, 0.44], [-0.06, 0.37], [0.11, 0.29], [-0.14, 0.24], [0.02, 0.2]];
    const streaks = sdf.smoothUnion(
      0.002,
      ...streakSpots.map(([x, y]) => {
        const p = gownSurf(x, y);
        return sdf.ellipsoid([0.005, 0.032, 0.008]).at(p[0], p[1], p[2] - 0.001).bone(y > SPLIT ? 'body' : 'root');
      }),
    );

    // ------------------------------------------------------------------ bodies
    const banshee = sdf
      .smoothUnion(0.02, headScale(headCarved), neck)
      .smoothUnion(0.03, gown)
      .smoothUnion(0.008, collar)
      .smoothUnion(0.022, arm.mirror('x'))
      .paintWhere(sdf.box([1, 0.16, 1]).at(0, 0.1, 0), T.shade, 0.1)
      .paintWhere(sdf.ellipsoid([0.03, 0.02, 0.07]).at(0, 0.58, 0.09), T.shade, 0.02);
    k.body('banshee', banshee, { color: T.skin, roughness: 0.8, textureDensity: 1.6, detail: 0.005, maxError: 0.0025 });
    k.body('hair', hair, {
      color: T.hair,
      roughness: 0.7,
      detail: 0.005,
      maxTriangles: 20000,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30 + z * 30, y * 4, z * 30 - x * 30, 2),
    });
    k.body('sockets', headScale(sockets).paint(C.socket), { color: C.socket, roughness: 0.3, detail: 0.004 });
    k.body('throat', headScale(throat), { color: C.throat, roughness: 0.4, detail: 0.004 });
    k.body('throatdark', headScale(throatDark), { color: '#0a1a20', roughness: 0.5, detail: 0.004 });
    k.body('teeth', headScale(teeth), { color: '#e8e0c8', roughness: 0.5, detail: 0.003 });
    k.body('eyes', headScale(eyes), { color: T.glow, roughness: 0.3, emissive: T.glow, emissiveIntensity: 1.8, detail: 0.003 });
    k.body('streaks', streaks, { color: T.glow, roughness: 0.4, emissive: T.glow, emissiveIntensity: 1.2, detail: 0.003 });
    k.body('wisps', wispPainted, {
      color: T.wisp,
      roughness: 0.7,
      opacity: 0.7,
      emissive: T.wispTip,
      emissiveIntensity: 0.25,
      detail: 0.004,
      maxTriangles: 6000,
    });
    k.body('wispglow', wispInner, {
      color: '#106070',
      roughness: 0.4,
      emissive: T.inner,
      emissiveIntensity: 1.3,
      detail: 0.003,
      maxTriangles: 3200,
    });

    // ------------------------------------------------------------------ animation
    const { wave, keys } = motion;
    type BP = { rotate?: V3; move?: V3; scale?: V3 };
    type Pose = Record<string, BP>;
    const addV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : (a ?? b);
    const mulV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] * b[0], a[1] * b[1], a[2] * b[2]] : (a ?? b);
    /** The sum of two poses: rotations and moves add, scales multiply. */
    const add = (a: Pose, b: Pose): Pose => {
      const out: Pose = { ...a };
      for (const [bone, p] of Object.entries(b)) {
        const q = out[bone] ?? {};
        const rotate = addV(q.rotate, p.rotate);
        const move = addV(q.move, p.move);
        const scale = mulV(q.scale, p.scale);
        out[bone] = { ...(rotate && { rotate }), ...(move && { move }), ...(scale && { scale }) };
      }
      return out;
    };
    /** The four wisps sway in turns; `a` scales the swing, `bias` leans them (streaming back). */
    const wispPose = (p: number, a = 1, bias = 0): Pose => ({
      wisp1: { rotate: [bias + 6 * a * wave(p, 1, 0.1), 16 * a * wave(p, 1, 0.2), 0] },
      wisp2: { rotate: [bias + 6 * a * wave(p, 1, 0.35), 16 * a * wave(p, 1, 0.45), 0] },
      wisp3: { rotate: [bias + 6 * a * wave(p, 1, 0.6), 16 * a * wave(p, 1, 0.7), 0] },
      wisp4: { rotate: [bias + 6 * a * wave(p, 1, 0.85), 16 * a * wave(p, 1, 0.95), 0] },
    });
    /** Idle: a slow hover bob, a sway, arms and claws drifting, wisps curling. */
    const idle = (p: number): Pose =>
      add(
        {
          root: { move: [0, 0.045 + 0.018 * wave(p, 1, 0.25), 0], rotate: [2 * wave(p, 1, 0.5), 0, 3 * wave(p, 1)] },
          body: { rotate: [1.5 * wave(p, 1, 0.7), 0, -2 * wave(p, 1, 0.1)] },
          head: { rotate: [2 * wave(p, 1, 0.8), 6 * wave(p, 1, 0.15), 3 * wave(p, 1, 0.2)] },
          jaw: { rotate: [3 + 2 * wave(p, 2, 0.3), 0, 0] },
          'arm.L': { rotate: [0, 0, 6 * wave(p, 1, 0.3)] },
          'arm.R': { rotate: [0, 0, -6 * wave(p, 1, 0.35)] },
          'forearm.L': { rotate: [4 * wave(p, 1, 0.6), 0, 8 * wave(p, 1, 0.5)] },
          'forearm.R': { rotate: [4 * wave(p, 1, 0.1), 0, -8 * wave(p, 1, 0.9)] },
        },
        wispPose(p),
      );
    k.animation('idle', { duration: 1.8, pose: (_t, p) => idle(p) });

    // Walk: floating forward, leaning in, the wisps and arms streaming behind.
    k.animation('walk', {
      duration: 1.3,
      pose: (_t, p) =>
        add(
          {
            root: { move: [0, 0.07 + 0.014 * wave(p, 2, 0.25), 0], rotate: [12 + 2 * wave(p, 2), 3 * wave(p, 1, 0.1), 4 * wave(p, 1)] },
            body: { rotate: [6 + 2 * wave(p, 2, 0.2), 0, -3 * wave(p, 1, 0.2)] },
            head: { rotate: [-12 + 2 * wave(p, 2, 0.4), -4 * wave(p, 1, 0.1), 3 * wave(p, 1, 0.3)] },
            jaw: { rotate: [8 + 4 * wave(p, 2, 0.1), 0, 0] },
            'arm.L': { rotate: [0, 18 + 5 * wave(p, 2, 0.1), 4 * wave(p, 2, 0.3)] },
            'arm.R': { rotate: [0, -18 - 5 * wave(p, 2, 0.1), -4 * wave(p, 2, 0.35)] },
            'forearm.L': { rotate: [8 * wave(p, 2, 0.6), 0, 10 * wave(p, 2, 0.5)] },
            'forearm.R': { rotate: [8 * wave(p, 2, 0.1), 0, -10 * wave(p, 2, 0.9)] },
          },
          wispPose(p, 1.4, -12),
        ),
    });

    // Attack (1.0 s): rears back with the arms lifted (0 to 0.3), lunges with the jaw wide (0.3 to
    // 0.45), holds the scream (to 0.65), and drifts back. First and last frames are idle frames.
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const T3 = (list: [number, V3][]) => keys(p, list);
        const k1 = (list: [number, number][]) => keys(p, list);
        const up = k1([[0, 0], [0.26, 1], [0.65, 1], [0.92, 0], [1, 0]]);
        const scream = k1([[0, 0], [0.3, 0], [0.42, 1], [0.65, 1], [0.85, 0], [1, 0]]);
        const wide = k1([[0, 0], [0.28, 30], [0.42, 40], [0.65, 40], [0.9, 0], [1, 0]]);
        const fwd = k1([[0, 0], [0.28, 0], [0.42, 30], [0.65, 30], [0.9, 0], [1, 0]]);
        return add(idle(p), {
          root: {
            move: T3([[0, [0, 0, 0]], [0.28, [0, 0.05, -0.07]], [0.42, [0, -0.01, 0.17]], [0.65, [0, 0, 0.18]], [0.92, [0, 0.01, 0.02]], [1, [0, 0, 0]]]),
            rotate: [k1([[0, 0], [0.28, -12], [0.42, 9], [0.65, 7], [0.92, 0]]), 0, 0],
          },
          body: { rotate: [k1([[0, 0], [0.28, -6], [0.42, 5], [0.65, 4], [0.92, 0]]), 0, 0] },
          head: { rotate: [k1([[0, 0], [0.28, 10], [0.42, -16], [0.65, -14], [0.92, 0]]), 0, 0], scale: [1 + 0.05 * scream, 1 + 0.05 * scream, 1 + 0.05 * scream] },
          jaw: { rotate: [26 * scream, 0, 0] },
          'arm.L': { rotate: [0, -fwd, wide] },
          'arm.R': { rotate: [0, fwd, -wide] },
          'forearm.L': { rotate: [0, 0, -15 * scream] },
          'forearm.R': { rotate: [0, 0, 15 * scream] },
          ...Object.fromEntries(wispBones.map((b, i) => [b, { rotate: [-25 * scream, (i % 2 ? -1 : 1) * 30 * up, 0] as V3 }])),
        });
      },
    });

    // Hit (0.5 s): knocked back, squashed, arms flung, wisps whipping; then back to the hover.
    k.animation('hit', {
      duration: 0.5,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.7], [1, 0]]);
        const sq = keys(p, [[0, 0], [0.14, 1], [0.3, -0.5], [0.5, 0.2], [0.7, 0], [1, 0]]);
        const whip = (dl: number, a: number) => a * keys(p, [[0, 0], [0.12 + dl, 1], [0.32 + dl, -0.6], [0.6 + dl, 0.2], [1, 0]]);
        return add(idle(p), {
          root: { move: [0, 0.02 * h, -0.1 * h], rotate: [-11 * h, 0, 7 * h], scale: [1 + 0.09 * sq, 1 - 0.12 * sq, 1 + 0.09 * sq] },
          body: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-10 * h, 0, -8 * h] },
          jaw: { rotate: [14 * h, 0, 0] },
          'arm.L': { rotate: [0, 12 * h, 14 * h] },
          'arm.R': { rotate: [0, -12 * h, -14 * h] },
          wisp1: { rotate: [0, whip(0, 25), 0] },
          wisp2: { rotate: [0, whip(0.05, -30), 0] },
          wisp3: { rotate: [0, whip(0.1, 30), 0] },
          wisp4: { rotate: [0, whip(0.15, -25), 0] },
        });
      },
    });

    // Death (1.8 s): a jolt, then it spins and sinks, shrinking to a thin puddle at the floor (the
    // sprite framer needs it above 5 mm). The lowest point stays at the floor: the banshee scales
    // about the root (0.25 above it), so the root drops by 0.25 * (1 - sy).
    k.animation('death', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const f = smooth01(0.15, 0.9, p);
        const s = 1 - 0.75 * f;
        const sy = s * (1 - 0.92 * smooth01(0.5, 1, p));
        const jolt = keys(p, [[0, 0], [0.08, 1], [0.2, 0.3], [0.35, 0]]);
        const hover = 0.063 * (1 - smooth01(0.1, 0.5, p));
        const spin = 700 * f * f;
        return add(idle(0), {
          root: {
            move: [0, hover - 0.063 + 0.03 * jolt - ROOT_AT[1] * (1 - sy), -0.04 * jolt],
            rotate: [-12 * jolt, spin, 0],
            scale: [s, sy, s],
          },
          head: { rotate: [-22 * jolt - 12 * f, 0, 0] },
          jaw: { rotate: [30 * jolt + 10 * f, 0, 0] },
          'arm.L': { rotate: [0, 0, -10 * jolt + 30 * f] },
          'arm.R': { rotate: [0, 0, 10 * jolt - 30 * f] },
          wisp1: { rotate: [0, 40 * f, 0] },
          wisp2: { rotate: [0, 40 * f, 0] },
          wisp3: { rotate: [0, 40 * f, 0] },
          wisp4: { rotate: [0, 40 * f, 0] },
        });
      },
    });

    // Taunt (1.5 s): a wailing sway, the head thrown back, the claws waving in turns.
    k.animation('taunt', {
      duration: 1.5,
      pose: (_t, p) =>
        add(
          {
            root: { move: [0, 0.06 + 0.02 * wave(p, 2, 0.25), 0], rotate: [0, 8 * wave(p, 1, 0.25), 9 * wave(p, 1)] },
            body: { rotate: [-3, 0, -6 * wave(p, 1, 0.1)], scale: [1 + 0.03 * wave(p, 2, 0.5), 1 + 0.04 * wave(p, 2), 1 + 0.03 * wave(p, 2, 0.5)] },
            head: { rotate: [10 + 5 * wave(p, 2, 0.1), 0, -12 * wave(p, 1, 0.15)] },
            jaw: { rotate: [14 + 12 * wave(p, 2, 0.3), 0, 0] },
            'arm.L': { rotate: [0, -8 + 10 * wave(p, 2, 0.25), 12 + 14 * wave(p, 2)] },
            'arm.R': { rotate: [0, 8 - 10 * wave(p, 2, 0.75), -12 - 14 * wave(p, 2, 0.5)] },
            'forearm.L': { rotate: [12 * wave(p, 2, 0.6), 0, 14 * wave(p, 2, 0.5)] },
            'forearm.R': { rotate: [12 * wave(p, 2, 0.1), 0, -14 * wave(p, 2, 0.9)] },
          },
          wispPose(p, 1.3),
        ),
    });
  },
});
