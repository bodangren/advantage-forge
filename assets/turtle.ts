import { profile, sdf } from '../src/index.js';
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Turtle — Chibi Quest wildlife (catalog `wildlife/water/turtle`), a small round turtle about 0.25 m
 * tall and 0.55 m from nose to tail, faces +Z. Target: docs/wildlife-mockups/turtle_001.jpg (made
 * with mmx).
 *
 * The lizard of `assets/parts/lizard-kind.ts` (trunk, legs, head on a neck, tail, rig, and clips) at
 * 0.55 of its size, as a turtle: a big round head on a long neck held forward, big dark glossy eyes at
 * the sides of the face, two nostril dots and a small red smile; a high domed shell of raised plates
 * with a cream rim band and a cream belly plate; four thick stubby legs with cream toenails; and a
 * short pointed tail.
 * Role: a pond and river animal; the domed shell with the round head reads at 128 px.
 * Palette (60/30/10): a dark green shell #3e8a3a; lime skin #b8d860; a cream rim, belly plate, and
 *   toenails #f2ecc0; dark eyes with white glints and a red smile.
 */
export default scaleAsset(
  lizardAsset({
    name: 'turtle',
    description: 'Chibi turtle: a small turtle with a high domed dark green shell of raised plates, a cream rim and belly plate, a big round lime head on a long neck, big dark glossy eyes, a small red smile, four thick stubby legs with cream toenails, and a short pointed tail; lizard rig.',
    reference: 'docs/wildlife-mockups/turtle_001.jpg',
    variants: {
      shell: { green: '#3a7d34', brown: '#7a5a32', teal: '#2e7a6a' },
      skin: { lime: '#b8d860', green: '#8ab84a', sand: '#d0c080' },
      belly: { cream: '#f2ecc0', pale: '#e8e4d0', yellow: '#f0d890' },
      eyes: { dark: '#1a1416', brown: '#4a2a18' },
    },
    presets: {
      tortoise: { shell: 'brown', skin: 'sand', belly: 'yellow', eyes: 'brown' },
      sea: { shell: 'teal', skin: 'green', belly: 'pale', eyes: 'dark' },
    },
    shell: 'shell',
    snout: 0.05,
    snoutWidth: 0.075,
    bulb: false,
    headOffset: [0, 0.06, 0.16],
    headScale: 1.35,
    eyes: 'side',
    eyeScale: 0.8,
    eyeAngle: 48,
    jaw: false,
    teeth: 0,
    tail: 0.4,
    legScale: 1.5,
    paint(skin, lizard) {
      // A small smile low on the front of the face, pushed through the head along Z.
      const [, hy, hz] = lizard.joints.HEAD_C;
      const smile = sdf.extrude(profile.arc(0.07, 0.013, 228, 312), 0.3).at(0, hy - 0.035, hz + 0.16);
      return skin.paintWhere(smile, '#b8392e', 0.003);
    },
  }),
  0.55,
);
