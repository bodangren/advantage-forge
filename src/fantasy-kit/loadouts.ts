import { z } from 'zod';

import {
  EquipmentSlotSchema,
  SemanticIdSchema,
  SpriteDirectionSchema,
} from '../contracts/index.js';

import {
  AccessoryLoadoutIdSchema,
  getRusticAccessoryCatalogEntry,
  type AccessoryLoadoutId,
} from './accessories.js';

const ReviewSurfaceSchema = z.enum([
  'interactive-3d',
  'contact-sheet',
  'native-frames',
]);
const ReviewStateIdSchema = z.enum([
  'before',
  'idle-equipped',
  'action-equipped',
  'action-unequipped',
]);

export const ReferenceLoadoutFeatureSchema = z
  .object({
    id: SemanticIdSchema,
    partId: SemanticIdSchema,
    templateId: SemanticIdSchema,
    expectation: z.string().min(1).max(160),
    intendedDirections: z.array(SpriteDirectionSchema).min(1).max(8),
    minimumPixelArea: z.number().int().min(1).max(16_384),
    minimumWidthPixels: z.number().int().min(1).max(128),
    maximumOcclusionRatio: z.number().min(0).max(1),
    minimumOklabDistance: z.number().gt(0).max(1),
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
        message: 'Intended directions must be unique.',
      });
  });

export const ReferenceLoadoutAccessorySchema = z
  .object({
    partId: SemanticIdSchema,
    templateId: SemanticIdSchema,
    equipmentSlot: EquipmentSlotSchema,
    materialId: SemanticIdSchema,
    requiredFeatures: z.array(ReferenceLoadoutFeatureSchema).min(1).max(16),
  })
  .strict();

export const ReferenceLoadoutSchema = z
  .object({
    id: AccessoryLoadoutIdSchema,
    displayName: z.string().min(1).max(80),
    archetypeId: SemanticIdSchema,
    baseReference: z.literal('adventurer'),
    accessories: z.array(ReferenceLoadoutAccessorySchema).min(1).max(6),
    reviewStates: z
      .array(
        z
          .object({
            id: ReviewStateIdSchema,
            poseId: z.enum(['idle', 'action']),
            equipmentState: z.enum(['baseline', 'equipped', 'unequipped']),
            surfaces: z.array(ReviewSurfaceSchema).length(3),
          })
          .strict(),
      )
      .length(4),
    framing: z
      .object({
        directionOrder: z.array(SpriteDirectionSchema).length(8),
        expectedGroundPixelY: z.number().int().min(0).max(127),
        minimumTopMarginPixels: z.number().int().min(1).max(32),
        maximumCenterDeviationPixels: z.number().int().min(0).max(64),
        maximumHeightDeviationPixels: z.number().int().min(0).max(64),
      })
      .strict(),
    triangleBudget: z
      .object({
        baseAnatomyTriangles: z.number().int().min(1),
        maximumAccessoryTriangles: z.number().int().min(1),
        maximumTotalTriangles: z.number().int().min(1).max(2_000),
      })
      .strict(),
  })
  .strict()
  .superRefine((loadout, context) => {
    for (const [path, values] of [
      ['accessories.partId', loadout.accessories.map(({ partId }) => partId)],
      [
        'accessories.templateId',
        loadout.accessories.map(({ templateId }) => templateId),
      ],
      [
        'accessories.equipmentSlot',
        loadout.accessories.map(({ equipmentSlot }) => equipmentSlot),
      ],
      [
        'requiredFeatures.id',
        loadout.accessories.flatMap(({ requiredFeatures }) =>
          requiredFeatures.map(({ id }) => id),
        ),
      ],
      ['reviewStates.id', loadout.reviewStates.map(({ id }) => id)],
      ['framing.directionOrder', loadout.framing.directionOrder],
    ] as const)
      if (new Set(values).size !== values.length)
        context.addIssue({
          code: 'custom',
          path: path.split('.'),
          message: `${path} must contain unique values.`,
        });

    const reviewStateIds = new Set(loadout.reviewStates.map(({ id }) => id));
    for (const required of ReviewStateIdSchema.options)
      if (!reviewStateIds.has(required))
        context.addIssue({
          code: 'custom',
          path: ['reviewStates'],
          message: `Review state '${required}' is required.`,
        });

    for (const [accessoryIndex, accessory] of loadout.accessories.entries())
      for (const [
        featureIndex,
        feature,
      ] of accessory.requiredFeatures.entries())
        if (
          feature.partId !== accessory.partId ||
          feature.templateId !== accessory.templateId
        )
          context.addIssue({
            code: 'custom',
            path: [
              'accessories',
              accessoryIndex,
              'requiredFeatures',
              featureIndex,
            ],
            message:
              'Feature evidence must identify its owning part and template.',
          });

    if (
      loadout.triangleBudget.baseAnatomyTriangles +
        loadout.triangleBudget.maximumAccessoryTriangles !==
      loadout.triangleBudget.maximumTotalTriangles
    )
      context.addIssue({
        code: 'custom',
        path: ['triangleBudget', 'maximumTotalTriangles'],
        message:
          'Maximum total triangles must equal base anatomy plus accessory budgets.',
      });
  });

