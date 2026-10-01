import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Cobblestone road corner (architecture/landscape-parts/cobble-road-corner): a modular 2 m x 2 m ground slab, 0.3 m thick with
 * its top at y = 0 (the old 0.08 m tile design moved down; cobbles rise to y = 0, gaps dip below). The road bends through the middle of the -Z edge and the middle of the +X edge, like dirt-road-corner. The road is 1.2 m wide, made of domed
 * warm-grey cobbles with dark gaps (a Voronoi pattern that repeats every 2 m, so cobbles line up
 * across tiles), set flush in bright grass. The road edge wobbles only away from the tile edges.
 * Palette: grass #6fb43c / #57942f / #8fca52, cobbles #8a8078 / #9a9088 / #7a7068 / #a39688,
 * gaps #3a342e.
 */

const CELLS = 11;
const CELL = 2 / CELLS;
const TOP = 0.08; // old tile height; the design is shifted down by this
const SLAB = 0.3;
const EDGE = 0.001;
const GRAVEL = rgb('#7a7670');
const SOIL = rgb('#7a4a2a');
const SOIL_DARK = rgb('#57331d');
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
const center = (x: number, z: number) => Math.abs(Math.hypot(x - 1, z + 1) - 1);
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
  name: 'cobble-road-corner',
  description: 'A 2 m cobblestone road slab (0.3 m thick, top at y = 0, gravel and soil sides): a quarter bend of domed cobbles from the -Z edge to the +X edge through grass.',
  detail: 0.015,
  reference: 'docs/item-mockups/cobble-road-corner-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const carve = (x: number, y: number, z: number) => {
      const inRoad = 1 - smooth(-0.04, 0.02, road(x, z));
      if (inRoad <= 0) return 0;
      const { edge } = cells(x, z);
      return inRoad * smooth(0.04, 0.074, y + TOP) * (1 - smooth(0.004, 0.05, edge));
    };
    const topColor = (x: number, y: number, z: number) => {
      const r = road(x, z);
      const n = 0.5 + 0.5 * noise.fbm(x * 3, 0, z * 3, 3);
      const grass = mixRgb(mixRgb(GRASS, GRASS_DARK, 0.5 * n * n), GRASS_LIGHT, 0.25 * (0.5 + 0.5 * noise.noise3(x * 30, 0, z * 30)));
      if (r > 0.02) return grass;
      const { edge, id } = cells(x, z);
      let c = mixRgb(STONES[id % STONES.length]!, STONE_DARK, 0.2 * (0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2)));
      c = mixRgb(c, STONE_DARK, 0.5 * (1 - smooth(0.008, 0.03, edge)));
      c = mixRgb(c, GAP, 1 - smooth(0.003, 0.008, edge));
      return mixRgb(c, grass, smooth(-0.04, 0.02, r));
    };
    const sideColor = (x: number, y: number, z: number) => {
      const along = Math.abs(x) > Math.abs(z) ? z : x;
      const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
      if (y > -drip) return topColor(x, 0, z);
      const depth = -y / SLAB;
      const onRoad = road(x, z) < 0.02;
      let c = onRoad ? mixRgb(GRAVEL, rgb('#55514c'), 0.2 + depth * 0.5) : mixRgb(SOIL, SOIL_DARK, 0.15 + depth * 0.55);
      const strata = Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
      c = mixRgb(c, onRoad ? rgb('#5f5b56') : SOIL_DARK, Math.max(0, strata - 0.6) * 0.8);
      const sp = noise.fbm(along * 9, y * 9, 3.1, 2);
      if (sp > 0.4) c = mixRgb(c, onRoad ? rgb('#4a4641') : rgb('#9a8a78'), Math.min(1, (sp - 0.4) * 6) * 0.8);
      return c;
    };
    const tile = sdf
      .box([2.1, SLAB + 2 * EDGE, 2.1], 0.003)
      .at(0, -SLAB / 2, 0)
      .displace(0.016, (x, y, z) => carve(x, y, z), 1.5)
      .intersect(sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0))
      .paintFn((x, y, z) => (y > -0.01 ? topColor(x, y, z) : sideColor(x, y, z)));
    k.body('tile', tile, {
      color: '#6fb43c',
      roughness: 0.92,
      metalness: 0,
      maxTriangles: 6000,
      maxError: 0.004,
      bump: (x, y, z) => y < -0.01 ? 0 : 0.0012 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });
  },
});
