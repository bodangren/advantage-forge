import { addPart, defineAsset } from '../src/index.js';
import { shamanCap } from './parts/shaman-cap.js';

/**
 * Shaman cap — the antler fur cap as a standalone item, from `assets/parts/shaman-cap.ts`, at the
 * exact worn size. Role: equipment pickup, shop icon, avatar part. Size: about 0.5 m wide with
 * the antlers, resting on its rim on y = 0, the front toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'shaman-cap',
  description: 'Fur cap with a teal band, branching antlers, and three feathers, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shaman_001.jpg',
  texture: { size: 512 },
  variants: { cloth: { teal: '#4ab8b0', red: '#a83a32', violet: '#6a4a9e' } },
  build(k) {
    const part = shamanCap(k.tint);
    addPart(k, part, { pose: (s) => s.at(0, -0.0895, 0), bones: null });
  },
});
