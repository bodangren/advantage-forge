import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Bamboo fishing pole (equipment/tools/fishing-pole), matched to docs/item-mockups/fishing-pole-mock.jpg.
 * Size: 1.6 m long, lying flat on y = 0 along X. One idea: a tapered bamboo cane with nodes, a line
 * from the tip lying in a loose curve, a red-and-white cork float, and a small hook.
 * Palette: bamboo #e0b865 / node #b8893e, line #e8e4d8, float #d8302a / #f2ede0, hook #9aa0a8.
 */

const BAMBOO = rgb('#e0b865');
const NODE = rgb('#b8893e');

export default defineAsset({
  name: 'fishing-pole',
  description: 'A bamboo fishing pole lying flat: a tapered cane with nodes, a line, a red and white cork float, and a hook.',
  detail: 0.003,
  reference: 'docs/item-mockups/fishing-pole-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const node = (x: number) => Math.pow(0.5 + 0.5 * Math.cos(((x + 0.8) / 0.22) * 2 * Math.PI), 20);
    const cane = sdf
      .cone([-0.8, 0.02, 0], [0.8, 0.012, 0], 0.02, 0.008)
      .displace(0.003, (x) => -node(x));
    k.body('cane', cane.paintFn((x) => mixRgb(BAMBOO, NODE, node(x))), { color: '#e0b865', roughness: 0.5, metalness: 0 });
    const line = sdf.chain(
      [[0.8, 0.012, 0, 0.0018], [0.85, 0.004, 0.08, 0.0018], [0.78, 0.003, 0.2, 0.0018], [0.62, 0.003, 0.26, 0.0018], [0.5, 0.003, 0.22, 0.0018]],
      0.004,
    );
    k.body('line', line, { color: '#e8e4d8', roughness: 0.5, metalness: 0 });
    const float = sdf.ellipsoid([0.02, 0.016, 0.02]).at(0.66, 0.016, 0.255);
    k.body('float', float.paintFn((x) => (x > 0.66 ? rgb('#d8302a') : rgb('#f2ede0'))), { color: '#d8302a', roughness: 0.4, metalness: 0 });
    const hook = sdf.torus(0.012, 0.0022).rotateZ(90).at(0.49, 0.012, 0.215).intersect(sdf.halfSpace([0, 0, -1], -0.21).intersect(sdf.box([1, 1, 1]).at(0.5, 0, 0.5)));
    k.body('hook', hook, { color: '#9aa0a8', roughness: 0.3, metalness: 0.85 });
  },
});
