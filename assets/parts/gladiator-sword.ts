import { mixRgb, noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Gladiator short sword (part of `assets/gladiator.ts`; standalone `assets/gladiator-sword.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the blade toward -Y, the flat
 * toward +Z. Bodies: blade, hilt, grip (bone `hand.R`).
 */
const C = { steel: '#c3c8cf', bronze: '#b08a3a', grip: '#3a2a20' };

export function gladiatorSword(): Part {
    const BLADE_W = 0.05;
    const BLADE_T = 0.013;
    const LENS_R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(LENS_R, 1).at(0, 0, LENS_R - BLADE_T / 2),
      sdf.cylinder(LENS_R, 1).at(0, 0, -(LENS_R - BLADE_T / 2)),
    );
    const bladeLocal = sdf
      .extrude(
        profile.polygon(
          [
            [-0.021, -0.06],
            [-0.025, -0.11],
            [-0.02, -0.19],
            [-0.011, -0.29],
            [0, -0.33],
            [0.011, -0.29],
            [0.02, -0.19],
            [0.025, -0.11],
            [0.021, -0.06],
          ],
          { smooth: true, samples: 4 },
        ),
        0.2,
      )
      .subtract(sdf.union(sdf.box([0.011, 0.17, 0.006], 0.003).at(0, -0.18, 0.0068), sdf.box([0.011, 0.17, 0.006], 0.003).at(0, -0.18, -0.0068)))
      .intersect(lens)
      .scale([1.45, 1, 1])
      .paintWhere(sdf.box([0.017, 0.17, 0.2]).at(0, -0.18, 0), '#4a5058', 0.003);
    const guardLocal = sdf.box([0.09, 0.016, 0.026], 0.007).bend(4).at(0, -0.063, 0);
    const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.02).at(0, 0.048, 0), sdf.cone([0, 0.03, 0], [0, 0.042, 0], 0.013, 0.016));
    const gripLocal = sdf.cylinder(0.0135, 0.1, 0.004).at(0, -0.012, 0);
  return {
    name: 'gladiator-sword',
    bodies: [
      { name: 'blade', shape: bladeLocal, options: { color: C.steel, roughness: 0.4, metalness: 0.85, detail: 0.003 }, bone: 'hand.R' },
      { name: 'hilt', shape: sdf.union(guardLocal, pommelLocal), options: { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.004 }, bone: 'hand.R' },
      {
        name: 'grip',
        shape: gripLocal,
        options: {
          color: C.grip,
          roughness: 0.75,
          detail: 0.004,
          bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
        },
        bone: 'hand.R',
      },
    ],
  };
}
