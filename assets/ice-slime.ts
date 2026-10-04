import { mixRgb, rgb, sdf } from '../src/index.js';
import { crystal } from './parts/element-features.js';
import { slimeAsset } from './parts/slime-kind.js';

/**
 * Ice slime — Chibi Quest monster (catalog `monsters/small/ice-slime`), about 0.7 m tall with its
 * crystals, faces +Z. Target: docs/monster-mockups/ice-slime_001.jpg (made with mmx).
 *
 * The slime of `assets/slime.ts` (body, face, rig, and clips from `assets/parts/slime-kind.ts`)
 * in a pale blue jelly with a frosty white top, and a cluster of clear ice crystals on its dome.
 * Role: an ice monster of the same weight class as the slime; the crystals make it read at 128 px.
 * Palette: frost-blue jelly #5ab8ea with a near-white top; the crystals are a whiter cyan than the jelly,
 *   see-through, and white at the tips; ice-white eyes. Slot options stay in the cold blues.
 * Crown: five six-sided crystals with pointed tips on the `crown` bone, the middle one tallest,
 *   faceted (flat shading). They ride the dome's jiggle; in the death they shrink away.
 */

const ICE = rgb('#c4f0ff');
const ICE_TIP = rgb('#ffffff');

export default slimeAsset({
  name: 'ice-slime',
  description: 'Chibi ice slime monster: a pale blue jelly with a frosty top and a grumpy glare, a head dome on a wider belly with round drips, and a cluster of clear ice crystals on top.',
  reference: 'docs/monster-mockups/ice-slime_001.jpg',
  variants: {
    jelly: { frost: '#5ab8ea', glacier: '#3e8fd0', mint: '#5ec4d4' },
    highlight: { frost: '#d4eeff', glacier: '#b8dcff', mint: '#cbf4f4' },
    eyes: { ice: '#e4f6ff', deep: '#2f6aa8', violet: '#9a8cf0' },
  },
  presets: {
    glacier: { jelly: 'glacier', highlight: 'glacier', eyes: 'ice' },
    mint: { jelly: 'mint', highlight: 'mint', eyes: 'deep' },
  },
  irisLow: '#9cc8e8',
  crown: {
    at: [0, 0.48, 0.01],
    build(k) {
      // Each crystal: [x, z, tilt toward +x (deg), tilt toward +z (deg), radius, length].
      const set: [number, number, number, number, number, number][] = [
        [0, -0.01, 0, -6, 0.044, 0.28],
        [0.065, 0.01, -26, 4, 0.036, 0.2],
        [-0.065, 0.0, 28, -2, 0.034, 0.19],
        [0.025, 0.06, -12, 24, 0.026, 0.12],
        [-0.03, -0.06, 14, -26, 0.028, 0.14],
      ];
      const cluster = sdf.union(...set.map(([x, z, rz, rx, r, len]) => crystal(r, len).rotate(rx, 0, rz).at(x, 0.43, z)));
      const ice = cluster.paintFn((_x, y) => mixRgb(ICE, ICE_TIP, Math.min(1, Math.max(0, (y - 0.5) / 0.2))));
      k.body('crystals', ice, { color: '#d8f6ff', roughness: 0.06, opacity: 0.8, emissive: '#bfefff', emissiveIntensity: 0.3, flat: true, bone: 'crown', detail: 0.003 });
    },
  },
});
