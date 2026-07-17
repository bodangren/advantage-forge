import { expect, test } from '@playwright/test';
import type { GlbManifest } from '../../src/export/index.js';

test('inspector renders semantic assets, transparent sprites, and valid GLB evidence', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByText('Fantasy Asset Forge')).toBeVisible();
  await expect(page.getByLabel('Interactive 3D asset preview')).toBeVisible();
  await expect(
    page
      .getByLabel('Asset workspace')
      .getByText('Rustic Adventurer', { exact: true }),
  ).toBeVisible();
  await page.waitForFunction(
    () => document.querySelectorAll('.contact-frame').length === 8,
  );

  const frameEvidence = await page.evaluate(() => {
    const forge = (
      window as unknown as {
        fantasyAssetForge: {
          frames: readonly {
            metrics: {
              transparentPixelCount: number;
              occupiedPixelCount: number;
              clippedEdges: readonly string[];
              groundAnchorDeviationPixels: number | null;
              representativeFeaturePixels: number | null;
            };
          }[];
        };
      }
    ).fantasyAssetForge;
    return forge.frames.map(({ metrics }) => metrics);
  });
  expect(frameEvidence).toHaveLength(8);
  expect(
    frameEvidence.every(
      ({ transparentPixelCount }) => transparentPixelCount > 0,
    ),
  ).toBe(true);
  expect(
    frameEvidence.every(({ occupiedPixelCount }) => occupiedPixelCount > 0),
  ).toBe(true);
  expect(
    frameEvidence.every(({ clippedEdges }) => clippedEdges.length === 0),
  ).toBe(true);

  expect(
    frameEvidence.every(
      ({ groundAnchorDeviationPixels }) =>
        groundAnchorDeviationPixels !== null &&
        Math.abs(groundAnchorDeviationPixels) <= 1,
    ),
  ).toBe(true);
  expect(
    frameEvidence.every(
      ({ representativeFeaturePixels }) =>
        representativeFeaturePixels !== null &&
        representativeFeaturePixels >= 3,
    ),
  ).toBe(true);
  const directionCounts = await page.evaluate(() => {
    const forge = (
      window as unknown as {
        fantasyAssetForge: {
          renderDirections: (count: 1 | 4 | 8) => readonly unknown[];
        };
      }
    ).fantasyAssetForge;
    return ([1, 4, 8] as const).map(
      (count) => forge.renderDirections(count).length,
    );
  });
  expect(directionCounts).toEqual([1, 4, 8]);

  await page.getByRole('button', { name: 'Contact Sheet' }).click();
  await expect(page.getByLabel('Eight direction contact sheet')).toBeVisible();
  await page.screenshot({
    path: 'measure/tracks/fantasy_asset_mvp_20260717/adventurer-contact-sheet.png',
  });
  await page.getByRole('button', { name: 'Actual 128px' }).click();
  await expect(page.locator('.contact-frame canvas').first()).toHaveAttribute(
    'width',
    '128',
  );

  await page.getByRole('button', { name: /Timber Cottage/ }).click();
  await page.waitForFunction(
    () =>
      (window as unknown as { fantasyAssetForge: { selected: string } })
        .fantasyAssetForge.selected === 'cottage',
  );
  await expect(page.getByText('cottage.rustic', { exact: true })).toBeVisible();
  await page.getByLabel('Selected semantic part').selectOption('wall.front');
  await expect(page.getByLabel('Selected semantic part')).toHaveValue(
    'wall.front',
  );
  await expect(page.getByText('stone.lime', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Compare' }).click();
  await expect(page.locator('.contact-sheet.comparison')).toBeVisible();
  await expect(page.locator('.contact-frame')).toHaveCount(16);

  const glb = await page.evaluate(async () => {
    const forge = (
      window as unknown as {
        fantasyAssetForge: {
          exportGlb: () => Promise<{ manifest: GlbManifest }>;
        };
      }
    ).fantasyAssetForge;
    return (await forge.exportGlb()).manifest;
  });
  expect(glb).toMatchObject({ format: 'glb', unit: 'meter' });
  expect(glb.byteLength).toBeGreaterThan(1_000);
  expect(glb.nodeNames).toContain('cottage.rustic');
  expect(glb.nodeNames).toContain('roof.main');
  expect(glb.reloadNodeNames).toContain('cottage.rustic');
  expect(glb.reloadNodeNames).toContain('roof.main');
  expect(glb.animationCount).toBe(0);
  expect(glb.materialNames.length).toBeGreaterThan(0);
  expect(glb.reloadMaterialNames).toEqual(glb.materialNames);
  expect(glb.materialNamesMatch).toBe(true);
  expect(glb.semanticNodeCount).toBeGreaterThan(0);
  expect(glb.reloadSemanticNodeCount).toBe(glb.semanticNodeCount);
  expect(glb.missingSemanticNodeNames).toEqual([]);
  expect(glb.unexpectedSemanticNodeNames).toEqual([]);
  expect(glb.transformMismatchCount).toBe(0);
  expect(glb.scaleMismatchCount).toBe(0);
  expect(glb.maximumPositionDeviation).toBeLessThanOrEqual(
    glb.transformTolerance,
  );
  expect(glb.maximumRotationDeviationRadians).toBeLessThanOrEqual(
    glb.transformTolerance,
  );
  expect(glb.maximumScaleDeviation).toBeLessThanOrEqual(glb.transformTolerance);
  expect(glb.bounds.matches).toBe(true);
  expect(glb.bounds.maximumDeviation).toBeLessThanOrEqual(glb.bounds.tolerance);
  expect(glb.unitScaleDeviation).toBeLessThanOrEqual(glb.unitScaleTolerance);
  expect(glb.textureCount).toBe(0);
  expect(glb.unsupportedMaterialCount).toBe(0);
  expect(glb.unsupportedShaderCount).toBe(0);
  expect(glb.skinCount).toBe(0);
  expect(glb.cameraCount).toBe(0);
  expect(glb.lightCount).toBe(0);
  expect(consoleErrors).toEqual([]);
});
