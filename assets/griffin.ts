import { griffinAsset } from './parts/griffin-kind.js';

/**
 * Griffin — Chibi Quest monster (catalog `monsters/beast/griffin`), about 1.0 m to the crest and
 * 1.0 m across the raised wings, faces +Z. Target: docs/monster-mockups/griffin_001.jpg (made
 * with mmx; one front three-quarter view). The body, the rig, and the clips are the griffin kind
 * in `assets/parts/griffin-kind.ts`; this file sets the slots.
 *
 * Role: the mount of the griffin games (Gryphon Patrol, Griffin Sky-Joust, Griffin Riders
 *   Escape) and a sky beast elsewhere; seen mostly in flight, in 3D and as a 128 px sprite. The
 *   beak, the eyes, and the wings must read from the side and from behind.
 * One idea: a big round white eagle head with a hooked yellow beak and bold amber eyes, a white
 *   feather ruff, on a small tan lion body with yellow eagle feet, under two wings of dark brown
 *   coverts and cream flight feathers.
 * Shape language: round masses (head, body) with pointed feathers (crest, cheek tufts, ruff)
 *   and a sharp hooked beak and talons; brave rather than menacing.
 * Palette (60/30/10): tan coat #d9944f (darker legs, lighter belly); white plumage #f6f1e6 with
 *   cream shade; dark brown coverts and tail tuft #6b4430; cream flight feathers #f1dfa6; yellow
 *   beak, brows, and feet #efc341; amber eyes #e07a24 as the accent.
 * Value plan: the dark eye rings and pupils in the white head, under the yellow brows, are the
 *   strongest contrast (focal point); the white head and ruff are the biggest light mass; the
 *   dark coverts frame it from behind.
 * Bodies: coat (body, legs, feet, tail), plumage (head, crest, tufts, ruff, the eyes painted),
 *   beak, jawBeak, mouth, talons, tuft, wingArms, coverts, flight.
 * Rig: quadruped (as the dire wolf: hips, spine, neck, head, jaw, tail, legs with shins) plus
 *   `wing.L`/`wing.R`. Clips: idle, walk, run (trots), fly (a hover with full wing beats, the
 *   legs tucked), attack (a diving strike from the air, beak open, talons forward), hit (a jolt
 *   in the air), roar (a rear-up screech with the wings spread wide), death.
 */
export default griffinAsset({
  name: 'griffin',
  description: 'Chibi griffin monster: a big white eagle head with a hooked yellow beak and amber eyes, a white feather ruff, a tan lion body on yellow eagle feet, and wings of dark brown and cream feathers; quadruped rig with wings.',
  reference: 'docs/monster-mockups/griffin_001.jpg',
  variants: {
    coat: { tan: '#d9944f', golden: '#e0ab4c', ash: '#a39282' },
    plumage: { white: '#f6f1e6', cream: '#efe2c4', silver: '#d9dde0' },
    wings: { brown: '#6b4430', chestnut: '#8a4a2c', slate: '#4e5560' },
    eyes: { amber: '#e07a24', gold: '#e8b830', sky: '#6aa8d8' },
  },
  presets: {
    golden: { coat: 'golden', plumage: 'cream', wings: 'chestnut', eyes: 'gold' },
    storm: { coat: 'ash', plumage: 'silver', wings: 'slate', eyes: 'sky' },
  },
});
