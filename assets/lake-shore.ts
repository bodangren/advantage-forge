import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * lake-shore — modular lakeshore ground tile (architecture/landscape-parts/lake-shore).
 *
 * Role: modular terrain tile for the cozy chibi hamlet map, seen from above and at 128 px.
 * Size: exactly 2 x 2 m, 0.06 m thick, top surface at y = 0.06, standing on y = 0, centred on
 *   Y, front toward +Z. Tile edges are at x = +-1 and z = +-1 so it chains in a grid.
 * One idea: a calm lake edge — bright grass on the -Z half drops over a pale sand beach into
 *   one broad sheet of blue water on the +Z half, with rounded stones on the waterline.
 * Shape language: round and soft (one smooth shore terrace, domed hummocks, pebble stones)
 *   over a clean square tile base.
 * Palette 60/30/10: grass #7ec850 dominant (dark #4a8a3f, pale flecks #b6e07a), sand
 *   #e8d39c secondary (wet #c2a372), water #3fa8c8 accent and focal point (shallow #7fd4e0).
 * Materials: one ground body (grass + sand + silt + cut soil, roughness 0.9); hummock body
 *   (grass, roughness 0.9); water body (roughness 0.12, opacity 0.9); stone body
 *   (roughness 0.88). No rig, no animation.
 * Detail: primary shore profile; secondary hummocks + stranded stones; tertiary grass
 *   patch and sand grain in paint and bump. Focal point: the waterline stones.
 */

const TILE = 2.0;
const TOP = 0.06; // grass surface height
const SHELF = 0.05; // dry sand beach shelf height
const BED = 0.018; // lake bed height (hidden under the water)
const WATER_Y = 0.038; // water surface height
const BEVEL = 0.006; // tile edge round-over

const C = {
  grass: rgb('#7ec850'),
  grassDark: rgb('#4a8a3f'),
  fleck: rgb('#b6e07a'),
  sand: rgb('#e8d39c'),
  sandWet: rgb('#c2a372'),
  silt: rgb('#6b5c41'),
  soil: rgb('#8a6a48'),
  soilDark: rgb('#6a4f34'),
  waterDeep: rgb('#349ec2'),
  waterShallow: rgb('#7fd0e2'),
  waterGlint: rgb('#c9f0f4'),
  stone: rgb('#8a94a0'),
  stoneDark: rgb('#5f6873'),
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smoothstep, tolerant of a > b. */
const sstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Shore profile height: flat grass, a soft shoulder down to a wide sand shelf, then a short
 * drop to the flat lake bed. Only z matters, so the tile tiles cleanly along X.
 */
const h = (z: number): number =>
  TOP - (TOP - SHELF) * sstep(-0.12, 0.12, z) - (SHELF - BED) * sstep(0.33, 0.56, z);

/** Repeat noise across the 2 m tile so opposite painted edges get the same color. */
function tileNoise(x: number, z: number, frequency: number, octaves: number): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return lerp(lerp(sample(x, z), sample(x - 2, z), u), lerp(sample(x, z - 2), sample(x - 2, z - 2), u), v);
}

// Pale sunlit flecks on the grass, kept on the -Z half. (x, z, radius).
const FLECKS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.72, -0.62, 0.1],
  [0.62, -0.78, 0.09],
  [-0.28, -0.9, 0.08],
  [0.78, -0.42, 0.09],
  [-0.85, -0.2, 0.08],
  [0.2, -0.55, 0.08],
  [-0.5, -0.32, 0.07],
];

/** 1 inside a fleck, fading to 0 at its soft edge. */
function fleckWeight(x: number, z: number): number {
  let w = 0;
  for (const [cx, cz, r] of FLECKS) {
    const dx = (x - cx) / r;
    const dz = (z - cz) / (r * 0.85);
    const d2 = dx * dx + dz * dz;
    if (d2 < 1) w = Math.max(w, 1 - Math.sqrt(d2));
  }
  return w;
}

/** Grass patch color, shared by the ground top and the hummocks. */
function grassColor(x: number, z: number): Rgb {
  const big = tileNoise(x, z, 2.4, 3);
  const small = tileNoise(x, z, 7, 2);
  const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
  let c = mixRgb(C.grass, C.grassDark, v * 0.5);
  const w = fleckWeight(x, z);
  if (w > 0) c = mixRgb(c, C.fleck, w * 0.6);
  return c;
}

/**
 * Ground paint: cut turf soil on the sides and underside, then along Z the grass, the wide
 * dry sand beach, a damp band at the waterline, and the dark silt bed under the water.
 */
const groundPaint = (x: number, y: number, z: number): Rgb => {
  const surface = h(z);
  // 0 on the cut sides / underside, 1 on the top surface.
  const onTop = sstep(-0.012, -0.003, y - surface);
  const soil = mixRgb(C.soil, C.soilDark, 0.5 - 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2));

  // Wavy offsets so the shore lines are organic curves, not ruler-straight. The grass/sand
  // edge wanders more than the waterline bands, which must follow the real water surface.
  const zGrass = z + 0.06 * tileNoise(x, z, 2.6, 2) + 0.02 * tileNoise(x, z, 7, 2);
  const zWet = z + 0.02 * tileNoise(x, z, 3.2, 2) + 0.008 * tileNoise(x, z, 9, 2);

  const grassW = 1 - sstep(-0.03, 0.15, zGrass);
  const wetW = sstep(0.36, 0.44, zWet) * (1 - sstep(0.45, 0.55, zWet));
  const siltW = sstep(0.45, 0.56, zWet);

  let top = mixRgb(C.sand, grassColor(x, z), grassW);
  top = mixRgb(top, C.sandWet, 0.85 * wetW);
  top = mixRgb(top, C.silt, siltW);
  // A little dry-sand grain so the beach is not a flat fill.
  top = mixRgb(top, C.sand, 0.08 * Math.max(0, noise.fbm(x * 40, 0, z * 40, 2)));
  return mixRgb(soil, top, onTop);
};

