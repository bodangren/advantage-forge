import { noise, profile, sdf } from '../src/index.js';
import { curlField } from './parts/curl-field.js';
import { horseAsset } from './parts/horse-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pony — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/pony`), about 0.95 m to the ear
 * tips and 0.86 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/pony_001.jpg (made
 * with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 0.78 of its size, as a pony: a big round head (1.3), short legs, and a short body, a pale cream
 * smooth coat with a brown patch over the rump and a small one on the right shoulder, a fluffy
 * topknot of tight curls between the ears and a short mane of curls down the neck, a cream tail, a round muzzle
 * in the coat color with small pink nostrils (no smile line), very large dark eyes with a big shine,
 * dark lashes, and thin dark brows, and dark brown hooves; no halter, blaze, or socks.
 * Role: a child's mount and a village pet; the big head, the large dark eyes, the cream coat with
 *   the brown patch, and the curly topknot read at 128 px.
 * Palette (60/30/10): warm cream coat #f7dca4 and mane #ead6aa; a brown patch #8a5a3a and dark brown
 *   hooves; dark brown eyes and pink nostrils as the accents.
 */

export default scaleAsset(
  horseAsset({
    name: 'pony',
    description: 'Chibi pony: a small chubby cream pony with a big round head, short legs, very large glossy dark brown eyes with lashes, a round muzzle with small pink nostrils, a fluffy curly topknot and a short curly mane, a cream tail, a brown patch over its rump, and dark brown hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/pony_001.jpg',
    variants: {
      coat: { cream: '#f7dca4', white: '#f4f0ea', chestnut: '#b8703e', grey: '#9e9a96' },
      mane: { cream: '#ead6aa', brown: '#6a4430', black: '#2e2826' },
      eyes: { brown: '#2a160c', green: '#3a6a4a', blue: '#4f6f8c' },
      patch: { brown: '#8a5a3a', black: '#3a3230', grey: '#7a7470' },
    },
    presets: {
      meadow: { coat: 'cream', mane: 'cream', eyes: 'green', patch: 'brown' },
      piebald: { coat: 'white', mane: 'black', eyes: 'brown', patch: 'black' },
      chestnut: { coat: 'chestnut', mane: 'cream', eyes: 'brown', patch: 'brown' },
      grey: { coat: 'grey', mane: 'black', eyes: 'blue', patch: 'grey' },
    },
    colors: { muzzle: '#f5e3a8', coatDark: '#e8b090', brow: '#2a1a12', hoof: '#4a3026', nostril: '#e0909a' },
    muzzleFollow: 1,
    halter: false,
    blaze: false,
    socks: false,
    forelock: false,
    mane: false,
    smile: false,
    nostrilScale: 0.55,
    eyeScale: 1.55,
    eyeSink: 0.056,
    coatBump: 0,
    irisScale: 1.22,
    headScale: 1.3,
    legLength: -0.09,
    bodyLength: -0.07,
    paint(coat, horse) {
      const patch = horse.tone('patch', '#8a5a3a');
      const rump = sdf.ellipsoid([0.2, 0.15, 0.17]).rotateX(15).at(0.06, 0.66, -0.3);
      const shoulder = sdf.ellipsoid([0.08, 0.09, 0.08]).at(-0.2, 0.55, 0.08);
      // Thin dark brows: arcs above the large eyes (the kind's brows sit under the eye balls).
      const e = horse.eye;
      const brows = sdf.extrude(profile.arc(e.r * 1.42, 0.009, 62, 118), 0.3).at(e.at[0] - 0.006, e.at[1] + 0.008, e.at[2]).mirror('x');
      return coat.paintWhere(rump, patch, 0.012).paintWhere(shoulder, patch, 0.01).paintWhere(brows, '#2a1a12', 0.003);
    },
    extra(k, horse) {
      // A fluffy curly topknot between the ears: a round cluster raised into many small tight curls
      // (`curlField`), with a coil groove in each curl (normal map).
      const blobs: sdf.Shape[] = [];
      for (let i = 0; i < 16; i++) {
        const a = i * 2.4;
        const r = 0.02 + 0.075 * Math.sqrt(i / 15);
        blobs.push(sdf.sphere(0.05 - 0.012 * Math.sqrt(i / 15)).at(r * Math.cos(a), 1.1 - 0.05 * (i / 15) + 0.03 * Math.sin(a), 0.33 + r * Math.sin(a) * 0.8));
      }
      const knotBase = sdf.smoothUnion(0.02, ...blobs);
      const curls = curlField(knotBase, sdf.sphere(4), [0, 1.08, 0.33], 70, 0.026);
      const knot = knotBase.displace(-0.014, curls.dome, 2);
      k.body('topknot', knot, { color: horse.tint.mane, roughness: 0.75, detail: 0.003, bone: 'head', bump: (x, y, z) => 0.0015 * curls.rings(x, y, z) });
      // A short mane of curls down the crest of the neck, from behind the topknot to the withers.
      const mane: sdf.Shape[] = [];
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const r = 0.05 - 0.016 * t;
        mane.push(sdf.sphere(r).at(0.012 * Math.sin(i * 2.1), 1.02 - 0.36 * t, 0.17 - 0.21 * t).bone(t < 0.15 ? 'head' : 'mane'));
      }
      const crest = sdf.smoothUnion(0.016, ...mane).displace(0.008, (x, y, z) => noise.fbm(x * 90, y * 90, z * 90, 2));
      k.body('mane-curls', crest, { color: horse.tint.mane, roughness: 0.75, detail: 0.004 });
      // Dark lashes: three short curved strokes off the top outer edge of each eye.
      const e = horse.eye;
      const lashes = [0, 1, 2].map((i) => {
        const a = ((20 + 22 * i) * Math.PI) / 180;
        const [ux, uy] = [Math.cos(a), Math.sin(a)];
        const b: [number, number, number] = [e.at[0] + ux * e.r * 0.9, e.at[1] + uy * e.r * 0.9, e.at[2] + e.r * 0.42];
        const len = 0.03 - 0.004 * i;
        return sdf.chain(
          [
            [b[0], b[1], b[2], 0.0055],
            [b[0] + ux * len * 0.6, b[1] + uy * len * 0.6, b[2] + 0.004, 0.004],
            [b[0] + ux * len + 0.004, b[1] + uy * len + 0.006, b[2] + 0.002, 0.002],
          ],
          0.003,
        );
      });
      k.body('lashes', sdf.union(...lashes).mirror('x'), { color: '#1e1410', roughness: 0.5, detail: 0.002, bone: 'head' });
    },
  }),
  0.78,
);
