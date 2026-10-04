import { addPart, defineAsset } from '../src/index.js';
import { explorerHat } from './parts/explorer-hat.js';

/**
 * Explorer hat: the explorer's soft khaki bucket hat with a wide brim, at worn size.
 * Role: equipment pickup and avatar part. Size: about 0.53 m wide, 0.15 m tall.
 * Rests on its brim (y = 0), the front toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'explorer-hat',
  description: "The explorer's soft khaki bucket hat with a wide brim and a band.",
  detail: 0.005,
  reference: 'docs/hero-mockups/explorer_001.jpg',
  texture: { size: 512 },
  variants: {
    hat: { khaki: '#c8b890', olive: '#7a7a48', slate: '#6a7a8a' },
  },
  equip: { slot: 'head', origin: [0, -0.0681, -0.0156], rotate: [10, 0, 0] },
  build(k) {
    addPart(k, explorerHat(k.tint), { pose: (s) => s.at(0, 0.0305, 0), bones: null });
  },
});
