import { addPart, mapTint, profile, sdf } from '../src/index.js';
import { avatarHair } from './parts/avatar-hair.js';
import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import type { HumanoidShape } from './parts/humanoid-kind.js';
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

// The adult base face detail (Daniel 2026-11-22: more detail in the faces), matched to the
// adult faces in docs/sprout-mockups/cast-lineup.jpg. Paint only: the shared stencils and
// every other kind user keep today's look, so their GLBs stay byte-identical. The four
// adults paint their own faces in their own files, so this hook touches the base only.
const BASE_FACE = {
  irisDark: '#3a2412',
  irisLow: '#6e4520',
  pupil: '#101314',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  noseShade: '#d89a78',
  lid: '#1c130f',
  white: '#f6f1ea',
};

/** The base adult face over the shared paint: almond eyes, an open smile, a soft nose shade. */
const baseFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = ADULT.face.smileY;
  const browY = ADULT.face.browY;

  // Almond eyes: the shared eye is big and round; the lineup adults read as medium
  // almond eyes with dark irises and one catchlight. Cut an almond opening with an
  // exact hard skin stencil (a box over the whole shared eye minus the almond
  // solid), lay fresh white in the hole, then a smaller dark iris with a warm low
  // arc, the pupil, one catchlight, and a thin upper lid line. Paint only: no
  // geometry moves, so the head clearances cannot change.
  const almond = profile.polygon(
    [
      [EX - 0.036, EY + 0.004],
      [EX - 0.015, EY + 0.017],
      [EX + 0.004, EY + 0.02],
      [EX + 0.022, EY + 0.015],
      [EX + 0.037, EY + 0.001],
      [EX + 0.019, EY - 0.009],
      [EX, EY - 0.013],
      [EX - 0.017, EY - 0.008],
    ] as [number, number][],
    { smooth: true },
  );
  const almondSolid = sdf.extrude(almond, 0.34).at(0, 0, 0.1);
  const eyeBox = sdf.box([0.14, 0.125, 0.3], 0.01).at(EX + 0.0075, EY + 0.0025, 0.1);
  const almondCut = pair(eyeBox.subtract(almondSolid));
  const white = pair(almondSolid);
  const dark = pair(h.onFace(sdf.ellipsoid([0.026, 0.028, 0.07]), EX, EY - 0.001));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.006));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.013, 0.015, 0.07]), EX, EY + 0.003));
  const big = pair(h.onFace(sdf.sphere(0.008), EX + 0.01, EY + 0.008));
  const lidLine = pair(sdf.extrude(profile.arc(0.07, 0.0045, 52, 128), 0.3).at(EX, EY - 0.046, 0.1));
  // The eye box trims the top of the shared cheek blush; lay it back below the
  // eye so the cheek keeps its soft color with no seam.
  const blushBack = pair(
    h
      .onFace(sdf.sphere(0.032), 0.135, ADULT.face.blushY)
      .intersect(sdf.halfSpace([0, 1, 0], EY - 0.04)),
  );

  // The shared brow band is heavy; cover it with an exact-footprint hard skin
  // stencil (a wider cover left a pale slab in Lily's rounds, a soft edge a halo)
  // and paint a shorter, thinner, gently arched brow in the same place. The tint
  // follows the hair variant, so the brow always matches the hair.
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.075, 0.013, 64, 116), 0.3).at(0.1, browY - 0.1, 0.1));

  // A friendly open smile with one rounded white teeth band (no fang corners) and
  // a wide tongue: the band is tall enough to read at 128 px. Both are clipped
  // inside the mouth, and the band corners are the mouth's own rounded shape.
  const outline = profile.polygon(
    (
      [
        [-0.056, 0.014],
        [-0.028, 0.006],
        [0, 0.004],
        [0.028, 0.006],
        [0.056, 0.014],
        [0.048, -0.013],
        [0.021, -0.034],
        [-0.021, -0.034],
        [-0.048, -0.013],
      ] as [number, number][]
    ).map(([x, y]): [number, number] => [x, y]),
    { smooth: true },
  );
  const mouth = sdf.extrude(outline, 0.3).at(0, smileY, 0.1);
  const teeth = sdf
    .box([0.065, 0.02, 0.3], 0.006)
    .at(0, smileY - 0.002, 0.1)
    .intersect(mouth);
  const tongue = mouth.intersect(sdf.ellipsoid([0.038, 0.018, 0.5]).at(0, smileY - 0.022, 0.1));

  // A soft shade under the small nose. The neutral base cheeks stay smooth.
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, ADULT.face.noseY - 0.018, h.faceZ(0, ADULT.face.noseY - 0.018));

  return skin
    .paintWhere(almondCut, h.tint.skin!)
    .paintWhere(white, BASE_FACE.white)
    .paintWhere(dark, BASE_FACE.irisDark, 0.006)
    .paintWhere(low, BASE_FACE.irisLow, 0.004)
    .paintWhere(pupil, BASE_FACE.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(lidLine, BASE_FACE.lid)
    .paintWhere(blushBack, h.tint.blush!, 0.01)
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, h.tint.brow!)
    .paintWhere(mouth, BASE_FACE.mouth, 0.001)
    .paintWhere(tongue, BASE_FACE.tongue, 0.002)
    .paintWhere(teeth, BASE_FACE.teeth, 0.001)
    .paintWhere(shade, BASE_FACE.noseShade, 0.01);
};

