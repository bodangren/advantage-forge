import { profile, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Sam, a five-year-old boy of Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/sam.jpg (the
 * cast sheet; the songs draw him at five).
 * Role: a classmate in the kindergarten renders, seen large; the red striped shirt and the open
 * laugh must read.
 * One idea: a loud, happy boy in a red shirt with two white stripes and a wide open smile.
 * Shape language: round and soft.
 * Palette (60/30/10): shirt #d03a32 (red), shorts #4a68a8 (denim blue), hair #4a3020 (dark brown);
 *   blue sneakers #3a5ab0 with white soles; the two white stripes are the accent.
 * Bodies: skin (open smile painted), hair (short, swept fringe), shirt (two stripes painted),
 *   shorts, shoes.
 * Rig: the humanoid kind's skeleton and clips at age 5.
 */

const C = { stripe: '#f6f2ea', shorts: '#4a68a8', shortsDark: '#3a5490', shoe: '#3a5ab0', sole: '#f4f2ee', lace: '#f2f0ea', mouth: '#7e2a2e', teeth: '#fbf8f0', tongue: '#e0707a' };

/** An open laughing mouth painted on the face: dark inside, a row of teeth, a tongue. */
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
      ).map(([x, y]): [number, number] => [x * s, y * s]),
      { smooth: true },
    );
  const mouth = sdf.extrude(outline(1), 0.3).at(0, smileY, 0.1);
  const teeth = sdf.extrude(outline(0.9), 0.3).at(0, smileY + 0.001, 0.1).intersect(sdf.halfSpace([0, -1, 0], -(smileY - 0.005)));
  const tongue = mouth.intersect(sdf.ellipsoid([0.024, 0.012, 0.5]).at(0, smileY - 0.026, 0.1));
  return skin.paintWhere(mouth, C.mouth, 0.001).paintWhere(tongue, C.tongue, 0.002).paintWhere(teeth, C.teeth, 0.001);
};

export default humanoidAsset({
  name: 'sprout-sam',
  description: 'Sam, a five-year-old boy: large dark-brown eyes, short dark-brown hair, an open laugh, a red T-shirt with two white stripes, blue denim shorts, and blue sneakers with white soles.',
  reference: 'docs/sprout-mockups/sam.jpg',
  proportions: AGE5,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#4a3020', black: '#231a17', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { red: '#d03a32', crimson: '#c43a4a', coral: '#e0584a', brick: '#b84a30' },
  },
  presets: {
    sam: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'red' },
  },
  paintSkin: (skin) => openSmile(skin, AGE5.face.smileY),

  extra(k, h) {
    const { HIP, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = AGE5;

    // ---------------------------------------------------------------- short dark-brown hair: one smooth shell and a swept fringe
    const H = P.head;
    const faceMask = sdf.ellipsoid([0.24, 0.15, 0.25]).rotateZ(12).at(0.02, -0.06, 0.14);
    const outer = sdf.ellipsoid([H[0] + 0.03, H[1] + 0.03, H[2] + 0.03]).at(0, 0.008, -0.01);
    const cap = sdf.ellipsoid([H[0] + 0.013, H[1] + 0.015, H[2] + 0.013]).at(0, 0.008, -0.01).smoothSubtract(0.02, faceMask);
    const fringe = sdf.chain(
      [
        [0.11, 0.13, 0.11, 0.042],
        [0.04, 0.14, 0.17, 0.05],
        [-0.05, 0.115, 0.205, 0.05],
        [-0.12, 0.07, 0.19, 0.04],
        [-0.165, 0.015, 0.13, 0.028],
      ],
      0.03,
    );
    const lock2 = sdf.chain(
      [
        [0.15, 0.1, 0.08, 0.034],
        [0.085, 0.1, 0.175, 0.038],
        [0.01, 0.075, 0.215, 0.03],
      ],
      0.02,
    );
    const fringeAll = sdf.smoothUnion(0.02, fringe, lock2).smoothIntersect(0.02, outer);
    const hair = sdf.smoothUnion(0.025, cap, fringeAll).bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.6, detail: 0.004 });

    // ---------------------------------------------------------------- red T-shirt with two white stripes (0.025 m tall, 0.03 m apart)
    const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
    const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.185));
    const stripe = (y: number) => sdf.box([0.26, 0.025, 1]).at(0, y, 0);
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(body), sleeves)
      .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), k.tint('cloth', -0.15), 0.003)
      .paintWhere(stripe(0.325), C.stripe, 0.001)
      .paintWhere(stripe(0.27), C.stripe, 0.001);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85, textureDensity: 2 });

    // ---------------------------------------------------------------- blue denim shorts to mid-thigh
    const waist = h.torso.round(0.0).smoothIntersect(0.01, sdf.box([0.6, 0.05, 0.6]).at(0, 0.175, 0));
    const shortLeg = sdf.cone(HIP, [HIP[0] + 0.008, 0.15, 0], 0.052, 0.06).round(0.003).bone('leg.L');
    const hem = sdf.halfSpace([0, 1, 0], 0.158);
    const pocket = sdf.box([0.014, 0.036, 0.034], 0.005).at(HIP[0] + 0.054, 0.172, 0.004).bone('leg.L');
    const shorts = sdf
      .smoothUnion(0.02, h.weighted(waist), sdf.ellipsoid([0.099, 0.05, 0.074]).at(0, 0.19, 0).bone('hips'), pair(shortLeg))
      .paintWhere(hem, C.shortsDark, 0.002);
    k.body('shorts', shorts, { color: C.shorts, roughness: 0.9 });
    k.body('pockets', pair(pocket), { color: C.shortsDark, roughness: 0.9, detail: 0.003 });

    // ---------------------------------------------------------------- blue sneakers, white soles
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], P.shoe.soleTop)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const lace = sdf.box([0.4, 0.4, 0.014]).at(0, 0.3, 0.02).intersect(sdf.halfSpace([0, -1, 0], -0.052));
    const sneaker = sdf
      .union(shoeFoot.paintWhere(lace, C.lace, 0.002), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });

    // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
    sproutGestures(k, h);
  },
});
