import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const verifier = new URL(
  '../../.agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs',
  import.meta.url,
);
const assetId = 'crate.rustic';
const revisionId = `revision.${'a'.repeat(64)}`;
const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function fakePng(width = 128, height = 128): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'artifact-verifier-'));
  for (const direction of directions)
    await writeFile(
      join(directory, `${direction.toLowerCase()}.png`),
      fakePng(),
    );
  await writeFile(join(directory, 'contact-sheet.png'), fakePng(512, 256));
  const glb = Buffer.alloc(12);
  glb.write('glTF', 0, 'ascii');
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(glb.length, 8);
  await writeFile(join(directory, `${assetId}.glb`), glb);

  const renderManifestPath = join(directory, 'render-manifest.json');
  const glbManifestPath = join(directory, 'glb-manifest.json');
  await writeFile(
    renderManifestPath,
    `${JSON.stringify({
      assetId,
      revisionId,
      width: 128,
      height: 128,
      directions: 8,
      transparent: true,
      frames: directions.map((direction) => ({
        direction,
        path: `${direction.toLowerCase()}.png`,
        metrics: { clippedEdges: [], groundAnchorDeviationPixels: 0 },
      })),
      contactSheetPath: 'contact-sheet.png',
    })}\n`,
  );
  await writeFile(
    glbManifestPath,
    `${JSON.stringify({
      assetId,
      revisionId,
      glbPath: `${assetId}.glb`,
      format: 'glb',
      byteLength: glb.length,
      unit: 'meter',
      materialNamesMatch: true,
      transformMismatchCount: 0,
      scaleMismatchCount: 0,
      bounds: { matches: true },
      textureCount: 0,
      unsupportedMaterialCount: 0,
      unsupportedShaderCount: 0,
      skinCount: 0,
      cameraCount: 0,
      lightCount: 0,
      animationCount: 0,
    })}\n`,
  );
  return { directory, renderManifestPath, glbManifestPath };
}

async function runVerifier(
  renderManifestPath: string,
  glbManifestPath: string,
) {
  return execFileAsync(process.execPath, [
    verifier.pathname,
    '--render-manifest',
    renderManifestPath,
    '--glb-manifest',
    glbManifestPath,
    '--expected-asset',
    assetId,
    '--expected-revision',
    revisionId,
  ]);
}

describe('workflow artifact verifier', () => {
  it('audits identity, native dimensions, directions, metrics, and GLB without writing', async () => {
    const { renderManifestPath, glbManifestPath } = await fixture();
    const { stdout } = await runVerifier(renderManifestPath, glbManifestPath);
    const report = JSON.parse(stdout) as {
      ok: boolean;
      files: Array<{ sha256: string }>;
    };

    expect(report.ok).toBe(true);
    expect(report.files).toHaveLength(10);
    expect(report.files.every(({ sha256 }) => sha256.length === 64)).toBe(true);
  });

  it('fails closed on wrong dimensions without altering the artifact', async () => {
    const { directory, renderManifestPath, glbManifestPath } = await fixture();
    const badFrame = join(directory, 'n.png');
    const original = fakePng(64, 128);
    await writeFile(badFrame, original);

    await expect(
      runVerifier(renderManifestPath, glbManifestPath),
    ).rejects.toMatchObject({ code: 1 });
    expect(
      await import('node:fs/promises').then(({ readFile }) =>
        readFile(badFrame),
      ),
    ).toEqual(original);
  });
});
