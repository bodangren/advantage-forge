import { defineAsset, profile, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { buildKim, KIM } from './parts/humanoid-kim.js';

/**
 * Mom on the new Teacher Kim base. Identity from docs/sprout-mockups/mom.jpg: long brown waves,
 * a cream cable-knit sweater, blue jeans, brown flats, and small pearl studs. The proportions,
 * skeleton, face, open hands and idle clip come from `buildKim`. No cut-out and no sprite (AC6).
 */
const C = {
  sweater: '#f2e7d0',
  cable: '#cdbc9d',
  rib: '#ddcba9',
  jeans: '#41608c',
  denim: '#33507c',
  flats: '#7a4a2c',
  sole: '#4a2e1e',
  pearl: '#fbf7ee',
};

/**
 * Long waves whose mass covers the whole crown: a close shell over the skull, a crown volume, a
 * back mass, and two falling curtains. The face opening rises above the brow in the middle and
 * drops past the temples, so the hairline frames the face instead of leaving a bald crown.
 */
function momHair(k: AssetContext) {
  const cap = sdf.ellipsoid([0.174, 0.216, 0.152]).at(0, KIM.headY + 0.005, -0.012);
  const crown = sdf.ellipsoid([0.166, 0.142, 0.15]).at(0, 1.348, -0.03);
  // The mane tapers from the nape to the shoulder blades instead of ending as a ball.
  const fall = [
    sdf.ellipsoid([0.152, 0.11, 0.085]).at(0, 1.22, -0.06),
    sdf.ellipsoid([0.146, 0.12, 0.078]).at(0, 1.12, -0.07),
    sdf.ellipsoid([0.122, 0.1, 0.062]).at(0, 1.02, -0.075),
    sdf.ellipsoid([0.078, 0.062, 0.046]).at(0, 0.955, -0.08),
  ];
  // The face opening leaves the whole face bare: it reaches past the temples, so the measured
  // face keeps its width, and it rises above the brow at the centre.
  const faceOpen = sdf.ellipsoid([0.185, 0.17, 0.19]).at(0, 1.17, 0.09);
  // The curtains start below the eye line, outside the cheek, so they never narrow the face.
  const wave = (sx: number) =>
    sdf.chain(
      [
        [sx * 0.148, 1.15, -0.005, 0.036],
        [sx * 0.15, 1.06, 0.012, 0.039],
        [sx * 0.146, 0.98, 0.03, 0.032],
        [sx * 0.133, 0.92, 0.044, 0.022],
      ],
      0.03,
    );
  const hair = sdf.smoothUnion(
    0.024,
    sdf.smoothUnion(0.028, cap, crown, ...fall).subtract(faceOpen),
    wave(-1),
    wave(1),
  );
  k.body('hair', hair, { color: '#7a5230', detail: 0.006, textureDensity: 1 });
}

/** The knit sweater: a fitted body with a waist, long sleeves, collar, cuffs and ribbed hem. */
function momSweater(k: AssetContext) {
  const sweaterProfile: [number, number][] = [
    [0, 1.02],
    [0.055, 1.016],
    [0.101, 1.0],
    [0.133, 0.972],
    [0.148, 0.93],
    [0.15, 0.9],
    [0.137, 0.85],
    [0.117, 0.806],
    [0.104, 0.778],
    [0.107, 0.748],
    [0.12, 0.705],
    [0.137, 0.668],
    [0.147, 0.645],
    [0.145, 0.63],
    [0, 0.63],
  ];
  const bodyShape = sdf
    .revolve(profile.polygon(sweaterProfile, { smooth: true }))
    .scale([1, 1, 0.78])
    .bone('chest');
  const shoulder = (sx: number) =>
    sdf
      .ellipsoid([0.072, 0.076, 0.058])
      .at(sx * 0.126, 0.99, 0)
      .bone('chest');
  const sleeve = (sx: number) =>
    sdf
      .smoothUnion(
        0.022,
        sdf.cone([sx * 0.132, 0.988, 0], [sx * 0.152, KIM.elbowY, 0.006], 0.062, 0.05),
        sdf.cone([sx * 0.152, KIM.elbowY, 0.006], [sx * 0.17, 0.641, 0.014], 0.05, 0.039),
      )
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  const collar = sdf
    .torus(0.062, 0.013)
    .scale([1, 1, 0.85])
    .at(0, KIM.neck1 + 0.028, -0.006)
    .bone('neck');
  const hem = sdf.torus(0.144, 0.009).scale([1, 1, 0.78]).at(0, 0.634, 0).bone('chest');
  const cuff = (sx: number) =>
    sdf
      .torus(0.038, 0.008)
      .at(sx * 0.17, 0.646, 0.014)
      .bone(sx > 0 ? 'forearm.L' : 'forearm.R');
  k.body(
    'sweater',
    sdf.union(bodyShape, shoulder(-1), shoulder(1), sleeve(-1), sleeve(1), collar, hem, cuff(-1), cuff(1)),
    {
      color: '#f2e7d0',
      detail: 0.006,
    },
  );
}

/** Jeans over the seat, hips, thighs and shins: a high seat, then slim legs to the ankle. */
function momJeans(k: AssetContext) {
  const seatProfile: [number, number][] = [
    [0, 0.7],
    [0.07, 0.694],
    [0.11, 0.678],
    [0.13, 0.652],
    [0.141, 0.612],
    [0.143, 0.585],
    [0.137, 0.552],
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
        sdf.cone([sx * KIM.hipX, KIM.hipY + 0.06, 0], [sx * KIM.kneeX, KIM.kneeY, 0], 0.07, 0.05),
        sdf.cone([sx * KIM.kneeX, KIM.kneeY, 0], [sx * KIM.ankleX, 0.075, 0.01], 0.05, 0.035),
      )
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  const cuff = (sx: number) =>
    sdf
      .torus(0.038, 0.007)
      .at(sx * KIM.ankleX, 0.078, 0.01)
      .bone(sx > 0 ? 'shin.L' : 'shin.R');
  k.body('jeans', sdf.union(seat, leg(-1), leg(1), cuff(-1), cuff(1)), { color: '#41608c', detail: 0.006 });
}

function momShoes(k: AssetContext) {
  const shoe = (sx: number) =>
    sdf
      .union(
        sdf.ellipsoid([0.05, 0.036, 0.088]).at(sx * KIM.ankleX, 0.031, 0.042),
        sdf.box([0.094, 0.012, 0.16], 0.005).at(sx * KIM.ankleX, 0.008, 0.035),
      )
      .bone(sx > 0 ? 'foot.L' : 'foot.R');
  k.body('flats', sdf.union(shoe(-1), shoe(1)), { color: '#7a4a2c', detail: 0.005 });
  const stud = (sx: number) =>
    sdf
      .sphere(0.0075)
      .at(sx * 0.145, 1.2, 0.03)
      .bone('head');
  k.body('studs', sdf.union(stud(-1), stud(1)), { color: '#fbf7ee', detail: 0.003 });
}

export default defineAsset({
  name: 'sprout-mom-kim',
  description:
    'Mom on the Teacher Kim adult base: long brown waves, a cream knit sweater, blue jeans, brown flats, pearl studs, open hands with palms toward the legs.',
  reference: 'docs/sprout-mockups/mom.jpg',
  detail: 0.005,
  texture: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e' },
    hair: { brown: '#7a5230', dark: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { cream: '#f2e7d0', sand: '#e8d5b5', rose: '#e8b8a8', sage: '#b5c4a8' },
  },
  presets: {
    mom: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'cream' },
  },
  build(k) {
    buildKim(k);
    momHair(k);
    momSweater(k);
    momJeans(k);
    momShoes(k);
  },
});
