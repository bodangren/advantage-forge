import { z } from 'zod';

import {
  NovelAssetArchetypeIdSchema,
  NovelAssetCompletenessSchema,
  NovelAssetFamilySchema,
  NovelAssetIdentityMetadataSchema,
} from './novel-identity.js';
import {
  NovelRequiredRoleChangeSchema,
  NovelRevisionStateSchema,
} from './novel-revision.js';
import {
  ForgeRenderProfileSchema,
  ForgeStyleProfileSchema,
} from './interchange.js';
import { HumanoidMorphologyProfileSchema } from './humanoid-morphology.js';

export const SCHEMA_VERSION = '1.0.0' as const;
export const WORLD_UNIT = 'meter' as const;

export const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(
    /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/,
    'Use lowercase semantic segments separated by dots, underscores, or hyphens.',
  );
export const FiniteNumberSchema = z.number().finite();
export const PositiveNumberSchema = FiniteNumberSchema.min(0.001);
export const Vec2Schema = z.tuple([FiniteNumberSchema, FiniteNumberSchema]);
export const Vec3Schema = z.tuple([
  FiniteNumberSchema,
  FiniteNumberSchema,
  FiniteNumberSchema,
]);
export const QuaternionSchema = z.tuple([
  FiniteNumberSchema,
  FiniteNumberSchema,
  FiniteNumberSchema,
  FiniteNumberSchema,
]);

export const TransformSchema = z
  .object({
    position: Vec3Schema,
    rotation: QuaternionSchema,
    scale: Vec3Schema.refine((value) => value.every((axis) => axis !== 0), {
      message: 'Transform scale components must be non-zero.',
    }),
  })
  .strict();

export const BoundsSchema = z
  .object({
    min: Vec3Schema,
    max: Vec3Schema,
  })
  .strict()
  .refine(
    (bounds) => bounds.min.every((value, axis) => value <= bounds.max[axis]!),
    {
      message: 'Bounds minimum must not exceed maximum.',
    },
  );

const DimensionsSchema = {
  width: PositiveNumberSchema.max(1_000),
  height: PositiveNumberSchema.max(1_000),
  depth: PositiveNumberSchema.max(1_000),
};
const SegmentSchema = z.number().int().min(3).max(128);

export const BoxShapeSchema = z
  .object({ kind: z.literal('box'), ...DimensionsSchema })
  .strict();
export const BeveledBoxShapeSchema = z
  .object({
    kind: z.literal('beveledBox'),
    ...DimensionsSchema,
    bevel: PositiveNumberSchema,
  })
  .strict();
export const WedgeShapeSchema = z
  .object({ kind: z.literal('wedge'), ...DimensionsSchema })
  .strict();
export const PrismShapeSchema = z
  .object({
    kind: z.literal('prism'),
    radius: PositiveNumberSchema.max(1_000),
    height: PositiveNumberSchema.max(1_000),
    sides: SegmentSchema,
  })
  .strict();
export const CylinderShapeSchema = z
  .object({
    kind: z.literal('cylinder'),
    radius: PositiveNumberSchema.max(1_000),
    height: PositiveNumberSchema.max(1_000),
    radialSegments: SegmentSchema,
  })
  .strict();
export const ConeShapeSchema = z
  .object({
    kind: z.literal('cone'),
    radius: PositiveNumberSchema.max(1_000),
    height: PositiveNumberSchema.max(1_000),
    radialSegments: SegmentSchema,
  })
  .strict();
export const EllipsoidShapeSchema = z
  .object({
    kind: z.literal('ellipsoid'),
    radiusX: PositiveNumberSchema.max(1_000),
    radiusY: PositiveNumberSchema.max(1_000),
    radiusZ: PositiveNumberSchema.max(1_000),
    widthSegments: SegmentSchema,
    heightSegments: z.number().int().min(2).max(128),
  })
  .strict();
export const CapsuleShapeSchema = z
  .object({
    kind: z.literal('capsule'),
    radius: PositiveNumberSchema.max(1_000),
    cylinderHeight: PositiveNumberSchema.max(1_000),
    radialSegments: SegmentSchema,
    capSegments: z.number().int().min(2).max(128),
  })
  .strict();
export const ExtrudedProfileShapeSchema = z
  .object({
    kind: z.literal('extrudedProfile'),
    profile: z.array(Vec2Schema).min(3).max(256),
    depth: PositiveNumberSchema.max(1_000),
    bevel: PositiveNumberSchema.max(1_000).optional(),
    bevelSegments: z.number().int().min(1).max(16).optional(),
  })
  .strict()
  .superRefine((shape, context) => {
    if ((shape.bevel === undefined) !== (shape.bevelSegments === undefined))
      context.addIssue({
        code: 'custom',
        path: [shape.bevel === undefined ? 'bevel' : 'bevelSegments'],
        message:
          'Extruded-profile bevel and bevelSegments must be declared together.',
      });
    if (shape.bevel === undefined) return;
    const center = shape.profile.reduce(
      (sum, point) => [sum[0] + point[0], sum[1] + point[1]] as const,
      [0, 0] as const,
    );
    const centroid = center.map((value) => value / shape.profile.length);
    const minimumRadius = Math.min(
      ...shape.profile.map((point) =>
        Math.hypot(point[0] - centroid[0]!, point[1] - centroid[1]!),
      ),
    );
    if (shape.bevel >= shape.depth / 2)
      context.addIssue({
        code: 'custom',
        path: ['bevel'],
        message: 'Extruded-profile bevel must be smaller than half the depth.',
      });
    if (shape.bevel >= minimumRadius)
      context.addIssue({
        code: 'custom',
        path: ['bevel'],
        message:
          'Extruded-profile bevel must be smaller than the profile radius.',
      });
  });
