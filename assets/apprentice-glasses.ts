import { addPart, defineAsset } from '../src/index.js';
import { apprenticeGlasses } from './parts/apprentice-glasses.js';

/**
 * Apprentice glasses — the apprentice's round dark glasses as a standalone item, from
 * `assets/parts/apprentice-glasses.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.44 m wide, 0.15 m tall,
 * 0.23 m deep (temples spread). They stand on the lower rims and the ends of the temples, the lenses toward +Z.
 * Static: no rig, no tint slots.
 */

// Tilt about X so the lower rims and the temple ends touch y = 0; LIFT sets the ground contact.
const TILT = -25;
const LIFT = 0.0375;

export default defineAsset({
  name: 'apprentice-glasses',
  description: "The apprentice's round dark-rimmed glasses at their worn size, standing on the rims and temple ends.",
  detail: 0.005,
  reference: 'docs/hero-mockups/apprentice_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, apprenticeGlasses(), { pose: (s) => s.at(0, 0, 0).rotateX(TILT).at(0, LIFT, 0), bones: null });
  },
});
