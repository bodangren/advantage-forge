import { profile, sdf } from '../src/index.js';
import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Badger — Chibi Quest wildlife (catalog `wildlife/forest/badger`), about 0.45 m tall at the ears and
 * 0.6 m from nose to tail, faces +Z. Target: docs/wildlife-mockups/badger_001.jpg (made with mmx).
 *
 * The bear of `assets/bear.ts` (body, head, rig, and clips from `assets/parts/boar-kind.ts`) at 0.62
 * of the boar's size, as a badger: a longer pointed muzzle with a black nose, a white face with a
 * black stripe from the nose over each eye to the ear, small round dark ears with white rims, a grey
 * body, black legs and paws with pale claws, and a stub tail.
 * Role: a forest and burrow animal; the striped white face reads at 128 px.
 * Palette (60/30/10): grey fur #8e8c88 (darker on the back); a white face #f2f0ea; black stripes,
 *   ears, and legs #2a2826; a black nose; brown eyes with a white glint.
 */
export default scaleAsset(
  boarAsset({
    name: 'badger',
    description: 'Chibi badger: a grey badger with a white face, a black stripe over each eye, a pointed muzzle with a black nose, small round dark ears with white rims, big glossy brown eyes, black legs, and pale claws; quadruped rig.',
    reference: 'docs/wildlife-mockups/badger_001.jpg',
    variants: {
      fur: { grey: '#8e8c88', silver: '#b4b2ac', brown: '#7a6a5a' },
      skin: { white: '#f2f0ea', cream: '#ece0c8' },
      eyes: { brown: '#5a3218', dark: '#2a1a12', amber: '#8a5a1a' },
      claws: { pale: '#d8cdb0', dark: '#3a2a22' },
    },
    presets: {
      silver: { fur: 'silver', skin: 'white', eyes: 'dark', claws: 'dark' },
      honey: { fur: 'brown', skin: 'cream', eyes: 'amber', claws: 'pale' },
    },
    colors: { furDark: '#5a5856', belly: '#6e6c68', earInner: '#2a2826', nostril: '#1a1416', ivoryBase: '#b8ad90' },
    ivorySlot: 'claws',
    horns: false,
    tuskScale: 0,
    mane: false,
    snout: 'bear',
    muzzleLength: 1.5,
    ears: 'round',
    feet: 'paws',
    eyeScale: 1.25,
    eyeGlow: 0,
    brows: false,
    lids: false,
    paint(fur, boar) {
      const black = boar.tone('fur', '#2a2826', 0.3);
      // The white face: the front of the head, and a white stripe up the middle of the crown.
      const face = sdf.box([0.6, 0.6, 0.5]).at(0, 0.45, 0.48);
      const crown = sdf.box([0.06, 0.4, 0.4], 0.02).at(0, 0.6, 0.15);
      // The black stripes: seen from the front, a band from the side of the nose through each eye to
      // the ear, pushed through the head along Z (only in front of the shoulders).
      const band = sdf.extrude(
        profile.polygon(
          [
            [0.022, 0.43],
            [0.07, 0.44],
            [0.15, 0.53],
            [0.205, 0.66],
            [0.14, 0.7],
            [0.075, 0.57],
            [0.03, 0.47],
          ],
          { smooth: true },
        ),
        1,
      );
      const stripe = band.mirror('x').intersect(sdf.box([0.6, 0.6, 0.6]).at(0, 0.5, 0.35));
      // The ears: dark, with white rims (extra).
      const earRoot = sdf.surfacePoint(boar.headBase, [0.17, 0.68, 0.2], -0.025);
      const ears = sdf.sphere(0.075).at(earRoot[0], earRoot[1] + 0.04, earRoot[2]).mirror('x');
      // Black legs and paws below the body.
      const legs = sdf.box([0.6, 0.22, 0.8]).at(0, 0.09, -0.05);
      return fur
        .paintWhere(face, boar.tint.snout, 0.04)
        .paintWhere(crown, boar.tint.snout, 0.012)
        .paintWhere(stripe, black, 0.006)
        .paintWhere(ears, black, 0.006)
        .paintWhere(legs, black, 0.03);
    },
    extra(k, boar) {
      // White rims round the small dark ears.
      const root = sdf.surfacePoint(boar.headBase, [0.17, 0.68, 0.2], -0.025);
      const rim = sdf
        .torus(0.06, 0.012)
        .rotateX(90)
        .scale([1, 1, 0.6])
        .rotateZ(-28)
        .rotateY(12)
        .at(root[0], root[1] + 0.03, root[2] + 0.004)
        .mirror('x');
      k.body('ear-rims', rim.bone('head'), { color: boar.tint.snout, roughness: 0.8, detail: 0.003 });
    },
  }),
  0.62,
);
