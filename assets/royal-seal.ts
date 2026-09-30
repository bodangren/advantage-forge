import { defineAsset, sdf } from '../src/index.js';

/**
 * Royal seal (quest item): a gold stamp standing upright, about 0.24 m tall. One idea: a chunky turned
 * handle of three bulbs over a disc with a raised five-point crown, with a red velvet band.
 * Palette: gold #d4a93a (metal 1, rough 0.35), velvet #a02030. Materials: gold, velvet.
 */
const crownPoint = (i: number) => {
  const a = (i / 5) * Math.PI * 2;
  return sdf.cone([0, 0, 0], [0, 0.03, 0], 0.011, 0.005).at(Math.sin(a) * 0.056, 0.03, Math.cos(a) * 0.056);
};

export default defineAsset({
  name: 'royal-seal',
  description: 'A gold royal seal stamp with a crown-topped disc, three-bulb handle and red velvet band.',
  detail: 0.004,
  reference: 'docs/item-mockups/royal-seal-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    const disc = sdf.cylinder(0.08, 0.03, 0.008).at(0, 0.015, 0);
    const ring = sdf.cylinder(0.062, 0.02, 0.005).subtract(sdf.cylinder(0.048, 0.06)).at(0, 0.038, 0);
    let crown = ring;
    for (let i = 0; i < 5; i++) crown = crown.smoothUnion(0.006, crownPoint(i));
    const handle = sdf.chain(
      [
        [0, 0.05, 0, 0.022],
        [0, 0.08, 0, 0.036],
        [0, 0.108, 0, 0.02],
        [0, 0.135, 0, 0.03],
        [0, 0.16, 0, 0.018],
        [0, 0.188, 0, 0.033],
      ],
      0.012,
    );
    const gold = sdf.smoothUnion(0.008, disc, crown, handle);
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.35, metalness: 1, detail: 0.0055, maxTriangles: 2600 });
    k.body('velvet', sdf.cylinder(0.038, 0.03, 0.012).at(0, 0.108, 0), { color: '#a02030', roughness: 0.9, metalness: 0, detail: 0.004 });
  },
});
