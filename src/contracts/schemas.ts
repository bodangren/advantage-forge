import { z } from 'zod';

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
  })
  .strict();
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

export const PartTemplateDefinitionSchema = z
  .object({
    id: SemanticIdSchema,
    role: SemanticIdSchema,
    shape: ShapeDefinitionSchema,
    materialSlots: z.array(SemanticIdSchema).min(1).max(16),
    ports: z.array(PortDefinitionSchema).max(32),
  })
  .strict();

export const PartInstanceSchema = z
  .object({
    id: SemanticIdSchema,
    templateId: SemanticIdSchema,
    handedness: z.enum(['neutral', 'left', 'right']).optional(),
    transform: TransformSchema,
    shape: ShapeDefinitionSchema.optional(),
    materialBindings: z.array(MaterialBindingSchema).min(1).max(16),
    visible: z.boolean(),
    jointValueDegrees: FiniteNumberSchema.optional(),
  })
  .strict();

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
  })
  .strict();

export const AssetDocumentSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: SemanticIdSchema,
    name: z.string().min(1).max(120),
    unit: z.literal(WORLD_UNIT),
    seed: z.number().int().min(0).max(2_147_483_647),
    kitId: SemanticIdSchema,
    materials: z.array(MaterialDefinitionSchema).min(1).max(256),
    templates: z.array(PartTemplateDefinitionSchema).min(1).max(2_000),
    assembly: AssemblyDefinitionSchema,
    variants: z.array(VariantDefinitionSchema).max(128),
    poses: z.array(PoseDefinitionSchema).max(128),
    renderProfiles: z.array(SpriteRenderProfileSchema).min(1).max(16),
    activeVariantId: SemanticIdSchema.optional(),
    activePoseId: SemanticIdSchema.optional(),
  })
  .strict();

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