export const LathedProfileShapeSchema = z
  .object({
    kind: z.literal('lathedProfile'),
    profile: z.array(Vec2Schema).min(2).max(256),
    radialSegments: SegmentSchema,
  })
  .strict();
export const TubePathShapeSchema = z
  .object({
    kind: z.literal('tubePath'),
    path: z.array(Vec3Schema).min(2).max(256),
    radius: PositiveNumberSchema.max(1_000),
    radialSegments: SegmentSchema,
  })
  .strict();
export const FlatCardShapeSchema = z
  .object({
    kind: z.literal('flatCard'),
    width: PositiveNumberSchema.max(1_000),
    height: PositiveNumberSchema.max(1_000),
  })
  .strict();

const BaseShapeDefinitionSchema = z.discriminatedUnion('kind', [
  BoxShapeSchema,
  BeveledBoxShapeSchema,
  WedgeShapeSchema,
  PrismShapeSchema,
  CylinderShapeSchema,
  ConeShapeSchema,
  EllipsoidShapeSchema,
  CapsuleShapeSchema,
  ExtrudedProfileShapeSchema,
  LathedProfileShapeSchema,
  TubePathShapeSchema,
  FlatCardShapeSchema,
]);
function profileArea(profile: readonly (readonly [number, number])[]): number {
  return (
    profile.reduce((sum, point, index) => {
      const next = profile[(index + 1) % profile.length] ?? point;
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2
  );
}

function convexProfile(
  profile: readonly (readonly [number, number])[],
): boolean {
  let sign = 0;
  for (let index = 0; index < profile.length; index += 1) {
    const a = profile[index]!;
    const b = profile[(index + 1) % profile.length]!;
    const c = profile[(index + 2) % profile.length]!;
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) <= 1e-9) continue;
    const nextSign = Math.sign(cross);
    if (sign !== 0 && sign !== nextSign) return false;
    sign = nextSign;
  }
  return sign !== 0;
}

export const ShapeDefinitionSchema = BaseShapeDefinitionSchema.superRefine(
  (shape, context) => {
    const issue = (path: (string | number)[], message: string) =>
      context.addIssue({ code: 'custom', path, message });
    if (
      shape.kind === 'beveledBox' &&
      shape.bevel >= Math.min(shape.width, shape.height, shape.depth) / 2
    )
      issue(
        ['bevel'],
        'Bevel must be smaller than half the shortest dimension.',
      );
    if (shape.kind === 'extrudedProfile') {
      if (
        shape.profile.some((point) =>
          point.some((value) => Math.abs(value) > 1_000),
        )
      )
        issue(
          ['profile'],
          'Profile coordinates must be between -1000 and 1000.',
        );
      if (Math.abs(profileArea(shape.profile)) <= 1e-9)
        issue(['profile'], 'Profile must have non-zero area.');
      else if (!convexProfile(shape.profile))
        issue(['profile'], 'Profile must be convex and non-self-intersecting.');
    }
    if (shape.kind === 'lathedProfile') {
      if (
        shape.profile.some(
          ([radius, y]) => radius < 0 || radius > 1_000 || Math.abs(y) > 1_000,
        )
      )
        issue(
          ['profile'],
          'Lathed radii must be 0..1000 and heights -1000..1000.',
        );
      if (
        shape.profile.some(
          (point, index) =>
            index > 0 && point[1] <= shape.profile[index - 1]![1],
        )
      )
        issue(
          ['profile'],
          'Lathed profile heights must be strictly increasing.',
        );
      if (!shape.profile.some(([radius]) => radius > 0))
        issue(['profile'], 'Lathed profile must contain a positive radius.');
    }
    if (shape.kind === 'tubePath') {
      if (
        shape.path.some((point) =>
          point.some((value) => Math.abs(value) > 1_000),
        )
      )
        issue(['path'], 'Path coordinates must be between -1000 and 1000.');
      if (
        shape.path.some(
          (point, index) =>
            index > 0 &&
            point.every(
              (value, axis) =>
                Math.abs(value - shape.path[index - 1]![axis]!) <= 1e-9,
            ),
        )
      )
        issue(['path'], 'Consecutive path points must differ.');
    }
  },
);

export const MaterialBindingSchema = z
  .object({ slot: SemanticIdSchema, materialId: SemanticIdSchema })
  .strict();
export const MaterialFamilySchema = z.enum([
  'wood',
  'stone',
  'iron',
  'bronze',
  'gold',
  'leather',
  'cloth',
  'bone',
  'skin',
  'fur',
  'foliage',
  'crystal',
  'emissiveMagic',
]);
export const MaterialDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    family: MaterialFamilySchema,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    roughness: FiniteNumberSchema.min(0).max(1),
    metalness: FiniteNumberSchema.min(0).max(1),
    emissive: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
  })
  .strict();

