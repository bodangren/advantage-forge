/**
 * Sewer water tile: plain seamless 2 x 2 m slab, y -0.3..-0.03, murky green water.
 * Palette: #4f7d3c base, darker green swirls, pale scum patches, tiny bubbles, wet brick-gray sides #4a4a44.
 * Periodic over 2 m so tiles chain; no banks or edge features.
 */
import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

const SLAB = 0.3;
const WATER_Y = -0.03;
const EDGE = 0.001;
const base = rgb('#2f4a34');
const deep = rgb('#1f3226');
const scum = rgb('#5f7a2e');
const bubble = rgb('#6f6a3e');
const sideTop = rgb('#3f4a38');
const sideBrick = rgb('#4a4a44');
const sideDark = rgb('#3a3a36');

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
const inner = (x: number, z: number) => sstep(0.98, 0.8, Math.max(Math.abs(x), Math.abs(z)));

const BUBBLES: ReadonlyArray<readonly [number, number, number]> = [
  [-0.55, -0.35, 0.02], [0.35, 0.5, 0.016], [0.6, -0.3, 0.02], [-0.15, 0.25, 0.014],
  [-0.7, 0.55, 0.018], [0.15, -0.65, 0.015], [0.72, 0.7, 0.012], [-0.3, -0.8, 0.014],
];
const SCUM: ReadonlyArray<readonly [number, number, number]> = [
  [-0.4, 0.45, 0.16], [0.5, -0.5, 0.2], [0.05, 0.05, 0.12], [0.6, 0.55, 0.13],
];

function topColor(x: number, z: number) {
  const n = tileNoise(x, z, 2.2, 3);
  let c = mixRgb(base, deep, sstep(-0.1, 0.4, n) * 0.55);
  const sw = Math.sin((x * 1 + z * 2) * Math.PI + 4 * n) * Math.sin(x * Math.PI * 2 + 3 * n);
  c = mixRgb(c, deep, sstep(0.3, 0.8, sw) * 0.6 * inner(x, z));
  // Subtle ripple lines.
  const rp = Math.sin((x * 3 + z * 1) * Math.PI * 2 + 5 * n);
  c = mixRgb(c, rgb('#3d5c44'), sstep(0.88, 1, rp) * 0.5 * inner(x, z));
  // Slime-green and brown scum streaks.
  for (const [cx, cz, r] of SCUM) {
    const dx = (x - cx) / (r * 2.2);
    const dz = (z - cz) / (r * 0.5);
    const d = Math.hypot(dx, dz);
    if (d < 1) c = mixRgb(c, (cx + cz) > 0.3 ? scum : bubble, sstep(1, 0.4, d) * 0.7);
  }
  return c;
}

function sideColor(x: number, y: number) {
  const brick = Math.floor((y + 0.3) / 0.06);
  const mortar = Math.abs(((y + 0.3) / 0.06) % 1) < 0.08 || Math.abs(((x * 8 + (brick % 2) * 0.5) % 1)) < 0.06;
  const c = mortar ? sideDark : sideBrick;
  return mixRgb(c, sideTop, sstep(-0.12, -0.05, y));
}

export default defineAsset({
  name: 'sewer-water',
  description: 'Plain seamless 2 m sewer water tile, 0.3 m slab, surface at y = -0.03: murky green water with darker swirls, pale scum patches, tiny bubbles, wet brick-gray sides.',
  detail: 0.025,
  texture: { size: 1024 },
  build(k) {
    const top = WATER_Y;
    const slab = sdf.box([2 + 2 * EDGE, SLAB + top + 2 * EDGE, 2 + 2 * EDGE]).at(0, (-SLAB + top) / 2, 0);
    const body = slab.paintFn((x, y, z) => {
      const edge = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
      return edge && y < top - 0.005 ? sideColor(Math.abs(x) > 0.995 ? z : x, y) : topColor(x, z);
    });
    const bump = (x: number, y: number, z: number) =>
      y > top - 0.01 ? 0.003 * tileNoise(x, z, 7, 2) * inner(x, z) : 0;
    k.body('sewer', body, { color: base, roughness: 0.25, bump });
  },
});
