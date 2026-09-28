import { defineAsset, rgb, sdf } from '../src/index.js';

/**
 * Gold earrings (equipment/accessories/earring), matched to docs/item-mockups/earring-mock.jpg.
 * Size: two earrings 0.05 m long lying flat on y = 0, 0.07 m apart. One idea: a small gold hoop
 * with a hanging teardrop green gem in a gold cap. Palette: gold #d4a93a, gem #3dbb5a.
 */

export default defineAsset({
  name: 'earring',
  description: 'A pair of gold hoop earrings lying flat, each with a hanging teardrop green gem.',
  detail: 0.0012,
  reference: 'docs/item-mockups/earring-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const gold = [];
    const gems = [];
    for (const x of [-0.035, 0.035]) {
      gold.push(sdf.torus(0.012, 0.0025).at(x, 0.0025, -0.01));
      gold.push(sdf.sphere(0.0045).at(x, 0.004, 0.004));
      gems.push(sdf.smoothUnion(0.004, sdf.sphere(0.008).at(x, 0.008, 0.018), sdf.cone([x, 0.006, 0.006], [x, 0.008, 0.016], 0.002, 0.007)));
    }
    k.body('gold', sdf.union(...gold), { color: '#d4a93a', roughness: 0.3, metalness: 1 });
    k.body('gems', sdf.union(...gems), { color: '#3dbb5a', roughness: 0.15, metalness: 0, flat: true });
  },
});
