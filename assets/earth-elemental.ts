import { mixRgb, motion, noise, rgb, sdf } from '../src/index.js';
import { curl } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Earth elemental — Chibi Quest monster (catalog `monsters/elemental/earth-elemental`), a floating
 * earth spirit about 0.95 m tall with its sprout, faces +Z. Target:
 * docs/monster-mockups/earth-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * on a round boulder body of cracked brown clay with moss, and a curly sprout on its head.
 * Role: a sturdy earth spirit of the elemental family; the boulder body and the sprout read at
 *   128 px.
 * Palette (60/30/10): cream head #efe6cf; brown rock #8a5a3a with dark cracks and green moss; a
 *   leaf-green sprout; amber pupils.
 * Features: a boulder body (1.3 times as wide, lumpy), two grey stones set in it, and a sprout
 *   with two leaves on the `crown` bone that sways.
 */

const CRACK = rgb('#3e2618');
const MOSS = rgb('#5e8a32');

export default spiritAsset({
  name: 'earth-elemental',
  description: 'Chibi earth elemental monster: a cream egg head with a curly green sprout, dark eyes with amber glowing pupils, on a round cracked brown boulder body with moss and stones and a curled tail.',
  reference: 'docs/monster-mockups/earth-elemental_001.jpg',
  variants: {
    body: { cream: '#efe6cf', sand: '#e8dcc0', clay: '#f0dcc8' },
    element: { clay: '#8a5a3a', stone: '#7a7066', ochre: '#a06a34' },
    eyes: { amber: '#ffb030', green: '#9af060', gold: '#ffd860' },
  },
  presets: {
    stone: { body: 'sand', element: 'stone', eyes: 'green' },
    ochre: { body: 'clay', element: 'ochre', eyes: 'gold' },
  },
  colors: { eye: '#16110c', pupilBase: '#5a3208', mouth: '#4a2a1a' },
  head: { roughness: 0.7 },
  wisp: {
    girth: 1.3,
    roughness: 0.88,
    bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 3),
    paint: (wisp) =>
      wisp
        .displace(0.007, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
        .paintFn((x, y, z, c) => {
          // Cracks: thin dark lines where the noise crosses zero; moss on the upper front.
          const n = noise.noise3(x * 16, y * 16, z * 16);
          let out = mixRgb(c, CRACK, Math.max(0, 1 - Math.abs(n) / 0.07) * 0.85);
          const m = noise.fbm(x * 9 + 3, y * 9, z * 9, 2);
          out = mixRgb(out, MOSS, Math.max(0, Math.min(1, (m - 0.25) / 0.12)) * (y > 0.16 ? 1 : 0));
          return out;
        }),
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.79, 0] } },
    build(k, s) {
      // The sprout: a short stem that curls, with two leaves at its base.
      const stem = curl([0, 0.77, 0], [1, 0, 0], 0.05, 0.9, 0.013);
      const leaf = (side: number) =>
        sdf
          .ellipsoid([0.075, 0.014, 0.04])
          .rotateZ(side * 30)
          .at(side * 0.07, 0.84, 0);
      const sprout = sdf.smoothUnion(0.012, stem, leaf(1), leaf(-1)).bone('crown');
      k.body('sprout', sprout, { color: '#5c9a34', roughness: 0.55, detail: 0.003 });
      // Two grey stones set in the front of the boulder.
      const stones = sdf
        .union(
          sdf.ellipsoid([0.04, 0.03, 0.022]).rotateZ(-15).at(...s.on(s.wisp!, 0.03, 0.2, 0.2, -0.006)),
          sdf.ellipsoid([0.026, 0.02, 0.016]).rotateZ(20).at(...s.on(s.wisp!, -0.1, 0.13, 0.16, -0.004)),
        )
        .bone('body');
      k.body('stones', stones, { color: '#8e8c88', roughness: 0.8, detail: 0.003 });
    },
    pose(clip, p) {
      const n = clip === 'hit' ? 1 : 2;
      return { crown: { rotate: [4 * motion.wave(p, n, 0.2), 0, 8 * motion.wave(p, n)] } };
    },
  },
});
