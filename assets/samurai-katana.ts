import { addPart, defineAsset } from '../src/index.js';
import { samuraiKatana } from './parts/samurai-katana.js';

/**
 * Samurai katana — the samurai's sword as a standalone item, from the shared part
 * `assets/parts/samurai-katana.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.55 m long, standing on its
 * pommel on y = 0, the blade up, the edge toward +X so the curve shows from the front.
 * Static: no rig, no tint slots.
 */

/** The pommel cap reaches 0.122 m beyond the grip center. */
const POMMEL = 0.122;

export default defineAsset({
  name: 'samurai-katana',
  description: "The samurai's katana with a wrapped dark grip, a round gold guard, and a gently curved steel blade, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/samurai_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, samuraiKatana(), { pose: (s) => s.rotateZ(180).at(0, POMMEL, 0), bones: null });
  },
});
