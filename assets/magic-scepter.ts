import { defineAsset, profile, rgb, sdf, mixRgb } from '../src/index.js';

/**
 * Magic scepter (equipment/magic-weapons/magic-scepter), matched to docs/item-mockups/magic-scepter-mock.jpg.
 * Size: 0.6 m tall, standing on its end. One idea: a ribbed gold shaft with a knop, a crown-shaped
 * head of five points holding a glowing red gem, and a round pommel. Palette: gold #d4a93a /
 * shadow #a8801e, gem glow #ff3a2a on a dark base #3a0a08 (emissive bodies need a dark base).
 */

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#a8801e');

export default defineAsset({
  name: 'magic-scepter',
  description: 'A gold scepter with a ribbed shaft, a knop, a crown-shaped head holding a glowing red gem, and a round pommel.',
  detail: 0.0025,
  reference: 'docs/item-mockups/magic-scepter-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const ribs = (y: number) => Math.pow(0.5 + 0.5 * Math.cos(y * 260), 6);
    const shaft = sdf
      .cone([0, 0.03, 0], [0, 0.46, 0], 0.015, 0.013)
      .displace(0.0018, (_x, y) => -ribs(y) * (y > 0.12 && y < 0.36 ? 1 : 0));
    const pommel = sdf.smoothUnion(0.006, sdf.sphere(0.026).at(0, 0.026, 0), sdf.cylinder(0.018, 0.02, 0.004).at(0, 0.055, 0));
    const knop = sdf.ellipsoid([0.026, 0.018, 0.026]).at(0, 0.4, 0);
    const cup = sdf.revolve(
      profile.polygon([[0, 0.45], [0.02, 0.455], [0.042, 0.48], [0.05, 0.5], [0.035, 0.5], [0, 0.49]], { smooth: true }),
    );
    const points = Array.from({ length: 5 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 5;
      const x = Math.cos(a) * 0.043;
      const z = Math.sin(a) * 0.043;
      return sdf.smoothUnion(
        0.004,
        sdf.cone([x, 0.49, z], [x * 1.2, 0.55, z * 1.2], 0.011, 0.003),
        sdf.sphere(0.006).at(x * 1.2, 0.552, z * 1.2),
      );
    });
    const gold = sdf.smoothUnion(0.008, pommel, shaft, knop, cup).smoothUnion(0.004, ...points);
    k.body(
      'gold',
      gold.paintFn((_x, y) => mixRgb(GOLD, GOLD_DARK, 0.5 * ribs(y) * (y > 0.12 && y < 0.36 ? 1 : 0))),
      { color: '#d4a93a', roughness: 0.3, metalness: 1 },
    );
    k.body('gem', sdf.sphere(0.032).at(0, 0.53, 0), { color: '#3a0a08', roughness: 0.15, metalness: 0, emissive: '#ff3a2a', emissiveIntensity: 1.6 });
  },
});
