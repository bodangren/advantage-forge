import { defineAsset, noise, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildChild, CHILD } from './parts/humanoid-kim-child.js';

/**
 * Lily on the child base. Identity from docs/sprout-mockups/lily.jpg: a brown bob to the jaw with
 * straight soft bangs, an open smile, a blue tee with a white Peter Pan collar, a red pleated
 * skirt, white mid-calf socks, and red sneakers. The proportions, the skeleton, the hands, and the
 * idle clip come from `buildChild`. Her face is her own layer over the base head (spec "The face
 * layer and the paint"). No cut-out and no sprite.
 *
 * The three Lily guards of spec "The Lily hair and chin check" decide the hair geometry:
 *
 * 1. `lily chin` reads the rows from `chinRow - 0.15 * headHeight` to `chinRow`. The hair must not
 *    reach the chin row, so the bob ends at 0.746 m, at the jaw, above the 0.687 m chin.
 * 2. `lily side chin` reads the frontmost side pixel at the chin rows. The bob's cut is behind the
 *    chin, so the neck's skin is the frontmost pixel there.
 * 3. `lily bangs` reads the hair above the eye components' top row, inside the two eye components'
 *    column span. The bob's temple hair sits beside the eyes, so it stays outside that span, and
 *    the fringe stops above the brow row.
 *
 * The mouth paint is a light red. The chin guard reads every pixel within 40 (Chebyshev) of the
 * hair colour in the chin band, and the antialiased edge of a dark mouth passes through that
 * brown. A mouth in that band therefore takes a red that no blend of it and the skin reaches.
 */

export type CastMeta = {
  readonly faceMarks?: {
    readonly glasses?: `#${string}`;
    readonly moustache?: `#${string}`;
  };
};

/** Lily paints her face on the face layer, so she declares no face mark. */
export const castMeta: CastMeta = {};

const C = {
  skin: '#f2c7a4',
  hair: '#7a5230',
  brow: '#4a2e1c',
  mouth: '#c04040',
  teeth: '#f7f1e6',
  blush: '#e29580',
  freckle: '#b5713f',
  tee: '#3f6fb5',
  collar: '#f8f4ec',
  skirt: '#c8352e',
  skirtDark: '#8e2318',
  sock: '#f2f0e8',
  shoe: '#c8352e',
  sole: '#efeee8',
};

/**
 * The eye line of Lily's face layer. The base's eye pair sits at 0.815 m, which the drawing's
 * measured eye line gives, and the layer rebuilds that pair with a slightly wider iris, so the
 * eye-width row stays inside the child table. The eye pair stays separate from the hair and the
 * brow, so the flat front render gives two eye components.
 */
const EYE_Y = 0.815;
const EYE_RX = 0.027;
const EYE_RY = 0.026;

/**
 * The bob's silhouette in the front view, as (radius, height) pairs. Two rows of the profile keep
 * the radius inside the skull, so the hair carries no pixel in the eye window's upper strip, and the
 * hem sits at 0.746 m, above the chin band that the chin guard reads.
 */
const BOB_PROFILE: [number, number][] = [
  [0, 1.03],
  [0.007, 1.041],
  [0.021, 1.048],
  [0.042, 1.05],
  [0.068, 1.047],
  [0.092, 1.039],
  [0.116, 1.025],
  [0.138, 1.009],
  [0.156, 0.99],
  [0.169, 0.97],
  [0.177, 0.95],
  [0.182, 0.93],
  [0.183, 0.91],
  [0.182, 0.891],
  [0.179, 0.872],
  [0.176, 0.854],
  [0.176, 0.836],
  [0.179, 0.818],
  [0.183, 0.799],
  [0.186, 0.781],
  [0.187, 0.765],
  [0.183, 0.751],
  [0.172, 0.7475],
  [0.15, 0.7465],
  [0.1, 0.746],
  [0, 0.746],
];

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
 * Lily's face layer. It rebuilds the child head volume, adds the base nose, inflates the union by
 * 2 mm, and keeps the front half, so it sits outside the base head and covers the paint of the base
 * face. The eyes, the open smile, the blush, and the freckles are paint on this layer.
 */
