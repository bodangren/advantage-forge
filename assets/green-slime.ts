import { motion, sdf } from '../src/index.js';
import { slimeAsset, slimeTones } from './parts/slime-kind.js';

/**
 * Green slime — Chibi Quest monster (catalog `monsters/small/green-slime`), about 0.65 m tall with
 * its sprout, faces +Z. Target: docs/monster-mockups/green-slime_001.jpg (made with mmx).
 *
 * The slime of `assets/slime.ts` (body, face, rig, and clips from `assets/parts/slime-kind.ts`)
 * in a brighter grass-green jelly with dark eyes, and a little leaf sprout on its dome: a forest
 * slime, so it differs from the plain slime at a glance.
 * Role: the meadow and forest variant of the first, weakest monster.
 * Palette: grass-green jelly #6cc83c with a pale top; the sprout a deeper leaf green #3f9a2a so it
 *   separates from the jelly; dark brown eyes. Slot options stay in the greens.
 * Crown: a curved stem with two round leaves on the `crown` bone. In every clip it sways, a little
 *   behind the dome; in the death it shrinks away.
 */

const GRASS = '#6cc83c';
const tones = slimeTones(GRASS);
const CYCLES: Record<string, number> = { idle: 2, walk: 1, attack: 2, hit: 2, death: 2, spit: 2 };

export default slimeAsset({
  name: 'green-slime',
  description: 'Chibi green slime monster: a bright grass-green jelly with dark eyes and a grumpy glare, a head dome on a wider belly with round drips, and a little leaf sprout on top.',
  reference: 'docs/monster-mockups/green-slime_001.jpg',
  variants: {
    jelly: { grass: GRASS, moss: '#4f9a34', lime: '#9ad83a' },
    highlight: { grass: tones.top, moss: '#a8d88a', lime: '#e0f59a' },
    eyes: { brown: '#6e4020', lime: tones.iris, amber: '#ffb43c' },
  },
  presets: {
    moss: { jelly: 'moss', highlight: 'moss', eyes: 'amber' },
    lime: { jelly: 'lime', highlight: 'lime', eyes: 'brown' },
  },
  irisLow: '#4a2a14',
  crown: {
    at: [0, 0.48, 0.01],
    build(k) {
      const stem = sdf.chain(
        [
          [0, 0.45, 0.01, 0.014],
          [0.005, 0.52, 0.0, 0.011],
          [-0.01, 0.58, -0.01, 0.009],
          [0.0, 0.62, 0.0, 0.008],
        ],
        0.01,
      );
      // A round leaf: a flattened ellipsoid from the stem tip, tilted up and out.
      const leaf = (side: 1 | -1) =>
        sdf
          .ellipsoid([0.055, 0.012, 0.034])
          .rotateZ(side * 28)
          .rotateY(side * -12)
          .at(side * 0.052, 0.64, 0.0);
      const vein = (side: 1 | -1) => sdf.box([0.1, 0.03, 0.005]).rotateZ(side * 28).rotateY(side * -12).at(side * 0.052, 0.645, 0.0);
      const sprout = sdf.smoothUnion(0.012, stem, leaf(1), leaf(-1)).paintWhere(sdf.union(vein(1), vein(-1)), '#2f7a1e', 0.002);
      k.body('sprout', sprout, { color: '#3f9a2a', roughness: 0.55, bone: 'crown', detail: 0.003 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 1;
      return { rotate: [5 * motion.wave(p, n, 0.35), 0, 9 * motion.wave(p, n, 0.15)] };
    },
  },
});
