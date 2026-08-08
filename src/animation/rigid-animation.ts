import { z } from 'zod';

import {
  ClipDocumentSchema,
  FramePlanSchema,
  PoseSnapshotSchema,
  RigDefinitionSchema,
  digestRigidAnimationValue,
  type ClipDocument,
  type FramePlan,
  type PoseSnapshot,
  type RigDefinition,
} from '../contracts/index.js';

const DirectionSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);

const FramePlanRequestSchema = z.strictObject({
  clip: ClipDocumentSchema,
  directions: z
    .array(DirectionSchema)
    .min(1)
    .max(8)
    .refine((directions) => new Set(directions).size === directions.length, {
      message: 'Frame-plan directions must be unique.',
    }),
  framesPerSecond: z.number().int().min(2).max(60),
  seed: z.number().int().min(0).max(2_147_483_647),
});

export type FramePlanRequest = z.input<typeof FramePlanRequestSchema>;

export interface SampledRigidPose {
  readonly clipId: string;
  readonly sampleTimeMs: number;
  readonly precedingPoseSnapshotId: string;
  readonly followingPoseSnapshotId: string;
  readonly interpolationProgress: number;
  readonly channels: readonly {
    readonly jointId: string;
    readonly valueDegrees: number;
  }[];
  readonly rootMotion: {
    readonly offset: readonly [number, number, number];
    readonly yawDegrees: number;
  };
}

function sameBinding(
  left: Pick<
    RigDefinition,
    | 'assetRevisionId'
    | 'morphologyRevisionId'
    | 'rigSignature'
    | 'equipmentSignature'
  >,
  right: Pick<
    RigDefinition,
    | 'assetRevisionId'
    | 'morphologyRevisionId'
    | 'rigSignature'
    | 'equipmentSignature'
  >,
): boolean {
  return (
    left.assetRevisionId === right.assetRevisionId &&
    left.morphologyRevisionId === right.morphologyRevisionId &&
    left.rigSignature === right.rigSignature &&
    left.equipmentSignature === right.equipmentSignature
  );
}

function sampleTimes(durationMs: number, framesPerSecond: number): number[] {
  if (durationMs < 2)
    throw new RangeError(
      'Temporal clips require at least two integer milliseconds so distinct source frames can be planned.',
    );
  const requestedCount = Math.ceil((durationMs * framesPerSecond) / 1_000);
  const frameCount = Math.min(durationMs, Math.max(2, requestedCount));
  return Array.from({ length: frameCount }, (_, index) =>
    Math.floor((index * durationMs) / frameCount),
  );
}

/**
 * Creates deterministic warm-session capture keys for every requested camera
 * direction. Directions select camera views; sample times provide animation.
 */
export async function compileRigidFramePlan(
  request: FramePlanRequest,
): Promise<FramePlan> {
  const parsed = FramePlanRequestSchema.parse(request);
  const times = sampleTimes(parsed.clip.durationMs, parsed.framesPerSecond);
  const framesWithoutIds = parsed.directions.flatMap((direction) =>
    times.map((sampleTimeMs) => ({ direction, sampleTimeMs })),
  );
  const identity = {
    clipId: parsed.clip.clipId,
    assetRevisionId: parsed.clip.assetRevisionId,
    morphologyRevisionId: parsed.clip.morphologyRevisionId,
    rigSignature: parsed.clip.rigSignature,
    equipmentSignature: parsed.clip.equipmentSignature,
    renderProfile: {
      id: 'fantasy.sprite.orthographic.v1' as const,
      version: '1.0.0' as const,
    },
    seed: parsed.seed,
    framesPerSecond: parsed.framesPerSecond,
    samples: framesWithoutIds,
  };
  const framePlanId =
    `frame-plan.${await digestRigidAnimationValue(identity)}` as const;
  const frames = await Promise.all(
    framesWithoutIds.map(async ({ direction, sampleTimeMs }, sequence) => {
      const key = {
        assetRevisionId: parsed.clip.assetRevisionId,
        morphologyRevisionId: parsed.clip.morphologyRevisionId,
        rigSignature: parsed.clip.rigSignature,
        equipmentSignature: parsed.clip.equipmentSignature,
        clipId: parsed.clip.clipId,
        sampleTimeMs,
        renderProfile: identity.renderProfile,
        direction,
        seed: parsed.seed,
      };
      return {
        id: `frame.${await digestRigidAnimationValue({ framePlanId, key })}`,
        sequence,
        key,
        output: {
          mediaType: 'image/png' as const,
          width: 128 as const,
          height: 128 as const,
          transparent: true as const,
        },
      };
    }),
  );

  return FramePlanSchema.parse({
    contractId: 'forge-frame-plan/v1',
    framePlanId,
    assetRevisionId: parsed.clip.assetRevisionId,
    morphologyRevisionId: parsed.clip.morphologyRevisionId,
    rigSignature: parsed.clip.rigSignature,
    equipmentSignature: parsed.clip.equipmentSignature,
    clipId: parsed.clip.clipId,
    durationMs: parsed.clip.durationMs,
    renderProfile: identity.renderProfile,
    seed: parsed.seed,
    frames,
  });
}

