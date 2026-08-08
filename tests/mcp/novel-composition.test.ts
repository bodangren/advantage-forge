import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import {
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
  const parsedJson: unknown = JSON.parse(text);
  return ToolResultEnvelopeSchema.parse(parsedJson);
}

describe('novel composition public MCP grammar', () => {
  it('advertises task-level composition without adding a hidden tool', async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({
      revisions: new MemoryRevisions(),
    });
    const client = new Client({ name: 'composition-test', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    try {
      const listed = await client.listTools();
      expect(listed.tools).toHaveLength(16);
      const apply = listed.tools.find(
        ({ name }) => name === 'apply_operations',
      );
      const kits = listed.tools.find(({ name }) => name === 'list_kits');
      expect(JSON.stringify(apply?.inputSchema)).toContain('composition');
      expect(JSON.stringify(kits?.inputSchema)).toContain('brief');

      const created = envelope(
        await client.callTool({
          name: 'create_asset',
          arguments: {
            identity: {
              assetId: 'barrel.mcp',
              name: 'MCP Barrel',
              kitId: 'rustic-human',
              family: 'standalone-prop',
              archetypeId: 'prop.banded-container.rustic',
              seed: 101,
            },
          },
        }),
      );
      const composed = envelope(
        await client.callTool({
          name: 'apply_operations',
          arguments: {
            assetId: 'barrel.mcp',
            expectedRevisionId: created.revisionId,
            dryRun: true,
            composition: {
              operation: 'add_part',
              partId: 'band.low',
              templateId: 'prop.crate-band',
              role: 'prop.reinforcement',
              attachment: {
                connectionId: 'connection.band.low',
                parentPartId: 'container.body',
                parentPortId: 'band.low',
                childPortId: 'crate.attach',
              },
            },
          },
        }),
      );
      expect(composed).toMatchObject({
        ok: true,
        revisionId: created.revisionId,
        data: {
          dryRun: true,
          compiledPatch: {
            operations: [
              { operation: 'addPart' },
              { operation: 'connectParts' },
            ],
          },
        },
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
