import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import console from 'node:console';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { classifyRun } from './run-sandboxed-llm.mjs';

const REQUIRED_LOADOUTS = ['guard', 'traveler', 'ranger', 'caster'];

/**
 * Aggregate sandboxed LLM evidence for the four required loadouts.
 *
 * @param {string} root
 * @returns {Promise<{
 *   ok: boolean;
 *   completedLoadoutCount: number;
 *   infrastructureNotAssessedCount: number;
 *   productFailureCount: number;
 *   totalForgeCalls: number;
 *   loadoutCount: number;
 *   loadoutResults: Array<{
 *     loadoutId: string;
 *     sessionId: string | null;
 *     verdict: string;
 *     category: string;
 *     idleRevisionId: string | null;
 *     actionRevisionId: string | null;
 *     expectedRevisionId: string | null;
 *     artifactAuditPath: string;
 *     glbAuditPath: string;
 *     elapsedSeconds: number | null;
 *     forgeCalls: number;
 *     nonForgeCalls: number;
 *   }>;
 * }>}
 */
export async function aggregateEvidence(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const presentLoadouts = new Set(
    entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  );

  for (const loadoutId of REQUIRED_LOADOUTS) {
    if (!presentLoadouts.has(loadoutId)) {
      throw new Error(`Missing required loadout evidence directory: ${loadoutId}`);
    }
  }

  const loadoutResults = [];
  let completedLoadoutCount = 0;
  let infrastructureNotAssessedCount = 0;
  let productFailureCount = 0;
  let totalForgeCalls = 0;

  for (const loadoutId of REQUIRED_LOADOUTS) {
    const dir = join(root, loadoutId);
    const runMetadata = await readJson(join(dir, 'run-metadata.json'));
    const result = await readJson(join(dir, 'result.json'));

    const classification = classifyRun({
      toolCount: toNumber(runMetadata.toolCount),
      nonForgeToolCount: toNumber(runMetadata.nonForgeToolCount),
      sessionId: toNullableString(runMetadata.sessionId),
      code: toNullableNumber(runMetadata.code),
      signal: toNullableString(runMetadata.signal),
      finalClientResponsePresent: Boolean(runMetadata.finalClientResponsePresent),
    });

    const forgeCalls = toNumber(runMetadata.toolCount);
    totalForgeCalls += forgeCalls;

    let evidenceValid = false;
    if (classification.verdict !== 'not-assessed') {
      const finalResponse = await readFile(join(dir, 'client-final-response.md'), 'utf8');
      const inventory = await readFile(join(dir, 'sha256sums.txt'), 'utf8');
      const idleRevisionId = toNullableString(result.idleRevisionId);
      const actionRevisionId = toNullableString(result.actionRevisionId);
      const renderManifest = await readJson(
        join(dir, 'equipped-idle', 'render-manifest.json'),
      );
      const glbManifest = await readJson(
        join(dir, 'equipped-idle', 'glb-manifest.json'),
      );
      evidenceValid =
        runMetadata.sessionExportStatus === 'completed' &&
        finalResponse.trim().length > 0 &&
        !/not assessed: no final text event/i.test(finalResponse) &&
        inventory.trim().length > 0 &&
        idleRevisionId !== null &&
        actionRevisionId !== null &&
        renderManifest.revisionId === idleRevisionId &&
        glbManifest.revisionId === idleRevisionId;
    }

    if (classification.verdict === 'not-assessed') {
      infrastructureNotAssessedCount += 1;
    } else if (
      !evidenceValid ||
      (classification.category === 'product' && classification.verdict === 'fail')
    ) {
      productFailureCount += 1;
    } else if (
      classification.verdict === 'pass' ||
      classification.verdict === 'partial'
    ) {
      completedLoadoutCount += 1;
    }

    const idleDir = join(dir, 'equipped-idle');
    loadoutResults.push({
      loadoutId,
      sessionId: toNullableString(runMetadata.sessionId),
      verdict: classification.verdict,
      category: classification.category,
      idleRevisionId: toNullableString(result.idleRevisionId),
      actionRevisionId: toNullableString(result.actionRevisionId),
      expectedRevisionId: toNullableString(result.idleRevisionId),
      artifactAuditPath: join(idleDir, 'render-manifest.json'),
      glbAuditPath: join(idleDir, 'glb-manifest.json'),
      elapsedSeconds: toNullableNumber(runMetadata.elapsedSeconds),
      forgeCalls,
      nonForgeCalls: toNumber(runMetadata.nonForgeToolCount),
    });
  }

  const ok =
    completedLoadoutCount === REQUIRED_LOADOUTS.length &&
    productFailureCount === 0 &&
    infrastructureNotAssessedCount === 0;

  const summary = {
    ok,
    completedLoadoutCount,
    infrastructureNotAssessedCount,
    productFailureCount,
    totalForgeCalls,
    loadoutCount: REQUIRED_LOADOUTS.length,
    loadoutResults,
  };

  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'final-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  return summary;
}

async function main() {
  const root = process.argv[2];
  if (root === undefined) {
    console.error('Usage: node aggregate-sandboxed-evidence.mjs <evidence-root>');
    process.exitCode = 1;
    return;
  }
  const summary = await aggregateEvidence(resolve(root));
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
}

async function readJson(path) {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

function toNumber(value) {
  return typeof value === 'number' ? value : 0;
}

function toNullableNumber(value) {
  return typeof value === 'number' ? value : null;
}

function toNullableString(value) {
  return typeof value === 'string' ? value : null;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
