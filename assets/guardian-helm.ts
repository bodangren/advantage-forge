import { addPart, defineAsset } from '../src/index.js';
import { GUARDIAN_HELM_MOUNT, guardianHelm } from './parts/guardian-helm.js';

/**
 * Guardian helm: the guardian's round pale helm with a gold brow band and crest, as a standalone
 * item from `assets/parts/guardian-helm.ts`, at the worn size.
 * Role: equipment pickup, shop icon, avatar part. Size: about 0.5 m wide; the rim rests on y = 0,
 * the face opening toward +Z. Static: no rig.
 */

/** The band lower edge in the part frame (guardian y 0.714). */
const RIM_Y = 0.7095 - GUARDIAN_HELM_MOUNT[1];

export default defineAsset({
  name: 'guardian-helm',
  description: "The guardian's round pale helm with a gold brow band and center crest, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/guardian_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'head', origin: [0, -RIM_Y, 0] },
  build(k) {
    addPart(k, guardianHelm(), { pose: (s) => s.at(0, -RIM_Y, 0), bones: null });
  },
});
