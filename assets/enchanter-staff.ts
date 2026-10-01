import { addPart, defineAsset } from '../src/index.js';
import { enchanterStaff, STAFF_AXIS, STAFF_GRIP } from './parts/enchanter-staff.js';
import { holdPose } from './parts/mage-wand.js';

/**
 * Enchanter staff — the enchanter's walnut staff with a gold collar and knob, as a standalone item
 * at the exact worn size. Role: equipment pickup, shop icon, avatar part. Size: about 0.66 m tall,
 * standing on its foot on y = 0, the knob on top. Static: no rig, no tint slots.
 */
const FOOT = 0.26 + 0.018; // the staff foot below the grip
const { pose } = holdPose([0, 0, 0], [0, 1, 0]);

export default defineAsset({
  name: 'enchanter-staff',
  description: "The enchanter's walnut staff with a gold collar and round gold knob, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/enchanter_001.jpg',
  texture: { size: 512 },
  build(k) {
    const upright = holdPose(STAFF_GRIP, STAFF_AXIS).local;
    // The part is translated by -MOUNT; undo that, turn it upright about the grip, then stand it.
    addPart(k, enchanterStaff(), {
      pose: (s) => pose(upright(s.at(...(STAFF_GRIP.map((v) => Math.round(v * 1024) / 1024) as [number, number, number])))).at(0, FOOT, 0),
      bones: null,
    });
  },
});
