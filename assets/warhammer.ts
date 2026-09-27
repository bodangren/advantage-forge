import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — warhammer (equipment/melee-weapons/warhammer).
 *
 * Role: a chibi-quest warhammer wielded by the knight; reads at 128 px as a
 *   square iron hammer-head with a top spike and two side spikes, mounted on
 *   a chunky wooden haft bound by iron rings and wrapped in a leather grip.
 * Size: 0.8 m tall, standing on its rounded wooden pommel at y = 0,
 *   centred on the Y axis, front (flat striking face) toward +Z.
 * One idea: a fat cube of iron studded with rivets in a 3x3 grid, crowned by
 *   a bright steel spike, with two short dark spikes jutting from its left
 *   and right faces, on a stout honey-oak haft that has a vase-shaped bulge
 *   just below the head, bound by iron rings, and wraps a leather grip near
 *   the pommel.
 * Shape language: square dominant (blocky iron head, square strike face,
 *   blocky studs), organic secondary (rounded haft bulge, leather bumps,
 *   rounded pommel).
 * Palette: iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5,
 *   metalness 0.7); steel edge #c8ccd2 (top spike, roughness 0.3,
 *   metalness 1); honey oak #b5814a / #6b4226 / pale cut wood #c9a06a;
 *   leather #8a5a35 / #5c3a22; dark walnut #6b4226 for the pommel. 60/30/10.
 * Materials: worn iron (roughness 0.5, metalness 0.7), polished steel
 *   (roughness 0.3, metalness 1), honey-oak wood (roughness 0.8), leather
 *   (roughness 0.7), dark-walnut pommel (roughness 0.8).
 * Detail: cube head + top spike + 2 side spikes + 9 rivets on the strike
 *   face + neck collar + iron bands on haft + leather grip with wrap bumps
 *   + rounded pommel. Focal point: the riveted iron head with its crown
 *   spike.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#5a606a');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#bcc1c8');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');

const OAK = rgb('#b5814a');
const OAK_DEEP = rgb('#6b4226');
const OAK_PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');

const LEATHER = rgb('#8a5a35');
const LEATHER_DEEP = rgb('#5c3a22');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
// Hammer stands pommel-down on y = 0, head at top.
const HEAD_SIZE = 0.18;              // cube edge length
const HEAD_BOTTOM_Y = 0.620;         // bottom face of the iron cube
const HEAD_CENTER_Y = HEAD_BOTTOM_Y + HEAD_SIZE / 2; // 0.710
const HEAD_RADIUS = 0.012;           // soft bevels everywhere

const TOP_SPIKE_LEN = 0.045;         // shorter, stubbier cone
const TOP_SPIKE_R_BOT = 0.024;
const TOP_SPIKE_R_TOP = 0.0;
const TOP_SPIKE_BOT_Y = HEAD_BOTTOM_Y + HEAD_SIZE; // 0.80

const SIDE_SPIKE_LEN = 0.095;
const SIDE_SPIKE_R_OUT = 0.005;
const SIDE_SPIKE_R_IN = 0.028;
const SIDE_SPIKE_CENTER_Y = HEAD_CENTER_Y;

// Rivets on the strike face (+Z), in a 3x3 grid on the front plate.
const RIVET_R = 0.011;
const RIVET_OFFSET = 0.044;
const RIVETS: readonly (readonly [number, number])[] = [
  [-RIVET_OFFSET, HEAD_CENTER_Y + RIVET_OFFSET],
  [0, HEAD_CENTER_Y + RIVET_OFFSET],
  [RIVET_OFFSET, HEAD_CENTER_Y + RIVET_OFFSET],
  [-RIVET_OFFSET, HEAD_CENTER_Y],
  [0, HEAD_CENTER_Y],
  [RIVET_OFFSET, HEAD_CENTER_Y],
  [-RIVET_OFFSET, HEAD_CENTER_Y - RIVET_OFFSET],
  [0, HEAD_CENTER_Y - RIVET_OFFSET],
  [RIVET_OFFSET, HEAD_CENTER_Y - RIVET_OFFSET],
];

// Neck collar: a short iron ring just below the head where the haft enters.
const COLLAR_H = 0.022;
const COLLAR_R = 0.030;
const COLLAR_CENTER_Y = HEAD_BOTTOM_Y - COLLAR_H / 2;

// Haft: a vase-shaped bulge near the head, then tapering toward the grip.
const HAFT_TOP_Y = HEAD_BOTTOM_Y - 0.001;
const HAFT_BOT_Y = 0.220;
const HAFT_R = 0.020;
const HAFT_BULGE_TOP_R = 0.020;
const HAFT_BULGE_R = 0.038;          // pronounced vase bulge
const HAFT_BULGE_Y = HEAD_BOTTOM_Y - 0.050;

// Two iron bands on the haft, between the bulge and the grip.
const BAND1_CENTER_Y = HEAD_BOTTOM_Y - 0.250;  // just above the grip
const BAND2_CENTER_Y = HEAD_BOTTOM_Y - 0.330;  // below band 1
const BAND_H = 0.022;
const BAND_R = 0.032;  // larger than the slim haft section so the bands read

