import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — valley slope (catalog `architecture/landscape-parts/valley-slope`).
 *
 * Role: modular 2 m terrain tile for the chibi hamlet / forest map, read from above and at
 *   128 px. It is a valley "dip" that sits between raised banks, so the player walks down into it.
 * Size: exactly 2 x 2 m in XZ, standing on y = 0. The top surface is a channel that runs along Z:
 *   0.6 m high at the -X and +X edges, dipping to 0.06 m along the middle. Edges at x = ±1 are
 *   vertical walls, so tiles chain in X; the z = ±1 cross-section repeats in Z.
 * One idea: a soft grassy bowl with a few cool gray stones resting on its floor — the stones are
 *   the focal point and the value contrast, the grass is the calm rest area.
 * Shape language: round and soft (smooth bowl, gumdrop stones) in a square modular slab.
 * Palette (60/30/10): grass #7ec850 dominant with #4a8a3f shade and #a8d76c sun flecks; earth
 *   side #8a5a35 / #5f3d22 secondary; stone #8a94a0 accent. Value plan: sunlit crests light,
 *   floor mid-dark, earth dark, stones light and cool.
 * Materials: one `slab` body (grass over soil, roughness 0.9), one `stones` body (granite,
 *   roughness 0.9), one `blades` body (grass tufts, roughness 0.85). No metal, no emissive.
 * Detail list: primary = the valley form; secondary = the wavy grass/earth boundary and stones;
 *   tertiary = grass grain and stone speckle in `bump`. Focal point = the stones.
 * Rig/animation: none (static ground).
 */

const HALF = 1; // tile half width: 2 m tile
const TOP = 0.6; // surface height at the -X and +X edges
const FLOOR = 0.06; // surface height in the middle
const RC = 0.06; // rounded crest radius at the top of the outer walls
const PLATEAU = HALF - RC; // x where the valley top meets the crest round
const LUMP_AMP = 0.018; // gentle unevenness on the bowl surface only

const C = {
  grass: rgb('#7ec850'), // dominant sunny green (contract)
  grassDark: rgb('#4a8a3f'), // shade patches (contract)
  grassSun: rgb('#a8d76c'), // pale sunlit flecks
  grassDeep: rgb('#3c7133'), // lusher green, in the valley floor
  earth: rgb('#8a5a35'), // cut soil, upper band (contract bark family)
  earthDeep: rgb('#5f3d22'), // cut soil, lower band
  earthLight: rgb('#a9764a'), // dry soil highlight
  blade: rgb('#4a9a4f'), // tuft blades, between the two greens
  stone: rgb('#8a94a0'), // granite accent (contract)
  stoneDark: rgb('#5b6570'),
  stoneLight: rgb('#b3bcc6'),
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Smoothstep on [0, 1]: flat at the floor and flat at the rim. */
const sat = (t: number): number => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};

/** Repeat noise across the 2 m tile so opposite painted edges match for seamless tiling. */
function tileNoise(x: number, z: number, frequency: number, octaves: number): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves);
  return lerp(
    lerp(sample(x, z), sample(x - 2, z), u),
    lerp(sample(x, z - 2), sample(x - 2, z - 2), u),
    v,
  );
}

/** The valley cross-section: radius-like profile from the middle (0.06) up to the rim (0.6). */
const valleyY = (x: number): number => FLOOR + (TOP - FLOOR) * sat(Math.min(Math.abs(x) / PLATEAU, 1));

/** Lumps fade to zero at every tile edge, so the boundary faces stay exact for tiling. */
const edgeFall = (x: number, z: number): number =>
  smooth(0.03, 0.3, Math.min(1 - Math.abs(x), 1 - Math.abs(z)));

const lumpField = (x: number, z: number): number => clamp(tileNoise(x, z, 1.8, 3) * 1.7, -1, 1);

/** Real surface height, including the gentle lumps. Tufts and stones sit on this. */
const surfaceHeight = (x: number, z: number): number =>
  valleyY(x) + LUMP_AMP * lumpField(x, z) * edgeFall(x, z);

