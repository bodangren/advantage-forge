import { addPart, defineAsset } from '../src/index.js';
import { holdPose } from './parts/mage-wand.js';
import { druidStaff, druidStaffLantern, GRIP, L_DOWN, LANTERN_MOUNT, STAFF_AXIS, STAFF_MOUNT } from './parts/druid-staff.js';

/**
 * Druid staff — the druid's mossy gnarled staff with a crook mushroom on top and a lantern on its
 * hook, as a standalone item, from the shared part `assets/parts/druid-staff.ts`, at its worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.8 m tall, standing upright on
 * its foot on y = 0, the crook mushroom on top, the lantern hanging from the hook. Static: no rig.
 */
const FOOT = L_DOWN + 0.0175; // the foot's lowest point below the grip

export default defineAsset({
  name: 'druid-staff',
  description: "The druid's mossy gnarled staff with a red mushroom in the crook and a glowing lantern on its hook, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/druid_001.png',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, FOOT, 0], twoHanded: true },

  build(k) {
    const up = holdPose(GRIP, STAFF_AXIS).local;
    addPart(k, druidStaff(), { pose: (s) => up(s.at(...STAFF_MOUNT)).at(0, FOOT, 0), bones: null });
    addPart(k, druidStaffLantern(), { pose: (s) => up(s.at(...LANTERN_MOUNT)).at(0, FOOT, 0), bones: null });
  },
});
