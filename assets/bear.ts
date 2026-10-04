import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Bear — Chibi Quest wildlife (catalog `wildlife/forest/bear`), a brown bear cub about 0.62 m tall
 * at the ears and 0.75 m from nose to tail, faces +Z. Target: docs/wildlife-mockups/bear_001.jpg
 * (made with mmx).
 *
 * The dire bear of `assets/dire-bear.ts` (body, head, rig, and clips from
 * `assets/parts/boar-kind.ts`) at 0.82 of its size, as a friendly bear cub: bigger glossy dark eyes
 * without brows or lid rings, a tan muzzle with a black nose, round ears, dark paws, and short dark
 * claws. The dire bear stays the angry monster of the kind.
 * Role: a forest and mountain animal; the round ears and the tan muzzle read at 128 px.
 * Palette (60/30/10): brown fur #8a5434 (darker legs and back, lighter belly); a tan muzzle
 *   #e0b886; dark brown paws and claws; a black nose; dark eyes with a white glint.
 */
export default scaleAsset(
  boarAsset({
    name: 'bear',
    description: 'Chibi bear: a friendly brown bear cub with a big round head, round ears, a tan muzzle with a black nose, big glossy dark eyes, a round body, dark paws with short claws, and a stub tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/bear_001.jpg',
    variants: {
      fur: { brown: '#8a5434', black: '#3a3230', honey: '#b07a40', grey: '#7a6a5e' },
      skin: { tan: '#e0b886', cream: '#f0dcb4', grey: '#b8b0a4' },
      eyes: { dark: '#2a1a12', amber: '#8a5a1a', blue: '#3a5a8a' },
      claws: { dark: '#3a2a22', bone: '#d8cdb0', black: '#1e1a18' },
    },
    presets: {
      black: { fur: 'black', skin: 'tan', eyes: 'amber', claws: 'bone' },
      honey: { fur: 'honey', skin: 'cream', eyes: 'dark', claws: 'dark' },
      grizzly: { fur: 'grey', skin: 'grey', eyes: 'blue', claws: 'black' },
    },
    colors: { furDark: '#5e3620', belly: '#a87048', earInner: '#d8a878', black: '#4a2a18', nostril: '#1a1416', ivoryBase: '#2a1e18' },
    ivorySlot: 'claws',
    horns: false,
    tuskScale: 0,
    mane: false,
    snout: 'bear',
    ears: 'round',
    feet: 'paws',
    eyeScale: 1.1,
    eyeGlow: 0,
    brows: false,
    lids: false,
  }),
  0.82,
);
