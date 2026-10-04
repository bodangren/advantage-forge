import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Ghost — Chibi Quest dungeon denizen (catalog `enemies/undead/ghost`, P1, the Sunken Vault), a
 * cute-spooky floater about 0.8 m tall, faces +Z. Target: docs/enemy-mockups/ghost_001.jpg.
 *
 * Role: a slow, haunting dungeon enemy, seen in 3D and as a 128 px sprite; the big egg head, the
 *   dark eyes with their cyan glow, and the wavy sheet hem must read.
 * One idea: a round pale egg of a head on a little draped sheet that flares into a wavy hem and
 *   curls into a wispy tail on its left, two stubby arms held out, and two tiny stub feet.
 * Proportions: head 0.265 to 0.8 (widest 0.25 at the eyes), eyes 0.44, mouth 0.36, arms 0.3,
 *   hem 0.03 to 0.06; the lowest point of the tail touches y = 0 in the rest pose.
 * Shape language: round and soft everywhere (egg head, bell sheet, blunt arms, rounded hem lobes);
 *   the only sharp shapes are the crisp rims of the eye hollows.
 * Palette (60/30/10): pale blue-white #dff2f8 on the head, cooler #bfe6f0 low on the sheet; near
 *   black eyes #16151d; glowing cyan pupils #3fe0ff as the accent.
 * Value plan: the dark eye hollows on the pale head are the strongest contrast (focal point); the
 *   glowing pupils sit high in them.
 * Bodies: ghost (head, sheet, arms, feet, tail), eyes, pupils. The head, the face, the rig, and the
 *   clips are shared with the elementals in `assets/parts/spirit-kind.ts`.
 * Rig: root, body, head, arm.L/arm.R, a three-bone tail (tail1 to tail3). The lower sheet and the
 *   feet ride the root, so the hem lags when the body leans. Clips: idle (hover bob, tail sway),
 *   walk (float forward, leaning), attack (a "boo" lunge with both arms up), hit (knocked back,
 *   squash), death (spins down and shrinks into the floor), taunt (arms wave, spooky wobble).
 */

const C = {
  body: '#dff2f8',
  pupil: '#3fe0ff',
};

export default spiritAsset({
  name: 'ghost',
  description: 'Chibi ghost dungeon enemy: a pale blue-white egg head on a wavy sheet with a curled wispy tail, stubby arms, dark hollow eyes with glowing cyan pupils, and a small smile.',
  reference: 'docs/enemy-mockups/ghost_001.jpg',
  lower: 'sheet',
  // Color slots for individual ghosts (the first option is the default look): the pale body and
  // the glow of the pupils. The dark eye hollows and the mouth stay fixed.
  variants: {
    body: { pale: C.body, mint: '#daf5e6', lavender: '#e8e2f7', grey: '#e4e7ea' },
    eyes: { cyan: C.pupil, green: '#5cf08c', violet: '#b48cff' },
  },
  presets: {
    wisp: { body: 'mint', eyes: 'green' },
    phantom: { body: 'lavender', eyes: 'violet' },
    shade: { body: 'grey', eyes: 'cyan' },
  },
});
