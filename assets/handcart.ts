import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - handcart (vehicles/land/handcart).
 *
 * Role: small parked hand cart in market and village scenes; reads at 128 px
 *   as a chunky plank box on two big spoked wheels with sacks and a crate.
 * Size: box 1.0 (Z) x 0.5 (X) x 0.3 m, wheels r 0.32, about 1.4 m long,
 *   0.9 m wide, 1.0 m tall; stands on both wheels and the front prop leg;
 *   pushing handles reach back toward -Z and up to 0.9 m.
 * One idea: an oversized-wheel plank box with fat knobbed handles and a
 *   pale burlap heap that breaks the top of the silhouette.
 * Shape language: square (planks, crate) with round secondary (wheels, sacks).
 * Palette: honey oak #b5814a, brown #8a5a35, walnut #6b4226, pale #c9a06a,
 *   iron #4a4f55, burlap #d8c060 (yellow, as in the mockup).
 * Materials: wood, worn iron, burlap, crate wood.
 * Detail: planks, wheels, handles, leg, sacks, crate; seams in bump/paint.
 * Rig/animation: none.
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const BURLAP = rgb('#d9b24c');
const BURLAP_DARK = rgb('#a88a3c');

const AXLE_Y = 0.32;
const RIM_R = 0.27;
const RIM_T = 0.05;
const WHEEL_X = 0.4;
const FLOOR_TOP = 0.36;
const RIM_TOP = 0.66;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'handcart',
  description:
    'A small two-wheeled handcart: shallow plank box on two spoked wheels, two knobbed push handles behind, a front prop leg, three burlap sacks and a wooden crate.',
  detail: 0.007,
  reference: 'docs/vehicle-mockups/handcart-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // wheels
    const rim = sdf.torus(RIM_R, RIM_T).rotateZ(90);
    const hub = sdf.cylinder(0.065, 0.1, 0.012).rotateZ(90);
    const spokes: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 6; i++)
      spokes.push(sdf.capsule([0, 0.05, 0], [0, RIM_R - 0.04, 0], 0.02).rotateX(i * 60));
    const wheel = sdf
      .smoothUnion(0.012, rim, hub, ...spokes)
      .at(WHEEL_X, AXLE_Y, 0)
      .mirror('x', 0);
    const wheelPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(y - AXLE_Y, z);
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      let c = mixRgb(BROWN, PALE, 0.12 * grain);
      c = mixRgb(c, WALNUT, 0.4 * clamp01((r - 0.22) / 0.1));
      c = mixRgb(c, OAK, 0.4 * clamp01((0.08 - r) / 0.08));
      return c;
    };
    k.body('wheels', wheel.paintFn(wheelPaint), {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 2200,
    });

    // iron: axle, hub caps, handle brackets
    const axle = sdf.cylinder(0.024, 0.9, 0.005).rotateZ(90).at(0, AXLE_Y, 0);
    const cap = sdf.cylinder(0.05, 0.03, 0.006).rotateZ(90).at(WHEEL_X + 0.06, AXLE_Y, 0);
    const bracket = sdf.box([0.11, 0.12, 0.07], 0.012).at(0.2, 0.47, -0.5);
    k.body('iron-work', sdf.union(axle, cap.mirror('x', 0), bracket.mirror('x', 0)), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.005,
      maxTriangles: 800,
    });

    // bed, handles, leg
    const floorBoard = sdf.box([0.5, 0.06, 1.0], 0.014).at(0, FLOOR_TOP - 0.03, 0);
    const sideL = sdf.box([0.05, 0.3, 1.0], 0.014).at(-0.25, RIM_TOP - 0.15, 0);
    const back = sdf.box([0.5, 0.3, 0.05], 0.014).at(0, RIM_TOP - 0.15, -0.475);
    const front = sdf.box([0.5, 0.3, 0.05], 0.014).at(0, RIM_TOP - 0.15, 0.475);
    const axleBlock = sdf.box([0.1, 0.1, 0.16], 0.012).at(0.2, AXLE_Y + 0.05, 0);
    const T12 = Math.tan((12 * Math.PI) / 180);
    const handle = sdf.capsule([0.2, 0.45, -0.4], [0.2, 0.45 + 0.54 * T12, -0.94], 0.045);
    const leg = sdf.capsule([0.18, 0.4, 0.4], [0.18, 0.04, 0.4 + 0.36 * 0.268], 0.04);
    const bed = sdf.smoothUnion(
      0.014,
      floorBoard,
      sideL.mirror('x', 0),
      back,
      front,
      axleBlock.mirror('x', 0),
      handle.mirror('x', 0),
      leg.mirror('x', 0),
    );
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 6, z * 20, 2);
      let c = mixRgb(OAK, PALE, 0.1 * grain);
      const isBox = y > 0.35 && y < RIM_TOP + 0.01 && z > -0.5 && z < 0.5;
      if (isBox) {
        const band = Math.floor((y - 0.36) / 0.1);
        if (band % 2 !== 0) c = rgb('#a06e3e');
        if (Math.abs(x) > 0.26) {
          for (const nz of [-0.3, -0.1, 0.1, 0.3])
            if ((y - 0.51) ** 2 + (z - nz) ** 2 < 0.00035) c = mixRgb(c, WALNUT, 0.9);
        }
        c = mixRgb(c, PALE, 0.25 * clamp01((y - 0.63) / 0.03));
      }
      if (z < -0.5 || z > 0.5) c = mixRgb(c, BROWN, 0.35);
      c = mixRgb(c, WALNUT, 0.35 * clamp01(1 - y / 0.2));
      return c;
    };
    k.body('bed', bed.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => {
        let b = 0.0008 * noise.fbm(x * 28, y * 8, z * 28, 2);
        if (y > 0.35 && y < RIM_TOP + 0.01 && z > -0.5 && z < 0.5)
          b += 0.003 * (Math.floor((y - 0.36) / 0.1) % 2 !== 0 ? 0 : 1);
        return b;
      },
      maxTriangles: 2500,
    });

    k.body(
      'knobs',
      sdf.sphere(0.06).at(0.2, 0.45 + 0.54 * Math.tan((12 * Math.PI) / 180) + 0.01, -0.96).mirror('x', 0),
      { color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 500 },
    );

    // crate
    const crate = sdf.box([0.36, 0.26, 0.3], 0.02).at(0.0, 0.6, -0.27);
    const cratePaint = (x: number, y: number, z: number) => {
      const g = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
      let c = mixRgb(BROWN, PALE, 0.15 * g);
      if (Math.abs(Math.abs(x) - 0.155) < 0.025) c = mixRgb(c, WALNUT, 0.85);
      return c;
    };
    k.body('crate', crate.paintFn(cratePaint), {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 26, y * 10, z * 26, 2),
      maxTriangles: 700,
    });

    // sacks
    const sack = (x: number, y: number, z: number, s: number, tilt: number) => {
      const body = sdf.sphere(0.2).scale([1, 0.85, 1]);
      const neck = sdf.cylinder(0.07, 0.08, 0.02).at(0, 0.17, 0);
      const knot = sdf.sphere(0.05).at(0, 0.24, 0);
      return sdf
        .smoothUnion(0.03, body, neck, knot)
        .scale(s)
        .rotateZ(tilt)
        .at(x, y, z);
    };
    const sacks = sdf.smoothUnion(
      0.004,
      sack(0.0, 0.5, 0.34, 0.8, 4),
      sack(0.0, 0.5, 0.04, 0.8, -4),
      sack(0.06, 0.74, 0.1, 0.72, 12),
    );
    const sackPaint = (x: number, y: number, z: number) => {
      const weave = 0.5 + 0.5 * noise.fbm(x * 34, y * 34, z * 34, 2);
      let c = mixRgb(BURLAP, BURLAP_DARK, 0.1 + 0.3 * weave);
      c = mixRgb(c, BURLAP_DARK, 0.4 * clamp01((0.6 - y) / 0.12));
      return c;
    };
    k.body('sacks', sacks.paintFn(sackPaint), {
      color: '#d9b24c',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 22, y * 22, z * 22, 2),
      maxTriangles: 1800,
    });
  },
});
