import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * nature/terrain/cave-mouth — ring of chunky grey boulders around a black opening on a mossy mat.
 *
 * Role: forest landmark and dungeon entrance; background prop, reads at 128 px.
 * Size: 4 m wide, 3 m tall, on y = 0, opening faces +Z. No rig, no clips.
 * One idea: an arch of nine leaning boulders that reads as a ring around a black hole.
 * Shape language: square-round chunky boulders with soft bevels.
 * Palette: stone #8a94a0 (crevice #5b6670, crown #aab4bf), grass #7ec850 / #4a8a3f,
 *   moss #4a9a4f, interior #1a1c20.
 * Materials: stone, interior, grass.
 * Detail list: arch (big), ground mat + loose stones (medium), moss dots + grain (small).
 * Focal point: the black opening.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const grayDark = rgb('#5b6670');
const grayLight = rgb('#aab4bf');
const grassDeep = rgb('#4a8a3f');
const grassLight = rgb('#6db04a');

export default defineAsset({
  name: 'cave-mouth',
  description: 'Rocky cave entrance, 4 m wide and 3 m tall: nine boulder arch, black opening, mossy grass mat.',
  reference: 'bench/overnight/refs/p1-forest/cave-mouth-mock.jpg',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // Arch: nine boulders on an ellipse from (-1.8,0.5) over (0,2.5) to (1.8,0.5).
    const sizes: [number, number, number][] = [
      [1.2, 1.0, 1.1], [1.1, 0.9, 1.0], [1.3, 1.0, 1.2], [1.2, 0.9, 1.0], [1.4, 1.1, 1.2],
      [1.2, 0.9, 1.1], [1.3, 1.0, 1.0], [1.1, 0.9, 1.1], [1.2, 1.0, 1.0],
    ];
    const boulders = sizes.map((s, i) => {
      const th = (i / 8) * Math.PI;
      const x = 1.8 * Math.cos(th);
      const y = 0.5 + 2.0 * Math.sin(th);
      const deg = (th * 180) / Math.PI;
      const sg = (n: number) => (n % 2 ? 1 : -1) * (10 + ((i * 7 + n * 5) % 21));
      return sdf
        .box([s[0] * 1.15, s[1] * 1.15, s[2] * 1.15 * 1.1], 0.05)
        .rotate(sg(1), sg(2), deg - 90 + sg(3) * 0.5)
        .at(x, y, ((i % 3) - 1) * 0.06);
    });
    const arch = sdf.smoothUnion(0.05, ...boulders);

    const loose = [
      sdf.box([0.35, 0.3, 0.3], 0.06).rotate(0, 25, 8).at(-1.75, 0.12, 1.0),
      sdf.box([0.3, 0.25, 0.3], 0.06).rotate(0, -30, 5).at(1.9, 0.1, 0.9),
      sdf.box([0.4, 0.3, 0.35], 0.06).rotate(10, 40, 0).at(-1.0, 0.13, 1.1),
      sdf.box([0.28, 0.25, 0.3], 0.06).rotate(0, 15, -10).at(1.3, 0.1, 1.2),
      sdf.box([0.25, 0.22, 0.28], 0.06).rotate(0, 60, 6).at(2.2, 0.1, 0.1),
      sdf.box([0.7, 0.1, 0.5], 0.04).rotate(0, -10, 0).at(0.3, 0.06, 1.3),
    ];
    const mound = [
      sdf.box([2.6, 2.2, 1.0], 0.05).rotate(6, 12, -8).at(0, 1.05, -0.8),
      sdf.box([2.0, 1.6, 0.9], 0.05).rotate(-8, -15, 10).at(0.1, 0.75, -1.2),
    ];
    const stones = sdf
      .union(arch, ...loose, ...mound)
      .displace(0.02, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 2, 4))
      .intersect(sdf.halfSpace([0, -1, 0], -0.0));

    const interior = sdf.box([2.3, 2.1, 0.8], 0.1).at(0, 1.05, -0.12);

    const ground = sdf
      .ellipsoid([2.6, 0.25, 2.0])
      .at(0, -0.1, 0.3)
      .displace(0.12, (x, y, z) => noise.fbm(x * 1.2, 0, z * 1.2, 2, 9))
      .intersect(sdf.halfSpace([0, -1, 0], 0.02));
    const dots = Array.from({ length: 20 }, (_, i) => {
      const a = noise.random(i, 1, 2) * Math.PI * 2;
      const r = 0.7 + noise.random(i, 3, 4) * 1.7;
      const rad = 0.06 + noise.random(i, 5, 6) * 0.04;
      return sdf.sphere(rad).at(Math.cos(a) * r * 1.05, 0.11, 0.3 + Math.sin(a) * r * 0.75);
    });
    const mat = sdf.smoothUnion(0.03, ground, ...dots);

    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const e = 0.01;
      const ny = (stones.dist(x, y + e, z) - stones.dist(x, y - e, z)) / (2 * e);
      let c = base;
      c = mixRgb(c, rgb('#9aa3ad'), clamp01((ny - 0.35) / 0.3));
      const p = noise.fbm(x * 3, y * 3, z * 3, 3, 7);
      c = mixRgb(c, rgb('#545c66'), clamp01((-0.2 - p) * 4));
      const n = noise.fbm(x * 8, y * 8, z * 8, 3, 21);
      c = mixRgb(c, rgb('#4a9a4f'), clamp01((n - 0.15) * 2) * clamp01(1 - y / 0.6) * 0.8);
      return c;
    };
    const grassPaint = (x: number, y: number, z: number): Rgb => {
      const big = 0.5 + 0.5 * noise.fbm(x * 1.2, z * 1.2, 11, 3);
      let c = mixRgb(grassLight, grassDeep, clamp01((0.6 - big) * 2.6));
      const r = Math.hypot(x, z);
      c = mixRgb(c, grassDeep, clamp01((1.4 - r) / 1.4) * 0.35);
      if (y > 0.08) c = mixRgb(c, rgb('#4a9a4f'), 0.85);
      return c;
    };

    k.body('stone', stones.paintFn(stonePaint), {
      color: '#7d8791', roughness: 0.95, metalness: 0, detail: 0.012, flat: true, maxTriangles: 4500, paintWeight: 2,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 30, z * 30, 3, 11),
    });
    k.body('interior', interior, { color: '#1a1c20', roughness: 1, metalness: 0, detail: 0.02, flat: true, maxTriangles: 300 });
    k.body('grass', mat.paintFn(grassPaint), {
      color: '#6db04a', roughness: 0.95, metalness: 0, detail: 0.016, maxTriangles: 2000, maxError: 0.01,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 20, y * 6, z * 20, 2, 9),
    });
  },
});
