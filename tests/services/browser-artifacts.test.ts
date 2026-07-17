import { mkdtemp, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
});
