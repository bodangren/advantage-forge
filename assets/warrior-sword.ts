import { addPart, defineAsset } from '../src/index.js';
import { warriorSword } from './parts/warrior-sword.js';

/**
 * Warrior sword — the warrior's large two-handed greatsword as a standalone item, from the shared
 * part `assets/parts/warrior-sword.ts`, at the exact worn size (a shop view scales it for display).
 *
 * Role: loot drop, shop icon, and avatar part; the long tapered blade, the guard, and the wrapped
 * grip read at 128 px. Size: 0.1 m wide, 0.78 m tall (blade), standing point-down on y = 0, the
 * flat toward +Z. Static: no rig. No tint slots.
 */

/** The tip of the blade in the part frame (local Y coordinate). */
const BLADE_TIP = -0.78;

export default defineAsset({
  name: 'warrior-sword',
  description: 'The warrior\'s large greatsword with a long tapered blade, a cross-guard with horns, and a leather-wrapped grip, standing point-down.',
  detail: 0.006,
  reference: 'docs/hero-mockups/warrior_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, warriorSword(), { pose: (s) => s.at(0, -BLADE_TIP, 0), bones: null });
  },
});
