import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from 'vite';

import {
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  ForgeInterchangeArtifactChunkSchema,
  NovelGrammarPlanningResultSchema,
  ToolResultEnvelopeSchema,
  parseForgeAssetInterchangeManifest,
  type ForgeAssetInterchangeManifest,
  type ForgeInterchangeArtifactChunk,
  type NovelCompositionOperation,
  type ToolResultEnvelope,
} from '../src/contracts/index.js';
import { PUBLIC_TOOL_NAMES, type PublicToolName } from '../src/tools/index.js';

const REVISION_ID = /^revision\.[a-f0-9]{64}$/u;
const PLAN_ID = /^plan\.[a-f0-9]{64}$/u;
const REQUIRED_CAPABILITIES = [
  'asset.identity.initialize',
  'asset.grammar.compose',
  'operation.inspect',
  'revision.immutable',
  'output.glb',
  'output.sprite.directional',
  'output.sprite.contact_sheet',
  'integration.public_interchange',
] as const;

const addPart = (
  partId: string,
  templateId: string,
  role: string,
  materialId: string,
  parentPartId: string,
  parentPortId: string,
  childPortId: string,
) => ({
  operation: 'add_part' as const,
  partId,
  templateId,
  role,
  materialId,
  attachment: {
    connectionId: `connection.${partId}`,
    parentPartId,
    parentPortId,
    childPortId,
  },
});

const guardOperations = [
  addPart(
    'head',
    'human.head',
    'anatomy.head',
    'skin.warm',
    'body.root',
    'neck',
    'neck.attach',
  ),
  addPart(
    'pelvis',
    'human.pelvis',
    'anatomy.pelvis',
    'cloth.moss',
    'body.root',
    'hip',
    'torso.attach',
  ),
  ...(['left', 'right'] as const).flatMap((side) => [
    addPart(
      `upper-arm.${side}`,
      'human.upper-arm',
      'anatomy.upper-arm',
      'cloth.moss',
      'body.root',
      `shoulder.${side}`,
      'shoulder.attach',
    ),
    addPart(
      `forearm.${side}`,
      'human.forearm',
      'anatomy.forearm',
      'skin.warm',
      `upper-arm.${side}`,
      'elbow',
      'elbow.attach',
    ),
    addPart(
      `hand.${side}`,
      'human.hand',
      'anatomy.hand',
      'skin.warm',
      `forearm.${side}`,
      'wrist',
      'wrist.attach',
    ),
    addPart(
      `thigh.${side}`,
      'human.thigh',
      'anatomy.thigh',
      'cloth.moss',
      'pelvis',
      `leg.${side}`,
      'hip.attach',
    ),
    addPart(
      `shin.${side}`,
      'human.shin',
      'anatomy.shin',
      'cloth.moss',
      `thigh.${side}`,
      'knee',
      'knee.attach',
    ),
    addPart(
      `foot.${side}`,
      'human.foot',
      'anatomy.foot',
      'leather.dark',
      `shin.${side}`,
      'ankle',
      'ankle.attach',
    ),
  ]),
  addPart(
    'tunic',
    'human.tunic-flared',
    'clothing.tunic-shell',
    'cloth.moss',
    'body.root',
    'clothing.tunic',
    'torso.attach',
  ),
  addPart(
    'tunic.trim',
    'human.tunic-trim',
    'clothing.tunic-trim',
    'cloth.guard-trim',
    'body.root',
    'clothing.trim',
    'torso.attach',
  ),
  addPart(
    'belt',
    'human.guard-belt',
    'clothing.belt',
    'leather.guard-brown',
    'body.root',
    'clothing.belt',
    'torso.attach',
  ),
  addPart(
    'collar',
    'human.scarf-collar',
    'clothing.scarf-collar',
    'cloth.guard-trim',
    'body.root',
    'clothing.collar',
    'torso.attach',
  ),
  addPart(
    'pouch.left',
    'human.guard-pouch',
    'clothing.pouch',
    'leather.guard-brown',
    'body.root',
    'clothing.pouch.left',
    'torso.attach',
  ),
  addPart(
    'pouch.right',
    'human.guard-pouch',
    'clothing.pouch',
    'leather.guard-brown',
    'body.root',
    'clothing.pouch.right',
    'torso.attach',
  ),
  addPart(
    'pouch.center',
    'human.guard-pouch',
    'clothing.pouch',
    'leather.guard-brown',
    'body.root',
    'clothing.pouch.center',
    'torso.attach',
  ),
  addPart(
    'face.eye.left',
    'human.face-eye',
    'feature.face-eye',
    'face.ink',
    'head',
    'face.eye.left',
    'head.attach',
  ),
  addPart(
    'face.eye.right',
    'human.face-eye',
    'feature.face-eye',
    'face.ink',
    'head',
    'face.eye.right',
    'head.attach',
  ),
  addPart(
    'face.mouth',
    'human.face-mouth',
    'feature.face-mouth',
    'mouth.soft',
    'head',
    'face.mouth',
    'head.attach',
  ),
  addPart(
    'face.nose',
    'human.face-nose',
    'feature.face-nose',
    'skin.peach',
    'head',
    'face.nose',
    'head.attach',
  ),
  ...(['left', 'right'] as const).map((side) =>
    addPart(
      `face.ear.${side}`,
      'human.face-ear',
      'feature.face-ear',
      'skin.peach',
      'head',
      `face.ear.${side}`,
      'head.attach',
    ),
  ),
  addPart(
    'hair.side.left',
    'human.hair-side',
    'feature.hair-side',
    'hair.chestnut',
    'head',
    'hair.side.left',
    'head.attach',
  ),
  addPart(
    'hair.side.right',
    'human.hair-side',
    'feature.hair-side',
    'hair.chestnut',
    'head',
    'hair.side.right',
    'head.attach',
  ),
  addPart(
    'hair.back',
    'human.hair-back',
    'feature.hair-back',
    'hair.chestnut',
    'head',
    'hair.back',
    'head.attach',
  ),
  ...(['left', 'center', 'right'] as const).map((side) =>
    addPart(
      `hair.fringe.${side}`,
      'human.hair-fringe',
      'feature.hair-fringe',
      'hair.chestnut',
      'head',
      `hair.fringe.${side}`,
      'head.attach',
    ),
  ),
  ...(['left', 'right'] as const).flatMap((side) => [
    addPart(
      `sleeve.cuff.${side}`,
      'human.sleeve-cuff',
      'clothing.sleeve-cuff',
      'cloth.guard-trim',
      `upper-arm.${side}`,
      'sleeve.cuff',
      'arm.attach',
    ),
    addPart(
      `boot.cuff.${side}`,
      'human.boot-cuff',
      'feature.boot-cuff',
      'leather.guard-brown',
      `shin.${side}`,
      'boot.cuff',
      'shin.attach',
    ),
    addPart(
      `boot.toe.${side}`,
      'human.boot-toe',
      'feature.boot-toe',
      'leather.guard-brown',
      `foot.${side}`,
      'toe',
      'foot.attach',
    ),
    addPart(
      `boot.sole.${side}`,
      'human.boot-sole',
      'feature.boot-sole',
      'leather.dark',
      `foot.${side}`,
      'sole',
      'foot.attach',
    ),
  ]),
  addPart(
    'helmet.dome',
    'human.helmet-dome',
    'feature.helmet-dome',
    'iron.guard-grey',
    'head',
    'helmet.dome',
    'head.attach',
  ),
  addPart(
    'helmet.emblem',
    'human.helmet-emblem',
    'feature.helmet-emblem',
    'iron.guard-highlight',
    'helmet.dome',
    'emblem.mount',
    'surface.attach',
  ),
  addPart(
    'helmet.ridge',
    'human.helmet-ridge',
    'feature.helmet-ridge',
    'iron.guard-highlight',
    'helmet.dome',
    'ridge.mount',
    'surface.attach',
  ),
  ...(['left', 'right'] as const).map((position) =>
    addPart(
      `helmet.stud.${position}`,
      'human.helmet-stud',
      'feature.helmet-stud',
      'iron.guard-highlight',
      'helmet.dome',
      `stud.${position}`,
      'surface.attach',
    ),
  ),
  addPart(
    'spear',
    'equipment.spear',
    'equipment.spear',
    'iron.blued',
    'hand.right',
    'equipment',
    'grip',
  ),
  addPart(
    'shield.kite',
    'equipment.shield.kite',
    'equipment.shield.kite',
    'iron.blued',
    'hand.left',
    'equipment',
    'grip',
  ),
] as const;

