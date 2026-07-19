import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import {
  AccessoryDiscoveryDataSchema,
  AccessoryOperationSummarySchema,
  AssetInspectionDataSchema,
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

function parseEnvelope(response: unknown): ToolResultEnvelope {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('content' in response) ||
    !Array.isArray(response.content)
  )
    throw new Error('Expected an MCP content array.');
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
  if (text === undefined) throw new Error('Expected MCP text content.');
  return ToolResultEnvelopeSchema.parse(JSON.parse(text));
}

describe('MCP accessory workflow', () => {
  it('discovers, inspects, previews, applies, and verifies without source-derived transforms', async () => {
    const revisions = new MemoryRevisions();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({ revisions });
    const client = new Client({ name: 'accessory-test', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const call = async (name: string, arguments_: Record<string, unknown>) => {
      const response = await client.callTool({ name, arguments: arguments_ });
      const envelope = parseEnvelope(response);
      expect(response.isError, name).not.toBe(true);
      expect(envelope.ok, name).toBe(true);
      return envelope;
    };

    try {
      const listed = await client.listTools();
      expect(listed.tools.map(({ name }) => name)).toEqual(
        expect.arrayContaining([
          'search_accessories',
          'apply_accessory_operation',
        ]),
      );
      const created = await call('create_asset', { reference: 'adventurer' });
      const saveCalls = revisions.saveCalls;
      const discovered = await call('search_accessories', {
        assetId: 'adventurer.rustic',
        archetypeId: 'guard',
        query: { roles: ['headwear'], slots: ['head'], limit: 10 },
      });
      const discovery = AccessoryDiscoveryDataSchema.parse(discovered.data);
      expect(discovery.items).toHaveLength(1);
      const candidate = discovery.items[0]!;

      const inspectedTemplate = await call('inspect_template', {
        templateId: candidate.templateId,
      });
      expect(inspectedTemplate.data).toMatchObject({
        accessory: {
          usage: candidate.usage,
          defaultMaterialId: candidate.defaultMaterialId,
        },
      });

      const request = {
        assetId: 'adventurer.rustic',
        expectedRevisionId: created.revisionId,
        archetypeId: 'guard',
        operation: candidate.exampleOperation,
      };
      const preview = await call('apply_accessory_operation', {
        ...request,
        dryRun: true,
      });
      const previewData = AccessoryOperationSummarySchema.parse(preview.data);
      expect(preview.revisionId).toBe(created.revisionId);
      expect(revisions.saveCalls).toBe(saveCalls);

      const applied = await call('apply_accessory_operation', {
        ...request,
        dryRun: false,
      });
      expect(applied.revisionId).not.toBe(created.revisionId);
      expect(revisions.saveCalls).toBe(saveCalls + 1);
      expect(AccessoryOperationSummarySchema.parse(applied.data)).toMatchObject(
        {
          ...previewData,
          dryRun: false,
        },
      );

      const inspectedAsset = await call('inspect_asset', {
        assetId: 'adventurer.rustic',
        section: 'parts',
        limit: 100,
      });
      const asset = AssetInspectionDataSchema.parse(inspectedAsset.data);
      expect(asset.items).toContainEqual(
        expect.objectContaining({
          id: previewData.partId,
          templateId: candidate.templateId,
          equipmentSlot: 'head',
        }),
      );

      const savesBeforeInvalid = revisions.saveCalls;
      const invalid = await client.callTool({
        name: 'apply_accessory_operation',
        arguments: {
          assetId: 'adventurer.rustic',
          expectedRevisionId: applied.revisionId,
          archetypeId: 'guard',
          operation: {
            operation: 'unequip',
            partId: previewData.partId,
            transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0, 1],
              scale: [1, 1, 1],
            },
          },
        },
      });
      expect(invalid.isError).toBe(true);
      expect(JSON.stringify(invalid.content)).toContain('-32602');
      expect(revisions.saveCalls).toBe(savesBeforeInvalid);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
