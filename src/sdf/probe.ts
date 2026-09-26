import type { Sdf, Vec3 } from './core.js';

/**
 * Find where a ray first hits the surface of `shape` (sphere tracing). Use it to attach details
 * exactly to a modeled surface: eyes on a face, spikes along a back, rivets on a helmet.
 * Returns null when the ray misses within `maxDistance`.
 *
 *   const eye = sdf.raycast(head, [0.08, 0.5, 2], [0, 0, -1]); // from the front, looking back
 */
export function raycast(shape: Sdf, origin: Vec3, direction: Vec3, maxDistance = 20): Vec3 | null {
  const l = Math.hypot(direction[0], direction[1], direction[2]);
  const dx = direction[0] / l;
  const dy = direction[1] / l;
  const dz = direction[2] / l;
  let t = 0;
  for (let i = 0; i < 512 && t < maxDistance; i++) {
    const x = origin[0] + dx * t;
    const y = origin[1] + dy * t;
    const z = origin[2] + dz * t;
    const d = shape.dist(x, y, z);
    if (Math.abs(d) < 1e-5) return [x, y, z];
    if (d < 0) {
      // Stepped inside a bound field: back up with bisection to the crossing.
      let lo = Math.max(0, t - 0.01);
      let hi = t;
      for (let k = 0; k < 40; k++) {
        const m = (lo + hi) / 2;
        if (shape.dist(origin[0] + dx * m, origin[1] + dy * m, origin[2] + dz * m) > 0) lo = m;
        else hi = m;
      }
      return [origin[0] + dx * hi, origin[1] + dy * hi, origin[2] + dz * hi];
    }
    t += Math.max(d * 0.9, 1e-4);
  }
  return null;
}

/** Outward unit normal of the field at a point (on or near the surface). */
export function normalAt(shape: Sdf, p: Vec3, eps = 0.0005): Vec3 {
  const d = shape.dist;
  const gx = d(p[0] + eps, p[1], p[2]) - d(p[0] - eps, p[1], p[2]);
  const gy = d(p[0], p[1] + eps, p[2]) - d(p[0], p[1] - eps, p[2]);
  const gz = d(p[0], p[1], p[2] + eps) - d(p[0], p[1], p[2] - eps);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
}

/**
 * The surface point nearest to `p`, optionally pushed out along the normal by `lift` meters
 * (negative lift sinks it in, which is how to root a spike or horn in a body).
 */
export function surfacePoint(shape: Sdf, p: Vec3, lift = 0): Vec3 {
  let q: [number, number, number] = [p[0], p[1], p[2]];
  for (let i = 0; i < 12; i++) {
    const d = shape.dist(q[0], q[1], q[2]);
    if (Math.abs(d) < 1e-6) break;
    const n = normalAt(shape, q);
    q = [q[0] - n[0] * d, q[1] - n[1] * d, q[2] - n[2] * d];
  }
  const n = normalAt(shape, q);
  return [q[0] + n[0] * lift, q[1] + n[1] * lift, q[2] + n[2] * lift];
}
