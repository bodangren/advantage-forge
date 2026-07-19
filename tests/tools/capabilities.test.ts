import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  CapabilityReportSchema,
  type ToolResultEnvelope,
} from '../../src/contracts/index.js';
import type {
  RevisionRecord,
  RevisionRepository,
} from '../../src/document/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

class UnusedRevisions implements RevisionRepository {
  async save(): Promise<RevisionRecord> {
    throw new Error('Capability inspection must not write revisions.');
  }

  async get(): Promise<RevisionRecord | undefined> {
    return undefined;
  }

  async getCurrent(): Promise<RevisionRecord | undefined> {
    return undefined;
  }
}

type CapabilityHandler = (input: unknown) => Promise<ToolResultEnvelope>;

function capabilityHandler(): CapabilityHandler {
  const handlers = createToolHandlers({ revisions: new UnusedRevisions() });
  return (
    handlers as typeof handlers & {
      inspectCapabilities: CapabilityHandler;
    }
  ).inspectCapabilities;
}

describe('public capability discovery', () => {
  it('reports supported static references, accessories, outputs, and revision workflow', async () => {
    const result = await capabilityHandler()({});
    expect(result.ok).toBe(true);
    const report = CapabilityReportSchema.parse(result.data);
    const status = new Map(report.facts.map((fact) => [fact.id, fact.status]));

    expect(status.get('asset.reference.adventurer')).toBe('supported');
    expect(status.get('asset.reference.crate')).toBe('supported');
    expect(status.get('asset.reference.tree')).toBe('supported');
    expect(status.get('asset.reference.cottage')).toBe('supported');
    expect(status.get('accessory.sword')).toBe('supported');
    expect(status.get('accessory.shield')).toBe('supported');
    expect(status.get('accessory.library')).toBe('supported');
    expect(status.get('accessory.additional')).toBe('supported');
    expect(status.get('output.glb')).toBe('supported');
    expect(status.get('output.sprite.directional')).toBe('supported');
    expect(status.get('revision.immutable')).toBe('supported');

    const sword = report.facts.find(({ id }) => id === 'accessory.sword');
    expect(sword?.evidence.templateIds).toContain('equipment.sword');
    expect(sword?.evidence.publicTools).toContain('create_asset');
    expect(sword?.evidence.publicTools).toContain('apply_accessory_operation');
  });

  it('states product gaps without inventing source, filesystem, or hidden-tool routes', async () => {
    const result = await capabilityHandler()({});
    const report = CapabilityReportSchema.parse(result.data);
    const byId = new Map(report.facts.map((fact) => [fact.id, fact]));

    const accessoryLibrary = byId.get('accessory.library');
    expect(accessoryLibrary?.status).toBe('supported');
    expect(accessoryLibrary?.evidence.publicTools).toContain(
      'search_accessories',
    );
    expect(accessoryLibrary?.evidence.publicTools).toContain(
      'apply_accessory_operation',
    );
    for (const id of [
      'asset.new_identity',
      'animation.temporal',
      'output.sprite_atlas',
      'anatomy.unsupported',
      'operation.raw_mesh',
    ]) {
      expect(byId.get(id)?.status, id).toBe('unsupported');
      expect(byId.get(id)?.guidance, id).toBeTruthy();
    }
    expect(byId.get('integration.game_engine_import')?.status).toBe(
      'not-assessed',
    );
    expect(JSON.stringify(report)).not.toMatch(
      /\/src\/|\\src\\|filesystem|read the source|hand-authored json|shell (?:access|tool|command)/i,
    );
  });

  it('filters known capability IDs and rejects unknown or malformed requests actionably', async () => {
    const inspect = capabilityHandler();
    const filtered = await inspect({
      capabilityIds: ['accessory.additional', 'animation.temporal'],
    });
    expect(CapabilityReportSchema.parse(filtered.data)).toMatchObject({
      filtered: true,
      facts: [
        { id: 'accessory.additional', status: 'supported' },
        { id: 'animation.temporal', status: 'unsupported' },
      ],
    });

    expect(
      await inspect({ capabilityIds: ['capability.does-not-exist'] }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'NOT_FOUND', path: '$.capabilityIds[0]' }],
    });
    expect(await inspect({ includeSourcePaths: true })).toMatchObject({
      ok: false,
      issues: [{ code: 'UNKNOWN_FIELD', path: '$.includeSourcePaths' }],
    });
  });

  it('keeps the generated capability catalog aligned with runtime facts', async () => {
    const result = await capabilityHandler()({});
    const report = CapabilityReportSchema.parse(result.data);
    const generated = await readFile(
      new URL('../../measure/generated/capability-catalog.md', import.meta.url),
      'utf8',
    );
    for (const fact of report.facts) {
      expect(generated).toContain(`\`${fact.id}\``);
      expect(generated).toContain(`| ${fact.status} |`);
    }
  });
});
