import { addPart, defineAsset } from '../src/index.js';
import { adventurerLantern } from './parts/adventurer-lantern.js';

/**
 * Adventurer lantern as a standalone item, from the shared part `assets/parts/adventurer-lantern.ts`, at
 * the exact worn size. Role: equipment pickup and avatar part. Static: no rig, no tint slots.
 * Size: about 0.11 m tall on its base, standing on y = 0, the front toward +Z.
 */
export default defineAsset({
  name: 'adventurer-lantern',
  description: "The adventurer's lantern at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/adventurer_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, adventurerLantern(), { pose: (s) => s.at(0, 0.041, 0), bones: null });
  },
});
