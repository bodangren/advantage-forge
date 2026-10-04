import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { curl } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Water elemental — Chibi Quest monster (catalog `monsters/elemental/water-elemental`), a floating
 * water spirit about 0.85 m tall, faces +Z. Target: docs/monster-mockups/water-elemental_001.jpg
 * (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * on a clear teal wisp body that tapers into a curled tail, with a wave crest on its head.
 * Role: a water caster of the elemental family; the clear teal body and the wave curls read at 128 px.
 * Palette (60/30/10): white head #eef7f5 with teal droplets; clear teal wisp #3cc4c8, lighter at
 *   the top; the crest in the same teal; cyan pupils.
 * Features: three wave curls on the `crown` bone (the middle one curling forward), and four small
 *   droplets on the head. In every clip the curls sway like water.
 */

const CYCLES: Record<string, number> = { idle: 2, walk: 2, attack: 2, hit: 1, death: 2, taunt: 2 };

export default spiritAsset({
  name: 'water-elemental',
  description: 'Chibi water elemental monster: a white egg head with a curling teal wave crest and droplets, dark eyes with cyan glowing pupils, on a clear teal wisp body that curls into a tail.',
  reference: 'docs/monster-mockups/water-elemental_001.jpg',
  variants: {
    body: { foam: '#eef7f5', pearl: '#f2f2ec', mist: '#e4eef4' },
    element: { teal: '#3cc4c8', sea: '#2f9ad0', lagoon: '#4ccfa6' },
    eyes: { cyan: '#6ff0ff', white: '#e8fbff', aqua: '#58f0c8' },
  },
  presets: {
    sea: { body: 'mist', element: 'sea', eyes: 'white' },
    lagoon: { body: 'pearl', element: 'lagoon', eyes: 'aqua' },
  },
  colors: { eye: '#10181e', pupilBase: '#0b3a46', mouth: '#1e3a44' },
  wisp: {
    roughness: 0.08,
    opacity: 0.82,
    glow: true,
    emissiveIntensity: 0.15,
    paint: (wisp, s) => {
      const top = rgb(s.tone('element', '#9ae8e6'));
      const deep = rgb(s.tone('element', '#2a96a8'));
      return wisp.paintFn((_x, y, _z, c) => {
        const out = mixRgb(c, top, Math.max(0, Math.min(1, (y - 0.22) / 0.1)) * 0.6);
        return mixRgb(out, deep, Math.max(0, Math.min(1, (0.13 - y) / 0.08)) * 0.5);
      });
    },
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.76, 0] } },
    build(k, s) {
      const crest = sdf.smoothUnion(
        0.02,
        curl([0, 0.74, -0.04], [0, 0, 1], 0.1, 1.2, 0.05),
        curl([0.11, 0.7, -0.06], [0.75, 0, 0.66], 0.07, 1.15, 0.038),
        curl([-0.11, 0.7, -0.06], [-0.75, 0, 0.66], 0.07, 1.15, 0.038),
      );
      const top = rgb(s.tone('element', '#9ae8e6'));
      const water = crest.bone('crown').paintFn((_x, y, _z, c) => mixRgb(c, top, Math.max(0, Math.min(1, (y - 0.8) / 0.1)) * 0.6));
      // Droplets on the cheeks and the brow, half sunk into the head.
      const drops = sdf.union(
        ...[
          [0.19, 0.58, 0.11, 0.02],
          [0.21, 0.35, 0.1, 0.015],
          [-0.17, 0.62, 0.12, 0.017],
          [-0.22, 0.38, 0.07, 0.014],
        ].map(([x, y, z, r]) => sdf.sphere(r!).at(...s.on(s.head, x!, y!, z!, -r! * 0.35))),
      );
      k.body('crest', sdf.union(water, drops.bone('head')), { color: s.tint.element, roughness: 0.06, opacity: 0.85, emissive: s.tint.element, emissiveIntensity: 0.15, detail: 0.004 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 1;
      return { crown: { rotate: [5 * motion.wave(p, n, 0.2), 0, 4 * motion.wave(p, n, 0.45)] } };
    },
  },
});
