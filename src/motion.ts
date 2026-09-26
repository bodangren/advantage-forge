import * as THREE from 'three';
import { mirrorBoneName, type Vec3 } from './sdf/core.js';
import type { Pose } from './rig.js';

/** A sine wave over the clip: `cycles` full periods per clip, shifted by `offset` periods. In [-1, 1]. */
export function wave(phase: number, cycles = 1, offset = 0): number {
  return Math.sin(2 * Math.PI * (phase * cycles + offset));
}

/** A smooth bump over the clip: 0 at the start of each period, 1 in the middle. In [0, 1]. */
export function bump(phase: number, cycles = 1, offset = 0): number {
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * (phase * cycles + offset));
}

/**
 * The same pose for the other side of a symmetric character: `.L` bones become `.R` (and back),
 * and rotations about Y and Z flip sign. Write the left side, then spread in `mirrorPose(left)`.
 */
export function mirrorPose(pose: Pose): Pose {
  const out: Record<string, { rotate?: Vec3; move?: Vec3 }> = {};
  for (const [bone, p] of Object.entries(pose)) {
    out[mirrorBoneName(bone)] = {
      ...(p.rotate ? { rotate: [p.rotate[0], -p.rotate[1], -p.rotate[2]] as Vec3 } : {}),
      ...(p.move ? { move: [-p.move[0], p.move[1], p.move[2]] as Vec3 } : {}),
    };
  }
  return out;
}

/**
 * How far to lower the hips so a planted foot stays on the ground when a leg of length `legLength`
 * swings `degrees` from vertical.
 */
export function legDrop(legLength: number, degrees: number): number {
  return legLength * (1 - Math.cos((degrees * Math.PI) / 180));
}

// ---------------------------------------------------------------------------------------------
// Posing by targets. The rig applies each bone's `rotate` as Euler degrees in X-Y-Z order on
// world-aligned rest axes, and a child turns with its parent. Getting a weapon to follow a clean
// path by hand-tuning those angles is slow and error-prone; these helpers solve them instead.
// Positions are in the parent bone's rest frame (for an arm: the chest's rest pose, in world
// meters), so a clip may still twist the chest and the arm follows.

type Quat = THREE.Quaternion;
const DEG = Math.PI / 180;
const v3 = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);

/** The quaternion of a rig rotation (Euler degrees, X-Y-Z order). */
export function quat(rotate: Vec3): Quat {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(rotate[0] * DEG, rotate[1] * DEG, rotate[2] * DEG, 'XYZ'));
}

/** The rig rotation (Euler degrees, X-Y-Z order) of a quaternion. */
export function euler(q: Quat): Vec3 {
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return [e.x / DEG, e.y / DEG, e.z / DEG];
}

/**
 * Where a point bound to the last bone of a chain ends up when the chain is posed. `joints` are the
 * rest positions of the chain's pivots (root first), `rotations` the bones' `rotate` values in the
 * same order. Use it to find a posed weapon grip, so the other hand can reach for it.
 */
export function follow(joints: readonly Vec3[], rotations: readonly Vec3[], point: Vec3): Vec3 {
  let q = new THREE.Quaternion();
  let pos = v3(joints[0]!);
  for (let i = 0; i < joints.length; i++) {
    q = q.clone().multiply(quat(rotations[i] ?? [0, 0, 0]));
    const next = i + 1 < joints.length ? joints[i + 1]! : point;
    const seg = v3(next).sub(v3(joints[i]!)).applyQuaternion(q);
    pos = pos.add(seg);
  }
  return [pos.x, pos.y, pos.z];
}

/**
 * Two-bone IK (an arm or a leg). Returns the `rotate` values for the upper and the lower bone that
 * put the end joint (wrist, ankle) at `target`, with the middle joint (elbow, knee) bent toward
 * `pole`. `rest` holds the rest positions of the three joints. A target out of reach is pulled in
 * along the line from the root.
 */
export function reach(rest: { root: Vec3; mid: Vec3; end: Vec3 }, target: Vec3, pole: Vec3): { upper: Vec3; lower: Vec3 } {
  const root = v3(rest.root);
  const a = v3(rest.mid).distanceTo(root);
  const b = v3(rest.end).distanceTo(v3(rest.mid));
  const t = v3(target).sub(root);
  const dist = Math.min(Math.max(t.length(), Math.abs(a - b) + 1e-4), a + b - 1e-4);
  const tDir = t.clone().normalize();
  // The bend plane: the pole direction without its component along the target line.
  const p = v3(pole).sub(root);
  let side = p.sub(tDir.clone().multiplyScalar(p.dot(tDir)));
  if (side.lengthSq() < 1e-10) side = new THREE.Vector3(0, 0, 1).cross(tDir).cross(tDir).negate();
  side.normalize();
  const cosA = (a * a + dist * dist - b * b) / (2 * a * dist);
  const angA = Math.acos(Math.min(1, Math.max(-1, cosA)));
  const mid = tDir.clone().multiplyScalar(Math.cos(angA) * a).add(side.clone().multiplyScalar(Math.sin(angA) * a));
  const end = tDir.clone().multiplyScalar(dist);
  const restUpper = v3(rest.mid).sub(root).normalize();
  const qU = new THREE.Quaternion().setFromUnitVectors(restUpper, mid.clone().normalize());
  const restLower = v3(rest.end).sub(v3(rest.mid)).normalize();
  const want = end.clone().sub(mid).normalize().applyQuaternion(qU.clone().invert());
  const qL = new THREE.Quaternion().setFromUnitVectors(restLower, want);
  return { upper: euler(qU), lower: euler(qL) };
}

