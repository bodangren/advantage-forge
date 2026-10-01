import { addPart, defineAsset } from '../src/index.js';
import { barbarianAxe } from './parts/barbarian-axe.js';

/**
 * Barbarian axe: the double-bladed axe as a standalone item, from the shared part
 * `assets/parts/barbarian-axe.ts`, at the exact worn size. Upright on the haft butt, head up,
 * blades along +-X. Static: no rig. No tint slots.
 */

/** Lift so the butt (0.116 m above the grip, flipped) rests on y = 0. */
const LIFT = 0.116;

export default defineAsset({
  name: 'barbarian-axe',
  description: "The barbarian's double-bladed war axe at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/barbarian_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, LIFT, 0] },

  build(k) {
    addPart(k, barbarianAxe(), { pose: (s) => s.rotateX(180).at(0, LIFT, 0), bones: null });
  },
});
