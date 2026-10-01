import { profile, rgb, sdf, type Part, type PartTint, type Vec3 } from '../../src/index.js';

/**
 * Swashbuckler bandana (part of `assets/swashbuckler.ts`; standalone `assets/swashbuckler-bandana.ts`).
 * A red band around the brow with a knot and two tails at the back. Class: head. Local frame: the
 * origin is the head center (0, 0.675, 0), +Y up, the face toward +Z. Body: bandana (bone `head`).
 * Tint slot: `clothing`. The code is the host's, unchanged; `local` and the host pose cancel.
 */
const C = { bandanaFold: '#8a2420', bandana: '#c93a32' };
const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
export const SWASHBUCKLER_BANDANA_MOUNT: Vec3 = [0, 0.675, 0];

export function swashbucklerBandana(tint: PartTint): Part {
  const T = {
    cloth: tint('clothing'),
    fold: tint('clothing', { color: C.bandanaFold, follow: 1 }),
  };
    const skull = (grow: number) => sdf.ellipsoid([HEAD[0] + grow, HEAD[1] + grow, HEAD[2] + grow]).at(0, HEAD_Y, -0.005);
    const slab = sdf.box([0.7, 0.056, 0.7], 0.008).rotateX(-9).at(0, 0.768, 0);
    // Hollow: the inside follows the skull 0.006 under its surface, so a worn band looks the same
    // and a band on its own reads as a ring.
    const bandShape = skull(0.024).intersect(slab).subtract(skull(-0.006));
    const KX = 0.065;
    const knot = sdf.ellipsoid([0.034, 0.03, 0.028]).at(KX, 0.752, -0.224);
    // Two tails, 0.09 long and 0.03 wide, 0.022 thick, hanging from the knot at the back left.
    const tail = (turn: number, len: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.015, 0],
            [0.015, 0],
            [0.019, -len],
            [0, -len + 0.02],
            [-0.019, -len - 0.004],
          ]),
          0.022,
          0.006,
        )
        .rotateX(10)
        .rotateZ(turn)
        .at(KX, 0.742, -0.234);
    const bandana = sdf
      .smoothUnion(0.01, bandShape, knot, tail(16, 0.09), tail(-12, 0.085))
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const fold = Math.sin(a * 9 + y * 26) > 0.86 || (y > 0.772 && Math.sin(a * 5 - y * 40) > 0.93);
        return fold ? rgb(T.fold) : base;
      });
  const local = (s: sdf.Shape) => s.at(0, -SWASHBUCKLER_BANDANA_MOUNT[1], 0);
  return {
    name: 'swashbuckler-bandana',
    bodies: [{ name: 'bandana', shape: local(bandana), options: { color: T.cloth, roughness: 0.85, detail: 0.004 }, bone: 'head' }],
  };
}
