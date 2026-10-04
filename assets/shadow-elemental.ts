import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Shadow elemental — Chibi Quest monster (catalog `monsters/elemental/shadow-elemental`), a
 * floating shadow spirit about 0.95 m tall with its smoke, faces +Z. Target:
 * docs/monster-mockups/shadow-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * all in dark violet, with cat ears, violet glowing eyes, and two wisps of smoke that rise from
 * its head.
 * Role: a sneaky shadow caster of the elemental family; the cat ears, the glowing eyes, and the
 *   smoke read at 128 px against a dark dungeon.
 * Palette (60/30/10): dark violet #3c3060 head and body, lighter #6a5a9a toward the tail; violet
 *   eye glass #5a2e9a; bright lilac pupils; clear violet smoke.
 * Features: two cat ears on the head, and two smoke wisps on the `crown` bone that sway.
 */

export default spiritAsset({
  name: 'shadow-elemental',
  description: 'Chibi shadow elemental monster: a dark violet egg head with cat ears and two rising wisps of smoke, violet eyes with bright lilac glowing pupils, on a dark wisp body that curls into a tail.',
  reference: 'docs/monster-mockups/shadow-elemental_001.jpg',
  variants: {
    body: { violet: '#3c3060', night: '#2a2c48', plum: '#4a2a48' },
    element: { smoke: '#a07ae0', ash: '#8a8aa8', rose: '#d07ab8' },
    eyes: { lilac: '#e0b0ff', green: '#8affb0', amber: '#ffc060' },
  },
  presets: {
    night: { body: 'night', element: 'ash', eyes: 'green' },
    plum: { body: 'plum', element: 'rose', eyes: 'amber' },
  },
  colors: { eye: '#5a2e9a', pupilBase: '#3a1a66', mouth: '#16101e' },
  head: { roughness: 0.5 },
  wisp: {
    slot: 'body',
    roughness: 0.5,
    paint: (wisp, s) => {
      const light = rgb(s.tone('body', '#6a5a9a'));
      return wisp.paintFn((_x, y, _z, c) => mixRgb(c, light, Math.max(0, Math.min(1, (0.16 - y) / 0.12)) * 0.8));
    },
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.76, -0.04] } },
    build(k, s) {
      // Cat ears: rounded cones on the top of the head, a little apart, with a lighter inner ear.
      const ear = sdf.cone([0.13, 0.68, -0.01], [0.2, 0.86, 0.0], 0.075, 0.012).scale([1, 1, 0.7]);
      const inner = sdf.cone([0.14, 0.7, 0.04], [0.195, 0.83, 0.03], 0.04, 0.008);
      const ears = ear.paintWhere(inner, s.tone('element', '#7a5aa8', 0.6), 0.006).mirror('x').bone('head');
      k.body('ears', ears, { color: s.tint.body, roughness: 0.5, detail: 0.004 });
      // Smoke: two thin wavy wisps that rise from the back of the head and lean outward.
      const smoke = sdf.union(flameTongue(0.05, 0.72, -0.1, 24, 0.24, 0.03, 0.06), flameTongue(-0.06, 0.71, -0.12, -30, 0.2, 0.026, 0.06)).bone('crown');
      k.body('smoke', smoke, { color: s.tint.element, roughness: 0.6, opacity: 0.7, emissive: s.tint.element, emissiveIntensity: 0.3, detail: 0.004 });
    },
    pose(clip, p) {
      const n = clip === 'hit' ? 1 : 2;
      return { crown: { rotate: [6 * motion.wave(p, n, 0.2), 0, 8 * motion.wave(p, n)], scale: [1, 1 + 0.08 * motion.wave(p, n, 0.4), 1] } };
    },
  },
});
