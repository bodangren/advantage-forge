import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FileRevisionRepository,
  applySemanticPatch,
} from '../../src/document/index.js';
import { assetFixture } from './fixture.js';

describe('revision current-pointer restoration', () => {
  it('atomically restores an immutable revision without rewriting or deleting lineage', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-restore-'));
    const repository = new FileRevisionRepository({
      workspaceRoot,
      now: () => new Date('2026-07-22T00:00:00Z'),
    });
    const first = await repository.save(assetFixture());
    const patched = applySemanticPatch(first.document, {
      operations: [
        { operation: 'setPartVisibility', partId: 'part.head', visible: false },
      ],
    });
    if (!patched.ok) throw new Error('fixture patch failed');
    const second = await repository.save(patched.document, first.revisionId);
    const directory = join(workspaceRoot, '.forge/revisions/asset.hero');
    const firstPath = join(directory, `${first.revisionId}.json`);
    const secondPath = join(directory, `${second.revisionId}.json`);
    const immutableBefore = await Promise.all([
      readFile(firstPath, 'utf8'),
      readFile(secondPath, 'utf8'),
    ]);

    const restored = await repository.restoreCurrent(
      'asset.hero',
      first.revisionId,
      second.revisionId,
    );
    expect(restored.revisionId).toBe(first.revisionId);
    expect((await repository.getCurrent('asset.hero'))?.revisionId).toBe(
      first.revisionId,
    );
    expect(
      await Promise.all([
        readFile(firstPath, 'utf8'),
        readFile(secondPath, 'utf8'),
      ]),
    ).toEqual(immutableBefore);
    expect((await readdir(directory)).sort()).toEqual(
      [
        'current',
        `${first.revisionId}.json`,
        `${second.revisionId}.json`,
      ].sort(),
    );

    await expect(
      repository.restoreCurrent(
        'asset.hero',
        second.revisionId,
        second.revisionId,
      ),
    ).rejects.toThrow('REVISION_CONFLICT');
    expect((await repository.getCurrent('asset.hero'))?.revisionId).toBe(
      first.revisionId,
    );
  });
});
