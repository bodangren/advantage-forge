import { addPart, defineAsset } from '../src/index.js';
import { spearWardenJavelin } from './parts/spear-warden-javelin.js';

/**
 * Spear warden javelin — the hero's worn piece as a standalone item, from the shared part
 * `assets/parts/spear-warden-javelin.ts`, at its worn size. Static: no rig. Upright on its butt, the point up.
 */
export default defineAsset({
  name: 'spear-warden-javelin',
  description: "The spear warden's javelin at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/spear-warden_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.2, 0] },

  build(k) {
    addPart(k, spearWardenJavelin(), { pose: (s) => s.at(0, 0.0115, 0), bones: null });
  },
});
