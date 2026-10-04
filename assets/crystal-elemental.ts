import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { crystal } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Crystal elemental — Chibi Quest monster (catalog `monsters/elemental/crystal-elemental`), a
 * floating crystal spirit about 1 m tall with its crystals, faces +Z. Target:
 * docs/monster-mockups/crystal-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * all in soft pink, with a spiky crown of pink crystals and a violet gem on its chest.
 * Role: a gem spirit of the elemental family; the spiky crown and the chest gem read at 128 px.
 * Palette (60/30/10): pink #eab0dc head and body; clear pink crystals #f2a0d8, white at the tips;
 *   a glowing violet gem #9a5ae0; pink pupils.
 * Features: a burst of sixteen sharp crystals on the head (rigid on the `head` bone), and a gem on the
 *   `gem` bone that pulses in every clip.
 */

const TIP = rgb('#fff4fc');

export default spiritAsset({
  name: 'crystal-elemental',
  description: 'Chibi crystal elemental monster: a soft pink egg head with a spiky crown of clear pink crystals, dark eyes with pink glowing pupils, on a pink wisp body with a glowing violet chest gem and a curled tail.',
  reference: 'docs/monster-mockups/crystal-elemental_001.jpg',
  variants: {
    body: { pink: '#eab0dc', lilac: '#cdb4ec', mint: '#b4e4d4' },
    element: { rose: '#f2a0d8', amethyst: '#b48af0', emerald: '#7ad8a8' },
    eyes: { pink: '#ffa8e8', white: '#fff0fa', violet: '#c49aff' },
  },
  presets: {
    amethyst: { body: 'lilac', element: 'amethyst', eyes: 'violet' },
    emerald: { body: 'mint', element: 'emerald', eyes: 'white' },
  },
  colors: { eye: '#1a1018', pupilBase: '#4a1a40', mouth: '#4a1a3a' },
  head: { roughness: 0.4 },
  wisp: { slot: 'body', roughness: 0.4 },
  extra: {
    bones: { gem: { parent: 'body', at: [0, 0.22, 0.14] } },
    build(k, s) {
      // Sharp crystals stand out of the top of the head like spiky hair: each one is rooted on
      // the head along its normal (bent a little upward), [azimuth deg, height, radius, length].
      const set: [number, number, number, number][] = [[0, 0.8, 0.045, 0.24]];
      for (let i = 0; i < 6; i++) set.push([i * 60 + 30, 0.75, 0.04, 0.22]);
      for (let i = 0; i < 9; i++) set.push([i * 40, 0.66, 0.036, 0.19]);
      const spike = ([az, y, r, len]: [number, number, number, number]) => {
        const a = (az * Math.PI) / 180;
        const p = s.on(s.head, Math.sin(a) * 0.3, y, Math.cos(a) * 0.3, -0.022);
        const n = sdf.normalAt(s.head, s.on(s.head, p[0], p[1], p[2]));
        const d = [n[0], n[1] + 0.6, n[2]];
        const l = Math.hypot(d[0]!, d[1]!, d[2]!);
        const tilt = (Math.acos(d[1]! / l) * 180) / Math.PI;
        const yaw = (Math.atan2(d[0]!, d[2]!) * 180) / Math.PI;
        return crystal(r, len, 30).rotateX(tilt).rotateY(yaw).at(...p);
      };
      const burst = sdf.union(...set.map(spike));
      const pink = burst.paintFn((_x, y, _z, c) => mixRgb(c, TIP, Math.min(1, Math.max(0, (y - 0.86) / 0.14)) * 0.8));
      k.body('crystals', pink, { color: s.tint.element, roughness: 0.08, opacity: 0.88, emissive: s.tint.element, emissiveIntensity: 0.2, flat: true, bone: 'head', detail: 0.003 });
      // The chest gem: a six-sided bipyramid, half sunk into the body, facing forward.
      const at = s.on(s.wisp!, 0, 0.22, 0.14, -0.02);
      const gem = sdf.union(crystal(0.04, 0.05, 40).rotateX(90), crystal(0.04, 0.03, 40).rotateX(-90)).at(...at);
      k.body('chest-gem', gem, { color: '#9a5ae0', roughness: 0.1, emissive: '#a060f0', emissiveIntensity: 0.5, flat: true, bone: 'gem', detail: 0.003 });
    },
    pose(clip, p) {
      const g = 1 + 0.06 * motion.wave(p, clip === 'hit' ? 1 : 2);
      return { gem: { scale: [g, g, g] } };
    },
  },
});
