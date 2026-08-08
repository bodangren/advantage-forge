import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from 'vite';

function textResponse(result: unknown): string {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('content' in result) ||
    !Array.isArray(result.content)
  )
    throw new Error('Expected an MCP content array.');
  const content: unknown[] = result.content;
  const text = content.find(
    (item): item is { readonly type: 'text'; readonly text: string } =>
      typeof item === 'object' &&
      item !== null &&
      'type' in item &&
      item.type === 'text' &&
      'text' in item &&
      typeof item.text === 'string',
  );
  if (text === undefined) throw new Error('Expected an MCP text response.');
  return text.text;
}

async function main(): Promise<void> {
  const forgeRoot = '/home/daniel-bo/Desktop/fantasy-asset-forge';
  const outputRoot =
    process.argv[2] ?? '/tmp/faf-public-temporal-20260722-final';
  const runtimeRoot = resolve(outputRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const vite = await createServer({
    root: forgeRoot,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === 'string')
    throw new Error('Vite did not expose a loopback port.');
  const transport = new StdioClientTransport({
    command: resolve(forgeRoot, 'node_modules/.bin/tsx'),
    args: [resolve(forgeRoot, 'src/mcp/stdio.ts')],
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
    name: 'forge-temporal-replay',
    version: '1.0.0',
  });
  try {
    await client.connect(transport);
    const created = await client.callTool({
      name: 'create_asset',
      arguments: { reference: 'adventurer' },
    });
    if (created.isError) throw new Error(JSON.stringify(created));
    const createdEnvelope = JSON.parse(textResponse(created)) as {
      revisionId: string;
    };
    const result = await client.callTool({
      name: 'render_preview',
      arguments: {
        assetId: 'adventurer.rustic',
        revisionId: createdEnvelope.revisionId,
        animation: {
          rig: {
            id: 'rig.adventurer',
            rootJointId: 'root',
            joints: [
              {
                id: 'root',
                partId: 'torso',
                axis: 'y',
                minimumDegrees: 0,
                maximumDegrees: 0,
                restDegrees: 0,
              },
              {
                id: 'shoulder.left',
                parentJointId: 'root',
                partId: 'upper-arm.left',
                axis: 'z',
                minimumDegrees: -80,
                maximumDegrees: 80,
                restDegrees: 0,
              },
              {
                id: 'shoulder.right',
                parentJointId: 'root',
                partId: 'upper-arm.right',
                axis: 'z',
                minimumDegrees: -80,
                maximumDegrees: 80,
                restDegrees: 0,
              },
            ],
          },
          poses: [
            {
              id: 'walk.left',
              channels: [
                { jointId: 'shoulder.left', valueDegrees: -35 },
                { jointId: 'shoulder.right', valueDegrees: 35 },
              ],
            },
            {
              id: 'walk.right',
              channels: [
                { jointId: 'shoulder.left', valueDegrees: 35 },
                { jointId: 'shoulder.right', valueDegrees: -35 },
              ],
            },
          ],
          clip: {
            action: 'walk',
            durationMs: 500,
            interpolation: 'linear',
            rootAnchorPolicy: 'in_place',
            loop: { mode: 'loop', startMs: 0, endMs: 500 },
            keyframes: [
              { id: 'walk.start', timeMs: 0, poseId: 'walk.left' },
              { id: 'walk.end', timeMs: 500, poseId: 'walk.right' },
            ],
          },
          directions: ['S'],
          framesPerSecond: 8,
          seed: 722,
        },
      },
    });
    await writeFile(
      resolve(outputRoot, 'mcp-response.json'),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    if (result.isError) throw new Error(JSON.stringify(result));
    const renderEnvelope = JSON.parse(textResponse(result)) as {
      data: { delivery: { deliveryId: string } };
    };
    const deliveryId = renderEnvelope.data.delivery.deliveryId;
    const manifestResult = await client.callTool({
      name: 'get_interchange_manifest',
      arguments: {
        asset_id: 'adventurer.rustic',
        revision_id: createdEnvelope.revisionId,
        delivery_id: deliveryId,
      },
    });
    if (manifestResult.isError) throw new Error(JSON.stringify(manifestResult));
    const manifestEnvelope = JSON.parse(textResponse(manifestResult)) as {
      data: {
        frames: { id: string; byteLength: number }[];
        atlas: { id: string; byteLength: number };
        sourceGlb: { id: string; byteLength: number };
      };
    };
    const chunkResults = [];
    for (const artifact of [
      ...manifestEnvelope.data.frames,
      manifestEnvelope.data.atlas,
      manifestEnvelope.data.sourceGlb,
    ]) {
      for (let offset = 0; offset < artifact.byteLength; offset += 32 * 1024) {
        const chunkResult = await client.callTool({
          name: 'get_interchange_artifact_chunk',
          arguments: {
            asset_id: 'adventurer.rustic',
            revision_id: createdEnvelope.revisionId,
            delivery_id: deliveryId,
            artifact_id: artifact.id,
            record_kind: 'artifact',
            offset,
            length: Math.min(32 * 1024, artifact.byteLength - offset),
          },
        });
        if (chunkResult.isError) throw new Error(JSON.stringify(chunkResult));
        const chunkEnvelope = JSON.parse(textResponse(chunkResult)) as {
          data: unknown;
        };
        chunkResults.push(chunkEnvelope.data);
      }
    }
    await writeFile(
      resolve(outputRoot, 'public-temporal-retrieval.json'),
      `${JSON.stringify({ deliveryId, manifest: manifestEnvelope.data, chunks: chunkResults }, null, 2)}\n`,
    );
  } finally {
    await client.close();
    await vite.close();
    if (stderr.length > 0)
      await writeFile(resolve(outputRoot, 'stderr.log'), stderr.join(''));
  }
}

void main();
