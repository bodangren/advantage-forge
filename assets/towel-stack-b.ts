import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Design note — stack of three folded towels (bathhouse shelf prop).
 *
 * Role: background prop for a shelf board in the Chibi Quest bathhouse; a player sees it
 *   small, so it must read at 128 px.
 * Size: 0.30 m wide (X), 0.24 m deep (Z), 0.22 m tall (Y); stands on y = 0, centred on the
 *   Y axis, faces +Z.
 * One idea: three folded towels pressed into one soft stack, the top one turned the other
 *   way with a corner folded over the edge, so the outline breaks and the stack reads as
 *   cloth and not as a box or a cake.
 * Shape language: soft and round (slabs with rolled fold edges), one diagonal accent (the
 *   turned top towel and its corner folded over the edge).
 * Palette: linen cream #efe6d2 (light mass, bottom towel) with linen shade #d8ccb2 (fold
 *   shade); teal #4f8f8a (mid mass, middle towel) with teal shade #3d6f6b (seams); terracotta
 *   #b5654a (small accent, top towel) with terracotta shade #8e4a36 (fold shade); stitch
 *   thread #f3ead8 (band on the top towel).
 * Materials: cloth only, roughness 0.9, metalness 0. Wrinkles in a 2.5 mm displace, the fine
 *   weave in bump. The seams, the stitch band and the fold shade are paint, not bodies.
 * Detail list: primary 3 pressed slabs; secondary the rolled fold edges and the corner folded
 *   over the edge; tertiary the seams, the stitch band and the press dent in the top of the
 *   stack. Focal point: the terracotta corner over the edge.
 * Rig/animation: none (static prop).
 */

const CREAM = rgb('#efe6d2');
const CREAM_SHADE = rgb('#d8ccb2');
const TEAL = rgb('#4f8f8a');
const TEAL_SHADE = rgb('#3d6f6b');
const TERRA = rgb('#b5654a');
const TERRA_SHADE = rgb('#8e4a36');
const TERRA_BACK = rgb('#a05b42');
const STITCH = rgb('#f3ead8');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Soft cloth wrinkles, a form change of under 3 mm. */
const wrinkle = (x: number, y: number, z: number): number => 0.002 * noise.fbm(x * 7, y * 4, z * 7, 2);

/** The fine weave, in the normal map only. */
const weaveBump = (x: number, y: number, z: number): number =>
  0.0006 * (noise.fbm(x * 95, y * 95, z * 95, 2) - 0.5) + 0.0009 * (noise.fbm(x * 13, y * 6, z * 13, 2) - 0.5);

/** Cloth paint: weave speckle, soft creases and a shaded lower edge. */
const clothPaint = (base: Rgb, shade: Rgb, y0: number, y1: number) =>
  (x: number, y: number, z: number): Rgb => {
    const weave = 0.5 + 0.5 * noise.fbm(x * 80, y * 80, z * 80, 2);
    let c = mixRgb(base, shade, 0.2 * (1 - weave));
    const crease = 0.5 + 0.5 * noise.fbm(x * 8, y * 5, z * 8, 2);
    c = mixRgb(c, shade, 0.22 * (1 - crease));
    const t = clamp01((y - y0) / (y1 - y0));
    c = mixRgb(c, shade, 0.5 * (1 - t) * (1 - t));
    return c;
  };

const MID_ROT = 8; // the middle towel turns against the bottom towel
const TOP_ROT = -11; // the top towel turns the other way
const MID_C = { x: 0.006, y: 0.1185, z: -0.012 };
const TOP_C = { x: -0.008, y: 0.179, z: -0.004 };

