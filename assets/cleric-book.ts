import { addPart, defineAsset, type sdf } from '../src/index.js';
import { clericBook, clericBookCross } from './parts/cleric-book.js';

/**
 * Cleric book — the cleric's holy book as a standalone item, from the shared part
 * `assets/parts/cleric-book.ts`, at the exact worn size (a shop view scales it for display).
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: 0.20 m wide, 0.26 m tall, 0.08 m
 * thick, standing upright on its bottom edge on y = 0, the front cover toward +Z.
 * Static: no rig, no tint slots. The glowing gold cross is on the front cover.
 */

/** Half the height of the book: the lowest point. */
const HALF_H = 0.138; // the gold corner caps reach 8 mm below the cover

export default defineAsset({
  name: 'cleric-book',
  description: "The cleric's big dark leather holy book with cream pages, gold corner caps and bands, and a glowing gold cross, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/cleric_001.png',
  texture: { size: 512 },

  build(k) {
    const stand = (s: sdf.Shape) => s.at(0, HALF_H, 0);
    addPart(k, clericBook(), { pose: stand, bones: null });
    addPart(k, clericBookCross(), { pose: stand, bones: null });
  },
});
