import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — greatsword (equipment/melee-weapons/greatsword).
 *
 * Role: a heavy two-handed hero weapon and pickup icon; one bold vertical silhouette that
 *   reads at 128 px. Bigger and broader than the short sword and the knight's sword.
 * Size: 1.30 m tall, standing point-up on its round pommel at y = 0, centred on the Y axis,
 *   the flat of the blade facing +Z.
 * One idea: a broad leaf blade with a deep central fuller, over a very wide straight
 *   crossguard with ball ends, a long leather-wrapped grip, and a chunky round pommel.
 * Shape language: round dominant (ball pommel, ball guard ends, soft bevels) with a broad
 *   triangular secondary (the tapering blade).
 * Palette: steel #c8ccd2 blade, iron #4a4f55 / #363a3f fittings with highlight #a8acb1,
 *   leather #8a5a35 / #5c3a22 grip, gold #d4a93a collars as the accent. 60/30/10.
 * Materials: steel (roughness 0.3, metalness 1), worn iron (roughness 0.5, metalness 0.7),
 *   leather (roughness 0.65, metalness 0), gold (roughness 0.3, metalness 1).
 * Detail: primary broad blade + wide guard + long grip + round pommel; secondary ball guard
 *   ends, grip rings, gold collars; tertiary painted fuller shading, tarnish, spiral wrap.
 * Rig/animation: none (static item).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const LEATHER = rgb('#8a5a35');
const LEATHER_DEEP = rgb('#5c3a22');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');
const GOLD = rgb('#d4a93a');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
const POMMEL_R = 0.048;
const POMMEL_Y = POMMEL_R; // sphere base rests on y = 0
const GRIP_LO = 0.086;
const GRIP_HI = 0.390;
const GUARD_Y = 0.400;
const BLADE_BASE = 0.414;
const BLADE_LEN = 0.884; // tip lands at 1.298 m (~1.30 m)
const BLADE_HALF = 0.092; // broad blade
const BLADE_T = 0.028; // full thickness at the centre ridge (chunky)
const GUARD_HALF = 0.180; // very wide straight crossguard

// Broad outline in blade-local coords: a short ricasso at the base steps out to a wide,
// near-parallel blade, then a long taper into the point. Base at y = 0, tip at y = BLADE_LEN.
const outline = profile.polygon(
  [
    [-0.048, 0],
    [0.048, 0],
    [0.088, BLADE_LEN * 0.08],
    [0.092, BLADE_LEN * 0.3],
    [0.088, BLADE_LEN * 0.58],
    [0.072, BLADE_LEN * 0.78],
    [0.040, BLADE_LEN * 0.92],
    [0.016, BLADE_LEN * 0.98],
    [0, BLADE_LEN],
    [-0.016, BLADE_LEN * 0.98],
    [-0.040, BLADE_LEN * 0.92],
    [-0.072, BLADE_LEN * 0.78],
    [-0.088, BLADE_LEN * 0.58],
    [-0.092, BLADE_LEN * 0.3],
    [-0.088, BLADE_LEN * 0.08],
  ],
  { smooth: true },
);

// ------------------------------------------------------------------ paint
const bladePaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  // Darker along the fuller (centre of the blade), bright along the cutting bevels.
  const centre = clamp01((0.022 - Math.abs(x)) / 0.022);
  c = mixRgb(c, STEEL_DEEP, 0.26 * centre);
  const sheen = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2);
  c = mixRgb(c, STEEL_DEEP, 0.07 * sheen);
  // A bright forged line just inside each cutting edge.
  const edge = clamp01(1 - Math.abs(Math.abs(x) - BLADE_HALF * 0.82) / 0.008);
  c = mixRgb(c, rgb('#e6eaf0'), 0.5 * edge);
  return c;
};

const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 26 + 3, y * 26, z * 26, 2);
  c = mixRgb(c, IRON_DEEP, 0.34 * tarnish);
  // Light where the fittings catch the sky, dark underneath.
  const top = clamp01((y - (GUARD_Y + 0.012)) / 0.03);
  c = mixRgb(c, IRON_LIGHT, 0.3 * top);
  const low = clamp01((0.02 - y) / 0.02);
  c = mixRgb(c, IRON_DEEP, 0.4 * low);
  return c;
};

