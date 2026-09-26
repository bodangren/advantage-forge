import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Knight's sword, about 1 m, standing on its pommel with the blade up (+Y), flat of the blade
 * facing +Z. Lens-section steel blade with a fuller, curved gold crossguard, leather-wrapped grip,
 * and a gem pommel.
 */

const GRIP_Y = 0.05;
const GUARD_Y = 0.24;
const BLADE_LEN = 0.78;
const BLADE_W = 0.07;
const BLADE_T = 0.016;

export default defineAsset({
  name: 'knight-sword',
  description: "Knight's longsword with a gold crossguard, leather grip, and gem pommel.",
  detail: 0.003,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Outline: straight edges that taper into a point.
    const outline = profile.polygon([
      [-BLADE_W / 2, 0],
      [BLADE_W / 2, 0],
      [BLADE_W / 2 - 0.004, BLADE_LEN * 0.8],
      [0, BLADE_LEN],
      [-BLADE_W / 2 + 0.004, BLADE_LEN * 0.8],
    ]);
    // Lens cross-section: the overlap of two big upright cylinders.
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_LEN * 2).at(0, BLADE_LEN / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_LEN * 2).at(0, BLADE_LEN / 2, -(R - BLADE_T / 2)),
    );
    // A shallow fuller groove down the middle of both faces.
    const fuller = sdf
      .capsule([0, 0.03, 0], [0, BLADE_LEN * 0.68, 0], 0.009)
      .scale([1, 1, 0.35])
      .at(0, 0, BLADE_T / 2 + 0.001)
      .mirror('z', 0);
    const blade = sdf
      .extrude(outline, 0.2)
      .intersect(lens)
      .smoothSubtract(0.003, fuller)
      .at(0, GUARD_Y + 0.015, 0)
      .paintWhere(
        sdf.extrude(profile.rect([0.02, BLADE_LEN * 1.2]), 0.2).at(0, GUARD_Y, 0),
        '#aeb4bd',
        0.004,
      );
    k.body('blade', blade, {
      color: '#d4d9e0',
      roughness: 0.28,
      metalness: 1,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 400, y * 20, z * 400, 2), // brushed steel
    });

    // ------------------------------------------------------------------ crossguard and grip
    const guard = sdf
      .box([0.24, 0.028, 0.034], 0.012)
      .bend(-2.2) // tips sweep up toward the blade
      .union(sdf.sphere(0.02).at(0.12, 0.022, 0).mirror('x', 0))
      .union(sdf.ellipsoid([0.032, 0.03, 0.03]))
      .at(0, GUARD_Y, 0);
    const pommel = sdf
      .smoothUnion(
        0.01,
        sdf.ellipsoid([0.034, 0.03, 0.03]).at(0, GRIP_Y - 0.01, 0),
        sdf.cone([0, GRIP_Y, 0], [0, GRIP_Y + 0.03, 0], 0.022, 0.016),
      )
      .at(0, 0, 0);
    k.body('gold', sdf.union(guard, pommel), { color: '#caa24a', roughness: 0.3, metalness: 1 });

    const grip = sdf.cylinder(0.017, GUARD_Y - GRIP_Y - 0.02, 0.006).at(0, (GUARD_Y + GRIP_Y) / 2 + 0.01, 0);
    k.body('grip', grip, {
      color: '#5a3a22',
      roughness: 0.75,
      // Leather strap wound in a spiral.
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 160)),
    });

    // ------------------------------------------------------------------ gems
    const gem = (r: number) =>
      sdf.intersect(sdf.box([r * 2, r * 2, r * 2]).rotate(35, 45, 0), sdf.sphere(r * 1.15));
    const gems = sdf.union(
      gem(0.016).at(0, GUARD_Y, 0.028),
      gem(0.016).at(0, GUARD_Y, -0.028),
      gem(0.018).at(0, GRIP_Y - 0.035, 0),
    );
    k.body('gems', gems, {
      color: '#2fa8d6',
      roughness: 0.1,
      emissive: '#2fa8d6',
      emissiveIntensity: 0.25,
      flat: true,
    });
  },
});
