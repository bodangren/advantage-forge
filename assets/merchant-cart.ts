import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - merchant cart (vehicles/land/merchant-cart), built on market-cart.
 * Role: market-square vehicle prop; reads at 128 px as a cart under a red-white awning.
 * Size: bed 1.2 x 0.8 m, awning 1.5 x 1.1 m at 1.5 m high, on y = 0, shafts toward +Z.
 * One idea: a striped arched canvas awning over a plank cart heaped with cloth bolts.
 * Shape language: round (wheels, arched awning), square (crates, planks).
 * Palette: honey oak #b5814a, brown #8a5a35, walnut #6b4226, iron #4a4f55;
 *   awning red #d9382c / cream #f3e6cc; bolts #c8302a #2f6aa8 #e0bb60.
 * Materials: wood, iron, canvas, cloth, crate wood, lantern glass (emissive).
 * Detail: wheels/bed/shafts, four posts, awning, bolts, crates, lantern. Focal: awning.
 * Rig/animation: none.
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = '#4a4f55';
const IRON_HI = '#a8acb1';
const BURLAP = rgb('#c8a86b');
const BURLAP_DARK = rgb('#9a7c4a');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3c7a3d');
const LEAF_LIGHT = rgb('#86d47e');
const HEAD = rgb('#9ed36a');
const HEAD_LIGHT = rgb('#c3e88f');
const HEAD_DARK = rgb('#6fae43');
const CARROT = rgb('#e8823a');
const CARROT_DARK = rgb('#b8641f');
const APPLE = rgb('#d92b1f');
const APPLE_DARK = rgb('#9c140c');
const APPLE_HI = rgb('#ff6a44');
const STRAW = rgb('#e0bb60');
const STRAW_DARK = rgb('#b08a3a');
const STEM = '#6b4426';

