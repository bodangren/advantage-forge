import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Crocodile — Chibi Quest wildlife (catalog `wildlife/water/crocodile`), a low friendly crocodile about
 * 0.3 m tall at the eyes and 0.9 m from snout to tail, faces +Z. Target:
 * docs/wildlife-mockups/crocodile_001.jpg (made with mmx).
 *
 * The lizard of `assets/parts/lizard-kind.ts` (low trunk, sprawling legs, snout on a jaw bone, tail on
 * three bones, rig, and clips) at full size, as a crocodile: a long rounded snout with two nostril
 * bumps, big round eyes on bumps on top of the head, a cream underside and jaw, small white teeth
 * along a smiling mouth, and soft green ridges down the back and the tail.
 * Role: a river and swamp animal; the long snout with the big top eyes reads at 128 px.
 * Palette (60/30/10): green skin #5aa83e (darker ridges); a cream belly and jaw #f2ecc0; white eyes
 *   with dark pupils; white teeth and a dark red mouth.
 */
export default scaleAsset(
  lizardAsset({
    name: 'crocodile',
    description: 'Chibi crocodile: a low green crocodile with a big head, a long rounded snout, big round eyes on top of the head, a cream belly and jaw, a few white teeth in a soft grin, one row of round green bumps down the back and the tail, and four short sprawling legs; lizard rig.',
    reference: 'docs/wildlife-mockups/crocodile_001.jpg',
    variants: {
      skin: { green: '#3f8236', bright: '#4e9a38', olive: '#7a8a3a', teal: '#3a8a7a' },
      belly: { cream: '#f2ecc0', pale: '#e8e8d8', yellow: '#f0d890' },
      eyes: { dark: '#2a1e18', amber: '#8a5a1a', green: '#3a6a2a' },
    },
    presets: {
      swamp: { skin: 'olive', belly: 'yellow', eyes: 'amber' },
      river: { skin: 'teal', belly: 'pale', eyes: 'dark' },
    },
    drop: 0.08,
    chestLift: 0.05,
    headOffset: [0, 0.08, 0.05],
    snout: 0.3,
    snoutWidth: 0.075,
    tailSway: 2,
    bellyChest: 1.45,
    ridgeSize: 1.45,
    ridgeShade: '#2a5a24',
    headScale: 1.2,
    eyeScale: 1.08,
    teeth: 3,
    ridgeStyle: 'round',
  }),
  1,
);
