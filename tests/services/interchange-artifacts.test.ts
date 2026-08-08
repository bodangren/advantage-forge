import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import type { AssetDocument } from '../../src/contracts/index.js';
import { contentRevisionId } from '../../src/document/index.js';
import { FileInterchangeArtifactService } from '../../src/services/index.js';
import { assetFixture } from '../document/fixture.js';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.byteLength);
  chunk.writeUInt32BE(data.byteLength, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.byteLength);
  return chunk;
}

function pngBytes(seed: number, transparent = true): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(128, 0);
  ihdr.writeUInt32BE(128, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((128 * 4 + 1) * 128);
  for (let row = 0; row < 128; row += 1) {
    const start = row * (128 * 4 + 1);
    raw[start] = 0;
    for (let pixel = 0; pixel < 128; pixel += 1) {
      const offset = start + 1 + pixel * 4;
      raw[offset] = seed;
      raw[offset + 1] = 64;
      raw[offset + 2] = 128;
      raw[offset + 3] = transparent && row === 0 && pixel === 0 ? 0 : 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function glbBytes(): Buffer {
  const source = Buffer.from(
    JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [{}] }),
  );
  const json = Buffer.alloc(Math.ceil(source.byteLength / 4) * 4, 0x20);
  source.copy(json);
  const bytes = Buffer.alloc(20 + json.byteLength);
  bytes.write('glTF', 0, 'ascii');
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.byteLength, 8);
  bytes.writeUInt32LE(json.byteLength, 12);
  bytes.writeUInt32LE(0x4e4f534a, 16);
  json.copy(bytes, 20);
  return bytes;
}

async function stagedRevision(
  profileId = 'fantasy.sprite.orthographic.v1',
  profileOverrides: Record<string, unknown> = {},
  novelIdentity?: AssetDocument['novelIdentity'],
) {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-interchange-'));
  const base = assetFixture();
  const document = {
    ...base,
    ...(novelIdentity === undefined ? {} : { novelIdentity }),
    renderProfiles: [
      {
        ...base.renderProfiles[0]!,
        id: profileId,
        ...profileOverrides,
      },
    ],
  };
  const revisionId = contentRevisionId(document);
  const directory = join(
    workspaceRoot,
    'artifacts/reference',
    document.id,
    revisionId,
  );
  await mkdir(directory, { recursive: true });
  const frames = [];
  for (const direction of DIRECTIONS) {
    const path = `${direction.toLowerCase()}.png`;
    await writeFile(join(directory, path), pngBytes(direction.length));
    frames.push({ direction, path, metrics: { occupiedPixelCount: 32 } });
  }
  await writeFile(join(directory, `${document.id}.glb`), glbBytes());
  const profile = document.renderProfiles[0]!;
  await writeFile(
    join(directory, 'render-manifest.json'),
    `${JSON.stringify({
      assetId: document.id,
      revisionId,
      profile: profile.id,
      width: profile.widthPixels,
      height: profile.heightPixels,
      directions: profile.directions,
      elevationDegrees: profile.elevationDegrees,
      paddingPixels: profile.paddingPixels,
      minimumFeaturePixels: profile.minimumFeaturePixels,
      transparent: profile.transparent,
      frames,
      contactSheetPath: 'contact-sheet.png',
    })}\n`,
  );
  await writeFile(
    join(directory, 'glb-manifest.json'),
    `${JSON.stringify({
      assetId: document.id,
      revisionId,
      glbPath: `${document.id}.glb`,
      format: 'glb',
    })}\n`,
  );
  return { workspaceRoot, document, revisionId, directory };
}

