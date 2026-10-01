import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Dirt floor tile, a 0.3 m slab (top at y = 0, packed soil to y = -0.3) (architecture/building-parts/dirt-floor) for the Sunken Vault.
 *
 * - Role: modular 2 x 2 m floor tile — a warm packed-earth patch between the cool stone
 *   tiles of the dungeon. Read from a 3/4 top-down camera and at 128 px.
 * - Size: 2 m square, 0.3 m slab, top at y = 0, bottom at y = -0.3. Edges stay exactly at
 *   x = ±1, z = ±1 so tiles butt together without gaps.
 * - One idea: soft-lumped warm earth scattered with big readable pebbles and pale straw
 *   bits (from the mockup) — a warm accent in a cool gray dungeon.
 * - Shape language: square footprint, rounded chunky forms — lumpy top, bevelled edge,
 *   egg-smooth pebbles, leaf-shaped straw. Friendly, not sharp.
 * - Palette (60/30/10): dirt #7a5a3a dominant; #5d4429 patches and #463222 deep pockets;
 *   accents are pale straw #e5d68f and cream/blush pebbles #e9dec2 / #cf9070 / #b06a48.
 * - Materials: packed dirt (roughness 0.95), pebbles (0.8), straw (0.75). No metal, no glow.
 * - Detail list: top lumps (primary form), pebbles + straw (focal secondary), packed-earth
 *   bump and tonal patches (tertiary, normal map + paint).
 * - No rig, no animation.
 */

const TOP = 0.05; // old design top height; the design is shifted down by TOP so the walkable top is y = 0
const LUMP = 0.01; // subtle hand-made noise on top of the big mounds

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// The big soft mounds of the mockup: ellipsoid domes fused into the slab. x, z, rx, ry.
// Centers and radii stay inside |x|, |z| = 1 so the tile footprint stays exactly 2 x 2 m.
const MOUNDS: Array<[number, number, number, number]> = [
  [-0.48, -0.42, 0.5, 0.06],
  [0.36, 0.32, 0.55, 0.068],
  [0.48, -0.5, 0.42, 0.052],
  [-0.38, 0.46, 0.46, 0.058],
  [0.02, -0.02, 0.46, 0.045],
  [-0.02, 0.7, 0.3, 0.038],
  [0.76, -0.12, 0.24, 0.034],
  [-0.73, 0.14, 0.25, 0.034],
];
const MOUND_K = 0.035; // fillet where mounds meet each other and the slab

/** Height of the mound surface at (x, z), or TOP where no mound reaches. */
const moundTop = (x: number, z: number) => {
  let h = TOP;
  for (const [mx, mz, rx, ry] of MOUNDS) {
    const d = Math.hypot(x - mx, z - mz) / rx;
    if (d < 1) {
      const y = TOP - ry * 0.35 + ry * Math.sqrt(1 - d * d);
      if (y > h) h = y;
    }
  }
  return h;
};

/** Subtle hand-made roughness in [-1, 1] on top of the mounds; creases may cut the edge. */
const lumpN = (x: number, y: number, z: number) => {
  const topness = smoothstep(0.02, 0.05, y);
  const e = Math.max(Math.abs(x), Math.abs(z));
  const big = noise.fbm(x * 2.6, 0.7, z * 2.6, 2);
  const field = Math.min(1, Math.max(-1, 1.6 * big));
  const edge = 1 - smoothstep(0.72, 0.92, e);
  const edgeDip = 1 - smoothstep(0.9, 0.995, e);
  return topness * (field > 0 ? field * edge : field * edgeDip);
};

/** Height of the finished dirt top at (x, z) — used to seat pebbles and straw. */
const topAt = (x: number, z: number) => moundTop(x, z) + LUMP * lumpN(x, TOP, z) - TOP;

// Palette: warm brown earth straight from the brief, shadows toward deeper brown.
const DIRT = rgb('#7a5a3a');
const DIRT_DARK = rgb('#5f4729');
const DIRT_DEEP = rgb('#4c3826');
const DIRT_LIGHT = rgb('#9d7045');
const RIM = rgb('#4e3721');

