import { z } from 'zod';

import {
  AccessoryUsageSchema,
  PartTemplateDefinitionSchema,
  SemanticIdSchema,
  type AccessoryMetadata,
  type AccessoryUsage,
  type EquipmentSlot,
  type PartTemplateDefinition,
  type ShapeDefinition,
  type SpriteDirection,
  type Transform,
} from '../contracts/index.js';

export const AccessoryLoadoutIdSchema = z.enum([
  'guard',
  'traveler',
  'ranger',
  'caster',
]);
export type AccessoryLoadoutId = z.infer<typeof AccessoryLoadoutIdSchema>;

export const RUSTIC_ACCESSORY_MATERIAL_IDS = [
  'cloth.moss',
  'cloth.umber',
  'cloth.arcane',
  'leather.dark',
  'leather.tan',
  'leather.rust',
  'wood.oak',
  'wood.dark',
  'iron.weathered',
  'iron.blued',
  'bronze.aged',
  'bone.ivory',
  'crystal.arcane',
] as const;
const rusticAccessoryMaterialIds = new Set<string>(
  RUSTIC_ACCESSORY_MATERIAL_IDS,
);

export const AccessoryCatalogEntrySchema = z
  .object({
    template: PartTemplateDefinitionSchema,
    parameterBounds: z.record(
      z.string().min(1),
      z.tuple([z.number().finite(), z.number().finite()]),
    ),
    defaultMaterialId: SemanticIdSchema,
    intendedLoadouts: z.array(AccessoryLoadoutIdSchema).min(1).max(4),
    attachmentTarget: z
      .object({
        parentPartId: SemanticIdSchema,
        parentPortId: SemanticIdSchema,
      })
      .strict(),
    usage: AccessoryUsageSchema,
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.template.accessory === undefined)
      context.addIssue({
        code: 'custom',
        path: ['template', 'accessory'],
        message: 'Accessory catalog entries require accessory metadata.',
      });
    for (const [path, [minimum, maximum]] of Object.entries(
      entry.parameterBounds,
    ))
      if (minimum >= maximum)
        context.addIssue({
          code: 'custom',
          path: ['parameterBounds', path],
          message: 'Parameter bounds must have a minimum below the maximum.',
        });
    if (!rusticAccessoryMaterialIds.has(entry.defaultMaterialId))
      context.addIssue({
        code: 'custom',
        path: ['defaultMaterialId'],
        message: 'Material is not part of the rustic accessory palette.',
      });
    const compatibleSlots =
      entry.template.accessory?.compatibleSlots ??
      (entry.template.accessory === undefined
        ? []
        : [entry.template.accessory.slot]);
    const placementSlots = entry.usage.placements.map(({ slot }) => slot);
    if (
      compatibleSlots.length !== placementSlots.length ||
      compatibleSlots.some((slot) => !placementSlots.includes(slot))
    )
      context.addIssue({
        code: 'custom',
        path: ['usage', 'placements'],
        message:
          'Usage placements must cover every compatible slot exactly once.',
      });
    const defaultPlacement = entry.usage.placements.find(
      ({ slot }) => slot === entry.template.accessory?.slot,
    );
    if (
      defaultPlacement !== undefined &&
      (defaultPlacement.parentPartId !== entry.attachmentTarget.parentPartId ||
        defaultPlacement.parentPortId !== entry.attachmentTarget.parentPortId)
    )
      context.addIssue({
        code: 'custom',
        path: ['attachmentTarget'],
        message: 'Default placement must match the catalog attachment target.',
      });
  });
export type AccessoryCatalogEntry = z.infer<typeof AccessoryCatalogEntrySchema>;

const IDENTITY: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
};
const DIRECTIONS: readonly SpriteDirection[] = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
];

