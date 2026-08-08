import { describe, expect, it } from 'vitest';

import { createPoseLibrary } from '../../src/contracts/pose-library.js';
import { createRigidRigProfileV2 } from '../../src/contracts/rigid-rig-v2.js';
import {
  compileReusablePoseLibrary,
  createMirroredReusablePose,
} from '../../src/animation/reusable-pose-authoring.js';
import { validRigPayload } from '../contracts/rig-v2-fixture.js';

const hex = (character: string) => character.repeat(64);

async function fixture() {
  const rig = await createRigidRigProfileV2(validRigPayload());
  const library = await createPoseLibrary({
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
      {
        semanticId: 'salute.left',
        referenceIds: ['reference.guard'],
        tags: ['salute'],
        channels: [
          { jointId: 'joint.arm.left', dofId: 'raise', valueDegrees: -80 },
          { jointId: 'joint.arm.left', dofId: 'splay', valueDegrees: 12 },
        ],
        contacts: [
          {
            id: 'hand.support',
            partId: 'arm.left',
            kind: 'supported',
            target: 'equipment',
          },
        ],
        root: { policy: 'authored_translation', translation: [0.1, 0, 0] },
        equipmentSlots: [
          {
            slotId: 'shield.hand',
            partId: 'arm.left',
            state: 'equipped',
            revisionId: `revision.${hex('5')}`,
          },
        ],
        mirrorPolicy: 'asymmetric',
        asymmetryReason: 'Source pose is mirrored by the authoring helper.',
        asymmetryReferenceIds: ['reference.guard'],
      },
    ],
  });
  return { rig, library };
}

async function reidentify(
  library: Awaited<ReturnType<typeof createPoseLibrary>>,
) {
  const { libraryId: _libraryId, ...payload } = structuredClone(library);
  void _libraryId;
  return createPoseLibrary(payload);
}

