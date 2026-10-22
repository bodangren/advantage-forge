import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Sprout base: Chibi Sprouts age-5 body (the humanoid kind at five years old), about 0.85 m tall
 * without hair, faces +Z. Role: the base of every Sprout and child in the Chibi Sprouts renders
 * (kindergarten cast), seen as large transparent renders. One idea: the same big-eyed chibi head
 * and face as the Chibi Quest hero on a smaller body, so the head is half of the height.
 * Shape language: round and soft. Palette: the avatar base (skin #f2c7a4, hair #5a301d, sky shirt
 *   #5f84ad, grey-blue pants, brown shoes); the head and its face paint are the hero's.
 * Body: `AGE5` proportions (assets/parts/humanoid-kind.ts): the torso is an upright 0.84 copy of
 *   the hero torso, the arms 0.8, the legs 1.05. The skeleton, the bone names, the clips, and the
 *   fist grips are the hero's, so clothes code on `h.torso`, `h.band`, and `h.joints` still works.
 * Bodies: skin, hair (swept), undershirt, pants, shoes. Clips: idle, walk, run, attack, hit,
 *   rest, cheer, cast.
 */
export default humanoidAsset({
  name: 'sprout-base',
  description: 'Chibi Sprouts age-5 base: the humanoid kind at five years old',
  reference: 'docs/sprout-mockups/pat.jpg',
  proportions: AGE5,
  pants: '#6a7a94',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    sunny: { skin: 'fair', hair: 'blond', eyes: 'blue', cloth: 'rose' },
    forest: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
    night: { skin: 'deep', hair: 'black', eyes: 'brown', cloth: 'slate' },
    frost: { skin: 'light', hair: 'silver', eyes: 'violet', cloth: 'linen' },
  },
});
