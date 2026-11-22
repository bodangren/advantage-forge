import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';
import type { HumanoidProportions, HumanoidShape } from './parts/humanoid-kind.js';
import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Grandma, Lily and Tom's grandmother in Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/grandma.jpg.
 * Role: the older woman in the week 4 family renders, a little shorter than Mom with a soft round
 * build, seen large next to the age-5 children.
 * One idea: a kind older woman with large dark-brown eyes and white hair in a neat bun on top of
 * her head, in a light-green knitted cardigan over a light-green top, a long light-green skirt,
 * and brown flats, with small pearl studs.
 * Shape language: round and soft, with the cardigan knit as the one repeated form.
 * Palette (60/30/10): light-green cardigan #a9c79b with knit shade #93b386; light-green top
 *   #c9dfc0; long light-green skirt #9cbd93; white hair #ece9e4; brown flats #6b4226.
 * Bodies: skin, white hair (neat cap, center part, compact sides to the nape, small top bun),
 *   cardigan (V neck with rib trim, button column, long sleeves, ribbed cuffs and hem), top,
 *   long skirt with waistband, flats, studs. Rig: the humanoid kind's skeleton and clips on a
 *   Grandma-short body; the cardigan rides the torso, the skirt hangs from the hips. Long
 *   sleeves follow the elbow and the wrist.
 */

// Grandma is a little shorter than Mom: ADULT shrunk 6 % in height only, local to this file.
// Every Y position grows down; widths, depths, and radii stay the adult's, and the round build
// comes from the cardigan and skirt bodies. The bun rides low so her total height stays below
// Mom's. ADULT is unchanged.
const SHORT = 0.94;
type V3 = readonly [number, number, number];
const vY = (p: V3): V3 => [p[0], p[1] * SHORT, p[2]];
const GRANNY: HumanoidProportions = {
  ...ADULT,
  headY: ADULT.headY * SHORT,
  eye: [ADULT.eye[0], ADULT.eye[1] * SHORT],
  face: {
    ...ADULT.face,
    cheekAt: vY(ADULT.face.cheekAt),
    chinAt: vY(ADULT.face.chinAt),
    noseY: ADULT.face.noseY * SHORT,
    earAt: vY(ADULT.face.earAt),
    browY: ADULT.face.browY * SHORT,
    smileY: ADULT.face.smileY * SHORT,
    blushY: ADULT.face.blushY * SHORT,
  },
  neck: { y0: ADULT.neck.y0 * SHORT, y1: ADULT.neck.y1 * SHORT, r: ADULT.neck.r },
  bones: {
    hips: vY(ADULT.bones.hips),
    spine: vY(ADULT.bones.spine),
    chest: vY(ADULT.bones.chest),
    neck: vY(ADULT.bones.neck),
    head: vY(ADULT.bones.head),
    cloak: vY(ADULT.bones.cloak),
  },
  shoulder: vY(ADULT.shoulder),
  elbow: vY(ADULT.elbow),
  wrist: vY(ADULT.wrist),
  grip: vY(ADULT.grip),
  // The hand's rest placement must follow the shortened wrist. Left at the adult height, the
  // hand's own skin cuff sat above the wrist and poked through the green sleeve cuff (a peach
  // oval in the raised arm and a patch above the lowered cuff). Scale it with every other Y.
  fist: { ...ADULT.fist, palmAt: vY(ADULT.fist.palmAt) },
  hip: vY(ADULT.hip),
  knee: vY(ADULT.knee),
  ankle: vY(ADULT.ankle),
  torso: {
    profile: ADULT.torso.profile.map(([x, y]): [number, number] => [x, y * SHORT]),
    hips: [ADULT.torso.hips[0], ADULT.torso.hips[1] * SHORT],
    spine: [ADULT.torso.spine[0], ADULT.torso.spine[1] * SHORT],
    chest: [ADULT.torso.chest[0], ADULT.torso.chest[1] * SHORT],
  },
  foot: { ...ADULT.foot, y: ADULT.foot.y * SHORT },
  shirt: {
    sleeveStart: vY(ADULT.shirt.sleeveStart),
    sleeveEnd: vY(ADULT.shirt.sleeveEnd),
    sleeveR: ADULT.shirt.sleeveR,
    collarY: ADULT.shirt.collarY * SHORT,
    hemY: ADULT.shirt.hemY * SHORT,
    belt: [ADULT.shirt.belt[0] * SHORT, ADULT.shirt.belt[1] * SHORT],
  },
  pants: {
    ...ADULT.pants,
    cuff: vY(ADULT.pants.cuff),
    hipsY: ADULT.pants.hipsY * SHORT,
  },
  shoe: {
    ...ADULT.shoe,
    cylinderY: ADULT.shoe.cylinderY * SHORT,
    toeAt: vY(ADULT.shoe.toeAt),
    soleTop: ADULT.shoe.soleTop * SHORT,
    scale: ADULT.shoe.scale * SHORT,
  },
  clips: {
    ...ADULT.clips,
    leg: ADULT.clips.leg * SHORT,
    heelZ: ADULT.clips.heelZ * SHORT,
    toeZ: ADULT.clips.toeZ * SHORT,
  },
};

