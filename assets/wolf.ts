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
    description: 'Chibi wolf: a grey forest wolf with a big round head, a long cream muzzle with a small calm smile, cream lower cheeks and chest, pointed ears with brown insides, big dark eyes, a darker back, brown paws, and a bushy tail that hangs down with a dark tip; quadruped rig.',
    reference: 'docs/wildlife-mockups/wolf_001.jpg',
    variants: {
      fur: { grey: '#7e838a', timber: '#7a6a58', black: '#3a3838', white: '#d8d8d4' },
      markings: { cream: '#ece2c8', tan: '#d4b48a', white: '#f6f4ee' },
      eyes: { brown: '#2a160c', amber: '#7a440c', ice: '#4a6a80' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'tan', eyes: 'amber' },
      black: { fur: 'black', markings: 'cream', eyes: 'brown' },
      arctic: { fur: 'white', markings: 'white', eyes: 'ice' },
    },
    colors: { furLight: '#ddd6c6', furDark: '#5a5e64', earInner: '#7a5038', eyeRim: '#1a100a' },
    eyeScale: 1.35,
    pupilScale: 1.35,
    snout: 0.05,
    smileArc: [250, 290],
    claws: false,
    tail: false,
    cheekTufts: false,
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    paint(fur, t, tone) {
      // A darker saddle on the back, and brown paws.
      return fur
        .paintWhere(sdf.ellipsoid([0.09, 0.07, 0.2]).at(0, 0.43, -0.07), t.furDark, 0.04)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.06), tone('fur', '#8a5e40', 0.5), 0.015);
    },
    extra(k, w) {
      // The bushy tail hangs down behind, with a darker tip.
      const TIP: [number, number, number] = [0, 0.12, -0.5];
      const tail = sdf
        .chain(
          [
            [0, 0.31, -0.28, 0.045],
            [0, 0.29, -0.38, 0.08],
            [0, 0.22, -0.46, 0.088],
            [TIP[0], TIP[1], TIP[2], 0.03],
          ],
          0.03,
        )
        .scale([0.9, 1, 1])
        .paintWhere(sdf.sphere(0.075).at(...TIP), w.tone('fur', '#45484e', 0.8), 0.03)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85 });
    },
  }),
  0.9,
);
