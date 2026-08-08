import { z } from 'zod';

export const REFERENCE_CHARACTER_DESCRIPTOR_CONTRACT_ID =
  'forge-reference-character/v1' as const;

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const UnitIntervalSchema = z.number().finite().min(0).max(1);
const PositiveUnitIntervalSchema = z.number().finite().gt(0).max(1);

export const ReferenceCharacterProvenanceSchema = z.strictObject({
  sourceKind: z.literal('project_generated'),
  ownership: z.literal('project_owned'),
  licenseLabel: z.string().min(1).max(200),
  creator: z.string().min(1).max(200).optional(),
  originalityAttestation: z.literal('original-project-owned-no-franchise-copy'),
});

export const ReferenceViewDirectionSchema = z.enum([
  'front',
  'front_left',
  'left',
  'back_left',
  'back',
  'back_right',
  'right',
  'front_right',
]);

export const ReferenceCharacterLandmarkSchema = z.strictObject({
  id: SemanticIdSchema,
  x: UnitIntervalSchema,
  y: UnitIntervalSchema,
  confidence: UnitIntervalSchema,
});

export const ReferenceCharacterViewSchema = z
  .strictObject({
    direction: ReferenceViewDirectionSchema,
    imageContentSha256: Sha256Schema,
    pixelSize: z.strictObject({
      width: z.number().int().min(16).max(4_096),
      height: z.number().int().min(16).max(4_096),
    }),
    pose: z.literal('neutral_standing'),
    camera: z.strictObject({
      projection: z.literal('orthographic'),
      framing: z.literal('full_body'),
      elevationDegrees: z.number().finite().min(-30).max(30),
    }),
    subjectBounds: z.strictObject({
      x: UnitIntervalSchema,
      y: UnitIntervalSchema,
      width: PositiveUnitIntervalSchema,
      height: PositiveUnitIntervalSchema,
    }),
    landmarks: z.array(ReferenceCharacterLandmarkSchema).min(4).max(64),
  })
  .superRefine((view, context) => {
    if (view.subjectBounds.x + view.subjectBounds.width > 1)
      context.addIssue({
        code: 'custom',
        path: ['subjectBounds', 'width'],
        message: 'Subject bounds must remain inside normalized image space.',
      });
    if (view.subjectBounds.y + view.subjectBounds.height > 1)
      context.addIssue({
        code: 'custom',
        path: ['subjectBounds', 'height'],
        message: 'Subject bounds must remain inside normalized image space.',
      });

    const landmarkIds = new Set<string>();
    for (const [index, landmark] of view.landmarks.entries()) {
      if (landmarkIds.has(landmark.id))
        context.addIssue({
          code: 'custom',
          path: ['landmarks', index, 'id'],
          message: 'Landmark IDs must be unique within a view.',
        });
      landmarkIds.add(landmark.id);
    }

    for (const requiredId of [
      'head.top',
      'head.chin',
      'foot.left',
      'foot.right',
    ])
      if (!landmarkIds.has(requiredId))
        context.addIssue({
          code: 'custom',
          path: ['landmarks'],
          message: `Neutral full-body view requires landmark ${requiredId}.`,
        });
  });

export const ReferenceCharacterRatiosSchema = z.strictObject({
  headToBodyHeight: z.number().finite().min(0.1).max(0.6),
  shoulderToBodyWidth: PositiveUnitIntervalSchema,
  pelvisToBodyWidth: PositiveUnitIntervalSchema,
  armToBodyHeight: PositiveUnitIntervalSchema,
  legToBodyHeight: PositiveUnitIntervalSchema,
});

export const ReferenceCharacterPaletteEntrySchema = z.strictObject({
  role: z.enum(['primary', 'secondary', 'accent', 'skin', 'outline']),
  color: z.string().regex(/^#[0-9a-f]{6}$/),
  weight: PositiveUnitIntervalSchema,
});

export const ReferenceCharacterFeatureSchema = z.strictObject({
  id: SemanticIdSchema,
  category: z.enum(['face', 'hair', 'facial_hair', 'clothing', 'equipment']),
  presence: z.enum(['required', 'absent', 'unknown']),
  importance: UnitIntervalSchema,
  confidence: UnitIntervalSchema,
});

export const ReferenceCharacterConfidenceSchema = z.strictObject({
  overall: UnitIntervalSchema,
  geometry: UnitIntervalSchema,
  palette: UnitIntervalSchema,
  features: UnitIntervalSchema,
});

export const ReferenceCharacterTolerancesSchema = z.strictObject({
  silhouetteIouMinimum: z.number().finite().min(0.5).max(1),
  landmarkErrorMaximum: z.number().finite().min(0.001).max(0.25),
  ratioErrorMaximum: z.number().finite().min(0.001).max(0.25),
  paletteDeltaMaximum: z.number().finite().min(0).max(100),
});

export const ReferenceCharacterDescriptorSchema = z
  .strictObject({
    contractId: z.literal(REFERENCE_CHARACTER_DESCRIPTOR_CONTRACT_ID),
    referenceId: SemanticIdSchema,
    referenceContentSha256: Sha256Schema,
    provenance: ReferenceCharacterProvenanceSchema,
    views: z.array(ReferenceCharacterViewSchema).min(3).max(8),
    ratios: ReferenceCharacterRatiosSchema,
    palette: z.array(ReferenceCharacterPaletteEntrySchema).min(1).max(16),
    features: z.array(ReferenceCharacterFeatureSchema).min(1).max(64),
    confidence: ReferenceCharacterConfidenceSchema,
    tolerances: ReferenceCharacterTolerancesSchema,
  })
  .superRefine((descriptor, context) => {
    const directions = new Set<string>();
    for (const [index, view] of descriptor.views.entries()) {
      if (directions.has(view.direction))
        context.addIssue({
          code: 'custom',
          path: ['views', index, 'direction'],
          message: 'Reference view directions must be unique.',
        });
      directions.add(view.direction);
    }

    if (
      !directions.has('front') ||
      !directions.has('back') ||
      (!directions.has('left') && !directions.has('right'))
    )
      context.addIssue({
        code: 'custom',
        path: ['views'],
        message:
          'Reference requires front, back, and at least one left or right structural view.',
      });

    const paletteRoles = new Set<string>();
    let paletteWeight = 0;
    for (const [index, entry] of descriptor.palette.entries()) {
      if (paletteRoles.has(entry.role))
        context.addIssue({
          code: 'custom',
          path: ['palette', index, 'role'],
          message: 'Palette roles must be unique.',
        });
      paletteRoles.add(entry.role);
      paletteWeight += entry.weight;
    }
    if (Math.abs(paletteWeight - 1) > 1e-6)
      context.addIssue({
        code: 'custom',
        path: ['palette'],
        message: 'Palette weights must sum to 1.',
      });

    const featureIds = new Set<string>();
    for (const [index, feature] of descriptor.features.entries()) {
      if (featureIds.has(feature.id))
        context.addIssue({
          code: 'custom',
          path: ['features', index, 'id'],
          message: 'Feature IDs must be unique.',
        });
      featureIds.add(feature.id);
    }
  });

export type ReferenceCharacterDescriptor = z.infer<
  typeof ReferenceCharacterDescriptorSchema
>;
export type ReferenceCharacterView = z.infer<
  typeof ReferenceCharacterViewSchema
>;
