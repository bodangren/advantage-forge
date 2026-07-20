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

  const revisionLabel = page.locator('#revision-label');
  await expect(revisionLabel).toHaveText(/^revision\.[a-f0-9]{64}$/);
  const initialRevision = await revisionLabel.textContent();

  await page.getByLabel('Selected semantic part').selectOption('torso');
  await expect(page.getByText(/shoulder\.left.*anatomy\.mount/)).toBeVisible();
  const shoulderPortVisible = await page.evaluate(
    () =>
      (
        window as unknown as {
          fantasyAssetForge: {
            scene: { getObjectByName: (name: string) => unknown };
          };
        }
      ).fantasyAssetForge.scene.getObjectByName('port:torso:shoulder.left') !==
      undefined,
  );
  expect(shoulderPortVisible).toBe(true);

  const injectedName = '<img id="inspector-injection" src="x">';
  await page.evaluate((name) => {
    const forge = (
      window as unknown as {
        fantasyAssetForge: {
          document: Record<string, unknown>;
          loadDocument: (asset: Record<string, unknown>) => void;
        };
      }
    ).fantasyAssetForge;
    forge.loadDocument({ ...forge.document, name });
  }, injectedName);
  await expect(page.locator('#inspector-injection')).toHaveCount(0);
  await expect(page.getByText(injectedName, { exact: true })).toBeVisible();
  await expect(revisionLabel).toHaveText(/^revision\.[a-f0-9]{64}$/);
  await expect
    .poll(() => revisionLabel.textContent())
    .not.toBe(initialRevision);
  await page.evaluate(() => {
    (
      window as unknown as {
        fantasyAssetForge: { selectAsset: (name: 'adventurer') => void };
      }
    ).fantasyAssetForge.selectAsset('adventurer');
  });
  await expect(
    page.locator('#viewport-overlay').getByText('Rustic Adventurer', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(injectedName, { exact: true })).toHaveCount(0);

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
              requiredFeatureEvidence: readonly {
                partId: string;
                silhouetteWidthPixels: number | null;
                minimumPixels: number;
                passes: boolean;
              }[];
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
  expect(
    frameEvidence.every(
      ({ requiredFeatureEvidence }) =>
        requiredFeatureEvidence.length > 0 &&
        requiredFeatureEvidence.every(
          ({ silhouetteWidthPixels, minimumPixels, passes }) =>
            passes &&
            silhouetteWidthPixels !== null &&
            silhouetteWidthPixels >= minimumPixels,
        ),
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
  await expect(page.locator('#viewport-overlay')).toBeHidden();
  await expect(page.locator('.contact-frame')).toHaveCount(8);
  const contactLayout = await page
    .locator('.contact-frame')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
        };
      }),
    );
  expect(
    contactLayout.every(({ width, height }) => width >= 96 && height >= 128),
  ).toBe(true);
  expect(new Set(contactLayout.map(({ x }) => x)).size).toBe(4);
  expect(new Set(contactLayout.map(({ y }) => y)).size).toBe(2);
  await page.screenshot({
    path: 'test-results/adventurer-contact-sheet.png',
  });
  await page.getByRole('button', { name: 'Actual 128px' }).click();
  await expect(page.locator('.contact-frame canvas').first()).toHaveAttribute(
    'width',
    '128',
  );
  const actualFrameBox = await page
    .locator('.contact-frame canvas')
    .first()
    .boundingBox();
  expect(actualFrameBox).not.toBeNull();
  expect(actualFrameBox?.width).toBe(128);
  expect(actualFrameBox?.height).toBe(128);

  await expect(page.getByLabel('Selected pose')).toHaveValue('idle');
  await expect(page.getByLabel('Selected variant')).toHaveValue('equipped');
  await page.getByLabel('Selected pose').selectOption('action');
  await page.getByLabel('Selected variant').selectOption('unequipped');
  await page.getByRole('button', { name: 'Compare' }).click();
  await expect(page.locator('.contact-sheet.comparison')).toBeVisible();
  await expect(page.locator('.contact-frame')).toHaveCount(16);
  await expect(
    page
      .locator('.contact-frame')
      .first()
      .getByText(/action · equipped/),
  ).toBeVisible();
  await expect(
    page
      .locator('.contact-frame')
      .nth(8)
      .getByText(/action · unequipped/),
  ).toBeVisible();

  await page.getByRole('button', { name: /Timber Cottage/ }).click();
  await page.waitForFunction(
    () =>
      (window as unknown as { fantasyAssetForge: { selected: string } })
        .fantasyAssetForge.selected === 'cottage',
  );
  await expect(page.getByText('cottage.rustic', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Selected pose')).toBeDisabled();
  await expect(page.getByLabel('Selected variant')).toBeDisabled();
  await expect(page.locator('.contact-frame')).toHaveCount(8);
  await page.getByLabel('Selected semantic part').selectOption('wall.front');
  await expect(page.getByLabel('Selected semantic part')).toHaveValue(
    'wall.front',
  );
  await expect(page.getByText('stone.lime', { exact: true })).toBeVisible();

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
