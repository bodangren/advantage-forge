import { describe, expect, it } from 'vitest';

import {
  AccessoryMetadataSchema,
  AccessoryQuerySchema,
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
  });
});
