import { noise, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Fighter buckler (part of `assets/fighter.ts`; standalone `assets/fighter-buckler.ts`).
 *
 * A round wooden disc (0.26 m across) with a brass rim, a pointed brass boss, and three studs.
 * Class: shield. Local frame: the disc center on its back plane, the face toward +Z, the top
 * toward +Y (the fighter's shieldPose places it on the left forearm).
 * Bodies: buckler, buckler-brass (bone `forearm.L`). No tint slot.
 */

const C = { wood: '#8a5a35', woodGrain: '#6b4226', brass: '#c9a24a' };
const rad = Math.PI / 180;

export function fighterBuckler(): Part {
  const LZ = 0.06;
  const front = (s: sdf.Shape) => s.at(0, 0, LZ);
  const BR = 0.13;
  const disc = sdf.cylinder(BR - 0.004, 0.026, 0.008).rotateX(90);
  const handle = sdf.capsule([-0.035, 0.0, -0.022], [0.035, 0.0, -0.022], 0.012);
  const plank = (x: number, y: number) => Math.sin(x * 62 + noise.noise3(x * 5, y * 1.2, 0) * 1.6);
  const wood = sdf.union(disc, handle).paintFn((x, y, z, base) => (plank(x, y) > 0.55 ? rgb(C.woodGrain) : base));
  const rim = sdf.torus(BR - 0.011, 0.014).rotateX(90);
  const boss = sdf
    .smoothUnion(0.01, sdf.cone([0, 0, 0.008], [0, 0, 0.088], 0.056, 0.004), sdf.cylinder(0.06, 0.016, 0.006).rotateX(90).at(0, 0, 0.016))
    .round(0.002);
  const stud = (deg: number) => sdf.sphere(0.013).scale([1, 1, 0.7]).at(Math.sin(deg * rad) * 0.098, Math.cos(deg * rad) * 0.098, 0.016);

  return {
    name: 'fighter-buckler',
    bodies: [
      {
        name: 'buckler',
        shape: front(wood),
        options: { color: C.wood, roughness: 0.75, detail: 0.005, bump: (x: number, y: number) => 0.0008 * plank(x, y) },
        bone: 'forearm.L',
      },
      {
        name: 'buckler-brass',
        shape: front(sdf.union(rim, boss, stud(0), stud(120), stud(240))),
        options: { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.004 },
        bone: 'forearm.L',
      },
    ],
  };
}
