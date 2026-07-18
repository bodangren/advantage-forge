import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import {
  FileRevisionRepository,
  canonicalJson,
} from '../src/document/index.js';
import { referenceDocuments } from '../src/fantasy-kit/index.js';
import { LocalBrowserArtifactService } from '../src/services/index.js';
import { createToolHandlers } from '../src/tools/index.js';
import { assertRenderArtifactAcceptance } from '../src/validation/index.js';
import { portableEvidence } from './reference-evidence.js';

const workspaceRoot = process.cwd();
const port = 4174;
const vite = await createServer({
  root: workspaceRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true },
});
await vite.listen();

try {
  const revisions = new FileRevisionRepository({
    workspaceRoot,
    storageDirectory: `.forge/reference-build-${process.pid}/revisions`,
  });
  const artifacts = new LocalBrowserArtifactService({
    workspaceRoot,
    inspectorUrl: `http://127.0.0.1:${port}`,
  });
  const handlers = createToolHandlers({
    revisions,
    renderService: artifacts,
    exportService: artifacts,
  });
  const evidence: unknown[] = [];
  const referenceDirectory = resolve(workspaceRoot, 'references');
  await mkdir(referenceDirectory, { recursive: true });
  for (const reference of Object.keys(
    referenceDocuments,
  ) as (keyof typeof referenceDocuments)[]) {
    const created = await handlers.createAsset({ reference });
    if (!created.ok || created.revisionId === undefined)
      throw new Error(`Failed to create ${reference}: ${created.summary}`);
    const assetId = referenceDocuments[reference].id;
    let revisionId = created.revisionId;
    const inspected = await handlers.inspectAsset({ assetId });
    if (!inspected.ok)
      throw new Error(`Failed to inspect ${reference}: ${inspected.summary}`);
    let variantArtifacts: Record<string, unknown> | undefined;
    if (reference === 'adventurer') {
      const idleEquipped = await handlers.renderPreview({ assetId });
      if (!idleEquipped.ok)
        throw new Error(`Failed idle equipped render: ${idleEquipped.summary}`);
      assertRenderArtifactAcceptance(
        idleEquipped.data,
        referenceDocuments.adventurer.renderProfiles[0]!,
        'adventurer idle equipped',
      );
      const idleEquippedRevisionId = revisionId;
      const unequipped = await handlers.applyOperations({
        assetId,
        expectedRevisionId: revisionId,
        dryRun: false,
        patch: {
          operations: [
            { operation: 'setActiveVariant', variantId: 'unequipped' },
          ],
        },
      });
      if (!unequipped.ok || unequipped.revisionId === undefined)
        throw new Error(`Failed adventurer unequip: ${unequipped.summary}`);
      revisionId = unequipped.revisionId;
      const equipped = await handlers.applyOperations({
        assetId,
        expectedRevisionId: revisionId,
        dryRun: false,
        patch: {
          operations: [
            { operation: 'setActiveVariant', variantId: 'equipped' },
          ],
        },
      });
      if (!equipped.ok || equipped.revisionId === undefined)
        throw new Error(`Failed adventurer equip: ${equipped.summary}`);
      revisionId = equipped.revisionId;
      const localized = await handlers.applyOperations({
        assetId,
        expectedRevisionId: revisionId,
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
      if (!localized.ok || localized.revisionId === undefined)
        throw new Error(
          `Failed localized adventurer edit: ${localized.summary}`,
        );
      revisionId = localized.revisionId;
      const posed = await handlers.setPose({
        assetId,
        expectedRevisionId: revisionId,
        poseId: 'action',
        dryRun: false,
      });
      if (!posed.ok || posed.revisionId === undefined)
        throw new Error(`Failed adventurer pose: ${posed.summary}`);
      revisionId = posed.revisionId;
      variantArtifacts = {
        idleEquipped: {
          revisionId: idleEquippedRevisionId,
          rendered: idleEquipped,
        },
        unequipRevisionId: unequipped.revisionId,
        equipRevisionId: equipped.revisionId,
      };
    }
    const current = await revisions.getCurrent(assetId);
    if (current === undefined)
      throw new Error('Missing current revision for ' + reference + '.');
    await writeFile(
      resolve(referenceDirectory, reference + '.asset.json'),
      canonicalJson(current.document),
      'utf8',
    );
    const validated = await handlers.validateAsset({ assetId });
    const rendered = await handlers.renderPreview({ assetId });
    const exported = await handlers.exportAsset({ assetId });
    if (!validated.ok || !rendered.ok || !exported.ok)
      throw new Error(`Reference workflow failed for ${reference}.`);
    assertRenderArtifactAcceptance(
      rendered.data,
      current.document.renderProfiles[0]!,
      `${reference} current revision`,
    );
    if (reference === 'adventurer') {
      const actionEquippedRevisionId = revisionId;
      const unequipped = await handlers.applyOperations({
        assetId,
        expectedRevisionId: revisionId,
        dryRun: false,
        patch: {
          operations: [
            { operation: 'setActiveVariant', variantId: 'unequipped' },
          ],
        },
      });
      if (!unequipped.ok || unequipped.revisionId === undefined)
        throw new Error(
          `Failed action unequipped variant: ${unequipped.summary}`,
        );
      revisionId = unequipped.revisionId;
      const actionUnequipped = await handlers.renderPreview({ assetId });
      if (!actionUnequipped.ok)
        throw new Error(
          `Failed action unequipped render: ${actionUnequipped.summary}`,
        );
      assertRenderArtifactAcceptance(
        actionUnequipped.data,
        current.document.renderProfiles[0]!,
        'adventurer action unequipped',
      );
      const restored = await handlers.applyOperations({
        assetId,
        expectedRevisionId: revisionId,
        dryRun: false,
        patch: {
          operations: [
            { operation: 'setActiveVariant', variantId: 'equipped' },
          ],
        },
      });
      if (!restored.ok || restored.revisionId === undefined)
        throw new Error(`Failed final equipped restore: ${restored.summary}`);
      revisionId = restored.revisionId;
      variantArtifacts = {
        ...variantArtifacts,
        actionEquipped: {
          revisionId: actionEquippedRevisionId,
          rendered,
          exported,
        },
        actionUnequipped: {
          revisionId: unequipped.revisionId,
          rendered: actionUnequipped,
        },
        restoredEquippedRevisionId: restored.revisionId,
      };
    }
    evidence.push({
      reference,
      assetId,
      revisionId,
      inspected,
      validated,
      rendered,
      exported,
      variantArtifacts,
    });
  }
  const dossierPath = resolve(
    workspaceRoot,
    'measure/archive/fantasy_asset_mvp_20260717/reference-build.json',
  );
  const dossier = portableEvidence(
    {
      workflow: [
        'create_asset',
        'inspect_asset',
        'apply_operations',
        'set_pose',
        'validate_asset',
        'render_preview',
        'export_asset',
      ],
      evidence,
    },
    workspaceRoot,
  );
  await writeFile(dossierPath, `${JSON.stringify(dossier, null, 2)}\n`, 'utf8');
  console.log(dossierPath);
} finally {
  await vite.close();
}
