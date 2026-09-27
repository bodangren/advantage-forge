import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Small pond (props/nature/pond), matched to docs/item-mockups/pond-mock.jpg: turquoise water
 * ringed by chunky rounded stones, with lily pads. 2.5 m x 1.95 m, 0.3 m tall, on y = 0, set
 * straight onto terrain (no ground tile). Palette: water #5fbcb4 with a deeper center #3c9c9e,
 * stones grey #8f969c / #a7adb1 and tan #c9a877, pads #7cc23c / #5a9a2a, bank #5d7f34.
 */

const A = 1.0; // water ellipse x radius
const B = 0.76; // water ellipse z radius
const WATER_Y = 0.06;
const STONE_COUNT = 22;

const WATER = rgb('#4fa39e');
const WATER_DEEP = rgb('#2f7880');
const STONE_COLORS = ['#8f969c', '#a7adb1', '#b39870', '#98a0a5', '#a58a66'].map((c) => rgb(c));
const PAD = rgb('#7cc23c');
const PAD_DARK = rgb('#5a9a2a');
const BANK = rgb('#5d7f34');
const MUD = rgb('#6b5a3e');

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const bounded = (s: ReturnType<typeof sdf.sphere>) =>
  s.intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([4, 1, 4]).at(0, 0.4, 0)));

export default defineAsset({
  name: 'pond',
  description: 'A small turquoise pond ringed by chunky rounded grey and tan stones, with lily pads on the water.',
  detail: 0.012,
  reference: 'docs/item-mockups/pond-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Water: a flat ellipse, deeper in the middle.
    const water = bounded(sdf.ellipsoid([A + 0.04, 0.4, B + 0.04]).intersect(sdf.box([3, WATER_Y, 3]).at(0, WATER_Y / 2, 0)));
    k.body(
      'water',
      water.paintFn((x, y, z) => {
        const r = Math.hypot(x / A, z / B);
        const n = 0.5 + 0.5 * noise.fbm(x * 3, 0, z * 3, 2);
        return mixRgb(WATER, WATER_DEEP, clamp(1 - r * 1.1) * 0.8 + 0.1 * n);
      }),
      {
        color: '#5fbcb4',
        roughness: 0.12,
        metalness: 0,
        detail: 0.02,
        bump: (x, _y, z) => 0.0015 * noise.noise3(x * 12, 0, z * 12),
      },
    );

    // A low grassy, muddy bank under the stones so the pond sits into the ground.
    const bank = bounded(
      sdf
        .ellipsoid([A + 0.3, 0.12, B + 0.3])
        .subtract(sdf.ellipsoid([A - 0.05, 0.5, B - 0.05]))
        .displace(0.02, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 2)),
    );
    k.body(
      'bank',
      bank.paintFn((x, _y, z) => mixRgb(MUD, BANK, clamp((Math.hypot(x / A, z / B) - 1.02) / 0.15))),
      { color: '#5d7f34', roughness: 0.95, metalness: 0, detail: 0.02 },
    );

    // Chunky rounded stones in a ring on the water's edge.
    const stones = [];
    for (let i = 0; i < STONE_COUNT; i++) {
      const t = ((i + 0.3 * (noise.random(i, 1, 0, 5) - 0.5)) / STONE_COUNT) * Math.PI * 2;
      const r = 0.13 + 0.07 * noise.random(i, 2, 0, 5);
      const x = Math.cos(t) * (A + 0.08);
      const z = Math.sin(t) * (B + 0.08);
      const yaw = (-t * 180) / Math.PI + 90 + 30 * (noise.random(i, 3, 0, 5) - 0.5);
      const color = STONE_COLORS[Math.floor(noise.random(i, 4, 0, 5) * STONE_COLORS.length)];
      stones.push(
        sdf
          .ellipsoid([r * 1.25, r * (0.75 + 0.3 * noise.random(i, 6, 0, 5)), r])
          .rotateY(yaw)
          .at(x, r * 0.35, z)
          .displace(0.012, (px, py, pz) => noise.fbm(px * 7, py * 7, pz * 7, 2))
          .paintFn((px, py, pz) => mixRgb(color, rgb('#5f6468'), 0.18 * (0.5 + 0.5 * noise.fbm(px * 9, py * 9, pz * 9, 2)))),
      );
    }
    k.body('stones', bounded(sdf.union(...stones)), {
      color: '#8f969c',
      roughness: 0.85,
      metalness: 0,
      detail: 0.012,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 25, y * 25, z * 25, 2),
    });

    // Lily pads: flat notched discs on the water and on the stones at the edge.
    const pads: [number, number, number, number, number][] = [
      [-0.55, WATER_Y, 0.25, 0.15, 30],
      [0.35, WATER_Y, -0.35, 0.17, 140],
      [0.62, WATER_Y, 0.3, 0.13, 250],
      [-0.2, WATER_Y, -0.45, 0.12, 80],
      [0.05, WATER_Y, 0.48, 0.11, 200],
      [-0.82, WATER_Y, -0.3, 0.13, 320],
    ];
    const padShapes = pads.map(([x, y, z, r, yaw]) =>
      sdf
        .cylinder(r * 1.3, 0.014, 0.005)
        .subtract(sdf.box([r * 1.56, 0.1, 0.04]).at(r * 0.78, 0, 0).rotateY(0))
        .rotateY(yaw)
        .at(x, y + 0.007, z),
    );
    k.body(
      'pads',
      sdf.union(...padShapes).paintFn((x, _y, z) => mixRgb(PAD, PAD_DARK, 0.3 + 0.4 * noise.fbm(x * 20, 0, z * 20, 2))),
      { color: '#7cc23c', roughness: 0.5, metalness: 0, detail: 0.008 },
    );
  },
});
