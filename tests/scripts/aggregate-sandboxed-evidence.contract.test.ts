import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Intentionally import the production script that does not yet exist.
import { aggregateEvidence } from '../../scripts/aggregate-sandboxed-evidence.mjs';

const REQUIRED_LOADOUTS = ['guard', 'traveler', 'ranger', 'caster'];

async function writeLoadout(
  root: string,
  loadoutId: string,
  overrides: {
    run?: Partial<Record<string, unknown>>;
    result?: Partial<Record<string, unknown>>;
  } = {},
) {
  const dir = join(root, loadoutId);
  await mkdir(dir, { recursive: true });

  const runMetadata = {
    toolCount: 3,
    nonForgeToolCount: 0,
    sessionId: `sess-${loadoutId}`,
    code: 0,
    signal: null,
    finalClientResponsePresent: true,
    sessionExportStatus: 'completed',
    candidateCommit: 'abc123',
    elapsedSeconds: 120,
    ...overrides.run,
  };
  await writeFile(
    join(dir, 'run-metadata.json'),
    `${JSON.stringify(runMetadata, null, 2)}\n`,
  );

  const result = {
    loadoutId,
    idleRevisionId: `idle-${loadoutId}`,
    actionRevisionId: `action-${loadoutId}`,
    equippedPartIds: [`part-${loadoutId}`],
    ...overrides.result,
  };
  await writeFile(join(dir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);

  await writeFile(
    join(dir, 'client-final-response.md'),
    `# ${loadoutId} conclusion\npass\n`,
  );
  await writeFile(join(dir, 'sha256sums.txt'), 'dummy\n');

  const idleDir = join(dir, 'equipped-idle');
  await mkdir(idleDir, { recursive: true });
  const renderManifestPath = join(idleDir, 'render-manifest.json');
  const glbManifestPath = join(idleDir, 'glb-manifest.json');
  const manifestBody = {
    assetId: 'adventurer.rustic',
    revisionId: result.idleRevisionId,
  };
  await writeFile(
    renderManifestPath,
    `${JSON.stringify(manifestBody, null, 2)}\n`,
  );
  await writeFile(glbManifestPath, `${JSON.stringify(manifestBody, null, 2)}\n`);
}

describe('aggregate-sandboxed-evidence contract', () => {
  it('requires all four loadouts and returns labeled counts', async () => {
    const root = await mkdtemp(join(tmpdir(), 's4-agg-'));
    for (const loadoutId of REQUIRED_LOADOUTS) {
      await writeLoadout(root, loadoutId);
    }

    const summary = await aggregateEvidence(root);

    expect(summary.ok).toBe(true);
    expect(summary.completedLoadoutCount).toBe(4);
    expect(summary.infrastructureNotAssessedCount).toBe(0);
    expect(summary.productFailureCount).toBe(0);
    expect(summary.totalForgeCalls).toBe(12);
    expect(summary.loadoutResults).toHaveLength(4);

    const observedIds = summary.loadoutResults
      .map((r: { loadoutId: string }) => r.loadoutId)
      .sort();
    expect(observedIds).toEqual(REQUIRED_LOADOUTS.slice().sort());
  });

  it('fails when a loadout is missing (A4/A6)', async () => {
    const root = await mkdtemp(join(tmpdir(), 's4-agg-missing-'));
    for (const loadoutId of ['guard', 'traveler', 'ranger']) {
      await writeLoadout(root, loadoutId);
    }

    await expect(aggregateEvidence(root)).rejects.toThrow(/caster/);
  });

  it('fails when a loadout is infrastructure-not-assessed (A4/A6)', async () => {
    const root = await mkdtemp(join(tmpdir(), 's4-agg-not-assessed-'));
    for (const loadoutId of REQUIRED_LOADOUTS) {
      if (loadoutId === 'caster') {
        await writeLoadout(root, loadoutId, {
          run: {
            toolCount: 0,
            sessionId: null,
            code: null,
            finalClientResponsePresent: false,
            sessionExportStatus: 'not-assessed',
          },
          result: {
            idleRevisionId: undefined,
            actionRevisionId: undefined,
          },
        });
      } else {
        await writeLoadout(root, loadoutId);
      }
    }

    const summary = await aggregateEvidence(root);

    expect(summary.ok).toBe(false);
    expect(summary.infrastructureNotAssessedCount).toBe(1);
    expect(summary.productFailureCount).toBe(0);
    expect(summary.completedLoadoutCount).toBe(3);
  });

  it('does not accept a hand-edited final-summary.json (A5)', async () => {
    const root = await mkdtemp(join(tmpdir(), 's4-agg-hand-edit-'));
    for (const loadoutId of REQUIRED_LOADOUTS) {
      await writeLoadout(root, loadoutId);
    }

    await writeFile(
      join(root, 'final-summary.json'),
      `${JSON.stringify({
        ok: true,
        completedLoadoutCount: 99,
        handEdited: true,
      })}\n`,
    );

    const summary = await aggregateEvidence(root);

    expect(summary.ok).toBe(true);
    expect(summary.completedLoadoutCount).toBe(4);
    expect(summary.handEdited).toBeUndefined();
  });

  it('includes revision-bound artifact and GLB audit evidence for every loadout', async () => {
    const root = await mkdtemp(join(tmpdir(), 's4-agg-audit-'));
    for (const loadoutId of REQUIRED_LOADOUTS) {
      await writeLoadout(root, loadoutId);
    }

    const summary = await aggregateEvidence(root);

    for (const result of summary.loadoutResults as Array<{
      idleRevisionId: string;
      actionRevisionId: string;
      artifactAuditPath: string;
      glbAuditPath: string;
      expectedRevisionId: string;
    } >) {
      expect(result.idleRevisionId).toMatch(/^idle-/);
      expect(result.actionRevisionId).toMatch(/^action-/);
      expect(result.artifactAuditPath).toMatch(/render-manifest\.json$/);
      expect(result.glbAuditPath).toMatch(/glb-manifest\.json$/);
      expect(result.expectedRevisionId).toBe(result.idleRevisionId);
    }
  });

  it('fails when non-Forge calls are present', async () => {
    const root = await mkdtemp(join(tmpdir(), 's4-agg-non-forge-'));
    for (const loadoutId of REQUIRED_LOADOUTS) {
      await writeLoadout(root, loadoutId);
    }
    await writeLoadout(root, 'guard', { run: { nonForgeToolCount: 1 } });

    const summary = await aggregateEvidence(root);

    expect(summary.ok).toBe(false);
    expect(summary.productFailureCount).toBeGreaterThanOrEqual(1);
  });
});
