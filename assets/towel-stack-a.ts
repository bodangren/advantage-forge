import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — folded bath towel stack (trial arm 1, towel-stack-a).
 *
 * Role: background shelf prop for the Chibi Quest bathhouse; reads at 128 px.
 * Size: 0.30 m wide (X), 0.24 m deep (Z), 0.215 m tall (Y). Stands on y = 0,
 *   centred on the Y axis, faces +Z, and fits a 0.3 m deep shelf board.
 * One idea: three soft folded towels in a slightly leaning stack, with a rolled
 *   lip at the front edge of the base towel and one terracotta corner folded
 *   over the side. The big cream mass, mid teal mass, and small terracotta
 *   accent must stay apart as three value bands.
 * Shape language: round (soft rounded slabs and rolled folds), with one
 *   square-ish accent (the folded corner) that breaks the silhouette.
 * Palette: linen cream #efe6d2 / shade #d8ccb2 (light), teal #4f8f8a / shade
 *   #3d6f6b (mid), terracotta #b5654a / shade #8e4a36 (accent), stitch #f3ead8.
 * Materials: one cloth material class, roughness 0.9, metalness 0, on three
 *   bodies so the three colors read as three separate value masses. Seams,
 *   stitch band and fold shade are paint; weave lives in bump.
 * Detail list: primary three folded slabs; secondary two rolled folds at the
 *   front base edge and the overhanging folded corner; tertiary stitched band,
 *   two seam lines, soft central dents, and wrinkle displace at 2 mm.
 * Rig/animation: none (static prop).
 */

const CREAM = rgb('#efe6d2');
const CREAM_SHADE = rgb('#d8ccb2');
const TEAL = rgb('#4f8f8a');
const TEAL_SHADE = rgb('#3d6f6b');
const TERRA = rgb('#b5654a');
const TERRA_SHADE = rgb('#8e4a36');
const STITCH = rgb('#f3ead8');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Soft band, 1 at the centre and 0 outside the half width. */
const band = (v: number, centre: number, half: number): number =>
  clamp01((half - Math.abs(v - centre)) / (half * 0.4));

const cloth = {
  roughness: 0.9,
  metalness: 0,
  textureDensity: 2,
  paintWeight: 2,
} as const;

/** Fine cloth weave: bump only, never displacement. */
const weaveBump = (x: number, y: number, z: number): number =>
  0.0008 * noise.fbm(x * 88, y * 88, z * 88, 2);

/** Long, low-frequency cloth wrinkle. Amplitude is capped at 2 mm. */
const wrinkle = (x: number, y: number, z: number): number =>
  noise.fbm(x * 14, y * 10, z * 14, 2);

const creamPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
  let c = mixRgb(CREAM_SHADE, CREAM, 0.5 + 0.4 * n);
  c = mixRgb(c, CREAM_SHADE, 0.55 * clamp01((0.032 - y) / 0.032)); // shaded base
  const g = 0.5 + 0.5 * noise.fbm(x * 56, y * 56, z * 56, 2);
  return mixRgb(c, CREAM, 0.08 * g);
};

const tealPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
  let c = mixRgb(TEAL_SHADE, TEAL, 0.45 + 0.45 * n);
  c = mixRgb(c, TEAL_SHADE, 0.4 * clamp01((0.09 - y) / 0.05)); // contact shade
  const seam = Math.max(band(z, -0.045, 0.006), band(z, 0.045, 0.006));
  return mixRgb(c, TEAL_SHADE, 0.65 * seam); // two stitched seam lines
};

const terraPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
  let c = mixRgb(TERRA_SHADE, TERRA, 0.5 + 0.4 * n);
  c = mixRgb(c, TERRA_SHADE, 0.42 * clamp01((0.16 - y) / 0.04)); // contact shade
  // A pale stitched band near one side, with a dashed thread running down it.
  const stripe = band(x, -0.062, 0.013);
  const dash = Math.sin(y * 320) > 0 ? 1 : 0;
  return mixRgb(c, STITCH, stripe * (0.4 + 0.5 * dash));
};

