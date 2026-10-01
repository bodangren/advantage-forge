import { mixRgb, noise, rgb, sdf, type Part, type PartTint } from '../../src/index.js';
import { featherShape } from './shaman-feather.js';

/**
 * Shaman antler fur cap (part of `assets/shaman.ts`; standalone `assets/shaman-cap.ts`).
 *
 * A dark fur dome on a rolled brim, a teal band, two branching antlers, and a fan of three feathers.
 * Class: head. Local frame: the origin is the head center (0, 0.675, 0); the face toward +Z.
 * Bodies: cap, band, antlers, feathers (bone `head`). Tint slot: `cloth` (the band and a feather).
 * The code is the shaman's, unchanged, in the character frame; the part moves it by -MOUNT.
 */

const C = { hide: '#4a3428', hideDark: '#2e1e14', antler: '#5a4030', antlerTip: '#7a5a44', red: '#d83a3a', yellow: '#e8c840', quill: '#3a2618' };
type V3 = readonly [number, number, number];
const rad = Math.PI / 180;
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const hard = (s: sdf.Shape) => s.mirror('x', 0);
export const MOUNT: V3 = [0, HEAD_Y, 0];

export function shamanCap(tint: PartTint): Part {
  const T = { cloth: tint('cloth') };
  const local = (s: sdf.Shape) => s.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]);
    const BAND_Y = 0.805;
    const BAND_TILT = 6; // the front of the band is lower than the back
    const skullOut = (d: number) => sdf.ellipsoid([HEAD[0] + d, HEAD[1] + d, HEAD[2] + d]).at(0, HEAD_Y, 0);
    const capPlane = sdf.halfSpace(norm([0, -Math.cos(BAND_TILT * rad), -Math.sin(BAND_TILT * rad)]), -(BAND_Y + 0.02) * Math.cos(BAND_TILT * rad));
    // A tall fur dome (0.08 m above the band) on a rolled brim 0.03 m thick that follows the band.
    const dome = sdf.smoothUnion(0.03, skullOut(0.032), sdf.ellipsoid([0.15, 0.1, 0.14]).at(0, 0.862, -0.01)).intersect(capPlane);
    const brim = skullOut(0.05).smoothIntersect(0.012, sdf.box([0.7, 0.03, 0.7], 0.012).rotateX(BAND_TILT).at(0, BAND_Y + 0.033, 0));
    const capShape = sdf
      .smoothUnion(0.012, dome, brim)
      .displace(0.004, (x: number, y: number, z: number) => noise.fbm(x * 26, y * 26, z * 26, 3));
    const capWithFolds = capShape.paintFn((x: number, y: number, z: number, base) => {
      const f = noise.fbm(x * 70 + 3, y * 40, z * 70, 2);
      return f > 0.12 ? mixRgb(base, rgb(C.hideDark), Math.min(1, (f - 0.12) * 4)) : base;
    });
    const capBody = { name: 'cap', shape: capWithFolds, options: { color: C.hide, roughness: 0.9, detail: 0.007, bump: (x: number, y: number, z: number) => 0.003 * noise.fbm(x * 60, y * 60, z * 60, 2) }, bone: 'head' };

    const bandShape = skullOut(0.022).smoothIntersect(0.004, sdf.box([0.7, 0.04, 0.7], 0.006).rotateX(BAND_TILT).at(0, BAND_Y, 0));
    const bandBody = { name: 'band', shape: bandShape, options: { color: T.cloth, roughness: 0.8, detail: 0.005 }, bone: 'head' };

    // Two antlers that sweep out and up and curve in at the tips: a main beam of 5 points
    // (radius 0.022 tapering to 0.012) and two tines, on a round burl. The tips reach 0.24 m above
    // the cap top.
    const antler = sdf
      .smoothUnion(
        0.012,
        sdf.chain(
          [
            [0.09, 0.875, -0.01, 0.022],
            [0.135, 0.925, -0.02, 0.0195],
            [0.19, 0.98, -0.04, 0.017],
            [0.222, 1.045, -0.07, 0.0145],
            [0.215, 1.105, -0.1, 0.012],
          ],
          0.015,
        ),
        sdf.chain(
          [
            [0.19, 0.98, -0.04, 0.0135],
            [0.25, 1.03, -0.025, 0.0115],
            [0.284, 1.09, -0.012, 0.0095],
            [0.29, 1.15, -0.01, 0.0075],
          ],
          0.012,
        ),
        sdf.chain(
          [
            [0.222, 1.045, -0.07, 0.0125],
            [0.178, 1.092, -0.07, 0.0105],
            [0.152, 1.15, -0.07, 0.0075],
          ],
          0.012,
        ),
        sdf.sphere(0.032).at(0.09, 0.878, -0.01),
      )
      .paintFn((x: number, y: number, z: number, base) => {
        const tip = Math.min(1, Math.max(0, (y - 1.03) / 0.07));
        const groove = noise.fbm(x * 90, y * 22, z * 90, 2) > 0.35 ? 0.35 : 0;
        return mixRgb(mixRgb(base, rgb(C.antlerTip), tip), rgb(C.hideDark), groove);
      });
    const antlersBody = { name: 'antlers', shape: hard(antler), options: { color: C.antler, roughness: 0.75, detail: 0.005, bump: (x: number, y: number, z: number) => 0.002 * noise.fbm(x * 70, y * 20, z * 70, 2) }, bone: 'head' };

    // Three feathers (red, yellow, teal) fan up at the front of the cap.
    const capTop = (x: number) => sdf.raycast(capShape, [x, 1.3, 0.07], [0, -1, 0])![1];
    const headFeather = (h: number, w: number, tilt: number, x: number, lean: number, color: string) => {
      const f = sdf
        .union(featherShape(h, w, 0.012).paint(color), sdf.capsule([0, -0.012, 0], [0, h * 0.94, 0], 0.0042).paint(C.quill))
        .rotateX(-lean)
        .rotateZ(tilt)
        .at(x, capTop(x) - 0.012, 0.07);
      return f;
    };
    const feathers = sdf.union(
      headFeather(0.12, 0.0175, 30, -0.05, 12, C.red),
      headFeather(0.12, 0.0175, -2, 0, 5, T.cloth),
      headFeather(0.12, 0.0175, -32, 0.05, 12, C.yellow),
    );
    const feathersBody = { name: 'feathers', shape: feathers, options: { color: C.yellow, roughness: 0.7, detail: 0.004 }, bone: 'head' };
  return {
    name: 'shaman-cap',
    bodies: [capBody, bandBody, antlersBody, feathersBody].map((b) => ({ ...b, shape: local(b.shape) })),
    regions: { inside: local(skullOut(0)) },
  };
}
