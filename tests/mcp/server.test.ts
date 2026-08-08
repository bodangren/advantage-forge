import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { REFERENCE_FIVE_CLIP_ANIMATION_REQUEST } from '../../scripts/replay-public-mcp-reference-five-clip.js';
import {
  AccessoryDiscoveryDataSchema,
  CapabilityReportSchema,
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
      const callFailure = async (
        name: string,
        arguments_: Record<string, unknown>,
      ) => {
        called.push(name);
        const response = await client.callTool({ name, arguments: arguments_ });
        const envelope = parseEnvelope(response);
        expect(response.isError, name).toBe(true);
        expect(envelope.ok, name).toBe(false);
        return envelope;
      };

      const kits = await call('list_kits', {});
      expect(JSON.stringify(kits.data)).toContain('rustic-human');
      const capabilities = await call('inspect_capabilities', {});
      expect(
        CapabilityReportSchema.parse(capabilities.data).availableCapabilityIds,
      ).toContain('animation.temporal');
      await call('inspect_template', { templateId: 'human.torso' });

      const created = await call('create_asset', { reference: 'adventurer' });
      expect(created.revisionId).toMatch(/^revision\.[a-f0-9]{64}$/);
      const accessories = await call('search_accessories', {
        assetId: 'adventurer.rustic',
        archetypeId: 'guard',
        query: { slots: ['head'], limit: 10 },
      });
      const accessoryData = AccessoryDiscoveryDataSchema.parse(
        accessories.data,
      );
      expect(accessoryData.items.length).toBeGreaterThan(0);
      await call('apply_accessory_operation', {
        assetId: 'adventurer.rustic',
        expectedRevisionId: created.revisionId,
        archetypeId: 'guard',
        operation: accessoryData.items[0]!.exampleOperation,
        dryRun: true,
      });
      const inspected = await call('inspect_asset', {
        assetId: 'adventurer.rustic',
        section: 'parts',
        limit: 100,
      });
      expect(inspected.data).toMatchObject({
        page: { total: 19, truncated: false },
      });
      expect(JSON.stringify(inspected).length).toBeLessThan(
        MCP_RESPONSE_BYTE_LIMIT,
      );

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
      const comparisonData = SemanticRevisionComparisonSchema.parse(
        comparison.data,
      );
      expect(comparisonData.affectedIds).toContain('torso');
      const preservedIds = [...comparisonData.preservedIds];
      let nextIdOffset = comparisonData.preservedIdsPage.nextOffset;
      while (nextIdOffset !== undefined) {
        const page = SemanticRevisionComparisonSchema.parse(
          (
            await call('compare_revisions', {
              assetId: 'adventurer.rustic',
              baseRevisionId: created.revisionId,
              targetRevisionId: reshaped.revisionId,
              limit: 100,
              idOffset: nextIdOffset,
              idLimit: 100,
            })
          ).data,
        );
        preservedIds.push(...page.preservedIds);
        nextIdOffset = page.preservedIdsPage.nextOffset;
      }
      expect(preservedIds).toContain('sword');
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
      await call('render_preview', {
        assetId: 'adventurer.rustic',
        revisionId: posed.revisionId,
      });
      await call('export_asset', {
        assetId: 'adventurer.rustic',
        revisionId: posed.revisionId,
      });
      const unavailableManifest = await callFailure(
        'get_interchange_manifest',
        {
          asset_id: 'adventurer.rustic',
          revision_id: posed.revisionId,
        },
      );
      expect(unavailableManifest.issues[0]?.code).toBe('SERVICE_UNAVAILABLE');
      const unavailableChunk = await callFailure(
        'get_interchange_artifact_chunk',
        {
          asset_id: 'adventurer.rustic',
          revision_id: posed.revisionId,
          artifact_id: 'frame.n',
          offset: 0,
          length: 1,
        },
      );
      expect(unavailableChunk.issues[0]?.code).toBe('SERVICE_UNAVAILABLE');

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

  it('keeps reference comparison on the existing path-free render protocol', async () => {
    const revisions = new MemoryRevisions();
    const digest = 'a'.repeat(64);
    const { client, server } = await connectProtocol({
      revisions,
      renderService: {
        render: async () => ({}),
        renderReferenceComparison: async () => ({
          contractId: 'forge-authoring-review-manifest/v1',
          deliveryId: `delivery.${digest}`,
          manifestSha256: digest,
          profileId: 'forge.authoring.reference-comparison.v1',
          classification: 'authoring_only',
          admission: {
            review_only: true,
            interchange_admitted: false,
            pack_admitted: false,
          },
          artifactSha256s: ['1', '2', '3', '4', '5'].map((value) =>
            value.repeat(64),
          ),
        }),
      },
    });
    try {
      expect((await client.listTools()).tools).toHaveLength(16);
      const created = parseEnvelope(
        await client.callTool({
          name: 'create_asset',
          arguments: { reference: 'crate' },
        }),
      );
      const request = {
        assetId: 'crate.rustic',
        revisionId: created.revisionId,
        referenceComparison: {
          profileId: 'forge.authoring.reference-comparison.v1',
        },
      };
      const response = await client.callTool({
        name: 'render_preview',
        arguments: request,
      });
      expect(parseEnvelope(response)).toMatchObject({
        ok: true,
        data: {
          state: 'authoring_review_rendered',
          delivery: {
            deliveryId: `delivery.${digest}`,
            classification: 'authoring_only',
          },
        },
      });
      expect(JSON.stringify(response)).not.toMatch(
        /\/(?:tmp|home)\/|[a-z]:\\\\|(?:manifest|contactSheet|frame)Path/i,
      );
      const mutuallyExclusive = await client.callTool({
        name: 'render_preview',
        arguments: {
          ...request,
          animation: REFERENCE_FIVE_CLIP_ANIMATION_REQUEST,
        },
      });
      expect(mutuallyExclusive.isError).toBe(true);
      expect(JSON.stringify(mutuallyExclusive.content)).toContain('-32602');
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('does not expose oversized or path-bearing producer service payloads', async () => {
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
        arguments: {
          assetId: 'crate.rustic',
          revisionId: parseEnvelope(created).revisionId,
        },
      });
      const envelope = parseEnvelope(response);
      expect(response.isError).not.toBe(true);
      expect(envelope).toMatchObject({
        ok: true,
        data: { state: 'rendered' },
      });
      expect(
        new TextEncoder().encode(JSON.stringify(response)).byteLength,
      ).toBeLessThanOrEqual(MCP_RESPONSE_BYTE_LIMIT);
      expect(JSON.stringify(response)).not.toContain(oversizedPayload);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it.each([
    ['render_preview', 'malformed renderer /tmp/secret'],
    ['render_preview', 'immutable conflict /home/private'],
    ['export_asset', 'browser export failure C:\\secret'],
  ] as const)(
    'wraps %s producer failures in a stable path-free envelope',
    async (toolName, secret) => {
      const revisions = new MemoryRevisions();
      const { client, server } = await connectProtocol({
        revisions,
        renderService: {
          render: async () => Promise.reject(new Error(secret)),
        },
        exportService: {
          export: async () => Promise.reject(new Error(secret)),
        },
      });
      try {
        const created = parseEnvelope(
          await client.callTool({
            name: 'create_asset',
            arguments: { reference: 'crate' },
          }),
        );
        const response = await client.callTool({
          name: toolName,
          arguments: {
            assetId: 'crate.rustic',
            revisionId: created.revisionId,
          },
        });
        expect(response.isError).toBe(true);
        expect(parseEnvelope(response)).toMatchObject({
          ok: false,
          issues: [{ code: 'REPOSITORY_ERROR', path: '$.revisionId' }],
        });
        expect(JSON.stringify(response)).not.toContain(secret);
      } finally {
        await client.close();
        await server.close();
      }
    },
  );
});
