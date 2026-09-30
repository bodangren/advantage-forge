import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - ball of wool (catalog `items/crafting/wool`).
 * Role: crafting pickup icon. Size: 0.3 m wide, 0.28 m tall, stands on y = 0, faces +Z.
 * One idea: a fluffy tufted cream ball with two curled strands rising from the top sides.
 * Shape language: round. Palette: cream #f4ead6, curls #e8dcc4, dips #d8ccb0.
 * Materials: wool body (0.95) and curl body (0.95). Fiber detail in a soft bump.
 */
const CREAM = rgb('#f4ead6');
const DIP = rgb('#d8ccb0');
const CURL = rgb('#e8dcc4');
const CORE_Y = 0.13;
const N = 24;

export default defineAsset({
  name: 'wool',
  description: 'Fluffy tufted cream wool ball with two curled strands.',
  reference: 'docs/item-mockups/wool-mock.jpg',
  detail: 0.005,
  texture: { size: 1024 },
  build(k) {
    let ball = sdf.sphere(0.11).at(0, CORE_Y, 0);
    const golden = Math.PI * (3 - Math.sqrt(5));
    let placed = 0;
    for (let i = 0; placed < N && i < 60; i++) {
      const yy = 1 - (2 * (i + 0.5)) / 40;
      if (yy < -0.55) continue;
      const rr = Math.sqrt(1 - yy * yy);
      const th = i * golden + noise.random(i, 1, 2) * 0.5;
      const r = 0.035 + noise.random(i, 3, 4) * 0.01;
      const d = 0.104;
      ball = ball.smoothUnion(
        0.02,
        sdf.sphere(r).at(Math.cos(th) * rr * d, CORE_Y + yy * d, Math.sin(th) * rr * d),
      );
      placed++;
    }
    const shape = ball.paintFn((x, y, z) => {
      const n = noise.fbm(x * 35, y * 35, z * 35, 2);
      const rad = Math.hypot(x, y - CORE_Y, z);
      return mixRgb(CREAM, DIP, Math.min(1, Math.max(0, (0.145 - rad) / 0.04 + n * 0.3)));
    });
    k.body('wool', shape, {
      color: CREAM,
      roughness: 0.95,
      bump: (x: number, y: number, z: number) => noise.fbm(x * 60, y * 60, z * 60, 2) * 0.002,
      maxTriangles: 3300,
    });
    const arc = (s: number) =>
      sdf.chain(
        [
          [0.07, 0.22, 0.03],
          [0.1, 0.265, 0.03],
          [0.13, 0.285, 0.03],
          [0.152, 0.265, 0.03],
          [0.145, 0.232, 0.03],
          [0.118, 0.232, 0.03],
        ].map(([x, y, z]) => [x * s, y, z, 0.018] as [number, number, number, number]),
        0.01,
      );
    k.body('curls', arc(1).union(arc(-1)), { color: CURL, roughness: 0.95, maxTriangles: 600 });
  },
});
