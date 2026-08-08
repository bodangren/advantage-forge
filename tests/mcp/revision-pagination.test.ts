import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import {
  AssetDocumentSchema,
  SemanticRevisionComparisonSchema,
  ToolResultEnvelopeSchema,
  type AssetDocument,
  type ToolResultEnvelope,
} from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import { createFantasyAssetMcpServer } from '../../src/mcp/index.js';
import { createToolHandlers } from '../../src/tools/index.js';
import { assetFixture } from '../document/fixture.js';

class MemoryRevisions implements RevisionRepository {
  readonly current = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();

  async save(document: Readonly<AssetDocument>, expected?: string) {
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

  async get(assetId: string, revisionId: string) {
    return this.records.get(`${assetId}:${revisionId}`);
  }

  async getCurrent(assetId: string) {
    return this.current.get(assetId);
  }

  async restoreCurrent(assetId: string, revisionId: string, expected: string) {
    const prior = this.current.get(assetId);
    if (prior?.revisionId !== expected) throw new Error('REVISION_CONFLICT');
    const target = this.records.get(`${assetId}:${revisionId}`);
    if (target === undefined) throw new Error('REVISION_NOT_FOUND');
    this.current.set(assetId, target);
    return target;
  }
}

function maxTemplateDocument(): AssetDocument {
  const document = assetFixture();
  const prototype = document.templates[0];
  if (prototype === undefined) throw new Error('Missing template fixture.');
  const additions = Array.from(
    { length: 2_000 - document.templates.length },
    (_, index) => ({
      ...prototype,
      id: `bulk.template.${String(index).padStart(4, '0')}`,
    }),
  );
  return AssetDocumentSchema.parse({
    ...document,
    templates: [...document.templates, ...additions],
  });
}

function envelope(response: unknown): ToolResultEnvelope {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('content' in response) ||
    !Array.isArray(response.content)
  )
    throw new Error('Expected MCP content.');
  const content = response.content as unknown[];
  const text = content.find(
    (part): part is { type: 'text'; text: string } =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text' &&
      'text' in part &&
      typeof part.text === 'string',
  )?.text;
  if (text === undefined) throw new Error('Expected MCP text.');
  return ToolResultEnvelopeSchema.parse(JSON.parse(text));
}

