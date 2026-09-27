import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — flail (equipment/melee-weapons/flail).
 *
 * Role: chibi hero melee weapon; read as an icon and in hand at 128 px.
 * Size: about 0.85 m long lying flat on y = 0, handle along X, chain arcing
 *   gently toward +Z, spiked ball resting at the right, centred on the Y axis.
 * One idea: a chunky five-link chain between a honey-oak handle and a big
 *   spiked iron ball — the ball is the focal point with the strongest contrast.
 * Shape language: round and chunky (friendly chibi), spikes as danger accent.
 * Palette: honey oak #b5814a handle (dominant), iron #4a4f55 / #363a3f with
 *   highlight #a8acb1 (secondary), one gold collar #d4a93a as the accent.
 * Materials: wood (roughness 0.8), worn iron (roughness 0.5, metalness 0.7),
 *   gold (roughness 0.3, metalness 1).
 * Detail list: handle, iron butt cap, gold collar, 5 chunky links, spiked ball
 *   with an eye ring. Focal point: the spiked ball.
 * Rig/animation: none (static item).
 */

const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const GOLD = rgb('#d4a93a');
const GOLD_LIGHT = rgb('#f2d98a');

const HANDLE_X0 = -0.35; // butt end of the wood
const HANDLE_X1 = 0.1; // chain end of the wood
const HANDLE_R = 0.024;
const HANDLE_Y = HANDLE_R;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default defineAsset({
  name: 'flail',
  description:
    'A wooden-handled flail with an iron butt cap, five chunky chain links, and a spiked iron ball.',
  detail: 0.004,
  reference: 'docs/item-mockups/flail-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wooden handle
    const handleLen = HANDLE_X1 - HANDLE_X0;
    const handle = sdf
      .cylinder(HANDLE_R, handleLen, 0.008)
      .rotateZ(90)
      .at((HANDLE_X0 + HANDLE_X1) / 2, HANDLE_Y, 0)
      // Darker grain toward the butt, lighter toward the collar.
      .paintFn((x, y, z, base) => {
        const t = clamp01((HANDLE_X1 - x) / handleLen);
        const grain = noise.fbm(x * 40, y * 8, z * 40, 2) * 0.08;
        return mixRgb(mixRgb(base, OAK_LIGHT, 0.35 * (1 - t)), WALNUT, 0.45 * t + grain);
      });
    k.body('handle', handle, {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 6, z * 30, 3), // wood grain
      maxTriangles: 600,
    });

    // ------------------------------------------------------------------ iron butt cap
    const cap = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.027, 0.05, 0.01).rotateZ(90).at(HANDLE_X0 - 0.015, HANDLE_Y, 0),
        sdf.sphere(0.026).at(HANDLE_X0 - 0.04, HANDLE_Y, 0),
      )
      .paintFn((x, y, z, base) => mixRgb(base, IRON_LIGHT, Math.max(0, (y - HANDLE_Y) * 6)));
    k.body('cap', cap, {
      color: '#363a3f',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 200,
    });

    // ------------------------------------------------------------------ gold collar where the chain leaves the handle
    const collar = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(0.027).at(HANDLE_X1 + 0.012, HANDLE_Y, 0),
        sdf.cylinder(0.02, 0.02, 0.006).rotateZ(90).at(HANDLE_X1 - 0.002, HANDLE_Y, 0),
      )
      .paintFn((x, y, z, base) => mixRgb(base, GOLD_LIGHT, Math.max(0, (y - HANDLE_Y) * 5)));
    k.body('collar', collar, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 200,
    });

    // ------------------------------------------------------------------ chain of 5 chunky links
    // Alternating flat / upright tori along a gentle arc toward +Z.
    const linkX0 = HANDLE_X1 + 0.05;
    const linkAt = (i: number) => {
      const t = i / 4;
      const x = linkX0 + i * 0.027;
      const z = 0.02 * Math.sin(t * Math.PI);
      const ring = sdf.torus(0.016, 0.006);
      return i % 2 === 0
        ? ring.at(x, 0.007, z) // lying flat on the ground
        : ring.rotateX(90).at(x, 0.0235, z); // standing, axis along Z
    };
    const chain = sdf
      .union(linkAt(0), linkAt(1), linkAt(2), linkAt(3), linkAt(4))
      .paintFn((x, y, z, base) => mixRgb(base, IRON_LIGHT, Math.max(0, (y - 0.01) * 5)));
    k.body('chain', chain, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0025,
      paintWeight: 2,
      maxTriangles: 500,
    });

    // ------------------------------------------------------------------ spiked iron ball
    const BALL: [number, number, number] = [0.32, 0.055, 0.02];
    const dirs: [number, number, number][] = [
      [0, 1, 0],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
      [0.8, 0.8, 0.8],
      [-0.8, 0.8, 0.8],
      [0.8, 0.8, -0.8],
      [-0.8, 0.8, -0.8],
    ];
    let ball = sdf.sphere(0.05).at(...BALL);
    for (const [dx, dy, dz] of dirs) {
      const len = Math.hypot(dx, dy, dz);
      const d: [number, number, number] = [dx / len, dy / len, dz / len];
      const basePt: [number, number, number] = [
        BALL[0] + d[0] * 0.036,
        BALL[1] + d[1] * 0.036,
        BALL[2] + d[2] * 0.036,
      ];
      const tip: [number, number, number] = [
        BALL[0] + d[0] * 0.095,
        BALL[1] + d[1] * 0.095,
        BALL[2] + d[2] * 0.095,
      ];
      ball = ball.smoothUnion(0.008, sdf.cone(basePt, tip, 0.015, 0.003));
    }
    // Eye ring where the last link meets the ball.
    ball = ball.smoothUnion(
      0.005,
      sdf.torus(0.012, 0.005).rotateX(90).at(BALL[0] - 0.052, BALL[1] + 0.006, BALL[2]),
    );
    ball = ball.paintFn((x, y, z, base) => {
      const dist = Math.hypot(x - BALL[0], y - BALL[1], z - BALL[2]);
      const sheen = Math.max(0, (y - BALL[1]) * 4);
      const tipLight = dist > 0.068 ? 0.35 : 0;
      return mixRgb(
        mixRgb(base, IRON_LIGHT, Math.min(0.55, sheen + tipLight)),
        IRON_DEEP,
        Math.max(0, (BALL[1] - y) * 3),
      );
    });
    k.body('ball', ball, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      paintWeight: 2,
      maxTriangles: 1400,
    });
  },
});