/**
 * Closed outline of the tile cross-section, in the XY plane, counter-clockwise: flat bottom,
 * a vertical outer wall, a small rounded crest, the smooth valley top, the mirrored crest and
 * wall. Extruded along Z this is the whole solid.
 */
function valleyProfile(): [number, number][] {
  const pts: [number, number][] = [];
  pts.push([-HALF, 0]);
  pts.push([HALF, 0]);
  pts.push([HALF, TOP - RC]);
  const arcSteps = 6;
  for (let i = 1; i <= arcSteps; i++) {
    const a = (Math.PI / 2) * (i / arcSteps);
    pts.push([HALF - RC + RC * Math.cos(a), TOP - RC + RC * Math.sin(a)]);
  }
  const topSteps = 46;
  for (let i = 1; i <= topSteps; i++) {
    const x = PLATEAU - 2 * PLATEAU * (i / topSteps);
    pts.push([x, valleyY(x)]);
  }
  for (let i = 1; i <= arcSteps; i++) {
    const a = (Math.PI / 2) * (1 + i / arcSteps);
    pts.push([-(HALF - RC) + RC * Math.cos(a), TOP - RC + RC * Math.sin(a)]);
  }
  return pts;
}

// ------------------------------------------------------------------ slab paint
/** Grass over soil. A wavy boundary lets the turf drape a little over the crest, like the mock. */
const slabPaint = (x: number, y: number, z: number): Rgb => {
  const surf = surfaceHeight(x, z);
  // Lobed grass drape: deeper at the crest, with a broad wavy lower edge like thick turf.
  const lobe = 0.5 + 0.5 * tileNoise(x, z, 1.3, 2);
  const fringe = 0.05 + 0.055 * lobe;
  const dirt = smooth(fringe - 0.03, fringe + 0.03, surf - y); // 0 in grass, 1 in soil

  const patch = tileNoise(x, z, 1.9, 3);
  const shade = clamp01(-patch * 2.4);
  const sun = clamp01((patch - 0.03) * 2.2);
  const speck = tileNoise(x, z, 12, 2);
  let g = mixRgb(C.grass, C.grassDark, shade * 0.6);
  g = mixRgb(g, C.grassSun, sun * 0.4);
  g = mixRgb(g, C.grassSun, clamp01((speck - 0.12) * 2.2) * 0.22);
  g = mixRgb(g, C.grassDeep, 0.3 * (1 - smooth(0.06, 0.28, surf))); // lusher in the floor
  g = mixRgb(g, C.grassSun, 0.22 * smooth(0.38, TOP, surf)); // sunlit crests

  const depth = clamp01((0.3 - y) / 0.3); // lower soil is darker
  let s = mixRgb(C.earth, C.earthDeep, 0.15 + depth * 0.7);
  const strata = tileNoise(x, z, 5.5, 2);
  s = mixRgb(s, C.earthLight, clamp01(strata) * 0.18 * (1 - depth));
  s = mixRgb(s, C.earthDeep, clamp01(tileNoise(x, z, 15, 2)) * 0.12);

  return mixRgb(s, g, 1 - dirt);
};

const slabBump = (x: number, y: number, z: number): number => {
  const top = 1 - smooth(0.0, 0.035, surfaceHeight(x, z) - y); // 1 on the grass, 0 on the walls
  return top * (0.0024 * tileNoise(x, z, 26, 3) + 0.0012 * tileNoise(x, z, 9, 2));
};

// ------------------------------------------------------------------ stones
// [x, z, radius, squash, spinDeg] — a loose scatter down the middle of the valley.
const STONES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0.02, -0.62, 0.13, 0.7, 18],
  [-0.12, -0.16, 0.16, 0.66, -26],
  [0.09, 0.24, 0.1, 0.78, 42],
  [-0.06, 0.66, 0.14, 0.72, -8],
  [0.33, 0.44, 0.085, 0.86, 63],
];

function stoneShape(i: number): ReturnType<typeof sdf.ellipsoid> {
  const [sx, sz, r, sq, deg] = STONES[i]!;
  const base = surfaceHeight(sx, sz);
  return sdf
    .ellipsoid([r, r * sq, r * 1.15])
    .rotateY(deg)
    .at(sx, base + r * sq * 0.55, sz);
}

