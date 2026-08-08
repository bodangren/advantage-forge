import { z } from 'zod';

export const RIG_DEFINITION_CONTRACT_ID = 'forge-rig-definition/v1' as const;
export const POSE_SNAPSHOT_CONTRACT_ID = 'forge-pose-snapshot/v1' as const;
export const CLIP_DOCUMENT_CONTRACT_ID = 'forge-clip-document/v1' as const;
export const FRAME_PLAN_CONTRACT_ID = 'forge-frame-plan/v1' as const;
export const RIGID_ANIMATION_BUNDLE_CONTRACT_ID =
  'forge-rigid-animation-bundle/v1' as const;
export const TEMPORAL_DELIVERY_CONTRACT_ID =
  'forge-temporal-delivery/v1' as const;

export const RIGID_ANIMATION_BUDGETS = Object.freeze({
  maximumJoints: 64,
  maximumPoseSnapshots: 256,
  maximumPoseChannels: 64,
  maximumClips: 64,
  maximumKeyframesPerClip: 240,
  maximumClipDurationMs: 60_000,
  maximumFramePlans: 64,
  maximumFramesPerPlan: 2_048,
  maximumSourceFramesPerDelivery: 4_096,
  maximumDerivedImagesPerDelivery: 128,
} as const);

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const AssetRevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const MorphologyRevisionIdSchema = z
  .string()
  .regex(/^morphology\.[a-f0-9]{64}$/);
const RigSignatureSchema = z.string().regex(/^rig\.[a-f0-9]{64}$/);
const EquipmentSignatureSchema = z.string().regex(/^equipment\.[a-f0-9]{64}$/);
const PoseSnapshotIdSchema = z.string().regex(/^pose\.[a-f0-9]{64}$/);
const ClipIdSchema = z.string().regex(/^clip\.[a-f0-9]{64}$/);
const FramePlanIdSchema = z.string().regex(/^frame-plan\.[a-f0-9]{64}$/);
const DeliveryIdSchema = z.string().regex(/^delivery\.[a-f0-9]{64}$/);
const FiniteNumberSchema = z.number().finite();
const IntegerMillisecondsSchema = z.number().int().min(0).max(60_000);
const DirectionSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
const Vec3Schema = z.tuple([
  FiniteNumberSchema,
  FiniteNumberSchema,
  FiniteNumberSchema,
]);
const RenderProfileSchema = z.strictObject({
  id: z.literal('fantasy.sprite.orthographic.v1'),
  version: z.literal('1.0.0'),
});

export const RigidAnimationBindingSchema = z.strictObject({
  assetRevisionId: AssetRevisionIdSchema,
  morphologyRevisionId: MorphologyRevisionIdSchema,
  rigSignature: RigSignatureSchema,
  equipmentSignature: EquipmentSignatureSchema,
});
type RigidAnimationBinding = z.infer<typeof RigidAnimationBindingSchema>;

const bindingMatches = (
  expected: RigidAnimationBinding,
  candidate: RigidAnimationBinding,
): boolean =>
  expected.assetRevisionId === candidate.assetRevisionId &&
  expected.morphologyRevisionId === candidate.morphologyRevisionId &&
  expected.rigSignature === candidate.rigSignature &&
  expected.equipmentSignature === candidate.equipmentSignature;

export const RigJointDefinitionSchema = z
  .strictObject({
    id: SemanticIdSchema,
    parentJointId: SemanticIdSchema.optional(),
    partId: SemanticIdSchema,
    axis: z.enum(['x', 'y', 'z']),
    minimumDegrees: FiniteNumberSchema.min(-180).max(180),
    maximumDegrees: FiniteNumberSchema.min(-180).max(180),
    restDegrees: FiniteNumberSchema.min(-180).max(180),
    mirrorJointId: SemanticIdSchema.optional(),
  })
  .superRefine((joint, context) => {
    if (joint.minimumDegrees > joint.maximumDegrees)
      context.addIssue({
        code: 'custom',
        path: ['maximumDegrees'],
        message: 'Joint maximum must not be less than its minimum.',
      });
    if (
      joint.restDegrees < joint.minimumDegrees ||
      joint.restDegrees > joint.maximumDegrees
    )
      context.addIssue({
        code: 'custom',
        path: ['restDegrees'],
        message: 'Joint rest value must remain inside its limits.',
      });
  });