export type ReferenceLoadoutFeature = z.infer<
  typeof ReferenceLoadoutFeatureSchema
>;
export type ReferenceLoadoutAccessory = z.infer<
  typeof ReferenceLoadoutAccessorySchema
>;
export type ReferenceLoadout = z.infer<typeof ReferenceLoadoutSchema>;

interface LoadoutSelection {
  readonly templateId: string;
  readonly equipmentSlot: z.infer<typeof EquipmentSlotSchema>;
  readonly materialId: string;
}

const LOADOUT_SELECTIONS = {
  guard: [
    {
      templateId: 'equipment.helmet.iron',
      equipmentSlot: 'head',
      materialId: 'iron.weathered',
    },
    {
      templateId: 'equipment.spear',
      equipmentSlot: 'main-hand',
      materialId: 'iron.blued',
    },
    {
      templateId: 'equipment.shield.kite',
      equipmentSlot: 'off-hand',
      materialId: 'iron.blued',
    },
    {
      templateId: 'equipment.armor.mail',
      equipmentSlot: 'body',
      materialId: 'bronze.aged',
    },
  ],
  traveler: [
    {
      templateId: 'equipment.hood.cloth',
      equipmentSlot: 'head',
      materialId: 'cloth.umber',
    },
    {
      templateId: 'equipment.staff',
      equipmentSlot: 'main-hand',
      materialId: 'wood.dark',
    },
    {
      templateId: 'equipment.backpack',
      equipmentSlot: 'back',
      materialId: 'leather.tan',
    },
  ],
  ranger: [
    {
      templateId: 'equipment.spear',
      equipmentSlot: 'main-hand',
      materialId: 'iron.blued',
    },
    {
      templateId: 'equipment.armor.leather',
      equipmentSlot: 'body',
      materialId: 'leather.tan',
    },
    {
      templateId: 'equipment.quiver',
      equipmentSlot: 'back',
      materialId: 'leather.rust',
    },
    {
      templateId: 'equipment.pouch.belt',
      equipmentSlot: 'waist',
      materialId: 'leather.rust',
    },
  ],
  caster: [
    {
      templateId: 'equipment.hood.cloth',
      equipmentSlot: 'head',
      materialId: 'cloth.umber',
    },
    {
      templateId: 'equipment.staff',
      equipmentSlot: 'main-hand',
      materialId: 'wood.dark',
    },
    {
      templateId: 'equipment.cape',
      equipmentSlot: 'back',
      materialId: 'cloth.arcane',
    },
    {
      templateId: 'equipment.pouch.belt',
      equipmentSlot: 'waist',
      materialId: 'leather.rust',
    },
  ],
} as const satisfies Record<AccessoryLoadoutId, readonly LoadoutSelection[]>;

