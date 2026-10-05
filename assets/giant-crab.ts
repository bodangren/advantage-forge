import { crabAsset } from './parts/crab-kind.js';

/**
 * Giant crab — Chibi Quest monster (catalog `monsters/beast/giant-crab`), about 0.85 m to the tips
 * of its raised claws, faces +Z. Target: docs/monster-mockups/giant-crab_001.jpg (made with mmx from
 * the giant spider mockup).
 *
 * The giant spider (`assets/giant-spider.ts`; thorax, eight legs, rig, and clips from
 * `assets/parts/spider-kind.ts`) as a giant crab: the head is a wide, low red dome (the shell) with a
 * cream underside; no abdomen, fangs, leg bands, chest mark, or web spit; a grumpy face painted on
 * the shell front (two dot eyes and a flat mouth); two white eyeballs on stalks on top; and two big
 * claws raised on arms (the outer finger of each claw opens on its own bone).
 * Role: a beach and sea-cave enemy; the raised claws and the eye stalks read at 128 px.
 * Palette (60/30/10): red #e8503a; cream underside #f4e4c8; dark leg tips; white eyeballs with
 *   black pupils as the accent.
 * Bodies added: stalks and eyeballs (rigid on the head), claws (tagged to the arms).
 * Clips: idle (the claws snap), walk, run, attack (the spider's lunge, with the claws swung forward
 *   and snapping), hit, death.
 */
export default crabAsset({
  name: 'giant-crab',
  description: 'Chibi giant crab monster: a wide red shell with a cream underside, a grumpy painted face, two white eyeballs on stalks, two big raised claws, and eight short red legs with dark tips.',
  reference: 'docs/monster-mockups/giant-crab_001.jpg',
  variants: {
    body: { red: '#e8503a', blue: '#3a7ab8', orange: '#e88a2a' },
    markings: { cream: '#f4e4c8', white: '#f8f6f0', sand: '#e8d0a0' },
    eyes: { black: '#1a1416', brown: '#4a2a18', green: '#2a4a20' },
  },
  presets: {
    blue: { body: 'blue', markings: 'white', eyes: 'brown' },
    hermit: { body: 'orange', markings: 'sand', eyes: 'green' },
  },
});
