import { HAND_FIT, defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Falchion (equipment/melee-weapons/falchion), 0.8 m, standing on its pommel with the blade up
 * (+Y) and the flat of the blade facing +Z.
 *
 * - Role: melee weapon for the Chibi Quest heroes; seen in hand and as a pickup icon.
 * - One idea: a broad single-edge blade that widens toward a clip-point tip, like a wide
 *   cleaver-sabre hybrid.
 * - Shape language: triangular blade (danger) on a rounded, chunky hilt (friendly).
 * - Palette: iron blade #4a4f55 with steel edge #c8ccd2 (light accent), gold guard and pommel
 *   #d4a93a (small warm accent), leather grip #8a5a35 / #5c3a22.
 * - Materials: iron blade (metalness 0.7), gold fittings (metalness 1), leather grip.
 * - Details: fuller near the spine, spiral leather wrap in bump, rounded guard tips.
 * - No rig: a rigid item, like the knight-sword.
 */

const GRIP_Y0 = 0.05; // grip bottom
const GRIP_Y1 = 0.225; // grip top
const GUARD_Y = 0.235;
const BLADE_LEN = 0.55;
const BLADE_T = 0.022;

export default defineAsset({
  name: 'falchion',
  description: 'Broad single-edge falchion with a clip-point tip, gold crossguard, and leather grip.',
  detail: 0.006,
  reference: 'docs/item-mockups/falchion-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.137, 0] },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Outline: straight spine (-X), convex belly that widens toward the tip (+X),
    // clip point where the belly sweeps up to the spine. Matches the mockup's curve.
    const outline = profile.polygon([
      [-0.018, 0],
      [0.018, 0],
      [0.028, 0.14],
      [0.05, 0.32], // widest near the tip
      [0.045, 0.42],
      [-0.006, 0.52], // clip-point tip
      [-0.018, 0.42],
      [-0.018, 0.14],
    ]);
    // Lens cross-section: overlap of two big upright cylinders, so faces are flat and
    // the spine and belly are sharp-ish. Thickness along Z. R keeps the lens at least
    // two mesh cells thick at the widest part of the outline.
    const R = 0.35;
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_LEN * 2.4).at(0, BLADE_LEN / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_LEN * 2.4).at(0, BLADE_LEN / 2, -(R - BLADE_T / 2)),
    );
    // Fuller groove along the spine, both faces.
    const fuller = sdf
      .capsule([0, 0.04, 0], [0, 0.42, 0], 0.009)
      .scale([1, 1, 0.35])
      .at(-0.008, 0, BLADE_T / 2 + 0.001)
      .mirror('z', 0);
    // Cutting-edge band stencil: a thin polygon hugging the belly and clip point.
    const edgeBand = profile.polygon([
      [0.016, 0.01],
      [0.027, 0.14],
      [0.049, 0.32],
      [0.044, 0.4],
      [-0.005, 0.515],
      [-0.006, 0.45],
      [0.034, 0.39],
      [0.038, 0.32],
      [0.017, 0.14],
      [0.006, 0.01],
    ]);
    const blade = sdf
      .extrude(outline, 0.2)
      .intersect(lens)
      .smoothSubtract(0.003, fuller)
      .at(0, GUARD_Y + 0.015, 0)
      .paintWhere(
        sdf.extrude(profile.rect([0.026, BLADE_LEN * 1.2]), 0.2).at(-0.001, GUARD_Y + 0.015, 0),
        '#8d939a',
        0.004,
      )
      .paintWhere(
        sdf.extrude(edgeBand, 0.2).at(0, GUARD_Y + 0.015, 0),
        '#c8ccd2',
        0.002,
      );
    k.body('blade', blade, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0076,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 400, y * 20, z * 400, 2), // brushed iron
    });

    // ------------------------------------------------------------------ guard and pommel
    const guard = sdf
      .box([0.2, 0.026, 0.032], 0.012)
      .bend(-2.0) // tips sweep up toward the blade
      .union(sdf.sphere(0.018).at(0.1, 0.02, 0).mirror('x', 0))
      .union(sdf.ellipsoid([0.03, 0.028, 0.028]))
      .at(0, GUARD_Y, 0);
    const pommel = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.032, 0.026, 0.03]).at(0, 0.026, 0),
      sdf.cone([0, 0.048, 0], [0, GRIP_Y0 + 0.005, 0], 0.02, 0.016),
    );
    k.body('gold', sdf.union(guard, pommel), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.007,
    });

    // ------------------------------------------------------------------ grip
    const grip = sdf
      .cylinder(0.0175, GRIP_Y1 - GRIP_Y0, 0.006)
      .at(0, (GRIP_Y0 + GRIP_Y1) / 2, 0)
      .paintWhere(sdf.box([0.06, 0.022, 0.06]).at(0, GRIP_Y0 + 0.008, 0), '#5c3a22', 0.004)
      .paintWhere(sdf.box([0.06, 0.022, 0.06]).at(0, GRIP_Y1 - 0.008, 0), '#5c3a22', 0.004);
    k.body('grip', grip, {
      color: '#8a5a35',
      roughness: 0.7,
      // Leather strap wound in a spiral.
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 160)),
    });
  },
});
