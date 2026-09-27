import { defineAsset, mixRgb, noise, rgb, sdf, profile } from '../src/index.js';

/**
 * Design note — flanged mace (equipment/melee-weapons/mace).
 *
 * Role: medieval flanged mace weapon for the blacksmith-quest cozy chibi scene.
 *   Reads at 128 px as a chunky round iron head with radiating flanges on a
 *   walnut haft with iron bands, leather grip, and a small wooden pommel.
 * Size: 0.6 m tall, standing head-down on y = 0 (the rounded base of the iron
 *   drum touches the ground), centred on the Y axis, faces +Z.
 * One idea: a fat round iron drum-head with six chunky vertical flanges
 *   radiating outward like spokes, on a slender walnut haft bound by two iron
 *   rings, wrapped in a leather grip near the top, with a small flat walnut
 *   pommel at the very top.
 * Shape language: square dominant (chunky iron drum, blocky flanges), organic
 *   secondary (rounded wood, leather wrap, small pommel).
 * Palette: iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5,
 *   metalness 0.7); walnut #6b4226 / #54331d; leather #5e3a1f / #3f2613.
 *   60/30/10.
 * Materials: worn iron (roughness 0.5, metalness 0.7), walnut wood
 *   (roughness 0.8), leather (roughness 0.7).
 * Detail: drum + 6 tall flanges + top rim ring + neck collar + 2 iron bands +
 *   leather grip + small walnut pommel + iron pommel cap. Focal point: the
 *   iron head with its flanges.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#c08a44');
const LEATHER = rgb('#5e3a1f');
const LEATHER_DEEP = rgb('#3f2613');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
// Mace stands head-down on y = 0 (drum base touches the ground).
const HEAD_R = 0.048;          // drum radius
const HEAD_H = 0.140;          // taller drum so flanges read
const HEAD_BOTTOM_Y = 0;       // bottom of drum (touches y = 0)
const HEAD_CENTER_Y = HEAD_BOTTOM_Y + HEAD_H / 2;
const HEAD_TOP_Y = HEAD_BOTTOM_Y + HEAD_H;

const FLANGE_LEN = 0.082;      // chunkier flanges that read at 128 px
const FLANGE_W = 0.030;
const FLANGE_H = 0.140;        // full drum height
const FLANGE_TIP_H = 0.052;    // less tapered tip for a chunkier wedge

const RIM_H = 0.014;           // top rim ring height

const COLLAR_H = 0.026;
const COLLAR_R = 0.028;
const COLLAR_Y = HEAD_TOP_Y + COLLAR_H / 2;

const HAFT_BOTTOM_Y = HEAD_TOP_Y + COLLAR_H;     // 0.166
const HAFT_TOP_Y = 0.555;
const HAFT_R_BOT = 0.019;
const HAFT_R_TOP = 0.017;

const BAND1_CENTER_Y = HAFT_BOTTOM_Y + 0.022;    // just below collar
const BAND1_H = 0.028;
const BAND2_CENTER_Y = 0.520;                    // just above pommel
const BAND2_H = 0.024;

const GRIP_BOTTOM_Y = 0.300;
const GRIP_TOP_Y = 0.420;
const GRIP_R = HAFT_R_BOT + 0.008;       // clearly bulges past the haft

const POMMEL_BOTTOM_Y = HAFT_TOP_Y - 0.001;
const POMMEL_TOP_Y = 0.60;
const POMMEL_DISC_R = 0.030;             // wider, flatter pommel
const POMMEL_DISC_H = 0.018;
const POMMEL_BULB_R = 0.022;

// ------------------------------------------------------------------ paint
// Walnut: warm honey base, fine grain, big tonal patches.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 28, y * 4, z * 28, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.30 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.45 * patch);
  const top = clamp01((y - 0.2) / 0.4);
  c = mixRgb(c, WALNUT_LIGHT, 0.14 * top);
  return c;
};

// Iron: dark base with tarnish patches, lighter top crown, deeper shadowed underside.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 3, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.30 * tarnish);
  const top = clamp01((y - (HEAD_CENTER_Y + 0.020)) / 0.06);
  c = mixRgb(c, IRON_LIGHT, 0.45 * top);
  const bottom = clamp01(((HEAD_BOTTOM_Y + 0.045) - y) / 0.045);
  c = mixRgb(c, IRON_DEEP, 0.32 * bottom);
  return c;
};

export default defineAsset({
  name: 'mace',
  description:
    'Flanged mace, 0.6 m: a chunky round iron drum-head with six tall flanges, a slender walnut haft bound by two iron rings, a leather grip wrap, and a small flat walnut pommel with an iron cap.',
  detail: 0.005,
  reference: 'docs/item-mockups/mace-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ============================================================== iron head
    // Central drum: a short cylinder with rounded edges; the rounded bottom
    // touches y = 0 so the mace stands head-down.
    const drum = sdf.cylinder(HEAD_R, HEAD_H, 0.010).at(0, HEAD_CENTER_Y, 0);

    // Top rim ring: slightly fatter than the drum where the flanges meet it.
    const rimTop = sdf
      .cylinder(HEAD_R + 0.005, RIM_H, 0.004)
      .at(0, HEAD_TOP_Y - RIM_H / 2, 0);

    // Each flange is a chunky wedge: extruded profile tall at the drum, with
    // a slightly tapered outer edge. Six of them, every 60 deg around the drum.
    const flangeProfile = profile.polygon([
      [0.0, -FLANGE_H / 2],
      [FLANGE_LEN * 0.85, -FLANGE_H / 2 + 0.005],
      [FLANGE_LEN, -FLANGE_TIP_H / 2],
      [FLANGE_LEN, FLANGE_TIP_H / 2],
      [FLANGE_LEN * 0.85, FLANGE_H / 2 - 0.005],
      [0.0, FLANGE_H / 2],
    ]);
    const flangeOne = sdf
      .extrude(flangeProfile, FLANGE_W, 0.004)
      .at(HEAD_R - 0.008, HEAD_CENTER_Y, 0);

    let flanges: sdf.Shape = flangeOne;
    for (let i = 1; i < 6; i++) {
      flanges = flanges.union(flangeOne.rotateY(i * 60));
    }

    const head = sdf
      .smoothUnion(0.004, drum, flanges)
      .smoothUnion(0.004, rimTop)
      .paintFn(ironPaint);

    k.body('head', head, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 36, y * 36, z * 36, 2),
      maxTriangles: 850,
    });

    // --------------------------------------------------------------- collar
    // Short iron collar between the drum and the haft, slightly flared.
    const collarShape = sdf
      .cylinder(COLLAR_R, COLLAR_H, 0.005)
      .at(0, COLLAR_Y, 0)
      .smoothUnion(0.005, sdf.sphere(COLLAR_R * 0.9).at(0, COLLAR_Y - COLLAR_H * 0.35, 0))
      .paintFn(ironPaint);
    k.body('collar', collarShape, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 36, z * 40, 2),
      maxTriangles: 200,
    });

    // ============================================================== wooden haft
    // Slender tapered walnut shaft from collar to pommel.
    const haftChain: readonly (readonly [number, number, number, number])[] = [
      [0, HAFT_BOTTOM_Y + 0.003, 0, HAFT_R_BOT],
      [0, HAFT_BOTTOM_Y + 0.20, 0, HAFT_R_BOT - 0.0005],
      [0, GRIP_BOTTOM_Y - 0.005, 0, HAFT_R_BOT - 0.0015],
      [0, GRIP_TOP_Y + 0.005, 0, HAFT_R_BOT - 0.0025],
      [0, HAFT_TOP_Y - 0.05, 0, HAFT_R_TOP],
      [0, HAFT_TOP_Y, 0, HAFT_R_TOP],
    ];
    const haft = sdf.chain(haftChain, 0.011).paintFn(walnutPaint);
    k.body('haft', haft, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 600,
    });

    // ============================================================== iron bands
    // Two iron rings wrapping the haft: one just below the collar, one just
    // above the pommel. Built as separate iron bodies slightly fatter than
    // the wood so they read as visible bands.
    const bandOuterR = HAFT_R_BOT + 0.007;
    const band1 = sdf
      .cylinder(bandOuterR, BAND1_H, 0.004)
      .at(0, BAND1_CENTER_Y, 0)
      .paintFn(ironPaint);
    const band2 = sdf
      .cylinder(bandOuterR, BAND2_H, 0.004)
      .at(0, BAND2_CENTER_Y, 0)
      .paintFn(ironPaint);
    k.body('bands', sdf.union(band1, band2), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 250,
    });

    // ============================================================== leather grip
    // Leather wrap around the haft in the middle: a clearly bulging capsule
    // with darker edges and a faint spiral seam via bump.
    const grip = sdf
      .capsule([0, GRIP_BOTTOM_Y, 0], [0, GRIP_TOP_Y, 0], GRIP_R)
      .paintFn((x, y, z) => {
        const yn = (y - GRIP_BOTTOM_Y) / (GRIP_TOP_Y - GRIP_BOTTOM_Y);
        const edge = clamp01(Math.min(yn, 1 - yn) / 0.16);
        let c = LEATHER;
        const n = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
        c = mixRgb(c, LEATHER_DEEP, 0.34 * n);
        return mixRgb(LEATHER_DEEP, c, edge);
      });
    k.body('grip', grip, {
      color: '#5e3a1f',
      roughness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0014 * Math.abs(Math.sin(Math.atan2(z, x) + (y - GRIP_BOTTOM_Y) * 95)),
      maxTriangles: 200,
    });

    // ============================================================== pommel
    // Small flat walnut pommel: a wider disc base + a low dome bulb, with an
    // iron cap on top so the tip reads metal.
    const pommelBase = sdf
      .cylinder(POMMEL_DISC_R, POMMEL_DISC_H, 0.003)
      .at(0, POMMEL_BOTTOM_Y + POMMEL_DISC_H / 2, 0);
    const pommelBulb = sdf
      .ellipsoid([POMMEL_BULB_R, POMMEL_BULB_R * 0.65, POMMEL_BULB_R])
      .at(0, POMMEL_BOTTOM_Y + POMMEL_DISC_H + POMMEL_BULB_R * 0.55, 0);
    const pommelWood = sdf
      .smoothUnion(0.004, pommelBase, pommelBulb)
      .paintFn(walnutPaint);
    k.body('pommel', pommelWood, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 240,
    });

    // Iron cap on top of the pommel so the tip reads as metal.
    const pommelCap = sdf
      .ellipsoid([0.016, 0.009, 0.016])
      .at(0, POMMEL_TOP_Y - 0.008, 0)
      .paintFn(ironPaint);
    k.body('pommel-cap', pommelCap, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 100,
    });
  },
});