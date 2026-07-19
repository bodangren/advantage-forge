import { describe, expect, it } from 'vitest';

import { PartTemplateDefinitionSchema } from '../../src/contracts/index.js';
import {
  AccessoryCatalogEntrySchema,
  rusticAccessoryCatalog,
} from '../../src/fantasy-kit/index.js';

const requiredNewIds = [
  'equipment.helmet.iron',
  'equipment.hood.cloth',
  'equipment.axe',
  'equipment.mace',
  'equipment.spear',
  'equipment.staff',
  'equipment.shield.kite',
  'equipment.torch',
  'equipment.armor.leather',
  'equipment.armor.mail',
  'equipment.cape',
  'equipment.quiver',
  'equipment.backpack',
  'equipment.pouch.belt',
  'equipment.scabbard',
] as const;

describe('bounded accessory catalog specification', () => {
  it('commits every required new identity with complete closed metadata', () => {
    expect(rusticAccessoryCatalog.map(({ template }) => template.id)).toEqual(
      requiredNewIds,
    );
    for (const entry of rusticAccessoryCatalog) {
      expect(AccessoryCatalogEntrySchema.parse(entry)).toEqual(entry);
      expect(PartTemplateDefinitionSchema.parse(entry.template)).toEqual(
        entry.template,
      );
      expect(entry.template.accessory).toBeDefined();
      expect(Object.keys(entry.parameterBounds).length).toBeGreaterThan(0);
      expect(entry.defaultMaterialId).toMatch(
        /^(iron|bronze|wood|leather|cloth)\./,
      );
    }
  });

  it('covers all six slots and all four reference loadouts', () => {
    const slots = new Set(
      rusticAccessoryCatalog.map(({ template }) => template.accessory?.slot),
    );
    expect(slots).toEqual(
      new Set(['head', 'main-hand', 'off-hand', 'body', 'back', 'waist']),
    );
    const loadouts = new Set(
      rusticAccessoryCatalog.flatMap(({ intendedLoadouts }) =>
        intendedLoadouts.map((loadout) => loadout),
      ),
    );
    expect(loadouts).toEqual(
      new Set(['guard', 'traveler', 'ranger', 'caster']),
    );
  });

  it('maps every template to a named attachment and bounded reference use', () => {
    for (const entry of rusticAccessoryCatalog) {
      expect(entry.attachmentTarget.parentPartId).not.toHaveLength(0);
      expect(entry.attachmentTarget.parentPortId).not.toHaveLength(0);
      expect(entry.intendedLoadouts.length).toBeGreaterThan(0);
      expect(
        entry.template.accessory?.attachmentPortIds.length,
      ).toBeGreaterThan(0);
    }
  });

  it('reuses only the existing twelve-shape grammar', () => {
    const existingGenerators = new Set([
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
    for (const { template } of rusticAccessoryCatalog)
      expect(existingGenerators.has(template.shape.kind)).toBe(true);
  });
});
