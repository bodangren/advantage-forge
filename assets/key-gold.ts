import { defineAsset, sdf } from '../src/index.js';

/*
 * Design note - key-gold (Chibi Quest quest key).
 * Role: pickup icon lying flat, read at 128 px. Size 0.24 m long, 0.09 m across the bow,
 *   flat on y = 0, bow toward -X, bit toward +X.
 * One idea: Polished gold key: trefoil bow of three small rings and a three-tooth bit.
 * Shape language: round bow and shaft, square bit, soft bevels.
 * Palette: #f2c14e dominant, #a06b1c shadow on the underside only.
 * Materials: one body, roughness 0.3, metalness 1.
 */
const AXIS_Y = 0.017;
const BOW_X = -0.074;

export default defineAsset({
  name: 'key-gold',
  description: 'Polished gold key: trefoil bow of three small rings and a three-tooth bit.',
  detail: 0.004,
  reference: 'docs/item-mockups/key-gold-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const ring = (z: number): sdf.Shape => sdf.torus(0.024, 0.008).at(-0.082, 0.012, z);
    const bow = sdf.union(ring(0.022), ring(-0.022)).smoothUnion(0.006, sdf.sphere(0.013).at(-0.052, 0.014, 0));
    const shaft = sdf.capsule([-0.050, AXIS_Y, 0], [0.060, AXIS_Y, 0], 0.013);
    const collarShape = (x: number): sdf.Shape =>
      sdf.cylinder(0.017, 0.013, 0.005).rotateZ(90).at(x, AXIS_Y, 0);
    const collars = sdf.union(collarShape(-0.032), collarShape(0.050));
    const bitBase = sdf.box([0.055, 0.024, 0.020], 0.006).at(0.088, 0.015, 0.006);
    const tooth = (x: number): sdf.Shape => sdf.box([0.012, 0.018, 0.026], 0.003).at(x, 0.015, 0.022);
    const bit = sdf.union(bitBase, tooth(0.068), tooth(0.088), tooth(0.108));
    const key = sdf
      .union(bow, shaft, collars, bit)
      .round(0.0015)
      .paintWhere(sdf.box([0.4, 0.008, 0.4]).at(0, 0.0, 0), '#a06b1c', 0.006)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('key', key, {
      color: '#f2c14e',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      textureDensity: 2,
      maxTriangles: 2800,
    });
  },
});
