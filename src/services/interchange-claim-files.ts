import { readdir, readFile } from 'node:fs/promises';
import { posix, resolve } from 'node:path';

const ACTIVE_PREFIX =
  'measure/tracks/engine_interop_evidence_20260719/' as const;
const ARCHIVE_PREFIX =
  'measure/archive/engine_interop_evidence_20260719/' as const;

export const INTERCHANGE_CLAIM_CONFIG_PATHS = [
  'index.html',
  'package.json',
  'pnpm-lock.yaml',
  'playwright.config.ts',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'scripts/replay-public-mcp-interchange.ts',
] as const;

export const INTERCHANGE_CLAIM_EXCLUDED_SOURCE_PATHS = new Set([
  'src/services/claim-bound-interchange-gate.ts',
  'src/services/interchange-claim-files.ts',
  'src/services/interchange-evidence-gate.ts',
]);

async function claimSourcePaths(directory = 'src'): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = posix.join(directory, entry.name);
      return entry.isDirectory() ? claimSourcePaths(path) : [path];
    }),
  );
  return nested
    .flat()
    .filter((path) => !INTERCHANGE_CLAIM_EXCLUDED_SOURCE_PATHS.has(path));
}

export async function interchangeClaimImplementationPaths(): Promise<
  readonly string[]
> {
  return [
    ...(await claimSourcePaths()),
    ...INTERCHANGE_CLAIM_CONFIG_PATHS,
  ].sort();
}

export function interchangeClaimFileCandidates(
  logicalPath: string,
): readonly string[] {
  if (!logicalPath.startsWith(ACTIVE_PREFIX)) return [logicalPath];
  return [
    logicalPath,
    `${ARCHIVE_PREFIX}${logicalPath.slice(ACTIVE_PREFIX.length)}`,
  ];
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export async function readInterchangeClaimFile(
  logicalPath: string,
  reader: (path: string) => Promise<Uint8Array> = async (path) =>
    readFile(resolve(path)),
): Promise<Uint8Array | undefined> {
  for (const candidate of interchangeClaimFileCandidates(logicalPath)) {
    try {
      return await reader(candidate);
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }
  return undefined;
}
