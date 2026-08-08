import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  forgeAssetInterchangeManifestSha256,
  type AssetDocument,
  type ForgeAssetInterchangeManifest,
} from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

const DIGEST =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

const digest = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

class MemoryRevisions implements RevisionRepository {
  readonly records = new Map<string, RevisionRecord>();
  async save(document: Readonly<AssetDocument>): Promise<RevisionRecord> {
    const record = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      createdAt: '2026-07-22T00:00:00.000Z',
      document,
    };
    this.records.set(`${document.id}:${record.revisionId}`, record);
    return record;
  }
  async get(assetId: string, revisionId: string) {
    return this.records.get(`${assetId}:${revisionId}`);
  }
  async getCurrent(assetId: string) {
    return [...this.records.values()].find(({ assetId: id }) => id === assetId);
  }
}

async function fixture(revisionId: string) {
  const manifest: ForgeAssetInterchangeManifest = {
    contract_id: 'forge-asset-interchange-manifest/v1',
    manifest_sha256: DIGEST,
    source: { asset_id: 'adventurer.rustic', revision_id: revisionId },
    style_profile: {
      id: 'cute_chibi_v1',
      version: '1.0.0',
      review: { status: 'not_required' },
    },
    render_profile: {
      id: 'fantasy.sprite.orthographic.v1',
      version: '1.0.0',
    },
    provenance: {
      source_kind: 'project_generated',
      workflow_reference: 'evidence/public-mcp-workflow.json',
      ownership: 'project_owned',
      license_label: 'project-owned',
    },
    artifacts: [
      ...DIRECTIONS.map((direction) => ({
        id: `frame.${direction.toLowerCase()}`,
        classification: 'source' as const,
        role: 'directional_frame' as const,
        media_type: 'image/png' as const,
        byte_length: 128,
        sha256: DIGEST,
        width: 128,
        height: 128,
        revision_id: revisionId,
        reference: `artifacts/adventurer/${direction.toLowerCase()}.png`,
        direction,
        transparent: true,
      })),
      {
        id: 'model.glb',
        classification: 'source',
        role: 'glb',
        media_type: 'model/gltf-binary',
        byte_length: 512,
        sha256: DIGEST,
        revision_id: revisionId,
        reference: 'artifacts/adventurer/adventurer.rustic.glb',
      },
    ],
    evidence: [
      {
        id: 'workflow.public-mcp',
        kind: 'workflow',
        reference: 'evidence/public-mcp-workflow.json',
        sha256: DIGEST,
      },
    ],
  };
  manifest.manifest_sha256 =
    await forgeAssetInterchangeManifestSha256(manifest);
  return manifest;
}

async function setup() {
  const revisions = new MemoryRevisions();
  const bootstrap = createToolHandlers({ revisions });
  const created = await bootstrap.createAsset({ reference: 'adventurer' });
  const revisionId = created.revisionId!;
  const manifest = await fixture(revisionId);
  const bytes = new Uint8Array(128).fill(7);
  return { revisions, revisionId, manifest, bytes };
}

