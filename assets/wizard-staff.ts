import { addPart, defineAsset } from '../src/index.js';
import { GRIP, holdPose, MOUNT, L_DOWN, ORB_BASE_MOUNT, STAFF_AXIS, uprightPoint, wizardStaff, wizardStaffFire } from './parts/wizard-staff.js';

/**
 * Wizard staff — the gnarled forked staff with its fire orb, as a standalone item, from the shared
 * part `assets/parts/wizard-staff.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.8 m tall to the fork, the flame
 * above it, standing upright on its foot on y = 0. Static: no rig, no tint slots.
 */

/** The foot sits this far below the grip (the pole length below the fist). */
const REST_Y = L_DOWN - 0.002;
const flameAt = uprightPoint(ORB_BASE_MOUNT);

export default defineAsset({
  name: 'wizard-staff',
  description: "The wizard's gnarled forked staff with a burning fire orb in its head, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/wizard_001.png',
  texture: { size: 512 },

  build(k) {
    addPart(k, wizardStaff(), { pose: (s) => holdPose(GRIP, STAFF_AXIS).local(s.at(...MOUNT)).at(0, REST_Y, 0), bones: null });
    addPart(k, wizardStaffFire(), { pose: (s) => s.at(flameAt[0], flameAt[1] + REST_Y, flameAt[2]), bones: null });
  },
});
