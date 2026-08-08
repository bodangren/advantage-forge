import { z } from 'zod';

import {
  CLIP_LIBRARY_BUDGETS,
  ClipDefinitionSchema,
  ClipLibrarySchema,
} from './clip-library-v2.js';
import {
  POSE_LIBRARY_BUDGETS,
  PoseLibrarySchema,
  PoseReferenceProvenanceSchema,
  ReusablePoseSchema,
} from './pose-library.js';
import {
  RIGID_RIG_V2_BUDGETS,
  RigidRigProfileV2Schema,
  RigidRigV2AssemblyPartSchema,
  RigidRigV2JointSchema,
} from './rigid-rig-v2.js';

export const ANIMATION_RESOURCE_PUBLIC_CONTRACT_ID =
  'forge-animation-resource-public/v1' as const;

export const ANIMATION_RESOURCE_PUBLIC_BUDGETS = Object.freeze({
  maximumRequestedSections: 8,
  maximumPageSize: 100,
  maximumCursorLength: 1_024,
  maximumIssues: 128,
  maximumIssuePathDepth: 64,
  maximumChanges: 256,
  maximumChangeSummaryLength: 1_000,
} as const);

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const AssetRevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const RigProfileIdSchema = z.string().regex(/^rig-v2\.[a-f0-9]{64}$/);
const PoseLibraryIdSchema = z.string().regex(/^pose-library\.[a-f0-9]{64}$/);
const ClipLibraryIdSchema = z.string().regex(/^clip-library\.[a-f0-9]{64}$/);
const AnimationRequestIdSchema = z
  .string()
  .regex(/^animation-request\.[a-f0-9]{64}$/);
const AnimationReceiptIdSchema = z
  .string()
  .regex(/^animation-receipt\.[a-f0-9]{64}$/);
const CursorSchema = z
  .string()
  .min(1)
  .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumCursorLength)
  .regex(/^[A-Za-z0-9_-]+$/);

export const AnimationResourceKindSchema = z.enum([
  'rig',
  'pose_library',
  'clip_library',
]);
export type AnimationResourceKind = z.infer<typeof AnimationResourceKindSchema>;

const AnimationResourceIdSchema = z.union([
  RigProfileIdSchema,
  PoseLibraryIdSchema,
  ClipLibraryIdSchema,
]);

const RigAuthoringSchema = z.strictObject({
  rootPartId: SemanticIdSchema,
  rootJointId: SemanticIdSchema,
  assemblyHierarchy: z
    .array(RigidRigV2AssemblyPartSchema)
    .min(1)
    .max(RIGID_RIG_V2_BUDGETS.maximumAssemblyParts),
  joints: z
    .array(RigidRigV2JointSchema)
    .min(1)
    .max(RIGID_RIG_V2_BUDGETS.maximumJoints),
});

const PoseLibraryAuthoringSchema = z.strictObject({
  rigProfileId: RigProfileIdSchema,
  references: z
    .array(PoseReferenceProvenanceSchema)
    .min(1)
    .max(POSE_LIBRARY_BUDGETS.maximumReferenceRecords),
  poses: z
    .array(ReusablePoseSchema)
    .min(1)
    .max(POSE_LIBRARY_BUDGETS.maximumPoses),
});

const ClipLibraryAuthoringSchema = z.strictObject({
  rigProfileId: RigProfileIdSchema,
  poseLibraryId: PoseLibraryIdSchema,
  clips: z
    .array(ClipDefinitionSchema)
    .min(1)
    .max(CLIP_LIBRARY_BUDGETS.maximumClips),
});

export const AnimationResourceAuthoringSchema = z.union([
  RigAuthoringSchema,
  PoseLibraryAuthoringSchema,
  ClipLibraryAuthoringSchema,
]);
export type AnimationResourceAuthoring = z.infer<
  typeof AnimationResourceAuthoringSchema
>;

function idMatchesKind(
  kind: AnimationResourceKind,
  resourceId: string,
): boolean {
  if (kind === 'rig') return RigProfileIdSchema.safeParse(resourceId).success;
  if (kind === 'pose_library')
    return PoseLibraryIdSchema.safeParse(resourceId).success;
  return ClipLibraryIdSchema.safeParse(resourceId).success;
}

function authoringMatchesKind(
  kind: AnimationResourceKind,
  authoring: AnimationResourceAuthoring,
): boolean {
  if (kind === 'rig') return 'rootPartId' in authoring;
  if (kind === 'pose_library')
    return 'rigProfileId' in authoring && !('poseLibraryId' in authoring);
  return 'poseLibraryId' in authoring;
}

