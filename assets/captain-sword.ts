import { addPart, defineAsset } from '../src/index.js';
import { captainSword } from './parts/captain-sword.js';

/**
 * Captain sword: the captain's longsword as a standalone item, from `assets/parts/captain-sword.ts`,
 * at the worn size. Role: loot, shop icon, avatar part. Size: 0.56 m long, standing on its pommel
 * on y = 0, blade up, flat toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'captain-sword',
  description: "The captain's steel longsword with a flared guard, a dark grip, and a round pommel, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/captain_001.jpg',
  texture: { size: 512 },
  variants: {},
  equip: { slot: 'mainhand', origin: [0, 0.094, 0] },
  build(k) {
    addPart(k, captainSword(), { pose: (s) => s.at(0, 0.094, 0), bones: null });
  },
});
