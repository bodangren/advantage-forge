import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from 'vite';
import { z } from 'zod';
import {
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  ForgeInterchangeArtifactChunkSchema,
  NovelGrammarPlanningResultSchema,
  ToolResultEnvelopeSchema,
  parseForgeAuthoringReviewManifest,
  parseForgeAssetInterchangeManifest,
  type ForgeAuthoringReviewManifest,
  type ToolResultEnvelope,
} from '../src/contracts/index.js';
import { PUBLIC_TOOL_NAMES } from '../src/tools/index.js';

const LedgerSchema = z.array(
  z
    .object({
      name: z.string(),
      args: z.record(z.string(), z.unknown()),
      envelope: z.object({ revisionId: z.string().optional() }).passthrough(),
    })
    .passthrough(),
);
const PLAN_ID = /^plan\.[a-f0-9]{64}$/u;
const S13_ASSET_ID = 'guard.reference-ready.s13-grammar';
const S14_ASSET_ID = 'guard.reference-ready.s14-public-path';
const S13_BRIEF =
  'Create an original round chibi rustic village sentry wearing a fitted iron helmet.';
const S13_MORPHOLOGY = {
  contractId: 'forge-humanoid-morphology/v1',
  profileId: 'morphology.reference-chibi-guard',
  kitId: 'rustic-human',
  archetypeId: 'humanoid.biped.rustic',
  styleProfile: { id: 'cute_chibi_v1', version: '1.0.0' },
  seed: 42,
  proportions: {
    headScale: 1,
    headWidth: 1,
    headDepth: 0.7,
    craniumRoundness: 1,
    torsoLength: -1,
    torsoWidth: 1,
    torsoDepth: 0.25,
    shoulderWidth: 0.8,
    pelvisWidth: 0.65,
    armLength: -0.7,
    armThickness: 0.7,
    legLength: -1,
    legThickness: 0.8,
    handScale: 0.3,
    footScale: 0.35,
    neckLength: -1,
  },
  features: {
    hairStyle: 'short_rounded',
    eyeStyle: 'round',
    facialHairStyle: 'none',
    clothingSilhouette: 'light_armor',
  },
  symmetry: { bilateral: true },
} as const;

type S13LedgerEntry = {
  readonly name: string;
  readonly args: Record<string, unknown>;
  readonly envelope: ToolResultEnvelope;
};

function textContent(response: unknown): string {
  if (
    response === null ||
    typeof response !== 'object' ||
    !('content' in response) ||
    !Array.isArray(response.content)
  )
    throw new Error('Expected an MCP content array.');
  const content: unknown[] = response.content;
  const part = content.find(
    (
      candidate,
    ): candidate is { readonly type: 'text'; readonly text: string } =>
      candidate !== null &&
      typeof candidate === 'object' &&
      'type' in candidate &&
      candidate.type === 'text' &&
      'text' in candidate &&
      typeof candidate.text === 'string',
  );
  if (part === undefined) throw new Error('Expected an MCP text response.');
  return part.text;
}

function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function call(
  client: Client,
  name: string,
  arguments_: Record<string, unknown>,
): Promise<ToolResultEnvelope> {
  const response = await client.callTool({ name, arguments: arguments_ });
  const envelope = ToolResultEnvelopeSchema.parse(
    JSON.parse(textContent(response)),
  );
  if (!envelope.ok)
    throw new Error(`${name} failed: ${JSON.stringify(envelope.issues)}`);
  return envelope;
}

