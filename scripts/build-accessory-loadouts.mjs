import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';
import { z } from 'zod';

const LOADOUTS = [
  {
    id: 'guard',
    accessories: [
      ['equipment.helmet.iron', 'head'],
      ['equipment.spear', 'main-hand'],
      ['equipment.shield.kite', 'off-hand'],
      ['equipment.armor.mail', 'body'],
    ],
  },
  {
    id: 'traveler',
    accessories: [
      ['equipment.hood.cloth', 'head'],
      ['equipment.staff', 'main-hand'],
      ['equipment.backpack', 'back'],
    ],
  },
  {
    id: 'ranger',
    accessories: [
      ['equipment.spear', 'main-hand'],
      ['equipment.armor.leather', 'body'],
      ['equipment.quiver', 'back'],
      ['equipment.pouch.belt', 'waist'],
    ],
  },
  {
    id: 'caster',
    accessories: [
      ['equipment.hood.cloth', 'head'],
      ['equipment.staff', 'main-hand'],
      ['equipment.cape', 'back'],
      ['equipment.pouch.belt', 'waist'],
    ],
  },
];
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const ASSET_ID = 'adventurer.rustic';
const workspaceRoot = resolve(import.meta.dirname, '..');
const outputRoot = resolve(process.argv[2] ?? '');
const requestedLoadoutId = process.argv[3];

if (process.argv[2] === undefined)
  throw new Error(
    'Usage: build-accessory-loadouts.mjs <new-output-directory> [loadout-id]',
  );
if (!isInside(workspaceRoot, outputRoot))
  throw new Error('Output directory must stay inside the workspace.');
if (
  requestedLoadoutId !== undefined &&
  !LOADOUTS.some((loadout) => loadout.id === requestedLoadoutId)
)
  throw new Error(`Unknown loadout id: ${requestedLoadoutId}`);
await mkdir(outputRoot);

const EnvelopeSchema = z.object({
  ok: z.boolean(),
  revisionId: z.string().optional(),
  affectedIds: z.array(z.string()),
  summary: z.string(),
  issues: z.array(z.unknown()),
  data: z.unknown().optional(),
});
const CandidateSchema = z.object({
  templateId: z.string(),
  defaultMaterialId: z.string(),
  compatibility: z.object({ occupiedByPartId: z.string().optional() }),
  requiredFeatures: z.array(
    z.object({
      id: z.string(),
      intendedDirections: z.array(z.string()),
      minimumPixelArea: z.number(),
      minimumWidthPixels: z.number(),
      maximumOcclusionRatio: z.number(),
      minimumOklabDistance: z.number(),
    }),
  ),
  exampleOperation: z.record(z.string(), z.unknown()),
});
const DiscoverySchema = z.object({ items: z.array(CandidateSchema) });
const OperationSummarySchema = z.object({ partId: z.string() });
const RenderSchema = z.object({
  frames: z.array(
    z.object({
      direction: z.string(),
      path: z.string(),
      metrics: z.object({
        transparentPixelCount: z.number(),
        clippedEdges: z.array(z.string()),
        groundAnchorDeviationPixels: z.number().nullable(),
        framingEvidence: z.object({
          topMarginPixels: z.number().nullable(),
          centerDeviationPixels: z.number().nullable(),
          heightDeviationPixels: z.number(),
        }),
        requiredFeatureEvidence: z.array(
          z.object({
            featureId: z.string(),
            partId: z.string(),
            templateId: z.string(),
            silhouetteWidthPixels: z.number().nullable(),
            isolatedPixelArea: z.number(),
            visiblePixelArea: z.number(),
            occlusionRatio: z.number(),
            materialOklabDistance: z.number(),
            passes: z.boolean(),
          }),
        ),
      }),
    }),
  ),
});

const port = 6400 + (process.pid % 500);
const inspectorUrl = `http://127.0.0.1:${port}`;
const vite = await createServer({
  root: workspaceRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true },
});
await vite.listen();

