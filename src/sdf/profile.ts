import { Sdf, box3 } from './core.js';

export type Vec2 = readonly [number, number];

/** A 2D signed distance field used as a cross-section for `revolve` and `extrude`. */
export interface Profile {
  readonly dist: (u: number, v: number) => number;
  /** Conservative bounds as [minU, minV, maxU, maxV]. */
  readonly bounds: readonly [number, number, number, number];
}

/**
 * Closed polygon profile. With `smooth`, the points are control points of a closed Catmull-Rom
 * spline, which is how you draw organic silhouettes (helmets, vases, leaves, blades).
 */
export function polygon(points: readonly Vec2[], opts: { smooth?: boolean; samples?: number } = {}): Profile {
  if (points.length < 3) throw new Error('polygon() needs at least three points.');
  const pts = opts.smooth === true ? catmullRomClosed(points, opts.samples ?? 12) : points;
  const n = pts.length;
  const us = pts.map((p) => p[0]);
  const vs = pts.map((p) => p[1]);
  // Flat arrays: vertex i and the edge from vertex i-1 to vertex i.
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  const ex = new Float64Array(n);
  const ey = new Float64Array(n);
  const il = new Float64Array(n);
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    px[i] = pts[i]![0];
    py[i] = pts[i]![1];
    ex[i] = pts[j]![0] - pts[i]![0];
    ey[i] = pts[j]![1] - pts[i]![1];
    const l2 = ex[i]! * ex[i]! + ey[i]! * ey[i]!;
    il[i] = l2 > 0 ? 1 / l2 : 0;
  }
  const dist = (u: number, v: number): number => {
    let d = Infinity;
    let s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const eix = ex[i]!;
      const eiy = ey[i]!;
      const wx = u - px[i]!;
      const wy = v - py[i]!;
      let t = (wx * eix + wy * eiy) * il[i]!;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const bx = wx - eix * t;
      const by = wy - eiy * t;
      const dd = bx * bx + by * by;
      if (dd < d) d = dd;
      const c1 = v >= py[i]!;
      const c2 = v < py[j]!;
      const c3 = eix * wy > eiy * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };
  const bounds = [Math.min(...us), Math.min(...vs), Math.max(...us), Math.max(...vs)] as const;
  return { dist: tabulate(dist, bounds), bounds };
}

/**
 * Wrap an exact but slow 2D distance in a lazily built lookup table with bilinear interpolation.
 * The table spans the profile bounds plus a margin at 1/400 of the profile size; queries outside
 * it fall back to the exact function.
 */
function tabulate(
  exact: (u: number, v: number) => number,
  b: readonly [number, number, number, number],
): Profile['dist'] {
  const extent = Math.max(b[2] - b[0], b[3] - b[1]);
  const cell = extent / 400;
  const margin = extent * 0.15 + 0.01;
  const u0 = b[0] - margin;
  const v0 = b[1] - margin;
  const nu = Math.ceil((b[2] - b[0] + 2 * margin) / cell) + 1;
  const nv = Math.ceil((b[3] - b[1] + 2 * margin) / cell) + 1;
  let table: Float32Array | null = null;
  return (u, v) => {
    const fu = (u - u0) / cell;
    const fv = (v - v0) / cell;
    if (!(fu >= 0 && fv >= 0 && fu < nu - 1 && fv < nv - 1)) return exact(u, v);
    if (table === null) {
      table = new Float32Array(nu * nv);
      for (let j = 0; j < nv; j++)
        for (let i = 0; i < nu; i++) table[i + nu * j] = exact(u0 + i * cell, v0 + j * cell);
    }
    const i = Math.floor(fu);
    const j = Math.floor(fv);
    const tu = fu - i;
    const tv = fv - j;
    const k = i + nu * j;
    const a = table[k]! + (table[k + 1]! - table[k]!) * tu;
    const c = table[k + nu]! + (table[k + nu + 1]! - table[k + nu]!) * tu;
    return a + (c - a) * tv;
  };
}

