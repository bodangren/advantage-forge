import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Cobblestone road T-junction (architecture/landscape-parts/cobble-road-t-junction): a modular 2 m x 2 m tile, 0.08 m thick with
 * its top at y = 0.08, like the dirt road tiles. A road along X meets a branch toward +Z, like dirt-road-t-junction (mouths at -X, +X and +Z). The road is 1.2 m wide, made of domed
 * warm-grey cobbles with dark gaps (a Voronoi pattern that repeats every 2 m, so cobbles line up
 * across tiles), set flush in bright grass. The road edge wobbles only away from the tile edges.
 * Palette: grass #6fb43c / #57942f / #8fca52, cobbles #8a8078 / #9a9088 / #7a7068 / #a39688,
 * gaps #3a342e.
 */

const CELLS = 11;
const CELL = 2 / CELLS;
const TOP = 0.08;
const HALF = 0.6; // half road width

const GRASS = rgb('#6fb43c');
const GRASS_DARK = rgb('#57942f');
const GRASS_LIGHT = rgb('#8fca52');
const STONES = ['#8a8078', '#9a9088', '#7a7068', '#a39688', '#857a70'].map((c) => rgb(c));
const STONE_DARK = rgb('#5f5850');
const GAP = rgb('#3a342e');

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const wrap = (i: number) => ((i % CELLS) + CELLS) % CELLS;

/** Distance from (x, z) to the road center line. */
const center = (x: number, z: number) => (z > 0 ? Math.min(Math.abs(z), Math.abs(x)) : Math.abs(z));
/** Signed distance to the road edge (negative inside), with a wobble that fades at the tile edges. */
const road = (x: number, z: number) => {
  const fade = clamp((1 - Math.max(Math.abs(x), Math.abs(z))) / 0.15);
  return center(x, z) - HALF - 0.05 * fade * noise.noise3(x * 3, 0, z * 3);
};

function cells(x: number, z: number): { edge: number; id: number } {
  const u = ((x + 1) / 2) * CELLS;
  const v = ((z + 1) / 2) * CELLS;
  const ui = Math.floor(u);
  const vi = Math.floor(v);
  let f1 = Infinity;
  let f2 = Infinity;
  let id = 0;
  for (let dj = -2; dj <= 2; dj++)
    for (let di = -2; di <= 2; di++) {
      const i = ui + di;
      const j = vi + dj;
      const px = i + 0.2 + 0.6 * noise.random(wrap(i), wrap(j), 0, 11);
      const pz = j + 0.2 + 0.6 * noise.random(wrap(i), wrap(j), 0, 12);
      const d = Math.hypot(u - px, v - pz);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = wrap(j) * CELLS + wrap(i);
      } else if (d < f2) f2 = d;
    }
  return { edge: (f2 - f1) * 0.5 * CELL, id };
}

export default defineAsset({
  name: 'cobble-road-t-junction',
  description: 'A 2 m cobblestone road tile: a T-junction of cobble roads (mouths at -X, +X and +Z) through grass.',
  detail: 0.011,
  reference: 'docs/item-mockups/cobble-road-t-junction-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const carve = (x: number, y: number, z: number) => {
      const inRoad = 1 - smooth(-0.04, 0.02, road(x, z));
      if (inRoad <= 0) return 0;
      const { edge } = cells(x, z);
      return inRoad * smooth(0.04, 0.074, y) * (1 - smooth(0.004, 0.05, edge));
    };
    const tile = sdf
      .box([2.1, TOP, 2.1], 0.003)
      .at(0, TOP / 2, 0)
      .displace(0.016, carve, 1.5)
      .intersect(sdf.box([2, TOP, 2]).at(0, TOP / 2, 0))
      .paintFn((x, y, z) => {
        const r = road(x, z);
        const n = 0.5 + 0.5 * noise.fbm(x * 3, 0, z * 3, 3);
        const grass = mixRgb(mixRgb(GRASS, GRASS_DARK, 0.5 * n * n), GRASS_LIGHT, 0.25 * (0.5 + 0.5 * noise.noise3(x * 30, 0, z * 30)));
        if (r > 0.02) return grass;
        const { edge, id } = cells(x, z);
        let c = mixRgb(STONES[id % STONES.length]!, STONE_DARK, 0.2 * (0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2)));
        c = mixRgb(c, STONE_DARK, 0.5 * (1 - smooth(0.008, 0.03, edge)));
        c = mixRgb(c, GAP, 1 - smooth(0.003, 0.008, edge));
        return mixRgb(c, grass, smooth(-0.04, 0.02, r));
      });
    k.body('tile', tile, {
      color: '#6fb43c',
      roughness: 0.92,
      metalness: 0,
      maxTriangles: 6000,
      maxError: 0.004,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });
  },
});
