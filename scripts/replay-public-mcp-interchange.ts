import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

import {
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  ForgeInterchangeArtifactChunkSchema,
  parseForgeAssetInterchangeManifest,
  type ForgeAssetInterchangeManifest,
  type ForgeInterchangeArtifactChunk,
} from '../src/contracts/index.js';
import {
  parsePublicMcpEnvelope,
  recordsForPublicReplay,
  reconstructPublicReplayRecord,
} from '../src/services/public-mcp-interchange-replay.js';
import { PUBLIC_TOOL_NAMES } from '../src/tools/index.js';

const ASSET_ID = 'adventurer.rustic';
const forgeRoot = resolve(import.meta.dirname, '..');
const outputRoot =
  process.argv[2] === undefined ? undefined : resolve(process.argv[2]);
if (outputRoot === undefined)
  throw new Error(
    'Usage: replay-public-mcp-interchange.ts <new-output-directory>',
  );

await mkdir(outputRoot);
const runtimeRoot = resolve(outputRoot, 'runtime');
const recordsRoot = resolve(outputRoot, 'records');
await mkdir(runtimeRoot);
await mkdir(recordsRoot);

const vite = await createServer({
  root: forgeRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
await vite.listen();
const address = vite.httpServer?.address();
if (address === null || address === undefined || typeof address === 'string')
  throw new Error('Vite did not expose its loopback inspector address.');
const inspectorUrl = `http://127.0.0.1:${address.port}`;

const transport = new StdioClientTransport({
  command: resolve(forgeRoot, 'node_modules/.bin/tsx'),
  args: [resolve(forgeRoot, 'src/mcp/stdio.ts')],
  cwd: runtimeRoot,
  env: {
    ...getDefaultEnvironment(),
    FORGE_INSPECTOR_URL: inspectorUrl,
  },
  stderr: 'pipe',
});
const stderr: string[] = [];
transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));
const client = new Client({
  name: 'forge-public-interchange-replay',
  version: '1.0.0',
});
const ledger: Array<Record<string, unknown>> = [];
let manifest: ForgeAssetInterchangeManifest | undefined;
const chunks: ForgeInterchangeArtifactChunk[] = [];
let failure: unknown;

