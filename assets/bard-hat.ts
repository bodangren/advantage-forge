import { addPart, defineAsset } from '../src/index.js';
import { bardHat } from './parts/bard-hat.js';

/**
 * Bard hat — the wide teal cap with a gold badge and a red plume, as a standalone item, from the
 * shared part `assets/parts/bard-hat.ts`, at its worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: 0.69 m across the brim, about 0.4 m
 * tall with the plume, flat on y = 0, the badge toward +Z.
 * Static: no rig. One tint slot: clothing.
 */

export default defineAsset({
  name: 'bard-hat',
  description: "The bard's wide teal cap with a dark band, a gold badge, and a big red plume, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/bard_001.jpg',
  variants: { clothing: { teal: '#3d8479', plum: '#74405f', mustard: '#a3842f' } },
  texture: { size: 512 },

  build(k) {
    addPart(k, bardHat(k.tint), { pose: (s) => s.at(0, 0.012, 0), bones: null });
  },
});