// Leather grip wrap near the pommel.
const GRIP_BOTTOM_Y = 0.060;
const GRIP_TOP_Y = 0.205;
const GRIP_R = 0.026;

// Rounded walnut pommel that touches y = 0.
const POMMEL_R = 0.032;
const POMMEL_CENTER_Y = POMMEL_R;    // bottom of pommel touches y = 0

// ------------------------------------------------------------------ paint
// Iron: lighter base than the literal hex to match the chibi-quest
// blue-gray, with tarnish patches, a brighter top crown, a deeper shadowed
// underside, brighter rivets and side spikes.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 3, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.22 * tarnish);
  // Overall brightening on the front and sides of the cube so the head reads
  // as a light blue-gray (the chibi-quest palette) rather than near-black.
  const face = clamp01((Math.abs(z) - (HEAD_SIZE / 2 - 0.030)) / 0.030);
  c = mixRgb(c, IRON_LIGHT, 0.40 * face);
  // Top crown highlight (lighter on top of the cube).
  const top = clamp01((y - (HEAD_CENTER_Y + 0.04)) / 0.06);
  c = mixRgb(c, IRON_LIGHT, 0.30 * top);
  // Bottom shadow.
  const bottom = clamp01(((COLLAR_CENTER_Y - 0.005) - y) / 0.04);
  c = mixRgb(c, IRON_DEEP, 0.30 * bottom);
  return c;
};

// Steel for the top spike and rivets: bright polished steel with a touch of
// darker sheen noise.
const steelPaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  const sheen = 0.5 + 0.5 * noise.fbm(x * 28, y * 28, z * 28, 2);
  c = mixRgb(c, STEEL_DEEP, 0.26 * sheen);
  // Subtle vertical brightening so the spike reads as a bright tip.
  const tip = clamp01((y - (HEAD_CENTER_Y + HEAD_SIZE / 2 + 0.012)) / 0.030);
  c = mixRgb(c, STEEL, 0.35 * tip);
  return c;
};

// Honey-oak: warm honey base with grain, top sunlit, bottom shadowed.
const oakPaint = (x: number, y: number, z: number) => {
  let c = OAK;
  const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 4, z * 22, 2);
  c = mixRgb(c, OAK_DEEP, 0.30 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, OAK_PALE, 0.28 * patch);
  const top = clamp01((y - 0.25) / 0.4);
  c = mixRgb(c, OAK_PALE, 0.14 * top);
  const low = clamp01((0.05 - y) / 0.10);
  c = mixRgb(c, OAK_DEEP, 0.45 * low);
  return c;
};

// Walnut for the pommel (slightly cooler / browner than the honey-oak haft).
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 26, y * 4, z * 26, 2);
  c = mixRgb(c, OAK_DEEP, 0.40 * grain * grain);
  const top = clamp01((y - 0.02) / 0.04);
  c = mixRgb(c, OAK_PALE, 0.18 * top);
  return c;
};

// Leather: dark warm brown, slightly lighter on the raised bumps of the wrap.
const leatherPaint = (x: number, y: number, z: number) => {
  let c = LEATHER;
  const wear = 0.5 + 0.5 * noise.fbm(x * 18 + 7, y * 18, z * 18, 2);
  c = mixRgb(c, LEATHER_DEEP, 0.30 * wear);
  const top = clamp01((y - 0.10) / 0.10);
  c = mixRgb(c, OAK_PALE, 0.08 * top);
  return c;
};

