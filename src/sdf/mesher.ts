import { MeshoptSimplifier } from 'meshoptimizer';
import type { Rgb } from './color.js';
import type { Aabb, DistFn, Sdf } from './core.js';

export interface MeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  /** Linear RGB per vertex. */
  readonly colors: Float32Array;
  readonly indices: Uint32Array;
}

export interface MeshOptions {
  /** Grid cell size in meters. Smaller is more detailed and slower. */
  readonly cellSize: number;
  /** Color for surface that no paint covers. */
  readonly baseColor: Rgb;
  /** Override the automatic bounds (use when a shape's bounds are loose or infinite). */
  readonly bounds?: Aabb;
  /**
   * Largest allowed surface deviation (meters) during triangle reduction. Default: 12% of the
   * cell size. Set `simplify: false` to keep the raw grid mesh.
   */
  readonly maxError?: number;
  /** Hard cap on triangles after reduction. */
  readonly maxTriangles?: number;
  readonly simplify?: boolean;
  /** Name used in warnings. */
  readonly label?: string;
  /**
   * Cut hard paint edges into exact mesh seams (default true). Needed when color lives in vertex
   * colors; textured builds bake paint per texel and skip it for lighter meshes.
   */
  readonly paintSeams?: boolean;
  /** Opt-in: make reduction keep soft paint gradients and noise paint. Try 1-4. */
  readonly attributeWeight?: number;
}

export interface MeshStats {
  readonly gridPoints: number;
  readonly evaluatedPoints: number;
  readonly rawTriangles: number;
  readonly triangles: number;
  readonly milliseconds: number;
}

const MAX_GRID_POINTS = 80_000_000;
const TOP = 8;

