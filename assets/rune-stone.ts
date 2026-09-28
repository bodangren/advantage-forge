import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Rune stone (equipment/magic-weapons/rune-stone), matched to docs/item-mockups/rune-stone-mock.jpg.
 * Size: 0.16 m wide, 0.1 m tall, on y = 0. One idea: a smooth grey river stone with a glowing
 * blue rune set into its top. Palette: stone #7d8792 / #5f6a75, glow #4ab0ff on a dark base
 * #0c2a3a (emissive bodies need a dark base color). Materials: stone (0.8), rune (emissive).
 */

const STONE = rgb('#7d8792');
const STONE_DARK = rgb('#5f6a75');

export default defineAsset({
  name: 'rune-stone',
  description: 'A smooth grey river stone with a glowing blue rune set into its top.',
  detail: 0.0025,
  reference: 'docs/item-mockups/rune-stone-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const stone = sdf
      .ellipsoid([0.08, 0.055, 0.068])
      .at(0, 0.045, 0)
      .displace(0.004, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.4, 0.4, 0.4]).at(0, 0.1, 0)));
    // The rune Tiwaz seen from above: a staff with two strokes falling from its top.
    const stroke = (a: [number, number], b: [number, number]) =>
      sdf.capsule([a[0], 0, a[1]], [b[0], 0, b[1]], 0.0048).elongate(0, 0.2, 0);
    const rune = sdf.union(
      stroke([0, -0.034], [0, 0.036]),
      stroke([0, -0.034], [-0.022, -0.008]),
      stroke([0, -0.034], [0.022, -0.008]),
    );
    const groove = stone.intersect(rune).intersect(sdf.halfSpace([0, -1, 0], -0.06));
    k.body(
      'stone',
      stone.smoothSubtract(0.002, groove.round(0.001)).paintFn((x, y, z) =>
        mixRgb(STONE, STONE_DARK, 0.2 + 0.5 * (0.5 + 0.5 * noise.fbm(x * 25, y * 25, z * 25, 2))),
      ),
      { color: '#7d8792', roughness: 0.8, metalness: 0, textureDensity: 2 },
    );
    const glow = stone.round(-0.0015).intersect(rune).intersect(sdf.halfSpace([0, -1, 0], -0.06));
    k.body('rune', glow, { color: '#0c2a3a', roughness: 0.3, metalness: 0, emissive: '#4ab0ff', emissiveIntensity: 1.8, detail: 0.002 });
  },
});
