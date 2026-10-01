import { addPart, defineAsset } from '../src/index.js';
import { rogueDagger } from './parts/rogue-dagger.js';

/**
 * Rogue dagger: the rogue's dagger as a standalone item at its worn size.
 * Role: equipment pickup and avatar part. About 0.2 m long; rests on its pommel on y = 0, blade up,
 * flat toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'rogue-dagger',
  description: "The rogue's dagger with a gold guard and pommel, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/rogue_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.053, 0] },
  build(k) {
    addPart(k, rogueDagger('L'), { pose: (s) => s.at(0, 0.053, 0), bones: null });
  },
});
