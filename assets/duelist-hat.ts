import { addPart, defineAsset } from '../src/index.js';
import { duelistHat } from './parts/duelist-hat.js';

/**
 * Duelist hat: the duelist's wide grey hat with a gold edge and a long white plume, at worn size.
 * Role: equipment pickup and avatar part. Size: about 0.6 m wide, 0.3 m tall with the plume.
 * The hat rests on its brim (y = 0), the front toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'duelist-hat',
  description: "The duelist's wide grey hat with a gold edge and a white plume.",
  detail: 0.006,
  reference: 'docs/hero-mockups/duelist_001.jpg',
  texture: { size: 512 },
  build(k) {
    // The brim's lowest edge touches the ground.
    addPart(k, duelistHat(), { pose: (s) => s.at(0, 0.0412, 0), bones: null });
  },
});
