import { describe, expect, it } from 'vitest';
import type { AssetDocument } from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import {
  PUBLIC_TOOL_NAMES,
  createToolHandlers,
} from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly currentRecords = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();
  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
  ): Promise<RevisionRecord> {
    const prior = this.currentRecords.get(document.id);
    if (expected !== undefined && prior?.revisionId !== expected)
      throw new Error('REVISION_CONFLICT');
    const record: RevisionRecord = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-17T00:00:00.000Z',
      document,
    };
    this.currentRecords.set(document.id, record);
    this.records.set(`${document.id}:${record.revisionId}`, record);
    return record;
  }
  async get(
    assetId: string,
    revisionId: string,
  ): Promise<RevisionRecord | undefined> {
    return this.records.get(`${assetId}:${revisionId}`);
  }
  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    return this.currentRecords.get(assetId);
  }
}

describe('semantic domain tools', () => {
  it('advertises only the bounded public catalog', () => {
    expect(PUBLIC_TOOL_NAMES).toEqual([
      'list_kits',
      'inspect_template',
      'inspect_asset',
      'create_asset',
      'apply_operations',
      'connect_parts',
      'set_pose',
      'validate_asset',
      'render_preview',
      'export_asset',
    ]);
    expect(PUBLIC_TOOL_NAMES.join(' ')).not.toMatch(
      /shell|filesystem|network|mesh|blender|code/i,
    );
  });
  it('discovers kits and templates with no prior project context', async () => {
    const handlers = createToolHandlers({ revisions: new MemoryRevisions() });
    expect((await handlers.listKits({})).ok).toBe(true);
    const inspected = await handlers.inspectTemplate({
      templateId: 'human.torso',
    });
    expect(inspected.ok).toBe(true);
    expect(inspected.data).toMatchObject({
      role: 'anatomy.torso',
      generator: 'beveledBox',
    });
    expect(JSON.stringify(inspected.data)).not.toContain('positions');
  });

  it('inspects exact current authoring state through bounded deterministic pages without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const changed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      patch: {
        operations: [
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
          {
            operation: 'setPartTransform',
            partId: 'torso',
            transform: {
              position: [0.02, 1.25, 0],
              rotation: [0, 0, 0, 1],
              scale: [1.05, 1, 1],
            },
          },
          {
            operation: 'setMaterialBinding',
            partId: 'torso',
            slot: 'body',
            materialId: 'cloth.umber',
          },
          { operation: 'setPartVisibility', partId: 'shield', visible: false },
          { operation: 'setActiveVariant', variantId: 'unequipped' },
        ],
      },
    });
    const posed = await handlers.setPose({
      assetId: 'adventurer.rustic',
      expectedRevisionId: changed.revisionId,
      poseId: 'action',
    });
    expect(posed.ok).toBe(true);
    const recordCount = revisions.records.size;

    const inspected = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'parts',
      offset: 0,
      limit: 100,
    });
    expect(inspected.ok).toBe(true);
    expect(inspected.revisionId).toBe(posed.revisionId);
    expect(inspected.data).toMatchObject({
      id: 'adventurer.rustic',
      unit: 'meter',
      activeVariantId: 'unequipped',
      activePoseId: 'action',
      section: 'parts',
      page: { offset: 0, limit: 100, truncated: false },
    });
    const inspection = inspected.data as {
      items: Array<{
        id: string;
        handedness: string;
        shapeSource: string;
        base: Record<string, unknown>;
        effective: Record<string, unknown>;
        ports: unknown[];
      }>;
    };
    expect(inspection.items.map(({ id }) => id)).toEqual(
      [...inspection.items.map(({ id }) => id)].sort(),
    );
    expect(inspection.items.find(({ id }) => id === 'torso')).toMatchObject({
      handedness: 'neutral',
      shapeSource: 'part',
      base: {
        shape: { kind: 'beveledBox', width: 0.55 },
        transform: {
          position: [0.02, 1.25, 0],
          scale: [1.05, 1, 1],
        },
        materialBindings: [{ slot: 'body', materialId: 'cloth.umber' }],
        visible: true,
      },
    });
    expect(
      inspection.items.find(({ id }) => id === 'upper-arm.left'),
    ).toMatchObject({
      handedness: 'left',
      effective: { jointValueDegrees: -48 },
    });
    expect(inspection.items.find(({ id }) => id === 'shield')).toMatchObject({
      handedness: 'left',
      base: { visible: false },
      effective: { visible: false },
    });
    expect(JSON.stringify(inspected.data)).not.toMatch(
      /positions|normals|indices/,
    );

    const connections = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'connections',
      offset: 0,
      limit: 1,
    });
    expect(connections.data).toMatchObject({
      section: 'connections',
      page: { offset: 0, limit: 1, truncated: true, nextOffset: 1 },
      items: [
        {
          parentPartId: expect.any(String),
          parentPortId: expect.any(String),
          childPartId: expect.any(String),
          childPortId: expect.any(String),
          parentPort: { frame: expect.any(Object) },
          childPort: { frame: expect.any(Object) },
        },
      ],
    });
    expect(revisions.records.size).toBe(recordCount);

    const invalidPage = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'parts',
      offset: 10_000,
      limit: 1,
    });
    expect(invalidPage).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE', path: '$.offset' }],
    });
    const unknown = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'parts',
      detailEverything: true,
    });
    expect(unknown).toMatchObject({
      ok: false,
      issues: [{ code: 'UNKNOWN_FIELD', path: '$.detailEverything' }],
    });
  });

  it('compares bounded field-level changes and preserved semantic IDs between revisions', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const baseRecord = await revisions.getCurrent('adventurer.rustic');
    const preservedConnectionId =
      baseRecord!.document.assembly.connections[0]!.id;
    const changed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      patch: {
        operations: [
          { operation: 'setPartVisibility', partId: 'shield', visible: false },
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
        ],
      },
    });
    const beforeReads = revisions.records.size;
    const comparisonHandler = (
      handlers as typeof handlers & {
        compareRevisions(input: unknown): Promise<{
          ok: boolean;
          data?: unknown;
          issues: Array<{ code: string; path: string }>;
        }>;
      }
    ).compareRevisions;
    const comparison = await comparisonHandler({
      assetId: 'adventurer.rustic',
      baseRevisionId: created.revisionId,
      targetRevisionId: changed.revisionId,
      offset: 0,
      limit: 100,
    });
    expect(comparison.ok).toBe(true);
    expect(comparison.data).toMatchObject({
      assetId: 'adventurer.rustic',
      baseRevisionId: created.revisionId,
      targetRevisionId: changed.revisionId,
      affectedIds: expect.arrayContaining(['shield', 'torso']),
      preservedIds: expect.arrayContaining(['sword', preservedConnectionId]),
      page: { offset: 0, limit: 100, truncated: false },
      changes: expect.arrayContaining([
        expect.objectContaining({
          path: '$.assembly.parts[shield].visible',
          kind: 'changed',
          semanticId: 'shield',
          before: true,
          after: false,
        }),
        expect.objectContaining({
          path: '$.assembly.parts[torso].shape',
          kind: 'added',
          semanticId: 'torso',
        }),
      ]),
    });
    expect(revisions.records.size).toBe(beforeReads);

    const missing = await comparisonHandler({
      assetId: 'adventurer.rustic',
      baseRevisionId: `revision.${'0'.repeat(64)}`,
      targetRevisionId: changed.revisionId,
    });
    expect(missing).toMatchObject({
      ok: false,
      issues: [{ code: 'NOT_FOUND', path: '$.baseRevisionId' }],
    });
  });
  it('creates, locally patches, validates, and rejects stale revisions without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    expect(created.ok).toBe(true);
    const firstRevision = created.revisionId!;
    const patched = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: firstRevision,
      dryRun: false,
      patch: {
        operations: [
          { operation: 'setPartVisibility', partId: 'shield', visible: false },
        ],
      },
    });
    expect(patched.ok).toBe(true);
    expect(patched.affectedIds).toEqual(['shield']);
    const current = await revisions.getCurrent('adventurer.rustic');
    expect(
      current?.document.assembly.parts.find(({ id }) => id === 'torso')
        ?.visible,
    ).toBe(true);
    const stale = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: firstRevision,
      dryRun: false,
      patch: {
        operations: [
          { operation: 'setPartVisibility', partId: 'sword', visible: false },
        ],
      },
    });
    expect(stale.ok).toBe(false);
    expect(stale.issues[0]?.code).toBe('REVISION_CONFLICT');
    expect(
      (await handlers.validateAsset({ assetId: 'adventurer.rustic' })).ok,
    ).toBe(true);
    const changed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: current!.revisionId,
      dryRun: false,
      patch: {
        operations: [
          { operation: 'setActiveVariant', variantId: 'unequipped' },
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
          {
            operation: 'setMaterialBinding',
            partId: 'torso',
            slot: 'body',
            materialId: 'cloth.umber',
          },
        ],
      },
    });
    expect(changed.ok).toBe(true);
    expect(changed.affectedIds).toEqual(['torso', 'unequipped']);
    expect(changed.data).toMatchObject({
      patchSummary: { operationCount: 3 },
    });
    expect(
      (await revisions.getCurrent('adventurer.rustic'))?.document
        .activeVariantId,
    ).toBe('unequipped');
    const shaped = await revisions.getCurrent('adventurer.rustic');
    expect(
      shaped?.document.assembly.parts.find(({ id }) => id === 'torso')?.shape,
    ).toMatchObject({ kind: 'beveledBox', width: 0.55 });
    const noOp = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: shaped!.revisionId,
      dryRun: false,
      patch: {
        operations: [
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
        ],
      },
    });
    expect(noOp.ok).toBe(false);
    expect(await revisions.getCurrent('adventurer.rustic')).toEqual(shaped);
  });

  it('returns stable paths for invalid and out-of-scope tool payloads without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const unknown = await handlers.listKits({ unexpected: true });
    expect(unknown.ok).toBe(false);
    expect(unknown.issues[0]).toMatchObject({
      code: 'UNKNOWN_FIELD',
      path: '$.unexpected',
    });
    const created = await handlers.createAsset({ reference: 'crate' });
    const before = await revisions.getCurrent('crate.rustic');
    const repeated = await handlers.createAsset({ reference: 'crate' });
    expect(repeated.ok).toBe(false);
    expect(repeated.issues[0]?.code).toBe('ALREADY_EXISTS');
    expect(await revisions.getCurrent('crate.rustic')).toEqual(before);
    const invalidConnection = await handlers.connectParts({
      assetId: 'crate.rustic',
      expectedRevisionId: created.revisionId,
      dryRun: false,
      connection: {
        id: 'invalid.connection',
        parentPartId: 'missing.parent',
        parentPortId: 'missing.port',
        childPartId: 'missing.child',
        childPortId: 'missing.port',
      },
    });
    expect(invalidConnection.ok).toBe(false);
    expect(invalidConnection.issues[0]).toMatchObject({
      code: 'INVALID_ASSEMBLY',
      path: '$.patch',
    });
    expect(await revisions.getCurrent('crate.rustic')).toEqual(before);
    const rejected = await handlers.applyOperations({
      assetId: 'crate.rustic',
      expectedRevisionId: created.revisionId,
      patch: { operations: [{ operation: 'runShell', command: 'true' }] },
    });
    expect(rejected.ok).toBe(false);
    expect(await revisions.getCurrent('crate.rustic')).toEqual(before);
  });
  it('reports and rejects assets over their explicit triangle budget', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    await handlers.createAsset({ reference: 'crate' });
    const current = await revisions.getCurrent('crate.rustic');
    await revisions.save(
      { ...current!.document, triangleBudget: 1 },
      current!.revisionId,
    );
    const result = await handlers.validateAsset({ assetId: 'crate.rustic' });
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({
      code: 'TRIANGLE_BUDGET_EXCEEDED',
      path: '$.triangleBudget',
      actual: 132,
      expected: 'at most 1',
    });
  });

  it('orchestrates render and export through narrow service ports', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({
      revisions,
      renderService: {
        render: async (_document, revisionId) => ({ revisionId, frames: 8 }),
      },
      exportService: {
        export: async (_document, revisionId) => ({
          revisionId,
          format: 'glb',
        }),
      },
    });
    await handlers.createAsset({ reference: 'crate' });
    expect(
      (await handlers.renderPreview({ assetId: 'crate.rustic' })).data,
    ).toMatchObject({ frames: 8 });
    expect(
      (await handlers.exportAsset({ assetId: 'crate.rustic' })).data,
    ).toMatchObject({ format: 'glb' });
  });
});
