import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  PUBLIC_TOOL_CATALOG,
  ApplyOperationsInputSchema,
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

export function createFantasyAssetMcpServer(
  context: ToolHandlerContext,
): McpServer {
  const handlers = createToolHandlers(context);
  const server = new McpServer({
    name: 'fantasy-asset-forge',
    version: '0.1.0',
  });
  const result = async (value: Promise<unknown>) => {
    const envelope = (await value) as { ok: boolean };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(envelope) }],
      isError: !envelope.ok,
    };
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
