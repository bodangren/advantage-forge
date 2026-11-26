import { defineAsset, noise, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildKim, KIM } from './parts/humanoid-kim.js';

/**
 * Grandma on the Teacher Kim adult base. Identity from docs/sprout-mockups/grandma.jpg: white hair
 * in a high bun, round cheeks, smile lines, pearl stud earrings, a green knit cardigan that hangs
 * open over a matching green knit top, a long flared skirt, and brown flats. The proportions, the
 * skeleton, the hands and the idle clip come from `buildKim`. Her face is her own layer over the
 * base head (spec "The face layer and the paint"). No cut-out and no sprite.
 */

export type CastMeta = {
  readonly faceMarks?: {
    readonly glasses?: `#${string}`;
    readonly moustache?: `#${string}`;
  };
};

/** Grandma paints her face on the face layer, so she declares no face mark. */
export const castMeta: CastMeta = {};

const C = {
  skin: '#f2c7a4',
  hair: '#f0ece4',
  brow: '#ada396',
  mouth: '#a8503e',
  cardigan: '#6f8f5e',
  cardiganDark: '#577349',
  top: '#7c9a6a',
  topDark: '#68855a',
  skirt: '#7f9d6c',
  flats: '#7a4a2c',
  sole: '#4a2e1e',
  pearl: '#fbf7ee',
};

/**
 * Grandma's face layer. It rebuilds the published `KIM` head volume, adds the base nose, inflates
 * the union by 2 mm, and keeps the front half (z >= 0.02 m), so it sits outside the base head and
 * covers the paint of the base face. The eyes, the smile and the smile lines are paint on this
 * layer.
 */
function grandmaFace(k: AssetContext) {
  const skull = sdf.ellipsoid([KIM.headRX, KIM.headRY, KIM.headRZ]).at(0, KIM.headY, 0);
  const chin = sdf.ellipsoid([0.062, 0.04, 0.07]).at(0, KIM.chin + 0.038, 0.05);
  const jaw = sdf.smoothUnion(0.03, skull, chin);
  const nose = sdf.ellipsoid([0.011, 0.014, 0.02]).at(0, 1.178, 0.127);
  const head = sdf.smoothUnion(0.012, jaw, nose).round(0.002);
  const front = head.intersect(sdf.halfSpace([0, 0, -1], -0.02));

  // The eye pair of the base, rebuilt on the layer. The radii keep the measured 0.066 x 0.048 m
  // opening, so the flat front render gives two eye components.
  const eyeWhite = (sx: number) => sdf.ellipsoid([0.05, 0.03, 0.09]).at(sx * KIM.eyeX, KIM.eyeY, 0.124);
  const iris = (sx: number) => sdf.ellipsoid([0.033, 0.024, 0.09]).at(sx * KIM.eyeX, KIM.eyeY - 0.002, 0.13);
  const pupil = (sx: number) =>
    sdf.ellipsoid([0.015, 0.015, 0.09]).at(sx * KIM.eyeX, KIM.eyeY - 0.002, 0.134);
  const glint = (sx: number) => sdf.sphere(0.0065).at(sx * (KIM.eyeX + 0.011), KIM.eyeY + 0.008, 0.142);
  // Soft grey brows, a closed smile, and the two smile lines beside the mouth.
  const brow = (sx: number) =>
    sdf
      .box([0.05, 0.009, 0.1], 0.004)
      .rotate(0, 0, sx * 5)
      .at(sx * KIM.eyeX, 1.298, 0.115);
  const smile = sdf.extrude(profile.arc(0.05, 0.014, 236, 304), 0.3).at(0, 1.2, 0.13);
  // The smile lines run from the side of the nose down to the corner of the mouth.
  const smileLine = (sx: number) =>
    sdf
      .extrude(profile.rect([0.05, 0.0055], 0.0025), 0.3)
      .rotateZ(sx * -34)
      .at(sx * 0.0375, 1.168, 0.125);

  const painted = front
    .paintWhere(sdf.union(eyeWhite(-1), eyeWhite(1)), '#f8f2e9')
    .paintWhere(sdf.union(iris(-1), iris(1)), '#4a2e18')
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#14100e')
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff')
    .paintWhere(sdf.union(brow(-1), brow(1)), C.brow)
    .paintWhere(smile, C.mouth)
    .paintWhere(sdf.union(smileLine(-1), smileLine(1)), '#cf8f78', 0.002);

  k.body('face', painted, {
    color: C.skin,
    detail: 0.0025,
    paintWeight: 2,
    textureDensity: 2,
  });
}

