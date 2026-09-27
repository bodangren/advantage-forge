import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — iron wall candle sconce (props/furniture/wall-sconce).
 *
 * Role: warm wall light in the tavern scene; hangs on a wall at ~1.1 m and reads
 *   at 128 px as one dark iron scroll with a single bright flame.
 * Size: ~0.36 m tall, 0.15 m wide, arm reaches ~0.19 m from the wall. The flat
 *   back of the plate lies in the plane z = 0 (the wall sits behind it); the lowest
 *   point is the bottom of the arm loop at y = 0. Faces +Z, centered on the Y axis.
 * One idea: a chunky iron scroll arm curls out of a leafy back plate and holds one
 *   thick candle; the amber flame is the only bright thing on a very dark prop.
 * Shape language: round dominant (curled tube, dished pan, teardrop flame, rounded
 *   plate lobes); square secondary (flat mounting plate, straight candle body).
 * Palette: worn iron #3d4047 / dark #33363c / lit edge #4c515a (dominant, dark);
 *   honey wax #f3d27e / #e5ba57 / #c2923c (secondary, mid); flame #ff9a3c over a
 *   dark #4a1405 base (accent, emissive, the focal point). Dark iron vs bright
 *   flame is the value contrast; the scene metal is pewter, chosen darker here.
 * Materials: worn iron (roughness 0.5, metalness 0.8), beeswax (0.55), burnt wick
 *   (0.85), flame (emissive 1.5). Iron grain + wax mottling in `bump` only.
 * Detail: plate outline + lobed trim, arm scroll, joint boss, dished drip pan;
 *   secondary candle drip ridge + melt top; tertiary wick nub. Focal: the flame.
 * Rig/animation: none (static wall prop).
 */

const IRON = '#3d4047';
const IRON_DARK = '#33363c';
const IRON_LIT = '#4c515a';
const WAX_LIGHT = '#f3d27e';
const WAX_MID = '#e5ba57';
const WAX_DARK = '#c2923c';
const WICK = '#241a10';
const FLAME = '#ff9a3c';
const FLAME_BASE = '#4a1405';

const WALL_Z = 0; // plate back plane
const PLATE_DEPTH = 0.018;
const ARM_K = 0.012;
const PAN_Y = 0.176; // pan base height
const PAN_Z = 0.126; // pan center distance from wall
const CANDLE_Y = 0.184; // candle base height (sits on the pan dish)
const CANDLE_Z = PAN_Z;
const FLAME_Y = 0.309; // flame origin (its base floats above the candle top, on the wick)

