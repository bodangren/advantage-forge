import { defineAsset, noise, rgb, sdf } from '../src/index.js';

/**
 * Rune stone (equipment/magic-weapons/rune-stone), matched to docs/item-mockups/rune-stone-mock.jpg.
 * Role: pickup icon. Size: 0.5 m tall, 0.42 m wide, on y = 0, facing +Z.
 * One idea: a chunky faceted grey stone with a big glowing cyan gem in a hollow on its face.
 * Shape language: square facets, one round accent. Palette: stone #7d8a99, hollow #55606c,
 * rim tint #8fb8cc, gem #40e0ff. Materials: stone (rough, flat facets), gem (emissive).
 */

const STONE = rgb('#7d8a99');
const HOLLOW = rgb('#55606c');
const RIM = rgb('#8fb8cc');

export default defineAsset({
  name: 'rune-stone',
  description: 'A chunky faceted grey stone standing upright, with a big glowing cyan gem set in a hollow on its front.',
  detail: 0.006,
  reference: 'docs/item-mockups/rune-stone-mock.jpg',
  texture: { size: 512 },

  build(k) {
    let body = sdf.ellipsoid([0.21, 0.26, 0.19]);
    for (let i = 0; i < 12; i++) {
      const a = noise.random(i, 1, 7) * Math.PI * 2;
      const e = (noise.random(i, 2, 7) - 0.35) * 1.6;
      const n: [number, number, number] = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)];
      // Keep the front (+Z) facets away from the gem hollow.
      const off = 0.15 + noise.random(i, 3, 7) * 0.05;
      body = sdf.intersect(body, sdf.halfSpace(n, off));
    }
    // Rounded base: flat cut low, so it stands.
    body = body.round(0.015).at(0, 0.25, 0);
    const hollow = sdf.sphere(0.12).at(0, 0.27, 0.16);
    const stone = sdf.subtract(body, hollow).paintWhere(sdf.sphere(0.15).at(0, 0.27, 0.16), RIM, 0.05);
    const painted = stone.paintWhere(hollow.round(0.005), HOLLOW, 0.01);
    k.body('stone', painted.paintFn((x, y, z, base) => base), {
      color: '#7d8a99',
      roughness: 0.85,
      metalness: 0,
      flat: true,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 20, y * 20, z * 20, 2),
    });
    k.body('gem', sdf.sphere(0.095).at(0, 0.27, 0.13), {
      color: '#40e0ff',
      roughness: 0.1,
      metalness: 0,
      emissive: '#40e0ff',
      emissiveIntensity: 0.6,
    });
    void STONE;
  },
});
