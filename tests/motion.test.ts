import { describe, expect, it } from 'vitest';
import { edgeUp, follow, keys, legDrop, orient, plant, reach } from '../src/motion.js';
import type { Vec3 } from '../src/sdf/core.js';

const close = (a: Vec3, b: Vec3, digits = 4) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, digits));
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// A right arm: out from the shoulder, the forearm pointing forward.
const ARM = { root: [-0.13, 0.385, 0] as Vec3, mid: [-0.2, 0.33, 0] as Vec3, end: [-0.215, 0.29, 0.1] as Vec3 };

describe('posing by targets', () => {
  it('reach puts the wrist on the target and bends the elbow toward the pole', () => {
    const target: Vec3 = [-0.2, 0.56, 0.02];
    const pole: Vec3 = [-0.5, 0.4, -0.2];
    const { upper, lower } = reach(ARM, target, pole);
    close(follow([ARM.root, ARM.mid], [upper, lower], ARM.end), target);
    const elbow = follow([ARM.root], [upper], ARM.mid);
    // The elbow is on the pole's side of the shoulder-to-target line.
    const line = unit(sub(target, ARM.root));
    const off = (p: Vec3) => {
      const d = sub(p, ARM.root);
      const k = d[0] * line[0] + d[1] * line[1] + d[2] * line[2];
      return sub(d, [line[0] * k, line[1] * k, line[2] * k]);
    };
    const e = off(elbow);
    const q = off(pole);
    expect(e[0] * q[0] + e[1] * q[1] + e[2] * q[2]).toBeGreaterThan(0);
  });

  it('reach pulls an unreachable target in along the line from the root', () => {
    const { upper, lower } = reach(ARM, [-1, 0.385, 0], [0, 0, -1]);
    const wrist = follow([ARM.root, ARM.mid], [upper, lower], ARM.end);
    expect(wrist[1]).toBeCloseTo(0.385, 3);
    expect(wrist[0]).toBeLessThan(-0.3);
  });

  it('orient turns a hand so its rest directions point where wanted', () => {
    const arm = reach(ARM, [-0.25, 0.45, 0.12], [-0.5, 0.3, -0.3]);
    const want = { dir: unit([-0.4, 0.7, -0.6]), up: [0, 0, 1] as Vec3 };
    const rest = { dir: unit([0.8, -0.45, 0.4]), up: [0, 0, 1] as Vec3 };
    const hand = orient([arm.upper, arm.lower], rest, want);
    const chain = [ARM.root, ARM.mid, ARM.end];
    const rots = [arm.upper, arm.lower, hand];
    const tip = follow(chain, rots, [ARM.end[0] + rest.dir[0], ARM.end[1] + rest.dir[1], ARM.end[2] + rest.dir[2]]);
    const wrist = follow(chain, rots, ARM.end);
    close(sub(tip, wrist), want.dir);
  });

  it('edgeUp turns the flat across the swing and keeps it on the fallback side', () => {
    const swing = (p: number): Vec3 => [Math.cos(p * 3), Math.sin(p * 3), 0];
    close(edgeUp(swing, 0.5, [0, 0.2, 1]), [0, 0, 1]);
    close(edgeUp(swing, 0.5, [0, 0.2, -1]), [0, 0, -1]);
    // A blade that holds still keeps the fallback.
    close(edgeUp(() => [1, 0, 0], 0.5, [0, 1, 0]), [0, 1, 0]);
  });

  it('plant lifts the hips so a rolled foot does not dip below the ground', () => {
    const hip: Vec3 = [0.07, 0.2, 0];
    const ankle: Vec3 = [0.1, 0.07, 0];
    const sole: Vec3[] = [
      [0.1, 0, -0.04],
      [0.1, 0, 0.1],
    ];
    // A straight leg with a flat foot: nothing to do.
    expect(plant([{ joints: [hip, ankle], rotations: [[0, 0, 0], [0, 0, 0]], sole }])).toBeCloseTo(0);
    // A leg swung back with the toe rolled down: the hips must come up more than legDrop says.
    const leg: Vec3 = [26, 0, 0];
    const foot: Vec3 = [20, 0, 0];
    const dy = plant([{ joints: [hip, ankle], rotations: [leg, foot], sole }]);
    expect(dy).toBeGreaterThan(-legDrop(0.13, 26));
    const lowest = Math.min(...sole.map((p) => follow([hip, ankle], [leg, foot], p)[1]));
    expect(lowest + dy).toBeCloseTo(0);
  });

  it('keys hold, ease, and pass through their values', () => {
    const list = [
      [0.2, 0],
      [0.5, 10],
      [0.8, 4],
    ] as const;
    expect(keys(0, list)).toBe(0);
    expect(keys(1, list)).toBe(4);
    expect(keys(0.5, list)).toBeCloseTo(10);
    expect(keys(0.35, list)).toBeCloseTo(5);
    expect(keys(0.5, list, 'spline')).toBeCloseTo(10);
    // A spline keeps moving through a key where the smooth mode stops.
    const slopeSmooth = keys(0.51, list) - keys(0.49, list);
    const slopeSpline = keys(0.201, list, 'spline') - keys(0.2, list, 'spline');
    expect(Math.abs(slopeSmooth)).toBeLessThan(0.05);
    expect(slopeSpline).toBeGreaterThan(0);
    close(keys(0.65, [[0.5, [0, 0, 0]], [0.8, [2, 4, 6]]] as const), [1, 2, 3]);
  });
});
