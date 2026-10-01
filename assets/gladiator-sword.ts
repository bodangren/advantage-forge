import { addPart, defineAsset } from '../src/index.js';
import { gladiatorSword } from './parts/gladiator-sword.js';

/**
 * Gladiator sword — the gladiator's worn piece as a standalone item, from the shared part
 * `assets/parts/gladiator-sword.ts`, at its worn size. Static: no rig. Stands on its pommel on y = 0, blade up.
 */
export default defineAsset({
  name: 'gladiator-sword',
  description: "The gladiator's short sword at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/gladiator_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.068, 0] },

  build(k) {
    addPart(k, gladiatorSword(), { pose: (s) => s.rotateZ(180).at(0, 0.068, 0), bones: null });
  },
});