/** Warm packed earth: big soft patches, creases dark between mounds, dry light spots. */
const dirtColor = (x: number, y: number, z: number, moundDist: number) => {
  const topness = smoothstep(0.01, 0.035, y);
  const big = 0.5 + 0.5 * noise.fbm(x * 2.4, y * 1.5, z * 2.4, 3);
  const mid = 0.5 + 0.5 * noise.fbm(x * 6, y * 3, z * 6, 2);
  const darkMask = clamp01((0.46 - big) * 2.0) * topness;
  const midMask = clamp01((0.52 - mid) * 1.8) * topness;
  // Value follows form: the creases between mounds collect dark, the crests dry out light.
  const crease = clamp01(1 - Math.abs(moundDist) / 0.055) * topness;
  const crest = clamp01(-moundDist / 0.07) * topness;
  const deep = noise.fbm(x * 8, 2, z * 8, 2);
  const deepMask = clamp01((0.4 - deep) * 2.4) * topness;
  const lightNoise = noise.fbm(x * 1.8, 1, z * 1.8, 2);
  const lightMask = clamp01((lightNoise - 0.36) * 2.2) * topness;
  const speckle = 0.5 + 0.5 * noise.fbm(x * 22, y * 8, z * 22, 2);
  const speck = 0.09 * (0.35 + 0.65 * topness) * (speckle - 0.5);
  // Slightly darker band just under the top edge so the 5 cm thickness reads from the side.
  const rim = Math.max(0, 1 - Math.abs(y - 0.046) / 0.008) * (1 - 0.4 * topness);

  let c = mixRgb(DIRT, DIRT_DARK, clamp01(0.3 * darkMask + 0.2 * midMask + speck));
  c = mixRgb(c, DIRT_DEEP, clamp01(0.72 * crease + 0.35 * deepMask));
  c = mixRgb(c, DIRT_LIGHT, clamp01(0.5 * lightMask + 0.4 * crest));
  c = mixRgb(c, RIM, 0.45 * rim);
  return c;
};

// Pebbles straight from the mockup: cream, dusty blush, and terracotta, big and readable.
const PEBBLE_COLORS = {
  cream: rgb('#e9dec2'),
  blush: rgb('#cf9070'),
  blush2: rgb('#c07e5e'),
  terra: rgb('#b06a48'),
  terra2: rgb('#a55f40'),
} as const;
const PEBBLE_DARK = rgb('#6b5140');

// x, z, radii [rx, ry, rz], color — one big focal pair, mid stones, tiny scatter.
const PEBBLES: Array<[number, number, number, number, number, keyof typeof PEBBLE_COLORS]> = [
  [0.08, 0.34, 0.135, 0.058, 0.11, 'terra'],
  [-0.46, -0.32, 0.14, 0.055, 0.105, 'cream'],
  [0.55, -0.5, 0.095, 0.042, 0.078, 'blush'],
  [-0.66, 0.42, 0.1, 0.045, 0.082, 'blush2'],
  [0.58, 0.58, 0.068, 0.032, 0.058, 'cream'],
  [-0.16, 0.66, 0.072, 0.034, 0.06, 'cream'],
  [0.38, 0.02, 0.068, 0.032, 0.058, 'terra2'],
  [-0.72, -0.64, 0.058, 0.028, 0.05, 'blush'],
  [-0.36, 0.12, 0.052, 0.026, 0.046, 'cream'],
];

// Straw bits: small pale-yellow leaves pressed into the earth (mockup detail).
const STRAW = rgb('#e5d68f');
const STRAW_DARK = rgb('#c3ab66');

// x, z, in-plane angle, tilt (one end pressed in), scale.
const STRAWS: Array<[number, number, number, number, number]> = [
  [-0.32, -0.6, 26, 9, 1.3],
  [0.48, 0.22, -38, -8, 1.2],
  [-0.62, -0.06, 74, 7, 1.1],
  [0.16, -0.26, 24, 8, 1.25], // a crossed pair — two leaves fanned apart
  [0.16, -0.26, 66, -6, 1.05],
  [0.7, 0.48, -12, -10, 1],
  [-0.14, 0.54, 138, -8, 1.15],
];

const SLAB = 0.3;
const EDGE = 0.001;
const SOIL = rgb('#6a4428');
const STRATA = rgb('#4a2e1a');
const SPECK = rgb('#9a8a78');
/** Side color: a lip of the top color with a wavy edge, then packed soil with strata and pebbles. */
function sideColor(x: number, y: number, z: number, top: (x: number, z: number) => ReturnType<typeof rgb>) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return top(x, z);
  const depth = -y / SLAB;
  let c = mixRgb(SOIL, STRATA, 0.1 + depth * 0.6);
  // Broken strata and soft clumps, so the side reads as earth and not as planks.
  const strata = Math.sin((y + 0.03 * noise.fbm(along * 3, y * 3, 5.3, 2)) * 45);
  const breakUp = Math.max(0, Math.min(1, 0.5 + noise.fbm(along * 4, y * 12, 7.1, 2)));
  c = mixRgb(c, STRATA, Math.max(0, strata - 0.7) * 0.9 * breakUp);
  const clump = noise.fbm(along * 14, y * 14, 11.7, 2);
  c = mixRgb(c, clump > 0 ? STRATA : SPECK, Math.min(1, Math.abs(clump)) * 0.3);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, SPECK, Math.min(1, (n - 0.45) * 6) * 0.8);
  return c;
}


