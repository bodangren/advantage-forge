import { addPart, defineAsset, type sdf } from '../src/index.js';
import { holdPose } from './parts/mage-wand.js';
import { apprenticeWand, apprenticeWandGlow, BUTT_DROP, GRIP, MOUNT, WAND_AXIS } from './parts/apprentice-wand.js';

/**
 * Apprentice wand — the apprentice's training stick with its yellow spark, as a standalone item
 * from `assets/parts/apprentice-wand.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.34 m tall, upright on its
 * butt knob on y = 0, the spark on the tip. Static: no rig, no tint slots.
 */

const stand = (s: sdf.Shape) => holdPose(GRIP, WAND_AXIS).local(s.at(...MOUNT)).at(0, BUTT_DROP, 0);

export default defineAsset({
  name: 'apprentice-wand',
  description: "The apprentice's plain wooden training wand with a small yellow spark on the tip, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/apprentice_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, apprenticeWand(), { pose: stand, bones: null });
    addPart(k, apprenticeWandGlow(), { pose: (s) => s.at(0, 0.198 + BUTT_DROP, 0), bones: null });
  },
});