const AXLE_Y = 0.35; // wheel radius 0.35 -> wheels stand on y = 0
const RIM_R = 0.3;
const RIM_T = 0.05;
const WHEEL_X = 0.46; // wheel centre off-axis (rim inner face at 0.41)
const BED_TOP = 0.44; // produce floor
const RIM_TOP = 0.695; // side-board rim

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'merchant-cart',
  description:
    'A honey-oak two-wheeled merchant cart with a red-and-white striped arched awning, cloth bolts, stacked crates, and a hanging lantern.',
  detail: 0.007,
  reference: 'docs/vehicle-mockups/merchant-cart-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wheels
    // Chunky wooden wheel: torus rim, fat hub, six round spokes, axis along X.
    // Both wheels share one mirrored wood body.
    const rim = sdf.torus(RIM_R, RIM_T).rotateZ(90);
    const hub = sdf.cylinder(0.062, 0.08, 0.01).rotateZ(90);
    const spokes: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 6; i++) {
      spokes.push(
        sdf.capsule([0, 0.05, 0], [0, RIM_R - 0.045, 0], 0.014).rotateX(i * 60),
      );
    }
    const wheel = sdf
      .smoothUnion(0.01, rim, hub, ...spokes)
      .at(WHEEL_X, AXLE_Y, 0)
      .mirror('x', 0);
    const wheelPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(y - AXLE_Y, z); // radial in the wheel plane
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      let c = mixRgb(OAK, PALE, 0.14 * grain);
      c = mixRgb(c, BROWN, 0.55 * clamp01((r - 0.24) / 0.11)); // darker rim
      c = mixRgb(c, PALE, 0.45 * clamp01((0.075 - r) / 0.075)); // pale hub
      c = mixRgb(c, WALNUT, 0.35 * clamp01((0.14 - y) / 0.14)); // damp lower half
      return c;
    };
    k.body('wheels', wheel.paintFn(wheelPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 2000,
    });

    // ------------------------------------------------------------------ iron work
    // Axle through the bed, hub caps with bright nuts, and a thin iron strake
    // band hugging each rim (shell of the rim cut by a thin slab).
    const axle = sdf.cylinder(0.02, 1.04, 0.004).rotateZ(90).at(0, AXLE_Y, 0);
    const cap = sdf.cylinder(0.072, 0.024, 0.004).rotateZ(90).at(WHEEL_X + 0.046, AXLE_Y, 0);
    const nut = sdf.sphere(0.017).at(WHEEL_X + 0.056, AXLE_Y, 0);
    const rimTorus = sdf.torus(RIM_R, RIM_T).rotateZ(90);
    const strake = rimTorus
      .round(0.004)
      .subtract(rimTorus.round(-0.003))
      .intersect(sdf.box([0.024, 0.9, 0.9], 0.006));
    const strakeL = strake.at(WHEEL_X, AXLE_Y, 0);
    const iron = sdf
      .union(axle, cap.mirror('x', 0), nut.mirror('x', 0), strakeL.mirror('x', 0))
      .paintWhere(sdf.box([0.03, 0.08, 0.08], 0.004).at(WHEEL_X + 0.055, AXLE_Y, 0), IRON_HI, 0.004)
      .paintWhere(sdf.box([0.03, 0.08, 0.08], 0.004).at(-WHEEL_X - 0.055, AXLE_Y, 0), IRON_HI, 0.004);
    k.body('iron-work', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 776,
    });

    // ------------------------------------------------------------------ bed
    // One oak body: plank floor, low side boards (front board lower so the
    // load shows), corner posts, under-rails, axle blocks, front and rear
    // beams, two long shafts reaching forward to the ground, and the pull
    // crossbar between the shaft tips.
    const floorBoard = sdf.box([0.78, 0.045, 1.18], 0.012).at(0, BED_TOP - 0.0225, 0);
    const sideL = sdf.box([0.035, 0.25, 1.24], 0.012).at(-0.3825, RIM_TOP - 0.125, 0);
    const back = sdf.box([0.77, 0.25, 0.035], 0.012).at(0, RIM_TOP - 0.125, -0.6025);
    const front = sdf.box([0.77, 0.18, 0.035], 0.012).at(0, RIM_TOP - 0.09, 0.6025);
    const post = sdf.box([0.05, 0.28, 0.05], 0.012).at(0.375, RIM_TOP - 0.13, 0.595);
    const rail = sdf.box([0.06, 0.085, 1.14], 0.012).at(0.3, 0.3625, 0);
    const axleBlock = sdf.box([0.09, 0.09, 0.12], 0.01).at(0.3, AXLE_Y + 0.01, 0);
    const beamF = sdf.box([0.5, 0.055, 0.05], 0.01).at(0, 0.4, 0.63);
    const beamB = sdf.box([0.56, 0.06, 0.05], 0.01).at(0, 0.4, -0.63);
    const shaft = sdf.capsule([0.27, 0.44, 0.52], [0.3, 0.033, 1.38], 0.03);
    const grip = sdf.capsule([-0.31, 0.06, 1.35], [0.31, 0.06, 1.35], 0.034);
    const bed = sdf.smoothUnion(
      0.015,
      floorBoard,
      sideL.mirror('x', 0),
      back,
      front,
      post.mirror('x', 0).mirror('z', 0),
      rail.mirror('x', 0),
      axleBlock.mirror('x', 0),
      beamF,
      beamB,
      shaft.mirror('x', 0),
      grip,
    );
    // Nail heads on the outer side boards (painted dots, no geometry cost).
    const nails: [number, number, number][] = [];
    for (const sx of [-1, 1])
      for (const nz of [-0.45, 0, 0.45])
        for (const ny of [0.51, 0.645]) nails.push([sx * 0.401, ny, nz]);
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 22, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
      let c = mixRgb(OAK, PALE, 0.12 * grain + 0.12 * patch);
      c = mixRgb(c, BROWN, 0.3 * grain * grain * grain);
      // Side boards: one painted plank seam + per-board tint.
      if (Math.abs(x) > 0.36 && y > 0.45) {
        const f = (y - 0.445) / 0.25;
        const seam = Math.exp(-Math.pow((f - 0.5) / 0.07, 2));
        c = mixRgb(c, WALNUT, 0.68 * seam);
        c = mixRgb(c, PALE, 0.1 * noise.random(f < 0.5 ? 0 : 1, x > 0 ? 3 : 5, 1));
      }
      // Shafts read a touch darker than the bed.
      if (z > 0.55) {
        const hgrain = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 5, 2);
        c = mixRgb(c, BROWN, 0.26 + 0.2 * hgrain);
      }
      // Nail dots on the outer side faces.
      if (Math.abs(x) > 0.393) {
        for (const [nx, ny, nz] of nails) {
          if (Math.sign(nx) !== Math.sign(x)) continue;
          const d2 = (y - ny) * (y - ny) + (z - nz) * (z - nz);
          if (d2 < 0.00007) c = mixRgb(c, WALNUT, 0.85);
        }
      }
      // Value plan: shaded underside, sun-lit rim and posts.
      c = mixRgb(c, WALNUT, 0.5 * Math.pow(clamp01(1 - y / 0.16), 2));
      c = mixRgb(c, PALE, 0.3 * Math.pow(clamp01((y - 0.58) / 0.15), 2));
      return c;
    };
    k.body('bed', bed.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      bump: (x, y, z) => {
        let b = 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2);
        if (Math.abs(x) > 0.36 && y > 0.45) {
          const f = (y - 0.445) / 0.25;
          b -= 0.002 * Math.exp(-Math.pow((f - 0.5) / 0.07, 2));
        }
        return b;
      },
      maxTriangles: 1900,
    });

    // ------------------------------------------------------------------ posts
    const postAt = (x: number, z: number) =>
      sdf.box([0.055, 0.78, 0.055], 0.014).at(x, 0.66 + 0.39 - 0.0, z);
    const posts = sdf.union(
      ...[
        [0.36, 0.56],
        [-0.36, 0.56],
        [0.36, -0.56],
        [-0.36, -0.56],
      ].map(([x, z]) => postAt(x, z)),
    );
    const armF = sdf.capsule([0.36, 1.0, 0.56], [0.47, 1.0, 0.64], 0.02);
    k.body('posts', posts.union(armF).paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.007,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2),
      maxTriangles: 1200,
    });

    // ------------------------------------------------------------------ awning
    const AW_Y = 1.16;
    const arch = (rx: number, ry: number, len: number) =>
      sdf.cylinder(1, len, 0.01).rotateX(90).scale([rx, ry, 1]).at(0, AW_Y, 0);
    let awning = arch(0.55, 0.32, 1.5)
      .subtract(arch(0.5, 0.27, 1.6))
      .intersect(sdf.box([1.3, 0.5, 1.6]).at(0, AW_Y + 0.25 - 0.06, 0));
    const bites: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 4; i++)
      for (const sx of [-1, 1])
        bites.push(sdf.sphere(0.065).at(sx * 0.545, AW_Y - 0.06, -0.56 + i * 0.375));
    awning = awning.subtract(...bites);
    const RED = rgb('#d9382c');
    const CREAM = rgb('#f3e6cc');
    const awningPaint = (x: number, y: number, z: number) => {
      const band = Math.floor((z + 0.75) / 0.25);
      const c = band % 2 === 0 ? CREAM : RED;
      const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
      return mixRgb(c, WALNUT, 0.06 * n + 0.18 * clamp01((AW_Y - y + 0.06) / 0.2));
    };
    k.body('awning', awning.paintFn(awningPaint), {
      color: '#f3e6cc',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 3000,
    });

    // ------------------------------------------------------------------ cloth bolts
    const bolt = (y: number, z: number, x0: number) =>
      sdf.cylinder(0.065, 0.62, 0.01).rotateZ(90).at(x0, y, z);
    const bolts = [
      ['bolt-red', '#c8302a', bolt(0.525, 0.3, 0)],
      ['bolt-blue', '#2f6aa8', bolt(0.525, 0.44, 0)],
      ['bolt-gold', '#e0bb60', bolt(0.64, 0.37, 0)],
    ] as const;
    for (const [name, col, shape] of bolts)
      k.body(name, shape, { color: col, roughness: 0.85, metalness: 0, detail: 0.006, bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 20, 2), maxTriangles: 500 });

    // ------------------------------------------------------------------ crates
    const crate = (x: number, y: number, z: number) => sdf.box([0.2, 0.17, 0.2], 0.014).at(x, y, z);
    const crates = sdf.union(
      crate(-0.16, BED_TOP + 0.085, -0.32),
      crate(0.12, BED_TOP + 0.085, -0.34),
      crate(-0.03, BED_TOP + 0.255, -0.33).rotateY(0),
    );
    const cratePaint = (x: number, y: number, z: number) => {
      const g = 0.5 + 0.5 * noise.fbm(x * 30, y * 6, z * 30, 2);
      const seam = Math.exp(-Math.pow(((y - BED_TOP) % 0.17) / 0.008, 2));
      return mixRgb(mixRgb(PALE, BROWN, 0.35 + 0.3 * g), WALNUT, 0.4 * seam);
    };
    k.body('crates', crates.paintFn(cratePaint), {
      color: '#c9a06a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2),
      maxTriangles: 900,
    });

    // ------------------------------------------------------------------ lantern
    const lanternC = [0.47, 0.93, 0.64] as const;
    const chain = sdf.capsule([0.47, 1.0, 0.64], [0.47, 0.99, 0.64], 0.008);
    const cage = sdf
      .union(
        sdf.cylinder(0.05, 0.02, 0.008).at(lanternC[0], lanternC[1] + 0.075, lanternC[2]),
        sdf.cylinder(0.045, 0.02, 0.008).at(lanternC[0], lanternC[1] - 0.075, lanternC[2]),
        sdf.torus(0.03, 0.008).at(lanternC[0], lanternC[1] + 0.09, lanternC[2]),
        chain,
      );
    k.body('lantern-frame', cage, { color: IRON, roughness: 0.5, metalness: 0.8, detail: 0.004, maxTriangles: 500 });
    k.body('lantern-glass', sdf.ellipsoid([0.04, 0.06, 0.04]).at(...lanternC), {
      color: '#ffd67a',
      roughness: 0.2,
      metalness: 0,
      emissive: '#ffb84a',
      emissiveIntensity: 0.6,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
