import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import {
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

  async restoreCurrent(
    assetId: string,
    targetRevisionId: string,
    expectedCurrentRevisionId: string,
  ) {
    const current = this.current.get(assetId);
    if (current?.revisionId !== expectedCurrentRevisionId)
      throw new Error('REVISION_CONFLICT');
    const target = this.records.get(`${assetId}:${targetRevisionId}`);
    if (target === undefined) throw new Error('NOT_FOUND');
    this.current.set(assetId, target);
    return target;
  }
}

function envelope(response: unknown): ToolResultEnvelope {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('content' in response) ||
    !Array.isArray(response.content)
  )
    throw new Error('Expected MCP content.');
  const content: unknown[] = response.content;
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

describe('revision-safe novel workflow over MCP', () => {
  it('advertises bounded restoration without adding a public tool and executes compare/dry-run/restore', async () => {
    const revisions = new MemoryRevisions();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({ revisions });
    const client = new Client({ name: 'revision-test', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const call = async (name: string, arguments_: Record<string, unknown>) =>
      envelope(await client.callTool({ name, arguments: arguments_ }));
    try {
      const listed = await client.listTools();
      expect(listed.tools).toHaveLength(16);
      const applySchema = JSON.stringify(
        listed.tools.find(({ name }) => name === 'apply_operations')
          ?.inputSchema,
      );
      expect(applySchema).toContain('restore');
      expect(applySchema).toContain('confirmedPlanId');

      const created = await call('create_asset', {
        identity: {
          assetId: 'barrel.mcp-revision',
          name: 'MCP Revision Barrel',
          kitId: 'rustic-human',
          family: 'standalone-prop',
          archetypeId: 'prop.banded-container.rustic',
          seed: 9_001,
        },
      });
      let currentRevisionId = created.revisionId!;
      for (const parentPortId of ['band.low', 'band.high']) {
        const partId = parentPortId;
        const composed = await call('apply_operations', {
          assetId: 'barrel.mcp-revision',
          expectedRevisionId: currentRevisionId,
          composition: {
            operation: 'add_part',
            partId,
            templateId: 'prop.crate-band',
            role: 'prop.reinforcement',
            attachment: {
              connectionId: `connection.${partId}`,
              parentPartId: 'container.body',
              parentPortId,
              childPortId: 'crate.attach',
            },
          },
        });
        expect(composed.ok).toBe(true);
        currentRevisionId = composed.revisionId!;
      }
      const completeRevisionId = currentRevisionId;
      const changed = await call('apply_operations', {
        assetId: 'barrel.mcp-revision',
        expectedRevisionId: completeRevisionId,
        patch: {
          operations: [
            {
              operation: 'setMaterialBinding',
              partId: 'band.low',
              slot: 'metal',
              materialId: 'iron.blued',
            },
          ],
        },
      });
      const compared = await call('compare_revisions', {
        assetId: 'barrel.mcp-revision',
        baseRevisionId: completeRevisionId,
        targetRevisionId: changed.revisionId,
        limit: 100,
      });
      const comparison = SemanticRevisionComparisonSchema.parse(compared.data);
      expect(comparison).toMatchObject({
        affectedIds: ['band.low'],
        baseState: { origin: 'novel', completeness: { state: 'complete' } },
        targetState: { origin: 'novel', completeness: { state: 'complete' } },
        requiredRoleChanges: [],
      });

      const preview = await call('apply_operations', {
        assetId: 'barrel.mcp-revision',
        expectedRevisionId: changed.revisionId,
        restore: { revisionId: completeRevisionId },
        dryRun: true,
      });
      const planId = (preview.data as { revisionPlan: { planId: string } })
        .revisionPlan.planId;
      const restored = await call('apply_operations', {
        assetId: 'barrel.mcp-revision',
        expectedRevisionId: changed.revisionId,
        restore: { revisionId: completeRevisionId },
        confirmedPlanId: planId,
      });
      expect(restored).toMatchObject({
        ok: true,
        revisionId: completeRevisionId,
        affectedIds: ['band.low'],
      });
      expect(
        await revisions.get('barrel.mcp-revision', changed.revisionId!),
      ).toBeDefined();
    } finally {
      await client.close();
      await server.close();
    }
  });
});