/**
 * Grandma's round cheeks: a second body in the skin material. They bulge a little past the face
 * layer at the cheek, so the face reads soft and round, and they carry the rosy cheek paint.
 */
function grandmaCheeks(k: AssetContext) {
  const cheek = (sx: number) =>
    sdf
      .ellipsoid([0.055, 0.042, 0.03])
      .at(sx * 0.082, 1.168, 0.062)
      .bone('head');
  const blush = (sx: number) => sdf.ellipsoid([0.028, 0.017, 0.03]).at(sx * 0.082, 1.172, 0.075);
  const painted = cheek(-1)
    .union(cheek(1))
    .paintWhere(sdf.union(blush(-1), blush(1)), '#e28b73', 0.005);
  k.body('cheeks', painted, { color: C.skin, detail: 0.004 });
}

/**
 * White hair: a close cap over the skull with a parted hairline, a high bun on the crown, and
 * loose wisps that frame the face and the ears. The surface carries fine strand ridges and the
 * parting, so the hair reads as hair and not as a smooth bonnet.
 */
function grandmaHair(k: AssetContext) {
  // The hair mass over the skull. The face opening is narrow, so the hair keeps its volume at
  // the sides of the head and frames the face. The cap sits clear of the face layer, so the
  // strand grooves never break the hairline.
  const cap = sdf.ellipsoid([0.168, 0.196, 0.163]).at(0, 1.312, -0.02);
  // The face opening is a ball in front of the face. It cuts the cap across, so the hairline is a
  // clean edge that is high at the parting and low at the temples.
  const faceOpen = sdf.ellipsoid([0.2, 0.25, 0.25]).at(0, 1.09, 0.15);
  // The bun: a wide mass of hair on the crown. It joins the cap with one tight blend, so it reads
  // as a bun and not as a cone on the head.
  const bun = sdf.ellipsoid([0.1, 0.078, 0.092]).at(0, 1.505, -0.02);
  const tie = sdf.ellipsoid([0.07, 0.055, 0.065]).at(0, 1.455, -0.016);
  const bunMass = sdf.smoothUnion(0.014, bun, tie);
  // The wrap of the bun: a ring at its base.
  const wrap = sdf.torus(0.088, 0.008).at(0, 1.472, -0.02);
  // Loose wisps that frame the face and hang in front of the ears. They stay beside the face,
  // clear of the measured face band, so they do not cut the face width.
  const wisp = (sx: number) =>
    sdf.chain(
      [
        [sx * 0.15, 1.345, -0.01, 0.012],
        [sx * 0.155, 1.29, 0.03, 0.01],
        [sx * 0.15, 1.245, 0.06, 0.008],
        [sx * 0.142, 1.215, 0.078, 0.005],
      ],
      0.004,
    );
  // Strand ridges: the bun is a mass of twisted hair, so its surface carries fine grooves.
  const strand = (x: number, y: number, z: number) =>
    noise.fbm(x * 22, y * 22, z * 22, 2) * 0.45 +
    Math.sin(Math.atan2(x, z + 0.02) * 10 + (y - 1.46) * 40) * 0.55;
  const bunTexture = bunMass.displace(0.004, (x, y, z) => strand(x, y, z), 2.2);
  const wrapTexture = wrap.displace(0.0016, (x, y, z) => strand(x, y, z), 1.6);
  const mass = sdf.union(cap, bunTexture, wrapTexture);
  // The wisps join after the cut, so they keep their length in front of the face.
  const hair = sdf.union(mass.subtract(faceOpen), wisp(-1), wisp(1));
  // The strands of the front hair are paint. They fan out from the parting, so the hair reads as
  // brushed hair and not as a smooth bonnet.
  const strandLine = (sx: number, x: number, lean: number) =>
    sdf
      .box([0.007, 0.19, 0.3])
      .rotateZ(sx * lean)
      .at(sx * x, 1.375, 0.13);
  const strandPaint = sdf.union(
    strandLine(-1, 0.028, 4),
    strandLine(1, 0.028, 4),
    strandLine(-1, 0.06, 7),
    strandLine(1, 0.06, 7),
    strandLine(-1, 0.092, 10),
    strandLine(1, 0.092, 10),
    strandLine(-1, 0.124, 13),
    strandLine(1, 0.124, 13),
  );
  k.body('hair', hair.paintWhere(strandPaint, '#e0dcd4'), {
    color: C.hair,
    detail: 0.006,
    maxError: 0.003,
    textureDensity: 1,
  });
}

