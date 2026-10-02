import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note - waterfall sheet. Role: curtain placed flush on a rock-wall face.
 * Size: 1.6 m wide, 0.25 m thick, 2.6 m tall, on y = 0, facing +Z; pool disc 2 m across in front.
 * One idea: a chunky clay-like translucent water slab with white streaks and a big foam plume.
 * Palette: water #8fd0ea (opacity 0.8), white foam, pool #2a8fb0.
 */
const water = rgb('#8fd0ea');
const white = rgb('#f4fbfc');
const poolC = rgb('#2a8fb0');
const H = 2.6;

export default defineAsset({
  name: 'waterfall-sheet',
  description: 'Waterfall curtain 1.6 x 2.6 m for a cliff face: translucent blue water, white streaks, top lip lumps, foam plume and splash at the base, turquoise pool disc.',
  detail: 0.012,
  texture: { size: 1024 },
  build(k) {
    const sheet = sdf.box([1.6, H, 0.2], 0.08).at(0, H / 2, 0);
    let lips: Sdf = sheet;
    for (const [x, r] of [[-0.55, 0.15], [-0.1, 0.19], [0.4, 0.16], [0.7, 0.1]] as const) {
      lips = lips.smoothUnion(0.05, sdf.ellipsoid([r, 0.1, 0.13]).at(x, H - 0.03, 0.06));
    }
    const streaks = lips.paintFn((x, y, z, base) => {
      const n = noise.fbm(x * 9, y * 0.8, z * 2, 2);
      const s = Math.sin(x * 38 + n * 4) * 0.5 + 0.5;
      let c = mixRgb(base, white, s > 0.72 ? 0.9 : 0);
      if (y > H - 0.18) c = mixRgb(c, white, 0.5);
      return c;
    });
    k.body('sheet', streaks, { color: water, roughness: 0.15, opacity: 0.8, detail: 0.012 });

    let foam: Sdf = sdf.ellipsoid([0.8, 0.14, 0.26]).at(0, 0.12, 0.18);
    for (const [x, z, r] of [[-0.6, 0.45, 0.1], [0.5, 0.5, 0.12], [-0.2, 0.55, 0.08], [0.15, 0.45, 0.14], [0.8, 0.35, 0.07], [-0.85, 0.3, 0.07]] as const) {
      foam = foam.smoothUnion(0.04, sdf.sphere(r).at(x, r * 0.8, z));
    }
    foam = foam.smoothUnion(0.06, sdf.ellipsoid([0.5, 0.2, 0.17]).at(0.05, 0.22, 0.1));
    k.body('foam', foam.paint(white), { color: white, roughness: 0.6, detail: 0.01 });

    const pool = sdf.cylinder(1.0, 0.1, 0.03).at(0, -0.07, 0.9);
    k.body('pool', pool.paint(poolC), { color: poolC, roughness: 0.25, detail: 0.015 });
  },
});
