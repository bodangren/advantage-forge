import { addPart, defineAsset } from '../src/index.js';
import { DRAGOON_LANCE_GRIP_Y, dragoonLance } from './parts/dragoon-lance.js';

/**
 * Dragoon lance: the dragoon's 1.5 m steel lance as a standalone item, from the shared part
 * `assets/parts/dragoon-lance.ts`, at its worn size.
 * Role: weapon pickup and avatar part. Size: 1.5 m tall; stands upright on its butt on y = 0, point up. Static.
 */
export default defineAsset({
  name: 'dragoon-lance',
  description: "The dragoon's steel lance with a leather grip, silver collars, a ring guard, and a leaf head.",
  detail: 0.004,
  reference: 'docs/hero-mockups/dragoon_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, dragoonLance(), { pose: (s) => s.at(0, DRAGOON_LANCE_GRIP_Y + 0.01, 0), bones: null });
  },
});
