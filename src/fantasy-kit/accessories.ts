import { z } from 'zod';

import {
  PartTemplateDefinitionSchema,
  SemanticIdSchema,
  type AccessoryMetadata,
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
  'leather.dark',
  'wood.oak',
  'wood.dark',
  'iron.weathered',
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
  readonly intendedLoadouts: readonly AccessoryLoadoutId[];
  readonly attachmentTarget: AccessoryCatalogEntry['attachmentTarget'];
  readonly attachmentPosition: readonly [number, number, number];
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
        frame: { ...IDENTITY, position: [...input.attachmentPosition] },
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
      compatibleArchetypes: [...input.intendedLoadouts],
      layer: input.layer,
      bounds: input.bounds,
      triangleBudget: input.triangleBudget,
      allowedPoseIds: ['idle', 'action'],
      requiredFeatures: [
        {
          id: input.featureId,
          expectation: input.featureExpectation,
          intendedDirections: [...DIRECTIONS],
          minimumPixelArea: input.minimumPixelArea,
          minimumWidthPixels: input.minimumWidthPixels,
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

export const rusticAccessoryCatalog: readonly AccessoryCatalogEntry[] =
  Object.freeze([
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
          [0.025, -0.66],
          [0.025, 0.42],
          [0.08, 0.54],
          [0, 0.72],
        ],
        radialSegments: 7,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.weathered',
      tags: ['reach', 'guard', 'ranger'],
      layer: carriedLayer,
      bounds: { min: [-0.08, -0.66, -0.08], max: [0.08, 0.72, 0.08] },
      triangleBudget: 128,
      featureId: 'spear-tip',
      featureExpectation: 'Spear tip remains distinct at the top of the shaft.',
      minimumPixelArea: 8,
      minimumWidthPixels: 2,
      intendedLoadouts: ['guard', 'ranger'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, -0.38, 0],
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
        radius: 0.035,
        radialSegments: 7,
      },
      materialSlot: 'wood',
      defaultMaterialId: 'wood.dark',
      tags: ['traveler', 'caster'],
      layer: carriedLayer,
      bounds: { min: [-0.035, -0.695, -0.035], max: [0.265, 0.675, 0.035] },
      triangleBudget: 192,
      featureId: 'staff-crook',
      featureExpectation: 'Crooked staff top remains visible beside the head.',
      minimumPixelArea: 10,
      minimumWidthPixels: 2,
      intendedLoadouts: ['traveler', 'caster'],
      attachmentTarget: rightHandTarget,
      attachmentPosition: [0, -0.38, 0],
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
      materialSlot: 'wood',
      defaultMaterialId: 'wood.oak',
      tags: ['defense', 'guard'],
      layer: carriedLayer,
      bounds: { min: [-0.3, -0.52, -0.035], max: [0.3, 0.42, 0.035] },
      triangleBudget: 128,
      featureId: 'kite-point',
      featureExpectation: 'Kite shield retains its pointed lower silhouette.',
      minimumPixelArea: 30,
      minimumWidthPixels: 4,
      intendedLoadouts: ['guard'],
      attachmentTarget: leftHandTarget,
      attachmentPosition: [0, 0, -0.06],
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
      shape: { kind: 'wedge', width: 0.62, height: 0.72, depth: 0.36 },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.dark',
      tags: ['traveler', 'ranger', 'armor'],
      layer: overlayLayer,
      bounds: { min: [-0.31, -0.36, -0.18], max: [0.31, 0.36, 0.18] },
      triangleBudget: 64,
      featureId: 'armor-shoulder',
      featureExpectation: 'Leather shell broadens the shoulder silhouette.',
      minimumPixelArea: 28,
      minimumWidthPixels: 4,
      intendedLoadouts: ['traveler', 'ranger'],
      attachmentTarget: bodyTarget,
      attachmentPosition: [0, 0, -0.18],
    }),
    catalogEntry({
      id: 'equipment.armor.mail',
      role: 'armor',
      slot: 'body',
      shape: {
        kind: 'beveledBox',
        width: 0.6,
        height: 0.7,
        depth: 0.34,
        bevel: 0.04,
      },
      materialSlot: 'metal',
      defaultMaterialId: 'iron.weathered',
      tags: ['guard', 'armor'],
      layer: overlayLayer,
      bounds: { min: [-0.3, -0.35, -0.17], max: [0.3, 0.35, 0.17] },
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
      shape: { kind: 'flatCard', width: 0.58, height: 0.9 },
      materialSlot: 'cloth',
      defaultMaterialId: 'cloth.moss',
      tags: ['traveler', 'caster'],
      layer: { ...overlayLayer, order: 12 },
      bounds: { min: [-0.29, -0.45, -0.01], max: [0.29, 0.45, 0.01] },
      triangleBudget: 16,
      featureId: 'cape-tail',
      featureExpectation: 'Cape extends below the torso from reverse views.',
      minimumPixelArea: 24,
      minimumWidthPixels: 4,
      intendedLoadouts: ['traveler', 'caster'],
      attachmentTarget: backTarget,
      attachmentPosition: [0, 0.4, 0],
    }),
    catalogEntry({
      id: 'equipment.quiver',
      role: 'back-item',
      slot: 'back',
      shape: {
        kind: 'cylinder',
        radius: 0.12,
        height: 0.72,
        radialSegments: 8,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.dark',
      tags: ['ranger', 'ammunition'],
      layer: { ...overlayLayer, order: 13 },
      bounds: { min: [-0.12, -0.36, -0.12], max: [0.12, 0.36, 0.12] },
      triangleBudget: 96,
      featureId: 'quiver-rim',
      featureExpectation: 'Quiver rim remains visible above one shoulder.',
      minimumPixelArea: 12,
      minimumWidthPixels: 3,
      intendedLoadouts: ['ranger'],
      attachmentTarget: backTarget,
      attachmentPosition: [0, 0.22, 0],
    }),
    catalogEntry({
      id: 'equipment.backpack',
      role: 'back-item',
      slot: 'back',
      shape: {
        kind: 'beveledBox',
        width: 0.46,
        height: 0.58,
        depth: 0.24,
        bevel: 0.05,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.dark',
      tags: ['traveler', 'pack'],
      layer: { ...overlayLayer, order: 14 },
      bounds: { min: [-0.23, -0.29, -0.12], max: [0.23, 0.29, 0.12] },
      triangleBudget: 128,
      featureId: 'pack-body',
      featureExpectation: 'Backpack projects beyond the torso in side views.',
      minimumPixelArea: 26,
      minimumWidthPixels: 4,
      intendedLoadouts: ['traveler'],
      attachmentTarget: backTarget,
      attachmentPosition: [0, 0.2, 0.12],
    }),
    catalogEntry({
      id: 'equipment.pouch.belt',
      role: 'waist-item',
      slot: 'waist',
      shape: {
        kind: 'beveledBox',
        width: 0.24,
        height: 0.2,
        depth: 0.12,
        bevel: 0.025,
      },
      materialSlot: 'leather',
      defaultMaterialId: 'leather.dark',
      tags: ['traveler', 'utility'],
      layer: overlayLayer,
      bounds: { min: [-0.12, -0.1, -0.06], max: [0.12, 0.1, 0.06] },
      triangleBudget: 128,
      featureId: 'pouch-flap',
      featureExpectation: 'Belt pouch remains visible beside the pelvis.',
      minimumPixelArea: 10,
      minimumWidthPixels: 3,
      intendedLoadouts: ['traveler', 'ranger', 'caster'],
      attachmentTarget: waistTarget,
      attachmentPosition: [0, 0.08, -0.06],
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

export const rusticAccessoryTemplates: readonly PartTemplateDefinition[] =
  rusticAccessoryCatalog.map(({ template }) => template);