export const PortCompatibilityTagSchema = z.enum([
  'anatomy.mount',
  'anatomy.attach',
  'equipment.mount',
  'equipment.grip',
  'prop.mount',
  'prop.attach',
  'vegetation.mount',
  'vegetation.attach',
  'structure.mount',
  'structure.attach',
]);

export const PortDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    frame: TransformSchema,
    tags: z.array(PortCompatibilityTagSchema).min(1).max(16),
    accepts: z.array(PortCompatibilityTagSchema).min(1).max(16),
    cardinality: z.enum(['single', 'multiple']),
  })
  .strict();

export const EquipmentSlotSchema = z.enum([
  'head',
  'main-hand',
  'off-hand',
  'body',
  'back',
  'waist',
]);
export const AccessoryRoleSchema = z.enum([
  'headwear',
  'weapon',
  'shield',
  'light',
  'armor',
  'back-item',
  'waist-item',
]);
export const AccessoryHandednessSchema = z.enum([
  'neutral',
  'left',
  'right',
  'either',
  'two-handed',
]);
export const AccessoryLayerSchema = z
  .object({
    kind: z.enum(['underlay', 'body', 'overlay', 'carried']),
    order: z.number().int().min(-32).max(32),
    maximumIntersectionRatio: FiniteNumberSchema.min(0).max(1),
  })
  .strict();
export const SpriteDirectionSchema = z.enum([
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
]);
export const AccessoryRequiredFeatureSchema = z
  .object({
    id: SemanticIdSchema,
    expectation: z.string().min(1).max(160),
    intendedDirections: z.array(SpriteDirectionSchema).min(1).max(8),
    minimumPixelArea: z.number().int().min(1).max(16_384),
    minimumWidthPixels: z.number().int().min(1).max(128),
    maximumOcclusionRatio: FiniteNumberSchema.min(0).max(1),
    minimumOklabDistance: FiniteNumberSchema.gt(0).max(1),
  })
  .strict()
  .superRefine((feature, context) => {
    if (
      new Set(feature.intendedDirections).size !==
      feature.intendedDirections.length
    )
      context.addIssue({
        code: 'custom',
        path: ['intendedDirections'],
        message: 'Intended sprite directions must be unique.',
      });
  });
export const AccessoryMetadataSchema = z
  .object({
    role: AccessoryRoleSchema,
    slot: EquipmentSlotSchema,
    compatibleSlots: z.array(EquipmentSlotSchema).min(1).max(6).optional(),
    attachmentPortIds: z.array(SemanticIdSchema).min(1).max(4),
    handedness: AccessoryHandednessSchema,
    compatibilityTags: z.array(SemanticIdSchema).min(1).max(32),
    compatibleAnatomy: z.array(SemanticIdSchema).min(1).max(32),
    compatibleArchetypes: z.array(SemanticIdSchema).min(1).max(32),
    layer: AccessoryLayerSchema,
    bounds: BoundsSchema,
    triangleBudget: z.number().int().min(1).max(100_000),
    allowedPoseIds: z.array(SemanticIdSchema).min(1).max(32),
    requiredFeatures: z.array(AccessoryRequiredFeatureSchema).min(1).max(16),
  })
  .strict()
  .superRefine((metadata, context) => {
    for (const key of [
      'attachmentPortIds',
      'compatibleSlots',
      'compatibilityTags',
      'compatibleAnatomy',
      'compatibleArchetypes',
      'allowedPoseIds',
    ] as const)
      if (
        metadata[key] !== undefined &&
        new Set(metadata[key]).size !== metadata[key].length
      )
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} must contain unique values.`,
        });
    if (
      metadata.compatibleSlots !== undefined &&
      !metadata.compatibleSlots.includes(metadata.slot)
    )
      context.addIssue({
        code: 'custom',
        path: ['compatibleSlots'],
        message: 'Compatible slots must include the default slot.',
      });
    const featureIds = metadata.requiredFeatures.map(({ id }) => id);
    if (new Set(featureIds).size !== featureIds.length)
      context.addIssue({
        code: 'custom',
        path: ['requiredFeatures'],
        message: 'Required feature IDs must be unique.',
      });
  });

export const PartTemplateDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    role: SemanticIdSchema,
    shape: ShapeDefinitionSchema,
    materialSlots: z.array(SemanticIdSchema).min(1).max(16),
    ports: z.array(PortDefinitionSchema).max(32),
    accessory: AccessoryMetadataSchema.optional(),
    requiredVisualFeatures: z
      .array(AccessoryRequiredFeatureSchema)
      .min(1)
      .max(16)
      .optional(),
  })
  .strict()
  .superRefine((template, context) => {
    const genericFeatureIds =
      template.requiredVisualFeatures?.map(({ id }) => id) ?? [];
    if (new Set(genericFeatureIds).size !== genericFeatureIds.length)
      context.addIssue({
        code: 'custom',
        path: ['requiredVisualFeatures'],
        message: 'Required visual feature IDs must be unique.',
      });
    if (template.accessory === undefined) return;
    const portIds = new Set(template.ports.map(({ id }) => id));
    for (const [
      index,
      portId,
    ] of template.accessory.attachmentPortIds.entries())
      if (!portIds.has(portId))
        context.addIssue({
          code: 'custom',
          path: ['accessory', 'attachmentPortIds', index],
          message: `Accessory attachment port '${portId}' is not declared by the template.`,
        });
  });

export const PartInstanceSchema = z
  .object({
    id: SemanticIdSchema,
    templateId: SemanticIdSchema,
    handedness: z.enum(['neutral', 'left', 'right']).optional(),
    equipmentSlot: EquipmentSlotSchema.optional(),
    transform: TransformSchema,
    shape: ShapeDefinitionSchema.optional(),
    materialBindings: z.array(MaterialBindingSchema).min(1).max(16),
    visible: z.boolean(),
    jointValueDegrees: FiniteNumberSchema.optional(),
  })
  .strict();

export const AccessoryQuerySchema = z
  .object({
    roles: z.array(AccessoryRoleSchema).min(1).max(7).optional(),
    slots: z.array(EquipmentSlotSchema).min(1).max(6).optional(),
    handedness: z.array(AccessoryHandednessSchema).min(1).max(5).optional(),
    compatibilityTags: z.array(SemanticIdSchema).min(1).max(16).optional(),
    compatibleAnatomy: z.array(SemanticIdSchema).min(1).max(16).optional(),
    compatibleArchetypes: z.array(SemanticIdSchema).min(1).max(16).optional(),
    materialFamilies: z.array(MaterialFamilySchema).min(1).max(13).optional(),
    offset: z.number().int().min(0).max(10_000).default(0),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict()
  .superRefine((query, context) => {
    for (const key of [
      'roles',
      'slots',
      'handedness',
      'compatibilityTags',
      'compatibleAnatomy',
      'compatibleArchetypes',
      'materialFamilies',
    ] as const)
      if (
        query[key] !== undefined &&
        new Set(query[key]).size !== query[key].length
      )
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} must contain unique values.`,
        });
  });

