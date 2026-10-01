import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Dirt road straight — a modular 2 m x 2 m terrain tile (0.3 m slab, top at y = 0, soil sides) for a
 * cozy chibi fantasy hamlet map. The road runs straight across the tile along Z, about 1.2 m
 * wide, flush with the grass on both sides: ONE body, so there is no step or seam — the road
 * is a painted band with soft, noise-worn edges. Warm packed brown center (matches a bare dirt
 * ground tile), bright grass green edges (matches grass tiles), a few small stone flecks, and
 * straight clean tile edges so it tiles seamlessly. No rig, no animation.
 *
 * One idea: a warm trodden path that melts into bright grass — flat top, clean square tile.
 *
 * Palette (60/30/10):
 *   grass  #6fb43c base, #57942f dark patches, #8fca52 light blades   (edges, 2 x ~0.4 m)
 *   dirt   #7c5738 base, #614226 dark patches, #96714b light grain    (road, focal)
 *   stones #a49a8b flecks, #7e7568 dark                               (small accent)
 *   worn wheel tracks #6a4a2e, subtle, at x = ±0.21
 *
 * Materials: one terrain body (roughness 0.95, all fine grain in `bump`), one pebble body
 * (roughness 0.85). Relief pebbles half-sunk in the road for 3D interest at sprite size.
 */

const TILE = 2; // grid size in meters
const TOP = 0; // walkable top at y = 0
const ROAD_HALF = 0.6; // road is ~1.2 m wide along the full Z length

const GRASS = rgb('#6fb43c');
const GRASS_DARK = rgb('#57942f');
const GRASS_LIGHT = rgb('#8fca52');
const DIRT = rgb('#7c5738');
const DIRT_DARK = rgb('#614226');
const DIRT_LIGHT = rgb('#96714b');
const DIRT_TRACK = rgb('#6a4a2e');
const FLECK = rgb('#a49a8b');
const STONE = rgb('#a49a8b');
const STONE_DARK = rgb('#7e7568');

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
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
 * Road coverage in [0, 1]: 1 inside the road, 0 on the grass. The edge wanders a little along
 * Z (world-space noise, so it continues across neighboring tiles) and fades softly over ~8 cm
 * for a worn look. The tile boundary itself stays a perfect square.
 */
const roadMask = (x: number, z: number) => {
  const wobble = 0.03 * tileNoise(0.7, z, 3.1, 1.8, 2);
  const d = Math.abs(x) - (ROAD_HALF + wobble);
  return 1 - smoothstep(-0.03, 0.05, d);
};

/** Warm packed brown: big value patches, fine light grain, subtle darker wheel tracks. */
const dirtColor = (x: number, z: number) => {
  const patch = tileNoise(x, z, 1.3, 4.5, 2);
  const grain = tileNoise(x, z, 5, 34, 2);
  let c = mixRgb(DIRT, DIRT_DARK, clamp01(0.35 + 0.4 * patch));
  if (grain > 0.26) c = mixRgb(c, DIRT_LIGHT, 0.5);
  const track = Math.exp(-(((Math.abs(x) - 0.21) / 0.075) ** 2));
  c = mixRgb(c, DIRT_TRACK, 0.4 * track);
  // Small stone flecks scattered in the packed earth.
  const fleck = tileNoise(x, z, 7, 26, 2);
  if (fleck > 0.42) c = mixRgb(c, FLECK, 0.55);
  return c;
};

/** Bright grass green: soft value patches plus a few lighter blade speckles. */
const grassColor = (x: number, z: number) => {
  const patch = tileNoise(x, z, 2, 3.5, 2);
  const blade = tileNoise(x, z, 9, 45, 2);
  let c = mixRgb(GRASS, GRASS_DARK, clamp01(0.4 + 0.35 * patch));
  if (blade > 0.3) c = mixRgb(c, GRASS_LIGHT, 0.45);
  return c;
};
const terrainColor = (x: number, z: number) => mixRgb(grassColor(x, z), dirtColor(x, z), roadMask(x, z));

// A few small pebbles half-sunk in the road, deterministic positions inside |x| < 0.5.
const PEBBLES: Array<[number, number, number]> = [
  [-0.31, -0.62, 0.034],
  [0.18, -0.38, 0.026],
  [0.42, -0.05, 0.031],
  [-0.12, 0.18, 0.022],
  [0.3, 0.47, 0.036],
  [-0.38, 0.72, 0.028],
  [0.05, 0.78, 0.024],
];


const SLAB = 0.3; // ground tile depth: top at y = 0, bottom at y = -0.3
const EDGE = 0.001; // 1 mm overlap so neighbours never show a gap after meshing
const SOIL = rgb('#7a4a2a');
const SOIL_DARK = rgb('#57331d');
const PEBBLE_SOIL = rgb('#9a8a78');

/** Side color: a lip of the top paint (same x, z) with a wavy drip edge over soil strata. */
function sideColorAt(x: number, y: number, z: number, top: (x: number, z: number) => ReturnType<typeof rgb>) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return mixRgb(top(x, z), SOIL_DARK, 0.15 * Math.min(1, -y / drip));
  const depth = -y / SLAB;
  let c = mixRgb(SOIL, SOIL_DARK, 0.15 + depth * 0.55);
  const strata = Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
  c = mixRgb(c, SOIL_DARK, Math.max(0, strata - 0.6) * 0.8);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, PEBBLE_SOIL, Math.min(1, (n - 0.45) * 6) * 0.8);
  return c;
}

export default defineAsset({
  name: 'dirt-road-straight',
  description:
    'Straight 2 m dirt road tile, flush with bright grass on both sides, warm packed brown with stone flecks, a 0.3 m slab with top at y = 0 over layered soil sides.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // One slab carries grass AND road: the top is a single flat surface at y = 0, so the
    // road can never sit raised and no seam can appear between road and grass.
    const terrain = sdf.box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE]).at(0, -SLAB / 2, 0).paintFn((x, y, z) => (y > -0.01 ? terrainColor(x, z) : sideColorAt(x, y, z, terrainColor)));
    k.body('terrain', terrain, {
      color: GRASS,
      roughness: 0.95,
      detail: 0.02,
      // Packed-earth grain in the road, finer grass nap on the edges — normal-map only.
      bump: (x, y, z) => {
        if (y < -0.01) return 0;
        const m = roadMask(x, z);
        const dirt = 0.0035 * tileNoise(x, z, 1, 30, 3);
        const grass = 0.002 * tileNoise(x, z, 4, 50, 2);
        return m * dirt + (1 - m) * grass;
      },
    });

    // Pebbles: small flattened stones sunk into the road surface, slightly varied tint.
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
      detail: 0.007,
    });
  },
});
