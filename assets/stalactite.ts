import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Profile, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — cave ceiling stalactite cluster (nature/terrain/stalactite).
 *
 * Role: wet cave-ceiling terrain dressing for the Sunken Vault; the scene
 *   hangs it, so the longest drip tip lands on y = 0. Reads at 128 px as a
 *   chunky gray ceiling slab with three pale-tipped drips hanging under it.
 * Size: slab about 1.05 x 0.66 m and 0.4 m thick, spanning y 1.0 to 1.4
 *   (lumpy lobes hang a little lower); three drips up to 1.05 m long; total
 *   height about 1.5 m. Faces +Z. No rig, no clips.
 * One idea: the cave ceiling itself is dripping — one heavy rounded rock
 *   slab with three wax-soft mineral drips: ring ledges, rounded bulb ends.
 * Shape language: round dominant (drip bulbs, lobed slab), one near-pointed
 *   accent (the long centre drip breaks the silhouette downward).
 * Palette: wet stone #6f7680 dominant, dark #4b525c, shadow #373c44, pale
 *   mineral tips #a9b0bb, worn #8a8f99, moss #5f7f4d (small, damp nooks).
 *   Value plan: pale worn slab top, mid stone bodies, dark wet underside and
 *   drip roots, palest at the drip bulbs (focal).
 * Materials: stone only — drips roughness 0.55 (wet sheen), slab 0.78.
 * Detail list: three revolved drips with rings and bulb ends (big), lobed
 *   slab with underside stubs (medium), damp roots, wet streaks, moss and
 *   grain bump (small). Focal point: the long centre drip and its pale tip.
 * Rig/animation: none.
 */

const STONE = rgb('#6f7680');
const STONE_MID = rgb('#58606c');
const STONE_DARK = rgb('#4b525c');
const STONE_SHADOW = rgb('#373c44');
const STONE_PALE = rgb('#8a8f99');
const TIP_PALE = rgb('#a9b0bb');
const MOSS = rgb('#5f7f4d');
const MOSS_DARK = rgb('#3f5a30');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** A drip-ring crest on a drip: height, crest radius, width of the ledge. */
interface Ring {
  y: number;
  r: number;
  w: number;
}

/**
 * A drippy downward-cone profile: linear taper from the root radius `r0`
 * toward the tip at `h`, with drip-ring swells and a rounded end. A `bulb`
 * larger than the local taper ends the drip in a fat wax ball; a smaller one
 * just softens the point. U = radius, V = height (the revolve is flipped
 * downward afterwards). The profile starts and ends with two points on the
 * axis so the closed-spline corner tangents run along the axis.
 */
const dripProfile = (r0: number, h: number, rings: Ring[], bulb: number): Profile => {
  const taper = (y: number): number => r0 * (1 - y / (h * 1.06));
  const pts: Array<[number, number]> = [
    [0, 0.004],
    [0, 0.02], // axis pad: keeps the root corner on the axis
    [r0 * 0.62, 0.008],
    [r0 * 0.9, r0 * 0.17],
  ];
  const stops = rings
    .flatMap((g) => [
      { y: g.y - g.w, r: taper(g.y - g.w) },
      { y: g.y, r: g.r },
      { y: g.y + g.w, r: taper(g.y + g.w) },
    ])
    .filter((p) => p.y > r0 * 0.2 && p.y < h * 0.93)
    .sort((a, b) => a.y - b.y);
  let lastY = pts[pts.length - 1]![1];
  for (const p of stops) {
    if (p.y <= lastY + 0.015) continue;
    pts.push([Math.max(0.012, p.r), p.y]);
    lastY = p.y;
  }
  const tailStart = Math.max(h * 0.78, lastY + 0.03);
  pts.push(
    [taper(tailStart), tailStart],
    [bulb, h * 0.9],
    [bulb * 0.45, h * 0.965],
    [0, h - 0.012],
    [0, h - 0.003],
  );
  return profile.polygon(pts, { smooth: true, samples: 16 });
};

