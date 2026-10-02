import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

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
 * Avatar fit (2026-10-02): the foot, shaft, and cuff are built in avatar meters around the avatar
 *   foot and shin, grown 0.012 to 0.016 m, then scaled by 2. X0 = 0.13 keeps the inner edge in the
 *   +X half that the wearer keeps; `origin` x moved from 0.072 to X0 for this reason.
 */

// The heel round sinks 1.1 cm below the sole line in the model frame; LIFT stands the display on
// y = 0, and the origin moves with it so the worn fit does not change.
const LIFT = 0.011;
const LEATHER = rgb('#7d4d2a'); // shaft, mid brown
const LEATHER_LIGHT = rgb('#c98a4a'); // cuff and toe cap, sun-lit tan
const LEATHER_DARK = rgb('#4e3018'); // fold shadow
const SOLE = rgb('#4a2c17'); // dark sole and strap
const SOLE_EDGE = rgb('#33200f');
const BRASS = rgb('#d4a93a');

const X0 = 0.13; // asset x of the left ankle (the +X half is kept and mirrored)
const AX = 0.098; // avatar ankle x

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
  equip: { slot: 'feet', fitScale: 2, origin: [X0, 0.14 + LIFT, 0], hides: ['shoes'] },

  build(k) {
    // ------------------------------------------------------------------ single boot body
    // Built in avatar meters around the avatar foot and shin, then scaled by 2 to the asset frame.
    const toAsset = (s: ReturnType<typeof sdf.sphere>) => s.scale(2).at(X0 - 2 * AX, 0, 0);
    const foot = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.05, 0.044, 0.072]).at(AX, 0.042, 0.02),
      sdf.ellipsoid([0.046, 0.04, 0.046]).at(AX, 0.036, 0.068),
    );
    const shaft = sdf
      .revolve(
        profile.polygon([
          [0, 0.05],
          [0.056, 0.05],
          [0.06, 0.128],
          [0, 0.128],
        ]),
      )
      .at(AX, 0, 0.001);
    // Cuff: a wide band with a rolled lower lip; it overhangs the shaft and the pants hem.
    const cuff = sdf.union(
      sdf
        .cylinder(0.066, 0.03, 0.009)
        .displace(0.0015, (x, y, z) => noise.fbm(x * 22, y * 20, z * 22, 2))
        .at(AX, 0.116, 0),
      sdf.torus(0.062, 0.007).at(AX, 0.101, 0),
    );
    const boot = toAsset(foot.smoothUnion(0.016, shaft).smoothUnion(0.01, cuff));

    // Paint: mid leather shaft, lighter cuff and toe cap, dark fold shadow.
    const leatherPaint = (x: number, y: number, z: number, base: typeof LEATHER) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 22, z * 34, 2);
      const mottle = 0.5 + 0.5 * noise.fbm(x * 7 + 3, y * 7, z * 7, 2);
      let c = mixRgb(base, LEATHER_DARK, 0.16 * mottle);
      c = mixRgb(c, LEATHER_LIGHT, 0.12 * grain);
      // Lighter turned-down cuff.
      const cuffT = ss(0.2, 0.215, y);
      // Lighter rounded toe cap on the front of the foot.
      const toeT = ss(0.12, 0.17, z) * (1 - ss(0.1, 0.12, y));
      c = mixRgb(c, LEATHER_LIGHT, clamp01(cuffT + toeT) * 0.9);
      // Dark fold line where the cuff meets the shaft.
      const fold = ss(0.185, 0.2, y) * (1 - ss(0.2, 0.212, y));
      c = mixRgb(c, LEATHER_DARK, 0.55 * fold);
      // Stitched seam where the toe cap meets the foot.
      const seam =
        (1 - ss(0.003, 0.007, Math.abs(z - 0.12))) *
        (1 - ss(0.1, 0.12, y)) *
        ss(0.0, 0.03, y);
      c = mixRgb(c, LEATHER_DARK, 0.45 * seam);
      return c;
    };

    k.body('leather', boot.paintFn(leatherPaint).mirror('x', 0).at(0, LIFT, 0), {
      color: LEATHER,
      roughness: 0.66,
      metalness: 0,
      detail: 0.006,
      paintWeight: 1.5,
      maxTriangles: 2600,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 40, y * 26, z * 40, 2),
    });

    // ------------------------------------------------------------------ soles
    // A dark slab that lips out past the foot, with a raised heel block.
    const soleBase = sdf.cylinder(0.098, 0.03, 0.012).scale([1, 1, 1.65]).at(X0, 0.015, 0.06);
    const heel = sdf.cylinder(0.09, 0.04, 0.014).at(X0, 0.02, -0.06);
    const sole = sdf.smoothUnion(0.01, soleBase, heel);
    const solePaint = (x: number, y: number, z: number, base: typeof SOLE) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 45, y * 45, z * 45, 2);
      let c = mixRgb(base, SOLE_EDGE, 0.35 * grain);
      // Scuffed lighter front lip.
      c = mixRgb(c, LEATHER_DARK, 0.3 * ss(0.05, 0.14, z));
      return c;
    };
    k.body('sole', sole.paintFn(solePaint).mirror('x', 0).at(0, LIFT, 0), {
      color: SOLE,
      roughness: 0.78,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 500,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ ankle strap (dark leather)
    const strap = sdf
      .cylinder(0.124, 0.026, 0.008)
      .at(X0, 0.176, 0.002);
    k.body('strap', strap.paint(SOLE).mirror('x', 0).at(0, LIFT, 0), {
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
      .at(X0, 0.176, 0.128);
    k.body('buckle', buckle.mirror('x', 0).at(0, LIFT, 0), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      maxTriangles: 300,
    });
  },
});
