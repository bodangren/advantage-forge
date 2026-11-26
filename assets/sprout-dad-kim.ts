import { defineAsset, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildKim, KIM } from './parts/humanoid-kim.js';

/**
 * Dad on the Teacher Kim adult base. Identity from docs/sprout-mockups/dad.jpg: black swept-back
 * hair, a square jaw, thick brows, an open smile, a red-and-black plaid shirt over a white tee,
 * dark blue jeans, and brown boots. The proportions, the skeleton, the hands and the idle clip come
 * from `buildKim`. His face is his own layer over the base head (spec "The face layer and the
 * paint"). No cut-out and no sprite.
 */

export type CastMeta = {
  readonly faceMarks?: {
    readonly glasses?: `#${string}`;
    readonly moustache?: `#${string}`;
  };
};

/** Dad paints his face on the face layer, so he declares no face mark. */
export const castMeta: CastMeta = {};

const C = {
  skin: '#f2c7a4',
  hair: '#241c18',
  brow: '#3a2820',
  mouth: '#6d2622',
  teeth: '#f7f1e6',
  plaid: '#a8322c',
  plaidDark: '#2b2326',
  tee: '#e6e0d2',
  jeans: '#2c4a78',
  boot: '#6b3f26',
  sole: '#3b2416',
};

/**
 * Dad's face layer. It rebuilds the published `KIM` head volume, adds the base nose, inflates the
 * union by 2 mm, and keeps the front half (z >= 0.02 m), so it sits outside the base head and
 * covers the paint of the base face. The eyes, the thick brows and the open smile are paint on
 * this layer.
 */
function dadFace(k: AssetContext) {
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
  // Thick brows: a wide flat box, a little steeper than the base brow.
  const brow = (sx: number) =>
    sdf
      .box([0.062, 0.02, 0.1], 0.005)
      .rotate(0, 0, sx * 7)
      .at(sx * KIM.eyeX, 1.306, 0.115);
  // An open smile: a thick dark crescent with a white band of teeth under the upper lip.
  const smile = sdf.extrude(profile.arc(0.075, 0.03, 228, 312), 0.3).at(0, 1.22, 0.13);
  const teeth = sdf.extrude(profile.arc(0.065, 0.01, 240, 300), 0.3).at(0, 1.22, 0.13);

  const painted = front
    .paintWhere(sdf.union(eyeWhite(-1), eyeWhite(1)), '#f8f2e9')
    .paintWhere(sdf.union(iris(-1), iris(1)), '#4a2e18')
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#14100e')
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff')
    .paintWhere(sdf.union(brow(-1), brow(1)), C.brow)
    .paintWhere(smile, C.mouth)
    .paintWhere(teeth, C.teeth);

  k.body('face', painted, {
    color: C.skin,
    detail: 0.0025,
    paintWeight: 2,
    textureDensity: 2,
  });
}

/**
 * Dad's square jaw: a second body in the skin material. It sits inside the face layer everywhere
 * except at the chin, where it widens the outline into a square jaw.
 */
function dadJaw(k: AssetContext) {
  const jaw = sdf.box([0.184, 0.07, 0.14], 0.014).at(0, 1.102, -0.006).bone('head');
  k.body('jaw', jaw, { color: C.skin, detail: 0.004 });
}

/** Black hair, swept back from the forehead with a quiff over the front of the crown. */
function dadHair(k: AssetContext) {
  const cap = sdf.ellipsoid([0.168, 0.19, 0.148]).at(0, 1.315, -0.012);
  // The face opening is a big ball in front of the face. It cuts the cap across, so the hairline
  // is a clean edge and the hair keeps its volume at the back.
  const faceOpen = sdf.ellipsoid([0.255, 0.255, 0.255]).at(0, 1.075, 0.15);
  // The quiff: the front of the crown lifts and sweeps back over the cap.
  const quiff = sdf.ellipsoid([0.13, 0.07, 0.1]).rotateX(-30).at(0.006, 1.428, 0.026);
  // The cut runs over the joined mass, so the hairline stays a clean edge.
  const hair = sdf.smoothUnion(0.008, cap, quiff).subtract(faceOpen);
  k.body('hair', hair, {
    color: C.hair,
    detail: 0.005,
    textureDensity: 1,
  });
}

