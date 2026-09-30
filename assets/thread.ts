import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note - thread spool (catalog `items/crafting/thread`).
 * Role: crafting pickup icon. Size: 0.3 m wide, 0.16 m tall, stands on y = 0, front toward +Z.
 * One idea: a wooden spool packed with red thread and a tail trailing on the ground.
 * Shape language: round. Palette: wood #c8955a, thread #d83a3a / #b02828.
 * Materials: wood (0.75), thread (0.9). Focal point: the red winding.
 */
const RED = rgb('#d83a3a');
const DARK = rgb('#b02828');

export default defineAsset({
  name: 'thread',
  description: 'Wooden spool wound with red thread and a loose end on the ground.',
  reference: 'docs/item-mockups/thread-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const wood = sdf
      .cylinder(0.07, 0.022, 0.008).at(0, 0.011, 0)
      .union(sdf.cylinder(0.07, 0.022, 0.008).at(0, 0.149, 0))
      .union(sdf.cylinder(0.045, 0.16, 0.005).at(0, 0.08, 0));
    k.body('spool', wood, { color: rgb('#c8955a'), roughness: 0.75, maxTriangles: 1300 });
    const wound = sdf.cylinder(0.06, 0.116, 0.014).at(0, 0.08, 0);
    const tail = sdf.chain(
      [
        [0.055, 0.08, 0.02, 0.013],
        [0.085, 0.04, 0.03, 0.013],
        [0.12, 0.014, 0.05, 0.013],
        [0.2, 0.014, 0.07, 0.013],
      ],
      0.01,
    );
    const shape = wound.smoothUnion(0.01, tail).paintFn((x, y, z, base) => {
      const t = 0.5 + 0.5 * Math.cos((y * 260 + Math.atan2(x, z) * 2.5));
      return mixRgb(DARK, RED, t);
    });
    k.body('thread', shape, {
      color: RED,
      roughness: 0.9,
      bump: (x: number, y: number) => Math.cos(y * 260) * 0.003,
      maxTriangles: 2000,
    });
  },
});
