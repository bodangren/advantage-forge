import { slimeAsset, slimeTones } from './parts/slime-kind.js';

/**
 * Slime — Chibi Quest monster (catalog `monsters/small/slime`), about 0.49 m tall and 0.66 m wide,
 * faces +Z. Target: docs/monster-mockups/slime_001.png (the slime king on the Chibi Quest enemy
 * sheet; the plain slime leaves out the king's crown, cape, and chain).
 *
 * Role: the first, weakest monster, seen in 3D and as a 128 px sprite; the face must read.
 * One idea: a glossy green jelly with a grumpy glare, a head dome sitting on a wider
 *   belly that settles into a puddle with round drips, and little bubbles floating around it.
 * Shape language: all round and soft (dome, belly, drips, bubbles), with the heavy slanted brow
 *   ridges and the frown as the only hard accents.
 * Palette: ONE constant, `SLIME` (#52c832). Every other color is mixed from it (lighter top,
 *   darker base and puddle, pale bubbles, dark brows and mouth, lime irises). White eyes with dark
 *   pupils are the focal point.
 * Variants: slot `jelly` (the body and its dark tones), slot `highlight` (the light top and the
 *   floating bubbles), and slot `eyes` (lime, amber, frost), with the presets fire, ice, and poison.
 *   The mixed tones join a slot in `build` as exact colors that follow it. The light tones have
 *   their own slot: the game recolors by multiplying, and green's small red and blue channels
 *   would blow a light tone out to pink or violet if it followed the jelly.
 * Value plan: the white eyes, the dark pupils, and the dark frown on the mid-green face are the
 *   strongest contrast; the lighter top and the darker puddle give the jelly its volume.
 * The body, the rig, and the clips are built in `assets/parts/slime-kind.ts`, shared with the
 *   element slimes (green-slime, fire-slime, ice-slime, poison-slime).
 * Bodies: jelly (glossy, a faint glow, with bubbles painted under its skin), eyes, bubbles (three
 *   floating, a little see-through), acid-glob (the spit shot; hidden outside the spit).
 * Rig: `core` (root, on the ground: squash and stretch), `top` (the dome's jiggle and the face),
 *   `bubble1` to `bubble3` (the floating bubbles; their poses cancel the core's squash and travel,
 *   so they float on their own), `eye.L` and `eye.R` (children of `top`, so the eyes can close),
 *   `glob` (under `core`; the acid glob, hidden at scale 0.001 inside the body outside the spit).
 *   Clips: idle (wobble, bubbles drift), walk (hops), attack (a leaping body slam and a hop back),
 *   hit (a squashed recoil and jiggle), death (a wobble, then it melts into a puddle, the eyes
 *   sink, and the bubbles pop), spit (it squashes and swells its cheeks, stretches up and forward,
 *   and spits an acid glob about 1 m forward in an arc, then jiggles back to rest).
 */


/** The one slime color; the default option of the `jelly` slot. Everything else is mixed from it. */
const SLIME = '#52c832';
const tones = slimeTones(SLIME);

export default slimeAsset({
  name: 'slime',
  description: 'Chibi green slime monster: a glossy see-through jelly with a grumpy glare, a head dome on a wider belly, round drips at its base, and floating bubbles.',
  reference: 'docs/monster-mockups/slime_001.png',
  variants: {
    jelly: { green: SLIME, fire: '#b8340a', ice: '#58b8ec', poison: '#46244f' },
    highlight: { green: tones.top, fire: '#ffa010', ice: '#c8e6fa', poison: '#703070' },
    eyes: { lime: tones.iris, amber: '#ffb43c', frost: '#a8e4ff' },
  },
  presets: {
    fire: { jelly: 'fire', highlight: 'fire', eyes: 'amber' },
    ice: { jelly: 'ice', highlight: 'ice', eyes: 'frost' },
    poison: { jelly: 'poison', highlight: 'poison', eyes: 'lime' },
  },
});
