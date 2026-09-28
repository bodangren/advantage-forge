import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * marsh-ground — a 2 x 2 m modular marsh tile (architecture/landscape-parts/marsh-ground).
 *
 * Role: background ground tile that butts against neighbour tiles; read top-down and at 128 px.
 * Size: 2 x 2 m, 0.06 m thick, top at y = 0.06, edges at x = +-1 and z = +-1, on y = 0, faces +Z.
 * The one idea: dark wet mud holding two still, sky-blue pools; tall green reed tufts break the
 *   flat silhouette and the pools are the bright focal point.
 * Shape language: square modular slab (reliable) plus round pools and soft blade tufts (friendly).
 * Value plan: dominant dark mud #46331f with #2c1f12 shade and #6b5030 dried patches; water
 *   #3fa8c8 mid-light; reed/moss green #7ec850 accent. Squint: the pools read first.
 * Palette (contract): mud #46331f / #2c1f12 / #6b5030, wet algae rim #4f6a38,
 *   water #7fd2e6 -> #2c7b96, reeds #4a8a3f -> #7ec850 -> #a8dd6c, moss #2f7a3f / #4a8a3f,
 *   pebbles #8a94a0 / #5f666e.
 * Materials: mud (roughness 0.7, damp sheen), water (roughness 0.1, opacity 0.9),
 *   reeds (roughness 0.8), moss (roughness 0.9), pebbles (roughness 0.85). No emissive.
 * Detail list: slab + carved pools (big), two water surfaces (focal), four reed tufts (medium),
 *   five moss patches and four pebbles (small), mud paint + bump (tertiary).
 * Rig/animation: none.
 */

const TILE = 2.0; // tile footprint (m)
const TOP = 0.06; // slab thickness / mud surface height
const WATER_Y = 0.047; // water surface, 1.3 cm below the mud

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------ colors
const MUD = rgb('#4f3a24'); // wet mud — dominant, dark
const MUD_DARK = rgb('#312317'); // soaking-wet crevices — darkest
const MUD_DRY = rgb('#7a5c38'); // dried crust on the high spots — lightest
const MUD_ALGAE = rgb('#4f6a38'); // green slime where the mud meets the water

const WATER_SHALLOW = rgb('#7fd2e6'); // bright rim at the banks
const WATER_MID = rgb('#3fa8c8'); // contract water blue
const WATER_DEEP = rgb('#2c7b96'); // pool centre
const WATER_SILT = rgb('#bfe6ee'); // pale silt veins drifting on the surface

const REED_DARK = rgb('#3f7a36');
const REED_MID = rgb('#7ec850');
const REED_TIP = rgb('#a8dd6c');

const MOSS_DARK = rgb('#2f7a3f');
const MOSS_MID = rgb('#4a8a3f');
const MOSS_TIP = rgb('#7ec850');

const STONE = rgb('#8a94a0');
const STONE_DARK = rgb('#5f666e');

// ------------------------------------------------------------------ tiling noise
// Blend a 3-octave fbm across the 2 m cell so opposite painted edges match: this keeps the mud
// color seamless when tiles repeat.
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function tileNoise(x: number, z: number, frequency: number, octaves: number, seed = 0): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves, seed);
  return lerp(
    lerp(sample(x, z), sample(x - 2, z), u),
    lerp(sample(x, z - 2), sample(x - 2, z - 2), u),
    v,
  );
}

// ------------------------------------------------------------------ pools
interface Pool {
  readonly cx: number;
  readonly cz: number;
  readonly rx: number;
  readonly rz: number;
  readonly depth: number;
}

// Two shallow pools, both kept well inside the tile so repeats have no seam. The big one sits
// back-left; the small one front-right. Together they own the top surface.
const POOLS: readonly Pool[] = [
  { cx: -0.2, cz: 0.05, rx: 0.62, rz: 0.5, depth: 0.032 },
  { cx: 0.62, cz: -0.55, rx: 0.3, rz: 0.28, depth: 0.026 },
];

/** Normalised radius to a pool: 1 on the carve rim, 0 at its centre. */
function poolRadius(p: Pool, x: number, z: number): number {
  return Math.hypot((x - p.cx) / p.rx, (z - p.cz) / p.rz);
}

/** A damp algae/darkening ring where the mud meets the water. */
function poolRimWeight(x: number, z: number): number {
  let w = 0;
  for (const p of POOLS) {
    const r = poolRadius(p, x, z);
    w = Math.max(w, clamp01(1 - Math.abs(r - 1.04) / 0.3));
  }
  return w;
}

