import { describe, expect, it } from 'vitest';

import {
  AccessoryCatalogEntrySchema,
  adventurerDocument,
  rusticAccessoryCatalog,
  rusticManifest,
  rusticMaterials,
  rusticTemplates,
} from '../../src/fantasy-kit/index.js';
import {
  generateGeometry,
  validateIndexedGeometry,
} from '../../src/geometry/index.js';

const legacyAccessoryIds = ['equipment.sword', 'equipment.shield'] as const;
const accessoryIds = [
  ...legacyAccessoryIds,
  ...rusticAccessoryCatalog.map(({ template }) => template.id),
];
const allowedMaterialFamilies = new Set([
  'iron',
  'bronze',
  'wood',
  'leather',
  'cloth',
  'bone',
  'crystal',
]);

describe('initial accessory library runtime contract', () => {
  it('registers all seventeen accessories in the shared kit and manifest', () => {
    const registered = rusticTemplates.filter(
      ({ accessory }) => accessory !== undefined,
    );
    expect(new Set(registered.map(({ id }) => id))).toEqual(
      new Set(accessoryIds),
    );
    expect(registered).toHaveLength(17);

    const manifested = rusticManifest.filter(
      ({ template }) => template.accessory !== undefined,
    );
    expect(new Set(manifested.map(({ template }) => template.id))).toEqual(
      new Set(accessoryIds),
    );
    for (const entry of rusticAccessoryCatalog)
      expect(rusticTemplates.find(({ id }) => id === entry.template.id)).toBe(
        entry.template,
      );
  });

  it('builds deterministic valid geometry within declared bounds and budgets', () => {
    for (const { template } of rusticAccessoryCatalog) {
      const first = generateGeometry(template.shape);
      const second = generateGeometry(template.shape);
      expect(first, template.id).toEqual(second);
      expect(validateIndexedGeometry(first), template.id).toEqual([]);
      expect(first.metadata.triangleCount, template.id).toBeLessThanOrEqual(
        template.accessory?.triangleBudget ?? 0,
      );
      expect(first.materialGroups, template.id).toEqual([
        {
          materialSlot: 'surface',
          indexStart: 0,
          indexCount: first.indices.length,
        },
      ]);
      for (const axis of [0, 1, 2] as const) {
        expect(
          first.bounds.min[axis],
          `${template.id} min axis ${axis}`,
        ).toBeGreaterThanOrEqual(
          template.accessory?.bounds.min[axis] ?? Infinity,
        );
        expect(
          first.bounds.max[axis],
          `${template.id} max axis ${axis}`,
        ).toBeLessThanOrEqual(
          template.accessory?.bounds.max[axis] ?? -Infinity,
        );
      }
    }
  });

  it('resolves every default material to the bounded rustic palette', () => {
    for (const entry of rusticAccessoryCatalog) {
      const material = rusticMaterials.find(
        ({ id }) => id === entry.defaultMaterialId,
      );
      expect(material, entry.template.id).toBeDefined();
      expect(
        allowedMaterialFamilies.has(material?.family ?? ''),
        entry.template.id,
      ).toBe(true);
      expect(entry.template.materialSlots).toHaveLength(1);
    }
  });

  it('resolves every catalog attachment target to an adventurer mount port', () => {
    for (const entry of rusticAccessoryCatalog) {
      const parentPart = adventurerDocument.assembly.parts.find(
        ({ id }) => id === entry.attachmentTarget.parentPartId,
      );
      const parentTemplate = rusticTemplates.find(
        ({ id }) => id === parentPart?.templateId,
      );
      expect(parentPart, entry.template.id).toBeDefined();
      expect(
        parentTemplate?.ports.some(
          ({ id }) => id === entry.attachmentTarget.parentPortId,
        ),
        entry.template.id,
      ).toBe(true);
    }
  });

  it('rejects unsupported parameters, slots, materials, and compatibility metadata', () => {
    const source = rusticAccessoryCatalog[0];
    expect(source).toBeDefined();
    if (source === undefined) return;

    expect(
      AccessoryCatalogEntrySchema.safeParse({
        ...source,
        template: {
          ...source.template,
          shape: { kind: 'ellipsoid', radiusX: 0 },
        },
      }).success,
    ).toBe(false);
    expect(
      AccessoryCatalogEntrySchema.safeParse({
        ...source,
        template: {
          ...source.template,
          accessory: {
            ...source.template.accessory,
            slot: 'main-hand',
            compatibleSlots: ['head'],
          },
        },
      }).success,
    ).toBe(false);
    expect(
      AccessoryCatalogEntrySchema.safeParse({
        ...source,
        defaultMaterialId: 'material.unsupported',
      }).success,
    ).toBe(false);
    expect(
      AccessoryCatalogEntrySchema.safeParse({
        ...source,
        template: {
          ...source.template,
          accessory: {
            ...source.template.accessory,
            attachmentPortIds: ['missing.port'],
          },
        },
      }).success,
    ).toBe(false);
  });

  it('uses only shared grammar data with no accessory-specific generator', () => {
    const sharedShapeKinds = new Set([
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
    ]);
    for (const entry of rusticAccessoryCatalog) {
      expect(sharedShapeKinds.has(entry.template.shape.kind)).toBe(true);
      expect(entry.template.id.startsWith('equipment.')).toBe(true);
    }
  });
});
