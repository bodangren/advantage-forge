import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 classroom door, a class A story-page prop.
 * Role: the friendly kindergarten classroom door that Pat waves at (`story-page-hello-i-am-pat`).
 *   A child of about 5 years must read it at one look: a green door with a light frame, a round
 *   knob, and one round window.
 * Size: the door leaf is 0.95 m wide, 2.0 m tall, and 0.05 m thick. The frame is 0.07 m wide on the
 *   two sides and on the top, so the outer size is 1.09 m wide and 2.07 m tall. The knob is 0.08 m
 *   across. The round window is 0.34 m across and sits in the upper half.
 * Place: the frame back sits on the plane z = 0, the frame bottom on the plane y = 0, and the door
 *   is centered on x = 0. The door faces +Z, so a stage puts it flat on a wall with `yaw`.
 * Palette: frame cream `#f3e6c4`; leaf green `#3e9e4f`; knob yellow `#f2c230`; window pale blue
 *   `#cfe8f5`. Each pair of touching colors differs by 0.4 or more in one channel, so the 1-bit
 *   line art draws a stroke at every edge (src/storytime/line-art-pass.ts draws a stroke where the
 *   unlit color jumps by more than 0.2 across 4 px).
 * Materials: matte painted wood, roughness 0.8, no metal, no glass.
 * Bodies: one per color, because a separate body holds one color and the color step at each edge
 *   is exact at every render scale. Vertex colors only (`texture: false`).
 * Detail: no text, letter, number, sign, name plate, logo, handle bar, or face. Shape only.
 * Rig and animation: none.
 */

const CREAM = rgb('#f3e6c4');
const CREAM_SHADE = rgb('#e6d3a6');
const GREEN = rgb('#3e9e4f');
const GREEN_DARK = rgb('#357f42');
const YELLOW = rgb('#f2c230');
const SKY = rgb('#cfe8f5');

const LEAF_W = 0.95;
const LEAF_H = 2.0;
const LEAF_T = 0.05;
const FRAME = 0.07;
const OUTER_W = LEAF_W + FRAME * 2;
/** The leaf back sits a little in front of the frame back, so the leaf never pokes through. */
const LEAF_Z = 0.006;
const LEAF_FRONT = LEAF_Z + LEAF_T;

const WINDOW_R = 0.17;
const WINDOW_Y = 1.48;
const WINDOW_RIM = 0.03;

/** The frame: one slab with the leaf area cut out, so the sides and the head read as one light frame. */
const frameShape = sdf
  .box([OUTER_W, LEAF_H + FRAME, 0.06], 0.008)
  .at(0, (LEAF_H + FRAME) / 2, 0.03)
  .subtract(sdf.box([LEAF_W, LEAF_H, 0.2], 0.004).at(0, LEAF_H / 2, 0.03))
  .paintFn((x, y, _z, base) => {
    const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 70, 0.5, 2);
    return mixRgb(base, mixRgb(CREAM, CREAM_SHADE, 0.12 * grain), 0.9);
  });

/** The green leaf, with an optional round hole for the window. */
const leafShape = (hole: boolean) => {
  const leaf = sdf.box([LEAF_W, LEAF_H, LEAF_T], 0.008).at(0, LEAF_H / 2, LEAF_Z + LEAF_T / 2);
  const drilled = hole
    ? leaf.subtract(
        sdf.cylinder(WINDOW_R, 0.2).rotateX(90).at(0, WINDOW_Y, LEAF_Z + LEAF_T / 2),
      )
    : leaf;
  return drilled.paintFn((x, y, _z, base) => {
    const grain = 0.5 + 0.5 * noise.fbm(x * 18, y * 26, 0.5, 2);
    return mixRgb(base, mixRgb(GREEN, GREEN_DARK, 0.09 * grain), 0.9);
  });
};

/** The pale blue glass: a disc inside the hole, its front 2 mm behind the leaf front. */
const glassShape = sdf
  .cylinder(WINDOW_R + 0.004, 0.03)
  .rotateX(90)
  .at(0, WINDOW_Y, LEAF_FRONT - 0.014);

/** The cream rim around the window: a ring that closes the hole edge and sits proud of the leaf. */
const rimShape = sdf
  .torus(WINDOW_R + WINDOW_RIM / 2, WINDOW_RIM / 2)
  .rotateX(90)
  .at(0, WINDOW_Y, LEAF_FRONT - 0.004);

/** The knob: a round yellow ball 0.08 m across, on the leaf front near the free edge. */
const knobShape = sdf.sphere(0.04).at(LEAF_W / 2 - 0.13, 0.9, LEAF_FRONT + 0.026);

export default defineAsset({
  name: 'storytime-green-door',
  description:
    'A friendly kindergarten classroom door: a green leaf in a light cream frame, with one round pale blue window and a round yellow knob.',
  detail: 0.002,
  texture: false,

  build(k) {
    k.body('frame', frameShape, { color: CREAM, roughness: 0.8, paintWeight: 1, detail: 0.003 });
    k.body('leaf', leafShape(true), { color: GREEN, roughness: 0.8, paintWeight: 1, detail: 0.002 });
    k.body('glass', glassShape, { color: SKY, roughness: 0.7, paintWeight: 1, detail: 0.002 });
    k.body('window-rim', rimShape, { color: CREAM, roughness: 0.8, detail: 0.0015 });
    k.body('knob', knobShape, { color: YELLOW, roughness: 0.5, detail: 0.0015 });
  },
});
