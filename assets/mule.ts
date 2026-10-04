import { sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { packSaddle } from './parts/horse-tack.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Mule — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/mule`), about 1.2 m to the ear
 * tips and 1.0 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/mule_001.jpg (made
 * with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 0.93 of its size, as a pack mule: long ears, a brown coat with a big tan muzzle and a pale belly,
 * a short upright dark brush mane, a rope halter, pale fetlocks, a thin tufted tail, and a pack
 * saddle (`assets/parts/horse-tack.ts`): a cloth pad, a wooden cross-buck frame, a wicker basket
 * on each side, and a blanket roll on top.
 * Role: the merchant's and the explorer's pack animal in travel and market scenes; the baskets
 *   and the long ears read at 128 px.
 * Palette (60/30/10): brown coat #8a5034; tan #e0b88a muzzle and belly; dark mane; wicker #c89a5a,
 *   wood #8a6040, a cream roll; the red pad as the accent.
 */

export default scaleAsset(
  horseAsset({
    name: 'mule',
    description: 'Chibi mule: a brown pack mule with long ears, big glossy eyes, a big tan muzzle, a short upright dark mane, a rope halter, and a pack saddle with two wicker baskets and a blanket roll; quadruped rig.',
    reference: 'docs/wildlife-mockups/mule_001.jpg',
    variants: {
      coat: { brown: '#8a5034', bay: '#5e3a26', grey: '#8a8682', black: '#3a3230' },
      mane: { dark: '#2e2420', brown: '#5a3a28' },
      eyes: { brown: '#2a1a12', hazel: '#6b4a22', blue: '#4f6f8c' },
      pad: { red: '#a84a3a', blue: '#4a6aa0', green: '#5a8a4a' },
    },
    presets: {
      bay: { coat: 'bay', mane: 'dark', eyes: 'hazel', pad: 'blue' },
      grey: { coat: 'grey', mane: 'dark', eyes: 'blue', pad: 'green' },
      black: { coat: 'black', mane: 'brown', eyes: 'brown', pad: 'red' },
    },
    colors: { muzzle: '#e0b88a', coatDark: '#5a3424', brow: '#2e2018', hoof: '#2a2220', white: '#e8d4b0', leather: '#c8a46a', buckle: '#8a6a40' },
    muzzleFollow: 0.3,
    blaze: false,
    ears: 1.5,
    earWidth: 1.2,
    earSpread: 24,
    mane: 'brush',
    tail: 'tuft',
    paint(coat, horse) {
      const pale = horse.tone('coat', '#e0b88a', 0.3);
      return coat.paintWhere(sdf.ellipsoid([0.16, 0.08, 0.3]).at(0, 0.33, -0.1), pale, 0.04);
    },
    extra(k, horse) {
      packSaddle(k, horse, { pad: k.tint('pad'), wood: '#8a6040', wicker: '#c89a5a', roll: '#e8dcc0', leather: '#5a3a24' });
    },
  }),
  0.93,
);
