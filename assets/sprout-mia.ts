import { profile, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Mia, a five-year-old girl of Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/mia.jpg (the
 * cast sheet; the songs draw her at five).
 * Role: a classmate in the kindergarten renders, seen large; the wavy shoulder-length hair with the
 * pink bow, the denim overalls, and the open laugh must read.
 * One idea: a bright girl in long denim overalls over a pink shirt, light-brown waves, and a pink
 * bow above her left ear. Shape language: round and soft.
 * Palette (60/30/10): overalls #4a68a8 (denim), shirt #f0a0b8 (pink), hair #a8784a (light brown);
 *   white sneakers; the pink bow #f090b0 is the accent.
 * Bodies: skin (open smile painted), hair (cap and waves), bow, shirt, overalls (legs, bib, straps),
 *   buttons, cuffs, shoes.
 * Rig: the humanoid kind's skeleton and clips at age 5.
 */

const C = { denim: '#4a68a8', denimDark: '#3a5490', button: '#9aaed0', bow: '#f090b0', shoe: '#f6f4ef', sole: '#c8ccd4', strap: '#dfe3ea', mouth: '#7e2a2e', teeth: '#fbf8f0', tongue: '#e0707a' };

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
  name: 'sprout-mia',
  description: 'Mia, a five-year-old girl: large dark-brown eyes, an open laugh, shoulder-length wavy light-brown hair with a pink bow on her left side, a pink T-shirt, long blue denim overalls, and white sneakers.',
  reference: 'docs/sprout-mockups/mia.jpg',
  proportions: AGE5,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { lightBrown: '#a8784a', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { pink: '#f0a0b8', rose: '#e88aa4', blush: '#f4b0c4', coral: '#f09a9c' },
  },
  presets: {
    mia: { skin: 'fair', hair: 'lightBrown', eyes: 'brown', cloth: 'pink' },
  },
  paintSkin: (skin) => openSmile(skin, AGE5.face.smileY),

  extra(k, h) {
    const { HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = AGE5;
    const H = P.head;

    // ---------------------------------------------------------------- hair: a smooth cap with a soft part, and wavy shoulder-length hair behind the ears
    const mask = (s: number) => sdf.ellipsoid([0.19, 0.14, 0.25]).rotateZ(12 * s).at(0.07 * s, -0.06, 0.14);
    const cap = sdf
      .ellipsoid([H[0] + 0.013, H[1] + 0.015, H[2] + 0.013])
      .at(0, 0.008, -0.01)
      .smoothSubtract(0.02, sdf.union(mask(1), mask(-1)));
    const behind = sdf.halfSpace([0, 0, 1], -0.04);
    const mass = sdf
      .ellipsoid([H[0] + 0.022, 0.2, H[2] + 0.025])
      .at(0, -0.075, -0.03)
      .smoothIntersect(0.02, sdf.box([0.6, 0.6, 0.6]).at(0, 0, -0.3).intersect(behind));
    // The ends flare out in a soft wave: one low, wide band behind the ears.
    const lobes = sdf.ellipsoid([0.232, 0.06, 0.19]).at(0, -0.225, -0.09).smoothIntersect(0.02, sdf.box([0.6, 0.6, 0.6]).at(0, 0, -0.3).intersect(behind));
    const hairShape = sdf.smoothUnion(0.03, cap, mass.smoothUnion(0.05, lobes));
    const hair = hairShape.bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.6, detail: 0.007 });

    // ---------------------------------------------------------------- pink bow on her left side above the ear (0.06 m wide)
    const loop = (z: number) => sdf.ellipsoid([0.012, 0.018, 0.016]).at(0, 0.004, z);
    const bowShape = sdf
      .smoothUnion(
        0.006,
        loop(0.019),
        loop(-0.019),
        sdf.sphere(0.011),
        sdf.chain(
          [
            [0, -0.004, 0.004, 0.006],
            [0.004, -0.04, 0.012, 0.0055],
            [0.006, -0.062, 0.02, 0.004],
          ],
          0.01,
        ),
        sdf.chain(
          [
            [0, -0.004, -0.004, 0.006],
            [0.004, -0.036, -0.014, 0.0055],
            [0.008, -0.056, -0.028, 0.004],
          ],
          0.01,
        ),
      )
      .rotateZ(30);
    const bowAt = sdf.surfacePoint(hairShape, [0.2, 0.12, 0.02], 0.006);
    k.body('bow', bowShape.at(...bowAt).bone('head').at(0, HEAD_Y, 0), { color: C.bow, roughness: 0.5, detail: 0.003 });

    // ---------------------------------------------------------------- pink T-shirt
    const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
    const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.185));
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(body), sleeves)
      .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), k.tint('cloth', -0.15), 0.003);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });

    // ---------------------------------------------------------------- denim overalls: long legs, a square bib, two straps
    const fat = h.torso.round(0.011);
    const waistBand = fat.intersect(sdf.box([0.6, 0.095, 0.6]).at(0, 0.2075, 0));
    const bib = fat.intersect(sdf.box([0.13, 0.1, 0.6]).at(0, 0.295, 0.3));
    const strap = fat.intersect(sdf.box([0.03, 0.27, 0.6]).at(0.06, 0.3, 0)).intersect(sdf.halfSpace([0, -1, 0], -0.17));
    const cuffEnd: [number, number, number] = [P.pants.cuff[0], 0.1, P.pants.cuff[2]];
    const leg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, P.pants.thighR + 0.003).bone('leg.L'),
      sdf.cone(KNEE, cuffEnd, P.pants.shinR[0] + 0.004, P.pants.shinR[1] + 0.004).bone('shin.L'),
    );
    const hips = sdf.ellipsoid([P.pants.hipsSize[0] * 1.04, P.pants.hipsSize[1] * 1.08, P.pants.hipsSize[2] * 1.04]).at(0, P.pants.hipsY, 0).bone('hips');
    const overalls = sdf
      .smoothUnion(0.012, h.weighted(waistBand), h.weighted(bib), h.weighted(strap.mirror('x', 0)), hips, pair(leg))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.255).intersect(sdf.halfSpace([0, -1, 0], -0.24)).intersect(sdf.halfSpace([0, 0, -1], 0)), C.denimDark, 0.003);
    k.body('overalls', overalls, { color: C.denim, roughness: 0.9, textureDensity: 2 });
    const cuff = sdf.torus(P.pants.shinR[1] + 0.006, 0.0075).at(cuffEnd[0], 0.104, cuffEnd[2]).bone('shin.L');
    k.body('cuffs', pair(cuff), { color: C.denimDark, roughness: 0.9, detail: 0.003 });
    const buttonAt = (x: number) => {
      const p = sdf.raycast(fat, [x, 0.338, 0.5], [0, 0, -1]) ?? [x, 0.338, 0.1];
      return sdf.sphere(0.009).scale([1, 1, 0.6]).at(p[0], p[1], p[2] + 0.002).bone('chest');
    };
    k.body('buttons', sdf.union(buttonAt(0.055), buttonAt(-0.055)), { color: C.button, roughness: 0.4, metalness: 0.4, detail: 0.003 });

    // ---------------------------------------------------------------- white sneakers with a wide strap
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], P.shoe.soleTop)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const velcro = sdf.box([0.4, 0.4, 0.024]).at(0, 0.3, 0.03).intersect(sdf.halfSpace([0, -1, 0], -0.055));
    const sneaker = sdf
      .union(shoeFoot.paintWhere(velcro, C.strap, 0.002), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });
  },
});
