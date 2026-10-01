import { addPart, defineAsset } from '../src/index.js';
import { bardLute } from './parts/bard-lute.js';

/**
 * Bard lute — the wooden lute with gold pegs, as a standalone item, from the shared part
 * `assets/parts/bard-lute.ts`, at its worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.5 m long, 0.18 m wide, 0.07 m
 * thick, standing on its bowl on y = 0, the neck up, the soundboard toward +Z.
 * Static: no rig, no tint slots.
 */

/** The bowl reaches 0.12 m behind the origin along the neck, times the worn scale 1.2. */
const BOWL_BACK = 0.12 * 1.2;

export default defineAsset({
  name: 'bard-lute',
  description: "The bard's round-bowled wooden lute with a ribbed back, four strings, and gold pegs, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/bard_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, bardLute(), { pose: (s) => s.rotateZ(90).at(0, BOWL_BACK, 0), bones: null });
  },
});
