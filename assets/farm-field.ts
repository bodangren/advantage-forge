import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Farm field — catalog id `architecture/building-parts/farm-field`. A 2 m x 2 m tilled soil
 * tile, 0.06 m thick, standing on y = 0 (top of the bare slab at 0.06). Five soft rounded
 * rows run along Z and rise to ~0.12 m, carving four evenly-spaced furrows between them.
 * Grass tufts creep in over the rim. ONE soil body (slab + rows, clipped to a clean square)
 * and ONE grass body (edge blade tufts); no rig, no animation.
 *
 * Design:
 *  - Role: village terrain tile (~6 instances, background); reads at 128 px as one stout
 *    tilled square — chunky rows, soft bevels, clean tiling edges.
 *  - The one idea: a stout square of dark tilled soil scored by four parallel furrows, with
 *    green grass nibbling at the edges.
 *  - Shape language: square + rounded (chunky chibi bevels, no razor edges).
 *  - Palette (60/30/10): soil #6e5236 dominant dark, rows #8a6a48 mid-light, grass #5fb14d
 *    small accent; value contrast comes from light rows on dark furrow floors.
 *  - Materials: one soil body (roughness 0.95, all grain in `bump`), one grass body
 *    (roughness 0.85).
 *  - Detail list: 5 rounded rows / 4 furrows (focal rhythm), soil patch + grain noise,
 *    painted grass creep at the rim, 3D blade tufts at the edges.
 */

const TILE = 2; // grid size in meters
const THICK = 0.06; // slab thickness, top of the furrow floor at y = 0.06
const ROW_R = 0.14; // row cross-section radius
const ROW_TOP = 0.115; // row crest height
const ROW_CY = ROW_TOP - ROW_R; // row capsule centerline, dips well into the slab
const ROW_CENTERS = [-0.8, -0.4, 0, 0.4, 0.8]; // 5 rows -> 4 furrows, evenly spaced

const SOIL = rgb('#6e5236');
const SOIL_DARK = rgb('#54402b');
const SOIL_LIGHT = rgb('#7d6244');
const ROW = rgb('#8a6a48');
const ROW_LIGHT = rgb('#9a7a56');
const GRASS = rgb('#5fb14d');
const GRASS_DARK = rgb('#4c8f3e');
const GRASS_LIGHT = rgb('#7cc968');

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** World-periodic noise over the 2 m tile, so patches continue onto neighboring tiles. */
const tileNoise = (x: number, z: number, y: number, frequency: number, octaves: number) => {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, y, sz * frequency, octaves);
  return lerp(lerp(sample(x, z), sample(x - 2, z), u), lerp(sample(x, z - 2), sample(x - 2, z - 2), u), v);
};

/** Distance from x to the nearest row centerline. */
const rowDistance = (x: number) =>
  Math.min(...ROW_CENTERS.map((cx) => Math.abs(x - cx)));

/** 1 on the raised rows, 0 on the furrow floors. */
const rowMask = (x: number) => 1 - smoothstep(ROW_R - 0.04, ROW_R + 0.015, rowDistance(x));

/** Soil color: dark furrow floors, lighter rounded rows, patchy grass creep at the rim. */
const soilColor = (x: number, y: number, z: number) => {
  const patch = tileNoise(x, z, 1.3, 4, 2);
  let c = mixRgb(SOIL, SOIL_DARK, clamp01(0.35 + 0.4 * patch));
  const grain = tileNoise(x, z, 5, 32, 2);
  if (grain > 0.3) c = mixRgb(c, SOIL_LIGHT, 0.4);

  // Raised rows: lighter tilled earth with a soft noise drift.
  const rowNoise = 0.5 + 0.5 * tileNoise(x, z, 2.2, 6, 2);
  c = mixRgb(c, mixRgb(ROW, ROW_LIGHT, rowNoise), rowMask(x) * clamp01(0.8 + 0.35 * (rowNoise - 0.5)));

  // Grass creeping in from the tile rim: a narrow, patchy fringe, browner further in.
  const edge = Math.max(Math.abs(x), Math.abs(z));
  const g = 0.5 + 0.5 * tileNoise(x, z, 3.1, 5, 2);
  const reach = 0.93 + 0.05 * g;
  const creep = smoothstep(reach, 1.0, edge) * smoothstep(0.42, 0.72, g) * 0.8;
  const creepCol = mixRgb(GRASS_DARK, GRASS, g);
  c = mixRgb(c, creepCol, creep * (0.5 + 0.5 * smoothstep(0, THICK, y)));
  return c;
};

