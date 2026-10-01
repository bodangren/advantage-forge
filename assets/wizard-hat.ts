import { addPart, defineAsset } from '../src/index.js';
import { wizardHat } from './parts/wizard-hat.js';

/**
 * Wizard hat — the huge floppy red witch hat with a drooping brim, a bent point, gold sparks, and a
 * leather band with a gold flame emblem, as a standalone item, from the shared part
 * `assets/parts/wizard-hat.ts`, at its worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: 0.73 m across the brim, about 0.35 m
 * tall, resting on its brim on y = 0, the band emblem toward +Z. Static: no rig. One tint slot.
 */

export default defineAsset({
  name: 'wizard-hat',
  description: "The wizard's huge floppy red witch hat with a gold-flame band and gold sparks, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/wizard_001.png',
  variants: { clothing: { red: '#b8322b', blue: '#2e4a9e', purple: '#6b3294' } },
  texture: { size: 512 },

  build(k) {
    addPart(k, wizardHat(k.tint), { pose: (s) => s.at(0, 0.169, 0), bones: null });
  },
});
