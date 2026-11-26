import { defineAsset, noise, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildChild, CHILD } from './parts/humanoid-kim-child.js';

/**
 * Tom on the child base. Identity from docs/sprout-mockups/tom.jpg: brown tousled hair with a side
 * tuft, freckles, an open smile, a blue-and-orange striped tee, green shorts, white socks, and
 * grey sneakers. The proportions, the skeleton, the hands, and the idle clip come from
 * `buildChild`. His face is his own layer over the base head (spec "The face layer and the
 * paint"). No cut-out and no sprite.
 */

export type CastMeta = {
  readonly faceMarks?: {
    readonly glasses?: `#${string}`;
    readonly moustache?: `#${string}`;
  };
};

/** Tom paints his face on the face layer, so he declares no face mark. */
export const castMeta: CastMeta = {};

const C = {
  skin: '#f2c7a4',
  hair: '#6b4426',
  brow: '#4a2e1c',
  mouth: '#6d2622',
  teeth: '#f7f1e6',
  blush: '#e29580',
  freckle: '#b5713f',
  tee: '#3f6fb5',
  teeDark: '#2a4a80',
  teeOrange: '#e08a2e',
  shorts: '#4f8a3c',
  sock: '#f2f0e8',
  sneaker: '#8d8d93',
  sole: '#efeee8',
};

/** The child head volume. The face layer rebuilds it, so it sits outside the base head. */
function childHeadVolume() {
  const skull = sdf.ellipsoid([CHILD.headRX, CHILD.headRY, CHILD.headRZ]).at(0, CHILD.headY, 0);
  const chin = sdf
    .ellipsoid([CHILD.chinRX, CHILD.chinRY, CHILD.chinRZ])
    .at(0, CHILD.chin + CHILD.chinRY, CHILD.chinZ);
  const jaw = sdf.smoothUnion(0.02, skull, chin);
  const nose = sdf.ellipsoid([0.009, 0.012, 0.017]).at(0, CHILD.noseY, CHILD.noseZ);
  return sdf.smoothUnion(0.009, jaw, nose);
}

/**
 * Tom's face layer. It rebuilds the child head volume, adds the base nose, inflates the union by
 * 2 mm, and keeps the front half (z >= 0.02 m), so it sits outside the base head and covers the
 * paint of the base face. The eyes, the open smile, the blush, and the freckles are paint on this
 * layer.
 */
function tomFace(k: AssetContext) {
  const head = childHeadVolume().round(0.002);
  const front = head.intersect(sdf.halfSpace([0, 0, -1], -0.02));

  // The eye pair of the base, rebuilt on the layer. The iris keeps the measured 0.053 x 0.051 m
  // opening, so the flat front render gives two eye components.
  const eyeWhite = (sx: number) => sdf.ellipsoid([0.042, 0.034, 0.09]).at(sx * CHILD.eyeX, CHILD.eyeY, 0.1);
  const iris = (sx: number) =>
    sdf.ellipsoid([CHILD.eyeRX, CHILD.eyeRY, 0.09]).at(sx * CHILD.eyeX, CHILD.eyeY, 0.102);
  const pupil = (sx: number) => sdf.ellipsoid([0.011, 0.011, 0.09]).at(sx * CHILD.eyeX, CHILD.eyeY, 0.106);
  const glint = (sx: number) => sdf.sphere(0.005).at(sx * (CHILD.eyeX + 0.009), CHILD.eyeY + 0.008, 0.092);
  // Thick brows, a little higher than the base brow.
  const brow = (sx: number) =>
    sdf
      .box([0.044, 0.014, 0.1], 0.005)
      .rotate(0, 0, sx * 7)
      .at(sx * CHILD.eyeX, CHILD.eyeY + 0.056, 0.095);
  // An open smile: a dark crescent with a white band of teeth under the upper lip.
  const smile = sdf.extrude(profile.arc(0.06, 0.016, 228, 312), 0.3).at(0, CHILD.mouthY, CHILD.mouthZ);
  const teeth = sdf.extrude(profile.arc(0.052, 0.005, 240, 300), 0.3).at(0, CHILD.mouthY, CHILD.mouthZ);
  // Rosy cheeks. They sit below the measured face band, so the band keeps the full face width.
  const blush = (sx: number) => sdf.ellipsoid([0.016, 0.009, 0.04]).at(sx * 0.055, 0.762, 0.078);
  // The freckles of the drawing: small dots on the cheeks and on the bridge of the nose.
  const freckle = (x: number, y: number, r: number) => sdf.extrude(profile.circle(r), 0.3).at(x, y, 0.078);
  const freckles = sdf.union(
    freckle(-0.046, 0.742, 0.004),
    freckle(-0.03, 0.752, 0.0035),
    freckle(-0.015, 0.745, 0.0035),
    freckle(-0.055, 0.755, 0.0035),
    freckle(0.015, 0.745, 0.0035),
    freckle(0.03, 0.752, 0.0035),
    freckle(0.046, 0.742, 0.004),
    freckle(0.055, 0.755, 0.0035),
  );

  const painted = front
    .paintWhere(sdf.union(eyeWhite(-1), eyeWhite(1)), '#f8f2e9')
    .paintWhere(sdf.union(iris(-1), iris(1)), '#4a2e18')
    .paintWhere(sdf.union(pupil(-1), pupil(1)), '#14100e')
    .paintWhere(sdf.union(glint(-1), glint(1)), '#ffffff')
    .paintWhere(sdf.union(brow(-1), brow(1)), C.brow)
    .paintWhere(smile, C.mouth)
    .paintWhere(teeth, C.teeth)
    .paintWhere(sdf.union(blush(-1), blush(1)), C.blush, 0.004)
    .paintWhere(freckles, C.freckle, 0.002);

  k.body('face', painted, {
    color: C.skin,
    detail: 0.0022,
    paintWeight: 2,
    textureDensity: 2,
  });
}

