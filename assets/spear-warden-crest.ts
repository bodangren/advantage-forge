import { addPart, defineAsset } from '../src/index.js';
import { spearWardenCrest } from './parts/spear-warden-crest.js';

/**
 * Spear warden crest — the hero's worn piece as a standalone item, from the shared part
 * `assets/parts/spear-warden-crest.ts`, at its worn size. Static: no rig. Rests on its base on y = 0, the front toward +Z.
 */
export default defineAsset({
  name: 'spear-warden-crest',
  description: "The spear warden's crest at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/spear-warden_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, spearWardenCrest(), { pose: (s) => s.at(0, -0.1445, 0), bones: null });
  },
});
