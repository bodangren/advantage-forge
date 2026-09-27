import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — club (equipment/melee-weapons/club).
 *
 * Role: chibi-quest crude wooden club for goblins, brutes, and bandit thugs;
 *   reads at 128 px as a fat gnarled honey-oak head studded with two iron
 *   rivets on the front face, mounted on a thinner walnut haft bound by a
 *   short iron collar and wrapped in a chunky leather grip, capped by a
 *   small round walnut pommel.
 * Size: 0.7 m tall, standing head-down on y = 0 (rounded bottom of the head
 *   touches the ground), centred on the Y axis, front (studs) toward +Z.
 * One idea: a fat rounded chunky wooden head with subtle knot bumps so it
 *   reads as a gnarled tree-limb block, two iron rivets on the front face as
 *   the only metal on the head, then a thinner shaft bound by an iron collar
 *   and wrapped in leather for a confident grip.
 * Shape language: square dominant (blocky gnarled head, flat-front iron
 *   rivets, ring-like collar), organic secondary (rounded wood, leather wrap,
 *   round pommel).
 * Palette: iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5,
 *   metalness 0.7); wood honey oak #b5814a / #8a5a35 / pale cut wood #c9a06a;
 *   dark walnut #6b4226 for the haft and pommel; leather #8a5a35 / #5c3a22
 *   for the grip. 60/30/10.
 * Materials: worn iron (roughness 0.5, metalness 0.7), honey-oak wood
 *   (roughness 0.8), dark-walnut haft (roughness 0.8), leather grip
 *   (roughness 0.7).
 * Detail: chunky head + 4 wood knot bumps + 2 iron rivets + short iron
 *   collar + walnut haft + leather grip + round walnut pommel. Focal point:
 *   the gnarled head with its two iron rivets.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');

const OAK = rgb('#b5814a');
const OAK_DEEP = rgb('#8a5a35');
const OAK_PALE = rgb('#c9a06a');

const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a5c36');

const LEATHER = rgb('#8a5a35');
const LEATHER_DEEP = rgb('#5c3a22');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
// Club stands head-down on y = 0 (rounded bottom of head touches ground).
const HEAD_W = 0.155;              // X size of the head (left-right)
const HEAD_H = 0.190;              // Y size of the head (height of the chunky part)
const HEAD_D = 0.135;              // Z size of the head (front-back)
const HEAD_R = 0.022;              // soft bevel so the head reads as chunky, not sharp
const HEAD_BOTTOM_Y = 0;           // bottom of head touches y = 0
const HEAD_CENTER_Y = HEAD_BOTTOM_Y + HEAD_H / 2;
const HEAD_TOP_Y = HEAD_BOTTOM_Y + HEAD_H;

// Six wood knot bumps on the head for a clearly gnarled silhouette.
const KNOT_R = 0.030;
const KNOT_OFFSETS: readonly (readonly [number, number, number, number])[] = [
  [-HEAD_W * 0.28, HEAD_CENTER_Y + HEAD_H * 0.28, HEAD_D / 2 - 0.008, 1.0],
  [HEAD_W * 0.32, HEAD_CENTER_Y + HEAD_H * 0.12, HEAD_D / 2 - 0.008, 0.85],
  [-HEAD_W * 0.34, HEAD_CENTER_Y - HEAD_H * 0.18, HEAD_D / 2 - 0.008, 0.95],
  [HEAD_W * 0.28, HEAD_CENTER_Y - HEAD_H * 0.32, HEAD_D / 2 - 0.008, 1.05],
  [-HEAD_W * 0.32, HEAD_CENTER_Y + HEAD_H * 0.30, -HEAD_D / 2 + 0.008, 0.90],
  [HEAD_W * 0.34, HEAD_CENTER_Y - HEAD_H * 0.22, -HEAD_D / 2 + 0.008, 0.80],
];

// Two iron rivets on the front face (+Z): one upper, one lower.
const RIVET_R = 0.015;
const RIVET_FRONT_Z = HEAD_D / 2 + 0.002;
const RIVETS: readonly (readonly [number, number])[] = [
  [0, HEAD_CENTER_Y + HEAD_H * 0.24],
  [0, HEAD_CENTER_Y - HEAD_H * 0.20],
];

