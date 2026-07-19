import { describe, expect, it } from 'vitest';

import {
  AccessoryDiscoveryDataSchema,
  AccessoryOperationSummarySchema,
  type AssetDocument,
  type ToolResultEnvelope,
} from '../../src/contracts/index.js';
import {
  canonicalJson,
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly current = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();
  saveCalls = 0;

  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
  ): Promise<RevisionRecord> {
    this.saveCalls += 1;
    const prior = this.current.get(document.id);
    if (expected !== undefined && prior?.revisionId !== expected)
      throw new Error('REVISION_CONFLICT');
    const stored = structuredClone(document) as AssetDocument;
    const record: RevisionRecord = {
      revisionId: contentRevisionId(stored),
      assetId: stored.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-19T00:00:00.000Z',
      document: stored,
    };
    this.current.set(stored.id, record);
    this.records.set(`${stored.id}:${record.revisionId}`, record);
    return record;
  }

  async get(assetId: string, revisionId: string) {
    return this.records.get(`${assetId}:${revisionId}`);
  }

  async getCurrent(assetId: string) {
    return this.current.get(assetId);
  }
}

type AccessoryHandlers = ReturnType<typeof createToolHandlers> & {
  searchAccessories(input: unknown): Promise<ToolResultEnvelope>;
  applyAccessoryOperation(input: unknown): Promise<ToolResultEnvelope>;
};

const handlersFor = (revisions: MemoryRevisions): AccessoryHandlers =>
  createToolHandlers({ revisions }) as AccessoryHandlers;

