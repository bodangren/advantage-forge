import { describe, expect, it } from 'vitest';

import {
  ANIMATION_RESOURCE_PUBLIC_BUDGETS,
  AnimationLibraryApplyOperationSchema,
  AnimationResourceCompareRequestSchema,
  AnimationResourceComparisonReceiptSchema,
  AnimationResourceInspectRequestSchema,
  AnimationResourceInspectionReceiptSchema,
  AnimationResourceIssueSchema,
  AnimationResourceMutationReceiptSchema,
  AnimationResourceValidateRequestSchema,
  AnimationResourceValidationReceiptSchema,
} from '../../src/contracts/animation-resource-public.js';
import { validRigPayload } from './rig-v2-fixture.js';

const hex = (character: string) => character.repeat(64);
const revisionId = `revision.${hex('1')}`;
const rigId = `rig-v2.${hex('2')}`;
const priorRigId = `rig-v2.${hex('3')}`;
const poseLibraryId = `pose-library.${hex('4')}`;
const clipLibraryId = `clip-library.${hex('5')}`;
const requestId = `animation-request.${hex('6')}`;
const receiptId = `animation-receipt.${hex('7')}`;

function rigAuthoring() {
  const {
    contractId: _contractId,
    assetRevisionId: _assetRevisionId,
    morphologyRevisionId: _morphologyRevisionId,
    equipmentSignature: _equipmentSignature,
    assemblySignature: _assemblySignature,
    ...authoring
  } = validRigPayload();
  void _contractId;
  void _assetRevisionId;
  void _morphologyRevisionId;
  void _equipmentSignature;
  void _assemblySignature;
  return authoring;
}

const publicBase = {
  assetId: 'hero.primary',
  assetRevisionId: revisionId,
  streamId: 'hero.primary',
} as const;