/** The plaid shirt over the torso and the arms, with the white tee showing in the open front. */
function dadShirt(k: AssetContext) {
  const shirtProfile: [number, number][] = [
    [0, 1.058],
    [0.058, 1.052],
    [0.09, 1.035],
    [0.126, 1.0],
    [0.152, 0.94],
    [0.155, 0.9],
    [0.142, 0.85],
    [0.122, 0.806],
    [0.109, 0.778],
    [0.112, 0.748],
    [0.125, 0.7],
    [0.142, 0.668],
    [0.152, 0.645],
    [0.15, 0.62],
    [0, 0.62],
  ];
  const torso = sdf
    .revolve(profile.polygon(shirtProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  const shoulder = (sx: number) =>
    sdf
      .ellipsoid([0.076, 0.08, 0.062])
      .at(sx * 0.126, 0.988, 0)
      .bone('chest');
  const sleeve = (sx: number) =>
    sdf
      .smoothUnion(
        0.022,
        sdf.cone([sx * 0.13, 0.986, 0], [sx * 0.152, KIM.elbowY, 0.006], 0.062, 0.052),
        sdf.cone([sx * 0.152, KIM.elbowY, 0.006], [sx * 0.17, 0.632, 0.014], 0.052, 0.04),
      )
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  // The open front of the shirt: a slot down the middle shows the white tee under it.
  const opening = sdf.box([0.066, 0.46, 0.3]).at(0, 0.835, 0.16);
  const shirt = sdf.union(torso, shoulder(-1), shoulder(1), sleeve(-1), sleeve(1)).subtract(opening);

  // Plaid: black bands over the red cloth. The vertical stripes run down the body, the horizontal
  // bands cross them.
  const vstripe = (x: number) => sdf.box([0.018, 1.4, 1.4]).at(x, 0.8, 0);
  const hband = (y: number) => sdf.box([1.4, 0.02, 1.4]).at(0, y, 0);
  const stripes = sdf.union(
    vstripe(-0.132),
    vstripe(-0.096),
    vstripe(-0.06),
    vstripe(-0.024),
    vstripe(0.024),
    vstripe(0.06),
    vstripe(0.096),
    vstripe(0.132),
  );
  const bands = sdf.union(hband(0.68), hband(0.78), hband(0.88), hband(0.97));

  k.body('plaid', shirt.paintWhere(stripes, C.plaidDark).paintWhere(bands, C.plaidDark), {
    color: C.plaid,
    detail: 0.006,
    paintWeight: 2,
    textureDensity: 1,
  });
}

/** The shirt collar: a ring around the neck, open at the front. */
function dadCollar(k: AssetContext) {
  const collar = sdf
    .torus(0.066, 0.014)
    .scale([1, 1, 0.85])
    .at(0, 1.045, -0.006)
    .subtract(sdf.box([0.078, 0.2, 0.3]).at(0, 1.045, 0.16))
    .bone('neck');
  k.body('collar', collar, { color: C.plaid, detail: 0.004 });
}

/** The white tee under the open shirt: the front half of the torso, just over the skin. */
function dadTee(k: AssetContext) {
  const teeProfile: [number, number][] = [
    [0, 1.045],
    [0.045, 1.04],
    [0.075, 1.02],
    [0.1, 0.995],
    [0.122, 0.962],
    [0.134, 0.918],
    [0.14, 0.9],
    [0.13, 0.85],
    [0.112, 0.8],
    [0.1, 0.775],
    [0.103, 0.745],
    [0.114, 0.7],
    [0.128, 0.66],
    [0.134, 0.63],
    [0.13, 0.6],
    [0, 0.6],
  ];
  const torso = sdf
    .revolve(profile.polygon(teeProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .intersect(sdf.halfSpace([0, 0, -1], -0.01))
    .bone('chest');
  k.body('tee', torso, { color: C.tee, detail: 0.006 });
}

/** Dark blue jeans over the seat, the hips, the thighs and the shins. */
function dadJeans(k: AssetContext) {
  const seatProfile: [number, number][] = [
    [0, 0.71],
    [0.085, 0.702],
    [0.122, 0.684],
    [0.14, 0.655],
    [0.147, 0.612],
    [0.148, 0.585],
    [0.14, 0.552],
    [0, 0.552],
  ];
  const seat = sdf
    .revolve(profile.polygon(seatProfile, { smooth: true }))
    .scale([1, 1, 0.8])
    .bone('hips');
  const leg = (sx: number) =>
    sdf
      .smoothUnion(
        0.02,
        sdf.cone([sx * KIM.hipX, KIM.hipY + 0.06, 0], [sx * KIM.kneeX, KIM.kneeY, 0], 0.072, 0.052),
        sdf.cone([sx * KIM.kneeX, KIM.kneeY, 0], [sx * KIM.ankleX, 0.075, 0.01], 0.052, 0.036),
      )
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  const cuff = (sx: number) =>
    sdf
      .torus(0.04, 0.007)
      .at(sx * KIM.ankleX, 0.078, 0.01)
      .bone('shin.L');
  k.body('jeans', sdf.union(seat, leg(-1), leg(1), cuff(-1), cuff(1)), {
    color: C.jeans,
    detail: 0.006,
  });
}

/** Brown boots over the feet, with a dark sole. */
function dadBoots(k: AssetContext) {
  const boot = (sx: number) =>
    sdf
      .smoothUnion(
        0.014,
        sdf.ellipsoid([0.05, 0.046, 0.09]).at(sx * KIM.ankleX, 0.04, 0.044),
        sdf.box([0.096, 0.018, 0.172], 0.007).at(sx * KIM.ankleX, 0.009, 0.042),
      )
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('boots', boot(-1).union(boot(1)), { color: C.boot, detail: 0.005 });
  const sole = (sx: number) =>
    sdf
      .box([0.09, 0.008, 0.166], 0.004)
      .at(sx * KIM.ankleX, 0.004, 0.04)
      .bone('foot.L');
  k.body('boot-sole', sole(-1).union(sole(1)), { color: C.sole, detail: 0.004 });
}

export default defineAsset({
  name: 'sprout-dad-kim',
  description:
    'Dad on the Teacher Kim adult base: black swept-back hair, a square jaw, thick brows, an open smile, a red-and-black plaid shirt over a white tee, dark blue jeans and brown boots.',
  reference: 'docs/sprout-mockups/dad.jpg',
  detail: 0.005,
  texture: false,
  variants: {
    skin: { fair: '#f2c7a4', tan: '#d8a077', brown: '#a06a45' },
    hair: { black: '#241c18', dark: '#171210', brown: '#3a2a1e' },
    eyes: { brown: '#6e4020', hazel: '#8a6a2a', blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { plaid: '#a8322c', blue: '#2c4a78', olive: '#5a6b3a' },
  },
  presets: {
    dad: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'plaid' },
  },
  build(k) {
    buildKim(k);
    dadFace(k);
    dadJaw(k);
    dadHair(k);
    dadShirt(k);
    dadCollar(k);
    dadTee(k);
    dadJeans(k);
    dadBoots(k);
  },
});
