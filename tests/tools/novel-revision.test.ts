import { describe, expect, it } from 'vitest';

import {
  SemanticRevisionComparisonSchema,
  type AssetDocument,
} from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
  type RevisionSaveOptions,
} from '../../src/document/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly current = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();
  saveCount = 0;
  restoreCount = 0;

  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
    options: RevisionSaveOptions = {},
  ): Promise<RevisionRecord> {
    const prior = this.current.get(document.id);
    if (options.requireAbsent && prior !== undefined)
      throw new Error('ALREADY_EXISTS');
    if (expected !== undefined && prior?.revisionId !== expected)
      throw new Error('REVISION_CONFLICT');
    const record: RevisionRecord = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-22T00:00:00.000Z',
      document,
    };
    this.saveCount += 1;
    this.current.set(document.id, record);
    this.records.set(`${document.id}:${record.revisionId}`, record);
    return record;
  }

  async get(assetId: string, revisionId: string) {
    return this.records.get(`${assetId}:${revisionId}`);
  }

  async getCurrent(assetId: string) {
    return this.current.get(assetId);
  }

  async restoreCurrent(
    assetId: string,
    targetRevisionId: string,
    expectedCurrentRevisionId: string,
  ): Promise<RevisionRecord> {
    const prior = this.current.get(assetId);
    if (prior?.revisionId !== expectedCurrentRevisionId)
      throw new Error('REVISION_CONFLICT');
    const target = this.records.get(`${assetId}:${targetRevisionId}`);
    if (target === undefined) throw new Error('NOT_FOUND');
    this.restoreCount += 1;
    this.current.set(assetId, target);
    return target;
  }
}

const identity = {
  identity: {
    assetId: 'barrel.revision-safe',
    name: 'Revision Safe Barrel',
    kitId: 'rustic-human',
    family: 'standalone-prop',
    archetypeId: 'prop.banded-container.rustic',
    seed: 7_221,
  },
} as const;

const reinforcement = (
  partId: 'band.low' | 'band.high',
  parentPortId: 'band.low' | 'band.high',
) => ({
  operation: 'add_part' as const,
  partId,
  templateId: 'prop.crate-band',
  role: 'prop.reinforcement',
  attachment: {
    connectionId: `connection.${partId}`,
    parentPartId: 'container.body',
    parentPortId,
    childPortId: 'crate.attach',
  },
});

async function completeBarrel(
  handlers: ReturnType<typeof createToolHandlers>,
  revisions: MemoryRevisions,
) {
  const created = await handlers.createAsset(identity);
  let expectedRevisionId = created.revisionId!;
  for (const operation of [
    reinforcement('band.low', 'band.low'),
    reinforcement('band.high', 'band.high'),
  ]) {
    const result = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId,
      composition: operation,
    });
    expect(result.ok).toBe(true);
    expectedRevisionId = result.revisionId!;
  }
  const completed = await revisions.getCurrent(identity.identity.assetId);
  if (completed === undefined) throw new Error('Expected completed barrel.');
  return { created, completed };
}

