import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import type { AssetDocument } from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import { createFantasyAssetMcpServer } from '../../src/mcp/index.js';
import { PUBLIC_TOOL_NAMES } from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly current = new Map<string, RevisionRecord>();
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
      createdAt: '2026-07-17T00:00:00.000Z',
      document,
    };
    this.current.set(document.id, record);
    return record;
  }
  async get(
    assetId: string,
    revisionId: string,
  ): Promise<RevisionRecord | undefined> {
    const found = this.current.get(assetId);
    return found?.revisionId === revisionId ? found : undefined;
  }
  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    return this.current.get(assetId);
  }
}

describe('MCP adapter', () => {
  it('advertises exactly the semantic catalog and delegates through protocol transport', async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createFantasyAssetMcpServer({
      revisions: new MemoryRevisions(),
    });
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const listed = await client.listTools();
    expect(listed.tools.map(({ name }) => name)).toEqual(PUBLIC_TOOL_NAMES);
    expect(listed.tools.map(({ name }) => name).join(' ')).not.toMatch(
      /shell|filesystem|network|blender|raw_mesh/i,
    );
    const response = await client.callTool({
      name: 'list_kits',
      arguments: {},
    });
    expect(response.isError).not.toBe(true);
    expect(JSON.stringify(response.content)).toContain('rustic-human');
    await client.close();
    await server.close();
  });
});
