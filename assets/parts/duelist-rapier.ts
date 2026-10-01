import { rgb, sdf, type Part } from '../../src/index.js';

/**
 * Duelist rapier (part of `assets/duelist.ts`; standalone `assets/duelist-rapier.ts`).
 * A slim gold-hilted rapier: diamond blade, wrapped grip, cup guard with a knuckle bow, pommel.
 * Class: hand-held. Local frame: built along +Z with the grip centered at the origin; the host aims
 * it with its `bladePose`. Bodies: rapierBlade, rapierHilt (bone `hand.R`).
 */

const C = { blade: '#c3c8cf', hilt: '#c9a24a' };

export function duelistRapier(): Part {
    const blade = sdf
      .box([0.0113, 0.0113, 0.3], 0.0008)
      .rotateZ(45)
      .at(0, 0, 0.21)
      .intersect(sdf.cone([0, 0, 0.06], [0, 0, 0.362], 0.0105, 0.0006))
      .scale([1, 0.8, 1])
      .paint(C.blade);
    // Wrapped grip: dark leather bands round the gold core.
    const wrap = rgb('#4a2a18');
    const grip = sdf
      .capsule([0, 0, -0.04], [0, 0, 0.04], 0.0115)
      .displace(0.0012, (x, y, z) => Math.sin(z * 260 + Math.atan2(y, x) * 2))
      .paintFn((x, y, z, base) => (Math.sin(z * 260 + Math.atan2(y, x) * 2) > 0 ? wrap : base));
    // Swept cup guard r 0.035, hollow toward the hand, with a knuckle bow curving back to the pommel.
    const guard = sdf
      .sphere(0.037)
      .subtract(sdf.sphere(0.031))
      .intersect(sdf.halfSpace([0, 0, -1], 0))
      .at(0, 0, 0.04);
    const guardRim = sdf.torus(0.0345, 0.0055).rotateX(90).at(0, 0, 0.04);
    const bow = sdf.chain(
      [
        [-0.03, 0, 0.04, 0.0045],
        [-0.042, 0, 0.012, 0.0045],
        [-0.04, 0, -0.026, 0.0045],
        [-0.012, 0, -0.056, 0.0055],
      ],
      0.01,
    );
    const pommel = sdf.sphere(0.017).at(0, 0, -0.058);
    const hilt = sdf.smoothUnion(0.006, grip, guard, guardRim, pommel, bow);
  return {
    name: 'duelist-rapier',
    bodies: [
      { name: 'rapierBlade', shape: blade, options: { color: C.blade, roughness: 0.28, metalness: 0.9, detail: 0.002 }, bone: 'hand.R' },
      { name: 'rapierHilt', shape: hilt, options: { color: C.hilt, roughness: 0.4, metalness: 0.7, detail: 0.003 }, bone: 'hand.R' },
    ],
  };
}