function rootMotion(pose: PoseSnapshot): {
  offset: [number, number, number];
  yawDegrees: number;
} {
  return pose.rootMotion ?? { offset: [0, 0, 0], yawDegrees: 0 };
}

function interpolate(left: number, right: number, progress: number): number {
  return left + (right - left) * progress;
}

/** Resolves a sparse rigid pose at an exact clip time for preview or capture. */
export function sampleRigidClip(
  rigInput: RigDefinition,
  poseInputs: readonly PoseSnapshot[],
  clipInput: ClipDocument,
  sampleTimeMs: number,
): SampledRigidPose {
  const rig = RigDefinitionSchema.parse(rigInput);
  const poses = poseInputs.map((pose) => PoseSnapshotSchema.parse(pose));
  const clip = ClipDocumentSchema.parse(clipInput);
  if (
    !Number.isInteger(sampleTimeMs) ||
    sampleTimeMs < 0 ||
    sampleTimeMs > clip.durationMs
  )
    throw new RangeError(
      'Sample time must be an integer inside the clip duration.',
    );
  if (!sameBinding(rig, clip) || poses.some((pose) => !sameBinding(rig, pose)))
    throw new Error(
      'Rig, poses, and clip must share asset, morphology, rig, and equipment bindings.',
    );

  const poseById = new Map(poses.map((pose) => [pose.poseSnapshotId, pose]));
  const rightIndex = clip.keyframes.findIndex(
    (keyframe) => keyframe.timeMs >= sampleTimeMs,
  );
  const followingKeyframe =
    clip.keyframes[rightIndex < 0 ? clip.keyframes.length - 1 : rightIndex]!;
  const precedingKeyframe =
    clip.keyframes[Math.max(0, rightIndex <= 0 ? 0 : rightIndex - 1)]!;
  const precedingPose = poseById.get(precedingKeyframe.poseSnapshotId);
  const followingPose = poseById.get(followingKeyframe.poseSnapshotId);
  if (precedingPose === undefined || followingPose === undefined)
    throw new Error(
      'Every clip keyframe must reference a supplied pose snapshot.',
    );

  const intervalMs = followingKeyframe.timeMs - precedingKeyframe.timeMs;
  const linearProgress =
    intervalMs === 0
      ? 0
      : (sampleTimeMs - precedingKeyframe.timeMs) / intervalMs;
  const progress = clip.interpolation === 'step' ? 0 : linearProgress;
  const precedingChannels = new Map(
    precedingPose.channels.map((channel) => [
      channel.jointId,
      channel.valueDegrees,
    ]),
  );
  const followingChannels = new Map(
    followingPose.channels.map((channel) => [
      channel.jointId,
      channel.valueDegrees,
    ]),
  );
  const channels = rig.joints.map((joint) => ({
    jointId: joint.id,
    valueDegrees: interpolate(
      precedingChannels.get(joint.id) ?? joint.restDegrees,
      followingChannels.get(joint.id) ?? joint.restDegrees,
      progress,
    ),
  }));
  const precedingRoot = rootMotion(precedingPose);
  const followingRoot = rootMotion(followingPose);

  return {
    clipId: clip.clipId,
    sampleTimeMs,
    precedingPoseSnapshotId: precedingPose.poseSnapshotId,
    followingPoseSnapshotId: followingPose.poseSnapshotId,
    interpolationProgress: progress,
    channels,
    rootMotion: {
      offset: [
        interpolate(precedingRoot.offset[0], followingRoot.offset[0], progress),
        interpolate(precedingRoot.offset[1], followingRoot.offset[1], progress),
        interpolate(precedingRoot.offset[2], followingRoot.offset[2], progress),
      ],
      yawDegrees: interpolate(
        precedingRoot.yawDegrees,
        followingRoot.yawDegrees,
        progress,
      ),
    },
  };
}
