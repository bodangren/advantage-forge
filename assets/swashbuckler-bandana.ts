import { addPart, defineAsset } from '../src/index.js';
import { swashbucklerBandana } from './parts/swashbuckler-bandana.js';

/**
 * Swashbuckler bandana: the worn red bandana as a standalone item at its worn size.
 * Role: equipment pickup and avatar part. Rests on y = 0 as worn, the knot toward -Z. Static: no rig.
 */
export default defineAsset({
  name: 'swashbuckler-bandana',
  description: "The swashbuckler's red bandana with a knot and two tails, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/swashbuckler_001.jpg',
  texture: { size: 512 },
  variants: { clothing: { red: '#c93a32', blue: '#2f58b8', green: '#2e7a3c' } },
  equip: { slot: 'head', origin: [0, 0.026, 0], fullHair: true },
  build(k) {
    addPart(k, swashbucklerBandana(k.tint), { pose: (s) => s.at(0, 0.026, 0), bones: null });
  },
});
