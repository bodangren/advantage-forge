import { toadAsset } from './parts/toad-kind.js';

/**
 * Frog — Chibi Quest wildlife (catalog `wildlife/water/frog`), a small upright green frog about
 * 0.38 m tall to the eyes, faces +Z. Target: docs/wildlife-mockups/frog_001.jpg (made with mmx).
 *
 * The toad of `assets/parts/toad-kind.ts` in its frog form (rig, tongue, and clips as the giant toad
 * of `assets/giant-toad.ts`) at 0.6 of its size: a slim upright body with a pale belly under a wide
 * squat head, huge glossy eyes on top with green lids, puffy cheeks, a full pale chin under a wide
 * closed smile, thin front legs straight down to the ground, and round haunches with darker spots
 * at the sides with the feet out.
 * Role: ambient life at ponds, rivers, and in the swamp; the huge lidded eyes and the pale chin read
 *   at 128 px. The giant toad stays the warty monster of the kind.
 * Palette (60/30/10): soft yellow-green #9cc84e skin with a matte clay sheen; a pale yellow belly and chin #eeeab0; white
 *   eyes with black pupils as the accent.
 */
export default toadAsset({
  name: 'frog',
  description: 'Chibi frog: a small upright soft yellow-green frog with a pale yellow belly and chin, huge glossy eyes with green lids on top of a wide squat head, puffy cheeks and a wide smile, thin front legs, and round spotted haunches; it can flick a long pink tongue.',
  reference: 'docs/wildlife-mockups/frog_001.jpg',
  variants: {
    skin: { green: '#9cc84e', lime: '#a8cc48', blue: '#4a8ac0', red: '#d0583e' },
    belly: { yellow: '#eeeab0', cream: '#f4eed8', white: '#f8f6f0' },
    eyes: { white: '#f6f4ee', gold: '#e8b830', amber: '#d87a1a' },
  },
  presets: {
    lime: { skin: 'lime', belly: 'cream', eyes: 'gold' },
    blue: { skin: 'blue', belly: 'white', eyes: 'white' },
    red: { skin: 'red', belly: 'yellow', eyes: 'amber' },
  },
  colors: { mouth: '#4a7a2a' },
  form: 'frog',
  size: 0.6,
});
