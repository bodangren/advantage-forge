import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Treasure map (equipment/tools/map): a parchment sheet lying on y = 0 with both short ends
 * rolled up, 0.42 m x 0.28 m. Drawn on it: a sea along the west edge, a lake, green forest dots,
 * brown mountains, a dashed red trail, and a red X. Read at 128 px from above and at 3/4.
 * Palette: parchment #efdcae / edge #cdb27c, ink #6b4a2a, sea #6fa8c8, forest #5f8f3a,
 * trail and X #c0302a.
 */

const PAPER = rgb('#efdcae');
const PAPER_EDGE = rgb('#cdb27c');
const INK = rgb('#6b4a2a');
const SEA = rgb('#6fa8c8');
const SEA_DEEP = rgb('#4f86ab');
const FOREST = rgb('#5f8f3a');
const MOUNTAIN = rgb('#9a6f45');
const RED = rgb('#c0302a');

const HX = 0.175; // half length of the flat sheet (to the roll centers)
const HZ = 0.14; // half width
const ROLL_R = 0.02;
const T = 0.004; // sheet thickness

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const line = (d: number, w: number) => 1 - clamp((d - w) / 0.0015);

/** Distance from (x, z) to the segment a-b, and the position t along it. */
function seg(x: number, z: number, a: [number, number], b: [number, number]) {
  const vx = b[0] - a[0];
  const vz = b[1] - a[1];
  const t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz));
  return { d: Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t), t };
}

const TRAIL: [number, number][] = [
  [-0.09, 0.09],
  [-0.04, 0.05],
  [-0.05, 0.0],
  [0.01, -0.03],
  [0.07, -0.02],
  [0.11, -0.06],
];
const X_AT: [number, number] = [0.12, -0.065];
const FORESTS: [number, number][] = [
  [-0.02, 0.1],
  [0.0, 0.085],
  [0.02, 0.1],
  [0.1, 0.06],
  [0.12, 0.08],
  [0.085, 0.085],
];
const MOUNTAINS: [number, number][] = [
  [0.02, -0.08],
  [0.05, -0.095],
  [-0.02, -0.095],
];

const mapPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 25, y * 25, z * 25, 2);
  let c = mixRgb(PAPER, PAPER_EDGE, 0.15 * n);
  // Darker toward the edges and on the rolls.
  const edge = Math.max(Math.abs(x) / HX, Math.abs(z) / HZ);
  c = mixRgb(c, PAPER_EDGE, clamp((edge - 0.8) / 0.25) * 0.7);
  if (y < T * 2.5 && Math.abs(x) < HX - 0.015) {
    // Sea along the west edge with a wobbly coast and an ink shore line.
    const coast = x + 0.09 + 0.025 * noise.noise3(0, 0, z * 18);
    if (coast < 0) c = mixRgb(SEA, SEA_DEEP, clamp(-coast / 0.05));
    c = mixRgb(c, INK, line(Math.abs(coast), 0.0012));
    // A lake.
    const lake = Math.hypot((x - 0.075) / 0.028, (z - 0.035) / 0.018) - 1;
    if (lake < 0) c = SEA;
    c = mixRgb(c, INK, line(Math.abs(lake) * 0.02, 0.0008));
    for (const [fx, fz] of FORESTS) if (Math.hypot(x - fx, z - fz) < 0.011) c = FOREST;
    for (const [mx, mz] of MOUNTAINS) {
      const inside = z < mz + 0.012 && z > mz - 0.012 + Math.abs(x - mx) * 1.4 - 0.012;
      if (inside && z > mz - 0.024 + Math.abs(x - mx) * 1.6) c = MOUNTAIN;
    }
    // Dashed trail.
    for (let i = 0; i < TRAIL.length - 1; i++) {
      const s = seg(x, z, TRAIL[i]!, TRAIL[i + 1]!);
      const along = (i + s.t) * 6;
      if (s.d < 0.0035 && along - Math.floor(along) < 0.55) c = RED;
    }
    // The X.
    const dx = x - X_AT[0];
    const dz = z - X_AT[1];
    if (Math.max(Math.abs(dx), Math.abs(dz)) < 0.016 && Math.min(Math.abs(dx - dz), Math.abs(dx + dz)) < 0.0065) c = RED;
    // Ink border.
    const bx = HX - 0.022 - Math.abs(x);
    const bz = HZ - 0.016 - Math.abs(z);
    if (Math.abs(Math.min(bx, bz)) < 0.0012 && Math.min(bx, bz) > -0.002) c = INK;
  }
  return c;
};

export default defineAsset({
  name: 'map',
  description: 'A parchment treasure map with rolled ends: sea, lake, forests, mountains, a dashed red trail, and a red X.',
  detail: 0.003,
  reference: 'docs/item-mockups/map-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const sheet = sdf
      .box([HX * 2, T, HZ * 2], 0.0015)
      .at(0, T / 2, 0)
      .displace(0.0012, (x, _y, z) => noise.fbm(x * 12, 0, z * 12, 2));
    const roll = (s: number) =>
      sdf
        .cylinder(ROLL_R, HZ * 2 - 0.004, 0.006)
        .rotateX(90)
        .at(s * HX, ROLL_R, 0);
    // The sheet climbs a little onto each roll so they read as one curled piece of paper.
    const paper = sdf
      .smoothUnion(0.02, sheet, roll(1), roll(-1))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.6, 0.2, 0.4]).at(0, 0.05, 0)))
      .paintFn((x, y, z) => {
        if (Math.abs(Math.abs(x) - HX) < ROLL_R && Math.abs(z) > HZ - 0.004) {
          // Rolled spiral on the roll ends.
          const r = Math.hypot(Math.abs(x) - HX, y - ROLL_R);
          const a = Math.atan2(y - ROLL_R, Math.abs(x) - HX) / (2 * Math.PI);
          const turn = r / 0.005 - a;
          return mixRgb(PAPER, INK, 0.5 * (1 - clamp((Math.abs(turn - Math.round(turn)) - 0.1) / 0.1)));
        }
        return mapPaint(x, y, z);
      });
    k.body('paper', paper, {
      color: '#efdcae',
      roughness: 0.85,
      metalness: 0,
      textureDensity: 3,
      paintWeight: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
  },
});