function addKindIdIssue(
  context: z.RefinementCtx,
  path: readonly (string | number)[],
  kind: AnimationResourceKind,
): void {
  context.addIssue({
    code: 'custom',
    path: [...path],
    message: `Resource identity must match resourceKind ${kind}.`,
  });
}

const PublicResourceBaseShape = {
  assetId: SemanticIdSchema,
  assetRevisionId: AssetRevisionIdSchema,
  streamId: SemanticIdSchema,
  resourceKind: AnimationResourceKindSchema,
} as const;

const ApplyCreateSchema = z.strictObject({
  ...PublicResourceBaseShape,
  operation: z.literal('create'),
  expectedCurrentResourceId: z.literal(null),
  dryRun: z.boolean(),
  authoring: AnimationResourceAuthoringSchema,
});

const ApplyReviseSchema = z.strictObject({
  ...PublicResourceBaseShape,
  operation: z.literal('revise'),
  expectedCurrentResourceId: AnimationResourceIdSchema,
  dryRun: z.boolean(),
  authoring: AnimationResourceAuthoringSchema,
});

const ApplySelectCurrentSchema = z.strictObject({
  ...PublicResourceBaseShape,
  operation: z.literal('select_current'),
  expectedCurrentResourceId: AnimationResourceIdSchema.nullable(),
  targetResourceId: AnimationResourceIdSchema,
  dryRun: z.boolean(),
});

const ApplyBodySchema = z
  .discriminatedUnion('operation', [
    ApplyCreateSchema,
    ApplyReviseSchema,
    ApplySelectCurrentSchema,
  ])
  .superRefine((operation, context) => {
    if (
      operation.expectedCurrentResourceId !== null &&
      !idMatchesKind(
        operation.resourceKind,
        operation.expectedCurrentResourceId,
      )
    )
      addKindIdIssue(
        context,
        ['expectedCurrentResourceId'],
        operation.resourceKind,
      );
    if (
      operation.operation === 'select_current' &&
      !idMatchesKind(operation.resourceKind, operation.targetResourceId)
    )
      addKindIdIssue(context, ['targetResourceId'], operation.resourceKind);
    if (
      operation.operation !== 'select_current' &&
      !authoringMatchesKind(operation.resourceKind, operation.authoring)
    )
      context.addIssue({
        code: 'custom',
        path: ['authoring'],
        message: `Authoring payload must match resourceKind ${operation.resourceKind}.`,
      });
  });

/**
 * Additive branch for the existing public `apply_operations` tool.
 * It does not declare or imply a new public tool.
 */
export const AnimationLibraryApplyOperationSchema = z.strictObject({
  animationLibrary: ApplyBodySchema,
});
export type AnimationLibraryApplyOperation = z.infer<
  typeof AnimationLibraryApplyOperationSchema
>;

export const AnimationResourceSectionSchema = z.enum([
  'identity',
  'binding',
  'lineage',
  'authoring',
  'provenance',
  'validation',
  'summary',
  'continuity',
]);
export type AnimationResourceSection = z.infer<
  typeof AnimationResourceSectionSchema
>;

const RequestedSectionsSchema = z
  .array(AnimationResourceSectionSchema)
  .min(1)
  .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumRequestedSections)
  .superRefine((sections, context) => {
    const seen = new Set<AnimationResourceSection>();
    for (const [index, section] of sections.entries()) {
      if (seen.has(section))
        context.addIssue({
          code: 'custom',
          path: [index],
          message: 'Requested semantic sections must be unique.',
        });
      seen.add(section);
    }
  });

const InspectCurrentSchema = z.strictObject({
  ...PublicResourceBaseShape,
  inspect: z.literal('current'),
  sections: RequestedSectionsSchema,
});
const InspectExactSchema = z.strictObject({
  ...PublicResourceBaseShape,
  inspect: z.literal('exact'),
  resourceId: AnimationResourceIdSchema,
  sections: RequestedSectionsSchema,
});
const InspectListSchema = z.strictObject({
  ...PublicResourceBaseShape,
  inspect: z.literal('list'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumPageSize),
  cursor: CursorSchema.optional(),
  sections: RequestedSectionsSchema,
});
const InspectBodySchema = z
  .discriminatedUnion('inspect', [
    InspectCurrentSchema,
    InspectExactSchema,
    InspectListSchema,
  ])
  .superRefine((request, context) => {
    if (
      request.inspect === 'exact' &&
      !idMatchesKind(request.resourceKind, request.resourceId)
    )
      addKindIdIssue(context, ['resourceId'], request.resourceKind);
  });

