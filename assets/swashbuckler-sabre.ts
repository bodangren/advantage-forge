import { addPart, defineAsset } from '../src/index.js';
import { swashbucklerSabre } from './parts/swashbuckler-sabre.js';

/**
 * Swashbuckler sabre: the swashbuckler's sabre as a standalone item at its worn size.
 * Role: equipment pickup and avatar part. Rests on its pommel on y = 0, blade up, flat toward +Z.
 * Static: no rig.
 */
export default defineAsset({
  name: 'swashbuckler-sabre',
  description: 'Curved blade with gold guard, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/swashbuckler_001.jpg',
  texture: { size: 512 },
  build(k) {
    addPart(k, swashbucklerSabre(), { pose: (s) => s.at(0, 0.0685, 0), bones: null });
  },
});
