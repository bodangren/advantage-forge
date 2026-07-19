import { describe, expect, it } from 'vitest';

import {
  AccessoryDiscoveryDataSchema,
  AccessoryOperationSummarySchema,
  AssetInspectionDataSchema,
  type AssetDocument,
} from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import { rusticAccessoryLoadouts } from '../../src/fantasy-kit/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly current = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();

  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
  ): Promise<RevisionRecord> {
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

const ASSET_ID = 'adventurer.rustic';

function requireSuccess(
  context: string,
  result: Awaited<
    ReturnType<ReturnType<typeof createToolHandlers>['applyAccessoryOperation']>
  >,
): void {
  if (!result.ok)
    throw new Error(`${context}: ${JSON.stringify(result.issues)}`);
}

describe('reference accessory loadout public workflows', () => {
  it.each(rusticAccessoryLoadouts)(
    'assembles the $id loadout from response-derived public operations',
    async (loadout) => {
      const revisions = new MemoryRevisions();
      const handlers = createToolHandlers({ revisions });
      const created = await handlers.createAsset({
        reference: loadout.baseReference,
      });
      expect(created).toMatchObject({ ok: true });
      let revisionId = created.revisionId!;

      // Discover the baseline hand-slot owners instead of relying on private
      // document knowledge, then clear each through the public workflow.
      const occupiedPartIds = new Set<string>();
      for (const equipmentSlot of ['main-hand', 'off-hand'] as const) {
        const result = await handlers.searchAccessories({
          assetId: ASSET_ID,
          archetypeId: 'adventurer',
          query: { slots: [equipmentSlot], offset: 0, limit: 50 },
        });
        expect(result).toMatchObject({ ok: true, revisionId });
        const discovery = AccessoryDiscoveryDataSchema.parse(result.data);
        const occupiedByPartId = discovery.items.find(
          (item) => item.compatibility.occupiedByPartId !== undefined,
        )?.compatibility.occupiedByPartId;
        expect(occupiedByPartId).toBeDefined();
        occupiedPartIds.add(occupiedByPartId!);
      }

      for (const partId of occupiedPartIds) {
        const operation = { operation: 'unequip' as const, partId };
        const preview = await handlers.applyAccessoryOperation({
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: 'adventurer',
          operation,
          dryRun: true,
        });
        requireSuccess(`clear ${partId} dry run`, preview);
        expect(preview).toMatchObject({ ok: true, revisionId });
        const previewSummary = AccessoryOperationSummarySchema.parse(
          preview.data,
        );
        const applied = await handlers.applyAccessoryOperation({
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: 'adventurer',
          operation,
          dryRun: false,
        });
        requireSuccess(`clear ${partId} apply`, applied);
        expect(applied).toMatchObject({ ok: true });
        expect(AccessoryOperationSummarySchema.parse(applied.data)).toEqual({
          ...previewSummary,
          dryRun: false,
        });
        revisionId = applied.revisionId!;
      }

      for (const accessory of loadout.accessories) {
        const result = await handlers.searchAccessories({
          assetId: ASSET_ID,
          archetypeId: loadout.archetypeId,
          query: {
            slots: [accessory.equipmentSlot],
            offset: 0,
            limit: 50,
          },
        });
        expect(result).toMatchObject({ ok: true, revisionId });
        const discovery = AccessoryDiscoveryDataSchema.parse(result.data);
        const candidate = discovery.items.find(
          ({ templateId }) => templateId === accessory.templateId,
        );
        expect(candidate).toBeDefined();
        expect(candidate).toMatchObject({
          defaultMaterialId: accessory.materialId,
          compatibility: { eligible: true, replacementRequired: false },
          exampleOperation: {
            operation: 'equip',
            templateId: accessory.templateId,
            equipmentSlot: accessory.equipmentSlot,
            materialId: accessory.materialId,
          },
        });

        const inspectedTemplate = await handlers.inspectTemplate({
          templateId: candidate!.templateId,
        });
        expect(inspectedTemplate).toMatchObject({ ok: true });

        const operation = candidate!.exampleOperation;
        const preview = await handlers.applyAccessoryOperation({
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: loadout.archetypeId,
          operation,
          dryRun: true,
        });
        requireSuccess(
          `${loadout.id}/${accessory.templateId} dry run`,
          preview,
        );
        expect(preview).toMatchObject({ ok: true, revisionId });
        const previewSummary = AccessoryOperationSummarySchema.parse(
          preview.data,
        );
        expect(previewSummary).toMatchObject({
          dryRun: true,
          partId: accessory.partId,
          templateId: accessory.templateId,
          equipmentSlot: accessory.equipmentSlot,
          materialId: accessory.materialId,
        });

        const applied = await handlers.applyAccessoryOperation({
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: loadout.archetypeId,
          operation,
          dryRun: false,
        });
        requireSuccess(`${loadout.id}/${accessory.templateId} apply`, applied);
        expect(applied).toMatchObject({ ok: true });
        expect(AccessoryOperationSummarySchema.parse(applied.data)).toEqual({
          ...previewSummary,
          dryRun: false,
        });
        revisionId = applied.revisionId!;
      }

      const idleInspection = await handlers.inspectAsset({
        assetId: ASSET_ID,
        section: 'parts',
        offset: 0,
        limit: 100,
      });
      expect(idleInspection).toMatchObject({ ok: true, revisionId });
      const idleParts = AssetInspectionDataSchema.parse(
        idleInspection.data,
      ).items!.filter(
        (item) =>
          'templateId' in item &&
          loadout.accessories.some(({ partId }) => partId === item.id),
      );
      expect(
        idleParts.map((part) => ({
          id: part.id,
          templateId: 'templateId' in part ? part.templateId : undefined,
        })),
      ).toEqual(
        loadout.accessories.map((accessory) => ({
          id: accessory.partId,
          templateId: accessory.templateId,
        })),
      );

      const posed = await handlers.setPose({
        assetId: ASSET_ID,
        expectedRevisionId: revisionId,
        poseId: 'action',
      });
      expect(posed).toMatchObject({ ok: true });
      revisionId = posed.revisionId!;
      const actionInspection = await handlers.inspectAsset({
        assetId: ASSET_ID,
        section: 'parts',
        offset: 0,
        limit: 100,
      });
      const actionParts = AssetInspectionDataSchema.parse(
        actionInspection.data,
      ).items!.filter(
        (item) =>
          'templateId' in item &&
          loadout.accessories.some(({ partId }) => partId === item.id),
      );
      expect(
        actionParts.map((part) => ({
          id: part.id,
          transform: 'base' in part ? part.base.transform : undefined,
        })),
      ).toEqual(
        idleParts.map((part) => ({
          id: part.id,
          transform: 'base' in part ? part.base.transform : undefined,
        })),
      );

      // An unequipped comparison is a real immutable revision, not the legacy
      // sword/shield-only visual variant.
      for (const part of actionParts) {
        const removed = await handlers.applyAccessoryOperation({
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: loadout.archetypeId,
          operation: { operation: 'unequip', partId: part.id },
        });
        expect(removed).toMatchObject({ ok: true });
        revisionId = removed.revisionId!;
      }
      const unequipped = await handlers.inspectAsset({
        assetId: ASSET_ID,
        section: 'parts',
        offset: 0,
        limit: 100,
      });
      const remainingIds = AssetInspectionDataSchema.parse(
        unequipped.data,
      ).items!.map(({ id }) => id);
      expect(remainingIds).not.toEqual(
        expect.arrayContaining(loadout.accessories.map(({ partId }) => partId)),
      );
    },
  );
});
