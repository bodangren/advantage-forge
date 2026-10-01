import { addPart, defineAsset, type sdf } from '../src/index.js';
import { rangerBow } from './parts/ranger-bow.js';

/**
 * Ranger bow — the archer's recurve bow as a standalone item, from the shared part
 * `assets/parts/ranger-bow.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.57 m tall, standing on its
 * lower limb tip on y = 0, the curve and the string seen from the front (+Z). Static: no rig, no
 * tint slots.
 */

export default defineAsset({
  name: 'ranger-bow',
  description: "The ranger's dark wood longbow with a tan grip and a cream string, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/ranger_001.jpg',
  texture: { size: 512 },

  build(k) {
    // Keep the bow's curve in the XY plane, so the front view shows the full arc and the string;
    // stand the lower tip on the ground (tip about 0.216 m below the grip).
    const stand = (s: sdf.Shape) => s.at(0, 0.223, 0);
    addPart(k, rangerBow(), { pose: stand, bones: null });
  },
});
