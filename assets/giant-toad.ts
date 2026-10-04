import { noise, sdf } from '../src/index.js';
import { toadAsset } from './parts/toad-kind.js';

/**
 * Giant toad — Chibi Quest monster (catalog `monsters/beast/giant-toad`), a big round toad about
 * 0.64 m tall to the eyes, faces +Z. Target: docs/monster-mockups/giant-toad_001.jpg (made with mmx
 * from the giant lizard mockup).
 *
 * The toad of `assets/parts/toad-kind.ts` (a squat body, eye bumps, a wide smile, a pale belly,
 * chunky front legs, folded back legs, a hidden tongue, rig, and clips): olive green skin with warts
 * and round yellow spots on the flanks and the back, a pale yellow belly, and big golden eyes. The
 * attack lashes the long pink tongue.
 * Role: a swamp beast; the eye bumps, the wide smile, and the yellow belly read at 128 px.
 * Palette (60/30/10): olive #62803a skin; pale yellow #f2e49a belly; yellow #f0d040 spots and golden
 *   #f2c030 eyes as the accent.
 */
export default toadAsset({
  name: 'giant-toad',
  description: 'Chibi giant toad monster: a big round olive green toad with warts and round yellow spots, a pale yellow belly, big golden eyes on top, a wide smile, chunky front legs, and folded back legs; it lashes a long pink tongue.',
  reference: 'docs/monster-mockups/giant-toad_001.jpg',
  variants: {
    skin: { olive: '#62803a', brown: '#8a6a40', teal: '#3a8a7a' },
    belly: { yellow: '#f2e49a', cream: '#f2ead0', peach: '#f4cca0' },
    eyes: { gold: '#f2c030', orange: '#f08a2a', green: '#a8d040' },
    spots: { yellow: '#f0d040', orange: '#f0a050', white: '#f4f0e0' },
  },
  presets: {
    mud: { skin: 'brown', belly: 'cream', eyes: 'orange', spots: 'orange' },
    reed: { skin: 'teal', belly: 'peach', eyes: 'green', spots: 'white' },
  },
  paint(skin, toad) {
    // Round yellow spots on the flanks and the back (not on the belly or the face).
    const spots = sdf.union(
      ...Array.from({ length: 14 }, (_, i) => {
        const a = noise.random(i, 11, 5) * Math.PI * 1.3 + Math.PI * 0.35;
        const side = i % 2 === 0 ? 1 : -1;
        const y = 0.12 + noise.random(i, 13, 2) * 0.3;
        const p = sdf.surfacePoint(toad.body, [side * Math.sin(a) * 0.3, y, Math.cos(a) * 0.3 - 0.05], 0);
        return sdf.sphere(0.022 + noise.random(i, 17, 4) * 0.014).at(...p);
      }),
    );
    return skin.paintWhere(spots, toad.tone('spots', '#f0d040'), 0.003);
  },
});
