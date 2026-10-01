import { addPart, defineAsset } from '../src/index.js';
import { shieldMaidenAxe } from './parts/shield-maiden-axe.js';

/**
 * Shield-maiden axe — the worn piece as a standalone item, from the shared part
 * `assets/parts/shield-maiden-axe.ts`, at the exact worn size. Static: no rig.
 */
export default defineAsset({
  name: 'shield-maiden-axe',
  description: 'The shield-maiden axe as a standalone item at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shield-maiden_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, shieldMaidenAxe(), { pose: (s) => s.rotateZ(180).at(0, 0.03, 0), bones: null });
  },
});