export default defineAsset({
  name: 'towel-stack-a',
  description:
    'Three folded bath towels stacked with a slight lean: a cream base with two rolled front folds, a teal middle, and a small terracotta top with one folded corner over the edge.',
  detail: 0.011,
  reference: 'docs/bathhouse-mockups/towel-stack-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------- bottom · cream
    // Largest slab, flat on y = 0. Two rolled lips along the front (+Z) edge
    // break the box silhouette and say "folded cloth" at sprite size.
    const baseSlab = sdf.box([0.3, 0.085, 0.24], 0.013);
    const rollA = sdf.capsule([-0.137, 0.092, 0.099], [0.137, 0.092, 0.099], 0.018);
    const rollB = sdf.capsule([-0.13, 0.089, 0.058], [0.13, 0.089, 0.058], 0.015);
    const dentBase = sdf.ellipsoid([0.085, 0.03, 0.07]).at(0, 0.062, -0.01);
    const base = sdf
      .smoothUnion(0.012, baseSlab, rollA, rollB)
      .displace(0.002, wrinkle)
      .subtract(dentBase)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(creamPaint);
    k.body('towel-cream', base, {
      ...cloth,
      color: '#efe6d2',
      detail: 0.009,
      maxError: 0.0025,
      maxTriangles: 2400,
      bump: weaveBump,
    });

    // ---------------------------------------------------------- middle · teal
    // A little narrower, turned 8 degrees against the base and leaning 2
    // degrees. A shallow dish on top is the pressed dent in the stack.
    const midSlab = sdf.box([0.265, 0.07, 0.215], 0.012);
    const midRollA = sdf.capsule([-0.12, 0.028, 0.082], [0.12, 0.028, 0.082], 0.015);
    const midRollB = sdf.capsule([-0.115, 0.026, 0.045], [0.115, 0.026, 0.045], 0.012);
    const dentMid = sdf.ellipsoid([0.08, 0.03, 0.065]).at(0, 0.055, 0);
    const middle = sdf
      .smoothUnion(0.011, midSlab, midRollA, midRollB)
      .displace(0.002, wrinkle)
      .subtract(dentMid)
      .rotateY(8)
      .rotateZ(2)
      .at(0.006, 0.12, -0.004)
      .paintFn(tealPaint);
    k.body('towel-teal', middle, {
      ...cloth,
      color: '#4f8f8a',
      detail: 0.011,
      maxError: 0.003,
      maxTriangles: 1700,
      bump: weaveBump,
    });

    // ------------------------------------------------------- top · terracotta
    // Smallest towel, turned the other way. A rounded box at the right-front
    // tilts down over the stack edge as the outline-breaking folded corner.
    const topSlab = sdf.box([0.225, 0.06, 0.18], 0.011);
    const topRoll = sdf.capsule([-0.1, 0.024, 0.069], [0.1, 0.024, 0.069], 0.013);
    const corner = sdf
      .box([0.1, 0.014, 0.078], 0.006)
      .rotateZ(-9)
      .at(0.098, 0.007, 0.068);
    const dentTop = sdf.ellipsoid([0.065, 0.028, 0.05]).at(0, 0.05, 0);
    const top = sdf
      .smoothUnion(0.009, topSlab, topRoll, corner)
      .displace(0.0018, wrinkle)
      .subtract(dentTop)
      .rotateY(-8)
      .rotateZ(-3)
      .at(-0.008, 0.185, 0.006)
      .paintFn(terraPaint);
    k.body('towel-terracotta', top, {
      ...cloth,
      color: '#b5654a',
      detail: 0.009,
      maxError: 0.0025,
      maxTriangles: 1800,
      bump: weaveBump,
    });
  },
});
