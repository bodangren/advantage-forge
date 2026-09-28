import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Lockpick set (equipment/tools/lockpick), matched to docs/item-mockups/lockpick-mock.jpg.
 * Size: 0.2 m x 0.14 m, lying flat on y = 0. One idea: a rolled-open leather wrap with four thin
 * steel picks in stitched pockets and an L-shaped tension wrench. Palette: leather #8a5a35 /
 * #6b4226, stitches #d9b07a, steel #c9ccd0.
 */

export default defineAsset({
  name: 'lockpick',
  description: 'A lockpick set: a rolled-open leather wrap with four thin steel picks in pockets and a tension wrench.',
  detail: 0.0015,
  reference: 'docs/item-mockups/lockpick-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const wrap = sdf.union(
      sdf.box([0.16, 0.004, 0.13], 0.002).at(0.01, 0.002, 0),
      sdf.cylinder(0.014, 0.13, 0.004).rotateX(90).at(-0.08, 0.014, 0),
      sdf.box([0.07, 0.008, 0.13], 0.003).at(0.05, 0.006, 0),
    );
    k.body(
      'leather',
      wrap.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 70, y * 70, z * 70, 2);
        const stitch = y > 0.008 && (Math.abs(x - 0.017) < 0.0015 || Math.abs(x - 0.083) < 0.0015) && Math.sin(z * 300) > 0;
        return stitch ? rgb('#d9b07a') : mixRgb(rgb('#8a5a35'), rgb('#6b4226'), 0.2 + 0.4 * n);
      }),
      { color: '#8a5a35', roughness: 0.7, metalness: 0 },
    );
    const picks = [];
    const zs = [-0.045, -0.015, 0.015, 0.045];
    zs.forEach((z, i) => {
      picks.push(sdf.capsule([-0.06, 0.012, z], [0.07, 0.012, z], 0.0022));
      picks.push(sdf.capsule([0.07, 0.012, z], [0.085, 0.012 + (i % 2 ? 0.006 : 0.0), z + (i % 2 ? 0 : 0.006)], 0.002));
      picks.push(sdf.ellipsoid([0.012, 0.004, 0.006]).at(-0.06, 0.012, z));
    });
    picks.push(sdf.capsule([-0.03, 0.006, 0.08], [0.06, 0.006, 0.08], 0.0025), sdf.capsule([0.06, 0.006, 0.08], [0.06, 0.006, 0.1], 0.0025));
    k.body('picks', sdf.union(...picks), { color: '#c9ccd0', roughness: 0.3, metalness: 0.85 });
  },
});
