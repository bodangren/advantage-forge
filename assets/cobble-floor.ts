import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Cobblestone floor tile (architecture/building-parts/cobble-floor): 2 m x 2 m, 0.06 m thick, top
 * at y = 0.06, matched to docs/item-mockups/cobble-floor-mock.jpg and the village streets.
 * One idea: many small domed cobbles about 0.18 m across in warm greys with dark gaps. The pattern
 * is a Voronoi pattern that repeats every 2 m, so tiles placed side by side join without a seam.
 * Palette: cobbles #8a8078 / #9a9088 / #7a7068 / #a39688 / #857a70, gaps #3a342e.
 */

const CELLS = 11; // cobbles per tile side
const CELL = 2 / CELLS; // meters per cell
const TOP = 0.06;

const STONES = ['#8a8078', '#9a9088', '#7a7068', '#a39688', '#857a70'].map((c) => rgb(c));
const MORTAR = rgb('#3a342e');
const STONE_DARK = rgb('#4f4840');

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
  name: 'cobble-floor',
  description: 'A 2 m square floor tile of small domed warm-grey cobblestones with dark gaps; tiles seamlessly.',
  detail: 0.011,
  reference: 'docs/item-mockups/cobble-floor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Grooves between the stones: flat mortar lines with rounded stone shoulders, only near the top.
    const carve = (x: number, y: number, z: number) => {
      const { edge, id } = cells(x, z);
      const onTop = smooth(0.02, 0.054, y);
      const groove = 1 - smooth(0.004, 0.06, edge);
      const sink = 0.18 * noise.random(id, 0, 0, 21);
      const lump = 0.08 * noise.fbm(x * 9, 0, z * 9, 2);
      return onTop * (groove + sink + lump);
    };
    const floor = sdf
      .box([2.1, TOP, 2.1], 0.003)
      .at(0, TOP / 2, 0)
      .displace(0.02, carve, 1.6)
      .intersect(sdf.box([2, TOP, 2]).at(0, TOP / 2, 0))
      .paintFn((x, y, z) => {
        const { edge, id } = cells(x, z);
        const base = STONES[id % STONES.length]!;
        const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
        let c = mixRgb(base, STONE_DARK, 0.25 * n);
        c = mixRgb(c, STONE_DARK, 0.6 * (1 - smooth(0.008, 0.03, edge)));
        return mixRgb(c, MORTAR, 1 - smooth(0.003, 0.008, edge));
      });

    k.body('cobbles', floor, {
      color: '#7d746a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.011,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 9000,
      maxError: 0.004,
    });
  },
});
