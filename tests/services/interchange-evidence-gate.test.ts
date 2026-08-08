import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { auditInterchangeEvidenceBundle } from '../../src/services/interchange-evidence-gate.js';

const EVIDENCE_DIRECTORY = resolve(
  import.meta.dirname,
  '../../measure/tracks/engine_interop_evidence_20260719/s2-live-evidence',
);

interface Fixture {
  manifest: Record<string, unknown>;
  publicCallLedger: Record<string, unknown>;
  workflowEvidenceBytes: Uint8Array;
  educationProfile: Record<string, unknown>;
}

async function readJson(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve(EVIDENCE_DIRECTORY, name), 'utf8'),
  ) as Record<string, unknown>;
}

async function fixture(): Promise<Fixture> {
  return {
    manifest: await readJson('interchange-manifest.json'),
    publicCallLedger: await readJson('public-call-ledger.json'),
    workflowEvidenceBytes: await readFile(
      resolve(EVIDENCE_DIRECTORY, 'workflow-evidence.json'),
    ),
    educationProfile: await readJson('education-app-pack-profile.json'),
  };
}

describe('interchange delivery-claim evidence gate', () => {
  it('accepts the exact manifest-bound public-MCP pilot and downstream handoff', async () => {
    const result = await auditInterchangeEvidenceBundle(await fixture());

    expect(result).toEqual({
      ok: true,
      failures: [],
      summary: {
        artifact_count: 9,
        evidence_count: 1,
        retrieved_record_count: 10,
        downstream_member_count: 9,
      },
    });
  });

  it('fails closed when the canonical manifest digest drifts', async () => {
    const input = await fixture();
    input.manifest['manifest_sha256'] = '0'.repeat(64);

    const result = await auditInterchangeEvidenceBundle(input);

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'manifest.closed-canonical-digest',
        path: '$.manifest',
      }),
    );
  });

  it('names a stale ledger identity and a non-public operation', async () => {
    const input = await fixture();
    input.publicCallLedger['revision_id'] =
      'revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const calls = input.publicCallLedger['calls'] as Array<
      Record<string, unknown>
    >;
    calls[0] = {
      ...calls[0],
      operation: 'internal_handler',
      arguments: { internal_handler: 'src/tools/handlers.ts' },
    };

    const result = await auditInterchangeEvidenceBundle(input);

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clause: 'public-mcp.pinned-identity' }),
        expect.objectContaining({
          clause: 'public-mcp.operation-allowlist',
        }),
        expect.objectContaining({
          clause: 'public-mcp.boundary-indicator',
        }),
      ]),
    );
  });

  it('attributes incomplete chunk coverage to the exact artifact', async () => {
    const input = await fixture();
    const calls = input.publicCallLedger['calls'] as Array<
      Record<string, unknown>
    >;
    input.publicCallLedger['calls'] = calls.filter((call) => {
      const args = call['arguments'] as Record<string, unknown>;
      return !(args['artifact_id'] === 'model.glb' && args['offset'] === 32768);
    });
    input.publicCallLedger['call_count'] = 16;

    const result = await auditInterchangeEvidenceBundle(input);

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'public-mcp.record-coverage',
        record_id: 'model.glb',
      }),
    );
  });

  it('binds workflow evidence to exact manifest bytes', async () => {
    const input = await fixture();
    input.workflowEvidenceBytes = new Uint8Array([
      ...input.workflowEvidenceBytes,
      0x0a,
    ]);

    const result = await auditInterchangeEvidenceBundle(input);

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'workflow-evidence.byte-binding',
        record_id: 'workflow.public-mcp',
      }),
    );
  });

  it('attributes downstream digest drift to the exact Forge source artifact', async () => {
    const input = await fixture();
    const members = input.educationProfile['members'] as Array<
      Record<string, unknown>
    >;
    members[0] = { ...members[0], sha256: '0'.repeat(64) };

    const result = await auditInterchangeEvidenceBundle(input);

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'downstream.source-binding',
        record_id: 'frame.n',
      }),
    );
  });

  it('fails explicitly when required evidence inputs are missing', async () => {
    const result = await auditInterchangeEvidenceBundle({
      manifest: undefined,
      publicCallLedger: undefined,
      workflowEvidenceBytes: undefined,
      educationProfile: undefined,
    });

    expect(result.ok).toBe(false);
    expect(result.failures.map(({ clause }) => clause)).toEqual(
      expect.arrayContaining([
        'manifest.closed-canonical-digest',
        'public-mcp.ledger-shape',
        'workflow-evidence.missing',
        'downstream.profile-shape',
      ]),
    );
  });

  it('rejects the legacy raw replay-call array instead of treating it as a ledger', async () => {
    const input = await fixture();
    const normalized = input.publicCallLedger;

    const result = await auditInterchangeEvidenceBundle({
      ...input,
      publicCallLedger: normalized['calls'],
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'public-mcp.ledger-shape',
        path: '$.publicCallLedger',
      }),
    );
  });
});
