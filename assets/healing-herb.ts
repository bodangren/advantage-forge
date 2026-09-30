import { defineAsset, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - healing herb (catalog `items/consumables/healing-herb`).
 * Role: pickup icon, read at 128 px. Size: 0.2 m tall, 0.18 m wide, on y = 0, faces +Z.
 * One idea: three leaning stems with round green leaf pairs, topped by a white five-petal flower.
 * Shape language: round and soft. Palette: leaf #5cb85c, underside #3f9248, petal #fbfbf2,
 * center #f2c531, dirt #6f5235. Materials: dirt, stems+leaves, petals, flower center.
 * Focal point: the white flower with the yellow center.
 */
const clump = sdf
  .sphere(0.06)
  .at(0, 0.015, 0)
  .displace(0.006, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 3))
  .intersect(sdf.halfSpace([0, -1, 0], 0));

const VEIN = rgb('#3f9248');
const leaf = (x: number, y: number, z: number, yaw: number, tilt: number) =>
  sdf
    .ellipsoid([0.032, 0.0085, 0.026])
    .paintWhere(sdf.capsule([-0.03, 0.007, 0], [0.03, 0.007, 0], 0.004), VEIN)
    .at(0.03, 0, 0)
    .rotateZ(tilt)
    .rotateY(yaw)
    .at(x, y, z);

const stemDefs = [
  { a: 90, lean: 0.045, h: 0.13 },
  { a: 210, lean: 0.05, h: 0.115 },
  { a: 330, lean: 0.05, h: 0.12 },
];
const at = (s: { a: number; lean: number; h: number }, t: number): [number, number, number] => {
  const r = (s.a * Math.PI) / 180;
  return [Math.cos(r) * s.lean * t, 0.02 + (s.h - 0.02) * t, Math.sin(r) * s.lean * t];
};
const stems = stemDefs.map((s) => {
  const [x, y, z] = at(s, 1);
  return sdf.capsule([0, 0.02, 0], [x, y, z], 0.012);
});
const leaves = stemDefs.flatMap((s) =>
  [0.55, 1].flatMap((t, i) => {
    const [x, y, z] = at(s, t);
    return [-1, 1].map((sg) => leaf(x, y + 0.003, z, -s.a + sg * (50 + i * 15), 12 + i * 8));
  }),
);
const FY = 0.185;
const petals = [0, 1, 2, 3, 4].map((i) =>
  sdf
    .ellipsoid([0.03, 0.009, 0.02])
    .at(0.032, 0, 0)
    .rotateZ(8)
    .rotateY(i * 72)
    .at(0, FY, 0),
);

export default defineAsset({
  name: 'healing-herb',
  detail: 0.0042,
  reference: 'docs/item-mockups/healing-herb-mock.jpg',
  texture: { size: 512 },
  build(k) {
    k.body('dirt', clump, { color: rgb('#6f5235'), roughness: 0.95, metalness: 0, bump: (x: number, y: number, z: number) => noise.fbm(x * 90, y * 90, z * 90, 2) * 0.5, maxTriangles: 600 });
    k.body('stems', sdf.smoothUnion(0.01, ...stems, sdf.capsule([0, 0.13, 0], [0, FY - 0.005, 0], 0.012)), {
      color: rgb('#4f9f45'),
      maxTriangles: 500,
      roughness: 0.8,
      metalness: 0,
    });
    k.body('leaves', sdf.union(...leaves), { color: rgb('#5cb85c'), roughness: 0.75, metalness: 0, maxTriangles: 1000 });
    k.body('petals', sdf.smoothUnion(0.004, ...petals), { color: rgb('#fbfbf2'), roughness: 0.7, metalness: 0, maxTriangles: 400 });
    k.body('center', sdf.sphere(0.016).at(0, FY + 0.006, 0), { color: rgb('#f2c531'), roughness: 0.6, metalness: 0, maxTriangles: 150 });
  },
});
