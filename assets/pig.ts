import { sdf } from '../src/index.js';
import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pig — Chibi Quest wildlife (catalog `wildlife/farm/pig`), about 0.55 m tall at the ears and 0.68 m
 * from snout to tail, faces +Z. Target: docs/wildlife-mockups/pig_001.jpg (made with mmx).
 *
 * The boar of `assets/parts/boar-kind.ts` (body, head, rig, and clips) at 0.75 of its size, as a
 * farm pig: smooth pink skin, a pink snout disc, big glossy dark eyes, rosy cheeks, a smile, a curly
 * tail, and dark hooves; no horns, tusks, mane, brows, or teeth.
 * Role: a farm and village animal; the round pink body, the snout, and the curly tail read at
 *   128 px.
 * Palette (60/30/10): pink skin #f2a8a8 (a little darker on the legs, lighter on the belly); a
 *   deeper pink snout #e88486; dark grey hooves; dark eyes with a white glint as the accent.
 */
export default scaleAsset(
  boarAsset({
    name: 'pig',
    description: 'Chibi pig: a round pink farm pig with big glossy dark eyes, rosy cheeks, a smile, a pink snout disc, pointed ears, a curly tail, and dark hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/pig_001.jpg',
    variants: {
      fur: { pink: '#f2a8a8', spotted: '#f0c8b8', black: '#4a4044', ginger: '#d8905a' },
      skin: { pink: '#e88486', rose: '#d86a74', grey: '#8a7a7a' },
      eyes: { dark: '#2a1a12', brown: '#5a3a1a', blue: '#3a5a8a' },
    },
    presets: {
      cream: { fur: 'spotted', skin: 'pink', eyes: 'brown' },
      black: { fur: 'black', skin: 'grey', eyes: 'dark' },
      ginger: { fur: 'ginger', skin: 'rose', eyes: 'blue' },
    },
    colors: { furDark: '#e08e92', belly: '#f8c0bc', earInner: '#e0787e', black: '#4a3a3c' },
    // No horns, tusks, or claws: the unused ivory color follows the skin slot.
    ivorySlot: 'skin',
    horns: false,
    tuskScale: 0,
    mane: false,
    tail: 'curl',
    eyeScale: 1.35,
    eyeGlow: 0,
    brows: false,
    lids: false,
    teeth: false,
    paint(fur, boar) {
      // Rosy cheeks beside the snout, under the eyes.
      const cheek = boar.faceHit(0.15, 0.4);
      const blush = boar.tone('skin', '#f08a8a', 0.5);
      return fur.paintWhere(sdf.sphere(0.04).at(cheek[0], cheek[1], cheek[2]).mirror('x'), blush, 0.03);
    },
  }),
  0.75,
);
