import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { HumanoidProportions, HumanoidShape } from './parts/humanoid-kind.js';
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

// Grandpa's face detail (Daniel 2026-11-22: more detail in the faces), matched to
// docs/sprout-mockups/grandpa.jpg. Paint only: the shared stencils and every other
// kind user keep today's look, so their GLBs stay byte-identical.
const GRANDPA_FACE = {
  irisDark: '#3a2412',
  irisLow: '#6e4520',
  pupil: '#101314',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  noseShade: '#d89a78',
  // Fixed light warm grey: the shared tint.brow follows the hair color, which is
  // white here, so it would wash out (Grandma fixed hers pale grey for the same
  // reason, Dad his dark). The reference brows are soft white-grey arcs. The
  // white brow-tuft geometry covers most of this paint; it reads in the gaps.
  brow: '#c9c4ba',
  ageLine: '#c98f6e',
};

/** Grandpa's face over the shared paint: dark round iris, open smile below the mustache, age marks. */
const grandpaFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = GRANDPA.face.smileY;
  const browY = GRANDPA.face.browY;
  const noseY = GRANDPA.face.noseY;

  // Dark round iris with a warm low arc, the pupil, and one big catchlight: the
  // reference eye is deep brown with a single bright spark, seen through glasses.
  const dark = pair(h.onFace(sdf.ellipsoid([0.037, 0.044, 0.07]), EX, EY - 0.006));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.008));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.026, 0.029, 0.07]), EX, EY + 0.004));
  const big = pair(h.onFace(sdf.sphere(0.012), EX + 0.015, EY + 0.018));
  const small = pair(h.onFace(sdf.sphere(0.005), EX - 0.013, EY - 0.02));

  // The shared brow band is heavy and brown; cover it with an exact-footprint hard
  // skin stencil (a wider cover left a pale slab in Lily's rounds, a soft edge a
  // halo) and paint a shorter, thinner, softly arched brow in the same place: the
  // reference brow is short, light, and bushy, sitting just above the glasses.
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.07, 0.014, 62, 118), 0.3).at(0.1, browY - 0.1, 0.1));

  // A gentle open smile below the mustache: dark inside, one thin rounded white
  // teeth band at the top and a wide tongue, so the open smile still reads at
  // 128 px (Tom r3: teeth 0.009, tongue 0.03). Both bands are clipped inside the
  // mouth. The mouth sits a full teeth-band lower than the parents' so the
  // mustache bottom edge clears the white band: tucked any higher, the mustache
  // silk occludes the teeth and only the tongue shows.
  const mY = smileY - 0.012;
  const outline = profile.polygon(
    (
      [
        [-0.052, 0.014],
        [-0.026, 0.006],
        [0, 0.004],
        [0.026, 0.006],
        [0.052, 0.014],
        [0.044, -0.012],
        [0.018, -0.03],
        [-0.018, -0.03],
        [-0.044, -0.012],
      ] as [number, number][]
    ).map(([x, y]): [number, number] => [x * 0.9, y * 0.9]),
    { smooth: true },
  );
  const mouth = sdf.extrude(outline, 0.3).at(0, mY, 0.1);
  const teeth = sdf
    .box([0.062, 0.009, 0.3], 0.004)
    .at(0, mY - 0.0035, 0.1)
    .intersect(mouth);
  const tongue = mouth.intersect(sdf.ellipsoid([0.03, 0.015, 0.5]).at(0, mY - 0.022, 0.1));

  // Age marks the reference shows: soft smile (nasolabial) lines from the nose
  // wings to the mouth corners, crow's feet at the outer eye corners, and two
  // forehead lines across the bald crown. Thin chains sunk 1 mm into the face
  // surface, so they read as soft creases.
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
        [0.046, mY + 0.019],
      ],
      0.0025,
    ),
  );
  const crowsfeet = pair(
    crease(
      [
        [EX + 0.04, EY + 0.002],
        [EX + 0.05, EY + 0.008],
        [EX + 0.054, EY + 0.016],
      ],
      0.0022,
    ),
  );
  const foreheadLow = crease(
    [
      [-0.055, browY + 0.03],
      [-0.02, browY + 0.036],
      [0.02, browY + 0.036],
      [0.055, browY + 0.03],
    ],
    0.0022,
  );
  const foreheadHigh = crease(
    [
      [-0.045, browY + 0.05],
      [-0.015, browY + 0.055],
      [0.015, browY + 0.055],
      [0.045, browY + 0.05],
    ],
    0.0022,
  );

  // A soft shade under the nose. The reference cheeks are smooth, so no freckles.
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, noseY - 0.018, h.faceZ(0, noseY - 0.018));

  return skin
    .paintWhere(dark, GRANDPA_FACE.irisDark, 0.006)
    .paintWhere(low, GRANDPA_FACE.irisLow, 0.008)
    .paintWhere(pupil, GRANDPA_FACE.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(small, '#ffffff')
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, GRANDPA_FACE.brow!)
    .paintWhere(mouth, GRANDPA_FACE.mouth, 0.001)
    .paintWhere(tongue, GRANDPA_FACE.tongue, 0.002)
    .paintWhere(teeth, GRANDPA_FACE.teeth, 0.001)
    .paintWhere(nasolabial, GRANDPA_FACE.ageLine, 0.002)
    .paintWhere(crowsfeet, GRANDPA_FACE.ageLine, 0.002)
    .paintWhere(foreheadLow, GRANDPA_FACE.ageLine, 0.002)
    .paintWhere(foreheadHigh, GRANDPA_FACE.ageLine, 0.002)
    .paintWhere(shade, GRANDPA_FACE.noseShade, 0.01);
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

  // Cut the arm skin inside the long sleeves. The skin upper arm blends into the chest
  // band near the shoulder while the sleeve takes only arm weights, so a raised arm left
  // a skin strip under the sleeve. Keep a short wrist stub inside the cuff; the hand is
  // its own body below it. Then Grandpa's face detail (Daniel 2026-11-22), matched to
  // docs/sprout-mockups/grandpa.jpg. Paint only: the shared kind keeps today's look.
  paintSkin(skin, h) {
    const { SHOULDER, ELBOW, WRIST } = h.joints;
    const d: V3 = [WRIST[0] - ELBOW[0], WRIST[1] - ELBOW[1], WRIST[2] - ELBOW[2]];
    const len = Math.hypot(...d);
    const cutEnd: V3 = [WRIST[0] - (0.004 * d[0]) / len, WRIST[1] - (0.004 * d[1]) / len, WRIST[2] - (0.004 * d[2]) / len];
    const armCut = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, GRANDPA.limb.upper[0] + 0.022, GRANDPA.limb.upper[1] + 0.022),
      sdf.cone(ELBOW, cutEnd, GRANDPA.limb.fore[0] + 0.022, GRANDPA.limb.fore[1] + 0.022),
    );
    return grandpaFace(skin.subtract(sdf.union(armCut, armCut.mirror('x', 0))), h);
  },

  extra(k, h) {
    const { ELBOW, WRIST, HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = GRANDPA;

    // ---------------------------------------------------------------- white hair at the sides, bald crown
    // Local frame: y 0 is the head center (eyes at -0.038, brows at +0.038). No cap:
    // the crown stays bare skin. Three tapered strands per side sweep back from the
    // temples toward the nape (staggered tips and depths, grooves between strands,
    // skin showing between the tips), inside the old puff envelope, plus a slim
    // band across the nape, all well behind the cheeks, so the wave hand and
    // the point-to-self hand pass clean in front of them.
    const strand = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.008);
    const sideLocks = sdf.smoothUnion(
      0.004,
      strand([
        [0.155, 0.05, -0.002, 0.014],
        [0.182, 0.016, -0.008, 0.009],
        [0.2, -0.022, -0.018, 0.005],
      ]),
      strand([
        [0.15, 0.038, -0.018, 0.013],
        [0.174, -0.006, -0.026, 0.009],
        [0.188, -0.048, -0.038, 0.005],
      ]),
      strand([
        [0.145, 0.024, -0.032, 0.012],
        [0.164, -0.022, -0.04, 0.008],
        [0.174, -0.062, -0.052, 0.005],
      ]),
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
    const sideHair = sdf.smoothUnion(0.02, pair(sideLocks), backBand).bone('head');
    k.body('hair', sideHair.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y) => 0.001 * Math.sin(x * 90 + y * 40),
    });

    // ---------------------------------------------------------------- bushy white mustache, rigid on the head
    // Three tapered cords per side sweep out from under the nose and end in
    // staggered flicked tips above the smile (grooves between cords, skin-depth
    // steps, tips sideways of their roots), inside the old wing envelope, so no
    // gesture hand meets new surface. The mouth stays visible below it, like the
    // reference.
    const cord = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.012);
    const wing = sdf.smoothUnion(
      0.008,
      cord([
        [0.012, -0.098, 0.142, 0.02],
        [0.052, -0.102, 0.14, 0.016],
        [0.1, -0.09, 0.13, 0.007],
      ]),
      cord([
        [0.01, -0.108, 0.146, 0.019],
        [0.056, -0.112, 0.14, 0.015],
        [0.11, -0.1, 0.128, 0.006],
      ]),
      cord([
        [0.012, -0.116, 0.142, 0.017],
        [0.05, -0.12, 0.136, 0.013],
        [0.09, -0.112, 0.126, 0.006],
      ]),
    );
    const mustache = pair(wing).bone('head');
    k.body('mustache', mustache.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.65,
      detail: 0.004,
    });

    // ---------------------------------------------------------------- white brow tufts above the glasses
    // Two short tapered locks per side lean outward with staggered tips (groove
    // between them), sitting low just above the frames so the painted brow ends
    // peek out at the sides, inside the old tuft envelope, so the count-fingers
    // and eat hands meet no new surface at the glass rims.
    const tuft = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.006);
    const browLocks = sdf.smoothUnion(
      0.006,
      tuft([
        [0.073, 0.038, 0.132, 0.01],
        [0.093, 0.044, 0.136, 0.008],
        [0.114, 0.04, 0.133, 0.005],
      ]),
      tuft([
        [0.077, 0.048, 0.134, 0.009],
        [0.095, 0.053, 0.138, 0.007],
        [0.108, 0.048, 0.134, 0.004],
      ]),
    );
    const brow = pair(browLocks).bone('head');
    k.body('brows', brow.at(0, HEAD_Y, 0), {
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
    // The hem sits 12 mm below the Mom/Dad line so it covers the skin crotch wedge
    // that showed between the trouser legs just under the old hem, at rest and in
    // the listen lean. Shirt, sweater, and rib band all cut at this one line.
    const HEM = 0.688 * TALL;
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
    // The sleeve cones match the skin arm's weight layout: upperarm and forearm tags with the
    // same 0.02 m elbow fillet. A hand-tagged cuff follows the wrist in point-up while the skin
    // forearm stays on the forearm bone, so the skin cuts through. Tag the cuff forearm.L.
    const upper = sdf.cone(P.shirt.sleeveStart, ELBOW, P.shirt.sleeveR[0], 0.052).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, WRIST, 0.052, 0.042).bone('forearm.L');
    const cuff = sdf.torus(0.044, 0.012).at(WRIST[0], WRIST[1], WRIST[2]).bone('forearm.L');
    const cuffPaint = sdf.torus(0.044, 0.014).at(WRIST[0], WRIST[1], WRIST[2]);
    const sleeves = sdf
      .smoothUnion(0.02, upper, fore, pair(cuff))
      .paintFn((x, y, _z, base) => mixRgb(base, rgb(C.knit), 0.45 * (0.5 - 0.5 * cableTri(x, y))))
      .paintWhere(pair(cuffPaint), C.rib, 0.004);
    k.body('sleeves', pair(sleeves), { color: k.tint('cloth'), roughness: 0.9, textureDensity: 2 });

    // ---------------------------------------------------------------- brown trousers to the shoe tops
    // The leg cones start tucked inside the hip mass (hipsY - 0.03), not up at the
    // HIP joint: the old cone ran to y 0.945 with a sharp cap rim at chest height,
    // and in a spine roll (listen) the sweater side swung off that static rim, so
    // brown broke through the sweater. Everything above the hem hides inside the
    // sweater, so the visible leg below the hem is unchanged.
    const kneeR = 0.054;
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.cone([HIP[0], P.pants.hipsY - 0.03, HIP[2]], KNEE, 0.058, kneeR).bone('leg.L'),
      sdf.sphere(kneeR).at(...KNEE).bone('leg.L'),
      sdf.cone(KNEE, [P.ankle[0], 0.17, P.ankle[2]], kneeR, 0.044).round(0.002).bone('shin.L'),
    );
    // The hip mass takes the torso weight bands (the sweater's layout), not a rigid
    // hips tag: in a spine roll (listen, sway) the sweater hem shifts sideways while
    // rigid trousers stay, so the trousers broke through the sweater side at the
    // waist. Weighted like the sweater, the hip mass leans with it. It is also
    // slimmer than the sweater waist (0.90/0.92 vs the sweater's full torso
    // round), so the inner layer keeps clearance through the roll. At rest the
    // weights are the identity and the mass hides inside the sweater, so the
    // silhouette is unchanged (Ben's jeans use the same weighted-hips recipe).
    const trouserHips = h.weighted(
      sdf.ellipsoid([P.pants.hipsSize[0] * 0.9, P.pants.hipsSize[1], P.pants.hipsSize[2] * 0.92]).at(0, P.pants.hipsY, 0),
    );
    const trousers = sdf
      .smoothUnion(
        0.03,
        trouserHips,
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
