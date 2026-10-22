import * as THREE from 'three';
import { motion, sdf } from '../../src/index.js';
import type { AssetContext, Pose } from '../../src/index.js';
import type { HumanoidShape } from './humanoid-kind.js';

/**
 * Sprout gestures: the seven week 1 gesture clips of Chibi Sprouts on the humanoid kind's skeleton
 * (`gesture-idle`, `-clap`, `-wave`, `-nod`, `-point-to-self`, `-point-forward`, `-hands-out`).
 * A Sprout adds them in `extra` with `sproutGestures(k, h)`. Every clip is 2 s, loops, and starts
 * and ends in the idle stance. The Workbooks compositor reads key frames at fixed times, so each
 * clip holds its named pose exactly at these times (it eases into and out of the key):
 *
 *   clap             0.5 s hands 0.14 m apart       1.0 s hands touching
 *   wave             0.5 s hand swung 25 deg out    1.0 s hand swung 25 deg in (from a 45 deg arm)
 *   nod              0.5 s head 12 deg up           1.0 s head 15 deg down
 *   point-to-self    1.0 s    point-forward    1.0 s    hands-out    1.0 s    idle    1.0 s
 *
 * The hands are the kind's closed fists. `sproutIndexFinger(h)` is the one hand shape: a short
 * index finger on the right fist (tag `hand.R`, in every clip), which points along the fist's
 * front (forward and a little down at rest). The arms are IK targets (`motion.reach`); the hand
 * frame is set by two vectors: `D` (the direction in which the hand continues the forearm) and
 * `A` (the fist's front, the item axis of the kind). At age 5 the arms are short (the reach is
 * 0.138 m from the shoulder to the wrist), so a raised hand beside the head is as high as the
 * jaw line allows.
 */

type V3 = readonly [number, number, number];

const RAD = Math.PI / 180;
const FINGER_TURN = 8; // degrees from the fist's front toward the hand axis
const FINGER_LENGTH = 0.046; // meters from the grip center to the fingertip

const vec = (v: V3) => new THREE.Vector3(v[0], v[1], v[2]);
const arr = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (v: V3): V3 => arr(vec(v).normalize());

/** The rest axes of the fist (right-hand coordinates): front (the item direction) and flat normal (outward). */
const A0: V3 = [0, Math.sin(20 * RAD), Math.cos(20 * RAD)];
const N0: V3 = [-1, 0, 0];

/** The hand frame of a goal: `d` the hand axis, `hint` the fist front; returns the orthonormal front `a` and flat normal `n`. */
function frameOf(d: V3, hint: V3): { a: V3; n: V3 } {
  const dv = vec(d).normalize();
  const n = dv.clone().cross(vec(hint)).normalize();
  const a = n.clone().cross(dv).normalize();
  return { a: arr(a), n: arr(n) };
}

/** The orthonormal basis of a (front, normal) pair, the same as `motion.orient` builds. */
function basis(a: V3, n: V3): THREE.Quaternion {
  const d = vec(a).normalize();
  const s = vec(n).cross(d).normalize();
  const u = d.clone().cross(s);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(s, u, d));
}

/** The index finger on the right fist: a tapered cone from the grip center along the fist's front, turned toward the hand axis. */
export function sproutIndexFinger(h: HumanoidShape): sdf.Shape {
  const { GRIP } = h.joints;
  const g: V3 = [-GRIP[0], GRIP[1], GRIP[2]];
  const d = vec(A0).cross(vec(N0)); // the hand axis at rest
  const dir = vec(A0).multiplyScalar(Math.cos(FINGER_TURN * RAD)).add(d.multiplyScalar(Math.sin(FINGER_TURN * RAD))).normalize();
  const start: V3 = arr(vec(g).addScaledVector(dir, 0.012));
  const tip: V3 = arr(vec(g).addScaledVector(dir, FINGER_LENGTH));
  return sdf.cone(start, tip, 0.0125, 0.0085).bone('hand.R');
}

interface Goal {
  /** The wrist target (right-arm coordinates, x < 0). */
  readonly wrist: V3;
  /** The hand axis: the direction in which the hand continues the forearm. */
  readonly d: V3;
  /** A hint for the fist front (made orthogonal to `d`). */
  readonly hint: V3;
  /** The elbow bends toward this point. */
  readonly pole: V3;
}

