import {
  POSE_LIBRARY_CONTRACT_ID,
  RIGID_RIG_PROFILE_V2_CONTRACT_ID,
  createPoseLibrary,
  createRigidRigProfileV2,
  ForgeDomainError,
  type AssetDocument,
  type PoseLibrary,
  type RigidRigProfileV2,
} from '../contracts/index.js';
import {
  CLIP_LIBRARY_CONTRACT_ID,
  createClipLibrary,
  type ClipLibrary,
} from '../contracts/clip-library-v2.js';
import {
  ANIMATION_RESOURCE_PUBLIC_CONTRACT_ID,
  AnimationLibraryApplyOperationSchema,
  AnimationResourceMutationReceiptSchema,
  type AnimationLibraryApplyOperation,
  type AnimationResourceKind,
  type AnimationResourceMutationReceipt,
} from '../contracts/animation-resource-public.js';
import type { RevisionRepository } from '../document/index.js';

export interface DerivedAnimationBinding {
  readonly assetRevisionId: string;
  readonly morphologyRevisionId: string;
  readonly equipmentSignature: string;
  readonly assemblySignature: string;
}

type AnimationResourceValue = RigidRigProfileV2 | PoseLibrary | ClipLibrary;

export interface AnimationResourceStoreSaveInput {
  readonly streamId: string;
  readonly kind: AnimationResourceKind;
  readonly contentId: string;
  readonly expectedCurrentId: string | null;
  readonly value: AnimationResourceValue;
  readonly binding: DerivedAnimationBinding;
}

export interface AnimationResourceStoreRecord {
  readonly kind: AnimationResourceKind;
  readonly contentId: string;
  readonly recordDigest: string;
  readonly binding: DerivedAnimationBinding;
}

export interface AnimationResourceStore {
  getCurrent(
    streamId: string,
    kind: AnimationResourceKind,
  ): Promise<AnimationResourceStoreRecord | undefined>;
  getExact(
    streamId: string,
    kind: AnimationResourceKind,
    contentId: string,
  ): Promise<AnimationResourceStoreRecord | undefined>;
  save(
    input: AnimationResourceStoreSaveInput,
  ): Promise<AnimationResourceStoreRecord>;
  selectCurrent?(
    streamId: string,
    kind: AnimationResourceKind,
    targetResourceId: string,
    expectedCurrentId: string | null,
  ): Promise<AnimationResourceStoreRecord>;
  rollbackCurrent(
    streamId: string,
    kind: AnimationResourceKind,
    expectedPersistedId: string,
    priorCurrentId: string | null,
  ): Promise<void>;
}

async function storageCall<Value>(
  operation: () => Promise<Value>,
  path: readonly (string | number)[],
): Promise<Value> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ForgeDomainError) throw error;
    throw new ForgeDomainError(
      'STORAGE_FAILURE',
      path,
      'Animation resource storage failed.',
      { cause: error },
    );
  }
}

function sameBinding(
  left: DerivedAnimationBinding,
  right: DerivedAnimationBinding,
): boolean {
  return (
    left.assetRevisionId === right.assetRevisionId &&
    left.morphologyRevisionId === right.morphologyRevisionId &&
    left.equipmentSignature === right.equipmentSignature &&
    left.assemblySignature === right.assemblySignature
  );
}

function validPersistedRecord(
  record: AnimationResourceStoreRecord,
  kind: AnimationResourceKind,
  contentId: string,
  binding: DerivedAnimationBinding,
): boolean {
  return (
    record.kind === kind &&
    record.contentId === contentId &&
    /^[a-f0-9]{64}$/.test(record.recordDigest) &&
    sameBinding(record.binding, binding)
  );
}

export interface AnimationResourceWorkflowDependencies {
  readonly revisions: RevisionRepository;
  readonly deriveBinding: (
    document: Readonly<AssetDocument>,
    revisionId: string,
  ) => Promise<DerivedAnimationBinding>;
  readonly store: AnimationResourceStore;
}

export interface AnimationResourceWorkflow {
  mutate(
    operation: AnimationLibraryApplyOperation,
  ): Promise<AnimationResourceMutationReceipt>;
}

function canonicalValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalValue(entry)).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalValue(entry)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

