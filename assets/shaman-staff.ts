import { addPart, defineAsset } from '../src/index.js';
import { holdPose } from './parts/mage-wand.js';
import { shamanStaff, GRIP, STAFF_AXIS, STAFF_DOWN, MOUNT } from './parts/shaman-staff.js';

/**
 * Shaman staff — the rattle staff as a standalone item, from `assets/parts/shaman-staff.ts`, at
 * the exact worn size. Role: equipment pickup, shop icon, avatar part. Size: about 0.9 m tall,
 * upright on its foot on y = 0 with the rattle on top. Static: no rig.
 */
const FOOT_Y = STAFF_DOWN + 0.017;

export default defineAsset({
  name: 'shaman-staff',
  description: 'Knotted shaman staff with a wrapped rattle head and two hanging feathers, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shaman_001.jpg',
  texture: { size: 512 },
  variants: { cloth: { teal: '#4ab8b0', red: '#a83a32', violet: '#6a4a9e' } },
  build(k) {
    addPart(k, shamanStaff(k.tint), { pose: (s) => holdPose(GRIP, STAFF_AXIS).local(s.at(...MOUNT)).at(0, FOOT_Y, 0), bones: null });
  },
});
