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

  async save(document: Readonly<AssetDocument>): Promise<RevisionRecord> {
    const prior = this.current.get(document.id);
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
  if (text === undefined) throw new Error('Expected MCP text content.');
  const parsedJson: unknown = JSON.parse(text);
  return ToolResultEnvelopeSchema.parse(parsedJson);
}

describe('novel identity public MCP boundary', () => {
  it('advertises and executes bounded identity initialization without a hidden tool', async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({
      revisions: new MemoryRevisions(),
    });
    const client = new Client({ name: 'novel-test', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    try {
      const listed = await client.listTools();
      expect(listed.tools.map(({ name }) => name)).toHaveLength(16);
      const create = listed.tools.find(({ name }) => name === 'create_asset');
      expect(JSON.stringify(create?.inputSchema)).toContain('identity');

      const created = envelope(
        await client.callTool({
          name: 'create_asset',
          arguments: {
            identity: {
              assetId: 'barrel.ironbound',
              name: 'Ironbound Barrel',
              kitId: 'rustic-human',
              family: 'standalone-prop',
              archetypeId: 'prop.banded-container.rustic',
              seed: 101,
            },
          },
        }),
      );
      expect(created).toMatchObject({
        ok: true,
        data: {
          validation: 'incomplete',
          completeness: { state: 'incomplete' },
        },
      });

      const inspected = envelope(
        await client.callTool({
          name: 'inspect_asset',
          arguments: { assetId: 'barrel.ironbound' },
        }),
      );
      expect(inspected).toMatchObject({
        ok: true,
        revisionId: created.revisionId,
        data: {
          origin: {
            kind: 'novel',
            archetypeId: 'prop.banded-container.rustic',
          },
          completeness: { state: 'incomplete' },
        },
      });

      expect(
        envelope(
          await client.callTool({
            name: 'create_asset',
            arguments: { reference: 'tree' },
          }),
        ),
      ).toMatchObject({ ok: true, data: { assetId: 'tree.rustic' } });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
