import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  ToolResultEnvelopeSchema,
  type ToolResultEnvelope,
} from '../contracts/index.js';
import {
  PUBLIC_TOOL_CATALOG,
  ApplyOperationsInputSchema,
  CompareRevisionsInputSchema,
  ConnectPartsInputSchema,
  CreateAssetInputSchema,
  ExportAssetInputSchema,
  InspectAssetInputSchema,
  InspectTemplateInputSchema,
  ListKitsInputSchema,
  RenderPreviewInputSchema,
  SetPoseInputSchema,
  ValidateAssetInputSchema,
  createToolHandlers,
  type ToolHandlerContext,
} from '../tools/index.js';

export const MCP_RESPONSE_BYTE_LIMIT = 64 * 1024;

const encoder = new TextEncoder();

function serializedBytes(value: unknown): number {
  return encoder.encode(JSON.stringify(value)).byteLength;
}

function responseFor(envelope: ToolResultEnvelope) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(envelope) }],
    isError: !envelope.ok,
  };
}

function boundedResponse(envelope: ToolResultEnvelope) {
  const response = responseFor(envelope);
  const byteLength = serializedBytes(response);
  if (byteLength <= MCP_RESPONSE_BYTE_LIMIT) return response;

  return responseFor(
    ToolResultEnvelopeSchema.parse({
      ok: false,
      affectedIds: [],
      summary: 'Serialized MCP response exceeded the configured byte limit.',
      issues: [
        {
          code: 'RESPONSE_TOO_LARGE',
          severity: 'error',
          path: '$.response',
          message: `Serialized MCP response was ${byteLength} bytes; the limit is ${MCP_RESPONSE_BYTE_LIMIT} bytes.`,
          expected: { maximumBytes: MCP_RESPONSE_BYTE_LIMIT },
          actual: { serializedBytes: byteLength },
          guidance:
            'Narrow the request or inspect the asset through bounded semantic summaries.',
        },
      ],
    }),
  );
}

export function createFantasyAssetMcpServer(
  context: ToolHandlerContext,
): McpServer {
  const handlers = createToolHandlers(context);
  const server = new McpServer({
    name: 'fantasy-asset-forge',
    version: '0.1.0',
  });
  const result = async (value: Promise<unknown>) => {
    const envelope = ToolResultEnvelopeSchema.parse(await value);
    return boundedResponse(envelope);
  };
  const description = (name: string) =>
    PUBLIC_TOOL_CATALOG.find((tool) => tool.name === name)!.description;
  server.registerTool(
    'list_kits',
    { description: description('list_kits'), inputSchema: ListKitsInputSchema },
    (input) => result(handlers.listKits(input)),
  );
  server.registerTool(
    'inspect_template',
    {
      description: description('inspect_template'),
      inputSchema: InspectTemplateInputSchema,
    },
    (input) => result(handlers.inspectTemplate(input)),
  );
  server.registerTool(
    'inspect_asset',
    {
      description: description('inspect_asset'),
      inputSchema: InspectAssetInputSchema,
    },
    (input) => result(handlers.inspectAsset(input)),
  );
  server.registerTool(
    'compare_revisions',
    {
      description: description('compare_revisions'),
      inputSchema: CompareRevisionsInputSchema,
    },
    (input) => result(handlers.compareRevisions(input)),
  );
  server.registerTool(
    'create_asset',
    {
      description: description('create_asset'),
      inputSchema: CreateAssetInputSchema,
    },
    (input) => result(handlers.createAsset(input)),
  );
  server.registerTool(
    'apply_operations',
    {
      description: description('apply_operations'),
      inputSchema: ApplyOperationsInputSchema,
    },
    (input) => result(handlers.applyOperations(input)),
  );
  server.registerTool(
    'connect_parts',
    {
      description: description('connect_parts'),
      inputSchema: ConnectPartsInputSchema,
    },
    (input) => result(handlers.connectParts(input)),
  );
  server.registerTool(
    'set_pose',
    { description: description('set_pose'), inputSchema: SetPoseInputSchema },
    (input) => result(handlers.setPose(input)),
  );
  server.registerTool(
    'validate_asset',
    {
      description: description('validate_asset'),
      inputSchema: ValidateAssetInputSchema,
    },
    (input) => result(handlers.validateAsset(input)),
  );
  server.registerTool(
    'render_preview',
    {
      description: description('render_preview'),
      inputSchema: RenderPreviewInputSchema,
    },
    (input) => result(handlers.renderPreview(input)),
  );
  server.registerTool(
    'export_asset',
    {
      description: description('export_asset'),
      inputSchema: ExportAssetInputSchema,
    },
    (input) => result(handlers.exportAsset(input)),
  );
  return server;
}
