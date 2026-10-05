import { profile, sdf } from '../src/index.js';
import { insectAsset } from './parts/insect-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Bee — Chibi Quest wildlife (catalog `wildlife/insects/bee`), a round fuzzy honey bee about
 * 0.36 m tall to the antenna tips, faces +Z. Target: docs/wildlife-mockups/bee_001.jpg (made with
 * mmx).
 *
 * The insect of `assets/parts/insect-kind.ts` (body, head, wings, rig, and clips) at 0.45 of its
 * size, as a honey bee: a smooth round yellow head with big glossy black eyes and a round muzzle
 * with a wide smile, antennae with ball tips, a big fuzzy body about as wide as the head with two
 * black bands, a small stinger, clear wings, and six thin bent legs that dangle in flight (the rest
 * pose hovers).
 * Role: ambient life in gardens, meadows, and farms (and a harmless swarm in the nature games);
 *   the yellow and black bands read at 128 px.
 * Palette (60/30/10): yellow #f2c030 head and body; black #2a2426 bands, antennae, and legs; pale
 *   clear wings; dark glossy eyes.
 */
export default scaleAsset(
  insectAsset({
    name: 'bee',
    description: 'Chibi bee: a round fuzzy honey bee with a big yellow head, big glossy black eyes, a round muzzle with a wide smile, antennae with ball tips, a big fuzzy yellow body with two wide black bands, a small stinger, clear wings, and six thin bent dark legs that dangle in the air; flyer rig.',
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
    head: 0.145,
    // Two wide black bands round the plump body, yellow between them and at the top.
    stripes: 2,
    stripeRange: [0.15, -0.17],
    legStyle: 'dangle',
    eyeStyle: 'dark',
    eyeScale: 1.2,
    stinger: true,
    fuzz: 0,
    bodySize: 1.05,
    pompom: 0.009,
    antennae: 'ball',
    wings: 'clear',
    wingScale: 1.4,
    restHover: 0.32,
    extra(k, b) {
      // A round muzzle forward from the lower face, with a wide smile across it.
      const { HEAD_C, HR } = b.joints;
      const at = b.faceHit(0, HEAD_C[1] - HR * 0.36);
      const c: [number, number, number] = [0, at[1], at[2] - HR * 0.1];
      const muzzle = sdf
        .ellipsoid([HR * 0.5, HR * 0.32, HR * 0.3])
        .at(...c)
        .paintWhere(sdf.extrude(profile.arc(HR * 0.36, HR * 0.055, 214, 326), 0.4).at(0, c[1] + HR * 0.23, c[2] + 0.2), '#5a2a14', 0.002);
      k.body('muzzle', muzzle.bone('head'), { color: b.tint.head, roughness: 0.55, detail: 0.003, textureDensity: 2 });
    },
  }),
  0.45,
);
