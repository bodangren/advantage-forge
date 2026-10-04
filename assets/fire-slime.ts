import { motion, rgb, mixRgb, sdf } from '../src/index.js';
import { slimeAsset } from './parts/slime-kind.js';

/**
 * Fire slime — Chibi Quest monster (catalog `monsters/small/fire-slime`), about 0.8 m tall with
 * its flames, faces +Z. Target: docs/monster-mockups/fire-slime_001.jpg (made with mmx).
 *
 * The slime of `assets/slime.ts` (body, face, rig, and clips from `assets/parts/slime-kind.ts`)
 * in an orange-red jelly that glows more, with three flame tongues on its dome.
 * Role: a fire monster of the same weight class as the slime; the flames make it read at 128 px.
 * Palette: flame-orange jelly #d84a1c with an amber top; the flames go from orange at the root
 *   to yellow at the tips and glow; amber eyes. Slot options stay in the fire family.
 * Crown: three flame tongues on the `crown` bone, the middle one tallest, the side ones leaning
 *   out. In every clip they flicker (they stretch and sway); in the death they shrink away.
 */

const FLAME_ROOT = rgb('#ff9418');
const FLAME_TIP = rgb('#fff27a');
const CYCLES: Record<string, number> = { idle: 6, walk: 3, attack: 4, hit: 2, death: 4, spit: 4 };

export default slimeAsset({
  name: 'fire-slime',
  description: 'Chibi fire slime monster: a glowing orange-red jelly with a grumpy glare, a head dome on a wider belly with round drips, and three flickering flame tongues on top.',
  reference: 'docs/monster-mockups/fire-slime_001.jpg',
  variants: {
    jelly: { flame: '#d84a1c', ember: '#a8300e', magma: '#c86018' },
    highlight: { flame: '#ffa82a', ember: '#ff8a30', magma: '#ffc040' },
    eyes: { amber: '#ffc83c', white: '#fff2b0', ember: '#ff7a2a' },
  },
  presets: {
    ember: { jelly: 'ember', highlight: 'ember', eyes: 'white' },
    magma: { jelly: 'magma', highlight: 'magma', eyes: 'ember' },
  },
  irisLow: '#e08a18',
  glow: 0.3,
  crown: {
    at: [0, 0.48, 0.01],
    build(k) {
      // A flame tongue: a tapered chain that rises in a soft S, flattened front to back.
      const tongue = (x: number, lean: number, h: number, r: number) => {
        const a = (lean * Math.PI) / 180;
        const pts = [0, 0.3, 0.6, 0.85, 1].map((t, i): [number, number, number, number] => {
          const wob = 0.025 * Math.sin(t * Math.PI * 1.6) * (i % 2 ? 1 : -1);
          const y = 0.44 + t * h;
          return [x + Math.sin(a) * t * h + wob, y, 0.01 - 0.02 * t, r * (1 - 0.82 * t ** 1.2)];
        });
        return sdf.chain(pts, 0.02).scale([1, 1, 0.75]);
      };
      const flames = sdf
        .smoothUnion(0.03, tongue(0, 4, 0.33, 0.052), tongue(0.085, 22, 0.26, 0.044), tongue(-0.085, -22, 0.26, 0.044))
        .paintFn((_x, y) => mixRgb(FLAME_ROOT, FLAME_TIP, Math.min(1, Math.max(0, (y - 0.48) / 0.16))));
      k.body('flames', flames, { color: '#ffb428', roughness: 0.3, emissive: '#ffb030', emissiveIntensity: 0.7, bone: 'crown', detail: 0.004 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 2;
      const w = motion.wave(p, n);
      return { rotate: [3 * motion.wave(p, n, 0.3), 0, 5 * motion.wave(p, n / 2, 0.1)], scale: [1 - 0.05 * w, 1 + 0.12 * w, 1 - 0.05 * w] };
    },
  },
});