export const AccessoryPlacementSchema = z
  .object({
    slot: EquipmentSlotSchema,
    parentPartId: SemanticIdSchema,
    parentPortId: SemanticIdSchema,
    transform: TransformSchema,
    intendedOrientation: z.string().min(1).max(240),
    guidance: z.string().min(1).max(500),
  })
  .strict();

export const AccessoryUsageSchema = z
  .object({
    summary: z.string().min(1).max(500),
    placements: z.array(AccessoryPlacementSchema).min(1).max(6),
    visualChecks: z.array(z.string().min(1).max(240)).min(1).max(8),
  })
  .strict()
  .superRefine((usage, context) => {
    const slots = usage.placements.map(({ slot }) => slot);
    if (new Set(slots).size !== slots.length)
      context.addIssue({
        code: 'custom',
        path: ['placements'],
        message: 'Accessory usage placements must use unique equipment slots.',
      });
  });

export const AccessoryTaskOperationSchema = z.discriminatedUnion('operation', [
  z
    .object({
      operation: z.literal('equip'),
      templateId: SemanticIdSchema,
      equipmentSlot: EquipmentSlotSchema.optional(),
      materialId: SemanticIdSchema.optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('replace'),
      partId: SemanticIdSchema,
      templateId: SemanticIdSchema,
      equipmentSlot: EquipmentSlotSchema.optional(),
      materialId: SemanticIdSchema.optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('swapHand'),
      partId: SemanticIdSchema,
      toSlot: z.enum(['main-hand', 'off-hand']).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('recolor'),
      partId: SemanticIdSchema,
      materialId: SemanticIdSchema,
    })
    .strict(),
  z
    .object({
      operation: z.literal('unequip'),
      partId: SemanticIdSchema,
    })
    .strict(),
]);

export const AccessorySearchRequestSchema = z
  .object({
    assetId: SemanticIdSchema,
    archetypeId: SemanticIdSchema,
    query: AccessoryQuerySchema.default({ offset: 0, limit: 20 }),
  })
  .strict();

export const AccessoryWorkflowRequestSchema = z
  .object({
    assetId: SemanticIdSchema,
    expectedRevisionId: z.string().regex(/^revision\.[a-f0-9]{64}$/),
    archetypeId: SemanticIdSchema,
    operation: AccessoryTaskOperationSchema,
    dryRun: z.boolean().default(false),
  })
  .strict();

