import { mixRgb, rgb, sdf } from '../src/index.js';
import type { HumanoidProportions } from './parts/humanoid-kind.js';
import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Grandpa, Lily and Tom's grandfather in Chibi Sprouts, faces +Z. Target:
 * docs/sprout-mockups/grandpa.jpg.
 * Role: the older man in the week 4 family renders, as tall as Mom, seen large next
 * to the age-5 children.
 * One idea: a kind older man with large dark-brown eyes behind round brown-framed
 * glasses, a bald head with white hair at the sides, and a bushy white mustache, in
 * a dark-green V-neck sweater over a light-green collared shirt, brown trousers,
 * and brown lace-up shoes.
 * Shape language: round and soft, with the sweater knit as the one repeated form.
 * Palette (60/30/10): dark-green sweater #4a7a52 with knit shade #3a6141; light-green
 *   shirt #c9dfc0; brown trousers #8a6a42; white hair #ece9e4; brown shoes #6b4226.
 * Bodies: skin, white side hair (compact puffs at the temples with a back band, bald
 *   crown), round brown glasses (rings, bridge, temples), bushy white mustache, white
 *   brow tufts, sweater (V neck with the shirt showing, long sleeves, ribbed cuffs
 *   and hem), collared shirt (front panel, collar, buttons), brown trousers, shoes.
 *   Rig: the humanoid kind's skeleton and clips at the adult size, the same height as
 *   Mom (ADULT unchanged, used directly). Every body carries an explicit bone tag.
 */

// Grandpa is as tall as Mom: Mom's 1.552 m comes from the adult body plus her hair
// cap, and Grandpa's bald crown builds 1.519 m on ADULT. A local 2.2 % height
// stretch closes the gap. Every Y position grows; widths, depths, and radii stay
// the adult's. ADULT is unchanged.
const TALL = 1.022;
type V3 = readonly [number, number, number];
const vY = (p: V3): V3 => [p[0], p[1] * TALL, p[2]];
const GRANDPA: HumanoidProportions = {
  ...ADULT,
  headY: ADULT.headY * TALL,
  eye: [ADULT.eye[0], ADULT.eye[1] * TALL],
  face: {
    ...ADULT.face,
    cheekAt: vY(ADULT.face.cheekAt),
    chinAt: vY(ADULT.face.chinAt),
    noseY: ADULT.face.noseY * TALL,
    earAt: vY(ADULT.face.earAt),
    browY: ADULT.face.browY * TALL,
    smileY: ADULT.face.smileY * TALL,
    blushY: ADULT.face.blushY * TALL,
  },
  neck: { y0: ADULT.neck.y0 * TALL, y1: ADULT.neck.y1 * TALL, r: ADULT.neck.r },
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
    profile: ADULT.torso.profile.map(([x, y]): [number, number] => [x, y * TALL]),
    hips: [ADULT.torso.hips[0], ADULT.torso.hips[1] * TALL],
    spine: [ADULT.torso.spine[0], ADULT.torso.spine[1] * TALL],
    chest: [ADULT.torso.chest[0], ADULT.torso.chest[1] * TALL],
  },
  foot: { ...ADULT.foot, y: ADULT.foot.y * TALL },
  shirt: {
    sleeveStart: vY(ADULT.shirt.sleeveStart),
    sleeveEnd: vY(ADULT.shirt.sleeveEnd),
    sleeveR: ADULT.shirt.sleeveR,
    collarY: ADULT.shirt.collarY * TALL,
    hemY: ADULT.shirt.hemY * TALL,
    belt: [ADULT.shirt.belt[0] * TALL, ADULT.shirt.belt[1] * TALL],
  },
  pants: {
    ...ADULT.pants,
    cuff: vY(ADULT.pants.cuff),
    hipsY: ADULT.pants.hipsY * TALL,
  },
  shoe: {
    ...ADULT.shoe,
    cylinderY: ADULT.shoe.cylinderY * TALL,
    toeAt: vY(ADULT.shoe.toeAt),
    soleTop: ADULT.shoe.soleTop * TALL,
    scale: ADULT.shoe.scale * TALL,
  },
  clips: {
    ...ADULT.clips,
    leg: ADULT.clips.leg * TALL,
    heelZ: ADULT.clips.heelZ * TALL,
    toeZ: ADULT.clips.toeZ * TALL,
  },
};