// --------------------------------------------------------------------------- grass tufts
// Small clumps of blades at the tile rim, leaning outward. Deterministic placement.
type Tuft = { x: number; z: number; lx: number; lz: number; s: number; seed: number };
const TUFTS: Tuft[] = [
  { x: -0.86, z: -0.97, lx: -0.03, lz: -0.04, s: 1.0, seed: 1 },
  { x: -0.2, z: -0.99, lx: 0.0, lz: -0.05, s: 0.85, seed: 2 },
  { x: 0.62, z: -0.96, lx: 0.03, lz: -0.04, s: 1.1, seed: 3 },
  { x: -0.97, z: -0.55, lx: -0.04, lz: -0.02, s: 0.9, seed: 4 },
  { x: -0.99, z: 0.28, lx: -0.05, lz: 0.01, s: 1.0, seed: 5 },
  { x: -0.9, z: 0.86, lx: -0.04, lz: 0.04, s: 0.8, seed: 6 },
  { x: 0.97, z: -0.42, lx: 0.05, lz: -0.01, s: 0.95, seed: 7 },
  { x: 0.99, z: 0.35, lx: 0.05, lz: 0.02, s: 1.05, seed: 8 },
  { x: 0.55, z: 0.97, lx: 0.03, lz: 0.05, s: 0.9, seed: 9 },
];

const bladeTufts = sdf.union(
  ...TUFTS.flatMap((t) => {
    const blades = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + noise.random(t.seed, i, 1) * 1.2;
      const h = (0.1 + 0.05 * noise.random(t.seed, i, 2)) * t.s;
      const spread = 0.028 + 0.014 * noise.random(t.seed, i, 3);
      const bx = t.x + 0.014 * Math.cos(a);
      const bz = t.z + 0.014 * Math.sin(a);
      blades.push(
        sdf.cone(
          [bx, 0.02, bz],
          [bx + t.lx + spread * Math.cos(a), 0.02 + h, bz + t.lz + spread * Math.sin(a)],
          0.02 * t.s,
          0.002,
        ),
      );
    }
    return blades;
  }),
);

export default defineAsset({
  name: 'farm-field',
  description:
    '2 m x 2 m tilled farm field tile: dark soil scored into four soft furrows between five rounded rows, grass tufts creeping at the edges.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // One soil body: slab + five row capsules, clipped to a clean square so the tile stands
    // flat on y = 0 and rows end flush at the rim for seamless tiling.
    const slab = sdf.box([TILE, THICK, TILE], 0.015).at(0, THICK / 2, 0);
    const rows = sdf.union(
      ...ROW_CENTERS.map((cx) => sdf.capsule([cx, ROW_CY, -1.1], [cx, ROW_CY, 1.1], ROW_R)),
    );
    const clip = sdf.box([TILE, 0.45, TILE]).at(0, 0.225, 0);
    const tilled = sdf.union(slab, rows).intersect(clip).paintFn(soilColor);
    k.body('soil', tilled, {
      color: SOIL,
      roughness: 0.95,
      detail: 0.02,
      // Fine grain plus soft clods in the furrows; rows stay smooth on top.
      bump: (x, _y, z) =>
        0.0022 * tileNoise(x, z, 1, 30, 3) + 0.0032 * Math.max(0, tileNoise(x, z, 0.9, 7, 2)) * (1 - rowMask(x)),
    });

    // Grass tufts at the rim: dark matte green blades, lighter toward the tips.
    k.body('grass', bladeTufts.paintFn((x, y, z, base) => {
      const tint = noise.random(Math.floor(x * 47 + 13), 5, Math.floor(z * 47 + 29));
      const c = mixRgb(GRASS_DARK, GRASS_LIGHT, clamp01(0.25 + 0.75 * smoothstep(0.02, 0.14, y)));
      return mixRgb(base, c, 0.55 + 0.45 * tint);
    }), {
      color: GRASS,
      roughness: 0.85,
      detail: 0.018,
    });
  },
});
