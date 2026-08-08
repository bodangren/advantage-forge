import { z } from 'zod';

import {
  ClipDocumentSchema,
  PoseSnapshotSchema,
  RigDefinitionSchema,
  RigidAnimationBundleSchema,
  digestRigidAnimationValue,
  type AssetDocument,
  type RigidAnimationBundle,
} from '../contracts/index.js';
import { compileRigidFramePlan } from './rigid-animation.js';

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const DirectionSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);

const JointAuthoringSchema = z.strictObject({
  id: SemanticIdSchema,
  parentJointId: SemanticIdSchema.optional(),
  partId: SemanticIdSchema,
  axis: z.enum(['x', 'y', 'z']),
  minimumDegrees: z.number().finite().min(-180).max(180),
  maximumDegrees: z.number().finite().min(-180).max(180),
  restDegrees: z.number().finite().min(-180).max(180),
  mirrorJointId: SemanticIdSchema.optional(),
});

const PoseAuthoringSchema = z.strictObject({
  id: SemanticIdSchema,
  channels: z
    .array(
      z.strictObject({
        jointId: SemanticIdSchema,
        valueDegrees: z.number().finite().min(-180).max(180),
      }),
    )
    .max(64),
  rootMotion: z
    .strictObject({
      offset: z.tuple([
        z.number().finite().min(-2).max(2),
        z.number().finite().min(-2).max(2),
        z.number().finite().min(-2).max(2),
      ]),
      yawDegrees: z.number().finite().min(-180).max(180),
    })
    .optional(),
});

const ClipAuthoringSchema = z.strictObject({
  action: SemanticIdSchema,
  durationMs: z.number().int().positive().max(60_000),
  interpolation: z.enum(['step', 'linear']),
  rootAnchorPolicy: z.enum(['locked', 'in_place', 'bounded_motion']),
  loop: z.discriminatedUnion('mode', [
    z.strictObject({ mode: z.literal('once') }),
    z.strictObject({
      mode: z.literal('loop'),
      startMs: z.number().int().nonnegative().max(60_000),
      endMs: z.number().int().positive().max(60_000),
    }),
  ]),
  keyframes: z
    .array(
      z.strictObject({
        id: SemanticIdSchema,
        phase: SemanticIdSchema.optional(),
        timeMs: z.number().int().nonnegative().max(60_000),
        poseId: SemanticIdSchema,
      }),
    )
    .min(2)
    .max(240),
});

export const RigidAnimationAuthoringRequestSchema = z.strictObject({
  rig: z.strictObject({
    id: SemanticIdSchema,
    rootJointId: SemanticIdSchema,
    joints: z.array(JointAuthoringSchema).min(1).max(64),
  }),
  poses: z.array(PoseAuthoringSchema).min(1).max(256),
  clip: ClipAuthoringSchema,
  directions: z
    .array(DirectionSchema)
    .min(1)
    .max(8)
    .refine((directions) => new Set(directions).size === directions.length, {
      message: 'Animation directions must be unique.',
    }),
  framesPerSecond: z.number().int().min(2).max(60),
  seed: z.number().int().min(0).max(2_147_483_647),
});

export type RigidAnimationAuthoringRequest = z.input<
  typeof RigidAnimationAuthoringRequestSchema
>;

export const REFERENCE_FIVE_CLIP_AUTHORING_CONTRACT_ID =
  'forge-reference-five-clip-authoring/v1' as const;
export const REFERENCE_FIVE_CLIP_ACTIONS = [
  'idle',
  'walk_forward',
  'walk_right',
  'attack',
  'receive_damage',
] as const;
const COMPASS_ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const CaptureSchema = z.strictObject({
  directions: z
    .array(DirectionSchema)
    .min(1)
    .max(8)
    .refine((directions) => new Set(directions).size === directions.length, {
      message: 'Animation directions must be unique.',
    }),
  framesPerSecond: z.number().int().min(2).max(60),
});
const BatchKeyframeSchema = z.strictObject({
  id: SemanticIdSchema,
  phase: SemanticIdSchema,
  timeMs: z.number().int().nonnegative().max(60_000),
  poseId: SemanticIdSchema,
});