const setPartTransform = (
  partId: string,
  scale: readonly [number, number, number],
  position: readonly [number, number, number] = [0, 0, 0],
) => ({
  operation: 'setPartTransform' as const,
  partId,
  transform: {
    position,
    rotation: [0, 0, 0, 1] as const,
    scale,
  },
});

export const GUARD_CHIBI_STYLING_PATCH = {
  operations: [
    setPartTransform('body.root', [1.25, 0.72, 1.8], [0, 1.42, 0]),
    setPartTransform('head', [1.25, 1.4, 1.1]),
    setPartTransform('helmet.iron', [1.08, 1, 1.05]),
    setPartTransform('pelvis', [1.1, 0.85, 1.05]),
    ...(['left', 'right'] as const).flatMap((side) => [
      setPartTransform(`upper-arm.${side}`, [1.1, 0.8, 1.05]),
      setPartTransform(`forearm.${side}`, [1, 1, 1]),
      setPartTransform(`hand.${side}`, [1.08, 1, 1]),
      setPartTransform(`thigh.${side}`, [1, 0.85, 1]),
      setPartTransform(`shin.${side}`, [1, 1, 1]),
      setPartTransform(`foot.${side}`, [1.08, 0.9, 1.05]),
    ]),
  ],
} as const;

const containerOperations = [
  addPart(
    'band.low',
    'prop.crate-band',
    'prop.reinforcement',
    'iron.weathered',
    'container.body',
    'band.low',
    'crate.attach',
  ),
  addPart(
    'band.high',
    'prop.crate-band',
    'prop.reinforcement',
    'iron.weathered',
    'container.body',
    'band.high',
    'crate.attach',
  ),
] as const;

