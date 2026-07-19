import { describe, expect, it } from 'vitest';

import {
  AccessoryDiscoveryItemSchema,
  AccessoryMetadataSchema,
  AccessoryOperationSummarySchema,
  AccessoryQuerySchema,
  AccessorySearchRequestSchema,
  AccessoryTaskOperationSchema,
  AccessoryUsageSchema,
  AccessoryWorkflowRequestSchema,
  PartTemplateDefinitionSchema,
  type PartTemplateDefinition,
} from '../../src/contracts/index.js';
import { rusticTemplates } from '../../src/fantasy-kit/index.js';

const accessoryTemplate = (): PartTemplateDefinition => ({
  id: 'equipment.test-helmet',
  role: 'equipment.helmet',
  shape: {
    kind: 'ellipsoid',
    radiusX: 0.22,
    radiusY: 0.18,
    radiusZ: 0.21,
    widthSegments: 8,
    heightSegments: 4,
  },
  materialSlots: ['metal'],
  ports: [
    {
      id: 'head.attach',
      frame: {
        position: [0, -0.12, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
      },
      tags: ['equipment.grip'],
      accepts: ['equipment.mount'],
      cardinality: 'single',
    },
  ],
  accessory: {
    role: 'headwear',
    slot: 'head',
    compatibleSlots: ['head'],
    attachmentPortIds: ['head.attach'],
    handedness: 'neutral',
    compatibilityTags: ['rustic', 'guard'],
    compatibleAnatomy: ['rustic-human'],
    compatibleArchetypes: ['adventurer', 'guard'],
    layer: {
      kind: 'overlay',
      order: 10,
      maximumIntersectionRatio: 0.18,
    },
    bounds: { min: [-0.22, -0.18, -0.21], max: [0.22, 0.18, 0.21] },
    triangleBudget: 256,
    allowedPoseIds: ['idle', 'action'],
    requiredFeatures: [
      {
        id: 'helmet-crown',
        expectation: 'Crown extends beyond the head silhouette.',
        intendedDirections: ['N', 'E', 'S', 'W'],
        minimumPixelArea: 12,
        minimumWidthPixels: 3,
      },
    ],
  },
});

describe('accessory template contracts', () => {
  it('parses the complete closed accessory grammar', () => {
    const template = accessoryTemplate();
    expect(PartTemplateDefinitionSchema.parse(template)).toEqual(template);
    expect(AccessoryMetadataSchema.parse(template.accessory)).toEqual(
      template.accessory,
    );
  });

  it('rejects unknown fields, invalid slots, and missing attachment ports', () => {
    const unknown = structuredClone(accessoryTemplate()) as Record<
      string,
      unknown
    >;
    (unknown['accessory'] as Record<string, unknown>)['engineTransform'] = {};
    expect(PartTemplateDefinitionSchema.safeParse(unknown).success).toBe(false);

    const invalidSlot = structuredClone(accessoryTemplate()) as Record<
      string,
      unknown
    >;
    (invalidSlot['accessory'] as Record<string, unknown>)['slot'] = 'inventory';
    expect(PartTemplateDefinitionSchema.safeParse(invalidSlot).success).toBe(
      false,
    );

    const missingPort = structuredClone(accessoryTemplate());
    missingPort.accessory!.attachmentPortIds = ['missing.attach'];
    const result = PartTemplateDefinitionSchema.safeParse(missingPort);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.path).toEqual([
        'accessory',
        'attachmentPortIds',
        0,
      ]);
  });

  it('migrates sword and shield under stable IDs with complete metadata', () => {
    for (const id of ['equipment.sword', 'equipment.shield']) {
      const template = rusticTemplates.find((entry) => entry.id === id);
      expect(template?.id).toBe(id);
      expect(template?.accessory).toBeDefined();
      expect(PartTemplateDefinitionSchema.parse(template)).toEqual(template);
    }
  });

  it('bounds accessory discovery filters and response budgets', () => {
    const query = {
      roles: ['headwear'],
      slots: ['head'],
      handedness: ['neutral'],
      compatibilityTags: ['guard'],
      materialFamilies: ['iron'],
      offset: 0,
      limit: 10,
    };
    expect(AccessoryQuerySchema.parse(query)).toEqual(query);
    expect(AccessoryQuerySchema.safeParse({ ...query, limit: 0 }).success).toBe(
      false,
    );
    expect(
      AccessoryQuerySchema.safeParse({ ...query, limit: 51 }).success,
    ).toBe(false);
    expect(
      AccessoryQuerySchema.safeParse({ ...query, rawGeometry: true }).success,
    ).toBe(false);
    expect(AccessoryQuerySchema.parse({})).toEqual({ offset: 0, limit: 20 });
    expect(
      AccessoryQuerySchema.safeParse({ roles: ['headwear', 'headwear'] })
        .success,
    ).toBe(false);
  });

  it('owns per-slot placement and orientation guidance inside the kit contract', () => {
    const usage = {
      summary: 'Carry the blade below the hand with its broad face readable.',
      placements: [
        {
          slot: 'main-hand',
          parentPartId: 'arm-right',
          parentPortId: 'equipment',
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0.130526, 0.991445],
            scale: [1, 1, 1],
          },
          intendedOrientation:
            'Blade points down and slightly away from the body.',
          guidance: 'Use this placement directly; do not derive a quaternion.',
        },
      ],
      visualChecks: [
        'The hand meets the grip rather than the blade.',
        'The blade silhouette is separated from the leg at native resolution.',
      ],
    };

    expect(AccessoryUsageSchema.parse(usage)).toEqual(usage);
    expect(
      AccessoryUsageSchema.safeParse({
        ...usage,
        placements: [usage.placements[0], usage.placements[0]],
      }).success,
    ).toBe(false);
  });

  it('accepts only closed task-level accessory operations', () => {
    const equip = {
      operation: 'equip',
      templateId: 'equipment.sword',
      equipmentSlot: 'main-hand',
      materialId: 'iron',
    };
    expect(AccessoryTaskOperationSchema.parse(equip)).toEqual(equip);
    expect(
      AccessoryTaskOperationSchema.safeParse({
        ...equip,
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
      }).success,
    ).toBe(false);

    const revisionId = `revision.${'a'.repeat(64)}`;
    expect(
      AccessorySearchRequestSchema.parse({
        assetId: 'asset.hero',
        archetypeId: 'adventurer',
      }),
    ).toEqual({
      assetId: 'asset.hero',
      archetypeId: 'adventurer',
      query: { offset: 0, limit: 20 },
    });
    expect(
      AccessoryWorkflowRequestSchema.parse({
        assetId: 'asset.hero',
        expectedRevisionId: revisionId,
        archetypeId: 'adventurer',
        operation: equip,
      }).dryRun,
    ).toBe(false);
  });

  it('returns bounded compatibility, usage, and exact mutation evidence', () => {
    const discovery = {
      templateId: 'equipment.sword',
      role: 'weapon',
      defaultSlot: 'main-hand',
      compatibleSlots: ['main-hand', 'off-hand'],
      handedness: 'either',
      compatibilityTags: ['rustic', 'martial'],
      compatibleAnatomy: ['rustic-human'],
      compatibleArchetypes: ['adventurer'],
      parameterBounds: { 'shape.height': [0.5, 1.2] },
      defaultMaterialId: 'iron',
      materialOptions: [{ id: 'iron', family: 'iron' }],
      attachmentTarget: {
        parentPartId: 'arm-right',
        parentPortId: 'equipment',
      },
      attachmentPorts: [
        {
          id: 'grip',
          frame: {
            position: [0, 0.42, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
          tags: ['equipment.mount'],
          accepts: ['equipment.grip'],
          cardinality: 'single',
        },
      ],
      requiredFeatures: [
        {
          id: 'blade',
          expectation: 'Blade remains distinct from the body.',
          intendedDirections: ['S', 'W'],
          minimumPixelArea: 12,
          minimumWidthPixels: 2,
        },
      ],
      usage: {
        summary: 'Carry the sword below the hand.',
        placements: [
          {
            slot: 'main-hand',
            parentPartId: 'arm-right',
            parentPortId: 'equipment',
            transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0.130526, 0.991445],
              scale: [1, 1, 1],
            },
            intendedOrientation: 'Blade points down and away from the body.',
            guidance: 'Apply this profile without modification.',
          },
        ],
        visualChecks: ['The hand overlaps the grip, not the blade.'],
      },
      compatibility: {
        eligible: true,
        issueCodes: [],
        replacementRequired: false,
      },
      exampleOperation: {
        operation: 'equip',
        templateId: 'equipment.sword',
        equipmentSlot: 'main-hand',
        materialId: 'iron',
      },
    };
    expect(AccessoryDiscoveryItemSchema.parse(discovery)).toEqual(discovery);
    expect(
      AccessoryDiscoveryItemSchema.safeParse({
        ...discovery,
        compatibleSlots: ['off-hand'],
      }).success,
    ).toBe(false);

    const summary = {
      operation: 'equip',
      dryRun: true,
      parentRevisionId: `revision.${'a'.repeat(64)}`,
      partId: 'accessory.main-hand',
      templateId: 'equipment.sword',
      equipmentSlot: 'main-hand',
      materialId: 'iron',
      validation: 'valid',
      affectedIds: ['accessory.main-hand', 'connection.main-hand'],
      addedIds: ['accessory.main-hand', 'connection.main-hand'],
      removedIds: [],
      connectionIds: ['connection.main-hand'],
      changePreview: {
        total: 2,
        truncated: false,
        items: [
          {
            path: 'assembly.parts.accessory.main-hand',
            kind: 'added',
            semanticId: 'accessory.main-hand',
            after: { templateId: 'equipment.sword' },
          },
        ],
      },
    };
    expect(AccessoryOperationSummarySchema.parse(summary)).toEqual(summary);
    expect(
      AccessoryOperationSummarySchema.safeParse({
        ...summary,
        affectedIds: ['accessory.main-hand', 'accessory.main-hand'],
      }).success,
    ).toBe(false);
  });
});
