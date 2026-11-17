import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — small A-frame easel (Chibi Sprouts props).
 *
 * Role: an art-corner prop that stands on the floor; must read at 128 px.
 * Size: 0.95 m tall, 0.55 m wide across the front feet, 0.45 m deep at the feet.
 *   It stands on y = 0, is centred on the Y axis, and faces +Z.
 * One idea: a honey-oak A-frame with an empty cream canvas board leaning back on it,
 *   a brush tray with a lip, and one dark iron wing screw at the top joint.
 * Shape language: triangular (the A-frame legs) holding one square plane (the blank
 *   board); the board is the focal point because it is the largest light area.
 * Palette: honey oak #b5814a (legs, tray), warm brown #8a5a35 (grain shade), pale
 *   cut wood #c9a06a (lit edges), cream #efe6d2 (board), canvas shade #d8ccb2, iron
 *   #4a4f55 (plate, screw, wings). Value plan: mid warm wood frame, the light board
 *   as the big calm area, the dark iron as the small accent at the top.
 * Materials: wood (0.82, 0), canvas cloth (0.85, 0), worn iron (0.5, 0.7).
 * Detail list: primary the three legs and the board; secondary the tray and lip, the
 *   top plate, the wing screw; tertiary the wood grain and the canvas edge fold. The
 *   board stays blank: no text, no picture.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const CREAM = rgb('#efe6d2');
const CANVAS_SHADE = rgb('#d8ccb2');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#8b9096');

const DEG = Math.PI / 180;
const LEG_R = 0.018;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The front legs: feet at (+-0.257, 0.018, 0.15), apex at (0, 0.932, 0.02). */
const legX = (y: number): number => 0.257 * (1 - (y - 0.018) / 0.914);
const legZ = (y: number): number => 0.15 - 0.1422 * (y - 0.018);

/** The board: 0.42 x 0.34 m, 0.02 m thick, leaning back 12 degrees on the leg tops. */
const TILT = 12;
const BOARD_CENTRE: [number, number, number] = [0, 0.4844, 0.1234];

const woodPaint = (x: number, y: number, z: number) => {
  // Grain stretched along the legs (down the Y axis, a little along X and Z).
  const g = 0.5 + 0.5 * noise.fbm(x * 30, y * 5, z * 30, 3);
  let c = mixRgb(BROWN, HONEY, 0.45 + 0.4 * g);
  const grain = 0.5 + 0.5 * noise.fbm(x * 70, y * 14, z * 70, 2);
  c = mixRgb(c, PALE, 0.16 * grain);
  c = mixRgb(c, WALNUT, 0.35 * clamp01((0.1 - y) / 0.1)); // shaded feet
  return c;
};

const woodBump = (x: number, y: number, z: number): number => 0.0009 * noise.fbm(x * 45, y * 9, z * 45, 2);

const boardPaint = (x: number, y: number, z: number) => {
  // Coordinates in the board's own frame: the canvas faces +Z.
  const n = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
  let c = mixRgb(CANVAS_SHADE, CREAM, 0.55 + 0.4 * n);
  const ex = 0.21 - Math.abs(x);
  const ey = 0.17 - Math.abs(y);
  const edge = Math.min(ex, ey);
  // A darker turn of the canvas round the stretcher, and a soft inner crease.
  c = mixRgb(c, CANVAS_SHADE, 1 - clamp01((edge - 0.006) / 0.014));
  c = mixRgb(c, mixRgb(CREAM, rgb('#fbf6ea'), 1), 0.25 * clamp01(1 - edge / 0.05));
  return c;
};

const ironPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2);
  let c = mixRgb(IRON_DARK, IRON, 0.4 + 0.5 * n);
  c = mixRgb(c, IRON_HI, 0.18 * clamp01((y - 0.9) / 0.03));
  return c;
};

export default defineAsset({
  name: 'easel',
  description:
    'A small honey-oak A-frame easel, 0.95 m tall, with a blank cream canvas board leaning back on it, a brush tray with a front lip, and a dark iron wing screw at the top joint.',
  detail: 0.009,
  texture: { size: 1024 },

  build(k) {
    const apex: [number, number, number] = [0, 0.932, 0.02];
    const footY = LEG_R;
    const legs = sdf.union(
      sdf.capsule([-0.257, footY, 0.15], apex, LEG_R),
      sdf.capsule([0.257, footY, 0.15], apex, LEG_R),
      sdf.capsule([0, 0.925, -0.002], [0, footY, -0.264], LEG_R),
    );

    // The brush tray, with a raised lip along its front edge.
    const tray = sdf.box([0.46, 0.018, 0.2], 0.004).at(0, 0.306, 0.08);
    const lip = sdf.box([0.46, 0.042, 0.016], 0.004).at(0, 0.336, 0.172);
    // Two small blocks that carry the tray on the legs.
    const blocks = sdf.union(
      sdf.box([0.03, 0.03, 0.05], 0.004).at(-0.19, 0.285, 0.08),
      sdf.box([0.03, 0.03, 0.05], 0.004).at(0.19, 0.285, 0.08),
    );

    const wood = sdf.smoothUnion(0.004, legs, tray, lip, blocks).paintFn(woodPaint);
    k.body('wood', wood, { color: '#b5814a', roughness: 0.82, metalness: 0, detail: 0.009, bump: woodBump });

    // The blank canvas board, leaning back on the leg tops.
    const board = sdf
      .box([0.42, 0.34, 0.02], 0.005)
      .paintFn(boardPaint)
      .rotateX(-TILT)
      .at(...BOARD_CENTRE);
    k.body('board', board, {
      color: '#efe6d2',
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      textureDensity: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // The iron top plate and the wing screw that tightens the joint.
    const plate = sdf.box([0.044, 0.05, 0.013], 0.004).at(0, 0.872, 0.039);
    const shaft = sdf.cylinder(0.0045, 0.03, 0.001).rotateX(90).at(0, 0.872, 0.055);
    const hub = sdf.cylinder(0.0072, 0.012, 0.002).rotateX(90).at(0, 0.872, 0.068);
    const wings = sdf
      .union(
        sdf.ellipsoid([0.019, 0.0062, 0.0045]).at(0.017, 0, 0),
        sdf.ellipsoid([0.019, 0.0062, 0.0045]).at(-0.017, 0, 0),
      )
      .rotateZ(28)
      .at(0, 0.872, 0.068);
    k.body('iron', sdf.smoothUnion(0.003, plate, shaft, hub, wings).paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0035,
    });
  },
});
