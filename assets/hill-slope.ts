/**
 * Modular grass hill-slope tile for the cozy chibi forest clearing (catalog
 * `architecture/landscape-parts/hill-slope`).
 *
 * Role: a background landscape tile the player walks on; must read at 128 px and join its
 *   neighbours without seams. No rig, no clips.
 * Size: exactly 2 m x 2 m in plan, standing on y = 0. The top rises from 0.06 m at the +Z edge
 *   to 1.06 m at the -Z edge (front faces +Z, so the low toe is in front). Sides are flat and
 *   the edge heights are exact, so tiles placed at 2 m intervals line up.
 * One idea: a grassy bank peeled up out of the earth, with a few soft mossy hummocks and a
 *   handful of tiny stones and wildflowers. Exaggerate the grass cap over the brown soil.
 * Shape language: round and soft (friendly) on a square tile footprint (sturdy).
 * Palette: grass #7ec850 / #4a8a3f, sunlit tips #a8d76c; soil #6b4a2c / #432c18;
 *   stones #8a94a0 / #5f666f; flowers white #eef0d8 and gold #f2c14e. Value plan: mid-green top
 *   (dominant), dark-earth sides, small bright accent at the blooms.
 * Materials: ground (grass + soil, roughness 0.9), stone (0.92), stems (0.8), blooms (0.65).
 * Detail list: (1) sloped earth wedge, (2) grass cap with a wavy soil line, (3) mossy hummocks,
 *   (4) three stones, (5) a wildflower cluster. Focal point: the hummocks and flowers.
 */

import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

const HALF = 1.0; // tile half width along X and Z (2 m tile)
const LOW_Y = 0.06; // top height at the +Z (front) edge
const HIGH_Y = 1.06; // top height at the -Z (back) edge
const SLOPE = (HIGH_Y - LOW_Y) / 2; // rise per metre along -Z
const MID_Y = (LOW_Y + HIGH_Y) / 2; // top height at z = 0
const TOP_N = Math.hypot(1, SLOPE);

/** Height of the undecorated sloped top surface at a given z. */
const topY = (z: number) => MID_Y - SLOPE * z;

const C = {
  grass: rgb('#7ec850'),
  grassDark: rgb('#4a8a3f'),
  grassLight: rgb('#a8d76c'),
  soil: rgb('#6b4a2c'),
  soilDark: rgb('#432c18'),
  soilMid: rgb('#5a3b22'),
  stone: rgb('#8a94a0'),
  stoneDark: rgb('#5f666f'),
  stem: rgb('#3d7a35'),
  bloomA: rgb('#eef0d8'),
  bloomB: rgb('#f2c14e'),
  bloomC: rgb('#e0533d'),
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/**
 * 2 m-periodic fbm. Blending the sample with its copies one tile away makes opposite edges
 * equal, so two tiles placed side by side paint a continuous pattern and never show a seam.
 */
function tileNoise(x: number, z: number, frequency: number, octaves: number, seed = 0): number {
  const u = (x + HALF) * 0.5;
  const v = (z + HALF) * 0.5;
  const s = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves, seed);
  return lerp(lerp(s(x, z), s(x - 2, z), u), lerp(s(x, z - 2), s(x - 2, z - 2), u), v);
}

// ================================================================== ground shape

/**
 * The bare tile: a 2 x 1.2 x 2 m box cut by the sloped top plane. Bottom sits on y = 0 and every
 * outer face is exactly on the tile boundary, so neighbours join flush.
 */
function tileWedge() {
  const box = sdf.box([HALF * 2, 1.2, HALF * 2]).at(0, 0.6, 0);
  const plane = sdf.halfSpace([0, 1, SLOPE], MID_Y / TOP_N);
  return sdf.intersect(box, plane);
}

// Rounded mossy hummocks, inset from the tile edges so the flat sides stay clean.
// [x, z, rx, ry, rz, bury]
const HUMPS: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [-0.54, -0.44, 0.24, 0.14, 0.20, 0.04],
  [0.47, -0.14, 0.18, 0.11, 0.16, 0.03],
  [0.08, 0.34, 0.26, 0.12, 0.21, 0.03],
  [-0.31, 0.56, 0.17, 0.09, 0.14, 0.025],
  [0.62, -0.70, 0.17, 0.10, 0.14, 0.06],
  [-0.72, 0.10, 0.16, 0.09, 0.14, 0.025],
];

// ================================================================== painting