function practicalBounds(
  shape: ShapeDefinition,
): Record<string, [number, number]> {
  const around = (value: number): [number, number] => [
    Number((value * 0.8).toFixed(4)),
    Number((value * 1.2).toFixed(4)),
  ];
  switch (shape.kind) {
    case 'box':
    case 'wedge':
      return {
        width: around(shape.width),
        height: around(shape.height),
        depth: around(shape.depth),
      };
    case 'beveledBox':
      return {
        width: around(shape.width),
        height: around(shape.height),
        depth: around(shape.depth),
        bevel: around(shape.bevel),
      };
    case 'prism':
      return {
        radius: around(shape.radius),
        height: around(shape.height),
        sides: [Math.max(3, shape.sides - 2), shape.sides + 2],
      };
    case 'cylinder':
    case 'cone':
      return {
        radius: around(shape.radius),
        height: around(shape.height),
        radialSegments: [
          Math.max(3, shape.radialSegments - 2),
          shape.radialSegments + 2,
        ],
      };
    case 'ellipsoid':
      return {
        radiusX: around(shape.radiusX),
        radiusY: around(shape.radiusY),
        radiusZ: around(shape.radiusZ),
        widthSegments: [
          Math.max(3, shape.widthSegments - 2),
          shape.widthSegments + 2,
        ],
        heightSegments: [
          Math.max(2, shape.heightSegments - 2),
          shape.heightSegments + 2,
        ],
      };
    case 'capsule':
      return {
        radius: around(shape.radius),
        cylinderHeight: around(shape.cylinderHeight),
        radialSegments: [
          Math.max(3, shape.radialSegments - 2),
          shape.radialSegments + 2,
        ],
        capSegments: [
          Math.max(2, shape.capSegments - 1),
          shape.capSegments + 1,
        ],
      };
    case 'extrudedProfile':
      return { profileScale: [0.8, 1.2], depth: around(shape.depth) };
    case 'lathedProfile':
      return {
        profileScale: [0.8, 1.2],
        radialSegments: [
          Math.max(3, shape.radialSegments - 2),
          shape.radialSegments + 2,
        ],
      };
    case 'tubePath':
      return {
        pathScale: [0.8, 1.2],
        radius: around(shape.radius),
        radialSegments: [
          Math.max(3, shape.radialSegments - 2),
          shape.radialSegments + 2,
        ],
      };
    case 'flatCard':
      return { width: around(shape.width), height: around(shape.height) };
  }
}

interface EntryInput {
  readonly id: string;
  readonly role: AccessoryMetadata['role'];
  readonly slot: EquipmentSlot;
  readonly compatibleSlots?: readonly EquipmentSlot[];
  readonly shape: ShapeDefinition;
  readonly materialSlot: string;
  readonly defaultMaterialId: string;
  readonly handedness?: AccessoryMetadata['handedness'];
  readonly tags: readonly string[];
  readonly layer: AccessoryMetadata['layer'];
  readonly bounds: AccessoryMetadata['bounds'];
  readonly triangleBudget: number;
  readonly featureId: string;
  readonly featureExpectation: string;
  readonly minimumPixelArea: number;
  readonly minimumWidthPixels: number;
  readonly intendedDirections?: readonly SpriteDirection[];
  readonly maximumOcclusionRatio?: number;
  readonly minimumOklabDistance?: number;
  readonly intendedLoadouts: readonly AccessoryLoadoutId[];
  readonly attachmentTarget: AccessoryCatalogEntry['attachmentTarget'];
  readonly attachmentPosition: readonly [number, number, number];
  readonly attachmentRotation?: Transform['rotation'];
  readonly compatibleArchetypes?: readonly string[];
  readonly placementTransforms?: Partial<Record<EquipmentSlot, Transform>>;
  readonly intendedOrientations?: Partial<Record<EquipmentSlot, string>>;
  readonly usageSummary?: string;
  readonly visualChecks?: readonly string[];
}

function targetForSlot(slot: EquipmentSlot) {
  switch (slot) {
    case 'head':
      return { parentPartId: 'head', parentPortId: 'equipment.head' } as const;
    case 'main-hand':
      return {
        parentPartId: 'hand.right',
        parentPortId: 'equipment',
      } as const;
    case 'off-hand':
      return {
        parentPartId: 'hand.left',
        parentPortId: 'equipment',
      } as const;
    case 'body':
      return {
        parentPartId: 'torso',
        parentPortId: 'equipment.body',
      } as const;
    case 'back':
      return {
        parentPartId: 'torso',
        parentPortId: 'equipment.back',
      } as const;
    case 'waist':
      return {
        parentPartId: 'pelvis',
        parentPortId: 'equipment.waist',
      } as const;
  }
}

