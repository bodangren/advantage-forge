import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

// footpath-corner — modular 2 m forest tile: a narrow dirt footpath bending 90 degrees.
//
// Role: forest map tile that joins two footpath-straight tiles; read top-down and at 128 px.
// Size: exactly 2 x 2 m, 0.08 m thick, grass top at y = 0 (0.3 m slab), standing on y = 0. The path is
// paint on one flat slab (same convention as dirt-road-straight), so the height at every tile
// edge matches a straight footpath tile and the two sit side by side without a seam.
// One idea: a narrow trodden tan path that sweeps one smooth quarter circle around the inside
// corner, full-bleed through the midpoints of the north and east edges (bend axis at the NE
// tile corner), melting into shaded forest floor with soft worn shoulders (forest-ground styling).
// Shape language: rounded and soft (cozy forest); the tile boundary stays square and clean.
// Palette (forest contract): shaded floor green #4a8a3f / deep #2f7a3f with sunny #7ec850
// dapples and fallen-leaf specks (55, matches forest-ground), warm tan #c8a86b family (35,
// focal), pebble gray #8a94a0 (10, accent).
// Materials: one matte terrain body (roughness 0.95, all grain in `bump`), one pebble body.
// No rig, no animation.

const TILE = 2; // grid size in meters
const TOP = 0; // walkable top at y = 0 (the slab goes down to y = -0.3)
const AXIS_X = 1; // inside corner of the bend (grass wedge sits here)
const AXIS_Z = -1;
const PATH_HALF = 0.5; // the footpath is about 1 m wide

// Palette (sRGB hex, converted to linear by rgb()).
const GRASS = rgb('#4a8a3f'); // shaded forest-floor green — dominant (matches forest-ground)
const GRASS_DARK = rgb('#2f7a3f'); // deep shade pockets
const GRASS_LIGHT = rgb('#7ec850'); // sparse sunny dapples where the canopy opens
const LEAF_PALE = rgb('#c8a86b'); // fallen-leaf specks and blobs, light
const LEAF_BROWN = rgb('#8a5a35'); // fallen-leaf specks and blobs, mid
const LEAF_DEEP = rgb('#5f3d22'); // fallen-leaf blobs, dark
const DIRT = rgb('#c8a86b'); // warm tan — focal
const DIRT_DARK = rgb('#a8874e'); // trodden patches
const DIRT_LIGHT = rgb('#ddc18d'); // dusty grain and worn rim
const DIRT_TRACK = rgb('#b28e52'); // faint foot-worn centerline
const STONE = rgb('#8a94a0'); // cool gray pebbles
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

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** Distance from the bend axis: the path centerline is the quarter circle r = 1. */
const pathRadius = (x: number, z: number) => Math.hypot(x - AXIS_X, z - AXIS_Z);

/** Fades to 0 near the tile boundary so both mouths keep the exact 1 m entry width. */
const edgeFade = (x: number, z: number) => {
  const d = Math.min(x + 1, 1 - x, z + 1, 1 - z);
  return smoothstep(0, 0.16, d);
};

/**
 * Path coverage in [0, 1]: 1 on the packed tan dirt, 0 on the grass. The edge wanders a little
 * (world-space noise, so it continues onto neighboring tiles) and fades softly for a worn look.
 */
const pathMask = (x: number, z: number) => {
  const wobble = 0.035 * noise.fbm(x * 1.9, 3.7, z * 1.9, 2) * edgeFade(x, z);
  const d = Math.abs(pathRadius(x, z) - 1) - (PATH_HALF + wobble);
  return 1 - smoothstep(-0.05, 0.075, d);
};

/** Warm trodden tan: big value patches, light dusty grain, darker footworn center, grit. */
const dirtColor = (x: number, z: number) => {
  const patch = noise.fbm(x * 3.2, 1.9, z * 3.2, 3);
  let c = mixRgb(DIRT, DIRT_DARK, clamp01(0.3 + 0.46 * patch));
  const centre = Math.exp(-((pathRadius(x, z) - 1) ** 2) / (2 * 0.1 ** 2));
  c = mixRgb(c, DIRT_TRACK, 0.38 * centre);
  const rim = smoothstep(0.3, 0.5, Math.abs(pathRadius(x, z) - 1));
  c = mixRgb(c, DIRT_LIGHT, 0.28 * rim);
  const grain = noise.fbm(x * 26, 7, z * 26, 2);
  if (grain > 0.28) c = mixRgb(c, DIRT_LIGHT, 0.45);
  const grit = noise.fbm(x * 42, 9, z * 42, 2);
  if (grit > 0.46) c = mixRgb(c, STONE, 0.35);
  return c;
};

