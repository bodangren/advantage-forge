import { profile, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import type { HumanoidShape } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Tom, a nine-year-old boy of Chibi Sprouts, one of the tallest children, faces
 * +Z. Target: docs/sprout-mockups/tom.jpg (the cast sheet).
 * Role: Lily's older brother in the week 4 family renders, seen large next to
 * the age-5 children; the striped shirt and the open smile must read.
 * One idea: a tall, slim, cheerful boy in a blue shirt with wide orange and
 * dark-blue stripes, laughing with his mouth open. Shape language: round and soft.
 * Palette (60/30/10): shirt blue #3fa3d8, orange stripes #e8822e, dark-blue
 * stripes #2b5f9e; green shorts #69a84f; brown hair #6e4423; gray sneakers
 * #8d8f96 with white soles.
 * Bodies: skin (open smile painted), hair (swept fringe, crown tuft), shirt
 * (wide stripes painted), shorts, socks, shoes.
 * Rig: the humanoid kind's skeleton and clips at age 5, scaled 1.04 about the
 * ground so Tom stands taller than Pat (0.858 m) and the other children; the
 * slim build comes from the slimmer shorts legs, not from the shared kind.
 * Every body carries an explicit bone tag (the Grandma lesson: an untagged
 * waistband fell back to distance weights and followed the limbs).
 */

const C = {
  orange: '#e8822e',
  darkBlue: '#2b5f9e',
  shorts: '#69a84f',
  shortsDark: '#4f7f3a',
  sock: '#f6f4ef',
  shoe: '#8d8f96',
  sole: '#f4f2ee',
  lace: '#f2f0ea',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
};

/** Tom's face detail (Daniel 2026-11-22: more detail in the faces), matched to
 * docs/sprout-mockups/tom.jpg. Paint only: the shared stencils and every other
 * kind user keep today's geometry and paint, so their GLBs stay byte-identical. */
const TOM = {
  irisDark: '#2e1a0e',
  irisLow: '#5a3418',
  pupil: '#101314',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  freckle: '#b06a48',
  noseShade: '#d89a78',
};

/** An open laughing mouth with one white teeth band, a tongue, and Tom's dark round eyes. */
const tomFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = AGE5.face.smileY;
  const browY = AGE5.face.browY;

  // Near-black round iris with a warm low arc, the pupil, and one big catchlight.
  const dark = pair(h.onFace(sdf.ellipsoid([0.037, 0.044, 0.07]), EX, EY - 0.006));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.008));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.026, 0.029, 0.07]), EX, EY + 0.004));
  const big = pair(h.onFace(sdf.sphere(0.012), EX + 0.015, EY + 0.018));
  const small = pair(h.onFace(sdf.sphere(0.005), EX - 0.013, EY - 0.02));

  // The shared brow band is long and heavy; cover it with an exact-footprint skin
  // stencil (hard edge: a wider or soft cover left a pale slab in Lily's rounds)
  // and paint a shorter, thinner arc in the same place.
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.07, 0.014, 62, 118), 0.3).at(0.1, browY - 0.1, 0.1));

  // An open laughing mouth: dark inside, one rounded white teeth band (no fang
  // corners), a tongue. The band is a rounded box clipped to the mouth.
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
  const teeth = sdf
    .box([0.06, 0.014, 0.3], 0.006)
    .at(0, smileY - 0.007, 0.1)
    .intersect(mouth);
  const tongue = mouth.intersect(sdf.ellipsoid([0.024, 0.012, 0.5]).at(0, smileY - 0.026, 0.1));

  // A soft shade under the small nose and a scatter of freckles over the nose bridge.
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, AGE5.face.noseY - 0.018, h.faceZ(0, AGE5.face.noseY - 0.018));
  const dots: [number, number][] = [
    [-0.03, 0.012],
    [-0.014, 0.02],
    [0.004, 0.014],
    [0.022, 0.02],
    [0.038, 0.01],
    [-0.048, 0.004],
    [0.052, 0.002],
  ];
  const freckles = sdf.union(...dots.map(([dx, dy]) => h.onFace(sdf.sphere(0.0026), dx, AGE5.face.noseY + dy)));

  return skin
    .paintWhere(dark, TOM.irisDark, 0.006)
    .paintWhere(low, TOM.irisLow, 0.008)
    .paintWhere(pupil, TOM.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(small, '#ffffff')
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, h.tint.brow!)
    .paintWhere(mouth, TOM.mouth, 0.001)
    .paintWhere(tongue, TOM.tongue, 0.002)
    .paintWhere(teeth, TOM.teeth, 0.001);
};

