import { describe, expect, it } from 'vitest';

import {
  compileRigidFramePlan,
  sampleRigidClip,
} from '../../src/animation/rigid-animation.js';

const binding = {
  assetRevisionId: `revision.${'a'.repeat(64)}` as const,
  morphologyRevisionId: `morphology.${'b'.repeat(64)}` as const,
  rigSignature: `rig.${'c'.repeat(64)}` as const,
  equipmentSignature: `equipment.${'d'.repeat(64)}` as const,
};

const rig = {
  contractId: 'forge-rig-definition/v1' as const,
  rigId: 'rig.guard-biped',
  ...binding,
  rootJointId: 'root',
  joints: [
    {
      id: 'root',
      partId: 'body.root',
      axis: 'y' as const,
      minimumDegrees: 0,
      maximumDegrees: 0,
      restDegrees: 0,
    },
    {
      id: 'shoulder.left',
      parentJointId: 'root',
      partId: 'upper-arm.left',
      axis: 'z' as const,
      minimumDegrees: -80,
      maximumDegrees: 80,
      restDegrees: 0,
      mirrorJointId: 'shoulder.right',
    },
    {
      id: 'shoulder.right',
      parentJointId: 'root',
      partId: 'upper-arm.right',
      axis: 'z' as const,
      minimumDegrees: -80,
      maximumDegrees: 80,
      restDegrees: 0,
      mirrorJointId: 'shoulder.left',
    },
  ],
};

const pose = (hashCharacter: string, angle: number) => ({
  contractId: 'forge-pose-snapshot/v1' as const,
  poseSnapshotId: `pose.${hashCharacter.repeat(64)}`,
  ...binding,
  channels: [
    { jointId: 'shoulder.left', valueDegrees: angle },
    { jointId: 'shoulder.right', valueDegrees: -angle },
  ],
  rootMotion: {
    offset: [angle / 100, 0, 0] as [number, number, number],
    yawDegrees: 0,
  },
});

const startPose = pose('1', -20);
const endPose = pose('2', 20);
const clip = {
  contractId: 'forge-clip-document/v1' as const,
  clipId: `clip.${'3'.repeat(64)}` as const,
  action: 'walk.forward',
  ...binding,
  durationMs: 400,
  interpolation: 'linear' as const,
  rootAnchorPolicy: 'in_place' as const,
  loop: { mode: 'loop' as const, startMs: 0, endMs: 400 },
  keyframes: [
    {
      id: 'keyframe.walk.start',
      timeMs: 0,
      poseSnapshotId: startPose.poseSnapshotId,
    },
    {
      id: 'keyframe.walk.end',
      timeMs: 400,
      poseSnapshotId: endPose.poseSnapshotId,
    },
  ],
};

describe('rigid animation execution', () => {
  it('creates deterministic warm-session frame plans with temporal samples per direction', async () => {
    const request = {
      clip,
      directions: ['S', 'E'] as ('S' | 'E')[],
      framesPerSecond: 10,
      seed: 42,
    };
    const first = await compileRigidFramePlan(request);
    const second = await compileRigidFramePlan(request);

    expect(first).toEqual(second);
    expect(first.frames).toHaveLength(8);
    expect(first.frames.map((frame) => frame.key.sampleTimeMs)).toEqual([
      0, 100, 200, 300, 0, 100, 200, 300,
    ]);
    expect(new Set(first.frames.map((frame) => frame.id)).size).toBe(8);
    expect(first.frames.every((frame) => frame.output.transparent)).toBe(true);
  });

  it('interpolates independent animation poses instead of treating camera directions as states', () => {
    const sampled = sampleRigidClip(rig, [startPose, endPose], clip, 200);

    expect(sampled.interpolationProgress).toBe(0.5);
    expect(sampled.channels).toEqual([
      { jointId: 'root', valueDegrees: 0 },
      { jointId: 'shoulder.left', valueDegrees: 0 },
      { jointId: 'shoulder.right', valueDegrees: 0 },
    ]);
    expect(sampled.rootMotion.offset[0]).toBe(0);
  });

  it('rejects duplicate directions and stale pose bindings before capture', async () => {
    await expect(
      compileRigidFramePlan({
        clip,
        directions: ['S', 'S'],
        framesPerSecond: 10,
        seed: 42,
      }),
    ).rejects.toThrow(/directions must be unique/i);

    const stalePose = {
      ...endPose,
      equipmentSignature: `equipment.${'e'.repeat(64)}` as const,
    };
    expect(() =>
      sampleRigidClip(rig, [startPose, stalePose], clip, 200),
    ).toThrow(/share asset, morphology, rig, and equipment bindings/i);
  });
});
