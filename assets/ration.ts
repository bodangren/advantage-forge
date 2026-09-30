import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

// Design note (items/consumables/ration):
// Role: consumable pickup icon, 0.2 m wide (X), 0.1 tall, on y = 0, faces +Z.
// One idea: a tan cloth bundle tied with twine, bread and cheese peeking out of the +X end.
// Shape language: round, soft. Palette: cloth #c8b088, bread #8a5a35, cheese #f0c040, twine #a88a5a.
// Materials: cloth, bread, cheese, twine.
const CLOTH = rgb('#c8b088');
const CLOTH_DARK = rgb('#a08a62');
const Y0 = 0.05;

export default defineAsset({
  name: 'ration',
  description: 'A tan cloth bundle tied with twine, with bread and cheese showing at one open end.',
  detail: 0.004,
  reference: 'docs/item-mockups/ration-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const cloth = sdf
      .box([0.2, 0.1, 0.14], 0.03)
      .at(0, Y0, 0)
      .subtract(sdf.cylinder(0.034, 0.1).rotateZ(90).at(0.11, Y0 + 0.006, 0.005))
      .displace(0.0025, (x, y, z) => Math.sin(Math.atan2(z, y - Y0) * 5 + x * 50))
      .paintFn((x, y, z) => mixRgb(CLOTH, CLOTH_DARK, Math.max(0, 0.4 + 0.6 * noise.fbm(x * 20, y * 20, z * 20, 2)) * 0.5));
    k.body('cloth', cloth, { color: '#c8b088', roughness: 0.85, metalness: 0, maxTriangles: 1400 });

    const bread = sdf.capsule([0.03, Y0 + 0.006, 0.005], [0.125, Y0 + 0.006, 0.005], 0.028);
    k.body('bread', bread.paintFn((x, y) => mixRgb(rgb('#8a5a35'), rgb('#b07840'), Math.max(0, Math.min(1, (y - 0.05) / 0.03)))), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      maxTriangles: 700,
    });
    k.body('cheese', sdf.box([0.05, 0.03, 0.036], 0.008).rotateY(-12).at(0.11, 0.033, -0.038), {
      color: '#f0c040',
      roughness: 0.6,
      metalness: 0,
      maxTriangles: 400,
    });

    const band = (x: number) => sdf.torus(0.079, 0.0055).rotateZ(90).scale([1, 0.72, 1]).at(x, Y0, 0);
    const bx = 0.005;
    const bow = sdf.union(
      sdf.torus(0.011, 0.0035).rotateX(20).at(bx, 0.108, 0.013),
      sdf.torus(0.011, 0.0035).rotateX(-20).at(bx, 0.108, -0.013),
      sdf.sphere(0.006).at(bx, 0.104, 0),
      sdf.capsule([bx, 0.103, 0], [bx + 0.02, 0.098, 0.03], 0.0035),
      sdf.capsule([bx, 0.103, 0], [bx - 0.018, 0.098, 0.032], 0.0035),
    );
    k.body('twine', sdf.smoothUnion(0.004, band(-0.025), band(0.035), bow), {
      color: '#a88a5a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.0035,
      maxTriangles: 1000,
    });
  },
});
