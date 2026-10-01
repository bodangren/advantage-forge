import { addPart, defineAsset } from '../src/index.js';
import { gladiatorShield } from './parts/gladiator-shield.js';

/**
 * Gladiator shield — the gladiator's worn piece as a standalone item, from the shared part
 * `assets/parts/gladiator-shield.ts`, at its worn size. Static: no rig. Stands on its rim on y = 0, the face toward +Z.
 */
export default defineAsset({
  name: 'gladiator-shield',
  description: "The gladiator's round bronze-rimmed shield at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/gladiator_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'offhand', hold: 'shield', origin: [0, 0.136, 0] },

  build(k) {
    addPart(k, gladiatorShield(), { pose: (s) => s.at(0, 0.136, 0), bones: null });
  },
});
