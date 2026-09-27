import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

// dirt-road-corner — a modular 2 m terrain tile: a 90-degree dirt-road bend.
//
// Role: hamlet map tile that joins two straight road tiles; read top-down and at 128 px.
// Size: exactly 2 x 2 m, 0.08 m thick, grass top at y = 0.08, standing on y = 0.
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
    [0.216, 0.096], [0.304, 0.088], [0.392, 0.0805], // inner shoulder, above grass level
    [0.49, 0.0748], [0.588, 0.0715], // inner worn slope
    [0.7, 0.0702], [0.812, 0.0692], // inner wheel rut
    [0.91, 0.0709], [1.0, 0.0716], // crowned centerline
    [1.098, 0.0709], [1.196, 0.0692], // outer wheel rut
    [1.308, 0.0702], [1.42, 0.0715], // outer worn slope
    [1.518, 0.0748], [1.616, 0.0805], // outer shoulder
    [1.704, 0.088], [1.792, 0.096], // outer shoulder, above grass level
    [1.792, 0.14], [0.216, 0.14], // closed over the top, in the air
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

export default defineAsset({
  name: 'dirt-road-corner',
  description: 'Modular 2 m dirt road corner tile: a packed-dirt quarter bend on a grass base.',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const grassSlab = sdf.box([2, 0.08, 2], 0.006).at(0, 0.04, 0);
    const dish = sdf.revolve(dishProfile).at(AXIS_X, 0, AXIS_Z);
    // Sink the road dish into the slab with an exact cut; the profile's sloped shoulders
    // are the soft worn edge.
    const tile = grassSlab.subtract(dish).paintFn((x, y, z) => {
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
    });

    k.body('tile', tile, {
      color: '#79b447',
      roughness: 0.95,
      detail: 0.008,
      paintWeight: 2,
      // Fine grain only in the normal map: dirt grain and cracks, fine grass tufting.
      bump: (x, y, z) => {
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
