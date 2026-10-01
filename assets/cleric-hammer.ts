import { addPart, defineAsset } from '../src/index.js';
import { holdPose } from './parts/mage-wand.js';
import { clericHammer, GRIP, HAFT_AXIS, HAFT_DOWN, MOUNT } from './parts/cleric-hammer.js';

/**
 * Cleric hammer — the cleric's cross-marked warhammer as a standalone item, from the shared part
 * `assets/parts/cleric-hammer.ts`, at the exact worn size (a shop view scales it for display).
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.77 m tall, standing upright on
 * its gold pommel on y = 0, the cross faces toward +Z. Static: no rig, no tint slots.
 */

/** The pommel's lowest point below the grip (the sphere center and its radius). */
const BUTT_Y = HAFT_DOWN + 0.05;

export default defineAsset({
  name: 'cleric-hammer',
  description: "The cleric's long warhammer with an octagonal steel head, gold crosses, a gold spike and pommel, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/cleric_001.png',
  texture: { size: 512 },

  build(k) {
    addPart(k, clericHammer(), { pose: (s) => holdPose(GRIP, HAFT_AXIS).local(s.at(...MOUNT)).at(0, BUTT_Y, 0), bones: null });
  },
});
