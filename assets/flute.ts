import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Wooden flute (equipment/tools/flute), matched to docs/item-mockups/flute-mock.jpg.
 * Size: 0.4 m long, lying on y = 0 along X. One idea: a pale honey-wood tube with a mouth hole,
 * six finger holes, open ends, and two brass rings. Palette: wood #e0a55a / grain #b87a3a,
 * hole #4a2a14, brass #d4a93a. Materials: waxed wood (0.55), brass (0.35, metal 0.9).
 */

const WOOD = rgb('#e0a55a');
const GRAIN = rgb('#b87a3a');
const HOLE = rgb('#4a2a14');

const R = 0.018;
const L = 0.4;
const HOLES = [-0.02, 0.02, 0.06, 0.1, 0.14, 0.175];

export default defineAsset({
  name: 'flute',
  description: 'A pale wooden flute with a mouth hole, six finger holes, open ends, and two brass rings.',
  detail: 0.0025,
  reference: 'docs/item-mockups/flute-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const tube = sdf.cylinder(R, L, 0.004).rotateZ(90).at(0, R, 0);
    const bore = sdf.cylinder(R * 0.55, L + 0.02, 0).rotateZ(90).at(0, R, 0);
    const holes = sdf.union(
      sdf.ellipsoid([0.0075, 0.03, 0.006]).at(-0.15, R * 2, 0),
      ...HOLES.map((x) => sdf.cylinder(0.0048, 0.03, 0).at(x, R * 2, 0)),
    );
    const flute = tube.subtract(bore).smoothSubtract(0.0015, holes).paintFn((x, y, z) => {
      const d = Math.hypot(y - R, z);
      if (d < R * 0.75) return HOLE;
      const g = 0.5 + 0.5 * noise.fbm(x * 12, y * 90, z * 90, 3);
      return mixRgb(WOOD, GRAIN, 0.1 + 0.3 * g * g);
    });
    k.body('wood', flute, { color: '#e0a55a', roughness: 0.55, metalness: 0, textureDensity: 2 });

    const rings = sdf.union(
      ...[-0.185, 0.188].map((x) => sdf.cylinder(R + 0.0025, 0.012, 0.002).rotateZ(90).at(x, R, 0)),
    ).subtract(bore);
    k.body('brass', rings, { color: '#d4a93a', roughness: 0.35, metalness: 0.9 });
  },
});
