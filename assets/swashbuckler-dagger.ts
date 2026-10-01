import { addPart, defineAsset } from '../src/index.js';
import { swashbucklerDagger } from './parts/swashbuckler-dagger.js';

/**
 * Swashbuckler dagger: the swashbuckler's dagger as a standalone item at its worn size.
 * Role: equipment pickup and avatar part. Rests on its pommel on y = 0, blade up, flat toward +Z.
 * Static: no rig.
 */
export default defineAsset({
  name: 'swashbuckler-dagger',
  description: 'Short dagger, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/swashbuckler_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.0545, 0] },
  build(k) {
    addPart(k, swashbucklerDagger(), { pose: (s) => s.at(0, 0.0545, 0), bones: null });
  },
});