export default defineAsset({
  name: 'towel-stack-b',
  description:
    'Stack of three folded bath towels: a linen cream slab with two rolled folds, a teal towel turned against it, and a small terracotta towel whose corner folds over the edge.',
  detail: 0.011,
  reference: 'docs/bathhouse-mockups/towel-stack-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ bottom towel
    // The largest slab, flat on the ground, with two rolled folds along its front edge.
    const bottom = sdf
      .union(
        sdf.box([0.3, 0.085, 0.215], 0.018),
        sdf.cylinder(0.018, 0.25, 0.005).rotateZ(90).at(0, -0.021, 0.1035),
        sdf.cylinder(0.012, 0.23, 0.004).rotateZ(90).at(0, 0.022, 0.1035),
      )
      .displace(0.0025, wrinkle)
      .at(0, 0.0425, -0.0125)
      .paintFn(clothPaint(CREAM, CREAM_SHADE, 0, 0.085));
    k.body('towel-bottom', bottom, {
      color: '#efe6d2',
      roughness: 0.9,
      metalness: 0,
      detail: 0.011,
      paintWeight: 2,
      maxError: 0.003,
      maxTriangles: 2600,
      bump: weaveBump,
    });

    // ------------------------------------------------------------ middle towel
    // A narrower teal slab, turned 8 degrees, with one rolled fold at its front edge.
    const middle = sdf
      .union(
        sdf.box([0.272, 0.077, 0.185], 0.017),
        sdf.cylinder(0.015, 0.235, 0.005).rotateZ(90).at(0, -0.013, 0.0905),
      )
      .displace(0.0025, wrinkle)
      .rotateY(MID_ROT)
      .at(MID_C.x, MID_C.y, MID_C.z)
      .paintFn(clothPaint(TEAL, TEAL_SHADE, 0.08, 0.157));
    // Two seam lines down the front of the middle towel, in the towel's own frame.
    const seam = (lx: number) =>
      sdf
        .box([0.005, 0.12, 0.42], 0)
        .at(lx, 0, 0)
        .rotateY(MID_ROT)
        .at(MID_C.x, MID_C.y, MID_C.z);
    k.body(
      'towel-middle',
      middle.paintWhere(seam(-0.075), TEAL_SHADE, 0.0015).paintWhere(seam(0.075), TEAL_SHADE, 0.0015),
      {
        color: '#4f8f8a',
        roughness: 0.9,
        metalness: 0,
        detail: 0.011,
        paintWeight: 2,
        maxError: 0.003,
        maxTriangles: 2000,
        bump: weaveBump,
      },
    );

    // --------------------------------------------------------------- top towel
    // A small terracotta towel turned the other way. Its front-right corner is folded over
    // the edge: one flap lies on the top surface, the other hangs down in front of the
    // middle towel.
    const flapTop = sdf.box([0.046, 0.009, 0.052], 0.004).at(0.083, 0.0385, 0.045);
    const flapHang = sdf
      .extrude(
        profile.polygon(
          [
            [-0.021, 0],
            [0.021, 0],
            [0.014, -0.065],
            [-0.014, -0.065],
          ],
          { smooth: false },
        ),
        0.01,
        0.004,
      )
      .at(0.086, -0.031, 0.0735);
    const flapRegion = sdf.union(
      sdf.box([0.05, 0.02, 0.056], 0).at(0.083, 0.036, 0.045),
      sdf.box([0.05, 0.08, 0.014], 0).at(0.086, -0.028, 0.0735),
    );
    const top = sdf
      .union(
        sdf.box([0.215, 0.068, 0.15], 0.015),
        sdf.cylinder(0.013, 0.185, 0.005).rotateZ(90).at(0, -0.011, 0.0715),
        sdf.smoothUnion(0.006, flapTop, flapHang),
      )
      .displace(0.0025, wrinkle)
      .rotateY(TOP_ROT)
      .at(TOP_C.x, TOP_C.y, TOP_C.z);
    // A soft press in the middle of the stack, so the cloth reads as pressed down.
    const dent = sdf.sphere(0.16).at(TOP_C.x, 0.359, TOP_C.z);
    // The stitch band across the top of the top towel, in the towel's own frame.
    const band = sdf
      .box([0.02, 0.14, 0.3], 0)
      .at(-0.072, 0, 0)
      .rotateY(TOP_ROT)
      .at(TOP_C.x, TOP_C.y, TOP_C.z);
    const topPaint = (x: number, y: number, z: number): Rgb => {
      const c = clothPaint(TERRA, TERRA_SHADE, 0.145, 0.213)(x, y, z);
      // The press in the middle of the stack holds a soft shadow.
      const press = clamp01((0.08 - Math.hypot(x - TOP_C.x, z - TOP_C.z)) / 0.05);
      return mixRgb(c, TERRA_SHADE, 0.24 * press);
    };
    k.body(
      'towel-top',
      top
        .subtract(dent)
        .paintFn(topPaint)
        .paintWhere(flapRegion, TERRA_BACK, 0.004)
        .paintWhere(band, STITCH, 0.005),
      {
        color: '#b5654a',
        roughness: 0.9,
        metalness: 0,
        detail: 0.011,
        paintWeight: 2,
        maxError: 0.003,
        maxTriangles: 1600,
        bump: weaveBump,
      },
    );
  },
});
