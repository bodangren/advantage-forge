import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — staved wooden wash basin (bathhouse prop).
 *
 * Role: bathhouse prop for the Chibi Quest pack; a player sees it small, so it must read
 *   at 128 px.
 * Size: 0.42 m across (X), 0.40 m deep (Z), 0.17 m tall (Y); stands on y = 0, centred on the
 *   Y axis, faces +Z. The dipper sits on the +Z side.
 * One idea: a wide, shallow staved wooden bowl with a thick pale rim, 2 dark iron hoops
 *   that hug the staves, and still bright water inside, with a chunky dipper leaning across
 *   the rim. The dark hoops frame the bright water.
 * Shape language: round dominant (shallow tapered bowl, rim ring, hoops), one square
 *   accent (the 10 sawn stave tops that stand proud of the rim).
 * Palette: honey oak #b5814a (bowl body) with warm brown #8a5a35 (stave seams) and pale cut
 *   wood #c9a06a (rim, sawn tops); dark walnut #6b4226 (foot ring, shaded inside); iron
 *   #4a4f55 with iron shade #363a3f and iron highlight #a8acb1 (hoops); water #3fa8c8 with
 *   water highlight #7fd6e8 (the focal point).
 * Materials: wood (roughness 0.82, metalness 0), worn iron (roughness 0.5, metalness 0.7),
 *   water (roughness 0.1, metalness 0). The iron bump stays tiny.
 * Detail list: primary the shallow staved bowl and the thick rim; secondary the 2 hoops, the
 *   foot ring, the water and the dipper; tertiary the stave seams and the wood grain in
 *   paint and bump, the sawn stave tops. Focal point: the bright water.
 * Rig/animation: none (static prop).
 */

const WOOD_HONEY = rgb('#b5814a');
const WOOD_BROWN = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const GROOVE = rgb('#43260f');

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const WATER = rgb('#3fa8c8');
const WATER_HI = rgb('#7fd6e8');

const STAVES = 10;
const STEP = 360 / STAVES;
const X_SCALE = 1.05; // the bowl is a little wider across than it is deep
const RIM_Y = 0.15; // the centre of the rim ring
const RIM_R = 0.182; // the centre radius of the rim ring
const RIM_TUBE = 0.018;
const WATER_Y = 0.138; // the water surface, 3 cm below the rim

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The outer radius of the bowl wall at a height, for the inside/outside paint test. */
const wallRadius = (y: number): number => {
  const pts: readonly (readonly [number, number])[] = [
    [0.022, 0.112],
    [0.032, 0.124],
    [0.06, 0.136],
    [0.095, 0.15],
    [0.125, 0.163],
    [0.148, 0.174],
    [0.166, 0.186],
  ];
  const first = pts[0];
  if (first && y <= first[0]) return first[1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (!p0 || !p1) continue;
    if (y <= p1[0]) return p0[1] + ((p1[1] - p0[1]) * (y - p0[0])) / (p1[0] - p0[0]);
  }
  const last = pts[pts.length - 1];
  return last ? last[1] : 0.18;
};

/** The 10 stave lobes, a form change of 9 mm. */
const staveWave = (x: number, y: number, z: number): number => {
  const r = Math.hypot(x, z);
  if (r < 0.07) return 0;
  const ramp = clamp01((r - 0.07) / 0.05);
  const fade = 1 - clamp01((y - 0.095) / 0.04);
  return Math.cos(Math.atan2(z, x) * STAVES) * ramp * fade;
};

/** The painted stave seams, in the unscaled bowl frame. */
function staveAt(x: number, z: number) {
  const aDeg = (Math.atan2(z, x) * 180) / Math.PI;
  const m = (((aDeg - STEP / 2) % STEP) + STEP) % STEP;
  const dist = Math.min(m, STEP - m);
  const groove = clamp01((5 - dist) / 5);
  const tint = 0.5 + 0.5 * noise.fbm(Math.cos((aDeg * Math.PI) / 180) * 2.4, 0.3, Math.sin((aDeg * Math.PI) / 180) * 2.4, 2);
  return { groove, tint };
}

const woodPaint = (x: number, y: number, z: number) => {
  const xu = x / X_SCALE;
  const { groove, tint } = staveAt(xu, z);
  let c = mixRgb(WOOD_BROWN, WOOD_HONEY, 0.14 + 0.45 * tint);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
  c = mixRgb(c, WALNUT, 0.28 * patch);
  const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 8, z * 40, 2);
  c = mixRgb(c, WOOD_PALE, 0.14 * grain);
  // Dark seams between the staves, paint and not a hole.
  c = mixRgb(c, GROOVE, 0.9 * groove);
  // The pale sawn rim and the pale tops of the staves.
  c = mixRgb(c, WOOD_PALE, 0.9 * clamp01((y - 0.146) / 0.016));
  // The dark foot ring and the shaded lower wall.
  c = mixRgb(c, WALNUT, 0.85 * clamp01((0.038 - y) / 0.038));
  // The inside of the bowl lies in shadow.
  const inside = y < 0.13 && Math.hypot(xu, z) < wallRadius(y) - 0.008;
  if (inside) c = mixRgb(c, WALNUT, 0.5);
  return c;
};

const woodBump = (x: number, y: number, z: number): number => {
  const { groove } = staveAt(x / X_SCALE, z);
  return -0.0035 * groove + 0.0011 * noise.fbm(x * 34, y * 34, z * 34, 2);
};

