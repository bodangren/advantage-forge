import { addPart, defineAsset } from '../src/index.js';
import { captainShield } from './parts/captain-shield.js';

/**
 * Captain shield: the captain's round shield as a standalone item, from
 * `assets/parts/captain-shield.ts`, at the worn size. Role: loot, shop icon, avatar part.
 * Size: 0.264 m across, standing on its rim on y = 0, the face toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'captain-shield',
  description: "The captain's round steel shield with a gold rim and a gold lion crest, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/captain_001.jpg',
  texture: { size: 512 },
  variants: {},
  build(k) {
    addPart(k, captainShield(), { pose: (s) => s.at(0, 0.132, 0), bones: null });
  },
});
