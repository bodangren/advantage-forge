import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Lava rock (nature/terrain/lava-rock), matched to docs/item-mockups/lava-rock-mock.jpg.
 * Role: background terrain prop, 0.9 m wide, 0.6 m tall, on y = 0, facing +Z.
 * One idea: a boulder split into thick basalt plates with wide glowing seams between them.
 * Shape language: chunky and angular (flat-shaded plates) around one round glowing core.
 * Palette: basalt #2e2e34 / #45454d (light on top faces), lava #ff6a12 on dark base #4a1405.
 * Materials: lava core (emissive), basalt plates, basalt fragments, ember spheres (emissive).
 * Detail: nine plates in three tiers (1 top, 4 upper ring, 4 lower ring), three fragments, five embers.
 * Focal point: the glowing seams. Nothing is painted orange; all glow is emissive bodies.
 */

const CY = 0.27;
const shell = sdf.sphere(0.34).at(0, CY, 0).subtract(sdf.sphere(0.25).at(0, CY, 0));

// One plate: the shell patch inside a rounded box pointing along (azimuth, elevation), with its own
// width, height and twist so no two plates share an outline.
function plate(az: number, el: number, w: number, h: number, twist = 0) {
  const cutter = sdf.box([w, h, 0.3], 0.03).rotateZ(twist).at(0, 0, 0.3).rotateX(-el).rotateY(az).at(0, CY, 0);
  return shell.intersect(cutter).round(0.008);
}

const plates = [
  plate(0, 90, 0.26, 0.26, 20),
  plate(15, 52, 0.22, 0.28, 8),
  plate(105, 50, 0.24, 0.26, -10),
  plate(195, 54, 0.21, 0.3, 14),
  plate(285, 51, 0.23, 0.27, -6),
  plate(60, 0, 0.38, 0.4, 5),
  plate(150, 2, 0.36, 0.44, -8),
  plate(245, -2, 0.39, 0.38, 10),
  plate(335, 0, 0.37, 0.42, -4),
];
const lumpy = sdf.union(...plates).displace(0.02, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 2));

const emberMat = { color: '#3a0c02', roughness: 0.3, metalness: 0, emissive: '#ff5a08', emissiveIntensity: 1.4 } as const;

export default defineAsset({
  name: 'lava-rock',
  description: 'A boulder broken into thick basalt plates with glowing lava seams, fragments and embers.',
  detail: 0.008,
  reference: 'docs/item-mockups/lava-rock-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const floor = sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([2, 2, 2]).at(0, 1, 0));
    k.body('lava', sdf.sphere(0.325).at(0, CY, 0).intersect(floor), { ...emberMat, detail: 0.012 });

    k.body(
      'basalt',
      lumpy
        .intersect(floor)
        .paintFn((x, y, z) => {
          const top = Math.max(0, Math.min(1, (y - 0.2) / 0.25));
          return mixRgb(rgb('#2e2e34'), rgb('#45454d'), top * (0.6 + 0.4 * noise.fbm(x * 8, y * 8, z * 8, 2)));
        }),
      { color: '#2e2e34', roughness: 0.8, metalness: 0, flat: true, detail: 0.01, maxError: 0.003, maxTriangles: 6500 },
    );

    const lump = (x: number, z: number, ry: number, rz: number) =>
      sdf.ellipsoid([0.14, 0.07, 0.11]).rotate(0, ry, rz).at(x, 0.05, z);
    k.body(
      'fragments',
      sdf
        .union(lump(0.42, 0.3, 30, 10), lump(-0.4, 0.34, -25, 12), lump(0.1, -0.44, 70, -8))
        .displace(0.02, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 2)),
      { color: '#3a3a40', roughness: 0.85, metalness: 0, flat: true, detail: 0.01, maxError: 0.003, maxTriangles: 6500 },
    );

    const embers: [number, number, number][] = [
      [0.3, 0.42, 0.02],
      [-0.2, 0.46, 0.017],
      [0.58, 0.05, 0.02],
      [-0.55, 0.12, 0.018],
      [0.05, 0.56, 0.015],
      [-0.3, -0.42, 0.02],
      [0.5, -0.3, 0.016],
      [0.25, -0.55, 0.018],
    ];
    k.body('embers', sdf.union(...embers.map(([x, z, r]) => sdf.sphere(r).at(x, r * 0.8, z))), { ...emberMat, detail: 0.01 });
  },
});
