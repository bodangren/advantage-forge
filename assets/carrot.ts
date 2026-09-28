import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Carrot (props/food/carrot), matched to docs/item-mockups/carrot-mock.jpg.
 * Size: 0.26 m long with its leaves, lying on y = 0 along X. One idea: a chunky orange carrot with
 * soft ring grooves and a bushy green top. Palette: carrot #f08a2a / groove #c8641a, leaves
 * #5cb85c / #3f9248. Materials: matte vegetable (0.6), leaves (0.7).
 */

const ORANGE = rgb('#f08a2a');
const GROOVE = rgb('#c8641a');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3f9248');
const R = 0.034; // root radius at the top

export default defineAsset({
  name: 'carrot',
  description: 'A chunky orange carrot with soft ring grooves and a bushy green leafy top, lying on its side.',
  detail: 0.0025,
  reference: 'docs/item-mockups/carrot-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const ring = (x: number) => Math.pow(0.5 + 0.5 * Math.cos(x * 150), 6);
    const root = sdf
      .smoothUnion(
        0.02,
        sdf.cone([-0.06, R, 0], [0.13, R * 0.55, 0.004], R, 0.004),
        sdf.ellipsoid([0.025, R, R]).at(-0.058, R, 0),
      )
      .displace(0.0022, (x) => ring(x));
    k.body(
      'root',
      root.paintFn((x, y, z) => mixRgb(mixRgb(ORANGE, GROOVE, 0.6 * ring(x)), GROOVE, 0.12 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)))),
      { color: '#f08a2a', roughness: 0.6, metalness: 0, textureDensity: 2 },
    );

    // Leafy top: a short stalk and a fan of rounded leaf clusters.
    const leaves = [sdf.capsule([-0.08, R, 0], [-0.1, R + 0.004, 0], 0.012)];
    const fan: [number, number, number, number][] = [
      [-0.135, R + 0.025, 0.0, 0.026],
      [-0.125, R + 0.012, 0.03, 0.022],
      [-0.125, R + 0.012, -0.03, 0.022],
      [-0.155, R + 0.004, 0.018, 0.02],
      [-0.155, R + 0.004, -0.02, 0.02],
      [-0.145, R + 0.045, 0.012, 0.018],
    ];
    for (const [x, y, z, r] of fan) {
      leaves.push(sdf.capsule([-0.095, R + 0.004, 0], [x, y, z], 0.005));
      leaves.push(sdf.ellipsoid([r, r * 0.75, r]).at(x, y, z).displace(0.003, (px, py, pz) => noise.noise3(px * 90, py * 90, pz * 90)));
    }
    k.body(
      'leaves',
      sdf.smoothUnion(0.006, ...leaves).paintFn((x, y, z) => mixRgb(LEAF, LEAF_DARK, 0.2 + 0.5 * (0.5 + 0.5 * noise.fbm(x * 50, y * 50, z * 50, 2)))),
      { color: '#5cb85c', roughness: 0.7, metalness: 0 },
    );
  },
});
