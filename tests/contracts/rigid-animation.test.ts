import { describe, expect, it } from 'vitest';

import {
  ClipDocumentSchema,
  FramePlanSchema,
  PoseSnapshotSchema,
  RigDefinitionSchema,
  RigidAnimationBundleSchema,
  TemporalDeliveryMetadataSchema,
  canonicalRigidAnimationValue,
  digestRigidAnimationValue,
} from '../../src/contracts/rigid-animation.js';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const HASH_C = 'c'.repeat(64);
const HASH_D = 'd'.repeat(64);
const binding = {
  assetRevisionId: `revision.${HASH_A}` as const,
  morphologyRevisionId: `morphology.${HASH_B}` as const,
  rigSignature: `rig.${HASH_C}` as const,
  equipmentSignature: `equipment.${HASH_D}` as const,
};
const renderProfile = {
  id: 'fantasy.sprite.orthographic.v1' as const,
  version: '1.0.0' as const,
};

const rigFixture = () => ({
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
});

const poseFixture = (id: string, angle = 0) => ({
  contractId: 'forge-pose-snapshot/v1' as const,
  poseSnapshotId: `pose.${id.repeat(64)}`,
  ...binding,
  channels:
    angle === 0
      ? []
      : [
          { jointId: 'shoulder.left', valueDegrees: angle },
          { jointId: 'shoulder.right', valueDegrees: -angle },
        ],
  rootMotion: { offset: [0, 0, 0], yawDegrees: 0 },
});

const clipFixture = () => ({
  contractId: 'forge-clip-document/v1' as const,
  clipId: `clip.${'1'.repeat(64)}`,
  action: 'idle.breathe',
  ...binding,
  durationMs: 400,
  interpolation: 'linear' as const,
  rootAnchorPolicy: 'locked' as const,
  loop: { mode: 'loop' as const, startMs: 0, endMs: 400 },
  keyframes: [
    {
      id: 'keyframe.idle.start',
      timeMs: 0,
      poseSnapshotId: `pose.${'2'.repeat(64)}`,
    },
    {
      id: 'keyframe.idle.middle',
      timeMs: 200,
      poseSnapshotId: `pose.${'3'.repeat(64)}`,
    },
    {
      id: 'keyframe.idle.end',
      timeMs: 400,
      poseSnapshotId: `pose.${'2'.repeat(64)}`,
    },
  ],
});

const frameKey = (sampleTimeMs: number) => ({
  ...binding,
  clipId: `clip.${'1'.repeat(64)}`,
  sampleTimeMs,
  renderProfile,
  direction: 'N' as const,
  seed: 42,
});

const framePlanFixture = () => ({
  contractId: 'forge-frame-plan/v1' as const,
  framePlanId: `frame-plan.${'4'.repeat(64)}`,
  ...binding,
  clipId: `clip.${'1'.repeat(64)}`,
  durationMs: 400,
  renderProfile,
  seed: 42,
  frames: [0, 100, 200, 300].map((sampleTimeMs, sequence) => ({
    id: `frame.idle.n.${sequence}`,
    sequence,
    key: frameKey(sampleTimeMs),
    output: {
      mediaType: 'image/png' as const,
      width: 128 as const,
      height: 128 as const,
      transparent: true as const,
    },
  })),
});

const bundleFixture = () => ({
  contractId: 'forge-rigid-animation-bundle/v1' as const,
  rig: rigFixture(),
  poses: [poseFixture('2'), poseFixture('3', 20)],
  clips: [clipFixture()],
  framePlans: [framePlanFixture()],
});

