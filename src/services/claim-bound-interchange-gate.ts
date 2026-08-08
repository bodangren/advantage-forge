import { createHash } from 'node:crypto';

import { z } from 'zod';

import { ForgeAssetInterchangeManifestSchema } from '../contracts/index.js';
import {
  auditInterchangeEvidenceBundle,
  type InterchangeEvidenceFailure,
} from './interchange-evidence-gate.js';

export const ACCEPTED_INTERCHANGE_DELIVERY_CLAIM_SHA256 =
  'dd6a48f74ebc37bea5036a2b1592a2a8ea35f10d027109d65a4b94e586c303f3' as const;

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const RevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const PortablePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !value.startsWith('/') &&
      !value.includes('\\') &&
      !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
      value
        .split('/')
        .every(
          (segment) => segment !== '' && segment !== '.' && segment !== '..',
        ),
    'Claim path must be a portable repository-relative POSIX path.',
  );

const ClaimedFileSchema = z.strictObject({
  path: PortablePathSchema,
  byte_length: z.number().int().positive(),
  sha256: Sha256Schema,
});

const DeliveryClaimSchema = z.strictObject({
  contract_id: z.literal('forge-interchange-delivery-claim/v1'),
  claim_sha256: Sha256Schema,
  source: z.strictObject({
    asset_id: z.string().min(1),
    revision_id: RevisionIdSchema,
    manifest_sha256: Sha256Schema,
    education_profile_sha256: Sha256Schema,
  }),
  evidence_files: z
    .array(
      ClaimedFileSchema.extend({
        id: z.enum([
          'manifest',
          'public-call-ledger',
          'workflow-evidence',
          'education-profile',
        ]),
      }),
    )
    .length(4),
  implementation_files: z.array(ClaimedFileSchema).min(1),
});

type DeliveryClaim = z.infer<typeof DeliveryClaimSchema>;

export interface ClaimBoundEvidenceInput {
  readonly claimBytes: Uint8Array | undefined;
  readonly files: Readonly<Record<string, Uint8Array | undefined>>;
  readonly expectedImplementationPaths: readonly string[];
}

export interface ClaimBoundEvidenceResult {
  readonly ok: boolean;
  readonly failures: readonly InterchangeEvidenceFailure[];
  readonly summary: {
    readonly claim_sha256: string | undefined;
    readonly evidence_file_count: number;
    readonly implementation_file_count: number;
    readonly artifact_count: number;
    readonly evidence_count: number;
    readonly retrieved_record_count: number;
    readonly downstream_member_count: number;
  };
}

const LEDGER_KEYS = new Set([
  'asset_id',
  'boundary',
  'call_count',
  'calls',
  'manifest_sha256',
  'retrieval_validation',
  'revision_id',
  'sanitization',
]);

const CALL_KEYS = new Set([
  'sequence',
  'operation',
  'arguments',
  'ok',
  'summary',
  'affected_ids',
  'revision_id',
  'validation',
  'part_count',
  'triangle_count',
  'triangle_budget',
  'manifest_sha256',
  'artifact_count',
  'evidence_count',
  'chunk_sha256',
  'artifact_sha256',
  'total',
]);

const BOUNDARY_KEYS = new Set([
  'absolute_path',
  'filesystem_path',
  'internal_handler',
  'private_endpoint',
  'shared_filesystem',
  'source_import',
]);

function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalValue(entry)]),
  );
}

function claimDigest(claim: DeliveryClaim): string {
  const unsigned = Object.fromEntries(
    Object.entries(claim).filter(([key]) => key !== 'claim_sha256'),
  );
  return sha256(JSON.stringify(canonicalValue(unsigned)));
}

function educationProfileDigest(profile: Record<string, unknown>): string {
  const unsigned = Object.fromEntries(
    Object.entries(profile).filter(([key]) => key !== 'profile_sha256'),
  );
  return sha256(JSON.stringify(canonicalValue(unsigned)));
}

function parseJson(bytes: Uint8Array | undefined): unknown {
  if (bytes === undefined) return undefined;
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { invalid_json: true };
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function boundaryIndicator(value: unknown, path = '$'): string | undefined {
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const result = boundaryIndicator(entry, `${path}[${index}]`);
      if (result !== undefined) return result;
    }
    return undefined;
  }
  const object = record(value);
  if (object === undefined) return undefined;
  for (const [key, entry] of Object.entries(object)) {
    const entryPath = `${path}.${key}`;
    if (BOUNDARY_KEYS.has(key)) return entryPath;
    if (
      typeof entry === 'string' &&
      (entry.startsWith('/') ||
        /^[A-Za-z]:[\\/]/.test(entry) ||
        entry.startsWith('file:'))
    )
      return entryPath;
    const nested = boundaryIndicator(entry, entryPath);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): readonly string[] {
  return Object.keys(value).filter((key) => !allowed.has(key));
}

