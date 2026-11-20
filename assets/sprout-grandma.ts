import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { HumanoidProportions } from './parts/humanoid-kind.js';
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
    // The center part: a shallow narrow groove along the crown, where the cap is thickest,
    // so no groove end pokes through the hair surface.
    const part = sdf
      .chain(
        [
          [0, 0.155, 0.045, 0.009],
          [0, 0.15, -0.01, 0.009],
          [0, 0.14, -0.065, 0.008],
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
    // The bun: a soft round ball on top, slightly back, with a wrap ring at its base. It sits
    // low on the crown center, where no gesture hand travels (stretch-up and point-up pass wide).
    const bun = sdf.smoothUnion(
      0.02,
      sdf.sphere(0.058).at(0, 0.195, -0.035),
      sdf.torus(0.05, 0.018).rotateX(90).at(0, 0.16, -0.035),
    );
    const mass = sdf.smoothUnion(0.03, cap, pair(sides), bun).smoothSubtract(0.018, part);
    const hair = mass.smoothSubtract(0.014, faceOpen).bone('head');
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
    const upper = sdf.cone(P.shirt.sleeveStart, ELBOW, P.shirt.sleeveR[0], 0.052).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, WRIST, 0.052, 0.042).bone('forearm.L');
    const cuff = sdf.torus(0.044, 0.012).at(WRIST[0], WRIST[1], WRIST[2]).bone('hand.L');
    const cuffPaint = sdf.torus(0.044, 0.014).at(WRIST[0], WRIST[1], WRIST[2]);
    const sleeves = sdf
      .smoothUnion(0.01, upper, fore, pair(cuff))
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
