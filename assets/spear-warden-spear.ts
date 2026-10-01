import { addPart, defineAsset } from '../src/index.js';
import { spearWardenSpear } from './parts/spear-warden-spear.js';

/**
 * Spear warden spear — the hero's worn piece as a standalone item, from the shared part
 * `assets/parts/spear-warden-spear.ts`, at its worn size. Static: no rig. Upright on its butt, the point up.
 */
export default defineAsset({
  name: 'spear-warden-spear',
  description: "The spear warden's spear at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/spear-warden_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.35, 0], twoHanded: true },

  build(k) {
    addPart(k, spearWardenSpear(), { pose: (s) => s.at(0, 0.0165, 0), bones: null });
  },
});