export default defineAsset({
  name: 'dirt-floor',
  description:
    'A 2 m square packed-dirt floor tile, a 0.3 m slab with its top at y = 0: warm brown earth with soft lumps, pebbles and straw bits.',
  detail: 0.012,
  reference: 'docs/item-mockups/dirt-floor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // The slab: square footprint so tiles butt together; big soft mounds fused into the top.
    const moundShape = sdf.smoothUnion(
      MOUND_K,
      ...MOUNDS.map(([mx, mz, rx, ry]) =>
        sdf.ellipsoid([rx, ry, rx * 0.92]).at(mx, TOP - ry * 0.35, mz),
      ),
    );
    const top = sdf.box([2, TOP, 2], 0.012)
      .at(0, TOP / 2, 0)
      .smoothUnion(MOUND_K, moundShape)
      .displace(LUMP, lumpN, 1.6)
      // Trim flush: flat on the ground (mound undersides poke out) and exactly 2 x 2 m.
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .intersect(sdf.box([2, 0.3, 2]).at(0, 0.15, 0))
      .at(0, -TOP, 0);
    const base = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const topColor = (x: number, z: number) => dirtColor(x, TOP, z, moundShape.dist(x, TOP, z));
    const slab = sdf.union(top, base).paintFn((x, y, z) =>
      y > -0.01 ? dirtColor(x, y + TOP, z, moundShape.dist(x, TOP, z)) : sideColor(x, y, z, topColor),
    );

    k.body('dirt', slab, {
      color: '#7a5a3a',
      roughness: 0.95,
      metalness: 0,
      detail: 0.012,
      maxError: 0.0022,
      maxTriangles: 7000,
      paintWeight: 2,
      // Packed-earth grain, normal-map only so the mesh stays light.
      bump: (x, y, z) =>
        y < -0.01 ? 0 : 0.0022 * noise.fbm(x * 11, y * 3, z * 11, 3) + 0.0012 * noise.fbm(x * 30, 0, z * 30, 2),
    });

    // Pebbles: egg-smooth flattened stones sunk about half their height into the dirt,
    // seated on the displaced surface so they never float. Two bodies (big stones, small
    // flecks) so each reduces cleanly.
    const seat = ([px, pz, rx, ry, rz]: (typeof PEBBLES)[number]) =>
      sdf.ellipsoid([rx, ry, rz]).at(px, topAt(px, pz) + ry * 0.45, pz);
    const pebblePaint = (x: number, y: number, z: number) => {
      let best = 0;
      let bestD = Infinity;
      PEBBLES.forEach(([px, pz], i) => {
        const d = Math.hypot(x - px, z - pz);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(PEBBLE_COLORS[PEBBLES[best]![5]], PEBBLE_DARK, 0.12 + 0.28 * grain);
      // Darken where each pebble meets the dirt so it reads as set into the earth.
      const buried = clamp01((topAt(x, z) + 0.006 - y) / 0.012);
      return mixRgb(c, PEBBLE_DARK, 0.4 * buried);
    };

    const isBig = (p: (typeof PEBBLES)[number]) => p[2] >= 0.095;
    k.body('pebbles', sdf.union(...PEBBLES.filter(isBig).map(seat)).paintFn(pebblePaint), {
      color: '#e9dec2',
      roughness: 0.8,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 750,
    });
    k.body('pebble-flecks', sdf.union(...PEBBLES.filter((p) => !isBig(p)).map(seat)).paintFn(pebblePaint), {
      color: '#e9dec2',
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      maxTriangles: 700,
    });

    // Straw: leaf-shaped slivers pressed into the surface, one end buried, one end proud.
    const leaf = (scale: number) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.08, 0],
              [-0.035, 0.028],
              [0.04, 0.022],
              [0.082, 0],
              [0.04, -0.018],
              [-0.035, -0.024],
            ],
            { smooth: true },
          ),
          0.014,
          0.004,
        )
        .scale(scale);

    const straw = (px: number, pz: number, angle: number, tilt: number, scale: number) =>
      leaf(scale)
        .rotateX(-90) // lie flat: profile in the XZ plane, 14 mm thick along Y
        .rotateY(angle)
        .rotateZ(tilt)
        .at(px, topAt(px, pz) + 0.002, pz);

    const straws = sdf.union(...STRAWS.map(([px, pz, a, t, s]) => straw(px, pz, a, t, s))).paintFn(
      (x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
        return mixRgb(STRAW, STRAW_DARK, 0.12 + 0.32 * grain);
      },
    );

    k.body('straw', straws, {
      color: '#e5d68f',
      roughness: 0.75,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 500,
    });
  },
});
