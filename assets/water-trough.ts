import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — animal water trough (props/containers/water-trough).
 *
 * Role: background prop in the chibi hamlet; animals drink here. Must read at 128 px.
 * Size: 1.4 m long (X), 0.5 m wide (Z), 0.5 m tall overall; stands on y = 0, faces +Z.
 * One idea: a long open trough of two chunky horizontal honey-oak planks, pale rim
 *   rails, dark iron corner straps with straw studs, calm teal water with lily pads.
 * Shape language: square/sturdy dominant (long box, block legs), round secondary
 *   (rounded edges, soft water surface, pads).
 * Palette: honey oak #b5814a dominant, warm brown #8a5a35 secondary, pale cut wood
 *   #c9a06a rim, dark walnut #6b4226 gaps/shade; iron #4a4f55/#363a3f; water #3fa8c8
 *   (the cool accent); leaf green #5cb85c pads; straw #e0bb60 studs.
 * Materials: wood (roughness 0.82), pale wood rim (0.8), dark leg wood (0.85),
 *   worn iron (0.5, metalness 0.7), straw studs (0.4, metalness 0.6),
 *   water (0.12), pads (0.6). Grain and plank gaps in bump only.
 * Detail: primary trough body + legs; secondary rim rails, iron corner straps, side
 *   plate; tertiary studs, lily pads, plank grain. Focal point: water vs wood contrast.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const OAK_WARM = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const INTERIOR = rgb('#4a2e1a');
const IRON_DARK = rgb('#363a3f');
const STRAW = rgb('#e0bb60');
const WATER = rgb('#3fa8c8');
const WATER_LIGHT = rgb('#7fd0e8');
const LEAF = rgb('#5cb85c');
const LEAF_LIGHT = rgb('#79cc74');

const L = 1.4; // length along X
const W = 0.5; // width along Z
const WALL_BOTTOM = 0.14; // body bottom (legs below)
const RIM_Y = 0.5; // top of the rim

