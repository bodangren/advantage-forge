import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const verifierPath = new URL(
  '../../.agents/skills/fantasy-asset-workflow/scripts/inspect-glb.mjs',
  import.meta.url,
);
const revisionId =
  'revision.453647cfe7d1b945148666d971c21975926f2348ff00704d0d1faacdd431d3e6';
const manifestPath = new URL(
  `../../artifacts/reference/crate.rustic/${revisionId}/glb-manifest.json`,
  import.meta.url,
);

describe('representative GLTFLoader importer', () => {
  it('reports identity, orientation, bounds, nodes, materials, and unsupported content', async () => {
    const { stdout } = await execFileAsync(process.execPath, [
      verifierPath.pathname,
      '--glb-manifest',
      manifestPath.pathname,
      '--expected-asset',
      'crate.rustic',
      '--expected-revision',
      revisionId,
    ]);
    const report = JSON.parse(stdout) as {
      ok: boolean;
      assetId: string;
      revisionId: string;
      up: number[];
      bounds: {
        min: number[];
        max: number[];
        groundY: number;
        matchesManifest: boolean;
      };
      nodeNames: string[];
      materialNames: string[];
      duplicateNodeNames: string[];
      cameraCount: number;
      lightCount: number;
      skinCount: number;
      textureCount: number;
      animationCount: number;
      errors: string[];
      byteLength: number;
      sha256: string;
    };

    expect(report).toMatchObject({
      ok: true,
      assetId: 'crate.rustic',
      revisionId,
      up: [0, 1, 0],
      duplicateNodeNames: [],
      cameraCount: 0,
      lightCount: 0,
      skinCount: 0,
      textureCount: 0,
      animationCount: 0,
      errors: [],
    });
    expect(report.bounds.matchesManifest).toBe(true);
    expect(report.bounds.groundY).toBeCloseTo(-0.02, 6);
    expect(report.bounds.max[1]).toBeGreaterThan(report.bounds.min[1]!);
    expect(report.nodeNames.length).toBeGreaterThan(0);
    expect(report.materialNames.length).toBeGreaterThan(0);
    expect(report.byteLength).toBeGreaterThan(12);
    expect(report.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
