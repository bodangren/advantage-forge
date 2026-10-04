import { noise, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Sheep — Chibi Quest wildlife (catalog `wildlife/land/sheep`), about 0.72 m to the top of the
 * wool cap, faces +Z. Target: docs/wildlife-mockups/sheep_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.8 of its size, as a sheep: a thick lumpy coat of white wool over the body and the neck, a
 * curly wool cap on the head, a cream face and legs with pink cheeks, ears held out to the sides
 * with pink insides, and dark hooves; no fawn spots, bib, eye patches, or antlers.
 * Role: a farm animal for village and hamlet scenes; the round wool cloud reads at 128 px.
 * Palette (60/30/10): white wool #f6f1e6; a cream face and legs #f0d8ae; pink ears and cheeks;
 *   dark eyes and hooves.
 */

export default scaleAsset(
  deerAsset({
    name: 'sheep',
    description: 'Chibi sheep: a big round cream face with glossy eyes and pink cheeks, ears held out to the sides, a thick lumpy cloud of white wool on its body and a curly wool cap, cream legs, and dark hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/sheep_001.jpg',
    variants: {
      fur: { cream: '#f0d8ae', black: '#3a3230', brown: '#8a6040' },
      eyes: { dark: '#2a1a12', brown: '#5a3418' },
      wool: { white: '#f6f1e6', grey: '#b8b2a8', brown: '#8a6a4c', black: '#3e3834' },
    },
    presets: {
      blackface: { fur: 'black', eyes: 'brown', wool: 'white' },
      grey: { fur: 'cream', eyes: 'dark', wool: 'grey' },
      brown: { fur: 'brown', eyes: 'dark', wool: 'brown' },
    },
    colors: { cream: '#f0d8ae', earInner: '#f0b0a8', nose: '#3a2420', mouth: '#7a4a3a', hoof: '#2a2220' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    earTilt: -105,
    earTurn: 25,
    earScale: 0.85,
    bulk: 0.07,
    paint(fur, deer) {
      const eh = deer.faceHit(0.11, 0.63);
      const blush = sdf.sphere(0.035).at(eh[0], eh[1], eh[2]).mirror('x');
      return fur.paintWhere(blush, deer.tone('fur', '#f0b4a0', 0.3), 0.02);
    },
    extra(k, deer) {
      const curls = (s: sdf.Shape, a: number) => s.displace(a, (x, y, z) => noise.noise3(x * 30, y * 30, z * 30) + 0.5 * noise.noise3(x * 70, y * 70, z * 70));
      // The coat: the trunk grown thick, with the neck, in lumps.
      const neck = sdf.capsule([0, 0.41, 0.06], [0, 0.55, 0.1], 0.1).bone('neck');
      const coat = curls(sdf.smoothUnion(0.05, deer.trunk.round(0.07), neck), 0.014);
      k.body('wool', coat, {
        color: k.tint('wool'),
        roughness: 0.95,
        detail: 0.005,
        bump: (x: number, y: number, z: number) => 0.0015 * noise.noise3(x * 160, y * 160, z * 160),
      });
      // The cap: a cluster of curls on the crown, in front of the ears.
      const balls: sdf.Shape[] = [];
      for (let i = 0; i < 20; i++) {
        const a = i * 2.4;
        const r = 0.025 + 0.11 * Math.sqrt(i / 19);
        balls.push(sdf.sphere(0.052 - 0.012 * Math.sqrt(i / 19)).at(r * Math.cos(a), 0.865 - 0.07 * (r / 0.135) ** 2, 0.16 + 0.75 * r * Math.sin(a)));
      }
      k.body('wool-cap', curls(sdf.smoothUnion(0.015, ...balls), 0.008), { color: k.tint('wool'), roughness: 0.95, detail: 0.004, bone: 'head' });
    },
  }),
  0.8,
);