function manifestIssueRecordId(
  issue: z.core.$ZodIssue,
  manifest: Record<string, unknown>,
): string | undefined {
  if (issue.path[0] !== 'artifacts' && issue.path[0] !== 'evidence')
    return undefined;
  const index = issue.path[1];
  if (typeof index !== 'number') return undefined;
  const collection = manifest[issue.path[0]];
  if (!Array.isArray(collection)) return undefined;
  const item = record(collection[index]);
  return typeof item?.['id'] === 'string' ? item['id'] : undefined;
}

export async function auditClaimBoundInterchangeEvidence(
  input: ClaimBoundEvidenceInput,
): Promise<ClaimBoundEvidenceResult> {
  const failures: InterchangeEvidenceFailure[] = [];
  const fail = (
    clause: string,
    path: string,
    message: string,
    recordId?: string,
  ): void => {
    failures.push({
      clause,
      path,
      message,
      ...(recordId === undefined ? {} : { record_id: recordId }),
    });
  };

  const claimResult = DeliveryClaimSchema.safeParse(
    parseJson(input.claimBytes),
  );
  if (!claimResult.success) {
    fail(
      'delivery-claim.closed-shape',
      '$.deliveryClaim',
      claimResult.error.issues[0]?.message ?? 'Delivery claim is missing.',
    );
    return {
      ok: false,
      failures,
      summary: {
        claim_sha256: undefined,
        evidence_file_count: 0,
        implementation_file_count: 0,
        artifact_count: 0,
        evidence_count: 0,
        retrieved_record_count: 0,
        downstream_member_count: 0,
      },
    };
  }
  const claim = claimResult.data;
  const actualClaimDigest = claimDigest(claim);
  if (
    claim.claim_sha256 !== actualClaimDigest ||
    claim.claim_sha256 !== ACCEPTED_INTERCHANGE_DELIVERY_CLAIM_SHA256
  )
    fail(
      'delivery-claim.accepted-digest',
      '$.deliveryClaim.claim_sha256',
      'Delivery claim is not the accepted canonical immutable claim.',
    );

  const claimedFiles = [...claim.evidence_files, ...claim.implementation_files];
  const claimedImplementationPaths = claim.implementation_files.map(
    ({ path }) => path,
  );
  const expectedImplementationPaths = [
    ...input.expectedImplementationPaths,
  ].sort();
  const claimedImplementationSet = new Set(claimedImplementationPaths);
  const expectedImplementationSet = new Set(expectedImplementationPaths);
  const missingImplementationPath = expectedImplementationPaths.find(
    (path) => !claimedImplementationSet.has(path),
  );
  const unexpectedImplementationPath = claimedImplementationPaths.find(
    (path) => !expectedImplementationSet.has(path),
  );
  if (
    missingImplementationPath !== undefined ||
    unexpectedImplementationPath !== undefined ||
    claimedImplementationPaths.length !== expectedImplementationPaths.length
  ) {
    const recordId = missingImplementationPath ?? unexpectedImplementationPath;
    fail(
      'delivery-claim.implementation-inventory',
      '$.deliveryClaim.implementation_files',
      missingImplementationPath === undefined
        ? 'Delivery claim contains a producer path that is no longer in the current inventory.'
        : 'Delivery claim omits a current producer path.',
      recordId,
    );
  }
  for (const file of claimedFiles) {
    const bytes = input.files[file.path];
    if (bytes === undefined) {
      fail(
        'delivery-claim.file-missing',
        `$.files[${JSON.stringify(file.path)}]`,
        'A claim-bound file is missing.',
        file.path,
      );
      continue;
    }
    if (bytes.byteLength !== file.byte_length || sha256(bytes) !== file.sha256)
      fail(
        'delivery-claim.file-drift',
        `$.files[${JSON.stringify(file.path)}]`,
        'A claim-bound evidence or implementation file is stale.',
        file.path,
      );
  }

  const evidenceById = new Map(
    claim.evidence_files.map((file) => [file.id, input.files[file.path]]),
  );
  const manifestInput = parseJson(evidenceById.get('manifest'));
  const ledgerInput = parseJson(evidenceById.get('public-call-ledger'));
  const workflowEvidenceBytes = evidenceById.get('workflow-evidence');
  const workflowEvidenceInput = parseJson(workflowEvidenceBytes);
  const educationProfileInput = parseJson(
    evidenceById.get('education-profile'),
  );

  for (const [name, value] of [
    ['manifest', manifestInput],
    ['publicCallLedger', ledgerInput],
    ['workflowEvidence', workflowEvidenceInput],
    ['educationProfile', educationProfileInput],
  ] as const) {
    const indicator = boundaryIndicator(value, `$.${name}`);
    if (indicator !== undefined)
      fail(
        'public-mcp.raw-boundary-indicator',
        indicator,
        'Raw evidence contains a prohibited path or private-boundary indicator.',
      );
  }

  const manifestObject = record(manifestInput);
  if (manifestObject !== undefined) {
    const structural =
      ForgeAssetInterchangeManifestSchema.safeParse(manifestObject);
    if (!structural.success)
      for (const issue of structural.error.issues)
        fail(
          manifestIssueRecordId(issue, manifestObject) === undefined
            ? 'manifest.contract'
            : 'manifest.record-contract',
          `$.manifest.${issue.path.join('.')}`,
          issue.message,
          manifestIssueRecordId(issue, manifestObject),
        );
  }

  const ledgerObject = record(ledgerInput);
  if (ledgerObject !== undefined) {
    for (const key of exactKeys(ledgerObject, LEDGER_KEYS))
      fail(
        'public-mcp.ledger-unknown-field',
        `$.publicCallLedger.${key}`,
        'Public call ledger contains an unknown top-level field.',
      );
    const calls = ledgerObject['calls'];
    if (Array.isArray(calls))
      for (const [index, value] of calls.entries()) {
        const call = record(value);
        if (call === undefined) continue;
        for (const key of exactKeys(call, CALL_KEYS))
          fail(
            'public-mcp.call-unknown-field',
            `$.publicCallLedger.calls[${index}].${key}`,
            'Public call evidence contains an unknown field.',
          );
        if (
          call['operation'] === 'get_interchange_artifact_chunk' &&
          (typeof call['chunk_sha256'] !== 'string' ||
            !/^[a-f0-9]{64}$/.test(call['chunk_sha256']))
        ) {
          const arguments_ = record(call['arguments']);
          fail(
            'public-mcp.chunk-binding',
            `$.publicCallLedger.calls[${index}].chunk_sha256`,
            'Every chunk retrieval requires its recorded lowercase SHA-256.',
            typeof arguments_?.['artifact_id'] === 'string'
              ? arguments_['artifact_id']
              : undefined,
          );
        }
      }
  }

  const profileObject = record(educationProfileInput);
  if (profileObject !== undefined) {
    const expected = educationProfileDigest(profileObject);
    if (
      profileObject['profile_sha256'] !== expected ||
      profileObject['profile_sha256'] !== claim.source.education_profile_sha256
    )
      fail(
        'downstream.profile-canonical-digest',
        '$.educationProfile.profile_sha256',
        'Education profile canonical digest is missing, stale, or mismatched.',
      );
  }

  const manifest = ForgeAssetInterchangeManifestSchema.safeParse(manifestInput);
  if (manifest.success) {
    if (
      manifest.data.source.asset_id !== claim.source.asset_id ||
      manifest.data.source.revision_id !== claim.source.revision_id ||
      manifest.data.manifest_sha256 !== claim.source.manifest_sha256
    )
      fail(
        'delivery-claim.pinned-source',
        '$.deliveryClaim.source',
        'Claim source identity does not match the manifest.',
      );
    const workflowRecord = manifest.data.evidence.find(
      (entry) =>
        entry.kind === 'workflow' &&
        entry.reference === manifest.data.provenance.workflow_reference,
    );
    if (workflowRecord === undefined)
      fail(
        'workflow-evidence.provenance-binding',
        '$.manifest.provenance.workflow_reference',
        'Provenance does not point to the exact manifest-bound workflow record.',
      );
  }

  const base = await auditInterchangeEvidenceBundle({
    manifest: manifestInput,
    publicCallLedger: ledgerInput,
    workflowEvidenceBytes,
    educationProfile: educationProfileInput,
  });
  failures.push(...base.failures);

  return {
    ok: failures.length === 0,
    failures,
    summary: {
      claim_sha256: claim.claim_sha256,
      evidence_file_count: claim.evidence_files.length,
      implementation_file_count: claim.implementation_files.length,
      ...base.summary,
    },
  };
}
