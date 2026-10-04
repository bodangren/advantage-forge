import { birdAsset } from './parts/bird-kind.js';

/**
 * Giant eagle — Chibi Quest monster (catalog `monsters/beast/giant-eagle`), a big round eagle about
 * 0.85 m tall, faces +Z. Target: docs/monster-mockups/giant-eagle_001.jpg (made with mmx from the
 * griffin mockup).
 *
 * The bird of `assets/parts/bird-kind.ts` (egg body, head, beak, legs, wings, rig, and clips) as a
 * bald eagle: a big dark brown egg body, a white head with a hooked yellow beak, white brow ridges,
 * and fierce amber eyes, dark brown wings that hang beside the body at rest, a white tail fan, and
 * yellow feet with black talons.
 * Role: a mountain sky beast; the white head on the dark body and the hooked beak read at 128 px.
 * Palette (60/30/10): dark brown #5a3a2a body and wings; white #f6f2ea head and tail; a yellow
 *   beak and feet #f0c030 and amber eyes as the accent; black talons.
 */
export default birdAsset({
  name: 'giant-eagle',
  description: 'Chibi giant eagle monster: a big dark brown egg-shaped eagle with a white head, a hooked yellow beak, fierce amber eyes, dark brown wings, a white tail, and yellow feet with black talons; bird rig with wings.',
  reference: 'docs/monster-mockups/giant-eagle_001.jpg',
  variants: {
    body: { brown: '#5a3a2a', golden: '#9a6a30', grey: '#5a5a62' },
    head: { white: '#f6f2ea', cream: '#ecdcb8', grey: '#d0d0d4' },
    wings: { brown: '#4a2e20', chestnut: '#7a4a24', slate: '#3e4048' },
    eyes: { amber: '#e8a020', gold: '#f0c838', red: '#d8402a' },
  },
  presets: {
    golden: { body: 'golden', head: 'cream', wings: 'chestnut', eyes: 'gold' },
    storm: { body: 'grey', head: 'grey', wings: 'slate', eyes: 'red' },
  },
  colors: { belly: '#62402e', flight: '#3a2418' },
  body: [0.24, 0.26, 0.22],
  head: 0.135,
  brows: 'head',
  eyeScale: 0.8,
  wingRest: -95,
  wingTurn: -35,
  wingScale: 0.72,
  tailSlot: 'head',
});