/** World position of a drip tip: flip rotateX(180), lean rotateZ(deg), then `at`. */
const tipAt = (h: number, leanZ: number, at: Vec3): Vec3 => {
  const a = (leanZ * Math.PI) / 180;
  return [at[0] + h * Math.sin(a), at[1] - h * Math.cos(a), at[2]];
};

interface Drip {
  at: Vec3;
  h: number;
  r0: number;
  leanZ: number;
  bulb: number;
  rings: Ring[];
  seed: number;
}

const DRIPS: Drip[] = [
  {
    // Long centre-back drip: the landmark, softened point landing on y = 0.
    at: [0.02, 1.06, -0.1], h: 1.082, r0: 0.26, leanZ: -3, bulb: 0.05, seed: 1,
    rings: [
      { y: 0.28, r: 0.215, w: 0.09 },
      { y: 0.54, r: 0.15, w: 0.08 },
      { y: 0.76, r: 0.098, w: 0.06 },
    ],
  },
  {
    // Left medium drip with a fat wax bulb, leaning out to -X.
    at: [-0.3, 1.05, 0.12], h: 0.77, r0: 0.225, leanZ: -8, bulb: 0.085, seed: 2,
    rings: [
      { y: 0.2, r: 0.19, w: 0.075 },
      { y: 0.42, r: 0.128, w: 0.065 },
    ],
  },
  {
    // Right short drip, leaning out to +X.
    at: [0.33, 1.05, 0.06], h: 0.56, r0: 0.22, leanZ: 4, bulb: 0.074, seed: 3,
    rings: [
      { y: 0.14, r: 0.188, w: 0.065 },
      { y: 0.3, r: 0.125, w: 0.055 },
    ],
  },
];

const dripShape = (d: Drip): Sdf =>
  sdf
    .revolve(dripProfile(d.r0, d.h, d.rings, d.bulb))
    .rotateX(180)
    .rotateZ(d.leanZ)
    .displace(0.014, (x, y, z) => noise.fbm(x * 4.5 + d.seed * 9, y * 2.4, z * 4.5, 3, d.seed))
    .at(d.at[0], d.at[1], d.at[2]);

const TIPS = DRIPS.map((d) => tipAt(d.h, d.leanZ, d.at));