/**
 * Brown tousled hair. The mass is a rounded shell over the cranium, so it carries the measured
 * head width of the drawing. The hairline is cut high on the forehead, one lock leaves the crown
 * at the character's right, and one lock sweeps over the brow.
 */
function tomHair(k: AssetContext) {
  const cap = sdf.ellipsoid([0.1835, 0.175, 0.148]).at(0, 0.885, -0.004);
  // The side tuft: a lock that leaves the crown at the character's right.
  const tuft = sdf.cone([-0.07, 0.955, 0.045], [-0.172, 1.005, 0.0], 0.05, 0.015).bone('head');
  // A second lock under the tuft, so the tuft is a mass and not one spike.
  const tuft2 = sdf.cone([-0.06, 0.93, 0.06], [-0.158, 0.965, 0.03], 0.042, 0.013).bone('head');
  // A crown spike, so the top of the head is not a smooth dome.
  const spike = sdf.cone([-0.015, 0.99, 0.05], [-0.05, 1.058, 0.01], 0.038, 0.012).bone('head');
  // The fringe: a lock that sweeps over the brow.
  const fringe = sdf.cone([0.035, 1.005, 0.055], [0.062, 0.922, 0.122], 0.036, 0.014).bone('head');
  // The two side locks fall in front of the ears.
  const sideLock = (sx: number) =>
    sdf.cone([sx * 0.125, 0.935, 0.05], [sx * 0.152, 0.822, 0.07], 0.032, 0.009).bone('head');
  const mass = sdf
    .smoothUnion(0.018, cap, tuft, tuft2, spike, fringe, sideLock(-1), sideLock(1))
    .displace(
      0.003,
      (x, y, z) =>
        noise.fbm(x * 10, y * 10, z * 10, 2) * 0.55 + Math.sin(Math.atan2(x, z + 0.04) * 13) * 0.45,
    );
  // The face opening cuts the hairline high on the forehead.
  const faceOpen = sdf.sphere(0.31).at(0, 0.6, 0.22);
  k.body('hair', mass.subtract(childHeadVolume()).subtract(faceOpen), {
    color: C.hair,
    detail: 0.0028,
    maxError: 0.0006,
    textureDensity: 1,
  });
}