describe('accessory workflow tools', () => {
  it('discovers bounded accessories with placement guidance and enriched inspection', async () => {
    const revisions = new MemoryRevisions();
    const handlers = handlersFor(revisions);
    await handlers.createAsset({ reference: 'adventurer' });
    const result = await handlers.searchAccessories({
      assetId: 'adventurer.rustic',
      archetypeId: 'guard',
      query: { roles: ['headwear'], slots: ['head'], offset: 0, limit: 1 },
    });
    const data = AccessoryDiscoveryDataSchema.parse(result.data);
    expect(result.ok).toBe(true);
    expect(data.page).toEqual({
      total: 1,
      offset: 0,
      limit: 1,
      truncated: false,
    });
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      templateId: 'equipment.helmet.iron',
      role: 'headwear',
      compatibleSlots: ['head'],
      compatibility: {
        eligible: true,
        issueCodes: [],
        replacementRequired: false,
      },
      usage: {
        placements: [
          {
            slot: 'head',
            parentPartId: 'head',
            parentPortId: 'equipment.head',
          },
        ],
      },
      exampleOperation: {
        operation: 'equip',
        templateId: 'equipment.helmet.iron',
        equipmentSlot: 'head',
      },
    });
    expect(JSON.stringify(data)).not.toMatch(/rawGeometry|positions|indices/);

    const inspected = await handlers.inspectTemplate({
      templateId: data.items[0]!.templateId,
    });
    expect(inspected.data).toMatchObject({
      accessory: {
        role: 'headwear',
        usage: data.items[0]!.usage,
        defaultMaterialId: data.items[0]!.defaultMaterialId,
      },
    });

    const twoHanded = await handlers.searchAccessories({
      assetId: 'adventurer.rustic',
      archetypeId: 'guard',
      query: { handedness: ['two-handed'], offset: 0, limit: 10 },
    });
    expect(AccessoryDiscoveryDataSchema.parse(twoHanded.data).items).toEqual(
      [],
    );
  });

  it('dry-runs and applies equip with exact IDs and byte-local mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = handlersFor(revisions);
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const baseline = revisions.current.get('adventurer.rustic')!;
    const baselineBytes = canonicalJson(baseline.document);
    const torsoBytes = canonicalJson(
      baseline.document.assembly.parts.find(({ id }) => id === 'torso'),
    );
    const saveCalls = revisions.saveCalls;
    const operation = {
      operation: 'equip' as const,
      templateId: 'equipment.helmet.iron',
      equipmentSlot: 'head' as const,
      materialId: 'iron.weathered',
    };

    const preview = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      archetypeId: 'guard',
      operation,
      dryRun: true,
    });
    const previewData = AccessoryOperationSummarySchema.parse(preview.data);
    expect(preview.revisionId).toBe(created.revisionId);
    expect(revisions.saveCalls).toBe(saveCalls);
    expect(
      canonicalJson(revisions.current.get('adventurer.rustic')!.document),
    ).toBe(baselineBytes);
    expect(previewData).toMatchObject({
      operation: 'equip',
      dryRun: true,
      parentRevisionId: created.revisionId,
      partId: 'accessory.head',
      equipmentSlot: 'head',
      affectedIds: ['accessory.head', 'connection.head'],
      addedIds: ['accessory.head', 'connection.head'],
      connectionIds: ['connection.head'],
    });

    const applied = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      archetypeId: 'guard',
      operation,
      dryRun: false,
    });
    const appliedData = AccessoryOperationSummarySchema.parse(applied.data);
    expect(applied.revisionId).not.toBe(created.revisionId);
    expect(revisions.saveCalls).toBe(saveCalls + 1);
    expect(applied.affectedIds).toEqual(appliedData.affectedIds);
    expect(appliedData).toMatchObject({ ...previewData, dryRun: false });

    const current = revisions.current.get('adventurer.rustic')!;
    expect(current.parentRevisionId).toBe(created.revisionId);
    expect(
      current.document.assembly.parts.find(({ id }) => id === 'accessory.head'),
    ).toMatchObject({
      templateId: 'equipment.helmet.iron',
      equipmentSlot: 'head',
      materialBindings: [{ materialId: 'iron.weathered' }],
    });
    expect(
      canonicalJson(
        current.document.assembly.parts.find(({ id }) => id === 'torso'),
      ),
    ).toBe(torsoBytes);
  });

  it('rejects occupied, stale, no-op, and unknown requests without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = handlersFor(revisions);
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const equipped = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      archetypeId: 'guard',
      operation: {
        operation: 'equip',
        templateId: 'equipment.helmet.iron',
        equipmentSlot: 'head',
      },
    });
    const before = canonicalJson(
      revisions.current.get('adventurer.rustic')!.document,
    );
    const saveCalls = revisions.saveCalls;
    const base = {
      assetId: 'adventurer.rustic',
      archetypeId: 'guard',
    };

    expect(
      await handlers.applyAccessoryOperation({
        ...base,
        expectedRevisionId: equipped.revisionId,
        operation: {
          operation: 'equip',
          templateId: 'equipment.hood.cloth',
          equipmentSlot: 'head',
        },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_ASSEMBLY', path: '$.operation.equipmentSlot' }],
    });
    expect(
      await handlers.applyAccessoryOperation({
        ...base,
        expectedRevisionId: created.revisionId,
        operation: { operation: 'unequip', partId: 'accessory.head' },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'REVISION_CONFLICT', path: '$.expectedRevisionId' }],
    });
    expect(
      await handlers.applyAccessoryOperation({
        ...base,
        expectedRevisionId: equipped.revisionId,
        operation: {
          operation: 'recolor',
          partId: 'accessory.head',
          materialId: 'iron.weathered',
        },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE', path: '$.operation.materialId' }],
    });
    expect(
      await handlers.applyAccessoryOperation({
        ...base,
        expectedRevisionId: equipped.revisionId,
        operation: {
          operation: 'unequip',
          partId: 'accessory.head',
          transform: {},
        },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'UNKNOWN_FIELD', path: '$.operation.transform' }],
    });
    expect(revisions.saveCalls).toBe(saveCalls);
    expect(
      canonicalJson(revisions.current.get('adventurer.rustic')!.document),
    ).toBe(before);
  });

  it('replaces, recolors, unequips, and swaps hands without caller-authored transforms', async () => {
    const revisions = new MemoryRevisions();
    const handlers = handlersFor(revisions);
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const replace = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      archetypeId: 'guard',
      operation: {
        operation: 'replace',
        partId: 'shield',
        templateId: 'equipment.shield.kite',
        materialId: 'wood.oak',
      },
    });
    expect(AccessoryOperationSummarySchema.parse(replace.data)).toMatchObject({
      operation: 'replace',
      partId: 'shield',
      equipmentSlot: 'off-hand',
      connectionIds: ['equip-shield'],
    });

    const recolor = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: replace.revisionId,
      archetypeId: 'guard',
      operation: {
        operation: 'recolor',
        partId: 'shield',
        materialId: 'wood.dark',
      },
    });
    expect(AccessoryOperationSummarySchema.parse(recolor.data)).toMatchObject({
      operation: 'recolor',
      partId: 'shield',
      materialId: 'wood.dark',
      affectedIds: ['shield'],
    });

    const unequipShield = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: recolor.revisionId,
      archetypeId: 'guard',
      operation: { operation: 'unequip', partId: 'shield' },
    });
    expect(
      AccessoryOperationSummarySchema.parse(unequipShield.data),
    ).toMatchObject({
      operation: 'unequip',
      partId: 'shield',
      removedIds: ['shield', 'equip-shield'],
    });

    const swap = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: unequipShield.revisionId,
      archetypeId: 'guard',
      operation: {
        operation: 'swapHand',
        partId: 'sword',
        toSlot: 'off-hand',
      },
    });
    expect(AccessoryOperationSummarySchema.parse(swap.data)).toMatchObject({
      operation: 'swapHand',
      partId: 'sword',
      equipmentSlot: 'off-hand',
      affectedIds: ['sword', 'equip-sword'],
    });
    expect(
      revisions.current
        .get('adventurer.rustic')!
        .document.assembly.parts.find(({ id }) => id === 'sword'),
    ).toMatchObject({ id: 'sword', equipmentSlot: 'off-hand' });

    const unequipSword = await handlers.applyAccessoryOperation({
      assetId: 'adventurer.rustic',
      expectedRevisionId: swap.revisionId,
      archetypeId: 'guard',
      operation: { operation: 'unequip', partId: 'sword' },
    });
    expect(
      AccessoryOperationSummarySchema.parse(unequipSword.data),
    ).toMatchObject({
      operation: 'unequip',
      removedIds: ['sword', 'equip-sword'],
    });
  });

  it('rejects missing mount ports and incompatible anatomy without saving', async () => {
    const revisions = new MemoryRevisions();
    const handlers = handlersFor(revisions);
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const current = revisions.current.get('adventurer.rustic')!;
    const invalidDocument = structuredClone(current.document) as AssetDocument;
    const head = invalidDocument.templates.find(
      ({ id }) => id === 'human.head',
    )!;
    head.ports = head.ports.filter(({ id }) => id !== 'equipment.head');
    const invalidRecord = await revisions.save(
      invalidDocument,
      created.revisionId,
    );
    const saveCalls = revisions.saveCalls;
    expect(
      await handlers.applyAccessoryOperation({
        assetId: 'adventurer.rustic',
        expectedRevisionId: invalidRecord.revisionId,
        archetypeId: 'guard',
        operation: {
          operation: 'equip',
          templateId: 'equipment.helmet.iron',
          equipmentSlot: 'head',
        },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_ASSEMBLY', path: '$.operation.equipmentSlot' }],
    });
    expect(revisions.saveCalls).toBe(saveCalls);

    const crate = await handlers.createAsset({ reference: 'crate' });
    const crateSaveCalls = revisions.saveCalls;
    expect(
      await handlers.applyAccessoryOperation({
        assetId: 'crate.rustic',
        expectedRevisionId: crate.revisionId,
        archetypeId: 'guard',
        operation: {
          operation: 'equip',
          templateId: 'equipment.helmet.iron',
          equipmentSlot: 'head',
        },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_ASSEMBLY', path: '$.assetId' }],
    });
    expect(revisions.saveCalls).toBe(crateSaveCalls);
  });

  it('publishes corrected sword and shield orientation guidance', async () => {
    const handlers = handlersFor(new MemoryRevisions());
    const sword = await handlers.inspectTemplate({
      templateId: 'equipment.sword',
    });
    const shield = await handlers.inspectTemplate({
      templateId: 'equipment.shield',
    });
    expect(sword.data).toMatchObject({
      accessory: {
        usage: {
          placements: [
            {
              slot: 'main-hand',
              intendedOrientation: expect.stringMatching(/blade.*down/i),
            },
          ],
          visualChecks: expect.arrayContaining([
            expect.stringMatching(/grip/i),
          ]),
        },
      },
    });
    expect(shield.data).toMatchObject({
      accessory: {
        usage: {
          placements: [
            {
              slot: 'off-hand',
              intendedOrientation: expect.stringMatching(/vertical|upright/i),
            },
          ],
          visualChecks: expect.arrayContaining([
            expect.stringMatching(/face|rim/i),
          ]),
        },
      },
    });
  });
});