const stonePaint = (x: number, y: number, z: number): Rgb => {
  const top = clamp01((y - 0.03) / 0.12);
  let c = mixRgb(C.stoneDark, C.stone, 0.35 + top * 0.65);
  c = mixRgb(c, C.stoneLight, top * clamp01(noise.fbm(x * 6, y * 6, z * 6, 2, 4)) * 0.5);
  c = mixRgb(c, C.stoneDark, clamp01(noise.fbm(x * 30, y * 30, z * 30, 3, 11)) * 0.4);
  // A faint moss crust on the damp lower half of a stone or two.
  const moss = clamp01((0.5 + 0.5 * tileNoise(x, z, 3.4, 3) - 0.45) * 3) * clamp01(1 - top);
  c = mixRgb(c, C.grassDeep, moss * 0.45);
  return c;
};

// ------------------------------------------------------------------ grass tufts
// [x, z, scale] — a few plump clumps on the floor and lower slope, kept off the crests.
const TUFTS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.42, -0.5, 0.9],
  [0.34, -0.88, 0.8],
  [-0.34, 0.34, 0.85],
  [0.46, 0.72, 0.75],
];

function tuft(i: number): ReturnType<typeof sdf.cone> {
  const [tx, tz, s] = TUFTS[i]!;
  const baseY = surfaceHeight(tx, tz) - 0.02;
  return sdf.union(
    sdf.cone([tx, baseY, tz], [tx - 0.03 * s, baseY + 0.16 * s, tz + 0.02 * s], 0.032 * s, 0.003),
    sdf.cone([tx + 0.03 * s, baseY, tz - 0.01 * s], [tx + 0.05 * s, baseY + 0.12 * s, tz - 0.03 * s], 0.026 * s, 0.003),
    sdf.cone([tx - 0.02 * s, baseY, tz - 0.03 * s], [tx - 0.05 * s, baseY + 0.1 * s, tz - 0.05 * s], 0.022 * s, 0.003),
  );
}

const bladePaint = (x: number, y: number, z: number): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 24, 2, 9);
  let c = mixRgb(C.grassDark, C.grass, clamp01((y - 0.05) / 0.14) * (0.7 + n * 0.3));
  c = mixRgb(c, C.grassSun, clamp01((y - 0.18) / 0.06) * 0.35);
  return c;
};

export default defineAsset({
  name: 'valley-slope',
  description:
    'Modular 2 m grass valley tile: a soft grassy channel dipping from 0.6 m at the ±X edges to 0.06 m in the middle, with a few stones on the floor; stands on y = 0.',
  detail: 0.02,
  reference: 'docs/item-mockups/valley-slope-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ slab
    // The whole solid is the extruded cross-section, then only the bowl surface gets gentle
    // lumps (they fade at every edge, so the tiling faces stay exact).
    const ext = sdf
      .extrude(profile.polygon(valleyProfile()), 2, 0.012)
      .displace(LUMP_AMP, (x, y, z) => lumpField(x, z) * edgeFall(x, z) * smooth(0.05, 0.015, valleyY(x) - y), 1.4)
      .paintFn(slabPaint);

    k.body('slab', ext, {
      color: C.grass,
      roughness: 0.9,
      metalness: 0,
      detail: 0.028,
      maxTriangles: 2600,
      maxError: 0.0025,
      textureDensity: 2,
      paintWeight: 2,
      bump: slabBump,
    });

    // ------------------------------------------------------------------ stones
    k.body('stones', sdf.union(...STONES.map((_, i) => stoneShape(i))).paintFn(stonePaint), {
      color: C.stone,
      roughness: 0.9,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 600,
      maxError: 0.003,
      textureDensity: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 22, y * 22, z * 22, 3, 7),
    });

    // ------------------------------------------------------------------ tufts
    k.body('blades', sdf.union(...TUFTS.map((_, i) => tuft(i))).paintFn(bladePaint), {
      color: C.blade,
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 700,
      maxError: 0.003,
      textureDensity: 2,
    });
  },
});
