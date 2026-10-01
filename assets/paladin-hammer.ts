import { addPart, defineAsset } from '../src/index.js';
import { paladinHammer } from './parts/paladin-hammer.js';

/**
 * Paladin hammer: the paladin's war hammer as a standalone item, from the shared part
 * `assets/parts/paladin-hammer.ts`, at the exact worn size.
 *
 * Role: loot drop, shop icon, and avatar part. Size: about 0.5 m tall (haft 0.4 m, head 0.25 m
 * across), lying upright on y = 0, the front toward +Z. Static: no rig. No tint slots.
 */

/** The haft butt knob bottom in the part frame. */
const BOTTOM_Y = -0.123;

export default defineAsset({
  name: 'paladin-hammer',
  description: "The paladin's steel war hammer with gold bands and a wooden haft, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/paladin_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, -BOTTOM_Y, 0] },

  build(k) {
    addPart(k, paladinHammer(), { pose: (s) => s.at(0, -BOTTOM_Y, 0), bones: null });
  },
});