function usageFor(
  input: EntryInput,
  compatibleSlots: readonly EquipmentSlot[],
): AccessoryUsage {
  return AccessoryUsageSchema.parse({
    summary:
      input.usageSummary ??
      `${input.id} uses declared ${compatibleSlots.join(' or ')} placement profiles.`,
    placements: compatibleSlots.map((slot) => {
      const target = targetForSlot(slot);
      return {
        slot,
        ...target,
        transform: structuredClone(
          input.placementTransforms?.[slot] ?? IDENTITY,
        ),
        intendedOrientation:
          input.intendedOrientations?.[slot] ??
          `${input.featureExpectation} Keep the accessory clear of the body silhouette.`,
        guidance: `Attach through ${target.parentPartId}.${target.parentPortId}; use this declared local transform instead of inventing attachment coordinates.`,
      };
    }),
    visualChecks: input.visualChecks ?? [
      input.featureExpectation,
      'At 128x128, confirm the named feature remains unclipped and materially distinct in every intended direction.',
    ],
  });
}

function catalogEntry(input: EntryInput): AccessoryCatalogEntry {
  const compatibleSlots = input.compatibleSlots ?? [input.slot];
  const template: PartTemplateDefinition = {
    id: input.id,
    role: input.id,
    shape: input.shape,
    materialSlots: [input.materialSlot],
    ports: [
      {
        id:
          input.slot === 'main-hand' || input.slot === 'off-hand'
            ? 'grip'
            : 'mount',
        frame: {
          ...IDENTITY,
          position: [...input.attachmentPosition],
          rotation: [
            ...(input.attachmentRotation ?? IDENTITY.rotation),
          ] as Transform['rotation'],
        },
        tags: ['equipment.grip'],
        accepts: ['equipment.mount'],
        cardinality: 'single',
      },
    ],
    accessory: {
      role: input.role,
      slot: input.slot,
      compatibleSlots: [...compatibleSlots],
      attachmentPortIds: [
        input.slot === 'main-hand' || input.slot === 'off-hand'
          ? 'grip'
          : 'mount',
      ],
      handedness:
        input.handedness ??
        (input.slot === 'main-hand' || input.slot === 'off-hand'
          ? 'either'
          : 'neutral'),
      compatibilityTags: ['rustic', ...input.tags],
      compatibleAnatomy: ['rustic-human'],
      compatibleArchetypes: [
        ...(input.compatibleArchetypes ?? input.intendedLoadouts),
      ],
      layer: input.layer,
      bounds: input.bounds,
      triangleBudget: input.triangleBudget,
      allowedPoseIds: ['idle', 'action'],
      requiredFeatures: [
        {
          id: input.featureId,
          expectation: input.featureExpectation,
          intendedDirections: [...(input.intendedDirections ?? DIRECTIONS)],
          minimumPixelArea: input.minimumPixelArea,
          minimumWidthPixels: input.minimumWidthPixels,
          maximumOcclusionRatio: input.maximumOcclusionRatio ?? 0.8,
          minimumOklabDistance: input.minimumOklabDistance ?? 0.05,
        },
      ],
    },
  };
  return AccessoryCatalogEntrySchema.parse({
    template,
    parameterBounds: practicalBounds(input.shape),
    defaultMaterialId: input.defaultMaterialId,
    intendedLoadouts: input.intendedLoadouts,
    attachmentTarget: input.attachmentTarget,
    usage: usageFor(input, compatibleSlots),
  });
}

const headTarget = {
  parentPartId: 'head',
  parentPortId: 'equipment.head',
} as const;
const rightHandTarget = {
  parentPartId: 'hand.right',
  parentPortId: 'equipment',
} as const;
const leftHandTarget = {
  parentPartId: 'hand.left',
  parentPortId: 'equipment',
} as const;
const bodyTarget = {
  parentPartId: 'torso',
  parentPortId: 'equipment.body',
} as const;
const backTarget = {
  parentPartId: 'torso',
  parentPortId: 'equipment.back',
} as const;
const waistTarget = {
  parentPartId: 'pelvis',
  parentPortId: 'equipment.waist',
} as const;
const carriedLayer = {
  kind: 'carried' as const,
  order: 20,
  maximumIntersectionRatio: 0.1,
};
const overlayLayer = {
  kind: 'overlay' as const,
  order: 10,
  maximumIntersectionRatio: 0.18,
};

