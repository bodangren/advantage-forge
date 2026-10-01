import { addPart, defineAsset } from '../src/index.js';
import { guardianHammer } from './parts/guardian-hammer.js';

/**
 * Guardian war hammer: the guardian's short square-headed hammer as a standalone item from
 * `assets/parts/guardian-hammer.ts`, at the worn size.
 * Role: weapon pickup, shop icon, avatar part. Size: 0.24 m tall; the butt rests on y = 0, the head
 * up. Static: no rig.
 */

const BUTT_Y = -0.086;

export default defineAsset({
  name: 'guardian-hammer',
  description: "The guardian's short war hammer with a pale square head, gold caps, and a walnut haft, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/guardian_001.jpg',
  texture: { size: 512 },
  build(k) {
    addPart(k, guardianHammer(), { pose: (s) => s.at(0, -BUTT_Y, 0), bones: null });
  },
});
