import { rgb } from '../src/index.js';
import { defineSchoolBag } from './storytime-school-bag.js';

/**
 * Design note — Storytime week 1, Ben's school bag, a picture prop.
 * Role: Ben's own bag, which hangs on a wall hook while he waves (`story-page-hello-i-am-ben`).
 *   It must read at once as the same kind of small child's backpack as Pat's bag, and it must not
 *   read as Pat's bag.
 * Shape and size: the same body, pocket, straps, and grab loop as `storytime-school-bag`
 *   (0.244 m wide, 0.291 m tall with the loop, 0.151 m deep). One difference: no round bump, because
 *   the goal about something moving inside belongs to Pat's bag only.
 * Palette: main body green `#3fa34d`, front pocket orange `#f59a2c`, straps and grab loop dark blue
 *   `#2f4a7a`. Each pair differs by 0.35 or more in one channel, so the 1-bit line art draws a
 *   stroke at every part edge. The green body differs from Ben's blue shirt `#5c94e0` by 0.58 in the
 *   blue channel and from Pat's red bag by 0.6 in the red channel.
 * Materials: matte cloth, roughness 0.85, no metal, no glass.
 * Bodies: four, one per color, vertex colors only (`texture: false`).
 * Detail: no zipper teeth, no stitches, no small buckles, no text, no face. Shape only.
 * Rig and animation: none.
 */

const rgbGreen = rgb('#3fa34d');
const rgbGreenLight = rgb('#4fbf5e');
const rgbGreenDark = rgb('#2f7d3c');
const rgbOrange = rgb('#f59a2c');
const rgbOrangeDark = rgb('#d47c14');
const rgbBlue = rgb('#2f4a7a');
const rgbBlueLight = rgb('#3d5c92');

export default defineSchoolBag({
  name: 'storytime-school-bag-ben',
  description:
    "Ben's school bag: a small child's backpack with a green rounded body, an orange front pocket, and dark blue shoulder straps and grab loop. It has no bump.",
  colors: {
    body: rgbGreen,
    bodyLight: rgbGreenLight,
    bodyDark: rgbGreenDark,
    pocket: rgbOrange,
    pocketDark: rgbOrangeDark,
    strap: rgbBlue,
    strapLight: rgbBlueLight,
  },
  bump: false,
});