describe('revision-safe novel iteration', () => {
  it('compares exact identity, composition, completeness, origin, and required-role state', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const { completed } = await completeBarrel(handlers, revisions);
    const untouchedBefore = structuredClone(
      completed.document.assembly.parts.find(({ id }) => id === 'band.high'),
    );

    const completionComparison = await handlers.compareRevisions({
      assetId: identity.identity.assetId,
      baseRevisionId: (await revisions.get(
        identity.identity.assetId,
        completed.parentRevisionId!,
      ))!.parentRevisionId,
      targetRevisionId: completed.revisionId,
      limit: 100,
    });
    expect(completionComparison.ok).toBe(true);
    const completionData = SemanticRevisionComparisonSchema.parse(
      completionComparison.data,
    );
    expect(completionData).toMatchObject({
      baseState: { completeness: { state: 'incomplete' } },
      targetState: { completeness: { state: 'complete' } },
      requiredRoleChanges: [
        {
          role: 'prop.reinforcement',
          baseRequiredCount: 2,
          targetRequiredCount: 2,
          basePresentCount: 0,
          targetPresentCount: 2,
          baseSatisfied: false,
          targetSatisfied: true,
        },
      ],
    });

    const changed = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      patch: {
        operations: [
          {
            operation: 'setMaterialBinding',
            partId: 'band.low',
            slot: 'metal',
            materialId: 'iron.blued',
          },
        ],
      },
    });
    expect(changed.ok).toBe(true);

    const comparison = await handlers.compareRevisions({
      assetId: identity.identity.assetId,
      baseRevisionId: completed.revisionId,
      targetRevisionId: changed.revisionId,
      limit: 100,
    });
    expect(comparison.ok).toBe(true);
    const data = SemanticRevisionComparisonSchema.parse(comparison.data);
    expect(data.affectedIds).toEqual(['band.low']);
    expect(data.preservedIds).toContain('band.high');
    expect(data.preservedIds).toContain('connection.band.high');
    expect(data).toMatchObject({
      baseState: { origin: 'novel', completeness: { state: 'complete' } },
      targetState: { origin: 'novel', completeness: { state: 'complete' } },
      requiredRoleChanges: [],
    });
    expect(data.changes).toContainEqual({
      path: '$.assembly.parts[band.low].materialBindings[metal].materialId',
      kind: 'changed',
      semanticId: 'band.low',
      before: 'iron.weathered',
      after: 'iron.blued',
    });

    const target = await revisions.getCurrent(identity.identity.assetId);
    expect(
      target?.document.assembly.parts.find(({ id }) => id === 'band.high'),
    ).toEqual(untouchedBefore);
  });

  it('requires dry-run confirmation for an atomic destructive replacement', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const { completed } = await completeBarrel(handlers, revisions);
    const oldPart = completed.document.assembly.parts.find(
      ({ id }) => id === 'band.low',
    );
    const oldConnection = completed.document.assembly.connections.find(
      ({ id }) => id === 'connection.band.low',
    );
    if (oldPart === undefined || oldConnection === undefined)
      throw new Error('Expected low band fixture state.');
    const patch = {
      operations: [
        {
          operation: 'disconnectParts' as const,
          connectionId: oldConnection.id,
        },
        { operation: 'removePart' as const, partId: oldPart.id },
        {
          operation: 'addPart' as const,
          part: { ...oldPart, id: 'band.low.replacement' },
        },
        {
          operation: 'connectParts' as const,
          connection: {
            ...oldConnection,
            id: 'connection.band.low.replacement',
            childPartId: 'band.low.replacement',
          },
        },
      ],
    };
    const beforeSaveCount = revisions.saveCount;

    const unplanned = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      patch,
    });
    expect(unplanned).toMatchObject({
      ok: false,
      issues: [{ code: 'DRY_RUN_REQUIRED', path: '$.confirmedPlanId' }],
    });
    expect(revisions.saveCount).toBe(beforeSaveCount);

    const preview = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      patch,
      dryRun: true,
    });
    expect(preview.ok).toBe(true);
    const plan = (
      preview.data as {
        revisionPlan: {
          planId: string;
          affectedIds: string[];
          preservedIds: string[];
        };
      }
    ).revisionPlan;
    expect(plan.affectedIds).toEqual([
      'band.low',
      'band.low.replacement',
      'connection.band.low',
      'connection.band.low.replacement',
    ]);
    expect(plan.preservedIds).toContain('band.high');

    const applied = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      patch,
      confirmedPlanId: plan.planId,
    });
    expect(applied).toMatchObject({
      ok: true,
      affectedIds: plan.affectedIds,
      data: { validation: 'valid' },
    });
    expect(revisions.saveCount).toBe(beforeSaveCount + 1);
  });

  it('requires a deterministic dry-run plan, restores only the pointer, and preserves every immutable revision', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const { created, completed } = await completeBarrel(handlers, revisions);
    const changed = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      patch: {
        operations: [
          {
            operation: 'setMaterialBinding',
            partId: 'band.low',
            slot: 'metal',
            materialId: 'iron.blued',
          },
        ],
      },
    });
    const changedRecord = await revisions.getCurrent(identity.identity.assetId);
    const beforeSaveCount = revisions.saveCount;

    const unplanned = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: changed.revisionId,
      restore: { revisionId: completed.revisionId },
    });
    expect(unplanned).toMatchObject({
      ok: false,
      issues: [{ code: 'DRY_RUN_REQUIRED', path: '$.confirmedPlanId' }],
    });
    expect(await revisions.getCurrent(identity.identity.assetId)).toEqual(
      changedRecord,
    );

    const preview = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: changed.revisionId,
      restore: { revisionId: completed.revisionId },
      dryRun: true,
    });
    expect(preview.ok).toBe(true);
    const previewData = preview.data as {
      revisionPlan: {
        planId: string;
        kind: string;
        baseRevisionId: string;
        targetRevisionId: string;
        affectedIds: string[];
        preservedIds: string[];
      };
    };
    expect(previewData.revisionPlan.planId).toMatch(/^plan\.[a-f0-9]{64}$/);
    expect(previewData.revisionPlan).toMatchObject({
      kind: 'restore',
      baseRevisionId: changed.revisionId,
      targetRevisionId: completed.revisionId,
      affectedIds: ['band.low'],
    });
    expect(previewData.revisionPlan.preservedIds).toContain('band.high');
    expect(revisions.saveCount).toBe(beforeSaveCount);
    expect(revisions.restoreCount).toBe(0);

    const restored = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: changed.revisionId,
      restore: { revisionId: completed.revisionId },
      confirmedPlanId: previewData.revisionPlan.planId,
    });
    expect(restored).toMatchObject({
      ok: true,
      revisionId: completed.revisionId,
      data: {
        restoration: {
          previousCurrentRevisionId: changed.revisionId,
          restoredRevisionId: completed.revisionId,
        },
      },
    });
    expect(revisions.saveCount).toBe(beforeSaveCount);
    expect(revisions.restoreCount).toBe(1);
    expect(
      (await revisions.getCurrent(identity.identity.assetId))?.revisionId,
    ).toBe(completed.revisionId);
    expect(
      await revisions.get(identity.identity.assetId, changed.revisionId!),
    ).toEqual(changedRecord);
    expect(
      await revisions.get(identity.identity.assetId, created.revisionId!),
    ).toBeDefined();

    const noOp = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      restore: { revisionId: completed.revisionId },
      dryRun: true,
    });
    expect(noOp).toMatchObject({
      ok: false,
      issues: [{ code: 'PATCH_REJECTED', path: '$.restore.revisionId' }],
    });
    expect(revisions.restoreCount).toBe(1);
  });

  it('fails closed for stale, incomplete, invalid-plan, and budget-breaking work', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const { created, completed } = await completeBarrel(handlers, revisions);
    const before = await revisions.getCurrent(identity.identity.assetId);
    const beforeSaveCount = revisions.saveCount;

    const incomplete = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      restore: { revisionId: created.revisionId },
      dryRun: true,
    });
    expect(incomplete).toMatchObject({
      ok: false,
      issues: [{ code: 'INCOMPLETE_ASSET', path: '$.restore.revisionId' }],
    });

    const stale = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: created.revisionId,
      restore: { revisionId: completed.revisionId },
      dryRun: true,
    });
    expect(stale).toMatchObject({
      ok: false,
      issues: [{ code: 'REVISION_CONFLICT' }],
    });

    const invalidPlan = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      restore: { revisionId: created.revisionId },
      confirmedPlanId: `plan.${'0'.repeat(64)}`,
    });
    expect(invalidPlan.ok).toBe(false);

    const budget = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      patch: {
        operations: [
          {
            operation: 'upsertRenderProfile',
            renderProfile: {
              ...completed.document.renderProfiles[0],
              id: 'sprite.alternate',
            },
          },
        ],
      },
    });
    expect(budget.ok).toBe(true);
    const overBudget = await revisions.getCurrent(identity.identity.assetId);
    if (overBudget === undefined) throw new Error('Expected current revision.');
    await revisions.restoreCurrent(
      identity.identity.assetId,
      completed.revisionId,
      overBudget.revisionId,
    );
    const impossible = structuredClone(completed.document);
    impossible.triangleBudget = 1;
    const impossibleRecord = await revisions.save(
      impossible,
      completed.revisionId,
    );
    await revisions.restoreCurrent(
      identity.identity.assetId,
      completed.revisionId,
      impossibleRecord.revisionId,
    );
    const budgetRestore = await handlers.applyOperations({
      assetId: identity.identity.assetId,
      expectedRevisionId: completed.revisionId,
      restore: { revisionId: impossibleRecord.revisionId },
      dryRun: true,
    });
    expect(budgetRestore).toMatchObject({
      ok: false,
      issues: [{ code: 'TRIANGLE_BUDGET_EXCEEDED' }],
    });

    expect(await revisions.getCurrent(identity.identity.assetId)).toEqual(
      before,
    );
    expect(revisions.saveCount).toBeGreaterThanOrEqual(beforeSaveCount);
  });
});