export const AnimationResourceInspectRequestSchema = z.strictObject({
  animationLibrary: InspectBodySchema,
});
export type AnimationResourceInspectRequest = z.infer<
  typeof AnimationResourceInspectRequestSchema
>;

const CompareBodySchema = z
  .strictObject({
    ...PublicResourceBaseShape,
    baseResourceId: AnimationResourceIdSchema,
    targetResourceId: AnimationResourceIdSchema,
    sections: RequestedSectionsSchema,
  })
  .superRefine((request, context) => {
    if (!idMatchesKind(request.resourceKind, request.baseResourceId))
      addKindIdIssue(context, ['baseResourceId'], request.resourceKind);
    if (!idMatchesKind(request.resourceKind, request.targetResourceId))
      addKindIdIssue(context, ['targetResourceId'], request.resourceKind);
  });

export const AnimationResourceCompareRequestSchema = z.strictObject({
  animationLibrary: CompareBodySchema,
});
export type AnimationResourceCompareRequest = z.infer<
  typeof AnimationResourceCompareRequestSchema
>;

const ValidateCurrentSchema = z.strictObject({
  ...PublicResourceBaseShape,
  validate: z.literal('current'),
});
const ValidateExactSchema = z.strictObject({
  ...PublicResourceBaseShape,
  validate: z.literal('exact'),
  resourceId: AnimationResourceIdSchema,
});
const ValidateAuthoringSchema = z.strictObject({
  ...PublicResourceBaseShape,
  validate: z.literal('authoring'),
  authoring: AnimationResourceAuthoringSchema,
});
const ValidateBodySchema = z
  .discriminatedUnion('validate', [
    ValidateCurrentSchema,
    ValidateExactSchema,
    ValidateAuthoringSchema,
  ])
  .superRefine((request, context) => {
    if (
      request.validate === 'exact' &&
      !idMatchesKind(request.resourceKind, request.resourceId)
    )
      addKindIdIssue(context, ['resourceId'], request.resourceKind);
    if (
      request.validate === 'authoring' &&
      !authoringMatchesKind(request.resourceKind, request.authoring)
    )
      context.addIssue({
        code: 'custom',
        path: ['authoring'],
        message: `Authoring payload must match resourceKind ${request.resourceKind}.`,
      });
  });

export const AnimationResourceValidateRequestSchema = z.strictObject({
  animationLibrary: ValidateBodySchema,
});
export type AnimationResourceValidateRequest = z.infer<
  typeof AnimationResourceValidateRequestSchema
>;

export const AnimationResourceIssueSchema = z.strictObject({
  code: z.enum([
    'SCHEMA_INVALID',
    'BUDGET_EXCEEDED',
    'IDENTITY_MISMATCH',
    'BINDING_MISMATCH',
    'COMPATIBILITY_MISMATCH',
    'PROVENANCE_MISMATCH',
    'MIRROR_UNAVAILABLE',
    'STALE_REVISION',
    'REVISION_NOT_FOUND',
    'INVALID_CURSOR',
    'STORAGE_FAILURE',
    'INVALID_PAGE_LIMIT',
    'MIRROR_CONTINUITY_MISMATCH',
    'CONTACT_CONTINUITY_MISMATCH',
    'EQUIPMENT_CONTINUITY_MISMATCH',
    'LOOP_SEAM_MISMATCH',
    'RIG_IDENTITY_MISMATCH',
    'POSE_LIBRARY_IDENTITY_MISMATCH',
    'CLIP_LIBRARY_IDENTITY_MISMATCH',
    'POSE_NOT_FOUND',
    'ROOT_ANCHOR_MISMATCH',
    'CLIP_NOT_FOUND',
    'SAMPLE_TIME_OUT_OF_RANGE',
    'ASSEMBLY_BINDING_MISMATCH',
  ]),
  severity: z.enum(['error', 'warning']),
  path: z
    .array(
      z.union([
        z.string().min(1).max(160),
        z.number().int().min(0).max(1_000_000),
      ]),
    )
    .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumIssuePathDepth),
  message: z
    .string()
    .min(1)
    .max(1_000)
    .regex(/^[^\\/]*$/, 'Public issue messages cannot contain file paths.'),
});
export type AnimationResourceIssue = z.infer<
  typeof AnimationResourceIssueSchema