async function authorReferenceGuard(client: Client, generation: 's13' | 's14') {
  const assetId = generation === 's14' ? S14_ASSET_ID : S13_ASSET_ID;
  const ledger: S13LedgerEntry[] = [];
  const tracked = async (name: string, args: Record<string, unknown>) => {
    const envelope = await call(client, name, args);
    ledger.push({ name, args, envelope });
    return envelope;
  };
  const kits = await tracked('list_kits', { brief: S13_BRIEF });
  const planning = NovelGrammarPlanningResultSchema.parse(
    z.object({ planning: z.unknown() }).parse(kits.data).planning,
  );
  if (!planning.supported)
    throw new Error(
      `${generation.toUpperCase()} planning failed: ${planning.blockers.join('; ')}`,
    );
  if (
    planning.suggestedOperations.length !== 46 ||
    planning.suggestedOperations.some(
      ({ partId }) => partId === 'spear' || partId === 'shield.kite',
    )
  )
    throw new Error(
      `${generation.toUpperCase()} public recipe drifted from the 46-operation neutral base.`,
    );
  const created = await tracked('create_asset', {
    identity: {
      assetId,
      name:
        generation === 's14'
          ? 'Reference Ready S14 Public Path Guard'
          : 'Reference Ready S13 Grammar Guard',
      kitId: 'rustic-human',
      family: 'humanoid',
      archetypeId: 'humanoid.biped.rustic',
      seed: 42,
    },
  });
  let revisionId = z.string().parse(created.revisionId);
  const apply = async (payload: Record<string, unknown>) => {
    const dryArgs = {
      assetId,
      expectedRevisionId: revisionId,
      ...payload,
      dryRun: true,
    };
    const dry = await tracked('apply_operations', dryArgs);
    const planId = z
      .string()
      .regex(PLAN_ID)
      .parse(
        z
          .object({ revisionPlan: z.object({ planId: z.string() }) })
          .parse(dry.data).revisionPlan.planId,
      );
    const applied = await tracked('apply_operations', {
      ...dryArgs,
      dryRun: false,
      confirmedPlanId: planId,
    });
    revisionId = z.string().parse(applied.revisionId);
  };
  for (const composition of planning.suggestedOperations)
    await apply({ composition });
  await apply({ morphology: S13_MORPHOLOGY });
  const overview = await tracked('inspect_asset', {
    assetId,
    section: 'overview',
    offset: 0,
    limit: 100,
  });
  const counts = z
    .object({
      counts: z.object({
        parts: z.number().int(),
        connections: z.number().int(),
      }),
    })
    .parse(overview.data).counts;
  const validation = await tracked('validate_asset', {
    assetId,
  });
  const scene = z
    .object({
      scene: z.object({
        triangleCount: z.number().int(),
        triangleBudget: z.number().int(),
      }),
    })
    .parse(validation.data).scene;
  return {
    assetId,
    finalRevisionId: revisionId,
    operationCount: planning.suggestedOperations.length,
    partCount: counts.parts,
    connectionCount: counts.connections,
    triangleCount: scene.triangleCount,
    triangleBudget: scene.triangleBudget,
    ledger,
  };
}

