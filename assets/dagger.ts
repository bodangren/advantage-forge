import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leaf dagger (equipment/melee-weapons/dagger).
 *
 * Role: a pickup / off-hand icon weapon; one clear blade shape that reads at 128 px.
 * Size: 0.40 m tall, standing point-up on its round pommel at y = 0, centred on the Y
 *   axis, the flat of the blade facing +Z. (Follows reference/dagger-mock.jpg.)
 * One idea: a plump leaf blade with a bright polished edge over a dark centre, held by
 *   a short iron crossguard whose tips curl up, with a fat round pommel.
 * Shape language: round dominant (pommel, boss, knobs) with a triangular secondary
 *   (the tapering leaf blade and swept guard).
 * Palette: polished steel #c8ccd2 / #8e959e for the blade; worn iron #4a4f55 / #363a3f
 *   and highlight #a8acb1 for guard, collar and pommel; walnut-leather #6b4226 / #54331d
 *   for the wrapped grip. 60/30/10: steel blade, iron fittings, brown grip accent.
 * Materials: steel (roughness 0.3, metalness 1), iron (roughness 0.5, metalness 0.7),
 *   leather grip (roughness 0.7, metalness 0).
 * Detail: primary leaf blade + curled guard + round pommel; secondary boss, guard
 *   wings, collar; tertiary tarnish, a painted centre bevel, and a spiral grip wrap.
 * Rig/animation: none (static prop).
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
const POMMEL_Y = 0.028; // pommel centre; its base rests on y = 0
const GRIP_LO = 0.052;
const GRIP_HI = 0.140;
const GUARD_Y = 0.152;
const BLADE_BASE = 0.148;
const BLADE_LEN = 0.252; // tip lands at about 0.40 m
const BLADE_T = 0.016; // full thickness at the centre ridge

// Leaf outline in blade-local coords: base at y = 0, tip at y = BLADE_LEN. The belly is
// widest in the lower third, then tapers to the point.
const outline = profile.polygon(
  [
    [0.000, 0.252], // tip
    [0.011, 0.230],
    [0.020, 0.194],
    [0.029, 0.152],
    [0.035, 0.110], // belly
    [0.034, 0.070],
    [0.026, 0.030],
    [0.017, 0.000], // base, tucked into the guard
    [0.000, -0.008],
    [-0.017, 0.000],
    [-0.026, 0.030],
    [-0.034, 0.070],
    [-0.035, 0.110],
    [-0.029, 0.152],
    [-0.020, 0.194],
    [-0.011, 0.230],
  ],
  { smooth: true },
);

// Narrow leaf for the raised central spine that gives the blade its forged ridge.
const spineOutline = profile.polygon(
  [
    [0.000, 0.216],
    [0.006, 0.130],
    [0.008, 0.030],
    [0.000, -0.004],
    [-0.008, 0.030],
    [-0.006, 0.130],
  ],
  { smooth: true },
);

// ------------------------------------------------------------------ paint
const bladePaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  // Slightly darker near the central ridge, brightest along the side bevels.
  const centre = clamp01((0.013 - Math.abs(x)) / 0.013);
  c = mixRgb(c, STEEL_DEEP, 0.26 * centre);
  const sheen = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 2);
  c = mixRgb(c, STEEL_DEEP, 0.1 * sheen);
  // A faint dark line just inside each cutting edge sells the forged bevel.
  const edge = clamp01(1 - Math.abs(Math.abs(x) - 0.026) / 0.005);
  c = mixRgb(c, STEEL_DEEP, 0.22 * edge);
  return c;
};

const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 24 + 3, y * 24, z * 24, 2);
  c = mixRgb(c, IRON_DEEP, 0.34 * tarnish);
  // Light where the fittings catch the sky, dark underneath.
  const top = clamp01((y - (GUARD_Y + 0.012)) / 0.03);
  c = mixRgb(c, IRON_LIGHT, 0.32 * top);
  const bottom = clamp01((0.02 - y) / 0.02);
  c = mixRgb(c, IRON_DEEP, 0.4 * bottom);
  // Polished highlight on the boss.
  const boss = clamp01(1 - Math.hypot(x, y - GUARD_Y) / 0.02);
  c = mixRgb(c, IRON_LIGHT, 0.35 * boss);
  return c;
};

const gripPaint = (x: number, y: number, z: number) => {
  const wrap = Math.abs(Math.sin(Math.atan2(z, x) + y * 150));
  let c = mixRgb(WALNUT, WALNUT_DEEP, 0.55 * (1 - wrap));
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 8, z * 30, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.22 * grain);
  return c;
};

export default defineAsset({
  name: 'dagger',
  description:
    'Leaf dagger, 0.40 m: a polished leaf blade standing point-up on a round iron pommel, with a short curled iron crossguard and a spiral-wrapped brown grip.',
  detail: 0.004,
  reference: 'docs/item-mockups/dagger-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.096, 0] },

  build(k) {
    // ------------------------------------------------------------------ blade
    const slab = sdf.extrude(outline, BLADE_T - 0.002, 0.006);
    const spine = sdf.extrude(spineOutline, BLADE_T + 0.004, 0.005);
    const blade = slab
      .smoothUnion(0.004, spine)
      .at(0, BLADE_BASE, 0)
      .paintFn(bladePaint);

    k.body('blade', blade, {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.0028,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 320, y * 30, z * 320, 2),
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ iron fittings
    // Short crossguard: a rounded bar whose tips curl up toward the blade.
    const guard = sdf
      .box([0.112, 0.019, 0.025], 0.009)
      // Tapered wing tips that the bend sweeps up toward the blade.
      .union(
        sdf
          .cone([0.044, 0.000, 0], [0.070, 0.004, 0], 0.015, 0.005)
          .union(sdf.sphere(0.005).at(0.070, 0.004, 0))
          .mirror('x', 0),
      )
      .union(sdf.ellipsoid([0.023, 0.022, 0.021])) // central boss
      .bend(-4.2)
      .at(0, GUARD_Y, 0);
    // Round pommel with a collar joining it to the grip.
    const pommel = sdf
      .smoothUnion(
        0.006,
        sdf.ellipsoid([0.028, 0.028, 0.028]).at(0, POMMEL_Y, 0),
        sdf.cylinder(0.014, 0.018, 0.006).at(0, POMMEL_Y + 0.027, 0),
      )
      .union(sdf.torus(0.016, 0.004).at(0, POMMEL_Y + 0.025, 0));
    const fittings = sdf.union(guard, pommel).paintFn(ironPaint);

    k.body('iron', fittings, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0035,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 1100,
    });

    // ------------------------------------------------------------------ grip
    const grip = sdf
      .cylinder(0.016, GRIP_HI - GRIP_LO, 0.007)
      .at(0, (GRIP_LO + GRIP_HI) / 2, 0)
      .paintFn(gripPaint);

    k.body('grip', grip, {
      color: '#6b4226',
      roughness: 0.7,
      metalness: 0,
      detail: 0.004,
      paintWeight: 2,
      // Leather cord wound in a spiral, kept in the normal map.
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 150)),
      maxTriangles: 500,
    });
  },
});
