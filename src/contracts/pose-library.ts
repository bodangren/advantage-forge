import { z } from 'zod';

import {
  RigidRigProfileV2Schema,
  verifyRigidRigProfileV2Identity,
  type RigidRigProfileV2,
} from './rigid-rig-v2.js';
import {
  ForgeDomainError,
  parseDomainValue,
  schemaDomainError,
  type ForgeDomainErrorPath,
} from './domain-error.js';

export const POSE_LIBRARY_CONTRACT_ID = 'forge-pose-library/v1' as const;

export const POSE_LIBRARY_BUDGETS = Object.freeze({
  maximumPoses: 512,
  maximumChannelsPerPose: 192,
  maximumContactsPerPose: 64,
  maximumTagsPerPose: 32,
  maximumEquipmentSlots: 64,
  maximumReferenceRecords: 32,
} as const);

export const POSE_REFERENCE_DIGEST_SEMANTICS = Object.freeze({
  sourceDigest:
    'SHA-256 of the canonical source descriptor record that resolves the reference.',
  sourceArtifactDigest:
    'SHA-256 of the exact source artifact bytes reviewed for this reference.',
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
const RigProfileIdSchema = z.string().regex(/^rig-v2\.[a-f0-9]{64}$/);
const PoseLibraryIdSchema = z.string().regex(/^pose-library\.[a-f0-9]{64}$/);
const ApprovalReceiptIdSchema = z
  .string()
  .regex(/^approval-receipt\.[a-f0-9]{64}$/);
const EquipmentSignatureSchema = z.string().regex(/^equipment\.[a-f0-9]{64}$/);
const Vec3Schema = z.tuple([
  z.number().finite().min(-2).max(2),
  z.number().finite().min(-2).max(2),
  z.number().finite().min(-2).max(2),
]);

export const PoseLibraryBindingSchema = z.strictObject({
  assetRevisionId: AssetRevisionIdSchema,
  morphologyRevisionId: MorphologyRevisionIdSchema,
  rigProfileId: RigProfileIdSchema,
  equipmentSignature: EquipmentSignatureSchema,
});

export const PoseApprovalReceiptPayloadSchema = z.strictObject({
  referenceId: SemanticIdSchema,
  sourceDigest: Sha256Schema,
  sourceArtifactDigest: Sha256Schema,
  authorityId: SemanticIdSchema,
  reviewerId: SemanticIdSchema,
  decision: z.literal('approved'),
  scope: PoseLibraryBindingSchema,
  descriptorDigest: Sha256Schema,
  provenanceDigest: Sha256Schema,
  kimiEvidenceDigest: Sha256Schema,
  criteriaDigest: Sha256Schema,
  decidedAt: z.iso.datetime(),
  notes: z.string().min(1).max(2_000),
});

export const PoseApprovalReceiptSchema =
  PoseApprovalReceiptPayloadSchema.extend({
    receiptId: ApprovalReceiptIdSchema,
  });

export const PoseReferenceProvenanceSchema = z.strictObject({
  referenceId: SemanticIdSchema,
  sourceKind: z.enum([
    'built_in',
    'user_supplied',
    'generated_approved',
    'downstream_fixture',
  ]),
  sourceDigest: Sha256Schema,
  sourceArtifactDigest: Sha256Schema,
  approvalReceipt: PoseApprovalReceiptSchema.optional(),
});

export const PoseEquipmentSlotSchema = z.strictObject({
  slotId: SemanticIdSchema,
  partId: SemanticIdSchema,
  state: z.enum(['equipped', 'stowed', 'hidden']),
  revisionId: AssetRevisionIdSchema,
});

export const PoseChannelSchema = z.strictObject({
  jointId: SemanticIdSchema,
  dofId: SemanticIdSchema,
  valueDegrees: z.number().finite().min(-180).max(180),
});

export const PoseContactSchema = z.strictObject({
  id: SemanticIdSchema,
  partId: SemanticIdSchema,
  kind: z.enum(['planted', 'supported', 'gripped', 'impact']),
  target: z.enum(['ground', 'equipment', 'assembly', 'world']),
  normal: Vec3Schema.refine(
    (normal) => Math.abs(Math.hypot(...normal) - 1) <= 1e-6,
    'Contact normals must be canonical unit vectors.',
  ).optional(),
});

export const PoseRootStateSchema = z.discriminatedUnion('policy', [
  z.strictObject({ policy: z.literal('locked') }),
  z.strictObject({
    policy: z.literal('in_place'),
    yawDegrees: z.number().finite().min(-180).max(180),
  }),
  z.strictObject({
    policy: z.literal('authored_translation'),
    translation: Vec3Schema,
  }),
  z.strictObject({
    policy: z.literal('authored_translation_and_yaw'),
    translation: Vec3Schema,
    yawDegrees: z.number().finite().min(-180).max(180),
  }),
]);

export const ReusablePoseSchema = z
  .strictObject({
    semanticId: SemanticIdSchema,
    referenceIds: z
      .array(SemanticIdSchema)
      .min(1)
      .max(POSE_LIBRARY_BUDGETS.maximumReferenceRecords),
    tags: z
      .array(SemanticIdSchema)
      .max(POSE_LIBRARY_BUDGETS.maximumTagsPerPose),
    channels: z
      .array(PoseChannelSchema)
      .max(POSE_LIBRARY_BUDGETS.maximumChannelsPerPose),
    contacts: z
      .array(PoseContactSchema)
      .max(POSE_LIBRARY_BUDGETS.maximumContactsPerPose),
    root: PoseRootStateSchema,
    equipmentSlots: z
      .array(PoseEquipmentSlotSchema)
      .max(POSE_LIBRARY_BUDGETS.maximumEquipmentSlots),
    mirrorPolicy: z.enum(['symmetric', 'asymmetric']),
    mirrorPoseId: SemanticIdSchema.optional(),
    mirrorPlane: z.literal('YZ').optional(),
    asymmetryReason: z.string().min(1).max(1_000).optional(),
    asymmetryReferenceIds: z
      .array(SemanticIdSchema)
      .min(1)
      .max(POSE_LIBRARY_BUDGETS.maximumReferenceRecords)
      .optional(),
  })
  .superRefine((pose, context) => {
    const tagIds = new Set<string>();
    if (new Set(pose.referenceIds).size !== pose.referenceIds.length)
      context.addIssue({
        code: 'custom',
        path: ['referenceIds'],
        message: 'Pose reference bindings must be unique.',
      });
    for (const [index, tag] of pose.tags.entries()) {
      if (tagIds.has(tag))
        context.addIssue({
          code: 'custom',
          path: ['tags', index],
          message: 'Pose tags must be unique.',
        });
      tagIds.add(tag);
    }
    const channelAddresses = new Set<string>();
    for (const [index, channel] of pose.channels.entries()) {
      const address = `${channel.jointId}/${channel.dofId}`;
      if (channelAddresses.has(address))
        context.addIssue({
          code: 'custom',
          path: ['channels', index],
          message: 'A pose may address each rig DOF only once.',
        });
      channelAddresses.add(address);
    }
    const contactIds = new Set<string>();
    for (const [index, contact] of pose.contacts.entries()) {
      if (contactIds.has(contact.id))
        context.addIssue({
          code: 'custom',
          path: ['contacts', index, 'id'],
          message: 'Pose contact IDs must be unique.',
        });
      contactIds.add(contact.id);
      if (contact.target === 'ground' && contact.normal === undefined)
        context.addIssue({
          code: 'custom',
          path: ['contacts', index, 'normal'],
          message: 'Ground contacts require an authored contact normal.',
        });
    }
    const slotIds = new Set<string>();
    for (const [index, slot] of pose.equipmentSlots.entries()) {
      if (slotIds.has(slot.slotId))
        context.addIssue({
          code: 'custom',
          path: ['equipmentSlots', index, 'slotId'],
          message: 'Equipment slots must be unique within a pose.',
        });
      slotIds.add(slot.slotId);
    }
    if ((pose.mirrorPoseId === undefined) !== (pose.mirrorPlane === undefined))
      context.addIssue({
        code: 'custom',
        path: ['mirrorPoseId'],
        message: 'Mirror pose identity and plane must be declared together.',
      });
    if (
      pose.mirrorPolicy === 'symmetric' &&
      (pose.mirrorPoseId === undefined ||
        pose.asymmetryReason !== undefined ||
        pose.asymmetryReferenceIds !== undefined)
    )
      context.addIssue({
        code: 'custom',
        path: ['mirrorPolicy'],
        message: 'Symmetric poses require only a reciprocal mirror pose.',
      });
    if (
      pose.mirrorPolicy === 'asymmetric' &&
      (pose.mirrorPoseId !== undefined ||
        pose.asymmetryReason === undefined ||
        pose.asymmetryReferenceIds === undefined)
    )
      context.addIssue({
        code: 'custom',
        path: ['mirrorPolicy'],
        message:
          'Asymmetric poses require a reason and provenance references without a mirror pose.',
      });
  });

const PoseLibraryPayloadBaseSchema = z.strictObject({
  contractId: z.literal(POSE_LIBRARY_CONTRACT_ID),
  binding: PoseLibraryBindingSchema,
  references: z
    .array(PoseReferenceProvenanceSchema)
    .min(1)
    .max(POSE_LIBRARY_BUDGETS.maximumReferenceRecords),
  poses: z
    .array(ReusablePoseSchema)
    .min(1)
    .max(POSE_LIBRARY_BUDGETS.maximumPoses),
});

type PoseLibraryPayloadValue = z.infer<typeof PoseLibraryPayloadBaseSchema>;

function validatePoseLibraryPayload(
  library: PoseLibraryPayloadValue,
  context: z.RefinementCtx,
): void {
  const references = new Set<string>();
  for (const [index, reference] of library.references.entries()) {
    if (references.has(reference.referenceId))
      context.addIssue({
        code: 'custom',
        path: ['references', index, 'referenceId'],
        message: 'Reference provenance IDs must be unique.',
      });
    references.add(reference.referenceId);
    if (
      reference.sourceKind === 'generated_approved' &&
      reference.approvalReceipt === undefined
    )
      context.addIssue({
        code: 'custom',
        path: ['references', index, 'approvalReceipt'],
        message: 'Generated references require a structured approval receipt.',
      });
    if (
      reference.sourceKind !== 'generated_approved' &&
      reference.approvalReceipt !== undefined
    )
      context.addIssue({
        code: 'custom',
        path: ['references', index, 'approvalReceipt'],
        message: 'Approval receipts are reserved for generated references.',
      });
    if (
      reference.approvalReceipt !== undefined &&
      !bindingMatches(reference.approvalReceipt.scope, library.binding)
    )
      context.addIssue({
        code: 'custom',
        path: ['references', index, 'approvalReceipt', 'scope'],
        message: 'Approval receipt scope must bind the exact library source.',
      });
    if (
      reference.approvalReceipt !== undefined &&
      (reference.approvalReceipt.referenceId !== reference.referenceId ||
        reference.approvalReceipt.sourceDigest !== reference.sourceDigest ||
        reference.approvalReceipt.sourceArtifactDigest !==
          reference.sourceArtifactDigest)
    )
      context.addIssue({
        code: 'custom',
        path: ['references', index, 'approvalReceipt'],
        message:
          'Approval receipts must content-address the exact reference identity, source descriptor, and source artifact.',
      });
  }

  const posesById = new Map<string, (typeof library.poses)[number]>();
  for (const [index, pose] of library.poses.entries()) {
    if (posesById.has(pose.semanticId))
      context.addIssue({
        code: 'custom',
        path: ['poses', index, 'semanticId'],
        message: 'Pose semantic IDs must be unique within a library.',
      });
    posesById.set(pose.semanticId, pose);
  }
  for (const [index, pose] of library.poses.entries()) {
    for (const [referenceIndex, referenceId] of pose.referenceIds.entries())
      if (!references.has(referenceId))
        context.addIssue({
          code: 'custom',
          path: ['poses', index, 'referenceIds', referenceIndex],
          message: 'Pose reference bindings must target known provenance.',
        });
    for (const [referenceIndex, referenceId] of (
      pose.asymmetryReferenceIds ?? []
    ).entries())
      if (!references.has(referenceId))
        context.addIssue({
          code: 'custom',
          path: ['poses', index, 'asymmetryReferenceIds', referenceIndex],
          message: 'Pose asymmetry must target known provenance.',
        });
    if (pose.mirrorPoseId !== undefined) {
      const mirror = posesById.get(pose.mirrorPoseId);
      if (
        mirror?.mirrorPoseId !== pose.semanticId ||
        mirror.mirrorPlane !== pose.mirrorPlane
      )
        context.addIssue({
          code: 'custom',
          path: ['poses', index, 'mirrorPoseId'],
          message: 'Mirrored poses must be known and reciprocal.',
        });
      if (
        mirror !== undefined &&
        [...mirror.referenceIds].sort().join('\0') !==
          [...pose.referenceIds].sort().join('\0')
      )
        context.addIssue({
          code: 'custom',
          path: ['poses', index, 'referenceIds'],
          message: 'Mirrored poses must bind the same reference provenance.',
        });
    }
  }
}

function bindingMatches(
  left: z.infer<typeof PoseLibraryBindingSchema>,
  right: z.infer<typeof PoseLibraryBindingSchema>,
): boolean {
  return (
    left.assetRevisionId === right.assetRevisionId &&
    left.morphologyRevisionId === right.morphologyRevisionId &&
    left.rigProfileId === right.rigProfileId &&
    left.equipmentSignature === right.equipmentSignature
  );
}

export const PoseLibraryPayloadSchema =
  PoseLibraryPayloadBaseSchema.superRefine(validatePoseLibraryPayload);

export const PoseLibrarySchema = PoseLibraryPayloadBaseSchema.extend({
  libraryId: PoseLibraryIdSchema,
}).superRefine(validatePoseLibraryPayload);

export type PoseLibraryPayload = z.infer<typeof PoseLibraryPayloadSchema>;
export type PoseLibrary = z.infer<typeof PoseLibrarySchema>;
export type PoseApprovalReceiptPayload = z.infer<
  typeof PoseApprovalReceiptPayloadSchema
>;
export type PoseApprovalReceipt = z.infer<typeof PoseApprovalReceiptSchema>;

function canonicalJsonValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJsonValue(item)).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(
        ([key, child]) => `${JSON.stringify(key)}:${canonicalJsonValue(child)}`,
      )
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function normalizePoseLibraryPayload(
  value: PoseLibraryPayload,
): PoseLibraryPayload {
  const result = PoseLibraryPayloadSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const issuePath = (issue?.path ?? []).map((segment) =>
      typeof segment === 'symbol'
        ? (segment.description ?? String(segment))
        : segment,
    );
    if (
      issue?.path.includes('approvalReceipt') ||
      issue?.path.includes('referenceIds') ||
      issue?.path.includes('asymmetryReferenceIds')
    )
      throw new ForgeDomainError(
        'PROVENANCE_MISMATCH',
        ['poseLibrary', ...issuePath],
        issue.message,
        { cause: result.error },
      );
    throw schemaDomainError(result.error, ['poseLibrary']);
  }
  const parsed = result.data;
  return normalizePoseLibraryPayloadUnchecked(parsed);
}

