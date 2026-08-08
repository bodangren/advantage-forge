import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  AssetInspectionDataSchema,
  CapabilityReportSchema,
  NovelAssetArchetypeSchema,
  NovelAssetCompletenessSchema,
  type AssetDocument,
} from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
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
    const record: RevisionRecord = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-22T00:00:00.000Z',
      document,
    };
    this.current.set(document.id, record);
    this.records.set(`${document.id}:${record.revisionId}`, record);
    return record;
  }

  async get(
    assetId: string,
    revisionId: string,
  ): Promise<RevisionRecord | undefined> {
    return this.records.get(`${assetId}:${revisionId}`);
  }

  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    return this.current.get(assetId);
  }
}

const guardRequest = {
  identity: {
    assetId: 'guard.moonwatch',
    name: 'Moonwatch Guard',
    kitId: 'rustic-human',
    family: 'humanoid',
    archetypeId: 'humanoid.biped.rustic',
    seed: 4_096,
  },
};

const barrelRequest = {
  identity: {
    assetId: 'barrel.ironbound',
    name: 'Ironbound Barrel',
    kitId: 'rustic-human',
    family: 'standalone-prop',
    archetypeId: 'prop.banded-container.rustic',
    seed: 101,
  },
};

const ListKitsDataSchema = z.object({
  kits: z.array(
    z.object({
      id: z.string(),
      archetypes: z.array(NovelAssetArchetypeSchema),
    }),
  ),
});
const CreationDataSchema = z.object({
  validation: z.literal('incomplete'),
  completeness: NovelAssetCompletenessSchema,
});

