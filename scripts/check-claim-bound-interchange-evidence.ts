import { auditClaimBoundInterchangeEvidence } from '../src/services/claim-bound-interchange-gate.js';
import {
  interchangeClaimImplementationPaths,
  readInterchangeClaimFile,
} from '../src/services/interchange-claim-files.js';

const CLAIM_PATH =
  'measure/tracks/engine_interop_evidence_20260719/s2-live-evidence/delivery-claim.json';
function claimedPaths(claimBytes: Uint8Array | undefined): readonly string[] {
  if (claimBytes === undefined) return [];
  try {
    const claim = JSON.parse(new TextDecoder().decode(claimBytes)) as Record<
      string,
      unknown
    >;
    const files = [claim['evidence_files'], claim['implementation_files']]
      .filter(Array.isArray)
      .flat() as Array<Record<string, unknown>>;
    return files
      .map((file) => file['path'])
      .filter((path): path is string => typeof path === 'string');
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const claimBytes = await readInterchangeClaimFile(CLAIM_PATH);
  const paths = claimedPaths(claimBytes);
  const entries = await Promise.all(
    paths.map(
      async (path) => [path, await readInterchangeClaimFile(path)] as const,
    ),
  );
  const result = await auditClaimBoundInterchangeEvidence({
    claimBytes,
    files: Object.fromEntries(entries),
    expectedImplementationPaths: await interchangeClaimImplementationPaths(),
  });
  process.stdout.write(`${JSON.stringify(result, undefined, 2)}\n`);
  process.exitCode = result.ok ? 0 : 1;
}

await main();
