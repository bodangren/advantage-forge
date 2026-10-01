import { addPart, defineAsset } from '../src/index.js';
import { witchHat } from './parts/witch-hat.js';

/**
 * Witch hat as a standalone item, from the shared part `assets/parts/witch-hat.ts`, at its worn size.
 * Role: equipment pickup, shop icon, and avatar part. Static: no rig. Tint slot: band. Lies on its brim, the buckle toward +Z.
 */
export default defineAsset({
  name: 'witch-hat',
  description: "The witch's huge black hat with a purple band and a gold buckle, at its worn size.",
  detail: 0.005,
  reference: 'docs/enemy-mockups/witch_001.jpg',
  variants: { band: { purple: '#7a3aa0', red: '#a83a30', green: '#3a8a3a' } },
  texture: { size: 512 },

  build(k) {
    addPart(k, witchHat(k.tint), { pose: (s) => s.at(0, 0.079, 0), bones: null });
  },
});