function lilyFace(k: AssetContext) {
  const head = childHeadVolume().round(0.002);
  const front = head.intersect(sdf.halfSpace([0, 0, -1], -0.02));

  // The eye pair of the base, rebuilt on the layer. The iris keeps the measured 0.053 m opening,
  // so the flat front render gives two eye components.
  const eyeWhite = (sx: number) => sdf.ellipsoid([0.042, 0.034, 0.09]).at(sx * CHILD.eyeX, EYE_Y, 0.1);
  const iris = (sx: number) => sdf.ellipsoid([EYE_RX, EYE_RY, 0.09]).at(sx * CHILD.eyeX, EYE_Y, 0.102);
  const pupil = (sx: number) => sdf.ellipsoid([0.011, 0.011, 0.09]).at(sx * CHILD.eyeX, EYE_Y, 0.106);
  const glint = (sx: number) => sdf.sphere(0.005).at(sx * (CHILD.eyeX + 0.009), EYE_Y + 0.008, 0.092);
  // Soft dark brows, arched a little higher than the base brow.
  const brow = (sx: number) =>
    sdf
      .box([0.042, 0.013, 0.1], 0.005)
      .rotate(0, 0, sx * 6)
      .at(sx * CHILD.eyeX, 0.8665, 0.095);
  // An open smile: a dark crescent with a white band of teeth under the upper lip.
  const smile = sdf.extrude(profile.arc(0.06, 0.016, 228, 312), 0.3).at(0, CHILD.mouthY, CHILD.mouthZ);
  const teeth = sdf.extrude(profile.arc(0.05, 0.009, 236, 304), 0.3).at(0, CHILD.mouthY, CHILD.mouthZ);
  // Rosy cheeks. They sit below the measured face band, so the band keeps the full face width.
  const blush = (sx: number) => sdf.ellipsoid([0.016, 0.009, 0.04]).at(sx * 0.055, 0.762, 0.078);
  // The freckles of the drawing: small dots on the cheeks and on the bridge of the nose.
  const freckle = (x: number, y: number, r: number) => sdf.extrude(profile.circle(r), 0.3).at(x, y, 0.078);
  const freckles = sdf.union(
    freckle(-0.046, 0.742, 0.0035),
    freckle(-0.03, 0.752, 0.003),
    freckle(-0.015, 0.745, 0.003),
    freckle(-0.055, 0.755, 0.003),
    freckle(0.015, 0.745, 0.003),
    freckle(0.03, 0.752, 0.003),
    freckle(0.046, 0.742, 0.0035),
    freckle(0.055, 0.755, 0.003),
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
 * The brown bob. One revolve draws the whole shape: a close dome over the crown, straight sides
 * down to a blunt cut at the jaw. The face window opens the face, and the bangs hang in front of
 * the forehead as a thin shell with a straight edge above the brow row. The mass is a shell around
 * the skull, so the cut edge is thin and the hair never covers the eye band.
 */
function lilyHair(k: AssetContext) {
  const bob = sdf.revolve(profile.polygon(BOB_PROFILE, { smooth: true })).scale([1, 1, 0.78]);
  // The face window: a soft opening in front of the face. It stops at the hairline, so the crown
  // keeps its hair, and it reaches back past the cheek, so the bob frames the face.
  const faceWindow = sdf.ellipsoid([0.13, 0.17, 0.16]).at(0, 0.8, 0.06);
  // The bangs: a thin shell over the forehead, cut straight above the brow row. The shell follows
  // the skull, so the fringe lies flat on the forehead instead of standing off it.
  const bangs = childHeadVolume()
    .round(0.004)
    .intersect(sdf.halfSpace([0, -1, 0], -0.878));
  const mass = sdf
    .smoothUnion(0.01, bob.subtract(childHeadVolume()).subtract(faceWindow), bangs)
    .displace(
      0.0008,
      (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2) * 0.4 + Math.sin(Math.atan2(x, z) * 9) * 0.6,
    );
  k.body('hair', mass.bone('head'), {
    color: C.hair,
    detail: 0.0026,
    maxError: 0.0006,
    textureDensity: 1,
  });
}

/** The blue tee over the torso and the upper arms, with the short sleeves of the drawing. */
function lilyTee(k: AssetContext) {
  const teeProfile: [number, number][] = [
    [0, 0.652],
    [0.046, 0.645],
    [0.07, 0.632],
    [0.084, 0.61],
    [0.092, 0.582],
    [0.095, 0.55],
    [0.093, 0.51],
    [0.092, 0.47],
    [0.094, 0.44],
    [0.096, 0.415],
    [0.09, 0.406],
    [0.07, 0.402],
    [0, 0.4],
  ];
  const torso = sdf
    .revolve(profile.polygon(teeProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  const sleeve = (sx: number) =>
    sdf
      .cone([sx * 0.088, 0.6, 0], [sx * 0.112, 0.53, 0.005], 0.042, 0.034)
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  const tee = sdf.smoothUnion(0.025, torso, sleeve(-1), sleeve(1));
  k.body('tee', tee, { color: C.tee, detail: 0.005, textureDensity: 1 });
}

/**
 * The white Peter Pan collar: a band round the neck at the neckline of the tee, with two rounded
 * lobes that hang over the chest. The band sits at the neck, so the collar reads as a white collar
 * and not as a line on the chest.
 */
function lilyCollar(k: AssetContext) {
  // The band at the neckline: a flat ring round the neck.
  const band = sdf.torus(0.06, 0.013).scale([1, 0.6, 0.92]).at(0, 0.64, -0.004).bone('neck');
  // The two rounded lobes of the Peter Pan collar at the front. They meet in the middle and hang
  // over the chest.
  const lobe = (sx: number) =>
    sdf
      .ellipsoid([0.03, 0.008, 0.022])
      .rotate(0, 0, sx * 12)
      .at(sx * 0.026, 0.634, 0.042)
      .bone('neck');
  k.body('collar', sdf.smoothUnion(0.006, band, lobe(-1), lobe(1)), {
    color: C.collar,
    detail: 0.0028,
  });
}

/**
 * The red pleated skirt. Ten pleats run from the waist under the tee to the hem above the knee. The
 * pleats are a radial ripple of 9 mm, so they read as folds and not as a smooth cone. The ripple
 * starts below the hem of the tee, so the waist keeps a round edge. The ripple stops clear of the
 * hands, so the hands stay outside the skirt.
 */
function lilySkirt(k: AssetContext) {
  const skirtProfile: [number, number][] = [
    [0, 0.418],
    [0.055, 0.415],
    [0.072, 0.404],
    [0.079, 0.385],
    [0.085, 0.362],
    [0.094, 0.34],
    [0.104, 0.315],
    [0.118, 0.288],
    [0.134, 0.264],
    [0.143, 0.257],
    [0.132, 0.252],
    [0, 0.252],
  ];
  const skirt = sdf
    .revolve(profile.polygon(skirtProfile, { smooth: true }))
    .displace(
      0.009,
      (x, y, z) => {
        // The fold grows below the hem of the tee and keeps the full depth at the hem of the skirt.
        const fold = Math.max(0, Math.min(1, (0.402 - y) / 0.06));
        return Math.cos(Math.atan2(z, x) * 10) * fold;
      },
      // The ripple is steep, so the field needs the Lipschitz factor of the fold.
      1.8,
    )
    .bone('hips');
  k.body('skirt', skirt, { color: C.skirt, detail: 0.004 });
}

/** The white mid-calf socks over the lower legs. */
function lilySocks(k: AssetContext) {
  const sock = (sx: number) =>
    sdf
      .cone([sx * CHILD.kneeX, 0.195, 0.005], [sx * CHILD.ankleX, 0.045, 0.008], 0.034, 0.028)
      .bone(sx > 0 ? 'shin.L' : 'shin.R');
  k.body('socks', sock(-1).union(sock(1)), { color: C.sock, detail: 0.004 });
}

/**
 * The red sneakers over the feet, with a white toe cap, a pale sole, and two white lace bands over
 * the instep. The toe cap sits low at the front, so the red upper shows above it, and the lace
 * bands follow the shoe, so they read as laces.
 */
function lilySneakers(k: AssetContext) {
  const bone = (sx: number) => (sx > 0 ? 'foot.L' : 'foot.R');
  const shoe = (sx: number) =>
    sdf
      .ellipsoid([0.042, 0.036, 0.075])
      .at(sx * CHILD.ankleX, 0.034, 0.038)
      .bone(bone(sx));
  const toeCap = (sx: number) =>
    sdf
      .ellipsoid([0.033, 0.02, 0.028])
      .at(sx * CHILD.ankleX, 0.022, 0.09)
      .bone(bone(sx));
  k.body('sneakers', shoe(-1).union(shoe(1)), { color: C.shoe, detail: 0.004 });
  k.body('sneaker-toe', toeCap(-1).union(toeCap(1)), { color: C.sole, detail: 0.003 });
  const sole = (sx: number) =>
    sdf
      .box([0.076, 0.014, 0.14], 0.005)
      .at(sx * CHILD.ankleX, 0.007, 0.042)
      .bone(bone(sx));
  k.body('sneaker-sole', sole(-1).union(sole(1)), { color: C.sole, detail: 0.003 });
  // The laces: two bands that sit on the instep of the shoe and follow its curve.
  const lace = (sx: number, z: number) =>
    shoe(sx)
      .round(0.008)
      .intersect(sdf.box([0.3, 0.3, 0.016]).at(sx * CHILD.ankleX, 0.034, z))
      .bone(bone(sx));
  k.body('laces', lace(-1, 0.02).union(lace(1, 0.02)).union(lace(-1, 0.05)).union(lace(1, 0.05)), {
    color: C.sole,
    detail: 0.002,
  });
}

export default defineAsset({
  name: 'sprout-lily-kim',
  description:
    'Lily on the child base: a brown bob to the jaw with straight soft bangs, an open smile, a blue tee with a white Peter Pan collar, a red pleated skirt, white mid-calf socks, and red sneakers.',
  reference: 'docs/sprout-mockups/lily.jpg',
  detail: 0.004,
  texture: false,
  variants: {
    skin: { fair: '#f2c7a4', tan: '#d8a077', brown: '#a06a45' },
    hair: { brown: '#7a5230', dark: '#4a2e1c', blonde: '#b07f3a' },
    eyes: { brown: '#6e4020', hazel: '#8a6a2a', blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { blue: '#3f6fb5', red: '#c8352e', grey: '#8d8d93' },
  },
  presets: {
    lily: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'blue' },
  },
  build(k) {
    buildChild(k);
    lilyFace(k);
    lilyHair(k);
    lilyTee(k);
    lilyCollar(k);
    lilySkirt(k);
    lilySocks(k);
    lilySneakers(k);
  },
});