export const RigDefinitionSchema = z
  .strictObject({
    contractId: z.literal(RIG_DEFINITION_CONTRACT_ID),
    rigId: SemanticIdSchema,
    ...RigidAnimationBindingSchema.shape,
    rootJointId: SemanticIdSchema,
    joints: z
      .array(RigJointDefinitionSchema)
      .min(1)
      .max(RIGID_ANIMATION_BUDGETS.maximumJoints),
  })
  .superRefine((rig, context) => {
    const byId = new Map<string, (typeof rig.joints)[number]>();
    const partIds = new Set<string>();
    for (const [index, joint] of rig.joints.entries()) {
      if (byId.has(joint.id))
        context.addIssue({
          code: 'custom',
          path: ['joints', index, 'id'],
          message: 'Joint IDs must be unique.',
        });
      byId.set(joint.id, joint);
      if (partIds.has(joint.partId))
        context.addIssue({
          code: 'custom',
          path: ['joints', index, 'partId'],
          message: 'A rigid part may be controlled by only one joint.',
        });
      partIds.add(joint.partId);
    }

    const root = byId.get(rig.rootJointId);
    if (root === undefined || root.parentJointId !== undefined)
      context.addIssue({
        code: 'custom',
        path: ['rootJointId'],
        message: 'The declared root joint must exist and have no parent.',
      });

    for (const [index, joint] of rig.joints.entries()) {
      if (
        joint.id !== rig.rootJointId &&
        (joint.parentJointId === undefined || !byId.has(joint.parentJointId))
      )
        context.addIssue({
          code: 'custom',
          path: ['joints', index, 'parentJointId'],
          message: 'Every non-root joint requires a known parent.',
        });
      if (joint.parentJointId === joint.id)
        context.addIssue({
          code: 'custom',
          path: ['joints', index, 'parentJointId'],
          message: 'A joint cannot parent itself.',
        });
      if (joint.mirrorJointId !== undefined) {
        const mirror = byId.get(joint.mirrorJointId);
        if (mirror?.mirrorJointId !== joint.id || mirror.axis !== joint.axis)
          context.addIssue({
            code: 'custom',
            path: ['joints', index, 'mirrorJointId'],
            message:
              'Mirror joints must be known, reciprocal, and share an axis.',
          });
      }

      const visited = new Set<string>([joint.id]);
      let parentId = joint.parentJointId;
      while (parentId !== undefined) {
        if (visited.has(parentId)) {
          context.addIssue({
            code: 'custom',
            path: ['joints', index, 'parentJointId'],
            message: 'Rig joint hierarchy must be acyclic.',
          });
          break;
        }
        visited.add(parentId);
        parentId = byId.get(parentId)?.parentJointId;
      }
    }
  });

export const PoseJointChannelSchema = z.strictObject({
  jointId: SemanticIdSchema,
  valueDegrees: FiniteNumberSchema.min(-180).max(180),
});

export const PoseSnapshotSchema = z
  .strictObject({
    contractId: z.literal(POSE_SNAPSHOT_CONTRACT_ID),
    poseSnapshotId: PoseSnapshotIdSchema,
    ...RigidAnimationBindingSchema.shape,
    channels: z
      .array(PoseJointChannelSchema)
      .max(RIGID_ANIMATION_BUDGETS.maximumPoseChannels),
    rootMotion: z
      .strictObject({
        offset: Vec3Schema.refine(
          (offset) => offset.every((value) => Math.abs(value) <= 2),
          'Root offsets must remain within -2..2 meters.',
        ),
        yawDegrees: FiniteNumberSchema.min(-180).max(180),
      })
      .optional(),
  })
  .superRefine((pose, context) => {
    const jointIds = new Set<string>();
    for (const [index, channel] of pose.channels.entries()) {
      if (jointIds.has(channel.jointId))
        context.addIssue({
          code: 'custom',
          path: ['channels', index, 'jointId'],
          message: 'Sparse pose channels may address a joint only once.',
        });
      jointIds.add(channel.jointId);
    }
  });

