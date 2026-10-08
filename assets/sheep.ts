import { profile, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { curlField } from './parts/curl-field.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Sheep — Chibi Quest wildlife (catalog `wildlife/land/sheep`), about 0.72 m to the top of the
 * wool cap, faces +Z. Target: docs/wildlife-mockups/sheep_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.8 of its size, as a sheep: a coat of warm cream wool in even spiral curls over a small body
 * and the neck, a curly wool cap that frames a big cream face with pink cheeks, plain tan ears
 * held out to the sides, and dark hooves; no fawn spots, bib, eye patches, or antlers.
 * Role: a farm animal for village and hamlet scenes; the round wool cloud reads at 128 px.
 * Palette (60/30/10): cream wool #f6e8c8; a cream face and legs #f0d8ae; tan ears; pink cheeks;
 *   dark eyes and hooves.
 */


export default scaleAsset(
  deerAsset({
    name: 'sheep',
    description: 'Chibi sheep: a big round cream face with big white eyes with black pupils and pink cheeks, plain tan ears held out to the sides, a small black triangle nose and a smile, a coat of warm cream spiral wool curls on its small body and over the top and the sides of the head, short cream legs, and dark hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/sheep_001.jpg',
    variants: {
      fur: { cream: '#f0d8ae', black: '#3a3230', brown: '#8a6040' },
      eyes: { dark: '#2a1a12', brown: '#5a3418' },
      wool: { white: '#faf7f0', cream: '#f6e8c8', grey: '#b8b2a8', brown: '#8a6a4c', black: '#3e3834' },
    },
    presets: {
      blackface: { fur: 'black', eyes: 'brown', wool: 'white' },
      grey: { fur: 'cream', eyes: 'dark', wool: 'grey' },
      brown: { fur: 'brown', eyes: 'dark', wool: 'brown' },
    },
    colors: { cream: '#f0d8ae', bib: '#f0d8ae', earInner: '#e2c08e', nose: '#3a2420', mouth: '#7a4a3a', hoof: '#2a2220' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    eyeStyle: 'white',
    eyeScale: 1.3,
    pupil: 1.25,
    eyeSink: 0.012,
    nose: false,
    smile: false,
    legThick: 1.3,
    legLength: -0.09,
    bodyLength: -0.05,
    slim: 0.92,
    earTilt: -105,
    earTurn: 25,
    earScale: 0.85,
    bulk: 0.07,
    headScale: 1.18,
    paint(fur, deer) {
      const eh = deer.faceHit(0.11, 0.63);
      const blush = sdf.sphere(0.035).at(eh[0], eh[1], eh[2]).mirror('x');
      // A wide smile under the nose.
      const smile = sdf.extrude(profile.arc(0.046, 0.0065, 222, 318), 0.3).at(0, 0.634, 0.3);
      // Thin dark brows arched over the eyes.
      const brows = sdf.extrude(profile.arc(0.04, 0.01, 55, 125), 0.3).at(0.1, 0.725, 0.3).mirror('x');
      return fur.paintWhere(blush, deer.tone('fur', '#f0b4a0', 0.3), 0.02).paintWhere(smile, '#7a4a3a', 0.002).paintWhere(brows, '#4a3024', 0.002);
    },
    extra(k, deer) {
      // A small black triangle nose, point down, on the tip of the muzzle.
      const nh = deer.faceHit(0, 0.635);
      const tri = profile.polygon([[-0.024, 0.012], [0.024, 0.012], [0, -0.018]], { smooth: false });
      k.body('nose', sdf.extrude(tri, 0.016, 0.006).at(nh[0], nh[1], nh[2] + 0.002).bone('head'), { color: '#2a2220', roughness: 0.3, detail: 0.003 });
      // The coat: the trunk grown thick, with the neck, covered in neat round curls.
      // Even spacing keeps every curl whole (no rows of flat rings); each curl is a dome with a
      // spiral groove.
      // A round wool cloud: the trunk grown thick and a round mass over the back, with the neck up to
      // the back of the head (no hollow behind the head).
      const neck = sdf.capsule([0, 0.41, 0.04], [0, 0.6, 0.08], 0.1).bone('neck');
      const cloud = sdf.ellipsoid([0.17, 0.15, 0.2]).at(0, 0.43, -0.07).bone('spine');
      const coatBase = sdf.smoothUnion(0.06, deer.trunk.round(0.055), cloud, neck);
      // Fewer, larger, soft curls: a round dome with a shallow spiral.
      const body = curlField(coatBase, sdf.box([2, 2, 2]), [0, 0.42, -0.04], 90, 0.066, { even: 8, spacing: 1.25 });
      const curl = (f: ReturnType<typeof curlField>) => (x: number, y: number, z: number) => f.dome(x, y, z) * (0.82 + 0.18 * f.swirl(x, y, z));
      const coat = coatBase.round(-0.014).displace(-0.03, curl(body), 2.2);
      k.body('wool', coat, {
        color: k.tint('wool'),
        roughness: 0.85,
        detail: 0.0035,
        bump: (x: number, y: number, z: number) => 0.0014 * body.swirl(x, y, z),
      });
      // The cap: curls over the top and the sides of the head, framing the face.
      // The cap edge rolls down onto the face, so no gap shows between the wool and the face.
      const capBase = deer.head.round(0.02);
      const face = sdf.ellipsoid([0.185, 0.17, 0.2]).at(0, 0.64, 0.28);
      const capKeep = sdf.halfSpace([0, -1, 0], -0.6).subtract(face);
      const head = curlField(capBase, capKeep, [0, 0.72, 0.12], 70, 0.05, { even: 6, spacing: 1.25 });
      const cap = capBase.round(-0.008).displace(-0.022, curl(head), 2.2).smoothIntersect(0.012, capKeep.round(0.004));
      k.body('wool-cap', cap, { color: k.tint('wool'), roughness: 0.85, detail: 0.003, bone: 'head', bump: (x: number, y: number, z: number) => 0.0012 * head.swirl(x, y, z) });
    },
  }),
  0.8,
);
