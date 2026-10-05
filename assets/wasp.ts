import { insectAsset } from './parts/insect-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Wasp — Chibi Quest wildlife (catalog `wildlife/insects/wasp`), a slim wasp about 0.36 m tall to
 * the antenna tips, faces +Z. Target: docs/wildlife-mockups/wasp_001.jpg (made with mmx).
 *
 * The insect of `assets/parts/insect-kind.ts` at 0.45 of its size, as a wasp: a round yellow head
 * with big glossy eyes and a grin, long curled antennae, a smooth yellow thorax, a thin waist, a pointed
 * abdomen with three black bands, a stinger, clear wings, and six thin dark legs.
 * Role: a field and orchard insect for the nature games; the narrow waist and the pointed striped
 *   abdomen make it different from the round bee at 128 px.
 * Palette (60/30/10): yellow #f2c81a head and body; black #2a2426 bands, antennae, and legs; clear
 *   wings; dark glossy eyes.
 */
export default scaleAsset(
  insectAsset({
    name: 'wasp',
    description: 'Chibi wasp: a slim wasp with a round yellow head, big glossy dark eyes, a grin, long curled antennae, a thin waist, a pointed yellow abdomen with black bands, a stinger, clear wings, and six thin dark legs; flyer rig.',
    reference: 'docs/wildlife-mockups/wasp_001.jpg',
    variants: {
      body: { yellow: '#f2c81a', orange: '#e8862a', red: '#c8442a' },
      stripes: { black: '#2a2426', brown: '#4a2e1e' },
      wings: { clear: '#e8f0f8', smoke: '#c8c8d0' },
    },
    presets: {
      hornet: { body: 'orange', stripes: 'brown', wings: 'smoke' },
      fire: { body: 'red', stripes: 'black', wings: 'clear' },
    },
    abdomen: 'level',
    abdomenLength: 1.2,
    neckBand: true,
    legStyle: 'hang',
    stripes: 3,
    stinger: true,
    antennae: 'curl',
    head: 0.125,
    wings: 'clear',
    eyeScale: 0.95,
    wingScale: 1.25,
    restHover: 0.08,
    colors: { mouth: '#d8502a' },
  }),
  0.45,
);
