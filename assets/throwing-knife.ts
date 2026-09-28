import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Throwing knife (equipment/ranged-weapons/throwing-knife), matched to docs/item-mockups/throwing-knife-mock.jpg.
 * Size: 0.26 m long, lying flat on y = 0 along X, point toward +X. One idea: a slim double-edged
 * steel blade, a short leather-wrapped grip, and a ring pommel. Palette: steel #b8bec6 / edge
 * #dde2e8, wrap #b8502a, ring #6e747b.
 */

const STEEL = rgb('#b8bec6');
const EDGE = rgb('#dde2e8');
const Y = 0.012;

export default defineAsset({
  name: 'throwing-knife',
  description: 'A throwing knife lying flat: a slim double-edged steel blade, a short wrapped grip, and a ring pommel.',
  detail: 0.0018,
  reference: 'docs/item-mockups/throwing-knife-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const outline = profile.polygon([[0.0, 0.012], [0.08, 0.016], [0.15, 0.008], [0.175, 0.0], [0.15, -0.008], [0.08, -0.016], [0.0, -0.012]], { smooth: true });
    const blade = sdf
      .extrude(outline, 0.012, 0.001)
      .rotateX(-90)
      .at(0, Y, 0)
      .intersect(sdf.halfSpace([0, 1, 0.3], Y + 0.004))
      .intersect(sdf.halfSpace([0, -1, 0.3], -Y + 0.004))
      .intersect(sdf.halfSpace([0, 1, -0.3], Y + 0.004))
      .intersect(sdf.halfSpace([0, -1, -0.3], -Y + 0.004));
    k.body(
      'blade',
      blade.paintFn((_x, _y, z) => mixRgb(STEEL, EDGE, Math.min(1, Math.max(0, (Math.abs(z) - 0.006) / 0.005)))),
      { color: '#b8bec6', roughness: 0.3, metalness: 0.85 },
    );
    k.body('wrap', sdf.cylinder(0.009, 0.06, 0.003).rotateZ(90).at(-0.03, Y - 0.002, 0), { color: '#b8502a', roughness: 0.75, metalness: 0 });
    k.body('ring', sdf.union(sdf.torus(0.014, 0.0035).at(-0.075, 0.0035, 0), sdf.cylinder(0.008, 0.012, 0.002).rotateZ(90).at(-0.058, Y - 0.003, 0)), {
      color: '#6e747b',
      roughness: 0.45,
      metalness: 0.8,
    });
  },
});
