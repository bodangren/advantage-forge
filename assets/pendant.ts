import { defineAsset, profile, rgb, sdf } from '../src/index.js';

/**
 * Pendant (equipment/accessories/pendant), matched to docs/item-mockups/pendant-mock.jpg.
 * Role: equipment pickup icon. Size: 0.42 m tall, 0.28 m wide, 0.08 m thick, upright on y = 0, facing +Z.
 * One idea: a fat silver teardrop frame holding a big glossy blue teardrop gem, with a chunky bail ring. No chain.
 * Shape language: round with one point (the tip). Palette: silver #c8ccd2, blue #38b8f0, highlight #8fe0ff.
 * Materials: silver (rim, bail, neck), gem (blue, glossy).
 */

const PTS: [number, number][] = [
    [0, 0.01],
    [0.085, 0.03],
    [0.14, 0.13],
    [0.1, 0.22],
    [0.03, 0.29],
    [0, 0.32],
    [-0.03, 0.29],
    [-0.1, 0.22],
    [-0.14, 0.13],
    [-0.085, 0.03],
];
const TEARDROP = profile.polygon(PTS, { smooth: true });
const INNER = profile.polygon(PTS.map(([x, y]) => [x * 0.78, 0.16 + (y - 0.16) * 0.8] as [number, number]), { smooth: true });

export default defineAsset({
  name: 'pendant',
  description: 'A fat upright silver teardrop pendant with a big blue gem and a chunky bail ring.',
  detail: 0.005,
  reference: 'docs/item-mockups/pendant-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const rim = sdf.extrude(TEARDROP, 0.08, 0.02).at(0, 0, 0);
    const bail = sdf.torus(0.045, 0.018).rotateZ(90).at(0, 0.37, 0);
    const neck = sdf.capsule([0, 0.30, 0], [0, 0.335, 0], 0.025);
    k.body('silver', sdf.smoothUnion(0.01, rim, bail, neck), { color: '#c8ccd2', roughness: 0.3, metalness: 1 });

    const gem = sdf
      .extrude(INNER, 0.06, 0.02)
      .at(0, 0, 0.03)
      .paintWhere(sdf.sphere(0.04).at(-0.05, 0.19, 0.05), rgb('#8fe0ff'), 0.04);
    k.body('gem', gem, { color: '#38b8f0', roughness: 0.1, metalness: 0 });
  },
});
