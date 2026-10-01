import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — cave stalagmite cluster (nature/terrain/stalagmite).
 *
 * Role: wet cave-floor terrain dressing for the Sunken Vault; a mid-size set
 *   piece that reads at 128 px as three pale-tipped spikes on one rock foot.
 * Size: tallest tip at y ≈ 1.2 m, cluster about 1.15 m wide and 0.85 m deep.
 *   Stands on y = 0, front toward +Z. No rig, no clips.
 * One idea: wax-soft mineral drips — three rounded cones wrapped in drip-ring
 *   ledges, rising from one merged wet rock foot, each melting to a pale tip.
 * Shape language: round dominant (drip bulges, blobby foot), one spiky accent
 *   (the tall pointed tip breaks the silhouette).
 * Palette: wet stone #6f7680 dominant, dark #4b525c, shadow #373c44 at
 *   contact, pale mineral tips #a9b0bb, worn #8a8f99, moss #5f7f4d (small).
 *   Value plan: dark wet base, mid stone bodies, palest at the tips (focal).
 * Materials: stone only — cones roughness 0.58 (wet sheen), foot 0.7;
 *   metalness 0 everywhere.
 * Detail list: three revolved cones with drip-ring bulges (big), merged base
 *   with drip mounds and pebbles (medium), pale tips + wet streaks + moss
 *   paint, grain bump (small). Focal point: the tall cone and its pale tip.
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

/** A drip-ring crest on a cone: height, crest radius, width of the ledge. */
interface Ring {
  y: number;
  r: number;
  w: number;
}

/**
 * A drippy cone profile: linear taper from `r0` toward a soft point at `h`,
 * with a rounded foot flare and gentle drip-ring swells. U = radius,
 * V = height. The profile starts and ends with two points on the axis so the
 * closed-spline corner tangents run along the axis instead of dragging the
 * flare below ground or the tip above `h`.
 */
