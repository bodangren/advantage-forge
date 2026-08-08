import { createHash } from 'node:crypto';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type {
  ForgeAssetInterchangeManifest,
  ForgeInterchangeArtifactChunk,
} from '../../src/contracts/index.js';
import { planNovelAssetBrief } from '../../src/fantasy-kit/index.js';
import { PUBLIC_TOOL_NAMES } from '../../src/tools/index.js';
import {
  GUARD_CHIBI_STYLING_PATCH,
  NOVEL_WORKFLOW_DEFINITIONS,
  PIXEL_DOSSIER_FILENAMES,
  assertNovelPublicToolSurface,
  parseNovelWorkflowReplayCliArgs,
  parseNovelPublicMcpEnvelope,
  permittedManifestRecords,
  reconstructNovelReplayRecord,
  runNovelWorkflowReplay,
} from '../../scripts/replay-public-mcp-novel-workflows.js';

const digest = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');

describe('public MCP novel workflow replay invariants', () => {
  it('freezes the two acceptance identities, seeds, and public recipes', () => {
    expect(
      NOVEL_WORKFLOW_DEFINITIONS.map(({ identity, expectedOperations }) => ({
        assetId: identity.assetId,
        seed: identity.seed,
        operationCount: expectedOperations.length,
      })),
    ).toEqual([
      { assetId: 'guard.s4.rustic', seed: 4002, operationCount: 48 },
      { assetId: 'container.s4.banded', seed: 4001, operationCount: 2 },
    ]);

    for (const definition of NOVEL_WORKFLOW_DEFINITIONS) {
      const planning = planNovelAssetBrief(definition.brief);
      expect(planning.supported).toBe(true);
      if (!planning.supported) throw new Error('Expected supported planning.');
      expect(planning.archetypeId).toBe(definition.identity.archetypeId);
      expect(planning.suggestedOperations).toEqual(
        definition.expectedOperations,
      );
      for (const operation of planning.suggestedOperations)
        expect(planning.compatibleMaterialIds).toContain(operation.materialId);
    }
  });

  it('adds one explicit chibi styling revision after the guard composition recipe', () => {
    expect(
      NOVEL_WORKFLOW_DEFINITIONS.map((definition) => ({
        assetId: definition.identity.assetId,
        revisionCount:
          1 +
          definition.expectedOperations.length +
          ('stylingPatch' in definition ? 1 : 0),
      })),
    ).toEqual([
      { assetId: 'guard.s4.rustic', revisionCount: 50 },
      { assetId: 'container.s4.banded', revisionCount: 3 },
    ]);
    expect(GUARD_CHIBI_STYLING_PATCH.operations).toHaveLength(16);
    expect(
      Object.fromEntries(
        GUARD_CHIBI_STYLING_PATCH.operations.map((operation) => [
          operation.partId,
          operation.transform.scale,
        ]),
      ),
    ).toMatchObject({
      'body.root': [1.25, 0.72, 1.8],
      head: [1.25, 1.4, 1.1],
      'helmet.iron': [1.08, 1, 1.05],
      pelvis: [1.1, 0.85, 1.05],
      'upper-arm.left': [1.1, 0.8, 1.05],
      'upper-arm.right': [1.1, 0.8, 1.05],
      'thigh.left': [1, 0.85, 1],
      'thigh.right': [1, 0.85, 1],
    });
  });

  it('requires the exact unchanged 16-tool public surface', () => {
    expect(PUBLIC_TOOL_NAMES).toHaveLength(16);
    expect(() => assertNovelPublicToolSurface(PUBLIC_TOOL_NAMES)).not.toThrow();
    expect(() =>
      assertNovelPublicToolSurface([...PUBLIC_TOOL_NAMES, 'hidden_tool']),
    ).toThrow(/catalog drifted/);
    expect(() =>
      assertNovelPublicToolSurface(PUBLIC_TOOL_NAMES.slice(1)),
    ).toThrow(/catalog drifted/);
  });

  it('emits the existing canonical Pixel dossier boundary per asset', () => {
    expect(PIXEL_DOSSIER_FILENAMES).toEqual([
      'tools-list.json',
      'interchange-manifest.json',
      'chunks.json',
    ]);
  });

  it('accepts direct and package-script CLI forms and rejects ambiguous output roots', () => {
    expect(parseNovelWorkflowReplayCliArgs(['/tmp/direct'])).toBe(
      '/tmp/direct',
    );
    expect(parseNovelWorkflowReplayCliArgs(['--', '/tmp/package'])).toBe(
      '/tmp/package',
    );
    expect(() => parseNovelWorkflowReplayCliArgs([])).toThrow(/Usage:/);
    expect(() => parseNovelWorkflowReplayCliArgs(['--'])).toThrow(/Usage:/);
    expect(() =>
      parseNovelWorkflowReplayCliArgs(['/tmp/one', '/tmp/two']),
    ).toThrow(/Usage:/);
    expect(() =>
      parseNovelWorkflowReplayCliArgs(['--', '/tmp/one', '/tmp/two']),
    ).toThrow(/Usage:/);
  });

  it('fails closed on a public transport error envelope', () => {
    const response = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ok: false,
            affectedIds: [],
            summary: 'blocked',
            issues: [],
          }),
        },
      ],
      isError: true,
    };
    expect(() => parseNovelPublicMcpEnvelope(response)).toThrow(
      /transport marked the response as an error/,
    );
  });

  it('selects only permitted records and verifies gap-free digest-bound chunks', () => {
    const bytes = Buffer.from('public artifact bytes');
    const sha256 = digest(bytes);
    const revisionId = `revision.${'a'.repeat(64)}`;
    const manifest = {
      artifacts: [
        {
          id: 'frame.n',
          classification: 'source',
          role: 'directional_frame',
          media_type: 'image/png',
          byte_length: bytes.byteLength,
          sha256,
          width: 128,
          height: 128,
          revision_id: revisionId,
          reference: 'artifacts/frame.n.png',
          direction: 'N',
          transparent: true,
        },
        {
          id: 'review.contact-sheet',
          classification: 'derived',
          role: 'contact_sheet',
          media_type: 'image/png',
          byte_length: 1,
          sha256: digest('x'),
          width: 1024,
          height: 256,
          revision_id: revisionId,
          reference: 'artifacts/contact-sheet.png',
          transparent: false,
        },
      ],
      evidence: [
        {
          id: 'workflow.public-mcp',
          kind: 'workflow',
          reference: 'evidence/workflow.json',
          sha256,
          byte_length: bytes.byteLength,
        },
        {
          id: 'review.manual',
          kind: 'manual',
          reference: 'evidence/manual.json',
          sha256: digest('manual'),
        },
      ],
    } as ForgeAssetInterchangeManifest;
    const permitted = permittedManifestRecords(manifest);
    expect(permitted.records.map(({ id }) => id)).toEqual([
      'frame.n',
      'workflow.public-mcp',
    ]);
    expect(permitted.excludedArtifactIds).toEqual(['review.contact-sheet']);

    const expected = permitted.records[0]!;
    const chunks = [
      replayChunk(expected, bytes.subarray(8), 8, revisionId),
      replayChunk(expected, bytes.subarray(0, 8), 0, revisionId),
    ];
    expect(reconstructNovelReplayRecord(expected, chunks)).toEqual(bytes);
    expect(() => reconstructNovelReplayRecord(expected, [chunks[0]!])).toThrow(
      /binding or sequence drifted/,
    );
  });

  it('rejects a pre-existing output root before starting the expensive replay', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'forge-novel-replay-test-'));
    const existing = join(parent, 'already-exists');
    await mkdir(existing);
    await expect(runNovelWorkflowReplay(existing)).rejects.toMatchObject({
      code: 'EEXIST',
    });
  });
});

function replayChunk(
  expected: {
    id: string;
    recordKind: 'artifact' | 'evidence';
    byteLength: number;
    sha256: string;
  },
  bytes: Buffer,
  offset: number,
  revisionId: string,
): ForgeInterchangeArtifactChunk {
  return {
    record_kind: expected.recordKind,
    asset_id: 'guard.s4.rustic',
    revision_id: revisionId,
    artifact_id: expected.id,
    artifact_sha256: expected.sha256,
    chunk_sha256: digest(bytes),
    offset,
    length: bytes.byteLength,
    total: expected.byteLength,
    bytes_base64: bytes.toString('base64'),
  };
}
