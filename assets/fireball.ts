import { defineAsset, mixRgb, motion, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — Fireball (fx-geometry/magic/fireball).
 * Role: reusable projectile and magic effect; the hot core and the flame halo must read at 128 px.
 * Size: 0.4 m core, about 0.58 x 0.64 x 0.81 m, lowest flame on y = 0; faces +Z with its trail toward -Z.
 * One idea: a bright core wrapped in flame tongues that spiral back into one curled tail.
 * Shape language: a round core with broad, flat, twisting flame petals; the longest one curls up.
 * Palette: pale yellow #ffe08a hot core, orange #ff9a3c near flames, red-orange #e54b1b tongues, deep red #8f1d17 tips.
 * Materials: opaque core and opaque flame shell, both emissive with low intensity; roughness 0.3, metalness 0.
 * Details: core value gradient with faint swirls; flame streaks follow the spiral; the core is the focal point.
 * Rig/clips: root and trail bones; one seamless 1.2 s fly clip with a shrink-only pulse and a trail sway.
 */

type V3 = readonly [number, number, number];
type P4 = [number, number, number, number];

const PALE = rgb('#ffe08a');
const ORANGE = rgb('#ff9a3c');
const RED_ORANGE = rgb('#e54b1b');
const DEEP_RED = rgb('#8f1d17');

const R = 0.2;
const C: V3 = [0, 0.256, 0.2];
const TWIST = (60 * Math.PI) / 180;
const SPAN = 0.6;
const LIFT = 0.1;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const twistAt = (s: number) => TWIST * clamp01((s + 0.03) / SPAN);
const liftAt = (s: number) => LIFT * clamp01(s / SPAN) ** 2;

interface Petal {
  readonly a: number;
  readonly s0: number;
  readonly s1: number;
  readonly r: number;
  readonly end: number;
  readonly w?: number;
  readonly h?: number;
  readonly curl?: number;
}

const RHO0 = 0.175;

const petal = (t: Petal): Sdf => {
  const w = t.w ?? 1.35;
  const h = t.h ?? 0.8;
  const pts: P4[] = [[0, (0.1 - RHO0) / h, -(t.s0 - 0.08), t.r * 0.6]];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const c = Math.max(0, (u - 0.6) / 0.4);
    const s = t.s0 + (t.s1 - t.s0) * u - (t.curl ?? 0) * 0.5 * c ** 3;
    const rad = u < 0.2 ? t.r * (0.6 + 0.4 * Math.sin((u / 0.2) * (Math.PI / 2))) : t.r * (1 - (u - 0.2) / 0.8) ** 1.1 + 0.009;
    const rho = RHO0 + (t.end - RHO0) * u ** 1.5 + 0.012 * Math.sin(Math.PI * u) + (t.curl ?? 0) * c * c;
    pts.push([0, (rho - RHO0) / h, -s, rad]);
  }
  return sdf
    .chain(pts, 0.03)
    .scale([w, h, 1])
    .at(0, RHO0, 0)
    .rotateZ(t.a - 90);
};

const flow = (shape: Sdf): Sdf => {
  const b = shape.bounds;
  const m = Math.hypot(Math.max(-b.min[0], b.max[0]), Math.max(-b.min[1], b.max[1]));
  return shape.warp(
    (x, y, z) => {
      const s = -z;
      const a = -twistAt(s);
      const c = Math.cos(a);
      const n = Math.sin(a);
      const yl = y - liftAt(s);
      return [c * x - n * yl, n * x + c * yl, z];
    },
    1.35,
    { min: [-m, -m, b.min[2]], max: [m, m + LIFT, b.max[2]] },
  );
};

const ramp = (h: number): Rgb =>
  h > 0.74
    ? mixRgb(ORANGE, PALE, clamp01((h - 0.74) / 0.22))
    : h > 0.44
      ? mixRgb(RED_ORANGE, ORANGE, (h - 0.44) / 0.3)
      : mixRgb(DEEP_RED, RED_ORANGE, clamp01(h / 0.44));