const summary = [];
try {
  for (const loadout of LOADOUTS.filter(
    ({ id }) => requestedLoadoutId === undefined || id === requestedLoadoutId,
  )) {
    const loadoutRoot = resolve(outputRoot, loadout.id);
    const runtimeRoot = resolve(loadoutRoot, 'runtime');
    await mkdir(runtimeRoot, { recursive: true });
    const ledger = [];
    const transport = new StdioClientTransport({
      command: resolve(workspaceRoot, 'node_modules/.bin/tsx'),
      args: [resolve(workspaceRoot, 'src/mcp/stdio.ts')],
      cwd: runtimeRoot,
      env: {
        ...getDefaultEnvironment(),
        FORGE_INSPECTOR_URL: inspectorUrl,
      },
      stderr: 'pipe',
    });
    const stderr = [];
    transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));
    const client = new Client({
      name: `s4-${loadout.id}-public-client`,
      version: '1.0.0',
    });
    let failure;
    try {
      await client.connect(transport);
      const call = async (name, arguments_) => {
        const response = await client.callTool({ name, arguments: arguments_ });
        const text = response.content.find(
          (part) => part.type === 'text' && typeof part.text === 'string',
        );
        if (text === undefined)
          throw new Error(`${name} did not return MCP text content.`);
        const envelope = EnvelopeSchema.parse(JSON.parse(text.text));
        ledger.push({ name, arguments: arguments_, response: envelope });
        if (!envelope.ok)
          throw new Error(`${name} failed: ${JSON.stringify(envelope.issues)}`);
        return envelope;
      };

      await call('inspect_capabilities', {});
      const created = await call('create_asset', { reference: 'adventurer' });
      let revisionId = requiredRevision(created, 'created baseline');
      const baselineRevisionId = revisionId;
      await call('render_preview', { assetId: ASSET_ID });

      const occupied = new Set();
      for (const slot of ['main-hand', 'off-hand']) {
        const discovered = DiscoverySchema.parse(
          (
            await call('search_accessories', {
              assetId: ASSET_ID,
              archetypeId: 'adventurer',
              query: { slots: [slot], offset: 0, limit: 50 },
            })
          ).data,
        );
        const partId = discovered.items.find(
          (item) => item.compatibility.occupiedByPartId !== undefined,
        )?.compatibility.occupiedByPartId;
        if (partId === undefined)
          throw new Error(`No public occupied owner was found for ${slot}.`);
        occupied.add(partId);
      }
      for (const partId of occupied) {
        const request = {
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: 'adventurer',
          operation: { operation: 'unequip', partId },
        };
        await call('apply_accessory_operation', { ...request, dryRun: true });
        revisionId = requiredRevision(
          await call('apply_accessory_operation', {
            ...request,
            dryRun: false,
          }),
          `clear ${partId}`,
        );
      }

      const expectedFeatures = [];
      const equippedPartIds = [];
      for (const [templateId, slot] of loadout.accessories) {
        const discovered = DiscoverySchema.parse(
          (
            await call('search_accessories', {
              assetId: ASSET_ID,
              archetypeId: loadout.id,
              query: { slots: [slot], offset: 0, limit: 50 },
            })
          ).data,
        );
        const candidate = discovered.items.find(
          (item) => item.templateId === templateId,
        );
        if (candidate === undefined)
          throw new Error(`${loadout.id} could not discover ${templateId}.`);
        await call('inspect_template', { templateId });
        const request = {
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: loadout.id,
          operation: candidate.exampleOperation,
        };
        await call('apply_accessory_operation', { ...request, dryRun: true });
        const applied = await call('apply_accessory_operation', {
          ...request,
          dryRun: false,
        });
        revisionId = requiredRevision(applied, `equip ${templateId}`);
        const partId = OperationSummarySchema.parse(applied.data).partId;
        equippedPartIds.push(partId);
        expectedFeatures.push(
          ...candidate.requiredFeatures.map((feature) => ({
            ...feature,
            partId,
            templateId,
          })),
        );
      }

      const idleRevisionId = revisionId;
      await call('inspect_asset', {
        assetId: ASSET_ID,
        section: 'parts',
        offset: 0,
        limit: 100,
      });
      await call('inspect_asset', {
        assetId: ASSET_ID,
        section: 'renderProfiles',
        offset: 0,
        limit: 100,
      });
      await call('compare_revisions', {
        assetId: ASSET_ID,
        baseRevisionId: baselineRevisionId,
        targetRevisionId: idleRevisionId,
        offset: 0,
        limit: 100,
      });
      await call('validate_asset', { assetId: ASSET_ID });
      const idleRender = await call('render_preview', { assetId: ASSET_ID });
      const idleIssues = auditRender(idleRender.data, expectedFeatures);
      await call('export_asset', { assetId: ASSET_ID });

      revisionId = requiredRevision(
        await call('set_pose', {
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          poseId: 'action',
        }),
        'set action pose',
      );
      const actionRevisionId = revisionId;
      const actionRender = await call('render_preview', { assetId: ASSET_ID });
      const actionIssues = auditRender(actionRender.data, expectedFeatures);
      await call('export_asset', { assetId: ASSET_ID });

      for (const partId of equippedPartIds) {
        const request = {
          assetId: ASSET_ID,
          expectedRevisionId: revisionId,
          archetypeId: loadout.id,
          operation: { operation: 'unequip', partId },
        };
        await call('apply_accessory_operation', { ...request, dryRun: true });
        revisionId = requiredRevision(
          await call('apply_accessory_operation', {
            ...request,
            dryRun: false,
          }),
          `unequip ${partId}`,
        );
      }
      const unequippedRevisionId = revisionId;
      await call('render_preview', { assetId: ASSET_ID });
      const issues = [...idleIssues, ...actionIssues];
      const result = {
        loadoutId: loadout.id,
        modelBoundary: 'public MCP tools only',
        baselineRevisionId,
        idleRevisionId,
        actionRevisionId,
        unequippedRevisionId,
        equippedPartIds,
        expectedFeatures,
        acceptance: { passes: issues.length === 0, issues },
        toolCallCount: ledger.length,
      };
      await writeJson(resolve(loadoutRoot, 'result.json'), result, outputRoot);
      summary.push(result);
    } catch (error) {
      failure = error instanceof Error ? (error.stack ?? error.message) : error;
      summary.push({
        loadoutId: loadout.id,
        acceptance: { passes: false, issues: [String(failure)] },
        toolCallCount: ledger.length,
      });
    } finally {
      await writeJson(
        resolve(loadoutRoot, 'transcript.json'),
        { loadoutId: loadout.id, ledger, stderr, failure },
        outputRoot,
      );
      await client.close();
    }
  }
} finally {
  await vite.close();
}

