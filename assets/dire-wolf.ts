import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Dire wolf — Chibi Quest monster (catalog `monsters/beast/dire-wolf`), about 0.8 m to the ear
 * tips and 0.75 m from nose to rump, faces +Z. Target: docs/monster-mockups/dire-wolf_001.jpg
 * (made with mmx; one front view).
 *
 * Role: a fast pack beast, seen in 3D and as a 128 px sprite; the grin and the brows must read.
 * One idea: a huge scowling wolf head with a toothy grin, framed by pointed cheek tufts, tall
 *   ears, and a spiky cream chest ruff, on a compact body with stubby legs and a bushy tail.
 * Shape language: round masses (head, body, paws) under sharp triangles (ears, cheek tufts,
 *   ruff points, fangs, tail tip): cute but dangerous.
 * Palette (60/30/10): dark slate fur #4a5058 (darker legs and back, lighter #6b737d on the chest
 *   and the lower cheeks); cream #ece2c0 (brows,
 *   muzzle, forelock, ruff, tail tip); tan ear insides #c49a7a; amber eyes #f0a020 as the accent.
 * Value plan: the cream muzzle and brows on the dark face, with the amber eyes between them, are
 *   the strongest contrast (focal point); the cream ruff is the second light mass.
 * Bodies: fur, cream (brows, muzzle, forelock, ruff, tail tip), nose, teeth, claws.
 * The body, the head, the rig, and the clips are shared with the beast kinds in
 *   `assets/parts/wolf-kind.ts`.
 * Rig: quadruped (hips, spine, neck, head, tail, front and back legs with shins, as the horned
 *   boar). Clips: idle (breathing, ear flick, tail sway), walk (trot), run, attack (a lunging bite),
 *   howl (a deep breath, then the nose to the sky with the jaw open).
 */

export default wolfAsset({
  name: 'dire-wolf',
  description: 'Chibi dire wolf monster: a huge scowling head with a toothy grin, cream brows and chest ruff, tall ears, amber eyes, and a bushy tail; quadruped rig.',
  reference: 'docs/monster-mockups/dire-wolf_001.jpg',
  // Color slots for individual wolves (the first option is the default look): real wolf coats,
  // markings, and eye colors.
  variants: {
    fur: { slate: '#4a5058', timber: '#5e5246', black: '#2e2c2c' },
    markings: { cream: '#ece2c0', tan: '#cfae84', silver: '#c8c8c4' },
    eyes: { amber: '#f0a020', gold: '#e8c830', ice: '#9fd3da' },
  },
  presets: {
    timber: { fur: 'timber', markings: 'cream', eyes: 'gold' },
    shadow: { fur: 'black', markings: 'tan', eyes: 'amber' },
    frost: { fur: 'slate', markings: 'silver', eyes: 'ice' },
  },
});
