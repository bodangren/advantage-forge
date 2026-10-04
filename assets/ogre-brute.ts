import { ogreAsset } from './parts/ogre-kind.js';

/**
 * Ogre brute — Chibi Quest enemy (catalog `enemies/humanoid/ogre-brute`), about 1.3 m to the top
 * of its head (1.5 m to the tip of the club), faces +Z. Target: docs/enemy-mockups/ogre-brute_001.jpg.
 *
 * Role: the heaviest humanoid enemy, seen in 3D and as a 128 px sprite; the round belly, the raised
 *   club, and the two upward tusks must read.
 * One idea: a huge round-bellied tan ogre with a small head sunk into wide shoulders, a heavy brow,
 *   and a big club with a lashed stone spike raised in the right hand.
 * Built on the orc warrior (assets/orc-warrior.ts): the same skeleton with knee bones, the same face
 *   code, and the same clip set. Everything is designed in "orc space" (D) and each body is scaled
 *   by 1.25 when it is added (`put`); the skeleton joints and every `move` are scaled too, and
 *   rotations do not change with scale, so the reach solvers work in D as they are.
 * Shape language: round and massive (belly, shoulders, arms, fists) with sharp accents for menace
 *   (tusks, brow, the stone spike, ragged loincloth strips).
 * Palette (60/30/10): tan skin #c8925a, shade #a06f3f, belly light #d9a870; dark brown mane
 *   #5a3a22; leather #6e3f24; red cloth #b83a2e; rope #c2a06a; cream tusks #efe4cc as the accent.
 * Bodies: skin, mane, tusks, leather (bracers, anklet, belt buckle), cloth (wraps, red strips),
 *   hide (brown strips), rope (belt, tassel, lashing), club, spike.
 * Rig: the orc's skeleton without the topknot. The right arm is raised at rest and holds the club
 *   (rigid on `hand.R`). Clips: idle, walk, run, attack (a two-hand overhead smash with a ground
 *   shake), attack2 (a belly-first charge, then a backhand swipe), roar, hit, death.
 * The body, the rig, and the clips are shared with the ogre kinds in `assets/parts/ogre-kind.ts`.
 */
export default ogreAsset({
  name: 'ogre-brute',
  description:
    'Chibi ogre brute enemy: a huge round belly, a small head sunk into wide shoulders, two upward tusks, a dark mane and beard, three-band bracers, a rope belt, a ragged loincloth, and a big stone-spiked club.',
  reference: 'docs/enemy-mockups/ogre-brute_001.jpg',
  variants: {
    skin: { tan: '#c8925a', grey: '#8a8a7a', green: '#7aa23e' },
    cloth: { red: '#b83a2e', blue: '#3a5a9a', black: '#2e2a2c' },
    leather: { brown: '#6e3f24', dark: '#3f2818', tan: '#9a7448' },
    mane: { brown: '#5a3a22', black: '#241a14', red: '#7a3a1e' },
  },
  presets: {
    hillclan: { skin: 'tan', cloth: 'red', leather: 'brown', mane: 'brown' },
    stoneback: { skin: 'grey', cloth: 'black', leather: 'dark', mane: 'black' },
    bogbrute: { skin: 'green', cloth: 'blue', leather: 'tan', mane: 'red' },
  },
});
