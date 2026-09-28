import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — fishing net (props/craft-and-trade/fishing-net).
 *
 * Role: a riverside drying rack for the chibi hamlet. It must read at 128 px.
 * Size: net 1.2 m wide, rack about 1.32 m tall, on y = 0, facing +Z, centered.
 * One idea: a mint cord mesh sags in a curve between two splayed oak poles,
 *   with straw corks on the top line and two bright floats beside each pole.
 * Shape language: round (ball finials, ball feet, soft sag) over a cord grid.
 * Palette: honey oak #b5814a, warm brown #8a5a35, pale wood #c9a06a, walnut #6b4226,
 *   mint net with leaf-green shade #5cb85c, cream rope, straw corks #e0bb60.
 * Materials: wood, rope, cork. No rig.
 * Focal point: the sagging mesh and the corks on the headline.
 */

const WOOD = rgb('#b5814a');
const WOOD_MID = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WOOD_BRIGHT = rgb('#d4a15a');
const WOOD_KNOT = rgb('#6b4226');
const FINIAL = rgb('#f3d5cf');
const FINIAL_SHADE = rgb('#e4bab4');
const FOOT = rgb('#e0bb60');
const FOOT_SHADE = rgb('#c49a3a');
const MINT = rgb('#9edcc8');
const MINT_DEEP = rgb('#5cb85c');
const MINT_PALE = rgb('#c9f0e2');
const CREAM = rgb('#f4efe6');
const BURLAP = rgb('#c8a86b');
const CORK = rgb('#e0bb60');
const CORK_PALE = rgb('#f3e2a8');
const CORK_BAND = rgb('#6b4226');
const PINK = rgb('#e89098');
const PINK_SHADE = rgb('#c86b78');
const MINT_BALL = rgb('#7dcec0');
const MINT_BALL_SHADE = rgb('#4eae9e');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------------------------------------------------------------- layout
const FOOT_X = 0.4;
const FOOT_Y = 0.054;
const TOP_X = 0.78;
const TOP_Y = 1.26;
const POLE_R0 = 0.036;
const POLE_R1 = 0.027;
const FINIAL_R = 0.058;
const FOOT_R = 0.054;
const DX = TOP_X - FOOT_X;
const DY = TOP_Y - FOOT_Y;
const POLE_LEN = Math.hypot(DX, DY);
const UX = DX / POLE_LEN;
const UY = DY / POLE_LEN;
const LEAN = (Math.atan2(DX, DY) * 180) / Math.PI;
const HEAD_HALF = 0.6;
const ATTACH_T = (0.8 - FOOT_Y) / DY;

type V3 = [number, number, number];
type Pt = [number, number, number, number];

function poleAt(t: number, side: number): V3 {
  return [side * (FOOT_X + DX * t), FOOT_Y + DY * t, 0];
}

/** u = -1..1 is the 1.2 m net. |u| > 1 runs out to the pole tie. */
function headlinePoint(u: number): V3 {
  const s = Math.min(1, Math.abs(u));
  const span = 1 - s * s;
  return [u * HEAD_HALF, 0.8 - 0.22 * span, 0.04 + 0.02 * span];
}

/** u = -1..1 across, v = 0 on the headline and 1 on the hem. The hem billows toward +Z. */
function meshPoint(u: number, v: number): V3 {
  const [x0, y0, z0] = headlinePoint(u);
  const span = 1 - u * u;
  const x = x0 * (1 - v * 0.2);
  const y = y0 - v * (0.28 + 0.06 * span);
  const z = z0 + v * (0.04 + 0.16 * span);
  return [x, y, z];
}

function poleRadius(t: number): number {
  return POLE_R0 + (POLE_R1 - POLE_R0) * t;
}

// ---------------------------------------------------------------- wood
function pole(side: number): Sdf {
  const foot = poleAt(0, side);
  const top = poleAt(1, side);
  const shaft = sdf.cone(foot, top, POLE_R0, POLE_R1);
  const finial = sdf.sphere(FINIAL_R).at(top[0], top[1], top[2]);
  const ball = sdf.sphere(FOOT_R).at(foot[0], foot[1], foot[2]);
  return sdf.smoothUnion(0.016, shaft, finial, ball);
}

