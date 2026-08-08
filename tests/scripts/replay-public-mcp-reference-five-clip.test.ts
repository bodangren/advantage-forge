import { describe, expect, it } from 'vitest';

import { serializePublicReferenceFiveClipRetrieval } from '../../scripts/replay-public-mcp-reference-five-clip.js';

describe('public MCP reference-five retrieval evidence', () => {
  it('writes the verified manifest digest at the top-level without changing public records', () => {
    const manifestSha256 = 'a'.repeat(64);
    const manifest = {
      contractId: 'forge-temporal-render-batch-artifacts/v1',
      deliveryId: 'delivery.example',
      frames: [{ id: 'frame.example', sha256: 'b'.repeat(64) }],
    };
    const chunks = [
      {
        delivery_id: 'delivery.example',
        artifact_id: 'frame.example',
        artifact_sha256: 'b'.repeat(64),
        chunk_sha256: 'c'.repeat(64),
        offset: 0,
        length: 3,
        total: 3,
        bytes_base64: 'AQID',
      },
    ];

    const serialized = serializePublicReferenceFiveClipRetrieval(
      'delivery.example',
      manifestSha256,
      manifest,
      chunks,
    );
    const record = JSON.parse(serialized) as Record<string, unknown>;

    expect(serialized.endsWith('\n')).toBe(true);
    expect(Object.keys(record)).toEqual([
      'deliveryId',
      'manifestSha256',
      'manifest',
      'chunks',
    ]);
    expect(record).toEqual({
      deliveryId: 'delivery.example',
      manifestSha256,
      manifest,
      chunks,
    });
  });
});
