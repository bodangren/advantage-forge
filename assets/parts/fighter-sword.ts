import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Fighter arming sword (part of `assets/fighter.ts`; standalone `assets/fighter-sword.ts`).
 *
 * A 0.30 m blade with a fuller, a brass guard and pommel, and a dark grip.
 * Class: hand-held. Local frame: the grip center at the origin, the blade toward -Y, the flat
 * facing +Z (the fighter's own frame; the host pose swordPose turns it).
 * Bodies: sword, hilt, grip (bone `hand.R`). No tint slot.
 */

const C = { blade: '#c3c8cf', brass: '#c9a24a', grip: '#3a2a20' };
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export function fighterSword(): Part {
  const BLADE_W = 0.05;
  const BLADE_T = 0.014;
  const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
  const lens = sdf.intersect(
    sdf.cylinder(R, 1).at(0, 0, R - BLADE_T / 2),
    sdf.cylinder(R, 1).at(0, 0, -(R - BLADE_T / 2)),
  );
  const fuller = sdf.union(
    sdf.box([0.014, 0.21, 0.008], 0.004).at(0, -0.18, BLADE_T / 2),
    sdf.box([0.014, 0.21, 0.008], 0.004).at(0, -0.18, -BLADE_T / 2),
  );
  const bladeLocal = sdf
    .extrude(
      profile.polygon([
        [-BLADE_W / 2, -0.07],
        [BLADE_W / 2, -0.07],
        [BLADE_W / 2, -0.315],
        [0, -0.37],
        [-BLADE_W / 2, -0.315],
      ]),
      0.2,
    )
    .intersect(lens)
    .subtract(fuller)
    .paintWhere(sdf.box([0.017, 0.24, 0.3]).at(0, -0.18, 0), '#8c939d', 0.002);
  const guardLocal = sdf
    .box([0.13, 0.024, 0.03], 0.01)
    .union(hard(sdf.sphere(0.0155).at(0.065, 0, 0)))
    .at(0, -0.064, 0);
  const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.02).at(0, 0.05, 0), sdf.cone([0, 0.03, 0], [0, 0.045, 0], 0.013, 0.016));
  const gripLocal = sdf.cylinder(0.0135, 0.11, 0.004).at(0, -0.014, 0);

  return {
    name: 'fighter-sword',
    bodies: [
      { name: 'sword', shape: bladeLocal, options: { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.0035 }, bone: 'hand.R' },
      {
        name: 'hilt',
        shape: sdf.union(guardLocal, pommelLocal),
        options: { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.004 },
        bone: 'hand.R',
      },
      {
        name: 'grip',
        shape: gripLocal,
        options: {
          color: C.grip,
          roughness: 0.75,
          detail: 0.004,
          bump: (x: number, y: number, z: number) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
        },
        bone: 'hand.R',
      },
    ],
  };
}
