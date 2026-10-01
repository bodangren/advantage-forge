import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Profile } from '../src/sdf/profile.js';

/**
 * Design note — double-bit battle axe (equipment/melee-weapons/battle-axe).
 *
 * Role: melee weapon for the blacksmith-quest cozy chibi scene; the icon and
 *   held weapon must read at 128 px.
 * Size: 0.9 m tall, standing head-down on y = 0 (the lower crescent horns touch
 *   the ground), centred on the Y axis, flat of the blades facing +Z.
 * One idea: two oversized crescent steel blades whose horns curl inward past a
 *   compact iron eye; a narrow iron neck joins blade to eye, so the crescent
 *   bite is the silhouette feature.
 * Shape language: crescent dominant (the dangerous curved blades), rounded
 *   organic secondary (haft, grip, top knob).
 * Palette: steel #c8ccd2 / #8e959e (blades); iron #4a4f55 / #363a3f with
 *   highlight #a8acb1 (eye, collar, bands, ferrule, cap); walnut #6b4226 /
 *   #54331d (haft, top knob); leather #5e3a1f / #3f2613 (grip). 60/30/10.
 * Materials: polished steel (roughness 0.3, metalness 1), worn iron
 *   (roughness 0.5, metalness 0.7), walnut (roughness 0.8), leather
 *   (roughness 0.7).
 * Detail: primary = two crescent blades + iron eye + neck; secondary = collar,
 *   iron bands, ferrule, top knob + iron cap; tertiary = forge grain, wood
 *   grain, and a leather spiral in `bump`. Focal point: the bright crescent
 *   cutting edges.
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
const LEATHER = rgb('#53331c');
const LEATHER_DEEP = rgb('#33200f');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
const HEAD_CY = 0.118; // blade/eye centre (lower horn tips land on y = 0)
const BLADE_T = 0.050; // max blade thickness along Z
const BLADE_W = 0.336; // lens zero-width span along X

// Crescent = lune of two circles on the x axis: keep the outer circle, cut the
// inner one. The horns fall where the two circles cross.
const OUT_CX = 0.042;
const OUT_R = 0.118; // outer cutting edge reaches x = 0.160
const CUT_CX = -0.041;
const CUT_R = 0.146;
const HORN_Y = 0.118;

const HAFT_TOP_Y = 0.845;
const HAFT_R = 0.0185;

const GRIP_Y0 = 0.420;
const GRIP_Y1 = 0.560;
const GRIP_R = 0.0275;

const FERRULE_Y0 = 0.755;
const FERRULE_Y1 = 0.815;
const KNOB_Y = 0.845;
const KNOB_R = 0.031;

// ------------------------------------------------------------------ paint
// Walnut: warm honey base, fine grain, big tonal patches, sun-lit top.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 28, y * 4, z * 28, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.32 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.45 * patch);
  const top = clamp01((y - 0.25) / 0.5);
  c = mixRgb(c, WALNUT_LIGHT, 0.16 * top);
  return c;
};

// Iron: dark base with tarnish patches, a lighter crown, a deeper underside.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 3, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.32 * tarnish);
  const top = clamp01((y - 0.28) / 0.30);
  c = mixRgb(c, IRON_LIGHT, 0.22 * top);
  const low = clamp01((0.18 - y) / 0.16);
  c = mixRgb(c, IRON_DEEP, 0.30 * low);
  return c;
};

// Steel: dark forged web with a bright polished cutting edge, so the crescent
// reads as a dark blade with a shining rim (as in the mockup).
const steelPaint = (x: number, y: number, z: number) => {
  const r = Math.abs(x);
  const edge = clamp01((r - 0.10) / 0.055);
  let c = mixRgb(STEEL_DEEP, STEEL, 0.15 + 0.85 * edge);
  c = mixRgb(c, IRON, 0.5 * (1 - edge));
  const sheen = 0.5 + 0.5 * noise.fbm(x * 17, y * 17, z * 17, 2);
  c = mixRgb(c, STEEL_DEEP, 0.14 * sheen);
  return c;
};

export default defineAsset({
  name: 'battle-axe',
  description:
    'Double-bit battle axe, 0.9 m: two crescent steel blades with inward-curling horns on a compact iron eye and flared collar, above a walnut haft with a fat leather grip, an iron ferrule, and a rounded walnut top, standing head-down on y = 0.',
  detail: 0.004,
  reference: 'docs/item-mockups/battle-axe-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.49, 0], rotate: [0, 0, 180] },

  build(k) {
    // ============================================================== steel blades
    const crescent: Profile = {
      dist: (u, v) =>
        Math.max(
          Math.hypot(u - OUT_CX, v) - OUT_R,
          CUT_R - Math.hypot(u - CUT_CX, v),
        ),
      bounds: [-0.08, -HORN_Y - 0.01, OUT_CX + OUT_R + 0.01, HORN_Y + 0.01],
    };

    // Lens cross-section: two upright cylinders offset along Z keep the blade
    // thick at the eye and thin at the outer cutting edge.
    const LENS_R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const LENS_C = LENS_R - BLADE_T / 2;
    const lens = sdf.intersect(
      sdf.cylinder(LENS_R, 0.6).at(0, HEAD_CY, LENS_C),
      sdf.cylinder(LENS_R, 0.6).at(0, HEAD_CY, -LENS_C),
    );

    const blade = sdf
      .extrude(crescent, 0.2, 0.005)
      .intersect(lens)
      .at(0, HEAD_CY, 0)
      .mirror('x', 0)
      .paintFn(steelPaint);

    k.body('blades', blade, {
      color: '#8e959e',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 320, y * 30, z * 320, 2),
      maxTriangles: 1200,
    });

    // ============================================================== iron head
    // Compact eye block (wider than tall), a narrow horizontal neck reaching to
    // each blade, and a vertical neck rising into a flared collar.
    const eye = sdf
      .smoothUnion(
        0.012,
        sdf.box([0.128, 0.13, 0.074], 0.028).at(0, HEAD_CY, 0),
        sdf.box([0.25, 0.062, 0.058], 0.024).at(0, HEAD_CY, 0),
        sdf.cylinder(0.030, 0.16, 0.008).at(0, HEAD_CY + 0.07, 0),
      );
    const collar = sdf
      .cylinder(0.041, 0.056, 0.010)
      .at(0, 0.230, 0)
      .smoothUnion(0.008, sdf.cone([0, 0.252, 0], [0, 0.310, 0], 0.036, 0.024));
    const ironHead = sdf.smoothUnion(0.012, eye, collar).paintFn(ironPaint);

    k.body('iron', ironHead, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 36, y * 36, z * 36, 2),
      maxTriangles: 850,
    });

    // ============================================================== walnut haft
    const haft = sdf
      .chain(
        [
          [0, 0.175, 0, HAFT_R + 0.002],
          [0, 0.300, 0, HAFT_R + 0.001],
          [0, GRIP_Y0 - 0.01, 0, HAFT_R],
          [0, GRIP_Y1 + 0.01, 0, HAFT_R],
          [0, FERRULE_Y0, 0, HAFT_R - 0.0005],
          [0, HAFT_TOP_Y, 0, HAFT_R - 0.001],
        ],
        0.012,
      )
      .paintFn(walnutPaint);
    k.body('haft', haft, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 550,
    });

    // ============================================================== leather grip
    const grip = sdf
      .capsule([0, GRIP_Y0, 0], [0, GRIP_Y1, 0], GRIP_R)
      .paintFn((x, y, z) => {
        const yn = (y - GRIP_Y0) / (GRIP_Y1 - GRIP_Y0);
        const edge = clamp01(Math.min(yn, 1 - yn) / 0.16);
        const n = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
        return mixRgb(LEATHER_DEEP, mixRgb(LEATHER, LEATHER_DEEP, 0.34 * n), edge);
      });
    k.body('grip', grip, {
      color: '#5e3a1f',
      roughness: 0.7,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + (y - GRIP_Y0) * 95)),
      maxTriangles: 200,
    });

    // ============================================================== iron fittings
    const band = sdf.cylinder(HAFT_R + 0.008, 0.028, 0.004).at(0, 0.300, 0);
    const ferrule = sdf.cone([0, FERRULE_Y0, 0], [0, FERRULE_Y1, 0], HAFT_R + 0.004, KNOB_R - 0.004);
    const cap = sdf.ellipsoid([0.024, 0.015, 0.024]).at(0, KNOB_Y + 0.022, 0);
    const fittings = sdf.union(band, ferrule, cap).paintFn(ironPaint);
    k.body('fittings', fittings, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 350,
    });

    // ============================================================== walnut top
    const knob = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(KNOB_R).at(0, KNOB_Y, 0),
        sdf.cylinder(KNOB_R - 0.004, 0.03, 0.006).at(0, KNOB_Y - 0.03, 0),
      )
      .paintFn(walnutPaint);
    k.body('knob', knob, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 250,
    });
  },
});
