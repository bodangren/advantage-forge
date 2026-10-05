import { sdf } from '../../src/index.js';
import type { AssetContext, BodyOptions, SkeletonDef } from '../../src/index.js';

type V3 = readonly [number, number, number];

/** Where a kind's head is: the head and body zones decide which space grows, about `pivot`. */
export interface HeadZones {
  /** The point the head grows from (at the back and bottom of the head, near the head joint). */
  readonly pivot: V3;
  /** A rough head volume (skull and muzzle). */
  readonly head: sdf.Shape;
  /** A rough body volume (chest and rump), which keeps its size. */
  readonly body: sdf.Shape;
  /** The width of the blend between them in meters (default 0.06). */
  readonly blend?: number;
}

/** The point map of `headSwell` for rest-pose points (joints, and the ground probes of clips). */
export function headSwellPoint(S: number, z: HeadZones): (p: V3) => [number, number, number] {
  const K = z.blend ?? 0.06;
  const [px, py, pz] = z.pivot;
  return (p) => {
    const t = Math.min(1, Math.max(0, (z.body.dist(p[0], p[1], p[2]) - z.head.dist(p[0], p[1], p[2]) + K) / (2 * K)));
    const s = 1 + (S - 1) * t * t * (3 - 2 * t);
    return [px + (p[0] - px) * s, py + (p[1] - py) * s, pz + (p[2] - pz) * s];
  };
}

/**
 * A context that grows a kind's head by `S` (a `headScale` option). Each body is warped: space
 * that is nearer to the head zone than to the body zone is scaled about the pivot, so every head
 * body, its paint, and its bone tags grow together, and the body and the legs keep their size;
 * the neck blends between them. Joints in the head move outward by the same scale, so the head
 * still turns about its joint.
 */
export function headSwell(k0: AssetContext, S: number, z: HeadZones): AssetContext {
  const K = z.blend ?? 0.06;
  const scaleAt = (x: number, y: number, w: number) => {
    const t = Math.min(1, Math.max(0, (z.body.dist(x, y, w) - z.head.dist(x, y, w) + K) / (2 * K)));
    return 1 + (S - 1) * t * t * (3 - 2 * t);
  };
  const [px, py, pz] = z.pivot;
  const map = (x: number, y: number, w: number): V3 => {
    const s = scaleAt(x, y, w);
    return [px + (x - px) / s, py + (y - py) / s, pz + (w - pz) / s];
  };
  const out = headSwellPoint(S, z);
  const P = z.pivot;
  const grow = (b: sdf.Shape['bounds']): sdf.Shape['bounds'] => ({
    min: [0, 1, 2].map((i) => Math.min(b.min[i]!, P[i]! + (b.min[i]! - P[i]!) * S)) as unknown as V3,
    max: [0, 1, 2].map((i) => Math.max(b.max[i]!, P[i]! + (b.max[i]! - P[i]!) * S)) as unknown as V3,
  });
  // The blend can shorten distances: the field is divided by this bound.
  const L = 1 + (0.48 / K) * Math.abs(S - 1);
  return Object.assign(Object.create(k0) as AssetContext, {
    body: (name: string, shape: sdf.Shape, o?: BodyOptions) => k0.body(name, shape.warp(map, L, grow(shape.bounds)), o),
    skeleton: (d: SkeletonDef) =>
      k0.skeleton(Object.fromEntries(Object.entries(d).map(([bone, b]) => [bone, { ...b, at: out(b.at), ...(b.tail ? { tail: out(b.tail) } : {}) }]))),
  });
}

/** The point map of `stretch` along `axis` for rest-pose points (joints, and the ground probes of clips). */
export function stretchPoint(axis: 0 | 1 | 2, d: number, a0: number, a1: number): (p: V3) => [number, number, number] {
  const s = (a1 - a0) / (a1 - a0 + d);
  const up = (v: number) => (v < a0 ? v : v > a1 ? v + d : a0 + (v - a0) / s);
  return (p) => (axis === 0 ? [up(p[0]), p[1], p[2]] : axis === 1 ? [p[0], up(p[1]), p[2]] : [p[0], p[1], up(p[2])]);
}

/**
 * A context that stretches a kind along one axis by `d` meters (below 0, shorter): space between
 * `a0` and `a1` on the axis stretches to `a1 - a0 + d`, and everything beyond `a1` moves by `d`.
 * The parts on each side keep their shape; paint and bone tags follow. Along Y it makes the legs
 * longer (`legStretch`); along Z it makes a four-legged body longer between the shoulders and the hips.
 */
