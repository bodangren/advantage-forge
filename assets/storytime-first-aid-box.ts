import { defineAsset, profile, sdf } from '../src/index.js';

/**
 * Design note — Storytime first-aid bag, a small picture prop without a person.
 * Role: a first-aid container for the nurse's things page, readable at book-page size.
 * Size: about 0.22 m wide and 0.20 m tall including the handle, on y = 0 and facing +Z.
 * One idea: a soft mint-green bag with one large white medical cross.
 * Shape language: rounded rectangular body, soft arch handle, bold simple cross.
 * Palette: mint #78bfa3, dark mint #4d8f79, warm white #fbfaf4, cream handle #f1e7d0.
 * Materials: rough cloth bag, cloth handle, smooth white cross emblem.
 * Detail: one soft bag body, one attached arch handle, one zipper, one white cross.
 * Rig/animation: none.
 */

export default defineAsset({
  name: 'storytime-first-aid-box',
  description: 'A small soft mint-green first-aid bag with a cream handle and a large white cross.',
  detail: 0.002,
  texture: { size: 512 },

  build(k) {
    const bag = sdf.box([0.22, 0.14, 0.1], 0.022).at(0, 0.07, 0);
    k.body('mint-bag', bag, {
      color: '#78bfa3',
      roughness: 0.86,
      detail: 0.0018,
      bump: (x, y, z) => 0.00015 * Math.sin(x * 650) * Math.sin(y * 650 + z * 100),
      maxTriangles: 4500,
    });

    const handle = sdf.chain(
      [
        [-0.055, 0.13, 0, 0.009],
        [-0.052, 0.163, 0, 0.009],
        [-0.032, 0.183, 0, 0.009],
        [0, 0.189, 0, 0.009],
        [0.032, 0.183, 0, 0.009],
        [0.052, 0.163, 0, 0.009],
        [0.055, 0.13, 0, 0.009],
      ],
      0.004,
    );
    k.body('cream-handle', handle, {
      color: '#f1e7d0',
      roughness: 0.84,
      detail: 0.0015,
      maxTriangles: 3500,
    });

    const zipper = sdf.union(
      sdf.capsule([-0.073, 0.122, 0.049], [0.073, 0.122, 0.049], 0.0025),
      sdf.box([0.012, 0.018, 0.006], 0.002).at(0.061, 0.114, 0.053),
    );
    k.body('zipper', zipper, {
      color: '#4d8f79',
      roughness: 0.72,
      detail: 0.0012,
      maxTriangles: 1500,
    });

    const crossOutline = profile.polygon([
      [-0.01, 0.033],
      [0.01, 0.033],
      [0.01, 0.01],
      [0.033, 0.01],
      [0.033, -0.01],
      [0.01, -0.01],
      [0.01, -0.033],
      [-0.01, -0.033],
      [-0.01, -0.01],
      [-0.033, -0.01],
      [-0.033, 0.01],
      [-0.01, 0.01],
    ]);
    const cross = sdf.extrude(crossOutline, 0.004, 0.002).at(0, 0.066, 0.051);
    k.body('white-cross', cross, {
      color: '#fbfaf4',
      roughness: 0.7,
      detail: 0.0012,
      maxTriangles: 1200,
    });
  },
});
