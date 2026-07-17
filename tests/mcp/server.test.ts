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
import {
  createFantasyAssetMcpServer,
  MCP_RESPONSE_BYTE_LIMIT,
} from '../../src/mcp/index.js';
import {
  PUBLIC_TOOL_NAMES,
  type ToolHandlerContext,
} from '../../src/tools/index.js';

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
      createdAt: '2026-07-17T00:00:00.000Z',
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
  if (text === undefined) throw new Error('Expected an MCP text response.');
  return ToolResultEnvelopeSchema.parse(JSON.parse(text));
}

async function connectProtocol(context: ToolHandlerContext) {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const server = createFantasyAssetMcpServer(context);
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

describe('MCP adapter', () => {
  it('advertises and delegates every public semantic tool through protocol transport', async () => {
    const revisions = new MemoryRevisions();
    const { client, server } = await connectProtocol({
      revisions,
      renderService: {
        render: async (_document, revisionId) => ({ revisionId, frames: 8 }),
      },
      exportService: {
        export: async (_document, revisionId) => ({
          revisionId,
          format: 'glb',
        }),
      },
    });
    try {
      const listed = await client.listTools();
      expect(listed.tools.map(({ name }) => name)).toEqual(PUBLIC_TOOL_NAMES);
      expect(listed.tools.map(({ name }) => name).join(' ')).not.toMatch(
        /shell|filesystem|network|blender|raw_mesh/i,
      );

      const called: string[] = [];
      const call = async (
        name: string,
        arguments_: Record<string, unknown>,
      ) => {
        called.push(name);
        const response = await client.callTool({
          name,
          arguments: arguments_,
        });
        const envelope = parseEnvelope(response);
        expect(response.isError, name).not.toBe(true);
        expect(envelope.ok, name).toBe(true);
        return envelope;
      };

      const kits = await call('list_kits', {});
      expect(JSON.stringify(kits.data)).toContain('rustic-human');
      await call('inspect_template', { templateId: 'human.torso' });

      const created = await call('create_asset', { reference: 'adventurer' });
      expect(created.revisionId).toMatch(/^revision\.[a-f0-9]{64}$/);
      await call('inspect_asset', { assetId: 'adventurer.rustic' });

      const reshaped = await call('apply_operations', {
        assetId: 'adventurer.rustic',
        expectedRevisionId: created.revisionId,
        patch: {
          operations: [
            {
              operation: 'setPartShapeParameters',
              partId: 'torso',
              shape: {
                kind: 'beveledBox',
                width: 0.55,
                height: 0.72,
                depth: 0.28,
                bevel: 0.05,
              },
            },
          ],
        },
      });
      expect(reshaped.affectedIds).toEqual(['torso']);
      const comparison = await call('compare_revisions', {
        assetId: 'adventurer.rustic',
        baseRevisionId: created.revisionId,
        targetRevisionId: reshaped.revisionId,
        limit: 100,
      });
      expect(comparison.data).toMatchObject({
        affectedIds: expect.arrayContaining(['torso']),
        preservedIds: expect.arrayContaining(['sword']),
      });
      const originalConnection =
        revisions.current.get('adventurer.rustic')?.document.assembly
          .connections[0];
      if (originalConnection === undefined)
        throw new Error('Expected the adventurer reference connection.');
      const disconnected = await call('apply_operations', {
        assetId: 'adventurer.rustic',
        expectedRevisionId: reshaped.revisionId,
        patch: {
          operations: [
            {
              operation: 'disconnectParts',
              connectionId: originalConnection.id,
            },
          ],
        },
      });
      const connected = await call('connect_parts', {
        assetId: 'adventurer.rustic',
        expectedRevisionId: disconnected.revisionId,
        connection: originalConnection,
      });
      const posed = await call('set_pose', {
        assetId: 'adventurer.rustic',
        expectedRevisionId: connected.revisionId,
        poseId: 'action',
      });
      expect(posed.revisionId).toMatch(/^revision\.[a-f0-9]{64}$/);

      await call('validate_asset', { assetId: 'adventurer.rustic' });
      await call('render_preview', { assetId: 'adventurer.rustic' });
      await call('export_asset', { assetId: 'adventurer.rustic' });

      expect([...new Set(called)].sort()).toEqual(
        [...PUBLIC_TOOL_NAMES].sort(),
      );
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('returns triangle-budget failures through the MCP envelope', async () => {
    const revisions = new MemoryRevisions();
    const { client, server } = await connectProtocol({ revisions });
    try {
      await client.callTool({
        name: 'create_asset',
        arguments: { reference: 'crate' },
      });
      const current = await revisions.getCurrent('crate.rustic');
      await revisions.save(
        { ...current!.document, triangleBudget: 1 },
        current!.revisionId,
      );
      const response = await client.callTool({
        name: 'validate_asset',
        arguments: { assetId: 'crate.rustic' },
      });
      expect(response.isError).toBe(true);
      expect(parseEnvelope(response)).toMatchObject({
        ok: false,
        issues: [
          {
            code: 'TRIANGLE_BUDGET_EXCEEDED',
            path: '$.triangleBudget',
            actual: 132,
            expected: 'at most 1',
          },
        ],
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('enforces protocol input schemas and returns stable domain failures', async () => {
    const revisions = new MemoryRevisions();
    const { client, server } = await connectProtocol({ revisions });
    try {
      const malformed = await client.callTool({
        name: 'list_kits',
        arguments: { unexpected: true },
      });
      expect(malformed.isError).toBe(true);
      expect(JSON.stringify(malformed.content)).toContain('-32602');
      expect(revisions.current.size).toBe(0);

      const missing = await client.callTool({
        name: 'inspect_template',
        arguments: { templateId: 'human.missing' },
      });
      expect(missing.isError).toBe(true);
      expect(parseEnvelope(missing)).toMatchObject({
        ok: false,
        affectedIds: [],
        issues: [{ code: 'NOT_FOUND', path: '$.templateId' }],
      });
      expect(revisions.current.size).toBe(0);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('replaces oversized serialized responses with a bounded error envelope', async () => {
    const revisions = new MemoryRevisions();
    const oversizedPayload = 'x'.repeat(MCP_RESPONSE_BYTE_LIMIT * 2);
    const { client, server } = await connectProtocol({
      revisions,
      renderService: {
        render: async () => ({ preview: oversizedPayload }),
      },
    });
    try {
      const created = await client.callTool({
        name: 'create_asset',
        arguments: { reference: 'crate' },
      });
      expect(parseEnvelope(created).ok).toBe(true);

      const response = await client.callTool({
        name: 'render_preview',
        arguments: { assetId: 'crate.rustic' },
      });
      const envelope = parseEnvelope(response);
      expect(response.isError).toBe(true);
      expect(envelope).toMatchObject({
        ok: false,
        affectedIds: [],
        issues: [
          {
            code: 'RESPONSE_TOO_LARGE',
            path: '$.response',
            expected: { maximumBytes: MCP_RESPONSE_BYTE_LIMIT },
          },
        ],
      });
      const actual = envelope.issues[0]?.actual;
      if (
        typeof actual !== 'object' ||
        actual === null ||
        !('serializedBytes' in actual) ||
        typeof actual.serializedBytes !== 'number'
      )
        throw new Error('Expected the oversized response byte count.');
      expect(actual.serializedBytes).toBeGreaterThan(MCP_RESPONSE_BYTE_LIMIT);
      expect(
        new TextEncoder().encode(JSON.stringify(response)).byteLength,
      ).toBeLessThanOrEqual(MCP_RESPONSE_BYTE_LIMIT);
      expect(JSON.stringify(response)).not.toContain(oversizedPayload);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