export const NOVEL_WORKFLOW_DEFINITIONS = [
  {
    brief:
      'Create an original round chibi rustic village guard with an iron helmet, spear, and kite shield.',
    identity: {
      assetId: 'guard.s4.rustic',
      name: 'S4 Rustic Village Guard',
      kitId: 'rustic-human',
      family: 'humanoid',
      archetypeId: 'humanoid.biped.rustic',
      seed: 4002,
    },
    expectedOperations: guardOperations,
    stylingPatch: GUARD_CHIBI_STYLING_PATCH,
    expectedRequiredRoles: {
      'anatomy.forearm': 2,
      'anatomy.foot': 2,
      'anatomy.hand': 2,
      'anatomy.head': 1,
      'anatomy.pelvis': 1,
      'anatomy.shin': 2,
      'anatomy.thigh': 2,
      'anatomy.torso': 1,
      'anatomy.upper-arm': 2,
    },
  },
  {
    brief:
      'Create an original rustic iron-banded barrel or storage container using the registered bounded grammar.',
    identity: {
      assetId: 'container.s4.banded',
      name: 'S4 Iron-Banded Container',
      kitId: 'rustic-human',
      family: 'standalone-prop',
      archetypeId: 'prop.banded-container.rustic',
      seed: 4001,
    },
    expectedOperations: containerOperations,
    expectedRequiredRoles: {
      'prop.container': 1,
      'prop.reinforcement': 2,
    },
  },
] as const;

export const PIXEL_DOSSIER_FILENAMES = [
  'tools-list.json',
  'interchange-manifest.json',
  'chunks.json',
] as const;

type WorkflowDefinition = (typeof NOVEL_WORKFLOW_DEFINITIONS)[number];

interface PortableCall {
  readonly sequence: number;
  readonly operation: PublicToolName;
  readonly arguments: Record<string, unknown>;
  readonly summary: string;
  readonly revision_id?: string;
  readonly affected_ids?: readonly string[];
  readonly detail?: Record<string, unknown>;
}

interface PublicSession {
  readonly client: Client;
  close(): Promise<void>;
}

interface ReplayRecord {
  readonly id: string;
  readonly recordKind: 'artifact' | 'evidence';
  readonly byteLength: number;
  readonly sha256: string;
  readonly reference: string;
}

interface RetrievedRecords {
  readonly records: readonly ReplayRecord[];
  readonly chunks: readonly Record<string, unknown>[];
  readonly fullChunks: readonly ForgeInterchangeArtifactChunk[];
  readonly digests: Readonly<Record<string, string>>;
  readonly excludedArtifactIds: readonly string[];
}

interface FirstRunResult {
  readonly definition: WorkflowDefinition;
  readonly initialRevisionId: string;
  readonly intermediateRevisionIds: readonly string[];
  readonly finalRevisionId: string;
  readonly inspections: Record<string, unknown>;
  readonly comparisonPages: readonly unknown[];
  readonly validation: unknown;
  readonly manifest: ForgeAssetInterchangeManifest;
  readonly retrieval: RetrievedRecords;
  readonly calls: readonly PortableCall[];
  readonly toolsList: unknown;
}