export function circle(r: number): Profile {
  return { dist: (u, v) => Math.hypot(u, v) - r, bounds: [-r, -r, r, r] };
}

/** Rectangle with full size [width, height], centered, with optional corner radius. */
export function rect(size: Vec2, radius = 0): Profile {
  const hx = size[0] / 2 - radius;
  const hy = size[1] / 2 - radius;
  return {
    dist: (u, v) => {
      const qx = Math.abs(u) - hx;
      const qy = Math.abs(v) - hy;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
    },
    bounds: [-size[0] / 2, -size[1] / 2, size[0] / 2, size[1] / 2],
  };
}

/** Offset a profile outward (positive) or inward (negative). */
export function offsetProfile(p: Profile, r: number): Profile {
  const [a, b, c, d] = p.bounds;
  const pad = Math.max(0, r);
  return { dist: (u, v) => p.dist(u, v) - r, bounds: [a - pad, b - pad, c + pad, d + pad] };
}

/**
 * Revolve a profile around the Y axis. The profile's U axis is the radius and V is the height.
 * Only the U >= 0 half matters. This makes helmets, pots, barrels, bottles, and towers.
 */
export function revolve(profile: Profile): Sdf {
  const [, minV, maxU, maxV] = profile.bounds;
  const r = Math.max(0, maxU);
  const d = profile.dist;
  return new Sdf((x, y, z) => d(Math.sqrt(x * x + z * z), y), box3([-r, minV, -r], [r, maxV, r]));
}

/**
 * Extrude a profile along Z. The profile lies in the XY plane; `depth` is the full thickness and
 * `radius` rounds the front and back edges.
 */
export function extrude(profile: Profile, depth: number, radius = 0): Sdf {
  const [minU, minV, maxU, maxV] = profile.bounds;
  const h = depth / 2 - radius;
  const d = profile.dist;
  return new Sdf(
    (x, y, z) => {
      const dx = d(x, y) + radius;
      const dz = Math.abs(z) - h;
      return Math.min(Math.max(dx, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) - radius;
    },
    box3([minU, minV, -depth / 2], [maxU, maxV, depth / 2]),
  );
}

function catmullRomClosed(points: readonly Vec2[], samples: number): Vec2[] {
  const out: Vec2[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/**
 * An arc stroke: the part of a circle of `radius` between two angles (degrees, 0 = +U, 90 = +V),
 * drawn with round ends and total `width`. Extrude it through a surface to paint smiles, brows,
 * or curved trims: `sdf.extrude(profile.arc(0.05, 0.012, 200, 340), 0.2).at(...)`.
 */
export function arc(radius: number, width: number, fromDeg: number, toDeg: number): Profile {
  const a0 = (fromDeg * Math.PI) / 180;
  const a1 = (toDeg * Math.PI) / 180;
  const mid = (a0 + a1) / 2;
  const half = Math.abs(a1 - a0) / 2;
  const r = width / 2;
  const ends: Vec2[] = [
    [radius * Math.cos(a0), radius * Math.sin(a0)],
    [radius * Math.cos(a1), radius * Math.sin(a1)],
  ];
  return {
    dist: (u, v) => {
      // Angle of the point relative to the arc's middle direction.
      const ang = Math.atan2(
        u * Math.sin(mid) * -1 + v * Math.cos(mid),
        u * Math.cos(mid) + v * Math.sin(mid),
      );
      if (Math.abs(ang) <= half) return Math.abs(Math.hypot(u, v) - radius) - r;
      return (
        Math.min(Math.hypot(u - ends[0]![0], v - ends[0]![1]), Math.hypot(u - ends[1]![0], v - ends[1]![1])) -
        r
      );
    },
    bounds: [-radius - r, -radius - r, radius + r, radius + r],
  };
}
