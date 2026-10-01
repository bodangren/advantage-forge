import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Great axe (equipment/melee-weapons/great-axe), matched to docs/item-mockups/great-axe-mock.jpg.
 * Size: 1.25 m tall, standing on its butt. One idea: a long wooden haft with leather wraps under a
 * double crescent steel head with a central iron block and a short top spike.
 * Palette: haft #8a5a32 / grain #5e3a1e, wraps #5a3522, blades #c9ccd0 / edge #e8ebee, block #6e747b.
 */

const WOOD = rgb('#8a5a32');
const GRAIN = rgb('#5e3a1e');
const STEEL = rgb('#b8bec6');
const EDGE = rgb('#e8ebee');
const HEAD_Y = 1.02;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'great-axe',
  description: 'A two-handed great axe: a long wooden haft with leather wraps and a double crescent steel head with a top spike.',
  detail: 0.004,
  reference: 'docs/item-mockups/great-axe-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.45, 0], twoHanded: true },

  build(k) {
    const haft = sdf.smoothUnion(
      0.012,
      sdf.chain([[0, 0.035, 0, 0.03], [0.01, 0.4, 0, 0.026], [0.0, 0.8, 0, 0.025], [0, 1.12, 0, 0.024]], 0.04),
      sdf.sphere(0.036).at(0, 0.036, 0),
    );
    k.body(
      'haft',
      haft.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 80, y * 6, z * 80, 3)))),
      { color: '#8a5a32', roughness: 0.7, metalness: 0 },
    );
    const wraps = sdf.union(...[0.2, 0.25, 0.3, 0.35, 0.72, 0.77].map((y) => sdf.torus(0.027, 0.008).at(0.005, y, 0)));
    k.body('wraps', wraps, { color: '#5a3522', roughness: 0.75, metalness: 0 });

    const block = sdf.smoothUnion(
      0.01,
      sdf.box([0.1, 0.2, 0.07], 0.016).at(0, HEAD_Y, 0),
      sdf.cone([0, HEAD_Y + 0.09, 0], [0, HEAD_Y + 0.2, 0], 0.03, 0.004),
    );
    k.body('block', block, { color: '#6e747b', roughness: 0.45, metalness: 0.8 });

    // One crescent blade toward +X, mirrored to -X.
    const outline = profile.polygon(
      [[0.04, HEAD_Y + 0.07], [0.14, HEAD_Y + 0.14], [0.24, HEAD_Y + 0.23], [0.27, HEAD_Y + 0.1], [0.275, HEAD_Y - 0.02], [0.25, HEAD_Y - 0.15], [0.2, HEAD_Y - 0.2], [0.13, HEAD_Y - 0.1], [0.04, HEAD_Y - 0.07]],
      { smooth: true },
    );
    const blade = sdf
      .extrude(outline, 0.04, 0.003)
      .intersect(sdf.halfSpace([0.1, 0, 1], 0.03))
      .intersect(sdf.halfSpace([0.1, 0, -1], 0.03))
      .mirror('x', 0.01);
    k.body(
      'blades',
      blade.paintFn((x) => mixRgb(STEEL, EDGE, clamp((Math.abs(x) - 0.23) / 0.02))),
      { color: '#b8bec6', roughness: 0.3, metalness: 0.85 },
    );
  },
});
