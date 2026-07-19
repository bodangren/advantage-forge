import { describe, expect, it } from 'vitest';

import { evaluateAssembly } from '../../src/assembly/index.js';
import { AccessoryUsageSchema } from '../../src/contracts/index.js';
import {
  adventurerDocument,
  getRusticAccessoryCatalogEntry,
  rusticAccessoryCatalog,
  rusticTemplates,
} from '../../src/fantasy-kit/index.js';

describe('rustic accessory usage profiles', () => {
  it('lists and resolves all seventeen accessories from one deterministic source', () => {
    const ids = rusticAccessoryCatalog.map(({ template }) => template.id);
    expect(ids).toHaveLength(17);
    expect(new Set(ids)).toHaveLength(17);
    expect(ids).toEqual([...ids].sort());

    for (const entry of rusticAccessoryCatalog)
      expect(getRusticAccessoryCatalogEntry(entry.template.id)).toBe(entry);
    expect(getRusticAccessoryCatalogEntry('equipment.missing')).toBeUndefined();
  });

  it('declares one exact placement for every compatible slot', () => {
    for (const entry of rusticAccessoryCatalog) {
      expect(AccessoryUsageSchema.parse(entry.usage)).toEqual(entry.usage);
      const compatibleSlots =
        entry.template.accessory?.compatibleSlots ??
        (entry.template.accessory === undefined
          ? []
          : [entry.template.accessory.slot]);
      expect(
        entry.usage.placements.map(({ slot }) => slot).sort(),
        entry.template.id,
      ).toEqual([...compatibleSlots].sort());
      expect(entry.usage.visualChecks.length).toBeGreaterThan(0);

      for (const placement of entry.usage.placements) {
        const parentPart = adventurerDocument.assembly.parts.find(
          ({ id }) => id === placement.parentPartId,
        );
        const parentTemplate = rusticTemplates.find(
          ({ id }) => id === parentPart?.templateId,
        );
        expect(
          parentPart,
          `${entry.template.id}:${placement.slot}`,
        ).toBeDefined();
        expect(
          parentTemplate?.ports.some(({ id }) => id === placement.parentPortId),
          `${entry.template.id}:${placement.slot}`,
        ).toBe(true);
        expect(placement.intendedOrientation).not.toHaveLength(0);
        expect(placement.guidance).not.toHaveLength(0);
      }

      const defaultPlacement = entry.usage.placements.find(
        ({ slot }) => slot === entry.template.accessory?.slot,
      );
      expect(defaultPlacement).toMatchObject(entry.attachmentTarget);
    }
  });

  it('keeps legacy IDs while carrying the sword down and shield upright', () => {
    const swordUsage = getRusticAccessoryCatalogEntry('equipment.sword');
    const shieldUsage = getRusticAccessoryCatalogEntry('equipment.shield');
    const swordPart = adventurerDocument.assembly.parts.find(
      ({ id }) => id === 'sword',
    );
    const shieldPart = adventurerDocument.assembly.parts.find(
      ({ id }) => id === 'shield',
    );
    expect(swordPart?.templateId).toBe('equipment.sword');
    expect(shieldPart?.templateId).toBe('equipment.shield');
    expect(
      adventurerDocument.assembly.connections.find(
        ({ id }) => id === 'equip-sword',
      ),
    ).toMatchObject({ childPartId: 'sword', childPortId: 'grip' });
    expect(
      adventurerDocument.assembly.connections.find(
        ({ id }) => id === 'equip-shield',
      ),
    ).toMatchObject({ childPartId: 'shield', childPortId: 'grip' });
    expect(swordPart?.transform).toEqual(
      swordUsage?.usage.placements.find(({ slot }) => slot === 'main-hand')
        ?.transform,
    );
    expect(shieldPart?.transform).toEqual(
      shieldUsage?.usage.placements.find(({ slot }) => slot === 'off-hand')
        ?.transform,
    );

    const scene = evaluateAssembly(
      adventurerDocument.assembly,
      adventurerDocument.templates,
    );
    const sword = scene.parts.find(({ id }) => id === 'sword')!;
    const shield = scene.parts.find(({ id }) => id === 'shield')!;
    const torso = scene.parts.find(({ id }) => id === 'torso')!;
    const swordSize = sword.bounds.max.map(
      (maximum, axis) => maximum - sword.bounds.min[axis]!,
    );
    const shieldSize = shield.bounds.max.map(
      (maximum, axis) => maximum - shield.bounds.min[axis]!,
    );
    expect(swordSize[1]).toBeGreaterThan(swordSize[0]! * 6);
    expect(sword.bounds.min[0]).toBeGreaterThan(torso.bounds.max[0]);
    expect(sword.bounds.min[1]).toBeLessThan(torso.bounds.min[1]);
    expect(shieldSize[1]).toBeGreaterThan(shieldSize[2]! * 4);
  });
});
