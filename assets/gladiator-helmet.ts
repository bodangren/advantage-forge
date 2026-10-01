import { addPart, defineAsset } from '../src/index.js';
import { gladiatorHelmet } from './parts/gladiator-helmet.js';
const RIM_Y = 0.55 - 0.675; // the cheek plate bottom, below the head center

/**
 * Gladiator helmet — the gladiator's worn piece as a standalone item, from the shared part
 * `assets/parts/gladiator-helmet.ts`, at its worn size. Static: no rig. Rests on its rim on y = 0, the face opening toward +Z.
 */
export default defineAsset({
  name: 'gladiator-helmet',
  description: "The gladiator's bronze crested helmet at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/gladiator_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, gladiatorHelmet(), { pose: (s) => s.at(0, -RIM_Y, 0), bones: null });
  },
});