try {
  await client.connect(transport);
  const discovery = await client.listTools();
  const toolNames = discovery.tools.map(({ name }) => name);
  if (toolNames.join('\n') !== PUBLIC_TOOL_NAMES.join('\n'))
    throw new Error(
      `Public MCP catalog drifted: received ${toolNames.join(', ')}.`,
    );
  await writeJson(resolve(outputRoot, 'tools-list.json'), discovery);

  const call = async (
    name: (typeof PUBLIC_TOOL_NAMES)[number],
    arguments_: Record<string, unknown>,
  ) => {
    const response = await client.callTool({ name, arguments: arguments_ });
    const envelope = parsePublicMcpEnvelope(response);
    const normalized: Record<string, unknown> = {
      sequence: ledger.length + 1,
      operation: name,
      arguments: arguments_,
      ok: true,
      summary: envelope.summary,
    };
    if (envelope.affectedIds.length > 0)
      normalized['affected_ids'] = envelope.affectedIds;
    if (envelope.revisionId !== undefined)
      normalized['revision_id'] = envelope.revisionId;
    if (name === 'get_interchange_manifest') {
      const responseManifest = await parseForgeAssetInterchangeManifest(
        envelope.data,
      );
      normalized['manifest_sha256'] = responseManifest.manifest_sha256;
      normalized['artifact_count'] = responseManifest.artifacts.length;
      normalized['evidence_count'] = responseManifest.evidence.length;
    } else if (name === 'get_interchange_artifact_chunk') {
      const responseChunk = ForgeInterchangeArtifactChunkSchema.parse(
        envelope.data,
      );
      normalized['artifact_sha256'] = responseChunk.artifact_sha256;
      normalized['chunk_sha256'] = responseChunk.chunk_sha256;
      normalized['total'] = responseChunk.total;
    } else if (name === 'validate_asset') {
      const data = record(envelope.data);
      const scene = record(data?.['scene']);
      const parts = record(scene?.['parts']);
      if (typeof data?.['validation'] === 'string')
        normalized['validation'] = data['validation'];
      if (typeof parts?.['total'] === 'number')
        normalized['part_count'] = parts['total'];
      if (typeof scene?.['triangleCount'] === 'number')
        normalized['triangle_count'] = scene['triangleCount'];
      if (typeof scene?.['triangleBudget'] === 'number')
        normalized['triangle_budget'] = scene['triangleBudget'];
    }
    ledger.push(normalized);
    return envelope;
  };

  await call('inspect_capabilities', {});
  const created = await call('create_asset', { reference: 'adventurer' });
  const revisionId = created.revisionId;
  if (revisionId === undefined)
    throw new Error('create_asset did not return an immutable revision ID.');
  await call('validate_asset', { assetId: ASSET_ID });
  await call('render_preview', { assetId: ASSET_ID, revisionId });
  await call('export_asset', { assetId: ASSET_ID, revisionId });
  const manifestEnvelope = await call('get_interchange_manifest', {
    asset_id: ASSET_ID,
    revision_id: revisionId,
  });
  manifest = await parseForgeAssetInterchangeManifest(manifestEnvelope.data);
  await writeJson(resolve(outputRoot, 'interchange-manifest.json'), manifest);

  const replayRecords = recordsForPublicReplay(manifest);
  for (const record of replayRecords) {
    const recordChunks: ForgeInterchangeArtifactChunk[] = [];
    for (let offset = 0; offset < record.byteLength;) {
      const length = Math.min(
        FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
        record.byteLength - offset,
      );
      const chunkEnvelope = await call('get_interchange_artifact_chunk', {
        asset_id: manifest.source.asset_id,
        revision_id: manifest.source.revision_id,
        artifact_id: record.id,
        record_kind: record.recordKind,
        offset,
        length,
      });
      const chunk = ForgeInterchangeArtifactChunkSchema.parse(
        chunkEnvelope.data,
      );
      chunks.push(chunk);
      recordChunks.push(chunk);
      offset += length;
    }
    const bytes = reconstructPublicReplayRecord(record, recordChunks);
    const recordDirectory = resolve(recordsRoot, record.recordKind);
    await mkdir(recordDirectory, { recursive: true });
    const manifestRecord =
      record.recordKind === 'artifact'
        ? manifest.artifacts.find(({ id }) => id === record.id)
        : manifest.evidence.find(({ id }) => id === record.id);
    if (manifestRecord === undefined)
      throw new Error(`${record.id}: manifest record disappeared.`);
    await writeFile(
      resolve(recordDirectory, basename(manifestRecord.reference)),
      bytes,
      { flag: 'wx' },
    );
  }
  await writeJson(resolve(outputRoot, 'chunks.json'), chunks);
  await writeJson(resolve(outputRoot, 'public-call-ledger.json'), {
    boundary: 'public MCP stdio only',
    asset_id: manifest.source.asset_id,
    revision_id: manifest.source.revision_id,
    manifest_sha256: manifest.manifest_sha256,
    call_count: ledger.length,
    sanitization: {
      base64_payloads_omitted: true,
      host_paths_omitted: true,
      public_arguments_preserved: true,
      response_digests_preserved: true,
    },
    calls: ledger,
    retrieval_validation: {
      retrieved_record_count: replayRecords.length,
      retrieved_bytes: replayRecords.reduce(
        (total, record) => total + record.byteLength,
        0,
      ),
      chunk_digests_verified: true,
      reassembled_record_digests_verified: true,
      manifest_allowlist_enforced: true,
    },
  });
  await writeJson(resolve(outputRoot, 'result.json'), {
    ok: true,
    model_boundary: 'public stdio MCP tools only',
    inspector_url: inspectorUrl,
    runtime_root: 'runtime',
    asset_id: manifest.source.asset_id,
    revision_id: manifest.source.revision_id,
    manifest_sha256: manifest.manifest_sha256,
    public_tool_count: PUBLIC_TOOL_NAMES.length,
    public_call_count: ledger.length,
    retrieved_record_count: recordsForPublicReplay(manifest).length,
    retrieved_chunk_count: chunks.length,
  });
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : error;
  throw error;
} finally {
  await writeJson(resolve(outputRoot, 'runner-diagnostics.json'), {
    stderr,
    failure,
  });
  await client.close();
  await vite.close();
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, undefined, 2)}\n`, {
    flag: 'wx',
  });
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
