import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Natural stone ground tile (architecture/landscape-parts/stone-ground): 2 m x 2 m, 0.08 m thick,
 * top at y = 0.08, matched to docs/item-mockups/stone-ground-mock.jpg. One idea: rough natural
 * grey bedrock split into uneven slabs by narrow dark cracks, with pebbles in the cracks and a
 * lumpy weathered surface; no grid. The crack pattern repeats every 2 m, so tiles join without a
 * seam. Palette: stone #7e848a / #8c9197 / #6e747a, cracks #3a3d42, pebbles #9aa0a5.
 */

const CELLS = 4; // slabs per tile side
const CELL = 2 / CELLS; // meters per cell
const TOP = 0.08;

const STONES = ['#7e848a', '#8c9197', '#6e747a', '#858b90', '#767c82'].map((c) => rgb(c));
const MORTAR = rgb('#3a3d42');
const STONE_DARK = rgb('#555a60');

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const wrap = (i: number) => ((i % CELLS) + CELLS) % CELLS;

/** Periodic 2D Voronoi over the tile: edge = distance to the nearest stone border in meters. */
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
      const wi = wrap(i);
      const wj = wrap(j);
      const px = i + 0.2 + 0.6 * noise.random(wi, wj, 0, 11);
      const pz = j + 0.2 + 0.6 * noise.random(wi, wj, 0, 12);
      const d = Math.hypot(u - px, v - pz);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = wj * CELLS + wi;
      } else if (d < f2) f2 = d;
    }
  return { edge: (f2 - f1) * 0.5 * CELL, id };
}

export default defineAsset({
  name: 'stone-ground',
  description: 'A 2 m square tile of rough natural grey stone ground split by narrow dark cracks; no grid; tiles seamlessly.',
  detail: 0.008,
  reference: 'docs/item-mockups/stone-ground-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Grooves between the stones: flat mortar lines with rounded stone shoulders, only near the top.
    const carve = (x: number, y: number, z: number) => {
      const { edge, id } = cells(x, z);
      const onTop = smooth(0.035, 0.072, y);
      const groove = 1 - smooth(0.003, 0.016, edge);
      const sink = 0.18 * noise.random(id, 0, 0, 21);
      const lump = 0.25 * noise.fbm(x * 4, 0, z * 4, 3);
      return onTop * (groove + sink + lump);
    };
    const floor = sdf
      .box([2.1, TOP, 2.1], 0.003)
      .at(0, TOP / 2, 0)
      .displace(0.024, carve, 1.4)
      .intersect(sdf.box([2, TOP, 2]).at(0, TOP / 2, 0))
      .paintFn((x, y, z) => {
        const { edge, id } = cells(x, z);
        const base = STONES[id % STONES.length]!;
        const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
        let c = mixRgb(base, STONE_DARK, 0.25 * n);
        c = mixRgb(c, STONE_DARK, 0.6 * (1 - smooth(0.006, 0.025, edge)));
        return mixRgb(c, MORTAR, 1 - smooth(0.002, 0.006, edge));
      });

    k.body('ground', floor, {
      color: '#7d746a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 6000,
      maxError: 0.004,
    });
  },
});
