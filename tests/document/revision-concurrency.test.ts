import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FileRevisionRepository,
  applySemanticPatch,
  type RevisionRecord,
} from '../../src/document/index.js';
import { assetFixture } from './fixture.js';

function movedHead(
  revision: RevisionRecord,
  x: number,
): RevisionRecord['document'] {
  const head = revision.document.assembly.parts.find(
    ({ id }) => id === 'part.head',
  );
  if (head === undefined) throw new Error('Missing head fixture part.');
  const patched = applySemanticPatch(revision.document, {
    operations: [
      {
        operation: 'setPartTransform',
        partId: head.id,
        transform: {
          ...head.transform,
          position: [x, head.transform.position[1], head.transform.position[2]],
        },
      },
    ],
  });
  if (!patched.ok) throw new Error('Fixture patch failed.');
  return patched.document;
}

async function threeRevisions(repository: FileRevisionRepository) {
  const first = await repository.save(assetFixture());
  const second = await repository.save(movedHead(first, 0.1), first.revisionId);
  const third = await repository.save(
    movedHead(second, 0.2),
    second.revisionId,
  );
  return { first, second, third };
}

function expectSingleConflict(
  results: readonly PromiseSettledResult<RevisionRecord>[],
): RevisionRecord {
  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<RevisionRecord> =>
      result.status === 'fulfilled',
  );
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(rejected[0]?.reason).toMatchObject({ message: 'REVISION_CONFLICT' });
  return fulfilled[0]!.value;
}

describe('cross-instance revision pointer concurrency', () => {
  it('rejects symbolic-link lock paths and owners without touching external files', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-lock-symlink-'));
    const externalRoot = await mkdtemp(join(tmpdir(), 'forge-lock-sentinel-'));
    const repository = new FileRevisionRepository({ workspaceRoot });
    const first = await repository.save(assetFixture());
    const sentinelPath = join(externalRoot, 'owner.json');
    const sentinel = 'external sentinel must survive';
    await writeFile(sentinelPath, sentinel, 'utf8');
    const lockPath = join(
      workspaceRoot,
      '.forge/revisions/.locks',
      `${first.assetId}.lock`,
    );

    await symlink(externalRoot, lockPath);
    await expect(
      repository.save(movedHead(first, 0.1), first.revisionId),
    ).rejects.toThrow('REVISION_LOCK_PATH_INVALID');
    expect(await readFile(sentinelPath, 'utf8')).toBe(sentinel);

    await unlink(lockPath);
    await mkdir(lockPath);
    await symlink(sentinelPath, join(lockPath, 'owner.json'));
    await expect(
      repository.save(movedHead(first, 0.1), first.revisionId),
    ).rejects.toThrow('REVISION_LOCK_OWNER_INVALID');
    expect(await readFile(sentinelPath, 'utf8')).toBe(sentinel);
    expect((await repository.getCurrent(first.assetId))?.revisionId).toBe(
      first.revisionId,
    );
  });

  it('recovers a dead-owner lock after restart without deleting immutable revisions', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-stale-lock-'));
    const repository = new FileRevisionRepository({ workspaceRoot });
    const first = await repository.save(assetFixture());
    const lockRoot = join(workspaceRoot, '.forge/revisions/.locks');
    const lockPath = join(lockRoot, `${first.assetId}.lock`);
    await mkdir(lockPath);
    await writeFile(
      join(lockPath, 'owner.json'),
      JSON.stringify({
        pid: 2_147_483_647,
        token: 'dead-owner',
        acquiredAt: '2026-07-22T00:00:00.000Z',
      }),
      'utf8',
    );

    const restarted = new FileRevisionRepository({ workspaceRoot });
    const saved = await restarted.save(movedHead(first, 0.1), first.revisionId);
    expect((await restarted.getCurrent(first.assetId))?.revisionId).toBe(
      saved.revisionId,
    );
    expect(await restarted.get(first.assetId, first.revisionId)).toBeDefined();
    expect(await readdir(lockRoot)).toEqual([]);
  });

  it('returns the stored immutable lineage when a restored branch converges on existing content', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-converge-'));
    const repository = new FileRevisionRepository({ workspaceRoot });
    const { first, second, third } = await threeRevisions(repository);
    await repository.restoreCurrent(
      first.assetId,
      first.revisionId,
      third.revisionId,
    );

    const converged = await repository.save(third.document, first.revisionId);
    const stored = await repository.get(first.assetId, third.revisionId);
    expect(converged).toEqual(stored);
    expect(converged.parentRevisionId).toBe(second.revisionId);
    expect((await repository.getCurrent(first.assetId))?.parentRevisionId).toBe(
      second.revisionId,
    );
  });

  it('serializes two concurrent same-expected restores with a stable conflict loser', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-cas-restore-'));
    const repository = new FileRevisionRepository({ workspaceRoot });
    const { first, second, third } = await threeRevisions(repository);

    const winner = expectSingleConflict(
      await Promise.allSettled([
        repository.restoreCurrent(
          first.assetId,
          first.revisionId,
          third.revisionId,
        ),
        repository.restoreCurrent(
          second.assetId,
          second.revisionId,
          third.revisionId,
        ),
      ]),
    );
    expect((await repository.getCurrent(first.assetId))?.revisionId).toBe(
      winner.revisionId,
    );
    expect(await repository.get(first.assetId, first.revisionId)).toBeDefined();
    expect(
      await repository.get(second.assetId, second.revisionId),
    ).toBeDefined();
    expect(await repository.get(third.assetId, third.revisionId)).toBeDefined();
  });

  it('serializes save versus restore across independent repositories sharing storage', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-cas-shared-'));
    const writer = new FileRevisionRepository({ workspaceRoot });
    const restorer = new FileRevisionRepository({ workspaceRoot });
    const { first, third } = await threeRevisions(writer);
    const nextDocument = movedHead(third, 0.3);

    const winner = expectSingleConflict(
      await Promise.allSettled([
        writer.save(nextDocument, third.revisionId),
        restorer.restoreCurrent(
          first.assetId,
          first.revisionId,
          third.revisionId,
        ),
      ]),
    );
    expect((await writer.getCurrent(first.assetId))?.revisionId).toBe(
      winner.revisionId,
    );
    expect(await writer.get(first.assetId, first.revisionId)).toBeDefined();
    expect(await writer.get(third.assetId, third.revisionId)).toBeDefined();
  });
});
