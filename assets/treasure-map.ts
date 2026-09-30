import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Treasure map (quest item): an aged parchment stood up at 70 degrees on a dark wood wedge,
 * 0.28 m wide and 0.42 m tall, with rolled top and bottom edges (rolls run along X). One idea: a big
 * raised red X on the sheet. Drawn: island outline, dashed red trail, three palm dots, brass compass.
 * Palette: parchment #ecd09a, burnt edge #6a4020, ink #6b4a2a, X #d83a2a, brass #b8892e, wedge #4a2e18.
 */

const PAPER = rgb('#ecd09a');
const BURNT = rgb('#6a4020');
const INK = rgb('#6b4a2a');
const ISLAND = rgb('#dcbb7c');
const RED = rgb('#c0302a');
const PALM = rgb('#4f7a32');
const BRASS = rgb('#b8892e');

const HX = 0.14; // half width
const HZ = 0.21; // half length (to the roll centers)
const ROLL_R = 0.02;
const T = 0.008;
const TILT = 70;
const LIFT = 0.213;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const line = (d: number, w: number) => 1 - clamp((d - w) / 0.0015);
const pose = (s: ReturnType<typeof sdf.box>) => s.rotateX(TILT).at(0, LIFT, 0);

function seg(x: number, z: number, a: [number, number], b: [number, number]) {
  const vx = b[0] - a[0];
  const vz = b[1] - a[1];
  const t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz));
  return { d: Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t), t };
}

const TRAIL: [number, number][] = [[-0.06, 0.11], [-0.03, 0.06], [-0.05, 0.02], [0.02, 0.03], [0.04, 0.01], [0.0, 0.0]];
const PALMS: [number, number][] = [[-0.05, -0.08], [0.05, -0.06], [0.06, 0.07]];

const mapPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 25, y * 25, z * 25, 2);
  let c = mixRgb(PAPER, rgb('#d8b878'), 0.2 * n);
  if (y < T * 2.5 && Math.abs(z) < HZ - 0.012) {
    // Burnt edge band, 0.02 m wide.
    const band = Math.min(HX - Math.abs(x), HZ - Math.abs(z));
    c = mixRgb(c, BURNT, 1 - clamp((band - 0.016) / 0.008));
    const isl = Math.hypot(x / 0.095, (z - 0.0) / 0.14) - 1 + 0.12 * noise.noise3(x * 25, 0, z * 25);
    if (isl < 0) c = ISLAND;
    c = mixRgb(c, INK, line(Math.abs(isl) * 0.06, 0.0015));
    for (const [px, pz] of PALMS) if (Math.hypot(x - px, z - pz) < 0.011) c = PALM;
    for (let i = 0; i < TRAIL.length - 1; i++) {
      const s = seg(x, z, TRAIL[i]!, TRAIL[i + 1]!);
      const along = (i + s.t) * 5;
      if (s.d < 0.006 && along - Math.floor(along) < 0.6) c = RED;
    }
    const cx = -0.085;
    const cz = 0.15;
    const cd = Math.hypot(x - cx, z - cz);
    if (cd < 0.026) c = BRASS;
    if (Math.abs(cd - 0.026) < 0.002 || (cd < 0.026 && (Math.abs(x - cx) < 0.0025 || Math.abs(z - cz) < 0.0025))) c = INK;
    if (cd < 0.006) c = rgb('#f0d070');
  }
  return c;
};

export default defineAsset({
  name: 'treasure-map',
  description: 'An aged treasure map propped upright on a wood wedge, with rolled edges, an island, a dashed trail and a big raised red X.',
  detail: 0.004,
  reference: 'docs/item-mockups/treasure-map-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const sheet = sdf.box([HX * 2, T, HZ * 2], 0.0015).at(0, T / 2, 0);
    const roll = (s: number) => sdf.cylinder(ROLL_R, HX * 2 - 0.004, 0.006).rotateZ(90).at(0, ROLL_R, s * HZ);
    const paper = sdf
      .smoothUnion(0.02, sheet, roll(1), roll(-1))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.4, 0.2, 0.6]).at(0, 0.05, 0)))
      .paintFn((x, y, z) => {
        if (Math.abs(Math.abs(z) - HZ) < ROLL_R && Math.abs(x) > HX - 0.006) {
          const r = Math.hypot(Math.abs(z) - HZ, y - ROLL_R);
          const a = Math.atan2(y - ROLL_R, Math.abs(z) - HZ) / (2 * Math.PI);
          const turn = r / 0.005 - a;
          return mixRgb(PAPER, INK, 0.5 * (1 - clamp((Math.abs(turn - Math.round(turn)) - 0.1) / 0.1)));
        }
        return mapPaint(x, y, z);
      });
    k.body('paper', pose(paper), {
      color: '#ecd09a',
      roughness: 0.85,
      metalness: 0,
      textureDensity: 3,
      paintWeight: 2,
      detail: 0.0065,
      maxError: 0.008,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    const bar = (a: number) => sdf.box([0.16, 0.02, 0.04], 0.0099).rotateY(a).at(0, T + 0.005, 0);
    k.body('x', pose(sdf.smoothUnion(0.008, bar(45), bar(-45))), {
      color: '#d83a2a',
      roughness: 0.45,
      metalness: 0,
      detail: 0.005,
    });

    k.body('wedge', sdf.box([0.16, 0.12, 0.11], 0.012).at(0, 0.06, -0.04), {
      color: '#4a2e18',
      roughness: 0.75,
      metalness: 0,
      detail: 0.006,
    });
  },
});
