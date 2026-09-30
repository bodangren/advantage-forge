import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Bread ration (items/consumables/bread-ration), matched to docs/item-mockups/bread-ration-mock.jpg.
 * Role: pickup icon. Size: 0.2 m long (X), about 0.09 wide, 0.08 tall, on y = 0.
 * One idea: a lumpy slashed crusty roll wrapped mid-body in a cream cloth, tied with a twine bow.
 * Palette: crust #d99a48, sides #b5762e, slash floor #f0c070, cloth #e8dcc0, twine #a88a5a.
 * Materials: bread (rough 0.85), cloth (0.85), twine (0.8).
 */
const CRUST = rgb('#d99a48');
const SIDE = rgb('#b5762e');
const UNDER = rgb('#9a5a26');
const CREAM = rgb('#f0c070');
const floor = sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.6, 0.3, 0.3]).at(0, 0.1, 0));
const topY = (x: number) => 0.038 + 0.038 * Math.sqrt(Math.max(0, 1 - (x / 0.1) ** 2));
const SLASH_X = [-0.072, -0.05, 0.068];
const slashBox = (h: number, w: number, dy: number, x: number) =>
  sdf.box([0.03 + w, h, 0.06 + w], 0.001).rotateY(30).at(x, topY(x) + dy, 0);

export default defineAsset({
  name: 'bread-ration',
  description: 'A lumpy slashed crusty roll wrapped in a cream cloth with a twine bow, both ends of the bread showing.',
  detail: 0.004,
  reference: 'docs/item-mockups/bread-ration-mock.jpg',
  texture: { size: 512 },

  build(k) {
    let bread = sdf
      .ellipsoid([0.1, 0.038, 0.045])
      .at(0, 0.038, 0)
      .displace(0.004, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2))
      .intersect(floor);
    bread = bread.subtract(...SLASH_X.map((x) => slashBox(0.006, 0, -0.002, x)));
    const region = sdf.union(...SLASH_X.map((x) => slashBox(0.02, 0.002, 0.002, x)));
    k.body(
      'bread',
      bread
        .paintFn((x, y) => mixRgb(mixRgb(UNDER, SIDE, Math.min(1, y / 0.02)), CRUST, Math.max(0, Math.min(1, (y - 0.035) / 0.02))))
        .paintWhere(region, CREAM),
      { color: '#d99a48', roughness: 0.85, metalness: 0, maxTriangles: 1400 },
    );
    const cloth = sdf
      .ellipsoid([0.1, 0.038, 0.045])
      .at(0, 0.038, 0)
      .round(0.006)
      .smoothIntersect(0.006, sdf.box([0.07, 0.3, 0.3]).at(0.005, 0.1, 0))
      .displace(0.0025, (x, y, z) => Math.sin(Math.atan2(z, y - 0.038) * 7 + x * 60))
      .intersect(floor);
    k.body('cloth', cloth, { color: '#e8dcc0', roughness: 0.85, metalness: 0, maxTriangles: 1000 });
    const ring = sdf.torus(0.056, 0.0035).rotateZ(90).scale([1, 0.8, 1]).at(0.012, 0.038, 0).intersect(floor);
    const bx = 0.012;
    const bow = sdf.union(
      sdf.torus(0.009, 0.0028).rotateX(20).at(bx, 0.088, 0.011),
      sdf.torus(0.009, 0.0028).rotateX(-20).at(bx, 0.088, -0.011),
      sdf.sphere(0.005).at(bx, 0.086, 0),
      sdf.capsule([bx, 0.085, 0.004], [bx + 0.016, 0.062, 0.05], 0.003),
      sdf.capsule([bx, 0.085, 0.004], [bx - 0.014, 0.06, 0.052], 0.003),
    );
    k.body('twine', sdf.smoothUnion(0.003, ring, bow), { color: '#a88a5a', roughness: 0.8, metalness: 0, maxTriangles: 800 });
  },
});
