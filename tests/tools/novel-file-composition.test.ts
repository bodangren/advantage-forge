import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  NovelAddPartOperationSchema,
  NovelGrammarPlanningResultSchema,
} from '../../src/contracts/index.js';
import {
  FileRevisionRepository,
  compareSemanticDocuments,
  contentRevisionId,
} from '../../src/document/index.js';
import { inspectNovelAssetCompleteness } from '../../src/fantasy-kit/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

const PlanningDataSchema = z.object({
  planning: NovelGrammarPlanningResultSchema,
});

describe('file-backed novel composition reloads', () => {
  it.each([
    [
      'barrel',
      {
        identity: {
          assetId: 'barrel.file-backed',
          name: 'File Backed Barrel',
          kitId: 'rustic-human',
          family: 'standalone-prop',
          archetypeId: 'prop.banded-container.rustic',
          seed: 4_001,
        },
      },
      'iron-banded barrel',
      'container.body',
    ],
    [
      'humanoid',
      {
        identity: {
          assetId: 'guard.file-backed',
          name: 'File Backed Guard',
          kitId: 'rustic-human',
          family: 'humanoid',
          archetypeId: 'humanoid.biped.rustic',
          seed: 4_002,
        },
      },
      'round chibi village guard with iron helmet, spear, and kite shield',
      'body.root',
    ],
  ] as const)(
    'keeps the %s root and completeness stable across every canonical reload',
    async (_label, identity, brief, rootPartId) => {
      const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-novel-file-'));
      const repository = new FileRevisionRepository({ workspaceRoot });
      const handlers = createToolHandlers({ revisions: repository });
      expect(await handlers.createAsset(identity)).toMatchObject({ ok: true });
      const planning = PlanningDataSchema.parse(
        (await handlers.listKits({ brief })).data,
      ).planning;
      if (!planning.supported)
        throw new Error('Expected supported executable planning.');

      for (const suggestion of planning.suggestedOperations) {
        const operation = NovelAddPartOperationSchema.parse(suggestion);
        const current = await repository.getCurrent(identity.identity.assetId);
        if (current === undefined) throw new Error('Missing current revision.');
        const applied = await handlers.applyOperations({
          assetId: identity.identity.assetId,
          expectedRevisionId: current.revisionId,
          composition: operation,
        });
        expect(applied.ok).toBe(true);
        const reloaded = await repository.getCurrent(identity.identity.assetId);
        expect(reloaded?.revisionId).toBe(applied.revisionId);
        expect(reloaded?.revisionId).toBe(
          contentRevisionId(reloaded!.document),
        );
      }

      const restarted = new FileRevisionRepository({ workspaceRoot });
      const current = await restarted.getCurrent(identity.identity.assetId);
      if (current === undefined) throw new Error('Missing restarted revision.');
      expect(
        current.document.assembly.parts.some(({ id }) => id === rootPartId),
      ).toBe(true);
      expect(inspectNovelAssetCompleteness(current.document)).toMatchObject({
        state: 'complete',
        missingRequirements: [],
        unattachedPartIds: [],
      });
      const selfComparison = compareSemanticDocuments(
        current.document,
        current.document,
      );
      expect(selfComparison.affectedIds).toEqual([]);
      expect(selfComparison.preservedIds).toContain(rootPartId);
      expect(selfComparison.changes).toEqual([]);
      expect(
        (
          await createToolHandlers({ revisions: restarted }).validateAsset({
            assetId: identity.identity.assetId,
          })
        ).ok,
      ).toBe(true);
    },
    30_000,
  );
});
