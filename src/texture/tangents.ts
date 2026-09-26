/**
 * Per-vertex tangents (xyz + handedness w) from positions, normals, and UVs, accumulated per
 * triangle and orthonormalized against the normal. The baker uses the same frames, so the normal
 * map and the exported TANGENT attribute always agree.
 */
export function computeTangents(
  positions: Float32Array,
  normals: Float32Array,
  uvs: Float32Array,
  indices: Uint32Array,
): Float32Array {
  const n = positions.length / 3;
  const tan = new Float64Array(n * 3);
  const bit = new Float64Array(n * 3);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]!;
    const b = indices[t + 1]!;
    const c = indices[t + 2]!;
    const e1x = positions[b * 3]! - positions[a * 3]!;
    const e1y = positions[b * 3 + 1]! - positions[a * 3 + 1]!;
    const e1z = positions[b * 3 + 2]! - positions[a * 3 + 2]!;
    const e2x = positions[c * 3]! - positions[a * 3]!;
    const e2y = positions[c * 3 + 1]! - positions[a * 3 + 1]!;
    const e2z = positions[c * 3 + 2]! - positions[a * 3 + 2]!;
    const du1 = uvs[b * 2]! - uvs[a * 2]!;
    const dv1 = uvs[b * 2 + 1]! - uvs[a * 2 + 1]!;
    const du2 = uvs[c * 2]! - uvs[a * 2]!;
    const dv2 = uvs[c * 2 + 1]! - uvs[a * 2 + 1]!;
    const det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) < 1e-20) continue;
    const r = 1 / det;
    const tx = (e1x * dv2 - e2x * dv1) * r;
    const ty = (e1y * dv2 - e2y * dv1) * r;
    const tz = (e1z * dv2 - e2z * dv1) * r;
    const bx = (e2x * du1 - e1x * du2) * r;
    const by = (e2y * du1 - e1y * du2) * r;
    const bz = (e2z * du1 - e1z * du2) * r;
    for (const v of [a, b, c]) {
      tan[v * 3] = tan[v * 3]! + tx;
      tan[v * 3 + 1] = tan[v * 3 + 1]! + ty;
      tan[v * 3 + 2] = tan[v * 3 + 2]! + tz;
      bit[v * 3] = bit[v * 3]! + bx;
      bit[v * 3 + 1] = bit[v * 3 + 1]! + by;
      bit[v * 3 + 2] = bit[v * 3 + 2]! + bz;
    }
  }
  const out = new Float32Array(n * 4);
  for (let v = 0; v < n; v++) {
    const nx = normals[v * 3]!;
    const ny = normals[v * 3 + 1]!;
    const nz = normals[v * 3 + 2]!;
    let tx = tan[v * 3]!;
    let ty = tan[v * 3 + 1]!;
    let tz = tan[v * 3 + 2]!;
    const d = nx * tx + ny * ty + nz * tz;
    tx -= nx * d;
    ty -= ny * d;
    tz -= nz * d;
    let l = Math.hypot(tx, ty, tz);
    if (l < 1e-12) {
      // Degenerate UVs: any vector perpendicular to the normal.
      const ax = Math.abs(nx) < 0.9 ? 1 : 0;
      const ay = 1 - ax;
      tx = ay * nz;
      ty = -ax * nz;
      tz = ax * ny - ay * nx;
      l = Math.hypot(tx, ty, tz) || 1;
    }
    tx /= l;
    ty /= l;
    tz /= l;
    // Handedness: does (N x T) point along the UV bitangent?
    const cx = ny * tz - nz * ty;
    const cy = nz * tx - nx * tz;
    const cz = nx * ty - ny * tx;
    const w = cx * bit[v * 3]! + cy * bit[v * 3 + 1]! + cz * bit[v * 3 + 2]! < 0 ? -1 : 1;
    out.set([tx, ty, tz, w], v * 4);
  }
  return out;
}
