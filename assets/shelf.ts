import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — standing bottle shelf for behind the tavern bar (props/furniture/shelf).
 *
 * Role: background furniture prop; bottles and mugs (separate assets) sit on its boards.
 *   Must read at 128 px as a tall dark frame with three pale boards.
 * Size: 1.3 m wide (X, centered), 1.5 m tall (Y, stands on y = 0), 0.3 m deep
 *   (Z, back face at z = 0, front faces +Z). Built EMPTY.
 * One idea: a chunky dark-walnut frame with a slight top overhang, holding three
 *   glowingly pale honey-oak boards against a dark plank back.
 * Shape language: square and sturdy (dominant); soft bevels on every edge (secondary).
 * Palette: dark walnut #6b4226 + deep #54331d frame and back (dark),
 *   honey oak #b5814a shelf boards with pale cut wood #c9a06a wear (light).
 * Materials: walnut wood (roughness 0.8), oak wood (roughness 0.78),
 *   dark plank back (roughness 0.85). Grain and plank gaps in `bump` only.
 * Detail: primary frame + 3 boards + back panel; secondary plinth + foot trim +
 *   board front lips; tertiary grain and wear in paint/bump. No focal point (empty).
 * Rig/animation: none (static prop).
 */

const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const OAK = rgb('#b5814a');
const OAK_PALE = rgb('#c9a06a');

// ---------------------------------------------------------------- layout
const W = 1.3; // total width
const H = 1.5; // total height
const D = 0.3; // total depth, back face at z = 0
const SIDE_T = 0.06; // side board thickness
const SIDE_X = W / 2 - SIDE_T / 2; // 0.62, side board centers
const INNER_W = W - 2 * SIDE_T; // 1.18, width between the sides

const TOP_T = 0.07; // top board thickness
const TOP_Y = H - TOP_T / 2; // 1.465, top surface flush at 1.5

const PLINTH_H = 0.14; // plinth height (bottom compartment floor)
const BACK_T = 0.03; // back panel thickness

const SHELF_T = 0.045; // shelf board thickness
const SHELF_Y = [0.45, 0.78, 1.09]; // shelf board centers (even ~0.3 gaps)
const SHELF_D = 0.25; // shelf depth, front edge set back from the frame front
const SHELF_Z = BACK_T + SHELF_D / 2; // 0.155

const LIP_H = 0.035; // raised front lip on each shelf board
const LIP_D = 0.025;

