import { describe, expect, it } from 'vitest';

import {
  assertRenderArtifactAcceptance,
  validateRenderArtifactAcceptance,
} from '../../src/validation/index.js';

const profile = {
  directions: 1 as const,
  minimumFeaturePixels: 3,
  requiredFeaturePartIds: ['torso'],
};
const validFrame = {
  direction: 'S',
  metrics: {
    occupiedPixelCount: 20,
    transparentPixelCount: 80,
    clippedEdges: [],
    groundAnchorDeviationPixels: 0,
    requiredFeatureEvidence: [
      {
        partId: 'torso',
        silhouetteWidthPixels: 3,
        minimumPixels: 3,
        passes: true,
      },
    ],
  },
};

describe('render artifact acceptance', () => {
  it('accepts a complete frame that satisfies every pixel contract', () => {
    expect(
      validateRenderArtifactAcceptance({ frames: [validFrame] }, profile),
    ).toEqual([]);
    expect(() =>
      assertRenderArtifactAcceptance({ frames: [validFrame] }, profile, 'ok'),
    ).not.toThrow();
  });

  it('reports every reference-blocking pixel failure', () => {
    const issues = validateRenderArtifactAcceptance(
      {
        frames: [
          {
            direction: 'S',
            metrics: {
              occupiedPixelCount: 0,
              transparentPixelCount: 0,
              clippedEdges: ['left'],
              groundAnchorDeviationPixels: 2,
              requiredFeatureEvidence: [
                {
                  partId: 'torso',
                  silhouetteWidthPixels: 2,
                  minimumPixels: 3,
                  passes: false,
                },
              ],
            },
          },
        ],
      },
      profile,
    );
    expect(issues).toEqual([
      'S: frame is empty',
      'S: frame has no transparent pixels',
      'S: frame is clipped',
      'S: ground anchor deviation must be zero',
      'S: required feature torso must be at least 3px',
    ]);
    expect(() =>
      assertRenderArtifactAcceptance(
        { frames: [{ direction: 'S', metrics: {} }] },
        profile,
        'broken',
      ),
    ).toThrow(/broken failed pixel acceptance/);
  });

  it('requires exactly one passing evidence entry per named feature', () => {
    const issues = validateRenderArtifactAcceptance(
      {
        frames: [
          {
            ...validFrame,
            metrics: {
              ...validFrame.metrics,
              requiredFeatureEvidence: [
                {
                  partId: 'torso',
                  silhouetteWidthPixels: 3,
                  minimumPixels: 3,
                  passes: true,
                },
                {
                  partId: 'torso',
                  silhouetteWidthPixels: 3,
                  minimumPixels: 3,
                  passes: true,
                },
                {
                  partId: 'cape',
                  silhouetteWidthPixels: 3,
                  minimumPixels: 3,
                  passes: true,
                },
              ],
            },
          },
        ],
      },
      { ...profile, requiredFeaturePartIds: ['torso', 'head'] },
    );
    expect(issues).toEqual([
      'S: required feature evidence duplicates torso',
      'S: required feature evidence includes unexpected cape',
      'S: required feature evidence is missing head',
    ]);
  });

  it('rejects malformed results and an incomplete direction set', () => {
    expect(validateRenderArtifactAcceptance({}, profile)).toEqual([
      'render result must contain a frames array',
    ]);
    expect(validateRenderArtifactAcceptance({ frames: [] }, profile)).toEqual([
      'expected 1 frames but received 0',
    ]);
  });
});
