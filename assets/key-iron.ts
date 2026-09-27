import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

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

const IRON = '#4a4f55';
const IRON_SHADOW = '#363a3f';
const IRON_HIGHLIGHT = '#a8acb1';

// The key lies flat; AXIS_Y is the shaft centreline. The widest collars set the rest height.
const AXIS_Y = 0.017;
const BOW_X = -0.074; // ring bow centre, toward -X
const RING_R = 0.030; // ring mean radius
const RING_T = 0.014; // ring tube radius

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'key-iron',
  description:
    'Old iron quest key lying flat: a chunky ring bow with an open hole, a short round shaft with two collars, and a blocky two-tooth bit; about 0.24 m.',
  detail: 0.004,
  reference: 'docs/item-mockups/key-iron-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bow ring
    // A thick torus lying in the ground plane: the hole is the strongest read from above.
    const bow = sdf.torus(RING_R, RING_T).at(BOW_X, AXIS_Y, 0);

    // ------------------------------------------------------------------ shaft
    // Short round shaft from inside the bow to the bit; overlaps both so the union is solid.
    const shaft = sdf.capsule([-0.050, AXIS_Y, 0], [0.060, AXIS_Y, 0], 0.013);

    // ------------------------------------------------------------------ collars
    // Two chunky disc collars threaded on the shaft: one before the bit, one behind the bow.
    const collarShape = (x: number): sdf.Shape =>
      sdf.cylinder(0.017, 0.013, 0.005).rotateZ(90).at(x, AXIS_Y, 0);
    const collars = sdf.union(collarShape(-0.032), collarShape(0.050));

    // ------------------------------------------------------------------ bit
    // A rectangular base at the shaft end with two beveled teeth reaching toward +Z.
    const bitBase = sdf.box([0.055, 0.024, 0.020], 0.006).at(0.088, 0.015, 0.006);
    const toothTip = sdf.box([0.018, 0.022, 0.026], 0.005).at(0.104, 0.015, 0.024);
    const toothNear = sdf.box([0.020, 0.022, 0.020], 0.005).at(0.070, 0.015, 0.021);
    const bit = bitBase.smoothUnion(0.005, toothTip).smoothUnion(0.005, toothNear);

    // ------------------------------------------------------------------ paint
    // Value plan: dark iron low and under, base iron mid, worn highlight gathering on the
    // up-facing tops and the outer edges; small noise speckle reads as age.
    const ironPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 13, y * 13, z * 13, 3, 5);
      const speck = 0.5 + 0.5 * noise.fbm(x * 46, y * 46, z * 46, 2, 9);

      // Underside and low recesses sink into shadow.
      let c = mixRgb(base, rgb(IRON_SHADOW), clamp01((0.020 - y) / 0.020) * 0.75);

      // Worn highlight gathers on the up-facing tops, broken by patches.
      const up = clamp01((y - 0.017) / 0.017);
      c = mixRgb(c, rgb(IRON_HIGHLIGHT), up * (0.22 + 0.5 * patch));

      // Bright speckled wear like rubbed edges.
      c = mixRgb(c, rgb(IRON_HIGHLIGHT), clamp01((speck - 0.66) * 2.6) * 0.45);

      return c;
    };

    const key = sdf
      .union(bow, shaft, collars, bit)
      .round(0.0015)
      .paintFn(ironPaint)
      // Keep the wide collar rims and the bit teeth bright so the read survives at 128 px.
      .paintWhere(sdf.cylinder(0.020, 0.05, 0.01).rotateZ(90).at(-0.032, AXIS_Y, 0), IRON_HIGHLIGHT, 0.006)
      .paintWhere(sdf.cylinder(0.020, 0.05, 0.01).rotateZ(90).at(0.050, AXIS_Y, 0), IRON_HIGHLIGHT, 0.006)
      // Clean flat base where the key meets the ground.
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('key', key, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 2800,
      // Light pitting and casting grain; tiny amplitude, metal amplifies relief.
      bump: (x, y, z) =>
        0.0006 * noise.fbm(x * 70, y * 70, z * 70, 3, 7) +
        0.0003 * noise.noise3(x * 150, y * 150, z * 150, 4),
    });
  },
});
