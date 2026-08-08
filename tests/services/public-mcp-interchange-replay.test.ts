import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import type {
  ForgeAssetInterchangeManifest,
  ForgeInterchangeArtifactChunk,
} from '../../src/contracts/index.js';
import {
  parsePublicMcpEnvelope,
  recordsForPublicReplay,
  reconstructPublicReplayRecord,
} from '../../src/services/public-mcp-interchange-replay.js';

const digest = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');

describe('public MCP interchange replay helpers', () => {
  it('rejects transport and envelope failures', () => {
    const failed = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ok: false,
            affectedIds: [],
            summary: 'no',
            issues: [],
          }),
        },
      ],
      isError: true,
    };
    expect(() => parsePublicMcpEnvelope(failed)).toThrow(/transport marked/);
  });

  it('plans every artifact and only byte-addressable evidence record', () => {
    const manifest = {
      artifacts: [{ id: 'frame.n', byte_length: 3, sha256: digest('abc') }],
      evidence: [
        {
          id: 'workflow.public-mcp',
          byte_length: 2,
          sha256: digest('ok'),
        },
        { id: 'review.manual', sha256: digest('review') },
      ],
    } as ForgeAssetInterchangeManifest;
    expect(recordsForPublicReplay(manifest)).toEqual([
      {
        id: 'frame.n',
        recordKind: 'artifact',
        byteLength: 3,
        sha256: digest('abc'),
      },
      {
        id: 'workflow.public-mcp',
        recordKind: 'evidence',
        byteLength: 2,
        sha256: digest('ok'),
      },
    ]);
  });

  it('reconstructs ordered digest-bound chunks and rejects gaps', () => {
    const bytes = Buffer.from('abcdef');
    const record = {
      id: 'frame.n',
      recordKind: 'artifact' as const,
      byteLength: bytes.byteLength,
      sha256: digest(bytes),
    };
    const chunks = [
      chunk(record, bytes.subarray(3), 3),
      chunk(record, bytes.subarray(0, 3), 0),
    ];
    expect(reconstructPublicReplayRecord(record, chunks).equals(bytes)).toBe(
      true,
    );
    expect(() => reconstructPublicReplayRecord(record, [chunks[0]!])).toThrow(
      /gap-free/,
    );
  });
});

function chunk(
  record: {
    id: string;
    recordKind: 'artifact' | 'evidence';
    sha256: string;
  },
  bytes: Buffer,
  offset: number,
): ForgeInterchangeArtifactChunk {
  return {
    record_kind: record.recordKind,
    asset_id: 'adventurer.rustic',
    revision_id: `revision.${'a'.repeat(64)}`,
    artifact_id: record.id,
    artifact_sha256: record.sha256,
    chunk_sha256: digest(bytes),
    offset,
    length: bytes.byteLength,
    total: 6,
    bytes_base64: bytes.toString('base64'),
  };
}
