import { mkdir, mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FileRevisionRepository,
  applySemanticPatch,
} from '../../src/document/index.js';
import { createToolHandlers } from '../../src/tools/index.js';
import { assetFixture } from '../document/fixture.js';

describe('public revision conflict translation', () => {
  it('returns a stable repository envelope without evicting a live lock owner', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-live-lock-'));
    const setup = new FileRevisionRepository({ workspaceRoot });
    const base = await setup.save(assetFixture());
    const lockPath = join(
      workspaceRoot,
      '.forge/revisions/.locks',
      `${base.assetId}.lock`,
    );
    await mkdir(lockPath);
    const ownerPath = join(lockPath, 'owner.json');
    await writeFile(
      ownerPath,
      JSON.stringify({
        pid: process.pid,
        token: 'live-owner',
        acquiredAt: new Date().toISOString(),
      }),
      'utf8',
    );
    const contended = new FileRevisionRepository({
      workspaceRoot,
      lockTimeoutMilliseconds: 20,
    });
    const result = await createToolHandlers({
      revisions: contended,
    }).applyOperations({
      assetId: base.assetId,
      expectedRevisionId: base.revisionId,
      patch: {
        operations: [
          {
            operation: 'setPartVisibility',
            partId: 'part.head',
            visible: false,
          },
        ],
      },
    });
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'REPOSITORY_ERROR', message: 'REVISION_LOCK_TIMEOUT' }],
    });
    expect((await setup.getCurrent(base.assetId))?.revisionId).toBe(
      base.revisionId,
    );
    await unlink(ownerPath);
    await rmdir(lockPath);
  });

  it('reports stored lineage when an applied branch converges on an existing revision', async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-handler-lineage-'),
    );
    const revisions = new FileRevisionRepository({ workspaceRoot });
    const first = await revisions.save(assetFixture());
    const moved = (x: number, expectedRevisionId: string) => {
      const current = revisions.getCurrent(first.assetId);
      return current.then(async (record) => {
        if (record === undefined) throw new Error('Missing current revision.');
        const head = record.document.assembly.parts.find(
          ({ id }) => id === 'part.head',
        );
        if (head === undefined) throw new Error('Missing head fixture.');
        const patched = applySemanticPatch(record.document, {
          operations: [
            {
              operation: 'setPartTransform',
              partId: head.id,
              transform: {
                ...head.transform,
                position: [
                  x,
                  head.transform.position[1],
                  head.transform.position[2],
                ],
              },
            },
          ],
        });
        if (!patched.ok) throw new Error('Fixture patch failed.');
        return revisions.save(patched.document, expectedRevisionId);
      });
    };
    const second = await moved(0.1, first.revisionId);
    const third = await moved(0.2, second.revisionId);
    const handlers = createToolHandlers({ revisions });
    const preview = await handlers.applyOperations({
      assetId: first.assetId,
      expectedRevisionId: third.revisionId,
      restore: { revisionId: first.revisionId },
      dryRun: true,
    });
    const planId = (preview.data as { revisionPlan: { planId: string } })
      .revisionPlan.planId;
    expect(
      await handlers.applyOperations({
        assetId: first.assetId,
        expectedRevisionId: third.revisionId,
        restore: { revisionId: first.revisionId },
        confirmedPlanId: planId,
      }),
    ).toMatchObject({ ok: true, revisionId: first.revisionId });
    const thirdHead = third.document.assembly.parts.find(
      ({ id }) => id === 'part.head',
    );
    if (thirdHead === undefined) throw new Error('Missing third head.');
    const converged = await handlers.applyOperations({
      assetId: first.assetId,
      expectedRevisionId: first.revisionId,
      patch: {
        operations: [
          {
            operation: 'setPartTransform',
            partId: thirdHead.id,
            transform: thirdHead.transform,
          },
        ],
      },
    });
    expect(converged).toMatchObject({
      ok: true,
      revisionId: third.revisionId,
      data: { parentRevisionId: second.revisionId },
    });
    expect((await revisions.getCurrent(first.assetId))?.parentRevisionId).toBe(
      second.revisionId,
    );
  });

  it('returns a stable envelope for the losing concurrent apply operation', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-handler-cas-'));
    const revisions = new FileRevisionRepository({ workspaceRoot });
    const base = await revisions.save(assetFixture());
    const handlers = createToolHandlers({ revisions });
    const operation = (x: number) =>
      handlers.applyOperations({
        assetId: base.assetId,
        expectedRevisionId: base.revisionId,
        patch: {
          operations: [
            {
              operation: 'setPartTransform',
              partId: 'part.head',
              transform: {
                position: [x, 0.7, 0],
                rotation: [0, 0, 0, 1],
                scale: [1, 1, 1],
              },
            },
          ],
        },
      });

    const settled = await Promise.allSettled([operation(0.1), operation(0.2)]);
    expect(settled.every(({ status }) => status === 'fulfilled')).toBe(true);
    const envelopes = settled.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    expect(envelopes.filter(({ ok }) => ok)).toHaveLength(1);
    expect(envelopes.filter(({ ok }) => !ok)).toMatchObject([
      { issues: [{ code: 'REVISION_CONFLICT' }] },
    ]);
  });
});
