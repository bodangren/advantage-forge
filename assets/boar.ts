import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Boar — Chibi Quest wildlife (catalog `wildlife/forest/boar`), about 0.6 m tall at the ears and
 * 0.72 m from snout to tail, faces +Z. Target: docs/wildlife-mockups/boar_001.jpg (made with mmx).
 *
 * The giant boar of `assets/giant-boar.ts` (body, head, rig, and clips from
 * `assets/parts/boar-kind.ts`) at 0.8 of its size, as a friendly forest boar: big glossy dark eyes
 * without brows or lid rings, short ivory tusks, a low black mane, and no teeth.
 * Role: a common forest animal for hunting and farm scenes; the pink snout and the tusks read at
 *   128 px. The giant boar stays the angry monster of the kind.
 * Palette (60/30/10): chocolate-brown fur #7a5236 (darker legs and back, lighter belly); a pink
 *   snout #e88a86; black mane, tuft, and hooves; ivory tusks; dark eyes with a white glint.
 */
export default scaleAsset(
  boarAsset({
    name: 'boar',
    description: 'Chibi boar: a friendly brown forest boar with big glossy dark eyes, a pink snout, short ivory tusks, pointed ears, a low black mane, and black hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/boar_001.jpg',
    variants: {
      fur: { brown: '#7a5236', grey: '#6a625c', russet: '#8a4a2a', dark: '#4a3a30' },
      skin: { pink: '#e88a86', dusky: '#a88078', slate: '#7a6e70' },
      eyes: { dark: '#2a1a12', green: '#3e6a2a', amber: '#8a5a1a' },
      tusks: { ivory: '#efe6cf', yellowed: '#e0cc98', bone: '#c8c2b2' },
    },
    presets: {
      grey: { fur: 'grey', skin: 'slate', eyes: 'dark', tusks: 'bone' },
      russet: { fur: 'russet', skin: 'dusky', eyes: 'amber', tusks: 'yellowed' },
      dark: { fur: 'dark', skin: 'pink', eyes: 'green', tusks: 'ivory' },
    },
    colors: { furDark: '#5a3a24', belly: '#9a7050', earInner: '#d8807e', black: '#2a2420' },
    ivorySlot: 'tusks',
    horns: false,
    tuskScale: 0.6,
    maneScale: 0.55,
    eyeScale: 1.35,
    eyeGlow: 0,
    brows: false,
    lids: false,
    teeth: false,
  }),
  0.8,
);
