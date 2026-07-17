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

const workspaceRoot = process.cwd();
const port = 4174;
const vite = await createServer({
  root: workspaceRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true },
});
await vite.listen();

try {
  const revisions = new FileRevisionRepository({ workspaceRoot });
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
    if (reference === 'adventurer') {
      const localized = await handlers.applyOperations({
        assetId,
        expectedRevisionId: revisionId,
        dryRun: false,
        patch: {
          operations: [
            {
              operation: 'setPartTransform',
              partId: 'torso',
              transform: {
                position: [0, 1.42, 0],
                rotation: [0, 0, 0, 1],
                scale: [1.05, 1.08, 1],
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
    evidence.push({
      reference,
      assetId,
      revisionId,
      inspected,
      validated,
      rendered,
      exported,
    });
  }
  const dossierPath = resolve(
    workspaceRoot,
    'measure/tracks/fantasy_asset_mvp_20260717/reference-build.json',
  );
  await writeFile(
    dossierPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), workflow: ['create_asset', 'inspect_asset', 'apply_operations', 'set_pose', 'validate_asset', 'render_preview', 'export_asset'], evidence }, null, 2)}\n`,
    'utf8',
  );
  console.log(dossierPath);
} finally {
  await vite.close();
}
