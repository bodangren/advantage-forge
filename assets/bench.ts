import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — tavern trestle bench (props/furniture/bench).
 *
 * Role: tavern seating for the Chibi Quest tavern set; must read at 128 px as
 *   "one long slab on two trestles".
 * Size: 1.5 m long along X, seat 0.35 m wide, seat top 0.35 m, stands on y = 0, faces +Z.
 * One idea: one thick honey-oak slab floating over two splayed trestle frames.
 * Shape language: chunky rounded slabs and beams (round dominant), soft 0.02 bevels
 *   everywhere, legs splayed for a sturdy stance (square secondary).
 * Palette: honey oak #b5814a seat (light focal), warm brown #8a5a35 trestles,
 *   pale cut wood #c9a06a edge wear + pegs (accent), dark shade #4a2c15 grounded feet.
 * Materials: wood only (roughness 0.8-0.85); grain, wear and feet shading via paintFn,
 *   grain relief via bump only (mesh stays light).
 * Detail: primary seat slab + trestle frames; secondary low stretcher + pegs;
 *   tertiary grain/wear. Focal point: the pale worn top edge of the honey slab.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WEAR = rgb('#c9a06a');
const DARK = rgb('#4a2c15');

const SEAT_TOP = 0.35;
const SEAT_T = 0.06; // chunky plank
const SEAT_BOT = SEAT_TOP - SEAT_T;
const HALF_L = 0.75;
const HALF_W = 0.175;

const TRESTLE_X = 0.52; // frame center inset from the ends (0.23 overhang each end)
const LEG_TOP_Z = 0.085;
const LEG_FOOT_Z = 0.165;
const LEG_TOP_Y = 0.31; // buried 0.02 into the seat underside
const LEG_R_TOP = 0.048;
const LEG_R_FOOT = 0.056;
const RAIL_Y = 0.14; // crossbar + stretcher height (low)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Lengthwise grain shared by paint and bump so dark streaks sit in grooves.
const seatGrain = (x: number, y: number, z: number) =>
  0.5 + 0.5 * noise.fbm(x * 3.5, y * 60, z * 16, 2);

const seatPaint = (x: number, y: number, z: number) => {
  let c = HONEY;
  c = mixRgb(c, DARK, 0.24 * seatGrain(x, y, z));
  // Sun-bleached top face; the bevels wear palest at the perimeter.
  const top = clamp01((y - (SEAT_TOP - 0.012)) / 0.008);
  c = mixRgb(c, WEAR, 0.5 * top);
  const edge = 1 - clamp01(Math.min(HALF_L - Math.abs(x), HALF_W - Math.abs(z)) / 0.055);
  c = mixRgb(c, WEAR, 0.65 * edge * top);
  // Pale cut end grain on the two end faces.
  const end = 1 - clamp01((HALF_L - Math.abs(x)) / 0.014);
  c = mixRgb(c, WEAR, 0.6 * end);
  // Shaded underside.
  const low = clamp01((SEAT_BOT + 0.022 - y) / 0.022);
  c = mixRgb(c, DARK, 0.28 * low);
  return c;
};

const trestlePaint = (x: number, y: number, z: number) => {
  let c = BROWN;
  const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 6, z * 16, 2);
  c = mixRgb(c, DARK, 0.15 * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7, y * 5, z * 7, 2);
  c = mixRgb(c, DARK, 0.12 * patch);
  // Feet darkened where they meet the floor.
  const foot = clamp01((0.16 - y) / 0.16);
  c = mixRgb(c, DARK, 0.42 * foot * foot);
  return c;
};

export default defineAsset({
  name: 'bench',
  description:
    'Long tavern bench: one thick honey-oak plank seat with worn pale edges, on two splayed trestle end frames joined by a low stretcher.',
  detail: 0.006,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ seat
    // One thick plank, soft 0.02 bevel all around.
    const seat = sdf.box([1.5, SEAT_T, 0.35], 0.02).at(0, SEAT_TOP - SEAT_T / 2, 0);
    k.body('seat', seat.paintFn(seatPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => -0.0018 * seatGrain(x, y, z) + 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 2600,
    });

    // -------------------------------------------------------------- trestles
    // Each end frame: a pair of legs splayed outward in Z (and a touch in X),
    // joined by a crossbar. Cone ends are rounded, so the frame is cut flat
    // at y = 0 to stand exactly on the ground.
    const leg = (sx: number, sz: number) =>
      sdf.cone(
        [sx * (TRESTLE_X + 0.02), 0, sz * LEG_FOOT_Z],
        [sx * TRESTLE_X, LEG_TOP_Y, sz * LEG_TOP_Z],
        LEG_R_FOOT,
        LEG_R_TOP,
      );
    const frame = (sx: number) =>
      sdf.union(
        leg(sx, 1),
        leg(sx, -1),
        sdf.box([0.065, 0.06, 0.34], 0.014).at(sx * TRESTLE_X, RAIL_Y, 0),
      );
    // Low stretcher between the end frames, meeting both crossbars.
    const trestles = sdf
      .union(frame(1), frame(-1), sdf.box([1.18, 0.05, 0.05], 0.012).at(0, RAIL_Y, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('trestles', trestles.paintFn(trestlePaint), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * (noise.fbm(x * 16, y * 6, z * 16, 2) - 0.5),
      maxTriangles: 2100,
    });

    // ------------------------------------------------------------------ pegs
    // Joinery story: four pale pegs pinned through the top over each leg.
    const pegs = sdf.union(
      ...[1, -1].flatMap((sx) =>
        [1, -1].map((sz) =>
          sdf.cylinder(0.015, 0.016, 0.003).at(sx * TRESTLE_X, SEAT_TOP + 0.004, sz * LEG_TOP_Z),
        ),
      ),
    );
    k.body('pegs', pegs, {
      color: '#c9a06a',
      roughness: 0.7,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 320,
    });
  },
});
