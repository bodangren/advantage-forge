import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  POSE_LIBRARY_BUDGETS,
  POSE_LIBRARY_CONTRACT_ID,
  PoseLibraryPayloadSchema,
  canonicalPoseLibraryPayload,
  createPoseApprovalReceipt,
  createPoseLibrary,
  validatePoseLibraryAgainstRig,
  verifyPoseApprovalReceiptIdentity,
  verifyPoseLibraryIdentity,
  type PoseLibraryPayload,
} from '../../src/contracts/pose-library.js';
import { createRigidRigProfileV2 } from '../../src/contracts/rigid-rig-v2.js';
import { validRigPayload } from './rig-v2-fixture.js';

const hex = (character: string) => character.repeat(64);

function validLibraryPayload(rigProfileId: string): PoseLibraryPayload {
  return {
    contractId: POSE_LIBRARY_CONTRACT_ID,
    binding: {
      assetRevisionId: `revision.${hex('1')}`,
      morphologyRevisionId: `morphology.${hex('2')}`,
      rigProfileId,
      equipmentSignature: `equipment.${hex('3')}`,
    },
    references: [
      {
        referenceId: 'reference.guard.approved',
        sourceKind: 'generated_approved',
        sourceDigest: hex('a'),
        sourceArtifactDigest: hex('c'),
        approvalReceipt: {
          receiptId:
            'approval-receipt.7c7fefc1deb334b7b253b9d5c78117faed5a17962917889a9e933b04730c94ca',
          authorityId: 'authority.kimi-webbridge',
          referenceId: 'reference.guard.approved',
          sourceDigest: hex('a'),
          sourceArtifactDigest: hex('c'),
          reviewerId: 'reviewer.kimi',
          decision: 'approved',
          scope: {
            assetRevisionId: `revision.${hex('1')}`,
            morphologyRevisionId: `morphology.${hex('2')}`,
            rigProfileId,
            equipmentSignature: `equipment.${hex('3')}`,
          },
          descriptorDigest: hex('b'),
          provenanceDigest: hex('d'),
          kimiEvidenceDigest: hex('e'),
          criteriaDigest: hex('f'),
          decidedAt: '2026-07-23T00:00:00.000Z',
          notes: 'Approved against the complete reference criteria.',
        },
      },
    ],
    poses: [
      {
        semanticId: 'wave.left',
        referenceIds: ['reference.guard.approved'],
        tags: ['upper-body', 'greeting'],
        channels: [
          { jointId: 'joint.arm.left', dofId: 'splay', valueDegrees: 10 },
          { jointId: 'joint.arm.left', dofId: 'raise', valueDegrees: -80 },
        ],
        contacts: [
          {
            id: 'arm.support',
            partId: 'arm.left',
            kind: 'supported',
            target: 'equipment',
            normal: [1, 0, 0],
          },
        ],
        root: {
          policy: 'authored_translation_and_yaw',
          translation: [0.1, 0, 0],
          yawDegrees: 10,
        },
        equipmentSlots: [
          {
            slotId: 'weapon.hand',
            partId: 'arm.left',
            state: 'hidden',
            revisionId: `revision.${hex('5')}`,
          },
        ],
        mirrorPolicy: 'symmetric',
        mirrorPoseId: 'wave.right',
        mirrorPlane: 'YZ',
      },
      {
        semanticId: 'wave.right',
        referenceIds: ['reference.guard.approved'],
        tags: ['greeting', 'upper-body'],
        channels: [
          { jointId: 'joint.arm.right', dofId: 'raise', valueDegrees: -80 },
          { jointId: 'joint.arm.right', dofId: 'splay', valueDegrees: -10 },
        ],
        contacts: [
          {
            id: 'arm.support',
            partId: 'arm.right',
            kind: 'supported',
            target: 'equipment',
            normal: [-1, 0, 0],
          },
        ],
        root: {
          policy: 'authored_translation_and_yaw',
          translation: [-0.1, 0, 0],
          yawDegrees: -10,
        },
        equipmentSlots: [
          {
            slotId: 'weapon.hand',
            partId: 'arm.right',
            state: 'hidden',
            revisionId: `revision.${hex('5')}`,
          },
        ],
        mirrorPolicy: 'symmetric',
        mirrorPoseId: 'wave.left',
        mirrorPlane: 'YZ',
      },
    ],
  };
}