export const ClipLoopPolicySchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('once') }),
  z.strictObject({
    mode: z.literal('loop'),
    startMs: IntegerMillisecondsSchema,
    endMs: z.number().int().positive().max(60_000),
  }),
]);

export const ClipKeyframeSchema = z.strictObject({
  id: SemanticIdSchema,
  phase: SemanticIdSchema.optional(),
  timeMs: IntegerMillisecondsSchema,
  poseSnapshotId: PoseSnapshotIdSchema,
});

export const ClipDocumentSchema = z
  .strictObject({
    contractId: z.literal(CLIP_DOCUMENT_CONTRACT_ID),
    clipId: ClipIdSchema,
    action: SemanticIdSchema,
    ...RigidAnimationBindingSchema.shape,
    durationMs: z
      .number()
      .int()
      .positive()
      .max(RIGID_ANIMATION_BUDGETS.maximumClipDurationMs),
    interpolation: z.enum(['step', 'linear']),
    rootAnchorPolicy: z.enum(['locked', 'in_place', 'bounded_motion']),
    loop: ClipLoopPolicySchema,
    keyframes: z
      .array(ClipKeyframeSchema)
      .min(2)
      .max(RIGID_ANIMATION_BUDGETS.maximumKeyframesPerClip),
  })
  .superRefine((clip, context) => {
    const ids = new Set<string>();
    for (const [index, keyframe] of clip.keyframes.entries()) {
      if (ids.has(keyframe.id))
        context.addIssue({
          code: 'custom',
          path: ['keyframes', index, 'id'],
          message: 'Keyframe IDs must be unique.',
        });
      ids.add(keyframe.id);
      if (index > 0 && keyframe.timeMs <= clip.keyframes[index - 1]!.timeMs)
        context.addIssue({
          code: 'custom',
          path: ['keyframes', index, 'timeMs'],
          message: 'Keyframe times must be strictly increasing.',
        });
    }
    if (clip.keyframes[0]?.timeMs !== 0)
      context.addIssue({
        code: 'custom',
        path: ['keyframes', 0, 'timeMs'],
        message: 'A clip must begin at integer time 0.',
      });
    if (clip.keyframes.at(-1)?.timeMs !== clip.durationMs)
      context.addIssue({
        code: 'custom',
        path: ['keyframes'],
        message: 'A clip must end with a keyframe at durationMs.',
      });
    if (
      clip.loop.mode === 'loop' &&
      (clip.loop.startMs >= clip.loop.endMs ||
        clip.loop.endMs > clip.durationMs)
    )
      context.addIssue({
        code: 'custom',
        path: ['loop'],
        message: 'Loop range must be increasing and remain inside the clip.',
      });
  });

export const FramePlanKeySchema = z.strictObject({
  ...RigidAnimationBindingSchema.shape,
  clipId: ClipIdSchema,
  sampleTimeMs: IntegerMillisecondsSchema,
  renderProfile: RenderProfileSchema,
  direction: DirectionSchema,
  seed: z.number().int().min(0).max(2_147_483_647),
});

export const PlannedAnimationFrameSchema = z.strictObject({
  id: SemanticIdSchema,
  sequence: z.number().int().nonnegative().max(2_047),
  key: FramePlanKeySchema,
  output: z.strictObject({
    mediaType: z.literal('image/png'),
    width: z.literal(128),
    height: z.literal(128),
    transparent: z.literal(true),
  }),
});

