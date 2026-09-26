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
