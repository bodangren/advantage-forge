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

/** Long waves: a close cap at the eye line (the head-width band) and falling curtains below it. */
function momHair(k: AssetContext) {
  const cap = sdf.ellipsoid([0.15, 0.21, 0.152]).at(0, KIM.headY + 0.004, -0.012);
  const faceOpen = sdf
    .ellipsoid([0.146, 0.12, 0.2])
    .at(0, 1.235, 0.12)
    .intersect(sdf.halfSpace([0, 1, 0], 1.355));
  const shell = cap.subtract(faceOpen);
  const wave = (sx: number) =>
    sdf.chain(
      [
        [sx * 0.13, 1.24, -0.02, 0.035],
        [sx * 0.135, 1.12, -0.01, 0.038],
        [sx * 0.14, 0.99, 0.012, 0.032],
        [sx * 0.135, 0.9, 0.03, 0.026],
      ],
      0.03,
    );
  const back = sdf.ellipsoid([0.14, 0.19, 0.09]).at(0, 1.12, -0.13);
  const hair = sdf.smoothUnion(0.026, shell, wave(-1), wave(1), back);
  k.body('hair', hair, { color: '#7a5230', detail: 0.006, textureDensity: 1 });
}

/** The knit sweater: body, long sleeves, collar, cuffs and hem. */
function momSweater(k: AssetContext) {
  const sweaterProfile: [number, number][] = [
    [0, 1.025],
    [0.075, 1.02],
    [0.132, 1.0],
    [0.155, 0.96],
    [0.158, 0.89],
    [0.148, 0.79],
    [0.14, 0.71],
    [0.15, 0.63],
    [0.152, 0.595],
    [0, 0.595],
  ];
  let bodyShape = sdf.revolve(profile.polygon(sweaterProfile, { smooth: true })).bone('chest');
  // A few shallow ribs give the knit its repeated form without changing the silhouette rows.
  for (let i = 0; i < 7; i++) {
    const y = 0.625 + i * 0.052;
    bodyShape = bodyShape.smoothUnion(0.004, sdf.torus(0.142, 0.004).at(0, y, 0).bone('chest'));
  }
  const sleeve = (sx: number) =>
    sdf
      .smoothUnion(
        0.02,
        sdf.cone(
          [sx * KIM.shoulderX, KIM.shoulderY + 0.02, 0],
          [sx * KIM.elbowX, KIM.elbowY, 0.006],
          0.064,
          0.05,
        ),
        sdf.cone(
          [sx * KIM.elbowX, KIM.elbowY, 0.006],
          [sx * KIM.wristX, KIM.wristY + 0.02, 0.015],
          0.05,
          0.04,
        ),
      )
      .bone(sx > 0 ? 'upperarm.L' : 'upperarm.R');
  const collar = sdf
    .torus(0.066, 0.014)
    .at(0, KIM.neck1 + 0.03, -0.006)
    .bone('neck');
  const hem = sdf.torus(0.15, 0.01).at(0, 0.605, 0).bone('chest');
  k.body('sweater', sdf.union(bodyShape, sleeve(-1), sleeve(1), collar, hem), {
    color: '#f2e7d0',
    detail: 0.006,
  });
}

/** Jeans over the hips, thighs and shins. */
function momJeans(k: AssetContext) {
  const hips = sdf.ellipsoid([0.146, 0.1, 0.11]).at(0, 0.58, -0.004).bone('hips');
  const leg = (sx: number) =>
    sdf
      .smoothUnion(
        0.02,
        sdf.cone([sx * KIM.hipX, KIM.hipY + 0.04, 0], [sx * KIM.kneeX, KIM.kneeY, 0], 0.066, 0.052),
        sdf.cone([sx * KIM.kneeX, KIM.kneeY, 0], [sx * KIM.ankleX, 0.075, 0.01], 0.052, 0.038),
      )
      .bone(sx > 0 ? 'leg.L' : 'leg.R');
  const cuff = (sx: number) =>
    sdf
      .torus(0.04, 0.007)
      .at(sx * KIM.ankleX, 0.078, 0.01)
      .bone(sx > 0 ? 'shin.L' : 'shin.R');
  k.body('jeans', sdf.union(hips, leg(-1), leg(1), cuff(-1), cuff(1)), { color: '#41608c', detail: 0.006 });
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
      .sphere(0.008)
      .at(sx * 0.152, 1.245, 0.012)
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
