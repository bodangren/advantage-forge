import { addPart, defineAsset } from '../src/index.js';
import { shieldMaidenHelm } from './parts/shield-maiden-helm.js';

/**
 * Shield-maiden helm — the worn piece as a standalone item, from the shared part
 * `assets/parts/shield-maiden-helm.ts`, at the exact worn size. Static: no rig.
 */
export default defineAsset({
  name: 'shield-maiden-helm',
  description: 'The shield-maiden helm as a standalone item at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shield-maiden_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, shieldMaidenHelm(), { pose: (s) => s.at(0, 0.086, 0), bones: null });
  },
});
