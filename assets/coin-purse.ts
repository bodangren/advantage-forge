import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Coin purse (items/quest-and-treasure/coin-purse), matched to docs/item-mockups/coin-purse-mock.jpg.
 * Role: pickup icon. Size: 0.16 m wide, 0.15 m tall, on y = 0, facing +Z.
 * One idea: a plump round leather pouch, gathered neck with ruffle, twine drawstring, gold coins in the mouth.
 * Palette: leather #8a5a35, shadow #5c3a22, twine #c9a878, gold #f2c14e.
 * Materials: leather (rough 0.8), twine (0.8), gold (metal 1, rough 0.3).
 */
const LEATHER = rgb('#8a5a35');
const SHADOW = rgb('#5c3a22');
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const floor = sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 0.4, 1]).at(0, 0.15, 0));

export default defineAsset({
  name: 'coin-purse',
  description: 'A plump leather coin purse gathered with a twine drawstring and ruffled neck, with gold coins spilling from the mouth.',
  detail: 0.004,
  reference: 'docs/item-mockups/coin-purse-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const sack = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.08, 0.06, 0.08]).at(0, 0.06, 0),
        sdf.cone([0, 0.08, 0], [0, 0.118, 0], 0.045, 0.03),
      )
      .intersect(floor);
    const ruffle = sdf
      .smoothUnion(0.01, sdf.torus(0.036, 0.016).at(0, 0.128, 0))
      .displace(0.004, (x, y, z) => Math.sin(Math.atan2(z, x) * 7));
    k.body(
      'leather',
      sdf.smoothUnion(0.012, sack, ruffle).paintFn((x, y) => mixRgb(SHADOW, LEATHER, clamp(y / 0.08 + 0.3))),
      { color: '#8a5a35', roughness: 0.8, metalness: 0, maxTriangles: 2200 },
    );
    const tie = sdf.torus(0.056, 0.007).at(0, 0.108, 0);
    const knot = sdf.sphere(0.013).at(0, 0.108, 0.058);
    const tails = sdf.union(
      sdf.capsule([0, 0.108, 0.058], [0.016, 0.07, 0.082], 0.006),
      sdf.capsule([0, 0.108, 0.058], [-0.016, 0.072, 0.082], 0.006),
    );
    k.body('twine', sdf.smoothUnion(0.005, tie, knot, tails), { color: '#c9a878', roughness: 0.8, metalness: 0, maxTriangles: 600 });
    const coin = (x: number, y: number, z: number, rx: number, rz: number) =>
      sdf.cylinder(0.026, 0.008, 0.003).rotateX(rx).rotateZ(rz).at(x, y, z);
    k.body('coins', sdf.union(coin(-0.012, 0.15, 0.018, 68, -6), coin(0.022, 0.148, 0.004, 62, 10), coin(0.0, 0.14, -0.018, 75, 0)), {
      color: '#f2c14e', roughness: 0.3, metalness: 1, maxTriangles: 900,
    });
  },
});
