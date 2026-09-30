import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - folded leather (catalog `items/crafting/leather`).
 * Role: crafting pickup icon. Size: 0.3 m wide, on y = 0, front toward +Z.
 * One idea: two chunky stacked slabs with a corner folded back, brass tag on top.
 * Shape language: round. Palette: tan #b07a48, underside #7a4e2a, brass #c9a13a.
 * Materials: leather (rough 0.75), brass (metal). Focal point: the folded corner and the tag.
 */
const TAN = rgb('#b07a48');
const DARK = rgb('#7a4e2a');
const STITCH = rgb('#e2c48c');

export default defineAsset({
  name: 'leather',
  description: 'Folded tan leather square with a brass tag.',
  reference: 'docs/item-mockups/leather-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const T = 0.04;
    const bottom = sdf.box([0.27, T, 0.21], 0.014).at(0, T / 2, 0);
    const topFull = sdf.box([0.26, T, 0.2], 0.014).at(0.005, T * 1.5 - 0.004, -0.005);
    const s = 1 / Math.SQRT2;
    // Cut the +X +Z corner off the top slab and fold it back as a tilted flap.
    const top = topFull.intersect(sdf.halfSpace([s, 0, s], 0.09).intersect(sdf.box([0.4, 0.2, 0.4]).at(0, 0.06, 0)));
    const flap = sdf.box([0.13, 0.03, 0.09], 0.012).rotateY(-45).rotateZ(-8).at(0.085, T * 2 + 0.008, 0.06);
    const body = bottom.smoothUnion(0.012, top).smoothUnion(0.012, flap).paintFn((x, y, z) => {
      let c = TAN;
      if (noise.fbm(x * 30, y * 30, z * 30, 2) > 0.25) c = mixRgb(TAN, DARK, 0.2);
      if (y < 0.012) c = DARK;
      if (Math.abs(z - 0.085) < 0.006 && y > T && Math.abs(x) < 0.11 && Math.sin(x * 160) > 0.2) c = STITCH;
      if (Math.abs(x + 0.115) < 0.006 && y > T && Math.abs(z) < 0.08 && Math.sin(z * 160) > 0.2) c = STITCH;
      return c;
    });
    k.body('leather', body, {
      color: TAN,
      roughness: 0.75,
      bump: (x, y, z) => noise.fbm(x * 45, y * 45, z * 45, 3) * 0.003,
      maxTriangles: 3000,
    });
    const tag = sdf.cylinder(0.026, 0.02, 0.006).at(-0.04, T * 2 + 0.012, 0.0);
    k.body('brass', tag, { color: rgb('#c9a13a'), roughness: 0.4, metalness: 0.85, maxTriangles: 400 });
  },
});
