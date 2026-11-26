import { defineAsset, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildKim, KIM } from './parts/humanoid-kim.js';

/**
 * Grandpa on the Teacher Kim adult base. Identity from docs/sprout-mockups/grandpa.jpg: a bald
 * crown with white side hair, round dark-brown glasses, a white moustache, an open smile, a green
 * V-neck sweater over a pale green collared shirt, brown trousers, and brown shoes. The
 * proportions, the skeleton, the hands and the idle clip come from `buildKim`. His face is his own
 * layer over the base head (spec "The face layer and the paint"). The glasses and the moustache
 * are paint on that layer. No cut-out and no sprite.
 */

export type CastMeta = {
  readonly faceMarks?: {
    readonly glasses?: `#${string}`;
    readonly moustache?: `#${string}`;
  };
};

/** The declared glasses paint colour. It stays more than 24 from every eye colour. */
export const castMeta: CastMeta = { faceMarks: { glasses: '#3b2a1e' } };

const C = {
  skin: '#f2c7a4',
  hair: '#f0ece4',
  glasses: '#3b2a1e',
  mouth: '#7c2b28',
  teeth: '#f7f1e6',
  sweater: '#4f7a4a',
  sweaterDark: '#3d6139',
  shirt: '#cfe0bd',
  trousers: '#7a5a38',
  trousersDark: '#63482c',
  shoe: '#6b3f26',
  sole: '#3b2416',
};

/**
 * Grandpa's face layer. It rebuilds the published `KIM` head volume, adds the base nose, inflates
 * the union by 2 mm, and keeps the front half (z >= 0.02 m), so it sits outside the base head and
 * covers the paint of the base face. The eyes, the brows, the glasses, the moustache and the open
 * smile are paint on this layer.
 */
function grandpaFace(k: AssetContext) {
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
  // White bushy brows above the glasses.
  const brow = (sx: number) =>
    sdf
      .box([0.056, 0.013, 0.1], 0.005)
      .rotate(0, 0, sx * 6)
      .at(sx * KIM.eyeX, 1.306, 0.115);
  // Round glasses: a ring around each eye, a bridge, and the temple arms to the ears.
  const rim = (sx: number) =>
    sdf.extrude(profile.arc(0.048, 0.011, 0, 360), 0.3).at(sx * KIM.eyeX, KIM.eyeY, 0.13);
  const bridge = sdf.extrude(profile.rect([0.03, 0.009], 0.003), 0.3).at(0, 1.252, 0.13);
  // The white moustache under the nose, and the open smile under it.
  const moustache = sdf.extrude(profile.arc(0.07, 0.015, 55, 125), 0.3).at(0, 1.108, 0.13);
  const smile = sdf.extrude(profile.arc(0.06, 0.03, 232, 308), 0.3).at(0, 1.175, 0.13);
  const teeth = sdf.extrude(profile.arc(0.04, 0.01, 242, 298), 0.3).at(0, 1.167, 0.13);

  const painted = front
    .paintWhere(sdf.union(eyeWhite(-1), eyeWhite(1)), '#f8f2e9')
    .paintWhere(sdf.union(iris(-1), iris(1)), '#4a2e18')
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#14100e')
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff')
    .paintWhere(sdf.union(brow(-1), brow(1)), C.hair)
    .paintWhere(moustache, C.hair)
    .paintWhere(smile, C.mouth)
    .paintWhere(teeth, C.teeth)
    .paintWhere(sdf.union(rim(-1), rim(1), bridge), C.glasses);

  k.body('face', painted, {
    color: C.skin,
    detail: 0.0025,
    paintWeight: 2,
    textureDensity: 2,
  });
}

/** White side hair: two tufts at the sides of the bald crown. */
function grandpaHair(k: AssetContext) {
  const tuft = (sx: number) =>
    sdf
      .smoothUnion(
        0.014,
        sdf.ellipsoid([0.042, 0.098, 0.088]).at(sx * 0.132, 1.335, -0.028),
        sdf.ellipsoid([0.038, 0.062, 0.07]).at(sx * 0.138, 1.253, -0.04),
      )
      .bone('head');
  k.body('hair', tuft(-1).union(tuft(1)), {
    color: C.hair,
    detail: 0.005,
    textureDensity: 1,
  });
}

