import { createHash } from 'node:crypto';

import {
  ForgeInterchangeArtifactChunkSchema,
  ToolResultEnvelopeSchema,
  type ForgeAssetInterchangeManifest,
  type ForgeInterchangeArtifactChunk,
  type ToolResultEnvelope,
} from '../contracts/index.js';

export interface ReplayRecord {
  readonly id: string;
  readonly recordKind: 'artifact' | 'evidence';
  readonly byteLength: number;
  readonly sha256: string;
}

export function parsePublicMcpEnvelope(response: unknown): ToolResultEnvelope {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('content' in response) ||
    !Array.isArray(response.content)
  )
    throw new Error('Public MCP response did not contain a content array.');
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
  if (text === undefined)
    throw new Error('Public MCP response did not contain text content.');
  const envelope = ToolResultEnvelopeSchema.parse(JSON.parse(text));
  if ('isError' in response && response.isError === true)
    throw new Error(
      `Public MCP transport marked the response as an error: ${envelope.summary}`,
    );
  if (!envelope.ok)
    throw new Error(
      `Public MCP tool failed: ${envelope.summary}; ${JSON.stringify(envelope.issues)}`,
    );
  return envelope;
}

export function recordsForPublicReplay(
  manifest: ForgeAssetInterchangeManifest,
): ReplayRecord[] {
  return [
    ...manifest.artifacts.map((artifact) => ({
      id: artifact.id,
      recordKind: 'artifact' as const,
      byteLength: artifact.byte_length,
      sha256: artifact.sha256,
    })),
    ...manifest.evidence.flatMap((evidence) =>
      evidence.byte_length === undefined
        ? []
        : [
            {
              id: evidence.id,
              recordKind: 'evidence' as const,
              byteLength: evidence.byte_length,
              sha256: evidence.sha256,
            },
          ],
    ),
  ];
}

export function reconstructPublicReplayRecord(
  record: ReplayRecord,
  chunks: readonly ForgeInterchangeArtifactChunk[],
): Buffer {
  const parsed = chunks.map((chunk) =>
    ForgeInterchangeArtifactChunkSchema.parse(chunk),
  );
  const ordered = [...parsed].sort((left, right) => left.offset - right.offset);
  let expectedOffset = 0;
  const buffers: Buffer[] = [];
  for (const chunk of ordered) {
    if (chunk.record_kind !== record.recordKind)
      throw new Error(`${record.id}: record kind drifted.`);
    if (chunk.artifact_id !== record.id)
      throw new Error(`${record.id}: chunk identity drifted.`);
    if (chunk.artifact_sha256 !== record.sha256)
      throw new Error(`${record.id}: record digest binding drifted.`);
    if (chunk.offset !== expectedOffset)
      throw new Error(`${record.id}: chunk sequence is not gap-free.`);
    const bytes = Buffer.from(chunk.bytes_base64, 'base64');
    if (bytes.byteLength !== chunk.length)
      throw new Error(`${record.id}: decoded chunk length drifted.`);
    const chunkDigest = createHash('sha256').update(bytes).digest('hex');
    if (chunkDigest !== chunk.chunk_sha256)
      throw new Error(`${record.id}: chunk digest drifted.`);
    expectedOffset += bytes.byteLength;
    buffers.push(bytes);
  }
  const reconstructed = Buffer.concat(buffers);
  if (
    expectedOffset !== record.byteLength ||
    reconstructed.byteLength !== record.byteLength
  )
    throw new Error(`${record.id}: reconstructed byte length drifted.`);
  const digest = createHash('sha256').update(reconstructed).digest('hex');
  if (digest !== record.sha256)
    throw new Error(`${record.id}: reconstructed digest drifted.`);
  return reconstructed;
}