/** Mesh a signed distance field with surface nets, snap vertices to the surface, and reduce. */
export async function meshSdf(sdf: Sdf, opts: MeshOptions): Promise<{ mesh: MeshData; stats: MeshStats }> {
  const t0 = performance.now();
  const h = opts.cellSize;
  if (!(h > 0)) throw new Error('cellSize must be positive.');
  const b = opts.bounds ?? sdf.bounds;
  for (let i = 0; i < 3; i++) {
    const size = b.max[i]! - b.min[i]!;
    if (!Number.isFinite(size) || size > 200)
      throw new Error(
        'Shape bounds are too large to mesh. Intersect half spaces with a finite shape, or pass `bounds`.',
      );
    if (size <= 0) throw new Error('Shape bounds are empty; the shape has no volume.');
  }
  // Pad the grid and round the cell counts up to whole top-level blocks.
  const pad = 2 * h;
  const ox = b.min[0] - pad;
  const oy = b.min[1] - pad;
  const oz = b.min[2] - pad;
  const cellsOf = (lo: number, hi: number) => Math.ceil(Math.ceil((hi - lo + 2 * pad) / h) / TOP) * TOP;
  const mx = cellsOf(b.min[0], b.max[0]);
  const my = cellsOf(b.min[1], b.max[1]);
  const mz = cellsOf(b.min[2], b.max[2]);
  const nx = mx + 1;
  const ny = my + 1;
  const nz = mz + 1;
  const total = nx * ny * nz;
  if (total > MAX_GRID_POINTS)
    throw new Error(
      `Grid too large (${nx}x${ny}x${nz}). Increase cellSize (now ${h}) or split the body into parts.`,
    );

  const dist = sdf.dist;
  const values = new Float32Array(total);
  const done = new Uint8Array(total);
  let evaluated = 0;
  const sample = (i: number, j: number, k: number): number => {
    const id = i + nx * (j + ny * k);
    if (done[id] === 0) {
      values[id] = dist(ox + i * h, oy + j * h, oz + k * h);
      done[id] = 1;
      evaluated++;
    }
    return values[id]!;
  };

  // Narrow band by recursive refinement: a block can only hold surface when its corners change
  // sign or come closer than the block diagonal, so only cells next to the surface are evaluated.
  const reach = h * Math.sqrt(3) * 1.2;
  const leaves: number[] = [];
  const visit = (i0: number, j0: number, k0: number, s: number): void => {
    let minAbs = Infinity;
    let neg = false;
    let posi = false;
    for (let c = 0; c < 8; c++) {
      const v = sample(i0 + (c & 1) * s, j0 + ((c >> 1) & 1) * s, k0 + ((c >> 2) & 1) * s);
      const a = v < 0 ? -v : v;
      if (a < minAbs) minAbs = a;
      if (v < 0) neg = true;
      else posi = true;
    }
    if (s === 1) {
      if (neg && posi) leaves.push(i0, j0, k0);
      return;
    }
    if (!(neg && posi) && minAbs >= s * reach) return;
    const hs = s >> 1;
    for (let c = 0; c < 8; c++)
      visit(i0 + (c & 1) * hs, j0 + ((c >> 1) & 1) * hs, k0 + ((c >> 2) & 1) * hs, hs);
  };
  for (let k = 0; k < mz; k += TOP)
    for (let j = 0; j < my; j += TOP) for (let i = 0; i < mx; i += TOP) visit(i, j, k, TOP);

  const tBand = performance.now();
  // Surface nets: one vertex per cell that the surface crosses.
  const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const cellVertex = new Int32Array(mx * my * mz).fill(-1);
  const cidx = (i: number, j: number, k: number) => i + mx * (j + my * k);
  const pos: number[] = [];
  const corner = new Float32Array(8);
  const EDGES = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ] as const;
  for (let l = 0; l < leaves.length; l += 3) {
    const i = leaves[l]!;
    const j = leaves[l + 1]!;
    const k = leaves[l + 2]!;
    for (let c = 0; c < 8; c++) corner[c] = values[idx(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]!;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let n = 0;
    for (const [a, e] of EDGES) {
      const va = corner[a]!;
      const ve = corner[e]!;
      if (va < 0 === ve < 0) continue;
      const t = va / (va - ve);
      sx += (a & 1) + t * ((e & 1) - (a & 1));
      sy += ((a >> 1) & 1) + t * (((e >> 1) & 1) - ((a >> 1) & 1));
      sz += ((a >> 2) & 1) + t * (((e >> 2) & 1) - ((a >> 2) & 1));
      n++;
    }
    cellVertex[cidx(i, j, k)] = pos.length / 3;
    pos.push(ox + (i + sx / n) * h, oy + (j + sy / n) * h, oz + (k + sz / n) * h);
  }

  const tris: number[] = [];
  const quad = (a: number, b2: number, c: number, d: number) => {
    if (a < 0 || b2 < 0 || c < 0 || d < 0) return;
    // Split along the shorter diagonal for better triangles.
    const dac = sq(pos, a, c);
    const dbd = sq(pos, b2, d);
    if (dac <= dbd) tris.push(a, b2, c, a, c, d);
    else tris.push(a, b2, d, b2, c, d);
  };
  // Every sign-changing grid edge is the lower x, y, or z edge of exactly one crossed cell.
  for (let l = 0; l < leaves.length; l += 3) {
    const i = leaves[l]!;
    const j = leaves[l + 1]!;
    const k = leaves[l + 2]!;
    if (i < 1 || j < 1 || k < 1) continue;
    const in0 = values[idx(i, j, k)]! < 0;
    if (in0 !== values[idx(i + 1, j, k)]! < 0) {
      const q = [
        cellVertex[cidx(i, j - 1, k - 1)]!,
        cellVertex[cidx(i, j, k - 1)]!,
        cellVertex[cidx(i, j, k)]!,
        cellVertex[cidx(i, j - 1, k)]!,
      ] as const;
      if (in0) quad(q[0], q[1], q[2], q[3]);
      else quad(q[3], q[2], q[1], q[0]);
    }
    if (in0 !== values[idx(i, j + 1, k)]! < 0) {
      const q = [
        cellVertex[cidx(i - 1, j, k - 1)]!,
        cellVertex[cidx(i - 1, j, k)]!,
        cellVertex[cidx(i, j, k)]!,
        cellVertex[cidx(i, j, k - 1)]!,
      ] as const;
      if (in0) quad(q[0], q[1], q[2], q[3]);
      else quad(q[3], q[2], q[1], q[0]);
    }
    if (in0 !== values[idx(i, j, k + 1)]! < 0) {
      const q = [
        cellVertex[cidx(i - 1, j - 1, k)]!,
        cellVertex[cidx(i, j - 1, k)]!,
        cellVertex[cidx(i, j, k)]!,
        cellVertex[cidx(i - 1, j, k)]!,
      ] as const;
      if (in0) quad(q[0], q[1], q[2], q[3]);
      else quad(q[3], q[2], q[1], q[0]);
    }
  }

  const tNets = performance.now();
  // Snap vertices onto the true surface (two Newton steps) and keep the last field gradient as
  // the vertex normal.
  const vcount = pos.length / 3;
  const positions = new Float32Array(pos);
  const normals = new Float32Array(vcount * 3);
  const colors = new Float32Array(vcount * 3);
  const eps = h * 0.5;
  const g = [0, 0, 0];
  const grad = (x: number, y: number, z: number) => {
    // Tetrahedral central difference: four samples, good quality.
    const a = dist(x + eps, y - eps, z - eps);
    const b2 = dist(x - eps, y - eps, z + eps);
    const c = dist(x - eps, y + eps, z - eps);
    const d = dist(x + eps, y + eps, z + eps);
    g[0] = a - b2 - c + d;
    g[1] = -a - b2 + c + d;
    g[2] = -a + b2 - c + d;
    const l = Math.hypot(g[0], g[1], g[2]) || 1;
    g[0] /= l;
    g[1] /= l;
    g[2] /= l;
  };
  const color = sdf.color;
  for (let v = 0; v < vcount; v++) {
    let x = positions[v * 3]!;
    let y = positions[v * 3 + 1]!;
    let z = positions[v * 3 + 2]!;
    const x0 = x;
    const y0 = y;
    const z0 = z;
    for (let it = 0; it < 2; it++) {
      const d = dist(x, y, z);
      grad(x, y, z);
      x -= d * g[0]!;
      y -= d * g[1]!;
      z -= d * g[2]!;
    }
    // Keep the vertex near its cell so thin features do not collapse.
    const moved = Math.hypot(x - x0, y - y0, z - z0);
    if (moved > h) {
      const s = h / moved;
      x = x0 + (x - x0) * s;
      y = y0 + (y - y0) * s;
      z = z0 + (z - z0) * s;
    }
    positions[v * 3] = x;
    positions[v * 3 + 1] = y;
    positions[v * 3 + 2] = z;
    normals[v * 3] = g[0]!;
    normals[v * 3 + 1] = g[1]!;
    normals[v * 3 + 2] = g[2]!;
    const col = color(x, y, z, opts.baseColor);
    colors[v * 3] = col[0];
    colors[v * 3 + 1] = col[1];
    colors[v * 3 + 2] = col[2];
  }

  const surfacePoint = (x: number, y: number, z: number): [number, number, number] => {
    for (let it = 0; it < 4; it++) {
      const d = dist(x, y, z);
      if (Math.abs(d) < h * 1e-4) break;
      grad(x, y, z);
      x -= d * g[0]!;
      y -= d * g[1]!;
      z -= d * g[2]!;
    }
    return [x, y, z];
  };
  const normalAt = (x: number, y: number, z: number): [number, number, number] => {
    grad(x, y, z);
    return [g[0]!, g[1]!, g[2]!];
  };

  const tSnap = performance.now();
  const rawMesh: MeshData = { positions, normals, colors, indices: new Uint32Array(tris) };
  let mesh: MeshData =
    opts.paintSeams === false
      ? rawMesh
      : splitPaintSeams(rawMesh, (x, y, z) => color(x, y, z, opts.baseColor), surfacePoint, normalAt);
  const tSeams = performance.now();
  const rawTriangles = mesh.indices.length / 3;
  if (opts.simplify !== false && rawTriangles > 0) mesh = await reduce(mesh, opts, h, dist);
  if (process.env.FORGE_DEBUG)
    console.log(
      `  mesh phases: band ${Math.round(tBand - t0)} nets ${Math.round(tNets - tBand)} snap+color ${Math.round(tSnap - tNets)} seams ${Math.round(tSeams - tSnap)} reduce ${Math.round(performance.now() - tSeams)} ms`,
    );

  return {
    mesh,
    stats: {
      gridPoints: total,
      evaluatedPoints: evaluated,
      rawTriangles,
      triangles: mesh.indices.length / 3,
      milliseconds: Math.round(performance.now() - t0),
    },
  };
}

