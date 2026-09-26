import * as THREE from 'three';
import type { BoneTag, Vec3 } from './sdf/core.js';

/** One bone: its joint position in the rest pose (world space) and its parent. */
export interface BoneDef {
  readonly parent?: string;
  /** Joint (pivot) position in the rest pose, in world meters. */
  readonly at: Vec3;
  /** Optional end point, used for weights when a body has no tags and for display. */
  readonly tail?: Vec3;
}

export type SkeletonDef = Readonly<Record<string, BoneDef>>;

/**
 * A bone's offset from its rest pose. `rotate` is Euler degrees about the bone's pivot, applied X
 * then Y then Z, on world-aligned axes (rest poses have no rotation):
 * +X swings a hanging limb backward (toward -Z), +Z swings it toward +X (the character's left),
 * +Y twists it counterclockwise seen from above. `move` translates the bone in meters.
 */
export interface BonePose {
  readonly rotate?: Vec3;
  readonly move?: Vec3;
  /** Scale multiplier per axis (1 = rest). Squash and stretch: [1.15, 0.85, 1.15]. */
  readonly scale?: Vec3;
}

export type Pose = Readonly<Record<string, BonePose>>;

export interface AnimationDef {
  /** Length in seconds. */
  readonly duration: number;
  /** Samples per second in the exported clip. Default 30. */
  readonly fps?: number;
  /** Cycles (walk, run, idle) loop; one-shots (attack, jump) do not. Default true. */
  readonly loop?: boolean;
  /**
   * Keep the body on the ground: where it would sink below the rest pose's lowest point (a foot
   * that rolls, a body that lies down), the root bone rises by that much. Default true.
   */
  readonly ground?: boolean;
  /** The pose at time `t` seconds; `phase` is t / duration in [0, 1]. */
  pose(t: number, phase: number): Pose;
}

export interface Rig {
  readonly root: THREE.Bone;
  readonly bones: readonly THREE.Bone[];
  readonly index: ReadonlyMap<string, number>;
  readonly def: SkeletonDef;
}

/** Create three.js bones for a skeleton definition, parents before children. */
export function buildRig(def: SkeletonDef): Rig {
  const names = Object.keys(def);
  const roots = names.filter((n) => def[n]!.parent === undefined);
  if (roots.length !== 1)
    throw new Error(
      `A skeleton needs exactly one root bone (no parent); found ${roots.length}: ${roots.join(', ')}.`,
    );
  for (const n of names) {
    const p = def[n]!.parent;
    if (p !== undefined && !(p in def)) throw new Error(`Bone '${n}' has unknown parent '${p}'.`);
  }
  const order: string[] = [];
  const visit = (n: string, depth: number) => {
    if (depth > names.length) throw new Error('The skeleton has a parent cycle.');
    order.push(n);
    for (const c of names) if (def[c]!.parent === n) visit(c, depth + 1);
  };
  visit(roots[0]!, 0);
  const byName = new Map<string, THREE.Bone>();
  const bones = order.map((n) => {
    const b = new THREE.Bone();
    b.name = n;
    const at = def[n]!.at;
    const parent = def[n]!.parent;
    const pat = parent ? def[parent]!.at : ([0, 0, 0] as const);
    b.position.set(at[0] - pat[0], at[1] - pat[1], at[2] - pat[2]);
    if (parent) byName.get(parent)!.add(b);
    byName.set(n, b);
    return b;
  });
  return { root: bones[0]!, bones, index: new Map(order.map((n, i) => [n, i])), def };
}

export interface SkinOptions {
  /** Rigidly bind the whole body to this bone. */
  readonly bone?: string;
  /** Blend width in meters: how gradually weight passes from one bone to the next. */
  readonly blend: number;
}

/**
 * Skin weights for vertices: the distance from each vertex to each bone's tagged shapes decides
 * the weights (closest bone dominates; bones within `blend` of it share). Bodies without tags fall
 * back to the distance to each bone's segment (joint to tail or first child).
 */
