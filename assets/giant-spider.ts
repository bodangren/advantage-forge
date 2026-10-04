import { spiderAsset } from './parts/spider-kind.js';

/**
 * Giant spider — Chibi Quest monster (catalog `monsters/small/giant-spider`), about 0.53 m tall and
 * 0.95 m across the legs, faces +Z. Target: docs/monster-mockups/giant-spider_001.jpg (made with
 * mmx; one front view). As in the mockup, a big round head sits on a round thorax ball with an
 * orange splat; a big abdomen behind (with an orange skull) keeps it a spider from above and behind.
 *
 * Role: a creepy cave and forest enemy, seen in 3D and as a 128 px sprite; the eyes, the fangs,
 *   and the eight legs must read, also from above.
 * One idea: a fuzzy dark purple spider with two huge glaring red eyes under a heavy wrinkled
 *   brow, six small white eyeballs on top, pale fangs, and eight chunky legs banded in orange.
 * Shape language: round masses (head, thorax, abdomen, eyes) with sharp accents (fangs, pointed
 *   claw tips, the angry brow).
 * Palette (60/30/10): dark purple #3e2a52 (darker underside, near-black claw tips #1c1226); orange
 *   #f08a2a bands, splat, and skull; red irises #d8282a in white eyeballs as the accent; pale
 *   fangs #efe6d0.
 * Value plan: the white eyeballs with red irises on the dark head are the strongest contrast
 *   (focal point); the orange splat and skull are the second. The head tilts up 14 degrees, so the
 *   eyes also read in top-down sprites.
 * Bodies: carapace (head, thorax, abdomen, splat and skull marks), legs (with bands and claws),
 *   brows, eyes, small-eyes, fangs, web-glob (the spit shot; hidden outside the spit).
 * Rig: `body` (root), `head`, `abdomen`, `fang.L`/`fang.R`, `webshot` (under `head`; the web glob
 *   waits inside the head at scale 0.001), and per leg a `leg<n>` (femur) and `shin<n>` bone on
 *   each side. Planted legs are solved with `reach`, so the tips stay put.
 *   Clips: idle, walk (an alternating four-leg gait), run, attack (rear up with the front legs
 *   raised and the fangs open, lunge and bite, recover), spit (rock back with the abdomen curled
 *   up, jerk forward, and a web glob flies 1 m from between the fangs), hit, death (curls up and
 *   rolls onto its back).
 * The body, the rig, and the clips are shared with the spider kinds in `assets/parts/spider-kind.ts`.
 */
export default spiderAsset({
  name: 'giant-spider',
  description:
    'Chibi giant spider monster: a fuzzy purple head with two huge glaring red eyes, six small white eyeballs, pale fangs, eight chunky orange-banded legs, a round thorax with an orange splat, and a big abdomen with an orange skull.',
  reference: 'docs/monster-mockups/giant-spider_001.jpg',
  // Color slots for individual spiders (the first option is the default look).
  variants: {
    // Real spider colorings: a tarantula (brown, orange), a black widow (black, red), a garden
    // spider (grey, yellow). No candy greens.
    body: { purple: '#3e2a52', brown: '#4a3426', black: '#221c24', grey: '#3c3a40' },
    markings: { orange: '#f08a2a', red: '#b02a20', yellow: '#d0b048' },
    eyes: { red: '#d8282a', yellow: '#f2c62a', green: '#52c63a' },
  },
  presets: {
    cave: { body: 'brown', markings: 'orange', eyes: 'yellow' },
    widow: { body: 'black', markings: 'red', eyes: 'red' },
    tomb: { body: 'grey', markings: 'yellow', eyes: 'green' },
  },
});
