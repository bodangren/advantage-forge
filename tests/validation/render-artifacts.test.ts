import { describe, expect, it } from 'vitest';

import {
  assertRenderArtifactAcceptance,
  validateRenderArtifactAcceptance,
} from '../../src/validation/index.js';
import { getRusticAccessoryLoadout } from '../../src/fantasy-kit/index.js';

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

const directionOrder = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function passingFrame(direction: (typeof directionOrder)[number]) {
  return {
    ...validFrame,
    direction,
  };
}

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

describe('S4 accessory render acceptance', () => {
  const guard = getRusticAccessoryLoadout('guard');
  const helmet = guard.accessories.find(
    ({ templateId }) => templateId === 'equipment.helmet.iron',
  )!;
  const helmetCrown = helmet.requiredFeatures[0]!;
  const accessoryProfile = {
    directions: 8 as const,
    minimumFeaturePixels: helmetCrown.minimumWidthPixels,
    requiredFeaturePartIds: [helmet.partId],
    directionOrder: guard.framing.directionOrder,
    requiredAccessoryFeatures: [helmetCrown],
    framing: guard.framing,
  };

  function accessoryFrame(
    direction: (typeof directionOrder)[number],
    evidence: Record<string, unknown> = {},
    framing: Record<string, unknown> = {},
  ) {
    return {
      direction,
      metrics: {
        occupiedPixelCount: 200,
        transparentPixelCount: 16_184,
        clippedEdges: [],
        groundAnchorDeviationPixels: 0,
        framingEvidence: {
          topMarginPixels: guard.framing.minimumTopMarginPixels,
          centerDeviationPixels: 0,
          heightDeviationPixels: 0,
          ...framing,
        },
        requiredFeatureEvidence: [
          {
            partId: helmet.partId,
            templateId: helmet.templateId,
            featureId: helmetCrown.id,
            silhouetteWidthPixels: helmetCrown.minimumWidthPixels,
            minimumPixels: helmetCrown.minimumWidthPixels,
            isolatedPixelArea: helmetCrown.minimumPixelArea * 2,
            visiblePixelArea: helmetCrown.minimumPixelArea,
            occlusionRatio: 0.5,
            materialOklabDistance: helmetCrown.minimumOklabDistance,
            passes: true,
            ...evidence,
          },
        ],
      },
    };
  }

  it('rejects duplicate or reordered directions even when eight frames exist', () => {
    const frames = directionOrder.map(passingFrame);
    frames[1] = passingFrame('E');
    frames[2] = passingFrame('NE');

    expect(
      validateRenderArtifactAcceptance(
        { frames },
        {
          directions: 8,
          minimumFeaturePixels: 3,
          requiredFeaturePartIds: ['torso'],
          directionOrder,
        },
      ),
    ).toEqual([
      'frame directions must be exactly N, NE, E, SE, S, SW, W, NW; received N, E, NE, SE, S, SW, W, NW',
    ]);
  });

  it('requires exact feature and template identity rather than part-only evidence', () => {
    const frames = directionOrder.map((direction) =>
      accessoryFrame(direction, {
        templateId: 'equipment.hood.cloth',
        featureId: 'hood-outline',
      }),
    );

    expect(
      validateRenderArtifactAcceptance({ frames }, accessoryProfile),
    ).toEqual(
      directionOrder.flatMap((direction) => [
        `${direction}: required feature ${helmetCrown.id} must identify template ${helmet.templateId}`,
        `${direction}: required feature ${helmetCrown.id} evidence is missing`,
      ]),
    );
  });

  it('rejects hidden, occluded, materially merged, or unstably framed accessories', () => {
    const frames = directionOrder.map((direction) =>
      accessoryFrame(
        direction,
        {
          isolatedPixelArea: helmetCrown.minimumPixelArea * 2,
          visiblePixelArea: helmetCrown.minimumPixelArea - 1,
          occlusionRatio: helmetCrown.maximumOcclusionRatio + 0.01,
          materialOklabDistance: helmetCrown.minimumOklabDistance - 0.01,
        },
        {
          topMarginPixels: guard.framing.minimumTopMarginPixels - 1,
          centerDeviationPixels: guard.framing.maximumCenterDeviationPixels + 1,
          heightDeviationPixels: guard.framing.maximumHeightDeviationPixels + 1,
        },
      ),
    );

    expect(
      validateRenderArtifactAcceptance({ frames }, accessoryProfile),
    ).toEqual(
      directionOrder.flatMap((direction) => [
        `${direction}: required feature ${helmetCrown.id} visible area must be at least ${helmetCrown.minimumPixelArea}px`,
        `${direction}: required feature ${helmetCrown.id} occlusion ratio must be at most ${helmetCrown.maximumOcclusionRatio}`,
        `${direction}: required feature ${helmetCrown.id} OKLab distance must be at least ${helmetCrown.minimumOklabDistance}`,
        `${direction}: top margin must be at least ${guard.framing.minimumTopMarginPixels}px`,
        `${direction}: center deviation must be at most ${guard.framing.maximumCenterDeviationPixels}px`,
        `${direction}: height deviation must be at most ${guard.framing.maximumHeightDeviationPixels}px`,
      ]),
    );
  });
});
