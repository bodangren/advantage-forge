import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Dirt road crossing — a modular 2 m x 2 m terrain tile (0.3 m slab, top at y = 0, soil sides) for a
 * cozy chibi fantasy hamlet map, made from dirt-road-t-junction. Roads enter at the middle of all
 * four edges and cross at the tile centre: a through road along X and one along Z. ONE flat slab
 * carries grass AND road, so the packed road is flush with the grass — no raised slab, no seam;
 * the road is a painted plus with soft noise-worn edges and rounded inner corners where the arms
 * meet. Warm packed brown (same palette as the straight dirt-road tile and the bare dirt ground
 * tile), bright grass green corners, stone flecks, wheel tracks in each arm, a few half-sunk
 * pebbles. Straight clean tile edges so it tiles seamlessly. No rig, no animation.
 *
 * One idea: three trodden arms converging on a slightly worn centre — a flat, clean square tile.
 *
 * Palette (60/30/10), copied from assets/dirt-road-straight.ts for set harmony:
 *   grass  #6fb43c base, #57942f dark patches, #8fca52 light blades   (corners, ~4 areas)
 *   dirt   #7c5738 base, #614226 dark patches, #96714b light grain    (road, focal)
 *   stones #a49a8b flecks, #7e7568 dark                               (small accent)
 *   worn wheel tracks #6a4a2e, subtle, at ±0.21 across each arm
 *
 * Materials: one terrain body (roughness 0.95, all fine grain in `bump`), one pebble body
 * (roughness 0.85). Relief pebbles half-sunk in the road for 3D interest at sprite size.
 */

const TILE = 2; // grid size in meters
const TOP = 0; // walkable top at y = 0
const ROAD_HALF = 0.6; // road arms are ~1.2 m wide, like the straight dirt-road tile
const CORNER_R = 0.1; // rounding of the road edges at the junction
const BLEND_K = 0.1; // soft fillet where the stub meets the through road

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

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** 2D rounded-box distance: the total half-extent is (hx + r, hz + r). */
const box2 = (px: number, pz: number, cx: number, cz: number, hx: number, hz: number, r: number) => {
  const qx = Math.abs(px - cx) - hx;
  const qz = Math.abs(pz - cz) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
};

/** Polynomial smooth-min; k is the fillet size in meters. */
const smin = (a: number, b: number, k: number) => {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
};

/** Edge wobble fades to 0 within ~15 cm of a tile edge, so arms meet neighbours at full width. */
const damp = (t: number) => 1 - smoothstep(0.85, 0.98, Math.abs(t));

/**
 * Signed distance (negative inside) of the two road arms. Through road along X, centered on
 * z = 0, spanning past both side edges; stub along Z, centered on x = 0, reaching past the
 * +Z edge. Each edge wanders a little (world-space noise, same convention as the straight
 * road tile) and fades softly over ~8 cm for a worn look. The tile boundary stays a perfect
 * square. smin rounds the two inner corners where the arms meet.
 */
const dThrough = (x: number, z: number) =>
  box2(x, z, 0, 0, 1.2, ROAD_HALF - CORNER_R, CORNER_R) -
  0.03 * noise.fbm(0.7, 3.1, x * 1.8, 2) * damp(x);
const dStub = (x: number, z: number) =>
  box2(x, z, 0, 0, ROAD_HALF - CORNER_R, 1.2, CORNER_R) -
  0.03 * noise.fbm(0.7, 3.1, z * 1.8, 2) * damp(z);
const roadDist = (x: number, z: number) => smin(dThrough(x, z), dStub(x, z), BLEND_K);

const maskOf = (d: number) => 1 - smoothstep(-0.03, 0.05, d);
const roadMask = (x: number, z: number) => maskOf(roadDist(x, z));