export const FramePlanSchema = z
  .strictObject({
    contractId: z.literal(FRAME_PLAN_CONTRACT_ID),
    framePlanId: FramePlanIdSchema,
    ...RigidAnimationBindingSchema.shape,
    clipId: ClipIdSchema,
    durationMs: z
      .number()
      .int()
      .positive()
      .max(RIGID_ANIMATION_BUDGETS.maximumClipDurationMs),
    renderProfile: RenderProfileSchema,
    seed: z.number().int().min(0).max(2_147_483_647),
    frames: z
      .array(PlannedAnimationFrameSchema)
      .min(2)
      .max(RIGID_ANIMATION_BUDGETS.maximumFramesPerPlan),
  })
  .superRefine((plan, context) => {
    const ids = new Set<string>();
    const keys = new Set<string>();
    const samplesByDirection = new Map<string, Set<number>>();
    for (const [index, frame] of plan.frames.entries()) {
      if (frame.sequence !== index)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'sequence'],
          message: 'Frame sequence must be contiguous and ordered from zero.',
        });
      if (ids.has(frame.id))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'id'],
          message: 'Planned frame IDs must be unique.',
        });
      ids.add(frame.id);
      const keyIdentity = `${frame.key.direction}:${frame.key.sampleTimeMs}`;
      if (keys.has(keyIdentity))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'key'],
          message:
            'Frame plan keys must be unique by direction and sample time.',
        });
      keys.add(keyIdentity);
      if (
        !bindingMatches(plan, frame.key) ||
        frame.key.clipId !== plan.clipId ||
        frame.key.renderProfile.id !== plan.renderProfile.id ||
        frame.key.renderProfile.version !== plan.renderProfile.version ||
        frame.key.seed !== plan.seed
      )
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'key'],
          message:
            'Warm-session frame key must preserve asset, morphology, rig, equipment, clip, render profile, and seed bindings.',
        });
      if (frame.key.sampleTimeMs >= plan.durationMs)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'key', 'sampleTimeMs'],
          message: 'Rendered sample time must be before clip duration.',
        });
      const samples = samplesByDirection.get(frame.key.direction) ?? new Set();
      samples.add(frame.key.sampleTimeMs);
      samplesByDirection.set(frame.key.direction, samples);
    }
    for (const [direction, samples] of samplesByDirection)
      if (samples.size < 2)
        context.addIssue({
          code: 'custom',
          path: ['frames'],
          message: `Direction ${direction} requires at least two temporal samples; a static directional still is not animation.`,
        });
  });

const addBindingIssue = (context: z.RefinementCtx, path: PropertyKey[]): void =>
  context.addIssue({
    code: 'custom',
    path,
    message:
      'Animation document has a stale asset, morphology, rig, or equipment signature.',
  });

export const RigidAnimationBundleSchema = z
  .strictObject({
    contractId: z.literal(RIGID_ANIMATION_BUNDLE_CONTRACT_ID),
    rig: RigDefinitionSchema,
    poses: z
      .array(PoseSnapshotSchema)
      .min(1)
      .max(RIGID_ANIMATION_BUDGETS.maximumPoseSnapshots),
    clips: z
      .array(ClipDocumentSchema)
      .min(1)
      .max(RIGID_ANIMATION_BUDGETS.maximumClips),
    framePlans: z
      .array(FramePlanSchema)
      .min(1)
      .max(RIGID_ANIMATION_BUDGETS.maximumFramePlans),
  })
  .superRefine((bundle, context) => {
    const rigBinding: RigidAnimationBinding = bundle.rig;
    const jointById = new Map(
      bundle.rig.joints.map((joint) => [joint.id, joint]),
    );
    const poseIds = new Set<string>();
    for (const [poseIndex, pose] of bundle.poses.entries()) {
      if (!bindingMatches(rigBinding, pose))
        addBindingIssue(context, ['poses', poseIndex]);
      if (poseIds.has(pose.poseSnapshotId))
        context.addIssue({
          code: 'custom',
          path: ['poses', poseIndex, 'poseSnapshotId'],
          message:
            'Pose snapshot identities must be unique; filler duplicates are rejected.',
        });
      poseIds.add(pose.poseSnapshotId);
      for (const [channelIndex, channel] of pose.channels.entries()) {
        const joint = jointById.get(channel.jointId);
        if (
          joint === undefined ||
          channel.valueDegrees < joint.minimumDegrees ||
          channel.valueDegrees > joint.maximumDegrees
        )
          context.addIssue({
            code: 'custom',
            path: ['poses', poseIndex, 'channels', channelIndex],
            message:
              'Pose channel must target a known joint within rig limits.',
          });
      }
    }

    const clipById = new Map<string, (typeof bundle.clips)[number]>();
    for (const [clipIndex, clip] of bundle.clips.entries()) {
      if (!bindingMatches(rigBinding, clip))
        addBindingIssue(context, ['clips', clipIndex]);
      if (clipById.has(clip.clipId))
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'clipId'],
          message:
            'Clip identities must be unique; filler duplicates are rejected.',
        });
      clipById.set(clip.clipId, clip);
      for (const [keyframeIndex, keyframe] of clip.keyframes.entries())
        if (!poseIds.has(keyframe.poseSnapshotId))
          context.addIssue({
            code: 'custom',
            path: [
              'clips',
              clipIndex,
              'keyframes',
              keyframeIndex,
              'poseSnapshotId',
            ],
            message:
              'Clip keyframe must reference a pose snapshot in this bundle.',
          });
    }

    const framePlanIds = new Set<string>();
    for (const [planIndex, plan] of bundle.framePlans.entries()) {
      if (!bindingMatches(rigBinding, plan))
        addBindingIssue(context, ['framePlans', planIndex]);
      if (framePlanIds.has(plan.framePlanId))
        context.addIssue({
          code: 'custom',
          path: ['framePlans', planIndex, 'framePlanId'],
          message: 'Frame-plan identities must be unique.',
        });
      framePlanIds.add(plan.framePlanId);
      const clip = clipById.get(plan.clipId);
      if (clip === undefined || clip.durationMs !== plan.durationMs)
        context.addIssue({
          code: 'custom',
          path: ['framePlans', planIndex, 'clipId'],
          message:
            'Frame plan must reference a same-duration clip in this bundle.',
        });
    }
  });

