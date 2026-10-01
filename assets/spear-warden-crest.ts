import { addPart, defineAsset, type Sdf } from '../src/index.js';
import { spearWardenCrest } from './parts/spear-warden-crest.js';
import { SPEAR_WARDEN_HELM_REST as REST, spearWardenHelm } from './parts/spear-warden-helm.js';

/**
 * Spear warden crest: the hero's tall red horsehair crest on his bronze helm, as a standalone item
 * from the shared parts `assets/parts/spear-warden-crest.ts` and `assets/parts/spear-warden-helm.ts`,
 * at the exact worn size. Both parts share the head-center frame, so they fit as on the hero.
 * Display pose: the helm's rest pose (on the nose ridge and the neck guard). Static: no rig.
 * The front toward +Z.
 */
export default defineAsset({
  name: 'spear-warden-crest',
  description: "The spear warden's tall red crest on his faceted bronze helm, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/spear-warden_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'head', origin: [0, REST.lift, 0], rotate: [REST.tilt, 0, 0] },

  build(k) {
    const rest = (s: Sdf) => s.rotateX(REST.tilt).at(0, REST.lift, 0);
    addPart(k, spearWardenHelm(), { pose: rest, bones: null });
    addPart(k, spearWardenCrest(), { pose: rest, bones: null });
  },
});