async function sha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalValue(value)),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function createValue(
  operation: Exclude<
    AnimationLibraryApplyOperation['animationLibrary'],
    { operation: 'select_current' }
  >,
  binding: DerivedAnimationBinding,
): Promise<AnimationResourceValue> {
  if (operation.resourceKind === 'rig') {
    if (!('rootPartId' in operation.authoring))
      throw new ForgeDomainError(
        'COMPATIBILITY_MISMATCH',
        ['animationLibrary', 'authoring'],
        'Rig operations require rigid-rig authoring.',
      );
    return createRigidRigProfileV2({
      contractId: RIGID_RIG_PROFILE_V2_CONTRACT_ID,
      ...binding,
      ...operation.authoring,
    });
  }
  if (operation.resourceKind === 'pose_library') {
    if (!('references' in operation.authoring))
      throw new ForgeDomainError(
        'COMPATIBILITY_MISMATCH',
        ['animationLibrary', 'authoring'],
        'Pose-library operations require pose authoring.',
      );
    return createPoseLibrary({
      contractId: POSE_LIBRARY_CONTRACT_ID,
      binding: {
        assetRevisionId: binding.assetRevisionId,
        morphologyRevisionId: binding.morphologyRevisionId,
        equipmentSignature: binding.equipmentSignature,
        rigProfileId: operation.authoring.rigProfileId,
      },
      references: operation.authoring.references,
      poses: operation.authoring.poses,
    });
  }
  if (!('poseLibraryId' in operation.authoring))
    throw new ForgeDomainError(
      'COMPATIBILITY_MISMATCH',
      ['animationLibrary', 'authoring'],
      'Clip-library operations require clip authoring.',
    );
  return createClipLibrary({
    contractId: CLIP_LIBRARY_CONTRACT_ID,
    binding: {
      assetRevisionId: binding.assetRevisionId,
      morphologyRevisionId: binding.morphologyRevisionId,
      equipmentSignature: binding.equipmentSignature,
      rigProfileId: operation.authoring.rigProfileId,
      poseLibraryId: operation.authoring.poseLibraryId,
    },
    clips: operation.authoring.clips,
  });
}

function resourceId(value: AnimationResourceValue): string {
  if ('profileId' in value) return value.profileId;
  return value.libraryId;
}