export default defineAsset({
  name: 'fireball',
  description: 'A bright fireball: a hot pale-yellow core wrapped in orange and red flame tongues that spiral back into one curled tail.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    k.skeleton({
      root: { at: C },
      trail: { parent: 'root', at: [0, C[1] + 0.03, C[2] - 0.22], tail: [0, C[1] + 0.2, C[2] - 0.62], split: 0.1 },
    });

    const core = sdf.sphere(R).paintFn((x, y, z) => {
      const f = (z / R) * 0.95 + (y / R) * 0.2;
      const rim = Math.hypot(x, y) / R;
      const swirl = noise.fbm(x * 5 + 3, y * 5, z * 5, 2);
      const wisp = Math.sin(3 * Math.atan2(y, x) + 6 * rim + 1.5 * swirl);
      return ramp(0.56 + 0.56 * f + 0.05 * swirl - 0.14 * clamp01((wisp - 0.3) / 0.6) * rim * rim);
    });
    k.body('core', core.at(...C), {
      color: '#ff9a3c',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 0.45,
      detail: 0.008,
      maxTriangles: 2000,
      paintWeight: 2,
      bone: 'root',
    });

    const filler = sdf.chain(
      [
        [0, 0, -0.05, 0.165],
        [0, 0, -0.17, 0.135],
        [0, 0, -0.29, 0.08],
        [0, 0, -0.4, 0.035],
      ],
      0.03,
    );
    const petals: Petal[] = [
      { a: 30, s0: -0.02, s1: 0.64, r: 0.09, end: 0.2, w: 1.3, h: 0.9, curl: 0.08 },
      { a: -60, s0: 0.02, s1: 0.5, r: 0.085, end: 0.12 },
      { a: 170, s0: -0.02, s1: 0.46, r: 0.085, end: 0.13 },
      { a: 245, s0: 0.03, s1: 0.34, r: 0.075, end: 0.14 },
      { a: 105, s0: 0, s1: 0.38, r: 0.075, end: 0.17 },
      { a: -15, s0: 0.03, s1: 0.3, r: 0.05, end: 0.33, w: 1, h: 0.9 },
      { a: 200, s0: 0.04, s1: 0.27, r: 0.047, end: 0.34, w: 1, h: 0.9 },
      { a: 68, s0: 0.02, s1: 0.21, r: 0.045, end: 0.29, w: 1, h: 0.9 },
    ];
    const flamePaint = (x: number, y: number, z: number): Rgb => {
      const s = -z;
      const rho = Math.hypot(x, y);
      const phi = Math.atan2(y, x);
      const streak = noise.fbm(Math.cos(phi) * 4, Math.sin(phi) * 4, s * 3, 3);
      const along = clamp01((s + 0.02) / 0.62);
      const inner = clamp01((0.18 - rho) / 0.11) * clamp01(s / 0.14);
      return ramp(0.76 - 0.95 * along - 0.4 * inner + 0.3 * streak);
    };
    const flames = flow(sdf.smoothUnion(0.04, filler, ...petals.map(petal)).paintFn(flamePaint)).bone('root');
    k.body('flames', flames.at(...C), {
      color: '#e54b1b',
      roughness: 0.3,
      metalness: 0,
      emissive: '#e54b1b',
      emissiveIntensity: 0.3,
      detail: 0.005,
      maxTriangles: 8000,
      paintWeight: 2,
    });

    k.animation('fly', {
      duration: 1.2,
      ground: false,
      pose: (_t, p) => {
        const pulse = 1 - 0.1 * motion.bump(p);
        const stretch = 1 + 0.07 * motion.bump(p, 1, 0.25) + 0.05 * motion.bump(p, 2, 0.1);
        return {
          root: { scale: [pulse, pulse, pulse] },
          trail: { rotate: [4 + 4 * motion.wave(p, 1, 0.1), 8 * motion.wave(p, 1, 0.3), 0], scale: [1, 1, stretch] },
        };
      },
    });
  },
});
