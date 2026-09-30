import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - animal hide (catalog `items/crafting/hide`).
 * Role: crafting pickup icon. Size: 0.3 m wide, lies on y = 0, front toward +Z.
 * One idea: a pelt with four leg lobes and a neck lobe, humped over a low mound.
 * Shape language: round. Palette: fur #8a5a35, belly #c8a070, underside pink #d9a090.
 * Materials: fur (rough 0.95, bump). Focal point: the lobes and pale belly.
 */
const FUR = rgb('#8a5a35');
const BELLY = rgb('#c8a070');
const PINK = rgb('#d9a090');

export default defineAsset({
  name: 'hide',
  description: 'Brown animal pelt with leg lobes lying over a low mound.',
  reference: 'docs/item-mockups/hide-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const pts: [number, number][] = [
      [0, 0.15], [0.05, 0.13], [0.06, 0.19], [0.0, 0.215], [-0.06, 0.19], [-0.05, 0.13],
      [-0.12, 0.11], [-0.17, 0.14], [-0.2, 0.09], [-0.15, 0.04], [-0.13, -0.02],
      [-0.18, -0.08], [-0.2, -0.13], [-0.13, -0.15], [-0.09, -0.1], [-0.02, -0.11],
      [0.02, -0.11], [0.09, -0.1], [0.13, -0.15], [0.2, -0.13], [0.18, -0.08],
      [0.13, -0.02], [0.15, 0.04], [0.2, 0.09], [0.17, 0.14], [0.12, 0.11],
    ];
    const flatPelt = sdf.extrude(profile.polygon(pts.map(([a, b]) => [a * 0.76, b * 0.76] as [number, number]), { smooth: true }), 0.034, 0.012).rotateX(-90).at(0, 0.017, 0);
    const mound = sdf
      .sphere(0.08)
      .scale([1.2, 1, 1.3])
      .intersect(sdf.box([0.4, 0.2, 0.4]).at(0, 0.1, 0));
    const shape = flatPelt.smoothUnion(0.03, mound).paintFn((x, y, z) => {
      const n = noise.fbm(x * 30, y * 30, z * 30, 2) * 0.08;
      let c = mixRgb(FUR, rgb('#6e4426'), 0.5 + n * 3);
      const belly = Math.max(0, 1 - ((x / 0.07) ** 2 + ((z - 0.01) / 0.1) ** 2));
      c = mixRgb(c, BELLY, Math.min(1, belly * 1.5) * 0.7 * (y > 0.02 ? 1 : 0.4));
      if (y < 0.008) c = PINK;
      return c;
    });
    k.body('fur', shape, {
      color: FUR,
      roughness: 0.95,
      bump: (x, y, z) => noise.fbm(x * 70, y * 70, z * 70, 3) * 0.003,
      maxTriangles: 3300,
    });
  },
});