export function skinWeights(
  positions: Float32Array,
  tags: readonly BoneTag[],
  rig: Rig,
  opts: SkinOptions,
  bodyName: string,
): { index: Uint16Array; weight: Float32Array } {
  const n = positions.length / 3;
  const index = new Uint16Array(n * 4);
  const weight = new Float32Array(n * 4);
  if (opts.bone !== undefined) {
    const b = rig.index.get(opts.bone);
    if (b === undefined) throw new Error(`Body '${bodyName}' binds to unknown bone '${opts.bone}'.`);
    for (let v = 0; v < n; v++) {
      index[v * 4] = b;
      weight[v * 4] = 1;
    }
    return { index, weight };
  }

  // Group distance functions by bone.
  let sources: { bone: number; dist: (x: number, y: number, z: number) => number }[];
  if (tags.length > 0) {
    sources = tags.map((t) => {
      const b = rig.index.get(t.bone);
      if (b === undefined)
        throw new Error(
          `Body '${bodyName}' has a part tagged '${t.bone}', which is not in the skeleton. Bones: ${[...rig.index.keys()].join(', ')}.`,
        );
      return { bone: b, dist: t.dist };
    });
  } else {
    sources = [...rig.index.entries()].map(([name, b]) => {
      const def = rig.def[name]!;
      const child = Object.entries(rig.def).find(([, d]) => d.parent === name)?.[1];
      const tail = def.tail ?? child?.at ?? def.at;
      return { bone: b, dist: segmentDistance(def.at, tail) };
    });
  }

  const boneCount = rig.bones.length;
  const d = new Float64Array(boneCount);
  const order = Array.from({ length: boneCount }, (_, i) => i);
  for (let v = 0; v < n; v++) {
    const x = positions[v * 3]!;
    const y = positions[v * 3 + 1]!;
    const z = positions[v * 3 + 2]!;
    d.fill(Infinity);
    for (const s of sources) {
      const dist = s.dist(x, y, z);
      if (dist < d[s.bone]!) d[s.bone] = dist;
    }
    let min = Infinity;
    for (let b = 0; b < boneCount; b++) min = Math.min(min, d[b]!);
    order.sort((a, b) => d[a]! - d[b]!);
    let total = 0;
    const w = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) {
      const b = order[k]!;
      const gap = d[b]! - min;
      if (!Number.isFinite(gap) || gap > opts.blend * 5) break;
      w[k] = Math.exp(-gap / opts.blend);
      total += w[k]!;
    }
    for (let k = 0; k < 4; k++) {
      index[v * 4 + k] = order[k] ?? 0;
      weight[v * 4 + k] = total > 0 ? w[k]! / total : k === 0 ? 1 : 0;
    }
  }
  return { index, weight };
}

function segmentDistance(a: Vec3, b: Vec3): (x: number, y: number, z: number) => number {
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  return (x, y, z) => {
    const px = x - a[0];
    const py = y - a[1];
    const pz = z - a[2];
    const t = l2 > 0 ? Math.max(0, Math.min(1, (px * bax + py * bay + pz * baz) / l2)) : 0;
    return Math.hypot(px - bax * t, py - bay * t, pz - baz * t);
  };
}

/** Sample an animation into a three.js clip with one track per animated bone. */
export function sampleAnimation(name: string, anim: AnimationDef, rig: Rig): THREE.AnimationClip {
  if (!(anim.duration > 0)) throw new Error(`Animation '${name}' needs a positive duration.`);
  const fps = anim.fps ?? 30;
  const frames = Math.max(2, Math.round(anim.duration * fps) + 1);
  const times = new Float32Array(frames);
  const poses: Pose[] = [];
  for (let f = 0; f < frames; f++) {
    const t = (f / (frames - 1)) * anim.duration;
    times[f] = t;
    poses.push(anim.pose(t, t / anim.duration));
  }
  const used = new Set<string>();
  for (const p of poses) for (const b of Object.keys(p)) used.add(b);
  const tracks: THREE.KeyframeTrack[] = [];
  const euler = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (const b of used) {
    const i = rig.index.get(b);
    if (i === undefined)
      throw new Error(
        `Animation '${name}' poses unknown bone '${b}'. Bones: ${[...rig.index.keys()].join(', ')}.`,
      );
    const bone = rig.bones[i]!;
    const rot = new Float32Array(frames * 4);
    const pos = new Float32Array(frames * 3);
    const scl = new Float32Array(frames * 3);
    let rotates = false;
    let moves = false;
    let scales = false;
    poses.forEach((p, f) => {
      const bp = p[b];
      const r = bp?.rotate ?? [0, 0, 0];
      const m = bp?.move ?? [0, 0, 0];
      if (bp?.rotate) rotates = true;
      if (bp?.move) moves = true;
      if (bp?.scale) scales = true;
      scl.set(bp?.scale ?? [1, 1, 1], f * 3);
      q.setFromEuler(
        euler.set(
          r[0] * THREE.MathUtils.DEG2RAD,
          r[1] * THREE.MathUtils.DEG2RAD,
          r[2] * THREE.MathUtils.DEG2RAD,
          'XYZ',
        ),
      );
      rot.set([q.x, q.y, q.z, q.w], f * 4);
      pos.set([bone.position.x + m[0], bone.position.y + m[1], bone.position.z + m[2]], f * 3);
    });
    if (rotates) tracks.push(new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, rot));
    if (moves) tracks.push(new THREE.VectorKeyframeTrack(`${b}.position`, times, pos));
    if (scales) tracks.push(new THREE.VectorKeyframeTrack(`${b}.scale`, times, scl));
  }
  const clip = new THREE.AnimationClip(name, anim.duration, tracks);
  clip.userData = { loop: anim.loop ?? true, fps };
  return clip;
}
