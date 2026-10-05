import { batAsset } from './parts/bat-kind.js';

/**
 * Giant bat — Chibi Quest dungeon monster, a flyer: a fur ball about 0.44 m across with ears to
 * 0.72 m and a 1.0 m wingspan, faces +Z. Target: docs/monster-mockups/giant-bat_001.jpg (made
 * with mmx; one front view).
 *
 * Role: a fast cave pest that swoops in groups, seen in 3D and as a 128 px sprite; the ears, the
 *   yellow eyes, the pink nose, the fangs, and the wings must read.
 * One idea: a round, shaggy purple fur ball with huge pointed ears, glaring yellow eyes under
 *   heavy brows, a pink pig snout over two long fangs, and pink-membraned wings spread wide.
 * Proportions: the ball center 0.3 (radius 0.22), eyes 0.35, ear tips 0.72, wing tips out to
 *   x 0.49; tiny feet touch the ground in the rest pose; the clips lift it into a hover.
 * Shape language: one big round mass (friendly) with sharp accents (fur spikes, ear tips, fangs,
 *   wing claws, scalloped membranes) for menace.
 * Palette (60/30/10): purple fur #5c4670 (lighter tips, darker below); dark purple wing bones and ear rims
 *   #43324f; pink membranes, ear insides, snout, and feet #e08a8e; yellow eyes #f2c21c as the accent.
 * Value plan: the yellow eyes under the dark brows and the white fangs are the strongest contrast
 *   (focal point); the pink snout and ear insides are the second.
 * Bodies: fur, ears, eyes, brows, snout, mouth, teeth, wing-membranes, wing-bones, feet, claws;
 *   on the jaw: jawFur, jawMouth, jawTeeth, tongue; the dark throat inside the ball.
 * Rig: body (root), jaw, ear.L/R, wing.L/R with wingtip.L/R at the knuckle, foot.L/R. Clips: idle
 *   (hover), fly (forward flight), attack (a swooping bite), hit, death, screech (a threat display
 *   with spread wings, a wide open jaw, and a fast shake).
 */
export default batAsset({
  name: 'giant-bat',
  description: 'Chibi giant bat dungeon monster: a shaggy purple fur ball with huge pointed ears, glaring yellow eyes, a pink pig snout, two long fangs, and pink-membraned wings.',
  reference: 'docs/monster-mockups/giant-bat_001.jpg',
  // Color slots for individual bats (the first option is the default look): natural bat fur, the
  // bare skin (the wing membranes, the snout, the ear insides, and the feet), and the eyes. The
  // eye rims, the pupils, the nostrils, the mouth, the tongue, the teeth, and the claws stay fixed.
  variants: {
    fur: { purple: '#5c4670', brown: '#5e4636', charcoal: '#3a3638' },
    skin: { pink: '#e08a8e', dusky: '#9c7c76', leather: '#5e443c' },
    eyes: { yellow: '#f2c21c', amber: '#f0921a', red: '#d83a22' },
  },
  presets: {
    cave: { fur: 'brown', skin: 'dusky', eyes: 'amber' },
    vampire: { fur: 'charcoal', skin: 'leather', eyes: 'red' },
    dusk: { fur: 'purple', skin: 'dusky', eyes: 'red' },
  },
});
