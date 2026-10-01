import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Maul (equipment/melee-weapons/maul), matched to docs/item-mockups/maul-mock.jpg.
 * Size: 1.0 m tall, standing head down on y = 0. One idea: a big square iron head with dark bands
 * at both faces, on a thick honey-wood haft with a leather grip and a round pommel.
 * Palette: iron #6e747b / #4f545a, bands #3d4148, wood #c08a50 / grain #8a5a32, grip #5a3522.
 */

const IRON = rgb('#6e747b');
const IRON_DARK = rgb('#4f545a');
const WOOD = rgb('#c08a50');
const GRAIN = rgb('#8a5a32');

export default defineAsset({
  name: 'maul',
  description: 'A two-handed maul standing head down: a big square iron head with dark bands, a thick wooden haft, a leather grip.',
  detail: 0.004,
  reference: 'docs/item-mockups/maul-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.8, 0], rotate: [0, 0, 180], twoHanded: true },

  build(k) {
    const head = sdf.box([0.26, 0.15, 0.15], 0.022).at(0, 0.075, 0);
    k.body(
      'head',
      head.paintFn((x, y, z) => mixRgb(IRON, IRON_DARK, 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)))),
      { color: '#6e747b', roughness: 0.45, metalness: 0.8, bump: (x, y, z) => 0.001 * noise.fbm(x * 40, y * 40, z * 40, 2) },
    );
    const bands = sdf.union(
      ...[-0.105, 0.105].map((x) => sdf.box([0.03, 0.162, 0.162], 0.01).at(x, 0.075, 0)),
      sdf.box([0.07, 0.03, 0.07], 0.008).at(0, 0.155, 0),
    );
    k.body('bands', bands, { color: '#3d4148', roughness: 0.5, metalness: 0.75 });

    const haft = sdf.smoothUnion(
      0.01,
      sdf.cone([0, 0.15, 0], [0, 0.97, 0], 0.03, 0.026),
      sdf.sphere(0.036).at(0, 0.975, 0),
    );
    k.body(
      'haft',
      haft.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 70, y * 8, z * 70, 3)))),
      { color: '#c08a50', roughness: 0.7, metalness: 0 },
    );
    const grip = sdf.union(
      ...Array.from({ length: 7 }, (_, i) => sdf.torus(0.029, 0.006).at(0, 0.7 + i * 0.035, 0)),
      sdf.cylinder(0.029, 0.24, 0.004).at(0, 0.8, 0),
    );
    k.body('grip', grip, { color: '#5a3522', roughness: 0.75, metalness: 0 });
  },
});