function temporalSampleCount(
  durationMs: number,
  framesPerSecond: number,
): number {
  return Math.min(
    durationMs,
    Math.max(2, Math.ceil((durationMs * framesPerSecond) / 1_000)),
  );
}

function referenceClipSchema(
  action: (typeof REFERENCE_FIVE_CLIP_ACTIONS)[number],
  phases: readonly string[],
  expectedSamples: number,
  expectedLoop: 'loop' | 'once',
) {
  return z
    .strictObject({
      action: z.literal(action),
      durationMs: z.number().int().positive().max(60_000),
      interpolation: z.enum(['step', 'linear']),
      rootAnchorPolicy: z.enum(['locked', 'in_place', 'bounded_motion']),
      loop: z.discriminatedUnion('mode', [
        z.strictObject({ mode: z.literal('once') }),
        z.strictObject({
          mode: z.literal('loop'),
          startMs: z.number().int().nonnegative().max(60_000),
          endMs: z.number().int().positive().max(60_000),
        }),
      ]),
      capture: CaptureSchema,
      keyframes: z.array(BatchKeyframeSchema).length(phases.length),
    })
    .superRefine((clip, context) => {
      const actualPhases = clip.keyframes.map(({ phase }) => phase);
      if (actualPhases.some((phase, index) => phase !== phases[index]))
        context.addIssue({
          code: 'custom',
          path: ['keyframes'],
          message: `${action} keyframe phases must be ${phases.join(', ')} in order.`,
        });
      const count = temporalSampleCount(
        clip.durationMs,
        clip.capture.framesPerSecond,
      );
      if (count !== expectedSamples)
        context.addIssue({
          code: 'custom',
          path: ['capture'],
          message: `${action} must derive exactly ${expectedSamples} temporal samples per direction; received ${count}.`,
        });
      if (clip.loop.mode !== expectedLoop)
        context.addIssue({
          code: 'custom',
          path: ['loop'],
          message: `${action} requires ${expectedLoop} loop behavior.`,
        });
      if (expectedLoop === 'loop') {
        if (
          clip.loop.mode === 'loop' &&
          (clip.loop.startMs !== 0 || clip.loop.endMs !== clip.durationMs)
        )
          context.addIssue({
            code: 'custom',
            path: ['loop'],
            message: `${action} loop must cover the full clip duration.`,
          });
        if (clip.keyframes[0]?.poseId !== clip.keyframes.at(-1)?.poseId)
          context.addIssue({
            code: 'custom',
            path: ['keyframes'],
            message: `${action} loop seam must reuse its starting pose.`,
          });
      } else if (
        clip.keyframes.at(-1)?.poseId !== clip.keyframes.at(-2)?.poseId
      ) {
        context.addIssue({
          code: 'custom',
          path: ['keyframes'],
          message: `${action} terminal hold must reuse its recovery pose.`,
        });
      }
    });
}

const IdleBatchClipSchema = referenceClipSchema(
  'idle',
  ['neutral', 'inhale', 'shift', 'exhale', 'loop_seam'],
  4,
  'loop',
);
const WalkForwardBatchClipSchema = referenceClipSchema(
  'walk_forward',
  [
    'contact_left',
    'down_left',
    'passing_left',
    'contact_right',
    'down_right',
    'passing_right',
    'loop_seam',
  ],
  6,
  'loop',
);
const WalkRightBatchClipSchema = referenceClipSchema(
  'walk_right',
  [
    'contact_left',
    'down_left',
    'passing_left',
    'contact_right',
    'down_right',
    'passing_right',
    'loop_seam',
  ],
  6,
  'loop',
);
const AttackBatchClipSchema = referenceClipSchema(
  'attack',
  [
    'neutral',
    'anticipation',
    'windup',
    'contact',
    'follow_through',
    'recovery',
    'terminal_hold',
  ],
  6,
  'once',
);
const DamageBatchClipSchema = referenceClipSchema(
  'receive_damage',
  ['neutral', 'impact', 'recoil', 'recovery', 'terminal_hold'],
  4,
  'once',
);