describe('immutable interchange artifact registry', () => {
  it('maps exact internal sprite.default identity to the external interchange profile', async () => {
    const staged = await stagedRevision('sprite.default');
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await service.register(staged.document, staged.revisionId);
    await expect(
      service.getManifest({
        assetId: staged.document.id,
        revisionId: staged.revisionId,
      }),
    ).resolves.toMatchObject({
      render_profile: {
        id: 'fantasy.sprite.orthographic.v1',
        version: '1.0.0',
      },
    });
  });

  it.each([
    ['sprite.default', { paddingPixels: 7 }],
    ['sprite.unknown', {}],
  ])(
    'rejects internal profile %s without an exact external mapping',
    async (profileId, overrides) => {
      const staged = await stagedRevision(profileId, overrides);
      const service = new FileInterchangeArtifactService({
        workspaceRoot: staged.workspaceRoot,
      });
      await expect(
        service.register(staged.document, staged.revisionId),
      ).rejects.toThrow(/render profile/i);
    },
  );

  it('registers one complete exact revision deterministically', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await expect(
      service.register(staged.document, staged.revisionId),
    ).resolves.toBe(true);
    const first = await service.getManifest({
      assetId: staged.document.id,
      revisionId: staged.revisionId,
    });
    await expect(
      service.register(staged.document, staged.revisionId),
    ).resolves.toBe(true);
    await expect(
      service.getManifest({
        assetId: staged.document.id,
        revisionId: staged.revisionId,
      }),
    ).resolves.toEqual(first);
    expect(JSON.stringify(first)).not.toContain(staged.workspaceRoot);
  });

  it('publishes a novel heroic style with digest-bound originality evidence', async () => {
    const styleProfile = {
      id: 'heroic_stylized_v1',
      version: '1.0.0',
      review: {
        status: 'recorded',
        attestation: 'original-project-owned-no-franchise-copy',
        evidence_reference: 'evidence/originality-review.json',
      },
    } as const;
    const renderProfile = {
      id: 'fantasy.sprite.orthographic.v1',
      version: '1.0.0',
    } as const;
    const staged = await stagedRevision(
      'fantasy.sprite.orthographic.v1',
      {},
      {
        contractId: 'forge-novel-asset-identity/v1',
        origin: 'novel',
        family: 'humanoid',
        archetypeId: 'humanoid.biped.rustic',
        styleProfile,
        renderProfile,
      },
    );
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await service.register(staged.document, staged.revisionId);
    const manifest = await service.getManifest({
      assetId: staged.document.id,
      revisionId: staged.revisionId,
    });
    const originality = manifest.evidence.find(
      ({ kind }) => kind === 'originality_review',
    );
    expect(originality).toBeDefined();
    expect(manifest.style_profile).toMatchObject({
      id: styleProfile.id,
      version: styleProfile.version,
      review: {
        status: 'recorded',
        attestation: styleProfile.review.attestation,
        evidence_reference: originality?.reference,
      },
    });
    const chunk = await service.getArtifactChunk({
      assetId: staged.document.id,
      revisionId: staged.revisionId,
      artifactId: originality!.id,
      recordKind: 'evidence',
      offset: 0,
      length: originality!.byte_length!,
    });
    expect(
      JSON.parse(Buffer.from(chunk.bytes_base64, 'base64').toString('utf8')),
    ).toMatchObject({
      contract_id: 'forge-style-originality-review/v1',
      asset_id: staged.document.id,
      revision_id: staged.revisionId,
      style_profile: {
        id: styleProfile.id,
        version: styleProfile.version,
        attestation: styleProfile.review.attestation,
        declared_evidence_reference: styleProfile.review.evidence_reference,
      },
    });
  });

  it('returns false until both render and GLB manifests exist', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await writeFile(join(staged.directory, 'glb-manifest.json.moved'), 'x');
    const glbManifest = join(staged.directory, 'glb-manifest.json');
    const saved = await readFile(glbManifest);
    await import('node:fs/promises').then(({ unlink }) => unlink(glbManifest));
    await expect(
      service.register(staged.document, staged.revisionId),
    ).resolves.toBe(false);
    await writeFile(glbManifest, saved);
  });

  it('rejects a stale revision identity and symbolic-link traversal', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await expect(
      service.register(staged.document, `revision.${'f'.repeat(64)}`),
    ).rejects.toThrow(/revision/i);

    const outside = join(staged.workspaceRoot, 'outside.png');
    await writeFile(outside, 'outside');
    const frame = join(staged.directory, 'n.png');
    await import('node:fs/promises').then(({ unlink }) => unlink(frame));
    await symlink(outside, frame);
    await expect(
      service.register(staged.document, staged.revisionId),
    ).rejects.toThrow(/symbolic link/i);
  });

  it('rejects bytes changed after immutable registration', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await service.register(staged.document, staged.revisionId);
    await writeFile(join(staged.directory, 'n.png'), Buffer.alloc(128, 99));
    await expect(
      service.getArtifactChunk({
        assetId: staged.document.id,
        revisionId: staged.revisionId,
        artifactId: 'frame.n',
        offset: 0,
        length: 128,
      }),
    ).rejects.toThrow(/digest/i);
  });

  it('rejects manifest claims backed by invalid PNG or GLB bytes', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    const corrupt = pngBytes(1);
    const corruptIndex = corrupt.byteLength - 20;
    corrupt[corruptIndex] = corrupt[corruptIndex]! ^ 0xff;
    await writeFile(join(staged.directory, 'n.png'), corrupt);
    await expect(
      service.register(staged.document, staged.revisionId),
    ).rejects.toThrow(/PNG .*CRC/i);

    const opaque = await stagedRevision();
    const opaqueService = new FileInterchangeArtifactService({
      workspaceRoot: opaque.workspaceRoot,
    });
    await writeFile(join(opaque.directory, 'n.png'), pngBytes(1, false));
    await expect(
      opaqueService.register(opaque.document, opaque.revisionId),
    ).rejects.toThrow(/non-opaque alpha/i);

    const second = await stagedRevision();
    const secondService = new FileInterchangeArtifactService({
      workspaceRoot: second.workspaceRoot,
    });
    const fakeGlb = Buffer.alloc(512);
    fakeGlb.write('glTF', 0, 'ascii');
    fakeGlb.writeUInt32LE(2, 4);
    fakeGlb.writeUInt32LE(fakeGlb.byteLength, 8);
    await writeFile(
      join(second.directory, `${second.document.id}.glb`),
      fakeGlb,
    );
    await expect(
      secondService.register(second.document, second.revisionId),
    ).rejects.toThrow(/GLB (chunk|first|JSON)/i);
  });

  it('returns digest-bound bounded bytes without exposing a path', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    const manifest = (await service.register(
      staged.document,
      staged.revisionId,
    )) as true;
    expect(manifest).toBe(true);
    const chunk = await service.getArtifactChunk({
      assetId: staged.document.id,
      revisionId: staged.revisionId,
      artifactId: 'frame.n',
      offset: 5,
      length: 32,
    });
    const stored = await readFile(join(staged.directory, 'n.png'));
    expect(chunk).toMatchObject({
      offset: 5,
      length: 32,
      total: stored.byteLength,
    });
    expect(JSON.stringify(chunk)).not.toContain(staged.workspaceRoot);
    const bytes = Buffer.from(chunk.bytes_base64, 'base64');
    expect(bytes).toHaveLength(32);
    expect(chunk.artifact_sha256).toBe(
      createHash('sha256').update(stored).digest('hex'),
    );
  });

  it('retrieves manifest-pinned workflow evidence as an explicit evidence record', async () => {
    const staged = await stagedRevision();
    const service = new FileInterchangeArtifactService({
      workspaceRoot: staged.workspaceRoot,
    });
    await service.register(staged.document, staged.revisionId);
    const manifest = await service.getManifest({
      assetId: staged.document.id,
      revisionId: staged.revisionId,
    });
    const evidence = manifest.evidence[0]!;
    expect(evidence.byte_length).toBeGreaterThan(0);
    const chunk = await service.getArtifactChunk({
      assetId: staged.document.id,
      revisionId: staged.revisionId,
      artifactId: evidence.id,
      recordKind: 'evidence',
      offset: 0,
      length: evidence.byte_length!,
    });
    expect(chunk).toMatchObject({
      record_kind: 'evidence',
      artifact_id: evidence.id,
      artifact_sha256: evidence.sha256,
      total: evidence.byte_length,
    });
    expect(
      createHash('sha256')
        .update(Buffer.from(chunk.bytes_base64, 'base64'))
        .digest('hex'),
    ).toBe(evidence.sha256);
  });
});
