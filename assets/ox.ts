import { sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Ox — Chibi Quest wildlife (catalog `wildlife/land/ox`), about 1.25 m to the horn tips and 1.15
 * m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/ox_001.jpg (made with mmx).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 1.05 of its size, as a draught ox: long wide horns that curve out and up with dark tips, ears
 * held out to the sides, a wide tan-pink muzzle, heavy brows, a brown coat with a pale belly
 * patch, a rope collar with a brass bell, a thin tail with a dark tuft, and black hooves; no
 * mane, halter, blaze, or socks.
 * Role: the farm's strong worker that pulls carts and ploughs; the wide horns read at 128 px.
 * Palette (60/30/10): brown coat #8a5a3a; a tan-pink muzzle #c8907c and a pale belly #e8d0b0; cream
 *   horns #e8dcc0 with dark tips; a brass bell as the accent.
 */

export default scaleAsset(
  horseAsset({
    name: 'ox',
    description: 'Chibi ox: a big round head with glossy eyes, long wide curved horns, ears held out to the sides, a wide muzzle, a brown coat with a pale belly, a rope collar with a brass bell, and a thin tufted tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/ox_001.jpg',
    variants: {
      coat: { brown: '#8a5a3a', red: '#a0502e', black: '#3a302c', grey: '#a8a49c' },
      mane: { dark: '#3a2a20', black: '#1e1a18', cream: '#e8dcc0' },
      eyes: { brown: '#2a1a12', dark: '#120c0a', hazel: '#6b4a22' },
    },
    presets: {
      red: { coat: 'red', mane: 'dark', eyes: 'brown' },
      black: { coat: 'black', mane: 'black', eyes: 'hazel' },
      grey: { coat: 'grey', mane: 'cream', eyes: 'dark' },
    },
    colors: { muzzle: '#c8907c', coatDark: '#c89080', brow: '#4a2a1a', hoof: '#1e1a18', nostril: '#5a3028' },
    muzzleFollow: 0.4,
    halter: false,
    blaze: false,
    socks: false,
    mane: false,
    tail: 'tuft',
    earSpread: 88,
    earWidth: 1.5,
    ears: 1.0,
    earAt: [0.16, 0.95, 0.23],
    muzzleScale: 1.15,
    paint(coat, horse) {
      const pale = horse.tone('coat', '#e8d0b0', 0.3);
      return coat
        .paintWhere(sdf.ellipsoid([0.15, 0.09, 0.3]).at(0, 0.33, -0.1), pale, 0.03)
        .paintWhere(sdf.ellipsoid([0.1, 0.09, 0.06]).at(0, 0.42, 0.27), pale, 0.02);
    },
    extra(k, horse) {
      // Horns: long, out to the sides and up, darker toward the tips.
      const horn = sdf
        .chain([[0.07, 1.05, 0.23, 0.04], [0.17, 1.08, 0.22, 0.036], [0.27, 1.1, 0.21, 0.03], [0.33, 1.16, 0.2, 0.022], [0.35, 1.24, 0.19, 0.01]], 0.012)
        .paintWhere(sdf.box([0.3, 0.3, 0.3]).at(0.45, 1.3, 0.2), '#6a5a48', 0.04);
      k.body('horns', horn.mirror('x'), { color: '#e8dcc0', roughness: 0.45, detail: 0.003, bone: 'head' });
      // Heavy brows: a soft ridge over the eyes.
      const eh = horse.faceHit(0.1, 0.87);
      const brow = sdf.capsule([0.03, eh[1] + 0.07, eh[2] - 0.03], [0.15, eh[1] + 0.06, eh[2] - 0.07], 0.026);
      k.body('brows', brow.mirror('x'), { color: horse.tint.coat, roughness: 0.7, detail: 0.003, bone: 'head' });
      // A rope collar with a brass bell on a short strap.
      const rope = sdf.torus(0.163, 0.018).rotateX(26.6).at(0, 0.63, 0.11).displace(0.003, (x, y, z) => Math.sin(Math.atan2(z - 0.11, x) * 40));
      k.body('collar', rope, { color: '#c8a46a', roughness: 0.8, detail: 0.003, bone: 'neck' });
      const bell = sdf.smoothUnion(
        0.008,
        sdf.capsule([0, 0.565, 0.25], [0, 0.525, 0.29], 0.012),
        sdf.cone([0, 0.52, 0.295], [0, 0.44, 0.305], 0.024, 0.045),
        sdf.sphere(0.013).at(0, 0.43, 0.305),
      );
      k.body('bell', bell, { color: '#d0a040', roughness: 0.3, metalness: 0.8, detail: 0.003, bone: 'neck' });
    },
  }),
  1.05,
);
