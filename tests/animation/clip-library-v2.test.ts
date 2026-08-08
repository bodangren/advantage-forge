import { describe, expect, it } from 'vitest';

import {
  createClipLibrary,
  type ClipLibraryPayload,
} from '../../src/contracts/clip-library-v2.js';
import { createPoseLibrary } from '../../src/contracts/pose-library.js';
import { createRigidRigProfileV2 } from '../../src/contracts/rigid-rig-v2.js';
import {
  evaluateClipBatch,
  evaluateClipSample,
  planClipSampleTimes,
  validateClipLibraryAgainstSources,
} from '../../src/animation/clip-library-v2.js';
import { validRigPayload } from '../contracts/rig-v2-fixture.js';

const hex = (character: string) => character.repeat(64);

async function fixture() {
  const rig = await createRigidRigProfileV2(validRigPayload());
  const contact = {
    id: 'foot.plant',
    partId: 'body.root',
    kind: 'planted' as const,
    target: 'ground' as const,
    normal: [0, 1, 0] as [number, number, number],
  };
  const equipment = {
    slotId: 'weapon.hand',
    partId: 'arm.left',
    state: 'equipped' as const,
    revisionId: `revision.${hex('6')}` as const,
  };
  const pose = (
    semanticId: string,
    root:
      | { policy: 'locked' }
      | { policy: 'in_place'; yawDegrees: number }
      | {
          policy: 'authored_translation_and_yaw';
          translation: [number, number, number];
          yawDegrees: number;
        },
    channels: {
      jointId: string;
      dofId: string;
      valueDegrees: number;
    }[],
  ) => ({
    semanticId,
    referenceIds: ['reference.guard'],
    tags: ['clip-fixture'],
    channels,
    contacts: [structuredClone(contact)],
    root,
    equipmentSlots: [structuredClone(equipment)],
    mirrorPolicy: 'asymmetric' as const,
    asymmetryReason: 'Evaluator fixture is intentionally unpaired.',
    asymmetryReferenceIds: ['reference.guard'],
  });
  const poses = await createPoseLibrary({
    contractId: 'forge-pose-library/v1',
    binding: {
      assetRevisionId: rig.assetRevisionId,
      morphologyRevisionId: rig.morphologyRevisionId,
      rigProfileId: rig.profileId,
      equipmentSignature: rig.equipmentSignature,
    },
    references: [
      {
        referenceId: 'reference.guard',
        sourceKind: 'built_in',
        sourceDigest: hex('a'),
        sourceArtifactDigest: hex('b'),
      },
    ],
    poses: [
      pose('locked.start', { policy: 'locked' }, []),
      pose('locked.accent', { policy: 'locked' }, [
        {
          jointId: 'joint.arm.left',
          dofId: 'raise',
          valueDegrees: 30,
        },
      ]),
      pose(
        'move.start',
        {
          policy: 'authored_translation_and_yaw',
          translation: [0, 0, 0],
          yawDegrees: 0,
        },
        [],
      ),
      pose(
        'move.end',
        {
          policy: 'authored_translation_and_yaw',
          translation: [2, 0, 0],
          yawDegrees: 90,
        },
        [
          {
            jointId: 'joint.arm.left',
            dofId: 'raise',
            valueDegrees: 90,
          },
          {
            jointId: 'joint.arm.left',
            dofId: 'splay',
            valueDegrees: 20,
          },
        ],
      ),
      pose('step.old', { policy: 'in_place', yawDegrees: 0 }, []),
      pose('step.new', { policy: 'in_place', yawDegrees: 45 }, [
        {
          jointId: 'joint.arm.left',
          dofId: 'raise',
          valueDegrees: 60,
        },
      ]),
      {
        semanticId: 'wave.left',
        referenceIds: ['reference.guard'],
        tags: ['clip-fixture'],
        channels: [
          {
            jointId: 'joint.arm.left',
            dofId: 'raise',
            valueDegrees: 30,
          },
          {
            jointId: 'joint.arm.left',
            dofId: 'splay',
            valueDegrees: 10,
          },
        ],
        contacts: [
          {
            id: 'arm.support',
            partId: 'arm.left',
            kind: 'supported' as const,
            target: 'equipment' as const,
            normal: [1, 0, 0] as [number, number, number],
          },
        ],
        root: { policy: 'locked' as const },
        equipmentSlots: [
          {
            ...structuredClone(equipment),
            partId: 'arm.left',
            state: 'hidden' as const,
          },
        ],
        mirrorPolicy: 'symmetric' as const,
        mirrorPoseId: 'wave.right',
        mirrorPlane: 'YZ' as const,
      },
      {
        semanticId: 'wave.right',
        referenceIds: ['reference.guard'],
        tags: ['clip-fixture'],
        channels: [
          {
            jointId: 'joint.arm.right',
            dofId: 'raise',
            valueDegrees: 30,
          },
          {
            jointId: 'joint.arm.right',
            dofId: 'splay',
            valueDegrees: -10,
          },
        ],
        contacts: [
          {
            id: 'arm.support',
            partId: 'arm.right',
            kind: 'supported' as const,
            target: 'equipment' as const,
            normal: [-1, 0, 0] as [number, number, number],
          },
        ],
        root: { policy: 'locked' as const },
        equipmentSlots: [
          {
            ...structuredClone(equipment),
            partId: 'arm.right',
            state: 'hidden' as const,
          },
        ],
        mirrorPolicy: 'symmetric' as const,
        mirrorPoseId: 'wave.left',
        mirrorPlane: 'YZ' as const,
      },
    ],
  });
  const payload: ClipLibraryPayload = {
    contractId: 'forge-clip-library/v1',
    binding: {
      ...poses.binding,
      poseLibraryId: poses.libraryId,
    },
    clips: [
      {
        semanticId: 'idle.loop',
        durationMs: 1_000,
        playback: 'loop',
        interpolation: 'linear',
        rootAnchorPolicy: 'locked',
        keyframes: [
          { timeMs: 0, poseId: 'locked.start' },
          { timeMs: 500, poseId: 'locked.accent' },
          { timeMs: 1_000, poseId: 'locked.start' },
        ],
        loop: {
          startTimeMs: 0,
          endTimeMs: 1_000,
          seamPolicy: 'continuous',
        },
        continuityHooks: [
          { kind: 'contact', atTimeMs: 500, contactId: 'foot.plant' },
          { kind: 'equipment', atTimeMs: 500, slotId: 'weapon.hand' },
        ],
      },
      {
        semanticId: 'move.once',
        durationMs: 1_000,
        playback: 'once',
        interpolation: 'linear',
        rootAnchorPolicy: 'authored_translation_and_yaw',
        keyframes: [
          { timeMs: 0, poseId: 'move.start' },
          { timeMs: 1_000, poseId: 'move.end' },
        ],
        continuityHooks: [],
      },
      {
        semanticId: 'step.once',
        durationMs: 1_000,
        playback: 'once',
        interpolation: 'step',
        rootAnchorPolicy: 'in_place',
        keyframes: [
          { timeMs: 0, poseId: 'step.old' },
          { timeMs: 500, poseId: 'step.new' },
          { timeMs: 1_000, poseId: 'step.new' },
        ],
        continuityHooks: [],
      },
    ],
  };
  const clips = await createClipLibrary(payload);
  return { rig, poses, clips, payload };
}

