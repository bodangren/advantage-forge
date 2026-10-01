import { addPart, defineAsset } from '../src/index.js';
import { ROGUE_HOOD_MOUNT, rogueHood } from './parts/rogue-hood.js';

/**
 * Rogue hood: the rogue's big soft hood as a standalone item at its worn size.
 * Role: equipment pickup and avatar part. About 0.57 m wide and 0.56 m tall; the lower edge rests
 * on y = 0, the face opening toward +Z. Static: no rig.
 */
const RIM_Y = 0.43 - ROGUE_HOOD_MOUNT[1];

export default defineAsset({
  name: 'rogue-hood',
  description: "The rogue's big soft hood with a rolled rim, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/rogue_001.jpg',
  texture: { size: 512 },
  variants: {
    cloth: { teal: '#2f625e', crimson: '#7a2a30', forest: '#3b5a2a' },
  },
  build(k) {
    addPart(k, rogueHood(k.tint), { pose: (s) => s.at(0, -RIM_Y, 0), bones: null });
  },
});