describe('bounded revision ID pagination over MCP', () => {
  it('refuses a max-valid oversized restoration before changing the current pointer', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({
      identity: {
        assetId: 'barrel.restore-preflight',
        name: 'Restore Preflight Barrel',
        kitId: 'rustic-human',
        family: 'standalone-prop',
        archetypeId: 'prop.banded-container.rustic',
        seed: 8_801,
      },
    });
    expect(created.ok).toBe(true);
    let expectedRevisionId = created.revisionId!;
    for (const partId of ['band.low', 'band.high'] as const) {
      const completed = await handlers.applyOperations({
        assetId: 'barrel.restore-preflight',
        expectedRevisionId,
        composition: {
          operation: 'add_part',
          partId,
          templateId: 'prop.crate-band',
          role: 'prop.reinforcement',
          attachment: {
            connectionId: `connection.${partId}`,
            parentPartId: 'container.body',
            parentPortId: partId,
            childPortId: 'crate.attach',
          },
        },
      });
      expect(completed.ok).toBe(true);
      expectedRevisionId = completed.revisionId!;
    }
    const target = await revisions.getCurrent('barrel.restore-preflight');
    if (target === undefined) throw new Error('Missing created revision.');
    const prototype = target.document.assembly.parts[0];
    if (prototype === undefined) throw new Error('Missing created part.');
    const currentDocument = AssetDocumentSchema.parse({
      ...target.document,
      assembly: {
        ...target.document.assembly,
        parts: [
          ...target.document.assembly.parts,
          ...Array.from(
            { length: 2_000 - target.document.assembly.parts.length },
            (_, index) => ({
              ...prototype,
              id: `unattached.${String(index).padStart(4, '0')}.${'x'.repeat(130)}`,
            }),
          ),
        ],
      },
    });
    const current = await revisions.save(currentDocument, target.revisionId);
    const restoreRequest = {
      assetId: target.assetId,
      expectedRevisionId: current.revisionId,
      restore: { revisionId: target.revisionId },
    };
    const preview = await handlers.applyOperations({
      ...restoreRequest,
      dryRun: true,
    });
    if (!preview.ok) throw new Error(JSON.stringify(preview));
    const planId = (preview.data as { revisionPlan: { planId: string } })
      .revisionPlan.planId;

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({ revisions });
    const client = new Client({ name: 'restore-preflight', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    try {
      const response = await client.callTool({
        name: 'apply_operations',
        arguments: { ...restoreRequest, confirmedPlanId: planId },
      });
      const refused = envelope(response);
      expect(refused).toMatchObject({
        ok: false,
        issues: [{ code: 'RESPONSE_TOO_LARGE' }],
      });
      expect(response.isError).toBe(true);
      expect(JSON.stringify(response).length).toBeLessThan(64 * 1_024);
      expect((await revisions.getCurrent(target.assetId))?.revisionId).toBe(
        current.revisionId,
      );
    } finally {
      await client.close();
      await server.close();
    }
  }, 20_000);

  it('requires a compact confirmed plan before one max-valid nested pose operation can write', async () => {
    const revisions = new MemoryRevisions();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({ revisions });
    const client = new Client({ name: 'broad-pose-test', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    try {
      const created = envelope(
        await client.callTool({
          name: 'create_asset',
          arguments: {
            identity: {
              assetId: 'barrel.broad-pose',
              name: 'Broad Pose Barrel',
              kitId: 'rustic-human',
              family: 'standalone-prop',
              archetypeId: 'prop.banded-container.rustic',
              seed: 8_800,
            },
          },
        }),
      );
      const pose = {
        id: 'pose.maximum',
        overrides: Array.from({ length: 2_000 }, () => ({
          partId: 'container.body',
          transform: {
            position: [0, 0.38, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
        })),
      };
      const request = {
        assetId: 'barrel.broad-pose',
        expectedRevisionId: created.revisionId,
        patch: { operations: [{ operation: 'upsertPose', pose }] },
      };
      const unplanned = envelope(
        await client.callTool({ name: 'apply_operations', arguments: request }),
      );
      expect(unplanned).toMatchObject({
        ok: false,
        issues: [{ code: 'DRY_RUN_REQUIRED' }],
      });
      expect(
        (await revisions.getCurrent('barrel.broad-pose'))?.revisionId,
      ).toBe(created.revisionId);

      const previewResponse = await client.callTool({
        name: 'apply_operations',
        arguments: { ...request, dryRun: true },
      });
      const preview = envelope(previewResponse);
      expect(preview.ok).toBe(true);
      expect(JSON.stringify(previewResponse).length).toBeLessThan(64 * 1_024);
      const plan = (
        preview.data as {
          revisionPlan: {
            planId: string;
            broadOrDestructive: boolean;
            changes: Array<Record<string, unknown>>;
          };
        }
      ).revisionPlan;
      expect(plan.broadOrDestructive).toBe(true);
      expect(plan.changes).toEqual([
        {
          path: '$.poses[pose.maximum]',
          kind: 'added',
          semanticId: 'pose.maximum',
        },
      ]);

      const appliedResponse = await client.callTool({
        name: 'apply_operations',
        arguments: { ...request, confirmedPlanId: plan.planId },
      });
      const applied = envelope(appliedResponse);
      expect(applied.ok).toBe(true);
      expect(applied.revisionId).not.toBe(created.revisionId);
      expect(JSON.stringify(appliedResponse).length).toBeLessThan(64 * 1_024);
      expect(
        (await revisions.getCurrent('barrel.broad-pose'))?.revisionId,
      ).toBe(applied.revisionId);
    } finally {
      await client.close();
      await server.close();
    }
  }, 20_000);

  it('returns a bounded auditable mutation and complete deterministic comparison pages for a max-valid document', async () => {
    const revisions = new MemoryRevisions();
    const base = await revisions.save(maxTemplateDocument());
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({ revisions });
    const client = new Client({ name: 'pagination-test', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    try {
      const appliedResponse = await client.callTool({
        name: 'apply_operations',
        arguments: {
          assetId: base.assetId,
          expectedRevisionId: base.revisionId,
          idOffset: 0,
          idLimit: 100,
          patch: {
            operations: [
              {
                operation: 'setPartVisibility',
                partId: 'part.head',
                visible: false,
              },
            ],
          },
        },
      });
      const applied = envelope(appliedResponse);
      expect(appliedResponse.isError).not.toBe(true);
      expect(applied.ok).toBe(true);
      expect(applied.revisionId).not.toBe(base.revisionId);
      expect(JSON.stringify(appliedResponse).length).toBeLessThan(64 * 1_024);
      expect(applied.data).toMatchObject({
        revisionPlan: {
          preservedIdsPage: {
            total: 2_004,
            offset: 0,
            limit: 100,
            truncated: true,
            nextOffset: 100,
          },
        },
      });
      expect((await revisions.getCurrent(base.assetId))?.revisionId).toBe(
        applied.revisionId,
      );

      const compareResponse = await client.callTool({
        name: 'compare_revisions',
        arguments: {
          assetId: base.assetId,
          baseRevisionId: base.revisionId,
          targetRevisionId: applied.revisionId,
          idOffset: 100,
          idLimit: 100,
          limit: 100,
        },
      });
      const compared = envelope(compareResponse);
      expect(compareResponse.isError).not.toBe(true);
      const comparison = SemanticRevisionComparisonSchema.parse(compared.data);
      expect(comparison.affectedIds).toEqual([]);
      expect(comparison.preservedIds).toHaveLength(100);
      expect(comparison.preservedIdsPage).toMatchObject({
        total: 2_004,
        offset: 100,
        limit: 100,
        truncated: true,
        nextOffset: 200,
      });
      expect(JSON.stringify(compareResponse).length).toBeLessThan(64 * 1_024);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