async function retrieveAuthoringArtifacts(
  client: Client,
  manifest: ForgeAuthoringReviewManifest,
  stagingRoot: string,
): Promise<Record<string, string>> {
  await mkdir(stagingRoot);
  const digests: Record<string, string> = {};
  for (const artifact of manifest.artifacts) {
    const chunks: Buffer[] = [];
    for (
      let offset = 0;
      offset < artifact.byte_length;
      offset += FORGE_INTERCHANGE_MAX_CHUNK_BYTES
    ) {
      const length = Math.min(
        FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
        artifact.byte_length - offset,
      );
      const envelope = await call(client, 'get_interchange_artifact_chunk', {
        asset_id: manifest.source.asset_id,
        revision_id: manifest.source.revision_id,
        delivery_id: manifest.delivery_id,
        artifact_id: artifact.id,
        record_kind: 'evidence',
        offset,
        length,
      });
      const chunk = ForgeInterchangeArtifactChunkSchema.parse(envelope.data);
      const bytes = Buffer.from(chunk.bytes_base64, 'base64');
      if (
        chunk.record_kind !== 'evidence' ||
        chunk.artifact_id !== artifact.id ||
        chunk.artifact_sha256 !== artifact.sha256 ||
        chunk.offset !== offset ||
        chunk.length !== length ||
        chunk.total !== artifact.byte_length ||
        sha256(bytes) !== chunk.chunk_sha256
      )
        throw new Error(`${artifact.id}: chunk binding mismatch.`);
      chunks.push(bytes);
    }
    const bytes = Buffer.concat(chunks);
    if (
      bytes.byteLength !== artifact.byte_length ||
      sha256(bytes) !== artifact.sha256
    )
      throw new Error(`${artifact.id}: reconstructed digest mismatch.`);
    const fileName =
      artifact.role === 'contact_sheet'
        ? 'contact-sheet.png'
        : `${artifact.view}.png`;
    await writeFile(resolve(stagingRoot, fileName), bytes, { flag: 'wx' });
    digests[artifact.id] = sha256(bytes);
  }
  await writeFile(
    resolve(stagingRoot, 'authoring-review-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: 'wx' },
  );
  await writeFile(
    resolve(stagingRoot, 'index.html'),
    `<!doctype html>
<meta charset="utf-8">
<title>Forge reference comparison</title>
<style>
body{margin:0;background:#111;color:#f2efe6;font:16px system-ui;padding:24px}
h1{font-size:22px}.views{display:grid;grid-template-columns:repeat(2,minmax(0,512px));gap:18px}
figure{margin:0}img{width:100%;height:auto;image-rendering:pixelated;background:#e8e8e8}
figcaption{padding:6px 0 14px}.sheet{max-width:100%;margin-top:24px}
</style>
<h1>Deterministic authoring reference comparison</h1>
<div class="views">
<figure><img src="front.png"><figcaption>front</figcaption></figure>
<figure><img src="three-quarter.png"><figcaption>three-quarter</figcaption></figure>
<figure><img src="side.png"><figcaption>side</figcaption></figure>
<figure><img src="back.png"><figcaption>back</figcaption></figure>
</div>
<img class="sheet" src="contact-sheet.png" alt="contact sheet">
`,
    { flag: 'wx' },
  );
  return digests;
}

async function runOnce(options: {
  readonly forgeRoot: string;
  readonly runRoot: string;
  readonly inspectorUrl: string;
  readonly ledger: z.infer<typeof LedgerSchema> | undefined;
  readonly authoringGeneration: 's13' | 's14' | undefined;
  readonly name: string;
}) {
  const runtimeRoot = resolve(options.runRoot, 'runtime');
  const stagingRoot = resolve(options.runRoot, 'staging');
  await mkdir(options.runRoot);
  await mkdir(runtimeRoot);
  const transport = new StdioClientTransport({
    command: resolve(options.forgeRoot, 'node_modules/.bin/tsx'),
    args: [resolve(options.forgeRoot, 'src/mcp/stdio.ts')],
    cwd: runtimeRoot,
    env: {
      ...getDefaultEnvironment(),
      FORGE_INSPECTOR_URL: options.inspectorUrl,
    },
    stderr: 'pipe',
  });
  const stderr: string[] = [];
  transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));
  const client = new Client({ name: options.name, version: '1.0.0' });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const names = tools.tools.map(({ name }) => name);
    if (
      names.length !== 16 ||
      JSON.stringify(names) !== JSON.stringify(PUBLIC_TOOL_NAMES)
    )
      throw new Error('Public MCP tool surface drifted.');
    const referenceAuthoring =
      options.authoringGeneration === undefined
        ? undefined
        : await authorReferenceGuard(client, options.authoringGeneration);
    let finalRevisionId: string | undefined = referenceAuthoring?.finalRevisionId;
    for (const entry of options.ledger ?? []) {
      if (entry.name !== 'create_asset' && entry.name !== 'apply_operations')
        continue;
      const envelope = await call(client, entry.name, entry.args);
      if (envelope.revisionId !== entry.envelope.revisionId)
        throw new Error(`${entry.name}: deterministic revision replay drifted.`);
      finalRevisionId = envelope.revisionId;
    }
    if (finalRevisionId === undefined)
      throw new Error('Replay ledger did not produce a revision.');
    const ledgerCreate = options.ledger?.find(
      ({ name }) => name === 'create_asset',
    );
    const ledgerAssetId =
      ledgerCreate === undefined
        ? undefined
        : z
            .object({ identity: z.object({ assetId: z.string() }) })
            .parse(ledgerCreate.args).identity.assetId;
    const assetId =
      referenceAuthoring?.assetId ??
      ledgerAssetId ??
      'guard.reference-ready.s12-grammar';
    await call(client, 'validate_asset', { assetId });
    await call(client, 'render_preview', {
      assetId,
      revisionId: finalRevisionId,
    });
    await call(client, 'export_asset', {
      assetId,
      revisionId: finalRevisionId,
    });
    const staticBefore = await parseForgeAssetInterchangeManifest(
      (
        await call(client, 'get_interchange_manifest', {
          asset_id: assetId,
          revision_id: finalRevisionId,
        })
      ).data,
    );
    const render = await call(client, 'render_preview', {
      assetId,
      revisionId: finalRevisionId,
      referenceComparison: {
        profileId: 'forge.authoring.reference-comparison.v1',
      },
    });
    const delivery = z
      .object({
        deliveryId: z.string(),
        manifestSha256: z.string(),
      })
      .parse(z.object({ delivery: z.unknown() }).parse(render.data).delivery);
    const manifest = await parseForgeAuthoringReviewManifest(
      (
        await call(client, 'get_interchange_manifest', {
          asset_id: assetId,
          revision_id: finalRevisionId,
          delivery_id: delivery.deliveryId,
        })
      ).data,
    );
    if (
      manifest.manifest_sha256 !== delivery.manifestSha256 ||
      manifest.delivery_id !== delivery.deliveryId
    )
      throw new Error('Render receipt does not bind the authoring manifest.');
    const staticAfter = await parseForgeAssetInterchangeManifest(
      (
        await call(client, 'get_interchange_manifest', {
          asset_id: assetId,
          revision_id: finalRevisionId,
        })
      ).data,
    );
    const staticBeforeBytes = JSON.stringify(staticBefore);
    const staticAfterBytes = JSON.stringify(staticAfter);
    if (staticBeforeBytes !== staticAfterBytes)
      throw new Error(
        'Authoring render mutated the static interchange manifest.',
      );
    const artifactDigests = await retrieveAuthoringArtifacts(
      client,
      manifest,
      stagingRoot,
    );
    return {
      finalRevisionId,
      manifest,
      artifactDigests,
      stagingRoot,
      staticManifestSha256: staticBefore.manifest_sha256,
      staticResponseSha256: sha256(staticBeforeBytes),
      staticArtifactIds: staticBefore.artifacts.map(({ id }) => id),
      staticEvidenceIds: staticBefore.evidence.map(({ id }) => id),
      publicToolCount: names.length,
      ...(referenceAuthoring === undefined
        ? {}
        : {
            publicAuthoring: {
              operationCount: referenceAuthoring.operationCount,
              partCount: referenceAuthoring.partCount,
              connectionCount: referenceAuthoring.connectionCount,
              triangleCount: referenceAuthoring.triangleCount,
              triangleBudget: referenceAuthoring.triangleBudget,
            },
            ledger: referenceAuthoring.ledger,
          }),
    };
  } finally {
    await client.close();
    if (stderr.length > 0)
      await writeFile(
        resolve(options.runRoot, 'mcp-stderr.log'),
        stderr.join(''),
      );
  }
}

