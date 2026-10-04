import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Wolf — Chibi Quest wildlife (catalog `wildlife/land/wolf`), about 0.72 m to the ear tips, faces
 * +Z. Target: docs/wildlife-mockups/wolf_001.jpg (made with mmx from the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 0.9 of its size, as a wild forest wolf: a calm closed smile instead of the toothy grin, no
 * heavy brows or forelock, a smooth cream chest instead of the spiky ruff, a lighter grey coat
 * with a darker saddle on the back, and amber eyes.
 * Role: ambient forest wildlife and a hunting-game animal; friendlier than the dire wolf monster.
 * Palette (60/30/10): grey coat #7e838a with a darker back #5a5e64; cream muzzle, cheeks, and
 *   chest #ece2c8; big dark brown eyes.
 */

export default scaleAsset(
  wolfAsset({
    name: 'wolf',
    description: 'Chibi wolf: a grey forest wolf with a big round head, a calm smile, a cream muzzle and chest, pointed ears, big dark eyes, a darker back, and a bushy tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/wolf_001.jpg',
    variants: {
      fur: { grey: '#7e838a', timber: '#7a6a58', black: '#3a3838', white: '#d8d8d4' },
      markings: { cream: '#ece2c8', tan: '#d4b48a', white: '#f6f4ee' },
      eyes: { brown: '#3a2010', amber: '#7a440c', ice: '#4a6a80' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'tan', eyes: 'amber' },
      black: { fur: 'black', markings: 'cream', eyes: 'brown' },
      arctic: { fur: 'white', markings: 'white', eyes: 'ice' },
    },
    colors: { furLight: '#a8acb0', furDark: '#5a5e64', earInner: '#8a6a5a', eyeRim: '#1a100a' },
    eyeScale: 1.3,
    cheekTufts: false,
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    paint(fur, t) {
      return fur.paintWhere(sdf.ellipsoid([0.09, 0.07, 0.2]).at(0, 0.43, -0.07), t.furDark, 0.04);
    },
  }),
  0.9,
);
