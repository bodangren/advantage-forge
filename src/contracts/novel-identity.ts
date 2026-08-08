import { z } from 'zod';

import {
  ForgeRenderProfileSchema,
  ForgeStyleProfileSchema,
} from './interchange.js';

export const NOVEL_ASSET_IDENTITY_CONTRACT_ID =
  'forge-novel-asset-identity/v1' as const;

export const NovelAssetFamilySchema = z.enum(['humanoid', 'standalone-prop']);
export const NovelAssetArchetypeIdSchema = z.enum([
  'humanoid.biped.rustic',
  'prop.banded-container.rustic',
]);

const compatibleArchetype = (
  family: z.infer<typeof NovelAssetFamilySchema>,
  archetypeId: z.infer<typeof NovelAssetArchetypeIdSchema>,
): boolean =>
  (family === 'humanoid' && archetypeId === 'humanoid.biped.rustic') ||
  (family === 'standalone-prop' &&
    archetypeId === 'prop.banded-container.rustic');

export const NovelAssetIdentityMetadataSchema = z
  .strictObject({
    contractId: z.literal(NOVEL_ASSET_IDENTITY_CONTRACT_ID),
    origin: z.literal('novel'),
    family: NovelAssetFamilySchema,
    archetypeId: NovelAssetArchetypeIdSchema,
    styleProfile: ForgeStyleProfileSchema,
    renderProfile: ForgeRenderProfileSchema,
  })
  .superRefine((identity, context) => {
    if (!compatibleArchetype(identity.family, identity.archetypeId))
      context.addIssue({
        code: 'custom',
        path: ['archetypeId'],
        message: `Archetype ${identity.archetypeId} does not belong to family ${identity.family}.`,
      });
  });

const NovelAssetIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/)
  .refine(
    (assetId) =>
      !['forge', 'reference', 'system'].includes(assetId.split('.')[0] ?? ''),
    'Asset ID uses a reserved namespace.',
  );

const DefaultStyleProfile = {
  id: 'cute_chibi_v1',
  version: '1.0.0',
  review: { status: 'not_required' },
} as const;
const DefaultRenderProfile = {
  id: 'fantasy.sprite.orthographic.v1',
  version: '1.0.0',
} as const;

export const NovelAssetIdentityRequestSchema = z
  .strictObject({
    assetId: NovelAssetIdSchema,
    name: z.string().min(1).max(120),
    kitId: z.literal('rustic-human'),
    family: NovelAssetFamilySchema,
    archetypeId: NovelAssetArchetypeIdSchema,
    seed: z.number().int().min(0).max(2_147_483_647),
    styleProfile: ForgeStyleProfileSchema.default(DefaultStyleProfile),
    renderProfile: ForgeRenderProfileSchema.default(DefaultRenderProfile),
  })
  .superRefine((identity, context) => {
    if (!compatibleArchetype(identity.family, identity.archetypeId))
      context.addIssue({
        code: 'custom',
        path: ['archetypeId'],
        message: `Archetype ${identity.archetypeId} does not belong to family ${identity.family}.`,
      });
  });

const RoleIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
export const NovelAssetRoleRequirementSchema = z.strictObject({
  role: RoleIdSchema,
  requiredCount: z.number().int().min(1).max(32),
  defaultTemplateId: RoleIdSchema,
  defaultMaterialBindings: z
    .array(z.strictObject({ slot: RoleIdSchema, materialId: RoleIdSchema }))
    .min(1)
    .max(16),
  requiredPortIds: z.array(RoleIdSchema).min(1).max(16),
});
export const NovelAssetArchetypeSchema = z
  .strictObject({
    id: NovelAssetArchetypeIdSchema,
    family: NovelAssetFamilySchema,
    name: z.string().min(1).max(120),
    requirements: z.array(NovelAssetRoleRequirementSchema).min(1).max(32),
    allowedTemplateIds: z.array(RoleIdSchema).min(1).max(64),
  })
  .superRefine((archetype, context) => {
    for (const [index, requirement] of archetype.requirements.entries()) {
      if (!archetype.allowedTemplateIds.includes(requirement.defaultTemplateId))
        context.addIssue({
          code: 'custom',
          path: ['requirements', index, 'defaultTemplateId'],
          message: 'Default template must be allowed by the archetype.',
        });
      if (
        new Set(requirement.requiredPortIds).size !==
        requirement.requiredPortIds.length
      )
        context.addIssue({
          code: 'custom',
          path: ['requirements', index, 'requiredPortIds'],
          message: 'Required port IDs must be unique.',
        });
    }
  });
export const NovelAssetCompletenessSchema = z.strictObject({
  state: z.enum(['incomplete', 'complete']),
  presentRoles: z.array(
    z.strictObject({
      role: RoleIdSchema,
      presentCount: z.number().int().nonnegative(),
    }),
  ),
  missingRequirements: z.array(
    z.strictObject({
      role: RoleIdSchema,
      requiredCount: z.number().int().positive(),
      presentCount: z.number().int().nonnegative(),
    }),
  ),
  unattachedPartIds: z.array(RoleIdSchema).max(2_000),
});

export type NovelAssetIdentityMetadata = z.infer<
  typeof NovelAssetIdentityMetadataSchema
>;
export type NovelAssetIdentityRequest = z.infer<
  typeof NovelAssetIdentityRequestSchema
>;
export type NovelAssetArchetype = z.infer<typeof NovelAssetArchetypeSchema>;
export type NovelAssetCompleteness = z.infer<
  typeof NovelAssetCompletenessSchema
>;
