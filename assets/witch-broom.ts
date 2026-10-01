import { addPart, defineAsset, type sdf } from '../src/index.js';
import { witchBroom } from './parts/witch-broom.js';

const rest = (s: sdf.Shape) => s.rotateX(180).at(0, 0.364, 0);

/**
 * Witch broom as a standalone item, from the shared part `assets/parts/witch-broom.ts`, at its worn size.
 * Role: equipment pickup, shop icon, and avatar part. Static: no rig. No tint slots. Stands on the bristles, the stick up.
 */
export default defineAsset({
  name: 'witch-broom',
  description: "The witch's crooked broom, standing on its bristles, at its worn size.",
  detail: 0.005,
  reference: 'docs/enemy-mockups/witch_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, witchBroom(rest), { pose: (s) => s, bones: null });
  },
});
