import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 wall hook rail, a class A story-page prop.
 * Role: the kindergarten coat hook that Ben's school bag hangs on (`story-page-hello-i-am-ben`).
 *   A child of about 5 years must read it at one look: a short wooden rail on a wall with three
 *   colored pegs.
 * Size: the board is 0.60 m wide, 0.08 m tall, and 0.025 m thick. The three pegs stick out 0.048 m
 *   from the board front and each knob is 0.025 m across. The board back sits on the plane z = 0 and
 *   the board bottom sits on the plane y = 0, so the stage lifts the rail with `y` and puts it flat
 *   on a wall. The rail is centered on x = 0.
 * Peg height: the peg axis is 0.04 m above the board bottom. With the board bottom at 0.58 m, a
 *   five-year-old reaches the pegs at 0.62 m.
 * One idea: a plain wooden rail with three round-tipped pegs in three bright colors.
 * Palette: board light wood `#e8c48a`; pegs blue `#3d7bd9`, yellow `#f2c230`, green `#4caf50`. Each
 *   peg color differs from the board color by 0.35 or more in one channel, so the 1-bit line art
 *   draws a stroke at every peg edge (src/storytime/line-art-pass.ts draws a stroke where the unlit
 *   color jumps by more than 0.2 across 4 px).
 * Materials: matte painted wood, roughness 0.8, no metal, no glass.
 * Bodies: four, one per color, because a separate body holds one color and the color step at each
 *   peg is exact at every render scale. Vertex colors only (`texture: false`), because the texture
 *   bake left black specks on thin parts in rounds 34 to 36.
 * Detail: no text, letter, number, logo, name label, or face. Shape only.
 * Rig and animation: none.
 */

const WOOD = rgb('#e8c48a');
const WOOD_LIGHT = rgb('#f3d6a8');
const BLUE = rgb('#3d7bd9');
const YELLOW = rgb('#f2c230');
const GREEN = rgb('#4caf50');

const PEG_Y = 0.04;
const PEG_X = [-0.17, 0, 0.17];

/** The board: a short slab with soft edges, its back on z = 0 and its bottom on y = 0. */
const boardShape = sdf
  .box([0.6, 0.08, 0.025], 0.006)
  .at(0, 0.04, 0.0125)
  .paintFn((x, y, _z, base) => {
    const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 90, 0.5, 2);
    const shade = 0.1 * grain + 0.06 * Math.max(0, (y - 0.04) / 0.04);
    return mixRgb(base, mixRgb(WOOD, WOOD_LIGHT, shade), 0.9);
  });

/** One peg: a stubby shaft from inside the board, with a round knob on its end. */
const peg = (x: number) =>
  sdf.smoothUnion(
    0.006,
    sdf.capsule([x, PEG_Y, 0.012], [x, PEG_Y, 0.055], 0.011),
    sdf.sphere(0.0125).at(x, PEG_Y, 0.06),
  );

const pegColor = (x: number) => (x < 0 ? BLUE : x > 0 ? GREEN : YELLOW);

export default defineAsset({
  name: 'storytime-wall-hook',
  description:
    'A kindergarten wall hook rail: a short light-wood board with three round-tipped pegs in blue, yellow, and green.',
  detail: 0.0015,
  texture: false,

  build(k) {
    k.body('board', boardShape, { color: WOOD, roughness: 0.8, paintWeight: 1, detail: 0.0015 });
    PEG_X.forEach((x) => {
      const color = pegColor(x);
      const name = color === BLUE ? 'peg-blue' : color === YELLOW ? 'peg-yellow' : 'peg-green';
      k.body(name, peg(x), {
        color,
        roughness: 0.8,
        paintWeight: 1,
        detail: 0.0012,
      });
    });
  },
});
