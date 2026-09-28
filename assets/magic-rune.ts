import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Magic rune slab (props/world/magic-rune), matched to docs/item-mockups/magic-rune-mock.jpg.
 * Size: 1.2 m square, 0.06 m thick, lying on y = 0. One idea: a worn grey stone slab with a
 * carved rune circle that glows purple: two rings, a five-point star, and eight small glyphs.
 * Palette: stone #6f7680 / #555c66, glow #b060ff on a dark base #2a0a3a.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#555c66');
const TOP = 0.06;

/** A mark on the slab: a shape in the XZ plane, stretched through Y so it crosses the top. */
const stroke = (a: [number, number], b: [number, number], r = 0.012) => sdf.capsule([a[0], 0, a[1]], [b[0], 0, b[1]], r).elongate(0, 0.2, 0);
const ring = (r: number, w: number) => sdf.cylinder(r + w, 0.4, 0).subtract(sdf.cylinder(r - w, 0.5, 0));

export default defineAsset({
  name: 'magic-rune',
  description: 'A worn grey stone slab with a carved rune circle glowing purple: two rings, a five-point star, and eight glyphs.',
  detail: 0.004,
  reference: 'docs/item-mockups/magic-rune-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const star = [];
    const pts: [number, number][] = Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return [Math.cos(a) * 0.3, Math.sin(a) * 0.3];
    });
    for (let i = 0; i < 5; i++) star.push(stroke(pts[i]!, pts[(i + 2) % 5]!, 0.014));
    const glyphs = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const c: [number, number] = [Math.cos(a) * 0.39, Math.sin(a) * 0.39];
      const t: [number, number] = [-Math.sin(a) * 0.025, Math.cos(a) * 0.025];
      const n: [number, number] = [Math.cos(a) * 0.025, Math.sin(a) * 0.025];
      glyphs.push(stroke([c[0] - n[0], c[1] - n[1]], [c[0] + n[0], c[1] + n[1]], 0.01));
      glyphs.push(stroke([c[0] + n[0], c[1] + n[1]], [c[0] + n[0] + t[0], c[1] + n[1] + t[1]], 0.01));
    }
    const pattern = sdf.union(ring(0.46, 0.018), ring(0.32, 0.012), ...star, ...glyphs);
    const topLayer = sdf.halfSpace([0, -1, 0], -(TOP - 0.004)).intersect(sdf.box([2, 1, 2]).at(0, 0.3, 0));

    const slab = sdf
      .box([1.2, TOP, 1.2], 0.02)
      .at(0, TOP / 2, 0)
      .displace(0.003, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 2));
    k.body(
      'slab',
      slab.subtract(pattern.intersect(topLayer)).paintFn((x, y, z) => mixRgb(STONE, STONE_DARK, 0.2 + 0.5 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 3)))),
      { color: '#6f7680', roughness: 0.9, metalness: 0, bump: (x, y, z) => 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2) },
    );
    k.body('rune', slab.round(-0.0015).intersect(pattern).intersect(topLayer), {
      color: '#2a0a3a',
      roughness: 0.3,
      metalness: 0,
      emissive: '#b060ff',
      emissiveIntensity: 2.4,
      detail: 0.003,
    });
  },
});
