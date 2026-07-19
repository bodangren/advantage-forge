import { describe, expect, it } from 'vitest';

import { PartTemplateDefinitionSchema } from '../../src/contracts/index.js';
import {
  AccessoryCatalogEntrySchema,
  getRusticAccessoryCatalogEntry,
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
    const ids = rusticAccessoryCatalog.map(({ template }) => template.id);
    expect(ids).toHaveLength(17);
    expect(ids).toEqual(expect.arrayContaining([...requiredNewIds]));
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

  it('encodes the owner-approved delivery-resolution silhouettes as kit data', () => {
    const required = (templateId: string) => {
      const entry = getRusticAccessoryCatalogEntry(templateId);
      expect(entry, templateId).toBeDefined();
      return entry!;
    };

    const kite = required('equipment.shield.kite');
    expect(kite.defaultMaterialId).toBe('iron.blued');
    expect(
      kite.usage.placements.some(({ intendedOrientation }) =>
        /vertical/i.test(intendedOrientation),
      ),
    ).toBe(true);

    const spear = required('equipment.spear');
    expect(spear.template.shape.kind).toBe('lathedProfile');
    if (spear.template.shape.kind !== 'lathedProfile')
      throw new Error('Expected a lathed spear profile.');
    expect(spear.template.shape.profile).toContainEqual([0.04, -0.66]);
    expect(
      spear.template.accessory?.requiredFeatures[0]?.minimumWidthPixels,
    ).toBeGreaterThanOrEqual(3);

    const staff = required('equipment.staff');
    expect(staff.template.shape).toMatchObject({
      kind: 'tubePath',
      radius: 0.07,
    });
    expect(staff.defaultMaterialId).toBe('wood.dark');
    expect(
      staff.template.accessory?.requiredFeatures[0]?.minimumWidthPixels,
    ).toBeGreaterThanOrEqual(3);

    const backpack = required('equipment.backpack');
    expect(backpack.template.shape).toMatchObject({
      kind: 'extrudedProfile',
      depth: 0.32,
    });
    expect(backpack.defaultMaterialId).toBe('leather.tan');
    expect(backpack.usage.placements[0]?.transform.position[0]).toBe(0.2);

    const armor = required('equipment.armor.leather');
    expect(armor.template.shape).toMatchObject({
      kind: 'extrudedProfile',
      depth: 0.36,
    });
    if (armor.template.shape.kind !== 'extrudedProfile')
      throw new Error('Expected an extruded armor profile.');
    expect(armor.template.shape.profile).toContainEqual([0.42, 0.22]);
    expect(armor.template.shape.profile).toContainEqual([-0.42, 0.22]);

    const pouch = required('equipment.pouch.belt');
    expect(pouch.template.shape).toMatchObject({
      kind: 'beveledBox',
      width: 0.38,
      height: 0.24,
      depth: 0.32,
    });
    expect(pouch.defaultMaterialId).toBe('leather.rust');
    expect(Math.abs(pouch.usage.placements[0]!.transform.position[0])).toBe(
      0.46,
    );

    const cape = required('equipment.cape');
    expect(cape.template.shape).toMatchObject({
      kind: 'extrudedProfile',
      depth: 0.16,
    });
    expect(cape.defaultMaterialId).toBe('cloth.arcane');
    expect(cape.usage.summary).toMatch(/rigid/i);
    expect(
      cape.template.accessory?.requiredFeatures[0]?.intendedDirections,
    ).toEqual(['E', 'SE', 'S', 'SW', 'W', 'NW']);
  });

  it('keeps sword-down and shield-upright regression guidance public', () => {
    const sword = getRusticAccessoryCatalogEntry('equipment.sword')!;
    const shield = getRusticAccessoryCatalogEntry('equipment.shield')!;
    expect(sword.usage.visualChecks.join(' ')).toMatch(/below the torso/i);
    expect(
      sword.usage.placements.some(({ intendedOrientation }) =>
        /down and away/i.test(intendedOrientation),
      ),
    ).toBe(true);
    expect(sword.template.shape).toMatchObject({
      kind: 'extrudedProfile',
      depth: 0.07,
    });
    expect(sword.defaultMaterialId).toBe('iron.weathered');
    expect(
      sword.template.accessory?.requiredFeatures[0]?.minimumWidthPixels,
    ).toBeGreaterThanOrEqual(3);
    expect(
      sword.usage.placements.some(
        ({ transform }) =>
          JSON.stringify(transform.position) === JSON.stringify([0, 0, 0]),
      ),
    ).toBe(true);
    if (sword.template.shape.kind !== 'extrudedProfile')
      throw new Error('Expected an extruded sword profile.');
    expect(sword.template.shape.profile).toContainEqual([0.14, 0.24]);
    expect(sword.template.shape.profile).toContainEqual([0, -0.52]);
    expect(shield.usage.visualChecks.join(' ')).toMatch(
      /not a horizontal platter/i,
    );
    expect(
      shield.usage.placements.some(({ intendedOrientation }) =>
        /upright/i.test(intendedOrientation),
      ),
    ).toBe(true);
    expect(
      shield.template.ports.some(
        ({ id, frame }) => id === 'grip' && Math.abs(frame.rotation[0]) > 0.6,
      ),
    ).toBe(true);
    expect(
      shield.usage.placements.every(
        ({ transform }) =>
          JSON.stringify(transform) ===
          JSON.stringify({
            position: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          }),
      ),
    ).toBe(true);
    expect(shield.defaultMaterialId).toBe('iron.blued');
  });
});
