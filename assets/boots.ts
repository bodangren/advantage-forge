import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather boots (equipment/armor/boots).
 *
 * Role: wearable armor item for the Chibi Quest heroes; a paired prop that
 *   must read at 128 px as two chunky boots side by side.
 * Size: each boot 0.25 m tall; the pair spans ~0.28 m wide and ~0.28 m deep,
 *   standing on y = 0, centered on the Y axis, toes toward +Z.
 * One idea: an oversized turned-down cuff — a soft rolled cuff caps each boot
 *   and overhangs the ankle, above a fat rounded toe. Exaggerate the cuff.
 * Shape language: round dominant (rolled cuff, bulbous toe, soft leather),
 *   square secondary (sole slab, ankle strap, buckle).
 * Palette (60/30/10): leather #7d4d2a dominant (shaft), lighter cuff and toe
 *   #c98a4a, dark sole and fold shadows #4a2c17 / #4e3018 (secondary), brass
 *   buckle #d4a93a (accent; the focal point).
 * Materials: leather (roughness 0.66, metalness 0), dark sole (roughness 0.78,
 *   metalness 0), brass (roughness 0.3, metalness 1).
 * Detail: primary foot + shaft + cuff; secondary sole with a heel, ankle
 *   strap; tertiary leather grain in bump. Focal point: the brass buckle.
 * Rig/animation: none (static equipment item).
 */

const LEATHER = rgb('#7d4d2a'); // shaft, mid brown
const LEATHER_LIGHT = rgb('#c98a4a'); // cuff and toe cap, sun-lit tan
const LEATHER_DARK = rgb('#4e3018'); // fold shadow
const SOLE = rgb('#4a2c17'); // dark sole and strap
const SOLE_EDGE = rgb('#33200f');
const BRASS = rgb('#d4a93a');

const X0 = 0.072; // center of one boot (the pair straddles x = 0)

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export default defineAsset({
  name: 'boots',
  description:
    'A pair of chunky brown leather boots with turned-down cuffs, lighter toe caps, dark heeled soles, and a brass buckle strap on each ankle.',
  detail: 0.006,
  reference: 'docs/item-mockups/boots-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ single boot body
    // Foot: a low, long rounded pad with a smaller bulbous toe at the front.
    const footPad = sdf.box([0.108, 0.072, 0.19], 0.026);
    const toe = sdf.ellipsoid([0.052, 0.05, 0.06]).at(0, 0.004, 0.078);
    const foot = sdf
      .smoothUnion(0.026, footPad, toe)
      .scale([1, 0.68, 1])
      .at(X0, 0.052, 0.028);

    // Shaft: a slightly oval cylinder rising from the ankle.
    const shaft = sdf
      .cylinder(0.051, 0.175, 0.022)
      .scale([0.93, 1, 0.98])
      .at(X0, 0.1, -0.012);

    // Cuff: a wide band with a rolled lower lip; it overhangs the shaft.
    const cuff = sdf.union(
      sdf
        .cylinder(0.06, 0.06, 0.018)
        .displace(0.003, (x, y, z) => noise.fbm(x * 11, y * 10, z * 11, 2))
        .at(X0, 0.212, -0.012),
      sdf.torus(0.057, 0.012).at(X0, 0.186, -0.012),
    );

    const boot = foot.smoothUnion(0.032, shaft).smoothUnion(0.02, cuff);

    // Paint: mid leather shaft, lighter cuff and toe cap, dark fold shadow.
    const leatherPaint = (x: number, y: number, z: number, base: typeof LEATHER) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 22, z * 34, 2);
      const mottle = 0.5 + 0.5 * noise.fbm(x * 7 + 3, y * 7, z * 7, 2);
      let c = mixRgb(base, LEATHER_DARK, 0.16 * mottle);
      c = mixRgb(c, LEATHER_LIGHT, 0.12 * grain);
      // Lighter turned-down cuff.
      const cuffT = ss(0.178, 0.2, y);
      // Lighter rounded toe cap on the front of the foot.
      const toeT = ss(0.055, 0.09, z) * (1 - ss(0.088, 0.108, y));
      c = mixRgb(c, LEATHER_LIGHT, clamp01(cuffT + toeT) * 0.9);
      // Dark fold line where the cuff meets the shaft.
      const fold = ss(0.158, 0.174, y) * (1 - ss(0.174, 0.192, y));
      c = mixRgb(c, LEATHER_DARK, 0.55 * fold);
      // Stitched seam where the toe cap meets the foot.
      const seam =
        (1 - ss(0.003, 0.007, Math.abs(z - 0.058))) *
        (1 - ss(0.085, 0.105, y)) *
        ss(-0.03, 0.0, y);
      c = mixRgb(c, LEATHER_DARK, 0.45 * seam);
      return c;
    };

    k.body('leather', boot.paintFn(leatherPaint).mirror('x', 0), {
      color: LEATHER,
      roughness: 0.66,
      metalness: 0,
      detail: 0.006,
      paintWeight: 1.5,
      maxTriangles: 1750,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 40, y * 26, z * 40, 2),
    });

    // ------------------------------------------------------------------ soles
    // A dark slab that lips out past the foot, with a raised heel block.
    const soleBase = sdf.box([0.118, 0.02, 0.275], 0.008).at(X0, 0.012, 0.047);
    const heel = sdf.box([0.112, 0.032, 0.072], 0.013).at(X0, 0.018, -0.052);
    const sole = sdf.smoothUnion(0.01, soleBase, heel);
    const solePaint = (x: number, y: number, z: number, base: typeof SOLE) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 45, y * 45, z * 45, 2);
      let c = mixRgb(base, SOLE_EDGE, 0.35 * grain);
      // Scuffed lighter front lip.
      c = mixRgb(c, LEATHER_DARK, 0.3 * ss(0.05, 0.14, z));
      return c;
    };
    k.body('sole', sole.paintFn(solePaint).mirror('x', 0), {
      color: SOLE,
      roughness: 0.78,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 500,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ ankle strap (dark leather)
    const strap = sdf
      .cylinder(0.055, 0.023, 0.006)
      .scale([0.94, 1, 0.99])
      .at(X0, 0.116, -0.012);
    k.body('strap', strap.paint(SOLE).mirror('x', 0), {
      color: SOLE,
      roughness: 0.62,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 260,
    });

    // ------------------------------------------------------------------ brass buckle (accent)
    // A rounded rectangular frame with a center prong, on the front of the strap.
    const frame = sdf
      .box([0.036, 0.03, 0.012], 0.004)
      .subtract(sdf.box([0.024, 0.018, 0.03], 0.002));
    const buckle = sdf
      .union(frame, sdf.box([0.005, 0.03, 0.008], 0.002))
      .at(X0, 0.116, 0.046);
    k.body('buckle', buckle.mirror('x', 0), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      maxTriangles: 300,
    });
  },
});
