import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — staved wooden wash basin (bathhouse prop).
 *
 * Role: bathhouse prop for a bench or floor; reads at 128 px.
 * Size: 0.42 m across (X), 0.40 m deep (Z), 0.17 m tall (Y). Stands on y = 0,
 *   centred on the Y axis, faces +Z, with the dipper on the +Z side.
 * One idea: a wide, shallow staved bowl whose two dark iron hoops frame a
 *   bright disc of water, with a chunky wooden dipper leaning across the pale
 *   rim. The water is the focal point; the rim catches the light.
 * Shape language: round dominant (tapered stave wall, hoops, rim, water),
 *   with one diagonal accent (the dipper handle) that breaks the outline.
 * Palette: honey oak #b5814a / warm brown #8a5a35 (dominant wood), pale cut
 *   wood #c9a06a (rim), dark walnut #6b4226 (foot), iron #4a4f55 with shade
 *   #363a3f and highlight #a8acb1, water #3fa8c8 with highlight #7fd6e8.
 * Materials: wood (roughness 0.82, metalness 0), worn iron (0.5, 0.7), glossy
 *   water (0.1, 0). Iron bump stays tiny to avoid wavy reflections.
 * Detail list: primary ten-stave wall + thick rim + foot ring; secondary two
 *   iron hoops, proud sawn stave tops, water disc, dipper cup and handle;
 *   tertiary stave seams and grain in paint and bump.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const PALE_HI = rgb('#e8d6b0');
const WALNUT = rgb('#6b4226');
const GROOVE = rgb('#3a2412');

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const WATER = rgb('#3fa8c8');
const WATER_HI = rgb('#7fd6e8');

const STAVES = 10;
const STEP = 360 / STAVES;
const RIM_Y = 0.17;
const WATER_Y = RIM_Y - 0.022;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Ten soft stave lobes in the wall; the form change lives in `displace`. */
const staveWave = (x: number, y: number, z: number): number => {
  const r = Math.hypot(x, z);
  if (r < 0.06) return 0;
  const ramp = clamp01((r - 0.06) / 0.05);
  // Fade the lobes out below the rim so the thick rim ring stays smooth.
  const fade = clamp01((0.142 - y) / 0.03) * clamp01(y / 0.015);
  return Math.cos(Math.atan2(z, x) * STAVES) * ramp * fade;
};

/** Stave seam darkness and a continuous per-stave tint. */
function staveAt(x: number, z: number) {
  const aDeg = (Math.atan2(z, x) * 180) / Math.PI;
  const m = (((aDeg - STEP / 2) % STEP) + STEP) % STEP;
  const dist = Math.min(m, STEP - m);
  const groove = clamp01((7 - dist) / 7);
  const c = Math.cos((aDeg * Math.PI) / 180);
  const s = Math.sin((aDeg * Math.PI) / 180);
  const tint = 0.5 + 0.5 * noise.fbm(c * 2.4, 0.3, s * 2.4, 2);
  return { groove, tint };
}

const woodPaint = (x: number, y: number, z: number) => {
  const { groove, tint } = staveAt(x, z);
  let c = mixRgb(BROWN, HONEY, 0.15 + 0.5 * tint);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
  c = mixRgb(c, WALNUT, 0.28 * patch);
  const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 9, z * 40, 2);
  c = mixRgb(c, PALE, 0.12 * grain);
  c = mixRgb(c, GROOVE, 0.92 * groove); // painted seams between staves
  const r = Math.hypot(x, z);
  const lip = clamp01((y - 0.148) / 0.012) * clamp01((r - 0.16) / 0.02);
  c = mixRgb(c, PALE_HI, 0.88 * lip); // pale cut rim ring
  c = mixRgb(c, WALNUT, 0.55 * clamp01((0.035 - y) / 0.035)); // shaded foot
  return c;
};

const woodBump = (x: number, y: number, z: number): number => {
  const { groove } = staveAt(x, z);
  return -0.004 * groove + 0.0012 * noise.fbm(x * 34, y * 34, z * 34, 2);
};

const ironPaint = (x: number, y: number, z: number) => {
  const t = clamp01(y / RIM_Y);
  let c = mixRgb(IRON_DARK, IRON, 0.2 + 0.45 * t);
  const speck = 0.5 + 0.5 * noise.fbm(x * 42, y * 42, z * 42, 2);
  return mixRgb(c, IRON_HI, 0.16 * speck);
};

const ironBump = (x: number, y: number, z: number): number =>
  0.0004 * noise.fbm(x * 30, y * 30, z * 30, 2); // deliberately tiny

const waterPaint = (x: number, y: number, z: number) => {
  const swirl = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
  let c = mixRgb(WATER, WATER_HI, 0.12 * swirl);
  const r = Math.hypot(x, z);
  c = mixRgb(c, WATER_HI, 0.22 * clamp01((0.16 - r) / 0.16)); // lit centre
  return mixRgb(c, WATER, 0.25 * clamp01((r - 0.14) / 0.04)); // deeper at edge
};

