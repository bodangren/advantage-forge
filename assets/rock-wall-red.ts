import { defineAsset, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note - rock wall (nature/terrain/rock-wall).
 * Role: modular cave and canyon wall segment, tiles side by side on a 2 m grid.
 * Size: 2.0 m wide (x, flush at x = +-1), 0.9 m thick, 2.6 m tall, on y = 0, front toward +Z.
 * One idea: chunky stacked sediment layers, each a rounded slab with bulges that overhang a little.
 * Shape language: square and heavy, with round bulges and soft bevels; a few dark cracks.
 * Palette: rock #7d7468, dark layers #6a6258, light layers #8b8274, moss #5f7a3a. Slot 'rock'
 *   recolors the stone: grey (default), red, ice.
 * Materials: stone (roughness 0.92, bump grit), moss (roughness 0.9, not in the slot).
 * Chaining: every layer ends are cut flat at x = +-1 and have the same depth, so neighbors meet.
 */

const R = (i: number, j: number): number => noise.random(i, j, 3.3);
const W = 2.0;
const H = 2.6;
const LAYERS = 7;

function rockShape(): { shape: Sdf; bounds: readonly number[] } {
  const bounds: number[] = [0];
  const raw = Array.from({ length: LAYERS }, (_, i) => 0.8 + 0.5 * R(i, 1));
  const sum = raw.reduce((a, v) => a + v, 0);
  let y = 0;
  const parts: Sdf[] = [];
  raw.forEach((r, i) => {
    const h = (r / sum) * H;
    const depth = 0.5 + 0.08 * R(i, 2); // slab depth 0.5..0.58, bulges reach 0.8 in all
    const zc = (R(i, 3) - 0.5) * 0.06;
    const slab = sdf.box([W + 0.2, h - 0.01, depth], 0.06).at(0, y + h / 2, zc);
    // Bulges on the front and back faces, kept inside |x| < 0.8.
    let s: Sdf = slab;
    for (let j = 0; j < 3; j++) {
      const bx = -0.65 + 0.65 * j + (R(i, 10 + j) - 0.5) * 0.3;
      const bz = (j + i) % 2 === 0 ? 1 : -1;
      const rx = 0.28 + 0.14 * R(i, 20 + j);
      const ry = h * (0.38 + 0.1 * R(i, 30 + j));
      const rz = 0.1 + 0.04 * R(i, 40 + j);
      s = s.smoothUnion(0.07, sdf.ellipsoid([rx, ry, rz]).at(bx, y + h * 0.5, zc + bz * (depth / 2 - 0.01)));
    }
    parts.push(s);
    y += h;
    bounds.push(y);
  });
  let shape = sdf.union(...parts);
  // Cracks: thin slanted slots cut into the front and back.
  const crack = (x: number, y0: number, z: number, len: number, rot: number): Sdf =>
    sdf.box([0.04, len * 1.4, 0.3], 0.012).rotateZ(rot).at(x, y0, z);
  shape = shape.subtract(
    crack(-0.35, 1.6, 0.5, 0.7, 14),
    crack(0.5, 0.8, 0.5, 0.55, -10),
    crack(0.15, 2.1, 0.5, 0.45, 20),
    crack(-0.5, 1.0, -0.5, 0.6, -12),
    crack(0.4, 1.9, -0.5, 0.6, 8),
  );
  shape = shape.intersect(sdf.box([W, H, 0.8]).at(0, H / 2, 0));
  return { shape, bounds };
}

const { shape: rockS, bounds } = rockShape();
export default defineAsset({
  name: 'rock-wall-red',
  description:
    'A 2 m wide, 0.9 m thick, 2.6 m tall layered rock wall segment: stacked sediment slabs with round bulges, cracks, and canyon red rock colours; chains side by side.',
  detail: 0.02,
  texture: { size: 1024 },
  build(k) {
    const base = rgb('#b5593a');
    const dark = rgb('#a04d30');
    const light = rgb('#c9704a');
    let painted: Sdf = rockS.paint(base);
    for (let i = 0; i < LAYERS; i++) {
      const t = R(i, 5);
      if (t >= 0.34 && t < 0.67) continue;
      const lo = bounds[i] ?? 0;
      const hi = bounds[i + 1] ?? H;
      painted = painted.paintWhere(sdf.box([3, hi - lo - 0.02, 2]).at(0, (lo + hi) / 2, 0), t < 0.34 ? dark : light);
    }
    const sand = rgb('#e0b48a');
    const streak = (x: number, y: number, len: number, rot: number): Sdf =>
      sdf.box([0.03, len * 1.4, 3], 0.01).rotateZ(rot).at(x, y, 0);
    painted = painted
      .paintWhere(sdf.union(streak(-0.35, 1.6, 0.7, 14), streak(0.5, 0.8, 0.55, -10), streak(0.15, 2.1, 0.45, 20)), sand)
      .paintWhere(sdf.box([3, 0.1, 2]).at(0, H - 0.03, 0), rgb('#dcc0a0'));
    k.body('stone', painted, {
      color: base,
      roughness: 0.92,
      metalness: 0,
      detail: 0.03,
      maxError: 0.006,
      maxTriangles: 30000,
      textureDensity: 2,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 12, y * 12, z * 12, 3, 17),
    });
    
  },
});
