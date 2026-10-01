import { addPart, defineAsset } from '../src/index.js';
import { treasureHunterHat } from './parts/treasure-hunter-hat.js';

/**
 * Treasure hunter hat: the treasure hunter's brown fedora with a dark band, at worn size.
 * Role: equipment pickup and avatar part. Size: about 0.62 m wide, 0.3 m tall. Static: no rig.
 */
export default defineAsset({
  name: 'treasure-hunter-hat',
  description: "the treasure hunter's brown fedora with a dark band.",
  detail: 0.006,
  reference: 'docs/hero-mockups/treasure-hunter_001.jpg',
  texture: { size: 512 },
  build(k) {
    // Tipped 10 degrees as worn, resting on the lowest brim edge.
    addPart(k, treasureHunterHat(), { pose: (s) => s.rotateX(-10).at(0, 0.08, 0), bones: null });
  },
});
