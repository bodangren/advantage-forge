import { profile, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { curlField } from './parts/curl-field.js';
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
    description: 'Chibi sheep: a big round cream face with glossy eyes and pink cheeks, ears held out to the sides, white eyes with black pupils, a small black triangle nose, a coat of neat round white wool curls on its body and over the top and the sides of the head, short cream legs, and dark hooves; quadruped rig.',
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
    eyeStyle: 'white',
    eyeScale: 1.3,
    nose: false,
    legThick: 1.3,
    legLength: -0.09,
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
      // A small black triangle nose, point down, on the tip of the muzzle.
      const nh = deer.faceHit(0, 0.635);
      const tri = profile.polygon([[-0.024, 0.012], [0.024, 0.012], [0, -0.018]], { smooth: false });
      k.body('nose', sdf.extrude(tri, 0.016, 0.006).at(nh[0], nh[1], nh[2] + 0.002).bone('head'), { color: '#2a2220', roughness: 0.3, detail: 0.003 });
      // The coat: the trunk grown thick, with the neck, covered in neat round curls.
      const neck = sdf.capsule([0, 0.41, 0.06], [0, 0.55, 0.1], 0.1).bone('neck');
      const coatBase = sdf.smoothUnion(0.05, deer.trunk.round(0.07), neck);
      const body = curlField(coatBase, sdf.box([2, 2, 2]), [0, 0.42, -0.04], 260, 0.038);
      const coat = coatBase.round(-0.01).displace(-0.022, body.dome, 2.2);
      k.body('wool', coat, {
        color: k.tint('wool'),
        roughness: 0.9,
        detail: 0.004,
        bump: (x: number, y: number, z: number) => 0.0018 * body.rings(x, y, z),
      });
      // The cap: curls over the top and the sides of the head, framing the face.
      const capBase = deer.head.round(0.022);
      const face = sdf.ellipsoid([0.178, 0.165, 0.2]).at(0, 0.635, 0.28);
      const capKeep = sdf.halfSpace([0, -1, 0], -0.6).subtract(face);
      const head = curlField(capBase, capKeep, [0, 0.72, 0.12], 160, 0.03);
      const cap = capBase.round(-0.008).displace(-0.018, head.dome, 2.2).intersect(capKeep.round(0.01));
      k.body('wool-cap', cap, { color: k.tint('wool'), roughness: 0.9, detail: 0.0035, bone: 'head', bump: (x: number, y: number, z: number) => 0.0015 * head.rings(x, y, z) });
    },
  }),
  0.8,
);
