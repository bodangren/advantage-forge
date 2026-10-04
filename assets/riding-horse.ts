import { horseAsset } from './parts/horse-kind.js';
import { saddle } from './parts/horse-tack.js';

/**
 * Riding horse — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/riding-horse`), about
 * 1.2 m to the ear tips and 1.1 m from muzzle to tail, faces +Z. Target:
 * docs/wildlife-mockups/riding-horse_001.jpg (made with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`)
 * saddled for a hero: a brown leather saddle with a pommel, a cantle, side flaps, a girth, and
 * stirrups on a blue blanket with a gold trim (`assets/parts/horse-tack.ts`), and the leather
 * halter as its bridle; a warm chestnut coat with a black mane and tail, no blaze or socks.
 * Role: the hero's mount in travel scenes and the rider games; the saddle and the blue blanket
 *   read at 128 px and tell it from the wild horse.
 * Palette (60/30/10): chestnut coat #bc7040; black mane, tail, and hooves; brown leather #6a3c22;
 *   a periwinkle blanket #7f8ad0 with a gold trim #e0b040 as the accent.
 */

export default horseAsset({
  name: 'riding-horse',
  description: 'Chibi riding horse: a chestnut horse with big glossy eyes, a black mane and tail, a leather bridle, and a brown saddle with stirrups on a blue blanket with a gold trim; quadruped rig.',
  reference: 'docs/wildlife-mockups/riding-horse_001.jpg',
  variants: {
    coat: { chestnut: '#bc7040', bay: '#7e4428', grey: '#a9a49b', black: '#35302d' },
    mane: { black: '#2a2220', cream: '#e9dcc0', brown: '#5a3424' },
    eyes: { brown: '#2a1a12', hazel: '#6b4a22', blue: '#4f6f8c' },
    blanket: { blue: '#7f8ad0', red: '#b84a3a', green: '#5a9a5a', purple: '#8a62b0' },
  },
  presets: {
    bay: { coat: 'bay', mane: 'black', eyes: 'brown', blanket: 'red' },
    grey: { coat: 'grey', mane: 'cream', eyes: 'blue', blanket: 'purple' },
    black: { coat: 'black', mane: 'black', eyes: 'hazel', blanket: 'green' },
  },
  colors: { leather: '#5a3220', buckle: '#c8a040', hoof: '#221c1a', muzzle: '#dc9c70' },
  muzzleFollow: 0.9,
  blaze: false,
  socks: false,
  extra(k, horse) {
    saddle(k, horse, { blanket: k.tint('blanket'), trim: '#e0b040', leather: '#6a3c22', metal: '#b8b4ac' });
  },
});
