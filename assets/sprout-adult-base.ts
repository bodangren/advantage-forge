import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Sprout adult base: the Chibi Sprouts adult body (the humanoid kind grown up), about 1.3 m
 * tall without hair, faces +Z. Role: the base of Mom, Dad, Grandma, and Grandpa in the week 4
 * renders (the family cast), seen large next to the age-5 children (about 0.9 m, sprout-pat).
 * One idea: the same big-eyed chibi head and face as the children on a grown-up body, so Mom
 * reads about 1.5x the children and Dad is the tallest of the family.
 * Shape language: round and soft. Palette: neutral plain clothes (a linen shirt, grey-brown
 * trousers, brown shoes); the head and its face paint are the hero's.
 * Body: `ADULT` proportions (assets/parts/humanoid-kind.ts): the same head and face, a torso
 * grown taller than wide, arms 1.5x, legs 1.8x. The skeleton, the bone names, the clips, and
 * the fist grips are the hero's, so clothes code on `h.torso`, `h.band`, and `h.joints` works.
 * Bodies: skin, hair (swept), undershirt, pants, shoes, the singing face. Clips: idle, walk,
 * run, attack, hit, rest, cheer, cast, and the Sprout gesture clips.
 * No presets: the family members declare their own looks, so the pin of every preset is as is.
 */
export default humanoidAsset({
  name: 'sprout-adult-base',
  description: 'Chibi Sprouts adult base: the humanoid kind grown up (Mom reads about 1.5x the age-5 children)',
  reference: 'docs/sprout-mockups/cast-lineup.jpg',
  proportions: ADULT,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9e' },
    cloth: { linen: '#cdbb94', sky: '#5f84ad', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },

  extra(k, h) {
    sproutGestures(k, h, ADULT);
  },
});
