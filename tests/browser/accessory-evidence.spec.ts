import { expect, test } from '@playwright/test';

const DIRECTION_ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

interface BrowserFeatureEvidence {
  readonly featureId: string;
  readonly partId: string;
  readonly templateId: string;
  readonly silhouetteWidthPixels: number | null;
  readonly minimumPixels: number;
  readonly minimumPixelArea: number;
  readonly isolatedPixelArea: number;
  readonly visiblePixelArea: number;
  readonly occlusionRatio: number;
  readonly maximumOcclusionRatio: number;
  readonly materialOklabDistance: number;
  readonly minimumOklabDistance: number;
  readonly passes: boolean;
}

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
              occupiedBounds: {
                height: number;
              } | null;
              framingEvidence: {
                heightDeviationPixels: number;
              };
              requiredFeatureEvidence: readonly BrowserFeatureEvidence[];
            };
          }[];
        };
      }
    ).fantasyAssetForge;
    return forge.frames.map(({ direction, metrics }) => ({
      direction,
      evidence: metrics.requiredFeatureEvidence,
      occupiedHeight: metrics.occupiedBounds?.height ?? null,
      heightDeviationPixels: metrics.framingEvidence.heightDeviationPixels,
    }));
  });

  expect(frames.map(({ direction }) => direction)).toEqual(DIRECTION_ORDER);
  const occupiedHeights = frames
    .map(({ occupiedHeight }) => occupiedHeight)
    .filter((height): height is number => height !== null)
    .sort((left, right) => left - right);
  const referenceHeight =
    occupiedHeights[Math.floor(occupiedHeights.length / 2)]!;
  for (const {
    direction,
    evidence,
    occupiedHeight,
    heightDeviationPixels,
  } of frames) {
    expect(occupiedHeight, direction).not.toBeNull();
    expect(heightDeviationPixels, direction).toBe(
      Math.abs(occupiedHeight! - referenceHeight),
    );
    expect(evidence.length, direction).toBeGreaterThan(0);
    for (const feature of evidence) {
      expect(feature, direction).toMatchObject({
        featureId: expect.any(String),
        partId: expect.any(String),
        templateId: expect.any(String),
        minimumPixels: expect.any(Number),
        minimumPixelArea: expect.any(Number),
        isolatedPixelArea: expect.any(Number),
        visiblePixelArea: expect.any(Number),
        occlusionRatio: expect.any(Number),
        maximumOcclusionRatio: expect.any(Number),
        materialOklabDistance: expect.any(Number),
        minimumOklabDistance: expect.any(Number),
        passes: expect.any(Boolean),
      });
      expect(feature.passes, direction).toBe(
        typeof feature.silhouetteWidthPixels === 'number' &&
          feature.silhouetteWidthPixels >= feature.minimumPixels &&
          feature.visiblePixelArea >= feature.minimumPixelArea &&
          feature.occlusionRatio <= feature.maximumOcclusionRatio &&
          feature.materialOklabDistance >= feature.minimumOklabDistance,
      );
    }
  }
});