const leatherPaint = (x: number, y: number, z: number) => {
  // Dark grooves between the raised wrap rings.
  const wrap = Math.abs(Math.sin(y * 62));
  let c = mixRgb(LEATHER, LEATHER_DEEP, 0.55 * (1 - wrap));
  const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 12, z * 40, 2);
  c = mixRgb(c, LEATHER_DEEP, 0.18 * grain);
  return c;
};

const goldPaint = (x: number, y: number, z: number) => {
  const wear = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
  return mixRgb(GOLD, rgb('#9a7a24'), 0.25 * wear);
};

export default defineAsset({
  name: 'greatsword',
  description:
    'Two-handed greatsword, 1.30 m: a broad steel blade with a deep fuller, over a wide straight iron crossguard with ball ends, a long leather-wrapped grip, and a round pommel.',
  detail: 0.0035,
  reference: 'docs/item-mockups/greatsword-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.238, 0], twoHanded: true },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Lens cross-section: the overlap of two big upright cylinders gives sharp-ish edges
    // and a thick centre ridge.
    const R = (BLADE_HALF ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_LEN * 1.6).at(0, BLADE_LEN / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_LEN * 1.6).at(0, BLADE_LEN / 2, -(R - BLADE_T / 2)),
    );
    // A deep fuller groove down the centre of both faces.
    const fuller = sdf
      .capsule([0, 0.05, 0], [0, BLADE_LEN * 0.7, 0], 0.021)
      .scale([1, 1, 0.32])
      .at(0, 0, BLADE_T / 2 + 0.002)
      .mirror('z', 0);
    const blade = sdf
      .extrude(outline, BLADE_T - 0.003, 0.004)
      .intersect(lens)
      .smoothSubtract(0.004, fuller)
      .at(0, BLADE_BASE, 0)
      .paintFn(bladePaint);

    k.body('blade', blade, {
      color: '#d4d9e0',
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 320, y * 30, z * 320, 2),
      maxTriangles: 1600,
    });

    // ------------------------------------------------------------------ iron fittings
    // Wide straight crossguard: a chunky rounded bar with ball ends.
    const guard = sdf
      .union(
        sdf.box([GUARD_HALF * 2, 0.044, 0.048], 0.014),
        sdf.sphere(0.026).at(GUARD_HALF - 0.006, 0, 0).mirror('x', 0),
        // A chunky central block that wraps the blade root.
        sdf.box([0.062, 0.052, 0.054], 0.013),
      )
      .at(0, GUARD_Y, 0);

    // Round pommel: a ball with a collar joining it up to the grip.
    const pommel = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([POMMEL_R, POMMEL_R - 0.004, POMMEL_R]).at(0, POMMEL_Y, 0),
      sdf.cone([0, POMMEL_Y + 0.01, 0], [0, POMMEL_Y + 0.05, 0], 0.030, 0.024),
    );
    const fittings = sdf.union(guard, pommel).paintFn(ironPaint);

    k.body('iron', fittings, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 1100,
    });

    // ------------------------------------------------------------------ grip
    // A long leather core with raised wrap rings so the grip reads at sprite size.
    const core = sdf
      .cylinder(0.024, GRIP_HI - GRIP_LO, 0.006)
      .at(0, (GRIP_LO + GRIP_HI) / 2, 0);
    const ringYs = [0.115, 0.160, 0.205, 0.250, 0.295, 0.340];
    const rings = ringYs.map((y) => sdf.torus(0.027, 0.008).at(0, y, 0));
    const grip = sdf.smoothUnion(0.002, core, ...rings).paintFn(leatherPaint);

    k.body('grip', grip, {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.004,
      paintWeight: 2,
      // Leather cord wound in a spiral, kept in the normal map.
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(Math.atan2(z, x) + y * 120)),
      maxTriangles: 700,
    });

    // ------------------------------------------------------------------ gold accents
    // A collar at each end of the grip and a band across the guard centre.
    const gold = sdf.union(
      sdf.cylinder(0.030, 0.022, 0.006).at(0, 0.074, 0),
      sdf.cylinder(0.031, 0.020, 0.006).at(0, 0.378, 0),
      sdf.box([0.094, 0.056, 0.058], 0.010).at(0, GUARD_Y, 0),
    );
    k.body('gold', gold.paintFn(goldPaint), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      maxTriangles: 500,
    });
  },
});