export default defineAsset({
  name: 'shelf',
  description:
    'Standing bottle shelf: dark walnut frame with an overhanging top, three pale oak boards with front lips, and a dark vertical-plank back. Built empty.',
  detail: 0.008,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ frame
    // Two side boards, an overhanging top, a recessed plinth, and a proud foot
    // trim that grounds the piece. One walnut body, softly blended.
    const sideL = sdf.box([SIDE_T, H, D], 0.012).at(-SIDE_X, H / 2, D / 2);
    const sideR = sdf.box([SIDE_T, H, D], 0.012).at(SIDE_X, H / 2, D / 2);
    // Top board: overhangs the sides by 0.04 and the front by 0.03.
    const top = sdf.box([W + 0.08, TOP_T, D + 0.04], 0.015).at(0, TOP_Y, D / 2 + 0.01);
    // Plinth between the sides with a toe-kick recess at the front.
    const plinth = sdf
      .box([INNER_W, PLINTH_H, 0.26], 0.01)
      .at(0, PLINTH_H / 2, 0.01 + 0.13);
    // Foot trim: full footprint, slightly proud, so the base reads chunky.
    const foot = sdf.box([W, 0.06, D], 0.012).at(0, 0.035, D / 2);
    const frameShape = sdf.smoothUnion(0.012, sideL, sideR, top, plinth, foot);

    const framePaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.noise3(x * 26, y * 4, z * 26);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      let c = mixRgb(WALNUT, WALNUT_DEEP, 0.12 + 0.34 * grain);
      c = mixRgb(c, WALNUT, 0.18 * patch);
      // Damp, darker footing grounds the piece.
      const d = Math.max(0, 1 - y / 0.45);
      c = mixRgb(c, WALNUT_DEEP, d * d * 0.45);
      // Sun-worn top surface of the top board.
      const t = Math.max(0, (y - (H - TOP_T)) / TOP_T);
      c = mixRgb(c, OAK, t * 0.14 * (0.4 + 0.6 * patch));
      return c;
    };
    k.body('frame', frameShape.paintFn(framePaint), {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 22, y * 4, z * 22, 2),
      maxTriangles: 2500,
    });

    // ------------------------------------------------------------------ shelves
    // Three honey-oak boards with a small raised lip on each front edge.
    const boards = SHELF_Y.map((y) => {
      const board = sdf.box([INNER_W, SHELF_T, SHELF_D], 0.01).at(0, y, SHELF_Z);
      const lipTop = y + SHELF_T / 2;
      const lip = sdf
        .box([INNER_W, LIP_H, LIP_D], 0.01)
        .at(0, lipTop - 0.005 + LIP_H / 2, BACK_T + SHELF_D - LIP_D / 2);
      return sdf.smoothUnion(0.01, board, lip);
    });
    const shelvesShape = sdf.smoothUnion(0.008, ...boards);

    const shelfPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.noise3(x * 7, y * 34, z * 7);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      let c = mixRgb(OAK, OAK_PALE, 0.06 + 0.18 * grain);
      c = mixRgb(c, OAK, 0.15 * patch);
      // Pale wear along the front lips where bottles slide on and off.
      const lip = Math.max(0, Math.min(1, (z - 0.23) / 0.05));
      c = mixRgb(c, OAK_PALE, lip * 0.35);
      // Soft shade under each board so the gaps read at 128 px.
      return c;
    };
    k.body('shelves', shelvesShape.paintFn(shelfPaint), {
      color: '#b5814a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 8, y * 34, z * 8, 2),
      maxTriangles: 2000,
    });

    // ------------------------------------------------------------------ back panel
    // Dark vertical planks between the sides, from the plinth to under the top.
    const BACK_Y0 = PLINTH_H;
    const BACK_Y1 = H - TOP_T;
    const backShape = sdf
      .box([INNER_W, BACK_Y1 - BACK_Y0, BACK_T], 0.008)
      .at(0, (BACK_Y0 + BACK_Y1) / 2, BACK_T / 2);

    const PLANKS = 9;
    const backPaint = (x: number, y: number, z: number) => {
      const u = ((x + INNER_W / 2) / INNER_W) * PLANKS;
      const idx = Math.floor(u);
      const f = u - idx;
      const tint = noise.random(idx, 11, 5);
      const grain = 0.5 + 0.5 * noise.noise3(x * 42, y * 4, z * 42);
      let c = mixRgb(WALNUT, WALNUT_DEEP, 0.25 + 0.35 * tint);
      c = mixRgb(c, WALNUT, 0.22 * grain);
      // Dark seams between planks.
      const e = Math.min(f, 1 - f);
      const seam = e < 0.07 ? 1 - e / 0.07 : 0;
      c = mixRgb(c, WALNUT_DEEP, 0.75 * seam);
      return c;
    };
    k.body('back', backShape.paintFn(backPaint), {
      color: '#54331d',
      roughness: 0.85,
      metalness: 0,
      detail: 0.01,
      bump: (x, y, z) => {
        const u = ((x + INNER_W / 2) / INNER_W) * PLANKS;
        const f = u - Math.floor(u);
        const e = Math.min(f, 1 - f);
        const seam = e < 0.07 ? 1 - e / 0.07 : 0;
        return -0.0022 * seam + 0.0012 * noise.fbm(x * 40, y * 5, z * 40, 2);
      },
      maxTriangles: 1200,
    });
  },
});
