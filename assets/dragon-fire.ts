import { FIRE_PALETTE as C, dragonAsset } from './parts/dragon-kind.js';

/**
 * Fire dragon — Chibi Quest monster (catalog `monsters/dragon/dragon-fire`), about 1.0 m to the
 * horn tips and 1.0 m across the wings, faces +Z. Target: docs/monster-mockups/dragon-fire_001.jpg
 * (made with mmx; one front view).
 *
 * Role: the big monster of the P0 set (a boss for early areas), seen in 3D and as a 128 px
 *   sprite; the horns, the brows, the grin, and the wings must read.
 * One idea: a round red dragon that is half head, glaring under heavy black brows with a toothy
 *   grin, crowned by cream horns and an orange crest, with little orange bat wings spread wide.
 * Proportions (from the mockup): horn tips 0.99, crest 0.98, eyes 0.67, nostrils 0.59, grin
 *   0.48, chin 0.4, wing tips 0.46 at x 0.5, hands 0.25, a round belly from 0.39 to the ground.
 * Shape language: round masses (head, belly, feet) with sharp accents (horns, crest spikes,
 *   cheek frills, wing points, fangs, claws, tail fin).
 * Palette (60/30/10): red scales #d8463c (darker back); cream belly #f4e0a8 with tan lines;
 *   orange crest, wing membranes, and tail fin #f39a2a; cream horns; yellow eyes #f6c01e under
 *   black brows as the focal point.
 * Value plan: the black brows over the yellow eyes and the white teeth in the dark grin are the
 *   strongest contrast (focal point); the cream belly is the biggest light mass.
 * The body, the rig, and the clips are built in `assets/parts/dragon-kind.ts`, shared with the
 *   element dragons (dragon-ice, dragon-poison, dragon-shadow, dragon-storm).
 * Bodies: scales, jaw-scales, belly, horns, crest, crest-red, wing-membranes, wing-bones, claws,
 *   teeth, jaw-teeth, mouth, tongue, brows, fire-breath.
 * Rig: chibi humanoid (hips, spine, chest, neck, head, arms, legs) plus `jaw` and `breath` (the
 *   fire) under the head, `wing.L`/`wing.R`, and a three-bone tail. Clips: idle (breathing, wing
 *   flutter, tail sway), walk (a waddle), run, fly (a hovering wing beat), attack (a fire-breath
 *   roar: draw back with a full chest, hop forward, jaws wide, a level cone of fire), hit, death,
 *   roar (rear up with the wings spread, the jaws wide, a small puff of fire, a shake, a stomp).
 */


export default dragonAsset({
  name: 'dragon-fire',
  description: 'Chibi fire dragon monster: a huge red head with cream horns, an orange crest, black brows, and a toothy grin; small orange bat wings; a cream belly; and a finned tail.',
  reference: 'docs/monster-mockups/dragon-fire_001.jpg',
  // Color slots for different fire-dragon broods (the first option is the default look). The
  // horns, claws, teeth, mouth, brows, orange crest and wings, and the fire stay fixed.
  variants: {
    // Fire-dragon broods that read apart from the red at a glance: obsidian (black scales under the
    // fixed orange crest and wings, a lava look), a deep crimson, and copper.
    scales: { red: C.red, obsidian: '#3a2426', crimson: '#8e1e26', copper: '#aa5430' },
    belly: { cream: C.cream, gold: '#f2d488', ash: '#c8b8a0' },
    eyes: { yellow: C.eye, amber: '#f0901c', green: '#a6c43a' },
  },
  presets: {
    magma: { scales: 'obsidian', belly: 'gold', eyes: 'amber' },
    ember: { scales: 'crimson', belly: 'ash', eyes: 'yellow' },
    copper: { scales: 'copper', belly: 'cream', eyes: 'green' },
  },
});
