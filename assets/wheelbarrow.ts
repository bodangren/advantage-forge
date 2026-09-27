import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden wheelbarrow (props/craft-and-trade/wheelbarrow).
 *
 * Role: village work prop for the cozy chibi hamlet; must read at 128 px as
 *   one chunky barrow with a big wheel and a heap of turnips.
 * Size: about 1.3 m long overall, 0.57 m wide, tray rim 0.62 m high; stands on
 *   y = 0 on the wheel and two back legs, wheel at the front (+Z), handles to -Z.
 * One idea: a cheerful honey-oak barrow whose single spoked wheel and piled
 *   turnips break the outline everywhere.
 * Shape language: round dominant (big wheel, round turnips, rounded bevels),
 *   square secondary (plank tray, straight handles).
 * Palette: honey oak #b5814a (dominant), warm brown #8a5a35 (secondary),
 *   pale cut wood #c9a06a (lit tops), dark walnut #6b4226 (seams, shade);
 *   iron #4a4f55 (small); turnip cream #e8dcc2 with straw #e0bb60 variation
 *   and leaf green #5cb85c tops (accent). 60/30/10.
 * Materials: wood (roughness 0.8, metalness 0), worn iron (roughness 0.5,
 *   metalness 0.7), turnips (roughness 0.6), leaves (roughness 0.7).
 * Detail: primary wheel + tray + handles; secondary legs, risers, hub, axle;
 *   tertiary plank seams and grain in paint + bump. Focal point: turnip heap.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = '#4a4f55';
const LEAF = rgb('#5cb85c');
const CREAM = rgb('#e8dcc2');
const STRAW = rgb('#e0bb60');

