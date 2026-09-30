import { defineAsset, profile, sdf } from '../src/index.js';

/*
 * Design note - key-bronze (Chibi Quest quest key).
 * Role: pickup icon lying flat, read at 128 px. Size 0.24 m long, 0.09 m across the bow,
 *   flat on y = 0, bow toward -X, bit toward +X.
 * One idea: Bronze key: round bow with a heart-shaped hole and one wide tooth.
 * Shape language: round bow and shaft, square bit, soft bevels.
 * Palette: #b5763a dominant, #7a4a1e shadow on the underside only.
 * Materials: one body, roughness 0.45, metalness 0.9.
 */
const AXIS_Y = 0.017;
const BOW_X = -0.074;

export default defineAsset({
  name: 'key-bronze',
  description: 'Bronze key: round bow with a heart-shaped hole and one wide tooth.',
  detail: 0.004,
  reference: 'docs/item-mockups/key-bronze-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const disc = sdf.cylinder(0.04, 0.02, 0.006).at(-0.084, 0.010, 0);
    // Heart profile (x = width, y = height), lobes at +y, point at -y. rotateX(90) lays it flat
    // (profile y -> world z); rotateY(-90) turns the point toward +X (the shaft), lobes toward -X.
    const heart = profile.polygon(
      [
        [0, -0.025], [0.011, -0.012], [0.02, 0.002], [0.0195, 0.011], [0.0115, 0.0165], [0.005, 0.0125],
        [0, 0.005], [-0.005, 0.0125], [-0.0115, 0.0165], [-0.0195, 0.011], [-0.02, 0.002], [-0.011, -0.012],
      ],
      { smooth: true },
    );
    const hole = sdf.extrude(heart, 0.1).rotateX(90).rotateY(-90).scale(1.1).at(-0.086, 0.01, 0);
    const bow = disc.smoothUnion(0.006, sdf.sphere(0.013).at(-0.052, 0.014, 0)).smoothSubtract(0.002, hole);
    const shaft = sdf.capsule([-0.050, AXIS_Y, 0], [0.060, AXIS_Y, 0], 0.013);
    const collarShape = (x: number): sdf.Shape =>
      sdf.cylinder(0.017, 0.013, 0.005).rotateZ(90).at(x, AXIS_Y, 0);
    const collars = sdf.union(collarShape(-0.032), collarShape(0.050));
    const bitBase = sdf.box([0.055, 0.024, 0.020], 0.006).at(0.088, 0.015, 0.006);
    const wide = sdf.box([0.022, 0.020, 0.026], 0.004).at(0.092, 0.015, 0.022);
    const bit = bitBase.smoothUnion(0.005, wide);
    const key = sdf
      .union(bow, shaft, collars, bit)
      .round(0.0015)
      .paintWhere(sdf.box([0.4, 0.008, 0.4]).at(0, 0.0, 0), '#7a4a1e', 0.006)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('key', key, {
      color: '#b5763a',
      roughness: 0.45,
      metalness: 0.9,
      detail: 0.004,
      textureDensity: 2,
      maxTriangles: 2800,
    });
  },
});
