import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Sling (equipment/ranged-weapons/sling), matched to docs/item-mockups/sling-mock.jpg.
 * Size: 0.7 m long, lying flat on y = 0. One idea: a cupped leather pouch holding a round grey
 * stone, with two long braided cords, one ending in a finger loop and one in a knot.
 * Palette: leather #8a5a35 / #6b4226, cords #7a5a3a, stone #8a94a0.
 */

export default defineAsset({
  name: 'sling',
  description: 'A leather sling lying flat: a cupped pouch holding a round stone, two long cords with a loop and a knot.',
  detail: 0.002,
  reference: 'docs/item-mockups/sling-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const pouch = sdf
      .ellipsoid([0.06, 0.03, 0.045])
      .at(0, 0.028, 0)
      .subtract(sdf.ellipsoid([0.05, 0.03, 0.036]).at(0, 0.045, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)));
    k.body(
      'pouch',
      pouch.paintFn((x, y, z) => mixRgb(rgb('#8a5a35'), rgb('#6b4226'), 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2)))),
      { color: '#8a5a35', roughness: 0.7, metalness: 0 },
    );
    k.body('stone', sdf.sphere(0.03).at(0, 0.04, 0).displace(0.002, (x, y, z) => noise.noise3(x * 60, y * 60, z * 60)), { color: '#8a94a0', roughness: 0.8, metalness: 0 });
    const cordL = sdf.chain([[-0.055, 0.02, 0, 0.005], [-0.12, 0.006, 0.02, 0.005], [-0.2, 0.005, 0.01, 0.005], [-0.28, 0.005, -0.03, 0.005], [-0.33, 0.005, -0.02, 0.005]], 0.006);
    const cordR = sdf.chain([[0.055, 0.02, 0, 0.005], [0.12, 0.006, -0.02, 0.005], [0.2, 0.005, -0.01, 0.005], [0.28, 0.005, 0.03, 0.005], [0.32, 0.005, 0.035, 0.005]], 0.006);
    const loop = sdf.torus(0.02, 0.005).at(-0.35, 0.005, -0.02);
    const knot = sdf.sphere(0.011).at(0.325, 0.009, 0.035);
    k.body('cords', sdf.union(cordL, cordR, loop, knot), { color: '#7a5a3a', roughness: 0.8, metalness: 0 });
  },
});
