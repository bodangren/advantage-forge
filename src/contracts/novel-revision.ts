import { z } from 'zod';

import { NovelAssetCompletenessSchema } from './novel-identity.js';

const SemanticIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const RevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);

export const RestoreRevisionOperationSchema = z.strictObject({
  revisionId: RevisionIdSchema,
});

export const NovelRevisionStateSchema = z.strictObject({
  origin: z.enum(['novel', 'reference']),
  completeness: NovelAssetCompletenessSchema.nullable(),
});

export const NovelRequiredRoleChangeSchema = z.strictObject({
  role: SemanticIdSchema,
  baseRequiredCount: z.number().int().nonnegative(),
  targetRequiredCount: z.number().int().nonnegative(),
  basePresentCount: z.number().int().nonnegative(),
  targetPresentCount: z.number().int().nonnegative(),
  baseSatisfied: z.boolean(),
  targetSatisfied: z.boolean(),
});

export type RestoreRevisionOperation = z.infer<
  typeof RestoreRevisionOperationSchema
>;
export type NovelRevisionState = z.infer<typeof NovelRevisionStateSchema>;
export type NovelRequiredRoleChange = z.infer<
  typeof NovelRequiredRoleChangeSchema
>;
