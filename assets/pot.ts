import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Flower pot (props/containers/pot), matched to docs/item-mockups/pot-mock.jpg.
 * Size: 0.3 m wide, 0.4 m tall, on y = 0. One idea: a terracotta pot with a thick rolled rim and a
 * darker painted band, holding a leafy green plant with two red flowers. Palette: terracotta
 * #d9774a / band #b85a35, soil #5a3a22, leaves #5cb85c / #3f9248, petals #e0443a, centers #f2c040.
 */

const CLAY = rgb('#d9774a');
const BAND = rgb('#b85a35');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3f9248');

export default defineAsset({
  name: 'pot',
  description: 'A terracotta flower pot with a rolled rim and a painted band, holding a leafy plant with two red flowers.',
  detail: 0.003,
  reference: 'docs/item-mockups/pot-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const body = sdf.cone([0, 0.0, 0], [0, 0.2, 0], 0.1, 0.128);
    const rim = sdf.cylinder(0.146, 0.05, 0.014).at(0, 0.215, 0);
    const hollow = sdf.cone([0, 0.035, 0], [0, 0.26, 0], 0.084, 0.124);
    const pot = sdf
      .smoothUnion(0.008, body, rim)
      .subtract(hollow)
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)))
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 25, y * 25, z * 25, 2);
        const c = mixRgb(CLAY, BAND, 0.15 * n);
        return Math.abs(y - 0.12) < 0.012 ? BAND : c;
      });
    k.body('pot', pot, { color: '#d9774a', roughness: 0.8, metalness: 0, textureDensity: 2 });
    k.body('soil', sdf.cylinder(0.12, 0.02, 0.006).at(0, 0.215, 0), { color: '#5a3a22', roughness: 0.95, metalness: 0 });

    // Plant: two flower stems and six leaves fanning out from the soil.
    const parts = [
      sdf.chain([[0, 0.22, 0, 0.007], [0.01, 0.3, 0.005, 0.006], [0.02, 0.37, 0, 0.005]], 0.01),
      sdf.chain([[0, 0.22, 0, 0.006], [-0.02, 0.28, 0.02, 0.005], [-0.035, 0.33, 0.03, 0.0045]], 0.01),
    ];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + 15) * (Math.PI / 180);
      const x = Math.cos(a) * 0.06;
      const z = Math.sin(a) * 0.06;
      parts.push(
        sdf
          .ellipsoid([0.055, 0.009, 0.026])
          .rotateZ(22 + (i % 2) * 12)
          .rotateY((-a * 180) / Math.PI)
          .at(x, 0.26 + (i % 3) * 0.018, z),
      );
    }
    k.body(
      'plant',
      sdf.smoothUnion(0.008, ...parts).paintFn((x, y, z) => mixRgb(LEAF, LEAF_DARK, 0.2 + 0.5 * (0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2)))),
      { color: '#5cb85c', roughness: 0.65, metalness: 0 },
    );

    const flower = (cx: number, cy: number, cz: number) =>
      sdf.union(
        ...Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3;
          return sdf.sphere(0.017).at(cx + Math.cos(a) * 0.02, cy, cz + Math.sin(a) * 0.02);
        }),
      );
    k.body('petals', sdf.union(flower(0.02, 0.375, 0), flower(-0.035, 0.335, 0.03)), { color: '#e0443a', roughness: 0.6, metalness: 0 });
    k.body('centers', sdf.union(sdf.sphere(0.014).at(0.02, 0.384, 0), sdf.sphere(0.014).at(-0.035, 0.344, 0.03)), {
      color: '#f2c040',
      roughness: 0.6,
      metalness: 0,
    });
  },
});
