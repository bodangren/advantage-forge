import { addPart, defineAsset } from '../src/index.js';
import { mageSpellbook } from './parts/mage-spellbook.js';

/**
 * Mage spellbook — the small book the mage holds on his open palm, as a standalone item, from the
 * shared part `assets/parts/mage-spellbook.ts`, at the exact worn size (a shop view scales it for
 * display).
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: 0.10 m wide, 0.135 m tall, 0.045 m
 * thick, standing upright on its bottom edge on y = 0, the front cover toward +Z.
 * Static: no rig, no tint slots.
 */

/** Half the height of the gold corner caps, the lowest part of the book. */
const HALF_H = 0.0675;

export default defineAsset({
  name: 'mage-spellbook',
  description: "The mage's small red leather spellbook with cream page edges, gold corner caps, and a gold clasp, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/mage_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, mageSpellbook(), { pose: (s) => s.at(0, HALF_H, 0), bones: null });
  },
});
