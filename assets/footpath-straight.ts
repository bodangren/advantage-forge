import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Forest footpath straight — catalog id `architecture/landscape-parts/footpath-straight`.
 * A modular 2 m x 2 m ground tile for the sunny forest set: a narrow dirt footpath about
 * 1 m wide runs straight along Z, centered on X, between bright grass shoulders. It swaps
 * 1:1 with the hamlet dirt-road tiles: same 2 m footprint, same 0.3 m slab with the top
 * surface at y = 0 (0.3 m slab) (the "about 0.1 m" tile height of the hamlet kit), clean square edges.
 *
 * One idea: a soft, foot-worn tan trail that wanders gently and melts into shaded forest
 * floor (forest-ground styling) — wheel-free, so the wear is a subtle darker center patch
 * instead of cart ruts.
 *
 * Palette (forest contract, 55/35/10):
 *   grass  #4a8a3f shaded forest-floor base, #2f7a3f deep pockets, #7ec850 sunny dapples,
 *          fallen-leaf specks #c8a86b / #8a5a35 (matches forest-ground)
 *   dirt   #c8a86b warm tan base, #b18c52 darker foot wear, #d9bd85 light grain (focal)
 *   stones #8a94a0 cool gray pebbles, #6f7883 dark tint                     (small accent)
 *
 * Materials: one terrain body (roughness 0.95, all grain in `bump`), one pebble body
 * (roughness 0.85). Relief pebbles half-sunk in the path for 3D interest at sprite size.
 * The painted path edge and the wear noise are world-periodic over 2 m, so the path
 * continues seamlessly onto neighboring tiles in every direction. No rig, no animation.
 */

const TILE = 2; // grid size in meters
const TOP = 0; // walkable top at y = 0 (the slab goes down to y = -0.3)
const PATH_HALF = 0.5; // footpath is ~1.0 m wide along the full Z length

const GRASS = rgb('#4a8a3f'); // shaded forest-floor green — dominant (matches forest-ground)
const GRASS_DARK = rgb('#2f7a3f'); // deep shade pockets
const GRASS_LIGHT = rgb('#7ec850'); // sparse sunny dapples where the canopy opens
const LEAF_PALE = rgb('#c8a86b'); // fallen-leaf specks and blobs, light
const LEAF_BROWN = rgb('#8a5a35'); // fallen-leaf specks and blobs, mid
const LEAF_DEEP = rgb('#5f3d22'); // fallen-leaf blobs, dark
const DIRT = rgb('#c8a86b');
const DIRT_WEAR = rgb('#b18c52');
const DIRT_LIGHT = rgb('#d9bd85');
const EDGE = rgb('#8f8a4e'); // shadowed fringe where the trail sinks into the grass
const STONE = rgb('#8a94a0');
const STONE_DARK = rgb('#6f7883');


const SLAB = 0.3; // ground tile depth: top at y = 0, bottom at y = -0.3
const EDGE_OVERLAP = 0.001; // 1 mm of overlap so neighbours never show a gap
const SOIL = rgb('#7a4a2a'); // side soil
const SOIL_DARK = rgb('#57331d'); // soil strata and the lower side
const PEBBLE_SIDE = rgb('#9a8a78'); // small stones in the soil

/** Side color: the top paint as a lip with a wavy drip edge, over soil strata. */
const sideColorAt = (x: number, y: number, z: number, top: (x: number, z: number) => ReturnType<typeof rgb>) => {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return top(x, z);
  const depth = -y / SLAB;
  let c = mixRgb(SOIL, SOIL_DARK, 0.15 + depth * 0.55);
  const strata = Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
  c = mixRgb(c, SOIL_DARK, Math.max(0, strata - 0.6) * 0.8);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, PEBBLE_SIDE, Math.min(1, (n - 0.45) * 6) * 0.8);
  return c;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Noise that repeats over the 2 m tile so opposite painted edges match when tiled. */
const tileNoise = (x: number, z: number, y: number, frequency: number, octaves: number) => {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, y, sz * frequency, octaves);
  return lerp(lerp(sample(x, z), sample(x - 2, z), u), lerp(sample(x, z - 2), sample(x - 2, z - 2), u), v);
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/**
 * Path coverage in [0, 1]: 1 inside the trail, 0 on the grass. The edge wanders a little
 * more than the hamlet road (a woodland trail is untended) and fades over ~10 cm. The
 * wobble is periodic over 2 m, so it continues across neighboring tiles.
 */
const pathMask = (x: number, z: number) => {
  const wobble = 0.045 * tileNoise(0.7, z, 3.1, 1.8, 2);
  const d = Math.abs(x) - (PATH_HALF + wobble);
  return 1 - smoothstep(-0.04, 0.06, d);
};

/** Warm packed tan: big value patches, fine light grain, soft darker foot wear. */
const dirtColor = (x: number, z: number) => {
  const patch = tileNoise(x, z, 1.3, 4.5, 2);
  const grain = tileNoise(x, z, 5, 34, 2);
  let c = mixRgb(DIRT, DIRT_WEAR, clamp01(0.35 + 0.4 * patch));
  if (grain > 0.26) c = mixRgb(c, DIRT_LIGHT, 0.5);
  // Foot wear: two subtle darker patches where walkers step, coming and going along the
  // trail — deliberately not continuous wheel ruts.
  const wearFlow = clamp01(0.55 + 0.45 * tileNoise(x, z, 2.2, 2.2, 2));
  const step = Math.exp(-(((Math.abs(x) - 0.15) / 0.09) ** 2));
  c = mixRgb(c, DIRT_WEAR, 0.32 * step * wearFlow);
  return c;
};

