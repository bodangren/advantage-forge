import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - bandage roll (catalog `items/consumables/bandage`).
 * Role: consumable pickup icon. Size: 0.2 m wide, lies on y = 0, front toward +Z.
 * One idea: a fat white roll with a loose tail and a red cross.
 * Shape language: round. Palette: cloth #f4f0e6, edge #d8d0c0, cross #cc3a2a.
 * Materials: cloth (rough 0.9). Focal point: the red cross.
 */
const CLOTH = rgb('#f4f0e6');
const EDGE = rgb('#d8d0c0');
const RED = rgb('#cc3a2a');

export default defineAsset({
  name: 'bandage',
  description: 'White bandage roll with a loose tail and a red cross.',
  reference: 'docs/item-mockups/bandage-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const roll = sdf.cylinder(0.06, 0.13, 0.014).rotateZ(90).at(-0.03, 0.06, -0.02);
    const tail = sdf.box([0.12, 0.014, 0.15], 0.006).at(0.03, 0.009, 0.1);
    const shape = roll.smoothUnion(0.01, tail).paintFn((x, y, z) => {
      let c = CLOTH;
      const ang = Math.atan2(y - 0.06, z + 0.02);
      const spiral = Math.pow(0.5 + 0.5 * Math.cos((ang * 2 + x * 55) * 2), 10);
      const ring = Math.pow(0.5 + 0.5 * Math.cos((x + 0.03) * 110), 12);
      if (Math.hypot(y - 0.06, z + 0.02) > 0.045) c = mixRgb(c, EDGE, Math.max(spiral, ring * 0.5) * 0.8);
      const cx = x - 0.03;
      const cz = z - 0.12;
      const arm = 0.028;
      const th = 0.011;
      if (y < 0.02 && ((Math.abs(cx) < th && Math.abs(cz) < arm) || (Math.abs(cz) < th && Math.abs(cx) < arm))) c = RED;
      return c;
    });
    k.body('cloth', shape, {
      color: CLOTH,
      roughness: 0.9,
      bump: (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 3) * 0.003,
      maxTriangles: 3300,
    });
  },
});
