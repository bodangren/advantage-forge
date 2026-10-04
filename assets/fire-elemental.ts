import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Fire elemental — Chibi Quest monster (catalog `monsters/elemental/fire-elemental`), a floating
 * fire spirit about 1 m tall with its flames, faces +Z. Target:
 * docs/monster-mockups/fire-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * on a glowing orange wisp body that tapers into a curled tail, with flame hair on its head.
 * Role: a fire caster of the elemental family; the flame hair and the glowing body read at 128 px.
 * Palette (60/30/10): warm white head #fbeee0; flame-orange wisp #ff7a1c with a yellow core and a
 *   red tail; the flames go from red-orange at the root to yellow at the tips and glow; amber pupils.
 * Features: five flame tongues on the `crown` bone (the middle one tallest), and a warm glow on
 *   the crown of the head under them. In every clip the flames flicker (they stretch and sway).
 */

const FLAME_ROOT = rgb('#ff6a00');
const FLAME_TIP = rgb('#ffe86a');
const CYCLES: Record<string, number> = { idle: 6, walk: 4, attack: 4, hit: 2, death: 6, taunt: 6 };

export default spiritAsset({
  name: 'fire-elemental',
  description: 'Chibi fire elemental monster: a warm white egg head with flame hair, dark eyes with amber glowing pupils, and a small smile, on a glowing orange wisp body that curls into a tail.',
  reference: 'docs/monster-mockups/fire-elemental_001.jpg',
  variants: {
    body: { warm: '#fbeee0', cream: '#f6e2c4', ash: '#ece4dc' },
    element: { flame: '#ff7a1c', ember: '#e04a18', gold: '#ffa424' },
    eyes: { amber: '#ffbe3c', ember: '#ff6a2a', white: '#fff2b0' },
  },
  presets: {
    ember: { body: 'ash', element: 'ember', eyes: 'ember' },
    gold: { body: 'cream', element: 'gold', eyes: 'white' },
  },
  colors: { eye: '#1a1210', pupilBase: '#5a2a08', mouth: '#5a1e10' },
  head: {
    roughness: 0.55,
    // A warm glow on the forehead under the flames.
    paint: (head, s) => head.paintWhere(sdf.ellipsoid([0.2, 0.1, 0.2]).at(0, 0.74, 0.04), s.tone('element', '#ffcf86', 0.6), 0.07),
  },
  wisp: {
    roughness: 0.38,
    glow: true,
    emissiveIntensity: 0.4,
    paint: (wisp, s) => {
      const core = rgb(s.tone('element', '#ffd84a'));
      const deep = rgb(s.tone('element', '#d8381a'));
      // A yellow core on the chest, and a deeper red toward the tail tip.
      return wisp.paintFn((x, y, z, c) => {
        const d = Math.hypot(x, (y - 0.22) * 1.2, z - 0.12);
        const out = mixRgb(c, core, Math.max(0, Math.min(1, 1 - d / 0.11)) * 0.9);
        return mixRgb(out, deep, Math.max(0, Math.min(1, (0.13 - y) / 0.09)) * 0.6);
      });
    },
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.74, -0.02] } },
    build(k, s) {
      // A cap of fire that hugs the top of the head (lower at the back, with licking lobes at its
      // edge) rides the head; the tongues that rise from it ride the flickering crown.
      const n = Math.hypot(1, 0.25);
      const edge = sdf.halfSpace([0, -1 / n, 0.25 / n], -0.67 / n).displace(0.022, (x, _y, z) => Math.cos(9 * Math.atan2(x, z)), 2);
      const cap = s.head.round(0.016).smoothIntersect(0.012, edge).bone('head');
      const tongues = sdf
        .smoothUnion(
          0.035,
          flameTongue(0, 0.74, 0.03, 4, 0.27, 0.085, 0.08),
          flameTongue(0.12, 0.66, 0.02, 42, 0.16, 0.055, 0.04),
          flameTongue(-0.12, 0.66, 0.02, -42, 0.16, 0.055, 0.04),
          flameTongue(0.08, 0.7, -0.1, 18, 0.2, 0.06, 0.08),
          flameTongue(-0.08, 0.7, -0.1, -18, 0.2, 0.06, 0.08),
        )
        .scale([1, 1, 0.85])
        .bone('crown');
      const core = sdf.ellipsoid([0.075, 0.06, 0.06]).at(0, 0.8, 0.1);
      const flames = sdf
        .smoothUnion(0.03, cap, tongues)
        .paintFn((_x, y) => mixRgb(FLAME_ROOT, FLAME_TIP, Math.min(1, Math.max(0, (y - 0.84) / 0.16))))
        .paintWhere(core, '#ffe25a', 0.03);
      k.body('flames', flames, { color: '#ff7a1c', roughness: 0.5, emissive: '#ff7a00', emissiveIntensity: 0.45, detail: 0.004 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 2;
      const w = motion.wave(p, n);
      return { crown: { rotate: [3 * motion.wave(p, n, 0.3), 0, 5 * motion.wave(p, n / 2, 0.1)], scale: [1 - 0.05 * w, 1 + 0.12 * w, 1 - 0.05 * w] } };
    },
  },
});