export default defineAsset({
  name: 'warhammer',
  description:
    'Warhammer, 0.8 m: a square iron hammer-head studded with rivets and crowned by a steel spike, with two dark side spikes, on a stout honey-oak haft bound by iron rings and wrapped in a leather grip near a rounded walnut pommel.',
  detail: 0.005,
  reference: 'docs/item-mockups/warhammer-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ============================================================== iron head
    // Main cube body of the head with a soft bevel.
    const headCube = sdf
      .box([HEAD_SIZE, HEAD_SIZE, HEAD_SIZE], HEAD_RADIUS)
      .at(0, HEAD_CENTER_Y, 0);

    // Top spike: a short stubby steel cone pointing up from the top face.
    const topSpike = sdf
      .cone(
        [0, TOP_SPIKE_BOT_Y, 0],
        [0, TOP_SPIKE_BOT_Y + TOP_SPIKE_LEN, 0],
        TOP_SPIKE_R_BOT,
        TOP_SPIKE_R_TOP,
      )
      .paintFn(steelPaint);

    // Side spikes: short dark cones jutting left (-X) and right (+X) from the
    // mid-height of the head.
    const sideSpikeL = sdf
      .cone(
        [-HEAD_SIZE / 2 + 0.005, SIDE_SPIKE_CENTER_Y, 0],
        [-HEAD_SIZE / 2 - SIDE_SPIKE_LEN + 0.005, SIDE_SPIKE_CENTER_Y, 0],
        SIDE_SPIKE_R_IN,
        SIDE_SPIKE_R_OUT,
      )
      .paintFn(ironPaint);
    const sideSpikeR = sdf
      .cone(
        [HEAD_SIZE / 2 - 0.005, SIDE_SPIKE_CENTER_Y, 0],
        [HEAD_SIZE / 2 + SIDE_SPIKE_LEN - 0.005, SIDE_SPIKE_CENTER_Y, 0],
        SIDE_SPIKE_R_IN,
        SIDE_SPIKE_R_OUT,
      )
      .paintFn(ironPaint);

    // Rivets on the strike face (+Z), in a 3x3 grid.
    const rivetShape = (rx: number, ry: number) =>
      sdf.sphere(RIVET_R).at(rx, ry, HEAD_SIZE / 2 + 0.002);
    const rivets = sdf
      .union(...RIVETS.map(([rx, ry]) => rivetShape(rx, ry)))
      .paintFn(steelPaint);

    const head = headCube
      .smoothUnion(0.004, sideSpikeL)
      .smoothUnion(0.004, sideSpikeR)
      .paintFn(ironPaint);

    k.body('head', head, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 36, y * 36, z * 36, 2),
      maxTriangles: 700,
    });

    k.body('top-spike', topSpike, {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 200,
    });

    k.body('rivets', rivets, {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 80, y * 80, z * 80, 2),
      maxTriangles: 220,
    });

    // ============================================================== neck collar
    // Short iron ring where the haft enters the head.
    const collar = sdf
      .cylinder(COLLAR_R, COLLAR_H, 0.004)
      .at(0, COLLAR_CENTER_Y, 0)
      .paintFn(ironPaint);
    k.body('collar', collar, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 120,
    });

    // ============================================================== haft
    // Honey-oak shaft with a pronounced vase-shaped bulge just below the head,
    // tapering toward the grip. Use many chain points so the bulge is round.
    const haft = sdf
      .chain(
        [
          [0, HAFT_BOT_Y, 0, HAFT_R - 0.001],
          [0, HAFT_BOT_Y + 0.040, 0, HAFT_R],
          [0, HEAD_BOTTOM_Y - 0.110, 0, HAFT_BULGE_R - 0.004],
          [0, HEAD_BOTTOM_Y - 0.080, 0, HAFT_BULGE_R],
          [0, HAFT_BULGE_Y, 0, HAFT_BULGE_R],
          [0, HEAD_BOTTOM_Y - 0.030, 0, HAFT_BULGE_TOP_R + 0.002],
          [0, HAFT_TOP_Y, 0, HAFT_BULGE_TOP_R],
        ],
        0.025,
      )
      .paintFn(oakPaint);
    k.body('haft', haft, {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 600,
    });

    // ============================================================== iron bands
    // Two iron rings wrapping the haft, between the bulge and the grip.
    const band1 = sdf
      .cylinder(BAND_R, BAND_H, 0.004)
      .at(0, BAND1_CENTER_Y, 0)
      .paintFn(ironPaint);
    const band2 = sdf
      .cylinder(BAND_R, BAND_H, 0.004)
      .at(0, BAND2_CENTER_Y, 0)
      .paintFn(ironPaint);
    k.body('bands', sdf.union(band1, band2), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 200,
    });

    // ============================================================== leather grip
    // A clearly bulging capsule with four fat wrap coils stacked vertically.
    // The mockup's grip is a row of fat leather coils, so we keep them
    // distinctly raised rather than melting into the capsule.
    const gripBase = sdf
      .capsule([0, GRIP_BOTTOM_Y, 0], [0, GRIP_TOP_Y, 0], GRIP_R)
      .paintFn(leatherPaint);
    // Four distinct fat wrap coils.
    const WRAP_BUMP_COUNT = 4;
    const WRAP_GAP = (GRIP_TOP_Y - GRIP_BOTTOM_Y) / WRAP_BUMP_COUNT;
    const WRAP_BUMP_R = 0.012;
    const WRAP_TUBE_R = GRIP_R + 0.008;
    const wrapBump = (i: number) =>
      sdf
        .torus(WRAP_TUBE_R, WRAP_BUMP_R)
        .rotateX(90)
        .at(0, GRIP_BOTTOM_Y + WRAP_GAP * (i + 0.5), 0)
        .paintFn(leatherPaint);
    const grip = sdf
      .union(gripBase, ...Array.from({ length: WRAP_BUMP_COUNT }, (_, i) => wrapBump(i)));
    k.body('grip', grip, {
      color: '#8a5a35',
      roughness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0014 * Math.abs(Math.sin(Math.atan2(z, x) + (y - GRIP_BOTTOM_Y) * 95)),
      maxTriangles: 320,
    });

    // ============================================================== pommel
    // Rounded dark-walnut pommel that touches y = 0 exactly.
    const pommel = sdf
      .sphere(POMMEL_R)
      .at(0, POMMEL_CENTER_Y, 0)
      .paintFn(walnutPaint);
    k.body('pommel', pommel, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 220,
    });
  },
});