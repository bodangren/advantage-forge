import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { interchangeClaimImplementationPaths } from '../src/services/interchange-claim-files.js';

const TRACK_ROOT =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence';
const CLAIM_PATH = `${TRACK_ROOT}/delivery-claim.json`;
const EVIDENCE = [
  ['manifest', `${TRACK_ROOT}/interchange-manifest.json`],
  ['public-call-ledger', `${TRACK_ROOT}/public-call-ledger.json`],
  ['workflow-evidence', `${TRACK_ROOT}/workflow-evidence.json`],
  ['education-profile', `${TRACK_ROOT}/education-app-pack-profile.json`],
] as const;
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

async function claimedFile(path: string): Promise<{
  path: string;
  byte_length: number;
  sha256: string;
}> {
  const bytes = await readFile(path);
  return { path, byte_length: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildInterchangeDeliveryClaim(): Promise<{
  readonly serialized: string;
  readonly claim_sha256: string;
  readonly implementation_file_count: number;
}> {
  const manifest = JSON.parse(await readFile(EVIDENCE[0][1], 'utf8')) as Record<
    string,
    unknown
  >;
  const profile = JSON.parse(await readFile(EVIDENCE[3][1], 'utf8')) as Record<
    string,
    unknown
  >;
  const source = manifest['source'] as Record<string, unknown>;
  const evidenceFiles = await Promise.all(
    EVIDENCE.map(async ([id, path]) => ({ id, ...(await claimedFile(path)) })),
  );
  const implementationPaths = await interchangeClaimImplementationPaths();
  const implementationFiles = await Promise.all(
    implementationPaths.map(claimedFile),
  );
  const unsigned = {
    contract_id: 'forge-interchange-delivery-claim/v1',
    source: {
      asset_id: source['asset_id'],
      revision_id: source['revision_id'],
      manifest_sha256: manifest['manifest_sha256'],
      education_profile_sha256: profile['profile_sha256'],
    },
    evidence_files: evidenceFiles,
    implementation_files: implementationFiles,
  };
  const claim = {
    ...unsigned,
    claim_sha256: sha256(JSON.stringify(canonicalValue(unsigned))),
  };
  return {
    serialized: `${JSON.stringify(claim, undefined, 2)}\n`,
    claim_sha256: claim.claim_sha256,
    implementation_file_count: implementationFiles.length,
  };
}

async function main(): Promise<void> {
  const built = await buildInterchangeDeliveryClaim();
  await writeFile(CLAIM_PATH, built.serialized);
  process.stdout.write(
    `${JSON.stringify({ claim_sha256: built.claim_sha256, implementation_file_count: built.implementation_file_count })}\n`,
  );
}

const entry = process.argv[1];
if (
  entry !== undefined &&
  pathToFileURL(resolve(entry)).href === import.meta.url
)
  await main();
