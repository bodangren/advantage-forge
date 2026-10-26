import { defineAsset, profile, sdf } from '../src/index.js';

/**
 * Design note — Storytime nurse cap, a small picture prop without a person.
 * Role: a white nurse's cap for the nurse's things page, readable at book-page size.
 * Size: about 0.16 m wide, 0.07 m tall, and 0.09 m deep, on y = 0 and facing +Z.
 * One idea: a soft folded white cap with one clear green medical cross.
 * Shape language: a low rounded trapezoid with a broad folded cuff.
 * Palette: warm white #f7f5ee, fold shadow #dedfd9, green cross #4f9c78.
 * Materials: rough white cloth, a slightly darker cloth fold, matte green embroidery.
 * Detail: one folded crown, one bottom cuff, one simple green cross.
 * Rig/animation: none.
 */

export default defineAsset({
  name: 'storytime-nurse-cap',
  description: "A small soft white nurse's cap with a folded cuff and a green medical cross.",
  detail: 0.0015,
  texture: { size: 512 },

  build(k) {
    const outline = profile.polygon(
      [
        [-0.08, 0.004],
        [-0.076, 0.022],
        [-0.061, 0.049],
        [-0.038, 0.067],
        [0, 0.071],
        [0.038, 0.067],
        [0.061, 0.049],
        [0.076, 0.022],
        [0.08, 0.004],
        [0, 0],
      ],
      { smooth: true },
    );
    const cap = sdf.extrude(outline, 0.088, 0.005);
    k.body('white-cloth', cap, {
      color: '#f7f5ee',
      roughness: 0.92,
      detail: 0.0014,
      bump: (x, y, z) => 0.00012 * Math.sin(x * 900) * Math.sin(y * 700 + z * 200),
      maxTriangles: 6500,
    });

    const cuff = cap
      .round(0.0025)
      .subtract(cap.round(-0.002))
      .intersect(sdf.box([0.19, 0.018, 0.12]).at(0, 0.009, 0));
    k.body('folded-cuff', cuff, {
      color: '#e5e6df',
      roughness: 0.94,
      detail: 0.0012,
      maxTriangles: 3500,
    });

    const crossOutline = profile.polygon([
      [-0.004, 0.014],
      [0.004, 0.014],
      [0.004, 0.006],
      [0.012, 0.006],
      [0.012, -0.002],
      [0.004, -0.002],
      [0.004, -0.01],
      [-0.004, -0.01],
      [-0.004, -0.002],
      [-0.012, -0.002],
      [-0.012, 0.006],
      [-0.004, 0.006],
    ]);
    const cross = sdf.extrude(crossOutline, 0.003, 0.001).at(0, 0.039, 0.044);
    k.body('green-cross', cross, {
      color: '#4f9c78',
      roughness: 0.86,
      detail: 0.0009,
      maxTriangles: 1200,
    });
  },
});
