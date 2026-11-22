import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { AnimationDef, Pose, Rgb } from '../src/index.js';
import { ADULT, humanoidAsset } from './parts/humanoid-kind.js';
import type { HumanoidShape } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Mom, Tom and Lily's young mother in Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/mom.jpg.
 * Role: the young mother in the week 4 family renders, seen large next to the age-5 children.
 * One idea: a kind young mother whose long wavy medium-brown hair falls past her shoulders in
 * front, over a cream cable-knit sweater, blue jeans, and brown flats, with small pearl studs.
 * Shape language: round and soft, with the sweater cables as the one repeated form.
 * Palette (60/30/10): cream sweater #f2e7d0 with cable shade #cbb891; blue jeans
 *   #4e6fa0; medium-brown hair #7a5230; brown flats #7a4a2c; pearl studs #fbf7ee.
 * Bodies: skin, hair (one smooth shell, side part, front locks past the shoulders, back mass),
 *   sweater (cables, collar, cuffs, ribbed hem), jeans, flats, studs. Rig: the humanoid kind's
 *   skeleton and clips at adult size; the sweater is weighted on the torso, the jeans on the
 *   hips and legs. Long-sleeve arms follow the elbow and the wrist.
 */
const C = {
  sweater: '#f2e7d0',
  cable: '#cbb891',
  rib: '#d9c8a6',
  jeans: '#41608c',
  denimDark: '#33507c',
  flats: '#7a4a2c',
  sole: '#4a2e1e',
  pearl: '#fbf7ee',
};
const CABLES = 14;

/** Mom's face detail: dark round eyes, a gentle open smile with one teeth band. */
const MOM_FACE = {
  irisDark: '#3a2412',
  irisLow: '#6e4520',
  pupil: '#101314',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  freckle: '#b06a48',
  noseShade: '#d89a78',
};

const momFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = ADULT.face.smileY;
  const browY = ADULT.face.browY;

  // Dark round iris with a warm low arc, the pupil, and one big catchlight.
  const dark = pair(h.onFace(sdf.ellipsoid([0.037, 0.044, 0.07]), EX, EY - 0.006));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.008));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.026, 0.029, 0.07]), EX, EY + 0.004));
  const big = pair(h.onFace(sdf.sphere(0.012), EX + 0.015, EY + 0.018));
  const small = pair(h.onFace(sdf.sphere(0.005), EX - 0.013, EY - 0.02));

  // The shared brow band is heavy; cover it with an exact-footprint hard skin
  // stencil (a wider or soft cover left a pale slab in Lily's rounds) and paint a
  // shorter, thinner, gently arched brow in the same place.
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.07, 0.014, 62, 118), 0.3).at(0.1, browY - 0.1, 0.1));

  // A gentle open smile with one rounded white teeth band (no fang corners), as in
  // the reference: the band is a rounded box clipped to the mouth interior.
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
  const mouth = sdf.extrude(outline, 0.3).at(0, smileY, 0.1);
  const teeth = sdf
    .box([0.058, 0.013, 0.3], 0.006)
    .at(0, smileY - 0.006, 0.1)
    .intersect(mouth);
  const tongue = mouth.intersect(sdf.ellipsoid([0.022, 0.011, 0.5]).at(0, smileY - 0.024, 0.1));

  // A soft shade under the small nose and a scatter of freckles over the nose bridge.
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, ADULT.face.noseY - 0.018, h.faceZ(0, ADULT.face.noseY - 0.018));
  const dots: [number, number][] = [
    [-0.03, 0.012],
    [-0.014, 0.02],
    [0.004, 0.014],
    [0.022, 0.02],
    [0.038, 0.01],
    [-0.048, 0.004],
    [0.052, 0.002],
  ];
  const freckles = sdf.union(...dots.map(([dx, dy]) => h.onFace(sdf.sphere(0.0026), dx, ADULT.face.noseY + dy)));

  return skin
    .paintWhere(dark, MOM_FACE.irisDark, 0.006)
    .paintWhere(low, MOM_FACE.irisLow, 0.008)
    .paintWhere(pupil, MOM_FACE.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(small, '#ffffff')
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, h.tint.brow!)
    // The chin dot below the shared smile persists with mouth, tongue and teeth all
    // off, so it predates this pass (a shared-smile vertex artifact, sub-pixel at sheet
    // scale); the open smile below is restored.
    .paintWhere(mouth, MOM_FACE.mouth, 0.001)
    .paintWhere(tongue, MOM_FACE.tongue, 0.002)
    .paintWhere(teeth, MOM_FACE.teeth, 0.001)
    .paintWhere(shade, MOM_FACE.noseShade, 0.01)
    .paintWhere(freckles, MOM_FACE.freckle, 0.001);
};