export const AccessoryDiscoveryItemSchema = z
  .object({
    templateId: SemanticIdSchema,
    role: AccessoryRoleSchema,
    defaultSlot: EquipmentSlotSchema,
    compatibleSlots: z.array(EquipmentSlotSchema).min(1).max(6),
    handedness: AccessoryHandednessSchema,
    compatibilityTags: z.array(SemanticIdSchema).max(32),
    compatibleAnatomy: z.array(SemanticIdSchema).max(32),
    compatibleArchetypes: z.array(SemanticIdSchema).max(32),
    parameterBounds: z.record(
      z.string().min(1),
      z.tuple([FiniteNumberSchema, FiniteNumberSchema]),
    ),
    defaultMaterialId: SemanticIdSchema,
    materialOptions: z
      .array(
        z
          .object({
            id: SemanticIdSchema,
            family: MaterialFamilySchema,
          })
          .strict(),
      )
      .min(1)
      .max(32),
    attachmentTarget: z
      .object({
        parentPartId: SemanticIdSchema,
        parentPortId: SemanticIdSchema,
      })
      .strict(),
    attachmentPorts: z.array(PortDefinitionSchema).min(1).max(4),
    requiredFeatures: z.array(AccessoryRequiredFeatureSchema).min(1).max(16),
    usage: AccessoryUsageSchema,
    compatibility: z
      .object({
        eligible: z.boolean(),
        issueCodes: z.array(z.string().regex(/^ACCESSORY_[A-Z_]+$/)).max(16),
        occupiedByPartId: SemanticIdSchema.optional(),
        replacementRequired: z.boolean(),
      })
      .strict(),
    exampleOperation: AccessoryTaskOperationSchema,
  })
  .strict()
  .superRefine((item, context) => {
    if (!item.compatibleSlots.includes(item.defaultSlot))
      context.addIssue({
        code: 'custom',
        path: ['compatibleSlots'],
        message: 'Compatible slots must include the default slot.',
      });
    for (const [path, [minimum, maximum]] of Object.entries(
      item.parameterBounds,
    ))
      if (minimum >= maximum)
        context.addIssue({
          code: 'custom',
          path: ['parameterBounds', path],
          message: 'Parameter bounds must have a minimum below the maximum.',
        });
    if (!item.materialOptions.some(({ id }) => id === item.defaultMaterialId))
      context.addIssue({
        code: 'custom',
        path: ['defaultMaterialId'],
        message: 'Default material must be present in material options.',
      });
  });

export const JointDefinitionSchema = z
  .object({
    kind: z.enum(['fixed', 'hinge']),
    axis: Vec3Schema.optional(),
    minDegrees: FiniteNumberSchema.optional(),
    maxDegrees: FiniteNumberSchema.optional(),
  })
  .strict();

export const ConnectionDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    parentPartId: SemanticIdSchema,
    parentPortId: SemanticIdSchema,
    childPartId: SemanticIdSchema,
    childPortId: SemanticIdSchema,
    joint: JointDefinitionSchema.optional(),
  })
  .strict();

export const AssemblyDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    parts: z.array(PartInstanceSchema).min(1).max(2_000),
    connections: z.array(ConnectionDefinitionSchema).max(4_000),
  })
  .strict();

export const VariantOverrideSchema = z
  .object({
    partId: SemanticIdSchema,
    shape: ShapeDefinitionSchema.optional(),
    transform: TransformSchema.optional(),
    materialBindings: z.array(MaterialBindingSchema).optional(),
    visible: z.boolean().optional(),
  })
  .strict();
export const VariantDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    overrides: z.array(VariantOverrideSchema).max(2_000),
  })
  .strict();
export const PoseOverrideSchema = z
  .object({
    partId: SemanticIdSchema,
    transform: TransformSchema.optional(),
    jointValueDegrees: FiniteNumberSchema.optional(),
  })
  .strict();
export const PoseDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    overrides: z.array(PoseOverrideSchema).max(2_000),
  })
  .strict();

export const SpriteRenderProfileSchema = z
  .object({
    id: SemanticIdSchema,
    widthPixels: z.number().int().min(16).max(2_048),
    heightPixels: z.number().int().min(16).max(2_048),
    elevationDegrees: FiniteNumberSchema.gt(0).lt(90),
    directions: z.union([z.literal(1), z.literal(4), z.literal(8)]),
    paddingPixels: z.number().int().min(0).max(512),
    transparent: z.literal(true),
    minimumFeaturePixels: z.number().int().min(1).max(64),
    requiredFeaturePartIds: z.array(SemanticIdSchema).min(1).max(32),
  })
  .strict()
  .superRefine((profile, context) => {
    if (
      profile.paddingPixels * 2 >=
      Math.min(profile.widthPixels, profile.heightPixels)
    )
      context.addIssue({
        code: 'custom',
        path: ['paddingPixels'],
        message: 'Padding must leave a positive drawable frame.',
      });
    if (
      new Set(profile.requiredFeaturePartIds).size !==
      profile.requiredFeaturePartIds.length
    )
      context.addIssue({
        code: 'custom',
        path: ['requiredFeaturePartIds'],
        message: 'Required feature part IDs must be unique.',
      });
  });

export const AssetDocumentSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: SemanticIdSchema,
    name: z.string().min(1).max(120),
    unit: z.literal(WORLD_UNIT),
    seed: z.number().int().min(0).max(2_147_483_647),
    kitId: SemanticIdSchema,
    triangleBudget: z.number().int().min(1).max(1_000_000),
    materials: z.array(MaterialDefinitionSchema).min(1).max(256),
    templates: z.array(PartTemplateDefinitionSchema).min(1).max(2_000),
    assembly: AssemblyDefinitionSchema,
    variants: z.array(VariantDefinitionSchema).max(128),
    poses: z.array(PoseDefinitionSchema).max(128),
    renderProfiles: z.array(SpriteRenderProfileSchema).min(1).max(16),
    activeVariantId: SemanticIdSchema.optional(),
    activePoseId: SemanticIdSchema.optional(),
    novelIdentity: NovelAssetIdentityMetadataSchema.optional(),
    morphologyProfile: HumanoidMorphologyProfileSchema.optional(),
  })
  .strict()
  .superRefine((document, context) => {
    const partIds = new Set(document.assembly.parts.map(({ id }) => id));
    for (const [profileIndex, profile] of document.renderProfiles.entries())
      for (const [
        featureIndex,
        partId,
      ] of profile.requiredFeaturePartIds.entries())
        if (!partIds.has(partId))
          context.addIssue({
            code: 'custom',
            path: [
              'renderProfiles',
              profileIndex,
              'requiredFeaturePartIds',
              featureIndex,
            ],
            message: `Required feature part ${partId} does not exist in the assembly.`,
          });
  });

