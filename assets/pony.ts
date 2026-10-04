import { noise, sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pony — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/pony`), about 0.95 m to the ear
 * tips and 0.86 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/pony_001.jpg (made
 * with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 0.78 of its size, as a pony: a pale cream coat with a brown patch over the rump and a small one
 * on the right shoulder, a fluffy curly topknot between the ears, a cream mane and tail, a pale
 * muzzle, and brown hooves; no halter, blaze, or socks.
 * Role: a child's mount and a village pet; the small size, the cream coat with the brown patch,
 *   and the curly topknot read at 128 px.
 * Palette (60/30/10): cream coat #f1dfa0 and mane #ead6aa; a brown patch #8a5a3a and brown hooves;
 *   green eyes as the accent.
 */

export default scaleAsset(
  horseAsset({
    name: 'pony',
    description: 'Chibi pony: a small chubby cream pony with big glossy green eyes, a fluffy curly topknot, a cream mane and tail, a brown patch over its rump, and brown hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/pony_001.jpg',
    variants: {
      coat: { cream: '#f1dfa0', white: '#f4f0ea', chestnut: '#b8703e', grey: '#9e9a96' },
      mane: { cream: '#ead6aa', brown: '#6a4430', black: '#2e2826' },
      eyes: { green: '#3a6a4a', brown: '#2a1a12', blue: '#4f6f8c' },
      patch: { brown: '#8a5a3a', black: '#3a3230', grey: '#7a7470' },
    },
    presets: {
      piebald: { coat: 'white', mane: 'black', eyes: 'brown', patch: 'black' },
      chestnut: { coat: 'chestnut', mane: 'cream', eyes: 'brown', patch: 'brown' },
      grey: { coat: 'grey', mane: 'black', eyes: 'blue', patch: 'grey' },
    },
    colors: { muzzle: '#f8e6b6', coatDark: '#d8b880', brow: '#8a6a4a', hoof: '#5a3e30', nostril: '#9a5a4a' },
    muzzleFollow: 0.8,
    halter: false,
    blaze: false,
    socks: false,
    forelock: false,
    eyeScale: 1.2,
    paint(coat, horse) {
      const patch = horse.tone('patch', '#8a5a3a');
      const rump = sdf.ellipsoid([0.2, 0.15, 0.17]).rotateX(15).at(0.06, 0.66, -0.3);
      const shoulder = sdf.ellipsoid([0.08, 0.09, 0.08]).at(-0.2, 0.55, 0.08);
      return coat.paintWhere(rump, patch, 0.012).paintWhere(shoulder, patch, 0.01);
    },
    extra(k, horse) {
      // A fluffy curly topknot between the ears: a cluster of round curls.
      const curls: sdf.Shape[] = [];
      for (let i = 0; i < 16; i++) {
        const a = i * 2.4;
        const r = 0.02 + 0.075 * Math.sqrt(i / 15);
        curls.push(sdf.sphere(0.05 - 0.012 * Math.sqrt(i / 15)).at(r * Math.cos(a), 1.1 - 0.05 * (i / 15) + 0.03 * Math.sin(a), 0.33 + r * Math.sin(a) * 0.8));
      }
      const knot = sdf
        .smoothUnion(0.014, ...curls)
        .displace(0.008, (x, y, z) => noise.fbm(x * 90, y * 90, z * 90, 2));
      k.body('topknot', knot, { color: horse.tint.mane, roughness: 0.75, detail: 0.004, bone: 'head' });
    },
  }),
  0.78,
);
