import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Fox — Chibi Quest wildlife (catalog `wildlife/land/fox`), about 0.6 m to the ear tips, faces +Z.
 * Target: docs/wildlife-mockups/fox_001.jpg (made with mmx).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 0.75 of its size, as a red fox: large ears with black backs and tips, white cheek tufts, a
 * white muzzle and smooth chest, a calm smile, black socks, and a big bushy tail with a white tip
 * on the tail bone (the kind's own tail is off).
 * Role: a clever forest animal for ambient life and the nature games; the orange coat, the black
 *   ears and socks, and the big tail read at 128 px.
 * Palette (60/30/10): orange #ec7428; white #fff6ec (muzzle, cheeks, chest, tail tip); black
 *   #2a1e1a ear backs and socks; big dark brown eyes.
 */

export default scaleAsset(
  wolfAsset({
    name: 'fox',
    description: 'Chibi fox: an orange fox with a big round head, large black-backed ears, white cheek tufts, muzzle, and chest, a calm smile, black socks, and a big bushy tail with a white tip; quadruped rig.',
    reference: 'docs/wildlife-mockups/fox_001.jpg',
    variants: {
      fur: { orange: '#ec7428', red: '#c8502a', silver: '#9a9aa2', arctic: '#f0f0ec' },
      markings: { white: '#fff6ec', cream: '#f4e4c8' },
      eyes: { brown: '#3a2010', amber: '#7a440c', gold: '#8a6a18' },
    },
    presets: {
      red: { fur: 'red', markings: 'cream', eyes: 'brown' },
      silver: { fur: 'silver', markings: 'white', eyes: 'gold' },
      arctic: { fur: 'arctic', markings: 'white', eyes: 'brown' },
    },
    colors: { furLight: '#fff6ec', furDark: '#2a1e1a', earInner: '#fff0e4', eyeRim: '#1a100a', nose: '#1a1214', claw: '#2a1e1a' },
    earScale: 1.25,
    eyeScale: 1.35,
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    tail: false,
    paint(fur, t) {
      // Black ear backs and tips, and black socks.
      return fur
        .paintWhere(sdf.halfSpace([0, -1, 0], -0.79).union(sdf.halfSpace([0, -1, 0], -0.67).intersect(sdf.halfSpace([0, 0, 1], 0.125))), t.furDark, 0.01)
        .paintWhere(sdf.ellipsoid([0.1, 0.085, 0.09]).at(0.22, 0.45, 0.2).mirror('x'), t.markings, 0.015)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.1), t.furDark, 0.02);
    },
    extra(k, w) {
      // The big bushy tail, flat-sided, with a white tip.
      const TIP: [number, number, number] = [0.06, 0.42, -0.6];
      const tail = sdf
        .chain(
          [
            [0, 0.31, -0.28, 0.045],
            [0.01, 0.31, -0.38, 0.09],
            [0.03, 0.34, -0.5, 0.1],
            [TIP[0], TIP[1], TIP[2], 0.02],
          ],
          0.03,
        )
        .scale([0.85, 1, 1])
        .paintWhere(sdf.sphere(0.1).at(TIP[0] * 0.85, TIP[1], TIP[2]).intersect(sdf.halfSpace([0, 0, 1], -0.53)), w.tint.markings, 0.02)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85 });
    },
  }),
  0.75,
);
