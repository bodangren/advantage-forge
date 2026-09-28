import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Hunting horn (equipment/tools/horn), matched to docs/item-mockups/horn-mock.jpg.
 * Size: 0.42 m long, resting on its curved belly on y = 0. One idea: a cream ox horn curving up
 * at both ends, a brass flared bell at the wide end, a brass mouthpiece at the narrow end, two
 * brass bands, and a leather carrying strap. Palette: horn #ecd9b0 / tip #b89a6a, brass #d4a93a,
 * leather #6b4226. Materials: polished horn (0.4), brass (0.3, metal 0.9), leather (0.7).
 */

const HORN = rgb('#ecd9b0');
const HORN_TIP = rgb('#b89a6a');

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const ground = (s: ReturnType<typeof sdf.sphere>) =>
  s.intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)));

export default defineAsset({
  name: 'horn',
  description: 'A curved cream hunting horn with a brass bell, a brass mouthpiece, two brass bands, and a leather strap.',
  detail: 0.003,
  reference: 'docs/item-mockups/horn-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const body = sdf.chain(
      [
        [0.16, 0.08, 0, 0.05],
        [0.08, 0.052, 0, 0.048],
        [0.0, 0.042, 0, 0.038],
        [-0.08, 0.048, 0, 0.027],
        [-0.14, 0.075, 0, 0.018],
        [-0.17, 0.115, 0, 0.012],
      ],
      0.02,
    );
    const bellHollow = sdf.cone([0.13, 0.078, 0], [0.215, 0.09, 0], 0.024, 0.05);
    k.body(
      'horn',
      ground(body.subtract(bellHollow)).paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(HORN, HORN_TIP, clamp((-x - 0.02) / 0.15) * 0.8 + 0.1 * n);
      }),
      { color: '#ecd9b0', roughness: 0.4, metalness: 0, textureDensity: 2 },
    );

    const bell = sdf
      .smoothUnion(
        0.006,
        sdf.cone([0.165, 0.08, 0], [0.2, 0.085, 0], 0.05, 0.058),
        sdf.torus(0.056, 0.007).rotateZ(90 - 8).at(0.2, 0.085, 0),
      )
      .subtract(bellHollow);
    const mouth = sdf
      .cone([-0.168, 0.11, 0], [-0.185, 0.15, 0], 0.012, 0.018)
      .subtract(sdf.sphere(0.011).at(-0.186, 0.153, 0));
    const bands = sdf.union(
      ...[0.1, -0.1].map((x) => body.round(0.005).intersect(sdf.box([0.018, 0.4, 0.4]).at(x, 0.1, 0).rotateZ(x > 0 ? 15 : -25))),
    );
    k.body('brass', ground(sdf.union(bell, mouth, bands)), { color: '#d4a93a', roughness: 0.3, metalness: 0.9 });

    const strap = sdf.chain(
      [
        [0.1, 0.1, 0, 0.0055],
        [0.07, 0.15, 0, 0.0055],
        [0.02, 0.175, 0, 0.0055],
        [-0.04, 0.17, 0, 0.0055],
        [-0.08, 0.135, 0, 0.0055],
        [-0.1, 0.085, 0, 0.0055],
      ],
      0.006,
    );
    k.body('strap', strap, { color: '#6b4226', roughness: 0.7, metalness: 0 });
  },
});
