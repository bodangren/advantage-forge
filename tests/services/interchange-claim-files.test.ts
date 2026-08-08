import { describe, expect, it } from 'vitest';

import {
  interchangeClaimFileCandidates,
  readInterchangeClaimFile,
} from '../../src/services/interchange-claim-files.js';

describe('interchange delivery-claim file resolution', () => {
  it('resolves immutable track evidence before and after Measure archival', () => {
    expect(
      interchangeClaimFileCandidates(
        'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/delivery-claim.json',
      ),
    ).toEqual([
      'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/delivery-claim.json',
      'measure/archive/engine_interop_evidence_20260719/s2-live-evidence/delivery-claim.json',
    ]);
  });

  it('falls back to the archived physical path while preserving the logical claim path', async () => {
    const attempts: string[] = [];
    const bytes = await readInterchangeClaimFile(
      'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/interchange-manifest.json',
      async (path) => {
        attempts.push(path);
        if (path.startsWith('measure/tracks/')) {
          const error = new Error('missing') as Error & { code: string };
          error.code = 'ENOENT';
          throw error;
        }
        return new TextEncoder().encode('archive');
      },
    );

    expect(new TextDecoder().decode(bytes)).toBe('archive');
    expect(attempts).toEqual([
      'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/interchange-manifest.json',
      'measure/archive/engine_interop_evidence_20260719/s2-live-evidence/interchange-manifest.json',
    ]);
  });

  it('does not rewrite producer source paths', () => {
    expect(interchangeClaimFileCandidates('src/render/camera.ts')).toEqual([
      'src/render/camera.ts',
    ]);
  });
});
