import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import { sdf } from '../src/index.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Sprout adult base: the Chibi Sprouts adult body (the humanoid kind grown up), about 1.5 m
 * tall without hair, faces +Z. Role: the base of Mom, Dad, Grandma, and Grandpa in the week 4
 * renders (the family cast), seen large next to the age-5 children (about 0.9 m, sprout-pat).
 * One idea: the same big-eyed Sprouts face on a smaller head over a slim grown-up body with a
 * clear waist and long legs, so Mom reads about 4.7 heads tall and Dad is the tallest.
 * Shape language: round and soft. Palette: neutral plain clothes (a linen shirt, grey-brown
 * full-length trousers, brown shoes); the head and its face paint are the Sprouts family's.
 * Body: `ADULT` proportions (assets/parts/humanoid-kind.ts): a 0.8 head, a slim torso (width
 * about 1.1 of the child's), legs about half the height with the knee low, arms 2.2x turned
 * slightly out at rest, hands scaled to the head reaching mid-thigh. The skeleton, the bone
 * names, the clips, and the fist grips are the hero's, so clothes code on `h.torso`, `h.band`,
 * and `h.joints` works. The trousers are custom full-length (the kind cuff ends mid-shin on
 * long legs); everything else is the kind's.
 * Bodies: skin, hair (swept), undershirt, trousers, shoes, the singing face. Clips: idle, walk,
 * run, attack, hit, rest, cheer, cast, and the Sprout gesture clips.
 * No presets: the family members declare their own looks, so the pin of every preset is as is.
 */
export default humanoidAsset({
  name: 'sprout-adult-base',
  description: 'Chibi Sprouts adult base: the humanoid kind grown up (Mom reads about 4.7 heads tall)',
  reference: 'docs/sprout-mockups/cast-lineup.jpg',
  proportions: ADULT,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  pants: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9e' },
    cloth: { linen: '#cdbb94', sky: '#5f84ad', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },

  extra(k, h) {
    const { HIP, KNEE } = h.joints;
    const P = ADULT;

    // Full-length plain trousers to the shoe tops (the kind cuff ends mid-shin on long legs).
    // The hips run a touch slim so the shirt always covers them.
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, P.pants.thighR).bone('leg.L'),
      sdf.cone(KNEE, [P.ankle[0], 0.17, P.ankle[2]], P.pants.shinR[0], 0.05).round(0.002).bone('shin.L'),
    );
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([P.pants.hipsSize[0] * 0.96, P.pants.hipsSize[1], P.pants.hipsSize[2] * 0.96]).at(0, P.pants.hipsY, 0).bone('hips'),
      trouserLeg.mirror('x', 0),
    );
    k.body('pants', trousers, { color: '#4a3f36', roughness: 0.85 });

    // A crisp raised waistband over the painted belt (the paint blend streaks on the tall torso).
    const beltY = (P.shirt.belt[0] + P.shirt.belt[1]) / 2;
    const waistband = h.torso
      .round(0.008)
      .smoothIntersect(0.004, sdf.box([0.5, 0.035, 0.5]).at(0, beltY, 0));
    k.body('belt', waistband, { color: '#6b4a32', roughness: 0.7 });

    sproutGestures(k, h, ADULT);
  },
});
