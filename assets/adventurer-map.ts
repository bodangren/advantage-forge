import { addPart, defineAsset } from '../src/index.js';
import { adventurerMap } from './parts/adventurer-map.js';

/**
 * Adventurer map as a standalone item, from the shared part `assets/parts/adventurer-map.ts`, at
 * the exact worn size. Role: equipment pickup and avatar part. Static: no rig, no tint slots.
 * Size: about 0.12 m tall, the drawn face toward +Z, standing on y = 0, the front toward +Z.
 */
export default defineAsset({
  name: 'adventurer-map',
  description: "The adventurer's map at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/adventurer_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, adventurerMap(), { pose: (s) => s.at(0, 0.12, 0), bones: null });
  },
});
