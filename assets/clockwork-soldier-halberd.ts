import { addPart, defineAsset } from '../src/index.js';
import { clockworkSoldierHalberd } from './parts/clockwork-soldier-halberd.js';

/**
 * Clockwork soldier halberd — the construct's brass-trimmed halberd as a standalone item, from the
 * shared part `assets/parts/clockwork-soldier-halberd.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 1.03 m tall, standing on the
 * butt of the shaft on y = 0, the blade up, the axe face toward +Z. Static: no rig.
 */

export default defineAsset({
  name: 'clockwork-soldier-halberd',
  description: "The clockwork soldier's halberd: a steel pole, a spike, a crescent axe blade, and brass collars, at its worn size.",
  detail: 0.004,
  reference: 'docs/enemy-mockups/clockwork-soldier_001.jpg',
  texture: { size: 512 },
  variants: {
    metal: { brass: '#9a7a36', iron: '#5a5a60', copper: '#9a5a3a' },
  },

  build(k) {
    // Local frame: the pole runs from -0.26 (the butt) up; the blade flat already faces +Z.
    addPart(k, clockworkSoldierHalberd(k.tint), { pose: (s) => s.at(0, 0.265, 0), bones: null });
  },
});
