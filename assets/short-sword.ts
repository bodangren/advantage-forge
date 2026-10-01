import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — short sword (equipment/melee-weapons/short-sword).
 *
 * Role: a common shop-stock melee weapon and pickup icon; one bold vertical silhouette that
 *   reads at 128 px. Chunkier and shorter than the long-sword.
 * Size: 0.70 m tall, standing point-up on its disc pommel at y = 0, centred on the Y axis,
 *   the flat of the blade facing +Z. (Follows reference/short-sword-mock.jpg.)
 * One idea: a broad, chunky steel blade over a heavy straight iron crossguard with ball
 *   ends and a diamond boss, a beaded walnut grip, and a flat disc pommel.
 * Shape language: round dominant (ball guard ends, disc pommel, beaded grip, soft bevels)
 *   with a broad triangular secondary (the tapering blade).
 * Palette: steel #c8ccd2 / #8e959e blade; worn iron #4a4f55 / #363a3f with highlight
 *   #a8acb1 on guard and pommel; walnut #6b4226 / #54331d grip. 60/30/10: steel, iron, brown.
 * Materials: steel (roughness 0.3, metalness 1), iron (roughness 0.5, metalness 0.7),
 *   walnut grip (roughness 0.7, metalness 0).
 * Detail: primary broad blade + straight guard + disc pommel; secondary diamond boss, guard
 *   balls, collar; tertiary tarnish, painted centre bevel, spiral grip wrap.
 * Rig/animation: none (static item).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
const POMMEL_Y = 0.019; // disc pommel centre; its base rests on y = 0
const GRIP_LO = 0.046;
const GRIP_HI = 0.166;
const GUARD_Y = 0.180;
const BLADE_BASE = 0.186;
const BLADE_LEN = 0.514; // tip lands at 0.70 m
const BLADE_HALF = 0.047; // broad blade, nearly as wide as a long-sword
const BLADE_T = 0.022; // full thickness at the centre ridge (chunky)

// Broad outline in blade-local coords: base at y = 0, tip at y = BLADE_LEN. Nearly straight
// sides, then a firm taper into the point.
const outline = profile.polygon([
  [-BLADE_HALF, 0],
  [BLADE_HALF, 0],
  [BLADE_HALF * 0.96, BLADE_LEN * 0.6],
  [BLADE_HALF * 0.74, BLADE_LEN * 0.83],
  [0, BLADE_LEN],
  [-BLADE_HALF * 0.74, BLADE_LEN * 0.83],
  [-BLADE_HALF * 0.96, BLADE_LEN * 0.6],
]);

// ------------------------------------------------------------------ paint
const bladePaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  // Slightly darker near the central ridge, brightest along the side bevels.
  const centre = clamp01((0.017 - Math.abs(x)) / 0.017);
  c = mixRgb(c, STEEL_DEEP, 0.22 * centre);
  const sheen = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 24, 2);
  c = mixRgb(c, STEEL_DEEP, 0.1 * sheen);
  // A faint dark line just inside each cutting edge sells the forged bevel.
  const edge = clamp01(1 - Math.abs(Math.abs(x) - BLADE_HALF * 0.86) / 0.006);
  c = mixRgb(c, STEEL_DEEP, 0.18 * edge);
  return c;
};

const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 24 + 3, y * 24, z * 24, 2);
  c = mixRgb(c, IRON_DEEP, 0.32 * tarnish);
  // Light where the fittings catch the sky, dark underneath.
  const top = clamp01((y - (GUARD_Y + 0.012)) / 0.03);
  c = mixRgb(c, IRON_LIGHT, 0.3 * top);
  const bottom = clamp01((0.016 - y) / 0.016);
  c = mixRgb(c, IRON_DEEP, 0.35 * bottom);
  return c;
};

const gripPaint = (x: number, y: number, z: number) => {
  const wrap = Math.abs(Math.sin(Math.atan2(z, x) + y * 150));
  let c = mixRgb(WALNUT, WALNUT_DEEP, 0.5 * (1 - wrap));
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 8, z * 30, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.2 * grain);
  return c;
};

export default defineAsset({
  name: 'short-sword',
  description:
    'Broad short sword, 0.70 m: a chunky steel blade over a straight iron crossguard, a beaded walnut-wrapped grip, and a flat disc pommel.',
  detail: 0.0035,
  reference: 'docs/item-mockups/short-sword-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.106, 0] },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Lens cross-section: the overlap of two big upright cylinders gives sharp-ish edges
    // and a thick centre ridge.
    const R = (BLADE_HALF ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_LEN * 1.6).at(0, BLADE_LEN / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_LEN * 1.6).at(0, BLADE_LEN / 2, -(R - BLADE_T / 2)),
    );
    const blade = sdf
      .extrude(outline, BLADE_T - 0.003, 0.004)
      .intersect(lens)
      .at(0, BLADE_BASE, 0)
      .paintFn(bladePaint);

    k.body('blade', blade, {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 320, y * 30, z * 320, 2),
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ iron fittings
    // Straight crossguard: a rounded bar with ball ends and a central diamond boss.
    const guard = sdf
      .union(
        sdf.box([0.150, 0.026, 0.030], 0.010),
        sdf.sphere(0.0175).at(0.074, 0, 0).mirror('x', 0),
        // Diamond boss across the front and back of the blade root.
        sdf.box([0.028, 0.028, 0.030], 0.007).rotateZ(45),
      )
      .at(0, GUARD_Y, 0);

    // Flat disc pommel with a collar joining it to the grip.
    const pommel = sdf.smoothUnion(
      0.006,
      sdf.ellipsoid([0.040, 0.019, 0.040]).at(0, POMMEL_Y, 0),
      sdf.cylinder(0.015, 0.02, 0.006).at(0, POMMEL_Y + 0.024, 0),
    );
    const fittings = sdf.union(guard, pommel).paintFn(ironPaint);

    k.body('iron', fittings, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0035,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 900,
    });

    // ------------------------------------------------------------------ grip
    // A slim core with four raised leather beads so the wrap reads at sprite size.
    const core = sdf
      .cylinder(0.014, GRIP_HI - GRIP_LO, 0.006)
      .at(0, (GRIP_LO + GRIP_HI) / 2, 0);
    const beadYs = [0.063, 0.091, 0.119, 0.147];
    const beads = beadYs.map((y) => sdf.torus(0.016, 0.0065).at(0, y, 0));
    const grip = sdf.smoothUnion(0.002, core, ...beads).paintFn(gripPaint);

    k.body('grip', grip, {
      color: '#6b4226',
      roughness: 0.7,
      metalness: 0,
      detail: 0.004,
      paintWeight: 2,
      // Leather cord wound in a spiral, kept in the normal map.
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(Math.atan2(z, x) + y * 150)),
      maxTriangles: 600,
    });
  },
});