function canonicalPoseContent(
  pose: z.output<typeof PoseAuthoringSchema>,
): string {
  return JSON.stringify({
    channels: [...pose.channels].sort((left, right) =>
      left.jointId.localeCompare(right.jointId),
    ),
    rootMotion: pose.rootMotion ?? { offset: [0, 0, 0], yawDegrees: 0 },
  });
}

const REFERENCE_FULL_BODY_JOINTS = [
  ['root', 'torso'],
  ['shoulder.left', 'upper-arm.left'],
  ['shoulder.right', 'upper-arm.right'],
  ['elbow.left', 'forearm.left'],
  ['elbow.right', 'forearm.right'],
  ['hip.left', 'thigh.left'],
  ['hip.right', 'thigh.right'],
  ['knee.left', 'shin.left'],
  ['knee.right', 'shin.right'],
] as const;

type ReferencePose = z.output<typeof PoseAuthoringSchema>;
type ReferenceClip = Readonly<{
  keyframes: readonly Readonly<{
    phase: string;
    poseId: string;
  }>[];
}>;

function phasePose(
  posesById: ReadonlyMap<string, ReferencePose>,
  clip: ReferenceClip,
  phase: string,
): ReferencePose | undefined {
  const poseId = clip.keyframes.find(
    (keyframe) => keyframe.phase === phase,
  )?.poseId;
  return poseId === undefined ? undefined : posesById.get(poseId);
}

function poseJointValue(
  pose: ReferencePose | undefined,
  jointId: string,
  restByJointId: ReadonlyMap<string, number>,
): number {
  return (
    pose?.channels.find((channel) => channel.jointId === jointId)
      ?.valueDegrees ??
    restByJointId.get(jointId) ??
    0
  );
}

function rootDistance(pose: ReferencePose | undefined): number {
  return Math.hypot(...(pose?.rootMotion?.offset ?? [0, 0, 0]));
}

function addReferenceMotionIssue(
  context: z.RefinementCtx,
  path: PropertyKey[],
  message: string,
): void {
  context.addIssue({ code: 'custom', path, message });
}