/**
 * The cardigan: a loose knit cardigan that hangs open at the front over the matching knit top.
 * The shoulder line is flat, the hem is ribbed, and the cuffs are ribbed. The front opening is cut
 * out of the cardigan, so the knit top shows between the two front panels.
 */
function grandmaCardigan(k: AssetContext) {
  const cardiganProfile: [number, number][] = [
    [0, 1.068],
    [0.072, 1.066],
    [0.095, 1.063],
    [0.115, 1.06],
    [0.135, 1.055],
    [0.15, 1.04],
    [0.157, 1.01],
    [0.159, 0.97],
    [0.159, 0.92],
    [0.154, 0.87],
    [0.142, 0.816],
    [0.124, 0.78],
    [0.126, 0.75],
    [0.134, 0.702],
    [0.143, 0.668],
    [0.149, 0.645],
    [0.146, 0.62],
    [0.14, 0.59],
    [0.132, 0.576],
    [0.12, 0.57],
    [0.06, 0.568],
    [0, 0.566],
    [0, 0.62],
    [0, 1.0],
  ];
  const torso = sdf
    .revolve(profile.polygon(cardiganProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  // The shoulder is the sleeve cap, centred on the base upper arm. The cap is 8 mm wider than the
  // arm, so no skin shows at the shoulder, and the shoulder line stays smooth.
  const sleeveCone = (sx: number) =>
    sdf.smoothUnion(
      0.02,
      sdf.cone([sx * 0.143, 1.0037, 0], [sx * 0.156, KIM.elbowY, 0.006], 0.056, 0.046),
      sdf.cone([sx * 0.156, KIM.elbowY, 0.006], [sx * 0.176, 0.592, 0.015], 0.046, 0.038),
    );
  const sleeve = (sx: number) => sleeveCone(sx).bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  // The cardigan hangs open at the front. The opening is cut from the front, so the knit top shows
  // between the two front panels, and the panels meet again at the waist.
  const opening = sdf
    .extrude(
      profile.polygon(
        [
          [-0.046, 1.075],
          [0.046, 1.075],
          [0.052, 1.01],
          [0.058, 0.94],
          [0.062, 0.87],
          [0.062, 0.82],
          [0.05, 0.755],
          [-0.05, 0.755],
          [-0.062, 0.82],
          [-0.062, 0.87],
          [-0.058, 0.94],
          [-0.052, 1.01],
        ],
        { smooth: false },
      ),
      0.3,
    )
    .at(0, 0, 0.16);
  // Knit ribs: a ribbed band at the hip hem and a ribbed cuff at each wrist. The sleeve stops
  // above the hem, so the hem band stays on the body of the cardigan.
  const hemRib = sdf.box([1.2, 0.03, 1.2]).at(0, 0.59, 0);
  const cuffRib = (sx: number) =>
    sdf.cone([sx * 0.1745, 0.64, 0.015], [sx * 0.176, 0.588, 0.015], 0.05, 0.045);
  const cardigan = sdf.union(torso, sleeve(-1), sleeve(1)).subtract(opening);

  // The buttons run down the right front placket.
  const button = (y: number, z: number) => sdf.sphere(0.0085).at(0.07, y, z);
  const buttons = sdf.union(
    button(0.94, 0.107),
    button(0.88, 0.109),
    button(0.82, 0.098),
    button(0.76, 0.081),
    button(0.71, 0.087),
  );

  const knit = cardigan.displace(
    0.0008,
    (x, y, z) => noise.fbm(x * 38, y * 38, z * 38, 2) * 0.7 + Math.sin(y * 190) * 0.3,
    1.3,
  );

  k.body(
    'cardigan',
    knit
      .paintWhere(hemRib, C.cardiganDark)
      .paintWhere(cuffRib(-1), C.cardiganDark)
      .paintWhere(cuffRib(1), C.cardiganDark)
      .paintWhere(buttons, C.cardiganDark),
    {
      color: C.cardigan,
      detail: 0.005,
      paintWeight: 2,
      textureDensity: 1,
    },
  );
}

/**
 * The knit top under the cardigan: the same green as the cardigan, with a ribbed round neck and a
 * ribbed hem at the waist. The cardigan hangs open over it, so the top shows between the panels.
 */
function grandmaDress(k: AssetContext) {
  const topProfile: [number, number][] = [
    [0, 1.058],
    [0.06, 1.056],
    [0.072, 1.04],
    [0.086, 1.02],
    [0.106, 0.992],
    [0.13, 0.95],
    [0.14, 0.9],
    [0.134, 0.852],
    [0.119, 0.81],
    [0.107, 0.78],
    [0.113, 0.766],
    [0.12, 0.752],
    [0.117, 0.742],
    [0.1, 0.738],
    [0, 0.736],
    [0, 0.74],
    [0, 1.0],
  ];
  const top = sdf
    .revolve(profile.polygon(topProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  // The ribbed round neck and the ribbed hem at the waist.
  const neckRib = sdf.box([1.2, 0.022, 1.2]).at(0, 1.05, 0);
  const hemRib = sdf.box([1.2, 0.026, 1.2]).at(0, 0.762, 0);
  const knit = top.displace(
    0.001,
    (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2) * 0.8 + Math.sin(y * 210) * 0.2,
    1.2,
  );
  k.body('dress', knit.paintWhere(sdf.union(neckRib, hemRib), C.topDark), {
    color: C.top,
    detail: 0.005,
    paintWeight: 2,
  });
}

/**
 * The skirt: a long skirt that flares out below the hip, in the same green as the knit top. The
 * hem sits low, near the ankle, and the cloth falls in vertical folds.
 */
function grandmaSkirt(k: AssetContext) {
  const skirtProfile: [number, number][] = [
    [0.112, 0.66],
    [0.118, 0.63],
    [0.125, 0.58],
    [0.135, 0.52],
    [0.149, 0.45],
    [0.168, 0.385],
    [0.184, 0.315],
    [0.196, 0.255],
    [0.196, 0.228],
    [0.17, 0.208],
    [0.115, 0.202],
    [0, 0.2],
  ];
  const skirt = sdf
    .revolve(profile.polygon(skirtProfile, { smooth: true }))
    .scale([1, 1, 0.82])
    .bone('hips');
  // Cloth folds: the skirt falls in vertical folds.
  const folded = skirt.displace(
    0.0024,
    (x, y, z) => Math.sin(Math.atan2(x, z + 0.02) * 9) * 0.6 + noise.fbm(x * 18, y * 18, z * 18, 2) * 0.4,
    1.5,
  );
  k.body('skirt', folded, { color: C.skirt, detail: 0.006, maxError: 0.003 });
}

/** Brown flats on the feet, with a dark sole. */
function grandmaFlats(k: AssetContext) {
  const shoe = (sx: number) =>
    sdf
      .union(
        sdf.ellipsoid([0.05, 0.036, 0.088]).at(sx * KIM.ankleX, 0.031, 0.042),
        sdf.box([0.094, 0.012, 0.16], 0.005).at(sx * KIM.ankleX, 0.008, 0.035),
      )
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('flats', shoe(-1).union(shoe(1)), { color: C.flats, detail: 0.005 });
  const stud = (sx: number) =>
    sdf
      .sphere(0.0075)
      .at(sx * 0.145, 1.2, 0.03)
      .bone('head');
  k.body('studs', stud(-1).union(stud(1)), { color: C.pearl, detail: 0.003 });
}

export default defineAsset({
  name: 'sprout-grandma-kim',
  description:
    'Grandma on the Teacher Kim adult base: white hair in a high bun, round cheeks, smile lines, pearl studs, a green knit cardigan open over a matching knit top, a long flared skirt and brown flats.',
  reference: 'docs/sprout-mockups/grandma.jpg',
  detail: 0.005,
  texture: false,
  variants: {
    skin: { fair: '#f2c7a4', tan: '#d8a077', brown: '#a06a45' },
    hair: { white: '#f0ece4', silver: '#d8d4cc', cream: '#e8dcc4' },
    eyes: { brown: '#6e4020', hazel: '#8a6a2a', blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { sage: '#6f8f5e', moss: '#4f6b42', rose: '#b5837a' },
  },
  presets: {
    grandma: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'sage' },
  },
  build(k) {
    buildKim(k);
    grandmaFace(k);
    grandmaCheeks(k);
    grandmaHair(k);
    grandmaCardigan(k);
    grandmaDress(k);
    grandmaSkirt(k);
    grandmaFlats(k);
  },
});
