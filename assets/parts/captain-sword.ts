import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Captain's longsword (part of `assets/captain.ts`; standalone `assets/captain-sword.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the blade along +Y (the tip up),
 * flat faces toward +Z and -Z. The host tilts it into the fist. Length 0.56 m.
 * Bodies: sword-blade, sword-guard, sword-grip (bone `hand.R`). Tint slots: none.
 */

const C = { steelDark: '#8a9098', blade: '#c3c8cf', guard: '#a8acb1', grip: '#3a2a20' };

export function captainSword(): Part {
  const BLADE = profile.polygon([
    [-0.025, 0.064],
    [0.025, 0.064],
    [0.025, 0.42],
    [0, 0.464],
    [-0.025, 0.42],
  ]);
  const blade = sdf
    .extrude(BLADE, 0.014, 0.003)
    .paintWhere(sdf.extrude(profile.rect([0.012, 0.3], 0.004), 0.1).at(0, 0.24, 0), C.steelDark, 0.004);
  const guard = sdf.union(
    sdf.box([0.12, 0.016, 0.03], 0.006).at(0, 0.054, 0),
    sdf.sphere(0.012).at(0.06, 0.054, 0),
    sdf.sphere(0.012).at(-0.06, 0.054, 0),
    sdf.sphere(0.022).at(0, -0.072, 0),
  );
  const grip = sdf.smoothUnion(0.004, sdf.cylinder(0.0155, 0.11, 0.004).at(0, -0.005, 0), sdf.ellipsoid([0.02, 0.014, 0.02]).at(0, 0.03, 0));
  return {
    name: 'captain-sword',
    bodies: [
      { name: 'sword-blade', shape: blade, options: { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.004 }, bone: 'hand.R' },
      { name: 'sword-guard', shape: guard, options: { color: C.guard, roughness: 0.35, metalness: 0.85, detail: 0.004 }, bone: 'hand.R' },
      {
        name: 'sword-grip',
        shape: grip,
        options: { color: C.grip, roughness: 0.75, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0008 * noise.noise3(x * 90, y * 12, z * 90) },
        bone: 'hand.R',
      },
    ],
  };
}