export interface NovelWorkflowReplayResult {
  readonly ok: true;
  readonly boundary: 'public stdio MCP tools only';
  readonly public_tool_count: 16;
  readonly process_restart_count: 1;
  readonly assets: readonly {
    readonly asset_id: string;
    readonly initial_revision_id: string;
    readonly final_revision_id: string;
    readonly revision_count: number;
    readonly manifest_sha256: string;
    readonly retrieved_record_count: number;
  }[];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function requiredString(
  value: unknown,
  label: string,
  pattern?: RegExp,
): string {
  if (
    typeof value !== 'string' ||
    (pattern !== undefined && !pattern.test(value))
  )
    throw new Error(`${label} was missing or invalid.`);
  return value;
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function parseNovelPublicMcpEnvelope(
  response: unknown,
): ToolResultEnvelope {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('content' in response) ||
    !Array.isArray(response.content)
  )
    throw new Error('Public MCP response did not contain a content array.');
  const content = response.content as unknown[];
  const text = content.find(
    (part): part is { type: 'text'; text: string } =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text' &&
      'text' in part &&
      typeof part.text === 'string',
  )?.text;
  if (text === undefined)
    throw new Error('Public MCP response did not contain text content.');
  const envelope = ToolResultEnvelopeSchema.parse(JSON.parse(text));
  if ('isError' in response && response.isError === true)
    throw new Error(
      `Public MCP transport marked the response as an error: ${envelope.summary}`,
    );
  if (!envelope.ok)
    throw new Error(
      `Public MCP tool failed: ${envelope.summary}; ${JSON.stringify(envelope.issues)}`,
    );
  return envelope;
}

export function assertNovelPublicToolSurface(names: readonly string[]): void {
  if (names.length !== 16 || names.join('\n') !== PUBLIC_TOOL_NAMES.join('\n'))
    throw new Error(
      `Public MCP catalog drifted: received ${names.join(', ')}.`,
    );
}

export function permittedManifestRecords(
  manifest: ForgeAssetInterchangeManifest,
): { records: ReplayRecord[]; excludedArtifactIds: string[] } {
  const permittedArtifacts = manifest.artifacts.filter(
    (artifact) =>
      artifact.classification === 'source' &&
      (artifact.role === 'directional_frame' || artifact.role === 'glb'),
  );
  return {
    records: [
      ...permittedArtifacts.map((artifact) => ({
        id: artifact.id,
        recordKind: 'artifact' as const,
        byteLength: artifact.byte_length,
        sha256: artifact.sha256,
        reference: artifact.reference,
      })),
      ...manifest.evidence.flatMap((evidence) =>
        evidence.byte_length === undefined
          ? []
          : [
              {
                id: evidence.id,
                recordKind: 'evidence' as const,
                byteLength: evidence.byte_length,
                sha256: evidence.sha256,
                reference: evidence.reference,
              },
            ],
      ),
    ],
    excludedArtifactIds: manifest.artifacts
      .filter((artifact) => !permittedArtifacts.includes(artifact))
      .map(({ id }) => id),
  };
}

export function reconstructNovelReplayRecord(
  expected: ReplayRecord,
  chunks: readonly ForgeInterchangeArtifactChunk[],
): Buffer {
  const ordered = chunks
    .map((chunk) => ForgeInterchangeArtifactChunkSchema.parse(chunk))
    .sort((left, right) => left.offset - right.offset);
  let offset = 0;
  const buffers: Buffer[] = [];
  for (const chunk of ordered) {
    if (
      chunk.record_kind !== expected.recordKind ||
      chunk.artifact_id !== expected.id ||
      chunk.artifact_sha256 !== expected.sha256 ||
      chunk.offset !== offset ||
      chunk.total !== expected.byteLength
    )
      throw new Error(`${expected.id}: chunk binding or sequence drifted.`);
    const bytes = Buffer.from(chunk.bytes_base64, 'base64');
    if (
      bytes.byteLength !== chunk.length ||
      sha256(bytes) !== chunk.chunk_sha256
    )
      throw new Error(`${expected.id}: chunk digest or length drifted.`);
    offset += bytes.byteLength;
    buffers.push(bytes);
  }
  const bytes = Buffer.concat(buffers);
  if (
    offset !== expected.byteLength ||
    bytes.byteLength !== expected.byteLength ||
    sha256(bytes) !== expected.sha256
  )
    throw new Error(`${expected.id}: reconstructed record drifted.`);
  return bytes;
}

function normalizeCall(
  sequence: number,
  operation: PublicToolName,
  arguments_: Record<string, unknown>,
  envelope: ToolResultEnvelope,
): PortableCall {
  const data = record(envelope.data);
  const detail: Record<string, unknown> = {};
  if (operation === 'list_kits') {
    const planning = record(data?.['planning']);
    detail['planning_supported'] = planning?.['supported'];
    detail['archetype_id'] = planning?.['archetypeId'];
    detail['suggested_operation_count'] = Array.isArray(
      planning?.['suggestedOperations'],
    )
      ? planning['suggestedOperations'].length
      : undefined;
  } else if (operation === 'inspect_asset') {
    const completeness = record(data?.['completeness']);
    const lineage = record(data?.['lineage']);
    detail['section'] = data?.['section'];
    detail['completeness'] = completeness?.['state'];
    detail['current_revision_id'] = lineage?.['currentRevisionId'];
  } else if (operation === 'apply_operations') {
    const plan = record(data?.['revisionPlan']);
    detail['dry_run'] = data?.['dryRun'] ?? false;
    detail['plan_id'] = plan?.['planId'];
    detail['target_revision_id'] = plan?.['targetRevisionId'];
    detail['validation'] = data?.['validation'];
  } else if (operation === 'compare_revisions') {
    const page = record(data?.['page']);
    detail['change_count'] = page?.['total'];
    detail['page_offset'] = page?.['offset'];
  } else if (operation === 'validate_asset') {
    const scene = record(data?.['scene']);
    detail['validation'] = data?.['validation'];
    detail['triangle_count'] = scene?.['triangleCount'];
    detail['triangle_budget'] = scene?.['triangleBudget'];
  } else if (operation === 'get_interchange_manifest') {
    detail['manifest_sha256'] = data?.['manifest_sha256'];
  } else if (operation === 'get_interchange_artifact_chunk') {
    detail['artifact_id'] = data?.['artifact_id'];
    detail['chunk_sha256'] = data?.['chunk_sha256'];
    detail['offset'] = data?.['offset'];
    detail['length'] = data?.['length'];
  }
  return {
    sequence,
    operation,
    arguments: arguments_,
    summary: envelope.summary,
    ...(envelope.revisionId === undefined
      ? {}
      : { revision_id: envelope.revisionId }),
    ...(envelope.affectedIds.length === 0
      ? {}
      : { affected_ids: envelope.affectedIds }),
    ...(Object.keys(detail).length === 0 ? {} : { detail }),
  };
}

function caller(client: Client, ledger: PortableCall[]) {
  return async (
    operation: PublicToolName,
    arguments_: Record<string, unknown>,
  ): Promise<ToolResultEnvelope> => {
    const response = await client.callTool({
      name: operation,
      arguments: arguments_,
    });
    const envelope = parseNovelPublicMcpEnvelope(response);
    ledger.push(
      normalizeCall(ledger.length + 1, operation, arguments_, envelope),
    );
    return envelope;
  };
}

async function openSession(
  forgeRoot: string,
  runtimeRoot: string,
  inspectorUrl: string,
  name: string,
): Promise<PublicSession> {
  const transport = new StdioClientTransport({
    command: resolve(forgeRoot, 'node_modules/.bin/tsx'),
    args: [resolve(forgeRoot, 'src/mcp/stdio.ts')],
    cwd: runtimeRoot,
    env: {
      ...getDefaultEnvironment(),
      FORGE_INSPECTOR_URL: inspectorUrl,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', () => undefined);
  const client = new Client({ name, version: '1.0.0' });
  await client.connect(transport);
  return { client, close: () => client.close() };
}

async function assertSessionToolSurface(client: Client): Promise<unknown> {
  const discovery = await client.listTools();
  assertNovelPublicToolSurface(discovery.tools.map(({ name }) => name));
  return discovery;
}

function assertCapabilityPreflight(envelope: ToolResultEnvelope): void {
  const data = record(envelope.data);
  const facts = Array.isArray(data?.['facts'])
    ? (data['facts'] as unknown[])
    : [];
  for (const capabilityId of REQUIRED_CAPABILITIES) {
    const fact = facts.find(
      (candidate) => record(candidate)?.['id'] === capabilityId,
    );
    const status = record(fact)?.['status'];
    const expectedStatus =
      capabilityId === 'integration.public_interchange'
        ? 'partial'
        : 'supported';
    if (status !== expectedStatus)
      throw new Error(
        `${capabilityId}: expected ${expectedStatus}, received ${String(status)}.`,
      );
  }
}

function assertFinalCompleteness(
  data: unknown,
  definition: WorkflowDefinition,
): void {
  const completeness = record(record(data)?.['completeness']);
  if (
    completeness?.['state'] !== 'complete' ||
    !Array.isArray(completeness['missingRequirements']) ||
    completeness['missingRequirements'].length !== 0 ||
    !Array.isArray(completeness['unattachedPartIds']) ||
    completeness['unattachedPartIds'].length !== 0
  )
    throw new Error(`${definition.identity.assetId}: completeness failed.`);
  const presentRoles = new Map(
    (Array.isArray(completeness['presentRoles'])
      ? completeness['presentRoles']
      : []
    ).map((value) => {
      const role = record(value);
      return [role?.['role'], role?.['presentCount']];
    }),
  );
  for (const [role, count] of Object.entries(definition.expectedRequiredRoles))
    if (presentRoles.get(role) !== count)
      throw new Error(`${definition.identity.assetId}: role ${role} drifted.`);
}

async function comparisonPages(
  call: ReturnType<typeof caller>,
  assetId: string,
  baseRevisionId: string,
  targetRevisionId: string,
): Promise<unknown[]> {
  const pages: unknown[] = [];
  let offset = 0;
  while (true) {
    const envelope = await call('compare_revisions', {
      assetId,
      baseRevisionId,
      targetRevisionId,
      offset,
      limit: 100,
      idOffset: 0,
      idLimit: 100,
    });
    pages.push(envelope.data);
    const page = record(record(envelope.data)?.['page']);
    if (page?.['truncated'] !== true) return pages;
    offset = Number(page['nextOffset']);
    if (!Number.isSafeInteger(offset) || offset < 1)
      throw new Error(`${assetId}: invalid comparison nextOffset.`);
  }
}

async function retrieveRecords(
  call: ReturnType<typeof caller>,
  manifest: ForgeAssetInterchangeManifest,
  recordsRoot?: string,
): Promise<RetrievedRecords> {
  const { records, excludedArtifactIds } = permittedManifestRecords(manifest);
  const chunks: Record<string, unknown>[] = [];
  const fullChunks: ForgeInterchangeArtifactChunk[] = [];
  const digests: Record<string, string> = {};
  for (const expected of records) {
    const recordChunks: ForgeInterchangeArtifactChunk[] = [];
    for (let offset = 0; offset < expected.byteLength;) {
      const length = Math.min(
        FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
        expected.byteLength - offset,
      );
      const envelope = await call('get_interchange_artifact_chunk', {
        asset_id: manifest.source.asset_id,
        revision_id: manifest.source.revision_id,
        artifact_id: expected.id,
        record_kind: expected.recordKind,
        offset,
        length,
      });
      const chunk = ForgeInterchangeArtifactChunkSchema.parse(envelope.data);
      recordChunks.push(chunk);
      fullChunks.push(chunk);
      chunks.push({
        record_kind: chunk.record_kind,
        artifact_id: chunk.artifact_id,
        artifact_sha256: chunk.artifact_sha256,
        chunk_sha256: chunk.chunk_sha256,
        offset: chunk.offset,
        length: chunk.length,
        total: chunk.total,
      });
      offset += length;
    }
    const bytes = reconstructNovelReplayRecord(expected, recordChunks);
    digests[expected.id] = sha256(bytes);
    if (recordsRoot !== undefined) {
      const recordDirectory = resolve(recordsRoot, expected.recordKind);
      await mkdir(recordDirectory, { recursive: true });
      const filename = basename(expected.reference);
      if (filename === '' || filename === '.' || filename === '..')
        throw new Error(`${expected.id}: reference has no portable filename.`);
      await writeFile(resolve(recordDirectory, filename), bytes, {
        flag: 'wx',
      });
    }
  }
  return { records, chunks, fullChunks, digests, excludedArtifactIds };
}

async function runFirstWorkflow(
  client: Client,
  definition: WorkflowDefinition,
  dossierRoot: string,
  toolsList: unknown,
): Promise<FirstRunResult> {
  const calls: PortableCall[] = [];
  const call = caller(client, calls);
  const capabilities = await call('inspect_capabilities', {
    capabilityIds: [...REQUIRED_CAPABILITIES],
  });
  assertCapabilityPreflight(capabilities);
  const kits = await call('list_kits', { brief: definition.brief });
  const planning = NovelGrammarPlanningResultSchema.parse(
    record(kits.data)?.['planning'],
  );
  if (!planning.supported)
    throw new Error(
      `${definition.identity.assetId}: brief was blocked: ${planning.blockers.join('; ')}`,
    );
  if (
    planning.archetypeId !== definition.identity.archetypeId ||
    !jsonEqual(planning.suggestedOperations, definition.expectedOperations)
  )
    throw new Error(`${definition.identity.assetId}: public recipe drifted.`);
  for (const operation of planning.suggestedOperations)
    if (!planning.compatibleMaterialIds.includes(operation.materialId))
      throw new Error(
        `${definition.identity.assetId}: material ${operation.materialId} is not advertised as compatible.`,
      );

  const created = await call('create_asset', { identity: definition.identity });
  const initialRevisionId = requiredString(
    created.revisionId,
    'Initial revision ID',
    REVISION_ID,
  );
  const initialInspection = await call('inspect_asset', {
    assetId: definition.identity.assetId,
    section: 'overview',
    offset: 0,
    limit: 20,
  });
  const intermediateRevisionIds: string[] = [];
  let currentRevisionId = initialRevisionId;
  for (const operation of planning.suggestedOperations) {
    const dryRequest = {
      assetId: definition.identity.assetId,
      expectedRevisionId: currentRevisionId,
      composition: operation satisfies NovelCompositionOperation,
      dryRun: true,
    };
    const dryRun = await call('apply_operations', dryRequest);
    if (dryRun.revisionId !== currentRevisionId)
      throw new Error(
        `${definition.identity.assetId}: dry run mutated revision.`,
      );
    const planId = requiredString(
      record(record(dryRun.data)?.['revisionPlan'])?.['planId'],
      'Composition plan ID',
      PLAN_ID,
    );
    const applied = await call('apply_operations', {
      ...dryRequest,
      dryRun: false,
      confirmedPlanId: planId,
    });
    currentRevisionId = requiredString(
      applied.revisionId,
      'Applied revision ID',
      REVISION_ID,
    );
    intermediateRevisionIds.push(currentRevisionId);
    await call('inspect_asset', {
      assetId: definition.identity.assetId,
      section: 'overview',
      offset: 0,
      limit: 20,
    });
  }
  if ('stylingPatch' in definition) {
    const dryRequest = {
      assetId: definition.identity.assetId,
      expectedRevisionId: currentRevisionId,
      patch: definition.stylingPatch,
      dryRun: true,
    };
    const dryRun = await call('apply_operations', dryRequest);
    if (dryRun.revisionId !== currentRevisionId)
      throw new Error(
        `${definition.identity.assetId}: styling dry run mutated revision.`,
      );
    const planId = requiredString(
      record(record(dryRun.data)?.['revisionPlan'])?.['planId'],
      'Styling plan ID',
      PLAN_ID,
    );
    const applied = await call('apply_operations', {
      ...dryRequest,
      dryRun: false,
      confirmedPlanId: planId,
    });
    currentRevisionId = requiredString(
      applied.revisionId,
      'Applied styling revision ID',
      REVISION_ID,
    );
    intermediateRevisionIds.push(currentRevisionId);
    await call('inspect_asset', {
      assetId: definition.identity.assetId,
      section: 'overview',
      offset: 0,
      limit: 20,
    });
  }
  const finalRevisionId = currentRevisionId;
  const overview = await call('inspect_asset', {
    assetId: definition.identity.assetId,
    section: 'overview',
    offset: 0,
    limit: 20,
  });
  assertFinalCompleteness(overview.data, definition);
  const parts = await call('inspect_asset', {
    assetId: definition.identity.assetId,
    section: 'parts',
    offset: 0,
    limit: 100,
  });
  const connections = await call('inspect_asset', {
    assetId: definition.identity.assetId,
    section: 'connections',
    offset: 0,
    limit: 100,
  });
  const renderProfiles = await call('inspect_asset', {
    assetId: definition.identity.assetId,
    section: 'renderProfiles',
    offset: 0,
    limit: 100,
  });
  const comparisons = await comparisonPages(
    call,
    definition.identity.assetId,
    initialRevisionId,
    finalRevisionId,
  );
  const validation = await call('validate_asset', {
    assetId: definition.identity.assetId,
  });
  await call('render_preview', {
    assetId: definition.identity.assetId,
    revisionId: finalRevisionId,
  });
  await call('export_asset', {
    assetId: definition.identity.assetId,
    revisionId: finalRevisionId,
  });
  const manifestEnvelope = await call('get_interchange_manifest', {
    asset_id: definition.identity.assetId,
    revision_id: finalRevisionId,
  });
  const manifest = await parseForgeAssetInterchangeManifest(
    manifestEnvelope.data,
  );
  const retrieval = await retrieveRecords(
    call,
    manifest,
    resolve(dossierRoot, 'records'),
  );
  return {
    definition,
    initialRevisionId,
    intermediateRevisionIds,
    finalRevisionId,
    inspections: {
      initial: initialInspection.data,
      overview: overview.data,
      parts: parts.data,
      connections: connections.data,
      renderProfiles: renderProfiles.data,
    },
    comparisonPages: comparisons,
    validation: validation.data,
    manifest,
    retrieval,
    calls,
    toolsList,
  };
}

async function verifyAfterRestart(
  client: Client,
  first: FirstRunResult,
): Promise<{
  calls: readonly PortableCall[];
  manifestSha256: string;
  recordDigests: Readonly<Record<string, string>>;
}> {
  const calls: PortableCall[] = [];
  const call = caller(client, calls);
  const overview = await call('inspect_asset', {
    assetId: first.definition.identity.assetId,
    section: 'overview',
    offset: 0,
    limit: 20,
  });
  if (overview.revisionId !== first.finalRevisionId)
    throw new Error(
      `${first.definition.identity.assetId}: restart lost current revision.`,
    );
  assertFinalCompleteness(overview.data, first.definition);
  await call('validate_asset', { assetId: first.definition.identity.assetId });
  const manifestEnvelope = await call('get_interchange_manifest', {
    asset_id: first.definition.identity.assetId,
    revision_id: first.finalRevisionId,
  });
  const manifest = await parseForgeAssetInterchangeManifest(
    manifestEnvelope.data,
  );
  if (!jsonEqual(manifest, first.manifest))
    throw new Error(
      `${first.definition.identity.assetId}: manifest drifted after restart.`,
    );
  const retrieval = await retrieveRecords(call, manifest);
  if (!jsonEqual(retrieval.digests, first.retrieval.digests))
    throw new Error(
      `${first.definition.identity.assetId}: record digests drifted after restart.`,
    );
  return {
    calls,
    manifestSha256: manifest.manifest_sha256,
    recordDigests: retrieval.digests,
  };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, undefined, 2)}\n`, {
    flag: 'wx',
  });
}

async function writeDossier(
  dossierRoot: string,
  first: FirstRunResult,
  restart: Awaited<ReturnType<typeof verifyAfterRestart>>,
): Promise<void> {
  await writeJson(resolve(dossierRoot, 'identity.json'), {
    brief: first.definition.brief,
    identity: first.definition.identity,
    public_recipe: first.definition.expectedOperations,
    ...('stylingPatch' in first.definition
      ? { public_styling_patch: first.definition.stylingPatch }
      : {}),
  });
  await writeJson(resolve(dossierRoot, 'revision-lineage.json'), {
    asset_id: first.definition.identity.assetId,
    initial_revision_id: first.initialRevisionId,
    intermediate_revision_ids: first.intermediateRevisionIds,
    final_revision_id: first.finalRevisionId,
    revision_count: first.intermediateRevisionIds.length + 1,
  });
  await writeJson(resolve(dossierRoot, 'inspections.json'), first.inspections);
  await writeJson(
    resolve(dossierRoot, 'comparison-pages.json'),
    first.comparisonPages,
  );
  await writeJson(resolve(dossierRoot, 'validation.json'), first.validation);
  await writeJson(
    resolve(dossierRoot, 'interchange-manifest.json'),
    first.manifest,
  );
  await writeJson(resolve(dossierRoot, 'tools-list.json'), first.toolsList);
  await writeJson(
    resolve(dossierRoot, 'chunks.json'),
    first.retrieval.fullChunks,
  );
  await writeJson(resolve(dossierRoot, 'chunk-index.json'), {
    maximum_chunk_bytes: FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
    chunks: first.retrieval.chunks,
    record_digests: first.retrieval.digests,
    excluded_derived_artifact_ids: first.retrieval.excludedArtifactIds,
  });
  await writeJson(resolve(dossierRoot, 'public-call-ledger.json'), {
    boundary: 'public stdio MCP tools only',
    base64_payloads_omitted: true,
    host_paths_omitted: true,
    inspector_urls_omitted: true,
    calls: first.calls,
  });
  await writeJson(resolve(dossierRoot, 'restart-proof.json'), {
    process_restarted: true,
    final_revision_persisted: true,
    manifest_sha256: restart.manifestSha256,
    record_digests: restart.recordDigests,
    calls: restart.calls,
  });
  await writeJson(resolve(dossierRoot, 'dossier.json'), {
    ok: true,
    boundary: 'public stdio MCP tools only',
    asset_id: first.definition.identity.assetId,
    final_revision_id: first.finalRevisionId,
    manifest_sha256: first.manifest.manifest_sha256,
    retrieved_record_count: first.retrieval.records.length,
    process_restart_verified: true,
    chunk_digests_verified: true,
    reassembled_record_digests_verified: true,
    host_paths_present: false,
    inspector_urls_present: false,
  });
}

export async function runNovelWorkflowReplay(
  requestedOutputRoot: string,
): Promise<NovelWorkflowReplayResult> {
  const forgeRoot = resolve(import.meta.dirname, '..');
  const outputRoot = resolve(requestedOutputRoot);
  await mkdir(outputRoot);
  const runtimeRoot = resolve(outputRoot, 'runtime');
  const dossiersRoot = resolve(outputRoot, 'dossiers');
  await mkdir(runtimeRoot);
  await mkdir(dossiersRoot);

  const vite = await createServer({
    root: forgeRoot,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (
    address === null ||
    address === undefined ||
    typeof address === 'string'
  ) {
    await vite.close();
    throw new Error('Vite did not expose its loopback inspector address.');
  }
  const inspectorUrl = `http://127.0.0.1:${address.port}`;
  const firstResults: FirstRunResult[] = [];
  let firstSession: PublicSession | undefined;
  let secondSession: PublicSession | undefined;
  try {
    firstSession = await openSession(
      forgeRoot,
      runtimeRoot,
      inspectorUrl,
      'forge-novel-workflow-first-process',
    );
    const firstToolsList = await assertSessionToolSurface(firstSession.client);
    for (const definition of NOVEL_WORKFLOW_DEFINITIONS) {
      const dossierRoot = resolve(dossiersRoot, definition.identity.assetId);
      await mkdir(dossierRoot);
      firstResults.push(
        await runFirstWorkflow(
          firstSession.client,
          definition,
          dossierRoot,
          firstToolsList,
        ),
      );
    }
    await firstSession.close();
    firstSession = undefined;

    secondSession = await openSession(
      forgeRoot,
      runtimeRoot,
      inspectorUrl,
      'forge-novel-workflow-restarted-process',
    );
    const secondToolsList = await assertSessionToolSurface(
      secondSession.client,
    );
    if (!jsonEqual(secondToolsList, firstToolsList))
      throw new Error('Public MCP discovery drifted after process restart.');
    for (const first of firstResults) {
      const restart = await verifyAfterRestart(secondSession.client, first);
      await writeDossier(
        resolve(dossiersRoot, first.definition.identity.assetId),
        first,
        restart,
      );
    }
    await secondSession.close();
    secondSession = undefined;

    const result: NovelWorkflowReplayResult = {
      ok: true,
      boundary: 'public stdio MCP tools only',
      public_tool_count: 16,
      process_restart_count: 1,
      assets: firstResults.map((first) => ({
        asset_id: first.definition.identity.assetId,
        initial_revision_id: first.initialRevisionId,
        final_revision_id: first.finalRevisionId,
        revision_count: first.intermediateRevisionIds.length + 1,
        manifest_sha256: first.manifest.manifest_sha256,
        retrieved_record_count: first.retrieval.records.length,
      })),
    };
    await writeJson(resolve(outputRoot, 'result.json'), result);
    await writeJson(resolve(outputRoot, 'public-tools.json'), {
      count: PUBLIC_TOOL_NAMES.length,
      names: PUBLIC_TOOL_NAMES,
    });
    return result;
  } finally {
    await firstSession?.close();
    await secondSession?.close();
    await vite.close();
  }
}

export function parseNovelWorkflowReplayCliArgs(args: string[]): string {
  const normalized = args[0] === '--' ? args.slice(1) : args;
  if (normalized.length !== 1 || normalized[0] === undefined)
    throw new Error(
      'Usage: replay-public-mcp-novel-workflows.ts [--] <new-output-directory>',
    );
  return normalized[0];
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url === pathToFileURL(resolve(invokedPath)).href
) {
  const outputRoot = parseNovelWorkflowReplayCliArgs(process.argv.slice(2));
  const result = await runNovelWorkflowReplay(outputRoot);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
