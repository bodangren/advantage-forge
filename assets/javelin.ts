import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Javelin (equipment/ranged-weapons/javelin), matched to docs/item-mockups/javelin-mock.jpg.
 * Size: 1.4 m long, lying on y = 0 along X, point toward +X. One idea: a thin ash shaft with a
 * red-orange leather grip in the middle, a leaf-shaped steel point, a binding under the point,
 * and a round butt cap. Palette: ash #d9b07a / grain #a87a48, leather #c8502a, steel #c9ccd0.
 */

const ASH = rgb('#d9b07a');
const GRAIN = rgb('#a87a48');
const Y = 0.02; // shaft axis height

export default defineAsset({
  name: 'javelin',
  description: 'A javelin: a thin ash shaft with a red-orange leather grip, a binding, a leaf-shaped steel point, and a butt cap.',
  detail: 0.003,
  reference: 'docs/item-mockups/javelin-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const shaft = sdf.capsule([-0.66, Y, 0], [0.52, Y, 0], 0.017);
    k.body(
      'shaft',
      shaft.paintFn((x, y, z) => mixRgb(ASH, GRAIN, 0.1 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 6, y * 120, z * 120, 3)))),
      { color: '#d9b07a', roughness: 0.6, metalness: 0 },
    );

    const leather = sdf.union(
      sdf.cylinder(0.021, 0.2, 0.004).rotateZ(90).at(-0.05, Y, 0),
      sdf.cylinder(0.022, 0.035, 0.004).rotateZ(90).at(0.5, Y, 0),
      sdf.sphere(0.024).at(-0.665, Y, 0),
    );
    k.body('leather', leather, { color: '#c8502a', roughness: 0.7, metalness: 0 });

    // Leaf-shaped point, flattened so it lies flat on the ground.
    const point = sdf
      .smoothUnion(
        0.01,
        sdf.cone([0.515, 0, 0], [0.61, 0, 0], 0.017, 0.05),
        sdf.cone([0.61, 0, 0], [0.76, 0, 0], 0.05, 0.001),
      )
      .scale([1, 0.4, 1])
      .at(0, Y, 0);
    k.body('steel', point, { color: '#c9ccd0', roughness: 0.3, metalness: 0.85 });
  },
});