const deliveryFixture = () => ({
  contractId: 'forge-temporal-delivery/v1' as const,
  deliveryId: `delivery.${'5'.repeat(64)}`,
  ...binding,
  renderProfile,
  sourceGlb: {
    id: 'source.guard.glb',
    classification: 'source' as const,
    role: 'glb' as const,
    mediaType: 'model/gltf-binary' as const,
    byteLength: 4096,
    sha256: HASH_A,
    assetRevisionId: binding.assetRevisionId,
  },
  sourceFrames: [0, 100, 200, 300].map((sampleTimeMs, sequence) => ({
    id: `source.idle.n.${sequence}`,
    sequence,
    clipId: `clip.${'1'.repeat(64)}`,
    direction: 'N' as const,
    sampleTimeMs,
    framePlanKey: frameKey(sampleTimeMs),
    classification: 'source' as const,
    role: 'temporal_frame' as const,
    mediaType: 'image/png' as const,
    byteLength: 1024 + sequence,
    sha256: String(sequence + 6).repeat(64),
    width: 128 as const,
    height: 128 as const,
    transparent: true as const,
  })),
  derivedImages: [
    {
      id: 'derived.idle.pose-sheet',
      classification: 'derived' as const,
      role: 'pose_sheet' as const,
      mediaType: 'image/png' as const,
      byteLength: 8192,
      sha256: HASH_B,
      width: 512,
      height: 128,
      transparent: true,
    },
  ],
  clips: [
    {
      clipId: `clip.${'1'.repeat(64)}`,
      clipDocumentSha256: HASH_C,
      action: 'idle.breathe',
      direction: 'N' as const,
      sourceGlbSha256: HASH_A,
      sourceFrameSha256s: ['6', '7', '8', '9'].map((value) => value.repeat(64)),
      frameRange: { startSequence: 0, endSequence: 3 },
      rects: [0, 1, 2, 3].map((sequence) => ({
        frameId: `source.idle.n.${sequence}`,
        x: sequence * 128,
        y: 0,
        width: 128 as const,
        height: 128 as const,
      })),
      timing: {
        durationMs: 400,
        sampleTimesMs: [0, 100, 200, 300],
        frameDurationsMs: [100, 100, 100, 100],
      },
      loop: { mode: 'loop' as const, startMs: 0, endMs: 400 },
      pivot: { x: 64, y: 96 },
      ground: { x: 64, y: 112 },
      derivedImageIds: ['derived.idle.pose-sheet'],
    },
  ],
});

const expectRejectedWith = (
  schema: {
    safeParse(value: unknown): {
      success: boolean;
      error?: { issues: readonly { message: string }[] };
    };
  },
  value: unknown,
  message: string,
) => {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
};

