import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — cliff edge (catalog `architecture/landscape-parts/cliff-edge`).
 *
 * Role: a modular 2 m landscape tile the player walks on and looks at from above; it must read
 *   at 128 px from every direction. No rig, no clips.
 * Size: exactly 2 x 2 m in XZ, standing on y = 0. The grassy plateau top is at y = 1.5 over the
 *   -Z half (z in [-1, 0]); a rocky cliff face drops from the top to y = 0 along z = 0. The +Z
 *   half (z in [0, 1]) is a low flat grass apron at y = 0.09, so the tile forms a readable step.
 * One idea: thick turf icing droops over the lip of a warm brown rock cliff, with a protruding
 *   rock ledge and grass tufts breaking the silhouette. Exaggerate the turf overhang.
 * Shape language: round and soft dominant (chibi turf) over faceted rock (secondary).
 * Palette (60/30/10): grass #7ec850 / #4a8a3f / sun #a8d76c dominant; rock #8a6a4c / #5f4630 /
 *   light #a8835e secondary; pale gray pebbles #8a94a0 and a moss accent #3f7a35. Value plan:
 *   light green top, mid-brown cliff, dark crevices, bright tuft tips.
 * Materials: rock (roughness 0.92), turf (0.9), apron soil (0.92), tufts (0.85), pebbles (0.9).
 * Detail list: primary = plateau block + turf cap; secondary = cliff ledge, drooping turf lobes,
 *   apron and rubble toe; tertiary = worley rock plates, strata, grass grain, pebbles in `bump`.
 *   Focal point = the turf lip and the ledge with tufts.
 * Rig/animation: none.
 */

const HALF = 1.0; // tile half width along X and Z (2 m tile)
const TOP = 1.5; // grass plateau top height

const C = {
  grass: rgb('#7ec850'),
  grassDark: rgb('#4a8a3f'),
  grassDeep: rgb('#3c7133'),
  grassSun: rgb('#a8d76c'),
  rock: rgb('#82603f'),
  rockDark: rgb('#57402a'),
  rockDeep: rgb('#392718'),
  rockLight: rgb('#a07a52'),
  rockGray: rgb('#786757'),
  soil: rgb('#6b4a2c'),
  soilDark: rgb('#432c18'),
  moss: rgb('#3f7a35'),
  pebble: rgb('#8a94a0'),
  pebbleDark: rgb('#5b6570'),
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Repeat noise across the 2 m tile so opposite edges match when tiles sit side by side. */
function tileNoise(x: number, z: number, frequency: number, octaves: number, seed = 0): number {
  const u = (x + HALF) * 0.5;
  const v = (z + HALF) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves, seed);
  return lerp(lerp(sample(x, z), sample(x - 2, z), u), lerp(sample(x, z - 2), sample(x - 2, z - 2), u), v);
}

// ================================================================== rock mass

/** Lumpy rock relief. The tile box clamp keeps the x = ±1 faces flat for tiling. */
const rockDisp = (x: number, y: number, z: number): number =>
  noise.fbm(x * 2.6, y * 1.7, z * 2.6, 3, 5);

/** Plateau block with a rounded lip, cliff bulges, two ledges, and a rubble toe at the base. */
function rockMass() {
  const block = sdf.box([HALF * 2, 1.46, 1.0], 0.08).at(0, 0.73, -0.5);

  // Broad bulges that give the cliff face its chunky, rounded relief.
  const bulgeA = sdf.ellipsoid([0.72, 0.46, 0.22]).at(-0.3, 0.6, 0.0);
  const bulgeB = sdf.ellipsoid([0.6, 0.3, 0.18]).at(0.44, 1.05, -0.03);

  // Two shelves that stick out into +Z so the cliff reads as ledges, not a flat wall.
  const ledge = sdf.box([0.68, 0.16, 0.48], 0.06).at(0.26, 0.8, 0.14);
  const ledge2 = sdf.box([0.54, 0.14, 0.34], 0.05).at(-0.52, 0.42, 0.1);

  return block
    .smoothUnion(0.1, bulgeA)
    .smoothUnion(0.1, bulgeB)
    .smoothUnion(0.06, ledge)
    .smoothUnion(0.06, ledge2)
    .displace(0.02, rockDisp)
    .intersect(sdf.box([HALF * 2, 4, HALF * 2]))
    .intersect(sdf.halfSpace([0, -1, 0], 0));
}

