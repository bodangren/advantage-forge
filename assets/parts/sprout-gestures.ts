import * as THREE from 'three';
import { motion, sdf } from '../../src/index.js';
import type { AssetContext, Pose } from '../../src/index.js';
import { AGE5 } from './humanoid-kind.js';
import type { HumanoidShape } from './humanoid-kind.js';

/**
 * Sprout gestures: the nine week 1 gesture clips of Chibi Sprouts on the humanoid kind's skeleton
 * (`gesture-idle`, `-clap`, `-wave`, `-nod`, `-touch-nose`, `-touch-neck`, `-point-to-self`,
 * `-point-forward`, `-hands-out`).
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
  const { SHOULDER, ELBOW, WRIST, GRIP, HIP, KNEE, ANKLE } = h.joints;
  const { keys, bump, reach, orient, wave } = motion;

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

  // ------------------------------------------------------------------ touch nose: the right mitten's narrow edge at the nose, a happy laugh
  // The horizontal mitten stays beside the nose and above the mouth. A whole-body bounce keeps the contact.
  const noseDirection = unit([0.95, 0.1, 0.3]);
  const noseD = unit([-0.180690382, 0.3215428253, 0.9294951304]);
  const noseHint: V3 = [0.9835336445, 0.0556668679, 0.1719382735];
  const NOSE_AT: V3 = [-0.1470573952, 0.494, 0.132];
  const noseGrip: V3 = [
    NOSE_AT[0] - noseDirection[0] * FINGER_LENGTH,
    NOSE_AT[1] - noseDirection[1] * FINGER_LENGTH,
    NOSE_AT[2] - noseDirection[2] * FINGER_LENGTH,
  ];
  const noseGoal: Goal = { wrist: R.wristFor(noseGrip, noseD, noseHint), d: noseD, hint: noseHint, pole: [-0.45, 0.3, -0.08] };
  clip('gesture-touch-nose', (p) => {
    const f = ks(p, [[0, 0], [0.65, 1], [1.35, 1], [2, 0]]);
    const laugh = ks(p, [[0, 0], [0.65, 0], [0.82, 1], [1, 0], [1.18, 1], [1.35, 0], [2, 0]]);
    return {
      ...R.pose(noseGoal, f),
      hips: { move: [0, -0.006 * laugh, 0] },
      head: { rotate: [8 * f, -45 * f, 0], move: [0, -0.045 * f, 0] },
    };
  });

  // ------------------------------------------------------------------ touch neck: chin lifted, both fists at the front of the neck
  const NECK_AT: V3 = [-0.058, 0.452, 0.063];
  const neckD: V3 = [0.5, 0.75, 0.25];
  const neckHint: V3 = [0, 0, 1];
  const neckGoal: Goal = { wrist: R.wristFor(NECK_AT, neckD, neckHint), d: neckD, hint: neckHint, pole: [-0.4, 0.25, -0.1] };
  clip('gesture-touch-neck', (p) => {
    const f = ks(p, [[0, 0], [0.65, 1], [1.35, 1], [2, 0]]);
    return {
      ...both(neckGoal, f),
      chest: { rotate: [-3 * f, 0, 0] },
      head: { rotate: [-16 * f, 0, 0] },
    };
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

  // ================================================================== week 2 to 6 gestures (13 clips)
  // Times below are seconds (the clip is 2 s); `ks` turns the phase into seconds and eases through the keys.
  const ks = (p: number, list: readonly (readonly [number, number])[], mode: 'smooth' | 'linear' = 'smooth') => keys(p * DEFAULT_DURATION, list, mode);
  const HIPS_AT = AGE5.bones.hips;

  // Arms from a fist-center point: `fist` (right-arm coordinates) is where the fist center should be.
  const fistGoal = (point: V3, d: V3, hint: V3, pole: V3): Goal => ({ wrist: R.wristFor(point, d, hint), d, hint, pole });
  const fistGoalL = (point: V3, d: V3, hint: V3, pole: V3): Goal => ({ wrist: L.wristFor(point, d, hint), d, hint, pole });
  /** An arm raised `deg` degrees from vertical (outward), as long as the reach allows. */
  const armUpGoal = (deg: number, hint: V3, pole: V3, z = 0.0): Goal => {
    const len = REACH * 0.985;
    return { wrist: [-(SX + len * Math.sin(deg * RAD)), SY + len * Math.cos(deg * RAD), z], d: dFor(deg), hint, pole };
  };

  // Legs from foot targets: each foot is a thigh swing `a` and a knee bend `b` (degrees) from the rest leg, a
  // `ride` share of the hips' rise (a foot in the air rides with the hips), and a sole pitch (+ is toe down).
  interface Foot {
    readonly a?: number;
    readonly b?: number;
    readonly ride?: number;
    readonly pitch?: number;
    readonly lift?: number;
  }
  const THIGH = Math.hypot(HIP[1] - KNEE[1], HIP[2] - KNEE[2]);
  const SHIN = Math.hypot(KNEE[1] - ANKLE[1], KNEE[2] - ANKLE[2]);
  const LEG_LENGTH = HIP[1] - ANKLE[1];
  /** The ankle of a leg swung forward by `a` with the knee bent by `b`, relative to the hip (y, z). */
  const legFk = (a: number, b: number): { y: number; z: number } => ({
    y: -(THIGH * Math.cos(a * RAD) + SHIN * Math.cos((a - b) * RAD)),
    z: THIGH * Math.sin(a * RAD) + SHIN * Math.sin((a - b) * RAD),
  });
  const FK0 = legFk(0, 0);
  const legsPose = (hips: { move?: V3; rotate?: V3 }, left: Foot = {}, right: Foot = {}): Pose => {
    const move: V3 = hips.move ?? [0, 0, 0];
    const rotate: V3 = hips.rotate ?? [0, 0, 0];
    const out: Record<string, { rotate: V3 }> = {};
    for (const [side, sx, f] of [['L', 1, left], ['R', -1, right]] as const) {
      const ride = f.ride ?? 0;
      const q = legFk(f.a ?? 0, f.b ?? 0);
      const ankle: V3 = [sx * ANKLE[0] + ride * move[0], ANKLE[1] + ride * move[1] + q.y - FK0.y + (f.lift ?? 0), ANKLE[2] + ride * move[2] + q.z - FK0.z];
      const r = motion.legTo(side, { hip: HIP, knee: KNEE, ankle: ANKLE }, ankle, { hips: { at: HIPS_AT, move, rotate }, pitch: f.pitch ?? 0 });
      out[`leg.${side}`] = { rotate: r.leg };
      out[`shin.${side}`] = { rotate: r.shin };
      out[`foot.${side}`] = { rotate: r.foot };
    }
    return { hips: { move, rotate }, ...out };
  };
  /** The thigh swing that lifts the foot by `rise` meters with a knee bend of `b` degrees. */
  const swingFor = (rise: number, b: number): number => {
    let lo = 0;
    let hi = 80;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (legFk(mid, b).y - FK0.y >= rise) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  };
  const arms = (l: V3, r: V3, fl: V3 = [0, 0, 0], fr: V3 = [0, 0, 0]): Pose => ({
    'upperarm.L': { rotate: l },
    'upperarm.R': { rotate: r },
    'forearm.L': { rotate: fl },
    'forearm.R': { rotate: fr },
  });

  // ------------------------------------------------------------------ point-up: one straight arm up and out, the finger up
  // The fist cannot go above the head (the reach is 0.138 m), so the arm is a straight line 50 degrees out from vertical, clear of the head outline.
  const UP_DEG = 50;
  const upGoal = armUpGoal(UP_DEG, [0, 1, 0], [-0.4, 0.2, -0.1]);
  clip('gesture-point-up', (p) => {
    const f = ks(p, [[0, 0], [0.3, 0], [0.8, 1], [1.3, 1], [2, 0]]);
    return { ...R.pose({ ...upGoal, d: dFor(UP_DEG), hint: [0, 1, 0] }, f), head: { rotate: [-12 * f, 0, 12 * f] } };
  });

  // ------------------------------------------------------------------ reach: both straight arms forward and up, a lean and a tiptoe
  const REACH_UP = 15;
  const REACH_OUT = 10;
  const reachDir: V3 = [-Math.sin(REACH_OUT * RAD) * Math.cos(REACH_UP * RAD), Math.sin(REACH_UP * RAD), Math.cos(REACH_OUT * RAD) * Math.cos(REACH_UP * RAD)];
  const reachGoal: Goal = {
    wrist: [-SX + REACH * 0.985 * reachDir[0], SY + REACH * 0.985 * reachDir[1], REACH * 0.985 * reachDir[2]],
    d: reachDir,
    hint: [0, 1, 0],
    pole: [-0.3, 0.2, 0.0],
  };
  clip('gesture-reach', (p) => {
    const f = ks(p, [[0, 0], [0.7, 1], [1.3, 1], [2, 0]]);
    const toe = ks(p, [[0, 0], [0.7, 1], [1.3, 1], [2, 0]]);
    const lean = ks(p, [[0, 0], [0.6, 16], [1.0, 18], [1.4, 16], [2, 0]]);
    const foot: Foot = { pitch: 7 * toe, lift: 0.015 * toe };
    return {
      ...both(reachGoal, f),
      ...legsPose({ move: [0, 0.015 * toe, 0] }, foot, foot),
      spine: { rotate: [lean, 0, 0] },
      head: { rotate: [-lean + 5 * f, 0, 0] },
    };
  });

  // ------------------------------------------------------------------ count-fingers: the right fist at the jaw, the left fist on the hip, the whole body bobs with each count
  const COUNT_AT: V3 = [-0.16, 0.43, 0.13];
  const HIP_FIST: V3 = [-0.14, 0.21, 0.03];
  const hipGoal = fistGoal(HIP_FIST, [0.5, -1, 0.2], [0, 0, 1], [-0.55, 0.28, -0.12]);
  clip('gesture-count-fingers', (p) => {
    const f = ks(p, [[0, 0], [0.3, 1], [1.45, 1], [1.9, 0], [2, 0]]);
    const pump = ks(p, [[0, 0], [0.35, 0], [0.5, 0.04], [0.68, 0], [0.85, 0.04], [1.02, 0], [1.2, 0.04], [1.38, 0], [2, 0]]);
    const b = pump / 0.04;
    const goal = fistGoal([COUNT_AT[0], COUNT_AT[1] + pump, COUNT_AT[2]], [0.2, 1, 0], [0, 0, 1], [-0.45, 0.3, -0.05]);
    return {
      ...R.pose(goal, f),
      ...L.pose(hipGoal, f),
      ...legsPose({ move: [0, -0.012 * b, 0] }),
      head: { rotate: [8 * b, 0, 0] },
    };
  });

  // ------------------------------------------------------------------ sway: hips and spine roll to +X, the head counter-rolls
  clip('gesture-sway', (p) => {
    const s = ks(p, [[0, 0], [0.5, -1], [1.0, 1], [1.5, -1], [2, 0]]);
    const roll = 4 * s;
    const swing = 4 * wave(p, 2);
    return {
      ...legsPose({ rotate: [0, 0, -roll] }),
      spine: { rotate: [0, 0, -roll] },
      head: { rotate: [0, 0, 4 * s] },
      ...arms([swing, 0, 0], [-swing, 0, 0]),
    };
  });

  // ------------------------------------------------------------------ look: both arms out like balancing, the body turns left and right, the head leads
  const lookGoal = armUpGoal(110, [0, 0, 1], [-0.3, 0.1, -0.1], 0.0);
  clip('gesture-look', (p) => {
    const f = ks(p, [[0, 0], [0.4, 1], [1.6, 1], [2, 0]]);
    const yaw = ks(p, [[0, 0], [0.5, 30], [1.2, -30], [1.8, 0], [2, 0]]);
    const lean = ks(p, [[0, 0], [0.3, 5], [1.5, 5], [2, 0]]);
    return { ...both(lookGoal, f), spine: { rotate: [lean, yaw, 0] }, head: { rotate: [-0.5 * lean, yaw / 3, 0] } };
  });

  // ------------------------------------------------------------------ hop: two arcs (take-off 0.3 and 1.2 s, apex 0.5 and 1.4 s), the knees bend on the landing
  clip('gesture-hop', (p) => {
    const t = p * DEFAULT_DURATION;
    const arc = (t0: number) => {
      const u = (t - t0) / 0.4;
      return u > 0 && u < 1 ? 4 * u * (1 - u) : 0;
    };
    const air = Math.max(arc(0.3), arc(1.2));
    const flying = (t > 0.3 && t < 0.7) || (t > 1.2 && t < 1.6) ? 1 : 0;
    const pre = motion.legDrop(LEG_LENGTH, 18);
    const land = motion.legDrop(LEG_LENGTH, 25);
    const crouch = ks(p, [[0, 0], [0.15, -pre], [0.3, 0], [0.7, 0], [0.8, -land], [0.95, 0], [1.05, -pre], [1.2, 0], [1.6, 0], [1.7, -land], [1.85, 0], [2, 0]]);
    const tuck: Foot = { a: 6 * air, b: 25 * air, ride: flying, pitch: 15 * air };
    const swing = ks(p, [[0, 0], [0.15, 10], [0.3, -20], [0.5, -60], [0.7, -30], [0.85, 5], [1.05, 10], [1.2, -20], [1.4, -60], [1.6, -30], [1.8, 5], [2, 0]]);
    return {
      ...legsPose({ move: [0, 0.06 * air + crouch, 0] }, tuck, tuck),
      ...arms([swing, 0, 8 * air], [swing, 0, -8 * air], [-0.25 * Math.abs(swing), 0, 0], [-0.25 * Math.abs(swing), 0, 0]),
      head: { rotate: [-4 * air, 0, 0] },
    };
  });

  // ------------------------------------------------------------------ stretch-up: both straight arms in a wide V, a tiptoe, the head back
  const VEE_DEG = 55;
  const veeGoal = armUpGoal(VEE_DEG, [0, 1, 0], [-0.4, 0.2, -0.1]);
  const TOE_PITCH = 7; // degrees toe down: the heel rises 0.015 m over the 0.12 m foot
  clip('gesture-stretch-up', (p) => {
    const f = ks(p, [[0, 0], [0.8, 1], [1.3, 1], [1.9, 0], [2, 0]]);
    const toe = ks(p, [[0, 0], [0.6, 1], [1.4, 1], [1.9, 0], [2, 0]]);
    const foot: Foot = { pitch: TOE_PITCH * toe, lift: 0.015 * toe };
    return { ...both({ ...veeGoal, d: dFor(VEE_DEG), hint: [0, 1, 0] }, f), ...legsPose({ move: [0, 0.015 * toe, 0] }, foot, foot), head: { rotate: [-10 * f, 0, 0] } };
  });

  // ------------------------------------------------------------------ eat: the head lowers to meet the fist at the chin, twice, a chew nod after each
  const EAT_AT: V3 = [-0.06, 0.45, 0.16];
  const eatGoal = fistGoal(EAT_AT, [0.5, 0.8, 0.2], [0, 0.3, 1], [-0.5, 0.3, -0.1]);
  clip('gesture-eat', (p) => {
    const f = ks(p, [[0, 0], [0.5, 1], [0.85, 0.3], [1.2, 1], [1.45, 1], [2, 0]]);
    const down = ks(p, [[0, 0], [0.5, 15], [0.85, 4], [1.2, 15], [1.45, 15], [2, 0]]);
    const chew = ks(p, [[0, 0], [0.5, 0], [0.58, 5], [0.66, 0], [0.74, 5], [0.82, 0], [1.2, 0], [1.28, 5], [1.36, 0], [1.44, 5], [1.52, 0], [2, 0]]);
    return { ...R.pose(eatGoal, f), head: { rotate: [down + chew, 0, 0] } };
  });

  // ------------------------------------------------------------------ hug-self: the arms cross the chest, a small squeeze rock
  const hugR = fistGoal([0.035, 0.33, 0.165], [0.9, 0.3, 0.2], [0, 1, 0.4], [-0.3, 0.0, 0.1]);
  const hugL = fistGoalL([0.035, 0.3, 0.14], [0.9, 0.3, 0.2], [0, 1, 0.4], [-0.3, 0.0, 0.1]);
  clip('gesture-hug-self', (p) => {
    const f = ks(p, [[0, 0], [0.8, 1], [1.3, 1], [1.9, 0], [2, 0]]);
    const rock = ks(p, [[0, 0], [1.0, 0], [1.1, -3], [1.2, 3], [1.3, 0], [2, 0]]);
    return { ...R.pose(hugR, f), ...L.pose(hugL, f), spine: { rotate: [0, 0, rock] }, head: { rotate: [0, 0, 6 * f] } };
  });

  // ------------------------------------------------------------------ bow: the spine bends over, the arms hang straight down
  clip('gesture-bow', (p) => {
    const b = ks(p, [[0, 0], [0.4, 0], [1.0, 1], [1.3, 1], [2, 0]]);
    return {
      ...legsPose({ move: [0, 0, -0.03 * b] }),
      spine: { rotate: [35 * b, 0, 0] },
      head: { rotate: [15 * b, 0, 0] },
      ...arms([-35 * b, 0, 0], [-35 * b, 0, 0]),
    };
  });

  // ------------------------------------------------------------------ listen: the head tilts 25 degrees into the fist at the cheek, the spine rolls, the left arm out
  const listenGoal = fistGoal([-0.2, 0.4, 0.05], [0.3, 1, 0], [0, 0, 1], [-0.45, 0.2, -0.1]);
  clip('gesture-listen', (p) => {
    const f = ks(p, [[0, 0], [0.8, 1], [1.4, 1], [2, 0]]);
    const tilt = ks(p, [[0, 0], [0.4, 0], [0.8, 1], [1.4, 1], [2, 0]]);
    return {
      ...R.pose(listenGoal, f),
      'upperarm.L': { rotate: [0, 0, 30 * f] },
      spine: { rotate: [0, 0, 8 * tilt] },
      head: { rotate: [0, 0, 25 * tilt] },
    };
  });

  // ------------------------------------------------------------------ stamp: the right foot lifts 0.08 m (0.25 s) and drops fast (0.1 s), twice, the hips drop on each hit
  clip('gesture-stamp', (p) => {
    const lift = ks(p, [[0, 0], [0.05, 0], [0.3, 1], [0.4, 0], [0.85, 0], [1.1, 1], [1.2, 0], [2, 0]]);
    const hit = ks(p, [[0, 0], [0.4, 0], [0.45, 1], [0.6, 0], [1.2, 0], [1.25, 1], [1.4, 0], [2, 0]]);
    const out = ks(p, [[0, 0], [0.2, 1], [1.3, 1], [1.7, 0], [2, 0]]);
    const a = swingFor(0.05, 35);
    const foot: Foot = { a: a * lift, b: 35 * lift, ride: lift, pitch: 4 * lift };
    return {
      ...legsPose({ move: [0.008 * lift, -0.015 * hit, 0] }, {}, foot),
      ...arms([0, 0, 20 * out], [0, 0, -20 * out]),
    };
  });

  // ------------------------------------------------------------------ march: on the spot, four high knees, the opposite arm swings 45 degrees
  clip('gesture-march', (p) => {
    const lUp = ks(p, [[0, 0], [0.25, 1], [0.5, 0], [0.75, 0], [1.25, 1], [1.5, 0], [2, 0]]);
    const rUp = ks(p, [[0, 0], [0.5, 0], [0.75, 1], [1.0, 0], [1.5, 0], [1.75, 1], [2, 0]]);
    const s = lUp - rUp; // +1: the left knee is up and the right arm is forward
    const bob = ks(p, [[0, 0], [0.12, -0.012], [0.25, 0], [0.37, -0.012], [0.5, 0], [0.62, -0.012], [0.75, 0], [0.87, -0.012], [1.0, 0], [1.12, -0.012], [1.25, 0], [1.37, -0.012], [1.5, 0], [1.62, -0.012], [1.75, 0], [1.87, -0.012], [2, 0]]);
    const step = (u: number): Foot => ({ a: 40 * u, b: 35 * u, ride: u, pitch: 6 * u });
    return {
      ...legsPose({ move: [0, bob, 0] }, step(lUp), step(rUp)),
      ...arms([45 * s, 0, 0], [-45 * s, 0, 0], [-20 * Math.max(0, -s), 0, 0], [-20 * Math.max(0, s), 0, 0]),
    };
  });

  // ------------------------------------------------------------------ turn: one spin on the spot like a top, the arms out, the head leads the spin
  // The hips turn the whole body (no leg targets, so the feet turn with the hips); a small dip at the start and the end.
  clip('gesture-turn', (p) => {
    const f = ks(p, [[0, 0], [0.3, 1], [1.7, 1], [2, 0]]);
    const yaw = ks(p, [[0, 0], [0.25, 0], [1.65, 360], [2, 360]]);
    const lead = ks(p, [[0, 0], [0.25, 0], [0.5, 25], [1.4, 25], [1.65, 0], [2, 0]]);
    const dip = ks(p, [[0, 0], [0.25, -0.012], [0.5, 0], [1.4, 0], [1.65, -0.012], [1.9, 0], [2, 0]]);
    return {
      hips: { move: [0, dip, 0], rotate: [0, yaw, 0] },
      head: { rotate: [0, lead, -4 * f] },
      ...arms([0, 0, 60 * f], [0, 0, -60 * f], [0, 0, 10 * f], [0, 0, -10 * f]),
    };
  });

  // ------------------------------------------------------------------ picture poses (Workbooks, 2026-10-24): one held pose each for the
  // 64 px song-line pictures, a square crop from the head to below the belt. Not for the videos: the beat frames above stay.
  // picture-march: the left thigh past level (direct bone angles; the short chibi thigh must rise beside the belt to show), the right arm forward and out, the left arm back.
  clip('picture-march', () => ({
    ...legsPose({ move: [0, -0.006, 0] }),
    'leg.L': { rotate: [-100, 0, 0] },
    'shin.L': { rotate: [95, 0, 0] },
    ...arms([35, 0, 5], [-80, 0, -45], [0, 0, 0], [-10, 0, 0]),
    head: { rotate: [-4, 0, 0] },
  }));
  // picture-stamp: the right thigh level, both fists down by the sides, the hips dropped, the head down.
  clip('picture-stamp', () => ({
    ...legsPose({ move: [0.006, -0.012, 0] }),
    'leg.R': { rotate: [-95, 0, 0] },
    'shin.R': { rotate: [95, 0, 0] },
    ...arms([0, 0, 12], [0, 0, -12], [-15, 0, 0], [-15, 0, 0]),
    spine: { rotate: [8, 0, 0] },
    head: { rotate: [10, 0, 0] },
  }));
  // picture-sway: the body leans about 15 degrees to +X with both arms up in a V.
  clip('picture-sway', () => ({
    ...both({ ...veeGoal, d: dFor(VEE_DEG), hint: [0, 1, 0] }, 1),
    ...legsPose({ rotate: [0, 0, -12] }),
    spine: { rotate: [0, 0, -12] },
    head: { rotate: [0, 0, 0] },
  }));
}