type Vec = [number, number, number];

/**
 * Cut triangles along hard paint edges so every edge becomes an exact, smooth seam instead of a
 * zig-zag that follows the grid. Soft paint (gradients, noise) is left alone.
 */
function splitPaintSeams(
  mesh: MeshData,
  colorAt: (x: number, y: number, z: number) => Rgb,
  surfacePoint: (x: number, y: number, z: number) => Vec,
  normalAt: (x: number, y: number, z: number) => Vec,
): MeshData {
  const { positions, normals, colors, indices } = mesh;
  const pos = Array.from(positions);
  const nor = Array.from(normals);
  const col = Array.from(colors);
  const out: number[] = [];
  const SAME = 0.02;
  const diff = (a: ArrayLike<number>, ai: number, b: ArrayLike<number>, bi: number) =>
    Math.abs(a[ai]! - b[bi]!) + Math.abs(a[ai + 1]! - b[bi + 1]!) + Math.abs(a[ai + 2]! - b[bi + 2]!);
  const same = (a: number, b: number) => diff(col, a * 3, col, b * 3) < SAME;

  // Transition point on edge (a, b), or null when the change is a soft gradient.
  const edgePoint = new Map<string, Vec | null>();
  const transition = (a: number, b: number): Vec | null => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = `${lo}|${hi}`;
    if (edgePoint.has(key)) return edgePoint.get(key)!;
    const pa: Vec = [pos[lo * 3]!, pos[lo * 3 + 1]!, pos[lo * 3 + 2]!];
    const pb: Vec = [pos[hi * 3]!, pos[hi * 3 + 1]!, pos[hi * 3 + 2]!];
    const ca = [col[lo * 3]!, col[lo * 3 + 1]!, col[lo * 3 + 2]!];
    const cb = [col[hi * 3]!, col[hi * 3 + 1]!, col[hi * 3 + 2]!];
    const span = diff(ca, 0, cb, 0);
    let t0 = 0;
    let t1 = 1;
    let soft = false;
    // Paint stencils are volumes, so bisecting along the straight edge (which lies within a hair of
    // the surface) finds the same boundary; only the final point is projected onto the surface.
    for (let it = 0; it < 9; it++) {
      const t = (t0 + t1) / 2;
      const c = colorAt(
        pa[0] + (pb[0] - pa[0]) * t,
        pa[1] + (pb[1] - pa[1]) * t,
        pa[2] + (pb[2] - pa[2]) * t,
      );
      const da = diff(c, 0, ca, 0);
      const db = diff(c, 0, cb, 0);
      if (it === 0 && Math.min(da, db) > span * 0.25) soft = true;
      if (da <= db) t0 = t;
      else t1 = t;
    }
    let result: Vec | null = null;
    if (!soft) {
      const t = (t0 + t1) / 2;
      result = surfacePoint(
        pa[0] + (pb[0] - pa[0]) * t,
        pa[1] + (pb[1] - pa[1]) * t,
        pa[2] + (pb[2] - pa[2]) * t,
      );
    }
    edgePoint.set(key, result);
    return result;
  };

  // One new vertex per (edge, side); the side's color comes from that edge endpoint.
  const sideVertex = new Map<string, number>();
  const seamVertex = (a: number, b: number, side: number, p: Vec): number => {
    const key = `${Math.min(a, b)}|${Math.max(a, b)}|${side}`;
    const cached = sideVertex.get(key);
    if (cached !== undefined) return cached;
    const id = pos.length / 3;
    const n = normalAt(p[0], p[1], p[2]);
    pos.push(p[0], p[1], p[2]);
    nor.push(n[0], n[1], n[2]);
    col.push(col[side * 3]!, col[side * 3 + 1]!, col[side * 3 + 2]!);
    sideVertex.set(key, id);
    return id;
  };
  const freeVertex = (p: Vec, c: Rgb): number => {
    const id = pos.length / 3;
    const n = normalAt(p[0], p[1], p[2]);
    pos.push(p[0], p[1], p[2]);
    nor.push(n[0], n[1], n[2]);
    col.push(c[0], c[1], c[2]);
    return id;
  };

  for (let t = 0; t < indices.length; t += 3) {
    const v = [indices[t]!, indices[t + 1]!, indices[t + 2]!] as const;
    const s01 = same(v[0], v[1]);
    const s12 = same(v[1], v[2]);
    const s20 = same(v[2], v[0]);
    const pairs = Number(s01) + Number(s12) + Number(s20);
    if (pairs >= 2) {
      out.push(v[0], v[1], v[2]);
      continue;
    }
    if (pairs === 1) {
      // Rotate so `o` is the odd vertex and winding (o, p, q) is preserved.
      const r = s12 ? 0 : s20 ? 1 : 2;
      const o = v[r]!;
      const p = v[(r + 1) % 3]!;
      const q = v[(r + 2) % 3]!;
      const mp = transition(o, p);
      const mq = transition(o, q);
      if (!mp || !mq) {
        out.push(v[0], v[1], v[2]);
        continue;
      }
      const mpo = seamVertex(o, p, o, mp);
      const mqo = seamVertex(o, q, o, mq);
      const mpp = seamVertex(o, p, p, mp);
      const mqq = seamVertex(o, q, q, mq);
      out.push(o, mpo, mqo, mpp, p, q, mpp, q, mqq);
      continue;
    }
    // Three different colors meet in this triangle.
    const m01 = transition(v[0], v[1]);
    const m12 = transition(v[1], v[2]);
    const m20 = transition(v[2], v[0]);
    if (!m01 || !m12 || !m20) {
      out.push(v[0], v[1], v[2]);
      continue;
    }
    const a0 = seamVertex(v[0], v[1], v[0], m01);
    const a1 = seamVertex(v[0], v[1], v[1], m01);
    const b1 = seamVertex(v[1], v[2], v[1], m12);
    const b2 = seamVertex(v[1], v[2], v[2], m12);
    const c2 = seamVertex(v[2], v[0], v[2], m20);
    const c0 = seamVertex(v[2], v[0], v[0], m20);
    out.push(v[0], a0, c0, v[1], b1, a1, v[2], c2, b2);
    const cx = (m01[0] + m12[0] + m20[0]) / 3;
    const cy = (m01[1] + m12[1] + m20[1]) / 3;
    const cz = (m01[2] + m12[2] + m20[2]) / 3;
    const cc = colorAt(...surfacePoint(cx, cy, cz));
    out.push(freeVertex(m01, cc), freeVertex(m12, cc), freeVertex(m20, cc));
  }
  if (pos.length === positions.length) return mesh;
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    colors: new Float32Array(col),
    indices: new Uint32Array(out),
  };
}

