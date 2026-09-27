import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Design note — flat woven rug (props/furniture/rug).
 *
 * Role: warm tavern floor dressing under tables and benches; must read as "cozy rug" at
 *   128 px from the top-down and three-quarter cameras.
 * Size: 1.6 m (X) x 1.0 m (Z), 0.022 m thick, lying on y = 0, long axis along X, fringe
 *   on the two short ends.
 * One idea: a chunky hand-woven rug — a deep red field inside a wide cream border with a
 *   dark guard line, one puffy diamond medallion at the heart, a loose ring of small cream
 *   diamonds, and fat wool tassels splayed off both short ends.
 * Shape language: round dominant (rounded slab corners, puffy medallion, plump tassels),
 *   square secondary (the rectangular border band).
 * Palette: deep red field #9a4a3a (dominant), warm cream border #e6d7b4 (secondary), dark
 *   maroon guard line #63302a (accent), lighter red medallion #b06050, cream tassels.
 * Materials: one wool-cloth body per part (rug, medallion, tassels), roughness 0.9,
 *   metalness 0. The pattern is paint only; the weave and wool live in `bump`.
 * Detail list: primary slab + medallion (focal); secondary border band, guard line, motif
 *   diamonds; tertiary weave bump and wool noise. No rig, no animation (static prop).
 */

const FIELD = rgb('#9a4a3a');
const FIELD_DARK = rgb('#7c3a2e');
const CREAM = rgb('#e6d7b4');
const CREAM_DARK = rgb('#c9b491');
const GUARD = rgb('#63302a');
const MED = rgb('#b06050');
const MED_DARK = rgb('#8f4a3c');

const HALF_W = 0.8; // half length along X
const HALF_D = 0.5; // half depth along Z
const CORNER = 0.117; // rounded slab corner radius (rect radius 0.115 + round 0.002)
const BORDER = 0.145; // cream border band width from the edge
const GUARD_W = 0.017; // dark guard line width

/** Distance from the rug edge in meters, positive inward, corners rounded like the slab. */
const edgeDist = (x: number, z: number) => {
  const qx = Math.abs(x) - (HALF_W - CORNER);
  const qz = Math.abs(z) - (HALF_D - CORNER);
  const out = Math.min(Math.max(qx, qz), 0) + Math.hypot(Math.max(qx, 0), Math.max(qz, 0));
  return -out;
};

/** Cream diamond motifs scattered over the red field: [x, z, half diagonal]. */
const MOTIFS: ReadonlyArray<readonly [number, number, number]> = [
  [0.43, 0, 0.036],
  [-0.43, 0, 0.036],
  [0, 0.28, 0.03],
  [0, -0.28, 0.03],
  [0.28, 0.17, 0.02],
  [-0.28, 0.17, 0.02],
  [0.28, -0.17, 0.02],
  [-0.28, -0.17, 0.02],
];

const rugPaint = (x: number, y: number, z: number): Rgb => {
  const edge = edgeDist(x, z);
  const wool = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 24, 2);
  const patch = noise.fbm(x * 9, y * 9, z * 9, 2);
  let c: Rgb;
  if (edge < BORDER) {
    c = mixRgb(CREAM, CREAM_DARK, 0.15 + 0.25 * wool);
  } else if (edge < BORDER + GUARD_W) {
    c = GUARD;
  } else {
    c = mixRgb(FIELD, FIELD_DARK, 0.16 + 0.2 * wool + 0.1 * patch);
    for (const [mx, mz, s] of MOTIFS) {
      if (Math.abs(x - mx) + Math.abs(z - mz) < s) {
        c = mixRgb(CREAM, CREAM_DARK, 0.1 + 0.2 * wool);
        break;
      }
    }
  }
  return c;
};

const weaveBump = (x: number, y: number, z: number) =>
  0.0011 * Math.sin(x * 349) * Math.sin(z * 349) +
  0.0007 * noise.fbm(x * 26, y * 26, z * 26, 2);

const medPaint = (x: number, y: number, z: number): Rgb => {
  const wool = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
  let c = mixRgb(MED, MED_DARK, 0.12 + 0.2 * wool);
  // Baked contact shading where the medallion meets the rug.
  c = mixRgb(c, MED_DARK, 0.4 * Math.max(0, (0.032 - y) / 0.02));
  return c;
};

const tasselPaint = (x: number, y: number, z: number): Rgb => {
  const wool = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
  return mixRgb(CREAM, CREAM_DARK, 0.1 + 0.3 * wool);
};

const TASSEL_Z = [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36] as const;
export default defineAsset({
  name: 'rug',
  description:
    'Flat woven wool rug, 1.6 x 1.0 m: deep red field with a cream border, dark guard line, puffy diamond medallion, and wool tassels on both short ends.',
  detail: 0.01,
  reference: 'docs/item-mockups/rug-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ slab
    // Rounded 1.6 x 1.0 x 0.022 slab: extruded rounded rect laid flat, soft 2 mm bevel.
    const slab = sdf
      .extrude(profile.rect([1.596, 0.996], 0.115), 0.018)
      .rotateX(-90)
      .round(0.002)
      .at(0, 0.011, 0);
    k.body('rug', slab.paintFn(rugPaint), {
      color: '#9a4a3a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 1300,
      paintWeight: 2,
      bump: weaveBump,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ medallion (focal point)
    // Puffy diamond pad sitting proud at the heart of the field.
    const medallion = sdf.box([0.26, 0.03, 0.26], 0.012).rotateY(45).at(0, 0.03, 0);
    k.body('medallion', medallion.paintFn(medPaint), {
      color: '#b06050',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 350,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ fringe tassels
    // Fat plump wool drops lying flat, fat end outward like the mock, roots tucked
    // under the slab edge, plus bigger corner drops splayed diagonally. One side
    // built, mirrored for the other.
    const drop = (
      a: readonly [number, number, number],
      b: readonly [number, number, number],
      c: readonly [number, number, number],
    ) => sdf.chain([[a[0], a[1], a[2], 0.012], [b[0], b[1], b[2], 0.023], [c[0], c[1], c[2], 0.031]], 0.01);
    const drops: ReturnType<typeof sdf.chain>[] = TASSEL_Z.map((z0, i) => {
      const splay = (i % 2 === 0 ? 1 : -1) * 0.016;
      return drop([0.77, 0.012, z0], [0.835, 0.015, z0 + splay * 0.3], [0.9, 0.018, z0 + splay]);
    });
    for (const sz of [1, -1]) {
      drops.push(
        sdf.chain(
          [
            [0.71, 0.013, sz * 0.39, 0.011],
            [0.76, 0.015, sz * 0.44, 0.02],
            [0.8, 0.017, sz * 0.49, 0.027],
          ],
          0.01,
        ),
      );
    }
    const fringe = sdf.union(...drops).mirror('x', 0);
    k.body('tassels', fringe.paintFn(tasselPaint), {
      color: '#e6d7b4',
      roughness: 0.92,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 1350,
      paintWeight: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });
  },
});