describe('v2 multi-DOF clip-library evaluation', () => {
  it('fills sparse rest values, composes ordered DOFs around pivots, and binds every assembly part', async () => {
    const { rig, poses, clips, payload } = await fixture();
    const sample = await evaluateClipSample(
      clips,
      rig,
      poses,
      'move.once',
      500,
    );

    expect(sample.dofs).toContainEqual({
      jointId: 'joint.arm.left',
      dofId: 'raise',
      valueDegrees: 45,
      source: 'interpolated',
    });
    expect(sample.dofs).toContainEqual({
      jointId: 'joint.arm.left',
      dofId: 'splay',
      valueDegrees: 10,
      source: 'interpolated',
    });
    expect(sample.dofs).toContainEqual({
      jointId: 'joint.arm.right',
      dofId: 'raise',
      valueDegrees: 0,
      source: 'rest',
    });
    expect(sample.root).toEqual({
      policy: 'authored_translation_and_yaw',
      translation: [1, 0, 0],
      yawDegrees: 45,
    });
    expect(sample.parts.map(({ partId }) => partId).sort()).toEqual(
      rig.assemblyHierarchy.map(({ partId }) => partId).sort(),
    );
    expect(
      sample.parts.find(({ partId }) => partId === 'arm.left')!.transform,
    ).not.toEqual(
      sample.parts.find(({ partId }) => partId === 'arm.right')!.transform,
    );

    const reorderedRigPayload = validRigPayload();
    for (const joint of reorderedRigPayload.joints.filter(({ id }) =>
      id.startsWith('joint.arm.'),
    )) {
      joint.dofs[0]!.order = 1;
      joint.dofs[1]!.order = 0;
      joint.rotationOrder = 'YXZ';
    }
    const reorderedRig = await createRigidRigProfileV2(reorderedRigPayload);
    const { libraryId: _poseLibraryId, ...reorderedPosePayload } =
      structuredClone(poses);
    void _poseLibraryId;
    reorderedPosePayload.binding.rigProfileId = reorderedRig.profileId;
    const reorderedPoses = await createPoseLibrary(reorderedPosePayload);
    const reorderedClipPayload = structuredClone(payload);
    reorderedClipPayload.binding.rigProfileId = reorderedRig.profileId;
    reorderedClipPayload.binding.poseLibraryId = reorderedPoses.libraryId;
    const reorderedClips = await createClipLibrary(reorderedClipPayload);
    const reorderedSample = await evaluateClipSample(
      reorderedClips,
      reorderedRig,
      reorderedPoses,
      'move.once',
      500,
    );
    expect(
      reorderedSample.parts.find(({ partId }) => partId === 'arm.left')!
        .transform.rotation,
    ).not.toEqual(
      sample.parts.find(({ partId }) => partId === 'arm.left')!.transform
        .rotation,
    );
  });

  it('uses right-continuous step boundaries and includes the explicit once terminal sample', async () => {
    const { rig, poses, clips } = await fixture();
    const before = await evaluateClipSample(
      clips,
      rig,
      poses,
      'step.once',
      499,
    );
    const boundary = await evaluateClipSample(
      clips,
      rig,
      poses,
      'step.once',
      500,
    );
    expect(before.activePoseId).toBe('step.old');
    expect(boundary.activePoseId).toBe('step.new');
    expect(boundary.root).toEqual({ policy: 'in_place', yawDegrees: 45 });

    const once = clips.clips.find(
      ({ semanticId }) => semanticId === 'move.once',
    )!;
    const times = planClipSampleTimes(once, 4);
    expect(times[0]).toBe(0);
    expect(times.at(-1)).toBe(1_000);
    expect(new Set(times).size).toBe(times.length);

    const longPayload = structuredClone((await fixture()).payload);
    longPayload.clips[1]!.durationMs = 600_000;
    longPayload.clips[1]!.keyframes[1]!.timeMs = 600_000;
    const longClip = (await createClipLibrary(longPayload)).clips.find(
      ({ semanticId }) => semanticId === 'move.once',
    )!;
    expect(() => planClipSampleTimes(longClip, 60)).toThrowError(
      expect.objectContaining({
        code: 'BUDGET_EXCEEDED',
        path: ['sampleTimesMs'],
      }),
    );
  });

  it('validates half-open loop seams, root anchors, and continuity hooks with exact paths', async () => {
    const { rig, poses, clips, payload } = await fixture();
    await expect(
      validateClipLibraryAgainstSources(clips, rig, poses),
    ).resolves.toBeUndefined();

    const invalidMirror = structuredClone(payload);
    invalidMirror.clips[0]!.continuityHooks.push({
      kind: 'mirror',
      poseId: 'wave.left',
      mirrorPoseId: 'wave.right',
    });
    await expect(createClipLibrary(invalidMirror)).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['clipLibrary', 'clips', 0, 'continuityHooks', 2, 'poseId'],
    });

    const invalidSeam = structuredClone(payload);
    invalidSeam.clips[0]!.keyframes[2]!.poseId = 'locked.accent';
    await expect(
      validateClipLibraryAgainstSources(
        await createClipLibrary(invalidSeam),
        rig,
        poses,
      ),
    ).rejects.toMatchObject({
      code: 'LOOP_SEAM_MISMATCH',
      path: ['clipLibrary', 'clips', 0, 'loop', 'seamPolicy'],
    });

    const wrongRoot = structuredClone(payload);
    wrongRoot.clips[1]!.rootAnchorPolicy = 'locked';
    await expect(
      validateClipLibraryAgainstSources(
        await createClipLibrary(wrongRoot),
        rig,
        poses,
      ),
    ).rejects.toMatchObject({
      code: 'ROOT_ANCHOR_MISMATCH',
      path: ['clipLibrary', 'clips', 1, 'keyframes', 0, 'poseId'],
    });

    const contactDrift = structuredClone(poses);
    contactDrift.poses.find(
      ({ semanticId }) => semanticId === 'locked.accent',
    )!.contacts[0]!.normal = [1, 0, 0];
    const { libraryId: _libraryId, ...posePayload } = contactDrift;
    void _libraryId;
    const reidentifiedPoses = await createPoseLibrary(posePayload);
    const rebound = structuredClone(payload);
    rebound.binding.poseLibraryId = reidentifiedPoses.libraryId;
    await expect(
      validateClipLibraryAgainstSources(
        await createClipLibrary(rebound),
        rig,
        reidentifiedPoses,
      ),
    ).rejects.toMatchObject({
      code: 'CONTACT_CONTINUITY_MISMATCH',
      path: ['clipLibrary', 'clips', 0, 'continuityHooks', 0, 'contactId'],
    });

    const equipmentDrift = structuredClone(poses);
    equipmentDrift.poses.find(
      ({ semanticId }) => semanticId === 'locked.accent',
    )!.equipmentSlots[0]!.state = 'stowed';
    const { libraryId: _equipmentLibraryId, ...equipmentPosePayload } =
      equipmentDrift;
    void _equipmentLibraryId;
    const equipmentPoses = await createPoseLibrary(equipmentPosePayload);
    const equipmentRebound = structuredClone(payload);
    equipmentRebound.binding.poseLibraryId = equipmentPoses.libraryId;
    await expect(
      validateClipLibraryAgainstSources(
        await createClipLibrary(equipmentRebound),
        rig,
        equipmentPoses,
      ),
    ).rejects.toMatchObject({
      code: 'EQUIPMENT_CONTINUITY_MISMATCH',
      path: ['clipLibrary', 'clips', 0, 'continuityHooks', 1, 'slotId'],
    });
  });

  it('keeps successful sibling identities stable during arbitrary bounded partial retry', async () => {
    const { rig, poses, clips } = await fixture();
    const isolated = await evaluateClipBatch(clips, rig, poses, [
      { clipId: 'move.once', sampleTimesMs: [0, 500, 1_000] },
    ]);
    const partial = await evaluateClipBatch(clips, rig, poses, [
      { clipId: 'missing.clip', sampleTimesMs: [0] },
      { clipId: 'move.once', sampleTimesMs: [0, 500, 1_000] },
      { clipId: 'step.once', sampleTimesMs: [0, 500, 1_000] },
      { clipId: 'idle.loop', sampleTimesMs: [1_001] },
      null as unknown as { clipId: string; sampleTimesMs: number[] },
      undefined as unknown as { clipId: string; sampleTimesMs: number[] },
    ]);

    expect(partial.successes).toHaveLength(2);
    expect(partial.failures).toMatchObject([
      {
        clipId: 'missing.clip',
        code: 'CLIP_NOT_FOUND',
        path: ['requests', 0, 'clipId'],
      },
      {
        clipId: 'idle.loop',
        code: 'SAMPLE_TIME_OUT_OF_RANGE',
        path: ['requests', 3, 'sampleTimeMs'],
      },
      {
        code: 'SCHEMA_INVALID',
        path: ['requests', 4],
      },
      {
        code: 'SCHEMA_INVALID',
        path: ['requests', 5],
      },
    ]);
    expect(partial.failures[2]).not.toHaveProperty('clipId');
    expect(partial.failures[3]).not.toHaveProperty('clipId');
    expect(
      partial.successes.find(({ clipId }) => clipId === 'move.once'),
    ).toEqual(isolated.successes[0]);
  });
});
