import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Javelin (equipment/ranged-weapons/javelin), matched to docs/item-mockups/javelin-mock.jpg.
 * Role: held or dropped item icon. Size: 1.3 m tall, standing upright on y = 0, facing +Z.
 * One idea: a chunky pale shaft topped by a big faceted golden leaf point.
 * Shape language: round shaft, angular point. Palette: ash #e0c48a, orange #e0602a,
 * gold #d8b040 with darker #a88020 lower half.
 * Materials: shaft (ash, grain bump), orange fittings (collar, ring, butt), gold point (flat facets).
 */

const ASH = rgb('#e0c48a');
const GRAIN = rgb('#c8a668');
const GOLD = rgb('#d8b040');
const DARKGOLD = rgb('#a88020');

export default defineAsset({
  name: 'javelin',
  description: 'A javelin standing upright: a chunky ash shaft, an orange collar and butt, and a faceted golden leaf point.',
  detail: 0.004,
  reference: 'docs/item-mockups/javelin-mock.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.55, 0] },

  build(k) {
    const shaft = sdf.capsule([0, 0.1, 0], [0, 1.0, 0], 0.03);
    k.body(
      'shaft',
      shaft.paintFn((x, y, z) => mixRgb(ASH, GRAIN, 0.5 + 0.5 * noise.fbm(x * 30, y * 4, z * 30, 3))),
      { color: '#e0c48a', roughness: 0.7, metalness: 0, bump: (x, y, z) => 0.001 * noise.fbm(x * 40, y * 6, z * 40, 2) },
    );

    const orange = sdf.union(
      sdf.ellipsoid([0.05, 0.06, 0.05]).at(0, 0.05, 0),
      sdf.torus(0.04, 0.015).at(0, 0.13, 0),
      sdf.torus(0.045, 0.02).at(0, 1.0, 0),
    );
    k.body('fittings', orange, { color: '#e0602a', roughness: 0.6, metalness: 0, detail: 0.006 });

    let leaf = sdf.ellipsoid([0.07, 0.18, 0.04]);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6 + 0.3;
      const c = 0.95;
      const n: [number, number, number] = [Math.cos(a) * c, 0.3, Math.sin(a) * c];
      const len = Math.hypot(...n);
      leaf = sdf.intersect(leaf, sdf.halfSpace([n[0] / len, n[1] / len, n[2] / len], 0.055 / len * 1.0));
    }
    const point = leaf.at(0, 1.14, 0);
    k.body(
      'point',
      point.paintWhere(sdf.box([0.5, 0.3, 0.5]).at(0, 0.99, 0), DARKGOLD, 0.02),
      { color: '#d8b040', roughness: 0.35, metalness: 0.9, flat: true },
    );
  },
});
