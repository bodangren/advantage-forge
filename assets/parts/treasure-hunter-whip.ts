import { sdf, type Part } from '../../src/index.js';

/**
 * Treasure hunter whip (part of `assets/treasure-hunter.ts`; standalone `assets/treasure-hunter-whip.ts`).
 * Class: hand-held, worn on the right hip. Local frame of the coil and handle: the coil axis along Z;
 * the host's `coilPose` turns it and sets it at the hip. The lash (whip-lash) is already in the host
 * frame (it hangs from the posed coil, skin tags whip1 to whip6). Bodies: whip-coil, whip-handle
 * (bone `whip`), whip-lash.
 */

type V3 = readonly [number, number, number];
const C = { whip: '#4a2e1c', cloth: '#2a160a' };
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const along = (p: V3, d: V3, s: number): V3 => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];

export const WHIP_COIL_AT: V3 = [-0.099, 0.195, 0.125];
export const WHIP_COIL_ANGLE = -29;
const COIL_AT = WHIP_COIL_AT;
const COIL_R = 0.05;
const TAIL_D = norm([-0.2, -1, 0.14]);
const SEG = 0.024;
const TAIL_START: V3 = [COIL_AT[0] + 0.004, COIL_AT[1] - COIL_R + 0.004, COIL_AT[2]];
const tailPts: V3[] = Array.from({ length: 7 }, (_, i) => along(TAIL_START, TAIL_D, SEG * i));

export function treasureHunterWhip(): Part {
    const coil = sdf.union(
      ...[0, 1, 2].map((i) => sdf.torus(COIL_R - i * 0.002, 0.016).rotateX(90).at(0, 0, (i - 1) * 0.022)),
    );
    const whipBump = (x: number, y: number, z: number) => 0.0016 * Math.sin((x * 1.3 + y + z * 0.7) * 330);
    const lash = sdf.smoothUnion(
      0.008,
      ...tailPts.slice(0, 6).map((p, i) => sdf.capsule(p, tailPts[i + 1]!, 0.0135 - i * 0.0013).bone(`whip${i + 1}`)),
    );
    const handle = sdf.capsule([-0.02, 0.05, 0], [-0.07, 0.085, 0], 0.0135);
  return {
    name: 'treasure-hunter-whip',
    bodies: [
      { name: 'whip-coil', shape: coil, options: { color: C.whip, roughness: 0.75, detail: 0.004, bump: whipBump }, bone: 'whip' },
      { name: 'whip-handle', shape: handle, options: { color: C.cloth, roughness: 0.6, detail: 0.004 }, bone: 'whip' },
      { name: 'whip-lash', shape: lash, options: { color: C.whip, roughness: 0.75, detail: 0.004, bump: whipBump } },
    ],
  };
}