const C = {
  cardigan: '#a9c79b',
  knit: '#93b386',
  rib: '#bcd3ae',
  top: '#c9dfc0',
  topShade: '#b3cba8',
  skirt: '#9cbd93',
  skirtShade: '#86a37e',
  waistband: '#8aa87f',
  flats: '#6b4226',
  sole: '#3d2716',
  pearl: '#fbf7ee',
};
const CABLES = 14;

// Grandma's face detail (Daniel 2026-11-22: more detail in the faces), matched to
// docs/sprout-mockups/grandma.jpg. Paint only: the shared stencils and every other
// kind user keep today's look, so their GLBs stay byte-identical.
const GRANDMA_FACE = {
  irisDark: '#3a2412',
  irisLow: '#6e4520',
  pupil: '#101314',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  freckle: '#c08a68',
  noseShade: '#d89a78',
  // Fixed pale grey: the shared tint.brow follows the hair color, which is white
  // here, so it would wash out (Dad fixed his for the same reason, dark instead).
  // The reference brows are soft light-grey arcs.
  brow: '#a8a39c',
  lid: '#1c130f',
  white: '#f6f1ea',
  lip: '#d98f8f',
  ageLine: '#c98f6e',
};

/** Grandma's face over the shared paint: almond eyes, gentle near-closed smile, age marks. */
const grandmaFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = GRANNY.face.smileY;
  const browY = GRANNY.face.browY;
  const noseY = GRANNY.face.noseY;

  // Almond eyes (Dad r3 recipe): the shared eye is big and round; the reference
  // eyes are medium almond eyes with brown irises and one catchlight. Cut an
  // almond opening with an exact hard skin stencil (a box over the whole shared
  // eye minus the almond solid), lay fresh white in the hole, then a smaller dark
  // iris, the pupil, one catchlight, and a thin upper lid line. Paint only: no
  // geometry moves, so the head clearances cannot change.
  const almond = profile.polygon(
    [
      [EX - 0.046, EY + 0.004],
      [EX - 0.02, EY + 0.022],
      [EX + 0.005, EY + 0.027],
      [EX + 0.03, EY + 0.02],
      [EX + 0.048, EY + 0.002],
      [EX + 0.025, EY - 0.014],
      [EX, EY - 0.02],
      [EX - 0.022, EY - 0.012],
    ] as [number, number][],
    { smooth: true },
  );
  const almondSolid = sdf.extrude(almond, 0.34).at(0, 0, 0.1);
  const eyeBox = sdf.box([0.14, 0.125, 0.3], 0.01).at(EX + 0.0075, EY + 0.0025, 0.1);
  const almondCut = pair(eyeBox.subtract(almondSolid));
  const white = pair(almondSolid);
  const dark = pair(h.onFace(sdf.ellipsoid([0.028, 0.02, 0.07]), EX, EY + 0.002));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.002));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.012, 0.013, 0.07]), EX, EY + 0.004));
  const big = pair(h.onFace(sdf.sphere(0.008), EX + 0.01, EY + 0.008));
  const lidLine = pair(sdf.extrude(profile.arc(0.05, 0.007, 35, 145), 0.3).at(EX, EY - 0.023, 0.1));
  // The eye box trims the top of the shared cheek blush; lay it back below the
  // eye so the cheek keeps its soft color with no seam.
  const blushBack = pair(
    h
      .onFace(sdf.sphere(0.032), 0.135, GRANNY.face.blushY)
      .intersect(sdf.halfSpace([0, 1, 0], EY - 0.02)),
  );

  // The shared brow band is heavy; cover it with an exact-footprint hard skin
  // stencil (a wider cover left a pale slab in Lily's rounds, a soft edge a halo)
  // and paint a shorter, thinner, softly arched brow in the same place: the
  // reference brow is short, light, and gentle, and must not merge with the
  // lashes (thinner than r2 here).
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.075, 0.011, 66, 114), 0.3).at(0.1, browY - 0.1, 0.1));

  // A gentle near-closed smile with clearly upturned corners (judge r3): the r2
  // grin collapsed to a dark dash at 128 px, and the reference smile is soft and
  // small. A light lip line frames the mouth, a dark red interior sits inside it,
  // and a small white teeth hint at the top center keeps the smile readable at
  // sprite size. No tongue: the mouth is near-closed.
  const lipOutline = profile.polygon(
    [
      [-0.04, 0.011],
      [-0.02, 0.005],
      [0, 0.003],
      [0.02, 0.005],
      [0.04, 0.011],
      [0.033, -0.004],
      [0.013, -0.013],
      [-0.013, -0.013],
      [-0.033, -0.004],
    ] as [number, number][],
    { smooth: true },
  );
  const mouthOutline = profile.polygon(
    [
      [-0.036, 0.009],
      [-0.018, 0.004],
      [0, 0.002],
      [0.018, 0.004],
      [0.036, 0.009],
      [0.03, -0.003],
      [0.012, -0.011],
      [-0.012, -0.011],
      [-0.03, -0.003],
    ] as [number, number][],
    { smooth: true },
  );
  const lip = sdf.extrude(lipOutline, 0.3).at(0, smileY, 0.1);
  const mouth = sdf.extrude(mouthOutline, 0.3).at(0, smileY - 0.001, 0.1);
  const teeth = sdf
    .box([0.032, 0.008, 0.3], 0.003)
    .at(0, smileY + 0.0035, 0.1)
    .intersect(mouth);

  // Age marks the reference shows: soft smile (nasolabial) lines from the nose
  // wings to the mouth corners, and crow's feet at the outer eye corners (judge
  // r3: deeper than r2 so they read as smile lines, still soft, never scar-like).
  const crease = (pts: [number, number][], r: number) =>
    sdf.chain(
      pts.map(([x, y]): [number, number, number, number] => [x, y, h.faceZ(x, y) - 0.001, r]),
      0.002,
    );
  const nasolabial = pair(
    crease(
      [
        [0.026, noseY + 0.004],
        [0.037, noseY - 0.012],
        [0.04, smileY + 0.012],
      ],
      0.0032,
    ),
  );
  const crowsfeet = pair(
    crease(
      [
        [EX + 0.04, EY + 0.002],
        [EX + 0.05, EY + 0.008],
        [EX + 0.054, EY + 0.016],
      ],
      0.0028,
    ),
  );

  // A soft shade under the small nose and a light scatter of freckles over the
  // nose bridge (judge r3: lighter than r2, so the dots no longer dominate).
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, noseY - 0.018, h.faceZ(0, noseY - 0.018));
  const dots: [number, number][] = [
    [-0.03, 0.012],
    [-0.014, 0.02],
    [0.004, 0.014],
    [0.022, 0.02],
    [0.038, 0.01],
  ];
  const freckles = sdf.union(...dots.map(([dx, dy]) => h.onFace(sdf.sphere(0.002), dx, noseY + dy)));

  return skin
    .paintWhere(almondCut, h.tint.skin!)
    .paintWhere(white, GRANDMA_FACE.white)
    .paintWhere(dark, GRANDMA_FACE.irisDark, 0.006)
    .paintWhere(low, GRANDMA_FACE.irisLow, 0.004)
    .paintWhere(pupil, GRANDMA_FACE.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(lidLine, GRANDMA_FACE.lid)
    .paintWhere(blushBack, h.tint.blush!, 0.03)
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, GRANDMA_FACE.brow!)
    .paintWhere(lip, GRANDMA_FACE.lip, 0.001)
    .paintWhere(mouth, GRANDMA_FACE.mouth, 0.001)
    .paintWhere(teeth, GRANDMA_FACE.teeth, 0.001)
    .paintWhere(nasolabial, GRANDMA_FACE.ageLine, 0.002)
    .paintWhere(crowsfeet, GRANDMA_FACE.ageLine, 0.002)
    .paintWhere(shade, GRANDMA_FACE.noseShade, 0.01)
    .paintWhere(freckles, GRANDMA_FACE.freckle, 0.001);
};