export function sproutGestures(k: AssetContext, h: HumanoidShape): void {
  const { SHOULDER, ELBOW, WRIST, GRIP } = h.joints;
  const { keys, bump, reach, orient } = motion;

  const arm = (side: 1 | -1) => {
    const m = (v: V3): V3 => (side === 1 ? [-v[0], v[1], v[2]] : v);
    const tag = side === 1 ? 'L' : 'R';
    const sx = (p: V3): V3 => [-p[0], p[1], p[2]]; // left joint to right-arm coordinates
    const chainR = { root: sx(SHOULDER), mid: sx(ELBOW), end: sx(WRIST) };
    const chain = { root: m(chainR.root), mid: m(chainR.mid), end: m(chainR.end) };
    // The grip center relative to the wrist at rest, in right-arm coordinates.
    const off = vec([-(GRIP[0] - WRIST[0]), GRIP[1] - WRIST[1], GRIP[2] - WRIST[2]]);
    const qRest = basis(A0, N0);
    const qRestInv = qRest.clone().invert();
    /** The pose of the arm for a goal, `f` of the way from the rest (0) to the goal (1). */
    const pose = (goal: Goal, f: number): Pose => {
      const fr = frameOf(goal.d, goal.hint);
      const wristGoal = lerp3(chainR.end, goal.wrist, f);
      const poleNow = lerp3(chainR.mid, goal.pole, f);
      const a = unit(lerp3(A0, fr.a, f));
      const n = unit(lerp3(N0, fr.n, f));
      const lim = reach(chain, m(wristGoal), m(poleNow));
      const rot = orient([lim.upper, lim.lower], { dir: m(A0), up: m(N0) }, { dir: m(a), up: m(n) });
      return {
        [`upperarm.${tag}`]: { rotate: lim.upper },
        [`forearm.${tag}`]: { rotate: lim.lower },
        [`hand.${tag}`]: { rotate: rot },
      };
    };
    /** The wrist that puts the fist center at `point` for a hand frame (right-arm coordinates). */
    const wristFor = (point: V3, d: V3, hint: V3): V3 => {
      const fr = frameOf(d, hint);
      const q = basis(fr.a, fr.n).multiply(qRestInv);
      return arr(vec(point).sub(off.clone().applyQuaternion(q)));
    };
    return { pose, wristFor };
  };
  const R = arm(-1);
  const L = arm(1);
  // Goals are in right-arm coordinates; the left arm mirrors them inside `pose`.
  const both = (goal: Goal, f: number): Pose => ({ ...R.pose(goal, f), ...L.pose(goal, f) });

  // The arm goal of each gesture; right-arm coordinates (x < 0), meters.
  const dFor = (deg: number): V3 => [-Math.sin(deg * RAD), Math.cos(deg * RAD), 0];
  const SX = SHOULDER[0];
  const SY = SHOULDER[1];
  const REACH = Math.hypot(ELBOW[0] - SHOULDER[0], ELBOW[1] - SHOULDER[1], ELBOW[2] - SHOULDER[2]) + Math.hypot(WRIST[0] - ELBOW[0], WRIST[1] - ELBOW[1], WRIST[2] - ELBOW[2]);

  const DEFAULT_DURATION = 2;
  const clip = (name: string, pose: (p: number) => Pose) =>
    k.animation(name, { duration: DEFAULT_DURATION, loop: true, pose: (_t, p) => pose(p) });

  // ------------------------------------------------------------------ idle: a soft breath, arms at the sides
  clip('gesture-idle', (p) => ({
    hips: { move: [0, -0.003 * bump(p), 0] },
    chest: { rotate: [-2.5 * bump(p), 0, 0] },
    head: { rotate: [1.5 * bump(p), 0, 0] },
    'upperarm.L': { rotate: [1 * bump(p), 0, 2 * bump(p)] },
    'upperarm.R': { rotate: [1 * bump(p), 0, -2 * bump(p)] },
  }));

  // ------------------------------------------------------------------ clap: apart at 0.5 s, together at 1.0 s
  const CLAP_Y = 0.3;
  const clapGoal = (half: number): Goal => {
    const d: V3 = [0, -0.1, 1];
    const hint: V3 = [0, 1, 0];
    return { wrist: R.wristFor([-half, CLAP_Y, 0.12], d, hint), d, hint, pole: [-0.2, 0.2, 0.0] };
  };
  clip('gesture-clap', (p) => {
    const f = keys(p, [[0, 0], [0.25, 1], [0.75, 1], [1, 0]] as const);
    const half = keys(p, [[0.25, 0.07], [0.5, 0.03], [0.75, 0.07]] as const);
    // A small bounce: the torso dips and leans in as the hands meet (1.0 s), and rises as they part.
    const beat = keys(p, [[0.25, 0], [0.5, 1], [0.75, 0]] as const);
    return {
      ...both(clapGoal(half), f),
      hips: { move: [0, -0.024 * beat, 0] },
      chest: { rotate: [-8 * beat, 0, 0] },
      head: { rotate: [4 * beat, 0, 0] },
    };
  });

  // ------------------------------------------------------------------ wave: the right arm up, the hand swung to both sides
  // The arm stays 45 degrees from vertical (as high as the 0.138 m reach allows beside the jaw); the hand turns 25 degrees about the wrist, outward (0.5 s) and inward (1.0 s).
  const WAVE_ARM = 45;
  const waveWrist: V3 = [-(SX + REACH * 0.985 * Math.sin(WAVE_ARM * RAD)), SY + REACH * 0.985 * Math.cos(WAVE_ARM * RAD), 0.02];
  clip('gesture-wave', (p) => {
    const f = keys(p, [[0, 0], [0.15, 1], [0.85, 1], [1, 0]] as const);
    const swing = keys(p, [[0.15, 0], [0.25, 25], [0.5, -25], [0.75, 25], [0.85, 0]] as const);
    const goal: Goal = { wrist: waveWrist, d: dFor(WAVE_ARM + swing), hint: [0, 0, 1], pole: [-0.25, 0.3, 0.0] };
    return {
      ...R.pose(goal, f),
      head: { rotate: [0, 0, -3 * f] },
    };
  });

  // ------------------------------------------------------------------ nod: 12 degrees up at 0.5 s, 15 degrees down at 1.0 s
  clip('gesture-nod', (p) => {
    const tilt = keys(p, [[0, 0], [0.25, -12], [0.5, 15], [0.8, 0], [1, 0]] as const);
    return { head: { rotate: [tilt, 0, 0] } };
  });

  // ------------------------------------------------------------------ point to self: the right hand on the chest, the elbow out
  const selfD: V3 = [0.95, -0.1, 0.3];
  const selfHint: V3 = [0, 0, -1];
  const selfGoal: Goal = { wrist: R.wristFor([-0.055, 0.315, 0.15], selfD, selfHint), d: selfD, hint: selfHint, pole: [-0.5, 0.35, -0.2] };
  clip('gesture-point-to-self', (p) => {
    const f = keys(p, [[0, 0], [0.4, 1], [0.6, 1], [1, 0]] as const);
    return { ...R.pose(selfGoal, f), head: { rotate: [2 * f, 0, 0] } };
  });

  // ------------------------------------------------------------------ point forward: the right arm straight forward at shoulder height
  const fwdLen = REACH * 0.985;
  // The arm points 30 degrees out to the right (-X) and 10 degrees up, so the whole arm reads from the front.
  const aim = (v: V3): V3 => {
    const c = Math.cos(10 * RAD);
    const n = Math.sin(10 * RAD);
    const py = v[1] * c + v[2] * n;
    const pz = v[2] * c - v[1] * n;
    const cy = Math.cos(30 * RAD);
    const sy = Math.sin(30 * RAD);
    return [v[0] * cy - pz * sy, py, v[0] * sy + pz * cy];
  };
  const fwdDir = aim([0, 0, 1]);
  const fwdGoal: Goal = {
    wrist: [-SX + fwdLen * fwdDir[0], SY + fwdLen * fwdDir[1], fwdLen * fwdDir[2]],
    d: aim([0, -0.82, 0.57]),
    hint: aim([0, 0.57, 0.82]),
    pole: [-0.3, 0.2, 0.0],
  };
  clip('gesture-point-forward', (p) => {
    const f = keys(p, [[0, 0], [0.4, 1], [0.6, 1], [1, 0]] as const);
    return R.pose(fwdGoal, f);
  });

  // ------------------------------------------------------------------ hands out: both arms 45 degrees below horizontal, palms up
  const outLen = REACH * 0.985;
  const outGoal: Goal = {
    wrist: [-(SX + outLen * Math.SQRT1_2), SY - outLen * Math.SQRT1_2, 0.02],
    d: [-Math.SQRT1_2, -Math.SQRT1_2, 0],
    hint: [0, 0, 1],
    pole: [-0.3, 0.1, -0.1],
  };
  clip('gesture-hands-out', (p) => {
    const f = keys(p, [[0, 0], [0.4, 1], [0.6, 1], [1, 0]] as const);
    return both(outGoal, f);
  });

}