export function createAnimationResourceWorkflow(
  dependencies: AnimationResourceWorkflowDependencies,
): AnimationResourceWorkflow {
  return {
    async mutate(input) {
      const parsed = AnimationLibraryApplyOperationSchema.parse(
        structuredClone(input),
      );
      const operation = parsed.animationLibrary;
      const revision = await storageCall(
        () =>
          dependencies.revisions.get(
            operation.assetId,
            operation.assetRevisionId,
          ),
        ['animationLibrary', 'assetRevisionId'],
      );
      if (revision === undefined)
        throw new ForgeDomainError(
          'REVISION_NOT_FOUND',
          ['animationLibrary', 'assetRevisionId'],
          'The exact asset revision was not found.',
        );
      if (
        revision.assetId !== operation.assetId ||
        revision.document.id !== operation.assetId
      )
        throw new ForgeDomainError(
          'BINDING_MISMATCH',
          ['animationLibrary', 'assetId'],
          'Loaded revision identity does not match the requested asset.',
        );
      let binding: DerivedAnimationBinding;
      try {
        binding = await dependencies.deriveBinding(
          revision.document,
          revision.revisionId,
        );
      } catch (error) {
        throw new ForgeDomainError(
          'BINDING_MISMATCH',
          ['animationLibrary', 'assetRevisionId'],
          'Animation binding derivation failed.',
          { cause: error },
        );
      }
      if (
        revision.revisionId !== operation.assetRevisionId ||
        binding.assetRevisionId !== operation.assetRevisionId
      )
        throw new ForgeDomainError(
          'BINDING_MISMATCH',
          ['animationLibrary', 'assetRevisionId'],
          'Derived animation binding does not match the exact asset revision.',
        );

      const requestId = `animation-request.${await sha256(parsed)}`;
      const current = await storageCall(
        () =>
          dependencies.store.getCurrent(
            operation.streamId,
            operation.resourceKind,
          ),
        ['animationLibrary', 'expectedCurrentResourceId'],
      );
      if (
        current?.contentId !==
        (operation.expectedCurrentResourceId ?? undefined)
      )
        throw new ForgeDomainError(
          'STALE_REVISION',
          ['animationLibrary', 'expectedCurrentResourceId'],
          'Animation resource compare and swap precondition is stale.',
        );
      let id: string;
      let recordDigest: string | null = null;
      if (operation.operation === 'select_current') {
        id = operation.targetResourceId;
        const target = await storageCall(
          () =>
            dependencies.store.getExact(
              operation.streamId,
              operation.resourceKind,
              id,
            ),
          ['animationLibrary', 'targetResourceId'],
        );
        if (target === undefined)
          throw new ForgeDomainError(
            'REVISION_NOT_FOUND',
            ['animationLibrary', 'targetResourceId'],
            'The exact animation resource was not found.',
          );
        if (!sameBinding(target.binding, binding))
          throw new ForgeDomainError(
            'BINDING_MISMATCH',
            ['animationLibrary', 'targetResourceId'],
            'The selected animation resource belongs to another asset binding.',
          );
        if (!operation.dryRun) {
          if (dependencies.store.selectCurrent === undefined)
            throw new ForgeDomainError(
              'STORAGE_FAILURE',
              ['animationLibrary', 'operation'],
              'The animation-resource store cannot select current records.',
            );
          const persisted = await storageCall(
            () =>
              dependencies.store.selectCurrent!(
                operation.streamId,
                operation.resourceKind,
                id,
                operation.expectedCurrentResourceId,
              ),
            ['animationLibrary', 'operation'],
          );
          if (
            !validPersistedRecord(
              persisted,
              operation.resourceKind,
              id,
              binding,
            )
          ) {
            await storageCall(
              () =>
                dependencies.store.rollbackCurrent(
                  operation.streamId,
                  operation.resourceKind,
                  id,
                  operation.expectedCurrentResourceId,
                ),
              ['animationLibrary', 'operation'],
            );
            throw new ForgeDomainError(
              'STORAGE_FAILURE',
              ['animationLibrary', 'operation'],
              'Animation resource storage returned a mismatched record.',
            );
          }
          recordDigest = persisted.recordDigest;
        }
      } else {
        const value = await createValue(operation, binding);
        id = resourceId(value);
        if (!operation.dryRun) {
          const persisted = await storageCall(
            () =>
              dependencies.store.save({
                streamId: operation.streamId,
                kind: operation.resourceKind,
                contentId: id,
                expectedCurrentId: operation.expectedCurrentResourceId,
                value,
                binding,
              }),
            ['animationLibrary', 'operation'],
          );
          if (
            !validPersistedRecord(
              persisted,
              operation.resourceKind,
              id,
              binding,
            )
          ) {
            await storageCall(
              () =>
                dependencies.store.rollbackCurrent(
                  operation.streamId,
                  operation.resourceKind,
                  id,
                  operation.expectedCurrentResourceId,
                ),
              ['animationLibrary', 'operation'],
            );
            throw new ForgeDomainError(
              'STORAGE_FAILURE',
              ['animationLibrary', 'operation'],
              'Animation resource storage returned a mismatched record.',
            );
          }
          recordDigest = persisted.recordDigest;
        }
      }

      const receiptWithoutId = {
        contractId: ANIMATION_RESOURCE_PUBLIC_CONTRACT_ID,
        requestId,
        assetId: operation.assetId,
        assetRevisionId: operation.assetRevisionId,
        streamId: operation.streamId,
        resourceKind: operation.resourceKind,
        issues: [],
        operation: operation.operation,
        dryRun: operation.dryRun,
        status: operation.dryRun ? ('preview' as const) : ('applied' as const),
        priorCurrentResourceId: operation.expectedCurrentResourceId,
        resourceId: id,
        currentResourceId: operation.dryRun
          ? operation.expectedCurrentResourceId
          : id,
        recordDigest,
      };
      return AnimationResourceMutationReceiptSchema.parse({
        ...receiptWithoutId,
        receiptId: `animation-receipt.${await sha256(receiptWithoutId)}`,
      });
    },
  };
}
