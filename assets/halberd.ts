import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Halberd (equipment/melee-weapons/halberd), matched to docs/item-mockups/halberd-mock.jpg.
 * Size: 1.85 m tall, standing on its butt. One idea: a long wooden pole with leather wraps under a
 * steel head: an axe blade toward +X, a back hook toward -X, and a leaf spear point on top.
 * Palette: pole #9a6a3a / grain #6e4424, wraps #b8502a, steel #b8bec6 / edge #dde2e8, socket #5a5f67.
 */

const WOOD = rgb('#9a6a3a');
const GRAIN = rgb('#6e4424');
const STEEL = rgb('#b8bec6');
const EDGE = rgb('#dde2e8');
const HEAD_Y = 1.55;
const big = (s: ReturnType<typeof sdf.sphere>) => s.at(0, -HEAD_Y, 0).scale(1.5).at(0, HEAD_Y, 0);

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const thin = (s: ReturnType<typeof sdf.sphere>, half: number, slope: number) =>
  s.intersect(sdf.halfSpace([slope, 0, 1], half)).intersect(sdf.halfSpace([slope, 0, -1], half));

export default defineAsset({
  name: 'halberd',
  description: 'A halberd: a long wooden pole with leather wraps and a steel head with an axe blade, a back hook, and a spear point.',
  detail: 0.004,
  reference: 'docs/item-mockups/halberd-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const pole = sdf.cylinder(0.024, 1.5, 0.006).at(0, 0.8, 0);
    k.body(
      'pole',
      pole.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 80, y * 6, z * 80, 3)))),
      { color: '#9a6a3a', roughness: 0.7, metalness: 0 },
    );
    const wraps = sdf.union(
      ...[0.55, 0.6, 0.65, 0.95, 1.0, 1.05].map((y) => sdf.torus(0.023, 0.007).at(0, y, 0)),
      sdf.cylinder(0.024, 0.12, 0.004).at(0, 0.6, 0),
      sdf.cylinder(0.024, 0.12, 0.004).at(0, 1.0, 0),
    );
    k.body('wraps', wraps, { color: '#b8502a', roughness: 0.75, metalness: 0 });

    const iron = sdf.union(
      big(sdf.cylinder(0.03, 0.16, 0.008).at(0, HEAD_Y - 0.03, 0)),
      sdf.cone([0, 0.0, 0], [0, 0.06, 0], 0.012, 0.026),
      big(sdf.box([0.012, 0.3, 0.04], 0.004).at(0, HEAD_Y - 0.2, 0)),
    );
    k.body('iron', iron, { color: '#5a5f67', roughness: 0.5, metalness: 0.75 });

    const axeOutline = profile.polygon(
      [[0.02, HEAD_Y + 0.05], [0.12, HEAD_Y + 0.1], [0.2, HEAD_Y + 0.16], [0.23, HEAD_Y + 0.08], [0.235, HEAD_Y - 0.02], [0.21, HEAD_Y - 0.12], [0.15, HEAD_Y - 0.1], [0.02, HEAD_Y - 0.05]],
      { smooth: true },
    );
    const axe = thin(sdf.extrude(axeOutline, 0.03, 0.002), 0.012, 0.05);
    const hook = sdf.chain(
      [[-0.02, HEAD_Y, 0, 0.018], [-0.08, HEAD_Y + 0.01, 0, 0.013], [-0.13, HEAD_Y + 0.04, 0, 0.008], [-0.15, HEAD_Y + 0.08, 0, 0.003]],
      0.01,
    ).scale([1, 1, 0.6]);
    const spear = sdf
      .smoothUnion(0.01, sdf.cone([0, HEAD_Y + 0.05, 0], [0, HEAD_Y + 0.14, 0], 0.02, 0.045), sdf.cone([0, HEAD_Y + 0.14, 0], [0, HEAD_Y + 0.32, 0], 0.045, 0.001))
      .scale([1, 1, 0.4]);
    k.body(
      'steel',
      big(sdf.smoothUnion(0.008, axe, hook, spear)).paintFn((x, y) => {
        const edge = Math.max(clamp((x - 0.285) / 0.03), clamp((y - (HEAD_Y + 0.33)) / 0.06));
        return mixRgb(STEEL, EDGE, edge);
      }),
      { color: '#b8bec6', roughness: 0.3, metalness: 0.85 },
    );
  },
});
