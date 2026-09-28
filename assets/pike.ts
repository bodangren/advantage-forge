import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Pike (equipment/melee-weapons/pike), matched to docs/item-mockups/pike-mock.jpg.
 * Size: 2.45 m tall, standing on its butt. One idea: a long thin ash pole with an iron socket, a
 * small diamond steel point, and a red tassel under the point. Palette: ash #d9b07a / grain
 * #a87a48, iron #5a5f67, steel #c9ccd0, tassel #c0302a.
 */

const ASH = rgb('#d9b07a');
const GRAIN = rgb('#a87a48');

export default defineAsset({
  name: 'pike',
  description: 'A long pike: a thin ash pole with an iron socket, a small diamond steel point, and a red tassel.',
  detail: 0.004,
  reference: 'docs/item-mockups/pike-mock.jpg',
  texture: { size: 512 },

  build(k) {
    k.body(
      'pole',
      sdf.cylinder(0.02, 2.2, 0.005).at(0, 1.12, 0).paintFn((x, y, z) => mixRgb(ASH, GRAIN, 0.1 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 90, y * 5, z * 90, 3)))),
      { color: '#d9b07a', roughness: 0.65, metalness: 0 },
    );
    k.body('iron', sdf.union(sdf.cylinder(0.026, 0.1, 0.006).at(0, 2.25, 0), sdf.cone([0, 0.0, 0], [0, 0.05, 0], 0.012, 0.023)), {
      color: '#5a5f67',
      roughness: 0.5,
      metalness: 0.75,
    });
    const point = sdf
      .smoothUnion(0.006, sdf.cone([0, 2.29, 0], [0, 2.34, 0], 0.018, 0.04), sdf.cone([0, 2.34, 0], [0, 2.46, 0], 0.04, 0.001))
      .scale([1, 1, 0.45])
      .at(0, 0, 0);
    k.body('steel', point, { color: '#c9ccd0', roughness: 0.3, metalness: 0.85 });
    const tassel = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      tassel.push(sdf.capsule([Math.cos(a) * 0.022, 2.2, Math.sin(a) * 0.022], [Math.cos(a) * 0.045, 2.07, Math.sin(a) * 0.045], 0.007));
    }
    tassel.push(sdf.torus(0.026, 0.008).at(0, 2.2, 0));
    k.body('tassel', sdf.union(...tassel), { color: '#c0302a', roughness: 0.8, metalness: 0 });
  },
});
