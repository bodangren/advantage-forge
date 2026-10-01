import { addPart, defineAsset, mapTint, type sdf } from '../src/index.js';
import { warlockBook, warlockBookFlame } from './parts/warlock-book.js';

/**
 * Warlock book — the warlock's grimoire and its green flame as a standalone item, from the shared
 * parts in `assets/parts/warlock-book.ts`, at the exact worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: 0.10 m wide, 0.13 m tall, 0.04 m thick
 * (plus the flame, about 0.15 m above the top edge), standing upright on its bottom edge on y = 0,
 * the cover toward +Z. Static: no rig. Tint slot: flame.
 */

/** Half the book height: the lowest point (the gold caps sit inside the cover size). */
const HALF_H = 0.0685;
const stand = (s: sdf.Shape) => s.at(0, HALF_H, 0);

export default defineAsset({
  name: 'warlock-book',
  description: "The warlock's dark leather grimoire with a carved emblem, gold corners, and a green flame floating above it.",
  detail: 0.006,
  reference: 'docs/enemy-mockups/warlock_001.jpg',
  texture: { size: 512 },
  variants: {
    flame: { green: '#40ff80', purple: '#c060ff', orange: '#ff8030' },
  },
  equip: { slot: 'offhand', frame: 'body', origin: [0, HALF_H, 0], rotate: [0, -90, 0], offset: [0.06, -0.02, 0] },
  build(k) {
    addPart(k, warlockBook(), { pose: stand, bones: null });
    addPart(k, warlockBookFlame(mapTint(k, {})), { pose: (s) => stand(s.at(0, 0.065 + 0.03, 0)), bones: null });
  },
});