/** Calm water: shallow and pale by the shore, deepening toward the front edge. */
const waterPaint = (x: number, y: number, z: number): Rgb => {
  const t = clamp01((z - 0.12) / 0.8);
  let c = mixRgb(C.waterShallow, C.waterDeep, sstep(0.02, 0.7, t));
  c = mixRgb(c, C.waterGlint, 0.06 * sstep(0.5, 0.9, tileNoise(x, z, 6, 2)));
  return c;
};

// Shore cross-section in the (z, y) plane, extruded along X into the tile.
const pts: [number, number][] = [];
const STEPS = 96;
for (let i = 0; i <= STEPS; i++) {
  const z = -1 + (2 * i) / STEPS;
  pts.push([z, h(z)]);
}
pts.push([TILE / 2, 0], [-TILE / 2, 0]);

export default defineAsset({
  name: 'lake-shore',
  description:
    'Modular 2 m lakeshore tile: grass on the -Z half drops over a pale sand beach into blue water on the +Z half, with rounded stones on the waterline; 0.06 m thick, top at 0.06.',
  detail: 0.02,
  reference: 'docs/item-mockups/lake-shore-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ground
    const shore = sdf.extrude(profile.polygon(pts), TILE, BEVEL).rotateY(-90);
    k.body('ground', shore.paintFn(groundPaint), {
      color: C.grass,
      roughness: 0.9,
      metalness: 0,
      paintWeight: 2,
      textureDensity: 2,
      detail: 0.02,
      maxTriangles: 2600,
      bump: (x, y, z) => {
        const onTop = sstep(-0.012, -0.003, y - h(z));
        const nap = 0.0028 * noise.fbm(x * 34, y * 34, z * 34, 3) + 0.0016 * noise.fbm(x * 9, 5, z * 9, 2);
        const grain = 0.0016 * noise.fbm(x * 55, y * 55, z * 55, 2);
        return onTop * nap + (1 - onTop) * grain;
      },
    });

    // ------------------------------------------------------------------ water
    // One flat sheet over the +Z half; its back end is buried in the beach.
    const water = sdf
      .box([TILE, 0.028, 0.98], 0.004)
      .at(0, WATER_Y - 0.014, 0.51)
      .paintFn(waterPaint);
    k.body('water', water, {
      color: C.waterDeep,
      roughness: 0.35,
      metalness: 0,
      opacity: 0.9,
      paintWeight: 2,
      textureDensity: 2,
      detail: 0.012,
      maxTriangles: 400,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 10, y * 10, z * 10, 2),
    });

    // ------------------------------------------------------------------ hummocks
    // A few low grassy domes on the back half, like the mock's soft mounds. Their bases sit
    // on the tile underside so they never dip below the ground plane.
    const hummock = (x: number, z: number, r: number, sq: number): sdf.Shape => {
      const ry = r * sq;
      return sdf.ellipsoid([r, ry, r * 0.92]).rotateY(r * 90).at(x, ry + 0.002, z);
    };
    k.body(
      'hummocks',
      sdf
        .union(hummock(-0.5, -0.55, 0.26, 0.36), hummock(0.48, -0.62, 0.21, 0.34), hummock(-0.05, -0.82, 0.18, 0.36))
        .paintFn((x, _y, z) => grassColor(x, z)),
      { color: C.grass, roughness: 0.9, metalness: 0, paintWeight: 2, detail: 0.03, maxTriangles: 800 },
    );

    // ------------------------------------------------------------------ stranded stones
    // Rounded pebbles straddling the waterline, half sunk so none float and none leave the
    // ground plane.
    const stone = (x: number, z: number, rs: number, yaw: number): sdf.Shape => {
      const ry = rs * 0.5;
      return sdf
        .ellipsoid([rs, ry, rs * 1.05])
        .rotateY(yaw)
        .at(x, ry + 0.002, z)
        .paintFn((px, py, pz, base) =>
          mixRgb(base, C.stoneDark, 0.2 + 0.35 * clamp01(noise.noise3(px * 55, py * 55, pz * 55))),
        );
    };
    k.body(
      'stones',
      sdf.union(
        stone(-0.78, 0.38, 0.055, 24),
        stone(-0.44, 0.33, 0.045, -30),
        stone(-0.08, 0.45, 0.085, 12),
        stone(0.28, 0.39, 0.05, 60),
        stone(0.64, 0.44, 0.065, -18),
        stone(0.08, 0.31, 0.034, 40),
      ),
      {
        color: C.stone,
        roughness: 0.88,
        metalness: 0,
        detail: 0.012,
        paintWeight: 2,
        maxTriangles: 1200,
        bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 2),
      },
    );
  },
});
