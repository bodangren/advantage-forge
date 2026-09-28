import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Rough wooden beam (architecture/building-parts/beam), matched to docs/item-mockups/beam-mock.jpg.
 * Size: 2 m long along X, 0.2 m square, lying on y = 0. One idea: an adzed timber with visible
 * grain and two iron straps with round nail heads. Palette: timber #b07a45 / grain #7a4f2a,
 * iron #5a5f67 / nails #3d4148.
 */

const WOOD = rgb('#b07a45');
const GRAIN = rgb('#7a4f2a');

export default defineAsset({
  name: 'beam',
  description: 'A rough adzed wooden beam, 2 m long, with visible grain and two iron straps with nail heads.',
  detail: 0.006,
  reference: 'docs/item-mockups/beam-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const beam = sdf
      .box([2, 0.2, 0.2], 0.022)
      .at(0, 0.1, 0)
      .displace(0.004, (x, y, z) => noise.fbm(x * 3, y * 30, z * 30, 2) * 0.6 + 0.4 * Math.abs(Math.sin(x * 9)));
    k.body(
      'beam',
      beam.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.1 + 0.5 * Math.pow(0.5 + 0.5 * noise.fbm(x * 2, y * 60, z * 60, 3), 2))),
      { color: '#b07a45', roughness: 0.8, metalness: 0, bump: (x, y, z) => 0.0015 * noise.fbm(x * 4, y * 90, z * 90, 2) },
    );
    const straps = [];
    for (const x of [-0.62, 0.62]) {
      straps.push(sdf.box([0.07, 0.216, 0.216], 0.012).at(x, 0.1, 0).subtract(sdf.box([0.1, 0.19, 0.19]).at(x, 0.1, 0)));
      for (const [y, z] of [[0.21, 0.05], [0.21, -0.05], [0.1, 0.109], [0.1, -0.109]] as const) straps.push(sdf.sphere(0.012).at(x, y, z));
    }
    k.body('iron', sdf.union(...straps), { color: '#5a5f67', roughness: 0.5, metalness: 0.7 });
  },
});