// Iron collar between head and haft.
const COLLAR_H = 0.026;
const COLLAR_R = 0.030;
const COLLAR_CENTER_Y = HEAD_TOP_Y + COLLAR_H / 2;

// Walnut haft: thinner tapered shaft going up from collar to pommel base.
// Slight per-segment variation so the wood looks twisted/gnarled, not
// perfectly cylindrical.
const HAFT_BOT_Y = HEAD_TOP_Y + COLLAR_H + 0.002; // ~0.218
const HAFT_TOP_Y = 0.640;
const HAFT_R_BOT = 0.021;
const HAFT_R_MID1 = 0.019;
const HAFT_R_MID2 = 0.022;
const HAFT_R_MID3 = 0.020;
const HAFT_R_TOP = 0.026;

// Leather grip wrap covers only the middle portion so wood is visible on
// both ends. Three wide wrap coils for a clearly wrapped grip.
const GRIP_BOTTOM_Y = 0.310;
const GRIP_TOP_Y = 0.500;
const GRIP_R = 0.027;

// Round walnut pommel that caps the top.
const POMMEL_R = 0.038;
const POMMEL_CENTER_Y = HAFT_TOP_Y + POMMEL_R * 0.60;

// ------------------------------------------------------------------ paint
// Honey-oak: warm honey base with grain and value variation, top sunlit.
const oakPaint = (x: number, y: number, z: number) => {
  let c = OAK;
  const grain = 0.5 + 0.5 * noise.fbm(x * 26, y * 4, z * 26, 2);
  c = mixRgb(c, OAK_DEEP, 0.34 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, OAK_PALE, 0.30 * patch);
  const top = clamp01((y - (HEAD_CENTER_Y + 0.04)) / 0.06);
  c = mixRgb(c, OAK_PALE, 0.18 * top);
  const low = clamp01((0.045 - y) / 0.06);
  c = mixRgb(c, OAK_DEEP, 0.42 * low);
  return c;
};

// Dark walnut for the haft and pommel: warmer brown, deeper shadows.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 5, z * 22, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.30 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 11, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.20 * patch);
  const top = clamp01((y - 0.20) / 0.45);
  c = mixRgb(c, WALNUT_LIGHT, 0.14 * top);
  const low = clamp01((0.20 - y) / 0.05);
  c = mixRgb(c, WALNUT_DEEP, 0.35 * low);
  return c;
};

// Iron: dark base with tarnish, lighter top, deeper shadowed underside.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 3, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.30 * tarnish);
  const top = clamp01((y - (HEAD_CENTER_Y + 0.030)) / 0.06);
  c = mixRgb(c, IRON_LIGHT, 0.40 * top);
  const bottom = clamp01(((COLLAR_CENTER_Y - 0.005) - y) / 0.04);
  c = mixRgb(c, IRON_DEEP, 0.32 * bottom);
  return c;
};

// Leather: warm brown with wear and a brighter top band.
const leatherPaint = (x: number, y: number, z: number) => {
  let c = LEATHER;
  const wear = 0.5 + 0.5 * noise.fbm(x * 18 + 7, y * 18, z * 18, 2);
  c = mixRgb(c, LEATHER_DEEP, 0.32 * wear);
  const yn = (y - GRIP_BOTTOM_Y) / (GRIP_TOP_Y - GRIP_BOTTOM_Y);
  const edge = clamp01(Math.min(yn, 1 - yn) / 0.18);
  c = mixRgb(LEATHER_DEEP, c, edge);
  return c;
};