/** Shaded forest floor (forest-ground styling): deep shade pockets, sparse sunny dapples,
 *  and painted fallen-leaf specks so the shoulders read as the same floor as forest-ground. */
const grassColor = (x: number, z: number) => {
  const patch = tileNoise(x, z, 2, 1.8, 3);
  let c = GRASS;
  c = mixRgb(c, GRASS_DARK, clamp01((0.02 - patch) * 2.6) * 0.8);
  c = mixRgb(c, GRASS_LIGHT, clamp01((patch - 0.06) * 2.6) * 0.4);
  const moss = tileNoise(x, z, 5, 4.5, 2);
  c = mixRgb(c, GRASS_DARK, clamp01((0.0 - moss) * 2.4) * 0.5);
  const litter = tileNoise(x, z, 9, 22, 2);
  const lm = clamp01((Math.abs(litter) - 0.22) * 6);
  c = mixRgb(c, litter > 0 ? LEAF_PALE : LEAF_BROWN, lm * 0.35);
  return c;
};

const terrainColor = (x: number, z: number) => {
  const m = pathMask(x, z);
  let c = mixRgb(grassColor(x, z), dirtColor(x, z), m);
  // A thin shadowed fringe where the trail sinks into the grass (peak at the boundary).
  const fringe = m * (1 - m) * 4;
  c = mixRgb(c, EDGE, 0.3 * fringe);
  return c;
};

// A few small pebbles half-sunk in the trail, deterministic positions inside |x| < 0.42.
const PEBBLES: Array<[number, number, number]> = [
  [-0.26, -0.66, 0.03],
  [0.16, -0.34, 0.024],
  [0.36, -0.04, 0.028],
  [-0.1, 0.22, 0.021],
  [0.27, 0.5, 0.032],
  [-0.33, 0.76, 0.026],
];

// Fallen-leaf blobs on the shoulders, matching the forest-ground scatter. Every blob sits
// fully on grass (|x| >= 0.62, off the trail) and clear of the tile edges (|z| <= 0.8).
const LEAVES: ReadonlyArray<readonly [number, number, number, number]> = [
  // x, z, rotation degrees, palette index (0 pale, 1 brown, 2 deep)
  [0.68, -0.5, 20, 1],
  [0.72, 0.35, 75, 0],
  [0.66, 0.78, 140, 2],
  [-0.7, -0.75, 50, 0],
  [-0.68, 0.1, 105, 1],
  [-0.71, 0.62, 15, 2],
];
const LEAF_COLORS = [LEAF_PALE, LEAF_BROWN, LEAF_DEEP] as const;

export default defineAsset({
  name: 'footpath-straight',
  description:
    'Straight 2 m forest footpath tile, a 0.3 m slab with the top at y = 0; sides show a top-paint lip over warm layered soil. Top: narrow foot-worn tan trail between shaded forest-floor shoulders with fallen leaves, with half-sunk pebbles.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // One slab carries grass AND trail: the top is a single flat surface at y = 0 (0.3 m slab), so the
    // path can never sit raised and no seam can appear between path and grass.
    const terrain = sdf.box([TILE + 2 * EDGE_OVERLAP, SLAB + 2 * EDGE_OVERLAP, TILE + 2 * EDGE_OVERLAP]).at(0, -SLAB / 2, 0).paintFn((x, y, z) => (y > -0.01 ? terrainColor(x, z) : sideColorAt(x, y, z, terrainColor)));
    k.body('terrain', terrain, {
      color: GRASS,
      roughness: 0.95,
      detail: 0.02,
      // Packed-earth grain on the trail, finer grass nap on the shoulders — normal-map only.
      bump: (x, _y, z) => {
        const m = pathMask(x, z);
        const dirt = 0.0035 * tileNoise(x, z, 1, 30, 3);
        const grass = 0.002 * tileNoise(x, z, 4, 50, 2);
        return m * dirt + (1 - m) * grass;
      },
    });

    // Pebbles: small flattened stones sunk into the trail, slightly varied tint. Coarse
    // cells keep the count low; the bevel comes from the ellipsoid itself.
    const pebbles = sdf.union(
      ...PEBBLES.map(([px, pz, r]) =>
        sdf.ellipsoid([r, r * 0.5, r * 0.9]).at(px, TOP - r * 0.22, pz),
      ),
    );
    k.body('pebbles', pebbles.paintFn((x, _y, z, base) => {
      const tint = noise.random(Math.floor(x * 60 + 11), 3, Math.floor(z * 60 + 7));
      return mixRgb(base, STONE_DARK, 0.25 + 0.45 * tint);
    }), {
      color: STONE,
      roughness: 0.85,
      detail: 0.016,
    });

    // Fallen leaves: squashed ellipsoid blobs sunk into the shoulders, forest-ground styling.
    const leaves = sdf.union(
      ...LEAVES.map(([lx, lz, rot, ci]) =>
        sdf.ellipsoid([0.05, 0.013, 0.036]).rotateY(rot).at(lx, TOP + 0.002, lz).paint(LEAF_COLORS[ci]!),
      ),
    );
    k.body('leaves', leaves, {
      color: LEAF_PALE,
      roughness: 0.85,
      detail: 0.014,
      maxTriangles: 600,
    });
  },
});