/** Shaded forest floor (forest-ground styling): deep shade pockets, sparse sunny dapples,
 *  and painted fallen-leaf specks so the shoulders read as the same floor as forest-ground. */
const grassColor = (x: number, z: number) => {
  const patch = noise.fbm(x * 1.8, 2.6, z * 1.8, 3);
  let c = GRASS;
  c = mixRgb(c, GRASS_DARK, clamp01((0.02 - patch) * 2.6) * 0.8);
  c = mixRgb(c, GRASS_LIGHT, clamp01((patch - 0.06) * 2.6) * 0.4);
  const moss = noise.fbm(x * 4.5, 5, z * 4.5, 2);
  c = mixRgb(c, GRASS_DARK, clamp01((0.0 - moss) * 2.4) * 0.5);
  const litter = noise.fbm(x * 22, 9, z * 22, 2);
  const lm = clamp01((Math.abs(litter) - 0.22) * 6);
  c = mixRgb(c, litter > 0 ? LEAF_PALE : LEAF_BROWN, lm * 0.35);
  return c;
};

// A few small pebbles half-sunk in the path, deterministic positions along the bend.
const PEBBLES: ReadonlyArray<readonly [number, number, number]> = [
  [0.06, -0.66, 0.038],
  [-0.04, -0.4, 0.027],
  [0.3, -0.29, 0.042],
  [0.72, 0.06, 0.034],
];

// Fallen-leaf blobs on the grass, matching the forest-ground scatter. Every blob sits fully
// on grass (off the path band) and clear of the tile edges, so repeats stay seamless.
const LEAVES: ReadonlyArray<readonly [number, number, number, number]> = [
  // x, z, rotation degrees, palette index (0 pale, 1 brown, 2 deep)
  [0.68, -0.68, 25, 1],
  [0.82, -0.7, 70, 0],
  [0.7, -0.82, 130, 2],
  [-0.6, 0.55, 45, 0],
  [-0.25, 0.72, 100, 1],
  [-0.72, -0.15, 10, 2],
  [0.3, 0.75, 155, 0],
];
const LEAF_COLORS = [LEAF_PALE, LEAF_BROWN, LEAF_DEEP] as const;

export default defineAsset({
  name: 'footpath-corner',
  description:
    'Modular 2 m forest tile, a 0.3 m slab with the top at y = 0; sides show a top-paint lip over warm layered soil. Top: a narrow tan footpath bending 90 degrees from the north edge to the east edge (bend axis at the NE tile corner).',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // One slab carries grass AND path: the top is a single flat surface at y = 0 (0.3 m slab), so the
    // path can never sit raised and the tile edges always match a straight footpath tile.
    const terrain = sdf
      .box([TILE + 2 * EDGE_OVERLAP, SLAB + 2 * EDGE_OVERLAP, TILE + 2 * EDGE_OVERLAP])
      .at(0, -SLAB / 2, 0)
      .paintFn((x, y, z) => {
        const top = (tx: number, tz: number) => mixRgb(grassColor(tx, tz), dirtColor(tx, tz), pathMask(tx, tz));
        return y > -0.01 ? top(x, z) : sideColorAt(x, y, z, top);
      });
    k.body('terrain', terrain, {
      color: GRASS,
      roughness: 0.95,
      detail: 0.03,
      // Packed-earth grain in the path, finer grass nap on the shoulders — normal-map only.
      bump: (x, y, z) => {
        const m = pathMask(x, z);
        const dirt = 0.0028 * noise.fbm(x * 30, y * 30, z * 30, 2);
        const grass = 0.0018 * noise.fbm(x * 22, y * 22, z * 22, 2);
        return m * dirt + (1 - m) * grass;
      },
    });

    // Pebbles: small flattened stones sunk into the path, slightly varied gray tint.
    const pebbles = sdf.union(
      ...PEBBLES.map(([px, pz, r]) =>
        sdf.ellipsoid([r, r * 0.45, r * 0.85]).at(px, TOP - r * 0.18, pz),
      ),
    );
    k.body(
      'pebbles',
      pebbles.paintFn((x, _y, z, base) => {
        const tint = noise.random(Math.floor(x * 55 + 13), 3, Math.floor(z * 55 + 5));
        return mixRgb(base, STONE_DARK, 0.3 + 0.4 * tint);
      }),
      {
        color: STONE,
        roughness: 0.85,
        detail: 0.012,
      },
    );

    // Fallen leaves: squashed ellipsoid blobs sunk into the grass, forest-ground styling.
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
