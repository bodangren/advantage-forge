import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - bolt of cloth (catalog `items/crafting/cloth`).
 * Role: crafting pickup icon. Size: 0.3 m wide, lies on y = 0, front toward +Z.
 * One idea: a fat roll with a wavy flap unrolled toward the viewer.
 * Shape language: round. Palette: teal #3a8aa0, edge band #6ab8c8.
 * Materials: one cloth body (roughness 0.88), fold relief in bump. Focal point: the flap edge.
 */
const TEAL = rgb('#3a8aa0');
const EDGE = rgb('#6ab8c8');

export default defineAsset({
  name: 'cloth',
  description: 'Rolled teal cloth bolt with an unrolled wavy flap.',
  reference: 'docs/item-mockups/cloth-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const bolt = sdf.cylinder(0.07, 0.3, 0.012).rotateZ(90).at(0, 0.07, 0);
    const flap = sdf
      .box([0.3, 0.02, 0.17], 0.008)
      .at(0, 0.01, 0.135)
      .displace(0.007, (x, y, z) => Math.sin(x * 50) * Math.max(0, (z - 0.12) / 0.1));
    const shape = bolt.smoothUnion(0.02, flap).paintFn((x, y, z, base) => {
      const weave = noise.fbm(x * 90, y * 90, z * 90, 2) * 0.06;
      let c = mixRgb(TEAL, rgb('#2c7488'), 0.5 + 0.5 * Math.sin(x * 200) * Math.sin(z * 200) * 0.5 + weave);
      const band = Math.max(z > 0.17 ? 1 : 0, Math.abs(x) > 0.125 ? 1 : 0);
      const spiral = Math.pow(0.5 + 0.5 * Math.cos((Math.atan2(y - 0.07, z) * 3 + x * 30) * 3), 8) * 0.25;
      c = mixRgb(c, EDGE, Math.min(1, band * 0.85 + spiral));
      return c;
    });
    k.body('cloth', shape, {
      color: TEAL,
      roughness: 0.88,
      bump: (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 3) * 0.003,
      maxTriangles: 3300,
    });
  },
});