function normalizePoseLibraryPayloadUnchecked(
  parsed: PoseLibraryPayload,
): PoseLibraryPayload {
  return {
    ...parsed,
    references: [...parsed.references].sort((left, right) =>
      left.referenceId.localeCompare(right.referenceId),
    ),
    poses: [...parsed.poses]
      .sort((left, right) => left.semanticId.localeCompare(right.semanticId))
      .map((pose) => ({
        ...pose,
        referenceIds: [...pose.referenceIds].sort(),
        ...(pose.asymmetryReferenceIds === undefined
          ? {}
          : {
              asymmetryReferenceIds: [...pose.asymmetryReferenceIds].sort(),
            }),
        tags: [...pose.tags].sort(),
        channels: [...pose.channels].sort(
          (left, right) =>
            left.jointId.localeCompare(right.jointId) ||
            left.dofId.localeCompare(right.dofId),
        ),
        contacts: [...pose.contacts].sort((left, right) =>
          left.id.localeCompare(right.id),
        ),
        equipmentSlots: [...pose.equipmentSlots].sort((left, right) =>
          left.slotId.localeCompare(right.slotId),
        ),
      })),
  };
}

export function canonicalPoseLibraryPayload(value: PoseLibraryPayload): string {
  return canonicalJsonValue(normalizePoseLibraryPayload(value));
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createPoseApprovalReceipt(
  value: PoseApprovalReceiptPayload,
): Promise<PoseApprovalReceipt> {
  const payload = parseDomainValue(PoseApprovalReceiptPayloadSchema, value, [
    'approvalReceipt',
  ]);
  const receiptId = `approval-receipt.${await sha256(
    canonicalJsonValue(payload),
  )}`;
  return parseDomainValue(
    PoseApprovalReceiptSchema,
    { ...payload, receiptId },
    ['approvalReceipt'],
  );
}

export async function verifyPoseApprovalReceiptIdentity(
  value: PoseApprovalReceipt,
): Promise<boolean> {
  const result = PoseApprovalReceiptSchema.safeParse(value);
  if (!result.success) return false;
  const { receiptId, ...payload } = result.data;
  return receiptId === (await createPoseApprovalReceipt(payload)).receiptId;
}

export async function createPoseLibrary(
  value: PoseLibraryPayload,
): Promise<PoseLibrary> {
  const normalized = normalizePoseLibraryPayload(value);
  for (const [referenceIndex, reference] of normalized.references.entries())
    if (
      reference.approvalReceipt !== undefined &&
      !(await verifyPoseApprovalReceiptIdentity(reference.approvalReceipt))
    )
      throw new PoseLibraryCompatibilityError(
        'APPROVAL_RECEIPT_IDENTITY_MISMATCH',
        `Reference ${reference.referenceId} has a stale approval receipt identity.`,
        [
          'poseLibrary',
          'references',
          referenceIndex,
          'approvalReceipt',
          'receiptId',
        ],
      );
  const libraryId = `pose-library.${await sha256(canonicalJsonValue(normalized))}`;
  return parseDomainValue(PoseLibrarySchema, { ...normalized, libraryId }, [
    'poseLibrary',
  ]);
}

export async function verifyPoseLibraryIdentity(
  value: PoseLibrary,
): Promise<boolean> {
  if (!(await verifyPoseLibraryOuterIdentity(value))) return false;
  try {
    const result = PoseLibrarySchema.safeParse(structuredClone(value));
    if (!result.success) return false;
    for (const reference of result.data.references)
      if (
        reference.approvalReceipt !== undefined &&
        !(await verifyPoseApprovalReceiptIdentity(reference.approvalReceipt))
      )
        return false;
    return true;
  } catch {
    return false;
  }
}

async function verifyPoseLibraryOuterIdentity(
  value: PoseLibrary,
): Promise<boolean> {
  try {
    const { libraryId, ...payload } = structuredClone(value);
    if (!PoseLibraryIdSchema.safeParse(libraryId).success) return false;
    const normalized = normalizePoseLibraryPayloadUnchecked(payload);
    return (
      libraryId ===
      `pose-library.${await sha256(canonicalJsonValue(normalized))}`
    );
  } catch {
    return false;
  }
}

async function assertPoseApprovalReceiptIdentities(
  library: PoseLibrary,
): Promise<void> {
  for (const [referenceIndex, reference] of library.references.entries())
    if (
      reference.approvalReceipt !== undefined &&
      !(await verifyPoseApprovalReceiptIdentity(reference.approvalReceipt))
    )
      throw new PoseLibraryCompatibilityError(
        'APPROVAL_RECEIPT_IDENTITY_MISMATCH',
        `Reference ${reference.referenceId} has a stale approval receipt identity.`,
        [
          'poseLibrary',
          'references',
          referenceIndex,
          'approvalReceipt',
          'receiptId',
        ],
      );
}

export type PoseLibraryCompatibilityErrorCode =
  | 'APPROVAL_RECEIPT_IDENTITY_MISMATCH'
  | 'RIG_IDENTITY_MISMATCH'
  | 'POSE_LIBRARY_IDENTITY_MISMATCH'
  | 'BINDING_MISMATCH'
  | 'UNKNOWN_DOF'
  | 'DOF_LIMIT_EXCEEDED'
  | 'UNKNOWN_CONTACT_PART'
  | 'UNKNOWN_EQUIPMENT_PART'
  | 'EQUIPMENT_REVISION_DRIFT'
  | 'UNRESOLVED_PART_MIRROR'
  | 'MIRROR_SEMANTICS_MISMATCH';

export class PoseLibraryCompatibilityError extends ForgeDomainError<PoseLibraryCompatibilityErrorCode> {
  constructor(
    code: PoseLibraryCompatibilityErrorCode,
    message: string,
    path: ForgeDomainErrorPath = [],
    options?: ErrorOptions,
  ) {
    super(code, path, message, options);
    this.name = 'PoseLibraryCompatibilityError';
  }
}

export async function validatePoseLibraryAgainstRig(
  value: PoseLibrary,
  rigValue: RigidRigProfileV2,
): Promise<void> {
  if (!(await verifyRigidRigProfileV2Identity(rigValue)))
    throw new PoseLibraryCompatibilityError(
      'RIG_IDENTITY_MISMATCH',
      'Rig profile content does not match its immutable identity.',
      ['rig', 'profileId'],
    );
  if (!(await verifyPoseLibraryOuterIdentity(value)))
    throw new PoseLibraryCompatibilityError(
      'POSE_LIBRARY_IDENTITY_MISMATCH',
      'Pose library content does not match its immutable identity.',
      ['poseLibrary', 'libraryId'],
    );
  const library = parseDomainValue(PoseLibrarySchema, structuredClone(value), [
    'poseLibrary',
  ]);
  await assertPoseApprovalReceiptIdentities(library);
  const rig = parseDomainValue(
    RigidRigProfileV2Schema,
    structuredClone(rigValue),
    ['rig'],
  );
  if (
    library.binding.assetRevisionId !== rig.assetRevisionId ||
    library.binding.morphologyRevisionId !== rig.morphologyRevisionId ||
    library.binding.rigProfileId !== rig.profileId ||
    library.binding.equipmentSignature !== rig.equipmentSignature
  )
    throw new PoseLibraryCompatibilityError(
      'BINDING_MISMATCH',
      'Pose library binding does not match the rig profile.',
      ['poseLibrary', 'binding'],
    );

  const jointsById = new Map(rig.joints.map((joint) => [joint.id, joint]));
  const assemblyPartIds = new Set(
    rig.assemblyHierarchy.map((part) => part.partId),
  );
  const mirroredParts = new Map<string, string>();
  for (const part of rig.assemblyHierarchy)
    if (part.mirrorPolicy === 'center')
      mirroredParts.set(part.partId, part.partId);
    else if (part.mirrorPolicy === 'paired')
      mirroredParts.set(part.partId, part.mirrorPartId);
  const equipmentRevisionBySlot = new Map<string, string>();
  for (const pose of library.poses) {
    for (const channel of pose.channels) {
      const joint = jointsById.get(channel.jointId);
      const dof = joint?.dofs.find(
        (candidate) => candidate.id === channel.dofId,
      );
      if (dof === undefined)
        throw new PoseLibraryCompatibilityError(
          'UNKNOWN_DOF',
          `Pose ${pose.semanticId} addresses unknown DOF ${channel.jointId}/${channel.dofId}.`,
          [
            'poses',
            pose.semanticId,
            'channels',
            channel.jointId,
            channel.dofId,
          ],
        );
      if (
        channel.valueDegrees < dof.minimumDegrees ||
        channel.valueDegrees > dof.maximumDegrees
      )
        throw new PoseLibraryCompatibilityError(
          'DOF_LIMIT_EXCEEDED',
          `Pose ${pose.semanticId} exceeds limits for ${channel.jointId}/${channel.dofId}.`,
          [
            'poses',
            pose.semanticId,
            'channels',
            channel.jointId,
            channel.dofId,
          ],
        );
    }
    for (const contact of pose.contacts)
      if (!assemblyPartIds.has(contact.partId))
        throw new PoseLibraryCompatibilityError(
          'UNKNOWN_CONTACT_PART',
          `Pose ${pose.semanticId} contact ${contact.id} references an unknown assembly part.`,
          ['poses', pose.semanticId, 'contacts', contact.id, 'partId'],
        );
    for (const slot of pose.equipmentSlots) {
      if (!assemblyPartIds.has(slot.partId))
        throw new PoseLibraryCompatibilityError(
          'UNKNOWN_EQUIPMENT_PART',
          `Pose ${pose.semanticId} equipment slot ${slot.slotId} references an unknown assembly part.`,
          ['poses', pose.semanticId, 'equipmentSlots', slot.slotId, 'partId'],
        );
      const priorRevision = equipmentRevisionBySlot.get(slot.slotId);
      if (priorRevision !== undefined && priorRevision !== slot.revisionId)
        throw new PoseLibraryCompatibilityError(
          'EQUIPMENT_REVISION_DRIFT',
          `Pose ${pose.semanticId} equipment slot ${slot.slotId} changes revision within one library.`,
          [
            'poses',
            pose.semanticId,
            'equipmentSlots',
            slot.slotId,
            'revisionId',
          ],
        );
      equipmentRevisionBySlot.set(slot.slotId, slot.revisionId);
    }
  }

  const posesById = new Map(
    library.poses.map((pose) => [pose.semanticId, pose]),
  );
  for (const [poseIndex, pose] of library.poses.entries()) {
    if (pose.mirrorPoseId === undefined) continue;
    const mirror = posesById.get(pose.mirrorPoseId)!;
    const expectedChannels = pose.channels
      .map((channel, channelIndex) => {
        const joint = jointsById.get(channel.jointId)!;
        const dof = joint.dofs.find(
          (candidate) => candidate.id === channel.dofId,
        )!;
        if (
          joint.mirrorPolicy !== 'paired' ||
          dof.mirrorDofId === undefined ||
          dof.mirrorSign === undefined
        )
          throw new PoseLibraryCompatibilityError(
            'MIRROR_SEMANTICS_MISMATCH',
            `Pose ${pose.semanticId} cannot mirror ${channel.jointId}/${channel.dofId}.`,
            [
              'poseLibrary',
              'poses',
              poseIndex,
              'channels',
              channelIndex,
              'jointId',
            ],
          );
        return {
          jointId: joint.mirrorJointId,
          dofId: dof.mirrorDofId,
          valueDegrees: channel.valueDegrees * dof.mirrorSign,
        };
      })
      .sort(channelOrder);
    if (
      canonicalJsonValue(expectedChannels) !==
        canonicalJsonValue([...mirror.channels].sort(channelOrder)) ||
      canonicalJsonValue(mirrorPoseRoot(pose.root)) !==
        canonicalJsonValue(mirror.root) ||
      canonicalJsonValue(
        mirrorContacts(pose.contacts, mirroredParts, poseIndex),
      ) !== canonicalJsonValue([...mirror.contacts].sort(idOrder)) ||
      canonicalJsonValue(
        mirrorEquipment(pose.equipmentSlots, mirroredParts, poseIndex),
      ) !== canonicalJsonValue([...mirror.equipmentSlots].sort(slotOrder))
    )
      throw new PoseLibraryCompatibilityError(
        'MIRROR_SEMANTICS_MISMATCH',
        `Pose ${pose.semanticId} mirror semantics do not match ${mirror.semanticId}.`,
        ['poseLibrary', 'poses', poseIndex, 'mirrorPoseId'],
      );
  }
}

const channelOrder = (
  left: { jointId: string; dofId: string },
  right: { jointId: string; dofId: string },
) =>
  left.jointId.localeCompare(right.jointId) ||
  left.dofId.localeCompare(right.dofId);
const idOrder = (left: { id: string }, right: { id: string }) =>
  left.id.localeCompare(right.id);
const slotOrder = (left: { slotId: string }, right: { slotId: string }) =>
  left.slotId.localeCompare(right.slotId);

function mirrorPoseRoot(
  root: z.infer<typeof PoseRootStateSchema>,
): z.infer<typeof PoseRootStateSchema> {
  switch (root.policy) {
    case 'locked':
      return root;
    case 'in_place':
      return { ...root, yawDegrees: -root.yawDegrees };
    case 'authored_translation':
      return {
        ...root,
        translation: [
          -root.translation[0],
          root.translation[1],
          root.translation[2],
        ],
      };
    case 'authored_translation_and_yaw':
      return {
        ...root,
        translation: [
          -root.translation[0],
          root.translation[1],
          root.translation[2],
        ],
        yawDegrees: -root.yawDegrees,
      };
  }
}

function mirrorContacts(
  contacts: z.infer<typeof PoseContactSchema>[],
  mirroredParts: ReadonlyMap<string, string>,
  poseIndex: number,
) {
  return contacts
    .map((contact, contactIndex) => ({
      ...contact,
      partId: requireMirroredPart(mirroredParts, contact.partId, [
        'poseLibrary',
        'poses',
        poseIndex,
        'contacts',
        contactIndex,
        'partId',
      ]),
      ...(contact.normal === undefined
        ? {}
        : {
            normal: [-contact.normal[0], contact.normal[1], contact.normal[2]],
          }),
    }))
    .sort(idOrder);
}

function mirrorEquipment(
  slots: z.infer<typeof PoseEquipmentSlotSchema>[],
  mirroredParts: ReadonlyMap<string, string>,
  poseIndex: number,
) {
  return slots
    .map((slot, slotIndex) => ({
      ...slot,
      partId: requireMirroredPart(mirroredParts, slot.partId, [
        'poseLibrary',
        'poses',
        poseIndex,
        'equipmentSlots',
        slotIndex,
        'partId',
      ]),
    }))
    .sort(slotOrder);
}

function requireMirroredPart(
  mirroredParts: ReadonlyMap<string, string>,
  partId: string,
  path: ForgeDomainErrorPath,
): string {
  const mirroredPartId = mirroredParts.get(partId);
  if (mirroredPartId === undefined)
    throw new PoseLibraryCompatibilityError(
      'UNRESOLVED_PART_MIRROR',
      `Assembly part ${partId} has no bilateral mirror mapping.`,
      path,
    );
  return mirroredPartId;
}
