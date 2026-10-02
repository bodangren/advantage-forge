import { addPart, defineAsset } from '../src/index.js';
import { guardianShield } from './parts/guardian-shield.js';

/**
 * Guardian shield: the guardian's tall teal tower shield with a gold rim and a pale star, as a
 * standalone item from `assets/parts/guardian-shield.ts`, at the worn size (scaled 1.15 as worn).
 * Role: shield pickup, shop icon, avatar part. Size: about 0.33 m wide, 0.69 m tall; it stands on
 * its lower point on y = 0, the face toward +Z. Static: no rig.
 * Avatar fit (2026-10-02): `fitScale` 2.2222 (the contract value) makes the worn shield 0.31 m tall,
 * about the captain shield; `origin` 0.36 puts the back-plane center on the forearm socket. The
 * old scale 1 hung 14 cm below the ground and hit the head in walk and run.
 */

const POINT_Y = -0.34 * 1.15;

export default defineAsset({
  name: 'guardian-shield',
  description: "The guardian's teal tower shield with a gold rim and a pale four-pointed star, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/guardian_001.jpg',
  texture: { size: 512 },
  variants: {
    cloth: { teal: '#3a7a88', crimson: '#9a2c34', royal: '#2f58b8' },
  },
  equip: { slot: 'offhand', hold: 'shield', origin: [0, 0.36, 0], fitScale: 2.2222 },
  build(k) {
    addPart(k, guardianShield(k.tint), { pose: (s) => s.scale(1.15).at(0, -POINT_Y, 0), bones: null });
  },
});
