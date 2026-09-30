import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * nature/terrain/rock-cluster - six faceted granite stones on a low, irregular grass patch.
 *
 * Role: gap-filler terrain prop between a single boulder and flat ground; reads at 128 px.
 * Size: about 1.10 x 0.33 x 0.95 m, flat base on y = 0, facing +Z. No rig, no clips.
 * One idea: one dominant faceted stone with five smaller leaners, matching the boulder recipe.
 * Shape language: chunky planar facets (tilted half-space cuts) with soft 0.02 m fillets.
 * Palette: mid grey #7d8588 stone, dark base #5f676b, lighter tops #9aa2a5,
 *   dirt #5a4a30, grass #4f8a3a / #2f6a2f / light #7ab04a.
 * Materials: stone (roughness 0.9, grain and pits in bump) and ground (dirt, grass, tufts).
 * Detail list: six stones (big), ground patch hugging the bases (medium),
 *   grass tufts at the bases and speckle paint (small). No hard disc edge.
 */

const stoneDark = rgb('#5f676b');
const stoneLight = rgb('#9aa2a5');
const FIT: Vec3 = [0.87, 0.8, 0.84];
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

export default defineAsset({
  name: 'rock-cluster',
  description: 'Six faceted grey stones on a low irregular grass and dirt patch; 1.1 m wide.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const cuts = (base: Sdf, list: [Vec3, number][]): Sdf =>
      list.reduce((s, [n, d]) => s.smoothIntersect(0.015, sdf.halfSpace(norm(n), d * 0.88)), base);
    const stone = (r: Vec3, list: [Vec3, number][], ry: number, at: Vec3): Sdf =>
      cuts(sdf.ellipsoid(r), list).rotateY(ry).at(...at);

    const big = stone([0.3, 0.26, 0.26], [
      [[0.1, 1, 0.1], 0.2], [[0.8, 0.7, 0.1], 0.25], [[-0.7, 0.7, 0.3], 0.24],
      [[1, 0.1, 0.3], 0.26], [[-1, 0.1, 0], 0.26], [[0.1, 0.3, 1], 0.22], [[-0.2, 0.3, -1], 0.23],
    ], 20, [0.0, 0.18, -0.03]);
    const left = stone([0.22, 0.2, 0.2], [
      [[0, 1, 0.1], 0.15], [[-0.8, 0.6, 0.2], 0.17], [[0.9, 0.5, 0], 0.17],
      [[-1, 0.1, 0.3], 0.19], [[0.2, 0.3, 1], 0.17], [[0, 0.3, -1], 0.17],
    ], -25, [-0.36, 0.14, 0.12]);
    const right = stone([0.2, 0.17, 0.19], [
      [[0.1, 1, 0.2], 0.13], [[0.8, 0.6, 0.1], 0.15], [[-0.8, 0.7, 0], 0.15],
      [[1, 0.1, 0.2], 0.17], [[0.1, 0.3, -1], 0.16],
    ], 35, [0.37, 0.11, -0.12]);
    const front = stone([0.16, 0.12, 0.15], [
      [[0, 1, 0.3], 0.09], [[0.7, 0.7, 0], 0.11], [[-0.8, 0.6, 0.2], 0.11], [[0.2, 0.4, 1], 0.12],
    ], -10, [0.14, 0.08, 0.3]);
    const back = stone([0.17, 0.14, 0.15], [
      [[0.2, 1, 0], 0.11], [[-0.7, 0.7, 0], 0.13], [[0.8, 0.5, -0.3], 0.13], [[0, 0.3, -1], 0.13],
    ], 50, [-0.28, 0.1, -0.3]);
    const small = stone([0.11, 0.08, 0.1], [
      [[0, 1, 0.2], 0.06], [[0.9, 0.5, 0], 0.08], [[-0.6, 0.6, 0.6], 0.08],
    ], 15, [0.43, 0.06, 0.26]);

    const ground = sdf.halfSpace([0, -1, 0], 0);
    const stones = sdf
      .union(big, left, right, front, back, small)
      .displace(0.006, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 2, 4))
      .round(0.008)
      .intersect(ground)
      .scale(FIT);

    // Ground: overlapping flat blobs hugging the stone bases, ragged edge, top near y = 0.03.
    const blob = (rx: number, rz: number, x: number, z: number): Sdf =>
      sdf.ellipsoid([rx, 0.05, rz]).at(x, 0.0, z);
    const patch = sdf
      .smoothUnion(0.08,
        blob(0.5, 0.36, 0.0, 0.02), blob(0.3, 0.3, -0.3, 0.2), blob(0.3, 0.28, 0.36, -0.1),
        blob(0.28, 0.3, 0.2, 0.3), blob(0.3, 0.26, -0.25, -0.28), blob(0.2, 0.2, 0.42, 0.25))
      .displace(0.008, (x, y, z) => noise.fbm(x * 5, y * 5, z * 5, 2, 17))
      .intersect(ground)
      .scale(FIT);

    // Grass tufts at stone bases: fans of thin cones.
    const tuft = (x: number, z: number, s: number): Sdf => {
      const blades: Sdf[] = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + x * 9;
        const lean = 0.05 * s;
        blades.push(sdf.cone([x, 0.02, z], [x + Math.cos(a) * lean, 0.02 + (0.09 + 0.02 * (i % 2)) * s, z + Math.sin(a) * lean], 0.018 * s, 0.004));
      }
      return sdf.union(...blades).scale(FIT);
    };
    const tufts = sdf.union(
      tuft(-0.2, 0.3, 1), tuft(0.3, 0.12, 1.1), tuft(-0.52, 0.0, 0.9), tuft(0.0, 0.42, 1),
      tuft(0.22, -0.3, 1), tuft(-0.1, -0.38, 0.9), tuft(0.52, 0.0, 0.8), tuft(-0.45, 0.3, 0.9),
    );

    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.33);
      let c = mixRgb(stoneDark, base, clamp01(t * 3));
      c = mixRgb(c, stoneLight, clamp01((t - 0.55) / 0.4));
      const p = noise.fbm(x * 4, y * 4, z * 4, 3, 2);
      c = mixRgb(c, stoneDark, clamp01(-p) * 0.3);
      const d1 = noise.fbm(x * 60, y * 60, z * 60, 2, 27);
      c = mixRgb(c, stoneDark, clamp01((d1 - 0.25) * 4) * 0.6);
      const d2 = noise.fbm(x * 75, y * 75, z * 75, 2, 31);
      c = mixRgb(c, rgb('#a9b0b2'), clamp01((d2 - 0.3) * 4) * 0.5);
      return c;
    };

    const dirtPaint = (x: number, y: number, z: number): Rgb => {
      const grass = rgb('#4f8a3a');
      const n = 0.5 + 0.5 * noise.fbm(x * 5, z * 5, 11, 3);
      let c = mixRgb(grass, rgb('#2f6a2f'), clamp01((0.55 - n) * 2.2) * 0.7);
      c = mixRgb(c, rgb('#7ab04a'), clamp01((n - 0.6) * 2.5) * 0.5);
      // dirt near the stones and at the rim
      const r = Math.hypot(x / 0.5, (z - 0.02) / 0.4);
      const dirt = clamp01((r - 0.85) * 4) * 0.6 + clamp01(-noise.fbm(x * 9, z * 9, 5, 2) - 0.2) * 0.8;
      c = mixRgb(c, rgb('#5a4a30'), clamp01(dirt));
      return c;
    };
    const tuftPaint = (x: number, y: number, z: number): Rgb =>
      mixRgb(rgb('#3a7a30'), rgb('#8cc452'), clamp01((y - 0.02) / 0.1));

    k.body('stones', stones.paintFn(stonePaint), {
      color: '#7d8588',
      roughness: 0.9,
      metalness: 0,
      detail: 0.011,
      maxTriangles: 6000,
      bump: (x, y, z) =>
        0.0024 * noise.fbm(x * 36, y * 36, z * 36, 3, 11) +
        0.0008 * noise.noise3(x * 95, y * 95, z * 95, 5),
    });
    k.body('ground', patch.paintFn(dirtPaint), {
      color: '#4f8a3a',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 25, y * 6, z * 25, 2, 9),
    });
    k.body('tufts', tufts.paintFn(tuftPaint), {
      color: '#4f8a3a',
      roughness: 0.95,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 800,
    });
  },
});