export default defineAsset({
  name: 'wash-basin',
  description:
    'Wide shallow staved wooden wash basin: ten fat staves, a pale cut rim, two dark iron hoops, bright water, and a chunky dipper resting across the front rim.',
  detail: 0.011,
  reference: 'docs/bathhouse-mockups/wash-basin-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------- stave wall + rim
    // Shallow tapered bowl: wider at the rim than the foot. Ten soft lobes
    // make the stave form; painted seams divide them. A thick rounded lip,
    // proud sawn stave tops, and a low foot ring share the wood body.
    const outer = profile.polygon(
      [
        [0, 0],
        [0.13, 0],
        [0.152, 0.006],
        [0.17, 0.028],
        [0.19, 0.08],
        [0.202, 0.135],
        [0.208, 0.158],
        [0.207, 0.168],
        [0.198, RIM_Y],
        [0, RIM_Y],
      ],
      { smooth: true, samples: 16 },
    );
    const cavity = profile.polygon(
      [
        [0, 0.035],
        [0.118, 0.035],
        [0.14, 0.052],
        [0.158, 0.095],
        [0.174, 0.14],
        [0.18, RIM_Y],
        [0.18, 0.22],
        [0, 0.22],
      ],
      { smooth: true, samples: 14 },
    );
    const wall = sdf
      .revolve(outer)
      .displace(0.005, staveWave)
      .subtract(sdf.revolve(cavity))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Ten sawn stave tops, set just below a smooth thick rim so they read as
    // blocks without turning the rim into a row of bumps.
    const tops = Array.from({ length: STAVES }, (_, i) => {
      const a = (i * 2 * Math.PI) / STAVES;
      return sdf
        .box([0.046, 0.038, 0.026], 0.007)
        .rotateY((a * 180) / Math.PI)
        .at(Math.sin(a) * 0.19, 0.132, Math.cos(a) * 0.19);
    });
    const rim = sdf.torus(0.187, 0.017).at(0, 0.155, 0);
    const foot = sdf.torus(0.145, 0.013).at(0, 0.013, 0);
    const wood = sdf
      .smoothUnion(0.005, wall, foot, rim, ...tops)
      .paintFn(woodPaint);
    k.body('wood', wood, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      textureDensity: 2,
      paintWeight: 2,
      detail: 0.011,
      maxError: 0.0025,
      maxTriangles: 2600,
      bump: woodBump,
    });

    // ------------------------------------------------------------- iron hoops
    // Two narrow annular rings hugging the tapered staves. The inner radius
    // sits inside the stave seams so a hoop never floats above the wall.
    const hoopAt = (r: number, y: number, h: number) =>
      sdf
        .cylinder(r, h, 0.004)
        .subtract(sdf.cylinder(r - 0.02, 0.1))
        .at(0, y, 0);
    const hoops = sdf.union(hoopAt(0.195, 0.045, 0.022), hoopAt(0.21, 0.13, 0.02)).paintFn(ironPaint);
    k.body('iron', hoops, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxError: 0.002,
      maxTriangles: 900,
      bump: ironBump,
    });

    // ------------------------------------------------------------------ water
    // Flat glossy disc 3 cm below the rim; a shallow cylinder, not a hole.
    const water = sdf
      .cylinder(0.172, 0.022, 0.006)
      .at(0, WATER_Y - 0.011, 0)
      .paintFn(waterPaint);
    k.body('water', water, {
      color: '#3fa8c8',
      roughness: 0.1,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 320,
    });

    // ----------------------------------------------------------------- dipper
    // Small hollow cup resting on the water, with a tapered handle that leans
    // over the +Z rim and ends in a turned knob. One body so nothing floats.
    const cupProfile = profile.polygon(
      [
        [0, 0],
        [0.018, 0],
        [0.03, 0.008],
        [0.035, 0.028],
        [0.032, 0.038],
        [0.025, 0.038],
        [0.022, 0.014],
        [0, 0.014],
      ],
      { smooth: true, samples: 10 },
    );
    const cup = sdf.revolve(cupProfile).at(0.035, 0.145, 0.095);
    const handle = sdf.cone([0.035, 0.17, 0.115], [0.09, 0.185, 0.27], 0.012, 0.009);
    const knob = sdf.sphere(0.014).at(0.09, 0.185, 0.27);
    const dipper = sdf.smoothUnion(0.007, cup, handle, knob).paintFn((x, y, z) => {
      const g = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
      return mixRgb(BROWN, PALE, 0.25 + 0.45 * g);
    });
    k.body('dipper', dipper, {
      color: '#c9a06a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.007,
      maxError: 0.002,
      maxTriangles: 700,
      bump: woodBump,
    });
  },
});
