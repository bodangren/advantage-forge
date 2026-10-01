import { sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Apprentice round glasses (part of `assets/apprentice.ts`; standalone `assets/apprentice-glasses.ts`).
 *
 * Thin dark round rims, a bridge, and two temples that run back to the ears.
 * Class: head. Local frame: the origin is the head center (rounded to 1/1024 m), the character
 * axes, the lenses toward +Z. About 0.44 m wide with the temples, 0.15 m tall, 0.23 m deep.
 * Bodies: glasses (bone `head`). Tint slots: none.
 *
 * The code is the apprentice's, unchanged, in the character frame; the host adds the mount back.
 */

const C = { glass: '#1a1a1a' };
type V3 = readonly [number, number, number];

export const MOUNT: Vec3 = [0, Math.round(0.675 * 1024) / 1024, 0];
export const GLASS_Y = 0.628 + 0.004;
export const EYE_X = 0.105;
/**
 * The face depths that the glasses sit on: the surface z at the right lens (EYE_X, GLASS_Y) and at
 * the bridge (0, GLASS_Y + 0.012). The host measures them on its head with `sdf.raycast`; the
 * defaults are the apprentice head's values, for the standalone.
 */
export interface FaceDepths {
  readonly lens: number;
  readonly bridge: number;
}
const APPRENTICE_FACE: FaceDepths = { lens: 0.17348410892503652, bridge: 0.1881499482135789 };
const LENS_R = 0.064;

const rad = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export function apprenticeGlasses(face: FaceDepths = APPRENTICE_FACE): Part {
  const lensC: V3 = [EYE_X, GLASS_Y, face.lens + 0.016];
  const onLens = (p: V3) => add(rotY(p, 20), lensC);
  const rim = sdf.torus(LENS_R, 0.0088).rotateX(90).rotateY(20).at(...lensC);
  const lensIn = onLens([-LENS_R, 0.004, 0]);
  const lensOut = onLens([LENS_R, 0.004, 0]);
  const bridgeZ = Math.max(lensIn[2], face.bridge + 0.012);
  const bridge = sdf.chain(
    [
      [lensIn[0], lensIn[1], lensIn[2], 0.0062],
      [0, GLASS_Y + 0.014, bridgeZ, 0.0058],
      [-lensIn[0], lensIn[1], lensIn[2], 0.0062],
    ],
    0.004,
  );
  const temple = sdf.chain(
    [
      [lensOut[0], lensOut[1], lensOut[2], 0.006],
      [0.2, GLASS_Y + 0.01, 0.07, 0.0055],
      [0.216, GLASS_Y + 0.012, -0.01, 0.005],
    ],
    0.004,
  );
  const shape = sdf.union(hard(sdf.union(rim, temple)), bridge);
  return {
    name: 'apprentice-glasses',
    bodies: [
      {
        name: 'glasses',
        shape: shape.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]),
        options: { color: C.glass, roughness: 0.3, metalness: 0.4, detail: 0.003 },
        bone: 'head',
      },
    ],
  };
}
