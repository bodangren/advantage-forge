import { mixRgb, motion, profile, rgb, sdf } from '../src/index.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Storm elemental — Chibi Quest monster (catalog `monsters/elemental/storm-elemental`), a floating
 * thundercloud spirit about 1 m tall with its bolt, faces +Z. Target:
 * docs/monster-mockups/storm-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * all in dark storm-cloud slate, with a ringed wisp body, orange glowing eyes, and a glowing
 * lightning bolt crest.
 * Role: a lightning caster of the elemental family; the yellow bolt on the dark head reads at
 *   128 px.
 * Palette (60/30/10): slate #4a5866 head and body, darker rings on the body; a glowing yellow bolt
 *   #ffd630; orange pupils.
 * Features: cloud rings around the wisp body, and a lightning bolt on the `crown` bone that
 *   jitters like a spark in every clip.
 */

export default spiritAsset({
  name: 'storm-elemental',
  description: 'Chibi storm elemental monster: a dark slate egg head with a glowing yellow lightning bolt crest, orange glowing eyes, on a ringed storm-cloud wisp body that curls into a tail.',
  reference: 'docs/monster-mockups/storm-elemental_001.jpg',
  variants: {
    body: { slate: '#4a5866', thunder: '#3c4458', ash: '#5e6268' },
    element: { bolt: '#ffd630', white: '#f0f4ff', violet: '#c49aff' },
    eyes: { orange: '#ffa830', yellow: '#ffe050', blue: '#8ad0ff' },
  },
  presets: {
    thunder: { body: 'thunder', element: 'white', eyes: 'blue' },
    ash: { body: 'ash', element: 'violet', eyes: 'yellow' },
  },
  colors: { eye: '#101418', pupilBase: '#5a2e08', mouth: '#16191e' },
  head: { roughness: 0.6 },
  wisp: {
    slot: 'body',
    roughness: 0.65,
    paint: (wisp, s) => {
      const dark = rgb(s.tone('body', '#323c48'));
      // Cloud rings: soft ridges around the body, darker in the grooves.
      const ring = (y: number) => Math.cos(y * 70);
      return wisp
        .displace(0.006, (_x, y) => (y < 0.31 ? ring(y) : 0))
        .paintFn((_x, y, _z, c) => mixRgb(c, dark, y < 0.31 ? Math.max(0, -ring(y)) * 0.55 : 0));
    },
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.76, 0] } },
    build(k, s) {
      // A lightning bolt: a zigzag that stands on the top of the head, facing forward.
      const bolt = profile.polygon([
        [0.03, 0],
        [0.1, 0.17],
        [0.04, 0.155],
        [0.115, 0.32],
        [-0.05, 0.13],
        [0.012, 0.138],
        [-0.055, 0],
      ]);
      const crest = sdf.extrude(bolt, 0.04, 0.01).at(0, 0.72, -0.02);
      k.body('bolt', crest, { color: s.tint.element, roughness: 0.3, emissive: s.tint.element, emissiveIntensity: 0.9, bone: 'crown', detail: 0.003 });
    },
    pose(clip, p) {
      // A spark jitter: small quick twitches.
      const j = motion.wave(p, clip === 'death' ? 8 : 6, 0.1) * motion.wave(p, 3, 0.3);
      return { crown: { rotate: [0, 8 * j, 5 * j], scale: [1, 1 + 0.06 * j, 1] } };
    },
  },
});
