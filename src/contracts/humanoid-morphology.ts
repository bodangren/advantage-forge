import { z } from 'zod';

export const HUMANOID_MORPHOLOGY_PROFILE_CONTRACT_ID =
  'forge-humanoid-morphology/v1' as const;

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);

/**
 * A dimensionless semantic control interpreted only by a registered morphology
 * compiler. It is deliberately not a world-space size or transform component.
 */
export const NormalizedMorphologyControlSchema = z
  .number()
  .finite()
  .min(-1)
  .max(1);

export const HumanoidMorphologyProportionsSchema = z.strictObject({
  headScale: NormalizedMorphologyControlSchema,
  headWidth: NormalizedMorphologyControlSchema,
  headDepth: NormalizedMorphologyControlSchema,
  craniumRoundness: NormalizedMorphologyControlSchema,
  torsoLength: NormalizedMorphologyControlSchema,
  torsoWidth: NormalizedMorphologyControlSchema,
  torsoDepth: NormalizedMorphologyControlSchema,
  shoulderWidth: NormalizedMorphologyControlSchema,
  pelvisWidth: NormalizedMorphologyControlSchema,
  armLength: NormalizedMorphologyControlSchema,
  armThickness: NormalizedMorphologyControlSchema,
  legLength: NormalizedMorphologyControlSchema,
  legThickness: NormalizedMorphologyControlSchema,
  handScale: NormalizedMorphologyControlSchema,
  footScale: NormalizedMorphologyControlSchema,
  neckLength: NormalizedMorphologyControlSchema,
});

export const HumanoidMorphologyFeaturesSchema = z.strictObject({
  hairStyle: z.enum(['none', 'cropped', 'short_rounded', 'bob', 'ponytail']),
  eyeStyle: z.enum(['dot', 'round', 'wide']),
  facialHairStyle: z.enum(['none', 'short_beard', 'moustache']),
  clothingSilhouette: z.enum(['tunic', 'robe', 'light_armor']),
});

export const HumanoidMorphologyProfileSchema = z.strictObject({
  contractId: z.literal(HUMANOID_MORPHOLOGY_PROFILE_CONTRACT_ID),
  profileId: SemanticIdSchema,
  kitId: z.literal('rustic-human'),
  archetypeId: z.literal('humanoid.biped.rustic'),
  styleProfile: z.strictObject({
    id: z.literal('cute_chibi_v1'),
    version: z.literal('1.0.0'),
  }),
  seed: z.number().int().min(0).max(2_147_483_647),
  proportions: HumanoidMorphologyProportionsSchema,
  features: HumanoidMorphologyFeaturesSchema,
  symmetry: z
    .strictObject({ bilateral: z.literal(true) })
    .default({ bilateral: true }),
});

export type HumanoidMorphologyProfile = z.infer<
  typeof HumanoidMorphologyProfileSchema
>;
export type HumanoidMorphologyProportions = z.infer<
  typeof HumanoidMorphologyProportionsSchema
>;
