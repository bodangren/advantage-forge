import { addPart, defineAsset } from '../src/index.js';
import { paladinShield } from './parts/paladin-shield.js';

/**
 * Paladin shield: the paladin's gold-rimmed heater shield with a sun as a standalone item, from
 * the shared part `assets/parts/paladin-shield.ts`, at the exact worn size.
 *
 * Role: loot drop, shop icon, and avatar part. Size: 0.25 m wide, 0.45 m tall, standing on its
 * point on y = 0, the face toward +Z. Static: no rig. No tint slots.
 */

/** The point of the heater in the part frame. */
const POINT_Y = -0.24;

export default defineAsset({
  name: 'paladin-shield',
  description: "The paladin's heater shield with a pearl field, a gold rim, and a raised gold sun, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/paladin_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'offhand', hold: 'shield', origin: [0, -POINT_Y, 0] },

  build(k) {
    addPart(k, paladinShield(), { pose: (s) => s.at(0, -POINT_Y, 0), bones: null });
  },
});