describe('public animation-resource contracts', () => {
  it('accepts strict create, revise, and select-current operations with exact CAS', () => {
    const create = AnimationLibraryApplyOperationSchema.parse({
      animationLibrary: {
        ...publicBase,
        operation: 'create',
        resourceKind: 'rig',
        expectedCurrentResourceId: null,
        dryRun: true,
        authoring: rigAuthoring(),
      },
    });
    expect(create.animationLibrary).toMatchObject({
      operation: 'create',
      resourceKind: 'rig',
      expectedCurrentResourceId: null,
      dryRun: true,
    });

    expect(
      AnimationLibraryApplyOperationSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          operation: 'revise',
          resourceKind: 'pose_library',
          expectedCurrentResourceId: poseLibraryId,
          dryRun: false,
          authoring: {
            rigProfileId: rigId,
            references: [
              {
                referenceId: 'reference.primary',
                sourceKind: 'built_in',
                sourceDigest: hex('8'),
                sourceArtifactDigest: hex('9'),
              },
            ],
            poses: [
              {
                semanticId: 'pose.rest',
                referenceIds: ['reference.primary'],
                tags: [],
                channels: [],
                contacts: [],
                root: { policy: 'locked' },
                equipmentSlots: [],
                mirrorPolicy: 'symmetric',
                mirrorPoseId: 'pose.rest',
                mirrorPlane: 'YZ',
              },
            ],
          },
        },
      }).success,
    ).toBe(true);

    expect(
      AnimationLibraryApplyOperationSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          operation: 'select_current',
          resourceKind: 'clip_library',
          expectedCurrentResourceId: null,
          targetResourceId: clipLibraryId,
          dryRun: false,
        },
      }).success,
    ).toBe(true);
  });

  it('rejects caller-authored derived bindings and cross-kind resource identities', () => {
    expect(
      AnimationLibraryApplyOperationSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          operation: 'create',
          resourceKind: 'rig',
          expectedCurrentResourceId: priorRigId,
          dryRun: false,
          authoring: rigAuthoring(),
        },
      }).success,
    ).toBe(false);

    const callerBound = AnimationLibraryApplyOperationSchema.safeParse({
      animationLibrary: {
        ...publicBase,
        operation: 'create',
        resourceKind: 'rig',
        expectedCurrentResourceId: null,
        dryRun: true,
        authoring: {
          ...rigAuthoring(),
          assetRevisionId: revisionId,
        },
      },
    });
    expect(callerBound.success).toBe(false);
    if (!callerBound.success)
      expect(callerBound.error.issues[0]?.path).toEqual([
        'animationLibrary',
        'authoring',
      ]);

    const wrongKind = AnimationLibraryApplyOperationSchema.safeParse({
      animationLibrary: {
        ...publicBase,
        operation: 'select_current',
        resourceKind: 'rig',
        expectedCurrentResourceId: priorRigId,
        targetResourceId: poseLibraryId,
        dryRun: false,
      },
    });
    expect(wrongKind.success).toBe(false);
    if (!wrongKind.success)
      expect(wrongKind.error.issues[0]?.path).toEqual([
        'animationLibrary',
        'targetResourceId',
      ]);
  });

  it('bounds semantic inspection sections, cursors, pagination, comparison, and validation', () => {
    expect(
      AnimationResourceInspectRequestSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          resourceKind: 'rig',
          inspect: 'current',
          sections: ['identity', 'binding', 'authoring'],
        },
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceInspectRequestSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          resourceKind: 'pose_library',
          inspect: 'exact',
          resourceId: poseLibraryId,
          sections: ['identity'],
        },
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceInspectRequestSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          resourceKind: 'clip_library',
          inspect: 'list',
          limit: ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumPageSize,
          cursor: 'a'.repeat(
            ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumCursorLength,
          ),
          sections: ['identity', 'lineage'],
        },
      }).success,
    ).toBe(true);

    const overSections = AnimationResourceInspectRequestSchema.safeParse({
      animationLibrary: {
        ...publicBase,
        resourceKind: 'rig',
        inspect: 'current',
        sections: Array.from(
          {
            length:
              ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumRequestedSections + 1,
          },
          () => 'identity',
        ),
      },
    });
    expect(overSections.success).toBe(false);
    if (!overSections.success)
      expect(overSections.error.issues[0]?.path).toEqual([
        'animationLibrary',
        'sections',
      ]);

    for (const invalidListFields of [
      {
        limit: ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumPageSize + 1,
      },
      {
        limit: 1,
        cursor: 'a'.repeat(
          ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumCursorLength + 1,
        ),
      },
    ])
      expect(
        AnimationResourceInspectRequestSchema.safeParse({
          animationLibrary: {
            ...publicBase,
            resourceKind: 'rig',
            inspect: 'list',
            sections: ['identity'],
            ...invalidListFields,
          },
        }).success,
      ).toBe(false);

    expect(
      AnimationResourceCompareRequestSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          resourceKind: 'rig',
          baseResourceId: priorRigId,
          targetResourceId: rigId,
          sections: ['identity', 'authoring'],
        },
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceValidateRequestSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          resourceKind: 'clip_library',
          validate: 'exact',
          resourceId: clipLibraryId,
        },
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceValidateRequestSchema.safeParse({
        animationLibrary: {
          ...publicBase,
          resourceKind: 'clip_library',
          validate: 'authoring',
          authoring: {
            rigProfileId: rigId,
            poseLibraryId,
            clips: [
              {
                semanticId: 'idle.once',
                durationMs: 100,
                playback: 'once',
                interpolation: 'step',
                rootAnchorPolicy: 'locked',
                keyframes: [
                  { timeMs: 0, poseId: 'pose.rest' },
                  { timeMs: 100, poseId: 'pose.rest' },
                ],
                continuityHooks: [],
              },
            ],
          },
        },
      }).success,
    ).toBe(true);
  });

  it('preserves numeric issue-path segments and bounds issue payloads', () => {
    const issue = AnimationResourceIssueSchema.parse({
      code: 'COMPATIBILITY_MISMATCH',
      severity: 'error',
      path: ['clips', 17, 'keyframes', 3, 'timeMs'],
      message: 'Terminal keyframe is missing.',
    });
    expect(issue.path).toEqual(['clips', 17, 'keyframes', 3, 'timeMs']);
    expect(typeof issue.path[1]).toBe('number');

    expect(
      AnimationResourceIssueSchema.safeParse({
        ...issue,
        path: Array.from(
          {
            length: ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumIssuePathDepth + 1,
          },
          (_, index) => index,
        ),
      }).success,
    ).toBe(false);
  });

  it('accepts bounded path-free mutation, inspection, comparison, and validation receipts', () => {
    const issue = {
      code: 'BINDING_MISMATCH',
      severity: 'error',
      path: ['binding', 'rigProfileId'],
      message: 'The resource binding is stale.',
    } as const;
    const receiptBase = {
      contractId: 'forge-animation-resource-public/v1',
      requestId,
      receiptId,
      ...publicBase,
      resourceKind: 'rig',
      issues: [issue],
    } as const;

    expect(
      AnimationResourceMutationReceiptSchema.safeParse({
        ...receiptBase,
        issues: [],
        operation: 'revise',
        dryRun: true,
        status: 'preview',
        priorCurrentResourceId: priorRigId,
        resourceId: rigId,
        currentResourceId: priorRigId,
        recordDigest: null,
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceInspectionReceiptSchema.safeParse({
        ...receiptBase,
        inspect: 'list',
        sections: ['identity'],
        resources: [
          {
            resourceKind: 'rig',
            resourceId: rigId,
            parentResourceId: priorRigId,
            current: true,
          },
        ],
        nextCursor: 'next_page',
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceComparisonReceiptSchema.safeParse({
        ...receiptBase,
        baseResourceId: priorRigId,
        targetResourceId: rigId,
        equal: false,
        changes: [
          {
            kind: 'changed',
            path: ['joints', 1, 'dofs', 0],
            summary: 'Authored DOF range changed.',
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      AnimationResourceValidationReceiptSchema.safeParse({
        ...receiptBase,
        validate: 'exact',
        resourceId: rigId,
        valid: false,
      }).success,
    ).toBe(true);

    expect(
      AnimationResourceInspectionReceiptSchema.safeParse({
        ...receiptBase,
        inspect: 'list',
        sections: ['identity'],
        resources: Array.from(
          {
            length: ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumPageSize + 1,
          },
          () => ({
            resourceKind: 'rig',
            resourceId: rigId,
            parentResourceId: priorRigId,
            current: false,
          }),
        ),
      }).success,
    ).toBe(false);
    expect(
      AnimationResourceComparisonReceiptSchema.safeParse({
        ...receiptBase,
        baseResourceId: priorRigId,
        targetResourceId: rigId,
        equal: false,
        changes: Array.from(
          { length: ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumChanges + 1 },
          (_, index) => ({
            kind: 'changed',
            path: ['joints', index],
            summary: 'Bounded change.',
          }),
        ),
      }).success,
    ).toBe(false);
    expect(
      AnimationResourceMutationReceiptSchema.safeParse({
        ...receiptBase,
        issues: Array.from(
          { length: ANIMATION_RESOURCE_PUBLIC_BUDGETS.maximumIssues + 1 },
          () => issue,
        ),
        operation: 'revise',
        dryRun: true,
        status: 'rejected',
        priorCurrentResourceId: priorRigId,
        resourceId: rigId,
        currentResourceId: priorRigId,
        recordDigest: null,
      }).success,
    ).toBe(false);

    const leakedPath = AnimationResourceMutationReceiptSchema.safeParse({
      ...receiptBase,
      operation: 'create',
      dryRun: false,
      status: 'applied',
      priorCurrentResourceId: null,
      resourceId: rigId,
      currentResourceId: rigId,
      recordDigest: hex('9'),
      filePath: '/home/example/private/rig.json',
    });
    expect(leakedPath.success).toBe(false);
  });
});
