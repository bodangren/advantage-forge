import { goblinAsset } from './parts/goblin-kind.js';

/**
 * Goblin warrior — Chibi Quest enemy (catalog `enemies/humanoid/goblin-warrior`), about 0.93 m
 * to the tip of its hair tuft, faces +Z. Target: the four-view turnaround in
 * reference-designs/chibi-goblin-warrior-20260925/ (front, three-quarter, left side, back).
 *
 * Role: the first common enemy, seen in 3D and as a 128 px sprite; the ears and the grin read.
 * One idea: a big round green head with huge swept-back leaf ears, a sly toothy grin, and one
 *   chunky dagger held up; the ears are the silhouette.
 * Proportions (from the turnaround, on the rogue's body): head center 0.7, eyes 0.655, chin 0.51,
 *   ear tips 0.37 out and 0.82 high, shoulders 0.45, belt 0.28, tunic hem 0.18, boot cuffs 0.12.
 * Shape language: round (head, cheeks, fists, big boots) with sharp points for menace (ears,
 *   fang, dagger, jagged hem); one soft crest of hair leans back on the crown.
 * Palette (60/30/10): olive-green skin #b8ba4e; browns (tunic #86573a, leather #965d31, pouch
 *   #c98c42, boots #86593b); a red-orange scarf #de6233 as the accent under the face;
 *   blue-grey steel #7e8a9d on one shoulder; cream wraps #e4c496.
 * Value plan: the light eye whites and dark brows are the strongest contrast (focal point); the
 *   scarf is the strongest color; the dark pants and boots ground the figure.
 * Identity cues kept from the design: a nicked left ear, one left shoulder guard, a diagonal
 *   strap (left shoulder to right hip), a pouch on the left hip, wrapped forearms, boots, and a
 *   short dagger in the right hand.
 * Bodies: skin, teeth, tunic, scarf, leather, pouch, brass, pauldron, pauldron-rim, wraps,
 *   pants, boots, blade, hilt.
 * Rig: the rogue's chibi skeleton plus `ear.L`/`ear.R` and `knot` (scarf tails); the dagger is
 *   rigid on `dagger`, a child of `hand.R` that the death clip moves (the dagger drops) and the
 *   taunt turns (one spin in the fingers).
 *   Clips: idle, walk, run, attack, hit, death, taunt (point the dagger at the player, hop from
 *   foot to foot twice, spin the dagger once; plays when the goblin first sees the player).
 * The body, the rig, and the clips are shared with the goblin kinds in `assets/parts/goblin-kind.ts`.
 */
export default goblinAsset({
  name: 'goblin-warrior',
  description: 'Chibi goblin warrior enemy with huge leaf ears, a toothy grin, a red scarf, one shoulder guard, and a dagger.',
  reference: 'reference-designs/chibi-goblin-warrior-20260925/chibi-goblin-warrior-turnaround.png',
  // Color slots for individual goblins (the first option is the default look).
  variants: {
    eyes: { amber: '#5e2812', yellow: '#8f7010', red: '#7a0e0a' },
    skin: { olive: '#a0a446', moss: '#6b7c34', grey: '#8a9676' },
    clothing: { brown: '#86573a', slate: '#58616c', crimson: '#7a2e2a' },
    scarf: { ember: '#de6233', purple: '#7a3c9c', teal: '#2f8c88' },
  },
  presets: {
    bog: { eyes: 'yellow', skin: 'moss', clothing: 'brown', scarf: 'teal' },
    cave: { eyes: 'red', skin: 'grey', clothing: 'slate', scarf: 'purple' },
    raider: { eyes: 'yellow', skin: 'olive', clothing: 'crimson', scarf: 'teal' },
  },
});
