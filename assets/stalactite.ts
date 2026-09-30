import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — cave ceiling stalactite cluster (nature/terrain/stalactite), reworked.
 *
 * Role: cave-ceiling terrain dressing for the Sunken Vault; the scene hangs it,
 *   so the longest tip lands on y = 0. Must read at 128 px as one slab with
 *   five clean cones.
 * Size: slab 1.05 x 0.34 x 0.66 m at y 1.23 (top y 1.4); five cones hanging
 *   from y 1.1, lengths 1.05, 0.7, 0.55, 0.45, 0.35 m. Faces +Z. No rig.
 * One idea: a rounded ceiling chunk dripping five smooth, pale-tipped cones of
 *   different lengths; the long centre cone is the landmark.
 * Shape language: triangular (cones) on a round slab.
 * Palette: stone #6f7680, dark underside #4b525c, pale mineral #a9b0bb, pale
 *   blue #b9c9d6 (centre cone tip accent), moss #5f7f4d (one corner, paint only).
 * Materials: slab stone (rough 0.78), drips wet stone (rough 0.5).
 * Detail: slab + cones with flared roots (big), one bulge ring per cone
 *   (medium), tip fade, moss patch, grain bump (small).
 * Rig/animation: none.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const TIP_PALE = rgb('#a9b0bb');
const TIP_BLUE = rgb('#b9c9d6');
const MOSS = rgb('#5f7f4d');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

interface Cone {
  x: number;
  z: number;
  len: number;
  r0: number;
}
const Y0 = 1.1;
const CONES: Cone[] = [
  { x: 0.0, z: 0.0, len: 1.1, r0: 0.13 },
  { x: -0.32, z: 0.1, len: 0.7, r0: 0.115 },
  { x: 0.3, z: 0.12, len: 0.55, r0: 0.105 },
  { x: -0.12, z: -0.2, len: 0.45, r0: 0.095 },
  { x: 0.24, z: -0.18, len: 0.35, r0: 0.09 },
];
const R_TIP = 0.012;

const coneShape = (c: Cone): Sdf => {
  const tip: Vec3 = [c.x, Y0 - c.len, c.z];
  const body = sdf.cone([c.x, Y0 + 0.05, c.z], tip, c.r0 * 1.04, R_TIP);
  const ringR = c.r0 + (R_TIP - c.r0) / 3 - 0.004;
  const ring = sdf.torus(ringR, 0.026).at(c.x, Y0 - c.len / 3, c.z);
  return body.smoothUnion(0.04, ring);
};

const slabShape = sdf
  .box([1.05, 0.34, 0.66], 0.1)
  .at(0, 1.23, 0)
  .displace(0.02, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 3));

export default defineAsset({
  name: 'stalactite',
  description:
    'Chunk of cave ceiling: one rounded rock slab with five clean mineral cones of different lengths; the longest tip reaches y = 0.',
  reference: 'docs/item-mockups/stalactite-mock.jpg',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    const cones = sdf.union(...CONES.map(coneShape));
    const drips = cones
      .smoothUnion(0.06, slabShape)
      .intersect(sdf.box([3, 1.16, 3]).at(0, 0.5, 0));

    const dripPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = base;
      for (const d of CONES) {
        if (Math.hypot(x - d.x, z - d.z) > d.r0 * 1.6) continue;
        const f = clamp01((Y0 - y) / d.len); // 0 at root, 1 at tip
        c = mixRgb(c, TIP_PALE, smoothstep(0.5, 0.95, f));
        if (d === CONES[0]) c = mixRgb(c, TIP_BLUE, smoothstep(0.66, 0.9, f));
      }
      c = mixRgb(c, STONE_DARK, smoothstep(1.06, 1.12, y) * 0.6);
      const n = noise.fbm(x * 6, y * 3, z * 6, 3, 7);
      return mixRgb(c, STONE_DARK, clamp01(-n) * 0.18);
    };
    k.body('drips', drips.paintFn(dripPaint), {
      color: STONE,
      roughness: 0.5,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 3200,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 30, y * 20, z * 30, 3, 11),
    });

    const slabPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = mixRgb(STONE_DARK, base, smoothstep(1.06, 1.16, y));
      const n = noise.fbm(x * 5, y * 5, z * 5, 3, 3);
      c = mixRgb(c, STONE_DARK, clamp01(-n) * 0.25);
      const moss =
        smoothstep(0.3, 0.12, Math.hypot(x - 0.46, z - 0.28)) *
        smoothstep(1.22, 1.32, y) *
        clamp01(0.7 + noise.fbm(x * 20, y * 20, z * 20, 2, 5));
      return mixRgb(c, MOSS, clamp01(moss));
    };
    k.body('slab', slabShape.paintFn(slabPaint), {
      color: STONE,
      roughness: 0.78,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 26, y * 26, z * 26, 3, 9),
    });
  },
});