// ------------------------------------------------------------------ mud paint
function mudColorAt(x: number, y: number, z: number): Rgb {
  const topness = clamp01((y - 0.028) / 0.028); // full detail on top, less on the slab sides

  const big = tileNoise(x, z, 1.7, 3, 3); // large wet / dry patches
  const mid = tileNoise(x, z, 5.0, 2, 19); // medium clumps
  const fine = tileNoise(x, z, 16, 2, 41); // grit speckle

  let c = MUD;
  c = mixRgb(c, MUD_DARK, clamp01((0.0 - big) * 2.6) * 0.85); // soaking hollows
  c = mixRgb(c, MUD_DRY, clamp01((big - 0.08) * 2.4) * 0.55); // dried crust
  c = mixRgb(c, MUD_DARK, clamp01((0.0 - mid) * 2.4) * 0.35 * topness);
  c = mixRgb(c, MUD_DRY, clamp01((fine - 0.2) * 3.0) * 0.18 * topness);
  c = mixRgb(c, MUD_ALGAE, poolRimWeight(x, z) * 0.55 * topness);

  // Deep grit: sparse light specks so the mud reads damp, not flat.
  const grit = tileNoise(x, z, 34, 2, 123);
  c = mixRgb(c, MUD_DRY, clamp01((Math.abs(grit) - 0.35) * 5) * 0.2 * topness);

  // Sides and bottom sit in shadow so the slab reads as one solid mass.
  if (topness < 1) c = mixRgb(c, MUD_DARK, (1 - topness) * 0.55);
  return c;
}

// ------------------------------------------------------------------ water paint
function waterColorAt(x: number, y: number, z: number): Rgb {
  let r = Infinity;
  for (const p of POOLS) r = Math.min(r, poolRadius(p, x, z));
  const n = 0.5 + 0.5 * tileNoise(x, z, 3.5, 2, 7);
  let c = mixRgb(WATER_DEEP, WATER_SHALLOW, smoothstep(0.45, 1.0, r));
  c = mixRgb(c, WATER_DEEP, 0.12 * n);
  // Slight tone drift so the surface is not perfectly uniform.
  c = mixRgb(c, WATER_MID, 0.3 * (0.5 + 0.5 * noise.fbm(x * 2.2, 0, z * 2.2, 2, 5)));
  // Faint pale silt veins: thin drifts of sediment on the still water, matching the mock.
  const vein = noise.fbm(x * 3.2, 0, z * 3.2, 2, 31);
  c = mixRgb(c, WATER_SILT, clamp01(1 - Math.abs(vein) / 0.05) * 0.3);
  return c;
}

// ------------------------------------------------------------------ reeds
interface Blade {
  readonly base: readonly [number, number, number];
  readonly tip: readonly [number, number, number];
  readonly r: number;
  readonly s: number; // per-blade seed
}

/** One clump: an upright centre blade plus leaning blades fanning outward. */
function clump(cx: number, cz: number, seed: number, scale: number): Blade[] {
  const n = 6;
  const out: Blade[] = [];
  for (let i = 0; i < n; i++) {
    const upright = i === 0;
    const a = ((i * 360) / n + seed * 41) * (Math.PI / 180);
    const leanDeg = upright ? 6 + noise.random(i, seed) * 8 : 26 + noise.random(i, seed + 5) * 26;
    const h = (upright ? 0.24 : 0.12 + noise.random(i, seed + 3) * 0.09) * scale;
    const baseY = TOP - 0.02;
    const off = upright ? 0 : 0.035;
    const bx = cx + Math.cos(a) * off;
    const bz = cz + Math.sin(a) * off;
    const lean = leanDeg * (Math.PI / 180);
    const tip: [number, number, number] = [
      bx + (upright ? 0 : Math.sin(lean) * h * Math.cos(a)),
      baseY + Math.cos(lean) * h,
      bz + (upright ? 0 : Math.sin(lean) * h * Math.sin(a)),
    ];
    out.push({ base: [bx, baseY, bz], tip, r: (upright ? 0.024 : 0.019) * scale, s: seed + i });
  }
  return out;
}

// Four tufts on the mud banks around the pools, kept clear of the water.
const BLADES: readonly Blade[] = [
  ...clump(-0.62, 0.52, 3, 1.2),
  ...clump(0.08, -0.55, 11, 1.1),
  ...clump(0.72, -0.16, 23, 1.0),
  ...clump(0.36, 0.68, 37, 0.9),
];

function bladeShape(b: Blade): Sdf {
  return sdf.cone([b.base[0], b.base[1], b.base[2]], [b.tip[0], b.tip[1], b.tip[2]], b.r, 0.004);
}

function reedColorAt(x: number, y: number, z: number): Rgb {
  const t = clamp01((y - TOP) / 0.16); // 0 at the mud, 1 at the tallest tip
  const v = 0.5 + 0.5 * noise.fbm(x * 20 + 5, y * 20, z * 20, 2, 9);
  let c = mixRgb(REED_DARK, REED_MID, clamp01(0.25 + t * 0.95 + (v - 0.5) * 0.35));
  c = mixRgb(c, REED_TIP, clamp01((t - 0.6) / 0.4) * (0.35 + v * 0.3));
  return c;
}

// ------------------------------------------------------------------ moss patches
const MOSS_SPOTS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.78, -0.5, 0.14],
  [0.02, 0.78, 0.13],
  [-0.06, -0.78, 0.14],
  [0.8, 0.32, 0.12],
  [-0.8, 0.56, 0.11],
];

function mossShape(): Sdf {
  const blobs = MOSS_SPOTS.map(([x, z, r]) =>
    sdf.ellipsoid([r, 0.018, r * 0.85]).at(x, TOP - 0.004, z),
  );
  return sdf.union(...blobs);
}

