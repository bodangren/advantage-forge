/**
 * Sea water tile: plain seamless sea/bay slab, 2 x 2 m, y -0.3..0 nominal, water surface at y = -0.03.
 * No banks or edge features; wave highlights and foam are periodic over 2 m so tiles chain.
 * Palette: teal-blue #2a8fb0 base, lighter wave streaks, white foam flecks, sandy-blue sides.
 */
import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

const SLAB = 0.3;
const WATER_Y = -0.03;
const EDGE = 0.001;
const base = rgb('#2a8fb0');
const deep = rgb('#237a9a');
const glint = rgb('#7fd0dc');
const foam = rgb('#eaf8f6');
const sideTop = rgb('#5fb0c0');
const sideSand = rgb('#c8c39a');

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tileNoise = (x: number, z: number, f: number, o: number) => {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const s = (sx: number, sz: number) => noise.fbm(sx * f, 0, sz * f, o);
  return lerp(lerp(s(x, z), s(x - 2, z), u), lerp(s(x, z - 2), s(x - 2, z - 2), u), v);
};
const sstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Fade feature strength to 0 near the tile edges.
const inner = (x: number, z: number) => sstep(0.98, 0.8, Math.max(Math.abs(x), Math.abs(z)));

const FOAM: ReadonlyArray<readonly [number, number, number]> = [
  [-0.5, -0.4, 0.03], [0.3, 0.55, 0.025], [0.62, -0.2, 0.03], [-0.2, 0.2, 0.022],
  [-0.65, 0.6, 0.026], [0.1, -0.7, 0.024], [0.7, 0.75, 0.02],
];

function topColor(x: number, z: number) {
  const n = tileNoise(x, z, 2.2, 3);
  let c = mixRgb(base, deep, sstep(-0.1, 0.5, n) * 0.5);
  // Wave streaks: periodic sines warped by noise, strongest in crests.
  const w = Math.sin((x * 2 + z * 1) * Math.PI * 2 + 3 * n) * Math.sin(z * Math.PI * 3 + 2 * n);
  c = mixRgb(c, glint, sstep(0.45, 0.85, w) * 0.55 * inner(x, z));
  for (const [cx, cz, r] of FOAM) {
    const d = Math.hypot(x - cx, z - cz) / r;
    if (d < 1) c = mixRgb(c, foam, (1 - d) * 0.9);
  }
  return c;
}

function sideColor(x: number, y: number) {
  const along = Math.abs(x) > 0.9 ? x : x;
  const t = sstep(-0.05, -0.2, y);
  return mixRgb(sideTop, sideSand, t * (0.9 + 0.1 * Math.sin(along * 9)));
}

export default defineAsset({
  name: 'sea-water',
  description: 'Plain seamless 2 m sea tile, 0.3 m slab with the water surface at y = -0.03: teal-blue water with soft wave highlights and tiny foam flecks, sandy-blue sides.',
  detail: 0.025,
  texture: { size: 1024 },
  build(k) {
    const top = WATER_Y;
    const slab = sdf.box([2 + 2 * EDGE, SLAB + top + 2 * EDGE, 2 + 2 * EDGE]).at(0, (-SLAB + top) / 2, 0);
    const body = slab.paintFn((x, y, z) => {
      const edge = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
      return edge && y < top - 0.005 ? sideColor(x, y) : topColor(x, z);
    });
    const bump = (x: number, y: number, z: number) =>
      y > top - 0.01 ? 0.003 * tileNoise(x, z, 8, 2) * inner(x, z) : 0;
    k.body('sea', body, { color: base, roughness: 0.4, bump });
  },
});
