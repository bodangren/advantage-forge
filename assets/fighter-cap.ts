import { addPart, defineAsset } from '../src/index.js';
import { fighterCap } from './parts/fighter-cap.js';

/**
 * Fighter cap: the fighter's steel skull cap with a nasal bar, as a standalone item from the shared
 * part `assets/parts/fighter-cap.ts`, at the exact worn size, with the padded leather lining that
 * fills the open frame (the fighter shows his hair there instead).
 * Display pose: tipped back so that it rests on the nasal tip and the back of the brow band, as a
 * helmet lies on a table. Static: no rig. The front toward +Z.
 */

/** The tip-back angle: the nasal tip and the back of the band touch the ground together. */
const TILT = -20;
/** Lifts the tipped cap onto y = 0. */
const LIFT = 0.042;

export default defineAsset({
  name: 'fighter-cap',
  description: "The fighter's steel skull cap with a nasal bar and a padded leather lining, at its worn size.",
  detail: 0.006,
  reference: 'docs/hero-mockups/fighter_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'head', origin: [0, LIFT, 0], rotate: [TILT, 0, 0] },

  build(k) {
    addPart(k, fighterCap({ lining: true }), { pose: (s) => s.rotateX(TILT).at(0, LIFT, 0), bones: null });
  },
});
