import { defineAsset, mixRgb, noise, rgb, sdf, profile } from '../src/index.js';

/**
 * Design note — hand axe (equipment/melee-weapons/hand-axe).
 *
 * Role: a melee-weapon pickup and shop icon; reads at 128 px as a chunky
 *   bearded axe head on a short honey-oak haft. Seen in hand and as an icon.
 * Size: 0.45 m long, standing head-down on y = 0, centred on the Y axis; flat
 *   of the head faces +Z, the cutting edge points +X, the poll points -X.
 *   The rounded butt of the haft is the highest point at y = 0.45.
 * One idea: an oversized curved steel bearded blade welded to a dark iron eye
 *   and poll, on a warm oak haft bound by three fat leather wraps.
 * Shape language: round dominant (soft bevels, curved edge, bulbous butt),
 *   one hard accent (the bright crescent steel bevel).
 * Palette: iron #4a4f55 / #363a3f with highlight #a8acb1; steel edge #c8ccd2;
 *   oak #b5814a with warm #8a5a35, deep #6b4226, pale cut #c9a06a; leather
 *   #8a5a35 / #5c3a22. 60/30/10: wood, iron, steel accent.
 * Materials: worn iron (rough 0.5, metal 0.7), polished steel (rough 0.3,
 *   metal 1), oak wood (rough 0.85), leather (rough 0.65).
 * Detail: primary head + haft; secondary steel bevel, poll, leather wraps,
 *   butt knob; tertiary forged dimples, grain, tarnish.
 * Rig/animation: none (static item).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');
const OAK = rgb('#b5814a');
const OAK_WARM = rgb('#8a5a35');
const OAK_DEEP = rgb('#6b4226');
const OAK_CUT = rgb('#c9a06a');
const LEATHER = rgb('#7a4a28');
const LEATHER_DEEP = rgb('#5c3a22');
const LEATHER_LIGHT = rgb('#8a5a35');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ------------------------------------------------------------------ proportions
const HEAD_DEPTH = 0.05; // full thickness of the head along Z
const HEAD_TOP = 0.18;
const LENS_XC = -0.085; // lens centre x (greatest thickness, at the poll)
const LENS_EDGE_X = 0.112; // lens zero-thickness x (just past the blade edge)
const LENS_TOP = 0.023; // lens half-thickness at its centre (< HEAD_DEPTH / 2)
const LENS_L = LENS_EDGE_X - LENS_XC;
const LENS_R = (LENS_L * LENS_L + LENS_TOP * LENS_TOP) / (2 * LENS_TOP);
const LENS_C = LENS_R - LENS_TOP;

// Bearded axe head outline in the XY plane, head-down: the flattened former top
// edge rests on the ground, the convex cutting edge bulges toward +X, and the
// beard hooks up beside the haft. A shallow waist sets the poll off the blade.
const headProfile = profile.polygon(
  [
    [-0.046, 0.010],
    [-0.006, 0.001],
    [0.037, 0.000],
    [0.070, 0.008],
    [0.096, 0.044],
    [0.109, 0.086],
    [0.103, 0.130],
    [0.081, 0.162],
    [0.057, 0.176],
    [0.040, 0.166],
    [0.029, 0.138],
    [0.022, 0.110],
    [0.009, 0.122],
    [-0.024, 0.124],
    [-0.040, 0.116],
    [-0.068, 0.114],
    [-0.083, 0.084],
    [-0.081, 0.038],
    [-0.064, 0.010],
  ],
  { smooth: true },
);

const BEVEL_W = 0.018; // in-plane width of the bright sharpened bevel

// Forged dimples stamped into the flat cheeks of the head (world x/y).
const DIMPLES: readonly (readonly [number, number, number])[] = [
  [-0.022, 0.045, 0.013],
  [0.000, 0.082, 0.010],
  [-0.040, 0.072, 0.011],
  [0.028, 0.055, 0.009],
];

// ------------------------------------------------------------------ paint
const woodPaint = (x: number, y: number, z: number) => {
  let c = OAK;
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 4, z * 30, 2);
  c = mixRgb(c, OAK_WARM, 0.32 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 3, y * 6, z * 6, 2);
  c = mixRgb(c, OAK_CUT, 0.30 * patch);
  const low = clamp01((0.20 - y) / 0.16);
  c = mixRgb(c, OAK_DEEP, 0.4 * low);
  const top = clamp01((y - 0.39) / 0.055);
  c = mixRgb(c, OAK_CUT, 0.3 * top);
  return c;
};

const leatherPaint = (x: number, y: number, z: number) => {
  let c = LEATHER;
  const grain = 0.5 + 0.5 * noise.fbm(x * 42, y * 42, z * 42, 2);
  c = mixRgb(c, LEATHER_DEEP, 0.38 * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 9 + 7, y * 9, z * 9, 2);
  c = mixRgb(c, LEATHER_LIGHT, 0.24 * patch);
  return c;
};

const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 2, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.34 * tarnish);
  for (const [cx, cy, r] of DIMPLES) {
    const d = Math.hypot(x - cx, y - cy);
    if (d < r) c = mixRgb(c, IRON_DEEP, 0.8 * (1 - d / r));
  }
  const top = clamp01((y - 0.12) / 0.035);
  c = mixRgb(c, IRON_LIGHT, 0.22 * top);
  const bottom = clamp01((0.03 - y) / 0.03);
  c = mixRgb(c, IRON_DEEP, 0.3 * bottom);
  return c;
};

const steelPaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  const sheen = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
  c = mixRgb(c, STEEL_DEEP, 0.22 * sheen);
  // Darken the inner side of the bevel so it melts into the dark iron.
  const inner = clamp01((0.075 - x) / 0.045);
  c = mixRgb(c, STEEL_DEEP, 0.4 * inner);
  return c;
};

export default defineAsset({
  name: 'hand-axe',
  description:
    'Hand axe, 0.45 m, standing head-down: a curved steel bearded blade on a dark iron eye and poll, mounted on a honey-oak haft bound by leather wraps.',
  detail: 0.005,
  reference: 'docs/item-mockups/hand-axe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // --------------------------------------------------------------- oak haft
    const haft = sdf
      .chain(
        [
          [0.000, 0.030, 0, 0.016],
          [0.000, 0.150, 0, 0.0145],
          [-0.003, 0.250, 0, 0.0135],
          [-0.002, 0.340, 0, 0.0135],
          [0.001, 0.410, 0, 0.0155],
        ],
        0.02,
      )
      // bulbous butt knob at the top
      .smoothUnion(0.012, sdf.ellipsoid([0.023, 0.022, 0.023]).at(0.001, 0.428, 0))
      .paintFn(woodPaint)
      // pale cut wood on the sawn top of the butt
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.428), OAK_CUT, 0.006);

    k.body('haft', haft, {
      color: '#b5814a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0011 * (noise.fbm(x * 26, y * 5, z * 26, 2) - 0.5),
      maxTriangles: 620,
    });

    // --------------------------------------------------------------- iron head
    // The head profile extruded along Z, then tapered like a blade by the lens
    // overlap (thick at the poll, thin at the cutting edge).
    const lens = sdf.intersect(
      sdf.cylinder(LENS_R, 0.6).at(LENS_XC, HEAD_TOP / 2, LENS_C),
      sdf.cylinder(LENS_R, 0.6).at(LENS_XC, HEAD_TOP / 2, -LENS_C),
    );
    const baseCut = sdf.box([0.6, 0.2, 0.3]).at(0, -0.1, 0); // clean flat base on y = 0
    const head = sdf.extrude(headProfile, HEAD_DEPTH, 0.006).intersect(lens).subtract(baseCut);

    // The bright sharpened bevel is the outer rim of the blade on the cutting
    // (+X) side; it wraps the curved edge and the beard in one continuous band.
    const core = sdf
      .extrude(profile.offsetProfile(headProfile, -BEVEL_W), HEAD_DEPTH + 0.02, 0.004)
      .intersect(lens)
      .subtract(baseCut);
    const bevelMask = sdf.box([0.5, 0.5, 0.2]).at(0.25, 0.27, 0); // keep x > 0, y > 0.02
    const steelShape = head.subtract(core).intersect(bevelMask);

    k.body('iron', head.subtract(steelShape).paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 950,
    });

    k.body('steel', steelShape.paintFn(steelPaint), {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 300, y * 30, z * 300, 2),
      maxTriangles: 420,
    });

    // --------------------------------------------------------------- leather wrap
    // A flared collar where the haft enters the head, plus three fat rings.
    const collar = sdf.cone([0, 0.120, 0], [0, 0.164, 0], 0.0205, 0.0165);
    const ring = (y: number) => sdf.torus(0.0165, 0.0075).at(-0.001, y, 0);
    const wrap = sdf.union(collar, ring(0.220), ring(0.292), ring(0.364));

    k.body('leather', wrap.paintFn(leatherPaint), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0009 * Math.abs(Math.sin(Math.atan2(z, x) * 3 + y * 90)),
      maxTriangles: 460,
    });
  },
});