function mossColorAt(x: number, y: number, z: number): Rgb {
  const t = clamp01((y - (TOP - 0.012)) / 0.024);
  const v = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 24, 2, 17);
  let c = mixRgb(MOSS_DARK, MOSS_MID, clamp01(0.3 + t * 0.9 + (v - 0.5) * 0.4));
  c = mixRgb(c, MOSS_TIP, clamp01((t - 0.55) / 0.45) * (0.3 + v * 0.3));
  return c;
}

// ------------------------------------------------------------------ pebbles
const PEBBLES: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.86, -0.15, 0.05, 1.1],
  [0.26, -0.84, 0.045, 0.9],
  [0.88, -0.3, 0.04, 0.8],
  [-0.52, 0.82, 0.042, 1.0],
];

function pebbleShape(): Sdf {
  return sdf.union(
    ...PEBBLES.map(([x, z, r, yaw]) =>
      sdf
        .ellipsoid([r * 1.2, r * 0.8, r])
        .rotateY(yaw * 40)
        .at(x, TOP - 0.006, z)
        .displace(0.006, (px, py, pz) => noise.fbm(px * 9, py * 9, pz * 9, 2, 21)),
    ),
  );
}

function pebbleColorAt(x: number, y: number, z: number, base: Rgb): Rgb {
  let c = mixRgb(base, STONE_DARK, 0.35 + 0.3 * noise.fbm(x * 14, y * 14, z * 14, 2, 23));
  // A little green slime on the underside, wet marsh stones.
  return mixRgb(c, MOSS_DARK, clamp01((TOP - 0.01 - y) / 0.02) * 0.35);
}

// ------------------------------------------------------------------ asset
export default defineAsset({
  name: 'marsh-ground',
  description:
    'A 2 m square modular marsh tile: dark wet mud with two still sky-blue pools, green reed tufts, moss patches and a few pebbles.',
  detail: 0.012,
  reference: 'docs/item-mockups/marsh-ground-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Square slab, 2 x 0.06 x 2 m. Bottom at y = 0, top at y = 0.06, square outer edge so
    // neighbouring tiles meet with no shaded gap. Gentle wet-mud relief fades to zero at the
    // tile edges, so repeated tiles stay flush and seamless.
    const mudRelief = (x: number, y: number, z: number): number => {
      const top = clamp01((y - 0.03) / 0.03);
      const edge =
        Math.min(smoothstep(0, 0.14, 1 - Math.abs(x)), smoothstep(0, 0.14, 1 - Math.abs(z)));
      return top * edge * tileNoise(x, z, 6, 3, 61);
    };
    const mud = sdf
      .box([TILE, TOP, TILE], 0.006)
      .at(0, TOP / 2, 0)
      .displace(0.009, mudRelief, 0.6)
      .intersect(sdf.box([TILE, TOP, TILE]).at(0, TOP / 2, 0))
      .smoothSubtract(
        0.01,
        ...POOLS.map((p) => sdf.ellipsoid([p.rx, p.depth, p.rz]).at(p.cx, TOP, p.cz)),
      )
      .paintFn(mudColorAt);

    k.body('mud', mud, {
      color: MUD,
      roughness: 0.7,
      metalness: 0,
      detail: 0.012,
      textureDensity: 2,
      maxTriangles: 1600,
      maxError: 0.0025,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 22, y * 22, z * 22, 2, 71),
    });

    // Water: flat elliptical discs sunk into the carved pools, wide enough to tuck under the mud
    // lip so no gap shows. Glossy so the pools catch the sky.
    const water = sdf.union(
      ...POOLS.map((p) =>
        sdf
          .ellipsoid([p.rx * 1.06, 0.05, p.rz * 1.06])
          .at(p.cx, TOP, p.cz)
          .intersect(sdf.box([TILE, 0.03, TILE]).at(p.cx, WATER_Y - 0.015, p.cz)),
      ),
    );
    k.body('water', water.paintFn(waterColorAt), {
      color: WATER_MID,
      roughness: 0.1,
      metalness: 0,
      detail: 0.016,
      paintWeight: 2,
      opacity: 0.9,
      maxTriangles: 500,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 30, y * 20, z * 30, 2, 3),
    });

    // Reed tufts: the silhouette breakers and the green accent.
    k.body('reeds', sdf.smoothUnion(0.006, ...BLADES.map(bladeShape)).paintFn(reedColorAt), {
      color: REED_MID,
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 1400,
    });

    // Moss patches creeping over the wet mud.
    k.body('moss', mossShape().paintFn(mossColorAt), {
      color: MOSS_MID,
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      paintWeight: 2,
      maxTriangles: 900,
      maxError: 0.006,
      bump: (x, y, z) => 0.0024 * noise.fbm(x * 30, y * 30, z * 30, 2, 13),
    });

    // A few rounded pebbles half-sunk in the mud at the pool banks.
    k.body('pebbles', pebbleShape().paintFn(pebbleColorAt), {
      color: STONE,
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 350,
    });
  },
});
