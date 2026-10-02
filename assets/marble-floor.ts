import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Cream marble floor tile: 2 m x 2 m slab, 0.3 m thick, top at y = 0. Polished cream #efe6d2 with
 * soft grey-gold veins #c9bda3 that fade toward the edges (so neighbours join without a seam) and a
 * thin darker inlaid line 0.15 m from each edge; chained tiles form a square grid.
 */
const CREAM = rgb('#efe6d2');
const VEIN = rgb('#c9bda3');
const INLAY = rgb('#b3a583');
const EDGE = 0.001;
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'marble-floor',
  description: 'A 2 m square cream marble floor tile, 0.3 m slab with its top at y = 0, polished with soft veins and a thin inlaid border line; tiles seamlessly.',
  detail: 0.01,
  texture: { size: 1024 },
  build(k) {
    const slab = sdf
      .box([2 + 2 * EDGE, 0.3 + 2 * EDGE, 2 + 2 * EDGE])
      .at(0, -0.15, 0)
      .paintFn((x, y, z) => {
        if (y < -0.004) return mixRgb(CREAM, VEIN, 0.25);
        const w = noise.fbm(x * 1.6, 0.5, z * 1.6, 2) * 0.5;
        const v = Math.abs(noise.fbm(x * 1.8 + w, 2.3, z * 1.8 - w, 3));
        const fade = smooth(0.1, 0.35, 1 - Math.max(Math.abs(x), Math.abs(z)));
        const vein = (1 - smooth(0.015, 0.07, v)) * fade;
        let c = mixRgb(CREAM, VEIN, Math.min(0.85, vein) * 0.9);
        const d = Math.abs(1 - Math.max(Math.abs(x), Math.abs(z)) - 0.15);
        c = mixRgb(c, INLAY, 1 - smooth(0.004, 0.009, d));
        return c;
      });
    k.body('marble', slab, {
      color: '#efe6d2',
      roughness: 0.25,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 2000,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });
  },
});
