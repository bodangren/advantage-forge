import { defineAsset, mixRgb, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note - flower petal (catalog `items/crafting/flower-petal`).
 * Role: crafting pickup, read at 128 px. About 0.26 m wide, 0.2 m deep, 0.1 m tall, on y = 0, faces +Z.
 * One idea: a cupped five-petal pink blossom with two loose petals on the ground beside it.
 * Palette: petal #f7a4b8, tip #ffd0dc, center #f6e3a0. Materials: petals, center.
 * Focal point: the cupped bowl of petals.
 */
const PINK = rgb('#f7a4b8');
const TIP = rgb('#ffd0dc');
const DEEP = rgb('#e888a4');
const CENTER = rgb('#f6e3a0');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const R = [0.05, 0.011, 0.03] as [number, number, number];

const cupped = sdf.union(
  ...[0, 1, 2, 3, 4].map((i) =>
    sdf.ellipsoid(R).rotateZ(35).at(0.06, 0, 0).rotateY(72 * i).at(0, 0.045, 0),
  ),
).paintFn((x, _y, z, _b): Rgb => {
  const t = clamp01((Math.hypot(x, z) - 0.03) / 0.09);
  return mixRgb(mixRgb(DEEP, PINK, clamp01(t * 3)), TIP, clamp01((t - 0.55) / 0.4));
});

const loosePetal = sdf.ellipsoid(R).paintFn((x, _y, _z, _b): Rgb => {
  const t = clamp01((x + 0.05) / 0.1);
  return mixRgb(mixRgb(DEEP, PINK, clamp01(t * 3)), TIP, clamp01((t - 0.55) / 0.4));
});
const loose = sdf.union(
  loosePetal.rotateY(-35).at(0.09, 0.0115, 0.075),
  loosePetal.rotateZ(15).rotateY(200).at(-0.08, 0.015, -0.075),
);

export default defineAsset({
  name: 'flower-petal',
  detail: 0.0042,
  reference: 'docs/item-mockups/flower-petal-mock.jpg',
  texture: { size: 512 },
  build(k) {
    k.body('blossom', cupped, { color: PINK, roughness: 0.65, metalness: 0, maxTriangles: 1700 });
    k.body('loose', loose, { color: PINK, roughness: 0.65, metalness: 0 });
    k.body('center', sdf.sphere(0.022).at(0, 0.035, 0), { color: CENTER, roughness: 0.6, metalness: 0, maxTriangles: 200 });
  },
});