/** Grass on top fading to bare soil down the sides, with a wavy, noisy soil line. */
function groundPaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const patch = tileNoise(x, z, 2.0, 3, 3); // large soft patches
  const fine = tileNoise(x, z, 7, 2, 7); // small speckle
  const t = clamp01(0.32 + patch * 0.75);
  let grass = mixRgb(C.grassDark, C.grass, t);
  grass = mixRgb(grass, C.grassLight, clamp01(fine) * 0.4);

  // Depth below the sloped surface: 0 on the top, growing down the vertical faces.
  const depth = topY(z) - y;
  const line = 0.2 + 0.06 * tileNoise(x, z, 1.4, 2, 21);
  const soilMask = sstep(line - 0.045, line + 0.045, depth);

  let soil = mixRgb(C.soil, C.soilMid, clamp01(0.5 + fine * 0.5));
  soil = mixRgb(soil, C.soilDark, sstep(0.4, 0.02, y)); // darker near the ground
  soil = mixRgb(soil, C.soilDark, 0.3 * clamp01(tileNoise(x, z, 3, 2, 41))); // damp patches

  return mixRgb(base, mixRgb(grass, soil, soilMask), 1); // fully override the base color
}

// ================================================================== stones and flowers

type Pt = readonly [number, number, number];

/** A few small stones, half buried in the slope. [x, z, scale] */
const STONES: ReadonlyArray<readonly [number, number, number]> = [
  [0.30, 0.62, 1.0],
  [-0.18, -0.02, 0.8],
  [0.66, 0.30, 0.68],
  [-0.62, -0.78, 0.9],
];

function stoneShape([x, z, s]: readonly [number, number, number]) {
  const r = 0.12 * s;
  const y = topY(z) - 0.32 * r;
  return sdf
    .ellipsoid([r * 1.1, r * 1.02, r])
    .displace(0.016 * s, (px, py, pz) => noise.fbm(px * 7, py * 7, pz * 7, 2))
    .at(x, y, z);
}

/** Mottled grey stone: lighter on top, darker in the crevices. */
function stonePaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const n = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 3);
  const moss = clamp01(noise.fbm(x * 5, y * 5, z * 5, 2)) * 0.35;
  let c = mixRgb(C.stone, C.stoneDark, n * 0.7);
  return mixRgb(c, C.grassDark, moss);
}

/** Wildflowers: [x, z, height, color]. */
const FLOWERS: ReadonlyArray<readonly [number, number, number, Rgb]> = [
  [-0.42, 0.16, 0.15, C.bloomA],
  [-0.28, 0.30, 0.12, C.bloomB],
  [-0.36, 0.40, 0.17, C.bloomA],
  [-0.20, 0.14, 0.13, C.bloomC],
  [-0.50, 0.30, 0.11, C.bloomB],
  [0.35, 0.55, 0.14, C.bloomA],
  [0.42, 0.62, 0.11, C.bloomB],
];

// ================================================================== asset

export default defineAsset({
  name: 'hill-slope',
  description:
    'A 2 m square modular grass slope tile rising from 0.06 m at the front to 1.06 m at the back, with soft mossy hummocks, small stones, and wildflowers.',
  detail: 0.03,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/hill-slope-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- ground
    let ground = tileWedge();
    for (const [x, z, rx, ry, rz, bury] of HUMPS) {
      const hump = sdf.ellipsoid([rx, ry, rz]).at(x, topY(z) + ry - bury, z);
      ground = ground.smoothUnion(0.07, hump);
    }
    k.body('ground', ground.paintFn(groundPaint), {
      color: C.grass,
      roughness: 0.9,
      detail: 0.03,
      maxError: 0.012,
      paintWeight: 2,
      bump: (x, y, z) =>
        topY(z) - y < 0.12 ? 0.006 * tileNoise(x, z, 16, 3, 5) : 0.003 * tileNoise(x, z, 10, 2, 9),
    });

    // ---------------------------------------------------------------- stones
    k.body('stones', sdf.union(...STONES.map(stoneShape)).paintFn(stonePaint), {
      color: C.stone,
      roughness: 0.92,
      detail: 0.02,
      maxError: 0.01,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 22, y * 22, z * 22, 2),
    });

    // ---------------------------------------------------------------- flowers
    const stems = sdf.union(
      ...FLOWERS.map(([x, z, h]) =>
        sdf.capsule([x, topY(z) - 0.01, z], [x, topY(z) + h, z], 0.01),
      ),
    );
    k.body('stems', stems, { color: C.stem, roughness: 0.8, detail: 0.012, maxError: 0.006 });

    const blooms = sdf.union(
      ...FLOWERS.map(([x, z, h, col]) =>
        sdf
          .sphere(0.032)
          .paint(col)
          .at(x, topY(z) + h + 0.012, z)
          .union(sdf.sphere(0.014).paint(C.bloomB).at(x, topY(z) + h + 0.04, z)),
      ),
    );
    k.body('blooms', blooms, { color: C.bloomA, roughness: 0.65, detail: 0.014, maxError: 0.006 });
  },
});
