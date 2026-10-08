import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Avatar base — the Chibi Quest player avatar (docs/avatar-system.md section 3), 0.94 m tall
 * without hair, faces +Z. Equipment pieces dress it; the base itself wears plain underclothes.
 *
 * Role: every student's avatar, in the shop, on the profile page, and in every game, seen in 3D
 * and as a 128 px sprite. One idea: the hero set's friendly face on a plain, readable body that
 * any helmet, armor, or weapon fits, because every hero shares this skeleton and head.
 * Source: the rogue (`assets/rogue.ts`). The skeleton, the head, the face paint, the arms, and the
 * fists are the rogue's, unchanged, so every hero part and catalog piece fits as it fits a hero.
 * The torso is the hero torso of the chest-armor contract (bench/sonnet/briefs/torso-contract.md).
 * Proportions: eyes 0.63, chin 0.48, shoulders 0.38, belt 0.25, shirt hem 0.152, shoe tops 0.1.
 * Palette: skin #f2c7a4, hair #5a301d, a sky-blue shirt #5f84ad (the one tinted cloth), warm
 *   grey-brown trousers #4a3f36, brown shoes #7a4a2c.
 * Value plan: the dark hair frames the light face (focal point); the mid shirt holds the body; the
 *   dark trousers and shoes ground it.
 * Bodies: skin (head, neck, arms, fists, torso, legs, feet), hair (the `swept` style from
 *   `assets/parts/avatar-hair.ts`), undershirt, pants, shoes.
 * Color slots: skin, hair, eyes, cloth (the shirt). Presets: four looks; the class presets join
 *   with the starter sets (docs/avatar-system.md).
 * Rig: the shared hero skeleton (the rogue's), with `cloak` for back pieces and `knife.L`/`knife.R`
 *   at the grip in each fist (the offhand and mainhand anchors). Clips: idle, walk, run, attack,
 *   hit, rest, cheer, cast.
 */
export default humanoidAsset({
  name: 'avatar-base',
  description: 'The Chibi Quest player avatar: the hero face and skeleton in a plain shirt, trousers, and shoes, ready for equipment.',
  reference: 'docs/hero-mockups/rogue_001.jpg',
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
