import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_INTERCHANGE_DELIVERY_CLAIM_SHA256,
  auditClaimBoundInterchangeEvidence,
  type ClaimBoundEvidenceInput,
} from '../../src/services/claim-bound-interchange-gate.js';
import { interchangeClaimImplementationPaths } from '../../src/services/interchange-claim-files.js';

const ROOT = resolve(import.meta.dirname, '../..');
const CLAIM_PATH =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/delivery-claim.json';
const MANIFEST_PATH =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/interchange-manifest.json';
const LEDGER_PATH =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/public-call-ledger.json';
const WORKFLOW_PATH =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/workflow-evidence.json';
const PROFILE_PATH =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/education-app-pack-profile.json';

async function input(): Promise<ClaimBoundEvidenceInput> {
  const claimBytes = await readFile(resolve(ROOT, CLAIM_PATH));
  const claim = json(claimBytes);
  const paths = [
    claim['evidence_files'],
    claim['implementation_files'],
  ].flat() as Array<Record<string, unknown>>;
  const entries = await Promise.all(
    paths.map(
      async (file) =>
        [
          file['path'] as string,
          await readFile(resolve(ROOT, file['path'] as string)),
        ] as const,
    ),
  );
  return {
    claimBytes,
    files: Object.fromEntries(entries),
    expectedImplementationPaths: await interchangeClaimImplementationPaths(),
  };
}

function json(bytes: Uint8Array): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

function bytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, undefined, 2)}\n`);
}

function replaceFile(
  source: ClaimBoundEvidenceInput,
  path: string,
  value: Uint8Array,
): ClaimBoundEvidenceInput {
  return { ...source, files: { ...source.files, [path]: value } };
}

describe('claim-bound Forge interchange delivery gate', () => {
  it('accepts the exact immutable dossier and implementation claim', async () => {
    const source = await input();
    const claim = json(source.claimBytes!);
    const result = await auditClaimBoundInterchangeEvidence(source);

    expect(result).toEqual({
      ok: true,
      failures: [],
      summary: {
        claim_sha256: ACCEPTED_INTERCHANGE_DELIVERY_CLAIM_SHA256,
        evidence_file_count: 4,
        implementation_file_count: (claim['implementation_files'] as unknown[])
          .length,
        artifact_count: 9,
        evidence_count: 1,
        retrieved_record_count: 10,
        downstream_member_count: 9,
      },
    });
  });

  it('rejects an arbitrary changed chunk digest through the accepted ledger claim', async () => {
    const source = await input();
    const ledger = json(source.files[LEDGER_PATH]!);
    const calls = ledger['calls'] as Array<Record<string, unknown>>;
    const chunk = calls.find(
      ({ operation }) => operation === 'get_interchange_artifact_chunk',
    )!;
    chunk['chunk_sha256'] = '0'.repeat(64);

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, LEDGER_PATH, bytes(ledger)),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'delivery-claim.file-drift',
        record_id: LEDGER_PATH,
      }),
    );
  });

  it('rejects a missing per-chunk digest with the exact artifact ID', async () => {
    const source = await input();
    const ledger = json(source.files[LEDGER_PATH]!);
    const calls = ledger['calls'] as Array<Record<string, unknown>>;
    const chunk = calls.find(
      ({ operation }) => operation === 'get_interchange_artifact_chunk',
    )!;
    delete chunk['chunk_sha256'];

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, LEDGER_PATH, bytes(ledger)),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'public-mcp.chunk-binding',
        record_id: 'frame.n',
      }),
    );
  });

  it('rejects a root-level private boundary field before schema stripping', async () => {
    const source = await input();
    const ledger = json(source.files[LEDGER_PATH]!);
    ledger['internal_handler'] = '/home/user/forge/src/tools/handlers.ts';

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, LEDGER_PATH, bytes(ledger)),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clause: 'public-mcp.raw-boundary-indicator',
        }),
        expect.objectContaining({
          clause: 'public-mcp.ledger-unknown-field',
        }),
      ]),
    );
  });

  it('scans raw workflow evidence for private-boundary indicators', async () => {
    const source = await input();
    const workflow = json(source.files[WORKFLOW_PATH]!);
    workflow['source_import'] = 'src/internal/producer.ts';

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, WORKFLOW_PATH, bytes(workflow)),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'public-mcp.raw-boundary-indicator',
        path: '$.workflowEvidence.source_import',
      }),
    );
  });

  it('recomputes and rejects a downstream profile digest mismatch', async () => {
    const source = await input();
    const profile = json(source.files[PROFILE_PATH]!);
    profile['profile_sha256'] = '0'.repeat(64);

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, PROFILE_PATH, bytes(profile)),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'downstream.profile-canonical-digest',
      }),
    );
  });

  it('attributes a manifest record defect to its artifact ID', async () => {
    const source = await input();
    const manifest = json(source.files[MANIFEST_PATH]!);
    const artifacts = manifest['artifacts'] as Array<Record<string, unknown>>;
    artifacts[0] = { ...artifacts[0], transparent: false };

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, MANIFEST_PATH, bytes(manifest)),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'manifest.record-contract',
        record_id: 'frame.n',
      }),
    );
  });

  it('rejects stale implementation bytes even when evidence is unchanged', async () => {
    const source = await input();
    const path = 'src/tools/handlers.ts';
    const stale = new Uint8Array([...source.files[path]!, 0x0a]);

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, path, stale),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'delivery-claim.file-drift',
        record_id: path,
      }),
    );
  });

  it('rejects a newly added producer path that is absent from the accepted claim', async () => {
    const source = await input();
    const claim = json(source.claimBytes!);
    const claimedImplementationPaths = (
      claim['implementation_files'] as Array<{ path: string }>
    ).map(({ path }) => path);
    const unclaimedPath = 'src/new-unclaimed-producer.ts';

    const result = await auditClaimBoundInterchangeEvidence({
      ...source,
      expectedImplementationPaths: [
        ...claimedImplementationPaths,
        unclaimedPath,
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual({
      clause: 'delivery-claim.implementation-inventory',
      path: '$.deliveryClaim.implementation_files',
      message: 'Delivery claim omits a current producer path.',
      record_id: unclaimedPath,
    });
  });

  it('binds a transitive renderer dependency into freshness evidence', async () => {
    const source = await input();
    const path = 'src/render/camera.ts';
    const stale = new Uint8Array([...source.files[path]!, 0x0a]);

    const result = await auditClaimBoundInterchangeEvidence(
      replaceFile(source, path, stale),
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        clause: 'delivery-claim.file-drift',
        record_id: path,
      }),
    );
  });

  it('rejects a missing or unaccepted delivery claim', async () => {
    const source = await input();
    const missing = await auditClaimBoundInterchangeEvidence({
      ...source,
      claimBytes: undefined,
    });
    expect(missing.ok).toBe(false);
    expect(missing.failures).toContainEqual(
      expect.objectContaining({ clause: 'delivery-claim.closed-shape' }),
    );

    const claim = json(source.claimBytes!);
    claim['claim_sha256'] = '0'.repeat(64);
    const changed = await auditClaimBoundInterchangeEvidence({
      ...source,
      claimBytes: bytes(claim),
    });
    expect(changed.ok).toBe(false);
    expect(changed.failures).toContainEqual(
      expect.objectContaining({ clause: 'delivery-claim.accepted-digest' }),
    );
  });
});
