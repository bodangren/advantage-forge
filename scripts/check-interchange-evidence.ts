import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { auditInterchangeEvidenceBundle } from '../src/services/interchange-evidence-gate.js';

const DEFAULT_EVIDENCE_DIRECTORY =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence';

function evidenceDirectory(arguments_: readonly string[]): string {
  if (arguments_.length === 0) return resolve(DEFAULT_EVIDENCE_DIRECTORY);
  if (arguments_.length === 2 && arguments_[0] === '--evidence-dir')
    return resolve(arguments_[1]!);
  throw new Error(
    'Usage: check-interchange-evidence [--evidence-dir <directory>]',
  );
}

async function optionalBytes(path: string): Promise<Uint8Array | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return undefined;
    throw error;
  }
}

async function optionalJson(path: string): Promise<unknown> {
  const bytes = await optionalBytes(path);
  if (bytes === undefined) return undefined;
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { invalid_json: true };
  }
}

async function main(): Promise<void> {
  const directory = evidenceDirectory(process.argv.slice(2));
  const [manifest, publicCallLedger, workflowEvidenceBytes, educationProfile] =
    await Promise.all([
      optionalJson(resolve(directory, 'interchange-manifest.json')),
      optionalJson(resolve(directory, 'public-call-ledger.json')),
      optionalBytes(resolve(directory, 'workflow-evidence.json')),
      optionalJson(resolve(directory, 'education-app-pack-profile.json')),
    ]);
  const result = await auditInterchangeEvidenceBundle({
    manifest,
    publicCallLedger,
    workflowEvidenceBytes,
    educationProfile,
  });
  process.stdout.write(`${JSON.stringify(result, undefined, 2)}\n`);
  process.exitCode = result.ok ? 0 : 1;
}

await main();