const SourceGlbSchema = z.strictObject({
  id: SemanticIdSchema,
  classification: z.literal('source'),
  role: z.literal('glb'),
  mediaType: z.literal('model/gltf-binary'),
  byteLength: z.number().int().positive(),
  sha256: Sha256Schema,
  assetRevisionId: AssetRevisionIdSchema,
});

const TemporalSourceFrameSchema = z.strictObject({
  id: SemanticIdSchema,
  sequence: z.number().int().nonnegative().max(4_095),
  clipId: ClipIdSchema,
  direction: DirectionSchema,
  sampleTimeMs: IntegerMillisecondsSchema,
  framePlanKey: FramePlanKeySchema,
  classification: z.literal('source'),
  role: z.literal('temporal_frame'),
  mediaType: z.literal('image/png'),
  byteLength: z.number().int().positive(),
  sha256: Sha256Schema,
  width: z.literal(128),
  height: z.literal(128),
  transparent: z.literal(true),
});

const DerivedTemporalImageSchema = z.strictObject({
  id: SemanticIdSchema,
  classification: z.literal('derived'),
  role: z.enum(['pose_sheet', 'sprite_atlas']),
  mediaType: z.literal('image/png'),
  byteLength: z.number().int().positive(),
  sha256: Sha256Schema,
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  transparent: z.literal(true),
});

const ClipDeliveryMetadataSchema = z.strictObject({
  clipId: ClipIdSchema,
  clipDocumentSha256: Sha256Schema,
  action: SemanticIdSchema,
  direction: DirectionSchema,
  sourceGlbSha256: Sha256Schema,
  sourceFrameSha256s: z.array(Sha256Schema).min(2).max(2_048),
  frameRange: z.strictObject({
    startSequence: z.number().int().nonnegative().max(4_095),
    endSequence: z.number().int().nonnegative().max(4_095),
  }),
  rects: z
    .array(
      z.strictObject({
        frameId: SemanticIdSchema,
        x: z.number().int().nonnegative().max(16_383),
        y: z.number().int().nonnegative().max(16_383),
        width: z.literal(128),
        height: z.literal(128),
      }),
    )
    .min(2)
    .max(2_048),
  timing: z.strictObject({
    durationMs: z.number().int().positive().max(60_000),
    sampleTimesMs: z.array(IntegerMillisecondsSchema).min(2).max(2_048),
    frameDurationsMs: z
      .array(z.number().int().positive().max(60_000))
      .min(2)
      .max(2_048),
  }),
  loop: ClipLoopPolicySchema,
  pivot: z.strictObject({
    x: FiniteNumberSchema.min(0).max(128),
    y: FiniteNumberSchema.min(0).max(128),
  }),
  ground: z.strictObject({
    x: FiniteNumberSchema.min(0).max(128),
    y: FiniteNumberSchema.min(0).max(128),
  }),
  derivedImageIds: z.array(SemanticIdSchema).min(1).max(16),
});

