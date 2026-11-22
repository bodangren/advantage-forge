import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';
import type { HumanoidProportions, HumanoidShape } from './parts/humanoid-kind.js';
import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Dad, Tom and Lily's young father in Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/dad.jpg.
 * Role: the tallest of the family in the week 4 renders, seen large next to the age-5 children.
 * One idea: a kind young father with short black side-part hair, large dark-brown eyes, and a
 * warm smile, in a red-and-black plaid shirt worn open over a white T-shirt, dark-blue jeans,
 * and brown lace-up shoes.
 * Shape language: round and soft, with the buffalo check as the one repeated form.
 * Palette (60/30/10): plaid red #b03a2e with black checks #23211f; white tee #f2f2ee;
 *   dark-blue jeans #2e4a6e; brown shoes #6b4226; short black hair #1e1c1a.
 * Bodies: skin, short hair (cap, side part, swept top, short back and sides), open plaid shirt
 *   (back, two front panels, long sleeves, cuffs, collar, chest pockets), white tee, jeans,
 *   shoes. Rig: the humanoid kind's skeleton and clips on a Dad-tall body; the shirt is
 *   weighted on the torso, the jeans on the hips and legs. Long sleeves follow the elbow
 *   and the wrist.
 */

// Dad is the tallest of the family: ADULT stretched 5 % in height only, local to this file.
// Every Y position grows; widths, depths, and radii stay the adult's. ADULT is unchanged.
const TALL = 1.05;
type V3 = readonly [number, number, number];
const vY = (p: V3): V3 => [p[0], p[1] * TALL, p[2]];
const DAD: HumanoidProportions = {
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

const C = {
  plaid: '#b03a2e',
  plaidDark: '#23211f',
  placket: '#8e2c24',
  tee: '#f2f2ee',
  teeShade: '#d8d8d2',
  jeans: '#2e4a6e',
  denimDark: '#223954',
  shoe: '#6b4226',
  sole: '#3d2716',
  lace: '#d9c49a',
  button: '#4a2c1a',
};
const CHECK = 0.085;

// Dad's face detail (Daniel 2026-11-22: more detail in the faces), matched to
// docs/sprout-mockups/dad.jpg. Paint only: the shared stencils and every other
// kind user keep today's look, so their GLBs stay byte-identical.
const DAD_FACE = {
  irisDark: '#3a2412',
  irisLow: '#6e4520',
  pupil: '#101314',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  noseShade: '#d89a78',
  brow: '#2e2013',
  lid: '#1c130f',
  white: '#f6f1ea',
};

/** Dad's face over the shared paint: almond eyes, open toothy smile, soft nose shade. */
const dadFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = DAD.face.smileY;
  const browY = DAD.face.browY;

  // Almond eyes (judge r3): the shared eye is big and round; the reference eyes
  // are medium almond eyes with brown irises and one catchlight. Cut an almond
  // opening with an exact hard skin stencil (a box over the whole shared eye
  // minus the almond solid), lay fresh white in the hole, then a smaller dark
  // iris, the pupil, one catchlight, and a thin upper lid line. Paint only: no
  // geometry moves, so the head clearances cannot change. r4 shrinks the
  // opening and the iris a touch so the eye reads medium, not large.
  const almond = profile.polygon(
    [
      [EX - 0.042, EY + 0.004],
      [EX - 0.018, EY + 0.02],
      [EX + 0.005, EY + 0.024],
      [EX + 0.028, EY + 0.018],
      [EX + 0.044, EY + 0.002],
      [EX + 0.023, EY - 0.012],
      [EX, EY - 0.018],
      [EX - 0.02, EY - 0.011],
    ] as [number, number][],
    { smooth: true },
  );
  const almondSolid = sdf.extrude(almond, 0.34).at(0, 0, 0.1);
  const eyeBox = sdf.box([0.14, 0.125, 0.3], 0.01).at(EX + 0.0075, EY + 0.0025, 0.1);
  const almondCut = pair(eyeBox.subtract(almondSolid));
  const white = pair(almondSolid);
  const dark = pair(h.onFace(sdf.ellipsoid([0.031, 0.033, 0.07]), EX, EY - 0.001));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.006));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.016, 0.018, 0.07]), EX, EY + 0.003));
  const big = pair(h.onFace(sdf.sphere(0.009), EX + 0.012, EY + 0.008));
  const lidLine = pair(sdf.extrude(profile.arc(0.046, 0.006, 35, 145), 0.3).at(EX, EY - 0.019, 0.1));
  // The eye box trims the top of the shared cheek blush; lay it back below the
  // eye so the cheek keeps its soft color with no seam. Clipped well clear of
  // the outer eye corner (r4: the softer r3 clip reached the corner).
  const blushBack = pair(
    h
      .onFace(sdf.sphere(0.032), 0.135, DAD.face.blushY)
      .intersect(sdf.halfSpace([0, 1, 0], EY - 0.04)),
  );

  // The shared brow band is heavy; cover it with an exact-footprint hard skin
  // stencil (a wider cover left a pale slab in Lily's rounds, a soft edge a halo)
  // and paint a shorter, gently curved, strong brow in the same place: the
  // reference brow is bold and dark, bolder than Mom's (softened a touch from r2,
  // which read stern in the bow pose).
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.08, 0.014, 68, 112), 0.3).at(0.1, browY - 0.1, 0.1));

  // A warm open smile with one thin white teeth band at the top (no fang
  // corners) and a wide tongue: the thin band and the wide tongue keep the open
  // smile reading at 128 px instead of a white dash (Tom r3).
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
    ).map(([x, y]): [number, number] => [x, y]),
    { smooth: true },
  );
  const mouth = sdf.extrude(outline, 0.3).at(0, smileY, 0.1);
  const teeth = sdf
    .box([0.062, 0.009, 0.3], 0.004)
    .at(0, smileY - 0.0035, 0.1)
    .intersect(mouth);
  const tongue = mouth.intersect(sdf.ellipsoid([0.03, 0.015, 0.5]).at(0, smileY - 0.026, 0.1));

  // A soft shade under the small nose. The reference cheeks are smooth, so no freckles.
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, DAD.face.noseY - 0.018, h.faceZ(0, DAD.face.noseY - 0.018));

  return skin
    .paintWhere(almondCut, h.tint.skin!)
    .paintWhere(white, DAD_FACE.white)
    .paintWhere(dark, DAD_FACE.irisDark, 0.006)
    .paintWhere(low, DAD_FACE.irisLow, 0.004)
    .paintWhere(pupil, DAD_FACE.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(lidLine, DAD_FACE.lid)
    .paintWhere(blushBack, h.tint.blush!, 0.01)
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, DAD_FACE.brow!)
    .paintWhere(mouth, DAD_FACE.mouth, 0.001)
    .paintWhere(tongue, DAD_FACE.tongue, 0.002)
    .paintWhere(teeth, DAD_FACE.teeth, 0.001)
    .paintWhere(shade, DAD_FACE.noseShade, 0.01);
};

