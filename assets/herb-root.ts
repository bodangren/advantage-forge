import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note - herb root (catalog `items/crafting/herb-root`).
 * Role: crafting pickup, read at 128 px. Size: 0.2 m tall, 0.18 m wide, on y = 0, faces +Z.
 * One idea: a fat tan taproot, point-down in a dirt clump, crowned by a tuft of green leaves.
 * Palette: root #d8b078, rings #b08a50, leaf #6fbf5a, dirt #6f5235.
 * Materials: dirt, root+rootlets, leaves. Focal point: the ringed root.
 */
const clump = sdf
  .sphere(0.06)
  .at(0, 0.015, 0)
  .displace(0.006, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 3))
  .intersect(sdf.halfSpace([0, -1, 0], 0));

const TAN = rgb('#d8b078');
const RING = rgb('#b08a50');
const root = sdf
  .chain(
    [
      [0, 0.14, 0, 0.04],
      [0.003, 0.105, 0.002, 0.028],
      [0.006, 0.07, 0.004, 0.018],
      [0.008, 0.03, 0.004, 0.01],
    ],
    0.02,
  )
  .smoothUnion(
    0.012,
    sdf.capsule([0.02, 0.1, 0.01], [0.05, 0.05, 0.03], 0.013),
    sdf.capsule([-0.02, 0.095, 0.0], [-0.05, 0.05, 0.035], 0.013),
  )
  .paintFn((_x, y, _z, _base): Rgb => {
    const w = Math.pow(0.5 + 0.5 * Math.cos(y * 210), 5);
    return mixRgb(TAN, RING, w * 0.85);
  });

const leafAt = (tilt: number, yaw: number) =>
  sdf.ellipsoid([0.017, 0.038, 0.0125]).at(0, 0.036, 0).rotateZ(tilt).rotateY(yaw).at(0, 0.14, 0);
const leaves = [leafAt(28, 0), leafAt(28, 120), leafAt(28, 240), leafAt(4, 60)];

export default defineAsset({
  name: 'herb-root',
  reference: 'docs/item-mockups/herb-root-mock.jpg',
  detail: 0.0042,
  texture: { size: 512 },
  build(k) {
    k.body('dirt', clump, { color: rgb('#6f5235'), roughness: 0.95, metalness: 0, bump: (x: number, y: number, z: number) => noise.fbm(x * 90, y * 90, z * 90, 2) * 0.5, maxTriangles: 600 });
    k.body('root', root, { color: TAN, roughness: 0.8, metalness: 0, maxTriangles: 1200 });
    k.body('leaves', sdf.smoothUnion(0.008, ...leaves), { color: rgb('#6fbf5a'), roughness: 0.75, metalness: 0, maxTriangles: 700 });
  },
});