describe('bounded novel identity handlers', () => {
  it('discovers supported initialization separately from partial full authoring', async () => {
    const handlers = createToolHandlers({ revisions: new MemoryRevisions() });
    const report = CapabilityReportSchema.parse(
      (await handlers.inspectCapabilities({})).data,
    );
    const statuses = new Map(
      report.facts.map(({ id, status }) => [id, status]),
    );

    expect(statuses.get('asset.identity.initialize')).toBe('supported');
    expect(statuses.get('asset.new_identity')).toBe('partial');
    const listed = await handlers.listKits({});
    expect(listed.ok).toBe(true);
    const kitData = ListKitsDataSchema.parse(listed.data);
    expect(kitData.kits[0]?.id).toBe('rustic-human');
    expect(kitData.kits[0]?.archetypes.map(({ id }) => id)).toEqual([
      'humanoid.biped.rustic',
      'prop.banded-container.rustic',
    ]);
  });

  it.each([
    [guardRequest, 'anatomy.head'],
    [barrelRequest, 'prop.reinforcement'],
  ] as const)(
    'initializes deterministic incomplete identities without cloning a reference',
    async (request, missingRole) => {
      const firstRevisions = new MemoryRevisions();
      const secondRevisions = new MemoryRevisions();
      const first = createToolHandlers({ revisions: firstRevisions });
      const second = createToolHandlers({ revisions: secondRevisions });

      const firstResult = await first.createAsset(request);
      const secondResult = await second.createAsset(request);
      expect(firstResult).toMatchObject({
        ok: true,
        revisionId: secondResult.revisionId,
        data: {
          validation: 'incomplete',
          completeness: {
            state: 'incomplete',
          },
        },
      });
      const creation = CreationDataSchema.parse(firstResult.data);
      expect(
        creation.completeness.missingRequirements.map(({ role }) => role),
      ).toContain(missingRole);

      const assetId = request.identity.assetId;
      const firstStored = await firstRevisions.getCurrent(assetId);
      const secondStored = await secondRevisions.getCurrent(assetId);
      expect(firstStored?.document).toEqual(secondStored?.document);
      expect(firstStored?.document.id).toBe(assetId);
      expect(firstStored?.document.novelIdentity).toMatchObject({
        origin: 'novel',
        family: request.identity.family,
        archetypeId: request.identity.archetypeId,
        styleProfile: { id: 'cute_chibi_v1' },
      });
      expect(firstStored?.document.id).not.toMatch(/adventurer|crate\.rustic/);
    },
  );

  it('exposes origin, completeness, and lineage through bounded inspection', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset(guardRequest);
    const inspected = await handlers.inspectAsset({
      assetId: guardRequest.identity.assetId,
    });

    expect(inspected).toMatchObject({
      ok: true,
      revisionId: created.revisionId,
      data: {
        origin: {
          kind: 'novel',
          archetypeId: 'humanoid.biped.rustic',
        },
        lineage: { currentRevisionId: created.revisionId },
        completeness: {
          state: 'incomplete',
        },
      },
    });
    const inspection = AssetInspectionDataSchema.parse(inspected.data);
    expect(inspection.completeness?.missingRequirements.length).toBeGreaterThan(
      0,
    );
  });

  it('blocks validation, export, and publication for incomplete identities', async () => {
    const exportAsset = vi.fn(async () => ({ format: 'glb' }));
    const getManifest = vi.fn(async () => ({}));
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({
      revisions,
      exportService: { export: exportAsset },
      interchangeService: {
        getManifest,
        getArtifactChunk: async () => ({}),
      },
    });
    const created = await handlers.createAsset(barrelRequest);
    const assetId = barrelRequest.identity.assetId;

    for (const result of [
      await handlers.validateAsset({ assetId }),
      await handlers.exportAsset({ assetId, revisionId: created.revisionId }),
      await handlers.getInterchangeManifest({
        asset_id: assetId,
        revision_id: created.revisionId,
      }),
    ])
      expect(result).toMatchObject({
        ok: false,
        issues: [{ code: 'INCOMPLETE_ASSET' }],
      });
    expect(exportAsset).not.toHaveBeenCalled();
    expect(getManifest).not.toHaveBeenCalled();
  });

  it('rejects duplicate, reserved, malformed, and conflicting requests without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    expect((await handlers.createAsset(guardRequest)).ok).toBe(true);

    expect(await handlers.createAsset(guardRequest)).toMatchObject({
      ok: false,
      issues: [{ code: 'ALREADY_EXISTS', path: '$.identity.assetId' }],
    });
    expect(
      await handlers.createAsset({
        identity: { ...guardRequest.identity, assetId: 'adventurer.rustic' },
      }),
    ).toMatchObject({ ok: false, issues: [{ code: 'INVALID_VALUE' }] });
    expect(
      await handlers.createAsset({
        identity: { ...guardRequest.identity, assetId: '../guard' },
      }),
    ).toMatchObject({ ok: false, issues: [{ code: 'INVALID_VALUE' }] });
    expect(
      await handlers.createAsset({
        identity: {
          ...guardRequest.identity,
          family: 'standalone-prop',
          archetypeId: 'humanoid.biped.rustic',
        },
      }),
    ).toMatchObject({ ok: false, issues: [{ code: 'INVALID_VALUE' }] });
    expect(
      await revisions.getCurrent(guardRequest.identity.assetId),
    ).toBeDefined();
    expect(revisions.current).toHaveLength(1);
  });

  it('preserves fixed reference creation and requires heroic provenance review', async () => {
    const handlers = createToolHandlers({ revisions: new MemoryRevisions() });
    expect(await handlers.createAsset({ reference: 'crate' })).toMatchObject({
      ok: true,
      data: { assetId: 'crate.rustic', validation: 'valid' },
    });
    expect(
      await handlers.createAsset({
        identity: {
          ...guardRequest.identity,
          assetId: 'guard.heroic',
          styleProfile: {
            id: 'heroic_stylized_v1',
            version: '1.0.0',
            review: { status: 'not_required' },
          },
        },
      }),
    ).toMatchObject({ ok: false, issues: [{ code: 'INVALID_VALUE' }] });
  });
});