describe('rigid animation v1 contracts', () => {
  it('accepts bound rig, sparse poses, clip, and deterministic warm-session frame plan', () => {
    expect(RigDefinitionSchema.safeParse(rigFixture()).success).toBe(true);
    expect(PoseSnapshotSchema.safeParse(poseFixture('2')).success).toBe(true);
    expect(ClipDocumentSchema.safeParse(clipFixture()).success).toBe(true);
    expect(FramePlanSchema.safeParse(framePlanFixture()).success).toBe(true);
    expect(RigidAnimationBundleSchema.safeParse(bundleFixture()).success).toBe(
      true,
    );

    expect(framePlanFixture().frames[2]!.key).toEqual({
      ...binding,
      clipId: `clip.${'1'.repeat(64)}`,
      sampleTimeMs: 200,
      renderProfile,
      direction: 'N',
      seed: 42,
    });
  });

  it('rejects raw matrices, mesh/code/path fields, unknown channels, and nonfinite values', () => {
    const invalidValues = [
      { ...rigFixture(), sourcePath: '/tmp/rig.glb' },
      {
        ...poseFixture('2'),
        channels: [{ jointId: 'root', valueDegrees: 0, matrix: [1, 0, 0] }],
      },
      { ...clipFixture(), generatorCode: 'return vertices' },
      {
        ...poseFixture('2'),
        rootMotion: { offset: [0, Number.NaN, 0], yawDegrees: 0 },
      },
    ];

    expect(RigDefinitionSchema.safeParse(invalidValues[0]).success).toBe(false);
    expect(PoseSnapshotSchema.safeParse(invalidValues[1]).success).toBe(false);
    expect(ClipDocumentSchema.safeParse(invalidValues[2]).success).toBe(false);
    expect(PoseSnapshotSchema.safeParse(invalidValues[3]).success).toBe(false);
  });

  it('rejects stale signatures, unknown joints/poses, and duplicate filler identities', () => {
    const stale = bundleFixture();
    stale.poses[0]!.rigSignature = `rig.${'f'.repeat(64)}`;
    expect(RigidAnimationBundleSchema.safeParse(stale).success).toBe(false);

    const unknownJoint = bundleFixture();
    unknownJoint.poses[1]!.channels[0]!.jointId = 'wing.left';
    expect(RigidAnimationBundleSchema.safeParse(unknownJoint).success).toBe(
      false,
    );

    const duplicates = bundleFixture();
    duplicates.poses.push(structuredClone(duplicates.poses[0]!));
    expect(RigidAnimationBundleSchema.safeParse(duplicates).success).toBe(
      false,
    );
  });

  it('rejects invalid loops, timing, ordering, static-only samples, and budget overflow', () => {
    const invalidLoop = clipFixture();
    invalidLoop.loop = { mode: 'loop', startMs: 300, endMs: 200 };
    expect(ClipDocumentSchema.safeParse(invalidLoop).success).toBe(false);

    const unordered = clipFixture();
    unordered.keyframes[1]!.timeMs = 0;
    expect(ClipDocumentSchema.safeParse(unordered).success).toBe(false);

    const staticPlan = framePlanFixture();
    staticPlan.frames = [staticPlan.frames[0]!];
    expect(FramePlanSchema.safeParse(staticPlan).success).toBe(false);

    const tooManyChannels = poseFixture('2');
    tooManyChannels.channels = Array.from({ length: 65 }, (_, index) => ({
      jointId: `joint.${index}`,
      valueDegrees: 0,
    }));
    expect(PoseSnapshotSchema.safeParse(tooManyChannels).success).toBe(false);
  });

  it('rejects ambiguous or cyclic rig hierarchies and duplicate sparse channels', () => {
    const duplicateJoint = rigFixture();
    duplicateJoint.joints[2]!.id = duplicateJoint.joints[1]!.id;
    duplicateJoint.joints[2]!.partId = duplicateJoint.joints[1]!.partId;
    expectRejectedWith(
      RigDefinitionSchema,
      duplicateJoint,
      'Joint IDs must be unique.',
    );
    expectRejectedWith(
      RigDefinitionSchema,
      duplicateJoint,
      'A rigid part may be controlled by only one joint.',
    );

    const invalidRoot = rigFixture();
    Object.assign(invalidRoot.joints[0]!, {
      parentJointId: 'shoulder.left',
    });
    expectRejectedWith(
      RigDefinitionSchema,
      invalidRoot,
      'The declared root joint must exist and have no parent.',
    );

    const cyclic = rigFixture();
    cyclic.joints[1]!.parentJointId = 'shoulder.right';
    cyclic.joints[2]!.parentJointId = 'shoulder.left';
    expectRejectedWith(
      RigDefinitionSchema,
      cyclic,
      'Rig joint hierarchy must be acyclic.',
    );

    const unknownParent = rigFixture();
    unknownParent.joints[1]!.parentJointId = 'joint.missing';
    expectRejectedWith(
      RigDefinitionSchema,
      unknownParent,
      'Every non-root joint requires a known parent.',
    );

    const selfParent = rigFixture();
    selfParent.joints[1]!.parentJointId = selfParent.joints[1]!.id;
    expectRejectedWith(
      RigDefinitionSchema,
      selfParent,
      'A joint cannot parent itself.',
    );

    const invalidMirror = rigFixture();
    invalidMirror.joints[1]!.mirrorJointId = 'root';
    expectRejectedWith(
      RigDefinitionSchema,
      invalidMirror,
      'Mirror joints must be known, reciprocal, and share an axis.',
    );

    const duplicateChannel = poseFixture('2', 20);
    duplicateChannel.channels.push({ ...duplicateChannel.channels[0]! });
    expectRejectedWith(
      PoseSnapshotSchema,
      duplicateChannel,
      'Sparse pose channels may address a joint only once.',
    );
  });

  it('rejects incomplete clips and nondeterministic frame plans', () => {
    const missingStart = clipFixture();
    missingStart.keyframes[0]!.timeMs = 1;
    expectRejectedWith(
      ClipDocumentSchema,
      missingStart,
      'A clip must begin at integer time 0.',
    );

    const missingEnd = clipFixture();
    missingEnd.keyframes.at(-1)!.timeMs = 399;
    expectRejectedWith(
      ClipDocumentSchema,
      missingEnd,
      'A clip must end with a keyframe at durationMs.',
    );

    const duplicateKeyframe = clipFixture();
    duplicateKeyframe.keyframes[1]!.id = duplicateKeyframe.keyframes[0]!.id;
    expectRejectedWith(
      ClipDocumentSchema,
      duplicateKeyframe,
      'Keyframe IDs must be unique.',
    );

    const plan = framePlanFixture();
    plan.frames[1]!.sequence = 2;
    plan.frames[1]!.id = plan.frames[0]!.id;
    plan.frames[1]!.key = structuredClone(plan.frames[0]!.key);
    plan.frames[2]!.key.seed += 1;
    plan.frames[3]!.key.sampleTimeMs = plan.durationMs;
    expectRejectedWith(
      FramePlanSchema,
      plan,
      'Frame sequence must be contiguous and ordered from zero.',
    );
    expectRejectedWith(
      FramePlanSchema,
      plan,
      'Planned frame IDs must be unique.',
    );
    expectRejectedWith(
      FramePlanSchema,
      plan,
      'Frame plan keys must be unique by direction and sample time.',
    );
    expectRejectedWith(
      FramePlanSchema,
      plan,
      'Warm-session frame key must preserve asset, morphology, rig, equipment, clip, render profile, and seed bindings.',
    );
    expectRejectedWith(
      FramePlanSchema,
      plan,
      'Rendered sample time must be before clip duration.',
    );
  });

  it('rejects stale and dangling bundle references across every document type', () => {
    const bundle = bundleFixture();
    bundle.clips[0]!.equipmentSignature = `equipment.${'e'.repeat(64)}`;
    bundle.clips[0]!.keyframes[1]!.poseSnapshotId = `pose.${'9'.repeat(64)}`;
    bundle.clips.push(structuredClone(bundle.clips[0]!));
    bundle.framePlans[0]!.morphologyRevisionId = `morphology.${'e'.repeat(64)}`;
    bundle.framePlans[0]!.durationMs = 401;
    bundle.framePlans.push(structuredClone(bundle.framePlans[0]!));
    expectRejectedWith(
      RigidAnimationBundleSchema,
      bundle,
      'Animation document has a stale asset, morphology, rig, or equipment signature.',
    );
    expectRejectedWith(
      RigidAnimationBundleSchema,
      bundle,
      'Clip identities must be unique; filler duplicates are rejected.',
    );
    expectRejectedWith(
      RigidAnimationBundleSchema,
      bundle,
      'Clip keyframe must reference a pose snapshot in this bundle.',
    );
    expectRejectedWith(
      RigidAnimationBundleSchema,
      bundle,
      'Frame-plan identities must be unique.',
    );
    expectRejectedWith(
      RigidAnimationBundleSchema,
      bundle,
      'Frame plan must reference a same-duration clip in this bundle.',
    );
  });

  it('accepts ordered individual source frames, source GLB, derived imagery, and complete clip metadata', () => {
    expect(
      TemporalDeliveryMetadataSchema.safeParse(deliveryFixture()).success,
    ).toBe(true);
  });

  it('rejects atlas-only, sheet-only, repeated static frames, and stale source digests', () => {
    const noFrames = deliveryFixture();
    noFrames.sourceFrames = [];
    expect(TemporalDeliveryMetadataSchema.safeParse(noFrames).success).toBe(
      false,
    );

    const noDerived = deliveryFixture();
    noDerived.derivedImages = [];
    expect(TemporalDeliveryMetadataSchema.safeParse(noDerived).success).toBe(
      false,
    );

    const staticFrames = deliveryFixture();
    for (const frame of staticFrames.sourceFrames) frame.sha256 = HASH_D;
    expect(TemporalDeliveryMetadataSchema.safeParse(staticFrames).success).toBe(
      false,
    );

    const staleDigest = deliveryFixture();
    staleDigest.clips[0]!.sourceFrameSha256s[2] = HASH_D;
    expect(TemporalDeliveryMetadataSchema.safeParse(staleDigest).success).toBe(
      false,
    );
  });

  it('rejects inconsistent temporal source, atlas, timing, loop, and coverage metadata', () => {
    const delivery = deliveryFixture();
    delivery.sourceGlb.assetRevisionId = `revision.${'e'.repeat(64)}`;
    delivery.sourceFrames[1]!.sequence = 2;
    delivery.sourceFrames[1]!.id = delivery.sourceFrames[0]!.id;
    delivery.sourceFrames[1]!.framePlanKey.equipmentSignature = `equipment.${'e'.repeat(64)}`;
    delivery.derivedImages.push(structuredClone(delivery.derivedImages[0]!));
    delivery.clips[0]!.frameRange.endSequence = 2;
    delivery.clips[0]!.rects[1]!.frameId = 'source.wrong.frame';
    delivery.clips[0]!.timing.sampleTimesMs[1] = 0;
    delivery.clips[0]!.timing.frameDurationsMs[3] = 99;
    delivery.clips[0]!.loop = { mode: 'loop', startMs: 300, endMs: 500 };
    delivery.clips[0]!.derivedImageIds = ['derived.missing.pose-sheet'];

    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Source GLB must be bound to the delivered asset revision.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Source frames must be individually ordered and contiguous.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Source frame IDs must be unique.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Source frame must preserve its full deterministic plan key.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Derived image IDs must be unique.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Frame range must exactly cover contiguous source frames.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Clip rects must map one-to-one in source frame order.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Clip timing must be ordered, one duration per frame, and sum to durationMs.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Delivery loop range must be valid inside clip timing.',
    );
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      delivery,
      'Clip must reference a delivered pose sheet or sprite atlas.',
    );
  });

  it('rejects duplicate clip metadata and source-frame groups without metadata', () => {
    const duplicateClip = deliveryFixture();
    duplicateClip.clips.push(structuredClone(duplicateClip.clips[0]!));
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      duplicateClip,
      'Clip and direction metadata pairs must be unique.',
    );

    const uncoveredFrames = deliveryFixture();
    for (const [index, frame] of uncoveredFrames.sourceFrames.entries()) {
      Object.assign(frame, {
        direction: 'S' as const,
        id: `source.idle.s.${index}`,
        framePlanKey: {
          ...frame.framePlanKey,
          direction: 'S' as const,
        },
      });
    }
    expectRejectedWith(
      TemporalDeliveryMetadataSchema,
      uncoveredFrames,
      'Every source frame group requires clip metadata.',
    );
  });

  it('canonicalizes and digests equivalent temporal metadata deterministically', async () => {
    const first = deliveryFixture();
    const second = structuredClone(first);
    expect(canonicalRigidAnimationValue(first)).toBe(
      canonicalRigidAnimationValue(second),
    );
    expect(await digestRigidAnimationValue(first)).toBe(
      await digestRigidAnimationValue(second),
    );
    expect(await digestRigidAnimationValue(first)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalizes negative zero and rejects unsupported canonical values', () => {
    expect(canonicalRigidAnimationValue({ value: -0 })).toBe(
      '{\n  "value": 0\n}\n',
    );
    expect(() => canonicalRigidAnimationValue(Number.NaN)).toThrow(
      'Canonical animation JSON cannot contain non-finite numbers.',
    );
    expect(() => canonicalRigidAnimationValue(Symbol('invalid'))).toThrow(
      'Canonical animation JSON does not support symbol.',
    );
  });
});
