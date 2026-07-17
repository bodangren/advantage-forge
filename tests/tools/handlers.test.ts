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
  readonly records = new Map<string, RevisionRecord>();
  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
  ): Promise<RevisionRecord> {
    const prior = this.records.get(document.id);
    if (expected !== undefined && prior?.revisionId !== expected)
      throw new Error('REVISION_CONFLICT');
    const record: RevisionRecord = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-17T00:00:00.000Z',
      document,
    };
    this.records.set(document.id, record);
    return record;
  }
  async get(
    assetId: string,
    revisionId: string,
  ): Promise<RevisionRecord | undefined> {
    const record = this.records.get(assetId);
    return record?.revisionId === revisionId ? record : undefined;
  }
  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    return this.records.get(assetId);
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