export default defineAsset({
  name: 'club',
  description:
    'Crude wooden club, 0.7 m: a fat gnarled honey-oak head with two iron rivets on the front face, mounted on a thinner walnut haft bound by a short iron collar and wrapped in a chunky leather grip, capped by a round walnut pommel.',
  detail: 0.005,
  reference: 'docs/item-mockups/club-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ============================================================== wooden head
    // Main chunky rounded box.
    const headBox = sdf
      .box([HEAD_W, HEAD_H, HEAD_D], HEAD_R)
      .at(0, HEAD_CENTER_Y, 0);

    // Six wood knot bumps on the head for a clearly gnarled silhouette.
    let knots: sdf.Shape = sdf
      .sphere(KNOT_R * KNOT_OFFSETS[0][3])
      .at(KNOT_OFFSETS[0][0], KNOT_OFFSETS[0][1], KNOT_OFFSETS[0][2]);
    for (let i = 1; i < KNOT_OFFSETS.length; i++) {
      const [kx, ky, kz, ks] = KNOT_OFFSETS[i];
      knots = knots.union(sdf.sphere(KNOT_R * ks).at(kx, ky, kz));
    }

    const headWood = sdf
      .smoothUnion(0.010, headBox, knots)
      .paintFn(oakPaint);

    k.body('head', headWood, {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 1100,
    });

    // ============================================================== iron rivets
    // Two domed iron studs on the front face (+Z). Built as flattened
    // ellipsoids so they read as round, slightly domed rivets not perfect
    // spheres.
    const rivet = (ry: number) =>
      sdf
        .ellipsoid([RIVET_R, RIVET_R, RIVET_R * 0.55])
        .at(0, ry, RIVET_FRONT_Z + RIVET_R * 0.45)
        .paintFn(ironPaint);
    const rivets = sdf
      .union(rivet(RIVETS[0][1]), rivet(RIVETS[1][1]))
      .paintFn(ironPaint);

    k.body('rivets', rivets, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 50, y * 50, z * 50, 2),
      maxTriangles: 220,
    });

    // ============================================================== iron collar
    // Short iron ring just above the head where the haft enters.
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
      maxTriangles: 160,
    });

    // ============================================================== walnut haft
    // Thin tapered walnut shaft from collar up to pommel base. Slight radius
    // variation gives the wood a subtle twisted/gnarled look, not a perfect
    // cylinder.
    const haft = sdf
      .chain(
        [
          [0, HAFT_BOT_Y, 0, HAFT_R_BOT],
          [0, HAFT_BOT_Y + 0.025, 0, HAFT_R_MID1],
          [0, HAFT_BOT_Y + 0.060, 0, HAFT_R_MID2],
          [0, HAFT_BOT_Y + 0.105, 0, HAFT_R_MID3],
          [0, GRIP_BOTTOM_Y - 0.010, 0, HAFT_R_MID2 - 0.001],
          [0, GRIP_TOP_Y + 0.010, 0, HAFT_R_MID3 + 0.002],
          [0, HAFT_TOP_Y - 0.015, 0, HAFT_R_TOP - 0.002],
          [0, HAFT_TOP_Y, 0, HAFT_R_TOP],
        ],
        0.018,
      )
      .paintFn(walnutPaint);

    k.body('haft', haft, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 500,
    });

    // ============================================================== leather grip
    // A clearly wrapped leather grip: a slim capsule base plus three wide
    // wrap coils stacked vertically. The coils bulge past the haft so the
    // wrap reads as distinct straps.
    const gripBase = sdf
      .capsule([0, GRIP_BOTTOM_Y, 0], [0, GRIP_TOP_Y, 0], GRIP_R - 0.002)
      .paintFn(leatherPaint);
    const WRAP_COUNT = 3;
    const WRAP_GAP = (GRIP_TOP_Y - GRIP_BOTTOM_Y) / WRAP_COUNT;
    const WRAP_BUMP_R = 0.011;
    const WRAP_TUBE_R = GRIP_R + 0.005;
    const wrapCoil = (i: number) =>
      sdf
        .torus(WRAP_TUBE_R, WRAP_BUMP_R)
        .rotateX(90)
        .at(0, GRIP_BOTTOM_Y + WRAP_GAP * (i + 0.5), 0)
        .paintFn(leatherPaint);
    const grip = sdf.union(
      gripBase,
      ...Array.from({ length: WRAP_COUNT }, (_, i) => wrapCoil(i)),
    );

    k.body('grip', grip, {
      color: '#8a5a35',
      roughness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0014 * Math.abs(Math.sin(Math.atan2(z, x) + (y - GRIP_BOTTOM_Y) * 85)),
      maxTriangles: 380,
    });

    // ============================================================== pommel
    // Round walnut knob that caps the top of the haft. Sits above the grip.
    const pommel = sdf
      .ellipsoid([POMMEL_R, POMMEL_R * 0.85, POMMEL_R])
      .at(0, POMMEL_CENTER_Y, 0)
      .paintFn(walnutPaint);

    k.body('pommel', pommel, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 240,
    });
  },
});