function woodPaint(x: number, y: number, z: number): Rgb {
  if (y < 0.115) {
    const n = noise.fbm(x * 14, y * 14, z * 14, 2);
    return mixRgb(FOOT_SHADE, FOOT, 0.4 + 0.45 * n);
  }
  if (y > 1.175) {
    const n = noise.fbm(x * 10, y * 10, z * 10, 2);
    return mixRgb(FINIAL_SHADE, FINIAL, 0.35 + 0.5 * n);
  }
  const along = y * 2.4 + Math.abs(x) * 0.35;
  const grain = noise.fbm(x * 5, along * 16, z * 5, 3);
  const streak = 0.5 + 0.5 * Math.sin(along * 42 + grain * 3);
  let c = mixRgb(WOOD_MID, WOOD, 0.22 + 0.5 * streak);
  c = mixRgb(c, WOOD_BRIGHT, 0.28);
  c = mixRgb(c, WOOD_PALE, clamp01(0.08 + 0.16 * grain));
  const knot = noise.fbm(Math.abs(x) * 22, y * 9, z * 22, 2);
  if (knot > 0.62) c = mixRgb(c, WOOD_KNOT, 0.45);
  return c;
}

// ---------------------------------------------------------------- rope
const COLS = 4;
const ROWS = 2;
const CORD_R = 0.014;

function gridPt(i: number, j: number, r = CORD_R): Pt {
  const u = -1 + (2 * i) / COLS;
  const v = j / ROWS;
  const [x, y, z] = meshPoint(u, v);
  return [x, y, z, r];
}

function addLine(out: Sdf[], pts: Pt[], k = 0.005): void {
  if (pts.length >= 2) out.push(sdf.chain(pts, k));
}

function diamondLines(): Sdf[] {
  const lines: Sdf[] = [];
  for (let d = -ROWS; d <= COLS; d++) {
    const pts: Pt[] = [];
    for (let j = 0; j <= ROWS; j++) {
      const i = j + d;
      if (i >= 0 && i <= COLS) pts.push(gridPt(i, j));
    }
    addLine(lines, pts);
  }
  for (let s = 0; s <= COLS + ROWS; s++) {
    const pts: Pt[] = [];
    for (let j = 0; j <= ROWS; j++) {
      const i = s - j;
      if (i >= 0 && i <= COLS) pts.push(gridPt(i, j));
    }
    addLine(lines, pts);
  }
  // Smooth hem under the diamond points so the bottom reads as a sag, not spikes.
  const hem: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = -1 + (2 * i) / 8;
    const [x, y, z] = meshPoint(u, 1);
    hem.push([x, y - 0.006, z, 0.013]);
  }
  addLine(lines, hem, 0.008);
  return lines;
}

function headline(): Sdf {
  const pts: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = -1.1 + (2.2 * i) / 8;
    const [x, y, z] = headlinePoint(u);
    pts.push([x, y + 0.006, z, 0.017]);
  }
  return sdf.chain(pts, 0.008);
}

function wrap(side: number): Sdf {
  const [ax, ay, az] = poleAt(ATTACH_T, side);
  const r = poleRadius(ATTACH_T) + 0.006;
  const dirX = side * UX;
  const rings = [0].map((s) =>
    sdf
      .torus(r, 0.012)
      .rotateZ(-side * LEAN)
      .at(ax + dirX * s, ay + UY * s, az + 0.004),
  );
  const knot = sdf.sphere(0.018).at(ax - side * 0.012, ay + 0.008, 0.048);
  return sdf.union(...rings, knot);
}

function hangBalls(side: number): { pink: V3; mint: V3 } {
  const [ax, ay] = poleAt(ATTACH_T - 0.015, side);
  const drop = side > 0 ? 0 : 0.02;
  return {
    pink: [ax + side * 0.1, ay - 0.095 - drop, 0.06],
    mint: [ax + side * 0.078, ay - 0.185 - drop, 0.05],
  };
}

function hanger(side: number): Sdf {
  const [ax, ay] = poleAt(ATTACH_T, side);
  const b = hangBalls(side);
  return sdf.chain(
    [
      [ax + side * 0.02, ay - 0.02, 0.036, 0.01],
      [b.pink[0] - side * 0.01, b.pink[1] + 0.03, b.pink[2] - 0.01, 0.009],
      [b.pink[0], b.pink[1], b.pink[2], 0.008],
      [b.mint[0], b.mint[1], b.mint[2], 0.008],
    ],
    0.005,
  );
}

