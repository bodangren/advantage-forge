import { defineAsset, mixRgb, noise, rgb, sdf, profile } from '../src/index.js';

/**
 * Design note — woodcutter axe (props/craft-and-trade/axe).
 *
 * Role: a workshop / woodcutter axe; reads at 128 px as a chunky iron head on a
 *   gently curved honey-walnut haft.
 * Size: 0.8 m tall, standing on its rounded haft butt at y = 0, haft on the Y
 *   axis, flat of the head facing +Z, cutting edge toward +X. (Follows the
 *   `reference/axe-mock.jpg` mockup: haft down, head high on the haft.)
 * One idea: a fat swept-trapezoid iron head whose bright steel border wraps the
 *   whole blade, mounted mid-haft, with the knobby haft tip poking above the
 *   head and a long curved haft below.
 * Shape language: square dominant (blocky head, flat poll), organic secondary
 *   (curved haft, rounded knob and butt).
 * Palette: walnut haft #6b4226 / #54331d with warm #c08a44 grain; iron head
 *   #4a4f55 / #363a3f with highlight #a8acb1; steel edge #c8ccd2. 60/30/10.
 * Materials: walnut wood (roughness 0.8), worn iron (roughness 0.5, metalness
 *   0.7), polished steel (roughness 0.3, metalness 1).
 * Detail: primary curved haft + swept head; secondary steel border + haft knob
 *   + butt; tertiary forged dimples and tarnish in paint, wood grain and a
 *   faint forge grain in bump.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#c08a44');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
const HEAD_Y = 0.605; // head centre height
const HEAD_DEPTH = 0.058; // full thickness of the head (along Z)
const STEEL_FROM_X = 0.138; // the steel bevel starts here (blade cutting side)
const LENS_XC = -0.055; // lens centre x (thickness is greatest here)
const LENS_EDGE_X = 0.205; // lens zero-thickness x (just past the profile edge)
const LENS_TOP = 0.04; // lens half-thickness at its centre (< HEAD_DEPTH / 2)

// The blade tapers like a lens: the overlap of two big upright cylinders whose
// thickness falls off toward +x, so the cutting edge is thin and the poll thick.
const LENS_L = LENS_EDGE_X - LENS_XC;
const LENS_R = (LENS_L * LENS_L + LENS_TOP * LENS_TOP) / (2 * LENS_TOP);
const LENS_C = LENS_R - LENS_TOP;

// Swept trapezoidal head outline in the XY plane: tall flat poll at the haft,
// a straight top edge sloping down to a near-vertical convex cutting edge.
const headProfile = profile.polygon([
  [-0.040, 0.100],
  [0.120, 0.016],
  [0.178, -0.014],
  [0.186, -0.076],
  [0.164, -0.136],
  [0.055, -0.126],
  [-0.044, -0.110],
  [-0.104, -0.074],
  [-0.108, 0.002],
  [-0.104, 0.078],
]);

// Forged dimples stamped into the flat cheeks of the head, in world x/y.
const DIMPLES: readonly (readonly [number, number, number])[] = [
  [-0.028, HEAD_Y + 0.028, 0.017],
  [0.024, HEAD_Y - 0.030, 0.020],
  [-0.060, HEAD_Y - 0.020, 0.013],
  [0.060, HEAD_Y + 0.010, 0.014],
  [-0.004, HEAD_Y - 0.062, 0.012],
  [0.086, HEAD_Y - 0.020, 0.011],
];

// ------------------------------------------------------------------ paint
// Walnut: warm honey base, fine grain, big tonal patches, sun on top.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 4, z * 30, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.32 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.5 * patch);
  const top = clamp01((y - 0.15) / 0.5);
  c = mixRgb(c, WALNUT_LIGHT, 0.16 * top);
  const low = clamp01((0.07 - y) / 0.09);
  c = mixRgb(c, WALNUT_DEEP, 0.4 * low);
  return c;
};

// Iron: dark base with tarnish patches, stamped dimples, a light top band and a
// shadowed underside.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 20 + 3, y * 20, z * 20, 2);
  c = mixRgb(c, IRON_DEEP, 0.32 * tarnish);
  for (const [cx, cy, r] of DIMPLES) {
    const d = Math.hypot(x - cx, y - cy);
    if (d < r) c = mixRgb(c, IRON_DEEP, 0.82 * (1 - d / r));
  }
  const top = clamp01((y - (HEAD_Y + 0.06)) / 0.05);
  c = mixRgb(c, IRON_LIGHT, 0.28 * top);
  const bottom = clamp01(((HEAD_Y - 0.08) - y) / 0.05);
  c = mixRgb(c, IRON_DEEP, 0.35 * bottom);
  return c;
};

const steelPaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  const sheen = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
  c = mixRgb(c, STEEL_DEEP, 0.26 * sheen);
  // Darken the inner edge of the bevel so it meets the iron softly.
  const inner = clamp01((STEEL_FROM_X + 0.028 - x) / 0.028);
  c = mixRgb(c, STEEL_DEEP, 0.5 * inner);
  return c;
};

export default defineAsset({
  name: 'axe',
  description:
    'Woodcutter axe, 0.8 m: a curved honey-walnut haft standing on its rounded butt with a chunky swept iron head high on the haft and a bright steel border around the blade.',
  detail: 0.005,
  reference: 'docs/item-mockups/axe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // --------------------------------------------------------------- walnut haft
    // A gently curved chain with a heavy rounded butt and a bulbous top knob.
    const haft = sdf
      .chain(
        [
          [0.010, 0.021, 0, 0.021], // rounded butt, bottom sits on y = 0
          [0.008, 0.100, 0, 0.018],
          [0.000, 0.220, 0, 0.0165],
          [-0.008, 0.340, 0, 0.016],
          [-0.008, 0.460, 0, 0.0165],
          [-0.002, 0.580, 0, 0.017],
          [0.002, 0.690, 0, 0.016],
          [0.005, 0.752, 0, 0.017],
        ],
        0.02,
      )
      // mushroom knob on top of the haft
      .smoothUnion(0.01, sdf.ellipsoid([0.027, 0.025, 0.027]).at(0.005, 0.772, 0))
      .paintFn(walnutPaint);

    k.body('haft', haft, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 850,
    });

    // --------------------------------------------------------------- iron head
    // Solid head: profile extruded along Z, intersected with the tapering lens.
    const lens = sdf.intersect(
      sdf.cylinder(LENS_R, 0.6).at(LENS_XC, HEAD_Y, LENS_C),
      sdf.cylinder(LENS_R, 0.6).at(LENS_XC, HEAD_Y, -LENS_C),
    );
    const head = sdf.extrude(headProfile, HEAD_DEPTH, 0.004).at(0, HEAD_Y, 0).intersect(lens);

    // Split the outer bevel off as a separate bright steel body: only the
    // cutting-edge side of the blade, leaving the sweep dark iron.
    const bevelMask = sdf.box([0.4, 0.5, 0.2]).at(STEEL_FROM_X + 0.2, HEAD_Y, 0);
    const steelShape = head.intersect(bevelMask);

    k.body('iron', head.subtract(steelShape).paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 36, y * 36, z * 36, 2),
      maxTriangles: 1100,
    });

    k.body('steel', steelShape.paintFn(steelPaint), {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 300, y * 30, z * 300, 2),
      maxTriangles: 400,
    });
  },
});