export default scaleAsset(
  humanoidAsset({
    name: 'sprout-tom',
    description: 'Tom, a nine-year-old boy: large dark-brown eyes, short brown hair swept to one side with a small tuft at the crown, an open smile, a blue T-shirt with wide orange and dark-blue stripes, green shorts, white ankle socks, and gray sneakers with white soles.',
    reference: 'docs/sprout-mockups/tom.jpg',
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
      hair: { brown: '#6e4423', dark: '#4a3020', auburn: '#8e3b1c', blond: '#c4974a' },
      eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
      cloth: { blue: '#3fa3d8', sky: '#55b4e0', navy: '#2f6aa8', teal: '#3f9a9a' },
    },
    presets: {
      tom: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'blue' },
    },
    paintSkin: (skin, h) => tomFace(skin, h),

    extra(k, h) {
      const { HIP, ANKLE, HEAD_Y } = h.joints;
      const pair = (s: sdf.Shape) => s.mirror('x', 0);
      const P = AGE5;

      // ---------------------------------------------------------------- brown hair: one smooth cap, five separate swept locks, a crown tuft
      const H = P.head;
      const faceMask = sdf.ellipsoid([0.24, 0.15, 0.25]).rotateZ(12).at(0.02, -0.06, 0.14);
      const outer = sdf.ellipsoid([H[0] + 0.03, H[1] + 0.03, H[2] + 0.03]).at(0, 0.008, -0.01);
      const cap = sdf.ellipsoid([H[0] + 0.013, H[1] + 0.015, H[2] + 0.013]).at(0, 0.008, -0.01).smoothSubtract(0.02, faceMask);
      // The sweep: five tapered locks run from the part (his right) across to his left
      // temple. The roots merge but the tips stay distinct: a small fillet (0.008) with
      // wide tip spacing and varied tip depths, so the hairline reads as separated
      // pointed locks with skin showing between them, not one smooth helmet edge.
      const lock = (rx: number, tx: number, ty: number) =>
        sdf.cone([rx, 0.155, 0.14], [tx, ty, 0.2], 0.046, 0.013);
      const fringe = sdf.smoothUnion(
        0.008,
        lock(-0.14, -0.1, 0.055),
        lock(-0.07, -0.045, 0.03),
        lock(0.0, 0.02, 0.052),
        lock(0.06, 0.085, 0.028),
        lock(0.11, 0.15, 0.058),
      );
      // Thin sideburn strands drop in front of the ears to mid-ear, as in the reference.
      const burn = (sx: number) => sdf.cone([sx, 0.06, 0.06], [sx + 0.005, -0.05, 0.085], 0.02, 0.011);
      const fringeAll = sdf.smoothUnion(0.008, fringe, burn(-0.2), burn(0.2)).smoothIntersect(0.015, outer);
      // The crown tuft: tousled spikes that lean toward his left and lie almost flat on
      // the crown, standing only just proud of the cap surface.
      const spike = (dx: number, dz: number, lean: number, r: number) =>
        sdf.capsule([0.05 + dx, 0.13, -0.03 + dz], [0.05 + dx + lean, 0.185, -0.03 + dz], r);
      const tuft = sdf.smoothUnion(
        0.01,
        spike(0, 0, 0.06, 0.015),
        spike(-0.045, 0.01, 0.03, 0.013),
        spike(0.03, -0.04, 0.075, 0.013),
        spike(-0.01, 0.045, 0.045, 0.012),
        spike(-0.075, -0.02, 0.02, 0.011),
      );
      const hair = sdf.smoothUnion(0.012, cap, fringeAll, tuft).bone('head');
      k.body('hair', hair.at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.6, detail: 0.004 });

      // ---------------------------------------------------------------- blue T-shirt with wide orange and dark-blue stripes
      const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
      const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.185));
      const band = (y: number, w: number) => sdf.box([0.26, w, 1]).at(0, y, 0);
      const shirt = sdf
        .smoothUnion(0.012, h.weighted(body), sleeves)
        .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), C.darkBlue, 0.003)
        .paintWhere(band(0.4, 0.035), C.orange, 0.001)
        .paintWhere(band(0.345, 0.035), C.orange, 0.001)
        .paintWhere(band(0.3, 0.028), C.darkBlue, 0.001)
        .paintWhere(band(0.262, 0.025), C.orange, 0.001)
        .paintWhere(band(0.215, 0.03), C.orange, 0.001)
        .paintWhere(band(0.175, 0.03), C.darkBlue, 0.001);
      k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85, textureDensity: 2 });

      // ---------------------------------------------------------------- green shorts to mid-thigh, slim legs
      const waist = h.torso.round(0.0).smoothIntersect(0.01, sdf.box([0.6, 0.05, 0.6]).at(0, 0.175, 0));
      const shortLeg = sdf.cone(HIP, [HIP[0] + 0.006, 0.15, 0], 0.05, 0.057).round(0.003).bone('leg.L');
      const hem = sdf.halfSpace([0, 1, 0], 0.158);
      const pocket = sdf.box([0.014, 0.036, 0.034], 0.005).at(HIP[0] + 0.052, 0.172, 0.004).bone('leg.L');
      const shorts = sdf
        .smoothUnion(0.02, h.weighted(waist), sdf.ellipsoid([0.096, 0.05, 0.072]).at(0, 0.19, 0).bone('hips'), pair(shortLeg))
        .paintWhere(hem, C.shortsDark, 0.002);
      k.body('shorts', shorts, { color: C.shorts, roughness: 0.9 });
      k.body('pockets', pair(pocket), { color: C.shortsDark, roughness: 0.9, detail: 0.003 });

      // ---------------------------------------------------------------- white ankle socks, one per leg
      const sock = sdf
        .smoothUnion(0.004, sdf.cone([ANKLE[0], 0.055, 0.01], [ANKLE[0], 0.1, 0], 0.034, 0.0355), sdf.torus(0.0355, 0.005).at(ANKLE[0], 0.1, 0))
        .bone('shin.L');
      k.body('socks', pair(sock), { color: C.sock, roughness: 0.9, detail: 0.003 });

      // ---------------------------------------------------------------- gray sneakers, white soles and laces
      const shoeFoot = sdf
        .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
        .intersect(sdf.halfSpace([0, -1, 0], 0));
      const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], P.shoe.soleTop)).intersect(sdf.halfSpace([0, -1, 0], 0));
      const laceY = (z: number) => 0.048 + 0.05 * Math.sqrt(Math.max(0, 1 - ((z - 0.045) / 0.098) ** 2));
      const laces = sdf.union(...[0.045, 0.068, 0.091].map((z) => sdf.box([0.07, 0.03, 0.011]).at(0, laceY(z), z)));
      const sneaker = sdf
        .union(shoeFoot.paintWhere(laces, C.lace, 0.002), sole.paint(C.sole))
        .rotateY(12)
        .scale(P.shoe.scale)
        .at(ANKLE[0], 0, 0)
        .bone('foot.L');
      k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });

      // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
      sproutGestures(k, h);
    },
  }),
  1.07,
);
