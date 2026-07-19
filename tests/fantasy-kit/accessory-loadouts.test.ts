import { describe, expect, it } from 'vitest';

import {
  AccessoryLoadoutIdSchema,
  ReferenceLoadoutSchema,
  getRusticAccessoryCatalogEntry,
  getRusticAccessoryLoadout,
  rusticAccessoryLoadouts,
} from '../../src/fantasy-kit/index.js';

const expectedSelections = {
  guard: [
    'equipment.helmet.iron',
    'equipment.spear',
    'equipment.shield.kite',
    'equipment.armor.mail',
  ],
  traveler: ['equipment.hood.cloth', 'equipment.staff', 'equipment.backpack'],
  ranger: [
    'equipment.spear',
    'equipment.armor.leather',
    'equipment.quiver',
    'equipment.pouch.belt',
  ],
  caster: [
    'equipment.hood.cloth',
    'equipment.staff',
    'equipment.cape',
    'equipment.pouch.belt',
  ],
} as const;

describe('rustic accessory reference loadouts', () => {
  it('commits exactly four closed, budget-safe loadout definitions', () => {
    expect(rusticAccessoryLoadouts.map(({ id }) => id)).toEqual(
      AccessoryLoadoutIdSchema.options,
    );
    for (const loadout of rusticAccessoryLoadouts) {
      expect(ReferenceLoadoutSchema.parse(loadout)).toEqual(loadout);
      expect(loadout.archetypeId).toBe(loadout.id);
      expect(loadout.baseReference).toBe('adventurer');
      expect(loadout.accessories.map(({ templateId }) => templateId)).toEqual(
        expectedSelections[loadout.id],
      );
      expect(loadout.triangleBudget.maximumTotalTriangles).toBeLessThanOrEqual(
        2_000,
      );
      expect(getRusticAccessoryLoadout(loadout.id)).toBe(loadout);
    }
  });

  it('derives stable slot-owned parts and exact feature thresholds from the catalog', () => {
    for (const loadout of rusticAccessoryLoadouts)
      for (const accessory of loadout.accessories) {
        const entry = getRusticAccessoryCatalogEntry(accessory.templateId);
        const metadata = entry?.template.accessory;
        expect(entry, accessory.templateId).toBeDefined();
        expect(metadata, accessory.templateId).toBeDefined();
        expect(accessory.partId).toBe(`accessory.${accessory.equipmentSlot}`);
        expect(accessory.materialId).toBe(entry?.defaultMaterialId);
        expect(metadata?.compatibleArchetypes).toContain(loadout.archetypeId);
        expect(accessory.requiredFeatures).toEqual(
          metadata?.requiredFeatures.map((feature) => ({
            ...feature,
            partId: accessory.partId,
            templateId: accessory.templateId,
            maximumOcclusionRatio: 0.8,
            minimumOklabDistance: 0.05,
          })),
        );
      }
  });

  it('requires all eight directions and the complete before/after review matrix', () => {
    for (const loadout of rusticAccessoryLoadouts) {
      expect(loadout.framing).toEqual({
        directionOrder: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        expectedGroundPixelY: 121,
        minimumTopMarginPixels: 4,
        maximumCenterDeviationPixels: 12,
        maximumHeightDeviationPixels: 12,
      });
      expect(loadout.reviewStates).toEqual([
        expect.objectContaining({
          id: 'before',
          poseId: 'idle',
          equipmentState: 'baseline',
        }),
        expect.objectContaining({
          id: 'idle-equipped',
          poseId: 'idle',
          equipmentState: 'equipped',
        }),
        expect.objectContaining({
          id: 'action-equipped',
          poseId: 'action',
          equipmentState: 'equipped',
        }),
        expect.objectContaining({
          id: 'action-unequipped',
          poseId: 'action',
          equipmentState: 'unequipped',
        }),
      ]);
      for (const state of loadout.reviewStates)
        expect(state.surfaces).toEqual([
          'interactive-3d',
          'contact-sheet',
          'native-frames',
        ]);
      for (const feature of loadout.accessories.flatMap(
        ({ requiredFeatures }) => requiredFeatures,
      ))
        expect(feature.intendedDirections).toEqual(
          feature.templateId === 'equipment.pouch.belt'
            ? ['N', 'NE', 'E', 'SE', 'S', 'W', 'NW']
            : feature.templateId === 'equipment.cape'
              ? ['E', 'SE', 'S', 'SW', 'W', 'NW']
              : ['equipment.sword', 'equipment.staff'].includes(
                    feature.templateId,
                  )
                ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'NW']
                : feature.templateId === 'equipment.spear'
                  ? ['N', 'NE', 'E', 'SE', 'S', 'NW']
                  : ['equipment.shield', 'equipment.shield.kite'].includes(
                        feature.templateId,
                      )
                    ? ['N', 'NE', 'SE', 'S', 'SW', 'W', 'NW']
                    : loadout.framing.directionOrder,
        );
    }
  });

  it('keeps loadout intent semantic and free of caller-authored placement data', () => {
    expect(JSON.stringify(rusticAccessoryLoadouts)).not.toMatch(
      /transform|rotation|position|scale|parentPort|parentPart|connection|shape/i,
    );
  });
});
