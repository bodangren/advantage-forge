import { createHash } from 'node:crypto';

import { z } from 'zod';

import {
  FORGE_ASSET_INTERCHANGE_CONTRACT_ID,
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  parseForgeAssetInterchangeManifest,
  type ForgeAssetInterchangeManifest,
} from '../contracts/index.js';

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const RevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);

const PublicCallSchema = z.object({
  sequence: z.number().int().positive(),
  operation: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()),
  ok: z.boolean(),
  manifest_sha256: Sha256Schema.optional(),
  artifact_count: z.number().int().nonnegative().optional(),
  evidence_count: z.number().int().nonnegative().optional(),
  artifact_sha256: Sha256Schema.optional(),
  chunk_sha256: Sha256Schema.optional(),
  total: z.number().int().positive().optional(),
});

const PublicLedgerSchema = z.object({
  asset_id: z.string().min(1),
  revision_id: RevisionIdSchema,
  manifest_sha256: Sha256Schema,
  call_count: z.number().int().positive(),
  boundary: z.string().min(1),
  sanitization: z.object({
    base64_payloads_omitted: z.literal(true),
    host_paths_omitted: z.literal(true),
    public_arguments_preserved: z.literal(true),
    response_digests_preserved: z.literal(true),
  }),
  retrieval_validation: z.object({
    retrieved_record_count: z.number().int().positive(),
    retrieved_bytes: z.number().int().positive(),
    chunk_digests_verified: z.literal(true),
    reassembled_record_digests_verified: z.literal(true),
    manifest_allowlist_enforced: z.literal(true),
  }),
  calls: z.array(PublicCallSchema).min(1),
});

const WorkflowEvidenceSchema = z.strictObject({
  contract_id: z.literal('forge-public-mcp-workflow-evidence/v1'),
  asset_id: z.string().min(1),
  revision_id: RevisionIdSchema,
  source_operations: z.array(z.string()).min(1),
  retrieval_operations: z.array(z.string()).min(1),
});

const EducationMemberSchema = z.object({
  id: z.string().min(1),
  media_type: z.string().min(1),
  byte_length: z.number().int().positive(),
  sha256: Sha256Schema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  transparent: z.boolean().optional(),
  source: z.object({
    kind: z.literal('forge'),
    contract_id: z.literal(FORGE_ASSET_INTERCHANGE_CONTRACT_ID),
    asset_id: z.string().min(1),
    revision_id: RevisionIdSchema,
    manifest_sha256: Sha256Schema,
    artifact_id: z.string().min(1),
    artifact_sha256: Sha256Schema,
    artifact_role: z.string().min(1),
    direction: z.string().optional(),
  }),
});

const EducationProfileSchema = z.object({
  contract_id: z.literal('education-app-pack-profile/v1'),
  profile_sha256: Sha256Schema,
  members: z.array(EducationMemberSchema).min(1),
});

const PUBLIC_OPERATIONS = new Set([
  'list_kits',
  'inspect_template',
  'create_asset',
  'inspect_asset',
  'compare_revisions',
  'apply_operations',
  'apply_accessory_operation',
  'search_accessories',
  'connect_parts',
  'set_pose',
  'validate_asset',
  'inspect_capabilities',
  'render_preview',
  'export_asset',
  'get_interchange_manifest',
  'get_interchange_artifact_chunk',
]);

const REQUIRED_OPERATIONS = [
  'render_preview',
  'export_asset',
  'get_interchange_manifest',
  'get_interchange_artifact_chunk',
] as const;

const BOUNDARY_KEYS = new Set([
  'absolute_path',
  'filesystem_path',
  'internal_handler',
  'private_endpoint',
  'shared_filesystem',
  'source_import',
]);

export interface InterchangeEvidenceFailure {
  readonly clause: string;
  readonly path: string;
  readonly message: string;
  readonly record_id?: string;
}

export interface InterchangeEvidenceGateResult {
  readonly ok: boolean;
  readonly failures: readonly InterchangeEvidenceFailure[];
  readonly summary: {
    readonly artifact_count: number;
    readonly evidence_count: number;
    readonly retrieved_record_count: number;
    readonly downstream_member_count: number;
  };
}

export interface InterchangeEvidenceBundle {
  readonly manifest: unknown;
  readonly publicCallLedger: unknown;
  readonly workflowEvidenceBytes: Uint8Array | undefined;
  readonly educationProfile: unknown;
}

