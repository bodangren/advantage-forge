import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — chibi spinning wheel (props/craft-and-trade/spinning-wheel).
 *
 * Role: village craft prop; must read at 128 px as a wheel, a treadle, and wool.
 * Size: 0.9 m tall, 0.63 m wide, 0.58 m deep; stands on y = 0, faces +Z.
 * One idea: a fat straw-yellow spoked wheel seated in a honey cradle, with cream wool on an iron spindle.
 * Shape language: round dominant (wheel, hub, wool, bevels), square secondary (saddle, treadle, legs).
 * Palette: honey oak #b5814a frame (60), straw #e0bb60 wheel (30), cream wool #f3e6cc accent,
 *   warm brown #8a5a35 legs, walnut #6b4226 feet, iron #4a4f55 spindle and crank.
 * Materials: frame wood 0.82, wheel wood 0.78, worn iron 0.5 / 0.7, wool cloth 0.9.
 * Detail: primary wheel + tripod saddle; secondary flyer, treadle, distaff; grain in bump.
 *   Focal point: the yellow wheel against the cream wool. Rig: none.
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const STRAW = rgb('#e0bb60');
const STRAW_DEEP = rgb('#a67c32');
const CREAM = rgb('#f3e6cc');
const CREAM_LIT = rgb('#f7f1e4');
const BURLAP = rgb('#c8a86b');
const IRON = rgb('#4a4f55');
const IRON_HI = rgb('#a8acb1');

const WHEEL_X = 0.04;
const WHEEL_Y = 0.51;
const WHEEL_Z = 0.07;
const RIM_R = 0.2;
const RIM_T = 0.048;

