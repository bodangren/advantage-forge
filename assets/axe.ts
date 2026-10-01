import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Woodcutter's axe (equipment/tools/axe), matched to docs/item-mockups/axe-mock.jpg.
 * Size: 0.82 m tall, standing on its hooked butt with the head up, blade toward +X.
 * One idea: a curved honey-wood haft with a hooked foot under a pitted grey iron head whose
 * bit flares into a bright steel edge band. Palette: haft #d99a45 / knots #b0642c, iron #6e6c6a /
 * pits #4e4c4a, steel edge #c9ccd0. Materials: wood (0.7), iron (0.5, metal 0.6), steel (0.35).
 */

const WOOD = rgb('#d99a45');
const KNOT = rgb('#b0642c');
const IRON = rgb('#6e6c6a');
const PIT = rgb('#4e4c4a');
const STEEL = rgb('#c9ccd0');

const HEAD_Y = 0.7;
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'axe',
  description: "A woodcutter's axe: a curved honey-wood haft with a hooked foot and a pitted grey iron head with a bright steel edge.",
  detail: 0.004,
  reference: 'docs/item-mockups/axe-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.2, 0] },

  build(k) {
    const haft = sdf.chain(
      [
        [-0.035, 0.028, 0, 0.028],
        [-0.01, 0.07, 0, 0.026],
        [0.012, 0.2, 0, 0.022],
        [0.01, 0.42, 0, 0.021],
        [0.0, 0.64, 0, 0.022],
        [0.0, 0.8, 0, 0.022],
      ],
      0.02,
    );
    k.body(
      'haft',
      haft
        .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.4, 2, 0.4]).at(0, 0.5, 0)))
        .paintFn((x, y, z) => {
          const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 6, z * 40, 3);
          const knot = noise.noise3(x * 9, y * 9, z * 9);
          return mixRgb(mixRgb(WOOD, KNOT, 0.15 * grain), KNOT, clamp((knot - 0.45) * 6));
        }),
      { color: '#d99a45', roughness: 0.7, metalness: 0, paintWeight: 2 },
    );

    // Head: a thick eye around the haft, a short poll, and a blade that flares to a tall bit.
    const eye = sdf.box([0.1, 0.13, 0.062], 0.014).at(0, HEAD_Y, 0);
    const poll = sdf.box([0.035, 0.1, 0.055], 0.012).at(-0.06, HEAD_Y, 0);
    const outline = profile.polygon(
      [
        [0.03, HEAD_Y + 0.05],
        [0.1, HEAD_Y + 0.052],
        [0.18, HEAD_Y + 0.085],
        [0.205, HEAD_Y + 0.08],
        [0.215, HEAD_Y + 0.02],
        [0.212, HEAD_Y - 0.05],
        [0.2, HEAD_Y - 0.12],
        [0.175, HEAD_Y - 0.125],
        [0.1, HEAD_Y - 0.06],
        [0.03, HEAD_Y - 0.055],
      ],
      { smooth: true },
    );
    const blade = sdf
      .extrude(outline, 0.06, 0.004)
      .intersect(sdf.halfSpace([0.12, 0, 1], 0.026))
      .intersect(sdf.halfSpace([0.12, 0, -1], 0.026));
    const head = sdf.smoothUnion(0.01, eye, poll).smoothUnion(0.012, blade);
    k.body(
      'head',
      head.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        let c = mixRgb(IRON, PIT, 0.25 * n);
        c = mixRgb(c, PIT, clamp((noise.noise3(x * 45, y * 45, z * 45) - 0.5) * 8));
        return mixRgb(c, STEEL, clamp((x - 0.17) / 0.008));
      }),
      {
        color: '#6e6c6a',
        roughness: 0.5,
        metalness: 0.6,
        paintWeight: 2,
        bump: (x, y, z) => -0.0015 * clamp((noise.noise3(x * 45, y * 45, z * 45) - 0.5) * 8),
      },
    );
  },
});
