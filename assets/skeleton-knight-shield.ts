import { addPart, defineAsset } from '../src/index.js';
import { skeletonKnightShield } from './parts/skeleton-knight-shield.js';

/**
 * Skeleton knight shield — the skeleton knight's battered kite shield as a standalone item, from
 * the shared part `assets/parts/skeleton-knight-shield.ts`, at the exact worn size (a shop view
 * scales it for display).
 *
 * Role: loot drop, shop icon, and avatar part; the kite outline, the worn rim, the chip, and the
 * gash read at 128 px. Size: 0.29 m wide, 0.40 m tall, standing on its point on y = 0, the face
 * toward +Z. Static: no rig. The armor slot takes the skeleton knight's metal colors.
 */

/** The point of the kite in the part frame, with the dents. */
const POINT_Y = -0.238;

export default defineAsset({
  name: 'skeleton-knight-shield',
  description: "The skeleton knight's battered iron kite shield with a worn rim, a chipped edge, a sword gash, and rivets, at its worn size.",
  detail: 0.005,
  reference: 'docs/enemy-mockups/skeleton-knight_001.jpg',
  texture: { size: 512 },
  variants: {
    armor: { iron: '#4a4f55', rusted: '#6b4a36', bronze: '#7a6436' },
  },

  build(k) {
    addPart(k, skeletonKnightShield(k.tint), { pose: (s) => s.at(0, -POINT_Y, 0), bones: null });
  },
});
