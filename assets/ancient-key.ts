import { defineAsset, sdf } from '../src/index.js';

/*
 * Design note — items/quest-and-treasure/key-iron (Chibi Quest quest key).
 *
 * Role: quest pickup and door key, seen as a 128 px icon lying in the world and held in a
 *   chibi hand, so it reads as a bold flat silhouette from above.
 * Size: 0.24 m long, 0.09 m across the bow, about 0.034 m thick; lying flat on y = 0,
 *   the ring bow toward -X and the toothed bit toward +X.
 * One idea: a chunky ring bow with a big open hole on one end and a blocky two-tooth bit on
 *   the other, joined by a short collared shaft. The hole and the two teeth are the read.
 * Shape language: round dominant (bow ring, round shaft, disc collars) with square secondary
 *   (the rectangular bit and its two teeth), every edge softly beveled.
 * Palette (60/30/10): worn iron #4a4f55 dominant; shadow #363a3f in the low recesses and
 *   underside; highlight #a8acb1 worn onto the top edges and the collar rims.
 * Materials: one body, iron — roughness 0.5, metalness 0.7, pitting in the normal-map bump.
 * Detail: primary bow ring, shaft, and bit (big); two collars (medium); worn paint and pit
 *   texture (small). Focal point: the bright collar rims against the dark ring hole.
 * Rig/animation: none (static pickup).
 */

const BRONZE = '#7a8a5a';
const TOP = '#a8b088';
const UNDER = '#3f4a2e';
const AXIS_Y = 0.017;
const BOW_X = -0.078;

export default defineAsset({
  name: 'ancient-key',
  description:
    'Old iron quest key lying flat: a chunky ring bow with an open hole, a short round shaft with two collars, and a blocky two-tooth bit; about 0.24 m.',
  detail: 0.004,
  reference: 'docs/item-mockups/ancient-key-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Chunky ring bow lying in the XZ plane so the hole shows from above.
    const ring = sdf.torus(0.034, 0.013).at(BOW_X, AXIS_Y, 0);
    // Three grip ridges across the ring at -X.
    const ridges = sdf.union(
      ...[-0.006, 0, 0.006].map((dz) =>
        sdf.box([0.006, 0.032, 0.014], 0.002).at(BOW_X - 0.034, AXIS_Y, dz * 2.2),
      ),
    );
    const collarBlock = sdf.box([0.03, 0.03, 0.03], 0.006).at(-0.036, AXIS_Y, 0);
    const shaft = sdf.capsule([-0.04, AXIS_Y, 0], [0.09, AXIS_Y, 0], 0.014);
    // Bit: three teeth 0.016 tall, 0.014 wide, spaced 0.008, plus a shorter block behind.
    const teeth = sdf.union(
      ...[0.058, 0.080, 0.102].map((x) => sdf.box([0.014, 0.016, 0.03], 0.003).at(x, 0.008 + 0.0, 0.026)),
      sdf.box([0.014, 0.014, 0.018], 0.003).at(0.069, 0.008, -0.022),
    );
    const bitBase = sdf.box([0.06, 0.016, 0.03], 0.004).at(0.08, 0.008, 0.008);

    const key = sdf
      .union(ring, ridges, collarBlock, shaft, bitBase, teeth)
      .round(0.001)
      .paintWhere(sdf.box([0.4, 0.1, 0.4]).at(0, 0.03 + 0.05, 0), TOP, 0.012)
      .paintWhere(sdf.box([0.4, 0.02, 0.4]).at(0, 0, 0), UNDER, 0.006)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('key', key, {
      color: BRONZE,
      roughness: 0.55,
      metalness: 0.7,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 3000,
    });
    k.body('gem', sdf.ellipsoid([0.02, 0.016, 0.02]).at(BOW_X, AXIS_Y, 0), {
      color: '#0c3a34',
      roughness: 0.3,
      metalness: 0,
      emissive: '#3fe0c0',
      emissiveIntensity: 1.5,
      detail: 0.003,
      maxTriangles: 800,
    });
  },
});
