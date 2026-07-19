import { expect, test } from '@playwright/test';

const DIRECTION_ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

test('native frames expose ordered accessory visibility and material evidence', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(
    () =>
      (
        window as unknown as {
          fantasyAssetForge?: { frames: readonly unknown[] };
        }
      ).fantasyAssetForge?.frames.length === 8,
  );

  const frames = await page.evaluate(() => {
    const forge = (
      window as unknown as {
        fantasyAssetForge: {
          frames: readonly {
            direction: string;
            metrics: {
              requiredFeatureEvidence: readonly Record<string, unknown>[];
            };
          }[];
        };
      }
    ).fantasyAssetForge;
    return forge.frames.map(({ direction, metrics }) => ({
      direction,
      evidence: metrics.requiredFeatureEvidence,
    }));
  });

  expect(frames.map(({ direction }) => direction)).toEqual(DIRECTION_ORDER);
  for (const { direction, evidence } of frames) {
    expect(evidence.length, direction).toBeGreaterThan(0);
    for (const feature of evidence) {
      expect(feature, direction).toMatchObject({
        featureId: expect.any(String),
        partId: expect.any(String),
        templateId: expect.any(String),
        isolatedPixelArea: expect.any(Number),
        visiblePixelArea: expect.any(Number),
        occlusionRatio: expect.any(Number),
        materialOklabDistance: expect.any(Number),
      });
    }
  }
});