export default defineAsset({
  name: 'wall-sconce',
  description:
    'Wall-mounted iron candle sconce: a lobed back plate, a curled scroll arm, a dished drip pan, and one thick lit beeswax candle.',
  detail: 0.007,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/wall-sconce-mock.jpg',

  build(k) {
    const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

    // Soft warm pool the flame casts on nearby iron; kept subtle so studio light
    // does not read it as a second light source.
    const glow = (x: number, y: number, z: number) => {
      const d = Math.hypot(x, y - (FLAME_Y + 0.03), z - CANDLE_Z);
      const t = Math.max(0, 1 - (d - 0.07) / 0.22);
      return t * t;
    };

    // ---------------------------------------------------------------- back plate
    // Leafy, lobed mounting plate: one point up, two side lobes each side, tapering
    // to a rounded foot. Smooth outline gives the soft chibi bevels.
    const plateProfile = profile.polygon(
      [
        [0.0, 0.272],
        [0.026, 0.246],
        [0.058, 0.216], // upper side lobe tip
        [0.034, 0.186], // deep notch
        [0.04, 0.166],
        [0.076, 0.13], // lower side lobe tip
        [0.034, 0.094], // deep notch
        [0.038, 0.06],
        [0.028, 0.034],
        [0.0, 0.018], // rounded foot
        [-0.028, 0.034],
        [-0.038, 0.06],
        [-0.034, 0.094],
        [-0.076, 0.13],
        [-0.04, 0.166],
        [-0.034, 0.186],
        [-0.058, 0.216],
        [-0.026, 0.246],
      ],
      { smooth: true, samples: 4 },
    );
    const plate = sdf
      .extrude(plateProfile, PLATE_DEPTH, 0.006)
      .at(0, 0, WALL_Z + PLATE_DEPTH / 2);
    // Round boss where the arm meets the plate, turned to face the wall normal.
    const boss = sdf.cylinder(0.031, 0.012, 0.004).rotateX(90).at(0, 0.15, 0.03);

    // ---------------------------------------------------------------- curled arm
    // One thick tube out of the plate: dips forward and down, loops at the bottom,
    // then sweeps back up and forward to seat the pan. Reads as an open scroll.
    const arm = sdf.chain(
      [
        [0, 0.15, 0.018, 0.017],
        [0, 0.092, 0.058, 0.016],
        [0, 0.04, 0.09, 0.016],
        [0, 0.016, 0.116, 0.016],
        [0, 0.05, 0.152, 0.0155],
        [0, 0.108, 0.17, 0.0155],
        [0, 0.158, 0.152, 0.016],
        [0, 0.178, 0.128, 0.016],
      ],
      ARM_K,
    );

    // ---------------------------------------------------------------- drip pan
    // Shallow dish: flat floor, upturned rounded rim, slightly dished top so the
    // candle seats low. Solid of revolution.
    const panProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.048, 0.0],
        [0.06, 0.004],
        [0.065, 0.013],
        [0.062, 0.019],
        [0.05, 0.016],
        [0.028, 0.012],
        [0.0, 0.011],
      ],
      { smooth: true, samples: 6 },
    );
    const pan = sdf.revolve(panProfile).at(0, PAN_Y, PAN_Z);

    // ---------------------------------------------------------------- iron body
    const ironPaint = (x: number, y: number, z: number) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
      let c = mixRgb(rgb(IRON_DARK), rgb(IRON_LIT), 0.5 * n);
      // Edges that the flame would catch go a touch warmer.
      c = mixRgb(c, rgb('#6b4a30'), 0.22 * glow(x, y, z));
      return c;
    };
    const iron = sdf
      .smoothUnion(0.012, plate, boss, arm, pan)
      .intersect(sdf.halfSpace([0, 0, -1], WALL_Z)) // keep the plate back dead flat
      .intersect(sdf.halfSpace([0, -1, 0], 0)) // lowest point sits exactly on y = 0
      .paintFn(ironPaint);
    k.body('iron', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.0065,
      paintWeight: 2,
      maxTriangles: 2300,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 34, y * 34, z * 34, 2),
    });

    // ---------------------------------------------------------------- candle
    // Thick stub: straight column, a drip ridge near the top, rounded melt top.
    // Built at its own origin, then moved to the pan.
    const waxProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.03, 0.0],
        [0.031, 0.006],
        [0.03, 0.022],
        [0.029, 0.05],
        [0.0312, 0.072], // drip ridge
        [0.0288, 0.082],
        [0.026, 0.092],
        [0.019, 0.098],
        [0.009, 0.099],
        [0.0, 0.098],
      ],
      { smooth: true, samples: 6 },
    );
    // One fat wax drip running down the front of the stub.
    const drip = sdf.capsule([0.0, 0.093, 0.027], [0.003, 0.058, 0.029], 0.0062);
    const waxShape = sdf.revolve(waxProfile).smoothUnion(0.004, drip);
    const waxPaint = (x: number, y: number, z: number) => {
      const t = clamp01((y - 0.004) / 0.095);
      const grad = mixRgb(rgb(WAX_DARK), rgb(WAX_LIGHT), t * t * (3 - 2 * t));
      const m = noise.fbm(x * 60, y * 40, z * 60, 2) * 0.06;
      return mixRgb(grad, rgb(WAX_LIGHT), Math.max(0, m));
    };
    k.body('wax', waxShape.at(0, CANDLE_Y, CANDLE_Z).paintFn(waxPaint), {
      color: WAX_MID,
      roughness: 0.55,
      metalness: 0,
      detail: 0.0045,
      paintWeight: 2,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 70, y * 50, z * 70, 2),
    });

    // ---------------------------------------------------------------- wick
    // Reaches up from the melt pool so a short dark length shows below the flame.
    const wick = sdf.cone([0, CANDLE_Y + 0.09, CANDLE_Z], [0, FLAME_Y + 0.006, CANDLE_Z], 0.0055, 0.0032);
    k.body('wick', wick, {
      color: WICK,
      roughness: 0.85,
      metalness: 0,
      detail: 0.003,
      maxTriangles: 120,
    });

    // ---------------------------------------------------------------- flame
    // Rounded teardrop: fat belly, tapering tip. Dark base color so the emissive
    // orange stays saturated instead of washing out to peach.
    const flameProfile = profile.polygon(
      [
        [0.0, 0.058],
        [0.011, 0.044],
        [0.019, 0.03],
        [0.024, 0.017],
        [0.026, 0.006],
        [0.021, -0.003],
        [0.011, -0.007],
        [0.0, -0.008],
      ],
      { smooth: true, samples: 6 },
    );
    const flame = sdf.revolve(flameProfile).at(0, FLAME_Y, CANDLE_Z);
    k.body('flame', flame, {
      color: FLAME_BASE,
      roughness: 0.25,
      metalness: 0,
      emissive: FLAME,
      emissiveIntensity: 1.5,
      detail: 0.005,
      maxTriangles: 350,
    });
  },
});
