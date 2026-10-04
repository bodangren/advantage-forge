import { golemAsset } from './parts/golem-kind.js';

/**
 * Stone golem — Chibi Quest P1 dungeon enemy, about 1 m tall, faces +Z.
 * Target: docs/enemy-mockups/stone-golem_001.jpg (one front view).
 *
 * Base: assets/minotaur-guard.ts (the same stocky rig, knee bones, and clip set; the bull head,
 *   horns, fur, armor, and maul are gone, and the attack is a two-fist ground slam).
 * Role: a slow, heavy dungeon brute; at 128 px the huge boulder shoulders, the fists, and the
 *   three blue glows (two eyes, one chest rune) must read.
 * One idea: a hunched heap of chiselled grey boulders around a mossy sage-stone core, a big
 *   square head sunk between the shoulders (heavy grey brow ridge and cheek visor, two glowing rune
 *   eyes under the brow), and rock fists as big as the head.
 * Proportions: head 0.3 m wide, top 0.99, eyes 0.85, shoulder boulders 0.94 top and 0.5 m out, rune 0.64,
 *   belt 0.28 to 0.43, fists 0.15 to 0.42 (three stacked chamfered blocks, two green knuckle stones), knee blocks 0.25 top, feet 0.13 top.
 * Palette: grey stone #575b5e (slot `stone`); sage core #6b8769 and olive plates #5a6e3e (they
 *   follow the stone slot partly); moss #56752a / #3d561b on the tops; glow #3fd6ff (slot `glow`) on a
 *   dark base.
 * Chest: moss-green plates (two pecs, three rows of abs per side) on dark seams around the rune.
 * Bodies: core (head, neck, trunk, upper arms, knuckles, thighs), mantle (shoulder boulders,
 *   collar, rune plate; rigid on the chest), belt (rigid on the hips), limbs (forearm and fist
 *   blocks, knee blocks, feet), eyes, rune.
 * Rig: the minotaur's chibi humanoid without the forelock bone. Clips: idle, walk, run, attack (a
 *   two-fist ground slam), attack2 (a shoulder charge and a backhand swipe), roar, hit, death.
 * The body, the rig, and the clips are shared with the golem kinds in `assets/parts/golem-kind.ts`.
 */
export default golemAsset({
  name: 'stone-golem',
  description: 'Chibi stone golem: a hunched heap of grey boulders with moss on the tops, a small head sunk between huge boulder shoulders, glowing rune eyes and chest rune, huge blocky fists, and short thick legs.',
  reference: 'docs/enemy-mockups/stone-golem_001.jpg',
  // Color slots for individual golems (the first option is the default look).
  variants: {
    stone: { grey: '#575b5e', sandstone: '#a08a6a', basalt: '#45474a' },
    glow: { blue: '#3fd6ff', green: '#56e38e', orange: '#ff9838' },
  },
  presets: {
    desert: { stone: 'sandstone', glow: 'orange' },
    deep: { stone: 'basalt', glow: 'green' },
    ember: { stone: 'basalt', glow: 'orange' },
  },
});