export const TemporalDeliveryMetadataSchema = z
  .strictObject({
    contractId: z.literal(TEMPORAL_DELIVERY_CONTRACT_ID),
    deliveryId: DeliveryIdSchema,
    ...RigidAnimationBindingSchema.shape,
    renderProfile: RenderProfileSchema,
    sourceGlb: SourceGlbSchema,
    sourceFrames: z
      .array(TemporalSourceFrameSchema)
      .min(2)
      .max(RIGID_ANIMATION_BUDGETS.maximumSourceFramesPerDelivery),
    derivedImages: z
      .array(DerivedTemporalImageSchema)
      .min(1)
      .max(RIGID_ANIMATION_BUDGETS.maximumDerivedImagesPerDelivery),
    clips: z
      .array(ClipDeliveryMetadataSchema)
      .min(1)
      .max(RIGID_ANIMATION_BUDGETS.maximumClips * 8),
  })
  .superRefine((delivery, context) => {
    if (delivery.sourceGlb.assetRevisionId !== delivery.assetRevisionId)
      context.addIssue({
        code: 'custom',
        path: ['sourceGlb', 'assetRevisionId'],
        message: 'Source GLB must be bound to the delivered asset revision.',
      });

    const frameIds = new Set<string>();
    const framesByClipDirection = new Map<
      string,
      (typeof delivery.sourceFrames)[number][]
    >();
    for (const [index, frame] of delivery.sourceFrames.entries()) {
      if (frame.sequence !== index)
        context.addIssue({
          code: 'custom',
          path: ['sourceFrames', index, 'sequence'],
          message: 'Source frames must be individually ordered and contiguous.',
        });
      if (frameIds.has(frame.id))
        context.addIssue({
          code: 'custom',
          path: ['sourceFrames', index, 'id'],
          message: 'Source frame IDs must be unique.',
        });
      frameIds.add(frame.id);
      if (
        !bindingMatches(delivery, frame.framePlanKey) ||
        frame.framePlanKey.clipId !== frame.clipId ||
        frame.framePlanKey.direction !== frame.direction ||
        frame.framePlanKey.sampleTimeMs !== frame.sampleTimeMs ||
        frame.framePlanKey.renderProfile.id !== delivery.renderProfile.id ||
        frame.framePlanKey.renderProfile.version !==
          delivery.renderProfile.version
      )
        context.addIssue({
          code: 'custom',
          path: ['sourceFrames', index, 'framePlanKey'],
          message:
            'Source frame must preserve its full deterministic plan key.',
        });
      const groupKey = `${frame.clipId}:${frame.direction}`;
      const group = framesByClipDirection.get(groupKey) ?? [];
      group.push(frame);
      framesByClipDirection.set(groupKey, group);
    }

    const derivedIds = new Set<string>();
    for (const [index, image] of delivery.derivedImages.entries()) {
      if (derivedIds.has(image.id))
        context.addIssue({
          code: 'custom',
          path: ['derivedImages', index, 'id'],
          message: 'Derived image IDs must be unique.',
        });
      derivedIds.add(image.id);
    }

    const clipDirections = new Set<string>();
    for (const [clipIndex, clip] of delivery.clips.entries()) {
      const groupKey = `${clip.clipId}:${clip.direction}`;
      if (clipDirections.has(groupKey))
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex],
          message: 'Clip and direction metadata pairs must be unique.',
        });
      clipDirections.add(groupKey);
      const frames = framesByClipDirection.get(groupKey) ?? [];
      const digests = frames.map(({ sha256 }) => sha256);
      const sampleTimes = frames.map(({ sampleTimeMs }) => sampleTimeMs);
      if (
        frames.length < 2 ||
        new Set(sampleTimes).size < 2 ||
        new Set(digests).size < 2
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex],
          message:
            'Temporal delivery requires at least two distinct timed source frames per clip direction; static substitutions are rejected.',
        });
      if (
        clip.frameRange.startSequence > clip.frameRange.endSequence ||
        frames[0]?.sequence !== clip.frameRange.startSequence ||
        frames.at(-1)?.sequence !== clip.frameRange.endSequence ||
        frames.some(
          (frame, frameIndex) =>
            frame.sequence !== clip.frameRange.startSequence + frameIndex,
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'frameRange'],
          message: 'Frame range must exactly cover contiguous source frames.',
        });
      if (
        clip.sourceGlbSha256 !== delivery.sourceGlb.sha256 ||
        clip.sourceFrameSha256s.length !== digests.length ||
        clip.sourceFrameSha256s.some(
          (digest, digestIndex) => digest !== digests[digestIndex],
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'sourceFrameSha256s'],
          message: 'Clip source digests must exactly bind its GLB and frames.',
        });
      if (
        clip.rects.length !== frames.length ||
        clip.rects.some(
          (rect, rectIndex) => rect.frameId !== frames[rectIndex]?.id,
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'rects'],
          message: 'Clip rects must map one-to-one in source frame order.',
        });
      if (
        clip.timing.sampleTimesMs.length !== sampleTimes.length ||
        clip.timing.sampleTimesMs.some(
          (time, timeIndex) => time !== sampleTimes[timeIndex],
        ) ||
        clip.timing.sampleTimesMs.some(
          (time, timeIndex) =>
            timeIndex > 0 && time <= clip.timing.sampleTimesMs[timeIndex - 1]!,
        ) ||
        clip.timing.frameDurationsMs.length !== frames.length ||
        clip.timing.frameDurationsMs.reduce(
          (sum, duration) => sum + duration,
          0,
        ) !== clip.timing.durationMs
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'timing'],
          message:
            'Clip timing must be ordered, one duration per frame, and sum to durationMs.',
        });
      if (
        clip.loop.mode === 'loop' &&
        (clip.loop.startMs >= clip.loop.endMs ||
          clip.loop.endMs > clip.timing.durationMs)
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'loop'],
          message: 'Delivery loop range must be valid inside clip timing.',
        });
      for (const [imageIndex, imageId] of clip.derivedImageIds.entries())
        if (!derivedIds.has(imageId))
          context.addIssue({
            code: 'custom',
            path: ['clips', clipIndex, 'derivedImageIds', imageIndex],
            message:
              'Clip must reference a delivered pose sheet or sprite atlas.',
          });
    }

    for (const groupKey of framesByClipDirection.keys())
      if (!clipDirections.has(groupKey))
        context.addIssue({
          code: 'custom',
          path: ['sourceFrames'],
          message: 'Every source frame group requires clip metadata.',
        });
  });

