import { readFile, readdir } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);

async function text(path: string): Promise<string> {
  return readFile(new URL(path, root), 'utf8');
}

describe('reference build portability contract', () => {
  it('keeps every committed reference manifest checkout-independent', async () => {
    const artifactRoot = new URL('artifacts/reference/', root);
    const paths = (await readdir(artifactRoot, { recursive: true })).filter(
      (path) =>
        path.endsWith('/render-manifest.json') ||
        path.endsWith('/glb-manifest.json'),
    );
    expect(paths).toHaveLength(20);
    for (const path of paths) {
      const manifest = JSON.parse(
        await readFile(new URL(path, artifactRoot), 'utf8'),
      ) as {
        contactSheetPath?: string;
        frames?: { path: string }[];
        glbPath?: string;
      };
      for (const value of [
        manifest.contactSheetPath,
        manifest.glbPath,
        ...(manifest.frames?.map((frame) => frame.path) ?? []),
      ].filter((value): value is string => value !== undefined))
        expect(isAbsolute(value), `${path}: ${value}`).toBe(false);
    }
  });

  it('normalizes checkout paths recursively and rejects outside roots', async () => {
    const { portableEvidence } =
      await import('../../scripts/reference-evidence.js');
    const workspaceRoot = '/tmp/clone-a';
    expect(
      portableEvidence(
        {
          manifestPath: join(workspaceRoot, 'artifacts/reference/render.json'),
          nested: [{ glbPath: join(workspaceRoot, 'artifacts/a.glb') }],
        },
        workspaceRoot,
      ),
    ).toEqual({
      manifestPath: 'artifacts/reference/render.json',
      nested: [{ glbPath: 'artifacts/a.glb' }],
    });
    expect(() =>
      portableEvidence({ path: '/tmp/outside/file.glb' }, workspaceRoot),
    ).toThrow(/outside the workspace/);
  });

  it('routes deterministic build and browser evidence to the archive', async () => {
    const [buildScript, browserTest, readme, index] = await Promise.all([
      text('scripts/build-references.ts'),
      text('tests/browser/inspector.spec.ts'),
      text('README.md'),
      text('measure/index.md'),
    ]);
    const archiveDossier =
      'measure/archive/fantasy_asset_mvp_20260717/reference-build.json';
    const archiveScreenshot =
      'measure/archive/fantasy_asset_mvp_20260717/adventurer-contact-sheet.png';

    expect(buildScript).toContain(archiveDossier);
    expect(buildScript).not.toContain(
      'measure/tracks/fantasy_asset_mvp_20260717',
    );
    expect(buildScript).not.toContain('generatedAt:');
    expect(browserTest).toContain(archiveScreenshot);
    expect(browserTest).not.toContain(
      'measure/tracks/fantasy_asset_mvp_20260717',
    );
    expect(readme).toContain(archiveDossier);
    expect(index).toContain(
      './archive/fantasy_asset_mvp_20260717/reference-build.json',
    );
  });
});
