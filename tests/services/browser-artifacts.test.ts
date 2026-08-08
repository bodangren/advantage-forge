import {
  mkdtemp,
  readFile,
  readdir,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import type { Page } from '@playwright/test';
import { assetFixture } from '../document/fixture.js';
import { describe, expect, it } from 'vitest';
import { LocalBrowserArtifactService } from '../../src/services/index.js';
import { contentRevisionId } from '../../src/document/index.js';
import { parseForgeAssetInterchangeManifest } from '../../src/contracts/index.js';

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
  chunk.writeUInt32BE(data.byteLength);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.byteLength);
  return chunk;
}

function pngBytes(seed = 1): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(128, 0);
  ihdr.writeUInt32BE(128, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((128 * 4 + 1) * 128);
  for (let row = 0; row < 128; row += 1) {
    const start = row * (128 * 4 + 1);
    for (let pixel = 0; pixel < 128; pixel += 1) {
      const offset = start + 1 + pixel * 4;
      raw[offset] = seed;
      raw[offset + 3] = row === 0 && pixel === 0 ? 0 : 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function opaquePngBytes(width: number, height: number, seed: number): Buffer {
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
      raw[offset + 3] = 255;
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

describe('local browser artifact service', () => {
  it('rejects output paths outside the active workspace', () => {
    expect(
      () =>
        new LocalBrowserArtifactService({
          workspaceRoot: '/tmp/forge',
          outputDirectory: '../escape',
        }),
    ).toThrow(/inside the active workspace/);
  });
  it('accepts a workspace-contained output directory without starting a browser', () => {
    expect(
      new LocalBrowserArtifactService({
        workspaceRoot: '/tmp/forge',
        outputDirectory: 'artifacts',
      }),
    ).toBeInstanceOf(LocalBrowserArtifactService);
  });

  it('rejects an explicit missing browser executable before rendering', () => {
    expect(
      () =>
        new LocalBrowserArtifactService({
          workspaceRoot: '/tmp/forge',
          executablePath: '/tmp/forge-browser-does-not-exist',
        }),
    ).toThrow(/browser executable.*does not exist/i);
  });

  it('accepts only credential-free HTTP loopback inspector URLs', () => {
    for (const inspectorUrl of [
      'https://127.0.0.1:4173',
      'http://example.com:4173',
      'http://user:secret@localhost:4173',
    ])
      expect(
        () =>
          new LocalBrowserArtifactService({
            workspaceRoot: '/tmp/forge',
            inspectorUrl,
          }),
      ).toThrow(/Inspector URL/);
  });

  it('rejects symlink output traversal before starting a browser', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-artifacts-'));
    const outside = await mkdtemp(join(tmpdir(), 'forge-outside-'));
    await symlink(outside, join(workspaceRoot, 'artifacts'), 'dir');
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      outputDirectory: 'artifacts',
    });

    await expect(
      service.render(
        assetFixture(),
        'revision.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
    ).rejects.toThrow(/symbolic links/);
    expect(await readdir(outside)).toEqual([]);
  });

  it('rejects browser-controlled direction traversal before any write', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-direction-'));
    const sentinel = join(workspaceRoot, 'sentinel.png');
    await writeFile(sentinel, 'preserve');
    const dataUrl = `data:image/png;base64,${pngBytes().toString('base64')}`;
    const fakePage = {
      evaluate: async () => ({
        frames: [
          {
            direction: '../../../../sentinel',
            dataUrl,
            metrics: {},
          },
        ],
        contactSheetDataUrl: dataUrl,
      }),
    } as unknown as Page;
    const document = assetFixture();
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      pageRunner: (callback) => callback(fakePage),
    });

    await expect(
      service.render(document, contentRevisionId(document)),
    ).rejects.toThrow(/direction|render payload/i);
    await expect(readFile(sentinel, 'utf8')).resolves.toBe('preserve');
  });

  it('persists render frames and a revision manifest through an injected page runner', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-render-'));
    const png = pngBytes();
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
    const fakePage = {
      evaluate: async () => ({
        frames: DIRECTIONS.map((direction) => ({
          direction,
          dataUrl,
          metrics: { occupiedPixelCount: 1 },
        })),
        contactSheetDataUrl: dataUrl,
      }),
    } as unknown as Page;
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      outputDirectory: 'artifacts',
      pageRunner: (callback) => callback(fakePage),
    });
    const document = assetFixture();
    const revisionId = contentRevisionId(document);
    const result = (await service.render(document, revisionId)) as {
      manifestPath: string;
      contactSheetPath: string;
      frames: { path: string }[];
    };

    expect(await readFile(result.frames[0]!.path)).toEqual(png);
    expect(await readFile(result.contactSheetPath)).toEqual(png);
    const manifest = JSON.parse(
      await readFile(result.manifestPath, 'utf8'),
    ) as {
      contactSheetPath: string;
      frames: { path: string }[];
    };
    expect(manifest).toMatchObject({
      assetId: 'asset.hero',
      revisionId,
      frames: DIRECTIONS.map((direction) => ({ direction })),
    });
    expect(manifest.frames[0]!.path).toBe('n.png');
    expect(manifest.contactSheetPath).toBe('contact-sheet.png');
    expect(isAbsolute(result.frames[0]!.path)).toBe(true);
    expect(isAbsolute(result.contactSheetPath)).toBe(true);
    await expect(
      service.render(
        { ...assetFixture(), renderProfiles: [] },
        'revision.cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      ),
    ).rejects.toThrow(/does not declare a render profile/);
  });

  it('persists exported GLB bytes and rejects invalid artifact identities', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-export-'));
    const glb = glbBytes();
    const fakePage = {
      evaluate: async () => ({
        bytes: [...glb],
        manifest: {
          format: 'glb',
          assetId: 'attacker',
          revisionId: `revision.${'f'.repeat(64)}`,
          glbPath: '../../../../escape.glb',
        },
      }),
    } as unknown as Page;
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      pageRunner: (callback) => callback(fakePage),
    });
    const document = assetFixture();
    const revisionId = contentRevisionId(document);
    const result = (await service.export(document, revisionId)) as {
      glbPath: string;
      manifestPath: string;
    };

    expect(await readFile(result.glbPath)).toEqual(glb);
    const manifest = JSON.parse(
      await readFile(result.manifestPath, 'utf8'),
    ) as { glbPath: string };
    expect(manifest).toMatchObject({
      assetId: 'asset.hero',
      revisionId,
      format: 'glb',
      glbPath: 'asset.hero.glb',
    });
    expect(isAbsolute(result.glbPath)).toBe(true);
    await expect(service.render(document, 'invalid-revision')).rejects.toThrow(
      /Invalid artifact identity/,
    );
  });

  it('preserves an accepted immutable index after a differing same-revision rerender', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-rerender-'));
    const base = assetFixture();
    const document = {
      ...base,
      renderProfiles: [
        {
          ...base.renderProfiles[0]!,
          id: 'fantasy.sprite.orthographic.v1',
        },
      ],
    };
    const revisionId = contentRevisionId(document);
    let response: unknown;
    const fakePage = {
      evaluate: async () => response,
    } as unknown as Page;
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      pageRunner: (callback) => callback(fakePage),
    });
    const firstPng = pngBytes(1);
    response = {
      frames: DIRECTIONS.map((direction) => ({
        direction,
        dataUrl: `data:image/png;base64,${firstPng.toString('base64')}`,
        metrics: {},
      })),
      contactSheetDataUrl: `data:image/png;base64,${firstPng.toString('base64')}`,
    };
    await service.render(document, revisionId);
    response = { bytes: [...glbBytes()], manifest: { format: 'glb' } };
    await service.export(document, revisionId);
    const accepted = await service.getManifest({
      assetId: document.id,
      revisionId,
    });

    const changedPng = pngBytes(2);
    response = {
      frames: DIRECTIONS.map((direction) => ({
        direction,
        dataUrl: `data:image/png;base64,${changedPng.toString('base64')}`,
        metrics: {},
      })),
      contactSheetDataUrl: `data:image/png;base64,${changedPng.toString('base64')}`,
    };
    await expect(service.render(document, revisionId)).rejects.toThrow(
      /immutable revision artifact/i,
    );
    await expect(
      service.getManifest({ assetId: document.id, revisionId }),
    ).resolves.toEqual(accepted);
    const framePath = join(
      workspaceRoot,
      'artifacts/reference',
      document.id,
      revisionId,
      'n.png',
    );
    await expect(readFile(framePath)).resolves.toEqual(firstPng);
  });

  it('keeps an existing static interchange manifest byte-identical after authoring comparison delivery', async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-authoring-boundary-'),
    );
    const base = assetFixture();
    const document = {
      ...base,
      renderProfiles: [
        {
          ...base.renderProfiles[0]!,
          id: 'fantasy.sprite.orthographic.v1',
        },
      ],
    };
    const revisionId = contentRevisionId(document);
    let response: unknown;
    const fakePage = {
      evaluate: async () => response,
    } as unknown as Page;
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      outputDirectory: 'artifacts',
      pageRunner: (callback) => callback(fakePage),
    });
    const staticPng = pngBytes(4);
    response = {
      frames: DIRECTIONS.map((direction) => ({
        direction,
        dataUrl: `data:image/png;base64,${staticPng.toString('base64')}`,
        metrics: {},
      })),
      contactSheetDataUrl: `data:image/png;base64,${staticPng.toString('base64')}`,
    };
    await service.render(document, revisionId);
    response = { bytes: [...glbBytes()], manifest: { format: 'glb' } };
    await service.export(document, revisionId);
    const staticManifestPath = join(
      workspaceRoot,
      'artifacts',
      document.id,
      revisionId,
      'interchange-manifest.json',
    );
    const before = await readFile(staticManifestPath);
    const acceptedBefore = await parseForgeAssetInterchangeManifest(
      await service.getManifest({
        assetId: document.id,
        revisionId,
      }),
    );

    const views = ['front', 'three-quarter', 'side', 'back'] as const;
    response = {
      frames: views.map((view, index) => ({
        view,
        metrics: {},
        dataUrl: `data:image/png;base64,${opaquePngBytes(
          512,
          512,
          index + 1,
        ).toString('base64')}`,
      })),
      contactSheetDataUrl: `data:image/png;base64,${opaquePngBytes(
        2048,
        530,
        9,
      ).toString('base64')}`,
    };
    const receipt = (await service.renderReferenceComparison(
      document,
      revisionId,
    )) as { deliveryId: string };
    const after = await readFile(staticManifestPath);
    expect(after).toEqual(before);
    await expect(
      service.getManifest({ assetId: document.id, revisionId }),
    ).resolves.toEqual(acceptedBefore);
    const acceptedText = after.toString('utf8');
    expect(acceptedText).not.toContain('artifacts/authoring/');
    expect(
      [...acceptedBefore.artifacts, ...acceptedBefore.evidence].some(
        ({ reference }) => reference.includes('/authoring/'),
      ),
    ).toBe(false);

    const authoring = await service.getDeliveryManifest({
      assetId: document.id,
      revisionId,
      deliveryId: receipt.deliveryId,
    });
    expect(authoring).toMatchObject({
      classification: 'authoring_only',
      admission: {
        review_only: true,
        interchange_admitted: false,
        pack_admitted: false,
      },
    });
    const first = (
      authoring as {
        artifacts: Array<{ id: string; byte_length: number }>;
      }
    ).artifacts[0]!;
    await expect(
      service.getDeliveryArtifactChunk({
        assetId: document.id,
        revisionId,
        deliveryId: receipt.deliveryId,
        artifactId: first.id,
        recordKind: 'evidence',
        offset: 0,
        length: Math.min(32, first.byte_length),
      }),
    ).resolves.toMatchObject({ record_kind: 'evidence' });
    await expect(
      service.getDeliveryArtifactChunk({
        assetId: document.id,
        revisionId,
        deliveryId: receipt.deliveryId,
        artifactId: first.id,
        recordKind: 'artifact',
        offset: 0,
        length: 1,
      }),
    ).rejects.toThrow(/evidence only/i);
  }, 15_000);
});