describe('public interchange retrieval', () => {
  it('retrieves a canonical revision-pinned manifest and a bounded source chunk', async () => {
    const { revisions, revisionId, manifest, bytes } = await setup();
    const handlers = createToolHandlers({
      revisions,
      interchangeService: {
        getManifest: async () => manifest,
        getArtifactChunk: async (request) => {
          const chunkBytes = bytes.subarray(
            request.offset,
            request.offset + request.length,
          );
          return {
            asset_id: request.assetId,
            revision_id: request.revisionId,
            artifact_id: request.artifactId,
            artifact_sha256: DIGEST,
            chunk_sha256: digest(chunkBytes),
            offset: request.offset,
            length: request.length,
            total: bytes.byteLength,
            bytes_base64: Buffer.from(chunkBytes).toString('base64'),
          };
        },
      },
    });

    const retrieved = await handlers.getInterchangeManifest({
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
    });
    expect(retrieved).toMatchObject({
      ok: true,
      revisionId,
      data: { manifest_sha256: manifest.manifest_sha256 },
    });

    const chunk = await handlers.getInterchangeArtifactChunk({
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
      artifact_id: 'frame.n',
      offset: 0,
      length: 128,
    });
    expect(chunk).toMatchObject({
      ok: true,
      revisionId,
      data: {
        asset_id: 'adventurer.rustic',
        revision_id: revisionId,
        artifact_id: 'frame.n',
        offset: 0,
        length: 128,
        total: 128,
      },
    });
  });

  it('fails closed when no immutable interchange registry is configured', async () => {
    const { revisions, revisionId } = await setup();
    const result = await createToolHandlers({
      revisions,
    }).getInterchangeManifest({
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
    });
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'SERVICE_UNAVAILABLE' }],
    });
  });

  it('rejects derived artifacts from the live byte path', async () => {
    const { revisions, revisionId, manifest } = await setup();
    manifest.artifacts.push({
      id: 'review.contact-sheet',
      classification: 'derived',
      role: 'contact_sheet',
      media_type: 'image/png',
      byte_length: 256,
      sha256: DIGEST,
      width: 1024,
      height: 128,
      revision_id: revisionId,
      reference: 'artifacts/adventurer/contact-sheet.png',
      transparent: false,
    });
    manifest.manifest_sha256 =
      await forgeAssetInterchangeManifestSha256(manifest);
    const handlers = createToolHandlers({
      revisions,
      interchangeService: {
        getManifest: async () => manifest,
        getArtifactChunk: async () => {
          throw new Error('must not read derived bytes');
        },
      },
    });
    const result = await handlers.getInterchangeArtifactChunk({
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
      artifact_id: 'review.contact-sheet',
      offset: 0,
      length: 1,
    });
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE', path: '$.artifact_id' }],
    });
  });

  it.each([
    { offset: 128, length: 1 },
    { offset: 120, length: 9 },
    { offset: 0, length: FORGE_INTERCHANGE_MAX_CHUNK_BYTES + 1 },
  ])('rejects an invalid artifact range %#', async ({ offset, length }) => {
    const { revisions, revisionId, manifest } = await setup();
    const handlers = createToolHandlers({
      revisions,
      interchangeService: {
        getManifest: async () => manifest,
        getArtifactChunk: async () => {
          throw new Error('must not read invalid ranges');
        },
      },
    });
    const result = await handlers.getInterchangeArtifactChunk({
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
      artifact_id: 'frame.n',
      offset,
      length,
    });
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE' }],
    });
  });

  it.each([
    ['revision_id', 'revision.' + 'f'.repeat(64)],
    ['artifact_sha256', 'f'.repeat(64)],
    ['chunk_sha256', 'f'.repeat(64)],
    ['offset', 1],
    ['length', 127],
    ['total', 129],
    ['bytes_base64', Buffer.alloc(128, 9).toString('base64')],
  ] as const)('rejects mismatched service field %s', async (field, value) => {
    const { revisions, revisionId, manifest, bytes } = await setup();
    const base = {
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
      artifact_id: 'frame.n',
      artifact_sha256: DIGEST,
      chunk_sha256: digest(bytes),
      offset: 0,
      length: 128,
      total: 128,
      bytes_base64: Buffer.from(bytes).toString('base64'),
    };
    const handlers = createToolHandlers({
      revisions,
      interchangeService: {
        getManifest: async () => manifest,
        getArtifactChunk: async () => ({ ...base, [field]: value }),
      },
    });
    const result = await handlers.getInterchangeArtifactChunk({
      asset_id: 'adventurer.rustic',
      revision_id: revisionId,
      artifact_id: 'frame.n',
      offset: 0,
      length: 128,
    });
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'REPOSITORY_ERROR' }],
    });
  });
});