function nearHeadline(x: number, y: number, z: number): boolean {
  const u = Math.max(-1.2, Math.min(1.2, x / HEAD_HALF));
  const [, hy, hz] = headlinePoint(u);
  const dy = y - (hy + 0.006);
  const dz = z - hz;
  return dy * dy + dz * dz < 0.026 * 0.026 && Math.abs(x) < 0.74;
}

function ropePaint(x: number, y: number, z: number): Rgb {
  if (Math.abs(x) > 0.64 || nearHeadline(x, y, z)) {
    const twist = 0.5 + 0.5 * Math.sin((x + y) * 64 + z * 36);
    return mixRgb(BURLAP, CREAM, 0.5 + 0.45 * twist);
  }
  const n = noise.fbm(x * 16, y * 12, z * 16, 2);
  let c = mixRgb(MINT_DEEP, MINT, 0.5 + 0.42 * n);
  c = mixRgb(c, MINT_PALE, clamp01(0.12 + 0.18 * n));
  const wet = clamp01((0.4 - y) / 0.16);
  return mixRgb(c, MINT_DEEP, wet * 0.42);
}

// ---------------------------------------------------------------- corks and side floats
const CORK_U = [-0.42, 0.04, 0.38];
const CORKS: V3[] = CORK_U.map((u) => {
  const [x, y, z] = headlinePoint(u);
  return [x, y + 0.038, z + 0.014];
});

const LEFT_BALLS = hangBalls(1);
const RIGHT_BALLS = hangBalls(-1);
const PINKS = [LEFT_BALLS.pink, RIGHT_BALLS.pink];
const MINTS = [LEFT_BALLS.mint, RIGHT_BALLS.mint];

function dist2(a: V3, x: number, y: number, z: number): number {
  const dx = x - a[0];
  const dy = y - a[1];
  const dz = z - a[2];
  return dx * dx + dy * dy + dz * dz;
}

function floatPaint(x: number, y: number, z: number): Rgb {
  let bestP = 1;
  for (const p of PINKS) bestP = Math.min(bestP, dist2(p, x, y, z));
  let bestM = 1;
  for (const p of MINTS) bestM = Math.min(bestM, dist2(p, x, y, z));
  if (bestP < 0.005 && bestP < bestM) {
    const n = noise.fbm(x * 14, y * 14, z * 14, 2);
    return mixRgb(PINK_SHADE, PINK, 0.32 + 0.52 * n);
  }
  if (bestM < 0.004) {
    const n = noise.fbm(x * 14, y * 14, z * 14, 2);
    return mixRgb(MINT_BALL_SHADE, MINT_BALL, 0.32 + 0.52 * n);
  }
  let nearest = CORKS[0]!;
  let best = dist2(nearest, x, y, z);
  for (const c of CORKS) {
    const d = dist2(c, x, y, z);
    if (d < best) {
      best = d;
      nearest = c;
    }
  }
  const belt = Math.abs(y - nearest[1]) < 0.009;
  const n = noise.fbm(x * 20, y * 20, z * 20, 2);
  if (belt) return mixRgb(CORK_BAND, rgb('#8a5a35'), 0.35);
  return mixRgb(CORK, CORK_PALE, 0.28 + 0.4 * n);
}

function floats(): Sdf {
  const corks = CORKS.map((p, i) =>
    sdf
      .ellipsoid([0.044 - i * 0.003, 0.032, 0.04])
      .rotateZ(i === 1 ? 16 : -8)
      .at(p[0], p[1], p[2]),
  );
  const balls = [LEFT_BALLS, RIGHT_BALLS].map((b) =>
    sdf.union(sdf.sphere(0.044).at(...b.pink), sdf.sphere(0.036).at(...b.mint)),
  );
  return sdf.union(...corks, ...balls);
}

export default defineAsset({
  name: 'fishing-net',
  description:
    'A fishing net 1.2 m wide, hung in a sag between two splayed wooden poles, with cork floats on the top line and a grid of thin cords.',
  detail: 0.012,
  reference: 'docs/item-mockups/fishing-net-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    k.body('poles', pole(1).mirror('x', 0).paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.024,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 8, y * 26, z * 8, 3),
    });

    const rope = sdf.union(headline(), wrap(1), wrap(-1), hanger(1), hanger(-1), ...diamondLines());
    k.body('rope', rope.paintFn(ropePaint), {
      color: '#9edcc8',
      roughness: 0.88,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 2600,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    k.body('floats', floats().paintFn(floatPaint), {
      color: '#e0bb60',
      roughness: 0.62,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 700,
    });
  },
});