const DISPLAY_NAMES: Readonly<Record<AccessoryLoadoutId, string>> = {
  guard: 'Helmeted Guard',
  traveler: 'Road Traveler',
  ranger: 'Rustic Ranger',
  caster: 'Hooded Caster',
};
const DIRECTIONS = SpriteDirectionSchema.options;
const REVIEW_SURFACES = ReviewSurfaceSchema.options;
const REVIEW_STATES = [
  {
    id: 'before',
    poseId: 'idle',
    equipmentState: 'baseline',
    surfaces: [...REVIEW_SURFACES],
  },
  {
    id: 'idle-equipped',
    poseId: 'idle',
    equipmentState: 'equipped',
    surfaces: [...REVIEW_SURFACES],
  },
  {
    id: 'action-equipped',
    poseId: 'action',
    equipmentState: 'equipped',
    surfaces: [...REVIEW_SURFACES],
  },
  {
    id: 'action-unequipped',
    poseId: 'action',
    equipmentState: 'unequipped',
    surfaces: [...REVIEW_SURFACES],
  },
] as const;
const BASE_ADVENTURER_TRIANGLES = 1_312;

function loadoutFor(id: AccessoryLoadoutId): ReferenceLoadout {
  const accessories = LOADOUT_SELECTIONS[id].map((selection) => {
    const entry = getRusticAccessoryCatalogEntry(selection.templateId);
    if (entry === undefined)
      throw new Error(
        `Reference loadout '${id}' uses unknown template '${selection.templateId}'.`,
      );
    const metadata = entry.template.accessory;
    if (metadata === undefined)
      throw new Error(
        `Reference loadout '${id}' template '${selection.templateId}' is not an accessory.`,
      );
    if (!entry.intendedLoadouts.includes(id))
      throw new Error(
        `Reference loadout '${id}' is not declared for '${selection.templateId}'.`,
      );
    if (
      selection.materialId !== entry.defaultMaterialId ||
      !(metadata.compatibleSlots ?? [metadata.slot]).includes(
        selection.equipmentSlot,
      )
    )
      throw new Error(
        `Reference loadout '${id}' has an incompatible slot or material for '${selection.templateId}'.`,
      );
    const partId = `accessory.${selection.equipmentSlot}`;
    return {
      partId,
      ...selection,
      requiredFeatures: metadata.requiredFeatures.map((feature) => ({
        ...feature,
        partId,
        templateId: selection.templateId,
        maximumOcclusionRatio: 0.8,
        minimumOklabDistance: 0.05,
      })),
    };
  });
  const maximumAccessoryTriangles = accessories.reduce((sum, accessory) => {
    const metadata = getRusticAccessoryCatalogEntry(accessory.templateId)
      ?.template.accessory;
    if (metadata === undefined)
      throw new Error(
        `Missing accessory budget for '${accessory.templateId}'.`,
      );
    return sum + metadata.triangleBudget;
  }, 0);
  return ReferenceLoadoutSchema.parse({
    id,
    displayName: DISPLAY_NAMES[id],
    archetypeId: id,
    baseReference: 'adventurer',
    accessories,
    reviewStates: REVIEW_STATES,
    framing: {
      directionOrder: DIRECTIONS,
      expectedGroundPixelY: 121,
      minimumTopMarginPixels: 4,
      maximumCenterDeviationPixels: 12,
      maximumHeightDeviationPixels: 12,
    },
    triangleBudget: {
      baseAnatomyTriangles: BASE_ADVENTURER_TRIANGLES,
      maximumAccessoryTriangles,
      maximumTotalTriangles:
        BASE_ADVENTURER_TRIANGLES + maximumAccessoryTriangles,
    },
  });
}

export const rusticAccessoryLoadouts: readonly ReferenceLoadout[] =
  Object.freeze(
    AccessoryLoadoutIdSchema.options.map((id) => Object.freeze(loadoutFor(id))),
  );

const loadoutById = new Map(
  rusticAccessoryLoadouts.map((loadout) => [loadout.id, loadout]),
);

export function getRusticAccessoryLoadout(
  id: AccessoryLoadoutId,
): ReferenceLoadout {
  const loadout = loadoutById.get(id);
  if (loadout === undefined)
    throw new Error(`Unknown rustic accessory loadout '${id}'.`);
  return loadout;
}
