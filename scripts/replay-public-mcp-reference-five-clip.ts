import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from 'vite';

import { REFERENCE_FULL_BODY_FIVE_CLIP_ANIMATION_REQUEST } from '../src/animation/reference-five-clip.js';

export const REFERENCE_FIVE_CLIP_ANIMATION_REQUEST =
  REFERENCE_FULL_BODY_FIVE_CLIP_ANIMATION_REQUEST;

const FORGE_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MAX_CHUNK_BYTES = 32 * 1024;
const EXPECTED_ACTIONS = [
  'idle',
  'walk_forward',
  'walk_right',
  'attack',
  'receive_damage',
] as const;
const EXPECTED_SAMPLES = [4, 6, 6, 6, 4] as const;

interface ArtifactRecord {
  readonly id: string;
  readonly fileName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly width?: number;
  readonly height?: number;
}

interface RetrievedChunk {
  readonly delivery_id: string;
  readonly asset_id: string;
  readonly revision_id: string;
  readonly artifact_id: string;
  readonly artifact_sha256: string;
  readonly chunk_sha256: string;
  readonly offset: number;
  readonly length: number;
  readonly total: number;
  readonly bytes_base64: string;
}

const sha256 = (bytes: Uint8Array | string): string =>
  createHash('sha256').update(bytes).digest('hex');

export function serializePublicReferenceFiveClipRetrieval<TManifest, TChunk>(
  deliveryId: string,
  manifestSha256: string,
  manifest: TManifest,
  chunks: readonly TChunk[],
): string {
  return `${JSON.stringify(
    { deliveryId, manifestSha256, manifest, chunks },
    null,
    2,
  )}\n`;
}

function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

function firstToolText(result: unknown): string {
  assertCondition(
    typeof result === 'object' && result !== null && 'content' in result,
    'MCP tool response did not include content.',
  );
  const content = result.content;
  assertCondition(
    Array.isArray(content) &&
      typeof content[0] === 'object' &&
      content[0] !== null &&
      'text' in content[0] &&
      typeof (content[0] as { text: unknown }).text === 'string',
    'MCP tool response did not include a leading text envelope.',
  );
  return (content[0] as { text: string }).text;
}

function assertPng(bytes: Buffer, width: number, height: number): void {
  assertCondition(
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'Retrieved PNG has an invalid signature.',
  );
  assertCondition(
    bytes.readUInt32BE(16) === width && bytes.readUInt32BE(20) === height,
    `Retrieved PNG dimensions do not match ${width}x${height}.`,
  );
}

function assertGlb(bytes: Buffer): void {
  assertCondition(
    bytes.subarray(0, 4).toString('ascii') === 'glTF',
    'Retrieved GLB has an invalid magic header.',
  );
  assertCondition(
    bytes.readUInt32LE(4) === 2,
    'Retrieved GLB is not version 2.',
  );
  assertCondition(
    bytes.readUInt32LE(8) === bytes.byteLength,
    'Retrieved GLB declared length is false.',
  );
}

