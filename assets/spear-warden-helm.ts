import { addPart, defineAsset } from '../src/index.js';
import { SPEAR_WARDEN_HELM_REST as REST, spearWardenHelm } from './parts/spear-warden-helm.js';

/**
 * Spear warden helm: the hero's faceted bronze helm without its crest, as a standalone item from
 * the shared part `assets/parts/spear-warden-helm.ts`, at the exact worn size.
 * Display pose: tipped back a little so that it rests on the nose ridge and the neck guard.
 * Static: no rig. No tint slots. The front toward +Z.
 */
export default defineAsset({
  name: 'spear-warden-helm',
  description: "The spear warden's faceted bronze helm with a brow plate, cheek plates, and a neck guard, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/spear-warden_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, spearWardenHelm(), { pose: (s) => s.rotateX(REST.tilt).at(0, REST.lift, 0), bones: null });
  },
});
