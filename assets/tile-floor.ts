import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Terracotta tile floor (architecture/building-parts/tile-floor): 2 m x 2 m slab 0.3 m deep (floor 0.06 m thick, top at
 * y = 0.06, edges at x = ±1 and z = ±1, matched to docs/item-mockups/tile-floor-mock.jpg.
 * One idea: square terracotta tiles 0.25 m wide with soft rounded edges, in a checker of two warm
 * tones, set in thin grout. The grid repeats exactly, so tiles placed side by side join without a
 * seam. Palette: tiles #d9774a / #c4653c, grout #8a6a52.
 */

const TILE_A = rgb('#d9774a');
const TILE_B = rgb('#c4653c');
const GROUT = rgb('#8a6a52');
const SIZE = 0.25;
const TOP = 0.06;

const SLAB = 0.3; // ground tile depth: top at y = 0, bottom at y = -0.3
const EDGE = 0.001; // 1 mm overlap so neighbours never show a gap after meshing
const BLOCK = rgb('#6e6a66');
const BLOCK_MORTAR = rgb('#4a4644');

/** Foundation of large stone blocks in courses 0.08 m high, with dark mortar joints. */
function foundationColorAt(x: number, y: number, z: number) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const t = (-y - TOP) / 0.08;
  const course = Math.floor(t);
  const fr = t - course;
  const s = (along + 1 + (course % 2) * 0.25) / 0.5;
  const fs = s - Math.floor(s);
  if (fr < 0.1 || fr > 0.9 || fs < 0.04 || fs > 0.96) return mixRgb(BLOCK_MORTAR, rgb('#2c2826'), Math.min(1, -y / SLAB) * 0.5);
  const id = noise.random(course, Math.floor(s), Math.abs(x) > Math.abs(z) ? 1 : 2, 5);
  const n = 0.5 + 0.5 * noise.fbm(along * 9, y * 9, 3.1, 2);
  return mixRgb(mixRgb(BLOCK, rgb('#857f79'), id * 0.5), rgb('#4a4644'), 0.15 * n + 0.4 * Math.min(1, -y / SLAB));
}

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Distance to the nearest tile border in meters, and the tile index. */
const cell = (x: number, z: number) => {
  const u = (x + 1) / SIZE;
  const v = (z + 1) / SIZE;
  const fu = u - Math.floor(u);
  const fv = v - Math.floor(v);
  const edge = Math.min(fu, 1 - fu, fv, 1 - fv) * SIZE;
  return { edge, i: Math.floor(u), j: Math.floor(v) };
};

export default defineAsset({
  name: 'tile-floor',
  description: 'A 2 m square floor tile, a 0.3 m slab with its top at y = 0: 0.25 m terracotta tiles in a two-tone checker and thin grout on top, the same floor as a lip on the sides over large stone blocks; tiles seamlessly.',
  detail: 0.01,
  reference: 'docs/item-mockups/tile-floor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const carve = (x: number, y: number, z: number) => {
      const { edge, i, j } = cell(x, z);
      const onTop = smooth(0.02, 0.054, y);
      return onTop * (1 - smooth(0.004, 0.022, edge) + 0.15 * noise.random(i, j, 0, 7));
    };
    const floor = sdf
      .box([2.1, TOP, 2.1], 0.003)
      .at(0, TOP / 2, 0)
      .displace(0.012, carve, 1.3)
      .intersect(sdf.box([2, TOP, 2]).at(0, TOP / 2, 0))
      .at(0, -TOP, 0) // top of the old design now at y = 0
      .union(sdf.box([2 + 2 * EDGE, SLAB - TOP + 2 * EDGE, 2 + 2 * EDGE]).at(0, -(SLAB + TOP) / 2, 0))
      .paintFn((x, y, z) => {
        if (y < -TOP - 0.002) return foundationColorAt(x, y, z);
        y = 0; // the lip continues the top paint down the side
        const { edge, i, j } = cell(x, z);
        const base = (i + j) % 2 === 0 ? TILE_A : TILE_B;
        const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
        const c = mixRgb(base, TILE_B, 0.2 * n);
        return mixRgb(c, GROUT, 1 - smooth(0.003, 0.008, edge));
      });
    k.body('tiles', floor, {
      color: '#d9774a',
      roughness: 0.75,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 6000,
      maxError: 0.003,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });
  },
});
