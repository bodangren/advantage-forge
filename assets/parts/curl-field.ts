import { sdf } from '../../src/index.js';

/**
 * Neat wool curls on a surface: `n` points spread over `base` (rays from `center` in a Fibonacci
 * spiral), kept where `keep` is solid. `dome` is the height of the nearest round curl of radius `R`
 * (0 to 1); `rings` is a ring groove pattern round each curl's center (for the normal map), so each
 * curl reads as a coil. A negative `displace` amplitude raises the curls out of the surface. Points sit in a grid hash, so a lookup checks only the near cells.
 */
export const curlField = (base: sdf.Shape, keep: sdf.Shape, center: readonly [number, number, number], n: number, R: number) => {
  const pts: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    const a = golden * i;
    const dir: [number, number, number] = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    const hit = sdf.raycast(base, [center[0] + dir[0], center[1] + dir[1], center[2] + dir[2]], [-dir[0], -dir[1], -dir[2]]);
    if (hit && keep.dist(hit[0], hit[1], hit[2]) < 0) pts.push([hit[0], hit[1], hit[2]]);
  }
  const cell = R * 2;
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
  const grid = new Map<string, [number, number, number][]>();
  for (const p of pts) {
    const kk = key(Math.floor(p[0] / cell), Math.floor(p[1] / cell), Math.floor(p[2] / cell));
    const list = grid.get(kk) ?? [];
    list.push(p);
    grid.set(kk, list);
  }
  const nearest = (x: number, y: number, z: number) => {
    const ci = Math.floor(x / cell);
    const cj = Math.floor(y / cell);
    const ck = Math.floor(z / cell);
    let best = Infinity;
    for (let i = ci - 1; i <= ci + 1; i++)
      for (let j = cj - 1; j <= cj + 1; j++)
        for (let k = ck - 1; k <= ck + 1; k++)
          for (const p of grid.get(key(i, j, k)) ?? []) {
            const d2 = (x - p[0]) ** 2 + (y - p[1]) ** 2 + (z - p[2]) ** 2;
            if (d2 < best) best = d2;
          }
    return Math.sqrt(best);
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
  };
};
