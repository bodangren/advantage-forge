import { z } from 'zod';

import {
  ConnectionDefinitionSchema,
  PartInstanceSchema,
  PoseDefinitionSchema,
  SemanticIdSchema,
  SpriteRenderProfileSchema,
  TransformSchema,
  VariantDefinitionSchema,
  type AssetDocument,
  type ValidationIssue,
} from '../contracts/index.js';
import { freezeDocument } from './canonical.js';
import { parseAssetDocument } from './parse.js';

export const SemanticOperationSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('addPart'), part: PartInstanceSchema }),
  z.strictObject({
    operation: z.literal('removePart'),
    partId: SemanticIdSchema,
  }),
  z.strictObject({
    operation: z.literal('setPartTransform'),
    partId: SemanticIdSchema,
    transform: TransformSchema,
  }),
  z.strictObject({
    operation: z.literal('setPartVisibility'),
    partId: SemanticIdSchema,
    visible: z.boolean(),
  }),
  z.strictObject({
    operation: z.literal('connectParts'),
    connection: ConnectionDefinitionSchema,
  }),
  z.strictObject({
    operation: z.literal('disconnectParts'),
    connectionId: SemanticIdSchema,
  }),
  z.strictObject({
    operation: z.literal('upsertPose'),
    pose: PoseDefinitionSchema,
  }),
  z.strictObject({
    operation: z.literal('upsertVariant'),
    variant: VariantDefinitionSchema,
  }),
  z.strictObject({
    operation: z.literal('upsertRenderProfile'),
    renderProfile: SpriteRenderProfileSchema,
  }),
]);
export const SemanticPatchSchema = z.strictObject({
  operations: z.array(SemanticOperationSchema).min(1).max(100),
});
export type SemanticOperation = z.infer<typeof SemanticOperationSchema>;
export type SemanticPatch = z.infer<typeof SemanticPatchSchema>;

export type PatchResult =
  | {
      readonly ok: true;
      readonly document: Readonly<AssetDocument>;
      readonly affectedIds: readonly string[];
    }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

function failure(path: string, message: string, actual?: unknown): PatchResult {
  return {
    ok: false,
    issues: [
      {
        code: 'PATCH_REJECTED',
        severity: 'error',
        path,
        message,
        actual,
        guidance:
          'Inspect the active document and submit a localized operation using an existing stable ID.',
      },
    ],
  };
}

function replaceById<T extends { id: string }>(
  items: readonly T[],
  value: T,
): T[] {
  const index = items.findIndex(({ id }) => id === value.id);
  return index < 0
    ? [...items, value]
    : items.map((item) => (item.id === value.id ? value : item));
}

/** Applies only the bounded semantic operations declared above and never mutates the input revision. */
export function applySemanticPatch(
  document: Readonly<AssetDocument>,
  input: unknown,
): PatchResult {
  const parsedPatch = SemanticPatchSchema.safeParse(input);
  if (!parsedPatch.success)
    return failure(
      '$',
      parsedPatch.error.issues[0]?.message ?? 'Invalid semantic patch.',
      input,
    );
  const next = structuredClone(document) as AssetDocument;
  const affected = new Set<string>();
  for (const operation of parsedPatch.data.operations) {
    switch (operation.operation) {
      case 'addPart':
        if (next.assembly.parts.some(({ id }) => id === operation.part.id))
          return failure(
            '$.operations',
            `Part ${operation.part.id} already exists.`,
          );
        next.assembly.parts.push(operation.part);
        affected.add(operation.part.id);
        break;
      case 'removePart':
        if (!next.assembly.parts.some(({ id }) => id === operation.partId))
          return failure(
            '$.operations',
            `Part ${operation.partId} was not found.`,
          );
        if (
          next.assembly.connections.some(
            (connection) =>
              connection.parentPartId === operation.partId ||
              connection.childPartId === operation.partId,
          )
        )
          return failure(
            '$.operations',
            `Disconnect part ${operation.partId} before removing it.`,
          );
        next.assembly.parts = next.assembly.parts.filter(
          ({ id }) => id !== operation.partId,
        );
        affected.add(operation.partId);
        break;
      case 'setPartTransform':
      case 'setPartVisibility': {
        const part = next.assembly.parts.find(
          ({ id }) => id === operation.partId,
        );
        if (!part)
          return failure(
            '$.operations',
            `Part ${operation.partId} was not found.`,
          );
        next.assembly.parts = next.assembly.parts.map((candidate) =>
          candidate.id !== operation.partId
            ? candidate
            : operation.operation === 'setPartTransform'
              ? { ...candidate, transform: operation.transform }
              : { ...candidate, visible: operation.visible },
        );
        affected.add(operation.partId);
        break;
      }
      case 'connectParts':
        if (
          next.assembly.connections.some(
            ({ id }) => id === operation.connection.id,
          )
        )
          return failure(
            '$.operations',
            `Connection ${operation.connection.id} already exists.`,
          );
        next.assembly.connections.push(operation.connection);
        affected.add(operation.connection.id);
        break;
      case 'disconnectParts':
        if (
          !next.assembly.connections.some(
            ({ id }) => id === operation.connectionId,
          )
        )
          return failure(
            '$.operations',
            `Connection ${operation.connectionId} was not found.`,
          );
        next.assembly.connections = next.assembly.connections.filter(
          ({ id }) => id !== operation.connectionId,
        );
        affected.add(operation.connectionId);
        break;
      case 'upsertPose':
        next.poses = replaceById(next.poses, operation.pose);
        affected.add(operation.pose.id);
        break;
      case 'upsertVariant':
        next.variants = replaceById(next.variants, operation.variant);
        affected.add(operation.variant.id);
        break;
      case 'upsertRenderProfile':
        next.renderProfiles = replaceById(
          next.renderProfiles,
          operation.renderProfile,
        );
        affected.add(operation.renderProfile.id);
        break;
    }
  }
  const validated = parseAssetDocument(next);
  if (!validated.ok) return { ok: false, issues: validated.issues };
  return {
    ok: true,
    document: freezeDocument(validated.document),
    affectedIds: [...affected].sort(),
  };
}

export function validateSemanticPatch(input: unknown): input is SemanticPatch {
  return SemanticPatchSchema.safeParse(input).success;
}
