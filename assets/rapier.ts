import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Rapier, 1.0 m, standing on its pommel with the blade up (+Y), flat of the blade facing +Z.
 * Role: hero melee weapon, read at 128 px as an icon and in hand.
 * One idea: a needle-straight blade over a swept gold hilt, with a big C-curve knuckle guard.
 * Shape language: long straight triangle (blade) + round curls (knuckle guard, pommel).
 * Palette: iron blade #a8acb1 with dark fuller #4a4f55 and steel edges #c8ccd2; gold hilt
 * #d4a93a; dark leather grip #5c3a22. Value: bright blade dominant, gold accent.
 * Materials: steel blade (metal 0.7, rough 0.5), gold (metal 1, rough 0.3), leather (rough 0.75).
 * Detail list: blade + fuller, quillons + knuckle bow + ring, grip wrap, round pommel.
 * No rig or animation; static item. Grip center is at y ~ 0.145 for attachment.
 */

const POMMEL_Y = 0.034;
const GRIP_Y0 = 0.075;
const GRIP_Y1 = 0.225;
const GUARD_Y = 0.24;
const BLADE_Y = GUARD_Y + 0.015;
const BLADE_LEN = 1.0 - BLADE_Y; // total asset height exactly 1.0 m
const BLADE_W = 0.05;
const BLADE_T = 0.016;

export default defineAsset({
  name: 'rapier',
  description: 'Swept-hilt rapier: needle-straight steel blade, gold knuckle guard, round pommel.',
  detail: 0.003,
  reference: 'docs/item-mockups/rapier-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Straight edges that taper into a long needle point.
    const outline = profile.polygon([
      [-BLADE_W / 2, 0],
      [BLADE_W / 2, 0],
      [BLADE_W / 2 - 0.002, BLADE_LEN * 0.72],
      [0, BLADE_LEN],
      [-BLADE_W / 2 + 0.002, BLADE_LEN * 0.72],
    ]);
    // Lens cross-section: overlap of two big upright cylinders.
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_LEN * 2).at(0, BLADE_LEN / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_LEN * 2).at(0, BLADE_LEN / 2, -(R - BLADE_T / 2)),
    );
    // A shallow fuller groove down the middle of both faces lives in the normal map (bump),
    // so the blade mesh stays one clean unpainted body that reduces well.
    const blade = sdf
      .extrude(outline, 0.2)
      .intersect(lens)
      .at(0, BLADE_Y, 0);
    k.body('blade', blade, {
      color: '#c8ccd2',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.0012,
      bump: (x, y, z) =>
        0.0003 * noise.fbm(x * 400, y * 20, z * 400, 2) - // brushed steel
        0.0015 * Math.exp(-((x / 0.006) ** 2)) * Math.exp(-(((y - 0.62) / 0.34) ** 2)), // fuller groove
    });

    // ------------------------------------------------------------------ swept gold hilt
    // Short quillons, tips swept up toward the blade.
    const quillons = sdf
      .box([0.26, 0.024, 0.032], 0.011)
      .bend(2.0) // tips sweep up toward the blade
      .union(sdf.sphere(0.018).at(0.13, 0.022, 0).mirror('x', 0))
      .at(0, GUARD_Y, 0);
    // C-shaped knuckle bow sweeping from the left quillon down to the grip.
    const knuckleBow = sdf.chain(
      [
        [0.115, 0.235, 0, 0.0095],
        [0.155, 0.205, 0, 0.009],
        [0.165, 0.16, 0, 0.0085],
        [0.145, 0.115, 0, 0.008],
        [0.1, 0.09, 0, 0.0075],
        [0.055, 0.085, 0, 0.007],
      ],
      0.008,
    );
    // A small ring where the bow meets the quillon, the classic swept-hilt curl.
    const ring = sdf.torus(0.026, 0.0075).rotateX(90).at(0.125, 0.222, 0);
    const gold = sdf
      .union(quillons, knuckleBow)
      .union(ring)
      .union(sdf.cone([0, GRIP_Y1 + 0.008, 0], [0, GRIP_Y1 - 0.012, 0], 0.02, 0.016))
      .at(0, 0, 0);
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.3, metalness: 1, detail: 0.004, maxTriangles: 800 });

    // Dark iron block where blade meets guard.
    k.body('ricasso', sdf.ellipsoid([0.032, 0.024, 0.026]).at(0, GUARD_Y + 0.004, 0), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      maxTriangles: 200,
    });

    // ------------------------------------------------------------------ grip and pommel
    const grip = sdf.cylinder(0.016, GRIP_Y1 - GRIP_Y0, 0.006).at(0, (GRIP_Y0 + GRIP_Y1) / 2, 0);
    k.body('grip', grip, {
      color: '#5c3a22',
      roughness: 0.75,
      maxTriangles: 200,
      // Leather strap wound in a spiral.
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 160)),
    });

    const pommel = sdf
      .smoothUnion(
        0.008,
        sdf.sphere(0.034).at(0, POMMEL_Y, 0),
        sdf.cone([0, 0.05, 0], [0, 0.072, 0], 0.02, 0.015),
      )
      .at(0, 0, 0);
    k.body('pommel', pommel, { color: '#d4a93a', roughness: 0.3, metalness: 1, detail: 0.006, maxTriangles: 300 });
  },
});