export type RigDefinition = z.infer<typeof RigDefinitionSchema>;
export type PoseSnapshot = z.infer<typeof PoseSnapshotSchema>;
export type ClipDocument = z.infer<typeof ClipDocumentSchema>;
export type FramePlan = z.infer<typeof FramePlanSchema>;
export type RigidAnimationBundle = z.infer<typeof RigidAnimationBundleSchema>;
export type TemporalDeliveryMetadata = z.infer<
  typeof TemporalDeliveryMetadataSchema
>;

type CanonicalAnimationJson =
  | null
  | boolean
  | number
  | string
  | CanonicalAnimationJson[]
  | { [key: string]: CanonicalAnimationJson };

function canonicalizeAnimationValue(value: unknown): CanonicalAnimationJson {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError(
        'Canonical animation JSON cannot contain non-finite numbers.',
      );
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(canonicalizeAnimationValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalizeAnimationValue(child)]),
    );
  }
  throw new TypeError(
    `Canonical animation JSON does not support ${typeof value}.`,
  );
}

/** Canonical JSON for deterministic animation identities and evidence digests. */
export function canonicalRigidAnimationValue(value: unknown): string {
  return `${JSON.stringify(canonicalizeAnimationValue(value), null, 2)}\n`;
}

/** Browser-safe SHA-256 of canonical animation contract bytes. */
export async function digestRigidAnimationValue(
  value: unknown,
): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalRigidAnimationValue(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
