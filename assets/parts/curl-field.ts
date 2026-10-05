import { sdf } from '../../src/index.js';

/** Options for `curlField`. */
export interface CurlOptions {
  /**
   * Even spacing: cast `even` times as many rays and keep a point only where no kept point is
   * nearer than `spacing` times `R` (default 1.5), so the curls cover the surface evenly also on
   * long bodies and at grazing rays.
   */
  readonly even?: number;
  readonly spacing?: number;
}

/**
 * Neat wool curls on a surface: `n` points spread over `base` (rays from `center` in a Fibonacci
 * spiral), kept where `keep` is solid. `dome` is the height of the nearest round curl of radius `R`
 * (0 to 1); `rings` is a ring groove pattern round each curl's center (for the normal map), so each
 * curl reads as a coil; `swirl` is a one-arm spiral groove round each center (turned left or right
 * at random), in -1 to 1 and 0 outside the curl. A negative `displace` amplitude raises the curls
 * out of the surface. Points sit in a grid hash, so a lookup checks only the near cells.
 */
export const curlField = (base: sdf.Shape, keep: sdf.Shape, center: readonly [number, number, number], n: number, R: number, opts?: CurlOptions) => {
  const pts: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const rays = opts?.even ? Math.round(n * opts.even) : n;
  const minD = R * (opts?.spacing ?? 1.5);
  const cell = R * 2;
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
  const grid = new Map<string, [number, number, number][]>();
  const near = (p: readonly [number, number, number], d: number) => {
    const ci = Math.floor(p[0] / cell);
    const cj = Math.floor(p[1] / cell);
    const ck = Math.floor(p[2] / cell);
    const reach = Math.ceil(d / cell);
    for (let i = ci - reach; i <= ci + reach; i++)
      for (let j = cj - reach; j <= cj + reach; j++)
        for (let k = ck - reach; k <= ck + reach; k++)
          for (const q of grid.get(key(i, j, k)) ?? []) if ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 < d * d) return true;
    return false;
  };
  // With `even`, the rays go in a fixed shuffled order, so the kept points spread over the whole
  // surface before they fill the gaps.
  const order = Array.from({ length: rays }, (_, i) => i);
  if (opts?.even) {
    let seed = 12345;
    for (let i = rays - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const j = seed % (i + 1);
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
  }
  for (const i of order) {
    const y = 1 - (2 * (i + 0.5)) / rays;
    const rr = Math.sqrt(1 - y * y);
    const a = golden * i;
    const dir: [number, number, number] = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    const hit = sdf.raycast(base, [center[0] + dir[0], center[1] + dir[1], center[2] + dir[2]], [-dir[0], -dir[1], -dir[2]]);
    if (!hit || keep.dist(hit[0], hit[1], hit[2]) >= 0) continue;
    const p: [number, number, number] = [hit[0], hit[1], hit[2]];
    if (opts?.even && near(p, minD)) continue;
    pts.push(p);
    if (opts?.even) {
      const kk = key(Math.floor(p[0] / cell), Math.floor(p[1] / cell), Math.floor(p[2] / cell));
      const list = grid.get(kk) ?? [];
      list.push(p);
      grid.set(kk, list);
    }
  }
  if (!opts?.even)
    for (const p of pts) {
      const kk = key(Math.floor(p[0] / cell), Math.floor(p[1] / cell), Math.floor(p[2] / cell));
      const list = grid.get(kk) ?? [];
      list.push(p);
      grid.set(kk, list);
    }
  const nearestPoint = (x: number, y: number, z: number): [number, [number, number, number] | null] => {
    const ci = Math.floor(x / cell);
    const cj = Math.floor(y / cell);
    const ck = Math.floor(z / cell);
    let best = Infinity;
    let at: [number, number, number] | null = null;
    for (let i = ci - 1; i <= ci + 1; i++)
      for (let j = cj - 1; j <= cj + 1; j++)
        for (let k = ck - 1; k <= ck + 1; k++)
          for (const p of grid.get(key(i, j, k)) ?? []) {
            const d2 = (x - p[0]) ** 2 + (y - p[1]) ** 2 + (z - p[2]) ** 2;
            if (d2 < best) {
              best = d2;
              at = p;
            }
          }
    return [Math.sqrt(best), at];
  };
  const nearest = (x: number, y: number, z: number) => nearestPoint(x, y, z)[0];
  // The spiral frame of each curl: the surface normal, two tangents, a turn, and a phase.
  const frames = new Map<[number, number, number], { n: number[]; t1: number[]; t2: number[]; turn: number; phase: number }>();
  const frameOf = (p: [number, number, number]) => {
    let f = frames.get(p);
    if (!f) {
      const nn = sdf.normalAt(base, p);
      const up = Math.abs(nn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const c = [nn[1] * up[2]! - nn[2] * up[1]!, nn[2] * up[0]! - nn[0] * up[2]!, nn[0] * up[1]! - nn[1] * up[0]!];
      const cl = Math.hypot(c[0]!, c[1]!, c[2]!);
      const t1 = c.map((v) => v / cl);
      const t2 = [nn[1] * t1[2]! - nn[2] * t1[1]!, nn[2] * t1[0]! - nn[0] * t1[2]!, nn[0] * t1[1]! - nn[1] * t1[0]!];
      const h = Math.abs(Math.sin(p[0] * 12.9898 + p[1] * 78.233 + p[2] * 37.719) * 43758.5453) % 1;
      f = { n: [nn[0], nn[1], nn[2]], t1, t2, turn: h < 0.5 ? 1 : -1, phase: h * 2 * Math.PI };
      frames.set(p, f);
    }
    return f;
  };
  return {
    dome: (x: number, y: number, z: number) => {
      const t = Math.min(1, nearest(x, y, z) / R);
      return 1 - t * t;
    },
    rings: (x: number, y: number, z: number) => {
      const d = nearest(x, y, z) / R;
      return d < 1 ? Math.cos(d * Math.PI * 3) * (1 - d) : 0;
    },
    swirl: (x: number, y: number, z: number) => {
      const [d, p] = nearestPoint(x, y, z);
      if (!p || d >= R) return 0;
      const f = frameOf(p);
      const v = [x - p[0], y - p[1], z - p[2]];
      const u1 = (v[0]! * f.t1[0]! + v[1]! * f.t1[1]! + v[2]! * f.t1[2]!) / R;
      const u2 = (v[0]! * f.t2[0]! + v[1]! * f.t2[1]! + v[2]! * f.t2[2]!) / R;
      const r = Math.hypot(u1, u2);
      const th = Math.atan2(u2, u1);
      return Math.cos(2 * Math.PI * 2.2 * r - f.turn * th + f.phase) * Math.min(1, (1 - r) * 3);
    },
  };
};
