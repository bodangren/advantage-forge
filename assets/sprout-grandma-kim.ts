import { defineAsset, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildKim, KIM } from './parts/humanoid-kim.js';

/**
 * Grandma on the Teacher Kim adult base. Identity from docs/sprout-mockups/grandma.jpg: white hair
 * in a high bun, round cheeks, smile lines, pearl stud earrings, a green cardigan over a pale green
 * dress, a mid-calf skirt, and brown flats. The proportions, the skeleton, the hands and the idle
 * clip come from `buildKim`. Her face is her own layer over the base head (spec "The face layer and
 * the paint"). No cut-out and no sprite.
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
  brow: '#b9b2a6',
  mouth: '#a8503e',
  cardigan: '#6f8f5e',
  cardiganDark: '#577349',
  dress: '#cfe0bd',
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
  // Soft brows, a closed smile, and the two smile lines beside the mouth.
  const brow = (sx: number) =>
    sdf
      .box([0.05, 0.009, 0.1], 0.004)
      .rotate(0, 0, sx * 5)
      .at(sx * KIM.eyeX, 1.301, 0.115);
  const smile = sdf.extrude(profile.arc(0.05, 0.014, 236, 304), 0.3).at(0, 1.2, 0.13);
  const smileLine = (sx: number) =>
    sdf
      .extrude(profile.rect([0.042, 0.005], 0.002), 0.3)
      .rotateZ(sx * -48)
      .at(sx * 0.035, 1.169, 0.13);
  const blush = (sx: number) => sdf.ellipsoid([0.021, 0.012, 0.04]).at(sx * 0.088, 1.168, 0.106);

  const painted = front
    .paintWhere(sdf.union(eyeWhite(-1), eyeWhite(1)), '#f8f2e9')
    .paintWhere(sdf.union(iris(-1), iris(1)), '#4a2e18')
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#14100e')
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff')
    .paintWhere(sdf.union(brow(-1), brow(1)), C.brow)
    .paintWhere(sdf.union(blush(-1), blush(1)), '#e29580', 0.004)
    .paintWhere(smile, C.mouth)
    .paintWhere(sdf.union(smileLine(-1), smileLine(1)), '#c98d78');

  k.body('face', painted, {
    color: C.skin,
    detail: 0.0025,
    paintWeight: 2,
    textureDensity: 2,
  });
}

/**
 * Grandma's round cheeks: a second body in the skin material. They sit inside the face layer and
 * bulge past its outline, so the face reads soft and round.
 */
function grandmaCheeks(k: AssetContext) {
  const cheek = (sx: number) =>
    sdf
      .ellipsoid([0.05, 0.045, 0.05])
      .at(sx * 0.07, 1.14, 0.055)
      .bone('head');
  k.body('cheeks', cheek(-1).union(cheek(1)), { color: C.skin, detail: 0.004 });
}

/** White hair: a close cap over the skull and a high bun above the crown. */
function grandmaHair(k: AssetContext) {
  const cap = sdf.ellipsoid([0.168, 0.19, 0.148]).at(0, 1.315, -0.012);
  // The face opening is a big ball in front of the face. It cuts the cap across, so the hairline
  // is a clean edge and the hair keeps its volume at the back.
  const faceOpen = sdf.ellipsoid([0.255, 0.255, 0.255]).at(0, 1.075, 0.15);
  const hair = cap.subtract(faceOpen);
  // The bun sits above the crown, so the measured head stays the skull head. It joins the cap with
  // one soft blend, so it reads as a bun and not as a ball on the head.
  const bun = sdf.ellipsoid([0.086, 0.09, 0.079]).at(0, 1.5, -0.012);
  k.body('hair', sdf.smoothUnion(0.03, hair, bun), {
    color: C.hair,
    detail: 0.005,
    textureDensity: 1,
  });
}

/** The green cardigan over the torso and the arms, open at the front. */
function grandmaCardigan(k: AssetContext) {
  const cardiganProfile: [number, number][] = [
    [0, 1.05],
    [0.056, 1.044],
    [0.088, 1.026],
    [0.124, 1.0],
    [0.15, 0.94],
    [0.153, 0.9],
    [0.14, 0.85],
    [0.12, 0.806],
    [0.107, 0.778],
    [0.11, 0.748],
    [0.123, 0.7],
    [0.14, 0.668],
    [0.15, 0.645],
    [0.146, 0.62],
    [0.14, 0.59],
    [0.13, 0.57],
    [0.09, 0.56],
    [0, 0.56],
  ];
  const torso = sdf
    .revolve(profile.polygon(cardiganProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  const shoulder = (sx: number) =>
    sdf
      .ellipsoid([0.074, 0.078, 0.06])
      .at(sx * 0.126, 0.988, 0)
      .bone('chest');
  const sleeve = (sx: number) =>
    sdf
      .smoothUnion(
        0.022,
        sdf.cone([sx * 0.13, 0.986, 0], [sx * 0.152, KIM.elbowY, 0.006], 0.06, 0.05),
        sdf.cone([sx * 0.152, KIM.elbowY, 0.006], [sx * 0.168, 0.64, 0.014], 0.05, 0.04),
      )
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  // The cardigan is buttoned. Only the neck opening shows the dress under it.
  const opening = sdf.box([0.075, 0.24, 0.3]).at(0, 0.955, 0.16);
  const cardigan = sdf.union(torso, shoulder(-1), shoulder(1), sleeve(-1), sleeve(1)).subtract(opening);

  // Knit ribs: darker bands down the sleeves and along the front edges.
  const hrib = (y: number) => sdf.box([1.2, 0.011, 1.2]).at(0, y, 0);
  const bands = sdf.union(hrib(0.63), hrib(0.98));

  k.body('cardigan', cardigan.paintWhere(bands, C.cardiganDark), {
    color: C.cardigan,
    detail: 0.006,
    paintWeight: 2,
    textureDensity: 1,
  });
}

/** The pale green dress: the torso under the cardigan and the mid-calf skirt. */
function grandmaDress(k: AssetContext) {
  const dressProfile: [number, number][] = [
    [0, 1.035],
    [0.04, 1.03],
    [0.068, 1.012],
    [0.106, 0.985],
    [0.132, 0.94],
    [0.134, 0.9],
    [0.126, 0.85],
    [0.1, 0.806],
    [0.086, 0.778],
    [0.089, 0.748],
    [0.102, 0.7],
    [0.112, 0.68],
    [0, 0.68],
  ];
  const torso = sdf
    .revolve(profile.polygon(dressProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  // The skirt falls from the waist to the mid-calf and flares out.
  const skirtProfile: [number, number][] = [
    [0.112, 0.66],
    [0.118, 0.63],
    [0.124, 0.58],
    [0.132, 0.52],
    [0.146, 0.44],
    [0.158, 0.37],
    [0.165, 0.32],
    [0.167, 0.3],
    [0, 0.3],
  ];
  const skirt = sdf
    .revolve(profile.polygon(skirtProfile, { smooth: true }))
    .scale([1, 1, 0.82])
    .bone('hips');
  k.body('dress', sdf.union(torso, skirt), { color: C.dress, detail: 0.006 });
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
    'Grandma on the Teacher Kim adult base: white hair in a high bun, round cheeks, smile lines, pearl studs, a green cardigan over a pale green dress, a mid-calf skirt and brown flats.',
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
    grandmaFlats(k);
  },
});