async function main(): Promise<void> {
  const outputRoot =
    process.argv[2] ?? '/tmp/faf-public-reference-five-clip-latest';
  const runtimeRoot = resolve(outputRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const vite = await createServer({
    root: FORGE_ROOT,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === 'string')
    throw new Error('Vite did not expose a loopback port.');
  const transport = new StdioClientTransport({
    command: resolve(FORGE_ROOT, 'node_modules/.bin/tsx'),
    args: [resolve(FORGE_ROOT, 'src/mcp/stdio.ts')],
    cwd: runtimeRoot,
    env: {
      ...getDefaultEnvironment(),
      FORGE_INSPECTOR_URL: `http://127.0.0.1:${address.port}`,
    },
    stderr: 'pipe',
  });
  const stderr: string[] = [];
  transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));
  const client = new Client({
    name: 'forge-reference-five-clip-replay',
    version: '1.0.0',
  });
  try {
    await client.connect(transport);
    const created = await client.callTool({
      name: 'create_asset',
      arguments: { reference: 'adventurer' },
    });
    if (created.isError) throw new Error(JSON.stringify(created));
    const createdEnvelope = JSON.parse(firstToolText(created)) as {
      revisionId: string;
    };
    const assetId = 'adventurer.rustic';
    const revisionId = createdEnvelope.revisionId;
    const result = await client.callTool({
      name: 'render_preview',
      arguments: {
        assetId,
        revisionId,
        animation: REFERENCE_FIVE_CLIP_ANIMATION_REQUEST,
      },
    });
    await writeFile(
      resolve(outputRoot, 'mcp-response.json'),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    if (result.isError) throw new Error(JSON.stringify(result));
    const renderEnvelope = JSON.parse(firstToolText(result)) as {
      data: {
        state: string;
        frameCount: number;
        clips: { action: string; frameCount: number }[];
        delivery: {
          deliveryId: string;
          contractId: string;
          manifestSha256: string;
        };
      };
    };
    assertCondition(
      renderEnvelope.data.state === 'temporal_batch_rendered' &&
        renderEnvelope.data.frameCount === 26 &&
        renderEnvelope.data.delivery.contractId ===
          'forge-temporal-render-batch-artifacts/v1',
      'Public render response did not declare the exact temporal batch.',
    );
    assertCondition(
      renderEnvelope.data.clips.length === EXPECTED_ACTIONS.length &&
        renderEnvelope.data.clips.every(
          (clip, index) =>
            clip.action === EXPECTED_ACTIONS[index] &&
            clip.frameCount === EXPECTED_SAMPLES[index],
        ),
      'Public render response clip order or sample counts are false.',
    );
    const deliveryId = renderEnvelope.data.delivery.deliveryId;
    const manifestResult = await client.callTool({
      name: 'get_interchange_manifest',
      arguments: {
        asset_id: assetId,
        revision_id: revisionId,
        delivery_id: deliveryId,
      },
    });
    if (manifestResult.isError) throw new Error(JSON.stringify(manifestResult));
    const manifestEnvelope = JSON.parse(firstToolText(manifestResult)) as {
      data: {
        contractId: string;
        authoringContractId: string;
        deliveryId: string;
        assetId: string;
        revisionId: string;
        clips: {
          action: string;
          samplesPerDirection: number;
          frameIds: string[];
        }[];
        frames: ArtifactRecord[];
        poseSheets: ArtifactRecord[];
        atlas: ArtifactRecord;
        sourceGlb: ArtifactRecord;
        animationBundle: ArtifactRecord;
      };
    };
    const manifest = manifestEnvelope.data;
    assertCondition(
      manifest.contractId === 'forge-temporal-render-batch-artifacts/v1' &&
        manifest.authoringContractId ===
          'forge-reference-five-clip-authoring/v1' &&
        manifest.deliveryId === deliveryId &&
        manifest.assetId === assetId &&
        manifest.revisionId === revisionId,
      'Retrieved batch manifest has mismatched immutable bindings.',
    );
    assertCondition(
      manifest.frames.length === 26 &&
        manifest.poseSheets.length === 5 &&
        manifest.clips.length === EXPECTED_ACTIONS.length &&
        manifest.clips.every(
          (clip, index) =>
            clip.action === EXPECTED_ACTIONS[index] &&
            clip.samplesPerDirection === EXPECTED_SAMPLES[index] &&
            clip.frameIds.length === EXPECTED_SAMPLES[index],
        ),
      'Retrieved manifest does not contain the exact five-clip frame set.',
    );
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    const manifestSha256 = sha256(manifestBytes);
    assertCondition(
      manifestSha256 === renderEnvelope.data.delivery.manifestSha256,
      'Retrieved manifest bytes do not match the render response digest.',
    );
    const artifacts = [
      ...manifest.frames,
      ...manifest.poseSheets,
      manifest.atlas,
      manifest.sourceGlb,
      manifest.animationBundle,
    ];
    assertCondition(
      new Set(artifacts.map(({ id }) => id)).size === artifacts.length,
      'Manifest artifact identities are not unique.',
    );
    const chunks: RetrievedChunk[] = [];
    const reconstructed = new Map<string, Buffer>();
    for (const artifact of artifacts)
      for (
        let offset = 0;
        offset < artifact.byteLength;
        offset += MAX_CHUNK_BYTES
      ) {
        const chunkResult = await client.callTool({
          name: 'get_interchange_artifact_chunk',
          arguments: {
            asset_id: assetId,
            revision_id: revisionId,
            delivery_id: deliveryId,
            artifact_id: artifact.id,
            record_kind: 'artifact',
            offset,
            length: Math.min(MAX_CHUNK_BYTES, artifact.byteLength - offset),
          },
        });
        if (chunkResult.isError) throw new Error(JSON.stringify(chunkResult));
        const chunk = (
          JSON.parse(firstToolText(chunkResult)) as { data: RetrievedChunk }
        ).data;
        const bytes = Buffer.from(chunk.bytes_base64, 'base64');
        assertCondition(
          chunk.delivery_id === deliveryId &&
            chunk.asset_id === assetId &&
            chunk.revision_id === revisionId &&
            chunk.artifact_id === artifact.id &&
            chunk.artifact_sha256 === artifact.sha256 &&
            chunk.chunk_sha256 === sha256(bytes) &&
            chunk.offset === offset &&
            chunk.length === bytes.byteLength &&
            chunk.total === artifact.byteLength,
          `Retrieved chunk bindings are false for ${artifact.id}.`,
        );
        const prior = reconstructed.get(artifact.id) ?? Buffer.alloc(0);
        assertCondition(
          prior.byteLength === offset,
          `Retrieved chunks are noncontiguous for ${artifact.id}.`,
        );
        reconstructed.set(artifact.id, Buffer.concat([prior, bytes]));
        chunks.push(chunk);
      }
    for (const artifact of artifacts) {
      const bytes = reconstructed.get(artifact.id);
      assertCondition(
        bytes !== undefined &&
          bytes.byteLength === artifact.byteLength &&
          sha256(bytes) === artifact.sha256,
        `Reassembled artifact bytes do not match ${artifact.id}.`,
      );
      if (artifact.id.startsWith('frame.')) assertPng(bytes, 128, 128);
      else if (
        artifact.id.startsWith('sheet.') ||
        artifact.id.startsWith('atlas.')
      )
        assertPng(bytes, artifact.width!, artifact.height!);
      else if (artifact.id.startsWith('glb.')) assertGlb(bytes);
      else if (artifact.id.startsWith('bundle.')) {
        const bundle = JSON.parse(bytes.toString('utf8')) as {
          contractId: string;
          clips: { action: string; keyframes: { phase?: string }[] }[];
        };
        assertCondition(
          bundle.contractId === 'forge-rigid-animation-bundle/v1' &&
            bundle.clips.length === EXPECTED_ACTIONS.length &&
            bundle.clips.every(
              (clip, index) =>
                clip.action === EXPECTED_ACTIONS[index] &&
                clip.keyframes.every(({ phase }) => phase !== undefined),
            ),
          'Animation bundle lost clip order or semantic phase labels.',
        );
      }
    }
    await writeFile(
      resolve(outputRoot, 'public-reference-five-clip-retrieval.json'),
      serializePublicReferenceFiveClipRetrieval(
        deliveryId,
        manifestSha256,
        manifest,
        chunks,
      ),
    );
    await writeFile(
      resolve(outputRoot, 'verification-summary.json'),
      `${JSON.stringify(
        {
          deliveryId,
          manifestSha256,
          actions: manifest.clips.map(({ action }) => action),
          samples: manifest.clips.map(
            ({ samplesPerDirection }) => samplesPerDirection,
          ),
          artifacts: artifacts.map(
            ({ id, byteLength, sha256: digestValue }) => ({
              id,
              byteLength,
              sha256: digestValue,
            }),
          ),
          chunkCount: chunks.length,
          verified: true,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await client.close();
    await vite.close();
    if (stderr.length > 0)
      await writeFile(resolve(outputRoot, 'stderr.log'), stderr.join(''));
  }
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  void main();