async function main(): Promise<void> {
  const [requestedOutputRoot, ledgerPath] = process.argv.slice(2);
  if (requestedOutputRoot === undefined || ledgerPath === undefined)
    throw new Error(
      'Usage: replay-public-mcp-reference-comparison <output> <ledger|--s13|--s14>',
    );
  const forgeRoot = resolve(import.meta.dirname, '..');
  const outputRoot = resolve(requestedOutputRoot);
  await mkdir(outputRoot);
  const authoringGeneration =
    ledgerPath === '--s13'
      ? 's13'
      : ledgerPath === '--s14'
        ? 's14'
        : undefined;
  const ledger = authoringGeneration !== undefined
    ? undefined
    : LedgerSchema.parse(
        JSON.parse(await readFile(resolve(ledgerPath), 'utf8')),
      );
  const vite = await createServer({
    root: forgeRoot,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === 'string')
    throw new Error('Vite did not expose a loopback port.');
  const inspectorUrl = `http://127.0.0.1:${address.port}`;
  try {
    const first = await runOnce({
      forgeRoot,
      runRoot: resolve(outputRoot, 'run-a'),
      inspectorUrl,
      ledger,
      authoringGeneration,
      name: 'forge-reference-comparison-a',
    });
    const second = await runOnce({
      forgeRoot,
      runRoot: resolve(outputRoot, 'run-b'),
      inspectorUrl,
      ledger,
      authoringGeneration,
      name: 'forge-reference-comparison-b',
    });
    const firstIdentity = {
      revisionId: first.finalRevisionId,
      deliveryId: first.manifest.delivery_id,
      manifestSha256: first.manifest.manifest_sha256,
      artifactDigests: first.artifactDigests,
    };
    const secondIdentity = {
      revisionId: second.finalRevisionId,
      deliveryId: second.manifest.delivery_id,
      manifestSha256: second.manifest.manifest_sha256,
      artifactDigests: second.artifactDigests,
    };
    if (JSON.stringify(firstIdentity) !== JSON.stringify(secondIdentity))
      throw new Error('Fresh-root authoring comparison replay drifted.');
    const result = {
      ok: true,
      boundary: 'public stdio MCP tools only',
      deterministicFreshRoots: true,
      ...firstIdentity,
      artifacts: first.manifest.artifacts,
      publicToolCount: first.publicToolCount,
      ...('publicAuthoring' in first
        ? { publicAuthoring: first.publicAuthoring }
        : {}),
      staticManifest: {
        unchangedAcrossAuthoringRender: true,
        manifestSha256: first.staticManifestSha256,
        responseSha256: first.staticResponseSha256,
        artifactIds: first.staticArtifactIds,
        evidenceIds: first.staticEvidenceIds,
      },
      stagingRoot: first.stagingRoot,
      replayStagingRoot: second.stagingRoot,
    };
    await writeFile(
      resolve(outputRoot, 'result.json'),
      `${JSON.stringify(result, null, 2)}\n`,
      { flag: 'wx' },
    );
    if ('ledger' in first)
      await writeFile(
        resolve(outputRoot, 'public-call-ledger.json'),
        `${JSON.stringify(first.ledger, null, 2)}\n`,
        { flag: 'wx' },
      );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await vite.close();
  }
}

void main();
