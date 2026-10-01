import { addPart, defineAsset } from '../src/index.js';
import { warriorSword } from './parts/warrior-sword.js';

/**
 * Warrior sword — the warrior's large two-handed greatsword as a standalone item, from the shared
 * part `assets/parts/warrior-sword.ts`, at the exact worn size (a shop view scales it for display).
 *
 * Role: loot drop, shop icon, and avatar part; the long tapered blade, the guard, and the wrapped
 * grip read at 128 px. Size: 0.21 m wide, 0.92 m tall, standing on its pommel on y = 0, the point
 * up (like the other swords of the set), the flat toward +Z. Static: no rig. No tint slots.
 */

/** The pommel's top in the part frame (local Y); the blade points to -Y. */
const POMMEL = 0.1400;

export default defineAsset({
  name: 'warrior-sword',
  description: 'The warrior\'s large greatsword with a long tapered blade, a cross-guard with horns, and a leather-wrapped grip, standing on its pommel.',
  detail: 0.006,
  reference: 'docs/hero-mockups/warrior_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, POMMEL, 0], twoHanded: true },

  build(k) {
    addPart(k, warriorSword(), { pose: (s) => s.rotateZ(180).at(0, POMMEL, 0), bones: null });
  },
});