>;

const IssuesSchema = z
  .array(AnimationResourceIssueSchema)
  .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumIssues);
const ReceiptBaseShape = {
  contractId: z.literal(ANIMATION_RESOURCE_PUBLIC_CONTRACT_ID),
  requestId: AnimationRequestIdSchema,
  receiptId: AnimationReceiptIdSchema,
  ...PublicResourceBaseShape,
  issues: IssuesSchema,
} as const;

export const AnimationResourceMutationReceiptSchema = z
  .strictObject({
    ...ReceiptBaseShape,
    operation: z.enum(['create', 'revise', 'select_current']),
    dryRun: z.boolean(),
    status: z.enum(['preview', 'applied', 'rejected']),
    priorCurrentResourceId: AnimationResourceIdSchema.nullable(),
    resourceId: AnimationResourceIdSchema.nullable(),
    currentResourceId: AnimationResourceIdSchema.nullable(),
    recordDigest: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
  })
  .superRefine((receipt, context) => {
    for (const field of [
      'priorCurrentResourceId',
      'resourceId',
      'currentResourceId',
    ] as const) {
      const resourceId = receipt[field];
      if (
        resourceId !== null &&
        !idMatchesKind(receipt.resourceKind, resourceId)
      )
        addKindIdIssue(context, [field], receipt.resourceKind);
    }
    if (receipt.dryRun && receipt.status === 'applied')
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Dry-run receipts cannot report an applied mutation.',
      });
    if (!receipt.dryRun && receipt.status === 'preview')
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Preview receipts require dryRun true.',
      });
    const hasErrors = receipt.issues.some(
      ({ severity }) => severity === 'error',
    );
    if (
      (receipt.status === 'rejected') !== hasErrors ||
      (receipt.status === 'applied' && receipt.recordDigest === null) ||
      (receipt.status !== 'applied' && receipt.recordDigest !== null)
    )
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message:
          'Mutation status must agree with errors and persisted identity.',
      });
    if (
      receipt.status === 'rejected' &&
      receipt.currentResourceId !== receipt.priorCurrentResourceId
    )
      context.addIssue({
        code: 'custom',
        path: ['currentResourceId'],
        message: 'Rejected mutations cannot change the current resource.',
      });
    if (
      receipt.status === 'preview' &&
      receipt.currentResourceId !== receipt.priorCurrentResourceId
    )
      context.addIssue({
        code: 'custom',
        path: ['currentResourceId'],
        message: 'Preview mutations cannot change the current resource.',
      });
    if (
      receipt.status === 'applied' &&
      receipt.currentResourceId !== receipt.resourceId
    )
      context.addIssue({
        code: 'custom',
        path: ['currentResourceId'],
        message: 'Applied mutations must make the persisted resource current.',
      });
    if (
      receipt.operation === 'create' &&
      receipt.priorCurrentResourceId !== null
    )
      context.addIssue({
        code: 'custom',
        path: ['priorCurrentResourceId'],
        message: 'Create receipts require an absent prior current resource.',
      });
  });
export type AnimationResourceMutationReceipt = z.infer<
  typeof AnimationResourceMutationReceiptSchema
>;

const AnimationResourceSummarySchema = z.discriminatedUnion('resourceKind', [
  z.strictObject({
    resourceKind: z.literal('rig'),
    resourceId: RigProfileIdSchema,
    parentResourceId: RigProfileIdSchema.nullable(),
    current: z.boolean(),
  }),
  z.strictObject({
    resourceKind: z.literal('pose_library'),
    resourceId: PoseLibraryIdSchema,
    parentResourceId: PoseLibraryIdSchema.nullable(),
    current: z.boolean(),
  }),
  z.strictObject({
    resourceKind: z.literal('clip_library'),
    resourceId: ClipLibraryIdSchema,
    parentResourceId: ClipLibraryIdSchema.nullable(),
    current: z.boolean(),
  }),
]);