/**
 * The `rotate` value that turns a bone (a hand, a head) so two of its rest directions point where
 * you want: `dir` exactly, and `up` as closely as `dir` allows (the roll). `parents` are the
 * `rotate` values of the bones above it in the chain (for a hand: upper arm, then forearm), so the
 * result is local to the posed parent. Directions are in the chain root's rest frame.
 */
export function orient(
  parents: readonly Vec3[],
  rest: { dir: Vec3; up: Vec3 },
  want: { dir: Vec3; up: Vec3 },
): Vec3 {
  const basis = (dir: Vec3, up: Vec3) => {
    const d = v3(dir).normalize();
    const s = v3(up).cross(d).normalize();
    const u = d.clone().cross(s);
    return new THREE.Matrix4().makeBasis(s, u, d);
  };
  const qRest = new THREE.Quaternion().setFromRotationMatrix(basis(rest.dir, rest.up));
  const qWant = new THREE.Quaternion().setFromRotationMatrix(basis(want.dir, want.up));
  const world = qWant.multiply(qRest.invert());
  let parent = new THREE.Quaternion();
  for (const r of parents) parent = parent.multiply(quat(r));
  return euler(parent.invert().multiply(world));
}

type Key<T> = readonly [number, T];

/**
 * A value that moves through keyframes over the clip. `list` holds [phase, value] pairs in order
 * (phase in [0, 1]); values are numbers or [x, y, z]. `smooth` (the default) eases in and out of
 * every key, for holds and settles; `spline` passes through the keys without stopping, for a
 * weapon path that must keep its speed through the strike. Before the first key and after the
 * last, the value holds.
 */
export function keys<T extends number | Vec3>(phase: number, list: readonly Key<T>[], mode: 'smooth' | 'spline' | 'linear' = 'smooth'): T {
  const n = list.length;
  if (phase <= list[0]![0]) return list[0]![1];
  if (phase >= list[n - 1]![0]) return list[n - 1]![1];
  let i = 0;
  while (i < n - 2 && phase > list[i + 1]![0]) i++;
  const [t0, v0] = list[i]!;
  const [t1, v1] = list[i + 1]!;
  const u = (phase - t0) / (t1 - t0);
  const lerpAll = (f: (a: number, b: number, c: number, d: number) => number): T => {
    const pick = (k: number) => list[Math.min(n - 1, Math.max(0, k))]![1];
    const a = pick(i - 1);
    const d = pick(i + 2);
    if (typeof v0 === 'number') return f(a as number, v0, v1 as number, d as number) as T;
    const out = [0, 1, 2].map((c) => f((a as Vec3)[c]!, (v0 as Vec3)[c]!, (v1 as Vec3)[c]!, (d as Vec3)[c]!));
    return out as unknown as T;
  };
  if (mode === 'linear') return lerpAll((_a, b, c) => b + (c - b) * u);
  if (mode === 'smooth') {
    const s = u * u * (3 - 2 * u);
    return lerpAll((_a, b, c) => b + (c - b) * s);
  }
  // Catmull-Rom through the keys.
  return lerpAll((a, b, c, d) => {
    const u2 = u * u;
    const u3 = u2 * u;
    return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  });
}

/**
 * The `up` for `orient` that makes a cutting edge lead: the flat's normal is the cross product of
 * the blade direction and its motion, taken on the side of `fallback` (the flat's rest normal) so
 * the blade never flips. Where the blade barely turns (holds, recovery), the result eases to
 * `fallback`. `dirAt(phase)` gives the blade direction over the clip.
 */
export function edgeUp(dirAt: (phase: number) => Vec3, phase: number, fallback: Vec3, dt = 0.01): Vec3 {
  const d = v3(dirAt(phase)).normalize();
  const motion = v3(dirAt(Math.min(1, phase + dt))).normalize().sub(v3(dirAt(Math.max(0, phase - dt))).normalize());
  const n = d.clone().cross(motion);
  const f = v3(fallback).normalize();
  if (n.dot(f) < 0) n.negate();
  // Full weight once the blade turns about 3 radians per clip or faster.
  const w = Math.min(1, n.length() / (dt * 2 * 3));
  const up = f.multiplyScalar(1 - w).add(n.normalize().multiplyScalar(w)).normalize();
  return [up.x, up.y, up.z];
}
