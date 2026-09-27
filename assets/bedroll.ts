import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — bedroll (props/world/bedroll).
 *
 * Role: world prop for the forest clearing; reads at 128 px as a tidy
 *   rolled-up travel blanket resting on the ground.
 * Size: 0.6 m long along +X, 0.226 m diameter; sits on y = 0 with the
 *   rounded body, faces +Z.
 * One idea: a tightly rolled wool blanket, red-brown with a single cream
 *   binding stripe, fastened by two leather tie straps whose iron buckles
 *   catch a hint of light.
 * Shape language: round dominant (plump rolled cylinder, rounded ends),
 *   thin rectangular secondary (flat leather straps hugging the curve).
 * Palette: wool #9a4a3a dominant; leather #5f3d22 secondary; cream #ecd9ad
 *   small accent; iron #3d4047 buckle accent.
 * Value plan: wool mid-warm, leather mid-dark, cream lightest highlight,
 *   iron darkest. The cream stripe and buckles are the focal points.
 * Materials: wool cloth (rough 0.9, weave bump), leather (rough 0.62,
 *   fine grain bump), worn iron (rough 0.55, metal 0.7).
 * Detail: primary rolled body + cream stripe + 2 leather straps; secondary
 *   iron buckles + spiral wrap-line shading on the wool; tertiary weave bump.
 * Rig/animation: none (static world prop).
 */

const WOOL = rgb('#9a4a3a');
const WOOL_SHADE = rgb('#6e2f24');
const WOOL_LIGHT = rgb('#bc5e4b');
const CREAM = rgb('#ecd9ad');
const CREAM_SHADE = rgb('#b8a276');
const LEATHER = rgb('#5f3d22');
const LEATHER_SHADE = rgb('#3a2412');
const LEATHER_LIGHT = rgb('#7e5532');
const IRON = rgb('#3d4047');
const IRON_LIGHT = rgb('#777a82');

const LENGTH = 0.6;
const RADIUS = 0.113;
// Center the roll so its bottom rests on y = 0 (radius + a touch for the
// small cloth displace amplitude so even the sagged points stay at or
// just above the ground plane).
const ROLL_Y = 0.121;