export const ReferenceFiveClipBatchAuthoringRequestSchema = z
  .strictObject({
    contractId: z.literal(REFERENCE_FIVE_CLIP_AUTHORING_CONTRACT_ID),
    rig: z.strictObject({
      id: SemanticIdSchema,
      rootJointId: SemanticIdSchema,
      joints: z.array(JointAuthoringSchema).min(1).max(64),
    }),
    poses: z.array(PoseAuthoringSchema).min(1).max(256),
    seed: z.number().int().min(0).max(2_147_483_647),
    clips: z.tuple([
      IdleBatchClipSchema,
      WalkForwardBatchClipSchema,
      WalkRightBatchClipSchema,
      AttackBatchClipSchema,
      DamageBatchClipSchema,
    ]),
  })
  .superRefine((batch, context) => {
    const jointById = new Map(
      batch.rig.joints.map((joint) => [joint.id, joint]),
    );
    const restByJointId = new Map(
      batch.rig.joints.map((joint) => [joint.id, joint.restDegrees]),
    );
    for (const [jointId, partId] of REFERENCE_FULL_BODY_JOINTS) {
      const joint = jointById.get(jointId);
      if (joint?.partId !== partId)
        addReferenceMotionIssue(
          context,
          ['rig', 'joints'],
          `Reference five-clip animation requires full-body joint ${jointId} bound to ${partId}.`,
        );
    }

    const posesById = new Map<string, ReferencePose>();
    const contents = new Map<string, number>();
    for (const [index, pose] of batch.poses.entries()) {
      posesById.set(pose.id, pose);
      const content = canonicalPoseContent(pose);
      const prior = contents.get(content);
      if (prior !== undefined)
        context.addIssue({
          code: 'custom',
          path: ['poses', index],
          message: `Animation pose ${pose.id} has duplicate pose content from poses[${prior}].`,
        });
      else contents.set(content, index);
    }

    for (const [clipIndex, clip] of batch.clips.entries())
      for (const [keyframeIndex, keyframe] of clip.keyframes.entries())
        if (!posesById.has(keyframe.poseId))
          addReferenceMotionIssue(
            context,
            ['clips', clipIndex, 'keyframes', keyframeIndex, 'poseId'],
            `Reference keyframe ${keyframe.id} targets unknown pose ${keyframe.poseId}.`,
          );

    for (const clipIndex of [1, 2] as const) {
      const clip = batch.clips[clipIndex];
      const contactLeft = phasePose(posesById, clip, 'contact_left');
      const contactRight = phasePose(posesById, clip, 'contact_right');
      const passingLeft = phasePose(posesById, clip, 'passing_left');
      const passingRight = phasePose(posesById, clip, 'passing_right');
      const leftStride =
        poseJointValue(contactLeft, 'hip.left', restByJointId) -
        poseJointValue(contactLeft, 'hip.right', restByJointId);
      const rightStride =
        poseJointValue(contactRight, 'hip.left', restByJointId) -
        poseJointValue(contactRight, 'hip.right', restByJointId);
      const passingFlex = Math.min(
        Math.max(
          Math.abs(poseJointValue(passingLeft, 'knee.left', restByJointId)),
          Math.abs(poseJointValue(passingLeft, 'knee.right', restByJointId)),
        ),
        Math.max(
          Math.abs(poseJointValue(passingRight, 'knee.left', restByJointId)),
          Math.abs(poseJointValue(passingRight, 'knee.right', restByJointId)),
        ),
      );
      if (
        Math.abs(leftStride) < 45 ||
        Math.abs(rightStride) < 45 ||
        Math.sign(leftStride) === Math.sign(rightStride)
      )
        addReferenceMotionIssue(
          context,
          ['clips', clipIndex, 'keyframes'],
          `${clip.action} requires visibly alternating left/right hip contact poses.`,
        );
      if (passingFlex < 35)
        addReferenceMotionIssue(
          context,
          ['clips', clipIndex, 'keyframes'],
          `${clip.action} requires alternating knee flexion in both passing poses.`,
        );
      if (clipIndex === 2) {
        const motionPoses = clip.keyframes
          .slice(0, -1)
          .map(({ poseId }) => posesById.get(poseId));
        const yawValues = motionPoses.map(
          (pose) => pose?.rootMotion?.yawDegrees ?? 0,
        );
        const yawSigns = new Set(
          yawValues.map(Math.sign).filter((sign) => sign !== 0),
        );
        const yawMinimum = Math.min(...yawValues);
        const yawMaximum = Math.max(...yawValues);
        if (
          yawSigns.size !== 1 ||
          yawMaximum - yawMinimum > 1 ||
          Math.abs(yawValues[0] ?? 0) < 4 ||
          Math.abs(yawValues[0] ?? 0) > 18
        )
          addReferenceMotionIssue(
            context,
            ['clips', clipIndex, 'keyframes'],
            'walk_right requires one stable small three-quarter facing yaw; per-frame yaw reversal is rejected.',
          );
        if (
          Math.abs(leftStride) < 75 ||
          Math.abs(rightStride) < 75 ||
          passingFlex < 55
        )
          addReferenceMotionIssue(
            context,
            ['clips', clipIndex, 'keyframes'],
            'walk_right requires strong hip and knee separation as an E-view silhouette-delta proxy.',
          );
        for (const jointId of ['shoulder.left', 'shoulder.right']) {
          const values = motionPoses.map((pose) =>
            poseJointValue(pose, jointId, restByJointId),
          );
          if (Math.max(...values) - Math.min(...values) > 20)
            addReferenceMotionIssue(
              context,
              ['clips', clipIndex, 'keyframes'],
              'walk_right limits shoulder swing to preserve equipment-side continuity.',
            );
        }
      }
    }

    const idle = batch.clips[0];
    const idleOffsets = idle.keyframes
      .map(({ poseId }) => posesById.get(poseId)?.rootMotion?.offset[1] ?? 0)
      .slice(0, -1);
    if (Math.max(...idleOffsets) - Math.min(...idleOffsets) < 0.025)
      addReferenceMotionIssue(
        context,
        ['clips', 0, 'keyframes'],
        'idle requires a readable breathing or weight-shift root excursion.',
      );

    const attack = batch.clips[3];
    const anticipation = phasePose(posesById, attack, 'anticipation');
    const contact = phasePose(posesById, attack, 'contact');
    const followThrough = phasePose(posesById, attack, 'follow_through');
    const attackShoulderExcursion = Math.max(
      Math.abs(
        poseJointValue(anticipation, 'shoulder.right', restByJointId) -
          poseJointValue(contact, 'shoulder.right', restByJointId),
      ),
      Math.abs(
        poseJointValue(anticipation, 'shoulder.right', restByJointId) -
          poseJointValue(followThrough, 'shoulder.right', restByJointId),
      ),
    );
    const attackElbowExcursion = Math.abs(
      poseJointValue(anticipation, 'elbow.right', restByJointId) -
        poseJointValue(followThrough, 'elbow.right', restByJointId),
    );
    const attackHipExcursion = Math.abs(
      poseJointValue(anticipation, 'hip.left', restByJointId) -
        poseJointValue(followThrough, 'hip.left', restByJointId),
    );
    if (
      attackShoulderExcursion < 65 ||
      attackElbowExcursion < 60 ||
      attackHipExcursion < 30 ||
      rootDistance(followThrough) < 0.12
    )
      addReferenceMotionIssue(
        context,
        ['clips', 3, 'keyframes'],
        'attack requires full-body anticipation, contact, follow-through, and bounded root lunge.',
      );

    const damage = batch.clips[4];
    const impact = phasePose(posesById, damage, 'impact');
    const recoil = phasePose(posesById, damage, 'recoil');
    const recovery = phasePose(posesById, damage, 'recovery');
    if (
      rootDistance(recoil) < 0.15 ||
      rootDistance(recovery) >= rootDistance(recoil) * 0.6 ||
      Math.abs(
        poseJointValue(recoil, 'hip.left', restByJointId) -
          poseJointValue(recovery, 'hip.left', restByJointId),
      ) < 25
    )
      addReferenceMotionIssue(
        context,
        ['clips', 4, 'keyframes'],
        'receive_damage requires whole-body root recoil followed by visible recovery.',
      );
    const damageMotionPoses = damage.keyframes
      .slice(0, -1)
      .map(({ poseId }) => posesById.get(poseId));
    const damageYawValues = damageMotionPoses.map(
      (pose) => pose?.rootMotion?.yawDegrees ?? 0,
    );
    const damageYawSigns = new Set(
      damageYawValues.map(Math.sign).filter((sign) => sign !== 0),
    );
    if (
      damageYawSigns.size > 1 ||
      Math.max(...damageYawValues) - Math.min(...damageYawValues) > 4
    )
      addReferenceMotionIssue(
        context,
        ['clips', 4, 'keyframes'],
        'receive_damage requires stable facing without yaw reversal.',
      );
    const impactOffset = impact?.rootMotion?.offset ?? [0, 0, 0];
    const recoilOffset = recoil?.rootMotion?.offset ?? [0, 0, 0];
    const recoveryOffset = recovery?.rootMotion?.offset ?? [0, 0, 0];
    if (
      Math.abs(recoilOffset[0]) < 0.18 ||
      recoilOffset[1] < 0.08 ||
      Math.sign(impactOffset[0]) !== Math.sign(recoilOffset[0]) ||
      Math.sign(recoveryOffset[0]) !== Math.sign(recoilOffset[0]) ||
      rootDistance(impact) >= rootDistance(recoil) ||
      rootDistance(recovery) >= rootDistance(impact) ||
      Math.abs(
        poseJointValue(recoil, 'shoulder.left', restByJointId) -
          poseJointValue(recoil, 'shoulder.right', restByJointId),
      ) < 70 ||
      Math.abs(
        poseJointValue(recoil, 'knee.left', restByJointId) -
          poseJointValue(recoil, 'knee.right', restByJointId),
      ) < 65
    )
      addReferenceMotionIssue(
        context,
        ['clips', 4, 'keyframes'],
        'receive_damage requires a consistent impact-to-recoil-to-recovery root arc with asymmetric limb response.',
      );
  });
