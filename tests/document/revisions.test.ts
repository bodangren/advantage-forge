import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FileRevisionRepository,
  applySemanticPatch,
} from '../../src/document/index.js';
import { assetFixture } from './fixture.js';

describe('file revision repository', () => {
  it('writes immutable content-addressed revisions and advances current atomically', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-revisions-'));
    const repository = new FileRevisionRepository({
      workspaceRoot,
      now: () => new Date('2026-07-17T00:00:00Z'),
    });
    const first = await repository.save(assetFixture());
    expect(first.revisionId).toMatch(/^revision\.[a-f0-9]{64}$/);
    const stored = await repository.getCurrent('asset.hero');
    expect(stored?.revisionId).toBe(first.revisionId);
    expect(Object.isFrozen(stored?.document)).toBe(true);
    expect((await repository.save(assetFixture())).revisionId).toBe(
      first.revisionId,
    );

    const patched = applySemanticPatch(assetFixture(), {
      operations: [
        { operation: 'setPartVisibility', partId: 'part.head', visible: false },
      ],
    });
    if (!patched.ok) throw new Error('fixture patch failed');
    const second = await repository.save(patched.document, first.revisionId);
    expect(second.parentRevisionId).toBe(first.revisionId);
    expect(second.revisionId).not.toBe(first.revisionId);
    await expect(
      repository.save(
        assetFixture(),
        'revision.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
    ).rejects.toThrow('REVISION_CONFLICT');

    const pointer = await readFile(
      join(workspaceRoot, '.forge/revisions/asset.hero/current'),
      'utf8',
    );
    expect(pointer.trim()).toBe(second.revisionId);
  });

  it('rejects revision storage outside the active workspace', () => {
    expect(
      () =>
        new FileRevisionRepository({
          workspaceRoot: '/workspace/project',
          storageDirectory: '../escape',
        }),
    ).toThrow(/inside/);
  });

  it('returns undefined for missing records and rejects invalid identifiers', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-revisions-'));
    const repository = new FileRevisionRepository({ workspaceRoot });
    expect(await repository.getCurrent('asset.missing')).toBeUndefined();
    await expect(
      repository.get('asset.hero', 'not-a-revision'),
    ).rejects.toThrow('INVALID_REVISION_ID');
    await expect(repository.getCurrent('../escape')).rejects.toThrow(
      'INVALID_ASSET_ID',
    );
  });

  it('rejects corrupted stored revision documents', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-revisions-'));
    const repository = new FileRevisionRepository({ workspaceRoot });
    const revisionId =
      'revision.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const directory = join(workspaceRoot, '.forge/revisions/asset.hero');
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, `${revisionId}.json`),
      JSON.stringify({
        revisionId,
        assetId: 'asset.hero',
        createdAt: 'now',
        document: {},
      }),
      'utf8',
    );
    await expect(repository.get('asset.hero', revisionId)).rejects.toThrow(
      /failed validation/,
    );
  });
});
