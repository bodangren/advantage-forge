import { addPart, defineAsset, type sdf } from '../src/index.js';
import { mageWand, mageWandFlame } from './parts/mage-wand.js';

/**
 * Mage wand — the mage's wand and its cyan flame as a standalone item, from the shared parts in
 * `assets/parts/mage-wand.ts`, at the exact worn size (a shop view scales it for display).
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: 0.36 m tall, standing on its butt
 * knob on y = 0; the flame burns upright above the tip. Static: no rig, no tint slots.
 */

/** The knob's lowest point in the wand frame (the grip is the origin). */
const BUTT_Y = -0.084;
/** The flame base: 0.02 m below the tip, as on the mage. */
const FLAME_BASE_Y = 0.15 - 0.02;

const stand = (s: sdf.Shape) => s.at(0, -BUTT_Y, 0);

export default defineAsset({
  name: 'mage-wand',
  description: "The mage's short dark wooden wand with silver bands and a cyan magic flame above the tip, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/mage_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, -BUTT_Y, 0] },

  build(k) {
    addPart(k, mageWand(), { pose: stand, bones: null });
    addPart(k, mageWandFlame(), { pose: (s) => stand(s.at(0, FLAME_BASE_Y, 0)), bones: null });
  },
});