export type ReferenceFiveClipBatchAuthoringRequest = z.input<
  typeof ReferenceFiveClipBatchAuthoringRequestSchema
>;

const axisVector = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
} as const;

function sameVector(
  left: readonly number[] | undefined,
  right: readonly number[],
): boolean {
  return (
    left?.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function validateRigAgainstDocument(
  document: Readonly<AssetDocument>,
  request: z.output<typeof RigidAnimationAuthoringRequestSchema>,
): void {
  const partIds = new Set(document.assembly.parts.map(({ id }) => id));
  for (const joint of request.rig.joints) {
    if (!partIds.has(joint.partId))
      throw new Error(
        `Animation joint ${joint.id} targets missing part ${joint.partId}.`,
      );
    if (joint.id === request.rig.rootJointId) continue;
    const connection = document.assembly.connections.find(
      ({ childPartId }) => childPartId === joint.partId,
    );
    if (
      connection?.joint?.kind !== 'hinge' ||
      !sameVector(connection.joint.axis, axisVector[joint.axis])
    )
      throw new Error(
        `Animation joint ${joint.id} must match the declared hinge axis for ${joint.partId}.`,
      );
    if (
      connection.joint.minDegrees === undefined ||
      connection.joint.maxDegrees === undefined ||
      joint.minimumDegrees < connection.joint.minDegrees ||
      joint.maximumDegrees > connection.joint.maxDegrees
    )
      throw new Error(
        `Animation joint ${joint.id} exceeds the declared hinge limits for ${joint.partId}.`,
      );
  }
}

async function prefixedDigest(prefix: string, value: unknown): Promise<string> {
  return `${prefix}.${await digestRigidAnimationValue(value)}`;
}

/** Compiles semantic input into freshness-bound animation contracts. */
export async function compileRigidAnimationAuthoringRequest(
  document: Readonly<AssetDocument>,
  assetRevisionId: string,
  input: RigidAnimationAuthoringRequest,
): Promise<RigidAnimationBundle> {
  const request = RigidAnimationAuthoringRequestSchema.parse(input);
  if (!/^revision\.[a-f0-9]{64}$/.test(assetRevisionId))
    throw new Error(
      'Animation authoring requires an exact immutable asset revision.',
    );
  validateRigAgainstDocument(document, request);

  const morphologyRevisionId = await prefixedDigest('morphology', {
    assetRevisionId,
    profile: document.morphologyProfile ?? null,
  });
  const equipmentParts = document.assembly.parts
    .filter(({ equipmentSlot }) => equipmentSlot !== undefined)
    .map((part) => ({
      id: part.id,
      templateId: part.templateId,
      equipmentSlot: part.equipmentSlot,
      materialBindings: [...part.materialBindings].sort((left, right) =>
        left.slot < right.slot ? -1 : left.slot > right.slot ? 1 : 0,
      ),
      transform: part.transform,
    }))
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    );
  const equipmentSignature = await prefixedDigest('equipment', {
    assetRevisionId,
    equipmentParts,
  });
  const rigSignature = await prefixedDigest('rig', {
    assetRevisionId,
    morphologyRevisionId,
    equipmentSignature,
    rig: request.rig,
  });
  const binding = {
    assetRevisionId,
    morphologyRevisionId,
    rigSignature,
    equipmentSignature,
  } as const;
  const rig = RigDefinitionSchema.parse({
    contractId: 'forge-rig-definition/v1',
    rigId: request.rig.id,
    ...binding,
    rootJointId: request.rig.rootJointId,
    joints: request.rig.joints,
  });

  const poseIdByAuthoringId = new Map<string, string>();
  const poses = [];
  for (const pose of request.poses) {
    if (poseIdByAuthoringId.has(pose.id))
      throw new Error(`Animation pose authoring ID ${pose.id} is duplicated.`);
    const poseSnapshotId = await prefixedDigest('pose', { binding, pose });
    poseIdByAuthoringId.set(pose.id, poseSnapshotId);
    poses.push(
      PoseSnapshotSchema.parse({
        contractId: 'forge-pose-snapshot/v1',
        poseSnapshotId,
        ...binding,
        channels: pose.channels,
        ...(pose.rootMotion === undefined
          ? {}
          : { rootMotion: pose.rootMotion }),
      }),
    );
  }
  const resolvedKeyframes = request.clip.keyframes.map((keyframe) => {
    const poseSnapshotId = poseIdByAuthoringId.get(keyframe.poseId);
    if (poseSnapshotId === undefined)
      throw new Error(
        `Animation keyframe ${keyframe.id} references unknown pose ${keyframe.poseId}.`,
      );
    return {
      id: keyframe.id,
      ...(keyframe.phase === undefined ? {} : { phase: keyframe.phase }),
      timeMs: keyframe.timeMs,
      poseSnapshotId,
    };
  });
  const clipId = await prefixedDigest('clip', {
    binding,
    ...request.clip,
    keyframes: resolvedKeyframes,
  });
  const clip = ClipDocumentSchema.parse({
    contractId: 'forge-clip-document/v1',
    clipId,
    action: request.clip.action,
    ...binding,
    durationMs: request.clip.durationMs,
    interpolation: request.clip.interpolation,
    rootAnchorPolicy: request.clip.rootAnchorPolicy,
    loop: request.clip.loop,
    keyframes: resolvedKeyframes,
  });
  const framePlan = await compileRigidFramePlan({
    clip,
    directions: request.directions,
    framesPerSecond: request.framesPerSecond,
    seed: request.seed,
  });

  return RigidAnimationBundleSchema.parse({
    contractId: 'forge-rigid-animation-bundle/v1',
    rig,
    poses,
    clips: [clip],
    framePlans: [framePlan],
  });
}

/** Compiles the bounded five-clip reference profile into one shared bundle. */
export async function compileReferenceFiveClipBatchAuthoringRequest(
  document: Readonly<AssetDocument>,
  assetRevisionId: string,
  input: unknown,
): Promise<RigidAnimationBundle> {
  const request = ReferenceFiveClipBatchAuthoringRequestSchema.parse(input);
  const compiled = await Promise.all(
    request.clips.map((clip) =>
      compileRigidAnimationAuthoringRequest(document, assetRevisionId, {
        rig: request.rig,
        poses: request.poses,
        clip: {
          action: clip.action,
          durationMs: clip.durationMs,
          interpolation: clip.interpolation,
          rootAnchorPolicy: clip.rootAnchorPolicy,
          loop: clip.loop,
          keyframes: clip.keyframes.map(({ id, phase, timeMs, poseId }) => ({
            id,
            phase,
            timeMs,
            poseId,
          })),
        },
        directions: [...clip.capture.directions].sort(
          (left, right) =>
            COMPASS_ORDER.indexOf(left) - COMPASS_ORDER.indexOf(right),
        ),
        framesPerSecond: clip.capture.framesPerSecond,
        seed: request.seed,
      }),
    ),
  );
  const first = compiled[0]!;
  return RigidAnimationBundleSchema.parse({
    contractId: 'forge-rigid-animation-bundle/v1',
    rig: first.rig,
    poses: first.poses,
    clips: compiled.map(({ clips }) => clips[0]!),
    framePlans: compiled.map(({ framePlans }) => framePlans[0]!),
  });
}
