import { sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Donkey — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/donkey`), about 1.3 m to the
 * ear tips and 0.97 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/donkey_001.jpg
 * (made with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 0.88 of its size, as a donkey: very long wide ears with dark insides and dark tips, a grey coat
 * with a pale muzzle, pale rings round the eyes, and a pale belly, a short upright dark brush mane,
 * a dark stripe along the back, faint stripes on the lower legs, and a thin tail with a dark tuft;
 * no halter, blaze, or socks.
 * Role: a village and farm animal and a slow pack mount; the long ears and the eye rings read at
 *   128 px.
 * Palette (60/30/10): grey coat #8f8d89; pale cream #e8e2d4 (muzzle, eye rings, belly); near-black
 *   mane, tuft, ear tips, and hooves; blue eyes as the accent.
 */

const DARK = '#3a3734';

export default scaleAsset(
  horseAsset({
    name: 'donkey',
    description: 'Chibi donkey: a grey donkey with very long wide ears, big glossy blue eyes in pale rings, a pale muzzle and belly, a short upright dark mane, a dark stripe along the back, and a thin tail with a dark tuft; quadruped rig.',
    reference: 'docs/wildlife-mockups/donkey_001.jpg',
    variants: {
      coat: { grey: '#8f8d89', brown: '#7a5a44', dark: '#4e4a46', cream: '#c9b9a0' },
      mane: { dark: '#2e2b28', brown: '#4a3426' },
      eyes: { blue: '#4a7aa8', brown: '#2a1a12', hazel: '#6b4a22' },
    },
    presets: {
      brown: { coat: 'brown', mane: 'brown', eyes: 'brown' },
      dark: { coat: 'dark', mane: 'dark', eyes: 'hazel' },
      cream: { coat: 'cream', mane: 'brown', eyes: 'blue' },
    },
    colors: { muzzle: '#e8e2d4', coatDark: '#3a3734', brow: '#3e3b38', hoof: '#2a2624' },
    muzzleFollow: 0.25,
    halter: false,
    blaze: false,
    socks: false,
    ears: 2.1,
    earSpread: 30,
    earWidth: 1.5,
    mane: 'brush',
    tail: 'tuft',
    paint(coat, horse) {
      const pale = horse.tone('coat', '#e8e2d4', 0.25);
      const dark = horse.tone('coat', DARK, 0.6);
      const belly = sdf.ellipsoid([0.16, 0.08, 0.3]).at(0, 0.33, -0.1);
      const bib = sdf.ellipsoid([0.11, 0.13, 0.1]).at(0, 0.46, 0.27);
      const stripe = sdf.box([0.045, 0.12, 0.62], 0.02).at(0, 0.7, -0.14);
      // Three dark stripes across the outside of each thigh.
      const thighStripes = sdf
        .union(...[0.43, 0.49, 0.55].map((y) => sdf.box([0.2, 0.022, 0.16]).rotateX(-25).at(0.27, y, -0.29)))
        .mirror('x');
      return coat
        .paintWhere(belly, pale, 0.04)
        .paintWhere(bib, pale, 0.03)
        .paintWhere(stripe, dark, 0.015)
        .paintWhere(thighStripes, dark, 0.006);
    },
  }),
  0.88,
);
