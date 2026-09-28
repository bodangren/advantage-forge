import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Wheel of cheese (props/food/wheel), matched to docs/item-mockups/wheel-mock.jpg.
 * Size: 0.4 m wide, 0.14 m tall, on y = 0, with the cut wedge lying beside it. One idea: a pale
 * yellow cheese wheel with a golden rind, a wedge cut out that shows round holes inside.
 * Palette: rind #e2b02c, paste #f7d95a / hole shade #d9a830. Material: waxy cheese (0.55).
 */

const RIND = rgb('#e2b02c');
const PASTE = rgb('#f7d95a');
const SHADE = rgb('#d9a830');

const R = 0.2;
const H = 0.14;
const A1 = (-24 * Math.PI) / 180;
const A2 = (24 * Math.PI) / 180;

export default defineAsset({
  name: 'wheel',
  description: 'A wheel of yellow cheese with a golden rind and a wedge cut out, the wedge lying beside it, holes on the cut faces.',
  detail: 0.004,
  reference: 'docs/item-mockups/wheel-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const disc = sdf.cylinder(R, H, 0.03).at(0, H / 2, 0);
    const sector = sdf
      .halfSpace([Math.sin(A1), 0, -Math.cos(A1)], 0)
      .intersect(sdf.halfSpace([-Math.sin(A2), 0, Math.cos(A2)], 0))
      .intersect(sdf.box([0.6, 0.4, 0.6]).at(0.2, 0.1, 0));
    const holes = sdf.union(
      sdf.sphere(0.022).at(0.12, 0.08, 0.045),
      sdf.sphere(0.016).at(0.07, 0.045, -0.025),
      sdf.sphere(0.018).at(0.16, 0.05, -0.06),
      sdf.sphere(0.012).at(0.1, 0.105, -0.042),
      sdf.sphere(0.02).at(-0.08, H + 0.006, 0.07),
      sdf.sphere(0.014).at(-0.03, H + 0.004, -0.11),
      sdf.sphere(0.017).at(0.0, 0.07, R + 0.006),
    );
    const paint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      const rind = r > R - 0.012 || y < 0.01 || y > H - 0.01;
      const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      return mixRgb(rind ? RIND : PASTE, SHADE, 0.15 * n);
    };
    const wheel = disc.subtract(sector).smoothSubtract(0.004, holes).paintFn(paint);
    k.body('cheese', wheel, { color: '#f7d95a', roughness: 0.55, metalness: 0, textureDensity: 2 });

    // The cut wedge, pulled out and turned a little.
    const wedge = disc.intersect(sector).smoothSubtract(0.004, holes).paintFn(paint).rotateY(-20).at(0.13, 0, 0.12);
    k.body('wedge', wedge, { color: '#f7d95a', roughness: 0.55, metalness: 0, textureDensity: 2 });
  },
});
