import { sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Storytime bird — Chibi Sprouts song videos, weeks 2 and 6 (catalog-style prop; inventory section 5
 * row "bird": "blue in both weeks (one render; W2 four in a row on a branch; W6 one, beak open)").
 *
 * The ways of `assets/messenger-bird.ts` (the bird of `assets/parts/bird-kind.ts` at 0.4 of its
 * size) as a plain blue songbird: a blue body, back, head, and wing top, a light blue breast, large
 * layered wings with darker blue tips, pink feet, dark bead eyes, and a short grey beak held open at
 * rest so it reads as a singing bird. The carrier pigeon's leather collar, message tube, letter, wax
 * seal, and brass buckle are gone: this bird carries nothing.
 * Role: the bird of the week 2 and week 6 song videos, on the low branch and by the pond; the blue
 *   body and the open beak read at 128 px.
 * Palette (60/30/10): blue #3f6fa8 body, back, head, and wings; light blue #a9c8e8 breast; darker
 *   blue #2f5584 wing tips; a grey beak and pink feet.
 */
export default scaleAsset(
  birdAsset({
    name: 'storytime-bird',
    description: 'Chibi storytime bird: a small round blue songbird in one smooth clay shape, with large layered blue wings that end in darker blue tips, a blue tail, a light blue breast, rosy cheek patches, small black bead eyes, a short grey beak held open in a happy singing smile, and short legs with soft pink toes; bird rig with wings.',
    reference: 'docs/wildlife-mockups/messenger-bird_001.jpg',
    // One fixed look; the source's presets and its extra body options are not used.
    variants: {
      body: { blue: '#3f6fa8' },
      head: { blue: '#3f6fa8' },
      wings: { blue: '#3f6fa8' },
      eyes: { dark: '#2a1a12' },
    },
    colors: { belly: '#a9c8e8', flight: '#2f5584', scale: '#e88a8a', scaleDark: '#d47878', talon: '#6a5050' },
    body: [0.2, 0.18, 0.19],
    head: 0.168,
    beak: 'short',
    beakScale: 0.62,
    beakDroop: 14,
    beakColors: ['#7a7680', '#7a7680'],
    // The open happy beak at rest (W6 "one, beak open"): the lower half turns down about the jaw.
    beakOpen: 18,
    mouth: false,
    brows: false,
    eyeStyle: 'bead',
    eyeScale: 0.8,
    eyesOverPaint: true,
    talons: false,
    walkBob: 0.8,
    stillNeck: true,
    clay: true,
    featherBump: 0.003,
    featherOn: { body: false, head: false, wings: true },
    tailSlot: 'body',
    wingRest: -122,
    wingTurn: 60,
    wingOut: 0.05,
    wingScale: 0.7,
    wingSlim: 1.25,
    legLength: 0.2,
    wingStyle: 'paddle',
    neckScale: 1.15,
    headBlend: 0.06,
    oneBody: 0.03,
    cheeks: 0,
    paint(plumage, b) {
      const { HEAD_C, HR } = b.joints;
      const cheek = b.faceHit(HR * 0.62, HEAD_C[1] - HR * 0.3);
      return plumage.paintWhere(sdf.sphere(HR * 0.22).at(cheek[0], cheek[1], cheek[2]).mirror('x'), b.tone('head', '#f0a0a0', 0.4), 0.02);
    },
  }),
  0.4,
);
