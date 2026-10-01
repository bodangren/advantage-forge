import { addPart, defineAsset } from '../src/index.js';
import { enchanterScroll, enchanterScrollFlame, FLAME_MOUNT, FLAME_YAW } from './parts/enchanter-scroll.js';

/**
 * Enchanter scroll — the enchanter's scroll with its pink flame and sparks, as a standalone item at
 * the exact worn size. Role: equipment pickup, shop icon, avatar part. Size: about 0.56 m tall, the
 * sheet hangs from its roll and stands on its lower edge on y = 0, its face toward +Z, the flame
 * above the roll.
 * Static: no rig, no tint slots.
 */
const ROLL = FLAME_MOUNT; // the roll center (rounded; the host shifts the flame by it)
const DROP = 0.3005; // the roll center above the sheet's lower edge
const FACE = 90; // turns the sheet's face (local +-X) toward +Z

export default defineAsset({
  name: 'enchanter-scroll',
  description: "The enchanter's cream scroll hanging from its roll, with a pink flame and sparks above it.",
  detail: 0.005,
  reference: 'docs/hero-mockups/enchanter_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'offhand', frame: 'body', origin: [0, DROP, 0], rotate: [0, FACE, 0] },
  build(k) {
    addPart(k, enchanterScroll(), { pose: (s) => s.rotateY(FACE).at(0, DROP, 0), bones: null });
    addPart(k, enchanterScrollFlame(), { pose: (s) => s.at(...FLAME_MOUNT).at(-ROLL[0], -ROLL[1], -ROLL[2]).rotateY(-FLAME_YAW).rotateY(FACE).at(0, DROP, 0), bones: null });
  },
});