const CABLES = 14;
const C = {
  sweater: '#4a7a52',
  knit: '#3a6141',
  rib: '#5a8a62',
  shirt: '#c9dfc0',
  shirtShade: '#b3cba8',
  shirtButton: '#8aa87f',
  trousers: '#8a6a42',
  trouserDark: '#6f5433',
  shoe: '#6b4226',
  sole: '#3d2716',
  lace: '#d9c49a',
  glasses: '#4a2c1a',
};

export default humanoidAsset({
  name: 'sprout-grandpa',
  description:
    'Grandpa, an older man: large dark-brown eyes behind round brown-framed glasses, a bald head with white hair at the sides, a bushy white mustache, a dark-green V-neck sweater over a light-green collared shirt, brown trousers, and brown shoes.',
  reference: 'docs/sprout-mockups/grandpa.jpg',
  proportions: GRANDPA,
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
    eyes: { brown: '#4a2c14', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { green: '#4a7a52', sage: '#8aa87f', navy: '#3a5a8c', sand: '#c9b088' },
  },
  presets: {
    grandpa: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'green' },
  },

  extra(k, h) {
    const { ELBOW, WRIST, HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = GRANDPA;

    // ---------------------------------------------------------------- white hair at the sides, bald crown
    // Local frame: y 0 is the head center (eyes at -0.038, brows at +0.038). No cap:
    // the crown stays bare skin. Compact puffs hug the temples above the ears and a
    // slim band crosses the nape, all well behind the cheeks, so the wave hand and
    // the point-to-self hand pass clean in front of them.
    const puff = sdf.smoothUnion(
      0.02,
      sdf.sphere(0.038).at(0.175, 0.03, -0.005),
      sdf.sphere(0.034).at(0.2, -0.015, -0.02),
      sdf.sphere(0.03).at(0.185, -0.055, -0.035),
    );
    const backBand = sdf
      .chain(
        [
          [0.1, -0.1, -0.13, 0.024],
          [0.0, -0.115, -0.15, 0.024],
          [-0.1, -0.1, -0.13, 0.024],
        ],
        0.022,
      )
      .smoothIntersect(0.015, sdf.ellipsoid([0.225, 0.22, 0.21]).at(0, -0.01, -0.008));
    const sideHair = sdf.smoothUnion(0.02, pair(puff), backBand).bone('head');
    k.body('hair', sideHair.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y) => 0.001 * Math.sin(x * 90 + y * 40),
    });

    // ---------------------------------------------------------------- bushy white mustache, rigid on the head
    // Two wings sweep out from under the nose and end above the smile, sitting proud
    // of the face surface. The mouth stays visible below it, like the reference.
    const wing = sdf.smoothUnion(
      0.015,
      sdf.ellipsoid([0.045, 0.02, 0.025]).at(0.055, -0.112, 0.135),
      sdf.ellipsoid([0.032, 0.024, 0.026]).at(0.095, -0.105, 0.12),
      sdf.chain(
        [
          [0.01, -0.108, 0.145, 0.02],
          [0.05, -0.112, 0.14, 0.02],
        ],
        0.018,
      ),
    );
    const mustache = pair(wing).bone('head');
    k.body('mustache', mustache.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.65,
      detail: 0.004,
    });

    // ---------------------------------------------------------------- white brow tufts above the glasses
    const brow = sdf.ellipsoid([0.045, 0.015, 0.02]).at(0.095, 0.058, 0.135).bone('head');
    k.body('brows', pair(brow).at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.65,
      detail: 0.004,
    });

    // ---------------------------------------------------------------- round brown-framed glasses, rigid on the head
    // Two round rims around the eyes, a bridge across the nose top, and slim temples
    // back to the ears. The rims stand proud of the eye paint, so no rim z-fights
    // the face and no gesture hand drags them (they ride the head bone).
    const rim = sdf.torus(0.055, 0.007).rotateX(90).at(0.105, -0.038, 0.158).bone('head');
    const bridge = sdf.box([0.05, 0.012, 0.012], 0.004).at(0, -0.036, 0.16).bone('head');
    const temple = sdf
      .chain(
        [
          [0.155, -0.038, 0.15, 0.006],
          [0.19, -0.045, 0.05, 0.006],
          [0.2, -0.05, -0.01, 0.006],
        ],
        0.005,
      )
      .bone('head');
    const glasses = sdf.smoothUnion(0.004, pair(rim), bridge, pair(temple));
    k.body('glasses', glasses.at(0, HEAD_Y, 0), {
      color: C.glasses,
      roughness: 0.4,
      detail: 0.003,
    });

    // ---------------------------------------------------------------- light-green collared shirt under the sweater
    // The shirt covers the full torso; the sweater sits outside it. Only the V at the
    // neck shows. The collar rides the neck bone; the front panel is torso-weighted.
    const HEM = 0.7 * TALL;
    const shirtBase = h.torso.round(0.002).smoothIntersect(0.008, sdf.halfSpace([0, -1, 0], -HEM));
    const shirtBody = sdf
      .smoothUnion(0.01, h.weighted(shirtBase))
      .paintWhere(sdf.halfSpace([0, 1, 0], P.shirt.collarY - 0.015), C.shirtShade, 0.004);
    k.body('shirt', shirtBody, { color: C.shirt, roughness: 0.9 });
    // The shirt collar: a back band plus two open front flaps, rigid on the neck bone
    // (an untagged collar would catch the hanging arm).
    const shirtCollarBand = sdf.torus(0.075, 0.018).rotateX(90).at(0, P.shirt.collarY + 0.002, -0.005).bone('neck');
    const shirtFlap = sdf
      .box([0.045, 0.08, 0.016], 0.008)
      .rotateY(12)
      .rotateZ(8)
      .at(0.075, P.shirt.collarY - 0.035, 0.095)
      .bone('neck');
    k.body('shirt-collar', sdf.smoothUnion(0.008, shirtCollarBand, pair(shirtFlap)), {
      color: C.shirt,
      roughness: 0.9,
    });
    // Two shirt buttons down the visible V panel, rigid on the chest bone.
    const shirtButton = sdf.sphere(0.008).at(0, P.shirt.collarY - 0.09, 0.118).bone('chest');
    const shirtButton2 = sdf.sphere(0.008).at(0, P.shirt.collarY - 0.13, 0.115).bone('chest');
    k.body('shirt-buttons', sdf.smoothUnion(0.003, shirtButton, shirtButton2), {
      color: C.shirtButton,
      roughness: 0.5,
      detail: 0.002,
    });

    // ---------------------------------------------------------------- dark-green V-neck sweater, long sleeves
    // The sweater sits proud of the shirt for a soft round build. A narrow opening at
    // the neck shows the shirt in a V; below it the front is closed. The knit is
    // vertical ribs in paint and bump, like Mom's cables. Sleeves ride as their own
    // body over the arm skin, so a raised arm never drapes a web (the Dad lesson).
    const cableTri = (x: number, z: number) => {
      const t = ((((CABLES * Math.atan2(x, z)) / (2 * Math.PI)) % 1) + 1) % 1;
      return 1 - 4 * Math.abs(t - 0.5);
    };
    const sweaterBase = h.torso.round(0.01).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -HEM));
    const neckOpen = sdf.box([0.1, 0.18, 0.3]).at(0, P.shirt.collarY - 0.1, 0.1);
    const sweaterTorso = sdf.smoothUnion(0.012, h.weighted(sweaterBase)).smoothSubtract(0.015, neckOpen);
    const sweater = sweaterTorso
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.knit), 0.45 * (0.5 - 0.5 * cableTri(x, z))))
      .paintWhere(
        sdf.halfSpace([0, -1, 0], -HEM).intersect(sdf.halfSpace([0, 1, 0], HEM + 0.06)),
        C.rib,
        0.004,
      );
    k.body('sweater', sweater, {
      color: k.tint('cloth'),
      roughness: 0.9,
      textureDensity: 2,
      bump: (x, _y, z) => 0.002 * cableTri(x, z),
    });
    // V-neck rib trim along the opening edges, seated on the sweater surface.
    const trimL = sdf
      .box([0.028, 0.18, 0.022], 0.006)
      .rotateZ(16)
      .at(0.05, P.shirt.collarY - 0.09, 0.098);
    const trimR = sdf
      .box([0.028, 0.18, 0.022], 0.006)
      .rotateZ(-16)
      .at(-0.05, P.shirt.collarY - 0.09, 0.098);
    k.body('necktrim', h.weighted(sdf.smoothUnion(0.006, trimL, trimR)), {
      color: C.rib,
      roughness: 0.9,
    });
    // Long sleeves with ribbed cuffs. The rib paint stencil is a fresh untagged torus:
    // a stencil that carries a bone tag must never touch a tagged body.
    const upper = sdf.cone(P.shirt.sleeveStart, ELBOW, P.shirt.sleeveR[0], 0.052).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, WRIST, 0.052, 0.042).bone('forearm.L');
    const cuff = sdf.torus(0.044, 0.012).at(WRIST[0], WRIST[1], WRIST[2]).bone('hand.L');
    const cuffPaint = sdf.torus(0.044, 0.014).at(WRIST[0], WRIST[1], WRIST[2]);
    const sleeves = sdf
      .smoothUnion(0.01, upper, fore, pair(cuff))
      .paintFn((x, y, _z, base) => mixRgb(base, rgb(C.knit), 0.45 * (0.5 - 0.5 * cableTri(x, y))))
      .paintWhere(pair(cuffPaint), C.rib, 0.004);
    k.body('sleeves', pair(sleeves), { color: k.tint('cloth'), roughness: 0.9, textureDensity: 2 });

    // ---------------------------------------------------------------- brown trousers to the shoe tops
    const kneeR = 0.054;
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.cone(HIP, KNEE, 0.064, kneeR).bone('leg.L'),
      sdf.sphere(kneeR).at(...KNEE).bone('leg.L'),
      sdf.cone(KNEE, [P.ankle[0], 0.17, P.ankle[2]], kneeR, 0.044).round(0.002).bone('shin.L'),
    );
    const trousers = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([P.pants.hipsSize[0] * 0.98, P.pants.hipsSize[1], P.pants.hipsSize[2] * 0.98]).at(0, P.pants.hipsY, 0).bone('hips'),
        pair(trouserLeg),
      )
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.trouserDark), 0.2 * (0.5 - 0.5 * Math.cos((x * 2 + z) * 40) * Math.cos(y * 25))));
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });

    // ---------------------------------------------------------------- brown lace-up shoes
    const shoeFoot = sdf
      .smoothUnion(
        0.025,
        sdf.cylinder(0.052, 0.048, 0.016).at(0, 0.04, 0),
        sdf.ellipsoid([0.054, 0.042, 0.1]).at(0, 0.038, 0.048),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoeSole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.015)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const laces = sdf
      .box([0.05, 0.012, 0.07], 0.004)
      .rotateX(-8)
      .at(0, 0.078, 0.045)
      .paintWhere(sdf.halfSpace([1, 0, 0], 0.012).intersect(sdf.halfSpace([-1, 0, 0], 0.012)), C.sole, 0.002);
    const shoe = sdf
      .union(shoeFoot, shoeSole.paint(C.sole), laces.paint(C.lace))
      .rotateY(10)
      .scale(P.shoe.scale)
      .at(P.ankle[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.55 });

    // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
    sproutGestures(k, h, GRANDPA);
  },
});
