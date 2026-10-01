import { addPart, defineAsset } from '../src/index.js';
import { shieldMaidenShield } from './parts/shield-maiden-shield.js';

/**
 * Shield-maiden shield — the worn piece as a standalone item, from the shared part
 * `assets/parts/shield-maiden-shield.ts`, at the exact worn size. Static: no rig.
 */
export default defineAsset({
  name: 'shield-maiden-shield',
  description: 'The shield-maiden shield as a standalone item at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shield-maiden_001.jpg',
  texture: { size: 512 },
  variants: { shield: { blue: '#3a8ab8', crimson: '#8a2a3a', forest: '#2e6a3c' } },

  build(k) {
    addPart(k, shieldMaidenShield(k.tint), { pose: (s) => s.at(0, 0.163, 0), bones: null });
  },
});