/** Count triangles whose winding disagrees with their vertex normals. */
function countFlips(mesh: MeshData, indices: Uint32Array): number {
  const p = mesh.positions;
  const n = mesh.normals;
  let flips = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]! * 3;
    const b = indices[t + 1]! * 3;
    const c = indices[t + 2]! * 3;
    const ux = p[b]! - p[a]!,
      uy = p[b + 1]! - p[a + 1]!,
      uz = p[b + 2]! - p[a + 2]!;
    const vx = p[c]! - p[a]!,
      vy = p[c + 1]! - p[a + 1]!,
      vz = p[c + 2]! - p[a + 2]!;
    const fx = uy * vz - uz * vy,
      fy = uz * vx - ux * vz,
      fz = ux * vy - uy * vx;
    const facing =
      fx * (n[a]! + n[b]! + n[c]!) +
      fy * (n[a + 1]! + n[b + 1]! + n[c + 1]!) +
      fz * (n[a + 2]! + n[b + 2]! + n[c + 2]!);
    if (facing < 0) flips++;
  }
  return flips;
}

/** Largest distance from a triangle center to the true surface. */
function maxCenterError(mesh: MeshData, indices: Uint32Array, dist: DistFn): number {
  const p = mesh.positions;
  let worst = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]! * 3;
    const b = indices[t + 1]! * 3;
    const c = indices[t + 2]! * 3;
    const d = dist(
      (p[a]! + p[b]! + p[c]!) / 3,
      (p[a + 1]! + p[b + 1]! + p[c + 1]!) / 3,
      (p[a + 2]! + p[b + 2]! + p[c + 2]!) / 3,
    );
    worst = Math.max(worst, Math.abs(d));
  }
  return worst;
}

