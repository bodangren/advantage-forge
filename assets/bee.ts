import { insectAsset } from './parts/insect-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Bee — Chibi Quest wildlife (catalog `wildlife/insects/bee`), a round fuzzy honey bee about
 * 0.36 m tall to the antenna tips, faces +Z. Target: docs/wildlife-mockups/bee_001.jpg (made with
 * mmx).
 *
 * The insect of `assets/parts/insect-kind.ts` (body, head, wings, rig, and clips) at 0.45 of its
 * size, as a honey bee: a round yellow head with big glossy eyes and a smile, antennae with ball
 * tips, a fuzzy yellow thorax, a plump round abdomen with two black bands, a small stinger, small
 * clear wings, and six thin dark legs.
 * Role: ambient life in gardens, meadows, and farms (and a harmless swarm in the nature games);
 *   the yellow and black bands read at 128 px.
 * Palette (60/30/10): yellow #f2c030 head and body; black #2a2426 bands, antennae, and legs; pale
 *   clear wings; dark glossy eyes.
 */
export default scaleAsset(
  insectAsset({
    name: 'bee',
    description: 'Chibi bee: a round fuzzy honey bee with a big yellow head, big glossy dark eyes, a smile, antennae with ball tips, a plump yellow abdomen with black bands, a small stinger, small clear wings, and six thin dark legs; flyer rig.',
    reference: 'docs/wildlife-mockups/bee_001.jpg',
    variants: {
      body: { yellow: '#f2c030', amber: '#e8962a', white: '#f2ece0' },
      stripes: { black: '#2a2426', brown: '#5a3a24' },
      wings: { clear: '#e8f0f8', gold: '#f8ecc0' },
    },
    presets: {
      amber: { body: 'amber', stripes: 'brown', wings: 'gold' },
      ghost: { body: 'white', stripes: 'black', wings: 'clear' },
    },
    abdomen: 'round',
    head: 0.15,
    stripes: 1,
    invertStripes: true,
    // Dark at the top and the bottom of the body, one yellow band round the middle.
    stripeRange: [0.2, -0.2],
    legStyle: 'spread',
    eyeStyle: 'white',
    nose: '#e8a024',
    stinger: true,
    fuzz: 1,
    antennae: 'ball',
    wings: 'clear',
    wingScale: 1.4,
    restHover: 0.08,
  }),
  0.45,
);
