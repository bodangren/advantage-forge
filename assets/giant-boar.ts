import { boarAsset } from './parts/boar-kind.js';

/**
 * Giant boar — Chibi Quest monster (catalog `monsters/beast/giant-boar`), about 0.9 m from snout
 * to tail, faces +Z. Target: docs/monster-mockups/giant-boar_001.jpg (made with mmx from the
 * horned boar mockup).
 *
 * The boar of `assets/horned-boar.ts` (body, head, rig, and clips from `assets/parts/boar-kind.ts`)
 * without horns: dark brown bristly fur, big curved ivory tusks (1.5 times as long), a taller
 * black mane (1.6 times as high), a pink snout, and angry red eyes.
 * Role: the plain wild boar of the forests, a common beast enemy; the tall black mane and the big
 *   tusks make the silhouette at 128 px (the horned boar is its horned variant).
 * Palette (60/30/10): dark brown fur #6e4a34 (darker legs and back, lighter belly); black mane,
 *   brows, and hooves; ivory tusks; pink snout; red eyes as the accent.
 */
export default boarAsset({
  name: 'giant-boar',
  description: 'Chibi giant boar monster: a huge angry head with a pink snout, big curved ivory tusks, a tall black spiky mane, red eyes, and dark brown bristly fur; quadruped rig.',
  reference: 'docs/monster-mockups/giant-boar_001.jpg',
  variants: {
    fur: { brown: '#6e4a34', grey: '#5a5450', russet: '#8a4a2a' },
    skin: { pink: '#e08088', dusky: '#9a7e74', slate: '#5e5a62' },
    eyes: { red: '#e8300c', orange: '#f26a0a', yellow: '#f2c010' },
    tusks: { ivory: '#efe6cf', yellowed: '#e0cc98', bone: '#b8b4a8' },
  },
  presets: {
    grey: { fur: 'grey', skin: 'slate', eyes: 'yellow', tusks: 'bone' },
    russet: { fur: 'russet', skin: 'dusky', eyes: 'orange', tusks: 'yellowed' },
  },
  colors: { furDark: '#4a3022', belly: '#8a6448' },
  ivorySlot: 'tusks',
  horns: false,
  tuskScale: 1.5,
  maneScale: 1.6,
});