export function stretch(k0: AssetContext, axis: 0 | 1 | 2, d: number, a0: number, a1: number): AssetContext {
  const s = (a1 - a0) / (a1 - a0 + d);
  const along = (v: number) => (v < a0 ? v : v > a1 + d ? v - d : a0 + (v - a0) * s);
  const map = (x: number, y: number, w: number): V3 => (axis === 0 ? [along(x), y, w] : axis === 1 ? [x, along(y), w] : [x, y, along(w)]);
  const out = stretchPoint(axis, d, a0, a1);
  const grow = (b: sdf.Shape['bounds']): sdf.Shape['bounds'] => ({ min: out(b.min), max: out(b.max) });
  // A longer stretch only shortens distances; a shorter one (`d` below 0) stretches them by 1 / s.
  const L = Math.max(1, s);
  return Object.assign(Object.create(k0) as AssetContext, {
    body: (name: string, shape: sdf.Shape, o?: BodyOptions) => k0.body(name, shape.warp(map, L, grow(shape.bounds)), o),
    skeleton: (def: SkeletonDef) =>
      k0.skeleton(Object.fromEntries(Object.entries(def).map(([bone, b]) => [bone, { ...b, at: out(b.at), ...(b.tail ? { tail: out(b.tail) } : {}) }]))),
  });
}

/**
 * A context that makes a kind's legs longer by `d` meters (a `legLength` option; below 0, shorter):
 * space between the heights `y0` and `y1` (the shins, above the feet and below the belly)
 * stretches to `y1 - y0 + d`, and everything above it moves up by `d`. The feet, the body, and the head keep
 * their shape; paint and bone tags follow. Wrap it inside `headSwell`, which works in the
 * unstretched space.
 */
export function legStretch(k0: AssetContext, d: number, y0: number, y1: number): AssetContext {
  return stretch(k0, 1, d, y0, y1);
}

/**
 * A context that moves a kind's head by `T` meters (a `headShift` option) and stretches the neck
 * between: space near the moved head zone moves with the head, space near the body zone stays,
 * and the neck blends between them over the gap. Paint and bone tags follow; joints in the head
 * move by `T`, and joints between move part of the way.
 */
export function headShift(k0: AssetContext, T: V3, z: HeadZones): AssetContext {
  const K = z.blend ?? 0.06;
  const moved = z.head.at(T[0], T[1], T[2]);
  // The weight of the head at a point: 1 near the head zone, 0 near the body zone.
  const weight = (head: sdf.Shape, x: number, y: number, w: number) => {
    const t = Math.min(1, Math.max(0, (z.body.dist(x, y, w) - head.dist(x, y, w) + K) / (2 * K)));
    return t * t * (3 - 2 * t);
  };
  const map = (x: number, y: number, w: number): V3 => {
    const s = weight(moved, x, y, w);
    return [x - T[0] * s, y - T[1] * s, w - T[2] * s];
  };
  const out = (p: V3): [number, number, number] => {
    const s = weight(z.head, p[0], p[1], p[2]);
    return [p[0] + T[0] * s, p[1] + T[1] * s, p[2] + T[2] * s];
  };
  const grow = (b: sdf.Shape['bounds']): sdf.Shape['bounds'] => ({
    min: [0, 1, 2].map((i) => Math.min(b.min[i]!, b.min[i]! + T[i]!)) as unknown as V3,
    max: [0, 1, 2].map((i) => Math.max(b.max[i]!, b.max[i]! + T[i]!)) as unknown as V3,
  });
  // The blend stretches space by up to 1 + 0.75 |T| / K.
  const L = 1 + (0.75 * Math.hypot(T[0], T[1], T[2])) / K;
  return Object.assign(Object.create(k0) as AssetContext, {
    body: (name: string, shape: sdf.Shape, o?: BodyOptions) => k0.body(name, shape.warp(map, L, grow(shape.bounds)), o),
    skeleton: (d: SkeletonDef) =>
      k0.skeleton(Object.fromEntries(Object.entries(d).map(([bone, b]) => [bone, { ...b, at: out(b.at), ...(b.tail ? { tail: out(b.tail) } : {}) }]))),
  });
}
