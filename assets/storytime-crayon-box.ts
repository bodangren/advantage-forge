import { defineAsset, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 crayon box, a class A story-page prop.
 * Role: the box of crayons on the low table in the week 1 row `may` ("May ... waves with both
 *   hands at a low table with a box of crayons"). A child of about 5 years must read crayons at
 *   one look from a table-level camera at page size.
 * One idea: an open blue box with five jumbo crayons standing in a row, each a bright color with a
 *   blunt cone tip.
 * Size: the box is 0.20 m wide, 0.10 m deep, and 0.07 m tall with 0.008 m walls. The crayons are
 *   0.026 m across and 0.12 m tall, so 0.05 m of each crayon stands above the box rim. The gap
 *   between two crayons is 0.0115 m. The box sits on the plane y = 0, is centered on x = 0, and
 *   faces +Z.
 * Line art: `texture: false` and one flat body for each color, so every edge is a hard color step.
 *   Each pair of touching colors differs by 0.3 or more in one channel (0 to 1), so the 1-bit line
 *   art (src/storytime/line-art-pass.ts) draws one closed stroke around every color area: red
 *   against yellow, yellow against green, green against orange, orange against purple, every
 *   crayon against blue, and the dark blue floor against the blue walls.
 * Size on the page: the narrowest feature is the 0.0115 m gap between two crayons, which is 5.7
 *   percent of the box width, so no feature becomes a blob.
 * Materials: matte cardboard box and matte wax, roughness 0.8, no metal, no glass.
 * Detail: no text, letter, number, logo, or face on the box. Shape and color only.
 * Rig and animation: none.
 */

const BOX = rgb('#3d7bd9');
const BOX_FLOOR = rgb('#1d3f73');
const RED = rgb('#d9483b');
const YELLOW = rgb('#f2c230');
const GREEN = rgb('#4caf50');
const ORANGE = rgb('#f59a2c');
const PURPLE = rgb('#8e5bc9');

const CRAYON_R = 0.013;
const FLOOR_Y = 0.01;
const CRAYON_X = [-0.075, -0.0375, 0, 0.0375, 0.075];
const CRAYON_COLOR = [RED, YELLOW, GREEN, ORANGE, PURPLE];
const CRAYON_NAME = ['crayon-red', 'crayon-yellow', 'crayon-green', 'crayon-orange', 'crayon-purple'];

/**
 * The box: four walls of full height, all one blue body, its base on y = 0. The walls alone carry
 * the outer faces, so no two faces are coplanar and the box shows no seam at its base.
 */
const boxShell = sdf.union(
  sdf.box([0.2, 0.07, 0.008], 0.002).at(0, 0.035, 0.046),
  sdf.box([0.2, 0.07, 0.008], 0.002).at(0, 0.035, -0.046),
  sdf.box([0.008, 0.07, 0.084], 0.002).at(-0.096, 0.035, 0),
  sdf.box([0.008, 0.07, 0.084], 0.002).at(0.096, 0.035, 0),
);

/** The inner floor: a dark blue plate whose edges sit 2 mm inside the walls, so it is buried. */
const boxFloor = sdf.box([0.19, 0.01, 0.086], 0.001).at(0, FLOOR_Y / 2, 0);

/**
 * One crayon: a wax cylinder, a short blunt cone tip, and a rounded point, on the inner floor. The
 * cone is 0.006 m tall on a 0.026 m body, so the tip reads as a crayon tip and not as a pencil.
 */
const crayon = (x: number) =>
  sdf
    .smoothUnion(
      0.003,
      sdf.cylinder(CRAYON_R, 0.106).at(x, FLOOR_Y + 0.053, 0),
      sdf.cone([x, FLOOR_Y + 0.106, 0], [x, FLOOR_Y + 0.116, 0], CRAYON_R, 0.0045),
    )
    .smoothUnion(0.002, sdf.sphere(0.0045).at(x, FLOOR_Y + 0.116, 0));

export default defineAsset({
  name: 'storytime-crayon-box',
  description:
    'A child\'s open blue crayon box with five jumbo crayons in red, yellow, green, orange, and purple.',
  detail: 0.0015,
  texture: false,

  build(k) {
    k.body('box', boxShell, { color: BOX, roughness: 0.8, detail: 0.0015 });
    k.body('box-floor', boxFloor, { color: BOX_FLOOR, roughness: 0.8, detail: 0.0012 });
    CRAYON_X.forEach((x, i) => {
      k.body(CRAYON_NAME[i], crayon(x), {
        color: CRAYON_COLOR[i],
        roughness: 0.6,
        detail: 0.0012,
      });
    });
  },
});
