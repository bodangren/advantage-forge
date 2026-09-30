import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

// Design note (items/quest-and-treasure/relic-orb):
// Role: quest pickup icon, 0.26 m tall, on y = 0, faces +Z.
// One idea: a big glowing violet orb held by three chunky gold claws.
// Shape language: round orb, curved claws. Palette: violet #b070f0, gold #d4a93a, dark gold #8a6a20.
// Materials: orb (emissive glass-like, opacity 0.85), gold stand (metal).
const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8a6a20');
const CY = 0.16;

export default defineAsset({
  name: 'relic-orb',
  description: 'A glowing violet orb resting in a gold three-claw stand.',
  detail: 0.004,
  reference: 'docs/item-mockups/relic-orb-mock.jpg',
  texture: { size: 512 },

  build(k) {
    k.body('orb', sdf.sphere(0.09).at(0, CY, 0), {
      color: '#b070f0',
      roughness: 0.1,
      metalness: 0,
      emissive: '#b070f0',
      emissiveIntensity: 0.45,
      opacity: 0.85,
      detail: 0.005,
      maxTriangles: 1200,
    });
    const base = sdf.cylinder(0.08, 0.02, 0.008).at(0, 0.01, 0);
    const claws = [0, 120, 240].map((a) =>
      sdf
        .chain(
          [
            [0.08, 0.015, 0, 0.02],
            [0.088, 0.04, 0, 0.018],
            [0.074, 0.072, 0, 0.016],
            [0.062, 0.092, 0, 0.014],
          ],
          0.02,
        )
        .rotateY(a + 30),
    );
    const stand = sdf.smoothUnion(0.008, base, ...claws).paintFn((x, y, z) =>
      mixRgb(GOLD, GOLD_DARK, Math.max(0, 0.3 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)) * 0.6),
    );
    k.body('stand', stand, { color: '#d4a93a', roughness: 0.35, metalness: 1, detail: 0.004, maxTriangles: 1800 });
  },
});
