import { impAsset } from './parts/imp-kind.js';

/**
 * Imp — Chibi Quest dungeon monster (catalog `monsters/small/imp`), a small flyer about 0.8 m to
 * the horn tips and 1.0 m across the wings, faces +Z. Target: docs/monster-mockups/imp_001.png
 * (cropped from docs/character-mockups/chibi-quest-enemies.png).
 *
 * Role: a fast, pesky dungeon enemy, seen in 3D and as a 128 px sprite; the horns, the grin, and
 *   the wings must read.
 * One idea: a big-headed little red devil with curved horns, a wicked fanged grin, and bat wings
 *   spread wide, reaching with its claws while its legs and arrow-tipped tail dangle.
 * Proportions: head center 0.52 (radius 0.15), eyes 0.51, horn tips 0.8, chest 0.33, the toes
 *   touch the ground in the rest pose; the idle and fly clips lift it into a hover.
 * Shape language: round (head, belly, eyes) with many sharp points (horns, ears, fangs, claws,
 *   wing fingers, tail tip): cute but dangerous.
 * Palette (60/30/10): red skin #d8503c (darker on the back); dark brown horns, claws, and wing
 *   bones #4a2e24; orange-red wing membranes #e0704a; amber eyes #e8a030 as the accent.
 * Value plan: the light amber eyes with dark pupils under dark brows, and the white fangs, are the
 *   strongest contrast (focal point); the dark horns frame the head.
 * Bodies: skin, eyes, horns, claws, teeth, wing-membranes, wing-bones, fireball.
 * The head, the body, the rig, and the clips are shared with the devil kinds in
 *   `assets/parts/imp-kind.ts`.
 * Rig: hips, spine, chest, neck, head, wings, arms, legs with shins and feet, a three-bone
 *   tail, and `orb` (under the hips) for the fireball, hidden (scale 0.001) outside the cast.
 *   Clips: idle (hover), fly (forward flight), attack (a diving claw swipe), hit (a jolt back in
 *   the hover), death (a tumble to the floor, on its back), cast (a thrown fireball).
 */

export default impAsset({
  name: 'imp',
  description: 'Chibi imp dungeon monster: a big-headed little red devil with curved horns, a fanged grin, amber eyes, bat wings, claws, and an arrow-tipped tail.',
  reference: 'docs/monster-mockups/imp_001.png',
  // Color slots for individual imps (the first option is the default look): infernal hides, wing
  // membranes, eyes, and horns. The fire, the teeth, the claws, and the wing bones stay fixed.
  variants: {
    skin: { red: '#d8503c', maroon: '#8c2430', soot: '#523a3a' },
    wings: { ember: '#e0704a', sulfur: '#c88c3c', ash: '#5e4c4a' }, // ash: dark smoke, not pale
    eyes: { amber: '#e8a030', yellow: '#f0d030', acid: '#9ad02a' },
    horns: { brown: '#4a2e24', bone: '#8a8074', black: '#2a2224' },
  },
  presets: {
    cinder: { skin: 'soot', wings: 'ember', eyes: 'yellow', horns: 'bone' },
    brimstone: { skin: 'red', wings: 'sulfur', eyes: 'acid', horns: 'black' },
    ash: { skin: 'maroon', wings: 'ash', eyes: 'amber', horns: 'black' },
  },
});