export default humanoidAsset({
  name: 'sprout-grandma',
  description:
    'Grandma, an older woman: large dark-brown eyes, white hair in a neat bun on top of her head, a light-green knitted cardigan over a light-green top, a long light-green skirt, brown flats, and pearl stud earrings.',
  reference: 'docs/sprout-mockups/grandma.jpg',
  proportions: GRANNY,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#ece9e4', silver: '#c9c9cf', grey: '#9a9aa0', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { green: '#a9c79b', sage: '#8aa87f', cream: '#e8dcc8', rose: '#d8a8a0' },
  },
  presets: {
    grandma: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'green' },
  },

  // Cut the arm skin inside the long sleeves. The skin upper arm blends into the chest
  // band near the shoulder while the sleeve takes only arm weights, so a raised arm left
  // a skin strip under the sleeve. Keep a short wrist stub inside the cuff; the hand is
  // its own body below it. Then Grandma's face detail (Daniel 2026-11-22), matched to
  // docs/sprout-mockups/grandma.jpg. Paint only: the shared kind keeps today's look.
  paintSkin(skin, h) {
    const { SHOULDER, ELBOW, WRIST } = h.joints;
    const d: V3 = [WRIST[0] - ELBOW[0], WRIST[1] - ELBOW[1], WRIST[2] - ELBOW[2]];
    const len = Math.hypot(...d);
    const cutEnd: V3 = [WRIST[0] - (0.004 * d[0]) / len, WRIST[1] - (0.004 * d[1]) / len, WRIST[2] - (0.004 * d[2]) / len];
    const armCut = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, GRANNY.limb.upper[0] + 0.022, GRANNY.limb.upper[1] + 0.022),
      sdf.cone(ELBOW, cutEnd, GRANNY.limb.fore[0] + 0.022, GRANNY.limb.fore[1] + 0.022),
    );
    return grandmaFace(skin.subtract(sdf.union(armCut, armCut.mirror('x', 0))), h);
  },

  extra(k, h) {
    const { ELBOW, WRIST, HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = GRANNY;
    const H = P.head;

    // ---------------------------------------------------------------- neat white hair with a top bun
    // Local frame: y 0 is the head center. One smooth shell: a cap 0.013 m off the skull, a
    // shallow center part high on the crown, compact sides from the temples to the nape ending
    // above the collar, and a small bun on top, slightly back. Everything joins with wide
    // fillets, so no stepped bands. The face opening stays wide, so the forehead reads and the
    // sides never reach the gesture hand zone in front of the cheeks.
    const cap = sdf.ellipsoid([H[0] + 0.013, H[1] + 0.013, H[2] + 0.012]).at(0, 0.01, -0.008);
    const faceOpen = sdf
      .ellipsoid([0.15, 0.115, 0.24])
      .at(0, -0.04, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], 0.06))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02));
    const outerHug = sdf.ellipsoid([H[0] + 0.018, H[1] + 0.018, H[2] + 0.018]).at(0, 0.01, -0.008);
    // The center part: a narrow groove along the crown, where the cap is thickest,
    // so no groove end pokes through the hair surface (deepened a touch in r3
    // behind the forehead: the front end keeps its r2 radius, because the
    // expanded groove ball there just clears the cap top).
    const part = sdf
      .chain(
        [
          [0, 0.155, 0.045, 0.009],
          [0, 0.148, -0.01, 0.011],
          [0, 0.14, -0.065, 0.01],
        ],
        0.008,
      )
      .smoothIntersect(0.012, outerHug);
    // Compact sides and back: a slim band from the temples around to the nape, ending above
    // the collar, well behind the cheeks so the wave hand passes clean.
    const sides = sdf
      .smoothUnion(
        0.02,
        sdf.chain(
          [
            [0.14, 0.04, 0.02, 0.036],
            [0.148, -0.04, -0.03, 0.034],
            [0.13, -0.1, -0.055, 0.028],
          ],
          0.03,
        ),
        sdf.chain(
          [
            [0.085, -0.06, -0.12, 0.036],
            [0.0, -0.085, -0.145, 0.036],
            [-0.085, -0.06, -0.12, 0.036],
          ],
          0.032,
        ),
      )
      .smoothIntersect(0.02, outerHug);
    // (The swirled knot replaces the old top bun; see the locks block above.)
    // Swept locks from the center part (judge r3: the r2 cords sank into the cap
    // and read as a smooth helmet). Four separated tapered locks per side run
    // from the part over the crown toward the temples: each lock is a tapering
    // chain whose tip lands well sideways of its root, standing proud of the cap
    // with a small union fillet (0.006) that keeps deep grooves between the
    // strands and staggered depths like shingles. Nothing hangs vertical, and the
    // whole sweep stays inside outerHug above the face opening, so the forehead
    // reads and no gesture hand reaches it.
    const lock = (
      rx: number, ry: number, rz: number,
      mx: number, my: number, mz: number,
      tx: number, ty: number, tz: number,
      r: number,
    ) =>
      sdf.chain(
        [
          [rx, ry, rz, r],
          [mx, my, mz, r * 0.6],
          [tx, ty, tz, 0.004],
        ],
        0.012,
      );
    const locks = sdf.smoothUnion(
      0.006,
      lock(0.012, 0.15, 0.098, 0.07, 0.132, 0.1, 0.145, 0.075, 0.068, 0.02),
      lock(0.01, 0.146, 0.102, 0.064, 0.126, 0.107, 0.14, 0.068, 0.075, 0.019),
      lock(0.012, 0.14, 0.108, 0.058, 0.118, 0.112, 0.128, 0.066, 0.09, 0.017),
      lock(0.014, 0.132, 0.112, 0.052, 0.108, 0.115, 0.1, 0.07, 0.108, 0.015),
    );
    // The crown joins the cap with a small fillet so the grooves between the
    // locks survive; the sides and the knot keep the wide mass fillet.
    const crown = sdf.smoothUnion(0.008, cap, pair(locks));
    // The bun is a swirled knot now (judge r3: the r2 ball read pointy): an
    // oblate ball with a tilted wrap ring and a shallow swirl groove across the
    // top. It sits low on the crown center, where no gesture hand travels.
    const knot = sdf.smoothUnion(
      0.015,
      sdf.sphere(0.062).scale([1, 0.8, 1]).at(0, 0.188, -0.035),
      sdf.torus(0.05, 0.015).rotateX(90).rotateZ(14).at(0, 0.162, -0.035),
    );
    const swirl = sdf
      .chain(
        [
          [-0.032, 0.232, -0.028, 0.007],
          [0.0, 0.242, -0.042, 0.007],
          [0.032, 0.232, -0.052, 0.007],
        ],
        0.006,
      )
      .smoothIntersect(0.015, outerHug);
    const bun = knot.smoothSubtract(0.008, swirl);
    const mass = sdf.smoothUnion(0.03, crown, pair(sides), bun).smoothSubtract(0.018, part);
    // Fine strand lines combed along the sweep (Dad r3 recipe): subtle grey
    // streaks parallel to the swept locks, in the upper sweep zone only, so the
    // crown reads as separated strands and not one smooth cap.
    const hairPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let groove = 0;
      for (const c of [0.055, 0.073, 0.091, 0.109, 0.127, 0.145]) {
        const t = (y - 0.36 * x - c) / 0.005;
        groove += Math.exp(-t * t);
      }
      const band = Math.min(1, Math.max(0, (y - 0.03) / 0.02)) * (z > -0.05 ? 1 : 0.3);
      return mixRgb(base, rgb('#8f8c88'), Math.min(1, groove) * band * 0.22);
    };
    const hair = mass.smoothSubtract(0.014, faceOpen).paintFn(hairPaint).bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y) => 0.001 * Math.sin(x * 90 + y * 40),
    });

    // ---------------------------------------------------------------- light-green top under the cardigan
    // The top covers the full torso; the cardigan sits outside it. Only the V at the neck shows.
    const HEM = P.shirt.hemY - 0.02;
    const topBody = h.torso.round(0.0).smoothIntersect(0.008, sdf.halfSpace([0, -1, 0], -HEM));
    const top = sdf
      .smoothUnion(0.008, h.weighted(topBody))
      .paintWhere(sdf.halfSpace([0, 1, 0], P.shirt.collarY - 0.012), C.topShade, 0.004);
    k.body('top', top, { color: C.top, roughness: 0.9 });

    // ---------------------------------------------------------------- light-green knitted cardigan, long sleeves
    // The cardigan sits 0.016 m proud of the top for a soft round build. A narrow opening at
    // the neck shows the top in a V; below it the front is buttoned. The knit is vertical ribs
    // in paint and bump, like Mom's cables. Sleeves ride as their own body over the arm skin,
    // so a raised arm never drapes a web (the Dad lesson).
    const cableTri = (x: number, z: number) => {
      const t = ((((CABLES * Math.atan2(x, z)) / (2 * Math.PI)) % 1) + 1) % 1;
      return 1 - 4 * Math.abs(t - 0.5);
    };
    const cardiBase = h.torso.round(0.016).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -HEM));
    const neckOpen = sdf.box([0.1, 0.17, 0.3]).at(0, P.shirt.collarY - 0.095, 0.1);
    const cardiTorso = sdf.smoothUnion(0.012, h.weighted(cardiBase)).smoothSubtract(0.015, neckOpen);
    const cardi = cardiTorso
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.knit), 0.4 * (0.5 - 0.5 * cableTri(x, z))))
      .paintWhere(
        sdf.halfSpace([0, -1, 0], -HEM).intersect(sdf.halfSpace([0, 1, 0], HEM + 0.06)),
        C.rib,
        0.004,
      );
    k.body('cardigan', cardi, {
      color: k.tint('cloth'),
      roughness: 0.9,
      textureDensity: 2,
      bump: (x, _y, z) => 0.002 * cableTri(x, z),
    });
    // Long sleeves with ribbed cuffs. The rib paint stencil is a fresh untagged torus:
    // a stencil that carries a bone tag must never touch a tagged body.
    // The sleeve cones match the skin arm's weight layout: upperarm and forearm tags with the
    // same 0.02 m elbow fillet. A hand-tagged cuff follows the wrist in point-up while the skin
    // forearm stays on the forearm bone, so the skin cuts through. Tag the cuff forearm.L.
    const upper = sdf.cone(P.shirt.sleeveStart, ELBOW, P.shirt.sleeveR[0], 0.052).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, WRIST, 0.052, 0.042).bone('forearm.L');
    const cuff = sdf.torus(0.044, 0.012).at(WRIST[0], WRIST[1], WRIST[2]).bone('forearm.L');
    const cuffPaint = sdf.torus(0.044, 0.014).at(WRIST[0], WRIST[1], WRIST[2]);
    const sleeves = sdf
      .smoothUnion(0.02, upper, fore, pair(cuff))
      .paintFn((x, y, _z, base) => mixRgb(base, rgb(C.knit), 0.4 * (0.5 - 0.5 * cableTri(x, y))))
      .paintWhere(pair(cuffPaint), C.rib, 0.004);
    k.body('sleeves', pair(sleeves), { color: k.tint('cloth'), roughness: 0.9, textureDensity: 2 });
    // V-neck front bands along the opening edges, in the cardigan color so they read as the
    // buttoned front, not a separate scarf; the lighter top shows in the V between them.
    const trimL = sdf
      .box([0.03, 0.17, 0.022], 0.006)
      .rotateZ(14)
      .at(0.052, P.shirt.collarY - 0.085, 0.098);
    const trimR = sdf
      .box([0.03, 0.17, 0.022], 0.006)
      .rotateZ(-14)
      .at(-0.052, P.shirt.collarY - 0.085, 0.098);
    k.body('necktrim', h.weighted(sdf.smoothUnion(0.006, trimL, trimR)), {
      color: k.tint('cloth'),
      roughness: 0.9,
    });
    // Four buttons down the buttoned front.
    const button = (i: number) =>
      sdf
        .sphere(0.009)
        .scale([1, 1, 0.6])
        .at(0.048, P.shirt.collarY - 0.22 - i * 0.072, 0.104)
        .bone('chest');
    k.body('buttons', sdf.smoothUnion(0.003, button(0), button(1), button(2), button(3)), {
      color: C.waistband,
      roughness: 0.5,
      detail: 0.002,
    });

    // ---------------------------------------------------------------- long light-green skirt with waistband
    // A flared tube from the waist to below the knees; the hem clears the shoe tops so the
    // flats and the ankles read. It hangs from the hips bone and flares wide, so the legs
    // swing inside it in every clip.
    const WAIST_Y = HEM + 0.02;
    const SKIRT_HEM = 0.18;
    const skirtShell = sdf
      .revolve(
        profile.polygon(
          [
            [0.001, WAIST_Y + 0.03],
            [0.13, WAIST_Y + 0.02],
            [0.15, WAIST_Y - 0.1],
            [0.175, (WAIST_Y + SKIRT_HEM) / 2],
            [0.225, SKIRT_HEM],
          ],
          { smooth: true },
        ),
      )
      .scale([1, 1, 0.85])
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb(C.skirtShade), 0.18 * (0.5 - 0.5 * cableTri(x * 1.5, z * 1.5))),
      );
    const skirt = sdf.smoothUnion(0.02, skirtShell.bone('hips'));
    k.body('skirt', skirt, { color: C.skirt, roughness: 0.9, textureDensity: 2 });
    // A crisp waistband over the skirt top, rigid on the hips bone like the skirt: an
    // untagged body here falls back to distance-from-segments weights and its verts follow
    // the arms and legs (long blades in point-up and sway).
    const waistband = h.torso
      .round(0.01)
      .smoothIntersect(0.004, sdf.box([0.5, 0.04, 0.5]).at(0, WAIST_Y, 0))
      .bone('hips');
    k.body('waistband', waistband, { color: C.waistband, roughness: 0.85 });

    // ---------------------------------------------------------------- brown flat shoes
    const flatFoot = sdf
      .smoothUnion(
        0.025,
        sdf.cylinder(0.05, 0.045, 0.016).at(0, 0.038, 0),
        sdf.ellipsoid([0.052, 0.04, 0.095]).at(0, 0.036, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const flatSole = flatFoot
      .round(0.004)
      .intersect(sdf.halfSpace([0, 1, 0], 0.014))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const flat = sdf
      .union(flatFoot, flatSole.paint(C.sole))
      .rotateY(10)
      .scale(P.shoe.scale)
      .at(P.ankle[0], 0, 0)
      .bone('foot.L');
    k.body('flats', pair(flat), { color: C.flats, roughness: 0.6 });

    // ---------------------------------------------------------------- pearl stud earrings, below the hair sides
    const stud = sdf
      .sphere(0.009)
      .at(P.face.earAt[0] + 0.018, P.face.earAt[1] - 0.045, P.face.earAt[2] + 0.01)
      .bone('head');
    k.body('studs', pair(stud), { color: C.pearl, roughness: 0.25, detail: 0.002 });

    // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
    sproutGestures(k, h, GRANNY);
  },
});