/** The striped tee over the torso and the upper arms. */
function tomTee(k: AssetContext) {
  const teeProfile: [number, number][] = [
    [0, 0.652],
    [0.046, 0.645],
    [0.07, 0.632],
    [0.084, 0.61],
    [0.092, 0.582],
    [0.095, 0.55],
    [0.093, 0.51],
    [0.092, 0.47],
    [0.093, 0.43],
    [0.096, 0.39],
    [0.094, 0.362],
    [0.07, 0.35],
    [0, 0.346],
  ];
  const torso = sdf
    .revolve(profile.polygon(teeProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  const sleeve = (sx: number) =>
    sdf
      .cone([sx * 0.088, 0.6, 0], [sx * 0.101, 0.53, 0.005], 0.042, 0.032)
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  const tee = sdf.smoothUnion(0.025, torso, sleeve(-1), sleeve(1));

  // The stripes of the drawing: orange bands over a blue shirt, with a dark blue band between
  // them and a dark blue hem.
  const band = (y: number, h: number) => sdf.box([1.4, h, 1.4]).at(0, y, 0);
  const orange = sdf.union(band(0.596, 0.03), band(0.5, 0.03), band(0.404, 0.03));
  const dark = sdf.union(band(0.548, 0.024), band(0.452, 0.024), band(0.356, 0.026));

  k.body('tee', tee.paintWhere(orange, C.teeOrange).paintWhere(dark, C.teeDark), {
    color: C.tee,
    detail: 0.005,
    paintWeight: 2,
    textureDensity: 1,
  });
}

/** The collar band of the tee. */
function tomCollar(k: AssetContext) {
  const collar = sdf
    .torus(0.046, 0.009)
    .scale([1, 0.6, 0.85])
    .at(0, 0.645, -0.004)
    .subtract(sdf.box([0.024, 0.2, 0.3]).at(0, 0.65, 0.09))
    .bone('neck');
  k.body('collar', collar, { color: C.teeDark, detail: 0.003 });
}

/** The green shorts over the hips and the upper thighs. */
function tomShorts(k: AssetContext) {
  const seatProfile: [number, number][] = [
    [0, 0.415],
    [0.05, 0.412],
    [0.075, 0.403],
    [0.088, 0.385],
    [0.092, 0.36],
    [0.09, 0.33],
    [0.08, 0.305],
    [0, 0.3],
  ];
  const seat = sdf
    .revolve(profile.polygon(seatProfile, { smooth: true }))
    .scale([1, 1, 0.8])
    .bone('hips');
  const leg = (sx: number) =>
    sdf
      .cone([sx * 0.045, 0.37, 0], [sx * 0.052, 0.245, 0], 0.056, 0.042)
      .intersect(sdf.halfSpace([0, -1, 0], -0.248))
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  k.body('shorts', sdf.union(seat, leg(-1), leg(1)), {
    color: C.shorts,
    detail: 0.005,
  });
}

/** The white socks over the lower legs. */
function tomSocks(k: AssetContext) {
  const sock = (sx: number) =>
    sdf
      .cone([sx * CHILD.kneeX, 0.115, 0.006], [sx * CHILD.ankleX, 0.045, 0.008], 0.031, 0.027)
      .bone(sx > 0 ? 'shin.L' : 'shin.R');
  k.body('socks', sock(-1).union(sock(1)), { color: C.sock, detail: 0.004 });
}

/** The grey sneakers over the feet, with a pale sole and lace bars. */
function tomSneakers(k: AssetContext) {
  const shoe = (sx: number) =>
    sdf
      .smoothUnion(
        0.012,
        sdf.ellipsoid([0.04, 0.034, 0.068]).at(sx * CHILD.ankleX, 0.032, 0.032),
        sdf.ellipsoid([0.036, 0.024, 0.05]).at(sx * CHILD.ankleX, 0.03, 0.072),
      )
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('sneakers', shoe(-1).union(shoe(1)), { color: C.sneaker, detail: 0.004 });
  const sole = (sx: number) =>
    sdf
      .box([0.076, 0.014, 0.13], 0.005)
      .at(sx * CHILD.ankleX, 0.007, 0.034)
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('sneaker-sole', sole(-1).union(sole(1)), { color: C.sole, detail: 0.003 });
  const lace = (sx: number, y: number) =>
    sdf
      .box([0.034, 0.005, 0.008], 0.002)
      .at(sx * CHILD.ankleX, y, 0.062)
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('laces', lace(-1, 0.052).union(lace(1, 0.052)).union(lace(-1, 0.04)).union(lace(1, 0.04)), {
    color: C.sole,
    detail: 0.002,
  });
}

export default defineAsset({
  name: 'sprout-tom-kim',
  description:
    'Tom on the child base: brown tousled hair with a side tuft, freckles, an open smile, a blue-and-orange striped tee, green shorts, white socks, and grey sneakers.',
  reference: 'docs/sprout-mockups/tom.jpg',
  detail: 0.004,
  texture: false,
  variants: {
    skin: { fair: '#f2c7a4', tan: '#d8a077', brown: '#a06a45' },
    hair: { brown: '#6b4426', dark: '#4a2e1c', blonde: '#b07f3a' },
    eyes: { brown: '#6e4020', hazel: '#8a6a2a', blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { blue: '#3f6fb5', green: '#4f8a3c', grey: '#8d8d93' },
  },
  presets: {
    tom: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'blue' },
  },
  build(k) {
    buildChild(k);
    tomFace(k);
    tomHair(k);
    tomTee(k);
    tomCollar(k);
    tomShorts(k);
    tomSocks(k);
    tomSneakers(k);
  },
});
