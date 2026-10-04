import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Will-o-wisp — Chibi Quest monster (catalog `monsters/fey-and-spirit/will-o-wisp`), a floating
 * ghost-flame spirit about 0.95 m tall with its flames, faces +Z. Target:
 * docs/monster-mockups/will-o-wisp_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips),
 * made all of soft glowing sea-green ghost flame: the head and the wisp glow (the wisp is a little
 * see-through), with paler glowing spots, and three small flames rise from the head.
 * Role: a luring marsh spirit; the glow is the whole read at 128 px, so it stands out in dark
 *   swamp and dungeon scenes.
 * Palette (60/30/10): glowing sea green #7cecd2 with paler spots #c8fff0; dark eyes with cyan
 *   pupils; the flames go from sea green to near white at the tips.
 * Features: three flame tongues on the `crown` bone that flicker in every clip.
 */

const CYCLES: Record<string, number> = { idle: 4, walk: 3, attack: 3, hit: 2, death: 4, taunt: 4 };

export default spiritAsset({
  name: 'will-o-wisp',
  description: 'Chibi will-o-wisp monster: a floating spirit of soft glowing sea-green ghost flame with a round egg head, pale glowing spots, dark eyes with cyan pupils, a small smile, and three little flames on its head.',
  reference: 'docs/monster-mockups/will-o-wisp_001.jpg',
  variants: {
    body: { sea: '#7cecd2', blue: '#86c8f4', violet: '#bca4f4' },
    eyes: { cyan: '#5ff4ff', white: '#f0fffc', gold: '#ffe070' },
  },
  presets: {
    blue: { body: 'blue', eyes: 'white' },
    violet: { body: 'violet', eyes: 'gold' },
  },
  colors: { eye: '#0e1e1e', pupilBase: '#0b3a46', mouth: '#1a4a44' },
  head: {
    roughness: 0.3,
    glow: true,
    // Opaque: a see-through head would show the eye glass from behind.
    emissiveIntensity: 0.45,
    paint: (head, s) => {
      const pale = s.tone('body', '#c8fff0');
      const spots = sdf.union(
        ...[
          [0.15, 0.68, 0.1, 0.035],
          [-0.12, 0.72, 0.08, 0.028],
          [0.2, 0.6, -0.06, 0.03],
          [-0.2, 0.56, -0.08, 0.034],
          [0.05, 0.74, -0.14, 0.03],
          [-0.22, 0.42, 0.04, 0.024],
        ].map(([x, y, z, r]) => sdf.sphere(r!).at(...s.on(s.head, x!, y!, z!))),
      );
      return head.paintWhere(spots, pale, 0.012);
    },
  },
  wisp: {
    slot: 'body',
    roughness: 0.3,
    glow: true,
    emissiveIntensity: 0.5,
    opacity: 0.85,
    paint: (wisp, s) => {
      const pale = rgb(s.tone('body', '#c8fff0'));
      return wisp.paintFn((_x, y, _z, c) => mixRgb(c, pale, Math.max(0, Math.min(1, (0.12 - y) / 0.08)) * 0.6));
    },
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.76, 0] } },
    build(k, s) {
      const flames = sdf
        .smoothUnion(0.025, flameTongue(0, 0.74, 0, 6, 0.17, 0.05, 0.06), flameTongue(0.08, 0.72, -0.03, 30, 0.12, 0.038, 0.04), flameTongue(-0.08, 0.72, -0.03, -30, 0.12, 0.038, 0.04))
        .scale([1, 1, 0.85])
        .bone('crown');
      const tip = rgb(s.tone('body', '#eafff8'));
      const fire = flames.paintFn((_x, y, _z, c) => mixRgb(c, tip, Math.max(0, Math.min(1, (y - 0.8) / 0.1))));
      k.body('flames', fire, { color: s.tint.body, roughness: 0.3, emissive: s.tint.body, emissiveIntensity: 0.8, opacity: 0.9, detail: 0.004 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 2;
      const w = motion.wave(p, n);
      return { crown: { rotate: [4 * motion.wave(p, n, 0.3), 0, 6 * motion.wave(p, n / 2, 0.1)], scale: [1 - 0.05 * w, 1 + 0.14 * w, 1 - 0.05 * w] } };
    },
  },
});
