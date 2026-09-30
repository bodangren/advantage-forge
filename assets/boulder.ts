import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * nature/terrain/boulder — weathered granite boulder for the Chibi Quest landscape.
 *
 * Role: background terrain prop the player walks past; must read at the 128 px sprite size.
 * Size: about 1.2 m wide, 0.8 m tall, flat base on y = 0, facing +Z. No rig, no clips.
 * One idea: a cluster of three faceted stones (big, medium leaning on +X, small at front -X),
 *   each cut by tilted planes, with one ragged moss cap on the big stone.
 * Shape language: round dominant (friendly), flat facets secondary (stone), one moss accent.
 * Palette: grey #9aa3a6, lighter top #b8c0c2, darker base #7a8286,
 *   warm flecks #6f675a, moss accent #47701f / light #6f9c34.
 * Materials: stone (roughness 0.9, grain + speckle in bump) and moss (roughness 0.98, fuzzy bump).
 * Detail list: one merged lumpy mass with a raised crown (big), three facet planes (medium),
 *   grain/speckle bump (small). Focal point: the moss patch.
 */

const stoneDark = rgb('#5f676b');
const stoneLight = rgb('#9aa2a5');
const fleck = rgb('#646a6d');
const mossDark = rgb('#2b4713');
const mossLight = rgb('#6f9a2e');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

export default defineAsset({
  name: 'boulder',
  description: 'Chunky weathered granite boulder with soft facet planes and a moss patch; 1.2 m wide.',
  detail: 0.01,
  reference: 'reference/boulder/boulder_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // A faceted stone: ellipsoid cut by tilted planes (normal, distance from center).
    const cuts = (base: Sdf, list: [Vec3, number][]): Sdf =>
      list.reduce((s, [n, d]) => s.smoothIntersect(0.01, sdf.halfSpace(norm(n), d)), base);
    const big = cuts(sdf.ellipsoid([0.46, 0.44, 0.4]), [
      [[0, 1, 0.05], 0.42],
      [[0.7, 0.75, 0.2], 0.4],
      [[-0.7, 0.7, 0.25], 0.4],
      [[0.9, 0.2, 0.3], 0.35],
      [[-0.9, 0.1, 0.3], 0.37],
      [[0.1, 0.25, 1], 0.31],
      [[0.15, 0.3, -1], 0.33],
      [[-0.6, 0.2, -0.8], 0.36],
      [[0.6, 0.15, -0.8], 0.36],
    ]).at(-0.08, 0.34, -0.06);
    const med = cuts(sdf.ellipsoid([0.27, 0.25, 0.28]), [
      [[0.2, 1, 0.1], 0.19],
      [[0.8, 0.7, 0], 0.22],
      [[1, 0.1, 0.2], 0.2],
      [[0.2, 0.4, 1], 0.2],
      [[-0.3, 0.6, -1], 0.2],
    ]).rotateZ(12).rotateY(25).at(0.38, 0.19, 0.06);
    const small = cuts(sdf.ellipsoid([0.21, 0.16, 0.19]), [
      [[0, 1, 0.2], 0.12],
      [[-1, 0.6, 0.2], 0.15],
      [[-1, 0, 0.3], 0.16],
      [[0.3, 0.3, 1], 0.14],
    ]).rotateY(-20).at(-0.4, 0.11, 0.27);
    const ground = sdf.halfSpace([0, -1, 0], 0);
    const stone = sdf
      .union(big, med, small)
      .displace(0.006, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 2, 4))
      .round(0.008)
      .intersect(ground);

    // Moss: thin shell of the top surface, limited by a height band on the big stone.
    const shell = stone.round(0.014).subtract(stone.round(-0.008));
    const bigTop = sdf.cylinder(0.27, 0.16).at(-0.02, 0.72, 0.03);
    // The medium-stone patch sat on a slope and read as a flat shelf; the big stone keeps the only patch.
    const band = bigTop
      .displace(0.07, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 3, 9));
    const moss = shell.intersect(band).round(0.004);

    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.75);
      let c = mixRgb(stoneDark, base, clamp01(t * 3));
      c = mixRgb(c, stoneLight, clamp01((t - 0.7) / 0.3));
      const patch = noise.fbm(x * 3.4, y * 3.4, z * 3.4, 3, 2);
      c = mixRgb(c, stoneDark, clamp01(-patch) * 0.35);
      const d1 = noise.fbm(x * 60, y * 60, z * 60, 2, 27);
      c = mixRgb(c, stoneDark, clamp01((d1 - 0.25) * 4) * 0.7);
      const d2 = noise.fbm(x * 75, y * 75, z * 75, 2, 31);
      c = mixRgb(c, rgb('#b4bbbd'), clamp01((d2 - 0.3) * 4) * 0.6);
      return c;
    };
    const mossPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const n = noise.fbm(x * 18, y * 18, z * 18, 3, 6);
      let c = mixRgb(mossDark, base, clamp01(0.6 + n * 0.5));
      c = mixRgb(c, mossLight, clamp01(n) * 0.4);
      return c;
    };

    k.body('stone', stone.paintFn(stonePaint), {
      color: '#7d8588',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 14000,
      bump: (x, y, z) =>
        0.0024 * noise.fbm(x * 36, y * 36, z * 36, 3, 11) +
        0.0008 * noise.noise3(x * 95, y * 95, z * 95, 5),
    });
    k.body('moss', moss.paintFn(mossPaint), {
      color: '#6f9a2e',
      roughness: 0.98,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 3000,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 70, y * 70, z * 70, 3, 3),
    });
  },
});
