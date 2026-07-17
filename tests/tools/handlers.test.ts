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