const coneProfile = (r0: number, h: number, rings: Ring[]): profile.Profile => {
  const taper = (y: number): number => r0 * (1 - y / (h * 1.06));
  const pts: Array<[number, number]> = [
    [0, 0.004],
    [0, 0.02], // axis pad: keeps the wrap corner on the axis
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
  pts.push([r0 * 0.17, h * 0.94], [r0 * 0.06, h * 0.99], [0, h - 0.018], [0, h - 0.004]);
  return profile.polygon(pts, { smooth: true, samples: 16 });
};

/** World position of a cone tip: lean rotateZ(deg) then placed at `at`. */
const tipAt = (h: number, leanZ: number, at: Vec3): Vec3 => {
  const a = (leanZ * Math.PI) / 180;
  return [at[0] - h * Math.sin(a), at[1] + h * Math.cos(a), at[2]];
};

interface Cone {
  at: Vec3;
  h: number;
  r0: number;
  leanZ: number;
  rings: Ring[];
  seed: number;
}

const CONES: Cone[] = [
  {
    // Tall centre-back cone: the landmark, tip at y ≈ 1.2.
    at: [0, 0.05, -0.1], h: 1.16, r0: 0.25, leanZ: -2.5, seed: 1,
    rings: [
      { y: 0.15, r: 0.258, w: 0.1 },
      { y: 0.37, r: 0.211, w: 0.09 },
      { y: 0.62, r: 0.154, w: 0.08 },
      { y: 0.85, r: 0.1, w: 0.065 },
    ],
  },
  {
    // Left-front medium cone leaning out to -X.
    at: [-0.32, 0.05, 0.12], h: 0.72, r0: 0.22, leanZ: 7, seed: 2,
    rings: [
      { y: 0.12, r: 0.215, w: 0.075 },
      { y: 0.32, r: 0.154, w: 0.07 },
      { y: 0.53, r: 0.088, w: 0.055 },
    ],
  },
  {
    // Right short cone leaning out to +X.
    at: [0.34, 0.05, -0.05], h: 0.52, r0: 0.19, leanZ: -8, seed: 3,
    rings: [
      { y: 0.1, r: 0.182, w: 0.065 },
      { y: 0.27, r: 0.119, w: 0.06 },
      { y: 0.42, r: 0.06, w: 0.045 },
    ],
  },
];

const coneShape = (c: Cone): Sdf =>
  sdf
    .revolve(coneProfile(c.r0, c.h, c.rings))
    .rotateZ(c.leanZ)
    .displace(0.012, (x, y, z) => noise.fbm(x * 4.5 + c.seed * 9, y * 2.4, z * 4.5, 3, c.seed))
    .at(c.at[0], c.at[1], c.at[2]);

const TIPS = CONES.map((c) => tipAt(c.h, c.leanZ, c.at));

export default defineAsset({
  name: 'stalagmite',
  description:
    'Cluster of three wet cave stalagmites with drip-ring ledges and pale mineral tips on one merged rock foot; tallest 1.2 m.',
  reference: 'docs/item-mockups/stalagmite-mock.jpg',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ cones
    const coneSdf = sdf.union(...CONES.map(coneShape));
    const conePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Vertical value plan: darker wet root, stone mid, pale mineral tips.
      let c = mixRgb(STONE_DARK, base, clamp01(0.44 + (y / 1.2) * 0.45));
      // Each cone melts to a pale tip near its apex.
      for (const tip of TIPS) {
        const d = Math.hypot(x - tip[0], y - tip[1], z - tip[2]);
        c = mixRgb(c, STONE_PALE, smoothstep(0.42, 0.1, d) * 0.6);
        c = mixRgb(c, TIP_PALE, smoothstep(0.22, 0.05, d) * 0.85);
      }
      // Big soft tonal patches so the gray is not flat.
      const patch = noise.fbm(x * 5, y * 5, z * 5, 3, 7);
      c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.34);
      c = mixRgb(c, STONE_PALE, clamp01(patch - 0.25) * 0.2);
      // Vertical wet streaks: darker trickles running down the drips.
      const streak = noise.fbm(x * 16, y * 3.5, z * 16, 3, 13);
      c = mixRgb(c, STONE_SHADOW, clamp01(streak) * 0.36);
      return c;
    };
    k.body('cones', coneSdf.paintFn(conePaint), {
      color: STONE,
      roughness: 0.58,
      metalness: 0,
      detail: 0.011,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0018 * noise.fbm(x * 34, y * 34, z * 34, 3, 11) +
        0.0008 * noise.fbm(x * 14, y * 4, z * 14, 2, 5),
    });

    // ------------------------------------------------------------------ foot
    // One merged wet rock foot: a broad chunky slab, side lobes under each
    // cone, front drip mounds and two loose pebbles, all flat-bottomed.
    const foot = sdf
      .ellipsoid([0.4, 0.11, 0.28])
      .at(0, 0.075, 0)
      .smoothUnion(0.035, sdf.ellipsoid([0.19, 0.085, 0.15]).at(-0.31, 0.06, 0.09))
      .smoothUnion(0.035, sdf.ellipsoid([0.17, 0.075, 0.13]).at(0.33, 0.055, -0.04))
      .smoothUnion(0.03, sdf.ellipsoid([0.17, 0.075, 0.12]).at(0.04, 0.055, -0.29))
      .smoothUnion(0.025, sdf.ellipsoid([0.16, 0.09, 0.12]).at(-0.12, 0.06, 0.26))
      .smoothUnion(0.025, sdf.ellipsoid([0.13, 0.075, 0.1]).at(0.2, 0.055, 0.24))
      .smoothUnion(0.018, sdf.ellipsoid([0.07, 0.05, 0.06]).at(0.42, 0.032, 0.18))
      .smoothUnion(0.018, sdf.ellipsoid([0.06, 0.045, 0.055]).at(-0.43, 0.03, -0.1))
      .displace(0.008, (x, y, z) => noise.fbm(x * 5, y * 5, z * 5, 3, 4))
      .round(0.006)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const footPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.15);
      let c = mixRgb(STONE_SHADOW, base, clamp01(0.28 + t * 0.72));
      c = mixRgb(c, STONE_MID, 0.25);
      // Pale worn crests on the mounds and pebbles.
      c = mixRgb(c, STONE_PALE, clamp01((t - 0.72) / 0.28) * 0.55);
      const patch = noise.fbm(x * 6, y * 6, z * 6, 3, 2);
      c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.3);
      // Wet shadow pooled in the nooks at the ground line.
      c = mixRgb(c, STONE_SHADOW, clamp01((0.05 - y) / 0.05) * 0.6);
      // Moss creeps where the drips land, broken up by noise.
      const n = noise.fbm(x * 15, y * 15, z * 15, 3, 21);
      const moss = clamp01((0.04 - y) / 0.04) * clamp01((n + 0.2) / 0.45);
      c = mixRgb(c, MOSS_DARK, moss * 0.7);
      c = mixRgb(c, MOSS, moss * clamp01(n * 0.8 + 0.55) * 0.55);
      return c;
    };
    k.body('foot', foot.paintFn(footPaint), {
      color: STONE,
      roughness: 0.7,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 1250,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 3, 9),
    });
  },
});