function boundaryIndicator(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const result = boundaryIndicator(entry);
      if (result !== undefined) return result;
    }
    return undefined;
  }
  if (value === null || typeof value !== 'object') return undefined;
  for (const [key, entry] of Object.entries(value)) {
    if (BOUNDARY_KEYS.has(key)) return key;
    if (
      typeof entry === 'string' &&
      (entry.startsWith('/') ||
        /^[A-Za-z]:[\\/]/.test(entry) ||
        entry.startsWith('file:'))
    )
      return `${key}=${entry}`;
    const nested = boundaryIndicator(entry);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function recordLength(
  record:
    | ForgeAssetInterchangeManifest['artifacts'][number]
    | ForgeAssetInterchangeManifest['evidence'][number],
): number | undefined {
  return 'byte_length' in record ? record.byte_length : undefined;
}

function sameOptional<T>(left: T | undefined, right: T | undefined): boolean {
  return left === right;
}

export async function auditInterchangeEvidenceBundle(
  bundle: InterchangeEvidenceBundle,
): Promise<InterchangeEvidenceGateResult> {
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

  let manifest: ForgeAssetInterchangeManifest | undefined;
  try {
    manifest = await parseForgeAssetInterchangeManifest(bundle.manifest);
  } catch (error) {
    fail(
      'manifest.closed-canonical-digest',
      '$.manifest',
      error instanceof Error ? error.message : 'Manifest validation failed.',
    );
  }

  const ledgerResult = PublicLedgerSchema.safeParse(bundle.publicCallLedger);
  if (!ledgerResult.success)
    fail(
      'public-mcp.ledger-shape',
      '$.publicCallLedger',
      ledgerResult.error.issues[0]?.message ?? 'Public call ledger is missing.',
    );
  const ledger = ledgerResult.success ? ledgerResult.data : undefined;

  const profileResult = EducationProfileSchema.safeParse(
    bundle.educationProfile,
  );
  if (!profileResult.success)
    fail(
      'downstream.profile-shape',
      '$.educationProfile',
      profileResult.error.issues[0]?.message ??
        'Education-app profile is missing.',
    );
  const profile = profileResult.success ? profileResult.data : undefined;

  let workflowEvidence: z.infer<typeof WorkflowEvidenceSchema> | undefined;
  if (bundle.workflowEvidenceBytes === undefined)
    fail(
      'workflow-evidence.missing',
      '$.workflowEvidenceBytes',
      'Manifest-bound workflow evidence bytes are missing.',
    );
  else {
    try {
      workflowEvidence = WorkflowEvidenceSchema.parse(
        JSON.parse(new TextDecoder().decode(bundle.workflowEvidenceBytes)),
      );
    } catch (error) {
      fail(
        'workflow-evidence.closed-shape',
        '$.workflowEvidenceBytes',
        error instanceof Error
          ? error.message
          : 'Workflow evidence parsing failed.',
      );
    }
  }

  if (manifest !== undefined && ledger !== undefined) {
    if (
      ledger.asset_id !== manifest.source.asset_id ||
      ledger.revision_id !== manifest.source.revision_id ||
      ledger.manifest_sha256 !== manifest.manifest_sha256
    )
      fail(
        'public-mcp.pinned-identity',
        '$.publicCallLedger',
        'Ledger asset, revision, or manifest digest is stale.',
      );
    if (ledger.boundary !== 'public MCP stdio only')
      fail(
        'public-mcp.boundary',
        '$.publicCallLedger.boundary',
        'The evidence ledger must declare the public MCP stdio-only boundary.',
      );
    if (ledger.call_count !== ledger.calls.length)
      fail(
        'public-mcp.call-count',
        '$.publicCallLedger.call_count',
        'Declared call count does not equal the recorded calls.',
      );

    for (const [index, call] of ledger.calls.entries()) {
      if (call.sequence !== index + 1)
        fail(
          'public-mcp.sequence',
          `$.publicCallLedger.calls[${index}].sequence`,
          'Public calls must be a contiguous chronological sequence.',
        );
      if (!call.ok)
        fail(
          'public-mcp.success',
          `$.publicCallLedger.calls[${index}].ok`,
          `Public operation ${call.operation} did not succeed.`,
        );
      if (!PUBLIC_OPERATIONS.has(call.operation))
        fail(
          'public-mcp.operation-allowlist',
          `$.publicCallLedger.calls[${index}].operation`,
          `Operation ${call.operation} is not on the public Forge tool surface.`,
        );
      const indicator = boundaryIndicator(call.arguments);
      if (indicator !== undefined)
        fail(
          'public-mcp.boundary-indicator',
          `$.publicCallLedger.calls[${index}].arguments`,
          `Public arguments expose a prohibited boundary indicator: ${indicator}.`,
        );
    }
    for (const operation of REQUIRED_OPERATIONS)
      if (!ledger.calls.some((call) => call.operation === operation))
        fail(
          'public-mcp.required-operation',
          '$.publicCallLedger.calls',
          `Required public operation ${operation} is missing.`,
        );

    const manifestCalls = ledger.calls.filter(
      (call) => call.operation === 'get_interchange_manifest',
    );
    if (
      manifestCalls.length !== 1 ||
      manifestCalls[0]?.manifest_sha256 !== manifest.manifest_sha256
    )
      fail(
        'public-mcp.manifest-retrieval',
        '$.publicCallLedger.calls',
        'Exactly one successful manifest retrieval must bind the canonical digest.',
      );

    const records = [
      ...manifest.artifacts.map((record) => ({
        record,
        recordKind: 'artifact' as const,
      })),
      ...manifest.evidence.map((record) => ({
        record,
        recordKind: 'evidence' as const,
      })),
    ];
    const allowedRecordKeys = new Set(
      records.map(({ record, recordKind }) => `${recordKind}:${record.id}`),
    );
    const chunkCalls = ledger.calls.filter(
      (call) => call.operation === 'get_interchange_artifact_chunk',
    );

    for (const [index, call] of chunkCalls.entries()) {
      const recordKind = call.arguments['record_kind'];
      const artifactId = call.arguments['artifact_id'];
      const key = `${String(recordKind)}:${String(artifactId)}`;
      if (!allowedRecordKeys.has(key))
        fail(
          'public-mcp.manifest-allowlist',
          `$.publicCallLedger.chunkCalls[${index}]`,
          `Chunk retrieval targets undeclared record ${key}.`,
          typeof artifactId === 'string' ? artifactId : undefined,
        );
    }

    for (const { record, recordKind } of records) {
      const byteLength = recordLength(record);
      if (byteLength === undefined) {
        fail(
          'public-mcp.retrievable-byte-length',
          '$.manifest.evidence',
          'Every live retrievable record must declare byte_length.',
          record.id,
        );
        continue;
      }
      const calls = chunkCalls
        .filter(
          (call) =>
            call.arguments['record_kind'] === recordKind &&
            call.arguments['artifact_id'] === record.id,
        )
        .sort(
          (left, right) =>
            Number(left.arguments['offset']) -
            Number(right.arguments['offset']),
        );
      if (calls.length === 0) {
        fail(
          'public-mcp.record-coverage',
          '$.publicCallLedger.calls',
          'No public chunk retrieval covers this manifest record.',
          record.id,
        );
        continue;
      }
      let cursor = 0;
      for (const call of calls) {
        const offset = call.arguments['offset'];
        const length = call.arguments['length'];
        const identityMatches =
          call.arguments['asset_id'] === manifest.source.asset_id &&
          call.arguments['revision_id'] === manifest.source.revision_id &&
          call.artifact_sha256 === record.sha256 &&
          call.chunk_sha256 !== undefined &&
          call.total === byteLength;
        if (!identityMatches)
          fail(
            'public-mcp.chunk-binding',
            '$.publicCallLedger.calls',
            'Chunk identity, revision, digest, or total is stale.',
            record.id,
          );
        if (
          typeof offset !== 'number' ||
          typeof length !== 'number' ||
          !Number.isInteger(offset) ||
          !Number.isInteger(length) ||
          offset !== cursor ||
          length < 1 ||
          length > FORGE_INTERCHANGE_MAX_CHUNK_BYTES ||
          offset + length > byteLength
        )
          fail(
            'public-mcp.chunk-range',
            '$.publicCallLedger.calls',
            `Chunk coverage is non-contiguous or out of range at byte ${cursor}.`,
            record.id,
          );
        if (typeof offset === 'number' && typeof length === 'number')
          cursor = offset + length;
      }
      if (cursor !== byteLength)
        fail(
          'public-mcp.record-coverage',
          '$.publicCallLedger.calls',
          `Chunk coverage ends at ${cursor}, expected ${byteLength}.`,
          record.id,
        );
    }

    const expectedBytes = records.reduce(
      (sum, { record }) => sum + (recordLength(record) ?? 0),
      0,
    );
    if (
      ledger.retrieval_validation.retrieved_record_count !== records.length ||
      ledger.retrieval_validation.retrieved_bytes !== expectedBytes
    )
      fail(
        'public-mcp.retrieval-summary',
        '$.publicCallLedger.retrieval_validation',
        'Retrieval summary count or bytes do not match manifest records.',
      );
  }

  if (
    manifest !== undefined &&
    workflowEvidence !== undefined &&
    bundle.workflowEvidenceBytes !== undefined
  ) {
    const record = manifest.evidence.find(({ kind }) => kind === 'workflow');
    if (record === undefined)
      fail(
        'workflow-evidence.manifest-binding',
        '$.manifest.evidence',
        'Manifest does not declare workflow evidence.',
      );
    else {
      const digest = createHash('sha256')
        .update(bundle.workflowEvidenceBytes)
        .digest('hex');
      if (
        record.sha256 !== digest ||
        record.byte_length !== bundle.workflowEvidenceBytes.byteLength
      )
        fail(
          'workflow-evidence.byte-binding',
          '$.workflowEvidenceBytes',
          'Workflow evidence bytes do not match the manifest digest and length.',
          record.id,
        );
    }
    if (
      workflowEvidence.asset_id !== manifest.source.asset_id ||
      workflowEvidence.revision_id !== manifest.source.revision_id
    )
      fail(
        'workflow-evidence.pinned-identity',
        '$.workflowEvidenceBytes',
        'Workflow evidence asset or revision is stale.',
      );
    if (
      !workflowEvidence.source_operations.includes('render_preview') ||
      !workflowEvidence.source_operations.includes('export_asset') ||
      !workflowEvidence.retrieval_operations.includes(
        'get_interchange_manifest',
      ) ||
      !workflowEvidence.retrieval_operations.includes(
        'get_interchange_artifact_chunk',
      )
    )
      fail(
        'workflow-evidence.required-operations',
        '$.workflowEvidenceBytes',
        'Workflow evidence omits a required producer or retrieval operation.',
      );
  }

  if (manifest !== undefined && profile !== undefined) {
    const sourceArtifacts = manifest.artifacts.filter(
      ({ classification, role }) =>
        classification === 'source' &&
        (role === 'directional_frame' || role === 'glb'),
    );
    const membersByArtifact = new Map(
      profile.members.map((member) => [member.source.artifact_id, member]),
    );
    for (const artifact of sourceArtifacts) {
      const member = membersByArtifact.get(artifact.id);
      if (member === undefined) {
        fail(
          'downstream.source-membership',
          '$.educationProfile.members',
          'Education profile omits a required Forge source artifact.',
          artifact.id,
        );
        continue;
      }
      const matches =
        member.source.asset_id === manifest.source.asset_id &&
        member.source.revision_id === manifest.source.revision_id &&
        member.source.manifest_sha256 === manifest.manifest_sha256 &&
        member.source.artifact_sha256 === artifact.sha256 &&
        member.source.artifact_role === artifact.role &&
        member.media_type === artifact.media_type &&
        member.byte_length === artifact.byte_length &&
        member.sha256 === artifact.sha256 &&
        sameOptional(member.width, artifact.width) &&
        sameOptional(member.height, artifact.height) &&
        sameOptional(member.transparent, artifact.transparent) &&
        sameOptional(member.source.direction, artifact.direction);
      if (!matches)
        fail(
          'downstream.source-binding',
          '$.educationProfile.members',
          'Education profile member drifts from the exact Forge source record.',
          artifact.id,
        );
    }
    for (const member of profile.members)
      if (!sourceArtifacts.some(({ id }) => id === member.source.artifact_id))
        fail(
          'downstream.member-allowlist',
          '$.educationProfile.members',
          'Education profile includes a Forge member absent from the manifest source allowlist.',
          member.source.artifact_id,
        );
  }

  return {
    ok: failures.length === 0,
    failures,
    summary: {
      artifact_count: manifest?.artifacts.length ?? 0,
      evidence_count: manifest?.evidence.length ?? 0,
      retrieved_record_count:
        ledger?.retrieval_validation.retrieved_record_count ?? 0,
      downstream_member_count: profile?.members.length ?? 0,
    },
  };
}