describe('reusable pose authoring', () => {
  it('compiles sparse authored channels into deterministic rest-filled joint state', async () => {
    const { rig, library } = await fixture();
    const compiled = await compileReusablePoseLibrary(library, rig);
    expect(compiled.libraryId).toBe(library.libraryId);
    expect(compiled.poses[0]!.channels).toEqual([
      { jointId: 'joint.root', dofId: 'yaw', valueDegrees: 0, source: 'rest' },
      {
        jointId: 'joint.arm.left',
        dofId: 'raise',
        valueDegrees: -80,
        source: 'authored',
      },
      {
        jointId: 'joint.arm.left',
        dofId: 'splay',
        valueDegrees: 12,
        source: 'authored',
      },
      {
        jointId: 'joint.arm.right',
        dofId: 'raise',
        valueDegrees: 0,
        source: 'rest',
      },
      {
        jointId: 'joint.arm.right',
        dofId: 'splay',
        valueDegrees: 0,
        source: 'rest',
      },
    ]);
    expect(compiled.poses[0]).toMatchObject({
      root: library.poses[0]!.root,
      contacts: library.poses[0]!.contacts,
      equipmentSlots: library.poses[0]!.equipmentSlots,
    });
  });

  it('creates a deterministic mirrored pose through rig mirror metadata', async () => {
    const { rig, library } = await fixture();
    const rigSnapshot = structuredClone(rig);
    const poseSnapshot = structuredClone(library.poses[0]!);
    const pair = await createMirroredReusablePose(
      library,
      rig,
      'salute.left',
      'salute.right',
    );
    const mirrored = pair.mirror;
    expect(pair.source).toMatchObject({
      semanticId: 'salute.left',
      mirrorPolicy: 'symmetric',
      mirrorPoseId: 'salute.right',
      mirrorPlane: 'YZ',
    });
    expect(mirrored.channels).toEqual([
      { jointId: 'joint.arm.right', dofId: 'raise', valueDegrees: -80 },
      { jointId: 'joint.arm.right', dofId: 'splay', valueDegrees: -12 },
    ]);
    expect(mirrored.contacts[0]!.partId).toBe('arm.right');
    expect(mirrored.equipmentSlots[0]!.partId).toBe('arm.right');
    expect(mirrored.root).toEqual({
      policy: 'authored_translation',
      translation: [-0.1, 0, 0],
    });
    const { libraryId: _libraryId, ...payload } = library;
    void _libraryId;
    const withPair = await createPoseLibrary({
      ...payload,
      poses: [pair.source, pair.mirror],
    });
    await expect(
      compileReusablePoseLibrary(withPair, rig),
    ).resolves.toMatchObject({ libraryId: withPair.libraryId });
    expect(rig).toEqual(rigSnapshot);
    expect(library.poses[0]).toEqual(poseSnapshot);
  });

  it('mirrors every root policy, contact normal, and unmapped part deterministically', async () => {
    const { rig, library } = await fixture();
    const base = structuredClone(library.poses[0]!);
    base.contacts[0]!.normal = [1, 0, 0];
    base.contacts.push({
      id: 'root.support',
      partId: 'body.root',
      kind: 'supported',
      target: 'equipment',
    });
    base.equipmentSlots.push({
      slotId: 'body.marker',
      partId: 'body.root',
      state: 'hidden',
      revisionId: `revision.${hex('6')}`,
    });
    const snapshot = structuredClone(base);

    const libraryFor = async (pose: typeof base) => {
      const candidate = structuredClone(library);
      candidate.poses = [pose];
      return reidentify(candidate);
    };
    const locked = (
      await createMirroredReusablePose(
        await libraryFor({ ...base, root: { policy: 'locked' } }),
        rig,
        'salute.left',
        'mirror.locked',
      )
    ).mirror;
    const inPlace = (
      await createMirroredReusablePose(
        await libraryFor({
          ...base,
          root: { policy: 'in_place', yawDegrees: 30 },
        }),
        rig,
        'salute.left',
        'mirror.in-place',
      )
    ).mirror;
    const translatedAndYawed = (
      await createMirroredReusablePose(
        await libraryFor({
          ...base,
          root: {
            policy: 'authored_translation_and_yaw',
            translation: [0.25, 1, -2],
            yawDegrees: -45,
          },
        }),
        rig,
        'salute.left',
        'mirror.translated-yaw',
      )
    ).mirror;

    expect(locked.root).toEqual({ policy: 'locked' });
    expect(inPlace.root).toEqual({ policy: 'in_place', yawDegrees: -30 });
    expect(translatedAndYawed.root).toEqual({
      policy: 'authored_translation_and_yaw',
      translation: [-0.25, 1, -2],
      yawDegrees: 45,
    });
    expect(locked.contacts).toEqual([
      expect.objectContaining({
        id: 'hand.support',
        partId: 'arm.right',
        normal: [-1, 0, 0],
      }),
      expect.objectContaining({ id: 'root.support', partId: 'body.root' }),
    ]);
    expect(
      locked.equipmentSlots.find(({ slotId }) => slotId === 'body.marker'),
    ).toMatchObject({ slotId: 'body.marker', partId: 'body.root' });
    expect(base).toEqual(snapshot);
  });

  it('rejects channels without complete mirror metadata without mutating inputs', async () => {
    const { rig, library } = await fixture();
    const pose = structuredClone(library.poses[0]!);
    pose.channels = [{ jointId: 'joint.root', dofId: 'yaw', valueDegrees: 15 }];
    const poseSnapshot = structuredClone(pose);
    const rigSnapshot = structuredClone(rig);
    const candidate = structuredClone(library);
    candidate.poses = [pose];
    const identified = await reidentify(candidate);
    await expect(
      createMirroredReusablePose(
        identified,
        rig,
        'salute.left',
        'mirror.invalid',
      ),
    ).rejects.toMatchObject({
      code: 'MIRROR_UNAVAILABLE',
      path: ['poseLibrary', 'poses', 0, 'channels', 0, 'jointId'],
    });
    expect(pose).toEqual(poseSnapshot);
    expect(rig).toEqual(rigSnapshot);
  });

  it('rejects invalid bindings and limits without mutating inputs', async () => {
    const { rig, library } = await fixture();
    const snapshot = structuredClone(library);
    library.poses[0]!.channels[0]!.valueDegrees = 170;
    await expect(
      compileReusablePoseLibrary(await reidentify(library), rig),
    ).rejects.toThrow(/exceeds limits/);
    library.poses[0]!.channels[0]!.valueDegrees =
      snapshot.poses[0]!.channels[0]!.valueDegrees;
    expect(library).toEqual(snapshot);

    const wrongRigPayload = validRigPayload();
    wrongRigPayload.equipmentSignature = `equipment.${hex('f')}`;
    const wrongRig = await createRigidRigProfileV2(wrongRigPayload);
    await expect(compileReusablePoseLibrary(library, wrongRig)).rejects.toThrow(
      /binding/,
    );
    expect(library).toEqual(snapshot);
  });

  it('rejects invalid rig, reference, mirror, contact, and equipment bindings', async () => {
    const { rig, library } = await fixture();
    const rigSnapshot = structuredClone(rig);
    const librarySnapshot = structuredClone(library);

    const invalidRig = structuredClone(rig);
    invalidRig.rootJointId = 'joint.missing';
    await expect(
      compileReusablePoseLibrary(library, invalidRig),
    ).rejects.toThrow();

    const unknownReference = structuredClone(library);
    unknownReference.poses[0]!.referenceIds = ['reference.missing'];
    await expect(
      compileReusablePoseLibrary(unknownReference, rig),
    ).rejects.toMatchObject({ code: 'POSE_LIBRARY_IDENTITY_MISMATCH' });

    const invalidMirror = structuredClone(library);
    invalidMirror.poses[0]!.mirrorPolicy = 'symmetric';
    invalidMirror.poses[0]!.mirrorPoseId = 'pose.missing';
    invalidMirror.poses[0]!.mirrorPlane = 'YZ';
    delete invalidMirror.poses[0]!.asymmetryReason;
    delete invalidMirror.poses[0]!.asymmetryReferenceIds;
    await expect(
      compileReusablePoseLibrary(invalidMirror, rig),
    ).rejects.toMatchObject({ code: 'POSE_LIBRARY_IDENTITY_MISMATCH' });

    const invalidContact = structuredClone(library);
    invalidContact.poses[0]!.contacts[0]!.partId = 'part.missing';
    await expect(
      compileReusablePoseLibrary(await reidentify(invalidContact), rig),
    ).rejects.toThrow(/contact/i);

    const invalidEquipment = structuredClone(library);
    invalidEquipment.poses[0]!.equipmentSlots[0]!.partId = 'part.missing';
    await expect(
      compileReusablePoseLibrary(await reidentify(invalidEquipment), rig),
    ).rejects.toThrow(/equipment/i);

    expect(rig).toEqual(rigSnapshot);
    expect(library).toEqual(librarySnapshot);
  });

  it('rejects stale rig and library identities before compiling semantics', async () => {
    const { rig, library } = await fixture();
    const staleLibrary = structuredClone(library);
    staleLibrary.poses[0]!.tags.push('mutated-after-identification');
    await expect(
      compileReusablePoseLibrary(staleLibrary, rig),
    ).rejects.toMatchObject({ code: 'POSE_LIBRARY_IDENTITY_MISMATCH' });

    const staleRig = structuredClone(rig);
    staleRig.assemblySignature = `assembly.${hex('f')}`;
    await expect(
      compileReusablePoseLibrary(library, staleRig),
    ).rejects.toMatchObject({ code: 'RIG_IDENTITY_MISMATCH' });

    const staleAndSchemaInvalid = structuredClone(library);
    staleAndSchemaInvalid.poses[0]!.contacts[0]!.normal = [2, 0, 0];
    await expect(
      createMirroredReusablePose(
        staleAndSchemaInvalid,
        rig,
        'salute.left',
        'salute.right',
      ),
    ).rejects.toMatchObject({
      code: 'POSE_LIBRARY_IDENTITY_MISMATCH',
      path: ['poseLibrary', 'libraryId'],
    });
  });

  it('does not mirror channels from explicitly asymmetric joints', async () => {
    const rigPayload = validRigPayload();
    rigPayload.joints = rigPayload.joints.map((joint) => {
      if (joint.mirrorPolicy !== 'paired') return joint;
      const { mirrorJointId: _mirrorJointId, ...withoutMirror } = joint;
      void _mirrorJointId;
      return {
        ...withoutMirror,
        mirrorPolicy: 'asymmetric' as const,
        asymmetryReason: 'The limb joint is intentionally one-sided.',
        dofs: joint.dofs.map((dof) => {
          const {
            mirrorDofId: _mirrorDofId,
            mirrorSign: _mirrorSign,
            ...withoutDofMirror
          } = dof;
          void _mirrorDofId;
          void _mirrorSign;
          return withoutDofMirror;
        }),
      };
    });
    const rig = await createRigidRigProfileV2(rigPayload);
    const { library } = await fixture();
    const { libraryId: _libraryId, ...payload } = structuredClone(library);
    void _libraryId;
    payload.binding = {
      assetRevisionId: rig.assetRevisionId,
      morphologyRevisionId: rig.morphologyRevisionId,
      rigProfileId: rig.profileId,
      equipmentSignature: rig.equipmentSignature,
    };
    const rebound = await createPoseLibrary(payload);

    await expect(
      createMirroredReusablePose(rebound, rig, 'salute.left', 'salute.right'),
    ).rejects.toMatchObject({
      code: 'MIRROR_UNAVAILABLE',
      path: ['poseLibrary', 'poses', 0, 'channels', 0, 'jointId'],
    });
  });

  it('rejects asymmetric assembly parts during direct pose mirroring', async () => {
    const payload = validRigPayload();
    payload.assemblyHierarchy.push({
      partId: 'cloak.pin',
      parentPartId: 'body.root',
      mirrorPolicy: 'asymmetric',
      asymmetryReason: 'The cloak pin is intentionally worn only on the left.',
    });
    const rig = await createRigidRigProfileV2(payload);
    const { library } = await fixture();
    const { libraryId: _libraryId, ...libraryPayload } =
      structuredClone(library);
    void _libraryId;
    libraryPayload.binding = {
      assetRevisionId: rig.assetRevisionId,
      morphologyRevisionId: rig.morphologyRevisionId,
      rigProfileId: rig.profileId,
      equipmentSignature: rig.equipmentSignature,
    };
    libraryPayload.poses[0]!.contacts[0]!.partId = 'cloak.pin';
    const reboundLibrary = await createPoseLibrary(libraryPayload);

    await expect(
      createMirroredReusablePose(
        reboundLibrary,
        rig,
        'salute.left',
        'mirror.asymmetric',
      ),
    ).rejects.toMatchObject({
      code: 'MIRROR_UNAVAILABLE',
      path: ['poseLibrary', 'poses', 0, 'contacts', 0, 'partId'],
    });

    libraryPayload.poses[0]!.contacts[0]!.partId = 'body.root';
    libraryPayload.poses[0]!.equipmentSlots[0]!.partId = 'cloak.pin';
    const equipmentLibrary = await createPoseLibrary(libraryPayload);
    await expect(
      createMirroredReusablePose(
        equipmentLibrary,
        rig,
        'salute.left',
        'mirror.asymmetric-equipment',
      ),
    ).rejects.toMatchObject({
      code: 'MIRROR_UNAVAILABLE',
      path: ['poseLibrary', 'poses', 0, 'equipmentSlots', 0, 'partId'],
    });
  });
});
