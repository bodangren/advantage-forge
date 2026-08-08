import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { contentRevisionId } from '../../src/document/index.js';
import { FileAuthoringReviewArtifactService } from '../../src/services/index.js';
import { assetFixture } from '../document/fixture.js';

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type, 'ascii');
  const result = Buffer.alloc(12 + data.byteLength);
  result.writeUInt32BE(data.byteLength);
  name.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.byteLength);
  return result;
}
function png(width: number, height: number, seed: number, alpha = 255): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let row = 0; row < height; row += 1)
    for (let pixel = 0; pixel < width; pixel += 1) {
      const offset = row * (width * 4 + 1) + 1 + pixel * 4;
      raw[offset] = seed;
      raw[offset + 1] = seed;
      raw[offset + 2] = seed;
      raw[offset + 3] = alpha;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function fixture() {
  const workspaceRoot = await mkdtemp(
    join(tmpdir(), 'forge-authoring-review-'),
  );
  const service = new FileAuthoringReviewArtifactService({ workspaceRoot });
  const document = assetFixture();
  const revisionId = contentRevisionId(document);
  const views = ['front', 'three-quarter', 'side', 'back'] as const;
  const frames = views.map((view, index) => ({
    view,
    bytes: png(512, 512, index + 1),
  }));
  const sheet = png(2048, 530, 9);
  return { workspaceRoot, service, document, revisionId, frames, sheet };
}

describe('authoring review artifact registry', () => {
  it('persists and retrieves immutable evidence-only review bytes', async () => {
    const { workspaceRoot, service, document, revisionId, frames, sheet } =
      await fixture();
    const manifest = await service.register(
      document,
      revisionId,
      frames,
      sheet,
    );

    expect(manifest).toMatchObject({
      classification: 'authoring_only',
      admission: {
        review_only: true,
        interchange_admitted: false,
        pack_admitted: false,
      },
      source: { asset_id: document.id, revision_id: revisionId },
    });
    expect(
      manifest.artifacts.every((artifact) => !('direction' in artifact)),
    ).toBe(true);
    await expect(
      service.getManifest({
        assetId: document.id,
        revisionId,
        deliveryId: manifest.delivery_id,
      }),
    ).resolves.toEqual(manifest);
    const record = manifest.artifacts[0]!;
    const response = await service.getArtifactChunk({
      assetId: document.id,
      revisionId,
      deliveryId: manifest.delivery_id,
      artifactId: record.id,
      offset: 0,
      length: 32,
    });
    expect(response).toMatchObject({
      record_kind: 'evidence',
      delivery_id: manifest.delivery_id,
      artifact_id: record.id,
      artifact_sha256: record.sha256,
      length: 32,
    });
    await expect(
      service.register(document, revisionId, frames, sheet),
    ).resolves.toEqual(manifest);
    await expect(
      service.register(
        document,
        revisionId,
        frames.map((frame) => ({ ...frame, bytes: png(512, 512, 77) })),
        sheet,
      ),
    ).rejects.toThrow(/other bytes/i);
    await expect(
      service.getArtifactChunk({
        assetId: document.id,
        revisionId,
        deliveryId: manifest.delivery_id,
        artifactId: record.id,
        offset: 0,
        length: 32769,
      }),
    ).rejects.toThrow(/bounded integer range/i);
    expect(
      manifest.artifacts.every(({ reference }) =>
        reference.startsWith('artifacts/authoring/'),
      ),
    ).toBe(true);
    await expect(
      access(
        join(
          workspaceRoot,
          'artifacts',
          document.id,
          revisionId,
          'interchange-manifest.json',
        ),
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  }, 15_000);

  it('rejects stale identities and malformed comparison image sets', async () => {
    const { service, document, revisionId, frames, sheet } = await fixture();
    await expect(
      service.register(document, `revision.${'0'.repeat(64)}`, frames, sheet),
    ).rejects.toThrow(/stale/i);
    await expect(
      service.register(document, revisionId, frames.slice(0, 3), sheet),
    ).rejects.toThrow(/incomplete or misordered/i);
    await expect(
      service.register(
        document,
        revisionId,
        [frames[1]!, frames[0]!, frames[2]!, frames[3]!],
        sheet,
      ),
    ).rejects.toThrow(/incomplete or misordered/i);
    await expect(
      service.register(
        document,
        revisionId,
        [frames[0]!, frames[0]!, frames[2]!, frames[3]!],
        sheet,
      ),
    ).rejects.toThrow(/incomplete or misordered/i);
    await expect(
      service.register(
        document,
        revisionId,
        [{ ...frames[0]!, bytes: png(512, 512, 1, 128) }, ...frames.slice(1)],
        sheet,
      ),
    ).rejects.toThrow(/opaque/i);
    await expect(
      service.register(
        document,
        revisionId,
        [{ ...frames[0]!, bytes: png(511, 512, 1) }, ...frames.slice(1)],
        sheet,
      ),
    ).rejects.toThrow(/512x512/i);
    await expect(
      service.register(document, revisionId, frames, png(2047, 530, 9)),
    ).rejects.toThrow(/2048x530/i);
  });

  it('rejects escaped and symlinked registry roots', async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-authoring-review-path-'),
    );
    expect(
      () =>
        new FileAuthoringReviewArtifactService({
          workspaceRoot,
          outputDirectory: '../escaped',
        }),
    ).toThrow(/remain in the workspace/i);
    const real = join(workspaceRoot, 'real');
    await mkdir(real);
    await symlink(real, join(workspaceRoot, 'linked'));
    const service = new FileAuthoringReviewArtifactService({
      workspaceRoot,
      outputDirectory: 'linked',
    });
    const document = assetFixture();
    const revisionId = contentRevisionId(document);
    const views = ['front', 'three-quarter', 'side', 'back'] as const;
    const frames = views.map((view, index) => ({
      view,
      bytes: png(512, 512, index + 1),
    }));
    await expect(
      service.register(document, revisionId, frames, png(2048, 530, 9)),
    ).rejects.toThrow(/symlink/i);
  });

  it('fails closed for delivery, artifact, range, and stored-byte mismatches', async () => {
    const { workspaceRoot, service, document, revisionId, frames, sheet } =
      await fixture();
    const manifest = await service.register(
      document,
      revisionId,
      frames,
      sheet,
    );
    const record = manifest.artifacts[0]!;
    await expect(
      service.getManifest({
        assetId: document.id,
        revisionId,
        deliveryId: `delivery.${'f'.repeat(64)}`,
      }),
    ).rejects.toThrow(/not found/i);
    await expect(
      service.getArtifactChunk({
        assetId: document.id,
        revisionId,
        deliveryId: manifest.delivery_id,
        artifactId: 'view.unknown',
        offset: 0,
        length: 1,
      }),
    ).rejects.toThrow(/not found/i);
    for (const request of [
      { offset: record.byte_length, length: 1 },
      { offset: record.byte_length - 1, length: 2 },
      { offset: 0.5, length: 1 },
      { offset: 0, length: 0 },
      { offset: 0, length: 1.5 },
      { offset: 0, length: 32769 },
    ]) {
      await expect(
        service.getArtifactChunk({
          assetId: document.id,
          revisionId,
          deliveryId: manifest.delivery_id,
          artifactId: record.id,
          ...request,
        }),
      ).rejects.toThrow(/range/i);
    }
    await writeFile(join(workspaceRoot, record.reference), png(512, 512, 77));
    await expect(
      service.getArtifactChunk({
        assetId: document.id,
        revisionId,
        deliveryId: manifest.delivery_id,
        artifactId: record.id,
        offset: 0,
        length: 1,
      }),
    ).rejects.toThrow(/do not match the manifest/i);
  });

  it('rejects a stored manifest whose digest identity was tampered', async () => {
    const { workspaceRoot, service, document, revisionId, frames, sheet } =
      await fixture();
    const manifest = await service.register(
      document,
      revisionId,
      frames,
      sheet,
    );
    const manifestPath = join(
      workspaceRoot,
      'artifacts',
      'authoring',
      document.id,
      revisionId,
      'reference-comparison',
      'authoring-review-manifest.json',
    );
    const stored: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (stored === null || typeof stored !== 'object')
      throw new Error('Expected a stored authoring manifest object.');
    Object.assign(stored, { manifest_sha256: '0'.repeat(64) });
    await writeFile(manifestPath, `${JSON.stringify(stored)}\n`);
    await expect(
      service.getManifest({
        assetId: document.id,
        revisionId,
        deliveryId: manifest.delivery_id,
      }),
    ).rejects.toThrow(/digest identity is invalid/i);
  });
});