const AnimationResourceRecordSchema = z.discriminatedUnion('resourceKind', [
  z.strictObject({
    resourceKind: z.literal('rig'),
    resourceId: RigProfileIdSchema,
    parentResourceId: RigProfileIdSchema.nullable(),
    current: z.boolean(),
    value: RigidRigProfileV2Schema,
  }),
  z.strictObject({
    resourceKind: z.literal('pose_library'),
    resourceId: PoseLibraryIdSchema,
    parentResourceId: PoseLibraryIdSchema.nullable(),
    current: z.boolean(),
    value: PoseLibrarySchema,
  }),
  z.strictObject({
    resourceKind: z.literal('clip_library'),
    resourceId: ClipLibraryIdSchema,
    parentResourceId: ClipLibraryIdSchema.nullable(),
    current: z.boolean(),
    value: ClipLibrarySchema,
  }),
]);

const InspectionSingleReceiptSchema = z.strictObject({
  ...ReceiptBaseShape,
  inspect: z.enum(['current', 'exact']),
  sections: RequestedSectionsSchema,
  resource: AnimationResourceRecordSchema.nullable(),
});
const InspectionListReceiptSchema = z.strictObject({
  ...ReceiptBaseShape,
  inspect: z.literal('list'),
  sections: RequestedSectionsSchema,
  resources: z
    .array(AnimationResourceSummarySchema)
    .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumPageSize),
  nextCursor: CursorSchema.optional(),
});

export const AnimationResourceInspectionReceiptSchema = z
  .union([InspectionSingleReceiptSchema, InspectionListReceiptSchema])
  .superRefine((receipt, context) => {
    if (receipt.inspect === 'list') {
      for (const [index, resource] of receipt.resources.entries())
        if (resource.resourceKind !== receipt.resourceKind)
          context.addIssue({
            code: 'custom',
            path: ['resources', index, 'resourceKind'],
            message: 'Listed resource kinds must match the requested kind.',
          });
      return;
    }
    if (
      receipt.resource !== null &&
      receipt.resource.resourceKind !== receipt.resourceKind
    )
      context.addIssue({
        code: 'custom',
        path: ['resource', 'resourceKind'],
        message: 'Inspected resource kind must match the requested kind.',
      });
  });
export type AnimationResourceInspectionReceipt = z.infer<
  typeof AnimationResourceInspectionReceiptSchema
>;

export const AnimationResourceChangeSchema = z.strictObject({
  kind: z.enum(['added', 'removed', 'changed']),
  path: z
    .array(
      z.union([
        z.string().min(1).max(160),
        z.number().int().min(0).max(1_000_000),
      ]),
    )
    .min(1)
    .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumIssuePathDepth),
  summary: z
    .string()
    .min(1)
    .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumChangeSummaryLength),
});
export type AnimationResourceChange = z.infer<
  typeof AnimationResourceChangeSchema
>;

export const AnimationResourceComparisonReceiptSchema = z
  .strictObject({
    ...ReceiptBaseShape,
    baseResourceId: AnimationResourceIdSchema,
    targetResourceId: AnimationResourceIdSchema,
    equal: z.boolean(),
    changes: z
      .array(AnimationResourceChangeSchema)
      .max(ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumChanges),
  })
  .superRefine((receipt, context) => {
    if (!idMatchesKind(receipt.resourceKind, receipt.baseResourceId))
      addKindIdIssue(context, ['baseResourceId'], receipt.resourceKind);
    if (!idMatchesKind(receipt.resourceKind, receipt.targetResourceId))
      addKindIdIssue(context, ['targetResourceId'], receipt.resourceKind);
    if (receipt.equal !== (receipt.changes.length === 0))
      context.addIssue({
        code: 'custom',
        path: ['equal'],
        message: 'Comparison equality must agree with the bounded change set.',
      });
  });
export type AnimationResourceComparisonReceipt = z.infer<
  typeof AnimationResourceComparisonReceiptSchema
>;

export const AnimationResourceValidationReceiptSchema = z
  .strictObject({
    ...ReceiptBaseShape,
    validate: z.enum(['current', 'exact', 'authoring']),
    resourceId: AnimationResourceIdSchema.nullable(),
    valid: z.boolean(),
  })
  .superRefine((receipt, context) => {
    if (
      receipt.resourceId !== null &&
      !idMatchesKind(receipt.resourceKind, receipt.resourceId)
    )
      addKindIdIssue(context, ['resourceId'], receipt.resourceKind);
    const hasErrors = receipt.issues.some(
      ({ severity }) => severity === 'error',
    );
    if (receipt.valid === hasErrors)
      context.addIssue({
        code: 'custom',
        path: ['valid'],
        message: 'Validation status must agree with structured error issues.',
      });
  });
export type AnimationResourceValidationReceipt = z.infer<
  typeof AnimationResourceValidationReceiptSchema
>;