describe('forge-pose-library/v1', () => {
  it('derives one identity across semantically unordered collections', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const first = validLibraryPayload(rig.profileId);
    const reordered = structuredClone(first);
    reordered.poses.reverse();
    reordered.poses[1]!.tags.reverse();
    reordered.poses[1]!.channels.reverse();

    expect((await createPoseLibrary(first)).libraryId).toBe(
      (await createPoseLibrary(reordered)).libraryId,
    );
  });

  it('validates channels, contacts, equipment, limits, and binding against the rig', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const validPayload = validLibraryPayload(rig.profileId);
    const valid = await createPoseLibrary(validPayload);
    await expect(
      validatePoseLibraryAgainstRig(valid, rig),
    ).resolves.toBeUndefined();

    const unknownDof = structuredClone(validPayload);
    unknownDof.poses[0]!.channels[0]!.dofId = 'missing';
    await expect(
      validatePoseLibraryAgainstRig(await createPoseLibrary(unknownDof), rig),
    ).rejects.toThrow(/unknown DOF/);

    const overLimit = structuredClone(validPayload);
    overLimit.poses[0]!.channels[0]!.valueDegrees = 100;
    await expect(
      validatePoseLibraryAgainstRig(await createPoseLibrary(overLimit), rig),
    ).rejects.toThrow(/exceeds limits/);

    const unknownContact = structuredClone(validPayload);
    unknownContact.poses[0]!.contacts[0]!.partId = 'part.missing';
    await expect(
      validatePoseLibraryAgainstRig(
        await createPoseLibrary(unknownContact),
        rig,
      ),
    ).rejects.toThrow(/contact/);

    const unknownEquipment = structuredClone(validPayload);
    unknownEquipment.poses[0]!.equipmentSlots[0]!.partId = 'part.missing';
    await expect(
      validatePoseLibraryAgainstRig(
        await createPoseLibrary(unknownEquipment),
        rig,
      ),
    ).rejects.toThrow(/equipment slot/);

    const wrongBinding = structuredClone(validPayload);
    wrongBinding.binding.equipmentSignature = `equipment.${hex('f')}`;
    wrongBinding.references[0] = {
      referenceId: 'reference.guard.approved',
      sourceKind: 'built_in',
      sourceDigest: hex('a'),
      sourceArtifactDigest: hex('c'),
    };
    await expect(
      validatePoseLibraryAgainstRig(await createPoseLibrary(wrongBinding), rig),
    ).rejects.toThrow(/binding/);
  });

  it('requires approved generated-reference provenance and reciprocal pose mirrors', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const unapproved = validLibraryPayload(rig.profileId);
    unapproved.references[0]!.approvalReceipt = undefined;
    expect(PoseLibraryPayloadSchema.safeParse(unapproved).success).toBe(false);

    const oneWayMirror = validLibraryPayload(rig.profileId);
    oneWayMirror.poses[1]!.mirrorPoseId = undefined;
    oneWayMirror.poses[1]!.mirrorPlane = undefined;
    expect(PoseLibraryPayloadSchema.safeParse(oneWayMirror).success).toBe(
      false,
    );

    const groundWithoutNormal = validLibraryPayload(rig.profileId);
    groundWithoutNormal.poses[0]!.contacts[0]!.target = 'ground';
    groundWithoutNormal.poses[0]!.contacts[0]!.normal = undefined;
    expect(
      PoseLibraryPayloadSchema.safeParse(groundWithoutNormal).success,
    ).toBe(false);

    const zeroNormal = validLibraryPayload(rig.profileId);
    zeroNormal.poses[0]!.contacts[0]!.normal = [0, 0, 0];
    expect(PoseLibraryPayloadSchema.safeParse(zeroNormal).success).toBe(false);

    const nonUnitNormal = validLibraryPayload(rig.profileId);
    nonUnitNormal.poses[0]!.contacts[0]!.normal = [0.5, 0, 0];
    expect(PoseLibraryPayloadSchema.safeParse(nonUnitNormal).success).toBe(
      false,
    );

    const wrongScope = validLibraryPayload(rig.profileId);
    wrongScope.references[0]!.approvalReceipt!.scope.equipmentSignature = `equipment.${hex('9')}`;
    expect(PoseLibraryPayloadSchema.safeParse(wrongScope).success).toBe(false);

    const unknownReference = validLibraryPayload(rig.profileId);
    unknownReference.poses[0]!.referenceIds = ['reference.missing'];
    expect(PoseLibraryPayloadSchema.safeParse(unknownReference).success).toBe(
      false,
    );
  });

  it('derives approval receipt identity and rejects stale receipt content', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const library = validLibraryPayload(rig.profileId);
    const receipt = library.references[0]!.approvalReceipt!;
    const { receiptId: _receiptId, ...payload } = receipt;
    void _receiptId;
    const derived = await createPoseApprovalReceipt(payload);
    expect(derived.receiptId).toBe(receipt.receiptId);
    expect(await verifyPoseApprovalReceiptIdentity(derived)).toBe(true);

    const stale = structuredClone(derived);
    stale.notes = 'Mutated after approval.';
    expect(await verifyPoseApprovalReceiptIdentity(stale)).toBe(false);
    library.references[0]!.approvalReceipt = stale;
    await expect(createPoseLibrary(library)).rejects.toMatchObject({
      code: 'APPROVAL_RECEIPT_IDENTITY_MISMATCH',
      path: ['poseLibrary', 'references', 0, 'approvalReceipt', 'receiptId'],
    });
  });

  it('does not let a recomputed outer library identity bless a stale nested approval receipt', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const library = await createPoseLibrary(validLibraryPayload(rig.profileId));
    const stale = structuredClone(library);
    stale.references[0]!.approvalReceipt!.notes =
      'Mutated after the immutable approval decision.';
    const { libraryId: _libraryId, ...payload } = stale;
    void _libraryId;
    stale.libraryId = `pose-library.${createHash('sha256')
      .update(canonicalPoseLibraryPayload(payload))
      .digest('hex')}`;

    expect(await verifyPoseLibraryIdentity(stale)).toBe(false);
    await expect(
      validatePoseLibraryAgainstRig(stale, rig),
    ).rejects.toMatchObject({
      code: 'APPROVAL_RECEIPT_IDENTITY_MISMATCH',
      path: ['poseLibrary', 'references', 0, 'approvalReceipt', 'receiptId'],
    });
  });

  it('content-addresses exact reference descriptor and source artifact approval', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    for (const field of [
      'referenceId',
      'sourceDigest',
      'sourceArtifactDigest',
    ] as const) {
      const payload = validLibraryPayload(rig.profileId);
      const receipt = payload.references[0]!.approvalReceipt!;
      if (field === 'referenceId') receipt.referenceId = 'reference.other';
      else receipt[field] = hex('9');
      await expect(createPoseLibrary(payload)).rejects.toMatchObject({
        code: 'PROVENANCE_MISMATCH',
        path: ['poseLibrary', 'references', 0, 'approvalReceipt'],
      });
    }
  });

  it('rejects stale rig and library identities before compatibility semantics or compilation', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const library = await createPoseLibrary(validLibraryPayload(rig.profileId));

    const staleLibrary = structuredClone(library);
    staleLibrary.poses[0]!.contacts[0]!.normal = [2, 0, 0];
    await expect(
      validatePoseLibraryAgainstRig(staleLibrary, rig),
    ).rejects.toMatchObject({ code: 'POSE_LIBRARY_IDENTITY_MISMATCH' });

    const staleRig = structuredClone(rig);
    staleRig.rootJointId = 'joint.missing';
    await expect(
      validatePoseLibraryAgainstRig(library, staleRig),
    ).rejects.toMatchObject({ code: 'RIG_IDENTITY_MISMATCH' });
  });

  it('mirrors contacts and equipment through unjointed assembly pairs and rejects asymmetric parts', async () => {
    const rigPayload = validRigPayload();
    rigPayload.assemblyHierarchy.push(
      {
        partId: 'hand.left',
        parentPartId: 'arm.left',
        mirrorPolicy: 'paired',
        mirrorPartId: 'hand.right',
      },
      {
        partId: 'hand.right',
        parentPartId: 'arm.right',
        mirrorPolicy: 'paired',
        mirrorPartId: 'hand.left',
      },
    );
    const rig = await createRigidRigProfileV2(rigPayload);
    const payload = validLibraryPayload(rig.profileId);
    payload.references[0] = {
      referenceId: 'reference.guard.approved',
      sourceKind: 'built_in',
      sourceDigest: hex('a'),
      sourceArtifactDigest: hex('c'),
    };
    payload.poses[0]!.contacts[0]!.partId = 'hand.left';
    payload.poses[1]!.contacts[0]!.partId = 'hand.right';
    payload.poses[0]!.equipmentSlots[0]!.partId = 'hand.left';
    payload.poses[1]!.equipmentSlots[0]!.partId = 'hand.right';
    const library = await createPoseLibrary(payload);
    await expect(
      validatePoseLibraryAgainstRig(library, rig),
    ).resolves.toBeUndefined();

    const asymmetricRigPayload = structuredClone(rigPayload);
    asymmetricRigPayload.assemblyHierarchy.splice(
      -2,
      2,
      {
        partId: 'hand.left',
        parentPartId: 'arm.left',
        mirrorPolicy: 'asymmetric',
        asymmetryReason: 'The left hand anchor is intentionally singular.',
      },
      {
        partId: 'hand.right',
        parentPartId: 'arm.right',
        mirrorPolicy: 'asymmetric',
        asymmetryReason: 'The right hand anchor is intentionally singular.',
      },
    );
    const asymmetricRig = await createRigidRigProfileV2(asymmetricRigPayload);
    const asymmetricPayload = validLibraryPayload(asymmetricRig.profileId);
    asymmetricPayload.references[0] = {
      referenceId: 'reference.guard.approved',
      sourceKind: 'built_in',
      sourceDigest: hex('a'),
      sourceArtifactDigest: hex('c'),
    };
    asymmetricPayload.poses[0]!.contacts[0]!.partId = 'hand.left';
    asymmetricPayload.poses[1]!.contacts[0]!.partId = 'hand.right';
    const asymmetricLibrary = await createPoseLibrary(asymmetricPayload);
    await expect(
      validatePoseLibraryAgainstRig(asymmetricLibrary, asymmetricRig),
    ).rejects.toMatchObject({
      code: 'UNRESOLVED_PART_MIRROR',
      path: ['poseLibrary', 'poses', 0, 'contacts', 0, 'partId'],
    });
  });

  it('rejects drift in mirrored channel, root, contact, equipment, and revision semantics', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const valid = validLibraryPayload(rig.profileId);
    await expect(
      validatePoseLibraryAgainstRig(await createPoseLibrary(valid), rig),
    ).resolves.toBeUndefined();

    for (const mutate of [
      (library: PoseLibraryPayload) => {
        library.poses[1]!.channels[0]!.valueDegrees = -79;
      },
      (library: PoseLibraryPayload) => {
        library.poses[1]!.root = { policy: 'locked' };
      },
      (library: PoseLibraryPayload) => {
        library.poses[1]!.contacts[0]!.partId = 'body.root';
      },
      (library: PoseLibraryPayload) => {
        library.poses[1]!.equipmentSlots[0]!.state = 'equipped';
      },
      (library: PoseLibraryPayload) => {
        library.poses[1]!.equipmentSlots[0]!.revisionId = `revision.${hex('6')}`;
      },
    ]) {
      const drifted = structuredClone(valid);
      mutate(drifted);
      await expect(
        validatePoseLibraryAgainstRig(await createPoseLibrary(drifted), rig),
      ).rejects.toThrow(/mirror semantics|changes revision/);
    }
  });

  it('covers exact and plus-one pose collection budgets', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const base = validLibraryPayload(rig.profileId);
    const pose = base.poses[0]!;
    pose.mirrorPolicy = 'asymmetric';
    pose.mirrorPoseId = undefined;
    pose.mirrorPlane = undefined;
    pose.asymmetryReason = 'Budget fixture intentionally has no mirror.';
    pose.asymmetryReferenceIds = ['reference.guard.approved'];
    base.poses = [pose];

    const budgets = [
      {
        key: 'tags' as const,
        maximum: POSE_LIBRARY_BUDGETS.maximumTagsPerPose,
        make: (index: number) => `tag.${index}`,
      },
      {
        key: 'channels' as const,
        maximum: POSE_LIBRARY_BUDGETS.maximumChannelsPerPose,
        make: (index: number) => ({
          jointId: `joint.${index}`,
          dofId: 'axis',
          valueDegrees: 0,
        }),
      },
      {
        key: 'contacts' as const,
        maximum: POSE_LIBRARY_BUDGETS.maximumContactsPerPose,
        make: (index: number) => ({
          id: `contact.${index}`,
          partId: 'body.root',
          kind: 'supported' as const,
          target: 'world' as const,
        }),
      },
      {
        key: 'equipmentSlots' as const,
        maximum: POSE_LIBRARY_BUDGETS.maximumEquipmentSlots,
        make: (index: number) => ({
          slotId: `slot.${index}`,
          partId: 'body.root',
          state: 'hidden' as const,
          revisionId: `revision.${hex('5')}`,
        }),
      },
    ];
    for (const budget of budgets) {
      const exact = structuredClone(base);
      (exact.poses[0]![budget.key] as unknown[]) = Array.from(
        { length: budget.maximum },
        (_, index) => budget.make(index),
      );
      expect(PoseLibraryPayloadSchema.safeParse(exact).success).toBe(true);
      (exact.poses[0]![budget.key] as unknown[]).push(
        budget.make(budget.maximum),
      );
      expect(PoseLibraryPayloadSchema.safeParse(exact).success).toBe(false);
    }

    const references = structuredClone(base);
    references.references = Array.from(
      { length: POSE_LIBRARY_BUDGETS.maximumReferenceRecords },
      (_, index) => ({
        referenceId: `reference.${index}`,
        sourceKind: 'built_in' as const,
        sourceDigest: hex((index % 10).toString()),
        sourceArtifactDigest: hex(((index + 1) % 10).toString()),
      }),
    );
    references.poses[0]!.referenceIds = ['reference.0'];
    references.poses[0]!.asymmetryReferenceIds = ['reference.0'];
    expect(PoseLibraryPayloadSchema.safeParse(references).success).toBe(true);
    references.references.push({
      referenceId: 'reference.over',
      sourceKind: 'built_in',
      sourceDigest: hex('a'),
      sourceArtifactDigest: hex('b'),
    });
    expect(PoseLibraryPayloadSchema.safeParse(references).success).toBe(false);
  });

  it('rejects duplicate semantic addresses and incomplete mirror metadata', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const duplicateTags = validLibraryPayload(rig.profileId);
    duplicateTags.poses[0]!.tags.push(duplicateTags.poses[0]!.tags[0]!);
    expect(PoseLibraryPayloadSchema.safeParse(duplicateTags).success).toBe(
      false,
    );

    const duplicateChannels = validLibraryPayload(rig.profileId);
    duplicateChannels.poses[0]!.channels.push(
      structuredClone(duplicateChannels.poses[0]!.channels[0]!),
    );
    expect(PoseLibraryPayloadSchema.safeParse(duplicateChannels).success).toBe(
      false,
    );

    const duplicateContacts = validLibraryPayload(rig.profileId);
    duplicateContacts.poses[0]!.contacts.push(
      structuredClone(duplicateContacts.poses[0]!.contacts[0]!),
    );
    expect(PoseLibraryPayloadSchema.safeParse(duplicateContacts).success).toBe(
      false,
    );

    const duplicateSlots = validLibraryPayload(rig.profileId);
    duplicateSlots.poses[0]!.equipmentSlots.push(
      structuredClone(duplicateSlots.poses[0]!.equipmentSlots[0]!),
    );
    expect(PoseLibraryPayloadSchema.safeParse(duplicateSlots).success).toBe(
      false,
    );

    const incompleteMirror = validLibraryPayload(rig.profileId);
    incompleteMirror.poses[0]!.mirrorPlane = undefined;
    expect(PoseLibraryPayloadSchema.safeParse(incompleteMirror).success).toBe(
      false,
    );

    const duplicateReferences = validLibraryPayload(rig.profileId);
    duplicateReferences.references.push(
      structuredClone(duplicateReferences.references[0]!),
    );
    expect(
      PoseLibraryPayloadSchema.safeParse(duplicateReferences).success,
    ).toBe(false);

    const duplicatePoses = validLibraryPayload(rig.profileId);
    duplicatePoses.poses.push(structuredClone(duplicatePoses.poses[0]!));
    expect(PoseLibraryPayloadSchema.safeParse(duplicatePoses).success).toBe(
      false,
    );

    const identified = await createPoseLibrary(
      validLibraryPayload(rig.profileId),
    );
    await expect(
      validatePoseLibraryAgainstRig(identified, rig),
    ).resolves.toBeUndefined();
  });

  it('accepts the exact pose budget and rejects budget plus one', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const boundary = validLibraryPayload(rig.profileId);
    const template = boundary.poses[0]!;
    boundary.poses = Array.from(
      { length: POSE_LIBRARY_BUDGETS.maximumPoses },
      (_, index) => ({
        ...structuredClone(template),
        semanticId: `pose.boundary-${index}`,
        mirrorPolicy: 'asymmetric',
        mirrorPoseId: undefined,
        mirrorPlane: undefined,
        asymmetryReason: 'Boundary fixture intentionally has no mirror.',
        asymmetryReferenceIds: ['reference.guard.approved'],
      }),
    );
    expect(PoseLibraryPayloadSchema.safeParse(boundary).success).toBe(true);

    const over = structuredClone(boundary);
    over.poses.push({
      ...structuredClone(template),
      semanticId: 'pose.over-budget',
      mirrorPolicy: 'asymmetric',
      mirrorPoseId: undefined,
      mirrorPlane: undefined,
      asymmetryReason: 'Boundary fixture intentionally has no mirror.',
      asymmetryReferenceIds: ['reference.guard.approved'],
    });
    expect(PoseLibraryPayloadSchema.safeParse(over).success).toBe(false);
  });

  it('detects mutation of identity-bound pose and provenance content', async () => {
    const rig = await createRigidRigProfileV2(validRigPayload());
    const library = await createPoseLibrary(validLibraryPayload(rig.profileId));
    expect(await verifyPoseLibraryIdentity(library)).toBe(true);

    library.references[0]!.sourceDigest = hex('b');
    expect(await verifyPoseLibraryIdentity(library)).toBe(false);
  });
});