const FLY_X = -0.175;
const FLY_Y = 0.52;
const FLY_Z = -0.07;
const FLY_R = 0.112;
const FLY_T = 0.034;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'spinning-wheel',
  description:
    'A honey-oak spinning wheel on three splayed legs: a large straw-yellow spoked wheel seated in a cradle, a treadle and crank, and an iron spindle wound with cream wool.',
  detail: 0.008,
  reference: 'docs/item-mockups/spinning-wheel-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wheel
    // Thick torus in the XY plane (faces +Z), six round spokes, ball hub.
    // The rim sinks into the saddle cradle so the wheel reads as seated.
    const rim = sdf.torus(RIM_R, RIM_T).rotateX(90);
    const hub = sdf.sphere(0.05);
    const spokes = [];
    for (let i = 0; i < 6; i++) {
      spokes.push(sdf.capsule([0, 0.044, 0], [0, RIM_R - 0.014, 0], 0.016).rotateZ(i * 60));
    }
    const wheel = sdf.smoothUnion(0.013, rim, hub, ...spokes).at(WHEEL_X, WHEEL_Y, WHEEL_Z);
    const wheelPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x - WHEEL_X, y - WHEEL_Y);
      const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 8, z * 16, 2);
      let c = mixRgb(STRAW, PALE, 0.1 * grain);
      c = mixRgb(c, STRAW_DEEP, 0.4 * clamp01((r - 0.16) / 0.09));
      c = mixRgb(c, CREAM_LIT, 0.32 * clamp01((0.062 - r) / 0.062));
      c = mixRgb(c, WALNUT, 0.16 * clamp01((0.28 - y) / 0.28));
      return c;
    };
    k.body('wheel', wheel.paintFn(wheelPaint), {
      color: '#e0bb60',
      roughness: 0.78,
      metalness: 0,
      detail: 0.007,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 22, y * 10, z * 22, 2),
      maxTriangles: 1700,
    });

    // ------------------------------------------------------------------ frame
    // Tripod, cradle saddle, flyer ring, distaff fork, and a chunky treadle.
    const frontLeg = (sx: number) =>
      sdf.cone([sx * 0.23, 0, 0.17], [sx * 0.15, 0.26, 0.035], 0.052, 0.038);
    const rearLeg = sdf.cone([0.0, 0, -0.21], [-0.02, 0.26, -0.05], 0.054, 0.04);
    const stretcher = sdf.capsule([-0.17, 0.1, 0.125], [0.17, 0.1, 0.125], 0.022);
    const rearBar = sdf.capsule([0.0, 0.11, 0.08], [-0.015, 0.11, -0.14], 0.018);
    const peg = (sx: number) => sdf.sphere(0.02).at(sx * 0.205, 0.125, 0.185);

    const saddle = sdf.box([0.58, 0.058, 0.18], 0.018).at(0.0, 0.275, 0.01);
    const cheekL = sdf.box([0.09, 0.08, 0.15], 0.016).rotateZ(20).at(-0.27, 0.31, 0.01);
    const cheekR = sdf.box([0.09, 0.08, 0.15], 0.016).rotateZ(-18).at(0.26, 0.31, 0.02);
    // Wide lip under the rim. Top stays below the spoke opening so it reads as a seat, not a post.
    const rest = sdf.box([0.2, 0.06, 0.12], 0.016).at(WHEEL_X, 0.305, 0.095);

    const axlePost = sdf.capsule([WHEEL_X, 0.28, -0.05], [WHEEL_X, WHEEL_Y, 0.03], 0.026);
    const flyerPost = sdf.capsule([FLY_X, 0.28, -0.015], [FLY_X, 0.4, FLY_Z], 0.026);
    const flyer = sdf.torus(FLY_R, FLY_T).rotateX(90).at(FLY_X, FLY_Y, FLY_Z);
    const flyerHub = sdf.sphere(0.03).at(FLY_X, FLY_Y, FLY_Z);
    // Pale bobbin the wool is wound on. Ends peek out of the cloud.
    const bobbin = sdf.cylinder(0.02, 0.12, 0.005).rotateZ(90).at(-0.02, 0.54, 0.06);

    // Distaff fork. Wool cap on top reaches 0.9 m.
    const postA = sdf.capsule([-0.21, 0.29, -0.125], [-0.21, 0.8, -0.135], 0.02);
    const postB = sdf.capsule([-0.09, 0.29, -0.125], [-0.09, 0.8, -0.135], 0.02);
    const postCap = sdf.box([0.16, 0.04, 0.046], 0.014).at(-0.15, 0.785, -0.13);
    const postFoot = sdf.box([0.16, 0.045, 0.055], 0.012).at(-0.15, 0.3, -0.105);

    const pivot = sdf.capsule([-0.13, 0.075, 0.14], [0.13, 0.075, 0.14], 0.017);
    const treadle = sdf.box([0.2, 0.03, 0.2], 0.012).rotateX(-10).at(0.02, 0.062, 0.22);

    const frame = sdf
      .smoothUnion(
        0.014,
        frontLeg(1),
        frontLeg(-1),
        rearLeg,
        stretcher,
        rearBar,
        peg(1),
        peg(-1),
        saddle,
        cheekL,
        cheekR,
        rest,
        axlePost,
        flyerPost,
        flyer,
        flyerHub,
        bobbin,
        postA,
        postB,
        postCap,
        postFoot,
        pivot,
        treadle,
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 14, y * 7, z * 14, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5 + 3, y * 4, z * 5, 2);
      let c = mixRgb(HONEY, PALE, 0.1 * grain + 0.08 * patch);
      c = mixRgb(c, BROWN, 0.2 * grain * grain);
      const low = clamp01((0.2 - y) / 0.2);
      c = mixRgb(c, BROWN, 0.55 * low);
      c = mixRgb(c, WALNUT, 0.42 * low * low);
      const top = clamp01((y - 0.285) / 0.02) * clamp01((0.36 - y) / 0.06);
      c = mixRgb(c, PALE, 0.32 * top * clamp01(1 - Math.abs(z - 0.01) / 0.1));
      // Bobbin ends read as pale cut wood where they leave the wool.
      const bob = clamp01(1 - Math.hypot((x + 0.02) / 0.07, (y - 0.54) / 0.025, (z - 0.06) / 0.025));
      c = mixRgb(c, PALE, 0.7 * bob);
      return c;
    };
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 16, y * 8, z * 16, 2),
      maxTriangles: 3100,
    });

    // ------------------------------------------------------------------ iron
    // Spindle through the bobbin and wool, crank under the hub, pitman to the treadle.
    const spindle = sdf.cylinder(0.013, 0.26, 0.003).rotateZ(90).at(-0.06, 0.54, 0.06);
    const spindleTip = sdf.sphere(0.018).at(0.075, 0.54, 0.06);
    const whorl = sdf.cylinder(0.032, 0.016, 0.003).rotateZ(90).at(FLY_X, FLY_Y, FLY_Z);
    const axleCap = sdf.sphere(0.022).at(WHEEL_X, WHEEL_Y, WHEEL_Z + 0.058);
    const crankArm = sdf.capsule(
      [WHEEL_X, WHEEL_Y, WHEEL_Z + 0.062],
      [WHEEL_X + 0.01, WHEEL_Y - 0.05, WHEEL_Z + 0.085],
      0.011,
    );
    const crankPin = sdf.sphere(0.017).at(WHEEL_X + 0.01, WHEEL_Y - 0.05, WHEEL_Z + 0.095);
    const pitman = sdf.capsule(
      [WHEEL_X + 0.01, WHEEL_Y - 0.05, WHEEL_Z + 0.095],
      [0.025, 0.085, 0.16],
      0.01,
    );
    const iron = sdf.smoothUnion(0.006, spindle, spindleTip, whorl, axleCap, crankArm, crankPin, pitman);
    const ironPaint = (x: number, y: number, z: number) => {
      const tip = clamp01(1 - Math.hypot(x - 0.075, y - 0.54, z - 0.06) / 0.022);
      const pin = clamp01(1 - Math.hypot(x - (WHEEL_X + 0.01), y - (WHEEL_Y - 0.05), z - (WHEEL_Z + 0.095)) / 0.02);
      return mixRgb(IRON, IRON_HI, 0.65 * Math.max(tip, pin));
    };
    k.body('iron', iron.paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 650,
    });

    // ------------------------------------------------------------------ wool
    // Lumpy cream cloud on the spindle, plus the distaff bundle that tops the asset at 0.9 m.
    const cloud = sdf.smoothUnion(
      0.024,
      sdf.ellipsoid([0.095, 0.075, 0.05]).at(-0.035, 0.54, 0.06),
      sdf.ellipsoid([0.055, 0.048, 0.04]).at(0.025, 0.565, 0.07),
      sdf.ellipsoid([0.05, 0.042, 0.034]).at(-0.085, 0.52, 0.045),
      sdf.ellipsoid([0.045, 0.04, 0.036]).at(-0.015, 0.58, 0.1),
      sdf.ellipsoid([0.055, 0.05, 0.048]).at(-0.02, 0.55, 0.145),
      sdf.sphere(0.032).at(0.015, 0.51, 0.04),
    );
    const wisp = (x: number, y: number, z: number, dx: number, dy: number, dz: number) =>
      sdf.capsule([x, y, z], [x + dx, y + dy, z + dz], 0.011);
    const distaffWool = sdf.smoothUnion(
      0.016,
      sdf.box([0.14, 0.055, 0.05], 0.016).at(-0.15, 0.835, -0.13),
      sdf.ellipsoid([0.045, 0.028, 0.03]).at(-0.15, 0.872, -0.125),
    );
    const wool = sdf.union(
      cloud,
      wisp(0.05, 0.57, 0.07, 0.04, 0.022, 0.018),
      wisp(-0.09, 0.53, 0.05, -0.032, 0.02, 0.012),
      wisp(-0.02, 0.6, 0.08, 0.01, 0.034, 0.016),
      distaffWool,
    );
    const woolPaint = (x: number, y: number, z: number) => {
      const fiber = 0.5 + 0.5 * noise.fbm(x * 26, y * 42, z * 26, 2);
      const clump = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
      let c = mixRgb(CREAM, BURLAP, 0.38 + 0.28 * clump);
      c = mixRgb(c, CREAM_LIT, 0.28 * fiber);
      c = mixRgb(c, BURLAP, 0.22 * clamp01((0.5 - y) / 0.1));
      return c;
    };
    k.body('wool', wool.paintFn(woolPaint), {
      color: '#f3e6cc',
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 34, y * 46, z * 34, 2),
      maxTriangles: 1400,
    });
  },
});
