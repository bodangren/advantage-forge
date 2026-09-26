import type { Rgb } from '../sdf/color.js';
import type { DistFn, Sdf } from '../sdf/core.js';
import type { UvMesh } from './unwrap.js';

export interface BakeOptions {
  /** Texture width and height in texels. */
  readonly size: number;
  readonly baseColor: Rgb;
  readonly roughness: number;
  readonly metalness: number;
  /** Bake a tangent-space normal map from the true surface (keeps detail lost in reduction). */
  readonly normal: boolean;
  /** Bake ambient occlusion from the whole asset's distance field. */
  readonly ao: boolean;
  /** How far occlusion reaches, in meters. */
  readonly aoRadius: number;
  /** Gradient step in meters. */
  readonly eps: number;
}

/** Texels covered by one body: flat texel indices and 3 bytes per texel for each map. */
export interface BakeResult {
  readonly texels: Uint32Array;
  readonly color: Uint8Array;
  readonly normal: Uint8Array;
  /** Occlusion (R), roughness (G), metalness (B), as glTF expects. */
  readonly orm: Uint8Array;
}

const toSrgb = (c: number): number => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/**
 * Bake one body into atlas texels. The mesh is only a carrier: every texel is projected onto the
 * true surface of `shape`, so paint edges, displacement detail, and shading are texel-sharp.
 * `sceneDist` (in this body's coordinates) is the union of every body, for occlusion.
 */