export default defineAsset({
  name: 'stalactite',
  description:
    'Chunk of wet cave ceiling: one lumpy rock slab with three downward mineral drips, drip-ring ledges and pale bulb tips; longest tip reaches y = 0.',
  reference: 'docs/item-mockups/stalactite-mock.jpg',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ----------------------------------------------------------------- drips
    const dripSdf = sdf.union(...DRIPS.map(dripShape));
    const dripPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Vertical value plan: darker wet root at the slab, palest at the tips.
      let c = mixRgb(STONE_DARK, base, clamp01(0.26 + ((1.06 - y) / 1.1) * 0.58));
      // Each drip pales toward its rounded end.
      for (const tip of TIPS) {
        const d = Math.hypot(x - tip[0], y - tip[1], z - tip[2]);
        c = mixRgb(c, STONE_PALE, smoothstep(0.45, 0.1, d) * 0.62);
        c = mixRgb(c, TIP_PALE, smoothstep(0.24, 0.05, d));
      }
      // Big soft tonal patches so the gray is not flat.
      const patch = noise.fbm(x * 5, y * 5, z * 5, 3, 7);
      c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.38);
      c = mixRgb(c, STONE_PALE, clamp01(patch - 0.25) * 0.2);
      // Vertical wet streaks: dark trickles running down the drips.
      const streak = noise.fbm(x * 16, y * 3.5, z * 16, 3, 13);
      c = mixRgb(c, STONE_SHADOW, clamp01(streak) * 0.42);
      return c;
    };
    k.body('drips', dripSdf.paintFn(dripPaint), {
      color: STONE,
      roughness: 0.55,
      metalness: 0,
      detail: 0.011,
      maxTriangles: 2300,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0018 * noise.fbm(x * 34, y * 34, z * 34, 3, 11) +
        0.0008 * noise.fbm(x * 14, y * 4, z * 14, 2, 5),
    });

    // ------------------------------------------------------------------ slab
    // The ceiling chunk: a chunky rounded mass with a domed lumpy top, a
    // scalloped underside of hanging lobes and side stubs — no straight run
    // of silhouette anywhere.
    const slab = sdf
      .box([0.98, 0.4, 0.62], 0.13)
      .at(0, 1.2, 0)
      .smoothUnion(0.07, sdf.ellipsoid([0.42, 0.16, 0.32]).at(-0.16, 1.32, -0.06))
      .smoothUnion(0.07, sdf.ellipsoid([0.34, 0.15, 0.28]).at(0.24, 1.31, 0.06))
      .smoothUnion(0.06, sdf.ellipsoid([0.2, 0.11, 0.18]).at(0.02, 1.3, 0.16))
      .smoothUnion(0.06, sdf.ellipsoid([0.19, 0.13, 0.15]).at(-0.28, 0.97, 0.16))
      .smoothUnion(0.06, sdf.ellipsoid([0.16, 0.12, 0.14]).at(0.26, 0.96, 0.12))
      .smoothUnion(0.06, sdf.ellipsoid([0.19, 0.12, 0.15]).at(0.0, 0.95, -0.2))
      .smoothUnion(0.05, sdf.ellipsoid([0.14, 0.1, 0.12]).at(-0.12, 0.96, 0.24))
      .smoothUnion(0.05, sdf.ellipsoid([0.11, 0.09, 0.1]).at(0.1, 0.96, 0.26))
      .smoothUnion(0.05, sdf.ellipsoid([0.12, 0.15, 0.12]).at(-0.44, 1.08, -0.08))
      .smoothUnion(0.05, sdf.ellipsoid([0.11, 0.14, 0.11]).at(0.43, 1.1, 0.08))
      .displace(0.022, (x, y, z) => noise.fbm(x * 3.6, y * 2.8, z * 3.6, 3, 6))
      .round(0.004);
    const slabPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Lighter worn top, darker wet underside.
      let c = mixRgb(STONE_DARK, base, clamp01(0.26 + ((y - 0.84) / 0.64) * 0.68));
      c = mixRgb(c, STONE_MID, 0.2);
      // Pale worn crests on the domed top.
      c = mixRgb(c, STONE_PALE, clamp01((y - 1.26) / 0.16) * 0.68);
      // Tonal patches.
      const patch = noise.fbm(x * 5.5, y * 5.5, z * 5.5, 3, 3);
      c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.32);
      c = mixRgb(c, STONE_PALE, clamp01(patch - 0.25) * 0.18);
      // Wet streaks trickling down from the lobes.
      const streak = noise.fbm(x * 15, y * 3.2, z * 15, 3, 12);
      c = mixRgb(c, STONE_SHADOW, clamp01(streak) * clamp01((1.02 - y) / 0.14) * 0.52);
      // Damp shadow pooled around each drip root.
      for (const d of DRIPS) {
        const rad = Math.hypot(x - d.at[0], z - d.at[2]);
        const band = clamp01((y - 0.94) / 0.08) * clamp01((1.16 - y) / 0.1);
        c = mixRgb(c, STONE_SHADOW, smoothstep(0.36, 0.12, rad) * band * 0.5);
      }
      // Moss as small speckled tufts in the dampest underside nooks.
      const n = noise.fbm(x * 18, y * 18, z * 18, 3, 8);
      const moss = clamp01((0.98 - y) / 0.07) * clamp01((n - 0.05) / 0.3);
      c = mixRgb(c, MOSS_DARK, moss * 0.5);
      c = mixRgb(c, MOSS, moss * clamp01(n * 0.8 + 0.4) * 0.4);
      return c;
    };
    k.body('slab', slab.paintFn(slabPaint), {
      color: STONE,
      roughness: 0.78,
      metalness: 0,
      detail: 0.013,
      maxTriangles: 1450,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 26, y * 26, z * 26, 3, 9),
    });
  },
});