export default humanoidAsset({
  name: 'sprout-dad',
  description: 'Dad, a young father: medium almond brown eyes, short black side-part hair swept to his left, a red-and-black plaid shirt open over a white T-shirt, dark-blue jeans, and brown shoes.',
  reference: 'docs/sprout-mockups/dad.jpg',
  proportions: DAD,
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
    hair: { black: '#1e1c1a', brown: '#5a301d', grey: '#8a8a8e', blond: '#c4974a' },
    eyes: { brown: '#4a2c14', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { red: '#b03a2e', green: '#3f6b4a', blue: '#3a5a8c', sand: '#c9b088' },
  },
  presets: {
    dad: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'red' },
  },

  // Cut the arm skin inside the long sleeves. The skin upper arm blends into the chest
  // band near the shoulder while the sleeve takes only arm weights, so a raised arm left
  // a skin strip under the sleeve. Keep a short wrist stub inside the cuff; the hand is
  // its own body below it. Then Dad's face detail (Daniel 2026-11-22), matched to
  // docs/sprout-mockups/dad.jpg. Paint only: the shared kind keeps today's look.
  paintSkin(skin, h) {
    const { SHOULDER, ELBOW, WRIST } = h.joints;
    const d: V3 = [WRIST[0] - ELBOW[0], WRIST[1] - ELBOW[1], WRIST[2] - ELBOW[2]];
    const len = Math.hypot(...d);
    const cutEnd: V3 = [WRIST[0] - (0.004 * d[0]) / len, WRIST[1] - (0.004 * d[1]) / len, WRIST[2] - (0.004 * d[2]) / len];
    const armCut = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, DAD.limb.upper[0] + 0.022, DAD.limb.upper[1] + 0.022),
      sdf.cone(ELBOW, cutEnd, DAD.limb.fore[0] + 0.022, DAD.limb.fore[1] + 0.022),
    );
    return dadFace(skin.subtract(sdf.union(armCut, armCut.mirror('x', 0))), h);
  },

  extra(k, h) {
    const { ELBOW, WRIST, HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = DAD;
    const H = P.head;

    // ---------------------------------------------------------------- short black side-part hair
    // Local frame: y 0 is the head center. One smooth shell: a cap 0.013 m off the skull, a
    // swept top with more volume on the part side, and short sides and back ending above the
    // collar. The face opening stays wide, so the forehead and ears read like the reference.
    const cap = sdf.ellipsoid([H[0] + 0.013, H[1] + 0.013, H[2] + 0.012]).at(0, 0.01, -0.008);
    const faceOpen = sdf
      .ellipsoid([0.155, 0.12, 0.24])
      .at(0, -0.04, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], 0.055))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02));
    // The side part: a narrow groove high on the crown only, so it never cuts
    // through the cap. It stays behind the forehead: both ends above y 0.13.
    // r4: the part sits on his right (-X), as in the reference (r3 had it
    // mirrored); the fringe sweeps from the part to his left.
    const outerHug = sdf.ellipsoid([H[0] + 0.018, H[1] + 0.018, H[2] + 0.018]).at(0, 0.01, -0.008);
    const part = sdf
      .chain(
        [
          [-0.05, 0.175, 0.02, 0.014],
          [-0.035, 0.15, 0.06, 0.012],
          [-0.025, 0.13, 0.09, 0.011],
        ],
        0.008,
      )
      .smoothIntersect(0.012, outerHug);
    // The swept top: a smooth ridge from the part across the crown to the right temple.
    const sweep = sdf
      .chain(
        [
          [-0.09, 0.12, 0.05, 0.035],
          [0.0, 0.14, 0.09, 0.04],
          [0.09, 0.12, 0.1, 0.036],
          [0.14, 0.07, 0.07, 0.028],
        ],
        0.032,
      )
      .smoothIntersect(0.018, outerHug);
    // Short sides and back: a band from the temples around to the nape, ending above the collar.
    const sides = sdf
      .smoothUnion(
        0.02,
        sdf.chain(
          [
            [0.15, 0.05, 0.02, 0.045],
            [0.165, -0.03, -0.02, 0.042],
            [0.15, -0.1, -0.05, 0.036],
          ],
          0.035,
        ),
        sdf.chain(
          [
            [0.1, -0.02, -0.14, 0.045],
            [0.0, -0.06, -0.17, 0.045],
            [-0.1, -0.02, -0.14, 0.045],
          ],
          0.04,
        ),
      )
      .smoothIntersect(0.02, outerHug);
    // Separated front edge (r4): the spike fringe sat inside the fat swept mass
    // and melted into a smooth edge, so the fringe works the other way now.
    // Three shallow notches scallop the hairline edge upward between the locks,
    // leaving skin wedges between four lock fronts; two short flicks hug the
    // temples in front of the sideburns. Nothing hangs vertical.
    const notch = (nx: number, ny: number, tilt: number) =>
      sdf.ellipsoid([0.016, 0.022, 0.05]).rotateZ(tilt).at(nx, ny, 0.15);
    const notches = sdf.smoothUnion(0.006, notch(-0.06, 0.058, 14), notch(-0.005, 0.066, 16), notch(0.05, 0.06, 18));
    const flick = (sx: number) =>
      sdf.chain(
        [
          [sx, 0.08, 0.088, 0.014],
          [sx * 0.97, 0.06, 0.1, 0.008],
          [sx * 0.94, 0.042, 0.11, 0.003],
        ],
        0.008,
      );
    const fringe = sdf.smoothUnion(0.006, flick(0.13), flick(-0.13));
    const mass = sdf.smoothUnion(0.03, sdf.smoothUnion(0.006, cap, fringe), pair(sweep), pair(sides)).smoothSubtract(0.018, part);
    // Fine strand lines combed along the sweep (judge r3): subtle dark streaks
    // parallel to the swept locks, in the upper sweep zone only.
    const hairPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let groove = 0;
      for (const c of [0.075, 0.089, 0.103, 0.117, 0.131]) {
        const t = (y + 0.28 * x - c) / 0.004;
        groove += Math.exp(-t * t);
      }
      const band = Math.min(1, Math.max(0, (y - 0.03) / 0.02)) * (z > -0.05 ? 1 : 0.3);
      return mixRgb(base, rgb('#0d0c0b'), Math.min(1, groove) * band * 0.3);
    };
    const hair = mass.smoothSubtract(0.014, faceOpen).smoothSubtract(0.008, notches).paintFn(hairPaint).bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.55,
      detail: 0.004,
      bump: (x, y) => 0.001 * Math.sin(x * 90 + y * 40),
    });

    // ---------------------------------------------------------------- white T-shirt under the open shirt
    // The tee covers the full torso; the open plaid shirt sits outside it. Both hems run
    // below the belt line, so no skin shows between the shirt and the jeans; they sit
    // a further 12 mm lower than before so the skin wedge under the old tee hem stays
    // covered at rest and in the listen lean. The open front design is unchanged.
    const HEM = P.shirt.hemY - 0.062;
    // The long plaid sleeves cover the arms fully (like the reference), so the tee
    // needs no sleeves: a sleeved tee poked white through the shoulder tops.
    const teeBody = h.torso.round(0.002).smoothIntersect(0.008, sdf.halfSpace([0, -1, 0], -HEM));
    const tee = sdf
      .smoothUnion(0.01, h.weighted(teeBody))
      .paintWhere(sdf.halfSpace([0, 1, 0], P.shirt.collarY - 0.015), C.teeShade, 0.004);
    k.body('tee', tee, { color: C.tee, roughness: 0.9 });
    // A round ribbed tee collar at the neck, rigid on the neck bone (an untagged body
    // here would fall back to all-bone segment distance and catch the hanging arm).
    const teeCollar = sdf.torus(0.068, 0.014).rotateX(90).at(0, P.shirt.collarY - 0.005, 0).bone('neck');
    k.body('tee-collar', teeCollar, { color: C.teeShade, roughness: 0.9, detail: 0.003 });

    // ---------------------------------------------------------------- open red-and-black plaid shirt
    // The shirt sits outside the tee. The front center is cut open from the collar to the
    // hem, so the white tee shows in a front panel. Buffalo check in paint: black squares
    // where both waves peak, a blend where one peaks, red elsewhere.
    const plaid = (x: number, y: number) => {
      const u = 0.5 - 0.5 * Math.cos((x / CHECK) * Math.PI * 2);
      const v = 0.5 - 0.5 * Math.cos((y / CHECK) * Math.PI * 2);
      if (u > 0.55 && v > 0.55) return 0.85;
      if (u > 0.55 || v > 0.55) return 0.3;
      return 0;
    };
    const shirtBase = h.torso.round(0.01).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -HEM));
    const opening = sdf.box([0.15, P.shirt.collarY - HEM + 0.02, 0.3]).at(0, (P.shirt.collarY + HEM) / 2, 0.14);
    const shirtTorso = sdf.smoothUnion(0.012, h.weighted(shirtBase)).smoothSubtract(0.015, opening);
    const shirt = shirtTorso.paintFn((x, y, _z, base) => mixRgb(base, rgb(C.plaidDark), plaid(x, y)));
    k.body('shirt', shirt, { color: k.tint('cloth'), roughness: 0.85, textureDensity: 2 });
    // Long sleeves ride as their own body over the arm skin, overlapping the torso at the
    // shoulder: unioning them into the open torso drapes a web between a raised arm and the
    // free front edge (a wing in point-up and stretch-up). The closed tee proves separate
    // overlapping bodies ride every clip cleanly. No shoulder cap: an embedded cap tagged
    // with the arm peels out of the torso when the arm rises (the same wing).
    // The sleeve cones match the skin arm's weight layout: upperarm and forearm tags with the
    // same 0.02 m elbow fillet. A hand-tagged cuff follows the wrist in point-up while the skin
    // forearm stays on the forearm bone, so the skin cuts through. Tag the cuff forearm.L.
    const upper = sdf.cone(P.shirt.sleeveStart, ELBOW, P.shirt.sleeveR[0], 0.052).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, WRIST, 0.052, 0.042).bone('forearm.L');
    const cuff = sdf.torus(0.046, 0.013).at(WRIST[0], WRIST[1], WRIST[2]).bone('forearm.L');
    const sleeves = sdf
      .smoothUnion(0.02, upper, fore, pair(cuff))
      .paintFn((x, y, _z, base) => mixRgb(base, rgb(C.plaidDark), plaid(x, y)));
    k.body('sleeves', pair(sleeves), { color: k.tint('cloth'), roughness: 0.85, textureDensity: 2 });
    // Placket strips along the open front edges, seated on the shirt surface. They follow
    // the torso bands like the shirt (an untagged strip would catch the hanging arm).
    const placket = h.weighted(
      sdf.smoothUnion(
        0.006,
        sdf.box([0.028, P.shirt.collarY - HEM, 0.02]).at(0.08, (P.shirt.collarY + HEM) / 2, 0.115),
        sdf.box([0.028, P.shirt.collarY - HEM, 0.02]).at(-0.08, (P.shirt.collarY + HEM) / 2, 0.115),
      ),
    ).paintFn((x, y, _z, base) => mixRgb(base, rgb(C.plaidDark), plaid(x, y)));
    k.body('placket', placket, { color: C.placket, roughness: 0.85 });
    // The shirt collar: a back band plus two open front flaps, rigid on the neck bone
    // (an untagged collar would catch the hanging arm like the placket did).
    const collarBand = sdf.torus(0.078, 0.02).rotateX(90).at(0, P.shirt.collarY + 0.005, -0.01).bone('neck');
    const flap = sdf
      .box([0.05, 0.09, 0.018], 0.008)
      .rotateY(12)
      .rotateZ(8)
      .at(0.085, P.shirt.collarY - 0.03, 0.1)
      .bone('neck')
      .paintFn((x, y, _z, base) => mixRgb(base, rgb(C.plaidDark), plaid(x, y)));
    k.body('collar', sdf.smoothUnion(0.008, collarBand, pair(flap)), { color: k.tint('cloth'), roughness: 0.85 });
    // Two chest pockets with buttons, like the reference. Rigid on the chest bone, glued to
    // the chest-weighted shirt panel in every clip.
    const pocket = sdf
      .box([0.075, 0.08, 0.025], 0.01)
      .at(0.105, P.shirt.collarY - 0.17, 0.115)
      .bone('chest')
      .paintFn((x, y, _z, base) => mixRgb(base, rgb(C.plaidDark), plaid(x, y)));
    const pocketFlap = sdf.box([0.075, 0.03, 0.028], 0.008).at(0.105, P.shirt.collarY - 0.125, 0.115).bone('chest');
    const button = sdf.sphere(0.009).at(0.105, P.shirt.collarY - 0.125, 0.13).bone('chest');
    k.body('pockets', sdf.smoothUnion(0.006, pair(pocket), pair(pocketFlap)), { color: k.tint('cloth'), roughness: 0.85 });
    k.body('pocket-buttons', pair(button), { color: C.button, roughness: 0.5, detail: 0.002 });

    // ---------------------------------------------------------------- dark-blue jeans to the shoe tops
    // The leg cones start tucked inside the hip mass (hipsY - 0.03), not up at the
    // HIP joint: the old cone ran to chest height with a sharp cap rim, and in a
    // spine roll (listen) the shirt side swung off that static rim, so blue broke
    // through at the waist. Everything above the hem hides under the shirt and tee,
    // so the visible leg below the hem is unchanged.
    const kneeR = 0.054;
    const jeanLeg = sdf.smoothUnion(
      0.012,
      sdf.cone([HIP[0], P.pants.hipsY - 0.03, HIP[2]], KNEE, 0.058, kneeR).bone('leg.L'),
      sdf.sphere(kneeR).at(...KNEE).bone('leg.L'),
      sdf.cone(KNEE, [P.ankle[0], 0.17, P.ankle[2]], kneeR, 0.044).round(0.002).bone('shin.L'),
    );
    // The hip mass takes the torso weight bands (the shirt's layout), not a rigid
    // hips tag: in a spine roll the shirt side shifts while rigid jeans stay, so the
    // jeans broke through at the waist. Weighted like the shirt, the hip mass leans
    // with it. It is also slimmer than the shirt waist (0.90/0.92 vs the shirt's
    // full torso round), so the inner layer keeps clearance through the roll. At
    // rest the weights are the identity and the mass hides inside, so the
    // silhouette is unchanged (the Grandpa fix 10632c67; Ben's jeans use the same
    // weighted-hips recipe).
    const jeanHips = h.weighted(
      sdf.ellipsoid([P.pants.hipsSize[0] * 0.9, P.pants.hipsSize[1], P.pants.hipsSize[2] * 0.92]).at(0, P.pants.hipsY, 0),
    );
    const jeans = sdf
      .smoothUnion(
        0.03,
        jeanHips,
        pair(jeanLeg),
      )
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.denimDark), 0.3 * (0.5 - 0.5 * Math.cos((x * 2 + z) * 40) * Math.cos(y * 25))));
    k.body('jeans', jeans, { color: C.jeans, roughness: 0.85 });

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
    sproutGestures(k, h, DAD);
  },
});