export default humanoidAsset({
  name: 'sprout-adult-base',
  description: 'Chibi Sprouts adult base: the humanoid kind grown up (Mom reads about 4.7 heads tall)',
  reference: 'docs/sprout-mockups/cast-lineup.jpg',
  proportions: ADULT,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  hair: false,
  pants: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9e' },
    cloth: { linen: '#cdbb94', sky: '#5f84ad', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },

  // The base face detail (Daniel 2026-11-22) over the shared paint. Paint only:
  // the shared kind keeps today's look, so every other kind user keeps its GLB.
  paintSkin(skin, h) {
    return baseFace(skin, h);
  },

  extra(k, h) {
    const { HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = ADULT;
    const H = P.head;

    // ---------------------------------------------------------------- neutral short side-part hair
    // The kind's swept style, re-added here so the fringe can carry separated
    // geometric locks: the cap, the side tufts, and the back are the exact
    // shared swept surface (byte-identical clearances), and four tapered locks
    // sweep the forehead with grooves between them instead of one smooth fringe.
    // Local frame: y 0 is the head center (avatar-hair builds in hero frame).
    const swept = avatarHair('swept', mapTint(k), { head: { size: H } });
    const sweptShape = swept.bodies[0]!.shape;
    // Separated swept locks, cut as geometry: three grooves run with the fringe
    // flow from the part side down to the temple, deeper and wider than the
    // shared fringe grooves, so the one smooth fringe reads as four locks with
    // staggered tips. The grooves stay on the forehead cap, clear of every
    // raised-hand clip (the shared clearances below are untouched).
    const groove = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) =>
      sdf.capsule([ax, ay, az], [bx, by, bz], 0.011);
    const grooves = sdf.union(
      groove(0.085, 0.205, 0.15, -0.075, 0.12, 0.205),
      groove(0.055, 0.215, 0.165, -0.095, 0.105, 0.21),
      groove(0.02, 0.22, 0.175, -0.115, 0.085, 0.208),
    );
    const hair = sweptShape.smoothSubtract(0.006, grooves).bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.55,
      detail: 0.004,
      bump: (x, y) => 0.001 * Math.sin(x * 90 + y * 40),
    });

    // Full-length plain trousers to the shoe tops (the kind cuff ends mid-shin on long legs).
    // The hips run a touch slim so the shirt always covers them. The leg tapers through a
    // slight knee into a slim calf (like jeans), ending above the shoe.
    const kneeR = 0.048;
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.cone(HIP, KNEE, 0.06, kneeR).bone('leg.L'),
      sdf.sphere(kneeR).at(...KNEE).bone('leg.L'),
      sdf.cone(KNEE, [P.ankle[0], 0.17, P.ankle[2]], kneeR, 0.039).round(0.002).bone('shin.L'),
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