export default humanoidAsset({
  name: 'sprout-mom',
  description: 'Mom, a young mother: large dark-brown eyes, long wavy medium-brown hair past her shoulders, a cream cable-knit sweater, blue jeans, brown flats, and pearl stud earrings.',
  reference: 'docs/sprout-mockups/mom.jpg',
  proportions: ADULT,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#7a5230', dark: '#5a301d', black: '#231a17', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { cream: '#f2e7d0', sand: '#e8d5b5', rose: '#e8b8a8', sage: '#b5c4a8' },
  },
  presets: {
    mom: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'cream' },
  },

  // Cut the arm skin inside the long sleeves. The skin upper arm blends into the chest
  // band near the shoulder while the sleeve takes only arm weights, so a raised arm left
  // a skin strip under the sleeve. Keep a short wrist stub inside the cuff; the hand is
  // its own body below it. Then Mom's face detail (Daniel 2026-11-22), matched to
  // docs/sprout-mockups/mom.jpg. Paint only: the shared kind keeps today's look.
  paintSkin(skin, h) {
    const { SHOULDER, ELBOW, WRIST } = h.joints;
    const d: readonly [number, number, number] = [WRIST[0] - ELBOW[0], WRIST[1] - ELBOW[1], WRIST[2] - ELBOW[2]];
    const len = Math.hypot(...d);
    const cutEnd: readonly [number, number, number] = [
      WRIST[0] - (0.004 * d[0]) / len,
      WRIST[1] - (0.004 * d[1]) / len,
      WRIST[2] - (0.004 * d[2]) / len,
    ];
    const armCut = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, ADULT.limb.upper[0] + 0.022, ADULT.limb.upper[1] + 0.022),
      sdf.cone(ELBOW, cutEnd, ADULT.limb.fore[0] + 0.022, ADULT.limb.fore[1] + 0.022),
    );
    return momFace(skin.subtract(sdf.union(armCut, armCut.mirror('x', 0))), h);
  },

  extra(k, h) {
    const { ELBOW, WRIST, HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = ADULT;
    const H = P.head;

    // ---------------------------------------------------------------- hair: one smooth long style past the shoulders
    // Local frame: y 0 is the head center (eyes at -0.038, brows at +0.038, chin at -0.116).
    // One smooth volume: a cap 0.015 m off the skull, a back mass to the mid-back, an inner
    // lock that hugs the jaw and ends there, and a thin outer curtain that falls outside
    // the arms and behind the shoulder to carry the length past the shoulders. Everything
    // joins with wide fillets, so no stepped bands. The face opening hugs the face:
    // 0.15 m half-width at the cheeks, narrowing to the chin, top edge above the brows.
    const cap = sdf.ellipsoid([H[0] + 0.015, H[1] + 0.015, H[2] + 0.014]).at(0, 0.005, -0.008);
    const faceOpen = sdf
      .ellipsoid([0.15, 0.115, 0.24])
      .at(0, -0.045, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], 0.048))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02));
    // The side part: a shallow narrow groove high on the crown only, so the forehead keeps
    // full coverage. A swept fringe under it crosses the forehead to the right temple and
    // ends just above the brows.
    const outerHug = sdf.ellipsoid([H[0] + 0.02, H[1] + 0.02, H[2] + 0.02]).at(0, 0.005, -0.008);
    const part = sdf
      .chain(
        [
          [0.03, 0.175, 0.03, 0.02],
          [-0.02, 0.15, 0.09, 0.016],
          [-0.06, 0.115, 0.125, 0.013],
        ],
        0.012,
      )
      .smoothIntersect(0.015, outerHug);
    const fringe = sdf
      .smoothUnion(
        0.012,
        sdf.chain(
          [
            [-0.06, 0.115, 0.12, 0.023],
            [0.02, 0.095, 0.13, 0.024],
            [0.1, 0.07, 0.125, 0.022],
          ],
          0.02,
        ),
        sdf.chain(
          [
            [-0.1, 0.095, 0.095, 0.024],
            [0.0, 0.07, 0.115, 0.025],
            [0.12, 0.045, 0.105, 0.022],
          ],
          0.02,
        ),
        sdf.chain(
          [
            [-0.08, 0.06, 0.095, 0.022],
            [0.03, 0.045, 0.11, 0.023],
            [0.14, 0.02, 0.09, 0.019],
          ],
          0.02,
        ),
      )
      .smoothIntersect(0.02, outerHug);
    // The front hair in two parts. The inner lock hugs the jaw and ends there, so the clap
    // transit and the point-to-self hand meet at the clear chest center. A thin outer curtain
    // falls outside the arms and behind the shoulder to carry the length past the shoulders;
    // hands never reach its height at its width. Both join the back mass with wide fillets:
    // one smooth style, no steps.
    const lock = sdf.chain(
      [
        [0.135, 0.06, 0.06, 0.05],
        [0.15, -0.08, 0.05, 0.05],
        [0.155, -0.15, 0.04, 0.042],
      ],
      0.05,
    );
    const curtain = sdf.chain(
      [
        [0.15, 0.08, 0.0, 0.035],
        [0.18, -0.05, -0.02, 0.033],
        [0.2, -0.2, -0.04, 0.03],
        [0.205, -0.36, -0.05, 0.026],
      ],
      0.04,
    );
    // The back mass: a smooth panel from the crown down the back to the mid-back. It stays
    // behind the clap hands: flattened (z 0.7, shifted back) and narrowed toward the bottom,
    // so its front face never reaches the hand zone (|x| < 0.12, z above 0.0) even when the
    // clap bounce pitches the head forward. Rounded at the ends by the union fillet below.
    const back = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.15],
            [0.1, 0.14],
            [0.155, 0.1],
            [0.17, 0.02],
            [0.16, -0.1],
            [0.14, -0.2],
            [0.11, -0.3],
            [0.07, -0.35],
            [0, -0.36],
          ],
          { smooth: true },
        ),
      )
      .scale([1, 1, 0.7])
      .at(0, 0, -0.07);
    const mass = sdf.smoothUnion(0.04, cap, back, pair(lock), pair(curtain), fringe).smoothSubtract(0.02, part);
    // Soft waves over the whole style: a gentle sideways sway that grows toward the ends.
    const waved = mass
      .displace(0.006, (x, y, z) => Math.sin(y * 14 + z * 6) * Math.min(1, Math.max(0, (-0.05 - y) / 0.25)))
      .smoothSubtract(0.015, faceOpen);
    const hair = waved.bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), {
      color: k.tint('hair'),
      roughness: 0.6,
      detail: 0.004,
      bump: (x, y) => 0.0012 * Math.sin(Math.atan2(x, 1) * 40 + y * 60),
    });

    // ---------------------------------------------------------------- cream cable-knit sweater, long sleeves
    // The body runs to a ribbed hem below the belt; the cables are vertical ribs in paint and
    // bump. Sleeves run shoulder to wrist in two weighted cones with ribbed cuffs. The sleeves
    // are a separate body over the arm skin: a raised arm would otherwise drag the torso union
    // into a point at the hem (the Dad lesson). The torso keeps hips/spine/chest tags only, so
    // the hem never takes an arm weight.
    // The hem is a true cut at 0.75, above the torso revolve's closed bottom: the
    // old cut sat below that closure, so the closed bottom hung on as a rounded
    // cream lobe between the leg tops and read as skin at sprite size. Cut here,
    // the hem ends as one clean straight edge across both hips (the mockup), with
    // the jeans directly under it. The rib band keeps the hem look.
    const HEM = 0.75;
    const cableTri = (x: number, z: number) => {
      const t = ((((CABLES * Math.atan2(x, z)) / (2 * Math.PI)) % 1) + 1) % 1;
      return 1 - 4 * Math.abs(t - 0.5);
    };
    const cablePaint = (x: number, _y: number, z: number, base: Rgb) =>
      mixRgb(base, rgb(C.cable), 0.45 * (0.5 - 0.5 * cableTri(x, z)));
    const sweaterBase = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -HEM));
    const sweaterTorso = h
      .weighted(sweaterBase)
      .paintFn(cablePaint)
      .paintWhere(
        sdf.halfSpace([0, -1, 0], -HEM).intersect(sdf.halfSpace([0, 1, 0], HEM + 0.06)),
        C.rib,
        0.004,
      );
    k.body('sweater', sweaterTorso, {
      color: h.tint.shirt!,
      roughness: 0.9,
      textureDensity: 2,
      bump: (x, _y, z) => 0.002 * cableTri(x, z),
    });
    // The sleeve cones match the skin arm's weight layout: upperarm and forearm tags with the
    // same 0.02 m elbow fillet, and a forearm-tagged cuff. A hand-tagged cuff follows the wrist
    // in point-up while the skin forearm stays on the forearm bone, so the skin cuts through.
    const upper = sdf.cone(P.shirt.sleeveStart, ELBOW, P.shirt.sleeveR[0], 0.052).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, WRIST, 0.052, 0.042).bone('forearm.L');
    const cuff = sdf.torus(0.044, 0.012).at(WRIST[0], WRIST[1], WRIST[2]).bone('forearm.L');
    const sleeves = sdf.smoothUnion(0.02, upper, fore, pair(cuff)).paintFn(cablePaint);
    k.body('sleeves', pair(sleeves), {
      color: h.tint.shirt!,
      roughness: 0.9,
      textureDensity: 2,
      bump: (x, _y, z) => 0.002 * cableTri(x, z),
    });
    // A round ribbed collar standing at the neck.
    const collarY = P.shirt.collarY + 0.01;
    const collar = sdf
      .smoothUnion(
        0.008,
        sdf.torus(0.075, 0.022).rotateX(90).at(0, collarY, 0),
        sdf.cylinder(0.075, 0.05, 0.02).at(0, collarY - 0.02, 0),
      )
      .bone('neck');
    k.body('collar', collar, { color: C.rib, roughness: 0.9, detail: 0.003 });

    // ---------------------------------------------------------------- blue jeans to the shoe tops
    // The leg cones start tucked inside the hip mass (hipsY - 0.03), not up at the
    // HIP joint: the old cone ran to y 0.92 with a sharp cap rim at chest height,
    // and in a spine roll (listen) the sweater side swung off that static rim, so
    // blue broke through the sweater. Everything above the hem hides inside the
    // sweater, so the visible leg below the hem is unchanged.
    const kneeR = 0.052;
    const jeanLeg = sdf.smoothUnion(
      0.012,
      sdf.cone([HIP[0], P.pants.hipsY - 0.03, HIP[2]], KNEE, 0.058, kneeR).bone('leg.L'),
      sdf.sphere(kneeR).at(...KNEE).bone('leg.L'),
      sdf.cone(KNEE, [P.ankle[0], 0.16, P.ankle[2]], kneeR, 0.042).round(0.002).bone('shin.L'),
    );
    // The hip mass takes the torso weight bands (the sweater's layout), not a rigid
    // hips tag: in a spine roll the sweater hem shifts sideways while rigid jeans
    // stay, so the jeans broke through the sweater side at the waist. Weighted like
    // the sweater, the hip mass leans with it. It is also slimmer than the sweater
    // waist (0.90/0.92 vs the sweater's full torso round), so the inner layer keeps
    // clearance through the roll. At rest the weights are the identity and the mass
    // hides inside the sweater, so the silhouette is unchanged (the Grandpa fix
    // 10632c67; Ben's jeans use the same weighted-hips recipe).
    const jeanHips = h.weighted(
      sdf.ellipsoid([P.pants.hipsSize[0] * 0.9, P.pants.hipsSize[1], P.pants.hipsSize[2] * 0.92]).at(0, P.pants.hipsY, 0),
    );
    // The jeans crotch bib: blue directly under the hem across the leg gap, so no
    // skin and no sweater lobe show between the legs. It spans the gap (x +-0.10)
    // from below the hem up into the hip mass, stays inside the sweater above the
    // hem, and hides behind the leg cones at its sides below it. Weighted on the
    // hips band like the hem region, so it rides every clip with the sweater.
    // A blue inner liner just inside the sweater across the hem window (y 0.68 to
    // 0.76): the kind's skin torso wall sits only 8 mm inside the sweater, so with
    // the lobe cut away the skin showed between the hem and the jeans. The liner
    // copies the torso wall 2 mm inside the sweater (6 mm outside the skin) in
    // jeans blue and swallows the skin torso bottom entirely. It takes the same
    // torso weights as the sweater, so the clearances never change in any clip.
    // From the front the hem window reads blue, like jeans under the hem.
    const hemLiner = h.weighted(h.torso.round(-0.002).intersect(sdf.box([0.3, 0.08, 0.3]).at(0, 0.72, 0)));
    const crotchBib = h.weighted(sdf.ellipsoid([0.1, 0.065, 0.075]).at(0, 0.725, 0.005));
    const jeans = sdf
      .smoothUnion(
        0.03,
        jeanHips,
        crotchBib,
        hemLiner,
        pair(jeanLeg),
      )
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.denimDark), 0.25 * (0.5 - 0.5 * cableTri(x * 2, z * 2))));
    k.body('jeans', jeans, { color: C.jeans, roughness: 0.85 });

    // ---------------------------------------------------------------- brown flat shoes
    const flatFoot = sdf
      .smoothUnion(
        0.025,
        sdf.cylinder(0.05, 0.045, 0.016).at(0, 0.038, 0),
        sdf.ellipsoid([0.052, 0.04, 0.095]).at(0, 0.036, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const flatSole = flatFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const flat = sdf
      .union(flatFoot, flatSole.paint(C.sole))
      .rotateY(10)
      .scale(P.shoe.scale)
      .at(P.ankle[0], 0, 0)
      .bone('foot.L');
    k.body('flats', pair(flat), { color: C.flats, roughness: 0.6 });

    // ---------------------------------------------------------------- pearl stud earrings
    const stud = sdf.sphere(0.009).at(P.face.earAt[0] + 0.012, P.face.earAt[1] - 0.035, P.face.earAt[2] + 0.012).bone('head');
    k.body('studs', pair(stud), { color: C.pearl, roughness: 0.25, detail: 0.002 });

    // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
    // Mom's clap keeps the exact shared hand goals, but softens the torso bounce: the long
    // hair rides the head bone, and the full dip (hips -24 mm, chest -8 deg, head +4 deg)
    // carries its ends forward into the meeting hands. The small bounce still reads.
    // (Wraps k.animation before the gestures register, the way sprout-may wraps walk/run.)
    const addClip = k.animation.bind(k);
    k.animation = (name: string, def: AnimationDef) => {
      if (name !== 'gesture-clap') return addClip(name, def);
      const pose = (t: number, p: number): Pose => {
        const base = def.pose(t, p);
        const hipsMove = base.hips?.move;
        const chestRotate = base.chest?.rotate;
        const headRotate = base.head?.rotate;
        return {
          ...base,
          ...(hipsMove ? { hips: { ...base.hips, move: [hipsMove[0], hipsMove[1] * 0.4, hipsMove[2]] as const } } : {}),
          ...(chestRotate ? { chest: { ...base.chest, rotate: [chestRotate[0] * 0.25, chestRotate[1], chestRotate[2]] as const } } : {}),
          ...(headRotate ? { head: { ...base.head, rotate: [headRotate[0] * 0.25, headRotate[1], headRotate[2]] as const } } : {}),
        };
      };
      return addClip(name, { ...def, pose });
    };
    sproutGestures(k, h, ADULT);
  },
});
