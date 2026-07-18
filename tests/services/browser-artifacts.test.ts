import { mkdtemp, readFile, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import type { Page } from '@playwright/test';
import { assetFixture } from '../document/fixture.js';
import { describe, expect, it } from 'vitest';
import { LocalBrowserArtifactService } from '../../src/services/index.js';

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

  it('persists render frames and a revision manifest through an injected page runner', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-render-'));
    const dataUrl = `data:image/png;base64,${Buffer.from('PNG').toString('base64')}`;
    const fakePage = {
      evaluate: async () => ({
        frames: [
          {
            direction: 'S',
            dataUrl,
            metrics: { occupiedPixelCount: 1 },
          },
        ],
        contactSheetDataUrl: dataUrl,
      }),
    } as unknown as Page;
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      outputDirectory: 'artifacts',
      pageRunner: (callback) => callback(fakePage),
    });
    const result = (await service.render(
      assetFixture(),
      'revision.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    )) as {
      manifestPath: string;
      contactSheetPath: string;
      frames: { path: string }[];
    };

    expect(await readFile(result.frames[0]!.path, 'utf8')).toBe('PNG');
    expect(await readFile(result.contactSheetPath, 'utf8')).toBe('PNG');
    const manifest = JSON.parse(
      await readFile(result.manifestPath, 'utf8'),
    ) as {
      contactSheetPath: string;
      frames: { path: string }[];
    };
    expect(manifest).toMatchObject({
      assetId: 'asset.hero',
      revisionId:
        'revision.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      frames: [{ direction: 'S' }],
    });
    expect(manifest.frames[0]!.path).toBe('s.png');
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
    const fakePage = {
      evaluate: async () => ({
        bytes: [1, 2, 3],
        manifest: { format: 'glb' },
      }),
    } as unknown as Page;
    const service = new LocalBrowserArtifactService({
      workspaceRoot,
      pageRunner: (callback) => callback(fakePage),
    });
    const document = assetFixture();
    const result = (await service.export(
      document,
      'revision.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    )) as { glbPath: string; manifestPath: string };

    expect([...new Uint8Array(await readFile(result.glbPath))]).toEqual([
      1, 2, 3,
    ]);
    const manifest = JSON.parse(
      await readFile(result.manifestPath, 'utf8'),
    ) as { glbPath: string };
    expect(manifest).toMatchObject({
      assetId: 'asset.hero',
      format: 'glb',
      glbPath: 'asset.hero.glb',
    });
    expect(isAbsolute(result.glbPath)).toBe(true);
    await expect(service.render(document, 'invalid-revision')).rejects.toThrow(
      /Invalid artifact identity/,
    );
  });
});
