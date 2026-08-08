import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, it } from 'vitest';

import { auditInterchangeEvidenceBundle } from '../../src/services/interchange-evidence-gate.js';

const EVIDENCE_DIRECTORY = resolve(
  import.meta.dirname,
  '../../measure/tracks/engine_interop_evidence_20260719/s2-live-evidence',
);

async function json(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve(EVIDENCE_DIRECTORY, name), 'utf8'),
  ) as Record<string, unknown>;
}

it('rejects a chunk record whose individual chunk digest is missing', async () => {
  const publicCallLedger = await json('public-call-ledger.json');
  const calls = publicCallLedger['calls'] as Array<Record<string, unknown>>;
  const chunkIndex = calls.findIndex(
    ({ operation }) => operation === 'get_interchange_artifact_chunk',
  );
  const chunk = { ...calls[chunkIndex] };
  delete chunk['chunk_sha256'];
  calls[chunkIndex] = chunk;

  const result = await auditInterchangeEvidenceBundle({
    manifest: await json('interchange-manifest.json'),
    publicCallLedger,
    workflowEvidenceBytes: await readFile(
      resolve(EVIDENCE_DIRECTORY, 'workflow-evidence.json'),
    ),
    educationProfile: await json('education-app-pack-profile.json'),
  });

  expect(result.ok).toBe(false);
  expect(result.failures).toContainEqual(
    expect.objectContaining({
      clause: 'public-mcp.chunk-binding',
      record_id: 'frame.n',
    }),
  );
});
