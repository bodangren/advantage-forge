import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FileRevisionRepository } from '../document/index.js';
import { LocalBrowserArtifactService } from '../services/index.js';
import { createFantasyAssetMcpServer } from './server.js';

const workspaceRoot = process.cwd();
const revisions = new FileRevisionRepository({ workspaceRoot });
const artifacts = new LocalBrowserArtifactService({
  workspaceRoot,
  ...(process.env['FORGE_INSPECTOR_URL'] === undefined
    ? {}
    : { inspectorUrl: process.env['FORGE_INSPECTOR_URL'] }),
});
const server = createFantasyAssetMcpServer({
  revisions,
  renderService: artifacts,
  exportService: artifacts,
  interchangeService: artifacts,
});
await server.connect(new StdioServerTransport());
