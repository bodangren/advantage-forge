import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 kindergarten table, a class A story-page prop.
 * Role: the low table of a bright kindergarten room in the week 1 pages. A child of about 5 years
 *   must read it at one look: a low wooden table with four bright round legs.
 * Size: the top is 1.0 m by 0.6 m and 0.04 m thick, with rounded corners. The top surface is at
 *   0.48 m, which is the table height for children of about 5 years. Each leg is 0.05 m across.
 * Place: the floor is the plane y = 0, the table is centered on x = 0 and z = 0, and it faces +Z.
 * Palette: top light wood `#e8c48a`; legs red `#d9483b`. The wood and the red differ by 0.49 in the
 *   green channel, so the 1-bit line art draws a crisp stroke where a leg meets the top
 *   (src/storytime/line-art-pass.ts draws a stroke where the unlit color jumps by more than 0.2
 *   across 4 px).
 * Materials: matte painted wood, roughness 0.8, no metal, no glass.
 * Bodies: two, one per color, so the color step at each leg edge is exact at every render scale.
 *   Vertex colors only (`texture: false`, `paintWeight: 1` on the top).
 * Detail: no text, letter, number, logo, drawer, or face. Shape only.
 * Rig and animation: none.
 */

const WOOD = rgb('#e8c48a');
const WOOD_LIGHT = rgb('#f3d6a8');
const RED = rgb('#d9483b');

const TOP_W = 1.0;
const TOP_D = 0.6;
const TOP_T = 0.04;
const TOP_Y = 0.48;
const LEG_R = 0.025;
const LEG_X = 0.4;
const LEG_Z = 0.2;

const topShape = sdf
  .box([TOP_W, TOP_T, TOP_D], 0.018)
  .at(0, TOP_Y - TOP_T / 2, 0)
  .paintFn((x, y, _z, base) => {
    const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 120, 0.5, 2);
    return mixRgb(base, mixRgb(WOOD, WOOD_LIGHT, 0.12 * grain), 0.9);
  });

/** One round leg: it runs from the floor into the top so the joint never shows a gap. */
const legShape = (x: number, z: number) =>
  sdf.cylinder(LEG_R, TOP_Y - TOP_T / 2 + 0.01, 0.004).at(x, (TOP_Y - TOP_T / 2 + 0.01) / 2, z);

export default defineAsset({
  name: 'storytime-low-table',
  description:
    'A low kindergarten table: a light-wood top with rounded corners on four round red legs.',
  detail: 0.002,
  texture: false,

  build(k) {
    k.body('top', topShape, { color: WOOD, roughness: 0.8, paintWeight: 1, detail: 0.002 });
    const legs: Array<[number, number]> = [
      [-LEG_X, -LEG_Z],
      [LEG_X, -LEG_Z],
      [-LEG_X, LEG_Z],
      [LEG_X, LEG_Z],
    ];
    legs.forEach(([x, z], i) => {
      k.body(`leg-${i + 1}`, legShape(x, z), { color: RED, roughness: 0.8, detail: 0.002 });
    });
  },
});