async function reduce(mesh: MeshData, opts: MeshOptions, h: number, dist: DistFn): Promise<MeshData> {
  await MeshoptSimplifier.ready;
  const vcount = mesh.positions.length / 3;
  const maxError = opts.maxError ?? h * 0.12;
  const tolerance = Math.max(maxError * 4, h * 3);
  // Paint seams are exact topology already, so plain position-based reduction keeps them. Color
  // weighting (for soft gradients and noise paint) is opt-in because meshoptimizer's attribute mode
  // occasionally folds a triangle; every candidate is checked and the next one tried.
  const candidates: ((target: number, error: number, from: Uint32Array) => Uint32Array)[] = [];
  if (opts.attributeWeight !== undefined && opts.attributeWeight > 0) {
    const attrs = new Float32Array(vcount * 3);
    attrs.set(mesh.colors);
    const w = opts.attributeWeight;
    candidates.push(
      (target, error, from) =>
        MeshoptSimplifier.simplifyWithAttributes(
          from,
          mesh.positions,
          3,
          attrs,
          3,
          [w, w, w],
          null,
          target,
          error,
          ['ErrorAbsolute'],
        )[0],
    );
  }
  candidates.push(
    (target, error, from) =>
      MeshoptSimplifier.simplify(from, mesh.positions, 3, target, error, ['ErrorAbsolute'])[0],
  );
  // Sharp cuts leave a few folded slivers even before reduction; they set the baseline. Reduction may
  // add a handful more in tight concave creases, but a larger jump means a broken result.
  const baselineFlips = countFlips(mesh, mesh.indices);
  let indices: Uint32Array | null = null;
  // Try each candidate at the requested error, then at tighter errors; thin cut edges sometimes
  // only reduce cleanly with a smaller budget.
  const attempts = [maxError, maxError / 2, maxError / 4].flatMap((e) =>
    candidates.map((run) => ({ run, e })),
  );
  for (const { run, e } of attempts) {
    let result = run(0, e, mesh.indices);
    if (opts.maxTriangles !== undefined && result.length / 3 > opts.maxTriangles)
      result = run(opts.maxTriangles * 3, h * 10, result);
    const flips = countFlips(mesh, result);
    const allowed = baselineFlips + Math.max(6, Math.floor((result.length / 3) * 0.003));
    const error = opts.maxTriangles !== undefined ? 0 : maxCenterError(mesh, result, dist);
    if (flips <= allowed && error <= tolerance) {
      indices = result;
      break;
    }
    if (process.env.FORGE_DEBUG)
      console.log(
        `  reduce rejected: ${flips} flips (allowed ${allowed}), surface error ${error.toFixed(4)} m`,
      );
  }
  if (!indices) {
    console.warn(
      `  warning: ${opts.label ?? 'a body'}: triangle reduction failed its surface check; keeping the full-resolution mesh.`,
    );
    return mesh;
  }
  const out = new Uint32Array(indices);
  const [remap, unique] = MeshoptSimplifier.compactMesh(out);
  const positions = new Float32Array(unique * 3);
  const normals = new Float32Array(unique * 3);
  const colors = new Float32Array(unique * 3);
  // The remap table only covers vertices up to the highest index still in use.
  for (let v = 0; v < remap.length; v++) {
    const r = remap[v]!;
    if (r === 0xffffffff) continue;
    positions.set(mesh.positions.subarray(v * 3, v * 3 + 3), r * 3);
    normals.set(mesh.normals.subarray(v * 3, v * 3 + 3), r * 3);
    colors.set(mesh.colors.subarray(v * 3, v * 3 + 3), r * 3);
  }
  return { positions, normals, colors, indices: out };
}

function sq(p: readonly number[], a: number, b: number): number {
  const dx = p[a * 3]! - p[b * 3]!;
  const dy = p[a * 3 + 1]! - p[b * 3 + 1]!;
  const dz = p[a * 3 + 2]! - p[b * 3 + 2]!;
  return dx * dx + dy * dy + dz * dz;
}
