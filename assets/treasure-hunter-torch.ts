import { addPart, defineAsset } from '../src/index.js';
import { treasureHunterTorch } from './parts/treasure-hunter-torch.js';

/**
 * Treasure hunter torch: the treasure hunter's wrapped torch with a lit flame, at worn size.
 * Role: equipment pickup and avatar part. Size: about 0.4 m tall. Static: no rig.
 */
export default defineAsset({
  name: 'treasure-hunter-torch',
  description: "the treasure hunter's wrapped torch with a lit flame.",
  detail: 0.006,
  reference: 'docs/hero-mockups/treasure-hunter_001.jpg',
  texture: { size: 512 },
  build(k) {
    // Upright on the butt of the stick, at the worn scale of 1.25.
    addPart(k, treasureHunterTorch(), { pose: (s) => s.scale(1.25).at(0, 0.0875, 0), bones: null });
  },
});
