import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Sickle (equipment/melee-weapons/sickle), matched to docs/item-mockups/sickle-mock.jpg.
 * Role: item icon. Size: 0.9 m tall, standing upright on its handle, facing +Z; the hook
 * curls in the XY plane. One idea: a thick steel hook curled like a question mark over a
 * chunky honey-wood handle. Palette: wood #d8a060, dots #5a3a20, steel #b8c0c8, edge #dde1e6.
 * Materials: handle (wood), collar and blade (steel).
 */

const WOOD = rgb('#d8a060');
const GRAIN = rgb('#c08a4c');
const STEEL = rgb('#b8c0c8');
const EDGE = rgb('#dde1e6');
const DOT = rgb('#5a3a20');

export default defineAsset({
  name: 'sickle',
  description: 'A sickle standing upright: a chunky honey-wood handle, a fat steel collar, and a thick curled steel hook with a barb.',
  detail: 0.005,
  reference: 'docs/item-mockups/sickle-mock.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.25, 0] },

  build(k) {
    const handle = sdf
      .chain(
        [
          [0.02, 0.04, 0, 0.04],
          [0.015, 0.2, 0, 0.038],
          [0.005, 0.35, 0, 0.036],
          [0, 0.5, 0, 0.035],
        ],
        0.03,
      )
      .smoothUnion(0.02, sdf.sphere(0.045).at(0.02, 0.045, 0));
    const dots = sdf.union(sdf.sphere(0.012).at(0.012, 0.3, 0.035), sdf.sphere(0.012).at(0.008, 0.4, 0.034));
    k.body(
      'handle',
      handle.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.5 + 0.5 * noise.fbm(x * 30, y * 5, z * 30, 3))).paintWhere(dots.round(0.004), DOT, 0.005),
      { color: '#d8a060', roughness: 0.7, metalness: 0, bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 6, z * 40, 2) },
    );

    const collar = sdf.union(
      sdf.torus(0.05, 0.025).at(0, 0.52, 0),
      sdf.cone([0, 0.5, 0], [0, 0.58, 0], 0.06, 0.045),
    );
    // Hook: a wide torus arc in the XY plane, cut to run from -60 deg over the top to 200 deg.
    const C: [number, number] = [-0.06, 0.78];
    const wedge = (a1: number, a2: number) => {
      const r1 = (a1 * Math.PI) / 180;
      const r2 = (a2 * Math.PI) / 180;
      return sdf
        .intersect(
          sdf.halfSpace([Math.sin(r1), -Math.cos(r1), 0], 0),
          sdf.halfSpace([-Math.sin(r2), Math.cos(r2), 0], 0),
        )
        .intersect(sdf.box([1, 1, 1]))
        .at(C[0], C[1], 0);
    };
    const ring = sdf
      .union(sdf.torus(0.13, 0.035), sdf.torus(0.16, 0.025).scale([1, 0.3, 1]))
      .rotateX(90)
      .at(C[0], C[1], 0);
    const arc = sdf.subtract(ring, wedge(200, 300));
    const neck = sdf.capsule([0.01, 0.56, 0], [0.01, 0.7, 0], 0.035);
    const barb = sdf.cone([-0.06, 0.88, 0], [-0.06, 0.94, 0], 0.02, 0.002);
    const hook = sdf.smoothUnion(0.03, arc, neck).smoothUnion(0.01, barb);
    const blade = hook.paintFn((x, y, z) => {
      const inner = Math.hypot(x - C[0], y - C[1]) < 0.125 ? 1 : 0;
      return mixRgb(STEEL, EDGE, inner * 0.8 + 0.1 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)));
    });
    k.body('steel', sdf.union(collar.paint(STEEL), blade), { color: '#b8c0c8', roughness: 0.35, metalness: 0.85 });
  },
});