/** Worley plates: tall cells with vertical grooves, shared by the paint and the normal map. */
function rockPlate(x: number, y: number, z: number): number {
  const w = noise.worley(x * 2.15, y * 1.05, z * 2.15, 11);
  return smooth(0.04, 0.24, w.f2 - w.f1); // 0 on a crack, 1 inside a plate
}

/** Worley rock plates with dark crevices, horizontal strata, and a moss crust near the lip. */
const rockPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const plate = rockPlate(x, y, z);
  const tint = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 2.1, z * 3.2, 3, 4);
  const crack = mixRgb(C.rockDark, C.rockDeep, 0.6);

  let c = mixRgb(C.rockDark, C.rock, 0.28 + 0.72 * tint);
  c = mixRgb(c, crack, (1 - plate) * 0.8); // cracked grooves set the plate outline
  c = mixRgb(c, C.rockLight, plate * 0.34); // lit plate centers

  // Horizontal strata bands: warmer and lighter near the top, darker low down.
  const band = 0.5 + 0.5 * noise.fbm(x * 1.3, y * 7.5, z * 1.3, 2, 19);
  const height = clamp01(y / TOP);
  c = mixRgb(c, C.rockLight, band * 0.2 * height);
  c = mixRgb(c, C.rockDeep, (1 - height) * 0.32);

  // Fine warm/cool grain so the large faces are not flat.
  const grain = noise.fbm(x * 11, y * 11, z * 11, 3, 23);
  c = mixRgb(c, C.rockDeep, clamp01(-grain) * 0.3);
  c = mixRgb(c, C.rockGray, clamp01(grain) * 0.18);

  // Moss crust: strongest just under the turf lip, in the upper crevices.
  const wet = smooth(0.9, 1.35, y) * (0.6 + 0.4 * clamp01(tileNoise(x, z, 3.2, 3, 31)));
  const wet2 = clamp01(tileNoise(x, z, 6.5, 2, 37)) * smooth(0.45, 0.95, y);
  c = mixRgb(c, C.moss, clamp01(wet) * 0.55 + wet2 * 0.2);
  return c;
};

// ================================================================== turf cap

// Turf lobes that droop over the lip: [x, bottom y, radius].
const DRIPS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.92, 1.24, 0.062],
  [-0.66, 1.33, 0.056],
  [-0.44, 1.14, 0.07],
  [-0.16, 1.38, 0.05],
  [0.08, 1.22, 0.064],
  [0.33, 1.34, 0.054],
  [0.56, 1.12, 0.072],
  [0.79, 1.28, 0.056],
  [0.95, 1.39, 0.046],
];

// Small turf domes on the plateau top: [x, z, radius].
const BUMPS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.56, -0.3, 0.16],
  [-0.18, -0.72, 0.13],
  [0.24, -0.34, 0.15],
  [0.6, -0.76, 0.12],
  [0.0, -0.12, 0.1],
  [-0.76, -0.82, 0.11],
  [0.76, -0.18, 0.1],
];

/** The turf: a rounded cap over the plateau, drooping lobes over the lip, and top domes. */
function turf() {
  const cap = sdf.box([HALF * 2, 0.3, 1.08], 0.09).at(0, TOP - 0.15, -0.46);
  const lobes = sdf.union(
    ...DRIPS.map(([x, bottom, r]) => sdf.capsule([x, TOP - 0.03, 0.0], [x, bottom, 0.05], r)),
  );
  const domes = sdf.union(
    ...BUMPS.map(([x, z, r]) => sdf.ellipsoid([r, 0.07, r * 0.92]).at(x, TOP - 0.04, z)),
  );
  return cap.smoothUnion(0.05, lobes).smoothUnion(0.05, domes);
}

const turfPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const patch = tileNoise(x, z, 2.1, 3, 3);
  const shade = clamp01(-patch * 2.4);
  const sun = clamp01((patch - 0.02) * 2.2);
  const speck = tileNoise(x, z, 11, 2, 7);

  let g = mixRgb(C.grass, C.grassDark, shade * 0.65);
  g = mixRgb(g, C.grassSun, sun * 0.4);
  g = mixRgb(g, C.grassSun, clamp01((speck - 0.1) * 2.2) * 0.25);

  // Sunlit on the flat top, darker down the drooping lobes.
  const lit = smooth(1.3, TOP, y);
  g = mixRgb(g, C.grassSun, lit * 0.3);
  g = mixRgb(g, C.grassDeep, (1 - lit) * 0.45);
  return g;
};

// ================================================================== apron

/**
 * Low grass apron on the +Z half. It tucks under the cliff (no seam) and rises in a soft bank
 * at the foot of the rock, so the cliff grows out of the turf instead of standing beside it.
 */
function apron() {
  const slab = sdf.box([HALF * 2, 0.09, 1.24], 0.03).at(0, 0.045, 0.38);
  const bank = sdf.capsule([-0.72, 0.0, 0.03], [0.72, 0.0, 0.03], 0.16);
  return slab.smoothUnion(0.06, bank).intersect(sdf.halfSpace([0, -1, 0], 0));
}

const apronPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const patch = tileNoise(x, z, 2.2, 3, 13);
  const fine = tileNoise(x, z, 8, 2, 17);
  let g = mixRgb(C.grassDark, C.grass, clamp01(0.3 + patch * 0.75));
  g = mixRgb(g, C.grassDark, 0.18);
  g = mixRgb(g, C.grassSun, clamp01(fine) * 0.28);
  // Slightly darker near the cliff foot, where the rock shadows the turf.
  g = mixRgb(g, C.grassDeep, smooth(0.35, 0.02, z) * 0.35);

  // Bare soil on the vertical sides, grass over the top.
  const soilMask = smooth(0.03, 0.075, y);
  const s = mixRgb(C.soil, C.soilDark, clamp01(0.2 + fine * 0.7));
  return mixRgb(s, g, soilMask);
};

// ================================================================== tufts and pebbles

// [x, z, base y, scale] — clumps on the plateau top, one on the ledge, two on the apron.
const TUFTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.86, -0.14, TOP, 1.0],
  [-0.6, -0.64, TOP, 0.8],
  [0.52, -0.88, TOP, 0.9],
  [0.86, -0.3, TOP, 0.72],
  [0.04, -0.94, TOP, 0.62],
  [0.3, 0.18, 0.88, 0.6], // on the ledge
  [-0.58, 0.68, 0.09, 0.55],
  [0.74, 0.52, 0.09, 0.5],
];

function tuft(tx: number, tz: number, baseY: number, s: number, seed: number): Sdf {
  const parts: Sdf[] = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const lean = (0.05 + 0.05 * noise.random(i, seed, 0.5, 3)) * s;
    const h = (0.17 + 0.09 * noise.random(i, seed, 1.5, 7)) * s;
    const r = 0.03 * s;
    const bx = tx + Math.cos(a) * 0.035 * s;
    const bz = tz + Math.sin(a) * 0.035 * s;
    parts.push(
      sdf.cone([bx, baseY - 0.02, bz], [bx + Math.cos(a) * lean, baseY + h, bz + Math.sin(a) * lean], r, 0.004),
    );
  }
  parts.push(sdf.sphere(0.045 * s).at(tx, baseY - 0.005, tz));
  return sdf.union(...parts);
}

