import { profile, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Ben, a five-year-old boy of Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/ben.jpg (the
 * cast sheet; the songs draw him at five).
 * Role: a classmate in the kindergarten renders, seen large; the tousled light-brown hair with
 * pointed locks over the forehead and the plain blue shirt with jeans must read.
 * One idea: an easy-going boy with a tousled mop of light-brown hair in soft pointed locks. Shape language: round and soft.
 * Palette (60/30/10): shirt #5c94e0 (mid blue), jeans #3e5a9c (mid denim, lighter fade), hair #a07048 (chestnut light brown);
 *   grey sneakers #8a8a8a with white soles; the hair is the accent.
 * Bodies: skin (open smile), hair (tapered locks), shirt, jeans, shoes.
 * Rig: the humanoid kind's skeleton and clips at age 5.
 */

const C = { jeans: '#3e5a9c', jeansFade: '#5472ae', jeansDark: '#324c86', shoe: '#8a8a8a', sole: '#f4f2ee', lace: '#e6e6e6', mouth: '#7e2a2e', teeth: '#fbf8f0', tongue: '#e0707a' };

/** A wide open laughing mouth painted on the face: dark inside, a white tooth band, a tongue. */
const openSmile = (skin: sdf.Shape, smileY: number): sdf.Shape => {
  const outline = (s: number) =>
    profile.polygon(
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
      ).map(([x, y]): [number, number] => [x * s * 1.3, y * s * 1.1]),
      { smooth: true },
    );
  const mouth = sdf.extrude(outline(1), 0.3).at(0, smileY, 0.1);
  const teeth = sdf.extrude(outline(0.94), 0.3).at(0, smileY + 0.001, 0.1).intersect(sdf.halfSpace([0, -1, 0], -(smileY - 0.012)));
  const tongue = mouth.intersect(sdf.ellipsoid([0.03, 0.012, 0.5]).at(0, smileY - 0.03, 0.1));
  return skin.paintWhere(mouth, C.mouth, 0.001).paintWhere(tongue, C.tongue, 0.002).paintWhere(teeth, C.teeth, 0.001);
};