const WHEEL_Y = 0.2; // axle height = wheel outer radius (0.165 + 0.035)
const WHEEL_Z = 0.44; // wheel center ahead of the tray front
const RIM_R = 0.165;
const RIM_T = 0.035;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default defineAsset({
  name: 'wheelbarrow',
  description:
    'A honey-oak wheelbarrow: one spoked front wheel, a tapered plank tray, two long handles, two back legs, and a heap of turnips with green leaves.',
  detail: 0.007,
  reference: 'docs/item-mockups/wheelbarrow-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wheel
    // Chunky wooden wheel: torus rim, fat hub, six round spokes, axis along X.
    const rim = sdf.torus(RIM_R, RIM_T).rotateZ(90);
    const hub = sdf.cylinder(0.05, 0.11, 0.012).rotateZ(90);
    const spokes: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 6; i++) {
      spokes.push(
        sdf.capsule([0, 0.045, 0], [0, RIM_R - 0.01, 0], 0.013).rotateX(i * 60),
      );
    }
    const wheel = sdf
      .smoothUnion(0.012, rim, hub, ...spokes)
      .at(0, WHEEL_Y, WHEEL_Z);
    const wheelPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(y - WHEEL_Y, z - WHEEL_Z); // radial in the wheel plane
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      let c = mixRgb(OAK, PALE, 0.15 * grain);
      c = mixRgb(c, BROWN, 0.55 * clamp01((r - 0.13) / 0.07)); // darker rim
      c = mixRgb(c, PALE, 0.4 * clamp01((0.055 - r) / 0.055)); // pale hub
      c = mixRgb(c, WALNUT, 0.25 * clamp01((0.14 - y) / 0.14)); // damp lower half
      return c;
    };
    k.body('wheel', wheel.paintFn(wheelPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.007,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ frame
    // One wood body: plank tray (flared walls), two long handles that reach
    // forward to the axle fork, two back legs, and small riser blocks.
    const floorBoard = sdf.box([0.44, 0.04, 0.52], 0.012).at(0, 0.42, 0.1);
    const wallL = sdf.box([0.035, 0.18, 0.52], 0.012).rotateZ(7).at(-0.215, 0.51, 0.1);
    const wallR = sdf.box([0.035, 0.18, 0.52], 0.012).rotateZ(-7).at(0.215, 0.51, 0.1);
    const wallF = sdf.box([0.46, 0.17, 0.035], 0.012).rotateX(7).at(0, 0.505, 0.345);
    const wallB = sdf.box([0.46, 0.15, 0.035], 0.012).rotateX(-7).at(0, 0.495, -0.145);
    const riserB = sdf.box([0.05, 0.07, 0.08], 0.01).at(0.155, 0.378, 0);
    const riserF = sdf.box([0.045, 0.13, 0.06], 0.01).at(0.12, 0.335, 0.26);
    const leg = sdf.capsule([0.17, 0.4, -0.1], [0.185, 0.027, -0.13], 0.027);
    const handle = sdf.capsule([0.235, 0.53, -0.54], [0.1, 0.225, 0.4], 0.03);
    const grip = sdf.capsule([0.235, 0.53, -0.52], [0.25, 0.55, -0.64], 0.038);
    const frame = sdf.smoothUnion(
      0.018,
      floorBoard,
      wallL,
      wallR,
      wallF,
      wallB,
      riserB.mirror('x', 0),
      riserF.mirror('x', 0),
      leg.mirror('x', 0),
      handle.mirror('x', 0),
      grip.mirror('x', 0),
    );
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 22, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
      let c = mixRgb(OAK, PALE, 0.12 * grain + 0.12 * patch);
      c = mixRgb(c, BROWN, 0.3 * grain * grain * grain);
      // Horizontal plank seams on the tray walls.
      if (y > 0.43) {
        const board = (y - 0.44) / 0.075;
        const f = board - Math.floor(board);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
        c = mixRgb(c, WALNUT, 0.68 * seam);
        c = mixRgb(c, PALE, 0.1 * noise.random(Math.floor(board), 3, 1));
      }
      // Handles read a touch darker, grain along their length.
      if (z < -0.2) {
        const hgrain = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 5, 2);
        c = mixRgb(c, BROWN, 0.28 + 0.2 * hgrain);
      }
      // Value plan: shaded underside and legs, sun-lit rim.
      c = mixRgb(c, WALNUT, 0.4 * Math.pow(clamp01(1 - y / 0.14), 2));
      c = mixRgb(c, PALE, 0.25 * Math.pow(clamp01((y - 0.5) / 0.14), 2));
      return c;
    };
    const frameShape = frame
      .paintFn(woodPaint)
      // Darker tray interior: a stencil that crosses only the inner surfaces.
      .paintWhere(
        sdf.box([0.42, 0.165, 0.48], 0.02).at(0, 0.5025, 0.1),
        mixRgb(WALNUT, BROWN, 0.3),
        0.02,
      );
    k.body('frame', frameShape, {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => {
        let b = 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2);
        if (y > 0.43) {
          const f = (y - 0.44) / 0.075;
          const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * (f - Math.floor(f))), 8);
          b -= 0.002 * seam;
        }
        return b;
      },
      maxTriangles: 2600,
    });

    // ------------------------------------------------------------------ iron
    // Axle through the fork, hub caps, and small brackets tying fork to axle.
    const axle = sdf.cylinder(0.016, 0.36, 0.004).rotateZ(90).at(0, WHEEL_Y, WHEEL_Z);
    const cap = sdf.cylinder(0.03, 0.022, 0.005).rotateZ(90).at(0.058, WHEEL_Y, WHEEL_Z);
    const bracket = sdf.box([0.05, 0.055, 0.1], 0.008).at(0.082, 0.212, WHEEL_Z - 0.02);
    k.body('iron-work', sdf.union(axle, cap.mirror('x', 0), bracket.mirror('x', 0)), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ turnips
    // A heap of squashed round bulbs nestled in the tray, poking over the rim.
    const bulbs: readonly (readonly [number, number, number, number])[] = [
      [-0.105, 0.5, 0.03, 0.068],
      [0.03, 0.495, -0.05, 0.065],
      [0.115, 0.5, 0.08, 0.066],
      [-0.03, 0.5, 0.17, 0.067],
      [0.105, 0.495, 0.24, 0.06],
      [-0.05, 0.575, 0.06, 0.064],
      [0.06, 0.575, 0.13, 0.062],
      [-0.13, 0.56, 0.14, 0.055],
      [0.125, 0.555, 0.0, 0.055],
      [-0.01, 0.64, 0.1, 0.058],
    ];
    const heap = sdf.smoothUnion(
      0.012,
      ...bulbs.map(([x, y, z, r]) => sdf.ellipsoid([r, r * 0.85, r]).at(x, y, z)),
    );
    const turnipPaint = (x: number, y: number, z: number) => {
      // Smooth high-frequency tint so each turnip reads apart (stays reducer-friendly).
      const tint = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      let c = mixRgb(CREAM, STRAW, 0.15 + 0.65 * tint);
      c = mixRgb(c, LEAF, 0.22 * clamp01((y - 0.63) / 0.05)); // green near leaf tops
      const root = Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(z - 0.1, x) * 9), 6);
      c = mixRgb(c, mixRgb(CREAM, WALNUT, 0.4), 0.12 * root); // faint root lines
      c = mixRgb(c, mixRgb(CREAM, BROWN, 0.5), 0.25 * clamp01((0.5 - y) / 0.08)); // shaded base
      return c;
    };
    k.body('turnips', heap.paintFn(turnipPaint), {
      color: '#e8dcc2',
      roughness: 0.6,
      metalness: 0,
      detail: 0.006,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 26, y * 26, z * 26, 2),
      maxTriangles: 1100,
    });

    // ------------------------------------------------------------------ leaves
    // A few small green leaves sprouting from the top of the heap.
    const leaves = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.02, 0.075, 0.009]).rotateZ(18).rotateX(-12).at(-0.03, 0.735, 0.07),
      sdf.ellipsoid([0.019, 0.07, 0.009]).rotateZ(-24).rotateX(10).at(0.035, 0.74, 0.125),
      sdf.ellipsoid([0.016, 0.055, 0.008]).rotateX(28).at(0.0, 0.72, 0.15),
    );
    k.body('leaves', leaves, {
      color: '#5cb85c',
      roughness: 0.7,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 250,
    });
  },
});