const ironPaint = (x: number, y: number, z: number) => {
  const t = clamp01((y - 0.04) / 0.08);
  let c = mixRgb(IRON_DARK, IRON, 0.2 + 0.5 * t);
  const speck = 0.5 + 0.5 * noise.fbm(x * 45, y * 45, z * 45, 2);
  c = mixRgb(c, IRON_HI, 0.16 * speck);
  return c;
};

const ironBump = (x: number, y: number, z: number): number => 0.0006 * (noise.fbm(x * 40, y * 40, z * 40, 2) - 0.5);

const waterPaint = (x: number, y: number, z: number) => {
  const swirl = 0.5 + 0.5 * noise.fbm(x * 11, y * 11, z * 11, 2);
  let c = mixRgb(WATER, WATER_HI, 0.12 * swirl);
  c = mixRgb(c, WATER_HI, 0.25 * clamp01((0.16 - Math.hypot(x, z)) / 0.16));
  return c;
};

export default defineAsset({
  name: 'wash-basin-b',
  description:
    'Shallow staved wooden wash basin with a thick pale rim, sawn stave tops, two dark iron hoops, a foot ring, bright blue water, and a wooden dipper resting across the rim.',
  detail: 0.009,
  reference: 'docs/bathhouse-mockups/wash-basin-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------- bowl
    // A shallow tapered wall of 10 fat staves. The sawn tops of the staves stand a little
    // proud of the rim ring, and the foot ring carries the bowl on the floor.
    const wall = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.022],
            [0.112, 0.022],
            [0.124, 0.032],
            [0.136, 0.06],
            [0.15, 0.095],
            [0.163, 0.125],
            [0.172, 0.145],
            [0.176, 0.155],
            [0.176, 0.166],
            [0.174, 0.171],
            [0.164, 0.171],
            [0, 0.171],
          ],
          { smooth: true, samples: 16 },
        ),
      )
      .displace(0.008, staveWave)
      .subtract(
        sdf.revolve(
          profile.polygon(
            [
              [0, 0.045],
              [0.094, 0.045],
              [0.104, 0.052],
              [0.118, 0.072],
              [0.134, 0.098],
              [0.148, 0.122],
              [0.16, 0.142],
              [0.164, 0.156],
              [0.164, 0.21],
              [0, 0.21],
            ],
            { smooth: true, samples: 14 },
          ),
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0.02));
    const rim = sdf.torus(RIM_R, RIM_TUBE).at(0, RIM_Y, 0);
    const foot = sdf
      .cylinder(0.124, 0.024, 0.005)
      .subtract(sdf.cylinder(0.092, 0.06))
      .at(0, 0.012, 0);
    const sawnTop = (i: number) => {
      const a = (i * STEP * Math.PI) / 180;
      return sdf.cylinder(0.009, 0.008, 0.002).at(Math.cos(a) * 0.169, 0.173, Math.sin(a) * 0.169);
    };
    const bowl = sdf
      .union(wall, rim, foot, ...Array.from({ length: STAVES }, (_, i) => sawnTop(i)))
      .scale([X_SCALE, 1, 1])
      .paintFn(woodPaint);
    k.body('basin', bowl, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.0065,
      paintWeight: 2,
      maxError: 0.002,
      maxTriangles: 4200,
      bump: woodBump,
    });

    // ------------------------------------------------------------------- iron
    // Two dark hoops that hug the staves.
    const hoop = (rOuter: number, rInner: number, h: number, y: number) =>
      sdf.cylinder(rOuter, h, 0.004).subtract(sdf.cylinder(rInner, h + 0.02)).at(0, y, 0);
    const iron = sdf
      .union(hoop(0.145, 0.129, 0.019, 0.05), hoop(0.167, 0.15, 0.013, 0.106))
      .scale([X_SCALE, 1, 1])
      .paintFn(ironPaint);
    k.body('hoops', iron, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      maxError: 0.0015,
      maxTriangles: 900,
      bump: ironBump,
    });

    // ------------------------------------------------------------------ water
    // One flat disc of still water, 3 cm below the rim.
    const water = sdf.cylinder(0.155, 0.014, 0.004).at(0, WATER_Y - 0.007, 0).paintFn(waterPaint);
    k.body('water', water, {
      color: '#3fa8c8',
      roughness: 0.1,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 320,
    });

    // ----------------------------------------------------------------- dipper
    // A small cup and a short handle, resting across the rim on the +Z side.
    const cupProfile = profile.polygon(
      [
        [0, 0],
        [0.024, 0],
        [0.034, 0.007],
        [0.039, 0.017],
        [0.035, 0.023],
        [0.028, 0.014],
        [0.018, 0.006],
        [0, 0.006],
      ],
      { smooth: true, samples: 12 },
    );
    const cup = sdf.revolve(cupProfile).at(0.143, 0.158, 0.136);
    const handle = sdf.cone([0.152, 0.166, 0.146], [0.196, 0.1, 0.186], 0.012, 0.008);
    const knob = sdf.sphere(0.013).at(0.196, 0.1, 0.186);
    const dipper = sdf.smoothUnion(0.006, cup, handle, knob).paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 10, z * 40, 2);
      let c = mixRgb(WOOD_HONEY, WOOD_BROWN, 0.35 + 0.3 * grain);
      c = mixRgb(c, WOOD_PALE, 0.35 * clamp01((y - 0.166) / 0.016));
      return c;
    });
    k.body('dipper', dipper, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.0035,
      paintWeight: 2,
      maxTriangles: 600,
      bump: woodBump,
    });
  },
});
