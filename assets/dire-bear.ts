import { boarAsset } from './parts/boar-kind.js';

/**
 * Dire bear — Chibi Quest monster (catalog `monsters/beast/dire-bear`), a huge angry bear about
 * 0.8 m tall at the ears, faces +Z. Target: docs/monster-mockups/dire-bear_001.jpg (made with mmx
 * from the dire wolf mockup).
 *
 * The boar of `assets/horned-boar.ts` (body, head, rig, and clips from `assets/parts/boar-kind.ts`)
 * as a bear: warm brown fur, a cream muzzle with a black nose, round ears, small dark eyes under
 * heavy dark brows, round paws with short dark claws, and no horns, tusks, or mane.
 * Role: a big forest and mountain brute; the round ears and the cream muzzle on the huge head read
 *   at 128 px.
 * Palette (60/30/10): brown fur #9a5a34 (darker legs and back, lighter belly); a cream muzzle
 *   #f0dcb4; dark brown brows, eyes, and claws; a black nose.
 */
export default boarAsset({
  name: 'dire-bear',
  description: 'Chibi dire bear monster: a huge angry brown bear with a big round head, round ears, a cream muzzle with a black nose, small dark eyes under heavy brows, and round paws with dark claws; quadruped rig.',
  reference: 'docs/monster-mockups/dire-bear_001.jpg',
  variants: {
    fur: { brown: '#9a5a34', black: '#3a3230', grizzly: '#8a6a4a' },
    skin: { cream: '#f0dcb4', tan: '#c8a070', grey: '#b8b0a4' },
    eyes: { dark: '#2a1a12', amber: '#d88a1a', red: '#c8300c' },
    claws: { dark: '#3a2a22', bone: '#d8cdb0', black: '#1e1a18' },
  },
  presets: {
    black: { fur: 'black', skin: 'tan', eyes: 'amber', claws: 'bone' },
    grizzly: { fur: 'grizzly', skin: 'grey', eyes: 'red', claws: 'black' },
  },
  colors: { furDark: '#6e3e22', belly: '#b47a4e', lid: '#8a6a50', earInner: '#d8b48a', black: '#4a2a18', nostril: '#1a1416', ivoryBase: '#2a1e18' },
  ivorySlot: 'claws',
  horns: false,
  tuskScale: 0,
  mane: false,
  snout: 'bear',
  ears: 'round',
  feet: 'paws',
  eyeScale: 0.62,
  eyeGlow: 0,
});
