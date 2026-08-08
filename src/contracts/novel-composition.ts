import { z } from 'zod';

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);

export const NovelGrammarBriefSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (brief) =>
      [...brief].every((character) => {
        const codePoint = character.codePointAt(0);
        return (
          codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f
        );
      }),
    { message: 'Briefs must contain printable text only.' },
  );

export const NovelCompositionAttachmentSchema = z.strictObject({
  connectionId: SemanticIdSchema,
  parentPartId: SemanticIdSchema,
  parentPortId: SemanticIdSchema,
  childPortId: SemanticIdSchema,
});

export const NovelAddPartOperationSchema = z.strictObject({
  operation: z.literal('add_part'),
  partId: SemanticIdSchema,
  templateId: SemanticIdSchema,
  role: SemanticIdSchema,
  materialId: SemanticIdSchema.optional(),
  attachment: NovelCompositionAttachmentSchema,
});

export const NovelCompositionSuggestionSchema =
  NovelAddPartOperationSchema.extend({
    materialId: SemanticIdSchema,
  });

export const NovelConnectPartsOperationSchema = z.strictObject({
  operation: z.literal('connect_parts'),
  connectionId: SemanticIdSchema,
  parentPartId: SemanticIdSchema,
  parentPortId: SemanticIdSchema,
  childPartId: SemanticIdSchema,
  childPortId: SemanticIdSchema,
});

export const NovelCompositionOperationSchema = z.discriminatedUnion(
  'operation',
  [NovelAddPartOperationSchema, NovelConnectPartsOperationSchema],
);

export const NovelGrammarPlanningResultSchema = z.discriminatedUnion(
  'supported',
  [
    z.strictObject({
      supported: z.literal(true),
      archetypeId: z.enum([
        'humanoid.biped.rustic',
        'prop.banded-container.rustic',
      ]),
      compatibleTemplateIds: z.array(SemanticIdSchema).min(1).max(64),
      compatibleMaterialIds: z.array(SemanticIdSchema).min(1).max(64),
      suggestedOperations: z
        .array(NovelCompositionSuggestionSchema)
        .min(1)
        .max(64),
    }),
    z.strictObject({
      supported: z.literal(false),
      blockers: z.array(z.string().min(1).max(240)).min(1).max(8),
      guidance: z.string().min(1).max(500),
    }),
  ],
);

export type NovelCompositionOperation = z.infer<
  typeof NovelCompositionOperationSchema
>;
export type NovelGrammarPlanningResult = z.infer<
  typeof NovelGrammarPlanningResultSchema
>;