export const ValidationErrorCodeSchema = z.enum([
  'UNKNOWN_FIELD',
  'UNKNOWN_REFERENCE',
  'INVALID_MATERIAL_SLOT',
  'INVALID_UNIT',
  'DUPLICATE_ID',
  'UNSUPPORTED_NODE_KIND',
  'UNSUPPORTED_VERSION',
  'INVALID_VALUE',
  'NON_FINITE_VALUE',
  'INVALID_PATH',
  'REVISION_CONFLICT',
  'ALREADY_EXISTS',
  'NOT_FOUND',
  'PATCH_REJECTED',
  'INVALID_ASSEMBLY',
  'INCOMPLETE_ASSET',
  'DRY_RUN_REQUIRED',
  'TRIANGLE_BUDGET_EXCEEDED',
  'SERVICE_UNAVAILABLE',
  'RESPONSE_TOO_LARGE',
  'REPOSITORY_ERROR',
]);

export const ValidationIssueSchema = z
  .object({
    code: ValidationErrorCodeSchema,
    path: z.string().min(1).max(500),
    message: z.string().min(1).max(1_000),
    severity: z.enum(['error', 'warning']),
    expected: z.unknown().optional(),
    actual: z.unknown().optional(),
    guidance: z.string().max(1_000).optional(),
  })
  .strict();

export const ToolResultEnvelopeSchema = z
  .object({
    ok: z.boolean(),
    revisionId: SemanticIdSchema.optional(),
    affectedIds: z.array(SemanticIdSchema).max(2_000),
    summary: z.string().min(1).max(4_000),
    issues: z.array(ValidationIssueSchema),
    data: z.unknown().optional(),
  })
  .strict();

export const InspectionSectionSchema = z.enum([
  'overview',
  'parts',
  'connections',
  'variants',
  'poses',
  'renderProfiles',
]);

export const PageRequestSchema = z
  .object({
    offset: z.number().int().nonnegative().default(0),
    limit: z.number().int().min(1).max(100).default(20),
  })
  .strict();

export const PageInfoSchema = z
  .object({
    total: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(100),
    truncated: z.boolean(),
    nextOffset: z.number().int().nonnegative().optional(),
  })
  .strict();

export const AccessoryDiscoveryDataSchema = z
  .object({
    assetId: SemanticIdSchema,
    revisionId: z.string().regex(/^revision\.[a-f0-9]{64}$/),
    archetypeId: SemanticIdSchema,
    query: AccessoryQuerySchema,
    page: PageInfoSchema,
    items: z.array(AccessoryDiscoveryItemSchema).max(50),
  })
  .strict();

export const AssetInspectionPartStateSchema = z
  .object({
    shape: ShapeDefinitionSchema,
    transform: TransformSchema,
    worldTransform: TransformSchema.optional(),
    materialBindings: z.array(MaterialBindingSchema).min(1).max(16),
    visible: z.boolean(),
    jointValueDegrees: FiniteNumberSchema.optional(),
  })
  .strict();

export const AssetInspectionPartSchema = z
  .object({
    id: SemanticIdSchema,
    templateId: SemanticIdSchema,
    role: SemanticIdSchema,
    handedness: z.enum(['neutral', 'left', 'right']),
    equipmentSlot: EquipmentSlotSchema.optional(),
    shapeSource: z.enum(['template', 'part']),
    base: AssetInspectionPartStateSchema,
    effective: AssetInspectionPartStateSchema,
    ports: z.array(PortDefinitionSchema).max(32),
  })
  .strict();

export const AssetInspectionConnectionSchema =
  ConnectionDefinitionSchema.extend({
    parentPort: PortDefinitionSchema,
    childPort: PortDefinitionSchema,
  }).strict();

export const AssetInspectionItemSchema = z.union([
  AssetInspectionPartSchema,
  AssetInspectionConnectionSchema,
  VariantDefinitionSchema,
  PoseDefinitionSchema,
  SpriteRenderProfileSchema,
]);

export const AssetInspectionDataSchema = z
  .object({
    id: SemanticIdSchema,
    name: z.string().min(1).max(120),
    kitId: SemanticIdSchema,
    unit: z.literal(WORLD_UNIT),
    seed: z.number().int().nonnegative(),
    triangleBudget: z.number().int().positive(),
    activeVariantId: SemanticIdSchema.optional(),
    activePoseId: SemanticIdSchema.optional(),
    origin: z.discriminatedUnion('kind', [
      z.strictObject({
        kind: z.literal('reference'),
        reference: z.enum(['adventurer', 'crate', 'tree', 'cottage']),
      }),
      z.strictObject({
        kind: z.literal('novel'),
        family: NovelAssetFamilySchema,
        archetypeId: NovelAssetArchetypeIdSchema,
        styleProfile: ForgeStyleProfileSchema,
        renderProfile: ForgeRenderProfileSchema,
      }),
    ]),
    lineage: z.strictObject({
      currentRevisionId: z.string().regex(/^revision\.[a-f0-9]{64}$/),
      parentRevisionId: z
        .string()
        .regex(/^revision\.[a-f0-9]{64}$/)
        .optional(),
    }),
    completeness: NovelAssetCompletenessSchema.optional(),
    section: InspectionSectionSchema,
    counts: z
      .object({
        parts: z.number().int().nonnegative(),
        connections: z.number().int().nonnegative(),
        variants: z.number().int().nonnegative(),
        poses: z.number().int().nonnegative(),
        renderProfiles: z.number().int().nonnegative(),
      })
      .strict(),
    page: PageInfoSchema.optional(),
    items: z.array(AssetInspectionItemSchema).max(100).optional(),
  })
  .strict();

