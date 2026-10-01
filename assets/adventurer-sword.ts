import { addPart, defineAsset } from '../src/index.js';
import { adventurerSword } from './parts/adventurer-sword.js';

/**
 * Adventurer sword as a standalone item, from the shared part `assets/parts/adventurer-sword.ts`, at
 * the exact worn size. Role: equipment pickup and avatar part. Static: no rig, no tint slots.
 * Size: about 0.38 m tall on its pommel, blade up, standing on y = 0, the front toward +Z.
 */
export default defineAsset({
  name: 'adventurer-sword',
  description: "The adventurer's sword at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/adventurer_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.103, 0] },

  build(k) {
    addPart(k, adventurerSword(), { pose: (s) => s.rotateZ(180).at(0, 0.103, 0), bones: null });
  },
});
