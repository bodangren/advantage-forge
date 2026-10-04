import { boarAsset } from './parts/boar-kind.js';

/**
 * Horned boar — Chibi Quest monster (catalog `monsters/beast/giant-boar`, as its horned variant),
 * about 0.9 m from snout to tail and 0.86 m to the horn tips, faces +Z. Target:
 * docs/monster-mockups/horned-boar_001.jpg (made with mmx; one three-quarter view).
 *
 * Role: a common beast enemy and the bench's calibration creature, seen in 3D and as a 128 px
 *   sprite; the head, horns, tusks, and eyes must read.
 * One idea: a boar that is all head and shoulders: a huge angry head with a pink snout disc,
 *   upturned tusks, and cream horns sweeping out and up, on a stocky body with stubby legs.
 * Shape language: round and chunky (head, snout, body, legs) for the chibi set, with sharp
 *   triangles for menace (horns, tusks, ear tips, black mane spikes, tail tuft).
 * Palette (60/30/10): clay-brown fur #a8683a (darker legs and back, lighter belly); cream horns
 *   and tusks #efe6cf; a pink snout and ear insides #e7848a; black mane, brows, and hooves
 *   #26221f; glowing orange eyes #ff8a1a as the accent.
 * Value plan: the black brows over the bright eyes are the strongest contrast (focal point); the
 *   cream horns and tusks frame the head; the pink snout is the second accent.
 * Bodies: fur, snout, teeth, eyes (emissive), pupils, mane (spikes, brows, tail tuft), horns,
 *   tusks, hooves.
 * The body, the head, the rig, and the clips are shared with the giant boar in
 *   `assets/parts/boar-kind.ts`.
 * Rig: quadruped (hips, spine, neck, head, tail, front and back legs with shins). Clips: walk
 *   (trot), charge, idle (sniffing), attack (a one-shot gore), hit, death, taunt (two snorts and
 *   two hoof scrapes before a charge).
 */

export default boarAsset({
  name: 'horned-boar',
  description: 'Chibi horned boar monster: a huge angry head, pink snout, upturned tusks, cream horns, a black spiky mane, and glowing eyes; quadruped rig.',
  reference: 'docs/monster-mockups/horned-boar_001.jpg',
  variants: {
    fur: { brown: '#a8683a', ash: '#4a423d', russet: '#9a4222' },
    skin: { pink: '#e7848a', dusky: '#9a7e74', slate: '#5e5a62' },
    eyes: { orange: '#f26a0a', red: '#e8200c', yellow: '#f2c010' },
    horns: { ivory: '#efe6cf', dark: '#4a3e34', bone: '#b8b4a8' },
  },
  presets: {
    forest: { fur: 'brown', skin: 'dusky', eyes: 'yellow', horns: 'dark' },
    ash: { fur: 'ash', skin: 'slate', eyes: 'red', horns: 'bone' },
    blood: { fur: 'russet', skin: 'pink', eyes: 'red', horns: 'ivory' },
  },
});