function sortedAccessoryCatalog(
  entries: AccessoryCatalogEntry[],
): readonly AccessoryCatalogEntry[] {
  return Object.freeze(
    entries.sort((left, right) =>
      left.template.id.localeCompare(right.template.id),
    ),
  );
}

export const rusticAccessoryCatalog: readonly AccessoryCatalogEntry[] =
  sortedAccessoryCatalog([
    catalogEntry({
      id: 'equipment.sword',
      role: 'weapon',
      slot: 'main-hand',
      compatibleSlots: ['main-hand', 'off-hand'],
      shape: {
        kind: 'extrudedProfile',
        profile: [
          [-0.05, 0.52],
          [0.05, 0.52],
          [0.14, 0.24],
          [0.08, -0.34],
          [0, -0.52],
          [-0.08, -0.34],
          [-0.14, 0.24],
        ],
        depth: 0.07,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.weathered',
      tags: ['melee', 'guard'],
      layer: carriedLayer,
      bounds: {
        min: [-0.14, -0.52, -0.035],
        max: [0.14, 0.52, 0.035],
      },
      triangleBudget: 64,
      featureId: 'blade',
      featureExpectation: 'Blade silhouette remains readable beside the body.',
      minimumPixelArea: 10,
      minimumWidthPixels: 3,
      intendedDirections: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'NW'],
      intendedLoadouts: ['guard'],
      compatibleArchetypes: ['adventurer', 'guard', 'warrior'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, 0.44, 0],
      attachmentRotation: [0, -0.3826834323650898, 0, 0.9238795325112867],
      intendedOrientations: {
        'main-hand':
          'Blade points down and away from the right side of the body.',
        'off-hand':
          'Blade points down and away from the left side of the body.',
      },
      usageSummary:
        'A one-handed rustic sword carried blade-down and offset away from the body.',
      visualChecks: [
        'The hand meets the narrow grip above the crossguard rather than the blade.',
        'The blade extends below the torso and remains separated from the leg silhouette.',
        'The crossguard remains identifiable in narrow side and reverse views.',
      ],
    }),
    catalogEntry({
      id: 'equipment.shield',
      role: 'shield',
      slot: 'off-hand',
      compatibleSlots: ['off-hand', 'main-hand'],
      shape: { kind: 'prism', radius: 0.34, height: 0.08, sides: 8 },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.blued',
      tags: ['defense', 'guard'],
      layer: carriedLayer,
      bounds: {
        min: [-0.34, -0.04, -0.34],
        max: [0.34, 0.04, 0.34],
      },
      triangleBudget: 64,
      featureId: 'shield-face',
      featureExpectation: 'Shield face remains distinct from the torso.',
      minimumPixelArea: 24,
      minimumWidthPixels: 3,
      intendedDirections: ['N', 'NE', 'SE', 'S', 'SW', 'W', 'NW'],
      intendedLoadouts: ['guard'],
      compatibleArchetypes: ['adventurer', 'guard', 'warrior'],
      attachmentTarget: leftHandTarget,
      attachmentPosition: [0, 0, -0.07],
      attachmentRotation: [
        -0.6532814824381883, 0.2705980500730985, -0.2705980500730985,
        0.6532814824381883,
      ],
      intendedOrientations: {
        'main-hand':
          'Shield is upright and yawed outward so its broad face remains readable in the right hand.',
        'off-hand':
          'Shield is upright and yawed outward so its broad face remains readable in the left hand.',
      },
      usageSummary:
        'A round blued-iron shield held upright with its broad face yawed away from edge-on views.',
      visualChecks: [
        'The shield face reads as a broad defensive surface, not a horizontal platter.',
        'The rim remains distinct from the torso at native sprite resolution.',
      ],
    }),
    catalogEntry({
      id: 'equipment.helmet.iron',
      role: 'headwear',
      slot: 'head',
      shape: {
        kind: 'ellipsoid',
        radiusX: 0.24,
        radiusY: 0.17,
        radiusZ: 0.23,
        widthSegments: 10,
        heightSegments: 5,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.weathered',
      tags: ['guard', 'armor'],
      layer: overlayLayer,
      bounds: { min: [-0.24, -0.17, -0.23], max: [0.24, 0.17, 0.23] },
      triangleBudget: 256,
      featureId: 'helmet-crown',
      featureExpectation: 'Iron crown extends beyond the head silhouette.',
      minimumPixelArea: 18,
      minimumWidthPixels: 3,
      intendedLoadouts: ['guard'],
      attachmentTarget: headTarget,
      attachmentPosition: [0, -0.14, 0],
    }),
    catalogEntry({
      id: 'equipment.hood.cloth',
      role: 'headwear',
      slot: 'head',
      shape: {
        kind: 'ellipsoid',
        radiusX: 0.25,
        radiusY: 0.24,
        radiusZ: 0.24,
        widthSegments: 9,
        heightSegments: 5,
      },
      materialSlot: 'cloth',
      defaultMaterialId: 'cloth.umber',
      tags: ['traveler', 'caster'],
      layer: overlayLayer,
      bounds: { min: [-0.25, -0.24, -0.24], max: [0.25, 0.24, 0.24] },
      triangleBudget: 256,
      featureId: 'hood-outline',
      featureExpectation: 'Cloth hood frames and enlarges the head silhouette.',
      minimumPixelArea: 20,
      minimumWidthPixels: 3,
      intendedLoadouts: ['traveler', 'caster'],
      attachmentTarget: headTarget,
      attachmentPosition: [0, -0.17, 0],
    }),
    catalogEntry({
      id: 'equipment.axe',
      role: 'weapon',
      slot: 'main-hand',
      compatibleSlots: ['main-hand', 'off-hand'],
      shape: {
        kind: 'extrudedProfile',
        profile: [
          [-0.035, -0.5],
          [0.035, -0.5],
          [0.24, 0.16],
          [0.2, 0.36],
          [-0.14, 0.16],
        ],
        depth: 0.055,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.weathered',
      tags: ['melee', 'guard'],
      layer: carriedLayer,
      bounds: { min: [-0.14, -0.5, -0.0275], max: [0.24, 0.36, 0.0275] },
      triangleBudget: 128,
      featureId: 'axe-head',
      featureExpectation: 'Axe head remains wider than the handle.',
      minimumPixelArea: 12,
      minimumWidthPixels: 3,
      intendedLoadouts: ['guard'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, -0.44, 0],
    }),
    catalogEntry({
      id: 'equipment.mace',
      role: 'weapon',
      slot: 'main-hand',
      compatibleSlots: ['main-hand', 'off-hand'],
      shape: {
        kind: 'lathedProfile',
        profile: [
          [0.03, -0.5],
          [0.035, 0.18],
          [0.13, 0.22],
          [0.16, 0.34],
          [0.1, 0.42],
          [0, 0.46],
        ],
        radialSegments: 8,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'bronze.aged',
      tags: ['melee', 'guard'],
      layer: carriedLayer,
      bounds: { min: [-0.16, -0.5, -0.16], max: [0.16, 0.46, 0.16] },
      triangleBudget: 160,
      featureId: 'mace-head',
      featureExpectation: 'Mace head reads wider than its shaft.',
      minimumPixelArea: 12,
      minimumWidthPixels: 3,
      intendedLoadouts: ['guard'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, -0.44, 0],
    }),
    catalogEntry({
      id: 'equipment.spear',
      role: 'weapon',
      slot: 'main-hand',
      compatibleSlots: ['main-hand', 'off-hand'],
      shape: {
        kind: 'lathedProfile',
        profile: [
          [0.04, -0.66],
          [0.04, 0.42],
          [0.1, 0.54],
          [0, 0.72],
        ],
        radialSegments: 7,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.blued',
      tags: ['reach', 'guard', 'ranger'],
      layer: carriedLayer,
      bounds: { min: [-0.1, -0.66, -0.1], max: [0.1, 0.72, 0.1] },
      triangleBudget: 128,
      featureId: 'spear-tip',
      featureExpectation: 'Spear tip remains distinct at the top of the shaft.',
      minimumPixelArea: 10,
      minimumWidthPixels: 3,
      intendedDirections: ['N', 'NE', 'E', 'SE', 'S', 'NW'],
      intendedLoadouts: ['guard', 'ranger'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, -0.38, 0],
      attachmentRotation: [0, 0, 0.20791169081775931, 0.9781476007338057],
      intendedOrientations: {
        'main-hand':
          'Spear grip stays in the right hand while its shaft leans twenty-four degrees outward.',
        'off-hand':
          'Spear grip stays in the left hand while its shaft leans twenty-four degrees outward.',
      },
      visualChecks: [
        'The grip remains aligned to the equipped hand in all eight directions.',
        'The spear stays attached when its tip is self-occluded behind the loaded torso in west and southwest views.',
      ],
    }),
    catalogEntry({
      id: 'equipment.staff',
      role: 'weapon',
      slot: 'main-hand',
      compatibleSlots: ['main-hand', 'off-hand'],
      shape: {
        kind: 'tubePath',
        path: [
          [0, -0.66, 0],
          [0, 0.42, 0],
          [0.1, 0.64, 0],
          [0.23, 0.61, 0],
        ],
        radius: 0.07,
        radialSegments: 7,
      },
      materialSlot: 'wood',
      defaultMaterialId: 'wood.dark',
      tags: ['traveler', 'caster'],
      layer: carriedLayer,
      bounds: { min: [-0.07, -0.73, -0.07], max: [0.3, 0.71, 0.07] },
      triangleBudget: 192,
      featureId: 'staff-crook',
      featureExpectation: 'Crooked staff top remains visible beside the head.',
      minimumPixelArea: 12,
      minimumWidthPixels: 3,
      intendedDirections: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'NW'],
      intendedLoadouts: ['traveler', 'caster'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, -0.38, 0],
      attachmentRotation: [0, 0, 0.15643446504023087, 0.9876883405951378],
      intendedOrientations: {
        'main-hand':
          'Staff leans outward from the right shoulder so the crooked crown clears the head.',
        'off-hand':
          'Staff leans outward from the left shoulder so the crooked crown clears the head.',
      },
    }),
    catalogEntry({
      id: 'equipment.shield.kite',
      role: 'shield',
      slot: 'off-hand',
      compatibleSlots: ['off-hand', 'main-hand'],
      shape: {
        kind: 'extrudedProfile',
        profile: [
          [-0.3, -0.22],
          [0, -0.52],
          [0.3, -0.22],
          [0.25, 0.3],
          [0, 0.42],
          [-0.25, 0.3],
        ],
        depth: 0.07,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.blued',
      tags: ['defense', 'guard'],
      layer: carriedLayer,
      bounds: { min: [-0.3, -0.52, -0.035], max: [0.3, 0.42, 0.035] },
      triangleBudget: 128,
      featureId: 'kite-point',
      featureExpectation: 'Kite shield retains its pointed lower silhouette.',
      minimumPixelArea: 30,
      minimumWidthPixels: 4,
      intendedDirections: ['N', 'NE', 'SE', 'S', 'SW', 'W', 'NW'],
      intendedLoadouts: ['guard'],
      attachmentTarget: leftHandTarget,
      attachmentPosition: [0, 0, -0.06],
      attachmentRotation: [0, -0.3826834323650898, 0, 0.9238795325112867],
      intendedOrientations: {
        'main-hand':
          'Kite shield stays vertical and yaws forty-five degrees so its broad face remains readable from every cardinal camera.',
        'off-hand':
          'Kite shield stays vertical and yaws forty-five degrees so its broad face remains readable from every cardinal camera.',
      },
    }),
    catalogEntry({
      id: 'equipment.torch',
      role: 'light',
      slot: 'off-hand',
      compatibleSlots: ['off-hand', 'main-hand'],
      shape: {
        kind: 'lathedProfile',
        profile: [
          [0.035, -0.5],
          [0.04, 0.24],
          [0.11, 0.3],
          [0.08, 0.5],
          [0, 0.58],
        ],
        radialSegments: 8,
      },
      materialSlot: 'wood',
      defaultMaterialId: 'wood.oak',
      tags: ['traveler', 'light'],
      layer: carriedLayer,
      bounds: { min: [-0.11, -0.5, -0.11], max: [0.11, 0.58, 0.11] },
      triangleBudget: 160,
      featureId: 'torch-head',
      featureExpectation: 'Torch head remains wider than the wooden shaft.',
      minimumPixelArea: 12,
      minimumWidthPixels: 3,
      intendedLoadouts: ['traveler'],
      attachmentTarget: leftHandTarget,
      attachmentPosition: [0, -0.42, 0],
    }),
    catalogEntry({
      id: 'equipment.armor.leather',
      role: 'armor',
      slot: 'body',
      shape: {
        kind: 'extrudedProfile',
        profile: [
          [-0.32, -0.36],
          [0.32, -0.36],
          [0.42, 0.22],
          [0.28, 0.38],
          [-0.28, 0.38],
          [-0.42, 0.22],
        ],
        depth: 0.36,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.tan',
      tags: ['traveler', 'ranger', 'armor'],
      layer: overlayLayer,
      bounds: { min: [-0.42, -0.36, -0.18], max: [0.42, 0.38, 0.18] },
      triangleBudget: 128,
      featureId: 'armor-shoulder',
      featureExpectation: 'Leather shell broadens the shoulder silhouette.',
      minimumPixelArea: 28,
      minimumWidthPixels: 4,
      intendedLoadouts: ['traveler', 'ranger'],
      attachmentTarget: bodyTarget,
      attachmentPosition: [0, 0, 0],
    }),
    catalogEntry({
      id: 'equipment.armor.mail',
      role: 'armor',
      slot: 'body',
      shape: {
        kind: 'beveledBox',
        width: 0.72,
        height: 0.76,
        depth: 0.38,
        bevel: 0.04,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'bronze.aged',
      tags: ['guard', 'armor'],
      layer: overlayLayer,
      bounds: { min: [-0.36, -0.38, -0.19], max: [0.36, 0.38, 0.19] },
      triangleBudget: 128,
      featureId: 'mail-outline',
      featureExpectation: 'Mail shell remains distinct from the tunic.',
      minimumPixelArea: 30,
      minimumWidthPixels: 4,
      intendedLoadouts: ['guard'],
      attachmentTarget: bodyTarget,
      attachmentPosition: [0, 0, -0.17],
    }),
    catalogEntry({
      id: 'equipment.cape',
      role: 'back-item',
      slot: 'back',
      shape: {
        kind: 'extrudedProfile',
        profile: [
          [-0.42, -0.32],
          [0, -0.66],
          [0.42, -0.32],
          [0.34, 0.5],
          [-0.34, 0.5],
        ],
        depth: 0.16,
      },
      materialSlot: 'cloth',
      defaultMaterialId: 'cloth.arcane',
      tags: ['traveler', 'caster'],
      layer: {
        ...overlayLayer,
        order: 12,
        maximumIntersectionRatio: 0.35,
      },
      bounds: { min: [-0.42, -0.66, -0.08], max: [0.42, 0.5, 0.08] },
      triangleBudget: 64,
      featureId: 'cape-tail',
      featureExpectation: 'Cape extends below the torso from reverse views.',
      minimumPixelArea: 24,
      minimumWidthPixels: 4,
      intendedDirections: ['E', 'SE', 'S', 'SW', 'W', 'NW'],
      intendedLoadouts: ['traveler', 'caster'],
      attachmentTarget: backTarget,
      attachmentPosition: [0, 0.4, 0],
      placementTransforms: {
        back: {
          position: [0, -0.2, -0.16],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
      },
      usageSummary:
        'A stylized rigid cape with a tapered profile and pointed hem; it does not simulate cloth.',
      visualChecks: [
        'The rigid cape reads as a tapered garment rather than a rectangular board.',
        'The pointed hem stays clear of the ground and legs in idle and action poses.',
        'Front-oblique views may self-occlude this back-worn feature; the part must remain attached and valid there.',
      ],
    }),
    catalogEntry({
      id: 'equipment.quiver',
      role: 'back-item',
      slot: 'back',
      shape: {
        kind: 'cylinder',
        radius: 0.15,
        height: 0.76,
        radialSegments: 8,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.rust',
      tags: ['ranger', 'ammunition'],
      layer: { ...overlayLayer, order: 13 },
      bounds: { min: [-0.15, -0.38, -0.15], max: [0.15, 0.38, 0.15] },
      triangleBudget: 96,
      featureId: 'quiver-rim',
      featureExpectation: 'Quiver rim remains visible above one shoulder.',
      minimumPixelArea: 12,
      minimumWidthPixels: 3,
      intendedLoadouts: ['ranger'],
      attachmentTarget: backTarget,
      attachmentPosition: [0, 0.22, 0],
      placementTransforms: {
        back: {
          position: [0.46, 0.3, -0.02],
          rotation: [0, 0, -0.10452846326765347, 0.9945218953682733],
          scale: [1, 1, 1],
        },
      },
    }),
    catalogEntry({
      id: 'equipment.backpack',
      role: 'back-item',
      slot: 'back',
      shape: {
        kind: 'extrudedProfile',
        profile: [
          [-0.3, -0.36],
          [0.3, -0.36],
          [0.3, 0.2],
          [0.18, 0.36],
          [-0.18, 0.36],
          [-0.3, 0.2],
        ],
        depth: 0.32,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.tan',
      tags: ['traveler', 'pack'],
      layer: { ...overlayLayer, order: 14 },
      bounds: { min: [-0.3, -0.36, -0.16], max: [0.3, 0.36, 0.16] },
      triangleBudget: 128,
      featureId: 'pack-body',
      featureExpectation: 'Backpack projects beyond the torso in side views.',
      minimumPixelArea: 26,
      minimumWidthPixels: 4,
      intendedLoadouts: ['traveler'],
      attachmentTarget: backTarget,
      attachmentPosition: [0, 0.2, 0.12],
      placementTransforms: {
        back: {
          position: [0.2, 0.06, -0.2],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
      },
      usageSummary:
        'A centered shallow leather pack with a rounded top and tapered shoulder silhouette.',
      visualChecks: [
        'The pack stays no wider than the shoulders in front and reverse views.',
        'The rounded top and rear projection remain readable without becoming a detached cuboid.',
      ],
    }),
    catalogEntry({
      id: 'equipment.pouch.belt',
      role: 'waist-item',
      slot: 'waist',
      shape: {
        kind: 'beveledBox',
        width: 0.38,
        height: 0.24,
        depth: 0.32,
        bevel: 0.05,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.rust',
      tags: ['traveler', 'utility'],
      layer: { ...overlayLayer, maximumIntersectionRatio: 0.35 },
      bounds: { min: [-0.19, -0.12, -0.16], max: [0.19, 0.12, 0.16] },
      triangleBudget: 128,
      featureId: 'pouch-flap',
      featureExpectation: 'Belt pouch remains visible beside the pelvis.',
      minimumPixelArea: 10,
      minimumWidthPixels: 3,
      intendedDirections: ['N', 'NE', 'E', 'SE', 'S', 'W', 'NW'],
      intendedLoadouts: ['traveler', 'ranger', 'caster'],
      attachmentTarget: waistTarget,
      attachmentPosition: [0, 0.08, -0.06],
      placementTransforms: {
        waist: {
          position: [0.46, -0.12, -0.04],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
      },
      usageSummary:
        'A compact utility pouch mounted at one hip rather than across the waist.',
      visualChecks: [
        'The pouch reads as one lateral hip object, never as a belt-wide slab.',
        'The pouch stays distinct from body armor and back equipment in every direction.',
        'The far-side SW view may self-occlude this single hip feature; the part must remain attached and valid there.',
      ],
    }),
    catalogEntry({
      id: 'equipment.scabbard',
      role: 'waist-item',
      slot: 'waist',
      shape: {
        kind: 'capsule',
        radius: 0.045,
        cylinderHeight: 0.72,
        radialSegments: 7,
        capSegments: 3,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.dark',
      tags: ['guard', 'weapon-storage'],
      layer: overlayLayer,
      bounds: {
        min: [-0.045, -0.405, -0.045],
        max: [0.045, 0.405, 0.045],
      },
      triangleBudget: 192,
      featureId: 'scabbard-tip',
      featureExpectation: 'Scabbard extends below the waist silhouette.',
      minimumPixelArea: 12,
      minimumWidthPixels: 2,
      intendedLoadouts: ['guard'],
      attachmentTarget: waistTarget,
      attachmentPosition: [0, 0.34, 0],
    }),
  ]);

const rusticAccessoryByTemplateId = new Map(
  rusticAccessoryCatalog.map((entry) => [entry.template.id, entry]),
);

export function getRusticAccessoryCatalogEntry(
  templateId: string,
): AccessoryCatalogEntry | undefined {
  return rusticAccessoryByTemplateId.get(templateId);
}

export const rusticAccessoryTemplates: readonly PartTemplateDefinition[] =
  rusticAccessoryCatalog.map(({ template }) => template);