/** Warm packed brown: big value patches, fine light grain, subtle darker wheel tracks. */
const dirtColor = (x: number, z: number) => {
  const patch = noise.fbm(x * 4.5, 1.3, z * 4.5, 2);
  const grain = noise.fbm(x * 34, 5, z * 34, 2);
  let c = mixRgb(DIRT, DIRT_DARK, clamp01(0.35 + 0.4 * patch));
  if (grain > 0.26) c = mixRgb(c, DIRT_LIGHT, 0.5);
  // Wheel tracks run across each arm: z = ±0.21 along the through road, x = ±0.21 in the stub.
  const track =
    maskOf(dThrough(x, z)) * Math.exp(-(((Math.abs(z) - 0.21) / 0.075) ** 2)) +
    maskOf(dStub(x, z)) * Math.exp(-(((Math.abs(x) - 0.21) / 0.075) ** 2));
  c = mixRgb(c, DIRT_TRACK, Math.min(0.5, 0.4 * track));
  // The centre where all three arms converge is the most trodden: a touch lighter and smoother.
  c = mixRgb(c, DIRT_LIGHT, 0.22 * Math.exp(-(x * x + z * z) / 0.05));
  // Small stone flecks scattered in the packed earth.
  const fleck = noise.worley(x * 26, 7, z * 26);
  if (fleck.f1 < 0.15) c = mixRgb(c, FLECK, 0.8 - 0.3 * ((fleck.id % 1000) / 1000));
  return c;
};

/** Bright grass green: soft value patches plus a few lighter blade speckles. */
const grassColor = (x: number, z: number) => {
  const patch = noise.fbm(x * 3.5, 2, z * 3.5, 2);
  const blade = noise.fbm(x * 45, 9, z * 45, 2);
  let c = mixRgb(GRASS, GRASS_DARK, clamp01(0.4 + 0.35 * patch));
  if (blade > 0.3) c = mixRgb(c, GRASS_LIGHT, 0.45);
  return c;
};

const terrainColor = (x: number, z: number) => mixRgb(grassColor(x, z), dirtColor(x, z), roadMask(x, z));

// A few small pebbles half-sunk in the road, deterministic positions in the three arms,
// kept off the junction centre so the convergence reads clean.
const PEBBLES: Array<[number, number, number]> = [
  [-0.78, -0.25, 0.033],
  [0.62, 0.28, 0.027],
  [0.88, -0.34, 0.036],
  [-0.44, 0.38, 0.024],
  [0.26, -0.5, 0.03],
  [-0.3, 0.72, 0.03],
  [0.36, 0.9, 0.026],
  [-0.15, 0.62, 0.022],
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
  name: 'dirt-road-crossing',
  description:
    'Crossing 2 m dirt road tile, four flush arms meeting at the centre, warm packed brown with stone flecks, a 0.3 m slab with top at y = 0 over layered soil sides.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // One slab carries grass AND road: the top is a single flat surface at y = 0, so the
    // road can never sit raised and no seam can appear between road and grass.
    const terrain = sdf.box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE]).at(0, -SLAB / 2, 0)
      .paintFn((x, y, z) => (y > -0.01 ? terrainColor(x, z) : sideColorAt(x, y, z, terrainColor)));
    k.body('terrain', terrain, {
      color: GRASS,
      roughness: 0.95,
      detail: 0.02,
      // Packed-earth grain in the road, finer grass nap on the corners — normal-map only.
      bump: (x, y, z) => {
        if (y < -0.01) return 0;
        const m = roadMask(x, z);
        const dirt = 0.0035 * noise.fbm(x * 30, 1, z * 30, 3);
        const grass = 0.002 * noise.fbm(x * 50, 4, z * 50, 2);
        return m * dirt + (1 - m) * grass;
      },
    });

    // Pebbles: small flattened stones sunk into the road surface, slightly varied tint.
    const pebbles = sdf.union(
      ...PEBBLES.map(([px, pz, r]) =>
        sdf.ellipsoid([r, r * 0.5, r * 0.9]).at(px, TOP - r * 0.22, pz),
      ),
    );
    const pebbleTint = pebbles.paintFn((x, _y, z, base) => {
      const tint = noise.random(Math.floor(x * 60 + 11), 3, Math.floor(z * 60 + 7));
      return mixRgb(base, STONE_DARK, 0.25 + 0.45 * tint);
    });
    k.body('pebbles', pebbleTint, {
      color: STONE,
      roughness: 0.85,
      detail: 0.007,
    });
  },
});
