import { addPart, defineAsset } from '../src/index.js';
import { witchPotion } from './parts/witch-potion.js';

/**
 * Witch potion as a standalone item, from the shared part `assets/parts/witch-potion.ts`, at its worn size.
 * Role: equipment pickup, shop icon, and avatar part. Static: no rig. No tint slots. Stands on its base.
 */
export default defineAsset({
  name: 'witch-potion',
  description: "The witch's bubbling green potion bottle, at its worn size.",
  detail: 0.005,
  reference: 'docs/enemy-mockups/witch_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'offhand', frame: 'body', origin: [0, 0.05, 0] },

  build(k) {
    addPart(k, witchPotion([0, 0.05, 0]), { pose: (s) => s, bones: null });
  },
});
