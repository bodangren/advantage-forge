/**
 * Ice ground tile: seamless frozen-ice slab, 2 x 2 m, 0.3 m thick, walkable top at y = 0.
 * One idea: glossy pale blue ice with deeper blue veins, faint white cracks and frost patches.
 * All painted features are periodic over 2 m so tiles chain. Sides: deeper blue-white.
 * Palette: base #bfe3f2, veins #8fc7e3, crack/frost white #f4fbff, sides #a9cfe2.
 * Material: one `ice` body, roughness 0.2.
 */
import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

const SLAB = 0.3;
const EDGE = 0.001;
const base = rgb('#bfe3f2');
const vein = rgb('#8fc7e3');
const white = rgb('#f4fbff');
const sideTop = rgb('#d4ecf6');
const sideDeep = rgb('#9cc4da');

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

function topColor(x: number, z: number) {
  // Deeper veins: thin bands where a noise field crosses zero.
  const n = tileNoise(x, z, 1.6, 3);
  const veinK = 1 - sstep(0.0, 0.07, Math.abs(n - 0.02));
  let c = mixRgb(base, vein, 0.25 * sstep(-0.3, 0.4, tileNoise(x, z, 1.1, 2)));
  c = mixRgb(c, vein, veinK * 0.8);
  // Faint white cracks: a second thin zero-crossing set, kept narrow.
  const m = tileNoise(x + 0.7, z - 0.3, 2.6, 3);
  const crack = 1 - sstep(0.0, 0.028, Math.abs(m));
  c = mixRgb(c, white, crack * 0.6);
  // Frost patches.
  const f = tileNoise(x - 0.4, z + 0.9, 3.4, 3);
  c = mixRgb(c, white, sstep(0.22, 0.5, f) * 0.5);
  return c;
}

export default defineAsset({
  name: 'ice-ground',
  description: 'Seamless 2 m frozen-ice tile, 0.3 m slab, top at y = 0: glossy pale blue ice with deeper veins, faint white cracks and frost patches, blue-white sides.',
  detail: 0.025,
  texture: { size: 1024 },
  build(k) {
    const slab = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const body = slab.paintFn((x, y, z) => {
      const side = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
      if (side && y < -0.005) return mixRgb(sideTop, sideDeep, sstep(-0.02, -0.28, y));
      return topColor(x, z);
    });
    const bump = (x: number, y: number, z: number) =>
      y > -0.01 ? 0.0015 * tileNoise(x, z, 6, 2) : 0;
    k.body('ice', body, { color: base, roughness: 0.2, textureDensity: 2, bump });
  },
});