export default defineAsset({
  name: 'water-trough',
  description:
    'Long wooden animal water trough: two honey-oak plank sides, pale rim rails, dark iron corner straps with straw studs, two stout legs, calm teal water with lily pads.',
  detail: 0.006,
  reference: 'docs/item-mockups/water-trough-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ trough body (wood)
    // Solid plank box, hollowed open at the top; dark painted interior.
    const outer = sdf.box([L, RIM_Y - WALL_BOTTOM, W], 0.02).at(0, (RIM_Y + WALL_BOTTOM) / 2, 0);
    const hollow = sdf
      .box([L - 0.09, 0.44, W - 0.09], 0.014)
      .at(0, WALL_BOTTOM + 0.22, 0);
    const bodyC = (WALL_BOTTOM + RIM_Y) / 2;

    // Two horizontal boards per side face, relative to the body bottom edge.
    const BOARD_H = 0.175;
    const plankPaint = (x: number, y: number, z: number) => {
      const v = y - WALL_BOTTOM + 0.005;
      const board = Math.floor(v / BOARD_H);
      const f = v / BOARD_H - board;
      // Dark gap line near each board edge.
      const gap = f < 0.055 || f > 0.945 ? 0.7 : 0;
      const tint = noise.random(board, 5, 2) * 0.3;
      // Grain stretched along the length (x dominates on the long faces).
      const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 48, z * 8 + board * 3, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 4, z * 3.2, 2);
      let c = mixRgb(OAK, OAK_WARM, 0.18 + tint);
      c = mixRgb(c, WALNUT, 0.28 * patch);
      c = mixRgb(c, PALE, 0.16 * grain);
      // Pale sun-lit top edge near the rim.
      c = mixRgb(c, PALE, 0.3 * Math.max(0, Math.min(1, (y - 0.465) / 0.035)));
      c = mixRgb(c, WALNUT, gap);
      return c;
    };
    const plankBump = (x: number, y: number, z: number) => {
      const v = y - WALL_BOTTOM + 0.005;
      const f = v / BOARD_H - Math.floor(v / BOARD_H);
      const gap = f < 0.055 || f > 0.945 ? 1 : 0;
      return -0.0028 * gap + 0.0014 * noise.fbm(x * 24, y * 7, z * 24, 2);
    };
    const body = outer
      .subtract(hollow)
      .paintFn(plankPaint)
      .paintWhere(hollow.round(0.004), INTERIOR, 0.01);
    k.body('body', body, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.007,
      bump: plankBump,
      paintWeight: 2,
      maxTriangles: 1800,
    });

    // ------------------------------------------------------------------ pale rim rails
    // Light cut-wood rails hug the top of both long sides (matches the mockup).
    const rails = sdf
      .box([L + 0.04, 0.055, 0.07], 0.02)
      .at(0, RIM_Y + 0.002, W / 2)
      .mirror('z', 0);
    const railPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 40, z * 6, 2);
      return mixRgb(PALE, OAK, 0.22 * grain + 0.08);
    };
    k.body('rim', rails.paintFn(railPaint), {
      color: '#c9a06a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      bump: (x, y, z) => 0.0013 * noise.fbm(x * 22, y * 6, z * 22, 2),
      maxTriangles: 500,
    });

    // ------------------------------------------------------------------ legs (dark wood)
    // Two stout plank panels near the ends, standing on y = 0.
    const legPaint = (x: number, y: number, z: number) => {
      const v = y + 0.002;
      const board = Math.floor(v / 0.085);
      const f = v / 0.085 - board;
      const gap = f < 0.07 || f > 0.93 ? 0.6 : 0;
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 6, z * 5, 2);
      let c = mixRgb(WALNUT, OAK_WARM, 0.35 + 0.2 * grain);
      c = mixRgb(c, PALE, 0.15 * Math.max(0, Math.min(1, (y - 0.13) / 0.05)));
      c = mixRgb(c, rgb('#3a2210'), gap);
      return c;
    };
    const legs = sdf
      .box([0.075, 0.2, 0.24], 0.018)
      .at(0.55, 0.1, 0)
      .mirror('x', 0);
    k.body('legs', legs.paintFn(legPaint), {
      color: '#6b4226',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 20, y * 20, z * 20, 2),
      maxTriangles: 500,
    });

    // ------------------------------------------------------------------ iron straps + studs
    // Corner straps hug the four vertical edges near the rim; one plate on the front.
    const skin = outer.round(0.009).subtract(outer.round(-0.002));
    const corners = skin.intersect(
      sdf
        .box([0.085, 0.26, 0.085], 0.012)
        .at(L / 2, bodyC + 0.045, W / 2)
        .mirror('x', 0)
        .mirror('z', 0),
    );
    // Small iron plate with rivets on the front face (+Z), the focal fitting.
    const plate = sdf.box([0.2, 0.055, 0.018], 0.008).at(0, bodyC + 0.02, W / 2 + 0.002);
    const plateRivets = sdf.union(
      sdf.sphere(0.012).at(-0.07, bodyC + 0.02, W / 2 + 0.014),
      sdf.sphere(0.012).at(0.07, bodyC + 0.02, W / 2 + 0.014),
    );
    // A band hugging the top of each leg.
    const legSkin = legs.round(0.006).subtract(legs.round(-0.002));
    const legBands = legSkin.intersect(
      sdf.box([0.4, 0.05, 0.34], 0.01).at(0, 0.16, 0),
    );
    const iron = sdf
      .union(corners, plate, plateRivets, legBands)
      .paintFn((x, y, z) => mixRgb(rgb('#4a4f55'), IRON_DARK, 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2)));
    k.body('iron', iron, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      maxTriangles: 1300,
    });
    // Straw-colored round studs at the strap heels (brass-like accent).
    const studs = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) =>
          sdf.sphere(0.016).at(sx * (L / 2 - 0.002), bodyC - 0.075, sz * (W / 2 + 0.018)),
        ),
      ),
    );
    k.body('studs', studs, {
      color: '#e0bb60',
      roughness: 0.4,
      metalness: 0.6,
      detail: 0.004,
      maxTriangles: 250,
    });

    // ------------------------------------------------------------------ water + lily pads
    // Calm surface near the rim; two small pads as a story touch.
    const waterBox = sdf
      .box([L - 0.1, 0.06, W - 0.1], 0.02)
      .at(0, RIM_Y - 0.032, 0);
    const waterPaint = (x: number, y: number, z: number) => {
      // Slightly lighter toward the middle, a soft painterly ripple.
      const r = Math.max(Math.abs(x) / (L / 2), Math.abs(z) / (W / 2));
      const ripple = 0.5 + 0.5 * noise.fbm(x * 9, 0, z * 9, 2);
      let c = mixRgb(WATER, WATER_LIGHT, 0.18 * ripple);
      c = mixRgb(c, WATER_LIGHT, 0.22 * (1 - r * r));
      return c;
    };
    k.body('water', waterBox.paintFn(waterPaint), {
      color: '#3fa8c8',
      roughness: 0.12,
      metalness: 0,
      detail: 0.005,
      bump: (x, _y, z) => 0.0012 * noise.fbm(x * 14, 0, z * 14, 2),
      maxTriangles: 700,
    });
    const pads = sdf.union(
      sdf.cylinder(0.062, 0.012, 0.005).at(-0.32, RIM_Y + 0.003, 0.06),
      sdf.cylinder(0.045, 0.011, 0.005).at(0.18, RIM_Y + 0.002, -0.09),
    );
    k.body(
      'pads',
      pads.paintFn((x, y, z) =>
        mixRgb(LEAF, LEAF_LIGHT, 0.3 + 0.3 * noise.fbm(x * 30, y * 30, z * 30, 2)),
      ),
      { color: '#5cb85c', roughness: 0.6, metalness: 0, detail: 0.004, maxTriangles: 250 },
    );
  },
});
