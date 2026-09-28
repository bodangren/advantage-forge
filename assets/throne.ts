import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Stone throne (props/furniture/throne), matched to docs/item-mockups/throne-mock.jpg.
 * Size: 1.1 m wide, 1.85 m tall, 0.9 m deep, on y = 0, facing +Z. One idea: a heavy grey stone
 * throne with a high peaked back, thick rounded armrests, a red cushion and back panel, gold
 * spikes and studs, and a red gem at the top. Palette: stone #7d848c / #5f666e, red #b8402a /
 * #8a2a1e, gold #d4a93a, gem #c0302a.
 */

const STONE = rgb('#7d848c');
const STONE_DARK = rgb('#5f666e');

export default defineAsset({
  name: 'throne',
  description: 'A heavy stone throne with a high peaked back, rounded armrests, a red cushion and back panel, gold spikes, and a red gem.',
  detail: 0.008,
  reference: 'docs/item-mockups/throne-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const back = sdf
      .box([1.0, 1.5, 0.2], 0.04)
      .at(0, 1.05, -0.32)
      .intersect(sdf.halfSpace([0.55, 1, 0], 1.62).intersect(sdf.halfSpace([-0.55, 1, 0], 1.62)));
    const parts = [
      sdf.box([1.05, 0.5, 0.85], 0.05).at(0, 0.25, 0),
      back,
      ...[-1, 1].map((s) => sdf.box([0.2, 0.32, 0.75], 0.05).at(s * 0.46, 0.66, 0.02)),
      ...[-1, 1].map((s) => sdf.capsule([s * 0.46, 0.84, -0.3], [s * 0.46, 0.84, 0.36], 0.12)),
      sdf.box([1.12, 0.08, 0.92], 0.03).at(0, 0.04, 0),
    ];
    k.body(
      'stone',
      sdf.union(...parts).paintFn((x, y, z) => mixRgb(STONE, STONE_DARK, 0.15 + 0.45 * (0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 3)))),
      { color: '#7d848c', roughness: 0.85, metalness: 0, bump: (x, y, z) => 0.002 * noise.fbm(x * 15, y * 15, z * 15, 2) },
    );
    const red = sdf.union(sdf.box([0.72, 0.12, 0.66], 0.05).at(0, 0.54, 0.06), sdf.box([0.62, 0.9, 0.06], 0.025).at(0, 1.05, -0.2));
    k.body(
      'cushion',
      red.paintFn((x, y, z) => mixRgb(rgb('#b8402a'), rgb('#8a2a1e'), 0.2 + 0.3 * (0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2)))),
      { color: '#b8402a', roughness: 0.8, metalness: 0 },
    );
    const gold = [
      ...[-1, 1].map((s) => sdf.cone([s * 0.4, 1.52, -0.32], [s * 0.46, 1.68, -0.32], 0.06, 0.004)),
      ...[-1, 1].map((s) => sdf.cone([s * 0.46, 0.84, 0.44], [s * 0.46, 0.84, 0.54], 0.07, 0.004)),
      ...[-1, 1].flatMap((s) => [0.8, 1.1, 1.35].map((y) => sdf.sphere(0.025).at(s * 0.36, y, -0.17))),
      sdf.torus(0.06, 0.015).rotateX(90).at(0, 1.72, -0.22),
    ];
    k.body('gold', sdf.union(...gold), { color: '#d4a93a', roughness: 0.3, metalness: 1 });
    k.body('gem', sdf.sphere(0.05).at(0, 1.72, -0.2), { color: '#c0302a', roughness: 0.15, metalness: 0, flat: true, detail: 0.006 });
  },
});