/** The green V-neck sweater over the torso and the arms. */
function grandpaSweater(k: AssetContext) {
  const sweaterProfile: [number, number][] = [
    [0, 1.058],
    [0.062, 1.052],
    [0.096, 1.036],
    [0.132, 1.0],
    [0.158, 0.94],
    [0.161, 0.9],
    [0.148, 0.85],
    [0.126, 0.806],
    [0.112, 0.778],
    [0.115, 0.748],
    [0.128, 0.7],
    [0.145, 0.668],
    [0.155, 0.645],
    [0.15, 0.625],
    [0.14, 0.61],
    [0.1, 0.602],
    [0, 0.602],
  ];
  const torso = sdf
    .revolve(profile.polygon(sweaterProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  const shoulder = (sx: number) =>
    sdf
      .ellipsoid([0.08, 0.084, 0.064])
      .at(sx * 0.126, 0.988, 0)
      .bone('chest');
  const sleeve = (sx: number) =>
    sdf
      .smoothUnion(
        0.022,
        sdf.cone([sx * 0.13, 0.986, 0], [sx * 0.152, KIM.elbowY, 0.006], 0.064, 0.054),
        sdf.cone([sx * 0.152, KIM.elbowY, 0.006], [sx * 0.17, 0.632, 0.014], 0.054, 0.042),
      )
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  // The V-neck: a slot at the front shows the pale green shirt and its collar.
  const neck = sdf.box([0.086, 0.16, 0.3]).at(0, 1.01, 0.16);
  const sweater = sdf.union(torso, shoulder(-1), shoulder(1), sleeve(-1), sleeve(1)).subtract(neck);

  // Ribs at the hem and the cuffs.
  const hrib = (y: number) => sdf.box([1.2, 0.014, 1.2]).at(0, y, 0);
  const bands = sdf.union(hrib(0.64), hrib(0.98));

  k.body('sweater', sweater.paintWhere(bands, C.sweaterDark), {
    color: C.sweater,
    detail: 0.006,
    paintWeight: 2,
    textureDensity: 1,
  });
}

/** The pale green shirt under the sweater, with its collar at the neck. */
function grandpaShirt(k: AssetContext) {
  const shirtProfile: [number, number][] = [
    [0, 1.04],
    [0.05, 1.034],
    [0.08, 1.016],
    [0.112, 0.99],
    [0.138, 0.94],
    [0.141, 0.9],
    [0.128, 0.85],
    [0.108, 0.806],
    [0.096, 0.778],
    [0.099, 0.748],
    [0.112, 0.7],
    [0.122, 0.68],
    [0, 0.68],
  ];
  const torso = sdf
    .revolve(profile.polygon(shirtProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .intersect(sdf.halfSpace([0, 0, -1], -0.01))
    .bone('chest');
  k.body('shirt', torso, { color: C.shirt, detail: 0.006 });
  // The collar: a ring at the neck, open at the front.
  const collar = sdf
    .torus(0.064, 0.013)
    .scale([1, 1, 0.85])
    .at(0, 1.048, -0.006)
    .subtract(sdf.box([0.07, 0.2, 0.3]).at(0, 1.048, 0.16))
    .bone('neck');
  k.body('collar', collar, { color: C.shirt, detail: 0.004 });
}

/** Brown trousers over the seat, the hips, the thighs and the shins. */
function grandpaTrousers(k: AssetContext) {
  const seatProfile: [number, number][] = [
    [0, 0.71],
    [0.088, 0.702],
    [0.126, 0.684],
    [0.148, 0.655],
    [0.155, 0.612],
    [0.156, 0.585],
    [0.148, 0.552],
    [0, 0.552],
  ];
  const seat = sdf
    .revolve(profile.polygon(seatProfile, { smooth: true }))
    .scale([1, 1, 0.82])
    .bone('hips');
  const leg = (sx: number) =>
    sdf
      .smoothUnion(
        0.02,
        sdf.cone([sx * KIM.hipX, KIM.hipY + 0.06, 0], [sx * KIM.kneeX, KIM.kneeY, 0], 0.076, 0.056),
        sdf.cone([sx * KIM.kneeX, KIM.kneeY, 0], [sx * KIM.ankleX, 0.075, 0.01], 0.056, 0.038),
      )
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  k.body('trousers', sdf.union(seat, leg(-1), leg(1)), {
    color: C.trousers,
    detail: 0.006,
  });
  const crease = (sx: number) =>
    sdf
      .box([0.012, 0.5, 0.012])
      .at(sx * 0.07, 0.45, 0.055)
      .bone('leg.L');
  k.body('trouser-crease', crease(-1).union(crease(1)), {
    color: C.trousersDark,
    detail: 0.005,
  });
}

/** Brown shoes over the feet, with a dark sole. */
function grandpaShoes(k: AssetContext) {
  const shoe = (sx: number) =>
    sdf
      .smoothUnion(
        0.014,
        sdf.ellipsoid([0.05, 0.044, 0.09]).at(sx * KIM.ankleX, 0.038, 0.044),
        sdf.box([0.096, 0.018, 0.172], 0.007).at(sx * KIM.ankleX, 0.009, 0.042),
      )
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('shoes', shoe(-1).union(shoe(1)), { color: C.shoe, detail: 0.005 });
  const sole = (sx: number) =>
    sdf
      .box([0.09, 0.008, 0.166], 0.004)
      .at(sx * KIM.ankleX, 0.004, 0.04)
      .bone('foot.L');
  k.body('shoe-sole', sole(-1).union(sole(1)), { color: C.sole, detail: 0.004 });
}

export default defineAsset({
  name: 'sprout-grandpa-kim',
  description:
    'Grandpa on the Teacher Kim adult base: a bald crown with white side hair, round dark-brown glasses, a white moustache, an open smile, a green V-neck sweater over a pale green collared shirt, brown trousers and brown shoes.',
  reference: 'docs/sprout-mockups/grandpa.jpg',
  detail: 0.005,
  texture: false,
  variants: {
    skin: { fair: '#f2c7a4', tan: '#d8a077', brown: '#a06a45' },
    hair: { white: '#f0ece4', silver: '#d8d4cc', cream: '#e8dcc4' },
    eyes: { brown: '#6e4020', hazel: '#8a6a2a', blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { forest: '#4f7a4a', moss: '#3d6139', sand: '#b09566' },
  },
  presets: {
    grandpa: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'forest' },
  },
  build(k) {
    buildKim(k);
    grandpaFace(k);
    grandpaHair(k);
    grandpaSweater(k);
    grandpaShirt(k);
    grandpaTrousers(k);
    grandpaShoes(k);
  },
});