export const SemanticChangeSchema = z
  .object({
    path: z.string().min(1).max(1_000),
    kind: z.enum(['added', 'removed', 'changed']),
    semanticId: SemanticIdSchema.optional(),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
  })
  .strict();

export const AccessoryOperationSummarySchema = z
  .object({
    operation: z.enum(['equip', 'replace', 'swapHand', 'recolor', 'unequip']),
    dryRun: z.boolean(),
    parentRevisionId: z.string().regex(/^revision\.[a-f0-9]{64}$/),
    partId: SemanticIdSchema,
    templateId: SemanticIdSchema.optional(),
    equipmentSlot: EquipmentSlotSchema.optional(),
    materialId: SemanticIdSchema.optional(),
    validation: z.literal('valid'),
    affectedIds: z.array(SemanticIdSchema).min(1).max(16),
    addedIds: z.array(SemanticIdSchema).max(8),
    removedIds: z.array(SemanticIdSchema).max(8),
    connectionIds: z.array(SemanticIdSchema).max(8),
    changePreview: z
      .object({
        total: z.number().int().positive(),
        truncated: z.boolean(),
        items: z.array(SemanticChangeSchema).max(20),
      })
      .strict(),
  })
  .strict()
  .superRefine((summary, context) => {
    for (const key of [
      'affectedIds',
      'addedIds',
      'removedIds',
      'connectionIds',
    ] as const)
      if (new Set(summary[key]).size !== summary[key].length)
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} must contain unique values.`,
        });
  });

export const SemanticRevisionComparisonSchema = z
  .object({
    assetId: SemanticIdSchema,
    baseRevisionId: SemanticIdSchema,
    targetRevisionId: SemanticIdSchema,
    affectedIds: z.array(SemanticIdSchema).max(100),
    affectedIdsPage: PageInfoSchema,
    preservedIds: z.array(SemanticIdSchema).max(100),
    preservedIdsPage: PageInfoSchema,
    baseState: NovelRevisionStateSchema,
    targetState: NovelRevisionStateSchema,
    requiredRoleChanges: z.array(NovelRequiredRoleChangeSchema).max(64),
    page: PageInfoSchema,
    changes: z.array(SemanticChangeSchema).max(100),
  })
  .strict();

export const CapabilityStatusSchema = z.enum([
  'supported',
  'partial',
  'unsupported',
  'not-assessed',
]);

export const CapabilityCategorySchema = z.enum([
  'asset',
  'accessory',
  'operation',
  'output',
  'animation',
  'integration',
]);

export const CapabilityEvidenceSchema = z
  .object({
    publicTools: z.array(SemanticIdSchema).max(32),
    referenceAssetIds: z.array(SemanticIdSchema).max(32),
    archetypeIds: z.array(SemanticIdSchema).max(16),
    templateIds: z.array(SemanticIdSchema).max(256),
    renderProfileIds: z.array(SemanticIdSchema).max(16),
    formats: z.array(SemanticIdSchema).max(16),
  })
  .strict();

export const CapabilityFactSchema = z
  .object({
    id: SemanticIdSchema,
    category: CapabilityCategorySchema,
    status: CapabilityStatusSchema,
    summary: z.string().min(1).max(500),
    guidance: z.string().min(1).max(1_000).optional(),
    evidence: CapabilityEvidenceSchema,
  })
  .strict()
  .superRefine((fact, context) => {
    if (fact.status !== 'supported' && fact.guidance === undefined)
      context.addIssue({
        code: 'custom',
        path: ['guidance'],
        message:
          'Partial, unsupported, and not-assessed capabilities require actionable guidance.',
      });
  });

export const CapabilityReportSchema = z
  .object({
    scope: z.literal('fantasy-asset-forge'),
    facts: z.array(CapabilityFactSchema).max(128),
    availableCapabilityIds: z.array(SemanticIdSchema).max(128),
    totals: z
      .object({
        supported: z.number().int().nonnegative(),
        partial: z.number().int().nonnegative(),
        unsupported: z.number().int().nonnegative(),
        notAssessed: z.number().int().nonnegative(),
      })
      .strict(),
    filtered: z.boolean(),
  })
  .strict();

export const GeometryMaterialGroupSchema = z
  .object({
    materialSlot: SemanticIdSchema,
    indexStart: z.number().int().nonnegative(),
    indexCount: z.number().int().nonnegative(),
  })
  .strict();

export const IndexedGeometrySchema = z
  .object({
    positions: z.array(FiniteNumberSchema).min(9),
    normals: z.array(FiniteNumberSchema).min(9),
    indices: z.array(z.number().int().nonnegative()).min(3),
    bounds: BoundsSchema,
    materialGroups: z.array(GeometryMaterialGroupSchema).min(1),
    metadata: z
      .object({
        generator: z.enum([
          'box',
          'beveledBox',
          'wedge',
          'prism',
          'cylinder',
          'cone',
          'ellipsoid',
          'capsule',
          'extrudedProfile',
          'lathedProfile',
          'tubePath',
          'flatCard',
        ]),
        triangleCount: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export type SemanticId = z.infer<typeof SemanticIdSchema>;
export type Vec2 = z.infer<typeof Vec2Schema>;
export type Vec3 = z.infer<typeof Vec3Schema>;
export type Quaternion = z.infer<typeof QuaternionSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type Bounds = z.infer<typeof BoundsSchema>;
export type ShapeDefinition = z.infer<typeof ShapeDefinitionSchema>;
export type MaterialBinding = z.infer<typeof MaterialBindingSchema>;
export type MaterialDefinition = z.infer<typeof MaterialDefinitionSchema>;
export type MaterialFamily = z.infer<typeof MaterialFamilySchema>;
export type PortCompatibilityTag = z.infer<typeof PortCompatibilityTagSchema>;
export type PortDefinition = z.infer<typeof PortDefinitionSchema>;
export type EquipmentSlot = z.infer<typeof EquipmentSlotSchema>;
export type AccessoryRole = z.infer<typeof AccessoryRoleSchema>;
export type AccessoryHandedness = z.infer<typeof AccessoryHandednessSchema>;
export type AccessoryLayer = z.infer<typeof AccessoryLayerSchema>;
export type SpriteDirection = z.infer<typeof SpriteDirectionSchema>;
export type AccessoryRequiredFeature = z.infer<
  typeof AccessoryRequiredFeatureSchema
>;
export type AccessoryMetadata = z.infer<typeof AccessoryMetadataSchema>;
export type AccessoryQuery = z.infer<typeof AccessoryQuerySchema>;
export type AccessoryPlacement = z.infer<typeof AccessoryPlacementSchema>;
export type AccessoryUsage = z.infer<typeof AccessoryUsageSchema>;
export type AccessoryTaskOperation = z.infer<
  typeof AccessoryTaskOperationSchema
>;
export type AccessorySearchRequest = z.infer<
  typeof AccessorySearchRequestSchema
>;
export type AccessoryWorkflowRequest = z.infer<
  typeof AccessoryWorkflowRequestSchema
>;
export type AccessoryDiscoveryItem = z.infer<
  typeof AccessoryDiscoveryItemSchema
>;
export type AccessoryOperationSummary = z.infer<
  typeof AccessoryOperationSummarySchema
>;
export type PartTemplateDefinition = z.infer<
  typeof PartTemplateDefinitionSchema
>;
export type PartInstance = z.infer<typeof PartInstanceSchema>;
export type JointDefinition = z.infer<typeof JointDefinitionSchema>;
export type ConnectionDefinition = z.infer<typeof ConnectionDefinitionSchema>;
export type AssemblyDefinition = z.infer<typeof AssemblyDefinitionSchema>;
export type VariantDefinition = z.infer<typeof VariantDefinitionSchema>;
export type PoseDefinition = z.infer<typeof PoseDefinitionSchema>;
export type AssetDocument = z.infer<typeof AssetDocumentSchema>;
export type ValidationErrorCode = z.infer<typeof ValidationErrorCodeSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ToolResultEnvelope = z.infer<typeof ToolResultEnvelopeSchema>;
export type InspectionSection = z.infer<typeof InspectionSectionSchema>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type AccessoryDiscoveryData = z.infer<
  typeof AccessoryDiscoveryDataSchema
>;
export type AssetInspectionPartState = z.infer<
  typeof AssetInspectionPartStateSchema
>;
export type AssetInspectionPart = z.infer<typeof AssetInspectionPartSchema>;
export type AssetInspectionConnection = z.infer<
  typeof AssetInspectionConnectionSchema
>;
export type AssetInspectionData = z.infer<typeof AssetInspectionDataSchema>;
export type SemanticChange = z.infer<typeof SemanticChangeSchema>;
export type SemanticRevisionComparison = z.infer<
  typeof SemanticRevisionComparisonSchema
>;
export type CapabilityStatus = z.infer<typeof CapabilityStatusSchema>;
export type CapabilityCategory = z.infer<typeof CapabilityCategorySchema>;
export type CapabilityEvidence = z.infer<typeof CapabilityEvidenceSchema>;
export type CapabilityFact = z.infer<typeof CapabilityFactSchema>;
export type CapabilityReport = z.infer<typeof CapabilityReportSchema>;
export type GeometryMaterialGroup = z.infer<typeof GeometryMaterialGroupSchema>;
export type IndexedGeometry = z.infer<typeof IndexedGeometrySchema>;

export interface SceneSummaryPart {
  readonly id: string;
  readonly templateId: string;
  readonly role: string;
  readonly worldTransform: Transform;
  readonly bounds: Bounds;
  readonly materialBindings: readonly MaterialBinding[];
  readonly triangleCount: number;
  readonly visible: boolean;
}

export interface SceneSummary {
  readonly id: string;
  readonly parts: readonly SceneSummaryPart[];
  readonly bounds: Bounds;
  readonly triangleCount: number;
}