const bladePaint = (x: number, y: number, z: number): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2, 9);
  const t = clamp01((y - 0.1) / 0.22);
  let c = mixRgb(C.grassDark, C.grass, clamp01(t * (0.7 + n * 0.3)));
  c = mixRgb(c, C.grassSun, clamp01((y - 0.34) / 0.08) * 0.4);
  return c;
};

// [x, z, radius, y] — a few pale pebbles at the cliff base and on the apron.
const PEBBLES: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.74, 0.2, 0.09, 0.07],
  [-0.4, 0.32, 0.07, 0.06],
  [0.5, 0.26, 0.1, 0.075],
  [0.86, 0.44, 0.06, 0.06],
  [0.12, 0.54, 0.075, 0.06],
];

const pebblePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 3, 21);
  const top = clamp01((y - 0.04) / 0.08);
  let c = mixRgb(C.pebbleDark, C.pebble, 0.3 + top * 0.7);
  c = mixRgb(c, C.pebbleDark, clamp01(-noise.fbm(x * 30, y * 30, z * 30, 2, 27)) * 0.4);
  return mixRgb(c, C.grassDark, clamp01(n - 0.55) * 0.5);
};

// ================================================================== asset

export default defineAsset({
  name: 'cliff-edge',
  description:
    'A 2 m square cliff-edge tile: a grassy plateau top at 1.5 m over the -Z half, a warm brown rock cliff face dropping to y = 0 along z = 0, with a ledge, turf drooping over the lip, grass tufts, and a low grass apron in front.',
  detail: 0.024,
  reference: 'docs/item-mockups/cliff-edge-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- rock
    k.body('rock', rockMass().paintFn(rockPaint), {
      color: C.rock,
      roughness: 0.92,
      metalness: 0,
      detail: 0.026,
      maxTriangles: 3000,
      maxError: 0.004,
      textureDensity: 2,
      bump: (x, y, z) => {
        const groove = clamp01(1 - rockPlate(x, y, z));
        return -0.018 * groove + 0.006 * noise.fbm(x * 12, y * 10, z * 12, 3, 41);
      },
    });

    // ---------------------------------------------------------------- turf
    k.body('turf', turf().paintFn(turfPaint), {
      color: C.grass,
      roughness: 0.9,
      metalness: 0,
      detail: 0.024,
      maxTriangles: 1150,
      maxError: 0.005,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.005 * tileNoise(x, z, 16, 3, 5),
    });

    // ---------------------------------------------------------------- apron
    k.body('apron', apron().paintFn(apronPaint), {
      color: C.grass,
      roughness: 0.92,
      metalness: 0,
      detail: 0.032,
      maxTriangles: 550,
      maxError: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.004 * tileNoise(x, z, 14, 2, 9),
    });

    // ---------------------------------------------------------------- tufts
    k.body(
      'tufts',
      sdf.union(...TUFTS.map(([x, z, by, s], i) => tuft(x, z, by, s, i * 1.7))).paintFn(bladePaint),
      {
        color: C.grass,
        roughness: 0.85,
        metalness: 0,
        detail: 0.01,
        maxTriangles: 550,
        maxError: 0.004,
        textureDensity: 2,
      },
    );

    // ---------------------------------------------------------------- pebbles
    k.body(
      'pebbles',
      sdf
        .union(
          ...PEBBLES.map(([x, z, r, y]) =>
            sdf
              .ellipsoid([r, r * 0.72, r * 1.05])
              .rotateY(20 + x * 40)
              .at(x, y, z),
          ),
        )
        .paintFn(pebblePaint),
      {
        color: C.pebble,
        roughness: 0.9,
        metalness: 0,
        detail: 0.03,
        maxError: 0.005,
        textureDensity: 2,
        bump: (x, y, z) => 0.0022 * noise.fbm(x * 22, y * 22, z * 22, 3, 7),
      },
    );
  },
});
