import { motion, noise, sdf } from '../src/index.js';
import { slimeAsset } from './parts/slime-kind.js';

/**
 * Poison slime — Chibi Quest monster (catalog `monsters/small/poison-slime`), about 0.6 m tall
 * with its goo, faces +Z. Target: docs/monster-mockups/poison-slime_001.jpg (made with mmx).
 *
 * The slime of `assets/slime.ts` (body, face, rig, and clips from `assets/parts/slime-kind.ts`)
 * in a purple jelly with toxic lime eyes, and a lumpy blob of glowing lime goo on its dome.
 * Role: a poison monster of the same weight class as the slime; the lime goo on the purple dome
 *   is the strongest hue contrast, so it reads at 128 px.
 * Palette: venom-purple jelly #7e3c9a with a lilac top; lime goo #9ae03c that glows; toxic lime
 *   eyes. Slot options stay in the purples (the jelly) and the acid yellow-greens (the eyes).
 * Crown: a cluster of goo lumps on the `crown` bone. In every clip it boils (it swells and
 *   settles, a little out of step with the jelly); in the death it shrinks away.
 */

const CYCLES: Record<string, number> = { idle: 4, walk: 2, attack: 3, hit: 1, death: 3, spit: 3 };

export default slimeAsset({
  name: 'poison-slime',
  description: 'Chibi poison slime monster: a purple jelly with toxic lime eyes and a grumpy glare, a head dome on a wider belly with round drips, and a blob of glowing lime goo boiling on top.',
  reference: 'docs/monster-mockups/poison-slime_001.jpg',
  variants: {
    jelly: { venom: '#7e3c9a', nightshade: '#56287a', plum: '#9a3c7a' },
    highlight: { venom: '#c27ad8', nightshade: '#9a6ad0', plum: '#d87ab8' },
    eyes: { toxic: '#b4ec3c', acid: '#e6f25a', orange: '#ffb43c' },
  },
  presets: {
    nightshade: { jelly: 'nightshade', highlight: 'nightshade', eyes: 'acid' },
    plum: { jelly: 'plum', highlight: 'plum', eyes: 'orange' },
  },
  irisLow: '#6aa020',
  glow: 0.2,
  crown: {
    at: [0, 0.48, 0.01],
    build(k) {
      const lumps: [number, number, number, number][] = [
        [0, 0.5, 0, 0.075],
        [0.06, 0.49, 0.03, 0.05],
        [-0.055, 0.5, -0.02, 0.055],
        [0.02, 0.56, -0.03, 0.05],
        [-0.03, 0.55, 0.04, 0.04],
        [0.07, 0.47, -0.05, 0.035],
      ];
      const goo = sdf
        .smoothUnion(0.03, ...lumps.map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)))
        .displace(0.004, (x, y, z) => noise.noise3(x * 30, y * 30, z * 30))
        .paintFn((x, y, z, c) => {
          const m = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
          return [c[0] * (0.85 + 0.3 * m), c[1] * (0.9 + 0.2 * m), c[2] * (0.85 + 0.3 * m)];
        });
      k.body('goo', goo, { color: '#9ae03c', roughness: 0.12, emissive: '#8ad42c', emissiveIntensity: 0.35, bone: 'crown', detail: 0.004 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 2;
      const b = motion.wave(p, n, 0.2);
      return { scale: [1 + 0.06 * b, 1 - 0.05 * b, 1 + 0.06 * b], rotate: [0, 8 * motion.wave(p, Math.max(1, n / 2)), 0] };
    },
  },
});
