import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Shield-maiden bearded axe (part of `assets/shield-maiden.ts`; standalone `assets/shield-maiden-axe.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the haft toward -Y, the blade edge
 * toward +X, the flat facing +Z. The host keeps its pose function `axePose`.
 * Bodies: axe, axe-wrap, axe-haft (bone `hand.R`).
 */
const C = { steel: '#8a9099', steelDark: '#5a6068', strap: '#4e2d1c', haft: '#4a2e1c' };

export function shieldMaidenAxe(): Part {
    const bladeProfile = profile.polygon(
      [
        [0.006, -0.205],
        [0.04, -0.196],
        [0.07, -0.188],
        [0.079, -0.215],
        [0.074, -0.25],
        [0.064, -0.28],
        [0.058, -0.312],
        [0.04, -0.298],
        [0.024, -0.282],
        [0.006, -0.276],
      ],
      { smooth: true, samples: 3 },
    );
    const bladeLocal = sdf.extrude(bladeProfile, 0.012, 0.003).paintWhere(sdf.halfSpace([0, 1, 0], -0.255), C.steelDark, 0.012);
    const socketLocal = sdf.union(
      sdf.box([0.038, 0.062, 0.03], 0.008).at(0.001, -0.242, 0),
      sdf.box([0.025, 0.036, 0.03], 0.006).at(-0.026, -0.242, 0), // the hammer poll
      sdf.sphere(0.011).at(0, -0.316, 0),
    ).paintWhere(sdf.halfSpace([0, 1, 0], -0.255), C.steelDark, 0.012);
    const haftLocal = sdf.cylinder(0.0135, 0.345, 0.004).at(0, -0.1425, 0);
    const wrapLocal = sdf.union(sdf.cylinder(0.0165, 0.028, 0.005).at(0, -0.17, 0), sdf.cylinder(0.0165, 0.012, 0.004).at(0, -0.115, 0));
  return {
    name: 'shield-maiden-axe',
    bodies: [
      { name: 'axe', shape: sdf.union(bladeLocal, socketLocal), options: { color: C.steel, roughness: 0.45, metalness: 0.8, detail: 0.003 }, bone: 'hand.R' },
      { name: 'axe-wrap', shape: wrapLocal, options: { color: C.strap, roughness: 0.8, detail: 0.003 }, bone: 'hand.R' },
      {
        name: 'axe-haft',
        shape: haftLocal,
        options: {
          color: C.haft,
          roughness: 0.75,
          detail: 0.004,
          bump: (x: number, y: number, z: number) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
        },
        bone: 'hand.R',
      },
    ],
  };
}
