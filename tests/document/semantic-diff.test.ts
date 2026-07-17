import { describe, expect, it } from 'vitest';

import type { AssetDocument } from '../../src/contracts/index.js';
import { compareSemanticDocuments } from '../../src/document/index.js';
import {
  adventurerDocument,
  crateDocument,
} from '../../src/fantasy-kit/index.js';

describe('semantic document comparison', () => {
  it('reports root changes and added or removed semantic entities', () => {
    const after = structuredClone(crateDocument) as AssetDocument;
    after.name = 'Reviewed Crate';
    after.poses.push({ id: 'pose.review', overrides: [] });
    const removedConnection = after.assembly.connections.shift();
    if (removedConnection === undefined)
      throw new Error('Expected a crate reference connection.');

    const comparison = compareSemanticDocuments(crateDocument, after);

    expect(comparison.affectedIds).toContain('crate.rustic');
    expect(comparison.affectedIds).toContain('pose.review');
    expect(comparison.affectedIds).toContain(removedConnection.id);
    expect(comparison.changes).toContainEqual({
      path: '$.name',
      kind: 'changed',
      semanticId: 'crate.rustic',
      before: 'Iron-Banded Crate',
      after: 'Reviewed Crate',
    });
    expect(
      comparison.changes.find(({ path }) => path === '$.poses[pose.review]'),
    ).toMatchObject({ kind: 'added', semanticId: 'pose.review' });
    expect(
      comparison.changes.find(
        ({ path }) =>
          path === `$.assembly.connections[${removedConnection.id}]`,
      ),
    ).toMatchObject({ kind: 'removed', semanticId: removedConnection.id });
  });

  it('compares keyed semantic arrays and positional vectors by stable paths', () => {
    const after = structuredClone(adventurerDocument) as AssetDocument;
    const torso = after.assembly.parts.find(({ id }) => id === 'torso');
    const action = after.poses.find(({ id }) => id === 'action');
    const armOverride = action?.overrides.find(
      ({ partId }) => partId === 'upper-arm.left',
    );
    if (torso === undefined || armOverride === undefined)
      throw new Error('Expected canonical adventurer semantic state.');
    torso.transform.position[0] = 0.125;
    torso.materialBindings[0] = {
      slot: torso.materialBindings[0]!.slot,
      materialId: 'cloth.umber',
    };
    armOverride.jointValueDegrees = -52;

    const comparison = compareSemanticDocuments(adventurerDocument, after);

    expect(comparison.affectedIds).toContain('torso');
    expect(comparison.affectedIds).toContain('action');
    expect(comparison.changes).toContainEqual({
      path: '$.assembly.parts[torso].transform.position[0]',
      kind: 'changed',
      semanticId: 'torso',
      before: 0,
      after: 0.125,
    });
    expect(
      comparison.changes.find(
        ({ path }) =>
          path ===
          '$.poses[action].overrides[upper-arm.left].jointValueDegrees',
      ),
    ).toMatchObject({
      kind: 'changed',
      semanticId: 'action',
      before: -48,
      after: -52,
    });
    expect(
      comparison.changes.find(({ path }) =>
        path.endsWith('.materialBindings[body].materialId'),
      ),
    ).toMatchObject({ kind: 'changed', semanticId: 'torso' });
  });

  it('reports removal of an optional authored override', () => {
    const before = structuredClone(adventurerDocument) as AssetDocument;
    const torso = before.assembly.parts.find(({ id }) => id === 'torso');
    const template = before.templates.find(
      ({ id }) => id === torso?.templateId,
    );
    if (torso === undefined || template === undefined)
      throw new Error('Expected canonical torso template.');
    torso.shape = structuredClone(template.shape);
    const after = structuredClone(before) as AssetDocument;
    delete after.assembly.parts.find(({ id }) => id === 'torso')!.shape;

    const comparison = compareSemanticDocuments(before, after);

    expect(
      comparison.changes.find(
        ({ path }) => path === '$.assembly.parts[torso].shape',
      ),
    ).toMatchObject({ kind: 'removed', semanticId: 'torso' });
  });
});
