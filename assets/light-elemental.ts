import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Light elemental — Chibi Quest monster (catalog `monsters/elemental/light-elemental`), a floating
 * light spirit about 0.95 m tall with its halo, faces +Z. Target:
 * docs/monster-mockups/light-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * on a glowing golden wisp body that tapers into a curled tail, with small wings on its head and
 * a golden halo above it.
 * Role: a holy caster of the elemental family; the halo and the glowing body read at 128 px.
 * Palette (60/30/10): pale cream head #fbf4dc; glowing gold wisp #ffd23c, paler at the top; a
 *   bright gold halo; gold pupils.
 * Features: two small three-feather wings on the sides of the head, and a halo on the `halo`
 *   bone (a child of the head) that floats above it and bobs in every clip.
 */

export default spiritAsset({
  name: 'light-elemental',
  description: 'Chibi light elemental monster: a pale cream egg head with small wings and a floating golden halo, dark eyes with gold glowing pupils, on a glowing golden wisp body that curls into a tail.',
  reference: 'docs/monster-mockups/light-elemental_001.jpg',
  variants: {
    body: { cream: '#fbf4dc', ivory: '#f8f6ee', peach: '#fbe8d8' },
    element: { gold: '#ffd23c', sun: '#ffb83a', pale: '#fff08a' },
    eyes: { gold: '#ffd85a', white: '#fffbe8', rose: '#ffb0c8' },
  },
  presets: {
    sun: { body: 'peach', element: 'sun', eyes: 'gold' },
    dawn: { body: 'ivory', element: 'pale', eyes: 'rose' },
  },
  colors: { eye: '#1a1610', pupilBase: '#5a4208', mouth: '#4a3420' },
  head: { roughness: 0.5 },
  wisp: {
    roughness: 0.35,
    glow: true,
    emissiveIntensity: 0.6,
    paint: (wisp, s) => {
      const pale = rgb(s.tone('element', '#fff2b0'));
      return wisp.paintFn((_x, y, _z, c) => mixRgb(c, pale, Math.max(0, Math.min(1, (y - 0.2) / 0.12)) * 0.7));
    },
  },
  extra: {
    bones: { halo: { parent: 'head', at: [0, 0.9, -0.02] } },
    build(k, s) {
      // Small wings: three rounded feathers fanning up and back from each side of the head.
      const feather = (len: number, deg: number) =>
        sdf
          .ellipsoid([len, 0.022, 0.01])
          .at(len * 0.8, 0, 0)
          .rotateZ(deg);
      const wing = sdf
        .smoothUnion(0.012, feather(0.07, 38), feather(0.06, 14), feather(0.045, -10))
        .rotateY(-25)
        .at(0.225, 0.56, -0.04)
        .mirror('x')
        .bone('head');
      k.body('wings', wing, { color: s.tint.body, roughness: 0.5, detail: 0.003 });
      // The halo: a gold ring above the head, tilted back a little.
      const halo = sdf.torus(0.12, 0.014).rotateX(-12).at(0, 0.9, -0.02);
      k.body('ring', halo, { color: '#ffd84a', roughness: 0.25, metalness: 0.3, emissive: '#ffd040', emissiveIntensity: 1.1, bone: 'halo', detail: 0.003 });
    },
    pose(clip, p) {
      const n = clip === 'hit' ? 1 : 2;
      return { halo: { move: [0, 0.012 * motion.wave(p, n, 0.25), 0], rotate: [3 * motion.wave(p, n), 0, 0] } };
    },
  },
});