export function bakeBody(
  mesh: UvMesh,
  shape: Sdf,
  sceneDist: DistFn,
  o: BakeOptions,
  bump?: DistFn,
): BakeResult {
  const S = o.size;
  const { positions: P, normals: N, tangents: T, uvs: U, indices } = mesh;
  // Bump detail exists only in the bake: the normal map shows it, the mesh stays light.
  const dist: DistFn = bump ? (x, y, z) => shape.dist(x, y, z) - bump(x, y, z) : shape.dist;
  const color = shape.color;
  const eps = o.eps;
  const g = [0, 0, 0];
  const grad = (x: number, y: number, z: number) => {
    const a = dist(x + eps, y - eps, z - eps);
    const b = dist(x - eps, y - eps, z + eps);
    const c = dist(x - eps, y + eps, z - eps);
    const d = dist(x + eps, y + eps, z + eps);
    g[0] = a - b - c + d;
    g[1] = -a - b + c + d;
    g[2] = -a + b - c + d;
    const l = Math.hypot(g[0], g[1], g[2]) || 1;
    g[0] /= l;
    g[1] /= l;
    g[2] /= l;
  };

  // Per-vertex bitangent as the vertex shader computes it: cross(N, T) * w.
  const bit = (v: number, c: number): number => {
    const n0 = N[v * 3]!,
      n1 = N[v * 3 + 1]!,
      n2 = N[v * 3 + 2]!;
    const t0 = T[v * 4]!,
      t1 = T[v * 4 + 1]!,
      t2 = T[v * 4 + 2]!;
    const w = T[v * 4 + 3]!;
    return (c === 0 ? n1 * t2 - n2 * t1 : c === 1 ? n2 * t0 - n0 * t2 : n0 * t1 - n1 * t0) * w;
  };
  const texels: number[] = [];
  // Per texel: surface point and the 3D step for one texel in x and in y (for edge supersampling).
  const frames: number[] = [];
  const colorOut: number[] = [];
  const normalOut: number[] = [];
  const ormOut: number[] = [];
  const seen = new Uint8Array(S * S);
  const rough = Math.round(o.roughness * 255);
  const metal = Math.round(o.metalness * 255);
  const aoSteps = [0.25, 0.5, 0.75, 1].map((f) => f * o.aoRadius);
  const aoWeights = [1, 0.75, 0.5, 0.25];
  const aoNorm = aoSteps.reduce((s, h, i) => s + h * aoWeights[i]!, 0);

  // Pass 0 bakes texels whose centers lie inside a triangle. Pass 1 bakes the remaining texels that
  // a triangle only partly covers (chart edges), from the triangle extended a little past its edge,
  // so bilinear filtering at seams reads real surface values instead of dilated guesses.
  for (let pass = 0; pass < 2; pass++)
    for (let t = 0; t < indices.length; t += 3) {
      const i0 = indices[t]!;
      const i1 = indices[t + 1]!;
      const i2 = indices[t + 2]!;
      const x0 = U[i0 * 2]! * S;
      const y0 = U[i0 * 2 + 1]! * S;
      const x1 = U[i1 * 2]! * S;
      const y1 = U[i1 * 2 + 1]! * S;
      const x2 = U[i2 * 2]! * S;
      const y2 = U[i2 * 2 + 1]! * S;
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (Math.abs(area) < 1e-12) continue;
      const inv = 1 / area;
      // How the 3D position changes per texel step (the triangle maps texels to 3D affinely).
      const dw0x = -(y2 - y1) * inv;
      const dw1x = -(y0 - y2) * inv;
      const dw0y = (x2 - x1) * inv;
      const dw1y = (x0 - x2) * inv;
      const step = (c: number, dw0: number, dw1: number) =>
        dw0 * (P[i0 * 3 + c]! - P[i2 * 3 + c]!) + dw1 * (P[i1 * 3 + c]! - P[i2 * 3 + c]!);
      // Half a texel diagonal, in barycentric units, for the partial-coverage pass.
      const tol0 = 0.71 * Math.hypot(dw0x, dw0y);
      const tol1 = 0.71 * Math.hypot(dw1x, dw1y);
      const tol2 = 0.71 * Math.hypot(dw0x + dw1x, dw0y + dw1y);
      const sx = [step(0, dw0x, dw1x), step(1, dw0x, dw1x), step(2, dw0x, dw1x)];
      const sy = [step(0, dw0y, dw1y), step(1, dw0y, dw1y), step(2, dw0y, dw1y)];
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
      const maxX = Math.min(S - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
      const maxY = Math.min(S - 1, Math.ceil(Math.max(y0, y1, y2)));
      for (let py = minY; py <= maxY; py++)
        for (let px = minX; px <= maxX; px++) {
          const cx = px + 0.5;
          const cy = py + 0.5;
          const w0 = ((x1 - cx) * (y2 - cy) - (x2 - cx) * (y1 - cy)) * inv;
          const w1 = ((x2 - cx) * (y0 - cy) - (x0 - cx) * (y2 - cy)) * inv;
          const w2 = 1 - w0 - w1;
          if (pass === 0 ? w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4 : w0 < -tol0 || w1 < -tol1 || w2 < -tol2)
            continue;
          const id = py * S + px;
          if (seen[id] === 1) continue;
          seen[id] = 1;

          // Carrier point, then one Newton step onto the true surface.
          let x = w0 * P[i0 * 3]! + w1 * P[i1 * 3]! + w2 * P[i2 * 3]!;
          let y = w0 * P[i0 * 3 + 1]! + w1 * P[i1 * 3 + 1]! + w2 * P[i2 * 3 + 1]!;
          let z = w0 * P[i0 * 3 + 2]! + w1 * P[i1 * 3 + 2]! + w2 * P[i2 * 3 + 2]!;
          const d = dist(x, y, z);
          grad(x, y, z);
          x -= d * g[0]!;
          y -= d * g[1]!;
          z -= d * g[2]!;

          texels.push(id);
          frames.push(x, y, z, sx[0]!, sx[1]!, sx[2]!, sy[0]!, sy[1]!, sy[2]!);
          const c = color(x, y, z, o.baseColor);
          colorOut.push(toSrgb(c[0]), toSrgb(c[1]), toSrgb(c[2]));

          if (o.normal) {
            // Rebuild exactly the frame the shader uses: normalize(interpolated NORMAL),
            // normalize(interpolated TANGENT), normalize(interpolated per-vertex cross(N, T) * w).
            // The shader outputs normalize(M * mapN) with M = [T B N], so mapN = M^-1 * g makes it
            // reproduce the true surface normal g exactly (up to 8-bit rounding).
            const lerp3 = (arr: ArrayLike<number>, stride: number, c: number) =>
              w0 * arr[i0 * stride + c]! + w1 * arr[i1 * stride + c]! + w2 * arr[i2 * stride + c]!;
            const nn = unit([lerp3(N, 3, 0), lerp3(N, 3, 1), lerp3(N, 3, 2)]);
            const tt = unit([lerp3(T, 4, 0), lerp3(T, 4, 1), lerp3(T, 4, 2)]);
            const bb = unit([0, 1, 2].map((c) => w0 * bit(i0, c) + w1 * bit(i1, c) + w2 * bit(i2, c)));
            let m = solve3(tt, bb, nn, g);
            if (m === null || m[2]! < 0.05) {
              // Degenerate frame or a normal past the triangle's horizon: fall back to "no change".
              m = [0, 0, 1];
            }
            const scale = 1 / Math.max(1, Math.abs(m[0]!), Math.abs(m[1]!), Math.abs(m[2]!));
            normalOut.push(
              Math.round((m[0]! * scale * 0.5 + 0.5) * 255),
              Math.round((m[1]! * scale * 0.5 + 0.5) * 255),
              Math.round((m[2]! * scale * 0.5 + 0.5) * 255),
            );
          } else normalOut.push(128, 128, 255);

          let ao = 1;
          if (o.ao) {
            let occ = 0;
            for (let s = 0; s < 4; s++) {
              const h = aoSteps[s]!;
              occ +=
                (h - Math.min(h, sceneDist(x + g[0]! * h, y + g[1]! * h, z + g[2]! * h))) * aoWeights[s]!;
            }
            ao = Math.max(0, 1 - (occ / aoNorm) * 1.1);
          }
          ormOut.push(Math.round(ao * 255), rough, metal);
        }
    }
  // Anti-alias paint edges: texels whose color differs from a neighbor are re-sampled on a 4x4 grid.
  const local = new Map<number, number>();
  texels.forEach((id, k) => local.set(id, k));
  const OFFSETS = [-0.375, -0.125, 0.125, 0.375];
  for (let k = 0; k < texels.length; k++) {
    const id = texels[k]!;
    let edge = false;
    for (const nid of [id - 1, id + 1, id - S, id + S]) {
      const n = local.get(nid);
      if (n === undefined) continue;
      const d =
        Math.abs(colorOut[k * 3]! - colorOut[n * 3]!) +
        Math.abs(colorOut[k * 3 + 1]! - colorOut[n * 3 + 1]!) +
        Math.abs(colorOut[k * 3 + 2]! - colorOut[n * 3 + 2]!);
      if (d > 24) {
        edge = true;
        break;
      }
    }
    if (!edge) continue;
    const f = k * 9;
    let r = 0;
    let gg = 0;
    let b = 0;
    for (const oy of OFFSETS)
      for (const ox of OFFSETS) {
        const c = color(
          frames[f]! + frames[f + 3]! * ox + frames[f + 6]! * oy,
          frames[f + 1]! + frames[f + 4]! * ox + frames[f + 7]! * oy,
          frames[f + 2]! + frames[f + 5]! * ox + frames[f + 8]! * oy,
          o.baseColor,
        );
        r += c[0];
        gg += c[1];
        b += c[2];
      }
    colorOut[k * 3] = toSrgb(r / 16);
    colorOut[k * 3 + 1] = toSrgb(gg / 16);
    colorOut[k * 3 + 2] = toSrgb(b / 16);
  }

  return {
    texels: new Uint32Array(texels),
    color: new Uint8Array(colorOut),
    normal: new Uint8Array(normalOut),
    orm: new Uint8Array(ormOut),
  };
}

/** Grow filled texels outward so bilinear filtering and mipmaps never pull in empty space. */
export function dilate(image: Uint8Array, filled: Uint8Array, size: number, passes: number): void {
  let mask = filled;
  for (let p = 0; p < passes; p++) {
    const next = new Uint8Array(mask);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const id = y * size + x;
        if (mask[id] === 1) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            const nid = ny * size + nx;
            if (mask[nid] !== 1) continue;
            r += image[nid * 3]!;
            g += image[nid * 3 + 1]!;
            b += image[nid * 3 + 2]!;
            n++;
          }
        if (n === 0) continue;
        image[id * 3] = r / n;
        image[id * 3 + 1] = g / n;
        image[id * 3 + 2] = b / n;
        next[id] = 1;
      }
    mask = next;
  }
}

function unit(v: number[]): number[] {
  const l = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
  return [v[0]! / l, v[1]! / l, v[2]! / l];
}

/** Solve [a b c] * x = r for x (columns a, b, c); null when the matrix is singular. */
function solve3(a: number[], b: number[], c: number[], r: readonly number[]): number[] | null {
  const det =
    a[0]! * (b[1]! * c[2]! - b[2]! * c[1]!) -
    b[0]! * (a[1]! * c[2]! - a[2]! * c[1]!) +
    c[0]! * (a[1]! * b[2]! - a[2]! * b[1]!);
  if (Math.abs(det) < 1e-9) return null;
  const col = (p: number[], q: number[]) => p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!;
  const cross = (p: number[], q: number[]) => [
    p[1]! * q[2]! - p[2]! * q[1]!,
    p[2]! * q[0]! - p[0]! * q[2]!,
    p[0]! * q[1]! - p[1]! * q[0]!,
  ];
  // Cramer's rule via the rows of the inverse: x_i = (r . (other two columns crossed)) / det.
  const rr = [r[0]!, r[1]!, r[2]!];
  return [col(rr, cross(b, c)) / det, col(rr, cross(c, a)) / det, col(rr, cross(a, b)) / det];
}
