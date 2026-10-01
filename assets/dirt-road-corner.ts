import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

// dirt-road-corner — a modular 2 m terrain tile: a 90-degree dirt-road bend.
//
// Role: hamlet map tile that joins two straight road tiles; read top-down and at 128 px.
// Size: exactly 2 x 2 m, 0.3 m slab, grass top at y = 0, soil sides down to y = -0.3.
// One idea: a sunken packed-dirt path that sweeps one smooth quarter circle around the
// inside corner, full-bleed through the mid-edges of two adjacent sides, with wheel ruts
// and dusty worn edges melting into the grass.
// Shape language: rounded and soft (cozy village); the tile edges stay straight and clean.
// Palette: grass #79b447 / #8fc65a (60), packed dirt #8a6742 with dusty rim #a6865e (30),
// dark speckle #6e5236 (10). The bend itself is the focal point.
// Materials: one matte body (roughness 0.95); grass and dirt are split by paint, fine
// grain and cracks live in `bump` so the mesh stays light.
// No rig, no animation.

// The bend is a quarter circle around the inside corner of the turn (x = 1, z = -1),
// so every road function is a function of the radius from that vertical axis.
// Road mouths: middle of the front edge (x = 0, z = -1) and middle of the right edge
// (x = 1, z = 0), each about 1.2 m wide to match the straight road, cut flush through the
// tile boundary.
const AXIS_X = 1;
const AXIS_Z = -1;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const roadRadius = (x: number, z: number) => Math.hypot(x - AXIS_X, z - AXIS_Z);

/** 1 on the packed dirt, 0 on the grass, feathered over the worn rim of the dish. */
const roadMask = (x: number, z: number): number =>
  smoothstep(0.33, 0.44, roadRadius(x, z)) * (1 - smoothstep(1.56, 1.67, roadRadius(x, z)));

// Cross-section of the material the dish cutter removes: U is the radius from the corner
// axis, V is height. The shoulders rise gently past grass level (soft worn edges), and the
// bed is crowned at the centerline (r = 1) with two wheel ruts. An exact `subtract` keeps
// this relief; the softness lives in the profile, not in a blend radius.
const dishProfile = profile.polygon(
  [
    [0.216, 0.016], [0.304, 0.008], [0.392, 0.0005], // inner shoulder, above grass level
    [0.49, 0.0032], [0.588, -0.0001], // inner worn slope
    [0.7, -0.0014], [0.812, -0.0024], // inner wheel rut
    [0.91, -0.0007], [1.0, 0.0], // crowned centerline, flush with the other road tiles
    [1.098, -0.0007], [1.196, -0.0024], // outer wheel rut
    [1.308, -0.0014], [1.42, -0.0001], // outer worn slope
    [1.518, 0.0032], [1.616, 0.0005], // outer shoulder
    [1.704, 0.008], [1.792, 0.016], // outer shoulder, above grass level
    [1.792, 0.06], [0.216, 0.06], // closed over the top, in the air
  ],
  { smooth: true },
);

// Palette (sRGB hex, converted to linear by rgb()).
const GRASS = rgb('#79b447');
const GRASS_LIGHT = rgb('#8fc65a');
const GRASS_DRY = rgb('#9db54e');
const DIRT = rgb('#7b5a37');
const DIRT_DUSTY = rgb('#9c7c52');
const DIRT_RUT = rgb('#67492c');
const DIRT_DARK = rgb('#5a4227');

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
  name: 'dirt-road-corner',
  description: 'Modular 2 m dirt road corner tile, a 0.3 m slab with top at y = 0 over layered soil sides: a packed-dirt quarter bend on grass.',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const grassSlab = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const dish = sdf.revolve(dishProfile).at(AXIS_X, 0, AXIS_Z);
    // Sink the road dish into the slab with an exact cut; the profile's sloped shoulders
    // are the soft worn edge.
    const topColor = (x: number, z: number) => {
      const r = roadRadius(x, z);
      const road = roadMask(x, z);

      // Grass: patchy greens, a few dry spots, tiny light speckle.
      const patch = noise.fbm(x * 2.3, 1.7, z * 2.3, 3);
      let grass = mixRgb(GRASS, GRASS_LIGHT, clamp01(0.5 + 0.5 * patch));
      const dry = noise.fbm(x * 1.2 + 7.3, 4.1, z * 1.2, 2);
      if (dry > 0.25) grass = mixRgb(grass, GRASS_DRY, clamp01((dry - 0.25) * 1.1));
      const blade = noise.fbm(x * 30, 8, z * 30, 2);
      if (blade > 0.4) grass = mixRgb(grass, GRASS_LIGHT, (blade - 0.4) * 0.35);

      // Dirt: packed center, dusty worn rims, wheel ruts, dark speckle.
      const mottle = noise.fbm(x * 6.5, 2, z * 6.5, 3);
      const rim = Math.max(1 - smoothstep(0.6, 0.72, r), smoothstep(1.28, 1.4, r));
      let dirt = mixRgb(DIRT, DIRT_DUSTY, clamp01(0.06 + rim * 0.6 + mottle * 0.22));
      const crown = Math.exp(-((r - 1) ** 2) / (2 * 0.07 ** 2));
      dirt = mixRgb(dirt, DIRT_DUSTY, crown * 0.15);
      const rut =
        Math.exp(-((r - 0.86) ** 2) / (2 * 0.035 ** 2)) +
        Math.exp(-((r - 1.14) ** 2) / (2 * 0.035 ** 2));
      dirt = mixRgb(dirt, DIRT_RUT, clamp01(rut) * 0.4);
      const speck = noise.fbm(x * 28, 6, z * 28, 2);
      if (speck > 0.35) dirt = mixRgb(dirt, DIRT_DARK, clamp01((speck - 0.35) * 1.2));

      return mixRgb(grass, dirt, road);
    };
    const tile = grassSlab.subtract(dish).paintFn((x, y, z) =>
      y > -0.01 ? topColor(x, z) : sideColorAt(x, y, z, topColor),
    );

    k.body('tile', tile, {
      color: '#79b447',
      roughness: 0.95,
      detail: 0.008,
      paintWeight: 2,
      // Fine grain only in the normal map: dirt grain and cracks, fine grass tufting.
      bump: (x, y, z) => {
        if (y < -0.01) return 0;
        const road = roadMask(x, z);
        const crack = noise.worley(x * 12, 4, z * 12);
        const dirtBump =
          0.0018 * noise.fbm(x * 36, y * 36, z * 36, 2) -
          0.0014 * (1 - clamp01((crack.f2 - crack.f1) / 0.12));
        const grassBump = 0.0013 * noise.fbm(x * 24, y * 24, z * 24, 2);
        return road * dirtBump + (1 - road) * grassBump;
      },
    });
  },
});