export default humanoidAsset({
  name: 'sprout-ben',
  description: 'Ben, a five-year-old boy: large dark-brown eyes, tousled light-brown hair in pointed locks, a wide open smile, a blue T-shirt, blue jeans, and grey sneakers with white soles.',
  reference: 'docs/sprout-mockups/ben.jpg',
  proportions: AGE5,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { lightBrown: '#a07048', brown: '#5a301d', black: '#231a17', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { blue: '#5c94e0', cobalt: '#5a88d4', sky: '#68a0e4', azure: '#58a0d8' },
  },
  presets: {
    ben: { skin: 'fair', hair: 'lightBrown', eyes: 'brown', cloth: 'blue' },
  },

  paintSkin: (skin) => openSmile(skin, AGE5.face.smileY),

  extra(k, h) {
    const { HIP, KNEE, ANKLE, HEAD_Y } = h.joints;

    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = AGE5;
    const H = P.head;

    // ---------------------------------------------------------------- tousled hair: one smooth shell plus tapered locks that end in soft points
    const mask = (s: number) => sdf.ellipsoid([0.19, 0.14, 0.25]).rotateZ(12 * s).at(0.07 * s, -0.045, 0.14);
    const cap = sdf
      .ellipsoid([H[0] + 0.03, H[1] + 0.03, H[2] + 0.03])
      .at(0, 0.01, -0.01)
      .smoothSubtract(0.02, sdf.union(mask(1), mask(-1)))
      .paint(k.tint('hair', -0.1));
    type Pt = [number, number, number, number];
    const lock = (...pts: Pt[]) => sdf.chain(pts, 0.02);
    const both = (...pts: Pt[]) => pair(lock(...pts));
    const crown = [
      lock([0.0, 0.2, -0.02, 0.05], [0.07, 0.222, -0.03, 0.04], [0.14, 0.215, -0.05, 0.016]),
      lock([0.0, 0.2, -0.03, 0.05], [-0.07, 0.222, -0.01, 0.04], [-0.14, 0.21, 0.02, 0.016]),
      lock([0.0, 0.2, 0.05, 0.045], [0.03, 0.235, 0.09, 0.036], [0.04, 0.245, 0.14, 0.016]),
      lock([0.0, 0.2, -0.1, 0.05], [0.0, 0.225, -0.15, 0.038], [-0.03, 0.2, -0.21, 0.016]),
      lock([0.07, 0.185, 0.05, 0.045], [0.13, 0.2, 0.07, 0.035], [0.19, 0.17, 0.09, 0.016]),
    ];
    // Above the ears and at the nape: pairs of locks that point outward and down.
    const sides = [
      both([0.15, 0.1, 0.0, 0.04], [0.21, 0.085, -0.02, 0.032], [0.245, 0.05, -0.03, 0.014]),
      both([0.12, 0.13, -0.1, 0.045], [0.185, 0.14, -0.13, 0.035], [0.235, 0.11, -0.16, 0.014]),
      both([0.06, 0.08, -0.17, 0.05], [0.075, 0.03, -0.225, 0.035], [0.06, -0.03, -0.255, 0.014]),
    ];
    // Fringe: four locks of different lengths fall toward the eyebrows and sweep a little to one side.
    const fringe = [
      lock([0.09, 0.17, 0.1, 0.04], [0.105, 0.125, 0.18, 0.032], [0.115, 0.075, 0.205, 0.011]),
      lock([0.0, 0.18, 0.1, 0.04], [0.005, 0.14, 0.18, 0.03], [0.02, 0.105, 0.2, 0.011]),
      lock([-0.09, 0.17, 0.1, 0.04], [-0.1, 0.12, 0.18, 0.03], [-0.085, 0.07, 0.205, 0.011]),
      lock([-0.15, 0.14, 0.07, 0.036], [-0.18, 0.1, 0.13, 0.028], [-0.185, 0.045, 0.16, 0.01]),
    ];
    const hair = sdf.smoothUnion(0.02, cap, ...crown, ...sides, ...fringe).bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.65, detail: 0.005 });

    // ---------------------------------------------------------------- plain blue T-shirt
    const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
    const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.185));
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(body), sleeves)
      .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), k.tint('cloth', -0.15), 0.003);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });

    // ---------------------------------------------------------------- straight-leg blue jeans to the shoe, open hem, lighter fade at thighs and knees
    const hemEnd: [number, number, number] = [P.pants.cuff[0], 0.08, P.pants.cuff[2]];
    const leg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, P.pants.thighR + 0.01).bone('leg.L'),
      sdf.cone(KNEE, hemEnd, P.pants.thighR + 0.008, P.pants.thighR + 0.01).bone('shin.L'),
    );
    const hips = sdf.ellipsoid([P.pants.hipsSize[0] * 1.04, P.pants.hipsSize[1] * 1.08, P.pants.hipsSize[2] * 1.04]).at(0, P.pants.hipsY, 0).bone('hips');
    const waist = h.torso.round(0.011).intersect(sdf.box([0.6, 0.07, 0.6]).at(0, 0.195, 0));
    const jeansRaw = sdf.smoothUnion(0.03, h.weighted(waist), hips, pair(leg));
    const fade = sdf.union(
      sdf.ellipsoid([0.045, 0.03, 0.09]).at(KNEE[0], 0.145, 0.05),
      sdf.ellipsoid([0.045, 0.03, 0.09]).at(-KNEE[0], 0.145, 0.05),
    );
    const jeans = jeansRaw.paintWhere(fade, C.jeansFade, 0.03).paintWhere(sdf.halfSpace([0, 1, 0], 0.092), C.jeansDark, 0.003);
    k.body('jeans', jeans, { color: C.jeans, roughness: 0.9, textureDensity: 2 });

    // ---------------------------------------------------------------- grey sneakers, white soles
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.scale([1.08, 1, 1.05]).intersect(sdf.halfSpace([0, 1, 0], 0.022)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeCap = sdf.box([1, 1, 0.009]).at(0, 0.5, 0.104);
    const lace = sdf.box([0.4, 0.4, 0.014]).at(0, 0.3, 0.02).intersect(sdf.halfSpace([0, -1, 0], -0.052));
    const sneaker = sdf
      .union(shoeFoot.paintWhere(lace, C.lace, 0.002).paintWhere(toeCap, C.sole, 0.001), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });
  },
});