export default defineAsset({
  name: 'bedroll',
  description:
    'Rolled-up red-brown wool bedroll with a cream binding stripe, tied with two leather straps and small iron buckles.',
  detail: 0.008,
  reference: 'docs/item-mockups/bedroll-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ rolled wool body
    // Capsule along +X so the front (+Z) view sees the long side. Subtle
    // cloth creases via low-frequency displace keep the surface from looking
    // like a perfect cylinder.
    const rollShape = sdf
      .capsule([-LENGTH / 2, 0, 0], [LENGTH / 2, 0, 0], RADIUS)
      .displace(0.003, (x, y, z) =>
        noise.fbm(x * 5 + 2, y * 5, z * 5, 2) - 0.4 * noise.fbm(x * 9, y * 9, z * 9, 2),
      )
      .at(0, ROLL_Y, 0);

    // Paint the wool with soft tonal patches plus 5 visible spiral wrap
    // seams. The wrap pattern uses cartesian stripe distance (no atan2
    // branch cut) so each layer of wool reads as a clear darker band
    // around the roll.
    const woolPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 2, y * 4, z * 4, 2);
      const mottle = 0.5 + 0.5 * noise.fbm(x * 12 + 5, y * 12, z * 12, 2);
      let c = mixRgb(WOOL, WOOL_LIGHT, 0.08 * patch);
      c = mixRgb(c, WOOL_SHADE, 0.12 + 0.32 * mottle);
      // 5 wrap lines: for each, distance from the radial line through the
      // roll axis at angle 2π n/5. minDist is small near each seam; far
      // from any seam, minDist reaches sin(π/5) ≈ 0.59.
      const dy = y - ROLL_Y;
      const dz = z;
      const r2 = Math.hypot(dy, dz);
      let wrap = 0;
      if (r2 > 0.004) {
        const ux = dy / r2; // cos θ
        const uz = dz / r2; // sin θ
        let minDist = 1;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const d = Math.abs(Math.sin(a) * ux - Math.cos(a) * uz);
          if (d < minDist) minDist = d;
        }
        // Band half-width in (cos θ, sin θ) units; 0.32 gives a band
        // about 18° wide per wrap line, with thin gaps between.
        wrap = Math.max(0, 1 - minDist / 0.32);
      }
      const wrapDark = Math.pow(wrap, 1.6);
      c = mixRgb(c, WOOL_SHADE, 0.82 * wrapDark);
      // Add a darker shadow line right at the wrap seam center.
      const seamDark = Math.pow(wrap, 5);
      c = mixRgb(c, WOOL_SHADE, 0.42 * seamDark);
      // Under-curve soft shadow so the bottom reads as seated on the ground.
      const sss = Math.max(0, Math.min(1, (r2 - RADIUS * 0.6) / (RADIUS * 0.4)));
      c = mixRgb(c, WOOL_SHADE, 0.3 * sss);
      // Sun-lit highlight along the very top.
      const lift = Math.max(0, RADIUS - r2) / RADIUS;
      c = mixRgb(c, WOOL_LIGHT, 0.14 * lift);
      return c;
    };

    // Cream stripe stencil: a thin axial band running along the very top
    // of the roll. Narrower than the wrap seams so it reads as a single
    // woven accent stripe rather than another layer.
    const stripeStencil = sdf
      .box([LENGTH + 0.04, 0.006, 0.5], 0.0025)
      .at(0, ROLL_Y + RADIUS - 0.003, 0);
    // Hairline of shade immediately below the stripe to anchor it as a
    // sewn-on band rather than a wash of cream over the wool.
    const stripeEdge = sdf
      .box([LENGTH + 0.04, 0.0018, 0.5])
      .at(0, ROLL_Y + RADIUS - 0.007, 0);

    const woolRolled = rollShape
      .paintFn(woolPaint)
      .paintWhere(stripeEdge, CREAM_SHADE, 0.001)
      .paintWhere(stripeStencil, CREAM, 0.0025);

    k.body('wool', woolRolled, {
      color: '#9a4a3a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.0075,
      paintWeight: 2,
      maxTriangles: 1500,
      bump: (x, y, z) =>
        0.0008 * noise.fbm(x * 190, y * 5, z * 190, 2) +
        0.0008 * noise.fbm(x * 5, y * 190, z * 5, 2) +
        0.0005 * noise.fbm(x * 42, y * 42, z * 42, 2),
    });

    // ------------------------------------------------------------------ leather straps
    // Two flat leather bands hugging the roll, with a small leather knot
    // on top of each strap so the buckle has a base to sit on. Strap is
    // ~14 mm thick (chibi-readable at 128 px sprite).
    const shell = rollShape.round(0.014).subtract(rollShape.round(-0.003));
    const strapSlice = (xs: number) =>
      shell.intersect(sdf.box([0.034, 0.6, 0.6]).at(xs, 0, 0));

    const STRAP_A = -0.135;
    const STRAP_B = 0.115;
    const knot = (xs: number) =>
      sdf.box([0.05, 0.018, 0.034], 0.005).at(xs, ROLL_Y + RADIUS + 0.006, 0);

    const strapShape = sdf.union(
      strapSlice(STRAP_A),
      strapSlice(STRAP_B),
      knot(STRAP_A),
      knot(STRAP_B),
    );

    const leatherPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 22, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.1 + 0.18 * grain);
      // Soft darken on the underside of the strap ring where it meets wool.
      const r2 = Math.hypot(y - ROLL_Y, z);
      const sss = Math.max(0, (r2 - RADIUS * 0.5) / (RADIUS * 0.5));
      c = mixRgb(c, LEATHER_SHADE, 0.3 * sss);
      return c;
    };

    k.body('leather', strapShape.paintFn(leatherPaint), {
      color: '#5f3d22',
      roughness: 0.62,
      metalness: 0,
      detail: 0.0055,
      paintWeight: 2,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 80, y * 14, z * 80, 2),
    });

    // ------------------------------------------------------------------ iron buckles
    // Two small iron buckle frames sitting on top of each leather knot.
    // A rounded rectangle with a slot cut through it and a darker cross
    // pin — the classic chibi belt-buckle silhouette.
    const BUCKLE_TOP_Y = ROLL_Y + RADIUS + 0.022;
    const buckleFrame = (xs: number) => {
      const frame = sdf.box([0.044, 0.026, 0.018], 0.005).at(xs, BUCKLE_TOP_Y, 0);
      const slot = sdf.box([0.034, 0.012, 0.05], 0.003).at(xs, BUCKLE_TOP_Y, 0);
      const pin = sdf.box([0.038, 0.004, 0.006], 0.0015).at(xs, BUCKLE_TOP_Y, 0);
      return frame.subtract(slot).subtract(pin);
    };
    const buckleShape = sdf.union(buckleFrame(STRAP_A), buckleFrame(STRAP_B));

    const ironPaint = (x: number, y: number, z: number) => {
      const tarnish = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
      let c = mixRgb(IRON, IRON_LIGHT, 0.12 * tarnish);
      const dy = (y - BUCKLE_TOP_Y) / 0.013;
      c = mixRgb(c, IRON, 0.22 * Math.max(0, -dy));
      return c;
    };

    k.body('iron', buckleShape.paintFn(ironPaint), {
      color: '#3d4047',
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.004,
      paintWeight: 2,
      maxTriangles: 320,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
  },
});