await writeJson(resolve(outputRoot, 'summary.json'), summary, outputRoot);
if (summary.some((result) => result.acceptance.passes !== true))
  process.exitCode = 1;

function auditRender(value, expectedFeatures) {
  const render = RenderSchema.parse(value);
  const issues = [];
  const receivedDirections = render.frames.map(({ direction }) => direction);
  if (receivedDirections.join(',') !== DIRECTIONS.join(','))
    issues.push(`direction order: ${receivedDirections.join(', ')}`);
  for (const frame of render.frames) {
    const { direction, metrics } = frame;
    if (metrics.transparentPixelCount <= 0)
      issues.push(`${direction}: frame has no transparent pixels`);
    if (metrics.clippedEdges.length > 0)
      issues.push(`${direction}: clipped ${metrics.clippedEdges.join(',')}`);
    if (metrics.groundAnchorDeviationPixels !== 0)
      issues.push(`${direction}: ground anchor is not zero`);
    if (
      metrics.framingEvidence.topMarginPixels === null ||
      metrics.framingEvidence.topMarginPixels < 4
    )
      issues.push(`${direction}: top margin is below 4px`);
    if (
      metrics.framingEvidence.centerDeviationPixels === null ||
      metrics.framingEvidence.centerDeviationPixels > 12
    )
      issues.push(`${direction}: center deviation exceeds 12px`);
    if (metrics.framingEvidence.heightDeviationPixels > 12)
      issues.push(`${direction}: height deviation exceeds 12px`);
    for (const expected of expectedFeatures) {
      if (!expected.intendedDirections.includes(direction)) continue;
      const evidence = metrics.requiredFeatureEvidence.find(
        (candidate) =>
          candidate.featureId === expected.id &&
          candidate.partId === expected.partId &&
          candidate.templateId === expected.templateId,
      );
      if (evidence === undefined) {
        issues.push(`${direction}: missing ${expected.id}`);
        continue;
      }
      if (evidence.visiblePixelArea < expected.minimumPixelArea)
        issues.push(
          `${direction}: ${expected.id} visible area ${evidence.visiblePixelArea} < ${expected.minimumPixelArea}`,
        );
      if (
        evidence.silhouetteWidthPixels === null ||
        evidence.silhouetteWidthPixels < expected.minimumWidthPixels
      )
        issues.push(
          `${direction}: ${expected.id} width ${evidence.silhouetteWidthPixels} < ${expected.minimumWidthPixels}`,
        );
      if (evidence.occlusionRatio > expected.maximumOcclusionRatio)
        issues.push(
          `${direction}: ${expected.id} occlusion ${evidence.occlusionRatio} > ${expected.maximumOcclusionRatio}`,
        );
      if (evidence.materialOklabDistance < expected.minimumOklabDistance)
        issues.push(
          `${direction}: ${expected.id} OKLab ${evidence.materialOklabDistance} < ${expected.minimumOklabDistance}`,
        );
    }
  }
  return issues;
}

function requiredRevision(envelope, label) {
  if (envelope.revisionId === undefined)
    throw new Error(`${label} did not return a revision ID.`);
  return envelope.revisionId;
}

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

function portable(value, root) {
  if (typeof value === 'string' && isAbsolute(value)) {
    const path = relative(root, value);
    if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path))
      return value;
    return path.split(sep).join('/');
  }
  if (Array.isArray(value)) return value.map((item) => portable(item, root));
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, portable(item, root)]),
    );
  return value;
}

async function writeJson(path, value, root) {
  await writeFile(path, `${JSON.stringify(portable(value, root), null, 2)}\n`);
}
